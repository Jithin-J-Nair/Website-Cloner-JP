import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003',baseline=process.env.CLARITY_BASELINE==='1';
const out=process.env.CLARITY_OUT||`temp/project-scroll-clarity/${baseline?'before':'after'}`;fs.mkdirSync(out,{recursive:true});
const realMedia=process.env.CLARITY_REAL_MEDIA==='1';
const report={base,baseline,realMedia,scope:realMedia?'Actual Atlas asset and foliage, no intercepted media. DOM/GPU difference includes lighting; not an isolated sharpness score.':'Synthetic raster calibration intercepted in this browser only, not reference artwork or physical GPU performance. Actual case shader uniform sampled during deterministic scroll steps.',rasters:[],motion:[],errors:[]};
// Replace one image only in this isolated browser, never repository assets.
const calibration=await sharp(Buffer.from(`<svg width="1820" height="1024" xmlns="http://www.w3.org/2000/svg"><defs><pattern id="p" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="white"/><rect width="4" height="4" fill="black"/><rect x="4" y="4" width="4" height="4" fill="black"/></pattern></defs><rect width="1820" height="1024" fill="url(#p)"/><rect x="50" y="180" width="1600" height="200" fill="white"/><text x="80" y="290" font-size="70" font-family="sans-serif">IMAGE DETAIL — 0123456789</text></svg>`)).png().toBuffer();
let browser;
try{
 for(const dpr of [1,2]){
  browser=await launchMotionBrowser();const context=await browser.newContext({viewport:{width:1440,height:900},deviceScaleFactor:dpr,reducedMotion:'reduce'});
  await context.addInitScript(()=>{
   try{sessionStorage.setItem('lusion_booted_v1','1');}catch{}
   const names=new WeakMap();window.__clarity={strength:0};
   for(const Type of [WebGLRenderingContext,WebGL2RenderingContext]){
    const get=Type.prototype.getUniformLocation,set=Type.prototype.uniform1f;
    Type.prototype.getUniformLocation=function(program,name){const location=get.call(this,program,name);if(location&&this.canvas.id==='case-gallery-canvas')names.set(location,name);return location;};
    Type.prototype.uniform1f=function(location,value){if(names.get(location)==='uVelocity')window.__clarity.strength=value;return set.call(this,location,value);};
   }
  });
  if(!realMedia)await context.route('**/assets/projects/atlas_motion/1.webp',route=>route.fulfill({contentType:'image/png',body:calibration}));
  // Remove lighting from this calibration comparison only, isolating resampling.
  if(!realMedia)await context.route('**/assets/models/plant.buf',route=>route.fulfill({status:503,body:'Calibration: lighting isolated'}));
  const page=await context.newPage();page.setDefaultTimeout(120000);page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&/THREE|GLSL|Shader Error/i.test(m.text()))report.errors.push(m.text());});
  await page.goto(base+'/projects/atlas_motion',{waitUntil:'networkidle',timeout:120000});
  const panel=page.locator('.case-panel[data-panel-index="1"]');
  await panel.evaluate(el=>{const y=el.offsetLeft-innerWidth*.1;if(window.__lenis){window.__lenis.resize();window.__lenis.scrollTo(y,{immediate:true,force:true});}else scrollTo(0,y);});
  await page.waitForFunction(()=>document.querySelector('.case-panel[data-panel-index="1"]')?.dataset.casePixels==='ready');
  const size=await page.locator('#case-gallery-canvas').evaluate(c=>({width:c.width,height:c.height,cssWidth:innerWidth,cssHeight:innerHeight}));
  const box=await panel.boundingBox();const rect={left:Math.round((box.x+100)*dpr),top:Math.round((box.y+50)*dpr),width:Math.round(500*dpr),height:Math.round(300*dpr)};
  const gpu=await page.screenshot({type:'png'});await sharp(gpu).extract(rect).toFile(path.join(out,`dpr${dpr}-gpu.png`));
  await page.evaluate(()=>{document.querySelector('#case-gallery-canvas').style.display='none';for(const el of document.querySelectorAll('[data-case-pixels]'))delete el.dataset.casePixels;});
  const dom=await page.screenshot({type:'png'});await sharp(dom).extract(rect).toFile(path.join(out,`dpr${dpr}-dom.png`));
  const pixels=async buffer=>sharp(buffer).extract(rect).removeAlpha().raw().toBuffer();const a=await pixels(gpu),b=await pixels(dom);
  let squared=0;for(let i=0;i<a.length;i++)squared+=(a[i]-b[i])**2;
  const glError=await page.locator('#case-gallery-canvas').evaluate(c=>c.getContext('webgl2').getError());assert.equal(glError,0);
  const row={dpr,size,glError,rmse:Math.sqrt(squared/a.length),crop:rect};report.rasters.push(row);
  if(!baseline){assert.ok(size.width>=size.cssWidth*dpr-1);assert.ok(size.height>=size.cssHeight*dpr-1);if(!realMedia)assert.ok(row.rmse<35,'calibration resampling error must stay below the old downsampled 2x result');}
  if(dpr===1){
   await page.evaluate(()=>document.querySelector('#case-gallery-canvas').style.removeProperty('display'));
   await page.evaluate(()=>{window.__clarityOldCanvas=document.querySelector('#case-gallery-canvas')});
   await page.emulateMedia({reducedMotion:'no-preference'});
   await page.waitForFunction(()=>document.querySelector('#case-gallery-canvas')!==window.__clarityOldCanvas&&document.querySelector('main')?.dataset.caseGraphics==='ready');
   await page.waitForTimeout(400);
   report.motion=await page.evaluate(()=>new Promise(resolve=>{
    const samples=[];let frame=0;const start=scrollY;
    const sample=()=>{
     samples.push({scroll:Number(document.querySelector('main').dataset.caseScroll),strength:window.__clarity.strength});
     if(frame<12){const y=start+(frame+1)*12;if(window.__lenis){window.__lenis.resize();window.__lenis.scrollTo(y,{immediate:true,force:true});}else scrollTo(0,y);}
     if(++frame<24)requestAnimationFrame(sample);else resolve(samples);
    };requestAnimationFrame(sample);
   }));
   if(!baseline){for(let i=1;i<report.motion.length;i++){const delta=(report.motion[i].scroll-report.motion[i-1].scroll)/1440;assert.ok(Math.abs(report.motion[i].strength-Math.max(-.15,Math.min(.15,delta)))<.000003,JSON.stringify({i,sample:report.motion[i],delta}));}assert.equal(report.motion.at(-1).strength,0);}
  }
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));await browser.close();browser=null;
 }
 assert.deepEqual(report.errors,[]);report.passed=!baseline;fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({baseline,rasters:report.rasters,motionLast:report.motion.slice(-3),passed:report.passed},null,2));
}finally{await browser?.close();}
