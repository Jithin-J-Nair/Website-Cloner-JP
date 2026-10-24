import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";
import * as SkeletonUtils from "three/examples/jsm/utils/SkeletonUtils.js";
import { loadLusionBuf } from "@/lib/lusion-buf-loader";

export interface AstronautBoneMap {
  Hips?: THREE.Bone;
  Spine?: THREE.Bone;
  Chest?: THREE.Bone;
  Neck?: THREE.Bone;
  Head?: THREE.Bone;
  ShoulderL?: THREE.Bone;
  ElbowL?: THREE.Bone;
  WristL?: THREE.Bone;
  ShoulderR?: THREE.Bone;
  ElbowR?: THREE.Bone;
  WristR?: THREE.Bone;
  HipL?: THREE.Bone;
  KneeL?: THREE.Bone;
  HipR?: THREE.Bone;
  KneeR?: THREE.Bone;
}

export interface LoadedAstronautRig {
  root: THREE.Group;
  modelRoot: THREE.Object3D;
  bones: AstronautBoneMap;
  restQuats: Record<string, THREE.Quaternion>;
  materials: THREE.Material[];
  visorMaterial: THREE.MeshPhysicalMaterial | null;
  visorEarthUniform: { value: number };
  visorAnchorLocal: THREE.Vector3;
  drawCalls: number;
  triangles: number;
}

export interface SuitJointPose {
  chest: [number, number, number];
  head: [number, number, number];
  shoulderR: [number, number, number];
  elbowR: [number, number, number];
  wristR: [number, number, number];
  shoulderL: [number, number, number];
  elbowL: [number, number, number];
  wristL: [number, number, number];
  hipR: [number, number, number];
  kneeR: [number, number, number];
  hipL: [number, number, number];
  kneeL: [number, number, number];
}

/**
 * Stage 0 (`Frames 01–03`, inside 3D tablet portal):
 * Foreshortened zero-g reach — upper arms out-forward, elbows bent forward toward camera,
 * gloved hands raised to neck/chin level with curled relaxed fingers (`detail_01`!).
 */
export const SUIT_POSE_TABLET_FLOAT: SuitJointPose = {
  chest: [0.02, 0.0, 0.0],
  head: [-0.02, 0.02, 0.0],
  shoulderR: [-0.46, 0.14, -0.18],
  elbowR: [-1.05, -0.10, 0.16],
  wristR: [-0.14, 0.32, 0.22],
  shoulderL: [-0.46, -0.14, 0.18],
  elbowL: [-1.05, 0.10, -0.16],
  wristL: [-0.14, -0.32, -0.22],
  hipR: [-0.26, 0.04, -0.06],
  kneeR: [0.46, 0.0, 0.0],
  hipL: [-0.22, -0.04, 0.06],
  kneeL: [0.40, 0.0, 0.0],
};

/**
 * Stage 1 (`Frame 04`, open black space):
 * Natural zero-g EVA float verified directly against `public/models/astronaut.glb` rest skeleton (`detail_04`!).
 */
export const SUIT_POSE_OPEN_SPACE: SuitJointPose = {
  chest: [0.02, 0.02, -0.01],
  head: [-0.02, 0.02, 0.0],
  shoulderR: [-0.48, 0.16, -0.20],
  elbowR: [-1.08, -0.12, 0.18],
  wristR: [-0.14, 0.34, 0.22],
  shoulderL: [-0.44, -0.12, 0.24],
  elbowL: [-0.96, 0.10, -0.14],
  wristL: [-0.12, -0.30, -0.20],
  hipR: [-0.28, 0.04, -0.06],
  kneeR: [0.50, 0.0, 0.0],
  hipL: [-0.24, -0.04, 0.06],
  kneeL: [0.44, 0.0, 0.0],
};

/**
 * Stage 2 (`Frames 05–06`, lens ring + headline entry):
 * Calm zero-g drift in front of headline (`detail_05` & `Frame 06`!).
 */
export const SUIT_POSE_ZERO_G_FLOAT: SuitJointPose = {
  chest: [0.03, -0.02, 0.0],
  head: [-0.02, -0.02, 0.0],
  shoulderR: [-0.50, 0.18, -0.16],
  elbowR: [-1.10, -0.14, 0.20],
  wristR: [-0.16, 0.36, 0.24],
  shoulderL: [-0.50, -0.18, 0.16],
  elbowL: [-1.10, 0.14, -0.20],
  wristL: [-0.16, -0.36, -0.24],
  hipR: [-0.34, 0.05, -0.06],
  kneeR: [0.60, 0.0, 0.0],
  hipL: [-0.30, -0.05, 0.06],
  kneeL: [0.54, 0.0, 0.0],
};

/**
 * Stage 3 (`Frame 07`, three-quarter right-facing crouch glide under white headline):
 * Knees deeply flexed into zero-g crouch, both arms reaching forward-right (`Frame 07`!).
 */
export const SUIT_POSE_PROFILE_GLIDE: SuitJointPose = {
  chest: [0.14, 0.0, 0.0],
  head: [-0.10, -0.12, 0.0],
  shoulderR: [-0.88, 0.22, -0.18],
  elbowR: [-0.78, -0.18, 0.28],
  wristR: [-0.12, 0.25, 0.15],
  shoulderL: [-0.94, -0.20, 0.18],
  elbowL: [-0.68, 0.18, -0.28],
  wristL: [-0.12, -0.25, -0.15],
  hipR: [-1.12, 0.04, -0.05],
  kneeR: [1.34, 0.0, 0.0],
  hipL: [-0.92, -0.04, 0.05],
  kneeL: [1.14, 0.0, 0.0],
};

/**
 * Stage 4 (`Frame 08`, full-body rear zero-g swim in front of wide justified headline):
 * Viewed from behind (`ry = -PI`): arms extending forward into `-Z_world`, left knee raised screen-left, right leg extended lower (`Frame 08`!).
 */
export const SUIT_POSE_BACK_RECEDE: SuitJointPose = {
  chest: [0.12, 0.0, 0.0],
  head: [-0.14, 0.0, 0.0],
  shoulderR: [-0.68, 0.28, -0.08],
  elbowR: [-0.92, -0.24, 0.36],
  wristR: [-0.14, 0.28, 0.16],
  shoulderL: [-0.68, -0.28, 0.08],
  elbowL: [-0.92, 0.24, -0.36],
  wristL: [-0.14, -0.28, -0.16],
  hipR: [-0.12, 0.05, -0.08],
  kneeR: [0.22, 0.0, 0.0],
  hipL: [-0.52, -0.06, 0.10],
  kneeL: [1.16, 0.0, 0.0],
};

export const SUIT_POSE_STANDING: SuitJointPose = {
  chest: [0.0, 0.0, 0.0],
  head: [0.02, 0.0, 0.0],
  shoulderR: [-0.04, 0.0, 0.24],
  elbowR: [-0.1, 0.0, 0.06],
  wristR: [0.0, 0.0, 0.0],
  shoulderL: [-0.04, 0.0, -0.24],
  elbowL: [-0.1, 0.0, -0.06],
  wristL: [0.0, 0.0, 0.0],
  hipR: [-0.02, 0.0, 0.02],
  kneeR: [0.04, 0.0, 0.0],
  hipL: [-0.02, 0.0, -0.02],
  kneeL: [0.04, 0.0, 0.0],
};

const POSES_BY_STAGE: ReadonlyArray<SuitJointPose> = [
  SUIT_POSE_TABLET_FLOAT, // 0
  SUIT_POSE_OPEN_SPACE,   // 1
  SUIT_POSE_ZERO_G_FLOAT, // 2
  SUIT_POSE_PROFILE_GLIDE,// 3
  SUIT_POSE_BACK_RECEDE,  // 4
];

const lerpN = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function blendSuitPose(a: SuitJointPose, b: SuitJointPose, t: number): SuitJointPose {
  const mix3 = (u: [number, number, number], v: [number, number, number]): [number, number, number] => [
    lerpN(u[0], v[0], t),
    lerpN(u[1], v[1], t),
    lerpN(u[2], v[2], t),
  ];
  return {
    chest: mix3(a.chest, b.chest),
    head: mix3(a.head, b.head),
    shoulderR: mix3(a.shoulderR, b.shoulderR),
    elbowR: mix3(a.elbowR, b.elbowR),
    wristR: mix3(a.wristR, b.wristR),
    shoulderL: mix3(a.shoulderL, b.shoulderL),
    elbowL: mix3(a.elbowL, b.elbowL),
    wristL: mix3(a.wristL, b.wristL),
    hipR: mix3(a.hipR, b.hipR),
    kneeR: mix3(a.kneeR, b.kneeR),
    hipL: mix3(a.hipL, b.hipL),
    kneeL: mix3(a.kneeL, b.kneeL),
  };
}

export function evaluateSuitPoseStage(stage: number): SuitJointPose {
  const maxIdx = POSES_BY_STAGE.length - 1;
  const s = Math.max(0, Math.min(maxIdx, stage));
  const i = Math.min(maxIdx - 1, Math.floor(s));
  return blendSuitPose(POSES_BY_STAGE[i], POSES_BY_STAGE[i + 1], s - i);
}

const _tmpEuler = new THREE.Euler();
const _tmpQuat = new THREE.Quaternion();

export function applySuitJointPose(rig: LoadedAstronautRig, pose: SuitJointPose): void {
  const entries: Array<[keyof AstronautBoneMap, [number, number, number]]> = [
    ["Chest", pose.chest],
    ["Head", pose.head],
    ["ShoulderR", pose.shoulderR],
    ["ElbowR", pose.elbowR],
    ["WristR", pose.wristR],
    ["ShoulderL", pose.shoulderL],
    ["ElbowL", pose.elbowL],
    ["WristL", pose.wristL],
    ["HipR", pose.hipR],
    ["KneeR", pose.kneeR],
    ["HipL", pose.hipL],
    ["KneeL", pose.kneeL],
  ];

  for (const [name, rot] of entries) {
    const bone = rig.bones[name];
    const rest = rig.restQuats[name];
    if (bone && rest) {
      _tmpEuler.set(rot[0], rot[1], rot[2], "XYZ");
      _tmpQuat.setFromEuler(_tmpEuler);
      bone.quaternion.copy(rest).multiply(_tmpQuat);
    }
  }
}

function maybeDownsampleTexture(tex: THREE.Texture | null, maxDim: number): THREE.Texture | null {
  if (!tex || !tex.image) return tex;
  const img = tex.image as { width?: number; height?: number };
  const w = img.width ?? 0;
  const h = img.height ?? 0;
  if (w <= maxDim && h <= maxDim) return tex;

  const scale = maxDim / Math.max(w, h);
  const nw = Math.max(64, Math.round(w * scale));
  const nh = Math.max(64, Math.round(h * scale));
  const cv = document.createElement("canvas");
  cv.width = nw;
  cv.height = nh;
  const ctx = cv.getContext("2d");
  if (!ctx) return tex;
  ctx.drawImage(tex.image as CanvasImageSource, 0, 0, nw, nh);

  const down = new THREE.CanvasTexture(cv);
  down.wrapS = tex.wrapS;
  down.wrapT = tex.wrapT;
  down.repeat.copy(tex.repeat);
  down.colorSpace = tex.colorSpace;
  down.needsUpdate = true;
  return down;
}

/**
 * Builds the procedural PMREM deep-space solar studio environment map for the astronaut suit & visor.
 * Central +Z stays pure deep space black (`0x000000`) so the visor interior never gets spurious
 * studio strip lines in open space (`detail_04` & `detail_05`!), while grazing solar rim cards
 * illuminate upper-left helmet & visor edge cleanly. All temp resources are disposed immediately.
 */
export function buildAstronautStudioEnv(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x000000);

  const tempDisposables: Array<{ dispose: () => void }> = [];

  const addCard = (
    w: number,
    h: number,
    pos: [number, number, number],
    mat: THREE.MeshBasicMaterial
  ) => {
    const geo = new THREE.PlaneGeometry(w, h);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(pos[0], pos[1], pos[2]);
    mesh.lookAt(0, 0, 0);
    s.add(mesh);
    tempDisposables.push(geo, mat);
  };

  // Pinpoint upper-left solar disc matching the grazing visor corner highlight in detail_01/04/05
  addCard(
    0.34,
    0.34,
    [-6.2, 3.6, 2.2],
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 0.99, 0.97).multiplyScalar(16.0),
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );

  // Far grazing left rim strip (`x = -7.5, z = -1.2` — well outside the front visor mirror cone!)
  addCard(
    0.55,
    7.5,
    [-7.5, 2.4, -1.2],
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.94, 0.97, 1.0).multiplyScalar(3.6),
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );

  // Subtle cool rear-right Earthshine rim (`z = -2.2` — zero spurious line on front visor glass!)
  addCard(
    0.8,
    6.5,
    [6.8, -2.4, -2.2],
    new THREE.MeshBasicMaterial({
      color: new THREE.Color(0.28, 0.52, 1.0).multiplyScalar(2.0),
      side: THREE.DoubleSide,
      toneMapped: false,
    })
  );

  const prevToneMapping = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(s, 0.02);
  pmrem.dispose();

  renderer.toneMapping = prevToneMapping;
  for (const d of tempDisposables) d.dispose();
  return target;
}

/**
 * Loads `/models/astronaut.glb` (`EXT_meshopt_compression` + `EXT_texture_webp`) lazily and constructs
 * studio-calibrated `THREE.MeshPhysicalMaterial` surfaces + curved visor Earth-limb reflection shader
 * (`detail_01`: curved cloudy blue Earth reflected in lower visor -> `detail_04/05`: pure black obsidian!).
 */
export async function loadLicensedAstronautGlb(
  visorEnvTex: THREE.Texture,
  isMobile: boolean,
  track: <T extends { dispose: () => void }>(item: T) => T
): Promise<{
  primary: LoadedAstronautRig;
  createClone: () => LoadedAstronautRig;
}> {
  const loader = new GLTFLoader();
  loader.setMeshoptDecoder(MeshoptDecoder);

  const gltf = await loader.loadAsync("/models/astronaut.glb");

  let normalMapTex: THREE.Texture | null = null;
  let ormMapTex: THREE.Texture | null = null;

  gltf.scene.traverse((obj) => {
    if ((obj as THREE.Mesh).isMesh) {
      const mesh = obj as THREE.Mesh;
      track(mesh.geometry);
      const srcMat = mesh.material as THREE.MeshStandardMaterial;
      if (!normalMapTex && srcMat.normalMap) {
        srcMapColorFix(srcMat.normalMap, THREE.NoColorSpace);
        normalMapTex = isMobile
          ? maybeDownsampleTexture(srcMat.normalMap, 1024)
          : srcMat.normalMap;
        if (normalMapTex) track(normalMapTex);
        if (isMobile && srcMat.normalMap !== normalMapTex) {
          srcMat.normalMap.dispose();
        }
      }
      if (!ormMapTex && srcMat.roughnessMap) {
        srcMapColorFix(srcMat.roughnessMap, THREE.NoColorSpace);
        ormMapTex = isMobile
          ? maybeDownsampleTexture(srcMat.roughnessMap, 1024)
          : srcMat.roughnessMap;
        if (ormMapTex) track(ormMapTex);
        if (isMobile && srcMat.roughnessMap !== ormMapTex) {
          srcMat.roughnessMap.dispose();
        }
      }
      srcMat.dispose();
    }
  });

  if (normalMapTex) {
    (normalMapTex as THREE.Texture).wrapS = THREE.RepeatWrapping;
    (normalMapTex as THREE.Texture).wrapT = THREE.RepeatWrapping;
  }
  if (ormMapTex) {
    (ormMapTex as THREE.Texture).wrapS = THREE.RepeatWrapping;
    (ormMapTex as THREE.Texture).wrapT = THREE.RepeatWrapping;
  }

  const buildRigFromScene = (sceneClone: THREE.Object3D): LoadedAstronautRig => {
    const root = new THREE.Group();
    root.add(sceneClone);

    const bones: AstronautBoneMap = {};
    const restQuats: Record<string, THREE.Quaternion> = {};
    const materials: THREE.Material[] = [];
    const visorEarthUniform = { value: 1.0 };
    let drawCalls = 0;
    let triangles = 0;

    const fabricMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#eceff6"),
        roughness: 0.72,
        metalness: 0.0,
        sheen: 0.62,
        sheenRoughness: 0.62,
        sheenColor: new THREE.Color("#dce8ff"),
        normalMap: normalMapTex,
        normalScale: new THREE.Vector2(1.25, 1.25),
        roughnessMap: ormMapTex,
        aoMap: ormMapTex,
        aoMapIntensity: 0.94,
        envMap: visorEnvTex,
        envMapIntensity: 0.08,
      })
    );

    const webbingMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#e1e6f0"),
        roughness: 0.50,
        metalness: 0.02,
        sheen: 0.55,
        sheenRoughness: 0.52,
        sheenColor: new THREE.Color("#e4eeff"),
        normalMap: normalMapTex,
        normalScale: new THREE.Vector2(0.42, 0.42),
        roughnessMap: ormMapTex,
        aoMap: ormMapTex,
        aoMapIntensity: 0.90,
        envMap: visorEnvTex,
        envMapIntensity: 0.14,
      })
    );

    const darkHardwareMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#07090d"),
        roughness: 0.34,
        metalness: 0.36,
        clearcoat: 0.35,
        clearcoatRoughness: 0.24,
        envMap: visorEnvTex,
        envMapIntensity: 0.38,
      })
    );

    const visorMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#010204"),
        roughness: 0.024,
        metalness: 0.03,
        clearcoat: 1.0,
        clearcoatRoughness: 0.015,
        ior: 1.56,
        reflectivity: 1.0,
        envMap: visorEnvTex,
        envMapIntensity: 1.25,
      })
    );

    // Physical view-dependent Earth-limb reflection across lower curved visor dome (`detail_01`!),
    // modulated directly by `uVisorEarth` so open space (`Frames 04–08`) is pure obsidian black!
    visorMat.onBeforeCompile = (shader) => {
      shader.uniforms.uVisorEarth = visorEarthUniform;
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          `#include <common>
          uniform float uVisorEarth;
          float vHash2(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
          }
          float vNoise2(vec2 p) {
            vec2 i = floor(p);
            vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(
              mix(vHash2(i), vHash2(i + vec2(1.0, 0.0)), f.x),
              mix(vHash2(i + vec2(0.0, 1.0)), vHash2(i + vec2(1.0, 1.0)), f.x),
              f.y
            );
          }`
        )
        .replace(
          "#include <opaque_fragment>",
          `
          if (uVisorEarth > 0.004) {
            vec3 vViewN = normalize(normal);
            vec3 vViewDir = normalize(vViewPosition);
            vec3 reflV = reflect(-vViewDir, vViewN);
            // Curved planetary horizon reflected inside lower visor dome (detail_01!)
            float arch = -0.16 - reflV.x * reflV.x * 0.62;
            float belowLimb = smoothstep(arch + 0.06, arch - 0.34, reflV.y);
            float limbGlow = exp(-pow((reflV.y - arch) * 9.5, 2.0));
            float n1 = vNoise2(reflV.xz * 7.5 + vec2(2.1, 0.7));
            float n2 = vNoise2(reflV.xz * 15.0 - vec2(1.3, 3.4));
            float cloudRefl = smoothstep(0.36, 0.80, n1 * 0.65 + n2 * 0.35);
            vec3 earthReflCol = mix(vec3(0.04, 0.14, 0.38), vec3(0.72, 0.83, 0.97), cloudRefl) * belowLimb;
            earthReflCol += vec3(0.38, 0.72, 1.0) * limbGlow * 0.52;
            outgoingLight += earthReflCol * uVisorEarth * 0.62;
          }
          // Subtle soft silver-white grazing Fresnel rim along outer curved edge of visor glass
          {
            float rimV = pow(1.0 - clamp(dot(normalize(normal), normalize(vViewPosition)), 0.0, 1.0), 4.5);
            outgoingLight += vec3(0.45, 0.50, 0.60) * rimV * 0.26;
          }
          #include <opaque_fragment>`
        );
    };
    visorMat.customProgramCacheKey = () => "astronaut-visor-earth-refl-v1";

    materials.push(fabricMat, webbingMat, darkHardwareMat, visorMat);

    let primOrder = 0;
    sceneClone.traverse((node) => {
      if ((node as THREE.Bone).isBone) {
        const b = node as THREE.Bone;
        const key = b.name as keyof AstronautBoneMap;
        bones[key] = b;
        restQuats[b.name] = b.quaternion.clone();
      }
      if ((node as THREE.Mesh).isMesh) {
        const m = node as THREE.Mesh;
        m.frustumCulled = false;
        m.renderOrder = 4;
        const idxCount = m.geometry.index
          ? m.geometry.index.count
          : m.geometry.attributes.position.count;
        triangles += idxCount / 3;
        drawCalls += 1;

        if (primOrder === 0) m.material = fabricMat;
        else if (primOrder === 1) m.material = webbingMat;
        else if (primOrder === 2) m.material = darkHardwareMat;
        else m.material = visorMat;
        primOrder += 1;
      }
    });

    return {
      root,
      modelRoot: sceneClone,
      bones,
      restQuats,
      materials,
      visorMaterial: visorMat,
      visorEarthUniform,
      // Upper-left grazing rim right on dark visor glass (`Head` bone local coordinates) matching detail_04/05!
      visorAnchorLocal: new THREE.Vector3(-0.076, 0.044, 0.132),
      drawCalls,
      triangles,
    };
  };

  const primary = buildRigFromScene(gltf.scene);
  const createClone = () => buildRigFromScene(SkeletonUtils.clone(gltf.scene));

  return { primary, createClone };
}

/**
 * Loads the captured Lusion astronaut parts from the repository's approved .buf asset bundle.
 * These source meshes are preferred over the unrelated generic GLB placeholder; the parts share
 * the original model coordinate space, so the suit silhouette and visor line up without guessed
 * per-part offsets. The original baked joint animation is handled by the scene timeline when present;
 * this static rig still supports the existing root-level emergence and zero-G choreography.
 */
export async function loadLusionAstronautParts(
  visorEnvTex: THREE.Texture,
  _isMobile: boolean,
  track: <T extends { dispose: () => void }>(item: T) => T
): Promise<{
  primary: LoadedAstronautRig;
  createClone: () => LoadedAstronautRig;
}> {
  const assetRoot = "/assets/models/tunnels/";
  const textureRoot = "/assets/textures/tunnels/astronaut/";
  const [helmetData, visorData, glovesData, packData, helmetBase, helmetNormal, helmetArm,
    glovesBase, glovesNormal, glovesArm, packBase, packNormal, packArm] = await Promise.all([
    loadLusionBuf(`${assetRoot}astronaut_helmet.buf`),
    loadLusionBuf(`${assetRoot}astronaut_helmet_glass.buf`),
    loadLusionBuf(`${assetRoot}astronaut_glove_shoes.buf`),
    loadLusionBuf(`${assetRoot}astronaut_wearpack.buf`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_helmet_base.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_helmet_nor.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_helmet_arm.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_glove_shoes_base.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_glove_shoes_nor.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_glove_shoes_arm.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_wearpack_base.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_wearpack_nor.webp`),
    new THREE.TextureLoader().loadAsync(`${textureRoot}astronaut_wearpack_arm.webp`),
  ]);

  const textures = [
    helmetBase, helmetNormal, helmetArm, glovesBase, glovesNormal, glovesArm, packBase, packNormal, packArm,
  ];
  for (const tex of textures) track(tex);
  for (const tex of [helmetBase, glovesBase, packBase]) tex.colorSpace = THREE.SRGBColorSpace;
  for (const tex of [helmetNormal, helmetArm, glovesNormal, glovesArm, packNormal, packArm]) {
    tex.colorSpace = THREE.NoColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
  }

  const materials: THREE.Material[] = [];
  const makeSuitMaterial = (
    baseMap: THREE.Texture,
    normalMap: THREE.Texture,
    armMap: THREE.Texture,
    roughness: number,
    metalness: number
  ) => {
    const material = track(new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      map: baseMap,
      normalMap,
      normalScale: new THREE.Vector2(0.85, 0.85),
      aoMap: armMap,
      roughnessMap: armMap,
      metalnessMap: armMap,
      aoMapIntensity: 0.9,
      roughness,
      metalness,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      envMap: visorEnvTex,
      envMapIntensity: 0.18,
    }));
    materials.push(material);
    return material;
  };

  const helmetMaterial = makeSuitMaterial(helmetBase, helmetNormal, helmetArm, 0.38, 0.18);
  const glovesMaterial = makeSuitMaterial(glovesBase, glovesNormal, glovesArm, 0.56, 0.06);
  const packMaterial = makeSuitMaterial(packBase, packNormal, packArm, 0.62, 0.04);
  const visorEarthUniform = { value: 0 };
  const visorMaterial = track(new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#03070d"),
    roughness: 0.045,
    metalness: 0.78,
    clearcoat: 1,
    clearcoatRoughness: 0.025,
    ior: 1.52,
    envMap: visorEnvTex,
    envMapIntensity: 1.1,
  }));
  materials.push(visorMaterial);

  const createPart = (source: THREE.BufferGeometry, material: THREE.Material) => {
    // The loader caches parsed buffers. Clone geometry before lifecycle tracking so one scene's
    // cleanup cannot dispose the shared cached source used by a later mount.
    const geometry = track(source.clone());
    const uv = geometry.getAttribute("uv");
    if (uv) geometry.setAttribute("uv2", uv);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.frustumCulled = false;
    mesh.renderOrder = 4;
    return mesh;
  };

  const root = new THREE.Group();
  const modelRoot = new THREE.Group();
  modelRoot.name = "LusionAstronautBufModel";
  modelRoot.add(
    createPart(helmetData.geometry, helmetMaterial),
    createPart(visorData.geometry, visorMaterial),
    createPart(glovesData.geometry, glovesMaterial),
    createPart(packData.geometry, packMaterial)
  );
  root.add(modelRoot);

  const drawCalls = 4;
  const triangles = [helmetData, visorData, glovesData, packData].reduce(
    (sum, part) => sum + (part.geometry.index?.count ?? part.geometry.getAttribute("position").count) / 3,
    0
  );

  const primary: LoadedAstronautRig = {
    root,
    modelRoot,
    bones: {},
    restQuats: {},
    materials,
    visorMaterial,
    visorEarthUniform,
    // The captured model's visor is centred near y=1.68 in the shared suit coordinate space.
    visorAnchorLocal: new THREE.Vector3(-0.076, 1.70, 0.132),
    drawCalls,
    triangles,
  };

  const createClone = (): LoadedAstronautRig => {
    const cloneRoot = root.clone(true) as THREE.Group;
    const cloneModel = cloneRoot.getObjectByName("LusionAstronautBufModel") ?? cloneRoot;
    cloneModel.traverse((node) => {
      if ((node as THREE.Mesh).isMesh) {
        const mesh = node as THREE.Mesh;
        mesh.castShadow = false;
        mesh.receiveShadow = false;
      }
    });
    return {
      root: cloneRoot,
      modelRoot: cloneModel,
      bones: {},
      restQuats: {},
      materials: [],
      visorMaterial: null,
      visorEarthUniform: { value: 0 },
      visorAnchorLocal: primary.visorAnchorLocal.clone(),
      drawCalls,
      triangles,
    };
  };

  return { primary, createClone };
}

function srcMapColorFix(tex: THREE.Texture, space: THREE.ColorSpace) {
  tex.colorSpace = space;
}

/**
 * Builds the 3D Rounded-Rect Tablet Bezel Chassis, Side Hardware Buttons, Soft Drop Shadow,
 * and Hardware Stencil Portal Screen Mesh in the shared 3D world (`Frames 01–03`).
 */
export function build3DTabletPortal(
  track: <T extends { dispose: () => void }>(item: T) => T
): {
  group: THREE.Group;
  shadowMat: THREE.ShaderMaterial;
  bezelMat: THREE.MeshStandardMaterial;
  portalScreenMesh: THREE.Mesh;
  portalScreenMat: THREE.MeshBasicMaterial;
  innerHalfW: number;
  innerHalfH: number;
} {
  // Exact 1.391 : 1 iPad Pro landscape proportion measured from Frame 01 (`width = 1.0, height = 0.719`)
  const outerW = 1.0;
  const outerH = 0.719;
  const outerR = 0.042;

  const innerW = 0.936;
  const innerH = 0.658;
  const innerR = 0.028;

  const makeRoundedShape = (w: number, h: number, r: number): THREE.Shape => {
    const hw = w * 0.5;
    const hh = h * 0.5;
    const shape = new THREE.Shape();
    shape.moveTo(-hw + r, -hh);
    shape.lineTo(hw - r, -hh);
    shape.quadraticCurveTo(hw, -hh, hw, -hh + r);
    shape.lineTo(hw, hh - r);
    shape.quadraticCurveTo(hw, hh, hw - r, hh);
    shape.lineTo(-hw + r, hh);
    shape.quadraticCurveTo(-hw, hh, -hw, hh - r);
    shape.lineTo(-hw, -hh + r);
    shape.quadraticCurveTo(-hw, -hh, -hw + r, -hh);
    return shape;
  };

  const makeHolePath = (w: number, h: number, r: number): THREE.Path => {
    const hw = w * 0.5;
    const hh = h * 0.5;
    const p = new THREE.Path();
    p.moveTo(-hw + r, -hh);
    p.quadraticCurveTo(-hw, -hh, -hw, -hh + r);
    p.lineTo(-hw, hh - r);
    p.quadraticCurveTo(-hw, hh, -hw + r, hh);
    p.lineTo(hw - r, hh);
    p.quadraticCurveTo(hw, hh, hw, hh - r);
    p.lineTo(hw, -hh + r);
    p.quadraticCurveTo(hw, -hh, hw - r, -hh);
    p.closePath();
    return p;
  };

  const group = new THREE.Group();

  // 1. Soft diffuse rounded-rect drop shadow plane matching Frame 01 against `#f0f1fa`
  const shadowMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: {
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        float sdRoundBox(vec2 p, vec2 b, float r) {
          vec2 q = abs(p) - b + r;
          return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
        }
        void main() {
          vec2 p = (vUv - 0.5) * vec2(1.38, 1.12);
          float d = sdRoundBox(p - vec2(0.0, -0.012), vec2(0.492, 0.354), 0.048);
          float wide = 1.0 - smoothstep(-0.03, 0.135, d);
          float near = 1.0 - smoothstep(-0.02, 0.038, d);
          float alpha = (wide * 0.16 + near * 0.15) * uOpacity;
          gl_FragColor = vec4(vec3(0.03, 0.04, 0.08), alpha);
        }
      `,
    })
  );
  const shadowMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(1.38, 1.12)), shadowMat);
  shadowMesh.position.set(0, -0.008, -0.028);
  shadowMesh.renderOrder = 0;
  group.add(shadowMesh);

  // 2. Inner Screen Portal Mesh (`renderOrder = 1` — writes Stencil Ref 1 ONLY inside screen aperture!)
  const screenShape = makeRoundedShape(innerW, innerH, innerR);
  const screenGeo = track(new THREE.ShapeGeometry(screenShape, 12));
  const portalScreenMat = track(
    new THREE.MeshBasicMaterial({
      color: 0x000000,
      depthWrite: false,
      stencilWrite: true,
      stencilRef: 1,
      stencilFunc: THREE.AlwaysStencilFunc,
      stencilZPass: THREE.ReplaceStencilOp,
      stencilZFail: THREE.KeepStencilOp,
      stencilFail: THREE.KeepStencilOp,
    })
  );
  const portalScreenMesh = new THREE.Mesh(screenGeo, portalScreenMat);
  portalScreenMesh.position.set(0, 0, 0);
  portalScreenMesh.renderOrder = 1;
  group.add(portalScreenMesh);

  // 3. 3D Extruded Rounded-Rect Bezel Chassis + Outer Chamfered Aluminum Rim (`detail_01`!)
  const frameShape = makeRoundedShape(outerW, outerH, outerR);
  frameShape.holes.push(makeHolePath(innerW, innerH, innerR));

  const bezelGeo = track(
    new THREE.ExtrudeGeometry(frameShape, {
      depth: 0.020,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.0038,
      bevelThickness: 0.0038,
    })
  );
  bezelGeo.translate(0, 0, -0.015);

  const bezelMat = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color("#101216"),
      roughness: 0.36,
      metalness: 0.45,
    })
  );
  const bezelMesh = new THREE.Mesh(bezelGeo, bezelMat);
  bezelMesh.renderOrder = 10;
  group.add(bezelMesh);

  // Thin dark space-grey metallic outer band (`detail_01` thin grey outer bezel highlight!)
  const rimShape = makeRoundedShape(outerW + 0.010, outerH + 0.010, outerR + 0.005);
  rimShape.holes.push(makeHolePath(outerW - 0.002, outerH - 0.002, outerR - 0.001));
  const rimGeo = track(
    new THREE.ExtrudeGeometry(rimShape, {
      depth: 0.018,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 1,
      bevelSize: 0.0018,
      bevelThickness: 0.0018,
    })
  );
  rimGeo.translate(0, 0, -0.015);
  const edgeTrimMat = track(
    new THREE.MeshStandardMaterial({
      color: new THREE.Color("#3c4048"),
      roughness: 0.32,
      metalness: 0.78,
    })
  );
  const rimMesh = new THREE.Mesh(rimGeo, edgeTrimMat);
  rimMesh.renderOrder = 10;
  group.add(rimMesh);

  // Physical top-left volume buttons + upper-left power button + 3 left-bezel camera/FaceID dots (`detail_01`!)
  const btnGeoVol = track(new THREE.BoxGeometry(0.032, 0.0035, 0.008));
  const btnVolA = new THREE.Mesh(btnGeoVol, edgeTrimMat);
  btnVolA.position.set(-0.385, outerH * 0.5 + 0.006, -0.005);
  btnVolA.renderOrder = 10;
  const btnVolB = new THREE.Mesh(btnGeoVol, edgeTrimMat);
  btnVolB.position.set(-0.338, outerH * 0.5 + 0.006, -0.005);
  btnVolB.renderOrder = 10;

  const btnPowerGeo = track(new THREE.BoxGeometry(0.0035, 0.040, 0.008));
  const btnPower = new THREE.Mesh(btnPowerGeo, edgeTrimMat);
  btnPower.position.set(-outerW * 0.5 - 0.006, 0.235, -0.005);
  btnPower.renderOrder = 10;

  const camDotMat = track(new THREE.MeshBasicMaterial({ color: 0x05070c }));
  const camDotGeo = track(new THREE.CircleGeometry(0.0042, 16));
  const camDotTop = new THREE.Mesh(camDotGeo, camDotMat);
  camDotTop.position.set(-0.484, 0.052, 0.008);
  camDotTop.renderOrder = 11;
  const camDotMid = new THREE.Mesh(camDotGeo, camDotMat);
  camDotMid.scale.setScalar(0.68);
  camDotMid.position.set(-0.484, 0.004, 0.008);
  camDotMid.renderOrder = 11;
  const camDotBot = new THREE.Mesh(camDotGeo, camDotMat);
  camDotBot.scale.setScalar(0.88);
  camDotBot.position.set(-0.484, -0.044, 0.008);
  camDotBot.renderOrder = 11;

  group.add(btnVolA, btnVolB, btnPower, camDotTop, camDotMid, camDotBot);

  return {
    group,
    shadowMat,
    bezelMat,
    portalScreenMesh,
    portalScreenMat,
    innerHalfW: innerW * 0.5,
    innerHalfH: innerH * 0.5,
  };
}

/**
 * Toggle GPU Stencil Portal masking on all space/Earth/astronaut materials cleanly in O(1).
 */
export function setPortalStencilMask(materials: THREE.Material[], active: boolean): void {
  for (const mat of materials) {
    const nextFunc = active ? THREE.EqualStencilFunc : THREE.AlwaysStencilFunc;
    if (mat.stencilWrite !== active || mat.stencilFunc !== nextFunc) {
      mat.stencilWrite = active;
      mat.stencilRef = 1;
      mat.stencilFunc = nextFunc;
      mat.stencilFail = THREE.KeepStencilOp;
      mat.stencilZFail = THREE.KeepStencilOp;
      mat.stencilZPass = THREE.KeepStencilOp;
      mat.needsUpdate = true;
    }
  }
}

/**
 * Procedural Shader Earth Sphere + Fresnel Blue-White Atmosphere Limb + Night Side + Solar Star Glare
 * Calibrated directly to `01_t00.0s`, `03_t02.8s`, and `detail_01`:
 * - Top 50%+ of tablet aperture is pitch-black space (`#000000`)
 * - Gentle orbital limb enters left at ~44% height, passes behind astronaut's shoulders, curves down to ~74% right
 * - Deep navy ocean (`#040d28` -> `#0b2868`) with soft swirling white cloud deck + crisp ice-white/cyan horizon band
 */
export function buildProceduralEarthLimb(
  track: <T extends { dispose: () => void }>(item: T) => T
): {
  group: THREE.Group;
  earthMat: THREE.ShaderMaterial;
  atmoMat: THREE.ShaderMaterial;
  sunGlareMat: THREE.ShaderMaterial;
  materials: THREE.Material[];
} {
  const group = new THREE.Group();

  const sunDir = new THREE.Vector3(-0.52, 0.68, 0.51).normalize();

  const earthMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        uOpacity: { value: 1.0 },
        uTime: { value: 0.0 },
        uSunDir: { value: sunDir },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPosW;
        varying vec3 vLocalPos;
        void main() {
          vLocalPos = position;
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPosW = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vNormalW;
        varying vec3 vPosW;
        varying vec3 vLocalPos;
        uniform float uOpacity;
        uniform float uTime;
        uniform vec3 uSunDir;

        float hash3(vec3 p) {
          p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
          p *= 17.0;
          return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
        }

        float noise3(vec3 x) {
          vec3 i = floor(x);
          vec3 f = fract(x);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(mix(hash3(i + vec3(0,0,0)), hash3(i + vec3(1,0,0)), f.x),
                mix(hash3(i + vec3(0,1,0)), hash3(i + vec3(1,1,0)), f.x), f.y),
            mix(mix(hash3(i + vec3(0,0,1)), hash3(i + vec3(1,0,1)), f.x),
                mix(hash3(i + vec3(0,1,1)), hash3(i + vec3(1,1,1)), f.x), f.y),
            f.z
          );
        }

        float fbm(vec3 p) {
          float s = 0.0;
          float a = 0.5;
          for (int i = 0; i < 5; i++) {
            s += a * noise3(p);
            p *= 2.05;
            a *= 0.5;
          }
          return s;
        }

        void main() {
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vPosW);
          vec3 L = normalize(uSunDir);

          float ndv = clamp(dot(N, V), 0.0, 1.0);
          float ndl = dot(N, L);

          // Day-night terminator across lower-right orbital limb (black night on far right!)
          float day = smoothstep(-0.08, 0.52, ndl);

          vec3 nightCol = vec3(0.001, 0.002, 0.006);
          vec3 col = nightCol;

          if (day > 0.002) {
            vec3 q = normalize(vLocalPos) * 5.2 + vec3(uTime * 0.006, 0.0, 0.0);
            float warp = fbm(q * 1.35);
            float cloudMask = smoothstep(0.42, 0.78, fbm(q * 2.35 + warp * 1.25));
            float wispy = smoothstep(0.50, 0.85, fbm(q * 4.5 - warp * 0.9)) * 0.35;

            // Realistic dark orbital navy ocean (NOT cartoon cyan!) matching detail_01!
            vec3 deepOcean = vec3(0.008, 0.032, 0.115);
            vec3 litOcean = vec3(0.042, 0.138, 0.385);
            vec3 ocean = mix(deepOcean, litOcean, pow(day, 0.85));
            vec3 cloudCol = vec3(0.76, 0.85, 0.97) * (0.45 + 0.55 * day);

            vec3 daySurface = mix(ocean, cloudCol, clamp(cloudMask + wispy, 0.0, 0.82));
            col = mix(nightCol, daySurface, day);
          }

          // Crisp sunlit white-cyan atmospheric horizon band hugging ONLY the grazing limb edge (detail_01!)
          float limb = pow(1.0 - ndv, 4.6);
          float limbTight = pow(1.0 - ndv, 11.0);
          float sunArc = smoothstep(-0.18, 0.62, ndl);
          vec3 blueBand = vec3(0.09, 0.42, 0.98) * limb * (0.35 + 1.45 * sunArc);
          vec3 whiteRim = vec3(0.82, 0.95, 1.00) * limbTight * (0.15 + 1.55 * sunArc);
          col += blueBand + whiteRim;

          gl_FragColor = vec4(col, uOpacity);
        }
      `,
    })
  );

  // Large radius (`R = 5.5`) shifted left so sunlit limb enters higher on left (`~45%`) and slopes smoothly down-right (`~74%`)!
  const earthPos = new THREE.Vector3(-2.35, -5.42, -2.35);
  const earthMesh = new THREE.Mesh(track(new THREE.SphereGeometry(5.5, 80, 60)), earthMat);
  earthMesh.position.copy(earthPos);
  earthMesh.renderOrder = 2;
  group.add(earthMesh);

  // Thin atmospheric halo right above the curved horizon line (`detail_01`!)
  const atmoMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      uniforms: {
        uOpacity: { value: 1.0 },
        uSunDir: { value: sunDir },
      },
      vertexShader: `
        varying vec3 vNormalW;
        varying vec3 vPosW;
        void main() {
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vPosW = wp.xyz;
          vNormalW = normalize(mat3(modelMatrix) * normal);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        varying vec3 vNormalW;
        varying vec3 vPosW;
        uniform float uOpacity;
        uniform vec3 uSunDir;
        void main() {
          vec3 N = normalize(vNormalW);
          vec3 V = normalize(cameraPosition - vPosW);
          float rim = pow(clamp(1.0 + dot(N, V), 0.0, 1.0), 6.2);
          float sunSide = smoothstep(-0.22, 0.60, dot(-N, normalize(uSunDir)));
          vec3 col = mix(vec3(0.05, 0.30, 0.92), vec3(0.55, 0.92, 1.0), rim);
          gl_FragColor = vec4(col * rim * (0.20 + 1.25 * sunSide) * uOpacity, rim * uOpacity);
        }
      `,
    })
  );
  const atmoMesh = new THREE.Mesh(track(new THREE.SphereGeometry(5.68, 64, 48)), atmoMat);
  atmoMesh.position.copy(earthPos);
  atmoMesh.renderOrder = 3;
  group.add(atmoMesh);

  // Soft sunlit atmospheric glow behind upper-left limb (zero spoke cross floating in open space!)
  const sunGlareMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 1.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float d = length(p);
          float halo = exp(-d * d * 7.5) * 0.28 + exp(-d * 4.5) * 0.16;
          vec3 col = vec3(0.76, 0.88, 1.0) * halo;
          float a = clamp(halo, 0.0, 1.0) * uOpacity;
          gl_FragColor = vec4(col * uOpacity, a);
        }
      `,
    })
  );
  const sunGlareMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(3.2, 3.2)), sunGlareMat);
  sunGlareMesh.position.set(-0.92, -0.04, 0.45);
  sunGlareMesh.renderOrder = 3;
  group.add(sunGlareMesh);

  return {
    group,
    earthMat,
    atmoMat,
    sunGlareMat,
    materials: [earthMat, atmoMat, sunGlareMat],
  };
}

/**
 * Builds:
 * 1. Anamorphic + 6-Ray Visor Star Flare (`detail_01`, `detail_04`, `detail_05`!)
 * 2. Subtle Open-Space Cool Halo (`Frame 04`!)
 * 3. Optical Chromatic Dispersion Lens-Ring Flare (`Frames 05–08`, measured `r/H = 0.64`, fine concentric fringe!)
 */
export function buildSpaceOpticalOverlays(
  track: <T extends { dispose: () => void }>(item: T) => T
): {
  visorFlareMesh: THREE.Mesh;
  visorFlareMat: THREE.ShaderMaterial;
  spaceHaloMesh: THREE.Mesh;
  spaceHaloMat: THREE.ShaderMaterial;
  chromaticRingMesh: THREE.Mesh;
  chromaticRingMat: THREE.ShaderMaterial;
} {
  // 1. Solar Star Flare anchored on upper-left visor rim (`detail_04` & `detail_05` exact ray geometry!)
  const visorFlareMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uIntensity: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uIntensity;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float r = length(p);

          // Crisp hot white solar core + soft atmospheric veil on upper-left visor edge
          float core = exp(-r * r * 1150.0) * 2.4;
          float glow = exp(-r * r * 92.0) * 0.44 + exp(-r * r * 18.0) * 0.10;

          // Horizontal anamorphic streak + delicate 6-spoke star diffraction rays (detail_04 & detail_05!)
          float hRay = exp(-pow(p.y * 85.0, 2.0)) * exp(-abs(p.x) * 3.4) * 0.62;
          float vRay = exp(-pow(p.x * 95.0, 2.0)) * exp(-abs(p.y) * 4.6) * 0.34;

          vec2 dA = vec2(p.x * 0.788 + p.y * 0.616, -p.x * 0.616 + p.y * 0.788);
          vec2 dB = vec2(p.x * 0.788 - p.y * 0.616,  p.x * 0.616 + p.y * 0.788);
          float diagA = exp(-pow(dA.y * 105.0, 2.0)) * exp(-abs(dA.x) * 4.4) * 0.36;
          float diagB = exp(-pow(dB.y * 105.0, 2.0)) * exp(-abs(dB.x) * 4.4) * 0.36;

          float e = (core + glow + hRay + vRay + diagA + diagB) * uIntensity;
          vec3 col = mix(vec3(0.90, 0.94, 1.0), vec3(1.0, 1.0, 1.0), clamp(core, 0.0, 1.0)) * e;
          gl_FragColor = vec4(col, clamp(e, 0.0, 1.0));
        }
      `,
    })
  );
  const visorFlareMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(0.62, 0.62)), visorFlareMat);
  visorFlareMesh.renderOrder = 8;
  visorFlareMesh.frustumCulled = false;

  // 2. Faint soft blue atmospheric halo behind astronaut in open space (`TIMELINE.md` Frame 04!)
  const spaceHaloMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uOpacity: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        void main() {
          vec2 p = (vUv - 0.5) * 2.0;
          float d = length(p * vec2(0.92, 1.0));
          float glow = exp(-d * d * 3.1) * (1.0 - smoothstep(0.55, 1.0, d));
          vec3 col = mix(vec3(0.03, 0.09, 0.28), vec3(0.11, 0.28, 0.68), glow);
          gl_FragColor = vec4(col * glow * uOpacity, glow * uOpacity);
        }
      `,
    })
  );
  const spaceHaloMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(3.8, 3.8)), spaceHaloMat);
  spaceHaloMesh.position.set(0, -0.35, -0.85);
  spaceHaloMesh.renderOrder = 2;

  // 3. Screen-Space Optical Chromatic Dispersion Ring (`Frames 05–08` — silky circumference + zero alpha overwrite!)
  const chromaticRingMat = track(
    new THREE.ShaderMaterial({
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: THREE.CustomBlending,
      blendSrc: THREE.OneFactor,
      blendDst: THREE.OneFactor,
      blendSrcAlpha: THREE.ZeroFactor,
      blendDstAlpha: THREE.OneFactor,
      uniforms: {
        uOpacity: { value: 0.0 },
        uAspect: { value: 1.6 },
        uRadius: { value: 0.625 },
        uTime: { value: 0.0 },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position.xy * 2.0, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        varying vec2 vUv;
        uniform float uOpacity;
        uniform float uAspect;
        uniform float uRadius;
        uniform float uTime;

        void main() {
          // Height-normalized screen coords centered slightly left-low matching Frame 07/08 (cx = 47.2%)
          vec2 p = (vUv - vec2(0.472, 0.495)) * vec2(uAspect, 1.0);
          float ang = atan(p.y, p.x);

          // Gentle organic lower-arc caustics matching 07_t08.4s & 08_t09.8s!
          float lowerMask = smoothstep(-0.05, -0.75, sin(ang));
          float wobble = lowerMask * (0.018 * sin(ang * 5.0 + 0.6) + 0.010 * cos(ang * 9.0 - 0.4));
          float rLocal = uRadius + wobble;

          float r = length(p);
          float dr = r - rLocal;

          // Smooth optical azimuthal intensity envelope (softly brighter on left & right arcs, zero moiré banding!)
          float azim = 0.76 + 0.24 * cos(ang * 2.0 + 0.45);

          // Authentic spectral dispersion: inner warm amber -> middle soft cream -> outer cyan/royal-blue
          float disp = 0.026;
          float w = 17.5;
          float rAmber = exp(-pow((dr + disp) * w, 2.0));
          float rCream = exp(-pow(dr * (w * 1.25), 2.0));
          float rBlue  = exp(-pow((dr - disp) * w, 2.0));
          float veil   = exp(-pow(dr * 5.6, 2.0)) * 0.14;

          vec3 col = (
            vec3(1.00, 0.50, 0.14) * rAmber * 1.05 +
            vec3(0.95, 0.93, 0.86) * rCream * 0.30 +
            vec3(0.16, 0.56, 1.05) * rBlue * 1.10 +
            vec3(0.32, 0.44, 0.72) * veil
          ) * azim * uOpacity;

          // Note: CustomBlending (RGB: ONE+ONE, Alpha: ZERO+ONE) preserves canvas alpha = 0 in empty space
          // so behind-astronaut white headline at z=6 shines through space while astronaut silhouette occludes LET!
          gl_FragColor = vec4(col, 0.0);
        }
      `,
    })
  );
  const chromaticRingMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(1, 1)), chromaticRingMat);
  chromaticRingMesh.frustumCulled = false;
  chromaticRingMesh.renderOrder = 20;

  return {
    visorFlareMesh,
    visorFlareMat,
    spaceHaloMesh,
    spaceHaloMat,
    chromaticRingMesh,
    chromaticRingMat,
  };
}

// ===========================================================================
// Data-Driven Scroll Choreography Keyframes (`TIMELINE.md` Frames `01 -> 08`)
// ===========================================================================
export interface EmergenceKeyframe {
  /** Normalized progress `u` across the tablet -> open-space -> ring -> title -> recede sequence `[0..1]` */
  progress: number;
  camPos: [number, number, number];
  camTarget: [number, number, number];
  camFovDesktop: number;
  camFovMobile: number;
  /** Blend from resting `#home-goal-image-in` layout rect (`0`) to full-screen portal (`1`) */
  tabletPush: number;
  tabletScale: number;
  tabletRot: [number, number, number];
  astroPosDesktop: [number, number, number];
  astroPosMobile: [number, number, number];
  astroRot: [number, number, number];
  astroScale: number;
  /** `0 = TABLET_FLOAT`, `1 = OPEN_SPACE`, `2 = ZERO_G_FLOAT`, `3 = PROFILE_GLIDE`, `4 = BACK_RECEDE` */
  poseStage: number;
  earthOpacity: number;
  sunFlare: number;
  haloOpacity: number;
  ringFlare: number;
  titleOpacity: number;
  /** Inter-word horizontal spread `0.0` (compact single-space) -> `1.0` (`91.2vw` full-width `space-between`!) */
  titleSpread: number;
  titleLetterSpacingEm: number;
  titleScale: number;
}

export const EMERGENCE_KEYFRAMES: ReadonlyArray<EmergenceKeyframe> = [
  // Frame 01 (u = 0.00): Centered 4:3 Dark Tablet Left + Earth Limb + Astronaut + Right Body Copy (`01_t00.0s`)
  {
    progress: 0.0,
    camPos: [0.0, 0.0, 5.2],
    camTarget: [0.0, 0.0, 0.0],
    camFovDesktop: 44,
    camFovMobile: 52,
    tabletPush: 0.0,
    tabletScale: 1.0,
    tabletRot: [0.0, 0.0, 0.0],
    astroPosDesktop: [-0.26, -0.44, 1.55],
    astroPosMobile: [-0.05, -0.42, 1.45],
    astroRot: [-0.02, 0.05, 0.0],
    astroScale: 1.04,
    poseStage: 0.0,
    earthOpacity: 1.0,
    sunFlare: 0.78,
    haloOpacity: 0.10,
    ringFlare: 0.0,
    titleOpacity: 0.0,
    titleSpread: 0.0,
    titleLetterSpacingEm: 0.015,
    titleScale: 0.86,
  },
  // Frame 02 (u = 0.05): Brief Hold on Tablet Section (`02_t01.4s`)
  {
    progress: 0.05,
    camPos: [0.0, 0.0, 5.12],
    camTarget: [0.0, 0.0, 0.0],
    camFovDesktop: 44,
    camFovMobile: 52,
    tabletPush: 0.02,
    tabletScale: 1.03,
    tabletRot: [0.0, 0.0, -0.004],
    astroPosDesktop: [-0.25, -0.44, 1.57],
    astroPosMobile: [-0.05, -0.42, 1.47],
    astroRot: [-0.02, 0.05, 0.0],
    astroScale: 1.04,
    poseStage: 0.0,
    earthOpacity: 1.0,
    sunFlare: 0.80,
    haloOpacity: 0.12,
    ringFlare: 0.0,
    titleOpacity: 0.0,
    titleSpread: 0.0,
    titleLetterSpacingEm: 0.015,
    titleScale: 0.86,
  },
  // Frame 03 (u = 0.19): Tablet Tilts Clockwise (`-0.044 rad` = `+2.51°`) & Expands; Copy Slides Right (`03_t02.8s`)
  {
    progress: 0.19,
    camPos: [-0.06, -0.01, 4.35],
    camTarget: [-0.06, -0.01, 0.0],
    camFovDesktop: 44,
    camFovMobile: 52,
    tabletPush: 0.24,
    tabletScale: 1.34,
    tabletRot: [0.012, 0.028, -0.044],
    astroPosDesktop: [-0.22, -0.46, 1.68],
    astroPosMobile: [-0.04, -0.44, 1.54],
    astroRot: [-0.02, 0.04, -0.015],
    astroScale: 1.05,
    poseStage: 0.25,
    earthOpacity: 0.94,
    sunFlare: 0.86,
    haloOpacity: 0.16,
    ringFlare: 0.0,
    titleOpacity: 0.0,
    titleSpread: 0.0,
    titleLetterSpacingEm: 0.015,
    titleScale: 0.86,
  },
  // Portal Plane Crossing (u = 0.31): Camera Pushes Through Tablet Aperture Into Space (`stencil release`)
  {
    progress: 0.31,
    camPos: [-0.04, -0.02, 3.06],
    camTarget: [-0.04, -0.04, 0.0],
    camFovDesktop: 43,
    camFovMobile: 50,
    tabletPush: 1.0,
    tabletScale: 3.65,
    tabletRot: [0.018, 0.035, -0.062],
    astroPosDesktop: [-0.21, -0.56, 1.48],
    astroPosMobile: [-0.02, -0.50, 1.28],
    astroRot: [-0.02, 0.04, -0.01],
    astroScale: 1.06,
    poseStage: 0.75,
    earthOpacity: 0.12,
    sunFlare: 0.96,
    haloOpacity: 0.24,
    ringFlare: 0.0,
    titleOpacity: 0.0,
    titleSpread: 0.0,
    titleLetterSpacingEm: 0.015,
    titleScale: 0.86,
  },
  // Frame 04 (u = 0.40): Tablet Gone — Pure Black Space + Astronaut Left-Center (`cx ~ 42.5%`) + Star Flare (`04_t04.2s`)
  {
    progress: 0.40,
    camPos: [0.0, 0.0, 2.88],
    camTarget: [0.0, -0.04, 0.0],
    camFovDesktop: 42,
    camFovMobile: 49,
    tabletPush: 1.0,
    tabletScale: 4.5,
    tabletRot: [0.0, 0.0, -0.06],
    astroPosDesktop: [-0.18, -0.60, 1.34],
    astroPosMobile: [-0.02, -0.52, 1.12],
    astroRot: [-0.02, 0.05, -0.01],
    astroScale: 1.06,
    poseStage: 1.0,
    earthOpacity: 0.0,
    sunFlare: 1.0,
    haloOpacity: 0.32,
    ringFlare: 0.0,
    titleOpacity: 0.0,
    titleSpread: 0.0,
    titleLetterSpacingEm: 0.015,
    titleScale: 0.86,
  },
  // Frame 05 (u = 0.53): Astronaut Drifts Toward Center (`cx ~ 48.6%`) + Faint Chromatic Lens Ring Appears (`05_t05.6s`)
  {
    progress: 0.53,
    camPos: [0.0, 0.0, 2.94],
    camTarget: [0.0, -0.04, 0.0],
    camFovDesktop: 42.5,
    camFovMobile: 50,
    tabletPush: 1.0,
    tabletScale: 4.5,
    tabletRot: [0.0, 0.0, 0.0],
    astroPosDesktop: [-0.03, -0.59, 1.26],
    astroPosMobile: [0.0, -0.52, 1.04],
    astroRot: [-0.01, -0.03, 0.015],
    astroScale: 1.04,
    poseStage: 1.85,
    earthOpacity: 0.0,
    sunFlare: 0.92,
    haloOpacity: 0.22,
    ringFlare: 0.36,
    titleOpacity: 0.0,
    titleSpread: 0.0,
    titleLetterSpacingEm: 0.016,
    titleScale: 0.87,
  },
  // Frame 06 (u = 0.66): Soft White Headline Appears Over Front-Facing Astronaut (`06_t07.0s`)
  {
    progress: 0.66,
    camPos: [0.0, 0.0, 3.06],
    camTarget: [0.0, -0.04, 0.0],
    camFovDesktop: 43,
    camFovMobile: 51,
    tabletPush: 1.0,
    tabletScale: 4.5,
    tabletRot: [0.0, 0.0, 0.0],
    astroPosDesktop: [-0.02, -0.60, 1.16],
    astroPosMobile: [0.0, -0.53, 0.96],
    astroRot: [0.0, -0.02, 0.01],
    astroScale: 1.02,
    poseStage: 2.0,
    earthOpacity: 0.0,
    sunFlare: 0.22,
    haloOpacity: 0.16,
    ringFlare: 0.48,
    titleOpacity: 0.44,
    titleSpread: 0.0,
    titleLetterSpacingEm: 0.018,
    titleScale: 0.88,
  },
  // Frame 07 (u = 0.79): Bright White Headline + Full Rainbow Ring + Three-Quarter Right Profile Glide (`07_t08.4s`)
  {
    progress: 0.79,
    camPos: [0.0, 0.0, 3.28],
    camTarget: [0.0, -0.04, 0.0],
    camFovDesktop: 44,
    camFovMobile: 52,
    tabletPush: 1.0,
    tabletScale: 4.5,
    tabletRot: [0.0, 0.0, 0.0],
    astroPosDesktop: [0.06, -0.60, 0.96],
    astroPosMobile: [0.02, -0.54, 0.76],
    astroRot: [0.08, 1.28, -0.06],
    astroScale: 0.94,
    poseStage: 3.0,
    earthOpacity: 0.0,
    sunFlare: 0.0,
    haloOpacity: 0.12,
    ringFlare: 0.98,
    titleOpacity: 0.98,
    titleSpread: 0.16,
    titleLetterSpacingEm: 0.024,
    titleScale: 1.0,
  },
  // Frame 08 (u = 0.91): Full-Width Justified White Headline (`91.2vw`) + Medium Rear Swimming Astronaut (`08_t09.8s`)
  {
    progress: 0.91,
    camPos: [0.0, 0.0, 3.85],
    camTarget: [0.0, -0.02, 0.0],
    camFovDesktop: 45,
    camFovMobile: 54,
    tabletPush: 1.0,
    tabletScale: 4.5,
    tabletRot: [0.0, 0.0, 0.0],
    astroPosDesktop: [-0.07, -0.44, 0.35],
    astroPosMobile: [-0.02, -0.40, 0.25],
    astroRot: [0.12, Math.PI, 0.03],
    astroScale: 0.80,
    poseStage: 4.0,
    earthOpacity: 0.0,
    sunFlare: 0.0,
    haloOpacity: 0.08,
    ringFlare: 1.0,
    titleOpacity: 1.0,
    titleSpread: 1.0,
    titleLetterSpacingEm: 0.035,
    titleScale: 1.10,
  },
  // Downstream Tunnel Entry Handoff (u = 1.0)
  {
    progress: 1.0,
    camPos: [0.0, 0.0, 5.2],
    camTarget: [0.0, 0.0, 0.0],
    camFovDesktop: 45,
    camFovMobile: 54,
    tabletPush: 1.0,
    tabletScale: 4.5,
    tabletRot: [0.0, 0.0, 0.0],
    astroPosDesktop: [0.0, -0.18, -1.35],
    astroPosMobile: [0.0, -0.18, -1.20],
    astroRot: [0.18, Math.PI, 0.06],
    astroScale: 0.52,
    poseStage: 4.0,
    earthOpacity: 0.0,
    sunFlare: 0.0,
    haloOpacity: 0.0,
    ringFlare: 0.25,
    titleOpacity: 0.0,
    titleSpread: 1.0,
    titleLetterSpacingEm: 0.06,
    titleScale: 1.24,
  },
];

function sampleCatmullScalar(u: number, getVal: (kf: EmergenceKeyframe) => number): number {
  const kfs = EMERGENCE_KEYFRAMES;
  const n = kfs.length;
  const uc = clamp01(u);
  if (uc <= kfs[0].progress) return getVal(kfs[0]);
  if (uc >= kfs[n - 1].progress) return getVal(kfs[n - 1]);

  let i = 0;
  while (i < n - 2 && uc > kfs[i + 1].progress) i++;

  const t = clamp01((uc - kfs[i].progress) / Math.max(1e-5, kfs[i + 1].progress - kfs[i].progress));
  const p0 = getVal(kfs[Math.max(0, i - 1)]);
  const p1 = getVal(kfs[i]);
  const p2 = getVal(kfs[i + 1]);
  const p3 = getVal(kfs[Math.min(n - 1, i + 2)]);

  const m1 = (p2 - p0) * 0.28;
  const m2 = (p3 - p1) * 0.28;
  const t2 = t * t;
  const t3 = t2 * t;
  return (
    (2 * t3 - 3 * t2 + 1) * p1 +
    (t3 - 2 * t2 + t) * m1 +
    (-2 * t3 + 3 * t2) * p2 +
    (t3 - t2) * m2
  );
}

export function evaluateEmergenceChoreography(u: number): Omit<EmergenceKeyframe, "progress"> {
  const s = (fn: (kf: EmergenceKeyframe) => number) => sampleCatmullScalar(u, fn);
  const sClamped = (fn: (kf: EmergenceKeyframe) => number) => Math.max(0, s(fn));

  return {
    camPos: [s((k) => k.camPos[0]), s((k) => k.camPos[1]), s((k) => k.camPos[2])],
    camTarget: [s((k) => k.camTarget[0]), s((k) => k.camTarget[1]), s((k) => k.camTarget[2])],
    camFovDesktop: s((k) => k.camFovDesktop),
    camFovMobile: s((k) => k.camFovMobile),
    tabletPush: clamp01(s((k) => k.tabletPush)),
    tabletScale: Math.max(0.5, s((k) => k.tabletScale)),
    tabletRot: [s((k) => k.tabletRot[0]), s((k) => k.tabletRot[1]), s((k) => k.tabletRot[2])],
    astroPosDesktop: [
      s((k) => k.astroPosDesktop[0]),
      s((k) => k.astroPosDesktop[1]),
      s((k) => k.astroPosDesktop[2]),
    ],
    astroPosMobile: [
      s((k) => k.astroPosMobile[0]),
      s((k) => k.astroPosMobile[1]),
      s((k) => k.astroPosMobile[2]),
    ],
    astroRot: [s((k) => k.astroRot[0]), s((k) => k.astroRot[1]), s((k) => k.astroRot[2])],
    astroScale: Math.max(0.2, s((k) => k.astroScale)),
    poseStage: Math.max(0, Math.min(4, s((k) => k.poseStage))),
    earthOpacity: clamp01(sClamped((k) => k.earthOpacity)),
    sunFlare: clamp01(sClamped((k) => k.sunFlare)),
    haloOpacity: clamp01(sClamped((k) => k.haloOpacity)),
    ringFlare: clamp01(sClamped((k) => k.ringFlare)),
    titleOpacity: clamp01(sClamped((k) => k.titleOpacity)),
    titleSpread: clamp01(sClamped((k) => k.titleSpread)),
    titleLetterSpacingEm: Math.max(0, s((k) => k.titleLetterSpacingEm)),
    titleScale: Math.max(0.5, s((k) => k.titleScale)),
  };
}
