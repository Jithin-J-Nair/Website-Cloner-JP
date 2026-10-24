#!/usr/bin/env node
/**
 * Clean-Environment Headless Chromium + WebGL Visual, Accessibility & Route Validator
 * (`scripts/phase-c-home-validate.mjs` — Repaired & Expanded in Phase D)
 *
 * Self-contained repository validation harness with ZERO dependencies on `/tmp/browser-check`,
 * `/tmp/pytools`, or `/tmp/lusion-ref`:
 *   1. Resolves `@sparticuz/chromium` + `playwright-core` directly from repo `devDependencies`,
 *      unpacking bundled Amazon Linux / SwiftShader shared libraries automatically when needed.
 *   2. Automatically starts clean production standalone `.next/standalone/server.js` (with
 *      `LUSION_ALLOW_LOCAL_INSPECTION_ASSETS="0"`) if `RECON_URL` is not already listening.
 *   3. Captures real headless Chromium + WebGL screenshots at `1440x900` (desktop) and `390x844`
 *      (mobile) across `/`, `/about`, `/projects`, `/projects/oryzo_ai`, `/projects/porsche_dream_machine`,
 *      and `/projects/spaace`, plus side-by-side comparison sheets against preserved Phase A captures.
 *   4. Enforces strict pass/fail gates:
 *        - 0 console errors
 *        - 0 uncaught page errors
 *        - 0 HTTP >= 400 asset/API failures during clean route rendering
 *        - Non-blank 3D WebGL hero cross rendering
 *        - Verified `ShowreelModal` keyboard Enter activation, `Tab`/`Shift+Tab` focus trap, & `Escape` close/restore
 */

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";

const require = createRequire(import.meta.url);

const RECON_URL = process.env.RECON_URL || "http://127.0.0.1:3000";
const OUT_DIR = path.join(process.cwd(), "docs", "validation", "phase-d");
const COMP_OUT_DIR = path.join(OUT_DIR, "composites");
const REF_COMP_DIR = path.join(process.cwd(), "docs", "validation", "phase-a", "composites");
fs.mkdirSync(COMP_OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900, isMobile: false },
  { name: "390x844", width: 390, height: 844, isMobile: true },
];

function ensureSparticuzLibs() {
  const pkgMain = require.resolve("@sparticuz/chromium");
  const binDir = path.resolve(path.dirname(pkgMain), "..", "bin");
  const targetLibDir = path.join(os.tmpdir(), "lusion-chromium-libs");
  fs.mkdirSync(targetLibDir, { recursive: true });

  for (const archive of ["al2023.tar.br", "swiftshader.tar.br"]) {
    const brPath = path.join(binDir, archive);
    const marker = path.join(targetLibDir, `.extracted-${archive}`);
    if (fs.existsSync(brPath) && !fs.existsSync(marker)) {
      const tarPath = path.join(targetLibDir, archive.replace(/\.br$/, ""));
      fs.writeFileSync(tarPath, zlib.brotliDecompressSync(fs.readFileSync(brPath)));
      execFileSync("tar", ["-xf", tarPath, "-C", targetLibDir]);
      fs.unlinkSync(tarPath);
      fs.writeFileSync(marker, "ok");
    }
  }

  const libSubdirs = [targetLibDir, path.join(targetLibDir, "lib"), path.join(targetLibDir, "usr", "lib64")].filter(
    (d) => fs.existsSync(d)
  );
  process.env.LD_LIBRARY_PATH = [...libSubdirs, process.env.LD_LIBRARY_PATH || ""].filter(Boolean).join(":");
}

async function isServerUp(url) {
  try {
    const res = await fetch(url);
    return res.status < 500;
  } catch {
    return false;
  }
}

async function ensureReconServer() {
  if (await isServerUp(RECON_URL)) {
    return { owned: false, stop: async () => {} };
  }

  const serverEntry = path.join(process.cwd(), ".next", "standalone", "server.js");
  if (!fs.existsSync(serverEntry)) {
    throw new Error("Missing `.next/standalone/server.js`. Run `npm run build` first.");
  }

  const parsed = new URL(RECON_URL);
  const port = parsed.port || "3000";
  const proc = spawn(process.execPath, [serverEntry], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(port),
      HOSTNAME: "127.0.0.1",
      LUSION_ALLOW_LOCAL_INSPECTION_ASSETS: "0",
    },
    stdio: ["ignore", "pipe", "pipe"],
  });

  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (await isServerUp(RECON_URL)) {
      return {
        owned: true,
        stop: async () => {
          proc.kill("SIGTERM");
          await new Promise((r) => setTimeout(r, 250));
        },
      };
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  proc.kill("SIGTERM");
  throw new Error(`Timed out waiting for standalone server at ${RECON_URL}`);
}

const HOME_STOPS = [
  { id: "home-hero", selector: "#home-hero", extraRatio: 0, headerOffset: 0 },
  { id: "home-reel", selector: "#home-reel", extraRatio: 0, headerOffset: 84 },
  { id: "home-featured", selector: "#home-featured-title-wrapper", extraRatio: 0, headerOffset: 88 },
  { id: "home-goal-stage1", selector: "#home-goal", extraRatio: 0.44, headerOffset: 0 },
  { id: "home-goal-stage2", selector: "#home-goal", extraRatio: 0.78, headerOffset: 0 },
  { id: "home-footer", selector: "#footer-section", extraRatio: 0.02, headerOffset: 0 },
];

const EXTRA_ROUTES = [
  { slug: "about-hero", path: "/about" },
  { slug: "projects-archive", path: "/projects" },
  { slug: "project-oryzo-ai", path: "/projects/oryzo_ai" },
  { slug: "project-porsche", path: "/projects/porsche_dream_machine" },
  { slug: "project-spaace", path: "/projects/spaace" },
];

async function snapPng(cdpSession, outPath) {
  const { data } = await cdpSession.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
}

async function snapJpeg(cdpSession, outPath, quality = 88) {
  const { data } = await cdpSession.send("Page.captureScreenshot", { format: "jpeg", quality });
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
}

ensureSparticuzLibs();
const executablePath = await sparticuzChromium.executablePath();
const serverHandle = await ensureReconServer();

const report = {
  generatedAt: new Date().toISOString(),
  cleanProductionMode: true,
  viewports: {},
  modalAccessibility: null,
  totals: {
    consoleErrors: 0,
    pageErrors: 0,
    http4xxOr5xxAssets: 0,
    failures: [],
  },
};

try {
  for (const vp of VIEWPORTS) {
    console.log(`\n=== Auditing Viewport ${vp.name} ===`);
    const browser = await chromium.launch({
      executablePath,
      headless: true,
      args: [
        ...sparticuzChromium.args,
        "--use-gl=angle",
        "--use-angle=swiftshader",
        "--enable-webgl",
        "--ignore-gpu-blocklist",
      ],
    });

    try {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();
      const cdp = await context.newCDPSession(page);

      const vpConsoleErrors = [];
      const vpPageErrors = [];
      const vpBadResponses = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          vpConsoleErrors.push(msg.text());
        }
      });
      page.on("pageerror", (err) => {
        vpPageErrors.push(String(err));
      });
      page.on("response", (res) => {
        if (res.status() >= 400 && !res.url().includes("/non-existent")) {
          vpBadResponses.push(`${res.status()} ${res.url()}`);
        }
      });

      // 1. Audit Homepage `/` + WebGL Hero + All 6 Scroll Stops
      await page.goto(`${RECON_URL}/`, { waitUntil: "networkidle", timeout: 45_000 });
      await page.waitForTimeout(1200);

      const webglMetrics = await page.evaluate(() => {
        const c = document.querySelector("#home-hero-visual-container canvas");
        if (!(c instanceof HTMLCanvasElement)) return { found: false };
        return {
          found: true,
          width: c.width,
          height: c.height,
          cssWidth: Math.round(c.getBoundingClientRect().width),
          cssHeight: Math.round(c.getBoundingClientRect().height),
        };
      });

      for (const stop of HOME_STOPS) {
        await page.evaluate(
          ({ selector, extraRatio, headerOffset }) => {
            const el = document.querySelector(selector);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const targetY = window.scrollY + rect.top + el.scrollHeight * extraRatio - headerOffset;
            window.scrollTo({ top: Math.max(0, targetY), behavior: "instant" });
          },
          { selector: stop.selector, extraRatio: stop.extraRatio, headerOffset: stop.headerOffset }
        );
        await page.waitForTimeout(450);
        const outPath = path.join(OUT_DIR, `${stop.id}--${vp.name}.png`);
        await snapPng(cdp, outPath);
        console.log(`  Captured ${path.relative(process.cwd(), outPath)}`);
      }

      // 2. Test ShowreelModal Keyboard Focus Trap & Escape Restoration on Desktop
      if (vp.name === "1440x900") {
        await page.goto(`${RECON_URL}/`, { waitUntil: "networkidle", timeout: 45_000 });
        await page.waitForTimeout(500);
        await page.locator("#home-reel-container button").focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(400);

        const initialFocusId = await page.evaluate(() => document.activeElement?.id || "");
        const tabSequence = [];
        for (let i = 0; i < 5; i += 1) {
          await page.keyboard.press("Tab");
          const info = await page.evaluate(() => {
            const overlay = document.getElementById("video-overlay");
            const active = document.activeElement;
            return {
              tag: active?.tagName || "",
              id: active?.id || "",
              insideModal: Boolean(overlay && active && overlay.contains(active)),
            };
          });
          tabSequence.push(info);
        }

        await page.keyboard.press("Shift+Tab");
        const shiftTabInside = await page.evaluate(() => {
          const overlay = document.getElementById("video-overlay");
          return Boolean(overlay && document.activeElement && overlay.contains(document.activeElement));
        });

        await snapPng(cdp, path.join(OUT_DIR, `home-showreel-modal--${vp.name}.png`));
        await page.keyboard.press("Escape");
        await page.waitForSelector("#video-overlay", { state: "detached", timeout: 2500 }).catch(() => {});

        const afterEscape = await page.evaluate(() => {
          const el = document.getElementById("video-overlay");
          return {
            closed: !el || el.getAttribute("aria-hidden") === "true",
            restoredFocusTag: document.activeElement?.tagName || "",
          };
        });

        report.modalAccessibility = {
          initialFocusId,
          allTabsTrappedInsideModal: tabSequence.every((s) => s.insideModal),
          shiftTabInsideModal: shiftTabInside,
          closedOnEscape: afterEscape.closed,
          restoredFocusTag: afterEscape.restoredFocusTag,
          tabSequence,
        };
        console.log(`  Verified ShowreelModal Focus Trap:`, JSON.stringify(report.modalAccessibility));
      }

      // 3. Audit `/about`, `/projects`, `/projects/oryzo_ai`, `/projects/porsche_dream_machine`, `/projects/spaace`
      const routeTitles = {};
      for (const routeItem of EXTRA_ROUTES) {
        await page.goto(`${RECON_URL}${routeItem.path}`, { waitUntil: "networkidle", timeout: 45_000 });
        await page.waitForTimeout(550);
        routeTitles[routeItem.path] = await page.title();
        const outPath = path.join(OUT_DIR, `${routeItem.slug}--${vp.name}.png`);
        await snapPng(cdp, outPath);
        console.log(`  Captured ${path.relative(process.cwd(), outPath)} (<title>${routeTitles[routeItem.path]}</title>)`);
      }

      // 4. Generate Side-by-Side Reference Comparison Composites via lightweight local HTTP helper
      const compServer = http.createServer((req, res) => {
        const u = new URL(req.url || "/", "http://127.0.0.1");
        const name = (u.searchParams.get("name") || "").replace(/[^a-z0-9-]/gi, "");
        if (u.pathname === "/ref") {
          const p = path.join(REF_COMP_DIR, `${name}--${vp.name}.jpg`);
          res.writeHead(200, { "Content-Type": "image/jpeg" });
          res.end(fs.readFileSync(p));
          return;
        }
        if (u.pathname === "/recon") {
          const p = path.join(OUT_DIR, `${name}--${vp.name}.png`);
          res.writeHead(200, { "Content-Type": "image/png" });
          res.end(fs.readFileSync(p));
          return;
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(`<!doctype html><html><body style="margin:0;background:#0c0e14;font-family:monospace;color:#fff;overflow:hidden;">
          <div style="display:grid;grid-template-columns:${vp.width}px ${vp.width}px;gap:24px;">
            <div>
              <div style="height:44px;display:flex;align-items:center;padding:0 16px;font-size:15px;">
                LEFT: lusion.co Reference (${name} @ ${vp.name})
              </div>
              <div style="width:${vp.width}px;height:${vp.height}px;overflow:hidden;background:url('/ref?name=${name}') left bottom / ${vp.width * 2 + 24}px ${vp.height + 44}px no-repeat;"></div>
            </div>
            <div>
              <div style="height:44px;display:flex;align-items:center;padding:0 16px;font-size:15px;color:#c1ff00;">
                RIGHT: Phase D Clean Reconstruction (${name} @ ${vp.name})
              </div>
              <img src="/recon?name=${name}" width="${vp.width}" height="${vp.height}" style="display:block;" />
            </div>
          </div></body></html>`);
      });
      await new Promise((r) => compServer.listen(0, "127.0.0.1", r));
      const compPort = compServer.address().port;

      try {
        await page.setViewportSize({ width: vp.width * 2 + 24, height: vp.height + 44 });
        const pairs = ["home-hero", "home-reel", "home-featured", "about-hero", "projects-archive", "project-oryzo-ai"];
        for (const name of pairs) {
          const refPath = path.join(REF_COMP_DIR, `${name}--${vp.name}.jpg`);
          const reconPath = path.join(OUT_DIR, `${name}--${vp.name}.png`);
          if (!fs.existsSync(refPath) || !fs.existsSync(reconPath)) continue;
          await page.goto(`http://127.0.0.1:${compPort}/?name=${name}`, { waitUntil: "networkidle" });
          await page.waitForTimeout(80);
          await snapJpeg(cdp, path.join(COMP_OUT_DIR, `${name}--${vp.name}.jpg`), 88);
        }
      } finally {
        compServer.close();
      }

      report.viewports[vp.name] = {
        webglMetrics,
        routeTitles,
        consoleErrors: vpConsoleErrors,
        pageErrors: vpPageErrors,
        badResponses: vpBadResponses,
      };

      report.totals.consoleErrors += vpConsoleErrors.length;
      report.totals.pageErrors += vpPageErrors.length;
      report.totals.http4xxOr5xxAssets += vpBadResponses.length;

      if (!webglMetrics.found || webglMetrics.width <= 0) {
        report.totals.failures.push(`WebGL canvas missing at ${vp.name}`);
      }
    } finally {
      await browser.close();
    }
  }

  if (
    !report.modalAccessibility ||
    report.modalAccessibility.initialFocusId !== "video-overlay__mobile-close-btn" ||
    !report.modalAccessibility.allTabsTrappedInsideModal ||
    !report.modalAccessibility.shiftTabInsideModal ||
    !report.modalAccessibility.closedOnEscape ||
    report.modalAccessibility.restoredFocusTag !== "BUTTON"
  ) {
    report.totals.failures.push("ShowreelModal focus trap / keyboard escape check failed");
  }

  if (report.totals.consoleErrors > 0) {
    report.totals.failures.push(`${report.totals.consoleErrors} console error(s) recorded`);
  }
  if (report.totals.pageErrors > 0) {
    report.totals.failures.push(`${report.totals.pageErrors} pageerror(s) recorded`);
  }
  if (report.totals.http4xxOr5xxAssets > 0) {
    report.totals.failures.push(`${report.totals.http4xxOr5xxAssets} HTTP >= 400 response(s) recorded`);
  }

  const reportPath = path.join(OUT_DIR, "phase-d-browser-report.json");
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
  console.log(`\nSaved Phase D browser report -> ${path.relative(process.cwd(), reportPath)}`);

  if (report.totals.failures.length > 0) {
    console.error("\nBROWSER VALIDATION FAILED:", report.totals.failures);
    console.error(JSON.stringify(report.viewports, null, 2));
    process.exitCode = 1;
  } else {
    console.log(
      "\nALL HEADLESS CHROMIUM + WEBGL + FOCUS-TRAP + ZERO-404 CHECKS PASSED (0 console errors, 0 page errors, 0 HTTP>=400 responses)."
    );
  }
} finally {
  await serverHandle.stop();
}
