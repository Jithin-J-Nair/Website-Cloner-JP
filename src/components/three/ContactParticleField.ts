import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Original GPU-authored stream/heap, not a FLIP solver or a captured simulation.
 * Three meshes regardless of count; seeds upload once, all flow/lighting is shader-side.
 */
export function createContactParticleField(requestedCount = 960) {
  const count = Math.min(2400, Math.max(120, Math.floor(Number.isFinite(requestedCount) ? requestedCount : 960)));
  const group = new THREE.Group();
  const uniforms = {
    uSpin: { value: new THREE.Matrix3() },
    uTime: { value: 0 }, uProgress: { value: 0 }, uReduced: { value: 0 },
    uViewport: { value: new THREE.Vector2(12, 9) },
    uPointer: { value: new THREE.Vector3(0, 0, 0) },
    uTextBottom: { value: 0.2 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: true,
    vertexShader: `
      attribute vec4 aSeed, aOrientation;
      uniform mat3 uSpin;
      uniform float uTime, uProgress, uReduced, uTextBottom;
      uniform vec2 uViewport;
      uniform vec3 uPointer;
      varying vec3 vNormal, vEye;
      varying float vLife;
      vec3 orient(vec3 p, vec4 q) {
        return p + 2. * cross(q.xyz, cross(q.xyz, p) + q.w * p);
      }
      void main() {
        float sizeSeed = fract(aSeed.w);
        float h = 1. - sqrt(1. - aSeed.y);
        float floorY = -uViewport.y * .40;
        float apex = clamp(uTextBottom + .10, -uViewport.y * .12, uViewport.y * .15);
        float width = uViewport.x * mix(.27, .42, 1. - smoothstep(.6, 1., uViewport.x / uViewport.y));
        width *= mix(.88, 1., smoothstep(0., .7, uProgress));
        vec3 p = vec3(aSeed.x * (width * pow(1. - h, 1.25) + .025), mix(floorY, apex, h), aSeed.z * .72);
        float t = uTime * (1. - uReduced);
        // Curl of a separable vector potential: divergence-free, bounded, cheap.
        vec3 curl = vec3(-1.3 * cos(p.z * 1.3 - t * .7), -.9 * cos(p.x * .9 + t * .6), -cos(p.y + t * .5));
        p += curl * .045 + sin(p.yzx * 3.1 + t * .8 + aSeed.w * 7.) * .018;
        // A minority of grains feeds the mound from above; wrap outside the frame.
        float stream = step(aSeed.z, -.76);
        float cycle = fract(aSeed.y + t * .16 + uProgress * .22);
        vec3 fall = vec3(sin(aSeed.x * 7. + cycle * 5.) * .12, mix(uViewport.y * .72, floorY, cycle), aSeed.z * .6);
        p = mix(p, fall, stream);
        vLife = mix(1., smoothstep(0., .12, cycle) * (1. - smoothstep(.92, 1., cycle)), stream);
        vec2 away = p.xy - uPointer.xy;
        float d = length(away);
        p.xy += away / max(.05, d) * pow(max(0., 1. - d / 1.25), 2.) * uPointer.z * .5;
        // Follow the lower text contour rather than sending a random cloud across all copy.
        float edge = exp(-pow((p.y - apex) * 3., 2.));
        p.x += sin(aSeed.x * 5. + t * .45) * edge * .06;
        float grain = uViewport.y * .0095 * mix(.35, 1.75, sizeSeed * sizeSeed);
        vec4 eye = modelViewMatrix * vec4(p + uSpin * orient(position, aOrientation) * grain, 1.);
        vNormal = normalize(normalMatrix * uSpin * orient(normal, aOrientation));
        vEye = -eye.xyz;
        gl_Position = projectionMatrix * eye;
      }`,
    fragmentShader: `
      varying vec3 vNormal, vEye;
      varying float vLife;
      void main() {
        if (vLife < .03) discard;
        vec3 n = normalize(vNormal);
        vec3 light = normalize(vec3(-.4, .7, 1.));
        float diffuse = abs(dot(n, light));
        float specular = pow(max(0., dot(n, normalize(light + normalize(vEye)))), 18.);
        vec3 white = vec3(.65, .72, .94) + vec3(.42) * diffuse + specular * .22;
        gl_FragColor = vec4(white, vLife);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const box = new THREE.BoxGeometry(1, 1, .22);
  const arm1 = new THREE.BoxGeometry(1.25, .36, .22);
  const arm2 = new THREE.BoxGeometry(.36, 1.25, .22);
  const cross = mergeGeometries([arm1, arm2]);
  arm1.dispose(); arm2.dispose();
  const diamond = box.clone(); diamond.rotateZ(Math.PI / 4);
  const bases = [box, cross, diamond];
  let seed = 20261031;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const geometries: THREE.InstancedBufferGeometry[] = [];
  const angles = new THREE.Euler(), orientation = new THREE.Quaternion();
  const spinAngles = new THREE.Euler(), spinMatrix = new THREE.Matrix4();
  for (let kind = 0; kind < 3; kind++) {
    const base = bases[kind];
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.setAttribute("position", base.attributes.position);
    geometry.setAttribute("normal", base.attributes.normal);
    const population = Math.floor(count / 3) + (kind < count % 3 ? 1 : 0);
    const data = new Float32Array(population * 4);
    const orientations = new Float32Array(population * 4);
    for (let i = 0; i < population; i++) {
      data.set([random() * 2 - 1, random(), random() * 2 - 1, kind + random() * .999], i * 4);
      orientation.setFromEuler(angles.set(data[i * 4 + 1] * 6, data[i * 4] * 5, data[i * 4 + 2] * 7));
      orientation.toArray(orientations, i * 4);
    }
    geometry.setAttribute("aOrientation", new THREE.InstancedBufferAttribute(orientations, 4));
    geometry.setAttribute("aSeed", new THREE.InstancedBufferAttribute(data, 4));
    geometry.instanceCount = population;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    group.add(mesh); geometries.push(geometry);
  }
  let disposed = false;
  return { group, uniforms, count,
    setTime(time: number) {
      const t = Number.isFinite(time) ? time : 0;
      uniforms.uTime.value = t;
      uniforms.uSpin.value.setFromMatrix4(spinMatrix.makeRotationFromEuler(spinAngles.set(t * .16, -t * .12, t * .1)));
    },
    dispose() {
    if (disposed) return;
    disposed = true;
    geometries.forEach(geometry => geometry.dispose());
    bases.forEach(geometry => geometry.dispose());
    material.dispose();
  } };
}
