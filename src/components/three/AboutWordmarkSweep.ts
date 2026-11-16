import * as THREE from "three";

/** One subdivided, scroll-deformed wordmark, using the same locally licensed
 * font as the DOM opening and statement. The archived logo mesh spells the old
 * name, so it cannot be reused for the new six-letter brand. */
export function createAboutWordmarkSweep(invalidate: () => void = () => {}) {
  const uniforms = {
    uPhase: { value: 0 }, uSlideX: { value: 0 }, uOpacity: { value: 0 }, uAspect: { value: 1.88 },
    uViewport: { value: new THREE.Vector2(1440, 764) },
    uFrom: { value: new THREE.Vector4(72, 460, 1296, 260) },
    uTo: { value: new THREE.Vector4(72, 538, 205, 41) },
    uWordmark: { value: null as THREE.CanvasTexture | null },
  };
  const geometry = new THREE.PlaneGeometry(1, 1, 120, 24);
  geometry.translate(.5, .5, 0);
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `uniform float uPhase,uSlideX;uniform vec2 uViewport;uniform vec4 uFrom,uTo;varying vec2 vUv;
      float cubic(float t){return t<.5?4.*t*t*t:.5*pow(2.*t-2.,3.)+1.;}
      void main(){vec2 p=position.xy;vUv=uv;
        float t=cubic(clamp(uPhase*2.2-p.x-pow(max(0.,p.y),1.+uPhase)*.2,0.,1.));
        vec2 from=uFrom.xy+vec2(p.x,1.-p.y)*uFrom.zw;
        vec2 to=uTo.xy+vec2(p.x-p.x*.08,1.-p.y)*uTo.zw;
        vec2 pixel=mix(from,to,t);pixel.x+=uSlideX;gl_Position=vec4(pixel/uViewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
      }`,
    fragmentShader: `uniform float uOpacity;uniform sampler2D uWordmark;varying vec2 vUv;
      void main(){float alpha=texture2D(uWordmark,vUv).a*uOpacity;if(alpha<.002)discard;gl_FragColor=vec4(1.,1.,1.,alpha);}`,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; mesh.renderOrder = 1000; mesh.visible = false;
  let ready = false, disposed = false;
  const canvas = document.createElement("canvas"); canvas.width = 2048; canvas.height = 412;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas); texture.minFilter = THREE.LinearFilter; texture.magFilter = THREE.LinearFilter;
  uniforms.uWordmark.value = texture;
  const repaint = () => {
    if (disposed || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "white"; ctx.font = '550 390px "LusionSansCalibrated", system-ui, sans-serif';
    ctx.textBaseline = "alphabetic";
    // Fill the same opening rectangle and statement cap-height without letting
    // font-specific ascenders or side bearings shrink the six-letter mark.
    const metrics = ctx.measureText("JITHIN");
    const ascent = metrics.actualBoundingBoxAscent || 285;
    const descent = metrics.actualBoundingBoxDescent || 0;
    ctx.save(); ctx.scale(canvas.width / metrics.width, canvas.height / (ascent + descent));
    ctx.fillText("JITHIN", 0, ascent); ctx.restore(); texture.needsUpdate = true;
    ready = true; invalidate();
  };
  // The page's RAF owner is initialized after this constructor returns.
  queueMicrotask(repaint);
  void document.fonts.ready.then(repaint);
  return { mesh, uniforms, get ready() { return ready; }, repaint,
    layout(width: number, height: number, target?: { x: number; y: number; width: number; height: number }) {
      const w = width * .9, h = w * .200956762;
      uniforms.uViewport.value.set(width, height); uniforms.uFrom.value.set(width * .05, height - 44 - h, w, h);
      if (target) uniforms.uTo.value.set(target.x, target.y, target.width, target.height);
    },
    dispose() { if (disposed) return; disposed = true; texture.dispose(); geometry.dispose(); material.dispose(); mesh.removeFromParent(); },
  };
}
