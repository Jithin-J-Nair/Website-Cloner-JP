# Phase 5 — Original Procedural 3D & Custom GLSL Shaders (Plain-Language Guide)

All 3D geometry, simulations, textures, and shaders across KINETA are **100% authored from scratch in this repository** with zero external `.glb`, `.hdr`, `.mp4`, or copied shader files.

---

## 1. Cauchy Optical Glass Dispersion Shader
**Files**: `src/components/webgl/shaders.ts` (`OPTICAL_GLASS_VERTEX` + `OPTICAL_GLASS_FRAGMENT`), mounted in `src/components/webgl/GlobalStage.tsx`

### Plain-English Idea
Real crystal or heavy flint glass looks magical because it does two things ordinary computer graphics materials skip:
1. **Curved liquid surface waves**: In the vertex shader, we push each vertex of a high-subdivision icosahedron outward along its surface normal using two octaves of 3D Simplex noise plus pointer direction. Because pushing vertices changes the shape's slope, we sample two tiny neighbor points (`tangent` and `bitangent`) to recalculate the true curved normal right on the GPU—giving highlights a liquid, mercury-smooth sheen without updating meshes on the CPU.
2. **Prism rainbow splitting (Cauchy Dispersion)**: In real optics, blue light bends slightly more sharply entering glass than red light. Instead of firing a single `refract()` ray, the fragment shader fires **three separate refraction rays**—one for Red (`1/IOR - spread`), one for Green (`1/IOR`), and one for Blue (`1/IOR + spread`)—against an analytical 3-softbox studio light probe. Looking straight at the center stays clean and glassy; grazing edges split naturally into spectral cyan and ember highlights, blended with Schlick's Fresnel reflection curve.

---

## 2. Analytical Spring-Impulse Sphere Swarm (`InstancedMesh`)
**File**: `src/components/webgl/GlobalStage.tsx` (`ProceduralWorld`)

### Plain-English Idea
To achieve tactile physical mass without forcing visitors to download a multi-megabyte WebAssembly physics binary before first paint:
- We pre-allocate flat `Float32Array` buffers once at mount for `44` orbital spheres (`positions`, `velocities`, `radii`, `homeOffsets`) so **zero JavaScript objects are allocated during animation frames**.
- Every frame, each sphere feels three simple physical forces:
  1. **Home spring pull**: A gentle rubber-band force pulling the sphere toward its slowly orbiting Fibonacci lattice slot.
  2. **Cursor repulsion**: Moving the mouse pushes nearby spheres outward using an inverse-square force field.
  3. **Soft sphere-to-sphere bounce**: Whenever two spheres get closer than the sum of their radii, an equal-and-opposite impulse nudges them apart so they never clip awkwardly through one another.
- All `44` spheres draw in **one single WebGL draw call** via `THREE.InstancedMesh`.

---

## 3. Scroll-Velocity Harmonic Satin Ribbon Shader
**Files**: `src/components/webgl/shaders.ts` (`RIBBON_WAVE_VERTEX` + `RIBBON_WAVE_FRAGMENT`)

### Plain-English Idea
Behind the centerpiece sculpture floats a wide subdivided plane tilted into perspective:
- The vertex shader lifts and lowers vertices using interfering sine/cosine waves whose amplitude scales gently with **live scroll speed** (`STAGE_TELEMETRY.scrollVelocity` fed directly by Lenis).
- The fragment shader slices the wave coordinates into razor-thin luminous contour filaments with soft radial edge falloff (`discard` on transparent pixels so it costs minimal fill-rate), turning fast scrolling into visible kinetic energy.

---

## 4. Analytical SDF Smooth-Union Raymarcher (`/labs`)
**File**: `src/components/webgl/RaymarchViewport.tsx`

### Plain-English Idea
Rather than drawing triangles at all, this shader paints onto a single screen-filling rectangle and **marches an imaginary camera ray step-by-step into 3D space** for every pixel:
- Six invisible spheres (five orbiting harmonic bodies plus one tied directly to your mouse cursor) report how far away any 3D point is (`Signed Distance Function`).
- Combining those distances with a **smooth minimum (`smin`)** function makes separate droplets stretch, bridge, and melt together like liquid mercury whenever your cursor passes near them—something traditional polygon meshes struggle to do cleanly in real time.

---

## 5. Multi-Tier Mobile & Low-Power Degradation Pipeline
**Files**: `src/lib/asset-pipeline.ts`, `src/components/webgl/GlobalStage.tsx`, `src/components/studio/ProceduralMediaCanvas.tsx`
- **Hardware Probing**: Detects WebGL2 support, software rasterizers (`SwiftShader` / `LLVMPipe`), CPU core count, memory hints, and screen width at startup.
- **Rolling FPS Watchdog**: Measures live frame rate in `0.75s` windows after shader warm-up and steps `high → medium → low` automatically if sustained FPS dips below `34 FPS` (reducing DPR clamp `[1,2] → [1,1.5] → [1,1]`, sphere count `44 → 26 → 14`, and particle count `1400 → 750 → 300`).
- **Zero-WebGL Fallback**: If WebGL is unavailable, renders an atmospheric radial optical gradient stage matching each section's active surface theme so 100% of navigation and content remains effortless.
