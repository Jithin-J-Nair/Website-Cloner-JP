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
  let min = Infinity, max = -Infinity;
  for (let z = -32; z <= 32; z += .5) {
    for (let x = -32; x <= 32; x += .5) {
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
  let disposed = 0;
  a.addEventListener('dispose', () => disposed++);
  b.addEventListener('dispose', () => disposed++);
  a.dispose(); b.dispose();
  assert.equal(disposed, 2);
  console.log(`PASS terrain: 16,641 finite/deterministic height samples, bounds ${min.toFixed(3)}..${max.toFixed(3)}, ridge hierarchy, filtered world-space relief, independent uniforms and disposal. Browser compilation checked separately.`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
