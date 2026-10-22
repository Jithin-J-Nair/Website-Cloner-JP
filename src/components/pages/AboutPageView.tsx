"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import { LUSION_ABOUT } from "@/data/reference";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";

/**
 * Interactive 3D-Projected Silver Particle Nebula (`#about-who` hero canvas)
 * Reconstructs the dark atmospheric particle plume seen in `lusion.co/about`
 * (`about-hero--1440x900.jpg` & `about-hero--390x844.jpg`) with zero external assets.
 */
function AboutHeroParticleCanvas({ reducedMotion }: { reducedMotion: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const COUNT = 560;
    const pts = Array.from({ length: COUNT }, (_, i) => {
      const u = (i * 0.6180339887) % 1;
      const v = i / COUNT;
      const angle = u * Math.PI * 2 * 3.2;
      const arm = (v - 0.35) * 2.1;
      return {
        bx: arm * 0.62 + Math.cos(angle) * (0.14 + v * 0.36),
        by: -arm * 0.36 + Math.sin(angle * 1.3) * (0.16 + v * 0.32) - 0.08,
        bz: Math.sin(angle) * 0.5,
        size: i % 37 === 0 ? 7.5 : i % 9 === 0 ? 3.8 : 1.4 + (i % 5) * 0.55,
        alpha: 0.22 + (1 - Math.abs(v - 0.45)) * 0.62,
        phase: i * 0.13,
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
      if (!reducedMotion) t += dt * 0.55;

      const w = canvas.width;
      const h = canvas.height;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // Soft volumetric studio backlight
      const glow = ctx.createRadialGradient(
        w * 0.52,
        h * 0.40,
        w * 0.02,
        w * 0.52,
        h * 0.42,
        Math.max(w, h) * 0.56
      );
      glow.addColorStop(0, "rgba(182, 195, 224, 0.24)");
      glow.addColorStop(0.45, "rgba(62, 74, 102, 0.12)");
      glow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      const scale = Math.min(w, h) * 0.68;
      const px = pointerRef.current.active ? pointerRef.current.x * 0.18 : 0;
      const py = pointerRef.current.active ? pointerRef.current.y * 0.14 : 0;

      for (let i = 0; i < pts.length; i += 1) {
        const p = pts[i];
        const driftX = Math.sin(t + p.phase) * 0.035 + px * (0.4 + p.bz);
        const driftY = Math.cos(t * 0.85 + p.phase * 1.2) * 0.035 + py * (0.4 + p.bz);
        const z = 1.65 + p.bz * 0.65 + Math.sin(t * 0.5 + p.phase) * 0.12;
        const sx = w * 0.53 + ((p.bx + driftX) / z) * scale * 1.45;
        const sy = h * 0.41 + ((p.by + driftY) / z) * scale * 1.28;
        const r = Math.max(0.8, (p.size / z) * (w > 900 ? 1.5 : 1.15));

        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(226, 232, 245, ${Math.min(0.95, p.alpha / z).toFixed(3)})`;
        ctx.fill();
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

/**
 * Interactive 8,192-Point Sculptural Team Portrait Stage (`#about-who` member viewer)
 */
function TeamPointSculpture({
  memberIndex,
  memberName,
  reducedMotion,
}: {
  memberIndex: number;
  memberName: string;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let angle = 0;

    const render = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(280, Math.round(rect.width * dpr));
      const h = Math.max(280, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }

      if (!reducedMotion) angle += 0.012;
      ctx.clearRect(0, 0, w, h);

      const cx = w * 0.5;
      const cy = h * 0.5;
      const radius = Math.min(w, h) * 0.34;
      const seed = memberIndex * 1.37;

      // Sculptural latitude/longitude point-cloud bust (tribute to `8,192`-vertex `.buf` meshes)
      for (let i = 0; i < 900; i += 1) {
        const v = i / 900;
        const phi = v * Math.PI;
        const theta = i * 2.399963 + angle + seed;
        const profile =
          v < 0.58
            ? Math.sin(phi * 1.12) * (0.86 + 0.12 * Math.cos(theta * 2 + seed))
            : 0.42 + (v - 0.58) * 1.65;
        const yNorm = (v - 0.5) * 1.95;
        const x3 = Math.cos(theta) * profile;
        const z3 = Math.sin(theta) * profile * 0.78;
        const depth = 2.4 + z3;
        const px = cx + (x3 / depth) * radius * 2.3;
        const py = cy + (yNorm / depth) * radius * 2.1;
        const shade = Math.max(0.18, 0.52 - z3 * 0.42);
        const r = Math.max(1.1, (2.5 / depth) * (w > 600 ? 1.5 : 1.15));

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle =
          i % 19 === 0
            ? `rgba(26, 47, 251, ${(shade * 0.95).toFixed(3)})`
            : `rgba(14, 18, 30, ${shade.toFixed(3)})`;
        ctx.fill();
      }

      if (!reducedMotion) {
        rafId = requestAnimationFrame(render);
      }
    };

    render();
    return () => cancelAnimationFrame(rafId);
  }, [memberIndex, reducedMotion]);

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
 * Verified Lusion About Page (`/about`)
 *
 * Strictly implements the canonical 7-band hierarchy from `LUSION_ABOUT`:
 *   1. `#about-who` (100vh dark particle + outlined `LUSION` hero -> studio statement -> 7-member 3D team stage with `[[ 001 ]]` compass)
 *   2. `#about-clients` (`BRANDS WE WORK WITH` + 3 rows of 15 verified client organizations)
 *   3. `#about-award` (`58` awards across 7 bodies, `03` articles, `5` conference talks)
 *   4. `#about-capability` (`AREA OF / EXPERTISE` + interactive `S / C / T / P` tilt cards with clean-room MIT icons)
 *   5. `#end-section` + 6. `#footer-section` + 7. `#scroll-nav-section` (`Our Projects` -> `/projects`)
 */
export function AboutPageView() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  const heroBandRef = useRef<HTMLDivElement>(null);
  const [activeMemberIdx, setActiveMemberIdx] = useState(0);
  const [flippedCard, setFlippedCard] = useState<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const team = LUSION_ABOUT.who.team;
  const activeMember = team[activeMemberIdx] ?? team[0];

  // Keep `#header` white while dark `#about-who` hero fills viewport, then switch cleanly to `ice`
  useEffect(() => {
    setActiveSurface("void");
    const el = heroBandRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry) {
          setActiveSurface(entry.isIntersecting && entry.intersectionRatio > 0.28 ? "void" : "ice");
        }
      },
      { threshold: [0, 0.28, 0.6] }
    );
    io.observe(el);
    return () => {
      io.disconnect();
      setActiveSurface("ice");
    };
  }, [setActiveSurface]);

  const stepMember = (delta: number) => {
    soundEngine.playClick();
    setActiveMemberIdx((prev) => (prev + delta + team.length) % team.length);
  };

  return (
    <main id="about" className="relative overflow-x-clip bg-[#f0f1fa] text-[#000000]">
      {/* =====================================================================
          1. WHO WE ARE HERO + TEAM SCULPTURE BAND (`#about-who`)
         ===================================================================== */}
      <section id="about-who" className="relative w-full">
        {/* Opening 100vh Dark Atmospheric Stage matching `about-hero--{1440x900,390x844}.jpg` */}
        <div
          ref={heroBandRef}
          className="relative flex h-[calc(var(--vh,1vh)*100)] min-h-[600px] w-full flex-col justify-between overflow-hidden bg-[#000000] px-[var(--base-padding-x)] pt-24 pb-5 text-white"
        >
          <AboutHeroParticleCanvas reducedMotion={reducedMotion} />

          <div aria-hidden="true" className="h-6" />

          {/* Mid-Viewport Horizontal Registration Crosses (`+   +   +   +   +`) */}
          <div
            aria-hidden="true"
            className="pointer-events-none relative z-10 flex w-full items-center justify-between text-white/45"
          >
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
          </div>

          {/* Monumental Outlined `LUSION` Wordmark + `SCROLL TO EXPLORE` */}
          <div className="relative z-10 w-full">
            <h1 className="sr-only">
              Lusion — {LUSION_ABOUT.who.leftLines.join(" ")} {LUSION_ABOUT.who.rightHeadline}
            </h1>
            <svg
              viewBox="0 0 1380 265"
              fill="none"
              aria-hidden="true"
              className="block h-auto w-full select-none"
            >
              <text
                x="4"
                y="240"
                textLength="1372"
                lengthAdjust="spacingAndGlyphs"
                fill="none"
                stroke="#ffffff"
                strokeWidth="12"
                strokeLinejoin="round"
                fontFamily="LusionSansCalibrated, system-ui, sans-serif"
                fontSize="286"
                fontWeight="400"
              >
                LUSION
              </text>
              <text
                x="4"
                y="240"
                textLength="1372"
                lengthAdjust="spacingAndGlyphs"
                fill="none"
                stroke="#000000"
                strokeWidth="4"
                fontFamily="LusionSansCalibrated, system-ui, sans-serif"
                fontSize="286"
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

        {/* Studio Manifesto & Interactive 7-Member Team Stage (`[[ 001 ]]` – `[[ 007 ]]`) */}
        <div className="grid grid-cols-6 gap-x-[var(--grid-gap)] px-[var(--base-padding-x)] pt-20 pb-24 min-[813px]:grid-cols-12 min-[813px]:pt-32 min-[813px]:pb-36">
          <div className="col-span-6 min-[813px]:col-span-6">
            <h2 className="font-sans text-[10.5vw] leading-[0.96] font-normal tracking-[-0.025em] text-[#000000] uppercase min-[813px]:text-[5.2vw]">
              {LUSION_ABOUT.who.leftLines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>

          <div className="col-span-6 mt-8 flex flex-col justify-end min-[813px]:col-span-6 min-[813px]:mt-0">
            <p className="font-sans text-[6.4vw] leading-[1.06] font-normal tracking-[-0.02em] text-[#1a2ffb] uppercase min-[813px]:text-[2.6vw]">
              {LUSION_ABOUT.who.rightHeadline}
            </p>
            <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-black/80 md:text-lg">
              {LUSION_ABOUT.who.teamDescription}
            </p>
          </div>

          {/* Interactive Team Member Card + `[[ 001 ]]` Compass Index */}
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
            className="col-span-6 mt-14 grid grid-cols-1 items-center gap-8 rounded-[24px] bg-white p-6 shadow-[0_18px_50px_rgba(12,18,42,0.06)] min-[813px]:col-span-12 min-[813px]:mt-20 min-[813px]:grid-cols-12 min-[813px]:p-12"
          >
            <div className="flex flex-col justify-between gap-6 min-[813px]:col-span-5">
              <div className="flex items-center gap-4">
                <span
                  data-team-compass="true"
                  className="font-mono text-sm font-medium tracking-[0.14em] text-[#1a2ffb]"
                >
                  [[ {activeMember.indexFormatted} ]]
                </span>
                <span className="font-mono text-xs tracking-[0.08em] text-black/50 uppercase">
                  0{team.length} SPECIALISTS
                </span>
              </div>

              <div>
                <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-[#000000] md:text-5xl">
                  {activeMember.name}
                </h3>
                <p className="mt-2 font-sans text-lg text-black/70">
                  {activeMember.roleLines.join(" ")}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => stepMember(-1)}
                  aria-label="Previous team member"
                  className="cursor-pointer rounded-full border border-black/15 px-5 py-2.5 font-mono text-xs tracking-[0.08em] uppercase transition-colors hover:border-[#1a2ffb] hover:bg-[#1a2ffb] hover:text-white focus-visible:outline-2 focus-visible:outline-[#1a2ffb]"
                >
                  &larr; Prev
                </button>
                <button
                  type="button"
                  onClick={() => stepMember(1)}
                  aria-label="Next team member"
                  className="cursor-pointer rounded-full border border-black/15 px-5 py-2.5 font-mono text-xs tracking-[0.08em] uppercase transition-colors hover:border-[#1a2ffb] hover:bg-[#1a2ffb] hover:text-white focus-visible:outline-2 focus-visible:outline-[#1a2ffb]"
                >
                  Next &rarr;
                </button>
                <span className="ml-2 font-mono text-[11px] tracking-[0.08em] text-black/50 uppercase min-[813px]:hidden">
                  {LUSION_ABOUT.who.mobileSwipeHint}
                </span>
              </div>

              <div className="flex flex-wrap gap-2 pt-2">
                {team.map((member, idx) => (
                  <button
                    key={member.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playHover();
                      setActiveMemberIdx(idx);
                    }}
                    className={`cursor-pointer rounded-full px-3 py-1 font-mono text-xs transition-colors ${
                      idx === activeMemberIdx
                        ? "bg-[#1a2ffb] text-white"
                        : "bg-[#f0f1fa] text-black/70 hover:bg-black/10"
                    }`}
                  >
                    {member.indexFormatted}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative aspect-square max-h-[380px] w-full overflow-hidden rounded-[20px] bg-[#f0f1fa] min-[813px]:col-span-7">
              <TeamPointSculpture
                memberIndex={activeMember.index}
                memberName={activeMember.name}
                reducedMotion={reducedMotion}
              />
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. BRANDS WE WORK WITH (`#about-clients` — 15 Verified Organizations)
         ===================================================================== */}
      <section
        id="about-clients"
        className="border-t border-black/10 px-[var(--base-padding-x)] py-20 min-[813px]:py-28"
      >
        <div className="grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:grid-cols-12">
          <div className="col-span-6 min-[813px]:col-span-6">
            <h2 className="font-sans text-[8.5vw] leading-[0.98] font-normal tracking-[-0.025em] text-[#000000] uppercase min-[813px]:text-[4.2vw]">
              {LUSION_ABOUT.clients.heading}
            </h2>
          </div>
          <div className="col-span-6 mt-4 flex items-end min-[813px]:col-span-6 min-[813px]:mt-0">
            <p className="max-w-md font-sans text-base text-black/75 md:text-lg">
              {LUSION_ABOUT.clients.description}
            </p>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4">
          {LUSION_ABOUT.clients.carouselRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6"
            >
              {row.map((client, cIdx) => (
                <div
                  key={`${client.id}-${cIdx}`}
                  className="flex h-24 items-center justify-center rounded-2xl border border-black/8 bg-white px-5 text-center transition-transform duration-300 hover:-translate-y-0.5 hover:border-[#1a2ffb]/40"
                >
                  <span className="font-sans text-sm font-medium tracking-[0.04em] text-[#000000] uppercase md:text-base">
                    {client.name}
                  </span>
                </div>
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
        className="border-t border-black/10 px-[var(--base-padding-x)] py-20 min-[813px]:py-28"
      >
        {/* 58 Awards */}
        <div className="grid grid-cols-6 gap-8 min-[813px]:grid-cols-12">
          <div className="col-span-6 min-[813px]:col-span-4">
            <div className="flex items-start gap-3">
              <h2 className="font-sans text-5xl font-normal tracking-[-0.025em] text-[#000000] md:text-6xl">
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
                className="rounded-2xl bg-white p-6 shadow-[0_8px_28px_rgba(12,18,42,0.04)]"
              >
                <div className="flex items-center justify-between border-b border-black/10 pb-3">
                  <h3 className="font-sans text-lg font-medium text-[#000000]">
                    {group.organization}
                  </h3>
                  <span className="font-mono text-xs text-black/55">
                    {String(group.totalCount).padStart(2, "0")}
                  </span>
                </div>
                <ul className="mt-3 divide-y divide-black/6">
                  {group.honors.map((honor) => (
                    <li
                      key={`${group.organization}-${honor.recognition}`}
                      className="flex items-center justify-between py-2.5 text-sm"
                    >
                      <span className="text-black/85">{honor.recognition}</span>
                      <span className="font-mono text-xs text-black/60">{honor.countFormatted}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* 03 Articles + 5 Talks */}
        <div className="mt-16 grid grid-cols-6 gap-10 border-t border-black/10 pt-14 min-[813px]:grid-cols-12">
          <div className="col-span-6 min-[813px]:col-span-6">
            <div className="flex items-start gap-3">
              <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-[#000000]">
                {LUSION_ABOUT.recognition.articlesHeading}
              </h3>
              <span className="mt-1 rounded-full bg-black/8 px-3 py-0.5 font-mono text-xs text-black">
                {LUSION_ABOUT.recognition.articlesDisplayedTotal}
              </span>
            </div>
            <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
              {LUSION_ABOUT.recognition.articles.map((article) => (
                <li key={article.href}>
                  <a
                    href={article.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between py-4 text-base text-[#000000] transition-colors hover:text-[#1a2ffb]"
                  >
                    <span>{article.title}</span>
                    <span aria-hidden="true" className="font-mono text-xs transition-transform group-hover:translate-x-1">
                      &#8599;
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="col-span-6 min-[813px]:col-span-6">
            <div className="flex items-start gap-3">
              <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-[#000000]">
                {LUSION_ABOUT.recognition.talksHeading}
              </h3>
              <span className="mt-1 rounded-full bg-black/8 px-3 py-0.5 font-mono text-xs text-black">
                {LUSION_ABOUT.recognition.talksDisplayedTotal}
              </span>
            </div>
            <ul className="mt-6 divide-y divide-black/10 border-y border-black/10">
              {LUSION_ABOUT.recognition.talks.map((talk) => (
                <li
                  key={`${talk.event}-${talk.dateAndLocation}`}
                  className="flex items-center justify-between py-4 text-base"
                >
                  <span className="font-medium text-[#000000]">{talk.event}</span>
                  <span className="font-mono text-xs text-black/65">{talk.dateAndLocation}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. AREA OF EXPERTISE (`#about-capability` — Interactive `S / C / T / P` Cards)
         ===================================================================== */}
      <section
        id="about-capability"
        className="border-t border-black/10 px-[var(--base-padding-x)] py-20 min-[813px]:py-28"
      >
        <div className="grid grid-cols-6 gap-6 min-[813px]:grid-cols-12">
          <div className="col-span-6 min-[813px]:col-span-7">
            <h2 className="font-sans text-[10vw] leading-[0.95] font-normal tracking-[-0.025em] text-[#000000] uppercase min-[813px]:text-[5.4vw]">
              {LUSION_ABOUT.capability.titleLines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>
          <div className="col-span-6 flex items-end min-[813px]:col-span-5">
            <p className="font-sans text-base text-black/75 md:text-lg">
              {LUSION_ABOUT.capability.subtitle}
            </p>
          </div>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LUSION_ABOUT.capability.cards.map((card, idx) => {
            const active = flippedCard === idx;
            return (
              <div
                key={card.title}
                tabIndex={0}
                role="button"
                aria-pressed={active}
                onClick={() => {
                  soundEngine.playClick();
                  setFlippedCard(active ? null : idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    soundEngine.playClick();
                    setFlippedCard(active ? null : idx);
                  }
                }}
                className={`group flex min-h-[380px] cursor-pointer flex-col justify-between rounded-[22px] border p-7 transition-all duration-400 focus-visible:outline-2 focus-visible:outline-[#1a2ffb] ${
                  active
                    ? "border-[#1a2ffb] bg-[#12141a] text-white shadow-[0_24px_60px_rgba(26,47,251,0.22)]"
                    : "border-black/10 bg-white text-[#000000] hover:-translate-y-1.5 hover:shadow-[0_22px_50px_rgba(12,18,42,0.09)]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={`font-sans text-5xl font-medium tracking-[-0.03em] ${
                      active ? "text-[#c1ff00]" : "text-[#1a2ffb]"
                    }`}
                  >
                    {card.displayInitial}
                  </span>
                  <img
                    src={card.cleanRoomIconSvg}
                    alt={`${card.title} icon`}
                    width={36}
                    height={36}
                    className={`h-9 w-9 ${active ? "invert" : ""}`}
                  />
                </div>

                <div>
                  <h3 className="font-sans text-2xl font-medium tracking-[-0.02em]">
                    {card.title}
                  </h3>
                  <ul className="mt-4 space-y-2 border-t border-current/12 pt-4 text-sm">
                    {card.items.map((item) => (
                      <li key={item} className={active ? "text-white/85" : "text-black/75"}>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5, 6 & 7. END CTA, STUDIO FOOTER & SCROLL PORTAL (`Our Projects` -> `/projects`)
         ===================================================================== */}
      <ContactCtaSection />
      <StudioFooter
        nextHref="/projects"
        nextLabel={LUSION_ABOUT.scrollNav.targetTitle}
      />
    </main>
  );
}
