#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import * as THREE from 'three';
import ts from 'typescript';

fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/about-explorer-unit-'));
try {
  const source = fs.readFileSync('src/components/three/AboutExplorer.ts', 'utf8');
  fs.writeFileSync(`${dir}/explorer.mjs`, ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  }).outputText);
  const { createAboutExplorer } = await import(pathToFileURL(`${dir}/explorer.mjs`));
  const a = createAboutExplorer(), b = createAboutExplorer();
  const meshes = [];
  a.group.traverse(o => { if (o.isMesh) meshes.push(o); });
  assert.equal(meshes.length, 8, 'seven material-batched suit/helmet draws plus one contact shadow');
  const geometries = new Set(), materials = new Set();
  let triangles = 0;
  for (const mesh of meshes) {
    geometries.add(mesh.geometry); materials.add(mesh.material);
    const position = mesh.geometry.getAttribute('position');
    assert.ok(position.array.every(Number.isFinite));
    assert.ok(mesh.geometry.getAttribute('normal').array.every(Number.isFinite));
    triangles += (mesh.geometry.index?.count ?? position.count) / 3;
    for (const value of Object.values(mesh.material)) assert.ok(!value?.isTexture, 'no captured texture dependency');
  }
  assert.ok(triangles < 16000, 'bounded geometry budget');
  assert.equal(materials.size, 5, 'four shared suit materials and one shadow shader');
  const snapshot = obj => { obj.updateMatrixWorld(true); const result = []; obj.traverse(o => result.push(...o.matrixWorld.elements)); return result; };
  a.pose(7.2, .4, -.7, false); b.pose(7.2, .4, -.7, false);
  assert.deepEqual(snapshot(a.group), snapshot(b.group), 'deterministic independent instances');
  const initial = snapshot(a.group);
  a.pose(2, -1, 1, false); a.pose(7.2, .4, -.7, false);
  assert.deepEqual(snapshot(a.group), initial, 'absolute-time pose must survive reverse and reentry');
  a.pose(30, 1, 1, true); const reduced = snapshot(a.group);
  a.pose(200, -1, -1, true); assert.deepEqual(snapshot(a.group), reduced, 'reduced pose has no autonomous or pointer motion');
  a.pose(NaN, Infinity, NaN, false); assert.ok(snapshot(a.group).every(Number.isFinite));
  const bounds = new THREE.Box3().setFromObject(a.group);
  assert.ok(bounds.min.y >= -.001 && bounds.max.y < 1.9, 'feet planted at local zero and human-scale proportions');
  const suitBounds = new THREE.Box3().setFromObject(a.group.getObjectByName('explorer-suit'));
  assert.ok(suitBounds.max.x - suitBounds.min.x < 1.2, 'suit silhouette, excluding the wider contact-shadow plane');
  assert.equal(a.group.getObjectByName('explorer-helmet').position.y, 1.545);
  let disposals = 0;
  for (const resource of [...geometries, ...materials]) resource.addEventListener('dispose', () => disposals++);
  a.dispose(); assert.equal(disposals, geometries.size + materials.size);
  a.dispose(); assert.equal(disposals, geometries.size + materials.size, 'idempotent disposal');
  assert.equal(a.group.children.length, 0); b.dispose();
  assert.ok(!source.includes('requestAnimationFrame') && !source.includes('fetch('), 'world owns time and assets');
  console.log(`PASS original explorer: ${triangles} triangles, 8 draws, 5 materials, finite geometry, planted bounds, deterministic reverse/reentry, fixed reduced pose, invalid-input guards, zero textures/network/RAF, idempotent cleanup.`);
} finally {
  fs.rmSync(dir, { recursive: true, force: true });
}
