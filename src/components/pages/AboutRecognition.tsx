"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { LUSION_ABOUT } from "@/data/reference";
import { useStudioStore } from "@/lib/store";
import { createAboutRecognitionMotion } from "@/components/three/AboutRecognitionMotion";
import { createAboutRecognitionPaint } from "@/components/three/AboutRecognitionPaint";
import { RecognitionMark } from "./AboutRecognitionMarks";

declare global {
  interface Window {
    __enableRecognitionProbe?: boolean;
    __recognitionProbe?: () => { frames: number; pending: boolean; state: string; edges: number; progress: number; time: number; pointer: boolean };
  }
}

function Characters({ text }: { text: string }) {
  return <>{[...text].map((char, i) => <span key={i} data-recognition-char aria-hidden="true">{char}</span>)}</>;
}
function Words({ text, delay = 0 }: { text: string; delay?: number }) {
  return <>{text.split(" ").map((word, i) => <span className="about-recognition-word-clip" key={i}>
    <span data-recognition-word data-recognition-delay={delay + i / 50}>{word}</span>{" "}
  </span>)}</>;
}
function RecordHeader({ kind, count }: { kind: "awards" | "articles" | "talks"; count: string | number }) {
  return <div className="about-recognition-header" data-recognition-header>
    <h2 id={`about-${kind}-record-title`} aria-label={kind.toUpperCase()}><Characters text={kind.toUpperCase()} /></h2>
    <div className="about-source-record-count"><RecognitionMark kind={kind} />
      <span data-recognition-number aria-label={String(count)}><Characters text={String(count)} /></span>
    </div>
  </div>;
}

/** The vector title, swept paint and reversible editorial reveals share ONE
 * visible-section RAF. The accessible table never depends on GPU availability. */
export function AboutRecognition() {
  const recognition = LUSION_ABOUT.recognition;
  const root = useRef<HTMLElement>(null), hostRef = useRef<HTMLDivElement>(null);
  const reduced = useStudioStore(s => s.reducedMotion);
  useEffect(() => {
    const section = root.current, host = hostRef.current;
    if (!section || !host) return;
    const motion = createAboutRecognitionMotion(section, reduced), abort = new AbortController();
    let renderer: THREE.WebGLRenderer | undefined, paint: ReturnType<typeof createAboutRecognitionPaint> | undefined;
    let canvas: HTMLCanvasElement | undefined, initializing = false, disposed = false, visible = false, lost = false;
    let raf = 0, frames = 0, previous = 0, width = 1, height = 1, needsStill = true;
    let motionUntil = performance.now() + 1500;
    const pointer = { x: 0, y: 0, active: false };
    const blocked = () => { const s = useStudioStore.getState(); return s.menuOpen || s.reelOpen; };
    const cancel = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; pointer.active = false; };
    const frame = (now: number) => {
      raf = 0;
      if (disposed || !visible || lost || document.hidden || blocked()) return;
      const dt = previous ? Math.min(.1, (now - previous) / 1000) : 1 / 60; previous = now;
      const rect = section.getBoundingClientRect(), canvasTop = canvas?.getBoundingClientRect().top || 0;
      // The following light expertise act inverts the title during its handoff.
      const capability = document.getElementById("about-capability")?.getBoundingClientRect();
      const invert = reduced || !capability ? 0 : Math.max(0, Math.min(1, (height - capability.top) / (height + capability.height) * 8));
      paint?.update(dt, rect.top - canvasTop, rect.height, scrollY, { ...pointer, y: pointer.y - canvasTop }, reduced, invert);
      motion.update(reduced ? 1.5 : dt); frames++; needsStill = false;
      if (paint) section.dataset.recognitionState = "ready";
      if (!reduced && (paint || section.dataset.recognitionState !== "unavailable" || now < motionUntil)) raf = requestAnimationFrame(frame);
    };
    const wake = () => {
      if (!disposed && visible && !lost && !document.hidden && !blocked() && !raf && (!reduced || needsStill)) raf = requestAnimationFrame(frame);
    };
    const resize = () => {
      if (disposed || lost) return;
      width = section.clientWidth; height = innerHeight;
      if (renderer && canvas && paint) {
        const gl = renderer.getContext(), debug = gl.getExtension("WEBGL_debug_renderer_info");
        const software = /swiftshader|llvmpipe|software/i.test(debug ? String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)) : "");
        const dpr = Math.min(devicePixelRatio || 1, 1.5, Math.sqrt((software ? 1200000 : 2200000) / (width * height)));
        renderer.setPixelRatio(dpr); renderer.setSize(width, height, false); paint.resize(width, height, dpr);
      }
      needsStill = true; wake();
    };
    const onLost = (e: Event) => { e.preventDefault(); lost = true; cancel(); section.dataset.recognitionState = "lost"; };
    const onRestored = () => { if (disposed) return; lost = false; renderer?.resetState(); resize(); };
    const initialize = async () => {
      if (initializing || reduced || disposed) return;
      initializing = true; section.dataset.recognitionState = "loading";
      let gradient: THREE.Texture | undefined;
      try {
        // Await both even on failure so an in-flight texture cannot leak.
        const [vectorResult, textureResult] = await Promise.allSettled([
          fetch("/sites/lusion/about/award-title.svg", { signal: abort.signal }).then(response => {
            if (!response.ok) throw new Error("Recognition vector unavailable"); return response.text();
          }),
          new THREE.TextureLoader().loadAsync("/about/scene/award_gradient.png"),
        ]);
        if (textureResult.status === "fulfilled") gradient = textureResult.value;
        if (disposed || vectorResult.status !== "fulfilled" || !gradient) {
          gradient?.dispose(); if (!disposed) section.dataset.recognitionState = "unavailable"; return;
        }
        canvas = document.createElement("canvas"); canvas.setAttribute("aria-hidden", "true");
        renderer = new THREE.WebGLRenderer({ canvas, alpha: true, premultipliedAlpha: false, antialias: true, powerPreference: "high-performance" });
        renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
        paint = createAboutRecognitionPaint(renderer, vectorResult.value, gradient);
        canvas.addEventListener("webglcontextlost", onLost); canvas.addEventListener("webglcontextrestored", onRestored);
        host.append(canvas); resize();
      } catch {
        gradient?.dispose(); renderer?.dispose(); renderer = undefined;
        if (!disposed) section.dataset.recognitionState = "unavailable";
      }
    };
    const onScroll = () => { motionUntil = performance.now() + 1500; needsStill = true; wake(); };
    const onPointer = (e: PointerEvent) => {
      if (reduced || e.pointerType === "touch" || blocked()) return;
      pointer.x = e.clientX; pointer.y = e.clientY; pointer.active = true; wake();
    };
    const leave = () => { pointer.active = false; };
    const onVisibility = () => { if (document.hidden) cancel(); else { needsStill = true; wake(); } };
    const io = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      if (visible) { void initialize(); motionUntil = performance.now() + 1500; needsStill = true; wake(); } else { cancel(); motion.reset(); }
    }); io.observe(section);
    const ro = new ResizeObserver(resize); ro.observe(section);
    const unsubscribe = useStudioStore.subscribe(() => { if (blocked()) cancel(); else { needsStill = true; wake(); } });
    section.addEventListener("pointermove", onPointer, { passive: true }); section.addEventListener("pointerleave", leave);
    window.addEventListener("scroll", onScroll, { passive: true }); window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("blur", leave); document.addEventListener("visibilitychange", onVisibility);
    void document.fonts.ready.then(resize); resize();
    const probe = () => ({ frames, pending: !!raf, state: section.dataset.recognitionState || (reduced ? "reduced" : "idle"),
      edges: paint?.edgeCount || 0, progress: paint?.uniforms.uScrollRatio.value || 0, time: paint?.uniforms.uTime.value || 0, pointer: pointer.active });
    if (window.__enableRecognitionProbe) window.__recognitionProbe = probe;
    return () => {
      disposed = true; abort.abort(); cancel(); io.disconnect(); ro.disconnect(); unsubscribe(); motion.dispose();
      section.removeEventListener("pointermove", onPointer); section.removeEventListener("pointerleave", leave);
      window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", resize); window.removeEventListener("blur", leave);
      document.removeEventListener("visibilitychange", onVisibility);
      canvas?.removeEventListener("webglcontextlost", onLost); canvas?.removeEventListener("webglcontextrestored", onRestored);
      paint?.dispose(); renderer?.dispose(); canvas?.remove(); delete section.dataset.recognitionState;
      if (window.__recognitionProbe === probe) delete window.__recognitionProbe;
    };
  }, [reduced]);
  return (
    <section ref={root} id="about-award" className="about-source-recognition">
      <div className="about-source-monument" aria-hidden="true">
        {/* Vector artwork, not a downloaded commercial font. Also the no-GPU/reduced-motion fallback. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/sites/lusion/about/award-title.svg" alt="" width="1440" height="1250" />
        <div ref={hostRef} className="about-recognition-paint" />
      </div>
      <div id="about-recognition-window" role="region" aria-label="Awards, articles and talks" tabIndex={0}>
        <section className="about-source-record" aria-labelledby="about-awards-record-title">
          <RecordHeader kind="awards" count={recognition.awardsDisplayedTotal} />
          <div className="about-source-record-data">
            {recognition.awardGroups.map(group => <div className="about-source-award-group" key={group.organization} data-recognition-item>
              <span className="about-recognition-line" aria-hidden="true" />
              <h3><Words text={group.organization} /></h3>
              <ul>{group.honors.map((honor, index) => <li key={honor.recognition}>
                <span className="about-source-count"><Words text={honor.countFormatted} delay={index / 10 + .05} /></span>
                <span><Words text={honor.recognition} delay={index / 10 + .1} /></span>
              </li>)}</ul>
            </div>)}
          </div>
        </section>
        <section className="about-source-record" aria-labelledby="about-articles-record-title">
          <RecordHeader kind="articles" count={recognition.articlesDisplayedTotal} />
          <div className="about-source-record-data about-source-articles" data-recognition-item>
            <span className="about-recognition-line" aria-hidden="true" />
            <ul>{recognition.articles.map((article, i) => <li key={article.href}>
              <a href={article.href} target="_blank" rel="noopener noreferrer"><span aria-hidden="true" className="about-recognition-link-arrow">↗</span>
                <span className="about-recognition-link-title"><Words text={article.title} delay={i / 20} /></span>
              </a>
            </li>)}</ul>
          </div>
        </section>
        <section className="about-source-record" aria-labelledby="about-talks-record-title">
          <RecordHeader kind="talks" count={recognition.talksDisplayedTotal} />
          <div className="about-source-record-data about-source-talks" data-recognition-item>
            <span className="about-recognition-line" aria-hidden="true" />
            <ul>{recognition.talks.map((talk, i) => <li key={`${talk.event}-${talk.dateAndLocation}`}>
              <span><Words text={talk.event} delay={i / 20} /></span><span><Words text={talk.dateAndLocation} delay={i / 20 + .05} /></span>
            </li>)}</ul>
          </div>
        </section>
      </div>
    </section>
  );
}
