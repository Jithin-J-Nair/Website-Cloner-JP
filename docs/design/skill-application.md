# Applied design and engineering guidance

The user-requested public skill sources have been studied and their relevant guidance vendored under `.claude/skills/` for future project sessions:

- UI/UX Pro Max: accessibility, touch interaction, responsive layout, performance budgets and meaningful motion.
- Impeccable: preserve the incumbent visual world, review the rendered result, keep one focal motion thesis, and respect reduced motion.
- Hallmark: used as a quality/audit reference for this existing design; no unsolicited replacement of the established layout or copy.
- Anthropic frontend-design: subject-specific art direction and avoiding generic visual tropes.
- Taste: continuous scroll scenes and one coherent motion language rather than repeated generic reveals.
- Vercel Web Design Guidelines: accessibility, layout and interaction review.
- UI Skills: avoid layout thrashing, scroll polling and mixed animation systems.
- GSAP React/ScrollTrigger/Timeline/Performance: lifecycle cleanup, scroll/playhead synchronization, transform-first motion, no redundant tweens.
- OpenDesign is a collaborative design-agent workspace, not one standalone frontend skill. Its design-system handoff model was reviewed.
- design-md-chrome is a Chrome extension. This environment cannot install a browser extension, so the `DESIGN.md` file is authored from the actual source CSS and components; no automated browser extraction is claimed.

The project keeps its existing Lenis + GSAP ticker + custom Three.js pipeline. The skill references do not justify introducing another scroll engine or animation loop.
