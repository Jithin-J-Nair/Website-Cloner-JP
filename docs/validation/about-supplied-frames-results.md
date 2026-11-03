# About — three supplied frames repair (2026-11-03)

**Status: reference-led partial reconstruction, NOT an exact clone or a verified reproduction of live motion.**

## Evidence and access

The three new user-supplied images are 1568×832. They were opened at full size and compared with actual renders at that viewport:

- `image-4.png`: suspended granular silver mass, giant solid LUSION, large lower-right scroll prompt.
- `image-5.png`: closer basin, a central standing astronaut, suspended volume and rocks; four-line left manifesto with italic last line and italic two-line right manifesto.
- `image-6.png`: distant basin, much smaller astronaut/cloud, long overhead shaft and bright emitter. Manifesto remains in the same screen position.

The existence of these two basin framings is established by the stills. Their actual temporal order, scroll distances, transition durations, production spline, particle solver, pointer behavior and astronaut animation are **not** established by them.

Fresh direct Chromium navigation to `https://lusion.co/about` at this viewport failed with `net::ERR_CONNECTION_CLOSED` on 2026-11-03. This is a limitation of this inspection path, not evidence the public site is generally down. The text-fetch tool succeeded and confirmed semantic About content only. No live source animation was viewed. The previously supplied large video remains unviewed; no new claim is made about it. See `about-supplied-frames/live-access.json`.

## Actual repairs

| Owner | Changes |
|---|---|
| `src/lib/about-scene-motion.ts` | New pure scroll-to-pose function; near and distant basin positions are physically different camera poses. Original authored smooth transitions, without an extra timer, RAF, scroll runtime, or accumulated one-way state. Returns to the existing narrative/team framing. |
| `src/components/pages/AboutPageView.tsx` | Uses that pose in the existing authoritative render loop. Near desktop camera z=20, distant z=72. Figure is aligned with the suspended volume. Shaft now descends from a finite overhead emitter toward the cloud instead of looking like a laser from cloud to floor. Added missing color-space/tone-mapping shader chunks; emitter halo fades before the plane edge. Larger fading terrain domain, centrally concentrated vertex allocation and quality-aware mesh budget. Wordmark scale/weight/baseline, prompt size, manifesto line spacing and italic final line corrected against the supplied frames. Added camera coordinates to the existing opt-in diagnostic probe. |
| `src/components/three/AboutPlume.ts` | Broader asymmetric lobes, physically shaded larger grains, normal rather than additive fine-grain blending, less blown-out white sparkle, shared deterministic flow and pointer packet retained. This is an original analytical field, not Lusion's captured simulation. |
| `src/components/three/AboutTerrain.ts` | Narrower asymmetric escarpments and actual erosion relief, surface texture filtering, removal of polar/normal-dependent UV distortion, quieter regolith floor, and spatial opacity falloff so the distant terrain does not end in an opaque black cutout. Same height sampler continues to ground the figure, rocks and contour system. |

Scene revision: `suspended-volume-dual-basin-v2`.

The software renderer retains the prior 136²×2 terrain triangle budget rather than the initial repair's larger uniform mesh; nonuniform coordinates place that budget near the subject. High/native and mobile tiers have separately bounded geometry. No pixel-resolution override, scene-clock change, weakened assertion or baseline change was used to manufacture a performance pass.

The existing single About renderer, single native scroll mapping, scene clock, pointer transport, offscreen/visibility suspension, context recovery, reduced-motion mode, team controls and remount disposal remain owners of their existing responsibilities. No Home camera/clock, global audio engine, production route, navigation owner or expertise-card system was rewritten. No new dependency.

## Skills consulted and concrete application

Read AGENTS, the repository cloning skill, and installed Next `use client` documentation before editing. Consulted the actual skill checkouts:

- Scroll Craft `75d81f7`: independent depth, shared contact anchors, reversible scroll mapping and responsive inspection. Reference art direction takes precedence over a new generic journey.
- Taste `12af471`: inspect the existing project, compare actual screenshots, correct concrete mismatches rather than invent another layout. No random art-direction selection.
- Emil Kowalski skills `f1090be`: animation performance/review, interruption, direct transform/opacity writes, retained reduced-motion and lifecycle behavior. No React state updates per frame added.
- CloudAI-X Three.js skills `0e18186`: shader color-space correctness, instancing, bounded geometry, ownership/disposal and measured draw submissions.
- UI/UX Pro Max `713eef5`: preserve keyboard/touch navigation, readable responsive content, focus behavior and no horizontal overflow.

These skills guide implementation and review; they do not establish access to Lusion's private techniques or certify parity.

## Production verification

Build ID: `dlkbUXKpocjQ6YeE4EZsq`. The live preview was restarted on this production build, bound to 0.0.0.0:3000.

- Production build, TypeScript and ESLint: PASS. ESLint retains one pre-existing unused `highlight` warning in `LusionProjectDetailView.tsx`.
- New camera unit test: 22,502 finite/deterministic samples across desktop/mobile; bounded per-step travel, C1 joins, reverse/fast-seek equivalence, separate near/wide positions, retained editorial/team endpoint: PASS.
- Existing plume, licensed NASA explorer and Home motion unit tests: PASS. Terrain coverage was expanded to 37,249 finite/deterministic samples over the entire enlarged domain.
- New matched-viewport production browser test: eight forward states and reverse; real near/wide camera distance, equal manifesto DOM bounds at both views, one canvas, only permitted NASA model, zero console/page errors and no horizontal overflow: PASS.
- Existing cold-entry responsive/visual recheck at 1440×900, 768×900 and 390×844, now additionally capturing the distant basin: PASS. Its wordmark-clearance and existing other assertions were retained. Deliberate NASA-model 503 still displays the procedural fallback.
- Route QA: 22 canonical routes + intentional 404 + 50 nonempty scene/media bodies: PASS.
- Asset security/range tests: 18 passed, 0 failed.
- Extended input/lifecycle run: see final checkpoint below and retained logs; not inferred from static captures.

### Retained failures and performance boundaries

The first responsive run **failed** the unchanged 450ms post-seek wordmark-clearance assertion on the phone. Desktop/tablet had completed. Its report is retained under `retained-failure/390-before-budget-fix.json`. The initial larger uniform terrain mesh was then replaced with the prior software triangle budget, concentrated near the subject, and the same responsive assertions passed on the final build. The failed run is not erased or counted as a pass.

One initial extended interaction run was interrupted for the budget rebuild; it is not counted as a completed test. The final run is separately identified in the checkpoint/logs.

At the matched desktop viewport, the final software close/wide scene submits 107,630 triangles in 10 draws; opening submits 3,600 triangles in 2 draws, with additional fine point primitives. Counts are submissions, not GPU timing or proof of fidelity. The probe's rolling CPU/RAF windows retain large stalls (hundreds of milliseconds) and do **not** certify 60fps. They include loading, screenshot activity and preceding states, so they are not clean per-phase benchmarks. No physical GPU/phone, OS-background behavior or speaker output is certified.

The earlier normal autonomous Home Goal glass-stage failure is unrelated to these About edits and has not been cleared by this task. Home unit/route passes do not erase that historical failure.

## Visual review and remaining gaps

The reference/before/after comparison is intentionally uncropped and equally scaled. Before images are actual development renders at base `41b549a`, not substitutes for live-source captures. After images are from the final production build. Supplied stills are labeled as supplied stills, not claimed as newly captured source evidence. Screenshot review caught a faint exiting 100% loader in an initial opening capture; the matched capture now waits for the real preloader node to detach (without hiding/skipping it) and was rerun on the same production build.

**Improved:** physically distinct close/wide basin framing; fixed manifesto placement across camera travel; more appropriate wordmark/prompt proportions; less additive sparkle; finite overhead beam/emitter; aligned figure; larger continuous terrain extent without a hard edge; correct italic/line-spacing treatment.

**Still different:** original terrain silhouette/erosion and reflectance are not the source's craggy production basin; cloud density, occlusion, bokeh and exact fluid silhouette differ; astronaut silhouette/suit is the separately permitted NASA model, not Lusion's model; type is an OFL calibrated substitute, not the proprietary production face; atmospheric scattering/light balance are approximations. The source's exact forward/reverse timing, hold lengths, autonomous simulation, pointer effects and mobile composition remain unobserved. The rest of About was regression-checked, not newly verified for source fidelity.

Restricted Lusion scene/team binaries remain disabled. The supplied images are used only as inspection/comparison evidence, never as a flattened scene background. Generic portraits are not represented as real employee likenesses. No copied production bundle or recovered proprietary shader was enabled.

**Exact-clone acceptance remains unmet. No merge or production publication is authorized or performed.**

## Evidence

- `about-supplied-frames/comparison.jpg`: three supplied states / actual previous renders / updated production renders.
- `about-supplied-frames/after/`: matched 1568×832 milestone images and complete probe report.
- `about-supplied-frames/responsive/`: three viewport journeys and deliberate offline-model fallback.
- `about-supplied-frames/logs/` and `functional/`: executed checks, including incomplete/failed runs labeled above.
- `about-supplied-frames/manifest.json`: capture/artifact/source hashes, original input hashes, build ID and provenance.

### Final interaction checkpoint

The separately started final extended interaction run **exited 0** on the final production build. It verified desktop and phone section coverage; forward/reverse; bounded pointer/release; team selection without new GPU buffers; horizontal team swipe versus native vertical touch scrolling; keyboard/card controls; offscreen suspension; event-injected visibility suspension; genuine WebGL context loss/restoration; one-canvas recovery; route cleanup and remount. Reduced-motion and deliberately unavailable-WebGL fallbacks also passed. See `logs/experience-final.log` and `functional/{1440,390,reduced,unavailable}.json`.

The event-injected visibility and emulated touch checks are software coverage, not physical-device or OS-background certification. The test's legacy log phrase “real GPU scene” means actual browser WebGL draws via SwiftShader in this environment, not a physical hardware GPU benchmark.
