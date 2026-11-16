#!/usr/bin/env node
/** Actual captured team decode, interruptible morph and resource-lifecycle tests. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/about-source-team-test-'));
const originalFetch = globalThis.fetch;
let team;
try {
  for (const [source, target] of [['src/lib/about-source-buffer.ts', 'buffer.mjs'], ['src/components/three/AboutSourceTeam.ts', 'team.mjs']]) {
    const text = fs.readFileSync(source, 'utf8').replace('@/lib/about-source-buffer', './buffer.mjs');
    fs.writeFileSync(path.join(dir, target), ts.transpileModule(text, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    }).outputText);
  }
  const { decodeAboutSourceBuffer } = await import(pathToFileURL(path.join(dir, 'buffer.mjs')));
  const { createAboutSourceTeam } = await import(pathToFileURL(path.join(dir, 'team.mjs')));
  const ids = ['edan', 'ffi', 'pierre', 'yannic', 'paul', 'andrii', 'sunny'];
  const data = new Map();
  for (const id of [...ids, 'contours']) {
    const bytes = fs.readFileSync(id === 'contours' ? 'media-bundle/models/about/terrain_lines.buf' : `media-bundle/team/${id}.buf`);
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    const decoded = decodeAboutSourceBuffer(buffer);
    assert.equal(decoded.count, id === 'contours' ? 11832 : 8192);
    assert.equal(decoded.attributes.position.length, decoded.count * 3);
    assert.ok(decoded.attributes.position.every(Number.isFinite));
    if (id !== 'contours') assert.equal(decoded.attributes.nShade.length, 8192 * 4);
    assert.throws(() => decodeAboutSourceBuffer(buffer.slice(0, buffer.byteLength - 1)), /Truncated|layout/);
    data.set(id, { bytes, decoded });
  }
  assert.throws(() => decodeAboutSourceBuffer(new ArrayBuffer(4)), /Invalid/);
  let signal;
  globalThis.fetch = async (url, options) => {
    signal = options.signal;
    const id = String(url).split('/').pop().replace('.buf', '');
    assert.ok(data.has(id), `only allowlisted captured assets fetched: ${id}`);
    return new Response(data.get(id).bytes);
  };
  const states = [];
  team = createAboutSourceTeam(() => {}, (state, id) => states.push({ state, id }));
  await team.setMember(0, false);
  assert.equal(team.count, 8192);
  assert.equal(team.ready, true);
  const points = team.head.children[0];
  assert.deepEqual(points.geometry.getAttribute('position').array, data.get('edan').decoded.attributes.position);
  const camera = new THREE.PerspectiveCamera(45, 1, .1, 100);
  const update = (time, reduced = false) => team.update(camera, time, 1, 0, new THREE.Vector2(), 1440, 900, 1, reduced, 1);
  update(1);
  await team.setMember(1, false);
  assert.equal(team.member, 'ffi');
  assert.equal(team.morph, 0);
  update(1.1);
  const t = team.morph ** 2 * (3 - 2 * team.morph);
  const from = points.geometry.getAttribute('aFrom').array;
  const to = points.geometry.getAttribute('position').array;
  const visible = Float32Array.from(from, (v, i) => v * (1 - t) + to[i] * t);
  await team.setMember(2, false);
  assert.deepEqual(points.geometry.getAttribute('aFrom').array, visible, 'interrupted morph preserves the visible surface');
  for (let i = 0; i < ids.length; i++) {
    await team.setMember(i, true);
    assert.equal(team.member, ids[i]);
    assert.equal(team.morph, 1, 'reduced motion is an immediate source-buffer swap');
    assert.deepEqual(points.geometry.getAttribute('position').array, data.get(ids[i]).decoded.attributes.position);
  }
  await Promise.all([team.setMember(2, false), team.setMember(4, false)]);
  assert.equal(team.member, 'paul', 'latest selection wins');
  await team.setMember(NaN, true); assert.equal(team.member, 'edan');
  await team.setMember(999, true); assert.equal(team.member, 'sunny');
  update(2, true); assert.equal(points.material.uniforms.uTime.value, 0);
  let disposals = 0;
  points.geometry.addEventListener('dispose', () => disposals++);
  points.material.addEventListener('dispose', () => disposals++);
  team.dispose();
  assert.equal(signal.aborted, true);
  assert.equal(disposals, 2);
  const count = states.length;
  await team.setMember(0, false); assert.equal(states.length, count, 'disposed scene cannot schedule new loads');
  team = undefined;
  console.log('PASS seven captured heads, contours, corrupt buffers, exact 8192 points, interrupted morph continuity, latest selection, reduced motion and disposal.');
} finally {
  team?.dispose();
  globalThis.fetch = originalFetch;
  fs.rmSync(dir, { recursive: true });
}
