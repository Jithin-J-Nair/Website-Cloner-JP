import assert from "node:assert/strict";
import fs from "node:fs";

const reference = JSON.parse(fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8")).about;
const page = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
const css = fs.readFileSync("src/app/globals.css", "utf8");
const recognition = reference.recognition;

const awardsSum = recognition.awardGroups.reduce((sum, group) => sum + group.honors.reduce((n, honor) => n + honor.count, 0), 0);
assert.equal(awardsSum, 58, "award line items reconcile to the published total");
assert.equal(recognition.awardsVerifiedSum, 58);
assert.equal(recognition.articles.length, 3);
assert.equal(recognition.talks.length, 5);
for (const article of recognition.articles) assert.match(article.href, /^https:\/\//, `secure external article link: ${article.title}`);

assert.match(page, /data-award-reveal/);
assert.match(page, /new IntersectionObserver/);
assert.match(page, /revealObserver\?\.unobserve/);
assert.match(page, /delete award\.dataset\.awardsMotionReady/);
assert.match(page, /LUSION_ABOUT\.recognition\.awardGroups\.map/);
assert.match(page, /LUSION_ABOUT\.recognition\.articles\.map/);
assert.match(page, /LUSION_ABOUT\.recognition\.talks\.map/);
assert.match(css, /#about-award\[data-awards-motion-ready="true"\]/);
assert.match(css, /prefers-reduced-motion:\s*reduce[\s\S]*?#about-award\[data-awards-motion-ready="true"\]/);
assert.match(css, /about-award-honor:hover/);
assert.match(css, /about-recognition-link:hover/);

console.log("PASS About recognition ledger: 58 awards reconcile, 3 article links and 5 talks remain intact; reveals and reduced-motion fallback are present.");
