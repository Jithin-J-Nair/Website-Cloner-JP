# Phase 1 — Behavioral & Architectural Reconnaissance Spec

> **Observation Protocol & Originality Guarantee**
> All observations below document high-level interaction patterns, spatial layout systems, scroll mechanics, and real-time rendering principles studied from public studio experiences in the award-winning WebGL production category (specifically referencing `lusion.co` and its `labs` R&D ecosystem as an ordinary visitor). Zero source files, textures, meshes, fonts, copy strings, shaders, or bundles were copied or reused. Everything implemented in this repository is built 100% from scratch under our original studio identity: **KINETA (`KINETA®` — Real-Time 3D & Interactive Production Studio)**.

---

## 1. Complete Sitemap, Global Chrome & Page Transitions

### 1.1 Route Topology
| Route | Role | Entry Transitions | Exit / Bottom Run-Out Destination |
| :--- | :--- | :--- | :--- |
| `/` | Studio Flagship Home (9-stage narrative scroll + reactive WebGL stages) | Preloader rolling counter (`000 → 100`) on cold entry; vertical wipe curtain on SPA route navigation | Bottom scroll-hold portal transitions to `/about` |
| `/work` (alias `/projects`) | Full Project Archive with count superscript, discipline filter pills, and dual view modes (Staggered Cards / Interactive Index) | Curtain wipe + staggered headline reveal + WebGL stage morph | Bottom scroll-hold portal transitions to `/labs` |
| `/work/[slug]` (alias `/projects/[slug]`) | Deep Case Study Template (6 full original case studies with per-project theme tokens, live interactive 3D hero stage, metrics, pipeline breakdown, gallery frames, and Next Project run-out) | Card zoom / curtain wipe into project theme surface | Next-project run-out portal cycles through all 6 case studies |
| `/about` | Studio Manifesto, Team Carousel (`[[ 001 ]]`–`[[ 006 ]]`), 4-Pillar Area of Expertise (`S / C / T / P`), Partner Marquee, 64-Award Ledger, Talks & Press | Curtain wipe onto crisp light surface | Bottom scroll-hold portal transitions to `/work` |
| `/labs` | Interactive WebGL & Shader R&D Playground (4 switchable live GPU experiments + live uniform controls + plain-language shader notes) | Curtain wipe onto obsidian void surface | Bottom scroll-hold portal transitions to `/contact` |
| `/contact` | Interactive Project Planner, Live Multi-Studio Clocks (Osaka / Bristol / New York), Direct Channels, and FAQ | Curtain wipe onto crisp architectural surface | Bottom scroll-hold portal transitions back to `/` |
| `/design-system` | Living Design System Documentation (all CSS variables, Tailwind tokens, typography specimens, motion curves, components, and live GPU telemetry) | Instant / curtain route transition | Quick return links to `/` and `/work` |
| `not-found.tsx` (`/*`) | Interactive 404 Zero-Gravity Signal Lost Scene | Direct fallback render with WebGL recovery stage | Magnetic pill recovery to `/`, `/work`, or `/labs` |

### 1.2 Persistent Navigation HUD (Floating Pill Architecture)
Rather than a full-width sticky header with a bottom border, global navigation floats in an inset fixed viewport frame (`padding: 20px 24px` mobile, `28px 40px` desktop, `z-index: 60`):
- **Top-Left**: Bold geometric wordmark (`KINETA®`) with subtle magnetic pull and character tracking shift on hover. Always high-contrast against the active section's theme (`light`, `dark`, `cobalt`).
- **Top-Right Pill Cluster** (`gap: 10px`):
  1. **Audio Equalizer Pill (`44px × 40px` rounded pill)**: Four vertical bars whose heights oscillate organically when Web Audio synthesis is active (`PLAY` state) and flatten to uniform dots when muted (`MUTE` state). Clicking initializes/toggles a procedural Web Audio ambient pad + micro-UI harmonic feedback.
  2. **Primary Action Pill (`LET'S TALK •`)**: Dark ink or electric cobalt pill (`height: 40px`, `border-radius: 9999px`) with dual sliding text layers and trailing arrow/dot micro-swap on hover.
  3. **Menu Trigger Pill (`MENU ••`)**: Opens a floating glassmorphic rounded card anchored to the top-right (`width: min(380px, calc(100vw - 32px))`, `border-radius: 24px`) containing primary navigation links with active dot indicators, live route count badges, newsletter quick-signup card, and social links. Dismisses via `Escape`, outside click, or route selection, with focus trap support.

### 1.3 Footer & "Continue Scrolling → Next Page" Portal
- Every top-level page culminates in a two-stage finale:
  1. **Monumental Contact Callout + Architectural Footer**: Large display headline inviting collaboration, studio coordinates, social links (`X / Twitter`, `Instagram`, `LinkedIn`, `GitHub`), separate General & New Business email copy triggers, inline newsletter input with instant state confirmation, copyright line, and R&D Labs link.
  2. **Scroll-Threshold Next Page Bar**: Pinned at the bottom of the document; overscrolling past the footer (or clicking the Next Page card) fills a horizontal progress bar (`0% → 100%`) that seamlessly triggers the route transition curtain into the next chapter of the studio experience.

### 1.4 Page Transition Curtain
- Navigating between routes invokes a GPU-composited transition overlay (`scaleY` / rounded portal mask) lasting `620ms` (`--ease-cinema: cubic-bezier(0.76, 0, 0.24, 1)`):
  - **Phase A (Cover, `0–280ms`)**: Overlay sweeps across viewport displaying target page label + subtle geometric mark; Lenis pauses and resets scroll position to `0` while hidden.
  - **Phase B (Reveal, `280–620ms`)**: Next route mounts, WebGL scene smoothly cross-interpolates its camera/material uniforms toward the new route preset, and curtain lifts cleanly without flash or layout shift.

---

## 2. Per-Section Architectural Breakdown

| Section | Surface Theme | Grid & Hierarchy | Primary Interaction & Triggers |
| :--- | :--- | :--- | :--- |
| **01. Hero** | `ice` (`#eef0f6`) | Full `100svh` viewport, 12-column Swiss grid with `4` corner/column `+` crosshairs. Monumental headline anchored bottom-left/center-left; scroll prompt & telemetry bottom-right. | Full-bleed interactive 3D sphere/capsule cluster with refractive glass core + glossy obsidian/ultramarine bodies responding to cursor repulsion and 6-DoF camera drift. Masked line reveal on load. |
| **02. Intro Statement & Showreel Portal** | `ice` (`#eef0f6`) → `void` frame | Asymmetric 12-col: Col 1–4 eyebrow (`• REAL-TIME CRAFT`), Col 5–12 statement headline + body copy + `OUR APPROACH` magnetic pill; below sits a rounded 16:9 WebGL/video showreel viewport. | ScrollTrigger scrubs the rounded showreel container from `78%` container width (`border-radius: 28px`) to `96vw` immersive theater scale (`border-radius: 16px`). Clicking opens interactive fullscreen Showreel modal with scene chapters. |
| **03. Featured Work** | `void` (`#090b10`) | Dramatic background shift from light ice to deep obsidian void as section enters (`top 55%`). Massive split heading (`FEATURED` / `WORK`), subtitle, 2-column staggered asymmetric project cards (left column offset upward, right column offset downward by `96px` on desktop), followed by large centered `SEE ALL WORK` pill. | Hovering a card scales its inner procedural WebGL/generative canvas (`1.0 → 1.045`), shifts chromatic dispersion edge glow, expands cursor into `VIEW CASE ↗` badge, and reveals staggered discipline tags (`concept • web • 3d • shaders`). |
| **04. Capabilities / Area of Expertise** | `cobalt` (`#2434ff`) → `void` | 12-col split: sticky left narrative + interactive 3D glyph stage; right stacked interactive capability cards (`[S] Strategy`, `[C] Creative`, `[T] Technology`, `[P] Production`) with monospaced index badges and expandable deliverable lists. | Activating or scrolling past each pillar morphs the WebGL geometry mode (icosahedral lattice → refractive torus knot → curl-noise particle shell → procedural modular array) and updates active card state. |
| **05. Studio Philosophy & Optical Dispersion Stage** | `void` (`#090b10`) | Centered monumental typography floating over an interactive optical refraction / tunnel field; short high-conviction manifesto paragraphs framed by architectural `+` markers. | Scroll velocity drives tunnel radial warp and dispersion strength; pointer position steers light caustics across the surface. |
| **06. Labs / R&D Strip** | `void` (`#0d1018`) | Horizontal showcase header (`KINETA LABS // R&D`) + 4 interactive experiment cards previewing real shader studies with FPS/shader badges + direct link to `/labs` full sandbox. | Hovering or clicking any card previews real-time parameter modulation and links directly into that experiment preset inside `/labs`. |
| **07. Client Partners & Awards Ledger** | `ice` (`#eef0f6`) | Dual counter-scrolling infinite marquees of 12 original geometric client emblems + structured `64` Awards Recognition Ledger grouped by jury with tabular `001 / 012 / 019` counters. | Marquee speed subtly accelerates with scroll velocity (`Lenis` velocity hook) and pauses smoothly on keyboard focus or hover. |
| **08. Contact CTA** | `void` (`#090b10`) | Full-bleed high-impact callout card with reactive 3D background glow, oversized two-line CTA headline, and magnetic `START A PROJECT` pill button. | Magnetic button pull (`±18px` body, `±8px` inner label parallax) + ambient WebGL color shift toward ultramarine/cyan. |
| **09. Architectural Footer & Next-Page Portal** | `void` (`#090b10`) | 4-column structured studio directory (Address, Socials, Direct Emails, Newsletter) + bottom colophon + Scroll-to-Next-Page progress bar. | Copy-to-clipboard toast feedback on email click, validated newsletter form state, and overscroll progress bar trigger to `/about`. |

---

## 3. Typography System

- **Display Face (`--font-display`)**: `Space Grotesk Variable` (weights `500–700`). Chosen for tight architectural geometry, squared terminals, and authoritative scale at monumental sizes.
- **Body & UI Face (`--font-sans`)**: `Instrument Sans Variable` (weights `400–600`). Crisp neo-grotesque proportions with clean punctuation and high legibility at small pill labels.
- **Technical Monospace (`--font-mono`)**: `JetBrains Mono Variable` (weights `400–500`). Used strictly for counters (`000`, `[[ 001 ]]`, `64`), coordinates, discipline tags, shader telemetry, and live clocks.

### Responsive Fluid Type Scale
| Token | Role | Mobile (`375px`) | Desktop (`1440px+`) | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `--text-hero` | Hero & Monumental Display | `2.75rem` (`44px`) | `clamp(3.25rem, 7.6vw, 7.5rem)` (`120px`) | `0.94` | `-0.04em` |
| `--text-h1` | Section Split Titles | `2.25rem` (`36px`) | `clamp(2.5rem, 5.8vw, 5.5rem)` (`88px`) | `0.96` | `-0.035em` |
| `--text-h2` | Statement Headlines | `1.625rem` (`26px`) | `clamp(1.75rem, 3.2vw, 3.125rem)` (`50px`) | `1.08` | `-0.025em` |
| `--text-h3` | Card Titles & Pillars | `1.25rem` (`20px`) | `clamp(1.35rem, 2vw, 1.875rem)` (`30px`) | `1.15` | `-0.02em` |
| `--text-body-lg` | Lead Narrative Copy | `1.0625rem` (`17px`) | `1.25rem` (`20px`) | `1.5` | `-0.01em` |
| `--text-body` | Standard Copy | `0.9375rem` (`15px`) | `1rem` (`16px`) | `1.6` | `-0.005em` |
| `--text-micro` | Pills, Tags & Crosshair Labels | `0.6875rem` (`11px`) | `0.75rem` (`12px`) | `1.2` | `+0.08em` (uppercase) |

---

## 4. Color System & Dynamic Theme Switching

The visual rhythm relies on high-contrast surface transitions rather than muddy mid-gray cards:
1. **Ice Surface (`data-surface="ice"`)**: Cool gallery off-white `#eef0f6`, secondary card `#e3e7f1`, primary ink `#0a0c12` (WCAG AAA `17.4:1` contrast), muted ink `#4a5165` (`7.1:1` contrast).
2. **Obsidian Void (`data-surface="void"`)**: Deep studio black `#090b10`, elevated glass card `#121622`, primary chalk `#f4f6fb` (WCAG AAA `18.1:1` contrast), muted slate `#9aa3b8` (`7.4:1` contrast).
3. **Electric Cobalt (`data-surface="cobalt"`)**: Signature ultramarine stage `#2434ff`, elevated translucent card `rgba(255, 255, 255, 0.1)`, pure white ink `#ffffff` (WCAG AA/AAA `7.2:1` contrast).
4. **Switching Mechanism**: Sections declare `data-surface="ice" | "void" | "cobalt"`. An IntersectionObserver / ScrollTrigger sync updates Zustand (`activeSurface`), transitioning body background, crosshair opacity, and HUD pill contrast smoothly in `450ms` using GPU-friendly color variables.

---

## 5. Motion Inventory

| Animation | Trigger | Duration | Easing | Stagger / Scroll Range | Communicative Purpose |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Preloader Digit Roll** | Initial mount + shader warm-up | `1.1s` (capped; instant on revisit / reduced motion) | `cubic-bezier(0.76, 0, 0.24, 1)` | Rolling hundreds/tens/ones columns (`000 → 100`) | Signals precision engineering while masking GPU shader compilation |
| **Masked Line Split Reveal** | Viewport entry (`top 84%`) | `0.85s` | `cubic-bezier(0.19, 1, 0.22, 1)` (`--ease-expo`) | `65ms` per line | Architectural clarity; headlines rise cleanly from clip masks |
| **Showreel Portal Expand** | Scroll scrub | Scrubbed (`lerp: 0.08`) | Linear scrub driven by Lenis | `top 80%` → `top 12%` | Pulls visitor physically inside the studio's real-time world |
| **Staggered Work Parallax** | Scroll scrub (desktop `≥1024px`) | Scrubbed | Linear scrub | `-36px` to `+36px` column differential | Creates editorial depth between left/right showcase columns |
| **Pill Button Text Swap** | Pointer enter / focus | `0.38s` | `cubic-bezier(0.22, 1, 0.36, 1)` | Dual `translateY(0 → -100%)` + dot-to-arrow morph | Tactile micro-feedback rewarding exploration |
| **Magnetic Pull** | Pointer move inside bounds | Continuous spring (`damping: 20, stiffness: 260`) | Spring physics | Max displacement `16px` outer / `7px` inner | Gives primary CTAs physical mass without hindering click accuracy |
| **Surface Palette Shift** | Section crosses `45%` viewport | `0.45s` | `cubic-bezier(0.4, 0, 0.2, 1)` | Section boundary trigger | Separates chapters cleanly without hard horizontal dividers |
| **Route Curtain Wipe** | Internal link click / bottom portal | `0.62s` total | `cubic-bezier(0.76, 0, 0.24, 1)` | `280ms` cover + `340ms` reveal | Unifies multi-page navigation into a single continuous world |

---

## 6. WebGL & Real-Time Shader Inventory

1. **Global Persistent R3F Canvas + Scene State Machine**:
   - A single persistent `<Canvas>` mounted in the root app shell behind interactive DOM layers (`pointer-events: none`, capturing normalized pointer coordinates from `window` so DOM scroll, text selection, keyboard focus, and links never get blocked!).
   - Why persistent over per-section canvases: browsers hard-limit active WebGL contexts (`8–16`), compiling shaders per section causes scroll hitches, and a persistent context allows seamless camera/uniform morphing across sections AND zero context churn across routes.
2. **Core Procedural Scenes**:
   - **Hero Kinetic Cluster & Optical Glass Core**: Instanced obsidian & cobalt spheres orbiting and colliding softly via damped spring repulsion around a custom GLSL **Snell's Law + Cauchy Chromatic Dispersion refractive icosahedron/torus core**, reacted to by normalized cursor raycast repulsion + 6-channel fBm camera drift.
   - **Capabilities Morphing Lattice**: Real-time vertex-shader interpolation across four mathematical forms matching `[S]`, `[C]`, `[T]`, `[P]` pillars + curl-noise particle halo.
   - **Optical Dispersion Tunnel / Ribbon Field**: Custom fragment + vertex shader generating a rhythmic luminous wave field sensitive to scroll velocity and pointer caustics.
   - **Labs Interactive Shader Sandbox (`/labs`)**: Dedicated interactive viewport exposing live uniform controls across 4 procedural studies (Cauchy Liquid Glass, Curl-Noise Advection Particles, Acoustic SDF Raymarching, and Harmonic Cloth Wave Mesh).
   - **Procedural Project Canvas Cards**: Custom lightweight generative 2D/WebGL procedural renderers giving each of the 6 case studies a distinct, alive visual signature with zero external image files.
3. **Post-Processing & Mobile Degradation**:
   - High tier (`desktop`, `≥55 FPS`): DPR clamped `[1, 2]`, subtle Bloom pass + film grain vignette inside custom shader output, `48` physics instances + `1,800` GPU particles.
   - Medium tier (`tablet` or `38–54 FPS`): DPR clamped `[1, 1.5]`, post-processing bloom disabled in favor of analytic shader glow, `28` instances + `900` particles.
   - Low / Fallback tier (`prefers-reduced-motion`, software renderer, WebGL disabled, or `<30 FPS` sustained): Automatic graceful fallback to GPU-light static framing or pure CSS atmospheric radial mesh gradients so 100% of content remains usable at 60 FPS.

---

## 7. Performance Budgets & Responsive Breakpoints

### Budgets
- **LCP Target**: `< 1.8s` desktop, `< 2.4s` mobile (hero `<h1>` renders in initial SSR HTML cleanly, never blocked behind WebGL lazy chunk loading — R3F canvas loads asynchronously via `next/dynamic({ ssr: false })`!).
- **CLS Target**: `0.00` (local WOFF2 variable fonts with matched fallback metrics; explicit `aspect-ratio` containers on all media/canvas cards; fixed HUD overlay out of document flow).
- **JS Execution**: Zero layout reads (`getBoundingClientRect`) inside `requestAnimationFrame` loops; pointer, scroll progress, and velocity are stored in mutable refs read directly by R3F `useFrame`.

### Breakpoints (Mobile-First)
- **Base (`< 640px`, Mobile)**: Single-column layout, compact top pill bar (`KINETA®` + Audio pill + `MENU`), staggered cards flatten to clean vertical stack (`gap: 32px`), touch-optimized hit targets (`≥ 44×44px`), custom cursor auto-disabled on coarse pointers (`pointer: coarse`), DPR clamped to `1.5`.
- **`md` (`768px`, Tablet)**: 8-column grid, 2-column footer & capabilities cards, medium WebGL quality preset, horizontal swipe enabled on team cards.
- **`lg` (`1024px`, Desktop)**: Full 12-column Swiss grid with `+` crosshair markers, staggered asymmetric Featured Work columns, full magnetic cursor & hover pill badges.
- **`xl` (`1440px+`, Wide Studio Display)**: Max container width `1480px` with proportional fluid display typography capped cleanly at `7.5rem`.
