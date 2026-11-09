import { registerProjectListSource } from "@/lib/project-transition";
import * as THREE from "three";
import { LUSION_PROJECTS_ARCHIVE } from "@/data/reference";
import { homeRenderDpr } from "@/lib/home-motion";
import { editorialClamp as clamp, editorialFit as fit, editorialEase as ease, editorialExpoOut as expoOut, editorialExpoInOut as expoInOut, createEditorialSpring, stepEditorialSpring } from "@/lib/home-editorial-motion";
import { editorialProjectVertex, editorialProjectFragment } from "@/components/home/HomeEditorialShaders";
import { useStudioStore } from "@/lib/store";

/** Projects owns one viewport depth compositor and one archive/type clock.
 * Native ProjectItemList behavior; never writes to Home, About or the CTA. */
export function createProjectsArchiveMotion(root: HTMLElement, reduced: boolean) {
  const section=root.querySelector<HTMLElement>("#projects-main")!;
  const heading=[...root.querySelectorAll<HTMLElement>("[data-project-heading-char]")];
  const count=[...root.querySelectorAll<HTMLElement>("[data-project-count-char]")];
  const arrow=root.querySelector<SVGElement>("#projects-arrow")!;
  const blocked=()=>{const s=useStudioStore.getState();return s.menuOpen||s.reelOpen||s.isTransitioning;};
  type Box = { left: number; top: number; width: number; height: number };
  const boxes = new Map<HTMLElement,Box>();
  const cardStates = [...root.querySelectorAll<HTMLAnchorElement>(".project-item")].map((el,index) => ({
    el,index, stage:el.querySelector<HTMLElement>(".project-item-main")!, category:el.querySelector<HTMLElement>(".project-item-line-1")!, strips:[...el.querySelectorAll<HTMLElement>(".project-title-strip")],
    title:el.querySelector<HTMLElement>(".project-item-line-2-inner")!, icon:el.querySelector<HTMLElement>(".project-item-line-2-icon")!, text:el.dataset.categories||"",
    time:0, hover:0, metaHover:0, focusX:createEditorialSpring(0), focusY:createEditorialSpring(0), focusZ:createEditorialSpring(-1), zoom:createEditorialSpring(1), dof:0,
    shiftX:0, shiftY:0, shiftTargetX:0, shiftTargetY:0, hoverBand:0,
    loading:false, failed:false, mesh:null as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>|null,
    width:1,height:1,
  }));
  const canvas=document.createElement("canvas");canvas.id="projects-depth-canvas";canvas.setAttribute("aria-hidden","true");root.append(canvas);
  const unregisterProjectSource = registerProjectListSource(root,canvas,cardStates);
  let renderer:THREE.WebGLRenderer|null=null,disposed=false,failed=false,raf=0,dirty=true,last=0,frames=0,pointerX=0,pointerY=0,mousePointer=true;
  let titleTime=0;
  const noiseTexture=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1);noiseTexture.needsUpdate=true;
  const noiseUniforms={u_blueNoiseTexture:{value:noiseTexture as THREE.Texture},u_blueNoiseCoordOffset:{value:new THREE.Vector2()}};
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0,1,0,-1,-100,100), textures = new Set<THREE.Texture>(), materials = new Set<THREE.ShaderMaterial>(), geometries = new Set<THREE.BufferGeometry>();
  textures.add(noiseTexture);
  const cleanupListeners: (()=>void)[]=[];
  const listen = (target: EventTarget, type: string, callback: EventListener, options?: AddEventListenerOptions) => { target.addEventListener(type,callback,options); cleanupListeners.push(()=>target.removeEventListener(type,callback)); };
  const plane = (segments=1) => { const g=new THREE.PlaneGeometry(1,1,segments,segments).translate(.5,.5,0); geometries.add(g); return g; };
  const material = (vertexShader:string,fragmentShader:string,uniforms:Record<string,THREE.IUniform>,defines:Record<string,number>={}) => {
    const m=new THREE.ShaderMaterial({ vertexShader,fragmentShader,uniforms:{...noiseUniforms,...uniforms},defines,transparent:true,depthTest:false,depthWrite:false,side:THREE.DoubleSide }); materials.add(m);return m;
  };
  const rect = (el: HTMLElement): Box => boxes.get(el) ?? {left:0,top:0,width:1,height:1};
  const visible = (el: HTMLElement,y:number,vh:number,extra=0) => {const r=rect(el);return r.top-y<vh+extra && r.top+r.height-y>-extra;};
  const schedule = () => { if (!disposed && !raf && !document.hidden) raf=requestAnimationFrame(frame); };
  const loadTexture = (url:string) => new Promise<THREE.Texture>((resolve,reject)=>new THREE.TextureLoader().load(url,t=>{ if(disposed){t.dispose();reject(new Error("Disposed"));return;}textures.add(t);t.colorSpace=THREE.NoColorSpace;resolve(t);},undefined,reject));
  const resetFallback = () => { delete root.dataset.editorialWebgl; for(const c of cardStates) delete c.stage.dataset.depthReady; };
  const initRenderer = () => {
    if(renderer || failed) return;
    try { renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:"low-power"}); renderer.setClearColor(0,0); renderer.outputColorSpace=THREE.SRGBColorSpace; }
    catch { failed=true;root.dataset.editorialWebgl="fallback"; return; }
    void loadTexture("/assets/textures/LDR_RGB1_0.png").then(texture=>{texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;noiseUniforms.u_blueNoiseTexture.value=texture;texture.needsUpdate=true;schedule();}).catch(()=>{});
    dirty=true;
  };
  const loadCard = (c:typeof cardStates[number]) => {
    if(c.loading || c.failed || !renderer || failed)return;c.loading=true;
    const project=LUSION_PROJECTS_ARCHIVE.projects[c.index];
    void Promise.all([loadTexture(project.thumbnail),loadTexture(project.depthMap)]).then(([image,depth])=>{
      if(disposed)return;
      c.mesh=new THREE.Mesh(plane(),material(editorialProjectVertex,editorialProjectFragment,{
        u_domXY:{value:new THREE.Vector2()},u_domWH:{value:new THREE.Vector2()},u_rotation:{value:0},u_padding:{value:new THREE.Vector2(c.index%2?0:1000,c.index%2?1000:0)},u_texture:{value:image},u_depthTexture:{value:depth},u_textureSize:{value:new THREE.Vector2(project.thumbnailWidth,project.thumbnailHeight)},u_colorBg:{value:new THREE.Color(project.colorBg)},u_showRatio:{value:0},u_activeRatio:{value:0},u_shiftXY:{value:new THREE.Vector2()},u_focusPos:{value:new THREE.Vector3(0,0,-1)},u_time:{value:0},u_zoomRatio:{value:1},u_dofRangeOffset:{value:0},u_saturation:{value:0},u_brightness:{value:0},u_borderRatio:{value:0},u_rippleStrength:{value:0},u_resolution:{value:new THREE.Vector2()},u_globalRadius:{value:12},
      },{PARALLAX_SAMPLES:12,BLUR_SAMPLES:6}));c.mesh.frustumCulled=false;c.mesh.renderOrder=3;scene.add(c.mesh);schedule();
    }).catch(()=>{if(disposed)return;c.failed=true;c.stage.dataset.depthFailed="true";schedule();});
  };
  let borderRadius=15;
  const measure=()=>{
    const vw=innerWidth,vh=innerHeight;
    borderRadius=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--global-border-radius"))||15;
    for(const el of [section,...cardStates.flatMap(c=>[c.el,c.stage])]) {const r=el.getBoundingClientRect();boxes.set(el,{left:r.left,top:r.top+scrollY,width:r.width,height:r.height});}
    if(renderer){renderer.setPixelRatio(homeRenderDpr(vw,vh,devicePixelRatio));renderer.setSize(vw,vh,false);}
    camera.right=vw;camera.bottom=-vh;camera.updateProjectionMatrix();dirty=false;
  };
  let lastY=scrollY,scrollStrength=0;
  function frame(now:number){
    raf=0;if(disposed||document.hidden||blocked()){last=0;return;}
    const dt=last?Math.min(.05,Math.max(0,(now-last)/1000)):1/60;last=now;
    if(dirty)measure();
    const vw=innerWidth,vh=innerHeight,y=scrollY,narrow=vw<=812;
    const active=visible(section,y,vh);
    noiseUniforms.u_blueNoiseCoordOffset.value.set(reduced?0:(frames*.754877666)%1,reduced?0:(frames*.569840296)%1);
    scrollStrength=Math.min(1,(scrollStrength+Math.abs(y-lastY)/Math.max(1,vh))*Math.exp(-10*dt));lastY=y;
    if(active&&!renderer&&!failed){initRenderer();if(dirty)measure();}
    if(active)titleTime+=dt;
    heading.forEach((letter,i)=>{const p=reduced||narrow?1:ease(clamp(titleTime*1.5-i/20-.2));letter.style.transform=`translateY(${100*(1-p)}%) rotate(${30*(1-p)}deg)`;});
    count.forEach((letter,i)=>{const p=reduced||narrow?1:ease(clamp(titleTime-i/20-.5));letter.style.transform=`translateY(${100*(1-p)}%)`;});
    const t=clamp(titleTime-.6),elastic=t===0||t===1?t:2**(-10*t)*Math.sin((t*10-.75)*(2*Math.PI/3))+1;
    arrow.style.transform=`scale(${reduced||narrow?1:elastic})`;
    let drawn=0;
    for(const c of cardStates){
      const r=rect(c.stage),on=visible(c.el,y,vh);
      if(visible(c.stage,y,vh,vh))loadCard(c);
      if(!on){c.time=0;if(c.mesh)c.mesh.visible=false;continue;}
      c.time=reduced?3:c.time+dt;
      const hovered=mousePointer&&c.stage.matches(":hover")&&matchMedia('(hover:hover)').matches&&!narrow&&!reduced;
      c.hover=clamp(c.hover+(hovered?1:-1)*dt);c.dof=clamp(c.dof+(hovered?.75:-1)*dt);
      const band=c.hover<.2?0:c.hover<.3?1:2;
      if(hovered&&band!==c.hoverBand){const angle=(c.index*2.399963+band*1.618034)*Math.PI;const strength=(1-fit(c.hover,0,.6))*(band===2?.5:1);c.shiftTargetX=Math.cos(angle)*strength;c.shiftTargetY=Math.sin(angle)*strength;}
      else if(!hovered){c.shiftTargetX*=.95;c.shiftTargetY*=.95;}
      c.hoverBand=band;c.shiftX+=(c.shiftTargetX-c.shiftX)*.2;c.shiftY+=(c.shiftTargetY-c.shiftY)*.2;
      c.metaHover=reduced?0:clamp(c.metaHover+((c.el.matches(":hover,:focus-visible")&&!narrow)?1:-1)*dt*2.5);
      const locked=reduced?c.text.length:Math.max(0,Math.floor(40*c.time)-5),shown=reduced?c.text.length:Math.min(c.text.length,Math.floor(40*c.time));
      let label=c.text.slice(0,locked);for(let i=locked;i<shown;i++)label+=String.fromCharCode(33+((i*17+Math.floor(now/25))%93));if(c.category.textContent!==label)c.category.textContent=label;
      c.strips.forEach((strip,i)=>{const phase=i/Math.max(1,c.strips.length-1)*Math.PI+Math.PI/2;const p=reduced||narrow?1:expoInOut(clamp(c.time*.8-Math.cos(phase)/20));const x=(narrow?1.5:1.5*ease(clamp(c.metaHover-Math.abs(i-c.strips.length-1)/100)));strip.style.transform=`translate3d(${x}em,${-500*(1-p)}%,0)`;});
      c.icon.style.transform=`translateX(${narrow?1:ease(fit(c.metaHover,.3,1))}em)`;
      if(!c.mesh)continue;
      c.mesh.visible=on&&!blocked()&&!failed;
      if(!c.mesh.visible)continue;
      const u=c.mesh.material.uniforms, progress=reduced?1:expoOut(fit(c.time,0,1.5)),entrance=reduced?1:expoOut(fit(c.time,0,2));
      (u.u_domXY.value as THREE.Vector2).set(r.left+(1-entrance)*((c.index%2)-.5)*-vw*.1,r.top-y);(u.u_domWH.value as THREE.Vector2).set(r.width,r.height);
      const burst=hovered? (1-fit(c.hover,0,.3))*r.height*.75 : 0;
      const tx=hovered?-(pointerX-r.left-r.width*.5+Math.cos(now*.02)*burst)/r.width*r.height:0,ty=hovered?(pointerY-(r.top-y)-r.height*.5-Math.sin(now*.03)*burst):0;
      if(reduced){for(const s of [c.focusX,c.focusY,c.focusZ,c.zoom]){s.velocity=0;}c.focusX.value=0;c.focusY.value=0;c.focusZ.value=-1;c.zoom.value=0;}
      else{stepEditorialSpring(c.focusX,tx,dt,1,.6,2);stepEditorialSpring(c.focusY,ty,dt,1,.6,2);stepEditorialSpring(c.focusZ,hovered?.5:-1,dt,1,.6,2);stepEditorialSpring(c.zoom,hovered?1:0,dt,2.2,.7,3);}
      (u.u_shiftXY.value as THREE.Vector2).set(reduced?0:c.shiftX,reduced?0:c.shiftY);(u.u_focusPos.value as THREE.Vector3).set(c.focusX.value,c.focusY.value,c.focusZ.value);u.u_globalRadius.value=borderRadius;u.u_zoomRatio.value=c.zoom.value;u.u_dofRangeOffset.value=-.5*c.dof;u.u_showRatio.value=progress;u.u_rippleStrength.value=reduced?0:Math.min(.15,scrollStrength*.5);(u.u_resolution.value as THREE.Vector2).set(vw*(renderer?.getPixelRatio()||1),vh*(renderer?.getPixelRatio()||1));
      u.u_rotation.value=reduced?0:(1-entrance)*((c.index%2)-.5)*.1;
      c.stage.dataset.depthReady="true";c.stage.dataset.focus=`${c.focusX.value.toFixed(3)},${c.focusY.value.toFixed(3)},${c.zoom.value.toFixed(4)}`;drawn++;
    }
    if(renderer&&!failed&&active&&!blocked()&&canvas.style.visibility!=="hidden"){try{renderer.render(scene,camera);frames++;root.dataset.editorialWebgl="ready";}catch{failed=true;resetFallback();root.dataset.editorialWebgl="fallback";}}
    canvas.style.display=active&&!blocked()&&!failed?"block":"none";
    root.dataset.editorialFrames=String(frames);root.dataset.editorialCards=String(drawn);
    if(active&&!reduced&&!blocked())schedule();else last=0;
  }
  listen(window,"scroll",schedule,{passive:true});listen(window,"resize",()=>{dirty=true;schedule();},{passive:true});
  listen(window,"pointermove",event=>{const e=event as PointerEvent;if(e.pointerType==="touch"){mousePointer=false;schedule();return;}mousePointer=true;pointerX=e.clientX;pointerY=e.clientY;schedule();},{passive:true});
  listen(window,"pointercancel",()=>{mousePointer=false;schedule();});
  listen(window,"blur",()=>{mousePointer=false;schedule();});
  listen(window,"pointerdown",event=>{if((event as PointerEvent).pointerType==="touch"){mousePointer=false;schedule();}},{passive:true});
  listen(canvas,"webglcontextlost",event=>{event.preventDefault();failed=true;resetFallback();root.dataset.editorialWebgl="fallback";canvas.style.display="none";});
  listen(canvas,"webglcontextrestored",()=>{failed=false;dirty=true;schedule();});
  listen(document,"visibilitychange",()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else{dirty=true;schedule();}});
  const unsubscribe=useStudioStore.subscribe(()=>{if(blocked()){if(raf)cancelAnimationFrame(raf);raf=0;last=0;canvas.style.display="none";}else schedule();});
  const observer=new ResizeObserver(()=>{dirty=true;schedule();});observer.observe(section);
  void document.fonts.ready.then(()=>{if(!disposed){dirty=true;schedule();}});schedule();
  return ()=>{
    unregisterProjectSource();disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();unsubscribe();cleanupListeners.forEach(fn=>fn());resetFallback();
    textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer?.dispose();renderer?.forceContextLoss();canvas.remove();
    for(const key of Object.keys(root.dataset))if(key.startsWith("editorial"))delete root.dataset[key];
  };
}
