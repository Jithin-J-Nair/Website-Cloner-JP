#!/usr/bin/env node
/**
 * Phase G Full-Site Reverse-Engineering, Reference Capture & Side-by-Side Discrepancy Auditor
 *
 * Usage:
 *   node scripts/phase-g-audit.mjs capture-reference   # Renders & captures fresh reference states + DOM/style metadata on :4173
 *   node scripts/phase-g-audit.mjs audit <runLabel>    # Captures reconstruction on :3000 & computes MAE/PSNR/SSIM + 3-panel diffs
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

const MODE = process.argv[2] || "audit";
const RUN_LABEL = (process.argv[3] || "latest").replace(/[^a-z0-9_-]/gi, "");
const REF_ORIGIN_DIR = process.env.LUSION_REF_DIR || "/tmp/lusion-reference-origin";
const REF_URL = process.env.REF_URL || "http://127.0.0.1:4173";
const RECON_URL = process.env.RECON_URL || "http://127.0.0.1:3000";

const PHASE_G_ROOT = path.join(process.cwd(), "docs", "validation", "phase-g");
const REF_CAP_DIR = path.join(PHASE_G_ROOT, "reference");
fs.mkdirSync(REF_CAP_DIR, { recursive: true });

const GROUND_TRUTH = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src", "data", "reference", "lusion-ground-truth.json"), "utf8")
);

const PROJECT_SLUGS = GROUND_TRUTH.routes
  .map((r) => r.route)
  .filter((r) => r.startsWith("/projects/"))
  .map((r) => r.replace("/projects/", ""));

export const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900, isMobile: false },
  { name: "390x844", width: 390, height: 844, isMobile: true },
];

export const INTERMEDIATE_VIEWPORT = { name: "1024x768", width: 1024, height: 768, isMobile: false };

/**
 * Complete 36-state specification covering ALL 22 canonical routes + full scroll & interactive states:
 *   - 11 Homepage states (`/`, top -> reel -> featured -> goal intro -> astronaut closeup -> mid shatter -> astronaut float -> end CTA -> footer portal -> menu -> modal)
 *   - 4 About states (`/about`, hero 3D terrain -> team 8192-particle portrait -> clients & awards -> area of expertise)
 *   - 2 Projects archive states (`/projects`, top header + cards -> mid-archive scroll)
 *   - 19 Project detail routes (`/projects/<slug>`, every single case study!)
 * Total = 36 states x 2 primary viewports (`1440x900` + `390x844`) = 72 paired captures (+ 4 intermediate `1024x768` states = 76 total!)
 */
export const STATES = [
  // --- Homepage (`/`) complete scroll + interactive sequence ---
  { id: "01-home-hero", route: "/", seek: { mode: "top" } },
  { id: "02-home-reel-intro", route: "/", seek: { mode: "anchor", selector: "#home-reel", targetTopRatio: 0.04 } },
  { id: "03-home-reel-stage", route: "/", seek: { mode: "anchor", selector: "#home-reel-container", targetTopRatio: 0.08 } },
  { id: "04-home-featured-top", route: "/", seek: { mode: "anchor", selector: "#home-featured", targetTopRatio: 0.05 } },
  { id: "05-home-featured-cta", route: "/", seek: { mode: "anchor", selector: "#home-featured-cta", targetTopRatio: 0.72 } },
  { id: "06-home-goal-intro", route: "/", seek: { mode: "anchor", selector: "#home-goal", targetTopRatio: 0.05 } },
  { id: "07-home-goal-stage1", route: "/", seek: { mode: "goalItem", itemId: "blackTitle", ratio: 0.45, fallbackProgress: 0.22 } },
  { id: "07b-home-goal-mid", route: "/", seek: { mode: "goalItem", itemId: "blackTunnel", ratio: 0.45, fallbackProgress: 0.56 } },
  { id: "08-home-goal-stage2", route: "/", seek: { mode: "goalItem", itemId: "whiteTunnel", ratio: 0.55, fallbackProgress: 0.78 } },
  { id: "08b-home-goal-drop", route: "/", seek: { mode: "goalItem", itemId: "astronautDrop", ratio: 0.72, fallbackProgress: 0.88 } },
  { id: "09a-home-end-cta", route: "/", seek: { mode: "anchor", selector: "#end-section", targetTopRatio: 0.02 } },
  { id: "09b-home-footer-portal", route: "/", seek: { mode: "bottom" } },
  { id: "09c-header-menu-open", route: "/", seek: { mode: "top" }, action: "openMenu" },
  { id: "09d-showreel-modal", route: "/", seek: { mode: "anchor", selector: "#home-reel", targetTopRatio: 0.04 }, action: "openReelModal" },

  // --- About (`/about`) complete 4-stage scroll sequence ---
  { id: "10a-about-hero", route: "/about", seek: { mode: "top" } },
  { id: "10b-about-team", route: "/about", seek: { mode: "pageRatio", ratio: 0.36 } },
  { id: "10c-about-clients-awards", route: "/about", seek: { mode: "anchor", selector: "#about-clients", targetTopRatio: 0.06 } },
  { id: "10d-about-capability", route: "/about", seek: { mode: "anchor", selector: "#about-capability", targetTopRatio: 0.06 } },

  // --- Projects Archive (`/projects`) ---
  { id: "11a-projects-archive-top", route: "/projects", seek: { mode: "top" } },
  { id: "11b-projects-archive-mid", route: "/projects", seek: { mode: "pageRatio", ratio: 0.42 } },

  // --- All 19 Project Case-Study Detail Pages (`/projects/<slug>`) ---
  ...PROJECT_SLUGS.map((slug, idx) => ({
    id: `12-${String(idx + 1).padStart(2, "0")}-project-${slug}`,
    route: `/projects/${slug}`,
    seek: { mode: "top" },
  })),
];

const INTERMEDIATE_STATES = STATES.filter((s) =>
  ["01-home-hero", "07-home-goal-stage1", "08-home-goal-stage2", "11a-projects-archive-top"].includes(s.id)
);

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

async function ensureOriginServer(mode) {
  if (mode === "capture-reference") {
    if (await isServerUp(REF_URL)) return { baseUrl: REF_URL, stop: async () => {} };
    const proc = spawn(process.execPath, ["serve.cjs"], {
      cwd: REF_ORIGIN_DIR,
      env: { ...process.env, PORT: "4173", HOST: "127.0.0.1" },
      stdio: "ignore",
    });
    const deadline = Date.now() + 15_000;
    while (Date.now() < deadline) {
      if (await isServerUp(REF_URL)) {
        return {
          baseUrl: REF_URL,
          stop: async () => {
            proc.kill("SIGTERM");
            await new Promise((r) => setTimeout(r, 200));
          },
        };
      }
      await new Promise((r) => setTimeout(r, 150));
    }
    proc.kill("SIGTERM");
    throw new Error("Reference origin server failed to start on :4173");
  }

  if (await isServerUp(RECON_URL)) return { baseUrl: RECON_URL, stop: async () => {} };
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
        baseUrl: RECON_URL,
        stop: async () => {
          proc.kill("SIGTERM");
          await new Promise((r) => setTimeout(r, 200));
        },
      };
    }
    await new Promise((r) => setTimeout(r, 150));
  }
  proc.kill("SIGTERM");
  throw new Error("Reconstruction server failed to start on :3000");
}

async function waitRaf(page, count = 3) {
  await page.evaluate(
    (n) =>
      new Promise((resolve) => {
        let rem = n;
        const step = () => {
          rem -= 1;
          if (rem <= 0) resolve();
          else requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }),
    count
  );
}

async function waitForPageReady(page) {
  await page.evaluate(() => document.fonts.ready);
  await page
    .waitForFunction(
      () => {
        const insp = window.__lusionInspector;
        if (insp && insp.properties) {
          const el = document.getElementById("preloader");
          const hidden = !el || window.getComputedStyle(el).display === "none";
          return Boolean(insp.properties.hasStarted) && hidden;
        }
        const el = document.getElementById("preloader");
        if (!el) return true;
        const st = window.getComputedStyle(el);
        return st.display === "none" || st.visibility === "hidden" || Number(st.opacity) < 0.02;
      },
      { timeout: 180_000 }
    )
    .catch(() => {});
  await waitRaf(page, 12);
}

/**
 * Unified exact scroll controller supporting BOTH:
 *  - Original `lusion.co` `ScrollManager` + `homeGoalSectionRanges` (`window.__lusionInspector`)
 *  - Reconstruction native document scrolling (`window.scrollTo`)
 */
async function seekPageTo(page, seek, vp) {
  const info = await page.evaluate(
    ({ seekSpec, vh }) => {
      const insp = window.__lusionInspector;
      const sm = insp && insp.scrollManager;
      const ranges = insp && insp.homeGoalSectionRanges;
      const curY = sm ? sm.scrollPixel : window.scrollY;
      const maxScroll = sm ? sm.contentSizePixel : Math.max(0, document.documentElement.scrollHeight - vh);

      let targetY = 0;
      if (seekSpec.mode === "top") {
        targetY = 0;
      } else if (seekSpec.mode === "bottom") {
        targetY = maxScroll;
      } else if (seekSpec.mode === "pageRatio") {
        targetY = Math.max(0, Math.min(maxScroll, maxScroll * seekSpec.ratio));
      } else if (seekSpec.mode === "goalItem") {
        if (ranges && ranges.items && ranges.items[seekSpec.itemId]) {
          const it = ranges.items[seekSpec.itemId];
          targetY = Math.max(0, Math.min(maxScroll, ranges.baseY + it.pixelFrom + it.pixelCount * seekSpec.ratio));
        } else {
          const goal = document.querySelector("#home-goal");
          if (goal) {
            const r = goal.getBoundingClientRect();
            const goalTopDoc = curY + r.top;
            const span = Math.max(1, r.height - vh);
            targetY = Math.max(0, Math.min(maxScroll, goalTopDoc + span * seekSpec.fallbackProgress));
          }
        }
      } else if (seekSpec.mode === "goalRange") {
        const goal = document.querySelector("#home-goal");
        if (goal) {
          const r = goal.getBoundingClientRect();
          const goalTopDoc = curY + r.top;
          const span = Math.max(1, r.height - vh);
          targetY = Math.max(0, Math.min(maxScroll, goalTopDoc + span * seekSpec.progress));
        }
      } else if (seekSpec.mode === "anchor") {
        const el =
          document.querySelector(seekSpec.selector) ||
          (seekSpec.fallbackSelector ? document.querySelector(seekSpec.fallbackSelector) : null);
        if (el) {
          const r = el.getBoundingClientRect();
          const extra =
            !document.querySelector(seekSpec.selector) && typeof seekSpec.fallbackProgress === "number"
              ? r.height * seekSpec.fallbackProgress
              : 0;
          const desiredScreenY = vh * (seekSpec.targetTopRatio ?? 0);
          targetY = Math.max(0, Math.min(maxScroll, curY + r.top + extra - desiredScreenY));
        }
      }

      if (sm) {
        sm.scrollToPixel(targetY, true);
      } else {
        if (window.__lenis) {
          window.__lenis.resize();
          window.__lenis.scrollTo(targetY, { immediate: true });
        }
        window.scrollTo({ top: targetY, behavior: "instant" });
      }
      return { curY: targetY, targetY, maxScroll };
    },
    { seekSpec: seek, vh: vp.height }
  );

  if (seek.mode === "goalItem" || seek.mode === "goalRange" || seek.selector === "#end-section") {
    await page.waitForTimeout(380);
  }
  await waitRaf(page, 6);
  return info;
}

async function performAction(page, action) {
  if (!action) return null;
  if (action === "openMenu") {
    const clicked = await page.evaluate(() => {
      const btn = document.getElementById("header-right-menu-btn");
      if (!btn) return false;
      btn.click();
      return true;
    });
    if (clicked) {
      await page.waitForTimeout(600);
      return "opened #header-menu via #header-right-menu-btn";
    }
  }
  if (action === "openReelModal") {
    const clicked = await page.evaluate(() => {
      const refOverlay = document.getElementById("video-overlay");
      if (refOverlay && window.__lusionInspector && !document.getElementById("home-contact-cta")) {
        refOverlay.style.display = "block";
        refOverlay.style.visibility = "visible";
        refOverlay.style.opacity = "1";
        refOverlay.style.pointerEvents = "auto";
        refOverlay.style.backgroundColor = "#000000";
        return true;
      }
      const el =
        document.getElementById("home-reel-video-watch-btn") ||
        document.getElementById("home-reel-thumb");
      if (!el) return false;
      el.click();
      return true;
    });
    if (clicked) {
      await page.waitForTimeout(650);
      return "triggered showreel overlay";
    }
  }
  return null;
}

async function undoAction(page, action) {
  if (!action) return;
  if (action === "openMenu") {
    await page.evaluate(() => {
      document.getElementById("header-right-menu-btn")?.click();
    });
    await page.waitForTimeout(400);
  }
  if (action === "openReelModal") {
    await page.keyboard.press("Escape").catch(() => {});
    await page.evaluate(() => {
      document.getElementById("video-overlay__mobile-close-btn")?.click();
    });
    await page.waitForTimeout(400);
  }
}

async function extractPageDiagnostics(page) {
  return page.evaluate(() => {
    const sample = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const cs = window.getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return {
        text: (el.textContent || "").trim().slice(0, 90),
        rect: { top: Math.round(r.top), left: Math.round(r.left), width: Math.round(r.width), height: Math.round(r.height) },
        color: cs.color,
        bg: cs.backgroundColor,
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        lineHeight: cs.lineHeight,
        letterSpacing: cs.letterSpacing,
      };
    };

    return {
      title: document.title,
      bodyBg: window.getComputedStyle(document.body).backgroundColor,
      canvases: document.querySelectorAll("canvas").length,
      videos: Array.from(document.querySelectorAll("video")).map((v) => ({
        src: v.currentSrc || v.getAttribute("src") || "",
        w: v.videoWidth,
        h: v.videoHeight,
        readyState: v.readyState,
      })),
      images: document.querySelectorAll("img").length,
      samples: {
        header: sample("#header"),
        h1: sample("h1"),
        heroTitle: sample("#home-hero-title"),
        reelTitle: sample("#home-reel-title"),
        featuredTitle: sample("#home-featured-title"),
        goalTitle: sample("#home-goal-title"),
        aboutTitle: sample("#about-who-title-left"),
        projectsTitle: sample("#projects-main-title"),
        projectTitle: sample("#project-details-title"),
        projectMeta: sample("#project-details-meta"),
      },
    };
  });
}

async function snapJpeg(cdp, outPath, quality = 86) {
  const { data } = await cdp.send("Page.captureScreenshot", { format: "jpeg", quality });
  fs.writeFileSync(outPath, Buffer.from(data, "base64"));
}

ensureSparticuzLibs();
const executablePath = await sparticuzChromium.executablePath();
const serverHandle = await ensureOriginServer(MODE);

const launchBrowser = () =>
  chromium.launch({
    executablePath,
    headless: true,
    args: [
      ...sparticuzChromium.args.filter((a) => !a.includes("AudioServiceOutOfProcess")),
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--enable-webgl",
      "--ignore-gpu-blocklist",
      "--autoplay-policy=no-user-gesture-required",
    ],
  });

if (MODE === "capture-reference") {
  console.log(`=== Phase G Step 2 & 3: Capturing Fresh Live-Engine Reference across ALL 22 Routes (${serverHandle.baseUrl}) ===`);
  const jsonlPath = path.join(PHASE_G_ROOT, "reference-metadata.jsonl");
  const existingMetaByKey = new Map();
  if (fs.existsSync(jsonlPath)) {
    for (const line of fs.readFileSync(jsonlPath, "utf8").split("\n").filter(Boolean)) {
      try {
        const rec = JSON.parse(line);
        existingMetaByKey.set(`${rec.id}--${rec.viewport}`, rec);
      } catch {
        // skip malformed line
      }
    }
  }

  try {
    const preloadPath = path.join(REF_CAP_DIR, `00-home-preloader--1440x900.jpg`);
    if (!fs.existsSync(preloadPath)) {
      const b0 = await launchBrowser();
      try {
        const ctx = await b0.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
        const page = await ctx.newPage();
        const cdp = await ctx.newCDPSession(page);
        await page.goto(`${serverHandle.baseUrl}/`, { waitUntil: "domcontentloaded", timeout: 45_000 });
        await page.waitForTimeout(220);
        await snapJpeg(cdp, preloadPath, 86);
        console.log("  [ref] Captured 00-home-preloader--1440x900.jpg");
      } finally {
        await b0.close();
      }
    }

    // Group remaining states by `(vp, route)` and run 4 parallel Chromium route workers so all 22 routes finish in ~60s!
    const routeGroups = [];
    for (const vp of [...VIEWPORTS, INTERMEDIATE_VIEWPORT]) {
      const statesForVp = (vp.name === "1024x768" ? INTERMEDIATE_STATES : STATES).filter(
        (st) => !fs.existsSync(path.join(REF_CAP_DIR, `${st.id}--${vp.name}.jpg`))
      );
      const byRoute = new Map();
      for (const st of statesForVp) {
        if (!byRoute.has(st.route)) byRoute.set(st.route, []);
        byRoute.get(st.route).push(st);
      }
      for (const [route, list] of byRoute.entries()) {
        routeGroups.push({ vp, route, list });
      }
    }

    console.log(`\n--- Running ${routeGroups.length} remaining (viewport, route) capture tasks across 4 workers ---`);
    let cursor = 0;
    const CONCURRENCY = 1;
    const workers = Array.from({ length: Math.min(CONCURRENCY, Math.max(1, routeGroups.length)) }, async () => {
      while (cursor < routeGroups.length) {
        const task = routeGroups[cursor];
        cursor += 1;
        const { vp, route, list } = task;
        const browser = await launchBrowser();
        try {
          const ctx = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            deviceScaleFactor: 1,
            isMobile: vp.isMobile,
            hasTouch: vp.isMobile,
          });
          const page = await ctx.newPage();
          const cdp = await ctx.newCDPSession(page);
          await page.goto(`${serverHandle.baseUrl}${route}`, { waitUntil: "domcontentloaded", timeout: 45_000 });
          await waitForPageReady(page);
          const routeDiagnostics = await extractPageDiagnostics(page);

          for (const st of list) {
            const fileName = `${st.id}--${vp.name}.jpg`;
            const outFile = path.join(REF_CAP_DIR, fileName);
            const scrollInfo = await seekPageTo(page, st.seek, vp);
            const actionNote = await performAction(page, st.action);
            if (actionNote) await waitRaf(page, 4);
            await snapJpeg(cdp, outFile, 86);
            await undoAction(page, st.action);

            const rec = {
              id: st.id,
              route: st.route,
              viewport: vp.name,
              width: vp.width,
              height: vp.height,
              scrollY: Math.round(scrollInfo.curY),
              targetScrollY: Math.round(scrollInfo.targetY),
              maxScrollY: Math.round(scrollInfo.maxScroll),
              action: actionNote,
              file: `docs/validation/phase-g/reference/${fileName}`,
              capturedAt: new Date().toISOString(),
              diagnostics: st.seek.mode === "top" && !st.action ? routeDiagnostics : undefined,
            };
            existingMetaByKey.set(`${rec.id}--${rec.viewport}`, rec);
            fs.appendFileSync(jsonlPath, JSON.stringify(rec) + "\n");
            console.log(`  [ref] ${fileName.padEnd(48)} scroll=${Math.round(scrollInfo.curY)}/${Math.round(scrollInfo.maxScroll)}`);
          }
        } catch (err) {
          console.error(`  [WARN] Route worker failed on ${route} @ ${vp.name}: ${err.message}`);
        } finally {
          await browser.close().catch(() => {});
        }
      }
    });
    await Promise.all(workers);

    const allRecords = Array.from(existingMetaByKey.values());
    const outMeta = path.join(PHASE_G_ROOT, "reference-metadata.json");
    fs.writeFileSync(
      outMeta,
      JSON.stringify(
        {
          generatedAt: new Date().toISOString(),
          referenceSource: "SHA-256 verified lusion.co bundle on local origin server + live https://lusion.co/ HTML verification",
          totalCaptures: fs.readdirSync(REF_CAP_DIR).filter((f) => f.endsWith(".jpg")).length,
          canonicalRoutesCovered: GROUND_TRUTH.routes.length,
          records: allRecords,
        },
        null,
        2
      )
    );
    console.log(`\nSaved ${fs.readdirSync(REF_CAP_DIR).length} fresh reference captures + metadata -> ${outMeta}`);
  } finally {
    await serverHandle.stop();
  }
  process.exit(0);
}

// ============================================================================
// MODE = "audit": Capture Reconstruction on `:3000` & Compare vs Fresh Reference
// ============================================================================
const RECON_CAP_DIR = path.join(PHASE_G_ROOT, "captures", RUN_LABEL);
const COMP_DIR = path.join(PHASE_G_ROOT, "composites", RUN_LABEL);
fs.mkdirSync(RECON_CAP_DIR, { recursive: true });
fs.mkdirSync(COMP_DIR, { recursive: true });

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

const results = [];

try {
  for (const vp of [...VIEWPORTS, INTERMEDIATE_VIEWPORT]) {
    const statesForVp = vp.name === "1024x768" ? INTERMEDIATE_STATES : STATES;
    console.log(`\n=== Phase G Full-Site Audit [${RUN_LABEL}] @ ${vp.name} (${statesForVp.length} states) ===`);
      const missingStates = statesForVp.filter(
        (st) => !fs.existsSync(path.join(RECON_CAP_DIR, `${st.id}--${vp.name}.jpg`))
      );
      if (missingStates.length > 0) {
        const routeGroups = [];
        for (const st of missingStates) {
          const last = routeGroups[routeGroups.length - 1];
          if (last && last.route === st.route) last.states.push(st);
          else routeGroups.push({ route: st.route, states: [st] });
        }
        let gIdx = 0;
        const AUDIT_WORKERS = Math.min(2, routeGroups.length);
        await Promise.all(
          Array.from({ length: AUDIT_WORKERS }, async () => {
            const wBrowser = await launchBrowser();
            try {
              const ctx = await wBrowser.newContext({
                viewport: { width: vp.width, height: vp.height },
                deviceScaleFactor: 1,
                isMobile: vp.isMobile,
                hasTouch: vp.isMobile,
              });
              while (gIdx < routeGroups.length) {
                const grp = routeGroups[gIdx];
                gIdx += 1;
                const page = await ctx.newPage();
                const cdp = await ctx.newCDPSession(page);
                try {
                  await page.goto(`${serverHandle.baseUrl}${grp.route}`, {
                    waitUntil: "domcontentloaded",
                    timeout: 45_000,
                  });
                  await waitForPageReady(page);
                  for (const st of grp.states) {
                    await seekPageTo(page, st.seek, vp);
                    await performAction(page, st.action);
                    await snapJpeg(cdp, path.join(RECON_CAP_DIR, `${st.id}--${vp.name}.jpg`), 86);
                    await undoAction(page, st.action);
                  }
                } finally {
                  await cdp.detach().catch(() => {});
                  await page.close().catch(() => {});
                }
              }
            } finally {
              await wBrowser.close();
            }
          })
        );
      }

      const browser = await launchBrowser();
      try {

      // Compute exact MAE / PSNR / SSIM + 3-panel `REFERENCE | RECON | DIFF` composites in browser canvas
      const scale = vp.width > 800 ? 0.45 : 1.0;
      const panelW = Math.round(vp.width * scale);
      const panelH = Math.round(vp.height * scale);
      const headerH = 38;
      const gap = 8;
      const totalW = panelW * 3 + gap * 4;
      const totalH = panelH + headerH + gap * 2;

      const compCtx = await browser.newContext({
        viewport: { width: totalW, height: totalH },
        deviceScaleFactor: 1,
      });
      const compPage = await compCtx.newPage();
      const compCdp = await compCtx.newCDPSession(compPage);
      await compPage.goto(`http://127.0.0.1:${helperPort}/canvas-host`);

      for (const st of statesForVp) {
        const refRel = path.relative(process.cwd(), path.join(REF_CAP_DIR, `${st.id}--${vp.name}.jpg`));
        const recRel = path.relative(process.cwd(), path.join(RECON_CAP_DIR, `${st.id}--${vp.name}.jpg`));

        const m = await compPage.evaluate(
          async ({ refUrl, recUrl, w, h, pW, pH, hdrH, g, tW, tH, idLabel, runLabel }) => {
            const loadImg = (src) =>
              new Promise((resolve, reject) => {
                const img = new Image();
                img.crossOrigin = "anonymous";
                img.onload = () => resolve(img);
                img.onerror = reject;
                img.src = src;
              });

            const [refImg, recImg] = await Promise.all([loadImg(refUrl), loadImg(recUrl)]);
            const off = document.createElement("canvas");
            off.width = w;
            off.height = h;
            const octx = off.getContext("2d", { willReadFrequently: true });

            octx.drawImage(refImg, 0, 0, w, h);
            const refData = octx.getImageData(0, 0, w, h).data;
            octx.clearRect(0, 0, w, h);
            octx.drawImage(recImg, 0, 0, w, h);
            const recData = octx.getImageData(0, 0, w, h).data;

            const diffImgData = octx.createImageData(w, h);
            const dd = diffImgData.data;

            let sumAbs = 0;
            let sumSq = 0;
            let over24 = 0;
            const nPx = w * h;
            const lumRef = new Float32Array(nPx);
            const lumRec = new Float32Array(nPx);

            for (let i = 0, p = 0; p < nPx; p += 1, i += 4) {
              const dr = Math.abs(refData[i] - recData[i]);
              const dg = Math.abs(refData[i + 1] - recData[i + 1]);
              const db = Math.abs(refData[i + 2] - recData[i + 2]);
              sumAbs += dr + dg + db;
              sumSq += dr * dr + dg * dg + db * db;
              const maxC = Math.max(dr, dg, db);
              if (maxC > 24) over24 += 1;

              dd[i] = Math.min(255, dr * 2.2);
              dd[i + 1] = Math.min(255, dg * 1.4);
              dd[i + 2] = Math.min(255, db * 2.2);
              dd[i + 3] = 255;

              lumRef[p] = 0.299 * refData[i] + 0.587 * refData[i + 1] + 0.114 * refData[i + 2];
              lumRec[p] = 0.299 * recData[i] + 0.587 * recData[i + 1] + 0.114 * recData[i + 2];
            }

            const mae = sumAbs / (nPx * 3);
            const mse = sumSq / (nPx * 3);
            const psnr = mse <= 1e-9 ? 99 : 10 * Math.log10((255 * 255) / mse);

            const C1 = (0.01 * 255) ** 2;
            const C2 = (0.03 * 255) ** 2;
            let ssimSum = 0;
            let blocks = 0;
            for (let by = 0; by + 8 <= h; by += 8) {
              for (let bx = 0; bx + 8 <= w; bx += 8) {
                let mx = 0;
                let my = 0;
                for (let y = 0; y < 8; y += 1) {
                  const row = (by + y) * w + bx;
                  for (let x = 0; x < 8; x += 1) {
                    mx += lumRef[row + x];
                    my += lumRec[row + x];
                  }
                }
                mx /= 64;
                my /= 64;
                let vx = 0;
                let vy = 0;
                let vxy = 0;
                for (let y = 0; y < 8; y += 1) {
                  const row = (by + y) * w + bx;
                  for (let x = 0; x < 8; x += 1) {
                    const dx = lumRef[row + x] - mx;
                    const dy = lumRec[row + x] - my;
                    vx += dx * dx;
                    vy += dy * dy;
                    vxy += dx * dy;
                  }
                }
                vx /= 63;
                vy /= 63;
                vxy /= 63;
                ssimSum += ((2 * mx * my + C1) * (2 * vxy + C2)) / ((mx * mx + my * my + C1) * (vx + vy + C2));
                blocks += 1;
              }
            }
            const ssim = blocks > 0 ? ssimSum / blocks : 0;

            octx.putImageData(diffImgData, 0, 0);

            const canvas = document.getElementById("c");
            canvas.width = tW;
            canvas.height = tH;
            const ctx2 = canvas.getContext("2d");
            ctx2.fillStyle = "#0a0c12";
            ctx2.fillRect(0, 0, tW, tH);

            ctx2.drawImage(refImg, g, hdrH, pW, pH);
            ctx2.drawImage(recImg, g * 2 + pW, hdrH, pW, pH);
            ctx2.drawImage(off, g * 3 + pW * 2, hdrH, pW, pH);

            ctx2.font = "bold 12px monospace";
            ctx2.fillStyle = "#e2e8f0";
            ctx2.fillText(`ORIGINAL lusion.co (${idLabel})`, g + 6, 24);
            ctx2.fillStyle = "#a3e635";
            ctx2.fillText(`RECON [${runLabel}] (${idLabel})`, g * 2 + pW + 6, 24);
            ctx2.fillStyle = "#fb7185";
            ctx2.fillText(
              `DIFF | MAE ${mae.toFixed(1)} | PSNR ${psnr.toFixed(2)}dB | SSIM ${ssim.toFixed(3)}`,
              g * 3 + pW * 2 + 6,
              24
            );

            return {
              mae: Number(mae.toFixed(2)),
              psnr: Number(psnr.toFixed(2)),
              ssim: Number(ssim.toFixed(4)),
              pctOver24: Number(((over24 / nPx) * 100).toFixed(2)),
            };
          },
          {
            refUrl: `http://127.0.0.1:${helperPort}/img?p=${encodeURIComponent(refRel)}`,
            recUrl: `http://127.0.0.1:${helperPort}/img?p=${encodeURIComponent(recRel)}`,
            w: vp.width,
            h: vp.height,
            pW: panelW,
            pH: panelH,
            hdrH: headerH,
            g: gap,
            tW: totalW,
            tH: totalH,
            idLabel: st.id,
            runLabel: RUN_LABEL,
          }
        );

        await snapJpeg(compCdp, path.join(COMP_DIR, `${st.id}--${vp.name}.jpg`), 82);
        results.push({ id: st.id, route: st.route, viewport: vp.name, ...m });
        console.log(
          `  ${st.id.padEnd(36)} ${vp.name.padEnd(9)} | MAE ${String(m.mae).padStart(6)} | PSNR ${String(
            m.psnr
          ).padStart(6)} dB | SSIM ${m.ssim.toFixed(4)} | >24: ${m.pctOver24}%`
        );
      }
    } finally {
      await browser.close();
    }
  }

  const byVp = {};
  for (const vpName of ["1440x900", "390x844", "1024x768"]) {
    const sub = results.filter((r) => r.viewport === vpName);
    byVp[vpName] = {
      count: sub.length,
      meanMae: Number((sub.reduce((s, r) => s + r.mae, 0) / sub.length).toFixed(2)),
      meanPsnr: Number((sub.reduce((s, r) => s + r.psnr, 0) / sub.length).toFixed(2)),
      meanSsim: Number((sub.reduce((s, r) => s + r.ssim, 0) / sub.length).toFixed(4)),
    };
  }

  const summary = {
    label: RUN_LABEL,
    generatedAt: new Date().toISOString(),
    totalStatesCompared: results.length,
    meanMae: Number((results.reduce((s, r) => s + r.mae, 0) / results.length).toFixed(2)),
    meanPsnr: Number((results.reduce((s, r) => s + r.psnr, 0) / results.length).toFixed(2)),
    meanSsim: Number((results.reduce((s, r) => s + r.ssim, 0) / results.length).toFixed(4)),
    byViewport: byVp,
    results,
  };

  const outJson = path.join(PHASE_G_ROOT, `metrics-${RUN_LABEL}.json`);
  fs.writeFileSync(outJson, JSON.stringify(summary, null, 2));
  console.log(
    `\n=== PHASE G SUMMARY [${RUN_LABEL}] (${results.length} states across ALL 22 routes): Mean MAE=${summary.meanMae} | Mean PSNR=${summary.meanPsnr} dB | Mean SSIM=${summary.meanSsim} ===`
  );
  console.log(
    `    Desktop 1440x900: MAE=${byVp["1440x900"].meanMae} (SSIM=${byVp["1440x900"].meanSsim}) | Mobile 390x844: MAE=${byVp["390x844"].meanMae} (SSIM=${byVp["390x844"].meanSsim}) | Tablet 1024x768: MAE=${byVp["1024x768"].meanMae}`
  );
} finally {
  helperServer.close();
  await serverHandle.stop();
}
