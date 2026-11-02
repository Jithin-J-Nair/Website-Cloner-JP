#!/usr/bin/env node
// Static state inspection is deliberately separate from autonomous playback tests.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const out=process.env.SITE_REPAIR_OUT||'temp/side-by-side-repair/before';
const widths=(process.env.SITE_WIDTHS||'1440,768,390').split(',').map(Number);
fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
try { for(const width of widths){
 const height=width===390?844:900;
 const context=await browser.newContext({viewport:{width,height},hasTouch:width===390,isMobile:width===390});
 const page=await context.newPage(), report={base,width,height,buildId:fs.readFileSync('.next/BUILD_ID','utf8').trim(),mode:'normal-motion; inspector static seeks, not recorded autonomous playback',errors:[],captures:[]};
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 const seek=async y=>{
  await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y,true),Math.round(y));
  await page.waitForTimeout(700);
 };
 const shot=async name=>{
  await page.screenshot({path:`${out}/${width}-${name}.jpg`,type:'jpeg',quality:78,timeout:120000});
  report.captures.push(await page.evaluate(name=>({name,scrollY,overflow:document.documentElement.scrollWidth>innerWidth,telemetry:window.__goalAstronautTelemetry}),name));
  console.log(`${width}: ${name}`);
 };
 try{
  await page.goto(base,{waitUntil:'networkidle',timeout:120000});
  await page.locator('#preloader').waitFor({state:'detached',timeout:60000});
  await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container')?.dataset.motionState==='settled'&&window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:90000});
  await shot('hero');
  const layout=await page.evaluate(()=>{
   const top=id=>{let y=0;for(let e=document.getElementById(id);e;e=e.offsetParent)y+=e.offsetTop;return y};
   return {reel:top('home-reel'),stage:top('home-reel-container'),featured:top('home-featured'),ranges:window.__lusionInspector.homeGoalSectionRanges.items,tablet:window.__goalAstronautTelemetry.scrollForEmergence(0)};
  });
  report.layout=layout;
  for(const [name,y] of [['reel-intro',layout.reel],['reel-stage',layout.stage-height*.12],['featured',layout.featured],['tablet',layout.tablet]]){await seek(y);await shot(name)}
  // Resolve against current measured ranges rather than old recording seconds.
  const r=layout.ranges;
  for(const [name,key,u] of [['title','blackTitle',.55],['dark','blackTunnel',.25],['pink','whiteTunnel',.12],['blue','whiteTunnel',.76],['shards','astronautDrop',.68],['contact','astronautWait',.42]]){
   assert.ok(r[key],`missing current section range ${key}`);
   await seek(r[key].pixelFrom+r[key].pixelCount*u);await shot(name);
  }
  await seek(await page.evaluate(()=>document.documentElement.scrollHeight-innerHeight));await shot('footer');
  await seek(0);await shot('reversed-hero');
  // Other local routes have no source visual captures: usability only, never parity.
  for(const route of ['projects','contact']){
   await page.goto(`${base}/${route}`,{waitUntil:'networkidle',timeout:120000});await page.waitForTimeout(700);if(route==='contact')await page.waitForFunction(()=>{const r=document.getElementById('footer-section').getBoundingClientRect();return scrollY>innerHeight&&r.top<innerHeight*.2&&r.bottom>100},null,{timeout:30000});await shot(`route-${route}`);
  }
  assert.deepEqual(report.errors,[]);
  assert.ok(report.captures.every(c=>!c.overflow),'no horizontal overflow');
 }finally{fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await context.close()}
}}finally{await browser.close()}
