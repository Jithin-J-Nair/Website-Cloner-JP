#!/usr/bin/env node
/** Profile demanding cinematic phases at native scroll coordinates without adding a render writer. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';
import { summarizeGpuQueries } from './lib/summarize-gpu-queries.mjs';

const require = createRequire(import.meta.url);
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const width = Number(process.env.GOAL_VIEWPORT_WIDTH || 1440);
const height = Number(process.env.GOAL_HEIGHT || (width < 820 ? 844 : 900));

const out = path.resolve(`temp/cinematic-profile/${process.env.PROFILE_TAG || 'current'}-${width}`);
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

const context = await browser.newContext({ viewport: { width, height }, reducedMotion: 'no-preference' });
await context.addInitScript(() => sessionStorage.setItem('lusion_booted_v1', '1'));
const page = await context.newPage();
const report = { viewport: { width, height }, method: 'Observer RAF intervals during native phase sweep, NOT presented FPS. Submission counts/observations are separate; CPU submission telemetry is not GPU execution. Optional asynchronous phase-tagged GPU queries are not frame-paired; unavailable reported as null', errors: [], failedAssets: [], phases: [] };
page.on('pageerror', e => report.errors.push(e.message));
page.on('response', r => { if(r.url().includes('/assets/') && !r.ok()) report.failedAssets.push(r.url()); });
try {
  if(process.env.PROFILE_REFERENCE === '1') {
    try { await page.goto('https://lusion.co/', {waitUntil:'networkidle',timeout:45000}); await page.screenshot({path:out+'/reference.png'}); report.reference='loaded'; }
    catch(e) { report.reference=String(e); }
  } else {
    await page.goto(baseUrl + (process.env.PROFILE_GPU === "1" ? "/?profileGoal=1" : ""), {waitUntil:'networkidle',timeout:120000});
    await page.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded, null, {timeout:60000});
    report.device = await page.evaluate(() => {
      const gl = document.querySelector('#home-goal canvas').getContext('webgl2');
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      return { userAgent:navigator.userAgent, cores:navigator.hardwareConcurrency, dpr:devicePixelRatio,
        renderer:ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER),
        gpuTimerAvailable:!!gl.getExtension('EXT_disjoint_timer_query_webgl2') };
    });
    const layout = await page.evaluate(() => {
      const r = window.__lusionInspector.homeGoalSectionRanges.items;
      return {ranges:r,start:r.blackTunnel.pixelFrom,span:r.whiteTunnel.pixelTo-r.blackTunnel.pixelFrom,solar:window.__goalAstronautTelemetry.scrollForEmergence(.80)};
    });
    const phases = [
      {name:'solar',start:layout.solar,end:layout.solar+30},
      {name:'tesseract',start:layout.start+.34*layout.span,end:layout.start+.42*layout.span},
      {name:'blue',start:layout.start+.89*layout.span,end:layout.start+.98*layout.span},
      {name:'glass',start:layout.ranges.astronautDrop.pixelFrom+.05*layout.ranges.astronautDrop.pixelCount,end:layout.ranges.astronautDrop.pixelFrom+.20*layout.ranges.astronautDrop.pixelCount},
      {name:'shatter',start:layout.ranges.astronautDrop.pixelFrom+.30*layout.ranges.astronautDrop.pixelCount,end:layout.ranges.astronautDrop.pixelFrom+.65*layout.ranges.astronautDrop.pixelCount},
    ];
    for(const phase of phases) {
      await page.evaluate(y => window.__lusionInspector.scrollManager.scrollToPixel(y,true),phase.start);
      await page.waitForTimeout(1200);
      const measured = await page.evaluate(async phase => {
        const samples = [], gpuSamples = [], duration = Number(phase.duration);
        const initialRenderCount = window.__goalAstronautTelemetry.renderCount;
        let lastGpuCount = window.__goalAstronautTelemetry.gpuTiming?.samples ?? 0;
        await new Promise(resolve => {
          let start = 0, previous = 0;
          const tick = now => {
            if(!start) start=previous=now;
            else { samples.push({ interval:now-previous, cpu:window.__goalAstronautTelemetry.lastFrameMs, calls:window.__goalAstronautTelemetry.drawCalls, renderCount:window.__goalAstronautTelemetry.renderCount, observedAt:now, triangles:window.__goalAstronautTelemetry.triangles }); previous=now; }
            const timing = window.__goalAstronautTelemetry.gpuTiming;
            if (timing && timing.samples > lastGpuCount) {
              for (const entry of timing.recent ?? []) {
                if (entry.id > lastGpuCount && entry.phase === phase.name) gpuSamples.push(entry.ms);
              }
              lastGpuCount = timing.samples;
            }
            const progress=Math.min(1,(now-start)/duration);
            const y=phase.start+(phase.end-phase.start)*progress;
            window.__lenis?.scrollTo(y,{immediate:true});
            window.scrollTo({top:y,behavior:"instant"});
            if(progress<1) requestAnimationFrame(tick); else resolve();
          };
          requestAnimationFrame(tick);
        });
        const stats = values => { const sorted=[...values].sort((a,b)=>a-b);return {mean:values.reduce((a,b)=>a+b,0)/values.length,p50:sorted[Math.floor(sorted.length*.5)],p95:sorted[Math.min(sorted.length-1,Math.floor(sorted.length*.95))]}; };
        const intervals=stats(samples.map(s=>s.interval));
        const telemetry=JSON.parse(JSON.stringify(window.__goalAstronautTelemetry));
        const changedSamples = samples.filter((s, i) => i === 0 || s.renderCount !== samples[i - 1].renderCount);
        const submissionIntervals = changedSamples.slice(1).map((s, i) => s.observedAt - changedSamples[i].observedAt);
        const observedDurationMs = samples.reduce((n, s) => n + s.interval, 0);
        const submissions = telemetry.renderCount - initialRenderCount;
        const gl = document.querySelector("#home-goal canvas").getContext("webgl2");
        return { webglError:gl.getError(), gpuExecutionMs:gpuSamples.length ? {samples:gpuSamples.length,...stats(gpuSamples)} : null, frames:samples.length, observerRafSamples:samples.length, observedDurationMs, intervalsMs:intervals, observedFps:1000/intervals.mean, observerRafFps:1000/intervals.mean, submittedFramesDelta:submissions, submissionRatePerSecond:1000*submissions/observedDurationMs, repeatedTelemetrySamples:samples.length-changedSamples.length, submissionObservationIntervalsMs:submissionIntervals.length ? stats(submissionIntervals) : null, cpuSubmissionMs:stats(samples.map(s=>s.cpu)), maxCalls:Math.max(...samples.map(s=>s.calls)), maxTriangles:Math.max(...samples.map(s=>s.triangles)), telemetry };
      }, {...phase,duration:process.env.PROFILE_DURATION || 5000});
      assert.equal(measured.webglError,0,"profile must not produce WebGL query/render errors");
      report.phases.push({name:phase.name,...measured});
      await page.waitForTimeout(500);
      await page.screenshot({path:out+'/'+phase.name+'.png',timeout:120000});
      console.log(phase.name, measured.observedFps.toFixed(2)+' fps', 'CPU p95 '+measured.cpuSubmissionMs.p95+'ms', measured.maxCalls+' calls');
    }
    report.deferredGpuMethod = 'Deduplicated phase-tagged results across phase-end snapshots, including late completions; not RAF-frame-paired or strictly in-window';
    report.deferredGpuExecution = summarizeGpuQueries(report.phases);
    const cdp = await context.newCDPSession(page);
    await cdp.send('Performance.enable');
    report.browserMetrics=(await cdp.send('Performance.getMetrics')).metrics;
    assert.deepEqual(report.errors,[]); assert.deepEqual(report.failedAssets,[]);
  }
} finally {
  fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));
  await browser.close();
}
