#!/usr/bin/env node
/** Optional nonblocking per-draw timer samples. NOT whole-frame GPU time or physical FPS. */
import fs from 'node:fs';import assert from 'node:assert/strict';import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const out='temp/about-audit/budget';fs.mkdirSync(out,{recursive:true});const browser=await launchMotionBrowser();
try{
 const context=await browser.newContext({viewport:{width:1440,height:900}});
 await context.addInitScript(()=>{
  sessionStorage.setItem('lusion_booted_v1','1');window.__gpuArmed=false;window.__gpuDrawResults=[];window.__gpuDisjoints=0;const states=[];
  const poll=state=>{
   const {gl,ext,pending}=state;if(gl.isContextLost())return;
   if(gl.getParameter(ext.GPU_DISJOINT_EXT)){window.__gpuDisjoints++;for(const p of pending)gl.deleteQuery(p.query);pending.length=0;return;}
   for(let i=pending.length-1;i>=0;i--){const p=pending[i];if(!gl.getQueryParameter(p.query,gl.QUERY_RESULT_AVAILABLE))continue;const ns=gl.getQueryParameter(p.query,gl.QUERY_RESULT);window.__gpuDrawResults.push({method:p.method,arguments:p.args,ms:ns/1e6,resultLatencyMs:performance.now()-p.submittedAt});gl.deleteQuery(p.query);pending.splice(i,1);}
  };
  window.__pollAboutGpu=()=>states.forEach(poll);
  for(const method of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
   const original=WebGL2RenderingContext.prototype[method];WebGL2RenderingContext.prototype[method]=function(...args){
    if(!window.__gpuArmed||!this.canvas.closest('#about-who'))return Reflect.apply(original,this,args);
    let state=states.find(s=>s.gl===this);if(!state){const ext=this.getExtension('EXT_disjoint_timer_query_webgl2');if(!ext)return Reflect.apply(original,this,args);state={gl:this,ext,pending:[]};states.push(state);}
    poll(state);const {ext,pending}=state;
    // No wait, gl.finish, synchronous unavailable result read, or nested query.
    if(pending.length>=32||this.getQuery(ext.TIME_ELAPSED_EXT,this.CURRENT_QUERY))return Reflect.apply(original,this,args);
    const query=this.createQuery();this.beginQuery(ext.TIME_ELAPSED_EXT,query);
    try{return Reflect.apply(original,this,args);}finally{this.endQuery(ext.TIME_ELAPSED_EXT);pending.push({query,method,args,submittedAt:performance.now()});}
   };
  }
 });
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
 await page.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await page.evaluate(()=>{window.__lenis?.scrollTo(1440*1.6,{immediate:true});window.scrollTo(0,1440*1.6);});await page.waitForTimeout(700);await page.evaluate(()=>window.__gpuArmed=true);await page.waitForTimeout(6000);await page.evaluate(()=>{window.__gpuArmed=false;window.__pollAboutGpu();});await page.waitForTimeout(250);
 const report=await page.evaluate(()=>{window.__pollAboutGpu();const gl=document.querySelector('#about-who canvas').getContext('webgl2'),debug=gl.getExtension('WEBGL_debug_renderer_info');return {viewport:[innerWidth,innerHeight],u:1.6,renderer:debug?gl.getParameter(debug.UNMASKED_RENDERER_WEBGL):'unknown',supported:!!gl.getExtension('EXT_disjoint_timer_query_webgl2'),disjoints:window.__gpuDisjoints,webglError:gl.getError(),samples:window.__gpuDrawResults,note:'Instrumented asynchronous TIME_ELAPSED_EXT per draw only. Excludes clears, transfers, composition and unsampled draws; cannot be called whole-frame GPU time, physical GPU certification, display FPS or untimed frame cadence.'};});report.errors=errors;
 const sorted=report.samples.map(s=>s.ms).sort((a,b)=>a-b);report.summary={samples:sorted.length,medianDrawMs:sorted[Math.floor(sorted.length*.5)]??null,p95DrawMs:sorted[Math.floor(sorted.length*.95)]??null,totalSampledDrawMs:sorted.reduce((a,b)=>a+b,0)};fs.writeFileSync(`${out}/gpu-draws.json`,JSON.stringify(report,null,2));assert.deepEqual(errors,[]);assert.equal(report.webglError,0);if(report.supported)assert.ok(sorted.length>0,'available timer extension must produce actual completed samples');console.log(JSON.stringify(report.summary));await context.close();
}finally{await browser.close();}
