"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState } from "react";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { soundEngine } from "@/lib/audio";
import { getCanonicalProjectTitle } from "@/lib/clean-media-synthesizer";
import type { LusionProjectCard } from "@/data/reference";

interface FeaturedProjectCardProps {
  project: LusionProjectCard;
  index: number;
}

/** Semantic card and failure surface. The shared Home owner animates native depth maps and type. */
export function FeaturedProjectCard({ project, index }: FeaturedProjectCardProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const displayTitle = getCanonicalProjectTitle(project.id, project.title);

  return (
    <TransitionLink
      href={project.href}
      aria-label={displayTitle}
      transitionLabel={displayTitle}
      data-id={project.id}
      data-project-slug={project.id}
      data-color-bg={project.colorBg}
      data-color-text={project.colorText}
      data-categories={project.categoriesText.toUpperCase()}
      onPointerEnter={event => { if (event.pointerType !== "touch") soundEngine.playHover(); }}
      className={`project-item project-type-website group relative col-span-6 block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#1a2ffb] ${
        index >= 2 ? "min-[813px]:mt-[5em]" : ""
      } ${index >= 1 ? "max-[812px]:mt-[2em]" : ""}`}
    >
      {/* Thumbnail Stage (`.project-item-main`, 65% aspect ratio, 15px border radius) */}
      <div
        style={{ backgroundColor: project.colorBg, transform: "none" }}
        className="project-item-main relative w-full overflow-hidden rounded-[15px] pt-[65%] shadow-[0_14px_34px_rgba(10,14,28,0.06)] transition-shadow duration-500 will-change-transform group-hover:shadow-[0_24px_54px_rgba(26,47,251,0.14)]"
      >
        <div
          className="absolute inset-0 h-full w-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform"
        >
          {!imgFailed ? (
            <img
              ref={(el) => {
                if (el && el.complete && el.naturalWidth === 0 && !imgFailed) {
                  setImgFailed(true);
                }
              }}
              src={project.thumbnail}
              alt={displayTitle}
              width={project.thumbnailWidth}
              height={project.thumbnailHeight}
              loading={index < 4 ? "eager" : "lazy"}
              decoding="async"
              onError={() => setImgFailed(true)}
              className="project-item-image h-full w-full rounded-[15px] object-cover"
            />
          ) : (
            <div
              data-fallback-card="true"
              style={{
                background: `radial-gradient(circle at 30% 25%, ${project.colorText}26, transparent 62%), ${project.colorBg}`,
                color: project.colorText,
              }}
              className="project-item-image flex h-full w-full flex-col justify-between rounded-[15px] p-6"
            >
              <span className="font-mono text-xs tracking-[0.12em] uppercase opacity-70">
                {String(index + 1).padStart(2, "0")} / LUSION ARCHIVE
              </span>
              <span className="font-sans text-2xl font-medium tracking-[-0.02em] md:text-3xl">
                {displayTitle}
              </span>
            </div>
          )}
        </div>

      </div>

      {/* Metadata Footer (`.project-item-footer`: uppercase bullet categories + title with slide-in arrow on desktop & permanent arrow on mobile) */}
      <div className="project-item-footer relative w-full text-[#000000]">
        <div className="project-item-line-1 mt-[1.5em] mb-[0.85em] font-sans text-[2.5vw] leading-snug tracking-[0.02em] text-black/80 uppercase min-[813px]:text-[0.9vw]">
          {project.categoriesText}
        </div>

        <div className="project-item-line-2 relative flex h-[1.15em] items-center overflow-hidden font-sans text-[6.5vw] leading-none font-normal tracking-[-0.02em] text-black min-[813px]:text-[3vw]">
          <span
            aria-hidden="true"
            className="project-item-line-2-icon absolute -left-[1em] inline-flex h-[.72em] w-[.72em] items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
              <path
                d="M3 12H20M20 12L13.5 5.5M20 12L13.5 18.5"
                stroke="#000000"
                strokeWidth="2.1"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="project-item-line-2-title project-item-line-2-inner" aria-label={displayTitle}>
            {[...displayTitle].map((char, i) => <span key={i} className="project-title-slot" aria-hidden="true"><span className="project-title-strip">{Array.from({ length: 4 }, (_, j) => <span key={j}>{char === " " ? "\u00a0" : char}</span>)}</span></span>)}
          </span>
        </div>
      </div>
    </TransitionLink>
  );
}
