#!/usr/bin/env node
/** Isolated software-browser measurements, not physical GPU timing or certification. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const out='temp/about-audit/budget';fs.mkdirSync(out,{recursive:true});const browser=await launchMotionBrowser();
try{
 for(const width of [1440,390]){
  const height=width===390?844:900,context=await browser.newContext({viewport:{width,height}});await context.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');window.__enableAboutProbe=true;});const page=await context.newPage(),report={width,height,samples:[],errors:[],physicalGpuTiming:'NOT MEASURED'};page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  try{
   await page.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>!!window.__aboutProbe);report.device=await page.evaluate(()=>{const gl=document.querySelector('#about-who canvas').getContext('webgl2'),debug=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'unknown',timerQuerySupported:!!gl.getExtension('EXT_disjoint_timer_query_webgl2'),policy:'existing cinematic pixel budget; original About software/low/mobile tier=1800; high=4800'};});
   const seek=async y=>{await page.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo({top:y,behavior:'instant'});},y);await page.waitForTimeout(700);};
   for(const u of [0,1.6,5.35,7.2]){
    await seek((width<820?height:width)*u);const before=await page.evaluate(()=>({t:performance.now(),...window.__aboutProbe()}));await page.waitForTimeout(5000);const after=await page.evaluate(()=>({t:performance.now(),...window.__aboutProbe()}));
    const n=after.frames-before.frames,intervals=after.frameTimes.slice(-Math.min(n,180)).sort((a,b)=>a-b);report.samples.push({u,wallMs:after.t-before.t,submittedFrames:n,renderSubmissionsPerSecond:n*1000/(after.t-before.t),medianRafIntervalMs:intervals[Math.floor(intervals.length*.5)],p95RafIntervalMs:intervals[Math.floor(intervals.length*.95)],buffer:[after.width,after.height],count:after.count,draws:after.draws,triangles:after.triangles,memory:after.memory,webglError:await page.evaluate(()=>document.querySelector('#about-who canvas').getContext('webgl2').getError())});
   }
   await seek(0);await page.screenshot({path:`${out}/${width}-full-page.jpg`,type:'jpeg',quality:65,fullPage:true,timeout:120000});
   assert.deepEqual(report.errors,[]);for(const s of report.samples){assert.equal(s.webglError,0);assert.ok(s.count<=4800);assert.ok(s.submittedFrames>0);}
  }finally{fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await context.close();}
 }
 console.log('PASS bounded buffers/counts/draws and GL_NO_ERROR; frame cadence reported without interpreting CPU submission as GPU execution/FPS.');
}finally{await browser.close();}
