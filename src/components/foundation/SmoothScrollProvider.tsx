"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { STAGE_TELEMETRY, useStudioStore } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const pathname = usePathname();

  const menuOpen = useStudioStore((s) => s.menuOpen);
  const reelOpen = useStudioStore((s) => s.reelOpen);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const setReducedMotion = useStudioStore((s) => s.setReducedMotion);
  const setTransition = useStudioStore((s) => s.setTransition);

  // Sync OS prefers-reduced-motion preference live
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [setReducedMotion]);

  // Initialize Lenis synced directly to GSAP's ticker
  useEffect(() => {
    if (reducedMotion) {
      const onNativeScroll = () => {
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        STAGE_TELEMETRY.scrollY = window.scrollY;
        STAGE_TELEMETRY.scrollProgress = window.scrollY / maxScroll;
        STAGE_TELEMETRY.scrollVelocity = 0;
      };
      onNativeScroll();
      window.addEventListener("scroll", onNativeScroll, { passive: true });
      window.addEventListener("resize", onNativeScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", onNativeScroll);
        window.removeEventListener("resize", onNativeScroll);
      };
    }

    const lenis = new Lenis({
      duration: 0.92,
      easing: (t) => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3.2),
      smoothWheel: true,
      syncTouch: false,
      touchMultiplier: 1.25,
    });
    lenisRef.current = lenis;
    (window as unknown as { __lenis?: Lenis }).__lenis = lenis;

    // Preserve programmatic `window.scrollTo(...)` jumps without Lenis snapping back to old targetScroll
    let syncingProgrammatic = false;
    const onNativeJump = () => {
      if (syncingProgrammatic || lenis.isScrolling) return;
      const nativeY = window.scrollY;
      if (Math.abs(nativeY - lenis.animatedScroll) > 2) {
        syncingProgrammatic = true;
        lenis.resize();
        lenis.scrollTo(nativeY, { immediate: true });
        STAGE_TELEMETRY.scrollY = nativeY;
        const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
        STAGE_TELEMETRY.scrollProgress = nativeY / maxScroll;
        ScrollTrigger.update();
        syncingProgrammatic = false;
      }
    };
    window.addEventListener("scroll", onNativeJump, { passive: true });

    lenis.on("scroll", ({ scroll, progress, velocity }: { scroll: number; progress: number; velocity: number }) => {
      STAGE_TELEMETRY.scrollY = scroll;
      STAGE_TELEMETRY.scrollProgress = progress;
      STAGE_TELEMETRY.scrollVelocity = velocity;
      ScrollTrigger.update();
    });

    const updateLenis = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateLenis);
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener("scroll", onNativeJump);
      gsap.ticker.remove(updateLenis);
      lenis.destroy();
      lenisRef.current = null;
      delete (window as unknown as { __lenis?: Lenis }).__lenis;
    };
  }, [reducedMotion]);

  // Pause background scrolling cleanly when modal overlays open
  useEffect(() => {
    const lenis = lenisRef.current;
    if (!lenis) return;
    if (menuOpen || reelOpen) {
      lenis.stop();
    } else {
      lenis.start();
    }
  }, [menuOpen, reelOpen, reducedMotion]);

  // Reset scroll position and lift transition curtain cleanly upon route commit
  useEffect(() => {
    // Preserve explicit fragment intent (including /contact -> /#footer-section).
    // An unconditional zero reset raced the browser's anchor jump and left the
    // fixed scene at the footer coordinate while the native document was at zero.
    let fragmentTarget: HTMLElement | null = null;
    try {
      fragmentTarget = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    } catch {
      // A malformed fragment is not a valid destination; ordinary routes reset.
    }
    const targetY = fragmentTarget ? fragmentTarget.getBoundingClientRect().top + window.scrollY : 0;
    if (lenisRef.current) {
      lenisRef.current.resize();
      lenisRef.current.scrollTo(targetY, { immediate: true });
    } else {
      window.scrollTo(0, targetY);
    }
    STAGE_TELEMETRY.scrollY = window.scrollY;
    STAGE_TELEMETRY.scrollProgress = window.scrollY / Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    STAGE_TELEMETRY.scrollVelocity = 0;

    const timer = window.setTimeout(() => {
      ScrollTrigger.refresh();
      setTransition(false, "");
    }, 120);

    return () => window.clearTimeout(timer);
  }, [pathname, setTransition]);

  return <>{children}</>;
}
