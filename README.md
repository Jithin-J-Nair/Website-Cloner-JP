# Lusion Website Reconstruction

A clean-room reconstruction of the publicly observable Lusion website at [lusion.co](https://lusion.co/), built with Next.js App Router, TypeScript, React Three Fiber/Three.js, GLSL, GSAP, Lenis, and Framer Motion.

## Source of truth

The canonical captured reference data lives in `src/data/reference/lusion-ground-truth.json` and is exposed through `src/data/reference/index.ts`. It records routes, global chrome, home/about/project content, visual tokens, asset paths, and project metadata from the public reference capture.

When local components conflict with that data, prefer the captured Lusion reference—not the earlier KINETA demo content or speculative visual effects. Do not infer an effect from a component name; validate it against the captured atlas and, where possible, the live reference.

The homepage reference data identifies the hero model as `/assets/models/home/cross.buf` (with a low-detail variant), not a balloon model. The home section order is hero, reel, featured projects, goal/tunnel, closing CTA, footer, and next-page navigation. The projects archive and project detail pages should use the Lusion data in `src/data/reference`, not the unrelated sample case studies in `src/data/studio.ts`.

## Development

Requires Node.js 20.9 or newer (Next.js 16.4.3); validation uses Node.js 22.

```bash
npm install --legacy-peer-deps
npm run dev
```

## Validation

```bash
npm run lint
npm run typecheck
npm run build
npm run qa
```

A passing build validates compilation and static generation; it does not establish visual parity. Visual acceptance requires comparing the running local site with the reference at matching viewport sizes and interaction states.

## Important limitations

Lusion's complete production source and some original assets are not available in this repository. Use captured public reference data and assets that are actually present. Where a source asset cannot be obtained, document the substitution instead of claiming a pixel-perfect match. Do not commit credentials, environment files, or unrelated changes.

## Preserved upstream work

The master integration retains its reference timeline and side-by-side captures under `reference/`, design proposals under `docs/lusion-fix/`, and experimental Three modules without introducing a competing production playhead. Original upstream notes are preserved in `docs/integration/`; current acceptance is documented in `docs/validation/mission-repair.md`.
