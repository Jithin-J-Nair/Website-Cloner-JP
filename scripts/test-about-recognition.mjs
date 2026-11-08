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
assert.match(styles, /prefers-reduced-motion:\s*reduce/, "the About route supplies a reduced-motion override");
// The removed CSS-mask approximation was itself the visual bug. Test the
// reference-shaped implementation instead of pinning that approximation.
assert.doesNotMatch(component + styles, /paintFoil|--foil-|mask-image: radial-gradient/);
assert.doesNotMatch(page, /data-awards-word|--recognition-progress/, "no competing page-level Awards scroll owner");
assert.match(component, /createAboutRecognitionPaint/);
assert.match(component, /createAboutRecognitionMotion/);
assert.match(component, /IntersectionObserver/);
assert.match(component, /webglcontextlost/);
assert.match(component, /premultipliedAlpha: false/, "neutral (.5,.5,0,0) paint clear must not premultiply velocity to zero");
assert.match(component, /visibilitychange/);
assert.match(styles, /--record-left: 44vw; --record-org: 15vw/);
assert.match(styles, /min-height: 130\.208333vw/);
assert.match(styles, /overflow: clip/, "viewport canvas can stick without creating a nested scroller");
assert.match(styles, /gap: 10vh/);
const vector = fs.readFileSync("public/sites/lusion/about/award-title.svg", "utf8");
assert.match(vector, /viewBox="0 0 1440 1250"/);
assert.equal((vector.match(/<path /g) || []).length, 1);
assert.doesNotMatch(vector, /<script|<text|<image|onload|href=/i, "static title artwork, not executable SVG or an external font");
console.log("PASS About recognition content/structure: 58 awards, 3 secure articles, 5 talks; source vector and column metrics; one scoped GPU/editorial owner with fallback and reduced motion.");
