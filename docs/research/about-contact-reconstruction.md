# About contact: falling grains / held pour

## Reference and differences found

Authority is `public/videos/Lusion-about.mp4`, especially 35–42 seconds. Crop `(100,116,1720,912)` is the recorded viewport. Working frames and comparisons live only under ignored `temp/cta-reconstruction` / `temp/preview-recovery/inspection`. Archived technical evidence is the previously inspected renderer blob `0c57277a2102a61f761357ce2cd432d035cd0a13` from `quangminh1212/Design_Lusion.co`, `FlipSim`, `FlipAnimation`, `EndSection`, plus the archived About CSS. No downloaded application bundle is executed or served.

| Previous About build | Correction |
|---|---|
| Prefilled liquid, artificial alternating edge recycling | Initially inactive grains; native 2,000/second central falling stream; closed tank until held |
| Broad Gaussian hover repulsion, no pointer-down owner | Local velocity-driven circular obstacle on hover; primary-pointer hold opens the floor and relocates the recycled emitter to the current/previous pointer segment |
| Point sprites with elevation-dependent size, 2,600–5,600 arbitrary capacity | Four instanced geometries: native thin cross, .8 square, ten-sided circle and triangle; viewport-derived capacity, radius and gravity; velocity-driven spin and native angular-speed size change |
| 28-iteration pressure solve, 72% FLIP, one separation iteration | Native-style MAC particle/grid transfer, 60 in-place pressure iterations, four separation iterations, PIC transfer (FLIP ratio zero) |
| Title low/tightly tracked, periodic random letter bob | Native-centered two-line composition; three clipped words with duplicate letters; one upward roll per word on a two-second cycle, native cubic-bezier(.35,0,0,1) entry/stagger |
| Two full-width generic underlines, four crosses | Source full top underline and split lower underline around the descender; staggered hover growth, accessible keyboard focus; five crosses |
| Static scroll-pill text/arrows, 180vh chapter | Native three-second duplicate text/arrow loops, 7vh bottom inset and 350vh chapter; real pill collision in liquid |

At the recorded 1720×912 viewport, the source formulas give 1,800 particles and gravity −7 in a two-unit-wide tank. Particle spacing/shape size is not reduced on the software profile. The renderer performs exactly four instanced draws. `AboutGlyphFluid.ts` is now a retired, unused approximation; its old unit test is legacy coverage only.

## Video calibration and remaining limits

The recording's settled surface reaches approximately 55% of the viewport from the bottom. The archived solver derives rest density from its *first* emitted frame, so its apparent liquid volume changes with startup refresh rate. This implementation explicitly uses **1.5 particles/cell** rather than inheriting that startup accident. Fixed bounded substeps retain coherent gravity/pressure behavior across frame intervals. Initial and held emission are mass-accounted; no prescribed sine-wave surface, permanent side fountains or growing particle allocation is used.

Geometry, emitter/drain semantics, pressure/transfer equations and editorial constants are source-informed adaptations in named, strict TypeScript modules, not an assertion that every recording pixel or random trajectory has been recovered. The existing permitted font remains; restricted commercial font files are not enabled. Font outlines, the original random/time/pointer history and unrecorded physical mobile behavior cannot be certified exact. Pointer touch gestures are an accessible adaptation: native vertical pan cancels the gesture, rather than disabling page scrolling.

## Ownership and behavior

- `AboutContactField`'s existing single visible RAF drives both `AboutContactFluid` and `AboutContactMotion`. The old independent letter timers/WAAPI animations are removed.
- No Home, Projects, hero/postprocessing, navigation, audio or asset-endpoint behavior is changed. Hero opaque output remains untouched.
- A quick click or keyboard Enter retains `mailto:business@lusion.co`, audio and copied-email feedback. A held/dragged pour suppresses only the resulting activation; it does not launch email on release. Pointerdown is not canceled or retargeted, so normal activation survives.
- Primary-pointer ownership, release outside the stage, cancel, blur, menu/reel, document visibility and offscreen sleep stop a held emitter. No global pointerdown or scroll writer is added.
- Native text selection/link dragging is disabled only inside the interactive CTA. Touch vertical pan remains enabled. Reduced motion renders a complete static field and stops continuous work. Unsupported WebGL retains readable DOM links and a decorative SVG field.
- Resize reconfigures the tank and pill collider; context restoration reuses live owned state; cleanup removes listeners, observers, canvas, shader and geometries exactly once.

## Reproduction / regression commands

- `node scripts/test-about-contact-fluid.mjs`: real solver, native metrics, initial center fall, hover-vs-hold, localized falling grains, mass accounting, immediate drain closure, finite/contained state, reused buffers, static reduced state, pill collision, four instanced geometries and idempotent disposal.
- `CHROMIUM_MULTIPROCESS=1 BASE_URL=http://127.0.0.1:3003 node scripts/test-about-contact-browser.mjs`: actual About at 1720×912, 1568×1230 and 390×844; pointer holds/movement/release, quick click and keyboard copy/mailto, underline/word/cross composition, visibility/menu/offscreen sleep, real WebGL context loss/restore, reduced motion and overflow. Optional `CTA_CAPTURES` writes inspection images outside Git.
- `test-about-video-reconstruction.mjs` retains hero's opaque-output checks and whole-route handoffs. Focus assertions now inspect the three source-style underline geometries, not the retired full-width CSS gradients; pill dimensions follow 15em × 3.375em at the native 1.1em font scale.
- Lint, strict typecheck and production build remain required. SwiftShader tests are not physical-GPU/phone certification or exact video-parity proof.
