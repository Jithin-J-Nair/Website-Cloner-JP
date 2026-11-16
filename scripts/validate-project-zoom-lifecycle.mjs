import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003',out=process.env.ZOOM_LIFECYCLE_OUT||'temp/project-zoom-production/lifecycle';fs.mkdirSync(out,{recursive:true});
const report={base,checks:[],errors:[]};
let browser;
async function setup(reducedMotion='no-preference'){
 browser=await launchMotionBrowser();const context=await browser.newContext({viewport:{width:1440,height:764},reducedMotion});
 await context.addInitScript(()=>{try{sessionStorage.setItem('lusion_booted_v1','1');}catch{}});
 const p=await context.newPage();p.setDefaultTimeout(90000);p.on('pageerror',e=>report.errors.push(e.message));return p;
}
async function released(p){await p.waitForFunction(()=>document.querySelector('#route-transition')?.dataset.routePhase==='idle');assert.equal(await p.locator('#main-content').evaluate(e=>e.inert),false);assert.equal(await p.locator('#header').evaluate(e=>e.inert),false);assert.equal(await p.locator('#project-zoom-surface').count(),0);assert.equal(await p.locator('#main-content').evaluate(e=>getComputedStyle(e).opacity),'1');}
try{
 // Real keyboard activation, immediate reduced routes, origin preserved through next.
 const p=await setup('reduce');await p.goto(base+'/');const first=p.locator('.project-item[data-id="oryzo_ai"]');await first.focus();await first.press('Enter');await p.waitForURL('**/projects/oryzo_ai');await released(p);assert.equal(await p.locator('#project-zoom-surface').count(),0);
 await p.locator('#project-next a').focus();await p.locator('#project-next a').press('Enter');await p.waitForURL('**/projects/atlas_motion');await p.waitForFunction(()=>document.querySelector('main')?.dataset.caseReady==='true');
 await p.getByRole('button',{name:'Back to Projects',exact:true}).click();await p.waitForURL(base+'/');await released(p);
 const box=await p.locator('.project-item[data-id="atlas_motion"] .project-item-main').boundingBox();assert.ok(Math.abs(box.y-764*.25)<8);report.checks.push('reduced keyboard open, next Enter, Home origin through chain, quarter-viewport return without zoom');await browser.close();browser=null;
 const direct=await setup('reduce');await direct.goto(base+'/projects/atlas_motion');await direct.getByRole('button',{name:'Back to Projects',exact:true}).click();await direct.waitForURL(base+'/');await released(direct);report.checks.push('direct-entry Back defaults to Home');await browser.close();browser=null;
 // Exercise a real compositor context loss and resize, then cancel before commit.
 const normal=await setup();await normal.goto(base+'/projects');const card=normal.locator('.project-item[data-id="atlas_motion"]');await card.evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY-innerHeight*.25));await normal.waitForFunction(()=>document.querySelector('.project-item[data-id="atlas_motion"] .project-item-main')?.dataset.depthReady==='true');await card.locator('.project-item-main').click();
 await normal.waitForFunction(()=>Number(document.querySelector('#project-zoom-surface')?.dataset.zoom)>.01);
 await normal.setViewportSize({width:1024,height:700});
 await normal.evaluate(()=>document.querySelector('#project-zoom-surface canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext());
 await normal.waitForFunction(()=>document.querySelector('#project-zoom-surface')?.dataset.graphics==='fallback');
 assert.equal(await normal.locator('#route-transition').getAttribute('data-route-phase'),'hiding');await normal.keyboard.press('Escape');await released(normal);await normal.waitForTimeout(1200);assert.equal(new URL(normal.url()).pathname,'/projects');assert.equal(await normal.locator('#projects-depth-canvas').evaluate(e=>e.style.visibility),'');report.checks.push('mid-zoom resize, real WEBGL_lose_context image fallback, Escape cleanup/no stale push/source restored');
 await browser.close();browser=null;assert.deepEqual(report.errors,[]);report.passed=true;console.log('PASS '+report.checks.join('; '));
}finally{fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser?.close();}
