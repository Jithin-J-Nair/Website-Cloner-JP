import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const aboutView = fs.readFileSync('src/components/pages/AboutPageView.tsx', 'utf8');
assert.match(aboutView, /pointerDelta = p\.xy - uPointerNDC/, 'team hologram grains respond locally to the cursor');
assert.match(aboutView, /portraitPoints\.rotation\.y = THREE\.MathUtils\.lerp/, 'team hologram has a damped whole-form yaw response');
const portraitFrame = aboutView.slice(aboutView.indexOf("// One damped whole-form target"), aboutView.indexOf("// Synchronized DOM HUD"));
assert.doesNotMatch(portraitFrame, /portraitPoints\.rotation\.set\(/, 'a later direct rotation write must not overwrite the damped target');
assert.match(aboutView, /portraitPoints\.rotation\.x = THREE\.MathUtils\.lerp/, 'team hologram has a damped whole-form pitch response');
assert.match(aboutView, /reducedMotion \? 0 : 1/, 'team hologram pointer tilt respects reduced motion');
const portraitGeometry = fs.readFileSync('src/lib/about-portrait-geometry.ts', 'utf8');
assert.match(aboutView, /from "@\/lib\/about-portrait-geometry"/, 'the team scene uses the independently testable clean-room portrait generator');
assert.match(aboutView, /skewX\(\$\{sweep\.skewX\}deg\).*scaleX\(\$\{sweep\.stretchX\}\)/, 'wordmark applies scroll-owned planar skew and stretch without 3D rotation');
assert.match(portraitGeometry, /const px = \(u \+ 0\.1\) \* facing \* 2\.25/, 'abstract portrait retains a broad side-profile silhouette with a stable center offset');
assert.match(portraitGeometry, /const py = v \* 1\.6/, 'abstract portrait maintains full head-to-shoulder height');
assert.match(portraitGeometry, /const pz = \(depth \+ \(random\(\) - 0\.5\) \* 0\.012\) \* 1\.45/, 'abstract profile retains real depth for dimensional shading');
assert.match(aboutView, /attribute vec3 aMorphFrom/, 'team points use a dedicated previous-position buffer');
assert.match(aboutView, /mix\(aMorphFrom, position, clamp\(uMorph/, 'team portraits interpolate in the existing vertex shader');
assert.match(aboutView, /portraitMorphStartRef\.current = -1/, 'a new member selection starts an interruptible morph');
assert.match(aboutView, /elapsedSec - portraitMorphStartRef\.current\) \/ \.58/, 'the team morph is driven by the existing scene clock');
fs.mkdirSync('temp',{recursive:true});
const dir=fs.mkdtempSync(path.resolve('temp/about-camera-'));
try {
 fs.writeFileSync(`${dir}/motion.mjs`,ts.transpileModule(fs.readFileSync('src/lib/about-scene-motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {aboutScenePose:pose,aboutWordmarkSweepPose:sweep}=await import(pathToFileURL(`${dir}/motion.mjs`));
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
 assert.equal(sweep(1.6, false).opacity, 0, 'desktop LUSION sweep clears before the settled valley manifesto');
 for(const mobile of [false,true]){
  const end = mobile ? 11.25 : 9.5;
  const samples=[];
  for(let i=0;i<=Math.round(end*1000);i++){
   const u=i/1000,p=sweep(u,mobile);
   assert.ok(Object.values(p).every(Number.isFinite));
   assert.ok(p.opacity>=0&&p.opacity<=1);
   assert.ok(p.scale>=.96&&p.scale<=1.045);
   assert.ok(p.stretchX>=1 && p.stretchX <= (mobile ? 1.075 : 1.34), 'wordmark stretch stays in its authored planar range');
   assert.ok(Math.abs(p.skewX) <= (mobile ? 5 : 13), 'wordmark skew stays bounded');
   assert.ok(mobile ? p.rotation>=-.8&&p.rotation<=.6 : p.rotation>=-4&&p.rotation<=2);
   if(samples.length){
    const q=samples.at(-1).pose;
    assert.ok(Math.abs(p.opacity-q.opacity)<.01,'continuous opacity');
    assert.ok(Math.abs(p.xVw-q.xVw)<.02,'continuous horizontal travel');
   }
   samples.push({u,pose:p});
  }
  for(const {u,pose:p} of [...samples].reverse())assert.deepEqual(sweep(u,mobile),p,'sweep reverse/seek is stateless');
  assert.equal(sweep(-1,mobile).opacity,0);
  assert.equal(sweep(NaN,mobile).opacity,0);
  assert.ok(sweep(mobile?2.45:1.25,mobile).opacity>.99,'sweep reaches full opacity');
  assert.equal(sweep(mobile?3.45:2.35,mobile).opacity,0,'sweep exits');
 }
 console.log('PASS wordmark sweep: deterministic, bounded, continuous, reversible and scroll-seek safe. Authored timing is not represented as measured source timing.');
 console.log('PASS 22,502 camera samples: finite, deterministic, reversible, bounded per-step travel, C1 joins, distinct near/wide framing and retained editorial/team endpoints. Original timing, not recovered source curves.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}

const narrativeBlock = aboutView.slice(aboutView.indexOf("// C. Studio Narrative HUD"), aboutView.indexOf("// D. Full-Bleed Interactive"));
assert.match(narrativeBlock, /narrativeWordRefs\.current\.length/, "narrative sequence updates individual words, not only the paragraph");
assert.match(narrativeBlock, /i \* 0\.014/, "word fades are staggered from a stable order");
assert.match(narrativeBlock, /-7 \* exit/, "narrative block slides left on exit");
assert.match(aboutView, /setInterval\(evaluateTeamStage, 160\)/, "team auto-advance is polled only while the team stage is active");
assert.match(aboutView, /\}, 4800\)/, "team member dwell is 4.8 seconds");
assert.match(aboutView, /document\.hidden \|\| teamOverlayRef\.current\?\.dataset\.teamActive !== "true"/, "auto-advance pauses off-stage or in a hidden tab");
assert.match(aboutView, /const streakCount = 384/, "team stage uses a dense full-frame light-streak field");
