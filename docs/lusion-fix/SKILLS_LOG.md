# Skills Log

## CloudAI-X/threejs-skills
- **Read**: All threejs skills (animation, performance, geometry, etc.)
- **Rules Extracted**: Use one renderer per canvas, `pixelRatio <= 2`, dispose objects (geometries, materials, textures) on unmount, use instanced meshes where possible, pause rendering when off-screen.
- **Application**: Applied globally in the WebGL reconstruction across `src/components/home/GoalTunnelSection.tsx` and `HeroCrossesStage.tsx`.

## emilkowalski/skills
- **Read**: Animation and UI/UX performance best practices.
- **Rules Extracted**: Match animation timings exactly, use spring physics for natural motion where applicable, ensure smooth transitions without layout shifts.
- **Application**: Applied to the click-open shader transitions and GSAP timeline syncing in `GoalTunnelSection.tsx`.

## Leonxlnx/taste-skill (design-taste-frontend)
- **Read**: High-end visual design and UI consistency.
- **Rules Extracted**: Precise padding/margins, typographic hierarchy, exact color matches (e.g., `#13151d`, `#1a22e0`), clean border-radius implementation.
- **Application**: Validated typography and contrast in `StudioShell.tsx`, `HeroCrossesStage.tsx`, and `FeaturedProjectCard.tsx`.

## nextlevelbuilder/ui-ux-pro-max-skill
- **Read**: UI/UX pro max fundamentals.
- **Rules Extracted**: Emphasize subtle hover states, clean focus rings for accessibility, zero empty layout jumps, seamless preloading.
- **Application**: Implemented the shader click-open overlay and smooth viewport entry reveals in the main layout.
