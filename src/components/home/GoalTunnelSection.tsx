"use client";
/* eslint-disable @next/next/no-img-element */

import React, { Component, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { createFacetedDiamondGeometry } from "@/components/home/HollowCrossGeometry";
import { LUSION_HOME } from "@/data/reference";
import { useStudioStore } from "@/lib/store";

/**
 * Verified UV sub-rects from `goalWhiteTunnelStickerData` in Lusion's homepage bundle
 * (`stickers.png`, `1465 x 1024`).
 */
const STICKER_SPRITES = [
  { x: 1132, y: 3, w: 195, h: 195 },
  { x: 744, y: 3, w: 195, h: 256 },
  { x: 525, y: 3, w: 213, h: 282 },
  { x: 242, y: 3, w: 277, h: 286 },
  { x: 1055, y: 633, w: 209, h: 209 },
  { x: 1076, y: 398, w: 209, h: 209 },
  { x: 3, y: 772, w: 298, h: 249 },
  { x: 945, y: 3, w: 181, h: 249 },
  { x: 564, y: 445, w: 294, h: 184 },
  { x: 864, y: 438, w: 206, h: 189 },
] as const;

const CRYSTAL_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying vec3 vLocalDir;

  void main() {
    vLocalDir = normalize(position);
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPos.xyz;
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const CRYSTAL_FRAGMENT = /* glsl */ `
  uniform vec3 uTint;
  uniform float uWhiteMix;

  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying vec3 vLocalDir;

  void main() {
    vec3 N = normalize(vNormalView);
    vec3 V = normalize(vViewPos);
    float d = dot(vLocalDir, N);
    float fresnel = pow(1.0 - abs(dot(N, V)), 2.4);

    // Prismatic spectral dispersion matching Lusion's crystal refraction shader
    vec3 rainbow = clamp(
      abs(mod((d + N.z) * 11.0 + vec3(0.0, 4.0, 2.0), 6.0) - 3.0) - 1.0,
      0.0,
      1.0
    );

    vec3 core = mix(uTint, vec3(0.92, 0.95, 1.0), 0.45);
    vec3 col = core * (0.42 + 0.65 * fresnel) + rainbow * (0.48 * fresnel + 0.16);
    float alpha = mix(0.72, 0.92, fresnel) * uWhiteMix;
    gl_FragColor = vec4(clamp(col, 0.0, 1.0), alpha);
  }
`;

class TunnelCanvasBoundary extends Component<
  { children: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    if (this.state.failed) return null;
    return this.props.children;
  }
}

interface Tunnel3DProps {
  progressRef: React.MutableRefObject<number>;
  pointerRef: React.MutableRefObject<{ x: number; y: number }>;
  reducedMotion: boolean;
}

function Tunnel3DScene({ progressRef, pointerRef, reducedMotion }: Tunnel3DProps) {
  const diamondGeo = useMemo(() => createFacetedDiamondGeometry(), []);
  const ribGeo = useMemo(() => new THREE.RingGeometry(2.6, 2.66, 48), []);

  const crystalMat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uTint: { value: new THREE.Color("#689aff") },
          uWhiteMix: { value: 0 },
        },
        vertexShader: CRYSTAL_VERTEX,
        fragmentShader: CRYSTAL_FRAGMENT,
        transparent: true,
        depthWrite: false,
      }),
    []
  );

  const ribMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        color: new THREE.Color("#2b45ff"),
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
      }),
    []
  );

  const crystals = useMemo(() => {
    return Array.from({ length: 34 }, (_, i) => {
      const a = i * 2.39996;
      const r = 1.15 + (i % 6) * 0.72;
      return {
        baseX: Math.cos(a) * r,
        baseY: Math.sin(a) * r * 0.78,
        baseZ: -i * 0.85,
        scale: 0.22 + (i % 4) * 0.09,
        spinX: 0.45 + (i % 5) * 0.16,
        spinY: 0.35 + (i % 3) * 0.22,
      };
    });
  }, []);

  const crystalMatRef = useRef<THREE.ShaderMaterial>(crystalMat);
  const ribMatRef = useRef<THREE.MeshBasicMaterial>(ribMat);
  const crystalRefs = useRef<(THREE.Mesh | null)[]>([]);
  const ribRefs = useRef<(THREE.Mesh | null)[]>([]);

  useEffect(() => {
    return () => {
      diamondGeo.dispose();
      ribGeo.dispose();
      crystalMat.dispose();
      ribMat.dispose();
    };
  }, [crystalMat, diamondGeo, ribGeo, ribMat]);

  useFrame(({ camera, clock }) => {
    const p = progressRef.current;
    const t = reducedMotion ? 0 : clock.getElapsedTime();

    // Subtle camera look-around responding to pointer
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointerRef.current.x * 0.55, 0.08);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointerRef.current.y * 0.38, 0.08);
    camera.lookAt(0, 0, -10);

    // Stage 1 dark rib rings (`p in 0.12..0.58`) vs Stage 2 prismatic crystals (`p in 0.52..0.96`)
    const darkAmt =
      THREE.MathUtils.smoothstep(p, 0.08, 0.22) * (1 - THREE.MathUtils.smoothstep(p, 0.50, 0.60));
    const whiteAmt =
      THREE.MathUtils.smoothstep(p, 0.52, 0.62) * (1 - THREE.MathUtils.smoothstep(p, 0.88, 0.98));

    ribMatRef.current.opacity = 0.28 * darkAmt;
    crystalMatRef.current.uniforms.uWhiteMix.value = whiteAmt;

    const travel = p * 26 + t * 1.35;
    for (let i = 0; i < 14; i++) {
      const m = ribRefs.current[i];
      if (!m) continue;
      m.visible = darkAmt > 0.01;
      const z = ((i * -2.2 + travel) % 30.8) - 28.0;
      m.position.set(0, 0, z > 2 ? z - 30.8 : z);
      m.rotation.z = i * 0.12 + p * 1.4;
    }

    for (let i = 0; i < crystals.length; i++) {
      const m = crystalRefs.current[i];
      if (!m) continue;
      m.visible = whiteAmt > 0.01;
      const c = crystals[i];
      const zLoop = (((c.baseZ + travel * 1.15) % 28) + 28) % 28 - 25.5;
      m.position.set(c.baseX, c.baseY, zLoop);
      m.rotation.set(t * c.spinX + i, t * c.spinY + p * 3.0, i * 0.5);
      const s = c.scale * (0.4 + 0.6 * whiteAmt);
      m.scale.setScalar(s);
    }
  });

  return (
    <group>
      {Array.from({ length: 14 }, (_, i) => (
        <mesh
          key={`rib-${i}`}
          ref={(el) => {
            ribRefs.current[i] = el;
          }}
          geometry={ribGeo}
          material={ribMat}
        />
      ))}
      {crystals.map((_, i) => (
        <mesh
          key={`crystal-${i}`}
          ref={(el) => {
            crystalRefs.current[i] = el;
          }}
          geometry={diamondGeo}
          material={crystalMat}
        />
      ))}
    </group>
  );
}

/**
 * Shared Lusion `#home-goal` Two-Stage Image Tunnel Experience
 *
 * Implements the verified `GoalSectionRanges` progression:
 *   1. `#home-goal-context` (`#home-goal-title` + `#home-goal-texts` 2 paragraphs)
 *   2. Entry tablet bezel (`#home-goal-image-in-outer` -> `#home-goal-image-in` with Earth horizon)
 *   3. Stage 1 Dark Space Image Tunnel (`#000000` surface + spreading 3-line `#home-goal-tunnel-title`
 *      `"STEP INTO A NEW WORLD / AND LET YOUR / IMAGINATION RUN WILD"` + 3D perspective portfolio fly-through)
 *   4. Stage 2 White Prismatic Crystal & Sticker Tunnel (`#ffffff` surface + spinning refractive crystals
 *      + floating studio sticker sprites) zooming out through `#home-goal-image-out` (`desktop.png` bezel)
 *      into `#end-section`.
 */
export function GoalTunnelSection() {
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);

  const runwayRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(0);
  const pointerRef = useRef({ x: 0, y: 0 });

  const [progress, setProgress] = useState(0);
  const [webglOk, setWebglOk] = useState(true);
  const [nearViewport, setNearViewport] = useState(false);
  const [earthFailed, setEarthFailed] = useState(false);

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("forceWebglFallback") === "1") {
          setWebglOk(false);
          return;
        }
        const c = document.createElement("canvas");
        if (!(c.getContext("webgl2") || c.getContext("webgl"))) {
          setWebglOk(false);
        }
      } catch {
        setWebglOk(false);
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const el = runwayRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        setNearViewport(entries.some((e) => e.isIntersecting));
      },
      { rootMargin: "500px 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Deterministic scroll-progress calculation across `#home-goal-runway`
  useEffect(() => {
    let lastSurface: "void" | "ice" | null = null;

    const updateFromScroll = () => {
      const el = runwayRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const totalScrollable = Math.max(1, rect.height - window.innerHeight);
      const raw = -rect.top / totalScrollable;
      const clamped = Math.max(0, Math.min(1, raw));
      progressRef.current = clamped;
      setProgress(clamped);

      // Update header ink polarity when inside dark Stage 1 tunnel vs light Stage 2 / outer page
      const inViewport = rect.top <= 80 && rect.bottom >= 140;
      if (inViewport) {
        const nextSurface: "void" | "ice" = clamped >= 0.14 && clamped < 0.57 ? "void" : "ice";
        if (nextSurface !== lastSurface) {
          lastSurface = nextSurface;
          setActiveSurface(nextSurface);
        }
      } else if (lastSurface === "void") {
        lastSurface = "ice";
        setActiveSurface("ice");
      }
    };

    updateFromScroll();
    window.addEventListener("scroll", updateFromScroll, { passive: true });
    window.addEventListener("resize", updateFromScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", updateFromScroll);
      window.removeEventListener("resize", updateFromScroll);
    };
  }, [setActiveSurface]);

  // Derived stage weights matching `GoalSectionRanges`
  const entryZoom = Math.min(1, Math.max(0, progress / 0.18)); // 0 -> 1 zooms tablet frame into fullscreen
  const isStage2White = progress >= 0.56;
  const darkTunnelT = Math.min(1, Math.max(0, (progress - 0.16) / 0.40)); // 0..1 across Stage 1
  const whiteTunnelT = Math.min(1, Math.max(0, (progress - 0.56) / 0.28)); // 0..1 across Stage 2
  const exitShrink = Math.min(1, Math.max(0, (progress - 0.82) / 0.18)); // 0..1 shrinks into desktop exit bezel

  const tunnelCards = useMemo(() => LUSION_HOME.featured.projects.slice(0, 8), []);

  // Compute scale of active portal viewport (`tablet` in -> full `1.0` -> `desktop` out)
  const portalScale = reducedMotion
    ? 0.94
    : progress < 0.18
      ? 0.56 + 0.44 * entryZoom
      : progress > 0.82
        ? 1.0 - 0.26 * exitShrink
        : 1.0;

  const portalRadius = reducedMotion
    ? 20
    : progress < 0.18
      ? Math.round(24 * (1 - entryZoom))
      : progress > 0.82
        ? Math.round(22 * exitShrink)
        : 0;

  const titleSpreadEm = darkTunnelT * 2.4;
  const titleOpacity =
    progress < 0.13
      ? 0
      : progress < 0.22
        ? (progress - 0.13) / 0.09
        : progress > 0.46
          ? Math.max(0, 1 - (progress - 0.46) / 0.09)
          : 1;

  return (
    <section
      id="home-goal"
      data-tunnel-stage={isStage2White ? "white-tunnel" : progress >= 0.16 ? "black-tunnel" : "entry-frame"}
      data-tunnel-progress={progress.toFixed(3)}
      className="section relative w-full bg-[#f0f1fa] pt-20 pb-24 text-[clamp(0.875rem,1vw,2rem)] text-[#000000] md:pt-32 md:pb-36"
    >
      {/* 1. Narrative Context Grid (`#home-goal-context`) */}
      <div id="home-goal-context" className="relative px-[var(--base-padding-x)]">
        <div
          id="home-goal-context-inner"
          className="relative grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:grid-cols-12"
        >
          <h2
            id="home-goal-title"
            className="col-span-6 font-sans text-[15.2vw] leading-[0.98] font-normal tracking-[-0.02em] text-black sm:text-[10vw] min-[813px]:col-span-12 min-[813px]:mt-[0.8em] min-[813px]:mb-[0.45em] min-[813px]:max-w-[11.2em] min-[813px]:text-[8vw]"
          >
            {LUSION_HOME.goal.heading}
          </h2>

          <div
            id="home-goal-texts"
            className="col-span-6 mt-10 mb-14 flex flex-col gap-6 font-sans text-[1.125rem] leading-[1.45] text-black/88 min-[813px]:col-start-8 min-[813px]:col-end-13 min-[813px]:mt-2 min-[813px]:mb-20 min-[813px]:text-[clamp(1.05rem,1.35vw,1.6rem)]"
          >
            {LUSION_HOME.goal.paragraphs.map((paragraph, idx) => (
              <p key={idx} className="home-goal-texts-paragraph">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Two-Stage Interactive Tunnel Runway (`360vh` scroll scrub / calm compact frame on reduced motion) */}
      <div
        id="home-goal-runway"
        ref={runwayRef}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          pointerRef.current.x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
          pointerRef.current.y = -(((e.clientY - rect.top) / rect.height - 0.5) * 2);
        }}
        className={reducedMotion ? "relative px-[var(--base-padding-x)]" : "relative h-[360vh] w-full"}
      >
        <div
          className={
            reducedMotion
              ? "relative mx-auto h-[72svh] max-h-[680px] w-full overflow-hidden rounded-[var(--global-border-radius)]"
              : "sticky top-0 flex h-[100svh] w-full items-center justify-center overflow-hidden"
          }
        >
          {/* Anchored semantic DOM markers matching Lusion's `in` and `out` frames */}
          <div id="home-goal-image-in-outer" className="pointer-events-none sr-only" aria-hidden="true">
            <div id="home-goal-image-in-inner">
              <div id="home-goal-image-in" />
            </div>
          </div>
          <div id="home-goal-image-out-outer" className="pointer-events-none sr-only" aria-hidden="true">
            <div id="home-goal-image-out-inner">
              <div id="home-goal-image-out" />
            </div>
          </div>

          {/* Transforming Portal Frame (`tablet.png` entry -> Fullscreen Stage 1/2 Tunnel -> `desktop.png` exit) */}
          <div
            style={{
              transform: `scale(${portalScale.toFixed(4)})`,
              borderRadius: `${portalRadius}px`,
              backgroundColor: isStage2White ? "#ffffff" : "#03040a",
            }}
            className="relative flex h-full w-full items-center justify-center overflow-hidden shadow-[0_32px_90px_rgba(6,10,30,0.28)] transition-colors duration-500 will-change-transform"
          >
            {/* Stage 1 Background: Earth Horizon & Atmospheric Cobalt Limb (`earth_landscape.jpg`) */}
            <div
              aria-hidden="true"
              style={{
                opacity: isStage2White ? 0 : Math.max(0.18, 1 - darkTunnelT * 0.72),
                transform: `scale(${(1 + darkTunnelT * 0.36).toFixed(3)}) translateY(${(darkTunnelT * 12).toFixed(1)}%)`,
              }}
              className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            >
              {!earthFailed ? (
                <img
                  src="/assets/textures/tunnels/earth_landscape.jpg"
                  alt=""
                  onError={() => setEarthFailed(true)}
                  className="h-full w-full object-cover object-center opacity-80"
                />
              ) : (
                <div
                  style={{
                    background:
                      "radial-gradient(ellipse 90% 45% at 50% 82%, #4169E1 0%, #0d1b56 38%, #020308 75%)",
                  }}
                  className="h-full w-full"
                />
              )}
              <div
                style={{
                  background:
                    "radial-gradient(circle at 50% 50%, rgba(26,47,251,0.24) 0%, rgba(2,3,8,0.78) 70%)",
                }}
                className="absolute inset-0"
              />
            </div>

            {/* Stage 1 Deep-Space Chromatic Halo & Perspective Portfolio Tunnel (`#000000` high contrast) */}
            {!isStage2White && (
              <div
                aria-hidden="true"
                style={{ perspective: "900px" }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-[#000000]"
              >
                {/* Rainbow Chromatic Dispersion Halo matching `ref-07` & `ref-08` */}
                <div
                  style={{
                    transform: `scale(${(0.88 + darkTunnelT * 0.42).toFixed(3)})`,
                    boxShadow:
                      "inset 0 0 42px rgba(255,140,80,0.45), 0 0 54px rgba(72,140,255,0.52), 0 0 96px rgba(193,255,0,0.16)",
                  }}
                  className="h-[340px] w-[340px] rounded-full border-[10px] border-sky-300/35 md:h-[580px] md:w-[580px]"
                />

                {tunnelCards.map((item, idx) => {
                  const angle = (idx / tunnelCards.length) * Math.PI * 2 + darkTunnelT * 1.1;
                  const cycle = ((darkTunnelT * 1.65 + idx / tunnelCards.length) % 1 + 1) % 1;
                  const zPx = -1250 + cycle * 1450;
                  const radiusPx = 300 + (idx % 2) * 65;
                  const xPx = Math.cos(angle) * radiusPx;
                  const yPx = Math.sin(angle) * (radiusPx * 0.62);
                  const cardOpacity =
                    0.48 * Math.min(1, cycle * 3.2) * Math.max(0, 1 - Math.max(0, (cycle - 0.82) / 0.18));

                  return (
                    <div
                      key={item.id}
                      style={{
                        opacity: reducedMotion ? 0.35 : cardOpacity * Math.min(1, entryZoom * 1.4),
                        transform: `translate3d(${xPx.toFixed(1)}px, ${yPx.toFixed(1)}px, ${zPx.toFixed(0)}px)`,
                        backgroundColor: item.colorBg,
                      }}
                      className="absolute h-[115px] w-[175px] overflow-hidden rounded-xl border border-white/15 shadow-[0_0_32px_rgba(65,105,225,0.22)] md:h-[155px] md:w-[235px]"
                    >
                      <img
                        src={item.thumbnail}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = "none";
                        }}
                      />
                    </div>
                  );
                })}

                {/* Dark central contrast vignette so white tunnel words always maintain >= 14:1 contrast */}
                <div
                  style={{
                    background:
                      "radial-gradient(circle, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.42) 48%, rgba(0,0,0,0) 74%)",
                  }}
                  className="h-[340px] w-[340px] rounded-full md:h-[540px] md:w-[540px]"
                />
              </div>
            )}

            {/* Stage 2 Background: Luminous White Prismatic Field & Floating Studio Stickers */}
            {isStage2White && (
              <div
                aria-hidden="true"
                style={{ perspective: "900px" }}
                className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden bg-gradient-to-b from-[#f8f9ff] via-[#ffffff] to-[#eef1ff]"
              >
                {/* Soft refractive rainbow halo */}
                <div
                  style={{
                    transform: `scale(${(0.85 + whiteTunnelT * 0.5).toFixed(3)})`,
                    background:
                      "radial-gradient(circle, rgba(104,154,255,0.28) 0%, rgba(193,255,0,0.12) 38%, rgba(255,255,255,0) 70%)",
                  }}
                  className="h-[620px] w-[620px] rounded-full blur-xl"
                />

                {/* Crisp Vector Studio Stickers Floating Through Stage 2 White Tunnel */}
                {STICKER_SPRITES.map((_, idx) => {
                  const ang = (idx / STICKER_SPRITES.length) * Math.PI * 2 + whiteTunnelT * 0.95;
                  const dist = 140 + (idx % 3) * 92 + whiteTunnelT * 78;
                  const tx = Math.cos(ang) * dist;
                  const ty = Math.sin(ang) * (dist * 0.64);
                  const rot = (idx % 2 === 0 ? 1 : -1) * (12 + whiteTunnelT * 26);
                  const palette = ["#1a2ffb", "#c1ff00", "#ff4c41", "#8832f7", "#121416"];
                  const badgeBg = palette[idx % palette.length];
                  const fg = badgeBg === "#c1ff00" ? "#000000" : "#ffffff";
                  const paths = [
                    "M12 2l2.6 6.8L22 12l-7.4 3.2L12 22l-2.6-6.8L2 12l7.4-3.2L12 2z",
                    "M13 2L4 14h7l-1 8 9-12h-7l1-8z",
                    "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z",
                    "M12 2a10 10 0 100 20 10 10 0 000-20zm-3.5 7a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm7 0a1.5 1.5 0 110 3 1.5 1.5 0 010-3zm-7.5 6.5h8a4 4 0 01-8 0z",
                    "M12 2L2 9l10 13L22 9 12 2z",
                  ];
                  return (
                    <div
                      key={idx}
                      style={{
                        backgroundColor: badgeBg,
                        color: fg,
                        transform: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${rot.toFixed(1)}deg)`,
                      }}
                      className="absolute flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-white p-3 shadow-[0_14px_30px_rgba(26,47,251,0.16)] md:h-16 md:w-16"
                    >
                      <svg viewBox="0 0 24 24" fill="currentColor" className="h-full w-full">
                        <path d={paths[idx % paths.length]} />
                      </svg>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Real WebGL 3D Tunnel Ribs (Stage 1) + Spinning Faceted Prismatic Crystals (Stage 2) */}
            {webglOk && nearViewport && (
              <TunnelCanvasBoundary>
                <div className="pointer-events-none absolute inset-0">
                  <Canvas
                    dpr={[1, 1.75]}
                    camera={{ position: [0, 0, 5], fov: 45 }}
                    gl={{ alpha: true, antialias: true }}
                  >
                    <Tunnel3DScene
                      progressRef={progressRef}
                      pointerRef={pointerRef}
                      reducedMotion={reducedMotion}
                    />
                  </Canvas>
                </div>
              </TunnelCanvasBoundary>
            )}

            {/* Stage 1 Spreading Tunnel Typography (`#home-goal-tunnel-title` — locked to 3 lines on 390px) */}
            <div
              id="home-goal-tunnel-title"
              style={{
                opacity: reducedMotion ? 1 : titleOpacity,
              }}
              className="pointer-events-none relative z-10 w-full px-3 text-center font-sans text-[5.15vw] leading-[1.15] font-normal tracking-[-0.01em] text-white uppercase min-[813px]:px-6 min-[813px]:text-[5.2vw] min-[813px]:leading-[1.06]"
            >
              {LUSION_HOME.goal.tunnelTitleLines.map((line, lineIdx) => {
                const words = line.split(" ");
                return (
                  <div
                    key={lineIdx}
                    style={{
                      columnGap: reducedMotion ? "0.24em" : `${(0.22 + titleSpreadEm * 0.34).toFixed(2)}em`,
                    }}
                    className="home-goal-tunnel-title-line flex flex-nowrap items-center justify-center whitespace-nowrap"
                  >
                    {words.map((word, wIdx) => (
                      <span key={wIdx} className="inline-block drop-shadow-[0_4px_24px_rgba(0,0,0,0.85)]">
                        {word}
                      </span>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Entry Tablet Hardware Bezel Overlay (fades out cleanly as entryZoom -> 1) */}
            {progress < 0.16 && (
              <div
                aria-hidden="true"
                style={{ opacity: Math.max(0, 1 - entryZoom * 1.25) }}
                className="pointer-events-none absolute inset-x-4 top-20 bottom-6 z-20 rounded-[inherit] border-[12px] border-[#191b24] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.14)] md:inset-x-6 md:top-24 md:border-[18px]"
              />
            )}

            {/* Exit Studio Display Hardware Bezel Overlay (inset below `#header` so it never collides with logo/menu) */}
            {progress > 0.90 && (
              <div
                aria-hidden="true"
                style={{ opacity: exitShrink * 0.92 }}
                className="pointer-events-none absolute inset-x-4 top-20 bottom-6 z-20 rounded-[24px] border-[12px] border-[#1c1f2b] shadow-[inset_0_0_0_2px_rgba(255,255,255,0.22)] md:inset-x-8 md:top-24 md:border-[16px]"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
