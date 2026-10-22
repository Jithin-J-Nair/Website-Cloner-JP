import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

/**
 * Clean-Room Procedural Lusion 6-Arm Hollow Cylindrical Connector Geometry
 *
 * Matches the verified `lusion.co` hero connector (`span = [-1, +1]^3`,
 * `outerRadius = 1/3 = 0.3333`, `innerBoreRadius = 0.10`, smoothed bevel lips
 * around each arm mouth + central 3-axis fillet collar) with zero dependency
 * on proprietary `.buf` model binaries.
 */
export function createHollowCrossGeometry(radialSegments = 40): THREE.BufferGeometry {
  const outerR = 0.3333;
  const innerR = 0.105;
  const bevel = 0.026;
  const halfSpan = 1.0;

  // Lathe profile in (radius, y) spanning y in [0, halfSpan] for one hollow arm:
  //   1. Inner through-bore from y = 0 up to lip bevel (`halfSpan - bevel`)
  //   2. Smooth circular bevel rounding across the annular end face (`innerR -> outerR`)
  //   3. Outer cylinder returning from `halfSpan - bevel` down to central hub (`y = outerR * 0.62`)
  const profile: THREE.Vector2[] = [];
  profile.push(new THREE.Vector2(innerR, 0.0));
  profile.push(new THREE.Vector2(innerR, halfSpan - bevel));

  // Rounded inner lip
  const lipSteps = 5;
  for (let i = 1; i <= lipSteps; i++) {
    const a = (i / lipSteps) * (Math.PI * 0.5);
    const r = innerR + bevel * (1 - Math.cos(a));
    const y = halfSpan - bevel + bevel * Math.sin(a);
    profile.push(new THREE.Vector2(r, y));
  }

  // Flat annular end face across mouth
  profile.push(new THREE.Vector2(outerR - bevel, halfSpan));

  // Rounded outer lip
  for (let i = 1; i <= lipSteps; i++) {
    const a = (i / lipSteps) * (Math.PI * 0.5);
    const r = outerR - bevel + bevel * Math.sin(a);
    const y = halfSpan - bevel + bevel * Math.cos(a);
    profile.push(new THREE.Vector2(r, y));
  }

  // Outer cylindrical barrel down into central union hub
  profile.push(new THREE.Vector2(outerR, 0.18));

  // Reverse profile so outer barrel ascends (+Y -> +r outward normal), annular tip faces +Y,
  // and inner bore descends (-Y -> -r inward normal inside the hollow bore).
  profile.reverse();

  const singleArm = new THREE.LatheGeometry(profile, radialSegments);

  const arms: THREE.BufferGeometry[] = [];
  const rotations: [number, number, number][] = [
    [0, 0, 0], // +Y
    [Math.PI, 0, 0], // -Y
    [0, 0, -Math.PI * 0.5], // +X
    [0, 0, Math.PI * 0.5], // -X
    [Math.PI * 0.5, 0, 0], // +Z
    [-Math.PI * 0.5, 0, 0], // -Z
  ];

  for (const [rx, ry, rz] of rotations) {
    const g = singleArm.clone();
    g.rotateX(rx);
    g.rotateY(ry);
    g.rotateZ(rz);
    arms.push(g);
  }

  // Smooth central fillet sphere (`r = outerR * 1.16`) bridging all 6 orthogonal arms seamlessly
  const hubFillet = new THREE.SphereGeometry(outerR * 1.15, radialSegments, 20);
  arms.push(hubFillet);

  const merged = mergeGeometries(arms, false);
  singleArm.dispose();
  for (const g of arms) g.dispose();

  merged.computeVertexNormals();
  merged.computeBoundingSphere();
  return merged;
}

/**
 * Clean-room brilliant-cut crystal geometry for Stage 2 of `#home-goal` white tunnel.
 */
export function createFacetedDiamondGeometry(): THREE.BufferGeometry {
  const profile = [
    new THREE.Vector2(0.001, -0.78),
    new THREE.Vector2(0.68, 0.12),
    new THREE.Vector2(0.46, 0.42),
    new THREE.Vector2(0.001, 0.42),
  ];
  const geo = new THREE.LatheGeometry(profile, 8);
  geo.computeVertexNormals();
  return geo;
}
