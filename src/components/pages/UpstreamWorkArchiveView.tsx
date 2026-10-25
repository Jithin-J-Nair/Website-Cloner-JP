"use client";

import React, { useState } from "react";
import { LayoutGrid, List } from "lucide-react";
import {
  STUDIO_PROJECTS,
  type ProjectCategory,
  type StudioProject,
} from "@/data/studio";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { ProjectCard } from "@/components/studio/ProjectCard";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { ProceduralMediaCanvas } from "@/components/studio/ProceduralMediaCanvas";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";

const CATEGORIES: ProjectCategory[] = [
  "All",
  "3D & WebGL",
  "Interactive Web",
  "Spatial & XR",
  "Motion & Film",
  "R&D Concept",
];

export function UpstreamWorkArchiveView() {
  const [selectedCategory, setSelectedCategory] = useState<ProjectCategory>("All");
  const [viewMode, setViewMode] = useState<"grid" | "index">("grid");
  const [hoveredProject, setHoveredProject] = useState<StudioProject>(STUDIO_PROJECTS[0]);
  const setProjectAccentHex = useStudioStore((s) => s.setProjectAccentHex);

  const filtered =
    selectedCategory === "All"
      ? STUDIO_PROJECTS
      : STUDIO_PROJECTS.filter((p) => p.category === selectedCategory);

  return (
    <div className="w-full">
      <SurfaceSection
        surface="void"
        webglMode="work-gallery"
        ariaLabel="Projects archive"
        className="pt-32 pb-24 md:pt-40 md:pb-32"
      >
        <div className="kn-container">
          <CrosshairRow
            labelLeft="ARCHIVE // REAL-TIME PRODUCTIONS"
            labelRight={`SHOWING 0${filtered.length} OF 0${STUDIO_PROJECTS.length}`}
          />

          {/* Monumental Header */}
          <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="flex items-start gap-4">
              <SplitTextReveal
                as="h1"
                immediate
                lines={["SELECTED", "PROJECTS"]}
                className="kn-hero-title text-[#f4f6fb]"
              />
              <span className="mt-2 rounded-full border border-white/15 bg-white/8 px-3.5 py-1 font-mono text-sm text-[#00d2ff]">
                0{STUDIO_PROJECTS.length}
              </span>
            </div>

            <p className="max-w-md text-base leading-relaxed text-[#9aa3b8]">
              Bespoke interactive worlds, optical product launches, spatial installations, and
              shader systems crafted from scratch.
            </p>
          </div>

          {/* Filter & View Switcher Controls */}
          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-white/10 py-5">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter projects by discipline">
              {CATEGORIES.map((cat) => {
                const active = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      setSelectedCategory(cat);
                      soundEngine.playHoverTick();
                    }}
                    className={`cursor-pointer rounded-full px-4 py-2 font-mono text-xs uppercase tracking-wider transition ${
                      active
                        ? "bg-[#2434ff] text-white"
                        : "border border-white/12 bg-white/[0.04] text-[#9aa3b8] hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.04] p-1">
              <button
                type="button"
                aria-pressed={viewMode === "grid"}
                onClick={() => setViewMode("grid")}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs uppercase transition ${
                  viewMode === "grid" ? "bg-white text-[#0a0c12]" : "text-[#9aa3b8] hover:text-white"
                }`}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                aria-pressed={viewMode === "index"}
                onClick={() => setViewMode("index")}
                className={`inline-flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 font-mono text-xs uppercase transition ${
                  viewMode === "index"
                    ? "bg-white text-[#0a0c12]"
                    : "text-[#9aa3b8] hover:text-white"
                }`}
              >
                <List className="h-3.5 w-3.5" />
                <span>Index</span>
              </button>
            </div>
          </div>

          {/* Staggered Showcase Grid OR Interactive Split Index View */}
          {viewMode === "grid" ? (
            <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-2">
              {filtered.map((project, idx) => (
                <ProjectCard
                  key={project.slug}
                  project={project}
                  staggerOffset={idx % 2 === 1}
                />
              ))}
            </div>
          ) : (
            <div className="mt-14 grid gap-10 lg:grid-cols-12">
              <div className="divide-y divide-white/10 border-b border-white/10 lg:col-span-7">
                {filtered.map((project) => {
                  const active = hoveredProject.slug === project.slug;
                  return (
                    <TransitionLink
                      key={project.slug}
                      href={`/work/${project.slug}`}
                      transitionLabel={project.title.toUpperCase()}
                      cursorBadge="VIEW CASE ↗"
                      onMouseEnter={() => {
                        setHoveredProject(project);
                        setProjectAccentHex(project.accentHex);
                      }}
                      className="group flex flex-wrap items-baseline justify-between gap-4 py-6 transition hover:px-2"
                    >
                      <div className="flex items-baseline gap-5">
                        <span className="font-mono text-xs text-[#00d2ff]">
                          [[ {project.index} ]]
                        </span>
                        <div>
                          <h2
                            className={`font-display text-2xl font-medium tracking-tight transition md:text-4xl ${
                              active ? "text-white" : "text-[#c2cbde] group-hover:text-white"
                            }`}
                          >
                            {project.title}
                          </h2>
                          <p className="mt-1 font-mono text-[11px] uppercase text-[#9aa3b8]">
                            {project.disciplines.join(" • ")}
                          </p>
                        </div>
                      </div>
                      <span className="font-mono text-xs text-[#9aa3b8]">
                        {project.client} · {project.year}
                      </span>
                    </TransitionLink>
                  );
                })}
              </div>

              {/* Sticky Live Optical Preview Stage */}
              <div className="hidden lg:col-span-5 lg:block">
                <div className="sticky top-32 overflow-hidden rounded-[28px] border border-white/15 bg-[#0e121c] p-4">
                  <div className="aspect-[4/3] overflow-hidden rounded-[20px]">
                    <ProceduralMediaCanvas
                      preset={hoveredProject.shaderPreset}
                      accentHex={hoveredProject.accentHex}
                      secondaryHex={hoveredProject.secondaryHex}
                      bgHex={hoveredProject.darkBgHex}
                      hovered
                      label={hoveredProject.liveUrlLabel.toUpperCase()}
                    />
                  </div>
                  <div className="mt-4 px-2 pb-1">
                    <p className="font-display text-xl font-medium text-white">
                      {hoveredProject.title}
                    </p>
                    <p className="mt-1 text-sm text-[#9aa3b8]">{hoveredProject.tagline}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </SurfaceSection>

      <ContactCtaSection />
      <StudioFooter nextHref="/labs" nextLabel="Kineta Labs R&D" />
    </div>
  );
}
