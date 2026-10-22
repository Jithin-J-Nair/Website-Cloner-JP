"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import { LUSION_ABOUT } from "@/data/reference";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { loadBufGeometry } from "@/lib/lusion-buf-loader";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";

/**
 * Interactive 3D-Projected Volumetric Nebula + Glowing Cyan Cores (`#about-who` hero canvas)
 * Matches `10a-about-hero--1440x900.jpg` & `10a-about-hero--390x844.jpg`.
 */
function AboutHeroParticleCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COUNT = 780;
    const pts = Array.from({ length: COUNT }, (_, i) => {
      const u = (i * 0.6180339887) % 1;
      const v = i / COUNT;
      const angle = u * Math.PI * 2 * 3.6;
      const arm = (v - 0.36) * 2.05;
      const isCyanCore = i % 118 === 17;
      return {
        bx: arm * 0.68 + Math.cos(angle) * (0.12 + v * 0.34),
        by: -arm * 0.4 + Math.sin(angle * 1.25) * (0.14 + v * 0.3) - 0.06,
        bz: Math.sin(angle) * 0.48,
        size: isCyanCore ? 11.5 : i % 31 === 0 ? 6.8 : i % 8 === 0 ? 3.4 : 1.3 + (i % 5) * 0.5,
        alpha: isCyanCore ? 0.96 : 0.2 + (1 - Math.abs(v - 0.46)) * 0.58,
        phase: i * 0.13,
        isCyanCore,
      };
    });

    let rafId = 0;
    let t = 1.6;
    let last = performance.now();

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width * dpr));
      const h = Math.max(320, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const render = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!reducedMotion) t += dt * 0.52;

      const w = canvas.width;
      const h = canvas.height;
      const isMobile = w < 900;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // Volumetric silver-charcoal studio mist billows (`10a-about-hero`)
      const mistPuffs = isMobile
        ? [
            [0.36, 0.24, 0.42, 0.24],
            [0.64, 0.18, 0.38, 0.2],
            [0.28, 0.42, 0.38, 0.2],
            [0.62, 0.48, 0.4, 0.18],
          ]
        : [
            [0.44, 0.22, 0.24, 0.24],
            [0.52, 0.38, 0.26, 0.22],
            [0.34, 0.34, 0.2, 0.18],
            [0.56, 0.52, 0.22, 0.18],
          ];
      for (const [mx, my, mr, ma] of mistPuffs) {
        const rr = Math.max(w, h) * mr;
        const g = ctx.createRadialGradient(w * mx, h * my, rr * 0.05, w * mx, h * my, rr);
        g.addColorStop(0, `rgba(182, 194, 210, ${ma})`);
        g.addColorStop(0.45, `rgba(98, 108, 126, ${(ma * 0.48).toFixed(3)})`);
        g.addColorStop(1, "rgba(0, 0, 0, 0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }

      const scale = Math.min(w, h) * (isMobile ? 0.92 : 0.74);
      const px = pointerRef.current.active ? pointerRef.current.x * 0.18 : 0;
      const py = pointerRef.current.active ? pointerRef.current.y * 0.14 : 0;

      for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i];
        const driftX = Math.sin(t + p.phase) * 0.032 + px * (0.4 + p.bz);
        const driftY = Math.cos(t * 0.85 + p.phase * 1.2) * 0.032 + py * (0.4 + p.bz);
        const z = 1.45 + p.bz * 0.65 + Math.sin(t * 0.5 + p.phase) * 0.12;
        const sx =
          w * (isMobile ? 0.5 : 0.47) + ((p.bx + driftX) / z) * scale * (isMobile ? 1.32 : 0.96);
        const sy =
          h * (isMobile ? 0.38 : 0.36) + ((p.by + driftY) / z) * scale * (isMobile ? 1.48 : 1.05);
        const r = Math.max(1.0, (p.size / z) * (isMobile ? 1.75 : 2.05));

        if (p.isCyanCore) {
          const glow = ctx.createRadialGradient(sx, sy, r * 0.15, sx, sy, r * 2.6);
          glow.addColorStop(0, "rgba(185, 252, 255, 0.98)");
          glow.addColorStop(0.32, "rgba(0, 232, 255, 0.82)");
          glow.addColorStop(1, "rgba(0, 210, 255, 0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(sx, sy, r * 2.6, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(sx, sy, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(218, 226, 238, ${Math.min(0.9, p.alpha / z).toFixed(3)})`;
          ctx.fill();
        }
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    render(performance.now());
    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
  }, [reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      onPointerMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        pointerRef.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1;
        pointerRef.current.active = true;
      }}
      onPointerLeave={() => {
        pointerRef.current.active = false;
      }}
      className="absolute inset-0 h-full w-full"
    />
  );
}

interface DecodedPortraitCloud {
  positions: Float32Array;
  nShade: Uint8Array | null;
  count: number;
}

/**
 * Real 8,192-Vertex 3D Team Portrait Relief Stage (`#about-who` member viewer)
 * Decodes each specialist's verified `/assets/team/<id>.buf` mesh (`position:Uint16Array[3]`,
 * `nShade:Uint8Array[4]`) with automatic procedural fallback when isolated from media files.
 */
function TeamPointSculpture({
  memberIndex,
  memberName,
  modelPath,
  reducedMotion,
}: {
  memberIndex: number;
  memberName: string;
  modelPath: string;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cloud, setCloud] = useState<DecodedPortraitCloud | null>(null);

  useEffect(() => {
    let alive = true;
    loadBufGeometry(modelPath)
      .then((res) => {
        if (!alive) return;
        const pos = res.attributes.position;
        if (pos && pos.length >= 3) {
          const f32 = pos instanceof Float32Array ? pos : Float32Array.from(pos);
          const nsRaw = res.attributes.nShade;
          const ns = nsRaw instanceof Uint8Array ? nsRaw : null;
          setCloud({
            positions: f32,
            nShade: ns,
            count: Math.floor(f32.length / 3),
          });
        }
      })
      .catch(() => {
        if (alive) setCloud(null);
      });
    return () => {
      alive = false;
    };
  }, [modelPath]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let time = 0;

    const render = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(280, Math.round(rect.width * dpr));
      const h = Math.max(280, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      if (!reducedMotion) time += 0.018;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.52;
      const scale = Math.min(w, h) * 0.44;
      const yaw = Math.sin(time * 0.7) * 0.16;
      const cosY = Math.cos(yaw);
      const sinY = Math.sin(yaw);

      if (cloud && cloud.count > 0) {
        const { positions, nShade, count } = cloud;
        for (let i = 0; i < count; i += 1) {
          const x0 = positions[i * 3];
          const y0 = positions[i * 3 + 1];
          const z0 = (positions[i * 3 + 2] - 0.45) * 0.65;

          const rx = x0 * cosY + z0 * sinY;
          const rz = -x0 * sinY + z0 * cosY;
          const depth = 2.05 - rz * 0.55;

          const px = cx + (rx / depth) * scale * 2.05;
          const py = cy - (y0 / depth) * scale * 2.05;

          let lum = 0.62;
          let cyanMix = 0;
          if (nShade && i * 4 + 3 < nShade.length) {
            const nx = nShade[i * 4] / 255;
            const ny = nShade[i * 4 + 1] / 255;
            const shade = nShade[i * 4 + 3] / 255;
            lum = Math.min(1, 0.2 + shade * 0.82 + ny * 0.16);
            cyanMix = nx > 0.72 && shade > 0.55 ? (nx - 0.72) * 2.4 : 0;
          }

          const ptR = Math.max(1.05, (1.85 / depth) * (w > 700 ? 1.35 : 1.05));
          const rCh = Math.round(195 * lum * (1 - cyanMix * 0.75));
          const gCh = Math.round(212 * lum + 42 * cyanMix);
          const bCh = Math.round(232 * lum + 23 * cyanMix);
          ctx.fillStyle = `rgba(${rCh},${gCh},${bCh},${Math.min(0.95, 0.34 + lum * 0.62).toFixed(3)})`;
          ctx.fillRect(px - ptR * 0.5, py - ptR * 0.5, ptR, ptR);
        }
      } else {
        // Clean procedural 3D sculptural bust fallback when `/assets/team/*.buf` is isolated
        const seed = memberIndex * 1.37;
        for (let i = 0; i < 1600; i += 1) {
          const v = i / 1600;
          const phi = v * Math.PI;
          const theta = i * 2.399963 + yaw * 2 + seed;
          const profile =
            v < 0.58
              ? Math.sin(phi * 1.12) * (0.82 + 0.12 * Math.cos(theta * 2 + seed))
              : 0.42 + (v - 0.58) * 1.55;
          const yNorm = (v - 0.5) * 1.85;
          const x3 = Math.cos(theta) * profile;
          const z3 = Math.sin(theta) * profile * 0.78;
          const depth = 2.4 + z3;
          const px = cx + (x3 / depth) * scale * 2.0;
          const py = cy + (yNorm / depth) * scale * 1.85;
          const shade = Math.max(0.24, 0.68 - z3 * 0.42);
          const r = Math.max(1.1, (2.2 / depth) * (w > 600 ? 1.4 : 1.1));
          ctx.fillStyle =
            i % 23 === 0
              ? `rgba(0, 232, 255, ${(shade * 0.92).toFixed(3)})`
              : `rgba(218, 228, 244, ${(shade * 0.85).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(px, py, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(rafId);
  }, [cloud, memberIndex, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label={`3D point-cloud portrait for ${memberName}`}
      className="h-full w-full"
    />
  );
}

/**
 * Verified Client Logo Tile (`/assets/images/logo/@logo--*.svg` white mark with clean text fallback)
 */
function ClientLogoTile({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-20 items-center justify-center px-3 transition-opacity duration-300 opacity-85 hover:opacity-100 md:h-24 md:px-5">
      {!failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-12 w-auto max-w-[140px] object-contain brightness-0 invert md:h-16 md:max-w-[175px]"
        />
      ) : (
        <span className="font-sans text-xs font-medium tracking-[0.06em] text-white/90 uppercase md:text-sm">
          {name}
        </span>
      )}
    </div>
  );
}

/**
 * Verified Lusion About Page (`/about`)
 *
 * Matches all 8 desktop (`1440x900`) & mobile (`390x844`) reference states (`10a`..`10d`):
 *   1. `#about-who` (`#000000` volumetric cyan/silver hero -> dark studio statement -> full-bleed `T E A M` 8,192-point relief stage)
 *   2. `#about-clients` (`#000000` `BRANDS WE WORK WITH` + 3 rows of crisp white client SVG emblems)
 *   3. `#about-award` (`#000000` recognition ledger: `58` awards, `03` articles, `5` talks)
 *   4. `#about-capability` (`#1a2ffb` electric cobalt `AREA OF / EXPERTISE` + `S / C / T / P` tabs & white sacred-geometry cards)
 *   5. `#end-section` + 6. `#footer-section` (`#f0f1fa` light studio closing bands -> `Our Projects`)
 */
export function AboutPageView() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  const darkUpperRef = useRef<HTMLDivElement>(null);
  const capabilityBandRef = useRef<HTMLElement>(null);
  const [activeMemberIdx, setActiveMemberIdx] = useState(0);
  const [activeCapabilityIdx, setActiveCapabilityIdx] = useState(0);
  const touchStartXRef = useRef<number | null>(null);

  const team = LUSION_ABOUT.who.team;
  const activeMember = team[activeMemberIdx] ?? team[0];

  // Sync fixed `#header` contrast across `#000000` (`void`), `#1a2ffb` (`cobalt`), and `#f0f1fa` (`ice`)
  useEffect(() => {
    const syncHeaderSurface = () => {
      const vhMid = window.innerHeight * 0.12;
      const capRect = capabilityBandRef.current?.getBoundingClientRect();
      const darkRect = darkUpperRef.current?.getBoundingClientRect();

      if (capRect && capRect.top <= vhMid && capRect.bottom >= vhMid) {
        setActiveSurface("cobalt");
      } else if (darkRect && darkRect.bottom >= vhMid) {
        setActiveSurface("void");
      } else {
        setActiveSurface("ice");
      }
    };

    syncHeaderSurface();
    window.addEventListener("scroll", syncHeaderSurface, { passive: true });
    window.addEventListener("resize", syncHeaderSurface, { passive: true });
    return () => {
      window.removeEventListener("scroll", syncHeaderSurface);
      window.removeEventListener("resize", syncHeaderSurface);
      setActiveSurface("ice");
    };
  }, [setActiveSurface]);

  const stepMember = (delta: number) => {
    soundEngine.playClick();
    setActiveMemberIdx((prev) => (prev + delta + team.length) % team.length);
  };

  return (
    <main id="about" className="relative overflow-x-clip bg-[#f0f1fa] text-[#000000]">
      {/* Dark Studio Upper Monolith (`#about-who` + `#about-clients` + `#about-award`) */}
      <div ref={darkUpperRef} className="bg-[#000000] text-white">
        {/* =====================================================================
            1. WHO WE ARE HERO + STUDIO STATEMENT + 8,192-PT TEAM STAGE (`#about-who`)
           ===================================================================== */}
        <section id="about-who" className="relative w-full bg-[#000000] text-white">
          {/* Opening 100vh Dark Atmospheric Stage (`10a-about-hero`) */}
          <div className="relative flex h-[calc(var(--vh,1vh)*100)] min-h-[600px] w-full flex-col justify-between overflow-hidden bg-[#000000] px-[var(--base-padding-x)] pt-24 pb-5 text-white">
            <AboutHeroParticleCanvas reducedMotion={reducedMotion} />

            <div aria-hidden="true" className="h-6" />

            {/* Mid-Viewport Horizontal Registration Crosses (`+   +   +   +   +`) */}
            <div
              aria-hidden="true"
              className="pointer-events-none relative z-10 flex w-full items-center justify-between text-white/55"
            >
              <span className="lusion-plus-cross" />
              <span className="lusion-plus-cross" />
              <span className="lusion-plus-cross" />
              <span className="lusion-plus-cross" />
              <span className="lusion-plus-cross" />
            </div>

            {/* Monumental Double-Stroke Etched `LUSION` Wordmark + `SCROLL TO EXPLORE` */}
            <div className="relative z-10 w-full">
              <h1 className="sr-only">
                Lusion — {LUSION_ABOUT.who.leftLines.join(" ")} {LUSION_ABOUT.who.rightHeadline}
              </h1>
              <svg
                viewBox="0 0 1400 305"
                fill="none"
                aria-hidden="true"
                className="-mx-1 block h-auto w-[calc(100%+0.5rem)] select-none"
              >
                <text
                  x="12"
                  y="272"
                  textLength="1376"
                  lengthAdjust="spacingAndGlyphs"
                  fill="rgba(255,255,255,0.06)"
                  stroke="#ffffff"
                  strokeWidth="3.2"
                  fontFamily="LusionSansCalibrated, system-ui, sans-serif"
                  fontSize="318"
                  fontWeight="400"
                >
                  LUSION
                </text>
                <text
                  x="17"
                  y="276"
                  textLength="1366"
                  lengthAdjust="spacingAndGlyphs"
                  fill="none"
                  stroke="rgba(255,255,255,0.52)"
                  strokeWidth="1.4"
                  fontFamily="LusionSansCalibrated, system-ui, sans-serif"
                  fontSize="318"
                  fontWeight="400"
                >
                  LUSION
                </text>
              </svg>

              <div className="mt-1 flex items-center justify-center md:justify-end">
                <span className="font-sans text-[11px] font-medium tracking-[0.08em] text-white/90 uppercase md:text-xs">
                  {LUSION_ABOUT.who.scrollPrompt}
                </span>
              </div>
            </div>
          </div>

          {/* Dark Studio Manifesto Split Band */}
          <div className="grid grid-cols-6 gap-x-[var(--grid-gap)] px-[var(--base-padding-x)] pt-24 pb-20 min-[813px]:grid-cols-12 min-[813px]:pt-36 min-[813px]:pb-28">
            <div className="col-span-6 min-[813px]:col-span-6">
              <h2 className="font-sans text-[10.2vw] leading-[0.96] font-normal tracking-[-0.025em] text-white uppercase min-[813px]:text-[5vw]">
                {LUSION_ABOUT.who.leftLines.map((line, idx) => (
                  <span key={idx} className="block">
                    {line}
                  </span>
                ))}
              </h2>
            </div>

            <div className="col-span-6 mt-8 flex flex-col justify-end min-[813px]:col-span-6 min-[813px]:mt-0">
              <p className="font-sans text-[6.2vw] leading-[1.06] font-normal tracking-[-0.02em] text-white uppercase min-[813px]:text-[2.5vw]">
                {LUSION_ABOUT.who.rightHeadline}
              </p>
              <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-white/75 md:text-lg">
                {LUSION_ABOUT.who.teamDescription}
              </p>
            </div>
          </div>

          {/* Full-Bleed Dark 8,192-Point Team Portrait Stage (`10b-about-who-team`) */}
          <div
            onTouchStart={(e) => {
              touchStartXRef.current = e.touches[0]?.clientX ?? null;
            }}
            onTouchEnd={(e) => {
              if (touchStartXRef.current === null) return;
              const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
              touchStartXRef.current = null;
              if (Math.abs(dx) > 40) stepMember(dx < 0 ? 1 : -1);
            }}
            className="relative flex min-h-[88svh] w-full flex-col justify-between overflow-hidden bg-[#000000] px-[var(--base-padding-x)] py-12"
          >
            {/* Top Index Row: `[[ 001 ]]` Left + `2x12` Dot Matrix Selector Right */}
            <div className="relative z-20 flex items-center justify-between pt-6">
              <span
                data-team-compass="true"
                className="font-mono text-sm font-medium tracking-[0.22em] text-white"
              >
                [[ {activeMember.indexFormatted} ]]
              </span>

              <div className="flex flex-wrap items-center gap-2">
                {team.map((member, idx) => (
                  <button
                    key={member.id}
                    type="button"
                    aria-label={`Select ${member.name}`}
                    onClick={() => {
                      soundEngine.playHover();
                      setActiveMemberIdx(idx);
                    }}
                    className={`cursor-pointer rounded-full px-2.5 py-1 font-mono text-[11px] transition-colors ${
                      idx === activeMemberIdx
                        ? "bg-white text-black"
                        : "bg-white/12 text-white/75 hover:bg-white/25"
                    }`}
                  >
                    {member.indexFormatted}
                  </button>
                ))}
              </div>
            </div>

            {/* Center Monumental `T  E  A  M` Backdrop + 8,192-Point Relief Portrait + Cobalt `→` Orb */}
            <div className="relative my-4 flex flex-1 items-center justify-center">
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 flex items-center justify-between px-2 font-sans text-[21vw] leading-none font-normal tracking-[0.06em] text-white/[0.11] uppercase select-none"
              >
                <span>T</span>
                <span>E</span>
                <span>A</span>
                <span>M</span>
              </div>

              {/* Mid-Plane Crosshair Row */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 flex items-center justify-between text-white/45"
              >
                <span className="lusion-plus-cross" />
                <span className="lusion-plus-cross" />
                <span className="lusion-plus-cross max-[812px]:hidden" />
                <span className="lusion-plus-cross" />
                <span className="lusion-plus-cross" />
              </div>

              {/* 3D Point-Cloud Portrait Canvas */}
              <div className="relative z-10 aspect-square w-full max-w-[540px]">
                <TeamPointSculpture
                  memberIndex={activeMember.index}
                  memberName={activeMember.name}
                  modelPath={activeMember.modelPath}
                  reducedMotion={reducedMotion}
                />
              </div>

              {/* Desktop Cobalt Next Specialist Orb (`#1a2ffb`) */}
              <button
                type="button"
                onClick={() => stepMember(1)}
                aria-label="Next team member"
                className="z-20 flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-[#1a2ffb] text-white shadow-[0_12px_36px_rgba(26,47,251,0.55)] transition-transform duration-300 hover:scale-105 focus-visible:outline-2 focus-visible:outline-white max-[812px]:hidden"
              >
                <span aria-hidden="true" className="text-xl leading-none">
                  &rarr;
                </span>
              </button>
            </div>

            {/* Bottom Specialist Name & Role + Prev/Next Controls */}
            <div className="relative z-20 flex flex-wrap items-end justify-between gap-6">
              <div>
                <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-white md:text-6xl">
                  {activeMember.name}
                </h3>
                <p className="mt-2 font-sans text-base leading-snug text-white/75 md:text-lg">
                  {activeMember.roleLines.map((line, i) => (
                    <span key={i} className="block">
                      {line}
                    </span>
                  ))}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => stepMember(-1)}
                  aria-label="Previous team member"
                  className="cursor-pointer rounded-full border border-white/25 px-4 py-2 font-mono text-xs tracking-[0.08em] text-white uppercase transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-white"
                >
                  &larr; Prev
                </button>
                <button
                  type="button"
                  onClick={() => stepMember(1)}
                  className="cursor-pointer rounded-full border border-white/25 px-4 py-2 font-mono text-xs tracking-[0.08em] text-white uppercase transition-colors hover:border-white hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-white min-[813px]:hidden"
                >
                  Next &rarr;
                </button>
                <span className="font-mono text-[11px] tracking-[0.08em] text-white/60 uppercase min-[813px]:hidden">
                  {LUSION_ABOUT.who.mobileSwipeHint}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* =====================================================================
            2. BRANDS WE WORK WITH (`#about-clients` — 3 White SVG Logo Rows on `#000000`)
           ===================================================================== */}
        <section
          id="about-clients"
          className="border-t border-white/10 bg-[#000000] px-[var(--base-padding-x)] py-24 text-white min-[813px]:py-32"
        >
          <div className="grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:grid-cols-12">
            <div className="col-span-6 min-[813px]:col-span-5">
              <h2 className="font-sans text-[10vw] leading-[0.98] font-normal tracking-[-0.025em] text-white min-[813px]:text-[3.6vw]">
                {LUSION_ABOUT.clients.heading}
              </h2>
            </div>
            <div className="col-span-6 mt-5 flex items-center min-[813px]:col-start-8 min-[813px]:col-span-5 min-[813px]:mt-0">
              <p className="max-w-md font-sans text-xs leading-relaxed tracking-[0.05em] text-white/80 uppercase md:text-[13px]">
                {LUSION_ABOUT.clients.description}
              </p>
            </div>
          </div>

          <div className="mt-16 flex flex-col gap-8 md:mt-20 md:gap-10">
            {LUSION_ABOUT.clients.carouselRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-3 items-center gap-4 sm:grid-cols-4 md:grid-cols-6"
              >
                {row.map((client, cIdx) => (
                  <ClientLogoTile
                    key={`${client.id}-${cIdx}`}
                    name={client.name}
                    src={client.src}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            3. RECOGNITION LEDGER (`#about-award`: `58` Awards, `03` Articles, `5` Talks)
           ===================================================================== */}
        <section
          id="about-award"
          className="border-t border-white/10 bg-[#000000] px-[var(--base-padding-x)] py-24 text-white min-[813px]:py-32"
        >
          <div className="grid grid-cols-6 gap-8 min-[813px]:grid-cols-12">
            <div className="col-span-6 min-[813px]:col-span-4">
              <div className="flex items-start gap-3">
                <h2 className="font-sans text-5xl font-normal tracking-[-0.025em] text-white md:text-6xl">
                  {LUSION_ABOUT.recognition.awardsHeading}
                </h2>
                <span className="mt-1 rounded-full bg-[#1a2ffb] px-3 py-1 font-mono text-xs font-medium text-white">
                  {LUSION_ABOUT.recognition.awardsDisplayedTotal}
                </span>
              </div>
            </div>

            <div className="col-span-6 grid gap-5 md:grid-cols-2 min-[813px]:col-span-8">
              {LUSION_ABOUT.recognition.awardGroups.map((group) => (
                <div
                  key={group.organization}
                  className="rounded-2xl border border-white/10 bg-[#0b0d13] p-6"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-sans text-lg font-medium text-white">
                      {group.organization}
                    </h3>
                    <span className="font-mono text-xs text-white/60">
                      {String(group.totalCount).padStart(2, "0")}
                    </span>
                  </div>
                  <ul className="mt-3 divide-y divide-white/8">
                    {group.honors.map((honor) => (
                      <li
                        key={`${group.organization}-${honor.recognition}`}
                        className="flex items-center justify-between py-2.5 text-sm"
                      >
                        <span className="text-white/85">{honor.recognition}</span>
                        <span className="font-mono text-xs text-white/65">
                          {honor.countFormatted}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 03 Articles + 5 Talks */}
          <div className="mt-16 grid grid-cols-6 gap-10 border-t border-white/10 pt-14 min-[813px]:grid-cols-12">
            <div className="col-span-6 min-[813px]:col-span-6">
              <div className="flex items-start gap-3">
                <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-white">
                  {LUSION_ABOUT.recognition.articlesHeading}
                </h3>
                <span className="mt-1 rounded-full bg-white/12 px-3 py-0.5 font-mono text-xs text-white">
                  {LUSION_ABOUT.recognition.articlesDisplayedTotal}
                </span>
              </div>
              <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {LUSION_ABOUT.recognition.articles.map((article) => (
                  <li key={article.href}>
                    <a
                      href={article.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between py-4 text-base text-white transition-colors hover:text-[#6e85ff]"
                    >
                      <span>{article.title}</span>
                      <span
                        aria-hidden="true"
                        className="font-mono text-xs transition-transform group-hover:translate-x-1"
                      >
                        &#8599;
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-6 min-[813px]:col-span-6">
              <div className="flex items-start gap-3">
                <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-white">
                  {LUSION_ABOUT.recognition.talksHeading}
                </h3>
                <span className="mt-1 rounded-full bg-white/12 px-3 py-0.5 font-mono text-xs text-white">
                  {LUSION_ABOUT.recognition.talksDisplayedTotal}
                </span>
              </div>
              <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {LUSION_ABOUT.recognition.talks.map((talk) => (
                  <li
                    key={`${talk.event}-${talk.dateAndLocation}`}
                    className="flex items-center justify-between py-4 text-base"
                  >
                    <span className="font-medium text-white">{talk.event}</span>
                    <span className="font-mono text-xs text-white/70">{talk.dateAndLocation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          4. AREA OF EXPERTISE (`#about-capability` — Full-Bleed Electric Cobalt `#1a2ffb`)
         ===================================================================== */}
      <section
        id="about-capability"
        ref={capabilityBandRef}
        className="relative overflow-hidden bg-[linear-gradient(90deg,#1a2ffb_0%,#1527dc_48%,#1e35ff_55%,#1a2ffb_100%)] px-[var(--base-padding-x)] py-24 text-white min-[813px]:py-32"
      >
        <div className="grid grid-cols-6 gap-6 min-[813px]:grid-cols-12">
          <div className="col-span-6 min-[813px]:col-span-7">
            <h2 className="font-sans text-[11vw] leading-[0.95] font-normal tracking-[-0.025em] text-white uppercase min-[813px]:text-[5.2vw]">
              {LUSION_ABOUT.capability.titleLines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-5 max-w-md font-sans text-xs leading-relaxed tracking-[0.05em] text-white/85 uppercase md:text-[13px]">
              {LUSION_ABOUT.capability.subtitle}
            </p>
          </div>

          {/* 4 Bordered Glyph Badges (`S / C / T / P`) matching `10d-about-capability` */}
          <div className="col-span-6 flex items-end gap-3 min-[813px]:col-span-5 min-[813px]:justify-end">
            {LUSION_ABOUT.capability.cards.map((card, idx) => {
              const selected = activeCapabilityIdx === idx;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveCapabilityIdx(idx);
                  }}
                  aria-label={`Focus ${card.title}`}
                  className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border font-sans text-xl font-medium transition-all ${
                    selected
                      ? "border-white bg-white text-[#1a2ffb]"
                      : "border-white/55 bg-white/8 text-white hover:border-white"
                  }`}
                >
                  {card.displayInitial}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Sacred-Geometry White-Line Capability Cards on Cobalt */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LUSION_ABOUT.capability.cards.map((card, idx) => {
            const active = activeCapabilityIdx === idx;
            return (
              <div
                key={card.title}
                tabIndex={0}
                role="button"
                aria-pressed={active}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveCapabilityIdx(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    soundEngine.playClick();
                    setActiveCapabilityIdx(idx);
                  }
                }}
                className={`group flex min-h-[410px] cursor-pointer flex-col justify-between rounded-[22px] border p-7 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-white ${
                  active
                    ? "border-white bg-[#1323c9]/85 text-white shadow-[0_24px_60px_rgba(4,9,56,0.35)]"
                    : "border-white/25 bg-[#1628df]/60 text-white hover:-translate-y-1 hover:border-white/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-sans text-3xl font-normal tracking-[-0.02em] text-white">
                    {card.title}
                  </h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 font-sans text-sm font-medium text-white">
                    {card.displayInitial}
                  </span>
                </div>

                {/* Large White-Stroke Sacred Geometry Emblem (`cleanRoomIconSvg` inverted to crisp white) */}
                <div className="my-6 flex items-center justify-center">
                  <img
                    src={card.cleanRoomIconSvg}
                    alt={`${card.title} emblem`}
                    width={140}
                    height={140}
                    className="h-32 w-32 object-contain brightness-0 invert opacity-92 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <ul className="space-y-2 border-t border-white/20 pt-4 text-sm text-white/90">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5, 6 & 7. END CTA, STUDIO FOOTER & SCROLL PORTAL (`Our Projects` -> `/projects`)
         ===================================================================== */}
      <ContactCtaSection />
      <StudioFooter nextHref="/projects" nextLabel={LUSION_ABOUT.scrollNav.targetTitle} />
    </main>
  );
}
