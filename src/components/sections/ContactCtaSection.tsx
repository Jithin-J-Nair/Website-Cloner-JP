"use client";

import React, { useState } from "react";
import { motion } from "framer-motion";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { soundEngine } from "@/lib/audio";
import { LUSION_GLOBAL_CHROME } from "@/data/reference";

/**
 * Shared Lusion End-Section CTA (`#end-section`)
 * Grounded in `LUSION_GLOBAL_CHROME.endSection` (`"Is Your Big Idea Ready to Go Wild?"`,
 * `"Let's work / together!"`, 5 architectural `+` crosshairs, 3 horizontal geometric
 * decoration bars, and the floating white `#end-bottom` `"CONTINUE TO SCROLL"` pill).
 */
export function ContactCtaSection({ sectionId = "end-section" }: { sectionId?: string } = {}) {
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

  return (
    <SurfaceSection
      id={sectionId}
      surface="cobalt"
      webglMode="contact-beacon"
      className="relative overflow-hidden py-0"
    >
      {/* Lusion Electric Cobalt Atmospheric Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,#2a41ff_0%,#1a2ffb_48%,#071bdf_100%)]"
      />

      <div
        id="end-section-outer"
        className="relative flex min-h-[92vh] w-full flex-col items-center justify-center px-[var(--base-padding-x)] pt-24 pb-32 text-white"
      >
        {/* 5 Architectural '+' Crosshairs (`#end-section-content-crosses`) */}
        <div
          id="end-section-content-crosses"
          aria-hidden="true"
          className="mb-14 flex w-full max-w-[60vw] items-center justify-between text-white/75 max-[560px]:max-w-full"
        >
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
        </div>

        {/* Center Editorial CTA (`#end-section-content`) */}
        <div id="end-section-content" className="relative z-10 w-full text-center">
          <div id="end-section-subtitle" className="overflow-hidden">
            <p
              id="end-section-subtitle-text"
              className="mx-auto max-w-[18rem] font-sans text-[clamp(0.875rem,1vw,1.25rem)] leading-[1.4] tracking-[0.04em] text-white/95 uppercase sm:max-w-none"
            >
              {LUSION_GLOBAL_CHROME.endSection.subtitle}
            </p>
          </div>

          <motion.div
            id="end-section-title"
            whileHover={{ scale: 1.015 }}
            transition={{ duration: 0.28, ease: [0.4, 0, 0.1, 1] }}
            className="group relative mx-auto mt-4 w-fit"
          >
            <a
              id="end-section-title-link"
              href={`mailto:${LUSION_GLOBAL_CHROME.footer.businessEmail}`}
              onClick={handleEmailTrigger}
              onMouseEnter={() => soundEngine.playHover()}
              className="block font-sans text-[18.5vw] leading-[0.98] font-normal tracking-[-0.03em] text-white sm:text-[10vw] min-[1800px]:text-[10.5rem]"
            >
              Let&apos;s work
              <br />
              together!
            </a>

            {/* Exact 3 Lusion Horizontal Rule Decorations */}
            <span
              id="end-section-title-top-decoration"
              aria-hidden="true"
              className="pointer-events-none absolute top-[48%] left-[1%] h-[0.055em] w-[98%] origin-left bg-white text-[18.5vw] transition-transform duration-300 group-hover:scale-x-105 sm:text-[10vw]"
            />
            <span
              id="end-section-title-bottom-left-decoration"
              aria-hidden="true"
              className="pointer-events-none absolute bottom-[3%] left-[5%] h-[0.055em] w-[19%] origin-left bg-white text-[18.5vw] sm:text-[10vw]"
            />
            <span
              id="end-section-title-bottom-right-decoration"
              aria-hidden="true"
              className="pointer-events-none absolute right-[4%] bottom-[3%] h-[0.055em] w-[54%] origin-left bg-white text-[18.5vw] sm:text-[10vw]"
            />
          </motion.div>

          {copiedNotice && (
            <p
              role="status"
              className="mt-5 font-mono text-xs tracking-[0.08em] text-[#c1ff00] uppercase"
            >
              {LUSION_GLOBAL_CHROME.footer.businessEmail} copied to clipboard
            </p>
          )}
        </div>

        {/* Bottom Floating White Scroll Pill (`#end-bottom`) */}
        <a
          id="end-bottom"
          href="#footer-section"
          onClick={(e) => {
            e.preventDefault();
            soundEngine.playClick();
            document.getElementById("footer-section")?.scrollIntoView({ behavior: "smooth" });
          }}
          className="mt-16 inline-flex h-[3.25rem] items-center justify-center gap-3.5 rounded-full bg-white px-7 !text-black shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-transform duration-300 hover:scale-[1.03]"
        >
          <span aria-hidden="true" className="text-xs leading-none text-black/75">
            ↓
          </span>
          <span
            id="end-bottom-text-container"
            className="relative h-[1.15rem] overflow-hidden font-sans text-[0.78rem] leading-[1.15rem] font-medium tracking-[0.06em] uppercase"
          >
            <span className="lusion-ticker-line block">
              <span className="block">{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span>
              <span className="block" aria-hidden="true">
                {LUSION_GLOBAL_CHROME.endSection.bottomTickerText}
              </span>
            </span>
          </span>
          <span aria-hidden="true" className="text-xs leading-none text-black/75">
            ↓
          </span>
        </a>
      </div>
    </SurfaceSection>
  );
}
