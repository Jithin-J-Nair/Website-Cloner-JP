#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";

const source = JSON.parse(
  fs.readFileSync("src/data/reference/lusion-ground-truth.json", "utf8")
);
const about = source.about.who;

assert.equal(
  about.detailsTop,
  "A worldwide team of specialists in design, motion, 3D, and technology",
  "About screen-reader introduction must preserve the live sentence spacing"
);
assert.equal(
  about.detailsBottom,
  "working together to turn ambitious ideas into immersive digital experiences.",
  "About screen-reader continuation must preserve the live sentence spacing"
);

const view = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
assert.match(view, /<p>\{LUSION_ABOUT\.who\.detailsTop\}<\/p>/);
assert.match(view, /<p>\{LUSION_ABOUT\.who\.detailsBottom\}<\/p>/);

console.log("PASS About accessible introduction matches current live copy with correct word spacing.");
