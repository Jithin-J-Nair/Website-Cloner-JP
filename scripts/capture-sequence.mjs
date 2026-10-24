#!/usr/bin/env node
/**
 * Deterministic scroll-sequence capture harness for visual review.
 *
 * Usage:
 *   node scripts/capture-sequence.mjs --base http://127.0.0.1:3000 --out docs/validation/lusion-fix/pass-1 --frames 81
 *
 * This harness records evidence; it does not declare visual fidelity. The current
 * renderer pipeline is reported exactly as exposed by window.__pipeline (or null).
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";

const args = Object.fromEntries(
  process.argv.slice(2).reduce((items, value, index, all) => {
    if (value.startsWith("--") && all[index + 1] && !all[index + 1].startsWith("--")) {
      items.push([value.slice(2), all[index + 1]]);
    }
    return items;
  }, [])
);
const base = args.base || process.env.RECON_URL || "http://127.0.0.1:3000";
const out = path.resolve(args.out || "docs/validation/lusion-fix/capture");
const width = Number(args.w || 1440);
const height = Number(args.h || 900);
const frames = Math.max(2, Number(args.frames || 81));
const timeout = Math.max(0, Number(args.settle || 650));

fs.mkdirSync(out, { recursive: true });

const browser = await chromium.launch({
  executablePath: await sparticuzChromium.executablePath(),
  headless: true,
  args: [
    ...sparticuzChromium.args,
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ],
});

const context = await browser.newContext({
  viewport: { width, height },
  deviceScaleFactor: 1,
  reducedMotion: "reduce",
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
const badResponses = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("response", (response) => {
  if (response.status() >= 400 && !response.url().includes("/non-existent")) {
    badResponses.push({ status: response.status(), url: response.url() });
  }
});

try {
  await page.goto(`${base}/?quality=high`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1500);
  const maxScroll = await page.evaluate(() => Math.max(0, document.documentElement.scrollHeight - innerHeight));
  const records = [];
  const capture = async (index, progress, pass) => {
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: "instant" }), Math.round(maxScroll * progress));
    await page.waitForTimeout(timeout);
    const diagnostics = await page.evaluate(() => {
      const canvases = [...document.querySelectorAll("canvas")].map((canvas) => {
        const rect = canvas.getBoundingClientRect();
        return {
          width: canvas.width,
          height: canvas.height,
          cssWidth: Math.round(rect.width),
          cssHeight: Math.round(rect.height),
          visible: rect.width > 0 && rect.height > 0 && rect.bottom > 0 && rect.top < innerHeight,
        };
      });
      return {
        scrollY: window.scrollY,
        scrollHeight: document.documentElement.scrollHeight,
        pipeline: window.__pipeline ?? null,
        canvasCount: canvases.length,
        canvases,
      };
    });
    const filename = `${pass}_${String(index).padStart(3, "0")}_p${String(Math.round(progress * 1000)).padStart(3, "0")}.png`;
    await page.screenshot({ path: path.join(out, filename), fullPage: false });
    records.push({ index, progress, pass, file: filename, ...diagnostics });
  };

  for (let index = 0; index < frames; index += 1) {
    await capture(index, index / (frames - 1), "forward");
  }
  for (let index = 0; index < frames; index += 1) {
    await capture(index, 1 - index / (frames - 1), "reverse");
  }

  const report = {
    generatedAt: new Date().toISOString(),
    base,
    viewport: { width, height },
    deviceScaleFactor: 1,
    requestedPipeline: "quality=high",
    renderingMode: "Chromium with @sparticuz/chromium SwiftShader flags; software rendering requested, actual renderer must be confirmed from runtime diagnostics",
    framesPerDirection: frames,
    consoleErrors,
    pageErrors,
    badResponses,
    captures: records,
  };
  fs.writeFileSync(path.join(out, "capture-report.json"), JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    out,
    frames: records.length,
    consoleErrors: consoleErrors.length,
    pageErrors: pageErrors.length,
    badResponses: badResponses.length,
    pipelineValues: [...new Set(records.map((record) => JSON.stringify(record.pipeline)))],
    note: "Screenshots are not visual proof until opened and compared against the matching official references.",
  }, null, 2));
} finally {
  await context.close();
  await browser.close();
}
