import fs from 'node:fs';import path from 'node:path';import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003',out=process.env.TUNNEL_AUDIT_OUT||'temp/home-tunnel-framing/observations';fs.mkdirSync(out,{recursive:true});
const widths=(process.env.TUNNEL_WIDTHS||'1440,390').split(',').map(Number);const report=[];
for(const width of widths){const height=width<813?844:900,browser=await launchMotionBrowser();try{
 const c=await browser.newContext({viewport:{width,height},reducedMotion:'reduce'});await c.addInitScript(()=>{try{sessionStorage.setItem('lusion_booted_v1','1')}catch{}});const p=await c.newPage();p.setDefaultTimeout(120000);const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&/THREE|GLSL|Shader Error/.test(m.text()))errors.push(m.text())});
 await p.goto(base,{waitUntil:'networkidle',timeout:120000});await p.locator('#home-goal').evaluate(e=>scrollTo(0,e.getBoundingClientRect().top+scrollY));await p.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded&&window.__goalAstronautTelemetry.sceneState.nativeWorldsReady);
 const phases=[['emergence',.4],['emergence',.9],['tunnel',.05],['tunnel',.4],['tunnel',.72],['tunnel',.83],['tunnel',.9],['tunnel',.99],['shatter',.2],['shatter',.7],['wait',.12],['wait',.4]];
 for(const [phase,ratio]of phases){
  await p.evaluate(({phase,ratio})=>{const t=window.__goalAstronautTelemetry,r=window.__lusionInspector.homeGoalSectionRanges.items;const y=phase==='emergence'?t.scrollForEmergence(ratio):phase==='tunnel'?t.scrollForTunnel(ratio):phase==='shatter'?t.scrollForShatter(ratio):r.astronautWait.pixelFrom+r.astronautWait.pixelCount*ratio;window.__lusionInspector.scrollManager.scrollToPixel(y,true);}, {phase,ratio});
  const file=`${width}-${phase}-${ratio}.jpg`;await p.screenshot({path:path.join(out,file),quality:85,timeout:120000});
  report.push({width,height,phase,ratio,file,...await p.evaluate(()=>({telemetry:window.__goalAstronautTelemetry,title:document.querySelector('#home-goal-tunnel-title')?.getBoundingClientRect().toJSON()})),errors:[...errors]});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 }
}finally{await browser.close()}}
console.log(`Captured ${report.length} phase observations; no parity assertions.`);
