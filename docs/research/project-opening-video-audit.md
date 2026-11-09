# Project-opening film comparison — audit update

**Scope:** audit only; no application behavior changed. This report supplements the [full-experience audit](full-experience-fidelity-audit.md), which contains the all-page inventory, all 19 case-study rows, architectural handoff plan and F01–F19 recommendations. Read this update first for the newly supplied opening film and F20–F24 findings.

## 1. What the new reference changes

The supplied [lusion-project-opening.mp4](https://github.com/Jithin-J-Nair/Website-Cloner-JP/blob/arena/4d2e0450-website-cloner-jp/public/videos/lusion-project-opening.mp4) **does show project clicks and reverse navigation**. The earlier `Lusion-project.mp4` overview did not establish these states. The new footage upgrades the opening/reverse findings from source-backed mechanics to **visible recorded behavior**.

It also reveals a major additional discrepancy: **Atlas Motion opens on a dark charcoal page in the reference, while the current build opens on a pale background with black text.** A correct zoom into the wrong destination theme would still be visibly wrong.

### Verified input and build identity

| Item | Identity / scope |
|---|---|
| User-uploaded film commit | `330faf5afd5128d9c088da22fd40611721582507`; fast-forwarded into the same active branch. Its only change is the new video. |
| File | `public/videos/lusion-project-opening.mp4`, **18,342,312 bytes** |
| Git blob | `74184f425cf6cc93e57151d3eb6174899447dd7a` |
| SHA-256 | `c3fbb8e8fb41691c0e9e9245cdd0a9238509d3b6da8b8eb657ae2d31c175319d` |
| Encoded video | **24.57 seconds, 1920×1080, 60 fps**; includes browser chrome and black recording margins. This is not a 1920×1080 CSS viewport. |
| Current application | Unchanged application commit `203e5a6`, port **3003**, Next build **`TZ8s1xwpgRD_kZgq9MSFp`**. Documentation/video commits are not new application builds. |
| Fresh runtime verification | **22 HTML responses + 27 JS/CSS assets** again matched the shipped fingerprint. No server restart or rebuild. |
| Fresh normal-motion reproduction | Home→Oryzo→interior scroll→Back; Home→Atlas→Back, at **1720×912**. This approximates the recorded content area; source CSS viewport/DPR/input events were not instrumented in the film. |

The film was inspected through its overview and dense opening/reverse frame sequences. The reproducible extraction saves **68 timestamped samples** in five groups. Timestamps below are **approximate film positions**, not browser click-event timestamps or measured easing constants. Exact native equations/durations are attributed separately to the inspected archived source.

Fresh live text fetches of [Home](https://lusion.co/), [Projects](https://lusion.co/projects), [Oryzo](https://lusion.co/projects/oryzo_ai) and [Atlas](https://lusion.co/projects/atlas_motion) reconfirmed current content/order. Text extraction does not expose computed theme colors or certify live rendered WebGL. The supplied film is the rendered authority used here.

## 2. Recorded sequence, compared with the build

| Approximate film interval | What is actually visible | Current difference / required response |
|---|---|---|
| **0–7.5s** | Home **Featured Work**, not the archive heading. Hover moves between Atlas/right and Oryzo/left. Depth perspective/focus changes inside images; the hovered title's arrow enters from the left. | Depth hover/title strips already exist. Do not report them missing. Preserve their spring/DOF response; attach a distinct selected state at click instead of increasing hover strength. |
| **7.5–8.2s** | Oryzo's surrounding heading/description/card labels fade before the image finishes expanding. Header controls remain separately visible. | Current source has no selected-route DOM disclosure layer. Add **F20**: scoped DOM alpha separate from the GPU list and persistent header. |
| **8.2–8.7s** | Oryzo expands/recentres; Atlas remains visible briefly at the right edge. The view is not a flat full-screen copy of Oryzo's rectangle from the first frame. | **F01:** transform the list's shared coordinate system, retain the live depth image, and let neighbours exit through that transform. Do not hide all neighbours immediately or use an isolated CSS thumbnail clone. |
| **8.7–9.1s** | The enlarged cup scene blends into Oryzo's dark project-color plate. | The native fragment program has depth-sensitive blending into `colorBg`; connect it. This is not an opaque black route curtain, circular wipe or particle explosion. |
| **9.1–10.2s** | A dark handoff interval precedes the readable case title/metadata and first gallery film. The gallery is a different composition from the source thumbnail. | **F03/F21/F23:** align page/content disclosure, screen/media readiness and playback. Do not interpret the transition as thumbnail→first-film shared-element geometry or force immediate full content at zoom completion. |
| **10.5–16.3s** | The Oryzo film plays; later the page travels horizontally through multiple panels while the fixed header remains. | Preserve desktop horizontal document-driven travel and real film assets. The rotating coaster, particles/cloth-like sequence and product scenes **inside the media panels are embedded film content**, not evidence of missing page-level rigid bodies/cloth/particle simulations. Compare their playback time before judging them. |
| **16.3–17.2s** | Back is activated from an interior gallery position; case content fades to the dark plate. | Do not assume reverse is only from the first panel. Pause/release gallery input and disclose the origin transaction independently of current reel scroll. |
| **17.3–18.4s** | Oryzo's cup image re-emerges enlarged, shrinks into the **Home featured grid**, then surrounding text returns. | **F02/F20:** preserve Home origin and selected ID, restore the card-relative anchor, reverse the list/depth state, then restore DOM content. Current build goes to `/projects` at Y=0 instead. |
| **19.2–20.3s** | Atlas is selected from the **right column**. The list recentres the opposite way, clouds/logo grow toward the viewport, then blend to dark charcoal. | Exercise both horizontal origins. A fixed transform origin or a reused left-card pivot will be wrong. The Atlas fog target must agree with the reference destination theme (**F22**). |
| **20.3–21.8s** | Atlas title/metadata emerge on a dark page; the first media film is also present and playing. | Current Atlas is light. Correct the theme data/handoff chain, not just the transition overlay. Avoid using unrelated media frames as proof of a different 3D renderer. |
| **22–24.57s** | Atlas continues playing, with a dark page and light metadata. | Validate the settled theme, not merely a dark intermediate transition frame. The film does not show Atlas reverse, mobile, next-case activation or all other routes. |

Small colored/slender shapes appear in the dark intervals. Their exact origin is **not established** by the recording alone; do not invent a confetti/particle system or deliberately reproduce a possible transient rendering/loading artifact. The source-supported list/depth/background/disclosure behavior is sufficient to specify the main transition.

### Fresh current-build results

| Scenario | Selected source stage | Outcome |
|---|---|---|
| Home→Oryzo, normal motion | X **86**, Y **228.33**, W **756.80**, H **491.91** CSS px | Generic route phases; connected post-click DOM width ratio **1–1**. Case opens. Scrolled to **Y=2427**, then explicit Back returns to **`/projects`, Y=0**, not Home. |
| Home→Atlas, normal motion | X **877.19**, Y **228.33**, W **756.81**, H **491.92** CSS px | Generic route phases; connected post-click DOM width ratio **1–1**. Case opens in the **light** theme. Back returns to **`/projects`, Y=0**. |

Both flows had **zero uncaught browser errors and zero HTTP responses ≥400**. Opening screencasts contain **37 / 38 frames**, reverse screencasts **24 / 22 frames**. These are sparse software-rendering observations, not source-frame-rate matches. Width stability alone does not establish GPU behavior; the missing selected transform/uniform connection is independently confirmed in active source.

**Harness correction:** the first attempt failed because CDP emitted no initial frame for an unchanged settled page. It is not counted as a completed observation. A real one-pixel pointer nudge before awaiting the screencast bookend supplied compositor damage; the final two-flow run completed successfully without suppressing browser errors or weakening route/readiness checks. This is not a reported website defect.

## 3. Precise fixes newly established or sharpened

### F20 — P1: DOM fade and live-image zoom need separate layers

**Evidence:** film ~7.8–8.3s and ~17.8–18.4s; archived `PageManager.update`, local inspection lines **47190–47245**. For specialized navigation, it changes the pages DOM wrapper's alpha while its separately rendered project images remain active:

```text
outbound DOM alpha = fit(source.hideRatio, 0, .5, 1, 0)
inbound DOM alpha  = fit(destination.showRatio, .5, 1, 0, 1)
```

**Current:** the generic transaction makes content inert and paints its aperture; it does not supply specialized DOM fade progression. The depth image and editorial text cannot reproduce this sequence by sharing one opacity.

**Required change:** retain one shell-owned transaction; supply a selected-route DOM disclosure layer plus the participating list compositor. Keep the persistent header separate. Fade the source heading/disclaimer/labels without fading or stopping the selected mesh. Reverse the relationship when returning to the list. Ensure the hidden DOM cannot be activated; reduced mode remains readable without a delayed fade.

**Acceptance:** metadata disappears early while the image/neighbour geometry is still visibly moving; returning labels emerge only after the selected image is substantially back in place. No duplicated header, black curtain or opacity applied twice.

### F21 — P1: separate panel visibility, readiness, fullscreen and screen disclosure

**Evidence:** archived `ProjectDetailsItem` **38535–38835** and `ProjectDetailsScreen` **37668+ / 37905+**; active `CaseStudyGraphics.ts` / `CaseStudyMotion.ts`.

The current panel fragment samples a decoded image/video directly, uses a single `uReveal` for both crop and aperture, and skips unready media. The native program distinguishes:

- **Visibility-active ratio:** one-second `expoOut` window, reset offscreen; UV zoom `.6→1`.
- **Fullscreen geometry:** aperture size uses `max(isFullscreen, activeRatio)`. Fullscreen panels should **not** start with the same reduced-size aperture as ordinary panels; their UV zoom can still progress.
- **Readiness:** a separate `u_readyRatio` advances after the native texture-ready condition and blends project highlight color→image. Use an explicit real decode/upload criterion in this app; do not regress its safer error handling by treating a newly constructed video texture as decoded.
- **Page opacity / screen state:** panel opacity and whole-screen shadow activity follow page disclosure. Native screen `u_activeRatio = projectPage.activeRatio`; its preview background threshold is independent of a panel's visible-time counter.

**Required change:** add distinct measured state for these roles. Preserve safe DOM fallback when media genuinely fails. Do not make a black-texture/failed-media state indistinguishable from the native highlight reveal, or let elapsed offscreen/loading time consume every reveal before decode. Keep the existing RGB foliage channel pipeline; it is already implemented.

**Acceptance:** ordinary and fullscreen panels enter with their correct masks, visible media never flashes an undecoded texture, slow readiness blends coherently, and shadow/preview colors follow the same lifecycle as the page. Test opening, interior re-entry, next-project and context restoration. The source confirms these structural differences; the film does not provide a slow-load/fullscreen exhaustive comparison.

### F22 — P1: Atlas destination theme conflicts with the supplied film

**Observed:** the reference remains dark at ~21.8–24.57s, not just during handoff. Current `opened.jpg` is visibly pale with black title/copy. A quiet reference background patch at 22.5s is approximately RGB **24/24/24** after video compression; this is an image observation, **not a claim that the source CSS token is exactly `#181818`**.

**Cause in active data:** `src/data/reference/current-live-projects.json` sets Atlas card `colorBg = #f0f1fa`, `colorText = #000000`; its detail theme repeats those values, with blue highlight and `shadow = .9`. `src/data/reference/index.ts` uses that theme to assemble the preceding case's next-preview data. Those values reproduce the current light appearance, not this film.

**Required change:** establish the current reference computed role values, taking the provided rendered footage as stronger appearance evidence than stale theme assumptions. Update Atlas **card depth/fog target, detail background/ink/highlight/button/icon roles, incoming preview theme and relevant shadow contrast together**. Verify direct entry and Home/archive selection, not just Oryzo→Atlas. Do not globally invert all cases or change JITHIN branding/fonts to hide this mismatch. Do not overwrite the immutable historical capture merely to change active theme data.

**Acceptance:** Atlas is dark and legible after the transition settles; cloud zoom ends in that same theme without a dark→light flash; Oryzo's next preview and other incoming links agree; launch/Back/menu controls retain correct contrast. Exact tokens/shadow strength require additional rendered/computed-style inspection; they cannot all be recovered from a compressed frame.

This finding is specifically verified for **Atlas**, not a claim that every case theme is wrong. Oryzo's basic dark background/light ink direction already agrees with the film.

### F23 — P1: render preparation and film playback need different permissions

**Evidence:** `ProjectPreviewVideo.tsx` allows playback when visible and `!isTransitioning`; `RouteTransitionMotion.routeCommitted()` clears `isTransitioning` during **preparing**, before the generic transaction is idle. Native `ProjectDetailsItem.playPauseVideo` is driven by `pagesManager.isIdle` (**38740+**).

Consequently current destination films can advance **under the cover/preparation phase**. The current stills show different film moments from the reference, but a still alone cannot measure the time offset; the active permission path establishes the structural mismatch.

**Required change:** separate `canRenderDestination` from `canAdvanceMedia` and `canAcceptScroll`. Destination geometry/first texture can initialize under cover without advancing the film timeline or accepting gestures. Release actual film playback at the intended idle/disclosure boundary. Preserve natural resume for a paused visible film; do not reset every video's `currentTime` on every hover/menu change.

**Acceptance:** slow preparation does not consume the introductory movie before it becomes visible; visible playback resumes at the intended boundary; offscreen/menu/modal/hidden/reduced policies remain intact. Record video `currentTime`, readiness, pause state and transaction phase during validation. This addresses scene continuity without rebuilding embedded films as Three.js physics.

### F24 — P2: two case-study text panels lack the native progressive emphasis

**Evidence:** native `ProjectDetailsItem` text path **38535+ / 38800+** uses a position-encoded text texture and a `u_textRatio` that progresses while its normalized viewport position is between **.2 and .8**. It resets offscreen; speed is **`50/max(30, content.length)`**. The current text path in `LusionProjectDetailView.tsx` renders a static semantic paragraph, and `CaseStudyGraphics` only composites `video,img`.

**Affected cases:** `of_the_oak` and `worldcoin`, one special text panel each. This is a **source-confirmed gap**, not a newly filmed state in the opening reference.

**Required change:** add scoped progressive word/glyph emphasis driven by the existing case owner and viewport position. Retain semantic DOM text and permitted fonts; do not enable commercial font files or rasterize away accessibility. A layered/masked DOM solution is acceptable if it matches the reference weighting; reduced/fallback states should remain fully readable.

**Acceptance:** exact copy/font-size constraints survive; emphasis progresses only in the native active region, resets/re-enters predictably, and does not alter panel measurement, overflow or scroll ownership.

## 4. The selected-image geometry remains the first implementation task

F01–F04 in the full report remain valid. For the **measured current 1720×912 card geometry**, the archived transform equations imply approximately:

- viewport-cover factor **2.273**, with native **1.2** overscan → final list scale **2.727**;
- left-card horizontal centre offset **+395.6px**, right-card **−395.6px**;
- opposite Y/Z tilt, approximately **±.069 radians / ±3.95°** at maximum progress.

These are **calculated source targets for that geometry**, not camera/rotation measurements extracted from the film. Preserve the nested list pivot and DOM/world Y signs; the current orthographic card vertex placement does not automatically implement a parent transform. The camera-like sensation is produced by **list transform plus depth-map raymarch/focus/fog**, not evidence that a full 3D cup/cloud scene must be reconstructed.

A correct implementation must preserve the live source renderer across Next subtree replacement, carry selection/origin through case chains, wait for a valid destination frame/fallback, and release all retained resources on completion/cancellation. Do not globally pause the participant, double-overlay generic and specialized modes, or add a second scroll/transition owner. The [full architecture plan](full-experience-fidelity-audit.md#implementation-architecture-for-f01f04) gives the ownership sequence.

## 5. Whole-site disposition after the new evidence

| Page/effect family | Audit status / remaining action |
|---|---|
| **Home featured and archive selected opening** | F01/F02/F20 highest priority. New film directly covers Home left/right and Oryzo reverse; archive shares the implementation but is not depicted opening in this film. |
| **All 19 detail pages** | Shared F03/F04/F21/F23; retain desktop horizontal/mobile vertical layouts, fullscreen counts, real media and RGB foliage. F22 additionally confirmed for Atlas; F24 for the two special text routes. All canonical case rows/panel counts remain in the full report. |
| **Home opening/editorial/tunnel/vortex/astronaut** | F15–F17 protected/evidence follow-up. New film does not certify their lighting, collisions, particles, camera paths or downstream timing. Do not retune praised scenes from unrelated thumbnail/embedded-film frames. Legacy broad Home validator remains historically red; not rerun or claimed fixed. |
| **About terrain/particles/team/camera** | F10/F11 local shadow/fog/camera adaptations still require matched reference comparison. The new film adds no About evidence. |
| **About awards/expertise/contact** | F12–F14: existing native paint/ribbons/card/hold-pour work remains; preserve it. No newly established defect from this film. |
| **Loading/menu/footer/cursor/hover polish** | F05–F08/F18 remain: real loader progress/rolling digits, footer entrances, backdrop residuals, fallback card styling and micro-interaction comparison. New footage strengthens the need to keep header chrome independent of the zoom; it does not certify unseen menus/footers. |
| **Fonts/branding/reduced/fallback/utility routes** | F19 intentional boundaries remain. Do not restore commercial fonts or undo JITHIN customization. Noncanonical utilities/external Labs are not magically covered by this 24.57-second film. |

Prior **44 route/viewport observations** on this unchanged build remain valid as reduced-motion layout/error inventory, not newly rerun motion comparisons. Prior full regression results are reused only with their original scope. The two fresh 1720×912 flows and fresh fingerprint comparison are additional evidence, not a claim to have filmed every route again.

### Delivery order

1. **One selected-list transaction:** F01/F02/F20, with origin/reverse and a live depth/fog handoff. Fix Atlas role data **F22** as part of validating the target color boundary.
2. **Destination lifecycle:** F03/F21/F23, separating layout/graphics readiness, DOM disclosure, scroll permission and film playback.
3. **Unified case chain:** F04, clicked/keyboard/end-scroll next paths and origin retained through the chain.
4. **Targeted remaining polish:** F05–F08/F24, then evidence-led F09–F18 calibration. Do not replace entire approved renderers.

Acceptance requires matched-phase reference clips for left/right/Home/archive/deep-card/reverse and the normal/reduced/fallback/cancellation matrix in the full report. Physical-phone/hardware-GPU and complete live mobile/reference motion remain **unverified**. No percentage-parity score or claim of “every difference proven” is justified.

## 6. Evidence and reproducibility

```bash
# Uses bundled inspection FFmpeg when present; otherwise set FFMPEG_PATH or install ffmpeg.
node scripts/extract-project-opening-reference.mjs

# Two normal-motion Home flows at the reference-like content size, with reverse recordings.
BASE_URL=http://127.0.0.1:3003 CHROMIUM_MULTIPROCESS=1 \
  OPENING_AUDIT_REFERENCE=1 \
  OPENING_AUDIT_OUT=temp/project-opening-video-audit/current \
  node scripts/audit-project-openings.mjs
```

Outputs remain ignored:

- `temp/project-opening-video-audit/reference/manifest.json` — file hash, encoded metadata and nominal frame sampling times; five `*-timeline.jpg` sheets and individual full frames.
- `temp/project-opening-video-audit/current/report.json` — normal-motion observations and actual trusted card-click timestamps.
- `current/reference-home-{oryzo,atlas}/` — before/opened/back states, Oryzo interior-before-Back, opening screencasts; `reverse/recording.json` and frames capture the explicit Back behavior.
- `temp/project-opening-video-audit/served-identity.json` — fresh 22/27 runtime fingerprint comparison.

Both scripts inspect files/the running app without editing application behavior. The extraction script needs FFmpeg and the existing `sharp` dependency; no new dependency was added. Browser samples use software graphics and cannot certify real-device performance. The existing full report remains the consolidated all-page checklist; this addendum corrects its earlier lack of a project-opening film and adds the newly established issues above.

### Repository validation

After the audit-tool/documentation changes: **ESLint PASS, strict TypeScript PASS, both script syntax checks PASS, diff whitespace check PASS**. The extraction completed with the hash/metadata above and both final normal-motion flows completed. No application rebuild, full regression rerun, physical-device test or new parity score is implied.
