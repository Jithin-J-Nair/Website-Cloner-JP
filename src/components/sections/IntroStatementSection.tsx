"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Play } from "lucide-react";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";
import { ProceduralMediaCanvas } from "@/components/studio/ProceduralMediaCanvas";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger);

export function IntroStatementSection() {
  const reelWrapRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState(false);

  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const setReelOpen = useStudioStore((s) => s.setReelOpen);
  const setCursor = useStudioStore((s) => s.setCursor);
  const resetCursor = useStudioStore((s) => s.resetCursor);

  useEffect(() => {
    if (reducedMotion || !reelWrapRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        reelWrapRef.current,
        { scale: 0.86, borderRadius: "40px" },
        {
          scale: 1,
          borderRadius: "24px",
          ease: "none",
          scrollTrigger: {
            trigger: reelWrapRef.current,
            start: "top 88%",
            end: "top 24%",
            scrub: 0.5,
          },
        }
      );
    }, reelWrapRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <SurfaceSection
      id="intro-statement"
      surface="ice"
      webglMode="showreel"
      ariaLabel="Studio introduction and interactive showreel"
      className="py-20 md:py-32"
    >
      <div className="kn-container">
        <CrosshairRow labelLeft="01 // STUDIO MANIFESTO" labelRight="DESIGN × SHADERS × CODE" />

        {/* Asymmetric 12-Col Editorial Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-12 lg:gap-12">
          <div className="lg:col-span-4">
            <div className="inline-flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-[#2434ff]" />
              <span className="kn-eyebrow text-[#0a0c12]">BOLD CONCEPTS, ENGINEERED ALIVE</span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#4a5165]">
              Independent creative production studio uniting optical shader craft, procedural 3D,
              and tactile motion systems.
            </p>
          </div>

          <div className="lg:col-span-8">
            <SplitTextReveal
              as="h2"
              lines={[
                "We fuse art direction, motion, 3D,",
                "and real-time engineering into web",
                "experiences that feel alive under",
                "every cursor and touch.",
              ]}
              className="kn-statement text-[#0a0c12]"
            />

            <p className="mt-8 max-w-2xl text-base leading-relaxed text-[#4a5165] md:text-lg">
              From product launches to spatial brand worlds, we build bespoke interactive journeys
              from first principles—never generic templates, never pre-baked compromises.
            </p>

            <div className="mt-8">
              <MagneticPill
                href="/about"
                transitionLabel="ABOUT US"
                variant="cobalt"
                size="md"
                cursorText="OUR APPROACH"
              >
                Our Approach
              </MagneticPill>
            </div>
          </div>
        </div>

        {/* Scroll-Scrubbed Expanding Showreel Theater Portal */}
        <div ref={reelWrapRef} className="mt-16 origin-center overflow-hidden shadow-2xl md:mt-24">
          <button
            type="button"
            onClick={() => {
              soundEngine.playChime(659.25, 0.08);
              setReelOpen(true);
            }}
            onMouseEnter={() => {
              setHovered(true);
              soundEngine.playHoverTick();
              setCursor("badge", "PLAY REEL ▶");
            }}
            onMouseLeave={() => {
              setHovered(false);
              resetCursor();
            }}
            aria-label="Open KINETA 2026 Interactive Showreel"
            className="group relative block aspect-[16/10] w-full cursor-pointer overflow-hidden rounded-[24px] border border-black/12 bg-[#090b10] text-left md:aspect-[16/9]"
          >
            <ProceduralMediaCanvas
              preset="monolith"
              accentHex="#2434ff"
              secondaryHex="#00d2ff"
              bgHex="#080b12"
              hovered={hovered}
              label="INTERACTIVE REEL · 01:24"
              className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
            />

            {/* Overlay HUD inside Reel Frame */}
            <div className="pointer-events-none absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/75 via-transparent to-black/30 p-6 text-white md:p-10">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-white/15 bg-black/45 px-3.5 py-1 font-mono text-[11px] uppercase tracking-widest backdrop-blur-md">
                  KINETA REEL // 2024–2026
                </span>
                <span className="hidden font-mono text-[11px] uppercase tracking-widest text-white/75 sm:inline">
                  4 INTERACTIVE CHAPTERS · 60–120 FPS
                </span>
              </div>

              {/* Center Play Orb */}
              <div className="my-auto self-center">
                <span className="inline-flex items-center gap-3 rounded-full border border-white/25 bg-white/15 px-7 py-4 font-mono text-xs font-medium uppercase tracking-[0.12em] text-white backdrop-blur-xl transition-all duration-300 group-hover:scale-105 group-hover:bg-[#2434ff]">
                  <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>Play Showreel</span>
                </span>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="font-display text-xl font-medium md:text-2xl">
                    Showreel — Real-Time Worlds &amp; Optical Studies
                  </p>
                  <p className="text-xs text-white/75 md:text-sm">
                    Click to launch interactive multi-chapter reel with Web Audio soundscape
                  </p>
                </div>
                <span className="font-mono text-xs uppercase tracking-widest text-[#00d2ff]">
                  [ EXPAND ↗ ]
                </span>
              </div>
            </div>
          </button>
        </div>
      </div>
    </SurfaceSection>
  );
}
