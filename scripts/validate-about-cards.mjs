import fs from 'node:fs';
import assert from 'node:assert/strict';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const out = process.env.CARDS_OUT || 'temp/reference-cards';
fs.mkdirSync(out,{recursive:true});
const browser = await launchMotionBrowser();
try {
 for(const width of [1440,768,390]) {
  const height=width===390?844:900, context=await browser.newContext({viewport:{width,height},isMobile:width===390,hasTouch:width===390});
  await context.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');window.__enableAboutProbe=true;});
  const page=await context.newPage(),report={width,height,errors:[],checks:[],shots:[]};
  page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
  const shot=async name=>{const file=`${width}-${name}.jpg`;await page.screenshot({path:`${out}/${file}`,type:'jpeg',quality:82,timeout:120000});report.shots.push(file);};
  const seek=async y=>{await page.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo({top:y,behavior:'instant'});},y);await page.waitForTimeout(450);};
  try {
   await page.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>!!window.__aboutProbe);
   await shot('opening');await seek((width<820?height:width)*1.6);await shot('terrain');
   const section=page.locator('#about-capability');
   assert.equal(await section.locator('li').count(),20);assert.equal(await section.locator('canvas').count(),0);
   assert.equal(await section.locator('.about-card-back-art').count(),4);assert.equal(await section.locator('.about-card-front').count(),4);
   const geometry=await section.evaluate(e=>({top:e.getBoundingClientRect().top+scrollY,range:e.offsetHeight-innerHeight}));
   const cinematic=width>=1000;
   if(cinematic) {
    for(const p of [0,.2,.4,.6,.88,1,.6,.2,0]) {
     await seek(geometry.top+geometry.range*p);assert.ok(Math.abs(Number(await section.getAttribute('data-card-progress'))-p)<.005);
     await shot(`cards-${report.shots.length}-p${p}`);
     const flips=await section.locator('.about-card-flip').evaluateAll(es=>es.map(e=>Number(e.style.transform.match(/rotateY\(([-\d.]+)deg\)/)?.[1])));
     if(p===0)assert.ok(flips.every(n=>n===180));if(p>=.88)assert.ok(flips.every(n=>n===0));
    }
    await page.mouse.wheel(0,500);await page.waitForFunction(()=>Number(document.querySelector('#about-capability').dataset.cardProgress)>.05);
    await page.mouse.wheel(0,-800);await page.waitForFunction(()=>Number(document.querySelector('#about-capability').dataset.cardProgress)<.01);
    report.checks.push('native wheel forward/reverse; full and intermediate pose reentry');
    // Keyboard navigation from the initial back composition opens all front faces.
    await seek(geometry.top);const creative=page.getByRole('button',{name:'Focus Creative',exact:true});await creative.focus();await page.keyboard.press('Enter');
    await page.waitForFunction(()=>Number(document.querySelector('#about-capability').dataset.cardProgress)>=.85);
    assert.equal(await page.evaluate(()=>document.activeElement?.id),'expertise-1');
    const card=page.getByRole('button',{name:'Creative expertise',exact:true});await page.keyboard.press('Enter');assert.equal(await card.getAttribute('aria-pressed'),'true');
    await card.hover({position:{x:20,y:20}});const tilt=await card.evaluate(e=>e.style.transform);assert.match(tilt,/rotateX/);
    assert.ok([...tilt.matchAll(/rotate[XY]\(([-\d.]+)deg\)/g)].every(m=>Math.abs(Number(m[1]))<=2));
    await page.mouse.move(0,0);assert.equal(await card.evaluate(e=>e.style.transform),'');report.checks.push('keyboard reveals readable fronts; selected service; bounded hover resets');
    report.fronts=await section.locator('.about-card-front').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,overflow:e.scrollHeight>e.clientHeight+1};}));
    assert.ok(report.fronts.every(r=>r.x>=0&&r.x+r.width<=1441&&r.y>=0&&r.y+r.height<=901&&!r.overflow));
   } else {
    await seek(geometry.top);await shot('reading-heading');
    assert.equal(await section.getAttribute('data-card-layout'),'reading');
    for(let i=0;i<4;i++) {
     const card=page.locator(`#expertise-${i}`);await card.scrollIntoViewIfNeeded();await page.waitForTimeout(300);await shot(`reading-card-${i}`);
     await card.focus();await page.keyboard.press('Enter');assert.equal(await card.getAttribute('aria-pressed'),'true');
     const front=card.locator('.about-card-front');assert.equal(await front.evaluate(e=>e.scrollHeight<=e.clientHeight+1),true);
     assert.equal(await card.locator('.about-card-flip').evaluate(e=>e.style.transform),'rotateY(0deg)');
    }
    if(width===390){const card=page.locator('#expertise-3');await card.tap();assert.equal(await card.evaluate(e=>e.style.transform),'');report.checks.push('touch selects without hover tilt');}
    report.checks.push('all four complete service cards; no desktop pin on tablet/phone');
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   await page.emulateMedia({reducedMotion:'reduce'});await page.waitForFunction(()=>document.querySelector('#about-capability').dataset.cardLayout==='reading');
   const sectionHeight=await section.evaluate(e=>e.offsetHeight);assert.ok(sectionHeight<height*4);await section.scrollIntoViewIfNeeded();await shot('reduced');
   assert.ok((await section.locator('.about-card-flip').evaluateAll(es=>es.map(e=>e.style.transform))).every(t=>t==='rotateY(0deg)'));
   await page.emulateMedia({reducedMotion:'no-preference'});await page.waitForTimeout(500);
   if(cinematic){await seek(geometry.top+geometry.range*.5);await page.setViewportSize({width:768,height:900});await page.waitForFunction(()=>document.querySelector('#about-capability').dataset.cardLayout==='reading');await page.setViewportSize({width,height});await page.waitForFunction(()=>document.querySelector('#about-capability').dataset.cardLayout==='cinematic');report.checks.push('breakpoint crossing during intermediate flip');}
   report.checks.push('reduced-motion fronts without extra pin; no horizontal overflow; no extra GL context');
   await page.getByRole('button',{name:'Open navigation menu',exact:true}).click();await page.locator('#header-menu-links a[href="/"]').first().click();await page.waitForURL('http://127.0.0.1:3000/');
   assert.equal(await page.locator('#about-capability').count(),0);assert.equal(await page.evaluate(()=>typeof window.__aboutProbe),'undefined');
   await page.goto('http://127.0.0.1:3000/about',{waitUntil:'networkidle',timeout:120000});await page.waitForFunction(()=>!!document.querySelector('#about-capability').dataset.cardLayout);
   assert.equal(await page.locator('#about-capability').count(),1);report.checks.push('real menu navigation, old world release, clean About remount');
   assert.deepEqual(report.errors,[]);
  } finally {fs.writeFileSync(`${out}/${width}.json`,JSON.stringify(report,null,2));await context.close();}
 }
 // A source-browser attempt, reported separately from local visual evidence.
 const c=await browser.newContext({viewport:{width:1440,height:900}}),p=await c.newPage(),live={url:'https://lusion.co/about',verified:false};
 try{await p.goto(live.url,{waitUntil:'domcontentloaded',timeout:15000});await p.waitForTimeout(3000);await p.screenshot({path:`${out}/reference-opening.jpg`});live.loaded=true;}catch(e){live.error=e.message;}finally{fs.writeFileSync(`${out}/live.json`,JSON.stringify(live,null,2));await c.close();}
 console.log('PASS three-width About cards: reversible native scroll, fronts/backs, service completeness, keyboard/pointer/touch, reduced motion, resize, no overflow, navigation/remount. Source fidelity/timing not certified.');
} finally {await browser.close();}
