# Cinematic system refinement — implementation and verification


> **Latest follow-up:** Section 9 records the renewed-request audit: softer camera/FOV-aware optics, opt-in asynchronous GPU timing, eight fresh browser modes, and actual query teardown. Sections 1–8 retain the earlier pass and its historical measurements. The renewed audit started with those uncommitted refinements already present. Hardware 60fps and exact live-reference parity remain unverified.

Date: 2026-10-25. Branch: `arena/6d83ea00-website-cloner-jp`. Starting commit: `8e7875f`. Starting working tree: clean.

This is an in-place refinement, not a homepage rebuild. Existing assets, composition, route content, controls, DQ skinning, glass animation, Lenis/GSAP scroll ownership and footer transition are retained. No runtime dependencies were added.

## 1. Exact implementation files

| File | Change |
| --- | --- |
| `src/components/home/AstronautEmergenceAssets.ts` | Replaced the near-fixed spectral-ring shader with source-aware direct pupil scatter and decentered caustics. |
| `src/components/home/GoalDownstreamScenes.ts` | Refined existing nested glazing rotations/depth/edge sweeps, optical fragment rejection and color conversion; optional compact curve tessellation for existing blue-corridor motifs. |
| `src/components/home/GoalTunnelSection.tsx` | World-source projection, visibility/occlusion, continuous blue travel, additional accelerating shaft descent, software render budget and accurate multipass draw counters. |
| `src/lib/home-motion.ts` | Shared 22.5-second clock, continuous blue-flight coordinate and software-motion DPR budget. |
| `src/lib/solar-optics.ts` (new) | Allocation-free soft ray/sphere occlusion and camera/pupil acceptance functions. |
| `scripts/test-home-motion.mjs` | Added solar visibility, portrait normalization, blue approach continuity and software/UHD budget assertions. |
| `scripts/validate-home-motion.mjs` | Added rapid pointer/cancel, genuine emulated touch drag, reverse DOM motion, source projection response and oblique captures. |
| `scripts/profile-goal-motion.mjs` (new) | Repeatable active-phase RAF/CPU/draw/triangle/browser-heap profiling and matched screenshots. |

This report and selected PNG/JSON evidence under `docs/validation/cinematic-system/` are also new. `HomePageView.tsx`, `HeroCrossesStage.tsx`, `FeaturedProjectCard.tsx`, navigation, project content and footer were inspected but not changed: their existing motion ownership is preserved rather than duplicated.

## 2. Evidence and reference limitations

- The uploaded brown-glare image, target image 2 and hero connector image were read successfully.
- The older screenshot specifically carrying the red annotation “1” remains unavailable. It is not claimed to have been recovered.
- Lusion text retrieval succeeded. Actual Chromium navigation failed with `ERR_CONNECTION_CLOSED`; the failure is recorded in the ignored reference-attempt report.
- Saved genuine captures inspected include `phase-h/reference/1440x900/home-04-title-portal.png`, `home-06-black-tunnel-twist.png`, and `phase-c/ref-03-reel-stage--1440x900.png` / `ref-04-featured-top--1440x900.png`.
- These support composition and material comparison, not proof of exact live easing or pointer behavior. No exact-match claim is made.

## 3. Brown-glare cause and optical replacement

The older source was retrieved from commit `cafa538`, not inferred solely from an image. In `buildSpaceOpticalOverlays`, it used a fixed screen centre, broad radial amber/cream/blue bands, a warm coefficient `vec3(1.00, 0.50, 0.14)`, and a broad veil. Nearly the entire circumference remained luminous. There was no world-source visibility or occlusion term. The brown circular artifact was shader-generated, not a missing flare texture.

The merged replacement removed that broad brown fill but retained a nearly centred rainbow caustic with only a small source-induced displacement. This follow-up changes the optical response rather than merely recoloring that ring.

### Mechanism

- Uses the existing solar key's world location as the intended **finite optical-source proxy**; the underlying illumination remains a directional light. This proxy is a composition model, not an astronomical simulation of an infinitely distant sun.
- Projects the source through the current camera after current root/bone matrices are evaluated.
- Applies behind-camera rejection, view-angle acceptance and smooth offscreen falloff. Portrait overscan is measured in the same height-normalized metric as the shader, avoiding accidental extinction on narrow screens.
- Uses soft ray/sphere bounds for the head, torso and existing planet. Bounds are cheap conservative silhouettes, **not exact skinned-mesh depth occlusion**.
- Combines a finite emitter core, a Moffat-shaped scatter tail and a restrained horizontal streak with decentered, incomplete spectral caustics. Source location/incidence change caustic position, radius, asymmetry and exposure. The core/streak appear only when the projected source/composition permits; the title-phase reference primarily shows offscreen-source arcs.
- Neutral/cyan energy dominates; chromatic separation and fine filtered interference are subordinate. No lens PNG, new bloom framework, decorative ghost chain or large orange disc was added.
- Retains destination alpha and the existing linear/HDR → OutputPass pipeline. Shader output chunks also support the direct-render mobile/software path.
- Existing visor glints and planetary limb treatment are retained; this does not replace the genuine astronaut or its lighting architecture.

This is a deliberate analytic optical approximation, **not ray-traced lens optics or a full wave simulation**. Running-scene solar frames were viewed at desktop, portrait and native UHD and compared with the uploaded target. The target is softer and places/poses the astronaut differently; pose/layout were not redesigned to conceal that difference.

Evidence: [before](cinematic-system/before-solar-desktop.png), [after](cinematic-system/after-solar-desktop.png), [portrait](cinematic-system/after-solar-mobile.png), [native UHD](cinematic-system/after-solar-uhd.png). The prior native-UHD [baseline](home-motion/solar-uhd.png) is retained for comparison at the same output size.

## 4. Tesseract, fall and continuous tunnel

The existing three desktop/two mobile nested glazing layers and captured lattice remain. Layers now counter-rotate with distinct restrained amplitudes, have small coordinated lateral offsets, and advance in depth nonlinearly. Their existing environment-map reflection/refraction and Fresnel response remain, with a more readable travelling edge sweep. Fragments with negligible optical opacity are discarded before environment lookups. No random cubes, replacement lattice or particle cloud was introduced.

The common duration changes from 23.5 to **22.5 seconds** (about 4.3% shorter). The existing gravity-shaped `.28t + .72t²` curve now also adds negative-Y descent and negative-Z depth through the shaft. Its derivative increases from `.28` to `1.72` over the normalized drop. The added descent blends out into the existing blue-flight pose; authored root/bone sampling, camera path and phase ordering are retained. It is a coordinated animation model, not a separate physics loop or a claim of constant net gravity across every authored pose/transition.

A concrete visual plateau existed in blue travel: `smoothstep(.815,.995,tTunnel)` saturated, and translation/texture travel stopped while the glass phase continued. `blueFlightDistance(tTunnel,tShatter)` now extends the same accelerating flight coordinate into the glass approach. Translation and texture travel share this distance. This removes that local freeze without another trigger/playhead. The existing scroll-entry → autonomous clock remains the sole playback owner; no new scroll/playhead writer was added. A full playback-trigger failure was not reproduced and is not falsely claimed as newly fixed.

Evidence: [lattice before](cinematic-system/before-tesseract-desktop.png), [layered glazing after](cinematic-system/after-tesseract-desktop.png).

## 5. Hero, reel and Featured Work

These systems were already present and were not replaced without live-reference evidence:

- Hero: camera-ray/depth-plane repulsion of the internal hollow connectors, spring position/rotation return, stable outer container, pointer cancellation, touch exclusion and sleeping settled renderer.
- Reel: shared scroll-driven expansion/translation, border radius and title-spacing response, fixed responsive crop, separate intentional modal playback and background-video visibility/pause management.
- Featured: shared heading/card reveal, bounded image parallax and settling velocity skew; project links, imagery, labels and content are unchanged.

The expanded browser checks verify actual displacement and return, no continuing settled render submissions, rapid movement/cancel, emulated native touch scrolling without latched mouse repulsion, forward/reverse section transforms, decoded footage, offscreen/reduced/modal pause, modal open/Escape and source-camera response. They do **not** prove exact current Lusion timing. No speculative sticky/pinning or generic hover effect was added.

## 6. Actual skill guidance consulted

No Claude Code/Codex/Cursor/MCP installation was assumed or performed. Public Markdown guidance was read; the UI repository's Python 3 search tool was genuinely available and executed directly from a cache outside the app's TypeScript tree.

- **UI/UX Pro Max**, revision `d14efff8ed1faa4187f004f79926f428c8074ec7`: actual `SKILL.md`, plus targeted searches:
  - `render loop performance disposal --stack threejs`: RAF ownership, visibility pause and no per-frame geometry creation.
  - `scroll reveal cleanup --domain gsap`: scoped ownership/cleanup, small transforms, reduced-motion final state and avoiding excessive pinning.
  - `reduced motion animation --domain ux`: context-dependent timing and respecting user preferences.
  - The returned Three.js examples target 0.185.1; the project uses 0.186.1. Existing compatible RAF ownership was retained rather than blindly replacing it.
- **Awesome Motion Design Agent Skills**, revision `b45d60fa5b0f7b7d07331572416b80e17dcfd203`:
  - `skills/motion-director/SKILL.md`: motion purpose, stack/choreography selection, timing and reduced-motion path.
  - `skills/web-motion-auditor/SKILL.md`: running-state audit, focus/reduced-motion checks, desktop/mobile performance and concrete captured fixes.
  - `rubrics/motion-quality-rubric.md`: hierarchy, accessibility, implementation and performance guardrails. No premium launch score is claimed from this software-rendered environment.
- Repository canonical `clone-website/references/framer-and-motion.md`: observe both directions, distinguish drivers, preserve existing Lenis ownership, and disclose reconstructed canvas behavior.
- Installed Next.js client-boundary documentation was read before code changes.

## 7. Measured performance

Test environment: Linux Arena sandbox, browser-reported **2 CPU cores**, Headless Chromium **153.0.8010.0**, ANGLE/Vulkan **SwiftShader Device (Subzero)**, DPR 1, viewport **1440×900**. This is software rendering, not a physical desktop or mobile GPU.

Method: the same profiler sweeps native scroll coordinates through solar, shaft, blue and shatter phases. The application retains its single render owner. Measurements use browser RAF intervals over approximately five seconds per phase, after 1.2 s warmup; screenshots occur outside the measured window. CPU submission telemetry can include driver backpressure. These are small-sample smoke measurements, especially blue (five samples), **not a statistically controlled GPU benchmark**. The advertised GPU timer extension was not used; no GPU-only frame-time measurement is claimed.

| Active phase | Before observed RAF fps | After observed RAF fps | After interval p95 | After CPU submission p95 | After samples |
| --- | ---: | ---: | ---: | ---: | ---: |
| Solar | 2.32 | 3.70 | 633.4 ms | 1.5 ms | 19 |
| Layered shaft | 2.02 | 2.43 | 1000.0 ms | 1.4 ms | 13 |
| Blue corridor | 0.76 | 0.96 | 2316.6 ms | 1.3 ms | 5 |
| Glass/shatter | 1.65 | 2.18 | 716.7 ms | 713.3 ms | 12 |

[Before raw profile](cinematic-system/profile-before-desktop.json) · [After raw profile](cinematic-system/profile-after-desktop.json).

Bottleneck evidence is consistent with software rasterization/vertex load and driver backpressure rather than sustained React render-loop work. RAF/CPU data alone cannot precisely separate GPU execution from driver/compositor work.

Changes based on that baseline:
- Software **motion** output is capped at 960×600-equivalent pixels (576,000 versus 1,296,000 at this viewport); CSS presentation remains 1440×900. This is deliberately lower-resolution rendering, not native 4K.
- Software uses the existing two-repeat truss tier, reducing sampled shaft triangles from 208,697 to 143,609.
- Compact mobile/software motif tessellation reduces sampled blue triangles from 140,025 to 103,161 without replacing captured architecture or motifs.
- Desktop physical-GPU geometry quality remains unchanged. Existing native-UHD pixel cap remains; reduced-motion/static inspection restores full output resolution.
- Multipass renderer counters now accumulate the complete frame instead of reporting only the last composer draw.

Additional 390×844 viewport measurement on the same sandbox, with separated Chromium renderer/GPU processes to avoid launch instability (no before/after comparison implied):

| Active phase | Observed RAF fps | Interval p95 | Samples |
| --- | ---: | ---: | ---: |
| Solar | 4.09 | 449.9 ms | 22 |
| Layered shaft | 2.88 | 933.2 ms | 15 |
| Blue corridor | 1.53 | 966.6 ms | 8 |
| Glass/shatter | 2.83 | 683.3 ms | 15 |

[Mobile-width raw profile](cinematic-system/profile-after-mobile.json). Actual drawing buffer: 390×844. This is a Linux viewport emulation, not measured phone hardware.

**60fps is not achieved or certified on this test device.** Continuous native-UHD performance and physical GPU behavior remain unmeasured. The native-UHD test verifies a static/reduced-motion canvas and actual WebGL drawing buffer at 3840×2160 with `NO_ERROR`, not a 4K/60fps movie. Source texture detail is retained, not invented/upscaled into new 4K source maps.

## 8. Verification and reproduction

Final production build, TypeScript, expanded motion units, six existing goal unit groups and `git diff --check` pass. ESLint has zero errors and the two pre-existing unrelated warnings in `AboutPageView.tsx` and `LusionProjectDetailView.tsx`.

HTTP QA passes 22 routes plus 404 handling, asset security and 50 genuine scene/media assets. Asset/range/security tests pass 18/18.

Browser evidence retained alongside this report covers:
- Desktop/mobile normal: native tablet activation once, then autonomous completion without more wheel input; pause/menu/visibility/reduced-motion/navigation controls; eleven scene states; reverse; four handoffs; continuity; teardown and isolated asset/WebGL failures.
- Desktop/mobile reduced motion: manual/static policy, reverse, handoffs, cleanup and failures; not falsely described as autonomous animation.
- Desktop normal homepage: hover return, rapid cancellation, idle sleep, forward/reverse reel and Featured transforms, footage and modal lifecycle, solar source-camera response.
- 390×844 emulated touch homepage: actual CDP touch drag/native scroll, no hover latch, section transforms and modal lifecycle. This is not a physical phone audit.
- 1440×900 reduced homepage and verified 3840×2160 reduced-motion WebGL output.

Bundled Chromium also produced pre-page `SIGSEGV` launch failures. Remaining checks were rerun using the existing executable override with a test-only Python `execv` wrapper that removes `--single-process` and `--in-process-gpu`. No application code or assertions were changed for that workaround. Desktop before/after profiles both use the original identical launch mode; a mobile profile using separated processes is labelled independently and is not a like-for-like hardware comparison.

Final full cinematic results: [desktop normal](cinematic-system/sequence-1440-no-preference.json), [mobile normal](cinematic-system/sequence-390-no-preference.json), [desktop reduced](cinematic-system/sequence-1440-reduce.json), [mobile reduced](cinematic-system/sequence-390-reduce.json). All four contain eleven states, zero page/console errors, zero failed assets and successful teardown. The latest normal autonomous runs completed in **55.126 s desktop / 46.975 s mobile-width software-rendered wall time**, not 22.5 s physical-display time; the playback clock limits long-stall deltas to retain readable beats.

Final homepage reports: [desktop](cinematic-system/home-1440-normal.json), [touch](cinematic-system/home-390-normal.json), [reduced](cinematic-system/home-1440-reduce.json), [UHD](cinematic-system/home-3840-reduce.json). Additional captures: [hero](cinematic-system/hero-hover-desktop.png), [reel](cinematic-system/reel-desktop.png), [Featured](cinematic-system/featured-desktop.png), [solar at another camera angle](cinematic-system/solar-oblique-desktop.png).

A touch-test failure was traced to native fling inertia racing deterministic seeks; the harness now ends a deliberate drag at rest. Assertions were retained. Initial cloned skill sources also entered the broad TypeScript include set; moving the research clone outside the app tree resolved that baseline-build issue without changing app configuration.

Reproduce with a production server running:

```sh
npm ci
npm run test:motion
node scripts/test-goal-sequence.mjs
npm run check
npm run start
# Another shell:
npm run qa
npm run test:assets
PROFILE_TAG=current node scripts/profile-goal-motion.mjs
GOAL_VIEWPORT_WIDTH=390 PROFILE_TAG=current node scripts/profile-goal-motion.mjs
npm run validate:home-motion
HOME_VIEWPORT_WIDTH=390 HOME_TOUCH=1 npm run validate:home-motion
HOME_REDUCED=1 npm run validate:home-motion
HOME_REDUCED=1 HOME_VIEWPORT_WIDTH=3840 HOME_HEIGHT=2160 npm run validate:home-motion
GOAL_CAPTURE=0 GOAL_MOTION=normal node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
GOAL_CAPTURE=0 GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
```

If the bundled single-process browser crashes before loading any page, the verified test-only workaround can be reproduced as follows (Linux/Python 3; the existing browser scripts extract `/tmp/chromium`):

```sh
mkdir -p temp
cat > temp/chromium-multiprocess.py <<'PY'
#!/usr/bin/env python3
import os, sys
os.execv('/tmp/chromium', ['/tmp/chromium'] + [a for a in sys.argv[1:] if a not in ('--single-process', '--in-process-gpu')])
PY
chmod +x temp/chromium-multiprocess.py
CHROMIUM_EXECUTABLE_PATH="$PWD/temp/chromium-multiprocess.py" GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
```

Run profiles sequentially, without another browser workload, for meaningful comparisons. Ignored `temp/` holds full intermediate outputs; selected evidence is retained here. Remaining limits are live-reference timing/hover access, the missing old annotated image, approximate sphere occlusion/environment-map optics, original texture resolution and unverified hardware/continuous-UHD frame rate. These prevent an honest claim of exact Lusion parity or certified 60fps.


## 9. Renewed-request audit: softer optics, focal response and measured GPU execution

This section records the **new follow-up work**, starting with the existing uncommitted refinements above, not a clean tree. Sections 1–8 describe the earlier pass. Its evidence is retained separately; the new evidence is under [`cinematic-system/revisit/`](cinematic-system/revisit/).

### 9.1 Remaining optical gaps and changes

The prior replacement was still narrow and comparatively ring-like against uploaded image 2. Its caustic centre also hard-clamped the height-normalized source coordinates: further offscreen movement could stop changing that centre. The emitter/scatter footprint had no explicit camera-FOV response.

- Replaced the centre clamp with continuous signed rational compression, `source / (1 + .35 * abs(source))`. Portrait/offscreen camera movement retains a response rather than hitting that hard stop.
- Added bounded relative focal magnification calibrated at a 44° vertical FOV. For relative focal ratio `r`, the shader scale is `2r/(1+r)`; invalid inputs fall back safely. The emitter core, scatter and streak footprints respond to it, with a restrained caustic-radius change.
- Added incidence-dependent pupil defocus and a low-energy neutral Moffat tail. The arcs are broader and softer instead of becoming an opaque brown disc or a new decorative ghost chain. Squared signed distances use multiplication, avoiding undefined GLSL `pow` on negative bases.
- Retained the actual world-source proxy, camera projection, soft silhouette visibility, pupil acceptance, destination-alpha handling and existing direct/composer color pipeline. There is no new texture, bloom dependency, scroll writer or animation loop.

These are **art-directed analytic pupil approximations**, not a measured lens prescription or mesh-accurate light transport. Existing visor highlights/environment illumination remain. The running desktop, portrait and native-UHD captures were individually viewed, alongside the supplied reference. The reference's astronaut pose, placement and exact optical distribution still differ; this report does not label those differences solved.

Current visual evidence: [before desktop](cinematic-system/revisit/solar-before-desktop.png), [after desktop](cinematic-system/revisit/solar-after-desktop.png), [portrait](cinematic-system/revisit/solar-portrait.png), [UHD static](cinematic-system/revisit/solar-uhd.png), [other camera position](cinematic-system/revisit/solar-oblique.png), [retained layered shaft](cinematic-system/revisit/tesseract-desktop.png).

### 9.2 Exact additional files

| File | New follow-up change |
| --- | --- |
| `src/components/home/AstronautEmergenceAssets.ts` | Continuous pupil-centre response, focal footprint, incidence defocus and neutral tail. |
| `src/components/home/GoalTunnelSection.tsx` | Focal uniform/telemetry; explicit `?profileGoal=1` GPU-timer integration and tracked disposal. |
| `src/lib/solar-optics.ts` | Bounded, finite `solarFocalScale` helper. |
| `src/lib/gpu-frame-timer.ts` (new) | Optional three-query asynchronous WebGL2 timer; unavailable/disjoint/context-loss handling and idempotent cleanup. |
| `scripts/profile-goal-motion.mjs` | Optional GPU mode, WebGL-error assertions, in-window samples and deferred phase-tagged summaries. |
| `scripts/lib/summarize-gpu-queries.mjs` (new) | Deduplicates delayed GPU results by ID without assigning them to the wrong phase. |
| `scripts/test-home-motion.mjs` | Focal bounds/continuity; query-ring saturation, unsupported/partial allocation, disjoint, context loss, disposal, and delayed-result aggregation tests. |
| `scripts/validate-home-motion.mjs` | Focal-response/profile-mode assertions; wait for native position and actual RAF callbacks instead of an arbitrary sampling sleep. |
| `scripts/validate-goal-sequence.mjs` | Optional profile-enabled run and real query allocation/deletion tracking across SPA teardown. |

This report and the 21 selected current evidence files are also updated/added. **No additional edits** were made to `home-motion.ts`, `GoalDownstreamScenes.ts`, hero/reel/Featured production components, navigation, assets, dependencies or the lockfile during this follow-up. Earlier changes to those files remain intact.

### 9.3 Profiling mechanism and current measurements

Normal presentation creates **no GPU timer queries and performs no timing-query polling**. Explicit profiling allocates three queries once and retains sixteen preallocated result records. Busy slots are skipped rather than waited on or replaced. Results are read only after `QUERY_RESULT_AVAILABLE`; disjoint timings are rejected. Every result retains its originating scene label. All queries are registered in the existing disposal owner.

A proposed flat-glazing `forceSinglePass` optimization was **not applied**: inspection of installed Three 0.186.1 showed `ShaderMaterial` already defaults to `forceSinglePass = true`. It would not substantiate a draw-call improvement.

The final comparison ran sequentially with no other browser workload or concurrent lint/build/typecheck. Both current before/after profiles use the same separated-process Chromium wrapper, SwiftShader renderer, 1440×900 CSS viewport, DPR 1, 960×600 motion drawing buffer and geometry tier. Approximately five-second sweeps and small sample counts remain smoke tests, not controlled hardware benchmarks. An earlier capture overlapping checks was not used in this final table.

| Phase | Before RAF fps | Final RAF fps | Final RAF interval p95 | Final CPU submission p95 | Final RAF samples |
| --- | ---: | ---: | ---: | ---: | ---: |
| Solar | 2.54 | 2.04 | 1766.5 ms | 1.3 ms | 11 |
| Shaft | 2.43 | 2.36 | 916.7 ms | 1.3 ms | 12 |
| Blue | 0.82 | 1.07 | 1633.3 ms | 1.0 ms | 6 |
| Glass | 1.57 | 1.36 | 1650.0 ms | 1644.7 ms | 7 |

[Current baseline](cinematic-system/revisit/profile-before.json) · [Current final comparison](cinematic-system/revisit/profile-after.json).

**No repeatable throughput improvement is established by this follow-up.** Solar and glass are slower in this small sample; the broader optical shader adds work. The earlier software pixel/geometry optimizations remain, but this pass does not claim another performance win or cut visual quality further to manufacture one. CPU submission includes driver backpressure and is not GPU execution time.

A separate twelve-second-per-phase GPU-enabled diagnostic run produced genuine asynchronous timer-query results. Some arrive after their originating sweep. The raw in-window fields correctly remain `null` where no matching result was captured; they are not filled with a previous phase's timing. The unit-tested reducer additionally deduplicates the saved phase-end result rings to recover **phase-tagged late completions**:

| Originating phase | Captured queries, including delayed completions | Mean execution | Execution p95 |
| --- | ---: | ---: | ---: |
| Solar | 12 | 302.2 ms | 967.2 ms |
| Shaft | 6 | 732.5 ms | 848.0 ms |
| Blue | 8 | 487.8 ms | 575.5 ms |
| Glass | 1 | 401.7 ms | Not meaningful with one sample |

[Raw GPU run, including result IDs, phase tags and both summaries](cinematic-system/revisit/profile-gpu.json). Deferred summaries were recomputed from those saved snapshots using the same reducer now called by the profiler; no rendering samples were fabricated. They are **not RAF-frame-paired, not confined to the RAF sweep window, and not timings from physical GPU silicon**. This device implements the query API through SwiftShader. All four phase WebGL-error checks returned zero; recorded disjoints were zero. Pending/unobserved final queries are not counted.

These measurements expose severe rendering/driver limits in this software environment. They do not prove that all frame latency is shader time or that production hardware meets budget. **60fps remains unachieved here; physical-GPU and continuous native-4K/60 remain unverified.**

### 9.4 Fresh regression results

All following checks were rerun for the follow-up; the older results above are not substituted for them:

- Production build, TypeScript, ESLint, expanded motion/GPU units, six goal unit groups, script syntax and `git diff --check`: pass. ESLint still has the same two unrelated warnings and zero errors.
- HTTP QA: 22 routes, expected 404s, asset security and 50 captured assets pass. Asset/range tests: **18/18**. Final homepage response: **HTTP 200**.
- Four homepage modes pass: desktop with GPU diagnostics enabled; 390×844 touch/native-drag emulation; desktop reduced motion; 3840×2160 reduced-motion/static output. Hover/rest/rapid cancel and sleeping renderer, reverse reel/Featured transforms, decoded footage, visibility/modal pause, Escape, camera-source projection and focal response are verified. UHD canvas and actual WebGL drawing buffer both equal 3840×2160, with `NO_ERROR`.
- Four goal modes pass: 1440/390 widths × normal/reduced policy. Each has **11 states, four continuity/handoff checks, zero unexpected page/console/asset errors, reverse checks, navigation cleanup and isolated fallback checks**.
- Desktop normal diagnostics: one activation followed by autonomous completion, **87.035 seconds wall time**, 710 monitoring samples. Mobile-width normal, without GPU timing: **61.757 seconds**, 546 monitoring samples. Neither requires continued wheel input. These are slow software-rendered wall times, **not** the authored 22.5 seconds; monitoring samples are not a GPU frame count.
- Actual SPA teardown: the diagnostic desktop run has **3 live queries before navigation → 0 after**. Goal canvas, visibility callback and stale inspector ranges are also removed; Lenis is released.

A real harness failure was investigated: the old 750 ms sleep could expire before a scroll-driven RAF on the stalled software renderer, so a reverse transform was read too early. Seeking now waits for the requested native position and actual browser RAF callbacks. The strict forward/reverse transform assertions were retained, and all modes then passed. Production reel motion was not changed to hide the failure.

Fresh reports: [desktop home](cinematic-system/revisit/home-1440-normal.json), [touch home](cinematic-system/revisit/home-390-touch.json), [reduced home](cinematic-system/revisit/home-1440-reduce.json), [UHD](cinematic-system/revisit/home-3840-reduce.json); [desktop sequence](cinematic-system/revisit/sequence-1440-no-preference.json), [mobile sequence](cinematic-system/revisit/sequence-390-no-preference.json), [desktop reduced](cinematic-system/revisit/sequence-1440-reduce.json), [mobile reduced](cinematic-system/revisit/sequence-390-reduce.json).

### 9.5 Skills and reference reinspection actually performed

- Re-read the actual UI/UX Pro Max `SKILL.md` from revision `d14efff8ed1faa4187f004f79926f428c8074ec7`, outside the application tree. Executed the available Python searches: `shader draw calls transparency --stack threejs`, `scroll reverse cleanup --domain gsap`, and `reduced motion --domain ux`.
- Re-fetched/read Awesome Motion's actual `motion-director/SKILL.md` and `web-motion-auditor/SKILL.md`. The rubric consultation in section 6 belongs to the earlier pass; no new plugin/CLI installation or automatic premium score is claimed.
- Re-read installed Next 16 client-boundary documentation and the repository's canonical motion guidance before edits. Checked installed Three material implementation, not just generic optimization advice.
- Applied relevant guidance through explicit ownership, opt-in profiling, bounded resources, cleanup and reduced-motion/browser verification. Did not apply an extra magnetic/sticky framework, claim fog automatically culls draw calls, or duplicate the existing scroll controller.
- Lusion text retrieval succeeded again. Actual browser navigation again returned `ERR_CONNECTION_CLOSED`: [recorded attempt](cinematic-system/revisit/reference-attempt.json). Text and static captures do not establish live easing, pointer behaviour or current transition timing.

### 9.6 Reproduce the additional diagnostics

With the production server running, use the browser executable wrapper from section 8 if required by this sandbox, and run browser workloads **sequentially**:

```sh
npm run test:motion
node scripts/test-goal-sequence.mjs
PROFILE_TAG=revisit-after node scripts/profile-goal-motion.mjs
PROFILE_GPU=1 PROFILE_DURATION=12000 PROFILE_TAG=revisit-gpu node scripts/profile-goal-motion.mjs
BASE_URL='http://127.0.0.1:3000/?profileGoal=1' npm run validate:home-motion
GOAL_PROFILE_GPU=1 GOAL_MOTION=normal GOAL_CAPTURE=0 node scripts/validate-goal-sequence.mjs
```

`?profileGoal=1` is diagnostic-only and does not introduce another playback controller. The shared clock remains **22.5 seconds**, the progressively accelerating descent remains `.28t + .72t²`, and continuous blue travel into glass remains intact; none were accelerated again for the repeated request. Hero, reel and Featured production motion was retained, freshly viewed and tested—not newly rewritten or falsely certified against inaccessible live reference motion. Physical-device performance, exact Lusion parity, exact mesh occlusion and the missing old red annotation remain explicit limitations.
