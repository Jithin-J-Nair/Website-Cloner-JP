# Website-Cloner-JP — Design System

## Product and visual direction
An immersive creative-studio portfolio. The homepage is an **Experience** surface: the visitor enters a visual world before reading. Preserve the established Lusion-inspired identity, content, page order and interactions. Motion is part of the medium, not decoration.

## Foundations
- Surfaces: off-white `#F0F1FA`, pure void `#000000`, elevated void `#121416`, cobalt `#1A2FFB`, deep blue `#071BDF`.
- Supporting colors: dark blue-grey `#2B2E3A`, white `#FFFFFF`, green `#C1FF00`, red `#FF4C41`, violet `#8832F7`.
- Typography: `LusionSansCalibrated` / Instrument Sans for display and body; IBM Plex Mono for technical labels.
- Layout: 12-column desktop grid, 2vw gutters; 6-column tablet/mobile grid, 4vw gutters; max content width 1760px; shared radius 20px desktop and 10px mobile.
- `src/app/globals.css` is the source of truth for palette, typography, layout and timing tokens. Do not add a competing token set.

## Motion contract
- One scroll authority: Lenis synchronised to the existing GSAP ticker and ScrollTrigger bridge. Smooth wheel duration is 0.92s; touch remains native.
- The astronaut sequence uses one deterministic scroll/playback coordinate; reverse scroll must reproduce prior states. Do not add a second playhead or a competing animation loop.
- The connector hero uses a centered magnetic cluster, pointer forces and critically damped springs. On pointer leave/cancel it returns to exact rest. Hover is not the only interaction.
- The cobalt ribbon is a scroll-scrubbed SVG path: forward scroll draws, reverse scroll retracts.
- The tunnel retains captured metallic truss assets and a cyan-to-magenta four-fold vortex core. Do not reintroduce the white tesseract overlay, synthetic monitor cracks, full-frame RGB lens glitch or project-card scroll shear.
- Astronaut fall and glass fragments share the scene coordinate. The 946-piece/15-frame captured fragment trajectory is interpolated with shape-preserving PCHIP positions and quaternion slerp. Do not describe it as a live rigid-body solver.
- Glass is a thin optical material: wavelength-dependent Snell refraction, Fresnel reflection, current-scene screen reflection, environment reflection and GGX microfacet highlights. Dispersion stays local to shard facets.
- Every motion has a reduced-motion alternative. Reduced motion reduces spatial movement while preserving content/state clarity.

## Quality gates
- Desktop 1440x900 and touch mobile 390x844; compare the 1536x810 viewport against supplied video when relevant.
- Capture hero rest/hover/return; ribbon draw/reverse; vortex entry/peak; blue corridor; glass approach/shatter/post-shatter.
- Confirm no failed assets, console exceptions or WebGL errors. Inspect screenshots; telemetry alone is not visual acceptance.
- Batch DOM reads before writes; keep motion on transforms/opacity; bound bloom and render-target costs; pause hidden/offscreen renderers; keep the 4K pixel budget.
- Maintain visible keyboard focus, reduced motion, touch-native scroll, no hover-only interaction and no mobile horizontal overflow.

## Source mapping
- Tokens: `src/app/globals.css`.
- Smooth scroll: `src/components/foundation/SmoothScrollProvider.tsx`.
- Hero: `src/components/home/HeroCrossesStage.tsx`, `src/lib/home-motion.ts`.
- Ribbon/hero handoff: `src/components/home/HomePageView.tsx`.
- Astronaut/truss/glass scene: `src/components/home/GoalTunnelSection.tsx`, `src/components/home/GoalDownstreamScenes.ts`.
