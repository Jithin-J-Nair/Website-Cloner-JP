import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
import * as THREE from 'three';
const dir=fs.mkdtempSync(path.resolve('temp/project-zoom-unit-'));
const compile=(name,source)=>{const file=path.join(dir,name+'.mjs');fs.writeFileSync(file,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);return pathToFileURL(file).href;};
try {
 const motion=compile('motion',fs.readFileSync('src/lib/project-zoom-motion.ts','utf8'));
 const {projectZoomPose:pose,projectZoomProgress:progress,projectDomOpacity:opacity}=await import(motion);
 for(const [w,h]of [[320,568],[390,844],[900,600],[1440,764],[1720,912],[2560,1440]]){
  for(const right of [false,true]){
   const box={x:w*(right?.51:.05),y:h*.25,width:w*.44,height:w*.44*.65};
   const first=pose(w,h,box,0),last=pose(w,h,box,1);
   assert.equal(first.scale,1);assert.equal(Math.abs(first.angle),0);assert.equal(first.active,0);
   assert.ok(Math.abs(first.pivotX+w*.5)<1e-9);assert.ok(Math.abs(first.pivotY-h*.5)<1e-9);
   assert.ok(last.scale*box.width>=w&&last.scale*box.height>=h,'full cover with overscan');
   assert.equal(last.active,1);assert.equal(right?last.angle<0:last.angle>0,true,'mirrored selected-column trajectories');
   for(let i=0;i<=100;i++){
    const p=pose(w,h,box,i/100);assert.ok(p.scale>=1&&Number.isFinite(p.angle));assert.ok(p.active>=0&&p.active<=1);
   }
   const group=new THREE.Group(),pivot=new THREE.Group();group.add(pivot);
   group.position.set(w/2,-h/2,0);group.rotation.set(0,last.angle,-last.angle);group.scale.setScalar(last.scale);pivot.position.set(last.pivotX,last.pivotY,0);group.updateMatrixWorld(true);
   const center=new THREE.Vector3(box.x+box.width/2,-box.y-box.height/2,0).applyMatrix4(pivot.matrixWorld);
   assert.ok(Math.abs(center.x-w/2)<1e-8&&Math.abs(center.y+h/2)<1e-8,'selected center lands exactly at viewport center');
  }
 }
 assert.equal(progress(0),0);assert.equal(progress(.75),1);assert.equal(progress(1),1);
 assert.equal(opacity(0),1);assert.equal(opacity(.5),0);assert.equal(opacity(1),0);
 const registry=await import(compile('registry',fs.readFileSync('src/lib/project-transition.ts','utf8')));
 globalThis.innerWidth=1720;globalThis.innerHeight=912;globalThis.devicePixelRatio=1;globalThis.location={search:''};
 const storage=new Map();globalThis.sessionStorage={getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)};
 assert.equal(registry.getProjectReturnPath(),'/');registry.rememberProjectOrigin('/projects');assert.equal(registry.getProjectReturnPath(),'/projects');registry.rememberProjectOrigin('https://evil.example');assert.equal(registry.getProjectReturnPath(),'/projects');registry.rememberProjectOrigin('/');assert.equal(registry.getProjectReturnPath(),'/');
 registry.setProjectDisclosure(.25);assert.equal(registry.getProjectDisclosure(),.25);registry.setProjectDisclosure(null);
 class Element {
  constructor(tag){this.tag=tag;this.style={};this.children=[];this.dataset={};this.events=new Map();}
  append(...children){this.children.push(...children);}
  addEventListener(name,fn){this.events.set(name,fn);}
  removeEventListener(name){this.events.delete(name);}
  remove(){this.removed=true;}
  querySelector(tag){return this.children.find(child=>child.tag===tag)||null;}
 }
 globalThis.document={createElement:tag=>new Element(tag)};
 const data=compile('data',`export const LUSION_PROJECTS_ARCHIVE={projects:[{id:'test',colorBg:'#181818',thumbnail:'/test.webp',depthMap:'/depth.webp',thumbnailWidth:1200,thumbnailHeight:900}]};`);
 const shaders=compile('shaders',`export const editorialProjectVertex='',editorialProjectFragment='';`);
 globalThis.__projectZoomUnit={renders:[],disposed:0,lost:0};
 const surfaceSource=fs.readFileSync('src/components/foundation/ProjectZoomSurface.ts','utf8')
  .replace('"@/data/reference"',JSON.stringify(data)).replace('"@/components/home/HomeEditorialShaders"',JSON.stringify(shaders)).replace('"@/lib/project-zoom-motion"',JSON.stringify(motion))
  .replace('new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "low-power" })',`new class {setClearColor(){} setPixelRatio(){} getPixelRatio(){return 1} setSize(){} render(scene){globalThis.__projectZoomUnit.renders.push(scene.children[0].children[0].children[0]);} dispose(){globalThis.__projectZoomUnit.disposed++;} forceContextLoss(){globalThis.__projectZoomUnit.lost++;}}`);
 const {createProjectZoomSurface}=await import(compile('surface',surfaceSource));
 const texture=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);
 const material=new THREE.ShaderMaterial({uniforms:{u_domXY:{value:new THREE.Vector2()},u_domWH:{value:new THREE.Vector2()},u_padding:{value:new THREE.Vector2()},u_rotation:{value:0},u_colorBg:{value:new THREE.Color()},u_focusPos:{value:new THREE.Vector3(7,9,-1)},u_zoomRatio:{value:.3},u_activeRatio:{value:0},u_showRatio:{value:1},u_rippleStrength:{value:.1},u_resolution:{value:new THREE.Vector2()},u_texture:{value:texture}}});
 const geometry=new THREE.PlaneGeometry(1,1),mesh=new THREE.Mesh(geometry,material);
 let sourceDisposals=0;for(const resource of [geometry,material,texture])resource.addEventListener('dispose',()=>sourceDisposals++);
 const root=new Element('div'),canvas=new Element('canvas');const box={x:86,y:228,width:756.8,height:491.92};
 const surface=createProjectZoomSurface(root,{id:'test',box,background:'#181818',snapshot:{canvas,cards:[{id:'test',rect:box,mesh}]}});
 surface.paint(.5);const clone=globalThis.__projectZoomUnit.renders.at(-1);
 assert.notEqual(clone.material,material);assert.notEqual(clone.geometry,geometry);assert.notEqual(clone.material.uniforms.u_texture.value,texture);
 assert.equal(material.uniforms.u_activeRatio.value,0);assert.equal(clone.material.uniforms.u_activeRatio.value,.25);
 assert.deepEqual(material.uniforms.u_focusPos.value.toArray(),[7,9,-1]);
 let ownDisposals=0;for(const resource of [clone.geometry,clone.material,clone.material.uniforms.u_texture.value])resource.addEventListener('dispose',()=>ownDisposals++);
 surface.dispose();surface.dispose();assert.equal(sourceDisposals,0);assert.equal(ownDisposals,3);assert.equal(globalThis.__projectZoomUnit.disposed,1);assert.equal(globalThis.__projectZoomUnit.lost,1);
 // A compositor context loss switches to an image-based transform, not a stuck curtain.
 const lostSurface=createProjectZoomSurface(root,{id:'test',box,background:'#181818',snapshot:{canvas,cards:[{id:'test',rect:box,mesh}]}});
 lostSurface.host.children[0].events.get('webglcontextlost')({preventDefault(){}});lostSurface.paint(.5);assert.equal(lostSurface.host.dataset.graphics,'fallback');assert.match(lostSurface.host.children[1].style.transform,/matrix3d/);lostSurface.dispose();
 geometry.dispose();material.dispose();texture.dispose();
 console.log('PASS list pivot/cover/column tilt, depth and fade endpoints, origin/disclosure, isolated source resources, idempotent disposal, context-loss image fallback. Renderer mocked; not GPU pixel verification.');
} finally { fs.rmSync(dir,{recursive:true,force:true}); }
