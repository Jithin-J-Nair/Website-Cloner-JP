import * as THREE from "three";
import { aboutParticleSimulation, aboutFieldAtlas, aboutFieldFilter, aboutFieldSplatVertex, aboutFieldSplatFragment, aboutScatter, aboutParticleVertex, aboutParticleFragment, aboutMotionVertex, aboutMotionFragment } from "./about-reference-shaders";

const screenVertex = `varying vec2 v_uv;void main(){v_uv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const noiseShader = `vec3 getBlueNoise(vec2 p){return fract(sin(vec3(dot(p,vec2(12.9898,78.233)),dot(p,vec2(39.346,11.135)),dot(p,vec2(73.156,52.235))))*43758.5453);}`;
const clamp = (v: number) => Math.max(0, Math.min(1, v));

/** Persistent, ping-pong particle state. One owner calls update from its existing
 * RAF. No timer, CPU particle loop, analytical spiral or extra animation loop.
 * The 64³ temporal light field supplies self-occlusion/refraction to actual
 * instanced sphere surfaces; it is not an additive points/dust approximation. */
export function createAboutReferenceParticles(renderer: THREE.WebGLRenderer, low: boolean, reduced: boolean) {
  const width = 128, height = low ? 64 : 192, count = width * height;
  const group = new THREE.Group();
  let seed = 0x5f3759df;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const defaults = new Float32Array(count * 4);
  const simUv = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const theta = random() * Math.PI * 2, phi = Math.acos(random() * 2 - 1), r = .25 + Math.cbrt(random()) * .5;
    defaults.set([r * Math.sin(phi) * Math.cos(theta), r * Math.sin(phi) * Math.sin(theta), r * Math.cos(phi), i / count - 1], i * 4);
    simUv.set([((i % width) + .5) / width, (Math.floor(i / width) + .5) / height, 0], i * 3);
  }
  const defaultTexture = new THREE.DataTexture(defaults, width, height, THREE.RGBAFormat, THREE.FloatType);
  defaultTexture.needsUpdate = true;
  const target = (w: number, h: number, floating = false) => new THREE.WebGLRenderTarget(w, h, {
    type: floating ? THREE.FloatType : THREE.UnsignedByteType, minFilter: floating ? THREE.NearestFilter : THREE.LinearFilter,
    magFilter: floating ? THREE.NearestFilter : THREE.LinearFilter, depthBuffer: false, stencilBuffer: false,
  });
  const positions = [target(width, height, true), target(width, height, true)];
  const fields = [target(512, 512), target(512, 512)];
  const drawn = target(512, 512);
  const current = { value: defaultTexture as THREE.Texture };
  const previous = { value: defaultTexture as THREE.Texture };
  const stable = { value: 0 };
  const scatterUniforms = {
    u_lightScatterDivider: { value: new THREE.Vector2(1.1, 5.5) }, u_lightScatterPowInv: { value: 2 },
    u_lightScatterRatio: { value: 1 }, u_lightScatterPos0: { value: new THREE.Vector3(0, 18, 0) },
    u_lightScatterPos1: { value: new THREE.Vector3() },
  };
  const fieldUniforms = {
    u_lightFieldSlicedTextureSize: { value: new THREE.Vector2(512, 512) }, u_lightFieldSliceColRowCount: { value: new THREE.Vector2(8, 8) },
    u_lightFieldGridCount: { value: new THREE.Vector3(64, 64, 64) },
    u_lightFieldVolumeOffset: { value: new THREE.Vector3(-4 - 4 / 63, 4 - 4 / 63, -4 - 4 / 63) },
    u_lightFieldVolumeSize: { value: new THREE.Vector3().setScalar(8 + 8 / 63) },
    u_lightFieldSlicedTexture: { value: fields[0].texture },
  };
  const expand = (s: string) => s.replaceAll("#include <lightFieldSlice>", aboutFieldAtlas)
    .replaceAll("#include <getScatter>", aboutScatter).replaceAll("#include <getBlueNoise>", noiseShader);
  const simUniforms = {
    u_simPrevPosLifeTexture: current, u_simDefaultPosLifeTexture: { value: defaultTexture },
    u_introDeltaTime: { value: 1 / 60 }, u_noiseTime: { value: 0 }, u_noiseScale: { value: 0 },
    u_noiseStableFactor: stable, u_lightPosition: { value: new THREE.Vector3(0, 8, 0) },
  };
  const simMaterial = new THREE.ShaderMaterial({ uniforms: simUniforms, vertexShader: screenVertex, fragmentShader: aboutParticleSimulation, depthTest: false, depthWrite: false });
  const filterMaterial = new THREE.ShaderMaterial({ uniforms: {
    ...fieldUniforms, u_prevSliceTexture: { value: fields[0].texture }, u_drawnSliceTexture: { value: drawn.texture },
  }, vertexShader: screenVertex, fragmentShader: expand(aboutFieldFilter), depthTest: false, depthWrite: false });
  const quadGeometry = new THREE.PlaneGeometry(2, 2), screen = new THREE.Scene();
  const quad = new THREE.Mesh(quadGeometry, simMaterial); quad.frustumCulled = false; screen.add(quad);
  const orthographic = new THREE.Camera();
  const splatGeometry = new THREE.BufferGeometry(); splatGeometry.setAttribute("position", new THREE.BufferAttribute(simUv, 3));
  const splatMaterial = new THREE.ShaderMaterial({ uniforms: { ...fieldUniforms, u_simCurrPosLifeTexture: current, u_noiseStableFactor: stable },
    vertexShader: expand(aboutFieldSplatVertex).replace("attribute vec3 position;", ""), fragmentShader: aboutFieldSplatFragment, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendEquation: THREE.MaxEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    blendEquationAlpha: THREE.MaxEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
  });
  const splatScene = new THREE.Scene(), splats = new THREE.Points(splatGeometry, splatMaterial); splats.frustumCulled = false; splatScene.add(splats);
  const particleUniforms = {
    ...fieldUniforms, ...scatterUniforms, u_simCurrPosLifeTexture: current, u_simTextureSize: { value: new THREE.Vector2(width, height) },
    u_sceneHideRatio: { value: 0 }, u_noiseStableFactor: stable, u_isEmissive: { value: 0 }, u_emissiveRatio: { value: 0 },
    u_contrast: { value: 1 }, u_opacity: { value: 1 },
  };
  const particleMaterial = new THREE.ShaderMaterial({ uniforms: particleUniforms, vertexShader: expand(aboutParticleVertex), fragmentShader: expand(aboutParticleFragment), side: THREE.DoubleSide });
  const emissiveMaterial = new THREE.ShaderMaterial({ uniforms: { ...particleUniforms, u_isEmissive: { value: 1 } },
    vertexShader: expand(aboutParticleVertex), fragmentShader: expand(aboutParticleFragment), side: THREE.DoubleSide });
  const geometries = [new THREE.InstancedBufferGeometry(), new THREE.InstancedBufferGeometry()];
  for (let k = 0; k < 2; k++) {
    const coords = new Float32Array((k === 1 ? height : count - height) * 2);
    for (let i = 0, j = 0; i < count; i++) if ((i % width === 0) === (k === 1)) { coords[j++] = simUv[i * 3]; coords[j++] = simUv[i * 3 + 1]; }
    geometries[k].setAttribute("simUv", new THREE.InstancedBufferAttribute(coords, 2));
    geometries[k].instanceCount = coords.length / 2;
  }
  const meshes = [new THREE.Mesh(geometries[0], particleMaterial), new THREE.Mesh(geometries[1], emissiveMaterial)];
  for (const mesh of meshes) { mesh.frustumCulled = false; mesh.renderOrder = 5; group.add(mesh); }
  const motionPlane = new THREE.PlaneGeometry(1, 1), motionGeometry = new THREE.InstancedBufferGeometry();
  for (const name of Object.keys(motionPlane.attributes)) motionGeometry.setAttribute(name, motionPlane.getAttribute(name)); motionGeometry.setIndex(motionPlane.index);
  motionGeometry.setAttribute("simUv", new THREE.InstancedBufferAttribute(simUv, 3)); motionGeometry.instanceCount = count;
  const motionMaterial = new THREE.ShaderMaterial({ uniforms: { u_simCurrPosLifeTexture: current, u_simPrevPosLifeTexture: previous,
    u_simTextureSize: { value: new THREE.Vector2(width, height) }, u_strength: { value: 1 }, u_aspect: { value: 1.88 } },
    vertexShader: aboutMotionVertex, fragmentShader: aboutMotionFragment, depthWrite: false,
  });
  const motionScene = new THREE.Scene(), motionMesh = new THREE.Mesh(motionGeometry, motionMaterial); motionMesh.frustumCulled = false; motionScene.add(motionMesh);
  const fallbackSphere = new THREE.IcosahedronGeometry(1, 0);
  const lods = new Map<string, THREE.BufferGeometry>([["m", fallbackSphere], ["s", fallbackSphere], ["xs", fallbackSphere], ["l", fallbackSphere]]);
  function selectGeometry(id: string, k: number) {
    const geo = lods.get(id) ?? fallbackSphere;
    for (const name of ["position", "normal"]) geometries[k].setAttribute(name, geo.getAttribute(name));
    geometries[k].setIndex(geo.index);
  }
  selectGeometry("m", 0); selectGeometry("l", 1);
  const noise = Array.from({ length: 512 }, () => random() - .5);
  const noiseAt = (x: number) => { const i = Math.floor(x), f = x - i, a = noise[i & 511]; return a + (noise[(i + 1) & 511] - a) * f * f * (3 - 2 * f); };
  const fbm = (x: number) => .5 * noiseAt(x) + .25 * noiseAt(x * 2) + .125 * noiseAt(x * 4);
  let index = 0, fieldIndex = 0, lastTime = -1, noiseTime = 1.47, noiseScaleTime = .93, stabilityTime = .26, stability = .7, warmed = false, disposed = false;
  const oldClear = new THREE.Color();
  return {
    group, count, scatterUniforms, stable,
    setGeometry(id: string, geometry: THREE.BufferGeometry) { if (disposed) { geometry.dispose(); return; } lods.set(id, geometry); },
    update(time: number, intro: number, opacity: number, frozen: boolean) {
      group.visible = opacity > .001;
      if (!group.visible || disposed) { lastTime = time; return; }
      particleUniforms.u_opacity.value = opacity;
      particleUniforms.u_sceneHideRatio.value = clamp((intro - .85) / .15);
      particleUniforms.u_emissiveRatio.value = clamp(intro / .2) * .75;
      scatterUniforms.u_lightScatterPowInv.value = THREE.MathUtils.lerp(2, .7, clamp(intro / .2));
      if (intro > .7) scatterUniforms.u_lightScatterPowInv.value = THREE.MathUtils.lerp(.7, .4, clamp((intro - .7) / .15));
      scatterUniforms.u_lightScatterRatio.value = 1 - Math.pow(clamp((intro - .7) / .15), 3);
      selectGeometry(intro < .3 ? "m" : intro < .7 ? "s" : "xs", 0);
      selectGeometry(intro < .3 ? "l" : intro < .7 ? "m" : "xs", 1);
      const elapsed = lastTime < 0 ? 1 / 60 : Math.max(0, Math.min(.1, time - lastTime)); lastTime = time;
      if (warmed && (frozen || reduced)) return;
      const previousTarget = renderer.getRenderTarget(), oldAuto = renderer.autoClear, alpha = renderer.getClearAlpha();
      renderer.getClearColor(oldClear);
      try {
        renderer.autoClear = true; renderer.setClearColor(0, 0);
        // Seed a developed volume before exposing it; subsequent integration is
        // bounded and frame-rate independent. Reduced motion freezes this pose.
        const steps = warmed ? Math.max(1, Math.ceil(elapsed * 60)) : 24;
        const dt = warmed ? elapsed / steps : 1 / 30;
        for (let i = 0; i < steps; i++) {
          noiseTime += dt * .4; noiseScaleTime += dt; stabilityTime += dt * .5;
          stability += .05 * Math.abs(fbm(stabilityTime)) * dt * 60;
          stable.value = clamp(intro / .4) * THREE.MathUtils.smoothstep(.5 + .5 * Math.sin(stability), .9, .95);
          simUniforms.u_noiseTime.value = noiseTime; simUniforms.u_noiseScale.value = Math.abs(fbm(noiseScaleTime)) * 10;
          simUniforms.u_introDeltaTime.value = dt;
          previous.value = current.value;
          quad.material = simMaterial; renderer.setRenderTarget(positions[index]); renderer.render(screen, orthographic);
          current.value = positions[index].texture; index = 1 - index;
        }
        renderer.setRenderTarget(drawn); renderer.render(splatScene, orthographic);
        quad.material = filterMaterial;
        filterMaterial.uniforms.u_prevSliceTexture.value = fields[fieldIndex].texture;
        fieldIndex = 1 - fieldIndex; renderer.setRenderTarget(fields[fieldIndex]); renderer.render(screen, orthographic);
        fieldUniforms.u_lightFieldSlicedTexture.value = fields[fieldIndex].texture;
        warmed = true;
      } finally { renderer.setRenderTarget(previousTarget); renderer.autoClear = oldAuto; renderer.setClearColor(oldClear, alpha); }
    },
    renderMotion(camera: THREE.PerspectiveCamera, output: THREE.WebGLRenderTarget) {
      const saved = renderer.getRenderTarget(), auto = renderer.autoClear, alpha = renderer.getClearAlpha();
      renderer.getClearColor(oldClear);
      try {
        motionMaterial.uniforms.u_aspect.value = camera.aspect;
        renderer.autoClear = true; renderer.setClearColor(new THREE.Color(.5, .5, .5), 1);
        renderer.setRenderTarget(output); renderer.render(motionScene, camera);
      } finally { renderer.setRenderTarget(saved); renderer.autoClear = auto; renderer.setClearColor(oldClear, alpha); }
    },
    dispose() {
      if (disposed) return; disposed = true; group.removeFromParent();
      for (const rt of [...positions, ...fields, drawn]) rt.dispose();
      for (const material of [simMaterial, filterMaterial, splatMaterial, particleMaterial, emissiveMaterial, motionMaterial]) material.dispose();
      for (const geo of [...new Set(lods.values()), ...geometries, splatGeometry, quadGeometry, motionPlane, motionGeometry]) geo.dispose();
      defaultTexture.dispose();
    },
  };
}
