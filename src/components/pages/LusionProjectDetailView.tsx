"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useState } from "react";
import type { LusionProjectDetail } from "@/data/reference";
import { TransitionLink } from "@/components/studio/TransitionLink";
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
 * Individual Project Media Card (`<video>` with auto-fallback or `<picture><img>`)
 */
function ProjectMediaCard({
  item,
  projectId,
  canonicalTitle,
  highlight,
  isHeroDesktop = false,
  onOpenModal,
}: {
  item: LusionProjectDetail["media"][number];
  projectId: string;
  canonicalTitle: string;
  highlight: string;
  isHeroDesktop?: boolean;
  onOpenModal: (label: string, desktopSrc: string, mobileSrc: string) => void;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const aspectW = item.declaredWidth || 1280;
  const aspectH = item.declaredHeight || 720;
  const fallbackPoster = `/assets/projects/${projectId}/home.webp`;

  if (item.type === "video") {
    const videoDesktop = item.desktopSrc || "/assets/textures/reel/desktop.mp4";
    const videoMobile = item.mobileSrc || videoDesktop;
    return (
      <div
        onClick={() =>
          onOpenModal(
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
            onOpenModal(
              `Sequence ${String(item.index + 1).padStart(2, "0")}`,
              videoDesktop,
              videoMobile
            );
          }
        }}
        style={isHeroDesktop ? undefined : { aspectRatio: `${aspectW} / ${aspectH}` }}
        className={`group relative w-full cursor-pointer overflow-hidden bg-black/30 shadow-[0_24px_60px_rgba(0,0,0,0.28)] focus-visible:outline-2 focus-visible:outline-white ${
          isHeroDesktop
            ? "h-[70vh] rounded-l-[20px] rounded-r-none"
            : "rounded-[18px]"
        }`}
      >
        {!videoFailed ? (
          <video
            src={videoDesktop}
            poster={fallbackPoster}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            onError={() => setVideoFailed(true)}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
          />
        ) : (
          <>
            {/* A real project still is a closer, evidence-based fallback than an invented shader reel. */}
            <img
              src={fallbackPoster}
              alt={`${canonicalTitle} — video preview`}
              width={aspectW}
              height={aspectH}
              className="h-full w-full object-cover"
            />
            <span className="pointer-events-none absolute right-4 bottom-4 rounded-full bg-black/70 px-3 py-2 font-mono text-[10px] tracking-[0.08em] text-white uppercase">
              Preview
            </span>
          </>
        )}
      </div>
    );
  }

  const imgDesktop = item.desktopSrc || fallbackPoster;
  const imgMobile = item.mobileSrc || imgDesktop;

  return (
    <figure
      style={isHeroDesktop ? undefined : { aspectRatio: `${aspectW} / ${aspectH}` }}
      className={`relative m-0 w-full overflow-hidden bg-black/20 shadow-[0_24px_60px_rgba(0,0,0,0.24)] ${
        isHeroDesktop
          ? "h-[70vh] rounded-l-[20px] rounded-r-none"
          : "rounded-[18px]"
      }`}
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
}

/**
 * Verified Lusion Case-Study Page (`/projects/[slug]` — All 19 Canonical Routes)
 *
 * Matches all 38 desktop (`1440x900`) and mobile (`390x844`) captures in `docs/validation/phase-g/reference/`:
 *   - Exact brand surface (`theme.colorBg`, `theme.colorText`, `theme.colorHighlight`) + subtle tonal hero backdrop
 *   - Crisp `#ffffff` `• LAUNCH PROJECT` pill matching `.project-details-launch-btn` in `lusion.co` CSS
 *   - Desktop opening `100vh` split stage: sticky left narrative (`cols 1..5`) + right flush-bleeding `70vh` media stage (`left: 46vw..100vw`) + `SCROLL TO EXPLORE >>`
 *   - Mobile opening `100svh` editorial viewport (`LUSION`, `←` + `••` white circles, `h1`, paragraphs, `SERVICES`/`LINKS`, `• LAUNCH PROJECT`) followed seamlessly below by full media gallery & `NEXT PROJECT`
 */
export function LusionProjectDetailView({ project }: LusionProjectDetailViewProps) {
  const setActiveProjectTheme = useStudioStore((s) => s.setActiveProjectTheme);
  const setReelOpen = useStudioStore((s) => s.setReelOpen);

  const bg = project.theme.colorBg || "#1a1411";
  const fg = project.theme.colorText || "#ffedd7";
  const highlight = project.theme.colorHighlight || fg;

  // In live `lusion.co` CSS, `.project-details-launch-btn` renders with `#ffffff` pill surface
  // and dark/brand text (`#0b0d14` / `colorBtnText`), ensuring crisp contrast even when `data-color-btn-bg="#000"`.
  const pillBg = "#ffffff";
  const rawBtnText = (project.theme.colorBtnText || "#0b0d14").trim().toLowerCase();
  const pillText =
    rawBtnText === "#ffffff" || rawBtnText === "#fff" || rawBtnText === "#ffedd7"
      ? "#192743"
      : project.theme.colorBtnText || "#0b0d14";

  const canonicalTitle = getCanonicalProjectTitle(project.id, project.title);
  const nextTitle = getCanonicalProjectTitle(project.nextProject.id, project.nextProject.title);

  useEffect(() => {
    setActiveProjectTheme({
      slug: project.id,
      bg,
      highlight,
      btnBg: pillBg,
      btnText: pillText,
      btnBgHover: project.theme.colorBtnBgHover || highlight,
      btnTextHover: project.theme.colorBtnTextHover || "#ffffff",
    });
    return () => {
      setActiveProjectTheme(null);
    };
  }, [
    bg,
    pillBg,
    pillText,
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

  const renderLaunchCta = () => {
    if (!project.launchCta) return null;
    if (project.launchCta.isVimeoOverlay) {
      return (
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
          style={{ backgroundColor: pillBg, color: pillText }}
          className="inline-flex h-12 cursor-pointer items-center gap-3.5 rounded-full px-7 font-sans text-xs font-medium tracking-[0.05em] uppercase shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-white"
        >
          <span className="h-2 w-2 rounded-full bg-current" />
          <span>{project.launchCta.label}</span>
        </button>
      );
    }

    return (
      <a
        href={project.launchCta.href}
        target="_blank"
        rel="noopener noreferrer"
        style={{ backgroundColor: pillBg, color: pillText }}
        className="inline-flex h-12 items-center gap-3.5 rounded-full px-7 font-sans text-xs font-medium tracking-[0.05em] uppercase shadow-[0_10px_28px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-white"
      >
        <span className="h-2 w-2 rounded-full bg-current" />
        <span>{project.launchCta.label}</span>
      </a>
    );
  };

  const heroMedia = project.media[0];
  const restMedia = project.media.slice(1);

  return (
    <main
      id={`project-${project.id}`}
      style={{ backgroundColor: bg, color: fg }}
      className="relative overflow-x-clip"
    >
      {/* Subtle Ambient Hero Watermark matching live `lusion.co/projects/[slug]` canvas backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden opacity-[0.055]"
      >
        <img
          src={`/assets/projects/${project.id}/home.webp`}
          alt=""
          className="h-full w-full scale-110 object-cover blur-[2px] grayscale"
        />
      </div>

      {/* Split Sticky Editorial + Right Media Showcase Band */}
      <section className="relative z-10 px-[var(--base-padding-x)] pt-24 pb-20 min-[813px]:grid min-[813px]:grid-cols-12 min-[813px]:items-start min-[813px]:gap-x-[var(--grid-gap)] min-[813px]:pt-[17vh] min-[813px]:pb-28">
        {/* Left Sticky Editorial Column (fills first mobile viewport cleanly; sticky cols 1..5 on desktop) */}
        <div className="flex min-h-[calc(100svh-7.5rem)] flex-col justify-between pb-6 min-[813px]:sticky min-[813px]:top-[22vh] min-[813px]:col-span-5 min-[813px]:min-h-0 min-[813px]:pt-[5vh] min-[813px]:pb-0">
          <div>
            <h1 className="m-0 font-sans text-[13.4vw] leading-[0.98] font-normal tracking-[-0.025em] min-[813px]:text-[3.45vw]">
              {canonicalTitle}
            </h1>

            {/* Desktop 2-column sub-split (`paragraphs + CTA` left, `SERVICES + LINKS` right) */}
            <div className="mt-8 grid grid-cols-1 gap-8 min-[1100px]:grid-cols-12 min-[1100px]:gap-6">
              <div className="space-y-5 font-sans text-[15px] leading-[1.58] opacity-92 min-[1100px]:col-span-8">
                {project.paragraphs.map((para, idx) => (
                  <RichGroundTruthParagraph
                    key={idx}
                    text={para.text}
                    links={para.links}
                    highlightColor={highlight}
                  />
                ))}

                {project.launchCta && (
                  <div className="pt-4 max-[812px]:hidden">{renderLaunchCta()}</div>
                )}
              </div>

              {/* `SERVICES` + `LINKS` Two-Column Metadata Block */}
              <div className="grid grid-cols-2 gap-6 pt-2 min-[1100px]:col-span-4 min-[1100px]:grid-cols-1 min-[1100px]:pt-0">
                {project.services.length > 0 && (
                  <div>
                    <h2
                      style={{ color: highlight }}
                      className="font-sans text-[11px] font-medium tracking-[0.06em] uppercase"
                    >
                      SERVICES
                    </h2>
                    <ul className="mt-3 space-y-1.5 font-sans text-[13.5px] leading-snug opacity-92">
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
                      className="font-sans text-[11px] font-medium tracking-[0.06em] uppercase"
                    >
                      LINKS
                    </h2>
                    <ul className="mt-3 space-y-1.5 font-sans text-[13.5px] leading-snug">
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
          </div>

          {/* Mobile `• LAUNCH PROJECT` White Pill at bottom of opening mobile screen */}
          {project.launchCta && (
            <div className="mt-8 min-[813px]:hidden">{renderLaunchCta()}</div>
          )}
        </div>

        {/* Right Media Showcase Column (`cols 6..12` on desktop, flush right bleed on opening hero frame) */}
        <div className="mt-10 space-y-6 min-[813px]:col-span-7 min-[813px]:mt-0 min-[813px]:space-y-8">
          {heroMedia && (
            <div className="min-[813px]:-mr-[var(--base-padding-x)] min-[813px]:pb-14">
              <ProjectMediaCard
                item={heroMedia}
                projectId={project.id}
                canonicalTitle={canonicalTitle}
                highlight={highlight}
                isHeroDesktop={true}
                onOpenModal={openMediaModal}
              />
              {/* Bottom-Right `SCROLL TO EXPLORE >>` Indicator matching `12-01..12-19` desktop captures */}
              <div className="mt-5 flex justify-end max-[812px]:hidden min-[813px]:pr-[var(--base-padding-x)]">
                <span
                  style={{ color: highlight }}
                  className="font-sans text-[11px] font-medium tracking-[0.08em] uppercase"
                >
                  {project.scrollPrompt} &raquo;
                </span>
              </div>
            </div>
          )}

          {restMedia.map((item) => (
            <ProjectMediaCard
              key={item.index}
              item={item}
              projectId={project.id}
              canonicalTitle={canonicalTitle}
              highlight={highlight}
              onOpenModal={openMediaModal}
            />
          ))}
        </div>
      </section>

      {/* Verified `NEXT PROJECT` Chain Banner (`project.nextProject` across all 19 case studies) */}
      <section
        id="project-next"
        style={{
          backgroundColor: project.nextProject.colorBg || "#121417",
          color: project.nextProject.colorText || "#ffffff",
        }}
        className="relative z-10 border-t border-white/10 px-[var(--base-padding-x)] py-24 min-[813px]:py-36"
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
      <StudioFooter nextHref="/about" nextLabel={project.scrollNav.targetTitle} />
    </main>
  );
}
