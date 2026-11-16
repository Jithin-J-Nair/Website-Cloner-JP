#!/usr/bin/env node
/** Browser behaviour/lifetime gates and visual-review artifacts, NOT pixel parity or GPU FPS. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base = process.env.BASE_URL || 'http://127.0.0.1:3003';
const out = path.resolve('temp/motion-fidelity-round2/validation'); fs.mkdirSync(out, {recursive: true});
const browser = await launchMotionBrowser(), report = {errors: [], failedAssets: [], cases: []};
const selector = '#home-hero-visual-container';
const wait = (p, fn, arg) => p.waitForFunction(fn, arg, {timeout: 120000});
const state = p => p.locator(selector).evaluate(e => ({...e.dataset, canvas: {...e.querySelector('canvas')?.dataset}}));
async function ready(p, count) {
  await wait(p, n => {const e = document.querySelector('#home-hero-visual-container'); return e?.dataset.webglStatus === 'ready' && e.querySelector('canvas')?.dataset.nativeAssets === 'true' && Number(e.dataset.clusterPieces) === n;}, count);
  const s = await state(p);
  assert.equal(s.materialModel, 'native-matcap-neighbour');
  assert.equal(Number(s.canvas.neighbours), count - 1); assert.equal(Number(s.canvas.glassBodies), count === 24 ? 2 : 0);
  assert.equal(s.accentColor, '#061dfb');
  return s;
}
async function frozen(p) {
  const before = await state(p);
  await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  await p.waitForTimeout(300);
  const after = await state(p);
  assert.equal(after.renderCount, before.renderCount, 'paused/static effect must not render continuously');
  assert.equal(after.nativeTime, before.nativeTime, 'visible-time clock must freeze');
  return after;
}
try {
  for (const width of [1440, 390]) {
    const context = await browser.newContext({viewport: {width, height: width === 390 ? 844 : 900}, reducedMotion: 'reduce', hasTouch: width === 390, isMobile: width === 390});
    await context.addInitScript(() => sessionStorage.setItem('lusion_booted_v1', '1'));
    const p = await context.newPage();
    p.on('pageerror', e => report.errors.push(e.message));
    p.on('console', m => {if (m.type() === 'error') report.errors.push(m.text());});
    p.on('response', r => {if (r.url().includes('/assets/') && !r.ok()) report.failedAssets.push(r.url());});
    await p.goto(base, {waitUntil: 'networkidle', timeout: 120000});
    const initial = await ready(p, width === 390 ? 22 : 24);
    await frozen(p); await p.screenshot({path: `${out}/static-${width}.jpg`, quality: 90, timeout: 120000});
    await p.emulateMedia({reducedMotion: 'no-preference'});
    await wait(p, () => Number(document.querySelector('#home-hero-visual-container')?.dataset.nativeTime) > 3);
    const active = await state(p); assert.equal(active.physicsActive, 'true'); assert.ok(Number(active.kineticEnergy) > .001);
    if (width === 1440) {
      const box = await p.locator(selector).boundingBox();
      await p.mouse.move(box.x + box.width * .16, box.y + box.height * .46);
      await p.mouse.move(box.x + box.width * .6, box.y + box.height * .55, {steps: 18});
      await wait(p, () => {const d = document.querySelector('#home-hero-visual-container').dataset; return Number(d.pointerInfluencedPieces) >= 2 && Number(d.pointerDisplacement) > .005 && Number(d.offsetEnergy) > .1;});
      const hovered = await state(p); assert.ok(Number(hovered.pointerInteractions) > 0);
      await p.screenshot({path: `${out}/hover-${width}.jpg`, quality: 90, timeout: 120000});
      await p.mouse.move(2, 2);
      await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.offsetEnergy === '0.00000');
      assert.equal((await state(p)).physicsActive, 'true', 'release is not a simulation stop');
      for (const x of [.2, .8, .3, .7]) await p.mouse.move(box.x + box.width*x, box.y + box.height*.56);
      await p.locator(selector).dispatchEvent('pointercancel', {pointerType: 'mouse'});
      await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.offsetEnergy === '0.00000');
      await p.locator(selector).focus(); await p.keyboard.press('Enter');
      await wait(p, () => Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy) > .2);
      await p.getByRole('button', {name: 'Open navigation menu'}).click();
      await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.activeRaf === 'false');
      await frozen(p); await p.keyboard.press('Escape');
      await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.activeRaf === 'true');
      // Real breakpoint changes must replace/dispose the old scene, not retain desktop glass on mobile.
      await p.setViewportSize({width: 812, height: 900}); await ready(p, 22);
      assert.equal(await p.locator(`${selector} canvas`).count(), 1);
      await p.setViewportSize({width: 813, height: 900}); await ready(p, 24);
      assert.equal(await p.locator(`${selector} canvas`).count(), 1);
      await p.setViewportSize({width: 1440, height: 900}); await ready(p, 24);
      report.cases.push({width, initial, hovered, pointerCancel: true, keyboard: true, menuPause: true, responsiveReplacement: true});
    } else {
      await p.locator(selector).dispatchEvent('pointermove', {pointerType: 'touch', clientX: 195, clientY: 400});
      assert.equal((await state(p)).offsetEnergy, '0.00000', 'touch cannot latch hover repulsion');
      report.cases.push({width, initial, touchNoHover: true});
    }
    await p.screenshot({path: `${out}/normal-${width}.jpg`, quality: 90, timeout: 120000});
    await p.evaluate(() => {window.__lenis?.scrollTo(innerHeight * 2, {immediate: true}); window.scrollTo(0, innerHeight * 2);});
    await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.activeRaf === 'false');
    await frozen(p);
    await p.evaluate(() => {window.__lenis?.scrollTo(0, {immediate: true}); window.scrollTo(0, 0);});
    await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.activeRaf === 'true');
    await p.emulateMedia({reducedMotion: 'reduce'});
    await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.physicsActive === 'false');
    await frozen(p);
    // Actual browser context loss, followed by a readable fallback rather than a blank box.
    await p.locator(`${selector} canvas`).evaluate(c => c.getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
    await wait(p, () => document.querySelector('#home-hero-visual-container').dataset.webglStatus === 'fallback');
    assert.equal(await p.locator('[data-webgl-fallback="active"]').count(), 1);
    await context.close();
  }
  const context = await browser.newContext({reducedMotion: 'reduce'}), p = await context.newPage();
  await p.goto(`${base}/?forceWebglFallback=1`, {waitUntil: 'networkidle', timeout: 120000});
  await wait(p, () => document.querySelector('#home-hero-visual-container')?.dataset.webglStatus === 'fallback');
  assert.equal(await p.locator(`${selector} canvas`).count(), 0);
  assert.ok(await p.locator(`${selector} [data-webgl-fallback="active"]`).isVisible());
  await context.close();
  assert.deepEqual(report.errors, []); assert.deepEqual(report.failedAssets, []);
  console.log('PASS native Home hero: real HDR assets, 24/22 bodies, ray displacement/release/cancel, keyboard, menu/offscreen pause, reduced freeze, 812px replacement and WebGL fallbacks.');
} finally { fs.writeFileSync(`${out}/report.json`, JSON.stringify(report, null, 2)); await browser.close(); }
