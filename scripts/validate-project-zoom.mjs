#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3004',out=process.env.ZOOM_VALIDATION_OUT||'temp/project-zoom-validation';fs.mkdirSync(out,{recursive:true});
let browser;const report=[];
try{
 for(const scenario of [
  {name:'home-oryzo',route:'/',id:'oryzo_ai',width:1440,height:764},
  {name:'home-atlas-right',route:'/',id:'atlas_motion',width:1720,height:912},
  {name:'archive-atlas-mobile',route:'/projects',id:'atlas_motion',width:390,height:844},
  {name:'archive-atlas-fallback',route:'/projects?forceWebglFallback=1',id:'atlas_motion',width:1440,height:764,fallback:true},
 ].filter(scenario=>!process.env.ZOOM_SCENARIO||scenario.name===process.env.ZOOM_SCENARIO)){
  browser=await launchMotionBrowser();
  const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},hasTouch:scenario.width<813,isMobile:scenario.width<813});
  await context.addInitScript(()=>{try{sessionStorage.setItem('lusion_booted_v1','1');}catch{}});
  const page=await context.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
  const dir=path.join(out,scenario.name);fs.mkdirSync(dir,{recursive:true});
  await page.goto(base+scenario.route,{waitUntil:'networkidle',timeout:120000});
  const card=page.locator(`.project-item[data-id="${scenario.id}"]`),stage=card.locator('.project-item-main');
  await card.evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-innerHeight*.25));
  await page.waitForFunction(()=>!!document.querySelector('#home-editorial-canvas,#projects-depth-canvas'),null,{timeout:60000});
  if(!scenario.fallback)await page.waitForFunction(id=>document.querySelector(`.project-item[data-id="${id}"] .project-item-main`)?.dataset.depthReady==='true',scenario.id,{timeout:60000});
  await page.waitForTimeout(500);await page.screenshot({path:path.join(dir,'before.jpg'),quality:85});
  await stage.click();
  await page.waitForFunction(()=>Number(document.querySelector('#project-zoom-surface')?.dataset.zoom)>.2,null,{timeout:60000});
  const zoom=await page.evaluate(()=>({kind:document.querySelector('#route-transition')?.dataset.routeKind,phase:document.querySelector('#route-transition')?.dataset.routePhase,scale:Number(document.querySelector('#project-zoom-surface')?.dataset.scale),active:Number(document.querySelector('#project-zoom-surface')?.dataset.activeDepth),graphics:document.querySelector('#project-zoom-surface')?.dataset.graphics,apertureHidden:document.querySelector('#transition-overlay')?.hidden}));
  assert.equal(zoom.kind,'project-open');assert.equal(zoom.apertureHidden,true);assert.ok(zoom.scale>1);assert.ok(zoom.active>0);
  await page.screenshot({path:path.join(dir,'zoom.jpg'),quality:85});
  await page.waitForURL(`**/projects/${scenario.id}`,{timeout:90000});
  await page.waitForFunction(()=>document.querySelector('#route-transition')?.dataset.routePhase==='idle'&&document.querySelector('main')?.dataset.caseReady==='true',null,{timeout:90000});
  const opened=await page.evaluate(()=>({busy:document.querySelector('#main-content').inert,retained:!!document.querySelector('#project-zoom-surface'),opacity:getComputedStyle(document.querySelector('#main-content')).opacity,bg:getComputedStyle(document.querySelector('main')).backgroundColor,axis:document.querySelector('main').dataset.caseAxis}));
  assert.equal(opened.busy,false);assert.equal(opened.retained,false);assert.equal(opened.opacity,'1');
  if(scenario.id==='atlas_motion')assert.equal(opened.bg,'rgb(24, 24, 24)');
  await page.screenshot({path:path.join(dir,'opened.jpg'),quality:85});
  await page.evaluate(()=>scrollTo(0,Math.min(1200,document.documentElement.scrollHeight-innerHeight)));await page.waitForTimeout(250);
  await page.getByRole('button',{name:'Back to Projects',exact:true}).click();
  await page.waitForFunction(()=>document.querySelector('#route-transition')?.dataset.routeKind==='project-return'&&document.querySelector('#route-transition')?.dataset.routePhase!=='idle',null,{timeout:30000});
  await page.waitForURL(url=>url.pathname===scenario.route.split('?')[0],{timeout:90000});
  await page.waitForFunction(()=>document.querySelector('#route-transition')?.dataset.routePhase==='idle',null,{timeout:90000});
  const returned=await stage.evaluate(e=>({top:e.getBoundingClientRect().top,viewport:innerHeight,focus:document.activeElement?.closest('.project-item')?.dataset.id,retained:!!document.querySelector('#project-zoom-surface'),busy:document.querySelector('#main-content').inert}));
  assert.ok(Math.abs(returned.top-returned.viewport*.25)<8,JSON.stringify(returned));assert.equal(returned.focus,scenario.id);assert.equal(returned.retained,false);assert.equal(returned.busy,false);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(dir,'returned.jpg'),quality:85});
  report.push({scenario,zoom,opened,returned,errors});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();browser=null;
 }
 console.log('PASS selected zoom/depth, no aperture, canonical route/theme, source-aware reverse/scroll/focus, mobile and DOM fallback, no browser exceptions.');
}finally{await browser?.close();}
