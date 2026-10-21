"use client";

import { useEffect, useRef } from "react";

import { ABOUT } from "./data";

/** About Me, plus the photo trail that follows the cursor across the section. */
export function About() {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = document.createElement("div");
    layer.className = "about-trail";
    layer.setAttribute("aria-hidden", "true");
    document.body.appendChild(layer);

    const pool = Array.from({ length: 12 }, () => {
      const img = document.createElement("img");
      img.alt = "";
      img.decoding = "async";
      img.style.opacity = "0";
      layer.appendChild(img);
      return img;
    });

    let loaded = false;
    let next = 0;
    let pick = 0;
    let z = 1;
    let last: { x: number; y: number } | null = null;
    let lastT = 0;
    let timer = 0;

    const load = () => {
      if (loaded) return;
      loaded = true;
      ABOUT.trail.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
    };

    const onEnter = () => load();
    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      load();
      const now = performance.now();
      if (!last) {
        last = { x: event.clientX, y: event.clientY };
        lastT = now;
        return;
      }
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      const d = Math.hypot(dx, dy);
      if (d < 55) return;
      const v = d / Math.max(16, now - lastT);
      last = { x: event.clientX, y: event.clientY };
      lastT = now;

      const img = pool[next];
      next = (next + 1) % pool.length;
      img.src = ABOUT.trail[pick];
      pick = (pick + 1) % ABOUT.trail.length;

      const drift = Math.min(1.6, v) * 70;
      const rotation = -9 + Math.random() * 18;
      z += 1;
      img.style.transition = "none";
      img.style.transform = `translate(${event.clientX - 85}px, ${event.clientY - 113}px) rotate(${rotation}deg) scale(0.55)`;
      img.style.zIndex = `${z}`;
      img.style.opacity = "0";

      requestAnimationFrame(() => {
        img.style.transition =
          "transform .8s cubic-bezier(.22,1,.36,1), opacity .35s ease-out";
        img.style.opacity = "1";
        img.style.transform = `translate(${event.clientX - 85 + (dx / d) * drift}px, ${
          event.clientY - 113 + (dy / d) * drift
        }px) rotate(${rotation}deg) scale(1)`;
      });

      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        img.style.transition = "transform .42s ease-in, opacity .42s ease-in";
        img.style.opacity = "0";
        img.style.transform = `translate(${event.clientX - 85}px, ${event.clientY - 87}px) rotate(${rotation}deg) scale(0.86)`;
      }, 360);
    };
    const onLeave = () => {
      last = null;
    };

    section.addEventListener("pointerenter", onEnter, { passive: true });
    section.addEventListener("pointermove", onMove, { passive: true });
    section.addEventListener("pointerleave", onLeave, { passive: true });

    return () => {
      section.removeEventListener("pointerenter", onEnter);
      section.removeEventListener("pointermove", onMove);
      section.removeEventListener("pointerleave", onLeave);
      window.clearTimeout(timer);
      layer.remove();
    };
  }, []);

  return (
    <section id="about" className="about" aria-labelledby="about-title" ref={sectionRef}>
      <div className="about__grid container">
        <div className="about__text">
          <h2 id="about-title" className="display">
            <span className="lline" data-condense>
                {ABOUT.title}
            </span>
          </h2>
          <div className="about__body" data-reveal>
            {ABOUT.paragraphs.map((paragraph) => (
              <p key={paragraph.slice(0, 24)}>{paragraph}</p>
            ))}
          </div>
        </div>
        <div className="about__photo" data-story-media>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={ABOUT.photo} width={1024} height={831} alt="Jithin at a design event" loading="lazy" />
        </div>
      </div>
    </section>
  );
}
