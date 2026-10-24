"use client";

import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShaderAnimation } from "@/components/ui/ShaderAnimation";
import { useStudioStore } from "@/lib/store";

interface TransitionContextValue {
  navigate: (href: string, e: React.MouseEvent | React.TouchEvent | React.KeyboardEvent, label?: string) => void;
}

const TransitionContext = createContext<TransitionContextValue | null>(null);

export function useTransition() {
  const ctx = useContext(TransitionContext);
  if (!ctx) throw new Error("useTransition must be used within TransitionProvider");
  return ctx;
}

export function TransitionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const [isActive, setIsActive] = useState(false);
  const [clipPath, setClipPath] = useState("circle(0px at 50% 50%)");
  const [label, setLabel] = useState("LUSION");
  const [phase, setPhase] = useState<"idle" | "opening" | "covered" | "closing">("idle");
  const originRef = useRef<{ x: number; y: number }>({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const timeoutRef = useRef<number>(0);

  const isTransitioning = useStudioStore((s) => s.isTransitioning);
  const setTransition = useStudioStore((s) => s.setTransition);

  // Sync back to store for other components that might need it
  useEffect(() => {
    if (!isTransitioning && isActive && phase === "covered") {
      // route changed successfully and lifted transition curtain
      startClose();
    }
  }, [isTransitioning, isActive, phase]);

  const navigate = (href: string, e: React.SyntheticEvent, newLabel?: string) => {
    if (phase !== "idle") return; // block double clicks

    let x = window.innerWidth / 2;
    let y = window.innerHeight / 2;
    if ('clientX' in e) {
      x = (e as React.MouseEvent).clientX;
      y = (e as React.MouseEvent).clientY;
    }
    originRef.current = { x, y };

    setLabel(newLabel || "LUSION");

    if (reducedMotion) {
      setPhase("opening");
      setIsActive(true);
      setClipPath(`circle(150% at ${x}px ${y}px)`);
      setTimeout(() => {
        setPhase("covered");
        setTransition(true, newLabel);
        router.push(href);
      }, 150);
      return;
    }

    setPhase("opening");
    setIsActive(true);
    // Start at 0 size
    setClipPath(`circle(0px at ${x}px ${y}px)`);
    
    // Grow to cover
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setClipPath(`circle(150% at ${x}px ${y}px)`);
      });
    });

    // Emil Kowalski UI rules: 520ms open, cubic-bezier(0.22, 1, 0.36, 1)
    timeoutRef.current = window.setTimeout(() => {
      setPhase("covered");
      setTransition(true, newLabel);
      router.push(href);
      
      // Fallback if route change hangs
      timeoutRef.current = window.setTimeout(() => {
        if (phase === "covered") startClose();
      }, 2500);
    }, 520);
  };

  const startClose = () => {
    window.clearTimeout(timeoutRef.current);
    setPhase("closing");
    setTransition(false); // Make sure store matches
    
    if (reducedMotion) {
      setIsActive(false);
      setPhase("idle");
      return;
    }

    // Collapse toward center or same origin
    // "collapses toward the new page's hero or toward the same point"
    setClipPath(`circle(0px at 50% 50%)`); // Collapsing to center is a nice effect for opening

    timeoutRef.current = window.setTimeout(() => {
      setIsActive(false);
      setPhase("idle");
    }, 620);
  };

  return (
    <TransitionContext.Provider value={{ navigate }}>
      {children}
      
      {isActive && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[99999] overflow-hidden bg-[#000000] text-white flex flex-col items-center justify-center pointer-events-none"
          style={{
            clipPath,
            transition: phase === "opening" ? "clip-path 520ms cubic-bezier(0.22, 1, 0.36, 1)" : phase === "closing" ? "clip-path 620ms cubic-bezier(0.22, 1, 0.36, 1)" : "none",
            opacity: reducedMotion ? (phase === "closing" ? 0 : 1) : 1,
            transitionProperty: reducedMotion ? "opacity" : "clip-path",
            transitionDuration: reducedMotion ? "150ms" : undefined,
          }}
        >
          {!reducedMotion && (
            <div className="absolute inset-0 w-full h-full">
              <ShaderAnimation 
                tint={[0.35, 0.4, 1.0]} 
                speed={1} 
                paused={phase === "covered"} 
              />
            </div>
          )}
          <div
            className="absolute z-10 flex flex-col items-center gap-4 text-center pointer-events-none"
            style={{
              opacity: phase === "covered" || phase === "closing" ? 1 : (phase === "opening" ? 0 : 0),
              transition: "opacity 300ms ease",
            }}
          >
            <svg width="28" height="35" viewBox="0 0 86 108" fill="none" aria-hidden="true">
              <path d="M0 0H43V54H86V108H0V0Z" fill="#1a2ffb" />
            </svg>
            <span className="font-sans text-3xl font-normal tracking-tight uppercase md:text-5xl drop-shadow-md">
              {label}
            </span>
          </div>
          <span className="sr-only">Loading {label}</span>
        </div>
      )}
    </TransitionContext.Provider>
  );
}