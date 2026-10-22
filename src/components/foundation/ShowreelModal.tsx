"use client";

import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudioStore, type VideoOverlayConfig } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { ProceduralReelStream } from "@/components/studio/ProceduralReelStream";

function VideoOverlaySession({
  videoConfig,
  initialAudioEnabled,
  onClose,
}: {
  videoConfig: VideoOverlayConfig;
  initialAudioEnabled: boolean;
  onClose: () => void;
}) {
  const setAudioEnabled = useStudioStore((s) => s.setAudioEnabled);

  const dialogRef = useRef<HTMLDivElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(!initialAudioEnabled);
  const [progressPct, setProgressPct] = useState(0);
  const [isMobileViewport, setIsMobileViewport] = useState(
    () => typeof window !== "undefined" && window.innerWidth <= 812
  );
  const [useExternalMp4, setUseExternalMp4] = useState(true);
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200, visible: false });

  useEffect(() => {
    const updateViewport = () => setIsMobileViewport(window.innerWidth <= 812);
    window.addEventListener("resize", updateViewport, { passive: true });
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  // Synthetic timeline ticker when running procedural clean-room stream
  useEffect(() => {
    if (useExternalMp4 || !isPlaying) return;
    const id = window.setInterval(() => {
      setProgressPct((prev) => (prev >= 100 ? 0 : +(prev + 0.5).toFixed(2)));
    }, 90);
    return () => window.clearInterval(id);
  }, [isPlaying, useExternalMp4]);

  const restoreFocusAndClose = React.useCallback(() => {
    const returnTarget = previousFocusRef.current;
    onClose();
    if (returnTarget && document.contains(returnTarget)) {
      returnTarget.focus();
      window.requestAnimationFrame(() => {
        if (document.contains(returnTarget)) returnTarget.focus();
      });
    }
  }, [onClose]);

  // WAI-ARIA modal focus management: capture invoker, move focus into modal, trap Tab/Shift+Tab, restore on close/unmount
  useEffect(() => {
    previousFocusRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    const focusTimer = window.requestAnimationFrame(() => {
      closeBtnRef.current?.focus();
    });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        soundEngine.playClick();
        restoreFocusAndClose();
        return;
      }

      if (e.key === "Tab") {
        const root = dialogRef.current;
        if (!root) return;
        const focusables = Array.from(
          root.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!active || active === first || !root.contains(active)) {
            e.preventDefault();
            last.focus();
          }
        } else if (!active || active === last || !root.contains(active)) {
          e.preventDefault();
          first.focus();
        }
        return;
      }

      if (e.key === " " && document.activeElement?.tagName !== "BUTTON") {
        e.preventDefault();
        setIsPlaying((prev) => {
          const next = !prev;
          const v = videoRef.current;
          if (v) {
            if (next) v.play().catch(() => {});
            else v.pause();
          }
          return next;
        });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusTimer);
      window.removeEventListener("keydown", onKeyDown);
      const returnTarget = previousFocusRef.current;
      if (returnTarget && document.contains(returnTarget)) {
        returnTarget.focus();
      }
    };
  }, [restoreFocusAndClose]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    soundEngine.playClick();
    setIsPlaying((prev) => {
      const next = !prev;
      const v = videoRef.current;
      if (v) {
        if (next) v.play().catch(() => {});
        else v.pause();
      }
      return next;
    });
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
    const ok = soundEngine.setEnabled(!nextMuted);
    setAudioEnabled(ok);
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / Math.max(1, rect.width)));
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration) && v.duration > 0) {
      v.currentTime = ratio * v.duration;
    }
    setProgressPct(ratio * 100);
  };

  const handleSliderKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setProgressPct((p) => Math.min(100, p + 5));
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      setProgressPct((p) => Math.max(0, p - 5));
    }
  };

  const activeSrc = isMobileViewport ? videoConfig.mobileSrc : videoConfig.desktopSrc;

  return (
    <motion.div
      id="video-overlay"
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label={videoConfig.title}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, transition: { duration: 0.28, ease: [0.4, 0, 0.1, 1] } }}
      exit={{ opacity: 0, transition: { duration: 0.22 } }}
      onClick={() => {
        soundEngine.playClick();
        onClose();
      }}
      onMouseMove={(e) =>
        setCursorPos({ x: e.clientX, y: e.clientY, visible: !isMobileViewport })
      }
      onMouseLeave={() => setCursorPos((prev) => ({ ...prev, visible: false }))}
      className="fixed inset-0 z-[99] flex items-center justify-center bg-[#000000] text-[clamp(1rem,1vw,1.5rem)] text-white"
    >
      {/* Video Stage (`#video-overlay__vimeo-video`) */}
      <div
        id="video-overlay__vimeo-video"
        className="relative flex h-full w-full items-center justify-center px-[4vw] py-[10vh]"
      >
        {useExternalMp4 ? (
          <video
            ref={videoRef}
            key={activeSrc}
            src={activeSrc}
            autoPlay
            loop
            muted={isMuted}
            playsInline
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration > 0) {
                setProgressPct((v.currentTime / v.duration) * 100);
              }
            }}
            onError={() => setUseExternalMp4(false)}
            className="max-h-full max-w-full rounded-[var(--global-border-radius)] object-contain shadow-[0_32px_100px_rgba(0,0,0,0.85)]"
          />
        ) : (
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative aspect-[16/9] max-h-full w-full max-w-5xl overflow-hidden rounded-[var(--global-border-radius)] border border-white/15 bg-[#07080d] shadow-[0_32px_100px_rgba(0,0,0,0.85)]"
          >
            <ProceduralReelStream
              variant="modal"
              paused={!isPlaying}
              progressRatio={progressPct / 100}
              label={videoConfig.title}
            />
          </div>
        )}

        {videoConfig.vimeoId && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="fixed top-[var(--base-padding-y)] left-[var(--base-padding-x)] max-w-[calc(100vw-var(--base-padding-x)*2-3.6rem)] truncate rounded-full border border-white/15 bg-black/60 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.06em] text-white/75 backdrop-blur-md"
          >
            {videoConfig.title} · Real-time studio reel
          </div>
        )}
      </div>

      {/* Mobile & Keyboard Close Button (`#video-overlay__mobile-close-btn`) */}
      <button
        id="video-overlay__mobile-close-btn"
        ref={closeBtnRef}
        type="button"
        aria-label="Close video overlay"
        onClick={(e) => {
          e.stopPropagation();
          soundEngine.playClick();
          onClose();
        }}
        className="fixed top-[var(--base-padding-y)] right-[var(--base-padding-x)] z-20 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-[#2b2e3a] text-white transition-colors hover:bg-white hover:text-black focus-visible:outline-2 focus-visible:outline-white"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M3.75781 3.75732L12.2431 12.2426" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          <path d="M12.2422 3.75732L3.75691 12.2426" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </button>

      {/* Reference 12-Column Bottom Controls (`#video-overlay__controls`) */}
      <div
        id="video-overlay__controls"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => setCursorPos((prev) => ({ ...prev, visible: false }))}
        className="fixed inset-x-0 bottom-[5vh] z-20 flex items-center gap-4 px-[var(--base-padding-x)] min-[813px]:grid min-[813px]:grid-cols-12 min-[813px]:gap-[var(--grid-gap)]"
      >
        <button
          id="video-overlay__play-btn"
          type="button"
          onClick={togglePlay}
          className="shrink-0 cursor-pointer text-right font-sans text-[0.9em] font-normal tracking-[0.04em] text-white uppercase focus-visible:outline-2 focus-visible:outline-white min-[813px]:col-span-2"
        >
          {isPlaying ? "PAUSE" : "PLAY"}
        </button>

        <div
          id="video-overlay__progress-container"
          role="slider"
          tabIndex={0}
          aria-label="Video playback progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progressPct)}
          onClick={handleScrub}
          onKeyDown={handleSliderKeyDown}
          className="relative flex h-8 flex-1 cursor-pointer items-center focus-visible:outline-2 focus-visible:outline-white min-[813px]:col-span-8"
        >
          <div
            id="video-overlay__progress-bg"
            className="h-[0.35em] w-full rounded-full bg-white/20"
          />
          <div
            id="video-overlay__progress-active"
            style={{ width: `${progressPct}%` }}
            className="pointer-events-none absolute left-0 h-[0.35em] rounded-full bg-white"
          />
        </div>

        <button
          id="video-overlay__mute-btn"
          type="button"
          onClick={toggleMute}
          className="shrink-0 cursor-pointer text-left font-sans text-[0.9em] font-normal tracking-[0.04em] text-white uppercase focus-visible:outline-2 focus-visible:outline-white min-[813px]:col-span-2"
        >
          {isMuted ? "UNMUTE" : "MUTE"}
        </button>
      </div>

      {/* Floating Close Cursor (`#video-overlay-cursor`, fine pointer desktop) */}
      {cursorPos.visible && (
        <div
          id="video-overlay-cursor"
          aria-hidden="true"
          style={{
            transform: `translate3d(${cursorPos.x}px, ${cursorPos.y}px, 0) translate(-50%, -50%)`,
          }}
          className="pointer-events-none fixed top-0 left-0 z-10 flex h-20 w-20 items-center justify-center rounded-full bg-white text-[#020022] shadow-lg"
        >
          <svg id="video-overlay-cursor-svg" width="30" height="30" viewBox="0 0 36 36" fill="none">
            <path
              d="M31 31 17.928 18 31 5M5 5l13.072 13L5 31"
              stroke="#020022"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}
    </motion.div>
  );
}

/**
 * Shared Lusion Video Overlay (`#video-overlay`)
 */
export function ShowreelModal() {
  const open = useStudioStore((s) => s.reelOpen);
  const videoConfig = useStudioStore((s) => s.videoConfig);
  const setOpen = useStudioStore((s) => s.setReelOpen);
  const audioEnabled = useStudioStore((s) => s.audioEnabled);

  return (
    <AnimatePresence>
      {open && (
        <VideoOverlaySession
          key={videoConfig.desktopSrc}
          videoConfig={videoConfig}
          initialAudioEnabled={audioEnabled}
          onClose={() => setOpen(false)}
        />
      )}
    </AnimatePresence>
  );
}
