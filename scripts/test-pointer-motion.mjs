#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
fs.mkdirSync('temp', { recursive: true });
const dir = fs.mkdtempSync(path.resolve('temp/pointer-unit-'));
try {
  const file = `${dir}/pointer.mjs`;
  fs.writeFileSync(file, ts.transpileModule(fs.readFileSync('src/lib/pointer-motion.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText);
  const { cursorDamping } = await import(pathToFileURL(file));
  assert.ok(Math.abs(cursorDamping(1 / 60) - 0.2) < 1e-12, 'preserve the existing 60 Hz feel');
  const positions = [];
  for (const hz of [30, 60, 120, 144, 240]) {
    let x = 0;
    for (let frame = 0; frame < hz; frame++) x += (100 - x) * cursorDamping(1 / hz);
    positions.push(x);
  }
  for (const x of positions) assert.ok(Math.abs(x - positions[0]) < 1e-10, 'same elapsed time, same response');
  for (const dt of [1 / 240, 1 / 60, 0.2, 1, 60]) assert.ok(cursorDamping(dt) > 0 && cursorDamping(dt) <= 1, 'bounded, no overshoot after stalls');
  for (const dt of [0, -1, NaN, Infinity]) assert.equal(cursorDamping(dt), 0);
  console.log('PASS cursor damping at 30/60/120/144/240 Hz, preserved 60 Hz response, invalid delta and visible stall guards.');
} finally { fs.rmSync(dir, { recursive: true, force: true }); }
