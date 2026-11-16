#!/usr/bin/env node
/** Validate saved clone smoke evidence; never a source-parity gate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export function checkRouteMatrix(report, routes) {
  assert.equal(report.finished, true, 'census completed');
  const expected = new Set(report.viewports.flatMap(([width, height]) => routes.map(route => `${route}|${width}x${height}`)));
  assert.equal(report.states.length, expected.size, 'one state for every route/viewport');
  const seen = new Set();
  for (const state of report.states) {
    const key = `${state.route}|${state.viewport.width}x${state.viewport.height}`;
    assert.ok(expected.has(key) && !seen.has(key), `unique expected state: ${key}`);
    seen.add(key);
    assert.equal(state.error, undefined, `no navigation/capture exception: ${key}`);
    assert.equal(state.status, 200, `HTTP 200: ${key}`);
    assert.equal(state.titleMatches, true, `captured title: ${key}`);
    assert.ok(state.screenshot, `screenshot recorded: ${key}`);
    assert.ok(state.dom.h1.some(text => text.length > 0), `nonempty H1: ${key}`);
    assert.equal(state.dom.overflow, false, `no horizontal document overflow: ${key}`);
    for (const field of ['errors', 'badResponses', 'failedRequests']) {
      assert.deepEqual(state[field], [], `no ${field} observed in sampled initial state: ${key}`);
    }
  }
  for (const link of report.links) assert.equal(link.status, 200, `observed internal link: ${link.path}`);
  return `PASS ${seen.size} clone-only initial-state smoke records; no source parity asserted.`;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const report = JSON.parse(fs.readFileSync('docs/lusion-parity-audit/evidence/clone-initial/matrix.json', 'utf8'));
  const manifest = JSON.parse(fs.readFileSync('src/data/reference/lusion-ground-truth.json', 'utf8'));
  console.log(checkRouteMatrix(report, manifest.routes.map(entry => entry.route)));
}
