# Reference Specification — Lusion Home Hero

## Evidence source

The primary structured capture is `src/data/reference/lusion-ground-truth.json`, exposed through `src/data/reference/index.ts`. Its `home.hero` record specifies:

- Headline: “We create 3D visual storytelling and interactive web experiences that help brands stand out”
- Scroll prompt: “scroll to explore”
- High-detail scene asset: `/assets/models/home/cross.buf`
- Low-detail scene asset: `/assets/models/home/cross_ld.buf`
- High-detail matcap: `/assets/textures/home/matcap.exr`
- Low-detail matcap: `/assets/textures/home/matcap_ld.exr`

This evidence does **not** support replacing the hero with balloons, an astronaut, a tesseract, a generic glass sphere swarm, or a generic dashboard. Keep the scene tied to the captured cross-model reference.

## Structure

- Full viewport hero section with the headline positioned in the reference grid.
- Rounded WebGL visual container beneath the headline.
- Bottom crosshair row and centered scroll prompt.
- Fixed global Lusion header above the page content.
- Responsive 12-column desktop / 6-column mobile grid and the captured spacing tokens in `src/app/globals.css`.

## Implementation rules

1. Read the reference JSON and the corresponding screenshot-atlas chapter before changing the scene.
2. Use the captured `.buf` model and matcap assets if they are present and their format is supported by the existing loader.
3. If a captured binary asset is missing or cannot be decoded, document the exact limitation and build the closest evidence-based replacement. Do not describe a replacement as the original asset.
4. Match object count, framing, silhouette, materials, lighting, camera, motion, and timing against reference captures. Do not invent numerical timings or camera values.
5. Preserve the existing accessible headline and scroll affordance, and respect reduced-motion behavior.
6. Validate at 1440×900 and 390×844 against matching reference states. A successful TypeScript/build check is not visual verification.

## Current implementation review targets

- `src/components/home/HomePageView.tsx`
- `src/components/home/HeroCrossesStage.tsx`
- `src/components/home/HollowCrossGeometry.tsx`
- `src/data/reference/lusion-ground-truth.json`
- `public/assets/models/home/`
- `public/assets/textures/home/`

Do not reintroduce generic `ShaderAnimation`, `GlowCard`, balloon, or astronaut effects unless the captured reference evidence explicitly requires them.
