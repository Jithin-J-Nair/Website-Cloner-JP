#!/usr/bin/env node
/** Isolated production-scene draw scopes. Diagnostic ablations are NEVER acceptance runs.
 * The app is told it is hidden to stop ambient RAFs, then its existing inspector renders
 * one unchanged state at a time. A fence is polled without blocking. Optional readback
 * happens in separate parity captures, never in the production animation loop.
 */
import fs from 'node:fs';
import os from 'node:os';
import { launchMotionBrowser } from './lib/browser-runtime.mjs';
const out=process.env.ISOLATE_OUT||'temp/gpu-isolation/current';
fs.mkdirSync(out,{recursive:true});
const width=Number(process.env.ISOLATE_WIDTH||1440),height=width<820?844:900;
const variants=(process.env.ISOLATE_VARIANTS||'baseline,discard').split(',');
const repeats=Number(process.env.ISOLATE_REPEATS||3);
const allowed=new Set(['baseline','discard','depth','wall-first','color-off','atlas-aniso1','atlas-1px']);
if(!['blue','all'].includes(process.env.ISOLATE_TARGET||'blue'))throw new Error('ISOLATE_TARGET must be blue or all');
if(!variants.length||variants.some(v=>!allowed.has(v)))throw new Error('Unknown diagnostic variant');
if(!Number.isInteger(repeats)||repeats<1)throw new Error('ISOLATE_REPEATS must be a positive integer');
const browser=await launchMotionBrowser();
try {
  const context=await browser.newContext({viewport:{width,height},reducedMotion:'no-preference'});
  await context.addInitScript(({target,noMsaa,captureControl})=>{
    sessionStorage.setItem('lusion_booted_v1','1');
    if(noMsaa){
      const get=HTMLCanvasElement.prototype.getContext;
      HTMLCanvasElement.prototype.getContext=function(type,attrs){
        return Reflect.apply(get,this,[type,type==='webgl2'&&attrs?.antialias&&attrs?.stencil?{...attrs,antialias:false}:attrs]);
      };
    }
    const d=window.__isolate={frames:[],sourceFrames:[],inventory:{},variant:'baseline',current:null,resources:[],installed:false};
    let renderer,originalRender,direct,gl,ext,scope=null;
    const depths=new Map(),textureVariants=new Map();let deferredBase=null;
    const uploads=['bufferData','bufferSubData','texImage2D','texSubImage2D','texImage3D','texSubImage3D'];
    const methods=[...uploads,'createTexture','deleteTexture','createBuffer','deleteBuffer','compileShader','linkProgram','getProgramInfoLog','getShaderInfoLog','getProgramParameter','getShaderParameter'];
    for(const name of methods){
      const original=WebGL2RenderingContext.prototype[name];if(!original)continue;
      WebGL2RenderingContext.prototype[name]=function(...args){
        const start=performance.now(),value=Reflect.apply(original,this,args),end=performance.now();
        if(d.current&&this===gl){
          const e={name,start,end};
          if(uploads.includes(name))e.args=args.map(a=>ArrayBuffer.isView(a)?{bytes:a.byteLength}:typeof a==='number'?a:a?.width?{width:a.width,height:a.height,src:a.currentSrc||a.src}:typeof a);
          d.current.calls.push(e);
        }
        return value;
      };
    }
    for(const name of ['drawElements','drawArrays','drawElementsInstanced','drawArraysInstanced']){
      const original=WebGL2RenderingContext.prototype[name];
      WebGL2RenderingContext.prototype[name]=function(...args){
        if(this!==gl)return Reflect.apply(original,this,args);
        const discard=d.variant==='discard'&&(target==='all'||scope?.blue);
        if(!d.current){
          if(discard)gl.enable(gl.RASTERIZER_DISCARD);
          try{return Reflect.apply(original,this,args);}finally{if(discard)gl.disable(gl.RASTERIZER_DISCARD);}
        }
        const q=ext?gl.createQuery():null;
        if(q)gl.beginQuery(ext.TIME_ELAPSED_EXT,q);
        if(discard)gl.enable(gl.RASTERIZER_DISCARD);
        const start=performance.now();let value;
        try{value=Reflect.apply(original,this,args);}finally{if(discard)gl.disable(gl.RASTERIZER_DISCARD);if(q)gl.endQuery(ext.TIME_ELAPSED_EXT);}
        d.current.draws.push({name,args,...scope,cpuMs:performance.now()-start,q});
        return value;
      };
    }
    const describe=(material,object,geometry)=>{
      const id=object.uuid+':'+material.uuid;
      if(!d.inventory[id]){
        const textures={};
        for(const key of Object.keys(material)){
          const t=material[key];if(t?.isTexture)textures[key]={uuid:t.uuid,width:t.image?.width,height:t.image?.height,type:t.type,format:t.format,renderTargetTexture:t.isRenderTargetTexture,faces:Array.isArray(t.image)?t.image.map(i=>({width:i.width,height:i.height})):undefined,colorSpace:t.colorSpace,anisotropy:t.anisotropy,generateMipmaps:t.generateMipmaps,src:t.image?.currentSrc||t.image?.src};
        }
        for(const [key,u] of Object.entries(material.uniforms||{}))if(u.value?.isTexture){const t=u.value;textures[key]={uuid:t.uuid,width:t.image?.width,height:t.image?.height,type:t.type,format:t.format,renderTargetTexture:t.isRenderTargetTexture,faces:Array.isArray(t.image)?t.image.map(i=>({width:i.width,height:i.height})):undefined,anisotropy:t.anisotropy};}
        d.inventory[id]={object:object.name,parent:object.parent?.name,material:material.type,name:material.name,transparent:material.transparent,opacity:material.opacity,side:material.side,depthWrite:material.depthWrite,colorWrite:material.colorWrite,blending:material.blending,instances:object.count,vertices:geometry.attributes.position?.count,indices:geometry.index?.count,textures};
      }
      return id;
    };
    window.__goalPipelineProbe=(r,observation)=>{
      const id=window.__goalAstronautTelemetry.renderCount;
      d.sourceFrames.push({id,...observation});
      if(captureControl){
        const c=r.getClearColor({copy(v){Object.assign(this,v);return this;}}),alpha=r.getClearAlpha(),test=r.getScissorTest();
        const box=r.getScissor({copy(v){Object.assign(this,v);return this;}}),canvas=r.domElement,rect=canvas.getBoundingClientRect();
        const sx=canvas.width/rect.width/r.getPixelRatio(),sy=canvas.height/rect.height/r.getPixelRatio();
        const bits='1010'+(id&4095).toString(2).padStart(12,'0')+((id^(id>>8)^0xa5)&255).toString(2).padStart(8,'0');
        r.setScissorTest(true);
        for(let i=0;i<bits.length;i++){const x=Math.round(i*12*sx);r.setScissor(x,Math.round((rect.height-172)*sy),Math.round((i+1)*12*sx)-x,Math.round(12*sy));r.setClearColor(bits[i]==='1'?0xffffff:0,1);r.clear(true,false,false);}
        r.setClearColor(c,alpha);r.setScissor(box.x,box.y,box.z,box.w);r.setScissorTest(test);
      }
      if(d.installed)return;
      renderer=r;gl=r.getContext();ext=gl.getExtension('EXT_disjoint_timer_query_webgl2');
      originalRender=r.render.bind(r);direct=r.renderBufferDirect.bind(r);
      r.renderBufferDirect=(camera,scene,geometry,material,object,group)=>{
        const blue=object.isInstancedMesh&&object.parent?.name==='CapturedBlueCorridor'&&material.isMeshBasicMaterial;
        const id=describe(material,object,geometry);
        if(blue&&['atlas-aniso1','atlas-1px'].includes(d.variant)){
          const map=material.map,image=map.image,key=map.uuid+':'+d.variant;let texture=textureVariants.get(key);
          if(!texture){
            texture=map.clone();
            // Texture.clone() shares Source. Keep the diagnostic texture's image and
            // GPU cache identity independent; otherwise a 1px image can poison baseline.
            texture.source=new map.source.constructor(map.image);
            if(d.variant==='atlas-aniso1')texture.anisotropy=1;
            else {const c=document.createElement('canvas');c.width=c.height=1;const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,1,1);texture.image=c;}
            texture.needsUpdate=true;textureVariants.set(key,texture);
          }
          material.map=texture;scope={id,blue:true,pass:d.variant};
          try{return direct(camera,scene,geometry,material,object,group);}finally{material.map=map;scope=null;if(map.image!==image)throw new Error('Diagnostic atlas changed baseline Source');}
        }
        if(blue&&d.variant==='wall-first'){
          if(geometry.index.count===252){if(deferredBase)throw new Error('Duplicate deferred base');deferredBase={camera,scene,geometry,material,object,group,id};return;}
          if(geometry.index.count!==17430||!deferredBase)throw new Error('Unexpected blue draw order/geometry');
          scope={id,blue:true,pass:'color-wall-first'};direct(camera,scene,geometry,material,object,group);
          const b=deferredBase;deferredBase=null;scope={id:b.id,blue:true,pass:'color-base-last'};
          try{return direct(b.camera,b.scene,b.geometry,b.material,b.object,b.group);}finally{scope=null;}
        }
        if(blue&&d.variant==='color-off'){
          const write=material.colorWrite;material.colorWrite=false;scope={id,blue:true,pass:'color-masked'};
          try{return direct(camera,scene,geometry,material,object,group);}finally{material.colorWrite=write;scope=null;}
        }
        if(blue&&d.variant==='depth'){
          let depth=depths.get(material);
          if(!depth){depth=material.clone();depth.map=null;depth.colorWrite=false;depth.name='DiagnosticOpaqueDepthPrepass';depths.set(material,depth);}
          for(const key of ['stencilWrite','stencilFunc','stencilRef','stencilFuncMask','stencilWriteMask','stencilFail','stencilZFail','stencilZPass'])depth[key]=material[key];
          scope={id,blue:true,pass:'depth'};direct(camera,scene,geometry,depth,object,group);
        }
        scope={id,blue:!!blue,pass:'color'};try{return direct(camera,scene,geometry,material,object,group);}finally{scope=null;}
      };
      r.render=(...args)=>{
        if(!d.current)return originalRender(...args);
        const target=r.getRenderTarget(),pass={start:performance.now(),target:target?{uuid:target.uuid,width:target.width,height:target.height,samples:target.samples,type:target.texture.type}:null};
        d.current.renderPasses.push(pass);d.current.renderStartedAt??=pass.start;
        const v=originalRender(...args);pass.submittedAt=performance.now();d.current.submittedAt=pass.submittedAt;
        if(deferredBase)throw new Error('Unconsumed blue draw');return v;
      };
      d.installed=true;
    };
    window.__isolateMeasure=async(point,variant,sample)=>{
      const ranges=window.__lusionInspector.homeGoalSectionRanges.items;
      const t=window.__goalAstronautTelemetry;
      const y=point.s!==undefined?ranges.astronautDrop.pixelFrom+ranges.astronautDrop.pixelCount*point.s:point.t!==undefined?ranges.blackTunnel.pixelFrom+(ranges.whiteTunnel.pixelTo-ranges.blackTunnel.pixelFrom)*point.t:t.scrollForEmergence(point.e);
      d.variant=variant;
      const frame={point,variant,sample,start:performance.now(),calls:[],draws:[],renderPasses:[]};d.current=frame;
      window.__lusionInspector.scrollManager.scrollToPixel(y,true);
      frame.callbackEnd=performance.now();frame.sourceId=d.sourceFrames.at(-1)?.id;d.current=null;
      const sync=gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE,0);gl.flush();frame.fenceInsertedAt=performance.now();
      await new Promise((resolve,reject)=>{
        const poll=()=>{
          const status=gl.clientWaitSync(sync,0,0),at=performance.now();
          if(status===gl.WAIT_FAILED){gl.deleteSync(sync);reject(new Error('Fence WAIT_FAILED'));return;}
          if(status===gl.ALREADY_SIGNALED||status===gl.CONDITION_SATISFIED){frame.fenceObservedAt=at;gl.deleteSync(sync);resolve();return;}
          frame.previousFencePoll=at;
          if(at-frame.start>60000){gl.deleteSync(sync);reject(new Error('Fence timed out'));return;}
          setTimeout(poll,10);
        };setTimeout(poll,0);
      });
      if(ext){
        frame.disjoint=gl.getParameter(ext.GPU_DISJOINT_EXT);
        for(const draw of frame.draws){
          if(draw.q){
            if(!gl.getQueryParameter(draw.q,gl.QUERY_RESULT_AVAILABLE))throw new Error('Query unavailable after fence');
            draw.gpuMs=gl.getQueryParameter(draw.q,gl.QUERY_RESULT)/1e6;gl.deleteQuery(draw.q);delete draw.q;
          }
        }
      }
      frame.sourceIdAtCompletion=d.sourceFrames.at(-1)?.id;frame.state=JSON.parse(JSON.stringify(t));frame.buffer=[gl.drawingBufferWidth,gl.drawingBufferHeight];frame.error=gl.getError();
      frame.resourceCounts={...renderer.info.memory,programs:renderer.info.programs.length};
      d.frames.push(frame);return frame;
    };
    window.__isolateReadback=(point,variant)=>{
      d.variant=variant;const r=window.__lusionInspector.homeGoalSectionRanges.items;
      const y=point.s!==undefined?r.astronautDrop.pixelFrom+r.astronautDrop.pixelCount*point.s:r.blackTunnel.pixelFrom+(r.whiteTunnel.pixelTo-r.blackTunnel.pixelFrom)*point.t;
      window.__lusionInspector.scrollManager.scrollToPixel(y,true);
      const w=gl.drawingBufferWidth,h=gl.drawingBufferHeight,bytes=new Uint8Array(w*h*4);
      gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,bytes);
      let binary='';for(let i=0;i<bytes.length;i+=32768)binary+=String.fromCharCode(...bytes.subarray(i,i+32768));
      return {w,h,pixels:btoa(binary),error:gl.getError(),state:JSON.parse(JSON.stringify(window.__goalAstronautTelemetry.sceneState))};
    };
  },{target:process.env.ISOLATE_TARGET||'blue',noMsaa:process.env.ISOLATE_NO_MSAA==='1',captureControl:process.env.ISOLATE_CAPTURE_CONTROL==='1'});
  const page=await context.newPage(),errors=[],consoleMessages=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(['warning','error'].includes(m.type()))consoleMessages.push({type:m.type(),text:m.text()});});
  const sys=await browser.newBrowserCDPSession();
  await page.goto(process.env.BASE_URL||'http://127.0.0.1:3000',{waitUntil:'networkidle',timeout:120000});
  await page.waitForFunction(()=>window.__goalAstronautTelemetry?.glbLoaded,null,{timeout:90000});
  await page.evaluate(()=>window.__lusionInspector.scrollManager.scrollToPixel(window.__goalAstronautTelemetry.scrollForEmergence(.2),true));
  await page.waitForFunction(()=>window.__isolate.installed);
  const device=await page.evaluate(()=>{
    const gl=document.querySelector('#home-goal canvas').getContext('webgl2'),e=gl.getExtension('WEBGL_debug_renderer_info');
    Object.defineProperty(document,'visibilityState',{configurable:true,get:()=> 'hidden'});document.dispatchEvent(new Event('visibilitychange'));
    return {userAgent:navigator.userAgent,cores:navigator.hardwareConcurrency,dpr:devicePixelRatio,timeOrigin:performance.timeOrigin,renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):null,vendor:e?gl.getParameter(e.UNMASKED_VENDOR_WEBGL):null,version:gl.getParameter(gl.VERSION),glsl:gl.getParameter(gl.SHADING_LANGUAGE_VERSION),context:gl.getContextAttributes(),timer:!!gl.getExtension('EXT_disjoint_timer_query_webgl2'),samples:gl.getParameter(gl.SAMPLES)};
  });
  const system=await sys.send('SystemInfo.getInfo');
  const availablePoints=[{name:'solar-wide',e:.35},{name:'white-transition',t:.822},{name:'solar',e:.8},{name:'tesseract',t:.36},{name:'blue-entry',t:.865},{name:'blue',t:.94},{name:'glass',s:.18},{name:'fracture',s:.55},{name:'shatter-exit',s:.85}];
  const names=process.env.ISOLATE_POINTS?.split(',');
  if(names?.some(n=>!availablePoints.some(p=>p.name===n)))throw new Error('Unknown diagnostic point');
  const points=names?names.map(n=>availablePoints.find(p=>p.name===n)):availablePoints;
  const captures=[];
  for(const point of points){
    for(const variant of variants)await page.evaluate(([p,v])=>window.__isolateMeasure(p,v,{warmup:true}),[point,variant]);
    for(let repeat=0;repeat<repeats;repeat++)for(let j=0;j<variants.length;j++){
      const variant=variants[(j+repeat)%variants.length];
      const f=await page.evaluate(([p,v,n])=>window.__isolateMeasure(p,v,{warmup:false,repeat:n}),[point,variant,repeat]);
      console.log(JSON.stringify({phase:point.name,variant,repeat,cpu:f.callbackEnd-f.start,fence:f.fenceObservedAt-f.fenceInsertedAt,gpu:f.draws.every(d=>Number.isFinite(d.gpuMs))?f.draws.reduce((n,d)=>n+d.gpuMs,0):null}));
    }
    if(process.env.ISOLATE_CAPTURE_CONTROL==='1'){
      const before=await page.evaluate(()=>({at:performance.now(),id:window.__isolate.sourceFrames.at(-1)?.id,rect:document.querySelector('#home-goal canvas').getBoundingClientRect().toJSON()}));
      const file=point.name+'-compositor.png';await page.screenshot({path:out+'/'+file});
      const after=await page.evaluate(()=>({at:performance.now(),id:window.__isolate.sourceFrames.at(-1)?.id}));
      const sharp=(await import('sharp')).default,{data,info}=await sharp(out+'/'+file).removeAlpha().raw().toBuffer({resolveWithObject:true});
      let bits='';for(let i=0;i<24;i++){const k=(Math.round(before.rect.y+166)*info.width+Math.round(before.rect.x+(i+.5)*12))*info.channels;const v=data[k];bits+=v>185?'1':v<70?'0':'?';}
      const id=parseInt(bits.slice(4,16),2),check=parseInt(bits.slice(16),2),decoded=bits.startsWith('1010')&&!bits.includes('?')&&check===((id^(id>>8)^0xa5)&255)?id:null;
      captures.push({point,file,before,after,decoded});
    }
  }
  if(process.env.ISOLATE_PARITY==='1'){
    const sharp=(await import('sharp')).default;
    for(const point of points.filter(p=>p.t>=.86||p.s!==undefined))for(const variant of variants){
      const r=await page.evaluate(([p,v])=>window.__isolateReadback(p,v),[point,variant]);
      await sharp(Buffer.from(r.pixels,'base64'),{raw:{width:r.w,height:r.h,channels:4}}).flip().png().toFile(`${out}/${point.name}-${variant}.png`);
    }
  }
  const data=await page.evaluate(()=>{const d=window.__isolate;return {frames:d.frames,sourceFrames:d.sourceFrames,inventory:d.inventory};});
  fs.writeFileSync(`${out}/report.json`,JSON.stringify({configuration:{width,height,repeats,variants,points,target:process.env.ISOLATE_TARGET||'blue',noMsaa:process.env.ISOLATE_NO_MSAA==='1',captureControl:process.env.ISOLATE_CAPTURE_CONTROL==='1',ambientGoalRafStopped:true,autonomous:false,scissor:'unchanged',renderQuality:'Baseline uses production quality; discard/color-off/atlas/no-MSAA are output-changing ablations, not corrections; depth/order candidates require independent parity'},os:{platform:os.platform(),release:os.release(),arch:os.arch()},device,system,errors,consoleMessages,captures,...data},null,2));
  if(errors.length||consoleMessages.some(m=>m.type==='error')||data.frames.some(f=>f.error||f.disjoint||f.sourceId!==f.sourceIdAtCompletion)||captures.some(c=>c.decoded!==c.before.id||c.before.id!==c.after.id))throw new Error('Diagnostic validity failure; see saved report');
}finally{await browser.close();}
