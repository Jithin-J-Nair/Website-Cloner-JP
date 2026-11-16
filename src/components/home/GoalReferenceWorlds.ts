import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { loadLusionBuf, type ParsedBufData } from "@/lib/lusion-buf-loader";
import { blackVertex, blackFragment, whiteVertex, whiteFragment } from "./GoalReferenceShaders";

export const GOAL_WORLD_SCALE = .208;
const clamp = THREE.MathUtils.clamp;
const fit = (n: number, a: number, b: number, x = 0, y = 1) => THREE.MathUtils.lerp(x, y, clamp((n - a) / (b - a), 0, 1));
const color1 = ["#0d2b27", "#ba0000", "#00b5a6", "#0099ff"];
const color2 = ["#8c8c8c", "#008e6b", "#7e7f05", "#ff0000"];

/** The existing owner supplies a single scroll/playback coordinate. These are
 * native BLACK and WHITE sub-ratios, not a second autonomous animation clock. */
export function goalWorldRatios(tunnel: number, shatter: number) {
  const black = fit(tunnel, 0, .815);
  const white = fit(tunnel, .815, 1);
  return { black, white, drop: clamp(shatter, 0, 1), transform: 1 - Math.cos(fit(black, .6, 1) * Math.PI / 2) };
}

/** Native blue flight has weight 2, followed by a weight-1 monitor pull-back.
 * Do not drive flight turbulence, aperture projection or bloom with the later
 * DOM monitor easing: that leaves a five-unit displacement alive in the corridor.
 */
export function goalWhiteFlightState(white: number) {
  const progress = clamp(white, 0, 1), frame = clamp(progress * 1.5, 0, 1);
  const moving = Math.min(progress, .3);
  // Integrate the changing frequency instead of multiplying absolute time by it.
  // Start at the existing black-flight terminal phases (10*.7 and 10*.15).
  const positionPhase = 7 + 3 * (.5 * moving - .5 * moving * moving + .2 * Math.max(0, progress - .3));
  const rotationPhase = 1.5 + 3 * (.4 * moving - 5 / 12 * moving * moving + .15 * Math.max(0, progress - .3));
  return {
    frame, frameOut: clamp(progress * 3 - 2, 0, 1),
    positionAmplitude: 5 * (1 - fit(frame, 0, .75)),
    rotationAmplitude: 15 * (1 - fit(frame, 0, .75)),
    bloom: fit(frame, 0, .05, 4, 2), positionPhase, rotationPhase,
  };
}

/** The captured 15-frame break starts immediately; no second impact delay. */
export function goalGlassState(drop: number, frames: number) {
  const progress = clamp(drop, 0, 1);
  return { visible: progress > 0 && progress < 1,
    frame: Math.sin(progress * Math.PI / 2) * Math.max(0, frames - 1),
    fragmentScale: 1 - fit(progress, .75, 1) };
}

// Integrate the reference pulse/linear rates along the authored playhead.
// Multiplying the current rate by elapsed time adds artificial acceleration.
const integrationSteps = 4096;
const pulseIntegral = new Float64Array(integrationSteps + 1), linearIntegral = new Float64Array(integrationSteps + 1);
for (let i = 1; i <= integrationSteps; i++) {
  const b = (i - .5) / integrationSteps, transform = 1 - Math.cos(fit(b, .6, 1) * Math.PI / 2), dt = 10 / integrationSteps;
  pulseIntegral[i] = pulseIntegral[i - 1] + dt * fit(b, .1, .3) * fit(transform, 0, .25, 1, .5);
  linearIntegral[i] = linearIntegral[i - 1] + dt * fit(transform, 0, .25, 1.5, 1);
}
export function goalBlackTravelOffset(ratio: number) {
  const index = clamp(ratio, 0, 1) * integrationSteps, from = Math.floor(index), to = Math.min(integrationSteps, from + 1), alpha = index - from;
  const pulse = THREE.MathUtils.lerp(pulseIntegral[from], pulseIntegral[to], alpha), linear = THREE.MathUtils.lerp(linearIntegral[from], linearIntegral[to], alpha);
  const cycle = Math.floor(pulse), f = pulse - cycle, cubic = f < .5 ? 4 * f ** 3 : 1 - (-2 * f + 2) ** 3 / 2;
  return (cycle + cubic + linear) * 20 + clamp(ratio, 0, 1) * 200;
}

/** Instancing consumes the encoded base verbatim. Its x coordinate is a block
 * ID, y is multiplied by the stored height, and center is the reveal anchor.
 * CPU-decoding it into an ordinary girder destroys the animated greeble field. */
export function createGoalBlackGeometry(base: ParsedBufData, structure: ParsedBufData) {
  const geometry = new THREE.InstancedBufferGeometry();
  for (const [name, attribute] of Object.entries(base.geometry.attributes)) geometry.setAttribute(name, attribute.clone());
  geometry.setIndex(base.geometry.index?.clone() || null);
  for (const [name, source] of [["instancePos", "position"], ["instanceGridIds", "gridIds"], ["instanceAxis", "rotAxis"]]) {
    geometry.setAttribute(name, new THREE.InstancedBufferAttribute(new Float32Array(structure.attributes[source]), 3));
  }
  geometry.instanceCount = structure.header.vertexCount;
  return geometry;
}
export function createGoalWhiteGeometry(source: ParsedBufData) {
  const geometry = new THREE.InstancedBufferGeometry();
  for (const [name, attribute] of Object.entries(source.geometry.attributes)) geometry.setAttribute(name, attribute.clone());
  geometry.setIndex(source.geometry.index?.clone() || null);
  geometry.setAttribute("a_instanceId", new THREE.InstancedBufferAttribute(Float32Array.from({ length: 16 }, (_, i) => i), 1));
  geometry.instanceCount = 16;
  return geometry;
}

/** Captured frame-major rigid data stays on the GPU; no per-frame spline
 * reinterpretation, atlas padding, spread multiplier or resampled rotations. */
export function createGoalGlassAnimationTextures(animation: ParsedBufData, shardCount: number) {
  const frames = animation.header.vertexCount / shardCount;
  if (!Number.isInteger(frames) || animation.attributes.orient.length !== shardCount * frames * 4) throw new Error("Unexpected glass animation layout");
  const positions = new Float32Array(shardCount * frames * 4);
  for (let i = 0; i < shardCount * frames; i++) positions.set(animation.attributes.position.subarray(i * 3, i * 3 + 3), i * 4);
  const position = new THREE.DataTexture(positions, shardCount, frames, THREE.RGBAFormat, THREE.FloatType);
  const orient = new THREE.DataTexture(new Float32Array(animation.attributes.orient), shardCount, frames, THREE.RGBAFormat, THREE.FloatType);
  position.needsUpdate = orient.needsUpdate = true;
  return { position, orient, frames };
}

/** Source-shaped world construction. No listeners/RAF, fake central vortex,
 * decorative glass cages, duplicated shaft repeats, or extruded wall rings. */
export function createGoalReferenceWorlds(track: <T extends { dispose: () => void }>(resource: T) => T) {
  const black = new THREE.Group(), white = new THREE.Group();
  black.name = "ReferenceBlackTunnel"; white.name = "ReferenceWhiteTunnel";
  black.scale.setScalar(GOAL_WORLD_SCALE); white.scale.setScalar(GOAL_WORLD_SCALE);
  black.visible = white.visible = false;
  const makeTarget = () => track(new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true, type: THREE.UnsignedByteType }));
  let feedbackRead = makeTarget(), feedbackWrite = makeTarget();
  feedbackRead.texture.wrapS = feedbackRead.texture.wrapT = feedbackWrite.texture.wrapS = feedbackWrite.texture.wrapT = THREE.MirroredRepeatWrapping;
  const copyMaterial = track(new THREE.ShaderMaterial({ depthTest: false, depthWrite: false,
    uniforms: { source: { value: null as THREE.Texture | null } },
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: `varying vec2 vUv;uniform sampler2D source;void main(){gl_FragColor=texture2D(source,vUv);}` }));
  const copyQuad = new FullScreenQuad(copyMaterial); track({ dispose() { copyQuad.dispose(); } });
  const feedbackScene = new THREE.Scene();
  let feedbackClone: THREE.Group | undefined, disposed = false;
  track({ dispose() { disposed = true; feedbackScene.clear(); } });
  const blackUniforms = {
    u_time: { value: 1 }, u_resolution: { value: new THREE.Vector2(1, 1) },
    u_blackTunnelTransformRatio: { value: 0 }, u_showRatio: { value: 1 }, u_offsetZ: { value: 0 },
    u_outBloomFromToStrength: { value: new THREE.Vector3(0, 70, 0) },
    u_feedbackTexture: { value: feedbackRead.texture },
    u_greebleArmbTexture: { value: null as THREE.Texture | null }, u_greebleBaseTexture: { value: null as THREE.Texture | null },
    u_greebleNormalTexture: { value: null as THREE.Texture | null },
    u_color1: { value: new THREE.Color().setStyle(color1[0], THREE.LinearSRGBColorSpace) }, u_color2: { value: new THREE.Color().setStyle(color2[0], THREE.LinearSRGBColorSpace) },
  };
  const whiteUniforms = {
    u_time: blackUniforms.u_time, u_ratio: { value: 0 }, u_ratioInverse: { value: 1 },
    u_texture: { value: null as THREE.Texture | null }, u_fbm: { value: new THREE.Vector3() },
  };
  const whiteMaterials: THREE.ShaderMaterial[] = [];
  const maskMaterial = track(new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false, depthTest: false,
    stencilWrite: true, stencilRef: 2, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp }));
  const monitorStencilMask = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), maskMaterial);
  monitorStencilMask.renderOrder = -90; monitorStencilMask.visible = false; monitorStencilMask.frustumCulled = false;
  let clipped = false;
  const setMonitorClip = (value: boolean) => {
    clipped = value;
    for (const material of whiteMaterials) {
      material.stencilWrite = value; material.stencilRef = 2; material.stencilFunc = THREE.EqualStencilFunc;
      material.stencilFail = material.stencilZFail = material.stencilZPass = THREE.KeepStencilOp;
    }
  };
  const loader = new THREE.TextureLoader();
  const texture = async (path: string) => {
    const t = track(await loader.loadAsync(`/assets/textures/tunnels/${path}`));
    t.colorSpace = THREE.NoColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; return t;
  };
  const geometry = (name: string) => loadLusionBuf(`/assets/models/tunnels/${name}.buf`);
  let blackReady = false, whiteReady = false, error: string | null = null;
  const ready = Promise.allSettled([
    Promise.all([geometry("grid_base_hd"), geometry("grid_structure_hd"), geometry("grid_base_ld"), geometry("grid_structure_ld"),
      texture("grids/greeble_arm.webp"), texture("grids/greeble_base.webp"), texture("grids/greeble_nor.webp")]).then(([hd, hdGrid, ld, ldGrid, arm, base, normal]) => {
      if (disposed) return;
      blackUniforms.u_greebleArmbTexture.value = arm; blackUniforms.u_greebleBaseTexture.value = base; blackUniforms.u_greebleNormalTexture.value = normal;
      for (const [source, placement, detailed] of [[ld, ldGrid, false], [hd, hdGrid, true]] as const) {
        const material = track(new THREE.ShaderMaterial({ uniforms: blackUniforms, defines: detailed ? { GRID_SIZE: 20, IS_HD: 1 } : { GRID_SIZE: 20 },
          vertexShader: blackVertex, fragmentShader: blackFragment, side: THREE.DoubleSide, depthWrite: true }));
        const mesh = new THREE.Mesh(track(createGoalBlackGeometry(source, placement)), material);
        mesh.name = detailed ? "CapturedInnerLattice" : "CapturedOuterLattice"; mesh.frustumCulled = false; mesh.renderOrder = detailed ? 2 : 1; black.add(mesh);
      }
      feedbackClone = black.clone(true); feedbackClone.visible = true; feedbackScene.add(feedbackClone); blackReady = true;
    }),
    Promise.all([geometry("tunnel_block_base"), geometry("tunnel_block_wall"), texture("white_block.webp")]).then(([base, wall, map]) => {
      if (disposed) return; whiteUniforms.u_texture.value = map;
      for (const [source, isWall] of [[base, false], [wall, true]] as const) {
        const material = track(new THREE.ShaderMaterial({ uniforms: whiteUniforms, defines: isWall ? { BLOCK_COUNT: 16, IS_WALL: 1 } : { BLOCK_COUNT: 16 },
          vertexShader: whiteVertex, fragmentShader: whiteFragment }));
        const mesh = new THREE.Mesh(track(createGoalWhiteGeometry(source)), material);
        mesh.name = isWall ? "ReferenceVoronoiWall" : "ReferenceBlockBase"; mesh.frustumCulled = false; white.add(mesh); whiteMaterials.push(material);
      }
      setMonitorClip(clipped); whiteReady = true;
    }),
  ]).then(results => {
    const failure = results.find(result => result.status === "rejected");
    if (failure?.status === "rejected") error = String(failure.reason);
  });
  return {
    black, white, monitorStencilMask, blackUniforms, whiteUniforms, ready, setMonitorClip,
    get blackReady() { return blackReady; }, get whiteReady() { return whiteReady; }, get error() { return error; },
    update(tunnel: number, shatter: number, time: number, reduced: boolean) {
      const r = goalWorldRatios(tunnel, shatter), b = r.black;
      black.visible = tunnel > 0 && tunnel < .815; white.visible = tunnel >= .815 && shatter < 1;
      black.position.z = -80 * (1 - fit(b, 0, .2)) * GOAL_WORLD_SCALE;
      blackUniforms.u_time.value = reduced ? 1 : time;
      blackUniforms.u_showRatio.value = b <= 0 ? 0 : 2 ** (10 * (fit(b, 0, .1) - 1));
      blackUniforms.u_blackTunnelTransformRatio.value = r.transform;
      blackUniforms.u_offsetZ.value = goalBlackTravelOffset(b);
      const phase = Math.min(3, Math.round(4 * fit(b, .2, 1)));
      blackUniforms.u_color1.value.setStyle(color1[phase], THREE.LinearSRGBColorSpace); blackUniforms.u_color2.value.setStyle(color2[phase], THREE.LinearSRGBColorSpace);
      const bloom = blackUniforms.u_outBloomFromToStrength.value;
      bloom.z = b < .75 ? fit(b, .65, .75, 0, .2) : fit(b, .75, .85, .2, .15);
      bloom.x = b > .9 ? fit(b, .9, 1, 60, 30) : fit(b, .75, .85, 20, 60);
      whiteUniforms.u_ratio.value = r.white; whiteUniforms.u_ratioInverse.value = 1 - r.white;
      whiteUniforms.u_fbm.value.set(goalFbm(time + 311), goalFbm(time + 193), goalFbm(time + 77)).multiplyScalar(2 / .75);
      return r;
    },
    captureFeedback(renderer: THREE.WebGLRenderer, source: THREE.Texture) {
      if (!black.visible || disposed) return;
      const target = renderer.getRenderTarget(), autoClear = renderer.autoClear;
      try {
        copyMaterial.uniforms.source.value = source; renderer.autoClear = false;
        renderer.setRenderTarget(feedbackWrite); copyQuad.render(renderer);
        [feedbackRead, feedbackWrite] = [feedbackWrite, feedbackRead]; blackUniforms.u_feedbackTexture.value = feedbackRead.texture;
      } finally { renderer.setRenderTarget(target); renderer.autoClear = autoClear; }
    },
    renderFeedback(renderer: THREE.WebGLRenderer, camera: THREE.Camera, stable = false) {
      if (!black.visible || !feedbackClone || disposed) return;
      const size = renderer.getDrawingBufferSize(new THREE.Vector2()), w = Math.max(1, Math.floor(size.x / 4)), h = Math.max(1, Math.floor(size.y / 4));
      const previousTarget = renderer.getRenderTarget(), color = renderer.getClearColor(new THREE.Color()), alpha = renderer.getClearAlpha();
      const fullResolution = blackUniforms.u_resolution.value.clone();
      try {
        for (const target of [feedbackRead, feedbackWrite]) if (target.width !== w || target.height !== h) {
          target.setSize(w, h); renderer.setRenderTarget(target); renderer.setClearColor(0, 1); renderer.clear();
        }
        blackUniforms.u_feedbackTexture.value = feedbackRead.texture;
        if (!stable) return;
        feedbackClone.position.copy(black.position); feedbackClone.scale.copy(black.scale);
        blackUniforms.u_resolution.value.set(w, h);
        if (stable) { renderer.setRenderTarget(feedbackRead); renderer.setClearColor(0, 1); renderer.clear(); }
        // Static/reduced-motion previews use two fixed feedback iterations, so
        // reverse seeks are pixel-deterministic rather than history-dependent.
        for (let i = 0; i < (stable ? 2 : 1); i++) {
          blackUniforms.u_feedbackTexture.value = feedbackRead.texture;
          renderer.setRenderTarget(feedbackWrite); renderer.setClearColor(0, 1); renderer.render(feedbackScene, camera);
          [feedbackRead, feedbackWrite] = [feedbackWrite, feedbackRead]; blackUniforms.u_feedbackTexture.value = feedbackRead.texture;
        }
      } finally {
        blackUniforms.u_resolution.value.copy(fullResolution); renderer.setRenderTarget(previousTarget); renderer.setClearColor(color, alpha);
      }
    },
  };
}

/** Source Simple1DNoise: smooth 512-entry value noise, three FBM octaves,
 * normalization 1/.75. A fixed seed makes seeks reversible; the live original
 * uses Math.random at startup, so its particular tumbling path is not recoverable. */
const noiseTable = Float32Array.from({ length: 512 }, (_, i) => {
  let n = Math.imul(i + 91, 0x45d9f3b); n = Math.imul(n ^ n >>> 16, 0x45d9f3b);
  return ((n ^ n >>> 16) >>> 0) / 4294967296 - .5;
});
function valueNoise(time: number) {
  const i = Math.floor(time), f = time - i;
  return THREE.MathUtils.lerp(noiseTable[i & 511], noiseTable[(i + 1) & 511], f * f * (3 - 2 * f));
}
export function goalFbm(time: number) { return valueNoise(time) * .5 + valueNoise(time * 2) * .25 + valueNoise(time * 4) * .125; }
const brownianEuler = new THREE.Euler();
export function sampleGoalBrownian(time: number, seed: number, posAmplitude: number, rotAmplitude: number,
  posFrequency: number, rotFrequency: number, position: THREE.Vector3, rotation: THREE.Quaternion) {
  sampleGoalBrownianPhases(time * posFrequency, time * rotFrequency, seed, posAmplitude, rotAmplitude, position, rotation);
}

export function sampleGoalBrownianPhases(positionPhase: number, rotationPhase: number, seed: number,
  posAmplitude: number, rotAmplitude: number, position: THREE.Vector3, rotation: THREE.Quaternion) {
  const shift = -5713 + seed * 173;
  position.set(goalFbm(shift + positionPhase), goalFbm(shift + 137 + positionPhase), goalFbm(shift + 277 + positionPhase)).multiplyScalar(posAmplitude / .75);
  rotation.setFromEuler(brownianEuler.set(goalFbm(shift + 87 + rotationPhase) * rotAmplitude / .75,
    goalFbm(shift + 321 + rotationPhase) * rotAmplitude / .75, 0));
}
