#!/usr/bin/env node
/** Observe cold/replay frames and GL blocking; never drive a second scene clock. */
import fs from 'node:fs';
import { launchMotionBrowser, startBrowserRecording } from './lib/browser-runtime.mjs';

const out = process.env.DIAGNOSTIC_OUT || 'temp/followup/startup';
fs.mkdirSync(out, { recursive: true });
const browser = await launchMotionBrowser();
try {
  const context = await browser.newContext({ viewport: { width: Number(process.env.GOAL_VIEWPORT_WIDTH || 1440), height: 900 } });
  await context.addInitScript(() => {
    sessionStorage.setItem('lusion_booted_v1', '1');
    window.__glSlowCalls = [];
    window.__observedFrames = [];
    window.__diagnosticLongTasks = [];
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.__diagnosticLongTasks.push({ time: entry.startTime, duration: entry.duration });
      }).observe({ type: 'longtask', buffered: true });
    } catch { /* Optional browser timing support; no application behavior changes. */ }
    for (const key of ['compileShader', 'linkProgram', 'getProgramParameter', 'getShaderParameter', 'getUniformLocation', 'bufferData', 'bufferSubData', 'texImage2D', 'texSubImage2D', 'drawElements', 'drawElementsInstanced', 'drawArrays', 'drawArraysInstanced', 'clear', 'finish', 'flush', 'readPixels']) {
      const original = WebGL2RenderingContext.prototype[key];
      if (typeof original !== 'function') continue;
      WebGL2RenderingContext.prototype[key] = function (...args) {
        const start = performance.now();
        const value = Reflect.apply(original, this, args);
        const ms = performance.now() - start;
        if (ms > 20 && this.canvas.closest('#home-goal')) window.__glSlowCalls.push({ key, ms, time: performance.now(), progress: window.__goalAstronautTelemetry?.playback.progress });
        return value;
      };
    }
    let last = -1;
    setInterval(() => {
      const t = window.__goalAstronautTelemetry;
      if (t && t.renderCount !== last) {
        last = t.renderCount;
        window.__observedFrames.push({ time: performance.now(), count: last, cpu: t.lastFrameMs, programs: t.resources.programs, gpu: { ...t.gpuTiming, recent: t.gpuTiming.recent?.map(v => ({ ...v })) }, ...t.playback, ...t.sceneState });
      }
    }, 25);
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:3000', { waitUntil: 'networkidle' });
  await page.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded, null, { timeout: 120000 });
  const runs = [];
  for (let i = 0; i < 2; i++) {
    await page.evaluate(() => {
      window.__glSlowCalls = []; window.__observedFrames = []; window.__diagnosticLongTasks = [];
      window.scrollTo(0, window.__goalAstronautTelemetry.scrollForEmergence(0) - innerHeight * .3);
    });
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'armed');
    const recording = process.env.DIAGNOSTIC_RECORD === '1' && i === 1 ? await startBrowserRecording(context, page, out) : null;
    if (recording) await recording.waitForFirstFrame();
    await page.evaluate(() => window.scrollTo(0, window.__goalAstronautTelemetry.playback.activation + 2));
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state === 'completed', null, { timeout: 120000 });
    const completedAt = await page.evaluate(() => performance.now());
    // Capture a requested tail without input: CPU completion is not proof the compositor presented it.
    if (recording) await page.waitForTimeout(Number(process.env.DIAGNOSTIC_TAIL_MS || 20000));
    if (recording) await recording.stop();
    runs.push(await page.evaluate(completedAt => ({ completedAt, frames: window.__observedFrames, slowCalls: window.__glSlowCalls, longTasks: window.__diagnosticLongTasks }), completedAt));
  }
  fs.writeFileSync(out + '/report.json', JSON.stringify(runs, null, 2));
  fs.writeFileSync(out + '/errors.json', JSON.stringify(errors));
  for (const [i, r] of runs.entries()) console.log(JSON.stringify({ run: i, frames: r.frames.length, glass: r.frames.filter(x => x.shatterProgress > .4 && x.shatterProgress < .8).length, slowCalls: r.slowCalls, maxLongTask: Math.max(0, ...r.longTasks.map(x => x.duration)) }));
} finally { await browser.close(); }
