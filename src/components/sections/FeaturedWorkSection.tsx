"use client";

import React from "react";
import { STUDIO_PROJECTS } from "@/data/studio";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";
import { ProjectCard } from "@/components/studio/ProjectCard";

export function FeaturedWorkSection() {
  const featured = STUDIO_PROJECTS.filter((p) => p.featured);

  return (
    <SurfaceSection
      id="featured-work"
      surface="void"
      webglMode="work-gallery"
      ariaLabel="Featured case studies"
      className="rounded-t-[36px] py-24 md:rounded-t-[52px] md:py-36"
    >
      <div className="kn-container">
        <CrosshairRow labelLeft="02 // SELECTED CASE STUDIES" labelRight={`ARCHIVE [${featured.length}]`} />

        {/* Section Header */}
        <div className="mt-10 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
          <div className="flex items-start gap-4">
            <SplitTextReveal
              as="h2"
              lines={["FEATURED", "WORK"]}
              className="kn-section-title text-[#f4f6fb]"
            />
            <span className="mt-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 font-mono text-xs text-[#00d2ff]">
              0{featured.length}
            </span>
          </div>

          <p className="max-w-md text-base leading-relaxed text-[#9aa3b8]">
            A curated selection of real-time brand worlds, optical campaigns, and spatial systems
            engineered for forward-thinking partners.
          </p>
        </div>

        {/* Asymmetric 2-Column Staggered Gallery */}
        <div className="mt-16 grid gap-x-10 gap-y-16 md:grid-cols-2 md:mt-20">
          {featured.map((project, idx) => (
            <ProjectCard
              key={project.slug}
              project={project}
              staggerOffset={idx % 2 === 1}
            />
          ))}
        </div>

        {/* Centered Oversized Archive CTA */}
        <div className="mt-20 flex flex-col items-center justify-center gap-4 text-center md:mt-28">
          <MagneticPill
            href="/work"
            transitionLabel="ALL PROJECTS"
            variant="light"
            size="lg"
            cursorText="ALL WORK"
          >
            See All Projects
          </MagneticPill>
          <p className="font-mono text-xs uppercase tracking-[0.09em] text-[#9aa3b8]">
            FILTER BY DISCIPLINE · GRID OR INTERACTIVE INDEX VIEW
          </p>
        </div>
      </div>
    </SurfaceSection>
  );
}
