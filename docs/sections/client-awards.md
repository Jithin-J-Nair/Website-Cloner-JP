# Section Spec — Client Partners & Recognition (`ClientsAwardsSection`)

## 1. Purpose
Provide unmistakable social proof through two complementary architectural devices on a clean light `ice` surface: dual counter-rotating infinite partner marquees (using 12 original geometric studio marks) and a tabular 64-honor international Awards Ledger (`Awwwards`, `The FWA`, `Webby & D&AD`, `Global Craft`).

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: Full-bleed edge-masked dual marquee tracks (`gap-4`), followed by a 12-column split Awards Ledger where Columns `1–4` display `RECOGNITION [64]` and Columns `5–12` present 4 structured jury groups with `002 / 003 / 014` tabular monospaced counts.
- **Tablet (`768px–1023px`)**: Dual marquee tracks + stacked full-width jury groups.
- **Mobile (`<768px`)**: Compact marquee pills + clean single-column tabular award rows.

## 3. Content (100% Original)
- **Partners**: 12 original engineering & cultural brands (`Kestrel Aero`, `Meridian Cloud`, `Hyperion GT`, `Nordic Vault`, `Resonance Lab`, `Kansai Optics`, `Vanguard Audio`, `Solstice AI`, `Polestar Lab`, `Atelier Zero`, `Helios Robotics`, `Forma Spatial`).
- **Awards**: `64` cumulative international digital honors across 4 jury blocks.

## 4. Interactions
- Hovering or keyboard-focusing inside the marquee container pauses motion smoothly for comfortable reading.
- Hovering an award row highlights its monospaced index badge in electric cobalt (`#2434ff`).

## 5. Motion Timeline
- Continuous GPU `translate3d(-50%, 0, 0)` linear keyframe (`36s` forward row, `40s` reverse row).
- Stopped immediately under `prefers-reduced-motion: reduce`.

## 6. WebGL Needs
- Transitions back cleanly to `surface = "ice"` and `webglMode = "about-sculpture"`.

## 7. Accessibility (A11y)
- Duplicated marquee clones carry `aria-hidden="true"` so screen readers read each partner name once without repetition.

## 8. Performance Budget
- Pure compositor `transform` animation; zero JS scroll listeners or layout reflows.
