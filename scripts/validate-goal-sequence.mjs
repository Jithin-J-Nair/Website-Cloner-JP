#!/usr/bin/env node
/** Focused WebGL regression capture. Outputs are ignored under temp/, not reference truth. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';

const require = createRequire(import.meta.url);
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const width = Number(process.env.GOAL_VIEWPORT_WIDTH || 1440);
const height = width < 820 ? 844 : 900;
const reducedMotion = process.env.GOAL_MOTION === 'normal' ? 'no-preference' : 'reduce';
const out = path.resolve(`temp/goal-validation/${width}-${reducedMotion}`);
fs.mkdirSync(out, { recursive: true });

// Same bundled Chromium/SwiftShader support as capture-astronaut-emergence.mjs.
const libDir = path.join(os.tmpdir(), 'goal-chromium-libs');
fs.mkdirSync(libDir, { recursive: true });
const binDir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..', 'bin');
for (const archive of ['al2023', 'swiftshader']) {
  const marker = path.join(libDir, `.${archive}`);
  if (!fs.existsSync(marker)) {
    const tar = path.join(libDir, `${archive}.tar`);
    fs.writeFileSync(tar, zlib.brotliDecompressSync(fs.readFileSync(path.join(binDir, `${archive}.tar.br`))));
    execFileSync('tar', ['xf', tar, '-C', libDir]);
    fs.unlinkSync(tar); fs.writeFileSync(marker, 'ok');
  }
}
process.env.LD_LIBRARY_PATH = [libDir, path.join(libDir, 'lib'), process.env.LD_LIBRARY_PATH].filter(Boolean).join(':');
const executablePath = await sparticuz.executablePath();
const launchBrowser = () => chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || executablePath,
  headless: true,
  args: [...sparticuz.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const browser = await launchBrowser();
const report = { viewport: { width, height }, reducedMotion, states: [], continuity: [], errors: [], failedAssets: [] };
try {
  const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
  await context.addInitScript(() => {
    sessionStorage.setItem('lusion_booted_v1', '1');
    // Track actual callback identities to verify teardown, without changing their behavior.
    const callbacks = new Set();
    const add = document.addEventListener.bind(document);
    const remove = document.removeEventListener.bind(document);
    document.addEventListener = (name, fn, options) => {
      if (name === 'visibilitychange') callbacks.add(fn);
      return add(name, fn, options);
    };
    document.removeEventListener = (name, fn, options) => {
      if (name === 'visibilitychange') callbacks.delete(fn);
      return remove(name, fn, options);
    };
    window.__goalTestListeners = callbacks;
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('response', (r) => { if (r.url().includes('/assets/') && !r.ok()) report.failedAssets.push(`${r.status()} ${r.url()}`); });
  await page.goto(baseUrl, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded, null, { timeout: 45000 });
  const layout = await page.evaluate(() => {
    const r = window.__lusionInspector.homeGoalSectionRanges.items;
    return { ranges: r, start: r.blackTunnel.pixelFrom, span: r.whiteTunnel.pixelTo - r.blackTunnel.pixelFrom,
      outTop: document.getElementById('home-goal-image-out').getBoundingClientRect().top + scrollY };
  });
  report.layout = layout;
  const at = (u) => layout.start + u * layout.span;
  const points = [
    { name: '09-entry', y: at(0.036) },
    { name: '10-early', y: at(0.72 * 0.26) },
    { name: '12-middle', y: at(0.39) },
    { name: '13-twist', y: at(0.72 * 0.72) },
    { name: '14-vortex', y: at(0.76) },
    { name: '15-blue', y: at(0.90) },
    { name: '16-shatter', y: layout.ranges.astronautDrop.pixelFrom + layout.ranges.astronautDrop.pixelCount * 0.4 },
    { name: '17-wait', y: layout.ranges.astronautWait.pixelFrom + 0.08 * layout.ranges.astronautWait.pixelCount },
  ];
  const go = async (y) => {
    await page.evaluate((target) => window.__lusionInspector.scrollManager.scrollToPixel(target, true), Math.round(y));
    await page.waitForTimeout(reducedMotion === 'reduce' ? 60 : 220);
    return page.evaluate(() => JSON.parse(JSON.stringify(window.__goalAstronautTelemetry)));
  };
  const pixelHash = async () => page.evaluate(() => {
    const canvas = document.querySelector('#home-goal canvas');
    // readPixels immediately after a deterministic render, not after preserveDrawingBuffer was cleared.
    window.__lusionInspector.scrollManager.scrollToPixel(window.scrollY, true);
    const gl = canvas.getContext('webgl2');
    const bytes = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
    gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
    let hash = 2166136261;
    for (const byte of bytes) hash = Math.imul(hash ^ byte, 16777619);
    return { hash: hash >>> 0, webglError: gl.getError() };
  });
  // Canvas is in the section's fixed overlay; target it there, not the hero canvas.
  await page.locator('#home-goal canvas').waitFor({ state: 'attached' });
  const forward = new Map();
  for (const point of points) {
    const telemetry = await go(point.y);
    assert.ok(telemetry.glbLoaded && !telemetry.fallbackVisible);
    assert.ok(telemetry.sceneState.astronautMatrix.every(Number.isFinite));
    const pixels = reducedMotion === 'reduce' ? await pixelHash() : {
      hash: null,
      webglError: await page.evaluate(() => document.querySelector('#home-goal canvas').getContext('webgl2').getError()),
    };
    assert.equal(pixels.webglError, 0);
    assert.ok(telemetry.sceneState.trussLoaded && telemetry.sceneState.shardsLoaded);
    forward.set(point.name, { state: telemetry.sceneState, hash: pixels.hash });
    report.states.push({ ...point, telemetry, pixels });
    if (process.env.GOAL_CAPTURE !== '0') await page.screenshot({ path: path.join(out, `${point.name}.png`), timeout: 60000 });
  }
  for (const point of [...points].reverse()) {
    const telemetry = await go(point.y);
    const pixels = reducedMotion === 'reduce' ? await pixelHash() : {
      hash: null,
      webglError: await page.evaluate(() => document.querySelector('#home-goal canvas').getContext('webgl2').getError()),
    };
    const expected = forward.get(point.name);
    if (reducedMotion !== 'reduce' && point.name === '17-wait') {
      // The existing CTA idle is deliberately time-based, unlike the scroll-driven fall.
      const { astronautMatrix: actualIdle, ...actual } = telemetry.sceneState;
      const { astronautMatrix: expectedIdle, ...stable } = expected.state;
      assert.ok(actualIdle.every(Number.isFinite) && expectedIdle.every(Number.isFinite));
      assert.deepEqual(actual, stable);
    } else assert.deepEqual(telemetry.sceneState, expected.state, `reversible state: ${point.name}`);
    if (reducedMotion === 'reduce') assert.equal(pixels.hash, expected.hash, `reversible GPU pixels: ${point.name}`);
  }
  report.reversible = true;
  // Probe both sides of every formerly discontinuous branch in CSS-pixel scroll units.
  const outFactor = width < 1200 ? 2.55 : 1.42;
  const outEndFactor = width < 1200 ? 1.15 : 0.45;
  const outStart = layout.outTop - height * outFactor;
  const outSpan = height * (outFactor - outEndFactor);
  // Smoothstep(.01837) ~= .001, the astronaut's pullback branch boundary.
  const boundaries = [layout.start + 1, at(0.81), outStart + outSpan * 0.01837, layout.ranges.astronautWait.pixelFrom];
  for (const y of boundaries) {
    const a = (await go(y - 1)).sceneState;
    const b = (await go(y + 1)).sceneState;
    const delta = Math.max(...a.astronautMatrix.map((v, i) => Math.abs(v - b.astronautMatrix[i])));
    const cameraDelta = Math.max(...a.cameraMatrix.map((v, i) => Math.abs(v - b.cameraMatrix[i])));
    assert.ok(delta < 0.03, `astronaut continuity at ${y}: ${delta}`);
    assert.ok(cameraDelta < 0.01, `camera continuity at ${y}: ${cameraDelta}`);
    report.continuity.push({ y, delta, cameraDelta });
  }
  const flash = (await go(at(0.85))).sceneState;
  assert.ok(flash.portalFlash > 0.2 && flash.flashVisible, 'portal flash must finish after the shaft fades');
  report.flashContinuity = true;
  // Exercise native, coalesced fast scrolling too, not only the inspector's immediate sampler.
  const nativeTarget = Math.round(points[2].y);
  await page.evaluate((targets) => {
    for (const top of targets) window.scrollTo({ top, behavior: 'instant' });
  }, [points[5].y, points[0].y, points[3].y, nativeTarget]);
  await page.waitForFunction((expected) => Math.abs(window.__goalAstronautTelemetry.sceneState.tunnelProgress - expected) < 0.0001,
    (nativeTarget - layout.start) / layout.span, { timeout: 15000 });
  report.nativeFastScroll = true;
  assert.deepEqual(report.failedAssets, []);
  assert.deepEqual(report.errors, []);
  // SPA unmount: goal's visibility listener and canvas must leave with the component.
  await page.evaluate(() => { window.__goalBeforeListeners = [...window.__goalTestListeners]; });
  await page.evaluate(() => document.querySelector('a[href="/projects"]').click());
  await page.waitForURL('**/projects', { timeout: 30000 });
  await page.waitForFunction(() => !window.__goalAstronautTelemetry);
  const cleanup = await page.evaluate(() => ({
    retained: window.__goalBeforeListeners.filter((fn) => window.__goalTestListeners.has(fn) && fn.name === 'onVisibility').length,
    goalCanvas: document.querySelector('#home-goal canvas') !== null,
    staleGoalRanges: Boolean(window.__lusionInspector?.homeGoalSectionRanges),
  }));
  assert.equal(cleanup.retained, 0); assert.equal(cleanup.goalCanvas, false); assert.equal(cleanup.staleGoalRanges, false);
  report.cleanup = cleanup;
  await context.close();
  await browser.close();
  // Failure paths run in fresh contexts so the loader cache cannot mask missing assets.
  for (const failure of ['astronaut', 'glass', 'webgl']) {
    const failureBrowser = await launchBrowser();
    const ctx = await failureBrowser.newContext({ viewport: { width, height }, reducedMotion: 'reduce' });
    await ctx.addInitScript(() => sessionStorage.setItem('lusion_booted_v1', '1'));
    if (failure === 'webgl') await ctx.addInitScript(() => {
      const getContext = HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') return null;
        return getContext.call(this, type, ...args);
      };
    });
    if (failure === 'glass') await ctx.route('**/broken_glass*.buf', (route) => route.fulfill({ status: 404, body: 'intentional regression test' }));
    const p = await ctx.newPage();
    await p.goto(`${baseUrl}${failure === 'astronaut' ? '/?simulateGlbError=1' : '/'}`, { waitUntil: 'networkidle', timeout: 120000 });
    if (failure === 'webgl') {
      await p.waitForFunction(() => document.querySelector('[data-testid="goal-astronaut-fallback"]')?.style.display === 'flex');
      report.webglFailure = { fallback: true };
      await ctx.close(); await failureBrowser.close();
      continue;
    }
    await p.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded || window.__goalAstronautTelemetry?.fallbackVisible);
    const tel = await p.evaluate(() => JSON.parse(JSON.stringify(window.__goalAstronautTelemetry)));
    if (failure === 'astronaut') assert.ok(tel.fallbackVisible && tel.glbError);
    else assert.ok(tel.glbLoaded && !tel.fallbackVisible && !tel.sceneState.shardsLoaded);
    report[`${failure}Failure`] = { loaded: tel.glbLoaded, fallback: tel.fallbackVisible };
    await ctx.close();
    await failureBrowser.close();
  }
  console.log(`PASS ${width}x${height}, ${reducedMotion}: 8 states, reverse, 4 handoffs, WebGL/assets, cleanup and failure isolation`);
} finally {
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
