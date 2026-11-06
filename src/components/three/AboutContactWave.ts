import * as THREE from "three";
import { AboutGlyphFluid } from "./AboutGlyphFluid";

/** Actual pressure-projected particle/grid liquid, rendered as glyphs in one
 * Points draw. The renderer owns the active clock; no prescribed sine-wave
 * surface, ballistic recycling fan, independent RAF or production asset. */
export function createAboutContactWave(requestedCount = 3600) {
  const count = Math.max(120, Math.min(5600, Math.floor(Number.isFinite(requestedCount) ? requestedCount : 3600)));
  const columns = Math.max(12, Math.round(Math.sqrt(count * 2.25)));
  const rows = Math.ceil(count / columns);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const x = i % columns, y = Math.floor(i / columns);
    seed.set([x / (columns - 1) * 2 - 1, y / Math.max(1, rows - 1),
      Math.sin(i * 127.1) * .45, (Math.sin(i * 311.7) + 1) * .5], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3), velocities = new Float32Array(count * 2);
  const positionAttribute = new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage);
  const velocityAttribute = new THREE.BufferAttribute(velocities, 2).setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positionAttribute);
  geometry.setAttribute("aFluidVelocity", velocityAttribute);
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const uniforms = {
    uTime: { value: 0 }, uProgress: { value: 0 }, uReduced: { value: 0 },
    uViewport: { value: new THREE.Vector2(16, 9) }, uPointer: { value: new THREE.Vector3() },
    uPixelRatio: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 aSeed; attribute vec2 aFluidVelocity;
      uniform float uPixelRatio;
      varying float vShape,vAngle,vAlpha;
      void main(){
        vec4 eye=modelViewMatrix*vec4(position,1.);
        gl_PointSize=(9.0+aSeed.w*2.5)*uPixelRatio*10./max(3.,-eye.z);
        vShape=mod(floor((aSeed.x+1.)*11.+aSeed.y*17.),4.);
        float speed=length(aFluidVelocity);
        vAngle=aSeed.w*6.283+atan(aFluidVelocity.y,aFluidVelocity.x+.00001)*smoothstep(.02,.4,speed)*.32;
        vAlpha=.9+.1*aSeed.w;
        gl_Position=projectionMatrix*eye;
      }`,
    fragmentShader: `varying float vShape,vAngle,vAlpha;
      void main(){
        vec2 p=(gl_PointCoord-.5)*2.;
        p=mat2(cos(vAngle),-sin(vAngle),sin(vAngle),cos(vAngle))*p;
        float d;
        if(vShape<.5)d=length(p)-.74;
        else if(vShape<1.5)d=min(max(abs(p.x)-.18,abs(p.y)-.86),max(abs(p.x)-.86,abs(p.y)-.18));
        else if(vShape<2.5)d=max(abs(p.x),abs(p.y))-.66;
        else d=max(abs(p.x)*.866+p.y*.5,-p.y)-.48;
        float alpha=(1.-smoothstep(-.12,.12,d))*vAlpha;
        if(alpha<.01)discard;
        gl_FragColor=vec4(vec3(1.),alpha);
      }`,
  });
  const points = new THREE.Points(geometry, material);
  points.frustumCulled = false;
  const group = new THREE.Group(); group.add(points);
  const fluid = new AboutGlyphFluid(count, 16 / 9);
  let lastTime: number | null = null, disposed = false;
  return { group, uniforms, count,
    setTime(time: number) {
      if (disposed) return;
      const t = Number.isFinite(time) ? time : 0;
      const view = uniforms.uViewport.value, pointer = uniforms.uPointer.value;
      fluid.resize(view.x / view.y);
      const dt = lastTime === null ? 1 / 60 : Math.max(0, t - lastTime);
      lastTime = t; uniforms.uTime.value = t;
      fluid.update(dt, (pointer.x / view.x + .5) * view.x / view.y,
        pointer.y / view.y + .5, pointer.z > .02, uniforms.uReduced.value > .5);
      for (let i = 0; i < count; i++) {
        positions[i * 3] = (fluid.x[i] / (view.x / view.y) - .5) * view.x;
        positions[i * 3 + 1] = (fluid.y[i] - .5) * view.y;
        positions[i * 3 + 2] = seed[i * 4 + 2] * .035;
        velocities[i * 2] = fluid.vx[i]; velocities[i * 2 + 1] = fluid.vy[i];
      }
      positionAttribute.needsUpdate = true; velocityAttribute.needsUpdate = true;
    },
    dispose() { if (disposed) return; disposed = true; geometry.dispose(); material.dispose(); }
  };
}
