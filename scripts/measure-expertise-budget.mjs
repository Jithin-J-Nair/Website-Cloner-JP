#!/usr/bin/env node
/** Isolated software browser cadence, not physical GPU execution or displayed FPS. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const browser = await launchMotionBrowser(), reports = [];
try {
  for (const width of [1440, 768, 390]) {
    const height = width === 390 ? 844 : 900, context = await browser.newContext({ viewport: { width, height } });
    try {
      await context.addInitScript(() => { sessionStorage.setItem('lusion_booted_v1', '1'); window.__enableExpertiseProbe = true; window.__enableCtaProbe = true; });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:3000/about', { waitUntil: 'networkidle', timeout: 120000 });
      await page.locator('#about-capability').evaluate(e => { const top = e.getBoundingClientRect().top + scrollY; window.__lenis?.scrollTo(top, { immediate: true }); window.scrollTo(0, top); });
      await page.waitForTimeout(900);
      const sample = await page.evaluate(() => new Promise(resolve => {
        const before = window.__expertiseProbe().frames, start = performance.now(), times = [];
        let raf = 0, previous = 0;
        const observe = t => { if (previous) times.push(t - previous); previous = t; raf = requestAnimationFrame(observe); };
        raf = requestAnimationFrame(observe);
        setTimeout(() => {
          cancelAnimationFrame(raf); times.sort((a, b) => a - b);
          const probe = window.__expertiseProbe(), elapsed = performance.now() - start;
          const gl = document.querySelector('#about-expertise-canvas').getContext('webgl2');
          const debug = gl.getExtension('WEBGL_debug_renderer_info');
          resolve({ renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unknown', width: innerWidth, height: innerHeight, submittedFrames: probe.frames - before, wallMs: elapsed, submissionsPerSecond: (probe.frames - before) * 1000 / elapsed, medianRafMs: times[Math.floor(times.length * .5)], p95RafMs: times[Math.floor(times.length * .95)], draws: probe.draws, vertices: probe.vertices, ctaPending: window.__ctaProbe?.().pending, glError: gl.getError(), physicalGpuTime: 'NOT MEASURED' });
        }, 5000);
      }));
      assert.ok(sample.submittedFrames > 0 && sample.draws > 0 && sample.draws <= 4);
      assert.equal(sample.ctaPending, false, 'CTA must be asleep during this isolated field sample');
      assert.equal(sample.glError, 0); reports.push(sample);
    } finally { await context.close(); }
  }
  fs.writeFileSync('temp/structures/expertise-budget.json', JSON.stringify(reports, null, 2));
  console.log('PASS isolated expertise resource/GL checks; raw software submission/RAF cadence recorded without a hardware smoothness claim.');
} finally { await browser.close(); }
