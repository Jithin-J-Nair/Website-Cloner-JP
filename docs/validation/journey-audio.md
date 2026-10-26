# Vortex journey — original stage-synchronized audio

2026-10-26 · Base: `b0a96a8881d79257200b246a05304dc11356a17f` (merged PR #12).

**Implementation delivered; acceptance is partial, not a reference-fidelity certification. Do not merge automatically.** The reference could not be reached/listened to; software-rendered normal cinematic gates were already failing. Those gates are retained unchanged. This is an original musical interpretation following the existing scene, not a copy of Lusion's soundtrack.

## Reference research: firsthand vs unavailable

Before editing, actual Chromium navigation to `https://lusion.co/` was attempted at desktop 1440 and mobile-width 390. Both failed with `net::ERR_CONNECTION_CLOSED`; the timestamped result is in [reference-attempt.json](journey-audio/reference-attempt.json).

| Requested observation | Result |
|---|---|
| Astronaut emergence, vortex, flash, blue corridor, monitor/glass, contact audio | Live access and listening unavailable |
| Opt-in, entry/exit cues, crossfades, intensity, filters, stereo/spatial behavior | Not firsthand verified |
| Press/hold, slowdown, muffle, release, cancellation, reverse behavior | Not verified; no new hold-to-slow or pointer-down interaction was added |
| Mobile opt-in/disable policy and mobile hold behavior | Not verified; existing mobile control visibility/touch ownership preserved |

`reference/TIMELINE_OFFICIAL.md` is secondary, local visual-order evidence from a hand-scrolled recording. It is **not** audio/listening evidence, and its 97-second recording is not an authored journey duration. No reference audio was downloaded, extracted, decoded, sampled, or repurposed for this change. Existing proprietary audio files in the checkout are not loaded by the new engine.

## Audit and architecture

- `src/lib/home-motion.ts` retains the sole **22.5-second cinematic playhead**. `GoalTunnelSection` already derives `tTunnel`, `tShatter`, `tWait`, emergence/title state, playback pause, and shard visibility from it (or the existing intentional inspector/native reduced-motion path). Those computations, shader/pose clocks, assets, trajectories, stage boundaries, quality policies, navigation and rendering math are unchanged.
- The integration hands the **same evaluated coordinates** to audio **after actual `shardsMesh.visible` has been assigned**. A generation-checked scene lease rejects stale async/unmount writes. Out-of-band, asset-error, context-loss, and cleanup paths clear/release journey state. There is no audio-owned visual progress, animation RAF, wheel/touch hijacking, or renderer scheduling/culling change.
- One document singleton owns **one live native AudioContext**. It is created only through existing production sound-button/showreel opt-in click/tap handlers. No automatic loader, context, source, or network audio request is created on mount/scroll/hover before opt-in. Browser tests record `navigator.userActivation.isActive` at construction.
- Five original stereo buffers start at a common audio-clock time, loop coherently, and keep their musical phase through stage changes, reverse, mute/restore and scene reentry. They are **not** sought or restarted on each stage; reverse restores the mix, not backwards wave playback. Last HUD-owner teardown stops sources/suspends the reusable context; a subsequent full HUD remount starts a fresh bounded set. Ordinary scene reentry does not do that.
- Production graph: five `source → stem gain` pairs → stage lowpass → independent hold lowpass → music gain → **master** → compressor → destination. UI/glass voices → effects gain → the **same master**. No UI/effect bypasses mute. Stage filter does not incorrectly muffle every UI confirmation.
- Scene updates store a packet/edge intent and coalesce one microtask. No audio nodes/listeners/sources are created in the render call. Gain targets are rounded to .01 and cutoff to Hz; automation cancels/replaces stale ramps, continuing from the computed current ramp value. Stage/music/effect smoothing is 90 ms, master 35 ms, optional hold 120 ms. Initial stem gain stays zero until the shared future start, then fades in. Normal mute/overlay transitions fade transient gains for 20 ms before scheduled stop; final teardown explicitly disconnects both source and gain.
- Graph creation is transactional; generation guards cancel stale resume promises. Unsupported context, rejected resume, buffer synthesis, node creation and UI-transient failures leave visuals usable and report `unavailable`, with explicit gesture retry. An externally closed context can be replaced on retry after disconnecting the old graph; normal toggles/remounts reuse one context.
- Visibility/pagehide suspends the authorized context and clears pending effects. Visible/pageshow attempts resume of existing authorized intent, otherwise the accessible sound button offers resume. Explicit cinematic pause and menu/reel/route overlays gate music/effects without changing the scene clock. Overlay ducking also avoids background music over the existing reel. `dispose()` closes/disconnects the final owner resources.
- Five 10-second, 24 kHz stereo stems plus the 1.4-second transient occupy about **9.41 MiB PCM after opt-in**, with no audio downloads or runtime dependencies. Initial synthesis is synchronous after gesture/resume; low-end physical-device startup cost remains unprofiled.

## Authored stage → sound mapping

These are **local source-derived boundaries and original artistic decisions**, not observed reference audio timings. Vectors below are `[orbit, pulse, bass, prism, resolve]`; all are further multiplied by music-level and the shared master (0.65 when enabled). The score is 96 BPM, four bars/10 seconds, D minor / B-flat / F / C. Sustained stereo pads, eighth-note pulse/bass/kick and sixteenth-note stereo metallic arpeggios are distinct musical layers, not a single generic noise bed.

| Actual source state | Layer targets / transition | Stage LP / music level | Entry/exit behavior |
|---|---|---|---|
| Outside active band / released scene | `[.20,0,0,0,.10]` | 2300 Hz / .45 | Quiet global original bed; also the fallback state, not a stuck journey cue |
| Black-title (`sy < emergenceStart`) | `[.30,0,.04,0,0]` | 1500 Hz / .55 | Restrained filtered title pad |
| Emergence / solar (`inEmergencePhase`) | `[.62,0,.10,.06,0]` | 3800 Hz / .70 | Orbit layer opens; audio-clock ramp, no transport reset |
| Tesseract (`tunnel < .785`, after emergence) | `[.22,.64,.54,.08,0]` | 3200 Hz / .78 | Rhythmic pulse/bass increases |
| White transition (`.785 ≤ tunnel < .865`) | Smoothstep SHAFT → BLUE | 3200 → 9600 Hz / .78 | Continuous blend through existing flash interval |
| Blue (`tunnel ≥ .865`, drop 0) | `[.12,.34,.62,.70,0]` | 9600 Hz / .78 | Bright stereo arpeggio over bass |
| Glass / monitor (`0 < drop < .30`) | Smoothstep BLUE → `[.36,.10,.22,.26,.18]` | 9600 → 4608 Hz / .78 → .68 | Rhythmic energy relaxes as screen is revealed |
| Fracture phase (`drop ≥ .30`, before contact) | Retain GLASS mix | 4608 Hz / .68 | Dedicated original glass transient only at actual visible forward edge |
| Contact (`drop .92 → .99` or `wait > 0`) | Smoothstep GLASS → `[.28,0,.08,.08,.68]` | 4608 → 4200 Hz / .68 → .62 | Resolve layer blooms, pulse disappears |

The blue shader starts transitioning around `.81`; the named audio `blue` state starts after flash-out `.865`, with its mix already crossfading during the flash. These are deliberately distinguished. Phase labels do not replace geometry visibility or trigger the glass cue by themselves. Static stereo phase/note differences are original widening; no reference-matched spatial tracking or binaural behavior is claimed.

### Glass, reverse, mute and hold rules

The cue requires a previous valid active sample, a **false → true actual shard visibility edge**, increasing drop, unpaused state, and zero wait. Engine authorization/running/visibility/overlay checks apply too. First deep entry is silent; reverse is silent and rearms after returning to an invisible sample. Muted/hidden/paused samples still advance the edge baseline so no stale fracture erupts on restore. A forward jump into a visible fractured state emits once; a skip beyond visible shards/contact does not. Repeated visible samples cannot retrigger it. A single coalesced pending edge is canceled by reverse, pause, hide, release or mute.

`setHeld()` is an unbound composable filter capability for a future verified interaction, **not** a shipped hold-to-slow feature. It never changes playback rate. Pointer-up/cancel/lost-capture/blur clear it; clearing the hold lowpass preserves the current stage lowpass. Production pointer-down is intentionally unbound because reference hold behavior was unavailable.

## Mobile, reduced motion, and existing media

The existing ≤812px header sound-button hiding is unchanged. There is no mobile autoplay or audio download; explicit opt-in remains possible through the existing showreel UNMUTE control, which already calls the shared engine. Browser emulation exercises an actual touch tap through that UI, closes the reel, and captures the journey score. A dedicated mobile journey toggle/reference-equivalent mobile UX is **not** claimed. This is a disclosed existing-control limitation, not verified Lusion policy. No new touchstart/move or scroll interception is introduced.

Reduced-motion keeps the existing native/manual policy and does not acquire a second progress clock. Explicit music opt-in is independent of motion preference. The native `<video>` in `ShowreelModal` retains its existing media mute controls; its media soundtrack is not routed through or captured by this synthesizer. Global engine mute covers **all newly authored music and all engine UI/glass effects**; native video controls remain separate existing behavior. No claim is made that the engine is an OS/browser-wide mute.

## Validation and evidence

Reproduction (production server running on port 3000):

```sh
npm run check
node scripts/test-journey-audio.mjs
node scripts/test-asset-route.mjs
node scripts/test-home-motion.mjs
node scripts/test-goal-sequence.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-journey-audio.mjs
CHROMIUM_MULTIPROCESS=1 AUDIO_NATIVE=1 AUDIO_WIDTH=1440 node scripts/validate-journey-audio.mjs
CHROMIUM_MULTIPROCESS=1 AUDIO_NATIVE=1 AUDIO_WIDTH=390 node scripts/validate-journey-audio.mjs
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=1440 node scripts/validate-goal-sequence.mjs
GOAL_MOTION=normal GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
GOAL_MOTION=reduce GOAL_VIEWPORT_WIDTH=1440 node scripts/validate-goal-sequence.mjs
GOAL_MOTION=reduce GOAL_VIEWPORT_WIDTH=390 node scripts/validate-goal-sequence.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-playback-clock.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-context-loss.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-home-motion.mjs
```

The deterministic suite checks pregesture silence, common start/zero-gain onset, all stages/boundaries/reverse, latest-state coalescing, fixed graph size over updates, cancelable ramps, programmatic hold and every interruption release, fracture crossing/replay/mute/skip, music/effect master routing, pause/overlay/visibility, stale leases, singleton/remount/dispose, unsupported/resume/synthesis/node failures and retry, closed-context recovery, finite/distinct buffers and loop seams. It requires no asset downloads and is added to CI without removing any existing checks. It is **not listening proof**.

The browser harness opts into a **read-only** probe before mount; normal production does not install the probe. It taps the actual final compressor into a test-only MediaStreamDestination and analyser, then uses real MediaRecorder/Opus capture. Added nodes/routes exist only in the harness. Before opt-in it checks zero context/sources and zero `/audios/` requests. Status, source-coordinate packets, gains, filter targets, context/source counts, actual signal metrics, and timestamps are logged. No mock AudioContext is used for browser output.

Controlled captures intentionally freeze test RAF callbacks after setup, then use the **existing inspector** to render selected source coordinates. They verify stationary screenshot/source-ID agreement, real signal at ≥3 distinct stage mixes, forward/back traversal, exactly-once glass plus reverse rearm, desktop mute silence/restore/rapid toggles, failure/retry, touch opt-in, and reduced-motion non-autoplay. This is **not autonomous in-motion acceptance**.

The separate native captures **do not freeze RAF or seek the inspector**. After one normal native scroll activation there is no input until completion. They record the existing owner clock, audio output and timestamped CDP compositor frames. Afterwards, a separate replay tests cinematic pause silence/resume, desktop browser suspension/gesture recovery and mute without resetting paused progress, plus genuine WebGL context loss/fallback/native-scroll release. These instrumented recordings are **not performance benchmarks**. The original uninstrumented cinematic gates are run separately, unchanged.

### Final results (fresh production build)

`npm run check` **PASS**: lint/typecheck/production build. Two unchanged lint warnings remain: `AboutPageView.tsx` missing `team` effect dependency, and unused `highlight` in `LusionProjectDetailView.tsx`. Audio unit, asset-route (**18/0**), home-motion unit and goal/pose/glass unit commands **PASS**. CI now includes the deterministic audio command.

| Browser command group | Result |
|---|---|
| Controlled desktop + touch-mobile + failure/retry + reduced-motion audio | PASS |
| Uninterrupted native desktop audio + post-capture pause/suspend/mute/context-loss | PASS |
| Uninterrupted native touch-mobile audio + post-capture pause/context-loss | PASS |
| Existing normal cinematic 1440 | **FAIL**, unchanged assertion at `validate-goal-sequence.mjs:126` |
| Existing normal cinematic 390 | **FAIL**, unchanged assertion at `validate-goal-sequence.mjs:126` |
| Existing reduced cinematic 1440 / 390 | PASS / PASS |
| Existing playback-clock/policy, context-loss, home-motion browser commands | PASS / PASS / PASS |

**10 browser command groups: 8 PASS, 2 FAIL.** Batch exit is intentionally **1**, not a green gate. Exact exit codes, logs and source hashes are in [results-summary.json](journey-audio/results-summary.json), [results.tsv](journey-audio/results.tsv) and [environment.json](journey-audio/environment.json).

Original-app baseline was measured with the original audio engine restored before integration. Both normal gates already failed. Default launcher/viewport policy is unchanged between those baseline/final runs:

| Normal gate | Original: wall seconds / blue pose count / glass samples | Final: wall seconds / blue pose count / glass samples | Failure |
|---|---|---|---|
| 1440 | 24.559 / 5 / 0 | 24.491 / 4 / 13 | Original missed an intermediate stage (line 124); final fails advancing blue-flight poses (line 126) |
| 390 | 23.031 / 4 / 16 | 23.636 / 5 / 6 | Both fail advancing blue-flight poses (line 126) |

These are sampled **source** counts, not GPU presentation/FPS measurements or evidence of a performance improvement. Exact failing assertion varies with software-renderer cadence. No no-regression/performance certification is inferred from two already-red runs. Earlier matched-renderer/physical-GPU acceptance work is not re-certified by this audio task; its existing artifacts remain untouched.

### Listen / view / inspect

- **Native desktop:** [audio + captured visual preview](journey-audio/native-1440-preview.mp4), [original Opus bus recording](journey-audio/native-1440-audio.webm), [timestamped summary](journey-audio/native-1440-summary.json), [full source/audio samples (gzip)](journey-audio/native-1440.json.gz).
- **Native touch-emulated mobile:** [audio + captured visual preview](journey-audio/native-390-preview.mp4), [original Opus bus recording](journey-audio/native-390-audio.webm), [timestamped summary](journey-audio/native-390-summary.json), [full samples (gzip)](journey-audio/native-390.json.gz).
- **Controlled forward/reverse + glass replay:** [desktop audio](journey-audio/1440-controlled.webm) / [state + signal + screenshot index](journey-audio/1440.json); [mobile audio](journey-audio/390-controlled.webm) / [index](journey-audio/390.json). Five stage screenshots per viewport are included beside these indices.
- [Unsupported recovery](journey-audio/failure-unsupported.json), [rejected-resume recovery](journey-audio/failure-resume.json), [synthesis-failure recovery](journey-audio/failure-synthesis.json), [reduced-motion opt-in](journey-audio/reduced-motion.json).
- [Decoded recording analysis](journey-audio/decoded-audio-analysis.json) verifies actual encoded Opus signal, not only graph mocks or target gains. Whole-recording RMS is .02575 / .02599 for controlled desktop/mobile and .02963 / .03020 for native desktop/mobile; decoded peaks .1732–.1894 are below full scale. This does **not** establish perceived mix quality or physical listening.

Both native recordings sample all **seven** journey states from solar through contact, one context/five loops, and exactly one fracture. Recordings span approximately **25.950 s desktop / 23.617 s mobile**, with **44 / 60 timestamped CDP frame packets**, not a claimed rendering FPS. Pause measurements are exactly zero analyser RMS; resume RMS is .00914 / .01692. Desktop context suspension reports `suspended`, then recovers on the real sound-button gesture with one context/five loops. Genuine WebGL loss clears active journey state and releases native scrolling into the static fallback. Controlled desktop mute RMS is zero; restore and rapid toggles retain one context/five loops. Controlled reverse/re-crossing yields exactly two glass events on each viewport; first opt-in is an active user gesture, with no pregesture context/audio requests. Unsupported/resume/synthesis failures all recover to `on` with five loops after restoration and an actual retry gesture.

**Recording limitation:** desktop CDP initially delivered two frame metadata timestamps out of order by **2.284 ms**. The existing encoder correctly rejected that raw ordering; [its error is preserved](journey-audio/encoding-raw-order-rejected.log), not hidden and its assertion is unchanged. Encoding used a separate chronological timestamp-sorted index retaining **every** original frame/time; the raw indices are preserved in `native-*-frames.json`. Mobile timestamps were monotonic. [encoding.json](journey-audio/encoding.json) records the exact permutation, commands, offsets and FFmpeg version. Previews are VFR, downsampled to at most 640px wide, without interpolation, and aligned to audio by capture-request timestamps only. They are not calibrated audiovisual latency or smooth-motion certification. Full original Opus recordings and source logs are also retained independently of that derived preview.

Large raw JSON is losslessly gzip-compressed; e.g. `python -c "import gzip; print(gzip.open('docs/validation/journey-audio/native-1440.json.gz','rt').read())"`. Raw JPEG packet sequences and encoder intermediates remain in ignored `temp/journey-audio/`; compact deliverables are archived here. No existing assertion, expected baseline, motion script or failure was changed to pass.

## Scope of proof / remaining acceptance gaps

1. **Reference listening and behavior comparison were blocked**, including mobile/hold/spatial behavior. No full reference fidelity claim.
2. Actual Web Audio signal and encoded output can be verified, but **physical loudspeaker playback, human listening/judged musical quality, click-free perception, Safari/iOS autoplay, and physical-device audiovisual latency were not verified**. Signal/automation assertions are not a substitute for those checks.
3. Source-state/audio agreement is not photon-level GPU presentation synchronization. SwiftShader can backlog/skip delivered scene frames; the original normal-motion gates still apply. No scheduler/culling workaround or assertion weakening was added to make audio appear to fix rendering.
4. Native recordings retain observed compositor holds/cadence; any encoded preview must preserve capture timestamps without interpolation. Audio/video capture-request timestamps are not calibrated speaker/display latency.
5. First opt-in generates a bounded ~9.41 MiB score locally. Physical low-end mobile startup/thermal/power cost remains unprofiled. The existing hidden mobile header control is a disclosed usability limitation.

## Changed-file inventory and provenance

| File | Reason |
|---|---|
| `src/lib/audio.ts` | Replace generic/proprietary bed and mute-bypassing effects with singleton graph/transport, shared master, smoothing, lifecycle/failure handling and compatible UI methods |
| `src/lib/journey-audio-state.ts` | Pure source-coordinate stage/mix mapping and sampled visible fracture predicate |
| `src/lib/journey-score.ts` | Original deterministic five-stem composition and original seeded glass-like transient; lazy PCM synthesis |
| `src/components/home/GoalTunnelSection.tsx` | Read-only audio handoff from existing evaluated coordinates/shard visibility; lease/fallback/context-loss cleanup; no motion/render math changes |
| `src/components/foundation/StudioHud.tsx` | Engine/store lifecycle, overlay ducking, accessible starting/on/off/suspended/unavailable state/retry, opt-in read-only validation probe |
| `scripts/test-journey-audio.mjs` | Deterministic state/graph/automation/lifecycle/failure tests using isolated TS transpilation and fake Web Audio |
| `scripts/validate-journey-audio.mjs` | Real desktop/touch/reduced/failure and native journey output capture; documented controlled vs native distinction |
| `.github/workflows/ci.yml` | Add independent deterministic audio tests; existing lint/typecheck/build retained |
| `docs/validation/journey-audio.md` | This architecture, research limitations, mapping, provenance, results and completion report |
| `docs/validation/journey-audio/*` | Compact logs/JSON, screenshots and original synthesized audio/native capture evidence with manifest |

**Licensing:** score/generator/transient code and their generated audio are original work for this repository, under its existing [MIT license](../../LICENSE). No new runtime audio binaries, samples, fonts, models, textures or npm dependencies were added. Evidence audio is solely the new synthesizer's tapped bus, not reference audio or native video audio. Screenshots/native visual recordings show the existing clone and retain those existing visual assets' separate provenance; MIT for the new score does not relicense pre-existing/reference visuals. Optional external FFmpeg is used only for evidence encoding/analysis, not shipped or added as an app dependency.

<!-- DELIVERY: populated after commit / PR creation -->
