#!/usr/bin/env node
/** Isolated solver diagnostic, NOT a DOM pointer-cancel or visual-parity test. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/home-pointer-decay-'));
const geometry = new THREE.BufferGeometry();
const material = new THREE.MeshBasicMaterial();
try {
  const source = fs.readFileSync('src/lib/home-free-body-physics.ts', 'utf8');
  const file = path.join(dir, 'physics.mjs');
  fs.writeFileSync(file, ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const { HomeConnectorPhysics } = await import(pathToFileURL(file));
  const results = [];
  for (const frameDt of [1 / 240, 1 / 120, 1 / 60, 1 / 20]) {
    const positions = [new THREE.Vector3(-1, 0, 0), new THREE.Vector3(1, 0, 0)];
    const meshes = positions.map(() => new THREE.Mesh(geometry, material));
    const linear = positions.map(() => new THREE.Vector3());
    const angular = positions.map(() => new THREE.Vector3());
    const physics = new HomeConnectorPhysics(meshes, positions, linear, angular);
    // Seed the solver's documented maximum interaction energy, then provide no ray.
    // This isolates decay math; it does not simulate React event delivery or a renderer.
    physics.interactionEnergy = 1;
    let time = 0;
    let previous = 1;
    let frames = 0;
    while (time < 6 && physics.interactionEnergy > 0) {
      time += frameDt;
      const state = physics.step(frameDt, time, null, new THREE.Vector3());
      assert.ok(Number.isFinite(state.interactionEnergy));
      assert.ok(state.interactionEnergy >= 0 && state.interactionEnergy <= previous);
      for (const p of positions) assert.ok([p.x, p.y, p.z].every(Number.isFinite));
      previous = state.interactionEnergy;
      frames++;
    }
    assert.equal(physics.interactionEnergy, 0, 'no-ray energy decays to exact zero within six simulated seconds');
    results.push({ frameDt, frames, simulatedSeconds: Number(time.toFixed(5)), finalEnergy: physics.interactionEnergy });
  }
  console.log(JSON.stringify({
    scope: 'Two-body numerical isolation with energy seeded to 1. Not wall-clock FPS, DOM cancellation, original physics or rendered motion verification.',
    results,
  }, null, 2));
  console.log('PASS isolated no-pointer solver decay; browser cancellation failure remains open.');
} finally {
  geometry.dispose();
  material.dispose();
  fs.rmSync(dir, { recursive: true });
}
