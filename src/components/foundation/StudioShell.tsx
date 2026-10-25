"use client";

import React, { useEffect } from "react";
import { MotionConfig } from "framer-motion";
import { SmoothScrollProvider } from "@/components/foundation/SmoothScrollProvider";
import { StudioHud } from "@/components/foundation/StudioHud";
import { CustomCursor } from "@/components/foundation/CustomCursor";
import { PageTransitionCurtain } from "@/components/foundation/PageTransitionCurtain";
import { ShowreelModal } from "@/components/foundation/ShowreelModal";
import { Preloader } from "@/components/foundation/Preloader";
import { useStudioStore } from "@/lib/store";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const activeSurface = useStudioStore((s) => s.activeSurface);
  const activeProjectTheme = useStudioStore((s) => s.activeProjectTheme);

  // Keep the viewport-height unit synchronized with mobile browser chrome.
  useEffect(() => {
    const syncViewportUnit = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };
    syncViewportUnit();
    window.addEventListener("resize", syncViewportUnit, { passive: true });
    return () => window.removeEventListener("resize", syncViewportUnit);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("is-white-bg", "is-black-bg", "is-blue-bg", "is-project-details-active");

    if (activeProjectTheme) {
      root.classList.add("is-project-details-active");
      root.style.setProperty("--project-details-bg", activeProjectTheme.bg);
      root.style.setProperty("--project-details-highlight", activeProjectTheme.highlight);
      root.style.setProperty("--project-details-btn-bg", activeProjectTheme.btnBg);
      root.style.setProperty("--project-details-btn-text", activeProjectTheme.btnText);
      root.style.setProperty("--project-details-btn-bg-hover", activeProjectTheme.btnBgHover);
      root.style.setProperty("--project-details-btn-text-hover", activeProjectTheme.btnTextHover);
    } else if (activeSurface === "void") {
      root.classList.add("is-black-bg");
    } else if (activeSurface === "cobalt") {
      root.classList.add("is-blue-bg");
    } else {
      root.classList.add("is-white-bg");
    }
  }, [activeSurface, activeProjectTheme]);

  return (
    <MotionConfig reducedMotion="user">
      <SmoothScrollProvider>
        <a href="#main-content" className="kn-skip-link">
          Skip to main content
        </a>

        {/* Each captured Lusion route owns its own scene. Do not inject the unrelated
            generic optical-sphere demo behind About, Projects, or project-detail pages. */}
        <StudioHud />

        <div id="main-content" className="relative z-10 min-h-dvh">
          {children}
        </div>

        <ShowreelModal />

        {/* Keep one route-transition system: the reference transition must not be double-triggered. */}
        <PageTransitionCurtain />
        <Preloader />
        <CustomCursor />
      </SmoothScrollProvider>
    </MotionConfig>
  );
}
