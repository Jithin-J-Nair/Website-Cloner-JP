#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const report={scope:'Mobile three-across captured-reference geometry; reduced-motion content visibility; desktop loop continuity.',states:[]};
const out=process.env.ABOUT_CLIENT_LAYOUT_REPORT||'docs/lusion-parity-audit/data/implementation-01/client-layout-browser.json';
try{
 for(const width of [390,375,1440]){
  const browser=await launchMotionBrowser();
  try{
   const context=await browser.newContext({viewport:{width,height:width<820?844:900},reducedMotion:'no-preference'});
   await context.addInitScript(()=>{if(location.protocol==='http:')sessionStorage.setItem('lusion_booted_v1','1')});
   const page=await context.newPage();await page.goto('http://127.0.0.1:3000/about',{waitUntil:'domcontentloaded'});await page.locator('#preloader').waitFor({state:'hidden'});
   const measure=()=>page.locator('#about-clients').evaluate(el=>{
    const rows=[...el.querySelectorAll('.about-client-marquee')];
    return {width:innerWidth,tileWidth:el.querySelector('.about-client-logo-tile').getBoundingClientRect().width,headingFont:parseFloat(getComputedStyle(el.querySelector('h2')).fontSize),loopPairs:rows.map(row=>[...row.querySelectorAll('.about-client-marquee-set')].map(set=>set.getBoundingClientRect().width)),staticItemsWithinRows:rows.every(row=>{const bounds=row.getBoundingClientRect();return [...row.querySelector('.about-client-marquee-set').children].every(tile=>{const r=tile.getBoundingClientRect();return r.left>=bounds.left-.5&&r.right<=bounds.right+.5})}),duplicateDisplays:rows.map(row=>getComputedStyle(row.querySelector('[aria-hidden="true"]')).display),animation:rows.map(row=>getComputedStyle(row.querySelector('.about-client-marquee-track')).animationName)};
   });
   const normal=await measure();report.states.push({width,normal});
   if(width<820){assert.ok(Math.abs(normal.tileWidth-width/3)<1,`Mobile mark tile ${normal.tileWidth}px must be one third of ${width}px, not squeezed desktop columns`);assert.ok(Math.abs(normal.headingFont-width*.133)<.1);}
   for(const [a,b]of normal.loopPairs)assert.ok(Math.abs(a-b)<.1,'Normal duplicate set widths align at loop seam');
   await page.emulateMedia({reducedMotion:'reduce'});
   const reduced=await measure();report.states.at(-1).reduced=reduced;
   assert.ok(reduced.staticItemsWithinRows,'All static client marks stay within the visible row width');assert.ok(reduced.duplicateDisplays.every(d=>d==='none'));assert.ok(reduced.animation.every(a=>a==='none'));
   await page.emulateMedia({reducedMotion:'no-preference'});const restored=await measure();report.states.at(-1).restored=restored;if(width<820)assert.ok(Math.abs(restored.tileWidth-width/3)<1);for(const [a,b]of restored.loopPairs)assert.ok(Math.abs(a-b)<.1);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);console.log(`PASS client layout ${width}px, normal → reduced → normal`);
  }finally{await browser.close()}
 }
 report.passed=true;
}catch(e){report.error=e.message;process.exitCode=1;console.error(e)}finally{fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n')}
