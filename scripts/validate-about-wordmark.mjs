#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const base = process.env.ABOUT_WORDMARK_BASE || 'http://127.0.0.1:3000';
const out = process.env.ABOUT_WORDMARK_OUT || 'temp/about-wordmark-validation';
fs.mkdirSync(out, { recursive: true });

const browser = await launchMotionBrowser();
try {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width === 390,
      hasTouch: width === 390,
      reducedMotion: 'no-preference',
    });
    await context.addInitScript(() => {
      sessionStorage.setItem('lusion_booted_v1', '1');
      window.__enableAboutProbe = true;
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const response = await page.goto(base + '/about', { waitUntil: 'networkidle', timeout: 120000 });
      assert.ok(response?.ok(), 'About production route must respond successfully');
      await page.waitForFunction(() => window.__aboutProbe?.().explorer === 'ready', null, { timeout: 90000 });
      const unit = width === 390 ? height : width;
      const peak = width === 390 ? 2.15 : 1.25;
      const end = width === 390 ? 3.35 : 2.35;
      const mark = page.locator('[data-about-wordmark-sweep]');
      assert.equal(await mark.count(), 1, 'one semantic-hidden curved wordmark layer must be mounted');

      const seek = async progress => {
        await page.evaluate(y => {
          window.__lenis?.scrollTo(y, { immediate: true });
          window.scrollTo({ top: y, behavior: 'instant' });
        }, unit * progress);
        await page.waitForTimeout(500);
      };
      const inspect = () => mark.evaluate((element, mobile) => {
        const text = element.querySelector(mobile ? '[data-about-wordmark-mobile]' : '[data-about-wordmark-desktop]');
        const textPath = text?.querySelector('textPath');
        const pathId = textPath?.getAttribute('href')?.slice(1);
        const path = pathId ? document.getElementById(pathId) : null;
        const rect = element.getBoundingClientRect();
        return {
          opacity: Number(getComputedStyle(element).opacity),
          visibility: getComputedStyle(element).visibility,
          transform: element.style.transform,
          text: textPath?.textContent?.trim() ?? null,
          fontSize: Number(text?.getAttribute('fontSize') ?? 0),
          pathLength: path?.getTotalLength() ?? 0,
          stage: { width: rect.width, height: rect.height, top: rect.top },
          activeText: text?.dataset.aboutWordmarkMobile !== undefined ? 'mobile' : 'desktop',
        };
      }, width === 390);

      await seek(peak);
      const atPeak = await inspect();
      assert.ok(atPeak.opacity > 0.99, 'wordmark must reach full opacity at the valley beat');
      assert.equal(atPeak.visibility, 'visible');
      assert.equal(atPeak.text, 'LUSION');
      assert.equal(atPeak.activeText, width === 390 ? 'mobile' : 'desktop');
      assert.ok(atPeak.pathLength > 1000, 'the active sweep path must be a genuine long curve');
      assert.ok(width === 390 ? atPeak.fontSize <= 240 : atPeak.fontSize >= 380, 'responsive mark uses the correct glyph scale');
      assert.ok(atPeak.stage.width <= width + 1 && atPeak.stage.height <= height, 'responsive sweep remains within the viewport stage');
      const probeAtPeak = await page.evaluate(() => window.__aboutProbe?.());
      await page.screenshot({ path: `${out}/${width}-peak.png`, fullPage: false, timeout: 120000 });

      await seek(end);
      const atExit = await inspect();
      assert.ok(atExit.opacity < 0.005, 'wordmark must clear at the end of its authored transition');
      assert.equal(atExit.visibility, 'hidden');

      await seek(peak);
      const onReverse = await inspect();
      assert.ok(onReverse.opacity > 0.99, 'scrolling backward must restore the wordmark');
      assert.equal(onReverse.visibility, 'visible');
      const probeOnReverse = await page.evaluate(() => window.__aboutProbe?.());
      assert.ok(Math.abs((probeAtPeak?.u ?? peak) - (probeOnReverse?.u ?? peak)) < 0.02);

      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false, 'sweep must not create horizontal page overflow');
      assert.deepEqual(errors, [], 'no uncaught browser errors');
      await page.screenshot({ path: `${out}/${width}-reverse.png`, fullPage: false, timeout: 120000 });
      fs.writeFileSync(`${out}/${width}.json`, JSON.stringify({ width, height, peak, end, atPeak, atExit, onReverse, probeAtPeak, probeOnReverse, errors }, null, 2));
      console.log(`PASS About wordmark at ${width}x${height}: peak, exit, reverse, SVG path, no overflow or page errors.`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
