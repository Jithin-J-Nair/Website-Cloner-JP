# Three.js and graphics audit — initial findings / incomplete

## Version and asset facts

Installed/locked: Three.js **0.186.1**, React Three Fiber **9.8.2**, GSAP **3.15.0**, Lenis **1.3.27**. These are observed dependency versions, not proof that every imported API is appropriate or all scene modules were inspected.

The canonical manifest identifies Home hero geometry as:

| Asset | Delivered status | Bytes | SHA-256 |
| --- | ---: | ---: | --- |
| `/assets/models/home/cross.buf` | 200 | 282,676 | `948be63d94e36ee324ebfedfe9ede698f3142b1d1ee4d7ddf1b9039e9accdecc` |
| `/assets/models/home/cross_ld.buf` | 200 | 123,984 | `844075336e90b920aaafce20c2d5bdb225ff7b489b86a5ce662287458922df93` |

See `data/hero-assets.json`. HeroCrossesStage explicitly loads `/assets/models/home/cross.buf`. The low-detail asset being available does not prove that an adaptive LOD switch is implemented or correct. No hero geometry or material was replaced by this task.

## Scope separation

- Home: HeroCrossesStage was subsequently read in full with its physics module; GoalTunnelSection, GoalDownstreamScenes and astronaut/captured-buffer loaders still require a complete scene-by-scene material/lifecycle review.
- About: procedural plume, terrain, source team geometry/glyph field, expertise and CTA each require their own render/resource/lifecycle checks.
- Shared CTA and project media have independent lifecycle and loading costs.
- Preserved experimental Three modules must not be promoted into production simply because their names sound relevant.

The full graphics implementation has **not** yet been inspected. The tracked-file census in `data/code-surface-inventory.json` is only an inventory. No full-scene review, draw-call budget, material parity or shader correctness certification is claimed from it.

## Required comparison evidence

For every relevant scene, record model identity/attributes/bounds, world and camera transforms, scale, FOV/aspect, light/environment setup, shader uniforms, output color transforms, DPR, render tier and exact progress before judging the screenshot. Use structured state alongside render evidence, consistent with the previously read Blender state-inspection methodology; Blender was not run.

Current source-browser access is blocked. Consequently, no live silhouette, lighting, refraction, camera angle or motion match is scored 5. A successful Canvas or nonempty buffer is not enough.

## Technical verification remaining

- Confirm low-detail/adaptive-resolution paths and unavailable-WebGL/reduced-motion behavior.
- Inspect async loader cancellation, scene-owned allocation/disposal and context recreation.
- Reproduce the historical wrong-context cleanup warnings before changing resource ownership.
- Measure texture/model transfer and decoded memory separately from file presence.
- Inspect camera, world-space normal and color-space correctness using the installed Three APIs and documentation/source.
- Profile GPU queries only where supported; report unavailable values as unavailable, not CPU-derived GPU FPS.
- Exercise route transitions, hidden/offscreen pause, resize, repeated entry and physical-device behavior where access exists.

No post-processing engine, shader package, new model or invented source asset was added. Existing procedural 3D plume and authorized source team assets are preserved. Source-asset rights remain distinct from ECC's MIT documentation license.

## Implementation batch: what changed and what did not

- Release activity uses actual elapsed time while bounded collision integration and held-pointer response remain unchanged; numerical positional-equality checks and the unchanged full Home motion browser gate pass. This is not a new shader, geometry or camera.
- Source team geometry and the real procedural 3D plume are preserved, not replaced by video or a generic sphere. Original source-loader security/stale-load/recovery/disposal tests remain byte-identical to HEAD and pass with additional separate lifecycle checks.
- Fifteen client SVGs and source-derived card-back ink restore available artwork; this is 2D source-asset identity, not certification of the 3D field/materials. The PNG generator runs in prebuild using the tracked bundled source; provenance is `data/implementation-01/card-derivation.json`.
- Recognition vectors are authored approximations to observed eight-lobed / concave-star / 3×3-dot marks, not recovered proprietary vector control points.

All-route local-checkpoint **static** raster regression explicitly hides canvas/video on both sides; unmasked review images are also retained. Zero static differences must never be represented as zero GLSL/Three.js differences or original-image parity. Normal About follow-up records the real scene probe while offscreen; its frameTimes are RAF intervals, not GPU FPS.

## Available native expertise connector — not yet promoted

Canonical About `connectorSpline` points to `/assets/models/lines/line_capability.buf`. The existing validated container decoder was used for inspection: meshType Mesh, 640 vertices, 1,914 indices; packed CP/position/Cd attributes. CP pairs share X/Y while their third values alternate 0/1; original shader semantics/width/draw progress are not inferred from the attribute name. A diagnostic 2D plot suggests the stored loop; it is not a recovered camera or original renderer. Current expertise SVG still uses an authored path. Native shape placement/progress must be calibrated against the recording before replacing it; this remains an explicit graphics gap rather than an invented curve claim.

The last scoped fixes are 2D mobile artwork layout and missing project text, not GLSL/material changes. The 120-state and affected 18-state static gates cannot score this connector or plume/terrain optics as verified high fidelity.
