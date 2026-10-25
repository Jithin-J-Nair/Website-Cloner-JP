# Cinematic website repair — verified fixes and open acceptance failures

Date: **2026-10-25**. Branch: `arena/6d83ea00-website-cloner-jp`. Existing [PR #12](https://github.com/Jithin-J-Nair/Website-Cloner-JP/pull/12), base `master`. Entry commit: `e69e401306d46f79ee5b3b81ee5ba1f3b75ed30d`. Repair/test commit: **`16de3439c7902b460b38be268b5e67055d54c397`**.

**Outcome: targeted functional repairs are verified, but the complete cinematic is NOT accepted as finished.** Two normal-motion autonomous regression configurations still fail; the software-rendered frame budget is far above 16.7 ms. Reference parity, physical-GPU visual quality and merge readiness remain unverified or blocked. Passing units/builds are not substituted for those missing results.

## A. Fixed

| Repair | Reproduced cause | Change / files | Fresh verification |
| --- | --- | --- | --- |
| Featured input cancellation, touch and live preference | Imperative thumbnail transform survived cancellation/preference changes; touch applied mouse parallax | `FeaturedProjectCard.tsx`: pointer leave/cancel reset, touch/drag rejection, normalized bounds, live reduced-motion reset; existing links/focus styling retained | Three original defects reproduced at 1440/390/1024 widths; all three absent in final audits |
| Hero live reduced-motion reset | Springs reported zero while mesh position/quaternion retained one interpolation step of displacement | `HeroCrossesStage.tsx`: clear impulses and paint exact neutral position/quaternion before sleeping | Neutral vs live-reduced capture: mean absolute channel error **6.2529 → 0**, differing channels over 3 **15.38% → 0%**; final `settled`, `activeRaf=false` |
| Authored playback clock | `min(dt, .25)` was used for both smoothing and progress, discarding active elapsed time during visible stalls | `home-motion.ts`, `GoalTunnelSection.tsx`: pure elapsed-time progress; interpolation retains its bounded delta; pause/resume boundary excluded | 650 ms imposed stall: **0.250 s → 0.6747 s** authored advancement in paired unrecorded probes; 120/60/30 Hz and slow-frame units |
| Paused cinematic waste | Paused state still repeatedly submitted identical renders | `GoalTunnelSection.tsx`: sleep after paused frame; store changes wake the existing owner and reset time boundary; unsubscribe on teardown | Actual WebGL submission counter: **9 → 0 additional draws over 2.5 s** in the paired probes; pause/menu/resume tests pass |
| Context loss / unavailable 3D | Lost context left scrolling locked, no alternative and a blank 35-screen track | `GoalTunnelSection.tsx`: stop rendering/timer, release playback, guard async loading, collapse track, show readable static panel/contact alternative | Genuine `WEBGL_lose_context` during playback at 1440 and 390; constructor and astronaut failure cases: track hidden, scrolling released, visible keyboard-reachable contact |
| Contact reduced-motion navigation / fallback spacing | Both footer controls explicitly requested smooth scrolling; normal cinematic spacing was inappropriate without 3D | `ContactCtaSection.tsx`: preference-aware scroll behavior; compact black contact styling scoped only to static fallback | Footer reduced-motion gate passes at all three audit widths; fallback contact visible/focusable |
| GPU query loss guard | A timer could call `endQuery` after a mid-frame lost-context condition | `gpu-frame-timer.ts`: avoid invalid end on lost context; retain idempotent disposal | Mocked mid-frame loss unit passes. Real context-loss browser tests pass, but do not prove a query was active at the exact instant of loss |

No new playhead, renderer, dependency, asset replacement, arbitrary speed multiplier, source pose rewrite, shader-quality reduction or baseline-image change was introduced. Optical/tesseract shaders and captured assets were retained. Geometry/texture/program counts were added to existing telemetry, not a new render loop.

## B. Verified

### Final requirement matrix

“Verified” is scoped to the stated behavior and environment. “Partial” is not a visual/reference acceptance claim.

| Requirement | Current evidence | Status | Root cause / finding | Planned fix / remaining action | Verification |
| --- | --- | --- | --- | --- | --- |
| Sunlight / glare | Source/FOV/occlusion units; fresh camera-dependent browser states; cool arcs in inspected moving-run samples; native UHD static capture | Partial | Analytic finite-source approximation, not physical light transport. No brown disk observed in selected samples; convincing optical quality not established | Physical-GPU moving-camera review before further optics changes | Home-motion camera-response/GL tests pass; visual quality not signed off |
| Tesseract | Captured lattice, 3 desktop / 2 mobile glazing layers; reverse scene/pixel checks; ordered recorded frames show axial then rotated depth structure | Partial | Structure is coherent in samples, but continuous rendered quality is compromised by long software stalls | Repeat uninterrupted visual acceptance on a physical GPU; resolve phase-density failure | Reduced-motion 11-state forward/reverse checks pass at both widths; normal gate fails |
| Astronaut trajectory | Existing accelerating trajectory and one owner preserved; elapsed clock repaired; matrix/pose continuity units and browser boundary probes pass | Partial | Render stalls can skip short visual phases even when time/pose mapping is numerically continuous | Improve/verify real presentation cadence without restoring slow-motion truncation | 30,000 monotonic path samples; four browser handoffs under reduced motion; normal glass coverage insufficient |
| Hero hover / reset | Entry, exit, rapid changes/cancel, touch and idle tests; live preference pixel comparison | Verified | Residual reduced pose fixed | Physical pointing-device feel remains a device-level check | Desktop/touch/reduced home regressions and live reset probe pass |
| Bold Ideas / reel | Forward/reverse container transforms; decoded video frame; offscreen/reduced/modal media policy and Escape close | Partial | Local behavior verified; live reference cannot load here | Obtain reachable reference and compare timing/crop at equivalent viewports | Desktop, touch and reduced home tests pass; no reference-parity assertion |
| Featured Work | Forward/reverse reveal and heading state, cancellation, touch, preference changes, overflow and focus | Verified | Input transform latching fixed | Live reference visual parity remains separate | All three extended viewport audits and home regressions pass |
| Smoothness | Correct active elapsed clock and paused sleep; measured RAF distributions and recorded uninterrupted run | Failed | Software-rendered frame budget misses; short glass phase under-sampled; capture/telemetry are not frame-paired | Physical-GPU acceptance and measured bottleneck work; no weakening of the existing gate | Two default normal configurations fail; supplemental recorded normal run also fails |
| Performance / quality | Matched profiles, optional timer queries, resource counts and separate native UHD buffer check | Failed | Active-render gain not established; quality was not lowered to manufacture one | Meet the frame budget on a documented physical device | See D; no 60fps claim |
| Responsive / accessibility | 1440×900, 1024×900, 390×844, keyboard CTA/footer/portal, touch drag, live reduced motion and fallbacks | Partial | Tested cases pass; not a comprehensive WCAG/screen-reader/cross-browser audit | Real-device, screen-reader and broader keyboard/contrast review | No observed overflow or unexpected browser/network errors in final audits |
| Contact CTA / homepage navigation | AX name `Let's work together!`, exact `mailto:business@lusion.co`, focus outline, footer portal Enter → `/about`; header Contact before/during playback | Verified | Reduced footer scroll and failed-3D spacing fixed | Mail delivery/external destinations not tested | Three viewport audits, two policy probes and failure probes pass |
| High-resolution output | Canvas attributes, telemetry and GL drawing buffer independently equal **3840×2160**, `NO_ERROR` | Partial | Static software-rendered UHD is not physical 4K motion, 4K assets or 4K60 | Hardware/post-processing/asset-resolution verification | Fresh UHD browser test passes; decoded desktop reel is only 800×400 |
| Resource cleanup / fallback | SPA removes goal canvas, listener and ranges; profiled query ring **3 → 0**; context-loss and initial-failure alternatives | Verified | Paused loop and loss handling fixed | No automatic 3D context reconstruction; reload/remount required. Loss during every async-load boundary not exhaustively tested | Profiled reduced browser cleanup, initial WebGL/astronaut and real loss tests pass |
| Dependency security | Fresh `npm audit --json`: 11 advisories, including 2 critical | Failed | Existing dependency tree, including direct Next dependency | Remediation and dependency regression work required before production readiness | Manifest/lockfile unchanged; audit remains exit 1 |
| PR integration | Fresh ancestry, GitHub state and non-mutating merge analysis | Failed | Independently squashed master history; 26 conflicts at entry, **27 after repair** (Contact CTA now also differs) | Reconcile both histories deliberately; do not choose ours across unrelated work | No merge/reset/force push performed; PR remains blocked |

### Commands and results

Production source was unchanged across the final browser runs and final rebuild. Browser scripts use real Chromium, not DOM-only mocks; some individual pointer events and imposed failure conditions are synthetic and identified in their reports.

| Check | Configuration / result |
| --- | --- |
| `npm run test:motion` | PASS, including elapsed-time invariance/stall and mid-frame query-loss units |
| `node scripts/test-goal-sequence.mjs` | PASS, six groups: clock/path, captured girder/TBN, placement, root/deformation palettes, skeleton poses, 946-piece glass |
| `npm run check` | PASS: lint → types → standalone production build; **2 existing warnings**, not zero: About effect `team` dependency; unused project-detail `highlight` |
| `npm run qa` | PASS: 22 routes, expected 404s, asset security and 50 nonempty captured assets; rerun after rebuilt preview restart |
| `npm run test:assets` | PASS: 18/18, including path security, HEAD and range responses; rerun on rebuilt preview |
| `node scripts/validate-home-motion.mjs` | PASS at desktop normal, 390 touch, desktop reduced, and 3840×2160 reduced/static UHD |
| `node scripts/validate-goal-sequence.mjs` | PASS at 1440 and 390 reduced motion: 11 states forward/reverse, four boundary probes, native seeks, failures and cleanup |
| Same goal script, `GOAL_PROFILE_GPU=1`, reduced | PASS: bounded 3-query allocation and complete disposal on client navigation |
| Same goal script, `GOAL_MOTION=normal` | **FAIL at 1440 and 390**: unchanged `all intermediate stages visibly play` assertion |
| Same goal script, `GOAL_RECORD=1 GOAL_MOTION=normal` | **FAIL again** with the same assertions; optional recording only adds evidence capture |
| `node scripts/audit-home-experience.mjs` | PASS at 1440/390/1024, including Featured reset checks, reduced footer, actual AX name, keyboard About portal and zero observed horizontal overflow |
| `node scripts/validate-live-motion.mjs` | PASS, exact neutral/live-reduced hero pixel equality |
| `node scripts/validate-playback-clock.mjs` | PASS at 1440 and 390: elapsed stall, zero paused draws, pause/input/resize, menu resume, skip/replay, Contact before and during playback, live preference release |
| `node scripts/validate-context-loss.mjs` | PASS at 1440 and 390 for real loss; desktop `AUDIT_FAILURE=webgl` / `astronaut` pass usable fallback/contact checks |
| `node scripts/profile-goal-motion.mjs` | Measurement harness passes GL/error gates, both matched after profile and query-enabled diagnostic; **not** a performance acceptance pass |
| `npm audit --json` | **FAIL (exit 1)**: 3 moderate, 6 high, 2 critical advisories |

The new policy probe initially used “before activation” instead of the canonical “before tablet” replay boundary. Its rearm wait timed out. The input was corrected to `scrollForEmergence(0) - .3 * innerHeight`, matching the original regression; no production reset boundary or assertion was weakened.

## C. Still broken or unverified

1. **Normal-motion intermediate-stage acceptance fails.** Default desktop run: 25.903 s, 158 playing telemetry samples, shaft 26 / blue 35 / middle-glass **0**. Default mobile: 23.997 s, 167 samples, shaft 32 / blue 24 / middle-glass **0**. The gate requires shaft >5, blue >5 and glass >3. Supplemental recorded run: 26.695 s; shaft 28 / blue 10 / middle-glass **1**. Sampling is telemetry, not a count of actual presented frames. Later assertions in the failing runner are not claimed as executed; independent probes cover the specified controls and reduced-mode handoffs.
2. **No complete motion/optical aesthetic sign-off.** Recorded presentation can lag/diverge from telemetry in this environment. Ordered frame inspection shows tablet/space, suit close-up, cool arcs, axial/rotated shaft and portal; it does not establish smoothness or a correctly presented final frame. Precise driver-versus-capture attribution is unproven. Numerical continuity and screenshots do not certify cinematic feel.
3. **Live reference blocked:** the actual Chromium navigation to `https://lusion.co/` returns `net::ERR_CONNECTION_CLOSED`. This is an environment limitation, not a finding that the site is down. Diagnostic script exit 0 was not counted as reference success. Local 2026-09-23 ground truth and supplied images were inspected; no current reference motion was invented.
4. **Physical GPU/browser/device coverage absent:** no Safari/iOS/Android hardware, physical 4K display, real-GPU desktop post-processing, screen-reader or full WCAG certification. External email/social behavior and newsletter delivery are not certified.
5. **Dependencies remain vulnerable and PR conflicts remain unresolved.** Neither is hidden by the successful local build. Automatic context restoration is not implemented; the fallback intentionally remains usable until reload/remount.

## D. Performance

### Environment and method

Linux sandbox; HeadlessChrome **153.0.8010.0**; **2 logical cores reported**, DPR 1; ANGLE/Vulkan **SwiftShader Device (Subzero)**. These are not the user's machine or a physical GPU. Sequential GPU workloads against the production standalone server; no concurrent GPU test jobs or encoders during measurement. Desktop viewport **1440×900**, moving software buffer **960×600**, texture limit **2048**. Hardware-only bloom/lens post-processing path is not exercised by this renderer. UHD test is separate, static, reduced motion with a genuine 3840×2160 buffer.

Each matched profile requests 10 s per phase; RAF overshoot gives the actual spans below. Before/after are single runs, not a statistically repeatable benchmark. CPU submission includes possible driver backpressure and is **not GPU execution**.

| Phase | Before fps | After fps | After measured span / RAF intervals | After interval p50 / p95 ms | After CPU-submission p95 ms | Max draws / triangles |
| --- | ---: | ---: | --- | --- | ---: | --- |
| Solar | 2.92 | 2.89 | 10.03 s / 29 | 283.3 / 866.7 | 1.4 | 6 / 13,241 |
| Tesseract | 1.56 | 1.74 | 10.35 s / 18 | 533.4 / 1499.9 | 1.9 | 11 / 143,609 |
| Blue flight | 0.80 | 0.75 | 12.02 s / 9 | 849.9 / 2433.3 | 2422.8 | 10 / 103,163 |
| Shatter | 1.49 | 1.38 | 10.88 s / 15 | 816.6 / 1349.9 | 1348.6 | 11 / 115,193 |

**No active-render performance gain is established. No 60fps claim.** The demonstrated optimization is removing paused cinematic render submissions; it does not mean all page RAF/CPU work stops. The clock correction restores elapsed pacing, not GPU throughput. Paired unrecorded clock runs were **74.391 → 28.341 s wall**, both including deliberate pause and stall; this is not a general speedup claim. Later instrumented policy runs differ and are not substituted into that comparison.

The separate 12 s/phase query diagnostic yielded 30 unique phase-tagged results across snapshots: solar 12, tesseract 9, blue 6, shatter 3; zero reported disjoints and GL errors. Deferred software-driver execution p95: **745.74 / 746.30 / 642.92 / 726.58 ms** respectively. These include late completions and are not frame-paired or strictly in-window. In-window blue query data is null; the deferred tagged values are not relabeled as in-window results or physical-GPU timings.

Resource counters at final phase snapshots rise from 14 geometries / 15 textures / 10 programs to 21 / 20 / 20 as scene materials are exercised. They are **counts, not VRAM bytes**. Profiled route teardown verifies the 3-query ring returns to zero. Whole-exercise JS heap is coarsely reported around 26 MB in the extended audits, not a measured GPU/media memory budget.

Desktop/mobile/tablet observed CLS: **0.03259 / 0.00224 / 0.01428**. Observed long-task counts: **7 / 8 / 8**, maximum/p95 at these small sample sizes **906 / 816 / 906 ms**. These scripted exercises are not field Core Web Vitals certification.

Resource Timing buffers returned empty arrays, so their zero byte sums are **unavailable measurements, not zero network cost**. A separate CDP observation during desktop initial load plus clock/policy scenario measured **70 responses, 8,413,399 encoded transferred bytes and 10,051,272 decoded chunk bytes**, with no observed failures. This is not a complete crawl or all-asset download budget. Decoded reel media: desktop **800×400**, mobile **720×960**, about 11.517 s; both sampled videos decoded and paused offscreen. Native UHD rendering does **not** make those assets 4K.

Cumulative video decoder counters (total/dropped, two sampled background videos) were desktop **1667/108 and 103/4**, mobile **4/0 and 32/2**, tablet **1637/164 and 78/8**. These cover different visibility periods during each full scripted exercise, not equal-duration playback windows or a media-fps comparison.

## E. GitHub / review

- Existing PR #12 only; branch name preserved; no force push, reset, duplicate PR or merge.
- Entry GitHub state: OPEN, CONFLICTING/DIRTY, no returned checks/reviews/comments. Fresh pre-push inspection still returns OPEN, CONFLICTING/DIRTY and an empty check rollup. An empty rollup is **not green CI**.
- Master is `1bc32be7de206ded61be0bba4942feeb3c159bba`; common ancestor `3ec20e5`. Its independently squashed history is not an ancestor of this implementation branch.
- Non-mutating merge analysis: **26 conflicts at entry, 27 after repairs**. The additional path is `src/components/sections/ContactCtaSection.tsx`, whose initially identical independent additions now differ because of the targeted fix. No master version was silently discarded. Reconciliation must preserve both sides and requires a dedicated review.
- Final source diff reviewed; `git diff --check` passes. Changed-file credential-pattern scan found no matching private-key, GitHub PAT, AWS-access-key or AI-key patterns; this is not an exhaustive secret-security certification. No `.env`, credential file, dependency manifest or lockfile was changed. No unrelated source replacement or failing-gate suppression.
- Dependency audit remains open: see [raw audit](mission-repair/dependency-audit.json). Do not infer production readiness from the local build.

## F. Evidence and reproduction

### Primary artifacts

- [Uninterrupted autonomous run capture](mission-repair/autonomous-swiftshader.mp4): **33 CDP frames over 28.18 s**, including capture bookends around a 26.695 s test run. Actual variable capture times retained, not encoded as a fabricated 60fps sequence. This is evidence of the constrained run, **not** a successful visual acceptance or a frame-paired telemetry movie.
- [Desktop camera/phase sweep](mission-repair/desktop-sweep.mp4): 196 captured frames over 200.31 s. [Mobile sweep](mission-repair/mobile-sweep.mp4): 199 over 162.00 s. These are deliberate scripted seeks/reversals, **not autonomous playback timing references**. CDP preview dimensions are at most 960×600; mobile encoding pads an odd width by one pixel without stretching.
- Visual review consisted of real-browser state inspection and ordered captured-frame inspection, with temporal/clock assertions. It is **not represented as a human real-time viewing session**, a smoothness sign-off or live-reference parity review.
- [Native UHD PNG](mission-repair/solar-uhd.png), [independent buffer fields](mission-repair/uhd-buffer.json), [desktop tesseract](mission-repair/tesseract-desktop.png), [mobile tesseract](mission-repair/tesseract-mobile.png), [glass seek](mission-repair/glass-desktop.png), [static fallback](mission-repair/static-fallback.png), [fallback contact](mission-repair/fallback-contact-mobile.png), [hero reset](mission-repair/hero-reset.png).

### Raw results

[Before profile](mission-repair/profile-before.json) · [after profile](mission-repair/profile-after.json) · [query diagnostic](mission-repair/profile-gpu.json) · [desktop normal failure](mission-repair/autonomous-desktop-failed.json) · [mobile normal failure](mission-repair/autonomous-mobile-failed.json) · [recorded failure](mission-repair/autonomous-recorded-failed.json) · [capture timestamps](mission-repair/autonomous-recording-index.json) · [paired clock before](mission-repair/clock-before.json) / [after](mission-repair/clock-after-unrecorded.json) · [desktop policies/network](mission-repair/clock-policy-desktop.json) · [mobile policies](mission-repair/clock-policy-mobile.json) · [hero before](mission-repair/hero-before.json) / [after](mission-repair/hero-after.json) · [desktop loss](mission-repair/context-loss-desktop.json) · [mobile loss](mission-repair/context-loss-mobile.json) · [initial WebGL failure](mission-repair/initial-webgl.json) · [initial astronaut failure](mission-repair/initial-glb.json) · [GPU cleanup](mission-repair/goal-reduced-gpu-cleanup.json) · [desktop audit](mission-repair/home-1440.json) · [mobile audit](mission-repair/home-390.json) · [tablet audit](mission-repair/home-1024.json).

[Unit log](mission-repair/unit-tests.log) · [lint/types/build](mission-repair/production-check.log) · [route QA](mission-repair/route-qa.log) · [18 asset tests](mission-repair/asset-tests.log) · [reference failure](mission-repair/reference-attempt.json) · [entry PR snapshot](mission-repair/pr-baseline.json) · [initial ledger](mission-repair/initial-ledger.md) · [final merge analysis](mission-repair/merge-final-analysis.txt).

Terminal logs have normalized line endings/trailing whitespace; result text, warnings and failures are unchanged. Timestamp indexes retain original raw JPEG filenames from ignored `temp/` directories; the checked-in videos and selected PNGs are the portable visual evidence, not a promise that every raw capture JPEG is tracked. No failed expectation or reference image was changed to pass.

### Framework and skill workflow actually used

Read repository instructions, installed Next 16 client-boundary documentation and the canonical local motion guide before production edits. Inspected actual Three/React/Lenis/GSAP ownership, assets, ground truth and component sources. UI UX Pro Max guidance was read from its actual repository at SHA `d14efff8ed1faa4187f004f79926f428c8074ec7`, not asserted from an imaginary installer. Its Python searches ran against **ux: `touch hover alternative`**, **ux: `reduced motion`**, **threejs: `gpu dispose render loop`**; [touch](mission-repair/skill-touch.txt), [preference](mission-repair/skill-reduced.txt), [Three](mission-repair/skill-three.txt) outputs retained. This is guidance compatible with the imperative Three/React architecture, not a runtime framework/plugin installation.

Actual [Awesome Motion Design Agent Skills](https://github.com/frankxai/awesome-motion-design-agent-skills) motion-director, web-motion-auditor and quality-rubric documentation was read for ownership, purpose, timing, accessibility, implementation and evidence review. No numeric audit score or certification is claimed. No additional app dependency or unnecessary skill installation was introduced. Optional external ffmpeg was used only to encode evidence.

### Re-run

Start the production server with `PORT=3000 npm run start` after `npm run check`. New probes support `CHROMIUM_MULTIPROCESS=1`. The existing bundled-browser harnesses needed a Linux sandbox wrapper because the bundle's single-process GPU mode crashed here:

```sh
mkdir -p temp
cat > temp/chromium-multiprocess.py <<'PY'
#!/usr/bin/env python3
import os, sys
os.execv('/tmp/chromium', ['/tmp/chromium'] + [a for a in sys.argv[1:] if a not in ('--single-process', '--in-process-gpu')])
PY
chmod +x temp/chromium-multiprocess.py
export CHROMIUM_EXECUTABLE_PATH="$PWD/temp/chromium-multiprocess.py"
export CHROMIUM_MULTIPROCESS=1
# Each existing harness extracts its bundled Chromium to /tmp/chromium first.

npm run test:motion
node scripts/test-goal-sequence.mjs
npm run check
npm run qa
npm run test:assets
node scripts/validate-live-motion.mjs
node scripts/validate-playback-clock.mjs
AUDIT_WIDTH=390 node scripts/validate-playback-clock.mjs
node scripts/validate-context-loss.mjs
AUDIT_WIDTH=390 node scripts/validate-context-loss.mjs
AUDIT_FAILURE=webgl node scripts/validate-context-loss.mjs
AUDIT_FAILURE=astronaut node scripts/validate-context-loss.mjs
node scripts/audit-home-experience.mjs
AUDIT_WIDTH=390 node scripts/audit-home-experience.mjs
AUDIT_WIDTH=1024 AUDIT_CINEMA=0 node scripts/audit-home-experience.mjs
node scripts/validate-home-motion.mjs
HOME_VIEWPORT_WIDTH=390 HOME_TOUCH=1 node scripts/validate-home-motion.mjs
HOME_REDUCED=1 node scripts/validate-home-motion.mjs
HOME_REDUCED=1 HOME_VIEWPORT_WIDTH=3840 HOME_HEIGHT=2160 node scripts/validate-home-motion.mjs
GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_PROFILE_GPU=1 node scripts/validate-goal-sequence.mjs
# These are expected to expose the OPEN failure, not to be omitted from acceptance:
GOAL_CAPTURE=0 GOAL_MOTION=normal node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_MOTION=normal GOAL_RECORD=1 node scripts/validate-goal-sequence.mjs
PROFILE_TAG=mission-after PROFILE_DURATION=10000 node scripts/profile-goal-motion.mjs
PROFILE_TAG=mission-gpu PROFILE_DURATION=12000 PROFILE_GPU=1 node scripts/profile-goal-motion.mjs
# With an external ffmpeg executable available (no app package installation):
node scripts/encode-browser-recording.mjs temp/cinematic-validation/1440-no-preference output.mp4
```

The block lists independent commands; a failing normal test must remain a failing result, not be interpreted as permission to skip it or claim a green aggregate.
