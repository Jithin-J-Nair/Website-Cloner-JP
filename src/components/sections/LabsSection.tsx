"use client";

import React from "react";
import { Sparkles } from "lucide-react";
import { LAB_EXPERIMENTS } from "@/data/studio";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";

export function LabsSection() {
  const labUniforms = useStudioStore((s) => s.labUniforms);
  const updateLabUniforms = useStudioStore((s) => s.updateLabUniforms);

  return (
    <SurfaceSection
      id="labs"
      surface="void"
      webglMode="labs-sandbox"
      ariaLabel="Lusion R&D shader experiments"
      className="!bg-[#090b10]/72 py-24 md:py-36"
    >
      <div className="kn-container">
        <CrosshairRow
          labelLeft="04 // Lusion LABS R&D"
          labelRight="LIVE SHADER UNIFORMS ACTIVE"
        />

        {/* Centered Conviction Manifesto + Open Background Window */}
        <div className="mx-auto mt-12 max-w-4xl text-center">
          <p className="kn-eyebrow text-[#00d2ff]">• STEP INSIDE OUR R&amp;D SANDBOX</p>
          <SplitTextReveal
            as="h2"
            lines={["Where bold imagination", "meets real-time GPU physics."]}
            className="kn-section-title mt-4 text-[#f4f6fb]"
          />
          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-[#9aa3b8] md:text-lg">
            We dedicate 20% of studio time to pure graphics research—optical dispersion kernels,
            curl-noise fluid fields, and zero-allocation physics. Select any preset below to mutate
            the live 3D sculpture behind this page right now.
          </p>
        </div>

        {/* 4 Interactive Live Shader Preset Cards */}
        <div className="mt-14 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {LAB_EXPERIMENTS.map((exp) => {
            const active = labUniforms.experiment === exp.index;
            return (
              <button
                key={exp.id}
                type="button"
                aria-pressed={active}
                onMouseEnter={() => {
                  soundEngine.playHoverTick();
                  updateLabUniforms({ experiment: exp.index, ...exp.preset });
                }}
                onClick={() => {
                  soundEngine.playChime(587.33 + exp.index * 55, 0.07);
                  updateLabUniforms({ experiment: exp.index, ...exp.preset });
                }}
                className={`group flex cursor-pointer flex-col justify-between rounded-[24px] border p-6 text-left backdrop-blur-xl transition-all duration-300 ${
                  active
                    ? "border-[#00d2ff]/70 bg-[#121829]/88 shadow-[0_20px_50px_rgba(36,52,255,0.32)]"
                    : "border-white/12 bg-[#0d111c]/75 hover:border-white/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-wider text-[#00d2ff]">
                      {exp.code}
                    </span>
                    <span className="rounded-full border border-white/12 bg-white/6 px-2.5 py-0.5 font-mono text-[10px] text-white/80">
                      {exp.fpsTarget}
                    </span>
                  </div>

                  <h3 className="mt-4 font-display text-xl font-medium text-white group-hover:text-[#7be7ff]">
                    {exp.title}
                  </h3>
                  <p className="mt-1 font-mono text-[11px] text-[#5b68ff]">{exp.category}</p>
                  <p className="mt-3 text-sm leading-relaxed text-[#9aa3b8]">{exp.summary}</p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/10 pt-4 font-mono text-[11px] uppercase">
                  <span className="text-[#9aa3b8]">
                    IOR {exp.preset.ior.toFixed(2)} · DISP {exp.preset.dispersion.toFixed(2)}
                  </span>
                  <span className={active ? "text-[#10d98c]" : "text-white/60"}>
                    {active ? "● LIVE" : "APPLY"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Telemetry & Sandbox CTA */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 rounded-[24px] border border-white/12 bg-[#101421]/85 px-6 py-5 backdrop-blur-xl">
          <div className="flex flex-wrap items-center gap-4 font-mono text-xs text-[#c7d0e4]">
            <Sparkles className="h-4 w-4 text-[#00d2ff]" aria-hidden="true" />
            <span>IOR: {labUniforms.ior.toFixed(2)}</span>
            <span>DISPERSION: {labUniforms.dispersion.toFixed(2)}</span>
            <span>TURBULENCE: {labUniforms.turbulence.toFixed(2)}</span>
            <span>WIREFRAME: {labUniforms.wireframe ? "ON" : "OFF"}</span>
          </div>

          <MagneticPill
            href="/labs"
            transitionLabel="SHADER WORKBENCH"
            variant="cobalt"
            size="md"
            cursorText="OPEN SANDBOX"
          >
            Launch Interactive Labs
          </MagneticPill>
        </div>
      </div>
    </SurfaceSection>
  );
}
