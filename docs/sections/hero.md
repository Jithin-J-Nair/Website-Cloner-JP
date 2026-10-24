# Section Spec — Hero (`HeroSection`)

## 1. Purpose
Establish KINETA's unmistakable studio authority within the first `800ms`: monumental grotesque typography floating effortlessly over a live, cursor-reactive 3D optical glass & spring-collision sphere stage on a crisp architectural `ice` surface.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: `min-h-[100svh]` 12-column Swiss frame (`max-w-[1480px]`). Top & bottom `+` crosshair bars. Display `<h1>` spans columns `1–9` in the lower-middle third so the WebGL optical sculpture breathes freely in the upper-right focal quadrant (`x: +1.15`). Bottom status bar splits into Showreel pill + live GPU telemetry left, `SCROLL TO EXPLORE` animated indicator right.
- **Tablet (`768px–1023px`)**: `min-h-[96svh]` 8-column frame; fluid headline scales cleanly to `~64px`; full pointer/touch WebGL background remains active at `medium` quality tier.
- **Mobile (`<768px`)**: `min-h-[92svh]` single-column vertical flex justify-between; compact top spacing clearing fixed HUD; fluid `44px` display headline (`line-height: 0.94`); full-width tap targets (`≥44px`).

## 3. Content (100% Original)
- **Eyebrow**: `• REAL-TIME DESIGN & ENGINEERING STUDIO`
- **Headline (`h1`)**: `We build 3D visual worlds and interactive web experiences that make ambitious brands unforgettable.`
- **Primary Actions**: `Play 2026 Reel` (opens fullscreen interactive Showreel modal) + `Explore Selected Work` (`/work`)
- **Scroll Prompt**: `SCROLL TO EXPLORE`

## 4. Interactions
- Moving the pointer displaces the 44 instanced spheres around the Cauchy refractive core via inverse-square repulsion while tilting the 6-DoF camera rig.
- Clicking `Play 2026 Reel` opens the multi-chapter procedural Showreel modal and plays a subtle harmonic chime if audio is enabled.

## 5. Motion Timeline
- `0.00s–0.88s`: Immediate masked line-by-line headline entrance (`yPercent: 108 → 0`, `expo.out`, `75ms` stagger).
- `0.28s–0.75s`: Eyebrow, action pills, and bottom telemetry fade/rise (`y: 18 → 0`).
- Scrubbed `top top → bottom top`: Gentle parallax lift and opacity soften on hero copy as user enters Intro Statement.

## 6. WebGL Needs
- Activates `webglMode = "hero-cluster"` on `surface = "ice"` (`uSurfaceIsLight = 1.0`, `uIor = 1.46`, `uDispersion = 0.34`).

## 7. Accessibility (A11y)
- Semantic single `<h1>` per page with full intact `aria-label` string.
- Contrast on `ice` (`#eef0f6`) with primary ink (`#0a0c12`) is `17.4:1` (WCAG AAA).
- Under `prefers-reduced-motion: reduce`, headline renders statically at full opacity with zero displacement.

## 8. Performance Budget
- **DOM Nodes**: `< 45` elements.
- **LCP Impact**: `<h1>` is server-rendered plain text with self-hosted local variable font (`CLS = 0.00`, zero network block).
