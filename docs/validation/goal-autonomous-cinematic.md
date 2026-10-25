# Goal cinematic: autonomous handoff and targeted visual upgrade

Date: 2026-10-25. Working branch: `arena/8509e843-website-cloner-jp`.
Baseline: clean `9a36a41`, following the earlier captured-asset repair in PR #10.

## Diagnosis before editing

The actual implementation is `GoalTunnelSection` and its existing downstream builders, not a separate Tesseract component. The required scene, rig, homepage integration, contact handoff, ground-truth JSON, and QA script were inspected. The pre-edit investigation is retained locally in `temp/cinematic-investigation.md`.

`tick()` copied `window.scrollY` into `targetScrollY`, smoothed it, and passed it to `renderSceneAtScroll()`. Emergence, tunnel travel, pose frames, camera banking, pullback, shatter, and wait all derived from that coordinate. `elapsedSec` animated incidental optics/drift, not the sequence itself. Thus a running render loop did **not** mean the cinematic would advance when scrolling stopped. This was direct progress coupling, not a missing model or a stalled animation mixer.

Two visual causes were also explicit in code: the monitor surround was calculated as RGB 247/248/252, and the glass shader used a constant tint plus a directional highlight without environment sampling. Blue-flight baked poses finished early, while the architectural windows did not physically travel.

## Playback ownership and handoff

- Normal editorial/tablet entry remains scroll-driven. Activation uses the existing full-aperture tablet threshold, normalized emergence **0.308**; the threshold was not invented from an inaccessible screenshot.
- After activation, the existing render loop advances **one time-driven playhead**. `createGoalPlaybackPath()` maps it into the existing document/scene coordinate. Its monotone cubic interpolation preserves position and first-derivative continuity between the staged beats. It is rebuilt on measurement, not allocated every frame.
- The same coordinate feeds the existing astronaut root, captured pose sampler, camera, environment, glass, and native document placement. There is no second scene loop, independent mixer, GSAP scrub competing with playback, or per-object animation timer.
- Lenis is locally stopped while playback owns progress. Its immediate forced setter synchronizes native document position to the playhead; this also reveals the existing contact content in place instead of jumping the DOM at the end. The global smooth-scroll provider is unchanged.
- Nominal duration is **26 seconds**. Frame advances are capped at 250 ms to avoid skipping whole beats during rendering stalls. Consequently a slow renderer can take longer than 26 seconds; this is not a fixed wall-clock-duration guarantee.
- Wheel, single-touch movement, and body scrolling keys cannot seek the active movie. Browser zoom, interactive controls, links, and navigation remain available. Small accessible Pause/Resume and Skip buttons sit outside the decorative `aria-hidden` stage. These are playback controls, not a scene HUD.
- Visibility, menu/reel, and route-transition state pause the clock. Manual pause also freezes incidental scene time and pointer smoothing. Hidden-tab elapsed time is not charged on return.
- Completion synchronizes the native scroll position, hides controls, and returns scroll ownership at **42% of the existing wait/contact section**, with the contact heading in the viewport. Skip does the same. If a playback button held keyboard focus, focus moves to the existing contact link without scrolling it again.
- Clicking a link, the header Let’s Talk button, a menu Contact button, or history/hash navigation cancels playback without forcing a completion seek. Explicit Contact navigation before activation also bypasses the movie while its native smooth jump crosses the trigger. Unmount releases owned scrolling, removes input/history/media listeners, cancels RAF, and disposes scene resources.
- Reverse travel after completion is an intentional scrub preview. Autoplay re-arms only after returning above `emergenceStart - 0.25 × viewportHeight`; small reversals or scrolling around the exit do not retrigger it. A subsequent forward entry plays once again.
- **Reduced motion:** initial OS preference retains user-controlled scrub and does not force the 26-second flight. Changing to reduced motion during playback finishes/releases it immediately and clears residual pointer parallax. This is the deliberate accessibility exception to autoplay.
- The development inspector's explicit `scrollToPixel()` cancels autoplay for deterministic phase inspection. Autonomous acceptance tests use native scroll, not that override.

## Visual changes within the existing architecture

### Nested structure and material response

The decoded captured girders and their existing placements/recycling remain intact. Open-ended glass sleeves are fitted around that aperture: three coordinated layers on desktop, two on mobile. Each layer shares one merged pane geometry, adds one draw, and has restrained depth offset/roll, Fresnel response, environment sampling, cyan edges, and a progress-driven light sweep. There are no replacement spinning cubes, new scene components, particle systems, or physics dependency.

The truss material now samples the same environment and uses a darker material base with sharper highlights. Full-beam saturated emission is reduced; glints are spatially confined rather than flooding entire girders. The nearer glazing edges were softened and moved beyond the central frame so they do not read as one conspicuous wireframe box.

### Blue corridor and astronaut

Existing merged arches and pilasters now live in a travel subgroup. Forward travel is eased through the blue-flight interval, reaching 22 local units, while the wall texture advances separately. The existing camera bank/FOV choreography is retained rather than inventing a large new camera flight unsupported by available reference data.

The captured float pose is distributed over the whole approach to the impact coordinate, rather than stopping at tunnel progress 0.86. A small continuous approach drift is applied consistently across the flight/pullback branches and fades through the burst. The architecture and astronaut therefore move at different rates without canceling their relative movement.

### Blue environment and glass break

The white surround is replaced locally with deep indigo, fading into the existing black emergence/wait environment. Header contrast remains appropriate across that blue surround.

A small cube target captures the **existing blue corridor geometry** once (128 px desktop / 64 px mobile), then supplies the shaft glazing, truss, and captured shards. No cube capture or PMREM rebuild runs each frame. The shader combines reflected and refracted-direction samples with restrained Fresnel transparency; normals account for the monitor's non-uniform aperture scale.

The existing 946-piece / 15-frame glass geometry, frame-major sampler, aperture registration, and disposal are reused. A progressive SVG crack reveal precedes the captured fragment motion. Fragment opacity and transform progression are staged after crack development, then fade before the portrait/wait state. This is an environment/refraction **approximation**, not ray-traced refraction, shard-to-shard reflection, or new physical fracture simulation.

### Lens artifact: local change, unresolved annotation

The actual downstream `chromaticRingMesh` is an independent full-screen additive overlay. Its shaft/entry contribution is removed locally; the orbital ring, visor optics, key/rim lights, bloom, and reflections are **not globally disabled**.

**The red “1” annotation has not been identified.** This removal is a known local optical cleanup, not a claim that the marked artifact is conclusively fixed.

## Reference access and limits

All six supplied share pages were retrieved and resolved to their corresponding direct image URLs:

- `nfg9nv5t.png`
- `u8q66h9n.png`
- `um2vhv9g.png`
- `x6eh2ftq.png`
- `kzmyjp24.png`
- `v2uzgz6q.png`

All six direct image fetches failed with HTTP 500 in the page tool; direct curl also failed TLS access. The page text does not reveal image pixels. Therefore **original/current classification and annotation identification remain unverified**, and direct uploads were requested. No classification was guessed.

The live Lusion page's text was accessible via the page tool, but not its interactive WebGL sequence. Visual comparisons use the historical repository captures in `docs/validation/phase-h/reference/{1440x900,390x844}/`, not a fresh live-site recording. The ground-truth JSON supplies section order and copy, not cinematic timing or shader constants. New timing/material values are local art direction, not extracted reference constants.

The actual cached UI/UX Pro Max skill and its documented Python searches were consulted for visibility cleanup, Three.js texture disposal, reduced motion, and user control. No plugin installation, generated design system, or inaccessible skill execution is claimed.

## Exact files and scope

1. `src/components/home/GoalTunnelSection.tsx` — playback ownership, controls/input/cleanup, native handoff, blue surround, reflection capture, optical cleanup, crack/fragment coordination, and telemetry.
2. `src/components/home/GoalDownstreamScenes.ts` — monotone playback path, bounded glass layers, reflective truss material, and travel subgroup within the existing blue corridor.
3. `scripts/test-goal-sequence.mjs` — cinematic-path monotonicity/clamping/C1 checks in addition to the existing asset-backed tests.
4. `scripts/validate-goal-sequence.mjs` — native-trigger no-input acceptance, input/pause/menu/resize/revisit/skip/reduced-motion/navigation checks, and additional impact/fragment/emergence probes.
5. `docs/validation/goal-autonomous-cinematic.md` — this report.

`AstronautEmergenceAssets.ts` is intentionally unchanged: its repaired skin/pose/asset pipeline is reused. `HomePageView`, `ContactCtaSection`, hero, navigation, cards, projects, archive, footer, design tokens, dependencies, environment, and secrets are unchanged. No reset, branch switch, commit, or push is part of this task. Changes are saved in the working tree; this follow-up has not been pushed to the already-open PR.

## Validation results

Completed checks:

- ESLint: zero errors; two existing warnings in unchanged `AboutPageView` / `LusionProjectDetailView`.
- TypeScript, production build/postbuild.
- Asset route tests: 18/18.
- Repository QA: 22 canonical routes, expected 404s, security checks, and 37/37 captured assets.
- Four unit-test groups: monotone path (30,000 samples and beat-velocity continuity), captured girder immutability/decoding, 53-bone pose/weights, and 946-piece glass frame/quaternion determinism.
- Desktop normal motion: native-trigger no-input completion; 764 sampled active records across all phases; final native position 40733 vs playhead 40733.44; wait progress 0.42; contact-link top 504 px in the 900 px viewport; one run, Lenis released. Actual SwiftShader wall time was 88.723 s, not 26 s.
- Desktop and 390 px normal-motion controls: wheel/touch/key protection, pause/resume, resize while paused, menu pause, replay, skip, live reduced-motion release, and explicit Contact navigation before activation and during playback.
- Desktop normal eleven-state forward/reverse regression, four handoffs, flash fade, native coalesced scroll, SPA teardown while playing, and astronaut/glass/WebGL failure isolation. Zero unexpected console/page errors and failed asset responses; WebGL NO_ERROR.

| Browser configuration | Result | Scope |
| --- | --- | --- |
| 1440×900, normal motion | PASS | Native-trigger no-input completion, all controls/contact navigation, 11 static/reverse states, four handoffs, flash, native fast scroll, teardown and three failure paths |
| 390×844, normal motion | PASS | Same autonomous/control/navigation/regression checks at the mobile viewport |
| 1440×900, reduced motion | PASS | No involuntary autoplay; 11 states and exact reverse canvas hashes, four handoffs, flash, fast scroll, teardown and failures |
| 390×844, reduced motion | PASS | Same reduced-motion checks and captures at the mobile viewport |

The reduced-motion visual suites preceded the final navigation-only follow-up; both normal-motion suites were rerun after that follow-up, including all eleven phase probes and Contact cancellation tests.

The final 390 px no-input run recorded 458 active sample records and completed in 52.056 s under SwiftShader. Native handoff was 38144 px versus playhead 38143.8, wait progress approximately 0.42, and the contact-link top was 464.7 px inside the 844 px viewport. Every configuration reported zero unexpected page/console errors and failed assets; every sampled GL error check was NO_ERROR. Sample records can repeat a rendered state; their count is **not an FPS measurement**.

Maximum ±1 CSS-pixel handoff-probe differences were 0.00013043 / 0.000002343 (astronaut / camera matrix elements) on desktop normal, and 0.00023404 / 0.00020818 on 390 px normal. These are continuity probes, not a whole-film perceptual smoothness benchmark.

Early-state telemetry was 10 draws / 200,057 triangles on desktop and 9 draws / 137,785 triangles on mobile. Reflection capture is setup-only; no dynamic cube render is charged per frame. These numbers do not establish a sustained frame rate or mobile thermal behavior.

Local visual inspection covered desktop early shaft, twist, blue flight, crack/impact, scattered fragments and emergence; mobile early shaft, blue flight and scattered fragments; and matched-size historical reference captures. The glass no longer uses a flat white material/surround. Nested surfaces and cyan edges are visible, the captured suit remains the focal object, and shards extend beyond the monitor in depth. Reference material richness and lattice fineness are still visibly different. Desktop/mobile screenshots live in the reduced-motion output folders; normal-motion acceptance used telemetry without screenshots/readPixels to avoid the known software-renderer capture stalls.

Reproduction commands:

```sh
npm run lint
npm run typecheck
npm run build
npm run test:assets
npm run qa
node scripts/test-goal-sequence.mjs
node scripts/validate-goal-sequence.mjs
GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
GOAL_MOTION=normal GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
GOAL_VIEWPORT_WIDTH=390 GOAL_MOTION=normal GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
```

Run browser suites serially; do not rebuild the server while they are running. Tests caught and led to repairs for an initially unwired corridor subgroup, too-brief crack development, synthetic input shape/target handling, and contact-button navigation. A test-only pointer/media-event settling issue was fixed by centering the pointer and waiting for the real preference handler before exact scrub comparisons, rather than weakening matrix equality.

Current artifacts are ignored under `temp/cinematic-validation/` and `temp/cinematic-*.log`. They are local validation output, not original-reference truth or Git assets.

## Remaining differences / unrun checks

- The six new screenshot classifications and red-marked glare verification require accessible image pixels.
- Captures still differ from the saved reference in lattice density/fineness, lighting, exact pose/root framing, and optical richness. This is not pixel-perfect parity or a claim of fully matching Lusion's renderer.
- Reflection is a one-time corridor environment snapshot, not a dynamic full-scene reflection pass. Source skinning remains Three.js LBS, not the original renderer's reported dual-quaternion implementation.
- SwiftShader validation does not establish sustained hardware-GPU frame rate, physical-device mobile performance, bloom/MSAA equivalence, or GPU-driver compatibility. Real background-tab suspension/restore on physical devices has not been independently exercised; the visibility handler is implemented and reviewed.
- Route/security/asset QA and unchanged source scope are checked; this is not a new pixel-by-pixel audit of every unrelated homepage section.
