"use client";

import { useEffect } from "react";

import { attachHoverSounds } from "./runtime/sound";

/**
 * Page-wide behaviour ported from the reference's `site.js`:
 *  - a fixed navbar that compacts into a frosted band once the page scrolls;
 *  - smooth anchor scrolling that clears the navbar;
 *  - scroll reveals, drawn hairlines and blur-in headings;
 *  - the reading-progress meter on the right edge;
 *  - the cursor pill (over `[data-cursor-pill]`) and the tapered cursor trail;
 *  - whole-row case-study links and hover sounds.
 */
export function SiteRuntime() {
  useEffect(() => {
    const root = document.documentElement;
    /* The reference marks the document "no-motion" and hides the kinetic marquee
       outright rather than freezing it. */
    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const reduceMotion = reduceMotionQuery.matches;
    root.classList.toggle("no-motion", reduceMotion);
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    root.classList.add("jrp-js");

    const cleanups: Array<() => void> = [];

    /* ---------------- Navbar: compact + measure the spacer ---------------- */
    const bar = document.querySelector<HTMLElement>(".jrp .navbar");
    const spacer = document.querySelector<HTMLElement>(".jrp .navbar-spacer");
    const sound = document.querySelector<HTMLElement>(".jrp .sound-toggle");
    if (bar && spacer) {
      const measure = () => {
        const wasScrolled = bar.classList.contains("is-scrolled");
        bar.style.transition = "none";
        bar.classList.remove("is-scrolled");
        spacer.style.height = `${bar.offsetHeight}px`;
        bar.classList.toggle("is-scrolled", wasScrolled);
        void bar.offsetHeight;
        bar.style.transition = "";
      };
      let scrolled = window.scrollY > 12;
      bar.classList.toggle("is-scrolled", scrolled);
      const update = () => {
        const next = window.scrollY > 12;
        if (next === scrolled) return;
        scrolled = next;
        bar.classList.toggle("is-scrolled", scrolled);
      };
      measure();
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", measure);
      document.fonts?.ready.then(measure).catch(() => {});
      cleanups.push(() => {
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", measure);
      });
    }
    if (sound) {
      sound.style.setProperty("--i", "2");
    }

    /* ---------------- Anchors: smooth scroll with the nav offset ---------------- */
    const anchorCleanups: Array<() => void> = [];
    document.querySelectorAll<HTMLAnchorElement>('.jrp a[href^="#"]').forEach((anchor) => {
      const onClick = (event: MouseEvent) => {
        const href = anchor.getAttribute("href");
        if (!href || href === "#") return;
        const target = document.querySelector(href);
        if (!target) return;
        event.preventDefault();
        const offset = (bar?.offsetHeight ?? 0) + 24;
        const top = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" });
        window.history.replaceState(null, "", href);
      };
      anchor.addEventListener("click", onClick);
      anchorCleanups.push(() => anchor.removeEventListener("click", onClick));
    });
    cleanups.push(() => anchorCleanups.forEach((fn) => fn()));

    /* ---------------- Reveals + hairline drawing + heading condense ---------------- */
    const revealed = new WeakSet<Element>();
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || revealed.has(entry.target)) return;
          revealed.add(entry.target);
          entry.target.classList.add("is-in");
          revealObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );

    /* Stagger siblings that share a parent so a group rises one after another. */
    document.querySelectorAll<HTMLElement>(".jrp [data-reveal]").forEach((el) => {
      const siblings = [...(el.parentElement?.children ?? [])].filter((child) =>
        child.hasAttribute("data-reveal"),
      );
      if (siblings.length > 1) {
        el.style.setProperty("--reveal-delay", `${siblings.indexOf(el) * 80}ms`);
      }
      revealObserver.observe(el);
    });

    const condensed = new WeakSet<Element>();
    const condenseObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || condensed.has(entry.target)) return;
          condensed.add(entry.target);
          entry.target.classList.add("is-condensed");
          condenseObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    document.querySelectorAll(".jrp [data-condense]").forEach((el) => condenseObserver.observe(el));

    /* The hero draws its own line on load; every other band draws on entry. */
    const drawn = new WeakSet<HTMLElement>();
    const drawObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting || drawn.has(entry.target as HTMLElement)) return;
          const target = entry.target as HTMLElement;
          drawn.add(target);
          target.style.setProperty("--draw", "1");
          drawObserver.unobserve(entry.target);
        });
      },
      { rootMargin: "0px 0px -5% 0px" },
    );
    document.querySelectorAll<HTMLElement>(".jrp .band, .jrp .about").forEach((el) => {
      el.style.setProperty("--draw", "0");
      drawObserver.observe(el);
    });
    document.querySelectorAll<HTMLElement>(".jrp .pillar, .jrp .work__mid").forEach((el) => {
      el.style.setProperty("--draw", "0");
      drawObserver.observe(el);
    });
    const hero = document.querySelector<HTMLElement>(".jrp .hero");
    if (hero) {
      hero.style.setProperty("--draw", "0");
      requestAnimationFrame(() => {
        window.setTimeout(() => hero.style.setProperty("--draw", "1"), reduceMotion ? 0 : 600);
      });
    }

    cleanups.push(() => {
      revealObserver.disconnect();
      condenseObserver.disconnect();
      drawObserver.disconnect();
    });

    /* ---------------- Reading progress ---------------- */
    if (!reduceMotion) {
      const progress = document.createElement("div");
      progress.className = "progress";
      progress.setAttribute("aria-hidden", "true");
      progress.innerHTML =
        '<span class="progress__value">0%</span><span class="progress__line"><span class="progress__fill"></span></span>';
      document.body.appendChild(progress);
      const value = progress.querySelector<HTMLElement>(".progress__value");
      const fill = progress.querySelector<HTMLElement>(".progress__fill");
      let shown = -1;
      const update = () => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
        if (fill) fill.style.transform = `scaleY(${p.toFixed(4)})`;
        const pct = Math.round(p * 100);
        if (pct !== shown && value) {
          shown = pct;
          value.textContent = `${pct}%`;
        }
      };
      update();
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update);
      cleanups.push(() => {
        window.removeEventListener("scroll", update);
        window.removeEventListener("resize", update);
        progress.remove();
      });
    }

    /* ---------------- Cursor pill ---------------- */
    if (finePointer && document.querySelector(".jrp [data-cursor-pill]")) {
      const pill = document.createElement("div");
      pill.className = "cursor-pill";
      pill.setAttribute("aria-hidden", "true");
      document.body.appendChild(pill);

      let current: Element | null = null;
      let x = 0;
      let y = 0;
      let tx = 0;
      let ty = 0;
      let scale = 0;
      let scaleTarget = 0;
      let skew = 0;
      let offX = 0;
      let lastX = 0;
      let flipped = false;
      let raf = 0;

      const side = (px: number) => {
        const flip = Boolean(current) && px + pill.offsetWidth + 16 > window.innerWidth;
        if (flip === flipped) return;
        flipped = flip;
        offX += ((flip ? -pill.offsetWidth : 0) - offX) * 0.4;
        pill.style.transformOrigin = flip ? "100% 0" : "0 0";
      };

      const onMove = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        tx = event.clientX;
        ty = event.clientY;
        side(tx);
        if (current) {
          const next = Math.max(-10, Math.min(10, (lastX - event.clientX) * 0.6));
          skew += (next - skew) * 0.3;
        } else {
          skew *= 0.8;
        }
        lastX = event.clientX;
        if (scale < 0.05) {
          x = tx;
          y = ty;
        }
      };

      const show = (element: Element | null) => {
        if (element === current) return;
        if (!element) {
          current = null;
          scaleTarget = 0;
          return;
        }
        current = element;
        const data = (element as HTMLElement).dataset;
        pill.textContent = data.cursorPill ?? "";
        const note = data.cursorNote;
        pill.classList.toggle("has-note", Boolean(note));
        if (note) {
          const small = document.createElement("span");
          small.className = "cursor-pill__note";
          small.textContent = note;
          pill.appendChild(small);
        }
        side(tx);
        scaleTarget = 1;
        if (scale < 0.05) {
          x = tx;
          y = ty;
        }
      };

      const onOver = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        show((event.target as Element | null)?.closest("[data-cursor-pill]") ?? null);
      };
      const onLeave = () => show(null);

      const tick = () => {
        x += (tx - x) * 0.32;
        y += (ty - y) * 0.32;
        scale += (scaleTarget - scale) * (scaleTarget > scale ? 0.22 : 0.3);
        const targetOff = flipped && current ? -pill.offsetWidth : 0;
        offX += (targetOff - offX) * 0.3;
        pill.style.opacity = scale > 0.02 ? "1" : "0";
        pill.style.transform = `translate(${(x + offX).toFixed(1)}px, ${y.toFixed(1)}px) scale(${scale.toFixed(
          3,
        )}) skewX(${skew.toFixed(2)}deg)`;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("pointerover", onOver);
      document.documentElement.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerover", onOver);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        pill.remove();
      });
    }

    /* ---------------- Cursor trail ---------------- */
    if (finePointer && !reduceMotion) {
      const canvas = document.createElement("canvas");
      canvas.className = "cursor-trail";
      canvas.setAttribute("aria-hidden", "true");
      document.body.appendChild(canvas);
      const ctx = canvas.getContext("2d");
      const COUNT = 14;
      const HEAD = 4;
      const FOLLOW = 0.42;
      const points = Array.from({ length: COUNT }, () => ({ x: -100, y: -100 }));
      const mouse = { x: -100, y: -100 };
      let alpha = 0;
      let seen = false;

      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      resize();

      const onPointer = (event: PointerEvent) => {
        if (event.pointerType !== "mouse") return;
        mouse.x = event.clientX;
        mouse.y = event.clientY;
        if (!seen) {
          points.forEach((p) => {
            p.x = mouse.x;
            p.y = mouse.y;
          });
          seen = true;
        }
      };
      const onLeave = () => {
        seen = false;
        alpha = 0;
      };

      let raf = 0;
      const tick = () => {
        if (ctx) {
          points[0].x += (mouse.x - points[0].x) * 0.6;
          points[0].y += (mouse.y - points[0].y) * 0.6;
          for (let i = 1; i < COUNT; i++) {
            points[i].x += (points[i - 1].x - points[i].x) * FOLLOW;
            points[i].y += (points[i - 1].y - points[i].y) * FOLLOW;
          }
          const tail = Math.hypot(points[0].x - points[COUNT - 1].x, points[0].y - points[COUNT - 1].y);
          const hasPill = document.querySelector(".cursor-pill:not([style*='hidden'])");
          const target = seen && !hasPill ? Math.min(1, tail / 40) : 0;
          alpha += (target - alpha) * 0.2;
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
          if (alpha > 0.01) {
            ctx.globalAlpha = alpha;
            ctx.strokeStyle = "#fff";
            ctx.lineCap = "round";
            for (let i = 0; i < COUNT - 1; i++) {
              ctx.lineWidth = HEAD * 2 * (1 - i / COUNT);
              ctx.beginPath();
              ctx.moveTo(points[i].x, points[i].y);
              ctx.lineTo(points[i + 1].x, points[i + 1].y);
              ctx.stroke();
            }
          }
        }
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      window.addEventListener("pointermove", onPointer, { passive: true });
      window.addEventListener("resize", resize);
      document.documentElement.addEventListener("pointerleave", onLeave);
      cleanups.push(() => {
        cancelAnimationFrame(raf);
        window.removeEventListener("pointermove", onPointer);
        window.removeEventListener("resize", resize);
        document.documentElement.removeEventListener("pointerleave", onLeave);
        canvas.remove();
      });
    }

    /* ---------------- Whole-row case-study links ---------------- */
    const cards = [...document.querySelectorAll<HTMLElement>(".jrp [data-href]")];
    const cardCleanups: Array<() => void> = [];
    cards.forEach((card) => {
      const open = (newTab: boolean) => {
        const href = card.dataset.href;
        if (!href) return;
        if (newTab || card.hasAttribute("data-external")) window.open(href, "_blank", "noopener");
        else window.location.href = href;
      };
      const onClick = (event: MouseEvent) => {
        if ((event.target as Element).closest("a, button")) return;
        if (String(window.getSelection())) return;
        open(event.metaKey || event.ctrlKey || event.shiftKey);
      };
      const onAux = (event: MouseEvent) => {
        if (event.button === 1 && !(event.target as Element).closest("a, button")) open(true);
      };
      card.addEventListener("click", onClick);
      card.addEventListener("auxclick", onAux);
      cardCleanups.push(() => {
        card.removeEventListener("click", onClick);
        card.removeEventListener("auxclick", onAux);
      });
    });
    cleanups.push(() => cardCleanups.forEach((fn) => fn()));

    /* ---------------- Hover sounds ---------------- */
    const main = document.querySelector<HTMLElement>(".jrp");
    if (main) attachHoverSounds(main);

    return () => {
      cleanups.forEach((fn) => fn());
      root.classList.remove("jrp-js");
    };
  }, []);

  return null;
}
