#!/usr/bin/env node
/** Deterministic seek/readback for image equivalence only. NOT native playback evidence. */
import fs from 'node:fs';
import sharp from 'sharp';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const out=process.env.CULL_PARITY_OUT || 'temp/root-cause/parity';
fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser(),report=[];
try {
  for(const width of [1440,390]) {
    const height=width<820?844:900;
    const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
    await context.addInitScript(()=>sessionStorage.setItem('lusion_booted_v1','1'));
    const page=await context.newPage();
    await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'networkidle',timeout:120000});
    await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:90000});
    for(const point of [{t:.865},{t:.90},{t:.94},{t:.975},{s:.3},{s:.5},{s:.7},{s:.85}]) {
      const seek=()=>page.evaluate(point=>{
        const r=window.__lusionInspector.homeGoalSectionRanges.items;
        const y=point.t!==undefined?r.blackTunnel.pixelFrom+(r.whiteTunnel.pixelTo-r.blackTunnel.pixelFrom)*point.t:r.astronautDrop.pixelFrom+r.astronautDrop.pixelCount*point.s;
        window.__lusionInspector.scrollManager.scrollToPixel(y,true);
        return y;
      },point);
      const y=await seek();await page.waitForTimeout(100);
      const data=await page.evaluate(y=>{
        // Same task: deterministic render immediately followed by readPixels, before
        // preserveDrawingBuffer=false permits the default framebuffer to be cleared.
        window.__lusionInspector.scrollManager.scrollToPixel(y,true);
        const canvas=document.querySelector('#home-goal canvas'),gl=canvas.getContext('webgl2');
        const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,bytes=new Uint8Array(w*h*4);
        const start=performance.now();gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
        let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
        return {w,h,pixels:btoa(binary),readbackMs:performance.now()-start,state:JSON.parse(JSON.stringify(window.__goalAstronautTelemetry)),glError:gl.getError()};
      },y);
      const name=`${width}-${point.t!==undefined?'blue-'+point.t:'glass-'+point.s}.png`;
      await sharp(Buffer.from(data.pixels,'base64'),{raw:{width:data.w,height:data.h,channels:4}}).flip().png().toFile(`${out}/${name}`);
      delete data.pixels;report.push({name,y,...data});
    }
    await context.close();
  }
  fs.writeFileSync(`${out}/report.json`,JSON.stringify(report,null,2));
  console.log(JSON.stringify({out,images:report.length,glErrors:report.map(r=>r.glError)}));
} finally {await browser.close();}
