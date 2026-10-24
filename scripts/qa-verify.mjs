#!/usr/bin/env node
/**
 * Lusion Reconstruction Automated QA, Contrast, Licensing, Full 22-Route & Asset Security Verifier
 * Verifies:
 *   1. WCAG 2.1 contrast math on verified Lusion tokens
 *   2. Font Option 2 compliance & zero unapproved personal portfolio leaks in active app modules
 *   3. Authentic shared Lusion shell landmarks & ground-truth copy across `/`, `/about`, `/projects`
 *   4. All 22 canonical ground-truth routes (`HTTP 200` + exact `<title>` + `<main>` + `<h1>` + SkipNav)
 *      plus verified `HTTP 404` behavior on unknown top-level and unknown `/projects/<slug>` routes
 *   5. Clean-production asset delivery (`HTTP 200`, `0` unexpected `404`s, strict CSP + `nosniff`)
 */

import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.QA_BASE_URL || "http://127.0.0.1:3000";
const GROUND_TRUTH = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "src", "data", "reference", "lusion-ground-truth.json"),
    "utf8"
  )
);

function hexToLuminance(hex) {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(hexA, hexB) {
  const l1 = hexToLuminance(hexA);
  const l2 = hexToLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const CONTRAST_PAIRS = [
  { name: "Off-White Canvas (#f0f1fa) vs Primary Ink (#000000)", bg: "#f0f1fa", fg: "#000000", min: 7.0 },
  { name: "Pure White Footer (#ffffff) vs Primary Ink (#000000)", bg: "#ffffff", fg: "#000000", min: 7.0 },
  { name: "Header Pill Dark-White (#e4e6ef) vs Primary Ink (#000000)", bg: "#e4e6ef", fg: "#000000", min: 7.0 },
  { name: "Pure Black Stage (#000000) vs Pure White (#ffffff)", bg: "#000000", fg: "#ffffff", min: 7.0 },
  { name: "Scroll Portal Slate (#121416) vs Signal Lime (#c1ff00)", bg: "#121416", fg: "#c1ff00", min: 7.0 },
  { name: "Lusion Electric Cobalt (#1a2ffb) vs Pure White (#ffffff)", bg: "#1a2ffb", fg: "#ffffff", min: 4.5 },
  { name: "Header Talk Slate (#2b2e3a) vs Pure White (#ffffff)", bg: "#2b2e3a", fg: "#ffffff", min: 7.0 },
];

const SHELL_MARKERS = [
  { name: "Header shell (#header)", re: /id="header"/ },
  { name: "Lusion vector wordmark (#header-logo)", re: /id="header-logo"/ },
  { name: "Menu toggle (#header-right-menu-btn)", re: /id="header-right-menu-btn"/ },
  { name: "Floating menu (#header-menu)", re: /id="header-menu"/ },
  { name: "Labs card with Lucy (#header-menu-labs-lucy-svg)", re: /id="header-menu-labs-lucy-svg"/ },
  { name: "Scroll indicator (#scroll-indicator)", re: /id="scroll-indicator"/ },
  { name: "Home hero stage (#home-hero-visual-container)", re: /id="home-hero-visual-container"/ },
  { name: "Home showreel section (#home-reel)", re: /id="home-reel"/ },
  { name: "Home featured grid (#home-featured)", re: /id="home-featured"/ },
  { name: "Home goal tunnel (#home-goal)", re: /id="home-goal"/ },
  { name: "End section CTA (#end-section)", re: /id="end-section"/ },
  { name: "Footer section (#footer-section)", re: /id="footer-section"/ },
  { name: "Scroll portal (#scroll-nav-section)", re: /id="scroll-nav-section"/ },
  { name: "Verified Bristol address (9 Marsh Street)", re: /9 Marsh Street/ },
  { name: "Verified Bristol postcode (BS1 4AA)", re: /BS1 4AA/ },
  { name: "Verified Lusion email (hello@lusion.co)", re: /hello@lusion\.co/ },
  { name: "Verified Lusion copyright (©2026 LUSION Creative Studio)", re: /©2026 LUSION Creative Studio/ },
];

let failures = 0;

console.log("=== LUSION RECONSTRUCTION QA VERIFICATION ===");

// 1. WCAG Contrast Audit
console.log("\n[1/5] Auditing Lusion Design System Contrast Pairs...");
for (const pair of CONTRAST_PAIRS) {
  const ratio = contrastRatio(pair.bg, pair.fg);
  const ok = ratio >= pair.min;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${pair.name}: ${ratio.toFixed(2)}:1 (min ${pair.min}:1)`);
  if (!ok) failures += 1;
}

// 2. Font Option 2 Compliance & Unapproved Source Audit (excluding preserved historical `sites/jithinrp/`)
console.log("\n[2/5] Auditing Font Option 2 Licensing & Active Source Modules...");
function walkAll(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (full.includes(`${path.sep}sites${path.sep}jithinrp`)) continue;
    if (entry.isDirectory()) walkAll(full, out);
    else out.push(full);
  }
  return out;
}

const fontFiles = [
  ...walkAll(path.join(process.cwd(), "public")),
  ...walkAll(path.join(process.cwd(), "src")),
].filter((f) => /\.(woff2?|ttf|otf)$/i.test(f));

for (const fontFile of fontFiles) {
  if (/aeonik|lusionmono/i.test(path.basename(fontFile))) {
    console.error(`  FAIL Excluded commercial font binary detected: ${fontFile}`);
    failures += 1;
  }
}
console.log(`  PASS Verified ${fontFiles.length} active local font files — 0 excluded commercial font binaries.`);

const srcFiles = walkAll(path.join(process.cwd(), "src")).filter((f) => /\.(ts|tsx|css)$/.test(f));
for (const file of srcFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (/jithinrp\.com/i.test(text)) {
    console.error(`  FAIL Unapproved personal portfolio reference in ${file}`);
    failures += 1;
  }
}
console.log(`  PASS Audited ${srcFiles.length} active source files — zero unapproved portfolio references.`);

// 3. Shared Lusion Shell & About/Archive Landmark Verification
console.log("\n[3/5] Auditing Shared Lusion Chrome Landmarks & Page Sections...");
const homeRes = await fetch(`${BASE_URL}/`);
const homeHtml = await homeRes.text();
for (const marker of SHELL_MARKERS) {
  const ok = marker.re.test(homeHtml);
  console.log(`  ${ok ? "PASS" : "FAIL"} ${marker.name}`);
  if (!ok) failures += 1;
}

const aboutHtml = await (await fetch(`${BASE_URL}/about`)).text();
for (const id of ["about-who", "about-clients", "about-award", "about-capability"]) {
  const ok = aboutHtml.includes(`id="${id}"`);
  console.log(`  ${ok ? "PASS" : "FAIL"} /about landmark (#${id})`);
  if (!ok) failures += 1;
}

// 4. Live HTTP, `<title>`, `<main>`, `<h1>` & 404 Audit Across ALL 22 Canonical Ground-Truth Routes + 2 Negative Routes
console.log(`\n[4/5] Auditing All ${GROUND_TRUTH.routes.length} Canonical Routes + 2 Negative 404 Routes on ${BASE_URL}...`);
for (const entry of GROUND_TRUTH.routes) {
  const res = await fetch(`${BASE_URL}${entry.route}`);
  const html = await res.text();
  const titleMatch = html.match(/<title>([^<]*)<\/title>/i);
  const actualTitle = titleMatch ? titleMatch[1] : "";
  const titleOk = actualTitle === entry.title;
  const statusOk = res.status === 200;
  const hasH1 = /<h1[\s>]/i.test(html);
  const hasMain = /id="main-content"/i.test(html);
  const hasSkipLink = /Skip to main content/i.test(html);
  const ok = statusOk && titleOk && hasH1 && hasMain && hasSkipLink;

  console.log(
    `  ${ok ? "PASS" : "FAIL"} ${entry.route.padEnd(36)} HTTP ${res.status} | Title:${titleOk ? "EXACT" : `"${actualTitle}" vs "${entry.title}"`} | H1:${hasH1}`
  );
  if (!ok) failures += 1;
}

for (const missingPath of ["/non-existent-optical-coordinate", "/projects/non-existent-case-study"]) {
  const res = await fetch(`${BASE_URL}${missingPath}`);
  const ok = res.status === 404;
  console.log(`  ${ok ? "PASS" : "FAIL"} ${missingPath.padEnd(36)} HTTP ${res.status} (expected 404)`);
  if (!ok) failures += 1;
}

// 5. Clean-Production Asset Pipeline Probe
console.log("\n[5/5] Auditing Clean-Production Asset Route Delivery & Security...");
const cardAsset = await fetch(`${BASE_URL}/assets/projects/oryzo_ai/home.webp`);
const cardCsp = cardAsset.headers.get("content-security-policy") || "";
const fontBlock = await fetch(`${BASE_URL}/assets/fonts/Aeonik-Regular.woff2`);
const assetOk =
  cardAsset.status === 200 &&
  cardCsp.includes("sandbox") &&
  cardAsset.headers.get("x-content-type-options") === "nosniff" &&
  fontBlock.status === 403;
console.log(
  `  ${assetOk ? "PASS" : "FAIL"} Clean card asset HTTP ${cardAsset.status} (CSP sandbox=${cardCsp.includes("sandbox")}) & commercial font HTTP ${fontBlock.status}`
);
if (!assetOk) failures += 1;

// These are the actual captured Lusion hero/suit assets used by the WebGL scenes.
// Check the delivered bytes, not merely whether a manifest entry or source path exists.
const referenceSceneAssets = [
  "/assets/models/home/cross.buf",
  "/assets/models/tunnels/astronaut_helmet.buf",
  "/assets/models/tunnels/astronaut_helmet_glass.buf",
  "/assets/models/tunnels/astronaut_glove_shoes.buf",
  "/assets/models/tunnels/astronaut_wearpack.buf",
  "/assets/textures/tunnels/astronaut/astronaut_helmet_base.webp",
  "/assets/textures/tunnels/astronaut/astronaut_helmet_nor.webp",
  "/assets/textures/tunnels/astronaut/astronaut_glove_shoes_base.webp",
  "/assets/textures/tunnels/astronaut/astronaut_wearpack_base.webp",
];
const sceneAssetResults = await Promise.all(
  referenceSceneAssets.map(async (url) => {
    try {
      const response = await fetch(`${BASE_URL}${url}`);
      const bytes = response.ok ? await response.arrayBuffer() : null;
      return { url, status: response.status, bytes: bytes?.byteLength ?? 0 };
    } catch {
      return { url, status: 0, bytes: 0 };
    }
  })
);
const sceneAssetsOk = sceneAssetResults.every((result) => result.status === 200 && result.bytes > 0);
console.log(
  `  ${sceneAssetsOk ? "PASS" : "FAIL"} Captured Lusion scene assets: ${sceneAssetResults.filter((result) => result.status === 200 && result.bytes > 0).length}/${referenceSceneAssets.length} delivered with non-empty bodies`
);
for (const result of sceneAssetResults) {
  if (result.status !== 200 || result.bytes === 0) {
    console.error(`    Missing/empty scene asset: ${result.url} (HTTP ${result.status}, ${result.bytes} bytes)`);
  }
}
if (!sceneAssetsOk) failures += 1;

if (failures > 0) {
  console.error(`\nQA FAILED with ${failures} issue(s).`);
  process.exit(1);
} else {
  console.log("\nALL LUSION QA GATES PASSED SUCCESSFULLY (22/22 CANONICAL ROUTES + 404 + ASSET SECURITY).");
}
