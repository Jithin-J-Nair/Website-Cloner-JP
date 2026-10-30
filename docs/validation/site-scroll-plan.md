# Skill-driven site-wide motion pass — 2026-10-30

## Reference research / scope

Continue HEAD `59b1b50` on the existing branch; do not overwrite the reconstruction or merge PR14. The user requests the About reference and scroll polish across the whole website, including Home. An exact current visual/timing match is not established. Fresh text retrieval of https://lusion.co/about succeeds (studio/team, brands, 58 awards, 3 articles, 5 talks, expertise, contact, Projects continuation). Text is not temporal visual evidence. The supplied >100 MiB Drive recording remains unviewed. Existing historical reference captures are labeled historical.

Studied the requested repositories, not merely their names:

- scroll-craft `75d81f74e83692add18cd7a8a8e078b8a887a579`: SKILL, hero-depth, approved-collection, verification, device kit, engine conventions. Use independently moving depth planes, grounded subject/contact, semantic readable content, native-touch/reduced fallbacks, offscreen suspension, and evidence at intermediate scroll positions. Keep the existing Lenis/GSAP clock instead of installing a competing runtime.
- taste-skill `12af471f627f866411b4bd785b19646d3672784c`: SKILL and screenshot critique. Keep the client's reference identity, inspect production renders, fix visible hierarchy/spacing failures, distinguish real assets from substitutes. Its random art-direction recipes and aesthetic bans do NOT override this explicit reconstruction brief.
- Emil Kowalski skills `a81dbca07f2217b7103e510c0f13f8d5b017afc9`: animate, animation-performance, improve/review-animations. Prefer direct transform/opacity writes, avoid inherited animated CSS variables, layout animation and shorthand Motion transforms under load; gate pointer/reduced behavior and make motion interruptible.

Read AGENTS and installed Next use-client documentation. No new runtime dependency or proprietary reference asset planned. Scrollcraft doctor: Node/Playwright/workspace pass; full ffmpeg unavailable, installed desktop Chrome unavailable, optional image-generation key absent. No generated video/image pipeline is needed; use the repository's bundled Chromium/SwiftShader for explicitly software-only browser evidence. Do not call that real-Chrome media or physical GPU certification.

## Current implementation audit

- Home already has an event-coalesced, resize-cached scroll sampler. However project transforms are driven by inherited variables on whole link subtrees; reel word/radius variables also inherit; the reel's per-frame columnGap causes layout. Hero entrances use Motion y/rotate shorthands during WebGL initialization.
- Shared cursor's 0.2/frame interpolation changes feel with refresh rate. Shape transitions animate width/height/padding. Hidden-document work is not explicitly cancelled.
- Shared scroll provider recreates Lenis on motion preference changes, but its overlay pause effect doesn't rerun. Native reduced telemetry isn't initialized immediately.
- About's header reads three rects on every scroll event rather than caching bounds and coalescing work. Its Three scheduler already owns lifecycle correctly; leave it alone.
- The plume evaluates its analytical trajectory for each vertex of every 80-triangle grain. Before editing, run the unchanged isolated software budget script. Candidate: 2-triangle instanced analytic sphere impostors, with actual curved normals and projected surface depth, same world positions, count, seed, uniforms, lighting and lifecycle. This is a GPU analytic rendering optimization, not a screenshot, video, CSS substitute, fluid solver, or production-model claim. Inspect the result and retain only if shaders compile and composition remains intact.

## Implementation contract

1. Preserve Home journey authoritative timing, camera, poses, stage transitions and audio. Preserve all About content, routes, native touch, selection semantics and independent ownership.
2. Home: cache exact transform targets; write their full transforms directly; replace reel gap changes with equal/opposite word translations at the same visual positions; write the rounded viewport's radius directly. Use full transform strings for the existing hero stagger, without changing timings.
3. Shared cursor: elapsed-time damping matching the current 60 Hz response; fixed-size moving anchor and independently scaled/opacity-faded skins; cancel on hidden/exit, snap on reentry. Preserve pointer telemetry.
4. Shared scroll: initialize native telemetry, include reduced-motion recreation in overlay synchronization, explicitly clear route scrollY. No second smoother or altered Lenis duration/easing.
5. About: one pending header frame, geometry cached on resize/content reflow/font readiness, full cleanup. Optimize the plume geometry as above, with additional invariant tests for bounded geometry and curved depth.

## Validation / delivery

Preserve unchanged baseline software budget results separately. Run lint/typecheck/build, existing units, asset/QA checks, full About lifecycle and Home regressions, route portals, and new targeted browser checks for direct transforms, stable reel layout, overlay preference toggles and shared cursor behavior at 1440/768/390. Inspect final intermediate-state screenshots rather than treating successful assertions as visual acceptance. Rerun the exact unchanged budget script after editing, without concurrent workloads, and compare like-for-like counts/buffers. Report residual frame-budget failures honestly. Physical GPU/display/touch/speakers and exact live fidelity remain NOT VERIFIED unless actually observed. Audio is unchanged/unresolved.
