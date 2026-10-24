# Staged Asset Attribution & Licensing Notice

This directory (`public/assets/`) stages local verification and open-license typography assets for the reference-faithful reconstruction of `https://lusion.co/`.

## Licensing Categories & Strict Compliance Summary

1. **Excluded Proprietary Font Software (0 files staged — Font Option 2 Enforced):**
   - `Aeonik-Regular`, `Aeonik-RegularItalic`, `Aeonik-Medium` (*CoType Foundry / Mark Bloom & Joe Leadbeater commercial EULA*) — **NOT staged or distributed**.
   - `LusionMono` (*Marco Grimaldi / Lusion custom font binary*) — **NOT staged or distributed**.

2. **Verified Open-License Fonts & Clean-Room Original Vector Icons (Permissive):**
   - `fonts/IBMPlexMono-Regular.{woff,woff2}`, `fonts/IBMPlexMono-Medium.{woff,woff2}` — **SIL Open Font License 1.1** (verified via embedded SFNT `nameID[13]`; see `fonts/OFL-IBMPlexMono.txt`).
   - `fonts/InstrumentSans-Variable.woff2`, `fonts/InstrumentSans-VariableItalic.woff2` — **SIL Open Font License 1.1** (metric-matched open-license replacement for `Aeonik`; see `fonts/OFL-InstrumentSans.txt`).
   - `fonts/capability-icons/{strategy,creative,tech,production}.svg` — **MIT** original geometric vector icons replacing `LusionMono` icon codepoints.

3. **Standard Permissive Shader Lookup Textures:**
   - `textures/LDR_RGB1_0.png` — **CC0-1.0** blue-noise dither texture.
   - `textures/smaa-area.png`, `textures/smaa-search.png` — **BSD-2-Clause** SMAA lookup tables (*Jorge Jimenez*).

4. **Non-Licensed Reference Capture Media, 3D Models, Audio, Likenesses & Trademarks (Local Inspection Only):**
   - Case-study stills (`projects/**/*.webp`), re-encoded motion loops (`projects/**/*.mp4`, `textures/reel/*.mp4`), custom WebGL geometry (`models/**/*.buf`), matcaps/textures (`textures/**`), UI sound stems (`audios/*.ogg`), team likenesses (`team/*`), and third-party brand/award logos (`images/logo/@logo--*.svg`) originate from public `https://lusion.co/` responses archived in `quangminh1212/Design_Lusion.co` (*captured 23 September 2026*).
   - **Important Legal Limitation:** Public HTTP accessibility does **not** grant an open-source or commercial reuse license. All rights in Lusion's studio assets, client portfolio footage, third-party trademarks, and team member likenesses remain the property of Lusion Ltd and their respective rightsholders. These files are staged solely for local, non-affiliated technical inspection and visual validation.

See `docs/asset-manifest.md` and `docs/asset-manifest.json` for per-file SHA-256 checksums, dimensions, SSIM/PSNR scores, and individual license classifications.

## Phase G Self-Contained Repository Bundle (`media-bundle/`)

- **Location & Footprint:** `media-bundle/` (`567` files, `37.41 MB` total, indexed in `media-bundle/BUNDLE_INDEX.json`) is packaged directly inside the repository and copied into `.next/standalone/media-bundle/` at build time (`zero` runtime `/tmp` dependency).
- **Delivery & Security:** Served strictly via `src/app/assets/[...path]/route.ts` with `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; sandbox`, `X-Content-Type-Options: nosniff`, `Cross-Origin-Resource-Policy: same-origin`, symlink-escape canonicalization, and `HTTP 206 Partial Content` byte-range support when `LUSION_ALLOW_LOCAL_INSPECTION_ASSETS !== "1"`.
- **Clean-Room & Font Compliance Preserved:** `0` commercial font binaries (`Aeonik*`, `LusionMono*`) exist anywhere in `public/assets/` or `media-bundle/`; all commercial font paths continue returning `HTTP 403`. `models/about/sphere_l.buf` duplicates `models/about/sphere_m.buf` where the upstream capture omitted `sphere_l.buf`.

