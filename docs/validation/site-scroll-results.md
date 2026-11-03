# Site-wide motion refinement — 2026-10-30

**Implemented and validated a skill-driven improvement pass, not an exact-clone signoff.** Exact About reproduction remains **NOT MET**. This continues the existing reconstruction rather than replacing working pages. See the [pre-edit plan and pinned skill revisions](site-scroll-plan.md).

## Reference research

Studied scroll-craft, taste-skill and Emil Kowalski's animation/performance/review guidance. Applied their principles to the existing stack: meaningful scroll/depth relationships, production screenshot inspection, direct compositor-friendly writes, elapsed-time damping, reduced/touch fallbacks, interruption and lifecycle cleanup. No dependency added, random redesign, duplicate scroll engine or external asset-generation service introduced. The requested reference takes precedence over generic aesthetic rules.

Fresh text retrieval of `https://lusion.co/about` succeeded. Fresh actual Chromium navigation failed with `ERR_CONNECTION_CLOSED` at **1440 and 390** ([attempts](site-scroll/reports/reference-live.json)). Text retrieval and historical screenshots are not proof of current live animation timing. The earlier Drive video remains unviewed; its size exceeds the connector download limit. No claim of watching it or hearing reference audio.

Scrollcraft doctor found Node, project workspace and Playwright; full ffmpeg and installed desktop Chrome were unavailable. Optional generated-media credentials were absent and unnecessary. No generated-media pipeline was attempted. The bundled software browser was used explicitly, not represented as desktop-Chrome media or physical GPU verification. The skills' generic style gates/scene-runtime harnesses were not claimed as passing: this reconstruction uses its existing native Three/Lenis scenes and the production browser suites below instead.

## Current implementation audit → implementation

### Shared shell: all routes

- **Cursor:** replaced fixed 0.2/frame interpolation with elapsed-time damping that retains exactly the previous 60 Hz response. A pure unit verifies equal response at 30/60/120/144/240 Hz. Its moving anchor stays 44×44; independent skins scale/fade instead of animating width, height or padding. Cancels on document hide/window blur/pointer exit and snaps on reentry. Fine-pointer/reduced-motion/reel gating and mutable pointer telemetry remain intact.
- **Smooth scrolling:** retained the existing single Lenis/GSAP integration and its duration/easing. Reduced-motion native telemetry is initialized immediately and refreshed on resize. An open menu/reel now retains its scroll lock when a live motion-preference change recreates Lenis. Route commits explicitly reset scrollY telemetry as well as progress/velocity.

### Home

- Project entrances, image depth/parallax and settling shear now write full transforms to the actual target elements, not inherited CSS variables on entire link subtrees. Natural geometry is still resize-cached, frame work remains event-coalesced, and idle shear settles without a permanent scroll loop.
- The reel title's two words translate equally/oppositely at the original visual spacing. Its flex gap/layout width no longer changes with scroll. At 1440 the measured title layout width stays **762 → 762 → 762 px** across expansion states. On tablet/phone this desktop split overlay is intentionally hidden; native mobile composition is retained.
- Reel radius is written directly to the rounded viewport rather than inherited through its descendants. This reference-shaped mask remains a bounded paint property, not a claim that every effect is transform-only.
- Existing hero word stagger now uses full transform strings, retaining original offsets, rotation, delays, duration and easing. CTA hover transitions name the properties instead of `transition-all`.
- Home journey's authoritative clock, phases, camera, poses, cinematic timing and audio implementation were **not edited**.

### About

- Header contrast transitions use one pending frame and cached document-space band bounds. Remeasurement happens on resize/content resize/font readiness/visibility return, rather than reading three rects on every scroll event. Observers/listeners/frames clean up on unmount.
- Plume grains now use **texture-free instanced analytical sphere impostors**: four vertices/two triangles, curved fragment normals and projected curved-surface depth for real-world occlusion. This replaces 240 vertices/80 triangles per small faceted grain. Same world-space analytical paths, seeds, count, fine-point layer, pointer/transport uniforms, material response and owned scheduler. Grains are slightly rounder rather than stretched/faceted; they are not proprietary production geometry or a fluid solver.
- At the software tier the plume layer changes **144,000 → 3,600 triangles (97.5% reduction)** without reducing its **1,800 grains + 7,200 fine points**. Valley totals change **203,145 → 62,745 triangles**, still **13 draws**. Tests also exercise 900/1,800/3,200/4,800 grain configurations.
- Terrain, explorer, editorial/team sequencing, selection, context recovery and all later content sections remain independent of Home's journey.

## Visual review

Opened fresh before/after renders and all five final contact sheets: [desktop](site-scroll/after/sheet-1440.jpg), [tablet](site-scroll/after/sheet-768.jpg), [phone](site-scroll/after/sheet-390.jpg), [full About desktop](site-scroll/after/about-sheet-1440.jpg), [full About phone](site-scroll/after/about-sheet-390.jpg). Individual full About milestones are in `site-scroll/after/about/`; native site captures and reports are in `site-scroll/{before,after}/`.

The visual critique follows taste-skill's focus/frame/type/phone/substance/collision checks, not an invented jury score:

- Home retains the dominant real-time hollow-cross scene, consistent outer margins, large editorial reel title, project imagery and phone-specific single-column layout. The reel's split motion preserves its composition without layout churn. Scroll crops naturally pass behind fixed chrome; these are not missing headings.
- About preserves the silver/cyan particle field → grounded explorer/dark mountain basin → quieter editorial contours → team → brands/recognition → cobalt expertise/contact → footer progression. The analytic grains remain visibly rounded, reflective and spatially distributed; the basin and explorer remain intact at desktop/phone sizes.
- The existing particle/title overlap in the cobalt CTA is also present in the historical `phase-h/reference/390x844/about-05-end-cta-flip.png`; the skill's generic prohibition on overlap is not a reason to redesign the reference.
- **Largest remaining fidelity gaps:** generic procedural team portraits rather than verified likenesses; text brand marks and simplified expertise artwork; the existing 2D CTA heap rather than production simulation. Precise temporal choreography, production suit/rig, fluid topology and distorted wordmark variants are also not matched. These are not new exactness claims or hidden substitutes. Historical stills cannot resolve them into a current full-clone pass.

## Audio diagnosis

No audio engine, mute policy, sound assets or authoritative journey audio synchronization was changed. Physical speaker output and reference-audio parity remain **unresolved / NOT VERIFIED**. No inferred root cause or listening claim.

## Validation

Final production build, lint and TypeScript **PASS**. One pre-existing unused `highlight` warning remains in the unrelated project detail component. No checks were disabled or baselines relaxed.

| Gate | Final result |
| --- | --- |
| New shared-site browser suite, 1440/768/390 | **PASS** direct project transforms, layout-stable reel, reduced/touch, cursor settling/reentry, injected blur cleanup, live menu/preference lock recreation, About shader and header surface bands |
| Full About browser suite, 1440/390 | **PASS** complete section coverage, forward/reverse, pointer release, keyboard/cards, native desktop wheel, emulated touch horizontal selection vs vertical scrolling, offscreen/visibility/menu sleep, resize, genuine WebGL loss/restore, unavailable fallback and remount |
| Member selection GPU reuse | **PASS**, **51 → 51 buffers** at both widths |
| Real footer Home → About → Projects → Home | **PASS** desktop click/mobile emulated tap; owned About context/probe released |
| Home browser regression | **PASS** 1440 normal, 390 touch normal, 390 touch reduced; hero response, reel reverse, project heading reverse, solar GL/camera response, modal/background-video lifecycle |
| Explorer/plume/terrain/pointer/motion units | **PASS**; plume tests strengthened for bounded two-triangle geometry and curved depth, deterministic counts/seeds/shared uniforms/disposal assertions retained |
| Asset/security unit checks | **18 PASS** |
| Production QA | **PASS**, 22 routes + expected 404s + asset/security checks |
| Unexpected About page/console/restricted requests | **None** |
| Strict current full-clone fidelity | **NOT MET** |
| Software 60 Hz | **FAIL**, results below |
| Physical GPU/display, real touch hardware, speakers, OS backgrounding | **NOT VERIFIED** |

The existing Home browser script's diagnostic fields now read the actual transform/radius targets instead of removed variables; its assertions were retained. The new suite adds explicit transform/gap/overlay assertions. Event-injected blur/visibility and browser touch emulation are labeled, not physical-device claims. The earlier normal-motion goal blue-diversity and legacy mobile-audio failures were not rerun or claimed fixed by this pass.

### Same-script isolated software before/after measurements

Each run used the unchanged `capture-about-budget.mjs`, with no concurrent browser test. Counts, buffers and draw counts match at each sample: desktop **960×600**, phone **390×844**, same existing software tier. Raw data: [comparison](site-scroll/reports/budget-comparison.json), [before](site-scroll/budget-before/), [after](site-scroll/budget-after/).

These are **RAF intervals and render submissions, not display FPS or GPU execution time**. Single before/after runs are noisy, not a repeated statistical benchmark. In particular, unchanged editorial/team phases also varied and their timing changes must not be attributed to the plume optimization.

| Viewport | Unit | Median RAF ms before → after | P95 ms before → after | Submissions/s before → after |
| --- | ---: | ---: | ---: | ---: |
| 1440×900 | 0 | 202.4 → 62.1 | 392.7 → 72.2 | 4.6 → 15.8 |
| 1440×900 | 1.6 | 199.8 → 81.0 | 387.9 → 289.5 | 4.6 → 6.4 |
| 1440×900 | 5.35 | 362.1 → 236.5 | 764.5 → 274.6 | 3.4 → 4.6 |
| 1440×900 | 7.2 | 152.2 → 76.7 | 383.1 → 149.0 | 5.8 → 9.4 |
| 390×844 | 0 | 183.2 → 44.6 | 218.4 → 50.3 | 5.4 → 22.4 |
| 390×844 | 1.6 | 188.0 → 147.2 | 314.6 → 169.9 | 5.2 → 8.6 |
| 390×844 | 5.35 | 279.9 → 141.1 | 309.2 → 171.0 | 3.6 → 8.6 |
| 390×844 | 7.2 | 36.7 → 36.2 | 101.9 → 79.3 | 18.6 → 22.8 |

Every final sample reports **GL_NO_ERROR**. No quality-tier/count/framebuffer reduction, scheduler/culling alteration or changed performance-test expectation was used to improve the reported result. The remaining software frame-budget failure is real.

## Delivery

Production preview: **Website on port 3000**, `/` and `/about`. Same fixed session branch; **draft PR14 remains unmerged**. No new continuous comparison video is included; older recordings describe older revisions only. Evidence and reproducible commands live in `site-scroll/` and `scripts/validate-site-scroll.mjs`. This is a measured improvement, not a claim that missing reference evidence or outstanding fidelity work has been solved.
