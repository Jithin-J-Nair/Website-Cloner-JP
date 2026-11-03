"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { createExpertiseStudy } from "@/components/three/ExpertiseStudies";
import { useStudioStore } from "@/lib/store";

declare global {
  interface Window {
    __enableExpertiseProbe?: boolean;
    __expertiseProbe?: () => { frames: number; pending: boolean; draws: number; reduced: boolean; lost: boolean; pointer: number[]; rotation: number[]; vertices: number };
  }
}

/** One viewport-sized renderer, scissored to four HTML diagram slots.
 * No four-context gallery and no section-height/mobile framebuffer. SVGs stay as fallback.
 */
export function AboutExpertiseField() {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useStudioStore(s => s.reducedMotion);
  useEffect(() => {
    const host = hostRef.current, section = host?.closest<HTMLElement>("#about-capability");
    if (!host || !section) return;
    const slots = Array.from(section.querySelectorAll<HTMLElement>("[data-expertise-drawing]"));
    const canvas = document.createElement("canvas");
    canvas.id = "about-expertise-canvas";
    canvas.setAttribute("aria-hidden", "true");
    canvas.className = "h-full w-full";
    canvas.style.opacity = "0";
    let renderer: THREE.WebGLRenderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: "low-power" }); }
    catch { host.dataset.state = "unavailable"; return; }
    host.appendChild(canvas);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    const studies = slots.map((_, i) => createExpertiseStudy(i));
    const camera = new THREE.OrthographicCamera(-1.6, 1.6, 1.45, -1.45, .1, 30);
    camera.position.z = 6;
    let raf = 0, disposed = false, visible = false, lost = false;
    let width = 1, height = 1, frames = 0, draws = 0, time = 0, previous = 0;
    const pointer = new THREE.Vector2(), target = new THREE.Vector2();
    const blocked = () => { const s = useStudioStore.getState(); return s.menuOpen || s.reelOpen || s.isTransitioning; };
    const cancel = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };
    const render = (now: number) => {
      raf = 0;
      if (disposed || lost || !visible || document.hidden || blocked()) return;
      const dt = previous ? Math.min(.06, (now - previous) / 1000) : 1 / 60;
      previous = now;
      if (!reduced) time += dt;
      pointer.lerp(target, 1 - Math.exp(-12 * dt));
      renderer.setScissorTest(false); renderer.clear(); renderer.setScissorTest(true);
      draws = 0;
      slots.forEach((slot, i) => {
        const rect = slot.getBoundingClientRect();
        if (rect.bottom <= 0 || rect.top >= height || rect.width <= 0 || rect.height <= 0) return;
        const bottom = height - rect.bottom;
        renderer.setViewport(rect.left, bottom, rect.width, rect.height);
        const left = Math.max(0, rect.left), top = Math.max(0, rect.top);
        renderer.setScissor(left, Math.max(0, bottom), Math.max(0, Math.min(width, rect.right) - left), Math.max(0, Math.min(height, rect.bottom) - top));
        const aspect = rect.width / rect.height;
        camera.left = -aspect * 1.45; camera.right = aspect * 1.45; camera.updateProjectionMatrix();
        // Reversible scroll orientation plus a slow sculptural turn; no reading copy moves.
        const progress = Math.max(0, Math.min(1, (height - rect.top) / (height + rect.height)));
        studies[i].group.rotation.set(i > 1 ? .6 + pointer.y * .1 : .15 + pointer.y * .1,
          (i > 1 ? -.55 : .15) + (reduced ? 0 : time * .1 + progress * .35 + pointer.x * .22), i === 1 ? -.16 : 0);
        renderer.render(studies[i].group, camera);
        draws += renderer.info.render.calls;
      });
      frames++;
      host.dataset.state = "ready";
      section.dataset.expertiseWebgl = "ready";
      canvas.style.opacity = "1";
      if (!reduced) raf = requestAnimationFrame(render);
    };
    const wake = () => { if (!disposed && !lost && visible && !document.hidden && !blocked() && !raf) raf = requestAnimationFrame(render); };
    const resize = () => {
      if (disposed || lost) return;
      width = Math.max(1, innerWidth); height = Math.max(1, innerHeight);
      renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.25, Math.sqrt(800000 / (width * height))));
      renderer.setSize(width, height, false); wake();
    };
    const move = (event: PointerEvent) => {
      if (reduced || event.pointerType === "touch" || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
      target.set(Math.max(-1, Math.min(1, event.clientX / width * 2 - 1)), Math.max(-1, Math.min(1, 1 - event.clientY / height * 2)));
      wake();
    };
    const release = () => { target.set(0, 0); wake(); };
    const visibility = () => { if (document.hidden) cancel(); else wake(); };
    const loss = (event: Event) => {
      event.preventDefault(); lost = true; cancel(); canvas.style.opacity = "0";
      delete section.dataset.expertiseWebgl; host.dataset.state = "lost";
    };
    const restored = () => { if (!disposed) { lost = false; resize(); } };
    canvas.addEventListener("webglcontextlost", loss);
    canvas.addEventListener("webglcontextrestored", restored);
    const io = new IntersectionObserver(entries => { visible = entries.some(e => e.isIntersecting); if (visible) wake(); else cancel(); });
    io.observe(section);
    const ro = new ResizeObserver(resize); ro.observe(section);
    const unsubscribe = useStudioStore.subscribe((state, old) => {
      if (state.menuOpen !== old.menuOpen || state.reelOpen !== old.reelOpen || state.isTransitioning !== old.isTransitioning) { if (blocked()) cancel(); else wake(); }
    });
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointercancel", release);
    window.addEventListener("blur", release);
    document.documentElement.addEventListener("pointerleave", release);
    document.addEventListener("visibilitychange", visibility);
    document.fonts.ready.then(resize);
    const probe = () => ({ frames, pending: !!raf, draws, reduced, lost, pointer: pointer.toArray(), rotation: studies[0].group.rotation.toArray().slice(0, 3) as number[], vertices: studies.reduce((sum, s) => sum + s.geometry.attributes.position.count, 0) });
    if (window.__enableExpertiseProbe) window.__expertiseProbe = probe;
    resize();
    return () => {
      disposed = true; cancel(); io.disconnect(); ro.disconnect(); unsubscribe();
      window.removeEventListener("scroll", wake); window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", move); window.removeEventListener("pointercancel", release); window.removeEventListener("blur", release);
      document.documentElement.removeEventListener("pointerleave", release); document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("webglcontextlost", loss); canvas.removeEventListener("webglcontextrestored", restored);
      studies.forEach(s => s.dispose()); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
      delete section.dataset.expertiseWebgl;
      if (window.__expertiseProbe === probe) delete window.__expertiseProbe;
    };
  }, [reduced]);
  return <div ref={hostRef} aria-hidden="true" data-state="loading" className="pointer-events-none fixed inset-0 z-10" />;
}
