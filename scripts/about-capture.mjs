#!/usr/bin/env node
/**
 * Production-browser capture harness for the About scroll narrative.
 * Uses the repository's existing Playwright/Chromium runtime; no new dependencies.
 */
import fs from "node:fs";
import path from "node:path";
import { launchMotionBrowser } from "./lib/browser-runtime.mjs";

const base = process.env.ABOUT_CAPTURE_BASE || "http://127.0.0.1:3000";
const out = path.resolve(process.env.ABOUT_CAPTURE_OUT || "/tmp/about-shots");
const width = Number.parseInt(process.env.ABOUT_CAPTURE_WIDTH || "1440", 10);
const height = Number.parseInt(process.env.ABOUT_CAPTURE_HEIGHT || "900", 10);
const REFERENCE_DURATION_SECONDS = 42.233333;
const fractions = (process.env.ABOUT_CAPTURE_FRACTIONS || "0,0.06,0.14,0.24,0.34,0.44,0.55,0.66,0.78,0.9,1")
  .split(",")
  .map(value => Number(value.trim()))
  .filter(value => Number.isFinite(value) && value >= 0 && value <= 1);
if (!fractions.length) throw new Error("ABOUT_CAPTURE_FRACTIONS must contain at least one fraction in [0, 1].");
if (!(width > 0 && height > 0)) throw new Error("Capture viewport dimensions must be positive.");

const phases = [
  "hero",
  "wordmark",
  "valley",
  "wide-shot",
  "narrative",
  "team",
  "brands",
  "recognition",
  "expertise",
  "cta",
  "footer",
];
fs.mkdirSync(out, { recursive: true });

const browser = await launchMotionBrowser();
try {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    reducedMotion: "no-preference",
  });
  await context.addInitScript(() => {
    try { sessionStorage.setItem("lusion_booted_v1", "1"); } catch {}
    window.__enableAboutProbe = true;
    window.__enableCtaProbe = true;
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => {
    if (message.type() === "error") errors.push(message.text());
  });
  try {
    const response = await page.goto(base + "/about", { waitUntil: "networkidle", timeout: 120000 });
    if (!response?.ok()) throw new Error(`GET /about returned HTTP ${response?.status() ?? "no response"}`);
    await page.locator("#about").waitFor({ state: "attached", timeout: 30000 });
    await page.evaluate(() => document.fonts?.ready);
    await page.waitForTimeout(800);

    const dimensions = await page.evaluate(() => ({
      documentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
      viewportHeight: window.innerHeight,
      title: document.title,
    }));
    const maxScroll = Math.max(0, dimensions.documentHeight - height);
    const manifest = {
      url: base + "/about",
      viewport: { width, height },
      documentHeight: dimensions.documentHeight,
      maxScroll,
      title: dimensions.title,
      waitAfterScrollMs: 800,
      referenceDurationSeconds: REFERENCE_DURATION_SECONDS,
      captures: [],
      browserErrors: errors,
    };

    for (let index = 0; index < fractions.length; index++) {
      const fraction = fractions[index];
      const top = Math.round(maxScroll * fraction);
      await page.evaluate(y => {
        const smooth = window.__lenis;
        if (smooth && typeof smooth.scrollTo === "function") smooth.scrollTo(y, { immediate: true });
        window.scrollTo({ top: y, behavior: "instant" });
      }, top);
      // The current Git LFS reference is 42.233s; 800ms gives smooth-scroll and
      // shader uniforms a deterministic settle window before each still.
      await page.waitForTimeout(800);
      const actual = await page.evaluate(() => ({
        scrollY: window.scrollY,
        documentHeight: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
        phaseMarker: document.elementFromPoint(window.innerWidth * 0.5, window.innerHeight * 0.5)?.closest("section")?.id ?? null,
      }));
      const referenceSeconds = fraction * REFERENCE_DURATION_SECONDS;
      const frameNumber = Math.round(referenceSeconds) + 1;
      const name = `about-${String(index + 1).padStart(2, "0")}-${String(Math.round(fraction * 100)).padStart(3, "0")}.png`;
      await page.screenshot({
        path: path.join(out, name),
        type: "png",
        fullPage: false,
        animations: "allow",
        timeout: 120000,
      });
      manifest.captures.push({
        index: index + 1,
        phase: phases[index] ?? `scroll-${index + 1}`,
        fraction,
        targetScrollY: top,
        actualScrollY: actual.scrollY,
        documentHeight: actual.documentHeight,
        centerSectionId: actual.phaseMarker,
        referenceSeconds,
        nearestReferenceFrame: `ref_${String(frameNumber).padStart(3, "0")}.png`,
        screenshot: name,
      });
      console.log(`CAPTURED ${name} at ${Math.round(fraction * 100)}% (${actual.scrollY}px / ${maxScroll}px)`);
    }
    manifest.browserErrors = errors;
    fs.writeFileSync(path.join(out, "manifest.json"), JSON.stringify(manifest, null, 2));
    console.log(`Wrote ${manifest.captures.length} About frames to ${out}`);
    console.log(errors.length ? `BROWSER ERRORS (${errors.length}): ${errors.join(" | ")}` : "No uncaught page errors or console errors recorded.");
  } finally {
    await context.close();
  }
} finally {
  await browser.close();
}
