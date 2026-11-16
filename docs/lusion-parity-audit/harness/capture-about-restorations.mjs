#!/usr/bin/env node
/** Settled rendered evidence for source-backed About restorations. Not live parity. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { launchMotionBrowser } from '../../../scripts/lib/browser-runtime.mjs';
const out=path.resolve(process.env.ABOUT_RESTORATIONS_OUT_DIR||'docs/lusion-parity-audit/evidence/about-restorations');fs.mkdirSync(out,{recursive:true});
const report={scope:'Captured-reference About artwork/recognition restoration. Marquee phase held only for stills. Native CDP viewport captures avoid oversized-element capture viewport resizing, retain the 30-second deadline, and do not mask canvas/video. Normal app clocks/camera/card scroll remain unchanged.',states:[],errors:[]};
let browser;
const save=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
try{
 for(const [width,height]of [[1920,1080],[1440,900],[1366,768],[1024,1366],[390,844],[375,812]]){
  browser=await launchMotionBrowser();
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<=390,isMobile:width<=390});
  await context.addInitScript(()=>{if(location.protocol==='http:')sessionStorage.setItem('lusion_booted_v1','1');window.__enableAboutProbe=true;});
  const page=await context.newPage();
  const cdp=await context.newCDPSession(page);
  const viewportShot=async(file,quality=78)=>{
    await page.evaluate(()=>document.fonts.ready);
    let timer;
    try {
      const shot=await Promise.race([cdp.send('Page.captureScreenshot',{format:'jpeg',quality,captureBeyondViewport:false,fromSurface:true}),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Native viewport capture exceeded 30000ms')),30000)})]);
      const buffer=Buffer.from(shot.data,'base64');const info=await sharp(buffer).metadata();assert.equal(info.width,width);assert.equal(info.height,height);fs.writeFileSync(path.join(out,file),buffer);
    } finally { clearTimeout(timer); }
  }; page.on('pageerror',e=>report.errors.push(e.message));
  const row={viewport:{width,height}};report.states.push(row);
  await page.goto('http://127.0.0.1:3000/about',{waitUntil:'domcontentloaded'});
  await page.locator('#preloader').waitFor({state:'hidden'});await page.evaluate(()=>document.fonts.ready);
  const seek=async(selector,progress=0)=>{
   await page.evaluate(({selector,progress})=>{const el=document.querySelector(selector);const y=el.getBoundingClientRect().top+scrollY+Math.max(0,el.offsetHeight-innerHeight)*progress;if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true});else window.scrollTo(0,y);},{selector,progress});
   await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
  };
  await seek('#about-clients');
  // Load all reference marks before capture, including offscreen duplicate copies.
  // This is a test-only loading precondition, not a production eager-load policy.
  await page.locator('#about-clients').evaluate(async el=>{await Promise.all([...el.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode()}))});
  await page.addStyleTag({content:'.about-client-marquee-track { animation-play-state: paused !important; transform: translate3d(0,0,0) !important; }'});
  row.brands=await page.locator('#about-clients').evaluate(el=>({images:el.querySelectorAll('img').length,uniqueSources:[...new Set([...el.querySelectorAll('img')].map(i=>i.getAttribute('src')))],decoded:[...el.querySelectorAll('img')].every(i=>i.naturalWidth===240),cocaLabel:el.querySelector('img[src*="cocacola"]')?.alt,decorativeCopies:el.querySelectorAll('[aria-hidden="true"]').length,tileWidth:el.querySelector('.about-client-logo-tile').getBoundingClientRect().width,setWidths:[...el.querySelectorAll('.about-client-marquee-set')].map(s=>s.getBoundingClientRect().width)}));
  assert.equal(row.brands.images,32);assert.equal(row.brands.uniqueSources.length,15);assert.equal(row.brands.decoded,true);assert.equal(row.brands.cocaLabel,'Coca-Cola European Partners');
  if(width<820)assert.ok(Math.abs(row.brands.tileWidth-width/3)<1,'Mobile uses three reference-sized marks across');
  for(let i=0;i<row.brands.setWidths.length;i+=2)assert.ok(Math.abs(row.brands.setWidths[i]-row.brands.setWidths[i+1])<.1,'Duplicate marquee sets retain equal loop widths');
  await viewportShot(`clients--${width}x${height}.jpg`);
  if(await page.locator('#about-clients').evaluate(el=>el.offsetHeight>innerHeight)){await seek('#about-clients',1);await viewportShot(`clients-lower--${width}x${height}.jpg`);}
  await seek('#about-award');
  await page.waitForFunction(()=>!window.__aboutProbe?.().pending);
  row.worldBeforeRecognition=await page.evaluate(()=>window.__aboutProbe?.());save();
  row.recognition=await page.locator('#about-award').evaluate(el=>({marks:el.querySelectorAll('svg.about-recognition-mark').length,rosette:el.querySelectorAll('ellipse').length,talkDots:el.querySelectorAll('circle').length,rule: getComputedStyle(el.querySelector('.about-source-award-group'),'::before').content}));
  assert.equal(row.recognition.marks,3);assert.equal(row.recognition.rosette,8);assert.equal(row.recognition.talkDots,9);assert.equal(row.recognition.rule,'""');
  await viewportShot(`recognition--${width}x${height}.jpg`);
  if(width>=1000){
   await seek('#about-capability',.4);
   await page.waitForFunction(()=>Math.abs(Number(document.querySelector('#about-capability').dataset.cardProgress)-.4)<.01);
   await viewportShot(`card-backs--${width}x${height}.jpg`);
   await seek('#about-capability',.95);
   await page.waitForFunction(()=>Number(document.querySelector('#about-capability').dataset.cardProgress)>.94);
   await viewportShot(`card-fronts--${width}x${height}.jpg`);
  }else{
   await seek('#about-capability');
   await viewportShot(`card-fronts--${width}x${height}.jpg`,75);
   await seek('#about-capability',.5);await viewportShot(`card-fronts-middle--${width}x${height}.jpg`,75);
   await seek('#about-capability',1);await viewportShot(`card-fronts-lower--${width}x${height}.jpg`,75);
  }
  row.cards=await page.locator('#about-capability').evaluate(el=>({cards:el.querySelectorAll('.about-service-card').length,backImages:el.querySelectorAll('img[src*="back-ink"]').length,layout:el.dataset.cardLayout}));
  assert.equal(row.cards.cards,4);assert.equal(row.cards.backImages,4);
  row.overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);assert.equal(row.overflow,false);
  save();await context.close();await browser.close();console.log(`PASS About artwork/recognition/card structure at ${width}x${height}`);
 }
 assert.deepEqual(report.errors,[]);report.passed=true;
}finally{save();await browser?.close();}
