# Section Spec — Intro Statement & Showreel Portal (`IntroStatementSection`)

## 1. Purpose
Bridge the monumental hero statement into KINETA's multidisciplinary craft story and invite visitors into our 2026 interactive Showreel through a scroll-scrubbed expanding portal window.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: 12-column grid. Columns `1–4`: monospaced eyebrow (`01 // OUR DISCIPLINE`). Columns `5–12`: split display lead statement, editorial narrative copy, and `OUR APPROACH` magnetic CTA pill (`→ /about`). Directly beneath sits a centered rounded viewport (`aspect-[16/9]`) scrubbing from `scale(0.86)` (`border-radius: 36px`) up to `scale(1.0)` (`border-radius: 20px`) as the user scrolls.
- **Tablet (`768px–1023px`)**: Stacked top eyebrow + full-width lead statement; showreel portal scrubs smoothly from `0.92` to `1.0`.
- **Mobile (`<768px`)**: Clean single column (`gap-6`); `16/10` showreel viewport with persistent visible `PLAY REEL` button for touch accessibility.

## 3. Content (100% Original)
- **Eyebrow**: `• BOLD CONCEPTS, ENGINEERED ALIVE`
- **Headline**: `We unite art direction, custom shaders, 3D simulation, and resilient web code into seamless digital worlds.`
- **Body**: `From flagship product launches to spatial brand ecosystems, every frame is built from first principles—designed to spark wonder and engineered to run effortlessly across every screen.`
- **CTAs**: `Our Approach` (`/about`) + interactive Showreel portal (`Play 2026 Showreel`).

## 4. Interactions
- Scrolling scrubs the showreel frame's GPU scale (`scale3d`) from `0.86` to `1.0`.
- Hovering the showreel viewport activates the custom cursor badge `PLAY REEL ▶` and boosts procedural optical glow.
- Clicking opens the fullscreen interactive 4-chapter Showreel modal.

## 5. Motion Timeline
- Lead statement: `SplitTextReveal` (`top 85%`, `expo.out`, `0.85s`).
- Showreel frame: `ScrollTrigger` scrub (`start: "top 88%"`, `end: "top 20%"`, `scrub: 0.5`).

## 6. WebGL Needs
- Keeps `surface = "ice"` while transitioning `webglMode = "showreel"` and running a live interactive `ProceduralMediaCanvas` inside the expanding theater frame.

## 7. Accessibility (A11y)
- Showreel portal is a keyboard-focusable `<button>` with `aria-label="Open KINETA 2026 Interactive Showreel"`.
- Full bypass of scroll scale scrub when `prefers-reduced-motion` is active.

## 8. Performance Budget
- Animates exclusively `transform: scale3d(...)` on GPU compositor layer (`CLS = 0.00`, zero layout reflow).
