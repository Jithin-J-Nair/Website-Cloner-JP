# About astronaut and valley pass — 2026-10-30

**Status: implemented improvements; strict full-clone acceptance still NOT MET.** This pass builds on `9120a1f`. Earlier reports remain historical; this report and its captures describe the newer explorer/material/framing revision.

## Reference research

- Rechecked `https://lusion.co/about`: page-fetch returned all text and hierarchy; actual Chromium at 1440×900 and 390×844 returned `ERR_CONNECTION_CLOSED` again. [Fresh research and baseline measurements](about-explorer/reports/research.json).
- Actually opened historical phase-H desktop/mobile valley captures. Observed grounded narrow white astronaut, cyan visor/chest, bright central floor, dark flanking ridges, suspended silver/cyan particles, scattered debris and monumental type. Historical captures are controlled reference states, not current live observations or exact timing measurements.
- The earlier Drive link identifies an approximately 120 MB recording that exceeds the connector download limit. **It has not been watched or frame-inspected.** Text/stills cannot establish every hover, animation or scroll transition.
- Read repository AGENTS, canonical cloning skill and motion/inspection guidance, installed Next client-boundary docs, and the prior three-repository skill study before edits. [Pre-edit plan](about-explorer-plan.md).

## Current implementation audit

**Preview discrepancy found and repaired:** checkout/server were on old clean shallow `8e7875f` / Next 16.3.5, not the existing branch's saved `9120a1f`. Safely fetched/deepened and fast-forwarded the same session branch, rebuilt from its lockfile and replaced the old server. No reset, discarded edits, branch switch or dependency additions. The preview now serves the newer implementation on port 3000.

The About route already includes intro → lunar world → narrative → team → brands → awards/articles/talks → expertise → CTA → footer → Projects portal. Ownership remains `/about` → `src/components/pages/AboutPageView.tsx`, About-specific Three modules, shared CTA/footer. Home/journey source remains unchanged.

Specific gaps addressed: seven-primitive capsule figure; low valley figure framing; grey ridges; sparse large ground stones that rotated in place; cyan uniform with no shader consumer. Shader-displaced fine particles were also vulnerable to transparent terrain being sorted over them from their CPU origin rather than GPU position.

## Implementation

- Added **original procedural Three.js explorer**, not the captured Lusion suit: suit panels, articulated limb shapes, collar, helmet rim and cyan visor, chest triangle/status lights, backpack/tanks, cuffs, gloves, boots and soft contact shadow. No model/texture fetch or external asset dependency.
- Geometry is merged by material: **10,631 triangles, 8 draws including contact shadow, 5 materials, zero textures**. Helmet remains separately poseable. The About owner disposes all owned geometry/materials exactly once.
- Bounded helmet response and very small breathing motion derive analytically from the existing About elapsed-time/pointer packet. No separate clock, RAF, engine or journey state. Reverse/reentry use absolute-time pose; reduced motion is fixed. Legs stay in the standing pose; this is **not a claim of original animation/rig parity**.
- Reframed the valley using historical figure/plume positions, then return to the prior narrative/team camera framing. Adjusted suspended plume height during pullback. Existing scroll units are retained, not misrepresented as freshly measured live timing.
- Connected the existing cyan-core control to both plume fragment shaders. Kept neutral desktop silver at entry and a localized cyan accent for valley/mobile. Retained 2 plume draws, existing mesh tiers and 4× fine-point population; no fluid solver or extra render targets.
- Explicit background/field transparency order prevents GPU-displaced fine particles being painted over by the fading terrain. Existing opaque figure/debris depth testing is retained.
- Darker rock and tighter bright-floor contrast; stronger About-only suit/debris key/fill. One existing instanced debris draw now contains **48 suspended stones + 272 smaller grounded grains**. Ground transforms are baked once, not continuously rotated; only 48 suspended matrices update per frame, using a contiguous update range. Heights use the same basin function as mesh/contours.
- No dependencies, homepage/journey/audio-engine changes, restricted suit/portrait requests, hidden errors, relaxed production quality predicates or altered existing browser assertions.

### Exact-clone gaps that remain

This is **not everything cloned exactly**: original fluid topology, original suit/rig/motion, exact topography, authentic named portraits, trademark emblems, production expertise art, existing 2D CTA, distorted wordmark variants, precise timing/parallax and every current hover remain approximate or unverified. No current reference recording has been inspected. The new explorer is an original equivalent, not the production Lusion model. Full-fidelity acceptance remains **FAIL**, with live temporal verification additionally **NOT VERIFIED**.

## Audio diagnosis

Audio engine and controls were not changed. Previously reported physical production silence remains unresolved; no new listening test or audio root-cause claim. Earlier nonzero signal evidence is not physical audibility certification.

## Validation

Fresh local production build, final lint and TypeScript **PASS**; one existing unused `highlight` lint warning in unrelated project detail view remains. No source files were excluded from checks.

| Gate | Fresh result |
| --- | --- |
| Explorer unit test | **PASS** finite geometry/normals, bounded triangles and suit dimensions, deterministic independent instances, absolute-time reverse/reentry, fixed reduced pose, non-finite input guards, no textures/network/RAF and idempotent cleanup |
| Existing plume and terrain units | **PASS**; plume unit extended to ensure cyan uniform is actually consumed, existing disposal/count/transport assertions retained |
| Motion units / asset route security | **PASS** / **18 PASS** |
| Full About browser suite, both widths, final render order | **PASS** shader compilation, section coverage, native desktop wheel forward/reverse, pointer release, real keyboard/card controls, native emulated touch horizontal selection vs vertical scrolling, resize, menu/visibility/offscreen sleep, genuine context loss/restore, unavailable fallback and remount cleanup |
| Selection buffer reuse | **PASS** 51 → 51 buffers at both widths; no allocation per member selection |
| Reduced motion | **PASS** steady frames, no pending RAF; [report](about-explorer/reports/reduced.json) |
| Actual Home → About → Projects → Home footer round trip | **PASS** desktop click / mobile emulated tap, owned context/probe release |
| Unchanged home-motion browser suite | **PASS** 1440 desktop and 390 touch-emulated mobile |
| Production QA | **PASS** 22 routes, expected 404s, existing asset/security checks |
| WebGL/resource gate | **PASS** GL_NO_ERROR, bounded resources; valley 13 draws / 203,145 triangles; peak 15 geometries / 1 texture |
| Strict full-clone fidelity | **FAIL**, known approximations/substitutions above |
| Software 60 Hz target | **FAIL**, measured submission cadence below |
| Physical GPU / real device touch / speaker / OS background certification | **NOT VERIFIED** |

The earlier normal-motion goal blue-diversity and legacy hidden-mobile-audio assertion failures remain documented in previous reports; those suites were not rerun or claimed fixed here. Full About suite assertions and home browser scripts were not weakened. The new explorer unit initially included the intentionally wider contact-shadow plane in its suit-width check; corrected that new test to measure the suit group, without relaxing its width bound.

### Isolated final SwiftShader measurements

No concurrent browser tests during this run. Mesh tier = 1,800 + 7,200 fine points, framebuffer desktop 960×600 / mobile 390×844. These are **submission/RAF timings, not display FPS, whole-frame GPU time or physical GPU certification**. They are not a controlled speedup comparison with earlier runs.

| Viewport | Unit | Median / P95 RAF ms | Submissions/s | Draws |
| --- | ---: | ---: | ---: | ---: |
| 1440×900 | 0 | 189.4 / 361.4 | 4.6 | 2 |
| 1440×900 | 1.6 | 177.5 / 319.6 | 4.8 | 13 |
| 1440×900 | 5.35 | 315.4 / 917.0 | 3.8 | 2 |
| 1440×900 | 7.2 | 72.3 / 331.8 | 9.4 | 2 |
| 390×844 | 0 | 164.9 / 174.9 | 6.2 | 2 |
| 390×844 | 1.6 | 162.4 / 284.3 | 5.6 | 13 |
| 390×844 | 5.35 | 249.5 / 271.4 | 4.2 | 2 |
| 390×844 | 7.2 | 33.2 / 68.9 | 25.6 | 2 |

Unexpected About console/page errors and restricted requests: **none**. Context loss restores one canvas and retained normalized position/time. Team mode uses points/lines; zero triangles there does not mean zero GPU work.

## Delivery

- Current production preview on **port 3000**, route **`/about`**; home is preserved.
- Same session branch `arena/95a11883-website-cloner-jp`, [draft PR14](https://github.com/Jithin-J-Nair/Website-Cloner-JP/pull/14). **Not merged.**
- [Evidence](about-explorer/): two fresh pre-edit valley captures, final desktop/mobile milestones/full-page captures, research attempts, JSON/browser/unit/build logs; ~1.3 MB. These are actual local renders, not reference screenshots used as backgrounds.
- Current motion behavior was exercised by browser inputs/assertions. This pass does **not** include a new comparison video, and old MP4s describe earlier revisions only.
