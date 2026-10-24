import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { chromium } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";

const require = createRequire(import.meta.url);

const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT_DIR = path.resolve(process.cwd(), "docs/validation/astronaut-emergence");
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { tag: "1440x900", width: 1440, height: 900, deviceScaleFactor: 1 },
  { tag: "390x844", width: 390, height: 844, deviceScaleFactor: 1 },
];

// Orchestrator mode: spawn one clean Chromium process per viewport so single-process SwiftShader
// never accumulates multiple WebGL contexts across tabs.
if (!process.env.ONLY_VP) {
  const merged = {
    timestamp: new Date().toISOString(),
    viewports: {},
    determinism: {},
    portalContinuity: {},
    assetFailureFallback: null,
    cleanupVerified: null,
    errors: [],
  };

  for (const vp of VIEWPORTS) {
    console.log(`\n=== Launching clean WebGL capture worker for ${vp.tag} ===`);
    execFileSync(process.execPath, [path.resolve(process.cwd(), "scripts/capture-astronaut-emergence.mjs")], {
      cwd: process.cwd(),
      env: { ...process.env, ONLY_VP: vp.tag },
      stdio: "inherit",
    });
    const partPath = path.join(OUT_DIR, `telemetry-${vp.tag}.json`);
    const part = JSON.parse(fs.readFileSync(partPath, "utf8"));
    merged.viewports[vp.tag] = part.stats;
    merged.determinism[vp.tag] = part.determinism;
    merged.portalContinuity[vp.tag] = part.portalContinuity;
    if (part.assetFailureFallback) merged.assetFailureFallback = part.assetFailureFallback;
    if (part.cleanupVerified) merged.cleanupVerified = part.cleanupVerified;
    merged.errors.push(...part.errors);
  }

  fs.writeFileSync(path.join(OUT_DIR, "telemetry-report.json"), JSON.stringify(merged, null, 2));
  console.log("\n=== ALL VIEWPORTS CAPTURED ===");
  console.log("Determinism:", JSON.stringify(merged.determinism));
  console.log("Asset Failure Fallback:", JSON.stringify(merged.assetFailureFallback));
  console.log("Unmount Cleanup:", JSON.stringify(merged.cleanupVerified));
  console.log("Total Errors:", merged.errors.length);
  process.exit(merged.errors.length > 0 ? 1 : 0);
}

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

  const libSubdirs = [
    targetLibDir,
    path.join(targetLibDir, "lib"),
    path.join(targetLibDir, "usr", "lib64"),
  ].filter((d) => fs.existsSync(d));
  process.env.LD_LIBRARY_PATH = [...libSubdirs, process.env.LD_LIBRARY_PATH || ""]
    .filter(Boolean)
    .join(":");
}

async function capturePngBuffer(cdp) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
  return Buffer.from(data, "base64");
}

// Captures all 7 distinct Google Drive reference keyframes (01, 03, 04, 05, 06, 07, 08)
const KEYFRAMES = [
  { id: "01", u: 0.0 },
  { id: "03", u: 0.19 },
  { id: "04", u: 0.40 },
  { id: "05", u: 0.53 },
  { id: "06", u: 0.66 },
  { id: "07", u: 0.79 },
  { id: "08", u: 0.91 },
];

async function runSingleViewport(vp) {
  ensureSparticuzLibs();
  const executablePath = await sparticuzChromium.executablePath();

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

  const errors = [];
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: vp.deviceScaleFactor,
    reducedMotion: "reduce",
  });
  await context.addInitScript(() => {
    sessionStorage.setItem("lusion_booted_v1", "1");
  });

  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);

  page.on("pageerror", (err) => {
    errors.push(`[${vp.tag}] pageerror: ${err.message}`);
  });
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[${vp.tag}] console.error: ${msg.text()}`);
    }
  });

  await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => {
    const el = document.getElementById("home-goal");
    if (el) {
      window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: "instant" });
    }
  });

  await page.waitForFunction(
    () =>
      Boolean(
        window.__goalAstronautTelemetry &&
          (window.__goalAstronautTelemetry.glbLoaded || window.__goalAstronautTelemetry.glbError)
      ),
    null,
    { timeout: 30000 }
  );

  const stats = [];
  for (const kf of KEYFRAMES) {
    const state = await page.evaluate(async (u) => {
      const tel = window.__goalAstronautTelemetry;
      window.__lusionInspector.scrollManager.scrollToPixel(tel.scrollForEmergence(u), true);
      // Re-compute targetY after scrollToPixel refreshes measure() layout metrics
      const targetY = tel.scrollForEmergence(u);
      window.__lusionInspector.scrollManager.scrollToPixel(targetY, true);
      await new Promise((r) => requestAnimationFrame(() => r()));
      const titleEl = document.getElementById("home-goal-tunnel-title");
      const lineEl = document.querySelector(".home-goal-tunnel-title-line");
      return {
        u,
        scrollY: targetY,
        telemetry: { ...window.__goalAstronautTelemetry },
        titleVisible: titleEl ? getComputedStyle(titleEl).display !== "none" : false,
        titleOpacity: titleEl ? Number(getComputedStyle(titleEl).opacity) : 0,
        titleZIndex: titleEl ? getComputedStyle(titleEl).zIndex : "auto",
        titleColumnGap: lineEl ? getComputedStyle(lineEl).columnGap : "0px",
        titleWidthPx: lineEl ? Math.round(lineEl.getBoundingClientRect().width) : 0,
      };
    }, kf.u);

    const pngBuf = await capturePngBuffer(cdp);
    const fileName = `kf-${kf.id}--${vp.tag}.png`;
    fs.writeFileSync(path.join(OUT_DIR, fileName), pngBuf);
    stats.push({ ...state, screenshot: `docs/validation/astronaut-emergence/${fileName}` });
    console.log(
      `[${vp.tag}] KF ${kf.id} (u=${kf.u}): calls=${state.telemetry.drawCalls} tris=${state.telemetry.triangles} ms=${state.telemetry.lastFrameMs} stencil=${state.telemetry.portalStencilActive} titleW=${state.titleWidthPx}px gap=${state.titleColumnGap} z=${state.titleZIndex}`
    );
  }

  // Intermediate Portal Plane Crossing Continuity Check (`u = 0.280`, `0.302` masked -> `0.314` released)
  await page.evaluate(() => {
    window.__lusionInspector.scrollManager.scrollToPixel(
      window.__goalAstronautTelemetry.scrollForEmergence(0.302),
      true
    );
  });
  const beforeBuf = await capturePngBuffer(cdp);
  fs.writeFileSync(path.join(OUT_DIR, `portal-before--${vp.tag}.png`), beforeBuf);

  await page.evaluate(() => {
    window.__lusionInspector.scrollManager.scrollToPixel(
      window.__goalAstronautTelemetry.scrollForEmergence(0.314),
      true
    );
  });
  const afterBuf = await capturePngBuffer(cdp);
  fs.writeFileSync(path.join(OUT_DIR, `portal-after--${vp.tag}.png`), afterBuf);

  // Determinism Test: Forward sweep -> Reverse sweep -> Fast jump back to `u = 0.40`
  for (const u of [0.0, 0.15, 0.30, 0.40]) {
    await page.evaluate((val) => {
      window.__lusionInspector.scrollManager.scrollToPixel(
        window.__goalAstronautTelemetry.scrollForEmergence(val),
        true
      );
    }, u);
  }
  const forwardHash = crypto
    .createHash("sha256")
    .update(await capturePngBuffer(cdp))
    .digest("hex");

  for (const u of [0.95, 0.79, 0.10, 0.91, 0.40]) {
    await page.evaluate((val) => {
      window.__lusionInspector.scrollManager.scrollToPixel(
        window.__goalAstronautTelemetry.scrollForEmergence(val),
        true
      );
    }, u);
  }
  const reverseJumpHash = crypto
    .createHash("sha256")
    .update(await capturePngBuffer(cdp))
    .digest("hex");

  // Desktop extra checks: Unmount / navigation cleanup (`/` -> `/about`) & Graceful Asset Failure Fallback
  let cleanupVerified = null;
  let assetFailureFallback = null;
  if (vp.tag === "1440x900") {
    await page.goto(`${BASE_URL}/about`, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(400);
    cleanupVerified = await page.evaluate(() => ({
      path: location.pathname,
      telemetryRemovedOnUnmount: typeof window.__goalAstronautTelemetry === "undefined",
      goalOverlayCanvasesRemaining: document.querySelectorAll("#home-goal canvas").length,
    }));

    await page.goto(`${BASE_URL}/?simulateGlbError=1`, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    await page.waitForFunction(
      () => Boolean(window.__goalAstronautTelemetry?.fallbackVisible),
      null,
      { timeout: 15000 }
    );
    assetFailureFallback = await page.evaluate(() => {
      const fb = document.querySelector('[data-testid="goal-astronaut-fallback"]');
      return {
        glbLoaded: window.__goalAstronautTelemetry?.glbLoaded ?? false,
        fallbackVisible: window.__goalAstronautTelemetry?.fallbackVisible ?? false,
        posterDisplay: fb ? getComputedStyle(fb).display : "missing",
        posterTextPresent: Boolean(fb?.textContent?.trim()),
      };
    });
  }

  fs.writeFileSync(
    path.join(OUT_DIR, `telemetry-${vp.tag}.json`),
    JSON.stringify(
      {
        stats,
        determinism: {
          forwardSha256: forwardHash,
          reverseJumpSha256: reverseJumpHash,
          exactMatch: forwardHash === reverseJumpHash,
        },
        portalContinuity: {
          beforeBytes: beforeBuf.length,
          afterBytes: afterBuf.length,
        },
        cleanupVerified,
        assetFailureFallback,
        errors,
      },
      null,
      2
    )
  );
  process.exit(0);
}

const targetVp = VIEWPORTS.find((v) => v.tag === process.env.ONLY_VP);
runSingleViewport(targetVp).catch((err) => {
  console.error(err);
  process.exit(1);
});
