"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { HeroCrossesStage } from "@/components/home/HeroCrossesStage";
import { FeaturedProjectCard } from "@/components/home/FeaturedProjectCard";
import { GoalTunnelSection } from "@/components/home/GoalTunnelSection";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { HomeReelSection } from "@/components/home/HomeReelSection";
import { createHomeEditorialMotion } from "@/components/home/HomeEditorialMotion";
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
        className="relative z-10 inline-block h-[0.5em] w-[0.5em] rounded-full bg-[#000000] transition-[transform,translate,scale,background-color] duration-500 ease-[cubic-bezier(0.35,0,0,1)] group-hover:translate-x-[3.2em] group-hover:scale-[26] group-hover:bg-[#1a2ffb]"
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
  const reelOpen = useStudioStore((s) => s.reelOpen);

  const [isMobileReel, setIsMobileReel] = useState(false);
  const [reelVideoFailed, setReelVideoFailed] = useState(false);
  // Enable real self-hosted showreel `.mp4` stream from `media-bundle/` by default,
  // preserving `<ProceduralReelStream />` strictly as an automatic `onError` fallback.
  const reelVideoAvailable = !reelVideoFailed;

  const heroSectionRef = useRef<HTMLElement>(null);
  const heroHeadingRef = useRef<HTMLHeadingElement>(null);
  const heroStageRef = useRef<HTMLDivElement>(null);
  const heroCueRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setActiveSurface("ice");
    const syncVp = () => setIsMobileReel(window.innerWidth <= 560);
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

  // The reel mesh, captured ribbon, type and depth cards share one upper-Home owner.
  useEffect(() => {
    const root = document.getElementById("home");
    if (!root) return;
    return createHomeEditorialMotion(root, reducedMotion, reelOpen);
  }, [reducedMotion, reelOpen, isMobileReel, reelVideoAvailable]);

  const heroLines = [
    "アイデアを、確かな技術で形にする。",
    "Web・AI・自動化を通じて、",
    "課題を解決する仕組みをつくる。",
  ];
  const featuredLines = ["アイデアと技術を融合させて生み出した、", "こだわりのデジタルプロジェクトをご紹介します。"] as const;
  const reelLoopSrc = isMobileReel
    ? LUSION_HOME.reel.mobileLoopVideo
    : LUSION_HOME.reel.desktopLoopVideo;

  const handleOpenReel = () => {
    soundEngine.playClick();
    setReelOpen(true, {
      title: "JITHIN Showreel",
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
        className="section relative grid h-[calc(var(--vh,1vh)*100)] min-h-[580px] grid-cols-6 grid-rows-[auto_1fr] px-[var(--base-padding-x)] pt-[calc(var(--base-padding-y)+2.9rem)] pb-[calc(var(--base-padding-y)*1.25)] min-[813px]:grid-cols-12 min-[813px]:pt-[calc(var(--vh,1vh)*5.3)] min-[813px]:pb-[calc(var(--base-padding-y)*0.94)]"
      >
        {/* Reference Headline (`#home-hero-title`: cols 4..8 desktop, cols 1..6 mobile) */}
        <h1
          id="home-hero-title"
          ref={heroHeadingRef}
          lang="ja"
          aria-label={heroLines.join(" ")}
          className="relative col-span-6 m-0 h-fit home-japanese-headline text-[5vw] leading-[1.35] font-light tracking-[-0.02em] text-[#000000] min-[813px]:col-start-4 min-[813px]:col-span-5 min-[813px]:text-[2.25vw]"
        >
          {heroLines.map((line, idx) => (
            <motion.span
              key={line}
              aria-hidden="true"
              initial={reducedMotion ? false : { transform: "translate3d(0,115%,0) rotate(7deg)", opacity: 0 }}
              animate={{ transform: "translate3d(0,0%,0) rotate(0deg)", opacity: 1 }}
              transition={{ duration: 0.62, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
              className="block whitespace-nowrap will-change-transform"
            >
              {line}
            </motion.span>
          ))}
        </h1>

        {/* Dark Rounded 3D Hollow Cross Stage (`#home-hero-visual-container`) */}
        <div
          ref={heroStageRef}
          className="col-span-6 mt-[calc(var(--base-padding-y)*0.55)] mb-[calc(var(--base-padding-y)*1.35)] min-h-0 will-change-[transform,opacity] min-[813px]:col-span-12 min-[813px]:mt-[calc(var(--base-padding-y)*0.9)] min-[813px]:mb-[calc(var(--base-padding-y)*0.05)]"
        >
          <HeroCrossesStage />
        </div>

        {/* Bottom Crosshair + `SCROLL TO EXPLORE` Bar (`#home-hero-scroll-container`) */}
        <div
          id="home-hero-scroll-container"
          ref={heroCueRef}
          className="pointer-events-none absolute right-[var(--base-padding-x)] bottom-[calc(var(--base-padding-y)*0.32)] min-[813px]:bottom-0 left-[var(--base-padding-x)] flex h-[var(--base-padding-y)] items-center justify-between"
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
      <HomeReelSection videoSrc={reelLoopSrc} videoFailed={reelVideoFailed} onVideoError={() => setReelVideoFailed(true)} onOpenReel={handleOpenReel} />

      {/* =====================================================================
          3. FEATURED WORK SECTION (`#home-featured` — 12 Current Projects)
         ===================================================================== */}
      <section
        id="home-featured"
        className="section relative grid grid-cols-6 gap-x-[var(--grid-gap)] px-[var(--base-padding-x)] pt-12 pb-16 min-[813px]:grid-cols-12 min-[813px]:pt-20 min-[813px]:pb-28"
      >
        {/* Header Band (`#home-featured-title-top`) */}
        <div id="home-featured-title-top" className="relative col-span-6 min-[813px]:col-span-12">
          <div
            id="home-featured-title-wrapper"
            className="relative w-fit overflow-hidden font-sans text-[15vw] tracking-[-0.02em] min-[813px]:text-[8vw]"
          >
            <h2
              id="home-featured-title"
              aria-label={LUSION_HOME.featured.heading}
              className="m-0 -ml-[0.06em] inline-block pt-[0.2em] leading-[0.92] font-normal text-[#000000]"
            >
              {LUSION_HOME.featured.heading.split(" ").map((word, i) => <React.Fragment key={word}><span className="inline-block whitespace-nowrap" aria-hidden="true">{[...word].map((char, j) => <span data-featured-char key={j}>{char}</span>)}</span>{i === 0 ? " " : ""}</React.Fragment>)}
            </h2>
          </div>

          <p
            id="home-featured-disclaimer"
            lang="ja"
            aria-label={featuredLines.join(" ")}
            className="my-[2.4em] w-full home-japanese-featured font-light text-[3.3vw] leading-[1.4] tracking-[0.02em] text-black/85 uppercase min-[481px]:text-[2.5vw] min-[813px]:absolute min-[813px]:right-0 min-[813px]:bottom-1 min-[813px]:my-0 min-[813px]:w-[calc(var(--grid-space)*3.2+var(--grid-gap)*2)] min-[813px]:text-[0.9vw]"
          >
            {featuredLines.map(line => (
              <span key={line} className="block" aria-hidden="true">
                {Array.from(line).reduce<string[]>((units, char) => {
                  if ((char === "、" || char === "。") && units.length) units[units.length - 1] += char;
                  else units.push(char);
                  return units;
                }, []).map((unit, i) => <span key={i} className="inline-block overflow-hidden align-top"><span data-featured-disclaimer-word className="inline-block">{unit}</span></span>)}
              </span>
            ))}
          </p>
        </div>

        {/* 10 Current Lusion Featured Projects Grid (`.project-list`) */}
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
      <StudioFooter nextHref="/about" nextLabel="About Us" brandName="JITHIN" />
    </main>
  );
}
