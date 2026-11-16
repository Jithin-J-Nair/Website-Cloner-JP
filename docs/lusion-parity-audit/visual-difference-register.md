# Defect register — discovery in progress

This is the initial register of established findings, not a claim that the full-site visual audit is complete. No live visual parity scores are assigned while the source browser is inaccessible. All reviews are sequential in this environment; no subagent results are fabricated.

## Latest status (supersedes discovery-time statuses below)

| ID | Current status and evidence |
| --- | --- |
| LP-001 / 003 / 005 | Validator boundaries, truthful route count and independent browser output fixed/verified in prior commits. |
| LP-002 | Current-live verification blocked; captured implementation explicitly authorized and ongoing. |
| LP-004 | Implemented and browser-verified desktop/mobile playback, live reduced motion, keyboard modal and offscreen pause. OS-background not exercised. |
| LP-006 | Reproduced activity-clock root cause; release-only fix; expanded numerical checks and **unchanged full Home browser gate PASS**. First failed repair retained. |
| LP-007 | Stale procedural-source assertion corrected; original source-team test unchanged; extra lifecycle suite; About suite PASS. |
| LP-008 | Unknown Atlas/Everswap reject; verified canonical fallback still tested; all 20 asset/security tests PASS. No invented allowance/route. |
| LP-009 | Actual 15 SVGs restored; all 32 copies decoded and full settled 1920 wall inspected. Six-viewport settled follow-up remains separate from initial 120-state gate. |
| LP-010 | Source-derived back ink restored; normal 1920 back-facing render inspected. Outer frame lost with blue-background removal: inset frame restored and normal back-facing render rechecked. Original fan/flip remains untouched; exact source pose unverified. |
| LP-011 / 012 | Reference-informed SVG marks and clipped full-width separators implemented; six-size normal capture/structure checks pass; sampled renders inspected. |
| LP-013 | Historical mobile reference inspected; actual 72px-vs-130px RED; three-across CSS and all-content reduced-motion grid implemented; 390/375/1440 preference-cycle browser test PASS; six-size settled follow-up PASS. |
| LP-014 | Two missing gallery text panels restored. All 17 rendered SSR content/order checks PASS; four real browser text renders PASS. |

The entries below retain discovery evidence and the original plans/failures. “Open” in those historical paragraphs is not the latest regression verdict.

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
- Follow-up isolation: full HomeConnectorPhysics source reviewed. New test-home-pointer-decay.mjs passes at frame deltas 1/240, 1/120, 1/60 and 1/20: seeded maximum energy reaches zero after 4.8 **simulated** seconds without a pointer ray. This does not reproduce DOM cancellation or certify wall-clock recovery. Actual event/ray state and rendered-frame progress still need tracing; no physics/scheduler change was made.

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

## Captured-reference implementation authorization / batch 01

The user now authorizes implementation from captured evidence; the earlier live-only restriction is superseded. Preserve existing checkpoints. LP-006–008 remain the first fixes. Additional evidence-backed work planned before edits:

- LP-009: About client wall uses text instead of the 15 verified bundled SVG logos. Source recording 15.50s / historical E05; canonical manifest already supplies logo sources. Restore those assets and the recorded Coca-Cola European Partners accessible label; do not rewrite the frozen capture. P1, frontend-patterns/accessibility, verify rendered assets, loading, duplicated-copy semantics and screenshots.
- LP-010: About playing-card backs use replacement SVG ornaments despite a verified bundled back.png matching recording 24.50s / E08. Restore actual linework, retain existing fan/flip/camera progression, verify back-facing screenshots and controls. P1, frontend-patterns/browser-qa; no invented motion curve.
- LP-004 implementation plan: use one responsive background-video source, viewport/visibility/reduced-motion aware playback, preserve modal keyboard behavior and explicit still fallback. Verify source/play/pause and mobile before/after.

These entries are planned implementations, not preemptive verified fixes.

### LP-006 reproduced root cause / planned repair

Actual pointercancel bubbles to the expected element; subsequent influencedPieces is 0. In 90 seconds the trace records roughly 96 further frames and energy remains 0.00003. The indicator is decayed only by the capped 1/120 collision substeps, so long real frames lengthen its apparent release indefinitely. Preserve the collision accumulator cap and all renderer scheduling. Decay only the input-activity envelope using elapsed input time, separately from bounded collision integration. Add low-frame-rate numerical cases before repair, keep the existing 90-second browser assertion, then rerun it unchanged. Trace: data/implementation-01/cancellation-before.json.

## LP-011 — Recognition marks vary with platform font glyphs

AboutRecognition uses Unicode asterisk/star/grid characters. Supplied recording / historical E06–E07 show an eight-lobed rounded award rosette, a concave four-point article mark and a 3×3 circular-dot talk mark. Magnified captured crops were inspected. P2, frontend-design-direction/frontend-patterns. Plan: deterministic inline SVG reproducing these observed categories/shapes; totals/data unchanged; no animation or external font. Verify rendered marks against recorded frames; no pixel-perfect vector claim.

## LP-012 — Award separators stop at the right-hand data column

AboutPageStyles applies a border only to right-column award groups. E06 shows full-bleed horizontal group separators across the left outline word as well. P2, design-system audit mode. Plan: clipped, full-width pseudo-element rules while preserving the table grid, text and row timing. Verify full-width lines, clipping and no horizontal overflow at all six sizes.

### LP-010 follow-up — preserve the card's outer frame

Normal back-facing rendered evidence exposed an omission not visible in reduced-motion front-facing screenshots: removing baked blue from back.png blends its outer blue silhouette into the stage, while the previous SVG and captured reference have a white outer rounded frame. The native inner linework is correct. Root cause: derivative intentionally retains white ink but removes the blue silhouette; wrapper lacked the previous outer stroke. Surgical plan: route-owned inset white frame on the existing rounded back face, without altering dimensions, art, fan, flip, camera or controls. Verify all four outer frames in settled normal back-facing renders; exact pose/source-phase remains separately unverified.

## LP-013 — Mobile client wall compresses the marks into five/six columns

- Route/section: `/about`, mobile client wall at 390×844 / 375×812.
- Category/severity: responsive artwork scale/typography, P2.
- Captured original: historical phase-g `10c-about-clients-awards--390x844.jpg` shows approximately three large marks across each horizontally moving row and a larger two-line heading, with centered narrow description. Metadata declares locally hosted captured source; it is not current-live evidence.
- Current rendered clone: settled 390/375 captures show all five/six marks squeezed across the viewport, making native SVG artwork extremely small; heading is 8.5vw and description left-aligned.
- Root cause: desktop track/set widths and flexible tile widths persist at mobile; the native 240×240 SVG art includes internal whitespace.
- Skill: design-system audit mode, frontend-patterns, browser-qa; those entry instructions have been read fully.
- Planned fix before edit: mobile-only content-sized duplicate sets, one-third-viewport tiles, full-bleed clipped rows, reference-informed heading sizing/wrapping and centered description. Keep canonical brand order, duplication/AT semantics, original CSS duration/direction/loop and offscreen/reduced-motion handling. Do not change scroll/3D/card motion.
- Verification: six-size normal settled capture, assert mobile tile width ≈ viewport/3 and duplicated-set equality; no overflow/errors; recompare the source still with phase/vertical-position limits. Desktop unchanged. Preserve preceding captures.
- Status: reproduced; actual pre-build browser regression RED (72px vs expected 130px tile at 390). Mobile CSS implemented; live preference-cycle browser regression GREEN at 390/375/1440, six-size settled capture PASS, affected 18-state regression PASS. Reduced-motion fallback explicitly wraps the first copy into a static three-column grid, keeping every mark visible rather than clipping the unmoving wide set.

## LP-014 — Two captured project gallery text panels render as fallback images

- Routes/sections: `/projects/of_the_oak` gallery index 4; `/projects/worldcoin` gallery index 4.
- Category/severity: missing captured content / gallery semantics, P1.
- Original: manifest records `type: text`, explicit paragraph text and `fontSizeEm: 1.5` for each panel.
- Rendered clone: HTTP/SSR gallery renders those records as `<picture><img>` using the generic project's existing poster, omitting the paragraph.
- Exact difference/root cause: ProjectMediaCard branches only on `video`; every other media type falls through to image. The earlier 371-asset presence census cannot catch missing text.
- Skills: frontend-patterns, react-patterns, react-testing/e2e-testing (entry instructions read fully).
- Plan before edits: explicit noninteractive text-panel branch, original text including captured spelling and provided em sizing, inherited project theme, no fabricated heading/asset/aspect ratio; preserve media ordering and all other media/modal behavior.
- Verification: RED exact rendered SSR media-order comparison retained in `project-content-red.*`; then all 17 routes' complete SSR content/gallery order/links/metadata; actual visible text renders at desktop/mobile; affected-route six-size gate.
- Status: fixed; full 17-detail SSR content/order verification passes, and both text panels pass actual desktop/mobile visible-text/em-size checks. Original font/spacing fidelity remains separately unverified.

## Defect-scoped captured-reference scores

These are narrow evidence assessments, **not overall route scores or current-live parity**. Unmeasured full-scene categories remain null in the original comparison matrix.

| Scope | Before | After | Evidence / qualification |
| --- | ---: | ---: | --- |
| Client artwork identity | 1 | 5 | Before text-only local panels; after actual verified SVG linework, decoded assets and inspected renders. Geometry/timing not included in this identity score. |
| Card-back artwork | unverified | 4 | Source-derived native ink plus observed outer rounded frame; current normal render inspected against E08. Exact frame width, pose and source phase not measured. |
| Recognition mark shapes | 2 | 3 | Unicode substitutes replaced by observed rosette/star/dot categories; authored curves remain approximate. |
| Mobile client horizontal scale/wrapping | 1 | 4 | Historical 390px source, 72px RED vs 130px GREEN tile, readable three-across current render; source phase/vertical placement/fonts not exact. |
| Two captured gallery paragraphs | 0 | 5 | Previously absent/replaced by image in rendered SSR; exact captured text now visible and browser-compared at desktop/mobile. This is content, not typography/spacing scoring. |

No source-motion/GLSL/camera/performance score of 5 is inferred from a passing test or static screenshot.
