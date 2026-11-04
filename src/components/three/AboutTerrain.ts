import * as THREE from "three";

const lerp = THREE.MathUtils.lerp;
const smoothstep = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** Deterministic original crater basin informed by historical composition,
 * not captured topography. The real mesh, contour extraction and figure
 * placement share this function so their surfaces cannot drift apart. */
export function terrainHeightAt(x: number, z: number): number {
  const valleyDist = Math.hypot(x * 0.92, (z - 3.5) * 0.52);
  // Broad lunar shoulders: retain the asymmetry, but avoid the narrow, high
  // ridgelines that read as alpine peaks at the wide camera distance. The
  // center floor and all shared astronaut/rock/contour anchors remain stable.
  const rimRise = smoothstep(6.4, 26.0, valleyDist) * lerp(4.25, 3.3, smoothstep(-4, 8, x));

  const flankMask = smoothstep(4.8, 15.8, Math.abs(x) + Math.max(0, -z) * 0.38);

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
  const escarpment = (Math.pow(ridgeA, 2) - .32) * .96 + (Math.pow(ridgeB, 3) - .2) * .36 + ridgeC * .32;
  const detail = (noise(x * .65, z * .65) * .8 + noise(x * 1.3 + 17, z * 1.3) * .4 + noise(x * 2.2, z * 2.2 + 23) * .18) * (.32 + flankMask * 1.12);
  // Distinct narrow escarpments, not a single smooth bowl. Erosion runs
  // downhill in actual mesh relief and shares the floor/stone/figure sampler.
  const ridge = (center: number, width: number) => Math.pow(Math.max(0, 1 - Math.pow((x - center) / width, 2)), 1.6);
  const nearRim = 1 - smoothstep(10, 24, z);
  const left = ridge(-11 + Math.sin(z * .12) * 1.5, 6.2) * (2.95 + noise(z * .42, 2) * 1.15);
  const right = ridge(12 + Math.sin(z * .12 + 1) * 1.6, 7.6) * (1.25 + noise(z * .38, 7) * .45);
  const channels = Math.pow(1 - Math.abs(noise(wx * .22, wz * 1.5) * 2 - 1), 3);
  const erosion = (channels - .38) * .82 * flankMask;
  const micro = (noise(wx * 3.1, wz * 3.1) - .5) * .17 * flankMask;
  const edge = 1 - smoothstep(27, 43, Math.hypot(x, z * .8));
  return (rimRise * .78 + (left + right) * nearRim + escarpment * flankMask + erosion + micro + detail) * edge - 1.7;
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
    pixels[y * size + x] = Math.round(255 * lerp(lerp(hash(ix, iy), hash(ix + 1, iy), u), lerp(hash(ix, iy + 1), hash(ix + 1, iy + 1), u), v));
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
        vec2 channels = vec2(p.y * 2.2 + sin(p.x * .48) * .45, p.x * .22);
        vec2 surfaceUV = mix(p, channels, smoothstep(4.5, 10., abs(p.x)));
        float footprint = max(length(dFdx(surfaceUV)), length(dFdy(surfaceUV)));
        float grain = 0., relief = 0., frequency = 4.4, amplitude = .036;
        for (int i = 0; i < 4; i++) {
          float weight = 1. - smoothstep(.25, .85, footprint * frequency);
          float n = noise(surfaceUV * frequency + float(i) * 17.3) - .5;
          relief += n * amplitude * weight;
          grain += n * weight * amplitude;
          frequency *= 2.1;
          amplitude *= .42;
        }
        // Fine regolith remains quiet; fractured relief belongs to the flanks.
        relief *= smoothstep(4., 8., abs(p.x));
        // Screen-space surface gradient: no finite-difference resampling and no
        // additional normal texture. Work entirely in world space with the light.
        vec3 n = normalize(vNormalW);
        vec3 dx = dFdx(vWorldPos), dy = dFdy(vWorldPos);
        vec3 r1 = cross(dy, n), r2 = cross(n, dx);
        float det = dot(dx, r1);
        vec3 gradient = sign(det) * (dFdx(relief) * r1 + dFdy(relief) * r2);
        n = normalize(max(abs(det), .0000001) * n - gradient);
        vec3 lightDir = normalize(vec3(-.5, 12., 2.) - vWorldPos);
        vec3 eye = normalize(cameraPosition - vWorldPos);
        float diffuse = max(0., dot(n, lightDir));
        float specular = pow(max(0., dot(n, normalize(lightDir + eye))), 24.);
        float slope = clamp(vNormalW.y, 0., 1.);
        float pool = exp(-dot(p - vec2(0., 2.8), p - vec2(0., 2.8)) / 64.);
        float fractures = noise(surfaceUV * 1.8) * .55 + noise(surfaceUV * 6.3) * .3 + noise(p * 16.) * .15;
        float crevice = mix(.94, clamp(.15 + fractures * 1.45 + grain * 2., .24, 1.), smoothstep(4., 8., abs(p.x)));
        vec3 rock = vec3(.003, .004, .005) + vec3(.034, .039, .042) * diffuse * crevice;
        vec3 sand = vec3(.26, .30, .31) * (.48 + diffuse * .52) * crevice;
        // Pale regolith belongs to the low, shallow floor, not every slope
        // inside the light pool. This keeps the flanks dark and dimensional.
        float sandCoverage = pool * smoothstep(.55, .94, slope) * (1. - smoothstep(-.2, 2., vWorldPos.y));
        vec3 color = mix(rock, sand, sandCoverage * uValleyBrightness);
        color += vec3(.045, .055, .06) * specular * (.12 + pool * .88);
        // During the editorial passage retain only the low pool, not a grey
        // full-screen wall behind the type. Team mode is hidden by the owner.
        color *= mix(pow(pool, 2.) * .7, 1., uValleyBrightness);
        float farFade = 1. - smoothstep(23., 45., length(p));
        gl_FragColor = vec4(color, uOpacity * farFade);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  let disposed = false;
  material.addEventListener("dispose", () => { if (!disposed) { disposed = true; rockNoise.dispose(); } });
  return material;
}
