#!/usr/bin/env node
/** Real gestures/navigation on the optional graphics fallback, not an FPS gate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
import {loadCurrentLiveGroundTruth} from './lib/load-ground-truth.mjs';
const out='temp/site-fidelity-audit/case-navigation';fs.mkdirSync(out,{recursive:true});
const base=process.env.BASE_URL||'http://127.0.0.1:3003',b=await launchMotionBrowser(),report={errors:[]};
try {
 const p=await b.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});p.setDefaultTimeout(60000);p.on('pageerror',e=>report.errors.push(e.message));await p.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
 await p.goto(base+'/projects/of_the_oak?forceWebglFallback=1',{waitUntil:'networkidle'});await p.waitForFunction(()=>document.querySelector('main').dataset.caseReady==='true');
 await p.mouse.move(1100,500);await p.mouse.down();await p.mouse.move(650,500,{steps:12});await p.mouse.up();await p.waitForFunction(()=>Number(document.querySelector('main').dataset.caseScroll)>350);assert.equal(await p.getByRole('dialog').count(),0,'a media drag must not open the movie');report.drag=true;
 const original=loadCurrentLiveGroundTruth().projectDetails.find(p=>p.id==='of_the_oak');
 await p.locator('#project-next a').focus();await p.waitForFunction(()=>Math.abs(Number(document.querySelector('main').dataset.caseScroll)-Number(document.querySelector('main').dataset.caseMaximum))<2);await p.keyboard.press('Enter');await p.waitForURL('**'+original.nextProject.href);await p.waitForFunction(id=>document.querySelector('main')?.dataset.caseStudy===id&&document.querySelector('main').dataset.caseReady==='true',original.nextProject.id);assert.equal(await p.locator('#case-gallery-canvas').count(),1,'old compositor must be removed');report.keyboardNext=true;
 await p.goto(base+'/projects/of_the_oak?forceWebglFallback=1',{waitUntil:'networkidle'});await p.waitForFunction(()=>document.querySelector('main').dataset.caseReady==='true');
 await p.evaluate(()=>{const y=Number(document.querySelector('main').dataset.caseMaximum);if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true});else scrollTo(0,y);});
 await p.waitForFunction(()=>Math.abs(Number(document.querySelector('main').dataset.caseScroll)-Number(document.querySelector('main').dataset.caseMaximum))<2);
 // Continue a real wheel gesture at the end; don't mutate the input state or charge.
 for(let i=0;i<18;i++){await p.mouse.wheel(0,100);await p.waitForTimeout(40);}
 await p.waitForURL('**'+original.nextProject.href);report.wheelNext=true;
 await p.goto(base+'/projects/of_the_oak?forceWebglFallback=1',{waitUntil:'networkidle'});await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(300);await p.evaluate(()=>scrollTo(0,999999));for(let i=0;i<12;i++){await p.mouse.wheel(0,100);await p.waitForTimeout(40);}assert.ok(p.url().includes('of_the_oak'),'reduced motion never forces an overscroll navigation');report.reducedNoAutoNext=true;
 await p.setViewportSize({width:813,height:900});await p.waitForFunction(()=>document.querySelector('main').dataset.caseAxis==='horizontal');await p.setViewportSize({width:812,height:900});await p.waitForFunction(()=>document.querySelector('main').dataset.caseAxis==='vertical');report.breakpoint812=true;
 assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS gallery-media drag/click distinction, keyboard next route/cleanup, actual wheel charge/morph/next, reduced no-auto-next and the 812/813 layout switch.');
}finally{fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));await b.close();}
