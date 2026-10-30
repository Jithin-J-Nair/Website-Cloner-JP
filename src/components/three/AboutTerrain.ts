import * as THREE from "three";

const lerp = THREE.MathUtils.lerp;
const smoothstep = (a: number, b: number, x: number) => THREE.MathUtils.smoothstep(x, a, b);

/** Deterministic original crater basin informed by historical composition,
 * not captured topography. The real mesh, contour extraction and figure
 * placement share this function so their surfaces cannot drift apart. */
export function terrainHeightAt(x: number, z: number): number {
  const valleyDist = Math.hypot(x * 0.92, (z - 3.5) * 0.52);
  const rimRise = smoothstep(5.2, 23.0, valleyDist) * 9.6;

  // Jagged multi-octave mountain ridges stronger on left & right flanks ('about-02', 'about-04')
  const n1 = Math.sin(x * 0.21 + z * 0.14) * Math.cos(z * 0.19 - x * 0.11);
  const n2 = Math.sin(x * 0.47 - z * 0.36) * 0.52 + Math.cos(x * 0.83 + z * 0.61) * 0.26;
  const n3 = Math.abs(Math.sin(x * 0.33 + Math.cos(z * 0.28) * 1.6));
  const flankMask = smoothstep(3.4, 13.5, Math.abs(x) + Math.max(0, -z) * 0.38);

  const hash = (a: number, b: number) => { const q = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return q - Math.floor(q); };
  const noise = (a: number, b: number) => {
    const ix = Math.floor(a), iz = Math.floor(b), fx = a - ix, fz = b - iz;
    const u = fx * fx * (3 - 2 * fx), v = fz * fz * (3 - 2 * fz);
    return lerp(lerp(hash(ix, iz), hash(ix + 1, iz), u), lerp(hash(ix, iz + 1), hash(ix + 1, iz + 1), u), v);
  };
  const detail = (noise(x * .65, z * .65) * .8 + noise(x * 1.3 + 17, z * 1.3) * .4 + noise(x * 2.2, z * 2.2 + 23) * .18) * (0.28 + flankMask);
  const micro = Math.sin(x * 1.45 + z * 1.32) * 0.11 * (0.35 + flankMask);
  return rimRise + (n1 * 2.35 + n2 * 1.45 + n3 * 2.15) * flankMask + micro + detail - 1.7;
}

/** Original rock microrelief, evaluated on the existing 3D basin. No sampled
 * reference image or additional render target; detail fades below a pixel. */
export function createAboutTerrainMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: { uValleyBrightness: { value: 1 }, uOpacity: { value: 0 } },
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
      float hash(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * .1031);
        q += dot(q, q.yzx + 33.33);
        return fract((q.x + q.y) * q.z);
      }
      float noise(vec2 p) {
        vec2 cell = floor(p), f = fract(p);
        vec2 u = f * f * (3. - 2. * f);
        return mix(mix(hash(cell), hash(cell + vec2(1., 0.)), u.x),
                   mix(hash(cell + vec2(0., 1.)), hash(cell + 1.), u.x), u.y);
      }
      void main() {
        // Sample in world space so the relief stays attached on reverse scroll.
        vec2 p = vWorldPos.xz;
        float footprint = max(length(dFdx(p)), length(dFdy(p)));
        float grain = 0., relief = 0., frequency = 8., amplitude = .045;
        for (int i = 0; i < 4; i++) {
          float weight = 1. - smoothstep(.25, .85, footprint * frequency);
          float n = noise(p * frequency + float(i) * 17.3) - .5;
          relief += n * amplitude * weight;
          grain += n * weight * amplitude;
          frequency *= 2.7;
          amplitude *= .42;
        }
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
        float crevice = clamp(.72 + grain * 4.5, .35, 1.);
        vec3 rock = vec3(.004, .006, .008) + vec3(.10, .115, .125) * diffuse * crevice;
        vec3 sand = vec3(.31, .34, .35) * (.48 + diffuse * .52) * crevice;
        vec3 color = mix(rock, sand, pool * slope * uValleyBrightness);
        color += vec3(.11, .13, .14) * specular * (.25 + pool * .75);
        // During the editorial passage retain only the low pool, not a grey
        // full-screen wall behind the type. Team mode is hidden by the owner.
        color *= mix(pow(pool, 2.) * .7, 1., uValleyBrightness);
        float farFade = 1. - smoothstep(18., 32., length(p));
        gl_FragColor = vec4(color * farFade, uOpacity);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}
