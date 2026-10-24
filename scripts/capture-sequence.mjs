import { chromium } from "playwright";
import fs from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const base = args.base ?? "http://127.0.0.1:3000", out = args.out ?? "docs/validation/fix";
const W = +(args.w ?? 1440), H = +(args.h ?? 900);
fs.mkdirSync(out, { recursive: true });

const STOPS = Array.from({ length: 81 }, (_, i) => i / 80);

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--enable-gpu-rasterization"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${base}/?quality=high`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const log = [];
for (const [i, f] of STOPS.entries()) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(f * total));
  await page.waitForTimeout(700);
  const pipeline = await page.evaluate(() => window.__pipeline ?? null);
  const blank = await page.evaluate(() => {
    const c = [...document.querySelectorAll("canvas")].filter((x) => x.getBoundingClientRect().height > innerHeight * 0.5);
    return c.length === 0;
  });
  const file = `${out}/seq_${String(i).padStart(3, "0")}_${Math.round(f * 1000)}.png`;
  await page.screenshot({ path: file });
  log.push({ i, f, file, pipeline, noLargeCanvas: blank });
  console.log(`Captured frame ${i}/${STOPS.length-1}`);
}
fs.writeFileSync(`${out}/sequence-report.json`, JSON.stringify({ W, H, errors, log }, null, 2));
await browser.close();
console.log(`captured ${log.length} frames, ${errors.length} console issues`);
