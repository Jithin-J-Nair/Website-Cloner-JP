#!/usr/bin/env node
/** Same viewport as the user's three references; verifies local composition/ownership,
 * not similarity to unobserved live motion. Run against a production build. */
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const out=process.env.ABOUT_FRAMES_OUT||'temp/about-supplied-frames';
const base=process.env.BASE_URL||'http://127.0.0.1:3000';
fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
const page=await browser.newPage({viewport:{width:1568,height:832}});
await page.addInitScript(()=>window.__enableAboutProbe=true);
const report={viewport:{width:1568,height:832},buildId:fs.readFileSync('.next/BUILD_ID','utf8').trim(),errors:[],models:[],states:[]};
page.on('pageerror',e=>report.errors.push(e.message));
page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
page.on('request',r=>{if(/\.(glb|buf)(\?|$)|\/team\//.test(r.url()))report.models.push(new URL(r.url()).pathname);});
try{
 await page.goto(base+'/about',{waitUntil:'networkidle',timeout:120000});
 await page.waitForFunction(()=>window.__aboutProbe?.().explorer==='ready',null,{timeout:30000});
 // GLB readiness is not completion of the cold-entry overlay's exit transition.
 // Wait for its real removal; never hide it or bypass the loading experience.
 await page.locator('#preloader').waitFor({state:'detached',timeout:30000});
 const seek=async u=>{
  await page.evaluate(y=>{window.__lenis?.scrollTo(y,{immediate:true});window.scrollTo({top:y,behavior:'instant'});},u*1568);
  await page.waitForFunction(u=>Math.abs(window.__aboutProbe().u-u)<.005,u,{timeout:30000});
 };
 const snapshot=async(name,u,capture=true)=>{
  await seek(u);
  const state=await page.evaluate(()=>({probe:window.__aboutProbe(),left:document.querySelector('#about-who-title-left').getBoundingClientRect().toJSON(),right:document.querySelector('#about-who-title-right').getBoundingClientRect().toJSON()}));
  if(capture)await page.screenshot({path:`${out}/${name}.jpg`,type:'jpeg',quality:88,timeout:120000});
  report.states.push({name,u,...state});return state;
 };
 await snapshot('opening',0);
 await snapshot('pullback',.7);
 const near=await snapshot('close',1.6);
 await snapshot('intermediate',2.3);
 const wide=await snapshot('wide',3.2);
 assert.ok(wide.probe.camera[2]>near.probe.camera[2]*3,'real camera retreat must include the missing wide state');
 for(const side of ['left','right'])for(const key of ['x','y','width','height'])assert.ok(Math.abs(near[side][key]-wide[side][key])<.1,`manifesto ${side}.${key} stays screen-anchored while camera retreats`);
 await snapshot('editorial-handoff',3.9);
 await snapshot('narrative',5.35);
 await snapshot('team',7.2);
 for(const [name,u,expected]of [['reverse-wide',3.2,wide],['reverse-close',1.6,near]]){
  const reverse=await snapshot(name,u,false);
  for(let i=0;i<3;i++)assert.ok(Math.abs(reverse.probe.camera[i]-expected.probe.camera[i])<.01,'reverse/fast seek returns to the same physical pose');
 }
 await snapshot('reverse-opening',0);
 assert.equal(await page.locator('#about-who canvas').count(),1);
 assert.deepEqual([...new Set(report.models)],['/models/astronaut.glb']);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
 assert.deepEqual(report.errors,[]);
 report.acceptance='Local framing/ownership checks pass; exact geometry/material/source-motion parity is NOT certified.';
 console.log('PASS matched 1568×832 production viewport; 8 forward states + reverse; distinct physical near/wide distance; fixed manifesto bounds; one canvas; permitted model only; no errors/overflow. Source animation still unobserved.');
}finally{
 fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
 await browser.close();
}
