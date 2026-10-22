# Section Spec — Featured Work Showcase (`FeaturedWorkSection`)

## 1. Purpose
Transition visitors from bright architectural ice into KINETA's dramatic obsidian gallery (`void`), presenting our 6 flagship case studies in an asymmetric staggered 2-column showcase where every project frame runs its own live interactive procedural shader/optical canvas.

## 2. Layout Across Breakpoints
- **Desktop (`≥1024px`)**: Full-width split header (`FEATURED` / `WORK` + superscript `[06]`) over a 2-column staggered layout (`gap-x-10 gap-y-20`), where odd cards sit on the baseline and even cards drop by `mt-24` with opposing subtle scroll parallax (`±28px`). Centered oversized `SEE ALL PROJECTS` pill closes the section.
- **Tablet (`768px–1023px`)**: 2-column grid with moderate vertical offset (`mt-12`), clean card titles & discipline tags directly beneath each viewport.
- **Mobile (`<768px`)**: Single-column stack (`gap-12`), zero parallax offset, full `4/3` card aspect ratio, instant tap response.

## 3. Content (100% Original)
- **Heading**: `FEATURED WORK` (`06` featured case studies)
- **Subtitle**: `Selected interactive worlds, optical campaigns, and real-time systems built for ambitious partners.`
- **Cards**: `Monolith One`, `Kestrel Dynamics`, `Meridian Compute`, `Sylva: Living Archive`, `Hyperion Aero Study`, `Aether Spatial`
- **Footer CTA**: `See All Projects` (`/work`)

## 4. Interactions
- Hovering a card scales the procedural viewport smoothly (`1.0 → 1.04`), lights up the chromatic border glow in that project's signature accent color, updates `projectAccentHex` in Zustand so the background 3D stage subtly echoes the hovered project's light color, and morphs the cursor into `VIEW CASE ↗`.
- Clicking navigates smoothly via the page transition curtain to `/work/[slug]`.

## 5. Motion Timeline
- Section header: `SplitTextReveal` (`expo.out`, `0.85s`).
- Cards: Entrance fade/rise (`y: 36 → 0`, `expo.out`) + scrubbed desktop column differential (`-24px` vs `+24px`).

## 6. WebGL Needs
- Sets `surface = "void"` and `webglMode = "work-gallery"` (expands background sphere cluster radius to `1.65` and softens foreground glare behind dark gallery cards).

## 7. Accessibility (A11y)
- Each project card wraps a single clean semantic `<a>` (`TransitionLink`) with descriptive title, client, year, and discipline metadata readable by screen readers without duplicate focus stops.

## 8. Performance Budget
- Each `ProceduralMediaCanvas` auto-pauses off-screen via `IntersectionObserver`, capping active 2D canvas loops to only currently visible cards (`≤ 4` at once).
