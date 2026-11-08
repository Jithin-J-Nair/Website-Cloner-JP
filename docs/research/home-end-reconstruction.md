# Home: glass exit → astronaut wait → “Let's work together”

## Authority and differences found first

Compared the served `c504f17` Home implementation against `public/videos/Lusion-home.mp4`, especially approximately 39–43 seconds, excluding browser chrome. Full-resolution extracted frames and the successive rendered comparisons are under ignored `temp/home-end/`. The archived `Design_Lusion.co/_astro/hoisted.CUO_IjfL.js` (blob `0c57277a2102a61f761357ce2cd432d035cd0a13`) and `reference.css` were inspected; the archived app is not executed by the site.

| Reference | Previous build | Correction |
|---|---|---|
| Sharp die-cut illustrated stickers float up through and beyond the viewport | Invented canvas sticker pack, 18 curated positions, bobbing/orbit-like movement | Original approved `stickers.png` / mobile `stickers_low.png`, all 26 nonuniform atlas rectangles, source cycle/hash/spin/rise/wrap equations |
| Faceted glass gems with localized spectral gleams and diffraction | Simple cone/cylinder shapes and separate additive glint planes; whole sticker patches bloomed | Captured `diamond.buf`, its thickness/normal attributes, 64 instances, source 25-plane internal-refraction shader and source RGB/alpha blending |
| Headline and subtitle appear over the astronaut and stay pinned | CTA text placed 124vh below the start; astronaut-only blank wait, scrolling copy rather than a stable composition | One viewport sticky CTA, native centered composition, 10vw / 19.5vw title sizing, subtitle, five registration crosses and a pill already pinned during the glass breakthrough |
| Landing settles into a live wave/idle loop even when scrolling stops | Captured pose selected only by scroll; hand-authored wave was overwritten by that palette | Retain the captured exit/root; advance its 140–287 idle palette at 60 frames per second after arrival using the existing scene clock |
| Visor cycles through bitmap LED expressions and tracks the head | Invented shader eyes/grin and a card without captured head orientation | Approved 5×23 `astronaut/face.png` atlas at 10 fps, native RGB subpixel card shading; sampled head quaternion follows the same deformation palette |
| Text rolls individual glyphs; hover has thin line decorations | Static Home title | Three word groups, duplicated glyph rolls at the source two-second cadence, staggered reveal and hover/focus line decorations |

## Integration

- `GoalReferenceEnd.ts` owns two instanced draws (gems/stickers), textures and the visor card. It adds no animation loop, scroll manager, event listener or dependency.
- `GoalReferenceEndShaders.ts` adapts the inspected particle/sticker shaders, 25 refractive planes and 26 atlas rectangles. Camera-position and back-face normal calculations account for this application's native-world scale of 0.208.
- Gem RGB replaces its underlying fragment; alpha adds its bloom selection. Sticker RGB uses ordinary texture-alpha compositing while its alpha output clears bloom selection, preserving crisp illustrations rather than creating neon plates. Both feed the existing opaque native FFT final display.
- The source `diamonds-3` hash/sfc32 stream is retained for gem placements and four random attributes. Source gem axes/sticker phase initialization used unseeded randomness; this reconstruction uses independent fixed streams for those, so it does **not** claim identical random placements/phases to the recording.
- The final quarter of the exit eases into a wider end-portrait camera. This is a recording-driven framing adjustment, not a change to the approved shaft/vortex/blue-corridor camera. Portrait uses a wider view to keep the helmet clear of the fixed navigation.
- Normal motion uses the same cinematic time domain and a wait-entry epoch; its gems, sticker cycles, glyph rolls, captured wave and visor continue while the visitor is stationary. Reduced motion uses a fixed scroll-derived sample: no idle motion, glyph cycling or pointer animation.
- Actual-screen preparation now waits for the end atlas/model and visor atlas as well as the tunnel/rig/glass. It exercises the new materials before autonomous playback. The existing cancellable GPU fence, opaque display, single RAF, canonical 20-second movie, and navigation teardown remain.
- Only the `home-dark` branch of the shared CTA is changed. About's dedicated contact section, hero, awards and assets are unchanged. Email/clipboard, keyboard focus, continue-to-footer, static/WebGL fallback and header contrast remain functional.
- Static fallback explicitly clears Home-only glyph/reveal state and restores the email link. Optional gem/sticker/visor asset failures do not suppress the astronaut or contact HTML.

## Verification

The geometry tests now check original mesh/thickness preservation, independent cloned buffers, 64 deterministic gem placements and unit rotation axes, 25 plane equations, 26 source atlas rectangles and their UV bounds. Browser validation additionally checks the visible pinned CTA, hit-tested email link, original asset counts, visor readiness and live idle advancement without scrolling. Reverse-seek contracts remain strict for static/reduced motion; normal-mode reverse comparison excludes only the deliberately advancing end clock and captured idle frame, with explicit bounds/live-advancement assertions.

### Results

- TypeScript, ESLint, the motion/pointer suites, expanded native geometry/FFT/rig/glass/gem/atlas tests and `git diff --check`: **PASS**.
- Production build: **PASS**, all 29 static pages. The actual served JavaScript chunk was byte-compared with the build artifact and checked for the new end-stage code; source/chunk fingerprint evidence is under ignored `temp/home-end/production-build.json`.
- Production mobile-emulated 390 × 844, reduced motion: **full PASS**, including 11 states, opaque/nonblank pixels, exact reverse samples, four handoffs, the new on-screen/hit-tested CTA, continue pill during glass breakthrough, fast scroll, cleanup and astronaut/glass/WebGL failure isolation. Browser errors: none. `temp/cinematic-validation/390-reduce/report.json`.
- Focused production desktop 1440 × 764 end-stage gate: **PASS**. Four sampled wait states; original asset counts and an on-screen, hit-tested email link; live captured idle/visor/particle/glyph motion without document scrolling; exact reduced-motion reverse/no-drift samples; hover line; no floating pill at the footer; clean navigation to About. All three optional gem/sticker/face assets were then deliberately blocked together: the astronaut and visible contact HTML still worked. Browser errors on the normal path: none. `temp/home-end/integration-1440-normal/report.json`; reproducible via `CHROMIUM_MULTIPROCESS=1 BASE_URL=http://127.0.0.1:3003 node scripts/validate-home-end.mjs`. This is separate from the full movie's timing gate below.
- **Full normal-motion autoplay timing is NOT certified.** Development and production SwiftShader runs failed the existing intermediate-stage/advancing-blue-pose assertions. These assertions and the 20-second clock were not relaxed. To separate this from the end reconstruction, the unchanged `c504f17` application sources were temporarily rebuilt and served on an isolated diagnostic port, then restored. That unchanged baseline also failed the advancing-blue-pose gate, with only 11 distinct playing-progress samples. Diagnostic logs are under `temp/home-end/diagnostic-baseline*.log`; the final new-build run is `production-desktop-clean.log`. This does not establish a hardware cause or prove smoothness on physical devices. Static screenshots, end-stage interaction tests and a successful build are not substitutes for this failed timing gate.

## Limits

This is a reconstruction from the supplied recording and inspected assets, not a pixel-exact-parity claim. Source unseeded random phases, elapsed time before the recording, and original pointer/scroll history cannot be recovered. Existing approved substitute typography and the prior retained Three PBR suit remain; the source custom suit lighting and depth motion blur are not replaced here. Screenshots and Chromium/SwiftShader mobile emulation do not establish physical phone or hardware-GPU performance.
