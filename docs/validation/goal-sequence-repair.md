# Focused goal-tunnel / falling-astronaut repair

Date: 2026-10-25. Branch: `arena/8509e843-website-cloner-jp`.
Baseline: `c380830` (clean working tree at entry). No branch switch, reset, commit, or push was performed.

## Evidence and scope

The sequence is implemented by `GoalTunnelSection` (`trussSystem`, `blueCorridor`, `mainAstro`, and the glass mesh). There is no separate Tesseract component or Tesseract-named asset. The reference shows an open square architectural shaft around a falling astronaut, followed by the blue corridor, monitor breakthrough, and astronaut wait.

Evidence consulted:

- `src/data/reference/lusion-ground-truth.json`: homepage section order, goal copy, and connector spline. This JSON **does not contain** the shaft's geometry assembly, camera keyframes, or fall timing.
- `docs/validation/phase-h/reference/{1440x900,390x844}/home-05-black-tunnel-early.png`, `home-06-black-tunnel-twist.png`, `home-07-white-blue-tunnel.png`, `home-08-desktop-frame-out.png`, `home-09-glass-break-drop.png`, and `home-10-end-cta-wait.png`.
- `docs/validation/phase-g/discrepancy-register.md`: historical captured-engine description of 53 deformation transforms, 288 astronaut frames, and float/drop/wait clip boundaries.
- Actual bundled `.buf` headers, attributes, bounds, and frame-to-frame transform differences.
- Fresh local desktop baseline and subsequent desktop/mobile WebGL captures.

Live `https://lusion.co/` was attempted but failed with `SSL_ERROR_SYSCALL` under this sandbox's outbound-host restrictions. The reference images are historical repository captures, not a new live-site capture. Correspondence uses the existing section landmarks and normalized range positions, not a claim that local/reference durations are identical.

## Verified defects and repairs

### 1. Encoded girder data was rendered as final geometry

`grid_base_hd.buf` contains four unwrapped faces around X = 0, 1, 2, 3, with normalized extrusion Y and a separate `height` attribute. Rendering these positions directly produced large solid strips. The old black-shaft assembly also inserted the arched `tunnel_block_wall.buf` corridor mesh with guessed transforms.

The repair decodes the four faces against the cross-section supplied by `grid_base_ld.buf`, combines the detailed surface and authentic base, and uses `grid_structure_hd.buf`'s actual positions and rotation axes. It retains the existing world aperture and twist/color controls. AO, UVs, normals, and per-cluster information are preserved. No cube, wireframe substitute, portal, or new decorative geometry was introduced.

### 2. Whole-shaft travel reset every unit

The controller used `(tTunnel * 44) % baySpacing`, resetting the entire finite seeded environment repeatedly. Travel is now continuous; the shader recycles complete girder instances across the complete shaft length, without wrapping individual vertices.

### 3. Captured astronaut poses were no-ops

The preferred captured model used ordinary `Mesh` objects and returned an empty named-bone map. Consequently, `applySuitJointPose()` could not articulate it.

The existing loader now exposes the captured model as `SkinnedMesh` parts with its existing two-weight data expanded to Three.js's four-slot format. It samples the existing 53-transform palettes with normalized quaternion interpolation. The 15,264 records are frame-major (`288 × 53`); this was checked against temporal differences and the historical capture ledger. Float, drop, and wait are driven by scroll, not by an accumulated mixer clock. Echo astronauts share geometry/materials but have independent palettes. The legacy GLB/named-pose fallback remains available.

Influence is zero during emergence, preserving the original source bind silhouette. The visor overlay follows the animated captured head transform.

### 4. Discontinuous root, camera, lighting, and corridor handoffs

The emergence endpoint and downstream root disagreed in position, scale, and Euler representation. The pullback branch also began with a different position, scale, and orientation. Camera banking appeared abruptly at `tTunnel=.81`; the corridor shifted backward by 2.2 world units at one threshold.

Entry now blends from the actual existing emergence endpoint. Equivalent angle representations avoid unwinding extra turns. The corridor/breakthrough branches share their endpoint transforms, bank roll ramps in, and corridor withdrawal is continuous. Shaft lighting is reduced toward the darker captured-reference appearance, then blended into the blue corridor and portrait lighting rather than switching fill intensities at a branch. These light levels are visual calibration, **not extracted reference constants**.

The `astronautDrop` inspector range now starts at the same coordinate as the actual shatter timeline. The existing section lengths and downstream CTA layout were not changed.

### 5. Portal flash was hidden before its fade ended

The flash veil is a child of the truss group, whose visibility previously ended before the veil's own fade. The parent remains active for the complete flash. The truss material alpha-blends during the overlap instead of painting zero-opacity geometry as opaque black.

### 6. Broken glass used the wrong record ordering and coordinate system

The asset contains 946 pieces and 15 frames, arranged frame-major. The old piece-major lookup mixed unrelated pieces/frames. It also omitted normals, used unnormalized quaternion interpolation, and placed the burst in fixed world space unrelated to the monitor aperture.

Sampling now uses `frame * pieceCount + piece`, unit shortest-arc quaternion interpolation, and reusable output arrays. A tracked regular indexed geometry supplies computed normals. Its rest bounds are projected into the same camera-space aperture as the monitor stencil, accounting for border width, monitor rotation, banking, and aspect ratio.

### 7. Failure coupling and cleanup

Glass loading no longer gates astronaut initialization. A failed glass asset leaves the astronaut sequence usable. Truss loading has rejection and late-unmount handling. Cached source geometries are cloned before disposal ownership is assigned. Textures are tracked as they finish loading, including partial-failure/unmount cases. Skeletons, instance resources, glass geometry, and data textures have disposal paths.

Cleanup removes (rather than re-adds) the visibility listener and clears only the inspector callbacks/ranges owned by this scene. Late-loaded resources are disposed immediately after unmount.

## Exact files changed

1. `src/components/home/GoalTunnelSection.tsx`
2. `src/components/home/GoalDownstreamScenes.ts`
3. `src/components/home/AstronautEmergenceAssets.ts` — necessary because the captured model's pose calls could not work without activating its existing skin data.
4. `scripts/test-goal-sequence.mjs` — asset-backed geometry/animation math regressions.
5. `scripts/validate-goal-sequence.mjs` — focused browser capture, reversal, continuity, failure, and cleanup checks.
6. `docs/validation/goal-sequence-repair.md` — this report.

No dependency, environment, design-token, homepage placement, navigation, project, footer, or CTA component changes.

## UI/UX Pro Max actually consulted

Upstream checkout outside the project: commit `d14efff8ed1faa4187f004f79926f428c8074ec7`. Read upstream `README.md`, `.claude/skills/ui-ux-pro-max/SKILL.md`, and the Python search interface. Used direct documented Python access; no Arena plugin capability was assumed and no design system was generated.

Relevant executed searches included:

```sh
python3 <upstream>/src/ui-ux-pro-max/scripts/search.py "dispose instancing" --stack threejs
python3 <upstream>/src/ui-ux-pro-max/scripts/search.py "instances reuse geometry" --stack threejs
python3 <upstream>/src/ui-ux-pro-max/scripts/search.py "scrub" --domain gsap --max-results 1
python3 <upstream>/src/ui-ux-pro-max/scripts/search.py "scroll animation continuity reduced motion" --domain ux
```

Applied guidance: explicit GPU-resource disposal, shared geometry/materials, deterministic scrub/measurement, visibility/listener cleanup, and honoring reduced motion without pointer parallax. The existing scroll architecture was retained rather than adding a competing GSAP timeline. An initial shader/instancing query returned no match; the successful searches above supplied the relevant guidance.

## Validation

Commands:

```sh
npm run lint
npm run typecheck
npm run build
npm run test:assets
npm run qa
node scripts/test-goal-sequence.mjs
node scripts/validate-goal-sequence.mjs
GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
GOAL_MOTION=normal GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
```

The browser runner uses bundled Chromium/SwiftShader and writes local renders/telemetry under ignored `temp/goal-validation/`. Those outputs are **not reference truth**. Baseline captures are under `temp/before-1440/`. Geometry/pose tests check source immutability, decoded cross-section, valid weights, actual limb deformation, frame-major indexing, unit rotations, and reversible sampling.

### Final results

- **Lint:** passed with no errors; two existing warnings in unchanged `AboutPageView.tsx` and `LusionProjectDetailView.tsx`.
- **Typecheck and production build/postbuild:** passed.
- **Asset route tests:** 18 passed, 0 failed.
- **Repository QA:** all 22 canonical routes, expected 404s, security checks, and 37/37 captured scene/project assets passed.
- **Asset-backed unit regressions:** all three groups passed (girder decoding/source immutability; skeletal sampling/weights; glass indexing/rotations).
- **1440×900 reduced motion:** eight states, forward/backward state and exact canvas-pixel hashes, four handoff probes, native coalesced fast scrolling, complete flash fade, and teardown passed.
- **390×844 reduced motion:** the same checks passed.
- **1440×900 normal motion:** eight states, reverse scroll-driven state, handoff probes, native fast scrolling, flash completion, and teardown passed. Intentional CTA idle transforms were excluded from exact reversal equality; no normal-motion pixel-equality claim is made.
- **All three browser runs:** zero unexpected console/page errors, zero failed asset responses, `gl.getError() === NO_ERROR`, no retained goal visibility listener/canvas/inspector ranges after SPA navigation. Simulated astronaut failure displayed the poster; missing glass retained the astronaut; unavailable WebGL displayed the poster.
- **Local visual inspection:** desktop and mobile beginning/middle/end, blue-corridor transition, shatter, and wait captures were inspected against the historical captures at matching viewport dimensions and approximate corresponding normalized positions. The erroneous solid-strip assembly is replaced by an open shaft, limb animation is active, and shards remain coherent and registered to the monitor. Material detail, density, palette timing, and pose/framing still differ visibly from the reference.
- **Scope check:** only the six listed files changed; no unrelated application component was edited. `git diff --check` passed.

Final reduced-motion captures and reports are in `temp/goal-validation/1440-reduce/` and `temp/goal-validation/390-reduce/`; the normal-motion report is in `temp/goal-validation/1440-no-preference/report.json`. These ignored artifacts are kept outside the Git patch. The production application remains running on port 3000 for live preview.

## Remaining limitations

- Pixel-perfect parity is not established. Reference lighting/material response, fine lattice density, exact clip/root timing, and camera choreography remain approximate; the available JSON does not specify those values.
- The captured mesh now uses Three.js's standard GPU linear skinning. The historical reference describes dual-quaternion skinning, so joint deformation is not mathematically identical to the original renderer.
- Reduced-motion GPU pixels can be compared exactly at identical scroll positions. The existing normal-motion CTA idle and optical animation are intentionally time-dependent; normal-motion tests compare the scroll-driven state, not identical animated pixels.
- SwiftShader validation does not establish hardware-GPU bloom/MSAA fidelity, physical-device mobile performance, sustained 60 FPS, or absence of GPU-driver-specific problems.
- Unrelated section source files are unchanged and the existing route/asset QA is run. This is not a fresh pixel-by-pixel visual audit of every homepage section.
