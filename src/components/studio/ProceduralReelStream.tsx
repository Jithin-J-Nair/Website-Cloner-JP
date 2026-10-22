"use client";

import React, { useEffect, useRef } from "react";
import { useStudioStore } from "@/lib/store";

export interface ProceduralReelStreamProps {
  paused?: boolean;
  progressRatio?: number;
  variant?: "stage" | "thumb" | "modal";
  accentColor?: string;
  label?: string;
  className?: string;
}

/**
 * Clean-Room 60fps Studio Showreel Canvas (`ProceduralReelStream`)
 *
 * Synthesizes 100% original procedural 2.5D worlds with zero external `.mp4` requests:
 *   - `variant="stage"` (default showreel): Sunlit pastel azure sky, soft volumetric clouds,
 *     emerald meadow hills, and shaded 3D tubular spline tracks in coral, peach, lemon, & aqua
 *   - `variant="thumb"`: Electric cobalt duotone studio light composition
 *   - `variant="modal"` / custom case-study `accentColor`: High-contrast dark cinema stage
 */
export function ProceduralReelStream({
  paused = false,
  progressRatio,
  variant = "stage",
  accentColor = "#1a2ffb",
  label = "LUSION SHOWREEL",
  className = "",
}: ProceduralReelStreamProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let accumSec = 2.4;
    let lastTs = performance.now();
    let inView = true;

    const resize = () => {
      const dpr = Math.min(1.75, window.devicePixelRatio || 1);
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width * dpr));
      const h = Math.max(200, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const drawRibbon = (
      pts: Array<[number, number]>,
      widthPx: number,
      mainHex: string,
      hiHex: string
    ) => {
      ctx.save();
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
      ctx.lineWidth = widthPx;
      ctx.strokeStyle = mainHex;
      ctx.stroke();

      ctx.beginPath();
      pts.forEach(([x, y], i) =>
        i === 0 ? ctx.moveTo(x - widthPx * 0.14, y - widthPx * 0.16) : ctx.lineTo(x - widthPx * 0.14, y - widthPx * 0.16)
      );
      ctx.lineWidth = widthPx * 0.28;
      ctx.strokeStyle = hiHex;
      ctx.stroke();
      ctx.restore();
    };

    const drawFrame = (now: number) => {
      const dt = Math.min(0.05, (now - lastTs) / 1000);
      lastTs = now;
      if (!paused && !reducedMotion) {
        accumSec += dt;
      }
      const t =
        typeof progressRatio === "number" && paused
          ? progressRatio * 18 + 2.4
          : accumSec;

      const w = canvas.width;
      const h = canvas.height;
      const minDim = Math.min(w, h);
      const isShowreelWorld = variant === "stage" && accentColor.toLowerCase() === "#1a2ffb";

      if (isShowreelWorld) {
        // 1. Sunlit Azure-Periwinkle Studio Sky (`ref-03-reel-stage`)
        const sky = ctx.createLinearGradient(0, 0, 0, h * 0.78);
        sky.addColorStop(0, "#6d9bff");
        sky.addColorStop(0.52, "#9fbeff");
        sky.addColorStop(1, "#dce8ff");
        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, w, h);

        // Soft stylized 3D cumulus puffs
        const cloudDrift = Math.sin(t * 0.25) * w * 0.025;
        const clouds = [
          [w * 0.26 + cloudDrift, h * 0.34, minDim * 0.068],
          [w * 0.68 - cloudDrift, h * 0.28, minDim * 0.052],
          [w * 0.87 + cloudDrift * 0.6, h * 0.36, minDim * 0.044],
        ];
        for (const [cx, cy, cr] of clouds) {
          ctx.fillStyle = "rgba(247, 250, 255, 0.92)";
          ctx.beginPath();
          ctx.ellipse(cx, cy, cr * 1.45, cr * 0.82, 0, 0, Math.PI * 2);
          ctx.fill();
        }

        // 2. Sunlit Meadow Horizon & Rolling Emerald Hills (desktop bottom half)
        if (w > h) {
          const meadow = ctx.createLinearGradient(0, h * 0.56, 0, h);
          meadow.addColorStop(0, "#76d680");
          meadow.addColorStop(1, "#5ec66a");
          ctx.fillStyle = meadow;
          ctx.fillRect(0, h * 0.58, w, h * 0.42);

          // Sculpted 3D green hills
          for (const [hx, hy, hr] of [
            [w * 0.33, h * 0.66, minDim * 0.20],
            [w * 0.76, h * 0.64, minDim * 0.17],
            [w * 0.86, h * 0.67, minDim * 0.14],
          ]) {
            const hg = ctx.createRadialGradient(hx - hr * 0.25, hy - hr * 0.3, hr * 0.1, hx, hy, hr);
            hg.addColorStop(0, "#8ce494");
            hg.addColorStop(1, "#4fb15b");
            ctx.beginPath();
            ctx.arc(hx, hy, hr, Math.PI, Math.PI * 2);
            ctx.fillStyle = hg;
            ctx.fill();
          }
        }

        // 3. Vertical Aqua 3D Loop Ring in Mid-Distance
        ctx.save();
        ctx.strokeStyle = "#62ece9";
        ctx.lineWidth = minDim * 0.055;
        ctx.beginPath();
        ctx.ellipse(w * 0.60, h * 0.36, minDim * 0.068, minDim * 0.19, 0.08, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // 4. Sweeping Yellow & Lavender Secondary Coaster Splines (Desktop)
        if (w > h) {
          const wave = Math.sin(t * 0.7) * h * 0.015;
          drawRibbon(
            [
              [-w * 0.04, h * 0.82],
              [w * 0.10, h * 0.60 + wave],
              [w * 0.22, h * 0.68],
              [w * 0.28, h * 1.02],
            ],
            minDim * 0.055,
            "#f2db6d",
            "#fff3ad"
          );
          drawRibbon(
            [
              [w * 0.52, h * 0.56],
              [w * 0.74, h * 0.74 - wave],
              [w * 1.04, h * 0.52],
            ],
            minDim * 0.13,
            "#f59c79",
            "#ffc2a8"
          );
        }

        // 5. Heroic Central Perspective Coral 3D Track Pillar (`ref-03-reel-stage` signature focal form)
        const sway = Math.sin(t * 0.55) * w * 0.008;
        ctx.save();
        const trackGrad = ctx.createLinearGradient(w * 0.36, 0, w * 0.66, h);
        trackGrad.addColorStop(0, "#eb545e");
        trackGrad.addColorStop(0.5, "#f0727c");
        trackGrad.addColorStop(1, "#f2858e");
        ctx.fillStyle = trackGrad;
        ctx.beginPath();
        ctx.moveTo(w * 0.49 + sway, -h * 0.04);
        ctx.lineTo(w * 0.58 + sway, -h * 0.04);
        ctx.quadraticCurveTo(w * 0.56, h * 0.54, w * 0.76, h * 1.04);
        ctx.lineTo(w * 0.24, h * 1.04);
        ctx.quadraticCurveTo(w * 0.44, h * 0.54, w * 0.49 + sway, -h * 0.04);
        ctx.closePath();
        ctx.fill();

        // Center spine ridge highlight along coral track
        ctx.strokeStyle = "rgba(255, 198, 202, 0.55)";
        ctx.lineWidth = minDim * 0.016;
        ctx.beginPath();
        ctx.moveTo(w * 0.535 + sway, 0);
        ctx.quadraticCurveTo(w * 0.50, h * 0.54, w * 0.50, h);
        ctx.stroke();
        ctx.restore();
      } else if (variant === "thumb") {
        // Electric Royal Cobalt Duotone Stage (`#home-reel-thumb` in `ref-02-reel-intro`)
        const grad = ctx.createRadialGradient(w * 0.45, h * 0.42, w * 0.04, w * 0.5, h * 0.5, w * 0.72);
        grad.addColorStop(0, "#6884ff");
        grad.addColorStop(0.52, "#2940ff");
        grad.addColorStop(1, "#1221e8");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Luminous royal-blue volumetric portrait/sphere forms
        for (let i = 0; i < 4; i += 1) {
          const ang = t * 0.6 + i * 1.5;
          const cx = w * (0.44 + Math.sin(ang) * 0.14);
          const cy = h * (0.48 + Math.cos(ang * 0.8) * 0.12);
          const rr = minDim * (0.34 - i * 0.055);
          const g = ctx.createRadialGradient(cx - rr * 0.25, cy - rr * 0.25, rr * 0.05, cx, cy, rr);
          g.addColorStop(0, "rgba(176, 196, 255, 0.52)");
          g.addColorStop(1, "rgba(22, 38, 255, 0)");
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(cx, cy, rr, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Solid obsidian studio base before translucent radial key light (prevents rAF alpha accumulation)
        ctx.fillStyle = "#090809";
        ctx.fillRect(0, 0, w, h);

        const bgGrad = ctx.createRadialGradient(
          w * (0.46 + Math.sin(t * 0.45) * 0.1),
          h * (0.48 + Math.cos(t * 0.35) * 0.08),
          w * 0.04,
          w * 0.5,
          h * 0.5,
          Math.max(w, h) * 0.78
        );
        bgGrad.addColorStop(0, `${accentColor}22`);
        bgGrad.addColorStop(0.58, "rgba(13, 12, 13, 0.5)");
        bgGrad.addColorStop(1, "rgba(6, 6, 8, 0)");
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        for (let band = 0; band < 3; band += 1) {
          ctx.beginPath();
          const amp = h * (0.11 - band * 0.025);
          const freq = 0.0038 + band * 0.0011;
          for (let x = 0; x <= w; x += 12) {
            const y = h * 0.52 + Math.sin(x * freq + t * (1.1 + band * 0.35) + band) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle =
            band === 0 ? `${accentColor}66` : band === 1 ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.14)";
          ctx.lineWidth = band === 0 ? minDim * 0.012 : minDim * 0.004;
          ctx.stroke();
        }

        if (variant === "modal") {
          ctx.save();
          ctx.fillStyle = "rgba(240,241,250,0.62)";
          ctx.font = `500 ${Math.max(11, Math.round(minDim * 0.022))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
          ctx.fillText(`${label.toUpperCase()} // REAL-TIME CANVAS REEL`, w * 0.045, h * 0.075);
          ctx.restore();
        }
      }

      if (!reducedMotion && inView) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        const nextVisible = entries[0]?.isIntersecting ?? true;
        if (nextVisible && !inView && !reducedMotion) {
          inView = true;
          lastTs = performance.now();
          rafId = requestAnimationFrame(drawFrame);
        } else {
          inView = nextVisible;
        }
      },
      { threshold: 0 }
    );
    io.observe(canvas);

    drawFrame(performance.now());
    return () => {
      cancelAnimationFrame(rafId);
      io.disconnect();
      ro.disconnect();
    };
  }, [accentColor, label, paused, progressRatio, reducedMotion, variant]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`block h-full w-full object-cover ${className}`}
    />
  );
}
