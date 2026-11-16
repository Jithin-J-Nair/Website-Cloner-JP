#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import { pathToFileURL } from 'node:url';
const homeMarkup = fs.readFileSync('src/components/home/HomePageView.tsx','utf8');
assert.ok(homeMarkup.includes('text-[5vw]') && homeMarkup.includes('min-[813px]:text-[2.25vw]'), 'Japanese hero uses responsive sizes for its three requested lines');
for (const line of ['アイデアを、確かな技術で形にする。', 'Web・AI・自動化を通じて、', '課題を解決する仕組みをつくる。']) assert.ok(homeMarkup.includes(line), 'requested Japanese hero line is present');
assert.ok(homeMarkup.includes('min-[813px]:pt-[calc(var(--vh,1vh)*5.3)]'), 'desktop hero title aligns with the reference top edge');
assert.ok(homeMarkup.includes('min-[813px]:mt-[calc(var(--base-padding-y)*0.9)]'), 'desktop stage top aligns with the reference');
assert.ok(homeMarkup.includes('min-[813px]:mb-[calc(var(--base-padding-y)*0.05)]'), 'desktop stage bottom aligns with the reference');
assert.ok(homeMarkup.includes('min-[813px]:pb-[calc(var(--base-padding-y)*0.94)]'), 'desktop section bottom matches the reference viewport');
assert.ok(homeMarkup.includes('min-[813px]:bottom-0'), 'desktop scroll cue sits on the reference bottom edge');
assert.ok(homeMarkup.includes('mb-[calc(var(--base-padding-y)*1.35)]'), 'mobile stage bottom aligns with the reference');
fs.mkdirSync('temp',{recursive:true});
const dir = fs.mkdtempSync(path.resolve('temp/home-motion-unit-'));
try {
  const output = ts.transpileModule(fs.readFileSync('src/lib/home-motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const file = path.join(dir,'motion.mjs');
  fs.writeFileSync(file,output);
  const {advanceCinematicProgress,acceleratedFall,stepMotionSpring,homeRenderDpr,cinematicRenderDpr,blueFlightDistance,UHD_PIXEL_BUDGET,GOAL_CINEMATIC_SECONDS,motionEase} = await import(pathToFileURL(file));
  assert.equal(GOAL_CINEMATIC_SECONDS,20,'the guided journey spans exactly two complete score loops');
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
  assert.ok(acceleratedFall(0.25)>0.17,'astronaut reaches a stronger early descent than the previous curve');
  assert.ok(acceleratedFall(0.5)>0.39,'astronaut carries more speed through the middle of the fall');
  assert.ok(Math.abs(acceleratedFall(1)-1)<1e-12,'faster fall retains its exact endpoint');
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

  const homePageSource = fs.readFileSync('src/components/home/HomePageView.tsx','utf8');
  const heroSource = fs.readFileSync('src/components/home/HeroCrossesStage.tsx','utf8');
  const goalSource = fs.readFileSync('src/components/home/GoalTunnelSection.tsx','utf8');
  const nativeWorlds = fs.readFileSync('src/components/home/GoalReferenceWorlds.ts','utf8');
  const nativeShaders = fs.readFileSync('src/components/home/GoalReferenceShaders.ts','utf8');
  const nativeBloom = fs.readFileSync('src/components/home/GoalReferenceBloomPass.ts','utf8');
  const smoothSource = fs.readFileSync('src/components/foundation/SmoothScrollProvider.tsx','utf8');
  assert.ok(!homePageSource.includes('skewY(') && !homePageSource.includes('targetSkew'),
    'project cards do not shear or glitch with scroll velocity');
  assert.ok(heroSource.includes('api.software && !pointer.current.active && !responding'),
    'software idle throttling is disabled while the pointer is actively throwing connectors');
  assert.ok(heroSource.includes('}, 45)') && heroSource.includes('else wake()'),
    'software idle uses a bounded yield; hardware and active interaction schedule the next RAF directly');
  assert.ok(!goalSource.includes('home-goal-monitor-cracks') && !goalSource.includes('crackProgress'),
    'the synthetic crack overlay is completely removed');
  assert.ok(!goalSource.includes('lensPass') && !goalSource.includes('ShaderPass'),
    'the full-screen radial RGB glitch/dispersion pass is removed');
  // Supersedes tests that required invented thick glass cages, a separate
  // accretion disc, Snell/GGX shader and a compressed explosion. Those were
  // implementation assertions, not evidence of reference-video similarity.
  assert.ok(goalSource.includes('createGoalReferenceWorlds(track)') && !goalSource.includes('buildVortexHypercubeLattice') && !goalSource.includes('buildTunnelGlazing'),
    'the live owner uses captured architecture, not the old decorative worlds');
  const nativeEnd=fs.readFileSync('src/components/home/GoalReferenceEnd.ts','utf8');
  assert.ok(goalSource.includes('createGoalReferenceEnd(track, isMobileInit)')&&!goalSource.includes('buildDiamondsAndPopStickers')&&!goalSource.includes('buildVisorLedMatrix'),
    'Home end stage must use captured assets, not the removed canvas sticker / synthetic gem / visor approximations');
  assert.ok(nativeEnd.includes('diamond.buf')&&nativeEnd.includes('stickers_low.png')&&nativeEnd.includes('astronaut/face.png')&&nativeEnd.includes('blendSrcAlpha: THREE.ZeroFactor'),
    'native illustration alpha is coverage, not a full-plate bloom mask');
  assert.ok(goalSource.includes('idleSeconds * 60')&&goalSource.includes('visorOrientationLocal')&&goalSource.includes('endWords.forEach'),
    'the captured idle, sampled head card and individual glyph rolls share the existing animation owner');
  assert.ok(nativeWorlds.includes('GRID_SIZE: 20') && nativeWorlds.includes('instanceGridIds') && nativeWorlds.includes('a_instanceId'),
    'encoded grid placement and 16-block corridor instancing are retained');
  assert.ok(nativeShaders.includes('vec4 b=vec4(2.*a,ada-1.)/(1.+ada)') && nativeShaders.includes('pos=c.xyz/(1.-c.w)'),
    'the shaft itself performs the stereographic 4D fold');
  assert.ok(nativeShaders.includes('for(int l=-1;l<=1;l++)') && nativeShaders.includes('for(int i=-1;i<=1;i++)'),
    'the blue bands use the captured 81-neighbour 4D Voronoi field');
  assert.ok(nativeShaders.includes('cross(fdx,fdy)') && nativeShaders.includes('normalize(mix(posFrom,posTo,u_frameRatio))') && nativeShaders.includes('u_backgroundTexture'),
    'glass uses derivative normals, captured rigid endpoints and the live scene buffer');
  assert.ok(goalSource.includes('depthWrite: false, side: THREE.DoubleSide') && !goalSource.includes('buildGlassShardSideGeometry') && goalSource.includes('material.uniforms.u_fragmentScale.value = glassState.fragmentScale') && nativeWorlds.includes('1 - fit(progress, .75, 1)'),
    'transparent, non-depth-writing shards have no invented thickness and only shrink during the final quarter');
  assert.ok(nativeBloom.includes('THREE.UnsignedByteType') && nativeBloom.includes('THREE.FloatType') && nativeBloom.includes('gl_FragColor=vec4(texture2D(u_texture,v_uv).rgb+texture2D(u_bloom'),
    'clamped scene/bloom-cache and float FFT boundaries feed an opaque final display');
  assert.ok(nativeBloom.includes('HORIZTONAL: 1') && nativeShaders.includes('u_subtransformSize') && nativeShaders.includes('rotToCenter*vec2(1.0,20.0)'),
    'native diffraction is convolution of the source kernel, not arbitrary full-screen RGB distortion');
  assert.ok(goalSource.includes('outputPass.enabled = inEmergencePhase') && goalSource.includes('referenceBloom.enabled = !inEmergencePhase'),
    'ACES/sRGB emergence and the native unmanaged-color pipeline are not applied twice');
  assert.ok(goalSource.includes('nativeRatios.white * 79 : 79 + tShatter * 20') && !goalSource.includes('_invertedBasis'),
    'captured root timing/basis replaces hand-authored Euler spins and depth offsets');
  assert.ok(smoothSource.includes('duration: 0.92') && smoothSource.includes('smoothWheel: true'),
    'Lenis uses the tuned smooth-wheel profile');

  const downstreamOutput = ts.transpileModule(fs.readFileSync('src/components/home/GoalDownstreamScenes.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
  const downstreamFile = path.join(dir,'downstream.mjs');
  fs.writeFileSync(downstreamFile,downstreamOutput);
  const {createGoalPlaybackPath,createGlassFrameSampler} = await import(pathToFileURL(downstreamFile));
  const playback = createGoalPlaybackPath({emergenceStart:1000,emergenceSpan:1000,tunnelStart:2000,tunnelSpan:4000,imgOutTop:8000,endTop:10000,endHeight:1000,viewportH:1000});
  const shardPositions = new Float32Array([
    0,0,0,  1,0,0,  1.5,0,0,  3,0,0,  4,0,0,
  ]);
  const shardOrientations = new Float32Array([
    0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1,
  ]);
  const sampledPosition = new Float32Array(4);
  const sampledOrientation = new Float32Array(4);
  const sampleGlass = createGlassFrameSampler(shardPositions,shardOrientations,1,5,sampledPosition,sampledOrientation);
  for(let key=0;key<5;key++) {
    sampleGlass(key);
    assert.ok(Math.abs(sampledPosition[0]-shardPositions[key*3])<1e-6,"glass sampler preserves every captured position keyframe");
    assert.deepEqual(Array.from(sampledOrientation),[0,0,0,1],"quaternion keyframes remain normalized");
  }
  let shardPrevious=-Infinity;
  for(let i=0;i<=4000;i++) {
    sampleGlass(i/1000);
    assert.ok(sampledPosition[0]>=shardPrevious-1e-6,"shape-preserving shard interpolation must not reverse or overshoot a monotone axis");
    shardPrevious=sampledPosition[0];
  }
  const velocityAt=(frame,epsilon)=>{sampleGlass(frame+epsilon);const right=sampledPosition[0];sampleGlass(frame-epsilon);const left=sampledPosition[0];return (right-left)/(2*epsilon);};
  for(const key of [1,2,3]) assert.ok(Math.abs(velocityAt(key,0.001)-velocityAt(key,0.0005))<0.06,"glass velocity remains locally continuous at a captured frame boundary");
  assert.ok(shardPrevious<=4.00001,"shape-preserving interpolation cannot overshoot the final authored transform");
  for(const key of [1,2,3]) {
    sampleGlass(key);
    const atKey=sampledPosition[0];
    sampleGlass(key-0.01);
    const leftVelocity=(atKey-sampledPosition[0])/0.01;
    sampleGlass(key+0.01);
    const rightVelocity=(sampledPosition[0]-atKey)/0.01;
    assert.ok(Math.abs(leftVelocity-rightVelocity)<0.025,
      "PCHIP shares a continuous position tangent across adjacent captured-frame segments");
  }

  // A reversal / plateau must stay within each pair of authored keys without ringing.
  const reversingPositions = new Float32Array([0,0,0, 1,0,0, 1.5,0,0, 1.2,0,0, 0.5,0,0]);
  const reversingOutput = new Float32Array(4);
  const reversingSampler = createGlassFrameSampler(reversingPositions,shardOrientations,1,5,reversingOutput,new Float32Array(4));
  for(let segment=0;segment<4;segment++) {
    const low=Math.min(reversingPositions[segment*3],reversingPositions[(segment+1)*3]);
    const high=Math.max(reversingPositions[segment*3],reversingPositions[(segment+1)*3]);
    for(let step=0;step<=100;step++) {
      reversingSampler(segment+step/100);
      assert.ok(reversingOutput[0]>=low-1e-6 && reversingOutput[0]<=high+1e-6,
        "PCHIP cannot overshoot a reversing shard's authored segment bounds");
    }
  }
  for(let i=0;i<=100;i++) {
    reversingSampler(2+i/100);
    assert.ok(reversingOutput[0]<=1.500001 && reversingOutput[0]>=1.199999,
      "PCHIP remains shape-preserving through the reversal");
  }

  let priorY = -Infinity;
  for(let i=0;i<=1000;i++) {
    const y=playback(i/1000);
    assert.ok(y>=priorY-1e-6,'cinematic document path must remain monotone');
    priorY=y;
  }
  const drop = 8000 - 550, span = 10000 - drop;
  assert.ok(Math.abs((playback(.866)-playback(.83))/span-.42)<1e-6,'glass separation must occupy the compact one-beat segment');
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
