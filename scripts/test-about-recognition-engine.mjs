#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
const dir=fs.mkdtempSync(path.resolve('temp/about-recognition-unit-'));
try{
 for(const name of ['AboutRecognitionPaint','AboutRecognitionMotion']){
  const source=fs.readFileSync(`src/components/three/${name}.ts`,'utf8');
  fs.writeFileSync(`${dir}/${name}.mjs`,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 const {createRecognitionEdges}=await import(pathToFileURL(`${dir}/AboutRecognitionPaint.mjs`));
 const rectangle=new THREE.PlaneGeometry(10,20);const edges=createRecognitionEdges(rectangle);
 assert.equal(edges.instanceCount,4,'a triangulated rectangle has four boundary capsules, not its internal diagonal');
 const a=edges.getAttribute('aStart'),b=edges.getAttribute('aEnd');
 for(let i=0;i<a.count;i++)assert.ok(a.getX(i)===b.getX(i)||a.getY(i)===b.getY(i));
 const shape=new THREE.Shape();shape.moveTo(0,0);shape.lineTo(0,10);shape.lineTo(10,10);shape.lineTo(10,0);shape.closePath();
 const hole=new THREE.Path();hole.moveTo(3,3);hole.lineTo(7,3);hole.lineTo(7,7);hole.lineTo(3,7);hole.closePath();shape.holes.push(hole);
 const counter=new THREE.ShapeGeometry(shape),counterEdges=createRecognitionEdges(counter);assert.equal(counterEdges.instanceCount,8,'letter counters retain inner and outer contours without triangulation artifacts');
 for(const g of [rectangle,edges,counter,counterEdges])g.dispose();
 const {createAboutRecognitionMotion}=await import(pathToFileURL(`${dir}/AboutRecognitionMotion.mjs`));
 globalThis.innerWidth=1440;globalThis.innerHeight=764;
 const element=()=>({style:{transform:'',removeProperty(name){delete this[name]}},dataset:{}});
 const chars=Array.from({length:6},element),numbers=Array.from({length:2},element),icon=element(),line=element(),words=Array.from({length:4},element);
 words.forEach((w,i)=>w.dataset.recognitionDelay=String(i/10));
 let top=800;
 const header={getBoundingClientRect:()=>({top,height:58}),querySelectorAll:s=>s.startsWith('h2')?chars:numbers,querySelector:()=>icon};
 const item={getBoundingClientRect:()=>({top,height:60}),querySelectorAll:()=>words,querySelector:()=>line};
 const all=[...chars,...numbers,icon,line,...words];
 const section={querySelectorAll:s=>s==='[data-recognition-header]'?[header]:s==='[data-recognition-item]'?[item]:all};
 const motion=createAboutRecognitionMotion(section,false);motion.update(.1);
 assert.match(chars[0].style.transform,/100%/,'offscreen heading remains clipped');assert.equal(line.style.transform,'scaleX(0)');
 top=500;motion.update(.3);
 assert.notEqual(chars[0].style.transform,chars[5].style.transform,'individual characters are staggered');
 assert.notEqual(words[0].style.transform,words[3].style.transform,'row words use their reference offsets');
 for(let i=0;i<20;i++)motion.update(.1);
 assert.equal(chars[0].style.transform,'translate3d(0,0%,0) rotate(0deg)');assert.equal(line.style.transform,'scaleX(1)');
 top=900;for(let i=0;i<20;i++)motion.update(.1);assert.match(chars[0].style.transform,/100%/,'reverse scroll resets reveals');
 motion.dispose();assert.ok(all.every(e=>e.style.transform===undefined),'cleanup restores static accessible content');
 const reduced=createAboutRecognitionMotion(section,true);reduced.update(0);
 assert.equal(chars[5].style.transform,'translate3d(0,0%,0) rotate(0deg)');assert.equal(line.style.transform,'scaleX(1)');assert.equal(icon.style.transform,'none');reduced.dispose();
 globalThis.innerWidth=390;const mobile=createAboutRecognitionMotion(section,false);mobile.update(0);assert.equal(chars[5].style.transform,'translate3d(0,0%,0) rotate(0deg)');mobile.dispose();
 console.log('PASS recognition geometry/motion: boundary-only instanced capsules, letter counters, staged/reversible characters/words/lines, static reduced/mobile typography and cleanup. GPU pixel behavior is covered separately.');
}finally{fs.rmSync(dir,{recursive:true,force:true})}
