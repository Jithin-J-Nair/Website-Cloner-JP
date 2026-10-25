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
const out = path.resolve(`temp/cinematic-validation/${width}-${reducedMotion}`);
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
    const queries = new Set();
    window.__goalTestGpuQueries = queries;
    if (typeof WebGL2RenderingContext !== 'undefined') {
      const proto = WebGL2RenderingContext.prototype;
      const create = proto.createQuery, destroy = proto.deleteQuery;
      proto.createQuery = function (...args) {
        const query = Reflect.apply(create, this, args);
        if (query) queries.add(query);
        return query;
      };
      proto.deleteQuery = function (query) {
        queries.delete(query);
        return Reflect.apply(destroy, this, [query]);
      };
    }
  });
  const page = await context.newPage();
  page.on('pageerror', (e) => report.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') report.errors.push(m.text()); });
  page.on('response', (r) => { if (r.url().includes('/assets/') && !r.ok()) report.failedAssets.push(`${r.status()} ${r.url()}`); });
  await page.goto(baseUrl + (process.env.GOAL_PROFILE_GPU === '1' ? '/?profileGoal=1' : ''), { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded, null, { timeout: 45000 });
  const layout = await page.evaluate(() => {
    const r = window.__lusionInspector.homeGoalSectionRanges.items;
    return { ranges: r, start: r.blackTunnel.pixelFrom, span: r.whiteTunnel.pixelTo - r.blackTunnel.pixelFrom,
      outTop: document.getElementById('home-goal-image-out').getBoundingClientRect().top + scrollY };
  });
  report.layout = layout;
  // Acceptance test uses native scrolling, never the inspector's deliberate scrub override.
  if (reducedMotion === 'no-preference') {
    const native = (y) => page.evaluate((top) => window.scrollTo({ top, behavior: 'instant' }), y);
    const play = () => page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'playing', null, { timeout: 15000 });
    const beforeTablet = await page.evaluate(() => window.__goalAstronautTelemetry.scrollForEmergence(0) - innerHeight * 0.3);
    const tabletMid = await page.evaluate(() => window.__goalAstronautTelemetry.scrollForEmergence(0.2));
    const activation = await page.evaluate(() => window.__goalAstronautTelemetry.playback.activation);
    await native(tabletMid);
    await page.waitForFunction(() => Math.abs(window.__goalAstronautTelemetry.emergenceProgress - 0.2) < 0.002);
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.state), 'armed');
    await page.evaluate(() => {
      window.__cinematicSamples = [];
      window.__cinematicTimer = setInterval(() => {
        const t = window.__goalAstronautTelemetry;
        window.__cinematicSamples.push({ time: performance.now(), native: scrollY, ...t.playback, ...t.sceneState, frameMs: t.lastFrameMs });
      }, 100);
    });
    const started = Date.now();
    await native(activation + 2);
    await play();
    // NO wheel, seek, click or other interaction until the entire cinematic finishes.
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'completed', null, { timeout: 240000, polling: 200 });
    const samples = await page.evaluate(() => { clearInterval(window.__cinematicTimer); return window.__cinematicSamples; });
    report.autonomous = { seconds: (Date.now() - started) / 1000, samples };
    const active = samples.filter((s) => s.state === 'playing');
    assert.ok(active.length > 30, 'visible intermediate frames, not a jump to the end');
    for (let i = 1; i < active.length; i++) assert.ok(active[i].progress >= active[i - 1].progress);
    assert.ok(active.every((s) => Math.abs(s.native - s.virtualScroll) < 1.1), 'native document follows only the cinematic playhead');
    const shaft = active.filter((s) => s.tunnelProgress > 0.15 && s.tunnelProgress < 0.65);
    const blue = active.filter((s) => s.tunnelProgress > 0.86 && s.tunnelProgress < 0.98 && s.shatterProgress === 0);
    const glass = active.filter((s) => s.shatterProgress > 0.4 && s.shatterProgress < 0.8);
    assert.ok(shaft.length > 5 && blue.length > 5 && glass.length > 3, 'all intermediate stages visibly play');
    assert.ok(shaft.every((s) => s.glazingLayers === (width < 820 ? 2 : 3) && !s.ringVisible));
    assert.ok(new Set(blue.map((s) => s.bakedFrame)).size > 5, 'captured blue-flight pose keeps advancing');
    assert.ok(blue.at(-1).corridorTravel > blue[0].corridorTravel + 5, 'architecture travels through depth independently of the subject');
    assert.ok(glass.some((s) => s.glassOpacity > 0.9));
    assert.ok(active.some((s) => s.crackProgress > 0.1 && s.crackProgress < 0.9));
    const end = await page.evaluate(() => ({
      ...window.__goalAstronautTelemetry.playback,
      y: scrollY, wait: window.__goalAstronautTelemetry.sceneState.waitProgress,
      ctaTop: document.getElementById('end-section-title-link').getBoundingClientRect().top,
      stopped: window.__lenis?.isStopped,
    }));
    assert.equal(end.progress, 1); assert.equal(end.runs, 1); assert.equal(end.stopped, false);
    assert.ok(Math.abs(end.y - end.end) < 1.1 && Math.abs(end.wait - 0.42) < 0.001);
    assert.ok(end.ctaTop > 0 && end.ctaTop < height, 'next-section CTA revealed at handoff');
    report.autonomous = { seconds: (Date.now() - started) / 1000, samples, end };
    console.log(`PASS autonomous ${width}: ${active.length} sampled frames; native/scene handoff at ${end.y}`);
    if (process.env.GOAL_CAPTURE !== '0') await page.screenshot({ path: path.join(out, 'autonomous-complete.png') });

    // Reverse is a scrub preview after completion, not another automatically triggered movie.
    await native(layout.start + layout.span * 0.4);
    await page.waitForFunction(() => Math.abs(window.__goalAstronautTelemetry.sceneState.tunnelProgress - 0.4) < 0.001);
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.runs), 1);
    await native(beforeTablet);
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'armed');
    // Large native input cannot start in the middle or skip the early phases.
    await native(layout.start + layout.span * 0.6);
    await play();
    assert.ok(await page.evaluate(() => window.__goalAstronautTelemetry.playback.progress < 0.05));
    await page.getByRole('button', { name: 'Pause cinematic' }).click();
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'paused');
    const paused = await page.evaluate(() => window.__goalAstronautTelemetry.playback.progress);
    const inputs = await page.evaluate(() => {
      document.activeElement?.blur();
      const touch = new Touch({ identifier: 1, target: document.body, clientX: innerWidth / 2, clientY: innerHeight / 2 });
      return [new WheelEvent('wheel', { deltaY: 20000, cancelable: true, bubbles: true }),
        new TouchEvent('touchmove', { cancelable: true, bubbles: true, touches: [touch], targetTouches: [touch], changedTouches: [touch] }),
        new KeyboardEvent('keydown', { key: 'PageDown', cancelable: true, bubbles: true })]
        .map((event) => { document.body.dispatchEvent(event); return event.defaultPrevented; });
    });
    assert.deepEqual(inputs, [true, true, true]);
    await page.mouse.wheel(0, 20000);
    await page.keyboard.press('PageDown');
    await page.waitForTimeout(600);
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.progress), paused);
    // Resizing while paused must not restart, seek or create a second writer.
    await page.setViewportSize({ width: width - 1, height });
    await page.waitForTimeout(250);
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.progress), paused);
    await page.setViewportSize({ width, height });
    await page.getByRole('button', { name: 'Resume cinematic' }).click();
    await page.waitForFunction((u) => window.__goalAstronautTelemetry.playback.progress > u + 0.01, paused);
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'paused');
    const menuPaused = await page.evaluate(() => window.__goalAstronautTelemetry.playback.progress);
    await page.waitForTimeout(350);
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.progress), menuPaused);
    await page.getByRole('button', { name: 'Close navigation menu' }).click();
    await play();
    await page.getByRole('button', { name: 'Skip cinematic' }).click();
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'completed');
    assert.equal(await page.evaluate(() => window.__lenis.isStopped), false);
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.runs), 2);
    report.playbackControls = { inputs, pauseStable: true, resizeStable: true, menuPause: true, replay: true, skip: true };

    // Live reduced-motion preference interrupts safely and leaves native scrolling usable.
    await native(beforeTablet);
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'armed');
    await native(activation + 2); await play();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'completed');
    assert.equal(await page.evaluate(() => Boolean(window.__lenis?.isStopped)), false);
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    report.liveReducedMotion = true;
    const contactRuns = await page.evaluate(() => window.__goalAstronautTelemetry.playback.runs);
    const contact = async () => {
      if (width >= 820) await page.locator('#header-right-talk-btn').click();
      else {
        await page.getByRole('button', { name: 'Open navigation menu' }).click();
        await page.locator('#header-menu-links [data-scroll-to]').click();
      }
      await page.waitForFunction(() => {
        const r = window.__lusionInspector.homeGoalSectionRanges.items.astronautWait;
        return Math.abs(scrollY - r.pixelFrom) < 4 && window.__goalAstronautTelemetry.playback.state === 'completed';
      }, null, { timeout: 30000 });
      assert.equal(await page.evaluate(() => window.__lenis.isStopped), false);
    };
    // Before activation, an explicit Contact jump may cross the threshold without starting the movie.
    await native(beforeTablet);
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'armed');
    await contact();
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.runs), contactRuns);
    // During playback the same button must cancel/release, not fight a native smooth jump.
    await native(beforeTablet);
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'armed');
    await native(activation + 2); await play();
    await contact();
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.runs), contactRuns + 1);
    report.contactNavigation = { beforeActivation: true, duringPlayback: true, nativeReleased: true };
    // Center the pointer and wait for the real preference handler, rather than coalescing two
    // media changes in one browser frame. Scrub reversal must not compare settling mouse parallax.
    await page.mouse.move(width / 2, height / 2);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.waitForFunction(() => {
      const matrix = window.__goalAstronautTelemetry.sceneState.cameraMatrix;
      return Math.abs(matrix[12]) < 1e-12 && Math.abs(matrix[13]) < 1e-12;
    });
    await page.emulateMedia({ reducedMotion: 'no-preference' });
  } else {
    // Reduced-motion entry stays intentional/user-controlled; no involuntary 26-second flight.
    await page.evaluate(() => window.scrollTo(0, window.__goalAstronautTelemetry.playback.activation + 10));
    await page.waitForTimeout(300);
    assert.equal(await page.evaluate(() => window.__goalAstronautTelemetry.playback.state), 'armed');
    report.reducedMotionNoAutoplay = true;
  }
  const at = (u) => layout.start + u * layout.span;
  const points = [
    { name: '09-entry', y: at(0.036) },
    { name: '10-early', y: at(0.72 * 0.26) },
    { name: '12-middle', y: at(0.39) },
    { name: '13-twist', y: at(0.72 * 0.72) },
    { name: '14-vortex', y: at(0.76) },
    { name: '15-blue', y: at(0.90) },
    { name: '16a-crack', y: layout.ranges.astronautDrop.pixelFrom + layout.ranges.astronautDrop.pixelCount * 0.22 },
    { name: '16-shatter', y: layout.ranges.astronautDrop.pixelFrom + layout.ranges.astronautDrop.pixelCount * 0.4 },
    { name: '16b-fragments', y: layout.ranges.astronautDrop.pixelFrom + layout.ranges.astronautDrop.pixelCount * 0.62 },
    { name: '16c-emergence', y: layout.ranges.astronautDrop.pixelFrom + layout.ranges.astronautDrop.pixelCount * 0.88 },
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
  if (reducedMotion === 'no-preference') {
    await page.evaluate(() => window.scrollTo(0, window.__goalAstronautTelemetry.scrollForEmergence(0) - innerHeight * 0.3));
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'armed');
    await page.evaluate(() => window.scrollTo(0, window.__goalAstronautTelemetry.playback.activation + 2));
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'playing');
  }
  report.gpuQueriesBeforeCleanup = await page.evaluate(() => window.__goalTestGpuQueries.size);
  if (await page.evaluate(() => window.__goalAstronautTelemetry.gpuTiming.enabled)) {
    assert.equal(report.gpuQueriesBeforeCleanup,3,'profiling allocates exactly the bounded three-query ring');
  }
  await page.evaluate(() => { window.__goalBeforeListeners = [...window.__goalTestListeners]; });
  await page.evaluate(() => document.querySelector('a[href="/projects"]').click());
  await page.waitForURL('**/projects', { timeout: 30000 });
  await page.waitForFunction(() => !window.__goalAstronautTelemetry);
  const cleanup = await page.evaluate(() => ({
    activeGpuQueries: window.__goalTestGpuQueries.size,
    retained: window.__goalBeforeListeners.filter((fn) => window.__goalTestListeners.has(fn) && fn.name === 'onVisibility').length,
    goalCanvas: document.querySelector('#home-goal canvas') !== null,
    staleGoalRanges: Boolean(window.__lusionInspector?.homeGoalSectionRanges),
  }));
  assert.equal(await page.evaluate(() => Boolean(window.__lenis?.isStopped)), false);
  assert.equal(cleanup.retained, 0); assert.equal(cleanup.goalCanvas, false); assert.equal(cleanup.staleGoalRanges, false);
  assert.equal(cleanup.activeGpuQueries,0,"client navigation must dispose every instrumented WebGL query");
  assert.deepEqual(report.errors,[]);
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
  console.log(`PASS ${width}x${height}, ${reducedMotion}: autonomous/policy checks, ${points.length} states, reverse, 4 handoffs, WebGL/assets, cleanup and failure isolation`);
} finally {
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await browser.close();
}
