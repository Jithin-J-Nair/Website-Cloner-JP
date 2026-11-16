#!/usr/bin/env node
/** Synthetic sensor and lifecycle tests; real device permission/sensor behavior still requires device testing. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const browser=await launchMotionBrowser(),base=process.env.BASE_URL||'http://127.0.0.1:3004';
fs.mkdirSync('temp/home-hero-tilt',{recursive:true});
try {
 for(const scenario of ['granted','denied','desktop','reduced']) {
  const desktop=scenario==='desktop',reduced=scenario==='reduced';
  const context=await browser.newContext({viewport:{width:desktop?1440:390,height:844},hasTouch:!desktop,isMobile:!desktop,reducedMotion:reduced?'reduce':'no-preference'});
  await context.addInitScript(({deny})=>{
   sessionStorage.setItem('lusion_booted_v1','1');
   Object.defineProperty(DeviceOrientationEvent,'requestPermission',{configurable:true,value:()=>Promise.resolve(deny?'denied':'granted')});
  },{deny:scenario==='denied'});
  const page=await context.newPage(); const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container')?.dataset.webglStatus==='ready',null,{timeout:120000});
  const button=page.getByRole('button',{name:'Enable device motion'});
  if(desktop||reduced){assert.equal(await button.count(),0);}
  else {
   await button.click();
   if(scenario==='denied'){
    await page.waitForFunction(()=>document.body.textContent.includes('Motion permission denied'));
    assert.equal(await page.getByText('MOTION BLOCKED').count(),1);
   } else {
    await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.physicsActive==='true',null,{timeout:60000});
    const emit=(beta,gamma)=>page.evaluate(({beta,gamma})=>window.dispatchEvent(new DeviceOrientationEvent('deviceorientation',{beta,gamma})),{beta,gamma});
    await emit(30,0);await emit(40,18);
    await page.waitForFunction(()=>Number(document.querySelector('#home-hero-visual-container').dataset.tiltX)>.25,null,{timeout:30000});
    const tilt=await page.locator('#home-hero-visual-container').evaluate(el=>({...el.dataset}));
    assert.ok(Number(tilt.tiltX)<=1&&Number(tilt.tiltY)>0&&Number(tilt.tiltY)<=1);
    assert.equal(await page.getByRole('button',{name:'Turn off device motion'}).getAttribute('aria-pressed'),'true');
    await page.screenshot({path:'temp/home-hero-tilt/mobile-tilt.png',timeout:120000});
    await page.getByRole('button',{name:'Turn off device motion'}).click();
    await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#home-hero-visual-container').dataset.tiltX))<.02,null,{timeout:30000});
    await emit(40,25);await page.waitForTimeout(300);
    assert.ok(Math.abs(Number(await page.locator('#home-hero-visual-container').getAttribute('data-tilt-x')))<.02);
    await page.getByRole('button',{name:'Enable device motion'}).click();
    await emit(30,0);await emit(40,18);
    await page.waitForFunction(()=>Number(document.querySelector('#home-hero-visual-container').dataset.tiltX)>.2,null,{timeout:30000});
    await page.evaluate(()=>{window.__lenis?.scrollTo(innerHeight*2,{immediate:true});window.scrollTo(0,innerHeight*2);});
    await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.activeRaf==='false');
    await page.evaluate(()=>{window.__lenis?.scrollTo(0,{immediate:true});window.scrollTo(0,0);});
    await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.activeRaf==='true');
    await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#home-hero-visual-container').dataset.tiltX))<.03,null,{timeout:30000});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.physicsActive==='false');
    assert.equal(await page.getByRole('button',{name:'Turn off device motion'}).count(),0);
   }
  }
  assert.deepEqual(errors,[]);console.log(`PASS ${scenario}: mobile-only permission, tilt, controls and lifecycle as applicable`);await context.close();
 }
}finally{await browser.close();}
