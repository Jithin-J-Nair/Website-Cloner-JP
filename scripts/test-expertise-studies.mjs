#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/expertise-unit-'));
try {
  fs.writeFileSync(`${dir}/study.mjs`, ts.transpileModule(fs.readFileSync('src/components/three/ExpertiseStudies.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  const { createExpertiseStudy } = await import(pathToFileURL(`${dir}/study.mjs`));
  let vertices = 0;
  for (let i = 0; i < 4; i++) {
    const a = createExpertiseStudy(i), b = createExpertiseStudy(i);
    const p = a.geometry.attributes.position;
    assert.equal(a.group.children.length, 1);
    assert.equal(p.count % 2, 0); assert.ok(p.count > 30);
    assert.ok(p.array.every(Number.isFinite));
    assert.deepEqual(p.array, b.geometry.attributes.position.array);
    assert.ok(a.geometry.boundingSphere.radius > .5 && a.geometry.boundingSphere.radius < 3);
    assert.ok(Array.from(p.array).some((v, index) => index % 3 === 2 && Math.abs(v) > .1), 'genuine non-planar geometry');
    vertices += p.count;
    let disposed = 0;
    a.geometry.addEventListener('dispose', () => disposed++);
    a.material.addEventListener('dispose', () => disposed++);
    a.dispose(); a.dispose(); assert.equal(disposed, 2); b.dispose();
  }
  assert.ok(vertices < 10000);
  // The terrain tile must be independently owned, deterministic and released with its material.
  fs.writeFileSync(`${dir}/terrain.mjs`, ts.transpileModule(fs.readFileSync('src/components/three/AboutTerrain.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  const { createAboutTerrainMaterial } = await import(pathToFileURL(`${dir}/terrain.mjs`));
  const a = createAboutTerrainMaterial(), b = createAboutTerrainMaterial();
  const texture = a.uniforms.uRockNoise.value;
  assert.notEqual(texture, b.uniforms.uRockNoise.value);
  assert.deepEqual(texture.image.data, b.uniforms.uRockNoise.value.image.data);
  assert.equal(texture.image.data.length, 256 * 256); assert.equal(texture.generateMipmaps, true);
  let disposed = 0; texture.addEventListener('dispose', () => disposed++);
  a.dispose(); a.dispose(); assert.equal(disposed, 1); b.dispose();
  console.log(`PASS four deterministic bounded non-planar studies (${vertices} vertices), idempotent disposal; original mipmapped terrain tile determinism/ownership/disposal.`);
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
