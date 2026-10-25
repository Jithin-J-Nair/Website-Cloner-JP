# Home motion and solar optics refinement

Date: 2026-10-25. Follow-up to [the goal reference rebuild](goal-reference-rebuild.md).

## Scope and reference basis

The follow-up covers the uploaded brown-glare replacement, faster accelerating fall, pointer-reactive hero connectors, reel expansion and Featured Work scroll motion. Navigation, archive, footer, genuine source geometry, existing playback controls and the single Lenis owner are retained.

The three new uploaded images were readable. Image 2 informed the broken cool spectral arcs rather than the old brown filled annulus. Genuine saved reel/Featured captures informed composition. Live Chromium navigation to lusion.co failed with `ERR_CONNECTION_CLOSED`; this is a reference-led reconstruction, **not a verified exact reproduction of live Lusion interaction**.

Actual guidance consulted:
- [UI UX Pro Max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill), cached revision `d14efff8ed1faa4187f004f79926f428c8074ec7`.
- [CloudAI-X Three.js skills](https://github.com/CloudAI-X/threejs-skills), performance and shaders guidance targeting r186.
- The repository's canonical Framer/motion reference guidance.

These informed render budgeting, resource ownership, measured diagnostics, reduced motion and single-driver scroll scheduling. No new runtime dependency or competing smooth-scroll provider was added. Repository search was limited; no claim of globally highest-ranked skill selection is made.

## Implementation

### Solar optics

`AstronautEmergenceAssets.ts` replaces the brown filled shader with open additive spectral caustics: wavelength-separated bands, filtered fine interference, angular aperture variation and bounded time drift. The existing world light is projected through the current camera into the shader's source coordinate. Resolution uniforms and derivatives stabilize fine patterns at UHD. Destination alpha is preserved. This is a **physically motivated analytic scattering/diffraction approximation**, not a ray-traced lens or full wave-optics simulation.

The effect is emergence-only. Desktop radius is height-normalized; portrait radius is width-fitted so the side arcs do not disappear outside a narrow viewport. The former `chromaticRing*` handles remain for compatibility; they no longer draw a filled brown annulus. Reduced motion freezes time variation.

### Accelerating fall

All three cinematic clock consumers share `GOAL_CINEMATIC_SECONDS = 23.5`, down from 26 seconds (about 9.6% shorter). `acceleratedFall(t) = .28t + .72t²` increases normalized travel speed throughout the interval. Actor descent, tunnel travel and shard burst use this curve. Authored bone-frame interpolation remains linear; genuine source animation, DQ skinning, emergence staging and controls are preserved.

### Hero interaction

A camera ray intersects each connector's depth plane to derive local pointer repulsion. Six exact critically damped spring channels control position and rotation, returning to the authored anchors on pointer leave/cancel. Idle sine drift is removed. Settled scenes, including stationary displaced hover, sleep instead of continuously submitting renders; input, assets, resize, palette, preference and visibility changes wake them. Cached source geometry is cloned before local disposal.

Diagnostics on `#home-hero-visual-container` expose motion state, offset energy, render count, render pixels, draw calls and CPU submission duration. CPU submission duration is **not GPU time or an FPS measurement**.

### Reel, Featured Work and scrolling

One event-coalesced sampler caches natural layout on resize/font/layout changes. It drives editorial word separation, reel expansion/translation/corners, title spacing, heading reveal, card entrances, image parallax and a small settling velocity shear. Twelve per-card scroll listeners/RAF owners were removed. Scroll positioning is still owned by the existing Lenis/GSAP foundation; this sampler only changes presentation.

Image parallax is bounded by cached image height to remain within the image overscan on narrow cards. Background reel videos pause offscreen, while hidden, under reduced motion, or while the deliberately opened modal is present. Modal playback remains separate.

### Render budget

`homeRenderDpr` caps each WebGL framebuffer at 8,294,400 pixels while allowing native 3840×2160, and avoids an accidental 7680×4320 allocation on a 2× UHD display. The no-op lens postprocess is skipped. This is a pixel/fill budget, not a guarantee about total GPU memory across multipass buffers.

## Validation

### CPU/build and HTTP gates

- `npm run test:motion`: increasing fall velocity, shared clock, spring invariance at 30/60/120 Hz, exact rest, native-UHD budget and monotone easing — PASS.
- `node scripts/test-goal-sequence.mjs`: all six existing geometry/path/skin/glass groups — PASS.
- TypeScript and production build — PASS.
- ESLint — zero errors; two pre-existing unrelated warnings remain.
- `npm run qa`: 22 routes, 404 behavior, asset security and 50 genuine scene/media assets — PASS.
- `npm run test:assets`: 18 HTTP/range/security checks — PASS.
- `git diff --check` — clean.

### Cinematic browser regression

The four-mode existing suite passed after the clock, acceleration, optics, spring sleep and video lifecycle changes. It checks eleven scene states, reverse, four handoffs, continuity, WebGL/assets, teardown and failure isolation. Normal-motion runs additionally prove native entry and autonomous completion without further input; reduced-motion runs check static/manual policy rather than claiming autonomous animation.

| Viewport | Motion | Result |
| --- | --- | --- |
| 1440×900 | normal | PASS; autonomous completion 92.400 s software-rendered wall time |
| 390×844 | normal | PASS; autonomous completion 44.953 s software-rendered wall time |
| 1440×900 | reduced | PASS |
| 390×844 | reduced | PASS |

Full results: [desktop normal](home-motion/cinematic-desktop-normal.json), [mobile normal](home-motion/cinematic-mobile-normal.json), [desktop reduced](home-motion/cinematic-desktop-reduced.json), [mobile reduced](home-motion/cinematic-mobile-reduced.json).

These full cinematic runs precede the final portrait-only radius fit and image-overscan bound. Those two visual fixes are covered by the final rebuilt homepage browser checks; the full cinematic matrix was not repeated after them.

### Focused homepage browser regression

`npm run validate:home-motion` exercises pointer displacement/anchor return, verifies the settled renderer's frame counter stops, checks reel expansion and Featured heading transforms across scroll positions, solar GL errors and modal/Escape behavior. It also checks decoded background footage, reduced-motion pause, offscreen pause and modal-obscured pause. Final rebuilt checks cover desktop normal, mobile-width normal, desktop reduced and a native-UHD reduced-motion render. Mobile-width pointer testing uses a synthetic mouse; it is not a physical touchscreen audit.

For UHD, the test asserts actual canvas dimensions **and WebGL drawing-buffer dimensions** are both 3840×2160, not just a CSS viewport or telemetry estimate. The first bundled Chromium launch failed with a pre-page `SIGSEGV`; the isolated rerun passed. UHD verification is a rendered static/reduced-motion sample, not a measured 4K cinematic frame-rate test.

Reproduce with the production server running:

```sh
npm run build
npm run start
# Another shell:
npm run test:motion
npm run validate:home-motion
HOME_VIEWPORT_WIDTH=390 npm run validate:home-motion
HOME_REDUCED=1 npm run validate:home-motion
HOME_REDUCED=1 HOME_VIEWPORT_WIDTH=3840 HOME_HEIGHT=2160 npm run validate:home-motion
GOAL_CAPTURE=0 GOAL_MOTION=normal node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
```

Outputs are written under ignored `temp/`; selected reports and screenshots are retained in [home-motion/](home-motion/). These are rendered implementation evidence, not new reference captures.

## Limits

60fps remains the design target, **not a certified hardware result**. Browser checks use bundled Chromium and SwiftShader software rendering. The slow autonomous wall times above are deliberately reported separately from the 23.5-second animation clock. No physical GPU profiling or continuous UHD frame-rate benchmark was available. Original asset texture detail is unchanged; the procedural flare renders at native UHD but does not invent higher-resolution source textures. Spectral hue, exact lens shape, choreography and scroll curves remain approximations of the available references.
