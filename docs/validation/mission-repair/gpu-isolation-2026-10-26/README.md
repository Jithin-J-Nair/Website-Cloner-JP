# PR #12 — GPU bottleneck isolation and target-hardware validation

Date: **2026-10-26, Asia/Tokyo**. Entry: **0464dfa35c7d887eb08361d0671b5548543ca848**, branch `arena/6d83ea00-website-cloner-jp`. **BLOCKED / NOT ACCEPTED. No production correction is shipped. PR #12 must remain open.**

This follow-up adds an opt-in diagnostic script and evidence/documentation only. Application source, assets, dependency graph, renderer quality, sole playhead, authored trajectory/timing and original acceptance assertions remain unchanged. It does not reintroduce the rejected scheduler or instance culling. The previous [root-cause evidence](../root-cause-2026-10-26/README.md) remains preserved.

## Outcome

The software-renderer bottleneck is now substantially narrower than “a 15.5-second GPU delay”: **warm raster/fragment work dominates the sampled production scenes on this two-core SwiftShader environment**, with large costs in the transparent captured lattice and the two opaque textured blue module batches. The white-flash overlap at tunnel .822 is more expensive still: both corridor systems plus glazing/suit are submitted, with matched median completion **1,310.4 ms**, versus **111.6 ms** under whole-scene raster discard. The blue cost persists with an empty goal queue; it is not explained solely by startup compilation, pose math, command submission or JPEG capture.

This does **not** isolate a physical laptop-GPU bottleneck, prove a particular shader ALU/bandwidth/overdraw counter, or establish an acceptable implementation. Two new potentially quality-preserving changes were tested in isolation and rejected. Output-changing controls are diagnostics, not proposed reductions in quality. Both original normal viewport gates still fail. The target-hardware procedure is [here](HARDWARE.md), explicitly **unexecuted**.

## 1. Exact environment and measurement validity

- Debian GNU/Linux 12, x86_64 Linux `6.1.158+`; Node `22.22.3`; two exposed `Intel Xeon @ 2.60GHz` cores, approximately 3.85 GiB RAM. CPU/memory quota files were not exposed at the checked cgroup paths; no quota was inferred.
- Bundled headless Chrome **153.0.8010.0**, `@sparticuz/chromium` 153, ANGLE Vulkan 1.3 **SwiftShader Device (Subzero, 0x0000C0DE)**, SwANGLE driver 5.0.0. CDP `SystemInfo.getInfo` independently reports software device/vendor IDs 65535/65535. No `/dev/dri`, DISPLAY or Wayland session is available. A graphics-feature status that says “enabled” is not evidence of a physical GPU.
- WebGL2 / OpenGL ES 3.0; GLSL ES 3.00; alpha/depth/stencil/premultiplied-alpha enabled, `preserveDrawingBuffer=false`, `desynchronized=false`, requested `powerPreference=high-performance`. The normal context has **4 samples**, confirmed through `SAMPLES`, not inferred from the antialias request.
- Desktop viewport **1440×900**, actual goal drawing buffer **960×600**; mobile-emulation viewport/buffer **390×844**; devicePixelRatio 1. The desktop buffer reduction is an **existing** software-path policy, not a change in this follow-up. These are not native 1440p/4K render measurements or physical-phone results.
- Isolated and native-observer runs use the existing multiprocess diagnostic configuration: the bundled arguments minus `--single-process`/`--in-process-gpu`, still explicitly selecting ANGLE SwiftShader. Full command lines and device records are in raw reports. Fresh original gates were additionally run with their **bundled defaults**, without that wrapper, as well as with the previous baseline's two-flag-removal wrapper. Do not conflate the configurations.
- Production Next 16.4.3 server, not development mode. Native recordings precede a fresh build of identical application source; preservation regressions run after that build and a production-server restart.

### What was actually timed

`scripts/isolate-goal-gpu-cost.mjs` installs only in a separate diagnostic browser. It uses the existing opt-in probe to intercept actual `renderBufferDirect` calls and identify live materials, geometry, instance counts and textures. The existing visibility handler stops ambient **goal** RAFs. Inspector seeks then request one production-scene render at a time. These explicit seeks/dwells are **not autonomous playback or an acceptance substitute**.

Each point/variant gets one warm-up, then three measured repetitions, with variant order rotated between repetitions. Every measured render is followed by a fence, polled with `clientWaitSync(..., 0, 0)` at approximately 10 ms intervals. The next requested render waits until completion is observed. Timers wrap actual GL draw calls; results are read only when available after the fence. Captures/readbacks are not included in these performance samples. The optional raw-buffer parity pass runs separately, after timing, with ambient goal RAFs stopped.

`performance.now()` measures CPU callback/submission and the fence interval. `EXT_disjoint_timer_query_webgl2` was supported and the retained measured samples were non-disjoint. Query sums track the completion changes and are below the full submit-to-completion wall interval, but are **elapsed SwiftShader backend draw scopes**, not pure shader cycles or hardware GPU utilization. Fence observations are bounds; polling delays and blocked JS can widen them. Native source RAF intervals are not display frame times. No blocking readback/state query was added to the production animation loop.

The script evolved to add sample labels, source-ID checks, console collection and render-target metadata; early reports have one implicit first warm-up per point/variant. Core retained draw ablations are reproducible with the final script. A flawed initial atlas control was excluded and corrected, as documented below; it is not used for conclusions.

## 2. Empty-queue baseline and one-factor controls

The following are median **fence insertion → observed completion**, milliseconds, from three measured repetitions; they are not delivered frame rates. Each pair is from the same browser/scene/configuration, not a cherry-picked cross-run comparison. `discard` enables rasterizer discard either for only the two blue instance batches or for all goal draws: vertex processing/draw submission remains, but rasterization/fragment/depth/color work and the required image do not.

| Authored point | Desktop baseline | Only blue batches discarded | Mobile baseline | Only blue batches discarded |
| --- | ---: | ---: | ---: | ---: |
| Solar emergence .80 | 243.8 | 253.6 (control inactive) | 304.1 | 274.7 (control inactive) |
| Tesseract tunnel .36 | 659.8 | 698.6 (control inactive) | 619.6 | 588.3 (control inactive) |
| Blue entry .865 | 608.0 | 172.3 | 499.5 | 172.8 |
| Blue .94 | 568.1 | 172.2 | 405.0 | 152.1 |
| Glass/drop .18 | 404.7 | 182.2 | 335.1 | 142.3 |
| Fracture/drop .55 | 647.7 | 354.6 | 467.0 | 296.6 |
| Shatter exit/drop .85 | 567.1 | 394.8 | 406.0 | 336.2 |

Refer to `benchmark-summary.json` and compressed raw reports for exact values/ranges, callback distributions and all repetitions. CPU submission in the initial warm desktop blue samples stays approximately **1.0–1.2 ms**, while the blue-only discard removes hundreds of milliseconds of completion cost. Solar/tesseract are negative controls because the targeted blue batches are not drawn there; their variation must not be advertised as an optimization.

A separate whole-scene raster-discard matrix leaves median completion times approximately **41 ms solar, 92 ms tesseract, 51 ms blue, 61 ms glass and 71 ms fracture**, versus approximately **243/678/622/477/668 ms** matched baselines. This supports raster/fragment dominance over vertex/non-raster processing at these points. It does **not** distinguish fragment ALU from texture filtering, sample/depth processing, blending or exact overdraw multiplicity.

Additional diagnostic controls:

- **Blue color writes off:** blue completion remains approximately the baseline range (desktop .94 medians 579 vs 569 ms; entry 693 vs 692 ms). This does not support color-buffer writes alone as the explanation. The fragment/coverage/depth path is still active; no claim of a pure bandwidth counter is made.
- **MSAA off:** confirmed `SAMPLES=0`, with much lower later samples at many points but output changes. The first measured samples still have substantial driver transients despite a warm-up. The complete three-sample vectors are retained; this separate-context ablation is not a steady-state certification and **disabling AA is not a fix**.
- **Atlas controls:** the first attempt used `Texture.clone()` without separating `Source`. Three shares `Source` across clones, so assigning a one-pixel image could mutate the baseline's CPU source/cache. That entire initial atlas matrix is **excluded**, not silently relabeled valid. A small CPU reproduction records 1024→1 mutation; the corrected script allocates an independent `Source` before changing image/filter settings. Only the explicitly corrected rerun and its images may be used. Lowering anisotropy or replacing the atlas is an output/quality-changing ablation, never a proposed correction.

**Corrected atlas result:** blue .94 completion medians are **569.1 ms baseline / 385.9 ms anisotropy 1 / 490.7 ms one-pixel atlas**. Anisotropy 1 changes **26,966 RGBA channels** at that checkpoint (maximum error 22), and the one-pixel image changes **1,320,860** (maximum error 49); baked recess shading visibly disappears. This implicates filtering/sample work more than atlas working-set size alone, without proving a unique hardware bottleneck. Neither quality-changing intervention is eligible to ship. All five corresponding original baselines also match the independent depth-run baselines exactly, providing a cross-launch deterministic-image control. The corrected parity pass retains its expected driver `ReadPixels` stall warnings; these occur outside the timed series.

**Discard image-validity correction:** an initial diagnostic-only raw parity path bypassed discard when timing was inactive, producing unchanged images mislabeled as discarded. Those images are excluded. Timing had the intervention active and remains usable; a separate corrected rerun verifies the actual changed output at both widths. This repair changes only the new diagnostic, not the original gates, native observer, app clock or acceptance thresholds.

No control is merged into application code, and no acceptance assertion is relaxed on the strength of these measurements.

## 3. Actual scene inventory

This is a sampled scene inventory, not an exhaustive GPU-counter trace of every authored frame. Live draw scopes and CPU-side resource metadata are in the raw reports; geometry/texture counts are Three counters, **not exact VRAM bytes**. The additional solar-wide and white-transition samples cover the planet/flash paths separately.

| Phase/path | Actual sampled work and principal cost |
| --- | --- |
| Solar .80 | 6 draws. Three main physical suit submeshes: 3,403 / 2,328 / 3,683 vertices, 12,597 / 9,858 / 16,764 indices, plus a small accessory and transparent optical quads. In one representative warm sample, suit scopes are ~68.5/27.7/95.0 ms; optical quads ~8.2/41.7 ms. Earth is not asserted visible at this particular point. |
| Tesseract .36 | 11 draws. `CapturedInnerLattice`: 192 instances × 1,280 vertices / 1,920 indices; `CapturedOuterLattice`: 912 × 16 vertices / 24 indices. Both are transparent shader materials; sampled scopes ~363.4 and 110.2 ms. Three transparent glazing scopes add ~25.6/29.7/34.2 ms, plus suit/optics. Instancing already collapses these into two lattice draw calls: raw draw-call count is not the primary measured cost. |
| Blue .94 | 9 draws. Two opaque DoubleSide `MeshBasicMaterial` module batches, **9 instances each**, base 142 vertices / 252 indices and wall 5,865 / 17,430. Shared **1024×1024 sRGB atlas**, mipmaps, anisotropy 4. Representative scopes ~130.5/239.5 ms. Extruded reference motifs add a 110,592-vertex non-indexed standard-material draw (~90.4 ms); a back box and the suit also draw. The two targeted batches account for most, not all, of the blue-frame cost. |
| Glass/drop .18 | 10 draws. A monitor/stencil plane plus the still-rendered blue batches, motifs and suit. Representative base/wall scopes ~54.3/184.3 ms and motifs ~69.8 ms. A monitor view is not evidence that its embedded corridor ceased rendering. |
| Fracture/drop .55 | 11 draws. Underlying corridor/suit remain; transparent fracture mesh adds 7,907 vertices / 36,090 indices and shader reflection/transmission work (~76.6 ms in a representative sample). The blue batches still cost ~58.4/267.1 ms. |
| Shatter exit/drop .85 | 11 draws at the sampled state. Underlying corridor/motifs/suit and transparent facets remain active; sampled fracture scope ~58.1 ms. These scopes are not interchangeable with the final CTA's separate content. |
| Transitions | At .822, both blue batches/motifs and both captured lattices really draw, plus transparent glazing/suit. A representative sample has base/wall ~98.5/258.0 ms, motifs ~127.5, inner/outer lattice ~434.9/180.8 and three glazing scopes ~37 ms each. Whole-scene completion median **1310.4→111.6 ms** under raster discard. The actual composited peak is white; no broad opaque-occlusion interval or safe runtime layer suppression is inferred from that one sampled image. |
| Solar-wide .35 | Earth/atmosphere shader geometry is actually submitted (4,941 vertices / 28,320 indices and 3,185 / 18,048), alongside the large suit. A representative scope vector has suit ~125.8/64.4/252.5/34.9 ms and planet/atmosphere ~12.8/6.2 ms. Matched whole-scene completion median **456.3→32.0 ms** under raster discard. These are submitted scopes; the mobile composited picture is mostly the large foreground suit, not a certified unobstructed planet view. |

### Compilation, uploads, allocation and offscreen work

Warm repeated samples have **no shader compilation/linking or new buffer/texture allocations** in the measured draw series. The usual upload is one **16×16 RGBA float bone texture = 4,096 bytes/frame**. Fracture adds two **32×30 RGBA float textures = 30,720 bytes/frame**, for 34,816 bytes including bones. These are actual active uploads, not an assumption from `needsUpdate` call sites. The 1024² RGBA8 atlas has nominal 4 MiB base / approximately 5.33 MiB full-mip texel storage; that is a format/dimension estimate, not measured driver allocation. Exact GPU memory, bandwidth/cache occupancy and overlap/sample counters are unavailable. Their warm observed CPU durations are around 0–0.1 ms; no evidence establishes them as the hundreds-of-milliseconds primary cost. GPU transfer hazards are not independently measured by a bandwidth counter.

First use does allocate/upload geometry and validate programs. With the goal queue drained, the initial tesseract callback in the first baseline is about 146 ms and fracture about 16 ms; subsequent warm callbacks are roughly 1–4 ms. Program-info/log waits are only part of those first-use costs. In native playback, validations can wait behind prior queued work and are much larger: do not label the entire stall “LLVM compile time.” The persistent warm raster cost remains after those first uses.

Static baseline counters settle within the sampled sequence (up to 31 geometries / 20 textures / 25 programs in the initial seven-point matrix). Native CTA footage warms additional content and ends at 35/25/30. Counter growth at a newly visible stage is not by itself a leak; this is not a leak-free/VRAM certification. Diagnostic cloned textures/depth materials also intentionally allocate their own finite resources.

Source inspection plus live target records distinguishes work outside the measurements: the corridor cube target is created at 128 desktop / 64 mobile and rendered at initialization, **not every animation frame**. The software path skips the hardware bloom composer/precompile path; warm goal scene renders use the default framebuffer. A physical-GPU path can have extra multisampled half-float/offscreen passes, so this software inventory cannot certify that path. Goal RAF also stops outside its broad active band; during the captured post-completion CTA tail it is still in-band and submitting draws. The tail is **not a queue-drained proof**, nor is all CTA work assumed unnecessary.

## 4. Two new quality-preserving candidates were rejected

Neither candidate was installed into application source or presented as an acceptance-tested fix.

1. **Opaque per-mesh depth prepass.** A cloned cheap opaque basic material writes matching depth/stencil with color writes off, then the original color material draws unchanged. All five deterministic desktop blue/glass/fracture pairs have **zero changed RGBA channels**. Nevertheless, warm completion gets worse: blue-entry medians **589→758 ms**, blue **547→690 ms**, glass **446→556 ms**, fracture **639→750 ms**. Extra coverage/vertex/draw work is not repaid. Rejected, not shipped.
2. **Wall batch before base batch.** Keeps every mesh, triangle, instance, shader, material and timing, changing only order of the two opaque batches. No consistent sufficient desktop/mobile gain. At desktop blue-entry the strict comparison finds **2 changed channels, maximum error 3**; the other nine desktop/mobile checkpoint pairs match. Even that tiny difference plus inconclusive timing prevents a quality-preserving claim. Rejected, not shipped.

The original scheduler/culling experiments were **not repeated**. AA, atlas, transparency, geometry/layer counts, DPR and authored timing were not reduced to manufacture a pass. A quality-preserving correction may still exist; these results do not prove impossibility.

## 5. Missing-frame control versus genuine autonomous playback

### Independent low-pressure control

Both widths capture all **seven** original requested static states after a completed fence, with a checksum-coded canvas ID independently decoded from each actual compositor screenshot. IDs **6/8/10/12/14/16/18** match source IDs before and after capture at both widths; no additional goal render replaces them during capture. Blue, glass and fracture are visible in actual image evidence. Source-render, completion-bound and screenshot request/return timestamps are retained.

This demonstrates that these requested states **can complete and reach capture** when submitted with deliberate dwell and an empty goal queue. It does not demonstrate that the normal authored sequence supplies enough such frames, nor establish physical presentation or justify a weaker observer. Dedicated solar-wide/white-transition controls are additional states, not replacements for the seven-state result. No original acceptance/recording harness was repaired or weakened.

### Fresh complete native run, unchanged application

The existing independently stamped observer records one new autonomous run per width, with no in-run input, then 22 s tails. Initial actual capture precedes activation. All **107 desktop / 133 mobile** images decode with matching GL/DOM IDs and valid check bytes; page errors are empty. Actual images include intermediate blue poses, monitor/glass/fracture and final CTA. Videos preserve source timing without interpolated motion, with selected original JPEGs retained as precision references. The new source spans are **48.350248 / 45.436288 s**; previews are **960×600 / 390×844**, CRF26 lossy H.264/VFR, with JPEG-demux timebase quantization and at most a 0.2 s final encoding bookend. Both previews were fully decoded by ffmpeg with exit 0 and empty error output. They are not native-resolution pixel or physical-presentation certificates.

| Fresh native run | Start→owner completion | Playing source renders | Captured source IDs in original blue range | Captured source IDs in original mid-glass range |
| --- | --- | ---: | --- | --- |
| Desktop | 21,070.6→47,525.0 ms; 26.4544 s | 38 | 46, 47, 48, 49, 50 (**5**) | 52, 53, 54 (**3**) |
| Mobile emulation | 18,013.5→41,539.3 ms; 23.5258 s | 41 | 49, 50, 51, 52, 53 (**5**) | 56 (**1**) |

Ranges here exactly mirror the original predicates: blue `.86<tunnel<.98 && shatter===0`, mid-glass `.4<shatter<.8`, while playing. They are not widened to inflate evidence counts. Five captured blue source poses still do not establish the required advancing sequence; a telemetry timer can repeat a stale pose. Previous recordings at the same application source had 3/4 desktop and 4/4 mobile blue IDs across cold/replay, demonstrating variability, not a reliable improvement from these diagnostic-only changes.

During playing, CPU callback p50/p95 is approximately **2.4/1687.3 ms desktop**, **1.9/1912.9 ms mobile**. Source dispatch-gap p50/p95/max is **448.8/1737.7/2272.5 ms desktop**, **347.0/1362.4/2286.3 ms mobile**. These are JS/source timings, not display frame times. The observer does not see 2 desktop / 4 mobile playing source IDs in its images; those are **unobserved source IDs, not measured physical display drops**. No physical dropped-frame count is available.

A fresh narrow-bound example repeats the earlier delay class without assuming its exact 15.5 s value:

- Desktop source **45**: renderer return **33,968.6 ms**; fence inserted **33,969.5**; completion in **(43,828.6, 43,879.6]**; matching image **44,027.322 ms**. At least ~9.86 seconds precedes completion, then capture is roughly 148–199 ms later.
- Mobile source **56**, actual mid-glass: renderer return **40,837.8 ms**; fence inserted **40,839.3**; completion in **(44,485.8, 44,535.7]**; matching image **44,588.415 ms**.

Other observations have much wider completion intervals because JS is blocked; an image timestamp within such an interval is not contradictory. Eight measurement fences remain pending at each observer shutdown while new CTA renders continue. No full queue drain is claimed. Source matrices and complete mark/fence/capture records are retained in reports. These are browser/GPU-completion/capture facts, **not physical scanout**.

## 6. Original gates, preservation and stop decision

See `regression-summary.json` and the original logs/JSON for fresh exact commands, process durations, failed lines and telemetry counts. Normal defaults and baseline-matched configurations are kept separate. **There is no accepted before/after production implementation: the “after” application is byte-identical to entry.** Ablation comparisons must not be relabeled as production improvements.

**Fresh original normal results (all exit 1):**

| Configuration / width | Autonomous seconds | Playing / shaft / blue / mid-glass telemetry samples | Unique blue values | Failure |
| --- | ---: | --- | ---: | --- |
| Bundled defaults / 1440 | 24.048 | 154 / 21 / 30 / 0 | 6 | line 124, intermediate stages |
| Bundled defaults / 390 | 24.411 | 171 / 30 / 17 / 14 | 2 | line 126, advancing blue pose |
| Prior-baseline multiprocess / 1440 | 25.684 | 166 / 20 / 41 / 10 | 3 | line 126, advancing blue pose |
| Prior-baseline multiprocess / 390 | 25.074 | 156 / 24 / 16 / 12 | 3 | line 126, advancing blue pose |

The prior equivalent multiprocess final baseline failed desktop/mobile with 5/8 computed blue values and 1/0 mid-glass samples. Current 3/3 computed values and 10/12 mid-glass samples do not show an accepted improvement: samples can repeat stale state, assertions still fail, and the separately captured native runs have only 5 blue IDs each and 3/1 mid-glass IDs. There is no new runtime optimization to attribute the variability to.

The fresh runner retains **19 command results: 15 pass, four original-normal failures**. Reduced suites, clock/policy checks, both-width context-loss/no-WebGL/astronaut-failure cases, goal/home units, assets and full/production audits pass; audits report zero vulnerabilities. The clock probe keeps paused draws **192→192** at both widths and advances **0.6700 / 0.6711 authored seconds** across approximately 650 ms main-thread stalls; pause/resize, menu, skip, replay, contact and live reduced-motion policies pass with empty errors/issues. This is independent policy coverage, not a native cadence pass. Normal failures leave later assertions unexecuted.

Fresh lint/typecheck/production build pass with the same two existing lint warnings, unsuppressed; final diagnostic syntax/runtime and final lint pass after diagnostic-only repairs. Original acceptance SHA remains:

`d417ee59798b40d0434e3cdeffe069b8f70dc3096c58479f635f102a198cb910`

**Stop decision:** no verified minimal quality-preserving correction makes the unchanged normal desktop/mobile criteria and genuine visible cadence pass. Physical-hardware behavior remains unknown. Further production changes, a merge, or smoothness/parity/60 FPS/4K60 claims are not justified. Use the [precise hardware procedure](HARDWARE.md), return actual device reports and recordings, and retain failed repetitions. This report does not dismiss the software failures or claim they prove a physical-GPU defect.

## Evidence and reproduction

- `benchmark-summary.json`: complete measured-sample distributions and configuration, including inactive controls/outliers.
- `native-summary.json`: original-range IDs, source/capture intervals, pending fences and timing distributions; full reports in `native-*/report.json.gz`.
- `regressions.json` / `regression-summary.json` / `regressions/`: exact exits, logs and compressed original reports.
- `experiments/`: compressed complete per-draw/resource/upload reports, strict parity results, excluded atlas-control record, and selected raw-buffer images.
- `controls/`: selected actual blue/fracture/planet/flash compositor images and full control reports, not framebuffer-only stand-ins. `capture-ledger.json` records all source-image hashes and explicitly identifies large/redundant images kept only locally to stay within the cumulative archive budget.
- `native-*/native-preview.mp4`: complete timestamp-paced **preview**, not native-resolution/display-rate certification; original selected JPEGs plus full timestamp/ID JSON are primary precision references. Complete raw new JPEGs/traces also remain in ignored `temp/gpu-isolation/`, not added a second time to the large historical evidence bundle.
- `preservation.json`, `environment.txt`, `SHA256SUMS`: source/acceptance hashes, environment and archive integrity. Existing historical evidence was not deleted or regenerated.

Reproduce in serial after a production build/server start:

```sh
CHROMIUM_MULTIPROCESS=1 ISOLATE_VARIANTS=baseline,discard ISOLATE_WIDTH=1440 ISOLATE_OUT=temp/gpu-reproduce/blue node scripts/isolate-goal-gpu-cost.mjs
CHROMIUM_MULTIPROCESS=1 ISOLATE_VARIANTS=baseline,discard ISOLATE_TARGET=all ISOLATE_OUT=temp/gpu-reproduce/all node scripts/isolate-goal-gpu-cost.mjs
CHROMIUM_MULTIPROCESS=1 ISOLATE_VARIANTS=baseline,depth ISOLATE_PARITY=1 ISOLATE_OUT=temp/gpu-reproduce/depth node scripts/isolate-goal-gpu-cost.mjs
CHROMIUM_MULTIPROCESS=1 ISOLATE_VARIANTS=baseline,wall-first,color-off ISOLATE_PARITY=1 ISOLATE_OUT=temp/gpu-reproduce/order node scripts/isolate-goal-gpu-cost.mjs
CHROMIUM_MULTIPROCESS=1 ISOLATE_VARIANTS=baseline,atlas-aniso1,atlas-1px ISOLATE_PARITY=1 ISOLATE_OUT=temp/gpu-reproduce/atlas node scripts/isolate-goal-gpu-cost.mjs
CHROMIUM_MULTIPROCESS=1 ISOLATE_VARIANTS=baseline ISOLATE_NO_MSAA=1 ISOLATE_PARITY=1 ISOLATE_OUT=temp/gpu-reproduce/no-msaa node scripts/isolate-goal-gpu-cost.mjs
CHROMIUM_MULTIPROCESS=1 ISOLATE_VARIANTS=baseline ISOLATE_CAPTURE_CONTROL=1 ISOLATE_OUT=temp/gpu-reproduce/control node scripts/isolate-goal-gpu-cost.mjs
# Repeat blue/order/control with ISOLATE_WIDTH=390; use fresh output paths for repetitions.
```

Defaults now include the two supplemental planet/flash points; `ISOLATE_POINTS=solar,tesseract,blue-entry,blue,glass,fracture,shatter-exit` reproduces the original seven-point series. All ablations/controls are outside autonomous acceptance. Refer to HARDWARE.md for the required installed-browser/renderer checks instead of treating these forced-SwiftShader commands as hardware validation.
