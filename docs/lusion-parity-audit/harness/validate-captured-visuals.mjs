#!/usr/bin/env node
/** Paired local-checkpoint regression, not a current-live Lusion comparison.
 * Static UI is pixel-tested with videos/canvases hidden on BOTH sides. Unmasked
 * screenshots are retained separately; graphics/motion need independent review. */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { launchMotionBrowser } from '../../../scripts/lib/browser-runtime.mjs';
const manifest = JSON.parse(fs.readFileSync('src/data/reference/lusion-ground-truth.json', 'utf8'));
const selectedRoutes = process.env.VISUAL_ROUTES ? new Set(process.env.VISUAL_ROUTES.split(',')) : null;
const routes = manifest.routes.filter(entry => !selectedRoutes || selectedRoutes.has(entry.route));
if (!routes.length) throw new Error('No selected canonical routes');
const out = path.resolve(process.env.VISUAL_OUT_DIR || 'docs/lusion-parity-audit/evidence/implementation-01');
fs.mkdirSync(out, { recursive: true });
const viewports = [[1920,1080],[1440,900],[1366,768],[1024,1366],[390,844],[375,812]];
const report = { buildId: fs.readFileSync('.next/BUILD_ID','utf8').trim(), baseline: 'Local 5051 production checkpoint, not original Lusion', current: 'Working-tree production build',
  referenceScope: 'Captured manifest/assets/screenshots/recording. No current-live parity assertion.',
  policy: 'Reduced motion, DPR1, seeded initialization, paused video. Static UI raster gate hides canvas/video identically; unmasked images are review evidence, not a 3D or motion acceptance.',
  threshold: { channelDelta: 24, maximumStaticChangedFraction: .03 }, states: [], sections: [], failures: [], finished: false };
const save = () => fs.writeFileSync(path.join(out,'visual-report.json'),JSON.stringify(report,null,2));
let browser;
async function settle(page, url) {
  const response = await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
  await page.locator('main').first().waitFor();
  await page.locator('#preloader').waitFor({state:'hidden',timeout:30000});
  await page.evaluate(()=>document.fonts.ready);
  await page.waitForFunction(()=>[...document.images].filter(i=>i.loading!=='lazy').every(i=>i.complete),null,{timeout:20000});
  await page.evaluate(()=>{for(const v of document.querySelectorAll('video')){v.pause();if(v.readyState>=1)v.currentTime=0;}});
  return response.status();
}
async function snapshot(page, name) {
  const buffer = await page.screenshot({type:'png',animations:'disabled'});
  await sharp(buffer).jpeg({quality:82}).toFile(path.join(out,name+'.jpg'));
  return buffer;
}
async function compare(a,b,name) {
  const aa=await sharp(a).removeAlpha().raw().toBuffer({resolveWithObject:true});
  const bb=await sharp(b).removeAlpha().raw().toBuffer({resolveWithObject:true});
  if(aa.info.width!==bb.info.width||aa.info.height!==bb.info.height)throw new Error('Raster dimensions differ');
  const diff=Buffer.alloc(aa.data.length);let changed=0;
  for(let i=0;i<diff.length;i+=3){let max=0;for(let j=0;j<3;j++){const d=Math.abs(aa.data[i+j]-bb.data[i+j]);diff[i+j]=d;max=Math.max(max,d);}if(max>24)changed++;}
  await sharp(diff,{raw:{width:aa.info.width,height:aa.info.height,channels:3}}).jpeg({quality:75}).toFile(path.join(out,name+'--diff.jpg'));
  return {changedPixels:changed,changedFraction:changed/(aa.info.width*aa.info.height)};
}
try {
  for(const [width,height] of viewports){
    browser=await launchMotionBrowser();
    const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:1,reducedMotion:'reduce',isMobile:width<=390,hasTouch:width<=390});
    await context.addInitScript(()=>{if(location.protocol==='http:')sessionStorage.setItem('lusion_booted_v1','1');let seed=104729;Math.random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};});
    const pages=[await context.newPage(),await context.newPage()];
    for(const entry of routes){
      const name=(entry.route==='/'?'home':entry.route.slice(1).replaceAll('/','--'))+`--${width}x${height}`;
      const row={route:entry.route,viewport:{width,height},errors:[],sides:[]};
      const buffers=[];
      try{
        for(const [index,page] of pages.entries()){
          const errors=[],warnings=[],abortedRequests=[];
          const listener=e=>errors.push(e.message);
          const consoleListener=m=>{if(m.type()==='error')errors.push(`console: ${m.text()}`);else if(m.type()==='warning')warnings.push(m.text());};
          const responseListener=r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()}: ${r.url()}`);};
          const requestListener=r=>{const message=r.failure()?.errorText||'unknown failure';if(message==='net::ERR_ABORTED')abortedRequests.push(r.url());else errors.push(`request: ${message}: ${r.url()}`);};
          page.on('pageerror',listener);page.on('console',consoleListener);page.on('response',responseListener);page.on('requestfailed',requestListener);
          try{
            const status=await settle(page,(index===0?'http://127.0.0.1:3001':'http://127.0.0.1:3000')+entry.route);
            const metrics=await page.evaluate(()=>({title:document.title,overflow:document.documentElement.scrollWidth>innerWidth+1,h1:[...document.querySelectorAll('h1')].map(h=>h.textContent.trim())}));
            row.sides.push({status,...metrics,errors,warnings,abortedRequests});
            await snapshot(page,name+(index===0?'--baseline':'--current'));
            const style=await page.addStyleTag({content:'canvas, video { visibility: hidden !important; }'});
            buffers.push(await snapshot(page,name+(index===0?'--baseline-static':'--current-static')));
            await style.evaluate(el=>el.remove());
            if(status!==200||metrics.title!==entry.title||metrics.overflow||!metrics.h1.some(Boolean)||errors.length)row.errors.push(`Side ${index}: route/title/H1/overflow/page-error gate`);
          }finally{page.off('pageerror',listener);page.off('console',consoleListener);page.off('response',responseListener);page.off('requestfailed',requestListener);}
        }
        row.staticUI=await compare(buffers[0],buffers[1],name);
        if(row.staticUI.changedFraction>.03)row.errors.push('Static UI raster exceeds 3% changed pixels (channel threshold 24); inspect before accepting');
      }catch(e){row.errors.push(e.message);}
      report.states.push(row);if(row.errors.length)report.failures.push({route:entry.route,viewport:row.viewport,errors:row.errors});save();
      console.log(JSON.stringify({route:row.route,viewport:row.viewport,staticUI:row.staticUI,errors:row.errors}));
    }
    // Evidence-backed About changes are expected deltas, not waived initial-state gates.
    for(const [index,page] of pages.entries()){
      await settle(page,(index===0?'http://127.0.0.1:3001':'http://127.0.0.1:3000')+'/about');
      await page.locator('#about-clients').scrollIntoViewIfNeeded();
      await page.locator('#about-clients').evaluate(async el=>{await Promise.all([...el.querySelectorAll('img')].map(img=>{img.loading='eager';return img.decode()}))});
      const brands=await page.locator('#about-clients').evaluate(el=>({images:el.querySelectorAll('img').length,uniqueSources:[...new Set([...el.querySelectorAll('img')].map(i=>i.getAttribute('src')))]}));
      await snapshot(page,`about-clients--${width}x${height}--${index===0?'baseline':'current'}`);
      await page.locator('#about-capability').scrollIntoViewIfNeeded();
      await snapshot(page,`about-expertise--${width}x${height}--${index===0?'baseline':'current'}`);
      report.sections.push({viewport:{width,height},side:index===0?'baseline':'current',brands,expectedChanges:['LP-009 verified brand assets','LP-010 source card linework']});save();
    }
    await context.close();await browser.close();
  }
  report.finished=true;
  if(report.states.length!==routes.length*viewports.length)report.failures.push({error:'Incomplete route/viewport coverage'});
}finally{save();await browser?.close();}
console.log(JSON.stringify({finished:report.finished,states:report.states.length,failures:report.failures.length}));
if(report.failures.length||!report.finished)process.exitCode=1;
