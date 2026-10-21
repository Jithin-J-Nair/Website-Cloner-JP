"use client";

import { useEffect, useRef, useState } from "react";

import { AI_PROJECTS, GENAI_INTRO } from "./data";
import { PlayOnVisible } from "./PlayOnVisible";

type GenAiProps = {
  onOpenModal: (id: string, from: HTMLElement) => void;
};

function AiMedia({ id }: { id: string }) {
  const project = AI_PROJECTS.find((p) => p.id === id);
  if (!project) return null;
  const { media } = project;

  if (media.kind === "video") {
    const [a, b, c, d] = media.colors.split(",");
    return (
      <div
        className="ai-card__media"
        style={{
          background: [
            `radial-gradient(90% 70% at 100% 0%, ${b}, transparent 70%)`,
            `radial-gradient(80% 60% at 0% 100%, ${c}, transparent 70%)`,
            `radial-gradient(80% 60% at 100% 100%, ${d}, transparent 70%)`,
            a,
          ].join(","),
        }}
      >
        <PlayOnVisible src={media.src} poster={media.poster} />
      </div>
    );
  }
  if (media.kind === "image") {
    return (
      <div className="ai-card__media">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={media.src} width={media.width} height={media.height} alt={media.alt} loading="lazy" />
      </div>
    );
  }
  return (
    <div className="ai-card__media">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={media.src} alt={media.alt} loading="lazy" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="ai-card__logo" src={media.logoSrc} width={1254} height={1254} alt="" loading="lazy" />
    </div>
  );
}

/** Gen AI Projects: a draggable carousel with a joined hairline arrow pair. */
export function GenAi({ onOpenModal }: GenAiProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const prevRef = useRef<HTMLButtonElement>(null);
  const nextRef = useRef<HTMLButtonElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    const prev = prevRef.current;
    const next = nextRef.current;
    if (!track || !prev || !next) return;

    let tween = 0;

    const update = () => {
      const max = track.scrollWidth - track.clientWidth - 2;
      setAtStart(track.scrollLeft <= 2);
      setAtEnd(track.scrollLeft >= max);
    };

    const step = () => {
      const card = track.firstElementChild as HTMLElement | null;
      const styles = getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap) || 0;
      return (card?.getBoundingClientRect().width ?? 436) + gap;
    };

    const glideTo = (target: number) => {
      cancelAnimationFrame(tween);
      const max = track.scrollWidth - track.clientWidth;
      const to = Math.min(max, Math.max(0, target));
      const from = track.scrollLeft;
      const delta = to - from;
      const start = performance.now();
      const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 1500;
      const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
      const stepFrame = (now: number) => {
        const t = duration === 0 ? 1 : Math.min(1, (now - start) / duration);
        track.scrollLeft = from + delta * ease(t);
        if (t < 1) tween = requestAnimationFrame(stepFrame);
      };
      tween = requestAnimationFrame(stepFrame);
    };

    const go = (dir: number) => glideTo(track.scrollLeft + dir * step());

    const onPrev = () => go(-1);
    const onNext = () => go(1);

    prev.addEventListener("click", onPrev);
    next.addEventListener("click", onNext);
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();

    /* Drag with inertial glide (touch keeps native scrolling). */
    let down = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;
    let lastX = 0;
    let lastT = 0;
    let velocity = 0;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      down = true;
      moved = false;
      startX = lastX = event.clientX;
      startScroll = track.scrollLeft;
      lastT = performance.now();
      velocity = 0;
      cancelAnimationFrame(tween);
    };
    const onMove = (event: PointerEvent) => {
      if (!down) return;
      const dx = event.clientX - startX;
      if (!moved && Math.abs(dx) > 4) {
        moved = true;
        track.classList.add("is-dragging");
      }
      if (!moved) return;
      track.scrollLeft = startScroll - dx;
      const now = performance.now();
      velocity = (event.clientX - lastX) / Math.max(1, now - lastT);
      lastX = event.clientX;
      lastT = now;
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      requestAnimationFrame(() => track.classList.remove("is-dragging"));
      glideTo(track.scrollLeft - velocity * 480);
    };
    const onClickCapture = (event: MouseEvent) => {
      if (moved) {
        event.preventDefault();
        moved = false;
      }
    };
    const onDragStart = (event: DragEvent) => event.preventDefault();

    track.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    track.addEventListener("click", onClickCapture, true);
    track.addEventListener("dragstart", onDragStart);

    return () => {
      prev.removeEventListener("click", onPrev);
      next.removeEventListener("click", onNext);
      track.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      track.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      track.removeEventListener("click", onClickCapture, true);
      track.removeEventListener("dragstart", onDragStart);
      cancelAnimationFrame(tween);
    };
  }, []);

  return (
    <section className="genai band" aria-labelledby="genai-title">
      <div className="genai__head container">
        <h2 id="genai-title" className="display">
          <span className="lline" data-condense>
              Gen AI Projects
          </span>
        </h2>
        <p className="genai__intro" data-reveal>
          {GENAI_INTRO}
        </p>
      </div>

      <div className="genai__controls container">
        <div className="arrows" role="group" aria-label="Browse projects">
          <button
            className="arrow arrow--prev"
            type="button"
            aria-label="Previous project"
            ref={prevRef}
            disabled={atStart}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 12H5M11 6l-6 6 6 6" />
            </svg>
          </button>
          <button className="arrow" type="button" aria-label="Next project" ref={nextRef} disabled={atEnd}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </div>
      </div>

      <div className="track" data-carousel tabIndex={0} aria-label="Gen AI projects" ref={trackRef}>
        {AI_PROJECTS.map((project) =>
          project.external ? (
            <a
              className="ai-card"
              href={project.href}
              target="_blank"
              rel="noopener"
              data-cursor-pill={project.pill}
              key={project.id}
            >
              <AiMedia id={project.id} />
              <h3 className="ai-card__title">{project.title}</h3>
              <p className="muted">{project.body}</p>
            </a>
          ) : (
            <a
              className="ai-card"
              href={project.href}
              data-cursor-pill={project.pill}
              key={project.id}
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                event.preventDefault();
                onOpenModal(project.id, event.currentTarget);
              }}
            >
              <AiMedia id={project.id} />
              <h3 className="ai-card__title">{project.title}</h3>
              <p className="muted">{project.body}</p>
            </a>
          ),
        )}
      </div>
    </section>
  );
}
