#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const out = 'temp/master/after'; fs.mkdirSync(out, { recursive: true });
const browser = await launchMotionBrowser();
try {
  for (const width of [1440, 768, 390]) {
    const height = width === 390 ? 844 : 900;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width === 390, hasTouch: width === 390 });
    await context.addInitScript(() => { sessionStorage.setItem('lusion_booted_v1', '1'); window.__enableAboutProbe = true; window.__enableCtaProbe = true; });
    const page = await context.newPage(), report = { width, height, errors: [], shots: [], checks: [] };
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    const seek = async y => {
      await page.evaluate(y => { window.__lenis?.scrollTo(y, { immediate: true }); window.scrollTo({ top: y, behavior: 'instant' }); }, y);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.waitForTimeout(450);
    };
    const topOf = id => page.locator('#' + id).evaluate(e => e.getBoundingClientRect().top + scrollY);
    const shot = async name => { const file = `${width}-${name}.jpg`; await page.screenshot({ path: `${out}/${file}`, type: 'jpeg', quality: 75, timeout: 120000 }); report.shots.push({ file, y: await page.evaluate(() => scrollY) }); };
    try {
      await page.goto('http://127.0.0.1:3000/', { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForTimeout(1200); await shot('home-opening');
      const cue = () => page.locator('#home-hero-scroll-container').evaluate(e => e.style.opacity);
      const firstCue = await cue(); await seek(height * .42); const movedCue = await cue();
      assert.notEqual(firstCue, movedCue); await shot('home-handoff');
      await seek(0); assert.equal(await cue(), firstCue, 'Home cue reverse restores');
      report.checks.push('Home reading-cue handoff and exact reverse');
      await page.goto('http://127.0.0.1:3000/about', { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForFunction(() => !!window.__aboutProbe && !!window.__ctaProbe);
      const unit = width < 820 ? height : width;
      for (const u of [0, .6, 1.6, 3.8, 5.35, 7.2]) { await seek(unit * u); await shot(`about-u${u}`); }
      for (const id of ['about-award', 'about-capability']) { await seek(await topOf(id)); await shot(id); }
      assert.equal(await page.locator('.about-expertise-column').count(), 4);
      assert.equal(await page.locator('.about-expertise-diagram').count(), 4);
      assert.equal((await page.locator('#about-capability li').allTextContents()).length, 20);
      assert.equal((await page.locator('[data-awards-word]').textContent()).trim(), 'AWARDS');
      const labelFits = await page.locator('#end-bottom-text-container').evaluate(el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1);
      assert.equal(labelFits, true, 'complete CTA action label must not wrap or clip');
      report.checks.push('four technical columns, all 20 services, outlined recognition act');
      if (width !== 390) {
        await seek(0);
        for (const delta of [1400, 2200, -1800, 2600]) await page.mouse.wheel(0, delta);
        await page.setViewportSize({ width, height: height - 70 });
        await page.waitForTimeout(600); await page.setViewportSize({ width, height });
        await page.waitForTimeout(800);
        assert.ok(Number.isFinite(await page.evaluate(() => window.__aboutProbe().u)));
        report.checks.push('large pixel-wheel bursts/reversal with resize during settling; physical trackpad not certified');
      }
      const layout = await page.locator('#end-section').evaluate(e => ({ top: e.getBoundingClientRect().top + scrollY, travel: e.offsetHeight - e.querySelector('#end-section-outer').clientHeight }));
      for (const p of [0, .5, 1, .5]) {
        await seek(layout.top + layout.travel * p);
        await page.waitForFunction(() => window.__ctaProbe?.().frames > 0);
        const probe = await page.evaluate(() => window.__ctaProbe());
        assert.ok(Math.abs(probe.progress - p) < .015, 'normalized CTA progress maps forward/reverse');
        await shot(`cta-${report.shots.length}-p${p}`);
      }
      const before = await page.evaluate(() => ({ t: performance.now(), ...window.__ctaProbe() }));
      await page.waitForTimeout(3500);
      const after = await page.evaluate(() => ({ t: performance.now(), ...window.__ctaProbe() }));
      report.cta = after;
      const samples = after.frameTimes.slice(-Math.min(after.frames - before.frames, 120)).sort((a, b) => a - b);
      report.softwareCadence = { submissionsPerSecond: (after.frames - before.frames) * 1000 / (after.t - before.t), medianRafMs: samples[Math.floor(samples.length * .5)], p95RafMs: samples[Math.floor(samples.length * .95)], physicalGpuTime: 'NOT MEASURED' };
      assert.equal(after.draws, 3); assert.ok(after.triangles <= after.count * 24);
      assert.equal(await page.locator('#end-section canvas').evaluate(c => c.getContext('webgl2').getError()), 0);
      if (width !== 390) {
        await page.mouse.move(width * .4, height * .75); await page.waitForTimeout(600);
        assert.ok((await page.evaluate(() => window.__ctaProbe())).pointer > .5);
      } else {
        await page.locator('#end-section-outer').dispatchEvent('pointermove', { pointerType: 'touch', clientX: 190, clientY: 600 });
        assert.equal((await page.evaluate(() => window.__ctaProbe())).pointer, 0);
      }
      // Synthetic visibility verifies listener ownership, not physical OS backgrounding.
      await page.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, value: true }); document.dispatchEvent(new Event('visibilitychange')); });
      const hiddenFrames = await page.evaluate(() => window.__ctaProbe().frames); await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.__ctaProbe().frames), hiddenFrames);
      await page.evaluate(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); });
      await page.waitForFunction(n => window.__ctaProbe().frames > n, hiddenFrames);
      await page.locator('#header-right-menu-btn').click(); await page.waitForTimeout(200);
      const menuFrames = await page.evaluate(() => window.__ctaProbe().frames); await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.__ctaProbe().frames), menuFrames);
      await page.keyboard.press('Escape'); await page.waitForFunction(n => window.__ctaProbe().frames > n, menuFrames);
      await page.evaluate(() => { const gl = document.querySelector('#end-section canvas').getContext('webgl2'); window.__ctaLossExtension = gl.getExtension('WEBGL_lose_context'); window.__ctaLossExtension.loseContext(); });
      await page.waitForFunction(() => window.__ctaProbe?.().state === 'lost');
      await page.waitForTimeout(300); await page.evaluate(() => window.__ctaLossExtension.restoreContext());
      await page.waitForFunction(() => window.__ctaProbe?.().state === 'ready' && window.__ctaProbe().pending);
      assert.equal(await page.locator('#end-section canvas').count(), 1);
      await seek(0); await page.waitForTimeout(200);
      const sleeping = await page.evaluate(() => window.__ctaProbe().frames); await page.waitForTimeout(300);
      assert.equal(await page.evaluate(() => window.__ctaProbe().frames), sleeping);
      for (const u of [7.2, 5.35, 1.6, 0]) { await seek(u * unit); assert.ok(Math.abs((await page.evaluate(() => window.__aboutProbe())).u - u) < .02); }
      await seek(layout.top + layout.travel * .5);
      await page.setViewportSize({ width, height: height - 70 }); await page.waitForTimeout(400); await page.setViewportSize({ width, height }); await page.waitForTimeout(400);
      report.checks.push('CTA depth/GL, pointer or touch guard, injected visibility, overlay sleep, genuine context restore, offscreen sleep, reverse scenes, resize');
      await page.emulateMedia({ reducedMotion: 'reduce' }); await page.waitForFunction(() => !window.__lenis);
      await seek(layout.top + layout.travel * .5); await page.waitForFunction(() => window.__ctaProbe?.().frames > 0);
      const reducedFrames = await page.evaluate(() => window.__ctaProbe().frames); await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => window.__ctaProbe().frames), reducedFrames);
      assert.equal(await page.evaluate(() => window.__ctaProbe().pending), false); await shot('cta-reduced');
      report.checks.push('complete reduced composition, no pending frame');
      await page.emulateMedia({ reducedMotion: 'no-preference' }); await page.waitForFunction(() => !!window.__lenis);
      await page.evaluate(() => { window.__oldCtaContext = document.querySelector('#end-section canvas').getContext('webgl2'); window.__oldCtaProbe = window.__ctaProbe; });
      await seek(await topOf('scroll-nav-section')); await page.locator('#scroll-nav-text').click(); await page.waitForURL('**/projects');
      await page.waitForFunction(() => window.__oldCtaContext.isContextLost());
      assert.equal(await page.evaluate(() => window.__oldCtaContext.isContextLost()), true);
      assert.equal(await page.evaluate(() => window.__ctaProbe === window.__oldCtaProbe), false, 'shared Projects CTA must own a fresh probe');
      assert.equal(await page.evaluate(() => window.__oldCtaProbe().pending), false, 'old scheduler is cancelled');
      report.checks.push('real footer route navigation releases owned CTA context/probe');
      assert.deepEqual(report.errors, []);
    } finally { fs.writeFileSync(`${out}/${width}.json`, JSON.stringify(report, null, 2)); await context.close(); }
  }
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await context.addInitScript(() => { sessionStorage.setItem('lusion_booted_v1', '1'); const native = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/.test(type) ? null : Reflect.apply(native, this, [type, ...args]); }; });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:3000/about', { waitUntil: 'networkidle' });
  await page.waitForSelector('[data-cta-field-state="unavailable"]');
  await page.locator('#end-section').scrollIntoViewIfNeeded();
  assert.equal(await page.locator('#end-section-title-link').getAttribute('href'), 'mailto:business@lusion.co');
  assert.equal(await page.locator('[data-cta-field-state] svg').count(), 1);
  await page.screenshot({ path: `${out}/cta-unavailable.jpg`, type: 'jpeg', quality: 75 });
  await context.close();
  console.log('PASS master reconstruction at 1440/768/390: content/acts, Home handoff, CTA native GPU flow, lifecycle/context/reduced/fallback/navigation. Software timings reported separately, not 60 Hz certification.');
} finally { await browser.close(); }
