#!/usr/bin/env node
/** Baseline clone route census; not a live-reference visual comparison. */
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
const { launchMotionBrowser } = await import(pathToFileURL(path.resolve('scripts/lib/browser-runtime.mjs')));
const manifest = JSON.parse(fs.readFileSync('src/data/reference/lusion-ground-truth.json','utf8'));
const base = process.env.BASE_URL || 'http://127.0.0.1:3000';
const out = path.resolve('docs/lusion-parity-audit/evidence/clone-initial');
fs.mkdirSync(out,{recursive:true});
const report = {generatedAt:new Date().toISOString(),base,baseline:'5051f5b2a5fc479679f7d238f3d81e647e1beecf',scope:'Initial viewport only; clone-only smoke census. No live reference, visual parity score, full section coverage or animation-fidelity claim.',deviceScaleFactor:1,browserZoom:1,renderer:'Chromium with SwiftShader; not a physical phone or GPU benchmark',viewports:[[1920,1080],[1440,900],[1366,768],[1024,1366],[390,844],[375,812]],states:[],links:[],finished:false};
const persist=()=>fs.writeFileSync(path.join(out,'matrix.json'),JSON.stringify(report,null,2));
const browser=await launchMotionBrowser();
try {
 for(const [width,height] of report.viewports){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<=390,isMobile:width<=390});
  const page=await context.newPage();
  for(const route of manifest.routes){
   const state={route:route.route,viewport:{width,height},errors:[],warnings:[],badResponses:[],failedRequests:[]};
   const handlers={pageerror:e=>state.errors.push(e.message),console:m=>{if(m.type()==='error')state.errors.push(m.text());if(m.type()==='warning')state.warnings.push(m.text());},response:r=>{if(r.status()>=400)state.badResponses.push({url:r.url(),status:r.status()});},requestfailed:r=>state.failedRequests.push({url:r.url(),error:r.failure()})};
   for(const [event,handler]of Object.entries(handlers))page.on(event,handler);
   try {
    const response=await page.goto(base+route.route,{waitUntil:'domcontentloaded',timeout:45000});
    state.status=response?.status();
    await page.locator('main').first().waitFor({state:'visible',timeout:30000});
    await page.locator('#preloader').waitFor({state:'hidden',timeout:30000});
    await page.evaluate(()=>document.fonts.ready);
    await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
    state.finalURL=page.url();state.title=await page.title();state.expectedTitle=route.title;state.titleMatches=state.title===route.title;
    state.dom=await page.evaluate(()=>({h1:[...document.querySelectorAll('h1')].map(e=>e.textContent.trim()),description:document.querySelector('meta[name="description"]')?.content,canonical:document.querySelector('link[rel="canonical"]')?.href,scrollY,scrollHeight:document.documentElement.scrollHeight,scrollWidth:document.documentElement.scrollWidth,viewportWidth:innerWidth,overflow:document.documentElement.scrollWidth>innerWidth+1,images:[...document.images].map(i=>({src:i.currentSrc,complete:i.complete,width:i.naturalWidth,height:i.naturalHeight,loading:i.loading})),links:[...document.querySelectorAll('a[href]')].map(a=>({label:a.textContent.trim()||a.getAttribute('aria-label'),href:a.getAttribute('href')})),videos:[...document.querySelectorAll('video')].map(v=>({src:v.currentSrc||v.src,paused:v.paused,readyState:v.readyState,muted:v.muted})),canvas:[...document.querySelectorAll('canvas')].map(c=>({width:c.width,height:c.height,cssWidth:c.clientWidth,cssHeight:c.clientHeight})),heroState:document.querySelector('#home-hero-visual-container')?.dataset.motionState}));
    state.screenshot=(route.route==='/'?'home':route.route.slice(1).replaceAll('/','--'))+`--${width}x${height}--initial.jpg`;
    await page.screenshot({path:path.join(out,state.screenshot),type:'jpeg',quality:68,timeout:60000});
   }catch(e){state.error=e.message;}
   finally {for(const[event,handler]of Object.entries(handlers))page.off(event,handler);report.states.push(state);persist();console.log(JSON.stringify({route:state.route,viewport:state.viewport,status:state.status,error:state.error,consoleErrors:state.errors.length,overflow:state.dom?.overflow}));}
  }
  await context.close();
 }
 const paths=new Set(report.states.flatMap(s=>(s.dom?.links||[]).map(l=>l.href)).filter(h=>h?.startsWith('/')&&!h.startsWith('//')).map(h=>h.split('#')[0]||'/'));
 for(const url of [...paths].sort()){
  try{const response=await fetch(base+url);report.links.push({path:url,status:response.status,finalURL:response.url});await response.body?.cancel();}catch(e){report.links.push({path:url,error:e.message});}
 }
 report.finished=true;
} finally {persist();await browser.close();}
const { checkRouteMatrix } = await import('./check-route-matrix.mjs');
console.log(checkRouteMatrix(report, manifest.routes.map(entry => entry.route)));
