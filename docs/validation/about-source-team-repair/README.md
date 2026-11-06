# About source-team repair — 7 November 2026

Source route: `https://lusion.co/about` → local `/about` (port 3000).
This is a repair of the narrative, team and expertise handoff, not a Home rewrite.
Open **review.html** for the actual rendered comparisons. The personal-photo
reconstruction is intentionally not reproduced in this report.

## Implemented

- Removed the personal-photo PLY and all three photo/surface/invented-body helpers
  from the live implementation. No photo-derived geometry is loaded by About.
- All seven original roster buffers now drive the selected person's head, each
  with its actual 8,192 positions, normals and shade values. The names/roles remain
  the published roster. No invented replacement face or model impersonation.
- Reused original terrain contour positions. A plan view of that source field
  reveals its actual U-shaped void: it is not an anatomical mesh. The narrative
  ground view turns toward that view during team entry instead of using a fake
  chest/shoulder generator. Lighting and camera mapping are reconstructed.
- Added vertical glyph columns using an authored atlas of the existing OFL IBM
  Plex Mono, not proprietary Lusion font software or an original production bundle.
- Kept scheduling/context ownership in the existing world renderer. Selection
  updates existing GPU attributes; interruption bakes the current eased position.
  Stale requests cannot replace a newer selection. Failed assets hide the head,
  rather than showing a different person's portrait under the selected name.
- Narrow eight-file `/about/scene/[asset]` delivery with exact source bytes,
  realpath containment, SHA-256 ETags/304 and restrictive security headers.
- Constrained the narrative paragraph, changed the expertise connector from the
  broad sagging arc to the supplied reference's shallow entry/right-hand turn,
  removed its extra scale, made SVG sizing explicit, and matched caption/control
  proportions. Both heading lines fit at the tested 1568×1005 handoff state.

## Verification actually run

| Check | Result |
|---|---|
| `npm run check` | PASS; two existing lint warnings outside About, no errors |
| `node scripts/test-about-source-team.mjs` | PASS: eight authentic buffers, validation, exact delivery/ETag, denied paths, photo removal, selection identity/buffer reuse, eased interruption, stale response, load failure/recovery, all nine owned resource disposals |
| `CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-source-repair.mjs` | PASS on the production build: 1568×832, 1024×768, 390×844 normal and 390×844 reduced; 124.5 s final run |
| Production HTTP requests | Eight original buffers byte-identical, ETag/304; old personal-photo URL 404; unrelated new-route paths 404; commercial font 403 |
| Rendered interaction coverage | Narrative bounds, real pointer selection, fast switches without geometry growth, completed morph, all seven heads (reduced), wheel forward/reverse, emulated touch swipe, reverse camera, third-image handoff bounds, offscreen/menu sleep, WebGL loss/restoration with selected asset preserved, route cleanup |
| Runtime errors / old-photo requests | Zero in the four targeted production scenarios; see `report.json` |
| Original nine About unit scripts | **5 PASS / 4 FAIL**, unmodified. Failures below. |
| Original `validate-about-experience.mjs` | **FAIL** at line 71: expects a `textPath` containing `LUSION`; current wordmark uses paths, so text lookup is undefined. Earlier milestone screenshots were captured, later assertions did not run. |
| Original `validate-about-accessibility.mjs` | **FAIL** at line 89: recognition PageDown check expects an inner scroller to advance; it timed out. No claim of a full accessibility-suite pass. |

The four retained unit failures: expertise-motion expects `.92` where current
motion returns `.86`; portrait expects the removed 16K/24K procedural quality-tier
code; recognition expects the previous inline `about-recognition-section` class;
scene-motion expects the previous inline portrait shader/rotation variables.
These tests were not edited, suppressed or represented as green. The new targeted
validation is separate, not a substitute claim that the old suite passes.

An initial scratch HTTP assertion incorrectly expected the existing global
`/assets/team/edan.buf` to return 403. Inspection showed the unchanged global
resolver already serves approved repository bundle files without the inspection
flag (200). The corrected result is recorded in `production-assets.json` and the
rights notices; no global resolver/environment changes were made. Commercial
fonts still return 403. The first new unit harness also looked for geometry on
the head Group rather than its Points child; that harness error was corrected
before the passing run. No production scheduler/test-only timing hacks were used.

## Evidence and limits

The official site was attempted in Chromium again; navigation failed with
`net::ERR_CONNECTION_CLOSED`. Source images here are from the supplied 33.78 s
recording (6.0 and 8.5 s), cropped to the page at 1568×832. The transition reference
is the user's supplied image 17; local capture uses its 1568×1005 viewport and a
316 px blue boundary. These are visual comparisons, not synchronized live frames.

**This is not certified as an exact/pixel-perfect clone.** The authentic head and
terrain geometry are now used, but volumetric bloom/haze, pointer-highlight
response, glyph-column shaping, the connector's complete motion and production
shader timing are still reconstructed approximations. Open-license replacement
font metrics remain in force. No original executable production bundle is used.

Chromium uses SwiftShader; mobile input is emulated. These checks do not establish
hardware GPU FPS, 4K60, a physical phone, OS backgrounding, or audible output.
Home, shared navigation/footer, global styles, dependencies, global asset resolver
and existing tests were not changed. No merge or deployment was performed. Rights
rely on explicit user-confirmed reuse permission, not a newly claimed public license.
