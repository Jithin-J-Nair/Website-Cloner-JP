# 3D & Media Asset Provenance (`docs/ASSETS.md`)

All third-party 3D assets shipped in this repository have verified open licenses suitable for public web redistribution and contain **zero** proprietary files copied from `lusion.co`.

---

## 1. Homepage Astronaut Spacesuit (`public/models/astronaut.glb`)

| Field | Verified Value |
| --- | --- |
| **Shipped Path** | `public/models/astronaut.glb` |
| **Shipped File Size** | `1,227,320` bytes (`1.170 MB`) |
| **Shipped GLB SHA-256** | `e87baf5bb7a646a814b155fc3eb86a3e1dbcc0366cf0d63206062d691aca08ec` |
| **Upstream Title** | *Gemini Spacesuit* (`3D Models/Gemini Spacesuit/Gemini Spacesuit.glb`) |
| **Upstream Repository URL** | `https://github.com/nasa/NASA-3D-Resources/tree/master/3D%20Models/Gemini%20Spacesuit` |
| **Upstream Git Blob SHA** | `c4166e134ff5c7a6a8d98517ea395521d09c6df1` |
| **Upstream Raw File Size** | `2,876,516` bytes (`2.743 MB`) |
| **Upstream Raw SHA-256** | `972096ada3f5f4bfb54cd636e103f096f4ecf8d5bbc7dae40778c0185fa82266` |
| **Verified Upstream Authors / Maintainers** | **Jason Duley** (`jason.duley@nasa.gov`), **Matthew Sanders** (`matthew.g.sanders@nasa.gov`), and **NASA Ames Research Center Special Projects** (`arc-webservices@mail.nasa.gov` / `arc-special-proj@lists.nasa.gov`) |
| **Verified Applicable License & Terms** | **United States Government Public Domain (`17 U.S.C. § 105`)** per `nasa/NASA-3D-Resources/README.md` (`sha: 9d5d1a8a2d03a1dcb65e5cdc8e97bfb7f12ce43d`: *"This is a growing collection of 3D models, textures, and images from inside NASA... **These assets are free and without copyright.** Please read the [usage guidelines](https://www.nasa.gov/nasa-brand-center/images-and-media)."*); repository `meta.json` (`sha: 69caa13127960bf7daeb2f33b6f4315b277bc37e`) additionally lists **NASA Open Source Agreement Version 1.3**. Public web redistribution and derivative modification are explicitly permitted; no NASA Worm/Meatball insignia is included and no NASA endorsement is implied. |
| **Attribution** | Courtesy of **NASA 3D Resources** (NASA Ames Research Center / NASA Johnson Space Center). |
| **glTF Extensions Used** | `EXT_meshopt_compression`, `KHR_mesh_quantization`, `EXT_texture_webp` (built reproducibly via `node scripts/build-astronaut-glb.mjs`) |
| **Post-Compression Geometry** | `1` skinned mesh (`4` primitives / `4` materials), `33,467` vertices, `55,514` triangles (`suit_fabric`: `41,885` tris, `suit_webbing`: `6,299` tris, `suit_dark_hardware`: `5,157` tris, `visor_glass`: `2,173` tris) |
| **Skeleton / Rig** | `1` glTF `Skin` (`AstronautSkin`) with `15` hierarchical bones (`Hips`, `Spine`, `Chest`, `Neck`, `Head`, `ShoulderL/R`, `ElbowL/R`, `WristL/R`, `HipL/R`, `KneeL/R`) |
| **Embedded Textures (Procedural)** | `suit_quilted_normal` (`2048×2048` WebP, `533.0 KB`, `NoColorSpace` linear tangent-space normal map — organic Beta-cloth compression folds & ripstop weave) + `suit_quilted_orm` (`2048×2048` WebP, `73.4 KB`, `NoColorSpace` linear `R=AO, G=Roughness, B=Metalness`). Downsampled to `1024×1024` on mobile quality tier (`< 820px`). |
| **Rejected Candidate Models** | 1. `google/model-viewer` `Astronaut.glb` (`CC-BY 2.0`, Google Poly): rejected — stylized low-poly cartoon proportions lacking realistic cloth folds, harness straps, belly ports, or articulated gloves.<br>2. `google/model-viewer` `NeilArmstrong.glb` (Smithsonian Digitization): rejected — subject to separate Smithsonian `Usage Conditions Apply` terms (`si.edu/Termsofuse`) and bulky lunar A7L chest RCU unit does not match the streamlined two-port Gemini/EMU silhouette. |

---

## 2. Procedural Scene Shaders & Textures (`GoalTunnelSection.tsx` & `HeroCrossesStage.tsx`)

- **Earth Limb & Atmosphere (`AstronautEmergenceAssets.ts`):** 100% procedural GLSL sphere & Fresnel atmosphere glow (`deep navy ocean -> crisp blue-white limb halo`, domain-warped multi-octave fBm cloud deck, black night terminator, radial solar corona). Zero external satellite or proprietary textures used.
- **Studio Lighting Environments (`HeroCrossesStage.tsx` & `AstronautEmergenceAssets.ts`):** Generated procedurally at runtime via `THREE.PMREMGenerator.fromScene(...)`, with all temporary scene meshes, materials, and `PMREMGenerator` disposed immediately after bake.
- **Homepage Hollow Crosses (`HollowCrossGeometry.ts`):** 100% procedural polar-radial lathe + analytical smooth-union SDF geometry.
