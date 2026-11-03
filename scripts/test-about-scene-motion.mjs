import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
fs.mkdirSync('temp',{recursive:true});
const dir=fs.mkdtempSync(path.resolve('temp/about-camera-'));
try {
 fs.writeFileSync(`${dir}/motion.mjs`,ts.transpileModule(fs.readFileSync('src/lib/about-scene-motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {aboutScenePose:pose}=await import(pathToFileURL(`${dir}/motion.mjs`));
 for(const mobile of [false,true]){
  const samples=[];
  for(let u=0;u<=11.25;u+=.001){
   const p=pose(u,mobile);assert.ok(Object.values(p).every(Number.isFinite));
   if(samples.length){const q=samples.at(-1).pose;for(const k of ['x','y','z','lookY'])assert.ok(Math.abs(p[k]-q[k])<.15,`continuous ${k} at ${u}`);}
   samples.push({u,pose:p});
  }
  for(const {u,pose:p}of samples.reverse())assert.deepEqual(pose(u,mobile),p,'reverse/fast seek has no hidden accumulated state');
  assert.ok(pose(3.55,mobile).z>pose(1.6,mobile).z*2,'wide basin is a distinct physical camera distance, not a scaled overlay');
  assert.ok(Math.abs(pose(5.35,mobile).z-(mobile?21.5:18.2))<1e-10,'return to existing editorial distance within floating-point precision');
  for(const u of [-1,NaN,Infinity])assert.deepEqual(pose(u,mobile),pose(0,mobile));
  // All joins are C1: the slope approaches the same value on both sides.
  for(const u of [.05,1.45,mobile?2.75:1.7,mobile?3.5:3.15,3.6,5,6.2,6.95]){
   const a=pose(u-.00001,mobile),b=pose(u,mobile),c=pose(u+.00001,mobile);
   for(const k of ['y','z','lookY'])assert.ok(Math.abs((b[k]-a[k])/.00001-(c[k]-b[k])/.00001)<.02,`${k} slope at ${u}`);
  }
 }
 console.log('PASS 22,502 camera samples: finite, deterministic, reversible, bounded per-step travel, C1 joins, distinct near/wide framing and retained editorial/team endpoints. Original timing, not recovered source curves.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
