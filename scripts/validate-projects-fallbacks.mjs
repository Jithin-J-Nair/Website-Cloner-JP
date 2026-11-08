#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003';
fs.mkdirSync('temp/projects-reconstruction',{recursive:true});
const browser=await launchMotionBrowser();
const report={};
try {
 const page=await browser.newPage({viewport:{width:1440,height:764},reducedMotion:'reduce'});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{window.__enableCtaProbe=true;sessionStorage.setItem('lusion_booted_v1','1');});
 const blocked=[];
 await page.route('**/assets/**',route=>{const url=route.request().url();if(url.endsWith('/oryzo_ai/home_depth.webp')||url.endsWith('/textures/flip_texture.png')){blocked.push(url);return route.abort();}return route.continue();});
 await page.goto(`${base}/projects`,{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>document.querySelector('.project-item-main').dataset.depthFailed==='true');
 await page.waitForFunction(()=>document.querySelectorAll('.project-item-main')[1].dataset.depthReady==='true');
 const fallback=await page.locator('.project-item-image').first().evaluate(e=>({opacity:getComputedStyle(e).opacity,width:e.naturalWidth}));
 assert.equal(fallback.opacity,'1');assert.ok(fallback.width>0);assert.equal(await page.locator('.project-item').count(),19);
 // A lost depth context must not be followed by a frame that re-hides HTML.
 await page.locator('#projects-depth-canvas').evaluate(c=>{window.__projectsDepthLoss=c.getContext('webgl2').getExtension('WEBGL_lose_context');window.__projectsDepthLoss.loseContext();});
 await page.waitForFunction(()=>document.getElementById('projects').dataset.editorialWebgl==='fallback');
 await page.evaluate(()=>window.dispatchEvent(new Event('scroll')));await page.waitForTimeout(200);
 assert.equal(await page.locator('[data-depth-ready="true"]').count(),0);
 assert.equal(await page.locator('.project-item-image').nth(1).evaluate(e=>getComputedStyle(e).opacity),'1');
 await page.evaluate(()=>window.__projectsDepthLoss.restoreContext());
 await page.waitForFunction(()=>document.querySelectorAll('.project-item-main')[1].dataset.depthReady==='true');
 await page.locator('#end-section').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY+innerHeight*.5));
 await page.waitForFunction(()=>document.querySelector('[data-cta-field-state]').dataset.ctaFieldState==='unavailable');
 await page.waitForTimeout(200);assert.equal(await page.locator('#end-section canvas').evaluate(e=>getComputedStyle(e).opacity),'0');
 assert.equal((await page.evaluate(()=>window.__projectsCtaProbe())).pending,false);
 assert.equal(await page.locator('#end-section svg rect').count(),96);assert.ok(await page.locator('#end-section-title-link').isVisible());
 await page.screenshot({path:'temp/projects-reconstruction/optional-assets-fallback.png',timeout:120000});
 assert.deepEqual(errors,[]);assert.equal(blocked.length,2);report.optionalAssets={blocked,fallback,errors};await page.close();
 // No WebGL at all: both DOM surfaces and every link must remain usable.
 const noGL=await browser.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});
 const noGLErrors=[];noGL.on('pageerror',e=>noGLErrors.push(e.message));
 await noGL.addInitScript(()=>{
  sessionStorage.setItem('lusion_booted_v1','1');const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(type,...args){if(/^webgl|experimental-webgl/.test(type))return null;return get.call(this,type,...args);};
 });
 await noGL.goto(`${base}/projects`,{waitUntil:'networkidle',timeout:120000});
 await noGL.waitForFunction(()=>document.getElementById('projects').dataset.editorialWebgl==='fallback');
 assert.equal(await noGL.locator('.project-item').count(),19);assert.equal(await noGL.locator('.project-item-image').first().evaluate(e=>getComputedStyle(e).opacity),'1');
 await noGL.locator('#end-section').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY+innerHeight*.5));
 await noGL.waitForFunction(()=>document.querySelector('[data-cta-field-state]').dataset.ctaFieldState==='unavailable');
 assert.ok(await noGL.locator('#end-section-title-link').isVisible());assert.equal(await noGL.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(noGLErrors,[]);report.noWebGL={errors:noGLErrors,links:19};
 console.log('PASS Projects: missing depth isolated to one card; archive context loss/restoration; missing atlas static/readable fallback with no active RAF; no-WebGL mobile retains all links and CTA.');
} finally {fs.writeFileSync('temp/projects-reconstruction/fallback-report.json',JSON.stringify(report,null,2));await browser.close();}
