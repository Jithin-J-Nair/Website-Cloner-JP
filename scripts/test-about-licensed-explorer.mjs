#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
fs.mkdirSync('temp',{recursive:true});
const dir=fs.mkdtempSync(path.resolve('temp/about-licensed-unit-'));
const originalFetch=globalThis.fetch,originalParse=GLTFLoader.prototype.parseAsync,originalWarn=console.warn;
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const parent=()=>{const p=new THREE.Group();for(const name of ['explorer-suit','explorer-helmet','explorer-contact-shadow']){const o=new THREE.Group();o.name=name;p.add(o);}return p;};
function fixture(){
 const root=new THREE.Group(),head=new THREE.Bone();head.name='Head';root.add(head);
 const geometry=new THREE.BoxGeometry(.6,1.7,.3);geometry.translate(0,.85,0);
 const texture=new THREE.Texture(),material=new THREE.MeshStandardMaterial({normalMap:texture,roughnessMap:texture});
 root.add(new THREE.Mesh(geometry,material));
 const counts={geometry:0,material:0,texture:0};for(const [key,value]of Object.entries({geometry,material,texture}))value.addEventListener('dispose',()=>counts[key]++);
 return{root,head,counts};
}
try{
 const source=fs.readFileSync('src/components/three/AboutLicensedExplorer.ts','utf8');
 fs.writeFileSync(`${dir}/licensed.mjs`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {upgradeAboutExplorer}=await import(pathToFileURL(`${dir}/licensed.mjs`));
 let requests=[];globalThis.fetch=async(url,options)=>{requests.push({url,options});return{ok:true,arrayBuffer:async()=>new ArrayBuffer(8)};};
 let f=fixture();GLTFLoader.prototype.parseAsync=async()=>({scene:f.root});let invalidations=0;
 const p=parent(),a=upgradeAboutExplorer(p,()=>invalidations++);await tick();
 assert.equal(a.status,'ready');assert.equal(invalidations,1);assert.equal(requests[0].url,'/models/astronaut.glb');assert.ok(requests[0].options.signal instanceof AbortSignal);
 assert.equal(p.getObjectByName('explorer-suit').visible,false);assert.equal(p.getObjectByName('explorer-helmet').visible,false);assert.equal(p.getObjectByName('explorer-contact-shadow').visible,true);
 const bounds=new THREE.Box3().setFromObject(f.root,true);assert.ok(Math.abs(bounds.min.y)<1e-6);assert.ok(Math.abs(bounds.max.y-1.76)<1e-6);
 a.pose(.4,-.7,false);const pose=f.head.rotation.toArray();a.pose(-1,1,false);a.pose(.4,-.7,false);assert.deepEqual(f.head.rotation.toArray(),pose);
 a.pose(1,-1,true);assert.equal(f.head.rotation.x,.02);assert.equal(f.head.rotation.y,0);a.pose(NaN,Infinity,false);assert.ok(f.head.rotation.toArray().slice(0,3).every(Number.isFinite));
 a.dispose();a.dispose();assert.equal(a.status,'disposed');assert.deepEqual(f.counts,{geometry:1,material:1,texture:1});assert.equal(requests[0].options.signal.aborted,true);assert.equal(p.getObjectByName('explorer-suit').visible,true);
 // Disposal before fetch completion must never enter the non-cancellable parser.
 let finishFetch,parses=0;globalThis.fetch=()=>new Promise(resolve=>finishFetch=resolve);GLTFLoader.prototype.parseAsync=async()=>{parses++;throw Error('must not parse');};
 const early=upgradeAboutExplorer(parent(),()=>{throw Error('late invalidation');});early.dispose();finishFetch({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});await tick();assert.equal(parses,0);assert.equal(early.status,'disposed');
 // Disposal during parsing must release the eventual GLB, not reattach it.
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(8)});let finishParse;GLTFLoader.prototype.parseAsync=()=>new Promise(resolve=>finishParse=resolve);
 const lateParent=parent(),late=upgradeAboutExplorer(lateParent,()=>{throw Error('late invalidation');});await tick();late.dispose();f=fixture();finishParse({scene:f.root});await tick();assert.deepEqual(f.counts,{geometry:1,material:1,texture:1});assert.equal(lateParent.children.length,3);
 // An explicit network failure retains the immediate procedural suit.
 let warnings=[];console.warn=(...args)=>warnings.push(args);globalThis.fetch=async()=>({ok:false,status:503});const fallbackParent=parent(),failure=upgradeAboutExplorer(fallbackParent,()=>{});await tick();assert.equal(failure.status,'fallback');assert.equal(warnings.length,1);assert.equal(fallbackParent.getObjectByName('explorer-suit').visible,true);failure.dispose();
 assert.ok(!source.includes('requestAnimationFrame')&&!source.includes('setInterval'),'no independent scheduler');
 console.log('PASS NASA upgrade: relative/abortable permitted asset; planted normalized bounds; existing contact shadow; finite/reversible/reduced head pose; exactly-once shared resource disposal; cancellation before fetch and during parse; visible offline fallback; no independent clock/RAF. Browser validates the real GLB.');
}finally{globalThis.fetch=originalFetch;GLTFLoader.prototype.parseAsync=originalParse;console.warn=originalWarn;fs.rmSync(dir,{recursive:true,force:true});}
