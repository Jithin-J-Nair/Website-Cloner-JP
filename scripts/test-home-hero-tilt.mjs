#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
fs.mkdirSync('temp',{recursive:true});const dir=fs.mkdtempSync(path.resolve('temp/hero-tilt-'));
try {
 const source=fs.readFileSync('src/lib/home-hero-tilt.ts','utf8');
 fs.writeFileSync(`${dir}/tilt.mjs`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext}}).outputText);
 const {heroTiltFromOrientation:tilt,smoothHeroTilt:smooth}=await import(pathToFileURL(`${dir}/tilt.mjs`));
 assert.deepEqual(tilt(30,5,30,5,0),{x:0,y:0});
 assert.deepEqual(tilt(40,15,30,5,0),{x:.4,y:.4});
 assert.deepEqual(tilt(40,15,30,5,90),{x:.4,y:-.4});
 assert.deepEqual(tilt(40,15,30,5,180),{x:-.4,y:-.4});
 assert.deepEqual(tilt(40,15,30,5,270),{x:-.4,y:.4});
 assert.equal(tilt(-179,0,179,0,0).y,.08);
 assert.deepEqual(tilt(90,90,0,0,0),{x:1,y:1});
 let a=0,b=0;for(let i=0;i<60;i++)a=smooth(a,1,1/60);for(let i=0;i<30;i++)b=smooth(b,1,1/30);
 assert.ok(Math.abs(a-b)<1e-10 && a<1 && a>.99);assert.equal(smooth(.5,1,0),.5);
 console.log('PASS hero tilt: calibration, rotation, wrap, bounded angles and frame-independent smoothing');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
