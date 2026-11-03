# About reference-first audit — 2026-11-02

Base implementation: `30c864332de3b1340e92a39eed662ee636f65250`, fixed branch `arena/95a11883-website-cloner-jp`.

## Status at this research checkpoint: visual-motion evidence blocked; implementation paused

The user has explicitly rejected the current approximation and requested study of the actual page before cloning. Another original 3D embellishment is not an acceptable substitute. No application code was changed in this audit. Previous functional test passes do not establish reference fidelity.

### Evidence obtained this pass

1. Fresh `fetch_page` of <https://lusion.co/about> succeeded. It confirms current readable page content, the active Edan Kwan entry, awards/articles/talks, all four service lists and contact/footer copy. It does **not** establish scene appearance, geometry, camera motion, breakpoints, scroll distances, timing or pointer behavior.
2. Fresh actual Chromium attempts at 1440×900 and 390×844 both failed navigation with `net::ERR_CONNECTION_CLOSED`. No source screenshots or animation observations were obtained. See `live-inspection.json`. This is not evidence that the public website is generally down.
3. Rechecked the previously supplied Drive recording's metadata: `2026-10-29 22-24-06.mp4`, 119,697,263 bytes, 37,616 ms, 2560×1600. It remains **unviewed**. The connector's raw download limit is 104,857,600 bytes; no oversized download was attempted or falsely reported watched. A smaller copy is required for frame inspection through this interface.
4. Actually opened the historical composite images `reference/side-by-side/11_expertise_cards_vs_strategy_cards.jpg` and `12_lets_work_together_cta.jpg`. The left halves are historical official-site evidence; the right halves show an older unrelated local state, not the present baseline.

## Confirmed correction to the reconstruction approach

The historical expertise evidence is **playing cards**, not the newly authored wireframe geometry gallery:

- The earlier still shows an ornate outlined card back, centered below AREA OF EXPERTISE.
- The later still shows four white front faces on blue, STRATEGY / CREATIVE / TECH / PRODUCTION headings, black corner marks, complete service lists separated by fine dotted rules, and inverted bottom-edge labels/marks.
- The headline is staggered across two very large lines, rather than the compact left-aligned heading currently used.
- An oversized white graphical stroke is visible behind the later cards.
- These two stills do not establish the exact transition, flip axis, hover response, scroll hold or mobile arrangement. Those must be observed rather than fabricated.

**Important evidence-label correction:** the file called `12_lets_work_together_cta.jpg` actually shows the expertise card fronts in its official half. It is not a screenshot proving the contact particle behavior. Neither its filename nor the narrative timeline is sufficient evidence of an observed CTA wave/simulation.

The native `AboutExpertiseField` and `ExpertiseStudies` additions may be technically functional, but their sphere/ribbon/grid/platform motif is not supported by these reference frames. They must not be defended as fidelity merely because they are real Three.js. Replacement should follow verified card behavior, not another new visual direction.

## Scene audit matrix

| Scene | Evidence currently available | What cannot yet be claimed / must be inspected |
|---|---|---|
| Opening plume + solid LUSION | Historical official half of `09_about_plume_wordmark.jpg`; current local captures | Current silhouette/lighting, near/far grain distribution, live autonomous motion, pointer response, font geometry at the same viewport. Particle counts and private shader formulas are unknown. |
| Pullback / terrain / explorer | Historical official half of `10_about_terrain.jpg`; local captures | Continuous camera trajectory, start/end/hold distances, explorer animation, fog/rock placement, synchronization of text and world. Authored camera constants are not reference measurements. |
| Worldwide studio narrative | Fresh text and current local implementation; historical timeline notes | Current reference composition, depth/contour behavior, transition timing and mobile treatment. |
| Team | Fresh text confirms active Edan Kwan entry; old repository metadata and abstract local visualization | Genuine current portrait appearance, switching/deformation/scan effects, gestures and mobile framing. Abstract local faces are not employee likenesses. No restricted model permission is inferred. |
| Brands / awards / articles / talks | Fresh text, canonical repository content, historical sequence notes | Actual marquee behavior, logo treatment, outlined typography positioning, reveal/scroll mechanics and responsive states. |
| Expertise | Two actually inspected historical card-back/card-front images, fresh full service lists | Exact back-to-front choreography, layout stages, card rotation/hover/touch behavior, background graphic and mobile layout. Current wire studies are a verified conceptual mismatch against the historical evidence. |
| Contact / footer transition | Fresh semantic content; historical timeline assertion; local contact implementation | Actual current particle topology, accumulation versus wave behavior, pointer response, title layering, footer release and reverse. No verified CTA screenshot in the misleadingly named image above. |

Historical recording timestamps reflect hand-scrolling. They must not be converted directly into scroll-progress values or animation durations. A still proves a visible state, not what input caused it.

## Skills and engineering rules for the rebuild

Re-read the repository clone skill and inspection/motion references, AGENTS and installed Next client-boundary documentation. Revisited Scroll Craft's depth guidance, Taste's existing-project workflow/critique, and Emil's animation-review standards.

- **Clone/inspection skill:** observe source states first; distinguish time, scroll, pointer and click drivers; compare source/local at matched viewport and state. A DOM dump is not a visual audit.
- **Scroll Craft:** use real independent depth and shared contact anchors, a coherent reversible timeline and separately observed mobile composition. Do not replace Lusion's established sequence with a different generic cinematic sequence.
- **Taste:** audit the actual render, retain the existing framework/content/working routes, fix the largest structural mismatch first. This brief fixes the art direction to the reference; random direction dealing, redesign scoring and generic anti-card rules must not override the source's real playing-card composition.
- **Emil:** purposeful interruptible UI motion, cheap transforms/opacity where appropriate, touch/reduced gates, explicit lifecycle ownership. WebGL has a separate measured GPU budget; adding more objects is not proof of quality or smoothness.
- No package migration, Home journey/audio rewrite, copied production bundle/private shader, fabricated current-site observation, invented employee likeness or weakened test is justified by this task.

## Source ownership to preserve

- `src/app/about/page.tsx` routes to `AboutPageView`.
- `AboutPageView.tsx` owns About's native world, camera/scroll-to-HUD mapping, narrative/team/recognition/expertise composition.
- `AboutPlume.ts`, `AboutTerrain.ts`, `AboutExplorer.ts` own original approximation geometry/materials. They are not recovered official assets/parameters.
- `AboutExpertiseField.tsx` / `ExpertiseStudies.ts` are the unsupported new motif identified above; retain until a reference-led replacement is ready, rather than deleting working code speculatively.
- `ContactCtaSection.tsx`, `CinematicContactField.tsx`, `ContactParticleField.ts` are shared with other routes. An About correction must not silently break Projects/contact/Home variants.
- Preserve the existing Home camera/clock/choreography/audio ownership, global navigation, accessibility, fallbacks and route cleanup.

## Evidence required before implementation resumes

A viewable recording (a compressed copy under 100 MB of the already supplied video is sufficient if it covers the page), or a working live browser inspection path. Review it first, extract labeled keyframes and record observed triggers/enter/hold/exit/reverse states. If it omits hover/mobile behavior, mark those unverified rather than inventing them.

Then:
1. Build a source-state → current-state gap list, separating visible facts from unknown implementation details.
2. Replace unsupported composition first, beginning with the expertise card system, not by adding more geometry to the wrong design.
3. Implement one measured section/transition at a time inside existing owners; compare before advancing.
4. Capture desktop/tablet/phone and relevant reduced/reverse/hover/touch states. Where source mobile or input evidence is unavailable, disclose that boundary.
5. Run functional/lifecycle/resource tests and report frame pacing separately from visual similarity. The existing software 60 Hz failures remain unresolved until genuinely measured otherwise.

No exact-clone, comprehensive animation-understanding, current visual inspection or completion claim is made by this audit.


## Subsequent implementation checkpoint

The next user request was “Now clone” the About page. Implementation proceeded using the verified historical compositions and current text, with authored transition behavior explicitly distinguished from observed source motion. The unsupported wire-study act was replaced, scene composition corrected and lifecycle regressions tested. This does not retroactively establish access to the unviewed recording or current live animations. See [implementation, evidence and limitations](../../validation/about-reference-cards-results.md).
