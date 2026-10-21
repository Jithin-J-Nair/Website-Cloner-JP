# jithinrp.com — clone research & build report

Recreation of Jithin RP's personal portfolio (`https://jithinrp.com/`) inside this
Next.js template. Everything below was taken from the site's own markup, stylesheets
and scripts; no copy or imagery was invented.

- Target: `https://jithinrp.com/` (single landing page; the case studies, `/squads`,
  `/slot-booking` and `/memory/` are separate pages and are intentionally **not**
  rebuilt — links point at the live site).
- Clone entry point: `/` → `src/app/page.tsx` → `src/components/sites/jithinrp/Landing.tsx`
- Stack used: Next.js 16 (App Router, React 19), TypeScript strict, scoped CSS in
  `src/app/jrp.css`, no new runtime dependencies.

---

## 1. How the reference was obtained

`jithinrp.com` was not reachable from the build environment: the TLS handshake fails
and every public proxy tried (`allorigins`, `codetabs`, `cors.workers.dev`, `corsproxy.ai`,
`corsfix`) returned 5xx or refused the origin. Archive.org only holds a pre-2025
Framer-era capture, and urlscan.io has no capture.

The site's own source was located in the public repository
[`Prem1618-5/portfolio-inspiration-code`](https://github.com/Prem1618-5/portfolio-inspiration-code)
(branch `claude/jithinrp-website-clone-9bc16g`, folder `jithinrp-clone/`). Its
`index.html`, `site.css?v=84`, `landing.css?v=18` and `site.js?v=170` are the deployed
files (title, meta, OG tags, copy, asset hashes and the awwwards validator output all
match the live site). That folder was mirrored to a scratch directory and served on
`127.0.0.1:4000` as the **reference build** for all measurements and side-by-side
comparisons in this report.

A validator snapshot of the live page (`?showsource`) confirmed the same DOM order,
copy, `og-cover.jpg`, favicons, font preloads and the GA id `G-PJE1Q7TFEK`.

---

## 2. What was inspected

### 2.1 Structure and content order

`<head>` metadata (title/description/OG/Twitter/icons, GA), fixed navbar (signature
mark, `About Me · Contact · Works · Play Game · Resume`, sound toggle), a navbar spacer,
then: hero → pillars → kinetic marquee → Selected Works (pinned sideways strip) →
Gen AI Projects (draggable carousel) → About Me (+ awards row) → testimonials
(auto-scrolling loop) → contact → footer (local time, back-to-top), plus three project
dialogs (`#parcel-sorter`, `#undo`, `#stickskate`), a grain overlay, a reading-progress
rail, a cursor pill and a phone gate.

All copy (hero lede, pillar blurbs, case-study paragraphs, timelines, roles, tools,
testimonials, awards, footer line) was transcribed into
`src/components/sites/jithinrp/data.ts`.

### 2.2 Design tokens (from `landing.css` / `site.css`)

| Token | Value |
| --- | --- |
| Ink / muted / line / tile | `#000` · `60%` · `#e2e2e2` · `#ebebeb` |
| Container | `min(1340px, 100% - 2×gutter)` |
| Gutter / band padding | 50px (32px ≤ 1024px) / 100px (80px) |
| Body type | Aeonik 16/1.5 |
| Display type | Awesome Serif Italic, 52px / 1.2 (44px at 1024, 34px at 768) |
| Hero name | Geist Pixel, `min(290px, (100vw - 2·gutter) × .2164)` |
| Works grid | 323fr / 436fr / 323fr, media 436×569 (talls), 375×489 in the pinned view |
| Motion easing | `cubic-bezier(.22,1,.36,1)` (liquid) and expo-out elsewhere |

Fonts (`Aeonik-Regular`, `GeistPixel-VF`, `AwesomeSerifItalic-VF`) are self-hosted from
`public/sites/jithinrp/fonts/` and preloaded in `src/app/layout.tsx`.

### 2.3 Behaviour read out of `site.js`

- Loader: signature stroke `--p` (min 1.8 s, max wait 8 s) → sheet lifts.
  Fresh visits land on the Z-drawing water gate (`Enter`).
- Phones `< 768px` show the "Hey Mate, 9 years of work deserves a little more screen
  space" gate and stop; everything else is skipped.
- Motion starts after `Promise.all([fonts.ready, loaderDone])`: intro timeline,
  reading progress, `horizontalWorks()` (pin + scrub + jelly skew), story media
  entrances (`scale 1.3 → 1`, hidden state `y 90 / scale .86`), about trail, hero
  parallax/kinetics, liquid headings (blur 12 → 0, `scaleY 1.25 → 1`), reveals
  (`y 40 → 0`, 1.2 s, stagger 80 ms), marquee (70 → 1400 px/s, `--speed` rounds pixels),
  scroll lean (marquee ±10°, works ±4°, testimonials ±4°), footer.
- Modals: rise 40 px + backdrop fade, Esc/backdrop/close button, focus trap and scroll
  lock, gallery filled from `01–08.webp`.
- Sound: WebAudio bed at 0.22 master, hover rules (tool → tick, link → drop,
  `[data-href]`/`.ai-card` → bubble), `M` toggles, persisted in `localStorage.jrp-sound`.
- Reduced motion: `no-motion` class, marquee hidden, works left as a stacked list.

### 2.4 Not inspectable (recorded, not guessed)

- The live page over HTTPS (see §1) — the mirrored source was used instead.
- WebGL effects: the Z gate's ink/water shader, the fish-eye/ball lens, liquid page
  transitions and the "hold to open" tear, the about-photo glitch shader, and the
  liquid planes behind case-study videos. Their *parameters* are visible in `site.js`
  but their rendered output cannot be reproduced without Three.js/GSAP.
- The awwwards badge in the corner: it is not in the mirror's markup/CSS, so it is
  injected by a third-party script at runtime. It is therefore **not** reproduced
  (an earlier hand-drawn stand-in was removed rather than left as an invention).
- `?lite` variant and the post-navigation page transitions (they rely on a browser
  View Transition/session flag we do not ship).

---

## 3. What was implemented

`Landing.tsx` composes, in reference order: `Loader`, `MobileGate`, `Nav`, spacer,
`Hero`, `Pillars`, `Marquee`, `Works`, `GenAi`, `About`, `Awards`, `Testimonials`,
`Contact`, `Footer`, plus `ProjectModal` and `SiteRuntime`.

| Area | File | Notes |
| --- | --- | --- |
| Page shell, metadata, fonts, boot script | `src/app/layout.tsx`, `src/app/page.tsx` | title/description/OG/Twitter/icons, font preloads, `jrp-js` boot class, `suppressHydrationWarning` (the class is set pre-paint on purpose) |
| Design system | `src/app/jrp.css` | all tokens, loader, gate, nav, hero, pillars, marquee, works, carousel, about, awards, quotes, contact, footer, modal, cursor pill, progress, reduced motion |
| Loader + phone gate | `Loader.tsx`, `MobileGate.tsx` | signature stroke + `Enter` gate, sheet lift; `< 768px` gate |
| Nav | `Nav.tsx` | signature mark, anchor links, external resume/game, sound toggle (`M`) |
| Hero | `Hero.tsx` | masked word reveal, Geist Pixel name, meta row with `+`, LinkedIn chip, pixel-melt scrub, parallax |
| Pillars / marquee | `Pillars.tsx`, `Marquee.tsx` | hairline draws, kinetic pixel marquee with scroll-speed coupling |
| Selected Works | `Works.tsx` | `position: sticky` pin + `translate3d` (travel = rows − 1 viewports), per-card media entrance, jelly skew on words/facts, progress %, tool sprite |
| Gen AI | `GenAi.tsx` | draggable carousel with arrows + counter, drag inertia, `PlayOnVisible` videos |
| About / awards | `About.tsx`, `Awards.tsx` | photo, trail images that follow the cursor, three award rows |
| Testimonials | `Testimonials.tsx` | seamless loop (cards cloned twice), 40 px/s, hover/focus/drag easing + skew |
| Contact / footer | `Contact.tsx`, `Footer.tsx` | mail/LinkedIn/resume buttons, local Melbourne time, back-to-top |
| Project dialogs | `ProjectModal.tsx` | backdrop rise, Esc/backdrop/close, focus trap, scroll lock, 8-image gallery |
| Runtime | `SiteRuntime.tsx`, `runtime/sound.ts` | reveals, hairline draws, heading condense, progress rail, cursor pill + labels, smooth anchors, sound engine |
| Content model | `src/types/jithinrp.ts`, `data.ts` | every string, link, tool, modal, timeline |
| Assets | `public/sites/jithinrp/` | 53 files, 18 MB: hero/works videos + posters, AI previews/trailers, avatars, awards, about + trail photos, `tools.svg` sprite, fonts, `og-cover.jpg`, favicons, `audio/lofi-bgm.mp3` |

Deliberate implementation choices (no new dependencies): GSAP ScrollTrigger is replaced
by sticky positioning plus `requestAnimationFrame`, and Lenis by native scrolling with
rAF-driven follow effects; the WebGL liquid planes behind case-study media are
approximated with three layered radial gradients per work (`colors.a..d`).
`next.config.ts` (which already had `output: "standalone"`) gained
`allowedDevOrigins` so the sandbox preview can load dev chunks/HMR, and
`devIndicators: false` so the Next dev badge does not appear in previews.

---

## 4. Verification

### 4.1 Commands (repo scripts only)

```
npm run lint        ✅ 0 errors / 0 warnings
npm run typecheck   ✅ clean (tsc --noEmit)
npm run build       ✅ Next 16.3.5, static / and /_not-found
npm run check       ✅ lint + typecheck + build, exit 0
```

### 4.2 Side-by-side against the mirrored reference

The reference mirror and the clone were both driven in headless Chromium
(puppeteer-core + Chromium 153) at identical viewports, after the loader and gate.

**Document height** (identical at every width):

| Width × height | Reference | Clone |
| --- | --- | --- |
| 1440 × 900 | 9922 px | 9922 px |
| 1024 × 768 | 8190 px | 8190 px |
| 768 × 900 | 8776 px | 8776 px |
| 1440 (reduced motion) | 7716 px | 7716 px |

**Element boxes at 1440 × 900** (`x, y, w, h` — equal for every row):

| Element | Box |
| --- | --- |
| `.nav` | 50, 50, 1340, 36 |
| `.hero` | 0, 86, 1440, 731 |
| `.hero__lede` | 50, 186, 549, 134 |
| `.hero__name` | 50, 437, 1340, 290 (289.976 px type) |
| `.pillars` | 0, 817, 1440, 183 |
| `.marquee` | 0, 1000, 1440, 193 |
| `#works-title` | 50, 1293, 1340, 62 |
| first `.work__media` | 533, 1685, 375, 489 |
| `.genai` | 0, 6545, 1440, 1188 (ai card 50, 6915, 436, 718) |
| `#about` / photo | 0, 7732, 1440, 542 / 765, 7832, 625, 442 |
| `.awards` | 0, 8274, 1440, 160 |
| `.quotes` / quote card | 0, 8759, 1440, 512 / 50, 8859, 436, 312 |
| `#contact` / h2 | 0, 9271, 1440, 434 / 325, 9371, 790, 62 |
| `.footer` | 0, 9706, 1440, 217 |

At 1024 and 768 the same equality holds (hero name 207.744 px / 152.346 px, lede
28px/39.2, about photo 490×346 at 1024, stacked 704×498 at 768, awards 252 px tall at
768, etc.).

**Pinned Selected Works**: pin starts at y = 1456 and travels 4320 px (3 × 1440) at
1440 — the reference's `track.scrollWidth − innerWidth` yields the same distance.
Sampling scroll +0 / +1080 / +2160 / +3240 / +4320 gave identical card x-offsets on
both builds (`0,1440,2880,4320` → `-1080,360,1800,3240` → … → `-4320,-2880,-1440,0`),
and the progress rail read 16 / 24 / 32 / 40 / 48 % on both.

**Interactions checked**

- Loader → gate: signature stroke completes, `Enter` passes, hero settles; 0 console
  errors at 1440, 1024 and 768 on both builds.
- Nav hover/active: same computed colour, opacity and 24px row height.
- Sound toggle + `M`: `Sound on ↔ Sound off`, `aria-pressed`, `localStorage.jrp-sound`
  transitions `on/off` identically.
- Gen AI dialog: panel `290, 32, 860, 836` on both; gallery images resolve
  (`01.webp`, natural width 1200); body scroll locks; Esc closes; focus restored.
- Testimonials: 15 nodes (5 cards × 3) and `scrollWidth` 9440 px on both; 40 px/s loop.
- Gen AI carousel: `scrollWidth` 3216 on both, previous arrow disabled at the start.
- Case-study video autoplays when its row is pinned (`currentTime` 3.95 s,
  `preload="none"`, muted, loop) as on the reference.
- Heading condense: `#works-title .lline` goes `opacity 0 → 1`, `scaleY 1.25 → 1`,
  `blur 12 → 0`, and the h2 keeps its 62 px line box (no layout shift).
- Reduced motion: `no-motion` on `<html>`, marquee hidden, works stacked (no pin),
  identical 7716 px document.
- Phone gate: 390 / 430 / 600 / 767 px show the gate with the same copy and the
  LINKEDIN · RESUME · EMAIL row; 768 px and up gets the full page.

Bugs found and fixed during this comparison pass: Tailwind's `.container` was
overriding the 1340px max-width; the works pin height included an extra viewport; the
condense transform sat on the `<h2>` and added 16 px of page height; an extra
`p + p` margin pushed the About column down; marquee/testimonial clones accumulated on
re-mounts; the sound toggle lacked its `data-sound-toggle` hook; a hand-drawn awwwards
badge was removed (see §2.4).

---

## 5. Fidelity gaps

1. **No GSAP / ScrollTrigger / SplitText / Lenis / Three.js.** Scroll is native (no
   smoothed lerp), so inertial feel, sticky hand-off and scrub easing differ subtly
   even where geometry matches. Adding the same libraries would close this but was
   ruled out (new dependencies).
2. **WebGL liquid layer is not reproduced**: no water/ink gate, no drip edges on the
   loader, no fish-eye lens or ball cursor, no "hold to open" tear transition, no
   shader glitch on the About photo. Case-study media sits on layered CSS radial
   gradients instead of liquid planes.
3. **Page transitions** between the home page and `/slot-booking`, `/squads`,
   `/memory/` are not implemented; those links open the live site.
4. **Awwwards badge** is a third-party runtime injection and was omitted rather than
   faked.
5. **Sound** is a WebAudio approximation (bed + hover tick/bubble/drop from
   `audio/lofi-bgm.mp3`) rather than the reference's synthesised texture; levels and
   the `M` toggle match, timbre does not.
6. **SplitText line masks**: headings/paragraphs are revealed as whole blocks, so
   word/line-by-line stagger is coarser than the original.
7. First-load timing (loader minimum 1.8 s, sheet lift 1.1 s) is matched, but the
   Z-gate drawing itself is replaced by the signature gate, so the first interaction
   differs.
8. Assets are the site's own, but `about-trail/*.webp`, award marks and avatars are
   served at their source resolution; the clone's About photo has no shader treatment.

---

## 6. Notes

- Work happened on `arena/6b10411e-website-cloner-jp` (the session branch) even though
  the brief mentioned `master`; the PR targets `master`.
- No `.env`, token or private endpoint was added. GA is not enabled (`G-PJE1Q7TFEK`
  appears only in the reference notes above, not in the code).
- Comparison screenshots were captured in the ephemeral browser harness (headless
  Chromium at 1440×900, 1024×768, 768×900 and 390×844) and are not committed; the
  measurements in §4 are the reproducible evidence.
