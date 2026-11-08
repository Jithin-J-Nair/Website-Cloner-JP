#!/usr/bin/env node
/** Actual About CTA gestures and lifecycle. Chromium/SwiftShader only; no
 * physical phone/GPU performance or exact stochastic video-parity claim. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003';
const captures=process.env.CTA_CAPTURES;
if(captures)fs.mkdirSync(captures,{recursive:true});
const browser=await launchMotionBrowser();
try{
 for(const [width,height] of [[1720,912],[1568,1230],[390,844]]){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<820});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{
   window.__enableCtaProbe=true;window.__ctaClicks=[];window.__copiedEmails=[];
   Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__copiedEmails.push(text)}}});
   window.addEventListener('click',e=>{
    if(e.target instanceof Element&&e.target.closest('#end-section-title-link')){
     window.__ctaClicks.push({prevented:e.defaultPrevented,detail:e.detail});e.preventDefault();
    }
   });
  });
  await page.goto(`${base}/about#end-section`,{waitUntil:'domcontentloaded',timeout:120000});
  const section=await page.locator('#end-section').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,travel:e.offsetHeight-innerHeight}));
  await page.locator('#end-section').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY+innerHeight*.5));
  await page.waitForFunction(()=>window.__ctaProbe?.().frames>5,null,{timeout:120000});
  if(process.env.EXPECTED_BUILD_SHA)assert.equal(await page.locator('#about').getAttribute('data-build-commit'),process.env.EXPECTED_BUILD_SHA);
  const seek=async y=>{await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y),y);await page.waitForTimeout(500)};
  const probe=()=>page.evaluate(()=>window.__ctaProbe());
  const snap=async name=>{if(captures)await page.screenshot({path:path.join(captures,`${width}-${name}.jpg`),quality:90,timeout:120000})};
  await seek(section.top+section.travel*.5);await page.waitForTimeout(1200);
  let p=await probe();
  const columns=Math.ceil(20+60*Math.max(0,Math.min(1,(width-320)/2240)));
  assert.equal(p.count,Math.ceil(columns*Math.ceil(columns*height/width)/4)*4);
  assert.equal(p.draws,4);assert.ok(p.triangles<=p.count*8);assert.equal(p.drained,0);
  assert.equal(await page.locator('#end-section canvas').count(),1);
  await snap('idle');
  const target={x:width*.72,y:height*.29};
  if(width>=820){await page.mouse.move(target.x,target.y);await page.mouse.down();}
  else await page.locator('#end-section-outer').dispatchEvent('pointerdown',{pointerId:17,pointerType:'touch',isPrimary:true,button:0,clientX:target.x,clientY:target.y});
  await page.waitForFunction(()=>window.__ctaProbe().held&&window.__ctaProbe().drained>20);
  const pouring=await probe();assert.ok(Math.abs(pouring.emitter[0]-.72)<.01);assert.ok(Math.abs(pouring.emitter[1]-.71)<.01);
  await page.waitForTimeout(500);await snap('held-right');
  if(width>=820)await page.mouse.move(width*.29,height*.32,{steps:15});
  else await page.locator('#end-section-outer').dispatchEvent('pointermove',{pointerId:17,pointerType:'touch',buttons:1,clientX:width*.29,clientY:height*.32});
  await page.waitForTimeout(650);p=await probe();assert.ok(Math.abs(p.emitter[0]-.29)<.01);assert.ok(p.drained>pouring.drained&&p.emitted>pouring.emitted);
  await snap('held-left');
  if(width>=820)await page.mouse.up();
  else await page.locator('#end-section-outer').dispatchEvent('pointerup',{pointerId:17,pointerType:'touch',button:0});
  await page.waitForTimeout(150);p=await probe();assert.equal(p.held,false);const stopped=p.drained;
  await page.waitForTimeout(600);assert.equal((await probe()).drained,stopped,'release stops flushing');
  await snap('released');
  // A held gesture ON the link must not launch mail or copy, while a genuine
  // quick click and keyboard activation must retain those actions.
  if(width>=820){
   const box=await page.locator('#end-section-title-link').boundingBox();
   await page.mouse.move(box.x+box.width*.25,box.y+box.height*.2);await page.mouse.down();await page.waitForTimeout(300);await page.mouse.up();
   assert.equal(await page.evaluate(()=>window.__ctaClicks.at(-1)?.prevented),true);
   assert.equal(await page.evaluate(()=>window.__copiedEmails.length),0);
   await page.locator('#end-section-title-link').click({position:{x:20,y:20}});
   assert.equal(await page.evaluate(()=>window.__ctaClicks.at(-1).prevented),false);
   assert.equal(await page.evaluate(()=>window.__copiedEmails.at(-1)),'business@lusion.co');
  }
  await page.keyboard.press('Tab');await page.locator('#end-section-title-link').focus();
  await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>window.__ctaClicks.at(-1).prevented),false);
  assert.equal(await page.evaluate(()=>window.__copiedEmails.at(-1)),'business@lusion.co');
  for(const underline of await page.locator('[data-cta-decoration]').all())assert.ok(await underline.evaluate(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m11>.99));
  assert.equal(await page.locator('[data-cta-word]').count(),3);
  assert.equal(await page.locator('.end-section-content-cross').count(),5);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
  // Cancellation on blur, overlays, backgrounding and pointercancel is as
  // important as pointerup: never leave a hidden emitter running.
  await page.locator('#end-section-outer').dispatchEvent('pointerdown',{pointerId:18,pointerType:'mouse',button:0,clientX:width*.15,clientY:height*.25});
  await page.locator('#end-section-outer').dispatchEvent('pointercancel',{pointerId:18});assert.equal((await probe()).held,false);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
  const hidden=(await probe()).frames;await page.waitForTimeout(200);assert.equal((await probe()).frames,hidden);assert.equal((await probe()).pending,false);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await page.waitForFunction(n=>window.__ctaProbe().frames>n,hidden);
  await page.locator('#header-right-menu-btn').click();await page.waitForTimeout(200);const menu=(await probe()).frames;
  await page.waitForTimeout(200);assert.equal((await probe()).frames,menu);await page.keyboard.press('Escape');
  await page.waitForFunction(n=>window.__ctaProbe().frames>n,menu);
  await page.evaluate(()=>{const gl=document.querySelector('#end-section canvas').getContext('webgl2');window.__ctaLoss=gl.getExtension('WEBGL_lose_context');window.__ctaLoss.loseContext()});
  await page.waitForFunction(()=>window.__ctaProbe().state==='lost');await page.waitForTimeout(200);
  await page.evaluate(()=>window.__ctaLoss.restoreContext());await page.waitForFunction(()=>window.__ctaProbe().state==='ready'&&window.__ctaProbe().pending);
  assert.equal(await page.locator('#end-section canvas').count(),1);
  assert.equal(await page.locator('#end-section canvas').evaluate(c=>c.getContext('webgl2').getError()),0);
  await seek(section.top-height*2);const offscreen=(await probe()).frames;await page.waitForTimeout(200);assert.equal((await probe()).frames,offscreen);
  await seek(section.top+section.travel*.5);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>window.__ctaProbe?.().frames>0&&!window.__ctaProbe().pending);
  const still=(await probe()).frames;await page.waitForTimeout(250);assert.equal((await probe()).frames,still);assert.equal((await probe()).steps,0);
  await snap('reduced');
  assert.deepEqual(errors,[],'no browser/shader errors');
  console.log(`PASS CTA ${width}×${height}: four geometric families; held/moving pour and release; click/keyboard mailto+copy; native underlines/words/crosses; pointer cancellation; visibility/menu/offscreen sleep; context recovery; reduced motion; no overflow.`);
  await page.close();
 }
}finally{await browser.close()}
