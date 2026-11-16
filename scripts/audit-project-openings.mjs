#!/usr/bin/env node
/** Read-only observation of the served project-opening flow. Not a parity test. */
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser,startBrowserRecording} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003';
const referenceMode=process.env.OPENING_AUDIT_REFERENCE==='1';
const out=process.env.OPENING_AUDIT_OUT||(referenceMode?'temp/project-opening-video-audit/current':'temp/project-opening-audit/current');fs.mkdirSync(out,{recursive:true});
const scenarios=referenceMode?[
 {name:'reference-home-oryzo',route:'/',slug:'oryzo_ai',width:1720,height:912,back:true,interior:true},
 {name:'reference-home-atlas',route:'/',slug:'atlas_motion',width:1720,height:912,back:true,interior:false},
]:[
 {name:'archive-atlas-desktop',route:'/projects',slug:'atlas_motion',width:1440,height:764,back:true},
 {name:'home-oryzo-desktop',route:'/',slug:'oryzo_ai',width:1440,height:764,back:true},
 {name:'archive-atlas-mobile',route:'/projects',slug:'atlas_motion',width:390,height:844,back:false},
];
let browser;const observations=[];
try{
 for(const scenario of scenarios){
  const dir=path.join(out,scenario.name);fs.mkdirSync(dir,{recursive:true});
  browser=await launchMotionBrowser();
  const context=await browser.newContext({viewport:{width:scenario.width,height:scenario.height},hasTouch:scenario.width<813,isMobile:scenario.width<813});
  await context.addInitScript(()=>{try{sessionStorage.setItem('lusion_booted_v1','1');}catch{}});
  const page=await context.newPage();const errors=[],failedResponses=[];
  page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(response.status()>=400)failedResponses.push({url:response.url(),status:response.status()});});
  await page.goto(base+scenario.route,{waitUntil:'networkidle',timeout:90000});
  const card=page.locator(`.project-item[data-id="${scenario.slug}"]`);
  await card.evaluate((element,placement)=>{
   const y=element.getBoundingClientRect().top+scrollY-innerHeight*placement;
   if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true});else scrollTo(0,y);
  },referenceMode ? .25 : .2);
  await page.waitForFunction(slug=>document.querySelector(`.project-item[data-id="${slug}"] .project-item-main`)?.dataset.depthReady==='true',scenario.slug,{timeout:60000});
  await page.waitForTimeout(800);
  const stage=card.locator('.project-item-main');const box=await stage.boundingBox();
  if(scenario.width>812){await page.mouse.move(box.x+box.width*.65,box.y+box.height*.4);await page.waitForTimeout(600);}
  await page.screenshot({path:path.join(dir,'before.jpg'),quality:85});
  const before=await stage.evaluate(e=>({rect:e.getBoundingClientRect().toJSON(),focus:e.dataset.focus,transform:getComputedStyle(e).transform}));
  await page.evaluate(slug=>{
   const element=document.querySelector(`.project-item[data-id="${slug}"] .project-item-main`);
   const frames=[];let raf=0,start=0,previous=-Infinity;
   const sample=now=>{
    if(!start)start=now;
    if(now-previous>=50){
     previous=now;const r=element.isConnected?element.getBoundingClientRect():null;
     frames.push({time:now,ms:now-start,path:location.pathname,kind:document.querySelector('#route-transition')?.dataset.routeKind,zoom:document.querySelector('#project-zoom-surface')?.dataset.zoom,scale:document.querySelector('#project-zoom-surface')?.dataset.scale,graphics:document.querySelector('#project-zoom-surface')?.dataset.graphics,phase:document.querySelector('#route-transition')?.dataset.routePhase,scrollY,rect:r?{x:r.x,y:r.y,width:r.width,height:r.height}:null,focus:element.dataset.focus,transform:element.isConnected?getComputedStyle(element).transform:null});
    }
    if(!window.__openingAudit.click||now-window.__openingAudit.click.time<14000)raf=requestAnimationFrame(sample);
   };
   raf=requestAnimationFrame(sample);window.__openingAudit={frames,click:null,stop:()=>cancelAnimationFrame(raf)};
   document.addEventListener('click',event=>{const link=event.target instanceof Element?event.target.closest('.project-item'):null;if(link?.dataset.id===slug)window.__openingAudit.click={origin:performance.timeOrigin,time:performance.now()};},{capture:true,once:true});
  },scenario.slug);
  const recording=await startBrowserRecording(context,page,dir);
  // CDP emits on compositor damage, not necessarily on an unchanged settled page.
  // A real pointer nudge supplies ordinary hover input before awaiting the bookend.
  if(scenario.width>812)await page.mouse.move(box.x+box.width*.65+1,box.y+box.height*.4);
  await recording.waitForFirstFrame();
  await stage.click();
  const click=await page.evaluate(()=>window.__openingAudit.click);
  if(!click)throw new Error('No actual card click event was observed');
  await page.waitForURL(`**/projects/${scenario.slug}`,{timeout:90000});
  await page.waitForFunction(()=>document.querySelector('main')?.dataset.caseReady==='true'&&document.querySelector('#route-transition')?.dataset.routePhase==='idle',null,{timeout:60000});
  await page.screenshot({path:path.join(dir,'opened.jpg'),quality:85});const recordingFrames=await recording.stop();
  const frames=await page.evaluate(()=>{window.__openingAudit.stop();return window.__openingAudit.frames;});
  const sourceFrames=frames.filter(x=>x.rect&&x.time>=click.time),ratios=sourceFrames.map(x=>x.rect.width/before.rect.width);
  const observation={...scenario,before,click,recordingFrames,frames,observed:{genericAperture:frames.some(x=>x.kind==='generic'&&['hiding','waiting','preparing','showing'].includes(x.phase)),selectedScaleMaximum:Math.max(1,...frames.map(x=>Number(x.scale)||1)),sourceBoxWidthRatio:ratios.length?{min:Math.min(...ratios),max:Math.max(...ratios)}:null,finalRoute:new URL(page.url()).pathname},errors,failedResponses};
  if(scenario.back){
   if(scenario.interior){
    await page.evaluate(()=>{const max=Number(document.querySelector('main')?.dataset.caseMaximum||0);const y=max*.35;if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true});else scrollTo(0,y);});
    await page.waitForTimeout(800);
    observation.observed.caseScrollBeforeBack=await page.evaluate(()=>scrollY);
    await page.screenshot({path:path.join(dir,'interior-before-back.jpg'),quality:85});
   }
   let reverseRecording=null;
   if(referenceMode){const backDir=path.join(dir,'reverse');fs.mkdirSync(backDir,{recursive:true});reverseRecording=await startBrowserRecording(context,page,backDir);await page.mouse.move(20,20);await reverseRecording.waitForFirstFrame();}
   await page.getByRole('button',{name:'Back to Projects',exact:true}).click();
   await page.waitForURL(url=>url.pathname===scenario.route||url.pathname==='/projects',{timeout:60000});await page.waitForFunction(()=>document.querySelector('#route-transition')?.dataset.routePhase==='idle',null,{timeout:120000});
   if(reverseRecording)observation.reverseRecordingFrames=await reverseRecording.stop();
   observation.observed.backRoute=new URL(page.url()).pathname;observation.observed.backScrollY=await page.evaluate(()=>scrollY);await page.screenshot({path:path.join(dir,'back.jpg'),quality:85});
  }
  observations.push(observation);fs.writeFileSync(path.join(out,'report.json'),JSON.stringify({base,note:'Actual served observations. DOM-box stability alone does not prove GPU geometry; corroborate with active source and recording.',observations},null,2));
  await browser.close();browser=null;
 }
 console.log(JSON.stringify(observations.map(({name,observed,recordingFrames,errors,failedResponses})=>({name,observed,recordingFrames,errors,failedResponses})),null,2));
}finally{await browser?.close();}
