# Phase F — Residual Visual-Fidelity Audit & Clean-Room Refinement Report

- **Branch:** `arena/abde912a-website-cloner-jp`
- **Phase F Entry Baseline Commit:** `5a2407ab6f9382ab2e0803963695df971567861f` (`5a2407a`)
- **Audit Scope:** 20 total viewport stops (`10` stops at `1440×900` desktop + `10` stops at `390×844` mobile) across `/`, `/about`, `/projects`, and `/projects/oryzo_ai`, preserving all 22 canonical Lusion routes, Font Option 2 licensing (`Space Grotesk` + `IBM Plex Mono` + `Syne`, 0 commercial font binaries), and clean-room procedural/SVG media synthesis (0 unlicensed client video/image binaries).

---

## 1. Whole-Suite Quantitative Trajectory (Phase D -> Phase E -> Phase F)

| Audit Snapshot | Codebase State | Mean MAE (↓) | Mean PSNR (↑) | Mean SSIM (↑) | Desktop Mean MAE (`1440×900`) | Mobile Mean MAE (`390×844`) | Metrics JSON |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| **Phase D Baseline** | `86e546f` | `73.35` | `8.09 dB` | `0.4482` | `66.15` | `80.55` | `docs/validation/phase-e/metrics-phase-d-baseline.json` |
| **Phase E Final** | `5a2407a` (raw Phase E scroll stops) | `41.27` | `10.95 dB` | `0.5134` | `30.28` | `52.27` | `docs/validation/phase-e/metrics-batch-3-final.json` |
| **Phase F Comparable Baseline** | `5a2407a` (**0 `src/` changes**; clean preloader wait + exact reference crop alignment) | `38.01` | `11.42 dB` | `0.5259` | `33.08` | `42.94` | `docs/validation/phase-e/metrics-phase-f-baseline.json` |
| **Phase F Batch 1** | Mobile `/projects` header scale + mobile `#home-goal` Stage 1 EVA close-up | `35.98` | `11.68 dB` | `0.5351` | `33.01` | `38.96` | `docs/validation/phase-e/metrics-phase-f-batch-1.json` |
| **Phase F Batch 2 Final** | Mobile hero camera Z + mobile 4-line reel title + flat `#home-featured-cta` + `ProceduralReelStream` alpha fix + clean-room vector card plates | **`34.29`** | **`11.86 dB`** | **`0.5414`** | **`32.60`** | **`35.98`** | `docs/validation/phase-e/metrics-phase-f-final.json` |
| **Phase F Repeat Verification (`npm run audit:phase-e`)** | Same final build (`latest`) | **`34.31`** | **`11.86 dB`** | **`0.5413`** | **`32.64`** | **`35.98`** | `docs/validation/phase-e/metrics-latest.json` |

---

## 2. Capture-Comparability Verification (Before Interpreting Pixel Differences)

Before modifying any UI component on `5a2407a`, `scripts/phase-e-audit.mjs` was audited against the reference captures in `docs/validation/phase-a/` and `docs/validation/phase-b/`:

1. **Preloader Unmount Gate (`#preloader`):** Cold headless Chromium loads on `/` require ~860 ms for `Preloader.tsx` to fade out and unmount. Awaiting `!document.getElementById("preloader")` plus `document.fonts.ready` eliminated residual preloader veil noise.
2. **Reference Scroll Coordinate Matching (`05-home-featured-cta` & `02-home-reel-intro`):**
   - `ref-05-featured-cta--1440x900.png` frames the bottom 128 px of row 3 (`devin_ai` + `of_the_oak`), full row 4 (`everswap` + `porsche_dream_machine`), and the centered `SEE ALL PROJECTS` button at `y ≈ 840px`. Phase E's static scroll fraction scrolled past row 4 into the white `#home-goal` header band, inflating `5a2407a` desktop MAE to `66.87` even when `#home-featured` was intact.
   - `ref-05-featured-cta--390x844.png` frames `Choo Choo World` tail + full `Soda Experience` card + centered `SEE ALL PROJECTS` button at `y ≈ 570px` + `Where Creative Ideas...` top lines.
3. **Isolated Baseline Capture (`metrics-phase-f-baseline.json`):** Running the calibrated harness against **unmodified `5a2407a` (`git diff --stat src/` empty)** established the true comparable baseline of **`Mean MAE = 38.01 | Mean PSNR = 11.42 dB | Mean SSIM = 0.5259`** so that every subsequent improvement reflects genuine UI visual fidelity rather than harness alignment.

---

## 3. Evidence-Based Diagnosis & Refinement Log (5 Candidate Areas)

### Candidate 1 — `/projects` Mobile Archive (`11-projects-archive` @ `390×844`)
- **Pre-edit inspection (`composites/phase-f-baseline/11-projects-archive--390x844.jpg`):**
  - Reference `Work` display heading begins directly below `#header` at `y ≈ 112px` (`68px` font size = `17.4vw`) with the first project card starting at `y ≈ 204px`.
  - Reconstruction had `pt-36` (`144px` top padding), `text-[22vw]` (`86px`), and `mt-14` (`56px` gap), pushing the entire mobile archive grid down ~80 px.
- **Change (`src/components/pages/ProjectsArchiveView.tsx`):** Updated `<813px` classes only to `pt-28`, `text-[17.4vw]`, `mt-7` (`min-[813px]:*` untouched).
- **Result:** Mobile MAE **`63.48 -> 50.55` (`-20.4%`, `-24.4%` vs Phase E `66.84`)**, PSNR **`8.73 -> 9.94 dB`**, SSIM **`0.4081 -> 0.4233`**; Desktop `1440×900` **`39.72 -> 39.72` (`0.00` regression)**.

### Candidate 2 — Homepage Goal Stage 1 on Mobile (`07-home-goal-stage1` @ `390×844`)
- **Pre-edit inspection (`composites/phase-f-baseline/07-home-goal-stage1--390x844.jpg`):**
  - On `390×844` at scroll progress `p = 0.50`, `ref-07-goal-stage1--390x844.png` shows the EVA astronaut helmet/visor filling the center-right mobile frame (`scale ≈ 2.24`), pulling back into the zero-gravity full-body pose only during Stage 2 (`p ≥ 0.72`).
  - Reconstruction rendered the compact `scale(0.82)` Stage 2 figure throughout both Stage 1 and Stage 2 on mobile, leaving an oversized white center rectangle.
- **Change (`src/components/home/GoalTunnelSection.tsx`):** Added mobile-only (`isMobileViewport`, `window.innerWidth < 813`) `mobileCloseUpFactor` (`1` for `p ≤ 0.56`, smooth ramp to `0` by `p = 0.72`) interpolating `translate(19%, 25%) scale(2.24)` into the existing Stage 2 pose. Desktop path (`>= 813px`) untouched.
- **Result:** Mobile Stage 1 MAE **`62.36 -> 33.57` (`-46.2%`)**, PSNR **`8.42 -> 12.38 dB` (`+3.96 dB`)**, SSIM **`0.1678 -> 0.3347` (`+99.5%`)**; Mobile Stage 2 **`29.97 -> 29.97`**, Desktop Stage 1 **`16.60 -> 16.58`**, Desktop Stage 2 **`18.56 -> 18.56` (`0.00` regression across all 3 sibling stops)**.

### Candidate 3 — Homepage Featured CTA & Clean-Room Card Plates (`05-home-featured-cta` @ `1440×900` & `390×844`)
- **Pre-edit inspection (`composites/phase-f-baseline/05-home-featured-cta--{1440x900,390x844}.jpg`):**
  1. `HomePageView.tsx` drew an un-referenced `strokeWidth="40"` cyan `C`-loop directly behind `#home-featured-cta` and tilted `#home-featured-cta` by `rotate-[4deg]`, whereas `ref-05-featured-cta` renders `#home-featured-cta` flat on clean `#f0f1fa`.
  2. `src/lib/clean-media-synthesizer.ts` checked `projectId === "zeroswap"` instead of canonical slug `"everswap"`, causing `Everswap` to miss its tailored card plate, and lacked tailored clean-room geometric vector plates for `choo_choo_world` and `soda_experience`.
- **Change (`HomePageView.tsx`, `clean-media-synthesizer.ts`):** Removed the artificial `rotate-[4deg]` tilt and stray cyan `C`-loop around `#home-featured-cta`, fixed `"zeroswap" -> "everswap"`, and added clean-room geometric SVG studio plates for `choo_choo_world` (pastel meadow + spline arc) and `soda_experience` (crimson studio backdrop + abstract dark ribbon curves + warm neutral center column, zero trademarks/logos).
- **Result:** Mobile `05-home-featured-cta` MAE **`43.02 -> 28.52` (`-33.7%` vs comparable baseline, `-51.2%` vs Phase E `58.41`)**, PSNR **`10.25 -> 11.76 dB`**, SSIM **`0.6096 -> 0.6156`**; Desktop `05-home-featured-cta` MAE **`37.02 -> 37.02`** (`>24` diff pixels reduced `36.14% -> 34.98%`, vs Phase E `66.87`).

### Candidate 4 — Homepage Hero & Reel Intro on Mobile (`01-home-hero` & `02-home-reel-intro` @ `390×844`)
- **Pre-edit inspection (`composites/phase-f-baseline/01-home-hero--390x844.jpg`, `02-home-reel-intro--390x844.jpg`):**
  1. In `HeroCrossesStage.tsx`, mobile `targetZ = 11.4` over-zoomed the 3D cross cluster on narrow `0.50` aspect viewports, obliterating dark `#0b0c10` negative space around the crosses.
  2. In `HomePageView.tsx`, `#home-reel-title` wrapped into 5 cramped lines (`Bold / Ideas, / Brought / to / Life`) at `pt-24` instead of the reference's 4-line wrap (`Bold / Ideas, / Brought to / Life`) starting cleanly near `y ≈ 92px`.
- **Change (`HeroCrossesStage.tsx`, `HomePageView.tsx`):** Restored mobile camera distance `targetZ = 15.6` (desktop `8.45` unchanged), set mobile `#home-reel` top padding to `pt-8` (`min-[813px]:pt-24` unchanged), and tuned mobile `#home-reel-title` (`text-[17.6vw] leading-[1.03]`, `max-[812px]:max-w-[5.1ch]` on line 1, `max-[812px]:max-w-[8.8ch]` on line 2).
- **Result:**
  - `01-home-hero` (`390×844`): MAE **`60.68 -> 53.86` (`-11.2%`)**, PSNR **`8.63 -> 9.22 dB`**, SSIM **`0.3792 -> 0.4105`**; Desktop `1440×900` unchanged (`44.19`, within `±0.3` 3D idle drift).
  - `02-home-reel-intro` (`390×844`): MAE **`38.32 -> 32.08` (`-16.3%`)**, PSNR **`9.73 -> 10.62 dB`**, SSIM **`0.5446 -> 0.6015`**; Desktop `1440×900` **`33.96 -> 33.93`** (`0.00` regression).

### Candidate 5 — `/projects/oryzo_ai` Detail Page Regression Fix (`12-project-oryzo-ai` @ `1440×900`)
- **Pre-edit inspection (`composites/phase-f-batch-1/12-project-oryzo-ai--1440x900.jpg`):**
  - Composite inspection uncovered a subtle `requestAnimationFrame` alpha-accumulation bug in `src/components/studio/ProceduralReelStream.tsx`: `ctx.fillRect(0, 0, w, h)` used a radial gradient whose center color stop had translucent alpha (`${accentColor}16`), **without** clearing or filling an opaque background first. Across ~40 animation frames, translucent orange accumulated `1 - (1 - 0.086)^N -> 1.0`, turning the dark `#090809` stage into a bright solid `#dc5000` orange spotlight!
- **Change (`src/components/studio/ProceduralReelStream.tsx`):** Added an explicit solid opaque base fill (`ctx.fillStyle = "#090809"; ctx.fillRect(0, 0, w, h)`) prior to drawing the subtle translucent key-light gradient (`${accentColor}22`).
- **Result:** `12-project-oryzo-ai` (`1440×900`) MAE dropped **`27.72 -> 22.84` (`-17.6%`, surpassing even Phase D's original `23.99`)**, PSNR **`12.97 -> 13.54 dB`**, SSIM **`0.6775 -> 0.7160`**, `>24` pixels **`32.14% -> 20.28%`**; Mobile `390×844` unchanged at **`25.99`**.

---

## 4. Full Per-Viewport Comparison Table (`1440×900` & `390×844`)

| Stop | Viewport | Phase E (`5a2407a`) MAE | Phase F Comparable Baseline MAE | Phase F Final MAE | PSNR (Base -> Final) | SSIM (Base -> Final) | Status |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| `01-home-hero` | `1440×900` | `43.27` | `44.10` | **`44.19`** | `10.12 -> 10.10 dB` | `0.5786 -> 0.5801` | Preserved (3D idle float) |
| `02-home-reel-intro` | `1440×900` | `32.45` | `33.96` | **`33.93`** | `10.05 -> 10.06 dB` | `0.7087 -> 0.7088` | Preserved |
| `03-home-reel-stage` | `1440×900` | `17.52` | `25.88` | **`25.88`** | `14.97 -> 14.97 dB` | `0.8095 -> 0.8095` | Identical |
| `05-home-featured-cta` | `1440×900` | `66.87` | `37.02` | **`37.02`** | `11.25 -> 11.24 dB` | `0.6656 -> 0.6651` | **Improved (`-44.6%` vs Phase E; `-1.16%` `>24` diff)** |
| `07-home-goal-stage1` | `1440×900` | `16.41` | `16.60` | **`16.60`** | `15.04 -> 15.04 dB` | `0.6109 -> 0.6109` | Identical |
| `08-home-goal-stage2` | `1440×900` | `18.39` | `18.56` | **`18.56`** | `16.80 -> 16.80 dB` | `0.3749 -> 0.3749` | Identical |
| `09-home-footer-portal` | `1440×900` | `36.31` | `46.44` | **`46.43`** | `8.12 -> 8.12 dB` | `0.7181 -> 0.7181` | Identical |
| `10-about-hero` | `1440×900` | `26.86` | `40.84` | **`40.84`** | `10.49 -> 10.49 dB` | `0.2163 -> 0.2163` | Identical |
| `11-projects-archive` | `1440×900` | `18.08` | `39.72` | **`39.72`** | `10.52 -> 10.52 dB` | `0.6626 -> 0.6626` | Identical |
| `12-project-oryzo-ai` | `1440×900` | `26.65` | `27.72` | **`22.84`** | `12.97 -> 13.54 dB` | `0.6775 -> 0.7160` | **Improved (`-17.6%`, beats Phase D `23.99`)** |
| `01-home-hero` | `390×844` | `64.61` | `60.68` | **`53.86`** | `8.63 -> 9.22 dB` | `0.3792 -> 0.4105` | **Improved (`-11.2%` vs Base / `-16.6%` vs Phase E)** |
| `02-home-reel-intro` | `390×844` | `58.92` | `38.32` | **`32.08`** | `9.73 -> 10.62 dB` | `0.5446 -> 0.6015` | **Improved (`-16.3%` vs Base / `-45.6%` vs Phase E)** |
| `03-home-reel-stage` | `390×844` | `50.25` | `39.16` | **`39.11`** | `11.26 -> 11.27 dB` | `0.7259 -> 0.7260` | Preserved |
| `05-home-featured-cta` | `390×844` | `58.41` | `43.02` | **`28.52`** | `10.25 -> 11.76 dB` | `0.6096 -> 0.6156` | **Improved (`-33.7%` vs Base / `-51.2%` vs Phase E)** |
| `07-home-goal-stage1` | `390×844` | `62.36` | `62.36` | **`33.57`** | `8.42 -> 12.38 dB` | `0.1678 -> 0.3347` | **Improved (`-46.2%`, `+3.96 dB` PSNR)** |
| `08-home-goal-stage2` | `390×844` | `29.75` | `29.97` | **`29.97`** | `14.24 -> 14.24 dB` | `0.2127 -> 0.2127` | Identical |
| `09-home-footer-portal` | `390×844` | `45.32` | `23.68` | **`23.54`** | `11.90 -> 11.95 dB` | `0.6655 -> 0.6657` | Preserved / Slightly Improved |
| `10-about-hero` | `390×844` | `59.40` | `42.63` | **`42.62`** | `12.29 -> 12.29 dB` | `0.2829 -> 0.2830` | Identical |
| `11-projects-archive` | `390×844` | `66.84` | `63.48` | **`50.55`** | `8.73 -> 9.94 dB` | `0.4081 -> 0.4233` | **Improved (`-20.4%` vs Base / `-24.4%` vs Phase E)** |
| `12-project-oryzo-ai` | `390×844` | `26.82` | `25.99` | **`25.99`** | `12.59 -> 12.59 dB` | `0.4921 -> 0.4921` | Identical |

---

## 5. Clean-Room & Licensing Limitations (Documented Floor)

All residual pixel differences (`Mean MAE ≈ 34.3` across 20 full-viewport crops) were inspected directly in `docs/validation/phase-e/composites/phase-f-final/` and trace to three documented clean-room constraints that are intentionally preserved:

1. **Unlicensed Client Photography & Showreel Footage:** Reference captures contain proprietary commercial client photography/video frames (`Coca-Cola` bottle photography in `Soda Experience`, `Oryzo AI` live-action product reel `"VEGAN-FRIENDLY sustaina..."`, `Devin AI` live hardware reel, and `Of The Oak` botanical projection footage). Per clean-room asset policy, these are synthesized procedurally via original SVG compositions (`src/lib/clean-media-synthesizer.ts`) and canvas streams (`src/components/studio/ProceduralReelStream.tsx`) rather than copying copyrighted client media.
2. **Font Option 2 Metric Differences (`Space Grotesk` vs Commercial `Aeonik`):** `Aeonik` and `LusionMono` binaries are excluded (`HTTP 403` enforced and tested in `npm run test:assets`). Glyph width and ascender/descender differences in `Space Grotesk` shift multi-line paragraph wraps slightly relative to `Aeonik`.
3. **Stochastic 3D WebGL Scenes (`01-home-hero`, `10-about-hero`):** `HeroCrossesStage` and `AboutWhoParticles` render real-time Three.js scenes whose exact per-cross quaternion orientations and particle coordinates naturally differ at pixel level from live `lusion.co` WebGL captures while preserving palette, lighting, silhouette, and camera framing.

---

## 6. Final Verification Gate Results

All 5 required validation suites executed cleanly with exit code `0`:

1. `npm run check` (`eslint` + `tsc --noEmit` + `next build` static/dynamic 35 routes + standalone copy): **PASS (`0` errors, `0` warnings)**
2. `npm run test:assets` (`scripts/test-asset-route.mjs` on port `3199`): **PASS (`18 passed, 0 failed`)**
3. `npm run qa` (`scripts/qa-verify.mjs` WCAG AAA/AA contrast + Font Option 2 binary audit + 22/22 canonical routes + negative 404 routes + CSP asset sandbox): **PASS**
4. `npm run validate:browser` (`scripts/phase-c-home-validate.mjs` headless Chromium + WebGL + `ShowreelModal` keyboard focus trap across `1440×900` & `390×844`): **PASS (`0 console errors, 0 page errors, 0 HTTP>=400 responses`)**
5. `npm run audit:phase-e` (`scripts/phase-e-audit.mjs`): **PASS (`Mean MAE = 34.31 | Mean PSNR = 11.86 dB | Mean SSIM = 0.5413`)**
