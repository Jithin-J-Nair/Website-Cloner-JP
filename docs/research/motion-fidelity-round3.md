# Whole-site motion fidelity — next evidence-first pass

## Baseline and references (before implementation)

Clean `a70cf62`, active session branch. Production 3003 still serves build `yGnDAfDwlNhcmDxISwXEQ`, verified in the preceding pass; no server restart yet. Read AGENTS and installed Next CSS guidance. Reopened the supplied About/Projects video sequences and extracted/reviewed full About frames at 30s and 32s. Fresh **normal-motion** production About captures at section progress 0/.35/.66/1 are in ignored `temp/motion-fidelity-round3/`. These have actually been opened, not inferred from successful screenshots.

Fetched current live About text as a content cross-check, not rendered-animation proof. Inspected archived native `AboutCapabilitySection`, `Line`, `ProjectDetailsScreen`, `Blur`, `ScrollDomRange`, Ufx geometry and CSS; archived JS is inspection evidence, never executed as the app. Prior all-22-route/44-viewport observations remain in round two. No claim to have compared every animation frame or a fresh live WebGL render.

## Differences established before editing

| Surface | Difference / evidence | Planned correction |
|---|---|---|
| About expertise ribbon | Current single SVG arc has a blunt round leading tip, fixed stroke width and global translate/rotation. Native uses **two encoded line buffers**, diagonal-relative width, vertex reveal/coverage/self shading and a moving end cap; line capability and line office have different margins and scroll ranges. 32s reference shows an extended broad white sweep behind the cards, not a generic diagonal. | Use the existing native ribbon shaders with the actual two buffers. One section owner supplies scroll/time; no extra per-ribbon loop. Optional failure leaves readable cards. |
| About expertise card motion | Current authored smoothstep deck/fan/settle curves, additional pitch/yaw/scale, sticky 360svh stage (the 310svh global rule is overridden on About) and min-1000/min-height condition differ from source's viewport range, exponential lateral spread, back-in-out staggered turns, cosine idle bob, source pin offset and 812px breakpoint. | Replace these invented curves/layout with isolated source-derived functions and measured native flow. Preserve card artwork, controls, keyboard access and reduced readable layout. Native back easing intentionally overshoots; monotone authored-curve assertions are not suitable evidence. |
| All 19 case-study shadows | Plant deformation/positions/delays are already present, but a combined 25-tap screen-space blur is used. Source performs sequential in-place 9-tap separable blurs at radius/scale **(2,1), (4,.5), (4,.75)**, copies one RGB channel after each pass, and projects through the shadow-camera inverse matrix with image-alpha depth. Source Ufx world coordinates are **0..1** before DOM scaling, not viewport pixels. | Port the inspected channel pipeline/projection, native noise jitter and dt-based camera following. Keep gallery DOM/media, input/navigation, fonts and source metadata unchanged. |
| Home later acts | Broad suite still fails an existing synthetic vortex-intensity expectation. Current runtime is source-derived and uses different native phase/telemetry contracts. | Diagnose code/reference/phase first; do not tune approved tunnel merely to satisfy a stale implementation assertion. Record any unresolved gate. |
| Home opening, Projects archive, About hero/awards/CTA | Recently approved/reference-derived work exists. Video phases differ from static observations; arbitrary particle additions would be incorrect. | Protect with focused production regressions, not wholesale redesign. |
| Shared menu/footer/transitions; utility routes | Rendered reference coverage is incomplete; Contact/Labs/utilities are outside the 22-route source manifest. | Inventory as unverified, not exact. Do not silently invent unseen choreography or change allowed fonts/custom branding. |

## Implementation and results

### Shipped corrections

**About expertise** now uses the actual `line_capability.buf` and `line_office.buf`, existing native coverage/gradient/self-shading shaders and interpolated moving end caps. The original two paths retain their separate diagonal scaling/margins and quad-in-out scroll ranges. The single source-derived section owner also drives measured-flow cards: native viewport range, exponential spread, back-in-out turns, ±13.5° roll, cosine bob, source pin-offset equation, 812px breakpoint and per-card mobile cubic turns. Removed the invented yaw/pitch/scale deck and single generic SVG stroke. Source-sized/aspected cards, dotted separators and title-word entrance are scoped to this section. Retained actual card art, permitted recolor, existing controls and keyboard access. Live reduced mode reads all four fronts without idle animation; mobile has no ribbon context. Optional ribbon failures never remove the semantic cards.

**All 19 case pages** use sequential separable nine-tap blurs and individual RGB snapshots, native plant-camera projection with image-alpha-dependent depth, real blue noise and signed velocity smear. Camera follow uses supplied dt; three plant depth positions/delays are retained. Prevented the renderer's automatic clear from erasing earlier RGB snapshots and restore color-mask/auto-clear state even if a pass throws. Kept the existing gallery/media/navigation. The final compositor remains transparent/unpremultiplied to coexist with Next/DOM text and preview panels, rather than copying an opaque full-page canvas over them.

No global color-management change, asset/font allowlist change, dependency addition, metadata/SEO edit, branding replacement or approved Home/tunnel/hero/awards/CTA renderer retune.

### Visual evidence actually reviewed

Opened new normal About captures at 1440×900 and at **1440×764** (close to the supplied recording's application aspect after excluding browser chrome). Reviewed native heading/deck/turn/front states and compared the third-card-edge phase against the 32s video frame: white arc now extends behind the staggered front/edge/back composition instead of ending as an arbitrary round SVG tip. Native back easing correctly overshoots 180° before turns; the third edge is at native range **-.11**, not old authored progress .66. Reviewed production desktop turning cards, mobile service card and Atlas gallery after the final build. These are qualitative, phase-aware comparisons, not a synchronized pixel score or licensed-font match.

Production browser isolation found **57,940 / 13,223 changed RGB components** when showing/hiding the loaded ribbons at the 1440×764 / 900×600 turning phase while the injected visibility guard froze the bob. These counts demonstrate actual rendered contribution, not only a “ready” dataset. They are color-component counts, not pixel counts, FPS or visual similarity scores.

### Actual final production gates

Preview **3003**, process `website-cccae933`, Next build **`_pEjBsboYuhIHZPo99h4k`**, built from `a70cf62` plus this round's working patch. All **22 canonical HTML responses** matched generated build HTML exactly. **27 unique served JS/CSS assets** matched the `.next` bytes; hashes are in ignored `temp/motion-fidelity-round3/production-build.json`.

| Gate | Actual result / scope |
|---|---|
| `npm run check` | PASS: lint, strict TypeScript and production build. Final test/script-only refinements checked again separately. |
| Native expertise numerical suite | PASS: viewport-range endpoints, native pin continuity, line endpoints, exponential spread, bounded overshoot/continuous sampled slopes, golden third-edge phase, deterministic reversal, live bob, mobile cubic turns and real art/buffer contracts. Replaces obsolete smoothstep/yaw/scale/monotonic-turn assertions with source contracts, not fewer meaningful tests. |
| Native shadow isolation | PASS with renderer double: 3 depth layers, exact six blur-pass order/scales/deltas, channel snapshot order, in-place writeback, image-depth and pointer matrix response, GL state restoration after injected failure and idempotent target disposal. This is numerical/order/resource verification, **not GPU pixels**. |
| `validate-about-expertise.mjs`, base 3003 | PASS: normal 1440×764 and short-desktop 900×600; real two-buffer/visible-ribbon contribution; golden stagger, live bob and reverse; keyboard focus to readable fronts; live reduced/resume; menu/offscreen/injected-document-visibility pause; actual context loss/recovery; missing-line failure and route cleanup. Mobile 390×844: all four cards turn/read, no idle ribbon context or overflow. |
| `validate-case-study-motion.mjs`, base 3003 | PASS: **38** route/viewport layouts, canonical media/next chain, panel/end positions, actual native projected pipeline/noise + GL NO_ERROR, normal film composition, menu pause/resume, reduced sleep, context-loss DOM fallback and forced fallback. |
| Case navigation / media / text | PASS: actual drag/click separation, keyboard next and owner cleanup, wheel charge/morph/navigation, reduced no-auto-next, 812/813 reversal; desktop/mobile film source/playback, keyboard modal seeking, modal/offscreen pause; visible source text on Of The Oak and Worldcoin at both sizes. |
| Protected Home hero | PASS: 24/22 native assets, ray displacement/release/cancel, keyboard, idle momentum, menu/offscreen sleep, reduced freeze, breakpoint replacement and context/forced fallbacks. |
| Protected Home editorial | PASS normal 1440×764: native line/morph, film/depth pixels, all cards/links/modal, cleanup and optional-asset/context-loss isolation. |
| Protected Projects archive | PASS normal 1720×912: 19 depth images/links, glyph/CTA atlas pixels, gestures/keyboard, context recovery, sleep and cleanup. |
| Protected About CTA | PASS normal 1720×912, 1568×1230, 390×844: held/moving pour/release, click/keyboard, cancellation, visibility/menu/offscreen sleep, context recovery, reduced and no overflow after the upstream flow change. |
| `audit-site-fidelity.mjs`, `AUDIT_PHASE=round3-motion` | **44 observations** / 22 canonical routes at 1440×900 and 390×844: **0 uncaught errors and 0 horizontal overflow**. Capture policy is reduced motion; not 44 reference-matched moving comparisons. |
| Existing unit/data suites | `test:projects`, `test:motion`, `test:home-editorial`: PASS. Existing legacy capsule checks remain distinct from native solver coverage. |

The production series above ran serially against the final app build (1044s total sandbox command). Generated screenshots/reports/logs stay ignored under `temp/`; no physical GPU/phone or hardware frame-rate claim is made.

### Legacy Home gate diagnosis — not silently made green

The broad Home integration suite's previous failure remains recorded; it was **not rerun or weakened** in this round and Home later-act application code is unchanged. Inspection establishes a source-contract mismatch: `goalWorldRatios` maps tunnel to `black = clamp(tunnel/.815)` and `transform = 1-cos(clamp((black-.6)/.4)*pi/2)`. Thus tunnel .58 yields transform approximately **0.095**, not the old test's >.18; .73 yields about **0.602**, not >.82. The runtime deliberately reports zero synthetic cage layers/edges, zero sidewalls/thickness and non-depth-writing native shards; later old assertions explicitly require those removed approximations. This diagnoses why arbitrary vortex-intensity retuning would be wrong. It does **not** turn the broad suite into a passing result or certify downstream pixels. Its future replacement needs native geometry/motion/pixel gates, not deleted checks.

### Still not an exact-clone certificate

- Native choreography is adapted to document/Lenis scroll and Next lifecycle, rather than executing the old global page manager. About title entry is viewport-triggered; optional WebGL/reduced states are intentional accessibility adaptations. Idle bob/noise/film frame histories and end-cap rasterization are not synchronized with the recordings.
- Case panel reveals, page-readiness/highlight behavior and preview-to-next background mixing remain adaptations. RGB shadow/projection is now source-derived, but no fresh live-case WebGL recording was available to certify every shadow/media frame.
- Shared menu/footer/route-transition choreography and the utility/contact/labs pages do not have complete rendered reference evidence. The 22-route total covers the original Home/About/archive and 19 reference cases, not those utility pages.
- Commercial font Option 2 and pre-existing customization remain deliberate differences; changing those without approval would violate the standing policy.
- The approved About hero/terrain/team/awards and Home later acts were preserved, not newly certified all-frame equal by regression success.

The next work should target shared transitions/readiness and native downstream acceptance, with matched-motion references, rather than another global styling retune.
