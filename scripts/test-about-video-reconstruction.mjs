#!/usr/bin/env node
/** Functional regression coverage for the About video reconstruction.
 * Optional screenshots are working verification images, never a parity score.
 * SwiftShader execution does not establish physical-device performance. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base = process.env.BASE_URL || 'http://127.0.0.1:3003';
const captures = process.env.ABOUT_CHECK_CAPTURES;
if (captures) fs.mkdirSync(captures,{recursive:true});
const browser = await launchMotionBrowser();
try {
  for (const width of [1440,390]) {
    const page = await browser.newPage({viewport:{width,height:width<820?844:764},deviceScaleFactor:1});
    const errors = [];
    page.on('pageerror',e=>errors.push(e.message));
    page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
    await page.addInitScript(()=>{window.__enableAboutProbe=true;window.__enableCtaProbe=true;});
    await page.goto(`${base}/about`,{waitUntil:'networkidle',timeout:120000});
    if(process.env.EXPECTED_BUILD_SHA)assert.equal(await page.locator('#about').getAttribute('data-build-commit'),process.env.EXPECTED_BUILD_SHA,'preview is serving the current commit');
    await page.waitForFunction(()=>!!window.__aboutProbe);
    await page.waitForFunction(()=>document.querySelector('#about-who')?.dataset.landscapeSourceState==='ready',null,{timeout:120000});
    assert.equal(await page.locator('#about-who').getAttribute('data-scene-state'),'ready');
    assert.equal(await page.evaluate(()=>window.__aboutProbe().explorer),'source-rig','the archived humanoid, not a substitute astronaut, is active');
    assert.ok(await page.locator('.about-card-back-art').evaluateAll(es=>es.every(e=>e.getAttribute('src')==='/about/scene/card-back.png')));
    const velocity = await page.evaluate(()=>window.__aboutProbe().motionBackground);
    assert.equal(velocity.length,16);
    assert.ok([0,4,8,12].some(i=>velocity.slice(i,i+3).every(v=>Math.abs(v-128)<=1)), 'opening velocity target has a neutral background and its live sampler is attached');
    const seek = async y => {
      await page.evaluate(y=>window.__lusionInspector.scrollManager.scrollToPixel(y),y);
      await page.waitForTimeout(800);
    };
    const section = async id => page.locator(`#${id}`).evaluate(e=>({y:e.getBoundingClientRect().top+scrollY,range:e.offsetHeight-innerHeight}));
    const snap = async name => {if(captures)await page.screenshot({path:path.join(captures,`${width}-${name}.jpg`),quality:85});};
    if(width>=820){
      for(const u of [0,1.15,1.6,3.3]){await seek(u*width);await snap(`scene-${u}`);}
      await seek(7.2*width);
      await page.getByRole('button',{name:'Select Edan Kwan',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('#about-who')?.dataset.teamAssetState==='ready');
      await page.mouse.move(735,465);await page.waitForTimeout(1000);await snap('team');
      assert.equal(await page.locator('.about-team-cursor').innerText(),'→');
    }
    await seek((await section('about-clients')).y);
    const rows = page.locator('.about-client-marquee');
    assert.equal(await rows.count(),3);
    for(const row of await rows.all()){
      assert.equal(await row.locator('.about-client-marquee-set').count(),3);
      assert.equal(await row.locator('.about-client-marquee-set[aria-hidden="true"]').count(),2);
      const seam = await row.evaluate(e=>{
        const track=e.querySelector('.about-client-marquee-track'),animation=track.getAnimations()[0];
        animation.pause();animation.currentTime=Number(animation.effect.getTiming().duration)*.99999;
        const r=e.getBoundingClientRect(),t=track.getBoundingClientRect();
        return {left:t.left,right:t.right,rowLeft:r.left,rowRight:r.right};
      });
      assert.ok(seam.left<=seam.rowLeft+1&&seam.right>=seam.rowRight-1,'three copies cover the viewport through the loop seam');
    }
    if(width>=820){
      const heading=await page.locator('#about-clients h2').evaluate(e=>({height:e.getBoundingClientRect().height,lineHeight:parseFloat(getComputedStyle(e).lineHeight)}));
      assert.ok(heading.height<heading.lineHeight*1.1,'desktop brands heading is one line');
    }
    await snap('brands');
    await seek((await section('about-award')).y);await page.mouse.move(width*.45,300);await snap('recognition');
    assert.equal(await page.locator('.about-source-articles a').count(),3);
    assert.equal(await page.locator('.about-source-talks li').count(),5);
    const deck=await section('about-capability');
    if(width>=1000){
      for(const progress of [0,.36,.66,.92]){await seek(deck.y+deck.range*progress);await snap(`deck-${progress}`);}
      assert.ok(Number(await page.locator('.about-expertise-flourish').evaluate(e=>getComputedStyle(e).opacity))<.01,'flourish exits the settled deck');
    }
    assert.equal(await page.locator('.about-expertise-studio').count(),0);
    assert.equal(await page.locator('.about-service-card').count(),4);
    const cta=await section('end-section');await seek(cta.y+cta.range*.6);
    await page.locator('#end-section-title-link').focus();await page.waitForTimeout(800);
    assert.equal(await page.locator('.about-cta-arm').count(),0);
    for(const line of await page.locator('.about-cta-line').all())assert.match(await line.evaluate(e=>getComputedStyle(e).backgroundImage),/linear-gradient/,'keyboard focus underlines both lines');
    assert.match(await page.locator('#end-section-title-link').getAttribute('href'),/^mailto:/);
    assert.equal(await page.locator('#end-bottom').getAttribute('href'),'#footer-section');
    await snap('cta');
    if(width>=820){
      await page.setViewportSize({width:1720,height:912});
      const pill=await page.locator('#end-bottom').evaluate(e=>({width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));
      assert.ok(Math.abs(pill.width-286)<2&&Math.abs(pill.height-68)<1,'pill matches the recorded 1720px viewport footprint');
      await page.setViewportSize({width,height:764});
    }
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>document.querySelector('#about-capability')?.dataset.cardLayout==='reading');
    await seek((await section('about-clients')).y);
    for(const row of await rows.all()){
      assert.ok(await row.locator('[aria-hidden="true"]').evaluateAll(es=>es.every(e=>getComputedStyle(e).display==='none')),'all duplicated brands are hidden in reduced motion');
      assert.ok(await row.evaluate(e=>{const r=e.getBoundingClientRect();return [...e.querySelector('.about-client-marquee-set').children].every(c=>{const b=c.getBoundingClientRect();return b.left>=r.left-1&&b.right<=r.right+1;});}),'all unique static marks fit the row');
    }
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal overflow');
    assert.deepEqual(errors,[],'no page or renderer errors');
    console.log(`PASS About ${width}px: scene/section handoffs, brand seam and accessibility, recognition links, four cards, CTA focus/mailto/pill, reduced motion and overflow.`);
    await page.close();
  }
} finally {await browser.close();}
