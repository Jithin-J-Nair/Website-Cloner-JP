"use client";

import React, { useEffect, useRef, useState } from "react";
import { AboutContactField } from "@/components/pages/AboutContactField";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { soundEngine } from "@/lib/audio";
import { LUSION_GLOBAL_CHROME } from "@/data/reference";


function SplitLetters({ text }: { text: string }) {
  return (
    <span aria-hidden="true">
      {Array.from(text).map((character, index) =>
        character === " " ? " " : (
          <span key={index} data-cta-letter className="about-cta-letter inline-block">
            {character}
          </span>
        )
      )}
    </span>
  );
}

/** About-only CTA: copied-email/mailto behavior, coherent GPU glyph wave,
 * keyboard scroll pill and the observed two-line editorial composition. */
export function AboutContactSection() {
  const [copiedNotice, setCopiedNotice] = useState(false);
  const copyTimerRef = useRef<number | null>(null);
  const titleRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => {
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
  }, []);

  useEffect(() => {
    const root = titleRef.current;
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!root || media.matches) return;

    const letters = Array.from(root.querySelectorAll<HTMLElement>("[data-cta-letter]"));
    if (!letters.length) return;
    let visible = false;
    let disposed = false;
    let timer = 0;
    const activeAnimations = new Set<Animation>();
    const stop = () => {
      if (timer) window.clearTimeout(timer);
      timer = 0;
      activeAnimations.forEach(animation => animation.cancel());
      activeAnimations.clear();
    };
    const schedule = () => {
      if (disposed || !visible || document.hidden || media.matches || timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        if (!visible || document.hidden || media.matches) return schedule();
        for (let n = 0; n < 2; n++) {
          const element = letters[Math.floor(Math.random() * letters.length)];
          const dy = (Math.random() < .5 ? -1 : 1) * (.14 + Math.random() * .16);
          const animation = element.animate(
            [{ transform: "translateY(0)" }, { transform: `translateY(${dy}em)`, offset: .35 }, { transform: "translateY(0)" }],
            { duration: 720, easing: "cubic-bezier(.22,.9,.3,1)" }
          );
          activeAnimations.add(animation);
          animation.onfinish = () => activeAnimations.delete(animation);
          animation.oncancel = () => activeAnimations.delete(animation);
        }
        schedule();
      }, 900 + Math.random() * 1800);
    };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) schedule();
      else stop();
    }, { threshold: .3 });
    const onVisibility = () => {
      if (document.hidden) stop();
      else schedule();
    };
    const onMotionChange = () => {
      if (media.matches) stop();
      else schedule();
    };
    observer.observe(root);
    document.addEventListener("visibilitychange", onVisibility);
    media.addEventListener("change", onMotionChange);
    return () => {
      disposed = true;
      stop();
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      media.removeEventListener("change", onMotionChange);
    };
  }, []);

  const handleEmailTrigger = async () => {
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
      <div style={{ minHeight: "180vh" }} className="relative w-full bg-[#353DEF]">
        <div
          id="end-section-outer"
          className="sticky top-0 flex h-[100svh] w-full flex-col items-center justify-center overflow-hidden bg-[#353DEF] px-[var(--base-padding-x)] text-white"
        >
          {/* Quadrant '+' Crosshairs matching real `lusion.co/about/` `#end-section` */}
          <div
            id="end-section-content-crosses"
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[20.6%] top-[21vh] bottom-[23.1vh] z-20"
          >
            <span className="lusion-plus-cross absolute left-0 top-0 text-white" />
            <span className="lusion-plus-cross absolute right-0 top-0 text-white" />
            <span className="lusion-plus-cross absolute left-0 bottom-0 text-white" />
            <span className="lusion-plus-cross absolute right-0 bottom-0 text-white" />
          </div>

          {/* Center Editorial CTA (`#end-section-content`) */}
          <div id="end-section-content" className="absolute inset-x-0 top-[20.5vh] z-10 w-full text-center">
            <div id="end-section-subtitle" className="overflow-hidden">
              <p
                id="end-section-subtitle-text"
                className="mx-auto max-w-[18ch] font-sans text-[clamp(0.72rem,0.85vw,0.9rem)] font-normal uppercase leading-[1.35] tracking-[0.04em] text-white/95 sm:max-w-none sm:whitespace-nowrap"
              >
                {LUSION_GLOBAL_CHROME.endSection.subtitle}
              </p>
            </div>

            <div id="end-section-title" ref={titleRef} className="group relative mx-auto mt-[5.1vh] w-fit">
              <a
                id="end-section-title-link"
                href={`mailto:${LUSION_GLOBAL_CHROME.footer.businessEmail}`}
                onClick={handleEmailTrigger}
                onMouseEnter={() => soundEngine.playHover()}
                aria-label="Let's work together!"
                className="about-cta-title block font-sans text-[17.5vw] font-normal leading-[0.95] tracking-[-0.035em] text-white sm:text-[10vw] min-[1800px]:text-[9.5rem]"
              >
                <SplitLetters text="Let's work" />
                <br />
                <SplitLetters text="together!" />
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

          {/* Depth-lit GPU geometric glyph wave; intentional lower-title overlap */}
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
