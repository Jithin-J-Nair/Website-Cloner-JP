"use client";

import { useEffect, useRef } from "react";

import { QUOTES_TITLE, TESTIMONIALS } from "./data";

const SPEED = 40; // px per second, as on the reference

/**
 * Testimonials: a seamless auto-scrolling loop. The cards are cloned twice so the
 * strip can wrap without a jump; hovering, dragging or focusing eases it to a halt
 * (with a little jelly lean) and leaving eases it back up.
 */
export function Testimonials() {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    /* The loop is cloned in place; on a re-run (StrictMode / HMR) start from the
       real cards only, so clones cannot compound. */
    track.querySelectorAll<HTMLElement>('[data-clone="true"]').forEach((el) => el.remove());
    const originals = ([...track.children] as HTMLElement[]).filter((el) => el.dataset.clone !== "true");
    for (let k = 0; k < 2; k++) {
      originals.forEach((card) => {
        const clone = card.cloneNode(true) as HTMLElement;
        clone.setAttribute("aria-hidden", "true");
        clone.dataset.clone = "true";
        track.appendChild(clone);
      });
    }

    let loopWidth = 0;
    const measure = () => {
      const first = track.children[0] as HTMLElement;
      const next = track.children[originals.length] as HTMLElement;
      loopWidth = next.offsetLeft - first.offsetLeft;
    };
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure).catch(() => {});

    let hover = false;
    let visible = false;
    let pos = track.scrollLeft;
    let speed = SPEED;
    let lean = 0;
    let leanV = 0;
    let shown = 0;
    let last = performance.now();
    let raf = 0;

    const cards = [...track.children] as HTMLElement[];
    const onEnter = () => {
      hover = true;
    };
    const onLeave = () => {
      hover = false;
    };
    track.addEventListener("pointerenter", onEnter);
    track.addEventListener("pointerleave", onLeave);
    track.addEventListener("focusin", onEnter);
    track.addEventListener("focusout", onLeave);

    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(track);

    const tick = (now: number) => {
      const step = Math.min(now - last, 50) / 1000;
      last = now;
      if (visible && loopWidth) {
        const dragging = track.classList.contains("is-dragging");
        if (dragging) {
          pos = track.scrollLeft;
          speed = 0;
        } else {
          const target = hover ? 0 : SPEED;
          const previous = speed;
          speed += (target - speed) * (1 - Math.exp(-step * 3.2));
          const accel = (speed - previous) / Math.max(step, 0.001);
          const push = Math.max(-4, Math.min(4, -accel * 0.028));
          leanV += (70 * (push - lean) - 6 * leanV) * step;
          lean += leanV * step;
          const next = Math.round(lean * 100) / 100;
          if (next !== shown) {
            shown = next;
            cards.forEach((card) => {
              card.style.transform = next ? `skewX(${next}deg)` : "";
            });
          }
          if (!(hover && speed < 0.5)) {
            pos += speed * step;
            if (pos >= loopWidth) pos -= loopWidth;
            if (pos < 0) pos += loopWidth;
            track.scrollLeft = pos;
          } else {
            pos = track.scrollLeft;
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    /* Drag with inertial glide, matching the other tracks. */
    let down = false;
    let moved = false;
    let startX = 0;
    let startScroll = 0;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;
      down = true;
      moved = false;
      startX = event.clientX;
      startScroll = track.scrollLeft;
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
    };
    const onUp = () => {
      if (!down) return;
      down = false;
      if (!moved) return;
      requestAnimationFrame(() => track.classList.remove("is-dragging"));
      pos = track.scrollLeft;
    };
    track.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("resize", measure);
      track.removeEventListener("pointerenter", onEnter);
      track.removeEventListener("pointerleave", onLeave);
      track.removeEventListener("focusin", onEnter);
      track.removeEventListener("focusout", onLeave);
      track.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      track.querySelectorAll('[data-clone="true"]').forEach((el) => el.remove());
    };
  }, []);

  return (
    <section className="quotes" aria-labelledby="quotes-title">
      <div className="section-head section-head--center band">
        <h2 id="quotes-title" className="display container">
          <span className="lline" data-condense>
              {QUOTES_TITLE}
          </span>
        </h2>
      </div>
      <div className="quotes__band band">
        <div className="track track--quotes" tabIndex={0} aria-label="Testimonials" ref={trackRef}>
          {TESTIMONIALS.map((item) => (
            <figure className="quote" key={item.name}>
              <blockquote>{item.quote}</blockquote>
              <figcaption>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.role}</small>
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.avatar} width={52} height={52} alt="" loading="lazy" />
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
