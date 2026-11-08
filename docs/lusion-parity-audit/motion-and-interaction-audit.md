# Motion and interaction audit — baseline / incomplete

## Compatible DOM animation strategy

Inspected package.json, package-lock.json, installed package metadata, actual source imports and exported APIs. Locked and installed Framer Motion: **14.5.0**. `motion` is not installed; resolving `motion/react` fails. Current active imports use `framer-motion` in StudioShell, Preloader, PageTransitionCurtain, ShowreelModal and HomePageView.

**Decision:** retain the single installed `framer-motion` API for existing DOM motion. Its installed entry exports motion, AnimatePresence, MotionConfig, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring and useAnimate. Do not add `motion`, mix imports or migrate working components merely to copy ECC examples. This is an explicit compatibility adaptation to ECC motion-foundations' import-only rule, not a claim that rule was followed literally. The broader frontend-patterns skill itself still demonstrates framer-motion imports.

Treat the motion guidance in dependency order: foundations → patterns → advanced. All three entry documents were previously read fully and their bytes were verified identical to this task's master snapshot. No second DOM animation engine was introduced. New preview lifecycle work uses browser media APIs; About artwork changes retain existing authored card motion. Tokenization, cleanup, reduced motion and SSR continuity remain review criteria, not certified existing behavior.

## Established architecture from reviewed files

- StudioShell wraps the app in MotionConfig reducedMotion=user and SmoothScrollProvider. It mounts the shared HUD, cursor, showreel, preloader and PageTransitionCurtain.
- SmoothScrollProvider initializes Lenis and advances it from GSAP's ticker; Lenis scroll events update telemetry and ScrollTrigger. It removes the ticker callback/listeners and destroys Lenis on cleanup.
- Reduced motion selects native-scroll telemetry instead of Lenis. Menu/reel state pauses Lenis. Fragment-aware route reset preserves explicit anchors.
- TransitionProvider contains another shader/circular transition implementation, but reviewed StudioShell does **not** mount it. Its presence alone does not prove competing active transitions. Full reachability and route lifecycle review is still required; do not delete it speculatively.
- Renderer-owned camera/material/simulation updates must remain within the scene's lifecycle. ECC motion-advanced expressly excludes WebGL/game-loop animation; it is not a shader engineering guide.

## Meaning of existing checks

- `test:motion` runs numerical clock, spring, interpolation, optics and mocked GPU-query tests, plus numerous exact source-string assertions. It passed. Source strings are not rendered motion fidelity evidence.
- `validate:home-motion` exercises throw/release, reverse seeks, reel expansion, scene-phase telemetry, glass resources and modal behavior. Most expected values describe the current authored implementation; they are not independently measured Lusion curves.
- `validate:browser` covers Home plus five extra routes at two widths. It is not a complete 20-route/six-viewport audit. Its output path is now optionally configurable so a new run need not overwrite preserved phase-d evidence. All assertions remain unchanged.
- The new route-matrix harness checks initial route rendering only; its 120 records passed the shared saved-evidence checker. It intentionally does not claim animation start/middle/end, hover, modal, footer, reverse-scroll or touch-gesture coverage.

## Live and historical evidence

Six fresh live core-page attempts failed with ERR_CONNECTION_CLOSED. No current live timing, mouse response, audio, menu, newsletter or scroll interaction is certified. The earlier comparison report remains historical evidence at `docs/validation/comparison-audit-2026-11-07/`; its stills and supplied About video must not be relabeled as today's successful live sessions.

## Open investigations

- Match original and clone scroll/camera phases before comparing tunnel optics.
- Verify loader progress against actual asset readiness rather than elapsed-time assumptions.
- Exercise forward/reverse/fast input, resize, reentry, navigation, visibility and context restoration.
- Extend the passed LP-004 media lifecycle checks to all gallery variants and actual OS-background behavior.
- Verify focus containment/restoration, live preference changes and the shared master-mute/gesture state.
- Distinguish software rendering, injected visibility, emulated touch and physical hardware measurements.

No original animation durations, easing curves, FPS or performance parity values have been invented.

## Recorded gate outcomes

The original Home cancellation failure is retained. After the release-only activity-clock repair, the **unchanged full Home browser gate passes** at 1440. The existing broad browser gate passed earlier; its date/build scope remains in validation-report.md. Neither result proves original motion parity.

## Implemented release-clock repair

Full HeroCrossesStage and HomeConnectorPhysics source was read before changing it. The delivered cancel event cleared interaction and influencedPieces reached zero, but the activity envelope decayed using capped collision time: about 96 frames advanced during a 90-second trace, leaving energy 0.00003. Evidence: `data/implementation-01/cancellation-before.json`.

The repair passes raw elapsed frame time into physics and uses it **only for released/no-pointer activity decay**. Collision stepping still clamps at 50 ms and substeps at 1/120; held-input decay/gain remains the old behavior. The first broader all-input clock repair failed the unchanged hover test and was superseded, not hidden. No scheduler, renderer, camera, event deadline or existing browser assertion was changed.

`npm run test:motion` now includes the pointer regression: deltas from 1/240 through 2 seconds; finite/monotonic/exact-zero release; identical collision positions for a one-second versus capped-50ms frame; held-pointer energy equivalence. Full numerical suite and unchanged Home browser gate pass. Home report and hero renders are under `evidence/implementation-01/home-motion/`. This is functional correctness in the tested environment, not recovered original physics or hardware performance.

## Project preview lifecycle

ProjectPreviewVideo keeps SSR/poster continuity, assigns only the viewport-selected source when visible/playable, pauses for live reduced motion, offscreen, hidden document and open shared modal, and removes its observer/listeners on cleanup. No independent RAF or scroll controller was added. Actual desktop/mobile playback and Enter/Escape modal continuity pass in `project-preview-browser.json`; hidden-document code exists but real OS-background delivery was not exercised.

## Mobile client loop and reduced-motion continuity

Historical 390px reference shows roughly three marks across. The new mobile-only content-sized duplicate sets retain the existing CSS duration/direction and -50% seam. Actual normal→reduced→normal checks pass at 390/375/1440: equal normal duplicate widths, restored three-across mobile width, no document overflow, and no animation under reduced motion. Reduced mode uses a static three-column wrapping first copy so no frozen offscreen brands are lost. This is functional/reference-informed responsive work, not recovery of original loop timings.
