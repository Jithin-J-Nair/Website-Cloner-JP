#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const svg = fs.readFileSync('public/sites/jithin/recognition-title.svg', 'utf8');
assert.deepEqual([...svg.matchAll(/data-line="([^"]+)"/g)].map(m => m[1]), ['MAKING','COMPLEX','THINGS','WORK.']);
assert.equal((svg.match(/<path /g) || []).length, 4);
const browser = await launchMotionBrowser();
fs.mkdirSync('temp/recognition-rebuilt', {recursive:true});
try {
  for (const [width,height,reducedMotion] of [[1440,900,'no-preference'],[390,844,'no-preference'],[390,844,'reduce']]) {
    const context = await browser.newContext({viewport:{width,height},reducedMotion});
    await context.addInitScript(() => { try { sessionStorage.setItem('lusion_booted_v1','1'); } catch {} window.__enableRecognitionProbe = true; });
    const page = await context.newPage(); const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto((process.env.BASE_URL || 'http://127.0.0.1:3004') + '/about', {waitUntil:'networkidle', timeout:120000});
    const award = page.locator('#about-award'); await award.scrollIntoViewIfNeeded();
    if (reducedMotion !== 'reduce') {
      await page.waitForFunction(() => window.__recognitionProbe?.().state === 'ready', null, {timeout:60000});
      const probe = await page.evaluate(() => window.__recognitionProbe()); assert.ok(probe.edges > 0);
      await page.mouse.move(width*.35,height*.35); await page.mouse.move(width*.7,height*.55,{steps:12});
    }
    assert.equal(await page.locator('#about-award .about-source-monument img').getAttribute('src'), '/sites/jithin/recognition-title.svg');
    assert.deepEqual(errors, []);
    await page.screenshot({path:`temp/recognition-rebuilt/${width}-${reducedMotion}.png`});
    console.log(`PASS ${width} ${reducedMotion}: four-line vector and ${reducedMotion === 'reduce' ? 'static fallback' : 'interactive GPU rendering'}`);
    await context.close();
  }
} finally { await browser.close(); }
