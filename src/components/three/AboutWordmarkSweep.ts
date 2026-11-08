import * as THREE from "three";
import { decodeAboutSourceBuffer } from "@/lib/about-source-buffer";

/** The archived 1,400-vertex logo is a vector silhouette with per-vertex edge
 * distance, not a redistributed font or a stretched canvas text substitute.
 * Its six letters continuously migrate from the opening to the left statement
 * using the reference's staggered cubic morph. One mesh, camera and RAF owner. */
export function createAboutWordmarkSweep(invalidate: () => void = () => {}) {
  const uniforms = {
    uPhase: { value: 0 }, uSlideX: { value: 0 }, uOpacity: { value: 0 }, uAspect: { value: 1.88 },
    uViewport: { value: new THREE.Vector2(1440, 764) },
    uFrom: { value: new THREE.Vector4(72, 460, 1296, 260) },
    uTo: { value: new THREE.Vector4(72, 538, 205, 41) },
  };
  const geometry = new THREE.BufferGeometry();
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `attribute float aChar;uniform float uPhase,uSlideX;uniform vec2 uViewport;uniform vec4 uFrom,uTo;varying float vDistance;
      float cubic(float t){return t<.5?4.*t*t*t:.5*pow(2.*t-2.,3.)+1.;}
      void main(){
        vec2 p=vec2(position.x,position.y/.200956762);vDistance=position.z;
        float t=cubic(clamp(uPhase*2.2-p.x-pow(max(0.,p.y),1.+uPhase)*.2,0.,1.));
        vec2 from=uFrom.xy+vec2(p.x,1.-p.y)*uFrom.zw;
        vec2 to=uTo.xy+vec2(p.x-aChar/5.*.08,1.-p.y)*uTo.zw;
        vec2 pixel=mix(from,to,t);pixel.x+=uSlideX;gl_Position=vec4(pixel/uViewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
      }`,
    fragmentShader: `uniform float uOpacity;varying float vDistance;
      void main(){float alpha=smoothstep(0.,max(.00001,fwidth(vDistance)),vDistance)*uOpacity;if(alpha<.002)discard;gl_FragColor=vec4(1.,1.,1.,alpha);}`,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.renderOrder = 1000; mesh.visible = false;
  const controller = new AbortController(); let ready = false, disposed = false;
  void fetch("/about/scene/logo_text.buf", { signal: controller.signal }).then(async response => {
    if (!response.ok) throw new Error("About logo unavailable");
    const data = decodeAboutSourceBuffer(await response.arrayBuffer());
    if (disposed) return;
    if (!data.attributes.char || !data.attributes.indices) throw new Error("Invalid About logo");
    geometry.setAttribute("position", new THREE.BufferAttribute(data.attributes.position, 3));
    geometry.setAttribute("aChar", new THREE.BufferAttribute(data.attributes.char, 1));
    geometry.setIndex(new THREE.BufferAttribute(Uint16Array.from(data.attributes.indices), 1));
    ready = true; invalidate();
  }).catch(() => { /* The accessible DOM wordmark remains a zero-network fallback. */ });
  return { mesh, uniforms, get ready() { return ready; }, repaint: invalidate,
    layout(width: number, height: number, target?: { x: number; y: number; width: number; height: number }) {
      const w = width * .9, h = w * .200956762;
      uniforms.uViewport.value.set(width, height); uniforms.uFrom.value.set(width * .05, height - 44 - h, w, h);
      if (target) uniforms.uTo.value.set(target.x, target.y, target.width, target.height);
    },
    dispose() { if (disposed) return; disposed = true; controller.abort(); geometry.dispose(); material.dispose(); mesh.removeFromParent(); },
  };
}
