# About reconstruction specification — 2026-10-29

## Baseline and evidence (before implementation)
Clean active branch `arena/95a11883-website-cloner-jp` was fast-forwarded from stale `8e7875f` to merged `0812b2b` (PR13). No user edits existed or were discarded. The About route is `src/app/about/page.tsx` → `src/components/pages/AboutPageView.tsx` (1711 lines), already a native Three.js sticky world, not a missing/static page. Homepage and journey source will remain unchanged.

Fresh actual Chromium attempts: `/about/` and `/` at 1440×900 and 390×900 all failed `ERR_CONNECTION_CLOSED`; see `temp/about-audit/reference.json`. No current live scrolling/hover/audio observation is claimed. No new supplied video attachment was present in the workspace. Existing local `reference/side-by-side/09_about_plume_wordmark.jpg` (official left half at recorded t47), `10_about_terrain.jpg` (t53), and phase-H reference desktop hero/details/team and mobile valley captures were actually opened. These are historical visual evidence, not current live behavior. The composites show a solid monumental wordmark and dense silvery plume over detailed terrain; phase-H stills show a deformed/outlined wordmark, black negative space, narrative at upper-left/lower-right and team ruler/contours. Their typography variants cannot be treated as identical current states. Frame-by-frame supplied-video comparison is NOT VERIFIED.

Ground truth inspected: `src/data/reference/lusion-ground-truth.json` (capture date 2026-09-23). This is supporting historical content/layout evidence, not licensing permission or physical simulation proof. `docs/sections/about-team.md` contains unrelated invented KINETA names; it is NOT authoritative and those names will not be used.

## Ordered full-page map
1. `about-who`: existing desktop `100vh + 950vw`, mobile `1225vh` sticky cinematic scroll field. Hero plume/wordmark; camera pullback to lunar terrain/explorer; manifesto; narrative; team selection. Existing source units (desktop width/mobile height) retained as local choreography, not claimed measured current reference timing.
2. `about-clients`: black editorial heading and logo grid, existing ground-truth brands.
3. `about-award`: black recognition ledger, 58 awards; 3 article links and 5 dated talks, existing content retained.
4. `about-capability`: blue expertise band, four Strategy/Creative/Tech/Production cards and selectors.
5. `end-section`: existing interactive geometric contact tank.
6. `footer-section`, then `scroll-nav-section`: contact/social/newsletter, next Projects portal.

Use existing local font setup and CSS tokens (#000, #f0f1fa, #1a2ffb, responsive grid gutters). Preserve original section order/content and usable keyboard controls. Do not add fake awards/people/statistics.

## Gap analysis and intended work
- Existing 6400 identical-shell icospheres look like an orbiting ball rather than the observed multi-scale plume. Keep real instanced 3D shading, add coherent GPU procedural filament flow and depth-varied sizes; no FLIP/Navier-Stokes claim. No fluid solver framework is justified by still images alone.
- Pointer coordinates jump immediately; strength decays per frame, causing refresh-rate-dependent response. Add elapsed-time damping, bounded pointer, exit/cancel release and touch-safe behavior.
- No context-loss/recovery handling, reduced mode still loops continuously, offscreen wakeups and DPR unbounded relative to existing pixel budget. Add explicit lifecycle, event-driven reduced rendering, quality tiers and read-only measurable telemetry. Do not touch the astronaut renderer/clock.
- Portrait selection issues two proprietary `.buf` fetch paths, including asynchronous initial geometry race. Remove these unauthorized model requests; use original deterministic geometry, explicitly not an authentic likeness. Preserve verified team names/roles. Authentic face fidelity remains a gap without licensed source material.
- Fallback is an empty background and leaves a 14,000px inert sticky track. Provide real readable fallback content and normal document flow, with explicit retry on restored context.
- Global scene cleanup leaves inspector/refs stale. Own/delete only this scene's resources and inspector; navigation/remount must not leak canvases/RAF.
- Existing expertise cards have click but no pointer-tilt/recovery; implement bounded original hover/focus treatment, explicitly inferred (live interaction unavailable), not a claimed reference observation.
- Audio signal generation passes old tap tests but reported physical silence remains open. Inspect actual destination connection and real UI path. Confirmed accessibility gap: ≤812px hides the direct sound button. Investigate launcher mute flags separately; a test-bus recording is not physical speaker proof. Do not blindly boost levels or add another engine.

## Interaction and responsive policy
Verified historical stills: team index/name, forward circular arrow, mobile swipe hint; editorial links, expertise selectors, persistent header. Durations, pointer forces, hover easing, mobile orientation/sensor behavior are unknown. Reuse existing controls and original 180–350ms bounded motion where needed, label inference. No sensor permissions, new scroll hijacking or touchmove prevention. Horizontal team swipe must reject vertical drags and cancel safely. Keyboard selection mirrors click; reduced motion avoids autonomous flow/tilt. Resizing recalculates from native scroll, reverse/reentry recomputes the same DOM/3D coordinates (no second page timeline).

## Verification plan
Fresh original baseline check/build and default cinematic 1440/390 gates before edits. Before/after About milestones at equal viewport/unit values, full-page section screenshots, hover/keyboard/touch, reverse/resize, reduced motion, context loss/restore/unavailable, portal/navigation/remount and draw/resource telemetry. Run unchanged unit/browser journey gates afterwards; preserve red baseline failures. Real Web Audio destination topology + real UI gestures/status/master/filter/source routing recorded independently of physical audibility, which remains NOT VERIFIED if no physical output access. No physical GPU/FPS claim from SwiftShader.
