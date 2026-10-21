"use client";

import { useEffect, useRef } from "react";

import { Signature } from "./Signature";

const GATE_KEY = "jrp-gate-seen";

type Point = { x: number; y: number };

/**
 * Two-stage entry, as on the reference site:
 *  1. the "Jithin" signature fills in as fonts and first-screen images arrive,
 *  2. a fresh visit then shows the water gate: draw a Z (or press Enter) and the
 *     sheet opens with a widening circular window.
 * The gate is shown once per browser session so a reload goes straight in.
 */
export function Loader() {
  const loaderRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const guideFillRef = useRef<SVGPathElement>(null);
  const signatureRef = useRef<HTMLDivElement>(null);
  const hintRef = useRef<HTMLParagraphElement>(null);
  const phaseRef = useRef<"fill" | "gate" | "done">("fill");

  useEffect(() => {
    const loader = loaderRef.current;
    const canvas = canvasRef.current;
    const fill = guideFillRef.current;
    const signature = signatureRef.current;
    const hint = hintRef.current;
    if (!loader || !canvas || !fill || !signature) return;

    const root = document.documentElement;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const desktop = !window.matchMedia("(max-width: 767px)").matches;
    let seen = true;
    try {
      seen = sessionStorage.getItem(GATE_KEY) === "1";
      sessionStorage.setItem(GATE_KEY, "1");
    } catch {
      seen = false;
    }

    let disposed = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };

    const revealPage = () => {
      if (phaseRef.current === "done") return;
      phaseRef.current = "done";
      root.classList.remove("is-loading");
      root.classList.add("is-ready");
      loader.classList.add("is-open");
      later(() => loader.classList.add("is-gone"), reduceMotion ? 0 : 1150);
    };

    /* ---------- stage 1: signature fills left → right ---------- */
    const gateEnabled = !reduceMotion && finePointer && desktop && !seen;
    const MIN_WRITE = reduceMotion ? 0 : seen ? 700 : 1800;
    const start = performance.now();
    root.classList.add("is-loading");

    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
    let shown = 0;
    let raf = 0;

    const tick = () => {
      if (disposed) return;
      const elapsed = performance.now() - start;
      const byTime = MIN_WRITE ? Math.min(1, elapsed / MIN_WRITE) : 1;
      shown += (byTime - shown) * 0.12;
      loader.style.setProperty("--p", `${(Math.min(1, shown) * 100).toFixed(2)}%`);
      if (shown < 0.995) {
        raf = requestAnimationFrame(tick);
        return;
      }
      loader.style.setProperty("--p", "100%");
      if (gateEnabled) startGate();
      else revealPage();
    };

    fontsReady.then(() => {
      if (!disposed) raf = requestAnimationFrame(tick);
    });

    /* ---------- stage 2: the water gate ---------- */
    function startGate() {
      phaseRef.current = "gate";
      if (!signature) return;
      signature.style.transition = "opacity .5s ease";
      signature.style.opacity = "0";
      canvas!.style.opacity = "0";
      canvas!.style.transition = "opacity .6s ease";
      requestAnimationFrame(() => {
        canvas!.style.opacity = "1";
      });
      loader!.classList.add("is-gate");
      if (guideFillRef.current) {
        const len = guideFillRef.current.getTotalLength();
        guideFillRef.current.style.strokeDasharray = `${len}`;
        guideFillRef.current.style.strokeDashoffset = `${len}`;
      }

      const ctx = canvas!.getContext("2d");
      if (!ctx) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const size = () => {
        canvas!.width = Math.floor(window.innerWidth * dpr);
        canvas!.height = Math.floor(window.innerHeight * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      };
      size();
      window.addEventListener("resize", size);

      let drawing = false;
      let path: Point[] = [];
      let opened = false;

      const guideEl = loader!.querySelector<SVGPathElement>(".loader__guide-path");
      const guideLen = guideEl ? guideEl.getTotalLength() : 1;

      const setProgress = (p: number) => {
        const f = guideFillRef.current;
        if (f) f.style.strokeDashoffset = `${guideLen * (1 - Math.min(1, Math.max(0, p)))}`;
      };

      const paint = () => {
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        if (path.length < 2) return;
        ctx.strokeStyle = "rgba(10,10,10,0.55)";
        ctx.lineWidth = 9;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(path[0].x, path[0].y);
        for (let i = 1; i < path.length; i++) ctx.lineTo(path[i].x, path[i].y);
        ctx.stroke();
      };

      /** Rough Z check: →, ↘ to the left, then → again. */
      const looksLikeZ = (pts: Point[]) => {
        if (pts.length < 12) return false;
        const total = pts.reduce(
          (acc, p, i) => (i ? acc + Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y) : 0),
          0,
        );
        if (total < Math.min(420, window.innerWidth * 0.4)) return false;
        const third = Math.floor(pts.length / 3);
        const seg = (a: Point[], b: Point[]) => ({
          dx: b[b.length - 1].x - a[0].x,
          dy: b[b.length - 1].y - a[0].y,
        });
        const s1 = seg(pts.slice(0, third), pts.slice(0, third));
        const s2 = seg(pts.slice(third, third * 2), pts.slice(third, third * 2));
        const s3 = seg(pts.slice(third * 2), pts.slice(third * 2));
        const down = Math.abs(s2.dy) > Math.abs(s2.dx) * 0.6;
        return s1.dx > 40 && down && s2.dx < -20 && s3.dx > 40;
      };

      const open = () => {
        if (opened) return;
        opened = true;
        setProgress(1);
        revealPage();
      };

      const onDown = (e: PointerEvent) => {
        if (opened) return;
        drawing = true;
        path = [{ x: e.clientX, y: e.clientY }];
        canvas!.setPointerCapture(e.pointerId);
      };
      const onMove = (e: PointerEvent) => {
        if (!drawing || opened) return;
        path.push({ x: e.clientX, y: e.clientY });
        paint();
        setProgress(path.length / 120);
        if (looksLikeZ(path)) open();
      };
      const onUp = () => {
        if (!drawing) return;
        drawing = false;
        if (opened) return;
        // not a Z: let the ink dissolve and try again
        path = [];
        setProgress(0);
        const fade = () => {
          ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        };
        later(fade, 260);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open();
        }
      };

      canvas!.style.pointerEvents = "auto";
      canvas!.addEventListener("pointerdown", onDown);
      canvas!.addEventListener("pointermove", onMove);
      canvas!.addEventListener("pointerup", onUp);
      canvas!.addEventListener("pointercancel", onUp);
      window.addEventListener("keydown", onKey);
      if (hint) hint.hidden = false;

      loader!.addEventListener(
        "cleanup-gate",
        () => {
          canvas!.removeEventListener("pointerdown", onDown);
          canvas!.removeEventListener("pointermove", onMove);
          canvas!.removeEventListener("pointerup", onUp);
          canvas!.removeEventListener("pointercancel", onUp);
          window.removeEventListener("keydown", onKey);
          window.removeEventListener("resize", size);
        },
        { once: true },
      );
    }

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      timers.forEach((t) => window.clearTimeout(t));
      loader.dispatchEvent(new Event("cleanup-gate"));
      root.classList.remove("is-loading");
      root.classList.add("is-ready");
    };
  }, []);

  return (
    <div className="loader" ref={loaderRef} aria-hidden="true" style={{ ["--p" as string]: "0%" }}>
      <div className="loader__sig" ref={signatureRef}>
        <div className="loader__ghost">
          <Signature />
        </div>
        <div className="loader__fill">
          <Signature />
        </div>
      </div>

      <canvas className="loader__water" ref={canvasRef} style={{ opacity: 0 }} />
      <svg className="loader__guide" viewBox="0 0 200 140">
        <path className="loader__guide-track loader__guide-path" d="M28 26H172L28 114H172" />
        <path className="loader__guide-fill" d="M28 26H172L28 114H172" ref={guideFillRef} />
      </svg>
      <p className="loader__hint" ref={hintRef} hidden>
        Draw a Z on the water
        <span>or press Enter to come in</span>
      </p>
    </div>
  );
}
