#!/usr/bin/env node
/** Real shared footer controls: Home -> About -> Projects -> Home. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const out='temp/about-audit/portals';fs.mkdirSync(out,{recursive:true});const browser=await launchMotionBrowser();
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});await context.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');window.__enableAboutProbe=true;});const page=await context.newPage(),report={width,routes:[],errors:[]};page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  try{
   await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle',timeout:120000});
   for(const target of ['/about','/projects','/']){
    const y=await page.locator('#scroll-nav-section').evaluate(e=>e.getBoundingClientRect().top+scrollY);await page.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo({top:y,behavior:'instant'});},y);await page.waitForTimeout(300);
    const button=page.locator('#scroll-nav-text');report.routes.push({from:new URL(page.url()).pathname,label:(await button.textContent()).trim(),target});if(width===390)await button.tap();else await button.click();await page.waitForURL(`http://127.0.0.1:3000${target}`);
    if(target==='/about'){await page.waitForFunction(()=>window.__aboutProbe?.().frames>0);assert.equal(await page.locator('#about-who canvas').count(),1);await page.evaluate(()=>window.__portalOldContext=document.querySelector('#about-who canvas').getContext('webgl2'));}
    if(target==='/projects'){await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>typeof window.__aboutProbe),'undefined');assert.equal(await page.evaluate(()=>window.__portalOldContext.isContextLost()),true);report.aboutReleased=true;}
   }
   assert.deepEqual(report.errors,[]);
  }finally{fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await context.close();}
 }
 console.log('PASS actual footer Home -> About -> Projects -> Home controls, desktop click/mobile tap, About readiness and owned context/probe disposal.');
}finally{await browser.close();}
