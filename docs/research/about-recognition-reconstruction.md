# About recognition: vector title and screen paint reconstruction

## Scope and authority

This change is restricted to the About recognition act and its narrow asset endpoint. The praised hero and contact/CTA implementations are unchanged. The old Awards-only scroll effect in `AboutPageView` is removed because recognition now owns both graphics and editorial motion; it does not replace the route's native scroll manager.

Sources inspected before implementation:

- `public/videos/Lusion-about.mp4`: frames at 23, 24, 24.5, 25, 25.5, 26, 27, 28 and 29 seconds. The recorded browser viewport is cropped to 1720 × 912 before resizing for inspection.
- Archived `quangminh1212/Design_Lusion.co` About HTML, Git blob `9d417b887caf9772b42799b7d7c41c84e8547d04`, path `about/index.html`. This contains the literal title path and three recognition marks.
- Archived `_astro/hoisted.CUO_IjfL.js`, blob `0c57277a2102a61f761357ce2cd432d035cd0a13`: `AboutAwardSection`, `titleVert`, `titleFrag`, `ScreenPaint` and `ScrollDomRange`.
- Archived `_astro/about.CNa9RfUh.css`: recognition layout, responsive metrics and link hovers.

This is an archive/video-based reconstruction, not a fresh live-site browser inspection. Inspection downloads and comparison captures are ignored scratch files under `temp/`; the archived application bundle is not executed.

## Differences identified first

| Previous implementation | Reference behavior | Replacement |
| --- | --- | --- |
| Platform-font text with a CSS text stroke | A single six-row SVG title rendered as triangulated faces and curved boundary capsules | Literal title artwork, triangulated with Three's SVG loader; only boundary edges instanced |
| Small radial mask and coloured drop shadows following the current cursor | Advected screen-space paint with velocity, curl and two dissipating weights; colour persists after pointer movement | Quarter-resolution ping-pong paint, eighth-resolution blurred feedback, original gradient texture and source-shaped hue/face/edge shading |
| Only outlined letters highlighted | Both faces and outlines receive the moving iridescent highlight | Separate fill and boundary submissions, preserving dark counters and anti-aliased edges |
| One vertical monument transform plus a competing page-level horizontal effect | Each title row moves horizontally at a different scroll interval | Source `floor(y*6)/6` row timing, 1.5 title scale and half-width displacement |
| 50% content column; 37%/63% award table; arbitrary row padding | 44vw content inset, 15vw organisation column, 2em/4em gaps, 3em header space and 10vh category gaps | Source-derived dimensions, full-width rules and responsive content inset removal |
| No effective character/word reveal targets | Reversible heading-character, number, word, icon and rule animation | Shared-clock native-inspired expo reveals, per-word offsets, alternating icon rotation and back-out scaling |
| Articles used a trailing arrow | Arrow enters from the left as the title shifts right | Pointer and keyboard-focus arrow/title motion |

The effect is not a free-floating particle emitter. Adding a particle cloud here would be another departure from the authority.

## Implementation and assets

- `AboutRecognitionPaint.ts`: two paint targets plus two low-resolution blur targets; swept-segment input, curl/advection, distinct decay rates; vector fill and instanced outline shaders. A safe denominator handles stationary/initial pointer segments. The renderer explicitly disables premultiplied alpha and clears after binding each data target: neutral velocity must remain `(0.5, 0.5, 0, 0)`, not be premultiplied to zero or display-colour converted. All render targets, geometry, materials and the gradient are disposed with the owner.
- `AboutRecognitionMotion.ts`: header characters, counts, words, rules and marks, driven by the same clock. Re-entry resets reveal times. Mobile suppresses character/word displacement, as in the archive.
- `AboutRecognition.tsx`: sole recognition RAF; lazy GPU creation when intersecting; scroll, pointer, resize, visibility, menu/reel blocking and context restoration. Touch is not captured or treated as mouse paint. No nested scroller is introduced. A failed GPU/asset initialization leaves the static vector and semantic content available; its editorial clock sleeps after settling.
- `public/sites/lusion/about/award-title.svg`: original static path artwork with a dark fill and thin outline for no-GPU/reduced-motion fallback. No scripts, external resources, text nodes or font binaries. This is the reference's vector illustration, not an enabled commercial font.
- `AboutRecognitionMarks.tsx`: the three small mark paths from that same About HTML.
- `/about/scene/award_gradient.png`: one added allowlist entry for the existing `media-bundle/textures/award_gradient.png`; no change to global inspection flags, font policy or filesystem confinement.

Reduced motion uses the static vector, semantic table and visible typography without an animated WebGL canvas. GPU loss exposes the same fallback until restoration. Normal animation stops offscreen, behind menu/reel overlays and when the document is hidden. Initialization that finishes after unmount disposes its texture instead of creating a renderer.

## Verification

Executed before production rebuild:

- `npm run lint`, `npm run typecheck`, `git diff --check`.
- `node scripts/test-about-recognition.mjs`: reconciles 58 awards, three secure article links and five talks; asserts vector artwork, native layout metrics, scoped styles and removal of competing/fake foil ownership. The old tests requiring the inaccurate ellipse mask were replaced, not retained as a parity claim.
- `node scripts/test-about-recognition-engine.mjs`: actual boundary extraction (no triangle diagonals; inner letter counters retained); staggered and reversible characters/words/rules, cleanup and reduced/mobile typography.
- `CHROMIUM_MULTIPROCESS=1 BASE_URL=http://127.0.0.1:3004 node scripts/test-about-recognition-browser.mjs`: passed at 1720 × 912, 1568 × 1230 and 390 × 844. Actual visible chromatic pixel changes after a sweep over a solid vector stroke, row scroll progression, keyboard links, hidden/menu/offscreen sleep, GPU loss/fallback/restoration, reduced-motion cleanup, no horizontal overflow or browser/shader errors. The gesture endpoint is derived from the SVG path, rather than assuming a viewport-height percentage lands on a letter rather than its counter.
- Existing CTA physics/geometry and accessible About-copy tests passed unchanged.

Production verification commands (run against port 3003 with the committed build identifier):

```
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) CHROMIUM_MULTIPROCESS=1 node scripts/test-about-recognition-browser.mjs
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) CHROMIUM_MULTIPROCESS=1 node scripts/test-about-contact-browser.mjs
EXPECTED_BUILD_SHA=$(git rev-parse HEAD) CHROMIUM_MULTIPROCESS=1 node scripts/test-about-video-reconstruction.mjs
```

Captures are under `temp/awards-reconstruction/checked/` and the production capture directory supplied through `AWARDS_CAPTURES`. Tests validate functionality and visible rendering, not exact video parity. Chromium uses SwiftShader and mobile viewport/touch emulation; this is not physical-device or hardware-GPU performance certification.

## Remaining fidelity limits

The title artwork and source layout dimensions are available, but the editorial fonts remain the permitted substitutes. The local paint uses separable Gaussian feedback and hash dithering rather than the source's shared blur/bicubic/blue-noise infrastructure. Decay is time-adjusted to avoid refresh-rate dependence. Pointer histories, timestamps and random/dither phases are not synchronized with the recording. Consequently this substantially replaces the incorrect technique but does not establish exact frame-by-frame or stochastic parity.
