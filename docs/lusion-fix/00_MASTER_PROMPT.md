# LUSION RECONSTRUCTION: FIDELITY RECOVERY DIRECTIVE

> **READ FIRST.** `docs/lusion-fix/02_ADDENDUM_V2.md` OVERRIDES this file wherever they conflict (especially M3, M4, M5, M6). It adds: the skills protocol (Phase S), two shadcn components (ShaderAnimation, GlowCard), the click-open transition, the tesseract + glass-break + jump-out rebuild of the glass parallel world (S5-S11), the parallax rig, and a full re-audit. Execution order is defined in `ARENA_LAUNCH_PROMPT.md`.

You are acting as three people at once: a principal real-time graphics engineer, a senior UX/interaction architect, and a motion/graphic designer. Your job is to close the gap between the current build and the official reference by diagnosing the real causes and shipping the fixes. Do not write another planning report.

Companion files you must read first:
- `docs/lusion-fix/01_CODE_LIBRARY.md` — original design code (shaders, systems, harness). Adapt it to the repo, do not paste blindly.
- `reference/TIMELINE_OFFICIAL.md` — scene map with timestamps.
- `reference/official/` — frames of the TARGET (official site recording, 1440-wide crop, browser chrome removed).
- `reference/current-build/` — frames of the CURRENT build (this repo, recorded by the product owner).
- `reference/side-by-side/` — 12 labelled pairs, TARGET left, CURRENT right. Open all 12 before writing code.

Branch: continue on `arena/c8775c5f-website-cloner-jp`. First verify that the Task 1 hero-crosses work (from `arena/abde912a-website-cloner-jp`) is present in this branch. If it is missing, bring it in (merge or cherry-pick). Do not reset or discard anything.

Do not fetch lusion.co. Clean-room rules still apply: original code, original procedural assets, licensed or public-domain models with provenance in `docs/ASSETS.md`. No Lusion assets, no commercial fonts.

---------------------------------------------------------------------
## 0. HOW TO WORK (non-negotiable)

1. Work milestone by milestone: M0, M1, ... M9. Commit after each (`fix(M#): ...`). Do not stop between milestones to ask for approval.
2. Priority if you run short on time: M5, M4, M3, M6 (broken or missing scenes) BEFORE polish (M1, M2, M7, M8).
3. Every milestone ends with a VERIFY LOOP:
   a. Capture the scene with `scripts/capture-sequence.mjs` (see code library section L) at 1440x900 with the FULL pipeline forced (`?quality=high`). Print which pipeline each capture used. If you can only test on software rendering (SwiftShader), say so explicitly and do not claim the look of bloom/shadows/MSAA was verified unless the forced full pipeline actually ran.
   b. Build a side-by-side against the matching file in `reference/official/`.
   c. Write a numbered difference list with severity (HIGH / MED / LOW). Fix every HIGH and MED. Recapture. Repeat at least 3 passes or until no HIGH remains.
4. A TypeScript pass or green build is NOT visual proof. A numeric similarity score is NOT visual proof. Look at the images.
5. Motion cannot be verified from one still. For every scroll-driven scene capture a sequence (10+ frames across the scene) and check continuity (no pops, no empty frames, no scale jumps) in forward AND reverse scroll.
6. Never leave a frame empty. If any capture in the sequence shows a blank canvas, that is a HIGH defect.
7. Report honestly. Separate verified from assumed.

---------------------------------------------------------------------
## 1. DEFECT REGISTER (what the product owner found, with root-cause hypotheses)

Scene numbers (S#) refer to `reference/TIMELINE_OFFICIAL.md`.

| ID | Sev | Scene | Official (target) | Current build | Likely root cause |
|---|---|---|---|---|---|
| D-01 | CRITICAL | S11 monitor reveal | The blue-white room is shown INSIDE a dark monitor (thin bezel, stand at the bottom). The camera pulls back, the astronaut floats in front of the screen content and glass shards burst outward over the screen. | The monitor screen is an EMPTY dark rectangle. The stand is drawn on top of the astronaut's torso, so the astronaut appears as legs under the stand. Only a few tiny shards. | Screen content is not being rendered into the monitor. The world layout and depth order are wrong (stand in front of the astronaut). Astronaut is not placed inside the screen volume. |
| D-02 | CRITICAL | S12 sticker CTA | After the shards, a dark scene: astronaut front-on, glass-crystal bokeh, glossy white-outlined stickers (heart, smileys, mushroom, lips, popsicle, skeleton, banana, lollipop, 3D glasses), giant "Let's work together!" | Not present in the recording; the build goes from the monitor straight to the "About us" footer transition. | Scene missing or never reached. |
| D-03 | HIGH | S5-S6 headline to tunnel | The headline is crisp pure white. Words and letters spread apart as you scroll. The astronaut shrinks and falls away while the tunnel is revealed OUT OF DARKNESS: sparse dots, then thin lines, then the full lattice with glints. | The headline is dim grey (about 45% opacity). A thick tan halo ring sits behind the astronaut. The truss tunnel is simply there, fully lit, with no reveal. | Text opacity tied to wrong variable or blend mode. Ring shader too wide and opaque. No reveal uniform on the tunnel. |
| D-04 | HIGH | S6 truss tunnel look | Almost black. The structure reads through faint metallic edge highlights and hundreds of bright thin glint panels with star bloom. A faint rainbow ring flare hugs the edges. | Evenly lit blue-grey I-beam truss with orange glow on the sides. No glints, no stars, no ring. It looks like a stock corridor. | Wrong lighting model (flat fill), no HDR emissive glints, no bloom threshold strategy. |
| D-05 | HIGH | S4 Earth | Deep navy night-side ocean, thin crisp bright-blue limb, black space, sun glare behind the helmet. | Bright daylight Earth covered in white clouds. | Earth shader too bright, clouds too strong, sun term wrong. |
| D-06 | HIGH | S15-S16 About hero | Dense plume of glossy lit spheres (power-law sizes, a few large out-of-focus bokeh orbs). Solid white giant "LUSION" wordmark. Craggy grayscale moonscape with fine rocky detail, a light beam rising from the ground to the plume, tiny astronaut walking. | Plume is dark chunky boulders. Wordmark is a HOLLOW OUTLINE. The terrain is smooth rolling dunes with a plastic look. The contour scene is almost empty black. | Wrong particle material and size distribution, wordmark styled with stroke instead of fill, terrain lacks ridged detail and rock normal, contour scene has no content. |
| D-07 | HIGH | S2-S3 reel card and cards | A red blob-shaped card whose corners wobble like cloth, holding three phone mockups. It expands into a full-bleed vivid vortex video with "PLAY REEL". Project cards and thumbnails bend and skew with scroll velocity. | A flat red rectangle with blurry phones. Project cards are flat. | Missing morph (border-radius/clip-path) and missing scroll-velocity warp system. |
| D-08 | MED | S1 hero | Blue / white / black crosses only. Pieces spread across the whole panel, are large, and rearrange/tumble as the pointer moves. | Red pieces appear in the build and never in the official footage. The pieces sit in a tighter cluster. Pointer interaction is not visible. | Extra color variant, composition too tight, no pointer-driven spring physics. |
| D-09 | MED | S8 pink lattice | Dense glassy wireframe tunnel (pink/magenta/teal), very bright core, thousands of tiny facets. | Sparse purple diamond lattice with glowing strips. | Too little geometric density and no glass/refraction look. |
| D-10 | MED | S9-S10 white flash and blue room | A soft white/lavender organic flash, then a blue room with big white elliptical cut-outs and strongly lit white portal panels with bloom. | Blob/flower shapes, no lit portal panels, no flash. | Missing emissive portal panels, wrong cut-out geometry, missing transition. |
| D-11 | MED | S18 services | Blue page with large white playing-card style "STRATEGY" cards, ornamental card backs, cards tilt and flip in 3D. | "Area of expertise" glass tiles with icons. Different design language. | Different component. |
| D-12 | MED | S17 awards | Giant ghost-outline words (AWARDS, MULTI-DISCIPLINARY...) scrolling behind a ruled table, a logo marquee. | Not seen in the recording. A boxed awards list was seen on About. | Missing treatment. |
| D-13 | LOW | S19-S20 CTA dots | A full-width wave of white dots/shapes along the bottom that is pushed by the pointer. A light variant uses multicolour confetti shapes. | A small white triangular mound. | Too small, no pointer field. |
| D-14 | LOW | global | Custom cursor (dot plus lagging ring), audio-wave nav icon, "L" pixel-block loader. | Close but not matching timing. | Polish. |

What is already good (keep it, do not rewrite): the glossy hero crosses (mostly), the 3D tablet stencil portal, the page structure, the footer, the loader concept, the navigation.

---------------------------------------------------------------------
## 2. DESIGN SYSTEM

Colors (sampled from official frames):
- Page light: `#f0f0fa`
- Brand blue (CTA/services pages): `#3834ed`
- Black: `#030500` (never pure `#000` on large areas except space scenes)
- Ink on light: `#0a0a0f`
- Cyan ribbon: light cyan around `#8ff0f0` (sample it from `official_t016s.jpg`)

Typography (open-license geometric grotesk substitute already in repo is fine): headings light/regular weight (300 to 400), tracking about `-0.02em`, tight line-height `0.95 to 1.05`; labels uppercase `0.04em`; the About wordmark is a SOLID fill, weight 500, about `21vw`, line-height `0.8`, tracking `-0.04em`.

Motion language (this is what makes it feel expensive):
- Everything eases. Nothing snaps. Use critically damped smoothing for continuous values (`damp(current, target, lambda, dt)`; lambda 3 to 8) and `easeInOutCubic` / `easeOutExpo` for one-shots.
- Scroll is smoothed (Lenis-style, lerp about 0.085). All scroll-driven scenes read ONE shared scroll state with `progress`, `velocity`, `direction`.
- Velocity-reactive: cards bend, text tracking breathes, ring flare intensity and glints react to scroll velocity.
- Depth: at least three parallax layers in every dark scene (foreground bokeh/shards, subject, background).
- Everything has idle motion (astronaut drift, crosses drift, plume flow) so frames are never static.
- Film feel: add a very light grain/dither pass on dark scenes (opacity 0.03 to 0.05) to remove banding on gradients.

---------------------------------------------------------------------
## 3. MILESTONES

### M0. Foundations (do first, keep small)
- M0.1 Check what scroll/animation libs the repo already uses (`package.json`). Reuse them. If there is no smooth-scroll engine, add one (code library A). Create ONE shared `scrollState` (progress, velocity, direction) and make every scene subscribe to it. Remove competing scroll listeners.
- M0.2 One renderer per canvas, one rAF per canvas. Add a `?quality=high|medium|low` URL flag that forces the full desktop pipeline (MSAA composer, bloom, shadows) even on software rendering; expose `window.__pipeline = {tier, msaa, bloom, shadows, ao, dof, software}` for the harness.
- M0.3 Add `scripts/capture-sequence.mjs` and `scripts/sbs.mjs` (code library L).
- M0.4 Add design tokens (colors, easings, damping constants) in one file.

### M1. Hero crosses (S1) polish
- Remove any red piece. Palette is blue `#1a22e0`, off-white `#e8e8f0`, near-black `#07070a`.
- Spread pieces across the full panel: 9 to 12 large pieces, the hero blue piece in focus, others cropped by the panel edges.
- Pointer interaction: spring-damper per piece plus pointer repulsion in world space, plus slow baseline tumble (code library C). Pieces must visibly react to pointer movement and relax back.
- Check the clearcoat strip reflections are present on black pieces (long thin white streaks).

### M2. Reel card, "Bold ideas", project cards (S2-S3)
- Replace the flat red rectangle with the blob-morph card (code library D): animated `border-radius` (8-value form) plus slight skew, 3 phone mockups with parallax offsets (center phone higher), then expand to full-bleed on scroll progress with `clip-path: inset()` easing, revealing a vivid original procedural vortex video/canvas (do NOT use Lusion footage; build a GLSL swirl) with "PLAY (button) REEL" type.
- Scroll-velocity warp on every project card and thumbnail (code library D).
- "Bold Ideas, Brought to Life": the blue stroke is a drawn path that animates its `stroke-dashoffset` with scroll; the duotone thumbnail cycles images with a soft crossfade.

### M3. Astronaut stage (S4-S5)
- Earth: replace with the night-limb shader (code library E): deep navy, thin bright limb, minimal low-contrast clouds only on the lit side.
- Headline: pure `#ffffff`, opacity 1, `mix-blend-mode: normal`. On scroll the word gaps and letter-spacing expand (see TIMELINE S5). The astronaut passes in front of "LET" (occlusion order: headline behind astronaut).
- Ring flare: replace the thick tan ring with the thin chromatic ring (code library F): warm inner edge, cool outer edge, intensity 0.25 to 0.4, radius about 0.5 of viewport height, widest on one side. It persists from S5 through S7 and fades out by S8.
- Check the astronaut against `reference/official/official_t018s.jpg` and `official_t019s.jpg`.

### M4. Tunnel sequence (S6-S10)
Build these as ONE continuous camera path driven by scroll, with the astronaut tumbling ahead of the camera.
- S6 Dark truss (code library G): near-black metal lattice, ONLY edge highlights from a camera-following point light and two env strips, FogExp2 near black, 300+ HDR glint panels with star bloom, faint ring flare. The tunnel REVEALS from darkness over the scroll range (sparse dots, then lines, then full lattice) while the astronaut shrinks to about 6% of screen height.
- S7 Color shift: glint and light palette lerps from white/cyan to red/orange plus teal across the scroll range.
- S8 Pink lattice: much denser geometry (instanced thin struts, 3 nested cells, tapered), glass-like look: clearcoat, thin-film iridescence, very bright core light, additive sparkle.
- S9 Flash: soft white/lavender organic wash (animated domain-warped noise gradient) bridging into the blue room. No hard cut.
- S10 Blue room: `#3834ed` walls, large white elliptical cut-outs (emissive white, not blobs), 3 to 5 lit white portal panels along the corridor with strong bloom, floor ring decals. The astronaut flies away from camera along the corridor.
- Transitions must be spatially continuous. No dark empty frames anywhere.

### M5. Monitor reveal and shards (S11) ← CRITICAL, fix D-01
Do it exactly like this (details in code library H):
1. Render the blue room into a `WebGLRenderTarget` (MSAA, half-float).
2. Create the monitor as real geometry in the main scene: thin black bezel (rounded rect extrude), a screen plane at `z = 0` textured with the render target, a stand BEHIND the screen plane (`z < 0`) and below it.
3. Place the astronaut in FRONT of the screen plane (`z = +0.8` to `+1.2`), centered, about 62% of screen height, so the screen content reads behind him. The stand must never overlap him: it is behind and below.
4. Camera keyframes: start inside the room view (screen fills the viewport, FOV matches the room camera so there is no jump), pull back to a wide shot where the whole monitor and a dark surround are visible, then continue gently.
5. Shards (code library H): 600 to 1000 thin glass shards in several sizes, spawned at the screen plane, flying outward and toward the camera with rotation, deterministic from scroll progress (same scroll position gives the same frame), tinted blue/white with strong env reflection and one bright specular edge. They must overlap the monitor and the astronaut, giving depth.
6. Reverse scroll must reverse perfectly.

### M6. Sticker CTA (S12) ← fix D-02
- Dark scene, astronaut front-on facing camera with an LED-dot face on the visor.
- 40 to 60 glass crystals (octahedron/icosahedron, env-reflective, transmission faked with fresnel plus env) as out-of-focus bokeh in 3 depth layers with pointer parallax.
- Glossy stickers (code library I): ORIGINAL SVG artwork (heart, smileys, mushroom, lips, popsicle, skeleton, banana, lollipop, 3D glasses, pill) with a thick white outline, soft drop shadow and a diagonal glossy highlight. 3 depth layers, idle bob and rotation, scroll and pointer parallax, hover wiggle.
- Giant "Let's work together!" in the Lusion headline style, "IS YOUR BIG IDEA READY TO GO WILD?" kicker above, "CONTINUE TO SCROLL" pill below. A white section wipes in from below at the end.

### M7. About page (S14-S17) ← fix D-06
- Loader: black screen, white pixel-block "L" mark assembling block by block, then the page reveals.
- Plume (code library J): 12k to 20k instanced glossy spheres, size = pow(rand, 5) scaled, a few big bokeh orbs, flowing with a curl-like field, soft DOF, bright core. Silvery grayscale.
- Wordmark: solid white `LUSION`, parallax slower than the page, slides and fades as the terrain takes over.
- Terrain (code library J): craggy grayscale moonscape, ridged FBM displacement plus high-frequency rock normal, low sun angle, dust fog, a light beam from the ground to the plume, a tiny astronaut walking toward the beam (reuse the GLB at tiny scale or a simple distant silhouette), floating small rocks with DOF.
- Text blocks: "WE ARE / LUSION / A CREATIVE / PRODUCTION STUDIO" left in upright caps with the last line italic, "CRAFTING UNIQUE / DIGITAL EXPERIENCES" right in italic, line-by-line mask reveal.
- Contour scene: topographic contour lines that draw in with scroll, with the plume's glow behind. Not empty.
- Awards/Articles/Talks: giant ghost-outline words (stroke only) drifting behind a ruled table with row hover highlight, plus a partner-logo marquee made from original text-only placeholders (no real brand logos).

### M8. Services and CTA (S18-S19)
- Services: blue `#3834ed` page with 4 large white playing-card style cards ("STRATEGY", "CREATIVE", "TECH", "PRODUCTION"), ornamental line-art card backs (original pattern), cards tilt in 3D on pointer, flip on scroll.
- CTA dots (code library K): full-width wave of white dots/shapes along the bottom (blue page) and multicolour confetti shapes on the light page. Pointer pushes them and they spring back.

### M9. Hardening
- Performance: single renderer per canvas, pause rendering when off-screen (IntersectionObserver), `pixelRatio <= 2`, tiered quality, texture/geometry disposal on unmount, no per-frame allocations.
- Reduced motion: static final composition, no drift.
- Mobile 390x844 and tablet 768x1024: separate camera framing and reduced counts (not just a scaled desktop).
- No console errors, no failed requests, `npm run lint`, `typecheck`, `build`, `qa` all green.

---------------------------------------------------------------------
## 4. ACCEPTANCE CHECKLIST (all must be true, verified from captures)

- [ ] D-01: monitor shows the blue room, astronaut in front of it, stand behind and below, shards over everything; no empty dark screen at any scroll position.
- [ ] D-02: the sticker CTA exists, with astronaut, crystals, stickers, and headline.
- [ ] D-03/D-04: headline is crisp white; tunnel reveals from darkness; glints with star bloom are visible; ring flare is thin and chromatic.
- [ ] D-05: Earth is a dark night limb.
- [ ] D-06: plume uses glossy spheres; wordmark is solid; terrain is craggy; beam and walking astronaut exist; contour scene has content.
- [ ] D-07: blob-morph reel card; cards bend with scroll velocity.
- [ ] D-08: no red crosses; pieces react to the pointer.
- [ ] D-09/D-10: pink lattice is dense; white flash transition; blue room has lit portals.
- [ ] D-11/D-12/D-13: services cards, awards ghost type, CTA dot field implemented.
- [ ] Forward, reverse, fast-scroll and direct-jump all deterministic (same scroll position gives same frame).
- [ ] No blank frames in any captured sequence.
- [ ] Every capture is labelled with the pipeline used. Software-only verification is disclosed.

---------------------------------------------------------------------
## 5. FINAL REPORT FORMAT

1. Root causes found (per defect ID, one line each).
2. Per milestone: files changed, commit SHA, captures (paths), final difference list (what still differs).
3. Pipeline disclosure per capture (full vs degraded, hardware vs software).
4. Performance numbers actually measured, and which are only estimated.
5. Asset provenance and licenses (`docs/ASSETS.md` updated).
6. Anything not finished, with the reason.

Do not claim similarity you did not verify from images. Do not fabricate results.