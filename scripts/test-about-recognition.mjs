import assert from "node:assert/strict";
import fs from "node:fs";

const reference = JSON.parse(
  fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8")
).about;
const page = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
const component = fs.readFileSync("src/components/pages/AboutRecognition.tsx", "utf8");
const styles = fs.readFileSync("src/components/pages/AboutPageStyles.tsx", "utf8");
const recognition = reference.recognition;
const awardsSum = recognition.awardGroups.reduce(
  (sum, group) => sum + group.honors.reduce((n, honor) => n + honor.count, 0),
  0
);

assert.equal(awardsSum, 58, "award line items reconcile to the published total");
assert.equal(recognition.awardsVerifiedSum, 58);
assert.equal(recognition.articles.length, 3);
assert.equal(recognition.talks.length, 5);
for (const article of recognition.articles) {
  assert.match(article.href, /^https:\/\//, `secure external article link: ${article.title}`);
}
assert.match(page, /<AboutRecognition\s*\/>/, "About page mounts the independent recognition renderer");
assert.match(component, /className="about-source-recognition"/);
assert.match(component, /id="about-recognition-window" role="region" aria-label="Awards, articles and talks" tabIndex=\{0\}/,
  "recognition content is a keyboard-focusable named region");
assert.match(component, /about-source-award-group/, "award groups preserve organization and honor hierarchy");
assert.match(component, /about-source-articles/, "article links remain independently navigable");
assert.match(component, /about-source-talks/, "talks retain their event and date/location rows");
assert.match(component, /target="_blank" rel="noopener noreferrer"/, "external article links are opened securely");
assert.match(styles, /#about \.about-source-recognition/);
assert.match(styles, /#about #about-recognition-window/);
assert.match(styles, /#about \.about-source-record/);
assert.match(styles, /#about \.about-source-award-group/);
assert.match(styles, /#about \.about-source-articles/);
assert.match(styles, /#about \.about-source-talks/);
assert.match(styles, /prefers-reduced-motion:\s*reduce/, "the About route supplies a reduced-motion override for foil animation");
assert.match(styles, /mask-image: radial-gradient\(ellipse 5vw 4vw/, "foil is a compact pointer-local highlight");
assert.match(styles, /-webkit-text-stroke: 1.5px #d9ecff/, "glint follows the outline rather than filling a broad letter band");
assert.match(styles, /drop-shadow/, "outline retains its prismatic color separation");
console.log("PASS About recognition: 58 awards reconcile, 3 secure article links and 5 talks; split component, keyboard region, responsive scoped styles and reduced-motion foil support.");
