#!/usr/bin/env node
/** Actual CTA physics/geometry tests. Passing these is not visual parity. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
const dir=fs.mkdtempSync(path.resolve('temp/about-contact-unit-'));
try {
  for(const name of ['AboutContactFluid','AboutContactWave','AboutContactMotion']){
    const text=fs.readFileSync(`src/components/three/${name}.ts`,'utf8').replace('"./AboutContactFluid"','"./AboutContactFluid.mjs"');
    fs.writeFileSync(`${dir}/${name}.mjs`,ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
  }
  const {AboutContactFluid,aboutContactMetrics}=await import(pathToFileURL(`${dir}/AboutContactFluid.mjs`));
  assert.equal(aboutContactMetrics(1720,912).count,1800);
  assert.equal(aboutContactMetrics(1720,912).gravity,-7);
  for(const [width,height] of [[1720,912],[1568,1230],[390,844]]){
    const f=new AboutContactFluid();f.configure(width,height);
    assert.equal(f.active.reduce((a,b)=>a+b,0),0,'no prefilled pool or edge recirculation');
    const arrays=[f.x,f.y,f.vx,f.vy,f.outX,f.outY,f.angle,f.spin,f.active];
    const check=()=>{
      arrays.slice(0,-1).forEach(a=>assert.ok(a.every(Number.isFinite),'all physical/render components stay finite'));
      const active=f.active.reduce((a,b)=>a+b,0);
      assert.equal(f.emitted-f.drained,active,'exact mass accounting through pour/recycling');
      for(let k=0;k<f.count;k++)if(f.active[k]){
        assert.ok(f.x[k]>=f.radius-1e-5&&f.x[k]<=f.width-f.radius+1e-5,'solid side walls');
        assert.ok(f.y[k]>=f.radius-1e-5&&f.y[k]<=f.height-f.radius+1e-5,'contained free surface');
      }
    };
    f.update(1/60,.5,.5,false,false);
    assert.equal(f.emitted,33,'2000 particles/second, independent of capacity');
    assert.ok(f.x.slice(0,33).every(x=>Math.abs(x-f.width*.5)<.2),'initial stream is centered');
    for(let i=0;i<300;i++){f.update(1/60,.5,.5,false,false);if(i%60===0)check();}
    assert.equal(f.active.reduce((a,b)=>a+b,0),f.count);
    const before=f.emitted;
    for(let i=0;i<20;i++)f.update(1/60,.3,.7,true,false);
    assert.equal(f.emitted,before,'hover is an obstacle, not an emitter');assert.equal(f.drained,0);
    for(let i=0;i<150;i++){f.update(1/60,.25,.82,true,true);if(i%30===0)check();}
    assert.ok(f.drained>100&&f.emitted>f.count,'held pointer opens floor and feeds recycled particles');
    assert.equal(f.pouring,true);
    let stream=0;for(let k=0;k<f.count;k++)if(f.active[k]&&Math.abs(f.x[k]/f.width-.25)<.08&&f.y[k]/f.height>.68)stream++;
    assert.ok(stream>8,'a localized stream falls beneath the held emitter');
    const drained=f.drained;for(let i=0;i<60;i++)f.update(1/60,.75,.75,true,false);
    assert.equal(f.pouring,false);assert.equal(f.drained,drained,'release closes the drain immediately');check();
    assert.equal(f.x,arrays[0],'no physical buffer reallocation per frame');
    f.update(NaN,NaN,Infinity,true,true);check();
    f.configure(width,height,5600,true);const still=f.x.slice(), stillY=f.y.slice();
    f.update(5,.5,.5,true,true);assert.deepEqual(f.x,still);assert.deepEqual(f.y,stillY);assert.equal(f.steps,0);
    f.configure(width,height);f.setCollider({left:f.width*.4,right:f.width*.6,bottom:f.height*.08,top:f.height*.16});
    for(let i=0;i<90;i++)f.update(1/60,.5,.5,false,false);
    for(let k=0;k<f.count;k++)if(f.active[k])assert.ok(!(f.x[k]>f.width*.4+1e-6&&f.x[k]<f.width*.6-1e-6&&f.y[k]>f.height*.08+1e-6&&f.y[k]<f.height*.16-1e-6),'scroll pill is a solid obstacle');
    console.log(`PASS CTA fluid ${width}×${height}: native capacity/gravity, center fall, hover, held-localized recycling, release, mass, finite bounds, stable buffers, static reduced motion and pill collision.`);
  }
  const {createAboutContactWave}=await import(pathToFileURL(`${dir}/AboutContactWave.mjs`));
  const wave=createAboutContactWave();wave.layout(1720,912);wave.setTime(1);wave.setTime(2);
  assert.equal(wave.group.children.length,4);assert.equal(wave.count,1800);
  let disposed=0;const materials=new Set();
  wave.group.children.forEach(mesh=>{
    assert.ok(mesh.geometry instanceof THREE.InstancedBufferGeometry);
    assert.equal(mesh.geometry.instanceCount,450);
    assert.equal(mesh.material.depthTest,false);assert.equal(mesh.material.depthWrite,false);
    mesh.geometry.addEventListener('dispose',()=>disposed++);materials.add(mesh.material);
  });
  materials.forEach(m=>m.addEventListener('dispose',()=>disposed++));wave.dispose();wave.dispose();assert.equal(disposed,5);
  const {aboutContactEase}=await import(pathToFileURL(`${dir}/AboutContactMotion.mjs`));
  assert.equal(aboutContactEase(0),0);assert.equal(aboutContactEase(1),1);
  let last=0;for(let i=0;i<=1000;i++){const t=aboutContactEase(i/1000);assert.ok(t>=last&&t<=1);last=t;}
  console.log('PASS four real instanced shape families, native capacity, shared shader, exactly-once disposal and monotone native cubic-bezier.');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
