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
assert.ok(view.includes('プロンプトエンジニアリング、 AIエージェント向けスキルの設計・開発、 業務自動化。'));
assert.match(view, /<p lang="ja">プロンプトエンジニアリング、/);
assert.match(view, /<p lang="ja">ひらめきで終わらせず、/);

console.log("PASS About accessible Japanese introduction and Japanese continuation.");
