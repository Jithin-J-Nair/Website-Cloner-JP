import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const aboutView = fs.readFileSync('src/components/pages/AboutPageView.tsx', 'utf8');
const sourceTeam = fs.readFileSync('src/components/three/AboutSourceTeam.ts', 'utf8');
const wordmarkSweep = fs.readFileSync('src/components/three/AboutWordmarkSweep.ts', 'utf8');

// The active source-team renderer owns the actual roster point shader. Verify its
// local pointer glint and the camera-facing head tilt at the point where reduced
// motion is applied, rather than asserting against the retired portraitPoints shader.
assert.match(sourceTeam, /uniform float uTime,uMorph,uReveal,uPointSize,uPixelRatio;uniform vec2 uPointer;/, 'team point shader receives normalized pointer input');
assert.match(sourceTeam, /float hot=exp\(-dot\(p\.xy-uPointer\*vec2\(1\.4,1\.1\),p\.xy-uPointer\*vec2\(1\.4,1\.1\)\)\*3\.\)/, 'team hologram glints respond locally around the pointer');
assert.match(sourceTeam, /vGlint=.*hot\*shade/, 'pointer influence is isolated to local point highlights');
assert.match(sourceTeam, /head\.rotation\.set\(reduced \? 0 : -pointer\.y \* \.035, reduced \? 0 : pointer\.x \* \.09, 0\)/, 'whole portrait tilt is damped to zero when reduced motion is active');
assert.match(aboutView, /sourceTeam\.update\(camera, elapsedSec, tTeamPhase,[\s\S]*pointerNDC,[\s\S]*reducedMotion/, 'the shared scene pointer and reduced-motion preference reach the active source-team renderer');

// Verify the current interruptible point-buffer morph. The GPU interpolates the
// previous member into the selected member over the scene-owned morph uniform.
assert.match(sourceTeam, /attribute vec3 aFrom,aNormal,aNormalFrom;attribute float aShade,aShadeFrom;/, 'source roster uses dedicated prior-position and shading buffers');
assert.match(sourceTeam, /vec3 p=mix\(aFrom,position,t\)/, 'team members interpolate in the existing point vertex shader');
assert.match(sourceTeam, /if \(disposed \|\| token !== revision\) return/, 'stale roster loads cannot overwrite the latest selected member');
assert.match(sourceTeam, /morph = reduced \|\| !ready \? 1 : 0/, 'initial and reduced-motion roster states avoid an unnecessary morph');
assert.match(sourceTeam, /morph = reduced \? 1 : Math\.min\(1, morph \+ dt \/ \.85\)/, 'subsequent team changes use the scene clock for their morph');

// The current LUSION wordmark is a single continuously folded Three.js type
// surface. Verify its mesh, texture and single shader deformation path.
assert.match(aboutView, /createAboutWordmarkSweep\(\)/, 'About constructs one shared wordmark sweep scene');
assert.match(aboutView, /wordmarkSweep\.uniforms\.uPhase\.value = sweep\.deformation/, 'scroll playhead controls the wordmark shader deformation');
assert.match(aboutView, /wordmarkSweep\.uniforms\.uOpacity\.value = sweep\.opacity/, 'wordmark visibility follows the same scroll playhead');
assert.match(wordmarkSweep, /geometry = new THREE\.PlaneGeometry\(2, 2, 160, 12\)/, 'wordmark uses a single subdivided surface instead of independently rotating letters');
assert.match(wordmarkSweep, /p\.x\+=\(uv\.y-\.5\)\*\.86\*pow\(sin\(x\*3\.14159265\),4\.\)\*fold/, 'wordmark folds continuously across the full letter surface');
fs.mkdirSync('temp',{recursive:true});
const dir=fs.mkdtempSync(path.resolve('temp/about-camera-'));
try {
 fs.writeFileSync(`${dir}/motion.mjs`,ts.transpileModule(fs.readFileSync('src/lib/about-scene-motion.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {aboutScenePose:pose,aboutWordmarkSweepPose:sweep,aboutLetteringPose:lettering}=await import(pathToFileURL(`${dir}/motion.mjs`));
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
 for (const mobile of [false, true]) {
  const samples = [];
  for (let i = 0; i <= 11250; i++) {
   const u = i / 1000, p = lettering(u, mobile);
   assert.ok(Object.values(p).every(value => Number.isFinite(value) && value >= 0 && value <= 1));
   assert.equal(p.manifesto * p.narrative, 0, 'manifesto and narrative never share readable opacity');
   assert.ok(p.opening * p.manifesto < .001, 'opening clears before the settled manifesto');
   if (samples.length) for (const key of Object.keys(p)) {
    assert.ok(Math.abs(p[key] - samples.at(-1).pose[key]) < .01, `continuous lettering ${key}`);
   }
   samples.push({u, pose:p});
  }
  for (const {u, pose:p} of samples.reverse()) assert.deepEqual(lettering(u, mobile), p, 'lettering reverses and fast seeks without state');
  for (const u of [-1, NaN, Infinity]) assert.deepEqual(lettering(u, mobile), lettering(0, mobile));
  const basin = lettering(mobile ? 2.45 : 1.6, mobile), narrative = lettering(5.35, mobile);
  assert.equal(basin.opening, 0); assert.equal(basin.manifesto, 1); assert.equal(basin.narrative, 0);
  assert.equal(narrative.opening, 0); assert.equal(narrative.manifesto, 0); assert.equal(narrative.narrative, 1);
 }
 console.log('PASS 22,502 lettering samples: finite/bounded, C0 continuous, reversible, invalid-input safe, opening handoff and nonoverlapping manifesto/narrative.');
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
assert.match(sourceTeam, /const count = 8192/, "team stage renders the complete 8,192-point captured roster buffer");
assert.match(aboutView, /const teamVisible = tTeamPhase > \.02 && sourceTeam\.ready/, "team portrait becomes visible only after its source geometry is ready");
assert.match(aboutView, /teamOverlayRef\.current\.dataset\.teamActive = tTeamPhase > \.985 \? "true" : "false"/, "team auto-advance is enabled only after the team chapter fully settles");
