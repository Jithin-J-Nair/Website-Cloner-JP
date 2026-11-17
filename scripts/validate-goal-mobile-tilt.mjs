#!/usr/bin/env node
/** Synthetic orientation/browser checks, not physical-device sensor verification. */
import assert from 'node:assert/strict';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const browser = await launchMotionBrowser();
const base = process.env.BASE_URL || 'http://127.0.0.1:3004';
try {
 for (const scenario of ['desktop','mobile','denied','reduced']) {
  const mobile = scenario !== 'desktop';
  const context = await browser.newContext({ viewport: { width: mobile ? 390 : 1440, height: mobile ? 844 : 900 }, isMobile: mobile, hasTouch: mobile, reducedMotion: scenario === 'reduced' ? 'reduce' : 'no-preference' });
  await context.addInitScript(({denied}) => {
   sessionStorage.setItem('lusion_booted_v1','1');
   Object.defineProperty(DeviceOrientationEvent, 'requestPermission', { configurable: true, value: () => Promise.resolve(denied ? 'denied' : 'granted') });
  }, { denied: scenario === 'denied' });
  const page = await context.newPage(); const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.goto(base, { waitUntil:'networkidle', timeout:120000 });
  await page.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded && window.__goalAstronautTelemetry.pipelineReady && window.__goalAstronautTelemetry.sceneState.nativeWorldsReady, null, {timeout:120000});
  const seek = async (name, fraction) => {
   await page.evaluate(({name,fraction}) => { const r = window.__lusionInspector.homeGoalSectionRanges.items[name]; window.__lusionInspector.scrollManager.scrollToPixel(r.pixelFrom+r.pixelCount*fraction,true); }, {name,fraction});
   await page.waitForTimeout(300);
  };
  const emit = (beta,gamma) => page.evaluate(({beta,gamma}) => window.dispatchEvent(new DeviceOrientationEvent('deviceorientation',{beta,gamma})),{beta,gamma});
  const camera = () => page.evaluate(() => window.__goalAstronautTelemetry.sceneState.cameraMatrix);
  await seek('blackTunnel',.4);
  const enable = page.getByRole('button',{name:'Enable cinematic device motion'});
  if (!mobile || scenario === 'reduced') {
   assert.equal(await enable.count(),0);
   for (const [name,fraction] of [['blackTunnel',.4],['whiteTunnel',.65],['astronautDrop',.65]]) {
    await seek(name,fraction); await page.mouse.move(0,0); await page.waitForTimeout(350);
    let a=await camera(); await page.mouse.move(1400,850); await emit(30,0); await emit(40,20); await page.waitForTimeout(350); let z=await camera();
    assert.ok(Math.abs(a[12])<1e-8 && Math.abs(a[13])<1e-8 && Math.abs(z[12])<1e-8 && Math.abs(z[13])<1e-8,'desktop/reduced camera remains centered');
    assert.ok(Math.abs(a[0]-z[0])<1e-8 && Math.abs(a[1]-z[1])<1e-8 && Math.abs(a[8]-z[8])<1e-8 && Math.abs(a[9]-z[9])<1e-8,'mouse and sensors cannot rotate centered camera');
   }
  } else {
   await enable.waitFor({state:'visible'}); await enable.click();
   if (scenario === 'denied') { assert.equal(await page.getByText('MOTION BLOCKED').count(),1); }
   else {
    await emit(30,0); await emit(40,18);
    await page.waitForFunction(() => Math.abs(window.__goalAstronautTelemetry.sceneState.cameraMatrix[12])>.01,null,{timeout:30000});
    for (const [name,fraction] of [['whiteTunnel',.65],['astronautDrop',.65]]) {
      await seek(name,fraction); await emit(40,18); await page.waitForTimeout(400);
      assert.ok(Math.abs((await camera())[12])>.01,`${name} retains tilt`);
    }
    await page.getByRole('button',{name:'Turn off cinematic device motion'}).click();
    await page.waitForFunction(()=>Math.abs(window.__goalAstronautTelemetry.sceneState.cameraMatrix[12])<.002,null,{timeout:30000});
    await emit(55,25); await page.waitForTimeout(300); assert.ok(Math.abs((await camera())[12])<.002);
    await page.getByRole('button',{name:'Enable cinematic device motion'}).click(); await emit(30,0); await emit(40,18);
    await page.waitForFunction(()=>Math.abs(window.__goalAstronautTelemetry.sceneState.cameraMatrix[12])>.01,null,{timeout:30000});
    await page.emulateMedia({reducedMotion:'reduce'});
    await page.waitForFunction(()=>Math.abs(window.__goalAstronautTelemetry.sceneState.cameraMatrix[12])<1e-8,null,{timeout:30000});
    assert.equal(await page.getByRole('button',{name:'Turn off cinematic device motion'}).count(),0);
   }
  }
  assert.deepEqual(errors,[]); console.log(`PASS ${scenario}: centered desktop, mobile permission and tilt lifecycle as applicable`); await context.close();
 }
} finally { await browser.close(); }
