# Homepage experience pass — 2026-11-03

## Implemented in the homepage branch
- Reframed the eleven 3D hollow connectors into a central desktop cluster with overlapping cobalt, white and black pieces; increased environmental intensity, lowered material roughness and restored a strong clearcoat reflection.
- Reworked pointer displacement and spring restitution so the cluster responds to cursor movement and returns to its central rest formation without a second sluggish lerp. The renderer preserves a low-rate idle float rather than continuously submitting full-rate frames.
- Added a scroll-drawn ribbon path with a moving highlight/runner and reverse-scroll retraction, plus a smooth hero-to-reel stage handoff.
- Extended the downstream astronaut sequence with a full vortex orbit: lateral/vertical spiral, body banking, faster inward shrink, tighter inverted tunnel twist, and pulsing pink vortex/bloom.
- Accelerated monitor crack growth and astronaut exit choreography. Captured glass fragments separate quickly and clear rather than hanging over the monitor; the glass window is a short score-beat segment.
- Synchronized the guided cinematic master clock to two 10-second score loops and shortened the fracture transient to a sub-second impact.
- Added desktop and touch-mobile Chromium checks, ribbon reverse assertions, hero hover/magnetic-return assertions, and timeline tests.

## Skill
The Glassmorphism skill is copied to `.claude/skills/glassmorphism/SKILL.md`. Its documented source is `pedronauck/skills`, not `compozy/compozy`. The skill is for glass UI surfaces and accessibility; it explicitly excludes 3D shard rendering, so the 3D glass effect remains in the captured Three.js shard pipeline.

## Validation
The first CI run failed at the skill-installer step because `compozy/compozy` contained no discoverable skill. The installer is now pointed at the skill's published source. The build and desktop/mobile browser checks have not yet run on the corrected commit; screenshot review is still required before visual acceptance.
