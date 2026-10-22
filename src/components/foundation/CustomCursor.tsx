"use client";

import React, { useEffect, useRef, useState } from "react";
import { STAGE_TELEMETRY, useStudioStore } from "@/lib/store";

/**
 * Dual-layer reactive Lusion pointer indicator + contextual action badge.
 * Writes normalized coordinates directly to `STAGE_TELEMETRY` for zero-rerender WebGL coupling,
 * and disables itself automatically on touch devices or under `prefers-reduced-motion`.
 */
export function CustomCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);

  const cursorVariant = useStudioStore((s) => s.cursorVariant);
  const cursorLabel = useStudioStore((s) => s.cursorLabel);
  const reelOpen = useStudioStore((s) => s.reelOpen);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    const update = () => setFinePointer(mq.matches);
    update();
    mq.addEventListener("change", update);

    let prevX = 0;
    let prevY = 0;

    const onPointerMove = (e: PointerEvent) => {
      const nx = (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1;
      const ny = -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1;
      const vx = nx - prevX;
      const vy = ny - prevY;
      prevX = nx;
      prevY = ny;

      STAGE_TELEMETRY.pointerX = nx;
      STAGE_TELEMETRY.pointerY = ny;
      STAGE_TELEMETRY.pointerVelocity = Math.hypot(vx, vy);
      STAGE_TELEMETRY.clientX = e.clientX;
      STAGE_TELEMETRY.clientY = e.clientY;
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });

    let ringX = -100;
    let ringY = -100;
    let rafId = 0;

    const renderLoop = () => {
      const tx = STAGE_TELEMETRY.clientX;
      const ty = STAGE_TELEMETRY.clientY;
      ringX += (tx - ringX) * 0.2;
      ringY += (ty - ringY) * 0.2;

      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${tx}px, ${ty}px, 0) translate(-50%, -50%)`;
      }
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      rafId = window.requestAnimationFrame(renderLoop);
    };

    if (mq.matches && !reducedMotion) {
      rafId = window.requestAnimationFrame(renderLoop);
    }

    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("pointermove", onPointerMove);
      window.cancelAnimationFrame(rafId);
    };
  }, [reducedMotion]);

  if (!finePointer || reducedMotion || reelOpen) return null;

  const isBadge = cursorVariant === "badge" && Boolean(cursorLabel);
  const isInteractive = cursorVariant === "interactive" || cursorVariant === "drag";

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 h-2 w-2 rounded-full bg-[#1a2ffb] transition-opacity duration-200 ${
          isBadge ? "opacity-0" : "opacity-100"
        }`}
      />

      <div
        ref={ringRef}
        className={`fixed top-0 left-0 flex items-center justify-center transition-[width,height,background-color,border-color,padding] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isBadge
            ? "h-9 rounded-full border border-white/25 bg-[#1a2ffb] px-4 text-white shadow-[0_12px_32px_rgba(26,47,251,0.45)]"
            : isInteractive
              ? "h-11 w-11 rounded-full border border-[#1a2ffb]/75 bg-[#1a2ffb]/12"
              : "h-7 w-7 rounded-full border border-current/25 bg-transparent mix-blend-difference text-white"
        }`}
      >
        {isBadge && (
          <span className="font-mono text-[10px] font-medium tracking-[0.1em] whitespace-nowrap uppercase">
            {cursorLabel}
          </span>
        )}
      </div>
    </div>
  );
}
