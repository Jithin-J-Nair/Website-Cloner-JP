import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const base = process.env.BASE_URL || 'http://127.0.0.1:3003';
const out = 'temp/full-audit/readiness';
fs.mkdirSync(out, { recursive: true });
const report = { scope: 'Real delayed Atlas image, actual shader uniforms, independent entrance/readiness, reverse, source replacement and reduced-motion rendering. Not reference-pixel or physical-GPU performance acceptance.', states: [], errors: [], passed: false };
const browser = await launchMotionBrowser();
let mobileBrowser;
let release;
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'no-preference' });
  await context.addInitScript(() => {
    sessionStorage.setItem('lusion_booted_v1', '1');
    window.__caseReadyProbe = { ready: 0, reveal: 0, samples: [] };
    const names = new WeakMap();
    for (const Type of [WebGLRenderingContext, WebGL2RenderingContext]) {
      const get = Type.prototype.getUniformLocation, set = Type.prototype.uniform1f;
      Type.prototype.getUniformLocation = function(program, name) {
        const location = get.call(this, program, name);
        if (location && this.canvas.id === 'case-gallery-canvas') names.set(location, name);
        return location;
      };
      Type.prototype.uniform1f = function(location, value) {
        const name = names.get(location), probe = window.__caseReadyProbe;
        if (name === 'uReady') { probe.ready = value; probe.samples.push(value); }
        if (name === 'uReveal') probe.reveal = value;
        return set.call(this, location, value);
      };
    }
  });
  const gate = new Promise(resolve => { release = resolve; });
  let intercepted = false;
  await context.route('**/assets/projects/atlas_motion/1.webp', async route => { intercepted = true; await gate; await route.continue(); });
  const page = await context.newPage();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => { if (message.type() === 'error' && /THREE|GLSL|Shader Error/.test(message.text())) report.errors.push(message.text()); });
  await page.goto(base + '/projects/atlas_motion', { waitUntil: 'domcontentloaded', timeout: 120000 });
  await page.waitForFunction(() => document.querySelector('main')?.dataset.caseReady === 'true');
  const panel = page.locator('.case-panel[data-panel-index="1"]');
  const seek = async () => panel.evaluate(element => {
    const y = element.offsetLeft - innerWidth * .1;
    window.__lenis?.resize();
    if (window.__lenis) window.__lenis.scrollTo(y, { immediate: true, force: true }); else scrollTo(0, y);
  });
  await seek();
  await page.waitForFunction(() => document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.caseVisible === 'true');
  await page.waitForTimeout(1100);
  assert.equal(intercepted, true);
  assert.equal(Number(await panel.getAttribute('data-case-readiness')), 0, 'being active cannot reveal an undecoded image');
  assert.notEqual(await panel.getAttribute('data-case-pixels'), 'ready');
  report.states.push({ name: 'delayed', readiness: 0 });
  release();
  await page.waitForFunction(() => Number(document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.caseReadiness) > .05);
  await page.screenshot({ path: path.join(out, 'loading.jpg'), quality: 80 });
  await page.waitForFunction(() => Number(document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.caseReadiness) === 1, null, { timeout: 15000 });
  const probe = await page.evaluate(() => window.__caseReadyProbe);
  assert.ok(probe.samples.some(value => value > .05 && value < .9), 'actual uReady must interpolate, not just a DOM diagnostic');
  assert.equal(probe.ready, 1);
  report.states.push({ name: 'decoded', minShaderReadiness: Math.min(...probe.samples), maxShaderReadiness: Math.max(...probe.samples), samples: probe.samples.length });
  await page.screenshot({ path: path.join(out, 'ready.jpg'), quality: 80 });
  await page.evaluate(() => { if (window.__lenis) window.__lenis.scrollTo(0, { immediate: true, force: true }); else scrollTo(0, 0); });
  await page.waitForFunction(() => document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.caseVisible === 'false');
  await seek();
  await page.waitForFunction(() => document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.caseVisible === 'true');
  assert.equal(Number(await panel.getAttribute('data-case-readiness')), 1, 'reverse resets entrance, not loaded-source readiness');
  report.states.push({ name: 'reverse', readiness: 1 });
  await panel.locator('img').evaluate(image => { image.src = image.currentSrc + '?readiness=v2'; });
  await page.waitForFunction(() => Number(document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.caseReadiness) < .9);
  await page.waitForFunction(() => Number(document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.caseReadiness) === 1, null, { timeout: 15000 });
  report.states.push({ name: 'source-replacement', readiness: 1 });
  await context.close();
  mobileBrowser = await launchMotionBrowser();
  const reduced = await mobileBrowser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await reduced.addInitScript(() => sessionStorage.setItem('lusion_booted_v1', '1'));
  const mobile = await reduced.newPage();
  mobile.on('pageerror', error => report.errors.push(error.message));
  await mobile.goto(base + '/projects/atlas_motion', { waitUntil: 'networkidle', timeout: 120000 });
  const mobilePanel = mobile.locator('.case-panel[data-panel-index="1"]');
  await mobilePanel.evaluate(element => scrollTo(0, element.getBoundingClientRect().top + scrollY));
  await mobile.waitForFunction(() => document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.casePixels === 'ready');
  assert.equal(Number(await mobilePanel.getAttribute('data-case-readiness')), 1);
  report.states.push({ name: 'mobile-reduced', readiness: 1 });
  assert.deepEqual(report.errors, []);
  report.passed = true;
  console.log('PASS real delayed image/shader readiness, reverse, source replacement and mobile reduced motion.');
} finally {
  release?.();
  fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2));
  await mobileBrowser?.close();
  await browser.close();
}
