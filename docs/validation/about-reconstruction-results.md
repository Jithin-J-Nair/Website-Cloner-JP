# About reconstruction and audio investigation — 2026-10-29

**Delivery status: partial implementation / draft review. Full-fidelity and physical-audio acceptance remain open. Do not merge automatically.**

## Reference research

- Fresh Chromium attempts to `https://lusion.co/about/` and `/` at desktop/mobile all returned `ERR_CONNECTION_CLOSED`. Current live layout, temporal transitions, hover response and sound could not be observed. Evidence: `about-reconstruction/reference.json`.
- Actually examined historical local composites `reference/side-by-side/09_about_plume_wordmark.jpg` / `10_about_terrain.jpg` and phase-H desktop/mobile About captures. The composites show a solid wordmark; phase-H includes outlined/distorted typography. The solid treatment chosen here is supported by one historical source, not established current-live parity.
- Important provenance: `scripts/phase-h-validate.mjs` patches captured original HTML/JS to hide other routes/expose scroll ranges and replaces `sphere_l` with `sphere_m`. Its stills are controlled historical states, **not untouched current live behavior**.
- `src/data/reference/lusion-ground-truth.json`, captured 2026-09-23, supplies existing section/content facts: seven team entries, brands, 58 awards, three articles, five talks and four expertise categories. No invented KINETA content from `docs/sections/about-team.md` was used.
- No newly supplied About video attachment was available. Frame-by-frame supplied-video validation: **NOT VERIFIED**.
- The pre-edit specification and gap analysis are in [about-reconstruction-spec.md](about-reconstruction-spec.md).

## Current implementation audit

Baseline: merged PR13, `0812b2b65754379fcd55fb2660c7cab983b2f48f`; active branch `arena/95a11883-website-cloner-jp`. The initial stale branch was clean and fast-forwarded, not reset. The original About already contained a native Three.js world, terrain/contours, team controls, complete downstream content and shared CTA/footer. It was not a missing/static route.

Found: identical-shell plume; raw pointer response; continuous reduced-motion RAF; missing context recovery/readable fallback; proprietary portrait `.buf` requests; stale inspector/geometry references; hidden mobile sound opt-in. Existing home/journey timing, camera, pose, fracture, quality, scheduling and audio-engine source were not rewritten.

## Implementation

### Architecture

- `AboutPageView` retains the route/component hierarchy: studio world → brands → recognition/articles/talks → expertise → shared contact tank → footer → Projects portal. Existing content/data remain authoritative.
- `AboutPlume.ts` is **original analytical GPU flow**, not FLIP, Navier–Stokes, PBD or a full fluid solver. Static seeded attributes drive coherent twisted/tapered filaments, bounded cursor repulsion, depth/scale variation and analytic shading. One instanced icosphere draw plus one soft-dust draw; no simulation textures, CPU point advection or new dependency.
- Fixed-at-mount quality: reduced 900 instances; software renderer/mobile/low 1,800; medium 3,200; high 4,800. Dust adds one-third as many points. The existing `cinematicRenderDpr` policy remains unchanged, additionally capped at 1 for low and 1.5 otherwise. This is an explicit About-only software tier, **not** a change to the journey's accepted density or render budget. Resizes recompute framebuffer/layout; they do not allocate a different particle population mid-story.
- Original procedural crater geometry, rocks and explorer remain real 3D. Added deterministic multi-scale surface displacement shared by contour extraction and figure placement. Historical composition informed the adjusted desktop manifesto and responsive wordmark transition; exact original timing remains unmeasured.
- Pointer target is bounded and exponentially damped with elapsed time; leave/cancel/blur releases smoothly. Integration delta is bounded at 80 ms for stability; telemetry records **uncapped** intervals rather than hiding stalls. Touch does not drive the desktop field force. Team swipe rejects vertical drags; keyboard/live-name/pressed selection states are retained/improved. Expertise tilt is an original inferred ±4° treatment with exit/cancel/blur reset, skipped for touch/reduced motion.
- About uses independent state/time. It sleeps offscreen, while hidden, under menu/reel/transition overlays, and between reduced-motion events. Scroll/reentry derives from native position. No second journey clock or modified authoritative stage data.
- Context loss produces readable content and collapses the inert sticky distance; restoration disposes/recreates the renderer/world while retaining normalized story position and analytical flow time. Unavailable WebGL uses the same readable fallback. Team selection updates the existing position buffer rather than allocating a replacement. Owned listeners, subscription, RAF, geometries/materials, current resized inspector manager and probe are released; route exit forces context loss. The shared CTA was audited but left unchanged.
- Removed captured portrait and logo requests from this route. Team art is an original generic sculptural study, visibly labelled **not a captured likeness**. Brand names are text rather than copied trademark SVG geometry. Local open-license fonts and original expertise SVGs are retained. This is not a blanket licensing certificate for unrelated pre-existing app assets.

### Reference-versus-implementation gaps

| Area | Status / limitation |
| --- | --- |
| Complete section hierarchy and historical factual content | Implemented; page/section captures and route checks below |
| Functioning rich interactive 3D field | Implemented and shader-compiled in Chromium; analytic field, not a fluid solver |
| Exact original plume density, fluid topology, bokeh/lighting and temporal behavior | **NOT VERIFIED / fidelity gap**; no current live or supplied video; software tier is intentionally less dense |
| Terrain/explorer | Original procedural approximation; not exact scanned topography or an authentic astronaut model |
| Named team portraits | **Fidelity gap**: generic labelled original studies, not authentic likenesses; licensed material needed for genuine faces |
| Brand emblems | **Fidelity gap**: factual text names, not exact proprietary SVG wordmarks |
| Expertise illustration/hover behavior | Existing original geometric studies plus inferred tilt/selection, not verified original production assets/easing |
| Wordmark state and scroll timing | Historical sources conflict; current parity unknown |
| Shared contact tank | Preserved existing bounded interactive **2D heap**, not misrepresented as a new 3D FLIP reconstruction |
| Exact full-site fidelity sign-off | **FAIL** for strict full fidelity (known portrait/logo/terrain/CTA substitutions), with current live/temporal parity additionally **NOT VERIFIED**; do not call this a pixel-/behavior-identical finished clone |

## Audio diagnosis

User-reported production silence remains an **unresolved issue**, not superseded by a waveform, screenshot or test recording.

- The existing engine is still the only engine. No score assets, stem gains, visual timeline or playback scheduling were changed.
- Confirmed usability defect: direct sound opt-in was CSS-hidden at ≤812 px. The same real control is now visible on mobile. That is a fix to discoverability/access, **not proof of the user's silence root cause**.
- Confirmed previous test-coverage problem: Playwright's headless default includes `--mute-audio`, even though it is not in `sparticuz.args`. The optional `audibleOutput` launch removes the **Playwright default**; default legacy probes are unchanged. New diagnostics verify actual browser command lines via `SystemInfo.getProcessInfo` + `/proc/.../cmdline`. No autoplay-policy bypass was added.
- The new real-UI diagnostic instruments actual `AudioNode.connect` requests and inserts a transparent analyser **serially in the compressor → AudioDestinationNode path**, rather than merely attaching a parallel recording bus. Native context creation must occur in an active user gesture. It checks real destination-path samples, native journey progression, mute/resume, context suspension/recovery, menu/route return and shared reel controls. This instrumentation is test-only, not a production routing change.
- A nonzero analyser before the browser destination still cannot prove an OS output device, speaker, Bluetooth/headphone route or human hearing. The automated browser uses software graphics in a sandbox; **physical audibility remains NOT VERIFIED**.

### Actual audio evidence

Both fresh browser contexts passed `scripts/diagnose-audio-output.mjs`, including direct desktop click / mobile tap on the **visible header button**, trusted gesture at native context construction, native quarter-play pause/resume using the **actual accessible Pause/Resume buttons with Enter**, master mute/unmute, forced native AudioContext suspension → real Resume control, menu/About navigation/back, reel shared mute, and native journey WebGL-loss fallback without destroying audio.

| Measurement | 1440×900 | 390×844 |
| --- | ---: | ---: |
| Native journey samples | 113 | 117 |
| Unpaused destination-path RMS range | 0.000657–0.078468 | 0.000981–0.071157 |
| Initial home destination-path RMS | 0.003892 | 0.003498 |
| Paused / master-muted RMS | 0 / 0 | 0 / 0 |
| Contexts / persistent score loops after all lifecycle actions | 1 / 5 | 1 / 5 |
| Signal after graphics-context loss | 0.002811 | 0.000856 |
| Unexpected page errors | 0 | 0 |

Actual native gain values at opt-in include master ≈0.65, music ≈0.45, active home stems 0.2 / 0.1; initial context is running. The captured native connection requests include source/gain/filter/master/compressor routing to `AudioDestinationNode`. The source audit confirms the five original loop buffers and filter/compressor chain. Native sampled stages cover solar, tesseract, white transition, blue, glass and contact; mobile sampling also catches fracture, and the engine's fracture event is observed on desktop. These values describe signal, **not perceived loudness**. Home is quiet; no blind level boost was made.

No disconnected destination or permanently zero master was reproduced in this sandbox. Neither the mobile visibility defect nor the muted **test harness** is asserted to be the root cause of the user's production silence. **Physical-speaker hearing and the user's actual device remain NOT VERIFIED / unresolved.**

For the remaining manual gate: enable sound through the header, verify the control offers Mute rather than Enable/Resume, listen through the journey on the actual system output, then test pause/resume, mute/unmute, background/foreground and reel return. If still silent, retain the browser/OS/device and output-route details; a visual waveform alone is not a pass.

## Validation

Final application source is `13e26991b37f613808f0a36b0322d898ed769486`; later commits change only diagnostics/documentation. The verified production build ID is `Gy8XUSaFS3nynOd1mUKW0`. Exact source/harness SHA-256 values are in `about-reconstruction/environment.json`. No original validator assertion/expected baseline was changed.

The baseline About was captured before rebuilding. A second original `0812b2b` archive was built separately for matched homepage checks; no Git branch was switched/created. Its nested standalone asset layout was corrected in the **temporary test deployment only**, and the fixture was moved outside the repository so ESLint would not recurse into its generated output. That transient fixture-related lint failure is not suppressed by a source/config exclusion. Production `npm run check` subsequently passed.

### Gate matrix

| Gate | Result | Evidence / exact limitation |
| --- | --- | --- |
| `npm run check` (lint + TS + production build) | **PASS** | `logs/check.log`; only existing unrelated `LusionProjectDetailView.tsx:85 highlight` lint warning remains |
| Final lint / TS | **PASS** | `logs/lint.log`, `typecheck.log`; 0 errors |
| About deterministic GPU-data / disposal unit checks | **PASS** | all 900 / 1800 / 3200 / 4800 counts, finite repeatable seeds, shared uniform packet, owned disposal, no portrait fetch |
| Existing audio / home-motion / goal unit suites | **PASS** | unchanged assertions; logs retained |
| Asset route unit checks | **PASS** | 18/18 |
| Existing whole-site QA | **PASS** | 22/22 canonical routes, expected 404s, metadata/landmarks, asset security/delivery; not a visual-fidelity certificate |
| Homepage desktop 1440 / touch-mobile 390 | **PASS**, baseline and after | Actual separate `0812b2b` build vs current branch; hover restitution (desktop), reel, featured/camera/solar/modal checks. Final later application edits were About-only lifecycle/buffer fixes; home/journey source hashes remain unchanged |
| Normal native journey 1440 / 390 | **FAIL**, unchanged baseline failure | `validate-goal-sequence.mjs:126`, `captured blue-flight pose keeps advancing`; requires >5 distinct captured blue pose values. Desktop baseline 3 / after 4; mobile baseline 2 / after 4. No expected value, density, scheduler or stage range was altered |
| Reduced journey 1440 / 390 | **PASS** | 11 states each; reverse, four handoffs, GL/assets, cleanup/failure isolation |
| Legacy controlled audio validator | **FAIL**, intentional UI-policy conflict | Original line 97 expects mobile sound button invisible (`false`); actual is now `true`. Desktop case completed and its report is retained; suite aborts on mobile. Assertion was **not** edited/skipped. New native visible-control coverage is separate |
| Audio unsupported/rejected-context browser fallback this run | **NOT VERIFIED** | old controlled suite aborts before those later browser cases; existing pure unit cases pass; no autoplay bypass was added |
| New unmuted real-UI serial-destination audio test | **PASS** | desktop/mobile; signal and lifecycle only, not human hearing |
| About real shader rendering / section coverage | **PASS** | 1440×900, 390×844, four world stages + brands/recognition/expertise/CTA/footer; zero spontaneous console/page errors or forbidden portrait/logo requests |
| About native wheel/reverse; pointer bounds/release; team / keyboard / expertise | **PASS** | real desktop wheel forward/back; mobile horizontal change and vertical 85px native scrolling with unchanged member; bounded desktop tilt and neutral reset; touch no tilt |
| About selection GPU allocations | **PASS** | seven actual UI selections: native `createBuffer` calls stay **47 → 47** at both widths; current phase stays 7.2 |
| About offscreen / overlays / reduced idle | **PASS** | counters sleep; reduced remains **1 → 1** with no pending RAF. Hidden listener tested by **event-injected** visibility, not actual OS backgrounding |
| About WebGL unavailable / mid-story loss + restore | **PASS** | real `WEBGL_lose_context` / restore; retains u≈7.2 and flow time rather than restarting; one canvas; readable injected-unavailable fallback shortens inert track |
| Actual shared footer Home → About → Projects → Home | **PASS** | desktop click/mobile tap through real portal buttons; About scene ready and context/probe released on exit |
| About navigation / resize / resource cleanup | **PASS** | native old context becomes lost on route exit; probe removed; remount one canvas; 1024×768 / 844×390 resize; post-resize Projects navigation releases old owned inspector |
| Bounded software buffer/count/draws / GL errors | **PASS** | 1800 software tier; 960×600 desktop / 390×844 mobile framebuffer; peak 14 uploaded geometries / 1 texture; GL_NO_ERROR |
| Nonblocking GPU draw-query collection | **PASS** | 32 completed samples, zero disjoints/errors; bounded ring; explicitly not whole-frame or physical GPU timing |
| 60Hz software-browser cadence | **FAIL** | measured intervals/submission rates below; no claim of fluid 60fps on SwiftShader |
| Physical GPU / RTX, actual display FPS, touch hardware, OS backgrounding | **NOT VERIFIED** | no physical device certification available |
| User's physical audibility / production silence fix | **NOT VERIFIED / unresolved** | browser signal does not prove a real speaker/output route or hearing |
| Exact full-reference fidelity | **FAIL / NOT VERIFIED** | known original-study/text/terrain/2D-CTA substitutions; current reference/video/timing unavailable |

### Practical performance evidence

Isolated untimed software-browser runs, five seconds per world stage. These are observed **RAF intervals and render submissions**, not GPU execution time or displayed FPS. Renderer: ANGLE Vulkan **SwiftShader Device (Subzero)**. No other browser acceptance job ran during these measurements.

| Viewport / stage u | Median RAF ms | P95 RAF ms | Render submissions/sec |
| --- | ---: | ---: | ---: |
| 1440×900 / 0 | 183.4 | 351.4 | 5.0 |
| 1440×900 / 1.6 | 183.8 | 339.1 | 4.8 |
| 1440×900 / 5.35 | 250.0 | 299.8 | 4.0 |
| 1440×900 / 7.2 | 50.9 | 68.0 | 19.6 |
| 390×844 / 0 | 162.5 | 186.5 | 6.2 |
| 390×844 / 1.6 | 153.6 | 315.9 | 6.0 |
| 390×844 / 5.35 | 197.8 | 252.7 | 5.6 |
| 390×844 / 7.2 | 32.9 | 43.5 | 29.8 |

Hero field: 2 draws, 144,000 instanced triangles plus 600 dust points in this software tier. Landscape: 12 draws, 185,978 triangles. Narrative: 1 contour-line draw; team: 2 line/point draws. Fixed counts and sleeping are verified, but the software cadence is plainly not a smoothness pass. No automatic journey culling/scheduler experiment was performed to change its acceptance outcome.

A **separate instrumented** native `TIME_ELAPSED_EXT` probe at desktop u=1.6 completed 32/64 submitted **per-draw** samples (32 still pending at context close, bounded ring capacity 32; zero disjoints/errors). Median sampled draw: **0.497ms**; P95 **156.269ms**. Many draws were intentionally unsampled while the ring was full. These are software-backend draw-query samples, **not whole-frame GPU time**, CPU call time, physical-GPU performance, compositor/display latency or FPS. Do not sum/average them into a fabricated full-frame certification. Raw results and issued/skipped counts are retained in `metrics/gpu-draws.json`.

### Evidence and reproducibility

`about-reconstruction/` contains compact requested deliverables, not proprietary reference assets:
- `after/`: 18 viewport milestone JPEGs, two true full-page JPEGs (1440×20377 and 390×18301), readable fallback, two interaction MP4s.
- `before/`: same baseline hero/valley states at both viewports. Existing historical reference files remain where they were, not recast as fresh live captures.
- `metrics/`: About/reduced/fault/resource reports, actual audio path/launch data, baseline/after home and journey reports, isolated cadence, asynchronous draw queries and CDP recording timestamps.
- `logs/`: exact final build/static/unit/browser outcomes, including unchanged red gates.

Recordings contain **21 actual CDP frames each** over 5.259s / 5.123s; native-position milestone seeks, pointer movement and the real team control are demonstrated. Frames retain their observed timestamp spacing, with no invented 60fps interpolation. They are not physical-touch footage or smooth wheel/display cadence certification. Raw frame folders stay local/ignored. Encoding used the available external FFmpeg 4.1 `-vsync vfr` equivalent; the existing encoder's newer `-fps_mode` switch was unsupported by that binary. No application dependency was added.

During harness development, incorrect assumptions about an `elapsed` telemetry field, a global Space-to-pause shortcut, initial reel mute state, neutral CSS transform serialization and scene readiness were corrected to match the **existing actual APIs/UI**, not by weakening old validators. Chromium locator auto-scroll after screenshots also shifted sticky controls backward by 776px per click; native-coordinate mouse/touch reproduction kept y=10368/u=7.2, so the new selector test uses that genuine input path and retains explicit selection/phase/buffer assertions. Production scroll behavior was not changed to accommodate the automation artifact.

```sh
npm run check
node scripts/test-about-plume.mjs
CHROMIUM_MULTIPROCESS=1 ABOUT_RECORD=1 node scripts/validate-about-experience.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/diagnose-audio-output.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/capture-about-budget.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/measure-about-gpu-draws.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-portals.mjs
HOME_VIEWPORT_WIDTH=1440 node scripts/validate-home-motion.mjs
HOME_VIEWPORT_WIDTH=390 HOME_TOUCH=1 node scripts/validate-home-motion.mjs
GOAL_VIEWPORT_WIDTH=1440 GOAL_MOTION=normal node scripts/validate-goal-sequence.mjs # known FAIL
GOAL_VIEWPORT_WIDTH=390 GOAL_MOTION=normal node scripts/validate-goal-sequence.mjs  # known FAIL
GOAL_VIEWPORT_WIDTH=1440 GOAL_MOTION=reduce node scripts/validate-goal-sequence.mjs
GOAL_VIEWPORT_WIDTH=390 GOAL_MOTION=reduce node scripts/validate-goal-sequence.mjs
node scripts/validate-journey-audio.mjs # intentional mobile visibility assertion conflict
node scripts/qa-verify.mjs
```

No normal-journey or old audio acceptance predicate was relaxed. The reported failures remain failures.

## Delivery

No automatic merge. Runtime source commit: `13e2699`; final diagnostic commit: `e31611f`. The final documentation/evidence commit and draft PR are reported with delivery. See the source specification, this report and `about-reconstruction/` evidence. Raw captures, package/binary tooling and baseline build fixtures remain outside tracked deliverables; only requested compact evidence is retained.
