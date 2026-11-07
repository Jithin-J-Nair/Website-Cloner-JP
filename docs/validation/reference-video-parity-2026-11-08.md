# Reference-driven parity pass — 2026-11-08

## Evidence inspected

- Library recording `2026-11-04 18-46-31.mp4`: 32 seconds, 2560×1600. Sampled the homepage hero at regular intervals and inspected the 3D hollow-cross cluster, material response, pointer-driven changes and layout.
- Library recording `2026-10-29 22-24-06.mp4`: 37.6 seconds, 2560×1600. Sampled the About sequence: monumental wordmark, particle-to-landscape transition, explorer/astronaut, studio narrative, team, awards, expertise and closing section. Duplicate Library copies were byte-identical.
- Compared branch source stills and local captures in `docs/validation/phase-g/reference/` and `docs/validation/phase-g/captures/final/` at 1440×900 and 390×844.
- `public/videos/Lusion-project.mp4` is present on the requested branch as a 35 MB Git LFS object. The GitHub file connector returned its pointer rather than the MP4 stream, so this report does not claim that binary was watched. Project comparison uses the branch's source/reference screenshot atlas and current project-page captures.
- Consulted the public `shifatmasud/lusion-decoded` handbook for Home/About/Projects screenshot atlas, scroll/motion notes, scene/effect notes and project-template behavior. This is secondary reconstruction evidence, not a substitute for the supplied recordings.

## Changes made

### Home

- The 2026-11-04 Home recording is a 2560×1600 browser capture. After accounting for browser chrome and normalizing the webpage viewport to 1440×900, the first CI screenshot showed the title and cross stage beginning roughly 30 px too high while the stage bottom was already within about 3 px. Desktop top padding was recalibrated to 5.3vh, section bottom padding to 0.94×base padding, and the scroll cue to the viewport bottom.
- At 390×844 the local headline wrapped later than the source (it carried “and” on line one), and the stage was too tall. Mobile type scale and bottom breathing room were corrected.
- The recording shows the hero's accent palette changing on deliberate stage clicks (cobalt, lime, red, violet and gold); the branch already has the matching click-driven palette cycle, so that interaction was preserved.
- The showreel modal title and Home-only shared footer/header brand now use JITHIN. About and Projects retain the Lusion wordmark.

### Projects archive

- At 1440×900 the PROJECTS heading was materially narrower/shorter than the source, and the first row began roughly 43 px too early. Desktop type scale, title top offset and row gap were tuned.
- At 390×844 the first archive card began about 24 px too early. The mobile grid top gap was increased without changing card aspect ratios or order.

### Project detail

- At 390×844 the Oryzo AI title and copy were visibly undersized/too high relative to the source. Opening top offset, title scale, paragraph spacing and reading size were tuned.
- The mobile launch action was moved after the services/links block instead of being pinned to the bottom of the first viewport, matching the source still's editorial ordering.
- At desktop, the media column now uses the right-hand six-column lane with a calibrated inset and flush right bleed; the left editorial column remains five columns.

### About

- Verified that the current About scene loads the seven permissioned team point-cloud models through `/about/scene/[asset]` and uses the bundled `terrain_lines.buf`; these are not generic placeholder portraits.
- Found that `AboutExpertiseCards` requested `/assets/images/cards/back-ink.png`, which was not present in the served asset catalog. Replaced it with `public/assets/images/cards/back-ink.svg`, an original 628×876 clean-room vector texture. It is explicitly allowlisted and covered by the About-card and asset-route assertions; it is not copied or derived from the proprietary bundled `images/cards/back.png`.
- Verified that the About closing CTA already uses the WebGL `CinematicContactField` instanced particle scene, not a flat 2D placeholder. It was preserved.

## Preserved

- Reference screen-recording MP4s were not wired into the site as production media; they are observation material, not page assets.
- Existing WebGL scenes, scroll drivers, production video sources, audio engine, project media, archive ordering, all 19 project records and route behavior were left intact.
- No new runtime dependencies were added.
- Home branding is route-scoped; About and Projects retain Lusion branding.

## Validation boundary

Source assertions were updated alongside the layout values and the About asset fix. GitHub Actions has started the branch quality job, but its dependency-install step is still in progress and the tests/build have not yet reported a conclusion. This remote edit session has not run the repository's local build/browser suite. The branch must be checked by GitHub Actions, then visually reviewed at 1440×900, 1024×768 and 390×844. This pass does not certify 100% visual or motion parity.
