"use client";

import React, { useState } from "react";
import { DESIGN_TOKENS, type SurfaceTheme } from "@/lib/tokens";
import { useStudioStore } from "@/lib/store";
import { SurfaceSection } from "@/components/studio/SurfaceSection";
import { CrosshairRow } from "@/components/studio/CrosshairGrid";
import { SplitTextReveal } from "@/components/studio/SplitTextReveal";
import { MagneticPill } from "@/components/studio/MagneticPill";
import { ProceduralMediaCanvas } from "@/components/studio/ProceduralMediaCanvas";
import { StudioFooter } from "@/components/sections/StudioFooter";

const COLOR_SWATCHES = [
  { name: "Obsidian Void", token: "--kn-void", hex: "#090b10", text: "white" },
  { name: "Void Elevated", token: "--kn-void-elevated", hex: "#121622", text: "white" },
  { name: "Architectural Ice", token: "--kn-ice", hex: "#eef0f6", text: "black" },
  { name: "Ice Elevated", token: "--kn-ice-elevated", hex: "#e2e6f0", text: "black" },
  { name: "Ultramarine Signal", token: "--kn-cobalt", hex: "#2434ff", text: "white" },
  { name: "Cobalt Iris", token: "--kn-iris", hex: "#5b68ff", text: "white" },
  { name: "Spectral Cyan", token: "--kn-cyan", hex: "#00d2ff", text: "black" },
  { name: "Spectral Ember", token: "--kn-ember", hex: "#ff4d2e", text: "white" },
  { name: "Primary Ink", token: "--kn-ink", hex: "#0a0c12", text: "white" },
  { name: "Primary Chalk", token: "--kn-chalk", hex: "#f4f6fb", text: "black" },
];

export function DesignSystemView() {
  const [previewSurface, setPreviewSurface] = useState<SurfaceTheme>("ice");
  const [raceRun, setRaceRun] = useState(false);
  const fps = useStudioStore((s) => s.fps);
  const qualityTier = useStudioStore((s) => s.qualityTier);
  const dpr = useStudioStore((s) => s.dpr);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  return (
    <div className="relative z-10 w-full">
      {/* Header Section */}
      <SurfaceSection surface="ice" webglMode="hero-cluster" className="pt-32 pb-20 md:pt-40">
        <div className="kn-container">
          <CrosshairRow labelLeft="PHASE 02 // LIVING DESIGN SYSTEM" labelRight="TOKENS + PRIMITIVES" />
          <div className="mt-10 max-w-5xl">
            <p className="kn-eyebrow mb-4 text-[#2434ff]">• KINETA DESIGN LANGUAGE v1.0</p>
            <SplitTextReveal
              as="h1"
              immediate
              lines={["ARCHITECTURAL", "DESIGN SYSTEM"]}
              className="kn-hero-title text-[#0a0c12]"
            />
            <p className="mt-8 max-w-2xl text-lg leading-relaxed text-[#4a5165] md:text-xl">
              Single source of truth for KINETA&apos;s multi-surface color architecture, fluid
              grotesque typography, 8px spatial rhythm, optical radii, named motion curves, and
              real-time WebGL primitives.
            </p>

            {/* Live Engine Telemetry Pill Strip */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="rounded-full border border-black/12 bg-white/80 px-4 py-2 font-mono text-xs uppercase text-[#0a0c12]">
                LIVE FPS: <strong>{fps}</strong>
              </span>
              <span className="rounded-full border border-black/12 bg-white/80 px-4 py-2 font-mono text-xs uppercase text-[#0a0c12]">
                QUALITY TIER: <strong>{qualityTier.toUpperCase()}</strong>
              </span>
              <span className="rounded-full border border-black/12 bg-white/80 px-4 py-2 font-mono text-xs uppercase text-[#0a0c12]">
                DPR CLAMP: <strong>[{dpr[0]}, {dpr[1]}]</strong>
              </span>
              <span className="rounded-full border border-black/12 bg-white/80 px-4 py-2 font-mono text-xs uppercase text-[#0a0c12]">
                REDUCED MOTION: <strong>{reducedMotion ? "ON" : "OFF"}</strong>
              </span>
            </div>
          </div>
        </div>
      </SurfaceSection>

      {/* 01. Color System & Interactive Surface Simulator */}
      <SurfaceSection surface="void" webglMode="work-gallery" className="py-24">
        <div className="kn-container">
          <CrosshairRow labelLeft="01 // COLOR & SURFACES" labelRight="WCAG AA / AAA VERIFIED" />
          <div className="mt-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <h2 className="kn-section-title">COLOR TOKENS</h2>
              <p className="mt-3 max-w-xl text-[#9aa3b8]">
                Engineered around three crisp surface worlds (`ice`, `void`, `cobalt`) plus spectral
                dispersion highlights mapped directly into GLSL shader uniforms.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 p-1.5">
              {(["ice", "void", "cobalt"] as SurfaceTheme[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setPreviewSurface(s)}
                  className={`rounded-full px-4 py-1.5 font-mono text-xs uppercase transition ${
                    previewSurface === s
                      ? "bg-[#2434ff] text-white"
                      : "text-[#9aa3b8] hover:text-white"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Surface Stage Preview */}
          <div
            data-surface={previewSurface}
            className="mt-10 rounded-[28px] border border-[var(--surface-border)] bg-[var(--surface-bg)] p-8 text-[var(--surface-fg)] transition-all duration-500 md:p-12"
          >
            <CrosshairRow
              labelLeft={`ACTIVE SCOPE: data-surface="${previewSurface}"`}
              labelRight="DYNAMIC TOKEN INHERITANCE"
            />
            <div className="mt-6 grid gap-8 md:grid-cols-2 md:items-center">
              <div>
                <p className="kn-eyebrow text-[var(--surface-accent)]">• LIVE SURFACE SANDBOX</p>
                <h3 className="kn-statement mt-3">
                  Seamless scroll-driven surface transitions without repaint flash.
                </h3>
                <p className="mt-4 text-sm leading-relaxed text-[var(--surface-muted)]">
                  Foreground contrast exceeds 7.1:1 across every surface state while HUD controls
                  automatically invert border and label contrast.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 md:justify-end">
                <MagneticPill variant="cobalt" size="md">
                  Primary Action
                </MagneticPill>
                <MagneticPill variant="outline" size="md">
                  Secondary Action
                </MagneticPill>
              </div>
            </div>
          </div>

          {/* Swatch Grid */}
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {COLOR_SWATCHES.map((swatch) => (
              <div
                key={swatch.token}
                className="flex flex-col justify-between rounded-[20px] border border-white/10 p-5 transition-transform duration-300 hover:-translate-y-1"
                style={{
                  backgroundColor: swatch.hex,
                  color: swatch.text === "white" ? "#f4f6fb" : "#0a0c12",
                }}
              >
                <span className="font-mono text-[11px] opacity-75">{swatch.token}</span>
                <div className="mt-12">
                  <p className="font-display text-base font-medium">{swatch.name}</p>
                  <p className="font-mono text-xs uppercase opacity-80">{swatch.hex}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </SurfaceSection>

      {/* 02. Fluid Typography Scale */}
      <SurfaceSection surface="ice" webglMode="capabilities" className="py-24">
        <div className="kn-container">
          <CrosshairRow
            labelLeft="02 // TYPE SYSTEM"
            labelRight="SPACE GROTESK + INSTRUMENT SANS + JETBRAINS MONO"
          />
          <h2 className="kn-section-title mt-8">FLUID TYPE SCALE</h2>

          <div className="mt-12 divide-y divide-black/10 border-y border-black/10">
            {DESIGN_TOKENS.typography.scale.map((item) => (
              <div
                key={item.token}
                className="grid gap-4 py-8 lg:grid-cols-[260px_1fr] lg:items-baseline"
              >
                <div className="space-y-1 font-mono text-xs text-[#4a5165]">
                  <p className="font-semibold text-[#0a0c12]">{item.name}</p>
                  <p>{item.token}</p>
                  <p>
                    LH {item.lineHeight} · Track {item.tracking}
                  </p>
                </div>
                <p
                  style={{
                    fontSize: `var(${item.token})`,
                    lineHeight: item.lineHeight,
                    letterSpacing: item.tracking,
                    fontFamily: item.token.includes("micro")
                      ? "var(--font-mono)"
                      : item.token.includes("body")
                        ? "var(--font-sans)"
                        : "var(--font-display)",
                  }}
                  className="font-medium text-[#0a0c12]"
                >
                  {item.sample}
                </p>
              </div>
            ))}
          </div>
        </div>
      </SurfaceSection>

      {/* 03. Spacing, Radii, Easing Race Track & Z-Index Stack */}
      <SurfaceSection surface="void" webglMode="dispersion-tunnel" className="py-24">
        <div className="kn-container">
          <CrosshairRow labelLeft="03 // SPATIAL & MOTION TOKENS" labelRight="8PX BASE UNIT" />

          <div className="mt-10 grid gap-12 lg:grid-cols-2">
            {/* 8px Spacing Scale */}
            <div className="rounded-[28px] border border-white/10 bg-[#121622] p-8">
              <p className="kn-eyebrow text-[#5b68ff]">• 8PX SPACING RHYTHM</p>
              <div className="mt-6 space-y-3">
                {DESIGN_TOKENS.spacing.map((s) => (
                  <div key={s.token} className="flex items-center gap-4">
                    <span className="w-28 shrink-0 font-mono text-xs text-[#9aa3b8]">
                      {s.token}
                    </span>
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-[#2434ff] to-[#00d2ff]"
                      style={{ width: `${Math.min(s.px * 1.6, 260)}px` }}
                    />
                    <span className="font-mono text-xs text-white">{s.px}px</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive Named Easing Curve Visualizer */}
            <div className="rounded-[28px] border border-white/10 bg-[#121622] p-8">
              <div className="flex items-center justify-between gap-4">
                <p className="kn-eyebrow text-[#00d2ff]">• NAMED MOTION CURVES</p>
                <button
                  type="button"
                  onClick={() => setRaceRun((v) => !v)}
                  className="rounded-full bg-[#2434ff] px-4 py-1.5 font-mono text-xs uppercase text-white transition hover:bg-[#3f4eff]"
                >
                  Trigger Motion Test
                </button>
              </div>
              <div className="mt-6 space-y-5">
                {DESIGN_TOKENS.easings.map((curve) => (
                  <div key={curve.token} className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-white">{curve.name}</span>
                      <span className="font-mono text-[#9aa3b8]">{curve.css}</span>
                    </div>
                    <div className="relative h-9 overflow-hidden rounded-full border border-white/10 bg-black/40 p-1">
                      <div
                        style={{
                          transitionTimingFunction: curve.css,
                          transitionDuration: "820ms",
                          transform: raceRun ? "translateX(calc(100% + 180px))" : "translateX(0px)",
                        }}
                        className="h-7 w-16 rounded-full bg-gradient-to-r from-[#2434ff] to-[#00d2ff] transition-transform"
                      />
                    </div>
                    <p className="text-xs text-[#9aa3b8]">{curve.usage}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Radii, Durations & Z-Index Stack */}
          <div className="mt-12 grid gap-8 lg:grid-cols-2">
            <div className="rounded-[28px] border border-white/10 bg-[#121622] p-8">
              <p className="kn-eyebrow text-[#5b68ff]">• BORDER RADII & PROCEDURAL PLATES</p>
              <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
                {DESIGN_TOKENS.radii.map((r) => (
                  <div
                    key={r.token}
                    style={{ borderRadius: r.value }}
                    className="border border-white/15 bg-white/[0.04] p-4"
                  >
                    <p className="font-mono text-xs text-white">{r.token}</p>
                    <p className="mt-1 font-mono text-[11px] text-[#00d2ff]">{r.value}</p>
                    <p className="mt-2 text-xs text-[#9aa3b8]">{r.usage}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#121622] p-8">
              <p className="kn-eyebrow text-[#10d98c]">• Z-INDEX COMPOSITING ARCHITECTURE</p>
              <div className="mt-6 space-y-2.5">
                {DESIGN_TOKENS.zIndex.map((z) => (
                  <div
                    key={z.token}
                    className="flex items-center justify-between rounded-xl border border-white/8 bg-black/30 px-4 py-2.5 text-xs"
                  >
                    <span className="font-mono text-[#00d2ff]">{z.token}</span>
                    <span className="text-white">{z.layer}</span>
                    <span className="font-mono text-[#9aa3b8]">z: {z.level}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Procedural Optical Card Specimen */}
          <div className="mt-12 overflow-hidden rounded-[28px] border border-white/10 bg-[#121622] p-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="kn-eyebrow text-[#00d2ff]">• PROCEDURAL MEDIA ENGINE</p>
                <h3 className="mt-2 font-display text-2xl font-medium text-white">
                  Zero-Asset Procedural Studio Render Plates
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                <MagneticPill href="/labs" variant="cobalt" size="sm">
                  Open Shader Labs
                </MagneticPill>
                <MagneticPill href="/" variant="light" size="sm">
                  Back to Flagship Home
                </MagneticPill>
              </div>
            </div>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {(["monolith", "kestrel", "hyperion"] as const).map((preset, idx) => (
                <div
                  key={preset}
                  className="aspect-[16/10] overflow-hidden rounded-[20px] border border-white/12"
                >
                  <ProceduralMediaCanvas
                    preset={preset}
                    seed={idx + 1}
                    label={`SPECIMEN 0${idx + 1}`}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </SurfaceSection>

      <StudioFooter nextHref="/work" nextLabel="Selected Projects" />
    </div>
  );
}
