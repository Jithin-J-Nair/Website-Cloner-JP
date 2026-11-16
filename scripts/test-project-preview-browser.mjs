#!/usr/bin/env node
/** Real browser source/playback lifecycle checks; no mocked visibility or clock. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
const out=process.env.OUTPUT_PATH||'temp/site-fidelity-audit/project-preview-browser.json';
fs.mkdirSync(path.dirname(out),{recursive:true});
const browser=await launchMotionBrowser();
const context=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
const page=await context.newPage();const report={errors:[],states:[]};
page.on('pageerror',e=>report.errors.push(e.message));
const video=page.locator('main video').first();
const state=async name=>report.states.push({name,...await video.evaluate(v=>({source:v.getAttribute('src'),selected:v.dataset.previewSource,paused:v.paused,readyState:v.readyState,muted:v.muted,preload:v.preload}))});
const playing=async suffix=>page.waitForFunction(s=>{const v=document.querySelector('main video');return v?.currentSrc.endsWith(s)&&!v.paused&&v.readyState>=2},suffix,{timeout:30000});
try{
 await page.goto(base+'/projects/of_the_oak',{waitUntil:'domcontentloaded'});
 await page.locator('#preloader').waitFor({state:'hidden'});
 await playing('/video0.mp4');await state('desktop-playing');
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(()=>document.querySelector('main video').paused);
 await state('reduced-motion-paused');
 await page.emulateMedia({reducedMotion:'no-preference'});await playing('/video0.mp4');
 await page.setViewportSize({width:390,height:844});
 await video.scrollIntoViewIfNeeded();await playing('/mobile_video0.mp4');await state('mobile-playing');
 const card=page.getByRole('button',{name:/Of The Oak — play sequence 01/i});
 await card.press('Enter');
 await page.getByRole('dialog').waitFor();
 await page.waitForFunction(()=>document.querySelector('main video').paused);await state('modal-pauses-preview');
 await page.waitForFunction(()=>{
  const v=document.querySelector('#video-overlay__vimeo-video video');
  return v&&Number.isFinite(v.duration)&&v.duration>0&&v.readyState>=1;
 });
 const modalVideo=page.locator('#video-overlay__vimeo-video video');
 await page.getByRole('button',{name:'PAUSE'}).click();
 await page.waitForFunction(()=>document.querySelector('#video-overlay__vimeo-video video')?.paused);
 const beforeKeyboardSeek=await modalVideo.evaluate(v=>v.currentTime);
 const progressSlider=page.getByRole('slider',{name:'Video playback progress'});
 await progressSlider.focus();
 await progressSlider.press('ArrowRight');
 await page.waitForFunction(previous=>document.querySelector('#video-overlay__vimeo-video video')?.currentTime>previous+0.2,beforeKeyboardSeek);
 const afterKeyboardSeek=await modalVideo.evaluate(v=>v.currentTime);
 assert.ok(afterKeyboardSeek>beforeKeyboardSeek+0.2,'ArrowRight must seek the actual showreel video, not only its visual slider');
 await progressSlider.press('Home');
 await page.waitForFunction(()=>document.querySelector('#video-overlay__vimeo-video video')?.currentTime<0.2);
 await page.keyboard.press('Escape');
 await page.getByRole('dialog').waitFor({state:'hidden'});await playing('/mobile_video0.mp4');
 await page.evaluate(()=>window.__lenis?window.__lenis.scrollTo(0,{immediate:true}):window.scrollTo(0,0));
 await page.waitForFunction(()=>document.querySelector('main video').paused);await state('offscreen-paused');
 assert.deepEqual(report.errors,[]);
 report.passed=true;
 console.log('PASS responsive desktop/mobile source selection, real playback, live reduced motion, keyboard modal seeking, modal pause/resume and offscreen pause.');
}catch(e){report.error=e.message;process.exitCode=1;console.error(e);}
finally{fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');await browser.close();}
