"use client"

import React, { useEffect, useRef, type ReactNode, type CSSProperties } from "react"
import { useStudioStore } from "@/lib/store";

type GlowColor = "blue" | "purple" | "green" | "red" | "orange" | "brand"
interface GlowCardProps {
  children?: ReactNode
  className?: string
  glowColor?: GlowColor
  size?: "sm" | "md" | "lg"
  width?: string | number
  height?: string | number
  customSize?: boolean
  variant?: "card" | "surface"
  radius?: number
}

const glowColorMap: Record<GlowColor, { base: number; spread: number }> = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
  brand: { base: 241, spread: 40 },
}
const sizeMap = { sm: "w-48 h-64", md: "w-64 h-80", lg: "w-80 h-96" }

// ---- one shared pointer controller for all cards ----
const registry = new Map<HTMLElement, boolean>() // element -> isVisible
let px = -9999, py = -9999, rafId = 0, bound = false, io: IntersectionObserver | null = null

const tick = () => {
  rafId = 0
  for (const [el, visible] of registry) {
    if (!visible) continue
    const r = el.getBoundingClientRect()
    el.style.setProperty("--x", \`\${px - r.left}px\`)
    el.style.setProperty("--y", \`\${py - r.top}px\`)
  }
}

const onMove = (e: PointerEvent) => {
  px = e.clientX
  py = e.clientY
  if (!rafId) rafId = requestAnimationFrame(tick)
}

const register = (el: HTMLElement) => {
  if (!io) {
    io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          registry.set(e.target as HTMLElement, true)
        } else {
          registry.set(e.target as HTMLElement, false)
        }
      }
    }, { rootMargin: "20% 0px" })
  }
  if (registry.size === 0) {
    window.addEventListener("pointermove", onMove, { passive: true })
    bound = true
  }
  registry.set(el, false)
  io.observe(el)
}

const unregister = (el: HTMLElement) => {
  registry.delete(el)
  if (io) io.unobserve(el)
  if (registry.size === 0 && bound) {
    window.removeEventListener("pointermove", onMove)
    if (rafId) cancelAnimationFrame(rafId)
    rafId = 0
    bound = false
  }
}

export function GlowCard({
  children,
  className = "",
  glowColor = "blue",
  size = "md",
  width,
  height,
  customSize = false,
  variant = "card",
  radius = 16,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  useEffect(() => {
    const el = ref.current
    if (el) {
      register(el)
      return () => unregister(el)
    }
  }, [])

  const colorConfig = glowColorMap[glowColor]
  const glowStr = \`hsl(\${colorConfig.base} 100% 50% / 0.5)\`

  const style: CSSProperties = {
    "--radius": \`\${radius}px\`,
    "--spotlight-color": glowStr,
    "--spotlight-spread": \`\${colorConfig.spread}px\`,
    width: customSize ? width : undefined,
    height: customSize ? height : undefined,
  } as CSSProperties & Record<string, string>

  const isCard = variant === "card"
  const classes = [
    "spotlight-card group/spot relative overflow-hidden",
    !customSize && sizeMap[size],
    isCard ? "p-8 rounded-[var(--radius)] bg-white/5 backdrop-blur-md border border-white/10" : "rounded-[var(--radius)]",
    reducedMotion ? "is-reduced" : "",
    className
  ].filter(Boolean).join(" ")

  return (
    <div ref={ref} className={classes} style={style}>
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[var(--radius)]">
        <div className="spotlight-border absolute inset-0 rounded-[var(--radius)]" />
        <div className="spotlight-glow absolute" />
      </div>
      <div className="relative z-10 w-full h-full">{children}</div>
    </div>
  )
}
