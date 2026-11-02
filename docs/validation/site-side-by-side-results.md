# Whole-site comparison and targeted repairs

Date: 2026-11-03. Branch: `arena/95a11883-website-cloner-jp`.

## Status — improved, not an exact clone

This pass implements visible Home corrections and audits the rendered Home/About journeys, Projects archive and Contact redirect. It does **not** establish that every detail matches the current Lusion site. Both fresh official browser navigations failed with `net::ERR_CONNECTION_CLOSED`; [the actual failures are saved](site-side-by-side/source-access.json). The supplied Dropbox recording remains unviewed. No recording frames or live-source motion observations are claimed.

The source evidence is the official **left half** of the twelve historical comparison files in `reference/side-by-side/`. Their old right halves are **not** treated as the current clone. Source viewport, camera time and input state are unknown. Comparisons contain the entire official half, including its historical label/gutter, and letterbox rather than distort it. These are composition comparisons, not synchronized pixel-diff measurements.

## Implemented corrections

1. **Home opening hierarchy:** raised/enlarged the desktop headline and restored its three observed word groups: “We create 3D visual storytelling / and interactive web experiences / that help brands stand out.” Preserved the word-reveal owner; mobile still flows naturally.
2. **Hero composition:** moved the original desktop connector rest poses out of the dense central pile and toward cropped frame edges, leaving an open centre. Kept portrait anchors, geometry loading/fallback, pointer springs, keyboard palette cycling, sleep/wake and disposal. Rest coordinates are authored approximations, not recovered source physics.
3. **Hero finish:** softened clearcoat and environment response to reduce the previous sharp, blown-out reflections. This is an original satin-plastic treatment, not a recovered production material.
4. **Tablet editorial scale:** increased desktop tablet slot from 46% to 57% of its inner row, removed the copy column's extra right margin, and increased desktop paragraph size. The existing world/camera measurement reads that slot; there is no second tablet position/timeline owner. Mobile layout rules are retained.
5. **Lens containment:** included the screen-space chromatic lens material in the existing tablet aperture stencil list. Before release it no longer bleaches the editorial page outside the screen. It still releases into open space at the existing shared progress threshold; the effect, visor lighting and orbital lighting were not globally disabled.
6. **Emergence title:** enlarged the title and capped additional inter-word spread, retaining the existing scale/spread/occlusion playhead. The short middle line no longer stretches into disconnected labels. Font-dependent gap measurement now reads the actual computed type size instead of duplicating a stale CSS font constant. Late-stage amplitudes are authored and not claimed to be observed source motion.

7. **Contact fragment navigation:** the rendered audit caught a real navigation bug: `/contact` redirected to `/#footer-section`, but the shared route-commit effect immediately reset native scroll to zero while the fixed scene retained the footer coordinate. The existing route-reset effect now honors a valid fragment target, updates actual scroll telemetry, and still resets ordinary routes to zero. Malformed fragments safely fall back to ordinary route behavior. No new scrolling engine or animation owner was added.

8. **Tablet hero fit:** the final screenshot review caught a new edge-case in the scattered arrangement: a 768 px tablet stage used desktop anchors, placing most pieces outside the frame. One shared stage-aspect boundary now selects the existing portrait camera, anchors and scale consistently at initialization, resize and sampling. Desktop 1440 and phone 390 retain their respective arrangements. This threshold is an authored responsive-fit decision, not a claimed Lusion breakpoint. [Intermediate/final tablet fit](site-side-by-side/tablet-fit-before-after.jpg).

## Scene-by-scene findings

| Region | Evidence / result | Remaining gap |
|---|---|---|
| Hero | Historical source, fresh before and final captures; composition, headline and material corrected | Exact connector count visible at a given instant, rest orientations, background tone, source simulation and current pointer behavior remain unmatched/unobserved |
| Reel introduction / stage | Fresh local captures at all three widths; historical red-phone card inspected | Source/local video frames are not synchronized. The source still lacks the clone's large Play/Reel labels; exact reveal/hover timing is unverified and was not guessed away |
| Featured work | Fresh local captures and archive navigation | No corresponding current official visual capture; crops/reveal parity not certified |
| Tablet / Earth | Historical source and fresh before/final; scale, body copy and lens containment corrected | Suit likeness/pose, Earth shading and exact source camera are not matched |
| Emergence title | Historical source and before/final; type hierarchy/readable grouping corrected | Source pose/orientation and transition timing differ or are unverified |
| Dark shaft | Historical source and fresh local static state | Metallic glints, bay silhouette and depth distribution still differ; no new restricted model was enabled |
| Pink vortex | Historical source and fresh local static state | Source is denser/brighter; local structure and lighting are still visibly different |
| Blue corridor | Historical source and fresh local static state | Pattern scale, camera bank, architecture and astronaut pose differ; no source-live timing claim |
| Monitor / shards | Historical source and fresh local static state | Unsynchronized impact phase, shard richness, suit pose and monitor framing remain different |
| About opening / basin | Fresh twelve-state desktop/tablet/mobile recapture of the prior repaired implementation; historical source inspected | Original volume/terrain and permitted NASA figure are approximations, not source geometry/materials/likeness |
| Narrative / team / clients / recognition | Fresh local captures, including reverse; no new content/assets | Current official composition/motion unobserved. Abstract team geometry is not an employee likeness |
| Expertise backs/fronts | Both actual historical card states compared with fresh local states | Back ornament, graphic proportions, flip axis/timing/hover/mobile parity not exact/certified |
| CTA / footer | Fresh local captures on Home and About | Historical file 12 is **expertise fronts**, not CTA evidence. Exact official CTA motion is still unobserved |
| Projects / project routes | Fresh archive screenshots and local route QA | Current official project-detail visuals not available for parity |
| Contact / Labs | Contact footer fragment/reset conflict repaired; Labs remains an intentional external redirect | Labs media/site was not imported; outbound target not browser-inspected |

## Files and architecture

- `src/components/home/HomePageView.tsx`: desktop headline layout/line grouping only.
- `src/components/home/HeroCrossesStage.tsx`: original desktop rest arrangement and material response; no new clocks, assets or scene system.
- `src/components/home/GoalTunnelSection.tsx`: measured tablet/editorial layout, title readability and existing aperture-mask membership. Existing autonomous progress, camera, rig, poses, shared audio owner, controls and route cleanup retained.
- `src/components/foundation/SmoothScrollProvider.tsx`: existing route-commit reset respects explicit fragments instead of overwriting them with zero; unchanged Lenis/GSAP ownership.
- `scripts/validate-route-fragments.mjs`: direct Contact/footer, no unexpected autoplay, real menu Contact, ordinary-route top reset and real logo navigation at desktop/tablet/mobile plus reduced motion.
- `scripts/capture-site-repair.mjs`: normal-motion static-seek captures with per-viewport console/overflow reports; distinguishes explicit inspector state capture from actual autoplay acceptance. Labs is verified by a manual-redirect HTTP assertion, not followed as if it were a local page.
- `scripts/build-site-repair-evidence.mjs`: preserves complete source halves, labels the evidence limits, creates comparison/journey images and hashes.
- `scripts/validate-home-motion.mjs`: pointer coordinate now hits the visible right-hand connector rather than the newly empty centre. Existing displacement threshold, full restitution, rapid cancellation, reverse and sleep assertions are unchanged. The harness now uses the already-existing shared browser launcher, allowing multiprocess mode after the legacy single-process Chromium shell crashed at startup; application scheduling and assertions are untouched. This is a target relocation, not a weakened pass condition.

About, header/footer/audio components, camera/pose tables, CSS tokens, dependencies, asset routes and licensing gates are unchanged. The shared scrolling provider has only the targeted fragment/reset correction above. No additional source model/team asset was enabled. No production deployment or PR merge is authorized or performed.

## Evidence

Main visual proof: [historical source / actual before / actual after](site-side-by-side/home-before-after.jpg).

Twelve individual historical-source/current-local comparisons: `site-side-by-side/01-comparison.jpg` through `12-comparison.jpg` (source viewport and motion phase unknown).

Full local journeys: [Home desktop](site-side-by-side/home-1440.jpg), [Home tablet](site-side-by-side/home-768.jpg), [Home phone](site-side-by-side/home-390.jpg), [About desktop](site-side-by-side/about-1440.jpg), [About tablet](site-side-by-side/about-768.jpg), [About phone](site-side-by-side/about-390.jpg).

Static-seek captures cancel local autoplay through the existing inspector and are **not recordings of the autonomous movie**. The normal-motion autonomous regression is a separate test. About captures were taken before the final Home satin/lens and fragment-reset changes; the About source was unchanged throughout. Individual reports retain their captured build identity where available; the manifest identifies the final served Home build.

## Validation

- ESLint: PASS, zero errors; one pre-existing unused `highlight` warning in `LusionProjectDetailView.tsx`.
- TypeScript: PASS.
- Production build/postbuild: PASS; latest production server restarted on `0.0.0.0:3000`.
- Motion/unit regressions: PASS (clock, spring restitution, resolution budget, GPU timing, optical occlusion; playback mapping, captured girder/DQ/glass determinism).
- About browser recheck: PASS at 1440×900, 768×900 and 390×844: 12 states per width, reverse, actual permitted NASA model, header clearance, no overflow/errors/restricted About model requests, intentional model-unavailable fallback.
- Home capture: 15 actual states at each of 1440×900, 768×900 and 390×844; no page/console errors or horizontal overflow. Post-fragment-fix refresh is recorded separately.
- Hero/scroll browser regression: desktop PASS (real connector displacement, full restitution, rapid cancellation, settled-frame sleep, reversible reel/featured transforms, solar WebGL NO_ERROR). Mobile touch/native-scroll regression also PASS before the final fragment correction; post-correction results are appended below.
- Reduced-motion Goal regression: PASS before the final fragment correction: 11 states, exact reverse captures, four handoffs, WebGL/assets, SPA cleanup and failure isolation. This does **not** replace normal-motion acceptance.
- **Normal-motion autonomous regression: FAIL** at `all intermediate stages visibly play`. It completed in 23.943 s, with 148 sampled active records: shaft 37, blue-flight 25, glass interval **0**. Thus glass progression was not sampled as required. Maximum reported CPU render-call cost was 1323.8 ms; that timing is not GPU/presentation FPS. The log/report are preserved; no clock cap, sampling condition or assertion was changed. Subsequent normal-motion controls/lifecycle assertions did not execute after this failure. Root cause and whether the visual changes affect this pre-existing software-renderer sensitivity are not established.
- Local QA: PASS 22 canonical routes plus expected 404s and 50/50 delivered asset bodies; asset security/range suite PASS 18/18.
- See `site-side-by-side/final-checks.log`, `remaining-checks.log`, `route-assets.log`, `autonomous-failure-summary.json` and the retained full failure report. Final Contact/rendered results are appended below.

Reproduction:

```sh
npm run lint && npm run typecheck && npm run build
npm run start
CHROMIUM_MULTIPROCESS=1 SITE_REPAIR_OUT=temp/side-by-side-repair/final node scripts/capture-site-repair.mjs
CHROMIUM_MULTIPROCESS=1 ABOUT_RECHECK_OUT=temp/side-by-side-repair/about node scripts/validate-about-visual-recheck.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-route-fragments.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-home-motion.mjs
GOAL_MOTION=normal GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
npm run test:motion && node scripts/test-goal-sequence.mjs
npm run qa && npm run test:assets
node scripts/build-site-repair-evidence.mjs
```

Approach consulted: repository clone/inspection skill, installed Next client-boundary guide, Taste's screenshot critique, Scroll Craft's depth/continuity guidance and Emil's motion-review standards. This was a comparison/repair pass, not a fresh generic redesign or a claim that these frameworks recovered private production techniques.

No 60 Hz, physical phone/GPU, real touch hardware, audible-speaker or OS-background certification. Software browser draws and passing tests do not establish perceptual/source fidelity. Full current-site parity remains unresolved, for the concrete reasons in the matrix above.

## Final served revision and outcome

Final production build: **`sTlDrOA_lUUidHuOuUQMm`**, restarted on port 3000 after the Contact fragment and tablet-fit repairs.

- Final Contact regression: **PASS** at 1440/768/390 normal motion and 390 reduced motion: real cold redirect lands on footer with zero cinematic runs; real menu Contact and logo navigation work; ordinary Projects entry resets to top. Direct desktop footer top was 0.25 CSS px, native scroll 42130 (previously 0 with a stale fixed astronaut overlay).
- Final Home captures: **PASS**, 15 states per width / 45 total, all from the final build, no page/console errors or horizontal overflow. Contact screenshots now contain the actual footer. [Contact before/after](site-side-by-side/contact-before-after.jpg).
- Final desktop Home-motion and phone touch/native-scroll regressions: **PASS**, including zero unexpected errors and solar WebGL NO_ERROR.
- Final route and asset-security reruns: **PASS**, 22 canonical routes plus expected 404s, 50 delivered asset bodies, 18/18 security/range tests.
- Final lint/typecheck/build: **PASS**, with the same one pre-existing lint warning.
- **Normal autonomous acceptance remains unresolved.** The retained failing run preceded the final fragment and hero tablet-fit corrections. It was not rerun or marked fixed by the subsequent static, input or reduced-motion passes; no movie clock, phase mapping, GPU budget or assertion was changed to conceal it.

PR #14 remains **open and draft**, on the same working branch. No merge or production publication. The task is a documented partial repair, not a declaration that all source visuals and animation effects are now identical.

### Final responsive follow-up

The tablet-fit revision was rebuilt and restarted, then **all 45 Home state captures were refreshed again** at the final served build. The narrow tablet stage now visibly contains the original portrait connector arrangement instead of an almost-empty crop. Each Home report records its build ID.

The subsequent legacy single-process Home-test launch crashed with SIGSEGV **before creating a page** (`final-responsive.log`). Its unchanged assertions were rerun through the existing shared launcher with `CHROMIUM_MULTIPROCESS=1`: **PASS desktop 1440, tablet touch 768×900, and phone touch 390×844** (`interaction-recheck.log` and individual JSONs), including reversible reel/featured states, native touch scrolling, no latched mouse hover, solar projection/FOV response and WebGL NO_ERROR, and the actual reel modal/Escape workflow. Desktop additionally verifies visible connector repulsion, exact full restitution/cancellation and idle render sleep. This harness correction does not clear or replace the separately retained normal autonomous glass-phase failure.

The final route/asset rerun also passed again: 22 canonical routes, expected 404s, 50 asset bodies and 18/18 asset-security/range checks. No source changes followed the served build; only test-launch plumbing and the evidence/report were completed afterward.
