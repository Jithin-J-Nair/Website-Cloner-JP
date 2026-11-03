# About: dimensional structures and animation follow-up

**2026-11-02 · Base `1e59091` · branch `arena/95a11883-website-cloner-jp`**

This is a further implementation pass in response to the missing-3D feedback, not a declaration that an exact clone is complete. The running production-build preview contains these changes. No production deployment or PR merge was performed.

## Reference and visible gaps

- Fresh text retrieval of <https://lusion.co/about> succeeded and reconfirmed the studio/team wording, awards and complete service lists. Fresh actual Chromium visual access failed with `ERR_CONNECTION_CLOSED`; [live attempt](about-structures/live.json).
- Actually inspected the historical official-side images in [opening comparison](../../reference/side-by-side/09_about_plume_wordmark.jpg) and [terrain comparison](../../reference/side-by-side/10_about_terrain.jpg). Their left halves are historical reference frames, not a fresh current-site inspection; their right halves are older builds, not this pass's baseline.
- Captured a **fresh local before** at 1440×900, 768×900 and 390×844 before application edits. The reference shows a more substantial luminous silver volume, foreground defocus and a more legible explorer/valley composition than the previous local result. The existing expertise drawings were flat SVGs, not animated dimensional structures.
- Existing genuine-asset restrictions remain enforced. No private shader, captured model or employee likeness was newly reused. The existing visible abstract-team/non-likeness disclosure remains.

## Implemented, not just planned

| File | Actual change |
|---|---|
| `src/components/three/AboutPlume.ts` | Expanded the seeded radial volume rather than the prior thin filament; revised multiscale sphere sizing and feathered curved-surface edges; added actual nearer foreground points/defocus, brighter silver lighting and additive fine scatter. Existing two-layer GPU architecture, counts, typed seeds, curved depth, pointer packet and disposal remain. |
| `src/components/pages/AboutPageView.tsx` | Reframed the continuous pullback into the basin: closer valley view, raised sightline, more legible grounded explorer, larger elevated plume and less cyan/grey sky wash. Later narrative/team camera endpoints and existing choreography/controls remain. Mounted the native expertise field. |
| `src/components/three/ExpertiseStudies.ts` | Four original **non-planar 3D line structures**: latitude/meridian sphere, spatial ribbon bundle, five stacked technical grids, three separated box/platform assemblies. 5,432 total static vertices; one line draw per study, deterministic geometry and idempotent disposal. Not captured reference geometry. |
| `src/components/pages/AboutExpertiseField.tsx` | One native renderer/scissored viewport for all four HTML diagram slots, not four independent WebGL contexts. Real rotating/scroll-responsive structures and bounded fine-pointer response; semantic services and controls stay HTML. Offscreen/overlay/visibility suspension, fresh canvas per effect, genuine context recovery, reduced still and complete cleanup. |
| `src/components/three/AboutTerrain.ts` | Retained actual basin geometry and the shared terrain/contour/feet height function. Replaced repeated fragment lattice hashing with an original, deterministic periodic 256×256 R8 noise tile, mip filtering, existing four-scale relief filtering and world-space surface gradients. The texture is owned and disposed with its material. This is a cost reduction in code, not a claimed measured causal speedup. |
| `src/app/globals.css` | Hide only the old SVG drawing plane after a native frame is ready; retain technical registration marks and restore complete SVG studies on context loss/unavailable WebGL. |

New tests/capture helpers: `test-expertise-studies.mjs`, `validate-about-structures.mjs`, `measure-expertise-budget.mjs`, `build-structure-sheets.mjs`.

No new dependency, package/lockfile change, Home camera/clock/audio rewrite, restricted portrait fetch, route replacement or unrelated redesign. Home and shared CTA behavior remain covered by regression tests.

### Runtime ownership and capability handling

The new expertise renderer has at most four scissored draws, a viewport-sized framebuffer capped at **800,000 pixels / DPR 1.25**, and 5,432 static vertices. It is never a phone-page-height framebuffer. Static geometry uploads once; transforms update existing groups. No React state/per-particle objects are created per animation frame. The fine-pointer response is disabled for touch/reduced motion; reduced mode draws stills on relevant changes, with no pending perpetual RAF. Menu/reel/route-transition gates cancel the owner. Listeners, observers, resources, canvas and context are released on teardown. An actual context-loss event exposes the SVGs again until recovery renders a new native frame.

The opening remains an original analytical sphere/dust field, **not a proprietary fluid solver**. Camera coordinates and procedural structures are authored approximations informed by the historical composition, not extracted Lusion parameters.

The prior skill principles continue: Scroll Craft's independent depth planes/reversible acts; Taste's concrete reference audit and real screenshot critique; Emil's capability gates, bounded motion, resource ownership and performance transparency. Re-read relevant skill overviews/performance guidance for this pass (Scroll Craft `75d81f7`, Taste `12af471`, Emil checkout `f1090be`). Installed Next client-boundary documentation and AGENTS were read before application edits. No generic template direction or generated employee portrait was substituted.

## Verification against the final production build

Final application source was built and the development server replaced with a fresh production server before the full serial browser run. That runner exited **0**. No existing tests or expected baselines were weakened/edited.

| Check | Result |
|---|---|
| Lint / TypeScript / production build | PASS; lint retains one pre-existing unrelated unused `highlight` warning. |
| New 3D study/tile units | PASS: finite deterministic non-planar geometry, bounded vertices, independent texture ownership, mip generation and idempotent disposal. |
| Existing plume / terrain / explorer / pointer / contact units | PASS. |
| `test:motion`, `test:assets` | PASS. |
| New structure browser suite | PASS at **1440×900, 768×900, 390×844**; per-width normal console/page error arrays are `[]`. |
| Existing About experience | PASS GPU scenes, reverse, team input/keyboard/touch, sleep, reduced, real context recovery, fallback and remount. |
| Existing master reconstruction suite | PASS at all three widths, including shared native contact field/lifecycle and Home handoff. |
| Existing footer portal suite | PASS real Home → About → Projects → Home controls and resource cleanup. |
| Existing Home motion, 1440 and 390/touch | PASS. |
| Existing site-scroll suite | PASS at all three widths. |
| QA | PASS 22/22 routes, 404, asset security and 50/50 nonempty scene/project asset responses. |
| Isolated About budget | PASS bounded resource/GL checks; **not** a frame-rate acceptance pass. |

The new suite captures opening, pullback intermediate, valley/explorer, manifesto, worldwide narrative, team, **every expertise row** on phone/tablet and the reduced still. It asserts genuine non-planar geometry rendering, one native expertise canvas, 1–4 draws, `GL_NO_ERROR`, SVG/native replacement, pointer/touch gating, menu pause/resume, genuine `WEBGL_lose_context` fallback/recovery, offscreen suspension, resize, reduced no-pending-frame and actual footer SPA navigation releasing the old expertise context/scheduler. It also forces unavailable WebGL and verifies four SVGs and all 20 services remain. A separate desktop injected-hidden check verifies the new field cancels/resumes its scheduler; [visibility.json](about-structures/visibility.json). This is not physical OS background certification.

The final desktop/tablet/phone contact sheets and local before/after comparison were actually opened and inspected, along with full opening/terrain and native expertise frames. Development-only preview files are not the final evidence: the production captures verify that the fallback SVG drawing is hidden while the native field renders, avoiding duplicate drawings.

## Timing: overall 60 Hz remains unmet

Actual renderer: ANGLE / Vulkan **SwiftShader software**. The isolated About measurements below are uncapped observed RAF intervals, **not physical GPU timings or displayed FPS**. Physical GPU time is not measured. Native hardware/phone/trackpad/OS background behavior and audible output remain unverified; audio was not claimed fixed.

| Viewport | Opening median / P95 ms | Valley u=1.6 | Narrative u=5.35 | Team u=7.2 |
|---|---:|---:|---:|---:|
| 1440×900 | 63.3 / 81.8 | 83.8 / 275.1 | 209.0 / 256.5 | 61.0 / 140.6 |
| 390×844 | 53.0 / 60.3 | 142.0 / 167.7 | 136.6 / 170.9 | 36.2 / 68.4 |

All sampled GL errors were 0; counts/buffers remain bounded. These are serious misses of a 16.7 ms budget. **The overall 60 Hz software-renderer gate is FAIL.** Different historical runs are not controlled A/B measurements; no causal speedup or hardware smoothness guarantee is inferred from them.

The separately isolated **new expertise act** measured the following with the shared contact renderer asserted asleep:

| Viewport | Native study draws | Submissions/s | Median / P95 page RAF ms |
|---|---:|---:|---:|
| 1440×900 | 4 | 33.6 | 33.3 / 33.4 |
| 768×900 | 2 | 59.4 | 16.7 / 16.8 |
| 390×844 | 1 | 60.0 | 16.7 / 16.7 |

Raw [expertise-budget.json](about-structures/expertise-budget.json) retains submitted frames, wall time, 5,432 static vertices, renderer identity, contact-sleep assertion and GL_NO_ERROR. This act's tablet/phone observations are near a 60 Hz page cadence, but are **not displayed FPS or physical GPU/phone certification**; desktop software cadence still misses the target. The cheap RAF observer is measurement code, not shipped application animation logic; its overhead is included. Geometry/draw checks are not represented as a performance pass.

## Final visual evidence

- Fresh local before → final: [desktop](about-structures/after/comparison-1440.jpg), [tablet](about-structures/after/comparison-768.jpg), [phone](about-structures/after/comparison-390.jpg). These are **not live-reference parity comparisons** and are not identical-time particle snapshots.
- Full milestone/native-expertise contact sheets: [desktop](about-structures/after/sheet-1440.jpg), [tablet](about-structures/after/sheet-768.jpg), [phone](about-structures/after/sheet-390.jpg).
- Full final [opening](about-structures/after/1440-u0.jpg), [valley](about-structures/after/1440-u1.6.jpg), [native expertise](about-structures/after/1440-expertise-row0.jpg).
- Per-width JSON, final logs, expected fallback errors and raw isolated measurements are in [about-structures/](about-structures/). Committed log copies normalize terminal carriage returns/trailing whitespace only; error/result text is retained.

Reproduce: `npm run check`; run the unit scripts above; start the production server; then run the listed browser suites **serially** with `CHROMIUM_MULTIPROCESS=1`. Home viewport/touch options remain `HOME_VIEWPORT_WIDTH=1440`, or `HOME_VIEWPORT_WIDTH=390 HOME_TOUCH=1`. Run `capture-about-budget.mjs` and `measure-expertise-budget.mjs` without another browser benchmark, then `build-structure-sheets.mjs` after capture completion. Outputs use ignored `temp/`; this document preserves the actual delivery evidence.

## Remaining fidelity limits

This pass materially changes the visible 3D scene and adds real animated structures where only SVGs existed. **It does not make the exact-clone acceptance claim true:** current live visual comparison remains blocked; the previously supplied oversized recording remains unviewed; team is still explicitly abstract rather than genuine employee likeness; the geometry/simulation/camera are original approximations; and overall software frame pacing fails 60 Hz. Native hardware smoothness and audio are not certified. The draft PR remains reviewable, not merged or deployed.
