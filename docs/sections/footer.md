# Section Spec — Architectural Footer & Next-Page Portal (`StudioFooter`)

## 1. Purpose
Ground every route with complete studio directory metadata, newsletter dispatch subscription, direct channels, and the signature continuous-journey **Overscroll Next-Page Portal** that connects `/` → `/about` → `/work` → `/labs` → `/contact` → `/` into a seamless loop.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: 4-column architectural directory (`Addresses`, `Navigation & Socials`, `Direct Inquiries`, `Lab Newsletter`), colophon row, and full-width bottom `Keep Scrolling to Continue → [Next Chapter]` interactive charge portal.
- **Tablet (`768px–1023px`)**: 2×2 grid directory + full-width Next-Page portal card.
- **Mobile (`<768px`)**: Clean single-column stack (`gap-8`) + tap-friendly Next-Page card (`min-h-[84px]`).

## 3. Content (100% Original)
- **Studios**: Osaka (`Nakanoshima, Kita-ku, Osaka 530-0005`) & Bristol (`14 King Street, Bristol BS1 4EF`).
- **Emails**: `hello@kineta.studio` · `projects@kineta.studio`.
- **Colophon**: `© 2026 KINETA® Creative Studio` · `R&D: labs.kineta.studio`.

## 4. Interactions
- Overscrolling downward (`wheel` deltaY > 0 while within `32px` of document bottom) charges the horizontal progress indicator (`0% → 100%`); hitting `100%` (or clicking the portal directly) fires the route transition curtain to `nextHref`.
- Gentle decay drains charge back to `0%` when the user stops scrolling, preventing accidental triggers.

## 5. Motion Timeline
- Charge bar uses GPU `transform: scaleX(...)` (`0 → 1`) with smooth decay loop.

## 6. WebGL Needs
- Continues seamlessly over `void` surface backdrop.

## 7. Accessibility (A11y)
- Semantic `<footer>` landmark (`contentinfo`), labeled newsletter input, and explicit keyboard-accessible `TransitionLink` on the Next-Page card. Overscroll auto-trigger disables automatically under `prefers-reduced-motion`.

## 8. Performance Budget
- Passive `wheel` listener active only at bottom boundary (`CLS = 0.00`).
