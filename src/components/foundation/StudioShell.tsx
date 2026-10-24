"use client";

import React, { useEffect } from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { SmoothScrollProvider } from "@/components/foundation/SmoothScrollProvider";
import { GlobalStage } from "@/components/webgl/GlobalStage";
import { StudioHud } from "@/components/foundation/StudioHud";
import { CustomCursor } from "@/components/foundation/CustomCursor";
import { PageTransitionCurtain } from "@/components/foundation/PageTransitionCurtain";
import { ShowreelModal } from "@/components/foundation/ShowreelModal";
import { Preloader } from "@/components/foundation/Preloader";
import { useStudioStore } from "@/lib/store";

import { ShaderAnimation } from "@/components/ui/ShaderAnimation";

export function StudioShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const activeSurface = useStudioStore((s) => s.activeSurface);
  const activeProjectTheme = useStudioStore((s) => s.activeProjectTheme);

  // Sync `--vh` custom property & root polarity classes (`is-white-bg` / `is-black-bg` / `is-blue-bg`)
  useEffect(() => {
    const syncViewportUnit = () => {
      document.documentElement.style.setProperty("--vh", `${window.innerHeight * 0.01}px`);
    };
    syncViewportUnit();
    window.addEventListener("resize", syncViewportUnit, { passive: true });
    
    // Parse ?quality= flag and expose window.__pipeline
    const search = new URLSearchParams(window.location.search);
    const q = search.get("quality");
    if (q === "high" || q === "medium" || q === "low") {
      useStudioStore.getState().setQualityTier(q);
    }
    
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
        {/* Keyboard Skip Link */}
        <a href="#main-content" className="kn-skip-link">
          Skip to main content
        </a>

        {/* Persistent Viewport WebGL Stage (suppressed on `/` where dedicated Lusion stages run) */}
        {pathname !== "/" && <GlobalStage />}

        {/* Shared Lusion Header, Menu Popover, Back Control & Scroll Indicator (z-index: 52) */}
        <StudioHud />

        {/* Main Scrollable Document Layer (z-index: 10) */}
        <div id="main-content" className="relative z-10 min-h-dvh">
          {children}
        </div>

        {/* Shared Cinema Overlay (`#video-overlay`, z-index: 99) */}
        <ShowreelModal />

        {/* Route Transition Curtain & Cold-Start Preloader (`#preloader`, z-index: 90–200) */}
        <PageTransitionCurtain />
        <ShaderAnimation />
        <Preloader />

        {/* Reactive Pointer (auto-disabled on coarse touch devices & reduced motion) */}
        <CustomCursor />
      </SmoothScrollProvider>
    </MotionConfig>
  );
}
