"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { useTransition } from "@/components/foundation/TransitionProvider";

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
  const setTransition = useStudioStore((s) => s.setTransition);
  const setMenuOpen = useStudioStore((s) => s.setMenuOpen);
  const setCursor = useStudioStore((s) => s.setCursor);
  const resetCursor = useStudioStore((s) => s.resetCursor);
  const { navigate } = useTransition();

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    resetCursor();
    if (
      e.defaultPrevented ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      href.startsWith("http") ||
      href.startsWith("mailto:") ||
      href.startsWith("#")
    ) {
      return;
    }

    if (href === pathname) {
      e.preventDefault();
      setMenuOpen(false);
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

    navigate(href, e, label);
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
