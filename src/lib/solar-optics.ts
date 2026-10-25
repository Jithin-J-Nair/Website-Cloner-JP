/** Allocation-free analytic visibility for the existing world-space solar key proxy. */
interface Point3 { x: number; y: number; z: number }
const saturate = (v: number) => Math.max(0, Math.min(1, v));
const ease = (v: number) => { const t = saturate(v); return t * t * (3 - 2 * t); };

/** Soft ray/sphere silhouette. Only blockers between the camera and emitter count.
 * Conservative head/body/planet bounds, not mesh-depth or skinned triangle occlusion.
 */
export function solarOcclusion(camera: Point3, source: Point3, center: Point3, radius: number): number {
  const dx = source.x - camera.x, dy = source.y - camera.y, dz = source.z - camera.z;
  const lengthSq = dx * dx + dy * dy + dz * dz;
  if (lengthSq < 1e-8 || radius <= 0) return 1;
  const cx = center.x - camera.x, cy = center.y - camera.y, cz = center.z - camera.z;
  const t = (cx * dx + cy * dy + cz * dz) / lengthSq;
  if (t <= 0 || t >= 1) return 1;
  const miss = Math.sqrt(Math.max(0, (cx - dx * t) ** 2 + (cy - dy * t) ** 2 + (cz - dz * t) ** 2));
  const penumbra = Math.max(0.015, radius * 0.16);
  return ease((miss - radius + penumbra) / (2 * penumbra));
}

/** Pupil acceptance: behind-camera rejection, offscreen falloff and off-axis vignetting. */
export function solarAcceptance(uvX: number, uvY: number, facing: number, occlusion: number, aspect = 1): number {
  // Measure portrait overscan in the same height-normalized units as the optical shader.
  const outside = Math.hypot(Math.max(0, Math.abs(uvX - 0.5) * 2 - 1) * Math.min(1, Math.max(0.1, aspect)), Math.max(0, Math.abs(uvY - 0.5) * 2 - 1));
  return ease((facing - 0.02) / 0.28) * Math.exp(-outside * outside * 0.20)
    * (0.35 + 0.65 * saturate(facing) ** 2) * saturate(occlusion);
}

/** Bounded relative focal magnification, calibrated at 44 degrees. This is an
 * art-directed pupil approximation, not a measured camera lens prescription. */
export function solarFocalScale(verticalFov: number): number {
  const fov = Number.isFinite(verticalFov) ? Math.max(1, Math.min(179, verticalFov)) : 44;
  const ratio = Math.tan(22 * Math.PI / 180) / Math.tan(fov * Math.PI / 360);
  return 2 * ratio / (1 + ratio);
}
