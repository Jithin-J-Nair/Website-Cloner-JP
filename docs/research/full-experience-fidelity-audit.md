# Full-experience fidelity audit

**Audit baseline:** application commit `203e5a6`, production preview on port **3003**, Next build **`TZ8s1xwpgRD_kZgq9MSFp`**. This is an **audit and implementation specification**, not another application-remediation release. No application source, approved scene, branding, font policy or running server was changed in this pass.

## Executive finding

The largest remaining perceptual difference is **how a project opens**. The build has real depth-map hover effects, but clicking a Home/archive card still invokes the **generic route aperture**. The inspected reference has a separate selected-project transition: the **whole project-list coordinate system recentres, scales and tilts around the selected image**, while that image enters a much stronger depth/fog state. The destination and reverse transition participate in the same page lifecycle.

This is not fixed by increasing hover zoom, scaling an HTML screenshot, adding particles, or moving a camera straight forward. The underlying depth shader already contains much of the necessary selected-state shading, but the selection/lifecycle input and list transform are missing.

The second important mismatch is continuity: the build's Back control always returns to `/projects` at the top. A freshly observed **Home → Oryzo → Back** also returned to `/projects`, losing its Home origin. The reference remembers the last non-project page and reverses into its selected card.

### Recommended order

1. **P0 — selected-project opening and reverse:** one source-aware route transaction, live selected depth mesh, native list transform, renderer-ready handoff and source restoration.
2. **P1 — case choreography:** lifecycle-driven metadata/title entrance, gated scroll, consistent clicked/scroll-triggered next-project morph and destination continuity.
3. **P2 — remaining shared polish:** real cold-load progress/rolling digits, source footer entrances, residual menu/header differences, card fallback/hover styling, matched-phase lighting/paint review.
4. **Evidence work, not speculative retuning:** synchronized normal-motion reference captures and native downstream regression coverage. Preserve the praised Home/About/Projects scenes unless those comparisons establish a discrepancy.

“P0” here means highest fidelity priority, not a claim that navigation is broken or data is at risk.

---

## 1. Evidence and what it can establish

| Evidence | Used for | Limits |
|---|---|---|
| **E1 — supplied videos:** `public/videos/Lusion-home.mp4`, `Lusion-about.mp4`, `Lusion-project.mp4`, and `2026-11-06 17-30-56.mp4` | Visible scene identity, composition, sequencing, scroll-driven effects and the approved visual direction. Fresh Home/About/Projects overview contact sheets were generated and opened. Earlier detailed About/scene comparisons are linked below. | Sparse overview frames do not establish easing or full temporal equality. The sampled Projects overview shows archive scrolling/contact, **not a clicked-project opening**. Do not present the zoom equations below as measured from that clip. The About video does not establish footer parity. A filename is not an audit-date authority. |
| **E2 — archived reference source/CSS** | Selected-card geometry, page-manager relationships, shaders, native durations, reveal windows, menu/footer/loader behavior. Inspected as text, never executed as this application's runtime. | Archive constants are a technical reference, not certification that every constant remains identical on the current live website. |
| **E3 — live page text** at [Home](https://lusion.co/), [Projects](https://lusion.co/projects), [Atlas](https://lusion.co/projects/atlas_motion) | Content/order cross-check, canonical routes and next links. | Successful text fetches are **not** rendered live WebGL inspection. No fresh synchronized live/reference click film was available in this pass. |
| **E4 — fresh served-build opening probe** | Three normal-motion click flows, actual captured click timestamp, route phases, selected DOM bounds/focus, screencast frames, opened/back states, browser exceptions and failed HTTP responses. | Chromium uses software graphics; mobile is emulated. Sampling is bounded and can be sparse under software rendering. DOM bounds alone cannot establish GPU geometry, visual equality or hardware frame rate. |
| **E5 — fresh canonical route capture** | All **22 canonical routes × 2 viewports = 44 observations**; route openings and selected section bands. | Deliberately **reduced-motion** captures. Not 44 moving reference comparisons, every media frame, or every pointer/scroll history. |
| **E6 — prior final-build regression** | The existing final serial round-four navigation, utility, layout, media, Home, Projects and CTA regression results for this unchanged application build. | Historical execution on this build, not a newly rerun full regression in this audit. Functional success does not imply fidelity. |

**Reference provenance:** repository [quangminh1212/Design_Lusion.co](https://github.com/quangminh1212/Design_Lusion.co), `_astro/hoisted.CUO_IjfL.js`, Git blob `0c57277a2102a61f761357ce2cd432d035cd0a13`. Local inspected/pretty-printed file: `temp/preview-recovery/inspection/reference.js`; accompanying `reference.css`. Line ranges below refer to that **local inspection file**, not original minified GitHub line numbers. Generated captures and inspection binaries remain ignored under `temp/`.

### Fresh results

The served **22 HTML responses and 27 JS/CSS assets** were hashed again and all matched the shipped round-four fingerprint. This avoids auditing a stale port or assuming the checkout identifies the running application.

| Actual click flow | Viewport | Observed result |
|---|---|---|
| Archive → Atlas Motion → Back control | 1440 × 764 | Generic transaction phases observed; selected source DOM width ratio **1.00–1.00** during connected post-click samples; correct case opens; Back returns to `/projects`, scroll Y **0**. |
| Home featured → Oryzo AI → Back control | 1440 × 764 | Generic transaction phases observed; selected source DOM width ratio **1.00–1.00**; correct case opens; Back returns to **`/projects`**, scroll Y **0**, not the originating Home card. |
| Archive → Atlas Motion | 390 × 844 | Generic transaction phases observed; selected source DOM width ratio **1.00–1.00**; correct case opens. Mobile reverse was **not exercised** by this probe. |

All three flows recorded **zero uncaught browser errors and zero HTTP responses ≥400**. The lack of selected GPU zoom is established by the **active source together with these observations**, not by unchanged DOM width alone. The source sampler ends 14 seconds after the actual click; the screencast/readiness wait is separate. Do not infer complete desktop phase timing from the sampled rows or wall-clock software-rendering durations.

Fresh 44-route captures: **zero uncaught errors, zero horizontal overflow**. This is an observation inventory, not an assertion that the capture harness enforces reference parity.

Repository checks after the documentation/probe changes: **ESLint PASS, strict TypeScript PASS, probe syntax check PASS, diff whitespace check PASS**. No application rebuild or server restart was needed; the prior full regression was not rerun or represented as newly passing.

Evidence locations:

- `temp/project-opening-audit/current/report.json` and each scenario's `before.jpg`, `opened.jpg`, desktop `back.jpg`, `recording.json` and screencast frames.
- `temp/project-opening-audit/served-identity.json` — fresh baseline-hash comparison.
- `temp/site-fidelity-audit/opening-audit/report.json` and route captures.
- `temp/project-opening-audit/{home,about,projects}-video-overview.jpg`.
- `temp/motion-fidelity-round4/production-regression.log`, `production-build.json` and the linked [round-four report](motion-fidelity-round4.md) — prior full regression, not a new run.

---

## 2. Project opening: precise discrepancy and reconstruction specification

### F01 — P0 / confirmed: selected-project transition is not connected

**Current active path**

`FeaturedProjectCard.tsx` → `TransitionLink.tsx` → `route-navigation.ts` → `RouteTransitionMotion.ts` / `PageTransitionCurtain.tsx`.

Both Home and archive use this shared card. The transaction request has only `href`, `label` and `commit`; it has no selected ID, originating list, list transform or handoff state. The Home and archive compositors initialize `u_activeRatio` to **0** and do not drive it from a selected-project transition. `u_zoomRatio` follows the hover spring. Their vertex placement is a viewport-aligned reconstruction, not the reference's nested project-list pivot/group transform.

The generic shell sets `isTransitioning`, which also pauses scene owners. That is appropriate for an opaque generic transition but would freeze the **very source compositor needed to perform a selected-image zoom**.

**Reference mechanics — E2**

- `ProjectItemList`, local lines **33041–33174**.
- `HomeFeaturedSection`, **33259+**, and `ProjectsMainSection`, **44903+**: list `zoomRatio = fit(listingPage.activeRatio, 0, .75, 1, 0)`.
- `ProjectItem`, **32774–33035**: selected item consumes list zoom; active shader input is the **square** of its selected active ratio.
- Home/Projects page lifecycle, **39513+ / 44980+**: known list → case uses **1.5-second outbound hide**, **without** the generic overlay. Reverse into an already-shown eligible listing uses **1.5 seconds** too. These are lifecycle durations, not a claim that every visual sub-effect is a linear 1.5-second scale.

For selected card dimensions `cw,ch`, viewport `vw,vh`, list zoom `z`:

```text
u       = cubicInOut(z)
cover   = max(vw / cw, vh / ch)
scale   = mix(1, 1.2 * cover, u)
p       = vw/2 - cardDomX - cw/2
q       = vh/2 - cardDomY - ch/2 + scrollPixel + capturedOffsetY
pivotX  = p - p*(1-u)/scale - vw/2
pivotY  = -q + q*(1-u)/scale + vh/2
rotateY =  u * .3 * p/vw
rotateZ = -u * .3 * p/vw
```

Apply this to the reference-equivalent **nested list coordinate system**, including its outer/inner viewport-centering offsets and DOM-to-world Y sign. Do not apply the pivot numbers directly to the anchor's CSS transform. The whole list moves/scales; the selected item has the strong active shader response. Neighbour behavior must follow this shared transform rather than arbitrary individual fade-outs.

The selected image clears pointer-derived X/Y focus, targets focus Z **.5**, and keeps the zoom spring active. Preserve inspected focus spring parameters **(1, .6, 2)** and zoom **(2.2, .7, 3)**, subject to the existing bounded integration. The existing fragment shader already contains:

```text
selectedState = selectedActiveRatio²
zMultiplier   = cardHeight * (.15 + selectedState * 15)
cameraDepth   = cardHeight * mix(10, 5, hoverOrSelectedZoom)
```

It also contains depth-sensitive blending into `colorBg`. Consequently the reference handoff is **not necessarily the thumbnail becoming the first gallery film**; the selected depth/fog/color and destination page lifecycle must agree. Preserve 12 parallax / 6 blur samples and the native depth-map orientation. Do not double-square the shader input or use group-scale progress as an unqualified replacement for selected state.

**Required fix:** introduce a selected-list transition mode through the existing route owner, supply these lifecycle inputs to the **existing** Home/archive compositor, and keep that compositor alive until the destination can take visual ownership. An HTML image-clone fallback is acceptable when GPU/depth fails, but is not normal-motion parity.

**Acceptance:** a real click on left/right-column and deeply scrolled cards visibly recentres/enlarges the selected depth image; list tilt changes with horizontal origin; no generic XOR aperture is painted over a supported selected-list transaction; no stale hover focus, clipping, duplicate image or jump at ownership transfer. Capture the list group matrix and selected shader inputs as well as actual pixels.

### F02 — P0 / observed + source-confirmed: origin-aware reverse/return is missing

**Current:** `StudioHud.tsx`'s project Back handler navigates to `/projects`. The two desktop probe flows both returned there at scroll zero.

**Reference:** `ProjectPage.prevNonProjectPath` remembers the last non-project path; case→case does not replace it. The Back action uses that path or `/` when none exists (**39076–39102**, **39333+**). An eligible returning Home/archive sets the selected card and scrolls it to **card top − .25 × viewport height** before its reverse transition (**39513+ / 44980+**).

**Required fix:** retain the originating non-case route and selected ID across the case chain. Restore the eligible list's card-relative position and reverse selected state. Do not use unconditional `router.back()`—direct loads, external history and unrelated prior entries make it unreliable. Keep explicit direct-entry fallback behavior; source fallback is Home. A stored raw scroll offset may aid cancellation/history, but **native successful reverse placement is card-relative**, not necessarily the exact pre-click Y.

**Acceptance:** Home→case→case→Back returns into the correct Home card; archive→case→Back returns into that archive card; refresh/direct entry has a deterministic fallback; normal browser Back/Forward, interrupted navigation, viewport changes and absent cards never leave an overlay/input lock. Test mobile reverse separately; this audit did not certify it.

### F03 — P1 / source-confirmed: destination entrance uses a different clock and reveal windows

`CaseStudyMotion.ts` currently uses `enter = clamp(localActiveTime / 1.5)`, with a common `expoOut` movement helper and delays **0 / .2 / .25 / .3 / .35** for title/description/CTA/services/links. The title is another 30px reveal, rather than a centre-to-layout title placement. The existing **scroll divisors are already substantially correct**; do not replace them with a uniform pan.

Reference `ProjectDetailsSection`, **39125–39320**:

| Field | Native content ratio window | Curve / displacement | Current difference |
|---|---|---|---|
| Title | **0 → .65** | `expoInOut`, measured centre offset → layout; scroll X / **2** | Common `expoOut`, 30px entrance, different range; no centre-offset continuity. |
| Description | **.4 → .85** | `expoOut`, 30px → 0; scroll X / **3** | Starts at .2 in the local normalized entrance. |
| Launch CTA | **.45 → .9** | `expoOut`, 30px → 0 | Starts at .25. |
| Services | **.5 → .95** | `expoOut`, 30px → 0; scroll X / **5** | Starts at .3. |
| Links | **.55 → 1** | `expoOut`, 30px → 0; scroll X / **4** | Starts at .35. |

The reference also derives disclosure `c = fit(showRatio*(1-hideRatio), .5, 1)`; gates scrolling until **contentShowRatio > .75** with `nextProjectRatio == 0`; resets its pane before that gate; and combines metadata fading with the first **.25 viewport** of travel and the next-project phase. The current local entrance is not a substitute for that lifecycle.

**Required fix:** drive `showRatio`, `hideRatio`, `contentShowRatio` and next-project progress from the transaction's actual preparation/disclosure states. Measure title offsets after responsive layout/font settlement. Adapt gating to the existing document/Lenis owner—**do not add a nested scroll pane or second smoothing loop**. Treat desktop horizontal and mobile vertical layout separately.

**Acceptance:** matched normalized-phase captures show correct centre/title settling and metadata order; wheel/drag during early disclosure cannot advance into invisible gallery content; reveals do not finish unseen behind the generic cover or restart at commit; reduced mode stays immediately readable.

### F04 — P1 / source-confirmed: next-project entry has inconsistent activation paths

The scroll-triggered case transition already has a one-second preview morph and late color mixing. Preserve it. However, the explicit next-project title in `LusionProjectDetailView.tsx` is a regular `TransitionLink`, so a **click** takes the generic aperture path instead of the same case→case morph. Reference `ProjectPage.show` specializes any same-project-page transition (**39350+**), then reveals new content after its preview morph.

Current preview title offset, page replacement, visibility reveals and screen/background mixing remain adaptations. Reference **39170–39245** translates the preview with `quintInOut`, interpolates its inner offset, mixes title color over **.75→1**, updates a preview background threshold in the screen compositor, and interpolates shadow state.

**Required fix:** make explicit click/keyboard activation and end-scroll completion request the same case→case transaction. Carry the destination preview's measured geometry/theme into the new case; then run the native content reveal rather than restarting an unrelated generic entrance. Keep **3/s charge, −5/s reversal, −.2/s decay** for the case end, distinct from the **2/s** chapter portal rule. Do not overlay generic and specialized transitions together.

**Acceptance:** explicit next click, Enter and sustained end input reach identical morph endpoint/next route; no double push; old compositor/resources are disposed after ownership transfer; case-chain Back retains its original listing; slow load, missing media and reverse input recover correctly. This branch was identified from active source, not newly exercised for every case in this pass.

### Implementation architecture for F01–F04

Use the persistent shell's **existing single transaction owner**; do not mount the unused `TransitionProvider` as a second controller.

1. **Classify:** `generic`, `list-to-case`, `case-to-list`, `case-to-case`. A list specialization is eligible only when that list actually contains the destination and has a usable measured source. Direct/cold/unrelated entry retains generic navigation.
2. **Capture an immutable request:** transaction ID, source route/list identity, selected project ID, viewport/DPR, selected bounds, scroll/card-relative offset, theme and source renderer state. Keep the last non-project route across case→case. Do not put Three resources or large media data in URL/history/store serialization.
3. **Prepare:** prefetch the destination and decode required visible media/depth assets through current allowlisted endpoints. The current generic readiness checks fonts/visible DOM images; it does **not** certify selected depth textures, plant buffers or a first destination GPU frame.
4. **Outbound:** freeze user scroll and semantic activation, but allow the participating source renderer to tick. Pause unrelated scenes/media. A phase/participant-specific permission is needed instead of globally freezing everything with `isTransitioning`.
5. **Bridge Next ownership:** App Router replaces route subtrees; a source RAF cannot assume its canvas survives `router.push`. Retain the participating renderer/texture lifetime in a shell-owned handoff surface, or retain its composited output until the destination's first valid frame. A final-frame snapshot may bridge preparation, but must not replace the live outbound depth animation. Preserve color-space, alpha, cover UVs, crop and z-order across this bridge.
6. **Disclose:** destination confirms DOM layout plus its usable graphics/fallback state. Consume the matching lifecycle progress; remove the bridge only after visual ownership is valid. Keep bounded readiness/error recovery, not an indefinite loader.
7. **Finish/cancel:** restore inert/aria-busy/focus, release input, clear participant permissions, and dispose retained resources exactly once. Pre-commit cancellation can reverse the source. Post-commit Escape cannot undo a Next request already in flight; allow late route delivery without resurrecting a stale overlay.
8. **Reverse:** resolve origin eligibility, measure at the restored responsive layout, position the selected card at the source quarter-height anchor, and reverse the same transform/depth state. Missing origin/assets use the generic/readable fallback.

This is a proposed implementation, **not code shipped by this audit**.

---

## 3. Whole-site effects inventory and remaining work

Status key: **Confirmed** = active implementation/source discrepancy; **Observed** = fresh served browser result; **Calibration** = existing adaptation or visual risk without a new matched-motion failure; **Protected** = present/approved, not to be rewritten speculatively. Earlier reports describe historical baselines; their once-missing effects are not automatically still missing.

| ID / priority | Surface / effect | Current assessment and precise next action |
|---|---|---|
| **F05 / P2 — Confirmed** | **Cold loader / all cold entries** | `Preloader.tsx` advances a synthetic **460ms** progress curve, schedules finish after **60ms**, then fades/scales a static mark. Reference **50340+** ties progress to asset/init work, minimum preload **1s**, init contribution **30%**, minimum init/start **.25s**, rolling-digit damping `1-exp(-7dt)` and a completed-bar/exponential transform. Implement progress from real required tasks, rolling number strips and the native bar/aperture handoff; keep Skip, warm-session and reduced behavior. Do not report simulated percent as GPU readiness or promise to await every optional media asset. |
| **F06 / P2 — Confirmed** | **Footer editorial motion / Home, About, archive** | `StudioFooter.tsx` has semantic content/portal but no native grouped line/word reveal owner. Reference **36257+** uses line staggering **.1**, travel **1.5em**, word travel **100%** with **.6** duration, and up-button delay/duration **.3/.3**. Add scoped, reversible viewport-driven wrappers with the existing scroll source; visible static reduced mode; preserve all form/link behavior. Footer animation is source-backed, **not certified by the About film**, which does not show it. |
| **F07 / P2 — Confirmed** | **Menu backdrop / shared chrome** | Round four already corrected major card distances/tilts/staggers; do not redo them. Residual `StudioHud.tsx` backdrop is a **300ms** opacity transition with a desktop half-screen gradient from **813px**, mobile blue fill. Archived header/CSS uses desktop background opacity **.2** at its **1000px** layout boundary versus mobile **1**, **400ms** behavior and a closing delay. Compare/reference the 813–1000 interval and open/close direction; restore source backdrop composition/timing with scoped rules while retaining the focus trap, Escape and accessible controls. No evidence supports adding menu particles. |
| **F08 / P2 — Confirmed, low visual priority** | **Card DOM fallback / hover polish / Home and archive** | Shared card adds rest/hover CSS shadows, including a blue hover shadow; archived `.project-item-main` has no equivalent box-shadow and `.project-item-image` uses **`object-fit:contain`**, versus current **cover**. The depth compositor normally owns the visible image, so this primarily matters during loading/failure and around edges. Remove unsupported decorative shadows and align fallback fitting **after checking actual asset aspect/crop**. Preserve the native shader DOF and semantic image fallback; do not replace hover depth with CSS enlargement. |
| **F09 / P2 — Calibration** | **Case media screen / all 19 cases: velocity, foliage, lighting/depth** | The former missing RGB foliage projection is **already implemented**, including three delayed plant layers and sequential channel blurs. Do not report it missing again or replace it with a flat shadow. Remaining panel reveal/readiness, blue-noise/highlight behavior and full screen/preview composition need normal-motion comparison at opening/interior/end. Match velocity impulse/decay, leaf silhouette/softness and color against synchronized source; retain fullscreen/text panels and native axes. Touch/pointer control and image/video decode phase must be identical before judging a difference. Owners: `CaseStudyMotion`, `CaseStudyGraphics`, `CaseStudyShadows`, `CaseStudyShaders`. |
| **F10 / P2 — Calibration + known adaptation** | **About hero: fog contact, terrain/rock shadow, optical grading** | The native world/particles/terrain/person assets are present. `AboutReferenceWorld.ts` still has a simplified fog fragment and placeholder white `u_groundShadowTexture`, alongside the person shadow texture; the source dynamic light/shadow/depth-soft fog pipeline is not fully reproduced. Compare rock-ground contact and fog/geometry intersection at matched scene ratios before changing the praised lighting. If visible, introduce the missing depth/light prepass and soft-particle depth term under the same owner, preserve the opaque final display, and isolate quality/fallback variants. Do not “fix” this by globally darkening or increasing fog. |
| **F11 / P2 — Calibration** | **About camera/wordmark/team/title handoffs** | `AboutPageView`, native world/team/wordmark modules and source-informed editorial motion are active; some camera/pointer and title-entry windows remain locally adapted. Validate camera asset sample, orientation, focal framing, wordmark crossing and team glyph→portrait/drag-arrow state against matching scroll/time/pointer history. Correct only a measured local mapping/offset. Preserve source models and approved composition; no replacement particle cloud or new camera path without evidence. Mobile behavior has no complete authoritative film. |
| **F12 / P2 — Calibration** | **About recognition: paint/advection and title motion** | Vector title, source row motion, colored face/edge paint and editorial reveals are present. Its local separable feedback/hash dithering differs from the source shared blur/bicubic/blue-noise infrastructure. Capture identical pointer sweeps and decay intervals; only then replace the remaining filter/noise stages if their effect differs. Do not call this a missing particle emitter: it is screen-space paint. Preserve the approved awards layout, source artwork and reduced static surface. |
| **F13 / P2 — Calibration / Protected** | **About expertise: ribbons, card spread/flip, bob** | The previously incorrect generic arc/card fan was replaced in round three by two native line buffers, coverage/self-shading/end caps and source-derived card choreography. Remaining viewport-triggered title entry, end-cap rasterization, random/time phase and responsive layout are comparison tasks, not proof the whole effect is missing. Test progression **0/.35/.66/1**, reverse, 812/813 layout switch and short heights; adjust only measured residuals. |
| **F14 / Protected; evidence follow-up** | **About/contact particle hold, wake and fluid physics** | Approved click-and-hold downward pour, collective wake/wave, release/cancel and quick-click mail action are implemented. Preserve emitter/drain and pointer/touch semantics. Stochastic trajectories/history and font-based particle outlines cannot be declared identical. Repeat the same held path/time if comparing density, gravity, dissipation or pressure; do not retune from a single random still. No new fluid defect was established in this audit. |
| **F15 / Protected; evidence follow-up** | **Home hero: rigid bodies, ray interaction, reflection/refraction** | Round two replaced the old approximation with source-derived shader/HDR/24-or-22-body physics. Do not repeat the obsolete claim that native hero materials/solver are absent. Check matched camera/body initial conditions, orientation, matcap/refraction/highlight, collision settling and drag-release momentum. The deterministic initialization/integration and graphics quality remain adaptations; unsynchronized body poses are not proof of wrong physics. Keep existing source counts, pointer-ray response and mobile/reduced/fallback gates. |
| **F16 / Protected; evidence follow-up** | **Home editorial/reel: ribbon morph, depth hover, title strips, parallax** | Native buffer ribbon, DOM→film morph, real reel, metadata strips and depth/ripple/DOF hover are present. The confirmed missing piece is **F01's selected click**, not the whole editorial scene. Compare native show windows, film time, pointer approach and hover phases; the bundled reel is an 800px rendition. Source random phases and permitted font outlines differ. No high-resolution/reel remake or arbitrary hover overshoot is justified. |
| **F17 / P1 verification, not blind remediation** | **Home tunnel/vortex/blue corridor/astronaut/end** | Approved native geometry, FFT bloom, glass animation, camera progression, astronaut/visor, gems/sticker atlas and end interaction remain. The legacy broad Home validator is still **historically red** on synthetic vortex/cage expectations; round three diagnosed contracts incompatible with the native runtime. It was not rerun or made green here. Build native phase/pixel/geometry gates and reconcile full autoplay/return timing at matched viewport/scroll/input; preserve praised scenes while doing so. Do not tune intensity merely to satisfy the stale threshold or count unused `GoalDownstreamScenes` factories as active scenes—follow actual imports/calls. |
| **F18 / P2 verification** | **Shared cursor, sound waveform, hover/press micro-interactions and scroll indicator** | Functional custom pointer/sound controls exist; exact ring/badge styling, sound-button canvas/waveform phase, click envelope, header entry and scroll indicator minimum are not newly reference-matched. Inventory each against the native header/section-specific cursor rather than assume one generic ring reproduces them. Port only observed/source-supported curves (reference header includes a 32-segment sound wave and hover fill). Preserve keyboard/fine-pointer/reduced/audio-permission behavior; no autoplay audio or perpetual offscreen loop. Source code alone does not prove audible waveform equality. |
| **F19 / Intentional boundary** | **Typography, branding, fallback/a11y and utility pages** | Commercial fonts remain disabled under **Font Option 2**; permitted substitutes alter outlines, wrapping and optical dimensions. JITHIN customization remains deliberate. Reduced/fallback/static states, Skip/focus semantics and accessible controls intentionally differ from a WebGL-only original. Document these instead of silently enabling commercial fonts, undoing branding or removing safeguards. See utility scope below. |

### Effects that should not be invented

- No generic explosion/confetti on project click: the source explains the sensation with list transform, selected depth/DOF and fog/color continuity.
- No blanket pointer tilt on every case media panel: archived case data defaults parallax to **1**, with no per-item override in the 19 inspected pages. Match horizontal/vertical travel and compositor behavior first.
- No random particle field on Awards or menu merely to make the site feel busier.
- No additional global color grade, exposure change, physically based light or spring on top of an existing native shader unless matched evidence requires it.

---

## 4. All-page coverage and exceptions

### Canonical page families

| Page | Included evidence | Remaining focus |
|---|---|---|
| Home `/` | Fresh two-viewport captures and normal desktop featured click; supplied Home overview/source; prior native hero/editorial/end regressions. | F01–F03 origin/handoff, F05–F08 chrome, F15–F17 matched-motion/legacy gate. |
| About `/about` | Fresh two-viewport opening/section captures; supplied About overview and prior detailed frames; active world/expertise/recognition/CTA sources. | F05–F07 shared motion, F10–F14 local adaptation review. Protect approved scenes. |
| Archive `/projects` | Fresh two-viewport opening/list captures; desktop/mobile normal clicks and desktop return; supplied Projects overview/source; prior archive depth/contact tests. | F01/F02 selected zoom/reverse, F05–F08 shared motion. Preserve depth hover/particle contact. |

### Every canonical case study

All rows below were freshly captured at **1440×900 and 390×844**, with no uncaught error or horizontal overflow. Shared F03/F04/F09 apply to all; list opening F01 applies wherever the route is exposed by the source list. “Panels” are the verified source content inventory, **not a claim every movie frame was compared**. Fullscreen count and special text panels must remain intact during any transition rewrite.

| `/projects/` slug | Panels | Fullscreen | Text | Additional audit focus |
|---|---:|---:|---:|---|
| `oryzo_ai` | 7 | 3 | 0 | Fresh Home-origin click/Back; first/fullscreen handoff. |
| `atlas_motion` | 7 | 0 | 0 | Fresh archive desktop/mobile click; desktop Back. |
| `devin_ai` | 5 | 1 | 0 | Short reel; next-preview continuity. |
| `of_the_oak` | 7 | 0 | 1 | Text sizing/copy and text→media composition. |
| `everswap` | 10 | 0 | 0 | Decode/visibility across interior panels. |
| `porsche_dream_machine` | 17 | 4 | 0 | Long reel/fullscreen boundaries. |
| `synthetic_human` | 7 | 1 | 0 | Fullscreen framing and title/theme continuity. |
| `ddd_2024` | 4 | 0 | 0 | Short reel/end-preview activation. |
| `spaace` | 7 | 1 | 0 | Fullscreen boundary and metadata exit. |
| `choo_choo_world` | 19 | 2 | 0 | Longest panel inventory; cleanup/visible-media bounds. |
| `zero_tech` | 14 | 3 | 0 | Fullscreen/interior shadow continuity. |
| `spatial_fusion` | 17 | 4 | 0 | Long reel/fullscreen boundaries. |
| `worldcoin` | 6 | 2 | 1 | Text-panel and fullscreen coexistence. |
| `lusion_labs` | 17 | 3 | 0 | Long reel and end-preview theme. |
| `my_little_story_book` | 16 | 3 | 0 | Long reel/fullscreen media selection. |
| `soda_experience` | 8 | 1 | 0 | Fullscreen and next-theme continuity. |
| `infinite_passerella` | 10 | 1 | 0 | Interior projected shadow and final preview. |
| `the_turn_of_the_screw` | 14 | 3 | 0 | Fullscreen/visible-media readiness. |
| `maxmara_bearings_gifts` | 17 | 3 | 0 | Long reel and chain wraparound. |

The extra focus column is a **next validation target**, not a newly discovered route-specific defect. Home has **12 featured projects**, archive **19**; do not assume identical order or permit a Home-origin reverse into a card Home does not contain.

### Noncanonical/local surfaces

`/contact`, `/work`, `/work/[slug]`, `/labs`, `/design-system` and other local aliases/utilities are not extra canonical Lusion page families. Prior final-build utility coverage includes **10 local routes and 2 redirect checks**; it was not rerun in this audit. `/labs` intentionally redirects externally to `https://labs.lusion.co/`; `/design-system` intentionally returns 404. The external Labs application was not rendered/certified. Preserve redirects, local fallbacks, contact behavior and alias navigation; do not advertise reference parity without corresponding reference evidence.

No metadata, robots, analytics, SEO or newsletter integration changes are proposed as part of graphics fidelity. The local newsletter acknowledgement is intentionally not a claim of remote subscription storage.

---

## 5. Validation required before accepting the fixes

### A. Deterministic native transition contract

- Unit-test list matrix/pivot, cover scale, left/right tilt sign, selected active squaring and the native lifecycle-to-zoom mapping at normalized progress **0/.25/.5/.75/1**.
- Verify retained group/world coordinates and cover UVs after resize; do not derive success from an anchor's width alone.
- Verify F03's exact reveal windows, title offset and scroll-gate boundaries. Keep independent lifecycle states for outbound/disclosure/next; no unrelated timer that expires behind a cover.
- Test transaction ownership, one commit, one cleanup and stale-ID rejection; pre/post-commit cancellation must have different recovery paths.

### B. Normal-motion rendered comparison

Obtain a reference click recording at the **same CSS viewport/DPR**, pointer location, source card/scroll position and loading state. Include first/second column, a deep archive card, Home featured, mobile and reverse. Capture both runtimes' group matrices/uniform progress where available and compare corresponding normalized phases plus actual video.

Use a fixed local seed/input replay for particles/physics where possible. First align camera, viewport, scene ratio and video time; only then inspect composition, crop, silhouette, depth/DOF, color, shadow and timing. A single aggregate MAE/SSIM score is not acceptance: fonts, stochastic pixels and movie phase can dominate it. Do not invent a measured tolerance or percentage-fidelity score before synchronized evidence exists.

### C. Navigation and reliability matrix

- Home/archive → case; explicit Back and browser Back/Forward; case → case by click/Enter/end input; direct URL/refresh; alias entry; same-path hash/query; modified click/new tab.
- 390×844, 1440×764/900, 1720×912; **812/813** scene/layout switch and **1000/1001** chrome boundary; short-height desktop and resize during each phase.
- Slow destination commit/decode, missing depth image/plant/reel, forced WebGL fallback, actual context loss/recovery, hidden tab, menu/modal interruption, repeated click, Escape before/after commit, timeout and late route delivery.
- Keyboard focus/inert/aria-busy release, native touch pan cancellation, pointer release/cancel and reduced mode/live reduced changes. No auto-next under reduced motion.
- At finish, old route RAFs/listeners/video/GL resources stop; only the destination owns rendering. No duplicate Lenis/scroll engine, nested perpetual per-card loops or abandoned handoff textures.

### D. Protected regressions and hardware boundaries

Rerun the final round-four serial regression against the eventual changed production build, plus the new selected-transition suite. Preserve Home native hero/editorial/end, Projects archive/contact, About expertise/awards/CTA, media modal/playback and all 38 case layouts. Rerun actual build fingerprints after rebuilding; do not attribute this audit's fingerprint to new application code.

The broad legacy Home motion gate remains a known historical failure. Replace incompatible synthetic-contract checks with native geometry/phase/pixel coverage **without deleting the unresolved timing/visual requirements or claiming a pass by diagnosis**.

Physical iOS/Android and hardware-GPU desktop tests remain required for real performance, thermal/memory pressure, float-render-target compatibility and touch fidelity. The sandbox's software graphics, emulation and numerical integration tests establish none of those hardware outcomes.

---

## 6. Reproduce this audit

With the identified production build already running on port 3003:

```bash
BASE_URL=http://127.0.0.1:3003 CHROMIUM_MULTIPROCESS=1 \
  node scripts/audit-project-openings.mjs

BASE_URL=http://127.0.0.1:3003 CHROMIUM_MULTIPROCESS=1 \
  AUDIT_PHASE=opening-audit node scripts/audit-site-fidelity.mjs
```

The first script is a **read-only observer**, not a parity assertion: it records actual trusted card click timing, source bounds/phase samples, browser screencasts, destination state and the current explicit desktop Back behavior. It skips the cold loader intentionally to isolate project opening; it does not validate F05. The second uses the existing reduced-motion route-capture policy. Neither script modifies application state outside its disposable browser context or changes application files.

### Relevant implementation owners

- Shared cards / navigation: `src/components/home/FeaturedProjectCard.tsx`, `src/components/studio/TransitionLink.tsx`, `src/lib/route-navigation.ts`, `src/components/foundation/{RouteTransitionMotion,PageTransitionCurtain,StudioHud,Preloader}`.
- Source list graphics: `src/components/home/{HomeEditorialMotion,HomeEditorialShaders}.ts`, `src/components/projects/ProjectsArchiveMotion.ts`.
- Destination graphics: `src/components/pages/LusionProjectDetailView.tsx`, `src/components/case-study/{CaseStudyMotion,CaseStudyGraphics,CaseStudyShadows,CaseStudyShaders}.ts`.
- Footer/chapter owner: `src/components/sections/StudioFooter.tsx`, `src/components/foundation/ScrollPortalMotion.ts`.
- Existing local scene-specific comparisons: [Home editorial](home-editorial-reconstruction.md), [Home tunnel](home-goal-reconstruction.md), [Home end](home-end-reconstruction.md), [About renderer](about-reference-renderer.md), [About recognition](about-recognition-reconstruction.md), [About contact](about-contact-reconstruction.md), [Projects](projects-reconstruction.md), [round two](motion-fidelity-round2.md), [round three](motion-fidelity-round3.md), [round four](motion-fidelity-round4.md).

## Bottom line

The build already contains the major scene techniques; it should **not** be globally restyled or have its approved scenes replaced. The next meaningful improvement is the missing **selected-list → case → selected-list continuity**, followed by lifecycle-correct case entrances and consistent next-project activation. Loader/footer/menu residuals and remaining optical/physics/paint calibration come after that.

This report inventories confirmed gaps and unverified risks across every canonical page family and all 19 cases. It does **not** claim every possible discrepancy has been proven, all live-site frames were compared, or the site is an exact clone. Those stronger claims require synchronized reference interaction recordings and device testing that are not available in this audit.
