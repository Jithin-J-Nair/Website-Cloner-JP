import * as THREE from "three";
import { loadLusionBuf, type ParsedBufData } from "@/lib/lusion-buf-loader";
import { GOAL_WORLD_SCALE } from "./GoalReferenceWorlds";
import { endDiamondVertex, endDiamondFragment, endStickerVertex, endStickerFragment, GOAL_DIAMOND_PLANES, GOAL_STICKER_RECTS } from "./GoalReferenceEndShaders";

/** Archived string hash + sfc32. Axes/sticker phases used unseeded source random;
 * separate fixed streams keep our seeks/replays stable without changing diamond placement. */
export function createGoalEndRandom(seed: string) {
  let a = 1779033703, b = 3144134277, c = 1013904242, d = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const ch = seed.charCodeAt(i);
    a = b ^ Math.imul(a ^ ch, 597399067); b = c ^ Math.imul(b ^ ch, 2869860233);
    c = d ^ Math.imul(c ^ ch, 951274213); d = a ^ Math.imul(d ^ ch, 2716044179);
  }
  [a, b, c, d] = [Math.imul(c ^ (a >>> 18), 597399067), Math.imul(d ^ (b >>> 22), 2869860233),
    Math.imul(a ^ (c >>> 17), 951274213), Math.imul(b ^ (d >>> 19), 2716044179)];
  return () => {
    a |= 0; b |= 0; c |= 0; d |= 0;
    const n = (((a + b) | 0) + d) | 0;
    d = (d + 1) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11); c = (c + n) | 0;
    return (n >>> 0) / 4294967296;
  };
}

export function createGoalDiamondGeometry(source: ParsedBufData) {
  const geometry = new THREE.InstancedBufferGeometry();
  for (const [name, attribute] of Object.entries(source.geometry.attributes)) geometry.setAttribute(name, attribute.clone());
  geometry.setIndex(source.geometry.index?.clone() || null);
  const random = createGoalEndRandom("diamonds-3"), axesRandom = createGoalEndRandom("diamond-axes");
  const positions = new Float32Array(64 * 3), axes = new Float32Array(64 * 3), phases = new Float32Array(64 * 4);
  for (let i = 0; i < 64; i++) {
    positions.set([16 * (random() * 2 - 1), 16 * (random() * 2 - 1), 19 - (63 - i) / 63 * 8], i * 3);
    const z = axesRandom() * 2 - 1, angle = axesRandom() * Math.PI * 2, r = Math.sqrt(1 - z * z);
    axes.set([r * Math.cos(angle), r * Math.sin(angle), z], i * 3);
    for (let j = 0; j < 4; j++) phases[i * 4 + j] = random();
  }
  geometry.setAttribute("a_instancePosition", new THREE.InstancedBufferAttribute(positions, 3));
  geometry.setAttribute("a_instanceRotationAxis", new THREE.InstancedBufferAttribute(axes, 3));
  geometry.setAttribute("a_instanceRand", new THREE.InstancedBufferAttribute(phases, 4));
  geometry.instanceCount = 64;
  return geometry;
}

export function createGoalStickerGeometry() {
  const geometry = new THREE.InstancedBufferGeometry(), plane = new THREE.PlaneGeometry(1, 1);
  for (const [name, attribute] of Object.entries(plane.attributes)) geometry.setAttribute(name, attribute.clone());
  geometry.setIndex(plane.index?.clone() || null); plane.dispose();
  const ids = new Float32Array(26), uv = new Float32Array(26 * 4), phases = new Float32Array(26 * 4);
  const random = createGoalEndRandom("goal-sticker-phases");
  GOAL_STICKER_RECTS.forEach((rect, i) => {
    ids[i] = i / 26;
    uv.set([rect.x / 1465, rect.y / 1024, rect.w / 1465, rect.h / 1024], i * 4);
    for (let j = 0; j < 4; j++) phases[i * 4 + j] = random();
  });
  geometry.setAttribute("instanceId", new THREE.InstancedBufferAttribute(ids, 1));
  geometry.setAttribute("instanceUvInfo", new THREE.InstancedBufferAttribute(uv, 4));
  geometry.setAttribute("instanceRands", new THREE.InstancedBufferAttribute(phases, 4));
  geometry.instanceCount = 26;
  return geometry;
}

/** No extra animation/scroll owner. The existing cinematic supplies time, aspect
 * and wait ratio; RGB/alpha blending matches the native bloom-mask contract. */
export function createGoalReferenceEnd(track: <T extends { dispose: () => void }>(resource: T) => T, isMobile: boolean) {
  const group = new THREE.Group(); group.name = "ReferenceEndParticles"; group.scale.setScalar(GOAL_WORLD_SCALE);
  const time = { value: 0 }, aspect = { value: 1 }, active = { value: 0 }, bg = { value: new THREE.Color(0) };
  const diamondMaterial = track(new THREE.ShaderMaterial({
    vertexShader: endDiamondVertex, fragmentShader: endDiamondFragment,
    uniforms: { u_time: time, u_aspect: aspect, u_activeRatio: active, u_bgColor: bg,
      u_color: { value: new THREE.Color().setRGB(104 / 255, 154 / 255, 1) }, u_planes: { value: [...GOAL_DIAMOND_PLANES] } },
    transparent: true, blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.ZeroFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
  }));
  let disposed = false, diamonds: THREE.Mesh | undefined, error: string | null = null, atlasReady = false;
  let resolveAtlas: () => void = () => {};
  const atlasLoaded = new Promise<void>(resolve => { resolveAtlas = resolve; });
  const atlas = track(new THREE.TextureLoader().load(
    `/assets/textures/tunnels/${isMobile ? "stickers_low.png" : "stickers.png"}`,
    () => { atlasReady = true; resolveAtlas(); }, undefined,
    (reason: unknown) => { error = String(reason); resolveAtlas(); }
  ));
  // Artist RGB is already display space. Do not decode/re-encode it through the PBR pipeline.
  atlas.colorSpace = THREE.NoColorSpace;
  const stickerMaterial = track(new THREE.ShaderMaterial({
    vertexShader: endStickerVertex, fragmentShader: endStickerFragment, defines: { COUNT: 26 },
    uniforms: { u_time: time, u_aspect: aspect, u_activeRatio: active, u_bgColor: bg,
      u_texture: { value: atlas }, u_textureSize: { value: new THREE.Vector2(1465, 1024) } },
    transparent: true, blending: THREE.CustomBlending,
    blendEquation: THREE.AddEquation, blendSrc: THREE.SrcAlphaFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendEquationAlpha: THREE.AddEquation, blendSrcAlpha: THREE.ZeroFactor, blendDstAlpha: THREE.ZeroFactor,
  }));
  const stickers = new THREE.Mesh(track(createGoalStickerGeometry()), stickerMaterial);
  stickers.frustumCulled = false; stickers.renderOrder = 6; group.add(stickers);
  const ready = Promise.all([loadLusionBuf("/assets/models/tunnels/diamond.buf"), atlasLoaded]).then(([source]) => {
    if (disposed) return;
    diamonds = new THREE.Mesh(track(createGoalDiamondGeometry(source)), diamondMaterial);
    diamonds.frustumCulled = false; diamonds.renderOrder = 5; group.add(diamonds);
  }).catch((reason: unknown) => { error = String(reason); });
  track({ dispose() { disposed = true; group.clear(); } });
  return { group, ready, diamondMaterial, stickerMaterial,
    get loaded() { return Boolean(diamonds && atlasReady); }, get error() { return error; },
    get diamondCount() { return diamonds ? 64 : 0; }, stickerCount: 26,
    update(elapsed: number, wait: number, viewportAspect: number) {
      time.value = elapsed; aspect.value = viewportAspect;
      active.value = THREE.MathUtils.clamp(wait / .2, 0, 1);
      group.visible = active.value > 0;
    },
  };
}

/** Source 5×23 face atlas and RGB subpixel LED card, rather than drawn eyes/grin. */
export function createGoalReferenceVisor(track: <T extends { dispose: () => void }>(resource: T) => T) {
  let resolveReady: () => void = () => {};
  const ready = new Promise<void>(resolve => { resolveReady = resolve; });
  let loaded = false;
  const atlas = track(new THREE.TextureLoader().load("/assets/textures/tunnels/astronaut/face.png",
    () => { loaded = true; resolveReady(); }, undefined, () => resolveReady()));
  atlas.minFilter = atlas.magFilter = THREE.NearestFilter; atlas.colorSpace = THREE.NoColorSpace;
  const subpixels = new Uint8Array(11 * 11 * 4);
  for (let y = 0; y < 11; y++) for (let x = 0; x < 11; x++) {
    const i = (y * 11 + x) * 4; subpixels[i + 3] = 255;
    if (y >= 1 && y <= 9 && x >= 1 && x <= 9) subpixels[i + Math.floor((x - 1) / 3)] = 255;
  }
  const led = track(new THREE.DataTexture(subpixels, 11, 11)); led.minFilter = led.magFilter = THREE.LinearFilter; led.needsUpdate = true;
  const material = track(new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false, blending: THREE.CustomBlending,
    blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneFactor,
    uniforms: { u_texture: { value: atlas }, u_led: { value: led }, u_offset: { value: new THREE.Vector2() }, u_opacity: { value: 0 } },
    vertexShader: "varying vec2 v_uv;void main(){v_uv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}",
    fragmentShader: `varying vec2 v_uv;uniform sampler2D u_texture,u_led;uniform vec2 u_offset;uniform float u_opacity;
      void main(){vec4 texel=texture2D(u_texture,v_uv/vec2(5.,23.)+u_offset);
      vec3 led=pow(texture2D(u_led,fract(v_uv*vec2(20.,15.))).rgb,vec3(2.2));
      float mask=dot(led,vec3(.8666667,.8666667,1.)*texel.r);
      gl_FragColor=vec4(pow(led,vec3(1./2.2))*mask*2.5,texel.r*.35)*u_opacity;}`,
  }));
  const mesh = new THREE.Mesh(track(new THREE.PlaneGeometry(.2, .15)), material);
  mesh.frustumCulled = false; mesh.renderOrder = 7; mesh.visible = false;
  return { mesh, material, ready, get loaded() { return loaded; },
    update(seconds: number, opacity: number) {
      const frame = Math.floor(Math.max(0, seconds) * 10) % 120;
      material.uniforms.u_offset.value.set((frame % 5) / 5, (23 - Math.floor(frame / 5)) / 23);
      material.uniforms.u_opacity.value = opacity; mesh.visible = loaded && opacity > .005;
    },
  };
}
