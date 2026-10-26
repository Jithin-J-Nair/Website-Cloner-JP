#!/usr/bin/env node
/** Real WebAudio and controlled scene seeks; NOT native cadence/display/listening proof.
 * Captures only the new synthesizer's compressor bus, never reference media.
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser, startBrowserRecording } from './lib/browser-runtime.mjs';
function installAudioCapture() {
      sessionStorage.setItem('lusion_booted_v1','1');window.__enableJourneyAudioProbe=true;
      const raf=requestAnimationFrame.bind(window);window.requestAnimationFrame=fn=>raf(t=>{if(!window.__audioFreezeRaf)fn(t);});
      const Native=window.AudioContext;
      window.__audioGestures=[];
      window.AudioContext=class extends Native{constructor(...args){super(...args);window.__audioGestures.push({at:performance.now(),active:navigator.userActivation.isActive});}};
      const create=Native.prototype.createDynamicsCompressor;
      Native.prototype.createDynamicsCompressor=function(...args){
        const node=Reflect.apply(create,this,args),dest=this.createMediaStreamDestination(),analyser=this.createAnalyser();analyser.fftSize=2048;
        node.connect(dest);node.connect(analyser);window.__audioTap={ctx:this,stream:dest.stream,analyser};return node;
      };
      window.__measureSound=()=>{
        const tap=window.__audioTap;if(!tap)return null;
        const time=new Float32Array(tap.analyser.fftSize);tap.analyser.getFloatTimeDomainData(time);let square=0,peak=0;for(const v of time){square+=v*v;peak=Math.max(peak,Math.abs(v));}
        const bins=new Float32Array(tap.analyser.frequencyBinCount);tap.analyser.getFloatFrequencyData(bins);
        const band=(a,b)=>{let n=0,total=0;for(let i=0;i<bins.length;i++){let hz=i*tap.ctx.sampleRate/tap.analyser.fftSize;if(hz>=a&&hz<b){total+=Number.isFinite(bins[i])?Math.pow(10,bins[i]/10):0;n++;}}return total/Math.max(n,1);};
        return {at:performance.now(),audioTime:tap.ctx.currentTime,rms:Math.sqrt(square/time.length),peak,low:band(50,300),high:band(2000,8000)};
      };
      window.__startAudioRecord=()=>{
        if(!MediaRecorder.isTypeSupported('audio/webm;codecs=opus'))throw new Error('Opus recording unavailable');
        const chunks=[],recorder=new MediaRecorder(window.__audioTap.stream,{mimeType:'audio/webm;codecs=opus',audioBitsPerSecond:64000});
        recorder.ondataavailable=e=>chunks.push(e.data);window.__audioRecorder={recorder,chunks,start:performance.now()};recorder.start();return performance.now();
      };
      window.__stopAudioRecord=()=>new Promise(resolve=>{const {recorder,chunks,start}=window.__audioRecorder;recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(chunks).arrayBuffer());let s='';for(let i=0;i<bytes.length;i+=32768)s+=String.fromCharCode(...bytes.subarray(i,i+32768));resolve({start,end:performance.now(),base64:btoa(s)});};recorder.stop();});
}
const root=process.env.AUDIO_OUT||'temp/journey-audio/browser';fs.mkdirSync(root,{recursive:true});
const browser=await launchMotionBrowser();
try {
  if(process.env.AUDIO_NATIVE==='1'){
    const width=Number(process.env.AUDIO_WIDTH||1440),nativeDir=`${root}/native-${width}`;fs.mkdirSync(nativeDir,{recursive:true});
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'no-preference',isMobile:width===390,hasTouch:width===390});
    await context.addInitScript(installAudioCapture);
    const page=await context.newPage(),report={width,mode:'uninterrupted native owner clock; sound enabled; audio/video capture instrumentation; NOT a performance gate',errors:[]};
    page.on('pageerror',e=>report.errors.push(e.message));
    try{
      await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'networkidle',timeout:120000});
      await page.waitForFunction(()=>window.__journeyAudioProbe&&window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:90000});
      if(width===390){await page.getByRole('button',{name:'Play Showreel',exact:true}).tap();await page.locator('#video-overlay__mute-btn').tap();await page.getByRole('button',{name:'Close video overlay',exact:true}).tap();}
      else await page.locator('#header-right-sound-btn').click();
      await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
      await page.evaluate(()=>window.scrollTo({top:window.__goalAstronautTelemetry.scrollForEmergence(.2),behavior:'instant'}));
      await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='armed'&&Math.abs(window.__goalAstronautTelemetry.emergenceProgress-.2)<.002);
      const video=await startBrowserRecording(context,page,nativeDir);await video.waitForFirstFrame();
      report.recordStart=await page.evaluate(()=>window.__startAudioRecord());
      await page.evaluate(()=>{window.__nativeAudioSamples=[];window.__nativeAudioTimer=setInterval(()=>{const t=window.__goalAstronautTelemetry,a=window.__journeyAudioProbe();delete a.events;window.__nativeAudioSamples.push({at:performance.now(),sourceId:t.renderCount,playback:{...t.playback},scene:{...t.sceneState},audio:a,signal:window.__measureSound()});},100);window.scrollTo({top:window.__goalAstronautTelemetry.playback.activation+2,behavior:'instant'});});
      await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='completed',null,{timeout:240000,polling:200});
      report.samples=await page.evaluate(()=>{clearInterval(window.__nativeAudioTimer);return window.__nativeAudioSamples;});
      report.videoFrames=await video.stop();
      const recording=await page.evaluate(()=>window.__stopAudioRecord());fs.writeFileSync(`${nativeDir}/audio.webm`,Buffer.from(recording.base64,'base64'));delete recording.base64;report.recording=recording;
      report.stages=[...new Set(report.samples.map(s=>s.audio.stage))];assert.ok(report.stages.length>=3);assert.deepEqual(report.errors,[]);
      for(const sample of report.samples.filter(s=>s.audio.input.active)){assert.ok(Math.abs(sample.audio.input.tunnel-sample.scene.tunnelProgress)<1e-8);assert.ok(Math.abs(sample.audio.input.drop-sample.scene.shatterProgress)<1e-8);assert.equal(sample.audio.contextCreations,1);assert.equal(sample.audio.loops,5);}
      const resetAt=await page.evaluate(()=>window.__goalAstronautTelemetry.scrollForEmergence(0)-innerHeight*.3);
      await page.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo(0,y);},resetAt);
      await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='armed');
      await page.evaluate(()=>window.scrollTo(0,window.__goalAstronautTelemetry.playback.activation+2));
      await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='playing');
      await page.getByRole('button',{name:'Pause cinematic',exact:true}).click();
      await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='paused'&&window.__journeyAudioProbe().paused);
      await page.waitForTimeout(250);
      report.pause=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),playback:{...window.__goalAstronautTelemetry.playback},signal:window.__measureSound()}));assert.ok(report.pause.signal.rms<.000001);
      if(width===1440){
        await page.evaluate(()=>window.__audioTap.ctx.suspend());await page.waitForFunction(()=>window.__journeyAudioProbe().status==='suspended');
        report.suspended=await page.evaluate(()=>window.__journeyAudioProbe());
        await page.locator('#header-right-sound-btn').click();await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
        await page.locator('#header-right-sound-btn').click();await page.waitForTimeout(150);
        await page.locator('#header-right-sound-btn').click();await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
        assert.equal(await page.evaluate(()=>window.__goalAstronautTelemetry.playback.progress),report.pause.playback.progress);
      }
      await page.getByRole('button',{name:'Resume cinematic',exact:true}).click();
      await page.waitForFunction(p=>window.__goalAstronautTelemetry.playback.progress>p,report.pause.playback.progress);await page.waitForTimeout(200);
      report.resumed=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),playback:{...window.__goalAstronautTelemetry.playback},signal:window.__measureSound()}));
      assert.equal(report.resumed.audio.contextCreations,1);assert.equal(report.resumed.audio.loops,5);assert.ok(report.resumed.signal.rms>.00001);
      const lost=await page.evaluate(()=>{const ext=document.querySelector('#home-goal canvas').getContext('webgl2').getExtension('WEBGL_lose_context');if(!ext)return false;ext.loseContext();return true;});assert.ok(lost);
      await page.waitForFunction(()=>window.__goalAstronautTelemetry.fallbackVisible&&window.__journeyAudioProbe().stage==='home');
      report.contextLost=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),nativeReleased:!window.__lenis?.isStopped,staticFallback:document.getElementById('home-goal').dataset.staticFallback}));
      assert.equal(report.contextLost.audio.input.active,false);assert.equal(report.contextLost.nativeReleased,true);assert.equal(report.contextLost.staticFallback,'true');assert.deepEqual(report.errors,[]);
      console.log(`PASS native ${width} audio capture, stages=${report.stages.join(',')}; presentation cadence and physical listening not certified.`);
    }finally{fs.writeFileSync(`${nativeDir}/native.json`,JSON.stringify(report,null,2));await context.close();}
  }else{
  for(const width of [1440,390]){
    const context=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'no-preference',isMobile:width===390,hasTouch:width===390});
    await context.addInitScript(installAudioCapture);
    const page=await context.newPage(),report={width,mobileEmulation:width===390,hasTouch:width===390,mode:'controlled seeks; RAF frozen after setup, not autonomous',errors:[],audioRequests:[],steps:[]};
    page.on('pageerror',e=>report.errors.push(e.message));page.on('request',r=>{if(/\/audios\//.test(r.url()))report.audioRequests.push(r.url());});
    try {
      await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'networkidle',timeout:120000});
      await page.waitForFunction(()=>window.__journeyAudioProbe&&window.__goalAstronautTelemetry?.glbLoaded,{},{timeout:90000});
      report.initial=await page.evaluate(()=>window.__journeyAudioProbe());assert.equal(report.initial.contextCreations,0);assert.equal(report.initial.loops,0);
      if(width===390){
        assert.equal(await page.locator('#header-right-sound-btn').isVisible(),false);
        await page.getByRole('button',{name:'Play Showreel',exact:true}).tap();
        await page.locator('#video-overlay__mute-btn').tap();
        await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
        await page.getByRole('button',{name:'Close video overlay',exact:true}).click();
        report.mobilePolicy='Existing mobile header sound control remains hidden. Explicit existing showreel UNMUTE enables the shared engine; no automatic sound.';
      }else await page.locator('#header-right-sound-btn').click();
      await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
      await page.evaluate(()=>{window.__audioFreezeRaf=true;});await page.waitForTimeout(1000);
      report.activation=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),gestures:window.__audioGestures}));assert.equal(report.activation.audio.loops,5);assert.ok(report.activation.gestures[0].active);
      report.recordStart=await page.evaluate(()=>window.__startAudioRecord());
      const points=[['solar',{e:.8}],['tesseract',{t:.36}],['white-transition',{t:.822}],['blue',{t:.94}],['glass',{s:.18}],['fracture',{s:.55}],['fracture',{s:.60}],['glass',{s:.18}],['fracture',{s:.55}],['contact',{s:1}],['blue',{t:.94}]];
      for(let i=0;i<points.length;i++){
        const [stage,point]=points[i];
        await page.evaluate(p=>{const r=window.__lusionInspector.homeGoalSectionRanges.items,t=window.__goalAstronautTelemetry;const y=p.e!==undefined?t.scrollForEmergence(p.e):p.s!==undefined?r.astronautDrop.pixelFrom+r.astronautDrop.pixelCount*p.s:r.blackTunnel.pixelFrom+(r.whiteTunnel.pixelTo-r.blackTunnel.pixelFrom)*p.t;window.__lusionInspector.scrollManager.scrollToPixel(y,true);},point);
        await page.waitForFunction(s=>window.__journeyAudioProbe().stage===s,stage);
        await page.waitForTimeout(650);
        const sample=await page.evaluate(()=>({at:performance.now(),audio:window.__journeyAudioProbe(),sourceId:window.__goalAstronautTelemetry.renderCount,scene:window.__goalAstronautTelemetry.sceneState,signal:window.__measureSound()}));
        assert.equal(sample.audio.stage,stage);assert.equal(sample.audio.loops,5);assert.equal(sample.audio.contextCreations,1);assert.ok(sample.signal.rms>0.00001);
        if([0,1,3,5,9].includes(i)){
          const file=`${width}-${i}-${stage}.jpg`;await page.screenshot({path:`${root}/${file}`,type:'jpeg',quality:65});sample.image=file;
          sample.afterCapture=await page.evaluate(()=>({at:performance.now(),sourceId:window.__goalAstronautTelemetry.renderCount}));assert.equal(sample.sourceId,sample.afterCapture.sourceId);
        }
        report.steps.push(sample);
        if(i===5||i===6)assert.equal(sample.audio.fractureEvents,1);
        if(i===8)assert.equal(sample.audio.fractureEvents,2);
      }
      const beforeHold=await page.evaluate(()=>window.__journeyAudioProbe());
      await page.mouse.move(width/2,500);await page.mouse.down();await page.waitForTimeout(200);await page.mouse.up();
      for(const type of ['pointercancel','lostpointercapture','blur'])await page.evaluate(t=>window.dispatchEvent(new Event(t)),type);
      const afterHold=await page.evaluate(()=>window.__journeyAudioProbe());assert.equal(afterHold.held,false);assert.equal(afterHold.cutoff,beforeHold.cutoff);
      report.unverifiedHoldPolicy={pointerDownBinding:false,motionRateChange:false,before:beforeHold,after:afterHold};
      if(width===1440){
        await page.locator('#header-right-sound-btn').click();await page.waitForTimeout(250);
        report.muted=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),signal:window.__measureSound()}));assert.equal(report.muted.audio.enabled,false);assert.ok(report.muted.signal.rms<0.000001);
        await page.locator('#header-right-sound-btn').click();await page.waitForTimeout(250);
        for(let n=0;n<4;n++)await page.locator('#header-right-sound-btn').click({delay:0});await page.waitForTimeout(250);
        report.restored=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),signal:window.__measureSound()}));assert.equal(report.restored.audio.stage,'blue');assert.equal(report.restored.audio.contextCreations,1);assert.equal(report.restored.audio.loops,5);assert.ok(report.restored.signal.rms>0.00001);
      }
      const recording=await page.evaluate(()=>window.__stopAudioRecord());fs.writeFileSync(`${root}/${width}-controlled.webm`,Buffer.from(recording.base64,'base64'));delete recording.base64;report.recording=recording;
      assert.deepEqual(report.audioRequests,[]);assert.deepEqual(report.errors,[]);
    }finally{fs.writeFileSync(`${root}/${width}.json`,JSON.stringify(report,null,2));await context.close();}
  }
  for(const failure of ['unsupported','resume','synthesis']){
    const context=await browser.newContext({viewport:{width:1440,height:900}});
    await context.addInitScript(mode=>{
      sessionStorage.setItem('lusion_booted_v1','1');window.__enableJourneyAudioProbe=true;
      const Native=window.AudioContext,resume=Native?.prototype.resume,buffer=Native?.prototype.createBuffer;
      window.__restoreAudioFailure=()=>{Object.defineProperty(window,'AudioContext',{value:Native});if(Native){Native.prototype.resume=resume;Native.prototype.createBuffer=buffer;}};
      if(mode==='unsupported'){Object.defineProperty(window,'AudioContext',{value:undefined});Object.defineProperty(window,'webkitAudioContext',{value:undefined});}
      if(mode==='resume')AudioContext.prototype.resume=()=>Promise.reject(new Error('test resume rejection'));
      if(mode==='synthesis')AudioContext.prototype.createBuffer=()=>{throw new Error('test synthesis allocation failure');};
    },failure);
    const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
    try{
      await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>window.__journeyAudioProbe&&window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:90000});
      await page.locator('#header-right-sound-btn').click();await page.waitForFunction(()=>window.__journeyAudioProbe().status==='unavailable');
      const result=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),scene:window.__goalAstronautTelemetry.sceneState}));assert.equal(result.audio.enabled,false);assert.equal(result.audio.loops,0);assert.deepEqual(errors,[]);
      await page.evaluate(()=>window.__restoreAudioFailure());await page.locator('#header-right-sound-btn').click();await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
      const recovered=await page.evaluate(()=>window.__journeyAudioProbe());assert.equal(recovered.loops,5);assert.equal(recovered.contextCreations,1);assert.deepEqual(errors,[]);
      fs.writeFileSync(`${root}/failure-${failure}.json`,JSON.stringify({failure,errors,...result,recovered},null,2));
    }finally{await context.close();}
  }
  const reduced=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});
  await reduced.addInitScript(installAudioCapture);const reducedPage=await reduced.newPage();
  try{
    await reducedPage.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'networkidle',timeout:120000});await reducedPage.waitForFunction(()=>window.__journeyAudioProbe&&window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:90000});
    const before=await reducedPage.evaluate(()=>window.__journeyAudioProbe());assert.equal(before.contextCreations,0);
    await reducedPage.locator('#header-right-sound-btn').click();await reducedPage.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
    await reducedPage.evaluate(()=>window.scrollTo(0,window.__goalAstronautTelemetry.playback.activation+10));await reducedPage.waitForTimeout(500);
    const after=await reducedPage.evaluate(()=>({audio:window.__journeyAudioProbe(),playback:{...window.__goalAstronautTelemetry.playback},signal:window.__measureSound()}));assert.equal(after.playback.state,'armed');assert.equal(after.audio.loops,5);assert.ok(after.signal.rms>.00001);
    fs.writeFileSync(`${root}/reduced-motion.json`,JSON.stringify({before,after},null,2));
  }finally{await reduced.close();}
  console.log('PASS real-browser desktop/mobile gesture, stage/reverse/visible fracture, shared source lifecycle, mute signal, unavailable/resume/synthesis fallback; original audio only. Reference listening and native cadence NOT certified.');
  }
}finally{await browser.close();}
