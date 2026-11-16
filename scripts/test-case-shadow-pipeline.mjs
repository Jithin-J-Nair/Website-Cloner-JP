#!/usr/bin/env node
/** Numerical/resource/order isolation with a renderer double, NOT GPU pixels. */
import assert from'node:assert/strict';import fs from'node:fs';import path from'node:path';import{pathToFileURL}from'node:url';import ts from'typescript';import * as THREE from'three';
fs.mkdirSync('temp',{recursive:true});const dir=fs.mkdtempSync(path.resolve('temp/case-shadow-'));
try{
 const source=fs.readFileSync('src/components/case-study/CaseStudyShadows.ts','utf8').replace('import { loadLusionBuf } from "@/lib/lusion-buf-loader";','const loadLusionBuf = async () => ({geometry:new THREE.BoxGeometry()});').replace('import { casePlantVertex, casePlantFragment } from "./CaseStudyShaders";','const casePlantVertex="",casePlantFragment="";');
 fs.writeFileSync(`${dir}/shadow.mjs`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const{createCaseStudyShadows}=await import(pathToFileURL(`${dir}/shadow.mjs`));
 let target=null,mask=[true,true,true,true],wakes=0;const calls=[],clears=[],targets=new Set();let inject=false;
 const gl={colorMask:(...m)=>{mask=m;}};
 const renderer={domElement:{dataset:{}},autoClear:true,getContext:()=>gl,getDrawingBufferSize:v=>v.set(1440,900),setRenderTarget:t=>{target=t;targets.add(t);},clear:()=>clears.push({target,mask:[...mask]}),render:scene=>{
   assert.equal(renderer.autoClear,false,'automatic clearing must not erase previously captured RGB channels');
   if(inject)throw new Error('injected render failure');
   const mesh=scene.children[0],u=mesh.material.uniforms;
   if(scene.children.length===3){scene.children.forEach(p=>p.onBeforeRender());calls.push({type:'plant',target,positions:scene.children.map(p=>p.position.toArray()),delays:scene.children.map(p=>p.material.uniforms.u_delay.value)});}
   else calls.push({type:u.uDelta?'blur':'copy',target,mask:[...mask],delta:u.uDelta?.value.toArray(),source:u.uTexture.value});
 }};
 const shadows=createCaseStudyShadows(renderer,()=>wakes++);await new Promise(r=>setImmediate(r));assert.equal(wakes,1);
 shadows.resize(1440,900);shadows.render(1,1/60,.04,.5,-.5,false);
 assert.deepEqual(calls.map(c=>c.type),['plant','blur','blur','copy','blur','blur','copy','blur','blur','copy']);
 assert.deepEqual(calls[0].positions,[[-.55,-.8,-5],[-.75,-.8,0],[-.45,-.8,5]]);assert.deepEqual(calls[0].delays,[0,.2,.5]);
 assert.equal(clears.length,2);assert.equal(calls[0].target.width,1080);assert.equal(calls[0].target.height,675);
 const expected=[[1080,675,2],[540,338,4],[810,507,4]];
 for(let i=0;i<3;i++){
  const h=calls[1+i*3],v=calls[2+i*3],copy=calls[3+i*3],[w,hg,radius]=expected[i];
  assert.equal(h.target.width,w);assert.equal(h.target.height,hg);assert.deepEqual(h.delta,[radius/w*.25,0]);assert.deepEqual(v.delta,[0,radius/hg*.25]);
  assert.equal(v.target,calls[0].target,'every blur writes back in place before the next scale');assert.equal(copy.source,calls[0].target.texture);
  assert.deepEqual(copy.mask,[i===0,i===1,i===2,false]);assert.equal(copy.target.texture,shadows.texture);
 }
 assert.deepEqual(mask,[true,true,true,true]);assert.equal(renderer.autoClear,true);
 // Native image alpha changes projection depth; pointer-follow changes the matrix.
 const uv=(point)=>{const p=point.clone().applyMatrix4(shadows.view);return[p.x*.9,1-p.y*.9];};
 const background=uv(new THREE.Vector3(.5,.5,0)),image=uv(new THREE.Vector3(.5,.5,-4));assert.notDeepEqual(background,image);
 const before=shadows.view.toArray();shadows.render(2,.05,0,-1,1,false);assert.notDeepEqual(before,shadows.view.toArray());
 inject=true;assert.throws(()=>shadows.render(3,.05,0,0,0,false),/injected/);assert.deepEqual(mask,[true,true,true,true]);assert.equal(renderer.autoClear,true,'failure must restore caller GL/clear state');inject=false;
 let disposed=0;for(const t of targets)t.addEventListener('dispose',()=>disposed++);shadows.dispose();const once=disposed;shadows.dispose();assert.equal(disposed,once);assert.ok(once>=5);
 console.log('PASS native shadow isolation: 3 depth layers, sequential six 9-tap passes, native scales/deltas, channel-preserving capture, image-depth/pointer projection, GL-state restoration and idempotent RT disposal. Not GPU pixel verification.');
}finally{fs.rmSync(dir,{recursive:true});}
