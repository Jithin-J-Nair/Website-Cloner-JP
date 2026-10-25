# Follow-up evidence — PR #12, 2026-10-25

**Not cinematic acceptance.** The original autonomous normal-motion gates remain failing. See the current summary at the top of [`../../mission-repair.md`](../../mission-repair.md). Historical results below that summary are explicitly historical.

## Capture interpretation

`recorded-final/replay.mp4` is an uninterrupted native replay, encoded from all 67 timestamped CDP frames (44.435 seconds including a requested 20-second post-completion tail). No seeking, wheel input, clicks or secondary playhead occurs between activation and completion. Diagnostic timer queries and GL wrappers are enabled in this recording; it is **not** the uninstrumented performance baseline. JPEG frames and `recording.json` are retained for independent inspection. VFR encoding preserves observed timestamp gaps; no interpolated/constant-rate frames were invented. The optional ffmpeg encoder was obtained as the `imageio-ffmpeg` Python wheel in ignored `temp/`, not added to application dependencies.

The CDP timestamps can be converted to page-relative time as `time * 1000 - timeOriginMs`. The telemetry sampler observes completed **CPU submissions**, not swap/presentation events. A temporal association with the latest telemetry is not a causal match to the image. For example:

| Reviewed image | Capture page time (ms) | Visible content | Application status |
| --- | ---: | --- | --- |
| `motion-0024.jpg` | 61875.8 | Axial lattice, astronaut receding | Latest observation already tunnel progress .805 |
| `motion-0040.jpg` | 78916.1 | Blue corridor | CPU completion at 72646.2, over six seconds earlier |
| `motion-0041.jpg` | 79568.9 | Monitor containing corridor | About 6.9 seconds after CPU completion |
| `motion-0042.jpg` | 80158.4 | Monitor containing corridor, changed subject pose | Completed telemetry |
| `motion-0043.jpg` | 81137.9 | Astronaut/stickers, before CTA text | Completed telemetry |
| `motion-0044.jpg` | 81420.6 | Astronaut/sticker CTA | Completed telemetry |
| `motion-0066.jpg` | 92762.8 | Astronaut/sticker CTA | Completed telemetry |

This demonstrates a capture/presentation/telemetry mismatch in this software-browser environment. It **does not** prove that sufficient fracture/glass frames are visibly presented, that every stage meets the unchanged gate, or that the application's animation is correct and only its acceptance test is wrong. The recording tail exposes later images but is not used to weaken or change any original assertion. `recorded-baseline` is the earlier 33-frame replay without the tail; it ended with late tunnel images and could not verify the downstream stages.

## Exact diagnostic findings and limits

- Original fresh baseline: desktop and mobile fail `validate-goal-sequence.mjs:124`, zero mid-glass telemetry samples each.
- After integration/security fixes: desktop still fails line 124 (one mid-glass telemetry sample); mobile fails line 126 (`captured blue-flight pose keeps advancing`) after passing the phase-count gate. Counts fluctuate; this is not a fix. Computed unique blue poses are five desktop / three mobile (gate requires more than five); the desktop pose assertion is not reached after its earlier failure.
- Final cold/replay diagnostic records 39/41 observations while `playing`, one mid-glass submission observation in each. Total replay observations include the tail and must not be reported as movie frames.
- Replay submissions near the handoff: 66027.3 ms, u=.7844 / glass=.0299; 66952.4 ms, u=.8254 / glass=.2710; 68754.5 ms, u=.9059 / glass=.7983; 69802.5 ms, u=.9522 / glass=1. CPU submission durations are 1.2/.9/1.5/.9 ms. Sparse callbacks persist without recorded replay long tasks or >20 ms wrapped GL calls; first-use shader compilation alone cannot explain this run.
- Cold diagnostic does show long tasks up to 1909 ms and 12 slow `texSubImage2D` calls (22–68.7 ms), mostly before activation and early in the tunnel. This is evidence of cold upload work, not proof it causes the late-glass omission. Only selected GL methods are wrapped; this is not exhaustive driver/JS attribution.
- Separate phase-tagged asynchronous GPU queries establish large software execution times (hundreds of milliseconds). Query results are delayed, deduplicated by ID and not paired to a particular RAF or image. They do not isolate shader/overdraw cost or establish physical-GPU performance.

The known failure mechanism is inadequate observed submission/presentation cadence across short authored phases, compounded by observation lag; the exact shader/driver/compositor cause and a quality-preserving fix are **not established**. No timing stretch, dt truncation, resolution/quality cut, alternate controller, shader rewrite, speculative warm-up or acceptance-harness change is applied.

## What each evidence class proves

- `baseline-*.json`, `final-normal-*.json`: original unchanged autonomous gates, including failures. Repeated 100 ms telemetry samples are not presented frames.
- `final-reduced-*.json`: seeked 11-state/reverse/handoff/cleanup/failure checks, not native movie cadence.
- `final-clock-*.json`: pause/menu/resume/resize/skip/replay/contact/live preference/elapsed-time policies; not cinematic visual certification.
- `profile-before`, `profile-equivalent`: exact original four-phase script/settings, no timer queries, separate cold browsers. Observer RAF rates are not delivered FPS. No performance gain is claimed.
- `profile-gpu`: five separate native phase sweeps including **glass before burst** (.05–.20) and **shatter** (.30–.65), 10 seconds requested each. CPU, observer/submission distributions, draw/triangle/resource counts and asynchronous phase GPU timings are separate. Unlike the paired uninstrumented runs, this run enables queries and adds a glass phase, so it must not be presented as an apples-to-apples speed comparison.
- `visual`: actual running-build seeked solar/camera/lattice/glass/contact captures. They are not the authored uninterrupted movie or invented reference timings.
- Reference side-by-sides in `reference/side-by-side`: upstream supplied comparison artifacts; left is its labeled official source, right is an **older** generic reconstruction, not this final build. `reference/TIMELINE_OFFICIAL.md` explicitly describes hand-scrolled timestamps as order/keyframes, not durations. Live access was attempted again; see `final-reference.json`.
- [Security remediation](security-remediation.md): exact audit findings/paths and compatible graph fixes. Advisory absence is not a penetration-test certificate.

## Reproduction

Run a production build/start first (`npm ci && npm run check`, then `PORT=3000 npm run start`, bound to 0.0.0.0). Node >=20.9 is required; this validation uses Node 22.22.3, npm 10.9.8, HeadlessChrome 153/Linux, DPR 1, two reported cores and ANGLE Vulkan SwiftShader. No `/dev/dri` or system hardware browser is available. The app's software drawing buffer is 960×600 at viewport 1440×900. This is not a physical-GPU/device or 4K60 test.

The bundled Chromium's single/in-process-GPU launch flags crash in this sandbox. Shared-runtime scripts use `CHROMIUM_MULTIPROCESS=1`; the unchanged legacy scripts use this ignored-workspace executable shim, which removes only those two flags:

```python
#!/usr/bin/env python3
import os, sys
os.execv('/tmp/chromium', ['/tmp/chromium'] + [a for a in sys.argv[1:] if a not in ('--single-process', '--in-process-gpu')])
```

Set `CHROMIUM_EXECUTABLE_PATH=$PWD/temp/chromium-multiprocess.py` and make it executable. The bundled runtime extracts `/tmp/chromium`. Original acceptance script SHA-256: `d417ee59798b40d0434e3cdeffe069b8f70dc3096c58479f635f102a198cb910`, unchanged from entry commit `7c81b44`.

Exact commands, environment overrides, exit codes and wall durations are in `final-results.json` and `extra-results.json`. Both clock report paths are copied separately. Two invocations mistakenly used `AUDIT_FAILURE=glb`, an unsupported scenario that injects no failure and times out; their nonzero results/logs are retained. Correct `AUDIT_FAILURE=astronaut` reruns are separate, not silent replacements. Reference access attempts may exit zero while recording a network exception; only the recorded exception, not the process exit, determines whether reference access succeeded.

Text log copies normalize CRLF/trailing whitespace for Git display only; original stdout logs remain in ignored `temp/followup`. Exit codes, messages, JSON metrics, images and movie content are not rewritten to hide failures.
