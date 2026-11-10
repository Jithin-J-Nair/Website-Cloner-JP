#!/usr/bin/env node
/** Capture actual served routes. This is an observation inventory, not a parity assertion. */
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
import {loadCurrentLiveGroundTruth} from './lib/load-ground-truth.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003',phase=process.env.AUDIT_PHASE||'before';
const out=`temp/site-fidelity-audit/${phase}`;fs.mkdirSync(out,{recursive:true});
const manifest=loadCurrentLiveGroundTruth(),report=[];
const widths=(process.env.AUDIT_WIDTHS||"1440,390").split(",").map(Number);
for(const width of widths) {
 const browser=await launchMotionBrowser();
 try {
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
  await context.addInitScript(()=>{try{sessionStorage.setItem('lusion_booted_v1','1')}catch{}});
  const page=await context.newPage();
  for(const route of ['/', '/about','/projects',...manifest.projectDetails.map(p=>p.route)]) {
   const row={route,width,errors:[],shots:[]};report.push(row);
   const error=e=>row.errors.push(e.message);page.on('pageerror',error);
   await page.goto(base+route,{waitUntil:'networkidle',timeout:120000});await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(200);
   const stem=route==='/'?'home':route.slice(1).replaceAll('/','-');
   const shot=async name=>{const file=`${width}-${stem}-${name}.jpg`;await page.screenshot({path:path.join(out,file),quality:80,timeout:120000});row.shots.push(file);};
   await shot('opening');
   row.layout=await page.locator('main').first().evaluate(e=>({height:e.offsetHeight,viewport:[innerWidth,innerHeight],overflow:document.documentElement.scrollWidth>innerWidth+1,headings:[...e.querySelectorAll('h1,h2')].map(h=>h.textContent?.trim()),media:e.querySelectorAll('img,video').length,cta:e.querySelectorAll('#end-section').length,canvas:e.querySelectorAll('canvas').length}));
   const selectors=route==='/'?['#home-reel','#home-featured','#home-goal']:route==='/about'?['#about-award','#about-capability']:route==='/projects'?['#projects-list']:['[data-project-gallery]'];
   for(const selector of selectors){const el=page.locator(selector).first();if(await el.count()){await el.evaluate(e=>{scrollTo(0,e.getBoundingClientRect().top+scrollY);window.dispatchEvent(new Event('scroll'));});await page.waitForTimeout(250);await shot(selector.replaceAll(/[^a-zA-Z-]/g,''));}}
   page.off('pageerror',error);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  }
  await context.close();
 } finally {await browser.close();}
}
console.log(`Captured ${report.length} route/viewport observations into ${out}; ${report.reduce((n,r)=>n+r.errors.length,0)} uncaught errors. Not a source-pixel parity result.`);
