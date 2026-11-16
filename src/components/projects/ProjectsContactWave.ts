import * as THREE from "three";
import { AboutContactFluid } from "@/components/three/AboutContactFluid";

/** Native Projects textured mode: 23 glyph masks packed in eight RGB tiles,
 * one instanced draw, nine source colours, .4-density tank and 1.5× gravity.
 * The PIC solver is shared; About's default profile/material remain unchanged. */
export function createProjectsContactWave(limit = 5600) {
  const fluid = new AboutContactFluid(), group = new THREE.Group();
  const uniforms = {
    uTime: { value: 0 }, uProgress: { value: 0 }, uReduced: { value: 0 },
    uViewport: { value: new THREE.Vector2(1, 1) }, uPointer: { value: new THREE.Vector3(.5, .5, 0) },
    uHeld: { value: 0 }, uPixelRatio: { value: 1 },
    uTank: { value: new THREE.Vector2(2, 1) }, uRadius: { value: .01 },
    uTexture: { value: null as THREE.Texture | null },
  };
  let disposed = false, loaded = false, failed = false;
  const ready = new Promise<void>((resolve, reject) => {
    uniforms.uTexture.value = new THREE.TextureLoader().load("/assets/textures/flip_texture.png", texture => {
      if (!disposed) { texture.colorSpace = THREE.NoColorSpace; texture.needsUpdate = true; loaded = true; }
      resolve();
    }, undefined, () => { failed = true; reject(new Error("Projects glyph atlas unavailable")); });
  });
  const base = new THREE.PlaneGeometry(1.6, 1.6), geometry = new THREE.InstancedBufferGeometry();
  geometry.setAttribute("position", base.getAttribute("position"));
  geometry.setAttribute("uv", base.getAttribute("uv")); geometry.setIndex(base.index);
  const particles = new THREE.InstancedBufferAttribute(new Float32Array(limit * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const styles = new Float32Array(limit * 4);
  const palette = ["ff383c", "0029ff", "bb2bff", "1eff5d", "cfff0f", "d6e4ec", "bbcbda", "7a8d9b", "262229"].map(hex => Number.parseInt(hex, 16));
  for (let k = 0; k < limit; k++) {
    const j = k % 45, colour = palette[j < 5 ? j : 5 + (j - 5) % 4];
    styles[k * 4] = ((colour >> 16) & 255) / 255;
    styles[k * 4 + 1] = ((colour >> 8) & 255) / 255;
    styles[k * 4 + 2] = (colour & 255) / 255;
    styles[k * 4 + 3] = Math.floor(k / 23) % 23;
  }
  geometry.setAttribute("aParticle", particles);
  geometry.setAttribute("aStyle", new THREE.InstancedBufferAttribute(styles, 4)); geometry.instanceCount = 0;
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute vec4 aParticle;attribute vec4 aStyle;uniform vec2 uTank;uniform float uRadius;
      varying vec2 vUv;varying vec3 vColor;varying vec3 vChannel;
      void main(){float s=sin(aParticle.z),c=cos(aParticle.z);vec2 p=aParticle.xy/uTank*2.-1.;
        p+=mat2(c,-s,s,c)*position.xy*uRadius*4./uTank;
        float f=fract(aStyle.w/3.);vChannel=vec3(f<.25?1.:0.,abs(f-.5)<.25?1.:0.,f>.75?1.:0.);
        vColor=aStyle.rgb;vUv=vec2((uv.x+floor(aStyle.w/3.))/8.,uv.y);gl_Position=vec4(p,0.,1.);}`,
    fragmentShader: `uniform sampler2D uTexture;varying vec2 vUv;varying vec3 vColor;varying vec3 vChannel;
      void main(){float a=dot(vChannel,texture2D(uTexture,vUv).rgb);gl_FragColor=vec4(vColor,a);}`,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; group.add(mesh);
  let lastTime: number | null = null, layoutWidth = 0, layoutHeight = 0;
  return {
    group, uniforms, fluid, ready, get loaded() { return loaded; }, get failed() { return failed; }, get count() { return fluid.count; },
    layout(width: number, height: number) {
      if (disposed || (width === layoutWidth && height === layoutHeight)) return;
      layoutWidth = width; layoutHeight = height;
      fluid.configure(width, height, limit, uniforms.uReduced.value > .5, true); lastTime = null;
      uniforms.uTank.value.set(fluid.width, fluid.height); uniforms.uRadius.value = fluid.radius;
      uniforms.uViewport.value.set(width, height); geometry.instanceCount = fluid.count;
    },
    setTime(time: number) {
      if (disposed) return;
      const dt = lastTime === null ? 1 / 60 : Math.max(0, time - lastTime); lastTime = time;
      const pointer = uniforms.uPointer.value; uniforms.uTime.value = time;
      fluid.update(dt, pointer.x, pointer.y, pointer.z > .5, uniforms.uHeld.value > .5);
      for (let k = 0; k < fluid.count; k++) particles.setXYZW(k, fluid.outX[k], fluid.outY[k], fluid.angle[k], 1);
      particles.needsUpdate = true;
    },
    dispose() {
      if (disposed) return; disposed = true; group.removeFromParent(); geometry.dispose(); material.dispose(); uniforms.uTexture.value?.dispose();
    },
  };
}
