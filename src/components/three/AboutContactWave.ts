import * as THREE from "three";
import { AboutContactFluid } from "./AboutContactFluid";

/** Reference-shaped, rotating geometric grains. Four instanced draws, not
 * camera-facing point sprites with an elevation-dependent apparent size. */
export function createAboutContactWave(requestedCount = 5600) {
  const limit = Math.max(4, Math.min(5600, Math.floor(Number.isFinite(requestedCount) ? requestedCount : 5600)));
  const fluid = new AboutContactFluid();
  const group = new THREE.Group();
  const uniforms = {
    uTime: { value: 0 }, uProgress: { value: 0 }, uReduced: { value: 0 },
    uViewport: { value: new THREE.Vector2(1, 1) }, uPointer: { value: new THREE.Vector3(.5, .5, 0) },
    uHeld: { value: 0 }, uPixelRatio: { value: 1 },
    uTank: { value: new THREE.Vector2(2, 1) }, uRadius: { value: .006 },
  };
  const cross = new THREE.BufferGeometry();
  cross.setAttribute("position", new THREE.Float32BufferAttribute([
    .0714286,-.5,0,-.0714286,-.5,0,.5,-.0714286,0,.0714286,-.0714286,0,
    -.0714286,-.0714286,0,-.5,-.0714286,0,.5,.0714286,0,.0714286,.0714286,0,
    -.0714286,.0714286,0,-.5,.0714286,0,.0714286,.5,0,-.0714286,.5,0,
  ], 3));
  cross.setIndex([4,5,9,0,4,3,8,7,3,7,2,3,7,6,2,11,10,7,7,8,11,3,4,8,0,1,4,4,9,8]);
  const bases = [cross, new THREE.PlaneGeometry(.8, .8), new THREE.CircleGeometry(.4, 10), new THREE.CircleGeometry(.5, 3)];
  const material = new THREE.ShaderMaterial({ uniforms, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
    vertexShader: `attribute vec4 aParticle;uniform vec2 uTank;uniform float uRadius;
      void main(){float s=sin(aParticle.z),c=cos(aParticle.z);
        vec2 p=aParticle.xy/uTank*2.-1.;
        p+=mat2(c,-s,s,c)*position.xy*uRadius*4.*aParticle.w/uTank;
        gl_Position=vec4(p,0.,1.);}`,
    fragmentShader: `void main(){gl_FragColor=vec4(1.);}`,
  });
  const attributes: THREE.InstancedBufferAttribute[] = [];
  const geometries = bases.map(base => {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setAttribute("position", base.getAttribute("position")); geometry.setIndex(base.index);
    const data = new THREE.InstancedBufferAttribute(new Float32Array(Math.ceil(limit / 4) * 4), 4).setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute("aParticle", data); attributes.push(data); geometry.instanceCount = 0;
    const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; group.add(mesh);
    return geometry;
  });
  // CPU geometries only supplied the immutable base attributes; the instanced
  // geometries own their uploaded buffers. Do not upload/dispose them twice.
  let lastTime: number | null = null, disposed = false;
  let layoutWidth = 0, layoutHeight = 0;
  return {
    group, uniforms, fluid, get count() { return fluid.count; },
    layout(width: number, height: number, pill?: { left: number; right: number; bottom: number; top: number }) {
      if (disposed) return;
      if (width !== layoutWidth || height !== layoutHeight) {
        layoutWidth = width; layoutHeight = height;
        fluid.configure(width, height, limit, uniforms.uReduced.value > .5); lastTime = null;
        uniforms.uTank.value.set(fluid.width, fluid.height); uniforms.uRadius.value = fluid.radius;
        uniforms.uViewport.value.set(width, height);
        geometries.forEach((geometry, type) => { geometry.instanceCount = Math.max(0, Math.ceil((fluid.count - type) / 4)); });
      }
      if (pill) fluid.setCollider({ left: pill.left * fluid.width, right: pill.right * fluid.width, bottom: pill.bottom * fluid.height, top: pill.top * fluid.height });
    },
    setTime(time: number) {
      if (disposed) return;
      const t = Number.isFinite(time) ? time : 0, pointer = uniforms.uPointer.value;
      const dt = lastTime === null ? 1 / 60 : Math.max(0, t - lastTime);
      lastTime = t; uniforms.uTime.value = t;
      fluid.update(dt, pointer.x, pointer.y, pointer.z > .5, uniforms.uHeld.value > .5);
      for (let k = 0; k < fluid.count; k++) {
        const a = attributes[k % 4], index = Math.floor(k / 4);
        a.setXYZW(index, fluid.outX[k], fluid.outY[k], fluid.angle[k], 1 + Math.min(1, Math.abs(fluid.spin[k]) * .01));
      }
      attributes.forEach(a => { a.needsUpdate = true; });
    },
    dispose() {
      if (disposed) return; disposed = true; group.removeFromParent();
      geometries.forEach(g => g.dispose()); material.dispose();
    },
  };
}
