"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";

export type PillVariant = "cobalt" | "dark" | "light" | "glass" | "outline";

interface MagneticPillProps {
  children: string;
  href?: string;
  onClick?: (e: React.MouseEvent<HTMLElement>) => void;
  variant?: PillVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
  cursorText?: string;
  transitionLabel?: string;
  showDot?: boolean;
  type?: "button" | "submit" | "reset";
  ariaLabel?: string;
  disabled?: boolean;
}

const VARIANT_STYLES: Record<PillVariant, string> = {
  cobalt:
    "bg-[#2434ff] text-white hover:bg-[#1926e6] shadow-[0_10px_30px_-8px_rgba(36,52,255,0.65)] border border-white/15",
  dark:
    "bg-[#0a0c12] text-[#f4f6fb] hover:bg-[#2434ff] border border-white/12 shadow-[0_10px_28px_-10px_rgba(9,11,16,0.5)]",
  light:
    "bg-[#f4f6fb] text-[#0a0c12] hover:bg-[#2434ff] hover:text-white border border-black/8 shadow-[0_10px_28px_-10px_rgba(9,11,16,0.22)]",
  glass:
    "bg-white/12 backdrop-blur-md text-current hover:bg-[#2434ff] hover:text-white border border-current/15",
  outline:
    "bg-transparent text-current hover:bg-current hover:text-[var(--surface-bg)] border border-current/25",
};

const SIZE_STYLES = {
  sm: "h-10 px-4 text-xs tracking-[0.08em]",
  md: "h-12 px-6 text-xs tracking-[0.09em]",
  lg: "h-14 px-8 text-sm tracking-[0.08em]",
};

export function MagneticPill({
  children,
  href,
  onClick,
  variant = "dark",
  size = "md",
  className,
  cursorText,
  transitionLabel,
  showDot = true,
  type = "button",
  ariaLabel,
  disabled = false,
}: MagneticPillProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLSpanElement>(null);
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const setCursor = useStudioStore((s) => s.setCursor);
  const resetCursor = useStudioStore((s) => s.resetCursor);
  const setTransition = useStudioStore((s) => s.setTransition);
  const setMenuOpen = useStudioStore((s) => s.setMenuOpen);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (reducedMotion || disabled || !outerRef.current || !innerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const relX = e.clientX - (rect.left + rect.width / 2);
    const relY = e.clientY - (rect.top + rect.height / 2);
    outerRef.current.style.transform = `translate3d(${relX * 0.24}px, ${relY * 0.28}px, 0)`;
    innerRef.current.style.transform = `translate3d(${relX * 0.1}px, ${relY * 0.12}px, 0)`;
  };

  const handleMouseEnter = () => {
    soundEngine.playHoverTick();
    if (cursorText) {
      setCursor("badge", cursorText);
    } else {
      setCursor("interactive");
    }
  };

  const handleMouseLeave = () => {
    resetCursor();
    if (outerRef.current && innerRef.current) {
      outerRef.current.style.transform = "translate3d(0, 0, 0)";
      innerRef.current.style.transform = "translate3d(0, 0, 0)";
    }
  };

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (onClick) onClick(e);
    resetCursor();
    if (
      !href ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      href.startsWith("mailto:") ||
      href.startsWith("http") ||
      href.startsWith("#")
    ) {
      return;
    }
    if (href === pathname) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      return;
    }
    e.preventDefault();
    soundEngine.playChime(523.25, 0.08);
    setMenuOpen(false);

    if (reducedMotion) {
      router.push(href);
      return;
    }

    const label =
      transitionLabel ||
      (href === "/"
        ? "HOME"
        : href.replace(/^\//, "").replace(/\//g, " // ").replace(/-/g, " ").toUpperCase());

    setTransition(true, label);
    window.setTimeout(() => {
      router.push(href);
    }, 260);
  };

  const innerContent = (
    <span
      ref={innerRef}
      className="inline-flex items-center gap-3 font-mono font-medium uppercase transition-transform duration-200 ease-out"
    >
      <span className="kn-pill-swap">
        <span>{children}</span>
        <span>{children}</span>
      </span>
      {showDot && (
        <span className="relative flex h-4 w-4 items-center justify-center">
          <span className="h-1.5 w-1.5 rounded-full bg-current transition-all duration-300 group-hover:scale-0 group-hover:opacity-0" />
          <ArrowUpRight
            className="absolute h-3.5 w-3.5 scale-50 opacity-0 transition-all duration-300 group-hover:scale-100 group-hover:opacity-100"
            aria-hidden="true"
          />
        </span>
      )}
    </span>
  );

  const sharedClasses = cn(
    "group relative inline-flex cursor-pointer select-none items-center justify-center rounded-full whitespace-nowrap transition-[background-color,color,border-color,box-shadow] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] disabled:pointer-events-none disabled:opacity-50",
    VARIANT_STYLES[variant],
    SIZE_STYLES[size],
    className
  );

  return (
    <div
      ref={outerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="inline-block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
    >
      {href ? (
        <Link href={href} onClick={handleNavigate} aria-label={ariaLabel} className={sharedClasses}>
          {innerContent}
        </Link>
      ) : (
        <button
          type={type}
          disabled={disabled}
          aria-label={ariaLabel}
          onClick={(e) => {
            soundEngine.playChime(659.25, 0.06);
            onClick?.(e);
          }}
          className={sharedClasses}
        >
          {innerContent}
        </button>
      )}
    </div>
  );
}
