"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/lib/store";

export type ProceduralPreset =
  | "monolith"
  | "kestrel"
  | "meridian"
  | "sylva"
  | "hyperion"
  | "aether";

interface ProceduralMediaCanvasProps {
  preset: ProceduralPreset;
  accentHex?: string;
  secondaryHex?: string;
  bgHex?: string;
  seed?: number;
  hovered?: boolean;
  className?: string;
  label?: string;
}

/**
 * Self-contained procedural 2D studio optical render plate.
 * Uses IntersectionObserver to sleep completely off-screen and renders a crisp still frame
 * under `prefers-reduced-motion`, maintaining 60–120 FPS across dense archive grids.
 */
export function ProceduralMediaCanvas({
  preset,
  accentHex = "#2434ff",
  secondaryHex = "#00d2ff",
  bgHex = "#090b10",
  seed = 1,
  hovered = false,
  className,
  label,
}: ProceduralMediaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0.5, y: 0.5 });
  const hoverStateRef = useRef(hovered);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  useEffect(() => {
    hoverStateRef.current = hovered;
  }, [hovered]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let visible = true;
    let width = 640;
    let height = 420;

    const resize = () => {
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
      width = Math.max(240, rect.width);
      height = Math.max(180, rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawFrame = (timeMs: number) => {
      const t = timeMs * 0.001 + seed * 3.1;
      const isHover = hoverStateRef.current;
      const px = (pointerRef.current.x - 0.5) * (isHover ? 36 : 12);
      const py = (pointerRef.current.y - 0.5) * (isHover ? 28 : 10);

      // Base studio backdrop
      ctx.fillStyle = bgHex;
      ctx.fillRect(0, 0, width, height);

      // Atmospheric softbox glow
      const cx = width * 0.5 + px * 0.8;
      const cy = height * 0.5 + py * 0.8;
      const baseGlow = ctx.createRadialGradient(
        cx,
        cy,
        width * 0.04,
        cx,
        cy,
        width * (isHover ? 0.68 : 0.56)
      );
      baseGlow.addColorStop(0, `${accentHex}55`);
      baseGlow.addColorStop(0.45, `${secondaryHex}24`);
      baseGlow.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = baseGlow;
      ctx.fillRect(0, 0, width, height);

      // Subtle architectural grid lines
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        const gx = (width / 4) * i;
        ctx.beginPath();
        ctx.moveTo(gx, 0);
        ctx.lineTo(gx, height);
        ctx.stroke();
      }

      ctx.save();
      ctx.translate(width * 0.5 + px * 0.45, height * 0.5 + py * 0.45);

      if (preset === "monolith") {
        // Anisotropic chamfered monolith + optical Cauchy dispersion halos
        for (let ring = 0; ring < 5; ring++) {
          const r = Math.min(width, height) * (0.16 + ring * 0.058);
          ctx.save();
          ctx.rotate(t * (0.18 + ring * 0.04) * (ring % 2 === 0 ? 1 : -1));
          ctx.beginPath();
          ctx.ellipse(0, 0, r * 1.25, r * 0.62, 0.35, 0, Math.PI * 2);
          ctx.strokeStyle = ring % 2 === 0 ? `${accentHex}aa` : `${secondaryHex}88`;
          ctx.lineWidth = ring === 2 ? 2.2 : 1.1;
          ctx.stroke();
          ctx.restore();
        }

        // Brushed tungsten slab silhouette
        const mw = Math.min(width, height) * 0.28;
        const mh = Math.min(width, height) * 0.44;
        ctx.save();
        ctx.rotate(Math.sin(t * 0.7) * 0.09 - 0.14);
        const slabGrad = ctx.createLinearGradient(-mw, -mh, mw, mh);
        slabGrad.addColorStop(0, "#2b3348");
        slabGrad.addColorStop(0.45, "#0d111b");
        slabGrad.addColorStop(0.52, `${secondaryHex}99`);
        slabGrad.addColorStop(1, "#07090f");
        ctx.fillStyle = slabGrad;
        ctx.strokeStyle = "rgba(255,255,255,0.32)";
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.roundRect(-mw / 2, -mh / 2, mw, mh, 14);
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      } else if (preset === "kestrel") {
        // Precision harmonic rotor assembly rings + telemetry vectors
        const baseR = Math.min(width, height) * 0.32;
        for (let i = 0; i < 18; i++) {
          const ang = (i / 18) * Math.PI * 2 + t * 0.45;
          const r1 = baseR * 0.42;
          const r2 = baseR * (0.88 + Math.sin(t * 2 + i) * 0.08);
          ctx.beginPath();
          ctx.moveTo(Math.cos(ang) * r1, Math.sin(ang) * r1);
          ctx.lineTo(Math.cos(ang) * r2, Math.sin(ang) * r2);
          ctx.strokeStyle = i % 3 === 0 ? accentHex : "rgba(255,255,255,0.22)";
          ctx.lineWidth = i % 3 === 0 ? 2 : 1;
          ctx.stroke();
        }
        [0.4, 0.68, 0.96].forEach((scale, idx) => {
          ctx.beginPath();
          ctx.arc(0, 0, baseR * scale, t * (idx + 1) * 0.4, t * (idx + 1) * 0.4 + Math.PI * 1.45);
          ctx.strokeStyle = idx === 1 ? secondaryHex : accentHex;
          ctx.lineWidth = idx === 0 ? 3 : 1.5;
          ctx.stroke();
        });
      } else if (preset === "meridian") {
        // Distributed optical node lattice
        const nodes: { x: number; y: number }[] = [];
        const spread = Math.min(width, height) * 0.36;
        for (let i = 0; i < 14; i++) {
          const a = i * 2.39996 + t * 0.22;
          const rad = spread * Math.sqrt((i + 1) / 14);
          nodes.push({
            x: Math.cos(a) * rad * 1.25,
            y: Math.sin(a) * rad * 0.82,
          });
        }
        for (let i = 0; i < nodes.length; i++) {
          for (let j = i + 1; j < nodes.length; j++) {
            const dx = nodes[i].x - nodes[j].x;
            const dy = nodes[i].y - nodes[j].y;
            const dist = Math.hypot(dx, dy);
            if (dist < spread * 0.85) {
              ctx.beginPath();
              ctx.moveTo(nodes[i].x, nodes[i].y);
              ctx.lineTo(nodes[j].x, nodes[j].y);
              ctx.strokeStyle = `${accentHex}55`;
              ctx.lineWidth = 1.1;
              ctx.stroke();
            }
          }
        }
        nodes.forEach((n, idx) => {
          ctx.beginPath();
          ctx.arc(n.x, n.y, idx % 4 === 0 ? 5.5 : 3.2, 0, Math.PI * 2);
          ctx.fillStyle = idx % 3 === 0 ? "#ffffff" : secondaryHex;
          ctx.fill();
        });
      } else if (preset === "sylva") {
        // Parametric phyllotaxis botanical petals
        const maxR = Math.min(width, height) * 0.36;
        for (let i = 0; i < 42; i++) {
          const angle = i * 2.39996 + Math.sin(t * 0.5) * 0.25;
          const r = maxR * Math.sqrt(i / 42);
          const x = Math.cos(angle) * r;
          const y = Math.sin(angle) * r;
          const size = 6 + (1 - i / 42) * 16;
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle + t * 0.3);
          ctx.beginPath();
          ctx.ellipse(0, 0, size, size * 0.48, 0, 0, Math.PI * 2);
          ctx.fillStyle = i % 2 === 0 ? `${accentHex}66` : `${secondaryHex}44`;
          ctx.strokeStyle = "rgba(255,255,255,0.28)";
          ctx.lineWidth = 0.9;
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        }
      } else if (preset === "hyperion") {
        // Wind-tunnel aerodynamic streamlines across sculpted silhouette
        const span = width * 0.44;
        for (let line = -8; line <= 8; line++) {
          ctx.beginPath();
          for (let step = -24; step <= 24; step++) {
            const u = step / 24;
            const x = u * span;
            const bodyDeflect = Math.exp(-u * u * 7.5) * (line >= 0 ? 1 : -1) * 26;
            const wake = Math.sin(u * 7.0 - t * 2.6 + line * 0.4) * (u > 0 ? u * 12 : 2);
            const y = line * (height * 0.032) + bodyDeflect + wake;
            if (step === -24) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.strokeStyle =
            Math.abs(line) <= 2 ? `${accentHex}ee` : `${secondaryHex}66`;
          ctx.lineWidth = Math.abs(line) <= 1 ? 2.1 : 1.05;
          ctx.stroke();
        }
      } else {
        // Aether Spatial: harmonic metaball glass resonators
        for (let b = 0; b < 6; b++) {
          const ang = (b / 6) * Math.PI * 2 + t * 0.42;
          const orbR = Math.min(width, height) * (0.14 + (b % 2) * 0.09);
          const bx = Math.cos(ang) * orbR * 1.3;
          const by = Math.sin(ang * 1.5) * orbR * 0.85;
          const radius = Math.min(width, height) * (0.11 + (b % 3) * 0.035);
          const grad = ctx.createRadialGradient(
            bx - radius * 0.3,
            by - radius * 0.3,
            radius * 0.08,
            bx,
            by,
            radius
          );
          grad.addColorStop(0, "rgba(255,255,255,0.85)");
          grad.addColorStop(0.35, `${accentHex}88`);
          grad.addColorStop(0.85, `${secondaryHex}33`);
          grad.addColorStop(1, "rgba(255,255,255,0.04)");
          ctx.beginPath();
          ctx.arc(bx, by, radius, 0, Math.PI * 2);
          ctx.fillStyle = grad;
          ctx.fill();
          ctx.strokeStyle = "rgba(255,255,255,0.28)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      ctx.restore();

      // Subtle corner technical telemetry watermarks
      ctx.fillStyle = "rgba(255,255,255,0.42)";
      ctx.font = '10px "JetBrains Mono Variable", monospace';
      ctx.fillText(`SHADER // ${preset.toUpperCase()}`, 18, height - 16);
      if (label) {
        ctx.textAlign = "right";
        ctx.fillText(label, width - 18, height - 16);
        ctx.textAlign = "left";
      }
    };

    resize();
    drawFrame(1200);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      drawFrame(performance.now());
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries[0]?.isIntersecting ?? false;
      },
      { threshold: 0.05 }
    );
    intersectionObserver.observe(canvas);

    if (!reducedMotion) {
      const loop = (now: number) => {
        if (visible) {
          drawFrame(now);
        }
        rafId = window.requestAnimationFrame(loop);
      };
      rafId = window.requestAnimationFrame(loop);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
    };
  }, [accentHex, bgHex, label, preset, reducedMotion, secondaryHex, seed]);

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        pointerRef.current = {
          x: (e.clientX - rect.left) / Math.max(1, rect.width),
          y: (e.clientY - rect.top) / Math.max(1, rect.height),
        };
      }}
      className={cn("block h-full w-full select-none", className)}
      aria-hidden="true"
    />
  );
}
