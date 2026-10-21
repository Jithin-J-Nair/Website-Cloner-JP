"use client";

import { Fragment, useEffect, useMemo, useRef } from "react";

import { HERO, SITE_LINKS } from "./data";

type Char = { char: string; index: number };

/** The hero: masked word rise, the pixel name that melts under the cursor, and the scroll parallax. */
export function Hero() {
  const ledeRef = useRef<HTMLHeadingElement>(null);
  const nameRef = useRef<HTMLParagraphElement>(null);
  const metaRef = useRef<HTMLUListElement>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  const words = useMemo(() => HERO.lede.split(" "), []);
  const chars = useMemo(() => {
    const list: Char[] = [];
    let index = 0;
    HERO.name.split("").forEach((char) => {
      list.push({ char, index });
      index += 1;
    });
    return list;
  }, []);

  useEffect(() => {
    const name = nameRef.current;
    const lede = ledeRef.current;
    const meta = metaRef.current;
    const row = rowRef.current;
    if (!name || !lede || !meta || !row) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (reduceMotion) return;

    const charEls = [...name.querySelectorAll<HTMLElement>(".char")];
    const field = charEls.map(() => 0);
    let mouseX = -1e4;
    let mouseY = -1e4;
    let raf = 0;
    let last = performance.now();
    let lastScroll = window.scrollY;
    let velocity = 0;
    let offsetX = 0;
    let offsetY = 0;

    const ripples = 6.5;
    const started = performance.now();

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      mouseX = event.clientX;
      mouseY = event.clientY;
    };
    const onPointerLeave = () => {
      mouseX = -1e4;
      mouseY = -1e4;
    };
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.documentElement.addEventListener("pointerleave", onPointerLeave);

    const tick = (now: number) => {
      const step = Math.min(now - last, 50) / 1000;
      last = now;
      const scrolled = window.scrollY - lastScroll;
      lastScroll = window.scrollY;
      velocity += (scrolled / Math.max(step, 0.001) - velocity) * Math.min(1, step * 6);

      const rect = name.getBoundingClientRect();
      if (rect.bottom > -200 && rect.top < window.innerHeight + 200) {
        const ripple = (((now - started) / 1000) % ripples) / 1.6 * 1.5 - 0.25;
        charEls.forEach((el, i) => {
          const r = el.getBoundingClientRect();
          const cx = r.left + r.width / 2;
          const cy = r.top + r.height / 2;
          const d2 = (mouseX - cx) ** 2 + ((mouseY - cy) * 1.3) ** 2;
          const u = (cx - rect.left) / Math.max(rect.width, 1);
          let target = 13 * Math.exp(-d2 / (2 * 170 * 170));
          target += 6 * Math.exp(-((u - ripple) ** 2) / (2 * 0.07 * 0.07));
          target += Math.min(9, Math.abs(velocity / 60) * 0.3);
          field[i] += (target - field[i]) * (1 - Math.exp(-step * 9));
          el.style.setProperty("--field", field[i].toFixed(2));
        });
      }

      /* Scroll: the name melts away as it leaves, the lede and meta drift at their own speeds. */
      /* The title melts as it leaves: it starts once its top passes 30% of the
         viewport and is gone by the time its bottom reaches 5% (the source's
         "top 30% → bottom 5%" scrub). */
      const vh = window.innerHeight;
      const melt = Math.min(1, Math.max(0, (vh * 0.3 - rect.top) / (rect.height + vh * 0.25)));
      name.style.setProperty("--melt", (melt * 19).toFixed(2));
      if (melt > 0) {
        name.style.opacity = `${Math.max(0, 1 - melt * 1.15)}`;
        name.style.filter = `blur(${(melt * 4).toFixed(1)}px)`;
      } else {
        name.style.opacity = "1";
        name.style.filter = "";
      }

      if (finePointer) {
        const tx = (mouseX / window.innerWidth) * 2 - 1;
        const ty = (mouseY / window.innerHeight) * 2 - 1;
        if (Number.isFinite(tx) && Number.isFinite(ty)) {
          offsetX += (tx * 12 - offsetX) * 0.06;
          offsetY += (ty * 8 - offsetY) * 0.06;
        }
      }
      const y = window.scrollY;
      const near = Math.max(0, 1 - y / Math.max(1, rect.bottom + y));
      lede.style.translate = `${(offsetX * 0.6 * near).toFixed(1)}px ${(y * 0.28).toFixed(1)}px`;
      meta.style.translate = `${(offsetX * 0.3 * near).toFixed(1)}px ${(y * 0.12).toFixed(1)}px`;
      row.style.translate = `0 ${(-offsetY * 0.4 * near + y * -0.1).toFixed(1)}px`;

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointerMove);
      document.documentElement.removeEventListener("pointerleave", onPointerLeave);
    };
  }, []);

  return (
    <section className="hero container">
      <h1 className="hero__lede" ref={ledeRef}>
        {words.map((word, i) => (
          <Fragment key={`${word}-${i}`}>
            <span className="hero__word">
              <span style={{ ["--i" as string]: i }}>{word}</span>
            </span>
            {i < words.length - 1 ? " " : null}
          </Fragment>
        ))}
      </h1>

      <ul className="hero__meta" aria-label="At a glance" ref={metaRef}>
        {HERO.meta.map((item, i) => (
          <Fragment key={item}>
            {i > 0 ? (
              <li className="hero__plus" aria-hidden="true" style={{ ["--i" as string]: i * 2 - 1 }}>
                +
              </li>
            ) : null}
            <li style={{ ["--i" as string]: i * 2 }}>{item}</li>
          </Fragment>
        ))}
      </ul>

      <div className="hero__name-row" ref={rowRef}>
        <p className="hero__name" aria-label={HERO.name} ref={nameRef}>
          {chars.map(({ char, index }) =>
            char === " " ? (
              <span className="space" key={`space-${index}`}>
                {" "}
              </span>
            ) : (
              <span
                className="char"
                key={`${char}-${index}`}
                style={{ ["--i" as string]: index }}
              >
                {char}
              </span>
            ),
          )}
        </p>
        <a
          className="hero__linkedin"
          href={SITE_LINKS.linkedin}
          target="_blank"
          rel="noopener"
          aria-label="LinkedIn"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`${"/sites/jithinrp/assets/landing"}/linkedin.svg`} width={45} height={45} alt="" />
        </a>
      </div>
    </section>
  );
}
