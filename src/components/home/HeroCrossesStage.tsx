"use client";

import React, { Component, useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { GTAOPass } from "three/examples/jsm/postprocessing/GTAOPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { SMAAPass } from "three/examples/jsm/postprocessing/SMAAPass.js";
import { createHollowCrossGeometry } from "@/components/home/HollowCrossGeometry";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";

/**
 * Verified Lusion Hero Accent Palette
 * Starts deterministically at index 0 (`#1a22e0` studio royal cobalt) and cycles on click.
 */
export const HERO_ACCENT_PALETTE = [
  "#1b24e6",
  "#ADFF00",
  "#f6000e",
  "#7e09f5",
  "#ffc000",
] as const;

// Linear input calibrated so post-ACESFilmic + OutputPass sRGB equals ~#13151d (matching reference dark slate!)
const STUDIO_SCENE_BG_HEX = "#1f222d";
const STUDIO_CONTAINER_BG_HEX = "#13151d";
const NEAR_BLACK_HEX = "#040407";
const OFF_WHITE_HEX = "#e6e7ef";

type PieceKind = "blue" | "black" | "white";

interface HeroPieceSpec {
  id: string;
  kind: PieceKind;
  isHero?: boolean;
  scale: number;
  anchorDesktop: [number, number, number];
  anchorMobile: [number, number, number];
  euler: [number, number, number];
  driftPhase: number;
  driftAmp: [number, number, number];
  rotAmp: [number, number, number];
  roughness: number;
  clearcoatRoughness: number;
}

/**
 * 11 Art-Directed Large Sculptural Cross Pieces
 *
 * Calibrated directly against the verified `1440x900` & `390x844` Lusion hero captures:
 *   - 1 sharp focal royal-blue hero connector (`isHero: true`) right in the focal plane
 *   - Large foreground & edge-cropped near-black (`#07070a`), off-white (`#e8e8f0`), and
 *     royal-blue (`#1a22e0`) connectors cropped boldly by the top, left, and bottom edges
 *   - Deliberate dark `#12141a` negative space on top-left and far-right of frame
 */
const HERO_PIECES: ReadonlyArray<HeroPieceSpec> = [
  // 0. SHARP IN-FOCUS BLUE HERO CONNECTOR (center-left focal plane)
  {
    id: "hero-blue-center",
    kind: "blue",
    isHero: true,
    scale: 1.03,
    anchorDesktop: [-0.58, 0.14, 0.35],
    anchorMobile: [0.06, -0.02, 0.45],
    euler: [0.34, 0.46, 0.52],
    driftPhase: 0.0,
    driftAmp: [0.04, 0.05, 0.025],
    rotAmp: [0.03, 0.04, 0.028],
    roughness: 0.36,
    clearcoatRoughness: 0.028,
  },
  // 1. FOREGROUND-LEFT GLOSSY OFF-WHITE CONNECTOR (angled ~35deg left of blue hero)
  {
    id: "fg-white-left",
    kind: "white",
    scale: 1.06,
    anchorDesktop: [-1.96, 0.1, 0.98],
    anchorMobile: [-0.96, -0.34, 0.95],
    euler: [0.44, 0.56, -0.62],
    driftPhase: 1.15,
    driftAmp: [0.045, 0.055, 0.03],
    rotAmp: [0.035, 0.045, 0.03],
    roughness: 0.33,
    clearcoatRoughness: 0.022,
  },
  // 2. FOREGROUND-RIGHT PIANO-BLACK CONNECTOR (dramatic X-tilt, crisp strip & saddle reflections)
  {
    id: "fg-black-right",
    kind: "black",
    scale: 1.08,
    anchorDesktop: [0.88, -0.02, 1.06],
    anchorMobile: [0.92, -0.42, 1.08],
    euler: [0.3, -0.46, 0.72],
    driftPhase: 2.3,
    driftAmp: [0.045, 0.05, 0.03],
    rotAmp: [0.04, 0.038, 0.035],
    roughness: 0.38,
    clearcoatRoughness: 0.02,
  },
  // 3. BOTTOM-FOREGROUND PIANO-BLACK CONNECTOR (cropped boldly by bottom frame edge)
  {
    id: "fg-black-bottom",
    kind: "black",
    scale: 1.1,
    anchorDesktop: [-0.84, -1.62, 1.48],
    anchorMobile: [-0.82, -2.02, 1.38],
    euler: [-0.36, 0.32, 0.24],
    driftPhase: 3.4,
    driftAmp: [0.04, 0.04, 0.03],
    rotAmp: [0.03, 0.04, 0.028],
    roughness: 0.38,
    clearcoatRoughness: 0.02,
  },
  // 4. TOP-CENTER OFF-WHITE CONNECTOR (cropped cleanly by top frame edge)
  {
    id: "top-white-center",
    kind: "white",
    scale: 1.04,
    anchorDesktop: [0.22, 1.98, 0.24],
    anchorMobile: [0.58, 2.06, 0.42],
    euler: [0.64, -0.35, 0.58],
    driftPhase: 4.1,
    driftAmp: [0.05, 0.04, 0.03],
    rotAmp: [0.035, 0.032, 0.035],
    roughness: 0.36,
    clearcoatRoughness: 0.032,
  },
  // 5. UPPER-RIGHT OFF-WHITE CONNECTOR (frames deliberate dark right negative space)
  {
    id: "upper-white-right",
    kind: "white",
    scale: 1.05,
    anchorDesktop: [2.04, 0.98, -0.16],
    anchorMobile: [1.18, 0.9, -0.12],
    euler: [-0.38, -0.52, 0.68],
    driftPhase: 5.05,
    driftAmp: [0.045, 0.05, 0.03],
    rotAmp: [0.035, 0.04, 0.032],
    roughness: 0.35,
    clearcoatRoughness: 0.03,
  },
  // 6. TOP-LEFT ROYAL-BLUE CONNECTOR (cropped at top edge; clean dark negative space left of it)
  {
    id: "top-blue-left",
    kind: "blue",
    scale: 1.06,
    anchorDesktop: [-1.46, 1.88, -0.58],
    anchorMobile: [-0.76, 2.16, -0.55],
    euler: [0.18, 0.28, 0.08],
    driftPhase: 0.75,
    driftAmp: [0.045, 0.045, 0.035],
    rotAmp: [0.032, 0.038, 0.028],
    roughness: 0.36,
    clearcoatRoughness: 0.032,
  },
  // 7. BOTTOM-RIGHT ROYAL-BLUE CONNECTOR (cropped boldly by bottom frame edge)
  {
    id: "bottom-blue-right",
    kind: "blue",
    scale: 1.06,
    anchorDesktop: [1.04, -1.66, -0.14],
    anchorMobile: [0.34, -1.78, 0.52],
    euler: [-0.46, 0.38, -0.54],
    driftPhase: 1.9,
    driftAmp: [0.045, 0.04, 0.03],
    rotAmp: [0.035, 0.032, 0.035],
    roughness: 0.35,
    clearcoatRoughness: 0.03,
  },
  // 8. BOTTOM-LEFT OFF-WHITE CONNECTOR (cropped by BOTH left and bottom borders)
  {
    id: "bottom-white-left-crop",
    kind: "white",
    scale: 1.08,
    anchorDesktop: [-3.12, -1.52, 0.56],
    anchorMobile: [-0.18, -2.62, -0.25],
    euler: [0.32, 0.44, -0.35],
    driftPhase: 2.85,
    driftAmp: [0.04, 0.045, 0.028],
    rotAmp: [0.032, 0.038, 0.03],
    roughness: 0.35,
    clearcoatRoughness: 0.03,
  },
  // 9. MID-LEFT BACKGROUND OFF-WHITE CONNECTOR (cropped along left border)
  {
    id: "bg-white-left",
    kind: "white",
    scale: 1.02,
    anchorDesktop: [-3.18, -0.24, -0.76],
    anchorMobile: [-1.12, -1.28, -0.62],
    euler: [-0.52, 0.62, 0.42],
    driftPhase: 3.95,
    driftAmp: [0.05, 0.045, 0.035],
    rotAmp: [0.035, 0.035, 0.028],
    roughness: 0.37,
    clearcoatRoughness: 0.034,
  },
  // 10. MID-RIGHT DEEP PIANO-BLACK CONNECTOR (recedes into clean dark right negative space)
  {
    id: "bg-black-right",
    kind: "black",
    scale: 1.04,
    anchorDesktop: [2.44, -0.76, -0.92],
    anchorMobile: [0.42, 0.72, -0.92],
    euler: [0.48, -0.58, 0.36],
    driftPhase: 5.65,
    driftAmp: [0.045, 0.05, 0.035],
    rotAmp: [0.035, 0.04, 0.032],
    roughness: 0.38,
    clearcoatRoughness: 0.022,
  },
];

/**
 * Generates the HDR PMREM Studio Strip-Light Environment Map (`target.texture`).
 *
 * Uses the exact 4 narrow softbox strip lights against `#050508` with temporary
 * `NoToneMapping` so HDR radiance (`k = 6..12`) bakes cleanly into the PMREM target,
 * creating crisp thin white clearcoat streaks on blue (`#1a22e0`) and near-black (`#07070a`)
 * pieces while keeping unlit shadow undersides genuinely dark.
 */
function makeStudioEnv(renderer: THREE.WebGLRenderer): THREE.WebGLRenderTarget {
  const s = new THREE.Scene();
  s.background = new THREE.Color(0x050508);
  const geos: THREE.BufferGeometry[] = [];
  const mats: THREE.Material[] = [];

  const strip = (w: number, h: number, pos: [number, number, number], k: number) => {
    const g = new THREE.PlaneGeometry(w, h);
    const m = new THREE.MeshBasicMaterial({
      color: new THREE.Color(1, 1, 1).multiplyScalar(k),
      side: THREE.DoubleSide,
      toneMapped: false,
    });
    const mesh = new THREE.Mesh(g, m);
    mesh.position.set(...pos);
    mesh.lookAt(0, 0, 0);
    s.add(mesh);
    geos.push(g);
    mats.push(m);
  };

  // All softbox strips positioned strictly forward/above (z > 0) so grazing silhouette
  // reflections face the dark #040407 studio void (zero soap-bubble wireframe outlines!)
  strip(0.32, 12.5, [-6.4, 2.4, 4.8], 16); // left tall primary softbox strip
  strip(0.32, 12.0, [6.4, 3.2, 4.4], 13);  // right tall secondary softbox strip
  strip(10.5, 0.44, [0.0, 6.8, 3.8], 9);   // overhead bar softbox strip
  strip(0.28, 9.0, [-2.6, 5.2, 5.8], 11);  // upper-left key specular catchlight strip

  const prevToneMapping = renderer.toneMapping;
  renderer.toneMapping = THREE.NoToneMapping;

  const pmrem = new THREE.PMREMGenerator(renderer);
  pmrem.compileEquirectangularShader();
  const target = pmrem.fromScene(s, 0.015);
  pmrem.dispose();

  renderer.toneMapping = prevToneMapping;

  geos.forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
  return target;
}

class StageErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function StaticSculpturalFallback({ accentHex }: { accentHex: string }) {
  return (
    <div
      data-webgl-fallback="active"
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#12141a]"
    >
      <svg
        viewBox="0 0 800 500"
        className="h-full w-full max-w-[900px]"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="crossWhite" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f2f3f8" />
            <stop offset="70%" stopColor="#c9cddb" />
            <stop offset="100%" stopColor="#727788" />
          </radialGradient>
          <radialGradient id="crossAccent" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={accentHex} />
            <stop offset="100%" stopColor="#070d59" />
          </radialGradient>
          <radialGradient id="crossBlack" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#353946" />
            <stop offset="70%" stopColor="#101218" />
            <stop offset="100%" stopColor="#06070a" />
          </radialGradient>
        </defs>
        {[
          { x: 250, y: 270, rot: -28, fill: "url(#crossWhite)", scale: 1.15 },
          { x: 390, y: 245, rot: 26, fill: "url(#crossAccent)", scale: 1.2 },
          { x: 525, y: 270, rot: 40, fill: "url(#crossBlack)", scale: 1.22 },
          { x: 350, y: 405, rot: 14, fill: "url(#crossBlack)", scale: 1.18 },
          { x: 500, y: 410, rot: -32, fill: "url(#crossAccent)", scale: 1.14 },
        ].map((item, idx) => (
          <g
            key={idx}
            transform={`translate(${item.x} ${item.y}) rotate(${item.rot}) scale(${item.scale})`}
          >
            <rect x="-105" y="-36" width="210" height="72" rx="14" fill={item.fill} />
            <rect x="-36" y="-105" width="72" height="210" rx="14" fill={item.fill} />
            <circle cx="0" cy="0" r="14" fill="#07080c" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function HeroCrossesStage() {
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const preloaderDone = useStudioStore((s) => s.preloaderDone);
  const [colorIdx, setColorIdx] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);
  const [shaderStatus, setShaderStatus] = useState<"booting" | "ready" | "error">("booting");
  const [pointerHits, setPointerHits] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const mountRef = useRef<HTMLDivElement>(null);
  const blueMaterialsRef = useRef<THREE.MeshPhysicalMaterial[]>([]);
  const impulseVelRef = useRef<Array<{ pos: THREE.Vector3; rot: THREE.Vector3 }>>([]);
  const reducedMotionRef = useRef(reducedMotion);
  const preloaderDoneRef = useRef(preloaderDone);

  useEffect(() => {
    reducedMotionRef.current = reducedMotion;
  }, [reducedMotion]);

  useEffect(() => {
    preloaderDoneRef.current = preloaderDone;
  }, [preloaderDone]);

  const pointerNdcRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });
  const pointerReportedRef = useRef(false);

  const accentHex = HERO_ACCENT_PALETTE[colorIdx % HERO_ACCENT_PALETTE.length];

  // Update blue physical materials cleanly when user clicks to cycle Lusion accent palette
  useEffect(() => {
    const col = new THREE.Color(accentHex);
    for (const mat of blueMaterialsRef.current) {
      mat.color.copy(col);
    }
  }, [accentHex]);

  // Single imperative Three.js studio scene + single EffectComposer + single RAF loop
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get("forceWebglFallback") === "1") {
        queueMicrotask(() => setWebglSupported(false));
        return;
      }
    } catch {
      // Ignore URL query parse errors
    }

    const host = mountRef.current;
    const container = containerRef.current;
    if (!host || !container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: false, // Multisampled HalfFloat renderTarget handles anti-aliasing in EffectComposer
        alpha: false,
        powerPreference: "high-performance",
        stencil: false,
      });
    } catch {
      queueMicrotask(() => setWebglSupported(false));
      return;
    }

    const initialW = Math.max(1, container.clientWidth);
    const initialH = Math.max(1, container.clientHeight);
    const initialDpr = Math.min(window.devicePixelRatio || 1, 2);

    renderer.setPixelRatio(initialDpr);
    renderer.setSize(initialW, initialH, false);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.02;
    renderer.shadowMap.enabled = true;
    // In three@0.186+, PCFSoftShadowMap deprecated cleanly into PCFShadowMap + shadow.radius
    renderer.shadowMap.type = THREE.PCFShadowMap;
    renderer.setClearColor(STUDIO_CONTAINER_BG_HEX, 1);

    const glCtx = renderer.getContext();
    const dbgExt = glCtx.getExtension("WEBGL_debug_renderer_info");
    const rendererLabel = dbgExt ? String(glCtx.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL)) : "";
    const isSoftwareRenderer = /swiftshader|llvmpipe|software/i.test(rendererLabel);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    host.appendChild(renderer.domElement);

    const onContextLost = (ev: Event) => {
      ev.preventDefault();
      setWebglSupported(false);
    };
    renderer.domElement.addEventListener("webglcontextlost", onContextLost);

    // Scene + Studio Strip-Light PMREM Environment (NO flat AmbientLight / HemisphereLight)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(STUDIO_SCENE_BG_HEX);

    const envTarget = makeStudioEnv(renderer);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 1.2;

    // Perspective Camera (FOV 32 matching telephoto studio lens compression)
    const camera = new THREE.PerspectiveCamera(32, initialW / initialH, 0.5, 32);
    const updateCameraFraming = (w: number, h: number) => {
      const aspect = w / Math.max(1, h);
      camera.aspect = aspect;
      if (aspect < 0.85) {
        camera.fov = 33;
        camera.position.set(0.06, -0.08, 8.2);
        camera.lookAt(-0.04, -0.16, 0);
      } else {
        camera.fov = 32;
        camera.position.set(0.24, 0.04, 8.15);
        camera.lookAt(0.14, -0.02, 0);
      }
      camera.updateProjectionMatrix();
    };
    updateCameraFraming(initialW, initialH);

    // Single Studio Directional Key Light (~[4, 6, 5], intensity ~1.5, shadow 2048, radius 6)
    const keyLight = new THREE.DirectionalLight(0xf6f8ff, 1.55);
    keyLight.position.set(4.2, 6.2, 5.0);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(isSoftwareRenderer ? 1024 : 2048, isSoftwareRenderer ? 1024 : 2048);
    keyLight.shadow.radius = 6;
    keyLight.shadow.camera.near = 1.0;
    keyLight.shadow.camera.far = 22.0;
    keyLight.shadow.camera.left = -6.8;
    keyLight.shadow.camera.right = 6.8;
    keyLight.shadow.camera.top = 5.6;
    keyLight.shadow.camera.bottom = -5.6;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.022;
    keyLight.shadow.camera.updateProjectionMatrix();
    scene.add(keyLight);

    // Shared Polar-Radial + Analytical-Fillet Hollow Cross Geometry
    const isMobileInit = initialW < 680;
    const crossGeometry = createHollowCrossGeometry(isMobileInit ? 48 : 64);

    // Studio MeshPhysicalMaterial instances (roughness ~0.35, clearcoat 1, clearcoatRoughness ~0.03)
    const disposableMaterials: THREE.MeshPhysicalMaterial[] = [];
    const blueMats: THREE.MeshPhysicalMaterial[] = [];

    const meshes: THREE.Mesh[] = [];
    const impulseStates: Array<{ pos: THREE.Vector3; rot: THREE.Vector3 }> = [];
    let heroMesh: THREE.Mesh | null = null;

    const initAspect = initialW / Math.max(1, initialH);

    for (const spec of HERO_PIECES) {
      const baseHex =
        spec.kind === "blue"
          ? HERO_ACCENT_PALETTE[0]
          : spec.kind === "black"
            ? NEAR_BLACK_HEX
            : OFF_WHITE_HEX;

      const mat = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(baseHex),
        roughness: spec.roughness,
        metalness: 0.0,
        clearcoat: 1.0,
        clearcoatRoughness: spec.clearcoatRoughness,
        envMapIntensity: spec.kind === "black" ? 1.32 : spec.kind === "blue" ? 1.05 : 0.85,
        ior: 1.52,
      });
      disposableMaterials.push(mat);
      if (spec.kind === "blue") blueMats.push(mat);

      const mesh = new THREE.Mesh(crossGeometry, mat);
      const anchor = initAspect < 0.85 ? spec.anchorMobile : spec.anchorDesktop;
      mesh.position.set(anchor[0], anchor[1], anchor[2]);
      mesh.rotation.set(spec.euler[0], spec.euler[1], spec.euler[2]);
      mesh.scale.setScalar(initAspect < 0.85 ? spec.scale * 0.72 : spec.scale);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      scene.add(mesh);

      meshes.push(mesh);
      impulseStates.push({ pos: new THREE.Vector3(), rot: new THREE.Vector3() });
      if (spec.isHero) heroMesh = mesh;
    }

    blueMaterialsRef.current = blueMats;
    impulseVelRef.current = impulseStates;

    // Single Multisampled HalfFloat EffectComposer:
    // Order: RenderPass -> GTAOPass -> BokehPass -> UnrealBloomPass -> OutputPass
    // (Hardware WebGL2 GPUs use samples: 4 MSAA HalfFloat renderTarget; software SwiftShader
    // avoids its known RGBA16F MSAA blit bug via samples: 0 + SMAAPass.)
    const bufW = Math.max(2, Math.floor(initialW * initialDpr));
    const bufH = Math.max(2, Math.floor(initialH * initialDpr));
    const msaaSamples =
      !isSoftwareRenderer && renderer.capabilities.isWebGL2
        ? Math.min(4, renderer.capabilities.maxSamples)
        : 0;

    const composerTarget = new THREE.WebGLRenderTarget(bufW, bufH, {
      type: THREE.HalfFloatType,
      samples: msaaSamples,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
    });

    const composer = new EffectComposer(renderer, composerTarget);
    composer.setPixelRatio(initialDpr);
    composer.setSize(initialW, initialH);

    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const gtaoPass = new GTAOPass(scene, camera, bufW, bufH);
    gtaoPass.output = GTAOPass.OUTPUT.Default;
    gtaoPass.blendIntensity = 0.72;
    gtaoPass.updateGtaoMaterial({
      radius: 0.38,
      distanceExponent: 1.65,
      thickness: 0.75,
      scale: 1.05,
      samples: 16,
      distanceFallOff: 1.0,
      screenSpaceRadius: false,
    });
    // High lumaPhi smooths out the 4x4 magic-square AO sample pattern across flat porcelain
    // barrels and inner bores while depthPhi & normalPhi keep geometric creases razor-sharp
    gtaoPass.updatePdMaterial({
      lumaPhi: 28,
      depthPhi: 2,
      normalPhi: 3.5,
      radius: 5,
      rings: 2,
      samples: 16,
    });
    composer.addPass(gtaoPass);

    const bokehPass = new BokehPass(scene, camera, {
      focus: 7.8,
      aperture: 0.00022,
      maxblur: 0.0045,
    });
    composer.addPass(bokehPass);

    // Threshold above 1.0 ensures diffuse off-white porcelain never blooms across silhouettes,
    // restricting subtle optical halation strictly to HDR clearcoat softbox reflections
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(initialW, initialH), 0.14, 0.48, 1.35);
    composer.addPass(bloomPass);

    const outputPass = new OutputPass();
    composer.addPass(outputPass);

    let smaaPass: SMAAPass | null = null;
    if (msaaSamples === 0) {
      smaaPass = new SMAAPass();
      composer.addPass(smaaPass);
    }

    // Dynamic Resize Handler (updates camera, renderer, composer, GTAO, Bokeh aspect, and Bloom)
    const handleResize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      updateCameraFraming(w, h);
      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);
      composer.setPixelRatio(dpr);
      composer.setSize(w, h);
      gtaoPass.setSize(Math.floor(w * dpr), Math.floor(h * dpr));
      bloomPass.setSize(w, h);
      smaaPass?.setSize(Math.floor(w * dpr), Math.floor(h * dpr));

      const bokehUniforms = bokehPass.uniforms as Record<string, THREE.IUniform>;
      if (bokehUniforms.aspect) bokehUniforms.aspect.value = camera.aspect;
      if (bokehUniforms.nearClip) bokehUniforms.nearClip.value = camera.near;
      if (bokehUniforms.farClip) bokehUniforms.farClip.value = camera.far;

      const isPortrait = w / Math.max(1, h) < 0.85;
      meshes.forEach((m, idx) => {
        const spec = HERO_PIECES[idx];
        const anchor = isPortrait ? spec.anchorMobile : spec.anchorDesktop;
        m.position.set(anchor[0], anchor[1], anchor[2]);
        m.scale.setScalar(isPortrait ? spec.scale * 0.72 : spec.scale);
      });
      needsRender = true;
    };

    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(container);

    let inView = true;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]) inView = entries[0].isIntersecting;
      },
      { threshold: 0 }
    );
    visibilityObserver.observe(container);

    // Pre-allocated math scratch objects (zero per-frame heap allocations)
    const heroViewPos = new THREE.Vector3();
    const targetPos = new THREE.Vector3();
    const targetQuat = new THREE.Quaternion();
    const targetEuler = new THREE.Euler();
    const pointerWorld = new THREE.Vector3();
    const pointerDelta = new THREE.Vector3();

    let rafId = 0;
    let yieldTimerId = 0;
    let prevTime = performance.now();
    let elapsed = 0;
    let shaderVerified = false;
    let staticRendered = false;
    let needsRender = true;

    const scheduleNext = (frameCostMs: number) => {
      if (isSoftwareRenderer && frameCostMs > 40) {
        yieldTimerId = window.setTimeout(() => {
          rafId = window.requestAnimationFrame(renderFrame);
        }, 220);
      } else {
        rafId = window.requestAnimationFrame(renderFrame);
      }
    };

    const renderFrame = (now: number) => {
      const frameStart = performance.now();
      const rawDt = Math.max(0.0005, (now - prevTime) * 0.001);
      prevTime = now;
      const dt = Math.min(rawDt, 0.05);

      // Keep frame 0 painted behind #preloader while letting the preloader fade smoothly at 60fps
      if ((!inView || !preloaderDoneRef.current) && staticRendered && !needsRender) {
        rafId = window.requestAnimationFrame(renderFrame);
        return;
      }
      needsRender = false;

      const isReduced = reducedMotionRef.current;
      if (!isReduced) {
        elapsed += dt;
      }

      // Exponential smoothing equivalent to ~0.05 lerp at 60fps, strictly delta-time invariant
      const alpha = 1 - Math.exp(-3.1 * dt);
      const decay = Math.exp(-2.6 * dt);
      const isPortrait = camera.aspect < 0.85;

      const ptr = pointerNdcRef.current;
      if (ptr.active && !isReduced) {
        pointerWorld.set(ptr.x * 3.8, ptr.y * 2.4, 0.6);
      }

      for (let i = 0; i < meshes.length; i++) {
        const spec = HERO_PIECES[i];
        const mesh = meshes[i];
        const imp = impulseStates[i];
        const anchor = isPortrait ? spec.anchorMobile : spec.anchorDesktop;

        const t = elapsed * 0.42 + spec.driftPhase;
        const dx = isReduced ? 0 : Math.sin(t) * spec.driftAmp[0];
        const dy = isReduced ? 0 : Math.cos(t * 0.87) * spec.driftAmp[1];
        const dz = isReduced ? 0 : Math.sin(t * 0.63) * spec.driftAmp[2];

        targetPos.set(anchor[0] + dx + imp.pos.x, anchor[1] + dy + imp.pos.y, anchor[2] + dz + imp.pos.z);

        // Smooth restrained pointer repulsion
        if (ptr.active && !isReduced) {
          pointerDelta.copy(targetPos).sub(pointerWorld);
          const dist = pointerDelta.length();
          if (dist > 0.001 && dist < 2.5) {
            const push = (1 - dist / 2.5) * 0.55;
            pointerDelta.divideScalar(dist).multiplyScalar(push);
            targetPos.add(pointerDelta);
            if (!pointerReportedRef.current) {
              pointerReportedRef.current = true;
              setPointerHits((c) => c + 1);
            }
          }
        }

        targetEuler.set(
          spec.euler[0] + (isReduced ? 0 : Math.sin(t * 0.78) * spec.rotAmp[0]) + imp.rot.x,
          spec.euler[1] + (isReduced ? 0 : Math.cos(t * 0.66) * spec.rotAmp[1]) + imp.rot.y,
          spec.euler[2] + (isReduced ? 0 : Math.sin(t * 0.54) * spec.rotAmp[2]) + imp.rot.z
        );
        targetQuat.setFromEuler(targetEuler);

        mesh.position.lerp(targetPos, alpha);
        mesh.quaternion.slerp(targetQuat, alpha);

        imp.pos.multiplyScalar(decay);
        imp.rot.multiplyScalar(decay);
      }

      // Dynamic view-space DOF focus locked every frame onto the royal-blue hero connector
      if (heroMesh) {
        scene.updateMatrixWorld();
        camera.updateMatrixWorld();
        camera.matrixWorldInverse.copy(camera.matrixWorld).invert();
        heroViewPos.copy(heroMesh.position).applyMatrix4(camera.matrixWorldInverse);
        (bokehPass.uniforms as Record<string, THREE.IUniform>).focus.value = -heroViewPos.z;
      }

      composer.render(dt);
      staticRendered = true;

      if (!shaderVerified) {
        const programs = (
          renderer.info as unknown as { programs?: Array<{ diagnostics?: { runnable?: boolean } }> }
        ).programs;
        if (programs && programs.length > 0) {
          const ok = programs.every((p) => p.diagnostics?.runnable !== false);
          shaderVerified = true;
          setShaderStatus(ok ? "ready" : "error");
        }
      }

      scheduleNext(performance.now() - frameStart);
    };

    // Render immediate deterministic frame 0 so screenshots never catch an unrendered frame
    renderFrame(performance.now());

    return () => {
      window.cancelAnimationFrame(rafId);
      window.clearTimeout(yieldTimerId);
      resizeObserver.disconnect();
      visibilityObserver.disconnect();
      renderer.domElement.removeEventListener("webglcontextlost", onContextLost);

      crossGeometry.dispose();
      for (const m of disposableMaterials) m.dispose();
      envTarget.dispose();

      gtaoPass.dispose();
      bokehPass.dispose();
      bloomPass.dispose();
      outputPass.dispose();
      smaaPass?.dispose();
      composerTarget.dispose();
      composer.dispose();

      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      blueMaterialsRef.current = [];
      impulseVelRef.current = [];
    };
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerNdcRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdcRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerNdcRef.current.active = true;
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerNdcRef.current.active = false;
  }, []);

  const handleStageClick = useCallback(() => {
    soundEngine.playClick();
    setColorIdx((prev) => (prev + 1) % HERO_ACCENT_PALETTE.length);
    impulseVelRef.current.forEach((imp, idx) => {
      const angle = idx * 1.9;
      imp.pos.set(Math.cos(angle) * 0.42, Math.sin(angle) * 0.36, Math.sin(idx) * 0.25);
      imp.rot.set(
        (Math.sin(idx * 2.1) - 0.15) * 0.55,
        (Math.cos(idx * 1.4) + 0.15) * 0.55,
        Math.sin(idx * 0.9) * 0.45
      );
    });
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStageClick();
      }
    },
    [handleStageClick]
  );

  const fallbackNode = <StaticSculpturalFallback accentHex={accentHex} />;

  return (
    <div
      id="home-hero-visual-container"
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label="Interactive 3D Lusion connector stage — move pointer to sculpt or activate to cycle studio palette"
      data-color-index={colorIdx}
      data-accent-color={accentHex}
      data-webgl-status={webglSupported ? shaderStatus : "fallback"}
      data-pointer-interactions={pointerHits}
      onClick={handleStageClick}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-full w-full cursor-pointer overflow-hidden rounded-[var(--global-border-radius)] bg-[#13151d] select-none focus-visible:outline-2 focus-visible:outline-[#1a2ffb]"
    >
      {webglSupported ? (
        <StageErrorBoundary fallback={fallbackNode}>
          <div ref={mountRef} className="h-full w-full" />
        </StageErrorBoundary>
      ) : (
        fallbackNode
      )}
    </div>
  );
}
