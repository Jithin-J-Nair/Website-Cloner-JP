"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import type { SurfaceTheme } from "@/lib/tokens";
import { useStudioStore, type WebGLSceneMode } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

interface SurfaceSectionProps {
  id?: string;
  surface: SurfaceTheme;
  webglMode?: WebGLSceneMode;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}

/**
 * Semantic section wrapper that synchronizes document palette (`ice` | `void` | `cobalt`)
 * and global WebGL scene preset as the visitor scrolls through chapters.
 */
export function SurfaceSection({
  id,
  surface,
  webglMode,
  className,
  children,
  ariaLabel,
}: SurfaceSectionProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const setWebglMode = useStudioStore((s) => s.setWebglMode);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const activate = () => {
      setActiveSurface(surface);
      if (webglMode) setWebglMode(webglMode);
    };

    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 52%",
      end: "bottom 48%",
      onEnter: activate,
      onEnterBack: activate,
    });

    return () => {
      st.kill();
    };
  }, [setActiveSurface, setWebglMode, surface, webglMode]);

  return (
    <section
      ref={sectionRef}
      id={id}
      aria-label={ariaLabel}
      data-surface={surface}
      className={cn(
        "relative z-10 w-full transition-colors duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
        surface === "ice" && "bg-[#eef0f6]/88 text-[#0a0c12]",
        surface === "void" && "bg-[#090b10]/90 text-[#f4f6fb]",
        surface === "cobalt" && "bg-[#2434ff]/92 text-white",
        className
      )}
    >
      {children}
    </section>
  );
}
