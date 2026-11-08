"use client";

import React, { Component, useCallback, useEffect, useRef, useState } from "react";
import { createNativeHeroScene } from "./NativeHeroScene";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";

export const HERO_ACCENT_PALETTE = ["#061dfb"] as const;

class StageErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function StaticSculpturalFallback({ accentHex }: { accentHex: string }) {
  return (
    <div
      data-webgl-fallback="active"
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#12141a]"
    >
      <svg
        viewBox="0 0 800 500"
        className="h-full w-full max-w-[900px]"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="crossWhite" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#f2f3f8" />
            <stop offset="70%" stopColor="#c9cddb" />
            <stop offset="100%" stopColor="#727788" />
          </radialGradient>
          <radialGradient id="crossAccent" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={accentHex} />
            <stop offset="100%" stopColor="#070d59" />
          </radialGradient>
          <radialGradient id="crossBlack" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#353946" />
            <stop offset="70%" stopColor="#101218" />
            <stop offset="100%" stopColor="#06070a" />
          </radialGradient>
        </defs>
        {[
          { x: 250, y: 270, rot: -28, fill: "url(#crossWhite)", scale: 1.15 },
          { x: 390, y: 245, rot: 26, fill: "url(#crossAccent)", scale: 1.2 },
          { x: 525, y: 270, rot: 40, fill: "url(#crossBlack)", scale: 1.22 },
          { x: 350, y: 405, rot: 14, fill: "url(#crossBlack)", scale: 1.18 },
          { x: 500, y: 410, rot: -32, fill: "url(#crossAccent)", scale: 1.14 },
        ].map((item, idx) => (
          <g
            key={idx}
            transform={`translate(${item.x} ${item.y}) rotate(${item.rot}) scale(${item.scale})`}
          >
            <rect x="-105" y="-36" width="210" height="72" rx="14" fill={item.fill} />
            <rect x="-36" y="-105" width="72" height="210" rx="14" fill={item.fill} />
            <circle cx="0" cy="0" r="14" fill="#07080c" />
          </g>
        ))}
      </svg>
    </div>
  );
}


/** Native material/physics scene; one lifecycle/clock owner, no second scroll writer. */
export function HeroCrossesStage() {
  const reduced = useStudioStore(s => s.reducedMotion);
  const reducedRef = useRef(reduced);
  const containerRef = useRef<HTMLDivElement>(null), mountRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<ReturnType<typeof createNativeHeroScene> | null>(null);
  const wakeRef = useRef<() => void>(() => {}), resizeRef = useRef<() => void>(() => {});
  const pointer = useRef({ x: 0, y: 0, active: false });
  const reported = useRef(false);
  const [status, setStatus] = useState<"booting" | "ready" | "fallback">("booting");
  const [hits, setHits] = useState(0);
  const [mobile, setMobile] = useState<boolean | null>(null);
  useEffect(() => {
    const query = matchMedia("(max-width:812px)");
    const update = () => setMobile(query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => { reducedRef.current = reduced; if (reduced) { pointer.current.active = false; reported.current = false; } resizeRef.current(); wakeRef.current(); }, [reduced]);
  useEffect(() => {
    const host = mountRef.current, root = containerRef.current;
    if (!host || !root || mobile === null) return;
    if (new URLSearchParams(location.search).get("forceWebglFallback") === "1") { queueMicrotask(() => setStatus("fallback")); return; }
    const canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true"); canvas.id = "home-native-hero-canvas";
    canvas.style.cssText = "display:block;width:100%;height:100%;opacity:0"; host.append(canvas);
    let disposed = false, lost = false, visible = true, dirty = true, raf = 0, timer = 0, last = 0, time = 0, frames = 0;
    let api: ReturnType<typeof createNativeHeroScene>;
    const blocked = () => { const s = useStudioStore.getState(); return s.menuOpen || s.reelOpen || s.isTransitioning; };
    const cancel = () => {
      cancelAnimationFrame(raf); clearTimeout(timer); raf = timer = 0; last = 0;
      root.dataset.activeRaf = "false"; root.dataset.physicsActive = "false";
    };
    const wake = () => { if (!disposed && !lost && visible && !document.hidden && !blocked() && !raf && !timer) raf = requestAnimationFrame(frame); };
    const resize = () => { dirty = true; wake(); };
    const fallback = () => { lost = true; cancel(); canvas.style.opacity = "0"; setStatus("fallback"); };
    pointer.current.active = false; reported.current = false;
    queueMicrotask(() => { if (!disposed) setStatus("booting"); });
    try { api = createNativeHeroScene(canvas, mobile, wake); }
    catch { canvas.remove(); queueMicrotask(() => setStatus("fallback")); return; }
    apiRef.current = api; wakeRef.current = wake; resizeRef.current = resize;
    function frame(now: number) {
      let responding = false;
      raf = 0; if (disposed || lost || document.hidden || blocked()) { last = 0; return; }
      const box = root!.getBoundingClientRect(); visible = box.bottom > 0 && box.top < innerHeight && box.right > 0 && box.left < innerWidth;
      if (!visible) { last = 0; return; }
      const s = useStudioStore.getState(), elapsed = last ? Math.max(0, (now - last) / 1000) : 0; last = now;
      if (s.preloaderDone && !reducedRef.current) time += elapsed;
      if (dirty) { api.resize(Math.max(1, box.width), Math.max(1, box.height), innerHeight, reducedRef.current); dirty = false; }
      const isStatic = reducedRef.current || !s.preloaderDone;
      const start = performance.now();
      try {
        const stats = api.render(isStatic ? 0 : elapsed, isStatic ? 3 : time, isStatic, pointer.current.x, pointer.current.y, pointer.current.active);
        responding = !isStatic && stats.interactionEnergy > 0;
        root!.dataset.motionState = responding ? "responding" : "settled"; root!.dataset.activeRaf = String(!isStatic);
        root!.dataset.offsetEnergy = stats.interactionEnergy.toFixed(5); root!.dataset.physicsCollisions = String(stats.collisions);
        root!.dataset.pointerDisplacement = api.physics.pointerDisplacement.toFixed(5);
        root!.dataset.pointerInfluencedPieces = String(stats.influencedPieces); root!.dataset.kineticEnergy = stats.kineticEnergy.toFixed(5);
        root!.dataset.maxTravel = stats.maxTravel.toFixed(4); root!.dataset.meanRadius = stats.meanRadius.toFixed(4);
        root!.dataset.physicsActive = String(!isStatic); root!.dataset.clusterPieces = String(api.physics.bodies.length);
        root!.dataset.renderCount = String(++frames); root!.dataset.renderPixels = `${canvas.width}x${canvas.height}`;
        root!.dataset.drawCalls = String(api.renderer.info.render.calls); root!.dataset.frameCpuMs = (performance.now() - start).toFixed(2);
        root!.dataset.nativeTime = time.toFixed(4); root!.dataset.materialModel = "native-matcap-neighbour";
        if (stats.influencedPieces > 0 && !reported.current) { reported.current = true; setHits(h => h + 1); }
        if (canvas.dataset.nativeSettled === "true") { canvas.style.opacity = "1"; setStatus("ready"); }
      } catch { fallback(); return; }
      if (!isStatic) {
        // Software rasterizers retain the same shader/neighbor count, with bounded
        // motion pixels and a yielding clock. No physical-GPU/FPS claim is implied.
        if (api.software && !pointer.current.active && !responding) timer = window.setTimeout(() => { timer = 0; wake(); }, 45);
        else wake();
      } else last = 0;
    }
    const onVisibility = () => { if (document.hidden) cancel(); else wake(); };
    const onLost = (event: Event) => { event.preventDefault(); fallback(); };
    const onRestored = () => { if (!disposed) { lost = false; dirty = true; wake(); } };
    const onScroll = () => { const box = root.getBoundingClientRect(); const next = box.bottom > 0 && box.top < innerHeight; if (!next) { visible = false; cancel(); } else { visible = true; wake(); } };
    const off = useStudioStore.subscribe((s, previous) => { if (blocked()) { pointer.current.active = false; reported.current = false; cancel(); } else if (s.menuOpen !== previous.menuOpen || s.reelOpen !== previous.reelOpen || s.isTransitioning !== previous.isTransitioning || s.preloaderDone !== previous.preloaderDone) wake(); });
    const observer = new ResizeObserver(resize); observer.observe(root);
    const intersection = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); if (visible) wake(); else cancel(); }); intersection.observe(root);
    document.addEventListener("visibilitychange", onVisibility); window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", resize);
    canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
    wake();
    return () => {
      disposed = true; cancel(); off(); observer.disconnect(); intersection.disconnect();
      document.removeEventListener("visibilitychange", onVisibility); window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", resize);
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
      api.dispose(); canvas.remove(); apiRef.current = null; wakeRef.current = () => {}; resizeRef.current = () => {};
    };
  }, [mobile]);
  const leave = useCallback(() => { pointer.current.active = false; reported.current = false; wakeRef.current(); }, []);
  const move = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === "touch" || reducedRef.current) return;
    const r = containerRef.current?.getBoundingClientRect(); if (!r) return;
    pointer.current.x = (e.clientX - r.left) / r.width * 2 - 1; pointer.current.y = 1 - (e.clientY - r.top) / r.height * 2;
    pointer.current.active = true; wakeRef.current();
  }, []);
  const activate = useCallback(() => { soundEngine.playClick(); if (!reducedRef.current) { apiRef.current?.impulse(); wakeRef.current(); } }, []);
  const key = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } }, [activate]);
  const fallback = <StaticSculpturalFallback accentHex={HERO_ACCENT_PALETTE[0]} />;
  return <div id="home-hero-visual-container" ref={containerRef} role="button" tabIndex={0}
    aria-label="Interactive 3D Lusion connector stage — move pointer to sculpt or activate to pulse the sculpture"
    data-color-index="0" data-cluster-mode="source-balloon-cloud" data-cluster-envelope="native-gravity-contact-drag"
    data-accent-color={HERO_ACCENT_PALETTE[0]} data-webgl-status={status} data-pointer-interactions={hits}
    onClick={activate} onKeyDown={key} onPointerMove={move} onPointerLeave={leave} onMouseLeave={leave} onPointerCancel={leave}
    className="relative h-full w-full cursor-pointer overflow-hidden rounded-[var(--global-border-radius)] bg-[#141515] select-none focus-visible:outline-2 focus-visible:outline-[#1a2ffb]">
    {status !== "ready" && <div className="absolute inset-0">{fallback}</div>}
    <StageErrorBoundary fallback={fallback}><div ref={mountRef} className="absolute inset-0 h-full w-full" /></StageErrorBoundary>
  </div>;
}
