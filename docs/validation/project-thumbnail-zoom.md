# Project thumbnail zoom — implementation and production verification

## Shipped change

The project-card opening is now implemented, not just specified in an audit. Production preview **3003** serves Next build **`Q-EZhr3zZU6Ewin09idjd`**. The previous audit baseline, application `203e5a6` / build `TZ8s1xwpgRD_kZgq9MSFp`, is historical.

### What changed

- Home and archive card links pass the selected project/anchor to the existing persistent route owner. Ordinary routes retain the generic aperture; selected cards do **not** draw it.
- A transaction-owned compositor captures the visible list's current depth materials and independently clones their geometry/textures before Next can dispose the old page. It preserves the selected image and neighbours rather than replacing them with a screenshot or a black/logo curtain.
- The whole list uses the source-derived compensated pivot, cubic scale, mirrored Y/Z tilt and selected squared depth/fog activation. The existing 12-sample parallax / 6-sample blur shader remains in use. The source list stops drawing duplicate GPU pixels while its captured surface is visible.
- DOM copy fades separately from the image. The destination can measure, load and render beneath coverage; its title/description/services/links follow the reveal phase rather than racing their mount clock. Completed entrances are latched so a slow renderer cannot replay/fade the title after the transaction ends.
- Film sources can prepare while covered but playback waits until the route transaction finishes. Lenis/input remain gated independently of destination rendering.
- Back remembers **Home vs archive**, retains that origin across case chains, restores the current selected card to one quarter of the viewport, reverses the list zoom, then releases input and focuses the card. Direct entry without an origin defaults to Home. If a case is not featured on Home, Back still goes Home with the generic transition rather than trying to zoom a nonexistent Home card.
- Click and Enter on Next Project now use the case owner's existing quintic end-scroll morph rather than invoking a separate generic aperture. Modified/new-tab anchor behavior remains native.
- Atlas uses a coherent dark runtime theme for its card fog, detail/chrome and preceding case's incoming preview. **`#181818` is an approximation from compressed film pixels, not a verified live CSS token.** Both source JSON captures remain unchanged.
- Reduced motion avoids the zoom but still restores origin/position. WebGL construction/context loss falls back to transformed images. Escape, hidden-tab pause, resize, timeout and disposal stay within the existing single route owner.

The approved Home/About/CTA renderers, foliage shadow pipeline, restricted-font policy and JITHIN branding were retained. No dependency or second scroll engine was added. There is no per-card animation clock.

## Recorded comparison

Authority: supplied `public/videos/lusion-project-opening.mp4`, SHA-256 `c3fbb8e8fb41691c0e9e9245cdd0a9238509d3b6da8b8eb657ae2d31c175319d`, and the inspected native list/PageManager equations documented in [the film audit](../research/project-opening-video-audit.md).

Fresh normal-motion recordings at **1720 × 912**:

| Flow | Opening / return frames | Generic aperture | Maximum selected-group scale | Return |
|---|---:|---|---:|---|
| Home → Oryzo → interior gallery → Back | 41 / 38 | No | 2.7273 | Home, scrollY 3679 |
| Home → Atlas → Back | 41 / 39 | No | 2.7272 | Home, scrollY 3679 |

Oryzo was at case scrollY **2427** before Back. Both flows recorded zero uncaught browser exceptions and zero HTTP failures. The original DOM card width remains unchanged because the expansion is in the retained GPU list, not a layout resize; the compositor's scale/depth and actual rendered frames establish the change.

The supplied film's five existing timeline sheets were reviewed alongside the new recordings. The implemented sequence now has the correct *kind* of continuity: selected list image expands, neighbours exit, image depth blends into the case background, case reveals, and Back shrinks into the originating list. This is **not** a pixel-perfect or timing-parity certificate. CDP/software rendering, capture bookends and differing media playback times cannot establish native click timing or hardware frame rate. Coloured slivers in the reference remain unclassified; no speculative particles were added.

Ignored raw evidence:

- `temp/project-zoom-production/recorded/report.json` and `reference-home-{oryzo,atlas}/` (opening and reverse CDP frames/manifests).
- `temp/project-zoom-production/functional-final/report.json` and before/zoom/opened/returned screenshots for four functional flows.
- `temp/project-zoom-production/lifecycle/report.json`, `generic-navigation/report.json`, `preview-media.json`, `served-identity.json`.
- `temp/site-fidelity-audit/project-zoom-production/report.json`: fresh all-page inventory, not a normal-motion parity claim.

## Production checks

| Check | Result |
|---|---|
| Served/build identity | **22 HTML + 26 referenced static assets**, all HTTP 200 and byte-for-byte equal to the new build |
| Home Oryzo, Home right-column Atlas, mobile archive Atlas, image-fallback archive Atlas | **PASS**: real selected scale/depth, hidden generic canvas, destination/theme, reverse scroll/focus, no leaked surface/inert lock, zero uncaught errors |
| Returned card top | 191.14/764, 228.33/912, 210.97/844 and 191.45/764 px respectively (quarter-viewport targets within 0.46 px) |
| Reduced keyboard open/Next/Back | **PASS**: Home origin survives case chain; no zoom; correct return position |
| Direct entry | **PASS**: Back defaults to Home |
| Resize/context loss/Escape | **PASS**: actual `WEBGL_lose_context`, image fallback, source restored, no stale push |
| Existing generic navigation | **PASS**: real XOR pixels, delayed/hung RSC, static waiting state, double activation, focus, Escape, hidden/resume, browser Back, reduced/mobile/touch, Canvas2D failure, fragment intent |
| Existing case navigation | **PASS**: drag vs click, keyboard Next, real wheel charge/morph, reduced no-auto-next, 812/813 switch |
| Preview media | **PASS**: desktop/mobile source selection, real playback, live reduced motion, modal seek/pause/resume, offscreen pause |
| All canonical pages | **44** reduced-motion route/viewport observations (22 routes at desktop/mobile), **0** uncaught errors, **0** horizontal overflows |
| Static/unit/build | **PASS**: ESLint, strict TypeScript, production build, diff whitespace; project zoom/resource ownership, generic motion/navigation, 19-project data, Home editorial, CTA fluid, case shadows, About expertise/copy, HDR/security contracts |

The new resource unit test uses a mocked renderer to check source-resource independence, idempotent disposal and fallback. Real depth rendering is checked separately by the browser flows; neither is a physical GPU performance test.

### Reproduce

```bash
npm run test:project-zoom
BASE_URL=http://127.0.0.1:3003 CHROMIUM_MULTIPROCESS=1 npm run validate:project-zoom
BASE_URL=http://127.0.0.1:3003 npm run validate:project-zoom-lifecycle
BASE_URL=http://127.0.0.1:3003 CHROMIUM_MULTIPROCESS=1 \
  OPENING_AUDIT_REFERENCE=1 OPENING_AUDIT_OUT=temp/project-zoom-production/recorded \
  node scripts/audit-project-openings.mjs
```

## Limits and remaining work

This implements the principal opening/return correction and related lifecycle/theme/Next-click corrections. It does **not** close every F01–F24 finding in the [whole-site audit](../research/full-experience-fidelity-audit.md). Exact gallery readiness/fullscreen activation, special Of The Oak/Worldcoin text emphasis, all scene choreography and every all-page normal-motion/device comparison remain separate fidelity work. Existing gallery/shadow renderers were not gratuitously retuned. No physical-phone, real-GPU, full live rendered-site comparison or exact-clone claim is made.

Harness notes: the first recording retry exposed a 30-second software-capture timeout; the final recorded comparison completed with an explicit longer bound. A concurrent full-site capture also exhausted a screenshot's default 30-second limit; the functional probe was rerun serially with a 120-second capture bound and passed. Single-process bundled Chromium terminates after its final context closes, so the project-opening probes now use a fresh browser per scenario. No assertion was removed to address these harness issues.
