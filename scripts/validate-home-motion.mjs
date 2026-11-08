#!/usr/bin/env node
import { checkHomeEditorial } from "./lib/check-home-editorial.mjs";
/** Hover restitution, shared scroll motion, solar shader and native UHD browser regression. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const width = Number(process.env.HOME_VIEWPORT_WIDTH || 1440);
const height = Number(process.env.HOME_HEIGHT || (width < 820 ? 844 : 900));

const out = path.resolve(`temp/home-motion-${width}-${process.env.HOME_REDUCED === "1" ? "reduce" : "normal"}`);
fs.mkdirSync(out, { recursive: true });

// Shared launcher supports multiprocess Chromium when the single-process shell
// crashes before creating a page. Test inputs and all assertions stay unchanged.
const browser = await launchMotionBrowser();
const reduced = process.env.HOME_REDUCED === '1';
const touch = process.env.HOME_TOUCH === '1';
const context = await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch,reducedMotion:reduced?'reduce':'no-preference'});
await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
const page = await context.newPage();
const report={
 viewport:{width,height},reduced,touch,errors:[],failedAssets:[],states:[],
 referenceVideoDurationSeconds:45.42,
 referenceTimeline:[
  {seconds:0,phase:"home-hero"},{seconds:6,phase:"showreel"},{seconds:12,phase:"featured-work"},
  {seconds:18,phase:"goal-introduction"},{seconds:24,phase:"vortex"},{seconds:30,phase:"blue-corridor"},
  {seconds:32,phase:"glass-approach"},{seconds:34,phase:"glass-break"},{seconds:36,phase:"blue-corridor-exit"},
  {seconds:40,phase:"contact-cta"},{seconds:42,phase:"contact-cta-footer"}
 ]
};
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
 assert.equal(initial.clusterMode,'free-body-cloud','homepage hero uses an unconstrained free-body connector cloud');
 if(!reduced) {
   const scrollEngine=await page.evaluate(()=>({active:!!window.__lenis,duration:window.__lenis?.options?.duration,smoothWheel:window.__lenis?.options?.smoothWheel}));
   assert.equal(scrollEngine.active,true,'Lenis owns smooth wheel scrolling');
   assert.equal(scrollEngine.duration,0.92,'Lenis uses the tuned smooth-scroll duration');
   assert.equal(scrollEngine.smoothWheel,true,'wheel input remains smooth');
   report.smoothScroll=scrollEngine;
 }
 await page.screenshot({path:out+'/hero-cluster.png',timeout:90000});
 if(!reduced && !touch){
  const box=await hero.boundingBox();
  // Hit an outer connector in the new overlapping cluster; verify displacement and magnetic return.
  // First place the pointer outside the cloud, then sweep through it so the test
  // exercises velocity-driven throws rather than only static cursor repulsion.
  await page.mouse.move(box.x+box.width*.14,box.y+box.height*.48);
  await page.mouse.move(box.x+box.width*.84,box.y+box.height*.65,{steps:18});
  await page.waitForFunction((startTravel)=> {
    const el=document.querySelector('#home-hero-visual-container');
    return Number(el.dataset.offsetEnergy)>.16 &&
      Number(el.dataset.pointerInfluencedPieces)>=2 &&
      Number(el.dataset.maxTravel)>startTravel+0.30;
  }, Number(initial.maxTravel), {timeout:30000});
  const hovered=await hero.evaluate(el=>({...el.dataset}));
  assert.ok(Number(hovered.pointerInteractions)>Number(initial.pointerInteractions),
    'hover must reach and physically displace the connector cloud');
  assert.ok(Number(hovered.pointerInfluencedPieces)>=2,
    'a pointer pass must affect multiple nearby connectors');
  assert.ok(Number(hovered.maxTravel)>Number(initial.maxTravel)+0.30,
    'cursor force must visibly throw at least one free connector away from its spawn pose');
  await page.screenshot({path:out+'/hero-hover.png',timeout:90000});
  await page.mouse.move(2,2);
  await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.motionState==='settled'&&Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy)===0,null,{timeout:90000});
  const settled=await hero.evaluate(el=>({...el.dataset}));
  assert.equal(Number(settled.offsetEnergy),0);
  assert.equal(settled.motionState,'settled','pointer energy decays after the cursor leaves');
  await page.waitForFunction((hoverRadius)=>Number(document.querySelector('#home-hero-visual-container').dataset.meanRadius)<hoverRadius-0.02,
    Number(hovered.meanRadius), {timeout:30000});
  const returned=await hero.evaluate(el=>({...el.dataset}));
  assert.ok(Number(returned.meanRadius)<Number(hovered.meanRadius),
    'the shared soft-centre field must gather thrown pieces back toward the cluster');
  // Software-rendered CI frames can take hundreds of milliseconds; wait for an
  // actual post-release simulation frame instead of assuming a 650ms render budget.
  await page.waitForFunction((previousCount)=>Number(document.querySelector('#home-hero-visual-container').dataset.renderCount)>previousCount,
    Number(returned.renderCount), {timeout:10000});
  const idle=await hero.evaluate(el=>({...el.dataset}));
  const idleFrames=Number(idle.renderCount)-Number(returned.renderCount);
  assert.ok(Number(idle.kineticEnergy)>0.01,'free connectors retain angular and linear momentum after pointer release');
  assert.equal(idle.physicsActive,'true','the connector cloud remains physically animated at rest');
  assert.equal(Number(returned.clusterPieces),23,'the home stage renders the full layered connector cluster');
  // Rapid direction changes followed by cancellation must still release pointer energy.
  for (const x of [.2,.8,.3,.7,.49]) await page.mouse.move(box.x+box.width*x,box.y+box.height*.56);
  await hero.dispatchEvent('pointercancel',{pointerType:'mouse'});
  await page.waitForFunction(()=>Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy)===0,null,{timeout:90000});
  report.hero={initial,hovered,settled,returned,idle,rapidCancel:true,idleFrames};
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
  return {intro:top(document.getElementById('home-reel')),reel:top(document.getElementById('home-reel-container')),featured:top(document.getElementById('home-featured'))};
 });
 const seek=async y=>{
  const target=Math.round(y);
  await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y,true),target);
  await page.waitForFunction(y=>Math.abs(scrollY-y)<1.1,target,{timeout:30000});
  // A wall-clock sleep can expire before a scroll RAF on a stalled software renderer.
  // Wait for actual browser frames; keep all reverse-transform assertions unchanged.
  await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 };
 report.editorial=await checkHomeEditorial(page,{width,height,reduced,out});
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
 // Inspect later cinematic phases too: tunnel vortex, blue-flight corridor,
 // plate-glass crack growth, fragment separation and the clean post-shatter exit.
 const seekScenePhase = async (label, y, field, expected) => {
   await seek(y);
   await page.waitForFunction(({field,expected}) => {
     const state=window.__goalAstronautTelemetry?.sceneState;
     return !!state && Math.abs(state[field]-expected)<0.025;
   }, {field,expected}, {timeout:30000});
   await page.screenshot({path:out+'/'+label+'.png',timeout:90000});
   return await page.evaluate(()=>({
     tunnelProgress:window.__goalAstronautTelemetry.sceneState.tunnelProgress,
     shatterProgress:window.__goalAstronautTelemetry.sceneState.shatterProgress,
     bakedFrame:window.__goalAstronautTelemetry.sceneState.bakedFrame,
     corridorTravel:window.__goalAstronautTelemetry.sceneState.corridorTravel,
     corridorVisible:window.__goalAstronautTelemetry.sceneState.corridorVisible,
     corridorClipped:window.__goalAstronautTelemetry.sceneState.corridorClipped,
     glassOpacity:window.__goalAstronautTelemetry.sceneState.glassOpacity,
     glassThickness:window.__goalAstronautTelemetry.sceneState.glassThickness,
     glassRefractionReady:window.__goalAstronautTelemetry.sceneState.glassRefractionReady,
     shardDepthWrite:window.__goalAstronautTelemetry.sceneState.shardDepthWrite,
     shardCount:window.__goalAstronautTelemetry.sceneState.shardCount,
     shardFrames:window.__goalAstronautTelemetry.sceneState.shardFrames,
     vortexIntensity:window.__goalAstronautTelemetry.sceneState.vortexIntensity,
     shardSpread:window.__goalAstronautTelemetry.sceneState.shardSpread,
     shardSidewallsLoaded:window.__goalAstronautTelemetry.sceneState.shardSidewallsLoaded,
     shardSidewallTriangles:window.__goalAstronautTelemetry.sceneState.shardSidewallTriangles,
     vortexGlassVisible:window.__goalAstronautTelemetry.sceneState.vortexGlassVisible,
     vortexGlassLayers:window.__goalAstronautTelemetry.sceneState.vortexGlassLayers,
     vortexGlassEdges:window.__goalAstronautTelemetry.sceneState.vortexGlassEdges,
     trussLoaded:window.__goalAstronautTelemetry.sceneState.trussLoaded,
     shardsLoaded:window.__goalAstronautTelemetry.sceneState.shardsLoaded,
     webglError:document.querySelector('#home-goal canvas').getContext('webgl2').getError(),
   }));
 };
 const vortexY = await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForTunnel(0.58));
 await seek(vortexY);
 await page.waitForFunction(()=>window.__goalAstronautTelemetry?.sceneState?.trussLoaded===true,null,{timeout:30000});
 const vortexState = await seekScenePhase('vortex',vortexY,'tunnelProgress',0.58);
 assert.equal(vortexState.trussLoaded,true,'vortex truss geometry is present');
 assert.equal(vortexState.shardsLoaded,true,'captured shard geometry is loaded for downstream break');
 assert.equal(vortexState.shardCount,946,'the captured fracture retains all 946 glass pieces');
 assert.ok(vortexState.shardFrames >= 15,'glass fragments retain the authored 15-frame rigid-body motion sequence');
 assert.ok(vortexState.vortexIntensity > 0.18,'the exposed metal-truss vortex and spiral core are energized');
 assert.equal(vortexState.vortexGlassVisible,true,'transparent projected 4D glass cages surround the vortex');
 assert.equal(vortexState.vortexGlassLayers,width<813?3:4,'responsive nested glass-hypercube layers are present');
 assert.equal(vortexState.vortexGlassEdges,(width<813?3:4)*32,'each projected hypercube has 32 tesseract edges');
 assert.equal(vortexState.shardSidewallsLoaded,true,'captured glass shards have volumetric sidewalls');
 assert.ok(vortexState.shardSidewallTriangles>0,'the sidewall pass creates reflective glass edge faces');
 assert.equal(vortexState.shardSpread,1.2,'the captured breakup uses a wider art-directed shard envelope');
 assert.equal(vortexState.webglError,0,'vortex frame has no WebGL error');
 const vortexPeakY = await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForTunnel(0.73));
 const vortexPeakState = await seekScenePhase('vortex-peak',vortexPeakY,'tunnelProgress',0.73);
 assert.ok(vortexPeakState.vortexIntensity>0.82,'the spiral vortex core reaches its peak without a white overlay');
 assert.equal(vortexPeakState.vortexGlassVisible,true,'the transparent glass lattice remains visible at the vortex peak');
 assert.equal(vortexPeakState.webglError,0,'vortex peak has no WebGL error');
 const blueY = await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForTunnel(0.90));
 const blueState = await seekScenePhase('blue-corridor',blueY,'tunnelProgress',0.90);
 assert.ok(blueState.corridorTravel>0,'astronaut transitions into the blue arch corridor');
 assert.equal(blueState.corridorVisible,true,'blue corridor is visible before the glass transition');
 assert.equal(blueState.corridorClipped,true,'corridor stays framed inside the display before the breakout');
 assert.equal(blueState.webglError,0);
 const impactApproachY = await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForShatter(0.16));
 const impactApproach = await seekScenePhase('glass-approach',impactApproachY,'shatterProgress',0.16);
 assert.equal(await page.locator('#home-goal-monitor-cracks').count(),0,'no artificial glass crack layer exists before impact');
 const shatterY = await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForShatter(0.285));
 const shatterState = await seekScenePhase('glass-shatter',shatterY,'shatterProgress',0.285);
 assert.ok(shatterState.glassOpacity>0.72,'plate-glass fragments separate on the compressed impact beat');
 assert.equal(shatterState.glassRefractionReady,true,'moving glass samples the live scene behind each fragment');
 assert.ok(shatterState.glassThickness>=0.03 && shatterState.glassThickness<=0.15,
   `display-glass optical thickness stays tied to its thin extruded plate (actual=${shatterState.glassThickness})`);
 assert.equal(shatterState.shardDepthWrite,true,'nearer glass facets depth-occlude more distant facets');
 assert.equal(shatterState.shardSidewallsLoaded,true,'fragment sidewalls use the same captured rigid-body transforms');
 assert.ok(shatterState.shardSidewallTriangles>0,'thick glass edges are rendered as actual side faces');
 assert.ok(shatterState.shardSpread>1.1,'captured fragment positions are spread beyond their rest envelope');
 assert.equal(shatterState.webglError,0);
 const exitY = await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForShatter(0.90));
 const exitState = await seekScenePhase('post-shatter',exitY,'shatterProgress',0.90);
 assert.ok(exitState.glassOpacity<0.4,'glass fragments clear rather than lingering over the astronaut');
 assert.equal(exitState.corridorVisible,true,'the full blue corridor returns after the glass breakout');
 assert.equal(exitState.corridorClipped,false,'post-break corridor expands beyond the display aperture');
 report.downstream={vortex:vortexState,blueCorridor:blueState,impactApproach,shatter:shatterState,postShatter:exitState};
 const ctaY=await page.evaluate(()=>{const el=document.querySelector('#end-section-title-link');if(!el)return -1;let y=0;for(let n=el;n;n=n.offsetParent)y+=n.offsetTop;return y;});
 assert.ok(ctaY>0,'home contact CTA title exists');
 await seek(ctaY-height*.35);
 await page.waitForFunction(()=>{const el=document.querySelector('#end-section-title-link');if(!el)return false;const r=el.getBoundingClientRect();return r.top<innerHeight*.75&&r.bottom>0;},null,{timeout:30000});
 await page.waitForTimeout(450);
 await page.screenshot({path:out+'/home-cta.png',timeout:90000});
 report.cta=await page.evaluate(()=>{
   const title=document.querySelector('#end-section-title-link');
   const pill=document.querySelector('#end-bottom');
   return {title:title?.textContent?.replace(/\\s+/g,' ').trim()??null,titleOpacity:title?getComputedStyle(title).opacity:null,
     bottomPillVisible:!!pill&&getComputedStyle(pill).opacity!=='0',
     corridorVisible:window.__goalAstronautTelemetry?.sceneState?.corridorVisible??false,
     waitProgress:window.__goalAstronautTelemetry?.sceneState?.waitProgress??0};
 });
 await seek(layout.reel+(width>812&&!reduced?height*.65:-height*.12));
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
