#!/usr/bin/env node
/** Browser playback smoke test; audible output and hardware decode vary by device. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const browser=await launchMotionBrowser(),base=process.env.BASE_URL||'http://127.0.0.1:3004';
fs.mkdirSync('temp/home-reel-video',{recursive:true});
try {
 for(const width of [1440,390]) {
  const height=width===390?844:900;
  const page=await browser.newPage({viewport:{width,height},hasTouch:width===390});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
  await page.goto(base,{waitUntil:'domcontentloaded',timeout:120000});
  await page.waitForFunction(()=>document.getElementById('home-reel-video'));
  const seek=y=>page.evaluate(y=>{if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true,force:true});else window.scrollTo(0,y);},y);
  const box=selector=>page.locator(selector).evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,height:r.height};});
  const thumb=await box('#home-reel-thumb'),outer=await box('#home-reel-container');
  const small=thumb.top-(height-thumb.height)*.5;
  const large=width>812?outer.top-(height-outer.height)*.5+20:outer.top-height*.15;
  if(width>812){await seek(small);await page.waitForFunction(()=>Number(document.getElementById('home').dataset.editorialMorph)<.1);}
  await seek(large);await page.waitForFunction(()=>Number(document.getElementById('home').dataset.editorialMorph)>.98,null,{timeout:60000});
  await page.waitForFunction(()=>{const v=document.getElementById('home-reel-video');return v&&v.readyState>=2&&!v.paused;},null,{timeout:120000});
  const info=await page.locator('#home-reel-video').evaluate(v=>({src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,time:v.currentTime}));
  assert.ok(info.src.endsWith('/videos/hero%20video.mp4'));assert.equal(info.width,3840);assert.equal(info.height,2160);
  await page.waitForFunction(t=>document.getElementById('home-reel-video').currentTime>t+.15,info.time,{timeout:30000});
  const stage=await page.locator('#home-reel-video-container').boundingBox(),play=await page.locator('#home-reel-video-watch-btn').boundingBox();
  assert.ok(play.x-stage.x<stage.width*.15&&stage.y+stage.height-play.y-play.height<stage.height*.2,'play button is bottom-left');
  await page.screenshot({path:`temp/home-reel-video/${width}-expanded.png`,timeout:120000});
  const sound=page.locator('#home-reel-sound-btn');
  if(await page.locator('#home-reel-video').evaluate(v=>v.muted))await sound.click();
  await page.waitForFunction(()=>{const v=document.getElementById('home-reel-video');return !v.muted&&!v.paused;});
  await sound.click();assert.equal(await page.locator('#home-reel-video').evaluate(v=>v.muted),true);
  await page.locator('#home-reel-video-watch-btn').click();await page.waitForSelector('#video-overlay video');
  assert.ok((await page.locator('#video-overlay video').getAttribute('src')).includes('hero%20video.mp4'));
  await page.waitForFunction(()=>document.getElementById('home-reel-video').paused);await page.keyboard.press('Escape');
  await page.waitForSelector('#video-overlay',{state:'detached'});await seek(0);await page.waitForFunction(()=>document.getElementById('home-reel-video').paused);
  assert.deepEqual(errors,[]);console.log(`PASS ${width}: original 4K video, playback, sound gesture, mute, corner button, modal and offscreen pause`);
  await page.close();
 }
} finally {await browser.close();}
