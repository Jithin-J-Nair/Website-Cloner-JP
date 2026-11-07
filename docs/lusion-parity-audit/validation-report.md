# Validation report — 2026-11-07

## Verdict

**Buildable and initial-route smoke checks pass; not all existing regression gates pass. Visual/motion parity with the current live source is unverified.** No application-rendering change was made to obtain these results.

## Reproduced validation-boundary defect

The initial workspace lint/typecheck/build failed because ignored research included duplicate generated Next bundles and upstream ECC Remotion examples. Lint reported 5,409 errors / 25,456 warnings; TypeScript entered two unrelated research trees. The build's compilation succeeded before research type errors failed the gate. This does not prove a clean 5051 checkout was broken.

A new regression deliberately reproduced the inclusion defect before changing configuration. Then only `temp` and `skills` were excluded from ESLint/TypeScript roots. Regression verifies src/tests remain checked, strict/noEmit remain enabled and hooks/no-explicit-any stay enabled. No build-error bypass, lint-rule suppression, application/test exclusion or fixture dependency installation was used.

## Results

| Command / check | Outcome | Evidence / precise scope |
| --- | --- | --- |
| Locked npm ci --legacy-peer-deps | PASS | data/npm-ci.log; no dependency/lockfile edit; 13 advisories remain |
| Boundary regression before repair | EXPECTED FAIL | data/boundaries-before.log; test was written before config repair |
| node scripts/test-validation-boundaries.mjs after repair | PASS | data/after-boundaries.log; 1.50 s in recorded batch |
| npm run lint | PASS, **2 warnings** | data/after-lint.log and final-lint.log; zero errors, not warning-free |
| npm run typecheck | PASS | data/after-typecheck.log |
| npm run test:motion | PASS | data/after-test-motion.log; numerical/model/source assertions, not animation parity |
| npm run qa | PASS | data/after-qa.log, final-qa.log; 20 captured routes, two negative routes, asset/security/content/title checks |
| npm run build + postbuild | PASS | data/after-build.log; 14.18 s recorded, not a universal performance promise |
| 20 routes × 6 viewport census | PASS initial smoke criteria | 120 screenshots and raw matrix; data/clone-census-summary.json |
| node docs/lusion-parity-audit/harness/check-route-matrix.mjs | PASS | data/census-check.log; shared checker also appended to future capture runs |
| Checker negative fixtures | PASS | Missing/duplicate states, bad HTTP, console error, overflow, title mismatch and capture exception each rejected in an in-memory fixture run; no evidence file mutated |
| npm run validate:home-motion | **FAIL** | 261.59 s; timeout at line 100 after rapid motion + pointercancel, waiting for zero offset energy; LP-006 |
| LUSION_VALIDATION_OUT_DIR=docs/lusion-parity-audit/evidence/browser-gate npm run validate:browser | PASS | 270.32 s; unchanged assertions; data/browser-validation.log; phase-d-browser-report.json |
| npm run test:about-portrait | **FAIL** | Old 16K/24K procedural portrait source-string assertion at line 61; numerical geometry checks before it complete; LP-007 |
| npm run test:assets | **FAIL: 17 pass / 1 fail** | Atlas Motion synthesized fallback expected 200 but receives 404; other security/range/HEAD checks pass; LP-008 |
| Changed-file ESLint + git diff --check | PASS | Harness/validator changes checked after the final additions |
| Current live browser reconnaissance | BLOCKED | Six core-route desktop/mobile attempts ERR_CONNECTION_CLOSED; data/live-access.json |
| Current live visual/motion comparison | NOT RUN | No successful current source capture; all fidelity scores null/unverified |

`after-tests.json`, `browser-tests.json` and `additional-tests.json` retain individual subprocess exits. Their collecting Python processes exiting zero is **not** interpreted as every child test passing.

## Existing warnings

- LusionProjectDetailView.tsx:85: unused `highlight` parameter.
- StudioFooter.tsx:174: unused expression.

No unrelated source cleanup was performed solely to remove warnings.

## Initial-state census

Six CSS viewport sizes, zoom 1, DPR 1, emulated touch/mobile at 390/375, Chromium SwiftShader. Browser waits for main visibility, preloader removal and fonts, then two animation frames. It does **not** normalize animation/camera progress against Lusion. All 120 sampled states: HTTP 200; exact captured title; no document horizontal overflow, console/page error, warning, failed request or HTTP ≥400 response. All 20 unique internal paths observed in anchors returned 200.

Recorded evidence includes H1/description/canonical, links, image completion/natural dimensions, video source/readiness/playback state, Canvas dimensions and Home telemetry. These are diagnostics, not proof that lazy galleries fully loaded or media identity matches the source. The checker asserts completeness, uniqueness, status/title/H1/screenshot records, no recorded errors/failed responses and no overflow. No initial-state record is advertised as a footer/menu/hover/motion-phase test.

All six overview sheets were inspected; all 120 full-resolution images were not independently reviewed. No automatic source-image difference metric was fabricated. `data/comparison-status.json` keeps all 12 category scores null across the 120 cases. Null does not mean missing (0) or verified (5).

## Existing browser gate coverage

At 1440×900 and 390×844: six Home section snapshots plus About/archive/Oryzo/Porsche/Spaace initial states. Desktop ShowreelModal Enter, Tab/Shift+Tab containment, Escape and focus restoration pass. Hero Canvas exists with positive measured dimensions; that assertion alone does not establish nonblank original graphics or material correctness.

Actual totals: zero console errors, page exceptions or HTTP ≥400 failures. Output includes 23 PNG captures and ten composites against **historical phase-a** imagery. Those composites are not today's live-source observations or normalized animation comparisons. Screenshots and report are in `evidence/browser-gate/`; earlier phase-d evidence was not overwritten. The output override changes no assertion, timeout, route list or reference path.

## Tests not run / remaining limitations

The About accessibility/budget/capture commands and phase-e audit were not run in this checkpoint. Their output ownership and complete implementation review must precede invocation so earlier evidence is not overwritten. Full every-route menu/contact/newsletter, keyboard/touch/reduced-motion, complete galleries/footers, media lifecycle, reverse scroll, scene disposal and source-matched motion remain unfinished.

The initial 120-state census ran against the isolated 5051 production snapshot. After successful root build it was deliberately replaced on port 3000 with the latest root production server. The root HTTP QA and existing browser/motion gates then ran against that server. Source, public/media and dependency files are unchanged relative to 5051, so this is not a silent baseline substitution.

No GPU/physical-phone/OS-background/speaker/thermal/hardware-4K60 benchmark or current-live source parity is certified. Existing functional failures are not dismissed as software-renderer artifacts without diagnosis.
