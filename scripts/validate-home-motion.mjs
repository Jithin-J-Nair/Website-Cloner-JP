#!/usr/bin/env node
/** Hover restitution, shared scroll motion, solar shader and native UHD browser regression. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { chromium } from 'playwright-core';
import sparticuz from '@sparticuz/chromium';

const require = createRequire(import.meta.url);
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const width = Number(process.env.HOME_VIEWPORT_WIDTH || 1440);
const height = Number(process.env.HOME_HEIGHT || (width < 820 ? 844 : 900));

const out = path.resolve(`temp/home-motion-${width}-${process.env.HOME_REDUCED === "1" ? "reduce" : "normal"}`);
fs.mkdirSync(out, { recursive: true });

// Same bundled Chromium/SwiftShader support as capture-astronaut-emergence.mjs.
const libDir = path.join(os.tmpdir(), 'goal-chromium-libs');
fs.mkdirSync(libDir, { recursive: true });
const binDir = path.resolve(path.dirname(require.resolve('@sparticuz/chromium')), '..', 'bin');
for (const archive of ['al2023', 'swiftshader']) {
  const marker = path.join(libDir, `.${archive}`);
  if (!fs.existsSync(marker)) {
    const tar = path.join(libDir, `${archive}.tar`);
    fs.writeFileSync(tar, zlib.brotliDecompressSync(fs.readFileSync(path.join(binDir, `${archive}.tar.br`))));
    execFileSync('tar', ['xf', tar, '-C', libDir]);
    fs.unlinkSync(tar); fs.writeFileSync(marker, 'ok');
  }
}
process.env.LD_LIBRARY_PATH = [libDir, path.join(libDir, 'lib'), process.env.LD_LIBRARY_PATH].filter(Boolean).join(':');
const executablePath = await sparticuz.executablePath();
const launchBrowser = () => chromium.launch({
  executablePath: process.env.CHROMIUM_EXECUTABLE_PATH || executablePath,
  headless: true,
  args: [...sparticuz.args, '--use-gl=angle', '--use-angle=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'],
});
const browser = await launchBrowser();
const reduced = process.env.HOME_REDUCED === '1';
const touch = process.env.HOME_TOUCH === '1';
const context = await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:reduced?'reduce':'no-preference'});
await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
const page = await context.newPage();
const report={viewport:{width,height},reduced,touch,errors:[],failedAssets:[],states:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
page.on('response',r=>{if(r.url().includes('/assets/')&&!r.ok())report.failedAssets.push(r.url())});
try {
 await page.goto(baseUrl,{waitUntil:'networkidle',timeout:120000});
 report.viewportMetrics=await page.evaluate(()=>({width:innerWidth,height:innerHeight,visualWidth:visualViewport?.width,visualHeight:visualViewport?.height}));
 if(width===3840){
  await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:60000});
  const y=await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForEmergence(.8));
  await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y,true),Math.round(y));
  await page.waitForTimeout(500);
  await page.screenshot({path:out+'/solar-uhd.png',timeout:120000});
  report.solar=await page.evaluate(()=>{const canvas=document.querySelector('#home-goal canvas');const gl=canvas.getContext('webgl2');return {telemetry:window.__goalAstronautTelemetry,canvasSize:[canvas.width,canvas.height],drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],webglError:gl.getError()}});
  assert.equal(report.solar.webglError,0);
  assert.deepEqual([report.solar.telemetry.renderWidth,report.solar.telemetry.renderHeight],[3840,2160]);
  assert.deepEqual(report.solar.canvasSize,[3840,2160]);
  assert.deepEqual(report.solar.drawingBuffer,[3840,2160]);
  assert.deepEqual(report.errors,[]); assert.deepEqual(report.failedAssets,[]);
  console.log('PASS native UHD solar framebuffer 3840x2160 / GL NO_ERROR');
 }else{
 const hero=page.locator('#home-hero-visual-container');
 await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container')?.dataset.motionState==='settled',null,{timeout:90000});
 const initial=await hero.evaluate(el=>({...el.dataset}));
 if(!reduced && !touch){
  const box=await hero.boundingBox();
  await page.mouse.move(box.x+box.width*.49,box.y+box.height*.56);
  await page.waitForFunction(()=>Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy)>.10,null,{timeout:30000});
  const hovered=await hero.evaluate(el=>({...el.dataset}));
  await page.screenshot({path:out+'/hero-hover.png',timeout:90000});
  await page.mouse.move(2,2);
  await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.motionState==='settled'&&Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy)===0,null,{timeout:90000});
  const settled=await hero.evaluate(el=>({...el.dataset}));
  assert.equal(Number(settled.offsetEnergy),0);
  await page.waitForTimeout(650);
  assert.equal(await hero.getAttribute('data-render-count'),settled.renderCount,'settled hero must not keep submitting 3D frames');
  // Rapid direction changes followed by cancellation must not leave a displaced connector.
  for (const x of [.2,.8,.3,.7,.49]) await page.mouse.move(box.x+box.width*x,box.y+box.height*.56);
  await hero.dispatchEvent('pointercancel',{pointerType:'mouse'});
  await page.waitForFunction(()=>Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy)===0,null,{timeout:90000});
  report.hero={initial,hovered,settled,rapidCancel:true};
 }else {
  report.hero={initial};
  if(touch){
   const box=await hero.boundingBox();
   await hero.dispatchEvent('pointermove',{pointerType:'touch',clientX:box.x+box.width*.5,clientY:box.y+box.height*.5});
   await page.waitForTimeout(350);
   assert.equal(Number(await hero.getAttribute('data-offset-energy')),0,'touch must not latch mouse repulsion');
   report.touchNoHover=true;
   const cdp=await context.newCDPSession(page);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:width*.5,y:height*.8}]});
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.5,y:height*.4}]});
   // End a deliberate drag at rest: do not let native fling inertia race the later seeks.
   await page.waitForTimeout(350);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:width*.5,y:height*.4}]});
   await page.waitForTimeout(150);
   await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
   await page.waitForFunction(()=>scrollY>0);
   report.touchNativeScroll=true;
  }
 }
 const layout=await page.evaluate(()=>{
  const top=el=>{let y=0;for(let n=el;n;n=n.offsetParent)y+=n.offsetTop;return y};
  return {reel:top(document.getElementById('home-reel-container')),featured:top(document.getElementById('home-featured'))};
 });
 const seek=async y=>{
  const target=Math.round(y);
  await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y,true),target);
  await page.waitForFunction(y=>Math.abs(scrollY-y)<1.1,target,{timeout:30000});
  // A wall-clock sleep can expire before a scroll RAF on a stalled software renderer.
  // Wait for actual browser frames; keep all reverse-transform assertions unchanged.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 };
 const reel=[];
 for(const y of [layout.reel-height*.94,layout.reel-height*.5,layout.reel-height*.12]){
  await seek(y);
  reel.push(await page.locator('#home-reel-video-container').evaluate(el=>({transform:getComputedStyle(el).transform,radius:el.querySelector('.group').style.borderRadius})));
 }
 report.reel=reel;
 if(!reduced)assert.notEqual(reel[0].transform,reel[2].transform,'reel container expands with scroll');
 await seek(layout.reel-height*.94);
 const reversedReel=await page.locator('#home-reel-video-container').evaluate(el=>getComputedStyle(el).transform);
 assert.equal(reversedReel,reel[0].transform,'reverse scroll must restore the same container state');
 await seek(layout.reel-height*.12);
 report.reel=reel;
 report.reelReverse=true;
 report.reelBackground=await page.locator('#home-reel-video').evaluate(video=>({paused:video.paused,readyState:video.readyState}));
 assert.ok(report.reelBackground.readyState>=2,'paused footage must still have a decoded visible frame');
 if(reduced)assert.equal(report.reelBackground.paused,true);
 await page.screenshot({path:out+'/reel.png',timeout:90000});
 const featured=[];
 for(const y of [layout.featured-height*.8,layout.featured-height*.3,layout.featured+height*.2]){
  await seek(y);
  featured.push(await page.evaluate(()=>({heading:getComputedStyle(document.getElementById('home-featured-title')).transform,cards:[...document.querySelectorAll('.project-item')].slice(0,2).map(el=>({stage:el.querySelector('.project-item-main').style.transform,image:el.querySelector('img.project-item-image')?.style.transform}))})));
 }
 if(!reduced)assert.notEqual(featured[0].heading,featured[2].heading);
 await seek(layout.featured-height*.8);
 assert.equal(await page.locator('#home-featured-title').evaluate(el=>getComputedStyle(el).transform),featured[0].heading);
 await seek(layout.featured+height*.2);
 report.featured=featured;
 report.featuredReverse=true;
 await page.screenshot({path:out+'/featured.png',timeout:90000});
 await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded);
 const titleY=await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForEmergence(.80));
 await seek(titleY);
 await page.screenshot({path:out+'/solar.png',timeout:90000});
 report.solar=await page.evaluate(()=>{const canvas=document.querySelector('#home-goal canvas');const gl=canvas.getContext('webgl2');return {telemetry:window.__goalAstronautTelemetry,canvasSize:[canvas.width,canvas.height],drawingBuffer:[gl.drawingBufferWidth,gl.drawingBufferHeight],webglError:gl.getError()}});
 assert.equal(report.solar.webglError,0);
 await page.waitForFunction(()=>[...document.querySelectorAll('#home-reel video')].every(video=>video.paused));
 report.offscreenVideosPaused=true;
 const firstSolar=report.solar.telemetry.solar;
 assert.ok(firstSolar.visibility>=0 && firstSolar.visibility<=1);
 assert.ok(firstSolar.focalScale>0 && firstSolar.focalScale<2);
 assert.equal(report.solar.telemetry.gpuTiming.enabled,baseUrl.includes('profileGoal=1') && await page.evaluate(()=>!!document.querySelector('#home-goal canvas').getContext('webgl2').getExtension('EXT_disjoint_timer_query_webgl2')));
 const otherY=await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForEmergence(.64));
 await seek(otherY);
 const movedSolar=await page.evaluate(()=>({...window.__goalAstronautTelemetry.solar}));
 assert.ok(Math.hypot(movedSolar.x-firstSolar.x,movedSolar.y-firstSolar.y)>.001,'source projection must respond to camera choreography');
 await page.screenshot({path:out+"/solar-oblique.png",timeout:90000});
 assert.notEqual(movedSolar.focalScale,firstSolar.focalScale,'pupil footprint must respond to camera field of view');
 report.solarCameraResponse={first:firstSolar,other:movedSolar};
 await seek(titleY);
 if(width===3840)assert.deepEqual([report.solar.telemetry.renderWidth,report.solar.telemetry.renderHeight],[3840,2160]);
 await seek(layout.reel-height*.12);
 await page.locator('#home-reel-video-watch-btn').click();
 await page.locator('#video-overlay[role="dialog"]').waitFor({state:'visible'});
 await page.waitForFunction(()=>[...document.querySelectorAll('#home-reel video')].every(video=>video.paused));
 await page.keyboard.press('Escape');
 await page.locator('#video-overlay').waitFor({state:'hidden'});
 await page.waitForTimeout(500);
 report.modalChecked=true;
 assert.deepEqual(report.errors,[]); assert.deepEqual(report.failedAssets,[]);
 console.log('PASS home motion',width,{hero:report.hero.settled?.motionState,reel:true,featured:true,solarGL:0,errors:report.errors});
}
}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await browser.close()}
