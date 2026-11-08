#!/usr/bin/env node
/** Native numerical contracts, replacing assertions for the removed invented
 * sticky deck / monotone smoothstep fan. Not a rendered-parity certificate. */
import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import{pathToFileURL}from'node:url';import ts from'typescript';
fs.mkdirSync('temp',{recursive:true});const dir=fs.mkdtempSync(path.resolve('temp/expertise-motion-'));
try{
 const source=fs.readFileSync('src/lib/about-expertise-motion.ts','utf8');
 fs.writeFileSync(`${dir}/motion.mjs`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const{expertiseCardPose:pose,expertiseScreenRatio:range,expertisePinOffset:pin,expertiseLineProgress:line,expertiseMobileFlip:mobile}=await import(pathToFileURL(`${dir}/motion.mjs`));
 assert.equal(range(900,3800,900),-1);assert.equal(range(-3800,3800,900),1);
 assert.equal(range((900-3800)/2,3800,900),0);
 for(let i=0;i<4;i++){
  const args=[i,1296,302.4,0];
  const start=pose(-1,...args),end=pose(1,...args);
  assert.equal(start.flip,180);assert.equal(start.x,496.8);assert.ok(Math.abs(start.roll)<1e-12);assert.ok(Math.abs(start.y)<1e-10);
  assert.equal(end.flip,0);assert.ok(Math.abs(end.x-i*331.2)<1e-9);assert.ok(Math.abs(end.roll)<1e-12);assert.ok(Math.abs(end.y)<1e-10);
  assert.deepEqual(pose(-5,...args),start);assert.deepEqual(pose(5,...args),end);assert.deepEqual(pose(NaN,...args),start);
  let previous=start,overshoot=false;
  for(let n=1;n<=2000;n++){
   const p=pose(-1+n/1000,...args);assert.ok(Object.values(p).every(Number.isFinite));
   assert.ok(p.flip>=-18.1&&p.flip<=198.1,'native back easing is bounded, but deliberately NOT monotone');
   assert.ok(Math.abs(p.flip-previous.flip)<2.5,'native sampled slope remains continuous');
   assert.ok(Math.abs(p.roll)<=13.5&&Math.abs(p.y)<=10);assert.ok(Math.abs(p.x-previous.x)<10);
   if(p.flip>180||p.flip<0)overshoot=true;
   previous=p;
  }
  assert.equal(overshoot,true,'source back-in-out overshoot must not be replaced with smoothstep');
  for(const sr of[-.55,-.3,-.11,.2,.55]){const expected=pose(sr,...args);pose(1,...args);pose(-1,...args);assert.deepEqual(pose(sr,...args),expected,'reversing scroll must recover the exact same pose at fixed time');}
  assert.equal(mobile(-1,i),180);assert.equal(mobile(0,i),0);let prev=180;
  for(let n=0;n<=1000;n++){const f=mobile(-1+n/1000,i);assert.ok(Number.isFinite(f)&&f<=prev+1e-10&&f>=0);prev=f;}
 }
 assert.ok(pose(-.11,0,1296,302.4).flip<30);assert.ok(pose(-.11,1,1296,302.4).flip<60);
 assert.ok(Math.abs(pose(-.11,2,1296,302.4).flip-90)<1e-8,'native third-card edge occurs at range -.11');assert.ok(pose(-.11,3,1296,302.4).flip>110);
 assert.notEqual(pose(-.11,0,1296,302.4,0).y,pose(-.11,0,1296,302.4,1).y,'cosine bob stays live without scroll');
 for(const office of[false,true]){let prev=0;for(let y=2000;y>=-6000;y-=1){const value=line(y,900,office);assert.ok(value>=prev&&value>=0&&value<=1);prev=value;}}
 assert.equal(line(0,900),0);assert.equal(line(-900,900),.5);assert.equal(line(-1800,900),1);assert.equal(line(-1800,900,true),0);assert.equal(line(-3465,900,true),1);
 let last=0;for(let x=-5000;x<6000;x+=1){const v=pin(x,900);assert.ok(Number.isFinite(v)&&v>=last-1e-9&&v-last<2);last=v;}
 const styles=fs.readFileSync('src/components/pages/AboutPageStyles.tsx','utf8'),cards=fs.readFileSync('src/components/pages/AboutExpertiseCards.tsx','utf8'),lines=fs.readFileSync('src/components/pages/AboutExpertiseLines.ts','utf8');
 assert.match(styles,/#about \{ --about-blue: #3733e8;/i);assert.ok(!cards.includes('M390 510C690 510'));
 assert.ok(lines.includes('line_${office ? "office" : "capability"}.buf')&&lines.includes('editorialLineFragment'),'two real buffers use the native line/coverage program');
 assert.ok(cards.includes('className="about-card-back-art" src="/about/scene/card-back.png" width={628} height={876}'));assert.ok(fs.existsSync('media-bundle/images/cards/back.png'));
 assert.match(cards,/feColorMatrix/);assert.match(styles,/filter: url\(#about-card-back-colors\)/);
 console.log('PASS native expertise: source range/pin/line endpoints, 4 bounded back-eased staggered turns, golden third-card edge, exponential spread, deterministic reversal, live bob, mobile cubic flips, actual ribbon/artwork contracts.');
}finally{fs.rmSync(dir,{recursive:true});}
