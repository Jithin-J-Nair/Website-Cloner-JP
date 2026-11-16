import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
const dir=fs.mkdtempSync(path.resolve('temp/case-clarity-unit-'));
const compile=(name,source)=>{const file=path.join(dir,name+'.mjs');fs.writeFileSync(file,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);return pathToFileURL(file).href;};
try{
 const home=compile('home',fs.readFileSync('src/lib/home-motion.ts','utf8'));
 const math=compile('clarity',fs.readFileSync('src/lib/case-study-motion.ts','utf8').replace('"./home-motion"',JSON.stringify(home)));
 const {caseStudyScrollStrength:strength,caseStudyRenderDpr:dpr}=await import(math);
 for(const fps of [20,30,60,120,240]){
  for(const direction of [-1,1]){const delta=direction*720/fps/1440;for(let i=0;i<fps*3;i++)assert.equal(strength(delta),delta,'must not accumulate or smooth an already smoothed position');assert.equal(strength(0),0,'first stationary frame has no residual distortion');}
 }
 assert.equal(strength(.5),.15);assert.equal(strength(-.5),-.15);assert.equal(strength(.01,true),0);for(const n of [NaN,Infinity,-Infinity])assert.equal(strength(n),0);
 for(const [w,h]of [[390,844],[1440,900],[1720,912],[1920,1080],[2560,1440],[3840,2160]])for(const device of [1,1.25,1.5,2,3]){
  const r=dpr(w,h,device,8192);assert.ok(r<=2&&r<=device);assert.ok(w*h*r*r<=3840*2160+1e-5);if(w*h*device*device<=3840*2160&&device<=2)assert.equal(r,device);
 }
 assert.equal(dpr(1440,900,2,8192),2);assert.equal(dpr(1920,1080,1,8192),1);assert.equal(dpr(10000,1000,2,4096),.4096,'respect GPU texture dimensions as well as pixel count');
 // Exercise actual compositor resize/uniforms with a renderer double, not GPU pixels.
 globalThis.devicePixelRatio=2;globalThis.HTMLVideoElement=class{};
 const texture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
 const shadow=compile('shadow',`import * as THREE from 'three';export function createCaseStudyShadows(){return{texture:new THREE.DataTexture(),view:new THREE.Matrix4(),resize(){},render(){},dispose(){}}}`);
 const originalLoad=THREE.TextureLoader.prototype.load;
 THREE.TextureLoader.prototype.load=function(){return texture;};
 const rendered=[];let renderTarget=null,screen=null;const canvas={dataset:{}};
 globalThis.__clarityRenderer={capabilities:{maxTextureSize:8192},setClearColor(){},setPixelRatio(v){this.ratio=v},setSize(w,h){this.width=w;this.height=h},getDrawingBufferSize(v){return v.set(Math.floor(this.width*this.ratio),Math.floor(this.height*this.ratio))},setRenderTarget(t){renderTarget=t;if(t)screen=t},clear(){},render(scene){rendered.push({scene,target:renderTarget})},dispose(){},forceContextLoss(){}};
 try{
  const src=fs.readFileSync('src/components/case-study/CaseStudyGraphics.ts','utf8').replace('"@/lib/case-study-motion"',JSON.stringify(math)).replace('"./CaseStudyShadows"',JSON.stringify(shadow)).replace('new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "low-power" })','globalThis.__clarityRenderer');
  const {createCaseStudyGraphics}=await import(compile('graphics',src));
  const graphics=createCaseStudyGraphics(canvas,1,false,()=>{});
  const media={currentSrc:'/fixture.png',complete:true,naturalWidth:1820};const element={dataset:{},querySelector:()=>media};
  const frame={element,left:0,top:0,width:500,height:500,reveal:.2,fullscreen:true};
  for(const device of [1,1.25,2])for(const [w,h]of [[1441,901],[1920,1080]]){
   globalThis.devicePixelRatio=device;graphics.resize(w,h);graphics.render([frame],1,.01,false,0,0,1,1/60,.01);
   const target=screen;const size=graphics.renderer.getDrawingBufferSize(new THREE.Vector2());assert.equal(target.width,size.x);assert.equal(target.height,size.y);
   const panel=rendered.at(-2).scene.children[0].material,final=rendered.at(-1).scene.children[0].material;
   assert.equal(panel.uniforms.uFullscreen.value,1);assert.equal(panel.uniforms.uReveal.value,.2);assert.equal(panel.uniforms.uRadius.value,0);
   assert.match(panel.fragmentShader,/max\(uFullscreen,uReveal\)/,'fullscreen mask is independent of UV entrance zoom');assert.match(final.fragmentShader,/i<8/,'native eight-tap effect is retained');assert.equal(final.uniforms.uVelocity.value,.01);
   graphics.render([frame],1,0,false,0,0,1,1/60,0);assert.equal(final.uniforms.uVelocity.value,0);
  }
  graphics.dispose();
 }finally{THREE.TextureLoader.prototype.load=originalLoad;texture.dispose();}
 console.log('PASS signed per-frame displacement/no blur tail, reduced/finite bounds, UHD/2x/GL limits, exact canvas/RT texel grid, fullscreen mask independent of UV reveal, native eight taps retained. Renderer double, not visual parity.');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
