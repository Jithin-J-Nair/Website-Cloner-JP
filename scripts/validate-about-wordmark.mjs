#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const base = process.env.ABOUT_WORDMARK_BASE || 'http://127.0.0.1:3000';
const out = process.env.ABOUT_WORDMARK_OUT || 'temp/about-wordmark-validation';
fs.mkdirSync(out, { recursive: true });

const browser = await launchMotionBrowser();
try {
  for (const [width, height] of [[1536, 810], [1440, 900], [390, 844]]) {
    const context = await browser.newContext({
      viewport: { width, height },
      isMobile: width === 390,
      hasTouch: width === 390,
      reducedMotion: 'no-preference',
    });
    await context.addInitScript(() => {
      sessionStorage.setItem('lusion_booted_v1', '1');
      window.__enableAboutProbe = true;
      window.__enableCtaProbe = true;
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    try {
      const response = await page.goto(base + '/about', { waitUntil: 'networkidle', timeout: 120000 });
      assert.ok(response?.ok(), 'About production route must respond successfully');
      await page.waitForFunction(() => window.__aboutProbe?.().explorer === 'ready', null, { timeout: 90000 });
      const unit = width === 390 ? height : width;
      const peak = width === 390 ? 2.45 : 1.25;
      const end = width === 390 ? 3.45 : 2.35;
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
          fontSize: text ? Number.parseFloat(getComputedStyle(text).fontSize) : 0,
          pathLength: path?.getTotalLength() ?? 0,
          stage: { width: rect.width, height: rect.height, top: rect.top },
          activeText: text?.dataset.aboutWordmarkMobile !== undefined ? 'mobile' : 'desktop',
        };
      }, width === 390);

      await seek(0);
      await page.screenshot({ path: `${out}/${width}-opening.png`, fullPage: false, timeout: 120000 });
      await seek(width === 390 ? 2.8 : 1.6);
      await page.screenshot({ path: `${out}/${width}-basin.png`, fullPage: false, timeout: 120000 });
      await seek(peak);
      const atPeak = await inspect();
      assert.ok(atPeak.opacity > 0.99, 'wordmark must reach full opacity at the valley beat');
      if (width === 390) {
        const handoff = await page.evaluate(() => {
          const opening = document.querySelector('[data-about-opening-wordmark]');
          const manifesto = document.querySelector('[data-about-manifesto]');
          return {
            openingVisibility: opening ? getComputedStyle(opening).visibility : 'missing',
            manifestoVisibility: manifesto ? getComputedStyle(manifesto).visibility : 'missing',
            manifestoOpacity: manifesto ? Number(getComputedStyle(manifesto).opacity) : 0,
          };
        });
        assert.equal(handoff.openingVisibility, 'hidden', 'opening wordmark must clear before the mobile valley mark');
        assert.equal(handoff.manifestoVisibility, 'visible', 'mobile manifesto must be visible at the wordmark peak');
        assert.ok(handoff.manifestoOpacity > .95, 'mobile manifesto must have completed its entrance');
        atPeak.mobileHandoff = handoff;
      }
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
      // Validate the expertise deck in the production document, not only its math helper.
      const capability = page.locator('#about-capability');
      const deck = await capability.evaluate(element => ({
        top: element.getBoundingClientRect().top + window.scrollY,
        range: Math.max(1, element.offsetHeight - window.innerHeight),
      }));
      const cinematic = width >= 1000;
      const cardFrames = [];
      for (const p of cinematic ? [0, .34, .67, 1] : [1]) {
        await seek(deck.top + deck.range * p);
        const state = await capability.evaluate(element => ({
          progress: Number(element.dataset.cardProgress),
          layout: element.dataset.cardLayout,
          slots: [...element.querySelectorAll('.about-card-slot')].map(slot => slot.style.transform),
          flips: [...element.querySelectorAll('.about-card-flip')].map(flip => flip.style.transform),
        }));
        assert.equal(state.layout, cinematic ? 'cinematic' : 'reading');
        assert.ok(Math.abs(state.progress - p) < .01);
        assert.equal(state.slots.length, 4);
        assert.equal(state.flips.length, 4);
        if (cinematic && p === 0) {
          assert.ok(state.slots.every(value => /rotateY/.test(value) && /rotateX/.test(value) && /scale/.test(value)));
          assert.equal(new Set(state.slots).size, 4, 'cards must peel from the deck on distinct poses');
        }
        if (cinematic && p === 1) {
          assert.ok(state.slots.every(value => /rotateY\(0deg\)/.test(value) && /rotateX\(0deg\)/.test(value) && /scale\(1\)/.test(value)));
          assert.ok(state.flips.every(value => value === 'rotateY(0deg)'));
        }
        if (!cinematic) assert.ok(state.flips.every(value => value === 'rotateY(0deg)'));
        cardFrames.push({ requestedProgress: p, ...state });
        await page.screenshot({ path: `${out}/${width}-expertise-${p}.png`, fullPage: false, timeout: 120000 });
      }

      // Validate the lower CTA field: fixed GPU budget, pointer release, and touch safety.
      const ctaSection = page.locator('#end-section');
      const ctaTop = await ctaSection.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
      await seek(ctaTop);
      await page.waitForFunction(() => window.__ctaProbe?.().frames > 0, null, { timeout: 30000 });
      const ctaBase = await page.evaluate(() => window.__ctaProbe());
      assert.ok(width === 390 ? ctaBase.count === 720 : ctaBase.count === 960 || ctaBase.count === 1600);
      assert.ok(ctaBase.draws <= 3, 'CTA field must keep its three instanced draws');
      assert.ok(ctaBase.triangles <= ctaBase.count * 24, 'CTA geometry must remain within its triangle budget');
      let ctaInteraction;
      if (width === 390) {
        assert.equal(ctaBase.pointer, 0, 'touch viewport must not enable mouse repulsion');
        ctaInteraction = { touchPointerInactive: true };
      } else {
        await page.mouse.move(width * .56, height * .68);
        await page.waitForFunction(() => window.__ctaProbe?.().pointer > .85, null, { timeout: 5000 });
        const engaged = await page.evaluate(() => window.__ctaProbe().pointer);
        await page.mouse.move(width + 40, height + 40);
        await page.waitForFunction(() => window.__ctaProbe?.().pointer < .12, null, { timeout: 5000 });
        ctaInteraction = { pointerEngaged: engaged, pointerReleased: true };
      }
      await page.screenshot({ path: `${out}/${width}-cta-particle-field.png`, fullPage: false, timeout: 120000 });

      assert.deepEqual(errors, [], 'no uncaught browser errors');
      fs.writeFileSync(`${out}/${width}.json`, JSON.stringify({
        width, height, peak, end, atPeak, atExit, onReverse, probeAtPeak, probeOnReverse,
        cardFrames, cta: { count: ctaBase.count, draws: ctaBase.draws, triangles: ctaBase.triangles, ...ctaInteraction }, errors,
      }, null, 2));
      console.log(`PASS About production checks at ${width}x${height}: wordmark, expertise deck, CTA budget/pointer and no browser errors.`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
