import * as THREE from "three";

/** A single subdivided type surface, not individually tilted textPath glyphs.
 * The supplied About recording keeps the wordmark readable while it sweeps
 * across the valley. Keep the deformation continuous and restrained: the
 * letters may bend with the scene, but must never collapse into separate
 * wedges or expand asymmetrically. The About renderer owns its render/lifetime.
 */
export function createAboutWordmarkSweep() {
  const canvas = document.createElement("canvas");
  canvas.width = 2048; canvas.height = 512;
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  const repaint = () => {
    const context = canvas.getContext("2d");
    if (!context) return;
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.font = '450 490px LusionSansCalibrated, sans-serif';
    context.textBaseline = "alphabetic";
    const metrics = context.measureText("LUSION");
    context.save();
    context.scale(2000 / metrics.width, 1);
    context.fillStyle = "white";
    context.fillText("LUSION", 12, 452);
    context.restore(); texture.needsUpdate = true;
  };
  repaint();
  const uniforms = {
    uMap: { value: texture }, uPhase: { value: 0 }, uOpacity: { value: 0 },
    uAspect: { value: 1.88 },
  };
  const geometry = new THREE.PlaneGeometry(2, 2, 160, 12);
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthTest: false, depthWrite: false,
    vertexShader: `uniform float uPhase,uAspect; varying vec2 vUv;
      void main(){
        vUv=uv;
        // Preserve the wordmark's original proportions. A small scroll-linked
        // bend gives the line perspective without pinching the left glyphs or
        // stretching the right glyphs into unreadable wedges.
        float fold=.28*smoothstep(.05,.90,uPhase);
        float x=uv.x;
        float curve=sin(x*3.14159265);
        float thickness=mix(1.,.88+.12*smoothstep(.20,.85,x),fold);
        float height=min(1.10,1.31/uAspect);
        float baseline=mix(-.59,-.57-.015*x+.025*curve,fold);
        vec2 p=vec2(mix(-.90,.91,pow(x,mix(1.,1.08,fold))),
          baseline+(uv.y-.5)*height*thickness);
        p.x+=(uv.y-.5)*.22*pow(curve,4.)*fold;
        p.y+=.012*curve*fold;
        gl_Position=vec4(p,0.,1.);
      }`,
    fragmentShader: `uniform sampler2D uMap; uniform float uOpacity; varying vec2 vUv;
      void main(){float a=texture2D(uMap,vUv).a*uOpacity;if(a<.002)discard;
        gl_FragColor=vec4(1.,1.,1.,a);}`,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.frustumCulled = false; mesh.renderOrder = 1000; mesh.visible = false;
  let disposed = false;
  return { mesh, uniforms, repaint, dispose() {
    if (disposed) return; disposed = true;
    texture.dispose(); geometry.dispose(); material.dispose();
  } };
}
