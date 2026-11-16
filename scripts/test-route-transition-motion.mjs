import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import ts from 'typescript';
const dir=fs.mkdtempSync(path.resolve('temp/route-motion-unit-'));
try {
  const compile=(name,source)=>{const file=path.join(dir,name+'.mjs');fs.writeFileSync(file,ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText);return file;};
  const easing=compile('ease',fs.readFileSync('src/lib/home-editorial-motion.ts','utf8'));
  const file=compile('route',fs.readFileSync('src/lib/route-transition-motion.ts','utf8').replace('"./home-editorial-motion"',JSON.stringify(pathToFileURL(easing).href)));
  const {routeAperturePose:pose,drawRouteAperture:draw,stepScrollPortal:step}=await import(pathToFileURL(file));
  for(const [w,h]of [[320,568],[390,844],[900,600],[1440,764],[2560,1440]]){
    const covered=pose(w,h,1,false),open=pose(w,h,0,false);
    assert.equal(covered.unit,Math.floor(Math.min(42,w/30)));assert.equal(covered.zoom,covered.unit);assert.equal(covered.ink,1);assert.equal(Math.abs(covered.angle),0);
    assert.equal(open.zoom,open.unit+Math.hypot(w+2,h+2));assert.equal(open.angle,-1);assert.equal(open.ink,0);
    for(let n=0;n<=100;n++){
      const a=pose(w,h,n/100,false),b=pose(w,h,n/100,true);assert.equal(a.zoom,b.zoom);assert.ok(Math.abs(a.angle+b.angle)<1e-9);assert.ok(a.zoom>=a.unit);assert.ok(a.ink>=0&&a.ink<=1);
    }
  }
  const calls=[];let depth=0;const ctx=new Proxy({}, {get(_o,key){return(...args)=>{calls.push([key,...args]);if(key==='save')depth++;if(key==='restore')depth--;};},set(_o,key,value){calls.push([key,value]);return true;}});
  draw(ctx,1440,764,2,.5,true);assert.equal(depth,0);assert.deepEqual(calls[1],['setTransform',2,0,0,2,0,0]);
  assert.equal(calls.filter(c=>c[0]==='globalCompositeOperation'&&c[1]==='xor').length,2);
  assert.deepEqual(calls.filter(c=>c[0]==='fillRect').map(c=>c.slice(1)),[[0,0,1442,766],[-3,0,3,1],[-3,0,3,1],[0,0,2,1],[0,0,2,1]]);
  for(const fps of [20,30,60,120,240]){
    let s={charge:0,wait:0};for(let n=0;n<fps/2;n++)s=step(s,1/fps,true,true,1);assert.ok(Math.abs(s.charge-1)<1e-10,'half-second sustained positive input charges once');
    s={charge:0,wait:0};for(let n=0;n<fps;n++)s=step(s,1/fps,true,false,1);assert.equal(s.charge,0,'not at bottom never charges');
    s={charge:.8,wait:0};for(let n=0;n<fps/2;n++)s=step(s,1/fps,true,true,-1);assert.equal(s.charge,0,'reverse drains rapidly');
    s={charge:.8,wait:0};for(let n=0;n<fps;n++)s=step(s,1/fps,true,true,0);assert.ok(Math.abs(s.charge-.6)<1e-10,'idle decay 0.2 per second');
  }
  let s=step({charge:.4,wait:.3},.1,true,true,0);assert.equal(s.charge,.4);assert.ok(Math.abs(s.wait-.2)<1e-10);
  s=step(s,.1,false,true,1);assert.equal(s.charge,0,'offscreen resets');
  assert.equal(step({charge:0,wait:0},1/60,true,true,1).charge,1/30,'one wheel packet is not a half-full bar');
  const store=compile('store','export const useStudioStore={getState:()=>({setMenuOpen(){}})};');
  const navigation=compile('navigation',fs.readFileSync('src/lib/route-navigation.ts','utf8').replace('"@/lib/store"',JSON.stringify(pathToFileURL(store).href)));
  const nav=await import(pathToFileURL(navigation));
  globalThis.window={};globalThis.location={origin:'https://preview.example',href:'https://preview.example/projects',pathname:'/projects'};
  const event={defaultPrevented:false,button:0,metaKey:false,ctrlKey:false,shiftKey:false,altKey:false};
  const anchor=(href,target='',download=false)=>({href:new URL(href,location.href).href,target,hasAttribute:name=>name==='download'&&download,getAttribute:name=>name==='href'?href:null});
  assert.equal(nav.shouldTransitionAnchor(event,anchor('/about')),true);
  for(const key of ['defaultPrevented','metaKey','ctrlKey','shiftKey','altKey'])assert.equal(nav.shouldTransitionAnchor({...event,[key]:true},anchor('/about')),false,key);
  assert.equal(nav.shouldTransitionAnchor({...event,button:1},anchor('/about')),false);
  for(const a of [anchor('/about','_blank'),anchor('/about','',true),anchor('mailto:hello@example.com'),anchor('https://external.example/'),anchor('#footer-section')])assert.equal(nav.shouldTransitionAnchor(event,a),false);
  const pushes=[];const router={push:href=>pushes.push(href)};
  nav.navigateStudioRoute('/about',router);assert.deepEqual(pushes,['/about'],'no registered owner retains functional links');
  let requests=0;const unregister=nav.registerRouteNavigation(()=>{requests++;return false;});
  assert.equal(nav.navigateStudioRoute('/about',router),false);assert.equal(requests,1);assert.equal(pushes.length,1);
  nav.navigateStudioRoute('/projects#footer-section',router);assert.equal(requests,1,'same-path fragment must not wait for an absent pathname commit');
  nav.navigateStudioRoute('/projects?view=all',router);assert.equal(requests,1,'same-path query stays native');
  unregister();nav.navigateStudioRoute('/about',router);assert.equal(pushes.length,4,'disposing ownership restores safe direct navigation');
  delete globalThis.window;delete globalThis.location;
  console.log('PASS native route aperture diagonal/rotation/endpoints/XOR/state restoration frame-rate-independent portal charge/hold/reverse/decay/offscreen, native anchor intent and owner-disposal contracts.');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
