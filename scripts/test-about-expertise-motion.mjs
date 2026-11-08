import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import ts from 'typescript';
const dir = fs.mkdtempSync(path.resolve('temp/expertise-motion-'));
try {
 const source = fs.readFileSync('src/lib/about-expertise-motion.ts','utf8');
 fs.writeFileSync(`${dir}/motion.mjs`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {expertiseCardPose: pose, expertiseHeadingPose: heading} = await import(pathToFileURL(`${dir}/motion.mjs`));
 for (let i=0;i<4;i++) {
  assert.equal(pose(0,i).flip,180); assert.equal(pose(1,i).flip,0);
  assert.equal(pose(1,i).xVw,0); assert.equal(pose(1,i).dropVh,0);
  assert.equal(pose(1,i).roll,0); assert.equal(pose(1,i).yaw,0);
  assert.equal(pose(1,i).pitch,0); assert.equal(pose(1,i).scale,1);
  assert.equal(pose(1,i).opacity,1);
  assert.ok(Math.abs(pose(0,i).yaw) <= 13.5);
  assert.ok(Math.abs(pose(0,i).pitch) <= 5);
  assert.equal(pose(0,i).scale,.86);
  assert.deepEqual(pose(-3,i),pose(0,i));assert.deepEqual(pose(5,i),pose(1,i));assert.deepEqual(pose(NaN,i),pose(0,i));
  let last=pose(0,i);
  for(let n=1;n<=1000;n++) {const p=pose(n/1000,i);assert.ok(Object.values(p).every(Number.isFinite));assert.ok(p.flip<=last.flip&&p.dropVh<=last.dropVh&&p.opacity>=last.opacity);
  const yaw = Math.abs(p.yaw), previousYaw = Math.abs(last.yaw);
  const pitch = Math.abs(p.pitch), previousPitch = Math.abs(last.pitch);
  assert.ok(yaw <= 7.5 + 1e-9, "card yaw remains within its authored fan angle");
  assert.ok(pitch <= 4 + 1e-9, "card pitch remains within its authored tilt");
  if (n >= 120 && n <= 320) {
   assert.ok(yaw >= previousYaw - 1e-9, "the spread phase progressively fans the card backs");
   assert.ok(pitch >= previousPitch - 1e-9, "the spread phase progressively pitches the deck");
  }
  if (n > 550) {
   assert.ok(yaw <= previousYaw + 1e-9, "the settle phase unwinds card yaw");
   assert.ok(pitch <= previousPitch + 1e-9, "the settle phase unwinds card pitch");
  }
  assert.ok(p.scale>=last.scale);
  assert.ok(Math.abs(p.flip-last.flip)<1.8, "staggered 180-degree flip follows its authored maximum easing slope");
  assert.ok(Math.abs(p.xVw-last.xVw)<.21);
  assert.ok(Math.abs(p.yaw-last.yaw)<.2);
  assert.ok(Math.abs(p.pitch-last.pitch)<.1);
  assert.ok(Math.abs(p.scale-last.scale)<.001);
  last=p;}
  for(const p of [.01,.15,.35,.51,.79,.95]) {const a=pose(p,i);pose(1,i);pose(0,i);assert.deepEqual(pose(p,i),a,'reverse / intermediate re-entry is stateless');}
 }
 assert.equal(heading(0).opacity,1);assert.equal(heading(1).opacity,0);
 const pageStyles = fs.readFileSync("src/components/pages/AboutPageStyles.tsx", "utf8");
 const cardsSource = fs.readFileSync("src/components/pages/AboutExpertiseCards.tsx", "utf8");
 assert.match(pageStyles, /#about \{ --about-blue: #3733e8;/i, "About expertise section uses its route-owned live blue");
 assert.match(cardsSource, /M420 30C650 110 1000 110 1230 65C1500 20 1490 270 1170 610/, "the expertise flourish is one authored diagonal stroke");
 assert.ok(cardsSource.includes('className="about-card-back-art" src="/assets/images/cards/back-ink.svg" width={628} height={876}'), "card backs use original clean-room 628 by 876 line art");
 const cardBack = fs.readFileSync("public/assets/images/cards/back-ink.svg", "utf8");
 assert.match(cardBack, /viewBox="0 0 628 876"/, "clean-room card texture preserves the source card proportions");
 assert.ok(cardBack.includes("micro-grid") && cardBack.includes('stroke="#fff"'), "card texture contains original vector linework");

 assert.notEqual(pose(.5,0).flip,pose(.5,3).flip,'authored stagger, not four simultaneous copies');
 console.log('PASS card poses: finite, bounded, continuous, monotonic, deterministic, reversible; aligned settled fronts; stagger; malformed scroll fallback. Not a reference-timing assertion.');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
