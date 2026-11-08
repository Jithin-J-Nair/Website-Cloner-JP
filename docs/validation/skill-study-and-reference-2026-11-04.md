# UI skill study and Lusion reference audit — 2026-11-04

## Reference analysis

The public Lusion home page is structured as an editorial studio site: a strong opening statement and 3D work, a showreel, featured projects, a brand/experience narrative, then a direct collaboration CTA. The Projects page presents a real project archive rather than turning every section into a decorative card grid.

Reference pages:
- https://lusion.co/
- https://lusion.co/projects
- https://www.commarts.com/webpicks/lusion-v3

The public Lusion v3 write-up describes an astronaut moving through portals, a click interaction that slows the journey, reverse scrolling that rewinds it, and a final glass breakthrough. Those are useful interaction/story cues; the private rendering implementation is not public, so this review does not claim access to its source, solver or assets.

The visual direction extracted from the live site and supplied captures is restrained editorial typography and spacing around a single, high-quality 3D subject. The astronaut sequence is a distinct cinematic act, not an excuse to add a second decorative geometry layer.

## Skills studied and applied

| Skill / tool | Design principle applied in this pass |
|---|---|
| UI/UX Pro Max | Keep the interactive hero responsive, accessible, and measurable across desktop and touch layouts. |
| Impeccable | Apply the craft floor: purposeful motion, visible return states, honest optics, and real screenshot review. |
| Hallmark | Remove visual gimmicks rather than softening them; retain the real project/story content and existing actions. |
| Anthropic frontend-design | Preserve a distinctive visual world and let the actual work/3D subject lead instead of adding generic effects. |
| Open Design | Decompose the reference into hierarchy, content, interaction, and responsive behavior before implementation. |
| Taste Skill | Keep a clear focal point; avoid redundant geometry and visual noise that competes with the astronaut. |
| Vercel Web Interface Guidelines | Preserve reduced-motion behavior, keyboard/focus semantics and compositor-friendly animation. |
| UI Skills | Remove scroll-driven shear, keep DOM reads/writes batched, and stop animation loops when the pointer is outside. |
| GSAP AI Skills | Retain the existing Lenis + GSAP ticker integration; tune the existing scroll engine instead of introducing a competing one. |
| design-md-chrome | Use the design-extraction framework (type, color, spacing, shadow, and motion) as a manual reference audit. The Chrome extension itself was not installed or run in this code environment. |

## Implementation decisions

- Delete the standalone monitor crack SVG and every related ref, opacity, dash and progress hook. The monitor bezel remains clean until the 946 captured glass shards separate.
- Delete the white 4D tesseract mesh group and its four-layer geometry, materials, update loop and telemetry. Let the captured metal truss, its twist/pinch deformation and a restrained cyan-to-magenta spiral core define the vortex.
- Remove scroll-velocity `skewY` from featured project cards and the full-frame radial RGB lens pass at the tunnel handoff. Preserve the deliberate localized solar/visor optical rings, bloom, and glass-surface refraction.
- Keep the captured 946-piece / 15-frame shard data and PCHIP interpolation. Widen the breakup envelope modestly, increase angle-dependent screen-space refraction, and strengthen live-scene reflections and grazing-angle highlights. This remains a screen-space optical approximation, not path tracing or a new rigid-body solver.
- Increase the astronaut's early descent while preserving the shared cinematic playhead and its endpoint.
- Increase pointer influence on the centered connector cluster. Keep idle drift only while hovered; when the pointer exits, the spring target becomes the exact rest pose.
- Tune the existing Lenis wheel profile; leave native touch scrolling intact and preserve reduced-motion fallback.

## Acceptance gates

Desktop and touch-mobile production Chromium checks must assert: hover movement and exact spring return; no project-card shear; no crack overlay in the DOM; no tesseract source object; the active metal-truss vortex; all 946 shards; live scene refraction; depth-write; the widened shard envelope; a passing production build; and no browser or WebGL errors.
