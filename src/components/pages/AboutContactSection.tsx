"use client";

import React, { useEffect, useRef, useState } from "react";
import { AboutContactField } from "@/components/pages/AboutContactField";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { soundEngine } from "@/lib/audio";
import { LUSION_GLOBAL_CHROME } from "@/data/reference";


function SplitLetters({ text }: { text: string }) {
  return <span data-cta-word className="about-cta-word">
    {Array.from(text).map((character, index) => <span key={index} className="about-cta-letter-clip">
      <span data-cta-roll className="about-cta-letter-track">
        <span data-cta-letter className="about-cta-letter">{character}</span>
        <span className="about-cta-letter about-cta-letter-copy">{character}</span>
      </span>
    </span>)}
  </span>;
}

/** About-only CTA: copied-email/mailto behavior, coherent GPU glyph wave,
 * keyboard scroll pill and the observed two-line editorial composition. */
export function AboutContactSection() {
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
      surface="cobalt"
      webglMode="contact-beacon"
      className="relative z-10 w-full !bg-[#353DEF] py-0 text-[#ffffff]"
    >
      <div style={{ minHeight: "350vh" }} className="relative w-full bg-[#353DEF]">
        <div
          id="end-section-outer"
          className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#353DEF] px-[var(--base-padding-x)] text-white"
        >
          {/* Quadrant '+' Crosshairs matching real `lusion.co/about/` `#end-section` */}
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
                className="mx-auto max-w-[18ch] font-sans text-[clamp(0.72rem,0.85vw,0.9rem)] font-normal uppercase leading-[1.35] tracking-[0.04em] text-white/95 sm:max-w-none sm:whitespace-nowrap"
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
                className="about-cta-title block font-sans text-[17.5vw] font-normal leading-[0.95] tracking-[-0.035em] text-white sm:text-[10vw] min-[1800px]:text-[9.5rem]"
              >
                <span aria-hidden="true" className="about-cta-line">
                  <SplitLetters text="Let's" />{" "}<SplitLetters text="work" />
                  <span id="end-section-title-top-decoration" data-cta-decoration className="about-cta-decoration" />
                </span>
                <br />
                <span aria-hidden="true" className="about-cta-line">
                  <SplitLetters text="together!" />
                  <span id="end-section-title-bottom-left-decoration" data-cta-decoration className="about-cta-decoration" />
                  <span id="end-section-title-bottom-right-decoration" data-cta-decoration className="about-cta-decoration" />
                </span>
              </a>
            </div>

            {copiedNotice && (
              <p
                role="status"
                className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-[#c1ff00]"
              >
                Email address copied to clipboard
              </p>
            )}
          </div>

          {/* Screen-space instanced reference shapes, in front of the title. */}
          <div className="pointer-events-none absolute inset-0 z-20">
            <AboutContactField />
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
            <span aria-hidden="true" className="about-cta-pill-arrow text-xs leading-none text-black/80">
              <span>↓</span><span>↓</span>
            </span>
            <span
              id="end-bottom-text-container"
              className="relative h-[1.1rem] overflow-hidden whitespace-nowrap font-sans text-[0.74rem] font-medium uppercase leading-[1.1rem] tracking-[0.06em]"
            >
              <span className="about-cta-pill-label"><span>{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span><span aria-hidden="true">{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span></span>
            </span>
            <span aria-hidden="true" className="about-cta-pill-arrow text-xs leading-none text-black/80">
              <span>↓</span><span>↓</span>
            </span>
          </a>
        </div>
      </div>
    </SurfaceSection>
  );
}
