import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const about = JSON.parse(fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8")).about;
const page = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

assert.equal(about.clients.carouselRows.length, 3, "About client wall keeps its three source rows");
assert.equal(about.clients.uniqueLogoCount, 15, "About client wall keeps the 15-brand source set");
const brands = about.clients.carouselRows.flat();
assert.ok(brands.length >= about.clients.uniqueLogoCount, "all source row entries remain represented");
assert.equal(new Set(brands.map(brand => brand.id)).size, about.clients.uniqueLogoCount, "all 15 brands are represented exactly once before marquee duplication");
for (const brand of brands) {
  const asset = path.join("media-bundle", brand.src.replace(/^\/assets\//, ""));
  assert.ok(fs.existsSync(asset), `verified local brand SVG is staged: ${brand.id}`);
}
assert.match(page, /function ClientLogoTile\(\{ name, src, id \}: \{ name: string; src: string; id: string \}\)/, "tiles receive their source names and bundled SVG paths");
assert.match(page, /const label = id === "cocacola" \? "Coca-Cola European Partners" : name/, "the label reflects the source brand identification");
assert.match(page, /<img src=\{src\} alt=\{label\} width=\{240\} height=\{240\} loading="lazy" decoding="async" className="about-client-logo-art" \/>/, "brand artwork is lazily loaded with an explicit accessible label");
assert.doesNotMatch(page, /about-client-wordmark/, "the retired text-only fallback is not rendered");
assert.match(page, /LUSION_ABOUT\.clients\.carouselRows\.map/);
assert.match(page, /about-client-marquee-track/);
assert.match(page, /new IntersectionObserver/, "marquee work is observed on entry and exit");
assert.match(page, /classList\.toggle\("is-in-view", entry\.isIntersecting\)/, "visibility controls play state");
assert.match(css, /\.about-client-logo-art\s*\{[\s\S]*?height:\s*calc\(100% - 1rem\)[\s\S]*?object-fit:\s*contain/, "source artwork scales inside the responsive logo tile");
assert.match(css, /\.about-client-marquee:hover \.about-client-logo-art/, "hover enhancement targets actual brand artwork");
assert.match(css, /animation-play-state:\s*paused/);
assert.match(css, /\.about-client-marquee\.is-in-view \.about-client-marquee-track\s*\{\s*animation-play-state:\s*running;/);
assert.match(page, /role="list"/, "each marquee row is exposed as a semantic list");
assert.match(page, /role="listitem"/, "each brand has a list-item relationship");
assert.match(page, /aria-hidden=\{copy === 1 \? true : undefined\}/, "duplicated marquee row is hidden from assistive technology");
assert.match(css, /@keyframes about-client-marquee/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /about-client-marquee-set\[aria-hidden="true"\]\s*\{\s*display:\s*none;/);
assert.doesNotMatch(css, /about-client-wordmark/, "obsolete text-only wordmark styling is removed");
console.log("PASS About image-based client wall: 15 verified source SVGs across 3 rows; responsive sizing, semantic list, duplicate hiding, marquee lifecycle and reduced-motion behavior.");
