"use client";

import React, { useEffect, useRef, useState } from "react";
import { LUSION_HOME } from "@/data/reference";
import { useStudioStore } from "@/lib/store";

/**
 * Clean-Room Shaded 3D EVA Space Astronaut + Chromatic Prism Eclipse Canvas
 *
 * Reconstructs the iconic `lusion.co` `#home-goal` deep-space sequence verified in
 * `ref-07-goal-stage1-dark--1440x900.png`, `ref-08-goal-stage2-white--1440x900.png`,
 * `ref-08-goal-stage2-white--390x844.png`, and `ref-10-footer-portal--1440x900.png`:
 *   - Pure `#000000` cosmos framed around the outer perimeter by a subtle warm spectral
 *     chromatic dispersion ring (`amber -> cream -> cyan -> deep indigo -> black`)
 *   - Volumetric studio-lit white EVA spacesuit sculpture with obsidian mirror visor,
 *     6-point specular star glint, harness straps, chest life-support pack, and zero-G float
 *   - Motion-blurred emergence in Stage 1 (`ref-07`) settling into razor-sharp focus in Stage 2 (`ref-08`)
 */
function AstronautCosmosCanvas({
  progress,
  reducedMotion,
}: {
  progress: number;
  reducedMotion: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let inView = true;
    let phase = 0;

    const resize = () => {
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width * dpr));
      const h = Math.max(320, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawShadedCapsule = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      r1: number,
      r2: number,
      lit = 1
    ) => {
      const steps = 14;
      for (let i = 0; i <= steps; i += 1) {
        const u = i / steps;
        const cx = x1 + (x2 - x1) * u;
        const cy = y1 + (y2 - y1) * u;
        const rr = r1 + (r2 - r1) * u + Math.sin(u * Math.PI * 5) * r1 * 0.05;
        const g = ctx.createRadialGradient(
          cx - rr * 0.28,
          cy - rr * 0.34,
          rr * 0.08,
          cx,
          cy,
          rr
        );
        const hi = Math.round(244 * lit);
        const mid = Math.round(206 * lit);
        const low = Math.round(126 * lit);
        g.addColorStop(0, `rgb(${hi},${hi},${Math.min(255, hi + 4)})`);
        g.addColorStop(0.62, `rgb(${mid},${mid + 2},${mid + 8})`);
        g.addColorStop(1, `rgb(${low},${low + 3},${low + 10})`);
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, rr), 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }
    };

    const render = () => {
      if (!reducedMotion) phase += 0.018;
      const p = progressRef.current;
      const w = canvas.width;
      const h = canvas.height;
      const isMobile = w < h * 0.82;

      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, w, h);

      // 1. Centered Spectral Prism Eclipse Halo around outer perimeter (`ref-08--1440x900` & `390x844`)
      const haloAlpha = Math.min(1, Math.max(0.18, (p - 0.35) / 0.32));
      const haloR = isMobile ? w * 0.96 : Math.max(w * 0.50, h * 0.86);
      const halo = ctx.createRadialGradient(w * 0.5, h * 0.5, haloR * 0.62, w * 0.5, h * 0.5, haloR);
      halo.addColorStop(0.0, "rgba(0, 0, 0, 0)");
      halo.addColorStop(0.45, `rgba(118, 86, 42, ${(0.22 * haloAlpha).toFixed(3)})`);
      halo.addColorStop(0.65, `rgba(202, 182, 148, ${(0.30 * haloAlpha).toFixed(3)})`);
      halo.addColorStop(0.78, `rgba(116, 152, 196, ${(0.20 * haloAlpha).toFixed(3)})`);
      halo.addColorStop(0.92, `rgba(42, 54, 92, ${(0.10 * haloAlpha).toFixed(3)})`);
      halo.addColorStop(1.0, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, w, h);

      // 2. Monumental Subtle Dark-Graphite Kinetic Backdrop Typography on Mobile (`ref-08--390x844`)
      if (isMobile && p > 0.52) {
        const bgTextAlpha = Math.min(0.085, ((p - 0.52) / 0.25) * 0.085);
        ctx.save();
        ctx.fillStyle = `rgba(255, 255, 255, ${bgTextAlpha.toFixed(4)})`;
        ctx.font = `600 ${Math.round(h * 0.30)}px LusionSansCalibrated, system-ui, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText("LET", w * 0.47, h * 0.68);
        ctx.fillText("A", w * 0.20, h * 0.30);
        ctx.restore();
      }

      // 3. Shaded 3D White EVA Space Astronaut (`ref-07` soft blur -> `ref-08` crisp focus)
      const astroPresence = Math.min(1, Math.max(0, (p - 0.24) / 0.22));
      if (astroPresence > 0.02) {
        const bobY = reducedMotion ? 0 : Math.sin(phase) * (h * 0.008);
        const motionPasses = p < 0.56 && !reducedMotion ? 5 : 1;

        for (let pass = 0; pass < motionPasses; pass += 1) {
          const offsetPass =
            motionPasses === 1 ? 0 : (pass / (motionPasses - 1) - 0.5) * (w * 0.028 * (1 - p));
          ctx.save();
          ctx.globalAlpha =
            motionPasses === 1 ? astroPresence : (astroPresence / motionPasses) * 1.45;

          if (isMobile) {
            // Compact zero-G floating EVA figure (`ref-08--390x844.png`)
            const cx = w * 0.49 + offsetPass;
            const cy = h * 0.585 + bobY;
            const sc = w * 0.195;

            // Legs
            drawShadedCapsule(cx - sc * 0.2, cy + sc * 0.22, cx - sc * 0.26, cy + sc * 0.78, sc * 0.13, sc * 0.095);
            drawShadedCapsule(cx + sc * 0.18, cy + sc * 0.22, cx + sc * 0.28, cy + sc * 0.76, sc * 0.13, sc * 0.095);
            // Outstretched arms
            drawShadedCapsule(cx - sc * 0.28, cy - sc * 0.18, cx - sc * 0.68, cy - sc * 0.12, sc * 0.11, sc * 0.085);
            drawShadedCapsule(cx + sc * 0.28, cy - sc * 0.18, cx + sc * 0.64, cy - sc * 0.10, sc * 0.11, sc * 0.085);
            // Torso + PLSS Backpack
            drawShadedCapsule(cx, cy - sc * 0.2, cx, cy + sc * 0.2, sc * 0.27, sc * 0.23, 0.98);
            ctx.fillStyle = "rgb(232,235,242)";
            ctx.beginPath();
            ctx.roundRect(cx - sc * 0.2, cy - sc * 0.28, sc * 0.4, sc * 0.44, sc * 0.08);
            ctx.fill();
            // Helmet
            const hg = ctx.createRadialGradient(cx - sc * 0.06, cy - sc * 0.48, sc * 0.04, cx, cy - sc * 0.42, sc * 0.2);
            hg.addColorStop(0, "#ffffff");
            hg.addColorStop(0.7, "#cfd4df");
            hg.addColorStop(1, "#7b8190");
            ctx.beginPath();
            ctx.arc(cx, cy - sc * 0.42, sc * 0.19, 0, Math.PI * 2);
            ctx.fillStyle = hg;
            ctx.fill();
          } else {
            // Heroic foreground EVA Astronaut facing camera with mirror visor + star flare (`ref-08--1440x900.png`)
            const cx = w * 0.485 + offsetPass;
            const headY = h * 0.505 + bobY;
            const sc = h * 0.34;

            // PLSS Backpack shoulders behind helmet
            ctx.fillStyle = "#adb3bf";
            ctx.beginPath();
            ctx.roundRect(cx - sc * 0.44, headY + sc * 0.18, sc * 0.88, sc * 0.56, sc * 0.1);
            ctx.fill();

            // Outstretched zero-G articulated arms (`ref-08`)
            drawShadedCapsule(cx - sc * 0.38, headY + sc * 0.46, cx - sc * 0.82, headY + sc * 0.42, sc * 0.16, sc * 0.135);
            drawShadedCapsule(cx - sc * 0.82, headY + sc * 0.42, cx - sc * 1.02, headY + sc * 0.22, sc * 0.13, sc * 0.11);
            drawShadedCapsule(cx + sc * 0.38, headY + sc * 0.46, cx + sc * 0.80, headY + sc * 0.40, sc * 0.16, sc * 0.135);
            drawShadedCapsule(cx + sc * 0.80, headY + sc * 0.40, cx + sc * 0.94, headY + sc * 0.16, sc * 0.13, sc * 0.11);

            //EVA Torso & Lower Suit extending to bottom viewport edge
            drawShadedCapsule(cx, headY + sc * 0.44, cx, headY + sc * 1.05, sc * 0.41, sc * 0.35);
            drawShadedCapsule(cx - sc * 0.19, headY + sc * 1.05, cx - sc * 0.25, h + sc * 0.2, sc * 0.21, sc * 0.19);
            drawShadedCapsule(cx + sc * 0.19, headY + sc * 1.05, cx + sc * 0.25, h + sc * 0.2, sc * 0.21, sc * 0.19);

            // Black EVA Harness Straps & Chest Control Module (`ref-08`)
            ctx.fillStyle = "#17191e";
            ctx.fillRect(cx - sc * 0.30, headY + sc * 0.26, sc * 0.055, sc * 0.52);
            ctx.fillRect(cx + sc * 0.245, headY + sc * 0.26, sc * 0.055, sc * 0.52);
            ctx.fillRect(cx - sc * 0.30, headY + sc * 0.50, sc * 0.60, sc * 0.032);

            // White Spherical EVA Helmet Shell
            const helmetR = sc * 0.32;
            const helmGrad = ctx.createRadialGradient(
              cx - helmetR * 0.25,
              headY - helmetR * 0.35,
              helmetR * 0.08,
              cx,
              headY,
              helmetR
            );
            helmGrad.addColorStop(0, "#ffffff");
            helmGrad.addColorStop(0.68, "#d8dde6");
            helmGrad.addColorStop(1, "#7d8390");
            ctx.beginPath();
            ctx.arc(cx, headY, helmetR, 0, Math.PI * 2);
            ctx.fillStyle = helmGrad;
            ctx.fill();

            // Obsidian Reflective Visor Dome
            const visorGrad = ctx.createLinearGradient(cx - helmetR, headY - helmetR * 0.5, cx + helmetR, headY + helmetR * 0.5);
            visorGrad.addColorStop(0, "#191c22");
            visorGrad.addColorStop(0.35, "#050608");
            visorGrad.addColorStop(1, "#000000");
            ctx.beginPath();
            ctx.ellipse(cx, headY + helmetR * 0.05, helmetR * 0.80, helmetR * 0.62, 0, 0, Math.PI * 2);
            ctx.fillStyle = visorGrad;
            ctx.fill();
            ctx.lineWidth = Math.max(1.5, sc * 0.012);
            ctx.strokeStyle = "rgba(255,255,255,0.42)";
            ctx.stroke();

            // Signature Specular Star-Flare on Upper-Left Visor Rim (`ref-08`)
            if (p >= 0.52) {
              const gx = cx - helmetR * 0.54;
              const gy = headY - helmetR * 0.16;
              const flareGlow = ctx.createRadialGradient(gx, gy, 0, gx, gy, helmetR * 0.45);
              flareGlow.addColorStop(0, "rgba(255,255,255,0.95)");
              flareGlow.addColorStop(0.25, "rgba(255,255,255,0.28)");
              flareGlow.addColorStop(1, "rgba(255,255,255,0)");
              ctx.fillStyle = flareGlow;
              ctx.beginPath();
              ctx.arc(gx, gy, helmetR * 0.45, 0, Math.PI * 2);
              ctx.fill();

              ctx.strokeStyle = "rgba(255,255,255,0.55)";
              ctx.lineWidth = 1;
              for (let a = 0; a < 4; a += 1) {
                const ang = (a * Math.PI) / 4;
                const len = a % 2 === 0 ? helmetR * 0.68 : helmetR * 0.38;
                ctx.beginPath();
                ctx.moveTo(gx - Math.cos(ang) * len, gy - Math.sin(ang) * len);
                ctx.lineTo(gx + Math.cos(ang) * len, gy + Math.sin(ang) * len);
                ctx.stroke();
              }
            }
          }

          ctx.restore();
        }
      }

      if (!reducedMotion && inView) {
        rafId = requestAnimationFrame(render);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const nextVis = entries[0]?.isIntersecting ?? true;
        if (nextVis && !inView && !reducedMotion) {
          inView = true;
          rafId = requestAnimationFrame(render);
        } else {
          inView = nextVis;
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    render();
    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
    };
  }, [reducedMotion]);

  return <canvas ref={canvasRef} aria-hidden="true" className="h-full w-full block" />;
}

/**
 * Verified Lusion Goal & Cosmos Tunnel Sequence (`#home-goal`)
 *
 * Implements:
 *   1. Upper `#f0f1fa` editorial header band (`#home-goal-context`: `Where Creative Ideas Become Immersive Experiences`)
 *   2. Sticky 320vh `#000000` cosmos portal (`#home-goal-tunnel`):
 *        - Stage 1 (`0.08..0.54`): High-contrast `#ffffff` `STEP INTO A NEW WORLD / AND LET YOUR / IMAGINATION RUN WILD` + emerging EVA astronaut
 *        - Stage 2 (`0.54..0.98`): Centered chromatic prism halo + studio-lit 3D EVA astronaut with mirror visor glint
 */
export function GoalTunnelSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const tunnelTrackRef = useRef<HTMLDivElement>(null);
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let rafId = 0;

    const update = () => {
      const track = tunnelTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const scrollable = Math.max(1, rect.height - vh);
      const raw = Math.min(1, Math.max(0, -rect.top / scrollable));
      setProgress(raw);

      if (rect.top <= 72 && rect.bottom >= 96) {
        setActiveSurface("void");
      }
    };

    const onScroll = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [setActiveSurface]);

  // Stage 1 white title opacity: bright 21:1 in Stage 1 (`progress <= 0.48`), smoothly fading out for Stage 2 astronaut spotlight
  const stage1TitleOpacity = reducedMotion
    ? 1
    : progress < 0.08
      ? progress / 0.08
      : progress <= 0.48
        ? 1
        : Math.max(0, 1 - (progress - 0.48) / 0.14);

  const stage1Scale = reducedMotion ? 1 : 0.96 + progress * 0.14;

  return (
    <section
      id="home-goal"
      ref={sectionRef}
      className="section relative w-full text-[clamp(0.875rem,1vw,2rem)]"
    >
      {/* Part A: Context Editorial Band (`#home-goal-context`) */}
      <div
        id="home-goal-context"
        className="relative grid grid-cols-6 gap-x-[var(--grid-gap)] bg-[#f0f1fa] px-[var(--base-padding-x)] pt-24 pb-28 text-[#000000] min-[813px]:grid-cols-12 min-[813px]:pt-36 min-[813px]:pb-40"
      >
        <div
          id="home-goal-context-inner"
          className="col-span-6 grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:col-span-12 min-[813px]:grid-cols-12"
        >
          <h2
            id="home-goal-title"
            className="col-span-6 m-0 font-sans text-[11vw] leading-[1.06] font-normal tracking-[-0.025em] min-[813px]:col-span-8 min-[813px]:text-[5.5vw]"
          >
            {LUSION_HOME.goal.heading}
          </h2>

          <p
            id="home-goal-texts"
            className="col-span-6 mt-10 mb-0 font-sans text-[1.125rem] leading-[1.5] text-black/85 min-[813px]:col-start-7 min-[813px]:col-span-6 min-[813px]:mt-16 min-[813px]:text-[clamp(1.1rem,1.4vw,1.9rem)]"
          >
            {LUSION_HOME.goal.paragraphs.map((para, idx) => (
              <React.Fragment key={idx}>
                <span className="home-goal-texts-p block">{para}</span>
                {idx < LUSION_HOME.goal.paragraphs.length - 1 && (
                  <>
                    <br />
                    <br />
                  </>
                )}
              </React.Fragment>
            ))}
          </p>
        </div>
      </div>

      {/* Part B: Sticky 420vh Deep-Space Prism Eclipse & EVA Astronaut Stage */}
      <div
        id="home-goal-tunnel"
        ref={tunnelTrackRef}
        className={`relative w-full bg-[#000000] ${
          reducedMotion ? "min-h-[100dvh]" : "h-[420vh]"
        }`}
      >
        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#000000]">
          <AstronautCosmosCanvas progress={progress} reducedMotion={reducedMotion} />

          {/* Stage 1 Centered High-Contrast White Display Headline (`21:1` WCAG AAA) */}
          <div
            id="home-goal-image-in-text"
            style={{
              opacity: stage1TitleOpacity,
              transform: `translate(-50%, -50%) scale(${stage1Scale.toFixed(3)})`,
            }}
            className="pointer-events-none absolute top-1/2 left-1/2 z-20 w-[94vw] text-center font-sans text-[5.15vw] leading-[1.2] font-normal tracking-[0.06em] whitespace-nowrap text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] min-[813px]:w-[92vw] min-[813px]:text-[4.2vw] min-[813px]:tracking-[0.08em]"
          >
            {LUSION_HOME.goal.tunnelTitleLines.map((line, idx) => (
              <span key={idx} className="block">
                {line}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
