# About / Section 01 — Cinematic opening

Status: implementation audit and visual acceptance baseline  
Route scope: `/about` only  
Reference: `https://lusion.co/about/` and the supplied 37.6-second screen recording  
Capture viewport in recording: approximately 1600 × 900 browser content

## Observed sequence

| Recording time | Visible state | Required visual behavior |
|---:|---|---|
| 0.0–3.4 s | Monumental solid-white LUSION wordmark over a suspended silver particle mass | Dense depth-layered grains; continuous orbital drift; scattered foreground bokeh; no flat image or synchronized pulsing |
| 6.8 s | Particle cloud contracts into a distant vertical formation above a crater basin | Camera pullback reveals the horizon, sculpted ridges, floor detail and small human scale reference |
| 10.2 s | Wide basin composition | Keep the overhead particle source centered; preserve the broad, low-contrast black sky and silver terrain |
| 13.6 s | Narrow overhead emitter and light shaft | Emitter blooms while the basin falls into shadow; avoid a hard-edged laser or a uniformly bright floor |
| 17.0 s | Black editorial transition with glowing topographic linework | Retire the landscape/wordmark layers cleanly and hand off to the word-by-word narrative |

The recording also shows the fixed Lusion wordmark/header controls and five registration crosses throughout the opening.

## Existing implementation map

- `src/components/pages/AboutPageView.tsx`
  - `AboutWhoExperience` owns the sticky full-viewport stage, WebGL lifecycle, scroll playhead, overlays and fallback.
  - The opening wordmark is the SVG text under `[data-about-opening-wordmark]`.
  - The curved transition is `[data-about-wordmark-sweep]`.
  - The manifesto and narrative are scroll-driven DOM layers.
- `src/components/three/AboutPlume.ts`
  - Seeded analytic particle trajectories are evaluated in the vertex shader.
  - Instanced camera-facing spherical grains provide depth, lighting and foreground bokeh.
  - A separate fine-dust point layer increases density without per-frame CPU particle updates.
  - Pointer repulsion is evaluated in the shader.
- `src/components/three/AboutTerrain.ts`
  - Procedural terrain height/material for the crater basin.
- `src/lib/about-scene-motion.ts`
  - Pure, reversible scroll-space camera and wordmark poses.
- `src/app/globals.css`
  - Calibrated open-font substitute, global grid/padding, monochrome base and motion tokens.

## Important fidelity boundary

The recording is visual evidence, not source code. The current particle field is an authored analytic reconstruction; it is not evidence of Lusion's private simulation, force field, spline, original particle seed, or exact timing constants. Likewise, the local terrain and volumetric beam are procedural substitutes. Do not describe them as recovered source physics or pixel-perfect until same-viewport local/reference captures have been compared.

## Section 01 acceptance checklist

- [ ] Compare initial, mid-wordmark and settled wordmark states at the recording's viewport.
- [ ] Compare the particle cloud at 0.0 s and 3.4 s for silhouette, density, size distribution, depth and motion.
- [ ] Compare the 6.8 s and 10.2 s basin frames for horizon, ridge profile, figure scale and floor brightness.
- [ ] Compare the 13.6 s emitter/beam for bloom radius, shaft width, falloff and surrounding darkness.
- [ ] Verify scroll reversal restores the same poses without jumps.
- [ ] Verify pointer movement only disturbs nearby grains and the cloud returns smoothly to rest.
- [ ] Verify reduced-motion and WebGL-loss fallbacks retain readable About content.
- [ ] Check desktop, mobile and ultrawide widths for clipping, scroll overflow and text overlap.
- [ ] Run the existing About capture, wordmark, accessibility and production checks after local integration.

## Scope guard

Do not modify the home route, project routes, shared global navigation behavior, or unrelated sections while completing this stage. Shared styles may only be changed when the effect is demonstrably limited to the About opening.
