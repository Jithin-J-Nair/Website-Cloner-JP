# Phase H — Surgical Reconstruction Validation Artifacts

## Scope
Strict surgical reconstruction of the two Phase H target WebGL systems only:
- **Fix A (`/`, `#home-goal` + `#end-section`):** `src/components/home/GoalTunnelSection.tsx`, `src/components/sections/ContactCtaSection.tsx`, `src/components/home/HomePageView.tsx`
- **Fix B (`/about`, `#about-who` + `#end-section`):** `src/components/pages/AboutPageView.tsx`
- **Deterministic Validation Harness:** `scripts/phase-h-validate.mjs` & `scripts/phase-c-home-validate.mjs` (Playwright detached-overlay wait for SwiftShader exit animation)

## Quantitative Before vs. After Aggregate (`51` Scroll States Across `1440x900`, `1024x768`, `390x844`)
- **Pre-Fix Baseline (`docs/validation/phase-h/metrics-baseline.json`):**
  - `Mean MAE = 63.68` | `Mean SSIM = 0.2971`
- **Post-Fix Reconstruction (`docs/validation/phase-h/metrics-current.json`):**
  - `Mean MAE = 51.28` (**`-12.40` MAE improvement**) | `Mean SSIM = 0.3498` (**`+0.0527` SSIM gain**)

## Directory Layout
- `reference/{1440x900,1024x768,390x844}/*.png` — Untouched lossless reference captures (`17` states × `3` viewports = `51` PNGs)
- `baseline/{1440x900,1024x768,390x844}/*.png` — Pre-fix (`9a01547`) lossless captures (`51` PNGs)
- `current/{1440x900,1024x768,390x844}/*.png` — Post-fix lossless captures (`51` PNGs)
- `composites/baseline/{1440x900,1024x768,390x844}/*.jpg` — Pre-fix 3-panel `Reference | Reconstruction | Abs Diff x2` strips (`51` JPEGs)
- `composites/current/{1440x900,1024x768,390x844}/*.jpg` — Post-fix 3-panel `Reference | Reconstruction | Abs Diff x2` strips (`51` JPEGs)
- `metrics-baseline.json` & `metrics-current.json` — Full 51-state MAE / PSNR / SSIM / `pctOver24` ledger

## Reproduction
```bash
npm run check
npm run test:assets
npm run qa
npm run validate:browser
node scripts/phase-h-validate.mjs current
```
