# Goal / astronaut reference-led rebuild

Date: 2026-10-25. Branch: `arena/90a6cf48-website-cloner-jp`.
Scope: the existing goal section only; no homepage, navigation, project, archive, footer or global-style redesign.

## Reference and guidance actually inspected

- Rendered original captures: `docs/validation/phase-h/reference/1440x900/home-05-black-tunnel-early.png`, `home-06-black-tunnel-twist.png`, `home-07-white-blue-tunnel.png`; mobile twist/blue equivalents under `390x844`.
- The reference is a rectangular, multilayer architectural shaft, not a free-floating mathematical 4D hypercube. It turns into a reflective spiral, with pink/cyan suit echoes, then a banked cobalt corridor with raised hollow heart/ring motifs and bright openings.
- The early reference suit is inverted and back-facing. The blue-flight suit is considerably smaller than our previous implementation. Geometry, whole-body motion, skeletal motion, camera bank and optics are separate systems.
- `docs/validation/phase-g/discrepancy-register.md` records the captured 53-bone, two-influence dual-quaternion renderer, skeletal frame ranges, root curves and four source mesh parts. This is historical evidence, not a new inspection of the original application's source.
- Live original page text was available, but a fresh Chromium navigation to `https://lusion.co/` failed with `net::ERR_CONNECTION_CLOSED`. No new live-original WebGL movie was captured.
- Read the repository's actual `clone-website` skill and its inspection/motion references, the installed Next `use client` guide, and the public UI/UX Pro Max skill from `nextlevelbuilder/ui-ux-pro-max-skill`. Executed its Three.js searches for PBR/instancing/normals and color-space/disposal guidance. The latter returned explicit linear-working-space/output-conversion and GPU resource-disposal advice. Its dataset targets Three 0.185.1; this project uses 0.186.1, so the installed engine remains authoritative.
- Visited `https://skills.md/` as requested. Its catalog query did not provide a verified Three.js skill; a candidate `threejs-animation` markdown endpoint returned `skill not found`. No hosted skill execution, account/credit operation or CLI installation was performed or claimed.
- The older six imagepaste binaries/red annotation remain unavailable; this work does not claim to identify or fix the particular marked glare.

## Asset investigation → implementation decisions

| Evidence decoded/viewed | Baseline gap | Rebuild |
| --- | --- | --- |
| `grid_structure_hd.buf`: 96 placements; `grid_structure_ld.buf`: 456 placements, extending from ±20 to ±60 source XY | Only the inner placement set was instantiated | Two instanced batches; both source placement sets, with a thinner and darker distant LOD. Three desktop repeats / two mobile repeats: 1,656 / 1,104 placements. |
| `grid_base_hd.buf`: four unwrapped faces, source UVs, tangents, AO and physical relief; LD normalized Z-aligned girder | Flat procedural phase color, original tangent discarded during merge | Preserve/rotate source TBN with each decoded face; base/ARM/normal atlases drive a two-light GGX material. Correct inverse-transpose normal and tangent deformation through the helical funnel. Metal writes depth so far girders cannot overwrite near surfaces. |
| `greeble_base.webp`, `greeble_arm.webp`, `greeble_nor.webp` | Present locally but unused | Base is sRGB; ARM and normal remain linear data. Repeating source UVs and bounded anisotropy. Explicit tone/output chunks cover direct rendering; composer output remains linear until OutputPass. |
| Four captured astronaut meshes, 53 rigid transforms, two influences, 288 frames | Three linear blend skinning instead of the recorded original DQ method | GPU dual-quaternion blend: hemisphere correction, real/dual normalization and orthogonalization, rigid position/normal/tangent transforms. Uses Three's existing per-rig bone texture; shared primary/echo materials never capture one rig's palette. Legacy GLB fallback stays unpatched. |
| Separate 100-frame `astronaut_in_animation.buf` and `astronaut_out_animation.buf` | Unused; whole-body orientation was exclusively invented Euler rotation | Allocation-free clamped position/quaternion samplers; source attitudes replace the downstream manual attitude through a calibrated entry-basis and in/out blend. Existing authored framing remains, with subtle captured XY displacement and a smaller/deeper blue-flight subject. |
| `tunnel_block_base.buf`, `tunnel_block_wall.buf`, `white_block.webp` | Painted cloud/ring texture on a box; generic flat arches | Captured base/wall modules supply the architectural shell and baked recess shading. **The supplied wall mesh is arches, not the reference heart outlines.** Heart/ring motifs are therefore explicitly reconstructed extrusions, not claimed as captured source geometry. Fixed motif layout, merged geometry, no random cubes or particle substitute. Procedural corridor remains an asset-error fallback. |
| Original blue reference has continuous depth, not a luminous rectangular card halfway down the shaft | Existing end plane was smaller than the new cross-section and too near | Fit the cap to the actual far cross-section and move it with the corridor train. |
| Glass should reflect the environment it belongs to | Environment snapshot cloned the procedural fallback before asynchronous source modules arrived | Initial fallback snapshot plus one refresh when source architecture is ready. Temporary reflection scene lights its white motifs; stencil state is restored in `finally`. No per-frame cube capture or PMREM rebuild. |

### Geometry, lighting and optics

The shaft still uses captured bays, not separately animated boxes. A single virtual coordinate drives bay recycling, depth-dependent twist and pinch. The deformation's Jacobian supplies the tangent/normal correction: otherwise a visually twisted girder would retain straight-shaft lighting.

Lighting progresses from cool silver/cyan through warm/red to pink/cyan. Removed the unsupported broad green/cyan core glow during the mid-twist; the core now appears only during the late vortex. The pre-existing downstream full-screen ring remains disabled. Additional camera bank is continuous into the portal/blue transition.

Hardware desktop composition retains high-threshold bloom and adds a bounded, spatial radial streak/edge-dispersion pass, then OutputPass. The central subject stays sharp; there is no history buffer to leave temporal ghosts on reverse/skip. The existing mobile/SwiftShader policy still bypasses the composer, so those paths do **not** claim identical bloom/lens output to the original mobile renderer.

## Motion / ownership

The existing owner remains `GoalTunnelSection`, not another canvas, R3F root, scroll trigger, physics clock or animation mixer. The chain is:

`HomePageView` → `GoalTunnelSection` → `GoalDownstreamScenes` + `AstronautEmergenceAssets` → existing contact/next-section handoff.

- Native tablet entry remains normal scrolling.
- At the established enlarged-tablet activation, the existing monotone autonomous path owns the section until handoff. Nominal duration remains 26 seconds, with the existing delta-time cap.
- That one coordinate drives tablet exit → early shaft → warm/twist/echoes → vortex → cobalt flight → monitor pullback → crack/fracture → emergence → wait/CTA.
- Skeletal ranges remain 0–89 float, 90–139 landing, 140–287 wave; each clone retains an independent pose palette.
- Source whole-body curves are separately sampled, rather than adding another full Euler tumble to their rotations. Their phase mapping and the inverted camera basis are local calibration: **the original application's exact root timing/camera mapping was not recovered**.
- Outgoing root frames blend continuously from current flight into the exit curve. A first regression caught a hard root-frame change at monitor pullback; that branch was removed rather than weakening the continuity assertion. A second caught a shaft/blue camera-bank boundary; its fade now reaches zero before the existing blue-bank branch.
- Existing pause/resume/skip, wheel ownership, visibility/menu pause, Contact cancellation, replay/rearm, history, reduced-motion, resize and unmount paths remain owned by the existing controller.
- New resources use the existing disposer, including late async texture arrivals. Motif intermediate geometries are disposed after merge; the lens pass is disposed with composer passes.

## Validation

All four final browser suites exited successfully. Intermediate failed runs were fixed and rerun; their assertions were not relaxed.

- Production build: passed.
- TypeScript: passed.
- ESLint: zero errors; the two existing unrelated warnings remain.
- `scripts/test-goal-sequence.mjs`: six groups passed, including the existing 30,000 monotone-playhead samples, girder decoding/source immutability, decoded TBN handedness, both 100-frame root curves forward/backward/clamping, DQ shader replacement/rig-palette ownership, captured skeleton poses/weights and 946-piece glass interpolation.
- Asset-route/security tests: 18/18 passed.
- General QA: 22 canonical routes plus expected 404/security checks passed. Extended the existing gate to cover the newly used curves, outer lattice, greeble atlases and corridor modules: **50/50** scene/project media assets delivered nonempty bodies.
- Browser matrix: **1440×900 normal/reduced and 390×844 normal/reduced all passed**: 11 sampled phases, reverse scene-state sampling (including exact GPU-pixel hashes for reduced motion), four transition probes, portal flash completion, native fast scroll, no sampled GL errors, no console errors or failed assets, SPA teardown and isolated astronaut/glass/WebGL failure fallbacks.
- Normal-motion policy tests passed autonomous activation without further input, pause/resume/skip, input ownership, menu/visibility policy, resize, reduced-motion change, Contact/history cancellation, reverse/rearm and final CTA handoff. Desktop recorded 926 playing-state telemetry samples over 107.084 seconds; mobile 445 over 51.539 seconds. These are **SwiftShader timings**, not hardware frame rate or the authored 26-second ideal duration: the existing per-frame delta cap stretches playback on a slow software renderer.
- Final handoff: desktop native `40733` / virtual `40733.44`, CTA top `504.359px`; mobile native `38144` / virtual `38143.8`, CTA top `464.734px`. Both released scroll ownership, completed one run, and reached wait progress ≈0.42.
- Maximum sampled matrix component change across ±1 CSS-pixel boundary probes: astronaut `0.000535` desktop / `0.000666` mobile; camera `0.00000203` desktop normal / `0.00020818` mobile. Original assertion thresholds remain 0.03 / 0.01.
- Maximum sampled single scene render: desktop 27 draws / 261,645 triangles, mobile 18 / 170,019. These counts exclude the normally bypassed software/mobile composer and do not measure GPU time.
- Additional 1024×900 normal-motion compositor probe: deliberately overrode only the software-renderer label to exercise the desktop MSAA/bloom/new lens/OutputPass path **on SwiftShader**, not to simulate physical hardware performance. Captured twist output had no console errors and `gl.getError() === 0`.
- Persisted compact results: [`goal-reference-rebuild/results.json`](goal-reference-rebuild/results.json). Local reduced-motion early/twist/blue images for desktop/mobile and the explicitly labeled forced-compositor image are alongside it. They are local validation output, not original reference frames.

## Remaining visual differences / limits

This is a reference-led rebuild, not a verified exact reproduction. The saved reference's metal highlight distribution, optical softness/bloom, rich environment reflections, echo positions, camera framing and motif arrangement are not pixel-identical to local SwiftShader output. The ring/heart geometry and phase timings are reconstructed. Reflections are static cubemap snapshots rather than dynamic screen-space/full-scene tracing. Hardware GPU frame rate, physical touch/pinch, thermal behavior and real background-tab suspension have not been measured. Screenshots alone do not establish motion parity.

No new dependency, global token, environment secret or unrelated page change is included.
