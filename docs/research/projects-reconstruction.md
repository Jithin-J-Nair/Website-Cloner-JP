# Projects archive and textured end reconstruction

## Authority and comparison (before implementation)

- Primary visual authority: `public/videos/Lusion-project.mp4` (33.27 seconds, 1920×1080, 60 fps). Examined frames at 1, 5, 10, 15, 20, 25 and 30 seconds. The recorded page viewport is approximately `(100,116,1720,912)`; browser chrome/desktop margins are not part of the page layout.
- Technical authority: archived `quangminh1212/Design_Lusion.co`, `projects/index.html`, `_astro/hoisted.CUO_IjfL.js` (previously inspected blob `0c57277a2102a61f761357ce2cd432d035cd0a13`), and its stylesheet. Relevant classes: `ProjectsMainSection`, `ProjectItemList`, `FlipAnimation`, `FlipSim`, `EndSection`. The downloaded bundle is inspection evidence only: it is not executed or served.
- Baseline: actual served `/projects` from the production build of parent `5782713`, at 1720×912, compared to the video before Projects implementation. Ignored evidence: `temp/projects-reconstruction/before-*.png`, `ref-*.png`, `reference-projects.html`.

| Observed baseline discrepancy | Source/video-informed correction |
|---|---|
| Projects ended with the shared generic cobalt CTA, white micro-grains and a large artificial SVG arm | Projects-only pale `#f0f1fa` end, black type, coloured geometric glyph liquid; no arm or change to the approved About CTA |
| About-style/generic high-capacity particles, wrong silhouette/scale/colour | Native `flip_texture.png`: 23 RGB-channel glyph masks in eight atlas tiles, nine native colours, 45-grain colour cadence and 23-grain shape grouping; one instanced 1.6×1.6 plane draw |
| No archive depth renderer after shared cards became semantic fallbacks in the prior Home reconstruction | Projects-owned viewport compositor for all 19 thumbnail/depth pairs; same native 12 depth / 6 DOF samples as the shared source ProjectItemList |
| Static heading/count/arrow, no route-owned card glyph controller | Staggered heading/count reveal, elastic arrow, scrambled category decode, cosine-staggered four-copy title strips, arrow/metadata hover and keyboard motion |
| Counter too small; header/gap/arrow approximated with fixed utility offsets | Native 17vw title, 4vw mono count, 4vw diagonal arrow, section padding + 20vh title margin, 8vh desktop grid gap; separate mobile and ultrawide rules |
| Shared card shadow treatment and no scroll-induced depth/ripple movement | Scoped shadow removal; native entrance mask 70→100%, image 75→100%, ±5vw/±.05rad entry and scroll ripple capped at .15 |
| Generic 180vh closing chapter | Native 350vh sticky chapter, five crosses, centered two-line title, three hover underline pieces, word/glyph roll, 7vh scroll-pill inset and duplicate ticker/arrows |

The native textured profile uses `ceil(fit(width,320,2560,20,90)*.4)` grid columns, `ceil(fit(width,320,2560,20,80)*.4)` particle columns, count rounded to a multiple of four, and native gravity multiplied by 1.5. At 1720×912 this means **300 particles, gravity −10.5, one draw / 600 triangles**, not thousands of small white sprites. The original native texture/material is distinct from About's four white geometry families.

The archive HTML places the fixed canvas before `#ui`; its particles are **under the black DOM type**, not painted across the glyph stems. Projects uses the same stacking order. This was corrected in the final visual pass; About's previously approved layering is not changed. The permitted fallback font's cap metrics also required a Projects-only .06em clip inset: otherwise the next glyph copy leaked small black strokes into the bottom of the visible title slot. Copy feedback uses contrast-safe blue on the pale surface.

## Implementation and ownership

- `ProjectsArchiveView` owns `createProjectsArchiveMotion`, restarted only when motion preference changes. One archive RAF, no per-card RAF or second scroll engine. Layout boxes are cached at layout/font/resize changes, and pointer/depth springs use bounded substeps. Offscreen/modal/hidden work pauses; route cleanup disposes textures, geometry, material, context and listeners.
- `ProjectsContactSection`, `ProjectsContactField`, `ProjectsContactWave` are route-specific. They reuse the existing native EndSection editorial equations and PIC liquid engine, but not About's renderer or stylesheet. The fluid receives an **opt-in** textured metrics profile; default About metrics/physics are unchanged and separately tested.
- Native tank: gravity, four particle separation passes, particle/grid transfer, 60 pressure iterations, PIC ratio zero. Held input opens the floor and re-emits drained mass at the pointer; hover is a velocity-driven obstacle, not a permanent fountain. Released/cancelled/hidden/blocked gestures close the drain. No authored sine-wave surface or continuously growing allocation.
- The shared solver's existing explicit rest-density value of 1.5 is retained. The archived native first-frame density estimate and random trajectories cannot be recovered exactly from the recording. Fixed bounded steps and deterministic seeds are reconstruction adaptations, not a claim of identical stochastic history.
- Quick click/keyboard retains mailto, copied-email feedback and existing sound interaction. A held drag suppresses only its resulting activation. Touch vertical pan stays enabled; held touch emission is an accessible adaptation of the source desktop interaction.
- CSS is scoped to `#projects`; Home/About components, shaders, styles, navigation, route content, metadata, font policy and asset allowlisting are not replaced. The approved Home shaders are imported as immutable shader strings only. Shared card markup remains semantic/failure-capable.
- Missing depth affects only that card. Missing atlas, failed WebGL or context loss retain readable DOM links and a static decorative field. Reduced motion supplies a complete static field without an ongoing RAF. The original restricted fonts remain disabled.

## Reproduction and evidence

Static/unit commands:

```sh
npm run lint
npm run typecheck
npm run build
npm run test:projects
npm run test:projects-contact
node scripts/test-about-contact-fluid.mjs
npm run test:motion
npm run test:home-editorial
```

Actual browser acceptance (default production preview port 3003):

```sh
CHROMIUM_MULTIPROCESS=1 npm run validate:projects-motion
CHROMIUM_MULTIPROCESS=1 PROJECTS_MOTION=reduce npm run validate:projects-motion
CHROMIUM_MULTIPROCESS=1 PROJECTS_WIDTH=390 npm run validate:projects-motion
CHROMIUM_MULTIPROCESS=1 PROJECTS_WIDTH=390 PROJECTS_MOTION=reduce npm run validate:projects-motion
CHROMIUM_MULTIPROCESS=1 npm run validate:projects-fallbacks
```

`temp/projects-reconstruction/integration-{1720,390}-{normal,reduce}` contains screenshots and `report.json`. Gates inspect all 19 real depth surfaces and links; visible duplicate-glyph coverage; actual rendered depth/atlas pixel changes (and static reduced pixels); textured draw counts; held/moving/released input; click/keyboard activation; pointer cancellation; document visibility and real navigation menu suspension; runtime preference changes; context restoration; offscreen sleep and real route-transition disposal. `fallback-report.json` and `optional-assets-fallback.png` capture independent missing-depth/atlas/context/no-WebGL paths. Expected network/renderer failures are isolated in that separate fallback test, not suppressed in the normal-policy error assertions.

Existing approved-page regressions are `test-about-contact-browser.mjs` (1720×912, 1568×1230, 390×844), `validate-home-editorial.mjs` (1440×764 normal) and `validate-home-end.mjs` (1440×764 normal). Logs live under `temp/projects-reconstruction/*regression.log`. The broader historical full-normal tunnel timing gate is not retuned or claimed here.

Final verification results are recorded after the production gates finish. Source/served JS and CSS fingerprints are kept in ignored `temp/projects-reconstruction/production-build.json` rather than trusting a port or parent commit marker alone.

## Honest limits

This is a source-informed reconstruction with visually reviewed production captures, not an exact-pixel certification. Permitted substitute fonts, the site's already-customized global wordmark, unrecoverable random/pointer/time history and the solver's explicit density calibration remain differences. The source/video ends on the CTA: the existing footer/About portal is preserved, not invented as a video-verified footer. Chromium/SwiftShader and emulated touch do not establish physical-device GPU performance, real-phone behaviour or original-frame timing. Pixel-change assertions demonstrate visible motion, not a reference similarity/FPS score.
