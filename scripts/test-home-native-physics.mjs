#!/usr/bin/env node
/** New solver numerical gates, independent of the retained legacy capsule tests.
 * No renderer, DOM interaction, wall-clock FPS or visual-parity claim. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/native-physics-'));
try {
  const file = path.join(dir, 'physics.mjs');
  fs.writeFileSync(file, ts.transpileModule(fs.readFileSync('src/lib/home-native-physics.ts', 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const { HomeNativePhysics, HOME_NATIVE_MATERIALS, createHomeSeed } = await import(pathToFileURL(file));
  const snapshot = solver => solver.bodies.map(b => [b.position.toArray(), b.velocity.toArray(), b.quaternion.toArray()]);
  const finite = solver => solver.bodies.forEach(b => {
    assert.ok([...b.position.toArray(), ...b.velocity.toArray(), ...b.quaternion.toArray()].every(Number.isFinite));
    assert.ok(Math.abs(b.quaternion.length() - 1) < 1e-8);
    assert.equal(b.radius, 1.05);
  });
  for (const mobile of [false, true]) {
    const a = new HomeNativePhysics(mobile), b = new HomeNativePhysics(mobile);
    assert.equal(a.bodies.length, mobile ? 22 : 24);
    assert.equal(HOME_NATIVE_MATERIALS.slice(0, a.bodies.length).filter(s => s.endsWith('glass')).length, mobile ? 0 : 2);
    assert.deepEqual(snapshot(a), snapshot(b), 'warm-start and seed must be reproducible');
    const frozen = snapshot(a);
    for (let i = 0; i < 10; i++) a.step(1, null, true);
    assert.deepEqual(snapshot(a), frozen, 'reduced motion cannot integrate bodies');
    const target = b.bodies[0].position.clone();
    const ray = new THREE.Ray(target.clone().add(new THREE.Vector3(.3, 0, 15)), new THREE.Vector3(0, 0, -1));
    let touched = 0, displacement = 0;
    for (let i = 0; i < 25; i++) {
      const state = b.step(1 / 60, ray, false); a.step(1 / 60, null, false);
      touched += state.influencedPieces; displacement += b.pointerDisplacement;
    }
    assert.ok(touched >= 2 && displacement > .01, 'ray must cause real positional pushes');
    assert.notDeepEqual(snapshot(a), snapshot(b), 'pointer simulation must differ from no-ray control');
    b.impulse(); const thrown = b.step(.05, null, false).kineticEnergy;
    for (let i = 0; i < 1200; i++) b.step(1 / 60, null, false);
    assert.equal(b.interactionEnergy, 0, 'release energy must reach exact zero');
    assert.ok(b.stats.kineticEnergy < thrown, 'contact drag must dissipate a click impulse');
    assert.ok(b.stats.meanRadius < 4, 'central gravity must recover a compact cloud');
    assert.ok(b.stats.kineticEnergy > .001, 'native idle motion remains live');
    finite(a); finite(b);
  }
  for (const dt of [1 / 240, 1 / 120, 1 / 60, .05, .25, 1, 2]) {
    const p = new HomeNativePhysics(false); p.interactionEnergy = 1;
    let previous = 1;
    for (let elapsed = 0; elapsed < 6; elapsed += dt) {
      const { interactionEnergy } = p.step(dt, null, false);
      assert.ok(interactionEnergy >= 0 && interactionEnergy <= previous); previous = interactionEnergy; finite(p);
    }
    assert.equal(p.interactionEnergy, 0, 'release clock uses uncapped elapsed input');
  }
  const pulse = new HomeNativePhysics(false); pulse.impulse();
  assert.equal(pulse.step(2, null, false).interactionEnergy, 1, 'new pulse cannot age by a preceding stalled frame');
  assert.ok(pulse.step(.1, null, false).interactionEnergy < 1, 'subsequent release must still decay');
  const slow = new HomeNativePhysics(false), capped = new HomeNativePhysics(false);
  slow.step(1, null, false); capped.step(.05, null, false);
  assert.deepEqual(snapshot(slow), snapshot(capped), 'stalls may integrate at most three fixed substeps');
  const r = createHomeSeed('balloonBody-25'), again = createHomeSeed('balloonBody-25');
  assert.deepEqual(Array.from({length: 100}, r), Array.from({length: 100}, again));
  console.log('PASS native solver: 22/24 bodies, equal radii, deterministic spawn, reduced freeze, ray displacement, release, gravity recovery, normalized rotation, bounded stalls.');
} finally { fs.rmSync(dir, {recursive: true}); }
