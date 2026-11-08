import * as THREE from "three";

/** A single subdivided type surface, not individually tilted textPath glyphs.
 * The supplied About recording keeps the wordmark readable while it sweeps
 * across the valley. Keep the deformation continuous and restrained: the
 * letters stay connected as a fold travels across their shared surface. The About renderer owns its render/lifetime.
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
    context.font = '550 490px LusionSansCalibrated, sans-serif';
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
        // A fold travels from left to right: the left letters curl nearly
        // edge-on while the trailing N retains its opening cap height.
        float x=uv.x;
        float fold=smoothstep(0.,1.,uPhase);
        float local=smoothstep(x*.66,x*.66+.34,fold);
        float angle=local*1.52;
        float height=min(1.36,1.74/uAspect);
        float baseline=-.53 + .10*pow(x,3.)*fold;
        float vertical=(uv.y-.5)*height;
        vec2 p=vec2(mix(-.90,.91,x),baseline+vertical*cos(angle));
        p.x+=sin(angle)*vertical*.46;
        p.y+=sin(angle)*.10 + .08*pow(sin(x*3.14159265),2.)*fold;
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
