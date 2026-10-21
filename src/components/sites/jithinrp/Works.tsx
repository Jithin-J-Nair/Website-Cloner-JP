"use client";

import { useEffect, useRef } from "react";

import { WORKS } from "./data";
import type { Work, WorkMedia } from "@/types/jithinrp";
import { PlayOnVisible } from "./PlayOnVisible";

function mediaBackground(colors?: string) {
  if (!colors) return undefined;
  const [a, b, c, d] = colors.split(",");
  return [
    `radial-gradient(90% 70% at 100% 0%, ${b}, transparent 70%)`,
    `radial-gradient(80% 60% at 0% 100%, ${c}, transparent 70%)`,
    `radial-gradient(80% 60% at 100% 100%, ${d}, transparent 70%)`,
    a,
  ].join(",");
}

function Media({ media }: { media: WorkMedia }) {
  const style = { background: mediaBackground(media.colors) };
  if (media.kind === "video") {
    return (
      <div className={`work__media work__media--${media.variant}`} data-story-media style={style}>
        <PlayOnVisible
          src={media.src}
          poster={media.poster}
          className="work__video"
        />
      </div>
    );
  }
  return (
    <div className={`work__media work__media--${media.variant}`} data-story-media>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={media.src}
        width={media.width}
        height={media.height}
        alt={media.alt ?? ""}
        loading="lazy"
      />
    </div>
  );
}

function Row({ work }: { work: Work }) {
  return (
    <article className="work band" data-href={work.href} data-external data-cursor-pill={work.pill}>
      <div className="work__grid container">
        <div className="work__col">
          <div className="work__intro">
            <h3 className="work__title">
              <a href={work.href} target="_blank" rel="noopener">
                {work.title}
              </a>
            </h3>
            {work.description.map((paragraph) => (
              <p className="muted" key={paragraph.slice(0, 40)}>
                {paragraph}
              </p>
            ))}
          </div>
          <dl className="fact">
            <dt>Project Timeline</dt>
            <dd>{work.timeline}</dd>
          </dl>
        </div>

        <div className="work__mid">
          <Media media={work.media} />
        </div>

        <div className="work__col">
          <dl className="fact">
            <dt>Role</dt>
            <dd>{work.role}</dd>
          </dl>
          <dl className="fact">
            <dt>Tools</dt>
            <dd className="tools">
              {work.tools.map((tool) => (
                <span
                  className="tool"
                  role="img"
                  aria-label={`${tool.name}: ${tool.note}`}
                  data-cursor-pill={tool.name}
                  data-cursor-note={tool.note}
                  key={tool.id}
                >
                  <svg aria-hidden="true">
                    <use href={`/sites/jithinrp/assets/landing/tools.svg#${tool.id}`} />
                  </svg>
                </span>
              ))}
            </dd>
          </dl>
          {work.recognition ? (
            <dl className="fact">
              <dt>Recognition</dt>
              <dd>{work.recognition}</dd>
            </dl>
          ) : null}
        </div>
      </div>
    </article>
  );
}

/**
 * Selected Works is a pinned strip on the reference site: the section sticks for
 * one screen per case study while the wheel slides the rows sideways, then the
 * page carries on downward. Implemented with a sticky container + scroll progress
 * (no animation library needed); it falls back to a stacked list for reduced
 * motion, small screens, or before hydration.
 */
export function Works() {
  const pinRef = useRef<HTMLDivElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const pin = pinRef.current;
    const sticky = stickyRef.current;
    const track = trackRef.current;
    if (!pin || !sticky || !track) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let distance = 0;
    let raf = 0;
    let scrollHandlerAttached = false;

    const works = [...track.querySelectorAll<HTMLElement>(".work")];
    const leaners = [...track.querySelectorAll<HTMLElement>(".work__intro, .work__col .fact")];

    /* Each card's media arrives close and large, pulls back into its frame and
       fades up as the card slides in (source: scale 1.3 → 1, y 90/scale .86 when
       hidden). The first card is keyed to the vertical approach instead, because
       it is already at the strip's left edge when the pin starts. */
    const updateCards = () => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      works.forEach((work, index) => {
        const box = work.getBoundingClientRect();
        const shown = index === 0 ? box.top < vh * 0.72 : box.left < vw * 0.72;
        work.classList.toggle("is-shown", shown);
        if (box.right > 40 && box.left < vw - 40) work.classList.add("is-seen");
      });
    };

    let progress = 0;

    const apply = () => {
      raf = 0;
      const top = pin.offsetTop;
      progress = distance > 0 ? Math.min(1, Math.max(0, (window.scrollY - top) / distance)) : 0;
      track.style.transform = `translate3d(${(-progress * distance).toFixed(2)}px,0,0)`;
      updateCards();
    };

    /* The jelly lean: words and details trail the sideways motion and settle with
       a small wobble (source: skewX ±4°, critically-damped spring per ticker). */
    let leanRaf = 0;
    let leanX = 0;
    let leanT = 0;
    let leanV = 0;
    let lean = 0;
    let leanVel = 0;

    const leanTick = () => {
      const now = performance.now();
      const x = -progress * distance;
      const dt = Math.min(50, now - (leanT || now)) / 1000;
      const top = pin.offsetTop;
      const active = window.scrollY > top - window.innerHeight && window.scrollY < top + distance;
      if (dt > 0 && leanT) {
        const step = dt;
        const velocity = (x - leanX) / step;
        leanV += (velocity - leanV) * (1 - Math.exp(-step * 10));
        const target = Math.max(-4, Math.min(4, leanV * 0.005));
        leanVel += (45 * (target - lean) - 9 * leanVel) * step;
        lean += leanVel * step;
      }
      leanX = x;
      leanT = now;
      if (active) {
        const skew = (Math.round(lean * 100) / 100).toFixed(2);
        leaners.forEach((el) => (el.style.transform = `skewX(${skew}deg)`));
      } else if (lean !== 0) {
        lean = 0;
        leanVel = 0;
        leaners.forEach((el) => (el.style.transform = ""));
      }
      leanRaf = requestAnimationFrame(leanTick);
    };
    leanRaf = requestAnimationFrame(leanTick);

    const request = () => {
      if (!raf) raf = requestAnimationFrame(apply);
    };

    const measure = () => {
      /* Each row is one viewport wide, so the strip travels (rows − 1) screens.
         Measured from the viewport rather than the DOM: while the section is
         static the rows are stacked and their scroll width says nothing. */
      track.style.transform = "";
      distance = Math.max(0, works.length - 1) * window.innerWidth;
      pin.classList.toggle("is-static", distance <= 0);
      pin.style.height = distance > 0 ? `${sticky.offsetHeight + distance}px` : "";
      if (distance > 0 && !scrollHandlerAttached) {
        window.addEventListener("scroll", request, { passive: true });
        scrollHandlerAttached = true;
      }
      if (distance <= 0 && scrollHandlerAttached) {
        window.removeEventListener("scroll", request);
        scrollHandlerAttached = false;
      }
      apply();
    };

    measure();
    window.addEventListener("resize", measure);
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    document.fonts?.ready.then(measure).catch(() => {});

    return () => {
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", request);
      ro.disconnect();
      cancelAnimationFrame(raf);
      cancelAnimationFrame(leanRaf);
      leaners.forEach((el) => (el.style.transform = ""));
    };
  }, []);

  return (
    <section id="works" className="works" aria-labelledby="works-title">
      <div className="section-head band">
        <h2 id="works-title" className="display container">
            <span className="lline" data-condense>
              Selected Works
            </span>
        </h2>
      </div>
      <div className="works-pin is-static" ref={pinRef}>
        <div className="works-sticky" ref={stickyRef}>
          <div className="works-track" ref={trackRef}>
            {WORKS.map((work) => (
              <Row work={work} key={work.slug} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
