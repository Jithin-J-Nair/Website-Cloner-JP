#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/contact-unit-'));
try {
  const file = `${dir}/field.mjs`;
  fs.writeFileSync(file, ts.transpileModule(fs.readFileSync('src/components/three/ContactParticleField.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
  const { createContactParticleField } = await import(pathToFileURL(file));
  for (const count of [720, 960, 1600, 2400]) {
    const a = createContactParticleField(count), b = createContactParticleField(count);
    assert.equal(a.group.children.length, 3);
    assert.equal(a.group.children.reduce((n, m) => n + m.geometry.instanceCount, 0), count);
    let triangles = 0, disposals = 0;
    for (const [i, mesh] of a.group.children.entries()) {
      const other = b.group.children[i], seeds = mesh.geometry.attributes.aSeed.array;
      assert.deepEqual(seeds, other.geometry.attributes.aSeed.array);
      assert.ok(seeds.every(Number.isFinite));
      const orientations = mesh.geometry.attributes.aOrientation.array;
      assert.deepEqual(orientations, other.geometry.attributes.aOrientation.array);
      for (let j = 0; j < orientations.length; j += 4) assert.ok(Math.abs(Math.hypot(...orientations.slice(j, j + 4)) - 1) < 1e-6);
      assert.ok(mesh.geometry.attributes.position.array.every(Number.isFinite));
      assert.ok(mesh.geometry.attributes.normal.array.every(Number.isFinite));
      assert.equal(mesh.material.uniforms, a.uniforms);
      assert.equal(mesh.material.depthWrite, true);
      triangles += mesh.geometry.index.count / 3 * mesh.geometry.instanceCount;
      mesh.geometry.addEventListener('dispose', () => disposals++);
    }
    assert.ok(triangles <= count * 24, 'bounded real extruded geometry');
    assert.match(a.group.children[0].material.vertexShader, /uProgress/);
    assert.match(a.group.children[0].material.vertexShader, /uTextBottom/);
    const vertexShader = a.group.children[0].material.vertexShader;
    assert.match(vertexShader, /uPointer/);
    assert.match(vertexShader, /fallWidth/, 'incoming stream must occupy a broad, gathering footprint');
    assert.match(vertexShader, /step\(aSeed\.z,\s*-.28\)/, 'the emitter must use a broad particle population, not a narrow minority');
    assert.match(vertexShader, /mix\(\.82,\s*\.48,\s*gather\)/, 'the incoming sheet must stay broad as it gathers into the mound');
    assert.match(vertexShader, /pow\(1\.\s*-\s*h,\s*\.88\)/, 'the upper cloud must retain lateral width near the title');
    assert.match(vertexShader, /depthFlow/, 'falling grains must occupy real depth, not a flat ribbon');
    assert.match(vertexShader, /radial \* influence \* \.72/, 'pointer response must deflect the field in 3D');
    assert.match(vertexShader, /tangent \* influence \* \.26/, 'pointer response must impart a tangential sweep');
    assert.doesNotMatch(vertexShader, /sin\(aSeed\.x \* 7\..*\) \* \.12/, 'the former near-zero-width emitter must not return');
    assert.match(a.group.children[0].material.fragmentShader, /vNormal/);
    a.setTime(2); assert.equal(a.uniforms.uTime.value, 2); a.setTime(NaN); assert.equal(a.uniforms.uTime.value, 0);
    a.dispose(); a.dispose(); assert.equal(disposals, 3, 'idempotent geometry ownership'); b.dispose();
  }
  for (const [input, expected] of [[Infinity, 960], [-1, 120]]) { const field = createContactParticleField(input); assert.equal(field.count, expected); field.dispose(); }
  console.log('PASS contact field: all quality counts, deterministic finite typed seeds/positions/normals, three instanced meshes, bounded triangles, shared progress/pointer/type contour packet and idempotent disposal. Browser compilation checked separately.');
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
