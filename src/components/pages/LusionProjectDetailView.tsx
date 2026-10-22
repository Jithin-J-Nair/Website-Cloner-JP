"use client";

import React, { useEffect } from "react";
import type { LusionProjectDetail } from "@/data/reference";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { ProceduralReelStream } from "@/components/studio/ProceduralReelStream";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { getCanonicalProjectTitle } from "@/lib/clean-media-synthesizer";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";

interface LusionProjectDetailViewProps {
  project: LusionProjectDetail;
}

/**
 * Renders a ground-truth paragraph while highlighting verified inline links
 * (`GitHub page`, `Product Hunt launch`, `founder video`, etc.) in `colorHighlight`.
 */
function RichGroundTruthParagraph({
  text,
  links,
  highlightColor,
}: {
  text: string;
  links: ReadonlyArray<{ label: string; href: string }>;
  highlightColor: string;
}) {
  if (!links || links.length === 0) {
    return <p>{text}</p>;
  }

  let segments: Array<string | { label: string; href: string }> = [text];
  for (const link of links) {
    const nextSegments: Array<string | { label: string; href: string }> = [];
    for (const part of segments) {
      if (typeof part !== "string") {
        nextSegments.push(part);
        continue;
      }
      const idx = part.indexOf(link.label);
      if (idx === -1) {
        nextSegments.push(part);
      } else {
        if (idx > 0) nextSegments.push(part.slice(0, idx));
        nextSegments.push(link);
        if (idx + link.label.length < part.length) {
          nextSegments.push(part.slice(idx + link.label.length));
        }
      }
    }
    segments = nextSegments;
  }

  return (
    <p>
      {segments.map((seg, idx) =>
        typeof seg === "string" ? (
          <React.Fragment key={idx}>{seg}</React.Fragment>
        ) : (
          <a
            key={idx}
            href={seg.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: highlightColor }}
            className="underline decoration-current/45 underline-offset-4 transition-opacity hover:opacity-80"
          >
            {seg.label}
          </a>
        )
      )}
    </p>
  );
}

/**
 * Verified Lusion Case-Study Page (`/projects/[slug]` — All 19 Canonical Routes)
 *
 * Matches the captured `lusion.co/projects/oryzo_ai` layout at `1440x900` & `390x844`:
 *   - Brand-tinted full-bleed surface (`theme.colorBg`, `theme.colorText`, `theme.colorHighlight`)
 *   - Sticky left editorial column on desktop (`h1`, rich paragraphs, `LAUNCH PROJECT` pill,
 *     `SERVICES` & `LINKS` sub-columns) + scrolling right media column (`media[0..N-1]`)
 *   - Full-width `NEXT PROJECT` transition band chaining all 19 case studies in canonical order
 */
export function LusionProjectDetailView({ project }: LusionProjectDetailViewProps) {
  const setActiveProjectTheme = useStudioStore((s) => s.setActiveProjectTheme);
  const setReelOpen = useStudioStore((s) => s.setReelOpen);

  const bg = project.theme.colorBg || "#1a1411";
  const fg = project.theme.colorText || "#ffedd7";
  const highlight = project.theme.colorHighlight || fg;
  const btnBg = project.theme.colorBtnBg || "#ffffff";
  const btnText = project.theme.colorBtnText || "#000000";

  const canonicalTitle = getCanonicalProjectTitle(project.id, project.title);
  const nextTitle = getCanonicalProjectTitle(project.nextProject.id, project.nextProject.title);

  useEffect(() => {
    setActiveProjectTheme({
      slug: project.id,
      bg,
      highlight,
      btnBg,
      btnText,
      btnBgHover: project.theme.colorBtnBgHover || highlight,
      btnTextHover: project.theme.colorBtnTextHover || "#ffffff",
    });
    return () => {
      setActiveProjectTheme(null);
    };
  }, [
    bg,
    btnBg,
    btnText,
    highlight,
    project.id,
    project.theme.colorBtnBgHover,
    project.theme.colorBtnTextHover,
    setActiveProjectTheme,
  ]);

  const openMediaModal = (label: string, desktopSrc: string, mobileSrc: string, vimeoId?: string | null) => {
    soundEngine.playClick();
    setReelOpen(true, {
      title: `${canonicalTitle} — ${label}`,
      desktopSrc,
      mobileSrc,
      vimeoId: vimeoId ?? undefined,
    });
  };

  return (
    <main
      id={`project-${project.id}`}
      style={{ backgroundColor: bg, color: fg }}
      className="relative overflow-x-clip"
    >
      {/* Split Sticky Editorial + Scrolling Media Gallery Band */}
      <section className="relative px-[var(--base-padding-x)] pt-28 pb-24 min-[813px]:grid min-[813px]:grid-cols-12 min-[813px]:items-start min-[813px]:gap-x-[var(--grid-gap)] min-[813px]:pt-32 min-[813px]:pb-32">
        {/* Left Sticky Project Narrative Column (cols 1..5 on desktop, full top stack on mobile) */}
        <div className="min-[813px]:sticky min-[813px]:top-28 min-[813px]:col-span-5 min-[813px]:pt-20">
          <h1 className="m-0 font-sans text-[12.2vw] leading-[0.98] font-normal tracking-[-0.025em] min-[813px]:text-[3.5vw]">
            {canonicalTitle}
          </h1>

          {/* Desktop 2-column sub-split (`paragraphs + CTA` left, `SERVICES + LINKS` right) matching `project-oryzo-ai--1440x900.jpg` */}
          <div className="mt-8 grid grid-cols-1 gap-8 min-[1100px]:grid-cols-12 min-[1100px]:gap-6">
            <div className="space-y-5 font-sans text-[15px] leading-[1.6] opacity-92 min-[1100px]:col-span-8">
              {project.paragraphs.map((para, idx) => (
                <RichGroundTruthParagraph
                  key={idx}
                  text={para.text}
                  links={para.links}
                  highlightColor={highlight}
                />
              ))}

              {/* Optional `Launch Project` CTA Pill */}
              {project.launchCta && (
                <div className="pt-3 max-[812px]:hidden">
                  {project.launchCta.isVimeoOverlay ? (
                    <button
                      type="button"
                      onClick={() =>
                        openMediaModal(
                          project.launchCta?.label || "Film",
                          project.media[0]?.desktopSrc || "/assets/textures/reel/desktop.mp4",
                          project.media[0]?.mobileSrc || "/assets/textures/reel/mobile.mp4",
                          project.launchCta?.vimeoId
                        )
                      }
                      style={{ backgroundColor: btnBg, color: btnText }}
                      className="inline-flex cursor-pointer items-center gap-3 rounded-full px-6 py-3 font-sans text-xs font-medium tracking-[0.06em] uppercase shadow-md transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span>{project.launchCta.label}</span>
                    </button>
                  ) : (
                    <a
                      href={project.launchCta.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ backgroundColor: btnBg, color: btnText }}
                      className="inline-flex items-center gap-3 rounded-full px-6 py-3 font-sans text-xs font-medium tracking-[0.06em] uppercase shadow-md transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-white"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-current" />
                      <span>{project.launchCta.label}</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* `SERVICES` + `LINKS` Two-Column Metadata Block */}
            <div className="grid grid-cols-2 gap-6 pt-2 min-[1100px]:col-span-4 min-[1100px]:grid-cols-1 min-[1100px]:pt-0">
              {project.services.length > 0 && (
                <div>
                  <h2
                    style={{ color: highlight }}
                    className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase"
                  >
                    SERVICES
                  </h2>
                  <ul className="mt-3 space-y-1.5 font-sans text-xs leading-snug opacity-90 md:text-[13px]">
                    {project.services.map((svc) => (
                      <li key={svc}>{svc}</li>
                    ))}
                  </ul>
                </div>
              )}

              {project.links.length > 0 && (
                <div>
                  <h2
                    style={{ color: highlight }}
                    className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase"
                  >
                    LINKS
                  </h2>
                  <ul className="mt-3 space-y-1.5 font-sans text-xs leading-snug md:text-[13px]">
                    {project.links.map((lnk) => (
                      <li key={`${lnk.label}-${lnk.href}`}>
                        <a
                          href={lnk.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline-offset-4 transition-opacity hover:underline hover:opacity-75"
                        >
                          {lnk.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Mobile `Launch Project` CTA below metadata */}
          {project.launchCta && (
            <div className="mt-8 min-[813px]:hidden">
              <a
                href={project.launchCta.href}
                target="_blank"
                rel="noopener noreferrer"
                style={{ backgroundColor: btnBg, color: btnText }}
                className="inline-flex items-center gap-3 rounded-full px-6 py-3 font-sans text-xs font-medium tracking-[0.06em] uppercase shadow-md"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                <span>{project.launchCta.label}</span>
              </a>
            </div>
          )}
        </div>

        {/* Right Media Sequence Column (`project.media` — cols 6..12 on desktop) */}
        <div className="mt-12 space-y-6 min-[813px]:col-span-7 min-[813px]:mt-0 min-[813px]:space-y-8">
          {project.media.map((item) => {
            const aspectW = item.declaredWidth || 1280;
            const aspectH = item.declaredHeight || 720;

            if (item.type === "video") {
              const videoDesktop = item.desktopSrc || "/assets/textures/reel/desktop.mp4";
              const videoMobile = item.mobileSrc || videoDesktop;
              return (
                <div
                  key={item.index}
                  onClick={() =>
                    openMediaModal(
                      `Sequence ${String(item.index + 1).padStart(2, "0")}`,
                      videoDesktop,
                      videoMobile
                    )
                  }
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      openMediaModal(
                        `Sequence ${String(item.index + 1).padStart(2, "0")}`,
                        videoDesktop,
                        videoMobile
                      );
                    }
                  }}
                  style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
                  className="group relative w-full cursor-pointer overflow-hidden rounded-[18px] border border-white/10 bg-black/40 shadow-[0_24px_60px_rgba(0,0,0,0.34)] focus-visible:outline-2 focus-visible:outline-white"
                >
                  <ProceduralReelStream
                    variant="stage"
                    accentColor={highlight}
                    label={`${canonicalTitle} // 0${item.index + 1}`}
                  />
                  <div className="pointer-events-none absolute right-5 bottom-4 flex items-center gap-2 rounded-full bg-black/55 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.08em] text-white/90 uppercase backdrop-blur-sm">
                    <span>&#9658;</span>
                    <span>Motion 0{item.index + 1}</span>
                  </div>
                </div>
              );
            }

            const imgDesktop = item.desktopSrc || `/assets/projects/${project.id}/home.webp`;
            const imgMobile = item.mobileSrc || imgDesktop;

            return (
              <figure
                key={item.index}
                style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
                className="relative m-0 w-full overflow-hidden rounded-[18px] border border-white/10 bg-black/25 shadow-[0_24px_60px_rgba(0,0,0,0.28)]"
              >
                <picture className="block h-full w-full">
                  <source media="(max-width: 812px)" srcSet={imgMobile} />
                  <img
                    src={imgDesktop}
                    alt={`${canonicalTitle} — frame ${item.index + 1}`}
                    width={aspectW}
                    height={aspectH}
                    loading={item.index <= 1 ? "eager" : "lazy"}
                    decoding="async"
                    className="h-full w-full object-cover"
                  />
                </picture>
              </figure>
            );
          })}

          <div className="flex justify-end pt-2">
            <span
              style={{ color: highlight }}
              className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase"
            >
              {project.scrollPrompt} &rarr;
            </span>
          </div>
        </div>
      </section>

      {/* Verified `NEXT PROJECT` Chain Banner (`project.nextProject` across all 19 case studies) */}
      <section
        id="project-next"
        style={{
          backgroundColor: project.nextProject.colorBg || "#121417",
          color: project.nextProject.colorText || "#ffffff",
        }}
        className="border-t border-white/10 px-[var(--base-padding-x)] py-24 min-[813px]:py-36"
      >
        <TransitionLink
          href={project.nextProject.href}
          transitionLabel={nextTitle}
          onMouseEnter={() => soundEngine.playHover()}
          className="group block focus-visible:outline-2 focus-visible:outline-white"
        >
          <p className="font-mono text-xs tracking-[0.14em] uppercase opacity-70">
            {project.nextProject.label}
          </p>
          <div className="mt-4 flex items-center justify-between gap-6">
            <h2 className="m-0 font-sans text-[10vw] leading-[0.95] font-normal tracking-[-0.025em] transition-transform duration-300 group-hover:translate-x-3 min-[813px]:text-[6.2vw]">
              {nextTitle}
            </h2>
            <span
              aria-hidden="true"
              className="font-sans text-4xl transition-transform duration-300 group-hover:translate-x-2 md:text-6xl"
            >
              &rarr;
            </span>
          </div>
        </TransitionLink>
      </section>

      <ContactCtaSection />
      <StudioFooter
        nextHref="/about"
        nextLabel={project.scrollNav.targetTitle}
      />
    </main>
  );
}
