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
      // Absolute document-Y navigation is separate from the normalized wordmark
      // timeline helper above. Passing a document coordinate to seek() would
      // multiply it by the viewport dimension and clamp at the page bottom.
      const seekY = async y => {
        await page.evaluate(top => {
          window.__lenis?.scrollTo(top, { immediate: true });
          window.scrollTo({ top, behavior: 'instant' });
        }, y);
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
          fill: text ? getComputedStyle(text).fill : null,
          stroke: text ? getComputedStyle(text).stroke : null,
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
      assert.equal(atPeak.fill, 'rgb(255, 255, 255)', 'curved wordmark is solid white, not outline-only');
      assert.equal(atPeak.stroke, 'none', 'curved wordmark does not render as a double outline');
      const openingFill = await page.locator('[data-about-opening-wordmark] text').evaluate(element => getComputedStyle(element).fill);
      assert.equal(openingFill, 'rgb(255, 255, 255)', 'opening wordmark remains a filled solid glyph');
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

      // Team hologram: select a different member and prove the pointer-driven portrait
      // responds, then returns to centre when the pointer leaves the viewport.
      const who = page.locator('#about-who');
      const whoTop = await who.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
      await seekY(whoTop + unit * 7.2);
      await page.waitForFunction(() => {
        const probe = window.__aboutProbe?.();
        return probe && probe.u > 7 && document.querySelector('#about-who-team-name');
      }, null, { timeout: 15000 });
      const originalMember = (await page.locator('#about-who-team-name').textContent())?.trim();
      await page.getByRole('button', { name: 'Select Ffion Morgan' }).click();
      await page.waitForFunction(() => document.querySelector('#about-who-team-name')?.textContent?.trim() === 'Ffion Morgan', null, { timeout: 5000 });
      assert.notEqual(originalMember, 'Ffion Morgan', 'team selector changes the active member');
      let teamInteraction = { originalMember, selectedMember: 'Ffion Morgan' };
      if (width !== 390) {
        await page.mouse.move(width * .84, height * .46);
        await page.waitForFunction(() => Math.abs(window.__aboutProbe?.().teamYaw ?? 0) > .015, null, { timeout: 5000 });
        const yawAtPointer = await page.evaluate(() => window.__aboutProbe().teamYaw);
        await page.evaluate(() => document.documentElement.dispatchEvent(new PointerEvent('pointerleave')));
        await page.waitForFunction(() => Math.abs(window.__aboutProbe?.().teamYaw ?? 1) < .005, null, { timeout: 5000 });
        teamInteraction = { ...teamInteraction, yawAtPointer, pointerReturnedToRest: true };
      } else {
        teamInteraction = { ...teamInteraction, touchMemberSwitch: true };
      }
      await page.screenshot({ path: `${out}/${width}-team.png`, fullPage: false, timeout: 120000 });

      // Brand wall: every first-copy logo must load from the approved bundled SVG,
      // and the marquee must animate (or present its static reduced-motion fallback).
      const clients = page.locator('#about-clients');
      const clientsTop = await clients.evaluate(element => element.getBoundingClientRect().top + window.scrollY);
      await seekY(clientsTop);
      const logoState = await clients.evaluate(section => {
        const firstSets = [...section.querySelectorAll('.about-client-marquee-set:not([aria-hidden="true"])')];
        const images = firstSets.flatMap(set => [...set.querySelectorAll('img')]);
        const track = section.querySelector('.about-client-marquee-track');
        return {
          count: images.length,
          altCount: images.filter(image => image.alt.trim().length > 0).length,
          loaded: images.filter(image => image.complete && image.naturalWidth > 0).length,
          animation: track ? getComputedStyle(track).animationName : 'missing',
          rows: section.querySelectorAll('.about-client-marquee').length,
        };
      });
      assert.equal(logoState.rows, 3, 'client brands retain three flowing rows');
      assert.equal(logoState.count, 16, 'all three source rows retain their 16 logo placements');
      assert.equal(logoState.altCount, 16, 'every brand mark has useful alternative text');
      assert.equal(logoState.loaded, 16, 'all first-copy SVG logo assets load successfully');
      assert.equal(logoState.animation, 'about-client-marquee');
      if (width !== 390) {
        await clients.locator('.about-client-marquee').first().hover();
        assert.equal(await clients.locator('.about-client-marquee-track').first().evaluate(el => getComputedStyle(el).animationPlayState), 'paused', 'hover pauses the marquee without stopping other rows');
        await page.mouse.move(width - 2, height - 2);
      }
      await page.screenshot({ path: `${out}/${width}-clients.png`, fullPage: false, timeout: 120000 });

      // Recognition ledger: visit every reveal target in turn so the observer is
      // tested through the complete award/article/talk record, not one viewport.
      const awardTargets = page.locator('#about-award [data-award-reveal]');
      const awardCount = await awardTargets.count();
      assert.ok(awardCount >= 9, 'recognition exposes the summary, award groups, articles and talks');
      const awardPositions = await awardTargets.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top + window.scrollY));
      for (let index = 0; index < awardPositions.length; index++) {
        await seekY(Math.max(0, awardPositions[index] - height * .58));
        await page.waitForFunction(i => document.querySelectorAll('#about-award [data-award-reveal]')[i]?.classList.contains('is-in-view'), index, { timeout: 5000 });
      }
      const awardState = await page.evaluate(() => ({
        visible: [...document.querySelectorAll('#about-award [data-award-reveal]')].filter(el => el.classList.contains('is-in-view')).length,
        total: document.querySelectorAll('#about-award [data-award-reveal]').length,
        headline: document.querySelector('#about-award .about-awards-monument')?.textContent?.trim(),
      }));
      assert.equal(awardState.visible, awardState.total, 'all recognition groups reveal as they enter the viewport');
      assert.equal(awardState.headline, 'AWARDS');
      await page.screenshot({ path: `${out}/${width}-recognition.png`, fullPage: false, timeout: 120000 });

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
        await seekY(deck.top + deck.range * p);
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
      await seekY(ctaTop);
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
