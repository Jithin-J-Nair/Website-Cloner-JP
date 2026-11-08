import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003';const out='temp/motion-fidelity-round4/utilities';fs.mkdirSync(out,{recursive:true});const browser=await launchMotionBrowser();const report=[];
try{
 for(const width of [1440,390]){
  const c=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce',hasTouch:width===390});await c.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));const p=await c.newPage();
  for(const route of ['/work','/contact','/labs','/design-system','/work/atlas_motion','/not-a-real-page']){
   if(route==='/labs'){
    const response=await c.request.get(base+route,{maxRedirects:0});assert.equal(response.status(),307);assert.equal(response.headers().location,'https://labs.lusion.co/');report.push({route,width,status:response.status(),location:response.headers().location,note:'Existing external redirect verified without following it. External rendered page not audited.'});continue;
   }
   const errors=[];const onError=e=>errors.push(e.message);p.on('pageerror',onError);const response=await p.goto(base+route,{waitUntil:'networkidle',timeout:60000});await p.evaluate(()=>document.fonts.ready);await p.waitForSelector('#route-transition[data-route-phase="idle"]',{state:'attached'});
   const expected=['/not-a-real-page','/design-system'].includes(route)?404:200;assert.equal(response.status(),expected);assert.deepEqual(errors,[]);
   const layout=await p.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,main:!!document.querySelector('main'),inert:document.querySelector('#main-content').inert,header:!!document.querySelector('#header-right-menu-btn')}));assert.equal(layout.overflow,false);assert.equal(layout.inert,false);assert.equal(layout.main,true);assert.equal(layout.header,true);
   if(route==='/work/atlas_motion')assert.equal(new URL(p.url()).pathname,'/projects/atlas_motion');
   if(route==='/contact'){assert.equal(new URL(p.url()).hash,'#footer-section');const r=await p.locator('#footer-section').boundingBox();assert.ok(r&&r.y<(width===390?844:900)&&r.y+r.height>0);}
   await p.screenshot({path:`${out}/${width}-${route.slice(1).replaceAll('/','-')}.jpg`,quality:75});report.push({route,width,url:p.url(),status:response.status(),errors,layout});p.off('pageerror',onError);
  }
  await c.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS 10 utility/alias/not-found browser observations plus 2 external-Labs redirect checks, including contact fragment and case alias. Functional/layout smoke, not rendered-reference fidelity.');
}finally{await browser.close();}
