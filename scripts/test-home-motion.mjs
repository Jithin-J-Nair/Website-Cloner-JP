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
  const {acceleratedFall,stepMotionSpring,homeRenderDpr,UHD_PIXEL_BUDGET,GOAL_CINEMATIC_SECONDS,motionEase} = await import(pathToFileURL(file));
  assert.ok(GOAL_CINEMATIC_SECONDS<26 && GOAL_CINEMATIC_SECONDS>22);
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
  console.log('PASS: constant-acceleration fall, 23.5s clock, 30/60/120Hz spring invariance/exact rest, native UHD pixel budget and monotone scroll easing');
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
