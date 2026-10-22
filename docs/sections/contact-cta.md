# Section Spec — Monumental Contact CTA (`ContactCtaSection`)

## 1. Purpose
Create an unmistakable high-energy crescendo before the architectural footer—inviting founders, agencies, and product leaders to launch a conversation directly via magnetic CTA pills over an optical dispersion tunnel stage.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: Rounded obsidian/cobalt container (`rounded-[40px]`) spanning `kn-container`, centered monumental two-line display headline (`READY TO BUILD SOMETHING UNFORGETTABLE?`), live studio availability indicator (`Q4 2026 / Q1 2027 COMMISSION SLOTS`), and dual magnetic action pills.
- **Tablet (`768px–1023px`)**: Centered layout with generous `py-24` breathing room.
- **Mobile (`<768px`)**: Stacked action pills (`w-full sm:w-auto`), high-impact legible typography.

## 3. Content (100% Original)
- **Status Badge**: `● BOOKING SELECT COMMISSIONS`
- **Headline**: `Ready to build what nobody has seen before?`
- **Subcopy**: `Tell us your wildest ambition—we bring the creative direction, optical shaders, and production engineering to ship it.`
- **CTAs**: `Start a Project` (`/contact`) + `projects@kineta.studio` copy trigger.

## 4. Interactions
- Magnetic attraction on primary CTA pill + one-click email clipboard copy confirmation (`COPIED TO CLIPBOARD ✓`).

## 5. Motion Timeline
- `SplitTextReveal` (`expo.out`, `0.85s`) + subtle optical glow breath.

## 6. WebGL Needs
- Activates `surface = "void"` and `webglMode = "dispersion-tunnel"` (`uDispersion → 0.58`).

## 7. Accessibility (A11y)
- Status copy announcement via `aria-live="polite"` when email address is copied to clipboard.

## 8. Performance Budget
- Pure compositor transforms + zero external assets.
