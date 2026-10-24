"use client";

import React from "react";
import { CAPABILITY_PILLARS } from "@/data/studio";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";

export function CapabilitiesSection() {
  const capabilityIndex = useStudioStore((s) => s.capabilityIndex);
  const setCapabilityIndex = useStudioStore((s) => s.setCapabilityIndex);

  return (
    <SurfaceSection
      id="capabilities"
      surface="cobalt"
      webglMode="capabilities"
      ariaLabel="Studio capabilities and areas of expertise"
      className="py-24 md:py-36"
    >
      <div className="kn-container">
        <CrosshairRow
          labelLeft="03 // MULTIDISCIPLINARY PIPELINE"
          labelRight="S · C · T · P MATRIX"
        />

        <div className="mt-12 grid gap-12 lg:grid-cols-12 lg:gap-12">
          {/* Left Sticky Narrative & [S][C][T][P] Selector */}
          <div className="lg:col-span-5">
            <div className="lg:sticky lg:top-32">
              <p className="kn-eyebrow text-white/80">• AREA OF EXPERTISE</p>
              <SplitTextReveal
                as="h2"
                lines={["STRATEGY TO", "SHADER-LEVEL", "PRODUCTION"]}
                className="kn-section-title mt-3 text-white"
              />
              <p className="mt-6 max-w-md text-base leading-relaxed text-white/85">
                Design, physics, shaders, and full-stack web architecture live under a single roof—so
                bold visual concepts never get watered down in handoff.
              </p>

              {/* Interactive [S] [C] [T] [P] Morph Trigger Pills */}
              <div className="mt-8 flex flex-wrap items-center gap-2.5" role="group" aria-label="Select capability pillar">
                {CAPABILITY_PILLARS.map((pillar, idx) => {
                  const active = capabilityIndex === idx;
                  return (
                    <button
                      key={pillar.code}
                      type="button"
                      aria-pressed={active}
                      onClick={() => {
                        setCapabilityIndex(idx);
                        soundEngine.playChime(523.25 + idx * 65, 0.07);
                      }}
                      className={`inline-flex h-11 cursor-pointer items-center gap-2.5 rounded-full border px-4 font-mono text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                        active
                          ? "border-white bg-white text-[#0a0c12] shadow-lg"
                          : "border-white/25 bg-white/10 text-white hover:bg-white/20"
                      }`}
                    >
                      <span>[{pillar.code}]</span>
                      <span>{pillar.title}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-8">
                <MagneticPill
                  href="/contact"
                  transitionLabel="START A BRIEF"
                  variant="light"
                  size="md"
                >
                  Discuss a Project
                </MagneticPill>
              </div>
            </div>
          </div>

          {/* Right Stacked Capability Cards */}
          <div className="space-y-6 lg:col-span-7">
            {CAPABILITY_PILLARS.map((pillar, idx) => {
              const active = capabilityIndex === idx;
              return (
                <article
                  key={pillar.code}
                  onMouseEnter={() => {
                    if (capabilityIndex !== idx) {
                      setCapabilityIndex(idx);
                      soundEngine.playHoverTick();
                    }
                  }}
                  onClick={() => setCapabilityIndex(idx)}
                  className={`relative overflow-hidden rounded-[28px] border p-7 backdrop-blur-xl transition-all duration-300 md:p-9 ${
                    active
                      ? "border-white/55 bg-[#080d29]/65 shadow-[0_24px_60px_rgba(6,10,36,0.45)]"
                      : "border-white/20 bg-[#080d29]/35 hover:border-white/40"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="font-mono text-xs uppercase tracking-[0.1em] text-[#7be7ff]">
                        [[ {pillar.index} ]] // PILLAR {pillar.code}
                      </span>
                      <h3 className="mt-2 font-display text-3xl font-medium tracking-tight text-white md:text-4xl">
                        {pillar.title}
                      </h3>
                    </div>

                    <span
                      aria-hidden="true"
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/20 bg-white/10 font-display text-2xl font-semibold text-white"
                    >
                      {pillar.code}
                    </span>
                  </div>

                  <p className="mt-4 max-w-xl text-base leading-relaxed text-white/85">
                    {pillar.description}
                  </p>

                  <ul className="mt-6 grid gap-2.5 border-t border-white/15 pt-6 sm:grid-cols-2">
                    {pillar.deliverables.map((item) => (
                      <li
                        key={item}
                        className="flex items-center gap-2.5 font-mono text-xs text-white/90"
                      >
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#00d2ff]" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </SurfaceSection>
  );
}
