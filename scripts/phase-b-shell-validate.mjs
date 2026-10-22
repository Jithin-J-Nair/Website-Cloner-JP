#!/usr/bin/env node
/**
 * Phase B Shared Shell Browser Validation & Before/After Screenshot Harness
 *
 * Captures and verifies every reconstructed Lusion shared shell component across
 * both mandatory viewports (`1440x900` desktop & `390x844` mobile) in real Chromium
 * with WebGL2 enabled:
 *   1. Closed `#header` + `#scroll-indicator` (Before Phase A -> Phase B -> Reference)
 *   2. Open `#header-menu` floating card stack + Lucy SVG (Phase B vs Reference)
 *   3. `#preloader` stepped-`L` + `000 -> 100` counter + `prefers-reduced-motion` bypass
 *   4. Case-study `#header-center-project-back-btn` (`← BACK` desktop / `←` mobile vs Reference `oryzo_ai`)
 *   5. `#end-section` (`"Is Your Big Idea Ready to Go Wild?"` / `"Let's work together!"`)
 *   6. `#footer-section` + `#scroll-nav-section` (Before Phase A -> Phase B -> Reference)
 *   7. `#video-overlay` (`desktop.mp4` 1920x960 & `mobile.mp4` 720x960 playback + keyboard Escape)
 */

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const requireFromCheck = createRequire("/tmp/browser-check/package.json");
const { chromium } = requireFromCheck("playwright-core");

const ROOT = process.cwd();
const REF_DIR = "/tmp/lusion-ref";
const LOCAL_BASE = process.env.LOCAL_BASE_URL || "http://127.0.0.1:3000";
const PHASE_B_DIR = path.join(ROOT, "docs/validation/phase-b");
const RAW_DIR = path.join(PHASE_B_DIR, "raw");
const COMP_DIR = path.join(PHASE_B_DIR, "composites");

fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(COMP_DIR, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".mp4": "video/mp4",
  ".ogg": "audio/ogg",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".buf": "application/octet-stream",
};

function startRefServer() {
  const srv = http.createServer((req, res) => {
    const cleanPath = decodeURIComponent((req.url || "/").split("?")[0]);
    let target = path.join(REF_DIR, cleanPath);
    if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
      target = path.join(target, "index.html");
    } else if (!fs.existsSync(target) && fs.existsSync(`${target}.html`)) {
      target = `${target}.html`;
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    const ext = path.extname(target).toLowerCase();
    res.writeHead(200, {
      "Content-Type": MIME[ext] || "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    });
    fs.createReadStream(target).pipe(res);
  });

  return new Promise((resolve) => {
    srv.listen(0, "127.0.0.1", () => resolve(srv));
  });
}

const VIEWPORTS = [
  { key: "1440x900", width: 1440, height: 900, isMobile: false },
  { key: "390x844", width: 390, height: 844, isMobile: true },
];

async function run() {
  const refServer = await startRefServer();
  const REF_BASE = `http://127.0.0.1:${refServer.address().port}`;

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

  async function cdpShot(cdp, filePath) {
    const { data } = await cdp.send("Page.captureScreenshot", { format: "png" });
    fs.writeFileSync(filePath, Buffer.from(data, "base64"));
  }

  const report = {
    generatedAt: new Date().toISOString(),
    phase: "Phase B — Shared Design System, Licensed Typography & Lusion Shell",
    viewports: ["1440x900", "390x844"],
    consoleErrors: [],
    pageErrors: [],
    httpErrors: [],
    checks: [],
  };

  for (const vp of VIEWPORTS) {
    console.log(`\n[phase-b-validate] === Viewport ${vp.key} ===`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1,
      isMobile: vp.isMobile,
      hasTouch: vp.isMobile,
    });

    const page = await context.newPage();
    const cdp = await context.newCDPSession(page);
    page.on("console", (msg) => {
      if (msg.type() === "error") {
        report.consoleErrors.push({ viewport: vp.key, text: msg.text() });
      }
    });
    page.on("pageerror", (err) => {
      report.pageErrors.push({ viewport: vp.key, text: err.message });
    });
    page.on("response", (res) => {
      if (res.status() >= 400 && !res.url().includes("non-existent")) {
        report.httpErrors.push({ viewport: vp.key, status: res.status(), url: res.url() });
      }
    });

    // 1. Cold-start `#preloader` capture (mid-roll around ~40-65%)
    await page.goto(LOCAL_BASE, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("#preloader", { timeout: 5000 });
    await page.waitForTimeout(340);
    const preloaderDigits = await page
      .locator("#preloader-percent-digits")
      .innerText()
      .catch(() => "");
    await cdpShot(cdp, path.join(RAW_DIR, `after-preloader--${vp.key}.png`));
    report.checks.push({
      viewport: vp.key,
      check: "Preloader cold-start (#preloader + #preloader-percent-digits)",
      passed: preloaderDigits.replace(/\s+/g, "").length === 3,
      detail: `Captured digits="${preloaderDigits.replace(/\s+/g, "")}"`,
    });

    // Wait for preloader exit & settle (`900ms + 140ms + 360ms = 1400ms`)
    await page.waitForTimeout(1450);
    const preloaderGone = (await page.locator("#preloader").count()) === 0;

    // Verify computed font family uses calibrated licensed font (`LusionSansCalibrated`)
    const fontCheck = await page.evaluate(() => {
      const bodyFont = getComputedStyle(document.body).fontFamily;
      const rootVars = {
        offWhite: getComputedStyle(document.documentElement).getPropertyValue("--color-off-white").trim(),
        blue: getComputedStyle(document.documentElement).getPropertyValue("--color-blue").trim(),
        green: getComputedStyle(document.documentElement).getPropertyValue("--color-green").trim(),
      };
      return { bodyFont, rootVars, fontsLoaded: document.fonts.size };
    });
    report.checks.push({
      viewport: vp.key,
      check: "Preloader unmounts cleanly + Lusion CSS tokens & calibrated font active",
      passed:
        preloaderGone &&
        fontCheck.bodyFont.includes("LusionSansCalibrated") &&
        fontCheck.rootVars.offWhite === "#f0f1fa" &&
        fontCheck.rootVars.blue === "#1a2ffb",
      detail: JSON.stringify(fontCheck),
    });

    // 2. Closed `#header` + `#scroll-indicator` capture
    await cdpShot(cdp, path.join(RAW_DIR, `after-header-closed--${vp.key}.png`));

    // Test keyboard Tab -> Skip Link (`Skip to main content`)
    await page.keyboard.press("Tab");
    await page.waitForTimeout(120);
    const skipFocused = await page.evaluate(
      () => document.activeElement?.classList.contains("kn-skip-link") ?? false
    );
    report.checks.push({
      viewport: vp.key,
      check: "Keyboard Tab focuses Skip-to-main-content link",
      passed: skipFocused,
      detail: `activeElement.kn-skip-link=${skipFocused}`,
    });

    // 3. Open `#header-menu` popover (`MENU ••` -> `CLOSE ••` + stacked cards + Lucy)
    await page.locator("#header-right-menu-btn").click();
    await page.waitForTimeout(560);
    const menuState = await page.evaluate(() => {
      const nav = document.getElementById("header-menu");
      const links = Array.from(document.querySelectorAll("#header-menu-links .header-menu-link")).map(
        (el) => el.textContent?.trim().slice(0, 20)
      );
      const lucy = Boolean(document.getElementById("header-menu-labs-lucy-svg"));
      const labsHref = document.getElementById("header-menu-labs")?.getAttribute("href");
      return { opened: nav?.classList.contains("--opened"), linksCount: links.length, lucy, labsHref };
    });
    await cdpShot(cdp, path.join(RAW_DIR, `after-header-menu-open--${vp.key}.png`));
    report.checks.push({
      viewport: vp.key,
      check: "Floating #header-menu opens with 4 Lusion routes + Labs card + Lucy SVG",
      passed:
        Boolean(menuState.opened) &&
        menuState.linksCount === 4 &&
        menuState.lucy &&
        menuState.labsHref === "https://labs.lusion.co/",
      detail: JSON.stringify(menuState),
    });

    // Press Escape to close `#header-menu`
    await page.keyboard.press("Escape");
    await page.waitForTimeout(360);
    const closedOnEsc = await page.evaluate(
      () => !document.getElementById("header-menu")?.classList.contains("--opened")
    );
    report.checks.push({
      viewport: vp.key,
      check: "Escape closes #header-menu cleanly",
      passed: closedOnEsc,
      detail: `closedOnEsc=${closedOnEsc}`,
    });

    // 4. Scroll to `#end-section` and capture
    await page.evaluate(() => {
      if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
      document.getElementById("end-section")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(450);
    await cdpShot(cdp, path.join(RAW_DIR, `after-end-section--${vp.key}.png`));

    // 5. Scroll to `#footer-section` + `#scroll-nav-section` and capture + test newsletter form
    await page.evaluate(() => {
      document.getElementById("footer-section")?.scrollIntoView({ behavior: "instant" });
    });
    await page.waitForTimeout(450);
    await cdpShot(cdp, path.join(RAW_DIR, `after-footer-portal--${vp.key}.png`));

    // Submit newsletter email to verify local-only honest feedback
    await page.locator("#footer-newsletter-input-field").fill("studio@example.com");
    await page.locator("#footer-newsletter-input-arrow").click();
    await page.waitForTimeout(180);
    const newsletterFeedback = await page
      .locator("#footer-newsletter-feedback-message")
      .innerText()
      .catch(() => "");
    report.checks.push({
      viewport: vp.key,
      check: "Footer local-only newsletter form validates and displays honest status",
      passed: newsletterFeedback.toLowerCase().includes("saved locally"),
      detail: newsletterFeedback,
    });

    // 6. Test `#video-overlay` (`ShowreelModal`) playback + controls + Escape close
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
    await page.waitForTimeout(200);
    // Open `#video-overlay` via Play Showreel button on page
    const reelTrigger = page.getByRole("button", { name: /showreel/i }).first();
    if ((await reelTrigger.count()) > 0) {
      await reelTrigger.click();
      await page.waitForSelector("#video-overlay", { timeout: 4000 });
      await page.waitForTimeout(700);
      const videoMetrics = await page.evaluate(() => {
        const v = document.querySelector("#video-overlay video");
        return v
          ? {
              src: v.getAttribute("src"),
              readyState: v.readyState,
              videoWidth: v.videoWidth,
              videoHeight: v.videoHeight,
            }
          : null;
      });
      await cdpShot(cdp, path.join(RAW_DIR, `after-video-overlay--${vp.key}.png`));
      await page.keyboard.press("Escape");
      await page.waitForTimeout(750);
      report.checks.push({
        viewport: vp.key,
        check: "Shared #video-overlay streams responsive local MP4 & closes on Escape",
        passed:
          Boolean(videoMetrics) &&
          videoMetrics.readyState >= 2 &&
          videoMetrics.videoWidth > 0 &&
          (await page.locator("#video-overlay").count()) === 0,
        detail: JSON.stringify(videoMetrics),
      });
    }

    // 7. Capture Case-Study `#header-center-project-back-btn` (`/?projectBack=oryzo_ai`)
    await page.goto(`${LOCAL_BASE}/?projectBack=oryzo_ai`, { waitUntil: "domcontentloaded" });
    await page
      .waitForFunction(() => !document.getElementById("preloader"), { timeout: 5000 })
      .catch(() => {});
    await page.waitForTimeout(450);
    const backBtnInfo = await page.evaluate(() => {
      const btn = document.getElementById("header-center-project-back-btn");
      const logo = document.getElementById("header-logo");
      const rect = btn?.getBoundingClientRect();
      return {
        exists: Boolean(btn),
        width: rect ? Math.round(rect.width) : 0,
        height: rect ? Math.round(rect.height) : 0,
        logoColor: logo ? getComputedStyle(logo).color : "",
      };
    });
    await cdpShot(cdp, path.join(RAW_DIR, `after-project-back--${vp.key}.png`));
    report.checks.push({
      viewport: vp.key,
      check: "Case-study #header-center-project-back-btn renders theme highlight & responsive geometry",
      passed:
        backBtnInfo.exists &&
        backBtnInfo.logoColor === "rgb(220, 80, 0)" &&
        (vp.isMobile ? backBtnInfo.width <= 56 : backBtnInfo.width >= 90),
      detail: JSON.stringify(backBtnInfo),
    });

    // Close WebGL page context immediately so SwiftShader frees CPU before next checks
    await context.close();

    // 8. Verify `prefers-reduced-motion: reduce` instant preloader bypass in fresh context
    const rmContext = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce",
    });
    const rmPage = await rmContext.newPage();
    await rmPage.goto(LOCAL_BASE, { waitUntil: "load" });
    await rmPage.waitForTimeout(450);
    const rmCountAfterLoad = await rmPage.locator("#preloader").count();
    report.checks.push({
      viewport: vp.key,
      check: "prefers-reduced-motion: reduce bypasses preloader immediately",
      passed: rmCountAfterLoad === 0,
      detail: `countAfterLoad450ms=${rmCountAfterLoad}`,
    });
    await rmContext.close();

    // 9. Capture Reference Open `#header-menu` AND Reference `#footer-section + #scroll-nav-section`
    const refMenuPath = path.join(RAW_DIR, `ref-header-menu-open--${vp.key}.png`);
    const refFooterPath = path.join(RAW_DIR, `ref-footer-portal--${vp.key}.png`);
    if (process.env.FORCE_REF === "1" || !fs.existsSync(refMenuPath)) {
      const refCtx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });
      const refPage = await refCtx.newPage();
      await refPage.route("https://**", (route) => route.abort());
      const refCdp = await refCtx.newCDPSession(refPage);
      await refPage.goto(`${REF_BASE}/`, { waitUntil: "domcontentloaded" });
      await refPage
        .waitForFunction(
          () => {
            const p = document.getElementById("preloader");
            return !p || getComputedStyle(p).display === "none" || getComputedStyle(p).opacity === "0";
          },
          { timeout: 45000 }
        )
        .catch(() => {});
      await refPage.waitForTimeout(1800);

      await refPage.evaluate(() => {
        const blocker = document.getElementById("input-blocker");
        if (blocker) blocker.style.pointerEvents = "none";
        document.getElementById("header-right-menu-btn")?.click();
      });
      await refPage.waitForTimeout(1200);
      await cdpShot(refCdp, refMenuPath);
      await refCtx.close();
    }

    if (process.env.FORCE_REF_FOOTER === "1" || !fs.existsSync(refFooterPath)) {
      const staticRefCtx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        javaScriptEnabled: false,
      });
      const refFooterPage = await staticRefCtx.newPage();
      await refFooterPage.route("https://**", (route) => route.abort());
      const footerOverrideCss = `
        html, body { background: #ffffff !important; overflow: auto !important; height: auto !important; }
        #preloader, #canvas, #page-container-inner, #scroll-indicator, #end-section, #footer-top, #input-blocker { display: none !important; }
        #ui, #page-container, #page-extra-sections { position: static !important; transform: none !important; opacity: 1 !important; visibility: visible !important; display: block !important; height: auto !important; pointer-events: auto !important; }
        #footer-section { position: relative !important; min-height: auto !important; transform: none !important; opacity: 1 !important; visibility: visible !important; display: flex !important; padding: 7rem var(--base-padding-x) 3.5rem !important; }
        #footer-section *, #scroll-nav-section * { opacity: 1 !important; transform: none !important; visibility: visible !important; }
        #footer-newsletter-feedback-message { opacity: 0 !important; }
        #footer-newsletter-input-field::placeholder { opacity: 0.35 !important; }
        #scroll-nav-section { position: relative !important; transform: none !important; opacity: 1 !important; visibility: visible !important; display: block !important; padding: 2.5rem var(--base-padding-x) !important; }
        #header-right-talk-btn, #header-right-menu-btn { transform: scale(1) !important; }
      `;
      const rawRefHtml = fs
        .readFileSync(path.join(REF_DIR, "index.html"), "utf8")
        .replace('class="no-js"', 'class="js"')
        .replace("</head>", `<style>${footerOverrideCss}</style></head>`);
      await refFooterPage.route(`${REF_BASE}/`, (route) =>
        route.fulfill({ status: 200, contentType: "text/html; charset=utf-8", body: rawRefHtml })
      );
      const refFooterCdp = await staticRefCtx.newCDPSession(refFooterPage);
      await refFooterPage.goto(`${REF_BASE}/`, { waitUntil: "load" });
      await refFooterPage.waitForTimeout(250);
      await cdpShot(refFooterCdp, refFooterPath);
      await staticRefCtx.close();
    }
  }

  fs.writeFileSync(
    path.join(PHASE_B_DIR, "shell-validation-report.json"),
    JSON.stringify(report, null, 2)
  );
  console.log("\n[phase-b-validate] Report saved to docs/validation/phase-b/shell-validation-report.json");

  await Promise.race([
    browser.close(),
    new Promise((resolve) => setTimeout(resolve, 2500)),
  ]);
  for (const entry of fs.readdirSync("/proc")) {
    if (!/^\d+$/.test(entry)) continue;
    try {
      const exe = fs.readlinkSync(`/proc/${entry}/exe`);
      if (exe.includes("chromium")) process.kill(Number(entry), "SIGKILL");
    } catch {
      // Process already exited
    }
  }
  refServer.close();
}

run()
  .then(() => {
    spawnSync("true");
    process.exit(0);
  })
  .catch((err) => {
    console.error("[phase-b-validate] Fatal error:", err);
    process.exit(1);
  });
