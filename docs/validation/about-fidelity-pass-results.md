# About fidelity follow-up — 2026-10-30

**Partial fidelity improvement, not an exact recreation. Draft PR14 remains unmerged.**

This report covers the new skills-first pass on top of `26b914bb6471935c25bc8840f4805f171d8efd40`. The [previous report](about-reconstruction-results.md) remains a historical record; its particle-density figures and captures do not describe this revision.

## Reference research

- Studied all three requested skill repositories before application edits; pinned revisions, applicable guidance and scope decisions: [about-skill-study.md](about-skill-study.md).
- The page-fetch tool successfully retrieved current About text and section structure. Actual Chromium navigation to the live About page failed with `ERR_CONNECTION_CLOSED` at **both 1440×900 and 390×844**: [fresh browser results](about-fidelity-pass/reports/live-reference-multiprocess.json). Text retrieval does not verify animation/hover/visual parity.
- Opened historical official-left plume/terrain composites, phase-H narrative and phase-G expertise reference, plus before/after local screenshots. The expertise reference contains transitional slicing; it is not evidence of a settled card state. No About reference video was available.

## Current implementation audit

The existing complete About hierarchy, native Three world, original portrait studies, keyboard/touch selectors, expertise interactions, fallback and lifecycle handling were retained. Fresh unmodified production build and baseline captures passed after moving our external skill clones outside the application tree. Next initially typechecked the skill repository's unrelated gallery when it was under `temp`; no exclusions or app dependencies were changed to conceal that error.

Default single-process Chromium exited during initial attempts. The existing helper's `CHROMIUM_MULTIPROCESS=1` option was used for both the fresh local baseline and final About tests. No production quality setting or assertion was weakened. Home regression scripts ran unchanged with their original launch configuration.

The inspected baseline had sparse large silver beads, smooth grey terrain and undersized narrative text. This pass addresses those visible gaps, not the entire outstanding exact-fidelity acceptance list.

## Implementation

- **Fine silver plume:** retained the original analytical GPU transport, instanced solid grains, bounded pointer repulsion and two-draw architecture. Added an independent deterministic fine-grain population, shaded point-sprite silver highlights and depth-dependent soft focus. Mesh grains have a more fine-weighted size distribution. Both plume fragment shaders now explicitly apply tone mapping and output color conversion, following the studied Three shader guidance.
- **Fixed population budget:** existing mesh tiers remain 900 / 1,800 / 3,200 / 4,800; fine points are now **four times** the mesh count rather than one-third. Total populations are therefore 4,500 / 9,000 / 16,000 / 24,000. The existing probe's `count` is **mesh instances only**, not total particles. No per-frame seed allocation or additional simulation textures/render targets; the finer population is not free GPU work.
- **Real terrain material:** extracted the existing shared deterministic height function into `AboutTerrain.ts` without changing the basin/contour/figure placement function. Added original four-octave world-space relief, pixel-footprint filtering, derivative-based bump normals, a tighter light pool and explicit linear-to-output color handling. No reference screenshot is used as a texture. Fading ground no longer writes invisible depth.
- **Editorial composition:** increased narrative type, restored the italic lead-in and adjusted the top offset. The About-only camera raises its sightline for black negative space during the narrative, then returns to the existing portrait framing. Faint shaded terrain remains beneath the editorial contours and disappears in team mode. These are historical-still-informed approximations, not measured original camera/easing data.
- No homepage/journey source, authoritative clock, scheduler, pose, stage, quality policy, audio engine, dependencies, routes or factual content changed.

### Remaining fidelity failures

**Exact reproduction remains FAIL / NOT VERIFIED.** The plume is analytical, not the original fluid transport; terrain/explorer are approximations; portraits are labelled generic studies, not authentic likenesses; brands remain factual text rather than copied emblems; expertise art/hover is not verified original behavior; the shared CTA is still the pre-existing 2D heap. Current live scrolling, parallax timing and every hover detail cannot be certified from text or historical stills. Original asset licensing and a usable current reference recording/browser access are still needed for those gates.

## Audio diagnosis

No audio-engine or sound-control changes in this pass. The previously reported physical production silence remains unresolved. Earlier signal-path tests are historical evidence, not a fresh listening test or proof of physical output; audio was not re-diagnosed here.

## Validation

| Gate | Fresh result |
| --- | --- |
| `npm run check` — lint, TypeScript, production build | **PASS**; one pre-existing unused `highlight` warning in `LusionProjectDetailView.tsx` |
| Updated plume unit test | **PASS** all four tiers, independent deterministic fine seeds, shared transport uniforms, output chunks, disposal; deliberate density expectation updated, lifecycle assertions retained |
| New terrain unit test | **PASS** 16,641 finite/deterministic samples; height range −1.857..14.622, ridge hierarchy, filtered relief, independent uniforms and disposal |
| Existing motion unit suite / asset-security suite | **PASS** / **18 PASS** |
| Full About browser suite, 1440 and 390 | **PASS** shader compilation, sections, reverse/reentry, pointer release, real keyboard selection, desktop card hover reset, native touch swipe vs vertical scroll, resize, menu/hidden/offscreen sleep, context loss/restore, unavailable fallback and remount cleanup |
| Selection buffer reuse | **PASS** 47 → 47 buffers at both widths; scene position retained |
| Reduced motion | **PASS** frames remain 1 → 1, no pending RAF; [report](about-fidelity-pass/reports/reduced.json) |
| Canonical Home → About → Projects → Home | **PASS** desktop click / mobile emulated tap; About owned context and probe released |
| Unchanged home-motion browser suite | **PASS** desktop 1440 / touch-emulated 390; hero/reel/featured/solar checks and no errors |
| Production QA | **PASS** 22 routes, expected 404s and existing asset-security checks |
| Exact current visual/temporal parity | **NOT VERIFIED**, with known substitution failures above |
| Software 60 Hz target | **FAIL**; see measured cadence below |
| Physical GPU, speaker output, real touch device / OS background | **NOT VERIFIED** |

The earlier normal-motion journey blue-diversity failures and legacy audio test's hidden-mobile-control expectation remain recorded in the previous report; those two browser suites were **not rerun in this scoped pass**, and are not claimed fixed. No tests/baselines/scheduler were altered to turn them green.

### Isolated SwiftShader budget run

`CHROMIUM_MULTIPROCESS=1 node scripts/capture-about-budget.mjs`, with no concurrent browser tests. This measures submission cadence, **not display FPS or physical GPU execution time**. Different launcher/process environment from historical measurements means these are not a controlled speedup/regression comparison.

| Viewport | Story unit | Median RAF / P95 ms | Submissions/s | Draws / triangles |
| --- | ---: | ---: | ---: | ---: |
| 1440×900 | 0 | 193.0 / 245.9 | 5.0 | 2 / 144,000 |
| 1440×900 | 1.6 | 192.8 / 543.0 | 5.0 | 12 / 185,978 |
| 1440×900 | 5.35 | 365.9 / 1,359.7 | 3.2 | 2 / 36,992 |
| 1440×900 | 7.2 | 168.9 / 813.3 | 4.4 | 2 / 0 |
| 390×844 | 0 | 176.4 / 213.6 | 5.8 | 2 / 144,000 |
| 390×844 | 1.6 | 174.2 / 383.9 | 5.2 | 12 / 185,978 |
| 390×844 | 5.35 | 247.6 / 334.2 | 4.4 | 2 / 36,992 |
| 390×844 | 7.2 | 48.2 / 84.7 | 18.0 | 2 / 0 |

Framebuffer 960×600 desktop / 390×844 mobile; mesh tier 1,800 + 7,200 fine points. Peak 14 geometries / 1 texture; GL_NO_ERROR and no unexpected console/page errors. Zero triangles at the team beat means points/lines, **not zero rendering work**. This is visibly below 60 Hz in software; no physical performance certification is implied.

## Delivery

- Live production preview runs on port 3000; open **`/about`**.
- Review remains on [draft PR14](https://github.com/Jithin-J-Nair/Website-Cloner-JP/pull/14); **not merged**.
- [Evidence folder](about-fidelity-pass/): fresh baseline/final u0, u1.6, u5.35, u7.2 screenshots at both widths, final full-page and unavailable captures, browser JSON and test logs (approximately 1.5 MB). Baseline is current branch HEAD before this pass, not an untouched live reference.
- New pass evidence is still images + browser assertions, **not a new motion recording**. Earlier MP4s document the previous revision only. No claim of frame-by-frame current-reference verification.
- External skill clones are outside the checkout and were not bundled. Application changes are restricted to the About world/materials and focused tests; no source models, proprietary portrait binaries or new assets/dependencies were added.
