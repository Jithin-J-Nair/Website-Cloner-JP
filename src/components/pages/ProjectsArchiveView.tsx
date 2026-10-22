"use client";

import React, { useEffect } from "react";
import { LUSION_PROJECTS_ARCHIVE } from "@/data/reference";
import { FeaturedProjectCard } from "@/components/home/FeaturedProjectCard";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { useStudioStore } from "@/lib/store";

/**
 * Verified Lusion Projects Archive (`/projects` — All 19 Canonical Projects)
 *
 * Matches the captured `lusion.co/projects` layout (`projects-archive--1440x900.jpg`
 * & `projects-archive--390x844.jpg`):
 *   - Off-white `#f0f1fa` surface (`ice`)
 *   - Monumental display heading `PROJECTS` with superscript `19` + diagonal arrow `↘`
 *   - Full 19-card 2-column grid (1-column on `<= 812px`) reusing shared `FeaturedProjectCard`
 *   - Closing `ContactCtaSection` + `StudioFooter` portal (`About Us` -> `/about`)
 */
export function ProjectsArchiveView() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);

  useEffect(() => {
    setActiveSurface("ice");
  }, [setActiveSurface]);

  return (
    <main id="projects" className="relative overflow-x-clip bg-[#f0f1fa] text-[#000000]">
      <section className="px-[var(--base-padding-x)] pt-28 pb-20 min-[813px]:pt-[29vh] min-[813px]:pb-28">
        {/* Monumental `PROJECTS` Header Band with `19` Count + `↘` Arrow */}
        <div className="flex items-stretch justify-between gap-4">
          <h1
            id="projects-title"
            className="m-0 -ml-[0.04em] font-sans text-[17.4vw] leading-[0.86] font-normal tracking-[-0.03em] text-[#000000] uppercase min-[813px]:text-[15.4vw]"
          >
            {LUSION_PROJECTS_ARCHIVE.heading}
          </h1>

          <div className="flex shrink-0 flex-col items-end justify-between py-1">
            <span
              id="projects-count"
              className="font-sans text-[4.8vw] leading-none font-normal tracking-[-0.02em] text-[#000000] min-[813px]:text-[2.6vw]"
            >
              {LUSION_PROJECTS_ARCHIVE.displayedCount}
            </span>

            <svg
              aria-hidden="true"
              viewBox="0 0 36 36"
              fill="none"
              className="h-5 w-5 text-[#000000] min-[813px]:h-12 min-[813px]:w-12"
            >
              <path
                d="M7 7L29 29M29 29V11M29 29H11"
                stroke="currentColor"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>

        {/* All 19 Verified Canonical Lusion Projects Grid */}
        <div
          id="projects-list"
          className="project-list relative mt-7 grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:mt-24 min-[813px]:grid-cols-12"
        >
          {LUSION_PROJECTS_ARCHIVE.projects.map((project, idx) => (
            <FeaturedProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>
      </section>

      <ContactCtaSection />
      <StudioFooter
        nextHref="/about"
        nextLabel={LUSION_PROJECTS_ARCHIVE.scrollNav.targetTitle}
      />
    </main>
  );
}
