"use client";

import React from "react";
import { LUSION_HOME } from "@/data/reference";
import { ProceduralReelStream } from "@/components/studio/ProceduralReelStream";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { soundEngine } from "@/lib/audio";
import "./home-editorial.css";

interface HomeReelSectionProps {
  videoSrc: string;
  videoFailed: boolean;
  onVideoError: () => void;
  onOpenReel: () => void;
}

export function HomeReelSection({ videoSrc, videoFailed, onVideoError, onOpenReel }: HomeReelSectionProps) {
  return <section id="home-reel" className="section home-reel-section">
    <h2 id="home-reel-title" aria-label={LUSION_HOME.reel.eyebrowFull}>
      <span id="home-reel-title-inner" aria-hidden="true">
        {[LUSION_HOME.reel.eyebrowLine1, LUSION_HOME.reel.eyebrowLine2].map((line, i) =>
          <span key={line} id={i === 0 ? "home-reel-title-line-1" : undefined} className="reel-title-line">
            {line.split(" ").map((word, j) => <React.Fragment key={word}><span data-reel-word>{word}</span>{j < line.split(" ").length - 1 ? " " : ""}</React.Fragment>)}
          </span>)}
      </span>
    </h2>
    <div id="home-reel-content">
      <p id="home-reel-desc">{LUSION_HOME.reel.description.split(" ").map((word, i) => <React.Fragment key={i}><span data-reel-desc-word>{word}</span>{" "}</React.Fragment>)}</p>
      <TransitionLink id="home-reel-cta" href={LUSION_HOME.reel.ctaHref} transitionLabel="Our Approach" onMouseEnter={() => soundEngine.playHover()}>
        <span className="reel-cta-dot" aria-hidden="true" /><span className="reel-cta-text">{LUSION_HOME.reel.ctaLabel}</span><span className="reel-cta-arrow" aria-hidden="true">→</span>
      </TransitionLink>
    </div>
    <div id="home-reel-thumb-wrapper" aria-hidden="true"><div id="home-reel-thumb" /></div>
    <div id="home-reel-container"><div id="home-reel-container-inner"><div id="home-reel-video-container">
      <div id="home-reel-video-fallback" aria-hidden="true">
        {!videoFailed ? <video id="home-reel-video" src={videoSrc} muted loop playsInline preload="auto" onError={onVideoError} /> : <ProceduralReelStream variant="thumb" />}
      </div>
      <div id="home-reel-video-container-decoration" aria-hidden="true">
        {["top", "bottom"].map(side => <div key={side} id={`home-reel-video-container-${side}`} className="reel-decoration-rail">
          <div className="reel-crosses">{Array.from({ length: 5 }, (_, i) => <span key={i} className="reel-cross">+</span>)}</div>
          <div className="reel-marquee">{Array.from({ length: 8 }, (_, i) => <span key={i}>▶▶▶ PLAY REEL&nbsp;&nbsp;</span>)}</div>
        </div>)}
      </div>
      <div id="home-reel-video-placeholder" onClick={onOpenReel}>
        <div id="home-reel-video-title" aria-hidden="true">{["Play", "Reel"].map(word => <span className="reel-play-word" key={word}>{[...word].map((char, i) => <span className="reel-glyph-slot" key={i}><span data-reel-glyph><span>{char}</span><span>{char}</span></span></span>)}</span>)}</div>
        <button type="button" id="home-reel-video-watch-btn" aria-label="Play Showreel" onMouseEnter={() => soundEngine.playHover()} onClick={event => { event.stopPropagation(); onOpenReel(); }}>
          <span id="home-reel-video-watch-btn-base" /><span id="home-reel-video-watch-btn-background" />
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6L19.2 12 8 5.2z" /></svg>
        </button>
      </div>
    </div></div></div>
  </section>;
}
