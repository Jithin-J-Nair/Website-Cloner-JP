#!/usr/bin/env node
/**
 * Phase E Reference-Fidelity Visual & Quantitative Pixel/SSIM Auditor (`scripts/phase-e-audit.mjs`)
 *
 * Compares live headless Chromium + WebGL captures at `1440x900` (desktop) and `390x844` (mobile)
 * directly against verified `lusion.co` reference frames:
 *   - `docs/validation/phase-c/ref-01,02,03,05,07,08--{1440x900,390x844}.png` (1:1 native viewport PNGs)
 *   - `docs/validation/phase-b/composites/04-footer-and-portal--{1440x900,390x844}.jpg` (panel 4 of 4)
 *   - `docs/validation/phase-a/composites/{about-hero,projects-archive,project-oryzo-ai}--{1440x900,390x844}.jpg` (panel 1 of 3)
 *
 * Computes full-resolution `MAE`, `RMSE`, `PSNR (dB)`, `8x8 Luminance SSIM`, and `% pixels > 24`,
 * saving `docs/validation/phase-e/metrics-<label>.json` + 3-panel side-by-side-with-diff JPEGs.
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

const RUN_LABEL = (process.argv[2] || "latest").replace(/[^a-z0-9_-]/gi, "");
const RECON_URL = process.env.RECON_URL || "http://127.0.0.1:3000";
const PHASE_C_REF = path.join(process.cwd(), "docs", "validation", "phase-c");
const PHASE_B_COMP = path.join(process.cwd(), "docs", "validation", "phase-b", "composites");
const PHASE_A_COMP = path.join(process.cwd(), "docs", "validation", "phase-a", "composites");
const OUT_ROOT = path.join(process.cwd(), "docs", "validation", "phase-e");
const CAP_DIR = path.join(OUT_ROOT, "captures", RUN_LABEL);
const COMP_DIR = path.join(OUT_ROOT, "composites", RUN_LABEL);
fs.mkdirSync(CAP_DIR, { recursive: true });
fs.mkdirSync(COMP_DIR, { recursive: true });

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

async function ensureServer() {
  if (await isServerUp(RECON_URL)) return { stop: async () => {} };
  const entry = path.join(process.cwd(), ".next", "standalone", "server.js");
  const proc = spawn(process.execPath, [entry], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: "3000", HOSTNAME: "127.0.0.1", LUSION_ALLOW_LOCAL_INSPECTION_ASSETS: "0" },
    stdio: "ignore",
  });
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (await isServerUp(RECON_URL)) {
      return {
        stop: async () => {
          proc.kill("SIGTERM");
          await new Promise((r) => setTimeout(r, 200));
        },
      };
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  proc.kill("SIGTERM");
  throw new Error("Server startup timed out");
}

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900 },
  { name: "390x844", width: 390, height: 844 },
];

const AUDIT_STOPS = [
  { id: "01-home-hero", route: "/", selector: "#home-hero", extraRatio: 0, headerOffset: 0, refKind: "phase-c", refBase: "ref-01-hero" },
  { id: "02-home-reel-intro", route: "/", selector: "#home-reel", extraRatio: 0, headerOffset: 44, refKind: "phase-c", refBase: "ref-02-reel-intro" },
  { id: "03-home-reel-stage", route: "/", selector: "#home-reel-container", extraRatio: 0, headerOffset: 90, refKind: "phase-c", refBase: "ref-03-reel-stage" },
  {
    id: "05-home-featured-cta",
    route: "/",
    selector: ".project-item[data-project-slug='everswap']",
    mobileSelector: "#home-featured-cta",
    extraRatio: 0,
    headerOffset: 175,
    mobileHeaderOffset: 542,
    refKind: "phase-c",
    refBase: "ref-05-featured-cta",
  },
  { id: "07-home-goal-stage1", route: "/", selector: "#home-goal", extraRatio: 0.44, headerOffset: 0, refKind: "phase-c", refBase: "ref-07-goal-stage1-dark" },
  { id: "08-home-goal-stage2", route: "/", selector: "#home-goal", extraRatio: 0.78, headerOffset: 0, refKind: "phase-c", refBase: "ref-08-goal-stage2-white" },
  { id: "09-home-footer-portal", route: "/", selector: "#footer-section", extraRatio: 0.08, headerOffset: 0, refKind: "phase-b-4", refBase: "04-footer-and-portal" },
  { id: "10-about-hero", route: "/about", selector: "#about-who", extraRatio: 0, headerOffset: 0, refKind: "phase-a-3", refBase: "about-hero" },
  { id: "11-projects-archive", route: "/projects", selector: "#projects", extraRatio: 0, headerOffset: 0, refKind: "phase-a-3", refBase: "projects-archive" },
  { id: "12-project-oryzo-ai", route: "/projects/oryzo_ai", selector: "main", extraRatio: 0, headerOffset: 0, refKind: "phase-a-3", refBase: "project-oryzo-ai" },
];

async function snapPng(cdp, outPath) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
}

async function snapJpeg(cdp, outPath, quality = 85) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality });
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
}

ensureSparticuzLibs();
const executablePath = await sparticuzChromium.executablePath();
const server = await ensureServer();
const results = [];

const helperServer = http.createServer((req, res) => {
  const u = new URL(req.url || "/", "http://127.0.0.1");
  if (u.pathname === "/canvas-host") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end("<!doctype html><html><body style='margin:0;background:#0a0c12;overflow:hidden;'><canvas id='c'></canvas></body></html>");
    return;
  }
  const filePath = u.searchParams.get("p") || "";
  const resolved = path.resolve(process.cwd(), filePath);
  if (!resolved.startsWith(path.resolve(process.cwd(), "docs"))) {
    res.writeHead(403);
    res.end("forbidden");
    return;
  }
  res.writeHead(200, { "Content-Type": resolved.endsWith(".png") ? "image/png" : "image/jpeg" });
  res.end(fs.readFileSync(resolved));
});
await new Promise((r) => helperServer.listen(0, "127.0.0.1", r));
const helperPort = helperServer.address().port;

try {
  for (const vp of VIEWPORTS) {
    console.log(`\n=== Phase E Quantitative Audit [${RUN_LABEL}] @ ${vp.name} ===`);
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
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 1,
      });
      const page = await ctx.newPage();
      const cdp = await ctx.newCDPSession(page);

      let currentRoute = "";
      for (const stop of AUDIT_STOPS) {
        if (currentRoute !== stop.route) {
          await page.goto(`${RECON_URL}${stop.route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await page.evaluate(() => document.fonts.ready);
          await page
            .waitForFunction(() => !document.getElementById("preloader"), { timeout: 6_000 })
            .catch(() => {});
          await page.waitForTimeout(stop.route === "/" ? 650 : 400);
          currentRoute = stop.route;
        }

        const effectiveSelector =
          vp.width <= 812 && typeof stop.mobileSelector === "string"
            ? stop.mobileSelector
            : stop.selector;
        const effectiveHeaderOffset =
          vp.width <= 812 && typeof stop.mobileHeaderOffset === "number"
            ? stop.mobileHeaderOffset
            : stop.headerOffset;

        await page.evaluate(
          ({ selector, extraRatio, headerOffset }) => {
            const el = document.querySelector(selector);
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
            const targetY =
              selector === "#footer-section"
                ? maxScroll
                : window.scrollY + rect.top + el.scrollHeight * extraRatio - headerOffset;
            window.scrollTo({ top: Math.max(0, Math.min(maxScroll, targetY)), behavior: "instant" });
          },
          { selector: effectiveSelector, extraRatio: stop.extraRatio, headerOffset: effectiveHeaderOffset }
        );
        await page.waitForTimeout(260);
        await snapPng(cdp, path.join(CAP_DIR, `${stop.id}--${vp.name}.png`));
      }

      const scale = vp.width > 800 ? 0.45 : 1.0;
      const outW = Math.round((vp.width * 3 + 32) * scale);
      const outH = Math.round((vp.height + 52) * scale);
      await page.setViewportSize({ width: outW, height: outH });
      await page.goto(`http://127.0.0.1:${helperPort}/canvas-host`, { waitUntil: "load" });

      for (const stop of AUDIT_STOPS) {
        const reconRel = path.relative(process.cwd(), path.join(CAP_DIR, `${stop.id}--${vp.name}.png`));
        let refAbs = "";
        if (stop.refKind === "phase-c") {
          refAbs = path.join(PHASE_C_REF, `${stop.refBase}--${vp.name}.png`);
        } else if (stop.refKind === "phase-b-4") {
          refAbs = path.join(PHASE_B_COMP, `${stop.refBase}--${vp.name}.jpg`);
        } else {
          refAbs = path.join(PHASE_A_COMP, `${stop.refBase}--${vp.name}.jpg`);
        }
        if (!fs.existsSync(refAbs)) continue;
        const refRel = path.relative(process.cwd(), refAbs);

        const metrics = await page.evaluate(
          async ({ refUrl, reconUrl, w, h, refKind, scaleFactor, titleLeft, titleMid }) => {
            const loadImg = (src) =>
              new Promise((resolve, reject) => {
                const im = new Image();
                im.onload = () => resolve(im);
                im.onerror = reject;
                im.src = src;
              });

            const [refImg, reconImg] = await Promise.all([loadImg(refUrl), loadImg(reconUrl)]);

            const offA = document.createElement("canvas");
            offA.width = w;
            offA.height = h;
            const ctxA = offA.getContext("2d");

            if (refKind === "phase-c") {
              ctxA.drawImage(refImg, 0, 0, w, h);
            } else if (refKind === "phase-a-3") {
              // Exact Phase A 3-panel layout (`1412x328` @ 0.32x desktop, `872x646` @ 0.72x mobile)
              const sx = 8;
              const sy = w > 800 ? 32 : 31;
              const sw = w > 800 ? 461 : 281;
              const sh = w > 800 ? 288 : 608;
              ctxA.drawImage(refImg, sx, sy, sw, sh, 0, 0, w, h);
            } else if (refKind === "phase-b-4") {
              // Exact Phase B 4-panel layout (`1650x304` @ 0.28x desktop, `1210x681` @ 0.75x mobile, panel 4)
              const sx = w > 800 ? 1239 : 909;
              const sy = w > 800 ? 44 : 40;
              const sw = w > 800 ? 403 : 293;
              const sh = w > 800 ? 252 : 633;
              ctxA.drawImage(refImg, sx, sy, sw, sh, 0, 0, w, h);
            }

            const offB = document.createElement("canvas");
            offB.width = w;
            offB.height = h;
            const ctxB = offB.getContext("2d");
            ctxB.drawImage(reconImg, 0, 0, w, h);

            const dataA = ctxA.getImageData(0, 0, w, h).data;
            const dataB = ctxB.getImageData(0, 0, w, h).data;
            const offDiff = document.createElement("canvas");
            offDiff.width = w;
            offDiff.height = h;
            const ctxD = offDiff.getContext("2d");
            const diffImg = ctxD.createImageData(w, h);

            const nPx = w * h;
            let absSum = 0;
            let sqSum = 0;
            let over24 = 0;

            const lumA = new Float32Array(nPx);
            const lumB = new Float32Array(nPx);

            for (let i = 0, p = 0; i < dataA.length; i += 4, p += 1) {
              const dr = Math.abs(dataA[i] - dataB[i]);
              const dg = Math.abs(dataA[i + 1] - dataB[i + 1]);
              const db = Math.abs(dataA[i + 2] - dataB[i + 2]);
              const meanD = (dr + dg + db) / 3;
              absSum += meanD;
              sqSum += (dr * dr + dg * dg + db * db) / 3;
              if (meanD > 24) over24 += 1;

              lumA[p] = 0.2126 * dataA[i] + 0.7152 * dataA[i + 1] + 0.0722 * dataA[i + 2];
              lumB[p] = 0.2126 * dataB[i] + 0.7152 * dataB[i + 1] + 0.0722 * dataB[i + 2];

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
                for (let y = 0; y < 8; y += 1) {
                  const row = (by + y) * w + bx;
                  for (let x = 0; x < 8; x += 1) {
                    muX += lumA[row + x];
                    muY += lumB[row + x];
                  }
                }
                muX /= 64;
                muY /= 64;
                let varX = 0;
                let varY = 0;
                let cov = 0;
                for (let y = 0; y < 8; y += 1) {
                  const row = (by + y) * w + bx;
                  for (let x = 0; x < 8; x += 1) {
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
                ssimSum +=
                  ((2 * muX * muY + C1) * (2 * cov + C2)) /
                  ((muX * muX + muY * muY + C1) * (varX + varY + C2));
                ssimBlocks += 1;
              }
            }

            const mae = absSum / nPx;
            const rmse = Math.sqrt(sqSum / nPx);
            const psnr = rmse > 0 ? 20 * Math.log10(255 / rmse) : 99;
            const ssim = ssimBlocks > 0 ? ssimSum / ssimBlocks : 0;
            const pctOver24 = (over24 / nPx) * 100;

            const main = document.getElementById("c");
            main.width = Math.round((w * 3 + 32) * scaleFactor);
            main.height = Math.round((h + 52) * scaleFactor);
            const mctx = main.getContext("2d");
            mctx.save();
            mctx.scale(scaleFactor, scaleFactor);
            mctx.fillStyle = "#0a0c12";
            mctx.fillRect(0, 0, w * 3 + 32, h + 52);
            mctx.font = `600 ${w > 800 ? 22 : 13}px ui-monospace, monospace`;
            mctx.fillStyle = "#e2e8f0";
            mctx.fillText(titleLeft, 14, 34);
            mctx.fillStyle = "#c1ff00";
            mctx.fillText(titleMid, w + 28, 34);
            mctx.fillStyle = "#fb7185";
            mctx.fillText(
              `DIFF | MAE ${mae.toFixed(1)} | PSNR ${psnr.toFixed(2)}dB | SSIM ${ssim.toFixed(3)}`,
              w * 2 + 44,
              34
            );

            mctx.drawImage(offA, 0, 52);
            mctx.drawImage(offB, w + 16, 52);
            mctx.drawImage(offDiff, w * 2 + 32, 52);
            mctx.restore();

            return {
              mae: +mae.toFixed(2),
              rmse: +rmse.toFixed(2),
              psnrDb: +psnr.toFixed(2),
              ssim: +ssim.toFixed(4),
              pctPixelsOver24: +pctOver24.toFixed(2),
            };
          },
          {
            refUrl: `/img?p=${encodeURIComponent(refRel)}`,
            reconUrl: `/img?p=${encodeURIComponent(reconRel)}`,
            w: vp.width,
            h: vp.height,
            refKind: stop.refKind,
            scaleFactor: scale,
            titleLeft: `REFERENCE lusion.co (${stop.id})`,
            titleMid: `RECON [${RUN_LABEL}] (${stop.id})`,
          }
        );

        await snapJpeg(cdp, path.join(COMP_DIR, `${stop.id}--${vp.name}.jpg`), 86);
        const row = { stop: stop.id, route: stop.route, viewport: vp.name, ...metrics };
        results.push(row);
        console.log(
          `  ${stop.id.padEnd(22)} ${vp.name.padEnd(9)} | MAE ${String(row.mae).padStart(6)} | PSNR ${String(
            row.psnrDb
          ).padStart(6)} dB | SSIM ${row.ssim.toFixed(4)} | >24: ${row.pctPixelsOver24}%`
        );
      }
    } finally {
      await browser.close();
    }
  }

  const summary = {
    label: RUN_LABEL,
    generatedAt: new Date().toISOString(),
    meanMae: +(results.reduce((s, r) => s + r.mae, 0) / results.length).toFixed(2),
    meanPsnrDb: +(results.reduce((s, r) => s + r.psnrDb, 0) / results.length).toFixed(2),
    meanSsim: +(results.reduce((s, r) => s + r.ssim, 0) / results.length).toFixed(4),
    stops: results,
  };

  const outJson = path.join(OUT_ROOT, `metrics-${RUN_LABEL}.json`);
  fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));
  console.log(
    `\n=== SUMMARY [${RUN_LABEL}]: Mean MAE=${summary.meanMae} | Mean PSNR=${summary.meanPsnrDb} dB | Mean SSIM=${summary.meanSsim} -> ${path.relative(process.cwd(), outJson)} ===`
  );
} finally {
  helperServer.close();
  await server.stop();
}
