# Phase H.1 — Visual Acceptance Audit & Targeted Correction Report

## Summary Progression Across All 51 Identical Multi-Viewport Scroll States

| Ledger / Commit | Description | Mean MAE (`0–255`, lower is better) | Mean SSIM (`0–1`, higher is better) |
| --- | --- | ---: | ---: |
| `metrics-baseline.json` (`9a01547`) | Pre-Phase-H baseline | `63.68` | `0.2971` |
| `metrics-phase-h-entry.json` (`3349ce8`) | Phase H entry checkpoint (`checkpoint-phase-h1-entry`) | `51.28` | `0.3498` |
| `metrics-current.json` (Phase H.1 final) | Phase H.1 targeted surgical corrections | **`45.39`** (`-5.89` vs H, `-18.29` vs baseline) | **`0.3957`** (`+0.0459` vs H, `+0.0986` vs baseline) |

## Key State-by-State Visual Improvements (`3349ce8` -> Phase H.1)

- **Homepage (`/`):**
  - `home-02-tablet-emerge-start`: `1440x900` `MAE 91.87 -> 58.50` (`SSIM 0.2375 -> 0.4104`); `1024x768` `MAE 109.56 -> 71.41`; `390x844` `MAE 148.34 -> 97.36`.
  - `home-03-tablet-emerge-mid` & `home-11-reverse-tablet-mid`: `1440x900` `MAE 49.07 -> 38.81` (forward) and `48.20 -> 38.48` (reverse, `|Δ| = 0.33`); `1024x768` `MAE 47.06 -> 39.64` (forward) and `46.50 -> 39.01` (reverse).
  - `home-06-black-tunnel-twist`: `1440x900` `MAE 65.08 -> 55.07`, `SSIM 0.0530 -> 0.1888` (`3.56x` structural similarity gain from architectural diamond steel truss + magenta/violet/cyan corridor lighting).
  - `home-07-white-blue-tunnel`: `1440x900` `MAE 79.89 -> 69.80` (`SSIM 0.4832 -> 0.5858`).
  - `home-08-desktop-frame-out`: `1440x900` `MAE 75.59 -> 65.01` (`SSIM 0.4534 -> 0.5585`); `1024x768` `MAE 91.39 -> 60.02` (`-31.37` MAE); `390x844` `MAE 125.08 -> 39.42` (`-85.66` MAE).
  - `home-10-end-cta-wait`: `1440x900` `MAE 13.00 -> 12.70` (`SSIM = 0.6977`, `PSNR = 15.40 dB`).
- **About (`/about`):**
  - `about-01-hero-top`: `1440x900` `MAE 40.16 -> 37.63`; `1024x768` `MAE 38.58 -> 36.70`; `390x844` `MAE 67.86 -> 57.14` (`-10.72` MAE).
  - `about-02-we-are-reveal` & `about-06-reverse-we-are`: `SSIM = 0.5019 / 0.4998` (`1440x900`), `0.4895 / 0.4965` (`1024x768`), `0.5129 / 0.4824` (`390x844`).
  - `about-03-details-hud`: `MAE = 16.80`, `SSIM = 0.5455` (`1440x900`).
  - `about-04-team-hologram`: `1440x900` `MAE 16.55 -> 14.16` (`SSIM 0.2907 -> 0.3689`, `PSNR = 16.99 dB`); `1024x768` `MAE 17.85 -> 14.75` (`SSIM = 0.4139`); `390x844` `MAE 25.66 -> 19.28` (`SSIM = 0.4255`).
  - `about-05-end-cta-flip`: `MAE = 15.87`, `SSIM = 0.8180` (`1440x900`).
