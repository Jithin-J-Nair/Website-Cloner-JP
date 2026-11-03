import * as THREE from "three";

/** Original spatial counterparts of the four editorial line studies, not captured models. */
export function createExpertiseStudy(index: number) {
  const vertices: number[] = [];
  const line = (a: THREE.Vector3, b: THREE.Vector3) => vertices.push(a.x, a.y, a.z, b.x, b.y, b.z);
  const curve = (sample: (t: number) => THREE.Vector3, steps = 64) => {
    let a = sample(0);
    for (let i = 1; i <= steps; i++) { const b = sample(i / steps); line(a, b); a = b; }
  };
  if (index === 0) {
    for (let i = 1; i < 10; i++) {
      const latitude = i / 10 * Math.PI;
      curve(t => new THREE.Vector3(Math.cos(t * Math.PI * 2) * Math.sin(latitude), Math.cos(latitude), Math.sin(t * Math.PI * 2) * Math.sin(latitude)));
    }
    for (let i = 0; i < 10; i++) {
      const longitude = i / 10 * Math.PI;
      curve(t => new THREE.Vector3(Math.sin(t * Math.PI * 2) * Math.cos(longitude), Math.cos(t * Math.PI * 2), Math.sin(t * Math.PI * 2) * Math.sin(longitude)));
    }
  } else if (index === 1) {
    for (let i = 0; i < 19; i++) {
      const v = (i / 18 - .5) * .7;
      curve(t => {
        const angle = t * Math.PI * 2.1;
        return new THREE.Vector3((t - .5) * 2.3, Math.sin(angle) * (.7 + v), Math.cos(angle) * (.45 + v));
      }, 72);
    }
  } else if (index === 2) {
    for (let layer = 0; layer < 5; layer++) {
      const y = (layer - 2) * .34;
      for (let i = 0; i < 9; i++) {
        const x = (i / 8 - .5) * 1.8;
        line(new THREE.Vector3(x, y, -.9), new THREE.Vector3(x, y, .9));
        line(new THREE.Vector3(-.9, y, x), new THREE.Vector3(.9, y, x));
      }
    }
  } else {
    for (let layer = 0; layer < 3; layer++) {
      const y = (layer - 1) * .62;
      const corners = [-.12, .12].flatMap(dy => [-.8, .8].flatMap(z => [-.8, .8].map(x => new THREE.Vector3(x, y + dy, z))));
      for (let i = 0; i < 8; i++) for (const bit of [1, 2, 4]) if (!(i & bit)) line(corners[i], corners[i | bit]);
      for (const x of [-.27, .27]) line(new THREE.Vector3(x, y + .12, -.8), new THREE.Vector3(x, y + .12, .8));
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  geometry.computeBoundingSphere();
  const material = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: .64, depthWrite: false });
  const group = new THREE.Group();
  group.add(new THREE.LineSegments(geometry, material));
  let disposed = false;
  return { group, geometry, material, dispose() {
    if (disposed) return;
    disposed = true; geometry.dispose(); material.dispose(); group.clear();
  } };
}
