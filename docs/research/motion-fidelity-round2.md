# Motion/material fidelity — second reference-first pass

## Evidence reviewed before code changes

Baseline: clean `61b8b20`, served production port 3003. The prior all-route inventory remains in `site-fidelity-audit.md`; passing layout gates are not motion parity.

Re-extracted and actually viewed the supplied Home/About/Projects recordings at **1, 3, 8, 16, 24 and 32 seconds**. These recordings include browser chrome: their full-frame coordinates are not application viewport measurements. Sequences and fresh **normal-motion** desktop/mobile Home captures are under ignored `temp/motion-fidelity-round2/`. Also viewed historical native 1440×900 Home opening and inspected native shader, body solver and camera code. These are not fresh rendered live-site captures.

## Confirmed differences and work order

| Surface | Evidenced discrepancy | Disposition |
|---|---|---|
| Home opening materials | Current sharp white strip-light outlines, electric blue lacquer and crushed-black background are conspicuously unlike the recording's matte/gloss mixture, neighbouring-shape reflections, baked bore/self shading and dark charcoal field. Current renderer is physical material + ACES + studio PMREM, not native matcap shading. | P0: replace the rendering model with inspected native equations/assets; don't just adjust roughness until a screenshot happens to look closer. |
| Home opening dynamics | Current 23 differently scaled capsule bodies, golden-angle spawn and weak sinusoidal centre force are invented. Native uses 22 equal-radius opaque bodies plus 2 desktop glass bodies, seeded spawn/velocity, spherical contact response, gravity 40, contact-dependent drag and velocity-led rotation. | P0: source-derived dynamics, preserving pointer release/cancellation and reduced-motion semantics. No claim identical random/time history. |
| Home opening projection | Fixed 32/33-degree local camera has no native arrival dolly. Native uses aspect-dependent full-viewport FOV, stage clipping and an arrival dolly. | P0: derive the local-stage aperture from the native viewport camera instead of arbitrary zoom. |
| Case-study shadows | Last pass restored gallery structure, reveals and basic foliage, but not the native per-channel multi-pass blur and world-space shadow projection. | P1: keep the approved reel/metadata layout; correct its graphics pipeline rather than redoing the layout. |
| About expertise | Video 32s shows a traveling white ribbon and sequential card turns; a reduced/static opening capture cannot verify that sequence. | P1: compare normal scroll poses and native timing; protect already approved hero/recognition/CTA. |
| Home editorial/tunnel, About terrain/plume/team, archive/end particles | The video contains distinct systems, not interchangeable decorative dots. Existing source-derived implementations must be compared by matching phase, not by a reduced screenshot or a whole-video average. | Preserve current approved acts, regression-test shared changes and keep unverified trajectories/timing explicit. |
| Shared menu/footer/transitions | Prior approximations remain; source videos do not expose every menu/footer/mobile state. | Do not invent particles or certify unseen choreography. |
| Fonts/branding | Standing permitted-font policy and JITHIN customization remain. | Do not silently undo either under the generic exact-clone request. |

## Implementation and verification

### Shipped P0: native Home opening

- Replaced the prior physical-material/ACES/PMREM hero with the inspected vertex/fragment programs, actual high/low cross buffers, HDR matcaps and blue-noise texture. The shader consumes native directional self-AO, smooth normals, thickness, rough/sharp matcap channels and every other body's position/rotation/color for analytical neighbour shading. Desktop glass has front/back captures and four blur levels; its prepass/blur is adapted, not certified frame-identical.
- Kept raw native RGB values **locally**; did not disable Three color management globally or change the approved downstream renderers. Final display remains opaque.
- Replaced 23 differently scaled capsule bodies with native-seeded, equal-radius spherical contacts: **24 desktop bodies including 2 glass; 22 opaque mobile bodies**. Preserved central gravity/contact drag, velocity-led rotations and ray pushes. The renderer has no RAF: one React owner controls visible time, input, resize, menu/reel/transition/visibility/offscreen guards and disposal.
- Adapted native full-viewport FOV/arrival dolly to the clipped stage. Maintained blue-only accents, pointer cancellation, keyboard pulses, touch-no-hover, reduced/static rendering and sculptural SVG fallback. Crossing 812/813px disposes/replaces the scene so glass/body counts actually change, with one canvas remaining.
- Fixed actual `.exr` **403** responses by adding binary MIME support to the existing manifest-guarded route. No manifest, font, path or symlink restriction was removed, and no inspection bypass was enabled.
- Browser tests exposed a fresh-pulse aging bug after slow GPU frames; newly delivered impulses now survive their first displayed frame, then decay normally. Numerical coverage includes the stalled-frame case.

### Evidence and limitations

The first capture attempt used the matcap fallback because of those 403 responses. It was **not** accepted as visual evidence. After fixing asset delivery, fresh desktop/mobile static and normal screenshots were actually opened and reviewed. The matte/gloss mix, shaded bores, broad highlights and distributed cropped cloud are visibly closer to the supplied/reference opening than the generic PMREM baseline. This is a qualitative comparison, not synchronized pixel equality. Production normal captures after interaction and breakpoint replacement were also opened.

Explicit adaptations: 100-step warm start; fixed 1/60 simulation with at most three substeps per frame; deterministic local click randomness; continuous visible-time rather than native random noise offsets; local-stage camera conversion; compact blur passes and charcoal/blue background; software-rasterizer normal-motion budget capped at 320,000 pixels. Native noise history, exact contact/camera time history, glass/blur and background are **not** certified identical. SwiftShader CPU submission timings are not physical-GPU FPS.

### Actual production verification

Production preview **3003**, process `website-05017d96`, build **`yGnDAfDwlNhcmDxISwXEQ`**. The implementation was built on `61b8b20` plus this round's working patch. Fetched all **22 canonical HTML routes** and matched their entire HTML against generated build output; **26 unique served JS/CSS files** also matched local build bytes. Identity evidence: ignored `temp/motion-fidelity-round2/production-build.json`. This avoids treating the port/branch name as proof of fresh code.

| Gate | Result and scope |
|---|---|
| `npm run check` | PASS: lint, strict TypeScript, production build. Final subsequent test-only changes also pass lint/typecheck. |
| `npm run test:motion` | PASS: existing cinematic/math and retained legacy solver checks **plus a new independent native-solver test**. Legacy capsule tests alone are not evidence about the new solver. |
| `npm run test:home-hdr`, base 3003 | PASS: both exact on-disk EXR byte streams/magic, binary MIME/security headers, range/416 behavior, unlisted EXR rejection, encoded path/null attacks and commercial-font blocks across namespaces. Does not replace the older isolated fixture suite or claim new symlink-attack execution. |
| `npm run validate:home-native`, base 3003 | PASS: real native assets/no shader errors, 24/22 bodies/23 or 21 neighbours, 2/0 glass, actual ray positional displacement, release/cancel, live idle momentum, keyboard pulse, menu/offscreen sleep/resume, live reduced-motion freeze, 812/813 scene replacement, actual context-loss and forced fallback. Report: `temp/motion-fidelity-round2/validation/report.json`. |
| Home editorial browser regression | PASS 1440×764 normal: ribbon/morph reversal, film/depth pixels, all cards, modal/links, cleanup and optional-asset/context-loss isolation. |
| Projects browser regression | PASS 1720×912 normal: 19 depth images/links, glyph/atlas pixels, CTA gestures/keyboard, context recovery/sleep/disposal. |
| About CTA browser regression | PASS 1720×912, 1568×1230, 390×844 normal: held/moving pour/release, click/keyboard, cancellation, visibility/menu/offscreen sleep, context recovery and reduced motion. |
| Canonical all-route capture | **44 observations**, 1440×900 / 390×844, reduced-motion captures. **0 uncaught errors, 0 horizontal overflow**. `temp/site-fidelity-audit/round2-native/report.json`. Not 44 matched-animation comparisons. |
| Projects data, Home editorial units, About copy | PASS. The unchanged 19-route gallery/navigation internals were not newly certified by this round's static capture. |
| Broad legacy `validate-home-motion.mjs` | **FAIL — not hidden or reported green.** New hero hover/release/return/live idle/cancellation passed; editorial and solar/projection checks then passed. The run stops at the existing vortex-intensity assertion (`the exposed metal-truss vortex and spiral core are energized`). The approved tunnel was not modified to force this assertion to pass; downstream checks after that line remain unexecuted in this run. Log: `temp/motion-fidelity-round2/full-home-validation.log`. |

The first broad run exposed a separate test-coordinate issue: rounding the full-morph scroll endpoint down could leave the reel a fraction of a pixel short at 900px height, preventing its exact-completion glyph loop. The helper now brackets the endpoints with floor/ceil; glyph coverage/motion/reversal assertions remain in place. The repeat advanced past those checks to the explicit vortex failure above. The old 23-body and spawn-travel pointer assertions were updated to source-backed 24/22 counts and actual ray-position correction; no pass was inferred from changing those strings.

### Work still open across the site

1. **All 19 case pages:** native world-space foliage-shadow projection, independent RGB blur/readiness/jitter and matched normal-motion transition frames. Current source-informed compositor is not exact.
2. **About expertise:** replace/validate the current 2D flourish against the traveling 3D ribbon; compare sequential card poses at matched normal-scroll phases. Approved hero/awards/CTA are untouched.
3. **Home later acts:** preserve praised scenes; resolve the recorded vortex regression discrepancy with reference evidence rather than arbitrary intensity retuning. No fresh claim of all tunnel/astronaut frame parity.
4. **Shared menu/footer/navigation and unseen mobile states:** require rendered reference evidence; route captures do not establish their choreography. Contact/Labs/utility routes outside the 22-route reference manifest are not included in the 44-observation total.
5. Font Option 2 and pre-existing customization remain deliberate differences.

This is a shipped Home P0 correction within the larger all-page task, **not** a completed exact-clone certificate. Generated imagery/logs remain ignored; no archived bundle is executed at runtime.
