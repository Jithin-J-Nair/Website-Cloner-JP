#!/usr/bin/env node
/** Diagnostic only: GL/DOM frame IDs, nonblocking fences, RAF dispatch, CPU profile and compositor trace.
 * Never changes application progress, scene transforms, renderer quality, or acceptance assertions.
 */
import fs from 'node:fs';
import path from 'node:path';
import { performance as hostClock } from 'node:perf_hooks';
import sharp from 'sharp';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const width = Number(process.env.PIPELINE_WIDTH || 1440), height = width < 820 ? 844 : 900;
const out = process.env.PIPELINE_OUT || `temp/root-cause/pipeline-${width}`;
fs.mkdirSync(out, { recursive: true });
const browser = await launchMotionBrowser();
try {
  const context = await browser.newContext({ viewport: { width, height } });
  await context.addInitScript(({ stamp, fences, drawTimers }) => {
    sessionStorage.setItem('lusion_booted_v1', '1');
    const data = window.__pipeline = { frames: [], calls: [], fences: [], callbacks: [], marks: [], pending: [], draws: [], programs: [], stamp, fenceEnabled: fences };
    const nativeRaf = window.requestAnimationFrame.bind(window);
    let active = null, bar;
    const pending = [];
    window.__pipelinePending = () => pending.map(({id,at,previous})=>({id,submittedAt:at,previousPoll:previous}));
    const names = ['compileShader','linkProgram','getProgramInfoLog','getShaderInfoLog','getProgramParameter','getShaderParameter','getActiveUniform','getActiveAttrib','getUniformLocation','getAttribLocation','getUniformBlockIndex','getActiveUniforms','getActiveUniformBlockParameter','bufferData','bufferSubData','texImage2D','texSubImage2D','drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced','clear','flush'];
    for (const name of names) {
      const proto = WebGL2RenderingContext.prototype, original = proto[name];
      if (!original) continue;
      proto[name] = function(...args) {
        const start = performance.now(); const result = Reflect.apply(original, this, args); const end = performance.now();
        if (this.canvas.closest('#home-goal')) {
          if (active) { const entry = active.gl[name] ||= { count: 0, ms: 0 }; entry.count++; entry.ms += end - start; }
          if (end - start > 5) data.calls.push({ name, start, end, count: window.__goalAstronautTelemetry?.renderCount });
        }
        return result;
      };
    }
    // Optional per-draw timer queries. Shader source and bindings are intercepted
    // at submission, never synchronously read back from the driver.
    const programData=new WeakMap(), shaderText=new WeakMap(), currentPrograms=new WeakMap();
    const drawPending=[], timerExtensions=new WeakMap();
    for (const name of ['shaderSource','attachShader','useProgram']) {
      const original=WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name]=function(...args) {
        if (name==='shaderSource') shaderText.set(args[0],args[1]);
        if (name==='attachShader') { let p=programData.get(args[0]);if(!p){p={id:data.programs.length,sources:[]};programData.set(args[0],p);data.programs.push(p);}p.sources.push(shaderText.get(args[1])); }
        if (name==='useProgram') currentPrograms.set(this,programData.get(args[0]));
        return Reflect.apply(original,this,args);
      };
    }
    if(drawTimers) for(const name of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']) {
      const original=WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name]=function(...args) {
        if(!this.canvas.closest('#home-goal')||drawPending.length>=128)return Reflect.apply(original,this,args);
        let ext=timerExtensions.get(this);if(ext===undefined){ext=this.getExtension('EXT_disjoint_timer_query_webgl2');timerExtensions.set(this,ext);}
        if(!ext)return Reflect.apply(original,this,args);
        const q=this.createQuery(),at=performance.now();this.beginQuery(ext.TIME_ELAPSED_EXT,q);
        const value=Reflect.apply(original,this,args);this.endQuery(ext.TIME_ELAPSED_EXT);
        drawPending.push({gl:this,q,ext,id:window.__goalAstronautTelemetry?.renderCount+1,at,name,args,program:currentPrograms.get(this)?.id});return value;
      };
    }
    const paintIds = (renderer, id) => {
      // Use Three's cached state API, not synchronous GL getters, and restore via
      // that same API so its state cache cannot disagree with the driver.
      const color = renderer.getClearColor({ copy(c) { Object.assign(this, c); return this; } });
      const alpha = renderer.getClearAlpha(), test = renderer.getScissorTest();
      const box = renderer.getScissor({ copy(v) { Object.assign(this, v); return this; } });
      const canvas = renderer.domElement, rect = canvas.getBoundingClientRect();
      const sx = canvas.width / rect.width / renderer.getPixelRatio();
      const sy = canvas.height / rect.height / renderer.getPixelRatio();
      const bits = '1010' + (id & 4095).toString(2).padStart(12,'0') + ((id^(id>>8)^0xa5)&255).toString(2).padStart(8,'0');
      renderer.setScissorTest(true);
      for (let i=0;i<bits.length;i++) {
        const x=Math.round(i*12*sx), right=Math.round((i+1)*12*sx);
        renderer.setScissor(x,Math.round((rect.height-172)*sy),right-x,Math.round(12*sy));
        renderer.setClearColor(bits[i]==='1'?0xffffff:0,1); renderer.clear(true,false,false);
      }
      renderer.setClearColor(color,alpha); renderer.setScissor(box.x,box.y,box.z,box.w); renderer.setScissorTest(test);
      if (!bar) {
        bar=document.createElement('div'); bar.id='diagnostic-dom-id';
        bar.style.cssText='position:fixed;top:176px;left:0;height:12px;display:flex;z-index:2147483647;pointer-events:none';
        document.body.appendChild(bar);
      }
      bar.replaceChildren(...[...bits].map(b=>{const el=document.createElement('i');el.style.cssText=`display:block;width:12px;height:12px;background:${b==='1'?'white':'black'}`;return el;}));
    };
    window.__goalPipelineProbe = (renderer, observation) => {
      const t=window.__goalAstronautTelemetry;
      data.marks.push({ id:t.renderCount,...observation });
      if (stamp) paintIds(renderer,t.renderCount);
    };
    const poll = () => {
      if(drawPending.length && drawPending[0].gl.getQueryParameter(drawPending[0].q,drawPending[0].gl.QUERY_RESULT_AVAILABLE)) {
        const gl=drawPending[0].gl, ext=drawPending[0].ext;
        const disjoint=gl.getParameter(ext.GPU_DISJOINT_EXT);
        while(drawPending.length && drawPending[0].gl.getQueryParameter(drawPending[0].q,drawPending[0].gl.QUERY_RESULT_AVAILABLE)) {
          const d=drawPending.shift(),ns=d.gl.getQueryParameter(d.q,d.gl.QUERY_RESULT);
          data.draws.push({id:d.id,at:d.at,observedAt:performance.now(),name:d.name,args:d.args,program:d.program,gpuMs:ns/1e6,disjoint});d.gl.deleteQuery(d.q);
        }
      }
      for (let i = pending.length - 1; i >= 0; i--) {
        const item = pending[i], start = performance.now();
        const status = item.gl.clientWaitSync(item.sync, 0, 0); const at = performance.now();
        if (status === item.gl.ALREADY_SIGNALED || status === item.gl.CONDITION_SATISFIED || status === item.gl.WAIT_FAILED) {
          data.fences.push({ id: item.id, submittedAt: item.at, observedAt: at, previousPoll: item.previous, status, pollMs: at-start });
          item.gl.deleteSync(item.sync); pending.splice(i,1);
        } else item.previous = at;
      }
    };
    setInterval(poll, 50);
    window.requestAnimationFrame = cb => nativeRaf(timestamp => {
      const t = window.__goalAstronautTelemetry, before = t?.renderCount;
      const entry = { rafTimestamp: timestamp, start: performance.now(), gl: {} }; active = entry;
      try { cb(timestamp); } finally {
        active = null; entry.end = performance.now();
        if (t && before !== t.renderCount) {
          const canvas = document.querySelector('#home-goal canvas'), gl = canvas?.getContext('webgl2');
          Object.assign(entry, { id: t.renderCount, playback: { ...t.playback }, scene: JSON.parse(JSON.stringify(t.sceneState)), resources: { ...t.resources }, cpu: t.lastFrameMs, rect: canvas?.getBoundingClientRect().toJSON(), buffer: gl ? [gl.drawingBufferWidth,gl.drawingBufferHeight] : null });
          if (gl && fences && pending.length < 8) {
            const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0); gl.flush();
            if (sync) pending.push({ gl, sync, id: entry.id, at: performance.now(), previous: null });
          }
          entry.instrumentationEnd = performance.now();
          data.frames.push(entry);
          performance.mark(`goal-submit-${entry.id}`, { detail: { progress: t.playback.progress, g: t.sceneState.shatterProgress } });
        }
      }
    });
  }, { stamp: process.env.PIPELINE_STAMP !== '0', fences: process.env.PIPELINE_FENCES !== '0', drawTimers: process.env.PIPELINE_DRAW_TIMERS === '1' });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const cdp = await context.newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Profiler.enable');
  await cdp.send('Profiler.setSamplingInterval', { interval: 1000 });
  await cdp.send('Profiler.start');
  await cdp.send('Tracing.start', { categories: 'blink.user_timing,devtools.timeline,cc,gpu,viz,benchmark,disabled-by-default-devtools.timeline.frame', transferMode: 'ReturnAsStream' });
  await page.goto(process.env.BASE_URL || 'http://127.0.0.1:3000', { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForFunction(() => window.__goalAstronautTelemetry?.glbLoaded, null, { timeout: 120000 });
  const device = await page.evaluate(() => { const c = document.querySelector('#home-goal canvas'), gl = c.getContext('webgl2'), ext = gl.getExtension('WEBGL_debug_renderer_info'); return { userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,dpr:devicePixelRatio,renderer:gl.getParameter(ext.UNMASKED_RENDERER_WEBGL),context:gl.getContextAttributes(),timeOrigin:performance.timeOrigin }; });
  const captures = [];
  let firstFrame;const initialFrame=new Promise(resolve=>{firstFrame=resolve;});
  cdp.on('Page.screencastFrame', async e => {
    const file = `frame-${String(captures.length).padStart(4,'0')}.jpg`;
    const receivedHostMs = hostClock.now();
    captures.push({ file, metadata: e.metadata, receivedHostMs });
    firstFrame();
    fs.writeFileSync(path.join(out,file),Buffer.from(e.data,'base64'));
    await cdp.send('Page.screencastFrameAck',{sessionId:e.sessionId});
  });
  const runs = [];
  for (let run = 0; run < Number(process.env.PIPELINE_RUNS || 2); run++) {
    await page.evaluate(() => window.scrollTo(0,window.__goalAstronautTelemetry.scrollForEmergence(.2)));
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state==='armed');
    if (run===0) { await cdp.send('Page.startScreencast', { format:'jpeg',quality:90,maxWidth:width,maxHeight:height,everyNthFrame:1 });
      let timer;try{if(process.env.PIPELINE_FIRST_FRAME_WAIT!=='0')await Promise.race([initialFrame,new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('No initial screencast frame')),30000);})]);}finally{clearTimeout(timer);}
    }
    const start = await page.evaluate(() => { const at=performance.now();performance.mark('native-start');window.scrollTo(0,window.__goalAstronautTelemetry.playback.activation+2);return at; });
    await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state==='completed',null,{timeout:180000});
    const end = await page.evaluate(() => performance.now());
    await page.waitForTimeout(Number(process.env.PIPELINE_TAIL || 12000));
    runs.push({ run, start, end });
    if (run + 1 < Number(process.env.PIPELINE_RUNS || 2)) {
      await page.evaluate(() => window.scrollTo(0,window.__goalAstronautTelemetry.scrollForEmergence(0)-innerHeight*.3));
      await page.waitForFunction(() => window.__goalAstronautTelemetry.playback.state==='armed');
    }
  }
  await cdp.send('Page.stopScreencast');
  const data = await page.evaluate(() => ({...window.__pipeline,pending:window.__pipelinePending()}));
  const profile = await cdp.send('Profiler.stop'); fs.writeFileSync(out+'/cpu-profile.json',JSON.stringify(profile.profile));
  const completed = new Promise(resolve => cdp.once('Tracing.tracingComplete',resolve));
  await cdp.send('Tracing.end'); const { stream } = await completed;
  const fd = fs.openSync(out+'/trace.json','w');
  for (;;) { const v=await cdp.send('IO.read',{handle:stream});fs.writeSync(fd,v.base64Encoded?Buffer.from(v.data,'base64'):v.data);if(v.eof)break; }
  fs.closeSync(fd); await cdp.send('IO.close',{handle:stream});
  // Decode image IDs independently from telemetry; invalid/covered codes remain null.
  for (const capture of captures) {
    const {data: pixels,info} = await sharp(path.join(out,capture.file)).removeAlpha().raw().toBuffer({resolveWithObject:true});
    const decode = (x,y,step) => { let bits='';for(let i=0;i<24;i++){const k=(Math.round(y)*info.width+Math.round(x+(i+.5)*step))*info.channels;const v=pixels[k];if(v===undefined||(v>70&&v<185))return null;bits+=v>128?'1':'0';}if(!bits.startsWith('1010'))return null;const id=parseInt(bits.slice(4,16),2),check=parseInt(bits.slice(16),2);return check===((id^(id>>8)^0xa5)&255)?id:null; };
    const latest = data.frames.filter(f=>f.rect?.width>0).at(-1);
    const scale = info.width/width;
    capture.domId = decode(0,182*scale,12*scale);
    const stableRect=latest&&data.frames.every(f=>f.rect?.x===latest.rect.x&&f.rect?.y===latest.rect.y&&f.rect?.width===latest.rect.width&&f.rect?.height===latest.rect.height);
    capture.glId = stableRect ? decode(Math.max(0,latest.rect.x)*scale,(Math.max(0,latest.rect.y)+166)*scale,12*scale) : null;
    capture.pageCaptureMs = capture.metadata.timestamp*1000-device.timeOrigin;
  }
  fs.writeFileSync(out+'/report.json', JSON.stringify({ device,runs,errors,...data,captures },null,2));
  console.log(JSON.stringify({out,runs,errors,frames:data.frames.length,fences:data.fences.length,captures:captures.length,decoded:captures.filter(c=>c.glId!==null).length}));
} finally { await browser.close(); }
