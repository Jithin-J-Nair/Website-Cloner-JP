"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store";
import { navigateStudioRoute, shouldTransitionAnchor } from "@/lib/route-navigation";
import { soundEngine } from "@/lib/audio";

interface TransitionLinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  transitionLabel?: string;
  cursorBadge?: string;
  children: React.ReactNode;
}

export function TransitionLink({
  href,
  transitionLabel,
  cursorBadge,
  children,
  onClick,
  onMouseEnter,
  onMouseLeave,
  className,
  ...rest
}: TransitionLinkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const setMenuOpen = useStudioStore((s) => s.setMenuOpen);
  const setCursor = useStudioStore((s) => s.setCursor);
  const resetCursor = useStudioStore((s) => s.resetCursor);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    resetCursor();
    if (!shouldTransitionAnchor(e, e.currentTarget)) return;

    if (href === pathname) {
      e.preventDefault();
      setMenuOpen(false);
      window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
      return;
    }

    e.preventDefault();
    soundEngine.playChime(523.25, 0.08);
    setMenuOpen(false);

    navigateStudioRoute(href, router, transitionLabel || (href === "/" ? "Home" : href.split("/").filter(Boolean).join(" ")));
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      onMouseEnter={(e) => {
        soundEngine.playHoverTick();
        if (cursorBadge) setCursor("badge", cursorBadge);
        else setCursor("interactive");
        onMouseEnter?.(e);
      }}
      onMouseLeave={(e) => {
        resetCursor();
        onMouseLeave?.(e);
      }}
      className={className}
      {...rest}
    >
      {children}
    </Link>
  );
}
