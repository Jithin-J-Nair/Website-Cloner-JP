#!/usr/bin/env node
/**
 * Phase A+ — Real Browser Visual Validation & Reference-vs-Local Comparison Harness
 *
 * Uses headless Chromium + Vulkan SwiftShader WebGL2 + CDP `Page.captureScreenshot`
 * at `1440x900` (desktop) and `390x844` (mobile) against:
 *   1. Reference capture server (`http://127.0.0.1:4173`, `/tmp/lusion-ref/serve.cjs`)
 *   2. Local Next.js server (`http://127.0.0.1:3000`)
 *
 * Records HTTP status, failed requests, console/page errors, WebGL2 renderer info,
 * key DOM geometry, full-frame pixel metrics, and side-by-side diff composites.
 */

import fs from "node:fs";
import path from "node:path";
import http from "node:http";
import { spawn, execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const REPO_ROOT = process.cwd();
const REF_DIR = process.env.LUSION_REF_DIR || "/tmp/lusion-ref";
const REF_URL = process.env.REF_BASE_URL || "http://127.0.0.1:4173";
const LOCAL_URL = process.env.LOCAL_BASE_URL || "http://127.0.0.1:3000";
const PHASE_SLUG = process.env.VALIDATION_PHASE || "phase-a";
const OUT_DIR = path.join(REPO_ROOT, "docs", "validation", PHASE_SLUG);
const PY_BIN = fs.existsSync("/tmp/pytools/bin/python") ? "/tmp/pytools/bin/python" : "python3";

const playwrightPath = fs.existsSync("/tmp/browser-check/node_modules/playwright-core")
  ? "/tmp/browser-check/node_modules/playwright-core"
  : "playwright-core";
const { chromium } = require(playwrightPath);

const VIEWPORTS = [
  { id: "1440x900", width: 1440, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  { id: "390x844", width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true },
];

const TARGET_SCENARIOS = [
  {
    id: "home-hero",
    route: "/",
    scrollSelector: null,
    keySelectors: ["#header", "#home-hero", "#home-hero-title", "#home-hero-visual-container", "#scroll-indicator"],
  },
  {
    id: "home-featured",
    route: "/",
    reuseOpenPage: true,
    scrollSelector: "#home-featured",
    fallbackLocalScrollRatio: 0.36,
    keySelectors: ["#home-featured", "#home-featured-title", ".project-item"],
  },
  {
    id: "home-footer",
    route: "/",
    reuseOpenPage: true,
    scrollSelector: "#footer-section",
    fallbackLocalScrollRatio: 0.92,
    keySelectors: ["#end-section", "#footer-section", "#scroll-nav-section"],
  },
  {
    id: "about-hero",
    route: "/about",
    scrollSelector: null,
    keySelectors: ["#about-who", "#about-clients", "#about-award", "#about-capability"],
  },
  {
    id: "about-awards-capability",
    route: "/about",
    reuseOpenPage: true,
    scrollSelector: "#about-award",
    fallbackLocalScrollRatio: 0.65,
    keySelectors: ["#about-award", "#about-capability"],
  },
  {
    id: "projects-archive",
    route: "/projects",
    scrollSelector: null,
    keySelectors: ["#projects", "#projects-main", "#projects-main-title", ".project-item"],
  },
  {
    id: "project-oryzo-ai",
    route: "/projects/oryzo_ai",
    scrollSelector: null,
    keySelectors: ["#project-details", "#project-details-title", "#project-details-preview"],
  },
];

function checkPortOpen(urlStr) {
  return new Promise((resolve) => {
    const req = http.get(urlStr, (res) => {
      res.resume();
      resolve(res.statusCode !== undefined);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(1500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureReferenceServer() {
  if (await checkPortOpen(`${REF_URL}/`)) {
    return null;
  }
  const child = spawn("node", [path.join(REF_DIR, "serve.cjs")], {
    cwd: REF_DIR,
    stdio: "ignore",
    detached: true,
  });
  child.unref();
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 300));
    if (await checkPortOpen(`${REF_URL}/`)) {
      return child;
    }
  }
  throw new Error(`Reference server failed to start on ${REF_URL}`);
}

async function waitForPageSettle(page, isReference) {
  if (isReference) {
    // 1. Wait until #preloader sets display: none (or up to 40s under SwiftShader shader compile)
    const start = Date.now();
    while (Date.now() - start < 42000) {
      const done = await page
        .evaluate(() => {
          const p = document.getElementById("preloader");
          if (!p) return true;
          const cs = getComputedStyle(p);
          return cs.display === "none" || cs.visibility === "hidden" || Number(cs.opacity) === 0;
        })
        .catch(() => false);
      if (done) break;
      await new Promise((r) => setTimeout(r, 1200));
    }
    // 2. Wait until entrance transforms on hero/header text finish sliding in under SwiftShader
    await new Promise((r) => setTimeout(r, 9500));
  } else {
    // Local Next.js server preloader + WebGL stage settle
    await new Promise((r) => setTimeout(r, 4800));
  }
}

async function captureCdpPng(cdpSession, page, outFile) {
  await page
    .evaluate(() => {
      window.__savedRAF = window.requestAnimationFrame;
      window.requestAnimationFrame = () => 0;
    })
    .catch(() => {});
  await new Promise((r) => setTimeout(r, 120));
  const shot = await cdpSession.send("Page.captureScreenshot", { format: "png" });
  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  fs.writeFileSync(outFile, Buffer.from(shot.data, "base64"));
  await page
    .evaluate(() => {
      if (window.__savedRAF) {
        window.requestAnimationFrame = window.__savedRAF;
      }
    })
    .catch(() => {});
}

async function collectTelemetry(page, selectors) {
  return page.evaluate((sels) => {
    let webglRenderer = null;
    let webglVendor = null;
    const canvas = document.querySelector("canvas");
    try {
      const probe = document.createElement("canvas");
      const gl = probe.getContext("webgl2") || probe.getContext("webgl");
      if (gl) {
        const ext = gl.getExtension("WEBGL_debug_renderer_info");
        webglVendor = ext ? gl.getParameter(ext.UNMASKED_VENDOR_WEBGL) : gl.getParameter(gl.VENDOR);
        webglRenderer = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
      }
    } catch {
      // ignore
    }
    const h1 = document.querySelector("h1");
    const h2 = document.querySelector("h2");
    const boxMap = {};
    for (const sel of sels) {
      const el = document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        boxMap[sel] = {
          present: true,
          count: document.querySelectorAll(sel).length,
          x: Math.round(r.x),
          y: Math.round(r.y),
          width: Math.round(r.width),
          height: Math.round(r.height),
        };
      } else {
        boxMap[sel] = { present: false, count: 0 };
      }
    }
    return {
      title: document.title,
      h1Text: h1 ? h1.textContent.replace(/\s+/g, " ").trim() : null,
      h2Text: h2 ? h2.textContent.replace(/\s+/g, " ").trim() : null,
      scrollY: Math.round(window.scrollY),
      docHeight: document.documentElement.scrollHeight,
      canvasPresent: Boolean(canvas),
      canvasSize: canvas ? `${canvas.width}x${canvas.height}` : null,
      webglVendor,
      webglRenderer,
      selectors: boxMap,
    };
  }, selectors);
}

async function captureSiteRun(browser, baseUrl, isReference, viewport) {
  const context = await browser.newContext({
    viewport: { width: viewport.width, height: viewport.height },
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile: viewport.isMobile,
    hasTouch: viewport.hasTouch,
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  let consoleErrors = [];
  let pageErrors = [];
  let failedRequests = [];
  let upstreamWorkarounds = [];

  if (isReference) {
    // Upstream snapshot omits desktop LOD /assets/models/about/sphere_l.buf (404 freezes /about preloader at 069).
    // Record the upstream 404 explicitly AND fulfill from sphere_m.buf so desktop /about completes preloading.
    await page.route("**/assets/models/about/sphere_l.buf", async (route) => {
      upstreamWorkarounds.push(
        "Upstream snapshot missing /assets/models/about/sphere_l.buf (HTTP 404 without fallback); fulfilled from sphere_m.buf to unblock /about preloader past 069."
      );
      const fallbackBuf = fs.readFileSync(path.join(REF_DIR, "assets/models/about/sphere_m.buf"));
      await route.fulfill({
        status: 200,
        contentType: "application/octet-stream",
        body: fallbackBuf,
      });
    });
  }

  page.on("console", (msg) => {
    if (msg.type() === "error") consoleErrors.push(msg.text());
  });
  page.on("pageerror", (err) => {
    pageErrors.push(String(err));
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      failedRequests.push(`${res.status()} ${res.url()}`);
    }
  });
  page.on("requestfailed", (req) => {
    const errText = req.failure()?.errorText || "failed";
    if (!errText.includes("ERR_ABORTED")) {
      failedRequests.push(`ERR (${errText}) ${req.url()}`);
    }
  });

  const results = {};
  let currentRoute = null;
  let lastHttpStatus = null;

  for (const scenario of TARGET_SCENARIOS) {
    if (!scenario.reuseOpenPage || currentRoute !== scenario.route) {
      consoleErrors = [];
      pageErrors = [];
      failedRequests = [];
      upstreamWorkarounds = [];
      const resp = await page.goto(`${baseUrl}${scenario.route}`, {
        waitUntil: "domcontentloaded",
        timeout: 45000,
      });
      lastHttpStatus = resp ? resp.status() : null;
      currentRoute = scenario.route;
      await waitForPageSettle(page, isReference);
    }

    if (scenario.scrollSelector) {
      await page.mouse.move(Math.round(viewport.width / 2), Math.round(viewport.height / 2));
      if (isReference) {
        // Lusion's custom virtual smooth scroller consumes wheel events rather than native window.scrollTo.
        for (let step = 0; step < 10; step++) {
          const delta = await page.evaluate((sel) => {
            const el = document.querySelector(sel);
            if (!el) return 0;
            return el.getBoundingClientRect().top;
          }, scenario.scrollSelector);
          if (Math.abs(delta) < 120) break;
          await page.mouse.wheel(0, Math.max(-1400, Math.min(1400, Math.round(delta * 0.85))));
          await new Promise((r) => setTimeout(r, 1100));
        }
        await new Promise((r) => setTimeout(r, 2500));
      } else {
        await page.evaluate(
          ({ sel, ratio }) => {
            const el = document.querySelector(sel);
            if (el) {
              const top = el.getBoundingClientRect().top + window.scrollY;
              window.scrollTo({ top, behavior: "instant" });
            } else {
              const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
              window.scrollTo({ top: Math.round(maxScroll * ratio), behavior: "instant" });
            }
          },
          { sel: scenario.scrollSelector, ratio: scenario.fallbackLocalScrollRatio ?? 0.5 }
        );
        await new Promise((r) => setTimeout(r, 1400));
      }
    }

    const prefix = isReference ? "reference" : "local";
    const shotRel = `docs/validation/${PHASE_SLUG}/raw/${prefix}-${scenario.id}-${viewport.id}.png`;
    await captureCdpPng(cdp, page, path.join(REPO_ROOT, shotRel));
    const telemetry = await collectTelemetry(page, scenario.keySelectors);

    results[scenario.id] = {
      scenarioId: scenario.id,
      route: scenario.route,
      viewport: viewport.id,
      httpStatus: lastHttpStatus,
      screenshot: shotRel,
      consoleErrorCount: consoleErrors.length,
      consoleErrors: [...consoleErrors],
      pageErrorCount: pageErrors.length,
      pageErrors: [...pageErrors],
      failedRequestCount: failedRequests.length,
      failedRequests: [...failedRequests],
      upstreamWorkarounds: [...upstreamWorkarounds],
      telemetry,
    };
    console.log(
      `  [${prefix.padEnd(9)}] ${viewport.id.padEnd(9)} ${scenario.id.padEnd(25)} HTTP=${lastHttpStatus} errs=${consoleErrors.length} title=${JSON.stringify(telemetry.title)}`
    );
  }

  await context.close().catch(() => {});
  return results;
}

function buildCompositesAndMetrics(allPairs) {
  const pyCode = `
import json, math, sys
from pathlib import Path
from PIL import Image, ImageChops, ImageDraw, ImageEnhance
import numpy as np

repo = Path(sys.argv[1])
out_dir = Path(sys.argv[2])
pairs = json.loads(sys.argv[3])
comp_dir = out_dir / "composites"
comp_dir.mkdir(parents=True, exist_ok=True)

metrics_out = []
for p in pairs:
    ref_im = Image.open(repo / p["refShot"]).convert("RGB")
    loc_im = Image.open(repo / p["locShot"]).convert("RGB")
    assert ref_im.size == loc_im.size, f"Size mismatch: {ref_im.size} vs {loc_im.size}"
    w, h = ref_im.size
    a = np.asarray(ref_im, dtype=np.float32)
    b = np.asarray(loc_im, dtype=np.float32)
    diff = np.abs(a - b)
    mae = float(np.mean(diff))
    mse = float(np.mean(diff ** 2))
    rmse = math.sqrt(mse)
    psnr = 99.0 if mse == 0 else float(10.0 * math.log10((255.0 ** 2) / mse))
    pct_diff_16 = float(np.mean(np.max(diff, axis=2) > 16.0) * 100.0)

    # Convert raw PNGs to lossless/near-lossless compact WebP or optimize PNG in-place to save snapshot space
    ref_im.save(repo / p["refShot"], optimize=True)
    loc_im.save(repo / p["locShot"], optimize=True)

    # Side-by-side composite [Reference | Local | 2x Diff Heatmap]
    panel_w = 460 if w >= 1000 else 280
    panel_h = int(round(panel_w * h / w))
    ra = ref_im.resize((panel_w, panel_h), Image.Resampling.LANCZOS)
    rb = loc_im.resize((panel_w, panel_h), Image.Resampling.LANCZOS)
    heat = ImageEnhance.Brightness(ImageChops.difference(ref_im, loc_im)).enhance(2.0).resize((panel_w, panel_h), Image.Resampling.LANCZOS)

    canvas = Image.new("RGB", (panel_w * 3 + 32, panel_h + 40), (15, 17, 25))
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 12), f"REFERENCE ({w}x{h}) {p['route']} [{p['scenarioId']}]", fill=(193, 255, 0))
    draw.text((panel_w + 16, 12), f"LOCAL HTTP {p['locHttp']} ({p['locTitle'][:28]})", fill=(240, 241, 250))
    draw.text((panel_w * 2 + 24, 12), f"DIFF: {pct_diff_16:.1f}% px >16 | MAE {mae:.1f} | PSNR {psnr:.2f}dB", fill=(255, 120, 110))
    canvas.paste(ra, (4, 34))
    canvas.paste(rb, (panel_w + 16, 34))
    canvas.paste(heat, (panel_w * 2 + 28, 34))

    comp_path = comp_dir / f"{p['scenarioId']}--{p['viewport']}.jpg"
    canvas.save(comp_path, quality=88, optimize=True)
    metrics_out.append({
        "scenarioId": p["scenarioId"],
        "viewport": p["viewport"],
        "route": p["route"],
        "dimensions": f"{w}x{h}",
        "maeRgb255": round(mae, 2),
        "rmseRgb255": round(rmse, 2),
        "psnrDb": round(psnr, 2),
        "percentPixelsDiffGt16": round(pct_diff_16, 2),
        "compositeImage": comp_path.relative_to(repo).as_posix(),
    })

print(json.dumps(metrics_out))
`;

  const raw = execFileSync(PY_BIN, ["-c", pyCode, REPO_ROOT, OUT_DIR, JSON.stringify(allPairs)], {
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024,
  });
  return JSON.parse(raw.trim());
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const spawnedRef = await ensureReferenceServer();
  const localAlive = await checkPortOpen(`${LOCAL_URL}/`);
  if (!localAlive) {
    throw new Error(`Local Next.js server is not reachable at ${LOCAL_URL}/`);
  }

  const browser = await chromium.launch({
    executablePath: "/tmp/chromium",
    headless: true,
    env: {
      ...process.env,
      LD_LIBRARY_PATH: "/tmp/chromium-libs:/tmp/chromium-libs/lib",
      VK_ICD_FILENAMES: "/tmp/chromium-libs/vk_swiftshader_icd.json",
      FONTCONFIG_FILE: "/tmp/chromium-libs/fonts.conf",
    },
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
    ],
  });

  try {
    const report = {
      phase: PHASE_SLUG,
      capturedAt: new Date().toISOString(),
      referenceBaseUrl: REF_URL,
      localBaseUrl: LOCAL_URL,
      viewports: VIEWPORTS,
      runs: {},
      comparisons: [],
    };

    const pairs = [];
    for (const vp of VIEWPORTS) {
      console.log(`\n=== Capturing viewport ${vp.id} ===`);
      const refRes = await captureSiteRun(browser, REF_URL, true, vp);
      const locRes = await captureSiteRun(browser, LOCAL_URL, false, vp);
      report.runs[vp.id] = { reference: refRes, local: locRes };

      for (const sc of TARGET_SCENARIOS) {
        pairs.push({
          scenarioId: sc.id,
          viewport: vp.id,
          route: sc.route,
          refShot: refRes[sc.id].screenshot,
          locShot: locRes[sc.id].screenshot,
          locHttp: locRes[sc.id].httpStatus,
          locTitle: locRes[sc.id].telemetry.title || "",
        });
      }
    }

    report.comparisons = buildCompositesAndMetrics(pairs);
    const outJson = path.join(OUT_DIR, "comparison-report.json");
    fs.writeFileSync(outJson, JSON.stringify(report, null, 2) + "\n");
    console.log(`\n[browser-compare] Wrote full report to ${outJson}`);
  } finally {
    await Promise.race([browser.close().catch(() => {}), new Promise((r) => setTimeout(r, 1500))]);
    try {
      execFileSync("killall", ["-9", "chromium"], { stdio: "ignore" });
    } catch {
      // already exited
    }
    if (spawnedRef?.pid) {
      try {
        process.kill(spawnedRef.pid, "SIGTERM");
      } catch {
        // already exited
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
