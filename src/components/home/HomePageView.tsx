"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HeroCrossesStage } from "@/components/home/HeroCrossesStage";
import { FeaturedProjectCard } from "@/components/home/FeaturedProjectCard";
import { GoalTunnelSection } from "@/components/home/GoalTunnelSection";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { ProceduralReelStream } from "@/components/studio/ProceduralReelStream";
import { LUSION_HOME } from "@/data/reference";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";

function LusionExpandingCta({
  id,
  dotId,
  textId,
  arrowId,
  href,
  label,
  className = "",
}: {
  id: string;
  dotId: string;
  textId: string;
  arrowId: string;
  href: string;
  label: string;
  className?: string;
}) {
  return (
    <TransitionLink
      id={id}
      href={href}
      transitionLabel={label}
      onMouseEnter={() => soundEngine.playHover()}
      className={`group relative inline-flex h-[3.375em] w-fit cursor-pointer items-center gap-[1em] overflow-hidden rounded-[5.3125em] bg-[#ffffff] py-[1em] pr-[1.65em] pl-[1.625em] font-sans text-[clamp(0.875rem,1vw,1.2rem)] font-medium text-[#000000] uppercase shadow-[0_6px_14px_rgba(0,0,0,0.05),0_2px_4px_rgba(0,0,0,0.04)] transition-colors duration-300 hover:bg-[#1a2ffb] hover:text-[#ffffff] focus-visible:outline-2 focus-visible:outline-[#1a2ffb] ${className}`}
    >
      <span
        id={dotId}
        aria-hidden="true"
        className="relative z-10 inline-block h-[0.5em] w-[0.5em] rounded-full bg-[#000000] transition-all duration-500 ease-[cubic-bezier(0.35,0,0,1)] group-hover:translate-x-[3.2em] group-hover:scale-[26] group-hover:bg-[#1a2ffb]"
      />
      <span
        id={textId}
        className="relative z-10 transition-transform duration-400 ease-[cubic-bezier(0.35,0,0,1)] group-hover:-translate-x-[1.15em]"
      >
        {label}
      </span>
      <span
        id={arrowId}
        aria-hidden="true"
        className="absolute right-[1.1em] z-10 flex h-[1.2em] w-[1.2em] translate-x-[2.8em] items-center justify-center text-[#ffffff] transition-transform duration-400 ease-[cubic-bezier(0.4,0,0,1)] group-hover:translate-x-0"
      >
        <svg viewBox="0 0 24 24" fill="none" className="h-full w-full">
          <path
            d="M3 12H20M20 12L13.5 5.5M20 12L13.5 18.5"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </TransitionLink>
  );
}

/**
 * Verified Lusion Homepage (`/`)
 *
 * Strictly implements the canonical 7-band reference hierarchy from `LUSION_HOME`:
 *   1. `#home-hero` (headline + dark rounded 3D hollow cross physics stage + scroll crosshair bar)
 *   2. `#home-reel` (`Bold Ideas, / Brought to Life`, copy + `Our Approach` CTA + scroll-driven showreel stage)
 *   3. `#home-featured` (`Featured Work`, disclaimer, 12 verified client & self-initiated projects -> `/projects/<slug>`, `See all projects` CTA)
 *   4. `#home-goal` (`Where Creative Ideas Become Immersive Experiences` + two-stage dark/white image tunnel)
 *   5. `#end-section` (`Is Your Big Idea Ready to Go Wild? / Let's work together!` + `CONTINUE TO SCROLL`)
 *   6. `#footer-section` + 7. `#scroll-nav-section` (`About Us` portal)
 */
export function HomePageView() {
  const setReelOpen = useStudioStore((s) => s.setReelOpen);
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  const [isMobileReel, setIsMobileReel] = useState(false);
  const [reelVideoFailed, setReelVideoFailed] = useState(false);
  // Enable real self-hosted showreel `.mp4` stream from `media-bundle/` by default,
  // preserving `<ProceduralReelStream />` strictly as an automatic `onError` fallback.
  const reelVideoAvailable = !reelVideoFailed;

  const heroSectionRef = useRef<HTMLElement>(null);
  const reelSectionRef = useRef<HTMLElement>(null);
  const reelContainerRef = useRef<HTMLDivElement>(null);
  const reelVideoStageRef = useRef<HTMLDivElement>(null);
  const reelThumbCardRef = useRef<HTMLDivElement>(null);
  const reelTitleLine1Ref = useRef<HTMLSpanElement>(null);
  const reelOverlayTitleRef = useRef<HTMLDivElement>(null);
  const reelWordRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const reelWords = React.useMemo(() => LUSION_HOME.reel.description.split(" "), []);

  useEffect(() => {
    setActiveSurface("ice");
    const syncVp = () => setIsMobileReel(window.innerWidth <= 812);
    syncVp();
    window.addEventListener("resize", syncVp, { passive: true });
    return () => window.removeEventListener("resize", syncVp);
  }, [setActiveSurface]);

  // Keep surface crisp off-white (`ice`) whenever upper homepage bands are in view
  useEffect(() => {
    const el = heroSectionRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setActiveSurface("ice");
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [setActiveSurface]);

  // Direct zero-rerender DOM scroll scrubbing for `#home-reel`:
  // - Zero React `setState` during scroll (0 re-renders across the entire homepage tree!)
  // - Scrubs `Bold    Ideas,` dynamic word spacing (`ref-02-reel-intro`)
  // - Scrubs progressive word contrast (`#8d92a4` -> `#000000`) across `#home-reel-desc`
  // - Scrubs `#home-reel-thumb` crossfade & `#home-reel-video-container` expansion
  useEffect(() => {
    let rafId = 0;

    const applyReelScrub = () => {
      rafId = 0;
      const vh = Math.max(1, window.innerHeight);

      if (reducedMotion) {
        if (reelVideoStageRef.current) reelVideoStageRef.current.style.transform = "scale(1)";
        if (reelThumbCardRef.current) reelThumbCardRef.current.style.opacity = "1";
        if (reelTitleLine1Ref.current) reelTitleLine1Ref.current.style.wordSpacing = "0.52em";
        for (const wEl of reelWordRefs.current) {
          if (wEl) wEl.style.opacity = "1";
        }
        return;
      }

      const secEl = reelSectionRef.current;
      if (secEl) {
        const sRect = secEl.getBoundingClientRect();
        // Progress across editorial intro band (0 when entering viewport -> 1 when copy sits at upper third)
        const introProg = Math.max(0, Math.min(1, (vh * 0.72 - sRect.top) / (vh * 0.62)));
        if (reelTitleLine1Ref.current) {
          const gapEm = 0.72 - 0.34 * introProg;
          reelTitleLine1Ref.current.style.wordSpacing = `${gapEm.toFixed(3)}em`;
        }
        const totalW = reelWordRefs.current.length;
        for (let i = 0; i < totalW; i++) {
          const wEl = reelWordRefs.current[i];
          if (!wEl) continue;
          const threshold = (i / Math.max(1, totalW - 1)) * 0.86;
          const lit = Math.max(0.38, Math.min(1, (introProg - threshold + 0.24) / 0.24));
          wEl.style.opacity = lit.toFixed(3);
        }
      }

      const el = reelContainerRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const raw = (vh - rect.top) / (vh * 0.85);
        const t = Math.max(0, Math.min(1, raw));
        const scale = 0.86 + 0.14 * t;
        if (reelVideoStageRef.current) {
          reelVideoStageRef.current.style.transform = `scale(${scale.toFixed(4)})`;
        }
        if (reelOverlayTitleRef.current) {
          reelOverlayTitleRef.current.style.gap = `${(1.95 + 0.55 * t).toFixed(2)}em`;
        }
        if (reelThumbCardRef.current) {
          const thumbOp = Math.max(0.15, 1 - t * 0.75);
          reelThumbCardRef.current.style.opacity = thumbOp.toFixed(3);
        }
      }
    };

    const onScrollOrResize = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(applyReelScrub);
      }
    };

    applyReelScrub();
    window.addEventListener("scroll", onScrollOrResize, { passive: true });
    window.addEventListener("resize", onScrollOrResize, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScrollOrResize);
      window.removeEventListener("resize", onScrollOrResize);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  const heroWords = LUSION_HOME.hero.headline.split(" ");
  const reelLoopSrc = isMobileReel
    ? LUSION_HOME.reel.mobileLoopVideo
    : LUSION_HOME.reel.desktopLoopVideo;

  const handleOpenReel = () => {
    soundEngine.playClick();
    setReelOpen(true, {
      title: "Lusion Showreel",
      desktopSrc: LUSION_HOME.reel.desktopLoopVideo,
      mobileSrc: LUSION_HOME.reel.mobileLoopVideo,
    });
  };

  return (
    <main id="home" className="relative overflow-x-clip bg-[#f0f1fa] text-[#000000]">
      {/* =====================================================================
          1. HERO SECTION (`#home-hero`)
         ===================================================================== */}
      <section
        id="home-hero"
        ref={heroSectionRef}
        className="section relative grid h-[calc(var(--vh,1vh)*100)] min-h-[580px] grid-cols-6 grid-rows-[auto_1fr] px-[var(--base-padding-x)] pt-[calc(var(--base-padding-y)+2.9rem)] pb-[calc(var(--base-padding-y)*1.25)] min-[813px]:grid-cols-12 min-[813px]:pt-[calc(var(--vh,1vh)*8.8)] min-[813px]:pb-[var(--base-padding-y)]"
      >
        {/* Reference Headline (`#home-hero-title`: cols 4..8 desktop, cols 1..6 mobile) */}
        <h1
          id="home-hero-title"
          className="relative col-span-6 m-0 h-fit font-sans text-[5.9vw] leading-[1.09] font-normal tracking-[-0.02em] text-[#000000] max-[380px]:text-[6.8vw] min-[813px]:col-start-4 min-[813px]:col-span-5 min-[813px]:text-[2.25vw]"
        >
          {heroWords.map((word, idx) => (
            <React.Fragment key={idx}>
              <motion.span
                initial={reducedMotion ? false : { y: "115%", rotate: 7, opacity: 0 }}
                animate={{ y: "0%", rotate: 0, opacity: 1 }}
                transition={{
                  duration: 0.62,
                  delay: Math.min(0.45, idx * 0.024),
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="inline-block will-change-transform"
              >
                {word}
              </motion.span>
              {idx < heroWords.length - 1 ? " " : ""}
            </React.Fragment>
          ))}
        </h1>

        {/* Dark Rounded 3D Hollow Cross Stage (`#home-hero-visual-container`) */}
        <div className="col-span-6 mt-[calc(var(--base-padding-y)*0.55)] mb-[calc(var(--base-padding-y)*0.75)] min-h-0 min-[813px]:col-span-12 min-[813px]:mt-[calc(var(--base-padding-y)*0.6)] min-[813px]:mb-[calc(var(--base-padding-y)*0.55)]">
          <HeroCrossesStage />
        </div>

        {/* Bottom Crosshair + `SCROLL TO EXPLORE` Bar (`#home-hero-scroll-container`) */}
        <div
          id="home-hero-scroll-container"
          className="pointer-events-none absolute right-[var(--base-padding-x)] bottom-[calc(var(--base-padding-y)*0.32)] left-[var(--base-padding-x)] flex h-[var(--base-padding-y)] items-center justify-between"
        >
          <div
            id="home-hero-scroll-container-crosses"
            aria-hidden="true"
            className="flex w-full items-center justify-between text-black"
          >
            <span className="home-hero-scroll-container-cross lusion-plus-cross" />
            <span className="home-hero-scroll-container-cross lusion-plus-cross max-[812px]:hidden" />
            <span className="home-hero-scroll-container-cross lusion-plus-cross max-[812px]:hidden" />
            <span className="home-hero-scroll-container-cross lusion-plus-cross" />
          </div>
          <div
            id="home-hero-scroll"
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 font-sans text-[11px] font-medium tracking-[0.06em] whitespace-nowrap text-[#000000] uppercase"
          >
            {LUSION_HOME.hero.scrollPrompt}
          </div>
        </div>
      </section>

      {/* =====================================================================
          2. SHOWREEL SECTION (`#home-reel`)
         ===================================================================== */}
      <section
        id="home-reel"
        ref={reelSectionRef}
        className="section relative grid grid-cols-6 gap-x-[var(--grid-gap)] overflow-hidden px-[var(--base-padding-x)] pt-14 pb-20 text-[clamp(0.875rem,1vw,2rem)] min-[813px]:grid-cols-12 min-[813px]:pt-36 min-[813px]:pb-32"
      >
        {/* Bold 3D Cobalt Ribbon Arc (`line_reel`) entering left edge behind `"Bold / Brought"` into `#home-reel-thumb` */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 900"
          fill="none"
          className="pointer-events-none absolute top-0 left-0 z-0 h-[760px] w-full max-[812px]:hidden"
        >
          <path
            d="M -28 86 C 128 142, 238 308, 256 548"
            stroke="#162cf7"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M -28 84 C 128 140, 238 306, 256 546"
            stroke="#6a82ff"
            strokeOpacity="0.42"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>

        {/* Mobile Upper-Left Cobalt Ribbon Arc matching `ref-02-reel-intro--390x844.png` */}
        <svg
          aria-hidden="true"
          viewBox="0 0 390 420"
          fill="none"
          className="pointer-events-none absolute top-8 left-0 z-0 w-full min-[813px]:hidden"
        >
          <path
            d="M -18 56 C 48 78, 96 132, 118 205"
            stroke="#1a2ffb"
            strokeWidth="18"
            strokeLinecap="round"
          />
        </svg>

        {/* Display Eyebrow Heading (`#home-reel-title`) */}
        <h2
          id="home-reel-title"
          className="relative z-10 col-span-6 mt-[0.1em] mb-[0.52em] -ml-[0.03em] font-sans text-[17.6vw] leading-[1.03] font-normal tracking-[-0.025em] text-[#000000] min-[813px]:col-span-12 min-[813px]:mt-[0.18em] min-[813px]:mb-[0.42em] min-[813px]:text-[10vw] min-[813px]:leading-[0.98]"
        >
          <span id="home-reel-title-inner" className="inline-block">
            <span
              id="home-reel-title-line-1"
              ref={reelTitleLine1Ref}
              style={{ wordSpacing: "0.52em" }}
              className="block max-[812px]:max-w-[5.1ch] min-[813px]:pl-[calc(var(--grid-space)*2+var(--grid-gap)*2)]"
            >
              {LUSION_HOME.reel.eyebrowLine1}
            </span>
            <span id="home-reel-title-line-2" className="block max-[812px]:max-w-[8.8ch]">
              {LUSION_HOME.reel.eyebrowLine2}
            </span>
          </span>
        </h2>

        {/* Left 5-col Cobalt-Duotone Reel Preview Card (`#home-reel-thumb-wrapper`) */}
        <div
          id="home-reel-thumb-wrapper"
          className="relative z-10 col-span-5 flex items-end pb-14 max-[812px]:hidden"
        >
          <div
            id="home-reel-thumb"
            ref={reelThumbCardRef}
            onClick={handleOpenReel}
            className="group relative aspect-[16/10] w-full max-w-[440px] cursor-pointer overflow-hidden rounded-[18px] bg-[#142df9] shadow-[0_22px_52px_rgba(22,44,247,0.28)]"
          >
            {reelVideoAvailable ? (
              <video
                src={reelLoopSrc}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-hidden="true"
                onError={() => setReelVideoFailed(true)}
                className="h-full w-full object-cover mix-blend-luminosity opacity-85 transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <ProceduralReelStream variant="thumb" />
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-[#0b20eb]/38 mix-blend-multiply"
            />
          </div>
        </div>

        {/* Right 6-col Editorial Statement + `Our Approach` CTA (`#home-reel-content`) */}
        <div
          id="home-reel-content"
          className="relative z-10 col-span-6 h-fit leading-[1.42] min-[813px]:col-start-7 min-[813px]:col-span-6"
        >
          <p
            id="home-reel-desc"
            className="m-0 font-sans text-[clamp(1.05rem,1.5vw,2.15rem)] font-normal text-[#000000]"
          >
            {reelWords.map((word, wIdx) => (
              <React.Fragment key={wIdx}>
                <span
                  ref={(el) => {
                    reelWordRefs.current[wIdx] = el;
                  }}
                  className="inline-block transition-opacity duration-150"
                >
                  {word}
                </span>
                {wIdx < reelWords.length - 1 ? " " : ""}
              </React.Fragment>
            ))}
          </p>

          <div className="mt-10 mb-14 min-[813px]:mt-12 min-[813px]:mb-20">
            <LusionExpandingCta
              id="home-reel-cta"
              dotId="home-reel-cta-dot"
              textId="home-reel-cta-text"
              arrowId="home-reel-cta-arrow"
              href={LUSION_HOME.reel.ctaHref}
              label={LUSION_HOME.reel.ctaLabel}
            />
          </div>
        </div>

        {/* Scroll-Driven Showreel Stage (`#home-reel-container` -> `#home-reel-video-container`) */}
        <div
          id="home-reel-container"
          ref={reelContainerRef}
          className="relative z-10 col-span-6 mt-6 min-[813px]:col-span-12 min-[813px]:mt-20 min-[813px]:px-4 min-[813px]:pt-24"
        >
          <div id="home-reel-container-inner" className="relative w-full">
            <div
              id="home-reel-video-container"
              ref={reelVideoStageRef}
              style={{ transform: "scale(0.86)" }}
              className="relative w-full origin-center will-change-transform"
            >
              {/* Top `▶▶▶ PLAY REEL` Ticker on Mobile (`ref-03-reel-stage--390x844.png`) */}
              <div
                id="home-reel-video-container-decoration"
                aria-hidden="true"
                className="pointer-events-none mb-2.5 flex w-full items-center justify-between text-black min-[813px]:hidden"
              >
                <div className="flex w-full items-center justify-between overflow-hidden py-1 font-sans text-[13px] font-medium tracking-[0.04em] text-[#000000] uppercase">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="tracking-[-0.1em]">&#9658;&#9658;&#9658;</span>
                    <span>PLAY REEL</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="tracking-[-0.1em]">&#9658;&#9658;&#9658;</span>
                    <span>PLAY REEL</span>
                  </span>
                </div>
              </div>

              {/* Rounded Interactive Reel Viewport (`aspect-[1.85/1]` desktop matching `ref-03-reel-stage`) */}
              <div
                onClick={handleOpenReel}
                className="group relative aspect-[3/4] w-full cursor-pointer overflow-hidden rounded-[var(--global-border-radius)] bg-[#0b0d14] shadow-[0_24px_64px_rgba(12,18,42,0.18)] min-[813px]:aspect-[1.85/1]"
              >
                {reelVideoAvailable ? (
                  <video
                    id="home-reel-video"
                    key={reelLoopSrc}
                    src={reelLoopSrc}
                    autoPlay
                    muted
                    loop
                    playsInline
                    preload="auto"
                    onError={() => setReelVideoFailed(true)}
                    className="h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]"
                  />
                ) : (
                  <ProceduralReelStream variant="stage" />
                )}

                {/* Monumental Split `PLAY REEL` Display Overlay (`ref-03-reel-stage--1440x900.png`) */}
                <div
                  id="home-reel-video-placeholder"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center"
                >
                  <div
                    id="home-reel-video-title"
                    ref={reelOverlayTitleRef}
                    style={{ gap: "2.25em" }}
                    className="flex items-center font-sans text-[clamp(3.2rem,7.5vw,6.9rem)] leading-none font-normal tracking-[-0.015em] text-white uppercase drop-shadow-[0_2px_18px_rgba(20,32,68,0.16)] select-none max-[812px]:hidden"
                  >
                    <span>Play</span>
                    <span>Reel</span>
                  </div>
                </div>

                {/* Mobile Vertical Center Guide Ticks (`ref-03-reel-stage--390x844.png`) */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute top-1/2 left-1/2 h-28 w-[2px] -translate-x-1/2 -translate-y-1/2 bg-white/95 min-[813px]:hidden"
                />

                {/* Centered Pill Play Button (`#home-reel-video-watch-btn`) */}
                <button
                  type="button"
                  id="home-reel-video-watch-btn"
                  aria-label="Play Showreel"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenReel();
                  }}
                  className="group/btn absolute top-1/2 left-1/2 z-10 flex h-[4.6rem] w-[7.4rem] -translate-x-1/2 -translate-y-1/2 cursor-pointer items-center justify-center overflow-hidden rounded-full shadow-[0_12px_32px_rgba(12,20,48,0.18)] focus-visible:outline-2 focus-visible:outline-white md:h-[5.5rem] md:w-[8.8rem]"
                >
                  <span
                    id="home-reel-video-watch-btn-base"
                    aria-hidden="true"
                    className="absolute inset-0 rounded-full bg-white transition-colors duration-300 group-hover/btn:bg-[#1a2ffb]"
                  />
                  <span
                    id="home-reel-video-watch-btn-background"
                    aria-hidden="true"
                    className="absolute inset-0 origin-bottom scale-y-0 bg-[#1a2ffb] transition-transform duration-400 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover/btn:scale-y-100"
                  />
                  <svg
                    id="home-reel-video-watch-btn-svg"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    aria-hidden="true"
                    className="relative z-10 ml-0.5 h-6 w-6 text-black transition-colors duration-300 group-hover/btn:text-white md:h-7 md:w-7"
                  >
                    <path d="M8 5.2v13.6L19.2 12 8 5.2z" />
                  </svg>
                </button>
              </div>

              <div
                id="home-reel-video-container-bottom"
                aria-hidden="true"
                className="pointer-events-none mt-2.5 flex w-full items-center justify-between text-black min-[813px]:hidden"
              >
                <div className="flex w-full items-center justify-between overflow-hidden py-1 font-sans text-[13px] font-medium tracking-[0.04em] text-[#000000] uppercase">
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="tracking-[-0.1em]">&#9658;&#9658;&#9658;</span>
                    <span>PLAY REEL</span>
                  </span>
                  <span className="inline-flex items-center gap-2">
                    <span aria-hidden="true" className="tracking-[-0.1em]">&#9658;&#9658;&#9658;</span>
                    <span>PLAY REEL</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================================
          3. FEATURED WORK SECTION (`#home-featured` — 12 Verified Projects)
         ===================================================================== */}
      <section
        id="home-featured"
        className="section relative grid grid-cols-6 gap-x-[var(--grid-gap)] px-[var(--base-padding-x)] pt-12 pb-16 min-[813px]:grid-cols-12 min-[813px]:pt-20 min-[813px]:pb-28"
      >
        {/* Header Band (`#home-featured-title-top`) */}
        <div id="home-featured-title-top" className="relative col-span-6 min-[813px]:col-span-12">
          <div
            id="home-featured-title-wrapper"
            className="relative w-fit font-sans text-[15vw] tracking-[-0.02em] min-[813px]:text-[8vw]"
          >
            <h2
              id="home-featured-title"
              className="m-0 -ml-[0.06em] inline-block pt-[0.2em] leading-[0.92] font-normal text-[#000000]"
            >
              {LUSION_HOME.featured.heading}
            </h2>
          </div>

          <p
            id="home-featured-disclaimer"
            className="my-[2.4em] w-full font-sans text-[3.3vw] leading-[1.4] tracking-[0.02em] text-black/85 uppercase min-[481px]:text-[2.5vw] min-[813px]:absolute min-[813px]:right-0 min-[813px]:bottom-1 min-[813px]:my-0 min-[813px]:w-[calc(var(--grid-space)*3.2+var(--grid-gap)*2)] min-[813px]:text-[0.9vw]"
          >
            {LUSION_HOME.featured.disclaimer}
          </p>
        </div>

        {/* 12 Verified Lusion Featured Projects Grid (`.project-list`) */}
        <div className="project-list relative col-span-6 grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:col-span-12 min-[813px]:mt-[calc(var(--vh,1vh)*8)] min-[813px]:grid-cols-12">
          {LUSION_HOME.featured.projects.map((project, idx) => (
            <FeaturedProjectCard key={project.id} project={project} index={idx} />
          ))}
        </div>

      {/* Centered Archive CTA (`#home-featured-cta` -> `/projects`) */}
        <div className="relative col-span-6 mt-12 mb-4 flex justify-center min-[813px]:col-span-12 min-[813px]:mt-20 min-[813px]:mb-8">
          <div className="relative z-10">
            <LusionExpandingCta
              id="home-featured-cta"
              dotId="home-featured-cta-dot"
              textId="home-featured-cta-text"
              arrowId="home-featured-cta-arrow"
              href={LUSION_HOME.featured.ctaHref}
              label={LUSION_HOME.featured.ctaLabel}
            />
          </div>
        </div>
      </section>

      {/* =====================================================================
          4. TWO-STAGE IMAGE TUNNEL SECTION (`#home-goal`)
         ===================================================================== */}
      <GoalTunnelSection />

      {/* =====================================================================
          5. CLOSING END-SECTION CTA (`#end-section` — space backdrop + astronaut wait + CTA)
          ===================================================================== */}
      <ContactCtaSection theme="home-dark" />

      {/* =====================================================================
          6 & 7. STUDIO FOOTER (`#footer-section`) & PORTAL (`#scroll-nav-section`)
         ===================================================================== */}
      <StudioFooter nextHref="/about" nextLabel="About Us" />
    </main>
  );
}
