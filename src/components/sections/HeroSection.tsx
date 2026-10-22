"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowDown, Play } from "lucide-react";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";

gsap.registerPlugin(ScrollTrigger);

export function HeroSection() {
  const contentRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const setReelOpen = useStudioStore((s) => s.setReelOpen);
  const setCursor = useStudioStore((s) => s.setCursor);
  const resetCursor = useStudioStore((s) => s.resetCursor);
  const fps = useStudioStore((s) => s.fps);

  useEffect(() => {
    if (reducedMotion || !contentRef.current) return;
    const ctx = gsap.context(() => {
      gsap.to(contentRef.current, {
        yPercent: -14,
        opacity: 0.28,
        ease: "none",
        scrollTrigger: {
          trigger: contentRef.current,
          start: "top top",
          end: "bottom top",
          scrub: true,
        },
      });
    }, contentRef);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <SurfaceSection
      id="hero"
      surface="ice"
      webglMode="hero-cluster"
      ariaLabel="Hero studio introduction"
      className="!bg-transparent pt-24 pb-8 md:pt-28 md:pb-12"
    >
      <div
        ref={contentRef}
        className="kn-container flex min-h-[calc(100svh-7.5rem)] flex-col justify-between"
      >
        <CrosshairRow
          labelLeft="00 // INTERACTIVE OPTICAL STAGE"
          labelRight={`REAL-TIME KERNEL · ${fps} FPS`}
        />

        {/* Monumental Display Statement */}
        <div className="my-auto max-w-5xl py-10 md:py-14">
          <div className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-black/10 bg-white/75 px-4 py-1.5 backdrop-blur-md">
            <span className="h-2 w-2 rounded-full bg-[#2434ff]" />
            <span className="kn-eyebrow text-[11px] text-[#0a0c12]">
              REAL-TIME 3D &amp; INTERACTIVE PRODUCTION STUDIO
            </span>
          </div>

          <SplitTextReveal
            as="h1"
            immediate
            delay={0.14}
            lines={[
              "We build 3D visual worlds",
              "and interactive experiences",
              "that set bold brands apart.",
            ]}
            className="kn-hero-title text-[#0a0c12]"
          />

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <MagneticPill
              href="/work"
              transitionLabel="OUR WORK"
              variant="dark"
              size="lg"
              cursorText="EXPLORE WORK"
            >
              Explore Work
            </MagneticPill>

            <button
              type="button"
              onClick={() => {
                soundEngine.playChime(659.25, 0.08);
                setReelOpen(true);
              }}
              onMouseEnter={() => {
                soundEngine.playHoverTick();
                setCursor("badge", "PLAY REEL");
              }}
              onMouseLeave={resetCursor}
              className="group inline-flex h-14 cursor-pointer items-center gap-3 rounded-full border border-black/14 bg-white/80 px-7 font-mono text-xs font-medium uppercase tracking-[0.09em] text-[#0a0c12] backdrop-blur-md transition-all duration-300 hover:border-[#2434ff] hover:bg-[#2434ff] hover:text-white"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#2434ff] text-white transition-transform duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-[#2434ff]">
                <Play className="ml-0.5 h-3 w-3 fill-current" aria-hidden="true" />
              </span>
              <span>Play 2026 Reel</span>
            </button>
          </div>
        </div>

        {/* Bottom Telemetry & Scroll Prompt */}
        <div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-4">
            <p className="font-mono text-xs uppercase tracking-[0.08em] text-[#4a5165]">
              MOVE CURSOR TO DISPLACE OPTICAL FIELD
            </p>
            <a
              href="#intro-statement"
              className="group inline-flex items-center gap-2 font-mono text-xs font-medium uppercase tracking-[0.1em] text-[#0a0c12] transition hover:text-[#2434ff]"
            >
              <span>Scroll to Explore</span>
              <ArrowDown
                className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-y-1"
                aria-hidden="true"
              />
            </a>
          </div>
          <CrosshairRow labelLeft="34.6937° N · 135.5023° E" labelRight="51.4545° N · 2.5879° W" />
        </div>
      </div>
    </SurfaceSection>
  );
}
