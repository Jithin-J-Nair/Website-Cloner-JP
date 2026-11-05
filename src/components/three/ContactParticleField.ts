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
        // A broad, asymmetric field leaves room around the title and gives the
        // lower heap a readable footprint instead of a narrow vertical column.
        float width = uViewport.x * mix(.36, .50, 1. - smoothstep(.6, 1., uViewport.x / uViewport.y));
        width *= mix(.90, 1.04, smoothstep(0., .7, uProgress));
        // The reference keeps a fine falling feed above the headline; the
        // lower particle mass, not the stream, carries the broad silhouette.
        float upperSpread = pow(1. - h, 1.25);
        vec3 p = vec3(aSeed.x * (width * upperSpread + .025), mix(floorY, apex, h), aSeed.z * .92);
        float t = uTime * (1. - uReduced);
        // Bounded 3D curl gives the fragments a slow lateral and depth-wise
        // current; it is an analytic field, not a particle collision solver.
        vec3 curl = vec3(
          -1.3 * cos(p.z * 1.3 - t * .7),
          -.9 * cos(p.x * .9 + t * .6),
          -cos(p.y + t * .5)
        );
        p += curl * .062 + sin(p.yzx * 3.1 + t * .8 + aSeed.w * 7.) * .024;

        // A narrow vertical feed widens only as particles reach the base.
        // This preserves the fine stream over the copy and the wide, layered
        // mound seen in the original Lusion CTA frame.
        float stream = step(aSeed.z, -.70);
        float cycle = fract(aSeed.y + t * .16 + uProgress * .22);
        float gather = smoothstep(.04, .94, cycle);
        float fallWidth = width * mix(.04, .62, gather);
        float lateral = aSeed.x * fallWidth
          + sin(cycle * 6.283 + aSeed.w * 9.) * width * .055;
        float depthFlow = aSeed.z * 1.18
          + cos(cycle * 6.283 + aSeed.x * 4.) * .38;
        vec3 fall = vec3(
          lateral,
          mix(uViewport.y * .72, floorY, cycle),
          depthFlow
        );
        p = mix(p, fall, stream);
        vLife = mix(1., smoothstep(0., .12, cycle) * (1. - smoothstep(.92, 1., cycle)), stream);

        // Pointer interaction is volumetric: fragments move sideways and in
        // depth, with a slight tangential sweep around the cursor.
        vec3 away = vec3(p.xy - uPointer.xy, p.z * .55);
        float d = length(away);
        float influence = pow(max(0., 1. - d / 1.65), 2.) * uPointer.z;
        vec3 radial = away / max(.05, d);
        vec3 tangent = normalize(vec3(-away.y, away.x, .001));
        p += radial * influence * .72 + tangent * influence * .26;

        // Keep the headline legible while the base continues to breathe.
        float edge = exp(-pow((p.y - apex) * 3., 2.));
        p.x += sin(aSeed.x * 5. + t * .45) * edge * .08;
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
        vec3 white = vec3(.92, .94, .99) * (.96 + diffuse * .04);
        gl_FragColor = vec4(white, vLife);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  // Flat original geometric vocabulary: circle, square/diamond, triangle, plus/X.
  // Square and plus instances use their per-instance quaternion for the rotated variants.
  const circle = new THREE.CircleGeometry(.54, 12);
  const square = new THREE.BoxGeometry(1, 1, .12);
  const triangle = new THREE.CircleGeometry(.62, 3);
  const arm1 = new THREE.BoxGeometry(1.2, .34, .12);
  const arm2 = new THREE.BoxGeometry(.34, 1.2, .12);
  const plus = mergeGeometries([arm1, arm2]);
  arm1.dispose(); arm2.dispose();
  const bases = [circle, square, triangle, plus];
  let seed = 20261031;
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const geometries: THREE.InstancedBufferGeometry[] = [];
  const angles = new THREE.Euler(), orientation = new THREE.Quaternion();
  const spinAngles = new THREE.Euler(), spinMatrix = new THREE.Matrix4();
  for (let kind = 0; kind < 4; kind++) {
    const base = bases[kind];
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.index = base.index;
    geometry.setAttribute("position", base.attributes.position);
    geometry.setAttribute("normal", base.attributes.normal);
    const population = Math.floor(count / 4) + (kind < count % 4 ? 1 : 0);
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
