"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { LUSION_HOME } from "@/data/reference";
import { useStudioStore } from "@/lib/store";
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
  setPortalStencilMask,
  SUIT_POSE_TABLET_FLOAT,
  type LoadedAstronautRig,
  type SuitJointPose,
} from "@/components/home/AstronautEmergenceAssets";
import {
  buildArchitecturalTrussTunnel,
  buildBlueArchCorridor,
  buildDiamondsAndPopStickers,
  buildHologramEchoMaterial,
  buildVisorLedMatrix,
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
      emergenceProgress: number;
      portalStencilActive: boolean;
      fallbackVisible: boolean;
      scrollForEmergence: (u: number) => number;
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

    const reducedMotion =
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
      if (fallbackPosterRef.current) {
        fallbackPosterRef.current.style.display = "flex";
      }
      return;
    }

    const glRenderer = renderer;
    const glCtx = glRenderer.getContext();
    const dbgExt = glCtx.getExtension("WEBGL_debug_renderer_info");
    const rendererLabel = dbgExt ? String(glCtx.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL)) : "";
    const isSoftwareRenderer = /swiftshader|llvmpipe|software/i.test(rendererLabel);

    const initW = Math.max(2, window.innerWidth);
    const initH = Math.max(2, window.innerHeight);
    const isMobileInit = initW < 820;
    const initDpr = Math.min(2, window.devicePixelRatio || 1);

    glRenderer.setPixelRatio(initDpr);
    glRenderer.setSize(initW, initH, false);
    glRenderer.setClearColor(0x000000, 0);
    glRenderer.outputColorSpace = THREE.SRGBColorSpace;
    glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    glRenderer.toneMappingExposure = 1.02;
    glRenderer.shadowMap.enabled = !isMobileInit && !isSoftwareRenderer;
    glRenderer.shadowMap.type = THREE.PCFShadowMap;
    glRenderer.domElement.style.width = "100%";
    glRenderer.domElement.style.height = "100%";
    glRenderer.domElement.style.display = "block";
    hostEl.appendChild(glRenderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
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
    ];

    // -------------------------------------------------------------------------
    // 4. Lazy-Load Licensed Public-Domain GLB Astronaut (`/models/astronaut.glb`)
    // -------------------------------------------------------------------------
    let mainAstro: LoadedAstronautRig | null = null;
    const clones: LoadedAstronautRig[] = [];
    const visorLed = buildVisorLedMatrix(track);
    const hologramEchoMat = buildHologramEchoMaterial(track);
    let unmounted = false;

    const glbPromise = forceAssetFailure
      ? Promise.reject(new Error("Simulated GLB asset failure (?simulateGlbError=1)"))
      : loadLicensedAstronautGlb(visorEnvTarget.texture, isMobileInit, track);

    // -------------------------------------------------------------------------
    // 5. High-Fidelity Single-Draw-Call Downstream Worlds (`Frames 09–20`)
    // -------------------------------------------------------------------------
    const trussSystem = buildArchitecturalTrussTunnel(track, isMobileInit);
    trussSystem.group.visible = false;
    scene.add(trussSystem.group);

    const blueCorridor = buildBlueArchCorridor(track);
    blueCorridor.group.visible = false;
    scene.add(blueCorridor.group);
    scene.add(blueCorridor.monitorStencilMask);

    // Sharp Polygonal Clear Plate-Glass Shards (`Frame 16` Studio Display Shatter!)
    
    // Authentic Lusion pre-calculated 3D glass shards & animation
    let shardsMesh: THREE.Mesh | null = null;
    let numShards = 0;
    let framesPerShard = 0;


    

    const endDecor = buildDiamondsAndPopStickers(track, isMobileInit);
    endDecor.group.visible = false;
    scene.add(endDecor.group);

    
    Promise.all([
      glbPromise,
      import("@/lib/lusion-buf-loader").then((m) => Promise.all([
        m.loadLusionBuf("/assets/models/tunnels/broken_glass.buf"),
        m.loadLusionBuf("/assets/models/tunnels/broken_glass_animation.buf"),
      ]))
    ])
      .then(([{ primary, createClone }, [bg, bga]]) => {
        if (unmounted) return;

        const maxPiece = Math.max(...bg.attributes.piece);
        numShards = maxPiece + 1;
        framesPerShard = Math.floor(bga.header.vertexCount / numShards);
        
        // Assemble authentic pieces into a master geometry
        const baseGeo = bg.geometry;
        const geom = new THREE.InstancedBufferGeometry();
        geom.index = baseGeo.index;
        geom.setAttribute("position", baseGeo.attributes.position);
        geom.setAttribute("aPiece", baseGeo.attributes.piece);
        
        // We will pass the animation frames as a uniform data texture or uniform array if possible, 
        // OR we can just update a single vertex attribute per frame. Given 946 pieces, passing an array of matrices/positions is fine.
        // Actually, to keep it simple, since the shader just needs to read the current frame, 
        // we can instance it? Wait, broken_glass.buf is ONE continuous mesh with a "piece" attribute (0..945).
        // It's NOT an InstancedMesh, it is a single Mesh, but each vertex belongs to a piece.
        // We can upload a DataTexture with the positions of the 946 pieces for the current frame,
        // or we can pass a uniform array of 946 vec3s... but WebGL max uniforms might be exceeded.
        // A floating point DataTexture is safer!
        
        const animData = new Float32Array(bga.attributes.position);
        const animOrient = new Float32Array(bga.attributes.orient);
        
        const mat = track(
          new THREE.ShaderMaterial({
            defines: { USE_SHARDS: 1 },
            transparent: true,
            side: THREE.DoubleSide,
            depthWrite: false,
            uniforms: { 
              uOpacity: { value: 0 },
              uFrameData: { value: null }, 
              uOrientData: { value: null } 
            },
            vertexShader: [
              "attribute float aPiece;",
              "uniform sampler2D uFrameData;",
              "uniform sampler2D uOrientData;",
              "varying vec3 vNormalV;",
              "varying vec3 vPosV;",
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
              "  // Approx normal",
              "  vNormalV = normalize(normalMatrix * applyQuat(normal, q));",
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
              "  float fres = pow(1.0 - abs(dot(N, V)), 1.75);",
              "  float spec = pow(max(dot(N, normalize(vec3(-0.45, 0.72, 0.55))), 0.0), 12.0);",
              "  vec3 glassTint = mix(vec3(0.42, 0.62, 0.98), vec3(0.92, 0.96, 1.0), fres);",
              "  vec3 col = glassTint + vec3(1.9) * spec;",
              "  float alpha = clamp(0.30 + fres * 0.66 + spec, 0.0, 1.0) * uOpacity;",
              "  gl_FragColor = vec4(col, alpha);",
              "}",
            ].join("\n"),
          })
        );
        
        shardsMesh = new THREE.Mesh(geom, mat);
        shardsMesh.visible = false;
        shardsMesh.frustumCulled = false;
        shardsMesh.renderOrder = 12;
        // The data is 946 items. 32x30 texture is 960 items.
        const frameData = new Float32Array(32 * 30 * 4);
        const orientData = new Float32Array(32 * 30 * 4);
        const texFrame = track(new THREE.DataTexture(frameData, 32, 30, THREE.RGBAFormat, THREE.FloatType));
        const texOrient = track(new THREE.DataTexture(orientData, 32, 30, THREE.RGBAFormat, THREE.FloatType));
        texFrame.needsUpdate = true;
        texOrient.needsUpdate = true;
        mat.uniforms.uFrameData.value = texFrame;
        mat.uniforms.uOrientData.value = texOrient;
        
        shardsMesh.userData = { animData, animOrient, texFrame, texOrient, framesPerShard, numShards };
        scene.add(shardsMesh);

        if (unmounted) return;
        mainAstro = primary;
        portalMaskedMaterials.push(...primary.materials);

        // Attach curved dot-matrix LED emoticon display inside `Head` bone (`Frames 18–20`)
        if (primary.bones.Head) {
          primary.bones.Head.add(visorLed.mesh);
        } else {
          primary.root.add(visorLed.mesh);
        }

        applySuitJointPose(primary, SUIT_POSE_TABLET_FLOAT);
        scene.add(primary.root);

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
          const prevDecor = endDecor.group.visible;
          const prevLed = visorLed.mesh.visible;
          trussSystem.group.visible = true;
          blueCorridor.group.visible = true;
          if(shardsMesh) shardsMesh.visible = true;
          endDecor.group.visible = true;
          visorLed.mesh.visible = true;
          if (clones[0]) clones[0].root.visible = true;
          glRenderer.compile(scene, camera);
          trussSystem.group.visible = prevTruss;
          blueCorridor.group.visible = prevBlue;
          if(shardsMesh) shardsMesh.visible = prevShards;
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
        if (unmounted) return;
        const msg = err instanceof Error ? err.message : "Failed to load astronaut.glb";
        tablet3D.group.visible = false;
        earthSystem.group.visible = false;
        if (fallbackPosterRef.current) {
          fallbackPosterRef.current.style.display = "flex";
        }
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
    let targetScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let smoothScrollY = targetScrollY;
    let docVisible = true;
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
      emergenceProgress: 0,
      portalStencilActive: true,
      fallbackVisible: false,
      scrollForEmergence: (u: number) => {
        if (!metrics) measure();
        const m = metrics!;
        return m.emergenceStart + clamp01(u) * m.emergenceSpan;
      },
    };

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

      const baseFontPx = Math.min(Math.max(21, W * 0.0445), 68);
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

      const dpr = Math.min(2, window.devicePixelRatio || 1);
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
      const blackTunnelTo = tunnelStart + tunnelSpan * 0.72;
      const whiteTunnelFrom = blackTunnelTo;
      const whiteTunnelTo = tunnelEnd;
      const astroDropFrom = imgOutTop - H * 0.25;
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
    };

    const _headWorld = new THREE.Vector3();
    const _camLook = new THREE.Vector3();

    const renderSceneAtScroll = (sy: number, elapsedSec: number) => {
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
      const inWhiteStudioWall = tOutPull > 0.35 && tShatter < 0.88 && tWait <= 0.001;
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

      // Exact header polarity:
      // - `ice` (jet-black wordmark) in Frames `01..04`, `16` (white Studio Display wall!), and `#footer-section`
      // - `void` (crisp white wordmark + white sound/menu pills) across `05..15` and `17..19`!
      const wantDarkHeader = uEmergence > 0.45 && !inWhiteStudioWall && !footerWipingMost;
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
          ? lerp(-0.44, 0.0, smoothstep(0.05, 0.68, tOutPull)) * (reducedMotion ? 0.35 : 1.0)
          : 0.0;
        const vortexFovBoost = smoothstep(0.68, 0.80, tTunnel) * (1 - smoothstep(0.81, 0.85, tTunnel)) * 10;
        camera.fov = (m.isMobile ? 54 : 45) + vortexFovBoost;
        camera.aspect = W / H;
        camera.up.set(Math.sin(bankRoll), Math.cos(bankRoll), 0);
        camera.position.set(pxParallax * 0.06, pyParallax * 0.05, 5.2);
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
          : lerp(H * 0.515, -m.imgOutHeight * 0.85, smoothstep(0.85, 0.99, tShatter));

      if (portalMaskActive) {
        backdropEl.style.opacity = "0";
      } else if (tOutPull > 0.02 && tWait <= 0.001) {
        // Pure bright studio wall (`#f7f8fc`) surrounding the Apple Studio Display (`Frame 16`),
        // transitioning cleanly into deep `#000000` space as the astronaut bursts through (`16 -> 17`)!
        const whiteWall = smoothstep(0.14, 0.55, tOutPull) * (1 - smoothstep(0.84, 0.96, tShatter));
        const rCh = Math.round(247 * whiteWall);
        const gCh = Math.round(248 * whiteWall);
        const bCh = Math.round(252 * whiteWall);
        backdropEl.style.opacity = "1";
        backdropEl.style.background = `rgb(${rCh}, ${gCh}, ${bCh})`;
      } else {
        // Pitch-black space across `Frames 05–15` AND throughout `#end-section` (`17 -> 19 -> 18`)!
        backdropEl.style.opacity = "1";
        backdropEl.style.background = "#000000";
      }

      if (tOutPull > 0.02 && tShatter < 0.97 && tWait <= 0.001) {
        const monScale = lerp(2.15, 1.0, smoothstep(0.0, 0.82, tOutPull));
        const monRot = lerp(-0.22, 0.0, smoothstep(0.0, 0.68, tOutPull));
        monitorBezelEl.style.display = "block";
        monitorBezelEl.style.width = `${m.imgOutWidth}px`;
        monitorBezelEl.style.height = `${m.imgOutHeight}px`;
        monitorBezelEl.style.opacity = String(1 - smoothstep(0.86, 0.97, tShatter));
        monitorBezelEl.style.transform = `translate3d(${outCenterX - m.imgOutWidth * 0.5}px, ${
          outBaseY - m.imgOutHeight * 0.5
        }px, 0) rotate(${monRot}rad) scale(${monScale})`;
      } else {
        monitorBezelEl.style.display = "none";
      }

      // -----------------------------------------------------------------------
      // C. "STEP INTO A NEW WORLD / AND LET YOUR / IMAGINATION RUN WILD" (`Frames 06–08`)
      //    Smoothly justifies inter-word gaps on each line from natural single-space (`06`)
      //    out to full `91.2vw` edge-to-edge layout (`08_t09.8s` — 100% inside viewport!),
      //    passing behind the receding astronaut at `08` so the helmet occludes `"LET"`!
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
            kWords > 1 ? Math.max(0, (targetUnscaledWidth - baseW) / (kWords - 1)) : 0;
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

      // Preserve exact orbital high-contrast lighting across `Frames 01–08`, while giving
      // downstream corridors & `#end-section` crisp bright studio spacesuit illumination!
      if (inEmergencePhase) {
        spaceAmbient.intensity = 0.055;
        softFrontFill.intensity = 0.34;
        earthshineFill.intensity = 0.20 + earthVis * 0.24;
      } else if (tTunnel > 0.80 && tWait <= 0.001) {
        // Bright sky-blue window bounce inside the royal-blue arch corridor (`Frames 15 & 16`)
        spaceAmbient.intensity = 0.62;
        softFrontFill.intensity = 1.25;
        earthshineFill.intensity = 0.95;
      } else if (tWait > 0.001 || tShatter > 0.85) {
        // Crisp front-lit Lusion studio spacesuit in `#end-section` (`Frames 17–20`)
        spaceAmbient.intensity = 0.42;
        softFrontFill.intensity = 1.05;
        earthshineFill.intensity = 0.36;
      } else {
        spaceAmbient.intensity = 0.14;
        softFrontFill.intensity = 0.52;
        earthshineFill.intensity = 0.34;
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

      // Chromatic dispersion lens-ring flare:
      // - Preserved untouched in `Frames 05–08` (`kf.ringFlare * 0.34`)
      // - Delicate translucent rainbow spectral rim in `Frame 09` (`0.29`) and gentle corridor dispersion (`0.14`)!
      const entryRing = !inEmergencePhase ? 0.29 * (1 - smoothstep(0.06, 0.16, tTunnel)) : 0;
      const shaftRing =
        !inEmergencePhase
          ? 0.14 * smoothstep(0.12, 0.20, tTunnel) * (1 - smoothstep(0.58, 0.66, tTunnel))
          : 0;
      const ringVis = inEmergencePhase ? kf.ringFlare * 0.34 : Math.max(entryRing, shaftRing);
      optics.chromaticRingMesh.visible = ringVis > 0.002;
      if (optics.chromaticRingMesh.visible) {
        optics.chromaticRingMat.uniforms.uOpacity.value = ringVis;
        optics.chromaticRingMat.uniforms.uAspect.value = W / H;
        optics.chromaticRingMat.uniforms.uRadius.value = inEmergencePhase
          ? m.isMobile
            ? 0.385
            : 0.625
          : m.isMobile
            ? 0.44
            : 0.56;
        optics.chromaticRingMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
      }

      // 1. Downstream Single-Draw-Call GPU-Twisted Architectural Truss & Vortex (`Frames 09 -> 14`)
      const blackIn = !inEmergencePhase ? smoothstep(0.065, 0.135, tTunnel) : 0;
      const blackOut = 1 - smoothstep(0.80, 0.845, tTunnel);
      const blackVis = blackIn * blackOut;
      trussSystem.group.visible = blackVis > 0.005;

      // Seamless white-lavender portal flash bridging `Frame 14 -> Frame 15` (`tTunnel ~ 0.82`)
      const portalFlash =
        !inEmergencePhase
          ? smoothstep(0.785, 0.822, tTunnel) * (1 - smoothstep(0.822, 0.865, tTunnel))
          : 0;
      trussSystem.flashVeilMat.uniforms.uFlash.value = portalFlash;

      if (trussSystem.group.visible) {
        const uPhase = clamp01((tTunnel - 0.10) / 0.68);
        const twistAmt = reducedMotion
          ? smoothstep(0.46, 0.78, tTunnel) * 0.14
          : smoothstep(0.46, 0.62, tTunnel) * 0.092 + smoothstep(0.64, 0.79, tTunnel) * 0.145;
        const vortexPinch = smoothstep(0.67, 0.76, tTunnel);
        trussSystem.tunnelMaterial.uniforms.uOpacity.value = blackVis;
        trussSystem.tunnelMaterial.uniforms.uPhase.value = uPhase;
        trussSystem.tunnelMaterial.uniforms.uTwist.value = twistAmt;
        trussSystem.tunnelMaterial.uniforms.uVortexPinch.value = vortexPinch;
        trussSystem.tunnelMaterial.uniforms.uTravelZ.value = (tTunnel * 44) % trussSystem.baySpacing;
        const emeraldGlow =
          smoothstep(0.47, 0.53, tTunnel) * (1 - smoothstep(0.62, 0.68, tTunnel)) * 0.92;
        const pinkVortexGlow = smoothstep(0.69, 0.755, tTunnel);
        trussSystem.vortexCoreMat.uniforms.uMode.value = smoothstep(0.66, 0.71, tTunnel);
        trussSystem.vortexCoreMat.uniforms.uIntensity.value =
          Math.max(emeraldGlow, pinkVortexGlow) * blackVis;
        if (bloomPass) {
          bloomPass.strength = lerp(0.16, 0.34, smoothstep(0.68, 0.76, tTunnel));
        }
      } else if (bloomPass) {
        bloomPass.strength = 0.16;
      }

      // 2. Downstream Royal-Blue Arch & White-Ring Corridor (`Frames 15 & 16`)
      const whiteIn = !inEmergencePhase ? smoothstep(0.815, 0.85, tTunnel) : 0;
      const whiteOut = 1 - smoothstep(0.86, 0.96, tShatter);
      const whiteVis = whiteIn * whiteOut * (tWait > 0.001 ? 0 : 1);
      blueCorridor.group.visible = whiteVis > 0.008;
      const clipToMonitor = blueCorridor.group.visible && tOutPull > 0.02;
      blueCorridor.setMonitorClip(clipToMonitor);
      blueCorridor.monitorStencilMask.visible = clipToMonitor;

      if (blueCorridor.group.visible) {
        blueCorridor.wallTexture.offset.y = -tTunnel * 2.4;
        const monScale =
          tOutPull > 0.02 ? lerp(2.15, 1.0, smoothstep(0.0, 0.82, tOutPull)) : 1.0;
        const monRot =
          tOutPull > 0.02 ? lerp(-0.22, 0.0, smoothstep(0.0, 0.68, tOutPull)) : 0.0;

        if (clipToMonitor) {
          // Project exact inner screen aperture (`m.imgOutWidth - border*2`) into 3D world space at `z = 0`!
          const borderPx = W < 640 ? 14 : 22;
          const innerW = Math.max(10, (m.imgOutWidth - borderPx * 2) * monScale);
          const innerH = Math.max(10, (m.imgOutHeight - borderPx * 2) * monScale);
          const distZ = camera.position.z;
          const vHalfH = distZ * Math.tan((camera.fov * Math.PI) / 360);
          const vHalfW = vHalfH * (W / H);
          const monNdcX = (outCenterX / W) * 2 - 1;
          const monNdcY = 1 - (outBaseY / H) * 2;
          const monWorldX = camera.position.x + monNdcX * vHalfW;
          const monWorldY = camera.position.y + monNdcY * vHalfH;
          const monWorldW = (innerW / W) * (2 * vHalfW);
          const monWorldH = (innerH / H) * (2 * vHalfH);
          blueCorridor.monitorStencilMask.position.set(monWorldX, monWorldY, 0);
          blueCorridor.monitorStencilMask.rotation.set(0, 0, -monRot);
          blueCorridor.monitorStencilMask.scale.set(monWorldW, monWorldH, 1);
        }

        const monShrink =
          tOutPull > 0.01 ? lerp(1.0, m.isMobile ? 0.62 : 0.84, smoothstep(0.0, 0.82, tOutPull)) : 1.0;
        const tunnelShiftY =
          tOutPull > 0.01 ? ((H * 0.5 - outBaseY) / H) * 4.3 : 0;
        blueCorridor.group.scale.set(monShrink * (m.isMobile ? 0.90 : 1.08), monShrink * 0.95, monShrink);
        blueCorridor.group.position.set(0, tunnelShiftY, tOutPull > 0.01 ? -2.2 : 0);
        blueCorridor.endGlowMat.uniforms.uOpacity.value = whiteVis;
      }

      // 3. Authentic Plate-Glass Shatter Burst (`Frame 16`)
      if (shardsMesh) {
        const shardVis = smoothstep(0.18, 0.42, tShatter) * (1 - smoothstep(0.85, 0.97, tShatter)) * (tWait > 0.001 ? 0 : 1);
        shardsMesh.visible = shardVis > 0.005;
        if (shardsMesh.visible) {
          const mat = shardsMesh.material as THREE.ShaderMaterial;
          mat.uniforms.uOpacity.value = shardVis;
          
          const burst = smoothstep(0.18, 0.82, tShatter);
          const { animData, animOrient, texFrame, texOrient, framesPerShard, numShards } = shardsMesh.userData;
          
          // burst 0..1 maps to frame 0..framesPerShard-1
          const targetFrame = clamp01(burst) * (framesPerShard - 1);
          const iF = Math.floor(targetFrame);
          const iN = Math.min(framesPerShard - 1, iF + 1);
          const fT = targetFrame - iF;
          
          const fd = texFrame.image.data;
          const od = texOrient.image.data;
          
          for (let p = 0; p < numShards; p++) {
            // The animation buffer appears to be piece-major: piece 0 frames 0..N, piece 1 frames 0..N
            const idx0 = (p * framesPerShard + iF);
            const idx1 = (p * framesPerShard + iN);
            
            fd[p*4+0] = lerp(animData[idx0*3+0], animData[idx1*3+0], fT);
            fd[p*4+1] = lerp(animData[idx0*3+1], animData[idx1*3+1], fT);
            fd[p*4+2] = lerp(animData[idx0*3+2], animData[idx1*3+2], fT) + 1.25; // Z offset
            
            // simple slerp approximation for orientation since it's just debris
            od[p*4+0] = lerp(animOrient[idx0*4+0], animOrient[idx1*4+0], fT);
            od[p*4+1] = lerp(animOrient[idx0*4+1], animOrient[idx1*4+1], fT);
            od[p*4+2] = lerp(animOrient[idx0*4+2], animOrient[idx1*4+2], fT);
            od[p*4+3] = lerp(animOrient[idx0*4+3], animOrient[idx1*4+3], fT);
          }
          texFrame.needsUpdate = true;
          texOrient.needsUpdate = true;
        }
      }

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
          const driftAmp = reducedMotion || portalFollow > 0.05 ? 0 : 1;
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
          const vortexShrink = smoothstep(0.66, 0.78, tTunnel) * (1 - inBlueDive);

          const trussPose = blendSuitPose(
            blendSuitPose(SUIT_POSE_TUMBLE_SPREAD, SUIT_POSE_TUMBLE_CURL, intoCurl),
            SUIT_POSE_TUMBLE_SPREAD,
            midInvert
          );
          jointPose = blendSuitPose(trussPose, SUIT_POSE_CORRIDOR_FLY, inBlueDive);

          ax = lerp(0.0, 0.04, inBlueDive);
          ay = lerp(0.0, -0.02, inBlueDive);
          az = lerp(-1.12 - vortexShrink * 4.2, -1.25, inBlueDive);

          const trussRy = lerp(-Math.PI, -Math.PI * 0.55, intoCurl);
          const trussRz = intoCurl * (-1.15 - tTunnel * 3.1);
          rx = lerp(0.18, 0.24, inBlueDive);
          ry = lerp(trussRy, 0.14, inBlueDive);
          rz = lerp(trussRz, -0.28, inBlueDive);
          aScale = lerp(
            lerp(0.62, 0.58, intoCurl) * (1 - vortexShrink * 0.60),
            0.66,
            inBlueDive
          );
          visorFlareAmt = 0;
        } else if (tWait <= 0.001) {
          // `Frame 16` (`16-monitor-glass-shatter`) -> `Frame 17` (`17-astronaut-stickers-wait`):
          // Astronaut bursts forward through the Studio Display screen with BOTH ARMS RAISED
          // (`SUIT_POSE_SHATTER_BREAK`) and settles smoothly into visor salute (`SUIT_POSE_VISOR_SALUTE`)!
          const burst = smoothstep(0.14, 0.62, tShatter);
          const settleSalute = smoothstep(0.84, 1.0, tShatter);
          jointPose = blendSuitPose(
            blendSuitPose(SUIT_POSE_CORRIDOR_FLY, SUIT_POSE_SHATTER_BREAK, burst),
            SUIT_POSE_VISOR_SALUTE,
            settleSalute
          );
          ax = pxParallax * 0.05;
          ay = lerp(-0.18, m.isMobile ? -0.18 : -0.32, lerp(burst * 0.65, 1.0, settleSalute));
          az = lerp(-1.25, m.isMobile ? 0.68 : 1.72, burst);
          az = lerp(az, m.isMobile ? 1.24 : 2.66, settleSalute);
          rx = lerp(0.18, 0.0, burst) - pyParallax * 0.04;
          ry = lerp(0.10, 0.0, burst) + pxParallax * 0.06;
          rz = lerp(-0.14, 0.0, burst);
          aScale = lerp(0.72, 1.0, burst);
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
          ay = (m.isMobile ? -0.18 : -0.32) + (reducedMotion ? 0 : Math.sin(elapsedSec * 1.1) * 0.018);
          az = m.isMobile ? 1.24 : 2.66;
          rx = -pyParallax * 0.04;
          ry = pxParallax * 0.07 + (reducedMotion ? 0 : Math.sin(elapsedSec * 0.65) * 0.035);
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

        applySuitJointPose(mainAstro, jointPose);
        mainAstro.root.position.set(ax, ay, az);
        mainAstro.root.rotation.set(rx, ry, rz);
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
            const spiralA = tTunnel * 8.5 + c * 1.57;
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

      if (composer) {
        composer.render(1 / 60);
      } else {
        glRenderer.render(scene, camera);
      }

      const dtMs = performance.now() - t0;
      if (window.__goalAstronautTelemetry) {
        window.__goalAstronautTelemetry.drawCalls = glRenderer.info.render.calls;
        window.__goalAstronautTelemetry.triangles = glRenderer.info.render.triangles;
        window.__goalAstronautTelemetry.lastFrameMs = +dtMs.toFixed(2);
        window.__goalAstronautTelemetry.emergenceProgress = +uEmergence.toFixed(4);
        window.__goalAstronautTelemetry.portalStencilActive = portalMaskActive;
      }
    };

    const tick = () => {
      if (!docVisible || unmounted) {
        rafId = 0;
        return;
      }
      targetScrollY = window.scrollY;
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
        smoothScrollY += diff * 0.34;
        if (Math.abs(targetScrollY - smoothScrollY) < 0.12) {
          smoothScrollY = targetScrollY;
        }
      }

      pointerSmooth.x += (pointerTarget.x - pointerSmooth.x) * 0.075;
      pointerSmooth.y += (pointerTarget.y - pointerSmooth.y) * 0.075;

      renderSceneAtScroll(smoothScrollY, (performance.now() - startClock) * 0.001);

      if (reducedMotion && smoothScrollY === targetScrollY) {
        rafId = 0;
        return;
      }
      rafId = window.requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!rafId && docVisible && !unmounted) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

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
      measure();
      renderSceneAtScroll(window.scrollY, (performance.now() - startClock) * 0.001);
    };

    const onVisibility = () => {
      docVisible = document.visibilityState === "visible";
      ensureLoop();
    };

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
      unmounted = true;
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("resize", onResize);
      document.addEventListener("visibilitychange", onVisibility);

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
    };
  }, [setActiveSurface]);

  return (
    <section
      ref={goalRef}
      id="home-goal"
      aria-label="Our Goal"
      className="relative w-full bg-[#eff0f9] text-[#111319]"
    >
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
              className="w-full min-[820px]:w-[34.5%] min-[820px]:mr-[6.5vw] space-y-4 min-[820px]:space-y-6 font-sans text-[clamp(0.92rem,1.22vw,1.16rem)] font-normal leading-[1.38] text-[#151821] will-change-transform"
            >
              {LUSION_HOME.goal.paragraphs.map((para, idx) => (
                <p key={idx} className="home-goal-texts-paragraph">
                  <span className="home-goal-texts-p block">{para}</span>
                </p>
              ))}
            </div>

            {/* Layout slot matching exact Frame 01 46% width & 1.391:1 iPad Pro aspect ratio (`left = 5%..51%`) */}
            <div
              ref={imgInRef}
              id="home-goal-image-in"
              className="relative w-full min-[820px]:w-[46%] aspect-[1.391/1] rounded-[24px] bg-transparent"
            >
              {/* Graceful Loading / Asset-Failure / Non-WebGL Fallback Poster */}
              <div
                ref={fallbackPosterRef}
                data-testid="goal-astronaut-fallback"
                style={{ display: "none" }}
                className="h-full w-full items-center justify-center rounded-[24px] bg-gradient-to-b from-[#04060d] via-[#081738] to-[#1748b8] p-8 text-center text-white shadow-[0_28px_70px_rgba(8,12,28,0.35)]"
              >
                <p className="font-sans text-lg uppercase tracking-[0.08em]">
                  Step into a new world and let your imagination run wild
                </p>
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

        {/* Downstream Exit Apple Studio Display Chassis (`Frame 16` — `z-[8]` behind `<canvas>` `z-[10]` so the 3D astronaut & shards burst physically over the bezel & `#f7f8fc` white wall!) */}
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

          {/* Transparent Screen Opening Framed by Glossy Black Studio Display Bezel + Webcam Dot + Radial Glass Cracks */}
          <div className="relative h-full w-full rounded-[14px] border-[14px] border-[#050609] bg-transparent shadow-[0_28px_80px_rgba(10,16,44,0.28)] sm:rounded-[20px] sm:border-[22px]">
            <span
              aria-hidden="true"
              className="absolute -top-[9px] left-1/2 h-[5px] w-[5px] -translate-x-1/2 rounded-full bg-[#1b2234] sm:-top-[14px] sm:h-[6px] sm:w-[6px]"
            />
            <svg
              aria-hidden="true"
              viewBox="0 0 1000 600"
              fill="none"
              className="pointer-events-none h-full w-full opacity-85"
            >
              <path
                d="M500 295 L180 42 M500 295 L830 58 M500 295 L965 280 M500 295 L845 555 M500 295 L490 590 M500 295 L145 545 M500 295 L35 265 M360 185 L435 120 L545 145 M635 205 L710 290 L615 395 M385 395 L295 315 L360 185"
                stroke="rgba(235, 245, 255, 0.72)"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
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
              className="home-goal-tunnel-title-line flex flex-row items-center justify-center font-sans text-[clamp(1.32rem,4.45vw,4.25rem)] font-normal uppercase leading-[1.22] text-white"
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
