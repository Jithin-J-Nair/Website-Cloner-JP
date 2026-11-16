#!/usr/bin/env node
/** Real source-derived About card/ribbon behaviour; software browser only. */
import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import sharp from'sharp';import{launchMotionBrowser}from'./lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003',out=path.resolve('temp/motion-fidelity-round3/expertise');fs.mkdirSync(out,{recursive:true});
const b=await launchMotionBrowser(),report={states:[],errors:[],failedAssets:[]};
const wait=(p,fn,arg)=>p.waitForFunction(fn,arg,{timeout:90000});
const state=p=>p.locator('#about-capability').evaluate(e=>({root:{...e.dataset},canvas:{...e.querySelector('canvas').dataset},flips:[...e.querySelectorAll('.about-card-slot')].map(el=>Number(el.dataset.nativeFlip)),transforms:[...e.querySelectorAll('.about-card-slot')].map(el=>el.style.transform),overflow:document.documentElement.scrollWidth>innerWidth+1}));
const seek=async(p,sr)=>{await p.locator('#about-capability').evaluate((e,sr)=>{const y=e.getBoundingClientRect().top+scrollY+(sr+1)/2*(e.offsetHeight+innerHeight)-innerHeight;window.__lenis?.scrollTo(y,{immediate:true});scrollTo(0,y);},sr);await wait(p,sr=>Math.abs(Number(document.querySelector('#about-capability').dataset.cardRange)-sr)<.002,sr);};
const frozen=async p=>{const before=await state(p);await p.waitForTimeout(400);const after=await state(p);assert.equal(after.root.expertiseFrames,before.root.expertiseFrames);assert.equal(after.root.expertiseTime,before.root.expertiseTime);return after;};
async function boot(width,height,reduced='no-preference',failure=false){const c=await b.newContext({viewport:{width,height},hasTouch:width<=812,isMobile:width<=812,reducedMotion:reduced});await c.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));if(failure)await c.route('**/assets/models/lines/line_*.buf',r=>r.abort());const p=await c.newPage();p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE|GLSL|Shader Error/i.test(m.text()))report.errors.push(m.text());});if(!failure)p.on('response',r=>{if(r.url().includes('/assets/')&&!r.ok())report.failedAssets.push(r.url());});await p.goto(base+'/about',{waitUntil:'networkidle',timeout:120000});return{c,p};}
try{
 for(const[width,height]of[[1440,764],[900,600]]){
  const{c,p}=await boot(width,height);await seek(p,-.65);
  await wait(p,()=>document.querySelector('#about-capability canvas').dataset.lineAssets==='2');
  await wait(p,()=>Number(document.querySelector('#about-capability').dataset.expertiseTitleTime)>2.5);
  assert.equal((await state(p)).root.cardLayout,'native');await p.screenshot({path:`${out}/${width}-heading.jpg`,quality:85,timeout:120000});
  await seek(p,-.11);const turning=await state(p);assert.ok(turning.flips[0]<31&&turning.flips[1]<61&&Math.abs(turning.flips[2]-90)<3&&turning.flips[3]>110);assert.equal(turning.overflow,false);
  await p.screenshot({path:`${out}/${width}-turn.jpg`,quality:90,timeout:120000});
  await wait(p,n=>Number(document.querySelector('#about-capability').dataset.expertiseFrames)>n+5,Number(turning.root.expertiseFrames));assert.notDeepEqual((await state(p)).transforms,turning.transforms,'idle bob remains live at a fixed scroll coordinate');
  // Freeze only this visibility guard to isolate actual rendered ribbon pixels
  // from the live bob. Restores the real document property immediately afterward.
  await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});await frozen(p);
  const withLine=await p.screenshot({timeout:120000});await p.locator('#about-capability canvas').evaluate(e=>e.style.visibility='hidden');const withoutLine=await p.screenshot({timeout:120000});
  const a=await sharp(withLine).removeAlpha().raw().toBuffer(),z=await sharp(withoutLine).removeAlpha().raw().toBuffer();let changed=0;for(let i=0;i<a.length;i++)if(Math.abs(a[i]-z[i])>8)changed++;assert.ok(changed>1000,'loaded ribbons must actually contribute visible pixels');
  await p.locator('#about-capability canvas').evaluate(e=>e.style.visibility='');await p.evaluate(()=>{Reflect.deleteProperty(document,'hidden');document.dispatchEvent(new Event('visibilitychange'));});
  await seek(p,.35);assert.ok((await state(p)).flips.every(f=>f===0));await p.screenshot({path:`${out}/${width}-fronts.jpg`,quality:85,timeout:120000});
  await p.getByRole('button',{name:'Open navigation menu'}).click();await wait(p,()=>document.querySelector('#about-capability').dataset.expertiseRunning==='false');await frozen(p);await p.keyboard.press('Escape');await wait(p,()=>document.querySelector('#about-capability').dataset.expertiseRunning==='true');
  await seek(p,-.11);const reversed=await state(p);assert.ok(reversed.flips.every((v,i)=>Math.abs(v-turning.flips[i])<3),'scroll reversal recovers native turns');
  await seek(p,-.65);await p.getByRole('button',{name:'Focus Tech',exact:true}).click();await wait(p,()=>document.activeElement?.id==='expertise-2'&&[...document.querySelectorAll('#about-capability .about-card-slot')].every(e=>Number(e.dataset.nativeFlip)===0));
  await p.emulateMedia({reducedMotion:'reduce'});await wait(p,()=>document.querySelector('#about-capability').dataset.cardLayout==='reading');await frozen(p);assert.ok((await state(p)).flips.every(v=>v===0));
  await p.emulateMedia({reducedMotion:'no-preference'});await seek(p,-.11);await wait(p,()=>document.querySelector('#about-capability').dataset.expertiseLines==='settled');
  await p.locator('#about-capability canvas').evaluate(e=>{window.__expertiseLoss=e.getContext('webgl2').getExtension('WEBGL_lose_context');window.__expertiseLoss.loseContext();});await wait(p,()=>document.querySelector('#about-capability').dataset.expertiseLines==='fallback');
  assert.equal(await p.locator('#about-capability [role="button"]').count(),4);await p.evaluate(()=>window.__expertiseLoss.restoreContext());await wait(p,()=>document.querySelector('#about-capability').dataset.expertiseLines==='settled');assert.equal(await p.locator('#about-capability canvas').evaluate(e=>e.getContext('webgl2').getError()),0);
  await p.evaluate(()=>{window.__lenis?.scrollTo(0,{immediate:true});scrollTo(0,0);});await wait(p,()=>document.querySelector('#about-capability').dataset.expertiseRunning==='false');await frozen(p);
  await p.goto(base+'/projects',{waitUntil:'domcontentloaded',timeout:120000});assert.equal(await p.locator('#about-expertise-lines-canvas').count(),0);
  report.states.push({width,height,turning,reversed,visibleRibbonComponents:changed,menuPause:true,injectedVisibilityGuard:true,reducedResume:true,contextRecovery:true,keyboardFocus:true,offscreenPause:true,routeCleanup:true});await c.close();
 }
 const{c,p}=await boot(390,844);await p.locator('#about-capability').evaluate(e=>{const y=e.getBoundingClientRect().top+scrollY;scrollTo(0,y);});await wait(p,()=>document.querySelector('#about-capability').dataset.cardLayout==='reading');
 for(let i=0;i<4;i++){await p.locator('.about-card-slot').nth(i).evaluate(e=>{const y=e.getBoundingClientRect().top+scrollY-innerHeight*.15;scrollTo(0,y);});await wait(p,i=>Number(document.querySelectorAll('.about-card-slot')[i].dataset.nativeFlip)===0,i);assert.ok(await p.locator(`#expertise-${i}`).isVisible());}
 assert.equal(await p.locator('#about-capability canvas').evaluate(e=>getComputedStyle(e).display),'none');assert.equal((await state(p)).overflow,false);await p.screenshot({path:`${out}/390-mobile.jpg`,quality:85,timeout:120000});await c.close();
 const failure=await boot(1440,764,'no-preference',true);await seek(failure.p,-.11);await wait(failure.p,()=>document.querySelector('#about-capability canvas').dataset.lineState==='settled');assert.equal((await state(failure.p)).canvas.optionalFailure,'true');assert.equal(await failure.p.locator('#about-capability [role="button"]').count(),4);await failure.c.close();
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failedAssets,[]);console.log('PASS About native expertise: 2 real ribbon buffers/visible pixels, native stagger/bob/reversal, 813px/short desktop layout, mobile turns, keyboard focus, reduced resume, menu/offscreen/visibility guards, context recovery, optional-line failure and cleanup.');
}finally{fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));await b.close();}
