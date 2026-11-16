import * as THREE from "three";

const lerp = THREE.MathUtils.lerp;
const smoothstep = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** Deterministic original crater basin informed by historical composition,
 * not captured topography. The real mesh, contour extraction and figure
 * placement share this function so their surfaces cannot drift apart. */
export function terrainHeightAt(x: number, z: number): number {
  const valleyDist = Math.hypot(x * 0.92, (z - 3.5) * 0.13);
  // Craggy lunar escarpments: the reference has sharp, irregular ridgelines
  // framing a broad pale basin. Keep the floor anchors stable while steepening
  // the outer walls and preserving the asymmetrical skyline.
  const rimRise = smoothstep(5.2, 22.5, valleyDist) * lerp(3.4, 8.0, smoothstep(-4, 20, x));

  const flankMask = smoothstep(4.2, 14.8, Math.abs(x) + Math.max(0, -z) * 0.38);

  const hash = (a: number, b: number) => { const q = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return q - Math.floor(q); };
  const noise = (a: number, b: number) => {
    const ix = Math.floor(a), iz = Math.floor(b), fx = a - ix, fz = b - iz;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), u), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v);
  };
  // Domain-warped, ridged relief makes actual escarpments/creases in the mesh,
  // rather than trying to disguise broad sinusoidal hills with a normal texture.
  const wx = x + (noise(x * .065, z * .065) - .5) * 4.2;
  const wz = z + (noise(z * .075 + 19, x * .075) - .5) * 3.0;
  const ridgeA = 1 - Math.abs(noise(wx * .14, wz * .14) * 2 - 1);
  const ridgeB = 1 - Math.abs(noise(wx * .34 + 31, wz * .31 - 11) * 2 - 1);
  const ridgeC = 1 - Math.abs(noise(wx * .72 - 7, wz * .72 + 41) * 2 - 1);
  const escarpment = (Math.pow(ridgeA, 2.55) - .24) * 1.18 + (Math.pow(ridgeB, 3.5) - .15) * .5 + ridgeC * .32;
  const detail = .72 * (noise(x * .65, z * .65) * .8 + noise(x * 1.3 + 17, z * 1.3) * .4 + noise(x * 2.2, z * 2.2 + 23) * .18) * (.32 + flankMask * 1.12);
  // Distinct narrow escarpments, not a single smooth bowl. Erosion runs
  // downhill in actual mesh relief and shares the floor/stone/figure sampler.
  // A sharp watershed with independent along-ridge erosion, rather than a
  // quadratic mound extruded down the valley. This changes actual silhouettes.
  const ridge = (center: number, width: number) => Math.pow(Math.max(0, 1 - Math.abs((x - center) / width)), 1.02);
  const buttress = .88 + .24 * Math.pow(1 - Math.abs(noise(z * .24, 29) * 2 - 1), 2);
  const nearRim = 1 - smoothstep(10, 24, z);
  // A broad outer shelf with a steep, irregular inner face, rather than a
  // rounded tent-shaped ridge. The supplied close still has a long left crest
  // dropping into the floor; its silhouette is not a pointed alpine summit.
  const leftCrest = -13.2 + Math.sin(z * .14) * 1.1 + (noise(z * .4, 71) - .5) * .85;
  const leftShelf = smoothstep(-24, -16, x) * (1 - smoothstep(leftCrest - .9, leftCrest + 2.0, x));
  const left = leftShelf * (3.0 + noise(z * .3, 2) * .65) * buttress * .9;
  // The tall rear escarpment is separate from the lower foreground shoulder;
  // the supplied basin still has a high right skyline, not a symmetric mound.
  const rearWall = Math.exp(-Math.pow((x - 16) / 6, 2))
    * smoothstep(0, 10, -z) * (1 - smoothstep(24, 38, -z))
    * (2.5 + Math.pow(1 - Math.abs(noise(z * .19, 61) * 2 - 1), 3) * 1.8);
  const right = ridge(11.8 + Math.sin(z * .18 + 1) * 1.8, 6.6) * (2.35 + noise(z * .38, 7) * 1.0) * buttress;
  // Separate foreground escarpments enter only on the physical pullback.
  // Without these the distant view reads as a closed miniature volcano: the
  // supplied wide composition has tall, near-camera shoulders framing its floor.
  const frontDepth = smoothstep(1, 11, z) * Math.exp(-Math.pow((z - 19) / 14, 2));
  const foreground = (ridge(-15 + Math.sin(z * .14) * 1.4, 5.8) * 4.8
    + ridge(17.5 + Math.sin(z * .17) * 1.2, 6.2) * 3.5) * frontDepth * buttress;
  const channels = Math.pow(1 - Math.abs(noise(wx * .6, wz * .7) * 2 - 1), 3);
  const erosion = (channels - .38) * .46 * flankMask;
  const micro = (noise(wx * 3.1, wz * 3.1) - .5) * .17 * flankMask;
  // Nonperiodic rills run down the escarpments rather than puffing them into
  // smooth dunes. All contact objects still evaluate this same surface.
  const rills = Math.pow(1 - Math.abs(noise(wx * .24, wz * 1.45 + wx * .14) * 2 - 1), 4);
  const incision = rills * .48 * flankMask;
  const edge = 1 - smoothstep(44, 72, Math.hypot(x, z * .8));
  return (rimRise * .78 + (left + right) * nearRim + rearWall + foreground + escarpment * flankMask + erosion + micro + detail - incision) * edge - 1.7;
}

/** Original rock microrelief, evaluated on the existing 3D basin. No sampled
 * reference image or additional render target; detail fades below a pixel. */
export function createAboutTerrainMaterial() {
  // Bake a periodic original noise tile once, rather than hashing sixteen
  // lattice corners per terrain fragment per frame. Mips filter subpixel relief.
  const size = 256, pixels = new Uint8Array(size * size);
  const hash = (x: number, y: number) => {
    let n = Math.imul(x & 63, 374761393) ^ Math.imul(y & 63, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967295;
  };
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const px = x / 4, py = y / 4, ix = Math.floor(px), iy = Math.floor(py);
    const fx = px - ix, fy = py - iy, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy);
    const at = y * size + x;
    pixels[at] = Math.round(255 * lerp(lerp(hash(ix, iy), hash(ix + 1, iy), u), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v));

  }
  const rockNoise = new THREE.DataTexture(pixels, size, size, THREE.RedFormat);
  rockNoise.wrapS = rockNoise.wrapT = THREE.RepeatWrapping;
  rockNoise.magFilter = THREE.LinearFilter;
  rockNoise.minFilter = THREE.LinearMipmapLinearFilter;
  rockNoise.generateMipmaps = true; rockNoise.needsUpdate = true;
  const material = new THREE.ShaderMaterial({
    uniforms: { uValleyBrightness: { value: 1 }, uOpacity: { value: 0 }, uRockNoise: { value: rockNoise } },
    transparent: true,
    // Fading ground must not invisibly occlude the contour stage.
    depthWrite: false,
    vertexShader: `
      varying vec3 vWorldPos, vNormalW;
      void main() {
        vec4 wp = modelMatrix * vec4(position, 1.);
        vWorldPos = wp.xyz;
        vNormalW = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: `
      uniform float uValleyBrightness, uOpacity;
      varying vec3 vWorldPos, vNormalW;
      uniform sampler2D uRockNoise;
      float noise(vec2 p) { return texture2D(uRockNoise, p / 64.).r; }
      void main() {
        // Sample in world space so the relief stays attached on reverse scroll.
        vec2 p = vWorldPos.xz;
        // Follow the basin's downhill direction on steep rock. Isotropic noise
        // previously looked like crumpled paper rather than an eroded surface.
        // No atan seam: the former polar-UV derivative discontinuity made a
        // high-contrast checker/moire patch across the right mountain face.
        vec2 channels = vec2(p.y * .9 + p.x * .45, p.x * .72 - p.y * .24);
        // Avoid long rubber-like grooves: cross-cut drainage with shorter
        // isotropic fractures while keeping the same mip-filtered noise tile.
        channels += vec2(noise(p * .38), noise(p * .38 + 13.)) * 1.2;
        vec2 surfaceUV = mix(p, channels, smoothstep(4.5, 10., abs(p.x)));
        float footprint = max(length(dFdx(surfaceUV)), length(dFdy(surfaceUV)));
        float grain = 0., relief = 0., frequency = 5.4, amplitude = .036;
        for (int i = 0; i < 4; i++) {
          float weight = 1. - smoothstep(.25, .85, footprint * frequency);
          float n = noise(surfaceUV * frequency + float(i) * 17.3) - .5;
          relief += n * amplitude * weight;
          grain += n * weight * amplitude;
          frequency *= 2.1;
          amplitude *= .45;
        }
        // Fine regolith remains quiet; fractured relief belongs to the flanks.
        relief *= smoothstep(4., 8., abs(p.x)) * 1.18;
        // Screen-space surface gradient: no finite-difference resampling and no
        // additional normal texture. Work entirely in world space with the light.
        vec3 n = normalize(vNormalW);
        vec3 dx = dFdx(vWorldPos), dy = dFdy(vWorldPos);
        vec3 r1 = cross(dy, n), r2 = cross(n, dx);
        float det = dot(dx, r1);
        vec3 gradient = sign(det) * (dFdx(relief) * r1 + dFdy(relief) * r2);
        n = normalize(max(abs(det), .0000001) * n - gradient * .65);
        vec3 lightDir = normalize(vec3(-.5, 12., 2.) - vWorldPos);
        vec3 eye = normalize(cameraPosition - vWorldPos);
        float diffuse = max(0., dot(n, lightDir));
        float specular = pow(max(0., dot(n, normalize(lightDir + eye))), 24.);
        float slope = clamp(vNormalW.y, 0., 1.);
        float pool = exp(-dot(p - vec2(0., 2.8), p - vec2(0., 2.8)) / 145.);
        float fractured = 1. - abs(noise(surfaceUV * 1.8) * 2. - 1.);
        float fractures = pow(fractured, 2.) * .55 + noise(surfaceUV * 6.3) * .3 + noise(p * 16.) * .15;
        // Fine mineral variation must not paint large black cavities onto
        // otherwise smooth rock. Actual mesh normals carry the broad shading.
        float crevice = mix(.96, clamp(.88 + (fractures - .5) * .18 + grain * 2.5, .72, 1.05), smoothstep(4., 8., abs(p.x)));
        float flankExposure = mix(1., p.x < 0. ? 1.22 : .78, smoothstep(4., 8., abs(p.x)));
        vec3 rock = vec3(.004, .005, .006) + vec3(.044, .05, .054) * diffuse * crevice * flankExposure;
        // Linear-space pale regolith target; after ACES + sRGB output this is
        // tuned toward the measured 201/208/210 centre-floor sample.
        vec3 sand = vec3(.32, .35, .36) * (.48 + diffuse * .52) * crevice;
        // Pale regolith belongs to the low, shallow floor, not every slope
        // inside the light pool. This keeps the flanks dark and dimensional.
        float sandCoverage = pool * smoothstep(.85, .99, slope) * (1. - smoothstep(-1.25, .25, vWorldPos.y));
        vec3 color = mix(rock, sand, sandCoverage * uValleyBrightness);
        color += vec3(.045, .055, .06) * specular * (.12 + pool * .88);
        // Low reflected shaft light continues down the floor; it must not end
        // in a circular black cutoff immediately outside the astronaut's pool.
        float spill = exp(-p.x * p.x / 72. - pow((p.y - 9.) / 30., 2.));
        color += vec3(.026, .032, .035) * spill * smoothstep(.65, .94, slope) * uValleyBrightness;
        // Quiet, mip-filtered fines only. Larger grains are real clustered,
        // half-embedded instances; the former repeated black-dot tile is gone.
        color *= .98 + noise(p * 22.) * .04;
        // During the editorial passage retain only the low pool, not a grey
        // full-screen wall behind the type. Team mode is hidden by the owner.
        color *= mix(pow(pool, 2.) * .7, 1., uValleyBrightness);
        // Fade the distant sides, not the near foreground floor: a circular
        // world-space mask made the pullback look like a floating little island.
        float farFade = 1. - smoothstep(58., 96., length(vec2(p.x, p.y * .52)));
        gl_FragColor = vec4(color, uOpacity * farFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  let disposed = false;
  material.addEventListener("dispose", () => { if (!disposed) { disposed = true; rockNoise.dispose(); } });
  return material;
}

/** Original sediment patches, not a uniform polar disk or a tiled dot pattern.
 * A bounded, seeded rest population; the flow shader transports it on the GPU.
 */
export function createAboutGroundClasts(count: number) {
  let state = 492801;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  const centers = Array.from({ length: 19 }, (_, i) => {
    const z = -12 + i * 2.1;
    return { x: Math.sin(i * 2.39) * (3.5 + random() * 5.5), z };
  });
  const stones: Array<{ x: number; y: number; z: number; size: number; aspect: number; angle: number }> = [];
  for (let attempt = 0; stones.length < count && attempt < count * 28; attempt++) {
    const patch = centers[Math.floor(random() * centers.length)];
    const loose = random() < .2;
    const x = loose ? (random() - .5) * 25 : patch.x + (random() + random() + random() - 1.5) * 3.3;
    const z = loose ? -15 + random() * 45 : patch.z + (random() + random() - 1) * 3.4;
    const y = terrainHeightAt(x, z);
    // Keep steep cliffs and the astronaut's immediate footprint free of gravel.
    if (y > .3 || Math.hypot(x + .35, z + 1.8) < .85) continue;
    const size = .018 + Math.pow(random(), 3) * .055;
    const aspect = .35 + random() * .35;
    stones.push({ x, y: y + size * aspect * .45, z, size, aspect, angle: random() * Math.PI * 2 });
  }
  return stones;
}

/** Aura-driven Lagrangian gravel paths: outward travel, lift, invisible reset.
 * Eight baked ground samples per path keep the moving stones above the SAME
 * terrain as the explorer. Only two uniforms change on the owner's clock. */
export function attachAboutGroundFlow(
  geometry: THREE.BufferGeometry,
  material: THREE.MeshStandardMaterial,
  stones: ReturnType<typeof createAboutGroundClasts>,
  stationaryPrefix = 0,
) {
  const seeds = new Float32Array(stones.length * 4);
  const floorsA = new Float32Array(stones.length * 4);
  const floorsB = new Float32Array(stones.length * 4);
  stones.forEach((stone, i) => {
    const dx = stone.x + .35, dz = stone.z + 1.8;
    const radius = Math.hypot(dx, dz);
    const end = Math.min(24, radius + 4);
    const nx = dx / radius, nz = dz / radius;
    seeds.set([nx, nz, end, i < stationaryPrefix ? -1 : ((i * .61803398875) % 1)], i * 4);
    for (let j = 0; j < 8; j++) {
      const r = .92 + (end - .92) * j / 7;
      const height = terrainHeightAt(-.35 + nx * r, -1.8 + nz * r) + stone.size * stone.aspect * .45;
      (j < 4 ? floorsA : floorsB)[i * 4 + j % 4] = height;
    }
  });
  geometry.setAttribute("aGroundFlow", new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.setAttribute("aGroundFloorA", new THREE.InstancedBufferAttribute(floorsA, 4));
  geometry.setAttribute("aGroundFloorB", new THREE.InstancedBufferAttribute(floorsB, 4));
  const uniforms = { uGroundTime: { value: 0 }, uGroundMotion: { value: 1 } };
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace("#include <common>", `#include <common>
      attribute vec4 aGroundFlow,aGroundFloorA,aGroundFloorB;
      uniform float uGroundTime,uGroundMotion;
      float groundSample(int i){if(i<4)return aGroundFloorA[i];return aGroundFloorB[i-4];}
    `).replace("#include <begin_vertex>", `#include <begin_vertex>
      float motion=uGroundMotion*step(0.,aGroundFlow.w);
      float age=fract(uGroundTime*.145+aGroundFlow.w);
      float birth=smoothstep(0.,.06,age)*(1.-smoothstep(.84,1.,age));
      transformed*=mix(1.,birth,motion);
    `).replace("#include <project_vertex>", `#include <project_vertex>
      float radius=mix(.92,aGroundFlow.z,age);
      float sampleIndex=age*7.;int lo=min(6,int(floor(sampleIndex)));
      float floorY=mix(groundSample(lo),groundSample(lo+1),fract(sampleIndex));
      float lift=pow(age,1.65)*(.6+3.7*fract(aGroundFlow.w*17.31));
      vec3 target=vec3(-.35+aGroundFlow.x*radius,floorY+lift,-1.8+aGroundFlow.y*radius);
      vec3 rest=instanceMatrix[3].xyz;
      mvPosition+=viewMatrix*vec4((target-rest)*motion,0.);
      gl_Position=projectionMatrix*mvPosition;
    `);
  };
  material.customProgramCacheKey = () => "about-aura-ground-flow-v1";
  return uniforms;
}
