export interface ProjectZoomBox { x: number; y: number; width: number; height: number }
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function projectZoomPose(width: number, height: number, box: ProjectZoomBox, ratio: number) {
  const z = clamp(ratio), u = z < .5 ? 4 * z ** 3 : 1 - (-2 * z + 2) ** 3 / 2;
  const scale = 1 + (Math.max(width / Math.max(1, box.width), height / Math.max(1, box.height)) * 1.2 - 1) * u;
  const p = width / 2 - box.x - box.width / 2, q = height / 2 - box.y - box.height / 2;
  return {
    scale, angle: u * .3 * p / width,
    pivotX: p - p * (1 - u) / scale - width / 2,
    pivotY: -q + q * (1 - u) / scale + height / 2,
    active: z * z,
  };
}
/** Native list zoom is inverse listing activeRatio over its first .75. */
export function projectZoomProgress(hide: number) { return clamp(hide / .75); }
export function projectDomOpacity(hide: number) { return 1 - clamp(hide / .5); }
