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
        uTint: { value: new THREE.Color("#ff72c5") },
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
        "  vec3 col = mix(vec3(0.55, 0.82, 1.0), uTint, fres) * core * 3.2;",
        "  gl_FragColor = vec4(col * uOpacity, core * uOpacity);",
        "  #include <tonemapping_fragment>",
        "  #include <colorspace_fragment>",
        "}",
      ].join("\n"),
    })
  );
}

/** One monotone virtual-document path; created on measurement, allocation-free when sampled.
 * Timing is an art-directed local enhancement, not extracted Lusion source timing.
 */
export function createGoalPlaybackPath(m: {
  emergenceStart: number; emergenceSpan: number; tunnelStart: number; tunnelSpan: number;
  imgOutTop: number; endTop: number; endHeight: number; viewportH: number;
}): (progress: number) => number {
  const drop = m.imgOutTop - m.viewportH * 0.55;
  const span = m.endTop - drop;
  const times = [0, 0.16, 0.23, 0.47, 0.61, 0.78, 0.83, 0.89, 0.95, 1];
  const positions = [
    m.emergenceStart + m.emergenceSpan * 0.308, m.tunnelStart,
    m.tunnelStart + m.tunnelSpan * 0.135, m.tunnelStart + m.tunnelSpan * 0.66,
    m.tunnelStart + m.tunnelSpan * 0.85, drop,
    drop + span * 0.30, drop + span * 0.72, m.endTop, m.endTop + m.endHeight * 0.42,
  ];
  const slopes = times.slice(1).map((t, i) => (positions[i + 1] - positions[i]) / (t - times[i]));
  const tangents = positions.map((_, i) => {
    if (i === 0 || i === positions.length - 1) return 0;
    const a = slopes[i - 1], b = slopes[i];
    if (a <= 0 || b <= 0) return 0;
    const h0 = times[i] - times[i - 1], h1 = times[i + 1] - times[i];
    const w0 = 2 * h1 + h0, w1 = h1 + 2 * h0;
    return (w0 + w1) / (w0 / a + w1 / b);
  });
  return (progress) => {
    const u = THREE.MathUtils.clamp(progress, 0, 1);
    let i = 0;
    while (i < times.length - 2 && u > times[i + 1]) i++;
    const h = times[i + 1] - times[i];
    const t = (u - times[i]) / h;
    const t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * positions[i] + (t3 - 2 * t2 + t) * h * tangents[i]
      + (-2 * t3 + 3 * t2) * positions[i + 1] + (t3 - t2) * h * tangents[i + 1];
  };
}

/** Frame-major captured debris transforms. Reuse outputs and quaternion scratch on every scroll sample. */
export function createGlassFrameSampler(
  positions: ArrayLike<number>,
  orientations: ArrayLike<number>,
  pieceCount: number,
  frameCount: number,
  outputPositions: Float32Array,
  outputOrientations: Float32Array
): (frame: number) => void {
  const q0 = new THREE.Quaternion();
  const q1 = new THREE.Quaternion();
  return (frame: number) => {
    const f = THREE.MathUtils.clamp(frame, 0, frameCount - 1);
    const from = Math.floor(f);
    const to = Math.min(frameCount - 1, from + 1);
    const alpha = f - from;
    for (let piece = 0; piece < pieceCount; piece++) {
      const a = from * pieceCount + piece;
      const b = to * pieceCount + piece;
      for (let c = 0; c < 3; c++) {
        outputPositions[piece * 4 + c] = THREE.MathUtils.lerp(positions[a * 3 + c], positions[b * 3 + c], alpha);
      }
      q0.fromArray(orientations, a * 4).normalize();
      q1.fromArray(orientations, b * 4).normalize();
      q0.slerp(q1, alpha).toArray(outputOrientations, piece * 4);
    }
  };
}

/** Decode the captured four unwrapped girder faces, verified against grid_base_ld's cross-section. */
export function decodeCapturedGirder(source: THREE.BufferGeometry): THREE.BufferGeometry {
  const geometry = source.clone();
  const position = geometry.getAttribute("position");
  const normal = geometry.getAttribute("normal");
  const tangent = geometry.getAttribute("tangent");
  const center = geometry.getAttribute("center");
  const height = geometry.getAttribute("height");
  const angles = [0, Math.PI, -Math.PI / 2, Math.PI / 2];
  for (let i = 0; i < position.count; i++) {
    const face = Math.round(center.getX(i));
    const angle = angles[face];
    const c = Math.cos(angle);
    const s = Math.sin(angle);
    const x = position.getX(i) - face;
    const y = 0.025 + position.getY(i) * height.getX(i);
    position.setXY(i, c * x - s * y, s * x + c * y);
    const nx = normal.getX(i);
    const ny = normal.getY(i);
    normal.setXY(i, c * nx - s * ny, s * nx + c * ny);
    if (tangent) {
      const tx = tangent.getX(i), ty = tangent.getY(i);
      tangent.setXY(i, c * tx - s * ty, s * tx + c * ty);
    }
  }
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Open-ended, nested glazing fitted to the existing shaft; never replaces captured girders.
 * Shared pane geometry, two mobile / three desktop draws, no per-frame allocations.
 */
export function buildTunnelGlazing(
  track: <T extends { dispose: () => void }>(item: T) => T,
  environment: THREE.CubeTexture,
  isMobile: boolean
): { group: THREE.Group; update: (phase: number, opacity: number, reduced: boolean) => void } {
  const group = new THREE.Group();
  const panes: THREE.BufferGeometry[] = [];
  for (let bay = 0; bay < 8; bay++) {
    for (let side = 0; side < 4; side++) {
      const pane = new THREE.PlaneGeometry(3.12, 4.4);
      pane.rotateX(Math.PI / 2);
      pane.translate(0, 1.56, -bay * 4.8);
      pane.rotateZ(side * Math.PI / 2);
      panes.push(pane);
    }
  }
  const geometry = track(mergeGeometries(panes, false)!);
  panes.forEach((pane) => pane.dispose());
  const layers: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
  for (let layer = 0; layer < (isMobile ? 2 : 3); layer++) {
    const material = track(new THREE.ShaderMaterial({
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uEnvironment: { value: environment }, uOpacity: { value: 0 }, uPhase: { value: 0 }, uLayer: { value: layer } },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vWorldPos;
        varying vec3 vNormalW;
        void main() {
          vUv = uv;
          vec4 world = modelMatrix * vec4(position, 1.0);
          vWorldPos = world.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * world;
        }`,
      fragmentShader: `
        uniform samplerCube uEnvironment;
        uniform float uOpacity, uPhase, uLayer;
        varying vec2 vUv;
        varying vec3 vWorldPos, vNormalW;
        void main() {
          vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);
          vec3 V = normalize(cameraPosition - vWorldPos);
          float fres = pow(1.0 - abs(dot(N, V)), 4.0);
          float border = min(min(vUv.x, 1.0 - vUv.x), min(vUv.y, 1.0 - vUv.y));
          float edge = 1.0 - smoothstep(0.003, 0.017, border);
          float sweep = pow(0.5 + 0.5 * cos(vWorldPos.z * 0.62 + uPhase * 18.0 - uLayer * 1.3), 12.0);
          float depth = smoothstep(-40.0, -5.0, vWorldPos.z);
          vec3 tint = vec3(0.16, 0.58, 0.73);
          float alpha = (0.018 + fres * 0.14 + edge * 0.22) * uOpacity * depth;
          // Skip optically negligible fragments before the two environment lookups.
          if (alpha < 0.006) discard;
          vec3 reflection = textureCube(uEnvironment, reflect(-V, N)).rgb;
          vec3 refracted = textureCube(uEnvironment, refract(-V, N, 1.0 / 1.46)).rgb;
          vec3 col = reflection * (0.16 + fres * 0.52) + refracted * tint * 0.16;
          col += tint * edge * (0.32 + sweep * 0.65);
          gl_FragColor = vec4(col, alpha);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    }));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.scale.setScalar(1 + layer * 0.13);
    mesh.position.z = -layer * 1.35;
    mesh.renderOrder = 1;
    mesh.frustumCulled = false;
    group.add(mesh);
    layers.push(mesh);
  }
  return { group, update: (phase, opacity, reduced) => {
    group.visible = opacity > 0.005;
    for (let i = 0; i < layers.length; i++) {
      const mesh = layers[i];
      mesh.material.uniforms.uOpacity.value = opacity;
      mesh.material.uniforms.uPhase.value = phase;
      const turn = phase * (1.8 + i * 0.38);
      const direction = i % 2 === 0 ? 1 : -1;
      mesh.rotation.z = reduced ? 0 : direction * Math.sin(turn) * (0.025 + i * 0.020);
      mesh.position.x = reduced ? 0 : Math.sin(turn * 0.65) * i * 0.018;
      mesh.position.y = reduced ? 0 : Math.sin(turn * 0.8) * i * 0.014;
      mesh.position.z = -i * 1.35 + (0.28 * phase + 0.72 * phase * phase) * (2.2 + i * 0.65);
    }
  } };
}

/** Captured inner/outer lattice, greeble PBR and a depth-dependent helical deformation.
 * Both LOD placement sets are part of the source asset, not decorative random cubes.
 */
export function buildArchitecturalTrussTunnel(
  track: <T extends { dispose: () => void }>(item: T) => T,
  isMobile: boolean,
  environment: THREE.CubeTexture
): {
  group: THREE.Group;
  tunnelMaterial: THREE.ShaderMaterial;
  vortexCoreMat: THREE.ShaderMaterial;
  flashVeilMat: THREE.ShaderMaterial;
  baySpacing: number;
} {
  const group = new THREE.Group();
  // Source structure cells are 20 units wide; keep the existing 2.96-unit flight aperture.
  const sourceScale = 1.48 / 10;
  const baySpacing = 20 * sourceScale;
  const repeats = isMobile ? 2 : 3;
  const tunnelLength = 120 * sourceScale * repeats;
  let disposed = false;
  track({ dispose: () => { disposed = true; } });

  const tunnelMaterial = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: true, // Opaque metal must self-occlude; only its phase fade is transparent.
      uniforms: {
        uOpacity: { value: 1.0 },
        uPhase: { value: 0.0 },
        uTwist: { value: 0.0 },
        uVortexPinch: { value: 0.0 },
        uTravelZ: { value: 0.0 },
        uTunnelLength: { value: tunnelLength },
        uEnvironment: { value: environment },
        uBase: { value: null },
        uArm: { value: null },
        uNormal: { value: null },
      },
      vertexShader: `
        attribute float aSeed;
        attribute float aKind;
        attribute float aBayZ;
        attribute float cluster;
        attribute float ao;
        attribute vec4 tangent;
        varying float vAo;
        varying vec3 vNormalW;
        varying vec4 vTangentW;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        varying float vDetail;
        uniform float uTwist;
        uniform float uVortexPinch;
        uniform float uTravelZ;
        uniform float uTunnelLength;
        void main() {
          vAo = ao;
          vUv = uv;
          vDetail = aKind;
          vec4 wp = instanceMatrix * vec4(position, 1.0);
          float bayZ = 3.9 - mod(3.9 - aBayZ - uTravelZ + uTunnelLength * 2.0, uTunnelLength);
          wp.z += bayZ - aBayZ;
          float depth = max(0.0, 4.2 - wp.z);
          float angle = depth * uTwist;
          mat2 rotation = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
          vec2 planar = rotation * wp.xy;
          float pinch = mix(1.0, 1.0 / (1.0 + depth * 0.075), uVortexPinch);
          float ds = wp.z < 4.2 ? uVortexPinch * 0.075 / pow(1.0 + depth * 0.075, 2.0) : 0.0;
          // GLSL's column-major rotation above has d(angle)/dz = -uTwist.
          vec2 dz = planar * ds + vec2(planar.y, -planar.x) * (-uTwist) * pinch;
          mat3 inst = mat3(instanceMatrix);
          vec3 scale2 = vec3(dot(inst[0], inst[0]), dot(inst[1], inst[1]), dot(inst[2], inst[2]));
          vec3 N = inst * (normal / scale2);
          N.xy = rotation * N.xy / pinch;
          N.z -= dot(N.xy, dz);
          vec3 T = inst * tangent.xyz;
          T.xy = rotation * T.xy * pinch + dz * T.z;
          vNormalW = normalize(N);
          vTangentW = vec4(normalize(T), tangent.w);
          wp.xy = planar * pinch;
          vWorldPos = wp.xyz;
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vNormalW;
        varying vec4 vTangentW;
        varying vec3 vWorldPos;
        varying vec2 vUv;
        varying float vAo;
        varying float vDetail;
        uniform float uOpacity;
        uniform float uPhase;
        uniform samplerCube uEnvironment;
        uniform sampler2D uBase;
        uniform sampler2D uArm;
        uniform sampler2D uNormal;
        #include <common>
        vec3 lightBRDF(vec3 N, vec3 V, vec3 L, vec3 radiance, vec3 base, float roughness, float metal) {
          vec3 H = normalize(V + L);
          float nl = max(dot(N, L), 0.0);
          float nv = max(dot(N, V), 0.001);
          float nh = max(dot(N, H), 0.0);
          float vh = max(dot(V, H), 0.0);
          float a2 = pow(roughness, 4.0);
          float d = a2 / max(PI * pow(nh * nh * (a2 - 1.0) + 1.0, 2.0), 0.00001);
          float k = pow(roughness + 1.0, 2.0) * 0.125;
          float g = nv / (nv * (1.0-k) + k) * nl / (nl * (1.0-k) + k);
          vec3 f0 = mix(vec3(0.04), base, metal);
          vec3 f = f0 + (1.0 - f0) * pow(1.0 - vh, 5.0);
          return ((1.0-f) * base * (1.0-metal) / PI + d*g*f / max(4.0*nv*nl, 0.001)) * nl * radiance;
        }
        void main() {
          vec3 N = normalize(vNormalW);
          vec3 T = normalize(vTangentW.xyz - N * dot(N, vTangentW.xyz));
          vec3 B = normalize(cross(N, T)) * vTangentW.w;
          vec3 mapN = texture2D(uNormal, vUv).xyz * 2.0 - 1.0;
          mapN.xy *= 0.75 * vDetail;
          N = normalize(mat3(T, B, N) * mapN);
          vec3 V = normalize(cameraPosition - vWorldPos);
          vec3 arm = texture2D(uArm, vUv).rgb;
          vec3 base = mix(vec3(0.19), texture2D(uBase, vUv).rgb * 1.55, vDetail);
          float roughness = mix(0.32, clamp(arm.g * 0.45, 0.16, 0.40), vDetail);
          float metal = mix(0.85, max(arm.b, 0.72), vDetail);
          float warm = smoothstep(0.24, 0.36, uPhase);
          float pink = smoothstep(0.49, 0.59, uPhase);
          vec3 primary = mix(vec3(0.72, 0.9, 1.0), vec3(1.0, 0.10, 0.055), warm);
          primary = mix(primary, vec3(1.0, 0.075, 0.40), pink);
          vec3 secondary = mix(vec3(0.14, 0.85, 1.0), vec3(0.18, 0.72, 1.0), pink);
          // Shaft-mounted strips: lighting follows depth, never random per-frame glint flashes.
          vec3 L1 = normalize(vec3(-2.0, 2.1, 2.5) - vWorldPos * vec3(1.0, 1.0, 0.18));
          vec3 L2 = normalize(vec3(2.2, -1.5, 0.0) - vWorldPos * vec3(1.0, 1.0, 0.12));
          vec3 col = lightBRDF(N,V,L1,primary*3.5,base,roughness,metal);
          col += lightBRDF(N,V,L2,secondary*2.5,base,roughness,metal);
          vec3 reflected = textureCube(uEnvironment, reflect(-V, N)).rgb;
          float luminance = dot(reflected, vec3(0.2126,0.7152,0.0722));
          float fresnel = pow(1.0 - max(dot(N,V),0.0),5.0);
          col += (vec3(luminance)*0.75 + reflected*0.25) * mix(vec3(0.82,0.92,1.0),primary,pink*0.65) * (0.025+fresnel*0.22);
          col += base * 0.025;
          col *= mix(0.16,1.0,vDetail);
          col *= mix(0.28,1.0,clamp(vAo * mix(1.0,arm.r,vDetail),0.0,1.0));
          float depthFade = smoothstep(-51.0,-3.5,vWorldPos.z);
          gl_FragColor = vec4(col * depthFade, uOpacity);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `
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
        "  vec3 cE = vec3(0.28, 0.85, 1.0);",
        "  vec3 cP = vec3(1.0, 0.4, 0.9);",
        "  vec3 col = mix(cE, cP, uMode) * core;",
        "  gl_FragColor = vec4(col * uIntensity, clamp(core * uIntensity, 0.0, 1.0));",
        "}"
      ].join("\n")
    })
  );

  const corePlane = new THREE.Mesh(track(new THREE.PlaneGeometry(8, 8)), vortexCoreMat);
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

  const textures = new THREE.TextureLoader();
  const loadMap = async (name: string, colorSpace: THREE.ColorSpace) => {
    const texture = track(await textures.loadAsync(`/assets/textures/tunnels/grids/greeble_${name}.webp`));
    texture.colorSpace = colorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = isMobile ? 2 : 4;
    return texture;
  };
  void import("@/lib/lusion-buf-loader")
    .then(async ({ loadLusionBuf }) => Promise.all([
      loadLusionBuf("/assets/models/tunnels/grid_base_hd.buf"),
      loadLusionBuf("/assets/models/tunnels/grid_base_ld.buf"),
      loadLusionBuf("/assets/models/tunnels/grid_structure_hd.buf"),
      loadLusionBuf("/assets/models/tunnels/grid_structure_ld.buf"),
      loadMap("base", THREE.SRGBColorSpace), loadMap("arm", THREE.NoColorSpace), loadMap("nor", THREE.NoColorSpace),
    ]))
    .then(([hd, ld, inner, outer, base, arm, normal]) => {
      if (disposed) return;
      tunnelMaterial.uniforms.uBase.value = base;
      tunnelMaterial.uniforms.uArm.value = arm;
      tunnelMaterial.uniforms.uNormal.value = normal;
      const detail = decodeCapturedGirder(hd.geometry);
      const core = ld.geometry.clone();
      for (const [source, structure, detailed] of [[detail, inner, true], [core, outer, false]] as const) {
        // Two immutable instanced batches: detailed inner 96 + lightweight outer 456 per repeat.
        const geometry = track(source);
        if (!geometry.hasAttribute("ao")) geometry.setAttribute("ao", new THREE.Float32BufferAttribute(new Float32Array(geometry.getAttribute("position").count).fill(1),1));
        const count = structure.header.vertexCount * repeats;
        const seeds = new Float32Array(count);
        const kinds = new Float32Array(count).fill(detailed ? 1 : 0);
        const bayZ = new Float32Array(count);
        const mesh = track(new THREE.InstancedMesh(geometry, tunnelMaterial, count));
        mesh.name = detailed ? "CapturedInnerLattice" : "CapturedOuterLattice";
        mesh.frustumCulled = false;
        const matrix = new THREE.Matrix4();
        const rotation = new THREE.Quaternion();
        const position = new THREE.Vector3();
        const thickness = detailed ? 0.62 : 0.22;
        const scale = new THREE.Vector3(baySpacing * thickness, baySpacing * thickness, baySpacing);
        const axis = new THREE.Vector3();
        const positions = structure.geometry.getAttribute("position");
        const axes = structure.geometry.getAttribute("rotAxis");
        for (let repeat = 0; repeat < repeats; repeat++) {
          for (let j = 0; j < positions.count; j++) {
            const i = repeat * positions.count + j;
            axis.fromBufferAttribute(axes,j);
            rotation.setFromAxisAngle(axis,axis.z > 0.5 ? 0 : Math.PI/2);
            position.fromBufferAttribute(positions,j).multiplyScalar(sourceScale);
            position.z += 3.9 - repeat * 120 * sourceScale;
            mesh.setMatrixAt(i,matrix.compose(position,rotation,scale));
            seeds[i] = j / positions.count;
            bayZ[i] = position.z;
          }
        }
        geometry.setAttribute("aSeed",new THREE.InstancedBufferAttribute(seeds,1));
        geometry.setAttribute("aKind",new THREE.InstancedBufferAttribute(kinds,1));
        geometry.setAttribute("aBayZ",new THREE.InstancedBufferAttribute(bayZ,1));
        mesh.instanceMatrix.needsUpdate = true;
        group.add(mesh);
      }
    })
    .catch((error: unknown) => {
      if (!disposed) console.warn("Goal truss asset unavailable", error);
    });

  return { group, tunnelMaterial, vortexCoreMat, flashVeilMat, baySpacing };
}
export function buildBlueArchCorridor(
  track: <T extends { dispose: () => void }>(item: T) => T,
  onAssetsReady?: (group: THREE.Group) => void,
  compact = false
): {
  group: THREE.Group;
  travelGroup: THREE.Group;
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
  const travelGroup = new THREE.Group();
  group.add(travelGroup);
  travelGroup.add(new THREE.Mesh(mergedArchGeo, archHdrMat));

  const mergedPilGeo = track(mergeGeometries(pilasterParts, false)!);
  pilasterParts.forEach((g) => g.dispose());
  const pilMat = track(new THREE.MeshBasicMaterial({ color: 0x2648f8 }));
  travelGroup.add(new THREE.Mesh(mergedPilGeo, pilMat));

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

  // Captured architectural base/wall modules plus reference-reconstructed extruded motifs.
  // The procedural corridor above remains an asset-failure fallback, never a second visible layer.
  let disposed = false;
  track({ dispose: () => { disposed = true; } });
  const capturedCorridor = new THREE.Group();
  capturedCorridor.name = "CapturedBlueCorridor";
  const loader = new THREE.TextureLoader();
  void import("@/lib/lusion-buf-loader")
    .then(async ({ loadLusionBuf }) => Promise.all([
      loadLusionBuf("/assets/models/tunnels/tunnel_block_base.buf"),
      loadLusionBuf("/assets/models/tunnels/tunnel_block_wall.buf"),
      loader.loadAsync("/assets/textures/tunnels/white_block.webp").then(track),
    ]))
    .then(([base, wall, atlas]) => {
      if (disposed) return;
      atlas.colorSpace = THREE.SRGBColorSpace;
      atlas.anisotropy = 4;
      const floorMaterial = track(new THREE.MeshBasicMaterial({ color: "#283cff", map: atlas, side: THREE.DoubleSide }));
      const wallMaterial = track(new THREE.MeshBasicMaterial({ color: "#283cff", map: atlas, side: THREE.DoubleSide }));
      // Baked atlas carries the sculpted recess shadows; a small lift preserves cobalt in shadow.
      const liftAtlas: THREE.MeshBasicMaterial["onBeforeCompile"] = (shader) => {
        shader.fragmentShader = shader.fragmentShader.replace("#include <map_fragment>", `
          vec4 baked = texture2D(map, vMapUv);
          diffuseColor.rgb *= mix(vec3(0.58), baked.rgb, 0.42);
        `);
      };
      floorMaterial.onBeforeCompile = wallMaterial.onBeforeCompile = liftAtlas;
      floorMaterial.customProgramCacheKey = wallMaterial.customProgramCacheKey = () => "captured-cobalt-atlas-v1";
      const count = 9;
      const matrix = new THREE.Matrix4();
      for (const [data, material] of [[base,floorMaterial],[wall,wallMaterial]] as const) {
        const geometry = track(data.geometry.clone());
        const mesh = track(new THREE.InstancedMesh(geometry,material,count));
        mesh.frustumCulled = false;
        for (let i = 0; i < count; i++) {
          matrix.makeScale(7.6,7.6,7.2);
          matrix.setPosition(0,0,4.0-i*7.2);
          mesh.setMatrixAt(i,matrix);
        }
        capturedCorridor.add(mesh);
      }
      // Fixed reference motifs: rounded heart/club outlines and circular rings have actual
      // extruded edges. Do not paint the earlier cloud approximation onto a flat box.
      const heart = new THREE.Shape();
      heart.moveTo(0,-0.9);
      heart.bezierCurveTo(-0.18,-0.78,-1.0,-0.12,-1.0,0.42);
      heart.bezierCurveTo(-1.0,1.10,-0.24,1.15,0,0.62);
      heart.bezierCurveTo(0.24,1.15,1.0,1.10,1.0,0.42);
      heart.bezierCurveTo(1.0,-0.12,0.18,-0.78,0,-0.9);
      const heartHole = new THREE.Path(heart.getPoints(compact ? 12 : 24).map((p) => p.multiplyScalar(0.68)));
      heart.holes.push(heartHole);
      const ring = new THREE.Shape();
      ring.absarc(0,0,0.82,0,Math.PI*2,false);
      const ringHole = new THREE.Path();
      ringHole.absarc(0,0,0.57,0,Math.PI*2,true);
      ring.holes.push(ringHole);
      const motifs = [heart,ring].map((shape) => new THREE.ExtrudeGeometry(shape,{depth:0.07,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:0.008,bevelThickness:0.008,curveSegments:compact ? 12 : 24}));
      const motifParts: THREE.BufferGeometry[] = [];
      for (let bay = 0; bay < 8; bay++) {
        for (let side = 0; side < 4; side++) {
          for (let item = 0; item < 2; item++) {
            const part = motifs[(bay+side+item)%2].clone();
            const size = item === 0 ? 2.0 : 1.4;
            part.scale(size,size,1);
            part.rotateZ((side%2 ? -0.35 : 0.40) + (bay%2)*0.6);
            part.rotateX(Math.PI/2);
            part.translate(item === 0 ? -0.65 : 1.75,-3.74,2.3-bay*7.2-item*3.1);
            part.rotateZ(side*Math.PI/2);
            motifParts.push(part);
          }
        }
      }
      const motifGeometry = track(mergeGeometries(motifParts,false)!);
      motifParts.forEach((g) => g.dispose());
      motifs.forEach((g) => g.dispose());
      const motifMaterial = track(new THREE.MeshStandardMaterial({color:"#f4f7ff",roughness:0.42,metalness:0.06}));
      capturedCorridor.add(new THREE.Mesh(motifGeometry,motifMaterial));
      // White environment outside the source cutouts: a real recess, not a painted white arch.
      const lightbox = new THREE.Mesh(track(new THREE.BoxGeometry(10.0,7.65,70)),track(new THREE.MeshBasicMaterial({color:new THREE.Color(2.0,2.15,2.4),side:THREE.BackSide})));
      lightbox.position.z = -27;
      capturedCorridor.add(lightbox);
      corridorMaterials.push(floorMaterial,wallMaterial,lightbox.material,motifMaterial);
      if (clippedState) for (const material of [floorMaterial,wallMaterial,lightbox.material,motifMaterial]) {
        material.stencilWrite = true;
        material.stencilFunc = THREE.EqualStencilFunc;
        material.stencilRef = 2;
        material.needsUpdate = true;
      }
      shaftMesh.visible = false;
      // Existing travelGroup owns corridor travel and its stencil handoff.
      for (const child of travelGroup.children) child.visible = false;
      // Seal the actual far cross-section, not a smaller floating rectangle halfway down it.
      endCap.position.z = -60.8;
      endCap.scale.set(7.6/8.2,7.6/6.2,1);
      endCap.visible = true;
      travelGroup.add(endCap);
      travelGroup.add(capturedCorridor);
      onAssetsReady?.(group);
    })
    .catch((error: unknown) => { if (!disposed) console.warn("Goal blue corridor asset unavailable",error); });

  return { group, travelGroup, wallTexture, endGlowMat, monitorStencilMask, setMonitorClip };
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
