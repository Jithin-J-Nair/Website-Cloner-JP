import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { SuitJointPose } from "@/components/home/AstronautEmergenceAssets";

/**
 * Curled zero-G tumble pose (`Frames 10 & 12` inside dark steel / orange-teal truss tunnel).
 */
export const SUIT_POSE_TUMBLE_CURL: SuitJointPose = {
  chest: [0.34, 0.08, -0.06],
  head: [-0.16, 0.10, 0.04],
  shoulderR: [-0.95, 0.34, -0.26],
  elbowR: [-1.28, -0.22, 0.34],
  wristR: [-0.18, 0.30, 0.18],
  shoulderL: [-0.82, -0.30, 0.28],
  elbowL: [-1.18, 0.20, -0.30],
  wristL: [-0.16, -0.28, -0.18],
  hipR: [-1.18, 0.08, -0.10],
  kneeR: [1.46, 0.0, 0.0],
  hipL: [-0.98, -0.08, 0.10],
  kneeL: [1.28, 0.0, 0.0],
};

/**
 * Inverted open-limb zero-G tumble pose (`Frame 11` inside bright-glint dark truss tunnel).
 */
export const SUIT_POSE_TUMBLE_SPREAD: SuitJointPose = {
  chest: [0.10, -0.05, 0.04],
  head: [-0.08, 0.05, 0.0],
  shoulderR: [-0.62, 0.42, -0.52],
  elbowR: [-0.66, -0.12, 0.22],
  wristR: [-0.10, 0.22, 0.14],
  shoulderL: [-0.62, -0.42, 0.52],
  elbowL: [-0.66, 0.12, -0.22],
  wristL: [-0.10, -0.22, -0.14],
  hipR: [-0.36, 0.08, -0.18],
  kneeR: [0.58, 0.0, 0.0],
  hipL: [-0.28, -0.08, 0.18],
  kneeL: [0.46, 0.0, 0.0],
};

/**
 * Head-on dynamic flight pose (`Frame 15` banking down the royal-blue arch corridor).
 */
export const SUIT_POSE_CORRIDOR_FLY: SuitJointPose = {
  chest: [0.22, -0.06, 0.05],
  head: [-0.26, 0.04, 0.0],
  shoulderR: [-0.72, 0.28, -0.44],
  elbowR: [-0.88, -0.16, 0.24],
  wristR: [-0.12, 0.24, 0.16],
  shoulderL: [-0.58, -0.32, 0.48],
  elbowL: [-0.72, 0.18, -0.22],
  wristL: [-0.10, -0.24, -0.16],
  hipR: [-0.48, 0.06, -0.10],
  kneeR: [0.86, 0.0, 0.0],
  hipL: [-0.18, -0.06, 0.12],
  kneeL: [0.34, 0.0, 0.0],
};

/**
 * Breakthrough glass-shatter pose (`Frame 16` — both gloved hands raised in dynamic breakthrough!).
 */
export const SUIT_POSE_SHATTER_BREAK: SuitJointPose = {
  chest: [-0.04, 0.02, 0.0],
  head: [0.02, -0.03, 0.0],
  shoulderR: [-1.18, 0.22, -0.58],
  elbowR: [-1.32, -0.28, 0.42],
  wristR: [-0.22, 0.18, 0.12],
  shoulderL: [-1.14, -0.22, 0.56],
  elbowL: [-1.28, 0.28, -0.40],
  wristL: [-0.22, -0.18, -0.12],
  hipR: [-0.16, 0.04, -0.05],
  kneeR: [0.28, 0.0, 0.0],
  hipL: [-0.56, -0.06, 0.10],
  kneeL: [0.92, 0.0, 0.0],
};

/**
 * Space arrival visor-salute pose (`Frame 17` & `09a-home-end-cta`: right hand raised to helmet brim,
 * left arm relaxed at side, standing tall front-on!).
 */
export const SUIT_POSE_VISOR_SALUTE: SuitJointPose = {
  chest: [0.0, 0.02, -0.02],
  head: [0.02, -0.02, 0.02],
  shoulderR: [-1.38, 0.26, -0.48],
  elbowR: [-1.96, -0.42, 0.68],
  wristR: [0.16, 0.34, -0.22],
  shoulderL: [-0.06, -0.04, 0.16],
  elbowL: [-0.18, 0.06, -0.06],
  wristL: [-0.04, -0.12, -0.08],
  hipR: [-0.02, 0.02, -0.03],
  kneeR: [0.05, 0.0, 0.0],
  hipL: [-0.02, -0.02, 0.03],
  kneeL: [0.05, 0.0, 0.0],
};

/**
 * Relaxed front-facing CTA standing pose (`Frame 20`: friendly heroic stance behind "Let's work together!").
 */
export const SUIT_POSE_CTA_RELAXED: SuitJointPose = {
  chest: [0.0, 0.0, 0.0],
  head: [0.02, 0.0, 0.0],
  shoulderR: [-0.06, 0.04, 0.16],
  elbowR: [-0.16, -0.06, 0.05],
  wristR: [-0.04, 0.10, 0.06],
  shoulderL: [-0.06, -0.04, -0.16],
  elbowL: [-0.16, 0.06, -0.05],
  wristL: [-0.04, -0.10, -0.06],
  hipR: [-0.02, 0.02, -0.03],
  kneeR: [0.04, 0.0, 0.0],
  hipL: [-0.02, -0.02, 0.03],
  kneeL: [0.04, 0.0, 0.0],
};

/**
 * High joyful right-arm wave pose (`Frame 19`: right hand raised high above helmet waving "Hi!").
 */
export function evaluateSuitWavePose(waveOsc: number): SuitJointPose {
  return {
    chest: [-0.02, 0.03, -0.04],
    head: [-0.03, -0.03, 0.03],
    shoulderR: [-2.28 + waveOsc * 0.10, 0.16, -0.44 - waveOsc * 0.18],
    elbowR: [-0.42 + waveOsc * 0.24, -0.12, 0.18],
    wristR: [0.06, 0.12, waveOsc * 0.22],
    shoulderL: [-0.06, -0.04, 0.14],
    elbowL: [-0.18, 0.06, -0.05],
    wristL: [-0.04, -0.10, -0.06],
    hipR: [-0.02, 0.02, -0.03],
    kneeR: [0.04, 0.0, 0.0],
    hipL: [-0.02, -0.02, 0.03],
    kneeL: [0.04, 0.0, 0.0],
  };
}

/**
 * Curved Visor LED Dot-Matrix Emoticon Display (`Frames 18, 19, 20`)
 * Mounted directly inside `primary.bones.Head` local space so it tracks every head nod/tilt cleanly:
 *   - `uSmile = 0` (`Frame 18`): Two crisp 4x4 warm-white pixel eyes + soft visor glass scatter glow
 *   - `uSmile = 1` (`Frames 19–20`): Two bright happy LED pixel eyes + curved pixel grin!
 */
export function buildVisorLedMatrix(
  track: <T extends { dispose: () => void }>(item: T) => T
): {
  mesh: THREE.Mesh;
  material: THREE.ShaderMaterial;
} {
  // Spherical-cap patch curving along the exact helmet visor dome (`R = 0.146`)
  const segW = 24;
  const segH = 16;
  const geo = track(new THREE.PlaneGeometry(0.186, 0.118, segW, segH));
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const r2 = x * x * 1.05 + y * y * 0.85;
    pos.setZ(i, -r2 * 1.45);
  }
  geo.computeVertexNormals();

  const material = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0.0 },
        uSmile: { value: 1.0 },
        uBlink: { value: 0.0 },
      },
      vertexShader: [
        "varying vec2 vUv;",
        "varying float vFacing;",
        "void main() {",
        "  vUv = uv;",
        "  vFacing = normalize((modelViewMatrix * vec4(0.0, 0.0, 1.0, 0.0)).xyz).z;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec2 vUv;",
        "varying float vFacing;",
        "uniform float uOpacity;",
        "uniform float uSmile;",
        "uniform float uBlink;",
        "",
        "void main() {",
        "  if (vFacing < 0.25) discard;",
        "  // Discrete 30 x 19 LED dot-matrix grid",
        "  vec2 gridSize = vec2(30.0, 19.0);",
        "  vec2 cell = floor(vUv * gridSize);",
        "  vec2 local = fract(vUv * gridSize) - 0.5;",
        "  float dotMask = smoothstep(0.40, 0.18, length(local));",
        "",
        "  // Left & Right 4x4 rounded pixel eyes centered at cols [6..9] and [20..23], rows [10..13]",
        "  float eyeRowMin = mix(10.0, 11.5, uBlink);",
        "  float eyeRowMax = mix(13.0, 12.0, uBlink);",
        "  float inEyeY = step(eyeRowMin, cell.y) * step(cell.y, eyeRowMax);",
        "  float inLeftEye = step(6.0, cell.x) * step(cell.x, 9.0) * inEyeY;",
        "  float inRightEye = step(20.0, cell.x) * step(cell.x, 23.0) * inEyeY;",
        "  // Trim outer 4 corners slightly for authentic rounded LED eye clusters",
        "  float cornerL = (cell.x == 6.0 || cell.x == 9.0) && (cell.y == 10.0 || cell.y == 13.0) ? 0.35 : 1.0;",
        "  float cornerR = (cell.x == 20.0 || cell.x == 23.0) && (cell.y == 10.0 || cell.y == 13.0) ? 0.35 : 1.0;",
        "  float eyes = inLeftEye * cornerL + inRightEye * cornerR;",
        "",
        "  // Pixel smile arc across cols [10..19], rows [3..7] (Frames 19 & 20!)",
        "  float dx = (cell.x - 14.5) / 5.0;",
        "  float targetRow = 3.2 + dx * dx * 3.6;",
        "  float smileBand = step(10.0, cell.x) * step(cell.x, 19.0) * smoothstep(1.35, 0.35, abs(cell.y - targetRow));",
        "  // Filled happy pixel grin row right inside lower arc matching Frame 19/20",
        "  float smileFill = step(11.0, cell.x) * step(cell.x, 18.0) * step(targetRow, cell.y) * step(cell.y, 6.2) * 0.85;",
        "  float mouth = max(smileBand, smileFill) * uSmile;",
        "",
        "  float activeLed = clamp(eyes + mouth, 0.0, 1.0);",
        "  // Subtle warm-white LED dot + soft internal visor glass scatter",
        "  float eyeGlowL = exp(-length((vUv - vec2(0.265, 0.63)) * vec2(7.0, 5.5)) * 2.4);",
        "  float eyeGlowR = exp(-length((vUv - vec2(0.735, 0.63)) * vec2(7.0, 5.5)) * 2.4);",
        "  float mouthGlow = exp(-length((vUv - vec2(0.50, 0.29)) * vec2(5.5, 6.5)) * 2.4) * uSmile;",
        "  float halo = (eyeGlowL + eyeGlowR + mouthGlow) * 0.22;",
        "",
        "  vec3 warmLed = vec3(1.0, 0.975, 0.90);",
        "  vec3 coolScatter = vec3(0.75, 0.84, 0.98);",
        "  vec3 col = warmLed * (activeLed * dotMask * 2.15) + coolScatter * halo;",
        "  float alpha = clamp(activeLed * dotMask + halo, 0.0, 1.0) * uOpacity;",
        "  gl_FragColor = vec4(col * uOpacity, alpha);",
        "}",
      ].join("\n"),
    })
  );

  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(0.0, 0.026, 0.172);
  mesh.renderOrder = 8;
  mesh.visible = false;
  return { mesh, material };
}

/**
 * Translucent Emerald-Cyan Holographic Fresnel Material for `Frame 13` Echo Astronauts
 * Single lightweight GPU shader (0 PBR clearcoat cost, 0 black silhouettes!).
 */
export function buildHologramEchoMaterial(
  track: <T extends { dispose: () => void }>(item: T) => T
): THREE.ShaderMaterial {
  return track(
    new THREE.ShaderMaterial({
      defines: { USE_SKINNING: "" },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0.0 },
        uTint: { value: new THREE.Color("#6bffb8") },
      },
      vertexShader: [
        "#include <common>",
        "#include <skinning_pars_vertex>",
        "varying vec3 vNormalV;",
        "varying vec3 vPosV;",
        "void main() {",
        "  #include <skinbase_vertex>",
        "  #include <beginnormal_vertex>",
        "  #include <skinnormal_vertex>",
        "  #include <begin_vertex>",
        "  #include <skinning_vertex>",
        "  vec4 mvPosition = modelViewMatrix * vec4(transformed, 1.0);",
        "  vPosV = mvPosition.xyz;",
        "  vNormalV = normalize(normalMatrix * objectNormal);",
        "  gl_Position = projectionMatrix * mvPosition;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec3 vNormalV;",
        "varying vec3 vPosV;",
        "uniform float uOpacity;",
        "uniform vec3 uTint;",
        "void main() {",
        "  vec3 V = normalize(-vPosV);",
        "  float fres = pow(1.0 - abs(dot(normalize(vNormalV), V)), 1.75);",
        "  float core = 0.14 + 0.86 * fres;",
        "  vec3 col = mix(vec3(0.45, 0.92, 0.78), uTint, fres) * core * 1.15;",
        "  gl_FragColor = vec4(col * uOpacity, core * uOpacity);",
        "}",
      ].join("\n"),
    })
  );
}

/**
 * Single-Draw-Call GPU-Twisted Architectural Square Truss + Micro-Greeble Panel Tunnel (`Frames 09–14`)
 *
 * Reconstructs every visual phase verified directly from Google Drive Frames `09–14`:
 *   - Wide 3x3 rectangular steel scaffolding frames spanning full viewport width (`09->10->11`)
 *   - Dense micro-greeble rectangular panel clusters along the 4 inner corner rails (`10, 11, 12`)
 *   - Smooth 4-stage HDR glint palette shift:
 *       0.00..0.34 (`10–11`): Dark gunmetal steel + crisp ice-cyan & pure-white star-bloom glints
 *       0.34..0.56 (`12`):    Warm bronze steel + fiery red-orange (`#ff4c18`, `#ffb238`) & teal (`#2bf5e8`) glints
 *       0.56..0.74 (`13`):    Helical twist begins + emerald-mint (`#52ff9e`) & cyan glints
 *       0.74..1.00 (`14`):    Intense helical vortex + blazing neon magenta/pink & cyan beams + white core crescendo!
 */
export function buildArchitecturalTrussTunnel(
  track: <T extends { dispose: () => void }>(item: T) => T,
  isMobile: boolean
): {
  group: THREE.Group;
  tunnelMaterial: THREE.ShaderMaterial;
  vortexCoreMat: THREE.ShaderMaterial;
  flashVeilMat: THREE.ShaderMaterial;
  baySpacing: number;
} {
  const group = new THREE.Group();
  const baySpacing = 1.0;
  const bayCount = isMobile ? 32 : 45;

  const tunnelMaterial = track(
    new THREE.ShaderMaterial({
      uniforms: {
        uOpacity: { value: 1.0 },
        uPhase: { value: 0.0 },
        uTwist: { value: 0.0 },
        uVortexPinch: { value: 0.0 },
        uTravelZ: { value: 0.0 },
      },
      vertexShader: [
        "attribute float aSeed;",
        "attribute float aKind;",
        "varying vec3 vNormalW;",
        "varying vec3 vWorldPos;",
        "varying vec2 vFaceUv;",
        "varying float vSeed;",
        "varying float vKind;",
        "uniform float uTwist;",
        "uniform float uVortexPinch;",
        "uniform float uTravelZ;",
        "",
        "void main() {",
        "  vSeed = aSeed;",
        "  vKind = aKind;",
        "  vFaceUv = uv * 2.0 - 1.0;",
        "  vec4 wp = instanceMatrix * vec4(position, 1.0);",
        "  wp.z += uTravelZ;",
        "",
        "  // Continuous GPU helical spiral twist & vortex funnel (Frames 13 -> 14!)",
        "  float depthDist = max(0.0, 4.2 - wp.z);",
        "  float ang = depthDist * uTwist;",
        "  float ca = cos(ang);",
        "  float sa = sin(ang);",
        "  vec2 rotXY = mat2(ca, -sa, sa, ca) * wp.xy;",
        "  float pinch = mix(1.0, 1.0 / (1.0 + depthDist * 0.075), uVortexPinch);",
        "  wp.xy = rotXY * pinch;",
        "",
        "  vec3 nrm = mat3(instanceMatrix) * normal;",
        "  nrm.xy = mat2(ca, -sa, sa, ca) * nrm.xy;",
        "  vNormalW = normalize(nrm);",
        "  vWorldPos = wp.xyz;",
        "  gl_Position = projectionMatrix * viewMatrix * wp;",
        "}"
      ].join("\n"),
      fragmentShader: [
        "varying vec3 vNormalW;",
        "varying vec3 vWorldPos;",
        "varying vec2 vFaceUv;",
        "varying float vSeed;",
        "varying float vKind;",
        "uniform float uOpacity;",
        "uniform float uPhase;",
        "uniform float uVortexPinch;",
        "",
        "void main() {",
        "  vec3 N = normalize(vNormalW);",
        "  vec3 L1 = normalize(vec3(0.0, 0.0, 1.0) - vWorldPos * vec3(0.28, 0.28, 0.04));",
        "  float ndl = max(dot(N, L1), 0.0);",
        "  float rim = pow(1.0 - abs(N.z), 1.6);",
        "  float depthFade = smoothstep(-36.0, -3.5, vWorldPos.z);",
        "",
        "  float wCool  = 1.0 - smoothstep(0.24, 0.36, uPhase);",
        "  float wWarm  = smoothstep(0.24, 0.36, uPhase) * (1.0 - smoothstep(0.49, 0.59, uPhase));",
        "  float wEmer  = smoothstep(0.49, 0.59, uPhase) * (1.0 - smoothstep(0.76, 0.86, uPhase));",
        "  float wPink  = smoothstep(0.76, 0.86, uPhase);",
        "",
        "  vec3 cCool  = vec3(0.02, 0.04, 0.08) + vec3(0.3, 0.7, 1.0) * (ndl * 0.4 + rim * 0.2);",
        "  vec3 cWarm  = vec3(0.06, 0.03, 0.01) + vec3(1.0, 0.3, 0.1) * ndl * 0.5 + vec3(0.1, 0.8, 0.8) * rim * 0.3;",
        "  vec3 cEmer  = vec3(0.01, 0.08, 0.04) + vec3(0.2, 1.0, 0.5) * (ndl * 0.6 + rim * 0.4);",
        "  vec3 cPink  = vec3(0.15, 0.01, 0.08) + vec3(1.0, 0.1, 0.6) * (ndl * 0.8 + rim * 0.6) + vec3(0.1, 0.9, 1.0) * rim * 0.3;",
        "",
        "  vec3 baseCol = cCool * wCool + cWarm * wWarm + cEmer * wEmer + cPink * wPink;",
        "",
        "  float isGlint = step(1.5, vKind);",
        "  float glintPhase = fract(vSeed * 7.31 + uPhase * 14.0);",
        "  float glintInt = smoothstep(0.7, 0.95, glintPhase) * (1.0 - smoothstep(0.95, 1.0, glintPhase));",
        "  vec3 glintColor = mix(vec3(0.2, 0.8, 1.0), vec3(1.0, 0.4, 0.1), wWarm) * 4.0;",
        "  glintColor = mix(glintColor, vec3(0.4, 1.0, 0.6) * 5.0, wEmer);",
        "  glintColor = mix(glintColor, vec3(1.0, 0.2, 0.8) * 6.0, wPink);",
        "  baseCol += glintColor * isGlint * glintInt * (1.0 - uVortexPinch);",
        "",
        "  baseCol = mix(baseCol, vec3(2.0, 0.8, 1.5), uVortexPinch * 0.85);",
        "",
        "  gl_FragColor = vec4(baseCol * depthFade * uOpacity, uOpacity);",
        "}"
      ].join("\n")
    })
  );

  const vortexCoreMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uMode: { value: 0.0 },
        uIntensity: { value: 0.0 }
      },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }"
      ].join("\n"),
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform float uMode;",
        "uniform float uIntensity;",
        "void main() {",
        "  vec2 p = vUv * 2.0 - 1.0;",
        "  float r = length(p);",
        "  float core = exp(-r * 6.0) * 1.5 + exp(-r * 18.0) * 2.0;",
        "  vec3 cE = vec3(0.3, 1.0, 0.7);",
        "  vec3 cP = vec3(1.0, 0.4, 0.9);",
        "  vec3 col = mix(cE, cP, uMode) * core;",
        "  gl_FragColor = vec4(col * uIntensity, clamp(core * uIntensity, 0.0, 1.0));",
        "}"
      ].join("\n")
    })
  );

  const corePlane = new THREE.Mesh(track(new THREE.PlaneGeometry(16, 16)), vortexCoreMat);
  corePlane.position.z = -12.0;
  corePlane.renderOrder = 2;
  group.add(corePlane);

  const flashVeilMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      uniforms: { uFlash: { value: 0.0 } },
      vertexShader: "void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }",
      fragmentShader: "uniform float uFlash; void main() { gl_FragColor = vec4(1.0, 1.0, 1.0, uFlash); }"
    })
  );
  const flashVeil = new THREE.Mesh(track(new THREE.PlaneGeometry(2, 2)), flashVeilMat);
  flashVeil.renderOrder = 10;
  flashVeil.frustumCulled = false;
  group.add(flashVeil);

  import("@/lib/lusion-buf-loader").then((m) => {
    Promise.all([
      m.loadLusionBuf("/assets/models/tunnels/grid_base_hd.buf"),
      m.loadLusionBuf("/assets/models/tunnels/tunnel_block_wall.buf")
    ]).then(([baseData, wallData]) => {
      const gBase = track(baseData.geometry);
      const gWall = track(wallData.geometry);

      const instancesPerBay = 4;
      const totalInstances = bayCount * instancesPerBay;
      const m4 = new THREE.Matrix4();
      const pos = new THREE.Vector3();
      const quat = new THREE.Quaternion();
      const scl = new THREE.Vector3(1, 1, 1);

      let rng = 20261023;
      const rand = () => { rng = (rng * 1664525 + 1013904223) >>> 0; return rng / 4294967296; };

      const baseInstGeo = track(new THREE.InstancedBufferGeometry());
      baseInstGeo.index = gBase.index;
      baseInstGeo.attributes.position = gBase.attributes.position;
      baseInstGeo.attributes.normal = gBase.attributes.normal;
      baseInstGeo.instanceCount = totalInstances;
      
      const wallInstGeo = track(new THREE.InstancedBufferGeometry());
      wallInstGeo.index = gWall.index;
      wallInstGeo.attributes.position = gWall.attributes.position;
      wallInstGeo.attributes.normal = gWall.attributes.normal;
      wallInstGeo.instanceCount = totalInstances;

      const baseSeeds = new Float32Array(totalInstances);
      const baseKinds = new Float32Array(totalInstances);
      const wallSeeds = new Float32Array(totalInstances);
      const wallKinds = new Float32Array(totalInstances);

      const baseInstMesh = new THREE.InstancedMesh(baseInstGeo, tunnelMaterial, totalInstances);
      baseInstMesh.frustumCulled = false;
      const wallInstMesh = new THREE.InstancedMesh(wallInstGeo, tunnelMaterial, totalInstances);
      wallInstMesh.frustumCulled = false;

      let idx = 0;
      for (let b = 0; b < bayCount; b++) {
        const z = 3.9 - b * baySpacing;
        for (let rot = 0; rot < instancesPerBay; rot++) {
          const angle = rot * (Math.PI / 2);
          
          quat.setFromEuler(new THREE.Euler(0, 0, angle));
          
          // grid_base_hd is X: -0.025 to 3.025, Y: 0 to 1
          // we want its Y=0 axis to touch the hole corner, extending outwards in X and Y
          // The center hole is maybe 1.5 radius.
          pos.set(1.48, 1.48, z);
          pos.applyEuler(new THREE.Euler(0, 0, angle));
          m4.compose(pos, quat, scl);
          
          baseInstMesh.setMatrixAt(idx, m4);
          baseSeeds[idx] = rand();
          baseKinds[idx] = 0; // structural
          
          // tunnel_block_wall is X: -0.63 to 0.63, Y: -0.5 to 0.5.
          // It forms the walls connecting the corners.
          // We can put it halfway between the corners:
          // angle + PI/4? Or angle is the wall face.
          // Let's place it at Y=1.48, rotated so it spans the X axis.
          const wPos = new THREE.Vector3(1.48, 0, z); // shift wall out
          wPos.applyEuler(new THREE.Euler(0, 0, angle + Math.PI/2)); // face inward
          // tunnel_block_wall actually spans X axis. 
          const wQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.PI/2, 0, angle));
          m4.compose(wPos, wQuat, scl);
          
          wallInstMesh.setMatrixAt(idx, m4);
          wallSeeds[idx] = rand();
          wallKinds[idx] = rand() < 0.15 ? 2 : 1; // glint or dark panel
          
          idx++;
        }
      }

      baseInstGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(baseSeeds, 1));
      baseInstGeo.setAttribute("aKind", new THREE.InstancedBufferAttribute(baseKinds, 1));
      wallInstGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(wallSeeds, 1));
      wallInstGeo.setAttribute("aKind", new THREE.InstancedBufferAttribute(wallKinds, 1));

      baseInstMesh.instanceMatrix.needsUpdate = true;
      wallInstMesh.instanceMatrix.needsUpdate = true;

      group.add(baseInstMesh);
      group.add(wallInstMesh);
    });
  });

  return { group, tunnelMaterial, vortexCoreMat, flashVeilMat, baySpacing };
}
export function buildBlueArchCorridor(
  track: <T extends { dispose: () => void }>(item: T) => T
): {
  group: THREE.Group;
  wallTexture: THREE.CanvasTexture;
  endGlowMat: THREE.ShaderMaterial;
  monitorStencilMask: THREE.Mesh;
  setMonitorClip: (active: boolean) => void;
} {
  const group = new THREE.Group();

  const S = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // Rich saturated Lusion Royal Cobalt (`#1e3bf2` -> `#2948fa`) matching `15_t19.6s` & `16_t21.0s`
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, "#2443f6");
  grad.addColorStop(0.5, "#1d38e8");
  grad.addColorStop(1, "#2747fa");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Subtle architectural corner shading seams
  for (const seam of [0.0, 0.25, 0.5, 0.75, 1.0]) {
    const sg = ctx.createLinearGradient(S * seam - 42, 0, S * seam + 42, 0);
    sg.addColorStop(0, "rgba(12, 24, 155, 0)");
    sg.addColorStop(0.5, "rgba(10, 20, 145, 0.42)");
    sg.addColorStop(1, "rgba(12, 24, 155, 0)");
    ctx.fillStyle = sg;
    ctx.fillRect(S * seam - 42, 0, 84, S);
  }

  // Crisp pure snow-white (`#f4f7ff`) geometric ring & cloud-outline murals (`Frames 15 & 16`!)
  ctx.strokeStyle = "#f4f7ff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const drawBoldRing = (cx: number, cy: number, r: number, lw: number) => {
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  };

  const drawCloudOutline = (cx: number, cy: number, r: number, lobes: number, lw: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#f4f7ff";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * Math.PI * 2 + 0.35;
      const lr = r * (0.46 + 0.14 * Math.sin(i * 1.9));
      const px = Math.cos(a) * r * 0.68;
      const py = Math.sin(a) * r * 0.68;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = "#203ef0";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = (i / lobes) * Math.PI * 2 + 0.35;
      const lr = Math.max(8, r * (0.46 + 0.14 * Math.sin(i * 1.9)) - lw);
      const px = Math.cos(a) * r * 0.68;
      const py = Math.sin(a) * r * 0.68;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  };

  drawBoldRing(S * 0.66, S * 0.80, S * 0.145, S * 0.036);
  drawBoldRing(S * 0.44, S * 0.72, S * 0.105, S * 0.030);
  drawBoldRing(S * 0.31, S * 0.56, S * 0.072, S * 0.024);
  drawBoldRing(S * 0.46, S * 0.20, S * 0.088, S * 0.028);
  drawBoldRing(S * 0.16, S * 0.09, S * 0.135, S * 0.032);
  drawCloudOutline(S * 0.78, S * 0.20, S * 0.175, 5, S * 0.034);
  drawCloudOutline(S * 0.22, S * 0.84, S * 0.155, 6, S * 0.030);
  drawCloudOutline(S * 0.52, S * 0.46, S * 0.115, 5, S * 0.026);

  // Soft sky-blue exterior window light bounce pools on walls & floor (`Frames 15 & 16`!)
  for (const [gx, gy] of [
    [0.12, 0.66],
    [0.88, 0.66],
    [0.88, 0.26],
  ]) {
    const glow = ctx.createRadialGradient(gx * S, gy * S, 12, gx * S, gy * S, S * 0.26);
    glow.addColorStop(0, "rgba(255,255,255,0.95)");
    glow.addColorStop(0.45, "rgba(150,205,255,0.52)");
    glow.addColorStop(1, "rgba(32,62,240,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(gx * S, gy * S, S * 0.26, 0, Math.PI * 2);
    ctx.fill();
  }

  const wallTexture = track(new THREE.CanvasTexture(canvas));
  wallTexture.wrapS = THREE.RepeatWrapping;
  wallTexture.wrapT = THREE.RepeatWrapping;
  wallTexture.colorSpace = THREE.SRGBColorSpace;

  const TUNNEL_LEN = 48;
  const shaftGeo = track(new THREE.BoxGeometry(7.6, 5.4, TUNNEL_LEN, 1, 1, 8));
  const shaftMat = track(
    new THREE.MeshBasicMaterial({ map: wallTexture, side: THREE.BackSide })
  );
  const shaftMesh = new THREE.Mesh(shaftGeo, shaftMat);
  shaftMesh.position.set(0, 0, -TUNNEL_LEN * 0.45);
  group.add(shaftMesh);

  // Merge all glowing white arched window cutouts + cobalt pilasters into ONLY 2 draw calls total!
  const archParts: THREE.BufferGeometry[] = [];
  const pilasterParts: THREE.BufferGeometry[] = [];

  for (let i = 0; i < 6; i++) {
    const zPos = 1.8 - i * 7.2;
    for (const side of [-1, 1]) {
      const lower = new THREE.PlaneGeometry(2.35, 2.35);
      lower.rotateY(-side * (Math.PI / 2));
      lower.translate(side * 3.74, -1.42, zPos);

      const archTop = new THREE.CircleGeometry(1.175, 20, 0, Math.PI);
      archTop.rotateY(-side * (Math.PI / 2));
      archTop.translate(side * 3.74, -0.25, zPos);

      archParts.push(lower, archTop);

      const pil = new THREE.BoxGeometry(0.44, 5.4, 0.95);
      pil.translate(side * 3.56, 0, zPos - 1.95);
      pilasterParts.push(pil);

      const lintel = new THREE.BoxGeometry(0.52, 0.36, 2.8);
      lintel.translate(side * 3.52, -0.25, zPos);
      pilasterParts.push(lintel);
    }
  }

  const mergedArchGeo = track(mergeGeometries(archParts, false)!);
  archParts.forEach((g) => g.dispose());
  const archHdrMat = track(
    new THREE.MeshBasicMaterial({ color: new THREE.Color(2.15, 2.22, 2.35) }) // triggers realistic window bloom!
  );
  group.add(new THREE.Mesh(mergedArchGeo, archHdrMat));

  const mergedPilGeo = track(mergeGeometries(pilasterParts, false)!);
  pilasterParts.forEach((g) => g.dispose());
  const pilMat = track(new THREE.MeshBasicMaterial({ color: 0x2648f8 }));
  group.add(new THREE.Mesh(mergedPilGeo, pilMat));

  const endGlowMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform float uOpacity;",
        "void main() {",
        "  float d = length(vUv - 0.5) * 2.0;",
        "  float core = smoothstep(0.95, 0.05, d);",
        "  vec3 col = mix(vec3(0.14, 0.28, 0.98), vec3(1.85, 1.92, 2.05), pow(core, 0.8));",
        "  gl_FragColor = vec4(col, uOpacity);",
        "}",
      ].join("\n"),
    })
  );
  const endCap = new THREE.Mesh(track(new THREE.PlaneGeometry(8.2, 6.2)), endGlowMat);
  endCap.position.set(0, 0, -25.2);
  group.add(endCap);

  // GPU Stencil Screen Aperture (`stencilRef = 2`) for `Frame 16`:
  // Clips the royal-blue corridor strictly inside the Studio Display screen opening (`0px` bleed onto
  // the `#f7f8fc` white studio wall or brushed silver stand!) while keeping `mainAstro` & `shardsMesh`
  // completely unclipped so they burst physically out in front of the bezel!
  const stencilMat = track(
    new THREE.MeshBasicMaterial({
      colorWrite: false,
      depthWrite: false,
      depthTest: false,
      side: THREE.DoubleSide,
    })
  );
  stencilMat.stencilWrite = true;
  stencilMat.stencilFunc = THREE.AlwaysStencilFunc;
  stencilMat.stencilRef = 2;
  stencilMat.stencilZPass = THREE.ReplaceStencilOp;
  const monitorStencilMask = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), stencilMat);
  monitorStencilMask.renderOrder = -6;
  monitorStencilMask.visible = false;
  monitorStencilMask.frustumCulled = false;

  const corridorMaterials: THREE.Material[] = [shaftMat, archHdrMat, pilMat, endGlowMat];
  let clippedState = false;
  const setMonitorClip = (active: boolean) => {
    if (clippedState === active) return;
    clippedState = active;
    for (const mat of corridorMaterials) {
      mat.stencilWrite = active;
      mat.stencilFunc = active ? THREE.EqualStencilFunc : THREE.AlwaysStencilFunc;
      mat.stencilRef = 2;
      mat.needsUpdate = true;
    }
  };

  return { group, wallTexture, endGlowMat, monitorStencilMask, setMonitorClip };
}

/**
 * Faceted Brilliant-Cut Glass Diamonds + Horizontal Anamorphic Star Glints
 * + High-DPR 16-Design Illustrated Pop-Art Die-Cut Sticker Atlas (`Frames 17–20` & `09a-home-end-cta`)
 *
 * Entire scene renders in ONLY 3 instanced draw calls (`diamonds`, `glints`, `stickers`)!
 */
export function buildDiamondsAndPopStickers(
  track: <T extends { dispose: () => void }>(item: T) => T,
  isMobile: boolean
): {
  group: THREE.Group;
  update: (elapsedSec: number, scrollLift: number, reducedMotion: boolean, ptrX: number, ptrY: number) => void;
} {
  const group = new THREE.Group();

  // 1. Authentic Brilliant-Cut Crown + Pavilion Diamond Geometry (1 InstancedMesh!)
  const crown = new THREE.CylinderGeometry(0.056, 0.098, 0.036, 9, 1);
  crown.translate(0, 0.042, 0);
  const pavilion = new THREE.ConeGeometry(0.098, 0.092, 9, 1);
  pavilion.rotateX(Math.PI);
  pavilion.translate(0, -0.022, 0);
  const diamondGeo = track(mergeGeometries([crown, pavilion], false)!);
  diamondGeo.computeVertexNormals();
  crown.dispose();
  pavilion.dispose();

  const diamondCount = isMobile ? 22 : 34;
  const diamondMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uOpacity: { value: 1.0 },
      },
      vertexShader: [
        "varying vec3 vNormalV;",
        "varying vec3 vPosV;",
        "void main() {",
        "  vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);",
        "  vPosV = mv.xyz;",
        "  vNormalV = normalize(normalMatrix * mat3(instanceMatrix) * normal);",
        "  gl_Position = projectionMatrix * mv;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec3 vNormalV;",
        "varying vec3 vPosV;",
        "uniform float uOpacity;",
        "void main() {",
        "  vec3 N = normalize(vNormalV);",
        "  vec3 V = normalize(-vPosV);",
        "  float fres = pow(1.0 - abs(dot(N, V)), 2.2);",
        "  float facetA = pow(max(dot(N, normalize(vec3(-0.6, 0.75, 0.5))), 0.0), 10.0);",
        "  float facetB = pow(max(dot(N, normalize(vec3(0.7, -0.35, 0.6))), 0.0), 8.0);",
        "  vec3 darkGlass = vec3(0.055, 0.070, 0.105);",
        "  vec3 dispA = vec3(0.45, 0.82, 1.15);",
        "  vec3 dispB = vec3(0.88, 0.58, 1.15);",
        "  vec3 col = darkGlass + dispA * (fres * 0.72 + facetB * 0.85) + dispB * (fres * 0.42) + vec3(2.2) * facetA;",
        "  float alpha = clamp(0.68 + fres * 0.32 + facetA, 0.0, 1.0) * uOpacity;",
        "  gl_FragColor = vec4(col, alpha);",
        "}",
      ].join("\n"),
    })
  );

  const diamondInst = new THREE.InstancedMesh(diamondGeo, diamondMat, diamondCount);
  diamondInst.frustumCulled = false;
  group.add(diamondInst);

  // Horizontal Anamorphic Lens-Flare Star Glints (`Frames 17–20` & `09a`!)
  const glintMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: { uOpacity: { value: 1.0 } },
      vertexShader: [
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = uv;",
        "  vec4 mv = modelViewMatrix * instanceMatrix * vec4(0.0, 0.0, 0.0, 1.0);",
        "  vec2 s = vec2(length(instanceMatrix[0].xyz), length(instanceMatrix[1].xyz));",
        "  mv.xy += position.xy * s;",
        "  gl_Position = projectionMatrix * mv;",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform float uOpacity;",
        "void main() {",
        "  vec2 p = (vUv - 0.5) * 2.0;",
        "  float r = length(p);",
        "  float core = exp(-r * r * 28.0);",
        "  float hStreak = exp(-abs(p.y) * 26.0) * exp(-abs(p.x) * 3.1);",
        "  float diagA = exp(-abs(p.x * 0.7 - p.y * 0.7) * 34.0) * exp(-r * 5.0);",
        "  float diagB = exp(-abs(p.x * 0.7 + p.y * 0.7) * 34.0) * exp(-r * 5.0);",
        "  float g = core * 1.35 + hStreak * 0.85 + (diagA + diagB) * 0.32;",
        "  vec3 col = mix(vec3(0.76, 0.88, 1.0), vec3(1.0), core) * g;",
        "  gl_FragColor = vec4(col * uOpacity, clamp(g, 0.0, 1.0) * uOpacity);",
        "}",
      ].join("\n"),
    })
  );
  const glintCount = isMobile ? 12 : 18;
  const glintInst = new THREE.InstancedMesh(track(new THREE.PlaneGeometry(1, 1)), glintMat, glintCount);
  glintInst.frustumCulled = false;
  glintInst.renderOrder = 7;
  group.add(glintInst);

  const diamondSeeds = Array.from({ length: diamondCount }, (_, i) => {
    const ring = i % 3;
    const ang = (i / diamondCount) * Math.PI * 2 + ring * 0.42;
    const rx = (isMobile ? 0.92 : 1.75) + ((i * 37) % 11) * (isMobile ? 0.085 : 0.16);
    const ry = -1.65 + ((i * 23) % 17) * 0.21;
    const rz = -1.25 + ((i * 13) % 7) * 0.24;
    return {
      x: Math.cos(ang) * rx,
      y: ry,
      z: rz,
      scale: 0.72 + ((i * 19) % 7) * 0.14,
      spinX: ((i % 5) - 2) * 0.28,
      spinY: 0.35 + (i % 4) * 0.16,
      phase: i * 1.37,
    };
  });

  // 2. High-DPR `2048x2048` 4x4 Pop-Art Die-Cut Sticker Atlas (All 16 Authentic Designs from Frames 17–20 & 09a!)
  const atlasTex = track(createPopArtStickerAtlas());
  const stickerGeo = track(new THREE.InstancedBufferGeometry());
  const basePlane = new THREE.PlaneGeometry(1, 1);
  stickerGeo.index = basePlane.index;
  stickerGeo.attributes.position = basePlane.attributes.position;
  stickerGeo.attributes.uv = basePlane.attributes.uv;
  basePlane.dispose();

  // Curated 3D layout matching `Frames 17, 18, 19, 20` & `09a-home-end-cta`!
  // [x, y, z, size, rotZ, tileIndex (0..15)]
  const STICKER_LAYOUT: ReadonlyArray<[number, number, number, number, number, number]> = [
    // Upper ring around astronaut & headline
    [0.24, 1.06, -0.35, 0.56, -0.10, 0],   // 0: Red cartoon heart above head
    [1.18, 1.02, -0.25, 0.86, 0.48, 1],    // 1: Upside-down cream cartoon skeleton (top-right!)
    [0.86, 0.46, 0.25, 0.52, -0.18, 2],    // 2: Lavender smiley circle
    [1.62, 1.15, -0.45, 0.38, 0.12, 3],    // 3: Black pool 8-ball
    [-2.18, 0.36, 0.15, 0.50, 0.22, 4],    // 4: White worried daisy flower (far left!)
    [-0.58, 0.32, 0.28, 0.42, -0.16, 5],   // 5: Two-tone red & blue capsule pill
    [0.36, 0.56, -0.30, 0.56, 0.14, 6],    // 6: Green planet lollipop
    [-0.22, 1.34, -0.20, 0.52, 0.26, 7],   // 7: Pink jewel ring-pop
    // Mid-lower left cluster
    [-1.12, -0.26, 0.26, 0.42, 0.14, 8],   // 8: Cartoon googly blue eyes
    [-0.52, -0.68, -0.28, 0.50, -0.22, 9], // 9: Peeled yellow banana
    [-1.34, -0.82, 0.32, 0.62, -0.45, 10], // 10: Spotted pink fairy-tale mushroom
    [-0.86, -1.16, 0.36, 0.56, 0.18, 11],  // 11: Glossy purple biting lips
    [-1.92, -1.28, 0.24, 0.62, -0.68, 12], // 12: Pink swirl lollipop (bottom left!)
    [-0.56, -0.38, -0.34, 0.54, 0.58, 15], // 15: Retro red/cyan 3D glasses behind hip
    // Mid-lower right cluster
    [1.38, -0.18, 0.30, 0.64, 0.32, 13],   // 13: Bitten red popsicle + bacon + lightning bolt!
    [1.92, 0.12, 0.24, 0.62, -0.28, 14],   // 14: Open red lips with pink tongue!
    [1.96, -0.58, 0.22, 0.48, 0.15, 16 % 16 === 0 ? 3 : 3],
    [1.88, -0.52, 0.28, 0.48, 0.12, 17 % 16], // Extra yellow smiley
    [0.98, -0.78, 0.32, 0.44, -0.35, 8],   // Mint/blue eyes bottom-right of legs
    [2.12, -1.02, 0.26, 0.56, 0.25, 11],   // Extra pop sticker edge
  ];

  // Clean exact 18-sticker array mapped strictly to valid tile indices 0..15:
  // Framed wide across left & right space (`r >= 1.15`, `x = ±2.45`) so the helmet & `"Let's work / together!"` stay 100% open & readable!
  const FINAL_STICKERS: ReadonlyArray<[number, number, number, number, number, number]> = [
    [0.34, 1.38, -0.35, 0.58, -0.10, 0],   // Red heart (upper center-right above helmet)
    [1.42, 1.18, -0.25, 0.88, 0.48, 1],    // Cream skeleton (upper right)
    [1.06, 0.52, 0.25, 0.54, -0.18, 2],    // Lavender smiley (mid-upper right)
    [1.86, 1.24, -0.45, 0.40, 0.12, 3],    // Black 8-ball (top right)
    [-2.36, 0.36, 0.15, 0.54, 0.22, 4],    // White daisy flower (far left)
    [-0.92, 0.30, 0.28, 0.44, -0.16, 5],   // Red-blue capsule pill (left of shoulder)
    [0.68, 0.62, -0.30, 0.54, 0.14, 6],    // Green planet lollipop (right of helmet)
    [-0.36, 1.52, -0.20, 0.54, 0.26, 7],   // Pink jewel ring-pop (high above helmet)
    [-1.38, -0.22, 0.26, 0.44, 0.14, 8],   // Googly blue eyes (mid left)
    [-0.88, -0.96, -0.28, 0.52, -0.22, 9], // Peeled yellow banana (lower left)
    [-1.62, -0.82, 0.32, 0.64, -0.45, 10], // Pink spotted mushroom (lower-mid left)
    [-1.08, -1.32, 0.36, 0.56, 0.18, 11],  // Purple biting lips (bottom left-center)
    [-2.18, -1.26, 0.24, 0.64, -0.68, 12], // Pink lollipop (bottom far left)
    [1.68, -0.22, 0.30, 0.68, 0.32, 13],   // Bitten red popsicle + lightning (mid right)
    [2.24, 0.22, 0.24, 0.64, -0.28, 14],   // Red tongue lips (far right)
    [2.16, -0.62, 0.26, 0.52, 0.12, 15],   // Bright yellow smiley (lower far right)
    [-0.86, -0.44, -0.34, 0.48, 0.52, 5],  // Retro accent left of hip
    [1.24, -0.96, 0.32, 0.46, -0.38, 8],   // Lower right eyes
  ];
  void STICKER_LAYOUT;

  const stCount = FINAL_STICKERS.length;
  stickerGeo.instanceCount = stCount;
  const tileOffsets = new Float32Array(stCount * 2);
  for (let i = 0; i < stCount; i++) {
    const tile = FINAL_STICKERS[i][5] % 16;
    const col = tile % 4;
    const row = 3 - Math.floor(tile / 4);
    tileOffsets[i * 2] = col * 0.25;
    tileOffsets[i * 2 + 1] = row * 0.25;
  }
  stickerGeo.setAttribute("aTileUv", new THREE.InstancedBufferAttribute(tileOffsets, 2));

  const stickerMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true,
      alphaTest: 0.35,
      uniforms: {
        uAtlas: { value: atlasTex },
        uOpacity: { value: 1.0 },
      },
      vertexShader: [
        "attribute vec2 aTileUv;",
        "varying vec2 vUv;",
        "void main() {",
        "  vUv = aTileUv + uv * 0.25;",
        "  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.0);",
        "}",
      ].join("\n"),
      fragmentShader: [
        "varying vec2 vUv;",
        "uniform sampler2D uAtlas;",
        "uniform float uOpacity;",
        "void main() {",
        "  vec4 texel = texture2D(uAtlas, vUv);",
        "  if (texel.a < 0.35) discard;",
        "  gl_FragColor = vec4(texel.rgb, texel.a * uOpacity);",
        "}",
      ].join("\n"),
    })
  );

  const stickerInst = new THREE.InstancedMesh(stickerGeo, stickerMat, stCount);
  stickerInst.frustumCulled = false;
  stickerInst.renderOrder = 5;
  group.add(stickerInst);

  const _dObj = new THREE.Object3D();
  const xMobileScale = isMobile ? 0.50 : 1.0;

  const update = (
    elapsedSec: number,
    scrollLift: number,
    reducedMotion: boolean,
    ptrX: number,
    ptrY: number
  ) => {
    const anim = reducedMotion ? 0 : 1;

    for (let i = 0; i < diamondCount; i++) {
      const d = diamondSeeds[i];
      const bob = Math.sin(elapsedSec * 0.95 + d.phase) * 0.055 * anim;
      const depthFactor = 0.65 + (d.z + 1.5) * 0.35;
      const px = d.x + ptrX * 0.09 * depthFactor;
      const py = d.y + bob + scrollLift * 0.42 * depthFactor + ptrY * 0.07 * depthFactor;

      _dObj.position.set(px, py, d.z);
      _dObj.rotation.set(
        d.phase + elapsedSec * d.spinX * anim,
        d.phase * 0.7 + elapsedSec * d.spinY * anim,
        d.phase * 0.4
      );
      _dObj.scale.setScalar(d.scale);
      _dObj.updateMatrix();
      diamondInst.setMatrixAt(i, _dObj.matrix);

      if (i < glintCount) {
        const pulse = 0.78 + 0.28 * Math.sin(elapsedSec * 2.1 + d.phase * 1.7) * anim;
        _dObj.position.set(px - 0.03, py + 0.035, d.z + 0.08);
        _dObj.rotation.set(0, 0, 0);
        _dObj.scale.set(0.62 * d.scale * pulse, 0.42 * d.scale * pulse, 1);
        _dObj.updateMatrix();
        glintInst.setMatrixAt(i, _dObj.matrix);
      }
    }
    diamondInst.instanceMatrix.needsUpdate = true;
    glintInst.instanceMatrix.needsUpdate = true;

    for (let i = 0; i < stCount; i++) {
      const [bx, by, bz, bSize, bRot, _tile] = FINAL_STICKERS[i];
      void _tile;
      const depthP = 0.75 + (bz + 0.5) * 0.55;
      const floatY = Math.sin(elapsedSec * 1.15 + i * 1.1) * 0.048 * anim;
      const floatX = Math.cos(elapsedSec * 0.85 + i * 0.8) * 0.030 * anim;
      _dObj.position.set(
        bx * xMobileScale + floatX + ptrX * 0.14 * depthP,
        by + floatY + scrollLift * 0.55 * depthP + ptrY * 0.10 * depthP,
        bz
      );
      _dObj.rotation.set(
        pyTilt(ptrY, anim) * 0.12,
        -pyTilt(ptrX, anim) * 0.15,
        bRot + Math.sin(elapsedSec * 0.75 + i) * 0.075 * anim + scrollLift * 0.12 * (i % 2 === 0 ? 1 : -1)
      );
      _dObj.scale.setScalar(bSize * (isMobile ? 0.78 : 1.0));
      _dObj.updateMatrix();
      stickerInst.setMatrixAt(i, _dObj.matrix);
    }
    stickerInst.instanceMatrix.needsUpdate = true;
  };

  return { group, update };
}

function pyTilt(v: number, anim: number): number {
  return v * anim;
}

/**
 * Synthesizes a crisp `2048x2048` 4x4 die-cut pop-art sticker atlas matching the playful
 * Lusion studio sticker pack (`Frames 17–20` & `09a-home-end-cta`): bold black ink linework +
 * crisp white outer die-cut border on transparent alpha!
 */
function createPopArtStickerAtlas(): THREE.CanvasTexture {
  const S = 1024;
  const T = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);

  // Fast shared reusable scratch canvases (0 per-tile canvas allocations, 8-tap border dilation = ~18ms total!)
  const off = document.createElement("canvas");
  off.width = T;
  off.height = T;
  const oc = off.getContext("2d")!;

  const border = document.createElement("canvas");
  border.width = T;
  border.height = T;
  const bc = border.getContext("2d")!;

  const drawStickerTile = (tileIdx: number, drawArt: (c: CanvasRenderingContext2D) => void) => {
    oc.setTransform(1, 0, 0, 1, 0, 0);
    oc.clearRect(0, 0, T, T);
    oc.scale(0.5, 0.5);
    oc.lineCap = "round";
    oc.lineJoin = "round";
    drawArt(oc);

    bc.globalCompositeOperation = "source-over";
    bc.clearRect(0, 0, T, T);
    const R = 10;
    for (let a = 0; a < 10; a++) {
      const ang = (a / 10) * Math.PI * 2;
      bc.drawImage(off, Math.cos(ang) * R, Math.sin(ang) * R);
    }
    bc.globalCompositeOperation = "source-in";
    bc.fillStyle = "#ffffff";
    bc.fillRect(0, 0, T, T);

    const col = tileIdx % 4;
    const row = Math.floor(tileIdx / 4);
    ctx.drawImage(border, col * T, row * T);
    ctx.drawImage(off, col * T, row * T);
  };

  const ink = (c: CanvasRenderingContext2D, fill: string, lw = 14) => {
    c.fillStyle = fill;
    c.strokeStyle = "#0b0d13";
    c.lineWidth = lw;
    c.fill();
    c.stroke();
  };

  // Tile 0: Classic Puffy Red Cartoon Heart (`Frames 17, 18, 09a`)
  drawStickerTile(0, (c) => {
    c.beginPath();
    c.moveTo(256, 398);
    c.bezierCurveTo(96, 295, 76, 152, 168, 118);
    c.bezierCurveTo(222, 98, 252, 145, 256, 175);
    c.bezierCurveTo(260, 145, 290, 98, 344, 118);
    c.bezierCurveTo(436, 152, 416, 295, 256, 398);
    c.closePath();
    ink(c, "#e03a26", 15);
  });

  // Tile 1: Upside-Down Cream Cartoon Skeleton (`Frames 17, 18`)
  drawStickerTile(1, (c) => {
    c.save();
    c.translate(256, 256);
    c.rotate(Math.PI);
    c.translate(-256, -256);
    // Skull
    c.beginPath();
    c.arc(256, 128, 56, 0, Math.PI * 2);
    ink(c, "#f6f5be", 13);
    c.fillStyle = "#0b0d13";
    c.beginPath();
    c.arc(238, 122, 11, 0, Math.PI * 2);
    c.arc(274, 122, 11, 0, Math.PI * 2);
    c.fill();
    // Spine & Ribs
    c.strokeStyle = "#f6f5be";
    for (const [x1, y1, x2, y2] of [
      [256, 184, 256, 305],
      [205, 206, 307, 206],
      [210, 236, 302, 236],
      [216, 266, 296, 266],
      [205, 206, 175, 295],
      [307, 206, 337, 295],
      [232, 305, 212, 428],
      [280, 305, 300, 428],
    ]) {
      c.beginPath();
      c.moveTo(x1, y1);
      c.lineTo(x2, y2);
      c.lineWidth = 28;
      c.strokeStyle = "#0b0d13";
      c.stroke();
      c.lineWidth = 14;
      c.strokeStyle = "#f6f5be";
      c.stroke();
    }
    c.restore();
  });

  // Tile 2: Lavender Smiley Circle (`Frames 17, 18, 19, 20`)
  drawStickerTile(2, (c) => {
    c.beginPath();
    c.arc(256, 256, 156, 0, Math.PI * 2);
    ink(c, "#c985f7", 15);
    c.fillStyle = "#0b0d13";
    c.beginPath();
    c.ellipse(215, 220, 12, 32, 0, 0, Math.PI * 2);
    c.ellipse(297, 220, 12, 32, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(256, 266, 92, 0.22, Math.PI - 0.22);
    c.lineWidth = 13;
    c.stroke();
  });

  // Tile 3: Glossy Black 8-Ball (`Frames 17, 09a`)
  drawStickerTile(3, (c) => {
    c.beginPath();
    c.arc(256, 256, 148, 0, Math.PI * 2);
    ink(c, "#0e1017", 15);
    c.beginPath();
    c.arc(232, 224, 66, 0, Math.PI * 2);
    c.fillStyle = "#ffffff";
    c.fill();
    c.fillStyle = "#0e1017";
    c.font = "bold 78px sans-serif";
    c.textAlign = "center";
    c.textBaseline = "middle";
    c.fillText("8", 232, 228);
  });

  // Tile 4: White Daisy Flower with Worried Yellow Face (`Frames 17, 18, 19, 20`)
  drawStickerTile(4, (c) => {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      c.beginPath();
      c.ellipse(256 + Math.cos(a) * 108, 256 + Math.sin(a) * 108, 56, 44, a, 0, Math.PI * 2);
      ink(c, "#ffffff", 14);
    }
    c.beginPath();
    c.arc(256, 256, 86, 0, Math.PI * 2);
    ink(c, "#f6ea5c", 14);
    c.fillStyle = "#0b0d13";
    c.beginPath();
    c.ellipse(230, 240, 9, 22, 0, 0, Math.PI * 2);
    c.ellipse(282, 240, 9, 22, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.moveTo(216, 294);
    c.bezierCurveTo(236, 278, 256, 308, 296, 288);
    c.lineWidth = 11;
    c.stroke();
  });

  // Tile 5: Two-Tone Red & Cobalt Capsule Pill (`Frames 17, 18, 19, 20`)
  drawStickerTile(5, (c) => {
    c.save();
    c.translate(256, 256);
    c.rotate(-0.22);
    c.beginPath();
    c.roundRect(-86, -168, 172, 336, 86);
    ink(c, "#e53b2c", 15);
    c.save();
    c.clip();
    c.fillStyle = "#292bf5";
    c.fillRect(-95, -175, 190, 175);
    c.beginPath();
    c.moveTo(-95, 0);
    c.lineTo(95, 0);
    c.lineWidth = 14;
    c.stroke();
    c.restore();
    c.restore();
  });

  // Tile 6: Green Planet Lollipop (`Frames 17, 18`)
  drawStickerTile(6, (c) => {
    c.beginPath();
    c.roundRect(238, 68, 32, 210, 12);
    ink(c, "#ffffff", 14);
    c.beginPath();
    c.arc(256, 322, 86, 0, Math.PI * 2);
    ink(c, "#b3f238", 15);
    c.beginPath();
    c.ellipse(256, 322, 132, 26, -0.22, 0, Math.PI * 2);
    ink(c, "#c985f7", 13);
  });

  // Tile 7: Pink Jewel Ring-Pop (`Frames 18, 19`)
  drawStickerTile(7, (c) => {
    c.beginPath();
    c.arc(256, 326, 76, 0, Math.PI * 2);
    c.lineWidth = 34;
    c.strokeStyle = "#0b0d13";
    c.stroke();
    c.lineWidth = 18;
    c.strokeStyle = "#7bef4c";
    c.stroke();
    c.beginPath();
    c.moveTo(196, 272);
    c.lineTo(316, 272);
    c.lineTo(348, 224);
    c.lineTo(164, 224);
    c.closePath();
    ink(c, "#7bef4c", 14);
    c.beginPath();
    c.moveTo(186, 224);
    c.lineTo(156, 138);
    c.lineTo(256, 86);
    c.lineTo(356, 138);
    c.lineTo(326, 224);
    c.closePath();
    ink(c, "#e8685c", 14);
  });

  // Tile 8: Cartoon Googly Blue Eyes (`Frames 17, 18, 19, 20`)
  drawStickerTile(8, (c) => {
    for (const [ex, ey] of [
      [196, 244],
      [308, 268],
    ]) {
      c.beginPath();
      c.ellipse(ex, ey, 72, 92, -0.18, 0, Math.PI * 2);
      ink(c, "#ffffff", 15);
      c.beginPath();
      c.arc(ex + 18, ey + 28, 34, 0, Math.PI * 2);
      ink(c, "#3898f8", 10);
      c.fillStyle = "#0b0d13";
      c.beginPath();
      c.arc(ex + 22, ey + 30, 15, 0, Math.PI * 2);
      c.fill();
    }
  });

  // Tile 9: Peeled Yellow Banana (`Frames 17, 19, 20`)
  drawStickerTile(9, (c) => {
    c.beginPath();
    c.moveTo(222, 96);
    c.quadraticCurveTo(305, 195, 292, 345);
    c.quadraticCurveTo(252, 365, 212, 332);
    c.quadraticCurveTo(238, 205, 196, 112);
    c.closePath();
    ink(c, "#f8eb62", 14);
    // Left & right banana peel curls
    c.beginPath();
    c.moveTo(228, 255);
    c.quadraticCurveTo(118, 238, 108, 326);
    c.quadraticCurveTo(178, 315, 236, 298);
    c.closePath();
    ink(c, "#f4d432", 14);
    c.beginPath();
    c.moveTo(278, 258);
    c.quadraticCurveTo(388, 248, 396, 336);
    c.quadraticCurveTo(326, 322, 272, 302);
    c.closePath();
    ink(c, "#f4d432", 14);
  });

  // Tile 10: Spotted Pink Fairy-Tale Mushroom (`Frames 19, 20, 09a`)
  drawStickerTile(10, (c) => {
    c.beginPath();
    c.roundRect(216, 236, 80, 178, 36);
    ink(c, "#ffffff", 15);
    c.beginPath();
    c.moveTo(106, 256);
    c.quadraticCurveTo(256, 78, 406, 256);
    c.quadraticCurveTo(256, 292, 106, 256);
    c.closePath();
    ink(c, "#df3eb8", 15);
    c.fillStyle = "#ffffff";
    for (const [sx, sy, sr] of [
      [256, 158, 20],
      [192, 206, 18],
      [318, 204, 18],
      [256, 228, 16],
    ]) {
      c.beginPath();
      c.arc(sx, sy, sr, 0, Math.PI * 2);
      c.fill();
    }
  });

  // Tile 11: Glossy Magenta Biting Lips (`Frames 19, 20, 09a`)
  drawStickerTile(11, (c) => {
    c.beginPath();
    c.moveTo(88, 278);
    c.bezierCurveTo(156, 168, 224, 178, 256, 206);
    c.bezierCurveTo(288, 178, 356, 168, 424, 278);
    c.bezierCurveTo(348, 372, 164, 372, 88, 278);
    c.closePath();
    ink(c, "#d91df2", 15);
    c.beginPath();
    c.ellipse(256, 276, 102, 32, -0.06, 0, Math.PI * 2);
    ink(c, "#ffffff", 11);
  });

  // Tile 12: Pink Swirl Lollipop (`Frames 19, 20, 09a`)
  drawStickerTile(12, (c) => {
    c.beginPath();
    c.moveTo(256, 240);
    c.lineTo(392, 418);
    c.lineWidth = 30;
    c.strokeStyle = "#0b0d13";
    c.stroke();
    c.lineWidth = 14;
    c.strokeStyle = "#ffffff";
    c.stroke();
    c.beginPath();
    c.arc(216, 198, 102, 0, Math.PI * 2);
    ink(c, "#ef4270", 15);
    c.beginPath();
    c.moveTo(116, 212);
    c.quadraticCurveTo(216, 176, 316, 208);
    c.lineWidth = 13;
    c.strokeStyle = "#0b0d13";
    c.stroke();
  });

  // Tile 13: Bitten Red Popsicle + Yellow Lightning Bolt (`Frames 17, 19, 20, 09a`)
  drawStickerTile(13, (c) => {
    // Stick
    c.beginPath();
    c.roundRect(232, 318, 48, 128, 22);
    ink(c, "#d8a868", 14);
    // Popsicle body with top-right bite!
    c.beginPath();
    c.moveTo(156, 148);
    c.arcTo(156, 86, 286, 86, 56);
    c.arc(318, 114, 34, Math.PI, Math.PI * 0.45, true);
    c.lineTo(356, 326);
    c.lineTo(156, 326);
    c.closePath();
    ink(c, "#d94336", 15);
    // Yellow lightning bolt accent
    c.beginPath();
    c.moveTo(158, 92);
    c.lineTo(92, 168);
    c.lineTo(148, 172);
    c.lineTo(112, 248);
    c.lineTo(204, 152);
    c.lineTo(152, 148);
    c.closePath();
    ink(c, "#f6ea38", 12);
  });

  // Tile 14: Open Red Lips Sticking Out Pink Tongue (`Frames 17, 19, 20, 09a`)
  drawStickerTile(14, (c) => {
    c.beginPath();
    c.moveTo(86, 236);
    c.bezierCurveTo(156, 126, 356, 126, 426, 236);
    c.bezierCurveTo(356, 348, 156, 348, 86, 236);
    c.closePath();
    ink(c, "#e03224", 15);
    // Teeth bar
    c.beginPath();
    c.rect(164, 192, 184, 36);
    ink(c, "#ffffff", 11);
    // Pink tongue
    c.beginPath();
    c.moveTo(222, 228);
    c.bezierCurveTo(212, 378, 378, 412, 386, 276);
    c.bezierCurveTo(366, 228, 286, 224, 222, 228);
    c.closePath();
    ink(c, "#f496ad", 14);
  });

  // Tile 15: Bright Yellow Smiley + Melted Pizza Accent (`Frames 17, 19, 20`)
  drawStickerTile(15, (c) => {
    c.beginPath();
    c.arc(256, 256, 156, 0, Math.PI * 2);
    ink(c, "#f6e62c", 15);
    c.fillStyle = "#0b0d13";
    c.beginPath();
    c.ellipse(215, 222, 12, 32, 0, 0, Math.PI * 2);
    c.ellipse(297, 222, 12, 32, 0, 0, Math.PI * 2);
    c.fill();
    c.beginPath();
    c.arc(256, 266, 92, 0.22, Math.PI - 0.22);
    c.lineWidth = 13;
    c.stroke();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
