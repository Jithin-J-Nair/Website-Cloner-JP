import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const groundTruth = JSON.parse(fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8"));
const about = groundTruth.about;
const page = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

assert.equal(about.clients.carouselRows.length, 3, "About client wall keeps its three source rows");
assert.equal(about.clients.uniqueLogoCount, 15, "About client wall keeps the verified 15-brand set");
const displayed = about.clients.carouselRows.flat();
assert.ok(displayed.length >= about.clients.uniqueLogoCount, "all source row entries remain represented");

const ids = new Set(about.clients.logos.map(logo => logo.id));
assert.equal(ids.size, about.clients.uniqueLogoCount, "source logo list contains 15 unique brands");
for (const logo of about.clients.logos) {
  assert.match(logo.src, /^\/assets\/images\/logo\/.+\.svg$/, `approved logo route for ${logo.name}`);
  const relative = logo.src.replace(/^\/assets\//, "");
  const diskPath = path.join("media-bundle", relative);
  assert.ok(fs.existsSync(diskPath), `bundled SVG exists for ${logo.name}`);
  const svg = fs.readFileSync(diskPath, "utf8");
  assert.match(svg, /^<svg[\s>]/, `valid SVG document for ${logo.name}`);
  assert.match(svg, /viewBox=/, `logo viewBox exists for ${logo.name}`);
}
assert.match(page, /function ClientLogoTile\(\{ name, src \}/);
assert.match(page, /<img[\s\S]*?src=\{src\}[\s\S]*?alt=\{name\}/, "client marks render as named image assets");
assert.match(page, /LUSION_ABOUT\.clients\.carouselRows\.map/);
assert.match(page, /about-client-marquee-track/);
assert.match(page, /aria-hidden=\{copy === 1 \? true : undefined\}/, "duplicated marquee row is hidden from assistive technology");
assert.match(css, /@keyframes about-client-marquee/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /about-client-marquee-set\[aria-hidden="true"\]\s*\{\s*display:\s*none;/);

console.log(`PASS About client wall: ${about.clients.uniqueLogoCount} unique bundled marks across ${about.clients.carouselRows.length} rows; marquee, accessibility and reduced-motion checks passed.`);
