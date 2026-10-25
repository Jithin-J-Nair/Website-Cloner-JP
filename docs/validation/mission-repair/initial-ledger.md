# Cinematic repair mission — evidence ledger

Date: 2026-10-25. Branch: `arena/6d83ea00-website-cloner-jp`. Baseline: `e69e401306d46f79ee5b3b81ee5ba1f3b75ed30d`. No pre-existing uncommitted work at entry.

## Stage A: repository baseline

- PR #12 is OPEN, not merged; head matches this branch; base is `master`.
- Fresh GitHub inspection: `mergeable=CONFLICTING`, `mergeStateStatus=DIRTY`, no reported CI checks, reviews, general comments or inline review comments.
- Unshallowed history before evaluating ancestry. The common ancestor is `3ec20e5`; master has the independently squashed `1bc32be`, while this branch preserves the later implementation history. A non-mutating `git merge-tree --write-tree HEAD origin/master` reports 26 conflicted paths, including the shared shell, homepage, cinematic source, QA and package manifest. No master content has been reset, overwritten or merged into master.
- Baseline motion units, six goal unit groups, ESLint, TypeScript and production build ran successfully. ESLint reports the existing warnings in `AboutPageView.tsx` and `LusionProjectDetailView.tsx`, not zero warnings.
- Framework/runtime discovered from installed files and package scripts: Next 16.3.5, React 19.2.4, Three 0.186.1, GSAP 3.15, Lenis 1.3.27, Framer Motion 14.5.0. The cinematic uses imperative Three/GLSL and a single document/playback owner; this mission does not introduce another renderer or scroll system.
- Ground truth inspected: `src/data/reference/lusion-ground-truth.json`, schema 1.0.0, capture date 2026-09-23, 22 canonical routes. It is a content/layout aid, not proof of current live-reference timing. No expectations have been rewritten.

## Requirement matrix — initial audit (updated after repair below)

Statuses describe the evidence, not whether a commit exists. Baseline browser capture is in progress; hypotheses are explicitly distinguished from reproduced findings.

| Requirement | Current evidence | Status | Root cause / finding | Planned fix | Verification |
| --- | --- | --- | --- | --- | --- |
| Cinematic sunlight / lens glare | Source-aware analytic shader, FOV/occlusion units pass freshly; prior static captures are historical | Partial | Finite-source/sphere approximation, not exact light transport; current motion not yet reviewed | Inspect fresh moving camera sweep; only change reproduced artifacts/cost | Browser source/camera samples, frame sequence, portrait/UHD and GL errors |
| Tesseract quality | Merged nested glazing and captured lattice inspected; no fresh visual judgement yet | Not tested | No demonstrated new defect yet | Inspect depth/edges in forward and reverse samples | Recorded scene sweep, desktop/mobile captures and GL checks |
| Astronaut trajectory | Shared 22.5 s clock, `.28t+.72t²` descent, continuous blue travel; units pass | Partial | Source caps playback dt at 0.25 s, a suspected cause of software-rendered slow motion | Measure timing, preserve one clock; separate elapsed playback time from interpolation limits if confirmed | Frame-rate/elapsed-time units and autonomous browser run, pause/visibility/resize |
| Hero hover | Bounded internal springs and cancellation inspected | Not tested | No new defect established | Exercise entry, move, exit, cancellation/re-entry and rest | Exact rest, idle render count and moving browser captures |
| Bold Ideas / reel scroll | Shared transform sampler, media policy and ground-truth data inspected | Partial | Live reference behavior inaccessible in prior pass, not yet retried here | Compare actual forward/reverse states, media/crop and preference changes | Desktop/tablet/mobile browser sweeps and decoded footage checks |
| Featured Work scroll / pointer | Source updates image wrapper on every pointer type, with no pointercancel handler | Partial | Suspected touch/cancel/preference latching; fresh reproduction pending | Reproduce before implementing a bounded reset | Pointer/touch/cancel/media-query regression and forward/reverse section captures |
| Scrolling / motion smoothness | One existing owner; baseline build/unit checks pass | Partial | Visible-frame stall cap and paused redraw suspected; software renderer limits known historically | Measure actual clock and paused draw submission; fix proven waste | Draw counters and autonomous policy tests; no inferred 60fps claim |
| Performance / visual quality | Fresh profiling queued; previous numbers are not reused as new evidence | Not tested | Hardware performance unknown; shader/geometry/driver cost must be measured | Optimize demonstrated work, not indiscriminate quality cuts | RAF/GPU/long-task/resource metrics with environment and duration |
| Responsive / accessibility | Source and focus classes inspected; fresh 390/1024/1440 runs queued | Not tested | Touch and live reduced-motion behavior require actual browser verification | Fix reproduced input/preference issues | Overflow, keyboard/contact/navigation, reduced motion and fallback tests |
| Contact CTA / remaining homepage | Actual mailto and footer control source inspected | Not tested | Footer explicitly requests smooth scroll irrespective of preference (hypothesis) | Test keyboard activation and reduced-motion navigation | Browser focus/name/href and footer handoff |
| High-resolution output | Existing DPR policy inspected; no fresh UHD run yet | Not tested | Physical 4K hardware, native source assets and 4K60 are distinct claims | Verify actual buffer, filtering and GL stability without blanket DPR increases | Genuine 3840×2160 buffer test; document physical-device limitation |
| PR integration | GitHub and non-mutating merge analysis run freshly | Failed | Independently squashed base conflicts with 26 existing paths | Preserve both histories and inspect base-only changes; do not discard master work blindly | Final GitHub merge/check state, explicit blocker if unresolved |

This ledger will be completed with actual fixes, final test outcomes, performance measurements and evidence paths. Initial statuses above are not completion claims.
