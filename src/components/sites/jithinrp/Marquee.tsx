"use client";

import { Fragment, useEffect, useRef } from "react";

import { MARQUEE_WORDS } from "./data";

/**
 * Kinetic marquee: pixel type that drifts on its own, speeds up with the scroll
 * (and flips with its direction), and rounds its pixels the faster it travels.
 */
export function Marquee() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const track = trackRef.current;
    const group = groupRef.current;
    if (!root || !track || !group) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Enough copies to cover the screen twice, so the loop never shows a gap.
    const span = group.offsetWidth;
    if (!span) return;
    const copies = Math.max(2, Math.ceil((window.innerWidth * 2) / span) + 1);
    const addCopies = () => {
      // Start from the original group only, so a StrictMode/HMR re-run cannot stack copies.
      track.querySelectorAll('[data-clone="true"]').forEach((el) => el.remove());
      if (track.children.length > 1) {
        [...track.children].slice(1).forEach((el) => el.remove());
      }
      for (let i = 1; i < copies; i++) {
        const clone = group.cloneNode(true) as HTMLElement;
        clone.dataset.clone = "true";
        clone.setAttribute("aria-hidden", "true");
        track.appendChild(clone);
      }
    };
    addCopies();

    let x = 0;
    let dir = 1;
    let speed = 0;
    let lean = 0;
    let leanV = 0;
    let lastScroll = window.scrollY;
    let last = performance.now();
    let raf = 0;

    const tick = (now: number) => {
      const step = Math.min(now - last, 50) / 1000;
      last = now;
      const velocity = (window.scrollY - lastScroll) / Math.max(step, 0.001);
      lastScroll = window.scrollY;

      /* The source's Lenis velocity is px/frame; ours is px/second, so the
         speed/lean/melt weightings are scaled by a frame (≈1/60 s). */
      const perFrame = velocity / 60;
      if (Math.abs(perFrame) > 0.4) dir = perFrame > 0 ? 1 : -1;
      const targetSpeed = 70 + Math.min(1400, Math.abs(perFrame) * 38);
      speed += (targetSpeed - speed) * (1 - Math.exp(-step * 5));
      x -= dir * speed * step;
      x = ((x % span) - span) % span;
      leanV += (60 * (Math.max(-10, Math.min(10, -perFrame * 0.25)) - lean) - 10 * leanV) * step;
      lean += leanV * step;

      const rect = root.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        track.style.transform = `translate3d(${x.toFixed(2)}px,0,0) skewX(${(Math.round(lean * 100) / 100).toFixed(2)}deg)`;
        root.style.setProperty("--speed", Math.min(19, Math.abs(perFrame) * 0.45).toFixed(2));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      track.querySelectorAll('[data-clone="true"]').forEach((el) => el.remove());
    };
  }, []);

  const group = (
    <div className="marquee__group" ref={groupRef}>
      {MARQUEE_WORDS.map((word) => (
        <Fragment key={word}>
          <span>{word}</span>
          <span className="marquee__plus">+</span>
        </Fragment>
      ))}
    </div>
  );

  return (
    <div className="marquee" aria-hidden="true" data-marquee ref={rootRef}>
      <div className="marquee__track" ref={trackRef}>
        {group}
      </div>
    </div>
  );
}
