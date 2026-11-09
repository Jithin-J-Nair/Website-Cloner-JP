import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';

const base=process.env.BASE_URL||'http://127.0.0.1:3003';
const out=process.env.TUNNEL_VALIDATE_OUT||'temp/home-tunnel-framing/validation';
fs.mkdirSync(out,{recursive:true});
const report={scope:'Authored phase seeks in Chromium/SwiftShader. Normal and reduced scene rendering, not autonomous frame-delivery, physical GPU performance or reference pixel equality.',states:[],errors:[],passed:false};
const clamp=n=>Math.max(0,Math.min(1,n));
try {
 for(const width of [1440,390])for(const reducedMotion of ['reduce','no-preference']) {
  const height=width<813?844:900,browser=await launchMotionBrowser();
  try {
   const c=await browser.newContext({viewport:{width,height},reducedMotion});
   await c.addInitScript(()=>{try{sessionStorage.setItem('lusion_booted_v1','1')}catch{}});
   const p=await c.newPage();p.setDefaultTimeout(120000);
   p.on('pageerror',e=>report.errors.push(e.message));
   p.on('console',m=>{if(m.type()==='error'&&/THREE|GLSL|Shader Error/.test(m.text()))report.errors.push(m.text())});
   await p.goto(base,{waitUntil:'networkidle',timeout:120000});
   await p.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded&&window.__goalAstronautTelemetry.pipelineReady&&window.__goalAstronautTelemetry.sceneState.nativeWorldsReady);
   await p.evaluate(()=>{window.__goalPipelineProbe=renderer=>{
    if(!window.__readGoalPixels)return;
    window.__readGoalPixels=false;const gl=renderer.getContext(),bytes=new Uint8Array(16*16*4);
    gl.readPixels(Math.floor(gl.drawingBufferWidth/2)-8,Math.floor(gl.drawingBufferHeight/2)-8,16,16,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
    let alphaMin=255,rgbMax=0;
    for(let i=0;i<bytes.length;i+=4){alphaMin=Math.min(alphaMin,bytes[i+3]);rgbMax=Math.max(rgbMax,bytes[i],bytes[i+1],bytes[i+2])}
    window.__goalPixels={alphaMin,rgbMax,error:gl.getError()};
   }});
   const phases=[... [.05,.4,.72,.83,.86,.88,.9,.92,.95,.99].map(r=>['tunnel',r]),... [.02,.2,.4,.7,.88].map(r=>['shatter',r]),['wait',.12],['wait',.4]];
   for(const [phase,ratio] of phases) {
    const observation=await p.evaluate(({phase,ratio})=>{
     const t=window.__goalAstronautTelemetry,r=window.__lusionInspector.homeGoalSectionRanges.items;
     const y=phase==='tunnel'?t.scrollForTunnel(ratio):phase==='shatter'?t.scrollForShatter(ratio):r.astronautWait.pixelFrom+r.astronautWait.pixelCount*ratio;
     window.__readGoalPixels=true;window.__lusionInspector.scrollManager.scrollToPixel(y,true);
     return {state:JSON.parse(JSON.stringify(t.sceneState)),pixels:window.__goalPixels,render:[t.renderWidth,t.renderHeight],overflow:document.documentElement.scrollWidth>innerWidth+1};
    },{phase,ratio});
    const row={width,height,reducedMotion,phase,ratio,...observation};report.states.push(row);
    const s=row.state,white=clamp((s.tunnelProgress-.815)/.185),frame=clamp(white*1.5);
    assert.ok(s.nativeWorldsReady&&s.shardsLoaded&&!s.worldError);
    assert.equal(s.blackInstances,552);assert.equal(s.whiteInstances,32);
    assert.ok(s.astronautMatrix.every(Number.isFinite)&&s.cameraMatrix.every(Number.isFinite)&&s.astronautRootNdc.every(Number.isFinite));
    assert.ok(Math.abs(s.whiteFlightRatio-frame)<1e-10);
    if(s.tunnelProgress>=.815)assert.ok(Math.abs(s.noisePositionAmplitude-5*(1-clamp(frame/.75)))<1e-10);
    if(phase==='tunnel'&&ratio>=.9) {
     assert.ok(Math.abs(s.astronautRootNdc[0])<.35&&Math.abs(s.astronautRootNdc[1])<.35,'late blue flight remains centered without a viewport clamp');
     assert.ok(s.astronautRootNdc[2]>-1&&s.astronautRootNdc[2]<1,'subject root is between clip planes');
    }
    if(phase==='shatter') {
     assert.equal(s.glassOpacity,1,'captured glass is visible even before the old .18 delay');
     assert.ok(s.glassRefractionReady&&s.shardCount===946&&s.shardFrames===15);
     assert.ok(Math.abs(s.glassFrame-Math.sin(s.shatterProgress*Math.PI/2)*14)<1e-10);
     assert.ok(Math.abs(s.glassFragmentScale-(1-clamp((s.shatterProgress-.75)/.25)))<1e-10);
     assert.equal(s.shardDepthWrite,false);assert.equal(s.shardSidewallsLoaded,false);
    }
    assert.equal(row.overflow,false);assert.equal(row.pixels.error,0);
    assert.equal(row.pixels.alphaMin,255,'the final native display is opaque, not the bloom selection mask');
    assert.ok(row.pixels.rgbMax>10,'the central authored scene contributes visible pixels');
    if(phase==='tunnel'&&ratio===.9||phase==='shatter'&&ratio===.2||phase==='wait'&&ratio===.12) {
     const file=`${width}-${reducedMotion}-${phase}-${ratio}.jpg`;row.file=file;
     await p.screenshot({path:path.join(out,file),quality:85,timeout:120000});
    }
   }
   await c.close();
  } finally {await browser.close()}
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
 console.log(`PASS ${report.states.length} native phase/framing/glass/opaque-pixel observations across desktop/mobile, normal/reduced seeks. Autonomous performance is a separate gate.`);
} finally {fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2))}
