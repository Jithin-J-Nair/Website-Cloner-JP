import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { chromium as pwChromium } from "playwright-core";
import sparticuzChromium from "@sparticuz/chromium";

const MODE = process.argv[2] || "after";
const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT_DIR = path.resolve(`docs/validation/parity-audit/${MODE}`);
fs.mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "1440x900", width: 1440, height: 900, mobile: false },
  { name: "390x844", width: 390, height: 844, mobile: true },
];

const SINGLE_VP = process.env.ONLY_VP;
if (!SINGLE_VP) {
  const merged = { mode: MODE, capturedAt: new Date().toISOString(), viewports: {} };
  for (const vp of VIEWPORTS) {
    try {
      execFileSync("pkill", ["-9", "-x", "chromium"], { stdio: "ignore" });
    } catch {}
    execFileSync(process.execPath, [process.argv[1], MODE], {
      env: { ...process.env, ONLY_VP: vp.name },
      stdio: ["ignore", "inherit", "inherit"],
    });
    merged.viewports[vp.name] = JSON.parse(
      fs.readFileSync(path.join(OUT_DIR, `telemetry-${vp.name}.json`), "utf8")
    );
  }
  try {
    execFileSync("pkill", ["-9", "-x", "chromium"], { stdio: "ignore" });
  } catch {}
  fs.writeFileSync(path.join(OUT_DIR, "telemetry.json"), JSON.stringify(merged, null, 2));
  console.log(`Captured ${MODE}: all viewports complete.`);
  process.exit(0);
}

const vp = VIEWPORTS.find((v) => v.name === SINGLE_VP);
const execPath = await sparticuzChromium.executablePath();
const browser = await pwChromium.launch({
  executablePath: execPath,
  headless: true,
  args: [
    ...sparticuzChromium.args,
    "--use-gl=angle",
    "--use-angle=swiftshader",
    "--enable-webgl",
    "--ignore-gpu-blocklist",
  ],
});

const consoleErrors = [];
const pageErrors = [];
const context = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: 1,
  isMobile: vp.mobile,
  hasTouch: vp.mobile,
  reducedMotion: "reduce",
});
await context.addInitScript(() => {
  sessionStorage.setItem("lusion_booted_v1", "1");
});

const page = await context.newPage();
page.on("console", (msg) => {
  if (msg.type() === "error") consoleErrors.push(msg.text());
});
page.on("pageerror", (err) => pageErrors.push(err.message));

await page.goto(BASE_URL, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded === true, null, {
  timeout: 45000,
});
await new Promise((r) => setTimeout(r, 250));

const layout = await page.evaluate(() => {
  const ranges = window.__lusionInspector?.homeGoalSectionRanges?.items;
  const docTop = (id) => {
    const el = document.getElementById(id);
    if (!el) return 0;
    let t = 0;
    let c = el;
    while (c) {
      t += c.offsetTop;
      c = c.offsetParent;
    }
    return t;
  };
  return {
    vh: window.innerHeight,
    scrollHeight: document.documentElement.scrollHeight,
    reelTop: docTop("home-reel"),
    reelVideoTop: docTop("home-reel-container"),
    featuredTop: docTop("home-featured"),
    ctaTitleTop: docTop("end-section-title"),
    footerTop: docTop("footer-section"),
    ranges,
  };
});

const r = layout.ranges;
const bSpan = r.blackTunnel.pixelCount;
const wSpan = r.whiteTunnel.pixelCount;
const dSpan = r.astronautDrop.pixelCount;
const waitSpan = r.astronautWait.pixelCount;

const STATES = [
  { id: "01-hero", y: 0 },
  { id: "02-reel-intro", y: Math.round(layout.reelTop + layout.vh * 0.08) },
  { id: "03-reel-stage", y: Math.round(layout.reelVideoTop - layout.vh * 0.08) },
  { id: "04-featured-top", y: Math.round(layout.featuredTop + layout.vh * 0.05) },
  { id: "08-emergence-end", y: Math.round(r.blackTitle.pixelTo - 40) },
  { id: "09-tunnel-entry", y: Math.round(r.blackTunnel.pixelFrom + bSpan * 0.05) },
  { id: "10-tunnel-dark-truss", y: Math.round(r.blackTunnel.pixelFrom + bSpan * 0.25) },
  { id: "12-tunnel-red-teal", y: Math.round(r.blackTunnel.pixelFrom + bSpan * 0.54) },
  { id: "13-tunnel-emerald-twist", y: Math.round(r.blackTunnel.pixelFrom + bSpan * 0.77) },
  { id: "14-tunnel-pink-vortex", y: Math.round(r.whiteTunnel.pixelFrom + wSpan * 0.12) },
  { id: "15-blue-arch-tunnel", y: Math.round(r.whiteTunnel.pixelFrom + wSpan * 0.76) },
  { id: "16-monitor-glass-shatter", y: Math.round(r.astronautDrop.pixelFrom + dSpan * 0.68) },
  { id: "17-astronaut-stickers-wait", y: Math.round(r.astronautWait.pixelFrom + waitSpan * 0.08) },
  { id: "19-cta-lets-work-together", y: Math.round(layout.ctaTitleTop - layout.vh * 0.36) },
  { id: "18-footer-white-wipe", y: Math.round(layout.footerTop - layout.vh * 0.52) },
  {
    id: "20-footer-portal",
    y: Math.max(0, Math.round(layout.scrollHeight - layout.vh)),
  },
];

const cdp = await context.newCDPSession(page);
const stats = [];

for (const st of STATES) {
  await page.evaluate(async (targetY) => {
    window.__lusionInspector?.scrollManager?.scrollToPixel(targetY, true);
    window.scrollTo({ top: targetY, behavior: "instant" });
    await new Promise((res) => requestAnimationFrame(() => res()));
  }, st.y);

  const shot = await cdp.send("Page.captureScreenshot", { format: "png" });
  const file = path.join(OUT_DIR, `${st.id}--${vp.name}.png`);
  fs.writeFileSync(file, Buffer.from(shot.data, "base64"));

  const tel = await page.evaluate(() => ({
    scrollY: window.scrollY,
    activeSurface: document.documentElement.className,
    telemetry: window.__goalAstronautTelemetry
      ? {
          glbLoaded: window.__goalAstronautTelemetry.glbLoaded,
          qualityTier: window.__goalAstronautTelemetry.qualityTier,
          drawCalls: window.__goalAstronautTelemetry.drawCalls,
          triangles: window.__goalAstronautTelemetry.triangles,
          lastFrameMs: window.__goalAstronautTelemetry.lastFrameMs,
          emergenceProgress: window.__goalAstronautTelemetry.emergenceProgress,
          portalStencilActive: window.__goalAstronautTelemetry.portalStencilActive,
        }
      : null,
  }));

  stats.push({ state: st.id, targetY: st.y, ...tel });
  console.log(
    `[${MODE}:${vp.name}] ${st.id} y=${st.y} calls=${tel.telemetry?.drawCalls} tris=${tel.telemetry?.triangles} ms=${tel.telemetry?.lastFrameMs}`
  );
}

const idleRafAudit = await page.evaluate(async (featuredY) => {
  window.__lusionInspector?.scrollManager?.scrollToPixel(featuredY, true);
  window.scrollTo({ top: featuredY, behavior: "instant" });
  await new Promise((r) => setTimeout(r, 200));
  let rafCalls = 0;
  const origRaf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => {
    rafCalls += 1;
    return origRaf(cb);
  };
  await new Promise((r) => setTimeout(r, 400));
  window.requestAnimationFrame = origRaf;
  return { featuredScrollY: featuredY, rafCallsIn400ms: rafCalls };
}, Math.round(layout.featuredTop + layout.vh * 0.25));

const sweepPerf = await page.evaluate(async (yMax) => {
  const frameTimes = [];
  let maxFrameMs = 0;
  for (let i = 0; i <= 40; i++) {
    const y = Math.round((yMax * i) / 40);
    const t0 = performance.now();
    window.__lusionInspector?.scrollManager?.scrollToPixel(y, true);
    window.scrollTo({ top: y, behavior: "instant" });
    await new Promise((res) => requestAnimationFrame(res));
    const dt = performance.now() - t0;
    frameTimes.push(+dt.toFixed(2));
    if (dt > maxFrameMs) maxFrameMs = dt;
  }
  return {
    samples: frameTimes.length,
    meanFrameMs: +(frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length).toFixed(2),
    maxFrameMs: +maxFrameMs.toFixed(2),
    consoleReady: true,
  };
}, layout.scrollHeight - layout.vh);

fs.writeFileSync(
  path.join(OUT_DIR, `telemetry-${vp.name}.json`),
  JSON.stringify({ layout, stats, idleRafAudit, sweepPerf, consoleErrors, pageErrors }, null, 2)
);
try {
  execFileSync("pkill", ["-9", "-x", "chromium"], { stdio: "ignore" });
} catch {}
process.exit(0);
