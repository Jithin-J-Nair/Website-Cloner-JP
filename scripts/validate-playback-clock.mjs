#!/usr/bin/env node
/** Verify active elapsed playback time, paused draw submission and policy controls. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser, startBrowserRecording, observeBrowserNetwork } from './lib/browser-runtime.mjs';


const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const width = Number(process.env.AUDIT_WIDTH || 1440);
const height = Number(process.env.AUDIT_HEIGHT || (width < 820 ? 844 : 900));

const out = path.resolve(`temp/mission/${process.env.AUDIT_TAG || 'clock-baseline'}-${width}-${process.env.AUDIT_REDUCED === '1' ? 'reduce' : 'normal'}`);
fs.mkdirSync(out, {recursive:true});
const browser = await launchMotionBrowser();


const context=await browser.newContext({viewport:{width,height}});
await context.addInitScript(()=>{
 sessionStorage.setItem('lusion_booted_v1','1');window.__goalDraws=0;
 for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
  const proto=WebGL2RenderingContext.prototype,original=proto[name];
  proto[name]=function(...args){if(this.canvas.closest?.('#home-goal'))window.__goalDraws++;return Reflect.apply(original,this,args)};
 }
});
const page=await context.newPage();const report={errors:[],issues:[]};
page.on('pageerror',e=>report.errors.push(e.message));
const network=process.env.AUDIT_RECORD==='1'?await observeBrowserNetwork(context,page):null;
try{
 await page.goto(baseUrl,{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:60000});
 const activation=await page.evaluate(()=>window.__goalAstronautTelemetry.playback.activation);
 const resetAt=await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForEmergence(0)-innerHeight*.3);
 const recording=process.env.AUDIT_RECORD==='1'?await startBrowserRecording(context,page,out):null;
 await page.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo(0,y)},resetAt);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='armed');
 if(recording)await page.evaluate(()=>{window.__recordedMotion=[];window.__recordedMotionTimer=setInterval(()=>{const t=window.__goalAstronautTelemetry;window.__recordedMotion.push({time:performance.timeOrigin+performance.now(),...t.playback,...t.sceneState})},100)});
 const started=Date.now();await page.evaluate(y=>window.scrollTo(0,y),activation+2);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
 await page.getByRole('button',{name:'Pause cinematic',exact:true}).click();
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='paused');
 await page.waitForTimeout(1000);
 const before=await page.evaluate(()=>({draws:window.__goalDraws,progress:window.__goalAstronautTelemetry.playback.progress}));
 await page.waitForTimeout(2500);
 const after=await page.evaluate(()=>({draws:window.__goalDraws,progress:window.__goalAstronautTelemetry.playback.progress}));
 report.pause={before,after};if(after.draws!==before.draws)report.issues.push('Paused cinematic continues submitting identical GPU draws');
 assert.equal(after.progress,before.progress);
 await page.getByRole('button',{name:'Resume cinematic',exact:true}).click();
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
 const stall=await page.evaluate(()=>{const before=window.__goalAstronautTelemetry.playback.progress;const start=performance.now();while(performance.now()-start<650){}return {before,blockedMs:performance.now()-start}});
 await page.waitForFunction(p=>window.__goalAstronautTelemetry.playback.progress>p,stall.before);
 stall.after=await page.evaluate(()=>window.__goalAstronautTelemetry.playback.progress);stall.advancedSeconds=(stall.after-stall.before)*22.5;
 report.stall=stall;if(stall.advancedSeconds<.60)report.issues.push('Visible frame stall is discarded by cinematic clock (slow motion)');
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='completed',null,{timeout:150000});
 report.completion={wallSeconds:(Date.now()-started)/1000,authoredSeconds:22.5,includesDeliberatePause:true,deliberateMainThreadStallMs:650,final:await page.evaluate(()=>window.__goalAstronautTelemetry.playback)};
 if(recording){report.recordedFrames=await recording.stop();report.motionSamples=await page.evaluate(()=>{clearInterval(window.__recordedMotionTimer);return window.__recordedMotion})}
 // Keep these policy assertions independent of the existing autonomous phase-density gate.
 // That unchanged gate is still run and its failure is reported, never bypassed here.
 await page.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo(0,y)},resetAt);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='armed');
 await page.evaluate(y=>window.scrollTo(0,y),activation+2);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
 await page.getByRole('button',{name:'Pause cinematic',exact:true}).click();
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='paused');
 const paused=await page.evaluate(()=>window.__goalAstronautTelemetry.playback.progress);
 await page.mouse.wheel(0,20000);await page.keyboard.press('PageDown');
 await page.setViewportSize({width:width-1,height});await page.waitForTimeout(250);
 assert.equal(await page.evaluate(()=>window.__goalAstronautTelemetry.playback.progress),paused);
 await page.setViewportSize({width,height});
 await page.getByRole('button',{name:'Resume cinematic',exact:true}).click();
 await page.waitForFunction(p=>window.__goalAstronautTelemetry.playback.progress>p,paused);
 await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='paused');
 const menuPaused=await page.evaluate(()=>window.__goalAstronautTelemetry.playback.progress);
 await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__goalAstronautTelemetry.playback.progress),menuPaused);
 await page.getByRole('button',{name:'Close navigation menu',exact:true}).click();
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
 await page.getByRole('button',{name:'Skip cinematic',exact:true}).click();
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='completed');
 assert.equal(await page.evaluate(()=>Boolean(window.__lenis?.isStopped)),false);
 assert.equal(await page.evaluate(()=>window.__goalAstronautTelemetry.playback.runs),2);
 report.policy={pauseInputAndResizeStable:true,menuPauseResume:true,skip:true,replayRuns:2};
 await page.evaluate(y=>window.scrollTo(0,y),resetAt);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='armed');
 const contact=async()=>{
  if(width>=820)await page.locator('#header-right-talk-btn').click();
  else{await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();await page.locator('#header-menu-links [data-scroll-to]').click()}
  await page.waitForFunction(()=>{const r=window.__lusionInspector.homeGoalSectionRanges.items.astronautWait;return Math.abs(scrollY-r.pixelFrom)<4&&window.__goalAstronautTelemetry.playback.state==='completed'},null,{timeout:30000});
  assert.equal(await page.evaluate(()=>Boolean(window.__lenis?.isStopped)),false);
 };
 await contact();
 assert.equal(await page.evaluate(()=>window.__goalAstronautTelemetry.playback.runs),2);
 report.policy.contactBypassWithoutReplay=true;
 await page.evaluate(y=>window.scrollTo(0,y),resetAt);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='armed');
 await page.evaluate(y=>window.scrollTo(0,y),activation+2);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
 await contact();assert.equal(await page.evaluate(()=>window.__goalAstronautTelemetry.playback.runs),3);
 report.policy.contactDuringPlayback=true;
 await page.evaluate(y=>window.scrollTo(0,y),resetAt);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='armed');
 await page.evaluate(y=>window.scrollTo(0,y),activation+2);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='completed');
 assert.equal(await page.evaluate(()=>Boolean(window.__lenis?.isStopped)),false);
 await page.emulateMedia({reducedMotion:'no-preference'});report.policy.liveReducedReleasesScroll=true;
 if(network)report.network=await network.stop();
 console.log(JSON.stringify(report));
}finally{fs.writeFileSync(path.join(out,'playback-clock.json'),JSON.stringify(report,null,2));await browser.close()}
if(report.issues.length||report.errors.length)process.exitCode=1;
