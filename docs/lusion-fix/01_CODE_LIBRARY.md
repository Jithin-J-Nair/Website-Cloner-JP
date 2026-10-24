# CODE LIBRARY (original, clean-room)

These are starting points. Adapt names, paths and APIs to the repo's installed versions (check `package.json`; the repo uses three 0.186.x). Do not paste blindly: read the surrounding code first. Everything here is original and may be shipped.

Sections: A scroll engine, B cursor, C hero pointer physics, D reel card and scroll warp, E Earth limb, F ring flare, G tunnel glints and reveal, H monitor portal and shards, I stickers, J About plume and terrain, K dot field, L capture harness.

---------------------------------------------------------------------
## A. Shared scroll engine and math (src/lib/motion/scrollEngine.ts)

```ts
// If the repo already has a smooth-scroll engine, adapt this instead of adding a second one.
import Lenis from "lenis"; // check the exact package name in package.json ("lenis" or "@studio-freight/lenis")

export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const damp = (a: number, b: number, lambda: number, dt: number) => lerp(a, b, 1 - Math.exp(-lambda * dt));
export const smooth = (a: number, b: number, x: number) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export interface ScrollState {
  y: number; limit: number; progress: number;
  velocity: number;      // px/frame-ish from the engine
  velocityNorm: number;  // clamped -1..1, use this for warp effects
  direction: 1 | -1 | 0;
}
type Listener = (s: ScrollState, dt: number) => void;

const state: ScrollState = { y: 0, limit: 1, progress: 0, velocity: 0, velocityNorm: 0, direction: 0 };
const listeners = new Set<Listener>();
let lenis: Lenis | null = null;
let raf = 0, last = 0;

export function startScrollEngine() {
  if (lenis) return;
  lenis = new Lenis({ lerp: 0.085, smoothWheel: true, wheelMultiplier: 0.9, touchMultiplier: 1.4 });
  const tick = (t: number) => {
    const dt = Math.min(((t - last) / 1000) || 0.016, 0.05); last = t;
    lenis!.raf(t);
    state.y = lenis!.scroll; state.limit = lenis!.limit || 1;
    state.progress = state.y / state.limit;
    state.velocity = lenis!.velocity;
    state.velocityNorm = clamp(state.velocity / 40, -1, 1);
    state.direction = (lenis!.direction as 1 | -1 | 0) ?? 0;
    listeners.forEach((l) => l(state, dt));
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}
export const subscribeScroll = (l: Listener) => { listeners.add(l); return () => listeners.delete(l); };
export function stopScrollEngine() { cancelAnimationFrame(raf); lenis?.destroy(); lenis = null; }
export const getScrollState = () => state;

// Map a global scroll value into a scene-local 0..1 using an element's document range.
export function sceneProgress(el: HTMLElement, state: ScrollState, startVH = 1, endVH = 0) {
  const top = el.offsetTop, h = el.offsetHeight, vh = window.innerHeight;
  const start = top - vh * startVH, end = top + h - vh * endVH;
  return clamp((state.y - start) / (end - start), 0, 1);
}
```

---------------------------------------------------------------------
## B. Cursor (dot plus lagging ring) and magnetic buttons (src/lib/motion/cursor.ts)

```ts
import { damp } from "./scrollEngine";
export function initCursor(dot: HTMLElement, ring: HTMLElement) {
  let tx = innerWidth / 2, ty = innerHeight / 2, rx = tx, ry = ty, last = performance.now(), raf = 0;
  const move = (e: PointerEvent) => { tx = e.clientX; ty = e.clientY; dot.style.transform = `translate3d(${tx}px,${ty}px,0)`; };
  const loop = (now: number) => {
    const dt = Math.min((now - last) / 1000, 0.05); last = now;
    rx = damp(rx, tx, 14, dt); ry = damp(ry, ty, 14, dt);
    ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
    raf = requestAnimationFrame(loop);
  };
  addEventListener("pointermove", move, { passive: true });
  raf = requestAnimationFrame(loop);
  return () => { removeEventListener("pointermove", move); cancelAnimationFrame(raf); };
}
export function magnetic(el: HTMLElement, strength = 0.25) {
  const onMove = (e: PointerEvent) => {
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate3d(${dx * strength}px,${dy * strength}px,0)`;
  };
  const onLeave = () => { el.style.transition = "transform .5s cubic-bezier(.2,.8,.2,1)"; el.style.transform = "translate3d(0,0,0)"; };
  const onEnter = () => { el.style.transition = "none"; };
  el.addEventListener("pointermove", onMove); el.addEventListener("pointerleave", onLeave); el.addEventListener("pointerenter", onEnter);
  return () => { el.removeEventListener("pointermove", onMove); el.removeEventListener("pointerleave", onLeave); el.removeEventListener("pointerenter", onEnter); };
}
```

---------------------------------------------------------------------
## C. Hero crosses: spring plus pointer repulsion (merge into HeroCrossesStage)

```ts
import * as THREE from "three";

export class PiecePhysics {
  home = new THREE.Vector3();
  vel = new THREE.Vector3();
  angVel = new THREE.Vector3();
  baseSpin = new THREE.Vector3();
  private d = new THREE.Vector3();
  private h = new THREE.Vector3();
  constructor(public mesh: THREE.Object3D, seed: number) {
    this.home.copy(mesh.position);
    const r = (k: number) => Math.sin(seed * 12.9898 + k * 78.233) * 0.5 + 0.5;
    this.baseSpin.set((r(1) - 0.5) * 0.25, (r(2) - 0.5) * 0.3, (r(3) - 0.5) * 0.2);
  }
  /** pointer: world-space point on the z=0 plane. dt in seconds. */
  step(dt: number, pointer: THREE.Vector3, R = 2.3, push = 30, k = 4.5, c = 3.0) {
    this.d.copy(this.mesh.position).sub(pointer); this.d.z *= 0.35;
    const dist = this.d.length() + 1e-4;
    const f = Math.exp(-(dist * dist) / (R * R)) * push;          // gaussian repulsion
    this.vel.addScaledVector(this.d.divideScalar(dist), f * dt);
    this.vel.addScaledVector(this.h.copy(this.home).sub(this.mesh.position), k * dt); // spring home
    this.vel.multiplyScalar(Math.exp(-c * dt));                    // damping
    this.mesh.position.addScaledVector(this.vel, dt);
    // tumble: baseline spin plus velocity-driven spin so a shove makes it roll
    this.angVel.x += this.vel.y * 0.5 * dt; this.angVel.y -= this.vel.x * 0.5 * dt;
    this.angVel.multiplyScalar(Math.exp(-1.2 * dt));
    this.mesh.rotation.x += (this.baseSpin.x + this.angVel.x) * dt;
    this.mesh.rotation.y += (this.baseSpin.y + this.angVel.y) * dt;
    this.mesh.rotation.z += (this.baseSpin.z + this.angVel.z) * dt;
  }
}
// pointer -> world on z=0:
// const ndc = new THREE.Vector2(x/w*2-1, -(y/h)*2+1); raycaster.setFromCamera(ndc, camera);
// raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,0,1), 0), pointerWorld);
// Smooth the pointer itself with damp() (lambda ~10) so pieces never jitter.
```

---------------------------------------------------------------------
## D. Reel blob card and scroll-velocity warp (src/lib/motion/warp.ts)

```ts
import { clamp, damp } from "./scrollEngine";

/** Wobbling blob border-radius (8-value form). t = seconds, amp 0..1 */
export function blobRadius(t: number, amp = 1) {
  const w = (a: number, f: number, p: number) => 50 + Math.sin(t * f + p) * a * amp;
  return `${w(9,.9,0)}% ${w(9,.7,1.2)}% ${w(9,1.1,2.1)}% ${w(9,.8,3.3)}% / ${w(9,.6,.7)}% ${w(9,1.0,1.9)}% ${w(9,.75,2.8)}% ${w(9,.95,4.1)}%`;
}

/** Call once per frame from the shared scroll subscription. Batch reads, then writes. */
export class ScrollWarp {
  private s = new Map<HTMLElement, { rx: number; sy: number; z: number }>();
  constructor(private els: HTMLElement[]) { els.forEach((e) => this.s.set(e, { rx: 0, sy: 0, z: 0 })); }
  update(velNorm: number, dt: number) {
    const vh = innerHeight;
    const rects = this.els.map((e) => e.getBoundingClientRect());           // reads
    this.els.forEach((el, i) => {                                           // writes
      const r = rects[i]; if (r.bottom < -200 || r.top > vh + 200) return;
      const cy = (r.top + r.height / 2) / vh - 0.5;                         // -0.5..0.5
      const st = this.s.get(el)!;
      const trx = clamp(velNorm * 10 * (1 - Math.abs(cy) * 1.2), -10, 10);
      const tsy = clamp(-velNorm * 4, -4, 4);
      const tz = clamp(velNorm * 30 * cy, -26, 26);
      st.rx = damp(st.rx, trx, 7, dt); st.sy = damp(st.sy, tsy, 7, dt); st.z = damp(st.z, tz, 7, dt);
      el.style.transform = `perspective(1400px) rotateX(${st.rx}deg) skewY(${st.sy}deg) translate3d(0,0,${st.z}px)`;
    });
  }
}
// Reel expansion: progress p (0..1) from sceneProgress().
// const e = easeInOutCubic(clamp((p-0.25)/0.5,0,1));
// card.style.clipPath = `inset(${(1-e)*14}% ${(1-e)*10}% ${(1-e)*14}% ${(1-e)*10}% round ${(1-e)*48}px)`;
// card.style.borderRadius = e > 0.98 ? "0" : blobRadius(time, 1 - e);
// phones: translateY(sin(i*1.7)*18*(1-e)) and fade to 0 as e -> 1; PLAY REEL label scales 1 -> 1.15.
```

---------------------------------------------------------------------
## E. Earth night limb (GLSL, use in a ShaderMaterial on a large sphere)

```glsl
// vertex
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main(){
  vec4 mv = modelViewMatrix * vec4(position,1.0);
  vN = normalize(normalMatrix * normal);
  vV = normalize(-mv.xyz);
  vP = position;
  gl_Position = projectionMatrix * mv;
}
// fragment
precision highp float;
uniform vec3 uSunDir;      // view-space direction toward the sun, e.g. normalize(vec3(-0.6,0.5,-0.2))
uniform float uTime;
varying vec3 vN; varying vec3 vV; varying vec3 vP;

float hash(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
float noise(vec3 p){
  vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x), mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x), mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x), f.y), f.z);
}
float fbm(vec3 p){ float a=.5,s=0.; for(int i=0;i<4;i++){ s+=a*noise(p); p*=2.03; a*=.5; } return s; }

void main(){
  vec3 N = normalize(vN), V = normalize(vV);
  float fres = pow(1.0 - max(dot(N,V),0.0), 3.0);
  float sun  = clamp(dot(N, normalize(uSunDir)) * 0.5 + 0.5, 0.0, 1.0);
  sun = smoothstep(0.35, 1.0, sun);                                   // sharp terminator, real night side
  vec3 ocean = vec3(0.004, 0.016, 0.06);                              // deep navy, NOT daylight blue
  float cl = smoothstep(0.55, 0.9, fbm(normalize(vP) * 3.2 + vec3(uTime*0.01))) * 0.18 * sun; // low-contrast clouds
  vec3 land = ocean * (0.4 + 2.0 * sun) + vec3(cl);
  vec3 atmo = mix(vec3(0.08,0.30,1.0), vec3(0.70,0.92,1.0), pow(fres, 2.0));
  vec3 col  = land + atmo * fres * (0.10 + 1.3 * sun);
  col += vec3(0.75,0.92,1.0) * pow(fres, 9.0) * (0.2 + sun) * 1.4;    // thin bright limb line
  gl_FragColor = vec4(col, 1.0);
}
```
Place the sphere so the limb crosses the lower third of the tablet screen, sloping slightly (higher on the left). Keep a bright sun glare sprite behind the helmet.

---------------------------------------------------------------------
## F. Chromatic ring flare (thin, subtle). Additive full-screen pass or a camera-attached quad

```glsl
precision highp float;
uniform vec2  uRes;
uniform vec2  uCenter;     // 0..1, usually (0.5,0.5)
uniform float uRadius;     // about 0.5 (fraction of viewport height)
uniform float uWidth;      // about 0.035
uniform float uIntensity;  // 0.25 .. 0.4, multiply by (0.6 + 0.4*scrollVelocityNorm)
varying vec2 vUv;

float ring(float d, float r, float w){ float x=(d-r)/w; return exp(-x*x); }
void main(){
  vec2 p = (vUv - uCenter) * vec2(uRes.x/uRes.y, 1.0);
  float d = length(p), a = atan(p.y, p.x);
  // per-channel radius offset = chromatic dispersion; red inside, blue outside
  vec3 col = vec3(ring(d, uRadius*0.982, uWidth),
                  ring(d, uRadius,       uWidth*1.1),
                  ring(d, uRadius*1.020, uWidth*1.3));
  col *= vec3(1.0, 0.85, 0.7) * 0.5 + vec3(0.0, 0.1, 0.3) * smoothstep(uRadius*0.9, uRadius*1.15, d);
  col *= 0.45 + 0.55 * (0.5 + 0.5*sin(a + 0.9));        // stronger on one side like a real lens
  col += vec3(0.02,0.025,0.045) * ring(d, uRadius, uWidth*6.0);  // faint wide halo
  gl_FragColor = vec4(col * uIntensity, 1.0);            // render with AdditiveBlending, depthTest false
}
```

---------------------------------------------------------------------
## G. Dark truss tunnel: glints, reveal, color shift

```ts
import * as THREE from "three";

// 1) Lighting model: near-black metal, fog, a camera-following point light, almost no env.
export function makeTunnelLook(scene: THREE.Scene, camera: THREE.Camera) {
  scene.fog = new THREE.FogExp2(0x000000, 0.085);
  const metal = new THREE.MeshStandardMaterial({ color: 0x0b0e12, metalness: 1, roughness: 0.38, envMapIntensity: 0.25 });
  const key = new THREE.PointLight(0xbfd8ff, 3.0, 16, 2); camera.add(key); scene.add(camera);
  return { metal, key };
}

// 2) HDR glint panels (values > 1 feed bloom). Run bloom threshold ~1.0 so ONLY glints bloom.
export function makeGlints(count = 420, length = 120, half = 3.4) {
  const g = new THREE.PlaneGeometry(1, 1);
  const m = new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
  const mesh = new THREE.InstancedMesh(g, m, count);
  const col = new THREE.Color(), dummy = new THREE.Object3D();
  const pal = [0xffffff, 0xbfffff, 0x8ff7ee, 0xffffff, 0xffe9d0];
  for (let i = 0; i < count; i++) {
    const side = Math.floor(Math.random() * 4);
    const along = (Math.random() - 0.5) * 2 * half, z = -Math.random() * length;
    const [x, y] = [[half, along], [-half, along], [along, half], [along, -half]][side];
    dummy.position.set(x * (0.92 + Math.random() * 0.08), y * (0.92 + Math.random() * 0.08), z);
    dummy.lookAt(0, 0, z);                                           // face the tunnel axis
    const w = 0.05 + Math.pow(Math.random(), 3) * 0.7, h = 0.02 + Math.random() * 0.1;
    dummy.scale.set(w, h, 1); dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
    col.set(pal[(Math.random() * pal.length) | 0]).multiplyScalar(2.5 + Math.random() * 6); // HDR
    mesh.setColorAt(i, col);
  }
  return mesh;
}

// 3) Procedural 4-spoke star sprite for the brightest ~40 glints (additive, size 0.6..2.2)
export function makeStarTexture(size = 256) {
  const c = document.createElement("canvas"); c.width = c.height = size; const x = c.getContext("2d")!;
  const g = x.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2);
  g.addColorStop(0,"rgba(255,255,255,1)"); g.addColorStop(.12,"rgba(255,255,255,.6)"); g.addColorStop(1,"rgba(255,255,255,0)");
  x.fillStyle = g; x.fillRect(0,0,size,size);
  x.globalCompositeOperation = "lighter";
  for (const [w,h] of [[size,6],[6,size]]) { const l = x.createLinearGradient(0,0,w>h?size:0,w>h?0:size);
    l.addColorStop(0,"rgba(255,255,255,0)"); l.addColorStop(.5,"rgba(255,255,255,.9)"); l.addColorStop(1,"rgba(255,255,255,0)");
    x.fillStyle = l; x.fillRect((size-w)/2,(size-h)/2,w,h); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

// 4) Reveal out of darkness. u = scene progress 0..1 across S5->S6.
//    fog density: 0.30 -> 0.085, glint opacity: 0 -> 1, lattice emissive/visibility: sparse -> full.
export function applyReveal(u: number, scene: THREE.Scene, glints: THREE.InstancedMesh, metal: THREE.MeshStandardMaterial) {
  const e = u * u * (3 - 2 * u);
  (scene.fog as THREE.FogExp2).density = 0.30 - 0.215 * e;
  (glints.material as THREE.MeshBasicMaterial).opacity = e;
  metal.envMapIntensity = 0.05 + 0.25 * e;
}

// 5) Color shift S6 -> S8: glint tint white/cyan -> red/orange + teal.
//    lerp the instance colors or run two glint meshes (cool, warm) and cross-fade by u.
```
Also needed: faint rainbow ring flare (section F) at intensity 0.25 on the truss and fading out by the pink lattice; astronaut tumbles ahead of the camera (roll + pitch, 0.25 to 0.5 rad/s) and shrinks with distance.

---------------------------------------------------------------------
## H. Monitor portal, layout numbers, shards (fixes D-01)

```ts
import * as THREE from "three";

// --- 1) Render the blue room into a texture ---
export function makeRoomTarget(w: number, h: number) {
  return new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4, colorSpace: THREE.SRGBColorSpace });
}
// per frame, BEFORE the main render:
//   renderer.setRenderTarget(rt); renderer.render(roomScene, roomCamera); renderer.setRenderTarget(null);
//   screenMaterial.map = rt.texture;   // MeshBasicMaterial({ toneMapped: false })

// --- 2) World layout (units: screen height = 4) ---
// screen plane  : 6.4 x 4.0 at z = 0, centered at (0, 0)
// bezel         : rounded-rect extrude, 0.12 border, depth 0.18, color #050508, slight bevel
// stand         : neck 0.7w x 1.1h at (0, -2.55, -0.45); foot 2.4w x 0.12h at (0, -3.15, -0.45)   <- BEHIND the screen plane
// astronaut     : (0, -0.15, +0.95), height ~2.5 (about 62% of screen), facing camera, slight drift
// shards        : spawn on the screen plane (z = 0.02), fly toward +z
// camera        : roomCamera fov MUST equal the main camera fov at keyframe 0 so the handoff is invisible
//   key 0 (u=0.0): position (0, 0, 3.2),  fov 60  -> screen fills viewport (inside the room view)
//   key 1 (u=0.5): position (0, 0.1, 7.5), fov 40  -> whole monitor visible with dark surround
//   key 2 (u=1.0): position (0, 0.15, 9.5), fov 32 -> wide shot, astronaut + shards + stand readable
// Interpolate with smooth/Catmull-Rom. Depth testing ON for everything. The stand has z < 0, so it can never cover the astronaut.
// Dark surround: #02020c with a soft blue radial glow behind the monitor (additive plane, z = -1.5).

// --- 3) Deterministic shards (same scroll position -> same frame) ---
export function makeShards(count = 800) {
  const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(1, 0.2); shape.lineTo(0.35, 1); shape.closePath();
  const geo = new THREE.ShapeGeometry(shape);
  const mat = new THREE.MeshPhysicalMaterial({
    color: 0xaab4ff, metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.02,
    transparent: true, opacity: 0.55, side: THREE.DoubleSide, envMapIntensity: 2.2, depthWrite: false,
  });
  const mesh = new THREE.InstancedMesh(geo, mat, count);
  const seeds = new Float32Array(count * 8);                 // p0.xy, dir.xyz, spin.xyz
  const rnd = mulberry32(1337);
  for (let i = 0; i < count; i++) {
    const o = i * 8;
    seeds[o] = (rnd() - 0.5) * 6.0; seeds[o+1] = (rnd() - 0.5) * 3.8;          // start on screen plane
    const d = new THREE.Vector3((rnd() - 0.5) * 2.2, (rnd() - 0.5) * 1.6, 0.4 + rnd() * 2.6).normalize();
    seeds[o+2] = d.x; seeds[o+3] = d.y; seeds[o+4] = d.z;
    seeds[o+5] = (rnd() - 0.5) * 4; seeds[o+6] = (rnd() - 0.5) * 4; seeds[o+7] = (rnd() - 0.5) * 4;
  }
  return { mesh, seeds, count };
}
const dummy = new THREE.Object3D();
export function updateShards(s: ReturnType<typeof makeShards>, u: number /* 0..1 break progress */) {
  const e = 1 - Math.pow(1 - u, 3);
  for (let i = 0; i < s.count; i++) {
    const o = i * 8, sp = 0.4 + (i % 7) * 0.35;                 // per-shard speed variety
    dummy.position.set(s.seeds[o] + s.seeds[o+2] * e * 5 * sp, s.seeds[o+1] + s.seeds[o+3] * e * 5 * sp, 0.02 + s.seeds[o+4] * e * 8 * sp);
    dummy.rotation.set(s.seeds[o+5] * e * 2, s.seeds[o+6] * e * 2, s.seeds[o+7] * e * 2);
    const size = 0.05 + ((i * 2654435761 >>> 0) % 1000) / 1000 * 0.55;      // many tiny, a few big
    dummy.scale.setScalar(size * (u > 0 ? 1 : 0)); dummy.updateMatrix(); s.mesh.setMatrixAt(i, dummy.matrix);
  }
  s.mesh.instanceMatrix.needsUpdate = true;
}
function mulberry32(a: number) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
```
Checks: the capture harness must produce frames at u = 0, 0.25, 0.5, 0.75, 1 plus reverse; none may show an empty screen, and the stand must be hidden behind the astronaut's legs, never overlapping his torso.

---------------------------------------------------------------------
## I. Sticker field (original SVG artwork, DOM + CSS 3D)

```tsx
// StickerField.tsx: three depth layers, pointer + scroll parallax, idle bob, hover wiggle
const LAYERS = [{ depth: 0.25, blur: 6, scale: 0.8 }, { depth: 0.6, blur: 0, scale: 1 }, { depth: 1.0, blur: 0, scale: 1.25 }];
// Each sticker: <svg> artwork you draw yourself (heart, smiley, mushroom, lips, popsicle, skeleton, banana, lollipop, 3D glasses, pill)
// Outline trick that survives any shape: paint-order stroke
//   <path d="..." fill="#ff3b3b" stroke="#fff" stroke-width="14" stroke-linejoin="round" paint-order="stroke fill"/>
// Gloss: overlay a white-to-transparent diagonal gradient clipped to the fill; soft shadow via filter: drop-shadow(0 10px 14px rgba(0,0,0,.45))
export function parallax(el: HTMLElement, depth: number, px: number, py: number, scrollV: number, t: number, i: number) {
  const bob = Math.sin(t * 0.9 + i * 1.7) * 8, rot = Math.sin(t * 0.6 + i) * 6;
  el.style.transform = `translate3d(${px * 40 * depth}px, ${py * 30 * depth + bob - scrollV * 60 * depth}px, 0) rotate(${rot}deg)`;
}
// px,py = damped pointer in -1..1; scrollV = velocityNorm. Hover: scale 1.12 + rotate wiggle (spring).
// Crystals: 40-60 InstancedMesh octahedra with env reflection, 3 depth layers, bokeh blur by layer (BokehPass or per-layer opacity + scale).
```

---------------------------------------------------------------------
## J. About page: plume, terrain, beam

```ts
// ---- Plume: glossy spheres, power-law sizes, flowing field ----
// InstancedMesh(new THREE.IcosahedronGeometry(1, 2), MeshPhysicalMaterial({ color: 0xdfe3ea, roughness: 0.28, metalness: 0.0, clearcoat: 1, clearcoatRoughness: 0.08, envMapIntensity: 1.6 }), 16000)
// per-instance: base position from a gaussian blob (3 sums of randoms), scale = 0.02 + pow(rand, 5) * 0.32, a few (30) large "bokeh" spheres scale 0.5-1.1.
// Flow: patch vertex shader via onBeforeCompile, displace the INSTANCE origin by a curl-like field:
```
```glsl
// inject after #include <begin_vertex>, where instanceMatrix[3].xyz is the instance origin
vec3 o = instanceMatrix[3].xyz;
float t = uTime * 0.12;
vec3 flow = vec3(sin(o.y*1.3 + t) + sin(o.z*0.9 - t*1.3), sin(o.z*1.1 + t*0.8) + sin(o.x*1.2 + t), sin(o.x*0.8 - t) + sin(o.y*1.4 + t*1.1));
transformed += flow * 0.35 * (0.4 + uScroll);            // uScroll 0..1 from the shared scroll state
```
```ts
// Lighting: one strong key from upper left, cool rim from right, dark ambient, env with two thin strips. Bloom threshold ~1.2 so only specular glints bloom.
// DOF: BokehPass with focus on the plume core; maxblur small (0.006) so the cluster stays crisp and the big orbs blur.
// Core glow: additive sprite behind the plume, intensity pulses slowly.

// ---- Terrain: ridged FBM moonscape (vertex displacement + fragment lighting) ----
```
```glsl
// shared noise
float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float noise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1,0)),f.x), mix(hash(i+vec2(0,1)),hash(i+vec2(1,1)),f.x), f.y); }
float ridged(vec2 p){ float a=.5, f=1., s=0.;
  for(int i=0;i<6;i++){ float n = 1.0 - abs(noise(p*f)*2.0 - 1.0); n *= n; s += n*a; f *= 2.07; a *= .5; } return s; }

// vertex: height = ridged(pos.xz*0.12 + vec2(0.0, uScroll*0.3)) * uHeight * mountainMask(pos.x)  (mountainMask: low in the walking corridor, high at the sides)
// fragment: normal from dFdx/dFdy of world position (flat-shaded crags) PLUS a fine rock normal from ridged(pos.xz*6.0)
//   light  = normalize(vec3(-0.5, 0.18, 0.4)) (low sun, long shadows)
//   albedo = vec3(0.55) * (0.6 + 0.8 * ridged(pos.xz*9.0))   // rocky grain
//   color  = albedo * (0.12 + 0.95 * max(dot(n, light), 0.0)); apply height-based dust (lighter in lows), then distance fog to #05070a
//   grayscale only, add very light film grain (0.03)
```
```ts
// ---- Light beam: tall additive cone/volumetric plane from the ground to the plume ----
// Use two crossed vertical planes with a gradient texture (bright at the ground fading up), additive, slow noise flicker. Add a small glow disc on the ground.
// ---- Walking astronaut: reuse the GLB at tiny scale (about 0.9% of screen height), slow walk bob via translation + sway (no new rig needed), toward the beam, with a soft contact shadow.
// ---- Wordmark: <h1> solid fill. NOT -webkit-text-stroke. ----
//   font-size: 21vw; line-height: .8; letter-spacing: -0.04em; color: #fff; will-change: transform;
//   parallax: translateY(progress * -18vh), opacity eases to 0 by progress 0.55
```

---------------------------------------------------------------------
## K. CTA dot field (shader points, pointer-reactive)

```ts
// Points on a jittered grid (e.g. 60 x 18 on desktop). The "mound" silhouette comes from a height function; dots above it are hidden.
// vertex shader sketch:
//   float h = 0.35 + 0.18*sin(x*1.6 + uTime*0.4) + 0.1*sin(x*3.7 - uTime*0.6);      // wavy mound
//   float vis = 1.0 - smoothstep(h - 0.02, h + 0.02, y);                               // inside the mound
//   vec2 d = pos.xy - uPointer; float f = exp(-dot(d,d)/(0.16)) ;                      // pointer field
//   pos.xy += normalize(d + 1e-4) * f * 0.35 * uPush;                                  // push away, spring back via damped uPush
//   gl_PointSize = mix(6.0, 14.0, rnd) * vis * uScale;                                 // varied sizes
// fragment: white (blue page) or per-dot palette (light page confetti: circle, ring, pentagon, bow-tie, star, bar, in #1b24e6 #7c3aed #ff4a3d #6dff7a #111 #cfd2e0).
// Cover the bottom 35-45% of the viewport, full width. Dots drift slowly. On the light page use shape atlas textures instead of round points.
```

---------------------------------------------------------------------
## L. Capture harness (scripts/capture-sequence.mjs)

```js
// node scripts/capture-sequence.mjs --base http://127.0.0.1:3000 --out docs/validation/fix --w 1440 --h 900
import { chromium } from "playwright";
import fs from "node:fs";

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith("--") ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const base = args.base ?? "http://127.0.0.1:3000", out = args.out ?? "docs/validation/fix";
const W = +(args.w ?? 1440), H = +(args.h ?? 900);
fs.mkdirSync(out, { recursive: true });

// scroll positions as fractions of the home page scroll height; refine them against TIMELINE_OFFICIAL.md scene boundaries
const STOPS = Array.from({ length: 81 }, (_, i) => i / 80);

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist", "--enable-webgl", "--enable-gpu-rasterization"] });
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
const errors = [];
page.on("console", (m) => { if (["error", "warning"].includes(m.type())) errors.push(m.text()); });
page.on("pageerror", (e) => errors.push(String(e)));

await page.goto(`${base}/?quality=high`, { waitUntil: "networkidle" });
await page.waitForTimeout(2500);
const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
const log = [];
for (const [i, f] of STOPS.entries()) {
  await page.evaluate((y) => window.scrollTo(0, y), Math.round(f * total));
  await page.waitForTimeout(700);                                   // let smooth scroll + damping settle
  const pipeline = await page.evaluate(() => window.__pipeline ?? null);
  const blank = await page.evaluate(() => {                         // crude blank-frame detector on the main canvases
    const c = [...document.querySelectorAll("canvas")].filter((x) => x.getBoundingClientRect().height > innerHeight * 0.5);
    return c.length === 0;
  });
  const file = `${out}/seq_${String(i).padStart(3, "0")}_${Math.round(f * 1000)}.png`;
  await page.screenshot({ path: file });
  log.push({ i, f, file, pipeline, noLargeCanvas: blank });
}
// reverse pass + fast jump determinism: scroll 0.9 -> 0.3 -> 0.7 -> 0.5 and compare hashes with the forward capture at 0.5
fs.writeFileSync(`${out}/sequence-report.json`, JSON.stringify({ W, H, errors, log }, null, 2));
await browser.close();
console.log(`captured ${log.length} frames, ${errors.length} console issues`);
```
`scripts/sbs.mjs`: for each scene in the timeline, pair your capture with `reference/official/official_tXXXs.jpg`, scale both to 900 px wide, label them TARGET and CURRENT, and write `docs/validation/fix/sbs_<scene>.jpg`. Open the result and write the difference list from what you SEE.
