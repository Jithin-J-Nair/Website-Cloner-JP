# Home goal: tunnel, folding space, blue corridor and glass exit

## Scope and authority

This change is limited to the Home cinematic and its tests. The completed About hero, contact/CTA, recognition renderer and assets are not edited.

Primary visual authority: `public/videos/Lusion-home.mp4` (45.45-second browser recording). The cinematic is approximately the 20–40-second portion of that recording; browser chrome/padding is excluded when comparing the actual viewport. This is not a new capture of the live website.

Implementation evidence: archived `Design_Lusion.co/_astro/hoisted.CUO_IjfL.js`, Git blob `0c57277a2102a61f761357ce2cd432d035cd0a13`, inspected locally as `temp/preview-recovery/inspection/reference.js`. The relevant classes are `GoalBlackTunnel`, `GoalWhiteTunnel`, `GoalTunnelAstronauts`, `GoalTunnelGlass`, `GoalTunnels` and `Bloom`. The archived application is **not** executed or loaded into the site. The existing approved BUF/texture asset route is retained.

## Differences identified before editing

| Recording | Previous Home implementation | Reconstruction |
| --- | --- | --- |
| Dense, fine, irregular industrial lattice moving through depth | CPU-decoded ordinary girders, repeated shaft bays | Preserve encoded base geometry, height/cluster/center attributes and captured 96-inner/456-outer placements |
| The shaft itself twists and folds into pink space | Separate accretion/vortex core and decorative projected glass cages | Apply the source stereographic lift, 4D rotation and reprojection to the actual grid vertices |
| Hard color beats, local gleams, chromatic peripheral halo | Approximate smooth phase colors; bloom absent on software/mobile | Source palette/beat mapping, feedback and convolution diffraction/halo on all rendering tiers |
| Blue walls deform and carry changing organic rings | Repeated blue arches | Source 16 base + 16 wall instances, source deformation and 81-neighbour four-dimensional Voronoi shader |
| Astronaut recedes during the title, tumbles, then returns | Extra Euler rotations, hand-authored spiral, guessed depth/scale, incorrect root basis | Native root curves, a consistent scene scale and captured loop/transition/idle palette blending |
| Thin transparent fragments reveal/refract the running scene | Added opaque shard sidewalls, 1.2 spread and a compressed early explosion | Captured 946-piece/15-frame rigid trajectories, derivative normals and live-buffer reflection/prismatic shading; shrink only during the final drop quarter |

Inspection frames/contact sheet and initial screenshots are under ignored `temp/home-reconstruction/`. The first old `before-Tunnel-0.2.png` was a stale seek frame and is not reliable phase evidence. Later captures wait for actual rendering/progress.

## Implementation and important pipeline details

### Geometry and coordinates

`GoalReferenceWorlds.ts` owns the black/white architecture, instanced attributes, source-shaped rates, texture loading, monitor stencil and quarter-resolution feedback. It introduces no RAF, event listeners, second scroll owner or autonomous playhead.

The source camera's default Z is 25; the existing Home camera's default Z is 5.2. `GOAL_WORLD_SCALE = 0.208` scales native object/root positions and geometry consistently. Native-distance computations in shader AO, light position and fade masks are adjusted accordingly. Native near/far distances and the source quarter-angle dolly compensation are restored downstream. The source dynamic FOV follows the output frame height, rather than adding an arbitrary camera bank.

`GoalReferenceShaders.ts` adapts the inspected shader strings. The black transform include is inlined; greeble base red and ARM are read separately instead of GPU-packing base into ARM alpha. The archived code explicitly disables Three color management, so palette colors are assigned without an sRGB-to-linear conversion. This is local to the new world; global color management and About rendering are unchanged.

Pulse and linear rates are integrated along the shared virtual coordinate. Sampling/reversing does not accumulate positional drift. This deterministic reconstruction uses a normalized ten-second black motion parameter; it does not claim recovery of the recording's original per-frame scroll/delta history.

### Feedback, bloom and display alpha

Black feedback uses **RGBA8**, mirrored-repeat, quarter-resolution ping-pong targets. Normal rendering captures the resolved architectural scene target after LD/HD geometry and before foreground astronauts, using disjoint read/write attachments. It does not redraw the entire lattice for feedback. Static/reduced-motion previews additionally use a shared-geometry/material clone for their two fixed feedback iterations. Target/clear state is restored. Reduced-motion scrubs use two fixed feedback iterations from a cleared input, giving repeatable reverse samples; normal playback retains temporal feedback.

`GoalReferenceBloomPass.ts` adapts the source eight-ray convolution kernel, Stockham FFT butterflies, complex multiplication, gain, saturation and RGB-separated halo. Kernel transforms are cached until resize; kernel storage never aliases scratch targets. Scene input and filtered bloom cache are **RGBA8**, while FFT scratch is float. These boundaries matter: unbounded HDR feedback grows uncontrollably, and unbounded bloom alpha/saturation produces a magenta flood. The final display is opaque; shader alpha is light-selection data, not display opacity.

The earlier emergence retains its ACES/sRGB/UnrealBloom pipeline. Only one of that pipeline and the native cinematic pipeline is active at a time, preventing double tone mapping/color conversion. Native bloom is not omitted merely because the renderer is software or the viewport is narrow. CPU/software normal-motion rendering is bounded to 640 × 400 equivalent pixels for the native 81-neighbour field/FFT; static/reduced-motion inspection and physical GPUs retain the existing native-resolution path. Hidden preparation draws exercise real output-program variants and a nonblocking, cancellable GPU fence completes before the timed movie starts, so first-use compilation cannot charge seconds to playback. The preparation uses the same renderer and existing animation owner; this is not a phone/GPU performance claim.

The astronaut retains the repository's Three-owned physical materials and dual-quaternion skinning bridge. The materials' native-stage alpha selects specular bloom instead of blooming the entire white suit. Their conventional linear PBR colors receive a local display transfer before the unmanaged cinematic composite; artist-authored tunnel shaders do not. This avoids darkening the suit by dropping its output transfer, without applying a second transfer to the native wall colors. Captured palette sampling now supports a secondary transition palette, with previous emergence identity behavior preserved. The recording's randomly initialized Brownian trajectory cannot be recovered exactly; the source 512-entry smooth value-noise/three-octave FBM structure and amplitudes are reconstructed with a fixed seed for reversible sampling. The old inverted root basis and invented orbit are removed.

### Glass and lifecycle

The entire captured rigid animation is stored in nearest-sampled GPU textures (946 × 15). Local directions are rotated at each endpoint and normalized after interpolation, as in the source; CPU PCHIP motion, added thickness and spread are not used by the active glass renderer. The source fragment shader obtains normals from derivatives of view-space positions and samples a live scene-color capture with its reflection/prismatic offset. Fragments use transparent blending and do not write depth. Initial fitting accounts for each fragment's captured initial quaternion.

The source glass radius calculation has a small local adaptation: direction normalization is independent of fragment shrink, avoiding division by zero at the terminal frame and making the stated final-quarter shrink actually work.

Geometry/textures/targets are instance-owned or cloned from the cached BUF data. The existing component disposes them, listeners, GPU queries, the composer and its passes on navigation. Architecture asset failures select the existing static fallback; optional missing glass does not disable the working astronaut sequence.

## Validation and limitations

Tests that mandated the previous invented glass cages, thick GGX/Snell facets, separate event horizon and compressed shatter were replaced with checks of the new active architecture—not retained as false visual acceptance criteria.

- `scripts/test-goal-sequence.mjs`: source attributes/counts/cache isolation, block IDs, monotone travel/phase ratios, deterministic FBM, even/odd FFT scheduling and no read/write alias, root curves, 53-bone palette blending and exact rigid-animation GPU atlas layout.
- `scripts/test-home-motion.mjs`: the active owner uses the native pipeline, source transform/Voronoi/glass contracts and distinct color/display paths. Existing playhead, GPU-query and pointer tests remain.
- `scripts/validate-goal-sequence.mjs`: actual WebGL forward/reverse states/pixels, camera/root boundaries, flash handoff, coalesced scrolling, cleanup and failure behavior; normal-motion mode also exercises autonomous playback and controls. It no longer demands the removed decorative cages or a nonexistent synthetic crack overlay.

Rendered comparisons and browser reports are stored under ignored `temp/`, not committed as large artifacts.

### Completed verification

- TypeScript, ESLint, both motion unit suites, native geometry/rig/glass/FFT tests and `git diff --check`: **PASS**.
- Desktop 1440 × 900 normal motion: **full PASS**, including 201 playing-state polls of autonomous playback, advancing blue-flight poses, all 11 sampled states, pause/resume, resize, menu, replay/skip, live reduced-motion preference, contact navigation, reverse sampling, four handoffs, fast native scrolling, cleanup and astronaut/glass/WebGL failure isolation. Browser error list is empty. `temp/cinematic-validation/1440-no-preference/report.json`.
- Desktop 1440 × 900 reduced motion: **full PASS**, including opaque/nonblank native framebuffer checks, reverse sampling, cleanup and failure isolation. This run preceded the final shared-material bridge deduplication, which is covered by the subsequent full normal-motion run.
- Production mobile-emulated 390 × 844 reduced motion on port 3003: **full PASS** on the final built code, all 11 states, opaque/nonblank pixels, reverse sampling, handoffs, cleanup and all failure cases. Browser error list is empty. `temp/cinematic-validation/390-reduce/report.json`.
- Production build: **PASS**, 29 static pages. The actual served production JavaScript chunk was byte-compared with the new build artifact and checked for the new native display bridge. Local source/chunk SHA-256 evidence is saved in `temp/home-reconstruction/production-build.json`.
- An additional run of the **previous About production build's** asset-route suite reported **18 passes / 3 failures**: the About card SVG viewBox assertion and the Atlas Motion/Everswap catalog rejection assertions. These predate this Home build; their tests, routes and assets are unchanged. No assertion was relaxed and no unrelated route/catalog change was made to hide them.

No pixel-exact parity, physical mobile performance, hardware-GPU smoothness or recovery of random source motion is claimed. The source depth-based 16-tap motion-blur post-effect is not ported in this change; motion is reconstructed through the captured geometry/root/rig trajectories and source-shaped travel/deformation. The pre-existing Home end stickers/diamond implementation remains outside this tunnel/glass replacement. Structural/unit tests are not visual-parity proof.
