# Homepage cinematic review — 2026-11-04

## Homepage changes in the current branch

- Tightened and re-lit the eleven-piece hollow-connector hero, with a centered cobalt focal cluster, high-gloss clearcoat reflections, stronger radial pointer repulsion and a subtle tangential sweep. One critically-damped spring still returns every piece to its authored rest anchor.
- Rebuilt the reel accent as a scroll-drawn cobalt ribbon with a moving highlight, reverse-scroll retraction and a smooth hero-to-reel handoff.
- Reworked the astronaut tunnel around its captured metallic truss and cyan-to-magenta event-horizon core. The standalone opaque white tesseract remains removed; the new vortex uses nested transparent 4D-projected hypercube cages (four desktop layers / three mobile layers, each 16 vertices and 32 edges) to make the glass lattice surround the astronaut rather than obscure the flight path.
- Preserved the captured 946-piece glass breakup and its per-fragment position/quaternion sequence. The transforms are precomputed rigid-body animation samples; positions use frame-global, shape-preserving PCHIP tangents shared by adjacent cubic-Hermite segments, while orientations retain quaternion slerp. Added closed sidewalls to each captured piece from a per-shard convex-hull outline, reusing the exact same per-piece animation textures; the extruded side faces create actual geometric thickness and reflective beveled edges even when the source buffer duplicates front/back vertices.
- Added a live, high-resolution scene-color refraction buffer during the impact window. Desktop captures at 92% of the renderer's pixel dimensions, mobile at 58%, and fragments refract the current blue corridor/astronaut background using wavelength-dependent Snell IOR, thickness-aware path length, Schlick Fresnel, environment plus live-scene reflections, GGX microfacet specular and subtle Beer–Lambert absorption. No path-tracing claim is made.
- Removed the synthetic monitor spiderweb crack layer and the separate full-frame radial RGB-dispersion lens pass. The monitor frame stays clean until the captured glass fragments separate; refraction and dispersion remain local to those physical shard surfaces.
- Compressed the captured shard playback window to a shorter sub-second impact beat, retaining authored per-piece positions and quaternion interpolation. The astronaut breakout and depth descent now resolve earlier with stronger fall displacement; fragments fade cleanly after the impact.
- The main tunnel continues through captured metallic framing, a cyan/pink four-fold accretion vortex with a deformed 3D core and secondary filaments and the royal-blue arch corridor. Scroll-velocity shear on featured project cards was removed so the transition into the astronaut story reads as a clean scene change.

## Glassmorphism skill

The glassmorphism skill and its support assets are present under `.claude/skills/glassmorphism/`. The CI installer uses the published `pedronauck/skills` source. That skill is for glass UI surfaces and accessibility; the 3D refraction and shard pipeline are custom Three.js/GLSL work.

## Validation

Earlier baseline CI [#76](https://github.com/Jithin-J-Nair/Website-Cloner-JP/actions/runs/41685969826) passed lint, TypeScript, unit tests, production build, desktop and touch-mobile Chromium journeys, and the About wordmark browser regression on the previous implementation. The current redesign is gated by a fresh run on the new branch head.

The latest pass removes the crack overlay, white tesseract object and project-card scroll shear; strengthens captured shard reflection/spread; exposes the metal-truss vortex; tunes Lenis wheel easing; accelerates the astronaut's early and mid-fall descent; and amplifies mouse repulsion while retaining exact spring return. The complete implementation and browser evidence are recorded in the current branch's CI run. Automated validation is not a claim of pixel-identical parity with Lusion. The source's private rendering solver and ray-tracing pipeline are not available; this branch uses the included captured rigid-body shard buffers with real-time screen-space refraction and environment reflection.

## Skill principles applied

Before this refinement, the named references were reviewed for the parts relevant to this existing Next/Three.js project:
- UI/UX Pro Max: input affordances, responsive/reduced-motion behavior, animation quality and accessibility priorities.
- Impeccable: inspect the real render, preserve the incumbent design system, author one intentional motion sequence, and measure at actual shipping viewports.
- Hallmark: read the material, motion and quality gates; its full `/hallmark redesign` workflow was not invoked because this is a focused refinement of an existing visual system.
- Anthropic frontend-design: use the subject's material language and deliberate visual hierarchy rather than generic effects.
- Open Design: keep semantic visual rules consistent and document the design contract.
- Taste Skill: carry a strong visual idea through the scene and avoid disconnected decorative movement.
- Vercel Web Interface Guidelines and UI Skills: preserve native touch behavior, input-specific affordances, reduced motion and compositor-friendly transforms.
- GSAP React, ScrollTrigger, Timeline and Performance: scoped animation ownership, deterministic reverseable playheads, clear sequencing and avoidance of layout thrashing.
- design-md-chrome: reviewed as a design-system extraction/reference tool, not an animation or rendering engine.

## Physics and rendering boundary

The new vortex cages are original 4D-projected geometry with physically-based transmission/reflection material; the glass fragments are the repository's captured 946-piece rigid-body transform data, now closed into thin volumetric plates. The branch uses real-time screen-space refraction plus environment-map reflections and GGX highlights. It does not introduce a live Rapier/Ammo collision solver or path tracer, and it does not claim to reproduce Lusion's private physics/shader implementation.


## Follow-up refinement — 2026-11-04
- Broadened hero cursor influence to a multi-object magnetic field and increased its tangential/rotational response. The production browser now asserts that at least two individual connectors respond; the same critically-damped springs still restore their exact rest transforms.
- Removed the fixed 0.75-unit glass optical path. Refraction thickness is now derived from the measured convex-hull sidewall thickness after world scaling; live-scene reflection contribution increased while front/back transmission alpha and synthetic edge glow were reduced.
- Increased 4D glass-lattice edge/node legibility and environment reflections. It remains a transparent projected lattice, not the removed opaque white cube.
- Increased early/mid astronaut fall displacement while preserving the single 20-second score/scroll playhead and exact endpoint.
- Added unit and production-browser gates for multi-object pointer response, world-scaled glass thickness, live background reflection and the stronger gravity curve.


## Impact-frame visual refinement — 2026-11-04
- Increased the shard shader's view-angle Fresnel edge response, live scene-color reflection contribution (92%), and GGX edge highlights while preserving front-face transmission and measured thin-plate thickness.
- Widened the captured shard breakup envelope from 1.14× to 1.20× so adjacent fragments separate more legibly during the short impact beat.
- Increased the transparent vortex cage's crystal rod/node readability and environment response without adding an opaque white tesseract or hiding the astronaut.
- Added deterministic checks for the updated shader constants and breakup envelope. Production browser screenshots remain the visual acceptance evidence.
