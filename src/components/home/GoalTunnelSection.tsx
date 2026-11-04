"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { advanceCinematicProgress, acceleratedFall, blueFlightDistance, cinematicRenderDpr, GOAL_CINEMATIC_SECONDS } from "@/lib/home-motion";
import { solarAcceptance, solarFocalScale, solarOcclusion } from "@/lib/solar-optics";
import { createGpuFrameTimer } from "@/lib/gpu-frame-timer";
import { LUSION_HOME } from "@/data/reference";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { IDLE_JOURNEY } from "@/lib/journey-audio-state";
import {
  applySuitJointPose,
  blendSuitPose,
  build3DTabletPortal,
  buildAstronautStudioEnv,
  buildProceduralEarthLimb,
  buildSpaceOpticalOverlays,
  evaluateEmergenceChoreography,
  evaluateSuitPoseStage,
  loadLicensedAstronautGlb,
  loadLusionAstronautParts,
  applyCapturedDualQuaternionSkinning,
  setPortalStencilMask,
  SUIT_POSE_TABLET_FLOAT,
  type LoadedAstronautRig,
  type SuitJointPose,
} from "@/components/home/AstronautEmergenceAssets";
import {
  buildArchitecturalTrussTunnel,
  buildBlueArchCorridor,
  buildGlassShardSideGeometry,
  buildTunnelGlazing,
  buildVortexHypercubeLattice,
  buildDiamondsAndPopStickers,
  buildHologramEchoMaterial,
  buildVisorLedMatrix,
  createGlassFrameSampler,
  createGoalPlaybackPath,
  evaluateSuitWavePose,
  SUIT_POSE_CORRIDOR_FLY,
  SUIT_POSE_CTA_RELAXED,
  SUIT_POSE_SHATTER_BREAK,
  SUIT_POSE_TUMBLE_CURL,
  SUIT_POSE_TUMBLE_SPREAD,
  SUIT_POSE_VISOR_SALUTE,
} from "@/components/home/GoalDownstreamScenes";

declare global {
  interface Window {
    /** Opt-in observation only; submission does not imply GPU completion or presentation. */
    __goalPipelineProbe?: (renderer: THREE.WebGLRenderer, observation: {
      authoredAt: number; sceneStartedAt: number; submittedAt: number;
      virtualScroll: number; glassMatrix: number[] | null; blueMatrix: number[];
    }) => void;
    __lusionInspector?: {
      properties?: { hasStarted: boolean };
      scrollManager?: {
        scrollPixel: number;
        contentSizePixel: number;
        scrollLimit: number;
        scrollToPixel: (y: number, instant?: boolean) => void;
      };
      homeGoalSectionRanges?: {
        baseY: number;
        totalPixelCount: number;
        items: Record<
          string,
          { id: string; pixelFrom: number; pixelCount: number; pixelTo: number }
        >;
      };
    };
    __goalAstronautTelemetry?: {
      glbLoaded: boolean;
      glbError: string | null;
      qualityTier: "desktop" | "mobile";
      renderWidth: number;
      renderHeight: number;
      pixelRatio: number;
      textureMaxDim: number;
      drawCalls: number;
      triangles: number;
      lastFrameMs: number;
      renderCount: number;
      resources: { geometries: number; textures: number; programs: number };
      gpuTiming: { enabled: boolean; lastMs: number | null; phase: string; samples: number; disjoints: number; recent?: { id: number; ms: number; phase: string }[] };
      solar: { x: number; y: number; facing: number; visibility: number; occlusion: number; focalScale: number };
      emergenceProgress: number;
      portalStencilActive: boolean;
      fallbackVisible: boolean;
      sceneState: {
        tunnelProgress: number;
        shatterProgress: number;
        waitProgress: number;
        bakedFrame: number;
        astronautMatrix: number[];
        cameraMatrix: number[];
        trussLoaded: boolean;
        shardsLoaded: boolean;
        portalFlash: number;
        flashVisible: boolean;
        corridorTravel: number;
        glazingLayers: number;
        glassOpacity: number;
        glassRefractionReady: boolean;
        shardDepthWrite: boolean;
        shardSpread: number;
        shardSidewallsLoaded: boolean;
        shardSidewallTriangles: number;
        vortexIntensity: number;
        vortexGlassVisible: boolean;
        vortexGlassLayers: number;
        vortexGlassEdges: number;
        shardCount: number;
        shardFrames: number;
        ringVisible: boolean;
      };
      playback: {
        state: "armed" | "playing" | "paused" | "completed";
        progress: number; virtualScroll: number; activation: number; end: number; runs: number;
      };
      scrollForEmergence: (u: number) => number;
      scrollForTunnel: (u: number) => number;
      scrollForShatter: (u: number) => number;
    };
  }
}

interface GoalLayoutMetrics {
  goalTop: number;
  goalHeight: number;
  imgInLeft: number;
  imgInTop: number;
  imgInWidth: number;
  imgInHeight: number;
  emergenceStart: number;
  emergenceSpan: number;
  emergenceEnd: number;
  tunnelStart: number;
  tunnelEnd: number;
  tunnelSpan: number;
  imgOutLeft: number;
  imgOutTop: number;
  imgOutWidth: number;
  imgOutHeight: number;
  endTop: number;
  endHeight: number;
  viewportW: number;
  viewportH: number;
  isMobile: boolean;
  lineBaseWidths: number[];
  lineWordCounts: number[];
  baseWordGapPx: number;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / Math.max(1e-5, e1 - e0));
  return t * t * (3 - 2 * t);
};

const TITLE_WORD_LINES: ReadonlyArray<ReadonlyArray<string>> = LUSION_HOME.goal.tunnelTitleLines.map(
  (line) => line.trim().split(/\s+/)
);

const TABLET_WORLD_Z = 2.65;
// Exact normalized emergence progress where inner portal aperture completely covers the camera frustum
const PORTAL_RELEASE_U = 0.308;

export function GoalTunnelSection() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const lastSurfaceDarkRef = useRef(false);

  const goalRef = useRef<HTMLElement | null>(null);
  const titleHeadingRef = useRef<HTMLHeadingElement | null>(null);
  const copyColRef = useRef<HTMLDivElement | null>(null);
  const ribbonSvgRef = useRef<SVGSVGElement | null>(null);
  const imgInRef = useRef<HTMLDivElement | null>(null);
  const tunnelRef = useRef<HTMLDivElement | null>(null);
  const imgOutRef = useRef<HTMLDivElement | null>(null);

  const stageOverlayRef = useRef<HTMLDivElement | null>(null);
  const backdropGlowRef = useRef<HTMLDivElement | null>(null);
  const monitorBezelRef = useRef<HTMLDivElement | null>(null);
  const tunnelTitleWrapRef = useRef<HTMLDivElement | null>(null);
  const titleLineRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const fallbackPosterRef = useRef<HTMLDivElement | null>(null);
  const playbackControlsRef = useRef<HTMLDivElement | null>(null);
  const pausePlaybackRef = useRef<HTMLButtonElement | null>(null);
  const skipPlaybackRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const goalEl = goalRef.current;
    const titleHeadingEl = titleHeadingRef.current;
    const copyColEl = copyColRef.current;
    const ribbonSvgEl = ribbonSvgRef.current;
    const imgInEl = imgInRef.current;
    const tunnelEl = tunnelRef.current;
    const imgOutEl = imgOutRef.current;
    const overlayEl = stageOverlayRef.current;
    const backdropEl = backdropGlowRef.current;
    const monitorBezelEl = monitorBezelRef.current;
    const titleWrapEl = tunnelTitleWrapRef.current;
    const hostEl = canvasHostRef.current;

    if (
      !goalEl ||
      !imgInEl ||
      !tunnelEl ||
      !imgOutEl ||
      !overlayEl ||
      !backdropEl ||
      !monitorBezelEl ||
      !titleWrapEl ||
      !hostEl
    ) {
      return;
    }

    const showStaticFallback = () => {
      goalEl.dataset.staticFallback = "true";
      if (fallbackPosterRef.current) fallbackPosterRef.current.style.display = "flex";
      // Never leave a 35-screen empty cinematic when rendering is unavailable.
      tunnelEl.style.display = "none";
      overlayEl.style.display = "none";
      for (const el of [titleHeadingEl, copyColEl, ribbonSvgEl]) {
        if (el) { el.style.opacity = ""; el.style.transform = ""; }
      }
    };

    let reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const forceAssetFailure =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("simulateGlbError") === "1";

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        stencil: true,
        powerPreference: "high-performance",
      });
    } catch {
      showStaticFallback();
      return;
    }

    const audioJourney = soundEngine.acquireJourney();
    const glRenderer = renderer;
    const glCtx = glRenderer.getContext();
    const dbgExt = glCtx.getExtension("WEBGL_debug_renderer_info");
    const rendererLabel = dbgExt ? String(glCtx.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL)) : "";
    const isSoftwareRenderer = /swiftshader|llvmpipe|software/i.test(rendererLabel);

    const initW = Math.max(2, window.innerWidth);
    const initH = Math.max(2, window.innerHeight);
    const isMobileInit = initW < 820;
    const initDpr = cinematicRenderDpr(initW,initH,window.devicePixelRatio || 1,isSoftwareRenderer,reducedMotion);

    glRenderer.setPixelRatio(initDpr);
    glRenderer.setSize(initW, initH, false);
    glRenderer.setClearColor(0x000000, 0);
    glRenderer.info.autoReset = false; // Count all composer passes, not just its final fullscreen quad.
    glRenderer.outputColorSpace = THREE.SRGBColorSpace;
    glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    glRenderer.toneMappingExposure = 1.02;
    glRenderer.shadowMap.enabled = !isMobileInit && !isSoftwareRenderer;
    glRenderer.shadowMap.type = THREE.PCFShadowMap;
    glRenderer.domElement.style.width = "100%";
    glRenderer.domElement.style.height = "100%";
    glRenderer.domElement.style.display = "block";
    hostEl.appendChild(glRenderer.domElement);

    let unmounted = false;
    let contextLost = false;
    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      if (unmounted || contextLost) item.dispose();
      else disposables.push(item);
      return item;
    };

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(44, initW / initH, 0.08, 180);
    camera.position.set(0, 0, 5.2);

    // -------------------------------------------------------------------------
    // High-Contrast Orbital Studio Lighting (`detail_01`, `detail_04`, `detail_05`):
    // - Low ambient so deep creases & shadow side stay rich dark charcoal (`sRGB 24–55`)
    // - Strong upper-left solar key so quilted fabric & helmet crown glow crisp off-white (`sRGB ~236`)
    // - Cool bottom-right Earthshine fill modulated subtly by Earth visibility
    // -------------------------------------------------------------------------
    const spaceAmbient = new THREE.HemisphereLight(0xcddbf5, 0x020308, 0.055);
    scene.add(spaceAmbient);

    // Oblique upper-left solar key (`detail_01`, `detail_04`, `detail_05`):
    // Rakes across quilted folds so left shoulder/helmet glow crisp off-white while viewer-right torso falls into rich space shadow!
    const sunKeyLight = new THREE.DirectionalLight(0xffffff, 2.15);
    sunKeyLight.position.set(-3.65, 2.15, 0.48);
    if (!isMobileInit && !isSoftwareRenderer) {
      sunKeyLight.castShadow = true;
      sunKeyLight.shadow.mapSize.set(2048, 2048);
      sunKeyLight.shadow.radius = 4;
      sunKeyLight.shadow.bias = -0.0005;
    }
    scene.add(sunKeyLight);

    const sunRimKicker = new THREE.DirectionalLight(0xf2f7ff, 1.35);
    sunRimKicker.position.set(-3.2, 2.1, -1.65);
    scene.add(sunRimKicker);

    const softFrontFill = new THREE.DirectionalLight(0xd8e4fa, 0.34);
    softFrontFill.position.set(-0.9, 0.5, 3.2);
    scene.add(softFrontFill);

    const earthshineFill = new THREE.DirectionalLight(0x6fa6ff, 0.26);
    earthshineFill.position.set(3.2, -2.4, 1.6);
    scene.add(earthshineFill);

    // Light dedicated specifically to the dark metallic 3D tablet chassis bevel (`Frames 01–03`)
    const bezelRimLight = new THREE.DirectionalLight(0xeef3ff, 1.15);
    bezelRimLight.position.set(-1.5, 2.4, 4.8);
    scene.add(bezelRimLight);

    const visorEnvTarget = track(buildAstronautStudioEnv(glRenderer));

    // -------------------------------------------------------------------------
    // 1. 3D Rounded-Rect Tablet Bezel + Hardware Stencil Portal (`Frames 01–03`)
    // -------------------------------------------------------------------------
    const tablet3D = build3DTabletPortal(track);
    scene.add(tablet3D.group);

    // -------------------------------------------------------------------------
    // 2. Procedural Earth Sphere + Fresnel Blue-White Limb + Night Side + Solar Glare
    // -------------------------------------------------------------------------
    const earthSystem = buildProceduralEarthLimb(track);
    scene.add(earthSystem.group);

    // -------------------------------------------------------------------------
    // 3. Space Optical Overlays (Visor Star Flare, Open-Space Halo, Chromatic Ring)
    // -------------------------------------------------------------------------
    const optics = buildSpaceOpticalOverlays(track);
    scene.add(optics.spaceHaloMesh);
    scene.add(optics.visorFlareMesh);
    scene.add(optics.chromaticRingMesh);

    const portalMaskedMaterials: THREE.Material[] = [
      ...earthSystem.materials,
      optics.spaceHaloMat,
      optics.visorFlareMat,
      // Open-space optical meshes obey the same physical tablet aperture.
      // Releasing the existing stencil later still permits the open-space effect.
      optics.chromaticRingMat,
    ];

    // -------------------------------------------------------------------------
    // 4. Load captured Lusion astronaut meshes first; the unrelated GLB is last-resort fallback only.
    // -------------------------------------------------------------------------
    let mainAstro: LoadedAstronautRig | null = null;
    const clones: LoadedAstronautRig[] = [];
    const visorLed = buildVisorLedMatrix(track);
    const hologramEchoMat = buildHologramEchoMaterial(track);

    const glbPromise = forceAssetFailure
      ? Promise.reject(new Error("Simulated astronaut asset failure (?simulateGlbError=1)"))
      : loadLusionAstronautParts(visorEnvTarget.texture, isMobileInit, track).catch(() =>
          // The captured Lusion .buf suit parts are authoritative. Keep the legacy GLB only as a
          // last-resort fallback if one of those bundled source assets is unavailable.
          loadLicensedAstronautGlb(visorEnvTarget.texture, isMobileInit, track)
        );

    // -------------------------------------------------------------------------
    // 5. High-Fidelity Single-Draw-Call Downstream Worlds (`Frames 09–20`)
    // -------------------------------------------------------------------------
    const corridorEnvironment = track(new THREE.WebGLCubeRenderTarget(isMobileInit ? 64 : 128));
    const captureCorridorEnvironment = (world: THREE.Group) => {
      if (unmounted || contextLost) return;
      const reflectionScene = new THREE.Scene();
      reflectionScene.background = new THREE.Color(0x0a104a);
      reflectionScene.add(new THREE.HemisphereLight(0xe5efff,0x162e9a,1.2));
      const reflectionKey = new THREE.DirectionalLight(0xffffff,1.1);
      reflectionKey.position.set(-2,3,4);
      reflectionScene.add(reflectionKey);
      const reflected = world.clone(true);
      reflected.visible = true;
      reflectionScene.add(reflected);
      const stencilStates = new Map<THREE.Material,boolean>();
      reflected.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return;
        for (const mat of Array.isArray(node.material) ? node.material : [node.material]) {
          if (!stencilStates.has(mat)) stencilStates.set(mat,mat.stencilWrite);
          mat.stencilWrite = false;
        }
      });
      const cubeCamera = new THREE.CubeCamera(0.1,80,corridorEnvironment);
      cubeCamera.position.set(0,0,1.5);
      try { cubeCamera.update(glRenderer,reflectionScene); }
      finally {
        for (const [mat,stencilWrite] of stencilStates) mat.stencilWrite = stencilWrite;
        reflectionScene.clear();
      }
    };
    const blueCorridor = buildBlueArchCorridor(track,captureCorridorEnvironment,isMobileInit || isSoftwareRenderer);
    blueCorridor.group.visible = false;
    scene.add(blueCorridor.group);
    scene.add(blueCorridor.monitorStencilMask);
    // Initial fallback capture; refresh once when authoritative architecture is ready.
    // No cube renders or PMREM generation occur in the animation loop.
    captureCorridorEnvironment(blueCorridor.group);
    const trussSystem = buildArchitecturalTrussTunnel(track, isMobileInit || isSoftwareRenderer, corridorEnvironment.texture);
    trussSystem.group.visible = false;
    scene.add(trussSystem.group);
    // Nested transparent 4D-projected glass cages surround the core; no opaque white tesseract.
    const vortexGlass = buildVortexHypercubeLattice(track, corridorEnvironment.texture, isMobileInit);
    vortexGlass.group.visible = false;
    scene.add(vortexGlass.group);
    const glazing = buildTunnelGlazing(track, corridorEnvironment.texture, isMobileInit);
    scene.add(glazing.group);
    glazing.group.visible = false;

    // Live scene color buffer: animated fragments refract the current tunnel and astronaut.
    let glassRefractionTarget: THREE.WebGLRenderTarget | null = null;

    // Captured rigid-body shard transforms are interpolated continuously at each scroll sample.
    let shardsMesh: THREE.Mesh | null = null;
    let shardEdgesMesh: THREE.Mesh | null = null;
    let numShards = 0;
    let framesPerShard = 0;

    const endDecor = buildDiamondsAndPopStickers(track, isMobileInit);
    endDecor.group.visible = false;
    scene.add(endDecor.group);

    // Glass is optional: a failed debris asset must not suppress the astronaut rig.
    import("@/lib/lusion-buf-loader")
      .then((m) => Promise.all([
        m.loadLusionBuf("/assets/models/tunnels/broken_glass.buf"),
        m.loadLusionBuf("/assets/models/tunnels/broken_glass_animation.buf"),
      ]))
      .then(([bg, bga]) => {
        if (unmounted || contextLost) return;

        const maxPiece = Math.max(...bg.attributes.piece);
        numShards = maxPiece + 1;
        framesPerShard = Math.floor(bga.header.vertexCount / numShards);
        
        // This is one indexed mesh, not an instanced draw. Preserve normals for the glass shader.
        const geom = track(bg.geometry.clone());
        geom.setAttribute("aPiece", geom.getAttribute("piece"));
        geom.computeVertexNormals();
        const restBounds = new THREE.Box3();
        const restVertex = new THREE.Vector3();
        const positions = geom.getAttribute("position");
        const pieces = geom.getAttribute("piece");
        for (let i = 0; i < positions.count; i++) {
          const piece = pieces.getX(i);
          restVertex.fromBufferAttribute(positions, i);
          restVertex.x += bga.attributes.position[piece * 3];
          restVertex.y += bga.attributes.position[piece * 3 + 1];
          restVertex.z += bga.attributes.position[piece * 3 + 2];
          restBounds.expandByPoint(restVertex);
        }

        const animData = new Float32Array(bga.attributes.position);
        const animOrient = new Float32Array(bga.attributes.orient);
        const shardCenter = restBounds.getCenter(new THREE.Vector3());
        const shardBoundsSize = restBounds.getSize(new THREE.Vector3()).length();
        const shardSideThickness = Math.max(0.001, shardBoundsSize * 0.00125);
        const shardSpread = 1.14;
        
        const mat = track(
          new THREE.ShaderMaterial({
            defines: { USE_SHARDS: 1 },
            transparent: true,
            side: THREE.DoubleSide,
            // Let nearer shard facets occlude farther facets instead of accumulating as wireframe layers.
            depthWrite: true,
            uniforms: { 
              uOpacity: { value: 0 },
              uEnvironment: { value: corridorEnvironment.texture },
              uSceneColor: { value: glassRefractionTarget?.texture ?? null },
              uRefractionSize: { value: new THREE.Vector2(1, 1) },
              uRefractionStrength: { value: 1.38 },
              uGlassThickness: { value: Math.max(0.75, shardSideThickness * 2.0) },
              uCameraWorldMatrix: { value: camera.matrixWorld },
              uFrameData: { value: null },
              uOrientData: { value: null },
            },
            vertexShader: [
              "attribute float aPiece;",
              "uniform sampler2D uFrameData;",
              "uniform sampler2D uOrientData;",
              "uniform mat4 uCameraWorldMatrix;",
              "varying vec3 vNormalV;",
              "varying vec3 vPosV;",
              "varying vec3 vWorldPos;",
              "varying vec3 vNormalW;",
              "varying vec4 vClipPosition;",
              "vec3 applyQuat(vec3 v, vec4 q) {",
              "  return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);",
              "}",
              "void main() {",
              "  float p = aPiece;",
              "  float u = (mod(p, 32.0) + 0.5) / 32.0;",
              "  float v = (floor(p / 32.0) + 0.5) / 30.0;",
              "  vec3 center = texture2D(uFrameData, vec2(u, v)).xyz;",
              "  vec4 q = texture2D(uOrientData, vec2(u, v));",
              "  vec3 pos = center + applyQuat(position, q);",
              "  vec4 mv = modelViewMatrix * vec4(pos, 1.0);",
              "  vPosV = mv.xyz;",
              "  vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;",
              "  // Inverse-transpose handles the non-uniform monitor aperture scale.",
              "  vNormalV = normalize(normalMatrix * applyQuat(normal, q));",
              "  // Convert view-space normals back to world space with the camera world rotation.",
              "  vNormalW = normalize(mat3(uCameraWorldMatrix) * vNormalV);",
              "  gl_Position = projectionMatrix * mv;",
              "  vClipPosition = gl_Position;",
              "}",
            ].join("\n"),
            fragmentShader: [
              "varying vec3 vNormalV;",
              "varying vec3 vPosV;",
              "varying vec3 vWorldPos;",
              "varying vec3 vNormalW;",
              "varying vec4 vClipPosition;",
              "uniform float uOpacity;",
              "uniform float uRefractionStrength;",
              "uniform float uGlassThickness;",
              "uniform samplerCube uEnvironment;",
              "uniform sampler2D uSceneColor;",
              "uniform vec2 uRefractionSize;",
              "const float PI = 3.14159265359;",
              "vec3 safeRefraction(vec3 I, vec3 N, float eta) {",
              "  vec3 ray = refract(I, N, eta);",
              "  return dot(ray, ray) < 0.0001 ? reflect(I, N) : ray;",
              "}",
              "float fresnelSchlick(float cosine, float f0) {",
              "  return f0 + (1.0 - f0) * pow(1.0 - clamp(cosine, 0.0, 1.0), 5.0);",
              "}",
              "void main() {",
              "  vec3 N = normalize(vNormalW) * (gl_FrontFacing ? 1.0 : -1.0);",
              "  vec3 Nv = normalize(vNormalV) * (gl_FrontFacing ? 1.0 : -1.0);",
              "  vec3 V = normalize(cameraPosition - vWorldPos);",
              "  float facing = clamp(abs(dot(N, V)), 0.0, 1.0);",
              "  const float iorR = 1.516;",
              "  const float iorG = 1.520;",
              "  const float iorB = 1.526;",
              "  const float f0 = 0.0426;",
              "  float fres = fresnelSchlick(facing, f0);",
              "  vec2 screenUv = vClipPosition.xy / max(0.0001, vClipPosition.w) * 0.5 + 0.5;",
              "  float pixelScale = min(1.65, 900.0 / max(1.0, min(uRefractionSize.x, uRefractionSize.y)));",
              "  float edge = pow(1.0 - facing, 1.38);",
              "  float opticalPath = uGlassThickness / max(0.14, facing);",
              "  vec3 incident = normalize(vPosV);",
              "  float etaR = gl_FrontFacing ? (1.0 / iorR) : iorR;",
              "  float etaG = gl_FrontFacing ? (1.0 / iorG) : iorG;",
              "  float etaB = gl_FrontFacing ? (1.0 / iorB) : iorB;",
              "  vec3 rayR = safeRefraction(incident, Nv, etaR);",
              "  vec3 rayG = safeRefraction(incident, Nv, etaG);",
              "  vec3 rayB = safeRefraction(incident, Nv, etaB);",
              "  vec2 incidentSlope = incident.xy / max(0.12, abs(incident.z));",
              "  vec2 slopeR = rayR.xy / max(0.12, abs(rayR.z));",
              "  vec2 slopeG = rayG.xy / max(0.12, abs(rayG.z));",
              "  vec2 slopeB = rayB.xy / max(0.12, abs(rayB.z));",
              "  float bendScale = (0.014 + edge * 0.031) * opticalPath * uRefractionStrength * pixelScale;",
              "  vec2 uvR = clamp(screenUv + (slopeR - incidentSlope) * bendScale, vec2(0.001), vec2(0.999));",
              "  vec2 uvG = clamp(screenUv + (slopeG - incidentSlope) * bendScale, vec2(0.001), vec2(0.999));",
              "  vec2 uvB = clamp(screenUv + (slopeB - incidentSlope) * bendScale, vec2(0.001), vec2(0.999));",
              "  vec3 transmitted = vec3(texture2D(uSceneColor, uvR).r, texture2D(uSceneColor, uvG).g, texture2D(uSceneColor, uvB).b);",
              "  vec3 envTransmission = textureCube(uEnvironment, rayG).rgb;",
              "  transmitted = mix(transmitted, envTransmission, 0.075);",
              "  vec3 envReflection = textureCube(uEnvironment, reflect(-V, N)).rgb;",
              "  vec3 reflectedRay = reflect(incident, Nv);",
              "  vec2 reflectedUv = clamp(screenUv + reflectedRay.xy * (0.026 + edge * 0.020) * pixelScale, vec2(0.001), vec2(0.999));",
              "  vec3 screenReflection = texture2D(uSceneColor, reflectedUv).rgb;",
              "  vec3 reflection = mix(envReflection, screenReflection, 0.80);",
              "  float reflectance = clamp(fres + edge * 0.075, 0.04, 0.97);",
              "  vec3 keyLight = normalize(vec3(-0.45, 0.72, 0.55));",
              "  float nDotV = max(dot(N, V), 0.001);",
              "  float nDotL = max(dot(N, keyLight), 0.0);",
              "  vec3 H = normalize(V + keyLight);",
              "  float nDotH = max(dot(N, H), 0.0);",
              "  float vDotH = max(dot(V, H), 0.0);",
              "  float roughness = 0.062 + edge * 0.018;",
              "  float alphaRough = roughness * roughness;",
              "  float alpha2 = alphaRough * alphaRough;",
              "  float dDenom = nDotH * nDotH * (alpha2 - 1.0) + 1.0;",
              "  float distribution = alpha2 / max(PI * dDenom * dDenom, 0.00001);",
              "  float geometryK = pow(roughness + 1.0, 2.0) * 0.125;",
              "  float geometryV = nDotV / (nDotV * (1.0 - geometryK) + geometryK);",
              "  float geometryL = nDotL / (nDotL * (1.0 - geometryK) + geometryK);",
              "  float specFres = f0 + (1.0 - f0) * pow(1.0 - vDotH, 5.0);",
              "  float ggxSpec = distribution * geometryV * geometryL * specFres / max(4.0 * nDotV * nDotL, 0.001) * nDotL;",
              "  float wideRough = 0.18;",
              "  float wideA = wideRough * wideRough;",
              "  float wideA2 = wideA * wideA;",
              "  float wideDenom = nDotH * nDotH * (wideA2 - 1.0) + 1.0;",
              "  float wideSpec = wideA2 / max(PI * wideDenom * wideDenom, 0.00001) * geometryV * geometryL * specFres / max(4.0 * nDotV * nDotL, 0.001) * nDotL;",
              "  vec3 absorption = exp(-vec3(0.010, 0.005, 0.0025) * opticalPath);",
              "  vec3 col = mix(transmitted * absorption, reflection, reflectance);",
              "  col += vec3(0.72, 0.87, 1.0) * edge * 0.34;",
              "  col += vec3(1.0, 0.995, 0.985) * ggxSpec * 4.4;",
              "  col += vec3(0.48, 0.70, 1.0) * wideSpec * 0.56;",
              "  float alpha = clamp(0.095 + fres * 0.64 + edge * 0.15 + ggxSpec * 0.12, 0.10, 0.92) * uOpacity;",
              "  gl_FragColor = vec4(col, alpha);",
              "}",
            ].join("\n"),
          })
        );
        
        shardsMesh = new THREE.Mesh(geom, mat);
        shardsMesh.visible = false;
        shardsMesh.frustumCulled = false;
        shardsMesh.renderOrder = 12;
        // Close every captured fragment into a thin glass plate. Sidewalls use the
        // same per-piece frame/quaternion textures as the refractive front/back faces.
        const sideGeometry = track(buildGlassShardSideGeometry(geom, shardSideThickness));
        shardEdgesMesh = new THREE.Mesh(sideGeometry, mat);
        shardEdgesMesh.visible = false;
        shardEdgesMesh.frustumCulled = false;
        shardEdgesMesh.renderOrder = 13;
        // The data is 946 items. 32x30 texture is 960 items.
        const frameData = new Float32Array(32 * 30 * 4);
        const orientData = new Float32Array(32 * 30 * 4);
        const texFrame = track(new THREE.DataTexture(frameData, 32, 30, THREE.RGBAFormat, THREE.FloatType));
        const texOrient = track(new THREE.DataTexture(orientData, 32, 30, THREE.RGBAFormat, THREE.FloatType));
        texFrame.needsUpdate = true;
        texOrient.needsUpdate = true;
        mat.uniforms.uFrameData.value = texFrame;
        mat.uniforms.uOrientData.value = texOrient;
        
        const sampleCapturedFrame = createGlassFrameSampler(animData, animOrient, numShards, framesPerShard, frameData, orientData);
        const sampleFrame = (frame: number) => {
          sampleCapturedFrame(frame);
          // Widen the authored breakup envelope slightly while keeping every captured shard trajectory.
          for (let piece = 0; piece < numShards; piece++) {
            const offset = piece * 4;
            frameData[offset] = shardCenter.x + (frameData[offset] - shardCenter.x) * shardSpread;
            frameData[offset + 1] = shardCenter.y + (frameData[offset + 1] - shardCenter.y) * shardSpread;
            frameData[offset + 2] = shardCenter.z + (frameData[offset + 2] - shardCenter.z) * shardSpread;
          }
        };
        shardsMesh.userData = {
          sampleFrame, texFrame, texOrient, framesPerShard, restBounds, shardSpread,
          sidewallTriangles: Math.floor(sideGeometry.getAttribute("position").count / 3),
        };
        scene.add(shardsMesh);
        scene.add(shardEdgesMesh);

      })
      .catch((error: unknown) => {
        if (!unmounted) console.warn("Goal glass assets unavailable", error);
      });

    glbPromise
      .then(({ primary, createClone }) => {
        if (unmounted || contextLost) return;
        mainAstro = primary;
        portalMaskedMaterials.push(...primary.materials);

        // Attach curved dot-matrix LED emoticon display inside `Head` bone (`Frames 18–20`)
        if (primary.bones.Head) {
          primary.bones.Head.add(visorLed.mesh);
        } else {
          // Captured deformation palettes expose a root-space visor anchor rather than named joints.
          primary.root.add(visorLed.mesh);
          visorLed.mesh.position.copy(primary.visorAnchorLocal);
        }

        applySuitJointPose(primary, SUIT_POSE_TABLET_FLOAT);
        scene.add(primary.root);

        if (primary.sampleBakedPose) applyCapturedDualQuaternionSkinning(hologramEchoMat);
        const cloneCount = isMobileInit ? 2 : 4;
        for (let c = 0; c < cloneCount; c++) {
          const cl = createClone();
          // Replace heavy PBR clearcoat materials on clones with single lightweight holographic shader!
          cl.modelRoot.traverse((node) => {
            if ((node as THREE.Mesh).isMesh) {
              (node as THREE.Mesh).material = hologramEchoMat;
              (node as THREE.Mesh).castShadow = false;
              (node as THREE.Mesh).receiveShadow = false;
            }
          });
          cl.root.visible = false;
          applySuitJointPose(cl, SUIT_POSE_TUMBLE_SPREAD);
          scene.add(cl.root);
          clones.push(cl);
        }

        // Pre-compile all downstream WebGL programs on hardware GPUs so scrolling through
        // `Frames 09 -> 20` incurs zero shader-compilation stalls (skip blocking batch LLVM JIT on software rasterizers).
        if (!isSoftwareRenderer) {
          const prevTruss = trussSystem.group.visible;
          const prevBlue = blueCorridor.group.visible;
          const prevShards = shardsMesh ? shardsMesh.visible : false;
          const prevShardEdges = shardEdgesMesh ? shardEdgesMesh.visible : false;
          const prevVortexGlass = vortexGlass.group.visible;
          const prevDecor = endDecor.group.visible;
          const prevLed = visorLed.mesh.visible;
          trussSystem.group.visible = true;
          blueCorridor.group.visible = true;
          if(shardsMesh) shardsMesh.visible = true;
          if(shardEdgesMesh) shardEdgesMesh.visible = true;
          vortexGlass.group.visible = true;
          endDecor.group.visible = true;
          visorLed.mesh.visible = true;
          if (clones[0]) clones[0].root.visible = true;
          glRenderer.compile(scene, camera);
          trussSystem.group.visible = prevTruss;
          blueCorridor.group.visible = prevBlue;
          if(shardsMesh) shardsMesh.visible = prevShards;
          if(shardEdgesMesh) shardEdgesMesh.visible = prevShardEdges;
          vortexGlass.group.visible = prevVortexGlass;
          endDecor.group.visible = prevDecor;
          visorLed.mesh.visible = prevLed;
          if (clones[0]) clones[0].root.visible = false;
        }

        if (window.__goalAstronautTelemetry) {
          window.__goalAstronautTelemetry.glbLoaded = true;
          window.__goalAstronautTelemetry.glbError = null;
          window.__goalAstronautTelemetry.fallbackVisible = false;
        }
        renderSceneAtScroll(smoothScrollY, (performance.now() - startClock) * 0.001);
      })
      .catch((err: unknown) => {
        if (unmounted || contextLost) return;
        const msg = err instanceof Error ? err.message : "Failed to load astronaut.glb";
        tablet3D.group.visible = false;
        earthSystem.group.visible = false;
        audioJourney.release();
        showStaticFallback();
        if (window.__goalAstronautTelemetry) {
          window.__goalAstronautTelemetry.glbLoaded = false;
          window.__goalAstronautTelemetry.glbError = msg;
          window.__goalAstronautTelemetry.fallbackVisible = true;
        }
        glRenderer.clear();
      });

    // -------------------------------------------------------------------------
    // Desktop Post-Processing (High-Threshold Bloom strictly above suit diffuse luminance!)
    // Stencil buffer preserved (`stencilBuffer: true`) so 3D portal stencil masking works!
    // -------------------------------------------------------------------------
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;

    const glassRefractionScale = isMobileInit ? 0.58 : isSoftwareRenderer ? 0.68 : 0.92;
    glassRefractionTarget = track(new THREE.WebGLRenderTarget(
      Math.max(2, Math.floor(initW * initDpr * glassRefractionScale)),
      Math.max(2, Math.floor(initH * initDpr * glassRefractionScale)),
      {
        format: THREE.RGBAFormat,
        type: glRenderer.capabilities.isWebGL2 && !isSoftwareRenderer ? THREE.HalfFloatType : THREE.UnsignedByteType,
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        depthBuffer: true,
        stencilBuffer: true,
      }
    ));
    glassRefractionTarget.texture.colorSpace = THREE.LinearSRGBColorSpace;

    if (!isMobileInit && !isSoftwareRenderer) {
      const bufW = Math.max(2, Math.floor(initW * initDpr));
      const bufH = Math.max(2, Math.floor(initH * initDpr));
      const msaaSamples = glRenderer.capabilities.isWebGL2
        ? Math.min(4, glRenderer.capabilities.maxSamples)
        : 0;

      const rt = track(
        new THREE.WebGLRenderTarget(bufW, bufH, {
          type: THREE.HalfFloatType,
          depthBuffer: true,
          stencilBuffer: true,
          samples: msaaSamples,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        })
      );
      composer = new EffectComposer(glRenderer, rt);
      composer.setPixelRatio(initDpr);
      composer.setSize(initW, initH);

      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.16, 0.46, 1.48);
      composer.addPass(bloomPass);

      const outputPass = new OutputPass();
      composer.addPass(outputPass);
    }

    // -------------------------------------------------------------------------
    // Layout Measurement, Pointer Parallax, & Deterministic Scroll Choreography
    // -------------------------------------------------------------------------
    let metrics: GoalLayoutMetrics | null = null;
    let playbackPath: ((u: number) => number) | null = null;
    let playbackState: "armed" | "playing" | "paused" | "completed" = "armed";
    let playbackProgress = 0;
    let playbackRuns = 0;
    let playbackTimeOrigin = 0;
    let cinematicTimeOffset = 0;
    let frameClock = performance.now();
    let userPaused = false;
    // Reduced motion avoids involuntary travel entirely: the established scrub remains available.
    // A live preference change also releases playback immediately (handled below).
    const controls = playbackControlsRef.current;
    const pauseButton = pausePlaybackRef.current;
    const skipButton = skipPlaybackRef.current;
    type ScrollDriver = { stop: () => void; start: () => void;
      scrollTo: (y: number, o: { immediate: boolean; force: boolean }) => void };
    const scrollDriver = () => (window as unknown as { __lenis?: ScrollDriver }).__lenis;
    const syncDocument = (y: number) => {
      const driver = scrollDriver();
      if (driver) driver.scrollTo(y, { immediate: true, force: true });
      else window.scrollTo({ top: y, behavior: "instant" });
    };
    const playing = () => playbackState === "playing" || playbackState === "paused";
    const blockedByChrome = () => {
      const store = useStudioStore.getState();
      return store.menuOpen || store.reelOpen || store.isTransitioning;
    };
    const releasePlayback = (complete: boolean) => {
      if (!playing()) return;
      if (complete && playbackPath) {
        playbackProgress = 1;
        const y = playbackPath(1);
        syncDocument(y);
        targetScrollY = smoothScrollY = y;
      }
      cinematicTimeOffset = (performance.now() - startClock) * 0.001 - (playbackTimeOrigin + playbackProgress * GOAL_CINEMATIC_SECONDS);
      playbackState = "completed";
      userPaused = false;
      if (complete && controls?.contains(document.activeElement)) {
        document.getElementById("end-section-title-link")?.focus({ preventScroll: true });
      }
      if (controls) controls.hidden = true;
      // Do not reopen scrolling behind an open navigation/reel overlay.
      const chrome = useStudioStore.getState();
      if (!chrome.menuOpen && !chrome.reelOpen) scrollDriver()?.start();
    };
    let ownedScrollManager: NonNullable<Window["__lusionInspector"]>["scrollManager"];
    let targetScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let smoothScrollY = targetScrollY;
    let lastObservedScrollY = targetScrollY;
    let docVisible = document.visibilityState === "visible";
    let wasInBand = true;
    let rafId = 0;
    const startClock = performance.now();

    const pointerTarget = { x: 0, y: 0 };
    const pointerSmooth = { x: 0, y: 0 };

    window.__goalAstronautTelemetry = {
      glbLoaded: false,
      glbError: null,
      qualityTier: isMobileInit ? "mobile" : "desktop",
      renderWidth: Math.floor(initW * initDpr),
      renderHeight: Math.floor(initH * initDpr),
      pixelRatio: initDpr,
      textureMaxDim: isMobileInit ? 1024 : 2048,
      drawCalls: 0,
      triangles: 0,
      lastFrameMs: 0,
      renderCount: 0,
      resources: { geometries: 0, textures: 0, programs: 0 },
      gpuTiming: { enabled: false, lastMs: null, phase: "", samples: 0, disjoints: 0 },
      solar: { x: 0, y: 0, facing: 0, visibility: 0, occlusion: 1, focalScale: 1 },
      emergenceProgress: 0,
      portalStencilActive: true,
      fallbackVisible: false,
      sceneState: {
        tunnelProgress: 0, shatterProgress: 0, waitProgress: 0, bakedFrame: 0,
        astronautMatrix: new Array<number>(16).fill(0),
        cameraMatrix: new Array<number>(16).fill(0),
        trussLoaded: false, shardsLoaded: false, portalFlash: 0, flashVisible: false,
        corridorTravel: 0, glazingLayers: 0, glassOpacity: 0,
        glassRefractionReady: false, shardDepthWrite: false, shardSpread: 1.14,
        shardSidewallsLoaded: false, shardSidewallTriangles: 0,
        shardCount: 0, shardFrames: 0, vortexIntensity: 0,
        vortexGlassVisible: false, vortexGlassLayers: 0, vortexGlassEdges: 0, ringVisible: false,
      },
      playback: { state: "armed", progress: 0, virtualScroll: 0, activation: 0, end: 0, runs: 0 },
      scrollForEmergence: (u: number) => {
        if (!metrics) measure();
        const m = metrics!;
        return m.emergenceStart + clamp01(u) * m.emergenceSpan;
      },
      scrollForTunnel: (u: number) => {
        if (!metrics) measure();
        const m = metrics!;
        return m.tunnelStart + clamp01(u) * m.tunnelSpan;
      },
      scrollForShatter: (u: number) => {
        if (!metrics) measure();
        const m = metrics!;
        const start = m.imgOutTop - m.viewportH * 0.55;
        return start + clamp01(u) * Math.max(1, m.endTop - start);
      },
    };

    // Explicit opt-in: bounded query ring, asynchronous reads, no GPU waits or normal-mode polling.
    const profilingContext = new URLSearchParams(window.location.search).get("profileGoal") === "1" ? glRenderer.getContext() : null;
    const gpuTimer = profilingContext && typeof WebGL2RenderingContext !== "undefined" && profilingContext instanceof WebGL2RenderingContext
      ? createGpuFrameTimer(profilingContext, (ms, phase) => {
        const timing = window.__goalAstronautTelemetry?.gpuTiming;
        if (timing) {
          timing.lastMs = ms; timing.phase = phase; timing.samples++;
          // Several queries can finish together. Retain each result for the sampling harness.
          const recent = timing.recent;
          if (recent) {
            const entry = recent[(timing.samples - 1) % recent.length];
            entry.id = timing.samples; entry.ms = ms; entry.phase = phase;
          }
        }
      }, () => {
        const timing = window.__goalAstronautTelemetry?.gpuTiming;
        if (timing) { timing.lastMs = null; timing.disjoints++; }
      }) : null;
    if (gpuTimer) {
      track(gpuTimer);
      const gpuTiming = window.__goalAstronautTelemetry?.gpuTiming;
      if (gpuTiming) {
        gpuTiming.enabled = true;
        gpuTiming.recent = Array.from({ length: 16 }, () => ({ id: 0, ms: 0, phase: "" }));
      }
    }

    const docOffsetTop = (el: HTMLElement): number => {
      let top = 0;
      let cur: HTMLElement | null = el;
      while (cur) {
        top += cur.offsetTop;
        cur = cur.offsetParent as HTMLElement | null;
      }
      return top;
    };

    const measure = () => {
      const W = Math.max(2, window.innerWidth);
      const H = Math.max(2, window.innerHeight);
      const sy = window.scrollY;
      const isMobile = W < 820;

      // Measure natural zero-spread line widths of the 3-line headline cleanly at gap = baseWordGapPx
      const prevWrapDisplay = titleWrapEl.style.display;
      const prevWrapVis = titleWrapEl.style.visibility;
      const prevWrapT = titleWrapEl.style.transform;
      titleWrapEl.style.visibility = "hidden";
      titleWrapEl.style.display = "flex";
      titleWrapEl.style.transform = "translate3d(-50%, -50%, 0) scale(1)";

      const baseFontPx = parseFloat(getComputedStyle(titleLineRefs.current[0] ?? titleWrapEl).fontSize);
      const baseWordGapPx = baseFontPx * 0.28;
      const lineBaseWidths: number[] = [];
      const lineWordCounts: number[] = TITLE_WORD_LINES.map((w) => w.length);

      TITLE_WORD_LINES.forEach((words, idx) => {
        const lineEl = titleLineRefs.current[idx];
        if (!lineEl) {
          lineBaseWidths.push(W * 0.5);
          return;
        }
        lineEl.style.columnGap = `${baseWordGapPx.toFixed(1)}px`;
        lineEl.style.letterSpacing = "0.018em";
        lineBaseWidths.push(lineEl.getBoundingClientRect().width || words.length * baseFontPx * 2.5);
      });

      titleWrapEl.style.display = prevWrapDisplay;
      titleWrapEl.style.visibility = prevWrapVis;
      titleWrapEl.style.transform = prevWrapT;

      // Scroll-invariant layout geometry via DOM offsetParent chain + offsetWidth/offsetHeight!
      const goalTop = docOffsetTop(goalEl);
      const goalHeight = goalEl.offsetHeight;
      const imgInLeft = imgInEl.getBoundingClientRect().left;
      const imgInTop = docOffsetTop(imgInEl);
      const imgInWidth = Math.max(1, imgInEl.offsetWidth);
      const imgInHeight = Math.max(1, imgInEl.offsetHeight);

      const imgOutLeft = imgOutEl.getBoundingClientRect().left;
      const imgOutTop = docOffsetTop(imgOutEl);
      const imgOutWidth = Math.max(1, imgOutEl.offsetWidth);
      const imgOutHeight = Math.max(1, imgOutEl.offsetHeight);

      const endEl = document.getElementById("end-section") as HTMLElement | null;
      const endTop = endEl ? docOffsetTop(endEl) : goalTop + goalHeight;
      const endHeight = endEl ? Math.max(H, endEl.offsetHeight) : H * 2;

      // Exact Frame 01 resting scroll (`01_t00.0s`):
      // Desktop: tablet centered at `0.465 * H` (`Experiences` baseline at `0..8%`, zero header collision!)
      // Mobile (`< 820px`): align copy column cleanly at `84px` below fixed header so both paragraphs + full 3D tablet sit unobstructed!
      const mobileCopyTop = copyColEl ? docOffsetTop(copyColEl) : imgInTop - 280;
      const emergenceStart = Math.max(
        0,
        isMobile
          ? Math.round(mobileCopyTop - 84)
          : Math.round(imgInTop + imgInHeight * 0.5 - H * 0.465)
      );
      const emergenceSpan = H * 4.8;
      const emergenceEnd = emergenceStart + emergenceSpan;

      const tunnelStart = emergenceEnd;
      const tunnelEnd = Math.max(tunnelStart + H * 4, imgOutTop + imgOutHeight - H);
      const tunnelSpan = Math.max(1, tunnelEnd - tunnelStart);

      metrics = {
        goalTop,
        goalHeight,
        imgInLeft,
        imgInTop,
        imgInWidth,
        imgInHeight,
        emergenceStart,
        emergenceSpan,
        emergenceEnd,
        tunnelStart,
        tunnelEnd,
        tunnelSpan,
        imgOutLeft,
        imgOutTop,
        imgOutWidth,
        imgOutHeight,
        endTop,
        endHeight,
        viewportW: W,
        viewportH: H,
        isMobile,
        lineBaseWidths,
        lineWordCounts,
        baseWordGapPx,
      };

      playbackPath = createGoalPlaybackPath(metrics);
      if (window.__goalAstronautTelemetry) {
        window.__goalAstronautTelemetry.playback.activation = playbackPath(0);
        window.__goalAstronautTelemetry.playback.end = playbackPath(1);
      }

      const dpr = cinematicRenderDpr(W,H,window.devicePixelRatio || 1,isSoftwareRenderer,reducedMotion);
      glRenderer.setPixelRatio(dpr);
      glRenderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();

      if (composer && bloomPass) {
        composer.setPixelRatio(dpr);
        composer.setSize(W, H);
        bloomPass.setSize(W, H);
      }
      glassRefractionTarget?.setSize(
        Math.max(2, Math.floor(W * dpr * glassRefractionScale)),
        Math.max(2, Math.floor(H * dpr * glassRefractionScale))
      );

      if (window.__goalAstronautTelemetry) {
        window.__goalAstronautTelemetry.renderWidth = Math.floor(W * dpr);
        window.__goalAstronautTelemetry.renderHeight = Math.floor(H * dpr);
        window.__goalAstronautTelemetry.pixelRatio = dpr;
      }

      const blackTitleFrom = emergenceStart + emergenceSpan * 0.62;
      const blackTitleTo = emergenceEnd;
      const blackTunnelFrom = tunnelStart;
      const blackTunnelTo = tunnelStart + tunnelSpan * 0.72;
      const whiteTunnelFrom = blackTunnelTo;
      const whiteTunnelTo = tunnelEnd;
      const astroDropFrom = imgOutTop - H * 0.55;
      const astroDropTo = endTop;
      const astroWaitFrom = endTop;
      const astroWaitTo = endTop + endHeight;

      window.__lusionInspector = {
        ...window.__lusionInspector,
        properties: { hasStarted: true },
        scrollManager: {
          scrollPixel: sy,
          contentSizePixel: Math.max(0, document.documentElement.scrollHeight - H),
          scrollLimit: Math.max(0, document.documentElement.scrollHeight - H),
          scrollToPixel: (y: number) => {
            // Explicit inspector seeking cancels autonomous playback; normal native scroll activates it.
            releasePlayback(false);
            playbackState = "completed";
            const win = window as unknown as {
              __lenis?: {
                resize: () => void;
                scrollTo: (t: number, o?: { immediate?: boolean }) => void;
              };
            };
            win.__lenis?.resize();
            win.__lenis?.scrollTo(y, { immediate: true });
            window.scrollTo({ top: y, behavior: "instant" });
            targetScrollY = y;
            smoothScrollY = y;
            renderSceneAtScroll(y, (performance.now() - startClock) * 0.001);
          },
        },
        homeGoalSectionRanges: {
          baseY: goalTop,
          totalPixelCount: Math.max(1, astroWaitTo - goalTop),
          items: {
            blackTitle: {
              id: "blackTitle",
              pixelFrom: blackTitleFrom,
              pixelCount: blackTitleTo - blackTitleFrom,
              pixelTo: blackTitleTo,
            },
            blackTunnel: {
              id: "blackTunnel",
              pixelFrom: blackTunnelFrom,
              pixelCount: blackTunnelTo - blackTunnelFrom,
              pixelTo: blackTunnelTo,
            },
            whiteTunnel: {
              id: "whiteTunnel",
              pixelFrom: whiteTunnelFrom,
              pixelCount: whiteTunnelTo - whiteTunnelFrom,
              pixelTo: whiteTunnelTo,
            },
            astronautDrop: {
              id: "astronautDrop",
              pixelFrom: astroDropFrom,
              pixelCount: Math.max(1, astroDropTo - astroDropFrom),
              pixelTo: astroDropTo,
            },
            astronautWait: {
              id: "astronautWait",
              pixelFrom: astroWaitFrom,
              pixelCount: Math.max(1, astroWaitTo - astroWaitFrom),
              pixelTo: astroWaitTo,
            },
          },
        },
      };
      ownedScrollManager = window.__lusionInspector.scrollManager;
    };

    const _sunClip = new THREE.Vector3();
    const _sunView = new THREE.Vector3();
    const _sunWorld = new THREE.Vector3();
    const _solarBlocker = new THREE.Vector3();
    const _cameraForward = new THREE.Vector3();
    const _rootPosition = new THREE.Vector3();
    const _outPosition = new THREE.Vector3();
    const _rootOrientation = new THREE.Quaternion();
    const _outOrientation = new THREE.Quaternion();
    const _invertedBasis = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,0,1),Math.PI);
    const _headWorld = new THREE.Vector3();
    const _camLook = new THREE.Vector3();
    const _monitorCenter = new THREE.Vector3();
    const _monitorRotation = new THREE.Quaternion();
    const _screenRotation = new THREE.Quaternion();
    const _zAxis = new THREE.Vector3(0, 0, 1);

    const renderSceneAtScroll = (sy: number, wallElapsedSec: number) => {
      const elapsedSec = playing() ? playbackTimeOrigin + playbackProgress * GOAL_CINEMATIC_SECONDS : wallElapsedSec - cinematicTimeOffset;
      const t0 = performance.now();
      if (!metrics) measure();
      const m = metrics;
      if (!m) return;

      // If GLB load explicitly errored, keep graceful fallback poster visible cleanly
      if (window.__goalAstronautTelemetry?.fallbackVisible) {
        return;
      }

      const W = m.viewportW;
      const H = m.viewportH;

      const activeStart = Math.max(0, m.goalTop - H * 0.95);
      // Stay active cleanly until `#footer-section` (`z-[32]`) completely covers the viewport!
      const activeEnd = m.endTop + m.endHeight + H * 1.05;

      if (sy < activeStart || sy > activeEnd) {
        audioJourney.update(IDLE_JOURNEY);
        overlayEl.style.visibility = "hidden";
        if (titleHeadingEl) {
          titleHeadingEl.style.transform = "";
          titleHeadingEl.style.opacity = "1";
        }
        if (copyColEl) {
          copyColEl.style.transform = "";
          copyColEl.style.opacity = "1";
        }
        if (ribbonSvgEl) {
          ribbonSvgEl.style.transform = "";
          ribbonSvgEl.style.opacity = "1";
        }
        if (lastSurfaceDarkRef.current) {
          lastSurfaceDarkRef.current = false;
          setActiveSurface("ice");
        }
        return;
      }
      overlayEl.style.visibility = "visible";

      const uEmergence = clamp01((sy - m.emergenceStart) / m.emergenceSpan);
      const tTunnel = clamp01((sy - m.tunnelStart) / m.tunnelSpan);
      const outPullStart = m.imgOutTop - H * (W < 1200 ? 2.55 : 1.42);
      const outPullEnd = m.imgOutTop - H * (W < 1200 ? 1.15 : 0.45);
      const tOutPull = smoothstep(outPullStart, outPullEnd, sy);
      const shatterStart = m.imgOutTop - H * 0.55;
      const shatterEnd = m.endTop;
      const tShatter = clamp01((sy - shatterStart) / Math.max(1, shatterEnd - shatterStart));
      const tWait = clamp01((sy - m.endTop) / Math.max(1, m.endHeight));
      const footerWipingMost = sy > m.endTop + m.endHeight - H * 0.45;
      const endBottomEl = document.getElementById("end-bottom");
      if (endBottomEl) {
        const footerEnter = smoothstep(
          m.endTop + m.endHeight - H * 0.96,
          m.endTop + m.endHeight - H * 0.80,
          sy
        );
        endBottomEl.style.opacity = String(1 - footerEnter);
        endBottomEl.style.pointerEvents = footerEnter > 0.6 ? "none" : "auto";
      }

      // Keep white chrome across the blue monitor environment; restore dark chrome at footer.
      const wantDarkHeader = uEmergence > 0.45 && !footerWipingMost;
      if (lastSurfaceDarkRef.current !== wantDarkHeader) {
        lastSurfaceDarkRef.current = wantDarkHeader;
        setActiveSurface(wantDarkHeader ? "void" : "ice");
      }

      if (window.__lusionInspector?.scrollManager) {
        window.__lusionInspector.scrollManager.scrollPixel = sy;
      }

      const kf = evaluateEmergenceChoreography(uEmergence);
      const inEmergencePhase = sy <= m.emergenceEnd + 1;

      const pxParallax = reducedMotion ? 0 : pointerSmooth.x;
      const pyParallax = reducedMotion ? 0 : pointerSmooth.y;

      // -----------------------------------------------------------------------
      // A. Camera + True 3D Tablet Bezel + GPU Stencil Portal (`Frames 01 -> 04`)
      // -----------------------------------------------------------------------
      if (inEmergencePhase) {
        const fovNow = m.isMobile ? kf.camFovMobile : kf.camFovDesktop;
        camera.fov = fovNow;
        camera.aspect = W / H;
        camera.up.set(0, 1, 0);
        camera.position.set(
          kf.camPos[0] + pxParallax * 0.08,
          kf.camPos[1] + pyParallax * 0.06,
          kf.camPos[2]
        );
        _camLook.set(kf.camTarget[0], kf.camTarget[1], kf.camTarget[2]);
        camera.lookAt(_camLook);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
      } else {
        // Dynamic camera FOV + clockwise banking roll in `Frame 15` (`-25.2°`), leveling smoothly into `16`!
        const inBlueCorridor = tTunnel > 0.81 && tShatter < 0.90 && tWait <= 0.001;
        const bankRoll = inBlueCorridor
          ? lerp(-0.44, 0.0, smoothstep(0.05, 0.68, tOutPull)) *
            smoothstep(0.81, 0.85, tTunnel) * (reducedMotion ? 0.35 : 1.0)
          : -smoothstep(0.36,0.60,tTunnel) * 0.72 * (1-smoothstep(0.75,0.81,tTunnel)) * (reducedMotion ? 0.15 : 1.0);
        const vortexEnvelope = smoothstep(0.43, 0.55, tTunnel) * (1 - smoothstep(0.76, 0.84, tTunnel));
        const vortexOrbit = Math.sin(((tTunnel - 0.43) / 0.34) * Math.PI * 2.0) * 0.052 * vortexEnvelope;
        const vortexFovBoost = smoothstep(0.68, 0.80, tTunnel) * (1 - smoothstep(0.81, 0.85, tTunnel)) * 10;
        const vortexDive = smoothstep(0.62, 0.77, tTunnel) * (1 - smoothstep(0.78, 0.85, tTunnel));
        const cameraRoll = bankRoll + (reducedMotion ? 0 : vortexOrbit);
        camera.fov = (m.isMobile ? 54 : 45) + vortexFovBoost;
        camera.aspect = W / H;
        camera.up.set(Math.sin(cameraRoll), Math.cos(cameraRoll), 0);
        camera.position.set(
          pxParallax * lerp(0.08, 0.06, smoothstep(0, 0.08, tTunnel)) + Math.sin(tTunnel * Math.PI * 2.0) * 0.035 * vortexEnvelope,
          pyParallax * lerp(0.06, 0.05, smoothstep(0, 0.08, tTunnel)) + Math.cos(tTunnel * Math.PI * 2.0) * 0.024 * vortexEnvelope,
          5.2 - (reducedMotion ? 0 : vortexDive * 0.14)
        );
        camera.lookAt(0, 0, 0);
        camera.updateProjectionMatrix();
        camera.updateMatrixWorld();
      }

      // Pin tablet cleanly once scroll reaches `emergenceStart` (`01 -> 03 -> 04`), while tracking natural
      // document scroll prior to `emergenceStart` (`sy < m.emergenceStart`) so zero jump ever occurs!
      const effectiveTabScrollY = Math.min(sy, m.emergenceStart);
      const distToTabletPlane = Math.max(0.25, camera.position.z - TABLET_WORLD_Z);
      const halfFrustumH = distToTabletPlane * Math.tan((camera.fov * Math.PI) / 360);
      const halfFrustumW = halfFrustumH * (W / H);

      const inScreenCenterX = m.imgInLeft + m.imgInWidth * 0.5;
      const inScreenCenterY = m.imgInTop - effectiveTabScrollY + m.imgInHeight * 0.5;
      const ndcX = (inScreenCenterX / W) * 2 - 1;
      const ndcY = 1 - (inScreenCenterY / H) * 2;

      const restWorldX = camera.position.x + ndcX * halfFrustumW;
      const restWorldY = camera.position.y + ndcY * halfFrustumH;
      const restWorldWidth = (m.imgInWidth / W) * (2 * halfFrustumW);

      const portalMaskActive = inEmergencePhase && uEmergence < PORTAL_RELEASE_U;
      setPortalStencilMask(portalMaskedMaterials, portalMaskActive);

      if (portalMaskActive) {
        tablet3D.group.visible = true;
        const tabX = lerp(restWorldX, camera.position.x, kf.tabletPush);
        const tabY = lerp(restWorldY, camera.position.y, kf.tabletPush);
        const baseScale = restWorldWidth * kf.tabletScale;
        const aspectRatioCorr = (m.imgInHeight / Math.max(1, m.imgInWidth)) / 0.719;

        tablet3D.group.position.set(tabX, tabY, TABLET_WORLD_Z);
        tablet3D.group.rotation.set(
          kf.tabletRot[0] + pyParallax * 0.022,
          kf.tabletRot[1] - pxParallax * 0.028,
          kf.tabletRot[2]
        );
        tablet3D.group.scale.set(baseScale, baseScale * aspectRatioCorr, baseScale);
        tablet3D.shadowMat.uniforms.uOpacity.value = 1 - smoothstep(0.08, 0.28, uEmergence);

        // Pin & slide editorial text + turquoise ribbon clockwise (`-kf.tabletRot[2] = +2.51°` on screen,
        // parallel with the 3D tablet top/bottom edges in `03_t02.8s`!)
        const pinY = Math.max(0, sy - m.emergenceStart);
        const pushSlide = smoothstep(0.03, 0.24, uEmergence);
        const cssTiltRad = -kf.tabletRot[2];

        if (titleHeadingEl) {
          const ty = pinY - pushSlide * H * 0.24;
          titleHeadingEl.style.transform = `translate3d(0px, ${ty.toFixed(1)}px, 0)`;
          titleHeadingEl.style.opacity = m.isMobile
            ? String(1 - smoothstep(-90, -10, sy - m.emergenceStart))
            : String(1 - smoothstep(0.06, 0.16, uEmergence));
        }
        if (copyColEl) {
          const cxShift = pushSlide * W * (m.isMobile ? 0.14 : 0.145);
          const cyShift = pinY + pushSlide * H * 0.02;
          copyColEl.style.transform = `translate3d(${cxShift.toFixed(1)}px, ${cyShift.toFixed(
            1
          )}px, 0) rotate(${cssTiltRad.toFixed(4)}rad) scale(${(1 + pushSlide * 0.09).toFixed(3)})`;
          copyColEl.style.opacity = String(1 - smoothstep(0.24, 0.305, uEmergence));
        }
        if (ribbonSvgEl) {
          const rxShift = pushSlide * W * 0.12;
          ribbonSvgEl.style.transform = `translate3d(${rxShift.toFixed(1)}px, ${pinY.toFixed(
            1
          )}px, 0) rotate(${(cssTiltRad * 0.75).toFixed(4)}rad)`;
          ribbonSvgEl.style.opacity = String(1 - smoothstep(0.24, 0.305, uEmergence));
        }
      } else {
        tablet3D.group.visible = false;
        if (titleHeadingEl) {
          titleHeadingEl.style.transform = "";
          titleHeadingEl.style.opacity = sy < m.emergenceStart ? "1" : "0";
        }
        if (copyColEl) {
          copyColEl.style.transform = "";
          copyColEl.style.opacity = sy < m.emergenceStart ? "1" : "0";
        }
        if (ribbonSvgEl) {
          ribbonSvgEl.style.transform = "";
          ribbonSvgEl.style.opacity = sy < m.emergenceStart ? "1" : "0";
        }
      }

      // -----------------------------------------------------------------------
      // B. Backdrop & Downstream Apple Studio Display Chassis (`Frame 16`)
      // -----------------------------------------------------------------------
      const outCenterX = m.imgOutLeft + m.imgOutWidth * 0.5;
      const outBaseY =
        tShatter <= 0.001
          ? lerp(H * 0.5, H * 0.515, tOutPull)
          : lerp(H * 0.515, -m.imgOutHeight * 0.85, smoothstep(0.80, 0.94, tShatter));

      if (portalMaskActive) {
        backdropEl.style.opacity = "0";
      } else if (tOutPull > 0.02 && tWait <= 0.001) {
        // Deep indigo surroundings keep the break inside the same blue environment.
        const blueWall = smoothstep(0.14, 0.55, tOutPull) * (1 - smoothstep(0.78, 0.94, tShatter));
        const rCh = Math.round(10 * blueWall);
        const gCh = Math.round(16 * blueWall);
        const bCh = Math.round(74 * blueWall);
        backdropEl.style.opacity = "1";
        backdropEl.style.background = `rgb(${rCh}, ${gCh}, ${bCh})`;
      } else {
        // Pitch-black space across `Frames 05–15` AND throughout `#end-section` (`17 -> 19 -> 18`)!
        backdropEl.style.opacity = "1";
        backdropEl.style.background = "#000000";
      }

      if (tOutPull > 0.02 && tShatter < 0.94 && tWait <= 0.001) {
        const monScale = lerp(2.15, 1.0, smoothstep(0.0, 0.82, tOutPull));
        const monRot = lerp(-0.22, 0.0, smoothstep(0.0, 0.68, tOutPull));
        monitorBezelEl.style.display = "block";
        monitorBezelEl.style.width = `${m.imgOutWidth}px`;
        monitorBezelEl.style.height = `${m.imgOutHeight}px`;
        monitorBezelEl.style.opacity = String(1 - smoothstep(0.74, 0.91, tShatter));
        monitorBezelEl.style.transform = `translate3d(${outCenterX - m.imgOutWidth * 0.5}px, ${
          outBaseY - m.imgOutHeight * 0.5
        }px, 0) rotate(${monRot}rad) scale(${monScale})`;
      } else {
        monitorBezelEl.style.display = "none";
      }

      // -----------------------------------------------------------------------
      // C. "STEP INTO A NEW WORLD / AND LET YOUR / IMAGINATION RUN WILD" (`Frames 06–08`)
      //    Retain the existing spread/scale playhead, but cap the inter-word spread.
      //    Justifying every line to viewport width made the short middle line read
      //    as three disconnected labels. The source still has natural word groups.
      //    Late-stage motion amplitudes remain authored, not source measurements.
      // -----------------------------------------------------------------------
      if (inEmergencePhase && kf.titleOpacity > 0.006) {
        titleWrapEl.style.display = "flex";
        titleWrapEl.style.zIndex = uEmergence > 0.84 ? "6" : "16";
        titleWrapEl.style.opacity = String(kf.titleOpacity);
        titleWrapEl.style.transform = `translate3d(-50%, -50%, 0) scale(${kf.titleScale.toFixed(4)})`;

        // Target full-width justified span on each line (`91.2vw` divided by `titleScale` so visual outer margin stays ~4.4%!)
        const targetVisualWidth = W * (m.isMobile ? 0.92 : 0.912);
        const targetUnscaledWidth = targetVisualWidth / Math.max(0.5, kf.titleScale);

        for (let i = 0; i < m.lineWordCounts.length; i++) {
          const lineEl = titleLineRefs.current[i];
          if (!lineEl) continue;
          const kWords = m.lineWordCounts[i];
          const baseW = m.lineBaseWidths[i];
          const maxExtraPerGap =
            kWords > 1 ? Math.min(m.baseWordGapPx * 0.65, Math.max(0, (targetUnscaledWidth - baseW) / (kWords - 1))) : 0;
          const gapPx = m.baseWordGapPx + kf.titleSpread * maxExtraPerGap;
          lineEl.style.columnGap = `${gapPx.toFixed(2)}px`;
          lineEl.style.letterSpacing = `${kf.titleLetterSpacingEm.toFixed(4)}em`;
        }
      } else {
        titleWrapEl.style.display = "none";
      }

      // -----------------------------------------------------------------------
      // D. Earth Limb, Open-Space Halo, Chromatic Lens-Ring Flare, & Downstream Worlds
      // -----------------------------------------------------------------------
      const earthVis = inEmergencePhase ? kf.earthOpacity : 0;
      earthSystem.group.visible = earthVis > 0.004;

      // Keep orbital lighting unchanged. The captured shaft suit is in shadow, not
      // studio-lit; blend that exposure into the bright blue corridor and CTA instead
      // of switching fill lights abruptly at tTunnel=.80 / tWait=.001.
      if (inEmergencePhase) {
        sunKeyLight.intensity = 2.15;
        sunRimKicker.intensity = 1.35;
        spaceAmbient.intensity = 0.055;
        softFrontFill.intensity = 0.34;
        earthshineFill.intensity = 0.20 + earthVis * 0.24;
      } else {
        const shaftLight = smoothstep(0.065, 0.135, tTunnel) * (1 - smoothstep(0.80, 0.85, tTunnel));
        const corridorLight = smoothstep(0.80, 0.85, tTunnel);
        const studioLight = smoothstep(0.85, 1.0, tShatter);
        sunKeyLight.intensity = lerp(2.15, 0.32, shaftLight);
        sunRimKicker.intensity = lerp(1.35, 0.24, shaftLight);
        spaceAmbient.intensity = lerp(lerp(lerp(0.055, 0.03, shaftLight), 0.62, corridorLight), 0.42, studioLight);
        softFrontFill.intensity = lerp(lerp(lerp(0.34, 0.10, shaftLight), 1.25, corridorLight), 1.05, studioLight);
        earthshineFill.intensity = lerp(lerp(lerp(0.20, 0.05, shaftLight), 0.95, corridorLight), 0.36, studioLight);
      }

      if (earthSystem.group.visible) {
        earthSystem.earthMat.uniforms.uOpacity.value = earthVis;
        earthSystem.earthMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
        earthSystem.atmoMat.uniforms.uOpacity.value = earthVis;
        earthSystem.sunGlareMat.uniforms.uOpacity.value = earthVis * 0.95;

        const portalTrack = 1 - kf.tabletPush;
        earthSystem.group.position.set(
          portalTrack * restWorldX * 0.90 - (1 - portalTrack) * 0.35,
          portalTrack * restWorldY * 0.90 - smoothstep(0.16, 0.36, uEmergence) * 2.35,
          0
        );
      }

      const haloVis = inEmergencePhase ? kf.haloOpacity : 0;
      optics.spaceHaloMesh.visible = haloVis > 0.005;
      if (optics.spaceHaloMesh.visible) {
        optics.spaceHaloMat.uniforms.uOpacity.value = haloVis;
      }

      // Source-driven open spectral arcs during emergence only, never a filled tunnel halo.
      const ringVis = inEmergencePhase ? Math.max(kf.ringFlare * 0.50, kf.sunFlare * 0.12) : 0;
      optics.chromaticRingMesh.visible = ringVis > 0.002;
      if (optics.chromaticRingMesh.visible) {
        optics.chromaticRingMat.uniforms.uResolution.value.set(glRenderer.domElement.width,glRenderer.domElement.height);
        optics.chromaticRingMat.uniforms.uOpacity.value = ringVis;
        optics.chromaticRingMat.uniforms.uAspect.value = W / H;
        optics.chromaticRingMat.uniforms.uFocalScale.value = solarFocalScale(camera.fov);
        // Height-normalized shader coordinates: fit the two arcs to portrait width too.
        optics.chromaticRingMat.uniforms.uRadius.value = m.isMobile ? Math.min(0.64, 0.45 * W / H) : 0.72;
        optics.chromaticRingMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
      }

      // 1. Downstream Instanced GPU-Twisted Architectural Truss & Vortex (`Frames 09 -> 14`)
      const blackIn = !inEmergencePhase ? smoothstep(0.065, 0.135, tTunnel) : 0;
      const blackOut = 1 - smoothstep(0.80, 0.845, tTunnel);
      const blackVis = blackIn * blackOut;
      glazing.update(tTunnel, blackVis, reducedMotion);

      // Seamless white-lavender portal flash bridging `Frame 14 -> Frame 15` (`tTunnel ~ 0.82`)
      const portalFlash =
        !inEmergencePhase
          ? smoothstep(0.785, 0.822, tTunnel) * (1 - smoothstep(0.822, 0.865, tTunnel))
          : 0;
      // The veil outlives the opaque shaft. Hiding its parent at blackOut's endpoint
      // used to cut a still-bright transition flash off halfway through its fade.
      trussSystem.group.visible = blackVis > 0.005 || portalFlash > 0.001;
      trussSystem.flashVeilMat.uniforms.uFlash.value = portalFlash;
      if (trussSystem.group.visible) {
        const uPhase = clamp01((tTunnel - 0.10) / 0.68);
        const twistAmt = reducedMotion
          ? smoothstep(0.42, 0.76, tTunnel) * 0.23
          : smoothstep(0.40, 0.58, tTunnel) * 0.18 + smoothstep(0.60, 0.76, tTunnel) * 0.34;
        const vortexPinch = smoothstep(0.56, 0.75, tTunnel);
        const vortexStructureFade = 1 - 0.13 * smoothstep(0.54, 0.70, tTunnel) * (1 - smoothstep(0.78, 0.85, tTunnel));
        trussSystem.tunnelMaterial.uniforms.uOpacity.value = blackVis * vortexStructureFade;
        trussSystem.tunnelMaterial.uniforms.uPhase.value = uPhase;
        trussSystem.tunnelMaterial.uniforms.uTwist.value = twistAmt;
        trussSystem.tunnelMaterial.uniforms.uVortexPinch.value = vortexPinch;
        trussSystem.tunnelMaterial.uniforms.uTravelZ.value = acceleratedFall(tTunnel) * 44;
        const pinkVortexGlow = smoothstep(0.49, 0.69, tTunnel);
        const vortexPulse = 0.94 + 0.06 * Math.sin(tTunnel * Math.PI * 14);
        const vortexIntensity = pinkVortexGlow * blackVis * vortexPulse;
        trussSystem.vortexCoreMat.uniforms.uMode.value = smoothstep(0.53, 0.68, tTunnel);
        trussSystem.vortexCoreMat.uniforms.uIntensity.value = vortexIntensity;
        vortexGlass.update(tTunnel, vortexIntensity, reducedMotion);
        if (bloomPass) {
          bloomPass.strength = lerp(0.14, 0.28, smoothstep(0.66, 0.75, tTunnel));
        }
      } else {
        vortexGlass.update(tTunnel, 0, reducedMotion);
        if (bloomPass) bloomPass.strength = 0.16;
      }

      // 2. Downstream Royal-Blue Arch & White-Ring Corridor (`Frames 15 & 16`)
      const whiteIn = !inEmergencePhase ? smoothstep(0.815, 0.85, tTunnel) : 0;
      const whiteOut = 1 - smoothstep(0.86, 0.96, tShatter);
      const whiteVis = whiteIn * whiteOut * (tWait > 0.001 ? 0 : 1);
      blueCorridor.group.visible = whiteVis > 0.008;
      const clipToMonitor = blueCorridor.group.visible && tOutPull > 0.02;
      blueCorridor.setMonitorClip(clipToMonitor);
      blueCorridor.monitorStencilMask.visible = clipToMonitor;

      // One camera-space aperture for both the stencil and the glass burst. Account for
      // camera banking, CSS monitor rotation, aspect ratio and the actual inner border.
      const monScale = lerp(2.15, 1.0, smoothstep(0.0, 0.82, tOutPull));
      const monRot = lerp(-0.22, 0.0, smoothstep(0.0, 0.68, tOutPull));
      const borderPx = W < 640 ? 14 : 22;
      const screenWorldH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
      const monWorldW = Math.max(10, m.imgOutWidth - borderPx * 2) * monScale / H * screenWorldH;
      const monWorldH = Math.max(10, m.imgOutHeight - borderPx * 2) * monScale / H * screenWorldH;
      _monitorCenter.set(
        (outCenterX / W * 2 - 1) * screenWorldH * camera.aspect / 2,
        (1 - outBaseY / H * 2) * screenWorldH / 2,
        -camera.position.z
      ).applyMatrix4(camera.matrixWorld);
      _screenRotation.setFromAxisAngle(_zAxis, -monRot);
      _monitorRotation.copy(camera.quaternion).multiply(_screenRotation);

      if (blueCorridor.group.visible) {
        const distance = blueFlightDistance(tTunnel, tShatter);
        blueCorridor.travelGroup.position.z = distance;
        blueCorridor.wallTexture.offset.y = reducedMotion ? 0 : -distance / 22 * 0.42;
        if (clipToMonitor) {
          blueCorridor.monitorStencilMask.position.copy(_monitorCenter);
          blueCorridor.monitorStencilMask.quaternion.copy(_monitorRotation);
          blueCorridor.monitorStencilMask.scale.set(monWorldW, monWorldH, 1);
        }

        const monShrink =
          tOutPull > 0.01 ? lerp(1.0, m.isMobile ? 0.62 : 0.84, smoothstep(0.0, 0.82, tOutPull)) : 1.0;
        const tunnelShiftY =
          tOutPull > 0.01 ? ((H * 0.5 - outBaseY) / H) * 4.3 : 0;
        blueCorridor.group.scale.set(monShrink * (m.isMobile ? 0.90 : 1.08), monShrink * 0.95, monShrink);
        blueCorridor.group.position.set(0, tunnelShiftY, -2.2 * smoothstep(0.0, 0.08, tOutPull));
        blueCorridor.endGlowMat.uniforms.uOpacity.value = whiteVis;
      }

      // 3. Authentic Plate-Glass Shatter Burst (`Frame 16`)
      if (shardsMesh) {
        const shardVis = smoothstep(0.18, 0.205, tShatter) * (1 - smoothstep(0.34, 0.42, tShatter)) * (tWait > 0.001 ? 0 : 1);
        shardsMesh.visible = shardVis > 0.005;
        if (shardEdgesMesh) shardEdgesMesh.visible = shardsMesh.visible;
        if (shardsMesh.visible) {
          const mat = shardsMesh.material as THREE.ShaderMaterial;
          mat.uniforms.uOpacity.value = shardVis;
          mat.uniforms.uRefractionStrength.value = 1.55 + shardVis * 0.65;

          // The 946 captured rigid-body trajectories remain intact; only the
          // playback window is compressed to a sub-second glass impact.
          const burst = acceleratedFall(clamp01((tShatter - 0.205) / 0.145));
          const { sampleFrame, texFrame, texOrient, framesPerShard } = shardsMesh.userData;
          sampleFrame(clamp01(burst) * (framesPerShard - 1));
          const bounds = shardsMesh.userData.restBounds as THREE.Box3;
          const scaleX = monWorldW / (bounds.max.x - bounds.min.x);
          const scaleY = monWorldH / (bounds.max.y - bounds.min.y);
          shardsMesh.position.copy(_monitorCenter);
          shardsMesh.quaternion.copy(_monitorRotation);
          shardsMesh.scale.set(scaleX, scaleY, Math.min(scaleX, scaleY));
          if (shardEdgesMesh) {
            shardEdgesMesh.position.copy(shardsMesh.position);
            shardEdgesMesh.quaternion.copy(shardsMesh.quaternion);
            shardEdgesMesh.scale.copy(shardsMesh.scale);
          }
          texFrame.needsUpdate = true;
          texOrient.needsUpdate = true;
        }
      }

      // Audio receives the SAME evaluated coordinates/visibility as this render.
      // No sources/filters are allocated here; the engine coalesces control work.
      audioJourney.update({
        active: true, title: sy < m.emergenceStart, emergence: inEmergencePhase,
        tunnel: tTunnel, drop: tShatter, wait: tWait,
        fractureVisible: Boolean(shardsMesh?.visible),
        paused: playbackState === "paused" || blockedByChrome() || !docVisible,
      });

      // 4. Faceted Glass Diamonds + Star Flares + 18 Die-Cut Pop-Art Stickers (`Frames 17–20`)
      const waitVis = smoothstep(0.92, 0.99, tShatter);
      endDecor.group.visible = waitVis > 0.01;
      if (endDecor.group.visible) {
        endDecor.update(elapsedSec, tWait * 0.85, Boolean(reducedMotion), pxParallax, pyParallax);
      }

      // -----------------------------------------------------------------------
      // E. Licensed Rigged Astronaut Choreography + Visor Reflection + LED Emoticon
      // -----------------------------------------------------------------------
      if (mainAstro) {
        let jointPose: SuitJointPose;
        let ax = 0;
        let ay = 0;
        let az = 1.4;
        let aScale = 1.0;
        let rx = 0;
        let ry = 0;
        let rz = 0;
        let visorFlareAmt = 0;
        let ledVisorOpacity = 0;
        let ledVisorSmile = 1;

        // Crossfade curved Earth cloud reflection inside visor (`detail_01`: 1.0 -> `detail_04/05`: 0.0!)
        mainAstro.visorEarthUniform.value = earthVis;

        if (inEmergencePhase) {
          jointPose = evaluateSuitPoseStage(kf.poseStage);

          const baseAstroPos = m.isMobile ? kf.astroPosMobile : kf.astroPosDesktop;
          const portalFollow = 1 - kf.tabletPush;
          const restScaleFactor = clamp01(restWorldWidth * 0.78);

          ax = lerp(baseAstroPos[0], restWorldX + baseAstroPos[0] * restScaleFactor, portalFollow);
          ay = lerp(
            baseAstroPos[1],
            restWorldY + baseAstroPos[1] * restScaleFactor * 0.85,
            portalFollow
          );
          az = lerp(baseAstroPos[2], TABLET_WORLD_Z - 0.52, portalFollow);
          aScale = lerp(kf.astroScale, Math.max(0.32, restScaleFactor * 0.74), portalFollow);

          // Whole-body zero-g sinusoidal drift (strictly zero under reducedMotion or inside resting tablet)
          const driftAmp = reducedMotion || portalFollow > 0.05 ? 0 : 1 - smoothstep(0.94, 1, uEmergence);
          const zeroGRoll = Math.sin(elapsedSec * 0.55) * 0.022 * driftAmp;
          const zeroGPitch = Math.cos(elapsedSec * 0.42) * 0.018 * driftAmp;
          const zeroGYaw = Math.sin(elapsedSec * 0.37) * 0.028 * driftAmp;

          rx = kf.astroRot[0] + zeroGPitch - pyParallax * 0.045;
          ry = kf.astroRot[1] + zeroGYaw + pxParallax * 0.065;
          rz = kf.astroRot[2] + zeroGRoll;
          ay += Math.sin(elapsedSec * 0.65) * 0.014 * driftAmp;

          visorFlareAmt = kf.sunFlare;
        } else if (tOutPull <= 0.001) {
          // Downstream Tunnel Flight (`Frames 09 -> 15`):
          // - `09` (`tTunnel ~ 0.036`): tiny rear T-pose at `(0, 0)` inside rainbow halo
          // - `10..13` (`tTunnel ~ 0.14..0.64`): curled & inverted zero-G tumble down truss shaft
          // - `14` (`tTunnel ~ 0.75`): pulled deep into glowing pink-white vortex core
          // - `15` (`tTunnel ~ 0.93`): crisp front-facing head-on dive down royal-blue arch corridor!
          const inBlueDive = smoothstep(0.81, 0.86, tTunnel);
          const intoCurl = smoothstep(0.08, 0.16, tTunnel);
          const midInvert =
            smoothstep(0.24, 0.31, tTunnel) * (1 - smoothstep(0.34, 0.40, tTunnel));
          const vortexShrink = smoothstep(0.64, 0.77, tTunnel) * (1 - inBlueDive);

          const trussPose = blendSuitPose(
            blendSuitPose(SUIT_POSE_TUMBLE_SPREAD, SUIT_POSE_TUMBLE_CURL, intoCurl),
            SUIT_POSE_TUMBLE_SPREAD,
            midInvert
          );
          jointPose = blendSuitPose(trussPose, SUIT_POSE_CORRIDOR_FLY, inBlueDive);

          const entry = smoothstep(0.0, 0.08, tTunnel);
          const entryPos = m.isMobile ? kf.astroPosMobile : kf.astroPosDesktop;
          ax = lerp(entryPos[0], lerp(0.0, 0.04, inBlueDive), entry);
          ay = lerp(entryPos[1], lerp(0.0, -0.02, inBlueDive), entry);
          az = lerp(entryPos[2], lerp(-1.12 - vortexShrink * 4.2, -3.75, inBlueDive), entry);

          // Flight-axis gravity adds increasing descent/depth through the shaft, then blends
          // into the authored blue-flight pose; never introduce another playhead.
          const descent = acceleratedFall(clamp01((tTunnel - 0.06) / 0.64)) * (1 - inBlueDive);
          ay -= descent * 0.34;
          az -= descent * 1.42;
          const trussRy = lerp(Math.PI, Math.PI * 1.45, intoCurl);
          const trussRz = intoCurl * (-1.15 - tTunnel * 3.1);
          const vortexSpiral = smoothstep(0.42, 0.78, tTunnel) * (1 - inBlueDive);
          const vortexAngle = ((tTunnel - 0.42) / 0.36) * Math.PI * 2.0;
          const vortexRadius = lerp(0.92, 0.035, smoothstep(0.42, 0.78, tTunnel));
          ax += Math.cos(vortexAngle) * vortexRadius * vortexSpiral;
          ay += Math.sin(vortexAngle) * vortexRadius * 0.62 * vortexSpiral;
          rx = lerp(kf.astroRot[0] - pyParallax * 0.045, lerp(0.18, 0.24, inBlueDive), entry)
            + Math.sin(vortexAngle * 0.5) * 0.24 * vortexSpiral;
          ry = lerp(kf.astroRot[1] + pxParallax * 0.065, lerp(trussRy, Math.PI * 2 + 0.14, inBlueDive), entry)
            + vortexSpiral * 0.34;
          rz = lerp(kf.astroRot[2], lerp(trussRz, -Math.PI * 2 - 0.28, inBlueDive), entry)
            - vortexSpiral * Math.PI * 0.78;
          aScale = lerp(kf.astroScale, lerp(
            lerp(0.62, 0.58, intoCurl) * (1 - vortexShrink * 0.60),
            0.38,
            inBlueDive
          ), entry);
          visorFlareAmt = 0;
        } else if (sy <= m.endTop) {
          // `Frame 16` (`16-monitor-glass-shatter`) -> `Frame 17` (`17-astronaut-stickers-wait`):
          // Astronaut bursts forward through the Studio Display screen with BOTH ARMS RAISED
          // (`SUIT_POSE_SHATTER_BREAK`) and settles smoothly into visor salute (`SUIT_POSE_VISOR_SALUTE`)!
          const burst = smoothstep(0.08, 0.28, tShatter);
          const settleSalute = smoothstep(0.70, 0.90, tShatter);
          jointPose = blendSuitPose(
            blendSuitPose(SUIT_POSE_CORRIDOR_FLY, SUIT_POSE_SHATTER_BREAK, burst),
            SUIT_POSE_VISOR_SALUTE,
            settleSalute
          );
          ax = lerp(0.04, pxParallax * 0.05, burst);
          const gravityDrop = acceleratedFall(clamp01((tShatter-0.08)/0.40));
          ay = lerp(-0.02,m.isMobile ? -0.22 : -0.40,gravityDrop);
          az = lerp(-3.75, m.isMobile ? 0.68 : 1.72, burst);
          az = lerp(az, m.isMobile ? 1.24 : 2.66, settleSalute);
          rx = lerp(0.24, -pyParallax * 0.04, burst);
          ry = lerp(0.14, pxParallax * 0.07, burst);
          rz = lerp(-0.28, 0.0, burst);
          aScale = lerp(0.38, 1.0, burst);
        } else {
          // `#end-section` & `#footer-section` White Wipe (`Frames 17 -> 18 -> 19 -> 20`):
          // Exact Lusion medium-full portrait framing (`az = 2.66, ay = -0.32`), curved LED dot-matrix
          // smiley visor, right-arm wave on `"Let's work / together!"` (`19`), and calm idle (`20`)!
          const waveOsc = reducedMotion ? 0.35 : Math.sin(elapsedSec * 4.2 + tWait * 8.0);
          const waveIn = smoothstep(0.18, 0.34, tWait);
          const waveOut = smoothstep(0.62, 0.80, tWait);
          const wavePose = evaluateSuitWavePose(waveOsc);

          jointPose = blendSuitPose(
            blendSuitPose(SUIT_POSE_VISOR_SALUTE, wavePose, waveIn),
            SUIT_POSE_CTA_RELAXED,
            waveOut
          );

          ax = pxParallax * 0.05;
          ay = (m.isMobile ? -0.18 : -0.32) + (reducedMotion ? 0 : Math.sin(elapsedSec * 1.1) * 0.018 * smoothstep(0.0, 0.04, tWait));
          az = m.isMobile ? 1.24 : 2.66;
          rx = -pyParallax * 0.04;
          ry = pxParallax * 0.07 + (reducedMotion ? 0 : Math.sin(elapsedSec * 0.65) * 0.035 * smoothstep(0.0, 0.04, tWait));
          rz = 0;
          aScale = 1.0;

          ledVisorOpacity = smoothstep(0.13, 0.24, tWait);
          ledVisorSmile = smoothstep(0.22, 0.36, tWait);
        }

        if (!reducedMotion && inEmergencePhase && uEmergence > 0.32) {
          jointPose = {
            ...jointPose,
            wristR: [
              jointPose.wristR[0] + Math.sin(elapsedSec * 0.9) * 0.032,
              jointPose.wristR[1],
              jointPose.wristR[2],
            ],
            wristL: [
              jointPose.wristL[0] + Math.cos(elapsedSec * 0.85) * 0.032,
              jointPose.wristL[1],
              jointPose.wristL[2],
            ],
          };
        }

        if (!inEmergencePhase && !reducedMotion) {
          const blueDrift = smoothstep(0.85, 0.98, tTunnel) * (1 - smoothstep(0.14, 0.62, tShatter));
          az += blueDrift * 0.28;
          ay += Math.sin(blueDrift * Math.PI * 2) * 0.025;
          rx += Math.sin(blueDrift * Math.PI * 2) * 0.035;
        }
        applySuitJointPose(mainAstro, jointPose);
        // Captured parts have deformation palettes, not the legacy GLB's named joints.
        // Sample all clips from the shared virtual coordinate, never a competing animation mixer.
        const bakedFrame = tWait > 0
          ? lerp(139, 287, tWait)
          : tShatter > 0
            ? lerp(89, 139, smoothstep(0.0, 0.74, tShatter))
            : 89 * clamp01((sy - m.tunnelStart) / Math.max(1, shatterStart - m.tunnelStart));
        mainAstro.sampleBakedPose?.(bakedFrame, inEmergencePhase ? 0 : smoothstep(0, 0.08, tTunnel));
        if (window.__goalAstronautTelemetry) {
          window.__goalAstronautTelemetry.sceneState.bakedFrame = bakedFrame;
        }
        if (mainAstro.sampleBakedPose) visorLed.mesh.position.copy(mainAstro.visorAnchorLocal);
        mainAstro.root.position.set(ax, ay, az);
        mainAstro.root.rotation.set(rx, ry, rz);
        if (!inEmergencePhase && mainAstro.sampleCapturedRoot) {
          // Source root attitude, not a second Euler tumble on top of the bone palette.
          // Phase mapping/basis are calibrated to our camera; the source timing is not available.
          mainAstro.sampleCapturedRoot("in",clamp01(tTunnel/0.80)*99,_rootPosition,_rootOrientation);
          _rootOrientation.multiply(_invertedBasis);
          const blue = smoothstep(0.80,0.86,tTunnel);
          if (blue > 0) {
            const flightFrame = lerp(0,36,smoothstep(0.815,1,tTunnel));
            const frame = lerp(flightFrame,99,smoothstep(0,0.74,tShatter));
            mainAstro.sampleCapturedRoot("out",frame,_outPosition,_outOrientation);
            _rootOrientation.slerp(_outOrientation,blue);
            _rootPosition.lerp(_outPosition,blue);
          }
          const weight = smoothstep(0.04,0.12,tTunnel) * (1-smoothstep(0.78,0.95,tShatter)) * (1-smoothstep(0,0.02,tWait));
          mainAstro.root.quaternion.slerp(_rootOrientation,weight);
          mainAstro.root.position.x += _rootPosition.x * 0.8 * weight;
          mainAstro.root.position.y += _rootPosition.y * 0.18 * weight;
        }
        mainAstro.root.scale.setScalar(aScale);
        mainAstro.root.updateMatrixWorld(true);

        // Curved Visor LED Emoticon Matrix (`Frames 18–20`)
        if (ledVisorOpacity > 0.005) {
          visorLed.mesh.visible = true;
          visorLed.material.uniforms.uOpacity.value = ledVisorOpacity;
          visorLed.material.uniforms.uSmile.value = ledVisorSmile;
          const blinkCycle = reducedMotion ? 0 : (elapsedSec % 3.8);
          visorLed.material.uniforms.uBlink.value =
            blinkCycle > 3.55 ? Math.sin(((blinkCycle - 3.55) / 0.25) * Math.PI) : 0;
        } else {
          visorLed.mesh.visible = false;
        }

        if (visorFlareAmt > 0.004 && mainAstro.bones.Head) {
          optics.visorFlareMesh.visible = true;
          _headWorld.copy(mainAstro.visorAnchorLocal);
          mainAstro.bones.Head.localToWorld(_headWorld);
          optics.visorFlareMesh.position.copy(_headWorld);
          optics.visorFlareMesh.quaternion.copy(camera.quaternion);
          optics.visorFlareMesh.scale.setScalar(aScale * (m.isMobile ? 0.88 : 1.05));
          optics.visorFlareMat.uniforms.uIntensity.value = visorFlareAmt;
        } else {
          optics.visorFlareMesh.visible = false;
        }

        // Translucent Emerald-Cyan Holographic Echo Astronauts strictly during `Frame 13` (`0.47..0.64`)!
        const echoOpacity =
          !inEmergencePhase && tOutPull <= 0.001
            ? smoothstep(0.47, 0.52, tTunnel) * (1 - smoothstep(0.59, 0.65, tTunnel))
            : 0;
        const clonesActive = echoOpacity > 0.01;
        hologramEchoMat.uniforms.uOpacity.value = echoOpacity * 0.72;
        for (let c = 0; c < clones.length; c++) {
          const cl = clones[c];
          cl.root.visible = clonesActive;
          if (clonesActive) {
            cl.sampleBakedPose?.(bakedFrame, 1);
            const spiralA = tTunnel * 18.0 + c * 2.094;
            cl.root.position.set(
              Math.cos(spiralA) * (1.05 + c * 0.24),
              Math.sin(spiralA) * (0.78 + c * 0.18),
              -2.2 - c * 1.85
            );
            cl.root.rotation.set(0.55 + c * 0.35, spiralA * 0.4, rz + c * 0.85);
            cl.root.scale.setScalar(0.56 - c * 0.05);
          }
        }
      } else {
        optics.visorFlareMesh.visible = false;
        visorLed.mesh.visible = false;
      }

      // Evaluate after the current bone/root matrices: no stale silhouette or one-frame flare lag.
      if (optics.chromaticRingMesh.visible) {
        sunKeyLight.getWorldPosition(_sunWorld);
        _sunView.copy(_sunWorld).sub(camera.position);
        camera.getWorldDirection(_cameraForward);
        const facing = _sunView.dot(_cameraForward) / Math.max(1e-5, _sunView.length());
        _sunClip.copy(_sunWorld).project(camera);
        let visible = 1;
        if (mainAstro) {
          if (mainAstro.bones.Head) {
            _solarBlocker.copy(mainAstro.visorAnchorLocal);
            mainAstro.bones.Head.localToWorld(_solarBlocker);
            visible *= solarOcclusion(camera.position, _sunWorld, _solarBlocker, mainAstro.root.scale.x * 0.19);
          }
          _solarBlocker.set(0, -0.22, 0);
          mainAstro.root.localToWorld(_solarBlocker);
          visible *= solarOcclusion(camera.position, _sunWorld, _solarBlocker, mainAstro.root.scale.x * 0.31);
        }
        if (earthSystem.group.visible) {
          earthSystem.group.children[0].getWorldPosition(_solarBlocker);
          visible *= solarOcclusion(camera.position, _sunWorld, _solarBlocker, 5.5);
        }
        const uv = optics.chromaticRingMat.uniforms.uSource.value as THREE.Vector2;
        uv.set(_sunClip.x * 0.5 + 0.5, _sunClip.y * 0.5 + 0.5);
        optics.chromaticRingMat.uniforms.uVisibility.value = solarAcceptance(uv.x, uv.y, facing, visible, W / H);
        if (window.__goalAstronautTelemetry) {
          const solar = window.__goalAstronautTelemetry.solar;
          solar.x = uv.x; solar.y = uv.y; solar.facing = facing;
          solar.visibility = optics.chromaticRingMat.uniforms.uVisibility.value;
          solar.occlusion = visible;
          solar.focalScale = optics.chromaticRingMat.uniforms.uFocalScale.value;
        }
      }
      gpuTimer?.begin(inEmergencePhase ? "solar" : tShatter > 0.18 ? "shatter" : tShatter > 0 ? "glass" : tTunnel > 0.845 ? "blue" : "vortex");
      glRenderer.info.reset();
      let glassRefractionReady = false;
      if (shardsMesh?.visible && glassRefractionTarget) {
        const wasVisible = shardsMesh.visible;
        const wereEdgesVisible = shardEdgesMesh?.visible ?? false;
        const previousTarget = glRenderer.getRenderTarget();
        const previousToneMapping = glRenderer.toneMapping;
        const previousOutputColorSpace = glRenderer.outputColorSpace;
        const previousAutoClear = glRenderer.autoClear;
        const previousClearColor = glRenderer.getClearColor(new THREE.Color()).clone();
        const previousClearAlpha = glRenderer.getClearAlpha();
        try {
          shardsMesh.visible = false;
          if (shardEdgesMesh) shardEdgesMesh.visible = false;
          glRenderer.setRenderTarget(glassRefractionTarget);
          glRenderer.autoClear = true;
          glRenderer.toneMapping = THREE.NoToneMapping;
          glRenderer.outputColorSpace = THREE.LinearSRGBColorSpace;
          glRenderer.setClearColor(tOutPull > 0.02 && tShatter < 0.60 ? 0x0a104a : 0x000000, 1);
          glRenderer.clear(true, true, true);
          glRenderer.render(scene, camera);
          glassRefractionReady = true;
          const shardMaterial = shardsMesh.material as THREE.ShaderMaterial;
          shardMaterial.uniforms.uSceneColor.value = glassRefractionTarget.texture;
          shardMaterial.uniforms.uRefractionSize.value.set(glassRefractionTarget.width, glassRefractionTarget.height);
        } catch {
          glassRefractionReady = false;
        } finally {
          glRenderer.setRenderTarget(previousTarget);
          glRenderer.toneMapping = previousToneMapping;
          glRenderer.outputColorSpace = previousOutputColorSpace;
          glRenderer.autoClear = previousAutoClear;
          glRenderer.setClearColor(previousClearColor, previousClearAlpha);
          shardsMesh.visible = wasVisible;
          if (shardEdgesMesh) shardEdgesMesh.visible = wereEdgesVisible;
        }
      }
      if (composer) {
        composer.render(1 / 60);
      } else {
        glRenderer.render(scene, camera);
      }

      gpuTimer?.end();
      const dtMs = performance.now() - t0;
      if (window.__goalAstronautTelemetry) {
        window.__goalAstronautTelemetry.renderCount++;
        const resources = window.__goalAstronautTelemetry.resources;
        resources.geometries = glRenderer.info.memory.geometries;
        resources.textures = glRenderer.info.memory.textures;
        resources.programs = glRenderer.info.programs?.length ?? 0;
        window.__goalAstronautTelemetry.drawCalls = glRenderer.info.render.calls;
        window.__goalAstronautTelemetry.triangles = glRenderer.info.render.triangles;
        window.__goalAstronautTelemetry.lastFrameMs = +dtMs.toFixed(2);
        window.__goalAstronautTelemetry.emergenceProgress = +uEmergence.toFixed(4);
        window.__goalAstronautTelemetry.portalStencilActive = portalMaskActive;
        const state = window.__goalAstronautTelemetry.sceneState;
        state.tunnelProgress = tTunnel;
        state.shatterProgress = tShatter;
        state.waitProgress = tWait;
        mainAstro?.root.matrixWorld.toArray(state.astronautMatrix);
        camera.matrixWorld.toArray(state.cameraMatrix);
        state.trussLoaded = trussSystem.group.children.some(
          (child) => child.name === "CapturedInnerLattice" || child.name === "CapturedOuterLattice"
        );
        state.shardsLoaded = shardsMesh !== null;
        state.shardSidewallsLoaded = shardEdgesMesh !== null;
        state.shardSidewallTriangles = shardEdgesMesh
          ? Math.floor(shardEdgesMesh.geometry.getAttribute("position").count / 3) : 0;
        state.vortexGlassVisible = vortexGlass.group.visible;
        state.vortexGlassLayers = vortexGlass.layers;
        state.vortexGlassEdges = vortexGlass.edges;
        state.portalFlash = portalFlash;
        state.flashVisible = trussSystem.group.visible && portalFlash > 0.001;
        state.corridorTravel = blueCorridor.group.visible ? blueCorridor.travelGroup.position.z : 0;
        state.glazingLayers = glazing.group.visible ? glazing.group.children.length : 0;
        state.glassOpacity = shardsMesh?.visible ? (shardsMesh.material as THREE.ShaderMaterial).uniforms.uOpacity.value : 0;
        state.glassRefractionReady = glassRefractionReady;
        state.shardDepthWrite = shardsMesh ? (shardsMesh.material as THREE.ShaderMaterial).depthWrite : false;
        state.shardSpread = shardsMesh ? (shardsMesh.userData.shardSpread as number) : 1.14;
        state.shardCount = numShards;
        state.shardFrames = framesPerShard;
        state.vortexIntensity = trussSystem.vortexCoreMat.uniforms.uIntensity.value;
        state.ringVisible = optics.chromaticRingMesh.visible;
      }
      if (window.__goalPipelineProbe) {
        window.__goalPipelineProbe(glRenderer, {
          authoredAt: frameClock, sceneStartedAt: t0, submittedAt: performance.now(),
          virtualScroll: sy, glassMatrix: shardsMesh ? Array.from(shardsMesh.matrixWorld.elements) : null,
          blueMatrix: Array.from(blueCorridor.travelGroup.matrixWorld.elements),
        });
      }
    };

    const tick = () => {
      if (!docVisible || unmounted || contextLost || window.__goalAstronautTelemetry?.fallbackVisible) {
        rafId = 0;
        return;
      }
      const now = performance.now();
      const elapsedSeconds = Math.max(0, (now - frameClock) * 0.001);
      const deltaSeconds = Math.min(0.25, elapsedSeconds); // Smoothing only, never the authored clock.
      frameClock = now;
      targetScrollY = window.scrollY;
      const resetAt = metrics ? metrics.emergenceStart - metrics.viewportH * 0.25 : 0;
      const returnedBeforeTablet = lastObservedScrollY >= resetAt && targetScrollY < resetAt;
      lastObservedScrollY = targetScrollY;
      if (metrics && playbackPath && !reducedMotion && window.__goalAstronautTelemetry?.glbLoaded && !window.__goalAstronautTelemetry.fallbackVisible) {
        const activation = playbackPath(0);
        if (playbackState === "completed" && returnedBeforeTablet) {
          playbackState = "armed";
          playbackProgress = 0;
        }
        if (playbackState === "armed" && targetScrollY >= activation - 1 && targetScrollY < metrics.endTop && !blockedByChrome()) {
          playbackTimeOrigin = (now - startClock) * 0.001 - cinematicTimeOffset;
          playbackState = "playing";
          playbackProgress = 0;
          playbackRuns++;
          scrollDriver()?.stop();
          if (controls) controls.hidden = false;
          if (pauseButton) { pauseButton.textContent = "Pause"; pauseButton.setAttribute("aria-label", "Pause cinematic"); }
        } else if (playing()) {
          const paused = userPaused || blockedByChrome();
          if (!paused && playbackState !== "paused") playbackProgress = advanceCinematicProgress(playbackProgress, elapsedSeconds);
          playbackState = paused ? "paused" : "playing";
        }
        if (playing()) {
          // Only this clock drives both scene pose and document placement during playback.
          scrollDriver()?.stop();
          targetScrollY = smoothScrollY = playbackPath(playbackProgress);
          syncDocument(targetScrollY);
          if (playbackProgress === 1) releasePlayback(true);
        }
      }
      if (window.__goalAstronautTelemetry) {
        const playback = window.__goalAstronautTelemetry.playback;
        playback.state = playbackState;
        playback.progress = playbackProgress;
        playback.virtualScroll = smoothScrollY;
        playback.runs = playbackRuns;
      }
      const vhNow = window.innerHeight;
      const inBand =
        metrics !== null &&
        targetScrollY + vhNow >= metrics.goalTop - vhNow * 0.55 &&
        targetScrollY <= metrics.endTop + metrics.endHeight + vhNow * 1.15;

      if (!inBand) {
        if (wasInBand) {
          renderSceneAtScroll(targetScrollY, (performance.now() - startClock) * 0.001);
          wasInBand = false;
        }
        rafId = 0;
        return;
      }
      wasInBand = true;

      const diff = targetScrollY - smoothScrollY;
      if (Math.abs(diff) > vhNow * 0.42 || reducedMotion) {
        smoothScrollY = targetScrollY;
      } else {
        smoothScrollY += diff * (1-Math.exp(-25*deltaSeconds));
        if (Math.abs(targetScrollY - smoothScrollY) < 0.12) {
          smoothScrollY = targetScrollY;
        }
      }

      if (playbackState !== "paused") {
        pointerSmooth.x += (pointerTarget.x - pointerSmooth.x) * (1-Math.exp(-4.7*deltaSeconds));
        pointerSmooth.y += (pointerTarget.y - pointerSmooth.y) * (1-Math.exp(-4.7*deltaSeconds));
      }

      renderSceneAtScroll(smoothScrollY, (performance.now() - startClock) * 0.001);

      if (playbackState === "paused" || (reducedMotion && smoothScrollY === targetScrollY && !playing())) {
        rafId = 0;
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!rafId && docVisible && !unmounted && !contextLost && !window.__goalAstronautTelemetry?.fallbackVisible) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    // Wake a sleeping paused frame only when overlay state changes. Reset the time
    // boundary so menu/modal time can never be charged on resume.
    const unsubscribeChrome = useStudioStore.subscribe((state, previous) => {
      if (state.menuOpen !== previous.menuOpen || state.reelOpen !== previous.reelOpen || state.isTransitioning !== previous.isTransitioning) {
        frameClock = performance.now();
        ensureLoop();
      }
    });
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      releasePlayback(false);
      audioJourney.release();
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = 0;
      gpuTimer?.dispose();
      const telemetry = window.__goalAstronautTelemetry;
      if (telemetry) {
        telemetry.glbError = "WebGL context lost; static experience is available";
        telemetry.fallbackVisible = true;
        telemetry.playback.state = "completed";
      }
      showStaticFallback();
      const y = goalEl.getBoundingClientRect().top + window.scrollY;
      targetScrollY = smoothScrollY = y;
      syncDocument(y);
      setActiveSurface("ice");
    };
    glRenderer.domElement.addEventListener("webglcontextlost", onContextLost);

    const onScroll = () => {
      targetScrollY = window.scrollY;
      ensureLoop();
    };

    const onPointerMove = (ev: PointerEvent) => {
      const w = Math.max(1, window.innerWidth);
      const h = Math.max(1, window.innerHeight);
      pointerTarget.x = Math.max(-1, Math.min(1, (ev.clientX / w) * 2 - 1));
      pointerTarget.y = Math.max(-1, Math.min(1, 1 - (ev.clientY / h) * 2));
      ensureLoop();
    };

    const onResize = () => {
      if (contextLost || window.__goalAstronautTelemetry?.fallbackVisible) return;
      measure();
      if (playing() && playbackPath) {
        targetScrollY = smoothScrollY = playbackPath(playbackProgress);
        syncDocument(targetScrollY);
      }
      renderSceneAtScroll(playing() ? smoothScrollY : window.scrollY, (performance.now() - startClock) * 0.001);
      ensureLoop();
    };

    const onVisibility = () => {
      docVisible = document.visibilityState === "visible";
      frameClock = performance.now(); // Do not charge hidden-tab time to the cinematic.
      ensureLoop();
    };

    const onPausePlayback = () => {
      if (!playing()) return;
      userPaused = !userPaused;
      if (pauseButton) {
        pauseButton.textContent = userPaused ? "Resume" : "Pause";
        pauseButton.setAttribute("aria-label", userPaused ? "Resume cinematic" : "Pause cinematic");
      }
      frameClock = performance.now();
      ensureLoop();
    };
    const onSkipPlayback = () => { releasePlayback(true); ensureLoop(); };
    const onScrollInput = (event: WheelEvent | TouchEvent) => {
      // Leave menus, browser zoom and interactive controls alone.
      if (event instanceof WheelEvent && event.ctrlKey) return;
      if ("touches" in event && event.touches.length > 1) return;
      if (playing() && !blockedByChrome()) event.preventDefault();
    };
    const onScrollKey = (event: KeyboardEvent) => {
      if (!playing() || blockedByChrome() || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.target instanceof Element && event.target.closest("button, a, input, textarea, select, [contenteditable]")) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) event.preventDefault();
    };
    const onNavigate = (event: MouseEvent) => {
      // Explicit anchor/navigation intent wins over the movie; no trapped links or route transitions.
      if (event.target instanceof Element && event.target.closest("a[href], [data-scroll-to], #header-right-talk-btn")) {
        releasePlayback(false);
        // Explicit navigation before entry must not be hijacked when smooth scrolling crosses the trigger.
        playbackState = "completed";
      }
    };
    const onHistoryNavigate = () => {
      releasePlayback(false);
      playbackState = "completed";
    };
    window.addEventListener("popstate", onHistoryNavigate);
    window.addEventListener("hashchange", onHistoryNavigate);
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = () => {
      reducedMotion = motionQuery.matches;
      if (reducedMotion) {
        pointerTarget.x = pointerTarget.y = pointerSmooth.x = pointerSmooth.y = 0;
        releasePlayback(true);
      }
      onResize(); // Preference changes also restore the full static inspection resolution.
    };
    pauseButton?.addEventListener("click", onPausePlayback);
    skipButton?.addEventListener("click", onSkipPlayback);
    window.addEventListener("wheel", onScrollInput, { passive: false });
    window.addEventListener("touchmove", onScrollInput, { passive: false });
    window.addEventListener("keydown", onScrollKey);
    document.addEventListener("click", onNavigate, true);
    motionQuery.addEventListener("change", onMotionChange);

    const ro = new ResizeObserver(() => {
      measure();
    });

    measure();
    ro.observe(goalEl);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    ensureLoop();

    return () => {
      audioJourney.release();
      releasePlayback(false);
      unmounted = true;
      unsubscribeChrome();
      glRenderer.domElement.removeEventListener("webglcontextlost", onContextLost);
      pauseButton?.removeEventListener("click", onPausePlayback);
      skipButton?.removeEventListener("click", onSkipPlayback);
      window.removeEventListener("wheel", onScrollInput);
      window.removeEventListener("touchmove", onScrollInput);
      window.removeEventListener("keydown", onScrollKey);
      document.removeEventListener("click", onNavigate, true);
      motionQuery.removeEventListener("change", onMotionChange);
      window.removeEventListener("popstate", onHistoryNavigate);
      window.removeEventListener("hashchange", onHistoryNavigate);
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);

      if (composer) {
        for (const pass of composer.passes) {
          pass.dispose?.();
        }
        composer.dispose();
      }
      for (const item of disposables) {
        item.dispose();
      }
      scene.clear();
      glRenderer.dispose();
      if (glRenderer.domElement.parentElement === hostEl) {
        hostEl.removeChild(glRenderer.domElement);
      }
      delete window.__goalAstronautTelemetry;
      if (window.__lusionInspector?.scrollManager === ownedScrollManager) {
        delete window.__lusionInspector?.scrollManager;
        delete window.__lusionInspector?.homeGoalSectionRanges;
      }
    };
  }, [setActiveSurface]);

  return (
    <section
      ref={goalRef}
      id="home-goal"
      aria-label="Our Goal"
      className="relative w-full bg-[#eff0f9] text-[#111319]"
    >
      <div
        ref={playbackControlsRef}
        hidden
        role="group"
        aria-label="Cinematic controls"
        className="fixed bottom-6 right-5 z-[45] rounded-full border border-white/20 bg-[#080d29]/85 px-2 text-xs text-white backdrop-blur-md sm:right-8"
      >
        <button ref={pausePlaybackRef} type="button" aria-label="Pause cinematic" className="min-h-11 min-w-16 rounded-full px-3 focus-visible:outline-2 focus-visible:outline-cyan-200">Pause</button>
        <button ref={skipPlaybackRef} type="button" aria-label="Skip cinematic" className="min-h-11 min-w-16 rounded-full px-3 focus-visible:outline-2 focus-visible:outline-cyan-200">Skip</button>
      </div>
      {/* =======================================================================
          Part A: Editorial Context Band + Left Tablet Portal Anchor (`#home-goal-image-in`)
          ======================================================================= */}
      <div
        id="home-goal-context"
        className="relative z-10 w-full overflow-x-clip bg-[#eff0f9] pt-24 pb-28 md:pt-28 md:pb-28"
      >
        {/* Sculptural Cyan Ribbon Curve sweeping behind right-column body copy (`01_t00.0s` & `03_t02.8s`) */}
        <svg
          ref={ribbonSvgRef}
          aria-hidden="true"
          viewBox="0 0 1440 1120"
          fill="none"
          className="pointer-events-none absolute inset-x-0 top-0 h-full w-full select-none will-change-transform"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="goalRibbonTube" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#9afaf9" stopOpacity="0.88" />
              <stop offset="52%" stopColor="#8ff8f7" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#a7fbfa" stopOpacity="0.86" />
            </linearGradient>
          </defs>
          {/* Upper ribbon loop grazing above "Experiences" + sweeping U-curve behind right body copy */}
          <path
            d="M 410 -40 C 480 390, 790 420, 885 260 C 995 75, 1085 110, 995 430 C 925 680, 965 825, 1145 815 C 1265 808, 1365 772, 1465 742"
            stroke="url(#goalRibbonTube)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M 410 -40 C 480 390, 790 420, 885 260 C 995 75, 1085 110, 995 430 C 925 680, 965 825, 1145 815 C 1265 808, 1365 772, 1465 742"
            stroke="#e2ffff"
            strokeOpacity="0.45"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>

        <div id="home-goal-context-inner" className="relative mx-auto w-full px-[5vw]">
          <h2
            ref={titleHeadingRef}
            id="home-goal-title"
            className="max-w-[14ch] pl-0 min-[820px]:pl-[13.5vw] font-sans text-[clamp(2.25rem,6.1vw,5.65rem)] font-normal leading-[1.02] tracking-[-0.03em] text-[#0c0e14] will-change-transform"
          >
            {LUSION_HOME.goal.heading}
          </h2>

          <div className="mt-6 min-[820px]:mt-12 flex flex-col min-[820px]:flex-row-reverse min-[820px]:items-center min-[820px]:justify-between gap-6 min-[820px]:gap-10">
            <div
              ref={copyColRef}
              id="home-goal-texts"
              className="w-full min-[820px]:w-[34.5%] min-[820px]:mr-0 space-y-4 min-[820px]:space-y-6 font-sans text-[clamp(0.92rem,1.22vw,1.16rem)] min-[820px]:text-[1.65vw] font-normal leading-[1.38] text-[#151821] will-change-transform"
            >
              {LUSION_HOME.goal.paragraphs.map((para, idx) => (
                <p key={idx} className="home-goal-texts-paragraph">
                  <span className="home-goal-texts-p block">{para}</span>
                </p>
              ))}
            </div>

            {/* Original tablet layout: match the larger source still silhouette; camera follows this measured slot */}
            <div
              ref={imgInRef}
              id="home-goal-image-in"
              className="relative w-full min-[820px]:w-[57%] aspect-[1.391/1] rounded-[24px] bg-transparent"
            >
              {/* Graceful Loading / Asset-Failure / Non-WebGL Fallback Poster */}
              <div
                ref={fallbackPosterRef}
                data-testid="goal-astronaut-fallback"
                style={{ display: "none" }}
                className="h-full w-full flex-col gap-4 items-center justify-center rounded-[24px] bg-gradient-to-b from-[#04060d] via-[#081738] to-[#1748b8] p-8 text-center text-white shadow-[0_28px_70px_rgba(8,12,28,0.35)]"
              >
                <p className="font-sans text-lg uppercase tracking-[0.08em]">
                  Step into a new world and let your imagination run wild
                </p>
                <p className="text-sm">3D is unavailable. You can continue below.</p>
                <a href="#end-section-title" className="rounded-full border border-white/60 px-5 py-3 text-sm underline underline-offset-4">
                  Continue to contact
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          Part B: Scroll Track (`3550vh`) — Lavender Top Band for Tablet Push-In -> Space
          ======================================================================= */}
      <div
        ref={tunnelRef}
        id="home-goal-tunnel"
        className="relative w-full"
        style={{
          height: "3550vh",
          background:
            "linear-gradient(to bottom, #eff0f9 0vh, #eff0f9 260vh, #000000 260vh, #000000 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-x-0 bottom-[135vh] flex flex-col items-center justify-center">
          <div
            ref={imgOutRef}
            id="home-goal-image-out"
            className="w-[93vw] aspect-[4/3.05] min-[820px]:w-[81vw] min-[820px]:max-w-[1180px] min-[820px]:aspect-[16/9.6]"
          />
        </div>
      </div>

      {/* =======================================================================
          Part C: Single Persistent Full-Viewport Stage Overlay (`W x H`)
          NO CSS overflow clipping — 100% 3D world with GPU stencil portal screen!
          ======================================================================= */}
      <div
        ref={stageOverlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[12]"
        style={{ visibility: "hidden" }}
      >
        <div ref={backdropGlowRef} className="absolute inset-0 z-[1] transition-none" />

        {/* Downstream Exit Apple Studio Display Chassis (`Frame 16` — `z-[8]` behind `<canvas>` `z-[10]` so the 3D astronaut & shards burst over the bezel and blue surroundings.) */}
        <div
          ref={monitorBezelRef}
          className="absolute left-0 top-0 z-[8] will-change-transform"
          style={{ display: "none", transformOrigin: "50% 50%" }}
        >
          {/* Brushed Silver Aluminum Stand Neck + Circular Cable Cutout Hole (`16_t21.0s`!) */}
          <svg
            aria-hidden="true"
            viewBox="0 0 220 130"
            preserveAspectRatio="none"
            className="pointer-events-none absolute -bottom-[17.5%] left-1/2 h-[18%] w-[19%] -translate-x-1/2 drop-shadow-[0_14px_22px_rgba(12,18,38,0.18)]"
          >
            <defs>
              <linearGradient id="studioDisplayStandGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#aeb4c0" />
                <stop offset="28%" stopColor="#e6e9f0" />
                <stop offset="68%" stopColor="#cfd4df" />
                <stop offset="100%" stopColor="#949aa6" />
              </linearGradient>
              <mask id="studioDisplayCableHole">
                <rect x="0" y="0" width="220" height="130" fill="#ffffff" />
                <ellipse cx="110" cy="96" rx="22" ry="26" fill="#000000" />
              </mask>
            </defs>
            <path
              d="M 14 0 L 206 0 L 214 128 L 6 128 Z"
              fill="url(#studioDisplayStandGrad)"
              mask="url(#studioDisplayCableHole)"
            />
          </svg>

          {/* Transparent screen opening framed by a glossy black bezel and a single webcam detail */}
          <div className="relative h-full w-full rounded-[14px] border-[14px] border-[#050609] bg-transparent shadow-[0_28px_80px_rgba(10,16,44,0.28)] sm:rounded-[20px] sm:border-[22px]">
            <span
              aria-hidden="true"
              className="absolute -top-[9px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#1b2234] sm:-top-[14px] sm:h-[6px] sm:w-[6px]"
            />

          </div>
        </div>

        {/* Full-Viewport Single-World Three.js Canvas Host */}
        <div ref={canvasHostRef} className="absolute inset-0 z-[10] h-full w-full" />

        {/* White 3-Line Headline Over/Behind Astronaut (`Frames 06 -> 07 -> 08`) */}
        <div
          ref={tunnelTitleWrapRef}
          id="home-goal-tunnel-title"
          className="pointer-events-none absolute left-1/2 top-1/2 z-[16] flex w-screen flex-col items-center text-center text-white whitespace-nowrap will-change-transform"
          style={{ display: "none" }}
        >
          {TITLE_WORD_LINES.map((words, lineIdx) => (
            <span
              key={lineIdx}
              ref={(el) => {
                titleLineRefs.current[lineIdx] = el;
              }}
              className="home-goal-tunnel-title-line flex flex-row items-center justify-center font-sans text-[clamp(1.32rem,5.8vw,5.25rem)] font-normal uppercase leading-[1.22] text-white"
            >
              {words.map((word, wIdx) => (
                <span key={wIdx} className="inline-block">
                  {word}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
