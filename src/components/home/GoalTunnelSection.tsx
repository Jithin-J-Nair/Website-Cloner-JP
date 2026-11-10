"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { advanceCinematicProgress, cinematicRenderDpr, GOAL_CINEMATIC_SECONDS } from "@/lib/home-motion";
import { createGoalReferenceWorlds, createGoalGlassAnimationTextures, goalWorldRatios, goalWhiteFlightState, goalGlassState, sampleGoalBrownian, sampleGoalBrownianPhases, GOAL_WORLD_SCALE } from "./GoalReferenceWorlds";
import { createGoalReferenceEnd, createGoalReferenceVisor } from "./GoalReferenceEnd";
import { GoalReferenceBloomPass } from "./GoalReferenceBloomPass";
import { GoalReferenceOverlayPass } from "./GoalReferenceOverlayPass";
import type { GoalReferenceCloneField } from "./GoalReferenceClones";
import { glassVertex, glassFragment } from "./GoalReferenceShaders";
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
  setPortalStencilMask,
  SUIT_POSE_TABLET_FLOAT,
  type LoadedAstronautRig,
  type SuitJointPose,
} from "@/components/home/AstronautEmergenceAssets";
import {
  createGoalPlaybackPath,
  evaluateSuitWavePose,
  SUIT_POSE_CORRIDOR_FLY,
  SUIT_POSE_CTA_RELAXED,
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
      pipelineReady: boolean;
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
        cameraFov: number;
        astronautRootNdc: number[];
        whiteFlightRatio: number;
        noisePositionAmplitude: number;
        glassFrame: number;
        glassFragmentScale: number;
        endLoaded: boolean;
        endDiamondCount: number;
        endStickerCount: number;
        endTime: number;
        visorAtlasReady: boolean;
        ctaReveal: number;
        nativeWorldsReady: boolean;
        worldError: string | null;
        blackInstances: number;
        whiteInstances: number;
        blackOffset: number;
        bloomTechnique: "source-fft" | "emergence";
        trussLoaded: boolean;
        shardsLoaded: boolean;
        portalFlash: number;
        flashVisible: boolean;
        corridorTravel: number;
        corridorVisible: boolean;
        corridorClipped: boolean;
        glazingLayers: number;
        glassOpacity: number;
        glassRefractionReady: boolean;
        glassThickness: number;
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
      document.getElementById("home-end-bottom")?.style.removeProperty("position");
      document.querySelector<HTMLElement>("#home #end-section")?.style.removeProperty("--home-end-reveal");
      document.querySelectorAll<HTMLElement>("#home [data-home-end-roll]").forEach(letter => { letter.style.transform = ""; });
      const contact = document.querySelector<HTMLAnchorElement>("#home #end-section-title-link");
      if (contact) { contact.style.pointerEvents = "auto"; contact.tabIndex = 0; }
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
    const nativeLightMask = { value: 0 };
    const nativeDisplayAlpha = { value: 0 };
    let mainAstro: LoadedAstronautRig | null = null;
    const clones: LoadedAstronautRig[] = [];
    let nativeClones: GoalReferenceCloneField | undefined;
    const visorLed = createGoalReferenceVisor(track);

    const glbPromise = forceAssetFailure
      ? Promise.reject(new Error("Simulated astronaut asset failure (?simulateGlbError=1)"))
      : loadLusionAstronautParts(visorEnvTarget.texture, isMobileInit, track).catch(() =>
          // The captured Lusion .buf suit parts are authoritative. Keep the legacy GLB only as a
          // last-resort fallback if one of those bundled source assets is unavailable.
          loadLicensedAstronautGlb(visorEnvTarget.texture, isMobileInit, track)
        );

    // -------------------------------------------------------------------------
    // 5. Captured instanced architectural worlds and source-shaped feedback
    // -------------------------------------------------------------------------
    const worlds = createGoalReferenceWorlds(track);
    scene.add(worlds.black, worlds.white, worlds.monitorStencilMask);
    void worlds.ready.then(() => {
      if (unmounted || contextLost) return;
      const state = window.__goalAstronautTelemetry?.sceneState;
      if (state) {
        state.nativeWorldsReady = worlds.blackReady && worlds.whiteReady; state.worldError = worlds.error;
        state.blackInstances = worlds.blackReady ? 552 : 0; state.whiteInstances = worlds.whiteReady ? 32 : 0;
      }
      if (worlds.error) {
        console.warn("Goal architecture unavailable", worlds.error); audioJourney.release(); showStaticFallback();
        if (window.__goalAstronautTelemetry) window.__goalAstronautTelemetry.fallbackVisible = true;
      } else renderSceneAtScroll(smoothScrollY, (performance.now() - startClock) * .001);
    });

    // Native PreUfx: finished display -> glass and emerged astronaut, after bloom.
    const overlayScene = new THREE.Scene();
    // The current suit uses PBR materials, unlike the source's self-lit program.
    // Transfer its illumination as well as its geometry; never leave it black
    // merely because native foreground ownership changed after the blue flight.
    const overlayLights = scene.children.filter((object): object is THREE.Light => object instanceof THREE.Light)
      .map(light => { const copy = light.clone(); overlayScene.add(copy); return { light, copy }; });
    let glassRefractionReady = false;

    // Captured rigid-body shard transforms are interpolated continuously at each scroll sample.
    let shardsMesh: THREE.Mesh | null = null;
    let numShards = 0;
    let framesPerShard = 0;

    const endDecor = createGoalReferenceEnd(track, isMobileInit);
    endDecor.group.visible = false;
    scene.add(endDecor.group);

    // Glass is optional: a failed debris asset must not suppress the astronaut rig.
    const glassPromise = import("@/lib/lusion-buf-loader")
      .then((m) => Promise.all([
        m.loadLusionBuf("/assets/models/tunnels/broken_glass.buf"),
        m.loadLusionBuf("/assets/models/tunnels/broken_glass_animation.buf"),
      ]))
      .then(([bg, bga]) => {
        if (unmounted || contextLost) return;

        const maxPiece = Math.max(...bg.attributes.piece);
        numShards = maxPiece + 1;
        framesPerShard = Math.floor(bga.header.vertexCount / numShards);
        
        const geom = track(bg.geometry.clone());
        const restBounds = new THREE.Box3(), vertex = new THREE.Vector3(), orientation = new THREE.Quaternion();
        const positions = geom.getAttribute("position"), pieces = geom.getAttribute("piece");
        for (let i = 0; i < positions.count; i++) {
          const piece = pieces.getX(i); orientation.fromArray(bga.attributes.orient, piece * 4);
          vertex.fromBufferAttribute(positions, i).applyQuaternion(orientation);
          vertex.x += bga.attributes.position[piece * 3]; vertex.y += bga.attributes.position[piece * 3 + 1]; vertex.z += bga.attributes.position[piece * 3 + 2]; restBounds.expandByPoint(vertex);
        }
        // Full captured animation textures: exact frame-major endpoint sampling in
        // the vertex shader, not a rescaled CPU-spline explosion or extra sidewalls.
        const atlas = createGoalGlassAnimationTextures(bga, numShards);
        const texFrame = track(atlas.position), texOrient = track(atlas.orient);
        const mat = track(new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide,
          uniforms: { u_backgroundTexture: { value: null }, u_resolution: { value: new THREE.Vector2(1, 1) },
            u_positionTexture: { value: texFrame }, u_orientTexture: { value: texOrient }, u_textureSize: { value: new THREE.Vector2(numShards, framesPerShard) },
            u_frameFrom: { value: 0 }, u_frameTo: { value: 0 }, u_frameRatio: { value: 0 }, u_fragmentScale: { value: 1 } },
          vertexShader: glassVertex, fragmentShader: glassFragment,
        }));
        shardsMesh = new THREE.Mesh(geom, mat); shardsMesh.visible = false; shardsMesh.frustumCulled = false; shardsMesh.renderOrder = 1000;
        shardsMesh.userData = { restBounds, shardSpread: 1, sampleFrame(frame: number) {
          mat.uniforms.u_frameFrom.value = Math.floor(frame); mat.uniforms.u_frameTo.value = Math.min(framesPerShard - 1, Math.floor(frame) + 1); mat.uniforms.u_frameRatio.value = frame % 1;
        } };
        overlayScene.add(shardsMesh);

      })
      .catch((error: unknown) => {
        if (!unmounted) console.warn("Goal glass assets unavailable", error);
      });

    glbPromise
      .then(({ primary, createClone }) => {
        if (unmounted || contextLost) return;
        mainAstro = primary;
        portalMaskedMaterials.push(...primary.materials);
        // Captured rigs share materials; fallback GLB clones may own theirs.
        // Bridge each material once, never stack shader declarations per clone.
        const nativeBridgedMaterials = new WeakSet<THREE.Material>();
        const applyNativeDisplayBridge = (rig: LoadedAstronautRig) => {
          for (const material of rig.materials) {
            if (nativeBridgedMaterials.has(material)) continue;
            nativeBridgedMaterials.add(material);
            const compile = material.onBeforeCompile, key = material.customProgramCacheKey();
            material.onBeforeCompile = function(shader, renderer) {
              compile.call(this, shader, renderer); shader.uniforms.u_goalNativeLightMask = nativeLightMask; shader.uniforms.u_goalDisplayAlpha = nativeDisplayAlpha;
              shader.fragmentShader = "uniform float u_goalNativeLightMask;uniform float u_goalDisplayAlpha;\n" + shader.fragmentShader;
              const end = shader.fragmentShader.lastIndexOf("}");
              shader.fragmentShader = shader.fragmentShader.slice(0, end) +
                "gl_FragColor.a=mix(mix(gl_FragColor.a,max(0.,dot(gl_FragColor.rgb,vec3(.299,.587,.114))-1.)*.5,u_goalNativeLightMask),1.,u_goalDisplayAlpha);\n" +
                "gl_FragColor.rgb=mix(gl_FragColor.rgb,sRGBTransferOETF(vec4(max(gl_FragColor.rgb,vec3(0.)),1.)).rgb,u_goalNativeLightMask);\n" + shader.fragmentShader.slice(end);
            };
            material.customProgramCacheKey = () => key + "-goal-light-selection-display-v3"; material.needsUpdate = true;
          }
        };
        applyNativeDisplayBridge(primary);

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

        nativeClones = primary.referenceClones;
        if (nativeClones) scene.add(nativeClones.group);
        const cloneCount = nativeClones ? 0 : 4;
        for (let c = 0; c < cloneCount; c++) {
          const cl = createClone();
          applyNativeDisplayBridge(cl);
          cl.root.visible = false;
          applySuitJointPose(cl, SUIT_POSE_TUMBLE_SPREAD);
          scene.add(cl.root);
          clones.push(cl);
        }

        // Pre-compile all downstream WebGL programs on hardware GPUs so scrolling through
        // `Frames 09 -> 20` incurs zero shader-compilation stalls (skip blocking batch LLVM JIT on software rasterizers).
        if (!isSoftwareRenderer) {
          const prevTruss = worlds.black.visible;
          const prevBlue = worlds.white.visible;
          const prevShards = shardsMesh ? shardsMesh.visible : false;
          const prevDecor = endDecor.group.visible;
          const prevLed = visorLed.mesh.visible;
          worlds.black.visible = true;
          worlds.white.visible = true;
          if(shardsMesh) shardsMesh.visible = true;
          endDecor.group.visible = true;
          visorLed.mesh.visible = true;
          if (clones[0]) clones[0].root.visible = true;
          if (nativeClones) nativeClones.group.visible = true;
          glRenderer.compile(scene, camera);
          worlds.black.visible = prevTruss;
          worlds.white.visible = prevBlue;
          if(shardsMesh) shardsMesh.visible = prevShards;
          endDecor.group.visible = prevDecor;
          visorLed.mesh.visible = prevLed;
          if (clones[0]) clones[0].root.visible = false;
          if (nativeClones) nativeClones.group.visible = false;
        }

        if (window.__goalAstronautTelemetry) {
          window.__goalAstronautTelemetry.glbLoaded = true;
          window.__goalAstronautTelemetry.glbError = null;
          window.__goalAstronautTelemetry.fallbackVisible = Boolean(worlds.error);
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
    // Emergence color pipeline + native LDR/float-FFT cinematic bloom on all tiers
    // Stencil buffer preserved (`stencilBuffer: true`) so 3D portal stencil masking works!
    // -------------------------------------------------------------------------
    let composer: EffectComposer | null = null;
    let bloomPass: UnrealBloomPass | null = null;
    let referenceBloom: GoalReferenceBloomPass | null = null;
    let outputPass: OutputPass | null = null;

    const overlayPass = new GoalReferenceOverlayPass(overlayScene, camera, (texture, width, height) => {
      if (!shardsMesh?.visible) return;
      const material = shardsMesh.material as THREE.ShaderMaterial;
      material.uniforms.u_backgroundTexture.value = texture;
      material.uniforms.u_resolution.value.set(width, height);
      glassRefractionReady = true;
    });

    {
      const bufW = Math.max(2, Math.floor(initW * initDpr));
      const bufH = Math.max(2, Math.floor(initH * initDpr));
      const msaaSamples = glRenderer.capabilities.isWebGL2 && !isSoftwareRenderer && !isMobileInit
        ? Math.min(4, glRenderer.capabilities.maxSamples)
        : 0;

      // EffectComposer owns this target and its clone; do not also track/dispose it.
      const rt = new THREE.WebGLRenderTarget(bufW, bufH, {
          type: THREE.HalfFloatType,
          depthBuffer: true,
          stencilBuffer: true,
          samples: msaaSamples,
          minFilter: THREE.LinearFilter,
          magFilter: THREE.LinearFilter,
        });
      composer = new EffectComposer(glRenderer, rt);
      composer.setPixelRatio(initDpr);
      composer.setSize(initW, initH);

      const renderPass = new RenderPass(scene, camera);
      const renderArchitecture = renderPass.render.bind(renderPass);
      renderPass.render = (renderer, writeBuffer, readBuffer, deltaTime, maskActive) => {
        if (!worlds.black.visible) { renderArchitecture(renderer, writeBuffer, readBuffer, deltaTime, maskActive); return; }
        // Source feedback is captured after LD/HD architecture and before the
        // foreground astronaut. Copy the resolved scene target instead of drawing
        // a second 130k-vertex lattice every normal-playback frame.
        const foreground = [...(mainAstro ? [mainAstro.root] : []), ...clones.map(clone => clone.root), ...(nativeClones ? [nativeClones.group] : [])];
        const visibility = foreground.map(object => object.visible), autoClear = renderer.autoClear;
        try {
          for (const object of foreground) object.visible = false;
          renderArchitecture(renderer, writeBuffer, readBuffer, deltaTime, maskActive);
          worlds.captureFeedback(renderer, readBuffer.texture);
          worlds.black.visible = false;
          foreground.forEach((object, i) => { object.visible = visibility[i]; });
          renderer.setRenderTarget(readBuffer); renderer.autoClear = false; renderer.render(scene, camera);
        } finally {
          worlds.black.visible = true; foreground.forEach((object, i) => { object.visible = visibility[i]; });
          renderer.autoClear = autoClear; renderer.setRenderTarget(readBuffer);
        }
      };
      composer.addPass(renderPass);

      bloomPass = new UnrealBloomPass(new THREE.Vector2(initW, initH), 0.16, 0.46, 1.48);
      composer.addPass(bloomPass);

      referenceBloom = new GoalReferenceBloomPass(); referenceBloom.enabled = false; composer.addPass(referenceBloom);
      outputPass = new OutputPass();
      composer.addPass(outputPass);
      composer.addPass(overlayPass);
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
    let idleEpoch: number | null = null;
    let lastEndReveal = -1;
    const endWords = Array.from(document.querySelectorAll<HTMLElement>("#home [data-home-end-word]"))
      .map(word => Array.from(word.querySelectorAll<HTMLElement>("[data-home-end-roll]")));
    let frameClock = performance.now();
    let userPaused = false;
    let pipelineReady = Boolean(reducedMotion), pipelineWarmed = false;
    let pipelineWarmPromise: Promise<void> | null = null;
    let cancelPipelineWarmup = () => {};
    let restoreWarmCanvas = () => {};
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
      pipelineReady, glbLoaded: false,
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
        cameraFov: 45, astronautRootNdc: [0, 0, 0], whiteFlightRatio: 0,
        noisePositionAmplitude: 0, glassFrame: 0, glassFragmentScale: 1,
        endLoaded: false, endDiamondCount: 0, endStickerCount: 0, endTime: 0, visorAtlasReady: false, ctaReveal: 0,
        nativeWorldsReady: false, worldError: null, blackInstances: 0, whiteInstances: 0, blackOffset: 0, bloomTechnique: "emergence",
        trussLoaded: false, shardsLoaded: false, portalFlash: 0, flashVisible: false,
        corridorTravel: 0, corridorVisible: false, corridorClipped: false,
        glazingLayers: 0, glassOpacity: 0, glassThickness: 0,
        glassRefractionReady: false, shardDepthWrite: false, shardSpread: 1,
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


      if (window.__goalAstronautTelemetry) {
        window.__goalAstronautTelemetry.renderWidth = Math.floor(W * dpr);
        window.__goalAstronautTelemetry.renderHeight = Math.floor(H * dpr);
        window.__goalAstronautTelemetry.pixelRatio = dpr;
      }

      const blackTitleFrom = emergenceStart + emergenceSpan * 0.62;
      const blackTitleTo = emergenceEnd;
      const blackTunnelFrom = tunnelStart;
      const blackTunnelTo = tunnelStart + tunnelSpan * .815;
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
    const _rootOrientation = new THREE.Quaternion();
    const _noisePosition = new THREE.Vector3();
    const _noiseRotation = new THREE.Quaternion();
    const _headWorld = new THREE.Vector3();
    const _camLook = new THREE.Vector3();
    const _monitorCenter = new THREE.Vector3();
    const _glassCenter = new THREE.Vector3();
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
        document.getElementById("home-end-bottom")?.style.removeProperty("position");
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
      const whiteFlight = goalWhiteFlightState(goalWorldRatios(tTunnel, tShatter).white);
      const glassState = goalGlassState(tShatter, framesPerShard);
      const tWait = clamp01((sy - m.endTop) / Math.max(1, m.endHeight));
      if (tShatter < 1) idleEpoch = null;
      else if (idleEpoch === null) idleEpoch = elapsedSec;
      const idleSeconds = reducedMotion ? tWait * 2.45 : Math.max(0, elapsedSec - (idleEpoch ?? elapsedSec));
      const endEl = document.getElementById("end-section");
      const endReveal = smoothstep(.005, .08, tWait);
      const endLink = document.getElementById("end-section-title-link");
      if (endReveal !== lastEndReveal) {
        endEl?.style.setProperty("--home-end-reveal", String(endReveal));
        if (endLink) { endLink.style.pointerEvents = endReveal > .75 ? "auto" : "none"; endLink.tabIndex = endReveal > .75 ? 0 : -1; }
      }
      // Don't invalidate an off-screen text subtree on every tunnel frame.
      if (endReveal > 0 || lastEndReveal > 0) endWords.forEach((letters, word) => {
        const cycle = Math.floor(idleSeconds / 2), phase = idleSeconds % 2;
        const selected = (cycle * 7 + word * 3) % letters.length;
        letters.forEach((letter, index) => {
          const stagger = .15 * (word / 2 + index / Math.max(1, letters.length - 1));
          const reveal = reducedMotion ? 1 : smoothstep(stagger, stagger + .7, endReveal);
          const roll = reducedMotion || index !== selected ? 0 : smoothstep(word * .1, word * .1 + .8, phase);
          letter.style.transform = `translateY(${((1 - reveal - roll) * 50).toFixed(3)}%)`;
        });
      });
      lastEndReveal = endReveal;
      const footerWipingMost = sy > m.endTop + m.endHeight - H * 0.45;
      const endBottomEl = document.getElementById("end-bottom");
      const endPill = document.getElementById("home-end-bottom");
      // The reference pill is already pinned during the glass breakthrough;
      // hand it back to the sticky CTA at arrival without a viewport-position jump.
      if (endPill) endPill.style.position = tShatter > .18 && tWait <= .001 ? "fixed" : "absolute";
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
        camera.near = .08; camera.far = 180; camera.fov = fovNow;
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
        const ratios = goalWorldRatios(tTunnel, tShatter);
        const offset = tTunnel >= .815 ? 60 * (1 - ratios.white) : Math.sin(ratios.black * 10 + (reducedMotion ? 1 : playing() ? elapsedSec : ratios.black * 10 + ratios.white * 3)) * 7.5 * smoothstep(0, .2, ratios.black);
        const expectedFov = m.isMobile ? 54 : 45;
        // Native projection follows the weight-2 blue flight, not the later
        // weight-1 monitor animation. Keep the approved late CTA adaptation.
        const frameFraction = lerp(1, m.imgOutHeight / H, whiteFlight.frame);
        const apertureFov = 2 * Math.atan(Math.tan(expectedFov * Math.PI / 360) / frameFraction) * 180 / Math.PI;
        // Retain the existing late CTA framing adaptation. The desktop film
        // does not establish a native mobile FOV of 76 degrees.
        const baseFov = lerp(apertureFov, m.isMobile ? 76 : 60, smoothstep(.75, 1, tShatter));
        // Reference dolly compensates distance, not an independently banked camera.
        const dolly = Math.tan(baseFov * Math.PI / 720) / Math.tan((baseFov + offset) * Math.PI / 720) - 1;
        camera.near = GOAL_WORLD_SCALE; camera.far = 200 * GOAL_WORLD_SCALE; camera.fov = baseFov; camera.aspect = W / H; camera.up.set(0, 1, 0);
        camera.position.set(pxParallax * .04, pyParallax * .035, 5.2 + dolly * GOAL_WORLD_SCALE);
        camera.lookAt(pxParallax * .1, pyParallax * .1, 24 * GOAL_WORLD_SCALE);
        camera.updateProjectionMatrix(); camera.updateMatrixWorld();
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

      // Source architectural worlds: native grid instances and stereographic
      // folding; the blue world is the captured base/wall with 4D cellular bands.
      const nativeRatios = worlds.update(tTunnel, tShatter, reducedMotion ? 1 : elapsedSec, Boolean(reducedMotion));
      worlds.blackUniforms.u_resolution.value.set(glRenderer.domElement.width, glRenderer.domElement.height);
      const portalFlash = !inEmergencePhase ? smoothstep(.795, .815, tTunnel) * (1 - smoothstep(.815, .84, tTunnel)) : 0;
      const clipToMonitor = worlds.white.visible && tOutPull > .02;
      worlds.setMonitorClip(clipToMonitor); worlds.monitorStencilMask.visible = clipToMonitor;
      nativeLightMask.value = inEmergencePhase ? 0 : 1;
      if (referenceBloom) {
        referenceBloom.enabled = !inEmergencePhase;
        referenceBloom.amount = tTunnel < .815 ? 6 : tShatter < 1 ? whiteFlight.bloom : lerp(0, 20, clamp01(tWait / .1));
        referenceBloom.saturation = tTunnel < .815 ? lerp(1, 3, clamp01(nativeRatios.black / .7)) : 1;
        referenceBloom.haloStrength = tTunnel < .815 ? lerp(.15 + .25 * smoothstep(.2, .4, nativeRatios.black), .08, smoothstep(.65, .75, nativeRatios.black)) : 0;
      }
      if (outputPass) outputPass.enabled = inEmergencePhase;
      if (bloomPass) {
        bloomPass.enabled = inEmergencePhase;
        bloomPass.strength = inEmergencePhase ? .16 : tTunnel < .815 ? lerp(.6, 1.15, nativeRatios.transform) : .48;
        bloomPass.radius = .52; bloomPass.threshold = inEmergencePhase ? 1.48 : .75;
      }

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

      if (worlds.white.visible) {
        // The native walls deform in the vertex shader, not by moving a row of rings.
        if (clipToMonitor) {
          worlds.monitorStencilMask.position.copy(_monitorCenter); worlds.monitorStencilMask.quaternion.copy(_monitorRotation);
          worlds.monitorStencilMask.scale.set(monWorldW, monWorldH, 1);
        }
        worlds.white.scale.setScalar(GOAL_WORLD_SCALE);
      }
      if (shardsMesh) {
        shardsMesh.visible = glassState.visible && tWait <= .001;
        if (shardsMesh.visible) {
          const material = shardsMesh.material as THREE.ShaderMaterial;
          // Source sine-out rigid trajectories persist through the drop; fragments
          // shrink only in the last quarter rather than vanishing after .42.
          shardsMesh.userData.sampleFrame(glassState.frame);
          material.uniforms.u_fragmentScale.value = glassState.fragmentScale;
          const bounds = shardsMesh.userData.restBounds as THREE.Box3;
          // Native EndCameraDepthToFrame = 2, in the same .208 world scale.
          // Sharing the world-z=0 stencil plane stretches the rigid trajectories
          // across five world units instead of placing the glass near the camera.
          const depth = 2 * GOAL_WORLD_SCALE;
          const glassWorldH = 2 * depth * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
          _glassCenter.set((outCenterX / W * 2 - 1) * glassWorldH * camera.aspect / 2,
            (1 - outBaseY / H * 2) * glassWorldH / 2, -depth).applyMatrix4(camera.matrixWorld);
          const scale = monWorldH * depth / camera.position.z / (bounds.max.y - bounds.min.y);
          shardsMesh.position.copy(_glassCenter); shardsMesh.quaternion.copy(_monitorRotation); shardsMesh.scale.setScalar(scale);
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

      // Reference gems/stickers grow during the first fifth of the wait range,
      // rise through the viewport and wrap independently. No emissive sticker glow.
      endDecor.update(8 + idleSeconds, tWait, W / H);

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
        } else if (sy <= m.endTop) {
          // Captured root and bone palettes below own the downstream flight.
          jointPose = SUIT_POSE_CORRIDOR_FLY; ax = 0; ay = 0; az = 0;
          rx = ry = rz = 0; aScale = GOAL_WORLD_SCALE;
          visorFlareAmt = 0;
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

          ledVisorOpacity = smoothstep(0, .06, tWait);
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

        applySuitJointPose(mainAstro, jointPose);
        const motionTime = nativeRatios.black * 10 + nativeRatios.white * 3;
        const loopFrame = (motionTime * 30 * .75) % 89;
        const idleFrame = 140 + (tShatter < 1 ? Math.max(0, tShatter - .9) * 60 : 6 + idleSeconds * 60) % 147;
        const bakedFrame = tShatter < .5 ? loopFrame : idleFrame;
        const transitionFrame = lerp(90, 139, clamp01((tOutPull + tShatter - .9) / 1.1) ** 4);
        const transitionWeight = clamp01(tShatter / .1) * (1 - clamp01((tShatter - .9) / .1));
        mainAstro.sampleBakedPose?.(bakedFrame, inEmergencePhase ? smoothstep(.78, 1, uEmergence) : 1, transitionFrame, transitionWeight);
        if (window.__goalAstronautTelemetry) {
          window.__goalAstronautTelemetry.sceneState.bakedFrame = bakedFrame;
        }
        if (mainAstro.sampleBakedPose) {
          visorLed.mesh.position.copy(mainAstro.visorAnchorLocal);
          if (mainAstro.visorOrientationLocal) visorLed.mesh.quaternion.copy(mainAstro.visorOrientationLocal);
        }
        mainAstro.root.position.set(ax, ay, az);
        mainAstro.root.rotation.set(rx, ry, rz);
        if (!inEmergencePhase && mainAstro.sampleCapturedRoot) {
          const whiteActive = tTunnel >= .815;
          const frame = whiteActive ? (nativeRatios.white < 1 ? nativeRatios.white * 79 : 79 + tShatter * 20) : 99;
          mainAstro.sampleCapturedRoot(whiteActive ? "out" : "in", frame, _rootPosition, _rootOrientation);
          if (whiteActive) {
            sampleGoalBrownianPhases(whiteFlight.positionPhase, whiteFlight.rotationPhase, 0,
              whiteFlight.positionAmplitude, whiteFlight.rotationAmplitude, _noisePosition, _noiseRotation);
          } else {
            // Preserve the approved black flight while carrying its terminal
            // noise phases continuously into the reference's blue-flight fade.
            sampleGoalBrownian(motionTime, 0, 5 * nativeRatios.black, 60 * nativeRatios.black,
              .2 + .5 * nativeRatios.black, .15, _noisePosition, _noiseRotation);
          }
          _noisePosition.applyQuaternion(_rootOrientation);
          _rootPosition.add(_noisePosition); _rootOrientation.multiply(_noiseRotation);
          _rootPosition.y -= (m.isMobile ? 0 : .4) * smoothstep(0, 1, tShatter);
          mainAstro.root.position.copy(_rootPosition).multiplyScalar(GOAL_WORLD_SCALE);
          mainAstro.root.quaternion.copy(_rootOrientation); aScale = GOAL_WORLD_SCALE;
        }
        if (inEmergencePhase && uEmergence > .78 && mainAstro.sampleCapturedRoot) {
          const title = clamp01((uEmergence - .62) / .38), weight = smoothstep(.78, 1, uEmergence);
          mainAstro.sampleCapturedRoot("in", Math.min(99, 100 * title ** 3), _rootPosition, _rootOrientation);
          mainAstro.root.position.lerp(_rootPosition.multiplyScalar(GOAL_WORLD_SCALE), weight);
          mainAstro.root.quaternion.slerp(_rootOrientation, weight); aScale = lerp(aScale, GOAL_WORLD_SCALE, weight);
        }
        mainAstro.root.scale.setScalar(aScale);
        mainAstro.root.updateMatrixWorld(true);

        // Animated reference atlas follows the sampled head, not a screen-aligned smiley.
        visorLed.update(idleSeconds, ledVisorOpacity);

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

        // Native additive/reflection clone family is separate from the approved
        // primary PBR suit; one four-instance draw per part, no extra owner/RAF.
        const clonesShow = smoothstep(.2, .4, nativeRatios.black);
        nativeClones?.update(!inEmergencePhase && tTunnel < .815 && clonesShow > .001,
          motionTime, loopFrame, nativeRatios.black, clonesShow, mainAstro.root.position);
        // Preserve the legacy GLB failure-isolation fallback.

        for (let c = 0; c < clones.length; c++) {
          const cl = clones[c];
          cl.root.visible = !inEmergencePhase && tTunnel < .815 && clonesShow > .001;
          if (cl.root.visible) {
            cl.sampleBakedPose?.((loopFrame + (c + 1) * 17) % 89, 1);
            sampleGoalBrownian(motionTime, c + 1, 12, 10, .2, .6, _noisePosition, _noiseRotation);
            _noisePosition.applyQuaternion(_rootOrientation);
            cl.root.position.copy(_rootPosition).addScaledVector(_noisePosition, clonesShow).multiplyScalar(GOAL_WORLD_SCALE);
            cl.root.quaternion.copy(_rootOrientation).multiply(_noiseRotation); cl.root.scale.setScalar(GOAL_WORLD_SCALE);
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
      worlds.renderFeedback(glRenderer, camera, Boolean(reducedMotion));
      nativeClones?.renderReflection(glRenderer, worlds.blackUniforms.u_feedbackTexture.value);
      glassRefractionReady = false;
      // The source transfers the astronaut out of the tunnel stage when the
      // blue root curve ends. Render that foreground once, after bloom, with
      // display alpha rather than reusing its light-selection alpha as coverage.
      const astronautOverlay = !inEmergencePhase && nativeRatios.white >= 1;
      if (mainAstro && mainAstro.root.parent !== (astronautOverlay ? overlayScene : scene)) {
        (astronautOverlay ? overlayScene : scene).add(mainAstro.root);
      }
      nativeDisplayAlpha.value = astronautOverlay ? 1 : 0;
      for (const { light, copy } of overlayLights) {
        copy.intensity = light.intensity; copy.color.copy(light.color);
        copy.position.copy(light.position); copy.quaternion.copy(light.quaternion);
      }
      overlayPass.enabled = Boolean(shardsMesh?.visible) || astronautOverlay;
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
        state.endLoaded = endDecor.loaded; state.endDiamondCount = endDecor.diamondCount;
        state.endStickerCount = endDecor.stickerCount; state.endTime = 8 + idleSeconds;
        state.visorAtlasReady = visorLed.loaded; state.ctaReveal = endReveal;
        mainAstro?.root.matrixWorld.toArray(state.astronautMatrix);
        camera.matrixWorld.toArray(state.cameraMatrix);
        state.cameraFov = camera.fov;
        if (mainAstro) {
          mainAstro.root.getWorldPosition(_headWorld).project(camera).toArray(state.astronautRootNdc);
        }
        state.whiteFlightRatio = whiteFlight.frame;
        state.noisePositionAmplitude = tTunnel >= .815 ? whiteFlight.positionAmplitude : 5 * nativeRatios.black;
        state.glassFrame = glassState.frame; state.glassFragmentScale = glassState.fragmentScale;
        state.nativeWorldsReady = worlds.blackReady && worlds.whiteReady; state.worldError = worlds.error;
        state.blackInstances = worlds.blackReady ? 552 : 0; state.whiteInstances = worlds.whiteReady ? 32 : 0;
        state.blackOffset = worlds.blackUniforms.u_offsetZ.value; state.bloomTechnique = inEmergencePhase ? "emergence" : "source-fft";
        state.trussLoaded = worlds.blackReady;
        state.shardsLoaded = shardsMesh !== null;
        state.shardSidewallsLoaded = false; state.shardSidewallTriangles = 0;
        state.vortexGlassVisible = false; state.vortexGlassLayers = 0; state.vortexGlassEdges = 0;
        state.portalFlash = portalFlash; state.flashVisible = portalFlash > .001;
        state.corridorTravel = nativeRatios.white * 22; state.corridorVisible = worlds.white.visible; state.corridorClipped = clipToMonitor;
        state.glazingLayers = 0; state.glassOpacity = shardsMesh?.visible ? 1 : 0; state.glassThickness = 0;
        state.glassRefractionReady = glassRefractionReady; state.shardDepthWrite = false; state.shardSpread = 1;
        state.shardCount = numShards;
        state.shardFrames = framesPerShard;
        state.vortexIntensity = nativeRatios.transform;
        state.ringVisible = optics.chromaticRingMesh.visible;
      }
      if (window.__goalPipelineProbe) {
        window.__goalPipelineProbe(glRenderer, {
          authoredAt: frameClock, sceneStartedAt: t0, submittedAt: performance.now(),
          virtualScroll: sy, glassMatrix: shardsMesh ? Array.from(shardsMesh.matrixWorld.elements) : null,
          blueMatrix: Array.from(worlds.white.matrixWorld.elements),
        });
      }
    };

    // Prewarm actual material variants and both post pipelines before starting
    // the timed movie. First-use driver/JIT stalls must not consume five seconds
    // of the black shaft or jump straight over the glass impact on SwiftShader.
    // The canvas is hidden during preparation, including real output-program
    // variants; document, scroll, header and audio state are not changed.
    const warmPipeline = () => {
      if (pipelineWarmed || pipelineWarmPromise || reducedMotion) return pipelineWarmPromise;
      pipelineReady = false;
      if (window.__goalAstronautTelemetry) window.__goalAstronautTelemetry.pipelineReady = false;
      pipelineWarmPromise = (async () => {
        await Promise.all([worlds.ready, glbPromise, glassPromise, endDecor.ready, visorLed.ready]);
        if (unmounted || contextLost || worlds.error || !composer || !referenceBloom || !outputPass || !bloomPass) return;
        const canvasVisibility = hostEl.style.visibility;
        restoreWarmCanvas = () => { hostEl.style.visibility = canvasVisibility; restoreWarmCanvas = () => {}; };
        hostEl.style.visibility = "hidden";
        const visibility = scene.children.map(child => [child, child.visible] as const);
        const target = glRenderer.getRenderTarget(), autoClear = glRenderer.autoClear;
        const color = glRenderer.getClearColor(new THREE.Color()), alpha = glRenderer.getClearAlpha();
        const composerToScreen = composer.renderToScreen;
        const mask = nativeLightMask.value, ledVisible = visorLed.mesh.visible;
        const oldPasses = [referenceBloom.enabled, outputPass.enabled, bloomPass.enabled];
        const oldOverlay = overlayPass.enabled, oldShards = shardsMesh?.visible ?? false;
        const oldAstronautParent = mainAstro?.root.parent, oldDisplayAlpha = nativeDisplayAlpha.value;
        const fullW = metrics?.viewportW || initW, fullH = metrics?.viewportH || initH;
        try {
          composer.renderToScreen = true; composer.setSize(8, 8);
          for (const [child] of visibility) if (!(child as THREE.Light).isLight) child.visible = false;
          if (mainAstro) mainAstro.root.visible = true;
          // Exercise emergence and its suit/environment programs too.
          tablet3D.group.visible = earthSystem.group.visible = true;
          optics.spaceHaloMesh.visible = optics.chromaticRingMesh.visible = optics.visorFlareMesh.visible = true;
          outputPass.enabled = bloomPass.enabled = true; referenceBloom.enabled = false;
          composer.render(0);
          tablet3D.group.visible = earthSystem.group.visible = false;
          optics.spaceHaloMesh.visible = optics.chromaticRingMesh.visible = optics.visorFlareMesh.visible = false;
          nativeLightMask.value = 1; outputPass.enabled = bloomPass.enabled = false; referenceBloom.enabled = true;
          for (const clone of clones) clone.root.visible = true;
          if (nativeClones) nativeClones.group.visible = true;
          worlds.update(.4, 0, 1, true); worlds.blackUniforms.u_resolution.value.set(8, 8);
          worlds.renderFeedback(glRenderer, camera, true); nativeClones?.renderReflection(glRenderer, worlds.blackUniforms.u_feedbackTexture.value); composer.render(0);
          // Exercise the folded vertex path too, not only the straight shaft.
          worlds.update(.78, 0, 1, true); worlds.renderFeedback(glRenderer, camera, true); composer.render(0);
          for (const clone of clones) clone.root.visible = false;
          if (nativeClones) nativeClones.group.visible = false;
          worlds.update(.93, 0, 1, true); composer.render(0);
          worlds.update(1, .5, 1, true); worlds.setMonitorClip(true); worlds.monitorStencilMask.visible = true; composer.render(0);
          worlds.setMonitorClip(false); worlds.monitorStencilMask.visible = false; endDecor.update(8, .2, 1); visorLed.update(0, 1);
          if (shardsMesh) shardsMesh.visible = true;
          if (mainAstro) overlayScene.add(mainAstro.root);
          nativeDisplayAlpha.value = 1; overlayPass.enabled = true;
          composer.render(0);
        } finally {
          worlds.update(0, 0, 1, true); nativeLightMask.value = mask; visorLed.mesh.visible = ledVisible;
          [referenceBloom.enabled, outputPass.enabled, bloomPass.enabled] = oldPasses;
          overlayPass.enabled = oldOverlay; if (shardsMesh) shardsMesh.visible = oldShards;
          if (mainAstro && oldAstronautParent) oldAstronautParent.add(mainAstro.root);
          nativeDisplayAlpha.value = oldDisplayAlpha;
          for (const [child, visible] of visibility) child.visible = visible;
          composer.renderToScreen = composerToScreen; composer.setSize(fullW, fullH);
          glRenderer.setRenderTarget(target); glRenderer.autoClear = autoClear; glRenderer.setClearColor(color, alpha);
        }
        // Non-blocking completion fence, not a second animation loop or gl.finish.
        const gl = glRenderer.getContext() as WebGL2RenderingContext;
        const fence = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
        if (fence) {
          gl.flush();
          const completed = await new Promise<boolean>(resolve => {
            let timer: number | undefined;
            const finish = (ok: boolean) => { if (timer !== undefined) window.clearTimeout(timer); gl.deleteSync(fence); resolve(ok); cancelPipelineWarmup = () => {}; };
            cancelPipelineWarmup = () => finish(false);
            const start = performance.now();
            const check = () => {
              if (unmounted || contextLost) { finish(false); return; }
              const status = gl.clientWaitSync(fence, 0, 0);
              if (status === gl.ALREADY_SIGNALED || status === gl.CONDITION_SATISFIED) finish(true);
              else if (status === gl.WAIT_FAILED || performance.now() - start > 90000) finish(false);
              else timer = window.setTimeout(check, 32);
            };
            check();
          });
          if (unmounted || contextLost) return;
          if (!completed) throw new Error("Goal shader preparation did not complete");
        }
        renderSceneAtScroll(smoothScrollY, (performance.now() - startClock) * .001);
        restoreWarmCanvas();
        pipelineWarmed = pipelineReady = true; frameClock = performance.now();
        if (window.__goalAstronautTelemetry) {
          window.__goalAstronautTelemetry.pipelineReady = true;
          window.__goalAstronautTelemetry.resources.programs = glRenderer.info.programs?.length || 0;
        }
        ensureLoop();
      })().catch((error: unknown) => {
        restoreWarmCanvas();
        if (!unmounted && !contextLost) {
          console.warn("Goal pipeline unavailable", error); showStaticFallback(); audioJourney.release();
          if (window.__goalAstronautTelemetry) window.__goalAstronautTelemetry.fallbackVisible = true;
        }
      });
      return pipelineWarmPromise;
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
      if (metrics && playbackPath && !reducedMotion && window.__goalAstronautTelemetry?.glbLoaded && pipelineReady && !window.__goalAstronautTelemetry.fallbackVisible) {
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
      pipelineReady = Boolean(reducedMotion) || pipelineWarmed;
      if (window.__goalAstronautTelemetry) window.__goalAstronautTelemetry.pipelineReady = pipelineReady;
      if (!reducedMotion) void warmPipeline();
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
    void warmPipeline();

    return () => {
      audioJourney.release();
      releasePlayback(false);
      unmounted = true;
      cancelPipelineWarmup();
      restoreWarmCanvas();
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
      scene.clear(); overlayScene.clear();
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
