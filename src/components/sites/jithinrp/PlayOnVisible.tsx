"use client";

import { useEffect, useRef } from "react";

type PlayOnVisibleProps = {
  src: string;
  poster?: string;
  className?: string;
  controls?: boolean;
  /** Loop forever (previews) or play once (trailers). */
  loop?: boolean;
};

/**
 * Mirrors the reference's media behaviour: the videos are `preload="none"` and only
 * start playing while they are on screen (posters stand in otherwise).
 */
export function PlayOnVisible({ src, poster, className, controls = false, loop = true }: PlayOnVisibleProps) {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion && !controls) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const played = video.play();
          if (played) played.catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [src, controls]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop={loop}
      playsInline
      preload="none"
      controls={controls}
      src={src}
      aria-hidden={controls ? undefined : true}
    />
  );
}
