#!/usr/bin/env node
/** Actual rendered content for the two formerly omitted captured gallery panels. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
import {loadCurrentLiveGroundTruth} from './lib/load-ground-truth.mjs';
const manifest=loadCurrentLiveGroundTruth();
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const out=process.env.OUTPUT_DIR||'temp/site-fidelity-audit/gallery-text';fs.mkdirSync(out,{recursive:true});
const report={scope:'Captured text/order/em sizing and visible browser render, not matched-source typography/spacing acceptance.',states:[],errors:[]};
try{
 for(const project of manifest.projectDetails.filter(p=>p.media.some(m=>m.type==='text'))){
  for(const [width,height]of [[1440,900],[390,844]]){
   const browser=await launchMotionBrowser();
   try{
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'reduce',deviceScaleFactor:1});
    await context.addInitScript(()=>{if(location.protocol==='http:')sessionStorage.setItem('lusion_booted_v1','1')});
    const page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.message));
    await page.goto(base+project.route,{waitUntil:'domcontentloaded'});await page.locator('#preloader').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);
    const expected=project.media.find(m=>m.type==='text');const panel=page.locator(`[data-project-media-type="text"][data-project-media-index="${expected.index}"]`);
    await panel.evaluate(el=>{const p=el.closest('.case-panel');const y=innerWidth>812?p.offsetLeft-innerWidth*.1:el.getBoundingClientRect().top+scrollY;if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true});else scrollTo(0,y);dispatchEvent(new Event('scroll'));});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    assert.equal((await panel.innerText()).trim(),expected.text);assert.equal(await panel.locator('img,video,button').count(),0);assert.equal(await panel.isVisible(),true);
    const style=await panel.evaluate(el=>({font:parseFloat(getComputedStyle(el.querySelector('p')).fontSize),parentFont:parseFloat(getComputedStyle(el).fontSize),width:el.getBoundingClientRect().width}));assert.ok(Math.abs(style.font/style.parentFont-expected.fontSizeEm)<.01);
    const cdp=await context.newCDPSession(page);const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:78,fromSurface:true,captureBeyondViewport:false});const file=`${project.id}--${width}x${height}.jpg`;fs.writeFileSync(path.join(out,file),Buffer.from(shot.data,'base64'));
    report.states.push({route:project.route,viewport:{width,height},text:expected.text,style,screenshot:file});console.log(`PASS visible captured gallery text: ${project.id} ${width}x${height}`);
   }finally{await browser.close()}
  }
 }
 assert.equal(report.states.length,4);assert.deepEqual(report.errors,[]);report.passed=true;
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n')}
