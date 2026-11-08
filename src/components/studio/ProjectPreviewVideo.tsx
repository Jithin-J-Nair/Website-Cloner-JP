"use client";

import { useEffect, useRef } from "react";
import { useStudioStore } from "@/lib/store";

/** A gallery preview has no independent clock: browser playback is paused when
 * hidden, offscreen, reduced-motion, or covered by the shared reel. Only the
 * selected responsive source is loaded, and only when the preview is visible. */
export function ProjectPreviewVideo({ desktopSrc, mobileSrc, poster, onError }: {
  desktopSrc: string;
  mobileSrc: string;
  poster: string;
  onError: () => void;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduced = useStudioStore(state => state.reducedMotion);
  const menuOpen = useStudioStore(state => state.menuOpen);
  const transitioning = useStudioStore(state => state.isTransitioning);
  const reelOpen = useStudioStore(state => state.reelOpen);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const media = window.matchMedia("(max-width: 812px)");
    let visible = false;
    let disposed = false;
    const canPlay = () => !disposed && visible && !document.hidden && !reduced && !reelOpen && !menuOpen && !transitioning;
    const sync = () => {
      const source = media.matches ? mobileSrc : desktopSrc;
      video.dataset.previewSource = source;
      if (!canPlay()) { video.pause(); return; }
      if (video.getAttribute("src") !== source) {
        video.src = source;
        video.load();
      }
      // Autoplay refusal is not a missing asset. Keep the poster and let the
      // existing, user-activated modal remain the accessible playback control.
      void video.play().then(() => { if (!canPlay()) video.pause(); }).catch(() => {});
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      sync();
    });
    observer.observe(video);
    media.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      disposed = true;
      observer.disconnect();
      media.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
      video.pause();
    };
  }, [desktopSrc, mobileSrc, reduced, reelOpen, menuOpen, transitioning]);

  return <video ref={ref} poster={poster} muted loop playsInline preload="none"
    aria-hidden="true" onError={onError}
    className="h-full w-full object-cover" />;
}
