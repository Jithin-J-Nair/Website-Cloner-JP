# Phase 2 — KINETA Design System & Token Specification

All tokens are exported simultaneously as:
1. **CSS Custom Properties** (`src/app/globals.css`)
2. **Tailwind CSS v4 `@theme` + `tailwind.config.ts`**
3. **Typed TypeScript Token Registry** (`src/lib/tokens.ts`) for synchronization across GSAP timelines, Web Audio synthesis, and Three.js / GLSL uniforms.

Live interactive showcase route: **`/design-system`**

---

## 1. Color Architecture (OKLCH + Hex Equivalents)

KINETA alternates across three high-contrast architectural surfaces as the visitor scrolls:

| Token | CSS Variable | Hex | Role & WCAG Contrast |
| :--- | :--- | :--- | :--- |
| **Void Base** | `--kn-void` | `#090b10` | Deep obsidian WebGL gallery surface (`18.1:1` vs Chalk) |
| **Void Elevated** | `--kn-void-elevated` | `#121622` | Cards, floating menu dark surface, showreel frame |
| **Void Glass** | `--kn-void-glass` | `rgba(18, 22, 34, 0.72)` | Frosted HUD pills & navigation popover on dark stages |
| **Ice Base** | `--kn-ice` | `#eef0f6` | Cool studio gallery off-white (`17.4:1` vs Ink) |
| **Ice Elevated** | `--kn-ice-elevated` | `#e2e6f0` | Light bento cards, pill backgrounds, input surfaces |
| **Ice Glass** | `--kn-ice-glass` | `rgba(255, 255, 255, 0.78)` | Frosted HUD pills on light stages |
| **Cobalt Signal** | `--kn-cobalt` | `#2434ff` | Signature studio accent, primary hover pill, capabilities stage (`7.2:1` vs White) |
| **Cobalt Iris** | `--kn-iris` | `#5b68ff` | Luminous interactive highlight & focus ring |
| **Spectral Cyan** | `--kn-cyan` | `#00d2ff` | Cauchy dispersion high-frequency rim tint |
| **Spectral Ember** | `--kn-ember` | `#ff4d2e` | Cauchy dispersion low-frequency rim tint & live status dot |
| **Ink Primary** | `--kn-ink` | `#0a0c12` | Primary foreground on Ice surface |
| **Ink Muted** | `--kn-ink-muted` | `#4a5165` | Secondary copy on Ice surface (`7.1:1` AA/AAA compliant) |
| **Chalk Primary** | `--kn-chalk` | `#f4f6fb` | Primary foreground on Void & Cobalt surfaces |
| **Chalk Muted** | `--kn-chalk-muted` | `#9aa3b8` | Secondary copy on Void surface (`7.4:1` AA/AAA compliant) |

---

## 2. Fluid Type Scale (`Space Grotesk` · `Instrument Sans` · `JetBrains Mono`)

- `--font-display`: `"Space Grotesk Variable", system-ui, sans-serif`
- `--font-sans`: `"Instrument Sans Variable", system-ui, sans-serif`
- `--font-mono`: `"JetBrains Mono Variable", ui-monospace, monospace`

| Token | Value | Leading | Tracking | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `--text-hero` | `clamp(2.75rem, 7.6vw, 7.5rem)` | `0.93` | `-0.04em` | Flagship hero & page display statements |
| `--text-h1` | `clamp(2.25rem, 5.6vw, 5.5rem)` | `0.95` | `-0.035em` | Section headers (`FEATURED WORK`, `EXPERTISE`) |
| `--text-h2` | `clamp(1.625rem, 3.1vw, 3.125rem)` | `1.08` | `-0.025em` | Narrative lead statements |
| `--text-h3` | `clamp(1.25rem, 1.9vw, 1.875rem)` | `1.16` | `-0.02em` | Project card titles & capability pillars |
| `--text-body-lg` | `clamp(1.0625rem, 1.25vw, 1.25rem)` | `1.5` | `-0.01em` | Case study & manifesto lead paragraphs |
| `--text-body` | `1rem` (`16px`) | `1.6` | `-0.005em` | Standard editorial & UI copy |
| `--text-sm` | `0.875rem` (`14px`) | `1.45` | `0em` | Metadata descriptions & form helper copy |
| `--text-micro` | `0.75rem` (`12px`) | `1.2` | `0.08em` | Pill labels, discipline tags, `[[ 001 ]]` indices |

---

## 3. 8px Grid Spacing System

- `--space-half`: `4px` (`0.25rem`) — micro optical adjustment inside pill badges
- `--space-1`: `8px` (`0.5rem`)
- `--space-2`: `16px` (`1rem`)
- `--space-3`: `24px` (`1.5rem`)
- `--space-4`: `32px` (`2rem`)
- `--space-5`: `40px` (`2.5rem`)
- `--space-6`: `48px` (`3rem`)
- `--space-8`: `64px` (`4rem`)
- `--space-10`: `80px` (`5rem`)
- `--space-12`: `96px` (`6rem`)
- `--space-16`: `128px` (`8rem`)
- `--space-20`: `160px` (`10rem`)

---

## 4. Radii, Shadows, Named Easings, Durations & Z-Index Map

### Radii
- `--radius-xs`: `6px`
- `--radius-sm`: `12px`
- `--radius-md`: `20px`
- `--radius-lg`: `28px`
- `--radius-xl`: `40px`
- `--radius-pill`: `9999px`

### Named Easing Curves
- `--ease-expo`: `cubic-bezier(0.19, 1, 0.22, 1)` — Masked headline reveals & card entrances
- `--ease-cinema`: `cubic-bezier(0.76, 0, 0.24, 1)` — Route transition wipe & preloader counter
- `--ease-tactile`: `cubic-bezier(0.22, 1, 0.36, 1)` — Dual-layer pill text slide & button hover
- `--ease-spring-ui`: `cubic-bezier(0.34, 1.45, 0.64, 1)` — Indicator dot pop
- `--ease-linear`: `linear` — Scroll-scrubbed progress & continuous marquees

### Duration Scale
- `--duration-instant`: `120ms`
- `--duration-fast`: `240ms`
- `--duration-base`: `420ms`
- `--duration-slow`: `720ms`
- `--duration-cinema`: `1050ms`

### Z-Index Map
- `--z-canvas`: `0` — Persistent R3F WebGL stage
- `--z-grid`: `5` — Architectural column rules & `+` crosshairs
- `--z-content`: `10` — Page sections & interactive cards
- `--z-sticky`: `25` — Next-page portal & sticky section indicators
- `--z-hud`: `60` — Persistent top navigation HUD bar
- `--z-popover`: `70` — Floating Menu card & toast notifications
- `--z-modal`: `80` — Showreel theater modal
- `--z-curtain`: `90` — Route transition curtain & preloader screen
- `--z-cursor`: `100` — Custom dual-layer cursor & contextual badge
