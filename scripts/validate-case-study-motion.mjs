#!/usr/bin/env node
/** Native layout and real lifecycle gates, not an exact-pixel certificate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
import { loadCurrentLiveGroundTruth } from './lib/load-ground-truth.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003', out='temp/site-fidelity-audit/case-studies';fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser(), manifest=loadCurrentLiveGroundTruth(), report={matrix:[],lifecycle:[],errors:[]};
const seek=async(page,y)=>{await page.evaluate(y=>{if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true});else scrollTo(0,y);dispatchEvent(new Event('scroll'));},y);await page.waitForTimeout(180);};
const boot=async(context,path)=>{await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));const p=await context.newPage();p.setDefaultTimeout(60000);p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE|GLSL|Shader Error/i.test(m.text()))report.errors.push(m.text());});await p.goto(base+path,{waitUntil:'networkidle',timeout:120000});await p.waitForFunction(()=>document.querySelector('main')?.dataset.caseReady==='true');return p;};
try {
 for(const width of [1440,390]) {
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},hasTouch:width===390,reducedMotion:'reduce'});
  for(const project of manifest.projectDetails) {
   const p=await boot(context,project.route);
   const opening=await p.locator('main').evaluate(el=>{const first=el.querySelector('.case-panel').getBoundingClientRect(),root=getComputedStyle(el),title=getComputedStyle(el.querySelector('h1'));return{axis:el.dataset.caseAxis,first:first.toJSON(),font:parseFloat(root.fontSize),title:parseFloat(title.fontSize),maximum:Number(el.dataset.caseMaximum),overflow:document.documentElement.scrollWidth>innerWidth+1,count:el.querySelectorAll('.case-panel').length,extraEnds:el.querySelectorAll('#end-section,#footer-section').length};});
   assert.equal(opening.axis,width>812?'horizontal':'vertical');assert.equal(opening.count,project.media.length);assert.equal(opening.extraEnds,0);assert.equal(opening.overflow,false);assert.ok(Math.abs(opening.title/opening.font-4.5)<.001);
   if(width>812)assert.ok(Math.abs(opening.first.left-opening.font*48)<1);
   else assert.ok(Math.abs(opening.first.left-15)<1);
   const item=await p.locator('.case-panel').nth(Math.min(1,project.media.length-1)).evaluate(el=>innerWidth>812?el.offsetLeft-innerWidth*.1:el.getBoundingClientRect().top+scrollY-100);await seek(p,item);
   const moved=await p.locator('.case-panel').nth(Math.min(1,project.media.length-1)).boundingBox();assert.ok(moved.x<width&&moved.x+moved.width>0&&moved.y< (width===390?844:900)&&moved.y+moved.height>0);
   await p.screenshot({path:`${out}/${width}-${project.id}-gallery.jpg`,quality:72});
   await seek(p,width>812?opening.maximum:999999);
   const preview=await p.locator('#project-next').boundingBox();if(width>812)assert.ok(Math.abs(preview.x-width*.75)<2,`native quarter-viewport overscroll: ${project.id} got ${preview.x}`);else assert.ok(preview.y<844&&preview.y>0);
   const next=p.locator('#project-next a');assert.equal(await next.getAttribute('href'),project.nextProject.href);report.matrix.push({route:project.route,width,opening,preview});await p.close();
  }await context.close();
 }
 const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'}), p=await boot(context,'/projects/of_the_oak');
 await p.waitForFunction(()=>document.querySelector('.case-panel').dataset.casePixels==='ready'&&document.querySelector('#case-gallery-canvas').dataset.plant==='ready');
 const shadow=await p.locator('#case-gallery-canvas').evaluate(e=>({pipeline:e.dataset.shadowPipeline,noise:e.dataset.shadowNoise,gl:e.getContext('webgl2').getError()}));
 assert.equal(shadow.pipeline,'native-rgb-projected');assert.equal(shadow.noise,'ready');assert.equal(shadow.gl,0);report.shadow=shadow;
 await p.waitForTimeout(800);await p.screenshot({path:out+'/normal-opening.jpg',quality:85});
 const frames=()=>p.locator('main').getAttribute('data-case-frames');
 const start=Number(await frames());await p.waitForFunction(n=>Number(document.querySelector('main').dataset.caseFrames)>n,start);assert.ok(Number(await frames())>start,'normal clock advances');
 await p.getByRole('button',{name:'Open navigation menu',exact:true}).click();await p.waitForTimeout(200);const paused=await frames();await p.waitForTimeout(300);assert.equal(await frames(),paused,'menu pauses case clock');assert.equal(await p.locator('main video').first().evaluate(v=>v.paused),true);await p.keyboard.press('Escape');await p.waitForFunction(n=>Number(document.querySelector('main').dataset.caseFrames)>n,Number(paused));assert.ok(Number(await frames())>Number(paused),'menu close resumes');report.lifecycle.push('menu pauses/resumes clock and preview');
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForFunction(()=>document.querySelector('main video').paused);await p.waitForLoadState('networkidle');await p.waitForTimeout(800);const staticFrame=await frames();await p.waitForTimeout(300);assert.equal(await frames(),staticFrame);assert.equal(await p.locator('main video').first().evaluate(v=>v.paused),true);report.lifecycle.push('live reduced motion stops idle clock and video');
 await p.emulateMedia({reducedMotion:'no-preference'});await p.waitForFunction(()=>document.querySelector('main').dataset.caseGraphics==='ready'&&!document.querySelector('main video').paused);
 await p.evaluate(()=>document.querySelector('#case-gallery-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());await p.waitForFunction(()=>document.querySelector('main').dataset.caseGraphics==='fallback');assert.equal(await p.locator('[data-case-pixels="ready"]').count(),0);assert.equal(await p.locator('main video').first().evaluate(v=>getComputedStyle(v).opacity),'1');report.lifecycle.push('context loss restores semantic DOM media');await context.close();
 const fallback=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'}), f=await boot(fallback,'/projects/oryzo_ai?forceWebglFallback=1');assert.equal(await f.locator('main').getAttribute('data-case-graphics'),'fallback');assert.equal(await f.locator('[data-case-pixels="ready"]').count(),0);await seek(f,1500);await f.screenshot({path:out+'/webgl-fallback.jpg',quality:80});await fallback.close();report.lifecycle.push('forced WebGL fallback preserves horizontal HTML gallery');
 assert.deepEqual(report.errors,[]);report.passed=true;console.log(`PASS ${report.matrix.length} case-study route/viewport layouts, native end position, source media/next chain and ${report.lifecycle.length} lifecycle gates. Not visual-parity certification.`);
}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close();}
