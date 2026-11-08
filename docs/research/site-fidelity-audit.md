> **Latest audit-only review:** [full-experience-fidelity-audit.md](full-experience-fidelity-audit.md) documents the current `203e5a6` build, freshly observed project opening/return behavior, the missing selected-list depth zoom, exact reconstruction requirements, all 22 canonical routes / 19 case studies, and evidence-qualified whole-site follow-up. No application changes were made in that audit.

> **Latest round-four update:** shared native aperture/menu/chapter navigation is shipped on production 3003, build `TZ8s1xwpgRD_kZgq9MSFp`. See [motion-fidelity-round4.md](motion-fidelity-round4.md) for the before-edit differences, source provenance, final production identity, 44 canonical observations plus alias/utility coverage, and remaining limitations. Older build identities below are historical.

> **Latest round-three update:** source-derived About expertise ribbons/card choreography and projected RGB foliage shadows across all 19 case studies are now shipped. Production 3003 is build `_pEjBsboYuhIHZPo99h4k`. See [motion-fidelity-round3.md](motion-fidelity-round3.md) for the before-edit discrepancy inventory, fresh production gates, reference-phase review and remaining limitations. Historical results below are not the latest build identity.

> **Round-two update:** the Home opening now uses source-derived shaders, HDR assets, 24/22-body physics and camera choreography. Production 3003 is build `yGnDAfDwlNhcmDxISwXEQ`; the older build/results below describe the first pass. See [motion-fidelity-round2.md](motion-fidelity-round2.md) for fresh 44-route observations, native-hero/regression gates, explicit adaptations and the still-failing broad Home vortex assertion. The all-page exact-clone task remains incomplete.

# Site-wide reference-first fidelity audit

**Status: baseline audit and the first shared case-study remediation are complete. Comprehensive exact visual/motion parity is NOT complete.** This document separates corrected discrepancies, functional evidence, retained customizations and open graphics/choreography gaps.

## Baseline before application edits

Baseline application: `ee9d917` (runtime build `dbb5c27`), production port 3003. `scripts/audit-site-fidelity.mjs` captured **all 22 canonical routes at 1440×900 and 390×844**: 44 opening observations, additional Home/About/Projects bands, zero uncaught errors and no horizontal overflow. Evidence is ignored under `temp/site-fidelity-audit/before`; these are current served screenshots, not old test comments.

Authority: supplied `Lusion-home.mp4`, `Lusion-about.mp4`, `Lusion-project.mp4`, additional 33.78-second 2560×1600 About recording `2026-11-06 17-30-56.mp4`; archived source/CSS and all 19 case-study HTML pages from `quangminh1212/Design_Lusion.co`; historical matching-viewport captures in `docs/validation/phase-g/reference`. Fresh text fetches of `https://lusion.co/`, `/about`, `/projects/oryzo_ai` confirm content, not live visual/motion parity. Live text extraction is not a replacement for the supplied video.

## Discrepancies found, before fixing

| Surface | Actual build vs reference | Priority / disposition |
|---|---|---|
| Shared header | Home/Projects/case studies say JITHIN, at different scales; About alone says LUSION. Reference consistently uses the same 121×24 vector mark. Case-study Back pill is left of its reference alignment. | Retain the standing JITHIN customization, not an accidental defect to undo. Correct the evidenced case-study Back position only; no commercial font activation. |
| All 19 case studies, desktop | Vertical document gallery with sticky narrative, rather than a horizontal viewport reel. Missing layered narrative displacement/fade, native stage dimensions, full-height/fullscreen distinctions and next-project overscroll. | P0: replace shared case-study presentation, not 19 bespoke approximations. |
| Case-study opening composition | Title ~50px instead of source 4.5em (~72px at 1440); body too large; services too far left. A fixed blurred project thumbnail is invented as background. | P0: native 34em meta, 60% reading column, side list, correct type scale and media gutter; remove watermark. |
| Case-study gallery graphics | Missing source media entry (.6→1 reveal), fullscreen masks, multi-sample velocity distortion and projected animated plant shadows. Generic drop shadows and hover scaling are substitutes. | P1: source-informed gallery compositor and native plant asset, retaining DOM/video fallbacks. |
| Case-study media lifecycle | Preview pauses for reel/visibility/reduced motion, but not the open navigation menu. | P1: add shared menu/transition playback guards. |
| Case-study ending | Generic cobalt CTA/footer appended to every detail. Original ProjectPage has `hasExtraPages=false`; next-project preview is the actual end of this view. | P0: remove invented extra acts from detail routes only. Preserve source canonical next-project chain. |
| Home opening crosses | Current renderer uses Three physical materials/ACES, whereas the inspected native program uses a specialized matcap, neighbouring-shape reflections and shading. The collision/time history also differs. | Open fidelity gap, not fixed by the case-study rebuild. Preserve the approved scene until a separately evidenced shader/physics replacement is verified. |
| Home upper editorial / archive | Recently reconstructed native ribbon/video morph/depth effects exist. Their passing structural tests do not certify visual parity. | Preserve, compare captures; do not reintroduce generic per-card animation. |
| Home tunnel / astronaut and About hero / recognition / CTA | Complex source-derived systems already rebuilt. Random/time history, available footage and permitted-font outlines still differ. | Preserve approved implementations and regress shared changes; do not claim every stochastic frame matches. |
| About expertise / global menu / footer / route transitions | Existing implementation has approximated choreography and generic transitions; reference footage does not show every interaction or mobile state. | Retain inventory and inspect/test; do not silently call these exact or replace them with invented particles. |
| Fonts | Commercial faces remain disabled by standing Font Option 2 policy. | Explicit boundary: no perfect font-outline claim; no licensing bypass. |
| Supplementary local routes | `/contact`, `/work`, `/labs`, `/design-system`, legacy `/work/[slug]` are local extensions, not additional source canonical pages. | Preserve; exclude from claims of 22-route reference parity. |

Case-study source inspection confirms `parallax` defaults to **1**, and none of the 19 archived HTML media items supplies an override. Therefore adding arbitrary pointer tilt/zoom to every image would be an invention. The missing native motion is chiefly horizontal reel travel, differentiated title/description/services/links movement, entrance masking, velocity screen distortion and projected foliage response.

## Implementation and verification

### Implemented in this pass

- Shared case-study DOM/layout rebuilt for **all 19 detail routes**. Desktop uses a sticky viewport and 48em inset/5em panel spacing, with existing global document/Lenis scroll driving the horizontal position. At 812px and below it is a normal vertical document; no second smoothing loop was added.
- Native 4.5em title, 34em metadata width, 60/40 narrative/services split and 20%-of-meta side padding; corrected stage top/height and case-study Back alignment. Removed the invented background thumbnail, generic image hover zoom/drop shadows and appended CTA/footer from detail pages only.
- A single route-owned clock implements the differentiated title/description/services/link displacement, fades, media .6→1 reveal, full-height media and source fullscreen distinctions. The optional viewport compositor uses real DOM-decoded images/videos, eight-sample velocity warp/blur and the existing `plant.buf` asset with three delayed RGB foliage layers.
- Native desktop **quarter-viewport end preview**, continuing-input charge, late theme-color change and a one-second next-preview slide before canonical navigation. Mobile preview follows its content height. Explicit next-project links remain keyboard-accessible; reduced motion disables forced overscroll navigation.
- Mouse/touch horizontal drag maps through the existing scroll owner. A dragged video card does not accidentally open its film. Native mobile scrolling is retained.
- Added menu/transition guards to preview playback, alongside existing reduced-motion, modal, offscreen and document-visibility guards. Context loss reveals DOM media. Failed optional foliage does not remove the gallery. Resources/listeners/clock are route-owned and disposed.
- Retained the existing JITHIN customization, font policy and approved Home/About/Projects graphics. No commercial font activation or unrelated metadata/SEO edits.
- Restored the source-informed launch-pill dot/text/arrow hover, without the previous generic button scale. Licensed Aeonik outlines are still not used.

### Actual production verification

Final production preview: **port 3003**, Next build ID **`2Kb12KZiWo-u5zTqVZkpp`**. Fetched all 22 canonical HTML routes and verified **26 unique served JS/CSS files byte-for-byte against the current `.next` build**. Fingerprint report: `temp/site-fidelity-audit/production-build.json`. This is runtime identity verification, not a visual score.

| Check | Actual outcome / scope |
|---|---|
| `npm run check` | PASS: ESLint, strict TypeScript and production build. |
| `npm run test:projects` | PASS: 19 source routes/media/next chain and source layout contracts; obsolete vertical-lane assertions were replaced with native reel assertions, not simply deleted. |
| `scripts/audit-site-fidelity.mjs`, `AUDIT_PHASE=after` | **44 final-build route/viewport observations**, 1440×900 and 390×844, reduced-motion capture policy. Zero uncaught errors; zero horizontal overflow. Additional Home/About/Projects bands captured. Not 44 matched-motion or source-pixel comparisons. |
| `scripts/validate-case-study-motion.mjs` | PASS: **38 detail-route/viewport layouts**, source item counts, type ratios, first-media inset, no appended extra footer, visible interior panels, native desktop end position and canonical next links. Also real normal video/foliage composition, menu pause/resume, live reduced-motion idle sleep, context-loss DOM recovery and forced-WebGL fallback. |
| `scripts/validate-case-study-navigation.mjs` | PASS: actual media drag without movie opening, keyboard next navigation and old-compositor cleanup, real wheel charge/morph/next route, no reduced-motion auto-next, and 812/813 breakpoint reversal. Graphics fallback is deliberately used to isolate the navigation test; this is not a GPU gesture-performance test. |
| `npm run test:project-preview`, `BASE_URL=http://127.0.0.1:3003` | PASS: actual desktop/mobile source selection and playback, live reduced motion, keyboard modal/real seeking, modal resume and offscreen pause. |
| `npm run test:project-gallery-text`, same base | PASS: both source text panels, exact captured copy/order/em sizing and visible desktop/mobile rendering (4 states). Not a licensed-font acceptance result. |
| Preserved Home editorial browser gate | PASS at 1440×764 normal: native line/morph, actual film/depth pixels, all cards, modal/links, cleanup and optional-asset/context-loss isolation. |
| Preserved Projects browser gate | PASS at 1720×912 normal: all 19 depth images/links, glyph coverage, rendered CTA atlas pixel changes, gestures, keyboard, context recovery/sleep/disposal. |
| Preserved About CTA browser gate | PASS at 1720×912, 1568×1230 and 390×844: real held/moving pour, release/cancellation, quick-click/keyboard actions, visibility/menu/offscreen sleep, context recovery and reduced motion. |
| Numerical/static regression gates | `test:home-editorial`, `test:projects-contact`, `test:motion`: PASS. Numerical gates do not establish visual parity or hardware FPS. |

The final full route/layout/media/navigation capture pass ran after the final local drag/launch-pill refinements. The preserved Home/Projects/About gesture gates ran before those case-only refinements; their implementations were not subsequently modified.

Evidence is ignored under `temp/site-fidelity-audit/`: `before/`, `after/`, `case-studies/`, `case-navigation/`, gallery-text output and regression logs. Reviewed rendered samples include desktop/mobile Oryzo opening, Of The Oak opening/interior/normal playback, Home featured work and About expertise. Matched-viewport historical reference images remain in `docs/validation/phase-g/reference/`; they are not fresh live captures.

### Still open — do not call the whole site an exact clone

1. **Home opening material/physics fidelity**: the specialized native matcap/reflection/neighbor program is not yet reconstructed. Existing physical materials and deterministic collision history are not the same renderer/simulation.
2. **Gallery graphics are source-informed, not an exact native compositor port**: plant vertex deformation/three layers/delays are present, but the compact viewport shadow blur/projection differs from the native multi-pass per-channel/world-space pipeline. Native blue-noise jitter, exact highlight-to-image readiness behavior and every route-specific transition frame are not certified. DOM/image fallback framing can differ from a running film frame.
3. **Global menu/footer/route transitions and About expertise choreography** retain approximations. The audit inventories them; this pass does not assert their exact choreography or invent unseen particles. Native project-to-project transition ownership is adapted to Next navigation rather than retaining the old site's page manager.
4. **Commercial typefaces remain disabled** under the standing font policy. Text outlines, launch-pill width and some line wrapping differ. Branding intentionally remains customized. These are explicit boundaries, not silently fixed by switching licenses or branding.
5. **No synchronized all-frame reference/hardware certificate**: static reduced-motion captures and Chromium/SwiftShader tests do not prove physical-phone/GPU performance, every particle trajectory, live-site motion parity, or pixel equality. Footage does not expose every footer/mobile/menu state. The previously noted Home tunnel blue-pose advancement gate has not been represented as newly passing; the praised tunnel was left unchanged.

Generated screenshots, recordings and reports stay outside Git. No historical MAE/SSIM score is recycled as evidence for this build; unsynchronized videos and random states cannot support an exact-pixel certificate.

### Canonical coverage

Home `/`, About `/about` and archive `/projects` were captured at both viewports. All detail routes below share the corrected presentation and passed the 38-layout gate. Media counts are source items, not an assertion that every movie frame was compared.

| Route | Source media panels | Fullscreen / text panels |
|---|---:|---|
| `/projects/oryzo_ai` | 7 | 3 fullscreen; 0 text |
| `/projects/atlas_motion` | 7 | 0 fullscreen; 0 text |
| `/projects/devin_ai` | 5 | 1 fullscreen; 0 text |
| `/projects/of_the_oak` | 7 | 0 fullscreen; 1 text |
| `/projects/everswap` | 10 | 0 fullscreen; 0 text |
| `/projects/porsche_dream_machine` | 17 | 4 fullscreen; 0 text |
| `/projects/synthetic_human` | 7 | 1 fullscreen; 0 text |
| `/projects/ddd_2024` | 4 | 0 fullscreen; 0 text |
| `/projects/spaace` | 7 | 1 fullscreen; 0 text |
| `/projects/choo_choo_world` | 19 | 2 fullscreen; 0 text |
| `/projects/zero_tech` | 14 | 3 fullscreen; 0 text |
| `/projects/spatial_fusion` | 17 | 4 fullscreen; 0 text |
| `/projects/worldcoin` | 6 | 2 fullscreen; 1 text |
| `/projects/lusion_labs` | 17 | 3 fullscreen; 0 text |
| `/projects/my_little_story_book` | 16 | 3 fullscreen; 0 text |
| `/projects/soda_experience` | 8 | 1 fullscreen; 0 text |
| `/projects/infinite_passerella` | 10 | 1 fullscreen; 0 text |
| `/projects/the_turn_of_the_screw` | 14 | 3 fullscreen; 0 text |
| `/projects/maxmara_bearings_gifts` | 17 | 3 fullscreen; 0 text |
