# Target-laptop GPU validation — NOT executed here

Entry application revision: `0464dfa35c7d887eb08361d0671b5548543ca848`. The follow-up changes diagnostics/documentation only. The sandbox has two exposed Xeon CPU cores, about 3.85 GiB RAM, no `/dev/dri`, no DISPLAY/Wayland session, and confirmed ANGLE Vulkan **SwiftShader**, not a physical GPU. Do not use its timings as a laptop-GPU benchmark.

## Required setup and original acceptance

Follow the [existing detailed production-server, headed-Chrome launcher and original-gate procedure](../root-cause-2026-10-26/HARDWARE.md). That procedure is still unexecuted on hardware. Use this existing branch/PR, preserve local work, and record the exact checkout, clean/dirty state, browser binary/version, OS, GPU/driver, CPU/RAM, display resolution/refresh, AC/battery and thermal/power mode. Use a real local macOS/Linux desktop session, not Xvfb/remote software rendering. A Windows launcher has not been validated.

In a separate terminal after `npm ci && npm run check`, run `PORT=3000 npm run start`. Then configure the existing launcher with an **actual absolute installed Chrome path**, for example:

```sh
export HARDWARE_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
# Linux alternative: export HARDWARE_CHROME="$(command -v google-chrome)"
export CHROMIUM_EXECUTABLE_PATH="$PWD/scripts/launch-hardware-chromium.py"
export CHROMIUM_MULTIPROCESS=1
export BASE_URL=http://127.0.0.1:3000
mkdir -p temp/hardware-gpu
shasum -a 256 scripts/validate-goal-sequence.mjs
# Required unchanged acceptance SHA:
# d417ee59798b40d0434e3cdeffe069b8f70dc3096c58479f635f102a198cb910
```

Save `chrome://gpu` details. Reject SwiftShader, llvmpipe, softpipe, software/basic renderers, disabled acceleration or unexpected driver fallback. The launcher filtering test is not proof of hardware execution.

Run the original **uninstrumented** normal desktop/mobile-emulation gates serially in three fresh browser launches. Preserve every exit status and copy each generated JSON/log to a separate repetition directory before it is overwritten:

```sh
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=1440 node scripts/validate-goal-sequence.mjs
# Record $? immediately; copy temp/cinematic-validation/1440-no-preference/report.json
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
# Record $? immediately; copy temp/cinematic-validation/390-no-preference/report.json
```

Do not change assertions, timeouts, DPR, assets, sequence timing, effects, layer/instance counts or viewport presets. A 390-wide laptop browser is **not a physical phone**. Stop and report failed original assertions; never retain only a lucky passing repetition. Run the reduced/clock/context-loss/no-WebGL/astronaut-failure/unit/asset suites listed in the previous procedure as well.

## New isolated scene-cost matrix

The new script stops ambient goal RAFs through the existing visibility handler, seeks explicitly to authored states, submits one measured render and polls a fence with zero timeout. It does **not** run the autonomous sequence and cannot satisfy acceptance. Run this separately from original acceptance/native recordings, with no concurrent builds/encoders or other GPU workloads:

```sh
ISOLATE_WIDTH=1440 ISOLATE_VARIANTS=baseline,discard ISOLATE_TARGET=blue ISOLATE_OUT=temp/hardware-gpu/blue-1440 node scripts/isolate-goal-gpu-cost.mjs
ISOLATE_WIDTH=390 ISOLATE_VARIANTS=baseline,discard ISOLATE_TARGET=blue ISOLATE_OUT=temp/hardware-gpu/blue-390 node scripts/isolate-goal-gpu-cost.mjs
ISOLATE_WIDTH=1440 ISOLATE_VARIANTS=baseline,discard ISOLATE_TARGET=all ISOLATE_OUT=temp/hardware-gpu/all-raster node scripts/isolate-goal-gpu-cost.mjs
ISOLATE_WIDTH=1440 ISOLATE_VARIANTS=baseline ISOLATE_CAPTURE_CONTROL=1 ISOLATE_OUT=temp/hardware-gpu/compositor-control node scripts/isolate-goal-gpu-cost.mjs
```

The last command requests actual compositor screenshots with checksum-coded GL IDs after completion. Every decoded ID must equal the source ID before AND after capture. Keep source timestamps, completion intervals, screenshot timestamps and images. Do not relabel this deliberate dwell/seek control as native in-motion playback.

Inspect `report.json` for **both** `device.renderer` and `system.gpu.devices`, context attributes, actual drawing-buffer dimensions, samples, timer support, driver/backend, errors/disjoint flags, per-draw scopes, uploads, program/resource counts and render targets. On a hardware path the app can use an EffectComposer and offscreen targets; do not assume the sandbox's single default-framebuffer pass.

`discard` changes the output and skips fragment/raster/depth/color work; it is only a vertex/non-raster residual control, NEVER a candidate fix. `color-off`, `atlas-aniso1`, `atlas-1px` and `ISOLATE_NO_MSAA=1` are also diagnostic ablations, not acceptable quality reductions. `depth` and `wall-first` were rejected here and are not production changes. `ISOLATE_PARITY=1` adds separate, blocking raw-buffer parity captures **after** the performance series, never inside the production animation loop. Do not use those readback timings as performance data.

Repeat each chosen matrix in three fresh launches, preserving all samples. The script includes one warm-up per point/variant and three measured repetitions with rotated order. Driver compilation can still occur after a warm-up: retain outliers rather than quietly excluding them. Timer-query results are valid only when supported, available and non-disjoint. Their sum is elapsed backend draw-scope time, not pure shader cycles. The 10 ms fence-poll interval gives upper bounds, not sub-millisecond hardware execution times. Unsupported GPU timers are reported as unavailable, not inferred from CPU submission.

**Backend comparison caveat:** production already branches on software-renderer detection: software skips the hardware precompile/bloom-composer path and uses an existing pixel budget. Do not compare total software/hardware timings as if their GL workloads were identical. Record the selected path, target sizes, samples, draws and effects. Compare the one-factor ablations **within each backend**, then compare their attribution patterns. Do not spoof renderer identity or silently disable hardware effects to manufacture an equal-workload pass.

## Full independent native playback

With all isolated controls/ablations off, run serially:

```sh
PIPELINE_WIDTH=1440 PIPELINE_RUNS=2 PIPELINE_TAIL=22000 PIPELINE_OUT=temp/hardware-gpu/native-1440 node scripts/diagnose-render-pipeline.mjs
PIPELINE_WIDTH=390 PIPELINE_RUNS=2 PIPELINE_TAIL=22000 PIPELINE_OUT=temp/hardware-gpu/native-390 node scripts/diagnose-render-pipeline.mjs
```

Retain complete JPEG sequences and their JSON, not only a movie or telemetry counts. Verify initial capture precedes activation, all image checksums, independent GL/DOM IDs, actual blue poses and intermediate glass/fracture, source matrices, completion/capture/replacement chronology and CTA handoff. Inspect the actual in-motion sequence. Repeat without stamps/fences to bound observer overhead (`PIPELINE_STAMP=0 PIPELINE_FENCES=0`) and compare to the uninstrumented original gates.

CDP capture/compositor events do not measure physical scanout. Where smoothness/display-drop claims matter, add externally clocked high-frame-rate display capture and document refresh/capture alignment and dropped frames. Do not infer 60 FPS, native 4K or 4K60 from RAF dispatch, query time, a passing build, a passing telemetry assertion or this procedure. No target-laptop result is claimed until the actual hardware evidence is returned and reviewed.
