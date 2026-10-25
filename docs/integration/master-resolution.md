# PR #12: deliberate master integration

Date: 2026-10-25. Branch remains `arena/6d83ea00-website-cloner-jp`; PR base remains `master`. This is a merge **of master into the PR branch**, not a merge of the PR into master.

- Verified entry: `7c81b4415fc3af993aaf44ddbcefdc14db4e12c8`.
- Target fetched again before commit: `1bc32be7de206ded61be0bba4942feeb3c159bba`.
- Exact merge base: `3ec20e525669f6778278940c7d4d052f65630f44`.
- `git merge --no-commit --no-ff origin/master` produced **27 textual conflicts**. Each decision below was reviewed against both parent blobs. No reset, force push or blanket ours/theirs merge strategy was used.
- Existing snapshot safety stash retained, not reapplied: its files were verified identical to the PR entry before fast-forwarding the original shallow checkout.

## Conflict decisions

| Conflicted path | Semantic resolution |
| --- | --- |
| `README.md` | Keep canonical runtime instructions; append links to upstream reference/experimental work. Preserve full upstream README separately. |
| `docs/sections/hero.md` | Retain implemented captured-asset behavior; preserve upstream specification separately, not as fresh verification. |
| `docs/validation/parity-audit/Executive_Completion_Report.md` | Historical evidence must not be replaced by a competing historical completion claim. Preserve both, latest mission report governs. |
| `package.json` | Retain motion/unit commands which upstream removes; dependency versions upgraded separately against audit. |
| `scripts/qa-verify.mjs` | Retain 50-asset delivery gates removed upstream; no acceptance weakening. |
| `src/app/contact/page.tsx` | Preserve canonical contact redirect rather than activating unrelated KINETA planner. |
| `src/app/design-system/page.tsx` | Preserve canonical 404 policy rather than exposing unrelated demo. |
| `src/app/globals.css` | Union: keep existing accessibility/global rules and append upstream spotlight CSS. |
| `src/app/labs/page.tsx` | Preserve verified external Lusion labs navigation. |
| `src/app/work/[slug]/page.tsx` | Preserve canonical project aliases rather than unrelated case-study data. |
| `src/app/work/page.tsx` | Preserve canonical projects redirect. |
| `src/components/foundation/StudioShell.tsx` | Keep one transition/scene owner; upstream adds a second transition provider and generic stage on captured routes. |
| `src/components/home/AstronautEmergenceAssets.ts` | Preserve captured DQ/root/pose decoding removed upstream; trajectory and pose acceptance depend on it. |
| `src/components/home/FeaturedProjectCard.tsx` | Preserve freshly verified input/reduced reset, captured assets and shared scroll transforms. |
| `src/components/home/GoalDownstreamScenes.ts` | Preserve captured lattice, glass frame sampler and sole authored path; upstream experimental primitives remain as separate files. |
| `src/components/home/GoalTunnelSection.tsx` | Preserve elapsed clock, native autoplay, controls, captured shaders/poses and failure cleanup; upstream removes these contracts. |
| `src/components/home/HeroCrossesStage.tsx` | Preserve bounded springs and exact reduced rest; no unbounded interaction rewrite. |
| `src/components/home/HomePageView.tsx` | Preserve shared reversible reveal/reel sampler and offscreen video policy removed upstream. |
| `src/components/pages/AboutPageView.tsx` | Retain real captured team geometry and async disposal, rather than procedural substitution. |
| `src/components/pages/LusionProjectDetailView.tsx` | Retain authentic still fallback rather than procedural reel replacement. |
| `src/components/pages/WorkArchiveView.tsx` | Keep canonical alias; upstream alternate archive preserved separately as an inactive component. |
| `src/components/sections/ContactCtaSection.tsx` | Upstream differs ONLY by removing the new fallback CSS and reduced scroll fixes; retain those repairs. |
| `src/components/studio/ProjectCard.tsx` | Preserve canonical media/routing; upstream alternate card implementation retained separately. |
| `src/components/studio/TransitionLink.tsx` | Preserve one transition owner; upstream provider would compete with existing curtain. |
| `src/components/ui/GlowCard.tsx` | Integrate upstream shared pointer controller and expanded props; isolated reusable UI. |
| `src/components/ui/ShaderAnimation.tsx` | Integrate upstream reusable animation implementation; inspect lint/type/cleanup. |
| `src/data/reference/index.ts` | Preserve canonical captured metadata and path contracts used by asset QA. |

## Preservation and follow-through

Both parents and their original source remain in merge history. Master-only reference images, its timeline, `docs/lusion-fix`, capture/comparison scripts, `TransitionProvider` and experimental three modules are retained. Full alternate README/hero specification/historical completion prose is retained under `docs/integration/upstream-*`; it is **not** fresh validation evidence. The alternate archive/card implementations are retained as `UpstreamWorkArchiveView` and `UpstreamProjectCard`, not activated on canonical routes.

Canonical Contact CTA differs from target only in its prior fallback spacing/background and two preference-aware footer scroll controls; those repairs are retained verbatim. The sole cinematic playhead, authored 22.5-second path, captured poses/assets, elapsed-time repair, reduced motion and teardown contracts remain intact. The original autonomous acceptance script is unchanged.

The reusable upstream transition provider is deliberately **not wired into StudioShell**: it would introduce a competing transition owner. Its declaration-order/hook error is repaired with a stable callback and an external store completion subscription; its timeout/frame handles are cleaned up on unmount. This is compilation/lint validation, not a claim that this inactive alternate provider is production-integrated. The upstream side-by-side script was a no-op; it now pairs same-named images, preserves aspect ratio and fails explicitly on absent references. It does not invent a visual parity score.

Security dependency changes and diagnostic phase labeling are follow-up work, not reasons to choose one parent's scene implementation. The current acceptance status is recorded in [mission-repair.md](../validation/mission-repair.md); resolving textual conflicts is not cinematic acceptance.
