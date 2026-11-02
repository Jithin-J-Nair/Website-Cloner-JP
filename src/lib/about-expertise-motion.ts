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
  const spread = ease(.16, .64, p);
  return {
    xVw: spread === 1 ? 0 : (1.5 - i) * 23 * (1 - spread),
    dropVh: 27 * (1 - ease(.08, .55, p)),
    z: spread === 1 || i === 0 ? 0 : -i * 3 * (1 - spread),
    roll: spread === 1 ? 0 : (i - 1.5) * 1.2 * (1 - spread),
    flip: 180 * (1 - ease(.32 + i * .035, .72 + i * .035, p)),
    opacity: i === 0 ? 1 : ease(.1, .3, p),
  };
}

export function expertiseHeadingPose(progress: number) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0;
  return { opacity: 1 - ease(.12, .36, p), yVh: -38 * ease(.1, .42, p) };
}
