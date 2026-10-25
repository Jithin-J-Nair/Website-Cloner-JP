#!/usr/bin/env node
/** Compare the live reduced-motion hero reset with its neutral WebGL capture. */

import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
import sharp from 'sharp';


const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:3000';
const width = Number(process.env.AUDIT_WIDTH || 1440);
const height = Number(process.env.AUDIT_HEIGHT || (width < 820 ? 844 : 900));

const out = path.resolve(`temp/mission/${process.env.AUDIT_TAG || 'hero-baseline'}-${width}-${process.env.AUDIT_REDUCED === '1' ? 'reduce' : 'normal'}`);
fs.mkdirSync(out, {recursive:true});
const browser = await launchMotionBrowser();


const context=await browser.newContext({viewport:{width,height}});
await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
const page=await context.newPage(),report={errors:[],issues:[]};
page.on('pageerror',e=>report.errors.push(e.message));
try{
 await page.goto(baseUrl,{waitUntil:'networkidle',timeout:120000});
 // Exclude the decorative cursor from pixel comparison, not application behaviour.
 await page.addStyleTag({content:'div[aria-hidden="true"][class*="z-[100]"] {visibility:hidden !important}'});
 const hero=page.locator('#home-hero-visual-container');
 await page.waitForFunction(()=>document.querySelector('#home-hero-visual-container').dataset.motionState==='settled',null,{timeout:90000});
 const initial=await hero.screenshot({path:path.join(out,'hero-neutral.png'),timeout:120000});
 const box=await hero.boundingBox();await page.mouse.move(box.x+box.width*.49,box.y+box.height*.56);
 await page.waitForFunction(()=>Number(document.querySelector('#home-hero-visual-container').dataset.offsetEnergy)>.1);
 report.hover=await hero.evaluate(el=>({...el.dataset}));await hero.screenshot({path:path.join(out,'hero-displaced.png'),timeout:120000});
 const count=Number(await hero.getAttribute('data-render-count'));
 await page.emulateMedia({reducedMotion:'reduce'});
 await page.waitForFunction(n=>Number(document.querySelector('#home-hero-visual-container').dataset.renderCount)>n,count);
 await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const reduced=await hero.screenshot({path:path.join(out,'hero-live-reduced.png'),timeout:120000});
 report.reduced=await hero.evaluate(el=>({...el.dataset}));
 const a=await sharp(initial).removeAlpha().raw().toBuffer(),b=await sharp(reduced).removeAlpha().raw().toBuffer();
 assert.equal(a.length,b.length);let sum=0,changed=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);sum+=d;if(d>3)changed++;}
 report.pixelComparison={meanAbsoluteChannelError:sum/a.length,fractionChannelsDifferentOver3:changed/a.length};
 if(report.pixelComparison.fractionChannelsDifferentOver3>.001)report.issues.push('Live reduced-motion leaves the hero visually displaced instead of restoring its neutral pose');
 if(report.reduced.motionState!=='settled'||report.reduced.activeRaf!=='false')report.issues.push('Reduced-motion hero reports responding/active after its loop stops');
 console.log(JSON.stringify(report));
}finally{fs.writeFileSync(path.join(out,'live-motion.json'),JSON.stringify(report,null,2));await browser.close()}
if(report.issues.length||report.errors.length)process.exitCode=1;
