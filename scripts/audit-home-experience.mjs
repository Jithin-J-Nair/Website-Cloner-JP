#!/usr/bin/env node
/** Audit homepage state, input cancellation, preference changes, CTA and timestamped cinematic sweeps. */

import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';


const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const width = Number(process.env.AUDIT_WIDTH || 1440);
const height = Number(process.env.AUDIT_HEIGHT || (width < 820 ? 844 : 900));

const out = path.resolve(`temp/mission/${process.env.AUDIT_TAG || 'baseline'}-${width}-${process.env.AUDIT_REDUCED === '1' ? 'reduce' : 'normal'}`);
fs.mkdirSync(out, {recursive:true});
const browser = await launchMotionBrowser();


const reduced = process.env.AUDIT_REDUCED === '1';
const context = await browser.newContext({viewport:{width,height},hasTouch:width<1100,isMobile:width<820,reducedMotion:reduced?'reduce':'no-preference'});
await context.addInitScript(()=>{
 sessionStorage.setItem('lusion_booted_v1','1');
 window.__auditMetrics={shifts:[],longTasks:[]};
 for(const type of ['layout-shift','longtask']) {
  try {new PerformanceObserver(list=>{for(const e of list.getEntries()) {
   if(type==='layout-shift'&&!e.hadRecentInput)window.__auditMetrics.shifts.push({value:e.value,time:e.startTime});
   if(type==='longtask')window.__auditMetrics.longTasks.push({duration:e.duration,time:e.startTime});
  }}).observe({type,buffered:true});}catch{}
 }
});
const page=await context.newPage();
const report={viewport:{width,height},reduced,errors:[],warnings:[],failed:[],issues:[],states:[],frames:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text())});
page.on('response',r=>{if(!r.ok())report.failed.push({url:r.url(),status:r.status()})});
const cdp=await context.newCDPSession(page);
let recording=false;
cdp.on('Page.screencastFrame',async event=>{
 if(recording){const file=`motion-${String(report.frames.length).padStart(4,'0')}.jpg`;fs.writeFileSync(path.join(out,file),Buffer.from(event.data,'base64'));report.frames.push({file,time:event.metadata.timestamp});}
 await cdp.send('Page.screencastFrameAck',{sessionId:event.sessionId}).catch(()=>{});
});
const frames=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
const seek=async y=>{await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y,true),Math.round(y));await frames()};
const capture=async name=>{
 await page.screenshot({path:path.join(out,`${name}.png`),timeout:120000});
 const state=await page.evaluate(()=>({y:scrollY,overflow:document.documentElement.scrollWidth-innerWidth,goal:window.__goalAstronautTelemetry,focus:document.activeElement?.id}));
 report.states.push({name,...state});
 if(state.overflow>1)report.issues.push(`${name}: horizontal overflow ${state.overflow}`);
};
try {
 if(process.env.AUDIT_REFERENCE==='1') {
  try {await page.goto('https://lusion.co/',{waitUntil:'networkidle',timeout:45000});await capture('reference');report.reference='loaded'}catch(e){report.reference=String(e)}
 }else{
 await page.goto(baseUrl,{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:60000});
 await capture('hero-initial');
 const hero=page.locator('#home-hero-visual-container');const box=await hero.boundingBox();
 if(!reduced){await page.mouse.move(box.x+box.width*.5,box.y+box.height*.56);await page.waitForFunction(()=>Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy)>.1);await capture('hero-hover');await page.mouse.move(2,2);await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.motionState==='settled',null,{timeout:90000})}
 const layout=await page.evaluate(()=>{const top=el=>{let y=0;for(let e=el;e;e=e.offsetParent)y+=e.offsetTop;return y};return {reel:top(document.getElementById('home-reel-container')),featured:top(document.getElementById('home-featured')),end:top(document.getElementById('end-section')),cta:top(document.getElementById('end-section-title-link'))}});
 for(const [name,y] of [['reel-small',layout.reel-height*.94],['reel-expanded',layout.reel-height*.12],['reel-reverse',layout.reel-height*.94],['featured',layout.featured+height*.15]]){await seek(y);await capture(name)}
 const stage=page.locator('.project-item-main').first();const wrap=stage.locator(':scope > div').first();const cardBox=await stage.boundingBox();
 const neutral=async()=>wrap.evaluate(el=>!el.style.transform||new DOMMatrixReadOnly(el.style.transform).isIdentity);
 if(!reduced){
  await stage.dispatchEvent('pointermove',{pointerType:'mouse',clientX:cardBox.x+cardBox.width*.9,clientY:cardBox.y+cardBox.height*.8});await stage.dispatchEvent('pointercancel',{pointerType:'mouse'});await frames();
  report.cardCancel={neutral:await neutral(),transform:await wrap.getAttribute('style')};if(!report.cardCancel.neutral)report.issues.push('Featured pointercancel leaves a displaced thumbnail');
  await page.locator('.project-item').first().dispatchEvent('mouseleave');
  await stage.dispatchEvent('pointermove',{pointerType:'touch',clientX:cardBox.x+cardBox.width*.9,clientY:cardBox.y+cardBox.height*.8});await frames();
  report.cardTouch={neutral:await neutral(),transform:await wrap.getAttribute('style')};if(!report.cardTouch.neutral)report.issues.push('Featured touch pointer applies desktop parallax');
  await stage.dispatchEvent('pointermove',{pointerType:'mouse',clientX:cardBox.x+cardBox.width*.8,clientY:cardBox.y+cardBox.height*.6});
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(300);await frames();
  report.cardReduced={neutral:await neutral(),transform:await wrap.getAttribute('style')};if(!report.cardReduced.neutral)report.issues.push('Featured reduced-motion change retains inline parallax');
  await page.emulateMedia({reducedMotion:'no-preference'});await frames();
 }
 if(process.env.AUDIT_CINEMA!=='0'){
 recording=true;await cdp.send('Page.startScreencast',{format:'jpeg',quality:65,maxWidth:960,maxHeight:600,everyNthFrame:1});
 const ranges=await page.evaluate(()=>window.__lusionInspector.homeGoalSectionRanges.items);
 for(const u of [.64,.72,.80,.72,.64]){const y=await page.evaluate(u=>window.__goalAstronautTelemetry.scrollForEmergence(u),u);await seek(y);await capture(`solar-${report.states.length}`)}
 const start=ranges.blackTunnel.pixelFrom,span=ranges.whiteTunnel.pixelTo-start;
 for(const u of [.16,.28,.42,.57,.88,.97]){await seek(start+span*u);await capture(`tunnel-${u}`)}
 for(const u of [.30,.50,.65]){await seek(ranges.astronautDrop.pixelFrom+ranges.astronautDrop.pixelCount*u);await capture(`glass-${u}`)}
 recording=false;await cdp.send('Page.stopScreencast');
 }
 await seek(layout.cta-height*.5);await capture('contact');
 const cta=page.locator('#end-section-title-link');await cta.focus();
 report.contactAccessibleSnapshot=await cta.ariaSnapshot();
 report.contact=await cta.evaluate(el=>({href:el.getAttribute('href'),name:el.textContent,focus:document.activeElement===el,outline:getComputedStyle(el).outline,rect:el.getBoundingClientRect().toJSON()}));
 await page.keyboard.press('Tab');report.contact.nextFocus=await page.evaluate(()=>({id:document.activeElement?.id,name:document.activeElement?.textContent,outline:getComputedStyle(document.activeElement).outline}));
 await page.emulateMedia({reducedMotion:'reduce'});await frames();
 await page.locator('#end-bottom').focus();await page.keyboard.press('Enter');await frames();
 report.footerReduced=await page.evaluate(()=>{
  const footer=document.getElementById('footer-section');const target=Math.min(document.documentElement.scrollHeight-innerHeight,footer.getBoundingClientRect().top+scrollY);
  return {y:scrollY,target,atTarget:Math.abs(scrollY-target)<2};
 });
 if(!report.footerReduced.atTarget)report.issues.push('Reduced-motion footer navigation still animates instead of jumping');
 await capture('footer');
 await page.locator('#scroll-nav-section').scrollIntoViewIfNeeded();await frames();await capture('next-portal');
 await page.locator('#scroll-nav-next').focus();await frames();
 report.portal={target:await page.locator('#scroll-nav-section').getAttribute('data-path'),accessibleSnapshot:await page.locator('#scroll-nav-main').ariaSnapshot(),focus:await page.locator('#scroll-nav-next').evaluate(el=>document.activeElement===el)};
 report.metrics=await page.evaluate(()=>({...window.__auditMetrics,resources:performance.getEntriesByType('resource').map(r=>({name:r.name,bytes:r.transferSize,decodedBytes:r.decodedBodySize,duration:r.duration})),memory:performance.memory?{used:performance.memory.usedJSHeapSize,total:performance.memory.totalJSHeapSize}:null}));
 report.media=await page.locator('video').evaluateAll(videos=>videos.map(v=>({src:v.currentSrc,width:v.videoWidth,height:v.videoHeight,readyState:v.readyState,paused:v.paused,duration:Number.isFinite(v.duration)?v.duration:null,playbackQuality:v.getVideoPlaybackQuality?{total:v.getVideoPlaybackQuality().totalVideoFrames,dropped:v.getVideoPlaybackQuality().droppedVideoFrames}:null})));
 report.metrics.cls=report.metrics.shifts.reduce((n,s)=>n+s.value,0);
 const duplicates=await page.evaluate(()=>{const ids=new Set(),duplicates=[];for(const el of document.querySelectorAll('[id]')){if(ids.has(el.id))duplicates.push(el.id);ids.add(el.id)}return duplicates});report.duplicateIds=duplicates;
 if(duplicates.length)report.issues.push('Duplicate IDs: '+duplicates.join(','));
 await page.keyboard.press('Enter');await page.waitForURL('**/about',{timeout:30000});
 await page.waitForFunction(()=>!window.__goalAstronautTelemetry);report.portal.keyboardNavigated=true;
 if(report.errors.length||report.failed.length)report.issues.push('Browser errors or failed responses (see arrays)');
 }
 console.log(JSON.stringify({out,issues:report.issues,errors:report.errors,failed:report.failed,frames:report.frames.length}));
}finally{recording=false;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close()}
if(report.issues.length)process.exitCode=1;
