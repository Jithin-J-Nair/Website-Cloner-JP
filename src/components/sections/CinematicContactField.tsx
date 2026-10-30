"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createContactParticleField } from "@/components/three/ContactParticleField";
import { useStudioStore } from "@/lib/store";

declare global {
  interface Window {
    __enableCtaProbe?: boolean;
    __ctaProbe?: () => { frames: number; pending: boolean; progress: number; time: number; count: number; draws: number; triangles: number; pointer: number; frameTimes: number[]; state: string };
  }
}

/** Independently owned blue-act renderer. No dependency on the Home journey clock/audio. */
export function CinematicContactField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState("loading");
  const reducedMotion = useStudioStore(s => s.reducedMotion);

  useEffect(() => {
    const host = hostRef.current;
    const stage = host?.closest<HTMLElement>("#end-section-outer");
    const section = host?.closest<HTMLElement>("section");
    if (!host || !stage || !section) return;
    // A disposed/lost context must never be rebound to the same React-owned canvas
    // during preference changes or Strict Mode effect replay.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "absolute inset-0 h-full w-full";
    canvas.style.opacity = "0";
    let disposed = false;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch {
      queueMicrotask(() => { if (!disposed) setState("unavailable"); });
      return () => { disposed = true; };
    }
    host.prepend(canvas);
    const gl = renderer.getContext();
    const debug = gl.getExtension("WEBGL_debug_renderer_info");
    const software = /swiftshader|llvmpipe|software/i.test(debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "");
    const count = window.innerWidth < 640 ? 720 : software ? 960 : 1600;
    const field = createContactParticleField(count);
    const scene = new THREE.Scene(); scene.add(field.group);
    const camera = new THREE.PerspectiveCamera(48, 1, .1, 40); camera.position.z = 10;
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    field.uniforms.uReduced.value = reducedMotion ? 1 : 0;
    const targetPointer = new THREE.Vector3();
    let width = 1, height = 1, start = 0, length = 1;
    let rafId = 0, frames = 0, previous = 0, time = .5, progress = 0;
    let visible = false, lost = false, needsStill = true;
    const frameTimes: number[] = [];
    const blocked = () => { const s = useStudioStore.getState(); return s.menuOpen || s.reelOpen; };
    const cancel = () => { cancelAnimationFrame(rafId); rafId = 0; previous = 0; };
    const frame = (now: number) => {
      rafId = 0;
      if (disposed || lost || !visible || document.hidden || blocked()) return;
      const elapsed = previous ? Math.max(0, (now - previous) / 1000) : 1 / 60;
      previous = now;
      if (!reducedMotion) time += Math.min(.08, elapsed);
      if (window.__enableCtaProbe) { frameTimes.push(elapsed * 1000); if (frameTimes.length > 120) frameTimes.shift(); }
      progress = Math.max(0, Math.min(1, (window.scrollY - start) / length));
      field.setTime(reducedMotion ? 0 : time);
      field.uniforms.uProgress.value = reducedMotion ? .5 : progress;
      field.uniforms.uPointer.value.lerp(targetPointer, 1 - Math.exp(-12 * elapsed));
      renderer.render(scene, camera);
      frames++; needsStill = false;
      if (frames === 1) { canvas.style.opacity = "1"; setState("ready"); }
      if (!reducedMotion) rafId = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!disposed && !lost && visible && !document.hidden && !blocked() && !rafId && (!reducedMotion || needsStill)) rafId = requestAnimationFrame(frame);
    };
    const resize = () => {
      if (disposed || lost) return;
      width = Math.max(1, stage.clientWidth); height = Math.max(1, stage.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, software ? 1 : 1.5, Math.sqrt((software ? 700000 : 1500000) / (width * height)));
      renderer.setPixelRatio(dpr); renderer.setSize(width, height, false);
      camera.aspect = width / height; camera.updateProjectionMatrix();
      const viewHeight = 20 * Math.tan(THREE.MathUtils.degToRad(24));
      field.uniforms.uViewport.value.set(viewHeight * camera.aspect, viewHeight);
      const rect = section.getBoundingClientRect();
      start = rect.top + window.scrollY;
      length = Math.max(1, section.offsetHeight - height);
      const title = stage.querySelector<HTMLElement>("#end-section-title");
      if (title) field.uniforms.uTextBottom.value = (.5 - (title.getBoundingClientRect().bottom - stage.getBoundingClientRect().top) / height) * viewHeight;
      needsStill = true; wake();
    };
    const onVisibility = () => { if (document.hidden) cancel(); else { needsStill = true; wake(); } };
    const onPointerMove = (e: PointerEvent) => {
      if (reducedMotion || e.pointerType === "touch" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      const rect = stage.getBoundingClientRect();
      const view = field.uniforms.uViewport.value;
      targetPointer.set(((e.clientX - rect.left) / width - .5) * view.x, (.5 - (e.clientY - rect.top) / height) * view.y, 1);
      wake();
    };
    const release = () => { targetPointer.z = 0; };
    const onLost = (e: Event) => { e.preventDefault(); lost = true; cancel(); canvas.style.opacity = "0"; setState("loading"); };
    const onRestored = () => { if (disposed) return; lost = false; renderer.resetState(); canvas.style.opacity = "1"; setState("ready"); resize(); };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    const io = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) { needsStill = true; wake(); } else cancel();
    });
    io.observe(stage);
    const ro = new ResizeObserver(resize);
    ro.observe(stage); ro.observe(section);
    const content = stage.querySelector("#end-section-content"); if (content) ro.observe(content);
    const unsubscribe = useStudioStore.subscribe(() => { if (blocked()) cancel(); else { needsStill = true; wake(); } });
    stage.addEventListener("pointermove", onPointerMove, { passive: true });
    stage.addEventListener("pointerleave", release);
    stage.addEventListener("pointercancel", release);
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    document.fonts.ready.then(resize);
    resize();
    const probe = () => ({ frames, pending: !!rafId, progress, time, count: field.count, draws: renderer.info.render.calls, triangles: renderer.info.render.triangles, pointer: field.uniforms.uPointer.value.z, frameTimes: [...frameTimes], state: lost ? "lost" : "ready" });
    if (window.__enableCtaProbe) window.__ctaProbe = probe;
    return () => {
      disposed = true; cancel(); io.disconnect(); ro.disconnect(); unsubscribe();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerleave", release);
      stage.removeEventListener("pointercancel", release);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
      field.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
      if (window.__ctaProbe === probe) delete window.__ctaProbe;
    };
  }, [reducedMotion]);

  return (
    <div ref={hostRef} className="absolute inset-0" data-cta-field-state={state}>
      {state !== "ready" && <svg aria-hidden="true" viewBox="0 0 400 800" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {Array.from({ length: 96 }, (_, i) => {
          const y = 420 + (i / 95) * 340;
          const x = 200 + Math.sin(i * 127.1) * ((y - 400) * .34);
          return <rect key={i} x={x} y={y} width="3" height="3" fill="white" transform={`rotate(${i * 37} ${x} ${y})`} />;
        })}
      </svg>}
    </div>
  );
}
