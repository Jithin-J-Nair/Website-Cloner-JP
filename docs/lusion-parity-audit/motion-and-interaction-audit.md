# Motion and interaction audit — baseline / incomplete

## Compatible DOM animation strategy

Inspected package.json, package-lock.json, installed package metadata, actual source imports and exported APIs. Locked and installed Framer Motion: **14.5.0**. `motion` is not installed; resolving `motion/react` fails. Current active imports use `framer-motion` in StudioShell, Preloader, PageTransitionCurtain, ShowreelModal and HomePageView.

**Decision:** retain the single installed `framer-motion` API for existing DOM motion. Its installed entry exports motion, AnimatePresence, MotionConfig, useReducedMotion, useScroll, useTransform, useMotionValue, useSpring and useAnimate. Do not add `motion`, mix imports or migrate working components merely to copy ECC examples. This is an explicit compatibility adaptation to ECC motion-foundations' import-only rule, not a claim that rule was followed literally. The broader frontend-patterns skill itself still demonstrates framer-motion imports.

Treat the motion guidance in dependency order: foundations → patterns → advanced. All three entry documents were previously read fully and their bytes were verified identical to this task's master snapshot. No new DOM animation implementation has been applied in this checkpoint. Tokenization, cleanup, reduced motion and SSR continuity remain review criteria, not certified existing behavior.

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
- Inspect project background videos' desktop/mobile selection, offscreen pausing and reduced motion (LP-004).
- Verify focus containment/restoration, live preference changes and the shared master-mute/gesture state.
- Distinguish software rendering, injected visibility, emulated touch and physical hardware measurements.

No original animation durations, easing curves, FPS or performance parity values have been invented.

## Recorded gate outcomes

Home-motion fails on pointer cancellation (LP-006). Existing browser gate passes both viewport runs with zero console/page/HTTP errors and a passing desktop showreel keyboard focus test. This is evidence of that specific behavior, not live motion parity. See validation-report.md and raw JSON/logs.
