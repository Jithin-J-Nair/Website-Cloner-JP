"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useCallback, useRef, useState } from "react";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";
import { getCanonicalProjectTitle } from "@/lib/clean-media-synthesizer";
import type { LusionProjectCard } from "@/data/reference";

interface FeaturedProjectCardProps {
  project: LusionProjectCard;
  index: number;
}

/**
 * Verified Lusion Featured Project Item (`.project-item`)
 *
 * Uses exact `LUSION_HOME.featured.projects` ground-truth metadata:
 *   - Canonical route: `project.href` (`/projects/<slug>`)
 *   - Exact aspect box: `padding-top: 65%`, `border-radius: 15px`
 *   - Interactive pointer depth-parallax shift + brand `colorBg` rim bloom
 *   - Slide-in `.project-item-line-2-icon` arrow + title shift on hover/focus
 *   - Resilient art-directed fallback surface if local inspection WebP is absent
 */
export function FeaturedProjectCard({ project, index }: FeaturedProjectCardProps) {
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const [hovered, setHovered] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);
  const imgWrapRef = useRef<HTMLDivElement>(null);
  const displayTitle = getCanonicalProjectTitle(project.id, project.title);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (reducedMotion || !imgWrapRef.current) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
      const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
      imgWrapRef.current.style.transform = `scale(1.045) translate3d(${(-nx * 9).toFixed(1)}px, ${(-ny * 7).toFixed(1)}px, 0)`;
    },
    [reducedMotion]
  );

  const handlePointerEnter = useCallback(() => {
    setHovered(true);
    soundEngine.playHover();
  }, []);

  const handlePointerLeave = useCallback(() => {
    setHovered(false);
    if (imgWrapRef.current) {
      imgWrapRef.current.style.transform = "scale(1) translate3d(0px, 0px, 0)";
    }
  }, []);

  return (
    <TransitionLink
      href={project.href}
      transitionLabel={displayTitle}
      data-id={project.id}
      data-project-slug={project.id}
      data-color-bg={project.colorBg}
      data-color-text={project.colorText}
      onMouseEnter={handlePointerEnter}
      onMouseLeave={handlePointerLeave}
      onFocus={() => setHovered(true)}
      onBlur={handlePointerLeave}
      className={`project-item project-type-website group relative col-span-6 block cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-6 focus-visible:outline-[#1a2ffb] ${
        index >= 2 ? "min-[813px]:mt-[5em]" : ""
      } ${index >= 1 ? "max-[812px]:mt-[2em]" : ""}`}
    >
      {/* Thumbnail Stage (`.project-item-main`, 65% aspect ratio, 15px border radius) */}
      <div
        onPointerMove={handlePointerMove}
        style={{ backgroundColor: project.colorBg }}
        className="project-item-main relative w-full overflow-hidden rounded-[15px] pt-[65%] shadow-[0_14px_34px_rgba(10,14,28,0.06)] transition-shadow duration-500 group-hover:shadow-[0_24px_54px_rgba(26,47,251,0.14)]"
      >
        <div
          ref={imgWrapRef}
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

        {/* Subtle interactive optical sheen on hover */}
        <div
          aria-hidden="true"
          style={{
            opacity: hovered ? 0.16 : 0,
            background: `linear-gradient(135deg, ${project.colorText} 0%, transparent 55%)`,
          }}
          className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        />
      </div>

      {/* Metadata Footer (`.project-item-footer`: uppercase bullet categories + title with slide-in arrow on desktop & permanent arrow on mobile) */}
      <div className="project-item-footer relative w-full text-[#000000]">
        <div className="project-item-line-1 mt-[1.5em] mb-[0.85em] font-sans text-[2.5vw] leading-snug tracking-[0.02em] text-black/80 uppercase min-[813px]:text-[0.9vw]">
          {project.categoriesText}
        </div>

        <div className="project-item-line-2 relative flex h-[1.12em] items-center overflow-hidden font-sans text-[6.5vw] leading-none font-normal tracking-[-0.02em] text-black min-[813px]:text-[3vw]">
          <span
            aria-hidden="true"
            className={`project-item-line-2-icon inline-flex h-[0.72em] w-[0.72em] shrink-0 items-center justify-center transition-all duration-300 ease-[cubic-bezier(0.35,0,0,1)] max-[812px]:mr-[0.34em] max-[812px]:ml-0 max-[812px]:translate-x-0 max-[812px]:opacity-100 ${
              hovered ? "mr-[0.28em] translate-x-0 opacity-100" : "-ml-[0.72em] -translate-x-3 opacity-0"
            }`}
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
          <span className="project-item-line-2-title project-item-line-2-inner truncate transition-transform duration-300 ease-[cubic-bezier(0.35,0,0,1)]">
            {displayTitle}
          </span>
        </div>
      </div>
    </TransitionLink>
  );
}
