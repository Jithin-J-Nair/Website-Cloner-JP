#!/usr/bin/env node
/**
 * Phase H Repeatable Multi-Viewport Reference & Reconstruction Comparison Harness
 * (`scripts/phase-h-validate.mjs`)
 *
 * Viewports verified:
 *   - 1440x900 (desktop)
 *   - 1024x768 (tablet / small desktop)
 *   - 390x844  (mobile)
 *
 * Scroll & motion states verified:
 *   Homepage (`/`, 11 states including forward scroll + reverse scroll):
 *     01 home-01-tablet-entry         — Entry into #home-goal tablet frame
 *     02 home-02-tablet-emerge-start  — Early tablet scale/rotation emergence
 *     03 home-03-tablet-emerge-mid    — Mid tablet zoom & tilt continuity
 *     04 home-04-title-portal         — "STEP INTO A NEW WORLD" title zoom + astronaut descent
 *     05 home-05-black-tunnel-early   — 3D metallic greeble corridor + astronaut + clone emergence
 *     06 home-06-black-tunnel-twist   — Stereographic twisted greeble corridor + color shift
 *     07 home-07-white-blue-tunnel    — Sculpted cobalt-blue & white Voronoi block tunnel + white suit
 *     08 home-08-desktop-frame-out    — Pullback into desktop monitor frame
 *     09 home-09-glass-break-drop     — Shattered 3D glass shards + astronaut breaking out of frame
 *     10 home-10-end-cta-wait         — #end-section CTA + waving astronaut + LED face + diamonds + stickers
 *     11 home-11-reverse-tablet-mid   — Reverse scroll back from #end-section to mid tablet emergence
 *
 *   About Page (`/about`, 6 states including forward scroll, end-CTA particles & reverse scroll):
 *     12 about-01-hero-top            — Solid LUSION wordmark + 3D curl-advected sphere vortex
 *     13 about-02-we-are-reveal       — WE ARE LUSION + standing figure + levitating rocks + sphere cloud
 *     14 about-03-details-hud         — Narrative-driven section + 3D topographic HUD scanlines
 *     15 about-04-team-hologram       — [[ 001 ]] Edan Kwan + 3D DoF particle portrait + glyph rain
 *     16 about-05-end-cta-flip        — End-of-page CTA + interactive floating/FLIP shape particles
 *     17 about-06-reverse-we-are      — Reverse scroll back to WE ARE LUSION state
 */

import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { createRequire } from "node:module";
import { chromium } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";

const require = createRequire(import.meta.url);

const args = process.argv.slice(2);
const CAPTURE_REF = args.includes("--capture-ref");
const ONLY_REF_ABOUT_DESKTOP = args.includes("--only-ref-about-desktop");
const RUN_LABEL = (args.find((a) => !a.startsWith("--")) || "current").replace(/[^a-z0-9_-]/gi, "");
const RECON_URL = process.env.RECON_URL || "http://127.0.0.1:3000";
const REF_URL = process.env.REF_URL || "";

const OUT_ROOT = path.join(process.cwd(), "docs", "validation", "phase-h");
const REF_DIR = path.join(OUT_ROOT, "reference");
const RECON_DIR = path.join(OUT_ROOT, RUN_LABEL);
const COMP_DIR = path.join(OUT_ROOT, "composites", RUN_LABEL);

fs.mkdirSync(REF_DIR, { recursive: true });
fs.mkdirSync(RECON_DIR, { recursive: true });
fs.mkdirSync(COMP_DIR, { recursive: true });

const VIEWPORTS = [
  { id: "1440x900", width: 1440, height: 900, isMobile: false },
  { id: "1024x768", width: 1024, height: 768, isMobile: false },
  { id: "390x844", width: 390, height: 844, isMobile: true },
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
  if (await isServerUp(RECON_URL)) return { stop: async () => {} };
  const entry = path.join(process.cwd(), ".next", "standalone", "server.js");
  const parsed = new URL(RECON_URL);
  const proc = spawn(process.execPath, [entry], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      PORT: String(parsed.port || "3000"),
      HOSTNAME: "127.0.0.1",
      LUSION_ALLOW_LOCAL_INSPECTION_ASSETS: "0",
    },
    stdio: "ignore",
  });
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (await isServerUp(RECON_URL)) {
      return {
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

function startStaticFileServer(rootDir) {
  const server = http.createServer((req, res) => {
    const cleanUrl = decodeURIComponent((req.url || "/").split("?")[0]);
    if (cleanUrl === "/canvas-host") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<!doctype html><html><body style='margin:0;background:#0a0b10;'></body></html>");
      return;
    }
    const target = path.resolve(rootDir, "." + cleanUrl);
    if (!target.startsWith(rootDir) || !fs.existsSync(target) || fs.statSync(target).isDirectory()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": "image/png", "Cache-Control": "no-store" });
    fs.createReadStream(target).pipe(res);
  });
  return new Promise((resolve) => {
    server.listen(0, "127.0.0.1", () => {
      resolve({ port: server.address().port, close: () => new Promise((r) => server.close(r)) });
    });
  });
}

async function captureSiteStates(launchFn, baseUrl, outRoot, vp, trailingSlash, skipHome = false) {
  const vpOutDir = path.join(outRoot, vp.id);
  fs.mkdirSync(vpOutDir, { recursive: true });
  const errors = [];

  const makePage = async ( browser ) => {
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });
    await context.addInitScript(() => {
      const origRaf = window.requestAnimationFrame.bind(window);
      let paused = false;
      let remaining = 0;
      const waiting = [];
      let waiterResolve = null;

      window.__rafControl = {
        step(frames = 8) {
          return new Promise((resolve) => {
            paused = false;
            remaining = frames;
            waiterResolve = resolve;
            setTimeout(() => {
              if (waiterResolve === resolve) {
                paused = true;
                remaining = 0;
                waiterResolve = null;
                resolve();
              }
            }, 900);
            while (waiting.length > 0) {
              const cb = waiting.shift();
              origRaf(cb);
            }
          });
        },
        resume() {
          paused = false;
          remaining = 1e9;
          waiterResolve = null;
          while (waiting.length > 0) {
            const cb = waiting.shift();
            origRaf(cb);
          }
        },
      };

      window.requestAnimationFrame = (cb) => {
        const wrapped = (ts) => {
          cb(ts);
          if (waiterResolve) {
            remaining -= 1;
            if (remaining <= 0) {
              paused = true;
              const done = waiterResolve;
              waiterResolve = null;
              done();
            }
          }
        };
        if (paused) {
          waiting.push(wrapped);
          return waiting.length;
        }
        return origRaf(wrapped);
      };
    });
    const page = await context.newPage();
    if (trailingSlash) {
      await page.route(`${baseUrl}/`, async (route) => {
        const resp = await route.fetch();
        let html = await resp.text();
        html = html.replace(
          "</head>",
          "<style>#about-page,#projects-page,#project-details-page,#about-who,#about-clients,#about-award,#about-capability,#projects-main{display:none!important}</style></head>"
        );
        await route.fulfill({ response: resp, body: html });
      });
      await page.route("**/_astro/hoisted.*.js", async (route) => {
        const resp = await route.fetch();
        const raw = await resp.text();
        const body = raw
          .replace("const scrollManager=new ScrollManager;", "const scrollManager=(window.__refScrollManager=new ScrollManager);")
          .replace("const homeGoalSectionRanges=new GoalSectionRanges,", "const homeGoalSectionRanges=(window.__refGoalRanges=new GoalSectionRanges),");
        await route.fulfill({ response: resp, body });
      });
      await page.route("**/assets/models/about/sphere_l.buf", async (route) => {
        const resp = await route.fetch({ url: `${baseUrl}/assets/models/about/sphere_m.buf` });
        await route.fulfill({ response: resp });
      });
    }
    const cdp = await context.newCDPSession(page);
    page.on("pageerror", (e) => errors.push(String(e)));
    const waitPreloaderDone = async () => {
      for (let i = 0; i < 16; i++) {
        await page.evaluate(() => window.__rafControl.step(15));
        const done = await page.evaluate(() => {
          const candidates = [
            document.getElementById("preloader"),
            ...Array.from(document.querySelectorAll("[id*='preload'], [class*='preloader']")),
          ].filter(Boolean);
          if (candidates.length === 0) return true;
          return candidates.every((pre) => {
            const st = getComputedStyle(pre);
            return st.display === "none" || st.visibility === "hidden" || parseFloat(st.opacity || "1") < 0.03;
          });
        });
        if (done) break;
      }
      await page.evaluate(() => window.__rafControl.step(8));
    };
    return { context, page, cdp, waitPreloaderDone };
  };

  let homeLayout = null;
  const homeCaptures = [];
  if (!skipHome) {
  const homeBrowser = await launchFn();
  try {
    const { context, page, cdp, waitPreloaderDone } = await makePage(homeBrowser);
    await page.goto(`${baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (trailingSlash) {
      await page.waitForFunction(
        () =>
          Boolean(
            window.__refScrollManager &&
              window.__refScrollManager.contentSizePixel > 1000 &&
              window.__refGoalRanges &&
              window.__refGoalRanges.totalPixelCount > 1000
          ),
        { timeout: 30000 }
      );
      await waitPreloaderDone();
    } else {
      await page.waitForTimeout(2600);
      await waitPreloaderDone();
    }

    homeLayout = await page.evaluate((H) => {
    if (window.__refGoalRanges && window.__refGoalRanges.totalPixelCount > 1000) {
      const gr = window.__refGoalRanges;
      const ranges = {};
      for (const item of gr.itemList) {
        ranges[item.id] = {
          pixelFrom: item.pixelFrom,
          pixelCount: item.pixelCount,
          pixelTo: item.pixelTo,
          scrollFrom: gr.baseY + item.pixelFrom,
          scrollTo: gr.baseY + item.pixelTo,
        };
      }
      return {
        mode: "native-ref-ranges",
        scrollHeight: window.__refScrollManager.contentSizePixel + H,
        baseY: gr.baseY,
        totalPixelCount: gr.totalPixelCount,
        ranges,
      };
    }

    const absRect = (id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const r = el.getBoundingClientRect();
      const scrollTop = window.__refScrollManager ? window.__refScrollManager.scrollPixel : window.scrollY;
      return {
        left: r.left,
        top: r.top + scrollTop,
        bottom: r.bottom + scrollTop,
        width: r.width,
        height: r.height,
      };
    };
    const domContainer = absRect("home-goal");
    const domImgIn = absRect("home-goal-image-in");
    const domImgOut = absRect("home-goal-image-out");
    const endSection = absRect("end-section");
    const footerSection = absRect("footer-section");

    if (domContainer && domImgIn && domImgOut && footerSection) {
      const baseY = domImgIn.top - H;
      const weights = [
        { id: "blackFrameShow", isPixelBased: true, pixelCount: (H + domImgIn.height) * 0.5 },
        { id: "blackFrameIn", weight: 1 },
        { id: "blackTitle", weight: 5 },
        { id: "blackTunnel", weight: 12 },
        { id: "whiteTunnel", weight: 2 },
        { id: "whiteFrameOut", weight: 1 },
        { id: "whiteFrameBreak", weight: 1.5 },
        { id: "astronautDrop", isPixelBased: true, pixelCount: (H + domImgOut.height) * 0.5 + H },
      ];
      const totalTunnelWeight = 22.5;
      const c = domContainer.bottom - baseY - (H + domImgIn.height) * 0.5 - (H + domImgOut.height) * 0.5;
      let total = 0;
      const ranges = {};
      for (const item of weights) {
        const pc = item.weight ? (c * item.weight) / totalTunnelWeight : item.pixelCount;
        ranges[item.id] = {
          pixelFrom: total,
          pixelCount: pc,
          pixelTo: total + pc,
          scrollFrom: baseY + total,
          scrollTo: baseY + total + pc,
        };
        total += pc;
      }
      const waitFrom = endSection ? endSection.top : baseY + total;
      const waitCount = Math.max(H, footerSection.bottom - waitFrom);
      ranges.astronautWait = {
        pixelFrom: total,
        pixelCount: waitCount,
        pixelTo: total + waitCount,
        scrollFrom: waitFrom,
        scrollTo: waitFrom + waitCount,
      };
      total += waitCount;
      return { mode: "exact-ranges", scrollHeight: document.documentElement.scrollHeight, domContainer, domImgIn, domImgOut, endSection, footerSection, baseY, totalPixelCount: total, ranges };
    }

    // Fallback when pre-fix baseline lacks #home-goal-image-out
    const start = (domContainer ? domContainer.top : 0) - H * 0.4;
    const end = endSection ? endSection.bottom : (domContainer ? domContainer.bottom : H * 10);
    const span = Math.max(H, end - start);
    const mk = (a, b) => ({ scrollFrom: start + span * a, pixelCount: span * (b - a), scrollTo: start + span * b });
    return {
      mode: "fallback-normalized",
      scrollHeight: document.documentElement.scrollHeight,
      domContainer,
      domImgIn,
      domImgOut,
      endSection,
      footerSection,
      ranges: {
        blackFrameShow: mk(0.02, 0.08),
        blackFrameIn: mk(0.08, 0.14),
        blackTitle: mk(0.14, 0.30),
        blackTunnel: mk(0.30, 0.62),
        whiteTunnel: mk(0.62, 0.70),
        whiteFrameOut: mk(0.70, 0.75),
        whiteFrameBreak: mk(0.75, 0.80),
        astronautDrop: mk(0.80, 0.88),
        astronautWait: endSection ? { scrollFrom: endSection.top, pixelCount: Math.max(H, endSection.height), scrollTo: endSection.bottom } : mk(0.88, 0.98),
      },
    };
  }, vp.height);

    const R = homeLayout.ranges;
    const atRange = (id, t) => Math.max(0, Math.round(R[id].scrollFrom + R[id].pixelCount * t));
    const atSpan = (idA, idB, t) => Math.max(0, Math.round(R[idA].scrollFrom + (R[idB].scrollTo - R[idA].scrollFrom) * t));

    const homeStops = [
      { name: "home-01-tablet-entry", y: atRange("blackFrameShow", 0.72) },
      { name: "home-02-tablet-emerge-start", y: atRange("blackFrameIn", 0.22) },
      { name: "home-03-tablet-emerge-mid", y: atRange("blackFrameIn", 0.62) },
      { name: "home-04-title-portal", y: atRange("blackTitle", 0.55) },
      { name: "home-05-black-tunnel-early", y: atRange("blackTunnel", 0.26) },
      { name: "home-06-black-tunnel-twist", y: atRange("blackTunnel", 0.72) },
      { name: "home-07-white-blue-tunnel", y: atRange("whiteTunnel", 0.45) },
      { name: "home-08-desktop-frame-out", y: atRange("whiteFrameOut", 0.78) },
      { name: "home-09-glass-break-drop", y: atSpan("whiteFrameBreak", "astronautDrop", 0.36) },
      { name: "home-10-end-cta-wait", y: atRange("astronautWait", 0.06) },
      { name: "home-11-reverse-tablet-mid", y: atRange("blackFrameIn", 0.62) },
    ];

    for (const st of homeStops) {
      await page.evaluate(async (y) => {
        if (window.__refScrollManager) {
          window.__refScrollManager.scrollToPixel(y, true);
          window.__refScrollManager.skipAutoScroll = true;
        } else if (window.__lusionInspector?.scrollManager?.scrollToPixel) {
          window.__lusionInspector.scrollManager.scrollToPixel(y);
        } else {
          window.scrollTo(0, y);
        }
        await window.__rafControl.step(8);
      }, st.y);
      const outFile = path.join(vpOutDir, `${st.name}.png`);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(outFile, Buffer.from(data, "base64"));
      homeCaptures.push({ name: st.name, scrollY: st.y });
      console.log(`    captured ${vp.id}/${st.name}.png @ y=${st.y}`);
    }
    await context.close();
  } finally {
    await homeBrowser.close();
  }
  }

  let aboutLayout = null;
  const aboutCaptures = [];
  const aboutBrowser = await launchFn();
  try {
    const { context, page, cdp, waitPreloaderDone } = await makePage(aboutBrowser);
    await page.goto(`${baseUrl}${trailingSlash ? "/about/" : "/about"}`, { waitUntil: "domcontentloaded", timeout: 60000 });
    if (trailingSlash) {
      await page.waitForFunction(
        () => Boolean(window.__refScrollManager && window.__refScrollManager.contentSizePixel > 1000),
        { timeout: 30000 }
      );
      await waitPreloaderDone();
    } else {
      await page.waitForTimeout(2600);
      await waitPreloaderDone();
    }

    aboutLayout = await page.evaluate(({ width: W, height: H, isMobile }) => {
      const absRect = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        const scrollTop = window.__refScrollManager ? window.__refScrollManager.scrollPixel : window.scrollY;
        return { left: r.left, top: r.top + scrollTop, bottom: r.bottom + scrollTop, width: r.width, height: r.height };
      };
      const aboutWho = absRect("about-who");
      const endSection = absRect("end-section") || absRect("about-contact-cta");
      const unit = isMobile ? H : W;
      const whoSpan = aboutWho ? Math.max(H, aboutWho.height - H) : (isMobile ? 11.25 : 9.5) * unit;
      const isExactWhoHeight = aboutWho ? aboutWho.height > unit * 6.5 : false;
      const totalScrollHeight = window.__refScrollManager
        ? window.__refScrollManager.contentSizePixel + H
        : document.documentElement.scrollHeight;
      return {
        mode: isExactWhoHeight ? "exact-who-units" : "proportional-who",
        unit,
        whoTop: aboutWho ? aboutWho.top : 0,
        whoSpan,
        endTop: endSection ? endSection.top : totalScrollHeight - H * 2,
        scrollHeight: totalScrollHeight,
      };
    }, vp);

    const U = aboutLayout.unit;
    const whoY = (uDesktop, uMobile, fallbackFrac) => {
      if (aboutLayout.mode === "exact-who-units") {
        return Math.round((vp.isMobile ? uMobile : uDesktop) * U);
      }
      return Math.round(aboutLayout.whoTop + aboutLayout.whoSpan * fallbackFrac);
    };

    const aboutStops = [
      { name: "about-01-hero-top", y: 0, frames: 8 },
      { name: "about-02-we-are-reveal", y: whoY(1.6, 1.6, 0.20), frames: 12 },
      { name: "about-03-details-hud", y: whoY(5.35, 5.35, 0.56), frames: 10 },
      { name: "about-04-team-hologram", y: whoY(7.2, 8.85, 0.86), frames: 20 },
      { name: "about-05-end-cta-flip", y: Math.round(aboutLayout.endTop + vp.height * 0.35), frames: 16 },
      { name: "about-06-reverse-we-are", y: whoY(1.6, 1.6, 0.20), frames: 12 },
    ];

    for (const st of aboutStops) {
      await page.evaluate(
        async ({ y, frames }) => {
          if (window.__refScrollManager) {
            window.__refScrollManager.scrollToPixel(y, true);
            window.__refScrollManager.skipAutoScroll = true;
          } else if (window.__lusionInspector?.scrollManager?.scrollToPixel) {
            window.__lusionInspector.scrollManager.scrollToPixel(y);
          } else {
            window.scrollTo(0, y);
          }
          await window.__rafControl.step(frames);
        },
        { y: st.y, frames: st.frames }
      );
      const outFile = path.join(vpOutDir, `${st.name}.png`);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
      fs.writeFileSync(outFile, Buffer.from(data, "base64"));
      aboutCaptures.push({ name: st.name, scrollY: st.y });
      console.log(`    captured ${vp.id}/${st.name}.png @ y=${st.y}`);
    }

    await context.close();
  } finally {
    await aboutBrowser.close();
  }
  return { homeLayout, homeCaptures, aboutLayout, aboutCaptures, pageErrors: errors };
}

async function generateCompositesAndMetrics(browser, helperPort) {
  const results = { generatedAt: new Date().toISOString(), label: RUN_LABEL, viewports: {}, summary: {} };
  const allNames = [
    "home-01-tablet-entry",
    "home-02-tablet-emerge-start",
    "home-03-tablet-emerge-mid",
    "home-04-title-portal",
    "home-05-black-tunnel-early",
    "home-06-black-tunnel-twist",
    "home-07-white-blue-tunnel",
    "home-08-desktop-frame-out",
    "home-09-glass-break-drop",
    "home-10-end-cta-wait",
    "home-11-reverse-tablet-mid",
    "about-01-hero-top",
    "about-02-we-are-reveal",
    "about-03-details-hud",
    "about-04-team-hologram",
    "about-05-end-cta-flip",
    "about-06-reverse-we-are",
  ];

  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  let totalMae = 0;
  let totalSsim = 0;
  let count = 0;

  for (const vp of VIEWPORTS) {
    results.viewports[vp.id] = {};
    const vpCompDir = path.join(COMP_DIR, vp.id);
    fs.mkdirSync(vpCompDir, { recursive: true });

    const scale = vp.width > 800 ? 0.45 : 0.85;
    const outW = Math.round((vp.width * 3 + 32) * scale);
    const outH = Math.round((vp.height + 54) * scale);
    await page.setViewportSize({ width: outW, height: outH });
    await page.goto(`http://127.0.0.1:${helperPort}/canvas-host`, { waitUntil: "load" });

    for (const stateName of allNames) {
      const refAbs = path.join(REF_DIR, vp.id, `${stateName}.png`);
      const reconAbs = path.join(RECON_DIR, vp.id, `${stateName}.png`);
      if (!fs.existsSync(refAbs) || !fs.existsSync(reconAbs)) continue;

      const refRel = "/" + path.relative(process.cwd(), refAbs).split(path.sep).join("/");
      const reconRel = "/" + path.relative(process.cwd(), reconAbs).split(path.sep).join("/");

      const m = await page.evaluate(
        async ({ refUrl, reconUrl, w, h, scaleFactor, labelText }) => {
          const loadImg = (src) =>
            new Promise((resolve, reject) => {
              const im = new Image();
              im.onload = () => resolve(im);
              im.onerror = reject;
              im.src = src + "?t=" + Date.now();
            });
          const [refImg, reconImg] = await Promise.all([loadImg(refUrl), loadImg(reconUrl)]);

          const cA = document.createElement("canvas");
          cA.width = w;
          cA.height = h;
          const ctxA = cA.getContext("2d");
          ctxA.drawImage(refImg, 0, 0, w, h);

          const cB = document.createElement("canvas");
          cB.width = w;
          cB.height = h;
          const ctxB = cB.getContext("2d");
          ctxB.drawImage(reconImg, 0, 0, w, h);

          const dA = ctxA.getImageData(0, 0, w, h).data;
          const dB = ctxB.getImageData(0, 0, w, h).data;

          const cD = document.createElement("canvas");
          cD.width = w;
          cD.height = h;
          const ctxD = cD.getContext("2d");
          const diffImg = ctxD.createImageData(w, h);

          const nPx = w * h;
          let absSum = 0;
          let sqSum = 0;
          let over24 = 0;
          const lumA = new Float32Array(nPx);
          const lumB = new Float32Array(nPx);

          for (let i = 0, p = 0; i < dA.length; i += 4, p++) {
            const dr = Math.abs(dA[i] - dB[i]);
            const dg = Math.abs(dA[i + 1] - dB[i + 1]);
            const db = Math.abs(dA[i + 2] - dB[i + 2]);
            const meanD = (dr + dg + db) / 3;
            absSum += meanD;
            sqSum += (dr * dr + dg * dg + db * db) / 3;
            if (meanD > 24) over24++;
            lumA[p] = 0.2126 * dA[i] + 0.7152 * dA[i + 1] + 0.0722 * dA[i + 2];
            lumB[p] = 0.2126 * dB[i] + 0.7152 * dB[i + 1] + 0.0722 * dB[i + 2];
            diffImg.data[i] = Math.min(255, Math.round(dr * 2));
            diffImg.data[i + 1] = Math.min(255, Math.round(dg * 1.4));
            diffImg.data[i + 2] = Math.min(255, Math.round(db * 2));
            diffImg.data[i + 3] = 255;
          }
          ctxD.putImageData(diffImg, 0, 0);

          let ssimSum = 0;
          let ssimBlocks = 0;
          const C1 = 6.5025;
          const C2 = 58.5225;
          for (let by = 0; by + 8 <= h; by += 8) {
            for (let bx = 0; bx + 8 <= w; bx += 8) {
              let muX = 0;
              let muY = 0;
              for (let y = 0; y < 8; y++) {
                const row = (by + y) * w + bx;
                for (let x = 0; x < 8; x++) {
                  muX += lumA[row + x];
                  muY += lumB[row + x];
                }
              }
              muX /= 64;
              muY /= 64;
              let varX = 0;
              let varY = 0;
              let cov = 0;
              for (let y = 0; y < 8; y++) {
                const row = (by + y) * w + bx;
                for (let x = 0; x < 8; x++) {
                  const dx = lumA[row + x] - muX;
                  const dy = lumB[row + x] - muY;
                  varX += dx * dx;
                  varY += dy * dy;
                  cov += dx * dy;
                }
              }
              varX /= 63;
              varY /= 63;
              cov /= 63;
              ssimSum += ((2 * muX * muY + C1) * (2 * cov + C2)) / ((muX * muX + muY * muY + C1) * (varX + varY + C2));
              ssimBlocks++;
            }
          }

          const mae = Number((absSum / nPx).toFixed(2));
          const rmse = Math.sqrt(sqSum / nPx);
          const psnr = Number((rmse < 1e-6 ? 99 : 20 * Math.log10(255 / rmse)).toFixed(2));
          const ssim = Number((ssimSum / Math.max(1, ssimBlocks)).toFixed(4));
          const pctOver24 = Number(((over24 / nPx) * 100).toFixed(2));

          document.body.innerHTML = "";
          const out = document.createElement("canvas");
          out.width = Math.round((w * 3 + 32) * scaleFactor);
          out.height = Math.round((h + 54) * scaleFactor);
          const octx = out.getContext("2d");
          octx.scale(scaleFactor, scaleFactor);
          octx.fillStyle = "#0b0d14";
          octx.fillRect(0, 0, w * 3 + 32, h + 54);
          octx.fillStyle = "#e5e7eb";
          octx.font = "bold 20px monospace";
          octx.fillText(`REFERENCE (${labelText})`, 8, 30);
          octx.fillText(`RECONSTRUCTION (${mae} MAE | SSIM ${ssim})`, w + 16, 30);
          octx.fillText(`ABS DIFF x2 (${pctOver24}% > 24 | PSNR ${psnr}dB)`, w * 2 + 24, 30);
          octx.drawImage(cA, 8, 44, w, h);
          octx.drawImage(cB, w + 16, 44, w, h);
          octx.drawImage(cD, w * 2 + 24, 44, w, h);
          document.body.appendChild(out);

          return { mae, psnr, ssim, pctOver24 };
        },
        { refUrl: refRel, reconUrl: reconRel, w: vp.width, h: vp.height, scaleFactor: scale, labelText: `${stateName} @ ${vp.id}` }
      );

      const compOut = path.join(vpCompDir, `${stateName}.jpg`);
      const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality: 92 });
      fs.writeFileSync(compOut, Buffer.from(data, "base64"));
      results.viewports[vp.id][stateName] = m;
      totalMae += m.mae;
      totalSsim += m.ssim;
      count++;
      console.log(`  [${vp.id}] ${stateName.padEnd(28)} MAE=${String(m.mae).padStart(6)} | SSIM=${m.ssim.toFixed(4)} | PSNR=${m.psnr}dB`);
    }
  }

  await context.close();
  results.summary = {
    totalStates: count,
    meanMae: Number((totalMae / Math.max(1, count)).toFixed(2)),
    meanSsim: Number((totalSsim / Math.max(1, count)).toFixed(4)),
  };
  const metricsPath = path.join(OUT_ROOT, `metrics-${RUN_LABEL}.json`);
  fs.writeFileSync(metricsPath, JSON.stringify(results, null, 2));
  console.log(`\n=== SUMMARY (${RUN_LABEL}): ${count} states | Mean MAE = ${results.summary.meanMae} | Mean SSIM = ${results.summary.meanSsim} ===`);
}

ensureSparticuzLibs();
const executablePath = await sparticuzChromium.executablePath();
const reconHandle = await ensureReconServer();
const staticHelper = await startStaticFileServer(process.cwd());

const launchBrowser = () =>
  chromium.launch({
    executablePath,
    headless: true,
    args: [
      ...sparticuzChromium.args,
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--no-sandbox",
    ],
  });

try {
  if (CAPTURE_REF) {
    if (!REF_URL) throw new Error("--capture-ref requires REF_URL environment variable");
    const existingTelPath = path.join(REF_DIR, "telemetry.json");
    const refTelemetry = fs.existsSync(existingTelPath)
      ? JSON.parse(fs.readFileSync(existingTelPath, "utf8"))
      : {};
    for (const vp of VIEWPORTS) {
      if (ONLY_REF_ABOUT_DESKTOP && vp.isMobile) continue;
      console.log(`Capturing reference frames @ ${vp.id}...`);
      const next = await captureSiteStates(launchBrowser, REF_URL, REF_DIR, vp, true, ONLY_REF_ABOUT_DESKTOP);
      refTelemetry[vp.id] = { ...(refTelemetry[vp.id] || {}), ...next };
    }
    fs.writeFileSync(existingTelPath, JSON.stringify(refTelemetry, null, 2));
  }

  const reconTelemetry = {};
  for (const vp of VIEWPORTS) {
    console.log(`Capturing reconstruction (${RUN_LABEL}) frames @ ${vp.id}...`);
    reconTelemetry[vp.id] = await captureSiteStates(launchBrowser, RECON_URL, RECON_DIR, vp, false);
  }
  fs.writeFileSync(path.join(RECON_DIR, "telemetry.json"), JSON.stringify(reconTelemetry, null, 2));

  const compBrowser = await launchBrowser();
  try {
    await generateCompositesAndMetrics(compBrowser, staticHelper.port);
  } finally {
    await compBrowser.close();
  }
} finally {
  await staticHelper.close();
  await reconHandle.stop();
}
