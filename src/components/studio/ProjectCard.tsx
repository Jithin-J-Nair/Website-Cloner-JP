"use client";

import React, { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type { StudioProject } from "@/data/studio";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { ProceduralMediaCanvas } from "@/components/studio/ProceduralMediaCanvas";
import { GlowCard } from "@/components/ui/GlowCard";
import { useStudioStore } from "@/lib/store";

interface ProjectCardProps {
  project: StudioProject;
  staggerOffset?: boolean;
}

export function ProjectCard({ project, staggerOffset = false }: ProjectCardProps) {
  const [hovered, setHovered] = useState(false);
  const setProjectAccentHex = useStudioStore((s) => s.setProjectAccentHex);

  return (
    <article className={staggerOffset ? "lg:mt-24" : ""}>
      <TransitionLink
        href={`/work/${project.slug}`}
        transitionLabel={project.title.toUpperCase()}
        cursorBadge="VIEW CASE ↗"
        onMouseEnter={() => {
          setHovered(true);
          setProjectAccentHex(project.accentHex);
        }}
        onMouseLeave={() => setHovered(false)}
        className="group block focus:outline-none"
      >
        {/* Rounded Optical Stage Card */}
        <GlowCard variant="surface" customSize radius={26} glowColor="brand" className="w-full">
        <div
          className="relative aspect-[4/3] w-full overflow-hidden rounded-[26px] border border-white/12 bg-[#0e121c] transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:border-white/30"
          style={{
            boxShadow: hovered
              ? `0 28px 70px -16px ${project.accentHex}55`
              : "0 20px 50px -20px rgba(0,0,0,0.65)",
          }}
        >
          <ProceduralMediaCanvas
            preset={project.shaderPreset}
            accentHex={project.accentHex}
            secondaryHex={project.secondaryHex}
            bgHex={project.darkBgHex}
            hovered={hovered}
            label={`${project.year} · ${project.metrics[0]?.value ?? "60 FPS"}`}
            className="transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.045]"
          />

          {/* Top Floating Category Pill */}
          <div className="pointer-events-none absolute top-4 left-4 right-4 flex items-center justify-between">
            <span className="rounded-full border border-white/15 bg-black/50 px-3.5 py-1 font-mono text-[10px] uppercase tracking-[0.09em] text-white/90 backdrop-blur-md">
              {project.index} · {project.category}
            </span>
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/12 text-white opacity-0 backdrop-blur-md transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100">
              <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
            </span>
          </div>
        </div>

        {/* Metadata Block Below Card (Authentic Lusion Rhythm) */}
        <div className="mt-5 px-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.08em] text-[#9aa3b8]">
            {project.disciplines.join(" • ")}
          </p>
          <div className="mt-2 flex items-baseline justify-between gap-4">
            <h3 className="font-display text-2xl font-medium tracking-[-0.02em] text-[#f4f6fb] transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-2 md:text-3xl">
              {project.title}
            </h3>
            <span className="font-mono text-xs text-[#9aa3b8]">{project.year}</span>
          </div>
          <p className="mt-2 line-clamp-2 max-w-xl text-sm leading-relaxed text-[#9aa3b8]">
            {project.tagline}
          </p>
        </div>
        </GlowCard>
      </TransitionLink>
    </article>
  );
}
