import { useStudioStore } from "@/lib/store";
import { registerProjectListSource } from "@/lib/project-transition";
import * as THREE from "three";
import { loadLusionBuf } from "@/lib/lusion-buf-loader";
import { LUSION_HOME } from "@/data/reference";
import { homeRenderDpr, motionEase } from "@/lib/home-motion";
import { editorialClamp as clamp, editorialFit as fit, editorialEase as ease, editorialExpoOut as expoOut, editorialExpoInOut as expoInOut, reelMorphProgress, reelPinOffset, reelLineProgress, createEditorialSpring, stepEditorialSpring } from "@/lib/home-editorial-motion";
import { editorialVideoVertex, editorialVideoFragment, editorialLineVertex, editorialLineFragment, editorialLineTipVertex, editorialLineTipFragment, editorialProjectVertex, editorialProjectFragment } from "./HomeEditorialShaders";

/** One upper-Home owner: no per-card RAF, no second scroll engine, no writes to the goal/CTA. */
export function createHomeEditorialMotion(root: HTMLElement, reduced: boolean, reelOpen: boolean) {
  const query = <T extends HTMLElement>(selector: string) => root.querySelector<T>(selector);
  const hero = query("#home-hero"), heroHeading = query("#home-hero-title"), heroStage = query("#home-hero-visual-container")?.parentElement, heroCue = query("#home-hero-scroll-container");
  const reel = query("#home-reel")!, title = query("#home-reel-title")!, titleInner = query("#home-reel-title-inner")!, content = query("#home-reel-content")!, desc = query("#home-reel-desc")!, cta = query("#home-reel-cta")!;
  const thumb = query("#home-reel-thumb")!, outer = query("#home-reel-container")!, stage = query("#home-reel-video-container")!, placeholder = query("#home-reel-video-placeholder")!, button = query<HTMLButtonElement>("#home-reel-video-watch-btn")!;
  const video = query<HTMLVideoElement>("#home-reel-video");
  const featured = query("#home-featured")!, featuredTitle = query("#home-featured-title")!, disclaimer = query("#home-featured-disclaimer")!, archiveCta = query("#home-featured-cta")!;
  const titleWords = [...title.querySelectorAll<HTMLElement>("[data-reel-word]")], descWords = [...desc.querySelectorAll<HTMLElement>("[data-reel-desc-word]")], featuredChars = [...featuredTitle.querySelectorAll<HTMLElement>("[data-featured-char]")];
  const disclaimerWords=[...disclaimer.querySelectorAll<HTMLElement>("[data-featured-disclaimer-word]")];
  const disclaimerLines:number[]=[];
  const glyphs = [...root.querySelectorAll<HTMLElement>("[data-reel-glyph]")];
  const rails = [...root.querySelectorAll<HTMLElement>(".reel-decoration-rail")];
  type Box = { left: number; top: number; width: number; height: number };
  const boxes = new Map<HTMLElement,Box>();
  const cardStates = [...featured.querySelectorAll<HTMLAnchorElement>(".project-item")].map((el,index) => ({
    el,index, stage:el.querySelector<HTMLElement>(".project-item-main")!, category:el.querySelector<HTMLElement>(".project-item-line-1")!, strips:[...el.querySelectorAll<HTMLElement>(".project-title-strip")],
    title:el.querySelector<HTMLElement>(".project-item-line-2-inner")!, icon:el.querySelector<HTMLElement>(".project-item-line-2-icon")!, text:el.dataset.categories||"",
    time:0, hover:0, metaHover:0, focusX:createEditorialSpring(0), focusY:createEditorialSpring(0), focusZ:createEditorialSpring(-1), zoom:createEditorialSpring(1), dof:0,
    shiftX:0, shiftY:0, shiftTargetX:0, shiftTargetY:0, hoverBand:0,
    loading:false, failed:false, mesh:null as THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>|null,
    width:1,height:1,
  }));
  const canvas = document.createElement("canvas"); canvas.id="home-editorial-canvas"; canvas.setAttribute("aria-hidden","true"); root.append(canvas);
  const unregisterProjectSource = registerProjectListSource(root,canvas,cardStates);
  let renderer: THREE.WebGLRenderer | null = null, disposed=false, failed=false, raf=0, dirty=true, last=0, frames=0, pointerX=0, pointerY=0, mousePointer=true;
  let titleTime=0, descTime=0, featuredTime=0, disclaimerTime=0, archiveTime=0, playTime=0, playShow=0, decorationTime=0, hoverTime=0, hoverRatio=0;
  const noiseTexture=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1);noiseTexture.needsUpdate=true;
  const noiseUniforms={u_blueNoiseTexture:{value:noiseTexture as THREE.Texture},u_blueNoiseCoordOffset:{value:new THREE.Vector2()}};
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0,1,0,-1,-100,100), textures = new Set<THREE.Texture>(), materials = new Set<THREE.ShaderMaterial>(), geometries = new Set<THREE.BufferGeometry>();
  textures.add(noiseTexture);
  let reelMesh: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>|null=null, lineMesh: THREE.Mesh<THREE.BufferGeometry,THREE.ShaderMaterial>|null=null, tip: THREE.Mesh<THREE.PlaneGeometry,THREE.ShaderMaterial>|null=null;
  let lineData: { cp: THREE.BufferAttribute; pos: THREE.BufferAttribute; shade: THREE.BufferAttribute }|null=null;
  const lineGroup = new THREE.Group(); scene.add(lineGroup);
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
    if(video) {
      const texture = new THREE.VideoTexture(video);texture.colorSpace=THREE.NoColorSpace;textures.add(texture);
      reelMesh=new THREE.Mesh(plane(32),material(editorialVideoVertex,editorialVideoFragment,{
        u_position:{value:new THREE.Vector3()},u_quaternion:{value:new THREE.Vector4(0,0,0,1)},u_scale:{value:new THREE.Vector3(1,1,1)},u_domPivot:{value:new THREE.Vector2()},u_domPadding:{value:new THREE.Vector4()},
        u_domXYFrom:{value:new THREE.Vector2()},u_domWHFrom:{value:new THREE.Vector2()},u_domXY:{value:new THREE.Vector2()},u_domWH:{value:new THREE.Vector2()},u_showRatio:{value:0},u_aspectScale:{value:1},
        u_texture:{value:texture},u_textureSize:{value:new THREE.Vector2()},u_resolution:{value:new THREE.Vector2()},u_radialCenter:{value:new THREE.Vector2(.5,.5)},u_color:{value:new THREE.Color().setRGB(26/255,47/255,251/255)},u_time:{value:0},u_globalRadius:{value:12},u_screenPaintTexture:{value:null},
      }));reelMesh.frustumCulled=false;reelMesh.renderOrder=2;scene.add(reelMesh);
    }
    void loadLusionBuf(LUSION_HOME.reel.connectorSpline).then(data=>{
      if(disposed)return;
      const geometry=data.geometry.clone();geometries.add(geometry);
      lineData={cp:geometry.getAttribute("CP") as THREE.BufferAttribute,pos:geometry.getAttribute("position") as THREE.BufferAttribute,shade:geometry.getAttribute("Cd") as THREE.BufferAttribute};
      lineMesh=new THREE.Mesh(geometry,material(editorialLineVertex,editorialLineFragment,{
        u_radius:{value:.008},u_showRatio:{value:0},u_hideRatio:{value:0},u_scrollY:{value:0},u_viewportResolution:{value:new THREE.Vector2()},u_aspect:{value:new THREE.Vector2()},u_margin:{value:new THREE.Vector2(-.05,-.8)},u_colorBg:{value:new THREE.Color()},u_color0:{value:new THREE.Color().setRGB(90/255,144/255,1)},u_color1:{value:new THREE.Color().setRGB(42/255,56/255,238/255)},u_aoThreshold:{value:.555},
      }));lineMesh.frustumCulled=false;lineGroup.add(lineMesh);
      tip=new THREE.Mesh(plane(),material(editorialLineTipVertex,editorialLineTipFragment,{u_color0:lineMesh.material.uniforms.u_color0,u_color1:lineMesh.material.uniforms.u_color1,u_ao:{value:1},u_mixRatio:{value:0}}));
      tip.geometry.translate(-.5,-.5,0);tip.frustumCulled=false;lineGroup.add(tip);root.dataset.editorialLineVertices=String(lineData.cp.count);schedule();
    }).catch(()=>{root.dataset.editorialLine="unavailable";});
    void loadTexture("/assets/textures/LDR_RGB1_0.png").then(texture=>{texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.generateMipmaps=false;texture.wrapS=texture.wrapT=THREE.RepeatWrapping;noiseUniforms.u_blueNoiseTexture.value=texture;texture.needsUpdate=true;schedule();}).catch(()=>{});
    dirty=true;
  };
  const loadCard = (c:typeof cardStates[number]) => {
    if(c.loading || c.failed || !renderer || failed)return;c.loading=true;
    const project=LUSION_HOME.featured.projects[c.index];
    void Promise.all([loadTexture(project.thumbnail),loadTexture(project.depthMap)]).then(([image,depth])=>{
      if(disposed)return;
      c.mesh=new THREE.Mesh(plane(),material(editorialProjectVertex,editorialProjectFragment,{
        u_domXY:{value:new THREE.Vector2()},u_domWH:{value:new THREE.Vector2()},u_rotation:{value:0},u_padding:{value:new THREE.Vector2(c.index%2?0:1000,c.index%2?1000:0)},u_texture:{value:image},u_depthTexture:{value:depth},u_textureSize:{value:new THREE.Vector2(project.thumbnailWidth,project.thumbnailHeight)},u_colorBg:{value:new THREE.Color(project.colorBg)},u_showRatio:{value:0},u_activeRatio:{value:0},u_shiftXY:{value:new THREE.Vector2()},u_focusPos:{value:new THREE.Vector3(0,0,-1)},u_time:{value:0},u_zoomRatio:{value:1},u_dofRangeOffset:{value:0},u_saturation:{value:0},u_brightness:{value:0},u_borderRatio:{value:0},u_rippleStrength:{value:0},u_resolution:{value:new THREE.Vector2()},u_globalRadius:{value:12},
      },{PARALLAX_SAMPLES:12,BLUR_SAMPLES:6}));c.mesh.frustumCulled=false;c.mesh.renderOrder=3;scene.add(c.mesh);schedule();
    }).catch(()=>{c.failed=true;c.stage.dataset.depthFailed="true";schedule();});
  };
  let titleIndent=0, borderRadius=15;
  const railWidths:number[]=[];
  const measure = () => {
    // DOM boxes are captured only at layout changes, before animation writes.
    stage.style.removeProperty("transform"); titleInner.style.removeProperty("transform"); desc.style.removeProperty("transform"); cta.style.removeProperty("transform"); archiveCta.style.removeProperty("transform");
    const vw=innerWidth,vh=innerHeight, narrow=vw<=812;
    titleIndent=narrow?0:parseFloat(getComputedStyle(titleWords[0].parentElement!).paddingLeft);
    borderRadius=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--global-border-radius"))||15;
    rails.forEach((rail,i)=>railWidths[i]=rail.querySelector<HTMLElement>(".reel-marquee")!.offsetWidth);
    const lineTops:number[]=[];disclaimerWords.forEach((word,i)=>{const top=Math.round(word.parentElement!.getBoundingClientRect().top);if(!lineTops.includes(top))lineTops.push(top);disclaimerLines[i]=lineTops.indexOf(top);});
    const width=stage.offsetWidth;
    const headerBottom=document.getElementById("header-container")?.getBoundingClientRect().bottom ?? 94;
    const cross=parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--cross-size")) || Math.max(14,vw*.01);
    const free=Math.max(160,vh-headerBottom-6*cross);
    stage.style.height=`${narrow ? width*4/3 : Math.min(free,width/2)}px`;
    stage.style.marginTop=narrow?"0px":`${-vh*.5+free*.5+headerBottom+3*cross}px`;
    for(const el of [hero,heroHeading,heroStage,heroCue,reel,title,content,thumb,outer,stage,featured,featuredTitle,disclaimer,archiveCta,...cardStates.flatMap(c=>[c.el,c.stage])]) {
      if(!el)continue;const r=el.getBoundingClientRect();boxes.set(el,{left:r.left,top:r.top+scrollY,width:r.width,height:r.height});
    }
    if(renderer){renderer.setPixelRatio(homeRenderDpr(vw,vh,devicePixelRatio));renderer.setSize(vw,vh,false);}
    camera.right=vw;camera.bottom=-vh;camera.updateProjectionMatrix();dirty=false;
  };
  let lastY=scrollY, scrollStrength=0;
  function frame(now:number) {
    raf=0;if(disposed || document.hidden || useStudioStore.getState().isTransitioning){last=0;return;}
    const dt=last?Math.max(0,(now-last)/1000):0;last=now;
    if(dirty)measure();
    const vw=innerWidth,vh=innerHeight,y=scrollY,narrow=vw<=812;
    noiseUniforms.u_blueNoiseCoordOffset.value.set(reduced?0:(frames*.754877666)%1,reduced?0:(frames*.569840296)%1);
    const active=visible(reel,y,vh) || visible(featured,y,vh);
    scrollStrength=Math.min(1,(scrollStrength+Math.abs(y-lastY)/Math.max(1,vh))*Math.exp(-10*dt));lastY=y;
    if(active && !renderer && !failed){initRenderer();if(dirty)measure();}
    // Preserve the approved hero's original exit equations, within this same upper owner.
    const heroProgress=reduced?0:clamp(y/Math.max(1,rect(hero!).height));
    if(heroCue)heroCue.style.opacity=String(1-motionEase((heroProgress-.06)/.54));
    if(heroHeading)heroHeading.style.transform=`translate3d(0,${heroProgress*24}px,0)`;
    if(heroStage){const exit=reduced?0:motionEase((heroProgress-.02)/.98);heroStage.style.transform=`translate3d(0,${-exit*28}px,0) scale(${1-exit*.045})`;heroStage.style.opacity=String(1-exit*.68);}
    const titleIn=rect(title).top-y<vh, contentIn=rect(content).top-y<vh;
    titleTime=reduced||narrow?2:clamp((titleTime+(titleIn?dt:-dt))/2)*2;
    descTime=reduced||narrow?2:clamp((descTime+(contentIn?dt:-dt))/2)*2;
    if(!visible(reel,y,vh) && rect(reel).top-y>vh){titleTime=0;descTime=0;}
    const titleParallax=reduced?0:clamp((vh-(rect(title).top-y))/vh)*-vh*.05;
    titleInner.style.transform=`translate3d(0,${titleParallax}px,0)`;
    const indent=titleIndent;
    titleWords.forEach((word,i)=>{const x=reduced||narrow?0:i<2?-indent*(1-ease(fit(titleTime-Math.abs(2-i)/10,.5,1.2))):0;const dy=reduced||narrow?0:(i<2?100:-100)*(1-ease(fit(titleTime-i/10,0,1)));word.style.transform=`translate3d(${x}px,${dy}%,0)`;});
    const contentProgress=clamp((vh-(rect(content).top-y))/vh), contentParallax=reduced?0:-contentProgress*vh*.15;
    desc.style.transform=`translate3d(0,${contentParallax}px,0)`;
    descWords.forEach((word,i)=>{const p=reduced||narrow?1:expoOut(fit(descTime-i/100,0,1));word.style.opacity=String(.1+.9*p);word.style.transform=`translate3d(0,${100*(1-p)}%,0)`;});
    const btnEntry=reduced||narrow?1:ease(clamp(descTime));cta.style.transform=`translate3d(0,${reduced?0:-contentProgress*vh*.125}px,0) translateY(${150*(1-btnEntry)}%) rotate(${10*(1-btnEntry)}deg)`;cta.style.opacity=String(btnEntry);
    const from=rect(thumb), target=rect(stage), outerBox=rect(outer);
    const morph=narrow||reduced?1:reelMorphProgress(y,from.top,from.height,outerBox.top,outerBox.height,vh);
    const pin=narrow||reduced?0:reelPinOffset(y,outerBox.top,target.height,vh);
    stage.style.transform=`translate3d(0,${pin}px,0)`;
    const targetY=target.top-y+pin;
    const reelVisible=active && (narrow ? targetY<vh&&targetY+target.height>0 : from.top-y<vh&&targetY+target.height>0);
    if(video){const shouldPlay=reelVisible&&!document.hidden&&!reduced&&!reelOpen;if(shouldPlay && video.paused)void video.play().catch(()=>{});else if(!shouldPlay && !video.paused)video.pause();}
    if(reelMesh){
      reelMesh.visible=reelVisible&&!!video&&video.readyState>=2&&!reelOpen&&!failed;
      const u=reelMesh.material.uniforms;
      const fromHold=Math.max(0,y-from.top+(vh-from.height)*.5);
      (u.u_domXYFrom.value as THREE.Vector2).set(from.left,from.top-y+fromHold);(u.u_domWHFrom.value as THREE.Vector2).set(from.width,from.height);
      (u.u_domXY.value as THREE.Vector2).set(target.left,targetY);(u.u_domWH.value as THREE.Vector2).set(target.width,target.height);(u.u_domPivot.value as THREE.Vector2).set(target.width*.5,target.height*.5);
      u.u_showRatio.value=morph;u.u_aspectScale.value=narrow?1:target.height/(target.width/2);u.u_globalRadius.value=borderRadius;u.u_time.value=now/1000;
      if(reelMesh.visible){if(video?.paused)(u.u_texture.value as THREE.VideoTexture).needsUpdate=true;root.dataset.editorialWebgl="ready";}
    }
    const buttonRatio=reduced||narrow?1:expoInOut(fit(morph,.3,1));
    const canPlay=reduced||narrow||morph>.9;button.tabIndex=canPlay?0:-1;placeholder.style.pointerEvents=canPlay?"auto":"none";placeholder.style.opacity=String(buttonRatio);button.style.transform=`scale(${buttonRatio})`;
    const buttonHover=button.matches(":hover,:focus-visible")&&canPlay;
    hoverRatio=reduced?(buttonHover?1:0):clamp(hoverRatio+(buttonHover?1:-1)*dt*1.5);if(buttonHover)hoverTime+=dt*2;
    if(reelVisible&&morph===1&&!reelOpen){playTime+=reduced?0:dt;playShow=clamp(playShow+dt);decorationTime=Math.min(1.4,decorationTime+dt);}else{playShow=clamp(playShow-dt);decorationTime=Math.max(0,decorationTime-dt*2);}
    glyphs.forEach((glyph,i)=>{const word=i<4?0:1,letter=i<4?i:i-4;const cycle=Math.floor(playTime/2),selected=(cycle*3+word*2)%4;const roll=letter===selected?-100*ease(fit(playTime%2-word/10,.5,1.3)):0;const show=200*(1-ease(fit(playShow-word/4-letter/20,0,.6)));glyph.style.transform=`translate3d(0,${reduced?0:show+roll}%,0)`;});
    rails.forEach((rail,ri)=>{rail.querySelectorAll<HTMLElement>(".reel-cross").forEach((cross,i)=>{const p=reduced?1:ease(fit(decorationTime-i/10,0,.6));cross.style.transform=`translateY(${expoInOut(fit(hoverRatio-i/10,0,.7))}em) scale(${p}) rotate(${180*p}deg)`;});const marquee=rail.querySelector<HTMLElement>(".reel-marquee")!;const phase=(narrow?playTime:hoverTime)%15/15;marquee.style.transform=`translate3d(${(ri===0?-phase:phase-1)*railWidths[ri]*.5}px,0,0)`;marquee.querySelectorAll<HTMLElement>("span").forEach((el,i)=>{el.style.transform=`translateY(${narrow?0:reduced?(buttonHover?0:1.2):1.2*(1-expoInOut(fit(hoverRatio-i/25,.2,1)))}em)`;});});
    if(lineMesh&&lineData&&tip){
      const diagonal=Math.hypot(vw,vh),radius=.008*(2-fit(vw,540,1920)),p=reduced?1:reelLineProgress(rect(reel).top-y,vh);
      lineGroup.position.set(-.05*diagonal,-.8*diagonal-(rect(reel).top-y),0);lineGroup.scale.set(diagonal,diagonal,1);lineGroup.visible=visible(reel,y,vh,diagonal)&&!reelOpen;
      lineMesh.material.uniforms.u_radius.value=radius;lineMesh.material.uniforms.u_showRatio.value=p;
      let at=0;for(let i=0;i<lineData.pos.count;i++)if(p>=lineData.pos.getZ(i))at=i;
      const next=Math.min(at+1,lineData.pos.count-1),a=lineData.pos.getZ(at),b=lineData.pos.getZ(next),r=b>a?clamp((p-a)/(b-a)):0;
      tip.position.set(THREE.MathUtils.lerp(lineData.cp.getX(at),lineData.cp.getX(next),r),THREE.MathUtils.lerp(lineData.cp.getY(at),lineData.cp.getY(next),r),.01);tip.scale.setScalar(2*radius);
      tip.material.uniforms.u_mixRatio.value=1-(1-p)**2;tip.material.uniforms.u_ao.value=Math.min(1,.9+.1*THREE.MathUtils.lerp(lineData.shade.getX(at),lineData.shade.getX(next),r)+1-fit(p,.535,.575));
      root.dataset.editorialLineProgress=p.toFixed(5);
    }
    featuredTime=reduced||narrow?2:Math.min(2,Math.max(0,featuredTime+(rect(featuredTitle).top-y<vh?dt:-dt)));
    disclaimerTime=reduced||narrow?2:Math.min(2,Math.max(0,disclaimerTime+(rect(disclaimer).top-y<vh?dt:-dt)));
    featuredChars.forEach((char,i)=>{const p=reduced||narrow?1:ease(fit(featuredTime*1.5-i/20,0,1));char.style.transform=`translate3d(0,${1-p}em,0) rotate(${10*(1-p)}deg)`;});
    disclaimerWords.forEach((word,i)=>{const p=reduced||narrow?1:ease(fit(disclaimerTime-disclaimerLines[i]/20,0,1));word.style.transform=`translateY(${100*(1-p)}%)`;});
    archiveTime=reduced||narrow?1:clamp(archiveTime+(rect(archiveCta).top-y<vh?dt:-dt));archiveCta.style.transform=`translateY(${150*(1-ease(archiveTime))}%) rotate(${10*(1-ease(archiveTime))}deg)`;archiveCta.style.opacity=String(ease(archiveTime));
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
      c.mesh.visible=on&&!reelOpen&&!failed;
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
    if(renderer&&!failed&&active&&!reelOpen&&canvas.style.visibility!=="hidden"){try{renderer.render(scene,camera);frames++;}catch{failed=true;resetFallback();root.dataset.editorialWebgl="fallback";}}
    canvas.style.display=active&&!reelOpen&&!failed?"block":"none";
    root.dataset.editorialFrames=String(frames);root.dataset.editorialPixel=String(y);root.dataset.editorialMorph=morph.toFixed(5);root.dataset.editorialCards=String(drawn);
    if(active&&!reduced&&!reelOpen)schedule();else last=0;
  }
  listen(window,"scroll",schedule,{passive:true});listen(window,"resize",()=>{dirty=true;schedule();},{passive:true});
  listen(window,"pointermove",event=>{const e=event as PointerEvent;if(e.pointerType==="touch"){mousePointer=false;schedule();return;}mousePointer=true;pointerX=e.clientX;pointerY=e.clientY;schedule();},{passive:true});
  listen(window,"pointercancel",()=>{mousePointer=false;schedule();});
  listen(window,"blur",()=>{mousePointer=false;schedule();});
  listen(window,"pointerdown",event=>{if((event as PointerEvent).pointerType==="touch"){mousePointer=false;schedule();}},{passive:true});
  listen(canvas,"webglcontextlost",event=>{event.preventDefault();failed=true;resetFallback();root.dataset.editorialWebgl="fallback";canvas.style.display="none";});
  listen(canvas,"webglcontextrestored",()=>{failed=false;dirty=true;schedule();});
  listen(document,"visibilitychange",()=>{if(document.hidden){if(raf)cancelAnimationFrame(raf);raf=0;last=0;video?.pause();}else{dirty=true;schedule();}});
  if(video){listen(video,"loadeddata",schedule);listen(video,"seeked",schedule);}
  const unsubscribeTransition = useStudioStore.subscribe((state,before)=>{if(state.isTransitioning){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}else if(before.isTransitioning)schedule();});
  const observer=new ResizeObserver(()=>{dirty=true;schedule();});for(const el of [reel,featured,hero])if(el)observer.observe(el);
  void document.fonts.ready.then(()=>{if(!disposed){dirty=true;schedule();}});schedule();
  return () => {
    unsubscribeTransition();unregisterProjectSource();disposed=true;if(raf)cancelAnimationFrame(raf);observer.disconnect();cleanupListeners.forEach(fn=>fn());video?.pause();resetFallback();
    textures.forEach(t=>t.dispose());materials.forEach(m=>m.dispose());geometries.forEach(g=>g.dispose());renderer?.dispose();renderer?.forceContextLoss();canvas.remove();
    for(const key of Object.keys(root.dataset))if(key.startsWith("editorial"))delete root.dataset[key];
  };
}
