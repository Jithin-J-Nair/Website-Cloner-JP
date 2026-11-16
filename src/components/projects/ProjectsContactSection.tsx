"use client";

import React, { useEffect, useRef, useState } from "react";
import { ProjectsContactField } from "@/components/projects/ProjectsContactField";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { soundEngine } from "@/lib/audio";
import { LUSION_GLOBAL_CHROME } from "@/data/reference";


function SplitLetters({ text }: { text: string }) {
  return <span data-cta-word className="projects-cta-word">
    {Array.from(text).map((character, index) => <span key={index} className="projects-cta-letter-clip">
      <span data-cta-roll className="projects-cta-letter-track">
        <span data-cta-letter className="projects-cta-letter">{character}</span>
        <span className="projects-cta-letter projects-cta-letter-copy">{character}</span>
      </span>
    </span>)}
  </span>;
}

/** Projects-only CTA: pale surface, native RGB-channel atlas glyph liquid,
 * keyboard scroll pill and the observed two-line editorial composition. */
export function ProjectsContactSection() {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
  }, []);

  const handleEmailTrigger = async (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (event.defaultPrevented) return;
    soundEngine.playClick();
    try {
      if (!navigator.clipboard?.writeText) return;
      await navigator.clipboard.writeText(LUSION_GLOBAL_CHROME.footer.businessEmail);
      setCopiedNotice(true);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => {
        copyTimerRef.current = null;
        setCopiedNotice(false);
      }, 2600);
    } catch {
      // The mailto link remains the fallback when clipboard access is unavailable.
    }
  };

  return (
    <SurfaceSection
      id="end-section"
      surface="ice"
      webglMode="contact-beacon"
      className="relative z-10 w-full !bg-[#f0f1fa] py-0 text-black"
    >
      <div style={{ minHeight: "350vh" }} className="relative w-full bg-[#f0f1fa]">
        <div
          id="end-section-outer"
          className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#f0f1fa] px-[var(--base-padding-x)] text-black"
        >
          {/* Five crosshairs from Projects' shared native EndSection */}
          <div
            id="end-section-content-crosses"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-20"
          >
            <span className="lusion-plus-cross end-section-content-cross" />
            <span className="lusion-plus-cross end-section-content-cross" />
            <span className="lusion-plus-cross end-section-content-cross" />
            <span className="lusion-plus-cross end-section-content-cross" />
            <span className="lusion-plus-cross end-section-content-cross" />
          </div>

          {/* Center Editorial CTA (`#end-section-content`) */}
          <div id="end-section-content" className="absolute inset-x-0 top-[20.5vh] z-10 w-full text-center">
            <div id="end-section-subtitle" className="overflow-hidden">
              <p
                id="end-section-subtitle-text"
                className="mx-auto max-w-[18ch] font-sans text-[clamp(0.72rem,0.85vw,0.9rem)] font-normal uppercase leading-[1.35] tracking-[0.04em] text-black sm:max-w-none sm:whitespace-nowrap"
              >
                {LUSION_GLOBAL_CHROME.endSection.subtitle.split(" ").map((word, index) => <React.Fragment key={index}><span data-cta-subtitle-word className="inline-block">{word}</span>{" "}</React.Fragment>)}
              </p>
            </div>

            <div id="end-section-title" className="group relative mx-auto mt-[5.1vh] w-fit">
              <a
                id="end-section-title-link"
                href={`mailto:${LUSION_GLOBAL_CHROME.footer.businessEmail}`}
                draggable={false}
                onClick={handleEmailTrigger}
                onMouseEnter={() => soundEngine.playHover()}
                aria-label="Let's work together!"
                className="projects-cta-title block font-sans text-[17.5vw] font-normal leading-[0.95] tracking-[-0.035em] text-black sm:text-[10vw] min-[1800px]:text-[9.5rem]"
              >
                <span aria-hidden="true" className="projects-cta-line">
                  <SplitLetters text="Let's" />{" "}<SplitLetters text="work" />
                  <span id="end-section-title-top-decoration" data-cta-decoration className="projects-cta-decoration" />
                </span>
                <br />
                <span aria-hidden="true" className="projects-cta-line">
                  <SplitLetters text="together!" />
                  <span id="end-section-title-bottom-left-decoration" data-cta-decoration className="projects-cta-decoration" />
                  <span id="end-section-title-bottom-right-decoration" data-cta-decoration className="projects-cta-decoration" />
                </span>
              </a>
            </div>

            {copiedNotice && (
              <p
                role="status"
                className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-[#1a2ffb]"
              >
                Email address copied to clipboard
              </p>
            )}
          </div>

          {/* Atlas canvas sits beneath the black DOM type, as in the reference canvas/UI stack. */}
          <div data-projects-particles className="pointer-events-none absolute inset-0 z-0">
            <ProjectsContactField />
          </div>

          {/* Bottom Floating White Scroll Pill (`#end-bottom`) */}
          <a
            id="end-bottom"
            href="#footer-section"
            onClick={(e) => {
              e.preventDefault();
              soundEngine.playClick();
              document.getElementById("footer-section")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
            }}
            className="pointer-events-auto absolute bottom-[56px] left-1/2 z-30 inline-flex h-[54px] min-w-[238px] -translate-x-1/2 items-center justify-between gap-4 rounded-full bg-white px-6 !text-black shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:scale-[1.03]"
          >
            <span aria-hidden="true" className="projects-cta-pill-arrow text-xs leading-none text-black/80">
              <span>↓</span><span>↓</span>
            </span>
            <span
              id="end-bottom-text-container"
              className="relative h-[1.1rem] overflow-hidden whitespace-nowrap font-sans text-[0.74rem] font-medium uppercase leading-[1.1rem] tracking-[0.06em]"
            >
              <span className="projects-cta-pill-label"><span>{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span><span aria-hidden="true">{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span></span>
            </span>
            <span aria-hidden="true" className="projects-cta-pill-arrow text-xs leading-none text-black/80">
              <span>↓</span><span>↓</span>
            </span>
          </a>
        </div>
      </div>
    </SurfaceSection>
  );
}
