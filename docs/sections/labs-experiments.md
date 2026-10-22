# Section Spec — Labs & R&D Experiments (`LabsSection`)

## 1. Purpose
Showcase KINETA's internal R&D playground (`labs.kineta.studio`) right on the home flow—proving our optical shader, vector field, and wireframe tensegrity capabilities live on the visitor's own GPU and inviting deep experimentation on `/labs`.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: Opens with centered high-impact studio conviction statement (`WE DO NOT SHIP TEMPLATES. WE ENGINEER NEW VISUAL LANGUAGES.`), followed by a 4-column interactive experiment card deck (`EXP // 001` through `EXP // 004`) plus live uniform readout bar.
- **Tablet (`768px–1023px`)**: 2×2 experiment grid with active shader preset indicator.
- **Mobile (`<768px`)**: Stacked single-column cards (`gap-4`) with one-tap preset activation.

## 3. Content (100% Original)
- **Conviction Headline**: `Where bold imagination meets GPU physics.`
- **Experiments**:
  1. `EXP // 001` — Cauchy Optical Glass Core
  2. `EXP // 002` — Divergence-Free Curl Swarm
  3. `EXP // 003` — Harmonic Wave Cloth Matrix
  4. `EXP // 004` — Geodesic Tensegrity Cage
- **Primary Action**: `Open Full Shader Sandbox` (`/labs`)

## 4. Interactions
- Clicking or hovering any experiment card immediately applies its `ior`, `dispersion`, `turbulence`, `spring`, and `wireframe` uniforms to the live background WebGL stage so the entire viewport visibly morphs to match that study!

## 5. Motion Timeline
- Headline: `SplitTextReveal` (`expo.out`, `0.85s`).
- Uniform transition: `THREE.MathUtils.lerp(..., 0.08)` smooth 60–120Hz shader interpolation.

## 6. WebGL Needs
- Runs on `surface = "void"` with `webglMode = "labs-sandbox"` so `labUniforms` drive the live GPU stage directly.

## 7. Accessibility (A11y)
- Cards are keyboard-operable buttons with `aria-pressed` state + clear plain-English summary of each shader phenomenon.

## 8. Performance Budget
- Zero extra WebGL contexts created—drives the existing root R3F stage via uniform updates (`0 KB` extra memory).
