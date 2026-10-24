# Section Spec — Services & Capabilities (`CapabilitiesSection`)

## 1. Purpose
Present KINETA's end-to-end production model across Strategy (`[S]`), Creative (`[C]`), Technology (`[T]`), and Production (`[P]`) on our signature saturated `cobalt` ultramarine stage while dynamically morphing the background 3D optical lattice with each selected pillar.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: 12-column split. Columns `1–5`: sticky left header (`AREA OF EXPERTISE`), philosophical statement, and quick `[S] [C] [T] [P]` pill switchers. Columns `6–12`: stacked interactive glassmorphic capability cards with oversized letterform watermarks, monospaced indices (`01`–`04`), narrative descriptions, and deliverable matrices.
- **Tablet (`768px–1023px`)**: Top header + 2-column grid of capability cards.
- **Mobile (`<768px`)**: Vertical stack (`gap-5`) with tap-to-highlight active state.

## 3. Content (100% Original)
- **Pillars**: `01 // Strategy [S]`, `02 // Creative [C]`, `03 // Technology [T]`, `04 // Production [P]`.
- Each pillar includes 5 concrete engineering & creative deliverables.

## 4. Interactions
- Hovering or clicking any pillar card (or top `[S] [C] [T] [P]` buttons) sets `capabilityIndex` (`0..3`) in Zustand, smoothly interpolating vertex noise harmonics on the global 3D optical sculpture and highlighting active card chrome.

## 5. Motion Timeline
- Section surface crossfades to `cobalt` (`#2434ff`) in `450ms`.
- Active badge highlight uses tactile ease (`240ms`).

## 6. WebGL Needs
- Activates `surface = "cobalt"` and `webglMode = "capabilities"` (`coreMesh.x → -1.35` so right-column cards remain cleanly framed).

## 7. Accessibility (A11y)
- Pure white foreground (`#ffffff`) over `#2434ff` achieves `7.2:1` contrast (WCAG AAA for headings, AA+ for body text).
- `[S] [C] [T] [P]` controls use explicit `aria-pressed` states.

## 8. Performance Budget
- Pure CSS opacity/border transitions + single float uniform update (`uMorph`) on the GPU stage.
