#!/usr/bin/env node
/** Supplemental complete service-column captures, after the serial regression runner. */
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const out = 'temp/master/after';
fs.mkdirSync(out, { recursive: true });
const browser = await launchMotionBrowser();
try {
  for (const width of [1440, 768, 390]) {
    const context = await browser.newContext({ viewport: { width, height: width === 390 ? 844 : 900 } });
    try {
      await context.addInitScript(() => sessionStorage.setItem('lusion_booted_v1', '1'));
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:3000/about', { waitUntil: 'networkidle', timeout: 120000 });
      await page.evaluate(() => document.fonts.ready);
      await page.locator('#about-capability').evaluate(el => {
        const y = el.getBoundingClientRect().top + scrollY + innerHeight * .5;
        window.__lenis?.scrollTo(y, { immediate: true });
        window.scrollTo({ top: y, behavior: 'instant' });
      });
      await page.waitForTimeout(700);
      await page.locator('#about-capability').screenshot({ path: `${out}/${width}-expertise-complete.jpg`, type: 'jpeg', quality: 80, timeout: 120000 });
    } finally { await context.close(); }
  }
  console.log('Captured complete four-column expertise at 1440/768/390; not a performance measurement.');
} finally { await browser.close(); }
