/** Desktop word choreography reconstructed from WhoSubsectionDetails in the
 * archived About renderer. Shared native-width scroll coordinates; stateless
 * and reversible. Line-local em offsets and viewport travel must remain
 * separate: a flat paragraph slide cannot reproduce the diagonal line entry. */
const clamp = (x: number) => Math.max(0, Math.min(1, x));
const fit = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
const cubic = (x: number) => x < .5 ? 4 * x * x * x : .5 * Math.pow(2 * x - 2, 3) + 1;
export function aboutEditorialProgress(progress: number) {
  const u = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  return u < 5.25 ? 1.25 * cubic(fit(u, 3.5, 5.25)) : 1.25 + 1.25 * cubic(fit(u, 5.25, 7));
}
export function aboutEditorialWordPose(progress: number, index: number) {
  const r = aboutEditorialProgress(progress) - 1.25;
  const i = Number.isFinite(index) ? Math.max(0, Math.min(20, Math.round(index))) : 0;
  const bottom = i >= 11, local = bottom ? i - 11 : i, count = bottom ? 10 : 11;
  const line = bottom ? local < 3 ? 0 : local < 7 ? 1 : 2 : local < 4 ? 0 : local < 7 ? 1 : 2;
  const fraction = local / count, lineFraction = line / 3;
  const enterStart = bottom ? -.6 : -1, leaveStart = bottom ? .2 : .1;
  const enterLine = fit(r, enterStart + lineFraction * .5, -.1);
  const enterWord = fit(r, enterStart + fraction * .5, -.1);
  const leaveLine = fit(r, leaveStart, .5 + lineFraction * .5);
  const leaveWord = fit(r, leaveStart, .5 + fraction * .5);
  return {
    opacity: enterWord * (1 - leaveWord),
    xEm: 10 * (1 - enterLine) - 10 * leaveLine,
    xVw: -100 * r + (bottom ? -20 : -50) * (1 - fit(r, -1, 0)) + (bottom ? 50 * fit(r, 0, 1) : 20 * fit(r, .1, 1)),
  };
}
