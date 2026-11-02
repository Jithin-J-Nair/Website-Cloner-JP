import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const out=process.env.CARD_BOUNDARY_OUT||'temp/reference-cards/boundaries';fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
try {
 for(const [width,height] of [[1920,1080],[1000,650],[1440,640]]) {
  const c=await browser.newContext({viewport:{width,height}});await c.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
  const p=await c.newPage(),report={width,height,errors:[]};p.on('pageerror',e=>report.errors.push(e.message));
  try {
   await p.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await p.waitForFunction(()=>!!document.querySelector('#about-capability').dataset.cardLayout);
   const cinematic=height>=650,section=p.locator('#about-capability');
   assert.equal(await section.getAttribute('data-card-layout'),cinematic?'cinematic':'reading');
   await section.evaluate((e,cinematic)=>{const y=e.getBoundingClientRect().top+scrollY+(cinematic?(e.offsetHeight-innerHeight)*.9:0);window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo({top:y,behavior:'instant'});},cinematic);await p.waitForTimeout(500);
   report.fronts=await section.locator('.about-card-front').evaluateAll(es=>es.map(e=>({width:e.clientWidth,height:e.clientHeight,overflow:e.scrollHeight>e.clientHeight+1})));
   assert.ok(report.fronts.every(r=>!r.overflow));assert.ok(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await p.screenshot({path:`${out}/${width}x${height}.jpg`,type:'jpeg',quality:75,timeout:120000});assert.deepEqual(report.errors,[]);
  } finally {fs.writeFileSync(`${out}/${width}x${height}.json`,JSON.stringify(report,null,2));await c.close();}
 }
 const c=await browser.newContext({viewport:{width:1440,height:900}});await c.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');window.__enableAboutProbe=true;});const p=await c.newPage(),report={checks:[]};
 try {
  await p.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await p.waitForFunction(()=>window.__aboutProbe?.().state==='ready');
  await p.locator('#about-capability').evaluate(e=>{const y=e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*.5;window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo({top:y,behavior:'instant'});});await p.waitForTimeout(500);
  report.before=await p.evaluate(()=>({y:scrollY,p:Number(document.querySelector('#about-capability').dataset.cardProgress),time:window.__aboutProbe().time}));
  await p.evaluate(()=>{window.__boundaryExt=document.querySelector('#about-who canvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.__boundaryExt.loseContext();});await p.waitForFunction(()=>document.querySelector('#about-who').dataset.sceneState==='lost');await p.waitForTimeout(600);
  report.lost=await p.locator('#about-capability').evaluate(e=>({p:Number(e.dataset.cardProgress),expected:Math.max(0,Math.min(1,-e.getBoundingClientRect().top/Math.max(1,e.offsetHeight-innerHeight)))}));
  assert.ok(Math.abs(report.lost.p-report.lost.expected)<.01,'cards must remeasure after an upstream context fallback changes document flow');
  await p.evaluate(()=>window.__boundaryExt.restoreContext());await p.waitForFunction(()=>window.__aboutProbe?.().state==='ready');await p.waitForTimeout(600);
  report.restored=await p.evaluate(()=>({y:scrollY,p:Number(document.querySelector('#about-capability').dataset.cardProgress),time:window.__aboutProbe().time,canvases:document.querySelectorAll('#about-who canvas').length}));
  assert.ok(Math.abs(report.restored.y-report.before.y)<2,'offscreen world recovery must restore the actual service-card scroll position, not its stale last rendered camera pose');
  assert.ok(Math.abs(report.restored.p-report.before.p)<.01);assert.ok(report.restored.time>=report.before.time);assert.equal(report.restored.canvases,1);
  report.checks.push('upstream loss reflow updates card progress; restoration preserves downstream scroll, card pose and world clock');
 } finally {fs.writeFileSync(`${out}/context-reflow.json`,JSON.stringify(report,null,2));await c.close();}
 console.log('PASS wide/threshold/short-screen card layout and downstream reflow/context restoration; no clipped service text or added GL context.');
} finally {await browser.close();}
