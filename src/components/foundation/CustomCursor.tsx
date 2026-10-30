"use client";

import React, { useEffect, useRef, useState } from "react";
import { STAGE_TELEMETRY, useStudioStore } from "@/lib/store";
import { cursorDamping } from "@/lib/pointer-motion";

/** Shared pointer feedback. Telemetry stays outside React; only the two anchors move
 * per frame. Shape feedback scales/fades separate skins, never the moving anchor's layout.
 */
export function CustomCursor() {
  const rootRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [finePointer, setFinePointer] = useState(false);

  const cursorVariant = useStudioStore((s) => s.cursorVariant);
  const cursorLabel = useStudioStore((s) => s.cursorLabel);
  const reelOpen = useStudioStore((s) => s.reelOpen);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  useEffect(() => {
    const mq = window.matchMedia("(pointer: fine)");
    let prevX = 0;
    let prevY = 0;
    let ringX = 0;
    let ringY = 0;
    let initialized = false;
    let previousTime = 0;
    let rafId = 0;

    const suspend = () => {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
      previousTime = 0;
      initialized = false;
      if (rootRef.current) rootRef.current.style.opacity = "0";
    };
    const update = () => {
      setFinePointer(mq.matches);
      if (!mq.matches) suspend();
    };
    update();
    mq.addEventListener("change", update);

    const renderLoop = (now: number) => {
      rafId = 0;
      if (document.hidden || !mq.matches || reducedMotion || reelOpen) return;
      const tx = STAGE_TELEMETRY.clientX;
      const ty = STAGE_TELEMETRY.clientY;
      const alpha = cursorDamping(previousTime ? (now - previousTime) / 1000 : 1 / 60);
      previousTime = now;
      ringX += (tx - ringX) * alpha;
      ringY += (ty - ringY) * alpha;
      const settled = Math.hypot(tx - ringX, ty - ringY) <= 0.25;
      if (settled) { ringX = tx; ringY = ty; }
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${tx}px,${ty}px,0) translate(-50%,-50%)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ringX}px,${ringY}px,0) translate(-50%,-50%)`;
      if (rootRef.current) rootRef.current.style.opacity = "1";
      if (!settled) rafId = window.requestAnimationFrame(renderLoop);
    };

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

      if (!mq.matches || reducedMotion || reelOpen || document.hidden || e.pointerType === "touch") return;
      // Snap on first entry/resume, not an animated flight from the top-left corner.
      if (!initialized) { ringX = e.clientX; ringY = e.clientY; initialized = true; }
      if (!rafId) {
        previousTime = 0;
        rafId = window.requestAnimationFrame(renderLoop);
      }
    };
    const onVisibility = () => { if (document.hidden) suspend(); };
    const onPointerOut = (e: PointerEvent) => { if (!e.relatedTarget) suspend(); };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerout", onPointerOut, { passive: true });
    window.addEventListener("blur", suspend);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      mq.removeEventListener("change", update);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerout", onPointerOut);
      window.removeEventListener("blur", suspend);
      document.removeEventListener("visibilitychange", onVisibility);
      suspend();
    };
  }, [reducedMotion, reelOpen]);

  if (!finePointer || reducedMotion || reelOpen) return null;
  const isBadge = cursorVariant === "badge" && Boolean(cursorLabel);
  const isInteractive = cursorVariant === "interactive" || cursorVariant === "drag";

  return (
    <div ref={rootRef} data-studio-cursor aria-hidden="true" style={{ opacity: 0 }} className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      <div
        ref={dotRef}
        className={`fixed top-0 left-0 h-2 w-2 rounded-full bg-[#1a2ffb] transition-opacity duration-200 ${isBadge ? "opacity-0" : "opacity-100"}`}
      />
      <div ref={ringRef} className="fixed top-0 left-0 flex h-11 w-11 items-center justify-center">
        <div
          style={{ transform: `scale(${isInteractive ? 1 : 7 / 11})`, opacity: isBadge ? 0 : 1 }}
          className={`absolute inset-0 rounded-full border transition-[transform,opacity,background-color,border-color] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] ${
            isInteractive ? "border-[#1a2ffb]/75 bg-[#1a2ffb]/12" : "border-current/25 bg-transparent text-white mix-blend-difference"
          }`}
        />
        <span className={`absolute top-1/2 left-1/2 flex h-9 -translate-x-1/2 -translate-y-1/2 items-center rounded-full border border-white/25 bg-[#1a2ffb] px-4 font-mono text-[10px] font-medium tracking-[0.1em] whitespace-nowrap text-white uppercase shadow-[0_12px_32px_rgba(26,47,251,0.45)] transition-opacity duration-200 ${isBadge ? "opacity-100" : "opacity-0"}`}>
          {cursorLabel}
        </span>
      </div>
    </div>
  );
}
