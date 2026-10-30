# Lusion About reconstruction / Home scroll craft — implementation results

Date: **2026-10-31** (Asia/Tokyo). Base: `9008d41276b247baa84e62bd754a6a096f07963c`.
Branch: `arena/95a11883-website-cloner-jp`. [PR14](https://github.com/Jithin-J-Nair/Website-Cloner-JP/pull/14) remains **draft, open, unmerged**. The delivery commit is the commit containing this report, identified in the session delivery response. No production deployment or merge was performed.

## Verdict / evidence boundaries

**Implemented and browser-validated:** focused About editorial reconstruction, original dimensional GPU contact particles, explicit team non-likeness disclosure/light field, and reversible Home headline/reading-cue handoff. Production build, static/unit checks and the enumerated browser regressions pass.

**Not established:** exact visual/temporal parity with the live reference, genuine employee portrait likenesses, proprietary particle simulation, 60 Hz smoothness, physical-device/GPU/audio certification. In particular, **software-renderer 60 Hz acceptance is FAIL**, not a pass inferred from draw counts, screenshots or successful builds. This report does not call the overall exact-clone ambition complete.

- Fresh text retrieval of <https://lusion.co/about> confirmed studio/team copy, recognition totals and the four full service lists. The canonical project data remains unchanged: 58 awards, 03 articles, 5 talks, 20 services.
- Actual live-reference Chromium attempts at 1440 and 390 failed with `ERR_CONNECTION_CLOSED`; see [live-attempts.json](master-reconstruction/live-attempts.json). No independently verified current live camera, timings, transitions or private implementation are claimed.
- The supplied `2026-10-29 22-24-06.mp4` is 119,697,263 bytes, over the connector's 100 MiB limit, and remains **unviewed**. The requested sequence and historical project evidence informed this reconstruction; the recording did not.
- The comparison images below are **local baseline versus this implementation**, not local versus the live reference.

## What changed, by file/system

| File | Implemented change |
|---|---|
| `src/components/three/ContactParticleField.ts` | Original deterministic instanced dimensional stream/mound, typed seed/orientation buffers, shader flow/lighting/depth, bounded typography-bottom and pointer coupling; reusable resource owner. |
| `src/components/sections/CinematicContactField.tsx` | Native Three renderer/camera/RAF owner, pixel/count budgets, visibility/intersection/overlay gates, reduced still, SVG unavailable fallback, context restoration and full cleanup. Fresh owned canvas for each effect lifetime. |
| `src/components/sections/ContactCtaSection.tsx` | Removed the old CPU-integrated 2D heap; integrated the native field into the blue 100svh stage. Preserved mailto, bottom action, routing and Home-dark variant. Blue action is a readable static label; both action variants prevent wrapping. |
| `src/components/pages/AboutExpertiseDiagram.tsx` | Four original technical SVG studies, not reference artwork or replacement feature icons. |
| `src/components/pages/AboutPageView.tsx` | Monumental outlined AWARDS with structured verified ledger retained; electric-blue, flat four-column expertise with all 20 services and semantic keyboard/selection controls; 96-line team light field sharing existing portrait uniforms/clock; readable named non-likeness disclosure. |
| `src/app/globals.css` | Scoped award outline/type treatment and fine-pointer/reduced-motion expertise rules. |
| `src/components/home/HomePageView.tsx` | Reversible cue fade and at-most-24px headline handoff inside the existing upper-Home sampler; resets velocity history on visibility changes. |
| `scripts/test-contact-field.mjs` | Deterministic seeds/quaternions, all quality counts, finite geometry/normals, bounds/shared uniforms and idempotent disposal units. |
| `scripts/validate-master-reconstruction.mjs` | Three-viewport scene/content, Home handoff, contact progress/input/GL/lifecycle/context/reduced/fallback/navigation checks; action-label fit assertion; software cadence samples. |
| `scripts/capture-master-editorial.mjs`, `scripts/build-master-contact-sheets.mjs` | Complete service-column captures and reproducible, explicitly labeled local before/after contact sheets. |

No new package or runtime dependency. No Home journey camera/clock/pose/choreography/audio/loading-engine rewrite; no changes to those engine files. Existing procedural opening/plume, central explorer, cinematic terrain, studio/narrative acts and navigation remain in their original native Three architecture and are covered by the new captures plus existing regression suites. This pass does **not** present those pre-existing systems as newly built.

The team study remains an **abstract visualization, not a likeness of the selected named employee**. It is stated directly in the visible interface. No restricted employee portrait binaries were newly copied into distributable assets; no generic generated face is represented as an employee. Genuine visual likeness remains a fidelity gap, not a completed requirement. Existing project media was retained, not newly declared universally licensed.

## Actual influence of the three skill families

Sources were studied before implementation, including pertinent named supporting references in bounded reads; this is not a claim of exhaustive tool/workflow certification.

- **Scroll Craft**, pinned `75d81f74e83692add18cd7a8a8e078b8a887a579`: devices/worlds/feel/hero-depth/approved-collection/verify/uniqueness/worldflight informed explicit distinct acts, a blue ending peak, viewport-relative stages, reversible clamped progress, and the Home invitation-to-reel handoff. Existing world-flight ownership was preserved instead of adding another journey/scroll runtime.
- **Taste Skill**, pinned `12af471f627f866411b4bd785b19646d3672784c`: existing-project audit plus motion/layout/type/colour/imagery/critique/scenes/copy/research informed the baseline capture, flat technical editorial composition rather than rounded feature cards, canonical service copy, monumental recognition typography and actual post-build screenshot critique.
- **Emil skills**, pinned `a81dbca07f2217b7103e510c0f13f8d5b017afc9`: design engineering, animate, animation-performance, review-animations, STANDARDS/vocabulary/improve/opportunity/mobile-native informed transform/opacity-first editorial motion, bounded 2-degree fine-pointer tilt, interruptible explicit transitions, no per-particle React/frame updates, touch/reduced gates, suspension and disposal. GPU work is reported as a separate measured cinematic budget, not mislabeled compositor-only motion.

Sources: <https://github.com/nateherkai/scroll-craft>, <https://github.com/Leonxlnx/taste-skill>, <https://github.com/emilkowalski/skills>.

## Actual particle architecture / ownership

- Exactly **three instanced mesh draws**: extruded boxes, crosses and diamonds; no object/component per grain. Seed `20261031`; typed Float32 seed and normalized quaternion attributes upload once. Runtime counts: 720 narrow/mobile, 960 detected software desktop/tablet, 1600 normal desktop; factory clamps 120–2400.
- Vertex shader constructs a depth-bearing tapered heap plus a minority falling stream, multiscale bounded curl-like analytical flow, perspective, orientation and bounded pointer repulsion. Fragment shader supplies normal-dependent diffuse/specular lighting and controlled stream-edge transparency. Depth testing/writing gives actual dimensional occlusion, not 2D canvas pseudo-depth.
- Static per-grain orientations are precomputed quaternions; a single reused global spin matrix updates per frame. This removes repeated orientation trigonometry per vertex. A causal frame-rate improvement is **not established** by the noisy software runs.
- Contact progress is `clamp((scrollY - sectionStart) / max(1, sectionHeight - stageHeight), 0, 1)`. Measured title-bottom bounds constrain the apex; this is **not glyph-outline collision**. Smoothstep width/flow response is reversible; autonomous scene time pauses with the owner. No CPU particle integration, per-particle CPU frame loop, per-frame React objects or fluid solver.
- Software framebuffer cap 700,000 pixels / DPR at most 1; other desktop cap 1,500,000 pixels / DPR at most 1.5. Count and framebuffer caps are implementation limits, not proof of smoothness.
- One contact renderer-owned RAF, cancelled while offscreen, document-hidden or behind menu/reel; full resource/listener/observer/context cleanup on effect teardown. About's team field shares its existing world clock and disposal tracker. Editorial awards/diagram transforms use coalesced event-driven frames, not a second perpetual world animation loop.
- Reduced motion draws a meaningful still with no pending contact RAF; unavailable WebGL keeps semantic content/mailto and an original static SVG field. Real `WEBGL_lose_context` restoration is exercised. A fresh canvas per effect fixes a reproduced disposed-context reuse error during preference changes.
- This is an **original analytical GPU field**, not FLIP, a downloaded simulation, a claim about Lusion's private shader, or a proprietary reconstruction.

## Final verification, against the restarted final production build

The final source changes to action no-wrap and mound-floor placement were built, the old server/runner stopped, and the full serial browser run repeated against a fresh production server. Earlier green results were not substituted for this run. The serial runner exited **0**. Supplemental complete expertise captures ran afterward, not during isolated budget measurements.

| Command / suite | Final result |
|---|---|
| `npm run lint` | PASS, 0 errors; one existing unrelated unused `highlight` warning in `LusionProjectDetailView.tsx`. |
| `npm run typecheck` | PASS. |
| `npm run build` / existing postbuild copy | PASS, Next 16.4.3 production build. |
| `node scripts/test-contact-field.mjs` | PASS. |
| Existing plume/explorer/terrain/pointer units; `npm run test:motion`; `npm run test:assets` | PASS. |
| `CHROMIUM_MULTIPROCESS=1 node scripts/validate-master-reconstruction.mjs` | PASS at **1440×900, 768×900, 390×844**. Per-width unexpected console/page errors: `[]`. |
| `validate-about-experience.mjs` | PASS desktop/mobile GPU scenes, section/reverse/input, keyboard, sleep, reduced/context/fallback/remount. |
| `validate-about-portals.mjs` | PASS real Home → About → Projects → Home footer controls, desktop click/mobile tap and owned-resource release. |
| `validate-home-motion.mjs`, width 1440 | PASS. |
| Same, width 390 / `HOME_TOUCH=1` | PASS. |
| Same, width 390 / `HOME_TOUCH=1 HOME_REDUCED=1` | PASS. |
| `validate-site-scroll.mjs` | PASS at all three widths, including cursor, overlay/preference locks, Home transforms, reel stability and About/header bands. |
| `npm run qa` | PASS **22/22 routes + 404 + asset security + 50/50 nonempty captured scene/project asset responses**. |
| `capture-about-budget.mjs` | PASS finite bounded resources / GL_NO_ERROR; **not** a 60 Hz gate. Measurements below. |
| Supplemental complete expertise capture + contact-sheet builder | Completed, exit 0. |
| `git diff --check` | PASS. |

The master suite captures opening, opening→landscape intermediate, central explorer/terrain, two-sided studio text, worldwide-specialist narrative, team, awards, expertise, contact progress 0/.5/1/.5 and reduced still at every width. It checks forward/reverse progress, large pixel-wheel bursts and resize while settling on desktop/tablet, pointer repulsion versus touch guard, injected visibility sleep/resume, menu suspension, real context loss/restoration, offscreen suspension, scene reverse, resize, preference changes and About→Projects owner replacement/disposal. Existing portal/Home suites cover real click/tap route traversal, Home touch/reduced behavior and interaction preservation.

Injected `document.hidden` verifies listener/scheduler ownership, **not physical OS backgrounding**. Pixel-wheel/Chromium touch emulation is **not physical trackpad/phone certification**. Forced-WebGL-failure reports retain expected constructor errors separately from the successful normal-context error arrays; see `regressions/about-unavailable.json`.

### Measured software cadence — 60 Hz NOT achieved

Renderer: **ANGLE / Vulkan SwiftShader (software)**. Values below are actual submission/RAF observations, **not physical GPU execution time or displayed FPS**. No physical GPU timer measurements were made, even where the timer-query extension was available. Samples are finite windows, not cross-device percentiles.

| Contact viewport | Particles / draws | Submissions/s | Median RAF ms | P95 RAF ms |
|---|---:|---:|---:|---:|
| 1440×900 | 960 / 3 | 16.5 | 66.6 | 83.3 |
| 768×900 | 960 / 3 | 28.0 | 33.3 | 50.0 |
| 390×844 | 720 / 3 | 40.2 | 33.2 | 33.4 |

Isolated existing About-world measurements, after the regression suites and without a second browser running:

| Viewport | Opening u=0 median/P95 ms | Terrain u=1.6 | Narrative u=5.35 | Team u=7.2 |
|---|---:|---:|---:|---:|
| 1440×900 | 61.3 / 97.6 | 81.4 / 297.7 | 245.3 / 569.2 | 141.7 / 222.1 |
| 390×844 | 43.5 / 67.5 | 147.5 / 216.4 | 140.3 / 191.4 | 40.9 / 88.5 |

About buffers were bounded at 960×600 / 390×844 and original low/mobile particle count 1800; every sampled GL error was 0. These values include serious frame-pacing misses. Historical values differ; this pass does not infer a causal performance improvement, establish a physical-GPU regression, or certify smoothness from them. Hardware smoothness, actual speakers/audio behavior and real OS/device behavior remain unverified. Audio was not reworked or claimed fixed.

## Real visual inspection and fixes, not just automated gates

Final desktop/tablet/phone contact sheets were opened and inspected, as were full desktop/phone contact frames, the full desktop awards frame and complete expertise sections at all three widths. Earlier actual image critique found an undersized/sparse field, weak outline, action-label wrapping/clipping and a mound base extending offscreen. The field scale/outline, static blue label/no-wrap and floor were corrected; the final label-fit assertion passes at every width and the final phone contact frame shows the complete action text. The final complete expertise captures show all four technical diagrams and all service lists, including columns below the first phone/tablet screen.

A real preference-change failure (`THREE.WebGLRenderer` reading null `precision`) was traced to rebinding a disposed/lost context on the same canvas. A fresh imperative canvas per effect lifetime fixed it; a targeted four-toggle Chromium check and then the complete final suites passed. The first new harness also sampled the probe during effect replacement; it now waits for the new owner. A separate **new-test** assumption that Projects must have no contact probe was wrong because Projects uses the shared contact section; it now asserts old-context loss, probe replacement and old scheduler cancellation. Existing tests/baselines were not weakened or altered to obtain passes. Failed iteration logs/reports remain under `iterations/`.

## Visual evidence / reproduction

Evidence package: [`master-reconstruction/`](master-reconstruction/), approximately 6.8 MiB. Raw per-width JSON, successful logs, expected fallback errors, isolated measurements and failed-iteration diagnostics are retained alongside images. Committed terminal-log copies normalize carriage returns/trailing whitespace only; error and result text is retained.

- Final all-state contact sheets: [desktop](master-reconstruction/after/sheet-1440.jpg), [tablet](master-reconstruction/after/sheet-768.jpg), [phone](master-reconstruction/after/sheet-390.jpg).
- **Local baseline → final**, not live-reference comparisons: [desktop](master-reconstruction/after/comparison-1440.jpg), [tablet](master-reconstruction/after/comparison-768.jpg), [phone](master-reconstruction/after/comparison-390.jpg).
- Complete expertise sections: [desktop](master-reconstruction/after/1440-expertise-complete.jpg), [tablet](master-reconstruction/after/768-expertise-complete.jpg), [phone](master-reconstruction/after/390-expertise-complete.jpg).
- Full final contact: [desktop](master-reconstruction/after/1440-cta-12-p1.jpg), [phone](master-reconstruction/after/390-cta-12-p1.jpg); [unavailable-WebGL contact](master-reconstruction/after/cta-unavailable.jpg).
- Entire final About pages: [desktop](master-reconstruction/after/1440-full-page.jpg), [phone](master-reconstruction/after/390-full-page.jpg).

Production preview: existing `npm run start` bound to `0.0.0.0:3000`, with the final build. No external production publication.

Reproduce with `npm run check`, units above, then a production server and the listed browser commands **serially**, using `CHROMIUM_MULTIPROCESS=1`. Home options: `HOME_VIEWPORT_WIDTH=1440`, or `HOME_VIEWPORT_WIDTH=390 HOME_TOUCH=1`, with `HOME_REDUCED=1` for reduced. After those measurements, run `scripts/capture-master-editorial.mjs` and `scripts/build-master-contact-sheets.mjs`. Outputs go to ignored `temp/`; this report preserves the actual final delivery evidence, not a promise of future verification.

Final diff review: only focused application/validation/documentation files; no dependency/lockfile, environment, credential or audio-engine changes. No previously existing test assertions or expected baselines edited. No merge or production deployment authorized or performed.
