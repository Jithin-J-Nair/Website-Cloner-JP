"use client";

import React, { useEffect, useRef, useState } from "react";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { soundEngine } from "@/lib/audio";
import { LUSION_GLOBAL_CHROME } from "@/data/reference";

export type ContactCtaTheme = "blue-flip" | "home-dark";

/**
 * Interactive 2D FLIP / PBD Geometric Shape Particle Heap (`#end-section` on `/about` & subpages)
 * Matches `about-05-end-cta-flip` across desktop (1440x900, 1024x768) and mobile (390x844):
 * crisp white squares, 4-point diamonds/stars, and plus marks settling into a central pyramid mound
 * above the bottom `CONTINUE TO SCROLL` pill while reacting dynamically to pointer & scroll velocity.
 */
function FlipShapeTankCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    interface ShapeParticle {
      x: number;
      y: number;
      vx: number;
      vy: number;
      homeX: number;
      homeY: number;
      size: number;
      rot: number;
      vrot: number;
      kind: 0 | 1 | 2;
    }

    let width = 0;
    let height = 0;
    let dpr = 1;
    let particles: ShapeParticle[] = [];
    let rafId = 0;
    let inView = true;
    let docVisible = true;
    let lastScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let scrollImpulse = 0;

    const pointer = {
      x: -9999,
      y: -9999,
      vx: 0,
      vy: 0,
      active: false,
    };

    let seed = 20261022;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      return seed / 4294967296;
    };

    const buildHeap = (w: number, h: number) => {
      seed = 20261022;
      const isMobile = w < 760;
      const count = isMobile ? 520 : 680;
      const spacing = isMobile ? 9.4 : 11.2;
      const apexY = h * (isMobile ? 0.46 : 0.51);
      const baseY = h * 0.995;
      const spanY = Math.max(120, baseY - apexY);
      const halfBaseW = w * (isMobile ? 0.43 : 0.255);

      const list: ShapeParticle[] = [];
      let row = 0;
      while (list.length < count) {
        const t = Math.min(1, (row * spacing * 0.86) / spanY);
        const yRow = apexY + t * spanY;
        const halfW = 18 + Math.pow(t, 1.32) * halfBaseW;
        const cols = Math.max(2, Math.floor((halfW * 2) / spacing));
        for (let c = 0; c < cols && list.length < count; c++) {
          const frac = cols <= 1 ? 0 : (c / (cols - 1)) * 2 - 1;
          const jitterX = (rand() - 0.5) * spacing * 0.72;
          const jitterY = (rand() - 0.5) * spacing * 0.68;
          const hx = w * 0.5 + frac * halfW + jitterX;
          const hy = Math.min(h - 4, yRow + Math.abs(frac) * 8 + jitterY);
          const kindRoll = rand();
          const kind: 0 | 1 | 2 =
            kindRoll < 0.46 - t * 0.22 ? 0 : kindRoll < 0.76 ? 2 : 1;
          list.push({
            x: hx,
            y: hy,
            vx: 0,
            vy: 0,
            homeX: hx,
            homeY: hy,
            size: (isMobile ? 3.5 : 4.2) + rand() * 1.4,
            rot: rand() * Math.PI,
            vrot: (rand() - 0.5) * 0.02,
            kind,
          });
        }
        row++;
        if (row > 160) break;
      }
      particles = list;
    };

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      width = Math.max(1, parent.clientWidth);
      height = Math.max(1, parent.clientHeight);
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      buildHeap(width, height);
    };

    const drawParticle = (p: ShapeParticle) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      const s = p.size;
      if (p.kind === 0) {
        ctx.fillRect(-s * 0.82, -s * 0.82, s * 1.64, s * 1.64);
      } else if (p.kind === 2) {
        const arm = s * 1.15;
        const th = Math.max(1.35, s * 0.42);
        ctx.fillRect(-arm, -th * 0.5, arm * 2, th);
        ctx.fillRect(-th * 0.5, -arm, th, arm * 2);
      } else {
        ctx.beginPath();
        const outer = s * 1.25;
        const inner = s * 0.36;
        for (let i = 0; i < 8; i++) {
          const r = i % 2 === 0 ? outer : inner;
          const a = (i * Math.PI) / 4;
          const px = Math.cos(a) * r;
          const py = Math.sin(a) * r;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    };

    const renderFrame = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);

      const streamGrad = ctx.createLinearGradient(width * 0.47, 0, width * 0.53, 0);
      streamGrad.addColorStop(0, "rgba(8, 22, 185, 0)");
      streamGrad.addColorStop(0.45, "rgba(6, 18, 165, 0.34)");
      streamGrad.addColorStop(0.55, "rgba(42, 92, 255, 0.22)");
      streamGrad.addColorStop(1, "rgba(8, 22, 185, 0)");
      ctx.fillStyle = streamGrad;
      ctx.fillRect(width * 0.465, 0, width * 0.07, height * 0.62);

      ctx.fillStyle = "#ffffff";

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        if (!reducedMotion) {
          const dxHome = p.homeX - p.x;
          const dyHome = p.homeY - p.y;
          p.vx += dxHome * 0.055;
          p.vy += dyHome * 0.055 - scrollImpulse * 0.16;

          if (pointer.active) {
            const dx = p.x - pointer.x;
            const dy = p.y - pointer.y;
            const d2 = dx * dx + dy * dy;
            const rad = 115;
            if (d2 < rad * rad && d2 > 0.01) {
              const d = Math.sqrt(d2);
              const f = (1 - d / rad) * 2.8;
              p.vx += (dx / d) * f + pointer.vx * 0.14;
              p.vy += (dy / d) * f + pointer.vy * 0.14;
              p.vrot += (dx / d) * 0.015;
            }
          }

          p.vx *= 0.84;
          p.vy *= 0.84;
          p.vrot *= 0.94;
          p.x += p.vx;
          p.y = Math.min(height - 3, p.y + p.vy);
          p.rot += p.vrot;
        }
        drawParticle(p);
      }

      scrollImpulse *= 0.86;
      pointer.vx *= 0.8;
      pointer.vy *= 0.8;
    };

    const loop = () => {
      if (!inView || !docVisible) {
        rafId = 0;
        return;
      }
      renderFrame();
      if (!reducedMotion) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    const ensureRunning = () => {
      if (reducedMotion) {
        renderFrame();
        return;
      }
      if (!rafId && inView && docVisible) {
        rafId = window.requestAnimationFrame(loop);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      pointer.vx = nx - pointer.x;
      pointer.vy = ny - pointer.y;
      pointer.x = nx;
      pointer.y = ny;
      pointer.active = nx >= -40 && nx <= rect.width + 40 && ny >= -40 && ny <= rect.height + 40;
    };

    const onPointerLeave = () => {
      pointer.active = false;
    };

    const onScroll = () => {
      const sy = window.scrollY;
      const delta = Math.max(-24, Math.min(24, sy - lastScrollY));
      lastScrollY = sy;
      if (Math.abs(delta) < 120) {
        scrollImpulse = Math.max(-6, Math.min(6, scrollImpulse + delta * 0.04));
      }
      ensureRunning();
    };

    const onVisibility = () => {
      docVisible = document.visibilityState === "visible";
      ensureRunning();
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        ensureRunning();
      },
      { threshold: 0.01 }
    );

    const ro = new ResizeObserver(() => {
      resize();
      renderFrame();
    });

    resize();
    renderFrame();
    io.observe(canvas);
    if (canvas.parentElement) ro.observe(canvas.parentElement);
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerleave", onPointerLeave, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    ensureRunning();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}

/**
 * Shared Lusion End-Section CTA (`#end-section`)
 * - `theme="blue-flip"`: Royal-blue `#1736ff` full-bleed sticky stage with 4 quadrant `+` crosshairs,
 *   `"IS YOUR BIG IDEA READY TO GO WILD?"`, `"Let's work together!"`, interactive white geometric FLIP
 *   shape heap, and floating white `"CONTINUE TO SCROLL"` pill (`about-05-end-cta-flip`).
 * - `theme="home-dark"`: Pure `#000000` space backdrop immediately after `#home-goal`, hosting the
 *   standing 3D EVA astronaut, diamonds & pop-art stickers (`home-10-end-cta-wait`) followed by the CTA.
 */
export function ContactCtaSection({
  sectionId = "end-section",
  theme = "blue-flip",
}: {
  sectionId?: string;
  theme?: ContactCtaTheme;
} = {}) {
  const [copiedNotice, setCopiedNotice] = useState(false);

  const handleEmailTrigger = () => {
    soundEngine.playClick();
    try {
      navigator.clipboard?.writeText(LUSION_GLOBAL_CHROME.footer.businessEmail);
      setCopiedNotice(true);
      window.setTimeout(() => setCopiedNotice(false), 2600);
    } catch {
      // Clipboard optional
    }
  };

  if (theme === "home-dark") {
    return (
      <SurfaceSection
        id={sectionId}
        surface="void"
        webglMode="contact-beacon"
        className="relative z-[20] w-full !bg-transparent py-0 text-[#ffffff]"
      >
        <style>{`
          .home-end-cta-shell {
            min-height: 248vh;
          }
          .home-end-cta-pad {
            padding-top: 124vh;
            padding-bottom: 28vh;
          }
          @media (max-width: 819px) {
            .home-end-cta-shell {
              min-height: 218vh;
            }
            .home-end-cta-pad {
              padding-top: 108vh;
              padding-bottom: 24vh;
            }
          }
        `}</style>

        <div className="home-end-cta-shell relative flex w-full flex-col justify-between bg-transparent pt-[26vh]">
          <div
            id="end-section-outer"
            className="home-end-cta-pad relative mx-auto flex w-full flex-col items-center justify-center px-[var(--base-padding-x)]"
          >
            {/* Symmetric Quadrant + Center Registration Crosshairs matching Reference Frames 19 & 20 */}
            <div
              id="end-section-content-crosses"
              aria-hidden="true"
              className="pointer-events-none relative mx-auto mb-10 flex w-full items-center justify-between px-[1vw] text-white/90"
            >
              <span className="lusion-plus-cross" />
              <span className="lusion-plus-cross" />
            </div>

            <div id="end-section-content" className="relative z-20 w-full text-center">
              <div id="end-section-subtitle" className="overflow-hidden">
                <p
                  id="end-section-subtitle-text"
                  className="mx-auto max-w-[26ch] font-sans text-[clamp(0.84rem,1.06vw,1.08rem)] font-normal uppercase leading-[1.35] tracking-[0.04em] text-white sm:max-w-none sm:whitespace-nowrap"
                >
                  {LUSION_GLOBAL_CHROME.endSection.subtitle}
                </p>
              </div>

              <div id="end-section-title" className="group relative mx-auto mt-5 w-fit">
                <a
                  id="end-section-title-link"
                  href={`mailto:${LUSION_GLOBAL_CHROME.footer.businessEmail}`}
                  onClick={handleEmailTrigger}
                  onMouseEnter={() => soundEngine.playHover()}
                  className="block font-sans text-[17.2vw] font-normal leading-[0.98] tracking-[-0.03em] text-white drop-shadow-[0_6px_28px_rgba(0,0,0,0.45)] sm:text-[8.2vw] min-[1800px]:text-[9.5rem]"
                >
                  Let&apos;s work
                  <br />
                  together!
                </a>
                <span id="end-section-title-top-decoration" aria-hidden="true" className="sr-only" />
                <span id="end-section-title-bottom-left-decoration" aria-hidden="true" className="sr-only" />
                <span id="end-section-title-bottom-right-decoration" aria-hidden="true" className="sr-only" />
              </div>

              {copiedNotice && (
                <p
                  role="status"
                  className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-[#c1ff00]"
                >
                  {LUSION_GLOBAL_CHROME.footer.businessEmail} copied to clipboard
                </p>
              )}

              {/* Lower Quadrant + Center Registration Crosshairs (`Frames 19 & 20`) */}
              <div
                aria-hidden="true"
                className="pointer-events-none mx-auto mt-16 flex w-full items-center justify-between px-[1vw] text-white/90"
              >
                <span className="lusion-plus-cross" />
                <span className="lusion-plus-cross" />
                <span className="lusion-plus-cross" />
              </div>
            </div>
          </div>

          {/* Sticky Bottom White Pill (`#end-bottom` — visible throughout `#end-section` wait & CTA, stops cleanly before `#footer-section`) */}
          <div className="pointer-events-none sticky bottom-7 z-30 flex w-full justify-center pb-8">
            <a
              id="end-bottom"
              href="#footer-section"
              onClick={(e) => {
                e.preventDefault();
                soundEngine.playClick();
                document.getElementById("footer-section")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="pointer-events-auto inline-flex h-[3.1rem] min-w-[238px] items-center justify-between gap-4 rounded-full bg-white px-6 !text-black shadow-[0_10px_30px_rgba(0,0,0,0.45)] transition-transform duration-300 hover:scale-[1.03]"
            >
              <span aria-hidden="true" className="text-xs leading-none text-black/80">
                ↓
              </span>
              <span
                id="end-bottom-text-container"
                className="relative h-[1.1rem] overflow-hidden font-sans text-[0.74rem] font-medium uppercase leading-[1.1rem] tracking-[0.06em]"
              >
                <span className="lusion-ticker-line block">
                  <span className="block">{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span>
                  <span className="block" aria-hidden="true">
                    {LUSION_GLOBAL_CHROME.endSection.bottomTickerText}
                  </span>
                </span>
              </span>
              <span aria-hidden="true" className="text-xs leading-none text-black/80">
                ↓
              </span>
            </a>
          </div>
        </div>
      </SurfaceSection>
    );
  }

  return (
    <SurfaceSection
      id={sectionId}
      surface="cobalt"
      webglMode="contact-beacon"
      className="relative z-10 w-full !bg-[#1736ff] py-0 text-[#ffffff]"
    >
      <div style={{ minHeight: "180vh" }} className="relative w-full bg-[#1736ff]">
        <div
          id="end-section-outer"
          className="sticky top-0 flex h-screen w-full flex-col items-center justify-center overflow-hidden bg-[#1736ff] px-[var(--base-padding-x)] text-white"
        >
          {/* Quadrant '+' Crosshairs matching real `lusion.co/about/` `#end-section` */}
          <div
            id="end-section-content-crosses"
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[6.8%] top-[27%] bottom-[24%] z-20"
          >
            <span className="lusion-plus-cross absolute left-0 top-0 text-white" />
            <span className="lusion-plus-cross absolute right-0 top-0 text-white" />
            <span className="lusion-plus-cross absolute left-0 bottom-0 text-white" />
            <span className="lusion-plus-cross absolute right-0 bottom-0 text-white" />
          </div>

          {/* Center Editorial CTA (`#end-section-content`) */}
          <div id="end-section-content" className="relative z-10 -mt-[10vh] w-full text-center">
            <div id="end-section-subtitle" className="overflow-hidden">
              <p
                id="end-section-subtitle-text"
                className="mx-auto max-w-[18ch] font-sans text-[clamp(0.75rem,0.98vw,0.95rem)] font-normal uppercase leading-[1.35] tracking-[0.04em] text-white/95"
              >
                {LUSION_GLOBAL_CHROME.endSection.subtitle}
              </p>
            </div>

            <div id="end-section-title" className="group relative mx-auto mt-4 w-fit">
              <a
                id="end-section-title-link"
                href={`mailto:${LUSION_GLOBAL_CHROME.footer.businessEmail}`}
                onClick={handleEmailTrigger}
                onMouseEnter={() => soundEngine.playHover()}
                className="block font-sans text-[17.5vw] font-normal leading-[0.98] tracking-[-0.03em] text-white sm:text-[8.6vw] min-[1800px]:text-[9.5rem]"
              >
                Let&apos;s work
                <br />
                together!
              </a>
              <span id="end-section-title-top-decoration" aria-hidden="true" className="sr-only" />
              <span id="end-section-title-bottom-left-decoration" aria-hidden="true" className="sr-only" />
              <span id="end-section-title-bottom-right-decoration" aria-hidden="true" className="sr-only" />
            </div>

            {copiedNotice && (
              <p
                role="status"
                className="mt-5 font-mono text-xs uppercase tracking-[0.08em] text-[#c1ff00]"
              >
                {LUSION_GLOBAL_CHROME.footer.businessEmail} copied to clipboard
              </p>
            )}
          </div>

          {/* Interactive 2D FLIP White Geometric Shape Heap rising over lower title & floor */}
          <div className="pointer-events-none absolute inset-0 z-20">
            <FlipShapeTankCanvas />
          </div>

          {/* Bottom Floating White Scroll Pill (`#end-bottom`) */}
          <a
            id="end-bottom"
            href="#footer-section"
            onClick={(e) => {
              e.preventDefault();
              soundEngine.playClick();
              document.getElementById("footer-section")?.scrollIntoView({ behavior: "smooth" });
            }}
            className="pointer-events-auto absolute bottom-7 left-1/2 z-30 inline-flex h-[3.1rem] min-w-[238px] -translate-x-1/2 items-center justify-between gap-4 rounded-full bg-white px-6 !text-black shadow-[0_10px_28px_rgba(0,0,0,0.22)] transition-transform duration-300 hover:scale-[1.03]"
          >
            <span aria-hidden="true" className="text-xs leading-none text-black/80">
              ↓
            </span>
            <span
              id="end-bottom-text-container"
              className="relative h-[1.1rem] overflow-hidden font-sans text-[0.74rem] font-medium uppercase leading-[1.1rem] tracking-[0.06em]"
            >
              <span className="lusion-ticker-line block">
                <span className="block">{LUSION_GLOBAL_CHROME.endSection.bottomTickerText}</span>
                <span className="block" aria-hidden="true">
                  {LUSION_GLOBAL_CHROME.endSection.bottomTickerText}
                </span>
              </span>
            </span>
            <span aria-hidden="true" className="text-xs leading-none text-black/80">
              ↓
            </span>
          </a>
        </div>
      </div>
    </SurfaceSection>
  );
}
