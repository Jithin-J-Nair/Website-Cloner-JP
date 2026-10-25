# Target-laptop procedure — not executed in this sandbox

**Status: required follow-up, not a hardware result.** The sandbox has no `/dev/dri` and reports ANGLE Vulkan SwiftShader. A physical GPU, physical mobile device, 60 FPS, native 4K60 and reference parity remain unverified. This procedure supports an installed Chrome in a **macOS or Linux desktop session**. Do not substitute Xvfb, a remote software desktop or WSL and call it a native laptop result. No Windows launcher has been validated here.

## 1. Record the target, source and browser

Use the existing PR branch `arena/6d83ea00-website-cloner-jp`, not another branch. Preserve local user work. Prerequisites: Node >=20.9, npm, Python 3, installed Chrome and a real logged-in desktop session. Record OS, CPU, physical GPU/driver, RAM, screen resolution/refresh rate, Chrome version, power/thermal mode and AC/battery state. Close unrelated GPU-heavy workloads. Do not apply DevTools CPU throttling or resize the test browser during a run.

```sh
git status --short
git rev-parse HEAD
node --version
npm --version
mkdir -p temp/hardware
shasum -a 256 scripts/validate-goal-sequence.mjs
# Expected original acceptance script:
# d417ee59798b40d0434e3cdeffe069b8f70dc3096c58479f635f102a198cb910
npm ci
npm run check >temp/hardware/check.log 2>&1
npm audit --json >temp/hardware/audit.json
npm audit --omit=dev --json >temp/hardware/audit-production.json
PORT=3000 npm run start
```

Keep that production server running in one terminal. In another terminal, configure the checked-in launcher. It removes the acceptance harness's explicit serverless/SwiftShader/headless overrides and lets the **installed, headed Chrome** choose its GPU. It preserves Playwright's pipe/profile arguments. It does not alter the application, playhead, viewport, materials, acceptance assertions or phase thresholds. Browser differences must still be reported; this is not the same browser/backend as the sandbox.

```sh
# macOS example (set the actual installed path):
export HARDWARE_CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
# Linux alternative: export HARDWARE_CHROME="$(command -v google-chrome)"
export CHROMIUM_EXECUTABLE_PATH="$PWD/scripts/launch-hardware-chromium.py"
export CHROMIUM_MULTIPROCESS=1
export BASE_URL=http://127.0.0.1:3000
chmod +x scripts/launch-hardware-chromium.py
```

Open `chrome://gpu` in installed Chrome and save its graphics-feature status, problems/workarounds and driver details. The diagnostic below must additionally report an actual physical-GPU renderer. **Reject a SwiftShader/llvmpipe/softpipe/software/basic-renderer result even if tests pass.** A driver-name check alone is not a delivered-frame-rate certificate.

## 2. Run the ORIGINAL gates, without diagnostic recording first

Run serially, retaining the shell exit status. Do not wrap failures in an unconditional success command. Copy each report before a repetition overwrites it.

```sh
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=1440 node scripts/validate-goal-sequence.mjs >temp/hardware/desktop.log 2>&1
# Record the exit status immediately, then copy the report even if it failed.
echo $?
cp temp/cinematic-validation/1440-no-preference/report.json temp/hardware/desktop.json
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs >temp/hardware/mobile-emulation.log 2>&1
echo $?
cp temp/cinematic-validation/390-no-preference/report.json temp/hardware/mobile-emulation.json
```

A passing build is not a passing cinematic. Stop at and report the original failed assertions; never weaken them. Width 390 here is **mobile viewport emulation on the laptop**, not a physical phone. Retain every failure, not only a lucky pass. Repeat in three fresh browser launches, storing separate logs/reports. The original test itself also exercises replay, pause/resume, overlays, visibility, navigation, reverse and teardown after its initial gates pass.

## 3. Observe native playback independently

The probe starts from native scrolling, waits for an actual initial screencast frame before activation, and issues **no input during an autonomous run**. Its two runs are separated by an explicit re-arm scroll; they are not one uninterrupted movie. It does not seek or slow the cinematic. The tiny GL/DOM code strips are observation pixels, not production visuals.

```sh
PIPELINE_WIDTH=1440 PIPELINE_RUNS=2 PIPELINE_TAIL=22000 PIPELINE_OUT=temp/hardware/pipeline-desktop node scripts/diagnose-render-pipeline.mjs >temp/hardware/pipeline-desktop.log 2>&1
PIPELINE_WIDTH=390 PIPELINE_RUNS=2 PIPELINE_TAIL=22000 PIPELINE_OUT=temp/hardware/pipeline-mobile node scripts/diagnose-render-pipeline.mjs >temp/hardware/pipeline-mobile.log 2>&1
node -e "for(const d of ['desktop','mobile']){const r=require('./temp/hardware/pipeline-'+d+'/report.json');console.log(d,r.device);if(/swiftshader|llvmpipe|softpipe|software|basic.render/i.test(r.device.renderer))process.exitCode=1;}"
```

Inspect the actual sequential JPEGs alongside `report.json`, not only telemetry counts. Verify barcode checksum and GL/DOM IDs, use the matching source frame's authored progress/matrices, and compare fence completion **intervals** to capture timestamps. Review glass cracking, fragments and monitor reveal, and more than five distinct blue-flight source poses. Confirm the uninterrupted sequence and CTA handoff are actually captured. A software cursor or DOM overlay alone is not proof that the canvas updated. If a code is covered or undecodable, leave its ID unknown; never infer it from the latest telemetry.

Chrome tracing is saved as `trace.json`; CPU samples as `cpu-profile.json`. Browser `FramePresented`/pipeline events are observable compositor events, **not a direct measurement of photons on the laptop display**, and are not automatically one-to-one matched to application IDs. For delivered smoothness, also record the actual display with an appropriate high-frame-rate external capture and document capture/display clocks, refresh rate, dropped frames and alignment. No 60 FPS or 4K60 conclusion follows from observer RAFs or CPU submission times.

To bound diagnostic overhead, repeat with `PIPELINE_STAMP=0 PIPELINE_FENCES=0` and compare with the uninstrumented original gates. For attribution only, a separate `PIPELINE_DRAW_TIMERS=1` run wraps individual draws in asynchronous GPU timer queries. Do not use that instrumented run as the uninstrumented performance baseline. Queries may include backend scheduling and are not shader-only cycle counters.

For optional original-harness recordings, repeat the gates with `GOAL_RECORD=1`; that is a separate measurement because capture adds overhead. Preserve logs/JSON/JPEGs for both recorded and unrecorded runs.

## 4. Policy/fallback checks and acceptance

```sh
GOAL_MOTION=reduce GOAL_VIEWPORT_WIDTH=1440 node scripts/validate-goal-sequence.mjs
GOAL_MOTION=reduce GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
AUDIT_WIDTH=1440 AUDIT_TAG=hardware-clock node scripts/validate-playback-clock.mjs
AUDIT_WIDTH=390 AUDIT_TAG=hardware-clock node scripts/validate-playback-clock.mjs
AUDIT_WIDTH=1440 AUDIT_TAG=hardware-loss AUDIT_FAILURE=context-loss node scripts/validate-context-loss.mjs
AUDIT_WIDTH=390 AUDIT_TAG=hardware-loss AUDIT_FAILURE=context-loss node scripts/validate-context-loss.mjs
node scripts/test-goal-sequence.mjs
node scripts/test-home-motion.mjs
node scripts/test-asset-route.mjs
```

Also run both widths with `AUDIT_FAILURE=webgl` and `AUDIT_FAILURE=astronaut` (not the invalid `glb` value). Retain the generated `temp/mission/` reports. Check for unexpected errors, paused draw submissions, replay/skip/reverse failures, leaks and fallback regressions.

Archive the exact source hash, commands, exit statuses, unmodified acceptance SHA, device details, raw reports, timestamped visual sequences, profiles and all failed repetitions. Recheck audits after dependency installation. PR #12 must remain open unless the original desktop/mobile criteria, genuine visual evidence and relevant regressions all pass and a merge is explicitly authorized. **No hardware pass is claimed by providing these instructions.**
