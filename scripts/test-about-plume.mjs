#!/usr/bin/env node
import fs from 'node:fs';import path from 'node:path';import assert from 'node:assert/strict';import {pathToFileURL} from 'node:url';import ts from 'typescript';
fs.mkdirSync('temp',{recursive:true});const dir=fs.mkdtempSync(path.resolve('temp/about-unit-'));
try{
 const code=ts.transpileModule(fs.readFileSync('src/components/three/AboutPlume.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;fs.writeFileSync(`${dir}/plume.mjs`,code);
 const {createAboutPlume}=await import(pathToFileURL(`${dir}/plume.mjs`));
 for(const count of [900,1800,3200,4800]){
  const a=createAboutPlume(count),b=createAboutPlume(count);assert.equal(a.group.children.length,2);const mesh=a.group.children[0],dust=a.group.children[1];
  assert.equal(mesh.geometry.attributes.position.count,4,'four analytical sphere vertices, not 240 repeated trajectory evaluations');
  assert.equal(mesh.geometry.index.count,6,'two triangles per analytical sphere at every quality tier');
  assert.match(mesh.material.fragmentShader,/sqrt\(max\(0\., 1\. - r2\)\)/,'curved sphere normal, not a flat billboard');
  assert.match(mesh.material.fragmentShader,/gl_FragDepth = .*surfaceClip\.z \/ surfaceClip\.w/,'write projected curved surface depth for world occlusion');
  assert.equal(mesh.geometry.instanceCount,count);assert.equal(dust.geometry.attributes.position.count,count*4);assert.deepEqual(mesh.geometry.attributes.aSeed.array,b.group.children[0].geometry.attributes.aSeed.array);
  const fine=dust.geometry.attributes.aSeed.array;
  assert.equal(fine.length,count*16);assert.ok(fine.every(Number.isFinite));
  assert.deepEqual(fine,b.group.children[1].geometry.attributes.aSeed.array);
  assert.notDeepEqual(fine.slice(0,16),mesh.geometry.attributes.aSeed.array.slice(0,16),'fine grains have independent positions, not duplicate overlapping instances');
  assert.match(dust.material.fragmentShader,/#include <colorspace_fragment>/);
  for (const material of [mesh.material, dust.material]) {
    assert.match(material.fragmentShader, /uniform float[^;]*uCyanBoost/);
    assert.match(material.fragmentShader, /clamp\(uCyanBoost \* vCore/);
  }
  assert.match(mesh.material.fragmentShader,/#include <tonemapping_fragment>/);
  const seeds=mesh.geometry.attributes.aSeed.array;assert.ok(seeds.every(Number.isFinite));for(let i=0;i<count;i++){assert.ok(seeds[i*4]>=0&&seeds[i*4]<=1);assert.ok(seeds[i*4+2]>=0&&seeds[i*4+2]<=Math.PI);}
  assert.equal(mesh.material.uniforms,dust.material.uniforms,'layers share one transport/pointer packet');assert.match(mesh.material.vertexShader,/plume\(aSeed\)/);assert.match(mesh.material.fragmentShader,/specular/);
  let disposed=0;for(const child of a.group.children){child.geometry.addEventListener('dispose',()=>disposed++);child.material.addEventListener('dispose',()=>disposed++);}a.dispose();assert.equal(disposed,4);b.dispose();
 }
 const source=fs.readFileSync('src/components/pages/AboutPageView.tsx','utf8');assert.ok(!source.includes('loadLusionBuf'),'About must not fetch restricted portrait binaries');assert.match(source,/webglcontextrestored/);assert.match(source,/removeEventListener\("pointercancel"/);assert.match(source,/frameTimes.push\(elapsed \* 1000\)/,'observability must not clamp away stalls');
 console.log('PASS original deterministic finite multiscale instancing, shared GPU field packet, all quality counts, disposal events, no restricted portrait fetch, recovery/cancel cleanup and uncapped frame telemetry. Browser shader compilation/interaction is tested separately.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
