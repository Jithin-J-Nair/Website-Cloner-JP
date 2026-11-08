#!/usr/bin/env node
/** Browser acceptance for the source-derived upper Home; screenshots are not a parity certificate. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
import { checkHomeEditorial } from './lib/check-home-editorial.mjs';
const width=Number(process.env.EDITORIAL_WIDTH||1440),height=width<813?844:764,reduced=process.env.EDITORIAL_MOTION==='reduce';
const base=process.env.BASE_URL||'http://127.0.0.1:3003',out=path.resolve(`temp/home-editorial/integration-${width}-${reduced?'reduce':'normal'}`);fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser(),report={width,height,reduced,errors:[]};
try{
 const context=await browser.newContext({viewport:{width,height},hasTouch:width<813,isMobile:width<813,reducedMotion:reduced?'reduce':'no-preference'});
 await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
 const page=await context.newPage();page.setDefaultTimeout(90000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',e=>{if(e.type()==='error')report.errors.push(e.text());});
 await page.goto(base,{waitUntil:'networkidle',timeout:120000});
 report.editorial=await checkHomeEditorial(page,{width,height,reduced,out});
 await page.goto(base+'/about',{waitUntil:'domcontentloaded',timeout:120000});
 assert.equal(await page.locator('#home-editorial-canvas').count(),0);report.cleanup=true;assert.deepEqual(report.errors,[]);
 await context.close();
 // Independent optional failures must preserve the native HTML, all project links and other depth surfaces.
 const failure=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await failure.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
 const blocked=[];await failure.route('**/assets/**',route=>{const url=route.request().url();if(url.endsWith('/lines/line_reel.buf')||url.endsWith('/oryzo_ai/home_depth.webp')){blocked.push(url);return route.abort();}return route.continue();});
 const p=await failure.newPage();p.setDefaultTimeout(90000);const errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(base,{waitUntil:'networkidle',timeout:120000});
 await p.locator('#home-featured .project-item-main').first().evaluate(el=>window.scrollTo(0,el.getBoundingClientRect().top+scrollY-150));
 await p.waitForFunction(()=>document.querySelector('.project-item-main').dataset.depthFailed==='true');
 const fallback=await p.locator('.project-item-image').first().evaluate(el=>({opacity:getComputedStyle(el).opacity,width:el.naturalWidth}));assert.equal(fallback.opacity,'1');assert.ok(fallback.width>0);assert.equal(await p.locator('#home-featured .project-item').count(),12);assert.ok(blocked.length>=2);assert.deepEqual(errors,[]);
 await p.screenshot({path:path.join(out,'optional-assets-fallback.png'),timeout:90000});report.optionalFailure={blocked,fallback,errors};
 // A lost shared context must reveal DOM media instead of leaving hidden images behind.
 await p.evaluate(()=>document.getElementById('home-editorial-canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await p.waitForFunction(()=>document.getElementById('home').dataset.editorialWebgl==='fallback');
 assert.equal(await p.locator('#home-reel-video-fallback').evaluate(el=>getComputedStyle(el).opacity),'1');assert.equal(await p.locator('[data-depth-ready="true"]').count(),0);report.contextLossFallback=true;
 await failure.close();
 console.log(`PASS Home editorial ${width}x${height} ${reduced?'reduce':'normal'}: native line/morph, actual film and depth pixels, links/modal, all cards, cleanup and failure isolation`);
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();}
