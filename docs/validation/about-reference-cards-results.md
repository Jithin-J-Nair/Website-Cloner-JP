# About: reference-led card reconstruction and scene correction

2026-11-02 · base `30c864332de3b1340e92a39eed662ee636f65250` · branch `arena/95a11883-website-cloner-jp` · route `/about`.

This implements the follow-up “Now clone” request against the available evidence. It is a working, editable update, **not an exact-clone completion claim**. Current live visual/motion access remains blocked. No merge or production deployment was authorized or performed.

## Reference observations and scope

Re-fetched <https://lusion.co/about>: current semantic content still contains the four service lists with duplicated front/bottom card labels, the studio narrative, active Edan Kwan entry, brands, recognition and CTA/footer. Current browser navigation again fails with `ERR_CONNECTION_CLOSED`; [raw attempt](about-reference-cards/after/live.json). Text extraction is not animation inspection. The previously supplied oversized video remains unviewed.

Actually opened and studied the official **left halves** of historical reference images 09, 10, 11 and 12. Their right halves show an older local implementation, not this pass's baseline. In particular:

- Expertise has an ornate playing-card back and four white service fronts, not four independent wireframe studies.
- AREA OF / EXPERTISE is a monumental staggered two-line title.
- Fronts carry complete service lists, geometric corner marks, dotted row rules and inverted bottom labels. An oversized white stroke passes behind the cards.
- The solid opening wordmark has taller glyphs than the local version; the grains are finer than the largest local foreground spheres.
- The valley still places the human slightly right of center, with an asymmetric lower left shoulder and two-sided manifesto. “CRAFTING UNIQUE” / “DIGITAL EXPERIENCES” is a deliberate two-line block.

The misleadingly named `12_lets_work_together_cta.jpg` shows expertise card fronts, **not CTA motion**. No wave/solver behavior is inferred from that name. Historical recording seconds are not treated as scroll distances or source durations.

The new card motion joins the observed back/front compositions with explicitly **authored** curves. Its flip axis, exact pin length, hover response and mobile arrangement are not claimed to have been measured on the inaccessible live source.

## Implemented files and systems

| File | Change |
|---|---|
| `src/components/pages/AboutExpertiseCards.tsx` | New original inline ornamental back, four complete service fronts, modular corner glyphs and inverted footer labels. One reversible native-scroll timeline spreads/flips the cards. Real keyboard focus controls reveal the readable fronts; fine-pointer tilt is bounded to 2°, clears on leave/cancel/blur and does not latch on touch. Mobile/tablet/reduced/short screens show readable fronts in document flow. |
| `src/lib/about-expertise-motion.ts` | Pure, bounded, deterministic card and heading poses, finite-input guards and canonical aligned endpoints. Re-entry/reverse has no retained one-way animation state or independent timers. |
| `src/components/pages/AboutPageView.tsx` | Replaced the mounted unsupported wire-study act with the card composition; removed its redundant SVG-plane scroll updates. Taller solid wordmark, charcoal clear color, grounded figure moved slightly right, balanced desktop editorial columns and explicit two-line italic headline. Camera paths, world clock, quality tiers and shared audio ownership are unchanged. |
| `src/components/three/AboutPlume.ts` | Reduced coarse grain radius while retaining seed counts, shared field packet, analytical curved depth, fine dust, pointer response and resource ownership. Not a new private/source fluid solver. |
| `src/components/three/AboutTerrain.ts` | Reduced the left rim relative to the right escarpment, retaining the basin floor and shared deterministic terrain function used for geometry, contours, rock placement and grounding. Existing grid/material/texture ownership is unchanged. |
| `src/app/globals.css` | About-scoped playing-card layout, sampled historical blue, staggered typography, preserved 3D faces, four/two/one-column reading layouts and reduced-motion/short-height handling. No shared theme, Home style or framework migration. |
| `scripts/test-about-expertise-motion.mjs` | Continuous/finite/monotonic/reversible pose tests, endpoint alignment and stagger checks. |
| `scripts/validate-about-cards.mjs` | Desktop/tablet/phone captures and real wheel/keyboard/pointer/touch, reverse, reading-layout, reduced, resize and navigation/remount checks. |
| `scripts/validate-about-card-boundaries.mjs` | Wide/threshold/short-screen layout plus actual upstream context-loss/recovery while reading the downstream card act. |
| `scripts/validate-master-reconstruction.mjs` | Replaced two obsolete diagram/column selector assertions with service-slot/front assertions, added four-back and zero-extra-WebGL-context assertions. All existing service, world, CTA, Home, lifecycle, route and resource assertions remain. No baseline was altered or failure hidden. |
| `scripts/build-about-card-evidence.mjs` | Packages labeled captures, historical comparisons, local before/after and actual result logs. |

Old wire-study modules remain in the repository as unmounted original work; they are not the About experience anymore. No package or lockfile change, downloaded implementation, copied proprietary shader/model, generated employee likeness or new restricted asset was introduced. Existing About abstract-team disclosure remains. Home, CTA and footer implementations were not rewritten.

### Ownership / runtime

The existing native Three.js world still owns its scene/camera/clock. Expertise now uses CSS 3D for four planes with semantic, selectable HTML service text: **zero expertise WebGL canvases**, no additional renderer/framebuffer/geometry upload. This is not a claim of zero compositing cost.

Card progress is normalized once against cached section geometry. DOM transforms/opacity update on coalesced native scroll/reflow events, not React state each animation frame. Unchanged endpoint values do not keep writing transforms. Observers/listeners/pending RAF are released on teardown; hidden documents cancel pending work. Reduced motion and short screens do not retain an unnecessary multi-screen pin.

### A reproduced lifecycle defect, not just a happy-path check

An additional boundary test found that upstream world context loss collapses the world scroll track without changing the card section's own height. A section-only `ResizeObserver` consequently left its cached document offset stale.

- [Before fix](about-reference-cards/boundaries-before/context-reflow.json): actual expected progress `0.5001736`, card progress incorrectly `0` after loss; test failed normally, [retained failure log](about-reference-cards/checks/boundaries-before.log).
- Fix: observe the enclosing page's flow size as well as the section. Snapshot **actual native document progress**, not the sleeping world's last submitted camera pose, before switching to fallback.
- [After fix](about-reference-cards/boundaries/context-reflow.json): scroll `18230` → `18230`; card pose `0.5002` through loss/restoration; one recovered world canvas; world clock preserved. Existing visible-world recovery tests are retained.

## Skills applied

Read AGENTS, installed Next client-boundary docs and the repository clone/inspection workflow before edits. Revisited Scroll Craft depth guidance, Taste's existing-project/critique guidance and Emil's animation standards.

- **Clone skill:** separate observed states from inferred choreography; compare actual rendered captures; preserve source content and existing architecture.
- **Scroll Craft:** a coherent reversible camera/scroll experience, shared ground anchors, independent depth, complete mobile/reduced compositions. No wholesale engine replacement.
- **Taste:** fix the largest structural mismatch first; no random new art direction, stock wire gallery or new invented portraits. The real reference's playing cards take precedence over generic anti-card design rules.
- **Emil:** interruptible/bounded pointer feedback, transform-based card motion, fine-pointer gates, cheap UI transitions and explicit lifecycle handling. The WebGL world has separate resource/performance considerations; no UI-easing rule is misrepresented as a recovered source camera curve.

## Validation

The final production-build serial runner exited **0**. The added boundary suite and the full suite below passed after the lifecycle fix. Actual renderer is software SwiftShader; “GPU scene” in older test banners means real WebGL API draws, not a physical GPU certification.

| Check | Result |
|---|---|
| `npm run check` | PASS: lint, TypeScript, production build. One pre-existing unrelated unused `highlight` warning remains. |
| New card motion units | PASS: finite/continuous/bounded endpoints, stagger, deterministic forward/reverse and intermediate re-entry. |
| Plume / terrain / explorer units | PASS, including shared field/geometry ownership, finite terrain, planted model, cleanup and invalid-input guards. |
| New card browser suite | PASS at **1440×900, 768×900, 390×844**. All console/page error arrays empty. Native wheel forward/reverse; all faces/lists; keyboard reveals fronts; bounded pointer resets; touch does not tilt; reduced mode; live breakpoint crossing; route release/remount; no horizontal overflow or extra expertise canvas. |
| Additional layout/context boundaries | PASS at **1920×1080, 1000×650, 1440×640**, plus genuine `WEBGL_lose_context`/restoration during the downstream card sequence. All service text fits. |
| Existing About experience | PASS: WebGL scene, team keyboard/selection/swipe, fixed GPU buffers, reverse, pointer, offscreen/overlay/injected-visibility suspension, reduced, context recovery, unavailable fallback and remount. |
| Master reconstruction | PASS at 1440/768/390: Home handoff, all About acts, CTA rendering/GL, reverse, resize, lifecycle/context/reduced/fallback and real route disposal. Updated service structure assertions are stricter, not disabled. |
| Footer portals | PASS desktop click / phone tap: Home → About → Projects → Home, context disposal. |
| Home motion | PASS **1440 desktop and 390 touch**: hero/reel/featured/solar; `solarGL: 0`; errors `[]`. |
| Site scroll | PASS at all three widths. |
| QA | PASS **22/22 routes**, expected 404s, asset security and 50/50 nonempty scene/project asset responses. Asset availability does not establish licensing or imply use in this new section. |
| `test:motion` / `test:assets` | PASS; asset security/Range suite **18 passed, 0 failed**. |

[Final build log](about-reference-cards/checks/final-check.log), [units](about-reference-cards/checks/units.log), [new browser suite](about-reference-cards/checks/browser.log), [About](about-reference-cards/checks/about-regression.log), [master](about-reference-cards/checks/master-regression.log), [Home desktop](about-reference-cards/checks/home-desktop.log), [Home touch](about-reference-cards/checks/home-touch.log), [site scroll](about-reference-cards/checks/site-scroll.log) and [QA](about-reference-cards/checks/qa.log). Logs retain actual failure/result text; only terminal formatting/trailing whitespace is normalized.

No reference-image baselines were changed. The expected pre-fix lifecycle failure is retained rather than hidden. Physical-device testing and source fidelity are separate from these functional passes.

## Screenshots and evidence

- [Desktop sheet](about-reference-cards/desktop-sheet.jpg): opening, valley/manifesto, ornate back and settled service fronts.
- [Phone sheet](about-reference-cards/phone-sheet.jpg): opening, intermediate pullback and two complete service-front examples.
- Historical official still → local: [back](about-reference-cards/historical-back-comparison.jpg), [fronts](about-reference-cards/historical-front-comparison.jpg).
- Complete rendered journey sheets: [desktop](about-reference-cards/journey-1440.jpg), [tablet](about-reference-cards/journey-768.jpg), [phone](about-reference-cards/journey-390.jpg), including narrative, team, awards and CTA/reverse states.
- [Local before/after](about-reference-cards/local-before-after.jpg): prior committed `30c8643` opening/valley captures versus current implementation. Particle phase is not identical.
- Full-size per-width frames and raw browser results: [after/](about-reference-cards/after/).

The historical and local source comparison viewports differ. Images are aspect-preserving and labeled; they demonstrate composition corrections, **not matched-current-viewport pixel parity**. Representative full-size desktop/phone/tablet frames were actually opened and inspected, not inferred from a build or contact-sheet file existing.

## Remaining limits / acceptance

**Exact visual parity remains unverified and incomplete.** The full current animation sequence and actual source mobile/hover behavior have not been observed. The ornamental art, terrain, field equations, explorer and motion curves remain original approximations. Team still uses a disclosed abstract visualization, not genuine employee scans; brand names are not faithful trademark SVG renditions. The shared contact field was preserved, not certified against an observed source wave/fluid simulation.

No physical GPU/phone, real trackpad, OS-background or speaker/audio certification was performed. Software WebGL tests prove rendering/lifecycle behavior, not source fidelity or 60 Hz. The previous overall software frame-rate failure has not been closed by a new controlled performance study. No causal speedup or guaranteed smoothness is claimed from smaller grains or removing an expertise renderer.

Preview: production build on port 3000 at `/about`; existing About-launch proxy on 3001 forwards to it. Use the main 3000 preview for complete root-route navigation. Draft PR 14 remains open/unmerged; nothing was published to production. Commit identity is reported in the final handoff after checks and evidence are finalized.


## Reproduce

```sh
npm run check
npm run start
# In a separate shell, run browser checks serially:
CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-cards.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-card-boundaries.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-about-experience.mjs
CHROMIUM_MULTIPROCESS=1 node scripts/validate-master-reconstruction.mjs
node scripts/build-about-card-evidence.mjs
```

The evidence helper additionally expects the listed Home/site-scroll/QA logs when reproducing the complete packaged run. Development: `npm run dev`; both scripts bind to `0.0.0.0`. Open `/about`; `/` remains the existing Home and the closing portal still links to `/projects`.
