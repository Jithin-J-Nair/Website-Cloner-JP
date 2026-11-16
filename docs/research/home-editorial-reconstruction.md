# Home: Bold Ideas / reel / Featured Work

## Authority and comparison before editing

Primary visual authority is `public/videos/Lusion-home.mp4`, with the browser viewport cropped from the recording rather than comparing browser chrome. Inspected frames at 5, 7, 9, 11, 13, 16 and 20 seconds cover the transition out of the hero, editorial headline, blue thumbnail, reel morph and project grid. Local before/after evidence lives under ignored `temp/home-editorial/`.

Implementation evidence is the archived `quangminh1212/Design_Lusion.co` HTML/CSS and `_astro/hoisted.CUO_IjfL.js` (previously inspected shader blob `0c57277a2102a61f761357ce2cd432d035cd0a13`). The Home HTML was retrieved via GitHub during this task to verify DOM ordering, not executed as an application. Relevant classes: `Line`, `HomeReelSection`, `ProjectItem`, `ProjectItemList`, `HomeFeaturedSection`, `UfxMesh`, `SecondOrderDynamics` and `ScrollManager`.

| Before | Reference / reconstruction |
| --- | --- |
| Invented SVG spline, broad halo, highlight stroke and moving spark | Actual `lines/line_reel.buf`: 640 vertices with `CP`, `Cd`, path-ratio attributes, native HSV gradient, AO crossing, anti-aliased cap and scroll reveal |
| Small video and large video are separate rectangular HTML surfaces; large stage only scales 0.86–1 | One decoded video texture mapped onto a 32 × 32 segmented surface. Vertex-dependent placement, curl/rotation and blue-to-original RGB transition morph the held thumbnail into the reel |
| Thumbnail precedes the description in grid placement; arbitrary max-width / 16:10 ratio | Source DOM order: title, right-hand content, then thumbnail, then reel. Native five-column thumbnail plus two gaps, 16:9 aspect, -10em offset; desktop height derives from header, cross rails and viewport |
| A large flex gap separates “Bold” and “Ideas”; headline shifts a few pixels with scroll | Two masked lines, native grid indent on line one, opposite vertical word entrances, per-word delays, source cubic-bezier(.35,0,0,1) and scroll parallax |
| Description only fades words; reel decoration absent on desktop | Word translation + opacity, separate description/button parallax; five staggered rotating crosses per rail and opposite moving Play Reel strips on hover/mobile |
| Play/Reel static text | Per-letter entrance and duplicated glyph rolls on the two-second interval |
| Flat project images are translated and scaled on hover and scroll | Native image + depth map raymarch (12 samples), six-sample focus blur, zoom/focus second-order motion, short entry jolts, blue-noise sampling, scroll-strength UV ripple and rounded coverage mask |
| Whole Featured Work heading nudges upward; project labels decode together in 340ms | Staggered rotating heading characters; separately masked disclaimer lines; category decode at 40 characters/sec; four vertically stacked title copies and staggered arrow/title hover |

The particles inside the showreel are part of the native footage, not a reason to invent an extra floating-particle layer over the editorial page.

## Integration and scope

- `HomeEditorialMotion.ts` is the upper-Home DOM/editorial scroll/RAF owner. It preserves the previous hero exit equations and owns the line, reel, type and project surfaces. There are no per-card RAFs or another smooth-scroll engine. It does not change the goal's clock, renderer, shaders, astronaut or CTA.
- One transparent, fixed orthographic surface maps CSS coordinates into WebGL. Geometry, materials, video callbacks, textures, event listeners and observers are disposed at teardown; the context is explicitly released. Pending loads cannot install resources after disposal.
- The original video is decoded once for both thumbnail and expanded surface. Offscreen, hidden-tab, modal-open and reduced-motion playback pause. Paused first frames explicitly upload to the video texture instead of becoming black rectangles.
- Depth images load by proximity. Until an individual image/depth pair is ready, its real HTML thumbnail remains visible. A missing depth map does not hide the project, and a missing line does not hide the text. Context loss exposes all fallback HTML media.
- Mobile uses the reference layout breakpoint (812px) separately from the vertical-footage breakpoint (560px). Touch/cancel/blur cannot latch mouse depth. Reduced motion uses a complete static line, direct reel surface, settled type and paused footage. The reduced scene does not need a perpetual RAF.
- The approved About, tunnel/vortex, astronaut/contact assets and their implementation files are unchanged. Existing project order/routes and font allowlisting are preserved.

## Verification

- Production build, TypeScript, ESLint, `npm run test:motion`, `npm run test:home-editorial`, native goal geometry/rig/FFT/glass tests, and `git diff --check`: **PASS**.
- Production **1440 × 764 normal**, **1440 × 764 reduced**, **390 × 844 normal/touch**, and **390 × 844 reduced/touch** editorial gates: **PASS**. Normal paths report zero page/console errors; deliberately aborted-asset cases separately verify no page errors and visible fallbacks. Each checks the native line, layout-derived morph/reversal, actual decoded film pixels, static reduced-motion pixels, all twelve image/depth pairs, accessible project links, the real showreel button/modal, offscreen sleep, cleanup, optional asset failures and context-loss fallback. Desktop normal additionally checks the live glyph roll and actual pointer-depth pixel changes, then waits for spring release.
- The desktop film and isolated hover crops both changed thousands of RGB channel samples between observed frames. These are motion/nonblank checks, **not** image-similarity scores, source FPS or reference parity measurements. Reduced-motion crop comparisons were exactly static. Evidence: ignored `temp/home-editorial/integration-*/report.json` and semantic-state screenshots.
- The production full **390 × 844 reduced-motion cinematic regression** and the **1440 × 764 normal astronaut/contact gate** also **PASS** after this upper-Home change. The latter includes live captured idle/visor/glyph motion, reduced reverse checks, footer handoff, About teardown and optional gem/sticker/face failure. Logs: `temp/home-editorial/goal-mobile-regression.log` and `contact-regression.log`.
- Served JavaScript was byte-compared with the production build artifact; source/chunk fingerprints are recorded in ignored `temp/home-editorial/production-build.json`. The final preview runs the verified build on port 3003, not a stale development server.

Reproduce with `CHROMIUM_MULTIPROCESS=1 BASE_URL=http://127.0.0.1:3003 npm run validate:home-editorial`; add `EDITORIAL_WIDTH=390` and/or `EDITORIAL_MOTION=reduce` for the other policies. `scripts/validate-home-motion.mjs` now delegates its upper-Home checks to the same gate rather than asserting the removed SVG dashoffset, synthetic scale or whole-heading transform. The downstream assertions in that broader script are not relaxed. That broader historical validator is not claimed as passed by these focused results.

## Fidelity limits

This is source-informed reconstruction, not a pixel-exact certificate. Approved open-license substitute typography remains; proprietary fonts are not enabled. The available native reel is the bundled 800px rendition, not an invented high-resolution replacement. Video playback phase, pointer/scroll history, source random phases and recording compression cannot be recovered from a single recording. Random glyph/jolt/noise choices use stable phases here. Spring integration is bounded/substepped for variable frames rather than importing the original application runtime. Shared global postprocessing and project-to-detail WebGL expansion are not replaced by this scoped change; existing route transitions remain. Screenshots/SwiftShader and emulated mobile checks do not certify physical-device GPU performance. The previously documented full goal-autoplay timing failure remains a separate limitation, not fixed or hidden by these upper-Home tests.
