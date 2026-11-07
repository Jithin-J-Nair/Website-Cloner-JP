# Defect register — discovery in progress

This is the initial register of established findings, not a claim that the full-site visual audit is complete. No live visual parity scores are assigned while the source browser is inaccessible. All reviews are sequential in this environment; no subagent results are fabricated.

## LP-001 — Application validators traverse scratch and vendored examples

- Route: all routes / repository build pipeline.
- Section: build, TypeScript and ESLint boundaries.
- Category: functionality / developer validation.
- Original behaviour: not a live visual comparison; production builds must validate application code, not unrelated research examples.
- Clone/workspace behaviour: `npm run build` compiles then fails type checking on missing Remotion modules in two ignored ECC study copies. `npm run lint` traverses the isolated audit's generated Next.js bundles and upstream skill scripts: 5,409 errors and 25,456 warnings in the initial run.
- Difference: research-only resources contaminate application validation.
- Root cause: `tsconfig.json` includes every TS/TSX file and excludes only node_modules; ESLint global ignores omit scratch and read-only skill-library roots. Triggered by this session's preserved research material, not evidence that a clean 5051f5b checkout cannot build.
- Severity: P0 for this workspace's build gate (not a broken live page).
- Recommended skills: nextjs-turbopack, skill-host-compat; installed Next 16.4.3 TypeScript/ESLint documentation.
- Planned fix: exclude only `temp` and `skills` from application checks; retain src, tests, scripts, strict compiler options, enabled lint rules and build type checking. Add a boundary regression test before changing the configuration.
- Verification: demonstrate regression-test failure before the fix, passing boundary checks after, then rerun lint, typecheck and production build. Report remaining source warnings independently.
- Owner: orchestrator / repository QA.
- Status: **fixed and verified for workspace validation only**. Regression failed before the change and passes after; lint, typecheck and production build exit 0. Two existing source lint warnings remain. See data/after-tests.json and before/after logs.

## LP-002 — Live reference unreachable

- Route: `/`, `/about`, `/projects`; all other live routes remain unverified.
- Section: live reconnaissance and comparison matrix.
- Category: external verification blocker.
- Original behaviour: unknown in this environment; user reports 19 archive entries.
- Clone behaviour: captured manifest contains 20 routes / 17 project cards.
- Difference: current original behaviour cannot be compared or scored.
- Root cause: Chromium reports `net::ERR_CONNECTION_CLOSED` for all six core-route/viewport attempts. Sandbox outbound allowlist does not include lusion.co.
- Severity: P0 acceptance blocker, not a diagnosed Lusion outage.
- Recommended skills: browser-qa, frontend-design-direction.
- Planned fix: obtain permitted live-browser access or explicit authorization for a captured-reference-only implementation phase. Do not invent the Atlas Motion/Everswap destinations.
- Verification: actual successful source browser sessions and destination inspection.
- Owner: orchestrator / reference QA.
- Status: open.

## LP-003 — QA route-count claims are stale

- Route: all captured routes.
- Section: `scripts/qa-verify.mjs` report text.
- Category: validation/reporting correctness.
- Original behaviour: not a visual comparison.
- Clone behaviour: route iteration uses manifest entries dynamically, but header/comments/final success text say 22 routes; actual manifest has 20. Archive component comments also say 19 while rendering manifest's 17.
- Difference: stated coverage differs from actual checks/content.
- Root cause: hardcoded prose survived data updates.
- Severity: P2.
- Recommended skills: e2e-testing, browser-qa.
- Planned fix: derive report count from the actual manifest; correct comments without fabricating two routes or changing canonical data.
- Verification: output reflects actual route-loop length and preserves every assertion and negative-route check.
- Owner: repository QA.
- Status: **QA reporting fixed and verified**: rerun reports 20/20 from the actual manifest. No route/assertion was removed. The archive component's stale 19-card comment remains separately uncorrected; current live count is still unknown.

## LP-004 — Project background videos ignore mobile media source

- Route: captured project detail routes with differing desktop/mobile video sources.
- Section: `ProjectMediaCard` in `src/components/pages/LusionProjectDetailView.tsx`.
- Category: responsive / performance / accessibility investigation.
- Original behaviour: current live playback not observed; manifest defines desktop and mobile media separately.
- Clone behaviour: calculates `videoMobile` but background `<video src={videoDesktop}>` always selects desktop; modal receives both. Background videos also autoplay with preload auto without this component consulting reduced-motion/offscreen state.
- Difference: confirmed data-to-render inconsistency; live visual impact not yet measured.
- Root cause: background video source selection and lifecycle policy omitted from this component.
- Severity: P2 pending runtime/profile evidence.
- Recommended skills: react-patterns, react-performance, accessibility, frontend-a11y, react-testing.
- Planned fix: inspect all affected media/lifecycle code and actual browser behavior before proposing source-selection, reduced-motion and offscreen handling. No new dependency or invented media.
- Verification: matching mobile assets and observed playback lifecycle, keyboard/modal continuity, before/after browser evidence.
- Owner: responsive / motion review (sequential).
- Status: open.

## LP-005 — Browser gate output overwrites preserved phase-d evidence

- Route/section: repository browser validation artifacts.
- Category: evidence preservation, P2.
- Original: not a visual comparison; independent audit runs need independent outputs.
- Clone validator: always writes to docs/validation/phase-d, including screenshots/composites.
- Exact difference: new runs cannot preserve that output directory as an immutable previous checkpoint.
- Root cause: hardcoded OUT_DIR.
- Skill: e2e-testing, browser-qa.
- Surgical fix: optional LUSION_VALIDATION_OUT_DIR; default unchanged. No assertion, route, timeout, browser configuration, reference directory or pass/fail condition changed.
- Verification: run the existing npm validate:browser command with the dedicated output directory; inspect actual outcome and artifacts in validation-report.md. This entry records a harness repair, not a visual-parity repair.
- Status: **fixed and verified for evidence output**: validate:browser exits 0 and saves its captures/report under the explicit audit directory. No previous phase-d output was modified. See validation-report.md.

## LP-006 — Home pointer-cancel browser regression fails

- Route/section: `/`, HeroCrossesStage rapid pointer movement/cancellation.
- Category: functionality/motion regression, P1 pending diagnosis.
- Original: current live pointer behavior not observed; no exact source physics assumption.
- Clone: `npm run validate:home-motion` exits 1 after waiting 90 seconds at scripts/validate-home-motion.mjs:100 for data-offset-energy to equal zero following pointercancel. Earlier hover/throw/leave/recovery assertions completed. No console/asset error in the partial report.
- Exact difference: authored cancellation invariant does not complete in this software-rendered run.
- Root cause: **not established**. Reviewed handler clears active/velocity; full frame/input/physics investigation needed. Do not blame rendering performance without evidence.
- Skill/fix plan: react-patterns, motion-foundations, react-testing and separate 3D lifecycle inspection; reproduce with telemetry before a surgical change. Keep the exact assertion and deadline.
- Verification: unchanged cancellation scenario plus hover/throw/recovery, native pointer, reentry and reduced-motion paths; source parity separately measured when accessible.
- Evidence: data/home-motion-validation.log, data/home-motion-report.json.
- Status: open; not hidden by passing numerical tests/build.

## LP-007 — About portrait test targets former source structure

- Route/section: `/about`, team geometry test.
- Category: test/implementation alignment, P2.
- Original: current live geometry/tier behavior unverified. User authorized original source-team assets; do not restore procedural substitutes just to pass a test.
- Clone: deterministic procedural-geometry numerical checks complete, then test-about-portrait.mjs:61 fails a source-string assertion requiring `tier === "medium" ? 16384 : 24576` in AboutPageView. Current view imports createAboutSourceTeam.
- Exact difference: old procedural-source assertion is not present in the source-team implementation.
- Root cause: test expectation still describes former implementation; current team asset/LOD requirements need their own review and behavior coverage.
- Skill/fix plan: react-testing, e2e-testing; inspect full current pipeline, preserve meaningful pure-geometry checks, add actual source-team asset/quality/lifecycle tests instead of weakening them or reverting approved assets.
- Verification: real source asset decode/point counts, fallbacks, team navigation and matched imagery; not source regex alone.
- Evidence: data/about-portrait-test.log. Existing test left unchanged.
- Status: open.

## LP-008 — Asset test expects an unverified Atlas Motion fallback

- Route/section: internal `/assets/projects/atlas_motion/home.webp` test fixture; this is **not** an established project-page URL.
- Category: test/catalog alignment investigation, P2.
- Original: Atlas Motion live destination remains unknown.
- Clone: test:assets passes 17 checks and fails one because this path returns 404, not its expected synthesized 200 SVG. Traversal, symlink, commercial-font, range and HEAD assertions pass.
- Exact difference: legacy synthesized-card expectation does not match current asset delivery/catalog.
- Root cause: provisional obsolete test/catalog assumption; inspect canonical allowlist/fallback chain before changing behavior.
- Skill/fix plan: e2e-testing, react-testing, repo inspection. Test security on a verified approved fallback separately from unknown-ID rejection. Do not invent an asset, a route or an allowance merely to make this expectation pass.
- Verification: retain traversal, MIME/CSP/nosniff, byte-range and font-blocking assertions; establish expected fallback identity with current canonical/live data.
- Evidence: data/assets-test.log, additional-tests.json.
- Status: open; tests unchanged.
