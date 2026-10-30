import * as THREE from "three";

/** Original analytical filament field, not a fluid/FLIP solver or captured VAT.
 * Seeded instances stay on continuous trajectories; all high-frequency work is GPU-side.
 */
const flow = `
vec3 plume(vec4 seed) {
  float h = (seed.z / 3.14159265 - .5) * 4.8;
  float phase = h * 1.62 + uTime * .29;
  float taper = .34 + .66 * pow(max(0., 1. - abs(h) / 3.5), .6);
  float radius = pow(seed.x, 1.8) * taper;
  float orbit = seed.y + uTime * (.12 + .18 * (1. - seed.x));
  vec3 p = vec3(sin(phase) * .66 + cos(orbit) * radius,
                h + sin(orbit * 2. + h + uTime * .15) * .17,
                cos(phase * .83) * .58 + sin(orbit) * radius);
  p += sin(p.yzx * 2.3 + seed.w * 6.28 + uTime * .24) * .13;
  // Sparse outlying seeds supply real foreground/background depth, not a screen overlay.
  float fringe = smoothstep(.88, 1., seed.w);
  p += vec3(cos(seed.y) * 2.6, sin(seed.y * 2.) * 1.4, sin(seed.y) * 1.6) * fringe;
  p *= mix(1.16, .72, uCompact);
  p += vec3(-.35, mix(9.1, 6., uCompact), 0.);
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
  const base = new THREE.IcosahedronGeometry(.025, 1);
  const geometry = new THREE.InstancedBufferGeometry();
  geometry.index = base.index;
  geometry.setAttribute("position", base.attributes.position);
  geometry.setAttribute("normal", base.attributes.normal);
  geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(seeds, 4));
  geometry.instanceCount = count;
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true,
    vertexShader: `${declarations}
varying vec3 vNormal, vEye; varying float vDepth, vSeed, vCore;
${flow}
void main() {
  float scale = mix(.16, 1.8, pow(aSeed.w, 6.));
  vec3 tangent = normalize(vec3(cos(aSeed.z * 1.62), .6, sin(aSeed.z)));
  float stretch = 1. + .28 * aSeed.x;
  vec3 shape = position + tangent * dot(position, tangent) * (stretch - 1.);
  vec4 eye = modelViewMatrix * vec4(plume(aSeed) + shape * scale, 1.);
  vNormal = normalize(normalMatrix * (normal - tangent * dot(normal, tangent) * (1. - 1. / stretch)));
  vEye = -eye.xyz; vDepth = -eye.z; vSeed = aSeed.w;
  vCore = exp(-pow((aSeed.z - 1.6) * 3., 2.)) * (1. - smoothstep(.15, .55, aSeed.x));
  gl_Position = projectionMatrix * eye;
}`,
    fragmentShader: `uniform float uOpacity, uCyanBoost;
varying vec3 vNormal, vEye; varying float vDepth, vSeed, vCore;
void main() {
  vec3 n = normalize(vNormal), light = normalize(vec3(-.3, .8, .7));
  float diffuse = max(0., dot(n, light));
  float specular = pow(max(0., dot(n, normalize(light + normalize(vEye)))), 26.);
  float fresnel = pow(1. - max(0., dot(n, normalize(vEye))), 3.);
  vec3 color = vec3(.035, .045, .05) + vec3(.46, .5, .52) * diffuse + specular * .9 + fresnel * .16;
  color = mix(color, vec3(.001, 1.8, 2.4) * (diffuse + .6) + specular * .2, clamp(uCyanBoost * vCore * 1.6, 0., 1.));
  color *= mix(1., .48, smoothstep(8., 22., vDepth));
  gl_FragColor = vec4(color, uOpacity * mix(.58, 1., vSeed));
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
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `${declarations}
varying float vFade, vBlur, vSeed, vCore;
${flow}
void main() {
  vec3 p = plume(aSeed);
  vec4 eye = modelViewMatrix * vec4(p, 1.);
  float defocus = abs(-eye.z - 7.5);
  vBlur = smoothstep(1.6, 5., defocus) * (.3 + .7 * pow(aSeed.w, 8.));
  float perspective = clamp(7.5 / max(1., -eye.z), .4, 2.);
  gl_PointSize = clamp((1.25 + aSeed.x * 1.2 + vBlur * 7.) * perspective * uPixelRatio, 1., 12.);
  vFade = uOpacity * mix(.62, .25, vBlur);
  vSeed = aSeed.w;
  vCore = exp(-pow((aSeed.z - 1.6) * 3., 2.)) * (1. - smoothstep(.15, .55, aSeed.x));
  gl_Position = projectionMatrix * eye;
}`,
    fragmentShader: `uniform float uCyanBoost;
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
  vec3 silver = vec3(.055) + vec3(.6, .65, .67) * diffuse + specular * .9;
  silver = mix(silver, vec3(.001, 1.8, 2.4) * (diffuse + .6) + specular * .2, clamp(uCyanBoost * vCore * 1.6, 0., 1.));
  float edge = 1. - smoothstep(mix(.62, .05, vBlur), 1., r2);
  gl_FragColor = vec4(silver * mix(.8, 1.2, vSeed), edge * vFade);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,

  });
  const dust = new THREE.Points(dustGeometry, dustMaterial); dust.frustumCulled = false; group.add(dust);
  return { group, material, count, dispose() { geometry.dispose(); base.dispose(); material.dispose(); dustGeometry.dispose(); dustMaterial.dispose(); } };
}
