#!/usr/bin/env node
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const out=process.env.ABOUT_RECHECK_OUT||'temp/visual-recheck/final';
const base=process.env.ABOUT_RECHECK_BASE||'http://127.0.0.1:3000';
fs.mkdirSync(out,{recursive:true});const browser=await launchMotionBrowser();
try{
 for(const [width,height]of [[1440,900],[768,900],[390,844]]){
  const c=await browser.newContext({viewport:{width,height},isMobile:width===390,hasTouch:width===390});
  // Do not skip the cold-entry loading experience/session initialization.
  await c.addInitScript(()=>{window.__enableAboutProbe=true;window.__enableCtaProbe=true;});
  const p=await c.newPage(),report={width,height,coldSession:true,errors:[],warnings:[],models:[],captures:[]};
  p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});p.on('request',r=>{if(/\.(glb|buf)(\?|$)|\/team\//.test(r.url()))report.models.push(new URL(r.url()).pathname);});
  const seek=async y=>{await p.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo({top:y,behavior:'instant'});},y);await p.waitForTimeout(450);};
  const capture=async name=>{const file=`${width}-${name}.jpg`;await p.screenshot({path:`${out}/${file}`,type:'jpeg',quality:80,timeout:120000});report.captures.push({name,file,scroll:await p.evaluate(()=>scrollY),probe:await p.evaluate(()=>window.__aboutProbe?.())});};
  try{
   const launchRoot=['3002','3003'].includes(new URL(base).port);
   const response=await p.goto(base+(launchRoot?'/':'/about'),{waitUntil:'networkidle',timeout:120000});assert.ok(response.ok());report.url=p.url();report.cacheControl=response.headers()['cache-control'];report.buildId=fs.readFileSync('.next/BUILD_ID','utf8').trim();
   // The dedicated launch proxy must open About, not the unchanged Home route.
   assert.ok(p.url().endsWith('/about'));
   await p.waitForFunction(()=>window.__aboutProbe?.().explorer==='ready',{},{timeout:30000});
   report.revision=await p.locator('#about').getAttribute('data-scene-version');assert.equal(report.revision,'coherent-volume-ridged-basin-v1');
   await p.waitForTimeout(1000);assert.equal(await p.evaluate(()=>window.__aboutProbe().explorerScale),width<820?1:1.33,'render loop must not overwrite corrected figure scale');await capture('opening');
   const unit=width<820?height:width;
   for(const [name,u]of [['pullback',.7],['terrain',width<820?2.8:1.6],['narrative',5.35],['team',7.2]]){await seek(unit*u);if(name==='terrain'&&width<820)assert.equal(await p.locator('#about-who-title-main-scroll').evaluate(e=>getComputedStyle(e.parentElement.parentElement).visibility),'hidden','old wordmark must clear the phone/tablet manifesto');await capture(name);}
   for(const id of ['about-clients','about-award','about-capability']){const target=p.locator('#'+id);await seek(await target.evaluate(e=>e.getBoundingClientRect().top+scrollY));await capture(id);}
   const section=p.locator('#about-capability');
   if(width>=1000){await seek(await section.evaluate(e=>e.getBoundingClientRect().top+scrollY));report.heading=await p.locator('.about-expertise-heading').boundingBox();assert.ok(report.heading.y>=100,'title clears fixed desktop header');await seek(await section.evaluate(e=>e.getBoundingClientRect().top+scrollY+(e.offsetHeight-innerHeight)*.9));}
   else await seek(await section.locator('.about-card-slot').first().evaluate(e=>e.getBoundingClientRect().top+scrollY-110));
   await capture('fronts');
   const cta=await p.locator('#end-section').evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,travel:e.offsetHeight-e.querySelector('#end-section-outer').clientHeight}));
   await seek(cta.top+cta.travel*.5);await p.waitForFunction(()=>window.__ctaProbe?.().frames>0&&Math.abs(window.__ctaProbe().progress-.5)<.015);await capture('cta');
   await seek(await p.evaluate(()=>document.documentElement.scrollHeight-innerHeight));await capture('footer');
   await seek(0);await capture('reversed-opening');
   assert.equal(await p.locator('#about-who canvas').count(),1);assert.deepEqual([...new Set(report.models)],['/models/astronaut.glb'],'only already-permitted NASA model requested');
   assert.deepEqual(report.errors,[]);assert.ok(!report.warnings.some(x=>x.includes('NASA suit unavailable')));
   assert.equal(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
  }finally{fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await c.close();}
 }
 // A genuinely unavailable model must retain a usable procedural scene.
 const c=await browser.newContext({viewport:{width:1440,height:900}});await c.addInitScript(()=>window.__enableAboutProbe=true);await c.route('**/models/astronaut.glb',r=>r.fulfill({status:503,body:'intentional model failure'}));
 const p=await c.newPage(),fallback={warnings:[],errors:[]};p.on('console',m=>{if(m.type()==='warning')fallback.warnings.push(m.text());if(m.type()==='error')fallback.errors.push(m.text());});p.on('pageerror',e=>fallback.errors.push(e.message));
 try{await p.goto(base+'/about',{waitUntil:'networkidle',timeout:120000});await p.waitForFunction(()=>window.__aboutProbe?.().explorer==='fallback');await p.evaluate(()=>{window.__lenis?.scrollTo(1440*1.6,{immediate:true});window.scrollTo({top:1440*1.6,behavior:'instant'});});await p.waitForTimeout(700);fallback.probe=await p.evaluate(()=>window.__aboutProbe());assert.ok(fallback.probe.draws>0);assert.ok(fallback.warnings.some(x=>x.includes('NASA suit unavailable')));assert.ok(fallback.errors.every(x=>x.includes('503')),'only deliberately induced HTTP error');await p.screenshot({path:`${out}/offline-fallback.jpg`,type:'jpeg',quality:80,timeout:120000});fs.writeFileSync(`${out}/offline-fallback.json`,JSON.stringify(fallback,null,2));}finally{await c.close();}
 console.log('PASS fresh launch/cold entry; current revision; real NASA GLB ready at 1440/768/390; all About acts captured; reverse; header clearance; no restricted model requests/errors/overflow; intentional 503 keeps procedural fallback. Screenshots require visual review; not source parity or hardware certification.');
}finally{await browser.close();}
