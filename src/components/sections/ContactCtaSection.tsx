"use client";

import React, { useState } from "react";
import { CinematicContactField } from "@/components/sections/CinematicContactField";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { soundEngine } from "@/lib/audio";
import { LUSION_GLOBAL_CHROME } from "@/data/reference";

export type ContactCtaTheme = "blue-flip" | "home-dark";

/**
 * Shared Lusion End-Section CTA (`#end-section`)
 * - `theme="blue-flip"`: Royal-blue `#1736ff` full-bleed sticky stage with 4 quadrant `+` crosshairs,
 *   `"IS YOUR BIG IDEA READY TO GO WILD?"`, `"Let's work together!"`, original GPU-instanced geometric
 *   shape heap, and floating white `"CONTINUE TO SCROLL"` pill (`about-05-end-cta-flip`).
 * - `theme="home-dark"`: Pure `#000000` space backdrop immediately after `#home-goal`, hosting the
 *   standing 3D EVA astronaut, diamonds & pop-art stickers (`home-10-end-cta-wait`) followed by the CTA.
 */
export function ContactCtaSection({
  sectionId = "end-section",
  theme = "blue-flip",
}: {
  sectionId?: string;
  theme?: ContactCtaTheme;
} = {}) {
  const [copiedNotice, setCopiedNotice] = useState(false);

  const handleEmailTrigger = () => {
    soundEngine.playClick();
    try {
      navigator.clipboard?.writeText(LUSION_GLOBAL_CHROME.footer.businessEmail);
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 2600);
    } catch {
      // Clipboard optional
    }
  };

  if (theme === "home-dark") {
    return (
      <SurfaceSection
        id={sectionId}
        surface="void"
        webglMode="contact-beacon"
        className="relative z-[20] w-full !bg-transparent py-0 text-[#ffffff]"
      >
        <style>{`
          .home-end-cta-shell {
            min-height: 248vh;
          }
          .home-end-cta-pad {
            padding-top: 124vh;
            padding-bottom: 28vh;
          }
          #home-goal[data-static-fallback="true"] + #end-section { background: #000 !important; }
          #home-goal[data-static-fallback="true"] + #end-section .home-end-cta-shell { min-height: 100vh; padding-top: 10vh; }
          #home-goal[data-static-fallback="true"] + #end-section .home-end-cta-pad { padding-top: 16vh; padding-bottom: 16vh; }
          @media (max-width: 819px) {
            .home-end-cta-shell {
              min-height: 218vh;
            }
            .home-end-cta-pad {
              padding-top: 108vh;
              padding-bottom: 24vh;
            }
          }
        `}</style>

        <div className="home-end-cta-shell relative flex w-full flex-col justify-between bg-transparent pt-[26vh]">
          <div
            id="end-section-outer"
            className="home-end-cta-pad relative mx-auto flex w-full flex-col items-center justify-center px-[var(--base-padding-x)]"
          >
            {/* Symmetric Quadrant + Center Registration Crosshairs matching Reference Frames 19 & 20 */}
            <div
              id="end-section-content-crosses"
              aria-hidden="true"
              className="pointer-events-none relative mx-auto mb-10 flex w-full items-center justify-between px-[1vw] text-white/90"
            >
              <span className="lusion-plus-cross" />
              <span className="lusion-plus-cross" />
            </div>

            <div id="end-section-content" className="relative z-20 w-full text-center">
              <div id="end-section-subtitle" className="overflow-hidden">
                <p
                  id="end-section-subtitle-text"
                  className="mx-auto max-w-[26ch] font-sans text-[clamp(0.84rem,1.06vw,1.08rem)] font-normal uppercase leading-[1.35] tracking-[0.04em] text-white sm:max-w-none sm:whitespace-nowrap"
                >
                  {LUSION_GLOBAL_CHROME.endSection.subtitle}
                </p>
              </div>

              <div id="end-section-title" className="group relative mx-auto mt-5 w-fit">
                <a
                  id="end-section-title-link"
                  href={`mailto:${LUSION_GLOBAL_CHROME.footer.businessEmail}`}
                  onClick={handleEmailTrigger}
                  onMouseEnter={() => soundEngine.playHover()}
                  className="block font-sans text-[17.2vw] font-normal leading-[0.98] tracking-[-0.03em] text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.45)] sm:text-[8.2vw] min-[1800px]:text-[9.5rem]"
                >
                  Let&apos;s work
                  <br />
                  together!
                </a>
                <span id="end-section-title-top-decoration" aria-hidden="true" className="sr-only" />
                <span id="end-section-title-bottom-left-decoration" aria-hidden="true" className="sr-only" />
                <span id="end-section-title-bottom-right-decoration" aria-hidden="true" className="sr-only" />
              </div>

              {copiedNotice && (
                <p
                  role="status"
                  className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-[#c1ff00]"
                >
                  {LUSION_GLOBAL_CHROME.footer.businessEmail} copied to clipboard
                </p>
              )}

              {/* Lower Quadrant + Center Registration Crosshairs (`Frames 19 & 20`) */}
              <div
                aria-hidden="true"
                className="pointer-events-none mx-auto mt-16 flex w-full items-center justify-between px-[1vw] text-white/90"
              >
                <span className="lusion-plus-cross" />
                <span className="lusion-plus-cross" />
                <span className="lusion-plus-cross" />
              </div>
            </div>
          </div>

          {/* Sticky Bottom White Pill (`#end-bottom` — visible throughout `#end-section` wait & CTA, stops cleanly before `#footer-section`) */}
          <div className="pointer-events-none sticky bottom-7 z-30 flex w-full justify-center pb-8">
            <a
              id="end-bottom"
              href="#footer-section"
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playClick();
                document.getElementById("footer-section")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
              }}
              className="pointer-events-auto inline-flex h-[3.1rem] min-w-[238px] items-center justify-between gap-4 rounded-full bg-white px-6 !text-black shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:scale-[1.03]"
            >
              <span aria-hidden="true" className="text-xs leading-none text-black/80">
                ↓
              </span>
              <span
                id="end-bottom-text-container"
                className="relative h-[1.1rem] overflow-hidden whitespace-nowrap font-sans text-[0.74rem] font-medium uppercase leading-[1.1rem] tracking-[0.06em]"
              >
                <span className="lusion-ticker-line block">
                  <span className="block">{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span>
                  <span className="block" aria-hidden="true">
                    {LUSION_GLOBAL_CHROME.endSection.bottomTickerText}
                  </span>
                </span>
              </span>
              <span aria-hidden="true" className="text-xs leading-none text-black/80">
                ↓
              </span>
            </a>
          </div>
        </div>
      </SurfaceSection>
    );
  }

  return (
    <SurfaceSection
      id={sectionId}
      surface="cobalt"
      webglMode="contact-beacon"
      className="relative z-10 w-full !bg-[#1736ff] py-0 text-[#ffffff]"
    >
      <div style={{ minHeight: "180vh" }} className="relative w-full bg-[#1736ff]">
        <div
          id="end-section-outer"
          className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#1736ff] px-[var(--base-padding-x)] text-white"
        >
          {/* Quadrant '+' Crosshairs matching real `lusion.co/about/` `#end-section` */}
          <div
            id="end-section-content-crosses"
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[6.8%] top-[27%] bottom-[24%] z-20"
          >
            <span className="lusion-plus-cross absolute left-0 top-0 text-white" />
            <span className="lusion-plus-cross absolute right-0 top-0 text-white" />
            <span className="lusion-plus-cross absolute left-0 bottom-0 text-white" />
            <span className="lusion-plus-cross absolute right-0 bottom-0 text-white" />
          </div>

          {/* Center Editorial CTA (`#end-section-content`) */}
          <div id="end-section-content" className="relative z-10 -mt-[10vh] w-full text-center">
            <div id="end-section-subtitle" className="overflow-hidden">
              <p
                id="end-section-subtitle-text"
                className="mx-auto max-w-[18ch] font-sans text-[clamp(0.75rem,0.98vw,0.95rem)] font-normal uppercase leading-[1.35] tracking-[0.04em] text-white/95"
              >
                {LUSION_GLOBAL_CHROME.endSection.subtitle}
              </p>
            </div>

            <div id="end-section-title" className="group relative mx-auto mt-4 w-fit">
              <a
                id="end-section-title-link"
                href={`mailto:${LUSION_GLOBAL_CHROME.footer.businessEmail}`}
                onClick={handleEmailTrigger}
                onMouseEnter={() => soundEngine.playHover()}
                className="block font-sans text-[17.5vw] font-normal leading-[0.98] tracking-[-0.03em] text-white sm:text-[8.6vw] min-[1800px]:text-[9.5rem]"
              >
                Let&apos;s work
                <br />
                together!
              </a>
              <span id="end-section-title-top-decoration" aria-hidden="true" className="sr-only" />
              <span id="end-section-title-bottom-left-decoration" aria-hidden="true" className="sr-only" />
              <span id="end-section-title-bottom-right-decoration" aria-hidden="true" className="sr-only" />
            </div>

            {copiedNotice && (
              <p
                role="status"
                className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-[#c1ff00]"
              >
                {LUSION_GLOBAL_CHROME.footer.businessEmail} copied to clipboard
              </p>
            )}
          </div>

          {/* Depth-lit GPU geometric stream/mound; intentional lower-title overlap */}
          <div className="pointer-events-none absolute inset-0 z-20">
            <CinematicContactField />
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
            className="pointer-events-auto absolute bottom-7 left-1/2 z-30 inline-flex h-[3.1rem] min-w-[238px] -translate-x-1/2 items-center justify-between gap-4 rounded-full bg-white px-6 !text-black shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:scale-[1.03]"
          >
            <span aria-hidden="true" className="text-xs leading-none text-black/80">
              ↓
            </span>
            <span
              id="end-bottom-text-container"
              className="relative h-[1.1rem] overflow-hidden whitespace-nowrap font-sans text-[0.74rem] font-medium uppercase leading-[1.1rem] tracking-[0.06em]"
            >
              <span className="block">{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span>
            </span>
            <span aria-hidden="true" className="text-xs leading-none text-black/80">
              ↓
            </span>
          </a>
        </div>
      </div>
    </SurfaceSection>
  );
}
