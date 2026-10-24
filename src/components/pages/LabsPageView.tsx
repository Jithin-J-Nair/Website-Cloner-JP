"use client";

import React from "react";
import { RotateCcw, Sliders } from "lucide-react";
import { LAB_EXPERIMENTS } from "@/data/studio";
import { useStudioStore, type QualityTier } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { RaymarchViewport } from "@/components/webgl/RaymarchViewport";

export function LabsPageView() {
  const labUniforms = useStudioStore((s) => s.labUniforms);
  const updateLabUniforms = useStudioStore((s) => s.updateLabUniforms);
  const qualityTier = useStudioStore((s) => s.qualityTier);
  const setQualityTier = useStudioStore((s) => s.setQualityTier);
  const fps = useStudioStore((s) => s.fps);
  const dpr = useStudioStore((s) => s.dpr);

  const activeExperiment =
    LAB_EXPERIMENTS[labUniforms.experiment] ?? LAB_EXPERIMENTS[0];

  return (
    <div className="w-full">
      <SurfaceSection
        surface="void"
        webglMode="labs-sandbox"
        ariaLabel="KINETA interactive shader laboratory"
        className="!bg-transparent pt-28 pb-24 md:pt-36"
      >
        <div className="kn-container">
          <CrosshairRow
            labelLeft="LABS.KINETA.STUDIO // R&D DIVISION"
            labelRight={`LIVE GPU · ${fps} FPS · DPR [${dpr[0]}, ${dpr[1]}]`}
          />

          <div className="mt-8 grid gap-10 lg:grid-cols-12 lg:items-start">
            {/* Left Open Stage Viewport + Plain-English Shader Card */}
            <div className="space-y-8 lg:col-span-7">
              <div className="rounded-[28px] border border-white/12 bg-[#090b10]/65 p-7 backdrop-blur-md md:p-10">
                <p className="kn-eyebrow text-[#00d2ff]">• REAL-TIME SHADER WORKBENCH</p>
                <SplitTextReveal
                  as="h1"
                  immediate
                  lines={["KINETA LABS", "OPTICAL SANDBOX"]}
                  className="kn-section-title mt-3 text-white"
                />
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-[#c2cbde] md:text-base">
                  Move your cursor across the viewport to displace the 3D spring swarm and steer
                  Snell&apos;s Law refraction rays in real time, or scrub the GPU uniforms on the
                  right.
                </p>

                {/* Preset Switcher Tabs */}
                <div className="mt-7 flex flex-wrap gap-2">
                  {LAB_EXPERIMENTS.map((exp) => {
                    const selected = labUniforms.experiment === exp.index;
                    return (
                      <button
                        key={exp.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          soundEngine.playChime(587.33 + exp.index * 55, 0.07);
                          updateLabUniforms({ experiment: exp.index, ...exp.preset });
                        }}
                        className={`cursor-pointer rounded-full px-4 py-2 font-mono text-xs uppercase transition ${
                          selected
                            ? "bg-[#2434ff] text-white"
                            : "border border-white/15 bg-white/8 text-[#c2cbde] hover:bg-white/15"
                        }`}
                      >
                        {exp.code} · {exp.title}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Open Interactive Stage Breathing Window + Dedicated Live SDF Raymarcher */}
              <div className="space-y-6">
                <RaymarchViewport />

                <div className="rounded-[28px] border border-white/14 bg-[#0b0e18]/88 p-6 backdrop-blur-xl">
                  <p className="font-mono text-[11px] uppercase tracking-widest text-[#00d2ff]">
                    PLAIN-LANGUAGE SHADER ARCHITECTURE // {activeExperiment.code}
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-medium text-white">
                    {activeExperiment.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-[#c2cbde]">
                    {activeExperiment.plainEnglishShaderIdea}
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive GPU Uniform Inspector Panel */}
            <aside className="rounded-[28px] border border-white/14 bg-[#0c101b]/88 p-7 text-white backdrop-blur-xl lg:col-span-5">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <span className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#00d2ff]">
                  <Sliders className="h-3.5 w-3.5" /> UNIFORM CONTROLS
                </span>
                <button
                  type="button"
                  onClick={() => updateLabUniforms(activeExperiment.preset)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-white/15 px-3 py-1 font-mono text-[11px] uppercase text-[#9aa3b8] hover:text-white"
                >
                  <RotateCcw className="h-3 w-3" /> Reset
                </button>
              </div>

              <div className="mt-6 space-y-6">
                {/* Slider 1: IOR */}
                <div>
                  <div className="flex justify-between font-mono text-xs">
                    <label htmlFor="slider-ior">uIor (Refractive Index)</label>
                    <span className="text-[#00d2ff]">{labUniforms.ior.toFixed(2)}</span>
                  </div>
                  <input
                    id="slider-ior"
                    type="range"
                    min={1.05}
                    max={2.2}
                    step={0.01}
                    value={labUniforms.ior}
                    onChange={(e) => updateLabUniforms({ ior: Number(e.target.value) })}
                    className="mt-2 w-full accent-[#2434ff]"
                  />
                </div>

                {/* Slider 2: Cauchy Dispersion */}
                <div>
                  <div className="flex justify-between font-mono text-xs">
                    <label htmlFor="slider-dispersion">uDispersion (RGB Prism Spread)</label>
                    <span className="text-[#00d2ff]">{labUniforms.dispersion.toFixed(2)}</span>
                  </div>
                  <input
                    id="slider-dispersion"
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={labUniforms.dispersion}
                    onChange={(e) => updateLabUniforms({ dispersion: Number(e.target.value) })}
                    className="mt-2 w-full accent-[#2434ff]"
                  />
                </div>

                {/* Slider 3: Vertex Turbulence */}
                <div>
                  <div className="flex justify-between font-mono text-xs">
                    <label htmlFor="slider-turbulence">uTurbulence (Simplex Octave Gain)</label>
                    <span className="text-[#00d2ff]">{labUniforms.turbulence.toFixed(2)}</span>
                  </div>
                  <input
                    id="slider-turbulence"
                    type="range"
                    min={0}
                    max={1.2}
                    step={0.01}
                    value={labUniforms.turbulence}
                    onChange={(e) => updateLabUniforms({ turbulence: Number(e.target.value) })}
                    className="mt-2 w-full accent-[#2434ff]"
                  />
                </div>

                {/* Slider 4: Physics Spring */}
                <div>
                  <div className="flex justify-between font-mono text-xs">
                    <label htmlFor="slider-spring">Spring Attractor Stiffness</label>
                    <span className="text-[#00d2ff]">{labUniforms.spring.toFixed(2)}</span>
                  </div>
                  <input
                    id="slider-spring"
                    type="range"
                    min={0.1}
                    max={1.2}
                    step={0.01}
                    value={labUniforms.spring}
                    onChange={(e) => updateLabUniforms({ spring: Number(e.target.value) })}
                    className="mt-2 w-full accent-[#2434ff]"
                  />
                </div>

                {/* Wireframe & Quality Tier Controls */}
                <div className="flex items-center justify-between border-t border-white/10 pt-5">
                  <span className="font-mono text-xs uppercase text-[#c2cbde]">
                    Geodesic Wireframe Mesh
                  </span>
                  <button
                    type="button"
                    aria-pressed={labUniforms.wireframe}
                    onClick={() => updateLabUniforms({ wireframe: !labUniforms.wireframe })}
                    className={`cursor-pointer rounded-full px-4 py-1.5 font-mono text-xs uppercase transition ${
                      labUniforms.wireframe
                        ? "bg-[#10d98c] text-[#090b10] font-semibold"
                        : "border border-white/15 bg-white/8 text-white"
                    }`}
                  >
                    {labUniforms.wireframe ? "Enabled" : "Disabled"}
                  </button>
                </div>

                <div className="border-t border-white/10 pt-5">
                  <p className="font-mono text-xs uppercase text-[#9aa3b8]">
                    Adaptive Quality Watchdog Override
                  </p>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {(["high", "medium", "low"] as QualityTier[]).map((tier) => (
                      <button
                        key={tier}
                        type="button"
                        aria-pressed={qualityTier === tier}
                        onClick={() => setQualityTier(tier)}
                        className={`cursor-pointer rounded-xl py-2 font-mono text-xs uppercase transition ${
                          qualityTier === tier
                            ? "bg-[#2434ff] text-white"
                            : "border border-white/12 bg-white/[0.04] text-[#9aa3b8] hover:text-white"
                        }`}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </SurfaceSection>

      <StudioFooter nextHref="/contact" nextLabel="Start a Project" />
    </div>
  );
}
