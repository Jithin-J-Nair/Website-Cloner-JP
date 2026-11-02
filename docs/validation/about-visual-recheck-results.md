# About: visual recheck after the “looks unchanged” rejection

## Status and scope

This is a further implementation repair, **not an assertion that everything now matches Lusion**. The previous pass changed the service cards but left the dominant opening/world too similar to the rejected local version. A fresh cold browser visit confirmed the previous preview really served that newer code: four card fronts, one About canvas, no loading overlay, correct `/about` URL. There was no evidence of a stale server. A fresh preview address is supplied to avoid retaining an already-open client document; this is not presented as the explanation for the fidelity complaint.

The user explicitly declined authorization to use the repository's inspection-only Lusion scene/team assets. No such asset was enabled, copied, or introduced into the About runtime. There are no permission/environment flag changes. The new suit is the **already-shipped, attributed NASA Gemini GLB**, not Lusion's suit; see [asset provenance](../ASSETS.md).

The app remains editable Next.js/Three.js code, not a replay/video/iframe or downloaded production bundle. `/about` is the destination. The real app's `/` remains Home; the separate About launch proxy only supplies an About-first preview.

## Actual problems repaired

1. **Sparse opening ribbon:** most coarse grains were nearly subpixel, while their spatial distribution was diffuse. Added a coherent two-lobed/neck profile and a center-weighted radial distribution, increased the meaningful mid-size grain population, and reduced outlier frequency/size. The existing deterministic analytical field, two draws, quality-tier counts, shared uniforms, pointer response and world clock remain. It is still an original analytical approximation, not a copied fluid/VAT simulation.
2. **Smooth sinusoidal basin:** replaced its macro sine hills with bounded domain-warped ridged noise, while retaining the asymmetric rim/floor, shared height sampler and mesh topology. A first overly spiky iteration was visually rejected and softened before the final build. Added world-anchored downhill microrelief on steep faces and confined pale sand to low shallow surfaces. No sampled Lusion heightmap/material or extra render target is used.
3. **Toy-like figure:** reused the existing permitted NASA suit's real garment geometry, straps, cloth normals, black visor and skeleton instead of making the procedural placeholder the only representation. It uses its own mounted/parsed resources, relative/abortable fetching, planted normalized bounds and the existing contact shadow. The procedural version is immediate and remains the real offline fallback. No new RAF, animation clock, dependency or captured suit loader is introduced.
4. **Figure size overwritten per frame:** a mount-only size correction was being overwritten by the existing authoritative render assignment. Corrected that actual assignment to desktop scale `1.33` (phone/tablet remains `1.0`), preserving grounded feet and the camera path. This is an authored screen-space match to the historical wide figure, not a claim about source world metres.
5. **Floating ground gravel / oversized sky debris:** preserved all 320 instances and the 48-instance animated subset. Concentrated the 272 static clasts on the visible basin, half-embedded them according to their actual scale instead of lifting every size 8 cm above the floor, and reduced floating fragment sizes. Static transforms still bake once; no added per-frame matrix work.
6. **Huge haze instead of a shaft:** narrowed and centered the shaft, limited it below/within the suspended volume rather than continuing it above the cloud as a full-height laser, and reduced the broad haze/hotspot. This remains an original world-space light plane, not verified source volumetric machinery.
7. **Desktop expertise heading under fixed navigation:** gave its pinned stage real header clearance and increased the opening stack's downward offset. Its native-scroll/CSS-3D flip, complete 20-service fronts, keyboard interaction and tablet/phone reading layouts remain.
8. **Phone/tablet wordmark over the manifesto:** the old wordmark continued after the manifesto became fully visible. Aligned its mobile exit with the existing manifesto arrival so it is hidden at `u=2.8`; retained the early `u=1.6` wordmark, desktop timing, camera, narrative/team phases and the single native-scroll coordinate system. Mobile source timing is unavailable; this is a readability correction, not measured mobile parity.

## Files and ownership

| File | Responsibility |
|---|---|
| `src/components/three/AboutPlume.ts` | Original cohesive field, grain sizes/outliers/fine scatter; unchanged populations/two-draw ownership |
| `src/components/three/AboutTerrain.ts` | Shared ridged basin height, anisotropic filtered microrelief and low-floor sand mask |
| `src/components/three/AboutLicensedExplorer.ts` | New permitted NASA upgrade, normalization, standing pose, finite head response, cancellation, fallback and exactly-once resource ownership |
| `src/components/pages/AboutPageView.tsx` | World integration, effective actor size, gravel grounding/distribution, bounded shaft, mobile DOM handoff, probe revision/asset status |
| `src/app/globals.css` | Scoped desktop expertise header clearance |
| `src/lib/about-expertise-motion.ts` | Opening card drop `27vh → 32vh`; reversible authored poses otherwise retained |
| `scripts/test-about-licensed-explorer.mjs` | Success, bounds, pose, shared resources, early fetch cancellation, late parse disposal and explicit failure unit cases |
| `scripts/validate-about-visual-recheck.mjs` | Real cold entry and whole-page captures at three widths; real GLB readiness, effective per-frame size, cleared mobile wordmark, request restrictions, reverse and genuine 503 fallback |
| `scripts/build-about-recheck-evidence.mjs` | Reproducible bounded screenshot/log archive, labeled comparisons, build ID and tested source SHA-256 manifest |

The original procedural explorer and its existing tests remain intact. Home's asset loader, journey camera/pose/clock, navigation, shared CTA, audio engine, loading owner, reduced-motion controls and asset/security routes were not rewritten. No dependencies or copyrighted source assets were added. Loading the permitted suit does increase the visible figure's geometry/texture work versus the procedural fallback; unchanged particle counts do **not** mean unchanged total GPU cost.

## Skills actually applied

- Re-read `AGENTS.md`, the canonical clone workflow and installed Next.js `use client` documentation.
- Re-read Scroll Craft and applied the prior study: one native/reversible coordinate owner; no extra timeline, no input hijacking, retained responsive/reduced/context/unmount behavior.
- Re-read Taste's actual rendered-critique reference: compare pictures rather than intentions; review full journeys at desktop/tablet/phone; reject the spiky intermediate rather than trusting build success.
- Re-read Emil's animation standards: interruptible/native controls, deterministic reentry and no unnecessary secondary motion scheduler. Reference evidence takes precedence over a generic redesign.

## Verification

Final app build: `npm run check` **PASS** (lint, TypeScript, production build; existing unrelated unused `highlight` warning remains).

| Check | Result |
|---|---|
| Plume / terrain / procedural explorer / new NASA lifecycle / expertise-pose units; Home motion units | PASS |
| Cold full journey at 1440×900, 768×900, 390×844; current scene marker and real NASA GLB ready; effective scale; header clearance; mobile wordmark hidden; no restricted model fetch / overflow / runtime errors | PASS |
| Deliberate NASA HTTP 503: warning and retained live procedural fallback | PASS |
| Existing card interactions, wheel/reverse/keyboard/pointer/touch/reduced/resize/remount | PASS |
| Wide/threshold/short-window cards; actual downstream WebGL loss/recovery | PASS |
| Existing About world/team keyboard-selection-swipe/reverse/suspension/buffer ownership/reduced/context restore/unmount | PASS |
| Master reconstruction at desktop/tablet/phone, shared CTA, reduced/lifecycle/fallback | PASS |
| Actual Home → About → Projects → Home footer controls | PASS |
| Home desktop / phone touch and site-wide scroll | PASS |
| Route QA, 404, asset checks and asset-route security/Range tests | PASS |

**Final serial job exited 0**, ending `FINAL ABOUT VISUAL RECHECK PASSED`. The expanded whole-journey capture was then run successfully against the fresh port-3003 preview, additionally capturing the client act and the real CTA midpoint at all three widths. No app source changed after the final production build or between these runs.

Asset availability checks prove existing delivery/security behavior, not permission to reuse captured media. The About request log separately verifies that its only model request is the permitted NASA GLB.

The new loader unit explicitly disposes during both an unresolved fetch and an unresolved GLB parse. The latter cannot be cancelled by the fetch signal, so its eventual scene must be released rather than attached to an unmounted world. Shared material textures are deduplicated during disposal; the existing contact shadow is preserved. Browser checks load the real GLB and separately induce an actual HTTP failure; mocked unit fixtures are not offered as proof of successful real rendering.

The first new capture-harness attempt used an incorrect existing award selector; that harness error was corrected to `#about-award`. No product assertion/baseline was disabled to pass it. Intermediate jobs were stopped and restarted after visual corrections; only the final completed job should be interpreted as the final regression result.

## Screenshots and reproducible evidence

Generated by `node scripts/build-about-recheck-evidence.mjs`:

- [Local before/after: opening, terrain, expertise](about-visual-recheck/before-after.jpg)
- [Historical official comparison: opening and terrain](about-visual-recheck/historical-comparison.jpg)
- [Desktop whole journey](about-visual-recheck/journey-1440.jpg)
- [Tablet whole journey](about-visual-recheck/journey-768.jpg)
- [Phone whole journey](about-visual-recheck/journey-390.jpg)
- [Raw captures and three-width JSON](about-visual-recheck/after/)
- [Build ID and tested source hashes](about-visual-recheck/manifest.json)
- [Checks/logs](about-visual-recheck/checks/)

Local before/after is 1440×900; the old terrain is the archived previous commit's same viewport/scroll milestone. Opening/card before images are actual fresh captures of the previously served preview, not a guessed reconstruction of it. Animated ambient times differ. Historical reference files are 1810×530 side-by-side captures. The comparison preserves the entire 905×530 official half, including its original capture banner/gutter, and letterboxes it without trimming the page or stretching it. The source browser viewport is not known; this is not a synchronized equal-viewport comparison. These are useful visual evidence, not SSIM/pixel-parity measurements.

## Remaining differences / failed acceptance criteria

**An exact clone is still not achieved or certified.** The historical source comparisons still show different metal structure/lighting and different terrain geometry/material. Source solver/camera values are not known. The original analytic volume and NASA suit are not Lusion's production scene. Team remains explicitly abstract, not employee likenesses, following the permission decision. Brand/award wordmarks are not faithful trademark SVGs; the open-license font replacement has different glyph metrics. Ornamental card art and flip/hover/mobile timing remain authored equivalents. The shared CTA is retained, not newly proven source-identical.

A fresh source Chromium navigation again returned `ERR_CONNECTION_CLOSED`, recorded in `served-before.json`; this says nothing about the public site's uptime. The earlier large source video remains unviewed. Do not infer motion, mobile parity or CTA behavior from the misleading historical `12_lets_work_together_cta.jpg` filename (it shows card fronts).

No physical GPU/phone/touchscreen/speakers/OS-background/audio-hearing or 60 Hz certification was performed. These browser checks use software rendering/emulation. Submission counts/RAF intervals, successful shader compilation and nonzero draws are not GPU time, display FPS or visual fidelity. The earlier 60 Hz acceptance failure is not closed by this pass.

No merge or production publication is authorized or performed.

## Reproduce

```bash
npm run check
npm run start
# Another shell. Use the real app directly (the About-first preview proxy is optional):
ABOUT_RECHECK_BASE=http://127.0.0.1:3000 CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-visual-recheck.mjs
node scripts/test-about-licensed-explorer.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-experience.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-master-reconstruction.mjs
```

After the named logs/captures exist in `temp/visual-recheck`, regenerate the bounded committed archive with `node scripts/build-about-recheck-evidence.mjs`. Full recording/binary scratch output stays ignored under `temp/`; it is not added to Git.
