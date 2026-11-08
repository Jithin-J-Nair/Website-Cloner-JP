import * as THREE from "three";
import { loadLusionBuf } from "@/lib/lusion-buf-loader";
import { casePlantVertex, casePlantFragment } from "./CaseStudyShaders";

export type CasePanelFrame = { element: HTMLElement; left: number; top: number; width: number; height: number; reveal: number; fullscreen: boolean };

/** Optional viewport compositor. No scroll, observers, listeners or RAF here:
 * the case-study owner supplies measured frames and owns the whole lifetime. */
export function createCaseStudyGraphics(canvas: HTMLCanvasElement, shadow: number, reduced: boolean, wake: () => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false, powerPreference: "low-power" });
  renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0, 1, 0, -1, -1, 1);
  const screen = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const plantScene = new THREE.Scene(), plantCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, .001, 50);
  const plantRT = new THREE.WebGLRenderTarget(1, 1), plants: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
  plantCamera.position.set(-.1, .1, 10); plantCamera.lookAt(-.1, 0, 0); plantCamera.zoom = 2500;
  const quad = new THREE.PlaneGeometry(2, 2), finalScene = new THREE.Scene(), finalCamera = new THREE.Camera();
  const uniforms = { uImage: { value: screen.texture }, uPlant: { value: plantRT.texture }, uVelocity: { value: 0 }, uVertical: { value: 0 }, uShadow: { value: shadow }, uPlantTexel: { value: new THREE.Vector2(1, 1) } };
  const finalMaterial = new THREE.ShaderMaterial({ uniforms, depthTest: false, depthWrite: false,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position,1.);}`,
    fragmentShader: `uniform sampler2D uImage,uPlant;uniform float uVelocity,uVertical,uShadow;uniform vec2 uPlantTexel;varying vec2 vUv;
      void main(){vec2 p=vUv;float axis=mix(p.x,1.-p.y,uVertical);float wave=cos(axis*6.2831853)*2.*uVelocity*uVelocity;
        vec2 offset=mix(vec2(uVelocity/8.,0.),vec2(0.,-uVelocity/8.),uVertical);p+=mix(vec2(0.,-wave),vec2(wave,0.),uVertical);
        vec4 image=vec4(0.);for(int i=0;i<8;i++){image+=texture2D(uImage,p+offset*float(i));}image/=8.;
        vec3 mask=vec3(0.);vec2 texel=uPlantTexel;
        for(int i=-2;i<=2;i++){for(int j=-2;j<=2;j++){mask+=texture2D(uPlant,vUv+vec2(float(i),float(j))*texel*2.).rgb/25.;}}
        float s=max(mask.r,max(mask.g,mask.b));float darkness=(1.-uShadow)*s;
        float alpha=image.a+darkness*(1.-image.a);vec3 colour=image.rgb*mix(1.,uShadow,s);
        gl_FragColor=vec4(image.a>.001?colour:vec3(0.),alpha);}`,
  });
  finalScene.add(new THREE.Mesh(quad, finalMaterial));
  const materialVertex = `uniform vec4 uBox;uniform vec2 uViewport;varying vec2 vUv;void main(){vUv=uv;vec2 p=uBox.xy+vec2(uv.x,1.-uv.y)*uBox.zw;gl_Position=vec4(p/uViewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);}`;
  const materialFragment = `uniform sampler2D uTexture;uniform vec2 uSize;uniform float uReveal,uRadius;varying vec2 vUv;
    void main(){vec2 halfSize=uSize*.5*mix(.6,1.,uReveal);vec2 p=abs((vUv-.5)*uSize)-halfSize+uRadius;float d=min(max(p.x,p.y),0.)+length(max(p,0.))-uRadius;
      float a=1.-smoothstep(-1.,1.,d);if(a<=0.)discard;vec2 uv=(vUv-.5)*mix(.6,1.,uReveal)+.5;gl_FragColor=vec4(texture2D(uTexture,uv).rgb,a);}`;
  const entries = new Map<HTMLElement, { mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; texture: THREE.Texture; source: string; media: HTMLVideoElement | HTMLImageElement }>();
  let disposed = false, width = 1, height = 1, plantGeometry: THREE.BufferGeometry | null = null;
  void loadLusionBuf("/assets/models/plant.buf").then(data => {
    if (disposed) return;
    plantGeometry = data.geometry.clone(); plantGeometry.computeBoundingBox(); const box = plantGeometry.boundingBox!;
    for (let i = 0; i < 3; i++) {
      const material = new THREE.ShaderMaterial({ vertexShader: casePlantVertex, fragmentShader: casePlantFragment, side: THREE.DoubleSide,
        uniforms: { u_time: { value: 0 }, u_delay: { value: [0, .2, .5][i] }, u_bbMin: { value: box.min }, u_bbMax: { value: box.max }, u_angleForce: { value: 0 }, u_mask: { value: new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0) } },
      });
      const mesh = new THREE.Mesh(plantGeometry, material);
      const positions = [[-.55, -.8, -5], [-.75, -.8, 0], [-.45, -.8, 5]], rotations = [[0, -.2, -.2], [0, .2, -.5], [.3, .3, .1]];
      mesh.position.fromArray(positions[i]); mesh.rotation.set(...rotations[i] as [number, number, number]);
      mesh.onBeforeRender = () => renderer.getContext().colorMask(i === 0, i === 1, i === 2, true);
      plants.push(mesh); plantScene.add(mesh);
    }
    wake();
  }).catch(() => { canvas.dataset.plant = "unavailable"; });
  const clearFallback = () => { for (const element of entries.keys()) delete element.dataset.casePixels; };
  return {
    renderer,
    resize(w: number, h: number) {
      width = w; height = h; const dpr = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt(1400000 / (w * h)));
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); screen.setSize(Math.ceil(w * dpr), Math.ceil(h * dpr)); plantRT.setSize(Math.ceil(w * .375), Math.ceil(h * .375)); uniforms.uPlantTexel.value.set(1 / plantRT.width, 1 / plantRT.height);
      plantCamera.left = -w * .5; plantCamera.right = w * .5; plantCamera.top = h * .5; plantCamera.bottom = -h * .5; plantCamera.updateProjectionMatrix();
    },
    render(frames: CasePanelFrame[], time: number, velocity: number, vertical: boolean, pointerX: number, pointerY: number, shadowLevel: number) {
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
            uniforms: { uTexture: { value: texture }, uBox: { value: new THREE.Vector4() }, uViewport: { value: new THREE.Vector2() }, uSize: { value: new THREE.Vector2() }, uReveal: { value: 1 }, uRadius: { value: 20 } },
          });
          const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material); mesh.frustumCulled = false; scene.add(mesh);
          entry = { mesh, texture, source, media }; entries.set(element, entry);
        }
        entry.mesh.visible = true; const u = entry.mesh.material.uniforms;
        (u.uBox.value as THREE.Vector4).set(frame.left, frame.top, frame.width, frame.height); (u.uViewport.value as THREE.Vector2).set(width, height);
        (u.uSize.value as THREE.Vector2).set(frame.width, frame.height); u.uReveal.value = reduced ? 1 : frame.reveal;
        u.uRadius.value = frame.fullscreen && !vertical ? 0 : 20;
        element.dataset.casePixels = "ready";
      }
      renderer.getContext().colorMask(true, true, true, true);
      renderer.setRenderTarget(plantRT); renderer.clear();
      plants.forEach(mesh => { mesh.material.uniforms.u_time.value = reduced ? 0 : time; mesh.material.uniforms.u_angleForce.value = reduced ? 0 : Math.min(1, Math.abs(velocity) * 5); });
      const follow = reduced ? 1 : .08;
      plantCamera.position.x += (-.1 + pointerX * .03 - plantCamera.position.x) * follow;
      plantCamera.position.y += (.1 + pointerY * .015 - plantCamera.position.y) * follow; plantCamera.lookAt(-.1, 0, 0);
      renderer.render(plantScene, plantCamera); renderer.getContext().colorMask(true, true, true, true);
      renderer.setRenderTarget(screen); renderer.clear(); renderer.render(scene, camera);
      renderer.setRenderTarget(null); renderer.clear(); uniforms.uShadow.value = shadowLevel; uniforms.uVelocity.value = reduced ? 0 : Math.min(.15, Math.abs(velocity)); uniforms.uVertical.value = vertical ? 1 : 0;
      renderer.render(finalScene, finalCamera); canvas.dataset.plant = plants.length ? "ready" : (canvas.dataset.plant || "loading");
    },
    clearFallback,
    dispose() {
      if (disposed) return; disposed = true; clearFallback();
      entries.forEach(entry => { entry.texture.dispose(); entry.mesh.material.dispose(); entry.mesh.geometry.dispose(); }); entries.clear();
      plants.forEach(mesh => mesh.material.dispose()); plantGeometry?.dispose(); screen.dispose(); plantRT.dispose(); quad.dispose(); finalMaterial.dispose(); renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
