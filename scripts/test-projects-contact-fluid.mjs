#!/usr/bin/env node
/** Native textured profile and real instanced atlas renderer. Not a parity score. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
const dir=fs.mkdtempSync(path.resolve('temp/projects-contact-unit-'));
const originalLoad=THREE.TextureLoader.prototype.load;
try {
 for(const [name,file] of [['AboutContactFluid','src/components/three/AboutContactFluid.ts'],['ProjectsContactWave','src/components/projects/ProjectsContactWave.ts']]) {
  const text=fs.readFileSync(file,'utf8').replace('"@/components/three/AboutContactFluid"','"./AboutContactFluid.mjs"');
  fs.writeFileSync(`${dir}/${name}.mjs`,ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 const {AboutContactFluid,aboutContactMetrics}=await import(pathToFileURL(`${dir}/AboutContactFluid.mjs`));
 assert.equal(aboutContactMetrics(1720,912).count,1800,'About default unchanged');
 assert.equal(aboutContactMetrics(1720,912).gravity,-7,'About gravity unchanged');
 assert.equal(aboutContactMetrics(1720,912,5600,true).count,300);
 assert.equal(aboutContactMetrics(1720,912,5600,true).gravity,-10.5);
 for(const [w,h] of [[1720,912],[1440,764],[390,844]]) {
  const f=new AboutContactFluid();f.configure(w,h,5600,false,true);
  const native=aboutContactMetrics(w,h,5600,true);assert.equal(f.count,native.count);assert.equal(f.gravity,native.gravity);
  for(let i=0;i<360;i++)f.update(1/60,.5,.5,false,false);
  assert.equal(f.emitted,f.count);assert.equal(f.drained,0);
  for(let i=0;i<150;i++)f.update(1/60,.7,.8,true,true);
  assert.ok(f.drained>20);assert.ok(f.emitted>f.count);assert.ok(Math.abs(f.emitterPosition[0]-.7)<1e-6);
  assert.equal(f.emitted-f.drained,f.active.reduce((a,b)=>a+b,0));
  for(const a of [f.x,f.y,f.vx,f.vy,f.angle,f.outX,f.outY])assert.ok(a.every(Number.isFinite));
  const drained=f.drained;f.update(1/60,.7,.8,true,false);assert.equal(f.drained,drained);
  f.configure(w,h,5600,true,true);const x=f.outX.slice(),y=f.outY.slice();f.update(1,.1,.2,true,true);
  assert.deepEqual(f.outX,x);assert.deepEqual(f.outY,y);
 }
 // Isolate texture I/O only; actual geometry/material/state and lifecycle run.
 let atlasUrl='';THREE.TextureLoader.prototype.load=function(url,onLoad){atlasUrl=url;const texture=new THREE.Texture();queueMicrotask(()=>onLoad(texture));return texture;};
 const {createProjectsContactWave}=await import(pathToFileURL(`${dir}/ProjectsContactWave.mjs`));
 const wave=createProjectsContactWave();await wave.ready;assert.equal(wave.loaded,true);assert.equal(atlasUrl,'/assets/textures/flip_texture.png');
 wave.layout(1720,912);wave.setTime(1);wave.setTime(1.016);
 assert.equal(wave.count,300);assert.equal(wave.group.children.length,1);
 const mesh=wave.group.children[0];assert.ok(mesh.geometry instanceof THREE.InstancedBufferGeometry);
 assert.equal(mesh.geometry.instanceCount,300);assert.equal(mesh.geometry.index.count,6);
 assert.match(mesh.material.fragmentShader,/dot\(vChannel,texture2D/,'RGB channel masks, not random polygon approximations');
 assert.equal(mesh.geometry.getAttribute('aStyle').getW(46),2,'native 23-grain shape grouping');
 let geometryDisposals=0,materialDisposals=0,textureDisposals=0;
 mesh.geometry.addEventListener('dispose',()=>geometryDisposals++);mesh.material.addEventListener('dispose',()=>materialDisposals++);wave.uniforms.uTexture.value.addEventListener('dispose',()=>textureDisposals++);
 wave.dispose();wave.dispose();assert.deepEqual([geometryDisposals,materialDisposals,textureDisposals],[1,1,1]);
 console.log('PASS Projects native textured metrics/PIC mass/pour/release/static policies; real RGB atlas instancing and idempotent resource disposal; About defaults unchanged.');
} finally {THREE.TextureLoader.prototype.load=originalLoad;fs.rmSync(dir,{recursive:true,force:true});}
