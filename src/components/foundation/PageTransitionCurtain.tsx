"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { createRouteTransitionMotion } from "./RouteTransitionMotion";

/** Persistent route owner: Canvas2D for generic routes, transaction-owned depth
 * handoff for selected projects. Both use the same lifecycle and input guard. */
export function PageTransitionCurtain() {
  const pathname = usePathname();
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const owner = useRef<ReturnType<typeof createRouteTransitionMotion> | null>(null);
  useEffect(() => {
    if (!root.current || !canvas.current || !status.current) return;
    const motion = createRouteTransitionMotion(root.current, canvas.current, status.current);
    owner.current = motion;
    return () => { motion.dispose(); owner.current = null; };
  }, []);
  useEffect(() => { owner.current?.routeCommitted(pathname); }, [pathname]);
  return (
    <>
      <div ref={root} id="route-transition" hidden className="fixed inset-0 z-[100] overflow-hidden touch-none" aria-hidden="true">
        <canvas ref={canvas} id="transition-overlay" className="absolute top-0 left-0" />
      </div>
      <span ref={status} className="sr-only" role="status" aria-live="polite" aria-atomic="true" />
    </>
  );
}
