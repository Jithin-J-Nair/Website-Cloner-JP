#!/usr/bin/env node
/** Production browser checks for shared motion; screenshots are not fidelity certification. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const baseline = process.env.SITE_SCROLL_BASELINE === '1';
const out = `temp/scroll-polish/${baseline ? 'before' : 'after'}`;
fs.mkdirSync(out, { recursive: true });
const browser = await launchMotionBrowser();
try {
  for (const width of [1440, 768, 390]) {
    const height = width === 390 ? 844 : 900;
    const context = await browser.newContext({ viewport: { width, height }, isMobile: width === 390, hasTouch: width === 390 });
    await context.addInitScript(() => { sessionStorage.setItem('lusion_booted_v1', '1'); window.__enableAboutProbe = true; });
    const page = await context.newPage();
    const report = { width, height, baseline, errors: [], shots: [], reel: [] };
    page.on('pageerror', e => report.errors.push(e.message));
    page.on('console', m => { if (m.type() === 'error') report.errors.push(m.text()); });
    const seek = async y => {
      await page.evaluate(top => { window.__lenis?.scrollTo(top, { immediate: true }); window.scrollTo({ top, behavior: 'instant' }); }, y);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      await page.waitForTimeout(700);
    };
    const shot = async name => {
      const file = `${width}-${name}.jpg`;
      await page.screenshot({ path: `${out}/${file}`, type: 'jpeg', quality: 70, timeout: 120000 });
      report.shots.push({ file, y: await page.evaluate(() => scrollY) });
    };
    const topOf = selector => page.locator(selector).evaluate(el => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; });
    try {
      await page.goto('http://127.0.0.1:3000', { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForSelector('#home-hero canvas');
      await page.waitForTimeout(1500);
      await shot('home-hero');
      const reelTop = await topOf('#home-reel-container');
      for (const [i, offset] of [0.94, 0.5, 0.12].entries()) {
        await seek(reelTop - height * offset);
        report.reel.push(await page.locator('#home-reel-video-title').evaluate(el => {
          const words = [...el.children];
          return { gap: getComputedStyle(el).columnGap, layoutWidth: el.offsetWidth, transforms: words.map(w => w.style.transform), widths: words.map(w => w.offsetWidth) };
        }));
        await shot(`home-reel-${i}`);
      }
      await seek((await topOf('#home-featured')) + height * 0.12);
      report.cards = await page.locator('.project-item').evaluateAll(cards => cards.slice(0, 2).map(el => ({
        inheritedStyle: el.getAttribute('style'),
        stage: el.querySelector('.project-item-main').style.transform,
        image: el.querySelector('img.project-item-image')?.style.transform,
      })));
      await shot('home-featured');
      if (!baseline) {
        assert.equal(new Set(report.reel.map(r => r.gap)).size, 1, 'reel gap is layout-stable across scroll');
        assert.equal(new Set(report.reel.map(r => r.layoutWidth)).size, 1, 'reel layout width is stable');
        assert.notDeepEqual(report.reel[0].transforms, report.reel[2].transforms, 'words part through direct transforms');
        for (const card of report.cards) {
          assert.ok(!card.inheritedStyle?.includes('--project-'));
          assert.match(card.stage, /translate3d.*scale.*skewY/);
          assert.match(card.image, /translate3d.*scale\(1\.08\)/);
        }
        if (width !== 390) {
          await page.mouse.move(20, 180);
          await page.waitForFunction(() => document.querySelector('[data-studio-cursor]')?.style.opacity === '1');
          await page.mouse.move(220, 250);
          await page.waitForTimeout(750);
          report.cursor = await page.locator('[data-studio-cursor]').evaluate(el => {
            const ring = el.children[1], rect = ring.getBoundingClientRect();
            return { width: ring.offsetWidth, height: ring.offsetHeight, x: rect.x + rect.width / 2, y: rect.y + rect.height / 2, transition: getComputedStyle(ring.firstElementChild).transitionProperty };
          });
          assert.deepEqual([report.cursor.width, report.cursor.height], [44, 44]);
          assert.ok(Math.hypot(report.cursor.x - 220, report.cursor.y - 250) < 1);
          assert.ok(!/width|height|padding/.test(report.cursor.transition));
          await page.evaluate(() => window.dispatchEvent(new Event('blur')));
          assert.equal(await page.locator('[data-studio-cursor]').evaluate(el => el.style.opacity), '0');
          await page.mouse.move(230, 260);
          await page.waitForFunction(() => document.querySelector('[data-studio-cursor]')?.style.opacity === '1');
          report.injectedBlurResumes = true;
        } else assert.equal(await page.locator('[data-studio-cursor]').count(), 0, 'no custom touch cursor');
        // A live preference change recreates Lenis; an already-open overlay must still own the lock.
        await page.locator('#header-right-menu-btn').click();
        await page.waitForFunction(() => window.__lenis?.isStopped === true);
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => !window.__lenis);
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.waitForFunction(() => window.__lenis?.isStopped === true);
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => window.__lenis?.isStopped === false);
        report.overlayPreferenceLock = true;
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await page.waitForFunction(() => !window.__lenis);
        await seek((await topOf('#home-featured')) + height * 0.12);
        report.reduced = await page.locator('.project-item-main').first().evaluate(el => ({ transform: el.style.transform, image: el.querySelector('img').style.transform }));
        assert.ok(!report.reduced.transform.includes('NaN'));
        assert.equal(report.reduced.image, 'none');
        await shot('home-reduced');
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await page.waitForFunction(() => !!window.__lenis);
      }
      await page.goto('http://127.0.0.1:3000/about', { waitUntil: 'networkidle', timeout: 120000 });
      await page.waitForFunction(() => !!window.__aboutProbe);
      const unit = width < 820 ? height : width;
      report.about = [];
      for (const u of [0, 1.6, 5.35]) {
        await seek(u * unit);
        await shot(`about-u${u}`);
        report.about.push(await page.evaluate(() => window.__aboutProbe()));
      }
      if (!baseline) {
        assert.ok(report.about[0].triangles <= report.about[0].count * 2, 'two triangles per analytical sphere, with the existing population');
        for (const [id, theme] of [['about-award', 'is-black-bg'], ['about-capability', 'is-blue-bg'], ['end-section', 'is-blue-bg']]) {
          await seek(await topOf(`#${id}`));
          assert.ok(await page.evaluate(theme => document.documentElement.classList.contains(theme), theme), `${id} header contrast`);
        }
        report.headerBands = true;
        assert.deepEqual(report.errors, []);
      }
    } finally {
      fs.writeFileSync(`${out}/${width}.json`, JSON.stringify(report, null, 2));
      await context.close();
    }
  }
  console.log(baseline ? 'Captured unchanged production baseline at 1440/768/390.' : 'PASS shared cursor, overlay/preference locks, direct Home transforms, stable reel layout, reduced/touch, About shader and header bands at 1440/768/390.');
} finally { await browser.close(); }
