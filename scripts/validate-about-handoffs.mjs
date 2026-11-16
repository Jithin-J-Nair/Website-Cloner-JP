#!/usr/bin/env node
/** Production-rendered HUD/camera handoffs. Not a reference-fidelity/FPS test.
 * CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-handoffs.mjs [output-dir]
 * Optional WIDTHS=1568,390 and ABOUT_HANDOFF_BASE=http://... .
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const base = process.env.ABOUT_HANDOFF_BASE || 'http://127.0.0.1:3000';
const out = process.argv[2] || 'temp/about-handoffs';
const selected = process.env.WIDTHS?.split(',').map(Number);
const cases = [[1568,832], [1440,900], [768,1024], [390,844], [2560,1440]]
  .filter(([width]) => !selected || selected.includes(width));
assert.ok(cases.length, 'at least one declared viewport must be selected');
fs.mkdirSync(out, { recursive: true });
const browser = await launchMotionBrowser();
try {
  for (const [width, height] of cases) {
    const context = await browser.newContext({ viewport: {width,height}, isMobile:width<820, hasTouch:width<820 });
    await context.addInitScript(() => { sessionStorage.setItem('lusion_booted_v1','1'); window.__enableAboutProbe=true; });
    const page = await context.newPage();
    const report = {width,height,renderer:'Chromium/SwiftShader in sandbox; no hardware FPS certification',states:[],reverse:[],errors:[],restrictedRequests:[]};
    const persist = () => fs.writeFileSync(`${out}/${width}.json`, JSON.stringify(report,null,2));
    page.on('pageerror', error => report.errors.push(error.message));
    page.on('console', message => { if(message.type()==='error') report.errors.push(message.text()); });
    page.on('request', request => { if (/\/team\/.*\.buf|\/models\/about_scene/.test(request.url())) report.restrictedRequests.push(request.url()); });
    try {
      assert.ok((await page.goto(`${base}/about`,{waitUntil:'networkidle',timeout:120000}))?.ok());
      await page.waitForFunction(() => window.__aboutProbe?.().explorer==='ready',null,{timeout:90000});
      await page.locator('#preloader').waitFor({state:'detached',timeout:30000});
      const unit = width<820?height:width;
      const seek = async u => {
        await page.evaluate(y => window.__lusionInspector.scrollManager.scrollToPixel(y), u*unit);
        await page.waitForFunction(u => Math.abs(window.__aboutProbe().u-u)<.01,u,{timeout:20000});
      };
      const inspect = () => page.evaluate(() => {
        const layer = selector => {
          const element = document.querySelector(selector), style = getComputedStyle(element), rect=element.getBoundingClientRect();
          return {visibility:style.visibility,opacity:Number(style.opacity),x:rect.x,right:rect.right,top:rect.top,bottom:rect.bottom};
        };
        return {opening:layer('[data-about-opening-wordmark]'),manifesto:layer('[data-about-manifesto]'),narrative:layer('[data-about-narrative]'),overflow:document.documentElement.scrollWidth>innerWidth,probe:window.__aboutProbe()};
      });
      for (const [name,u] of [['opening',0],['basin',width<820?2.45:1.6],['sweep',width<820?2.45:1.25],['wide',3.55],['handoff',4.9],['narrative',5.35],['team',7.2]]) {
        await seek(u);
        const state={name,u,...await inspect()};
        assert.equal(state.overflow,false,`${width} ${name}: no horizontal overflow`);
        if (['basin','wide'].includes(name)) {
          assert.equal(state.opening.visibility,'hidden'); assert.equal(state.manifesto.visibility,'visible');
          assert.equal(state.narrative.visibility,'hidden');
        }
        if (name==='narrative') {
          assert.equal(state.opening.visibility,'hidden'); assert.equal(state.manifesto.visibility,'hidden');
          assert.equal(state.narrative.visibility,'visible');
          assert.ok(state.narrative.x>=0&&state.narrative.right<=width);
        }
        if (name==='team') {
          state.headerClearance=await page.evaluate(() => {
            const title=[...document.querySelectorAll('[data-team-hud-title]')].find(el=>el.getClientRects().length);
            return title.getBoundingClientRect().top-document.querySelector('#header').getBoundingClientRect().bottom;
          });
          assert.ok(state.headerClearance>=8,'team title clears the fixed header');
        }
        state.file=`${width}-${name}.jpg`;
        report.states.push(state); persist();
        await page.screenshot({path:`${out}/${state.file}`,type:'jpeg',quality:85,timeout:120000});
      }
      // Big jumps in both directions must resolve to the same camera/HUD packet,
      // without requiring intermediate animation frames or a second timeline.
      for (const name of ['narrative','wide','opening','wide','narrative','opening']) {
        const prior=report.states.find(state=>state.name===name);
        await seek(prior.u); const current=await inspect();
        for (const layer of ['opening','manifesto','narrative']) {
          assert.equal(current[layer].visibility,prior[layer].visibility);
          assert.ok(Math.abs(current[layer].opacity-prior[layer].opacity)<.001);
        }
        for (let i=0;i<3;i++) assert.ok(Math.abs(current.probe.camera[i]-prior.probe.camera[i])<1e-7,'reverse/fast seek restores the physical camera');
        report.reverse.push({name,u:prior.u,camera:current.probe.camera}); persist();
      }
      assert.deepEqual(report.errors,[],'no runtime or shader compilation errors');
      assert.deepEqual(report.restrictedRequests,[],'no restricted scene or portrait fetch');
      report.passed=true;
      console.log(`PASS ${width}x${height}: seven rendered milestones, six reverse/fast seeks, nonoverlapping settled chapters, header clearance, no overflow/runtime/restricted requests`);
    } finally { persist(); await context.close(); }
  }
} finally { await browser.close(); }
