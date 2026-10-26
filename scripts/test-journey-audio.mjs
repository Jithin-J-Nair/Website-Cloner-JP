#!/usr/bin/env node
/** Deterministic state + fake WebAudio lifecycle/automation tests, not listening proof. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
fs.mkdirSync('temp',{recursive:true});
const dir=fs.mkdtempSync(path.resolve('temp/journey-audio-unit-'));
try {
  for(const name of ['audio','journey-audio-state','journey-score']){
    let text=fs.readFileSync(`src/lib/${name}.ts`,'utf8').replaceAll('"./journey-audio-state"','"./journey-audio-state.mjs"').replaceAll('"./journey-score"','"./journey-score.mjs"');
    fs.writeFileSync(`${dir}/${name}.mjs`,ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
  }
  const {JourneySoundEngine}=await import(pathToFileURL(`${dir}/audio.mjs`));
  const {journeyMix,IDLE_JOURNEY,crossesFracture}=await import(pathToFileURL(`${dir}/journey-audio-state.mjs`));
  const {createScore}=await import(pathToFileURL(`${dir}/journey-score.mjs`));
  const input=(values={})=>({...IDLE_JOURNEY,active:true,...values});
  const tick=async()=>{await Promise.resolve();await Promise.resolve();};
  class Param {
    value=0;calls=[];
    setValueAtTime(v,t){this.value=v;this.calls.push(['set',v,t]);return this;}
    linearRampToValueAtTime(v,t){this.value=v;this.calls.push(['linear',v,t]);return this;}
    cancelScheduledValues(t){this.calls.push(['cancel',t]);return this;}
  }
  class Node {
    connections=[];gain=new Param();frequency=new Param();Q=new Param();threshold=new Param();knee=new Param();ratio=new Param();attack=new Param();release=new Param();
    connect(n){this.connections.push(n);return n;}disconnect(){this.connections=[];}
    start(at){this.startAt=at;this.started=(this.started||0)+1;assert.equal(this.started,1);}
    stop(){this.stopped=true;this.onended?.();}
  }
  class Context {
    currentTime=0;state='suspended';destination=new Node();sources=[];gains=[];filters=[];resumes=0;
    createGain(){let n=new Node();this.gains.push(n);return n;}
    createBiquadFilter(){let n=new Node();this.filters.push(n);return n;}
    createDynamicsCompressor(){return new Node();}
    createBufferSource(){let n=new Node();this.sources.push(n);return n;}
    createOscillator(){let n=new Node();this.sources.push(n);return n;}
    createBuffer(channels,length,rate){const data=Array.from({length:channels},()=>new Float32Array(length));return {duration:length/rate,sampleRate:rate,length,numberOfChannels:channels,getChannelData:i=>data[i]};}
    resume(){this.resumes++;this.state='running';this.onstatechange?.();return Promise.resolve();}
    suspend(){this.state='suspended';this.onstatechange?.();return Promise.resolve();}
    close(){this.state='closed';return Promise.resolve();}
  }
  // Browser lifecycle, without a real context or auto-unlock.
  const oldWindow=globalThis.window,oldDocument=globalThis.document;
  globalThis.window=new EventTarget();globalThis.document=new EventTarget();globalThis.document.visibilityState='visible';
  let creations=0;const ctx=new Context(),engine=new JourneySoundEngine(()=>{creations++;return ctx;});
  const detach=engine.attach(),journey=engine.acquireJourney();
  journey.update(input({tunnel:.94}));await tick();
  assert.equal(creations,0);assert.equal(engine.snapshot().loops,0);engine.playClick();assert.equal(ctx.sources.length,0);
  console.log('PASS silence before explicit enable; state handoff does not create context/nodes');
  engine.setEnabled(true);engine.setEnabled(false);engine.setEnabled(true);engine.setEnabled(true);await tick();
  assert.equal(creations,1);assert.equal(engine.snapshot().loops,5);assert.equal(ctx.sources.filter(n=>n.loop).length,5);assert.equal(new Set(ctx.sources.map(n=>n.startAt)).size,1);assert.ok(ctx.gains.slice(3).every(g=>g.gain.calls.some(c=>c[0]==='set'&&c[1]===0&&c[2]===.025)),'hold zero until scheduled common start, then fade');
  const count=ctx.sources.length;engine.setEnabled(false);assert.equal(ctx.gains[0].gain.calls.at(-1)[1],0);engine.setEnabled(true);await tick();assert.equal(ctx.sources.length,count);
  console.log('PASS async enable cancellation, rapid toggling and shared coherent loop sources');
  ctx.currentTime=.045;journey.update(input({tunnel:.36}));await tick();
  const firstHeld=ctx.gains[6].gain.calls.at(-2);assert.equal(firstHeld[0],'set');assert.ok(Math.abs(firstHeld[1]-(.70*.020/.09))<1e-9,'replace from actual fractional ramp, not stale AudioParam target');
  ctx.currentTime=.060;journey.update(input({tunnel:.94}));await tick();
  const secondHeld=ctx.gains[6].gain.calls.at(-2);assert.ok(Math.abs(secondHeld[1]-(firstHeld[1]+(.08-firstHeld[1])*.015/.09))<1e-9);ctx.currentTime=.2;
  const cases=[['home',{active:false}],['black-title',{title:true}],['solar',{emergence:true}],['tesseract',{tunnel:.4}],['white-transition',{tunnel:.822}],['blue',{tunnel:.94}],['glass',{tunnel:1,drop:.18}],['fracture',{tunnel:1,drop:.55,fractureVisible:true}],['contact',{tunnel:1,drop:1,wait:.2}]];
  for(const [name,values]of cases)assert.equal(journeyMix(input(values)).stage,name);
  for(const values of [{tunnel:.94},{tunnel:.822},{tunnel:.4},{emergence:true}]){journey.update(input(values));await tick();assert.equal(engine.snapshot().stage,journeyMix(input(values)).stage);}
  journey.update(input({tunnel:.4}));journey.update(input({tunnel:.94}));journey.update(input({tunnel:.822}));await tick();assert.equal(engine.snapshot().stage,'white-transition');
  assert.equal(ctx.filters[0].frequency.calls.at(-1)[2],ctx.currentTime+.09);
  assert.equal(ctx.filters[1].frequency.calls.at(-1)[2],.12,'unchanged targets do not append automation');
  assert.equal(ctx.sources.length,count);console.log('PASS every stage, continuous crossfade boundaries, reverse and rapid latest-state replacement');
  const stableNodes=ctx.gains.length;
  for(let i=0;i<100;i++){journey.update(input({tunnel:i/100}));await tick();}
  assert.equal(ctx.gains.length,stableNodes);assert.equal(ctx.filters.length,2);
  for(const boundary of [.785,.865]){const a=journeyMix(input({tunnel:boundary-1e-7})),b=journeyMix(input({tunnel:boundary+1e-7}));assert.ok(a.gains.every((v,i)=>Math.abs(v-b.gains[i])<1e-4));}
  for(const boundary of [.30,.92,.99]){const a=journeyMix(input({tunnel:1,drop:boundary-1e-7})),b=journeyMix(input({tunnel:1,drop:boundary+1e-7}));assert.ok(a.gains.every((v,i)=>Math.abs(v-b.gains[i])<1e-4));}
  const a=journeyMix(input({tunnel:.785-1e-7})),b=journeyMix(input({tunnel:.785+1e-7}));assert.ok(a.gains.every((v,i)=>Math.abs(v-b.gains[i])<1e-6));
  journey.update(input({tunnel:.94}));await tick();const cutoff=engine.snapshot().cutoff;
  engine.setHeld(true);await tick();assert.equal(ctx.filters[1].frequency.calls.at(-1)[1],650);assert.equal(engine.snapshot().cutoff,cutoff);
  for(const event of ['pointerup','pointercancel','lostpointercapture','blur']){engine.setHeld(true);await tick();window.dispatchEvent(new Event(event));await tick();assert.equal(engine.snapshot().held,false);assert.equal(ctx.filters[1].frequency.calls.at(-1)[1],11000);assert.equal(engine.snapshot().cutoff,cutoff);}
  console.log('PASS composable hold API and every interruption release; production pointer-down intentionally unbound');
  journey.update(input({tunnel:1,drop:.2}));await tick();journey.update(input({tunnel:1,drop:.4,fractureVisible:true}));await tick();assert.equal(engine.snapshot().fractureEvents,1);
  for(let i=0;i<10;i++){journey.update(input({tunnel:1,drop:.5,fractureVisible:true}));await tick();}assert.equal(engine.snapshot().fractureEvents,1);
  journey.update(input({tunnel:1,drop:.2}));await tick();journey.update(input({tunnel:1,drop:.5,fractureVisible:true}));await tick();assert.equal(engine.snapshot().fractureEvents,2);
  assert.equal(ctx.sources.at(-1).connections[0].connections[0],ctx.gains[2]);assert.equal(ctx.gains[2].connections[0],ctx.gains[0]);assert.equal(ctx.gains[1].connections[0],ctx.gains[0]);
  engine.setEnabled(false);journey.update(input({tunnel:1,drop:.2}));journey.update(input({tunnel:1,drop:.5,fractureVisible:true}));await tick();engine.setEnabled(true);await tick();assert.equal(engine.snapshot().fractureEvents,2);
  assert.equal(crossesFracture(null,input({drop:.5,fractureVisible:true})),false);
  assert.equal(crossesFracture(input({drop:.2}),input({drop:1,wait:.4})),false);
  assert.equal(crossesFracture(input({drop:.8,fractureVisible:true}),input({drop:.5,fractureVisible:true})),false);
  console.log('PASS fracture sampled visible rising edge, forward/reverse replay, mute, skip, first-entry suppression');
  journey.update(input({paused:true,tunnel:.94}));await tick();assert.equal(ctx.gains[1].gain.calls.at(-1)[1],0);assert.equal(ctx.gains[2].gain.calls.at(-1)[1],0);
  journey.update(input({tunnel:.94}));await tick();document.visibilityState='hidden';document.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(ctx.state,'suspended');assert.equal(ctx.gains[0].gain.calls.at(-1)[1],0);
  document.visibilityState='visible';document.dispatchEvent(new Event('visibilitychange'));await tick();assert.equal(ctx.state,'running');assert.equal(engine.snapshot().loops,5);
  engine.setOverlayPaused(true);await tick();assert.equal(engine.snapshot().paused,true);assert.equal(ctx.gains[1].gain.calls.at(-1)[1],0);assert.equal(ctx.gains[2].gain.calls.at(-1)[1],0);engine.setOverlayPaused(false);await tick();assert.equal(engine.snapshot().loops,5);
  const successor=engine.acquireJourney();successor.update(input({emergence:true}));journey.release();await tick();assert.equal(engine.snapshot().stage,'solar');successor.release();await tick();assert.equal(engine.snapshot().stage,'home');
  detach();assert.equal(engine.snapshot().loops,0);const reattach=engine.attach();engine.setEnabled(true);await tick();assert.equal(creations,1);assert.equal(engine.snapshot().loops,5);reattach();engine.dispose();
  console.log('PASS pause, visibility, stale lease/unmount, remount and bounded source lifecycle');
  const missing=new JourneySoundEngine(()=>null);assert.equal(missing.setEnabled(false),false);assert.equal(missing.setEnabled(true),false);assert.equal(missing.snapshot().status,'unavailable');
  const failing=new Context();failing.resume=()=>Promise.reject(new Error('blocked'));const failed=new JourneySoundEngine(()=>failing);failed.setEnabled(true);await tick();await tick();assert.equal(failed.snapshot().status,'unavailable');assert.equal(failed.isEnabled(),false);failed.dispose();
  const broken=new Context();broken.createBuffer=()=>{throw new Error('buffer allocation failed');};const synthesisFailure=new JourneySoundEngine(()=>broken);synthesisFailure.setEnabled(true);await tick();await tick();assert.equal(synthesisFailure.snapshot().status,'unavailable');assert.equal(synthesisFailure.snapshot().loops,0);synthesisFailure.dispose();
  const partial=new Context(),originalFilter=partial.createBiquadFilter;let deny=true;partial.createBiquadFilter=function(){if(deny)throw new Error('node creation denied');return originalFilter.call(this);};const retry=new JourneySoundEngine(()=>partial);assert.equal(retry.setEnabled(true),false);assert.equal(retry.getStatus(),'unavailable');assert.ok(partial.gains.every(n=>n.connections.length===0));deny=false;assert.equal(retry.setEnabled(true),true);await tick();assert.equal(retry.snapshot().loops,5);assert.equal(retry.snapshot().contextCreations,1);partial.createOscillator=()=>{throw new Error('transient denied');};assert.doesNotThrow(()=>retry.playHover());assert.equal(retry.getStatus(),'unavailable');assert.equal(retry.snapshot().loops,0);retry.dispose();
  const c1=new Context(),c2=new Context();let ci=0;const closed=new JourneySoundEngine(()=>ci++===0?c1:c2);closed.setEnabled(true);await tick();await c1.close();c1.onstatechange();closed.setEnabled(true);await tick();assert.equal(closed.snapshot().loops,5);assert.equal(closed.snapshot().contextCreations,2);assert.ok(c1.sources.every(s=>s.stopped));closed.dispose();
  const hiddenRemount=new JourneySoundEngine(()=>new Context());document.visibilityState='hidden';let d=hiddenRemount.attach();assert.equal(hiddenRemount.snapshot().hidden,true);d();document.visibilityState='visible';d=hiddenRemount.attach();assert.equal(hiddenRemount.snapshot().hidden,false);d();hiddenRemount.dispose();
  const c=new Context(),score=createScore(c);assert.equal(score.size,5);
  for(const buffer of score.values()){const l=buffer.getChannelData(0);assert.ok(l.every(Number.isFinite));assert.ok(Math.max(...l.subarray(0,1000))<.7);assert.ok(Math.abs(l[0]-l.at(-1))<.02,'continuous loop seam');}
  const rms=b=>{let s=0;for(const v of b.getChannelData(0))s+=v*v;return Math.sqrt(s/b.length);};assert.ok(new Set([...score.values()].map(b=>rms(b).toFixed(4))).size>=3);
  globalThis.window=oldWindow;globalThis.document=oldDocument;
  console.log('PASS unsupported/rejected context fallback; original finite, bounded, distinct looping stems; no audio URL/decode dependency');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
