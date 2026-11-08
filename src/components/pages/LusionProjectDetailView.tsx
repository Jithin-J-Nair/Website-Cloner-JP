"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import type { LusionProjectDetail } from "@/data/reference";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { getCanonicalProjectTitle } from "@/lib/clean-media-synthesizer";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";
import { useRouter } from "next/navigation";
import { createCaseStudyMotion } from "@/components/case-study/CaseStudyMotion";
import "@/components/case-study/case-study.css";
import { ProjectPreviewVideo } from "@/components/studio/ProjectPreviewVideo";

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
  onOpenModal,
}: {
  item: LusionProjectDetail["media"][number];
  projectId: string;
  canonicalTitle: string;
  onOpenModal: (label: string, desktopSrc: string, mobileSrc: string) => void;
}) {
  const [videoFailed, setVideoFailed] = useState(false);
  const aspectW = item.declaredWidth || 1280;
  const aspectH = item.declaredHeight || 720;
  const fallbackPoster = `/assets/projects/${projectId}/home.webp`;

  if (item.type === "text" && "text" in item) {
    const fontSizeEm = "fontSizeEm" in item && typeof item.fontSizeEm === "number" ? item.fontSizeEm : 1.5;
    return (
      <div data-project-media-type="text" data-project-media-index={item.index} className="case-text">
        <p className="font-sans" style={{ fontSize: `${fontSizeEm}em` }}>
          {item.text}
        </p>
      </div>
    );
  }

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
        aria-label={`${canonicalTitle} — play sequence ${String(item.index + 1).padStart(2, "0")}`}
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
        style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
        className="case-media group relative h-full w-full cursor-pointer overflow-hidden focus-visible:outline-2 focus-visible:outline-white"
      >
        {!videoFailed ? (
          <ProjectPreviewVideo
            desktopSrc={videoDesktop}
            mobileSrc={videoMobile}
            poster={fallbackPoster}
            onError={() => setVideoFailed(true)}
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
      style={{ aspectRatio: `${aspectW} / ${aspectH}` }}
      className="case-media relative m-0 h-full w-full overflow-hidden"
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

/** Native case-study presentation shared by all nineteen canonical projects. */
export function LusionProjectDetailView({ project }: LusionProjectDetailViewProps) {
  const rootRef = useRef<HTMLElement>(null);
  const reduced = useStudioStore(s => s.reducedMotion);
  const router = useRouter();
  useEffect(() => {
    if (rootRef.current) return createCaseStudyMotion(rootRef.current, project, reduced, () => router.push(project.nextProject.href));
  }, [project, reduced, router]);
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
    if (!project.launchCta.href?.trim() && !project.launchCta.isVimeoOverlay) {
      // The current reference capture exposes this CTA label but no destination.
      // Preserve the visible pill without turning an empty href into a self-link.
      return (
        <span
          role="note"
          aria-label={`${project.launchCta.label} — destination unavailable in the reference data`}
          data-launch-unavailable="true"
          className="inline-flex h-12 items-center gap-3.5 rounded-full px-7 font-sans text-xs font-medium tracking-[0.05em] uppercase shadow-[0_10px_28px_rgba(0,0,0,0.08)]"
          style={{ backgroundColor: pillBg, color: pillText }}
        >
          <span className="case-launch-dot h-2 w-2 rounded-full bg-current" />
          <span className="case-launch-text">{project.launchCta.label}</span>
        </span>
      );
    }
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
          <span className="case-launch-dot h-2 w-2 rounded-full bg-current" />
          <span className="case-launch-text">{project.launchCta.label}</span>
          <span className="case-launch-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6 12h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" /></svg></span>
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
        <span className="case-launch-dot h-2 w-2 rounded-full bg-current" />
        <span className="case-launch-text">{project.launchCta.label}</span>
        <span className="case-launch-arrow" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M6 12h12m-5-5 5 5-5 5" stroke="currentColor" strokeWidth="1.5" /></svg></span>
      </a>
    );
  };

  const media = project.media;

  return (
    <main ref={rootRef} id={`project-${project.id}`} data-case-study={project.id}
      style={{ backgroundColor: bg, color: fg, "--case-highlight": highlight, "--case-btn-hover": project.theme.colorBtnTextHover || "#ffffff", "--case-icon": project.theme.colorIconColor || pillText, "--case-next-bg": project.nextProject.colorBg, "--case-next-text": project.nextProject.colorText } as React.CSSProperties}
      className="case-study">
      <div id="project-details" className="case-stage">
        <section id="project-details-meta" aria-label={`${canonicalTitle} project information`}>
          <h1 id="project-details-title">{canonicalTitle}</h1>
          <div className="case-meta-columns">
            <div className="case-reading">
              <div id="project-details-desc">
                {project.paragraphs.map((para, idx) => <RichGroundTruthParagraph key={idx} text={para.text} links={para.links} highlightColor={highlight} />)}
              </div>
              {project.launchCta && <div id="project-details-launch-cta" className="case-launch-desktop">{renderLaunchCta()}</div>}
            </div>
            <div id="project-details-side-list">
              {project.services.length > 0 && <div id="project-details-side-list-services">
                <h2>SERVICES</h2><ul>{project.services.map(service => <li key={service}>{service}</li>)}</ul>
              </div>}
              {project.links.length > 0 && <div id="project-details-side-list-links">
                <h2>LINKS</h2><ul>{project.links.map(link => <li key={`${link.label}-${link.href}`}><a href={link.href} target="_blank" rel="noopener noreferrer">{link.label}</a></li>)}</ul>
              </div>}
            </div>
          </div>
          {project.launchCta && <div id="project-details-launch-cta-mobile" data-mobile-launch-cta>{renderLaunchCta()}</div>}
        </section>
        <div id="project-details-items-wrapper" data-project-gallery>
          <div id="project-details-items-move-container">
            {media.map(item => <div key={`${project.id}-${item.index}`} className="case-panel" data-panel-index={item.index} data-fullscreen={!!item.fullscreen} data-panel-type={item.type}
              style={{ "--case-aspect": item.type === "text" ? 1 : (item.declaredWidth || 16) / (item.declaredHeight || 9) } as React.CSSProperties}>
              <ProjectMediaCard item={item} projectId={project.id} canonicalTitle={canonicalTitle} onOpenModal={openMediaModal} />
            </div>)}
            <section id="project-next" className="case-next" aria-label="Next project">
              <TransitionLink href={project.nextProject.href} transitionLabel={nextTitle} onMouseEnter={() => soundEngine.playHover()}>
                <h2 id="project-details-preview-title">{nextTitle}</h2>
                <div className="case-next-footer"><span>{project.nextProject.label}</span><span className="case-next-bar"><span /></span><span aria-hidden="true">→</span></div>
              </TransitionLink>
            </section>
          </div>
        </div>
        <div id="project-details-header-info" aria-hidden="true">{project.scrollPrompt} <span>»</span></div>
      </div>
    </main>
  );
}
