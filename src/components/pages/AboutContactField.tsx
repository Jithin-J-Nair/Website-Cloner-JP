"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createAboutContactWave } from "@/components/three/AboutContactWave";
import { createAboutContactMotion } from "@/components/three/AboutContactMotion";
import { useStudioStore } from "@/lib/store";

declare global {
  interface Window {
    __enableCtaProbe?: boolean;
    __ctaProbe?: () => { frames: number; pending: boolean; progress: number; time: number; count: number; draws: number; triangles: number; pointer: number; frameTimes: number[]; state: string };
  }
}

/** One blue-act clock owns liquid AND editorial motion. No Home clock/audio or
 * extra letter timers. A held pour drains/recycles mass; a click remains mailto. */
export function AboutContactField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState("loading");
  const reducedMotion = useStudioStore(s => s.reducedMotion);

  useEffect(() => {
    const host = hostRef.current, stage = host?.closest<HTMLElement>("#end-section-outer");
    const section = host?.closest<HTMLElement>("section");
    if (!host || !stage || !section) return;
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true"); canvas.className = "absolute inset-0 h-full w-full"; canvas.style.opacity = "0";
    let disposed = false, renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "high-performance" }); }
    catch { queueMicrotask(() => { if (!disposed) setState("unavailable"); }); return () => { disposed = true; }; }
    host.prepend(canvas);
    const gl = renderer.getContext(), debug = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software/i.test(debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "");
    const field = createAboutContactWave(5600), motion = createAboutContactMotion(stage, reducedMotion);
    const scene = new THREE.Scene(); scene.add(field.group);
    const camera = new THREE.Camera();
    renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
    field.uniforms.uReduced.value = reducedMotion ? 1 : 0;
    const pointer = new THREE.Vector3(.5, .5, 0);
    let width = 1, height = 1, start = 0, length = 1;
    let rafId = 0, frames = 0, previous = 0, time = .5, progress = 0;
    let visible = false, lost = false, needsStill = true;
    let heldId: number | null = null, downTime = 0, downX = 0, downY = 0, moved = 0, suppressClickUntil = 0;
    const frameTimes: number[] = [];
    const blocked = () => { const s = useStudioStore.getState(); return s.menuOpen || s.reelOpen; };
    const release = () => { heldId = null; field.uniforms.uHeld.value = 0; field.fluid.pouring = false; };
    const cancel = () => { cancelAnimationFrame(rafId); rafId = 0; previous = 0; release(); };
    const frame = (now: number) => {
      rafId = 0;
      if (disposed || lost || !visible || document.hidden || blocked()) return;
      const elapsed = previous ? Math.max(0, (now - previous) / 1000) : 1 / 60; previous = now;
      if (!reducedMotion) time += elapsed;
      if (window.__enableCtaProbe) { frameTimes.push(elapsed * 1000); if (frameTimes.length > 120) frameTimes.shift(); }
      progress = Math.max(0, Math.min(1, (window.scrollY - start) / length));
      field.uniforms.uProgress.value = progress; field.uniforms.uPointer.value.copy(pointer);
      field.setTime(reducedMotion ? 0 : time); motion.update(elapsed);
      renderer.render(scene, camera); frames++; needsStill = false;
      if (frames === 1) { canvas.style.opacity = "1"; setState("ready"); }
      if (!reducedMotion) rafId = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!disposed && !lost && visible && !document.hidden && !blocked() && !rafId && (!reducedMotion || needsStill)) rafId = requestAnimationFrame(frame);
    };
    const resize = () => {
      if (disposed || lost) return;
      width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5, Math.sqrt((software ? 1200000 : 2200000) / (width * height)));
      renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
      field.uniforms.uPixelRatio.value = dpr;
      const rect = stage.getBoundingClientRect(), pill = stage.querySelector('#end-bottom')?.getBoundingClientRect();
      field.layout(width, height, pill ? { left: (pill.left - rect.left) / width, right: (pill.right - rect.left) / width,
        bottom: 1 - (pill.bottom - rect.top) / height, top: 1 - (pill.top - rect.top) / height } : undefined);
      start = section.getBoundingClientRect().top + window.scrollY; length = Math.max(1, section.offsetHeight - height);
      needsStill = true; wake();
    };
    const onScroll = () => { if (reducedMotion) needsStill = true; wake(); };
    const onVisibility = () => { if (document.hidden) cancel(); else { needsStill = true; wake(); } };
    const updatePointer = (e: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      pointer.set(Math.max(0, Math.min(1, (e.clientX - rect.left) / width)), Math.max(0, Math.min(1, 1 - (e.clientY - rect.top) / height)), 1);
      if (heldId !== null) moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
    };
    const onPointerMove = (e: PointerEvent) => {
      if (reducedMotion || (heldId !== null && e.pointerId !== heldId)) return;
      if (heldId === null && (!stage.contains(e.target as Node) || e.pointerType === 'touch')) return;
      updatePointer(e); wake();
    };
    const onDown = (e: PointerEvent) => {
      if (reducedMotion || e.button !== 0 || e.ctrlKey || e.metaKey || heldId !== null || blocked()) return;
      if ((e.target as Element).closest('button,input,#end-bottom')) return;
      heldId = e.pointerId; downTime = performance.now(); downX = e.clientX; downY = e.clientY; moved = 0;
      updatePointer(e); field.uniforms.uHeld.value = 1; wake();
      // Do not cancel pointerdown or capture it onto the stage: quick clicks
      // must still reach the native mailto anchor, touch scrolling must survive.
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== heldId) return;
      if (performance.now() - downTime >= 180 || moved > 8) suppressClickUntil = performance.now() + 500;
      release(); if (e.pointerType === 'touch') pointer.z = 0;
    };
    const onCancel = () => { release(); pointer.z = 0; };
    const onLeave = () => { if (heldId === null) pointer.z = 0; };
    const onClick = (e: MouseEvent) => {
      if (performance.now() < suppressClickUntil && (e.target as Element).closest('#end-section-title-link')) e.preventDefault();
      suppressClickUntil = 0;
    };
    const onContextMenu = (event: MouseEvent) => { if (heldId !== null) event.preventDefault(); };
    const onLost = (e: Event) => { e.preventDefault(); lost = true; cancel(); canvas.style.opacity = "0"; setState("loading"); };
    const onRestored = () => { if (disposed) return; lost = false; renderer.resetState(); canvas.style.opacity = "1"; setState("ready"); resize(); };
    canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
    const io = new IntersectionObserver(entries => { visible = entries.some(entry => entry.isIntersecting); if (visible) { needsStill = true; wake(); } else cancel(); }); io.observe(stage);
    const ro = new ResizeObserver(resize); ro.observe(stage); ro.observe(section);
    const unsubscribe = useStudioStore.subscribe(() => { if (blocked()) cancel(); else { needsStill = true; wake(); } });
    stage.addEventListener("pointerdown", onDown); stage.addEventListener("pointerleave", onLeave); stage.addEventListener('click', onClick, true); stage.addEventListener('contextmenu', onContextMenu);
    window.addEventListener("pointermove", onPointerMove, { passive: true }); window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancel); window.addEventListener('blur', onCancel);
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility); document.fonts.ready.then(resize); resize();
    const probe = () => {
      const fluid = field.fluid, surface = Array(12).fill(0) as number[]; let active = 0;
      for (let k = 0; k < fluid.count; k++) if (fluid.active[k]) {
        active++; const bin = Math.max(0, Math.min(11, Math.floor(fluid.x[k] / fluid.width * 12))); surface[bin] = Math.max(surface[bin], fluid.y[k] / fluid.height);
      }
      return { frames, pending: !!rafId, progress, time, count: field.count, draws: renderer.info.render.calls, triangles: renderer.info.render.triangles,
        pointer: pointer.z, held: heldId !== null, emitter: fluid.emitterPosition, emitted: fluid.emitted, drained: fluid.drained, active, steps: fluid.steps, surface,
        frameTimes: [...frameTimes], state: lost ? "lost" : "ready" };
    };
    if (window.__enableCtaProbe) window.__ctaProbe = probe;
    return () => {
      disposed = true; cancel(); io.disconnect(); ro.disconnect(); unsubscribe();
      canvas.removeEventListener("webglcontextlost", onLost); canvas.removeEventListener("webglcontextrestored", onRestored);
      stage.removeEventListener("pointerdown", onDown); stage.removeEventListener("pointerleave", onLeave); stage.removeEventListener('click', onClick, true); stage.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener("pointermove", onPointerMove); window.removeEventListener("pointerup", onUp); window.removeEventListener("pointercancel", onCancel); window.removeEventListener('blur', onCancel);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVisibility);
      field.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove(); if (window.__ctaProbe === probe) delete window.__ctaProbe;
    };
  }, [reducedMotion]);

  return <div ref={hostRef} className="absolute inset-0" data-cta-field-state={state}>
    {state !== "ready" && <svg aria-hidden="true" viewBox="0 0 400 800" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
      {Array.from({ length: 96 }, (_, i) => {
        const y = 540 + Math.floor(i / 16) * 44, x = Number((8 + (i % 16) * 25 + Math.sin(i * 127.1) * 5).toFixed(3));
        return <rect key={i} x={x} y={y} width="3" height="3" fill="white" transform={`rotate(${i * 37} ${x} ${y})`} />;
      })}
    </svg>}
  </div>;
}
