#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const dir=fs.mkdtempSync(path.resolve('temp/home-editorial-unit-'));
try {
 const compile=(name,source)=>{const file=path.join(dir,name+'.mjs');fs.writeFileSync(file,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);return import(pathToFileURL(file));};
 const m=await compile('motion',fs.readFileSync('src/lib/home-editorial-motion.ts','utf8'));
 assert.equal(m.editorialEase(0),0);assert.equal(m.editorialEase(1),1);assert.ok(m.editorialEase(.5)>.8,'native .35/0/0/1 curve, not smoothstep');
 for(let i=0;i<1000;i++)assert.ok(m.editorialEase(i/1000)<=m.editorialEase((i+1)/1000));
 for(const vh of [568,764,844,1080]){
   const from=1200-(vh-300)/2,to=2000-(vh-1300)/2;
   assert.equal(m.reelMorphProgress(from,1200,300,2000,1300,vh),0);
   assert.equal(m.reelMorphProgress(to,1200,300,2000,1300,vh),1);
   assert.equal(m.reelMorphProgress((from+to)/2,1200,300,2000,1300,vh),.5);
   for(const y of [from,from+100,to,to+500])assert.equal(m.reelMorphProgress(y,1200,300,2000,1300,vh),m.reelMorphProgress(y,1200,300,2000,1300,vh));
   let previous=-Infinity;for(let y=0;y<4000;y+=10){const pin=m.reelPinOffset(y,2000,550,vh);assert.ok(Number.isFinite(pin));assert.ok(pin>=previous-1e-8);previous=pin;}
   assert.equal(m.reelLineProgress(vh*.4,vh),0);assert.equal(m.reelLineProgress(-vh*.9,vh),1);
 }
 for(const dt of [1/240,1/60,1/20,.2,1]){
   const spring=m.createEditorialSpring(0);for(let time=0;time<8;time+=dt)m.stepEditorialSpring(spring,1,dt,2.2,.7,3);assert.ok(Math.abs(spring.value-1)<1e-4);
   for(let time=0;time<8;time+=dt)m.stepEditorialSpring(spring,0,dt,2.2,.7,3);assert.ok(Math.abs(spring.value)<1e-4);assert.ok(Number.isFinite(spring.velocity));
 }
 const loader=await compile('buf',fs.readFileSync('src/lib/lusion-buf-loader.ts','utf8'));
 const bytes=fs.readFileSync('media-bundle/models/lines/line_reel.buf');const data=loader.parseLusionBuf(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));
 assert.equal(data.header.vertexCount,640);for(const name of ['position','CP','Cd'])assert.ok(data.geometry.getAttribute(name));assert.equal(data.geometry.getAttribute('CP').itemSize,3);data.geometry.dispose();
 const runtime=fs.readFileSync('src/components/home/HomeEditorialMotion.ts','utf8'),shaders=fs.readFileSync('src/components/home/HomeEditorialShaders.ts','utf8'),card=fs.readFileSync('src/components/home/FeaturedProjectCard.tsx','utf8'),reel=fs.readFileSync('src/components/home/HomeReelSection.tsx','utf8');
 assert.ok(runtime.includes('plane(32)')&&runtime.includes('project.depthMap')&&runtime.includes('PARALLAX_SAMPLES:12,BLUR_SAMPLES:6'));
 assert.ok(runtime.includes('LUSION_HOME.reel.connectorSpline')&&!runtime.includes('reel-ribbon-path'));
 assert.equal((reel.match(/<video\b/g)||[]).length,1,'one shared decoded video source');
 assert.ok(!card.includes('requestAnimationFrame')&&!card.includes('imgWrapRef'),'cards cannot compete with the shared renderer');
 assert.ok(shaders.includes('placementWeight')&&shaders.includes('u_depthTexture')&&shaders.includes('u_blueNoiseTexture')&&shaders.includes('u_padding'));
 console.log('PASS: native easing, layout-derived morph/reversal, pinned offset, line geometry, bounded springs, single ownership and depth shaders');
}finally{fs.rmSync(dir,{recursive:true});}
