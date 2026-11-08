#!/usr/bin/env node
/** Real archived assets and runtime ownership tests. No GPU/parity claims here;
 * shader compilation, rendered captures and browser recovery are separate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
const directory=fs.mkdtempSync(path.resolve('temp/about-reference-unit-'));
const nativeFetch=globalThis.fetch,nativeBitmap=globalThis.createImageBitmap;
try{
 for(const name of ['about-reference-shaders','AboutReferenceParticles','AboutReferenceWorld','AboutWordmarkSweep']){
  let text=fs.readFileSync(`src/components/three/${name}.ts`,'utf8').replace('@/lib/about-source-buffer','./buffer.mjs');
  for(const dependency of ['about-reference-shaders','AboutReferenceParticles'])text=text.replaceAll(`"./${dependency}"`,`"./${dependency}.mjs"`);
  fs.writeFileSync(`${directory}/${name}.mjs`,ts.transpileModule(text,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 }
 fs.writeFileSync(`${directory}/buffer.mjs`,ts.transpileModule(fs.readFileSync('src/lib/about-source-buffer.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {decodeAboutSourceBuffer:decode}=await import(pathToFileURL(`${directory}/buffer.mjs`));
 const read=name=>{const b=fs.readFileSync(`media-bundle/models/about/${name}.buf`);return decode(b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength))};
 const terrain=read('terrain'),cameraData=read('camera_spline'),human=read('person'),idle=read('person_idle');
 assert.equal(terrain.count,13872);assert.equal(terrain.attributes.indices.length,80238);
 assert.equal(cameraData.count,200);assert.equal(human.count,2666);assert.equal(idle.count,54*85);
 assert.ok(human.attributes.boneIndices.every(x=>Number.isInteger(x)&&x>=0&&x<54));
 for(let i=0;i<human.count;i++)assert.ok(Math.abs(human.attributes.boneWeights[i*2]+human.attributes.boneWeights[i*2+1]-1)<.0001);
 for(const id of ['terrain','camera_spline','person','person_idle','logo_text','sphere_l','sphere_m','sphere_s','sphere_xs',...Array.from({length:4},(_,i)=>`rock_${i}`),...Array.from({length:4},(_,i)=>`rock_animation_${i}`)]){
  const data=read(id);assert.ok(Object.values(data.attributes).every(a=>a.every(Number.isFinite)),`${id} is finite`);
  if(data.attributes.indices)assert.ok(data.attributes.indices.every(x=>Number.isInteger(x)&&x>=0&&x<data.count));
 }
 // Check every packed component against the ACTUAL container decoder, whose
 // denominator is 2^bits, not 2^bits-1. The former reader had a subtle error.
 for(const id of ['terrain','person','rock_0','rock_animation_0']){
  const b=fs.readFileSync(`media-bundle/models/about/${id}.buf`),headerLength=b.readUInt32LE(0),header=JSON.parse(b.subarray(4,4+headerLength));let offset=4+headerLength;const data=read(id);
  for(const a of header.attributes){
   const bytes=a.storageType==='Float32Array'?4:a.storageType==='Uint8Array'?1:2,count=(a.id==='indices'?header.indexCount:header.vertexCount)*a.componentSize;
   if(a.needsPack)for(let i=0;i<count;i++){
    const signed=a.storageType==='Int16Array',raw=bytes===1?b.readUInt8(offset+i):signed?b.readInt16LE(offset+i*2):b.readUInt16LE(offset+i*2),r=a.packedComponents[i%a.componentSize];
    assert.equal(data.attributes[a.id][i],Math.fround(r.from+(raw+(signed?32768:0))/2**(bytes*8)*r.delta));
   }
   offset+=count*bytes;
  }
 }
 // Exercise delivery of newly allowlisted data/images as well as the decoder.
 fs.writeFileSync(`${directory}/route.mjs`,ts.transpileModule(fs.readFileSync('src/app/about/scene/[asset]/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);
 const {GET}=await import(pathToFileURL(`${directory}/route.mjs`));
 for(const asset of ['terrain.buf','person.buf','person_idle.buf','camera_spline.buf','logo_text.buf','rock_0.buf','rock_animation_0.buf','sphere_l.buf','terrain_shadow_light_height.webp','card-back.png']){
  const url=`http://test/about/scene/${asset}`,response=await GET(new Request(url),{params:Promise.resolve({asset})});
  assert.equal(response.status,200);const source=asset==='card-back.png'?'images/cards/back.png':asset.endsWith('.buf')?`models/about/${asset}`:`textures/about/${asset}`;
  assert.deepEqual(Buffer.from(await response.arrayBuffer()),fs.readFileSync(`media-bundle/${source}`));
  assert.equal(response.headers.get('content-type'),asset.endsWith('.png')?'image/png':asset.endsWith('.webp')?'image/webp':'application/octet-stream');
  assert.equal((await GET(new Request(url,{headers:{'if-none-match':response.headers.get('etag')}}),{params:Promise.resolve({asset})})).status,304);
 }
 for(const asset of ['../../package.json','Aeonik-Regular.woff2','__proto__','somewhere.js','home.buf'])assert.equal((await GET(new Request('http://test'),{params:Promise.resolve({asset})})).status,404);
 const calls=[],owned=new Set(),signals=[],bitmaps=[];let target=null,clear=new THREE.Color(.1,.2,.3),alpha=.4,fail=false;
 const watch=item=>{if(item&&!owned.has(item)){owned.add(item);item.__disposeCount=0;item.addEventListener?.('dispose',()=>item.__disposeCount++)}};
 const renderer={autoClear:false,capabilities:{getMaxAnisotropy:()=>4},getRenderTarget:()=>target,getClearAlpha:()=>alpha,getClearColor:c=>c.copy(clear),setClearColor:(c,a)=>{clear.set(c);alpha=a},setRenderTarget:rt=>{target=rt;watch(rt)},render:(scene)=>{
  if(fail)throw new Error('forced render failure');
  scene.traverse(o=>{watch(o.geometry);watch(o.material)});calls.push(target);
 }};
 globalThis.fetch=async(url,{signal}={})=>{
  signals.push(signal);const name=String(url).split('/').at(-1);let file=name.endsWith('.buf')?`media-bundle/models/about/${name}`:`media-bundle/textures/about/${name}`;
  assert.ok(fs.existsSync(file),`only existing About assets: ${name}`);return new Response(fs.readFileSync(file));
 };
 globalThis.createImageBitmap=async()=>{const bitmap={width:1,height:1,closed:0,close(){this.closed++}};bitmaps.push(bitmap);return bitmap};
 const {createAboutReferenceWorld}=await import(pathToFileURL(`${directory}/AboutReferenceWorld.mjs`));
 const states=[];let invalidations=0;
 const world=createAboutReferenceWorld(renderer,true,false,()=>invalidations++,state=>states.push(state));
 for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(world.ready,true);assert.deepEqual(states,['ready']);assert.equal(world.count,8192);assert.ok(invalidations>0);
 const camera=new THREE.PerspectiveCamera(60,1440/764,.1,220),pointer=new THREE.Vector2();
 const update=(u,time=1)=>world.update(camera,u,time,false,pointer);
 const originalTarget={name:'previous target'};target=originalTarget;const originalClear=clear.clone();
 update(0);assert.equal(target,originalTarget);assert.equal(renderer.autoClear,false);assert.equal(alpha,.4);assert.deepEqual(clear,originalClear);assert.equal(calls.length,26,'24 warmup integrations, one density splat, one temporal filter');
 const samples=[];
 for(const u of [0,.8,1.6,2.2,3.3,5,5.25,6.125,7.2,9.5]){update(u);samples.push({u,p:camera.position.clone(),q:camera.quaternion.clone()});}
 for(const sample of samples.reverse()){update(sample.u);assert.ok(camera.position.distanceTo(sample.p)<1e-8);assert.ok(camera.quaternion.angleTo(sample.q)<1e-7);}
 // Native negative-Z camera and the rotated world must project identical pixels.
 const turn=new THREE.Matrix4().makeRotationY(Math.PI),nativeCamera=new THREE.PerspectiveCamera(60,1440/764,.1,220),p=new THREE.Vector3(),q=new THREE.Quaternion(),dir=new THREE.Vector3();
 for(const index of [0,10,25,50,100,149]){
  const u=index/149*5.25;update(u);nativeCamera.position.fromArray(cameraData.attributes.position,index*3);q.fromArray(cameraData.attributes.orient,index*4);dir.set(0,0,1).applyQuaternion(q);nativeCamera.lookAt(nativeCamera.position.clone().add(dir));nativeCamera.updateMatrixWorld();
  // Undo the documented .2m dolly compensation for a pure handedness comparison.
  camera.position.copy(nativeCamera.position).applyMatrix4(turn);camera.lookAt(nativeCamera.position.clone().add(dir).applyMatrix4(turn));camera.updateMatrixWorld();
  for(const vertex of [0,100,700,3000,13871]){p.fromArray(terrain.attributes.position,vertex*3);const a=p.clone().project(nativeCamera),b=p.applyMatrix4(turn).project(camera);assert.ok(a.distanceTo(b)<1e-5,'no accidental horizontal mirror or winding reflection');}
 }
 const allocations=owned.size;for(let t=2;t<4;t+=.05)update(.8,t);assert.equal(owned.size,allocations,'per-frame updates must reuse GPU buffers and targets');
 fail=true;assert.throws(()=>update(.8,5),/forced render failure/);assert.equal(target,originalTarget);assert.equal(renderer.autoClear,false);assert.deepEqual(clear,originalClear);fail=false;
 world.group.traverse(o=>{watch(o.geometry);watch(o.material)});world.dispose();world.dispose();
 assert.ok(signals.every(s=>s.aborted));assert.ok(bitmaps.every(b=>b.closed===1));
 for(const resource of owned)if(resource!==originalTarget)assert.equal(resource.__disposeCount,1,'each observed GPU resource is disposed exactly once');
 // Reduced motion submits one developed pose, then reuses it; scroll still
 // moves the camera and visibility without restarting simulation or skinning.
 const still=createAboutReferenceWorld(renderer,true,true,()=>{},()=>{});for(let i=0;i<10;i++)await new Promise(resolve=>setImmediate(resolve));
 still.update(camera,.8,1,false,pointer);const stillCalls=calls.length;
 still.update(camera,.8,20,false,pointer);assert.equal(calls.length,stillCalls);still.dispose();
 const {createAboutWordmarkSweep}=await import(pathToFileURL(`${directory}/AboutWordmarkSweep.mjs`));
 const logo=createAboutWordmarkSweep();for(let i=0;i<4;i++)await new Promise(resolve=>setImmediate(resolve));
 assert.equal(logo.ready,true);assert.equal(logo.mesh.geometry.getAttribute('position').count,1400);assert.equal(logo.mesh.geometry.index.count,6270);
 logo.layout(1440,764,{x:72,y:538,width:205,height:41});assert.equal(logo.uniforms.uFrom.value.z,1296);assert.equal(logo.uniforms.uFrom.value.w,1296*.200956762);logo.dispose();logo.dispose();
 console.log('PASS actual source world: 17 buffers/quantization; 54×85 skinning clip; 200-sample spline; native/rotated projection equivalence; finite/reversible seeks; persistent ping-pong state; renderer-state restoration including failure; zero per-frame allocations; abort/bitmap and exactly-once GPU cleanup; real vector-logo geometry.');
}finally{globalThis.fetch=nativeFetch;globalThis.createImageBitmap=nativeBitmap;fs.rmSync(directory,{recursive:true,force:true});}
