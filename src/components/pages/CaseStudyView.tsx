"use client";

import React, { useEffect, useState } from "react";
import { ArrowLeft, ArrowUpRight, Sparkles } from "lucide-react";
import type { StudioProject } from "@/data/studio";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { ProceduralMediaCanvas } from "@/components/studio/ProceduralMediaCanvas";
import { StudioFooter } from "@/components/sections/StudioFooter";

interface CaseStudyViewProps {
  project: StudioProject;
  nextProject: StudioProject;
}

export function CaseStudyView({ project, nextProject }: CaseStudyViewProps) {
  const setProjectAccentHex = useStudioStore((s) => s.setProjectAccentHex);
  const [interactiveBuildOpen, setInteractiveBuildOpen] = useState(false);

  useEffect(() => {
    setProjectAccentHex(project.accentHex);
  }, [project.accentHex, setProjectAccentHex]);

  return (
    <div className="w-full">
      {/* Case Study Hero Stage */}
      <SurfaceSection
        surface="void"
        webglMode="case-study"
        ariaLabel={`${project.title} case study hero`}
        className="pt-32 pb-20 md:pt-40"
      >
        <div className="kn-container">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <TransitionLink
              href="/work"
              transitionLabel="ALL PROJECTS"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#9aa3b8] transition hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Projects</span>
            </TransitionLink>

            <span className="font-mono text-xs uppercase tracking-widest text-[#00d2ff]">
              CASE STUDY [[ {project.index} ]] · {project.year}
            </span>
          </div>

          <CrosshairRow
            labelLeft={`CLIENT // ${project.client.toUpperCase()}`}
            labelRight={project.disciplines.join(" · ").toUpperCase()}
          />

          <div className="mt-10 max-w-5xl">
            <p className="kn-eyebrow" style={{ color: project.secondaryHex }}>
              • {project.category}
            </p>
            <SplitTextReveal
              as="h1"
              immediate
              lines={[project.title]}
              className="kn-hero-title mt-3 text-white"
            />
            <p className="mt-6 max-w-3xl text-xl leading-relaxed text-[#d0d7e8] md:text-2xl">
              {project.tagline}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <MagneticPill
                onClick={() => {
                  soundEngine.playChime(740, 0.08);
                  setInteractiveBuildOpen((v) => !v);
                }}
                variant="cobalt"
                size="lg"
                cursorText="INSPECT STAGE"
              >
                {interactiveBuildOpen ? "Exit Stage Inspector" : "Inspect Interactive Stage"}
              </MagneticPill>

              <span className="font-mono text-xs uppercase tracking-widest text-[#9aa3b8]">
                BUILD TARGET: {project.liveUrlLabel}
              </span>
            </div>
          </div>

          {/* Primary Interactive Case Study Viewport */}
          <div
            className="relative mt-14 aspect-[16/10] w-full overflow-hidden rounded-[32px] border border-white/15 md:aspect-[21/10]"
            style={{
              boxShadow: `0 32px 90px -20px ${project.accentHex}55`,
            }}
          >
            <ProceduralMediaCanvas
              preset={project.shaderPreset}
              accentHex={project.accentHex}
              secondaryHex={project.secondaryHex}
              bgHex={project.darkBgHex}
              hovered={interactiveBuildOpen}
              label={`${project.liveUrlLabel.toUpperCase()} // LIVE KERNEL`}
            />

            {interactiveBuildOpen && (
              <div className="pointer-events-none absolute top-5 left-5 max-w-md rounded-2xl border border-white/15 bg-black/75 p-4 font-mono text-xs text-white backdrop-blur-xl">
                <p className="flex items-center gap-2 font-semibold text-[#00d2ff]">
                  <Sparkles className="h-3.5 w-3.5" /> REAL-TIME PIPELINE TELEMETRY
                </p>
                <p className="mt-2 leading-relaxed text-[#c2cbde]">{project.architectureNote}</p>
              </div>
            )}
          </div>

          {/* 4-Column Performance & Outcome Metrics */}
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {project.metrics.map((metric) => (
              <div
                key={metric.label}
                className="rounded-[24px] border border-white/10 bg-[#111522]/85 p-6 backdrop-blur-md"
              >
                <span className="font-mono text-xs uppercase tracking-wider text-[#9aa3b8]">
                  {metric.label}
                </span>
                <p className="mt-2 font-display text-3xl font-semibold text-white md:text-4xl">
                  {metric.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SurfaceSection>

      {/* Editorial Deep-Dive & Metadata Sidebar on Crisp Ice Surface */}
      <SurfaceSection
        surface="ice"
        webglMode="about-sculpture"
        ariaLabel="Project narrative and technical architecture"
        className="py-24 md:py-32"
      >
        <div className="kn-container">
          <CrosshairRow labelLeft="NARRATIVE & ARCHITECTURE" labelRight="FIRST-PRINCIPLES BUILD" />

          <div className="mt-12 grid gap-12 lg:grid-cols-12">
            {/* Main Story */}
            <div className="space-y-12 lg:col-span-8">
              <div>
                <h2 className="kn-eyebrow text-[#2434ff]">01 // OVERVIEW</h2>
                <p className="mt-4 font-display text-2xl leading-snug font-medium text-[#0a0c12] md:text-3xl">
                  {project.summary}
                </p>
              </div>

              <div className="grid gap-8 border-t border-black/10 pt-10 md:grid-cols-2">
                <div>
                  <h3 className="kn-eyebrow text-[#2434ff]">02 // THE CHALLENGE</h3>
                  <p className="mt-3 text-base leading-relaxed text-[#4a5165]">
                    {project.challenge}
                  </p>
                </div>
                <div>
                  <h3 className="kn-eyebrow text-[#2434ff]">03 // OUR REAL-TIME SOLUTION</h3>
                  <p className="mt-3 text-base leading-relaxed text-[#4a5165]">
                    {project.solution}
                  </p>
                </div>
              </div>

              <div className="rounded-[26px] border border-black/10 bg-white/85 p-7">
                <p className="kn-eyebrow text-[#2434ff]">04 // SHADER &amp; GPU NOTE</p>
                <p className="mt-3 font-mono text-sm leading-relaxed text-[#0a0c12]">
                  {project.architectureNote}
                </p>
              </div>
            </div>

            {/* Right Metadata Column (Services & Jury Recognition — Lusion Case Study Pattern) */}
            <aside className="space-y-8 lg:col-span-4">
              <div className="rounded-[26px] border border-black/10 bg-white/85 p-7">
                <h3 className="kn-eyebrow text-[#2434ff]">SERVICES DELIVERED</h3>
                <ul className="mt-4 divide-y divide-black/8">
                  {project.services.map((service) => (
                    <li key={service} className="py-2.5 text-sm font-medium text-[#0a0c12]">
                      {service}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-[26px] border border-black/10 bg-white/85 p-7">
                <h3 className="kn-eyebrow text-[#2434ff]">RECOGNITION</h3>
                <ul className="mt-4 space-y-3">
                  {project.recognition.map((rec) => (
                    <li
                      key={`${rec.org}-${rec.award}`}
                      className="flex items-center justify-between gap-2 text-sm"
                    >
                      <span className="font-semibold text-[#0a0c12]">{rec.org}</span>
                      <span className="font-mono text-xs text-[#4a5165]">{rec.award}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </div>
      </SurfaceSection>

      {/* Ordered Procedural Gallery Study Plates */}
      <SurfaceSection
        surface="void"
        webglMode="case-study"
        ariaLabel="Visual studies gallery"
        className="py-24 md:py-32"
      >
        <div className="kn-container">
          <CrosshairRow labelLeft="VISUAL & SHADER STUDIES" labelRight="PROCEDURAL RENDERS" />

          <div className="mt-12 grid gap-8 md:grid-cols-2">
            {project.gallery.map((frame) => (
              <figure
                key={frame.id}
                className={`overflow-hidden rounded-[28px] border border-white/12 bg-[#101420] ${
                  frame.aspect === "wide" ? "md:col-span-2" : ""
                }`}
              >
                <div
                  className={
                    frame.aspect === "wide" ? "aspect-[16/9] w-full" : "aspect-[4/3] w-full"
                  }
                >
                  <ProceduralMediaCanvas
                    preset={project.shaderPreset}
                    accentHex={frame.palette[1]}
                    secondaryHex={frame.palette[2]}
                    bgHex={frame.palette[0]}
                    seed={frame.shaderSeed}
                    label={frame.tag}
                  />
                </div>
                <figcaption className="flex flex-wrap items-center justify-between gap-4 border-t border-white/10 px-6 py-4">
                  <span className="text-sm text-[#d2d9ea]">{frame.caption}</span>
                  <span className="font-mono text-xs text-[#00d2ff]">{frame.tag}</span>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* Next Project Run-Out Card */}
          <div className="mt-24">
            <TransitionLink
              href={`/work/${nextProject.slug}`}
              transitionLabel={nextProject.title.toUpperCase()}
              cursorBadge="NEXT CASE ↗"
              className="group relative block overflow-hidden rounded-[36px] border border-white/15 bg-[#111626] p-8 md:p-16"
            >
              <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
                <div>
                  <span className="kn-eyebrow text-[#00d2ff]">NEXT CASE STUDY</span>
                  <h2 className="kn-hero-title mt-3 text-white transition-transform duration-300 group-hover:translate-x-2">
                    {nextProject.title}
                  </h2>
                  <p className="mt-3 max-w-xl text-base text-[#9aa3b8]">{nextProject.tagline}</p>
                </div>

                <span className="inline-flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#2434ff] text-white transition-transform duration-300 group-hover:scale-110">
                  <ArrowUpRight className="h-6 w-6" />
                </span>
              </div>
            </TransitionLink>
          </div>
        </div>
      </SurfaceSection>

      <StudioFooter
        nextHref={`/work/${nextProject.slug}`}
        nextLabel={`Case Study: ${nextProject.title}`}
      />
    </div>
  );
}
