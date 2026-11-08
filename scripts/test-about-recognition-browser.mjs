#!/usr/bin/env node
/** Behavioral + pixel checks under Chromium/SwiftShader. Not physical GPU/mobile
 * performance or a claim of exact frame-for-frame reference parity. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003';
const out=process.env.AWARDS_CAPTURES||'temp/awards-reconstruction/checked';
fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
async function colors(buffer){const {data,info}=await sharp(buffer).removeAlpha().raw().toBuffer({resolveWithObject:true});let chromatic=0;for(let i=0;i<data.length;i+=info.channels){const r=data[i],g=data[i+1],b=data[i+2];if(Math.max(r,g,b)-Math.min(r,g,b)>60&&Math.max(r,g,b)>80)chromatic++;}return chromatic;}
try{
 for(const [width,height] of (process.env.AWARDS_QUICK ? [[1440,764]] : [[1720,912],[1568,1230],[390,844]])){
  const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<820});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  await page.addInitScript(()=>{window.__enableRecognitionProbe=true});
  await page.goto(`${base}/about`,{waitUntil:'domcontentloaded',timeout:120000});
  const section=page.locator('#about-award');
  await page.waitForFunction(()=>!!window.__lusionInspector?.scrollManager);
  await page.waitForTimeout(1800);
  await section.evaluate(e=>window.__lusionInspector.scrollManager.scrollToPixel(e.getBoundingClientRect().top+scrollY+innerWidth*.11));
  await page.waitForFunction(()=>window.__recognitionProbe?.().state==='ready',null,{timeout:120000});
  const seek=async y=>{await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y),y);await page.waitForTimeout(800)};
  const top=await section.evaluate(e=>e.getBoundingClientRect().top+scrollY);
  await seek(top+width*.11);await page.waitForTimeout(1800);
  const probe=()=>page.evaluate(()=>window.__recognitionProbe());
  const capture=async name=>{const image=await page.screenshot({path:path.join(out,`${width}-${name}.png`),timeout:120000});return image};
  if(process.env.EXPECTED_BUILD_SHA)assert.equal(await page.locator('#about').getAttribute('data-build-commit'),process.env.EXPECTED_BUILD_SHA);
  assert.equal(await section.locator('canvas').count(),1);
  assert.ok((await probe()).edges>1000,'real curved vector boundaries, not DOM text stroke');
  assert.equal(await section.locator('.about-source-articles a').count(),3);
  assert.equal(await section.locator('.about-source-talks li').count(),5);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'no horizontal overflow');
  const idle=await capture('idle');
  if(width>820){
   // End the sweep INSIDE a vector stroke, not inside the huge G's counter
   // or the blank area beyond MULTI on tall viewports. Derive the hit from the
   // actual SVG path and the documented native row transform, not a fixed H%.
   const target=await page.evaluate(async()=>{
    const text=await(await fetch('/sites/lusion/about/award-title.svg')).text();
    const svg=new DOMParser().parseFromString(text,'image/svg+xml');
    const path=new Path2D(svg.querySelector('path').getAttribute('d'));
    const context=document.createElement('canvas').getContext('2d');
    const top=document.getElementById('about-award').getBoundingClientRect().top;
    const progress=window.__recognitionProbe().progress;
    const shift=Math.max(0,Math.min(1,(progress-(1/6)*.4)/.56))*.5;
    const inside=(x,y)=>context.isPointInPath(path,(x/innerWidth+shift)/1.5*1438,(y-top)/(innerWidth*1250/1440)/1.5*1252);
    for(let x=innerWidth*.84;x>innerWidth*.48;x-=8)for(let y=innerWidth*.21;y<innerWidth*.28;y+=6)
     if([[0,0],[-9,0],[9,0],[0,-9],[0,9]].every(([dx,dy])=>inside(x+dx,y+dy)))return{x,y};
    throw new Error('No solid WINNING stroke found for paint test');
   });
   await page.mouse.move(target.x-width*.36,target.y-30);
   for(let i=0;i<24;i++)await page.mouse.move(target.x-width*.36*(1-i/23),target.y-30*(1-i/23));
   const painted=await capture('painted');
   assert.ok(await colors(painted)>await colors(idle)+80,'colored trail must visibly illuminate vector faces and edges');
   await page.mouse.move(width-2,2);await page.waitForTimeout(180);await capture('trail');
  } else {
   await section.dispatchEvent('pointermove',{pointerType:'touch',clientX:width*.5,clientY:height*.3});
   assert.equal((await probe()).pointer,false,'touch scrolling does not become mouse painting');
  }
  const progress=(await probe()).progress;await seek(top+width*.5);assert.ok((await probe()).progress>progress,'per-row source scroll progression');
  await capture('articles');
  await section.locator('.about-source-articles a').first().focus();
  assert.equal(await page.evaluate(()=>document.activeElement?.getAttribute('target')),'_blank');
  await seek(top+width*.11);
  await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'))});
  const hidden=await probe();await page.waitForTimeout(250);assert.equal((await probe()).frames,hidden.frames);assert.equal((await probe()).pending,false);
  await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'))});
  await page.waitForFunction(n=>window.__recognitionProbe().frames>n,hidden.frames);
  await page.locator('#header-right-menu-btn').click();const menu=await probe();await page.waitForTimeout(250);assert.equal((await probe()).frames,menu.frames);assert.equal((await probe()).pending,false);
  await page.keyboard.press('Escape');await page.waitForFunction(n=>window.__recognitionProbe().frames>n,menu.frames);
  // A context loss must expose the vector fallback; restore recreates targets.
  await section.locator('canvas').evaluate(c=>{window.__awardsGL=c.getContext('webgl2').getExtension('WEBGL_lose_context');window.__awardsGL.loseContext()});
  await page.waitForFunction(()=>window.__recognitionProbe().state==='lost');
  assert.equal((await probe()).pending,false);
  assert.equal(await section.locator('.about-source-monument>img').evaluate(e=>getComputedStyle(e).visibility),'visible');
  await page.evaluate(()=>window.__awardsGL.restoreContext());
  await page.waitForFunction(()=>window.__recognitionProbe().state==='ready',null,{timeout:120000});
  await seek(0);await page.waitForTimeout(200);const stopped=await probe();await page.waitForTimeout(250);
  assert.equal((await probe()).frames,stopped.frames,'offscreen clock is stopped');assert.equal((await probe()).pending,false);
  await page.emulateMedia({reducedMotion:'reduce'});await seek(top+width*.11);await page.waitForTimeout(300);
  await page.waitForFunction(()=>window.__recognitionProbe?.().state==='reduced'&&window.__recognitionProbe().frames>0&&!window.__recognitionProbe().pending);
  const reduced=await probe();await page.waitForTimeout(250);assert.equal((await probe()).frames,reduced.frames);assert.equal((await probe()).pending,false);
  assert.equal(await section.locator('canvas').count(),0,'reduced-motion fallback has no continuous GPU owner');
  await capture('reduced');
  assert.deepEqual(errors,[]);console.log(`PASS recognition ${width}x${height}: vector GPU, visible color trail, scroll, links, context restore, offscreen/reduced lifecycle, no overflow/errors`);
  await page.close();
 }
}finally{await browser.close()}
