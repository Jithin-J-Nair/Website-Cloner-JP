# Browser Visual Validation & Baseline Comparison Report — Phase A

- **Phase:** `Phase A` (Pre-UI baseline checkpoint, ground-truth extraction, licensing-enforced asset staging, and browser harness setup)
- **Baseline Git Tag:** `baseline-pre-lusion-reconstruct` -> `e5e953b0515d18edce003ab97f80e9437577c9b1` on branch `arena/abde912a-website-cloner-jp`
- **Browser Engine:** Headless Chromium (`/tmp/chromium`, `@sparticuz/chromium`) + ANGLE Vulkan **SwiftShader WebGL2** (`Google Inc. (Google)` / `ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)))`), captured via CDP `Page.captureScreenshot`
- **Reference Target:** `http://127.0.0.1:4173` (`node /tmp/lusion-ref/serve.cjs`, serving the 2026-09-23 `https://lusion.co/` snapshot offline with `206 Partial Content` support)
- **Local Baseline Target:** `http://127.0.0.1:3000` (existing standalone Next.js build at `e5e953b`, UI completely unmodified per Phase A instructions)
- **Machine-Readable Telemetry:** `docs/validation/phase-a/comparison-report.json`
- **Raw Screenshots (`28` PNGs):** `docs/validation/phase-a/raw/*.png`
- **Side-by-Side Diff Composites (`14` JPEGs):** `docs/validation/phase-a/composites/*.jpg`

---

## 1. Quantitative Comparison Matrix (`1440×900` & `390×844`)

| Scenario ID | Viewport | Route | Ref HTTP | Local HTTP | Ref Console Errs | MAE (`/255`) | RMSE (`/255`) | PSNR (`dB`) | Pixels Diff `>16` | Composite Sheet |
| :--- | :---: | :--- | :---: | :---: | :---: | ---: | ---: | ---: | ---: | :--- |
| `home-hero` | `1440x900` | `/` | `200` | `200` | `0` | `112.02` | `146.09` | `4.84` | `68.13%` | `docs/validation/phase-a/composites/home-hero--1440x900.jpg` |
| `home-featured` | `1440x900` | `/` | `200` | `200` | `0` | `102.69` | `135.07` | `5.52` | `83.33%` | `docs/validation/phase-a/composites/home-featured--1440x900.jpg` |
| `home-footer` | `1440x900` | `/` | `200` | `200` | `0` | `106.54` | `140.51` | `5.18` | `83.92%` | `docs/validation/phase-a/composites/home-footer--1440x900.jpg` |
| `about-hero` | `1440x900` | `/about` | `200` | `200` | `0`* | `181.08` | `198.22` | `2.19` | `93.71%` | `docs/validation/phase-a/composites/about-hero--1440x900.jpg` |
| `about-awards-capability` | `1440x900` | `/about` | `200` | `200` | `0`* | `188.10` | `203.55` | `1.96` | `96.53%` | `docs/validation/phase-a/composites/about-awards-capability--1440x900.jpg` |
| `projects-archive` | `1440x900` | `/projects` | `200` | `200` | `0` | `163.01` | `177.36` | `3.15` | `97.90%` | `docs/validation/phase-a/composites/projects-archive--1440x900.jpg` |
| `project-oryzo-ai` | `1440x900` | `/projects/oryzo_ai` | `200` | **`404`** | `0` | `65.04` | `84.00` | `9.65` | `98.89%` | `docs/validation/phase-a/composites/project-oryzo-ai--1440x900.jpg` |
| `home-hero` | `390x844` | `/` | `200` | `200` | `0` | `118.90` | `149.53` | `4.64` | `76.89%` | `docs/validation/phase-a/composites/home-hero--390x844.jpg` |
| `home-featured` | `390x844` | `/` | `200` | `200` | `0` | `102.83` | `130.03` | `5.85` | `99.47%` | `docs/validation/phase-a/composites/home-featured--390x844.jpg` |
| `home-footer` | `390x844` | `/` | `200` | `200` | `0` | `92.77` | `128.28` | `5.97` | `82.61%` | `docs/validation/phase-a/composites/home-footer--390x844.jpg` |
| `about-hero` | `390x844` | `/about` | `200` | `200` | `0` | `166.05` | `177.64` | `3.14` | `97.15%` | `docs/validation/phase-a/composites/about-hero--390x844.jpg` |
| `about-awards-capability` | `390x844` | `/about` | `200` | `200` | `0` | `184.47` | `193.36` | `2.40` | `97.40%` | `docs/validation/phase-a/composites/about-awards-capability--390x844.jpg` |
| `projects-archive` | `390x844` | `/projects` | `200` | `200` | `0` | `143.89` | `161.63` | `3.96` | `99.55%` | `docs/validation/phase-a/composites/projects-archive--390x844.jpg` |
| `project-oryzo-ai` | `390x844` | `/projects/oryzo_ai` | `200` | **`404`** | `0` | `59.98` | `86.64` | `9.38` | `99.24%` | `docs/validation/phase-a/composites/project-oryzo-ai--390x844.jpg` |

*\*Note on `/about` desktop (`1440×900`): Without route fallback, `quangminh1212/Design_Lusion.co` is missing `/assets/models/about/sphere_l.buf` (only `sphere_m.buf`, `sphere_s.buf`, and `sphere_xs.buf` are present in the upstream repo), causing a `404` that stalls `#preloader` at `069`. `scripts/browser-compare.mjs` records this upstream defect in `upstreamWorkarounds` and fulfills `sphere_l.buf` from `sphere_m.buf` (also staged at `public/assets/models/about/sphere_l.buf`) so desktop `/about` finishes preloading cleanly.*

---

## 2. Verified Visual Findings (Confirmed Directly by Screenshot Inspection)

1. **Homepage Hero (`/` at `1440×900` & `390×844`):**
   - **Reference (`lusion.co`):** Renders `#f0f1fa` surface, crisp `LUSION` wordmark top-left, circular sound waveform button + dark `LET'S TALK •` pill + `MENU ••` pill top-right, headline `"We create 3D visual storytelling and interactive web experiences that help brands stand out"` above a large rounded (`border-radius: 20px`) dark container (`#home-hero-visual-container`) holding glossy white, cobalt-blue (`#1a2ffb`), and black 3D hollow cross meshes (`cross.buf`), plus `+ + + + SCROLL TO EXPLORE` along the bottom edge.
   - **Current Local Baseline (`e5e953b`):** Renders fictional `KINETA®` header, `"We build 3D visual worlds and interactive experiences that set bold brands apart."`, full-bleed floating spheres colliding directly across headline glyphs, and invented hero CTA pills (`EXPLORE WORK`, `PLAY 2026 REEL`).

2. **About Page (`/about` at `1440×900` & `390×844`):**
   - **Reference (`lusion.co`):** Pure black (`#000000`) atmosphere with luminous 3D particle cloud, giant outlined white `LUSION` display wordmark spanning the bottom viewport edge, and `SCROLL TO EXPLORE` at bottom-right.
   - **Current Local Baseline (`e5e953b`):** Bright white/off-white background (`93.71%` pixel divergence), `KINETA®` copy (`"WE ARE A REAL-TIME PRODUCTION STUDIO CRAFTING LIVING DIGITAL WORLDS."`), fabricated `64` honor count instead of `58`, and no 3D team faces (`Edan`, `Ffion`, `Pierre`, `Yannic`, `Paul`, `Andrii`, `Sunny`) or interactive `S/C/T/P` playing cards.

3. **Projects Archive (`/projects` at `1440×900` & `390×844`):**
   - **Reference (`lusion.co`):** Light `#f0f1fa` background, full-width display `PROJECTS` header with superscript `19` and diagonal `↘` arrow, and 2-column rounded thumbnail grid starting with `Oryzo AI` and `Atlas Motion`.
   - **Current Local Baseline (`e5e953b`):** Dark `#0d0f18` surface, `"SELECTED PROJECTS"` (`06` fictional items) with invented filter tabs (`ALL`, `3D & WEBGL`, `INTERACTIVE WEB`, etc.).

4. **Case Study Detail (`/projects/oryzo_ai` at `1440×900` & `390×844`):**
   - **Reference (`lusion.co`):** Per-project themed `#1a1411` background with `#dc5000` orange brand accents, top-center `← BACK` pill (`1440×900`) / circular `←` button (`390×844`), sticky left metadata column (`Oryzo AI`, 2 paragraphs with inline external links, `• LAUNCH PROJECT` pill, `SERVICES`, `LINKS`), and scrollable right-hand video/image stack (`main.mp4`, etc.).
   - **Current Local Baseline (`e5e953b`):** Returns **HTTP `404`** across all 19 canonical `/projects/<slug>` URLs (`404 — THIS WORLD HAS NOT BEEN BUILT YET.`).

---

## 3. Static-Capture & Environment Limitations (Explicitly Distinguished)

1. **Reference `#input-blocker` Intro Lock Under CPU SwiftShader (`home-featured`, `home-footer`, `about-awards-capability`):**
   - Because `lusion.co` renders full-resolution multi-pass SSAO + bloom + SMAA on every `requestAnimationFrame`, software Vulkan SwiftShader renders `1440×900` at `~0.35–0.45 FPS` (`~2.2–2.8s` per frame). During the opening ~90-frame choreography, `<div id="input-blocker">` intercepts wheel events until intro completion, keeping mid-page scroll captures on the reference SPA pinned to the opening viewport unless run for several minutes per route.
   - **Mitigation & Verification:** All below-the-fold reference DOM sections, copy, CSS variables, media sequences, and layout rules were extracted and 100% cross-verified directly against all 22 HTML documents + CSS (`509/509` automated checks passing in `node scripts/extract-reference-data.mjs`). During Phases B–F, our reconstructed app will maintain smooth native/Lenis scroll addressability without input-blocking deadlocks so every scrolled section is directly testable in automated browser screenshots.

2. **Continuous Physics & Loop Phase Variance:**
   - Rigid-body 3D cross positions, particle drift, and `<video autoplay loop>` playback timestamps vary across runs; pixel `MAE`/`PSNR` metrics quantify macro palette/layout parity rather than exact frame-identical physics states.

3. **Upstream Archive Media Gaps:**
   - Missing `/assets/models/about/sphere_l.buf` in `quangminh1212/Design_Lusion.co` (resolved via `sphere_m.buf` fallback alias) and unavailable full-length Vimeo streams `761102167` (`107s`) & `783015830` (`115s`).

---

# Phase B Validation Report — Shared Design System, Licensed Typography & Lusion Shell

- **Phase:** `Phase B` (Shared Lusion design tokens, Font Option 2 calibrated open typography, global styling, shared `#header` + floating `#header-menu` + `#header-menu-labs` `Lucy`, right-edge `#scroll-indicator`, case-study `#header-center-project-back-btn`, cold-start `#preloader`, `#video-overlay` showreel modal, `#end-section` CTA, `#footer-section`, and `#scroll-nav-section`)
- **Automated Harness & Telemetry:**
  - `npm run qa` (`scripts/qa-verify.mjs`) — **PASSED (`0` failures)**
  - `node scripts/phase-b-shell-validate.mjs` — **PASSED (`18/18` checks across `1440×900` & `390×844`, `0` console errors, `0` page errors, `0` HTTP errors)**
  - Machine-readable report: `docs/validation/phase-b/shell-validation-report.json`
  - Pixel diff metrics: `docs/validation/phase-b/shell-metrics.json`
  - Raw PNG captures (`18` PNGs): `docs/validation/phase-b/raw/*.png`
  - Before / After / Reference composites (`10` JPEGs): `docs/validation/phase-b/composites/*.jpg`
- **Phase Guardrails Verified:**
  - **Font Option 2 Strictly Enforced:** `0` excluded commercial font binaries (`Aeonik`, `LusionMono`) anywhere in `public/` or Git index; body/display typography rendered with metric-calibrated SIL OFL `LusionSansCalibrated` (`Instrument Sans`, `size-adjust: 97%`, `ascent-override: 96%`, `descent-override: 24%`) + SIL OFL `IBM Plex Mono` (`400` / `500` / `600` `.woff2`) + clean-room vector `LUSION` wordmark (`viewBox="0 0 121 24"`).
  - **Page Content Scope Boundary Preserved:** `0` files modified under `src/components/pages/*` — full homepage (`/`), About page (`/about`), Projects archive (`/projects`), and all `19` `/projects/[slug]` detail routes remain cleanly queued for **Phases C, D, and E**.

---

## 1. Phase B Before / After / Reference Pixel Error Matrix (`1440×900` & `390×844`)

| Shared Shell Surface | `1440×900` Before (`MAE`) | `1440×900` After (`MAE`) | `1440×900` Change | `390×844` Before (`MAE`) | `390×844` After (`MAE`) | `390×844` Change | Composite Evidence |
| :--- | ---: | ---: | ---: | ---: | ---: | ---: | :--- |
| **`#footer-section` White 12-Col Studio Footer** | `208.16` | **`7.80`** | **`-96.3%`** | `201.76` | **`18.49`** | **`-90.8%`** | `docs/validation/phase-b/composites/04-footer-and-portal--{1440x900,390x844}.jpg` |
| **`#scroll-nav-section` Dark Next-Page Portal** | `19.95` | **`5.63`** | **`-71.8%`** | `12.99` | **`7.49`** | **`-42.3%`** | `docs/validation/phase-b/composites/04-footer-and-portal--{1440x900,390x844}.jpg` |
| **Case-Study `#header-center-project-back-btn` Header Band** | `59.93` | **`7.37`** | **`-87.7%`** | `60.75` | **`4.41`** | **`-92.7%`** | `docs/validation/phase-b/composites/03-project-back-control--{1440x900,390x844}.jpg` |
| **Open `#header-menu` Full-Screen / Mobile Overlay** | `98.28`* | `100.89`* | *Phase C bg* | `112.96` | **`34.60`** | **`-69.4%`** | `docs/validation/phase-b/composites/02-header-menu-open--{1440x900,390x844}.jpg` |
| **Closed `#header` Top Band (`y = 0..105`)** | `31.81` | **`20.64`** | **`-35.1%`** | `30.30`* | `51.19`* | *Phase C sphere* | `docs/validation/phase-b/composites/01-header-closed--{1440x900,390x844}.jpg` |
| **`#preloader` Stepped-`L` + Split Counter & `#video-overlay`** | — | Verified | **`18/18` Pass** | — | Verified | **`18/18` Pass** | `docs/validation/phase-b/composites/05-preloader-and-video--{1440x900,390x844}.jpg` |

*\*Honest explanation of the two phase-boundary background variances:*
1. **Desktop (`1440×900`) Open `#header-menu` Full-Frame `MAE` (`100.89`):** On desktop `> 812px`, `#header-menu` is a right-aligned floating card stack (`HOME`, `ABOUT US`, `PROJECTS`, `CONTACT`, `Subscribe to our newsletter`, `ö LABS ↗`) while the left `~72%` of the `1440×900` frame shows the underlying page stage (`#f0f1fa` light Phase A hero canvas vs `lusion.co`'s dark `#14151a` `#home-hero` 3D connector container). Visual inspection of `02-header-menu-open--1440x900.jpg` confirms the floating card stack itself aligns cleanly in position, radius, typography, input treatment, and `Lucy` eyes widget; the full-frame difference will close when `#home-hero` is built in **Phase C**.
2. **Mobile (`390×844`) Closed `#header` Top Band `MAE` (`51.19`):** On the untouched Phase A homepage stage, a floating blue 3D icosahedron/sphere drifts across `y = 20..105` behind the right header margin; replacing the homepage stage in **Phase C** removes all stray spheres outside `#home-hero-visual-container`.

---

## 2. Automated Browser & Accessibility Checks (`18/18` Passed)

| Check | `1440×900` | `390×844` | Measured Detail |
| :--- | :---: | :---: | :--- |
| Cold-start `#preloader` stepped-`L` + 3-digit counter | **PASS** | **PASS** | Mid-roll digits captured (`014` desktop, `025` mobile) before zoom-aperture exit |
| Hydration-safe unmount + CSS tokens & calibrated font active | **PASS** | **PASS** | `LusionSansCalibrated`, `--color-off-white: #f0f1fa`, `--color-blue: #1a2ffb`, `--color-green: #c1ff00`, `fontsLoaded: 5` |
| Keyboard `Tab` focuses `Skip to main content` link | **PASS** | **PASS** | `document.activeElement.classList.contains("kn-skip-link") === true` |
| Floating `#header-menu` opens with 4 routes + Labs + `Lucy` SVG | **PASS** | **PASS** | `opened: true`, `linksCount: 4`, `lucy: true`, `labsHref: "https://labs.lusion.co/"` |
| Keyboard `Escape` closes `#header-menu` cleanly | **PASS** | **PASS** | `!document.getElementById("header-menu").classList.contains("--opened")` |
| Footer local-only newsletter validates & shows honest status | **PASS** | **PASS** | `"Saved locally (static reconstruction — write hello@lusion.co for studio dispatch)."` |
| Shared `#video-overlay` streams responsive local MP4 & closes on `Escape` | **PASS** | **PASS** | Desktop `1920×960` (`desktop.mp4`), Mobile `720×960` (`mobile.mp4`), unmounts cleanly |
| Case-study `#header-center-project-back-btn` theme & geometry | **PASS** | **PASS** | `99×45px` `← BACK` pill (`1440×900`), `45×45px` `←` circle (`390×844`), `#dc5000` `LUSION` accent |
| `prefers-reduced-motion: reduce` instant preloader bypass | **PASS** | **PASS** | `#preloader` unmounts immediately (`countAfterLoad450ms=0`) |

---

## 3. Honest Remaining Differences Reserved for Phases C–F

1. **Homepage Body Sections & WebGL Scenes (`Phase C`):** `/` currently still renders the pre-reconstruction hero/capabilities/showcase body beneath the new Lusion shell; **Phase C** will replace `/` strictly with `#home-hero` (3D hollow cross physics field in `#home-hero-visual-container`) -> `#home-reel` -> `#home-featured` (all 12 real Lusion featured projects) -> `#home-goal` (two-stage image tunnel) -> `#end-section` + `#footer-section` + `#scroll-nav-section`.
2. **About Page (`Phase D`):** `/about` body remains pre-reconstruction and will be rebuilt in **Phase D** with `#about-who` (dark `#000000` kinetic intro + interactive 7-member 3D face cloud & `[[ 001 ]]` compass) -> `#about-clients` (real SVG logo rows) -> `#about-award` (`58` awards, `03` articles, `5` talks) -> `#about-capability` (`S / C / T / P` interactive playing cards).
3. **Projects Archive & 19 Canonical Case Studies (`Phase E`):** `/projects` and all `19` `/projects/<slug>` detail pages (`oryzo_ai` through `maxmara_bearings_gifts`) will be wired in **Phase E** to automatically activate the verified per-project `#header` theme (`bgPrimary`, `bgSecondary`, `textHighlight`, `btnBgHover`, `btnTextHover`) and `#header-center-project-back-btn` already built and verified in Phase B.
4. **Full-Length External Showreel Audio/Video (`Documented Asset Note`):** As documented in `docs/asset-manifest.json`, external Vimeo streams (`761102167` / `783015830`) are unreachable offline; `#video-overlay` plays the verified responsive Lusion reel loops (`1920×960` desktop / `720×960` mobile) with real controls and an explicit caption noting the local reel loop.

---

# Phase C — Homepage (`/`) Reconstruction & Visual Parity Report (`2026-10-22`)

## 1. Scope & Architecture Completed in Phase C
- Replaced 100% of the legacy `KINETA` homepage sections on `/` with the canonical 7-band Lusion homepage hierarchy (`#home-hero` -> `#home-reel` -> `#home-featured` -> `#home-goal` -> `#end-section` -> `#footer-section` -> `#scroll-nav-section`) in `src/app/page.tsx` and `src/components/home/HomePageView.tsx`.
- Suppressed `<GlobalStage />` on `/` (`src/components/foundation/StudioShell.tsx`) so zero generic icosahedron/sphere meshes or telemetry pills appear anywhere on `/`.
- Built clean-room procedural 3D hollow connector geometry (`createHollowCrossGeometry` in `src/components/home/HollowCrossGeometry.ts`, matching `[-1, 1]^3`, `outerR = 0.3333`, `innerR = 0.105`, beveled lip rings, and outward solid normals) + real-time 3D physics & GLSL studio shading (`src/components/home/HeroCrossesStage.tsx`) with 3D pointer repulsion, click palette cycling (`#061dfb -> #ADFF00 -> #f6000e -> #7e09f5 -> #ffc000`), reduced-motion mode, and graceful SVG sculptural fallback on WebGL failure (`?forceWebglFallback=1`).
- Implemented `#home-reel` with scroll-driven scale/typography choreography, bold `#1a2ffb` connector ribbon, cobalt-duotone preview thumb (`#home-reel-thumb`), responsive MP4 loop (`desktop.mp4` / `mobile.mp4`), and `PLAY REEL` modal trigger wired to shared `#video-overlay`.
- Implemented `#home-featured` (`src/components/home/FeaturedProjectCard.tsx`) with all **12 verified Lusion projects** in exact ground-truth order (`oryzo_ai`, `atlas_motion`, `devin_ai`, `of_the_oak`, `everswap`, `porsche_dream_machine`, `synthetic_human`, `spatial_fusion`, `spaace`, `ddd_2024`, `choo_choo_world`, `soda_experience`), pointer depth-parallax hover, slide-in arrow choreography, and working `/projects/<slug>` route targets (`src/app/projects/[slug]/page.tsx` minimal verified-metadata stub pending full Phase E case-study reconstruction).
- Implemented `#home-goal` (`src/components/home/GoalTunnelSection.tsx`) with `#home-goal-context` + two-stage scroll-scrubbed tunnel (`Stage 1` dark space portfolio fly-through + spreading 3-line `"STEP INTO A NEW WORLD / AND LET YOUR / IMAGINATION RUN WILD"` title -> `Stage 2` white prismatic crystal & die-cut vector sticker tunnel -> `#end-section` -> `#footer-section` -> `#scroll-nav-section`).
- Added RFC 7233 `200`/`206 Partial Content` local inspection media streamer (`src/app/assets/[...path]/route.ts`) reading `/tmp/lusion-ref/assets` when locally available while strictly returning `403` on any `fonts/*` path under Font Option 2.

## 2. Phase C Chromium + SwiftShader WebGL2 Verification (`18 / 18` Checks Passed)

Artifacts & raw report: `docs/validation/phase-c/home-validation-report.json`, `docs/validation/phase-c/*.png`, and side-by-side sheets in `docs/validation/phase-c/composites/compare-*--{1440x900,390x844}.jpg`.

| Key Visual / Behavioral Check | `1440×900` | `390×844` | Measured Result |
| :--- | :---: | :---: | :--- |
| Exact 7-section Lusion DOM order & 0 `KINETA`/telemetry leakage | **PASS** | **PASS** | `home-hero -> home-reel -> home-featured -> home-goal -> end-section -> footer-section -> scroll-nav-section` |
| WebGL shader compilation & solid 3D hollow cross rendering | **PASS** | **PASS** | `status=ready`, `bluePx=68,701`, `lightPx=176,059`, `darkPx=62,861` (`1440×900`); `MAE = 57.3` (`1440×900`), `MAE = 80.1` (`390×844`) |
| `#home-reel` intro layout, cobalt ribbon & `OUR APPROACH` CTA | **PASS** | **PASS** | **`MAE = 37.6`** at `1440×900` (`compare-02-reel-intro--1440x900.jpg`) |
| `#home-featured` header, 12 verified cards & canonical `/projects/<slug>` routing | **PASS** | **PASS** | **`MAE = 40.8`** (`1440×900`) / **`MAE = 32.4`** (`390×844`); `12/12` loaded WebPs & verified `/projects/oryzo_ai` navigation |
| Real-time pointer displacement & click palette cycle (`#061dfb -> #ADFF00`) | **PASS** | — | `pointerInteractions >= 1`, `accentAfterClick = "#ADFF00"`, `#video-overlay` `1920×960` stream active |
| Reduced motion + WebGL failure fallback (`?forceWebglFallback=1`) + `0` errors | **PASS** | **PASS** | `status=fallback`, compact `648px` runway, `errors = 0`, `failedMedia = 0`, `206` MP4 stream, `403` font block |


