#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';

const dir = fs.mkdtempSync(path.resolve('temp/about-terrain-unit-'));
try {
  const source = fs.readFileSync('src/components/three/AboutTerrain.ts', 'utf8');
  fs.writeFileSync(`${dir}/terrain.mjs`, ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const { terrainHeightAt, createAboutTerrainMaterial } = await import(pathToFileURL(`${dir}/terrain.mjs`));
  assert.match(source, /ridgeC \* \.32/, 'flank mesh keeps high-frequency fractured relief');
  assert.match(source, /micro = .*\.17 \* flankMask/, 'microrelief remains visible on the crater flanks');
  assert.match(source, /amplitude = \.036/, 'screen-space rock relief has enough amplitude to read at desktop scale');
  let min = Infinity, max = -Infinity;
  for (let z = -48; z <= 48; z += .5) {
    for (let x = -48; x <= 48; x += .5) {
      const h = terrainHeightAt(x, z);
      assert.ok(Number.isFinite(h));
      assert.equal(h, terrainHeightAt(x, z), 'height must be deterministic across reverse/reentry');
      min = Math.min(min, h); max = Math.max(max, h);
    }
  }
  assert.ok(min > -4 && max < 20, 'bounded real mesh, not an unbounded procedural surface');
  assert.ok(terrainHeightAt(24, 0) > terrainHeightAt(0, 0) + 5, 'retain valley and flanking ridge hierarchy');
  const a = createAboutTerrainMaterial(), b = createAboutTerrainMaterial();
  assert.notEqual(a.uniforms, b.uniforms, 'remount/context recovery must own fresh uniforms');
  a.uniforms.uOpacity.value = .25;
  assert.equal(b.uniforms.uOpacity.value, 0);
  assert.equal(a.depthWrite, false, 'fading ground cannot invisibly occlude later layers');
  assert.match(a.fragmentShader, /footprint \* frequency/);
  assert.match(a.fragmentShader, /dFdx\(relief\)/);
  assert.match(a.fragmentShader, /#include <tonemapping_fragment>/);
  assert.match(a.fragmentShader, /#include <colorspace_fragment>/);
  assert.match(source, /vec3 sand = vec3\(\.32, \.35, \.36\)/, 'regolith keeps a grey base under a localized light pool');
  assert.match(source, /p\.x < 0\. \? 1\.22 : \.78/, 'left and right flanks retain the measured light/dark split');
  const about = fs.readFileSync('src/components/pages/AboutPageView.tsx', 'utf8');
  assert.match(about, /terrainHeightAt\(-\.35, -1\.8\)/, 'procedural explorer feet use the shared terrain sampler');
  assert.match(about, /terrainHeightAt\(rx, rz\)/, 'grounded pebbles use the same terrain sampler');
  assert.match(about, /hGrid\[j \* \(C_GRID \+ 1\) \+ i\] = terrainHeightAt\(x, z\)/, 'topographic contours use the same terrain sampler');
  assert.match(about, /ROCK_COUNT = 224, FLOATING_ROCK_COUNT = 16/, 'the basin has a small suspended-rock population and grounded pebbles');
  assert.match(about, /about-wide-chromatic-ring/, 'the wide pullback has its own clean-room chromatic edge layer');
  let disposed = 0;
  a.addEventListener('dispose', () => disposed++);
  b.addEventListener('dispose', () => disposed++);
  a.dispose(); b.dispose();
  assert.equal(disposed, 2);
  console.log(`PASS terrain: 37,249 finite/deterministic height samples, bounds ${min.toFixed(3)}..${max.toFixed(3)}, ridge hierarchy, filtered world-space relief, independent uniforms and disposal. Browser compilation checked separately.`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
