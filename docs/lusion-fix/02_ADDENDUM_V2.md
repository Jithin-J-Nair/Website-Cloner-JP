# ADDENDUM V2 (overrides conflicting parts of 00_MASTER_PROMPT.md)

Why this exists: after the first fix pass the "glass parallel world" journey (astronaut falling through the tunnels, the blue room, the monitor, the glass break, the jump-out) still looks raw. The product owner also wants four agent skills studied and USED, a tesseract built for the tunnel worlds, a shader click-open transition, and a glowing card border. This file defines all of that. Where it conflicts with 00_MASTER_PROMPT.md (M3, M4, M5, M6), THIS FILE WINS. Where it conflicts with the official reference frames, the FRAMES WIN.

Hard rules for this whole addendum:
- Do not invent APIs, flags, package names or skill rules. If you are not sure, read the installed source (`node_modules/three/...`, the skill's SKILL.md) or the official docs, then write down what you verified.
- Do not ask for approval or clarification. Make the decision, record it in the log, continue.
- Every claim in your final report must point to a file, a capture, a command output or a measurement.

---------------------------------------------------------------------
## A. SKILLS PROTOCOL (Phase S: do this BEFORE writing any code)

Skills to install and study. Names and commands below were checked against the public repositories; the contents of each SKILL.md are NOT assumed, you must read them.

1. 3D engineering: `CloudAI-X/threejs-skills` (10 skills: threejs-fundamentals, -geometry, -materials, -lighting, -textures, -shaders, -postprocessing, -animation, -loaders, -interaction).
   `npx skills add CloudAI-X/threejs-skills`
2. Motion craft: `emilkowalski/skills` (note the plural "skills"; `emilkowalski/skill` is not the canonical repo). Read at least `emil-design-eng`, `animate`, `review-animations`, `improve-animations`, `animation-vocabulary`, `find-animation-opportunities`, `apple-design` (if a name is missing in the installed bundle, list what the bundle actually contains).
   `npx skills@latest add emilkowalski/skills`
3. Design taste: `Leonxlnx/taste-skill`. Install the default `design-taste-frontend`, plus `redesign-existing-projects` (this is an existing project), `high-end-visual-design`, and `full-output-enforcement` (stops truncated or placeholder output).
   `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend"`
   `npx skills add https://github.com/Leonxlnx/taste-skill --skill "redesign-existing-projects"`
   `npx skills add https://github.com/Leonxlnx/taste-skill --skill "high-end-visual-design"`
   `npx skills add https://github.com/Leonxlnx/taste-skill --skill "full-output-enforcement"`
4. UX/UI system: `nextlevelbuilder/ui-ux-pro-max-skill`. It needs Python 3 for its bundled scripts.
   `npx skills add https://github.com/nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max`
   Alternative installer if the above fails: `npx uipro-cli init --ai claude`. Use the skill's own data/scripts exactly as its SKILL.md instructs; do not guess flags.

If `npx skills` does not work in your sandbox, or your runtime does not auto-load installed skills:
- `git clone --depth 1 https://github.com/CloudAI-X/threejs-skills.git /tmp/skills/threejs`
- `git clone --depth 1 https://github.com/emilkowalski/skills.git /tmp/skills/emil`
- `git clone --depth 1 https://github.com/Leonxlnx/taste-skill.git /tmp/skills/taste`
- `git clone --depth 1 https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git /tmp/skills/uiux`
Then READ the relevant SKILL.md files in full and work from them. If the network blocks all of this, say so in the log, and continue using the rules embedded in this addendum.

Proof of study (mandatory): create `docs/lusion-fix/SKILLS_LOG.md` with, per skill: install command and its real output (or the clone commit SHA), the SKILL.md files you read, 5 to 10 concrete rules you extracted (quote at most one short sentence per rule, paraphrase the rest), and for each rule WHERE you applied it (file:line) or WHY it did not apply. Update the log at the end. A skill that was installed but has no applied rules in the log counts as NOT USED.

Precedence and conflicts:
- The official reference frames are the visual authority. Skills improve craft, they do not change the design language. Do not "redesign" the site into something else because a taste rule suggests it.
- Taste-skill has adjustable dials (look at the top of its SKILL.md). Set MOTION high; set variance and density to whatever matches the reference frames. Record the values in the log.
- Emil Kowalski's duration rules (for example short durations for UI micro-interactions) apply to UI interactions: hovers, buttons, menus, overlays. They do NOT apply to scroll-scrubbed cinematic scenes, which are driven by scroll progress and have no fixed duration. For the click-open transition (section C), choose durations deliberately, justify them in the log with the rule you used, and keep it interruptible.
- Use `review-animations` (Emil) as a gate on your own diff at the end of every milestone: list what it flags and fix it.
- Use `ui-ux-pro-max` for the UX layer: spacing, hierarchy, states (hover/focus/active/disabled), touch targets (at least 44px), contrast, reduced motion, keyboard and focus order on the overlay, responsive layouts. Record the checklist results.
- Use the CloudAI threejs skills as API truth for Three.js (lighting, PMREM, post, instancing, loaders, shaders). When a snippet in 01_CODE_LIBRARY.md disagrees with the installed three version or those skills, the installed version wins; fix the snippet and note it.

---------------------------------------------------------------------
## B. SHADCN COMPONENTS TO INTEGRATE

Project check first (do not assume):
- Read `package.json`, `tsconfig.json` (path alias `@/*`), `components.json` (shadcn), `tailwind.config.*` or Tailwind v4 CSS setup, and the global stylesheet. If shadcn is missing: `npx shadcn@latest init`. If Tailwind or TypeScript is missing, set them up following their official guides.
- Components go in `components/ui` relative to the alias root (in this repo most likely `src/components/ui`; confirm from `components.json`). The `@/components/ui/...` import path in the demos must resolve. Reason this folder matters: shadcn's CLI, the `@/components/ui` alias convention and every generated demo import depend on it, so keeping it avoids broken imports and keeps third-party UI code separate from app code.
- `three` is already installed (check the version, do not downgrade). `lucide-react` only if an icon is needed. No new image assets are required for these two components.

### B1. ShaderAnimation (file: `src/components/ui/shader-animation.tsx`)
Use the same fragment shader as the supplied component (same look). Fix the production problems of the supplied version (all are real, found by reading it):
1. `uniforms.time.value += 0.05` per frame makes the animation twice as fast on 120 Hz displays. Use elapsed time: `time = elapsed * 3.0 * speed` (3.0 equals 0.05 x 60 fps, so the look is unchanged at 60 Hz).
2. `renderer.setPixelRatio(window.devicePixelRatio)` is unbounded. Clamp to 2.
3. The render loop never pauses off-screen or in background tabs. Pause with IntersectionObserver and `document.visibilityState`.
4. No reduced-motion handling. If `prefers-reduced-motion: reduce`, render one still frame and stop.
5. Resize only listens to `window`. Use ResizeObserver on the container.
6. No WebGL context-loss handling and incomplete disposal. Handle `webglcontextlost`, dispose renderer, geometry, material, and `forceContextLoss()` on unmount; safe under React StrictMode double-mount.
7. Container is hard-coded `h-screen`. Let the parent size it (`className` prop, default `h-full w-full`).
8. Add `tint` (vec3, default white = original look) so it can be brand-colored, plus `paused`, `speed`, `maxDpr`.

```tsx
"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

type ShaderAnimationProps = {
  className?: string
  speed?: number            // 1 = original speed
  paused?: boolean
  tint?: [number, number, number] // multiplies the output color; [1,1,1] = original
  maxDpr?: number
}

const VERT = /* glsl */ `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
`

const FRAG = /* glsl */ `
  #define TWO_PI 6.2831853072
  #define PI 3.14159265359
  precision highp float;
  uniform vec2 resolution;
  uniform float time;
  uniform vec3 tint;

  void main(void) {
    vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
    float t = time * 0.05;
    float lineWidth = 0.002;
    vec3 color = vec3(0.0);
    for (int j = 0; j < 3; j++) {
      for (int i = 0; i < 5; i++) {
        color[j] += lineWidth * float(i * i) / abs(fract(t - 0.01 * float(j) + float(i) * 0.01) * 5.0 - length(uv) + mod(uv.x + uv.y, 0.2));
      }
    }
    gl_FragColor = vec4(color * tint, 1.0);
  }
`

export function ShaderAnimation({
  className = "h-full w-full",
  speed = 1,
  paused = false,
  tint = [1, 1, 1],
  maxDpr = 2,
}: ShaderAnimationProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const pausedRef = useRef(paused)
  const speedRef = useRef(speed)
  const tintRef = useRef(tint)

  useEffect(() => { pausedRef.current = paused }, [paused])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { tintRef.current = tint }, [tint])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const camera = new THREE.Camera()
    camera.position.z = 1
    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)
    const uniforms = {
      time: { value: 1.0 },
      resolution: { value: new THREE.Vector2() },
      tint: { value: new THREE.Vector3(1, 1, 1) },
    }
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: VERT, fragmentShader: FRAG })
    scene.add(new THREE.Mesh(geometry, material))

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, maxDpr))
    const canvas = renderer.domElement
    canvas.style.cssText = "display:block;width:100%;height:100%"
    canvas.setAttribute("aria-hidden", "true")
    container.appendChild(canvas)

    const resize = () => {
      const w = Math.max(1, container.clientWidth)
      const h = Math.max(1, container.clientHeight)
      renderer.setSize(w, h, false)
      uniforms.resolution.value.set(canvas.width, canvas.height)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(container)

    let visible = true
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }, { threshold: 0 })
    io.observe(container)

    let raf = 0
    let last = performance.now()
    let elapsed = 1 / 3 // matches the original starting value of 1.0 after x3
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      if (pausedRef.current || !visible || document.visibilityState === "hidden") return
      elapsed += dt * speedRef.current
      uniforms.time.value = elapsed * 3.0
      const [r, g, b] = tintRef.current
      uniforms.tint.value.set(r, g, b)
      renderer.render(scene, camera)
    }
    if (reduce) {
      uniforms.time.value = 6.0
      renderer.render(scene, camera)
    } else {
      raf = requestAnimationFrame(frame)
    }

    const onLost = (e: Event) => { e.preventDefault(); cancelAnimationFrame(raf) }
    const onRestored = () => { if (!reduce) { last = performance.now(); raf = requestAnimationFrame(frame) } }
    canvas.addEventListener("webglcontextlost", onLost)
    canvas.addEventListener("webglcontextrestored", onRestored)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener("webglcontextlost", onLost)
      canvas.removeEventListener("webglcontextrestored", onRestored)
      geometry.dispose()
      material.dispose()
      renderer.dispose()
      renderer.forceContextLoss()
      if (canvas.parentNode === container) container.removeChild(canvas)
    }
  }, [maxDpr])

  return <div ref={containerRef} className={className} style={{ background: "#000", overflow: "hidden" }} />
}
```
Keep the supplied `demo.tsx` pattern (relative container, overlaid text) as `src/components/ui/demos/shader-animation-demo.tsx` or in the repo's demo location; it is not part of the production UI.

### B2. GlowCard (file: `src/components/ui/spotlight-card.tsx`)
Keep the supplied visual: pointer spotlight on the card body, a bright colored border glow that follows the pointer, a white core, hue that drifts across the viewport width. Fix these real problems found by reading the supplied version:
1. `touchAction: 'none'` on every card blocks scrolling on touch devices. Remove it.
2. `background-attachment: fixed` plus `clientX/clientY` breaks inside any transformed ancestor and on iOS. Our project cards are transformed by the scroll-warp system. Use element-local coordinates: one shared pointer controller measures each visible card's rect and writes `--x`/`--y` in px relative to the card.
3. A separate `pointermove` listener on `document` per card. Use one shared controller with a single rAF flush and IntersectionObserver so only visible cards update.
4. A `<style>` tag is injected per instance. Put the CSS once in the global stylesheet.
5. The fixed grid/padding/aspect-ratio layout is wrong for wrapping existing project cards. Add `variant: "card" | "surface"`; `surface` wraps arbitrary content without padding, grid, aspect-ratio or backdrop blur.
6. Add a `brand` color (hue about 241, spread 40) matching `#3834ed`, and `radius` as a prop.
7. Respect `prefers-reduced-motion` (no hue drift) and `:focus-visible` (show the glow border for keyboard users).

`src/components/ui/spotlight-card.tsx`:
```tsx
"use client"

import React, { useEffect, useRef, type ReactNode, type CSSProperties } from "react"

type GlowColor = "blue" | "purple" | "green" | "red" | "orange" | "brand"
interface GlowCardProps {
  children?: ReactNode
  className?: string
  glowColor?: GlowColor
  size?: "sm" | "md" | "lg"
  width?: string | number
  height?: string | number
  customSize?: boolean
  variant?: "card" | "surface"
  radius?: number
}

const glowColorMap: Record<GlowColor, { base: number; spread: number }> = {
  blue: { base: 220, spread: 200 },
  purple: { base: 280, spread: 300 },
  green: { base: 120, spread: 200 },
  red: { base: 0, spread: 200 },
  orange: { base: 30, spread: 200 },
  brand: { base: 241, spread: 40 },
}
const sizeMap = { sm: "w-48 h-64", md: "w-64 h-80", lg: "w-80 h-96" }

// ---- one shared pointer controller for all cards ----
const registry = new Map<HTMLElement, boolean>() // element -> isVisible
let px = -9999, py = -9999, rafId = 0, bound = false, io: IntersectionObserver | null = null

function flush() {
  rafId = 0
  const vw = window.innerWidth || 1
  registry.forEach((visible, el) => {
    if (!visible) return
    const r = el.getBoundingClientRect()
    el.style.setProperty("--x", (px - r.left).toFixed(1))
    el.style.setProperty("--y", (py - r.top).toFixed(1))
    el.style.setProperty("--xp", (px / vw).toFixed(3))
  })
}
function onMove(e: PointerEvent) {
  px = e.clientX; py = e.clientY
  if (!rafId) rafId = requestAnimationFrame(flush)
}
function register(el: HTMLElement) {
  if (!bound) {
    window.addEventListener("pointermove", onMove, { passive: true })
    io = new IntersectionObserver((entries) => entries.forEach((en) => registry.set(en.target as HTMLElement, en.isIntersecting)), { rootMargin: "200px" })
    bound = true
  }
  registry.set(el, false)
  io!.observe(el)
}
function unregister(el: HTMLElement) {
  io?.unobserve(el)
  registry.delete(el)
  if (registry.size === 0 && bound) {
    window.removeEventListener("pointermove", onMove)
    cancelAnimationFrame(rafId); rafId = 0
    io?.disconnect(); io = null; bound = false
  }
}

export function GlowCard({
  children, className = "", glowColor = "brand", size = "md", width, height,
  customSize = false, variant = "card", radius = 14,
}: GlowCardProps) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    register(el)
    return () => unregister(el)
  }, [])

  const { base, spread } = glowColorMap[glowColor]
  const style = {
    "--base": base,
    "--spread": spread,
    "--radius": radius,
    width: width !== undefined ? (typeof width === "number" ? `${width}px` : width) : undefined,
    height: height !== undefined ? (typeof height === "number" ? `${height}px` : height) : undefined,
  } as CSSProperties

  const layout =
    variant === "card"
      ? `${customSize ? "" : sizeMap[size]} ${customSize ? "" : "aspect-[3/4]"} grid grid-rows-[1fr_auto] gap-4 p-4 backdrop-blur-[5px] shadow-[0_1rem_2rem_-1rem_black]`
      : ""

  return (
    <div ref={ref} data-glow style={style} className={`glow-card relative rounded-2xl ${layout} ${className}`}>
      <div data-glow className="glow-card__halo" aria-hidden="true" />
      {children}
    </div>
  )
}
export default GlowCard
```
Global CSS (add once to the global stylesheet; this is the supplied styling, with local coordinates):
```css
.glow-card {
  --border: 3;
  --size: 200;
  --outer: 1;
  --backdrop: hsl(0 0% 60% / 0.12);
  --border-size: calc(var(--border, 2) * 1px);
  --spotlight-size: calc(var(--size, 150) * 1px);
  --hue: calc(var(--base) + (var(--xp, 0) * var(--spread, 0)));
  border-radius: calc(var(--radius) * 1px);
  border: var(--border-size) solid var(--backdrop);
  background-color: var(--backdrop);
  background-image: radial-gradient(
    var(--spotlight-size) var(--spotlight-size) at calc(var(--x, -999) * 1px) calc(var(--y, -999) * 1px),
    hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 70) * 1%) / var(--bg-spot-opacity, 0.1)), transparent);
  background-attachment: scroll;
}
.glow-card::before, .glow-card::after, .glow-card__halo::before, .glow-card__halo::after {
  pointer-events: none; content: ""; position: absolute;
  inset: calc(var(--border-size) * -1);
  border: var(--border-size) solid transparent;
  border-radius: calc(var(--radius) * 1px);
  background-repeat: no-repeat; background-position: 0 0; background-attachment: scroll;
  mask: linear-gradient(transparent, transparent), linear-gradient(white, white);
  mask-clip: padding-box, border-box; mask-composite: intersect;
}
.glow-card::before, .glow-card__halo::before {
  background-image: radial-gradient(calc(var(--spotlight-size) * 0.75) calc(var(--spotlight-size) * 0.75) at calc(var(--x, -999) * 1px) calc(var(--y, -999) * 1px),
    hsl(var(--hue, 210) calc(var(--saturation, 100) * 1%) calc(var(--lightness, 50) * 1%) / var(--border-spot-opacity, 1)), transparent 100%);
  filter: brightness(2);
}
.glow-card::after, .glow-card__halo::after {
  background-image: radial-gradient(calc(var(--spotlight-size) * 0.5) calc(var(--spotlight-size) * 0.5) at calc(var(--x, -999) * 1px) calc(var(--y, -999) * 1px),
    hsl(0 100% 100% / var(--border-light-opacity, 1)), transparent 100%);
}
.glow-card__halo {
  position: absolute; inset: 0; pointer-events: none; will-change: filter;
  opacity: var(--outer, 1); border-radius: calc(var(--radius) * 1px);
  border-width: calc(var(--border-size) * 20); filter: blur(calc(var(--border-size) * 10)); background: none; border: none;
}
.glow-card__halo::before { inset: -10px; border-width: 10px; }
.glow-card:focus-visible, .glow-card:focus-within { --border-spot-opacity: 1; outline: 2px solid hsl(var(--hue, 241) 100% 70% / .8); outline-offset: 2px; }
@media (prefers-reduced-motion: reduce) { .glow-card { --spread: 0 !important; } }
```
Verify visually: the border glow must follow the pointer within the card's own box, stay correct while the card is bent by the scroll-warp transform, and not scroll-jump. If the halo layer looks wrong after the CSS port, compare with the supplied original (visible in the task message) and fix until the look matches.

Where to use GlowCard (variant="surface" unless it is a true card): project cards and thumbnails (frame), services/strategy cards, awards table rows and boxes, newsletter field, primary pills ("LET'S TALK", "OUR APPROACH", "SEE ALL PROJECTS"), footer link blocks. Do NOT put it on full-bleed scene canvases.

---------------------------------------------------------------------
## C. CLICK-OPEN TRANSITION (ShaderAnimation as the "open" effect)

Trigger: clicking a project card, "LET'S TALK", a MENU item, or any internal page link that opens a project/page (not in-page anchors). Behavior:
1. On pointerdown/click, record the click point. Mount a fixed full-screen overlay (`z-index` above everything, `inert` for the page behind, focus moved to the overlay).
2. The overlay is revealed by a circular `clip-path` that grows from the click point to cover the viewport, with `ShaderAnimation` inside tinted toward brand blue (`tint` about `[0.35, 0.4, 1.0]`) over black. Visible shader lines move while it opens.
3. While covered: `router.push(href)` (Next.js). Wait until the new route has mounted and its critical assets are ready (use a readiness signal, with a hard timeout of 2500 ms so the user never gets stuck).
4. Close: the circle collapses toward the new page's hero or toward the same point, revealing the new page. Remove overlay, restore focus to the new page's main heading.
Durations (starting values, justify and tune with the skills): open 520 ms, close 620 ms, easing `cubic-bezier(0.22, 1, 0.36, 1)` (ease-out for entering; do not use ease-in for entering things). Interruptible: a second click or browser back during the animation must not break state. Reduced motion: replace with a 150 ms crossfade, no shader.
Implementation notes: a `TransitionProvider` (context) exposing `navigate(href, originEvent)`; one overlay instance for the whole app, mounted in the root layout; do not mount a new WebGL context per click (reuse the single ShaderAnimation, toggle `paused`). Preserve the loader "L" mark behavior used on page change in the reference (S14) as the first frame of the overlay's close state if it fits.
Accessibility (ui-ux-pro-max): overlay `aria-hidden` for the canvas, `role="status"` with an offscreen "Loading <page>" announcement, `prefers-reduced-motion` honored, focus restored.
Verify with a captured frame sequence (open, covered, close) at 1440x900 and 390x844; no flash of unstyled content; no scroll jump on the new page.

---------------------------------------------------------------------
## D. REBUILD THE GLASS PARALLEL WORLD JOURNEY (S5 to S11)  ← the main quality problem

Diagnosis of "raw": the journey shows flat-shaded geometry, no speed sensation, no glass, no layered depth, hard scene changes, and a monitor that does not show its content. A premium result needs: (1) a cinematic finish pass, (2) a flight rig that makes travel feel fast, (3) real structure (a tesseract) with glass and light, (4) a physically convincing glass break and jump-out, (5) layered parallax. Build all five.

### D1. Cinematic finish stack (shared by S5 to S11; add to the post-processing library)
Order: RenderPass -> (GTAO only where it helps) -> RadialSpeedBlur -> Bloom (HDR threshold ~1.0, strength 0.35 to 0.6 in tunnels) -> Chromatic aberration (0 to 1.5 px scaled by speed, stronger at edges) -> Ring flare (see library F) -> Vignette -> OutputPass (ACES) -> Grain/dither (0.03 to 0.05) last, in output space.
```glsl
// RadialSpeedBlur pass (fragment). uSpeed 0..1 from camera speed or scroll velocity. 10 taps toward the vanishing point.
uniform sampler2D tDiffuse; uniform vec2 uCenter; uniform float uSpeed; varying vec2 vUv;
void main(){
  vec2 dir = (vUv - uCenter);
  float len = length(dir);
  vec3 sum = vec3(0.0); float wsum = 0.0;
  for (int i = 0; i < 10; i++) {
    float f = float(i) / 9.0;
    float w = 1.0 - f * 0.6;
    sum += texture2D(tDiffuse, vUv - dir * f * uSpeed * 0.06 * smoothstep(0.05, 0.6, len)).rgb * w;
    wsum += w;
  }
  gl_FragColor = vec4(sum / wsum, 1.0);
}
```
### D2. Flight rig (the "travelling" feel)
```ts
// per frame: speed in 0..1 (derived from scroll velocity, smoothed), t seconds
const fov = THREE.MathUtils.lerp(52, 78, speed);          // widen with speed
camera.fov = fov; camera.updateProjectionMatrix();
const roll = Math.sin(t * 0.35) * 0.05 + speed * Math.sin(t * 0.9) * 0.03;   // gentle roll
const shake = speed * 0.015;                                                  // micro shake (smooth noise, not random)
camera.rotation.z = roll;
camera.position.x += (noise(t * 1.3) - 0.5) * shake;
camera.position.y += (noise(t * 1.7 + 9.0) - 0.5) * shake;
// astronaut leads the camera: keep him ~ 7 units ahead with lag (damp lambda 3), tumbling (roll 0.3 rad/s, pitch 0.2 rad/s)
// star streaks: 600 additive line segments along z (length scales with speed), recycled when behind the camera
```
### D3. The tesseract (4D hypercube) module: `src/components/three/Tesseract.ts`
Math: 16 vertices (+-1, +-1, +-1, +-1), 32 edges (vertices that differ in exactly one coordinate). Rotate in 4D planes (XW, YW, ZW, optionally XY/ZY), then project 4D to 3D with a perspective divide `k = d / (d - w)` (d about 2.6). Render edges as instanced tubes and vertices as instanced nodes. This is original math, not copied from anywhere.
```ts
import * as THREE from "three"

const V4: number[][] = []
for (let i = 0; i < 16; i++) V4.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
const EDGES: [number, number][] = []
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (i < j) EDGES.push([i, j]) }

const rot = (p: number[], a: number, i: number, j: number) => {
  const c = Math.cos(a), s = Math.sin(a), x = p[i], y = p[j]
  p[i] = x * c - y * s; p[j] = x * s + y * c
}

export interface TesseractOptions {
  radius?: number          // 3D half-size
  tube?: number            // edge radius
  node?: number            // node radius
  d?: number               // 4D camera distance (>1)
  edgeMaterial: THREE.Material
  nodeMaterial: THREE.Material
}
export class Tesseract extends THREE.Group {
  private edges: THREE.InstancedMesh
  private nodes: THREE.InstancedMesh
  private p3 = Array.from({ length: 16 }, () => new THREE.Vector3())
  private o: Required<Pick<TesseractOptions, "radius" | "tube" | "node" | "d">>
  private m = new THREE.Matrix4(); private q = new THREE.Quaternion()
  private up = new THREE.Vector3(0, 1, 0); private dir = new THREE.Vector3(); private mid = new THREE.Vector3(); private s = new THREE.Vector3()

  constructor(opts: TesseractOptions) {
    super()
    this.o = { radius: opts.radius ?? 3, tube: opts.tube ?? 0.035, node: opts.node ?? 0.09, d: opts.d ?? 2.6 }
    this.edges = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true), opts.edgeMaterial, EDGES.length)
    this.nodes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), opts.nodeMaterial, 16)
    this.edges.frustumCulled = false; this.nodes.frustumCulled = false
    this.add(this.edges, this.nodes)
  }

  /** a = rotation angles in radians for the 4D planes */
  update(a: { xw: number; yw: number; zw: number; xy?: number; zy?: number }) {
    const { radius, tube, node, d } = this.o
    for (let i = 0; i < 16; i++) {
      const p = V4[i].slice()
      rot(p, a.xw, 0, 3); rot(p, a.yw, 1, 3); rot(p, a.zw, 2, 3)
      if (a.xy) rot(p, a.xy, 0, 1)
      if (a.zy) rot(p, a.zy, 2, 1)
      const k = d / (d - p[3])
      this.p3[i].set(p[0] * k, p[1] * k, p[2] * k).multiplyScalar(radius / 1.6)
      this.m.compose(this.p3[i], this.q.identity(), this.s.setScalar(node * (0.7 + 0.3 * k)))
      this.nodes.setMatrixAt(i, this.m)
    }
    EDGES.forEach(([i, j], e) => {
      const A = this.p3[i], B = this.p3[j]
      this.dir.subVectors(B, A); const len = this.dir.length()
      this.mid.addVectors(A, B).multiplyScalar(0.5)
      this.q.setFromUnitVectors(this.up, this.dir.divideScalar(len || 1))
      this.m.compose(this.mid, this.q, this.s.set(tube, len, tube))
      this.edges.setMatrixAt(e, this.m)
    })
    this.edges.instanceMatrix.needsUpdate = true
    this.nodes.instanceMatrix.needsUpdate = true
  }
  dispose() { this.edges.geometry.dispose(); this.nodes.geometry.dispose(); this.edges.dispose(); this.nodes.dispose() }
}
```
### D4. Tunnel assembly using the tesseract
- S6 dark world: a corridor of 14 to 18 tesseracts spaced about 6 units along -z (radius 3.6, so the camera flies INSIDE them), each with its own 4D phase offset and slow rotation (`xw = t*0.12 + i*0.35`, `yw = t*0.09 + i*0.2`, `zw = t*0.07`). Edge material: near-black metal (`color 0x0b0e12`, metalness 1, roughness 0.35) with a thin inner emissive core line per edge (second instanced mesh, 40% radius, emissive HDR white/cyan, intensity 3 to 8) so edges glint. Nodes: bright HDR spheres with star sprites. Add the HDR glint panels from the code library (section G) on the cube faces. Reveal out of darkness with the fog/opacity reveal. Recycle tesseracts behind the camera to the far end (infinite tunnel).
- S8 pink glass world: 3 to 5 nearest tesseracts use a glass material: `MeshPhysicalMaterial({ color: 0xff5fd2, metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.35, ior: 1.45, dispersion: 0.25, clearcoat: 1, emissive: 0xff2fbf, emissiveIntensity: 0.35, envMapIntensity: 2 })`; farther ones use a cheap env-reflective material (LOD). Add an extremely bright core light at the vanishing point and thin-film iridescent sparkles. Density: layer 3 nested tesseracts per corridor cell at scales 1.0 / 0.62 / 0.38 with counter-rotation. Check three's transmission cost; keep 60 fps on the target machine class by limiting transmissive instances.
- Check against `reference/official/official_t025s.jpg` to `official_t031s.jpg`. The look (near-black structure, glints, color shift, dense glassy pink core) is the target; the tesseract is the construction method, not a reason to change the look.

### D5. Glass break and jump-out (S11): the full choreography
Layers (back to front): room render target on a plane (z = -0.01) -> glass fracture mesh (z = +0.01) -> astronaut (main scene, z = +0.95) -> foreground shards (z up to +8) -> monitor bezel and stand (stand at z = -0.45, behind) -> dark surround and blue glow.
Timeline over scroll progress u (0..1) for the segment:
- 0.00 to 0.18: inside-the-room view fills the screen; the astronaut (inside the room scene, rendered into the render target) flies toward the camera and grows.
- 0.18 to 0.30: contact. The screen glass bulges slightly (vertex displacement toward +z around the impact point, 0.06 units) and radial crack lines grow outward from the impact point (shader, see below), with a faint white flash at the impact.
- 0.30 to 0.36: BREAK. The fracture cells launch from the impact point outward and toward the camera, with delays proportional to distance; the astronaut swaps from the room scene to the main scene (match-cut, see below) and keeps moving forward to z = +0.95.
- 0.36 to 0.75: camera pulls back to reveal the whole monitor; shards continue, tumble, slow down (ease-out), some drift past the camera at a different parallax speed.
- 0.75 to 1.00: settle; astronaut drifts and tumbles; shards gently float; the scene is ready to hand over to the sticker CTA (S12).
Fracture generator (Voronoi cells from radial-density random sites, clipped by bisector half-planes):
```ts
import * as THREE from "three"
type P = { x: number; y: number }
const clip = (poly: P[], nx: number, ny: number, c: number) => {      // keep nx*x+ny*y <= c
  const out: P[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]
    const da = nx * a.x + ny * a.y - c, db = nx * b.x + ny * b.y - c
    if (da <= 0) out.push(a)
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }) }
  }
  return out
}
export function buildFracture(w: number, h: number, impact: P, cells = 220, seed = 7) {
  let s = seed >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const R = Math.hypot(w, h) * 0.7
  const sites: P[] = []
  for (let i = 0; i < cells; i++) { const a = rnd() * Math.PI * 2, r = Math.pow(rnd(), 1.8) * R; sites.push({ x: impact.x + Math.cos(a) * r, y: impact.y + Math.sin(a) * r }) }
  const pos: number[] = [], uv: number[] = [], ctr: number[] = [], rnd1: number[] = [], dist: number[] = [], edge: number[] = []
  sites.forEach((site, si) => {
    let poly: P[] = [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }]
    const near = sites.map((o, oi) => ({ o, oi, d: (o.x - site.x) ** 2 + (o.y - site.y) ** 2 })).filter(v => v.oi !== si).sort((a, b) => a.d - b.d).slice(0, 28)
    for (const { o } of near) { const nx = o.x - site.x, ny = o.y - site.y; const mx = (o.x + site.x) / 2, my = (o.y + site.y) / 2; poly = clip(poly, nx, ny, nx * mx + ny * my); if (poly.length < 3) break }
    if (poly.length < 3) return
    const cx = poly.reduce((a, p) => a + p.x, 0) / poly.length, cy = poly.reduce((a, p) => a + p.y, 0) / poly.length
    const rr = rnd(), dd = Math.min(1, Math.hypot(cx - impact.x, cy - impact.y) / R)
    const push = (x: number, y: number, e: number) => { pos.push(x, y, 0); uv.push(x / w + 0.5, y / h + 0.5); ctr.push(cx, cy, 0); rnd1.push(rr); dist.push(dd); edge.push(e) }
    for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; push(cx, cy, 1); push(a.x, a.y, 0); push(b.x, b.y, 0) }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute("aCenter", new THREE.Float32BufferAttribute(ctr, 3)); g.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd1, 1))
  g.setAttribute("aDist", new THREE.Float32BufferAttribute(dist, 1)); g.setAttribute("aEdge", new THREE.Float32BufferAttribute(edge, 1))
  return g
}
```
Fracture material (ShaderMaterial; shards carry the room image so the glass looks like the screen breaking):
```glsl
// vertex
attribute vec3 aCenter; attribute float aRand; attribute float aDist; attribute float aEdge;
uniform float uBreak; uniform float uCrack; uniform float uBulge; uniform vec2 uImpact;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vRand; varying float vEdge; varying float vDist;
vec3 rotateAxis(vec3 v, vec3 a, float ang){ float c=cos(ang), s=sin(ang); return v*c + cross(a,v)*s + a*dot(a,v)*(1.0-c); }
void main(){
  vec3 p = position; vec3 c = aCenter;
  float delay = aDist * 0.22;
  float t = clamp((uBreak - delay) / (1.0 - delay), 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);
  vec2 away = normalize(c.xy - uImpact + vec2(1e-4));
  vec3 vel = vec3(away * (1.2 + aRand * 3.6) * (1.0 - aDist * 0.45), 1.5 + aRand * 6.0);
  vec3 axis = normalize(vec3(aRand - 0.35, 0.7, aRand * 0.8 + 0.1));
  p = c + rotateAxis(p - c, axis, e * (aRand - 0.5) * 11.0);
  p += vel * e; p.y -= 0.5 * aRand * e * e;
  p.z += uBulge * exp(-dot(p.xy - uImpact, p.xy - uImpact) * 0.35) * (1.0 - t);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * vec3(0.0, 0.0, 1.0)); vV = normalize(-mv.xyz);
  vUv = uv; vRand = aRand; vEdge = aEdge; vDist = aDist;
  gl_Position = projectionMatrix * mv;
}
// fragment
uniform sampler2D uMap; uniform float uBreak; uniform float uCrack;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vRand; varying float vEdge; varying float vDist;
void main(){
  vec3 tex = texture2D(uMap, vUv).rgb;
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
  float glint = pow(fres, 6.0) * vRand;
  float crackReach = 1.0 - smoothstep(uCrack - 0.08, uCrack, vDist);   // cracks grow outward from the impact
  float rim = (1.0 - smoothstep(0.0, 0.035, vEdge)) * crackReach;      // cell boundary lines
  vec3 col = tex * (0.88 + 0.12 * vRand) + vec3(0.7, 0.85, 1.0) * fres * 0.7 + vec3(1.0) * glint * 0.9;
  col += vec3(1.0) * rim * (1.0 - uBreak) * 1.6;                      // bright cracks before the break
  col += vec3(0.8, 0.9, 1.0) * rim * uBreak * 0.6;                    // bright edges while flying
  gl_FragColor = vec4(col, mix(1.0, 0.86, uBreak));
}
```
Astronaut match-cut (hide the swap): at the swap frame, solve for a main-scene position and scale where the astronaut's projected bounding box equals the room-scene astronaut's projected bounding box (project both boxes to NDC; adjust depth until heights match within 1 px). Render both for 2 to 3 frames with a crossfade, and add a 60 ms white impact flash. Add an automated test that captures the frames before and after the swap and asserts no visible jump (compare bounding boxes).
Reverse scroll must reassemble the glass (cells fly back, cracks recede); `uBreak`, `uCrack`, and the astronaut swap are all pure functions of u.
Sound is out of scope. Haptics out of scope.

### D6. Parallax rig (use it everywhere in S5 to S12)
- 3D scenes: move the camera, not the objects. Offset the camera position by the damped pointer (x +-0.18, y +-0.12 world units) while keeping `lookAt` on a fixed target; add a second, smaller scroll-velocity-driven offset. Subjects at different z therefore parallax naturally.
- Layers: at least background (room/tunnel), subject (astronaut), foreground (shards/crystals/stickers), plus an overlay layer (ring flare, grain). Foreground layers also get extra depth-of-field blur.
- DOM overlays (headline, stickers): translate by `pointer * depth * 40px` and `scrollVelocity * depth * 60px`, with `damp`.
- Reduced motion: no parallax drift, static composition.

---------------------------------------------------------------------
## E. RE-AUDIT EVERYTHING (pass/fail, with captures)

For each item write PASS or FAIL with the capture path, then fix every FAIL.
1. Particles: About plume (glossy spheres, power-law sizes, bokeh orbs, flow, bright core), CTA dot field (full-width, pointer reactive), ambient star/dust particles in dark scenes, speed streaks in tunnels.
2. World: moonscape terrain (ridged crags, low sun, beam, fog), tunnel worlds (dark tesseract corridor, pink glass world, blue room), monitor environment (surround, glow).
3. Astronaut: model quality, material (cloth sheen, visor reflection), pose and drift, rim light and star flare, correct scale in every scene, never clipped by stand/bezel, walking astronaut on the terrain, front-on astronaut in S12.
4. Tesseract: real 4D rotation visible, no z-fighting, glints and nodes bloom correctly, no pop when tesseracts are recycled, perf budget kept.
5. Glass breaking: cracks grow, glass breaks from the impact point, cells carry the room image, forward and reverse both correct, no empty screen.
6. Jump-out: match-cut invisible, astronaut in front of the screen, stand behind, shards in front and behind the astronaut.
7. Parallax: pointer and scroll parallax present in every dark scene, damped, no jitter.
8. Click-open transition: works from cards, CTA, menu; interruptible; reduced-motion fallback; no extra WebGL contexts.
9. GlowCard borders: present on the listed surfaces, correct under scroll-warp transforms, touch scrolling works, reduced-motion respected.
10. Cinematic finish: bloom/CA/grain/vignette present and restrained; no banding on dark gradients; no blown whites.
11. Skills: `SKILLS_LOG.md` complete; `review-animations` run on the diff and its findings fixed; `ui-ux-pro-max` checklist recorded.

Final report additions: SKILLS_LOG summary, the PASS/FAIL table above with capture paths, the pipeline used per capture (hardware vs software, full vs degraded), measured frame times on hardware if available (otherwise say "not measured on hardware"), and anything not done with the reason.
