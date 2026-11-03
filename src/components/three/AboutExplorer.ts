import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";

/** Original procedural explorer, not the captured Lusion suit or a likeness.
 * Centimetre-scale panels are batched by material; no network assets or textures.
 * Feet are at local y=0. The About world owns placement, time and scheduling. */
export function createAboutExplorer() {
  const root = new THREE.Group();
  root.name = "about-original-explorer";
  const body = new THREE.Group(), helmet = new THREE.Group();
  body.name = "explorer-suit"; helmet.name = "explorer-helmet";
  root.add(body, helmet);
  const materials = [
    new THREE.MeshStandardMaterial({ color: 0xe4e8e8, roughness: .72, metalness: .12 }),
    new THREE.MeshStandardMaterial({ color: 0x252c31, roughness: .85, metalness: .1 }),
    new THREE.MeshStandardMaterial({ color: 0x8c989c, roughness: .38, metalness: .62 }),
    new THREE.MeshStandardMaterial({ color: 0x26edf0, emissive: 0x03b9c9, emissiveIntensity: 1.5, roughness: .2, metalness: .35 }),
  ];
  const geometries: THREE.BufferGeometry[] = [];
  const torsoParts: THREE.BufferGeometry[][] = materials.map(() => []);
  const helmetParts: THREE.BufferGeometry[][] = materials.map(() => []);
  const transform = new THREE.Object3D();
  type XYZ = [number, number, number];
  const part = (bucket: THREE.BufferGeometry[][], material: number, geometry: THREE.BufferGeometry,
    position: XYZ, scale: XYZ = [1, 1, 1], rotation: XYZ = [0, 0, 0]) => {
    transform.position.set(...position); transform.scale.set(...scale); transform.rotation.set(...rotation);
    transform.updateMatrix(); geometry.applyMatrix4(transform.matrix); bucket[material].push(geometry);
  };
  const box = (mat: number, p: XYZ, size: XYZ) => part(torsoParts, mat, new THREE.BoxGeometry(...size), p);
  const sphere = (mat: number, p: XYZ, scale: XYZ) =>
    part(torsoParts, mat, new THREE.SphereGeometry(1, 14, 10), p, scale);
  const joint = (mat: number, p: XYZ, radius: number) => sphere(mat, p, [radius, radius, radius]);
  const limb = (a: XYZ, b: XYZ, radius: number) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const axis = to.clone().sub(from), length = axis.length();
    const orientation = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), axis.normalize());
    const mid = from.clone().add(to).multiplyScalar(.5);
    const geometry = new THREE.CapsuleGeometry(radius, Math.max(.005, length - radius * 2), 4, 12);
    geometry.applyQuaternion(orientation); geometry.translate(mid.x, mid.y, mid.z);
    torsoParts[0].push(geometry);
    for (const t of [.24, .43, .62]) {
      const ring = new THREE.TorusGeometry(radius * .98, .005, 4, 12);
      ring.rotateX(Math.PI / 2); ring.applyQuaternion(orientation);
      const p = from.clone().lerp(to, t); ring.translate(p.x, p.y, p.z); torsoParts[2].push(ring);
    }
  };

  // Pressure garment, tapered waist, articulated hip and front life-support panel.
  part(torsoParts, 0, new THREE.CapsuleGeometry(.205, .25, 6, 16), [0, 1.015, 0], [.9, 1, .8]);
  sphere(0, [0, .695, 0], [.17, .135, .135]);
  part(torsoParts, 1, new THREE.CylinderGeometry(.17, .17, .045, 16), [0, .758, 0], [1, 1, .85]);
  part(torsoParts, 2, new THREE.CylinderGeometry(.145, .145, .07, 16), [0, 1.325, 0]);
  box(1, [0, 1.075, .164], [.24, .19, .04]);
  const emblem = new THREE.Shape();
  emblem.moveTo(-.082, .055); emblem.lineTo(.082, .055); emblem.lineTo(0, -.083); emblem.closePath();
  part(torsoParts, 3, new THREE.ShapeGeometry(emblem), [0, 1.085, .19]);
  for (const s of [-1, 1]) {
    box(2, [s * .135, 1.13, .11], [.027, .2, .025]);
    box(2, [s * .11, .82, .13], [.075, .035, .025]);
    box(3, [s * .11, 1.21, .13], [.028, .018, .015]);
  }

  // Real backpack volume, shoulder straps, twin air canisters and recessed ribs.
  box(1, [0, 1.035, -.19], [.32, .43, .15]);
  box(0, [0, 1.055, -.25], [.28, .36, .13]);
  for (let i = 0; i < 5; i++) box(2, [0, .93 + i * .055, -.32], [.22, .012, .01]);
  for (const s of [-1, 1]) {
    part(torsoParts, 0, new THREE.CapsuleGeometry(.057, .19, 4, 12), [s * .185, 1.025, -.18]);
    box(2, [s * .155, 1.22, -.12], [.035, .055, .2]);
    // Planted, subtly splayed legs: no walking or floating invented for the reference.
    const hip: XYZ = [s * .1, .675, 0], knee: XYZ = [s * .13, .375, .025];
    const ankle: XYZ = [s * .145, .13, .012];
    limb(hip, knee, .09); joint(1, knee, .084); limb(knee, ankle, .077);
    sphere(0, [s * .13, .38, .09], [.073, .09, .025]);
    sphere(0, [s * .145, .085, .065], [.10, .085, .15]);
    box(1, [s * .145, .025, .065], [.19, .035, .27]);
    box(2, [s * .145, .16, .06], [.135, .035, .1]);
    const shoulder: XYZ = [s * .22, 1.235, 0], elbow: XYZ = [s * .29, .98, .015];
    const wrist: XYZ = [s * .285, .765, .075];
    joint(0, shoulder, .088); limb(shoulder, elbow, .068); joint(1, elbow, .061); limb(elbow, wrist, .06);
    joint(2, wrist, .063);
    sphere(0, [s * .285, .705, .09], [.062, .085, .056]);
    // A wrist telemetry strip remains geometry, not a texture or DOM overlay.
    box(3, [s * .285, .8, .124], [.07, .022, .012]);
  }

  // Separate helmet group permits a restrained head response without sliding feet.
  part(helmetParts, 0, new THREE.SphereGeometry(.205, 20, 14), [0, 0, 0], [1, 1.08, 1]);
  part(helmetParts, 1, new THREE.SphereGeometry(.211, 20, 12, Math.PI * .12, Math.PI * .76, Math.PI * .28, Math.PI * .43), [0, 0, .008]);
  part(helmetParts, 3, new THREE.SphereGeometry(.216, 20, 12, Math.PI * .17, Math.PI * .66, Math.PI * .32, Math.PI * .34), [0, 0, .009]);
  for (const s of [-1, 1]) {
    part(helmetParts, 0, new THREE.CylinderGeometry(.066, .066, .03, 12), [s * .2, -.025, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
  }
  const assemble = (buckets: THREE.BufferGeometry[][], group: THREE.Group) => {
    buckets.forEach((pieces, i) => {
      if (!pieces.length) return;
      const geometry = mergeGeometries(pieces, false);
      for (const piece of pieces) piece.dispose();
      if (!geometry) throw new Error("Explorer geometry attributes did not match");
      geometry.computeBoundingSphere(); geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, materials[i]);
      mesh.name = `${group.name}-${i}`; group.add(mesh);
    });
  };
  assemble(torsoParts, body); assemble(helmetParts, helmet);

  // Local contact occlusion; no shadow map, reference bitmap or transparent square.
  const shadowGeometry = new THREE.PlaneGeometry(1.15, .8);
  shadowGeometry.rotateX(-Math.PI / 2); geometries.push(shadowGeometry);
  const shadowMaterial = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    vertexShader: `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
    fragmentShader: `varying vec2 vUv; void main() { float r = length((vUv - .5) * 2.); gl_FragColor = vec4(0., 0., 0., (1. - smoothstep(.05, 1., r)) * .38); }`,
  });
  const shadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  shadow.name = "explorer-contact-shadow"; shadow.position.y = .003; root.add(shadow);

  let disposed = false;
  const pose = (time: number, pointerX: number, pointerY: number, reduced: boolean) => {
    if (disposed) return;
    const t = reduced || !Number.isFinite(time) ? 0 : time;
    const x = reduced || !Number.isFinite(pointerX) ? 0 : THREE.MathUtils.clamp(pointerX, -1, 1);
    const y = reduced || !Number.isFinite(pointerY) ? 0 : THREE.MathUtils.clamp(pointerY, -1, 1);
    const breath = reduced ? 0 : Math.sin(t * .8) * .0025;
    body.scale.set(1 + breath * .2, 1 + breath, 1 + breath * .4);
    helmet.position.y = 1.545 + breath * .5;
    helmet.rotation.set(-.1 - y * .035, x * .12 + (reduced ? 0 : Math.sin(t * .22) * .025), 0);
    root.rotation.y = -.16;
  };
  pose(0, 0, 0, true);
  return { group: root, pose, dispose() {
    if (disposed) return;
    disposed = true;
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    shadowMaterial.dispose(); root.clear();
  } };
}
