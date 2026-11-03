import * as THREE from "three";

/** Original analytical filament field, not a fluid/FLIP solver or captured VAT.
 * Seeded instances stay on continuous trajectories; all high-frequency work is GPU-side.
 */
const flow = `
vec3 plume(vec4 seed) {
  // Densely sampled lobes connected by a narrow neck. The previous uniform
  // cylindrical scatter read as a sparse ribbon rather than suspended matter.
  float h = (seed.z / 3.14159265 - .5) * mix(3.9, 4.8, uCompact);
  float phase = h * 1.62 + uTime * .13;
  float lobe = exp(-pow((h + .6) * 1.2, 2.)) + exp(-pow((h - 1.3) * 1.6, 2.)) * .48;
  float taper = (.32 + 1.55 * lobe) * (1. - .20 * smoothstep(1.2, 2.6, abs(h)));
  float radius = pow(seed.x, .75) * taper;
  float orbit = seed.y + uTime * (.12 + .18 * (1. - seed.x));
  vec3 p = vec3(sin(phase) * .48 + cos(orbit) * radius,
                h + sin(orbit * 2. + h + uTime * .15) * .10,
                cos(phase * .83) * .38 + sin(orbit) * radius);
  p += sin(p.yzx * 3.1 + seed.w * 6.28 + uTime * .24) * .07;
  // Only sparse outliers leave the coherent core. Their distribution is shared
  // by both physical grains and depth-aware fine scatter.
  float fringe = smoothstep(.90, 1., seed.w);
  p += vec3(cos(seed.y) * 3.25, sin(seed.y * 2.) * 1.55, sin(seed.y) * 2.0) * fringe;
  p.xz *= mix(1.58, 1.86, uCompact);
  p.y *= mix(1.16, .90, uCompact);
  p += vec3(-.35, 8.4, 0.);
  vec3 away = p - uPointer;
  float distanceToPointer = length(away);
  p += away / max(.01, distanceToPointer) * pow(max(0., 1. - distanceToPointer / 2.4), 2.) * uPointerStrength * .62;
  return p;
}`;
const declarations = `
attribute vec4 aSeed;
uniform float uTime, uCompact, uMobile, uPointerStrength, uOpacity, uPixelRatio;
uniform vec3 uPointer;
`;

export function createAboutPlume(count: number) {
  const group = new THREE.Group();
  const uniforms = {
    uTime: { value: 0 }, uCompact: { value: 0 }, uMobile: { value: 0 },
    uPointer: { value: new THREE.Vector3(0, 8.65, 0) }, uPointerStrength: { value: 0 },
    uOpacity: { value: 1 }, uCyanBoost: { value: 0 }, uPixelRatio: { value: 1 },
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
  // A meaningful population of mid-sized metal grains supplies a surface;
  // a near-zero radius on most instances previously left only fine dust visible.
  float outlier = smoothstep(.93, 1., aSeed.w);
  vRadius = .052 * mix(.48, 1.85, pow(aSeed.w, 2.8)) * mix(1., .58, outlier);
  vCenterEye = (modelViewMatrix * vec4(plume(aSeed), 1.)).xyz;
  vDisc = position.xy;
  vec4 eye = vec4(vCenterEye + vec3(position.xy * vRadius, 0.), 1.);
  vSeed = aSeed.w;
  vCore = exp(-pow((aSeed.z - 1.6) * 3., 2.)) * (1. - smoothstep(.15, .55, aSeed.x));
  gl_Position = projectionMatrix * eye;
}`,
    fragmentShader: `uniform float uOpacity, uCyanBoost, uCompact;
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
  vec3 color = vec3(.035, .04, .043) + vec3(.25, .28, .29) * diffuse + specular * .7 + fresnel * .10;
  color = mix(color, vec3(.001, 1.8, 2.4) * (diffuse + .6) + specular * .2, clamp(uCyanBoost * vCore * 1.6, 0., 1.));
  color *= mix(.82, 1.35, uCompact) * mix(1., .65, smoothstep(8., 90., vDepth));
  gl_FragColor = vec4(color, uOpacity * mix(.58, 1., vSeed) * (1. - smoothstep(.82, 1., r2)));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
  const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; group.add(mesh);
  const dustGeometry = new THREE.BufferGeometry();
  // Fine grains supply density cheaply; population is fixed at mount, not per-frame.
  const dustCount = count * 4;
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
  float defocus = abs(-eye.z - 7.5);
  vBlur = smoothstep(1.6, 5., defocus) * (.3 + .7 * pow(aSeed.w, 8.));
  float perspective = clamp(7.5 / max(1., -eye.z), .4, 2.);
  gl_PointSize = clamp((1.9 + aSeed.x * 2.4 + vBlur * 18.) * perspective * uPixelRatio, 1., 32.);
  vFade = uOpacity * mix(.65, .23, vBlur);
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
  vec3 silver = vec3(.035) + vec3(.23, .27, .28) * diffuse + specular * .55;
  silver = mix(silver, vec3(.001, 1.8, 2.4) * (diffuse + .6) + specular * .2, clamp(uCyanBoost * vCore * 1.6, 0., 1.));
  float edge = 1. - smoothstep(mix(.62, .05, vBlur), 1., r2);
  gl_FragColor = vec4(silver * mix(.8, 1.2, vSeed) * mix(.85, 1.6, uCompact), edge * vFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,

  });
  const dust = new THREE.Points(dustGeometry, dustMaterial); dust.frustumCulled = false; group.add(dust);
  return { group, material, count, dispose() { geometry.dispose(); base.dispose(); material.dispose(); dustGeometry.dispose(); dustMaterial.dispose(); } };
}
