#!/usr/bin/env node
/** Focused end-stage integration gate, not a replacement for autonomous playback validation. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';

const width=Number(process.env.GOAL_VIEWPORT_WIDTH||1440),height=width<820?844:764;
const url=process.env.BASE_URL||'http://127.0.0.1:3003';
const reduced=process.env.GOAL_MOTION==='reduce';
const out=path.resolve(`temp/home-end/integration-${width}-${reduced?'reduce':'normal'}`);
fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();
const report={viewport:{width,height},reduced,errors:[],states:[]};
try {
  const page=await browser.newPage({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'});
  page.setDefaultTimeout(90000);
  page.on('pageerror',error=>report.errors.push(error.message));
  page.on('console',message=>{if(message.type()==='error')report.errors.push(message.text());});
  await page.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
  await page.goto(url,{waitUntil:'networkidle',timeout:120000});
  await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded&&window.__goalAstronautTelemetry.pipelineReady);
  const seek=async u=>{
    await page.evaluate(progress=>{const range=window.__lusionInspector.homeGoalSectionRanges.items.astronautWait;
      window.__lusionInspector.scrollManager.scrollToPixel(Math.round(range.pixelFrom+range.pixelCount*progress),true);},u);
    await page.waitForFunction(()=>window.__goalAstronautTelemetry.sceneState.endLoaded&&window.__goalAstronautTelemetry.sceneState.visorAtlasReady);
  };
  const snapshot=()=>page.evaluate(()=>{
    const t=window.__goalAstronautTelemetry,link=document.getElementById('end-section-title-link');
    const rect=link.getBoundingClientRect(),copy=document.getElementById('end-section-content');
    return {renderCount:t.renderCount,scroll:scrollY,scene:JSON.parse(JSON.stringify(t.sceneState)),
      bounds:rect.toJSON(),copyOpacity:Number(getComputedStyle(copy).opacity),href:link.getAttribute('href'),tabIndex:link.tabIndex,
      hit:document.elementFromPoint(innerWidth*.5,rect.top+rect.height*.25)?.closest('a')?.id,
      rolls:[...document.querySelectorAll('#home [data-home-end-roll]')].map(letter=>letter.style.transform)};
  });
  for(const progress of [.04,.16,.42,.65]) {
    await seek(progress);
    const sample=await snapshot();
    assert.equal(sample.scene.endDiamondCount,64);assert.equal(sample.scene.endStickerCount,26);
    assert.ok(sample.scene.endLoaded&&sample.scene.visorAtlasReady);
    if(progress>=.16) {
      assert.equal(sample.scene.ctaReveal,1);assert.equal(sample.copyOpacity,1);
      assert.ok(sample.bounds.left>=0&&sample.bounds.right<=width&&sample.bounds.top>0&&sample.bounds.bottom<height);
      assert.equal(sample.hit,'end-section-title-link');assert.equal(sample.tabIndex,0);assert.ok(sample.href.startsWith('mailto:'));
    }
    report.states.push({progress,...sample});
    await page.screenshot({path:path.join(out,`wait-${progress}.png`)});
  }
  if(!reduced) {
    await seek(.42);const before=await snapshot();
    await page.waitForFunction(count=>window.__goalAstronautTelemetry.renderCount>count+2,before.renderCount);
    // Observe a roll interval/cycle, not two samples inside its intentional hold.
    await page.waitForFunction(previous=>JSON.stringify([...document.querySelectorAll('#home [data-home-end-roll]')].map(letter=>letter.style.transform))!==JSON.stringify(previous),before.rolls);
    const after=await snapshot();
    assert.ok(after.scene.endTime>before.scene.endTime+.2,'end scene advances while stationary');
    assert.notEqual(after.scene.bakedFrame,before.scene.bakedFrame,'captured idle palette is not pinned to scroll');
    assert.equal(after.scroll,before.scroll,'idle motion does not move the document');
    assert.notDeepEqual(after.rolls,before.rolls,'individual duplicated glyphs roll');
    report.live={before:before.scene,after:after.scene};
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>{const s=window.__goalAstronautTelemetry.sceneState;return Math.abs(s.endTime-(8+s.waitProgress*2.45))<1e-7;});
  }
  // Reduced motion must be repeatable after time passes and after reverse seeks.
  await seek(.42);const fixed=await snapshot();
  await seek(.16);await seek(.42);const reverse=await snapshot();
  assert.deepEqual(reverse.scene,fixed.scene,'fixed end scene reverses exactly');
  await page.waitForTimeout(350);const still=await snapshot();
  assert.deepEqual(still.scene,reverse.scene,'no idle drift under reduced motion');
  await page.getByRole('link',{name:"Let's work together!",exact:true}).hover();
  await page.waitForTimeout(50);
  const line=await page.locator('#home .home-end-line-top').evaluate(el=>getComputedStyle(el).transform);
  assert.equal(line,'matrix(1, 0, 0, 1, 0, 0)','hover decoration survives reduced motion');
  report.reversible=true;report.staticIdle=true;
  await page.evaluate(()=>window.__lusionInspector.scrollManager.scrollToPixel(document.documentElement.scrollHeight,true));
  const floating=await page.evaluate(()=>document.elementFromPoint(innerWidth*.5,innerHeight*.9)?.closest('a')?.id==='end-bottom');
  assert.equal(floating,false,'continue pill cannot float over the footer');
  report.footerHandoff=true;
  await page.goto(url+'/about',{waitUntil:'networkidle',timeout:120000});
  const cleanup=await page.evaluate(()=>({canvas:Boolean(document.querySelector('#home-goal canvas')),
    ranges:Boolean(window.__lusionInspector?.homeGoalSectionRanges),telemetry:Boolean(window.__goalAstronautTelemetry)}));
  assert.deepEqual(cleanup,{canvas:false,ranges:false,telemetry:false});report.cleanup=cleanup;
  assert.deepEqual(report.errors,[]);
  await page.close();
  const failure=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
  failure.setDefaultTimeout(90000);
  const failedUrls=[],failureErrors=[];
  failure.on('pageerror',error=>failureErrors.push(error.message));
  await failure.route(/\/assets\/(?:models\/tunnels\/diamond\.buf|textures\/tunnels\/stickers(?:_low)?\.png|textures\/tunnels\/astronaut\/face\.png)$/,route=>{
    failedUrls.push(route.request().url());return route.abort('failed');
  });
  await failure.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
  await failure.goto(url,{waitUntil:'networkidle',timeout:120000});
  await failure.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded);
  await failure.evaluate(()=>{const r=window.__lusionInspector.homeGoalSectionRanges.items.astronautWait;
    window.__lusionInspector.scrollManager.scrollToPixel(Math.round(r.pixelFrom+r.pixelCount*.42),true);});
  const optional=await failure.evaluate(()=>({loaded:window.__goalAstronautTelemetry.glbLoaded,
    fallback:window.__goalAstronautTelemetry.fallbackVisible,scene:window.__goalAstronautTelemetry.sceneState,
    copyOpacity:getComputedStyle(document.getElementById('end-section-content')).opacity,
    href:document.getElementById('end-section-title-link').getAttribute('href')}));
  assert.equal(failedUrls.length,3);assert.deepEqual(failureErrors,[]);
  assert.ok(optional.loaded&&!optional.fallback&&!optional.scene.endLoaded&&!optional.scene.visorAtlasReady);
  assert.equal(optional.copyOpacity,'1');assert.ok(optional.href.startsWith('mailto:'));
  report.optionalAssetFailure={...optional,failedUrls};await failure.close();
  console.log(`PASS end stage ${width}×${height}: original assets, pinned/hit-tested CTA, ${reduced?'static':'live'} idle, reduced-motion reversal, hover, route cleanup`);
} finally {
  fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
  await browser.close();
}
