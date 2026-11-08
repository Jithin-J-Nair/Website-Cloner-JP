# About rendering correction

## Evidence and scope

Authority: `public/videos/Lusion-about.mp4` (42.23 seconds, 1920×1080). The working comparison crops the browser recording to `(100,116,1720,912)` before scaling. These are viewport captures, not a visual-parity percentage.

Additional technical reference: `quangminh1212/Design_Lusion.co`, `_astro/hoisted.CUO_IjfL.js`, Git blob `0c57277a2102a61f761357ce2cd432d035cd0a13`. Inspected as text in ignored working files; the executable bundle is neither served nor loaded. The existing `media-bundle/models/about` and `textures/about` contain the matching scene data. This reconstruction adapts the relevant GLSL equations and scene-data interpretation into typed, independently owned modules, not the unrelated reference application or its navigation/runtime.

## Structural differences corrected

| Before | Current implementation |
|---|---|
| Procedural smooth crater and procedural noise for surface detail | Actual 13,872-vertex, 80,238-index terrain and baked shadow/light/height channels, height-gradient bump, height fog and line scattering |
| NASA substitute with unrelated scale/proportions | Actual 2,666-vertex person, two bone influences per vertex, 54 bones × 85 frames; quaternion slerp, RGB light-channel cycling and contact shadow |
| Authored positive-Z camera positions | Actual 200-sample position/quaternion spline; native 60° desktop FOV, original 149-sample retreat + 50-sample pan mapping |
| Analytical double-helix plus additive dust | Persistent float-texture ping-pong simulation: particle lifetimes/respawn, two-octave 4D simplex derivative curl, opposing spin, fluctuating noise scale/stability |
| Camera-facing grain approximations | Actual sphere LODs, two instanced populations, larger sparse emissive grains |
| No volume-dependent self-occlusion | 64³ temporal light-field atlas with density splatting, filtered history, diffuse/specular/refraction samples |
| Unrelated tall beam plane | Integrated line-light scattering, scene-depth-tested sky scattering and moving textured ground fog |
| Bobbing dodecahedra and invented sediment advection | Four actual fractured-rock meshes, 16 animated pieces × 120 frames each, GPU quaternion interpolation and lifecycle flight |
| Flat paragraph slide and short word fades | Native two-chapter cubic travel, line-local em offsets and separately staggered word opacity/viewport translation on desktop |
| Canvas/system-font opening and folding text plane | Actual 1,400-vertex vector logo with per-vertex edge distance and reference staggered cubic migration to the left statement |
| No matching optical pipeline | Quarter-resolution particle velocity, 16-tap opening motion blur, HDR multiscale bloom weighted by emission; white logo excluded from bloom and rendered afterward |
| Invented card-back linework | Actual About card-back PNG through the narrow About endpoint, white-preserving color matrix to the video’s existing route-owned blue |
| JITHIN header on About | LUSION on About only; reference-aligned desktop header padding/type; Home and other routes unchanged |

A horizontal mirror was caught during visual inspection: reflecting Z alone reverses the source negative-Z camera’s screen-right. The world now uses a **180° Y rotation**, preserving handedness, winding and the native projection. Unit tests compare projected terrain vertices from the original and converted coordinate systems.

The packed-buffer reader also now matches the reference decoder’s **2^bits** quantization denominator (256/65536), not 255/65535, and validates index bounds/attribute widths.

## Ownership and delivery

- Existing About RAF/scroll owner calls all simulation, skinning, camera, motion and postprocessing work. No independent animation loop or downloaded application runtime.
- Native renderer target, auto-clear and clear color/alpha are restored after offscreen passes, including exceptions.
- Async requests are aborted; late completions do not attach disposed objects. ImageBitmaps are closed; GPU resources and compositor targets have idempotent disposal.
- Source assets are added individually to `/about/scene/[asset]`. Same-origin, realpath-boundary checks, exact-byte ETags/304, nosniff and restrictive response CSP remain. **No global inspection flag, fonts, unrelated models, audio or arbitrary paths are enabled.**
- Unsupported float rendering or required-asset failure shows the existing accessible information fallback. Reduced motion freezes the developed simulation/rig pose and retains the reading layout. Mobile remains an adaptation because no authoritative mobile recording was supplied.
- Normal desktop uses 24,576 simulated particles; the constrained/software/mobile tier uses 8,192. No physical-device performance claims follow from software-browser checks.

## Validation and remaining fidelity boundaries

`test-about-reference-world.mjs` exercises real assets, reference quantization, rig layout, the camera’s projection equivalence and reversible seeks, persistent offscreen resources, error-state restoration, aborts, bitmap closure and exactly-once cleanup. Existing source-team, card, copy, recognition and lifecycle tests remain; tests for retired procedural modules are only legacy-module coverage, **not** assertions about the active rendering path.

Browser captures and error collection are required in addition to unit/type/build checks. They caught a raw-shader position redeclaration, an unresolved preprocessor include, a current-Three multiply-blending requirement, incorrect neutral-velocity clear encoding, a ShaderPass-cloned/detached velocity sampler, and inappropriate bloom on the wordmark; those were corrected rather than suppressing errors.

This is a substantial rendering replacement, **not a claim of exact full-page parity**. The recording does not reveal the random particle seed, its prior simulation history or exact scroll/time stream. The forked archived renderer is a technical reference, not proof that its every constant matches the recording. The fog's depth-soft intersection/dynamic rock-shadow prepass, exact optical grading and source camera dolly/pointer model remain adaptations. Team presentation, initial wordmark handoff windows, recognition effects, card spread/flip curves, flourish and CTA dynamics retain authored portions and need further matched-frame/motion review. The video does not show the footer. Do not represent passing functional tests as proof these remaining differences are eliminated.
