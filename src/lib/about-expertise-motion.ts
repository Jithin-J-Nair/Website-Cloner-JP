/** Original reversible interpolation between the observed card-back and four
 * service-front compositions. These are authored curves, not recovered source
 * timings. The caller supplies one native, normalized section scroll value. */
const clamp = (value: number) => Math.max(0, Math.min(1, value));
const ease = (start: number, end: number, value: number) => {
  const t = clamp((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export function expertiseCardPose(progress: number, index: number) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0;
  const i = Number.isFinite(index) ? Math.max(0, Math.min(3, Math.round(index))) : 0;

  // Each card peels away from the shared deck on its own short scroll interval.
  // This makes the first view read as one object, then resolves into four faces.
  const release = ease(.12 + i * .024, .62 + i * .018, p);
  const lift = ease(.08 + i * .012, .54 + i * .016, p);
  const flip = ease(.32 + i * .035, .72 + i * .035, p);

  const remaining = 1 - release;
  const settled = (value: number) => value * remaining || 0;

  return {
    xVw: settled((1.5 - i) * 23),
    dropVh: 36 * (1 - lift),
    z: settled(-i * 4.5),
    roll: settled((i - 1.5) * 2.6),
    yaw: settled((1.5 - i) * 9),
    pitch: settled(-5),
    scale: .94 + .06 * release,
    flip: 180 * (1 - flip),
    opacity: i === 0 ? 1 : ease(.1, .3, p),
  };
}

export function expertiseHeadingPose(progress: number) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0;
  return { opacity: 1 - ease(.12, .36, p), yVh: -38 * ease(.1, .42, p) };
}
