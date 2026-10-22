"use client";

import React, { useEffect } from "react";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { useStudioStore } from "@/lib/store";

export function NotFoundView() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);

  useEffect(() => {
    setActiveSurface("ice");
  }, [setActiveSurface]);

  return (
    <main className="flex min-h-[100dvh] flex-col justify-between bg-[#f0f1fa] px-[var(--base-padding-x)] pt-36 pb-16 text-[#000000]">
      <div className="max-w-3xl">
        <p className="font-mono text-xs tracking-[0.14em] text-[#1a2ffb] uppercase">
          ERROR 404 // ROUTE NOT FOUND
        </p>
        <h1 className="mt-4 font-sans text-5xl leading-[0.98] font-normal tracking-[-0.025em] md:text-7xl">
          This page could not be found.
        </h1>
        <p className="mt-6 max-w-xl font-sans text-base leading-relaxed text-black/75 md:text-lg">
          The requested URL does not match an active Lusion studio page or project archive entry.
        </p>

        <div className="mt-10 flex flex-wrap gap-4">
          <TransitionLink
            href="/"
            transitionLabel="Home"
            className="inline-flex items-center gap-3 rounded-full bg-[#1a2ffb] px-7 py-3.5 font-sans text-xs font-medium tracking-[0.06em] text-white uppercase transition-transform hover:scale-[1.03]"
          >
            <span>Return Home</span>
          </TransitionLink>
          <TransitionLink
            href="/projects"
            transitionLabel="Projects"
            className="inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 font-sans text-xs font-medium tracking-[0.06em] text-[#000000] uppercase shadow-sm transition-colors hover:bg-black hover:text-white"
          >
            <span>View All 19 Projects</span>
          </TransitionLink>
          <TransitionLink
            href="/about"
            transitionLabel="About Us"
            className="inline-flex items-center gap-3 rounded-full border border-black/15 px-7 py-3.5 font-sans text-xs font-medium tracking-[0.06em] text-[#000000] uppercase transition-colors hover:border-[#1a2ffb] hover:text-[#1a2ffb]"
          >
            <span>About Us</span>
          </TransitionLink>
        </div>
      </div>

      <p className="font-mono text-xs text-black/50">&copy;2026 LUSION Creative Studio</p>
    </main>
  );
}
