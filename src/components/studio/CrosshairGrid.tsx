import React from "react";
import { cn } from "@/lib/utils";

interface CrosshairRowProps {
  className?: string;
  labelLeft?: string;
  labelRight?: string;
}

/**
 * Swiss architectural 4-column marker row (`+   +   +   +`) framing studio sections.
 */
export function CrosshairRow({ className, labelLeft, labelRight }: CrosshairRowProps) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none relative flex w-full items-center justify-between py-3 select-none",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <span className="font-mono text-xs leading-none text-[var(--surface-crosshair)]">+</span>
        {labelLeft && (
          <span className="kn-eyebrow text-[10px] text-[var(--surface-muted)] opacity-75">
            {labelLeft}
          </span>
        )}
      </div>
      <span className="hidden font-mono text-xs leading-none text-[var(--surface-crosshair)] md:inline">
        +
      </span>
      <span className="hidden font-mono text-xs leading-none text-[var(--surface-crosshair)] md:inline">
        +
      </span>
      <div className="flex items-center gap-3">
        {labelRight && (
          <span className="kn-eyebrow text-[10px] text-[var(--surface-muted)] opacity-75">
            {labelRight}
          </span>
        )}
        <span className="font-mono text-xs leading-none text-[var(--surface-crosshair)]">+</span>
      </div>
    </div>
  );
}
