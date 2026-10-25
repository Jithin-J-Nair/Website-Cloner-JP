#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
fs.mkdirSync('temp',{recursive:true});
const dir = fs.mkdtempSync(path.resolve('temp/home-motion-unit-'));
try {
  const output = ts.transpileModule(fs.readFileSync('src/lib/home-motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const file = path.join(dir,'motion.mjs');
  fs.writeFileSync(file,output);
  const {advanceCinematicProgress,acceleratedFall,stepMotionSpring,homeRenderDpr,cinematicRenderDpr,blueFlightDistance,UHD_PIXEL_BUDGET,GOAL_CINEMATIC_SECONDS,motionEase} = await import(pathToFileURL(file));
  assert.ok(GOAL_CINEMATIC_SECONDS<26 && GOAL_CINEMATIC_SECONDS>22);
  for (const dt of [1/120,1/60,1/30,.25,.5,1,2]) {
    let progress=0,elapsed=0;
    while(elapsed<GOAL_CINEMATIC_SECONDS-1e-9) {
      const step=Math.min(dt,GOAL_CINEMATIC_SECONDS-elapsed);
      progress=advanceCinematicProgress(progress,step);elapsed+=step;
      assert.ok(Math.abs(progress-elapsed/GOAL_CINEMATIC_SECONDS)<1e-10,'same elapsed time must map to the same progress, including slow frames');
    }
    assert.ok(Math.abs(progress-1)<1e-10);
  }
  assert.ok(Math.abs(advanceCinematicProgress(.2,.65)-(.2+.65/GOAL_CINEMATIC_SECONDS))<1e-12,'a visible stall must not be truncated');
  assert.equal(advanceCinematicProgress(.2,-1),.2);
  assert.equal(advanceCinematicProgress(.2,NaN),.2);
  assert.equal(advanceCinematicProgress(0,100),1);
  assert.equal(acceleratedFall(-1),0); assert.equal(acceleratedFall(2),1);
  let lastVelocity = -Infinity;
  for(let i=1;i<1000;i++) {
    const t=i/1000, epsilon=1e-5;
    const velocity=(acceleratedFall(t+epsilon)-acceleratedFall(t-epsilon))/(2*epsilon);
    assert.ok(velocity>lastVelocity,'fall speed must increase throughout the free-fall interval');
    lastVelocity=velocity;
  }
  const states=[];
  for(const hz of [30,60,120]) {
    const spring={value:0,velocity:0};
    for(let i=0;i<hz/2;i++) stepMotionSpring(spring,1,1/hz);
    states.push({...spring});
    for(let i=0;i<hz*3;i++) stepMotionSpring(spring,0,1/hz);
    assert.deepEqual(spring,{value:0,velocity:0},'spring returns exactly to rest');
  }
  for(const state of states.slice(1)) {
    assert.ok(Math.abs(state.value-states[0].value)<1e-10);
    assert.ok(Math.abs(state.velocity-states[0].velocity)<1e-10);
  }
  for(const [width,height] of [[390,844],[1440,900],[1920,1080],[3840,2160],[7680,4320]]) {
    for(const dpr of [1,1.5,2,3]) {
      const ratio=homeRenderDpr(width,height,dpr);
      assert.ok(width*height*ratio*ratio <= UHD_PIXEL_BUDGET+1);
      assert.ok(ratio<=dpr);
    }
  }
  assert.equal(homeRenderDpr(3840,2160,2),1);
  assert.equal(homeRenderDpr(1920,1080,2),2);
  for(let i=0;i<1000;i++) assert.ok(motionEase(i/1000)<=motionEase((i+1)/1000));
  assert.equal(cinematicRenderDpr(3840,2160,2,false,false),1);
  assert.equal(cinematicRenderDpr(3840,2160,2,true,true),1);
  assert.ok(cinematicRenderDpr(1440,900,1,true,false)<1);
  assert.ok(blueFlightDistance(1,.5)>blueFlightDistance(1,0),'corridor keeps moving during glass approach');
  let previous=-1;
  for(let i=0;i<=200;i++) {
    const phase=i/100;
    const distance=blueFlightDistance(Math.min(1,phase),Math.max(0,phase-1));
    assert.ok(distance>=previous); previous=distance;
  }
  assert.ok(Math.abs(blueFlightDistance(1,0)-blueFlightDistance(1-1e-7,0))<.001);
  const opticsFile=path.join(dir,'optics.mjs');
  fs.writeFileSync(opticsFile,ts.transpileModule(fs.readFileSync('src/lib/solar-optics.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
  const {solarOcclusion,solarAcceptance,solarFocalScale}=await import(pathToFileURL(opticsFile));
  const camera={x:0,y:0,z:0}, source={x:0,y:0,z:-10};
  assert.equal(solarOcclusion(camera,source,{x:0,y:0,z:-5},1),0);
  assert.equal(solarOcclusion(camera,source,{x:3,y:0,z:-5},1),1);
  assert.equal(solarOcclusion(camera,source,{x:0,y:0,z:5},1),1);
  assert.equal(solarOcclusion(camera,source,{x:0,y:0,z:-15},1),1);
  assert.ok(solarOcclusion(camera,source,{x:1,y:0,z:-5},1)>.4);
  assert.equal(solarAcceptance(.5,.5,-1,1),0);
  assert.equal(solarAcceptance(.5,.5,1,0),0);
  assert.ok(solarAcceptance(.5,.5,1,1)>solarAcceptance(1.5,.5,1,1));
  assert.ok(solarAcceptance(-2,1,.55,1,.46)>solarAcceptance(-2,1,.55,1,1),"portrait pupil uses height-normalized overscan");
  assert.equal(solarFocalScale(44),1);
  assert.ok(solarFocalScale(18)>solarFocalScale(44));
  assert.ok(solarFocalScale(52)<solarFocalScale(44));
  for (const fov of [-1,0,1,18,44,52,179,180,Infinity,NaN]) {
    assert.ok(Number.isFinite(solarFocalScale(fov)) && solarFocalScale(fov)>0 && solarFocalScale(fov)<2);
  }
  assert.ok(Math.abs(solarFocalScale(30)-solarFocalScale(30.0001))<1e-4);
  const timerFile=path.join(dir,'gpu-timer.mjs');
  fs.writeFileSync(timerFile,ts.transpileModule(fs.readFileSync('src/lib/gpu-frame-timer.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
  const {createGpuFrameTimer}=await import(pathToFileURL(timerFile));
  const mockGl=(supported=true,limit=3)=>{
    const state={created:0,deleted:0,begins:0,ends:0,reads:0,ready:false,disjoint:false,lost:false};
    const gl={QUERY_RESULT_AVAILABLE:1,QUERY_RESULT:2,
      getExtension:()=>supported?{TIME_ELAPSED_EXT:3,GPU_DISJOINT_EXT:4}:null,
      createQuery:()=>state.created<limit?{id:++state.created}:null,
      deleteQuery:()=>state.deleted++, isContextLost:()=>state.lost,
      getParameter:()=>state.disjoint,
      getQueryParameter:(_,key)=>key===1?state.ready:(state.reads++,2e6),
      beginQuery:()=>state.begins++,endQuery:()=>state.ends++};
    return {gl,state};
  };
  const unsupported=mockGl(false);
  assert.equal(createGpuFrameTimer(unsupported.gl,()=>{},()=>{}),null);
  assert.equal(unsupported.state.created,0);
  const partial=mockGl(true,2);
  assert.equal(createGpuFrameTimer(partial.gl,()=>{},()=>{}),null);
  assert.equal(partial.state.deleted,2,'partial allocation is released');
  const {gl,state}=mockGl(), results=[];
  let disjoints=0;
  const timer=createGpuFrameTimer(gl,(ms,phase)=>results.push({ms,phase}),()=>disjoints++);
  for(let i=0;i<20;i++){timer.begin('solar');timer.end();}
  assert.equal(state.created,3);assert.equal(state.begins,3);
  assert.equal(state.reads,0,'busy query ring must not read unavailable results or block');
  state.ready=true;timer.begin('blue');timer.end();
  assert.deepEqual(results,[{ms:2,phase:'solar'},{ms:2,phase:'solar'},{ms:2,phase:'solar'}]);
  state.disjoint=true;timer.begin('shatter');timer.end();
  assert.equal(disjoints,1);assert.equal(results.length,3);
  state.disjoint=false;state.lost=true;timer.begin('shatter');timer.end();
  assert.equal(state.begins,4,'context loss must skip query operations');
  state.lost=false;timer.begin('shatter');timer.begin('shatter');
  assert.equal(state.begins,5,'nested begin cannot create overlapping queries');
  timer.dispose();timer.dispose();timer.begin('solar');timer.end();
  assert.equal(state.ends,5);assert.equal(state.deleted,3);
  assert.equal(state.created,3,'disposed timer cannot allocate or restart');
  const lostDuringFrame=mockGl();
  const lostTimer=createGpuFrameTimer(lostDuringFrame.gl,()=>{},()=>{});
  lostTimer.begin('solar');lostDuringFrame.state.lost=true;lostTimer.end();lostTimer.dispose();
  assert.equal(lostDuringFrame.state.ends,0,'context loss between begin/end cannot end an invalid query');

  const {summarizeGpuQueries}=await import('./lib/summarize-gpu-queries.mjs');
  const entry=(id,ms,phase)=>({id,ms,phase});
  const snapshots=[
    {name:'solar',telemetry:{gpuTiming:{recent:[entry(1,2,'solar'),entry(0,0,'')]}}},
    {name:'tesseract',telemetry:{gpuTiming:{recent:[entry(1,2,'solar'),entry(2,4,'solar'),entry(3,8,'tesseract')]}}},
    {name:'blue',telemetry:{gpuTiming:{recent:[entry(3,8,'tesseract'),entry(4,10,'blue'),entry(5,NaN,'blue')]}}},
    {name:'shatter'},
  ];
  assert.deepEqual(summarizeGpuQueries(snapshots),[
    {phase:'solar',samples:2,executionMs:{mean:3,p50:4,p95:4}},
    {phase:'tesseract',samples:1,executionMs:{mean:8,p50:8,p95:8}},
    {phase:'blue',samples:1,executionMs:{mean:10,p50:10,p95:10}},
    {phase:'shatter',samples:0,executionMs:null},
  ],'late completions keep their originating phase, without duplicate or invalid samples');
  console.log('PASS: deferred GPU results are phase-correct and deduplicated; unavailable is null');
  console.log('PASS: bounded focal response; nonblocking GPU query ring, phase tags, unavailable/disjoint/context-loss paths and idempotent disposal');
  console.log(`PASS: accelerating fall, ${GOAL_CINEMATIC_SECONDS}s clock, springs, UHD/software budget, continuous blue approach, soft solar occlusion and pupil acceptance`);
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
