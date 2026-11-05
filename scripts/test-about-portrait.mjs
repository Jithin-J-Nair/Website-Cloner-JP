#!/usr/bin/env node
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";

const dir = fs.mkdtempSync(path.resolve("temp/about-portrait-"));
try {
  const source = fs.readFileSync("src/lib/about-portrait-geometry.ts", "utf8");
  const file = `${dir}/portrait.mjs`;
  fs.writeFileSync(file, ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const { buildSculpturalPortraitPositions: build } = await import(pathToFileURL(file));

  const inspect = positions => {
    assert.ok(positions instanceof Float32Array);
    assert.ok(positions.length % 3 === 0);
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity, minZ = Infinity, maxZ = -Infinity;
    let forwardBandX = 0, forwardBandCount = 0;
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i], y = positions[i + 1], z = positions[i + 2];
      assert.ok(Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z), "all generated point coordinates stay finite");
      minX = Math.min(minX, x); maxX = Math.max(maxX, x);
      minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
      if (y >= 0.12 && y <= 0.32) { forwardBandX += x; forwardBandCount++; }
    }
    return { minX, maxX, minY, maxY, minZ, maxZ, forwardMeanX: forwardBandX / Math.max(1, forwardBandCount) };
  };

  for (const count of [8192, 16384, 24576]) {
    const tier = build(2, count);
    assert.equal(tier.length, count * 3, `portrait quality tier allocates exactly ${count} 3D points`);
    assert.ok(tier.every(Number.isFinite), `portrait quality tier ${count} remains finite`);
  }
  const baseline = build(0, 8192);
  const deterministic = build(0, 8192);
  assert.deepEqual(baseline, deterministic, "the same member seed produces the same point cloud");
  const metrics = inspect(baseline);
  let noseBandMaxX = -Infinity, foreheadBandMaxX = -Infinity;
  for (let i = 0; i < baseline.length; i += 3) {
    const x = baseline[i], y = baseline[i + 1];
    if (y >= 0.10 && y <= 0.27) noseBandMaxX = Math.max(noseBandMaxX, x);
    if (y >= 0.48 && y <= 0.82) foreheadBandMaxX = Math.max(foreheadBandMaxX, x);
  }
  assert.ok(noseBandMaxX > foreheadBandMaxX + 0.8, "side-profile nose projects distinctly beyond the forehead contour");
  assert.ok(metrics.maxX - metrics.minX > 3, "profile and shoulder silhouette occupy a human-scale horizontal span");
  assert.ok(metrics.maxY > 1.3 && metrics.minY < -1.5, "portrait has a full head-to-shoulder vertical extent");
  assert.ok(metrics.maxZ - metrics.minZ > 0.25, "the portrait retains actual 3D depth");
  assert.ok(metrics.forwardBandX > 0 || metrics.forwardMeanX > 0, "front profile has a measurable horizontal direction");

  const mirrored = inspect(build(1, 8192));
  assert.ok(mirrored.forwardMeanX < 0, "alternating variants mirror the face direction without reusing likeness data");
  assert.ok(build(3, 8192).some((value, index) => value !== baseline[index]), "different team indices produce distinct deterministic studies");
  assert.equal(build(2, 512).length, 512 * 3, "small quality tiers keep an exact point count");
  assert.equal(build(2, 0).length, 3, "invalid zero count is clamped to one safe point");
  assert.equal(build(NaN, 128).length, 128 * 3, "invalid member index falls back to a stable seed");
  const page = fs.readFileSync("src/components/pages/AboutPageView.tsx", "utf8");
  assert.match(page, /tier === "medium" \? 16384 : 24576/, "desktop medium/high portrait tiers are 16K/24K");
  assert.match(page, /portraitCountRef\.current = reducedMotion \|\| software \|\| window\.innerWidth < 820 \|\| tier === "low"/, "mobile, low and reduced-motion tiers cap at 8K");
  assert.match(page, /function PixelGlyph\(/, "team HUD includes a procedural pixel-font initial");
  assert.match(page, /shapeRendering="crispEdges"/, "team initial uses crisp block pixels");
  assert.match(page, /<PixelGlyph[\s\S]*?char=\{activeMember\.name\[0\]\}/, "glyph follows the active team member");
  assert.match(page, /className="sr-only">Abstract procedural visualization; not a likeness/, "procedural/non-likeness clarification stays available to assistive technology without adding visible HUD copy");

  console.log("PASS About portrait geometry: deterministic, bounded, finite 3D side-profile silhouettes; distinct mirrored variants; exact point counts and safe input fallbacks.");
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
