# Validation report — 2026-11-07

## Verdict and reference scope

**The three previously outstanding regression gates now pass:** About source/portrait tests, asset-route tests and the unchanged full Home-motion browser gate. Implementation is buildable, and the all-route/six-viewport local-checkpoint static regression completed with no failures. **Full reconstruction and current-live visual/motion parity are not accepted.**

Captured-reference implementation is explicitly authorized by the user's later instruction. Earlier live-only restrictions are superseded. Six failed live-browser core-route attempts remain recorded; current-live differences and unknown Atlas Motion/Everswap destinations are unverified.

## Implementation batch results

All paths below are relative to this audit directory unless specified otherwise.

| Check | Actual result | Evidence / limits |
| --- | --- | --- |
| Full unchanged `validate:home-motion` | **PASS**, exit 0 | `data/implementation-01/home-motion-browser-refined.log`; report/hero PNGs in `evidence/implementation-01/home-motion/`. Hover, throw/release/cancel, reverse seek, reel, featured, downstream scenes, modal and errors/assets assertions retained |
| Full `test:motion`, including pointer regression | **PASS**, exit 0 | `data/implementation-01/motion-unit.log`; pure/source/model tests, not original animation parity |
| `test:about-portrait` | **PASS**, exit 0 | `data/implementation-01/about-final.log`; original source-team security/stale/recovery/disposal suite remains unchanged; extra lifecycle suite is a separate file |
| `test:assets` | **PASS**, 20 / 0 | `data/implementation-01/assets-test.log`; unknown Atlas/Everswap rejection, canonical approved fallback, traversal/symlink/font/MIME/CSP/range/HEAD preserved |
| Real preview-media browser test | **PASS**, exit 0 | `project-preview-browser.json` and log in `data/implementation-01/`; actual desktop/mobile playback, live reduced motion, Enter/Escape modal pause/resume, offscreen pause, errors [] |
| `qa` | **PASS**, exit 0 | `data/implementation-01/qa-final.log`: 20 captured routes + negative routes + asset security + 46/46 scene assets |
| `typecheck` | **PASS**, exit 0 | `data/implementation-01/typecheck.log` |
| `lint` | **PASS**, **one existing warning** | `data/implementation-01/final-lint.log`; StudioFooter unused expression, not warning-free |
| `build` + prebuild/postbuild | **PASS**, exit 0 | `data/implementation-01/final-build.log`; prebuild deterministically derives card ink from tracked source; latest build ID in `final-build-id.txt` |
| 20 routes × six sizes paired static gate | **PASS**, 120 states, failures [] | `evidence/implementation-01/visual-report.json`; child exit 0 / 473.74 s in `visual-test-exits.json` |
| Detail media presence census | **371 unique references, 0 missing** | `data/implementation-01/detail-asset-presence.json`; presence is not image identity or gallery acceptance |
| Second full all-route gate with console/network diagnostics | **PASS**, 120 states / 0 failures | `evidence/implementation-03/visual-report.json`, exit 0 / 548.83 s. Its build ID is stored in the report. Before final LP-013/014 scoped fixes, not silently relabeled as their final build |
| Final affected-route gate | **PASS**, 18 states / 0 failures | `evidence/implementation-05/visual-report.json`: About + Of The Oak + Worldcoin × six sizes, final mobile/gallery build, console/HTTP/request/page diagnostics and static gate |
| Final settled About normal renders | **PASS**, six sizes | `evidence/implementation-04/report.json`, 22.44 s; decoded SVGs, normal card backs/fronts, mobile geometry and recognition structure |
| Mobile client layout / live preference cycle | **PASS**, 390 / 375 / 1440 | `client-layout-red.*` then `client-layout-browser.json` and GREEN log: normal→reduce→normal, three-across mobile, static content unclipped, duplicate loop widths |
| All 17 complete SSR detail-content checks | **PASS** | `project-content-browserless.json`, latest explicit exit `project-content-final-exit.json`; paragraphs/services/links/metadata/gallery types+order and next chain. Not visual acceptance |
| Restored gallery paragraphs, real browser | **PASS**, four states | `evidence/project-gallery-text/report.json`: both projects at desktop/mobile, actual visible exact text and declared em size |
| Broader unchanged `validate:browser` rerun | **PASS**, exit 0 / 286.74 s | `browser-final.log`, captures/report under `evidence/implementation-01/browser-final`; ran before final mobile/text patches, which have separate affected-route checks |

The original failures remain in historical data. The first all-input elapsed-clock repair passed units but failed unchanged Home hover; that failed log remains `home-motion-browser.log`. The refined release-only repair passes the same browser gate. No existing timeout, scheduler, assertion or collision cap was weakened.

## What the paired image gate actually means

- Baseline is the **preserved local 5051 application**, not original Lusion.
- 20 canonical routes × **1920×1080, 1440×900, 1366×768, 1024×1366, 390×844, 375×812**.
- DPR 1, reduced motion, seeded initialization, paused media. Canvas/video are hidden on **both** sides solely for the static raster gate; unmasked JPGs are retained separately.
- Every initial pair had **0 pixels exceeding the channel-delta-24 threshold**. That is not a literal all-channel pixel equality claim, and it is not original-site parity.
- HTTP 200, exact captured title, nonempty H1 and no horizontal overflow accompany each pair. The second full and final affected-route runs additionally record console/HTTP/request diagnostics. Both record zero warnings/errors and 36 About initialization asset-request aborts each (three URLs × two sides × six sizes). Abort URLs are retained separately, not falsely reported as zero failed requests or proof of completed asset loading. About loader/recovery tests and scene-asset HTTP QA provide separate evidence.
- Initial-state coverage does not cover every gallery, footer, hover, menu, external URL, transition or animation phase.

The vector/separator follow-up selected only About (six states). A second full 120-state run then passed with console/HTTP/request diagnostics. Subsequent LP-013/014 changes affect only About and two detail pages, so their final-build gate is 18 states. These distinct runs and build scopes are not conflated.

## Settled evidence and capture failures

Early paired client panels were taken immediately after scrolling and contain unloaded lazy SVGs. They remain preserved but are **not accepted artwork-review evidence**. The dedicated restoration harness explicitly loads/decodes all 32 images (15 unique sources) before capture. The initial settled 1920 brand wall was inspected and contains all expected marks, not text substitutes.

Two normal full-viewport Playwright capture attempts timed out despite fonts being ready. A raw native-CDP diagnostic captured the recognition viewport in **948 ms** under the same 30-second deadline. A subsequent sequence after an oversized element capture also timed out; oversized element capture can change the emulated viewport. The revised harness uses only viewport-sized native captures, with separate upper/lower/middle states rather than resizing the viewport. It asserts actual output dimensions and keeps the same deadline. No production clock/RAF is paused or replaced; no canvas/video is masked in these restoration captures.

The first viewport then completed all brand/recognition/card structure checks, but the serverless **single-process Chromium** closed during next-context creation. The same context-reuse failure occurred in the About-only paired follow-up. Logs and partial reports are preserved with `*-context-reuse-failure*` names. The harness now launches a fresh browser per viewport; this is process isolation, not an application workaround or a weaker assertion. Session-storage initialization is restricted to HTTP documents rather than forbidden `about:blank` storage access. Fresh-browser isolation subsequently passed all six normal states and the six-state paired follow-up. The later final mobile patch also passed six normal states and the affected 18-state paired gate.

No application GPU/performance root cause is asserted from these screenshot/context failures. Native CDP stills do not certify motion or hardware FPS.

## Preserved initial/historical verification

The pre-implementation validation narrative is retained in `data/historical-validation-checkpoint.md`. It includes the original RED validator-boundary reproduction, initial 120-state route census and the earlier passing broad browser gate. Those historical results are not relabeled as latest-build acceptance.

The initial saved-matrix checker and negative fixtures rejected missing/duplicate states, bad HTTP, errors, overflow, title mismatch and capture exceptions. The original About source-team test file is byte-identical to its committed baseline; stale procedural source assertions were corrected separately, not by replacing original geometry or deleting security checks.

## Remaining acceptance

- Full captured-reference, phase-matched every-section visual/3D/motion comparison and project gallery/media identity.
- Complete all-route menu/contact/newsletter/audio/cursor/loading/footer and keyboard/touch/reduced-motion flows.
- Original camera/easing/lighting/material behavior; physical phone/GPU/resource/thermal/speaker/OS-background performance.
- The 13 dependency advisories (2 low / 11 moderate) remain; no blind audit fix or lockfile change.
- No commercial-font permission or exact original font metrics are inferred.

Build success, source regex, a nonempty buffer, a screenshot or local static-raster equality does not close these items. Unmeasured scores remain unverified.

## Final scoped fixes and honest exit accounting

The SSR checker found actual missing text panels in Of The Oak / Worldcoin: media `type: text` fell through to image rendering. Both exact captured paragraphs are now native, noninteractive text panels, with four real browser renders. The original RED content/type mismatch is preserved.

A later checker attempt failed because it compared H1 to raw `title` rather than the existing canonical display titles (Porsche spacing; Spaace subtitle). It now independently uses captured `meta.title` without its Lusion prefix. This changes no application title and is not removal of a content assertion. All 17 then passed; the final command's exit 0 is separate. The `final-scoped-test-exits.json` collector therefore correctly remains exit-failure history for that first checker attempt; its failure log points to `project-content-h1-expectation-failure.log`. Other children passed. `project-content-final-exit.json` records the corrected rerun.

Final `test:assets`, About, motion, QA and real preview-media commands all exit 0 in `final-regressions.log`. No collector's overall success is used to conceal a child failure.
