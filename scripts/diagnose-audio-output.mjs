#!/usr/bin/env node
/** Real production UI + serial analyser IN the destination path. Not physical listening proof. */
import fs from 'node:fs';import assert from 'node:assert/strict';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const out='temp/about-audit/audio-output';fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser({audibleOutput:true});
try{
 const commandLine=async b=>{const cdp=await b.newBrowserCDPSession();const {processInfo}=await cdp.send('SystemInfo.getProcessInfo');const pid=processInfo.find(p=>p.type==='browser').id;await cdp.detach();return fs.readFileSync(`/proc/${pid}/cmdline`,'utf8').split('\0').filter(Boolean);};
 const args=await commandLine(browser);assert.ok(!args.includes('--mute-audio'));
 const legacy=await launchMotionBrowser();const oldArgs=await commandLine(legacy);assert.ok(oldArgs.includes('--mute-audio'));await legacy.close();
 fs.writeFileSync(`${out}/launch.json`,JSON.stringify({args,defaultHarnessMuted:oldArgs.includes('--mute-audio'),physicalSpeakerListening:false,note:'Playwright default mute removed explicitly. No autoplay-policy bypass added.'},null,2));
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390});
  await context.addInitScript(()=>{
   sessionStorage.setItem('lusion_booted_v1','1');window.__enableJourneyAudioProbe=true;
   window.__contexts=[];window.__audioEdges=[];const Native=window.AudioContext;
   window.AudioContext=class extends Native{constructor(...args){super(...args);window.__contexts.push({ctx:this,userGesture:navigator.userActivation.isActive});}};
   const connect=AudioNode.prototype.connect;
   AudioNode.prototype.connect=function(target,...args){
    window.__audioEdges.push([this.constructor.name,target?.constructor.name]);
    if(target===this.context.destination){
     const analyser=this.context.createAnalyser();analyser.fftSize=2048;
     Reflect.apply(connect,this,[analyser]);Reflect.apply(connect,analyser,[target]);
     window.__sink={analyser,ctx:this.context,sourceType:this.constructor.name,destination:target.constructor.name};return target;
    }
    return Reflect.apply(connect,this,[target,...args]);
   };
   const gain=Native.prototype.createGain;window.__gains=[];Native.prototype.createGain=function(){const n=Reflect.apply(gain,this,[]);window.__gains.push(n);return n;};
   window.__measureDestination=()=>{if(!window.__sink)return null;const {analyser,ctx}=window.__sink;const a=new Float32Array(2048);analyser.getFloatTimeDomainData(a);return {rms:Math.sqrt(a.reduce((sum,v)=>sum+v*v,0)/a.length),peak:Math.max(...a.map(Math.abs)),contextState:ctx.state,audioTime:ctx.currentTime,gains:window.__gains.map(n=>n.gain.value),sourceType:window.__sink.sourceType,destination:window.__sink.destination,channelCount:ctx.destination.channelCount,maxChannelCount:ctx.destination.maxChannelCount};};
  });
  const page=await context.newPage(),report={width,errors:[],physicalAudibility:'NOT VERIFIED',samples:[]};page.on('pageerror',e=>report.errors.push(e.message));
  try{
   await page.goto('http://127.0.0.1:3000/',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded&&window.__journeyAudioProbe,null,{timeout:90000});
   assert.equal(await page.evaluate(()=>window.__contexts.length),0);
   const button=page.locator('#header-right-sound-btn');assert.ok(await button.isVisible());if(width===390)await button.tap();else await button.click();
   await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');await page.waitForTimeout(500);
   report.enabled=await page.evaluate(()=>({engine:window.__journeyAudioProbe(),sink:window.__measureDestination(),gesture:window.__contexts[0].userGesture,edges:window.__audioEdges}));assert.equal(report.enabled.gesture,true);assert.equal(report.enabled.sink.sourceType,'DynamicsCompressorNode');assert.equal(report.enabled.sink.destination,'AudioDestinationNode');assert.ok(report.enabled.sink.rms>1e-6);
   await page.evaluate(()=>{window.__sinkSamples=[];window.__sinkTimer=setInterval(()=>{const audio=window.__journeyAudioProbe();delete audio.events;window.__sinkSamples.push({at:performance.now(),audio,signal:window.__measureDestination(),playback:{...window.__goalAstronautTelemetry.playback}});},150);window.scrollTo(0,window.__goalAstronautTelemetry.playback.activation+2);});
   await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.progress>=.25&&window.__goalAstronautTelemetry.playback.state==='playing',null,{timeout:120000});
   await page.mouse.click(width*.97,width===390?400:440);await page.keyboard.press('Space');await page.waitForFunction(()=>window.__journeyAudioProbe().paused);await page.waitForTimeout(300);report.keyboardPause=await page.evaluate(()=>({audio:window.__journeyAudioProbe(),signal:window.__measureDestination()}));assert.equal(report.keyboardPause.signal.rms,0);
   await page.keyboard.press('Space');await page.waitForFunction(()=>!window.__journeyAudioProbe().paused);report.keyboardResumed=true;
   await page.waitForFunction(()=>window.__goalAstronautTelemetry.playback.state==='completed',null,{timeout:240000});
   report.samples=await page.evaluate(()=>{clearInterval(window.__sinkTimer);return window.__sinkSamples;});assert.ok(new Set(report.samples.map(s=>s.audio.stage)).size>=3);
   await button.click();await page.waitForTimeout(250);report.muted=await page.evaluate(()=>({engine:window.__journeyAudioProbe(),signal:window.__measureDestination()}));assert.equal(report.muted.signal.rms,0);
   await button.click();await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');
   await page.evaluate(()=>window.__contexts[0].ctx.suspend());await page.waitForFunction(()=>window.__journeyAudioProbe().status==='suspended');await page.getByRole('button',{name:'Resume studio sound',exact:true}).click();await page.waitForFunction(()=>window.__journeyAudioProbe().status==='on');report.suspendedContextResumed=true;
   await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();await page.locator('#header-menu-links a[href="/about"]').first().click();await page.waitForURL('http://127.0.0.1:3000/about');await page.waitForFunction(()=>window.__journeyAudioProbe().paused===false);await page.waitForTimeout(300);
   report.about=await page.evaluate(()=>({engine:window.__journeyAudioProbe(),signal:window.__measureDestination()}));assert.equal(report.about.engine.loops,5);assert.equal(report.about.engine.contextCreations,1);assert.ok(report.about.signal.rms>1e-6);
   await page.goBack();await page.waitForURL('http://127.0.0.1:3000/');await page.getByRole('button',{name:'Play Showreel',exact:true}).click();await page.waitForFunction(()=>window.__journeyAudioProbe().paused);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>window.__measureDestination().rms),0);
   const reelMute=page.locator('#video-overlay__mute-btn');assert.equal((await reelMute.textContent()).trim(),'MUTE');await reelMute.click();assert.equal(await page.evaluate(()=>window.__journeyAudioProbe().enabled),false);assert.equal((await reelMute.textContent()).trim(),'UNMUTE');await reelMute.click();assert.equal(await page.evaluate(()=>window.__journeyAudioProbe().enabled),true);await reelMute.click();assert.equal(await page.evaluate(()=>window.__journeyAudioProbe().enabled),false);report.reelSharedMute=true;await page.getByRole('button',{name:'Close video overlay',exact:true}).click();
   report.final=await page.evaluate(()=>window.__journeyAudioProbe());assert.equal(report.final.contextCreations,1);assert.equal(report.final.loops,5);assert.deepEqual(report.errors,[]);
  }finally{fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await context.close();}
 }
 console.log('PASS real UI desktop/touch activation, serial destination signal, native stages, mute, routing/return and reel controls. Physical audibility remains NOT VERIFIED.');
}finally{await browser.close();}
