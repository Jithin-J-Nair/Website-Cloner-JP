#!/usr/bin/env node
/** Force genuine WebGL context loss during playback and verify a usable static fallback. */

import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';


const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const failure = process.env.AUDIT_FAILURE || 'context-loss';
const width = Number(process.env.AUDIT_WIDTH || 1440);
const height = Number(process.env.AUDIT_HEIGHT || (width < 820 ? 844 : 900));

const out = path.resolve(`temp/mission/${process.env.AUDIT_TAG || 'loss-baseline'}-${width}-${process.env.AUDIT_REDUCED === '1' ? 'reduce' : 'normal'}`);
fs.mkdirSync(out, {recursive:true});
const browser = await launchMotionBrowser();


const context=await browser.newContext({viewport:{width,height}});
await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
if(failure==='webgl')await context.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /^webgl/.test(type)?null:Reflect.apply(get,this,[type,...args])}});
const page=await context.newPage(),report={scenario:failure,errors:[],warnings:[],issues:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='warning'||m.type()==='error')report.warnings.push(m.text())});
try{
 await page.goto(baseUrl+(failure==='astronaut'?'/?simulateGlbError=1':''),{waitUntil:'networkidle',timeout:120000});
 if(failure==='context-loss'){
 await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:60000});
 const activation=await page.evaluate(()=>window.__goalAstronautTelemetry.playback.activation);
 await page.evaluate(y=>window.scrollTo(0,y),activation+2);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
 const supported=await page.evaluate(()=>{const ext=document.querySelector('#home-goal canvas').getContext('webgl2').getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true});
 if(!supported)throw new Error('WEBGL_lose_context unavailable; this scenario cannot be verified');
 }else{await page.waitForFunction(()=>document.getElementById('home-goal')?.dataset.staticFallback==='true',null,{timeout:60000})}
 await page.waitForTimeout(1500);
 report.loss=await page.evaluate(()=>({telemetry:window.__goalAstronautTelemetry,stopped:window.__lenis?.isStopped,poster:getComputedStyle(document.querySelector('[data-testid="goal-astronaut-fallback"]')).display,track:getComputedStyle(document.getElementById('home-goal-tunnel')).display,staticFallback:document.getElementById('home-goal').dataset.staticFallback}));
 if(report.loss.staticFallback!=='true'||report.loss.poster!=='flex')report.issues.push('Context loss does not display a static fallback');
 if(report.loss.stopped)report.issues.push('Context loss leaves native scrolling locked');
 if(report.loss.track!=='none')report.issues.push('Context loss leaves a blank 35-screen cinematic track');
 await page.screenshot({path:path.join(out,'context-loss.png'),timeout:120000});
 const contact=page.locator('[data-testid="goal-astronaut-fallback"] a');
 if(await contact.count()!==1)report.issues.push('Static fallback has no unique contact alternative');
 else{await contact.focus();await page.keyboard.press('Enter');await page.waitForFunction(()=>{const r=document.getElementById('end-section-title-link').getBoundingClientRect();return r.top>=0&&r.top<innerHeight});report.contactReachable=true;await page.locator('#end-section-title-link').focus();report.contactAccessibleSnapshot=await page.locator('#end-section-title-link').ariaSnapshot();await page.screenshot({path:path.join(out,'fallback-contact.png'),timeout:120000})}
 console.log(JSON.stringify({issues:report.issues,errors:report.errors,warnings:report.warnings,stopped:report.loss.stopped}));
}finally{fs.writeFileSync(path.join(out,'context-loss.json'),JSON.stringify(report,null,2));await browser.close()}
if(report.issues.length||report.errors.length)process.exitCode=1;
