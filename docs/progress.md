# KINETA — Engineering & Creative Build Progress Log

## Studio Identity
- **Studio Name**: `KINETA` (`KINETA®` — Real-Time 3D & Interactive Production Studio)
- **Locations**: Osaka (`JP`) · Bristol (`UK`) · New York (`US`)
- **Typography**: `Space Grotesk Variable` (Display) · `Instrument Sans Variable` (Body/UI) · `JetBrains Mono Variable` (Telemetry/Indices)
- **Palette**: Architectural Ice (`#eef0f6`), Obsidian Void (`#090b10`), Ultramarine Signal (`#2434ff`)

---

## Phase Checklist & Status

- [x] **PHASE 1 — RECON (`/docs/recon.md`)**
  - Observed live reference sitemap, persistent pill HUD, surface switching (`ice` ↔ `void` ↔ `cobalt`), showreel scrub expand, staggered work showcase, 4-pillar expertise matrix, awards ledger, bottom scroll-to-next-page portal, and real-time WebGL optical/physics language.
  - Documented complete route map, section specs, fluid type scale, color tokens, motion inventory, WebGL architecture, degradation tiers, and responsive breakpoints in `/docs/recon.md`.
- [x] **PHASE 2 — DESIGN SYSTEM (`/docs/tokens.md`, CSS variables, Tailwind v4 `@theme`, `/design-system` route)**
  - Authored complete token system (`void`, `ice`, `cobalt` surface palettes, spectral shader tints, fluid type scale across Space Grotesk / Instrument Sans / JetBrains Mono, 8px spacing rhythm, radii, named bezier curves, duration scale, z-index map) in `src/app/globals.css`, `tailwind.config.ts`, `src/lib/tokens.ts`, and `docs/tokens.md`.
  - Built living interactive `/design-system` showroom page with live surface switching, motion curve test track, procedural specimen canvases, and real-time GPU telemetry pills.
- [x] **PHASE 3 — FOUNDATION (Lenis + GSAP ScrollTrigger sync, Zustand store, Persistent R3F Canvas + FPS Watchdog, Preloader, Route Curtain, Custom Cursor, Magnetic Pill, Split Text Reveal, Web Audio Engine)**
  - Implemented `SmoothScrollProvider` coupling `Lenis` (`raf`) to `gsap.ticker` + `ScrollTrigger.update()` + `STAGE_TELEMETRY` velocity/progress buffers.
  - Built persistent root `GlobalStage` (`@react-three/fiber`, `FpsWatchdog`, `CameraRig`, `ProceduralWorld`, `no-WebGL` atmospheric fallback) + `configureCompressedAssetPipeline` (`Draco` + `KTX2`).
  - Built `Preloader` (`000 → 100`), `PageTransitionCurtain`, `StudioHud` (4-bar equalizer + `LET'S TALK` + glass `MENU` popover), `ShowreelModal`, and `CustomCursor`.
- [x] **PHASE 4 — SECTIONS & PAGES (`/docs/sections/*.md` first, then implementation across Home, Work, 6x Case Studies, About, Labs, Contact, 404)**
  - Authored specs prior to implementation in `/docs/sections/` (`hero.md`, `intro-statement.md`, `featured-work.md`, `services-capabilities.md`, `labs-experiments.md`, `client-awards.md`, `about-team.md`, `contact-cta.md`, `footer.md`).
  - Built all 9 sections and all routes: `/` (Home), `/work` & `/projects` (Archive with discipline filter + Grid/Index switcher), `/work/[slug]` & `/projects/[slug]` (6 complete original case studies with custom stage tinting, metrics, gallery, and next-project run-out), `/about`, `/labs`, `/contact`, `/design-system`, and `not-found.tsx` (`404`).
- [x] **PHASE 5 — ORIGINAL PROCEDURAL 3D & SHADERS (Snell + Cauchy dispersion shader, Spring-repulsion cluster, Morphing lattice, Curl-noise particle field, Interactive `/labs` shader workbench + plain-English shader docs in `/docs/shaders.md`)**
  - Implemented 4 original custom procedural 3D / GLSL systems (`Cauchy Optical Glass Dispersion Shader`, `Instanced Spring-Impulse Collision Swarm`, `Scroll-Velocity Satin Wave Filament Shader`, and `Analytical SDF Smooth-Union Raymarcher`), documented in plain words in `/docs/shaders.md` and interactive live inside `/labs`.
- [x] **PHASE 6 — POLISH, ACCESSIBILITY & QA (Reduced motion, keyboard navigation, semantic landmarks, WCAG contrast check, WebGL fallback, `npm run check`, live preview server verification)**
  - Added automated verification script (`scripts/qa-verify.mjs` / `npm run qa`) auditing WCAG 2.1 luminance contrast ratios (`17.4:1` ice, `18.1:1` void, `7.18:1` cobalt), zero reference hotlinks across all source modules, semantic landmarks, skip navigation, and HTTP status codes across all pre-rendered routes.
  - Documented QA findings in `/docs/qa-report.md` and full setup + Mermaid architecture diagram in `README.md`.
  - Verified clean zero-warning build (`npm run check`) and launched live preview server bound to `0.0.0.0:3000`.

---

## Ambiguity Decisions & Architectural Notes
1. **Self-Hosted Open Variable Fonts (`@fontsource-variable/*`) over runtime Google Fonts CDN**:
   - *Decision*: Bundle `Space Grotesk`, `Instrument Sans`, and `JetBrains Mono` locally via `@fontsource-variable`.
   - *Rationale*: Zero external network dependency during build or runtime, zero layout shift (`CLS = 0`), and faster first paint.
2. **Single Persistent Root R3F Canvas vs. Per-Section Canvases**:
   - *Decision*: One persistent `<GlobalStage />` WebGL canvas fixed at `z-index: 0` with `eventSource` bound to window pointer state and `dpr` dynamically managed by our `FpsWatchdog`, paired lightweight procedural 2D/shader canvases for project thumbnails.
   - *Rationale*: Eliminates browser WebGL context exhaustion (`max 8–16 contexts`), eliminates shader recompilation stutters during scroll, and enables smooth cross-route scene interpolation.
3. **Physics Engine Choice (Custom Analytical Spring-Impulse Solver vs. Heavy WASM Rapier Init on Critical Path)**:
   - *Decision*: Run deterministic 60–120Hz analytical sphere-sphere collision + spring-attractor + cursor-ray repulsion physics inside `useFrame` on pre-allocated `Float32Array` buffers (zero GC per frame).
   - *Rationale*: Zero 1.8MB WASM download blocking TTI, instant startup, deterministic stability across tab switches, and >95 Lighthouse desktop performance.

---

## Open Risks Log
- **Risk 1**: Heavy WebGL postprocessing on low-end mobile GPUs can drop frame rates below 45 FPS.
  - *Mitigation*: Built-in `FpsWatchdog` samples rolling 45-frame FPS and steps quality down (`high → medium → low`), clamping DPR to `1.0–1.5` and bypassing multi-pass bloom in favor of analytic shader glow.
- **Risk 2**: Smooth scroll (`Lenis`) conflicting with Next.js App Router route changes or modal scroll locking.
  - *Mitigation*: Centralize scroll lifecycle in `SmoothScrollProvider` synced to `gsap.ticker`, explicitly resetting scroll to `0` inside the transition curtain midpoint and pausing Lenis whenever the Menu or Showreel dialog is open.
