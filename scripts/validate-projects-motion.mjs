#!/usr/bin/env node
/** Actual served Projects: depth pixels, nineteen links, atlas particles, gestures
 * and lifecycle. Chromium/SwiftShader evidence, not physical-device certification. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003';
const width=Number(process.env.PROJECTS_WIDTH||1720),height=width<813?844:912;
const reduced=process.env.PROJECTS_MOTION==='reduce';
const out=process.env.PROJECTS_CAPTURES||`temp/projects-reconstruction/integration-${width}-${reduced?'reduce':'normal'}`;
fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
const result={width,height,reduced,errors:[]};
try {
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<813,reducedMotion:reduced?'reduce':'no-preference'});
 page.on('pageerror',e=>result.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')result.errors.push(m.text())});
 await page.addInitScript(()=>{
  window.__enableCtaProbe=true;window.__projectsClicks=[];window.__copiedEmails=[];
  Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>window.__copiedEmails.push(text)}});
  window.addEventListener('click',e=>{if(e.target instanceof Element&&e.target.closest('#end-section-title-link')){window.__projectsClicks.push(e.defaultPrevented);e.preventDefault();}});
 });
 await page.goto(`${base}/projects`,{waitUntil:'networkidle',timeout:120000});
 const seek=async y=>{await page.evaluate(y=>{if(window.__lenis)window.__lenis.scrollTo(Math.max(0,y),{immediate:true,force:true});else scrollTo(0,Math.max(0,y));window.dispatchEvent(new Event('scroll'));},y);await page.waitForTimeout(250);};
 const box=selector=>page.locator(selector).first().evaluate(e=>{const r=e.getBoundingClientRect();return {top:r.top+scrollY,left:r.left,width:r.width,height:r.height};});
 const capture=async name=>{await page.screenshot({path:path.join(out,`${name}.png`),timeout:120000});};
 const pixels=async()=>sharp(await page.screenshot({timeout:120000})).extract({left:Math.round(width*.05),top:Math.round(height*.58),width:Math.round(width*.9),height:Math.round(height*.24)}).removeAlpha().raw().toBuffer();
 const difference=(a,b)=>{assert.equal(a.length,b.length);let changed=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-b[i])>4)changed++;return changed;};
 await page.waitForFunction(()=>document.querySelector('#projects').dataset.editorialWebgl==='ready');
 await page.waitForTimeout(reduced?200:2300);await seek(0);await capture('intro');
 assert.equal(await page.locator('#projects-title').getAttribute('aria-label'),'PROJECTS');
 assert.equal(await page.locator('.project-item').count(),19);
 result.cards=await page.locator('.project-item').evaluateAll(es=>es.map(e=>({href:e.getAttribute('href'),name:e.getAttribute('aria-label')})));
 assert.ok(result.cards.every(c=>c.href.startsWith('/projects/')&&c.name));
 const first=await box('#projects-list .project-item-main');await seek(first.top-120);
 await page.waitForFunction(()=>document.querySelector('.project-item-main').dataset.depthReady==='true');
 await page.waitForTimeout(reduced?100:2400);
 const coverage=await page.locator('.project-item').first().locator('.project-title-slot').evaluateAll(slots=>slots.map(slot=>{const r=slot.getBoundingClientRect();return [...slot.querySelectorAll('.project-title-strip>span')].reduce((sum,el)=>{const b=el.getBoundingClientRect();return sum+Math.max(0,Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top));},0)/r.height;}));
 assert.ok(coverage.every(v=>v>.98),'duplicate glyphs fill the title slots');result.glyphCoverage=coverage;
 if(!reduced&&width>812){
  const b=await page.locator('.project-item-main').first().boundingBox();
  const area={left:Math.round(b.x+b.width*.25),top:Math.round(b.y+b.height*.2),width:Math.round(b.width*.3),height:Math.round(b.height*.3)};
  const cardPixels=async()=>sharp(await page.screenshot({timeout:120000})).extract(area).removeAlpha().raw().toBuffer();
  await page.mouse.move(2,2);const before=await cardPixels();
  await page.mouse.move(b.x+b.width*.82,b.y+b.height*.32);
  await page.waitForFunction(()=>{const f=document.querySelector('.project-item-main').dataset.focus?.split(',').map(Number);return f&&Math.abs(f[0])>20&&f[2]>.9;},null,{timeout:60000});
  result.depthPixelChanges=difference(before,await cardPixels());assert.ok(result.depthPixelChanges>100);await capture('depth-hover');
  await page.mouse.move(2,2);
  await page.waitForFunction(()=>{const f=document.querySelector('.project-item-main').dataset.focus?.split(',').map(Number);return f&&Math.abs(f[0])<.2&&f[2]<.002;},null,{timeout:60000});
 }
 for(let i=0;i<19;i+=width>812?2:1){
  const target=await page.locator('.project-item-main').nth(i).evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await seek(target-120);
  await page.waitForFunction(i=>document.querySelectorAll('.project-item-main')[i].dataset.depthReady==='true',i,{timeout:60000});
  if(width>812&&i+1<19)await page.waitForFunction(i=>document.querySelectorAll('.project-item-main')[i+1].dataset.depthReady==='true',i);
 }
 await capture('last-row');
 const end=await box('#end-section');await seek(end.top+height*.5);
 await page.waitForFunction(()=>window.__projectsCtaProbe?.().state==='ready'&&document.querySelector('[data-cta-field-state]').dataset.ctaFieldState==='ready',null,{timeout:60000});
 assert.equal(await page.locator('#end-section').getAttribute('data-surface'),'ice');
 assert.equal(await page.locator('.about-cta-arm').count(),0);assert.equal(await page.locator('.end-section-content-cross').count(),5);
 const nativeCols=Math.ceil((20+60*Math.max(0,Math.min(1,(width-320)/2240)))*.4);
 const probe=()=>page.evaluate(()=>window.__projectsCtaProbe());
 if(!reduced)await page.waitForFunction(()=>window.__projectsCtaProbe().active===window.__projectsCtaProbe().count&&window.__projectsCtaProbe().steps>100,null,{timeout:120000});
 result.cta=await probe();assert.equal(result.cta.count,Math.ceil(nativeCols*Math.ceil(nativeCols*height/width)/4)*4);
 assert.equal(result.cta.draws,1);assert.equal(result.cta.triangles,result.cta.count*2);
 assert.equal(await page.locator('#end-section canvas').count(),1);
 await capture('cta-idle');
 const a=await pixels();await page.waitForTimeout(900);const b=await pixels();result.ctaPixelChanges=difference(a,b);
 if(reduced){assert.equal(result.ctaPixelChanges,0);assert.equal((await probe()).pending,false);}
 else {
  assert.ok(result.ctaPixelChanges>100,'real atlas fluid pixels advance');
  const x=width*.72,y=height*.28;
  if(width>812){await page.mouse.move(x,y);await page.mouse.down();}
  else await page.locator('#end-section-outer').dispatchEvent('pointerdown',{pointerId:17,pointerType:'touch',isPrimary:true,button:0,clientX:x,clientY:y});
  await page.waitForFunction(()=>window.__projectsCtaProbe().held&&window.__projectsCtaProbe().drained>10,null,{timeout:120000});
  const pouring=await probe();assert.ok(Math.abs(pouring.emitter[0]-.72)<.01);assert.ok(Math.abs(pouring.emitter[1]-.72)<.01);await capture('cta-held');
  if(width>812)await page.mouse.move(width*.3,height*.3,{steps:12});
  else await page.locator('#end-section-outer').dispatchEvent('pointermove',{pointerId:17,pointerType:'touch',buttons:1,clientX:width*.3,clientY:height*.3});
  await page.waitForFunction(()=>Math.abs(window.__projectsCtaProbe().emitter[0]-.3)<.01);
  if(width>812)await page.mouse.up();else await page.locator('#end-section-outer').dispatchEvent('pointerup',{pointerId:17,pointerType:'touch',button:0});
  const drained=(await probe()).drained;await page.waitForTimeout(600);assert.equal((await probe()).held,false);assert.equal((await probe()).drained,drained);
  // Held activation is suppressed; a genuine quick click still activates mail/copy.
  if(width>812){
   const target=await page.locator('#end-section-title-link').boundingBox();await page.mouse.move(target.x+20,target.y+20);await page.mouse.down();await page.waitForTimeout(250);await page.mouse.up();
   assert.equal(await page.evaluate(()=>window.__projectsClicks.at(-1)),true);
   await page.waitForTimeout(550);await page.locator('#end-section-title-link').click({position:{x:20,y:20}});
   assert.equal(await page.evaluate(()=>window.__projectsClicks.at(-1)),false);
  }
 }
 await page.locator('#end-section-title-link').focus();await page.keyboard.press('Enter');
 assert.equal(await page.evaluate(()=>window.__projectsClicks.at(-1)),false);assert.equal(await page.evaluate(()=>window.__copiedEmails.at(-1)),'business@lusion.co');
 await page.waitForTimeout(1200);assert.ok(await page.locator('[data-cta-decoration]').evaluateAll(es=>es.every(e=>new DOMMatrixReadOnly(getComputedStyle(e).transform).m11>.99)));
 // Cancellation, overlays and backgrounding cannot leave a hidden emitter alive.
 if(!reduced){
  await page.locator('#end-section-outer').dispatchEvent('pointerdown',{pointerId:18,pointerType:'mouse',button:0,clientX:width*.1,clientY:height*.25});
  await page.locator('#end-section-outer').dispatchEvent('pointercancel',{pointerId:18});assert.equal((await probe()).held,false);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
  const hidden=(await probe()).frames;await page.waitForTimeout(250);assert.equal((await probe()).frames,hidden);assert.equal((await probe()).pending,false);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
  await page.waitForFunction(n=>window.__projectsCtaProbe().frames>n,hidden);
  await page.locator('#header-right-menu-btn').click();await page.waitForTimeout(250);const menu=(await probe()).frames;
  await page.waitForTimeout(250);assert.equal((await probe()).frames,menu);await page.keyboard.press('Escape');
  await page.waitForFunction(n=>window.__projectsCtaProbe().frames>n,menu);
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.waitForFunction(()=>window.__projectsCtaProbe?.().frames>0&&!window.__projectsCtaProbe().pending);
  assert.equal(await page.locator('#end-section canvas').count(),1);assert.equal((await probe()).steps,0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  await page.waitForFunction(()=>window.__projectsCtaProbe?.().frames>1&&window.__projectsCtaProbe().pending);
  assert.equal(await page.locator('#end-section canvas').count(),1);
 }
 assert.equal(await page.locator('[data-projects-particles]').evaluate(e=>Number(getComputedStyle(e).zIndex)),0,'atlas stays under the DOM title as in the native canvas/UI stack');
 // Context loss must reveal the semantic/decorative fallback; restoration wakes one owner.
 await page.locator('#end-section canvas').evaluate(c=>{window.__projectsLost=c.getContext('webgl2').getExtension('WEBGL_lose_context');window.__projectsLost.loseContext();});
 await page.waitForFunction(()=>document.querySelector('[data-cta-field-state]').dataset.ctaFieldState!=='ready');
 await page.evaluate(()=>window.__projectsLost.restoreContext());
 await page.waitForFunction(()=>document.querySelector('[data-cta-field-state]').dataset.ctaFieldState==='ready',null,{timeout:60000});
 await seek(0);await page.waitForTimeout(400);const paused=(await probe()).frames;await page.waitForTimeout(500);assert.equal((await probe()).frames,paused,'CTA sleeps offscreen');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 // Real route transition: owners, canvas and probe are removed.
 await page.locator('#projects-list .project-item').first().click();await page.waitForURL('**/projects/oryzo_ai',{timeout:60000});
 await page.waitForFunction(()=>!document.getElementById('projects-depth-canvas')&&!window.__projectsCtaProbe);
 assert.deepEqual(result.errors,[]);result.lifecycle=true;
 fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));
 console.log(`PASS Projects ${width}×${height} ${reduced?'reduced':'normal'}: all 19 depth images/links, glyph coverage, real CTA atlas pixels, gestures/click/keyboard, context recovery, sleep and route disposal.`);
} finally {fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(result,null,2));await browser.close();}
