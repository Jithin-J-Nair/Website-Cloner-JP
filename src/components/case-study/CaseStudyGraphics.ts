import * as THREE from "three";
import { caseStudyRenderDpr, caseStudyScrollStrength } from "@/lib/case-study-motion";
import { createCaseStudyShadows } from "./CaseStudyShadows";

export type CasePanelFrame = { element: HTMLElement; left: number; top: number; width: number; height: number; reveal: number; ready: number; fullscreen: boolean };

/** Optional viewport compositor. No scroll, observers, listeners or RAF here:
 * the case-study owner supplies measured frames and owns the whole lifetime. */
export function createCaseStudyGraphics(canvas: HTMLCanvasElement, shadow: number, reduced: boolean, wake: () => void, highlight = "#ffffff") {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
  renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1, 1);
  const screen = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const shadows = createCaseStudyShadows(renderer, wake);
  const quad = new THREE.PlaneGeometry(2, 2), finalScene = new THREE.Scene(), finalCamera = new THREE.Camera();
  const uniforms = { uImage: { value: screen.texture }, uPlant: { value: shadows.texture }, uVelocity: { value: 0 }, uVertical: { value: 0 }, uShadow: { value: shadow }, uShadowView: { value: shadows.view }, uNoise: { value: new THREE.DataTexture(new Uint8Array([128,128,128,255]), 1, 1) as THREE.Texture }, uNoiseOffset: { value: new THREE.Vector2() } };
  const noiseFallback = uniforms.uNoise.value; noiseFallback.needsUpdate = true;
  let noise: THREE.Texture | null = null;
  new THREE.TextureLoader().load("/assets/textures/LDR_RGB1_0.png", texture => {
    if (disposed) { texture.dispose(); return; }
    noise = texture; texture.colorSpace = THREE.NoColorSpace; texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; texture.generateMipmaps = false;
    uniforms.uNoise.value = texture; canvas.dataset.shadowNoise = "ready"; wake();
  }, undefined, () => { canvas.dataset.shadowNoise = "fallback"; });
  const finalMaterial = new THREE.ShaderMaterial({ uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D uImage,uPlant,uNoise;uniform float uVelocity,uVertical,uShadow;uniform mat4 uShadowView;uniform vec2 uNoiseOffset;varying vec2 vUv;
      void main(){vec2 p=vUv;float axis=mix(p.x,1.-p.y,uVertical);float wave=cos(axis*6.2831853)*2.*uVelocity*uVelocity;
        vec2 offset=mix(vec2(uVelocity/8.,0.),vec2(0.,uVelocity/8.),uVertical);p+=mix(vec2(0.,wave),vec2(wave,0.),uVertical);
        p+=offset*texture2D(uNoise,(gl_FragCoord.xy+vec2(22.,45.))/128.+uNoiseOffset).x;
        vec4 image=vec4(0.);for(int i=0;i<8;i++){image+=texture2D(uImage,p+offset*float(i));}image/=8.;
        // Native Ufx geometry is 0..1 BEFORE DOM scaling; using viewport pixel
        // coordinates (or direct screen UV for the shadow) is a different field.
        vec3 world=vec3(vUv.x,1.-vUv.y,-4.*image.a);vec4 projected=uShadowView*vec4(world,1.);
        vec2 shadowUv=projected.xy/projected.w*.9;shadowUv.y=1.-shadowUv.y;
        vec3 mask=texture2D(uPlant,shadowUv).rgb;float s=max(mask.r,max(mask.g,mask.b));s=mix(s,.35+s*.65,image.a);
        float darkness=(1.-uShadow)*s;float alpha=image.a+darkness*(1.-image.a);
        // Native final is opaque under the HTML. This DOM compositor must stay
        // transparent to preserve text/next panels; unpremultiply its coverage.
        gl_FragColor=vec4(alpha>.00001?image.rgb*(1.-darkness)/alpha:vec3(0.),alpha);}`,

  });
  finalScene.add(new THREE.Mesh(quad, finalMaterial));
  const materialVertex = `uniform vec4 uBox;uniform vec2 uViewport;varying vec2 vUv;void main(){vUv=uv;vec2 p=uBox.xy+vec2(uv.x,1.-uv.y)*uBox.zw;gl_Position=vec4(p/uViewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
  const materialFragment = `uniform sampler2D uTexture;uniform vec2 uSize;uniform vec3 uHighlight;uniform float uReady,uReveal,uRadius,uFullscreen;varying vec2 vUv;
    void main(){vec2 halfSize=uSize*.5*mix(.6,1.,max(uFullscreen,uReveal));vec2 p=abs((vUv-.5)*uSize)-halfSize+uRadius;float d=min(max(p.x,p.y),0.)+length(max(p,0.))-uRadius;
      float a=1.-smoothstep(-1.,1.,d);if(a<=0.)discard;vec2 uv=(vUv-.5)*mix(.6,1.,uReveal)+.5;gl_FragColor=vec4(mix(uHighlight,texture2D(uTexture,uv).rgb,uReady),a);}`;
  const entries = new Map<HTMLElement, { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; texture: THREE.Texture; source: string; media: HTMLVideoElement | HTMLImageElement }>();
  let disposed = false, width = 1, height = 1;
  const drawingSize = new THREE.Vector2();
  const clearFallback = () => { for (const element of entries.keys()) delete element.dataset.casePixels; };
  return {
    renderer,
    resize(w: number, h: number) {
      width = w; height = h; const dpr = caseStudyRenderDpr(w, h, devicePixelRatio || 1, renderer.capabilities.maxTextureSize);
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
      // Three floors the drawing-buffer dimensions. Ceil here used to produce
      // a different sampling grid, rescaling the entire image again at rest.
      renderer.getDrawingBufferSize(drawingSize); screen.setSize(drawingSize.x, drawingSize.y); shadows.resize(w, h);
      canvas.dataset.renderDpr = dpr.toFixed(4); canvas.dataset.mediaBuffer = `${screen.width}x${screen.height}`;
    },
    render(frames: CasePanelFrame[], time: number, scrollStrength: number, vertical: boolean, pointerX: number, pointerY: number, shadowLevel: number, dt: number, scrollDelta: number) {
      if (disposed) return;
      entries.forEach(entry => { entry.mesh.visible = false; });
      for (const frame of frames) {
        const element = frame.element, media = element.querySelector<HTMLVideoElement | HTMLImageElement>('video,img');
        if (!media || frame.top > height || frame.top + frame.height < 0 || frame.left > width || frame.left + frame.width < 0) continue;
        const ready = media instanceof HTMLVideoElement ? media.readyState >= 2 : media.complete && media.naturalWidth > 0;
        if (!ready) { delete element.dataset.casePixels; continue; }
        const source = media.currentSrc; let entry = entries.get(element);
        if (entry && entry.source !== source) { entry.texture.dispose(); entry.mesh.material.dispose(); entry.mesh.geometry.dispose(); scene.remove(entry.mesh); entries.delete(element); entry = undefined; }
        if (!entry) {
          const texture = media instanceof HTMLVideoElement ? new THREE.VideoTexture(media) : new THREE.Texture(media);
          texture.colorSpace = THREE.NoColorSpace; texture.needsUpdate = true;
          const material = new THREE.ShaderMaterial({ vertexShader: materialVertex, fragmentShader: materialFragment, transparent: true, depthTest: false, depthWrite: false,
            uniforms: { uTexture: { value: texture }, uBox: { value: new THREE.Vector4() }, uViewport: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2() }, uReveal: { value: 1 }, uReady: { value: 0 }, uHighlight: { value: new THREE.Color().setStyle(highlight, THREE.LinearSRGBColorSpace) }, uRadius: { value: 20 }, uFullscreen: { value: 0 } },
          });
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material); mesh.frustumCulled = false; scene.add(mesh);
          entry = { mesh, texture, source, media }; entries.set(element, entry);
        }
        entry.mesh.visible = true; const u = entry.mesh.material.uniforms;
        (u.uBox.value as THREE.Vector4).set(frame.left, frame.top, frame.width, frame.height); (u.uViewport.value as THREE.Vector2).set(width, height);
        (u.uSize.value as THREE.Vector2).set(frame.width, frame.height); u.uReveal.value = reduced ? 1 : frame.reveal; u.uReady.value = reduced ? 1 : frame.ready;
        u.uRadius.value = frame.fullscreen && !vertical ? 0 : 20; u.uFullscreen.value = frame.fullscreen ? 1 : 0;
        element.dataset.casePixels = "ready";
      }
      shadows.render(time, dt, scrollDelta, pointerX, pointerY, reduced);
      uniforms.uNoiseOffset.value.set(reduced ? 0 : time * .618033989 % 1, reduced ? 0 : time * .414213562 % 1);
      renderer.setRenderTarget(screen); renderer.clear(); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.clear(); uniforms.uShadow.value = shadowLevel; uniforms.uVelocity.value = caseStudyScrollStrength(scrollStrength, reduced); uniforms.uVertical.value = vertical ? 1 : 0;
      renderer.render(finalScene, finalCamera);
    },
    clearFallback,
    dispose() {
      if (disposed) return; disposed = true; clearFallback();
      entries.forEach(entry => { entry.texture.dispose(); entry.mesh.material.dispose(); entry.mesh.geometry.dispose(); }); entries.clear();
      shadows.dispose(); noise?.dispose(); noiseFallback.dispose(); screen.dispose(); quad.dispose(); finalMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
