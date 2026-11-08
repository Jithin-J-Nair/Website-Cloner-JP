#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const load = async file => import(`data:text/javascript;base64,${Buffer.from(ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText).toString('base64')}`);
const {decodeAboutSourceBuffer:decode}=await load('src/lib/about-source-buffer.ts');
const {GET}=await load('src/app/about/scene/[asset]/route.ts');
const sources=Object.fromEntries(['edan','ffi','pierre','yannic','paul','andrii','sunny'].map(id=>[`${id}.buf`,`team/${id}.buf`]));sources['contours.buf']='models/about/terrain_lines.buf';
for(const [asset,relative]of Object.entries(sources)){
 const bytes=fs.readFileSync(`media-bundle/${relative}`),buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),data=decode(buffer);
 assert.equal(data.count,asset==='contours.buf'?11832:8192);assert.equal(data.attributes.position.length,data.count*3);
 for(const attr of Object.values(data.attributes))assert.ok(attr.every(Number.isFinite));
 if(asset!=='contours.buf'){assert.equal(data.attributes.nShade.length,8192*4);assert.ok(data.attributes.nShade.every(v=>v>=0&&v<=255));}
 assert.throws(()=>decode(buffer.slice(0,-1)));assert.throws(()=>decode(buffer.slice(0,6)));
 const response=await GET(new Request(`http://test/about/scene/${asset}`),{params:Promise.resolve({asset})});assert.equal(response.status,200);
 assert.deepEqual(Buffer.from(await response.arrayBuffer()),bytes);assert.equal(response.headers.get('x-content-type-options'),'nosniff');assert.equal(response.headers.get('cross-origin-resource-policy'),'same-origin');assert.match(response.headers.get('content-security-policy'),/sandbox/);
 assert.equal((await GET(new Request(`http://test/about/scene/${asset}`,{headers:{'if-none-match':response.headers.get('etag')}}),{params:Promise.resolve({asset})})).status,304);
}
for(const asset of ['../../package.json','__proto__','Aeonik-Regular.woff2','terrain_lines.buf','person_walk.buf','team.json','jithin-portrait.ply'])assert.equal((await GET(new Request('http://test/about/scene/forbidden'),{params:Promise.resolve({asset})})).status,404);
assert.throws(()=>decode(new ArrayBuffer(4_000_001)));assert.throws(()=>decode(new Uint8Array(30).fill(255).buffer));
assert.equal(fs.existsSync('public/about-media/jithin-portrait.ply'),false);
for(const file of ['AboutPhotoPortrait','AboutPortraitSurface','AboutBodyContours'])assert.equal(fs.existsSync(`src/components/three/${file}.ts`),false);
assert.doesNotMatch(fs.readFileSync('src/components/pages/AboutPageView.tsx','utf8'),/loadAboutPhotoPortrait|buildSculpturalPortraitPositions|Portrait: Jithin/);
console.log('PASS: eight original geometry buffers decode; finite positions/attributes; truncation rejected; exact-byte allowlisted delivery, ETag/304/security headers; non-allowlisted paths denied; personal-photo runtime removed.');

// Exercise the actual stage without a renderer: selection identity, GPU-buffer
// reuse, exact interruption continuity and cleanup are independent of WebGL.
const decoderCode=ts.transpileModule(fs.readFileSync('src/lib/about-source-buffer.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const decoderURL=`data:text/javascript;base64,${Buffer.from(decoderCode).toString('base64')}`;
const stageCode=ts.transpileModule(fs.readFileSync('src/components/three/AboutSourceTeam.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText.replace('"three"',JSON.stringify(import.meta.resolve('three'))).replace('"@/lib/about-source-buffer"',JSON.stringify(decoderURL));
const {createAboutSourceTeam}=await import(`data:text/javascript;base64,${Buffer.from(stageCode).toString('base64')}`),THREE=await import('three');
const nativeFetch=globalThis.fetch,states=[];let invalidations=0,releaseSunny,failPaul=false;
const responseFor=id=>new Response(fs.readFileSync(`media-bundle/${sources[`${id}.buf`]}`));
globalThis.fetch=async url=>{const id=String(url).split('/').at(-1).replace('.buf','');if(id==='sunny')return new Promise(resolve=>{releaseSunny=()=>resolve(responseFor(id))});return id==='paul'&&failPaul?new Response('',{status:404}):responseFor(id)};
try{
 const stage=createAboutSourceTeam(()=>invalidations++,(state,id)=>states.push({state,id})),camera=new THREE.PerspectiveCamera(45,1568/832,.1,100);camera.position.z=6;
 const update=(time,reduced=false)=>stage.update(camera,time,1,0,new THREE.Vector2(.2,.1),1568,832,1,reduced,1.2);
 const geo=stage.head.children[0].geometry,pos=geo.getAttribute('position'),from=geo.getAttribute('aFrom');
 await stage.setMember(0,true);update(0,true);assert.equal(stage.member,'edan');assert.equal(stage.ready,true);assert.equal(stage.morph,1);
 await stage.setMember(1,false);update(.08);const m=stage.morph**2*(3-2*stage.morph),visible=Float32Array.from(pos.array,(v,i)=>from.array[i]*(1-m)+v*m);
 await stage.setMember(2,false);assert.equal(stage.member,'pierre');assert.ok(from.array.every((v,i)=>Math.abs(v-visible[i])<1e-6),'interruption must bake the shader-eased pose, not its linear clock');assert.equal(stage.head.children[0].geometry,geo);assert.equal(geo.getAttribute('position'),pos);
 const late=stage.setMember(6,false);await stage.setMember(3,true);const yannic=pos.array.slice();releaseSunny();await late;assert.equal(stage.member,'yannic');assert.deepEqual(pos.array,yannic,'late response must not replace a more recent selection');
 failPaul=true;await stage.setMember(4,false);update(.2);assert.equal(stage.ready,false);assert.equal(stage.head.visible,false);assert.deepEqual(states.at(-1),{state:'unavailable',id:'paul'});
 failPaul=false;await stage.setMember(4,true);update(.3,true);assert.equal(stage.ready,true);assert.equal(stage.head.visible,true);assert.equal(stage.member,'paul');
 await stage.setMember(NaN,true);assert.equal(stage.member,'edan');assert.ok(invalidations>0);
 let disposed=0;stage.group.traverse(o=>{o.geometry?.addEventListener('dispose',()=>disposed++);o.material?.addEventListener('dispose',()=>disposed++);o.material?.uniforms?.uGlyphs?.value.addEventListener('dispose',()=>disposed++)});stage.dispose();assert.equal(disposed,9);const stateCount=states.length;await stage.setMember(1,false);assert.equal(states.length,stateCount,'disposed stage cannot load or update');
 console.log('PASS: source stage identity/buffer reuse, shader-eased interrupt continuity, stale-response isolation, honest load-failure/recovery, finite-index fallback and all nine owned GPU-resource disposals.');
}finally{globalThis.fetch=nativeFetch}
