"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useStudioStore } from "@/lib/store";

export function PageTransitionCurtain() {
  const isTransitioning = useStudioStore((s) => s.isTransitioning);
  const transitionLabel = useStudioStore((s) => s.transitionLabel);

  return (
    <AnimatePresence>
      {isTransitioning && (
        <motion.div
          key="route-curtain"
          initial={{ scaleY: 0, transformOrigin: "bottom" }}
          animate={{
            scaleY: 1,
            transformOrigin: "bottom",
            transition: { duration: 0.28, ease: [0.76, 0, 0.24, 1] },
          }}
          exit={{
            scaleY: 0,
            transformOrigin: "top",
            transition: { duration: 0.34, ease: [0.76, 0, 0.24, 1] },
          }}
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-[90] flex flex-col items-center justify-center bg-[#000000] text-[#ffffff]"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0, transition: { delay: 0.06, duration: 0.16 } }}
            exit={{ opacity: 0, y: -10, transition: { duration: 0.14 } }}
            className="flex flex-col items-center gap-4 text-center"
          >
            <svg width="28" height="35" viewBox="0 0 86 108" fill="none" aria-hidden="true">
              <path d="M0 0H43V54H86V108H0V0Z" fill="#1a2ffb" />
            </svg>
            <span className="font-sans text-3xl font-normal tracking-tight uppercase md:text-5xl">
              {transitionLabel || "LUSION"}
            </span>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
