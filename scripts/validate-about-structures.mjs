#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const out = 'temp/structures/after'; fs.mkdirSync(out, { recursive: true });
const browser = await launchMotionBrowser();
try {
  for (const width of [1440, 768, 390]) {
    const height = width === 390 ? 844 : 900;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width === 390, hasTouch: width === 390 });
    await context.addInitScript(() => { sessionStorage.setItem('lusion_booted_v1', '1'); window.__enableAboutProbe = true; window.__enableExpertiseProbe = true; });
    const page = await context.newPage(), report = { width, height, errors: [], shots: [], checks: [] };
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    const seek = async y => { await page.evaluate(y => { window.__lenis?.scrollTo(y, { immediate: true }); window.scrollTo({ top: y, behavior: 'instant' }); }, y); await page.waitForTimeout(750); };
    const shot = async name => { const file = `${width}-${name}.jpg`; await page.screenshot({ path: `${out}/${file}`, type: 'jpeg', quality: 80, timeout: 120000 }); report.shots.push(file); };
    try {
      await page.goto('http://127.0.0.1:3000/about', { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForFunction(() => !!window.__aboutProbe && !!window.__expertiseProbe);
      for (const u of [0, .7, 1.6, 3.8, 5.35, 7.2]) { await seek(u * (width < 820 ? height : width)); await shot(`u${u}`); }
      for (const u of [1.6, 0]) { await seek(u * (width < 820 ? height : width)); assert.ok(Math.abs(windowValue(await page.evaluate(() => window.__aboutProbe().u)) - u) < .02); }
      report.checks.push('all cinematic milestones and reverse');
      const slots = page.locator('[data-expertise-drawing]');
      for (const index of (width === 1440 ? [0] : width === 768 ? [0, 2] : [0, 1, 2, 3])) {
        const y = await slots.nth(index).evaluate(e => e.getBoundingClientRect().top + scrollY - innerHeight * .18);
        await seek(y); await page.waitForFunction(() => window.__expertiseProbe?.().frames > 0 && window.__expertiseProbe().draws > 0);
        await shot(`expertise-row${index}`);
      }
      const firstY = await slots.first().evaluate(e => e.getBoundingClientRect().top + scrollY - innerHeight * .18);
      await seek(firstY);
      report.expertise = await page.evaluate(() => window.__expertiseProbe());
      assert.ok(report.expertise.draws > 0 && report.expertise.draws <= 4);
      assert.ok(report.expertise.vertices < 10000);
      assert.equal(await page.locator('#about-expertise-canvas').count(), 1);
      assert.equal(await page.locator('#about-expertise-canvas').evaluate(c => c.getContext('webgl2').getError()), 0);
      assert.equal(await page.locator('[data-expertise-plane]').first().evaluate(e => getComputedStyle(e).opacity), '0');
      if (width !== 390) {
        await page.mouse.move(width * .85, height * .4); await page.waitForTimeout(500);
        assert.ok(Math.abs((await page.evaluate(() => window.__expertiseProbe())).pointer[0]) > .3);
      } else {
        await page.locator('#about-capability').dispatchEvent('pointermove', { pointerType: 'touch', clientX: 280, clientY: 350 });
        assert.deepEqual((await page.evaluate(() => window.__expertiseProbe())).pointer, [0, 0]);
      }
      await page.locator('#header-right-menu-btn').click(); await page.waitForTimeout(200);
      const paused = await page.evaluate(() => window.__expertiseProbe().frames); await page.waitForTimeout(350);
      assert.equal(await page.evaluate(() => window.__expertiseProbe().frames), paused);
      await page.keyboard.press('Escape'); await page.waitForFunction(n => window.__expertiseProbe().frames > n, paused);
      await page.evaluate(() => { window.__expertiseLoss = document.querySelector('#about-expertise-canvas').getContext('webgl2').getExtension('WEBGL_lose_context'); window.__expertiseLoss.loseContext(); });
      await page.waitForFunction(() => window.__expertiseProbe().lost);
      assert.equal(await page.locator('[data-expertise-plane]').first().evaluate(e => getComputedStyle(e).opacity), '1');
      await page.waitForTimeout(300); await page.evaluate(() => window.__expertiseLoss.restoreContext());
      await page.waitForFunction(() => !window.__expertiseProbe().lost && window.__expertiseProbe().pending);
      report.checks.push('one scissored renderer, bounded real 3D geometry, input/touch gate, menu sleep and genuine context loss/SVG fallback/restoration');
      await seek(0); const asleep = await page.evaluate(() => window.__expertiseProbe().frames); await page.waitForTimeout(350);
      assert.equal(await page.evaluate(() => window.__expertiseProbe().frames), asleep);
      await page.setViewportSize({ width, height: height - 70 }); await page.setViewportSize({ width, height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await seek(firstY); await page.waitForFunction(() => window.__expertiseProbe?.().reduced && window.__expertiseProbe().frames > 0);
      const still = await page.evaluate(() => window.__expertiseProbe()); await page.waitForTimeout(500);
      assert.equal(await page.evaluate(() => window.__expertiseProbe().frames), still.frames);
      assert.equal(await page.evaluate(() => window.__expertiseProbe().pending), false);
      await shot('expertise-reduced');
      await page.evaluate(() => { window.__oldExpertise = document.querySelector('#about-expertise-canvas').getContext('webgl2'); window.__oldExpertiseProbe = window.__expertiseProbe; });
      await page.locator('#scroll-nav-text').scrollIntoViewIfNeeded();
      await page.locator('#scroll-nav-text').click(); await page.waitForURL('**/projects');
      await page.waitForFunction(() => window.__oldExpertise.isContextLost());
      assert.equal(await page.evaluate(() => window.__oldExpertiseProbe().pending), false);
      assert.equal(await page.locator('#about-expertise-canvas').count(), 0);
      report.checks.push('offscreen suspension, resize, reduced still and real SPA context/scheduler release');
      assert.deepEqual(report.errors, []);
    } finally { fs.writeFileSync(`${out}/${width}.json`, JSON.stringify(report, null, 2)); await context.close(); }
  }
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } });
  await c.addInitScript(() => { sessionStorage.setItem('lusion_booted_v1', '1'); const native = HTMLCanvasElement.prototype.getContext; HTMLCanvasElement.prototype.getContext = function(type, ...args) { return /webgl/.test(type) ? null : Reflect.apply(native, this, [type, ...args]); }; });
  const p = await c.newPage(); await p.goto('http://127.0.0.1:3000/about', { waitUntil: 'networkidle' });
  assert.equal(await p.locator('.about-expertise-diagram').count(), 4);
  assert.equal(await p.locator('#about-capability li').count(), 20);
  assert.equal(await p.locator('[data-expertise-plane]').first().evaluate(e => getComputedStyle(e).opacity), '1');
  await c.close();
  console.log('PASS expanded cinematic structures and native 3D expertise at 1440/768/390; fallback/lifecycle/reduced tests. Not an exact-reference or hardware smoothness certification.');
} finally { await browser.close(); }
function windowValue(value) { assert.ok(Number.isFinite(value)); return value; }
