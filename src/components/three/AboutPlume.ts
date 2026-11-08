import * as THREE from "three";

/** Original analytical filament field, not a fluid/FLIP solver or captured VAT.
 * Seeded instances stay on continuous trajectories; all high-frequency work is GPU-side.
 */
const flow = `
vec3 plume(vec4 seed) {
  // A continuous, multi-strand spiral volume: vertically suspended at the opening,
  // with restrained lateral folding as the camera pulls back over the valley.
  float h = (seed.z / 3.14159265 - .5) * mix(3.6, 5.2, uCompact);
  // Uniform angle + a height offset is still statistically a uniform cylinder.
  // Two angular strata concentrate seeds into broad, twisting silver folds.
  // Each seed remains on a continuous trajectory; no respawn or CPU simulation.
  float strand = floor(seed.y / 3.14159265);
  float across = fract(seed.y / 3.14159265) - .5;
  float phase = h * 1.04 + strand * 3.14159265 + across * 2.15
    + uTime * (.55 + .06 * sin(seed.w * 6.28));
  float envelope = .96 + .32 * cos(h * 1.12 + .35) + .20 * sin(h * 2.4 - uTime * .7);
  float radius = mix(.35, 1., pow(seed.x, .45)) * max(.22, envelope);
  // A small interior population fills the folds without washing out their form.
  float interior = 1. - smoothstep(.36, .54, seed.w);
  phase = mix(phase, seed.y + uTime * .1, interior);
  radius = mix(radius, pow(seed.x, 1.4) * max(.22, envelope), interior);
  float arm = sin(phase * 2.0 + h * .55 + uTime * .12);
  float x = cos(phase) * radius * 1.62 + sin(phase * .47 + h) * .34 + arm * .16;
  float z = sin(phase) * radius * 1.12 + cos(phase * .62 - h) * .28;
  float turbulence = sin(phase * 3. + h * 2.1 + uTime * .32) * .12;
  vec3 p = vec3(x, h + turbulence, z);
  // Coherent low-frequency billows act on the whole volume, not independent
  // random per-grain jitter. Both populations evaluate the same GPU field.
  vec3 billow = vec3(sin(p.y * 1.7 + uTime * .62) - cos(p.z * 1.4),
    sin(p.z * 1.5 + uTime * .49) - cos(p.x * 1.8),
    sin(p.x * 1.6 - uTime * .57) - cos(p.y * 1.3));
  p += billow * mix(.34, .18, uCompact);
  // Successive recording frames show broad folding/advection, not a slow
  // rigid orbit. Correlated displacements preserve neighboring trajectories.
  p.x += sin(h * 1.1 + uTime * .65) * mix(.24, .22, uCompact);
  p.z += cos(h * .85 - uTime * .6) * mix(.45, .18, uCompact);
  p += sin(p.yzx * 3.1 + seed.w * 6.28 + uTime * .34) * .065;
  // Sparse pearl/bokeh outliers break the silhouette into suspended particles.
  float fringe = smoothstep(.965, .998, seed.w);
  p += vec3(cos(seed.y * 1.3) * 3.0, sin(seed.y * 2.1) * 2.1, sin(seed.y) * 2.4) * fringe;
  // Keep the opening cloud centered and vertical like the recording; the valley
  // pullback restores a little width without turning the plume into a horizontal ribbon.
  p.x += cos(h * 2.8) * .22;
  p.x *= mix(1.5, 1.05, uCompact);
  p.z *= mix(1.05, 1.12, uCompact);
  p.y *= mix(.92, 1.08, uCompact);
  p.z = min(p.z, 2.6);
  p += vec3(-.35, mix(10.1, 8.4, uCompact), 0.);
  vec3 away = p - uPointer;
  float distanceToPointer = length(away);
  p += away / max(.01, distanceToPointer) * pow(max(0., 1. - distanceToPointer / 2.4), 2.) * uPointerStrength * .62;
  return p;
}`;
const declarations = `
attribute vec4 aSeed;
uniform float uTime, uCompact, uMobile, uPointerStrength, uOpacity, uPixelRatio, uFocusDistance;
uniform vec3 uPointer;
`;

export function createAboutPlume(count: number) {
  const group = new THREE.Group();
  const uniforms = {
    uTime: { value: 0 }, uCompact: { value: 0 }, uMobile: { value: 0 },
    uPointer: { value: new THREE.Vector3(0, 8.65, 0) }, uPointerStrength: { value: 0 },
    uOpacity: { value: 1 }, uCyanBoost: { value: 0 }, uPixelRatio: { value: 1 }, uFocusDistance: { value: 6.9 },
  };
  const seeds = new Float32Array(count * 4);
  let state = 20261029;
  const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
  for (let i = 0; i < count; i++) {
    seeds.set([random(), random() * Math.PI * 2, Math.acos(2 * random() - 1), random()], i * 4);
  }
  // Camera-facing analytic grains: evaluate the expensive trajectory on four
  // vertices, not 240. Curved normals and per-fragment surface depth retain
  // spherical lighting/occlusion in the real 3D world; no captured texture.
  const base = new THREE.PlaneGeometry(2, 2);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.attributes.position);
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: `${declarations}
varying vec2 vDisc; varying vec3 vCenterEye; varying float vRadius, vSeed, vCore;
${flow}
void main() {
  // Most beads stay small and pearl-like; only the far-tail seeds become
  // foreground bokeh, and the same tail is displaced beyond the coherent cloud.
  float bokeh = smoothstep(.997, .9998, aSeed.w);
  float pearlRadius = .012 + .022 * pow(aSeed.w, 3.2);
  float bokehRadius = .035 + .035 * pow(aSeed.x, 1.6);
  // Opening grains read as real silver beads; retain the smaller world-space
  // radius once the camera resolves the suspended cloud over the basin.
  vRadius = mix(pearlRadius, bokehRadius, bokeh) * mix(1.9, 1., uCompact);
  vCenterEye = (modelViewMatrix * vec4(plume(aSeed), 1.)).xyz;
  vDisc = position.xy;
  vec4 eye = vec4(vCenterEye + vec3(position.xy * vRadius, 0.), 1.);
  vSeed = aSeed.w;
  vCore = exp(-pow((aSeed.z - 1.6) * 3., 2.)) * (1. - smoothstep(.15, .55, aSeed.x));
  gl_Position = projectionMatrix * eye;
}`,
    fragmentShader: `uniform float uOpacity, uCyanBoost, uCompact, uFocusDistance;
uniform mat4 projectionMatrix;
varying vec2 vDisc; varying vec3 vCenterEye; varying float vRadius, vSeed, vCore;
void main() {
  float r2 = dot(vDisc, vDisc);
  if (r2 > 1.) discard;
  vec3 n = vec3(vDisc, sqrt(max(0., 1. - r2)));
  vec3 surfaceEye = vCenterEye + n * vRadius;
  vec3 vEye = -surfaceEye;
  float vDepth = -surfaceEye.z;
  vec4 surfaceClip = projectionMatrix * vec4(surfaceEye, 1.);
  gl_FragDepth = .5 + .5 * surfaceClip.z / surfaceClip.w;
  vec3 light = normalize(vec3(-.3, .8, .7));
  float diffuse = max(0., dot(n, light));
  float specular = pow(max(0., dot(n, normalize(light + normalize(vEye)))), 26.);
  float fresnel = pow(1. - max(0., dot(n, normalize(vEye))), 3.);
  vec3 color = vec3(.07, .08, .09) + vec3(.40, .43, .45) * diffuse + specular * 1.45 + fresnel * .13;
  color = mix(color, vec3(.001, 1.8, 2.4) * (diffuse + .6) + specular * .2, clamp(uCyanBoost * vCore * 1.6, 0., 1.));
  // Near/far grains share directional light but not identical exposure: the
  // back of the suspended volume is occluded, not a flat sheet of white beads.
  color *= mix(.58, 1., smoothstep(-2.5, 2.5, vCenterEye.z + uFocusDistance));
  color *= mix(.82, 1.35, uCompact) * mix(1., .65, smoothstep(8., 90., vDepth));
  gl_FragColor = vec4(color, uOpacity * mix(.58, 1., vSeed) * (1. - smoothstep(.82, 1., r2)));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; group.add(mesh);
  const dustGeometry = new THREE.BufferGeometry();
  // Fine grains supply density cheaply; population is fixed at mount, not per-frame.
  const dustCount = count * 6;
  const dustSeeds = new Float32Array(dustCount * 4);
  for (let i = 0; i < dustCount; i++) {
    dustSeeds.set([random(), random() * Math.PI * 2, Math.acos(2 * random() - 1), random()], i * 4);
  }
  dustGeometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(dustCount * 3), 3));
  dustGeometry.setAttribute("aSeed", new THREE.BufferAttribute(dustSeeds, 4));
  const dustMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.NormalBlending,
    vertexShader: `${declarations}
varying float vFade, vBlur, vSeed, vCore;
${flow}
void main() {
  vec3 p = plume(aSeed);
  // Sparse seeded foreground grains are actual nearer 3D points, not an overlay.
  p.z += smoothstep(.965, 1., aSeed.w) * mix(3.6, 1.4, uCompact);
  vec4 eye = modelViewMatrix * vec4(p, 1.);
  float defocus = abs(-eye.z - uFocusDistance);
  vBlur = smoothstep(1.6, 5., defocus) * (.3 + .7 * pow(aSeed.w, 8.));
  float perspective = clamp(7.5 / max(1., -eye.z), .06, 2.);
  float diameter = mix(2.8 + aSeed.x * 4.2, 2.5 + aSeed.x * 2.2, uCompact) * perspective * uPixelRatio + vBlur * 12.;
  gl_PointSize = clamp(diameter, 1., 32.);
  // Preserve projected coverage when hardware clamps a subpixel grain to 1px.
  vFade = uOpacity * mix(.72, .23, vBlur) * mix(min(1., diameter * diameter), max(.5, min(1., diameter * diameter)), uCompact);
  vSeed = aSeed.w;
  vCore = exp(-pow((aSeed.z - 1.6) * 3., 2.)) * (1. - smoothstep(.15, .55, aSeed.x));
  gl_Position = projectionMatrix * eye;
}`,
    fragmentShader: `uniform float uCyanBoost, uCompact;
varying float vFade, vBlur, vSeed, vCore;
void main() {
  vec2 p = (gl_PointCoord - .5) * 2.;
  float r2 = dot(p, p);
  if (r2 > 1.) discard;
  float z = sqrt(max(0., 1. - r2));
  vec3 n = vec3(p.x, -p.y, z);
  vec3 light = normalize(vec3(-.3, .8, .7));
  float diffuse = max(0., dot(n, light));
  float specular = pow(max(0., dot(n, normalize(light + vec3(0., 0., 1.)))), 20.);
  vec3 silver = vec3(.065, .075, .08) + vec3(.42, .46, .48) * diffuse + specular * 1.45;
  silver = mix(silver, vec3(.001, 1.8, 2.4) * (diffuse + .6) + specular * .2, clamp(uCyanBoost * vCore * 1.6, 0., 1.));
  float edge = 1. - smoothstep(mix(.62, .05, vBlur), 1., r2);
  gl_FragColor = vec4(silver * mix(.8, 1.2, vSeed) * mix(.85, 2.4, uCompact), edge * vFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,

  });
  const dust = new THREE.Points(dustGeometry, dustMaterial); dust.frustumCulled = false; group.add(dust);
  return { group, material, count, dispose() { geometry.dispose(); base.dispose(); material.dispose(); dustGeometry.dispose(); dustMaterial.dispose(); } };
}
