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

  // Three distinct beats: lift the deck, spread/hold four readable backs,
  // then peel each face over independently into four nonoverlapping columns.
  const spread = ease(.12, .42, p);
  const lift = ease(.04, .32, p);
  const settle = ease(.55, .88, p);
  const flip = ease(.42 + i * .08, .58 + i * .08, p);
  const remaining = 1 - settle;
  return {
    xVw: (1.5 - i) * (23 - 23 * spread) * remaining || 0,
    dropVh: 56 * (1 - lift) + (Math.abs(i - 1.5) - .5) * 2 * lift * remaining,
    z: (80 - i * 42) * remaining || 0,
    roll: [2, 8, -3, -10][i] * spread * remaining || 0,
    yaw: [-10, -26, 0, 38][i] * spread * remaining || 0,
    pitch: -7 * spread * remaining || 0,
    scale: .86 + .09 * spread + .05 * settle,
    flip: 180 * (1 - flip),
    opacity: i === 0 ? 1 : ease(.10, .18, p),
  };
}

export function expertiseHeadingPose(progress: number) {
  const p = Number.isFinite(progress) ? clamp(progress) : 0;
  return { opacity: 1 - ease(.22, .34, p), yVh: 10 - 85 * ease(.04, .34, p) };
}
