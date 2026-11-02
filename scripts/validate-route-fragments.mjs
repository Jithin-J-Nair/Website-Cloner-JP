#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const out='temp/side-by-side-repair/fragments';fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
try{for(const [width,motion]of [[1440,'no-preference'],[768,'no-preference'],[390,'no-preference'],[390,'reduce']]){
 const height=width===390?844:900;
 const c=await browser.newContext({viewport:{width,height},reducedMotion:motion,hasTouch:width===390,isMobile:width===390});
 const p=await c.newPage(),report={width,motion,errors:[],steps:[]};p.on('pageerror',e=>report.errors.push(e.message));
 try{
  await p.goto(`${base}/contact`,{waitUntil:'networkidle',timeout:120000});
  await p.locator('#preloader').waitFor({state:'detached',timeout:60000});
  await p.waitForFunction(()=>{const r=document.getElementById('footer-section')?.getBoundingClientRect();return r&&r.top<innerHeight*.2&&r.bottom>100&&scrollY>innerHeight},null,{timeout:30000});
  report.steps.push(await p.evaluate(()=>({name:'direct-contact',url:location.href,y:scrollY,footerTop:document.getElementById('footer-section').getBoundingClientRect().top,runs:window.__goalAstronautTelemetry?.playback.runs})));
  assert.equal(report.steps.at(-1).runs,0,'direct Contact must not launch the cinematic');
  await p.screenshot({path:`${out}/${width}-${motion}-direct.jpg`,type:'jpeg',quality:80,timeout:120000});
  // Ordinary route entry must still reset to the top.
  await p.goto(`${base}/projects`,{waitUntil:'networkidle',timeout:120000});
  await p.waitForFunction(()=>scrollY<1);
  await p.locator('#header-right-menu-btn').click();
  await p.locator('button[data-scroll-to="contact"]').click();
  await p.waitForFunction(()=>{const r=document.getElementById('end-section').getBoundingClientRect();return scrollY>innerHeight&&r.top<innerHeight&&r.bottom>0},null,{timeout:30000});
  report.steps.push(await p.evaluate(()=>({name:'menu-contact',y:scrollY,sectionTop:document.getElementById('end-section').getBoundingClientRect().top})));
  // Use a real in-site TransitionLink, not a test-injected router call.
  await p.locator('#header-logo').click();
  await p.waitForURL(base+'/');await p.waitForFunction(()=>scrollY<1);
  report.steps.push({name:'logo-navigation-top',passed:true});
  assert.deepEqual(report.errors,[]);console.log(`PASS route fragments ${width} ${motion}: direct footer, no autoplay, menu Contact, logo/top`);
 }finally{fs.writeFileSync(`${out}/${width}-${motion}.json`,JSON.stringify(report,null,2));await c.close()}
}}finally{await browser.close()}
