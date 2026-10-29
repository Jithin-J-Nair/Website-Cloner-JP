#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { launchMotionBrowser, startBrowserRecording } from './lib/browser-runtime.mjs';
const baseline=process.env.ABOUT_BASELINE==='1';
const out=`temp/about-audit/${baseline?'before':'after'}`;fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
try{
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:width===390?844:900},isMobile:width===390,hasTouch:width===390,reducedMotion:'no-preference'});
  await context.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');window.__enableAboutProbe=true;});
  const page=await context.newPage(),report={width,height:width===390?844:900,baseline,errors:[],consoleErrors:[],restrictedRequests:[],milestones:[]};
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.consoleErrors.push(m.text());});
  page.on('request',r=>{if(/\/team\/.*\.buf|\/images\/logo\//.test(r.url()))report.restrictedRequests.push(r.url());});
  const seek=async y=>{await page.evaluate(top=>{window.__lenis?.scrollTo(top,{immediate:true});window.scrollTo({top,behavior:'instant'});},y);await page.waitForTimeout(500);};
  try{
   await page.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await page.waitForSelector('#about-who canvas');
   const unit=width<820?844:width;
   for(const u of [0,1.6,5.35,7.2]){
    await seek(unit*u);const file=`${width}-u${u}.jpg`;await page.screenshot({path:`${out}/${file}`,type:'jpeg',quality:65,timeout:120000});
    report.milestones.push({u,file,scroll:await page.evaluate(()=>scrollY),probe:await page.evaluate(()=>window.__aboutProbe?.())});
   }
   for(const id of ['about-clients','about-award','about-capability','end-section','footer-section']){
    const y=await page.locator(`#${id}`).evaluate(e=>e.getBoundingClientRect().top+scrollY);await seek(y);
    const file=`${width}-${id}.jpg`;await page.screenshot({path:`${out}/${file}`,type:'jpeg',quality:65,timeout:120000});report.milestones.push({id,file,y});
   }
   if(!baseline){
    assert.deepEqual(report.restrictedRequests,[]);assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);
    // Scene must sleep when it is entirely outside the viewport.
    await page.waitForTimeout(250);const sleeping=await page.evaluate(()=>window.__aboutProbe());await page.waitForTimeout(450);assert.equal((await page.evaluate(()=>window.__aboutProbe())).frames,sleeping.frames);
    await seek(unit*7.2);const beforeName=await page.locator('#about-who-team-name').textContent().catch(()=>null);
    await page.getByRole('button',{name:'Next team member',exact:true}).click();
    report.team={beforeName,selected:await page.getByRole('button',{name:'Select Ffion Morgan',exact:true}).getAttribute('aria-pressed')};assert.equal(report.team.selected,'true');assert.notEqual(beforeName,await page.locator('#about-who-team-name').textContent());
    if(width===390){
     const touch=await context.newCDPSession(page);
     const swipe=async(x,y,dx,dy)=>{
      await touch.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y,id:1}]});
      for(let i=1;i<=5;i++)await touch.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x+dx*i/5,y:y+dy*i/5,id:1}]});
      await touch.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await page.waitForTimeout(600);
     };
     const prior=await page.locator('#about-who-team-name').textContent();await swipe(290,400,-170,0);await page.waitForFunction(before=>document.querySelector('#about-who-team-name').textContent!==before,prior);report.horizontalSwipe=true;
     const after=await page.locator('#about-who-team-name').textContent(),y0=await page.evaluate(()=>scrollY);await swipe(180,400,0,-100);assert.equal(await page.locator('#about-who-team-name').textContent(),after);report.verticalSwipe={nameUnchanged:true,scrolled:(await page.evaluate(()=>scrollY))-y0};assert.ok(report.verticalSwipe.scrolled>0,'vertical swipe must retain native scrolling');await touch.detach();
    }
    await seek(unit*5.35);const first=await page.evaluate(()=>window.__aboutProbe());await seek(unit*1.6);await seek(unit*5.35);const reverse=await page.evaluate(()=>window.__aboutProbe());assert.ok(Math.abs(first.u-reverse.u)<.01);
    await seek(0);await page.mouse.move(width*.7,250);await page.waitForTimeout(300);report.pointer=await page.evaluate(()=>window.__aboutProbe());assert.ok(report.pointer.pointer.every(v=>Math.abs(v)<=1));
    await page.evaluate(()=>document.documentElement.dispatchEvent(new Event('pointerleave')));await page.waitForTimeout(1800);report.released=await page.evaluate(()=>window.__aboutProbe());assert.ok(report.released.pointerActive<report.pointer.pointerActive);
    // Event-injected visibility tests the listener/scheduler, not physical OS backgrounding.
    await page.evaluate(()=>{Object.defineProperty(document,'visibilityState',{configurable:true,value:'hidden'});document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(250);const hiddenFrames=await page.evaluate(()=>window.__aboutProbe().frames);await page.waitForTimeout(300);assert.equal(await page.evaluate(()=>window.__aboutProbe().frames),hiddenFrames);
    await page.evaluate(()=>{delete document.visibilityState;document.dispatchEvent(new Event('visibilitychange'));});await page.waitForTimeout(250);assert.ok(await page.evaluate(()=>window.__aboutProbe().frames)>hiddenFrames);report.injectedVisibilitySleeps=true;
    if(width===1440){await page.mouse.wheel(0,Math.round(unit*.5));await page.waitForFunction(()=>window.__aboutProbe().u>.2);report.nativeWheelForward=true;await page.mouse.wheel(0,-unit);await page.waitForFunction(()=>scrollY<3);report.nativeWheelReverse=true;}
    // A real continuous native interaction recording, distinct from milestone stills.
    if(process.env.ABOUT_RECORD==='1'){
     const raw=`${out}/recording-${width}`;fs.mkdirSync(raw,{recursive:true});const recording=await startBrowserRecording(context,page,raw);await recording.waitForFirstFrame();
     await page.mouse.move(width*.35,250);await page.waitForTimeout(800);await seek(unit*1.6);await page.waitForTimeout(800);await seek(unit*5.35);await page.waitForTimeout(800);await seek(unit*7.2);await page.getByRole('button',{name:'Next team member',exact:true}).click();await page.waitForTimeout(600);await seek(unit*1.6);report.recordedFrames=await recording.stop();
    }
    await seek(await page.locator('#about-capability').evaluate(e=>e.offsetTop));const card=page.getByRole('button',{name:'Creative expertise',exact:true});await card.focus();await page.keyboard.press('Enter');assert.equal(await card.getAttribute('aria-pressed'),'true');
    report.cardKeyboard=true;
    if(width===1440){await card.hover({position:{x:10,y:10}});const transform=await card.evaluate(e=>e.style.transform),angles=[...transform.matchAll(/rotate[XY]\(([-\d.]+)deg\)/g)].map(m=>Number(m[1]));assert.equal(angles.length,2);assert.ok(angles.every(n=>Math.abs(n)<=4));report.cardHover={transform,bounded:true};await page.mouse.move(0,0);assert.match(await card.evaluate(e=>e.style.transform),/rotateX\(0deg\).*rotateY\(0deg\)/);}
    else{await card.tap();assert.ok(!/rotateX\((?!0deg)/.test(await card.evaluate(e=>e.style.transform)));report.touchCardNoTilt=true;}

    // Genuine context loss + restoration recreates exactly one canvas and keeps selection/content.
    await seek(unit*7.2);const beforeLoss=await page.evaluate(()=>window.__aboutProbe());const loss=await page.evaluate(()=>{const ext=document.querySelector('#about-who canvas').getContext('webgl2').getExtension('WEBGL_lose_context');window.__restoreAbout=()=>ext.restoreContext();ext.loseContext();return !!ext;});assert.ok(loss);
    await page.waitForFunction(()=>document.querySelector('#about-who').dataset.sceneState==='lost');assert.ok(await page.getByText('Continue to studio information',{exact:true}).isVisible());
    await page.waitForTimeout(500);await page.evaluate(()=>window.__restoreAbout());await page.waitForFunction(before=>document.querySelector('#about-who').dataset.sceneState==='ready'&&Math.abs(window.__aboutProbe().u-before.u)<.02,beforeLoss);report.recovered=await page.evaluate(()=>window.__aboutProbe());assert.ok(report.recovered.time>=beforeLoss.time&&report.recovered.time<beforeLoss.time+1);assert.equal(await page.locator('#about-who canvas').count(),1);report.contextRestore=true;
    // Use the real menu/route link, not a test-only navigation control.
    await page.evaluate(()=>{window.__oldAboutContext=document.querySelector('#about-who canvas').getContext('webgl2');});
    await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();await page.waitForTimeout(200);const menuFrame=await page.evaluate(()=>window.__aboutProbe().frames);await page.waitForTimeout(350);assert.equal(await page.evaluate(()=>window.__aboutProbe().frames),menuFrame);report.menuSleeps=true;
    const home=page.locator('#header-menu-links a[href="/"]').first();await home.click();await page.waitForURL('http://127.0.0.1:3000/');await page.waitForTimeout(800);assert.equal(await page.locator('#about-who canvas').count(),0);assert.equal(await page.evaluate(()=>typeof window.__aboutProbe),'undefined');assert.equal(await page.evaluate(()=>window.__oldAboutContext.isContextLost()),true);report.disposedContext=true;
    await page.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>!!window.__aboutProbe);assert.equal(await page.locator('#about-who canvas').count(),1);report.returned=await page.evaluate(()=>window.__aboutProbe());
    await page.setViewportSize(width===390?{width:844,height:390}:{width:1024,height:768});await page.waitForTimeout(500);report.resized=await page.evaluate(()=>window.__aboutProbe());assert.ok(report.resized.width>0&&report.resized.height>0);assert.ok(Number.isFinite(report.resized.u));
    await page.evaluate(()=>{window.__oldAboutScrollTo=window.__lusionInspector?.scrollManager?.scrollToPixel;});await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();await page.locator('#header-menu-links a[href="/projects"]').first().click();await page.waitForURL('http://127.0.0.1:3000/projects');await page.waitForTimeout(500);assert.ok(await page.evaluate(()=>window.__lusionInspector?.scrollManager?.scrollToPixel!==window.__oldAboutScrollTo));assert.equal(await page.evaluate(()=>typeof window.__aboutProbe),'undefined');report.resizedInspectorReleased=true;
    assert.deepEqual(report.errors,[]);assert.deepEqual(report.consoleErrors,[]);
   }
  }finally{fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await context.close();}
 }
 if(!baseline){
  const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});await context.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');window.__enableAboutProbe=true;});const page=await context.newPage();
  await page.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>!!window.__aboutProbe);await page.waitForTimeout(500);const a=await page.evaluate(()=>window.__aboutProbe());await page.waitForTimeout(500);const b=await page.evaluate(()=>window.__aboutProbe());assert.equal(a.frames,b.frames);assert.equal(b.pending,false);fs.writeFileSync(`${out}/reduced.json`,JSON.stringify({a,b},null,2));await context.close();
  const failed=await browser.newContext({viewport:{width:390,height:844}});await failed.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return /webgl/.test(type)?null:Reflect.apply(native,this,[type,...args]);};});const p=await failed.newPage(),expectedFaults=[];p.on('console',m=>{if(m.type()==='error')expectedFaults.push(m.text());});await p.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle'});await p.waitForFunction(()=>document.querySelector('#about-who').dataset.sceneState==='unavailable');assert.ok(await p.getByText('Continue to studio information',{exact:true}).isVisible());assert.ok(await p.locator('#about-who').evaluate(e=>e.offsetHeight<2000));await p.screenshot({path:`${out}/unavailable.jpg`,type:'jpeg',quality:65});fs.writeFileSync(`${out}/unavailable.json`,JSON.stringify({state:'unavailable',expectedInjectedWebglErrors:expectedFaults},null,2));await failed.close();
 }
 console.log('PASS About '+(baseline?'baseline coverage':'real GPU scene, section coverage, reverse, pointer, keyboard, sleep, reduced, context recovery, fallback, remount'));
}finally{await browser.close();}
