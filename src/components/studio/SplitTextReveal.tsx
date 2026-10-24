"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import { useStudioStore } from "@/lib/store";

gsap.registerPlugin(ScrollTrigger);

interface SplitTextRevealProps {
  lines: string[];
  as?: "h1" | "h2" | "h3" | "p" | "div";
  className?: string;
  lineClassName?: string;
  delay?: number;
  immediate?: boolean;
}

/**
 * Masked architectural line-by-line typography reveal.
 * Renders clean semantic text in SSR HTML for instant LCP & screen-reader fidelity,
 * then progressively enhances with GPU translate3d clip reveals when motion is allowed.
 */
export function SplitTextReveal({
  lines,
  as: Tag = "h2",
  className,
  lineClassName,
  delay = 0,
  immediate = false,
}: SplitTextRevealProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  useEffect(() => {
    if (reducedMotion || !containerRef.current) return;
    const targets = containerRef.current.querySelectorAll<HTMLElement>("[data-reveal-line]");
    if (!targets.length) return;

    const ctx = gsap.context(() => {
      if (immediate) {
        gsap.fromTo(
          targets,
          { yPercent: 108, opacity: 0.01 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.88,
            delay,
            stagger: 0.075,
            ease: "expo.out",
            clearProps: "transform",
          }
        );
      } else {
        gsap.fromTo(
          targets,
          { yPercent: 105, opacity: 0.01 },
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            delay,
            stagger: 0.068,
            ease: "expo.out",
            clearProps: "transform",
            scrollTrigger: {
              trigger: containerRef.current,
              start: "top 86%",
              once: true,
            },
          }
        );
      }
    }, containerRef);

    return () => ctx.revert();
  }, [delay, immediate, lines, reducedMotion]);

  return (
    <div ref={containerRef}>
      <Tag className={cn("m-0", className)} aria-label={lines.join(" ")}>
        {lines.map((line, i) => (
          <span
            key={`${line}-${i}`}
            aria-hidden="true"
            className={cn("block overflow-hidden pb-[0.06em]", lineClassName)}
          >
            <span data-reveal-line className="block will-change-transform">
              {line}
            </span>
          </span>
        ))}
      </Tag>
    </div>
  );
}
