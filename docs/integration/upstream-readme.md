> Preserved upstream material, not current acceptance evidence. See `docs/validation/mission-repair.md`.

# KINETA® — Real-Time 3D & Interactive Production Studio

An award-caliber interactive studio flagship built from first principles using **Next.js 16 (App Router)**, **TypeScript (strict)**, **Tailwind CSS v4**, **Three.js / `@react-three/fiber`**, **Custom GLSL Optical & Raymarching Shaders**, **GSAP (`ScrollTrigger`)**, **Lenis**, **Zustand**, **Framer Motion**, and **Procedural Web Audio**.

> **100% Originality & Clean-Room Architecture**
> All visual designs, studio branding (`KINETA®`), project case studies, microcopy, 3D geometries, custom GLSL shaders, procedural studio render plates, and synthesized Web Audio soundscapes are **100% original creations**. Open-licensed self-hosted variable fonts (`Space Grotesk`, `Instrument Sans`, `JetBrains Mono`) are bundled locally with zero external runtime asset dependencies.

---

## Quick Start

```bash
# Install dependencies
npm install --legacy-peer-deps

# Start local development server
npm run dev

# Full production gate (ESLint + TypeScript strict check + Next.js static/SSG build)
npm run check

# Start production server on 0.0.0.0:3000
npm run start -- -H 0.0.0.0 -p 3000

# Run Phase 6 automated WCAG contrast, originality & live HTTP route audit
npm run qa
```

---

## System Architecture

```mermaid
flowchart TB
  subgraph Browser["Client Runtime (Zero-Thrash Hybrid DOM + WebGL)"]
    Lenis["Lenis Smooth Scroll Engine"] -->|raf sync| Ticker["GSAP Ticker + ScrollTrigger"]
    Lenis -->|zero-render write| Telemetry["Mutable STAGE_TELEMETRY Buffer\n(scrollProgress, scrollVelocity, pointerX/Y)"]
    Pointer["Window Pointer Listener"] -->|normalized [-1,1]| Telemetry

    subgraph DOM["Semantic Accessible DOM (z: 10–100)"]
      HUD["Persistent Floating Pill HUD\nWordmark · WebAudio EQ · Let's Talk · Menu Popover"]
      Sections["SurfaceSection Stream\ndata-surface: ice ↔ void ↔ cobalt"]
      Modals["Showreel Theater Modal + Route Curtain + Custom Cursor"]
    end

    subgraph GPU["Persistent Root R3F Canvas — GlobalStage (z: 0)"]
      Watchdog["FpsWatchdog + GPU Prober\nhigh [1,2] → medium [1,1.5] → low [1,1]"]
      Camera["6-DoF Smooth Parallax & Drift CameraRig"]
      Core["Cauchy Optical Glass Core\n(Snell RGB Dispersion + Simplex Vertex Normals)"]
      Swarm["InstancedMesh Physics Swarm\n(44 Spheres · Zero-GC Spring + Repulsion)"]
      Ribbon["Scroll-Velocity Satin Filament Wave Shader"]
    end

    Store["Zustand Studio Store\n(activeSurface, webglMode, capabilityIndex, labUniforms, audioEnabled)"]
    Audio["Procedural Web Audio Synthesizer\n(Dmaj9 Filtered Pad + Harmonic Foley Ticks)"]

    Sections -->|ScrollTrigger boundary| Store
    HUD <--> Store
    HUD --> Audio
    Store -->|target presets| GPU
    Telemetry -->|60–120Hz read in useFrame| GPU
  end
```

---

## Complete Route Map

| Route | Description |
| :--- | :--- |
| `/` | **Flagship Home** — 9 choreographed chapters: Interactive 3D Hero, Intro Statement + Scroll-Expanding Showreel Portal, Staggered Featured Work Showcase, Cobalt `[S][C][T][P]` Capabilities Matrix, Interactive Labs R&D Preview, Partner Marquee & 64-Award Ledger, `[[ 001 ]]` Specialist Deck, Monumental CTA, and Overscroll Next-Page Portal |
| `/work` (alias `/projects`) | **Work Index** — Discipline filter pills (`All`, `3D & WebGL`, `Interactive Web`, `Spatial & XR`, `Motion & Film`, `R&D Concept`) + `Grid` vs `Interactive Index` view mode with sticky live shader preview |
| `/work/[slug]` (alias `/projects/[slug]`) | **6 Original Case Studies** (`monolith-one`, `kestrel-robotics`, `meridian-os`, `sylva-botanica`, `hyperion-gt`, `aether-spatial`) with per-project stage tinting, stage telemetry inspector, KPI strip, narrative breakdown, procedural study plates, and Next Case run-out |
| `/about` | **About & Collective** — Stacked typography manifesto, `[[ 001 ]]–[[ 006 ]]` specialist switcher, `S/C/T/P` expertise matrix, partner marquee, 64-honor awards ledger, and festival talks index |
| `/labs` | **Labs R&D Sandbox** — Real-time uniform sliders (`uIor`, `uDispersion`, `uTurbulence`, `Spring`, `Wireframe`) controlling the persistent 3D optical stage alongside a live raw-WebGL **Analytical SDF Smooth-Union Raymarcher** |
| `/contact` | **Contact & Project Planner** — Live multi-timezone studio clocks (`Osaka`, `Bristol`, `New York`), multi-select scope & investment configurator, one-click clipboard email copy, and studio FAQ |
| `/design-system` | **Living Design System** — Interactive surface switcher (`ice` / `void` / `cobalt`), color swatches, fluid type scale, 8px spacing bars, interactive easing race track, radii, z-index stack, and live FPS/DPR HUD |
| `/*` (`not-found.tsx`) | **Interactive 404 Stage** — Zero-gravity scattered optical sphere field with magnetic recovery pills |

---

## Engineering Documentation (`/docs`)

- [`/docs/recon.md`](docs/recon.md) — Phase 1 behavioral, structural, motion, typography, and WebGL reconnaissance spec
- [`/docs/tokens.md`](docs/tokens.md) — Phase 2 color architecture, fluid type scale, 8px spacing rhythm, named easings, and z-index stack
- [`/docs/sections/`](docs/sections/) — Phase 4 per-section specs authored prior to implementation (`hero.md`, `intro-statement.md`, `featured-work.md`, `services-capabilities.md`, `labs-experiments.md`, `client-awards.md`, `about-team.md`, `contact-cta.md`, `footer.md`)
- [`/docs/shaders.md`](docs/shaders.md) — Phase 5 plain-language mathematical explanations of all custom GLSL shaders, zero-GC physics, and GPU degradation tiers
- [`/docs/qa-report.md`](docs/qa-report.md) — Phase 6 WCAG contrast audit, accessibility matrix, reduced-motion behavior, and build metrics
- [`/docs/progress.md`](docs/progress.md) — Complete phase-by-phase build log, architectural trade-offs, and risk register
