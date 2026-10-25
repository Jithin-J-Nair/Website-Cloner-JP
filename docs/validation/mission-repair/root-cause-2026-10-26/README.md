# Visible cinematic playback — final root-cause investigation

Date: **2026-10-26**. Investigation entry: `8da3550d1bac7fed0ee82eb6ff30df1fb0ac0c87`. Existing PR **#12**, branch `arena/6d83ea00-website-cloner-jp`. **INCOMPLETE — leave PR open; do not merge.**

This investigation localizes the observed delay to backend work/command completion and first-use synchronous GL validation waits. It does **not** deliver a verified quality-preserving fix. Both original normal-motion configurations still fail. The final application change is an **opt-in observation callback only**; rejected scheduling/culling candidates were removed. No duration, trajectory, phase threshold, acceptance assertion, quality setting or dependency was changed.

[Machine-readable findings](summary.json) · [Final test executions](final-regressions.json) · [Hardware procedure — NOT executed](HARDWARE.md) · [Exact final application diff](application-scene-diff.patch.gz) · [Preserved-source hashes](preservation.json) · [Artifact hashes](SHA256SUMS)

## 1. Original acceptance, not a substituted gate

`validate-goal-sequence.mjs` retains SHA-256 **d417ee59798b40d0434e3cdeffe069b8f70dc3096c58479f635f102a198cb910**. Normal tests use native scrolling; no seeks or interaction occur between activation and completion. No passing diagnostic collection exit is treated as passing acceptance.

| Unchanged original run | Playing telemetry samples | Shaft / blue / mid-glass | Distinct blue `bakedFrame` values | Result |
| --- | ---: | --- | ---: | --- |
| Entry desktop 1440 | 176 | 17 / 31 / 45 | 5 | FAIL line 126: blue pose advancement |
| Entry mobile 390 | 144 | 41 / 16 / 0 | 3 | FAIL line 124: intermediate stages |
| Final desktop 1440, candidates removed | 141 | 33 / 32 / 1 | 5 | FAIL line 124 |
| Final mobile 390, candidates removed | 135 | 14 / 24 / 0 | 8 | FAIL line 124 |

Later assertions are not reached after the first failure. In particular, final mobile's computed eight blue values do not turn its failed run into a pass. These varying counts are **not** evidence of a repair. A 100 ms telemetry timer can repeat one submitted scene state many times while the GPU/RAF/compositor is behind. Phase sample counts are not counts of distinct presented frames; this is why actual image-ID correlation was added rather than weakening or replacing the original gate.

Raw entry/final JSON and gzip-preserved stdout are in `acceptance/` and `regressions/`. The serial collection runner completed successfully **as a collector** while recording the two failing normal tests. The aggregate in `summary.json` is explicitly `accepted: false`.

## 2. Complete observation path and clock semantics

`scripts/diagnose-render-pipeline.mjs` observes the existing single scene owner. The optional source callback `window.__goalPipelineProbe` is undefined in ordinary runs. Only when a diagnostic explicitly installs it does the owner copy glass/blue matrices and expose its renderer after submission. No second clock/controller is introduced.

For each observed source render:

1. RAF timestamp and callback start/end are monotonic `performance.now()`-compatible times. Callback duration is separate from intervals between callbacks.
2. Source `frameClock`, scene-start time, virtual scroll, sole authored progress, astronaut/camera matrices, glass matrix, blue travel-group matrix and resource counts are recorded. Matrix snapshots are observed **after** Three has updated world matrices; scene-start/submission times bound their computation. `authoredAt` is the owner's existing clock boundary, not a new playhead.
3. `submittedAt` means the renderer returned after issuing commands. It is **not** GPU completion. GL slow-call coverage includes program/shader info-log and status queries, attribute/uniform discovery, upload, draw, clear and flush calls.
4. A tiny black/white GL frame-ID strip is cleared into the same framebuffer **after that source render**, using Three's cached state API and restoring that state through the same API. A separately painted DOM strip carries the same ID. Current codes have a four-bit header, 12-bit source ID and eight-bit check byte. They occupy CSS y=160/176, away from the header logo. Images with covered, ambiguous or failed-check codes remain unknown. Changing canvas rectangles also invalidates GL decoding rather than guessing.
5. Nonblocking WebGL2 fences are inserted and polled with timeout zero. Successful completion is bounded by `(previous TIMEOUT poll, observed successful poll]`, or by submission if there was no earlier poll. Poll scheduling can be delayed. `WAIT_FAILED` is not a successful GPU completion. At most eight diagnostic fences are pending; some IDs therefore have no fence. There is no `finish`, blocking fence wait, or `readPixels` in the autonomous probe.
6. Native-viewport JPEG screencast frames are written and acknowledged immediately. Source IDs are decoded from **actual pixels**, independent of telemetry. Capture time is CDP's epoch timestamp converted by subtracting the page's `performance.timeOrigin`; it is not a physical-display timestamp. Host receipt time is recorded separately and has a different time origin.
7. Chrome GPU/cc/viz/pipeline traces and a CPU profile are retained. `FramePresented` and presentation/pipeline events are observable compositor events, not physical screen measurements; they are **not automatically one-to-one associated** with application IDs.

Final native recordings wait for an actual first screencast image **before** activation and retain a 22 s tail after CPU completion. Each stream has two autonomous runs with a documented re-arm input **between** them. There is no in-run scroll, seek, pause or click. `native-1440/` and `native-390/` contain the full sequential JPEGs, metadata, profiles/traces and a timestamp-paced movie. Movie encoding holds each actual captured image until the next capture; it does not synthesize intermediate animation frames. Encoding time-base quantization and lossy video compression make the JSON/JPEGs, not the movie container, the precision record. The JSON/JPEGs remain primary evidence.

### Final continuous native evidence (candidates removed)

All **200/200 desktop** and **293/293 mobile** captured images have valid check bytes and matching independently decoded GL/DOM IDs. The first capture precedes the first native activation at both widths; the long capture tails include the actual final astronaut/sticker scene and visible “Let's work together!” CTA. This is not a passing cadence result:

| Width / native run | Playing source renders | Distinct captured blue IDs | Distinct captured mid-glass IDs |
| --- | ---: | ---: | ---: |
| 1440 cold | 33 | 3 | 1 |
| 1440 replay | 38 | 4 | 1 |
| 390 cold | 44 | 4 | 1 |
| 390 replay | 47 | 4 | 2 |

Individually inspected final pixels: desktop `native-1440/frame-0041.jpg` and `frame-0143.jpg` show glass/crack facets across the monitor with different astronaut configurations. Mobile `native-390/frame-0201.jpg` shows a small compact/rotated astronaut in the full corridor, `frame-0204.jpg` shows the extended astronaut inside the pulled-back monitor, and `frame-0208.jpg` shows the approaching/crouched astronaut with glass facets. Those images confirm the scene content and pose changes, **not** sufficient visible pose/fracture cadence. The final `frame-0199.jpg` / `frame-0292.jpg` show the CTA over the astronaut/stickers. These named images were read individually, not attributed from an unordered montage. Their full timestamp/source/fence associations are in `summary.json`; all intervening captured frames remain available.

### Observation defects found and corrected, not hidden

- The **initial** raw-GL stamping implementation read GL state every frame. CPU profiling attributed about **67.445 s** to `paintIds` over that collection. Those state reads synchronized queued software-backend work. That run is intrusive and not a baseline. An attempted cached raw-state variant was also discarded: a previously captured state is not guaranteed to remain current and may disagree with Three's state cache. The final tool uses renderer cache APIs and balanced restoration instead.
- An earlier desktop strip at y=64 overlapped the actual **LUSION header logo**. A four-bit header alone accepted corrupted payloads (for example DOM ID 13 decoded as GL 47). `observation-repairs/` preserves the actual overlap image/crop. Those desktop payloads are invalid and were excluded from causal frame mapping. The later y=160 code with check byte avoids that overlap. The old mobile y=64 strip did not overlap its shorter header, but final mobile evidence uses the corrected code too.
- Early probe versions began activation immediately after starting screencast. Their first delivered image could arrive well after activation. The final version waits for a genuine initial image; no image is backdated to fabricate a missing opening. The earlier valid-check desktop dataset in `localization/` used the no-wait setup and is used for individual frame/fence localization, **not** as a complete opening-bookend recording. `PIPELINE_FIRST_FRAME_WAIT=0` reproduces that setup; default is to wait.
- Some early raw reports contain an unused empty `pending` field. It is **not** proof that GPU work drained. The current tool snapshots its actual outstanding fence metadata.

The probe changes observation pixels, adds GL commands/fences, trace/profiler work and capture load. It is not a zero-overhead performance baseline. The separate unstamped control and uninstrumented original gates are necessary controls. No diagnostic run is represented as the unchanged normal acceptance test.

## 3. Verified localization: submission is far ahead of GPU completion

In the valid-check desktop localization replay, frame IDs, source states, nonblocking fences and decoded pixels agree:

| Source ID | Renderer returned (page ms) | Fence inserted (page ms) | GPU completion interval (page ms) | Matching GL/DOM capture (page ms) |
| --- | --- | --- | --- | --- |
| 27 | 38,395.7 | 38,397.9 | (50,394.0, 50,443.9] | 50,634.84 |
| 91 | 76,131.4 | 76,133.0 | (91,644.1, 91,695.8] | 91,790.33 |
| 92 | 77,113.8 | 77,115.1 | (92,693.9, 92,744.0] | 92,753.38 |
| 93 | 77,310.4 | 77,311.7 | (93,494.2, 93,544.1] | 93,579.48 |

These are **monotonic source/fence bounds**, with independently decoded capture IDs. The long interval is already present **before the fence can signal**, while capture follows the observed completion relatively closely for these examples. Thus the measured lag cannot be explained solely by JPEG transport, a premature recording stop, or a DOM telemetry clock error. It is not necessary to assume that every other capture is fresh, nor to infer presentation from submission.

Frame 95's actual image (`localization/frame-0091.jpg`) shows the astronaut in front of the monitor and translucent broken glass. Its source shatter progress is about **0.7892**, scene submission around **81,314.9 ms**, capture **95,656.05 ms**. That ID had no direct diagnostic fence; no exact GPU completion time is invented for it. This proves that fracture imagery exists and arrives late, **not** that enough distinct fracture frames visibly play.

The independent **unstamped desktop control** (no GL/DOM code clear operations) still records fence observation delays with median **8,042 ms**, p95 **15,603.9 ms**, across its collection. Replay has **32** playing source renders, four blue states and one mid-glass state; callback p95 is approximately **10.3 ms**. First-entry stalls cannot by themselves explain the sparse warm replay. Those fence distributions include polling delay and the control still has tracing/fences/capture overhead; they are not exact driver execution durations.

The control CPU profile is dominated by idle time rather than animation JavaScript. Its trace includes long command-buffer waits, `GLContextEGL::MakeCurrent` waits and output-copy work. Trace durations overlap/nest; their totals must not be added as independent CPU costs. The source submits quickly in steady replay, but source callback intervals and backend completion are slow. This is a **backend/command-throughput and synchronization problem in the observed software environment**, not a demonstrated need to retime the authored path.

## 4. Cold startup vs steady-state and per-draw attribution

Expanded GL coverage finds real first-entry waits omitted by the earlier probe: for example, in the unstamped control `getProgramInfoLog` spans **27,286.3–28,758.4 ms** and `getShaderInfoLog` **28,758.4–30,027.2 ms**. Such calls can block for earlier queued work as well as compilation/validation. They are **not compiler-only timings**. Startup environment generation also incurs substantial backend work; it must not be conflated with late glass/blue execution.

The optional per-draw query run (`attribution/`) records shader source at submission, current program identity and asynchronous non-disjoint elapsed scopes around individual draws:

| Program in that run | Identified production path | Draw scopes | Mean / maximum elapsed ms |
| --- | --- | ---: | --- |
| 20 | Captured astronaut, skinned MeshPhysicalMaterial with captured DQ patch | 279 | 77.07 / 333.93 |
| 29 | Captured instanced truss, `uVortexPinch` / twist / PBR shader | 40 | 396.10 / 699.89 |
| 34 | Captured cobalt atlas, instanced MeshBasicMaterial base/wall modules | 24 | 251.05 / 719.23 |

These include differing scene sizes/poses and phases; they are not a like-for-like optimization benchmark. In blue-only source states, the corresponding body scopes average about **18.53 ms** (15 scopes), and cobalt scopes **278.00 ms** (12 scopes). The two blue batches submit nine instances each; the wall draw is `17,430` indices ×9 and the base `252` ×9. Source/defines and raw draw arguments are retained. Elapsed scopes include software backend scheduling/execution and are not shader-only cycle counts. That attribution run's old desktop image-ID decode is rejected because of header overlap; its raw submission/query data is a separate observation and was not used as valid pixel causality.

Cold validation waits contribute to skipped deadlines, but warm replay remains sparse without comparable long JS callbacks. GPU work is not free merely because renderer submission returns in 1–2 ms. No dummy-shader warm-up, hidden full-sequence traversal, readiness delay, error suppression or production warm-up was shipped. Moving first-use queries earlier alone is not established as a fix for the warm replay throughput failure.

## 5. Mobile was tested independently

Entry mobile has three distinct computed blue values, while final uninstrumented mobile has eight but skips the mid-glass window entirely. This is inconsistent with a fixed mobile pose sampler freeze and consistent with variable delivery/sampling starvation; it is not proof that every mobile issue has been eliminated.

Earlier independently correlated mobile images show source IDs 122 and 124 with baked frames approximately **79.5314** and **83.5742**. The actual images show a small central astronaut changing from a compact/rotated pose to an extended pose while the corridor/monitor changes. That observation does not establish six visibly advancing poses. Final checksum-valid native mobile IDs and matrices are indexed in `summary.json` and `native-390/report.json`; inspect actual images, not an inference from the latest CPU sample.

No mobile path, root attitude, bone mapping, scale, DPR, viewport requirement or corridor travel formula was changed. Source asset/math regressions pass. Neither a simulated viewport nor SwiftShader is a physical-phone result, and no intended reference trajectory was invented from inaccessible live content.

## 6. Two controlled candidates rejected

**Bounded nonblocking submission credit:** a query-gated experimental tick allowed at most one outstanding fence, continued charging the sole raw wall clock and coalesced stale scene submissions. Original desktop/mobile still fail at line 126, with **one / two** distinct blue poses. It does not satisfy the requested visible cadence and was removed. Its experimental implementation was not production-qualified for every cleanup/control policy; it is retained only as a rejected experiment patch, not shipped code.

**Conservative opaque-instance frustum culling:** camera-space conservative boxes retained all potentially visible static blue module instances in original order. Unit checks covered partial near/edge intersections, reversal and mirrored/nonuniform transforms. All **16** deterministic before/after raw RGBA checkpoints are **bit-identical** (zero changed channels), across four blue and four glass states at each width. The matrices/materials/resolution were unchanged; shader-deformed truss geometry was deliberately excluded from this candidate.

Nevertheless original desktop fails line 124 and mobile line 126 (both only two distinct blue poses). Correlated replay does not show a reliable sufficient cadence gain. This is not a verified playback correction, so the culling implementation and its added unit changes were **removed**. `experiments/culling/` retains its patch, logs, JSON, exact parity images and comparison. The readback parity helper deliberately performs synchronous deterministic seek/readback; it is **not autonomous playback or performance evidence**.

Neither failed candidate was disguised as an app fix or used to loosen a gate. There is no candidate query flag, fence scheduler or culler in final application source.

## 7. Final regressions, preservation and limits

Final local `npm run check` (lint/types/production build), original asset-backed goal units, home-motion units, asset route suite, reduced-motion goal suites at both widths, playback-clock/policy probes at both widths, and context-loss/no-WebGL/astronaut-failure scenarios at both widths pass. Two pre-existing lint warnings remain; they were not suppressed. Full and production-only audits report **zero vulnerabilities**. Raw commands, exit statuses, diagnostics and warnings are retained rather than summarized as an all-green acceptance result.

Clock probes show **zero additional paused draw submissions** at both widths. A 650 ms intentional stall advances approximately **0.6867 / 0.6746 authored seconds**, not a 0.25 s clamp. Menu/modal resume, skip, replay, Contact navigation and live reduced-motion release pass. Relevant shader/resource/cleanup/reverse/fallback checks are exercised in the reduced suites; original normal suites stop at their genuine failed initial gates.

`preservation.json` compares final files with investigation entry: original acceptance, captured actor/pose math, downstream trajectory/glass math, home content, dependencies/lockfile are preserved. The active scene diff is only the optional observer hook, which allocates no probe snapshots or GL work when absent. Previous integrated user work and the audited dependency graph remain intact. Security is an audit result, not a claim that a build proves cinematic acceptance.

Direct live reference access was attempted again: `curl` failed with exit **35**, `SSL_ERROR_SYSCALL`; no live reference timing or parity was fabricated. The sandbox still has no `/dev/dri`; all browser observations here identify SwiftShader. Read [HARDWARE.md](HARDWARE.md) for a repeatable, explicitly unexecuted physical-GPU procedure using the same unmodified acceptance assertions.

**Remaining blocker:** a verified rendering/scheduling correction that delivers enough genuinely visible glass and mobile blue-pose states at the unchanged authored time/quality. The investigation has located major delay stages and expensive production draw scopes, but has not isolated a portable quality-preserving implementation that meets the gates. It does not prove that an actual target laptop passes. No 60 FPS, smooth physical-GPU, 4K60, full reference parity or complete cinematic claim is made. PR #12 stays open.

## Reproduce the software investigation

Linux sandbox with the installed packages, production server at port 3000, and no other profiling/browser jobs running:

```sh
mkdir -p temp/root-cause
export CHROMIUM_BINARY="$(node --input-type=module -e 'import s from "@sparticuz/chromium";console.log(await s.executablePath())')"
cat >temp/chromium-multiprocess.py <<'PY'
#!/usr/bin/env python3
import os,sys
binary=os.environ['CHROMIUM_BINARY']
os.execv(binary,[binary]+[a for a in sys.argv[1:] if a not in ('--single-process','--in-process-gpu')])
PY
chmod +x temp/chromium-multiprocess.py
export CHROMIUM_EXECUTABLE_PATH="$PWD/temp/chromium-multiprocess.py"
export CHROMIUM_MULTIPROCESS=1
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=1440 node scripts/validate-goal-sequence.mjs
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
PIPELINE_TAIL=22000 PIPELINE_OUT=temp/root-cause/native-desktop node scripts/diagnose-render-pipeline.mjs
PIPELINE_WIDTH=390 PIPELINE_TAIL=22000 PIPELINE_OUT=temp/root-cause/native-mobile node scripts/diagnose-render-pipeline.mjs
PIPELINE_STAMP=0 PIPELINE_FIRST_FRAME_WAIT=0 PIPELINE_OUT=temp/root-cause/unstamped-control node scripts/diagnose-render-pipeline.mjs
# Attribution only, not the uninstrumented baseline:
PIPELINE_DRAW_TIMERS=1 PIPELINE_OUT=temp/root-cause/draw-attribution node scripts/diagnose-render-pipeline.mjs
```

The original harness hardcodes SwiftShader and single-process flags; the shim removes only the two single-process switches. The diagnostic helper also honors `CHROMIUM_MULTIPROCESS=1`. Run serially and retain each exit status. `npm run start` must use the freshly built standalone output. Failed normal gates are expected observations here, not commands to bypass.

### Curation

Only necessary visual sequences and localization examples are included. Auxiliary control/attribution/rejected-candidate reports can retain capture filenames whose JPEGs are intentionally omitted; they are not represented as complete visual recordings. Full final native datasets **do** include every captured JPEG. Included raw traces and stdout are gzip-compressed without editing their bytes. Full final-native and unstamped-control traces are retained. Auxiliary attribution, rejected-culling, older mobile and intrusive-stamp traces stay in ignored scratch storage; their raw query/timing reports (some `report.json.gz`) and the intrusive CPU profile are retained. The localization desktop report and selected photos are retained without its redundant trace. Movies are derived conveniences; checksummed JSON/JPEG evidence is primary. The manifest hashes all curated files except itself. Large scratch collections remain ignored under `temp/`, not silently promoted into production code.
