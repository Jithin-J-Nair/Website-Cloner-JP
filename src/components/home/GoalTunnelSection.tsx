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
  SUIT_POSE_PROFILE_GLIDE,
  SUIT_POSE_STANDING,
  SUIT_POSE_TABLET_FLOAT,
  SUIT_POSE_ZERO_G_FLOAT,
  type LoadedAstronautRig,
  type SuitJointPose,
} from "@/components/home/AstronautEmergenceAssets";

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

/**
 * Procedural organic cloud-Voronoi wall texture for the downstream tunnel section (`whiteTunnel`).
 * Preserved untouched in behavior for downstream homepage sections after the text emergence stage.
 */
function createVoronoiTunnelTexture(): THREE.CanvasTexture {
  const S = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, "#1933ff");
  grad.addColorStop(0.5, "#152bf2");
  grad.addColorStop(1, "#1e3bff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = "rgba(8, 16, 115, 0.36)";
  ctx.lineWidth = 3;
  for (const xFrac of [0.24, 0.52, 0.78]) {
    ctx.beginPath();
    ctx.moveTo(S * xFrac, 0);
    ctx.lineTo(S * xFrac, S);
    ctx.stroke();
  }

  let seed = 918273;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const drawCloudRing = (cx: number, cy: number, baseR: number, lobes: number, rotOff: number) => {
    ctx.save();
    ctx.translate(cx + 6, cy + 8);
    ctx.fillStyle = "rgba(8, 18, 130, 0.42)";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = rotOff + (i / lobes) * Math.PI * 2;
      const lr = baseR * (0.42 + 0.16 * Math.sin(i * 2.1));
      const px = Math.cos(a) * baseR * 0.74;
      const py = Math.sin(a) * baseR * 0.74;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#e6ecff";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = rotOff + (i / lobes) * Math.PI * 2;
      const lr = baseR * (0.44 + 0.16 * Math.sin(i * 2.1));
      const px = Math.cos(a) * baseR * 0.74;
      const py = Math.sin(a) * baseR * 0.74;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();

    ctx.fillStyle = "#1933ff";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = rotOff + (i / lobes) * Math.PI * 2;
      const lr = baseR * (0.27 + 0.11 * Math.sin(i * 2.1));
      const px = Math.cos(a) * baseR * 0.56;
      const py = Math.sin(a) * baseR * 0.56;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  };

  for (const [fx, fy, fr, lobes] of [
    [0.24, 0.24, 0.19, 6],
    [0.76, 0.34, 0.17, 5],
    [0.32, 0.74, 0.2, 6],
  ]) {
    drawCloudRing(fx * S, fy * S, fr * S, lobes, rnd() * Math.PI * 2);
  }

  ctx.lineWidth = S * 0.032;
  ctx.strokeStyle = "#eef2ff";
  for (const [rx, ry, rr] of [
    [0.72, 0.78, 0.11],
    [0.2, 0.56, 0.085],
    [0.58, 0.16, 0.075],
  ]) {
    ctx.beginPath();
    ctx.arc(rx * S, ry * S, rr * S, 0, Math.PI * 2);
    ctx.stroke();
  }

  for (const [gx, gy, gw, gh] of [
    [0.14, 0.62, 0.085, 0.24],
    [0.86, 0.62, 0.085, 0.24],
  ]) {
    const glow = ctx.createRadialGradient(gx * S, gy * S, 6, gx * S, gy * S, gh * S * 1.15);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.55, "rgba(190,220,255,0.65)");
    glow.addColorStop(1, "rgba(25,51,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(gx * S, gy * S, gw * S * 2.2, gh * S * 1.15, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    const x0 = (gx - gw * 0.5) * S;
    const y0 = (gy - gh * 0.5) * S;
    const w0 = gw * S;
    const h0 = gh * S;
    ctx.beginPath();
    ctx.arc(gx * S, y0 + w0 * 0.5, w0 * 0.5, Math.PI, 0);
    ctx.lineTo(x0 + w0, y0 + h0);
    ctx.lineTo(x0, y0 + h0);
    ctx.closePath();
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createStickerTexture(kind: number): THREE.CanvasTexture {
  const S = 192;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const strokeWhiteBorder = (drawFn: () => void) => {
    ctx.save();
    drawFn();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 13;
    ctx.stroke();
    drawFn();
    ctx.strokeStyle = "#0b0d14";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
  };

  if (kind === 0) {
    const path = () => {
      ctx.beginPath();
      ctx.arc(88, 96, 48, 0.35, Math.PI * 1.85);
      ctx.quadraticCurveTo(156, 78, 152, 92);
      ctx.quadraticCurveTo(132, 98, 158, 112);
      ctx.quadraticCurveTo(128, 118, 146, 132);
      ctx.closePath();
    };
    strokeWhiteBorder(path);
    path();
    ctx.fillStyle = "#b8f218";
    ctx.fill();
    ctx.fillStyle = "#0b0d14";
    ctx.beginPath();
    ctx.ellipse(72, 86, 6, 10, -0.2, 0, Math.PI * 2);
    ctx.ellipse(98, 96, 6, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 1) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(64, 42);
      ctx.quadraticCurveTo(112, 34, 134, 62);
      ctx.lineTo(92, 154);
      ctx.closePath();
    };
    strokeWhiteBorder(path);
    path();
    ctx.fillStyle = "#e6392f";
    ctx.fill();
    ctx.fillStyle = "#f4a259";
    ctx.beginPath();
    ctx.ellipse(99, 52, 36, 11, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2ec44d";
    ctx.beginPath();
    ctx.arc(95, 92, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 2) {
    const path = () => {
      ctx.beginPath();
      ctx.arc(86, 78, 28, 0, Math.PI * 2);
      ctx.moveTo(128, 112);
      ctx.arc(100, 112, 28, 0, Math.PI * 2);
    };
    strokeWhiteBorder(path);
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(86, 78, 26, 0, Math.PI * 2);
    ctx.arc(100, 112, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(94, 78, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b0d14";
    ctx.beginPath();
    ctx.arc(96, 78, 5, 0, Math.PI * 2);
    ctx.arc(110, 112, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 3) {
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(72, 42);
      ctx.lineTo(106, 110);
      ctx.moveTo(140, 126);
      ctx.arc(112, 126, 28, 0, Math.PI * 2);
    };
    strokeWhiteBorder(path);
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(72, 42);
    ctx.lineTo(106, 110);
    ctx.stroke();
    ctx.fillStyle = "#f43f6e";
    ctx.beginPath();
    ctx.arc(112, 126, 26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const path = () => {
      ctx.beginPath();
      ctx.arc(96, 108, 26, 0, Math.PI * 2);
      ctx.moveTo(130, 82);
      ctx.ellipse(96, 82, 34, 13, -0.25, 0, Math.PI * 2);
    };
    strokeWhiteBorder(path);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(96, 108, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.ellipse(96, 82, 32, 11, -0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

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
    let plumeGroup: THREE.Group | null = null;
    let plumeMat: THREE.ShaderMaterial | null = null;
    let unmounted = false;

    const plumeShader = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 0 } },
        vertexShader: `
          varying vec2 vUv;
          uniform float uTime;
          void main() {
            vUv = uv;
            vec3 p = position;
            p.x *= pow(1.0 - uv.y, 0.65);
            p.x += sin(uv.y * 7.0 - uTime * 3.2) * 0.035 * uv.y;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uOpacity;
          void main() {
            float cx = abs(vUv.x - 0.5) * 2.0;
            float core = smoothstep(1.0, 0.08, cx) * smoothstep(1.0, 0.06, vUv.y);
            float rim = smoothstep(0.95, 0.55, cx) * (1.0 - smoothstep(0.55, 0.15, cx));
            vec3 col = mix(vec3(0.06, 0.28, 1.0), vec3(0.65, 0.85, 1.0), core);
            col += vec3(0.85, 0.35, 0.12) * rim * 0.45;
            float a = (core * 0.92 + rim * 0.35) * uOpacity * smoothstep(0.0, 0.14, vUv.y);
            gl_FragColor = vec4(col, a);
          }
        `,
      })
    );
    plumeMat = plumeShader;

    const glbPromise = forceAssetFailure
      ? Promise.reject(new Error("Simulated GLB asset failure (?simulateGlbError=1)"))
      : loadLicensedAstronautGlb(visorEnvTarget.texture, isMobileInit, track);

    glbPromise
      .then(({ primary, createClone }) => {
        if (unmounted) return;
        mainAstro = primary;
        portalMaskedMaterials.push(...primary.materials);

        const pg = new THREE.Group();
        pg.position.set(0, 0.22, 0.02);
        pg.visible = false;
        const pPlaneA = new THREE.Mesh(
          track(new THREE.PlaneGeometry(0.15, 0.36, 8, 18)),
          plumeShader
        );
        pPlaneA.position.y = 0.06;
        const pPlaneB = pPlaneA.clone();
        pPlaneB.rotation.y = Math.PI * 0.42;
        pg.add(pPlaneA, pPlaneB);
        if (primary.bones.Head) {
          primary.bones.Head.add(pg);
        } else {
          primary.root.add(pg);
        }
        plumeGroup = pg;

        applySuitJointPose(primary, SUIT_POSE_TABLET_FLOAT);
        scene.add(primary.root);

        for (let c = 0; c < 4; c++) {
          const cl = createClone();
          cl.root.visible = false;
          applySuitJointPose(cl, SUIT_POSE_PROFILE_GLIDE);
          scene.add(cl.root);
          clones.push(cl);
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
        // Hide WebGL tablet chassis when GLB asset is unavailable so clean DOM fallback poster shows cleanly
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
    // 5. Downstream Tunnel Sections (`blackTunnel`, `whiteTunnel`, `#end-section`)
    //    Preserved completely untouched after the text emergence sequence.
    // -------------------------------------------------------------------------
    const blackTunnelGroup = new THREE.Group();
    blackTunnelGroup.visible = false;
    scene.add(blackTunnelGroup);

    const greebleMat = track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#9ba6b8"),
        roughness: 0.26,
        metalness: 0.78,
      })
    );
    const greebleBoxGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const PANEL_COUNT = 560;
    const greeblePanels = new THREE.InstancedMesh(greebleBoxGeo, greebleMat, PANEL_COUNT);
    const dummy = new THREE.Object3D();
    const panelColor = new THREE.Color();
    for (let i = 0; i < PANEL_COUNT; i++) {
      const bay = Math.floor(i / 20);
      const part = i % 20;
      const halfSpan = 1.42;
      const baySpacing = 1.28;
      const z = 3.8 - bay * baySpacing;
      dummy.rotation.set(0, 0, 0);

      if (part < 4) {
        const cx = part % 2 === 0 ? -halfSpan : halfSpan;
        const cy = part < 2 ? halfSpan : -halfSpan;
        dummy.position.set(cx, cy, z - baySpacing * 0.5);
        dummy.scale.set(0.085, 0.085, baySpacing * 1.04);
      } else if (part < 8) {
        const side = part - 4;
        if (side === 0) {
          dummy.position.set(0, halfSpan, z);
          dummy.scale.set(halfSpan * 2.04, 0.075, 0.075);
        } else if (side === 1) {
          dummy.position.set(0, -halfSpan, z);
          dummy.scale.set(halfSpan * 2.04, 0.075, 0.075);
        } else if (side === 2) {
          dummy.position.set(-halfSpan, 0, z);
          dummy.scale.set(0.075, halfSpan * 2.04, 0.075);
        } else {
          dummy.position.set(halfSpan, 0, z);
          dummy.scale.set(0.075, halfSpan * 2.04, 0.075);
        }
      } else if (part < 16) {
        const braceIdx = part - 8;
        const wall = Math.floor(braceIdx / 2);
        const dir = braceIdx % 2 === 0 ? 1 : -1;
        const diagLen = Math.hypot(halfSpan * 2, baySpacing);
        const ang = Math.atan2(baySpacing, halfSpan * 2) * dir;
        if (wall === 0) {
          dummy.position.set(0, halfSpan, z - baySpacing * 0.5);
          dummy.rotation.set(0, ang, 0);
          dummy.scale.set(diagLen, 0.042, 0.042);
        } else if (wall === 1) {
          dummy.position.set(0, -halfSpan, z - baySpacing * 0.5);
          dummy.rotation.set(0, ang, 0);
          dummy.scale.set(diagLen, 0.042, 0.042);
        } else if (wall === 2) {
          dummy.position.set(-halfSpan, 0, z - baySpacing * 0.5);
          dummy.rotation.set(ang, 0, 0);
          dummy.scale.set(0.042, diagLen, 0.042);
        } else {
          dummy.position.set(halfSpan, 0, z - baySpacing * 0.5);
          dummy.rotation.set(ang, 0, 0);
          dummy.scale.set(0.042, diagLen, 0.042);
        }
      } else {
        const cIdx = part - 16;
        const gx = cIdx % 2 === 0 ? -halfSpan * 0.88 : halfSpan * 0.88;
        const gy = cIdx < 2 ? halfSpan * 0.88 : -halfSpan * 0.88;
        dummy.position.set(gx, gy, z - 0.25);
        dummy.scale.set(0.18, 0.14, 0.22);
      }

      dummy.updateMatrix();
      greeblePanels.setMatrixAt(i, dummy.matrix);

      if (part >= 16 && (bay + part) % 3 === 0) {
        panelColor.setRGB(1.35, 1.85, 2.0);
      } else {
        const g = 0.42 + ((i * 13) % 7) * 0.055;
        panelColor.setRGB(g * 0.96, g, g * 1.08);
      }
      greeblePanels.setColorAt(i, panelColor);
    }
    greeblePanels.instanceMatrix.needsUpdate = true;
    if (greeblePanels.instanceColor) greeblePanels.instanceColor.needsUpdate = true;
    blackTunnelGroup.add(greeblePanels);

    const tunnelCoolLight = new THREE.PointLight(0xa5f3fc, 0, 26, 1.35);
    tunnelCoolLight.position.set(0, 0.2, 1.2);
    blackTunnelGroup.add(tunnelCoolLight);

    const tunnelMagentaNear = new THREE.PointLight(0xff2a85, 0, 24, 1.25);
    tunnelMagentaNear.position.set(-0.6, 0.4, 1.8);
    blackTunnelGroup.add(tunnelMagentaNear);

    const tunnelVioletMid = new THREE.PointLight(0xd946ef, 0, 32, 1.25);
    tunnelVioletMid.position.set(0.6, -0.4, -7.5);
    blackTunnelGroup.add(tunnelVioletMid);

    const portalRingMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
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
            float r = length(p);
            float ringR = exp(-pow((r - 0.84) * 9.5, 2.0));
            float ringG = exp(-pow((r - 0.815) * 9.5, 2.0));
            float ringB = exp(-pow((r - 0.79) * 9.5, 2.0));
            vec3 col = vec3(ringR * 0.20, ringG * 0.14, ringB * 0.16);
            float a = clamp(max(max(ringR, ringG), ringB), 0.0, 1.0) * uOpacity;
            gl_FragColor = vec4(col, a);
          }
        `,
      })
    );
    const portalPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(8.6, 8.6)), portalRingMat);
    portalPlane.position.set(0, 0, -1.6);
    blackTunnelGroup.add(portalPlane);

    const whiteTunnelGroup = new THREE.Group();
    whiteTunnelGroup.visible = false;
    scene.add(whiteTunnelGroup);

    const voronoiTex = track(createVoronoiTunnelTexture());
    const whiteTunnelWallMat = track(
      new THREE.MeshBasicMaterial({ map: voronoiTex, side: THREE.BackSide })
    );
    const TUNNEL_SEG_LEN = 46;
    const whiteBoxGeo = track(new THREE.BoxGeometry(7.8, 5.2, TUNNEL_SEG_LEN, 1, 1, 8));
    const boxUv = whiteBoxGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < boxUv.count; i++) {
      const faceIdx = Math.floor(i / 4);
      if (faceIdx < 4) {
        const u = boxUv.getX(i);
        const v = boxUv.getY(i);
        if (faceIdx < 2) boxUv.setXY(i, u * 1.35, v * 0.85);
        else boxUv.setXY(i, u * 0.95, v * 1.35);
      }
    }
    boxUv.needsUpdate = true;

    const whiteTunnelShaft = new THREE.Mesh(whiteBoxGeo, whiteTunnelWallMat);
    whiteTunnelShaft.position.set(0, 0, -TUNNEL_SEG_LEN * 0.46);
    whiteTunnelGroup.add(whiteTunnelShaft);

    const archPortalMat = track(new THREE.MeshBasicMaterial({ color: 0xffffff }));
    const archPilasterMat = track(new THREE.MeshBasicMaterial({ color: 0x1638f0 }));
    for (let i = 0; i < 6; i++) {
      const zPos = 1.6 - i * 7.2;
      for (const side of [-1, 1]) {
        const portal = new THREE.Group();
        const lower = new THREE.Mesh(track(new THREE.PlaneGeometry(2.3, 2.2)), archPortalMat);
        lower.position.y = -1.35;
        const archTop = new THREE.Mesh(
          track(new THREE.CircleGeometry(1.15, 18, 0, Math.PI)),
          archPortalMat
        );
        archTop.position.y = -0.25;
        portal.add(lower, archTop);
        portal.position.set(side * 3.84, 0, zPos);
        portal.rotation.y = -side * (Math.PI / 2);
        whiteTunnelGroup.add(portal);

        const pilaster = new THREE.Mesh(track(new THREE.BoxGeometry(0.42, 5.2, 1.05)), archPilasterMat);
        pilaster.position.set(side * 3.66, 0, zPos - 2.0);
        whiteTunnelGroup.add(pilaster);
      }
    }

    const whiteEndGlowMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uOpacity: { value: 1 } },
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
            float d = length(vUv - 0.5) * 2.0;
            float core = smoothstep(0.95, 0.08, d);
            vec3 col = mix(vec3(0.10, 0.22, 1.0), vec3(1.0, 1.0, 1.0), pow(core, 0.65));
            gl_FragColor = vec4(col, uOpacity);
          }
        `,
      })
    );
    const whiteEndCap = new THREE.Mesh(track(new THREE.PlaneGeometry(7.2, 7.2)), whiteEndGlowMat);
    whiteEndCap.position.set(0, 0, -25.0);
    whiteTunnelGroup.add(whiteEndCap);

    const SHARD_COUNT = 112;
    const shardGeo = track(new THREE.ConeGeometry(0.19, 0.44, 3));
    shardGeo.scale(1.0, 1.0, 0.09);
    const shardMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: { uOpacity: { value: 0 }, uTime: { value: 0 } },
        vertexShader: `
          varying vec3 vNormalV;
          varying vec3 vPosV;
          void main() {
            vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            vPosV = mv.xyz;
            vNormalV = normalize(normalMatrix * mat3(instanceMatrix) * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vNormalV;
          varying vec3 vPosV;
          uniform float uOpacity;
          void main() {
            vec3 V = normalize(-vPosV);
            float fres = pow(1.0 - abs(dot(normalize(vNormalV), V)), 1.65);
            vec3 deep = vec3(0.12, 0.28, 0.98);
            vec3 cyan = vec3(0.42, 0.86, 1.0);
            vec3 violet = vec3(0.68, 0.46, 1.0);
            vec3 col = mix(deep, mix(cyan, violet, vNormalV.x * 0.5 + 0.5), fres * 0.92 + 0.18);
            col += vec3(1.0) * pow(fres, 4.0) * 0.65;
            gl_FragColor = vec4(col, (0.48 + fres * 0.48) * uOpacity);
          }
        `,
      })
    );
    const shardsMesh = new THREE.InstancedMesh(shardGeo, shardMat, SHARD_COUNT);
    shardsMesh.visible = false;
    shardsMesh.frustumCulled = false;
    scene.add(shardsMesh);

    const shardSeeds = Array.from({ length: SHARD_COUNT }, (_, i) => {
      const a = (i / SHARD_COUNT) * Math.PI * 2 * 3.7;
      const rad = 0.74 + (((i * 37) % 100) / 100) * 1.68;
      return {
        dirX: Math.cos(a) * rad * 1.45,
        dirY: Math.sin(a) * rad * 0.92,
        dirZ: 0.45 + (((i * 19) % 100) / 100) * 2.25,
        rotX: ((i * 13) % 10) * 0.6,
        rotY: ((i * 29) % 10) * 0.6,
        rotZ: a,
        scale: 0.55 + (((i * 23) % 100) / 100) * 1.25,
      };
    });

    const waitDecorGroup = new THREE.Group();
    waitDecorGroup.visible = false;
    scene.add(waitDecorGroup);

    const diamondGeo = track(new THREE.OctahedronGeometry(0.085, 0));
    const diamondMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#dbeafe"),
        emissive: new THREE.Color("#60a5fa"),
        emissiveIntensity: 0.35,
        roughness: 0.08,
        metalness: 0.35,
        clearcoat: 1.0,
      })
    );
    const DIAMOND_COUNT = 22;
    const diamondAnchors: Array<[number, number, number, number]> = [];
    for (let i = 0; i < DIAMOND_COUNT; i++) {
      const angle = (i / DIAMOND_COUNT) * Math.PI * 2 + 0.3;
      const radiusX = 1.05 + ((i * 31) % 7) * 0.34;
      const py = -1.55 + ((i * 17) % 11) * 0.31;
      const pz = -0.6 - ((i * 13) % 5) * 0.45;
      const dm = new THREE.Mesh(diamondGeo, diamondMat);
      dm.position.set(Math.cos(angle) * radiusX, py, pz);
      const sc = 0.55 + ((i * 7) % 5) * 0.16;
      dm.scale.set(sc, sc * 0.72, sc);
      waitDecorGroup.add(dm);
      diamondAnchors.push([dm.position.x, dm.position.y, dm.position.z, i]);
    }

    const stickerMeshes: Array<{
      mesh: THREE.Mesh;
      baseX: number;
      baseY: number;
      baseZ: number;
      phase: number;
    }> = [];
    for (const [sx, sy, sz, kind] of [
      [-2.18, -0.82, 0.35, 0],
      [-1.72, -1.24, 0.42, 1],
      [-1.18, -1.02, 0.3, 2],
      [1.08, -0.96, 0.36, 3],
      [2.26, -0.68, 0.25, 4],
      [-1.06, 0.92, -0.35, 3],
      [-0.48, 0.02, -0.25, 0],
    ]) {
      const stTex = track(createStickerTexture(kind));
      const stMat = track(
        new THREE.MeshBasicMaterial({ map: stTex, transparent: true, depthWrite: false })
      );
      const stMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(0.42, 0.42)), stMat);
      stMesh.position.set(sx, sy, sz);
      waitDecorGroup.add(stMesh);
      stickerMeshes.push({ mesh: stMesh, baseX: sx, baseY: sy, baseZ: sz, phase: sx * 1.7 + sy });
    }

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
      const activeEnd = m.endTop + m.endHeight;

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

      // Exact `TIMELINE.md` header switch: dark wordmark in Frames `01..04`, crisp white in Frames `05..08`!
      const wantDarkHeader = uEmergence > 0.45;
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
        camera.fov = m.isMobile ? 54 : 45;
        camera.aspect = W / H;
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
      // B. Backdrop & Downstream Monitor Chassis
      // -----------------------------------------------------------------------
      const outCenterX = m.imgOutLeft + m.imgOutWidth * 0.5;
      const outBaseY =
        tShatter <= 0.001
          ? lerp(H * 0.5, H * 0.47, tOutPull)
          : lerp(H * 0.47, -m.imgOutHeight * 0.9, smoothstep(0.55, 1.0, tShatter));

      if (portalMaskActive) {
        backdropEl.style.opacity = "0";
      } else if (tOutPull > 0.01 && tWait <= 0.001) {
        const indigoFade = 1 - smoothstep(0.62, 0.98, tShatter);
        backdropEl.style.opacity = "1";
        backdropEl.style.background = `radial-gradient(ellipse 68% 58% at 50% 48%, rgba(28, 44, 152, ${(
          0.92 * indigoFade
        ).toFixed(3)}) 0%, rgba(10, 16, 62, ${(0.95 * indigoFade).toFixed(3)}) 48%, #000000 100%)`;
      } else if (tWait > 0.001) {
        backdropEl.style.opacity = "0";
      } else {
        backdropEl.style.opacity = "1";
        backdropEl.style.background = "#000000";
      }

      if (tOutPull > 0.02 && tShatter < 0.94) {
        const monScale = lerp(2.35, 1.0, smoothstep(0.0, 0.86, tOutPull));
        const monRot = lerp(-0.26, 0.0, smoothstep(0.0, 0.72, tOutPull));
        monitorBezelEl.style.display = "block";
        monitorBezelEl.style.width = `${m.imgOutWidth}px`;
        monitorBezelEl.style.height = `${m.imgOutHeight}px`;
        monitorBezelEl.style.opacity = String(1 - smoothstep(0.76, 0.94, tShatter));
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
      // D. Earth Limb, Open-Space Halo, Chromatic Lens-Ring Flare, & Tunnels
      // -----------------------------------------------------------------------
      const earthVis = inEmergencePhase ? kf.earthOpacity : 0;
      earthSystem.group.visible = earthVis > 0.004;
      earthshineFill.intensity = 0.20 + earthVis * 0.24;

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

      // Chromatic dispersion lens-ring flare (`Frames 05–08`, inner warm amber -> cream -> outer cyan/blue)
      const ringVis = inEmergencePhase ? kf.ringFlare * 0.34 : 0;
      optics.chromaticRingMesh.visible = ringVis > 0.002;
      if (optics.chromaticRingMesh.visible) {
        optics.chromaticRingMat.uniforms.uOpacity.value = ringVis;
        optics.chromaticRingMat.uniforms.uAspect.value = W / H;
        optics.chromaticRingMat.uniforms.uRadius.value = m.isMobile ? 0.385 : 0.625;
        optics.chromaticRingMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
      }

      // Downstream Steel Truss Corridor (`blackTunnel`)
      const blackIn = !inEmergencePhase ? smoothstep(0.02, 0.16, tTunnel) : 0;
      const blackOut = 1 - smoothstep(0.74, 0.84, tTunnel);
      const blackVis = blackIn * blackOut;
      blackTunnelGroup.visible = blackVis > 0.01;
      if (blackTunnelGroup.visible) {
        const travel = (tTunnel * 42) % 1.28;
        blackTunnelGroup.position.set(0, 0, travel);
        const twistProg = smoothstep(0.42, 0.72, tTunnel);
        blackTunnelGroup.rotation.set(
          Math.sin(twistProg * Math.PI) * 0.09,
          Math.sin(twistProg * Math.PI * 0.8) * 0.12,
          twistProg * (Math.PI * 0.26)
        );
        tunnelCoolLight.intensity = blackVis * lerp(7.5, 1.8, twistProg);
        tunnelMagentaNear.intensity = blackVis * twistProg * 14.5;
        tunnelVioletMid.intensity = blackVis * twistProg * 16.0;
        portalRingMat.uniforms.uOpacity.value = blackVis;
      } else {
        tunnelCoolLight.intensity = 0;
        tunnelMagentaNear.intensity = 0;
        tunnelVioletMid.intensity = 0;
      }

      // Downstream Royal-Blue & White Voronoi Tunnel (`whiteTunnel`)
      const whiteIn = !inEmergencePhase ? smoothstep(0.74, 0.84, tTunnel) : 0;
      const whiteOut = 1 - smoothstep(0.78, 0.94, tShatter);
      const whiteVis = whiteIn * whiteOut * (tWait > 0.001 ? 0 : 1);
      whiteTunnelGroup.visible = whiteVis > 0.01;
      if (whiteTunnelGroup.visible) {
        voronoiTex.offset.y = -tTunnel * 2.2;
        const monShrink =
          tOutPull > 0.01 ? lerp(1.0, m.isMobile ? 0.44 : 0.65, smoothstep(0.0, 0.86, tOutPull)) : 1.0;
        const wideAspect =
          tOutPull > 0.01 ? lerp(1.0, m.isMobile ? 1.24 : 1.5, smoothstep(0.0, 0.86, tOutPull)) : 1.0;
        const monRoll =
          tOutPull > 0.01
            ? lerp(-0.05, 0.0, smoothstep(0.0, 0.72, tOutPull))
            : lerp(0.06, -0.05, smoothstep(0.74, 1.0, tTunnel));
        const tunnelShiftY = tShatter > 0.001 ? ((H * 0.5 - outBaseY) / H) * 5.2 : 0;
        whiteTunnelGroup.scale.set(monShrink * wideAspect, monShrink, monShrink);
        whiteTunnelGroup.rotation.set(0, 0, monRoll);
        whiteTunnelGroup.position.set(0, tunnelShiftY, tOutPull > 0.01 ? -4.2 : 0);
        whiteEndGlowMat.uniforms.uOpacity.value = whiteVis;
      }

      // Downstream Glass Shatter (`home-09`) & `#end-section` Decor (`home-10`)
      const shardVis =
        smoothstep(0.1, 0.24, tShatter) *
        (1 - smoothstep(0.76, 0.96, tShatter)) *
        (tWait > 0.001 ? 0 : 1);
      shardsMesh.visible = shardVis > 0.005;
      if (shardsMesh.visible) {
        const burst = smoothstep(0.08, 0.72, tShatter);
        shardMat.uniforms.uOpacity.value = shardVis;
        for (let i = 0; i < SHARD_COUNT; i++) {
          const s = shardSeeds[i];
          const spread = 0.35 + burst * 2.35;
          dummy.position.set(
            s.dirX * spread,
            s.dirY * spread + 0.15 - burst * burst * 0.55,
            1.15 + s.dirZ * burst * 1.15
          );
          dummy.rotation.set(s.rotX + burst * 2.2, s.rotY + burst * 2.6, s.rotZ + burst * 1.5);
          dummy.scale.setScalar(s.scale * (1 - burst * 0.18));
          dummy.updateMatrix();
          shardsMesh.setMatrixAt(i, dummy.matrix);
        }
        shardsMesh.instanceMatrix.needsUpdate = true;
      }

      const waitVis = smoothstep(0.92, 1.0, tShatter);
      waitDecorGroup.visible = waitVis > 0.01;
      if (waitDecorGroup.visible) {
        const upwardScrollWorld = tWait * 5.6;
        waitDecorGroup.position.set(0, upwardScrollWorld * 0.65, 0);
        waitDecorGroup.children.forEach((child, idx) => {
          if (idx < DIAMOND_COUNT) {
            const [bx, by, bz, seedIdx] = diamondAnchors[idx];
            child.position.set(
              bx,
              by + Math.sin(elapsedSec * 1.1 + seedIdx) * (reducedMotion ? 0 : 0.05),
              bz
            );
            child.rotation.set(elapsedSec * 0.5 + seedIdx, elapsedSec * 0.7 + seedIdx, 0);
          }
        });
        for (const st of stickerMeshes) {
          st.mesh.position.set(
            st.baseX * (m.isMobile ? 0.52 : 1.0),
            st.baseY + (reducedMotion ? 0 : Math.sin(elapsedSec * 1.25 + st.phase) * 0.045),
            st.baseZ
          );
          st.mesh.rotation.z = Math.sin(elapsedSec * 0.8 + st.phase) * (reducedMotion ? 0 : 0.08);
        }
      }

      // -----------------------------------------------------------------------
      // E. Licensed Rigged Astronaut Choreography + Visor Reflection + Star Flare
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
          if (plumeGroup) plumeGroup.visible = false;
        } else if (tOutPull <= 0.001) {
          jointPose = SUIT_POSE_PROFILE_GLIDE;
          const intoWhite = smoothstep(0.74, 0.92, tTunnel);
          ax = lerp(0.0, -0.28, intoWhite);
          ay = lerp(-0.18, -0.06, smoothstep(0.0, 0.25, tTunnel));
          az = lerp(-1.35, -2.35, smoothstep(0.0, 0.3, tTunnel));
          rx = 0.28;
          ry = lerp(-Math.PI, -0.35, smoothstep(0.0, 0.35, tTunnel));
          rz = lerp(0.08, Math.PI, smoothstep(0.18, 0.48, tTunnel));
          aScale = lerp(0.52, 0.92, smoothstep(0.0, 0.28, tTunnel));
          visorFlareAmt = 0;
          if (plumeGroup) plumeGroup.visible = false;
        } else if (tWait <= 0.001) {
          const burst = smoothstep(0.08, 0.46, tShatter);
          const settleStand = smoothstep(0.62, 1.0, tShatter);
          jointPose = blendSuitPose(
            blendSuitPose(SUIT_POSE_PROFILE_GLIDE, SUIT_POSE_ZERO_G_FLOAT, burst),
            SUIT_POSE_STANDING,
            settleStand
          );
          ax = lerp(-0.26, 0, burst);
          ay = lerp(-0.08, m.isMobile ? -0.08 : -0.34, lerp(burst * 0.45, 1.0, settleStand));
          az = lerp(-2.15, m.isMobile ? 1.05 : 2.75, burst);
          az = lerp(az, m.isMobile ? 0.45 : 2.18, settleStand);
          rz = lerp(0.12, 0, burst);
          aScale = 1.0;
          if (plumeGroup && plumeMat) {
            plumeGroup.visible = burst > 0.15;
            plumeMat.uniforms.uTime.value = elapsedSec;
            plumeMat.uniforms.uOpacity.value = burst * 0.52;
          }
        } else {
          jointPose = SUIT_POSE_STANDING;
          ax = 0;
          const scrollUpWorld = Math.max(0, tWait - 0.05) * (m.isMobile ? 4.2 : 6.4);
          ay = (m.isMobile ? 0.06 : -0.44) + scrollUpWorld;
          az = m.isMobile ? 0.45 : 2.18;
          aScale = 1.0;
          if (plumeGroup && plumeMat) {
            plumeGroup.visible = true;
            plumeMat.uniforms.uTime.value = elapsedSec;
            plumeMat.uniforms.uOpacity.value = 0.45;
          }
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

        const clonesActive =
          !inEmergencePhase && tTunnel > 0.14 && tTunnel < 0.78 && tOutPull <= 0.001;
        for (let c = 0; c < clones.length; c++) {
          const cl = clones[c];
          cl.root.visible = clonesActive;
          if (clonesActive) {
            const depthT = (c + 1) / (clones.length + 0.5);
            const spiralA = tTunnel * 9.0 + c * 1.55;
            cl.root.position.set(
              Math.cos(spiralA) * (0.85 + c * 0.28),
              Math.sin(spiralA) * (0.62 + c * 0.22),
              -2.4 - depthT * 11.5
            );
            cl.root.rotation.set(0.45 + c * 0.3, spiralA * 0.35, rz + c * 0.75);
            cl.root.scale.setScalar(0.88 - c * 0.08);
          }
        }
      } else {
        optics.visorFlareMesh.visible = false;
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
        targetScrollY <= metrics.goalTop + metrics.goalHeight + vhNow * 1.35;

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

        {/* Downstream Exit Desktop Display Bezel (used only at `#home-goal-image-out`) */}
        <div
          ref={monitorBezelRef}
          className="absolute left-0 top-0 z-[14] will-change-transform"
          style={{ display: "none", transformOrigin: "50% 50%" }}
        >
          <div
            className="mx-auto"
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-15.5%",
              transform: "translateX(-50%)",
              width: "18%",
              height: "16%",
              background:
                "linear-gradient(90deg, #59607a 0%, #8f98b8 28%, #9ba4c4 52%, #676f8c 82%, #4a5168 100%)",
              borderBottomLeftRadius: "4px",
              borderBottomRightRadius: "4px",
              boxShadow: "0 12px 28px rgba(0,0,0,0.65)",
            }}
          />
          <div className="h-full w-full rounded-[6px] border-[14px] border-[#0a0c12] bg-[#030612] shadow-[0_0_90px_rgba(32,58,205,0.45)]" />
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
