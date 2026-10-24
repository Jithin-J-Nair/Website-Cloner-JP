# Section Spec — Studio Leadership & Team Deck (`AboutTeamSection`)

## 1. Purpose
Introduce the worldwide human specialists behind KINETA's optical shaders, procedural 3D, motion choreography, and production code (`[[ 001 ]]` through `[[ 006 ]]`) via an interactive card deck inspired by Lusion's `[[ 001 ]]` specialist switcher.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: 12-column split. Left column (`Col 1–5`): studio people statement + active specialist large feature card (`[[ 001 ]]` bracketed monospaced index, procedural geometric portrait badge, bio, location). Right column (`Col 6–12`): interactive specialist index selector list + next/previous circular tactile controls.
- **Tablet (`768px–1023px`)**: Active spotlight card stacked cleanly above 2-column specialist selector pills.
- **Mobile (`<768px`)**: Swipeable / tappable specialist cards with crisp prev/next buttons (`Swipe or tap to inspect`).

## 3. Content (100% Original)
- **6 Specialists**:
  - `[[ 001 ]]` Kenji Takahashi — Co-Founder & Executive Creative Director (Osaka)
  - `[[ 002 ]]` Clara Vance — Co-Founder & Principal Graphics Engineer (Bristol)
  - `[[ 003 ]]` Mateo Silva — Technical Art Director (Lisbon)
  - `[[ 004 ]]` Sora Hayashi — Lead Motion & Interaction Designer (Tokyo)
  - `[[ 005 ]]` Nadia Koury — Spatial Audio & XR Prototyper (Montreal)
  - `[[ 006 ]]` Henrik Lind — Executive Producer (London)

## 4. Interactions
- Clicking, hovering, or stepping with prev/next arrows switches active specialist card, playing a soft harmonic note when audio is enabled and updating the generative accent glow.

## 5. Motion Timeline
- Spotlight card crossfades via Framer Motion micro-transition (`duration: 0.24s`, `ease: [0.22, 1, 0.36, 1]`).

## 6. WebGL Needs
- Runs cleanly on `ice` surface with subtle orbital background cluster motion (`about-sculpture`).

## 7. Accessibility (A11y)
- Full keyboard arrow/button navigation with explicit `aria-selected` tab/panel semantics.

## 8. Performance Budget
- Pure lightweight SVG + CSS generative emblem portraits (`0 KB` raster downloads).
