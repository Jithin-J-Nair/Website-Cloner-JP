"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudioStore } from "@/lib/store";

const SESSION_KEY = "lusion_booted_v1";

/**
 * Lusion Cold-Start Preloader (`#preloader`)
 *
 * Hydration-safe (`visible` starts `true` on both SSR and initial client pass so
 * Framer Motion `AnimatePresence` never orphans the SSR node on warm reloads),
 * immediately dismissing in `0ms` when `sessionStorage` is warm or when
 * `prefers-reduced-motion: reduce` is active (backed up by CSS `display: none`).
 */
export function Preloader() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0);
  const [instantExit, setInstantExit] = useState(false);
  const setPreloaderDone = useStudioStore((s) => s.setPreloaderDone);

  const finishBoot = useCallback(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // Private mode or restricted storage
    }
    document.documentElement.classList.add("is-ready");
    setVisible(false);
    setPreloaderDone(true);
  }, [setPreloaderDone]);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let warm = false;
    try {
      warm = sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      warm = false;
    }

    if (reduced || warm) {
      const id = window.setTimeout(() => {
        setInstantExit(true);
        finishBoot();
      }, 0);
      return () => window.clearTimeout(id);
    }

    const start = performance.now();
    const duration = 460;
    let raf = 0;

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(Math.round(eased * 100));
      if (t < 1) {
        raf = window.requestAnimationFrame(tick);
      } else {
        window.setTimeout(finishBoot, 60);
      }
    };

    raf = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(raf);
  }, [finishBoot]);

  const padded = String(progress).padStart(3, "0");

  if (!visible && instantExit) {
    return null;
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          id="preloader"
          key="lusion-preloader"
          role="status"
          aria-live="polite"
          aria-label={`Loading Lusion experience ${progress} percent`}
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            transition: { duration: instantExit ? 0.01 : 0.34, ease: [0.4, 0, 0.1, 1] },
          }}
          className="fixed inset-0 z-[200] flex items-center justify-center bg-[#000000] text-[#ffffff]"
        >
          {/* Signature Lusion Geometric Stepped-'L' Aperture Mark */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0.85 }}
            animate={{ scale: 1 + progress * 0.0018, opacity: 1 }}
            exit={{
              scale: instantExit ? 1 : 3.2,
              opacity: 0,
              transition: { duration: instantExit ? 0.01 : 0.36, ease: [0.4, 0, 0.1, 1] },
            }}
            className="pointer-events-none relative flex items-center justify-center"
          >
            <svg
              width="86"
              height="108"
              viewBox="0 0 86 108"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="w-[72px] sm:w-[86px]"
            >
              <path d="M0 0H43V54H86V108H0V0Z" fill="#FFFFFF" />
            </svg>
          </motion.div>

          {/* Reference `#preloader-percent-digits` at bottom-left */}
          <div
            id="preloader-percent-digits"
            className="pointer-events-none fixed bottom-3 left-[var(--base-padding-x)] flex items-end overflow-hidden font-sans text-[13vw] leading-[0.82] font-normal tracking-[-0.04em] text-white tabular-nums select-none md:bottom-5 md:text-[clamp(6.5rem,8vw,11rem)]"
          >
            <span>{padded[0]}</span>
            <span>{padded[1]}</span>
            <span>{padded[2]}</span>
          </div>

          {/* Keyboard- and pointer-accessible immediate Skip control */}
          <button
            type="button"
            onClick={finishBoot}
            className="fixed right-[var(--base-padding-x)] bottom-6 rounded-full border border-white/20 bg-white/10 px-4 py-2 font-mono text-[11px] font-medium tracking-[0.1em] text-white/85 uppercase transition-colors hover:bg-white hover:text-black"
          >
            Skip
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
