# Lusion Reconstruction — Traceable Asset & Licensing Manifest

- **Machine-readable manifest:** `docs/asset-manifest.json` (**588** individually traced records with SHA-256 checksums)
- **Reference capture source:** `quangminh1212/Design_Lusion.co` (*captured 23 September 2026 from public `https://lusion.co/` responses*)
- **Active font policy:** **Font Option 2 — Strict Licensing Compliance** (`0` commercial/proprietary font binaries in repository)
- **Total staged size in `public/assets/`:** **94.51 MB** (well below Arena's `128 MB` workspace artifact ceiling)

---

## 1. Provenance & Licensing Summary by Classification

> **Important Legal Rule:** Public HTTP availability on `lusion.co` or archiving in a public GitHub snapshot does **not** grant an open-source license or commercial redistribution rights. Every asset category was inspected at binary header / OpenType table / Vorbis tag / container level prior to staging.

| License Status | Item Count | Staged Size |
| :--- | ---: | ---: |
| `All-Rights-Reserved-Reference` | 474 | 37.51 MB |
| `All-Rights-Reserved-Portfolio` | 49 | 54.75 MB |
| `All-Rights-Reserved-Audio` | 16 | 1.24 MB |
| `All-Rights-Reserved-Trademark` | 15 | 0.07 MB |
| `SIL-OFL-1.1` | 8 | 0.25 MB |
| `All-Rights-Reserved-Likeness` | 8 | 0.60 MB |
| `Proprietary-EULA-Excluded` | 8 | 0.00 MB |
| `MIT` | 5 | 0.00 MB |
| `BSD-2-Clause` | 2 | 0.03 MB |
| `External-Stream-Not-Downloadable` | 2 | 0.00 MB |
| `CC0-1.0` | 1 | 0.05 MB |

---

## 2. Category-by-Category Provenance & Rights Findings

1. **Commercial & Custom Fonts — EXCLUDED (`8` files, `0.00 MB` staged):**
   - `Aeonik-Regular.{woff,woff2}`, `Aeonik-RegularItalic.{woff,woff2}`, `Aeonik-Medium.{woff,woff2}`: OpenType `name` table (`nameID[0]`, `nameID[13]`, `nameID[14]`) specifies commercial EULAs (*Copyright (c) 2020 CoType Foundry. All Rights Reserved — `www.cotypefoundry.com/eula`* and *Mark Bloom and Joe Leadbeater — `This Is Our Shop EULA`*). **Not copied into repository.**
   - `LusionMono.{woff,woff2}`: Custom 74-glyph display font created in `Fontself Maker 1.1.0` (*Marco Grimaldi / Lusion*) with no open license grant; maps capability codepoints (`s`, `c`/`d`, `t`, `P`/`3`) to bespoke geometric icons. **Not copied into repository.**

2. **Verified Open-License Typography & Clean-Room Emblems — STAGED (`8` files):**
   - `public/assets/fonts/IBMPlexMono-{Regular,Medium}.{woff,woff2}`: Embedded OpenType `nameID[13]` explicitly grants **SIL Open Font License 1.1** (*Copyright 2017 IBM Corp.*). License bundled at `public/assets/fonts/OFL-IBMPlexMono.txt`.
   - `public/assets/fonts/InstrumentSans-Variable{,Italic}.woff2`: **SIL Open Font License 1.1** (bundled at `public/assets/fonts/OFL-InstrumentSans.txt`). OpenType outline measurements confirm exact `x-height = 0.510em` parity with `Aeonik-Regular` (`0.510em`) and hero headline advance parity (`40.858em`) with `size-adjust: 97.80%`, `ascent-override: 102.25%`, `descent-override: 20.47%`.
   - `public/assets/fonts/capability-icons/{strategy,creative,tech,production}.svg`: Original clean-room geometric vector icons (**MIT**) replacing `LusionMono` capability glyph slots.

3. **Standard Open-License Shader Lookup Textures (`3` files):**
   - `public/assets/textures/LDR_RGB1_0.png`: Calinou blue-noise dither texture (**CC0-1.0**).
   - `public/assets/textures/smaa-area.png`, `smaa-search.png`: Standard SMAA lookup textures (*Jorge Jimenez*, **BSD-2-Clause**).

4. **First-Party WebGL Geometry, Matcaps, UI Assets & Meta Icons (`94` files, byte-identical SHA-256):**
   - Custom packed binary geometry (`public/assets/models/**/*.buf`), OpenEXR matcaps (`matcap.exr`, `matcap_ld.exr`), tunnel/about textures, card back texture, directional arrow SVGs, and favicons.
   - **Limitation:** Unlicensed first-party property of Lusion Ltd; staged solely for local non-affiliated technical inspection and reconstruction parity.

5. **Team Member Names, Roles & 3D Point-Cloud Likenesses (`8` files, `8,192` vertices each):**
   - `public/assets/team/team.json` + `{edan,ffi,pierre,yannic,paul,andrii,sunny}.buf`.
   - **Limitation:** Subject to copyright and personal likeness / UK data-protection rights of the 6 named team members. Must only appear accurately representing Lusion's published team roster in a local non-commercial inspection context.

6. **Third-Party Client & Award Organization Logos (`15` SVG files):**
   - `@logo--{akqa,apple,awwwards,calvin-klein,cocacola,google,hyundai,maxmara,nexus-studios,nvidia,porsche,sony,stanford,wallpaper,webby-awards}.svg`.
   - **Limitation:** Registered trademarks of their respective owners; nominative factual reference within Lusion's client/recognition section only.

7. **UI Foley & Cinematic Sound Stems (`16` `.ogg` files, `1.24 MB`):**
   - `public/assets/audios/*.ogg` (`Xiph.Org libVorbis I 20200704`, zero permissive license tags in Vorbis comments).
   - **Limitation:** Proprietary/non-transferable production sound design; local inspection only.

8. **Unavailable Upstream Vimeo Full Films (`2` streams — Documented Blocker):**
   - **Vimeo `761102167`** (*Lusion Reel 2023*, `107s`) and **Vimeo `783015830`** (*Porsche: Dream Machine*, `115s`) have public downloads disabled on Vimeo and outbound Vimeo requests are blocked in this offline environment. Only the short local loops (`textures/reel/{desktop,mobile}.mp4` `11.5s` and `projects/porsche_dream_machine/{video0,video1}.mp4`) exist and will be paired with explicit offline UI disclosure in Phases B/C/E without fabricating footage.

---

## 3. Quality-Aware Video Optimization Verification (All 49 MP4 Loops)

- **Original raw size:** `159.42 MB` -> **Optimized staged size:** `54.75 MB` (`-65.7%`)
- **Aspect ratios & pixel dimensions:** **49 / 49 preserved identically (`SAR 1:1`, exact `width × height`)**
- **Frame rates & smooth motion:** **49 / 49 native frame rates preserved (`60`, `59.94`, `50`, `30`, `29.97`, `25`, `24` fps)**
- **Audio tracks:** **Preserved on both audio-bearing clips** (`projects/porsche_dream_machine/{video1,mobile_video1}.mp4`)
- **Full-stream frame-by-frame quality:** **Mean SSIM = `0.98337`** (min `0.9518`), **Mean PSNR = `41.84 dB`** (min `34.36 dB`)
- **Multi-timestamp visual comparison sheets (Original vs. Optimized vs. 8× Residual):** `docs/validation/video-frames/*.jpg`

| Clip Path | Resolution | FPS | Duration | Audio | Raw | Staged | CRF | Mean SSIM | Mean PSNR |
| :--- | :---: | :---: | :---: | :---: | ---: | ---: | :---: | ---: | ---: |
| `projects/atlas_motion/main.mp4` | 1234×720 | 50 | 5.4s | — | 3.87 MB | 0.59 MB | 28 | 0.9795 | 41.62 dB |
| `projects/choo_choo_world/mobile_video1.mp4` | 720×576 | 60 | 8.0s | — | 1.14 MB | 0.13 MB | 28 | 0.9965 | 44.44 dB |
| `projects/choo_choo_world/mobile_video2.mp4` | 720×576 | 60 | 4.0s | — | 0.50 MB | 0.04 MB | 28 | 0.9954 | 45.45 dB |
| `projects/choo_choo_world/video1.mp4` | 1280×720 | 60 | 8.0s | — | 1.68 MB | 0.20 MB | 28 | 0.9975 | 46.24 dB |
| `projects/choo_choo_world/video2.mp4` | 1280×720 | 60 | 4.0s | — | 0.81 MB | 0.06 MB | 28 | 0.9965 | 47.06 dB |
| `projects/ddd_2024/mobile_video0.mp4` | 720×450 | 60 | 8.5s | — | 1.59 MB | 0.41 MB | 28 | 0.9840 | 40.56 dB |
| `projects/ddd_2024/video0.mp4` | 1152×720 | 60 | 8.5s | — | 2.59 MB | 0.97 MB | 28 | 0.9863 | 41.21 dB |
| `projects/devin_ai/mobile_video0.mp4` | 720×404 | 29.97 | 12.7s | — | 3.17 MB | 0.13 MB | 28 | 0.9914 | 44.25 dB |
| `projects/devin_ai/mobile_video2.mp4` | 1280×720 | 30 | 17.6s | — | 4.23 MB | 0.86 MB | 28 | 0.9948 | 45.47 dB |
| `projects/devin_ai/mobile_video3.mp4` | 720×404 | 29.97 | 6.4s | — | 1.46 MB | 0.04 MB | 28 | 0.9924 | 44.68 dB |
| `projects/devin_ai/video0.mp4` | 1280×720 | 29.97 | 12.7s | — | 4.27 MB | 0.34 MB | 28 | 0.9938 | 45.58 dB |
| `projects/devin_ai/video2.mp4` | 1920×1080 | 30 | 17.6s | — | 6.28 MB | 1.62 MB | 28 | 0.9963 | 47.59 dB |
| `projects/devin_ai/video3.mp4` | 1280×720 | 29.97 | 6.4s | — | 1.61 MB | 0.10 MB | 28 | 0.9947 | 45.88 dB |
| `projects/everswap/main.mp4` | 1280×720 | 60 | 33.5s | — | 8.20 MB | 2.72 MB | 29 | 0.9797 | 39.82 dB |
| `projects/infinite_passerella/mobile_video0.mp4` | 720×576 | 60 | 7.4s | — | 1.05 MB | 0.43 MB | 28 | 0.9891 | 43.21 dB |
| `projects/infinite_passerella/mobile_video1.mp4` | 720×576 | 60 | 15.8s | — | 2.27 MB | 0.91 MB | 28 | 0.9757 | 37.86 dB |
| `projects/infinite_passerella/video0.mp4` | 1280×720 | 60 | 7.4s | — | 1.58 MB | 0.78 MB | 28 | 0.9923 | 45.22 dB |
| `projects/infinite_passerella/video1.mp4` | 1280×656 | 60 | 15.8s | — | 3.38 MB | 1.64 MB | 28 | 0.9786 | 38.75 dB |
| `projects/lusion_labs/mobile_video0.mp4` | 720×576 | 60 | 20.0s | — | 2.93 MB | 0.57 MB | 28 | 0.9862 | 46.04 dB |
| `projects/lusion_labs/video0.mp4` | 1280×720 | 60 | 20.0s | — | 4.38 MB | 1.17 MB | 28 | 0.9903 | 47.66 dB |
| `projects/maxmara_bearings_gifts/mobile_video0.mp4` | 720×576 | 60 | 11.5s | — | 1.68 MB | 0.32 MB | 28 | 0.9859 | 42.97 dB |
| `projects/maxmara_bearings_gifts/mobile_video1.mp4` | 720×576 | 60 | 11.0s | — | 1.59 MB | 0.36 MB | 28 | 0.9859 | 43.56 dB |
| `projects/maxmara_bearings_gifts/video0.mp4` | 1280×720 | 60 | 11.5s | — | 2.51 MB | 0.59 MB | 28 | 0.9892 | 44.67 dB |
| `projects/maxmara_bearings_gifts/video1.mp4` | 1280×720 | 60 | 11.0s | — | 2.38 MB | 0.69 MB | 28 | 0.9899 | 45.46 dB |
| `projects/my_little_story_book/mobile_video0.mp4` | 720×576 | 60 | 20.2s | — | 2.88 MB | 1.04 MB | 28 | 0.9745 | 40.43 dB |
| `projects/my_little_story_book/video0.mp4` | 1280×720 | 60 | 20.2s | — | 4.31 MB | 1.75 MB | 29 | 0.9790 | 41.32 dB |
| `projects/of_the_oak/mobile_video0.mp4` | 720×404 | 60 | 11.8s | — | 4.26 MB | 1.63 MB | 28 | 0.9713 | 36.31 dB |
| `projects/of_the_oak/video0.mp4` | 1280×720 | 60 | 11.8s | — | 5.68 MB | 1.58 MB | 28 | 0.9649 | 35.60 dB |
| `projects/oryzo_ai/bts.mp4` | 1280×720 | 30 | 32.0s | — | 7.63 MB | 2.47 MB | 29 | 0.9889 | 42.30 dB |
| `projects/oryzo_ai/launch.mp4` | 1280×720 | 24 | 31.3s | — | 7.47 MB | 1.92 MB | 29 | 0.9834 | 39.22 dB |
| `projects/oryzo_ai/main.mp4` | 1250×720 | 59.94 | 27.3s | — | 8.16 MB | 2.37 MB | 29 | 0.9750 | 38.03 dB |
| `projects/porsche_dream_machine/mobile_video0.mp4` | 720×576 | 25 | 21.8s | — | 3.14 MB | 1.73 MB | 28 | 0.9798 | 38.16 dB |
| `projects/porsche_dream_machine/mobile_video1.mp4` | 720×576 | 60 | 19.4s | AAC | 2.86 MB | 1.59 MB | 26 | 0.9713 | 34.36 dB |
| `projects/porsche_dream_machine/video0.mp4` | 1280×720 | 25 | 21.8s | — | 4.71 MB | 2.16 MB | 29 | 0.9757 | 36.75 dB |
| `projects/porsche_dream_machine/video1.mp4` | 1280×720 | 60 | 19.4s | AAC | 4.30 MB | 2.42 MB | 26 | 0.9708 | 34.76 dB |
| `projects/soda_experience/mobile_video0.mp4` | 720×576 | 60 | 10.0s | — | 1.43 MB | 0.75 MB | 28 | 0.9832 | 40.23 dB |
| `projects/soda_experience/video0.mp4` | 1280×720 | 60 | 10.0s | — | 2.13 MB | 1.32 MB | 28 | 0.9862 | 41.77 dB |
| `projects/spaace/mobile_video0.mp4` | 720×448 | 60 | 10.0s | — | 2.16 MB | 1.35 MB | 25 | 0.9728 | 39.20 dB |
| `projects/spaace/video0.mp4` | 1146×714 | 60 | 10.0s | — | 4.68 MB | 1.81 MB | 26 | 0.9624 | 37.10 dB |
| `projects/spatial_fusion/mobile_video0.mp4` | 720×576 | 60 | 10.0s | — | 1.59 MB | 0.60 MB | 28 | 0.9858 | 42.92 dB |
| `projects/spatial_fusion/video0.mp4` | 1280×720 | 60 | 10.0s | — | 2.46 MB | 1.10 MB | 28 | 0.9893 | 44.31 dB |
| `projects/synthetic_human/mobile_video0.mp4` | 720×404 | 59.94 | 14.0s | — | 2.14 MB | 0.94 MB | 28 | 0.9861 | 42.02 dB |
| `projects/synthetic_human/video0.mp4` | 1280×720 | 59.94 | 14.0s | — | 3.38 MB | 1.55 MB | 28 | 0.9863 | 41.78 dB |
| `projects/the_turn_of_the_screw/mobile_video0.mp4` | 720×576 | 60 | 13.0s | — | 1.81 MB | 0.86 MB | 28 | 0.9702 | 41.69 dB |
| `projects/the_turn_of_the_screw/video0.mp4` | 1280×720 | 60 | 13.0s | — | 2.71 MB | 1.81 MB | 28 | 0.9792 | 43.18 dB |
| `projects/worldcoin/mobile_video0.mp4` | 720×576 | 60 | 20.8s | — | 3.01 MB | 0.77 MB | 28 | 0.9942 | 44.26 dB |
| `projects/worldcoin/video0.mp4` | 1280×720 | 60 | 20.8s | — | 4.45 MB | 1.47 MB | 28 | 0.9959 | 45.06 dB |
| `textures/reel/desktop.mp4` | 1920×960 | 60 | 11.5s | — | 4.75 MB | 2.48 MB | 26 | 0.9518 | 35.93 dB |
| `textures/reel/mobile.mp4` | 720×960 | 60 | 11.5s | — | 2.16 MB | 1.60 MB | 25 | 0.9653 | 38.06 dB |
