import assert from "node:assert/strict";
import fs from "node:fs";

const about = JSON.parse(fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8")).about;
const page = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");

assert.equal(about.clients.carouselRows.length, 3, "About client wall keeps its three source rows");
assert.equal(about.clients.uniqueLogoCount, 15, "About client wall keeps the 15-brand source set");
assert.ok(about.clients.carouselRows.flat().length >= about.clients.uniqueLogoCount, "all source row entries remain represented");
assert.match(page, /function ClientLogoTile\(\{ name \}: \{ name: string \}\)/, "brand tiles render from names only");
assert.match(page, /className="about-client-wordmark" aria-label=\{name\}/, "brand fallback is accessible text, not copied logo art");
assert.doesNotMatch(page, /<img[\s\S]*?client\.src|src=\{src\}/, "About client wall never requests archived/captured logo SVGs");
assert.match(page, /LUSION_ABOUT\.clients\.carouselRows\.map/);
assert.match(page, /about-client-marquee-track/);
assert.match(page, /new IntersectionObserver/, "marquee work is observed on entry and exit");
assert.match(page, /classList\.toggle\("is-in-view", entry\.isIntersecting\)/, "visibility controls play state");
assert.match(css, /animation-play-state:\s*paused/);
assert.match(css, /\.about-client-marquee\.is-in-view \.about-client-marquee-track\s*\{\s*animation-play-state:\s*running;/);
assert.match(page, /role="list"/, "each marquee row is exposed as a semantic list");
assert.match(page, /role="listitem"/, "each brand has a list-item relationship");
assert.match(page, /aria-hidden=\{copy === 1 \? true : undefined\}/, "duplicated marquee row is hidden from assistive technology");
assert.match(css, /@keyframes about-client-marquee/);
assert.match(css, /prefers-reduced-motion:\s*reduce/);
assert.match(css, /about-client-marquee-set\[aria-hidden="true"\]\s*\{\s*display:\s*none;/);
console.log("PASS About text-only client wall: 15 source brand names across 3 rows; no archived SVG request; marquee, accessibility and reduced-motion checks passed.");
