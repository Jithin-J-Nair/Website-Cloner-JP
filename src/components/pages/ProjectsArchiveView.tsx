"use client";

import React, { useEffect, useRef } from "react";
import { LUSION_PROJECTS_ARCHIVE } from "@/data/reference";
import { FeaturedProjectCard } from "@/components/home/FeaturedProjectCard";
import { ProjectsContactSection } from "@/components/projects/ProjectsContactSection";
import { createProjectsArchiveMotion } from "@/components/projects/ProjectsArchiveMotion";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { useStudioStore } from "@/lib/store";
import "@/components/projects/projects.css";

/** Recorded Projects archive, with its own native depth/type and textured end
 * owners. No renderer or stylesheet writes into the approved Home/About acts. */
export function ProjectsArchiveView() {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useStudioStore(s => s.reducedMotion);
  const setActiveSurface = useStudioStore(s => s.setActiveSurface);
  useEffect(() => { setActiveSurface("ice"); }, [setActiveSurface]);
  useEffect(() => {
    if (rootRef.current) return createProjectsArchiveMotion(rootRef.current, reduced);
  }, [reduced]);

  return (
    <main ref={rootRef} id="projects" className="relative overflow-x-clip bg-[#f0f1fa] text-black">
      <section id="projects-main" className="px-[var(--base-padding-x)]">
        <div id="projects-main-title-wrapper">
          <h1 id="projects-title" className="m-0 font-sans font-normal uppercase" aria-label={LUSION_PROJECTS_ARCHIVE.heading}>
            {[...LUSION_PROJECTS_ARCHIVE.heading].map((char, i) => <span key={i} data-project-heading-char aria-hidden="true">{char}</span>)}
          </h1>
          <span id="projects-count" aria-label={`${LUSION_PROJECTS_ARCHIVE.displayedCount} projects`}>
            {[...String(LUSION_PROJECTS_ARCHIVE.displayedCount)].map((char, i) => <span key={i} data-project-count-char aria-hidden="true">{char}</span>)}
          </span>
          <svg id="projects-arrow" aria-hidden="true" viewBox="0 0 38 38" fill="none">
            <path d="m2 2 34 34m0 0V6.046M36 36H6.046" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div id="projects-list" className="project-list relative grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:grid-cols-12">
          {LUSION_PROJECTS_ARCHIVE.projects.map((project, idx) => <FeaturedProjectCard key={project.id} project={project} index={idx} />)}
        </div>
      </section>
      <ProjectsContactSection />
      <StudioFooter nextHref="/about" nextLabel={LUSION_PROJECTS_ARCHIVE.scrollNav.targetTitle} />
    </main>
  );
}
