#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const files = fs.readdirSync('public/assets/Program icons').filter(file => file.endsWith('.svg')).sort();
const base = process.env.BASE_URL || 'http://127.0.0.1:3004';
const browser = await launchMotionBrowser();
fs.mkdirSync('temp/about-program-icons', { recursive: true });
try {
  for (const [width, height, reducedMotion] of [[1440,900,'no-preference'], [390,844,'no-preference'], [390,844,'reduce'], [1440,900,'reduce']]) {
    const context = await browser.newContext({ viewport: { width, height }, reducedMotion });
    await context.addInitScript(() => { try { sessionStorage.setItem('lusion_booted_v1','1'); } catch {} });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const response = await page.goto(`${base}/about`, { waitUntil: 'networkidle', timeout: 120000 });
    assert.ok(response?.ok());
    const section = page.locator('#about-clients');
    await section.scrollIntoViewIfNeeded();
    const images = section.locator('.about-client-marquee-set:not([aria-hidden="true"]) img');
    assert.equal(await images.count(), files.length);
    assert.deepEqual((await images.evaluateAll(els => els.map(el => decodeURIComponent(new URL(el.src).pathname.split('/').pop())).sort())), files);
    await images.evaluateAll(els => els.forEach(el => { el.loading = 'eager'; }));
    await page.waitForFunction(() => [...document.querySelectorAll('#about-clients .about-client-marquee-set:not([aria-hidden="true"]) img')].every(el => el.complete && el.naturalWidth > 0), null, { timeout: 30000 });
    for (const name of ['Android Studio','Hugging Face','Kubernetes','Laravel','Supabase','TensorFlow','Vulkan']) {
      assert.ok(await images.evaluateAll((els, label) => els.some(el => el.alt === label && el.classList.contains('is-wide')), name), `${name} receives the larger optical size`);
    }
    assert.equal(await section.locator('.about-client-marquee').count(), 3);
    assert.equal(await section.locator('.about-client-marquee-set[aria-hidden="true"]').count(), 6);
    assert.deepEqual(errors, []);
    await page.screenshot({ path: `temp/about-program-icons/${width}-${reducedMotion}.png` });
    console.log(`PASS ${width} ${reducedMotion}: ${files.length} loaded program SVGs in three accessible rows`);
    await context.close();
  }
} finally { await browser.close(); }
