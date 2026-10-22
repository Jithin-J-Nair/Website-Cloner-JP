"use client";

import React, { useEffect, useRef } from "react";
import { useStudioStore } from "@/lib/store";

interface ProceduralReelStreamProps {
  paused?: boolean;
  progressRatio?: number;
  variant?: "stage" | "thumb" | "modal";
  accentColor?: string;
  label?: string;
  className?: string;
}

/**
 * Self-Contained Clean-Room Showreel & Case-Study Motion Stream (`D1`)
 *
 * Eliminates unsolicited `HTTP 404` `<video>` requests when unredistributable
 * third-party `.mp4` streams are not mounted, rendering a crisp 60fps real-time
 * geometric motion sequence in Lusion's cobalt/void/lime palette that responds
 * directly to `paused`, `progressRatio` scrubbing, and `prefers-reduced-motion`.
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
      const dpr = Math.min(2, window.devicePixelRatio || 1);
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

      // Deep dark studio stage gradient
      const bgGrad = ctx.createRadialGradient(
        w * (0.42 + Math.sin(t * 0.45) * 0.14),
        h * (0.44 + Math.cos(t * 0.35) * 0.12),
        w * 0.05,
        w * 0.5,
        h * 0.5,
        Math.max(w, h) * 0.78
      );
      if (variant === "thumb") {
        bgGrad.addColorStop(0, "#3b52ff");
        bgGrad.addColorStop(0.52, "#1a2ffb");
        bgGrad.addColorStop(1, "#090f48");
      } else {
        bgGrad.addColorStop(0, "#1c2b8f");
        bgGrad.addColorStop(0.42, "#0d1229");
        bgGrad.addColorStop(1, "#07080d");
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, w, h);

      // Orbiting 3D-projected Lusion cross & ribbon forms
      ctx.save();
      ctx.translate(w * 0.5, h * 0.5);
      const minDim = Math.min(w, h);

      // Sweeping electric spline ribbon
      ctx.beginPath();
      for (let i = 0; i <= 48; i += 1) {
        const u = i / 48;
        const x = (u - 0.5) * w * 1.18;
        const y =
          Math.sin(u * 4.4 + t * 1.35) * minDim * 0.21 +
          Math.cos(u * 2.1 - t * 0.8) * minDim * 0.09;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = Math.max(6, minDim * 0.048);
      ctx.lineCap = "round";
      ctx.globalAlpha = 0.72;
      ctx.stroke();

      // Secondary lime optical filament
      ctx.beginPath();
      for (let i = 0; i <= 48; i += 1) {
        const u = i / 48;
        const x = (u - 0.5) * w * 1.14;
        const y =
          Math.cos(u * 3.8 - t * 1.15) * minDim * 0.17 -
          Math.sin(u * 2.7 + t * 0.7) * minDim * 0.07;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = "#c1ff00";
      ctx.lineWidth = Math.max(2, minDim * 0.011);
      ctx.globalAlpha = 0.65;
      ctx.stroke();

      // Rotating wireframe cross rings
      const ringTotal = 5;
      for (let r = 0; r < ringTotal; r += 1) {
        const phase = t * 0.65 + r * 0.62;
        const rx = minDim * (0.14 + r * 0.075);
        const ry = rx * (0.48 + 0.22 * Math.sin(phase));
        ctx.save();
        ctx.rotate(phase * 0.45);
        ctx.beginPath();
        ctx.ellipse(0, 0, rx, Math.abs(ry), 0, 0, Math.PI * 2);
        ctx.strokeStyle = r % 2 === 0 ? "rgba(240,241,250,0.28)" : "rgba(193,255,0,0.34)";
        ctx.lineWidth = Math.max(1.2, minDim * 0.003);
        ctx.globalAlpha = 1;
        ctx.stroke();
        ctx.restore();
      }
      ctx.restore();

      if (variant === "modal") {
        ctx.save();
        ctx.fillStyle = "rgba(240,241,250,0.58)";
        ctx.font = `500 ${Math.max(11, Math.round(minDim * 0.022))}px ui-monospace, SFMono-Regular, Menlo, monospace`;
        ctx.letterSpacing = "2px";
        ctx.fillText(`${label.toUpperCase()} // REAL-TIME CANVAS REEL`, w * 0.045, h * 0.075);
        ctx.restore();
      }

      if (!reducedMotion && inView) {
        rafId = requestAnimationFrame(drawFrame);
      }
    };

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
