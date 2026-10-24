"use client";

import React from "react";
import { LUSION_PROJECTS_ARCHIVE } from "@/data/reference";
import { FeaturedProjectCard } from "@/components/home/FeaturedProjectCard";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";

/**
 * Lusion's projects archive is driven by the captured reference dataset.
 * Keep the real project order, titles, categories, thumbnails, colours and hrefs;
 * do not substitute the former KINETA demo case studies or invented filter UI.
 */
export function WorkArchiveView() {
  const projects = LUSION_PROJECTS_ARCHIVE.projects;

  return (
    <main id="projects" className="relative w-full overflow-x-clip bg-[#f0f1fa] text-[#000000]">
      <section
        id="projects-main"
        className="section relative px-[var(--base-padding-x)] pt-[calc(var(--base-padding-y)+5rem)] pb-24 min-[813px]:pt-[calc(var(--base-padding-y)+6rem)] min-[813px]:pb-32"
      >
        <div className="mb-12 flex items-end justify-between gap-6 min-[813px]:mb-16">
          <div>
            <p className="mb-5 font-mono text-[11px] uppercase tracking-[0.08em] text-black/60">
              LUSION / PROJECTS
            </p>
            <h1 className="font-sans text-[16vw] leading-[0.92] font-normal tracking-[-0.045em] min-[813px]:text-[8vw]">
              Projects
            </h1>
          </div>
          <span className="mb-2 font-mono text-sm text-black/60 min-[813px]:mb-4 min-[813px]:text-base">
            {String(projects.length).padStart(2, "0")}
          </span>
        </div>

        <div className="grid grid-cols-6 gap-x-[var(--grid-gap)] gap-y-12 min-[813px]:grid-cols-12 min-[813px]:gap-y-16">
          {projects.map((project, index) => (
            <FeaturedProjectCard key={project.id} project={project} index={index} />
          ))}
        </div>
      </section>

      <ContactCtaSection />
      <StudioFooter />
    </main>
  );
}
