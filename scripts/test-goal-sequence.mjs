#!/usr/bin/env node
/** Asset-backed math regression tests; no browser/WebGL required. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';

fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/goal-unit-'));
try {
  for (const name of ['lib/lusion-buf-loader', 'components/home/GoalDownstreamScenes', 'components/home/AstronautEmergenceAssets']) {
    const source = fs.readFileSync(`src/${name}.ts`, 'utf8').replaceAll('@/lib/lusion-buf-loader', './lusion-buf-loader.mjs');
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
    fs.writeFileSync(path.join(dir, `${path.basename(name)}.mjs`), compiled);
  }
  const { parseLusionBuf } = await import(pathToFileURL(path.join(dir, 'lusion-buf-loader.mjs')));
  const { decodeCapturedGirder, createGlassFrameSampler, createGoalPlaybackPath } = await import(pathToFileURL(path.join(dir, 'GoalDownstreamScenes.mjs')));
  const { createCapturedPoseSampler, createCapturedRootSampler, applyCapturedDualQuaternionSkinning } = await import(pathToFileURL(path.join(dir, 'AstronautEmergenceAssets.mjs')));
  const load = (name) => {
    const data = fs.readFileSync(`media-bundle/models/tunnels/${name}.buf`);
    return parseLusionBuf(data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength));
  };

  for (const height of [844, 900, 1200]) {
    const m = { emergenceStart: height * 8, emergenceSpan: height * 2.5,
      tunnelStart: height * 10.5, tunnelSpan: height * 29.2, imgOutTop: height * 39.9,
      endTop: height * 42, endHeight: height * 2.48, viewportH: height };
    const path = createGoalPlaybackPath(m);
    assert.equal(path(0), m.emergenceStart + m.emergenceSpan * 0.308);
    assert.equal(path(1), m.endTop + m.endHeight * 0.42);
    assert.equal(path(-1), path(0)); assert.equal(path(2), path(1));
    let previous = path(0);
    for (let i = 1; i <= 10000; i++) {
      const y = path(i / 10000);
      assert.ok(Number.isFinite(y) && y >= previous, 'playhead may never reverse or overshoot');
      previous = y;
    }
    for (const u of [0.16, 0.23, 0.47, 0.61, 0.78, 0.83, 0.89, 0.95]) {
      const e = 1e-7;
      const a = (path(u) - path(u - e)) / e, b = (path(u + e) - path(u)) / e;
      assert.ok(Math.abs(a - b) / Math.max(1, a, b) < 0.0001, 'C1 velocity continuity between cinematic beats');
    }
  }
  console.log('PASS: monotone cinematic activation/end, clamping, 30,000 samples and continuous beat velocity');

  const source = load('grid_base_hd');
  const original = source.attributes.position.slice();
  const girder = decodeCapturedGirder(source.geometry);
  const box = girder.boundingBox;
  assert.ok(box.min.x > -0.041 && box.max.x < 0.041);
  assert.ok(box.min.y > -0.041 && box.max.y < 0.041);
  assert.equal(box.min.z, -0.5);
  assert.equal(box.max.z, 0.5);
  assert.equal(girder.index.count, source.header.indexCount);
  assert.deepEqual(source.attributes.position, original, 'cached source must never be mutated');
  const normals = girder.getAttribute('normal');
  for (let i = 0; i < normals.count; i++) assert.ok(Math.abs(Math.hypot(normals.getX(i), normals.getY(i), normals.getZ(i)) - 1) < 1e-5);
  console.log('PASS: four encoded girder faces decode to the captured low-detail cross-section; source immutable');

  const tangent = girder.getAttribute('tangent');
  for (let i = 0; i < tangent.count; i++) {
    const n = new THREE.Vector3().fromBufferAttribute(normals,i);
    const t = new THREE.Vector3().fromBufferAttribute(tangent,i);
    assert.ok(Math.abs(n.dot(t)) < 0.005, 'decoded atlas tangent stays orthogonal to its face normal');
    assert.ok(Math.abs(t.length()-1) < 0.005);
    assert.equal(tangent.getW(i),source.geometry.getAttribute('tangent').getW(i));
  }
  const inner = load('grid_structure_hd'), outer = load('grid_structure_ld');
  assert.equal(inner.header.vertexCount,96);
  assert.equal(outer.header.vertexCount,456);
  assert.equal(inner.header.vertexCount * 3 + outer.header.vertexCount * 3,1656);
  assert.ok([...outer.attributes.position].every(Number.isFinite));
  console.log('PASS: decoded TBN handedness and captured 96-inner / 456-outer placement budget');

  for (const name of ['astronaut_in_animation','astronaut_out_animation']) {
    const data = load(name);
    const sampleRoot = createCapturedRootSampler(data);
    const p = new THREE.Vector3(), q = new THREE.Quaternion();
    const states = [];
    for (let i = 0; i <= 200; i++) {
      const frame = i*99/200;
      sampleRoot(frame,p,q);
      assert.ok([...p.toArray(),...q.toArray()].every(Number.isFinite));
      assert.ok(Math.abs(q.length()-1) < 1e-7);
      states.push({frame,p:p.toArray(),q:q.toArray()});
    }
    for (const state of states.reverse()) {
      sampleRoot(state.frame,p,q);
      assert.deepEqual(p.toArray(),state.p);
      assert.deepEqual(q.toArray(),state.q,'root quaternions may not accumulate through reverse samples');
    }
    sampleRoot(-5,p,q);
    assert.ok(p.distanceTo(new THREE.Vector3().fromArray(data.attributes.position)) < 1e-7);
    sampleRoot(1000,p,q);
    assert.ok(p.distanceTo(new THREE.Vector3().fromArray(data.attributes.position,99*3)) < 1e-7);
  }
  const skinMaterial = new THREE.MeshPhysicalMaterial();
  applyCapturedDualQuaternionSkinning(skinMaterial);
  const shader = {vertexShader:['skinning_pars_vertex','skinbase_vertex','skinnormal_vertex','skinning_vertex'].map((c)=>`#include <${c}>`).join('\n')};
  skinMaterial.onBeforeCompile(shader,null);
  for (const chunk of ['skinbase_vertex','skinnormal_vertex','skinning_vertex']) {
    assert.ok(!shader.vertexShader.includes(`#include <${chunk}>`));
  }
  assert.ok(shader.vertexShader.includes('getBoneMatrix(skinIndex.x)'), 'rig palette remains Three-owned, not a captured shared-material uniform');
  assert.ok(shader.vertexShader.includes('dqSign') && shader.vertexShader.includes('dqD -= dqR * dot(dqR,dqD)'));
  skinMaterial.dispose();
  console.log('PASS: two 100-frame root curves clamp/interpolate/reverse; DQ replaces position/normal/tangent skin chunks');

  const animation = load('astronaut_animations');
  const bones = Array.from({ length: 53 }, () => new THREE.Bone());
  const skeleton = new THREE.Skeleton(bones, bones.map(() => new THREE.Matrix4()));
  const sample = createCapturedPoseSampler(animation, bones, skeleton, new THREE.Vector3());
  sample(0, 0);
  for (const bone of bones) assert.ok(bone.matrix.elements.every((value, i) => Math.abs(value - new THREE.Matrix4().elements[i]) < 1e-8));
  const states = new Map();
  for (const frame of [0, 30.5, 89, 90, 114.5, 139, 140, 220, 287]) {
    sample(frame, 1);
    assert.ok([...skeleton.boneMatrices].every(Number.isFinite));
    for (const bone of bones) assert.ok(Math.abs(bone.quaternion.length() - 1) < 1e-6);
    states.set(frame, skeleton.boneMatrices.slice());
  }
  for (const [frame, expected] of [...states].reverse()) {
    sample(frame, 1);
    assert.deepEqual(skeleton.boneMatrices, expected, `reversible skeletal sample ${frame}`);
  }
  sample(1, 1);
  assert.ok(Math.abs(bones[0].position.x - animation.attributes.position[53 * 3]) < 1e-6, 'frame-major palette');
  assert.notDeepEqual(states.get(0), states.get(89), 'captured tumble must actually deform the model');
  for (const name of ['astronaut_helmet', 'astronaut_helmet_glass', 'astronaut_glove_shoes', 'astronaut_wearpack']) {
    const part = load(name);
    assert.ok([...part.attributes.boneIndices].every((i) => i < 53));
    const weights = part.attributes.boneWeights;
    for (let i = 0; i < weights.length; i += 2) assert.ok(Math.abs(weights[i] + weights[i + 1] - 1) < 0.001);
  }
  console.log('PASS: authentic 53-bone weights, frame-major interpolation, normalized quaternions, identity emergence and reversible poses');

  const glass = load('broken_glass');
  const debris = load('broken_glass_animation');
  const pieces = Math.max(...glass.attributes.piece) + 1;
  const frames = debris.header.vertexCount / pieces;
  assert.equal(pieces, 946); assert.equal(frames, 15);
  const pos = new Float32Array(32 * 30 * 4);
  const rot = new Float32Array(pos.length);
  const sampleGlass = createGlassFrameSampler(debris.attributes.position, debris.attributes.orient, pieces, frames, pos, rot);
  sampleGlass(1);
  for (let i = 0; i < pieces; i++) {
    assert.equal(pos[i * 4], debris.attributes.position[(pieces + i) * 3]);
  }
  sampleGlass(6.5);
  const expectedPosition = pos.slice(); const expectedRotation = rot.slice();
  for (let i = 0; i < pieces; i++) assert.ok(Math.abs(Math.hypot(...rot.slice(i * 4, i * 4 + 4)) - 1) < 1e-6);
  sampleGlass(14); sampleGlass(0); sampleGlass(6.5);
  assert.deepEqual(pos, expectedPosition); assert.deepEqual(rot, expectedRotation);
  console.log('PASS: 946-piece / 15-frame glass, correct frame-major indexing, unit rotations, forward/backward determinism');
  girder.dispose(); skeleton.dispose();
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
