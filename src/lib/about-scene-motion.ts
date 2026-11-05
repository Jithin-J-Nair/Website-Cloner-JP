/** Original, reversible framing informed by the three supplied About stills.
 * The stills establish framing, not Lusion's timing, spline or simulation.
 * Keep this pure: scroll is the only camera authority, never an elapsed timer.
 */
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (a: number, b: number, u: number) => {
  const t = Math.max(0, Math.min(1, (u - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/**
 * A brief, original curved wordmark sweep observed during the supplied About
 * recording. Values are authored scroll-space choreography, not recovered
 * Lusion spline/timing constants. It shares the About world’s single playhead.
 */
export function aboutWordmarkSweepPose(progress: number, mobile: boolean) {
  const u = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  // In the reference recording the monumental wordmark holds first. A single
  // oversized elastic sweep crosses it during the first valley reveal, then
  // clears so the straight baseline mark can remain readable.
  const start = mobile ? 1.9 : 1.92;
  const peak = mobile ? 2.32 : 2.34;
  const holdEnd = mobile ? 2.56 : 2.62;
  const end = mobile ? 2.98 : 3.02;
  const enter = ease(start, peak, u);
  const exit = 1 - ease(holdEnd, end, u);
  const flourish = enter * exit;
  const travel = ease(start, end, u);
  return {
    opacity: flourish,
    xVw: mobile ? mix(-1, -3, travel) : mix(0, -2, travel),
    yVh: mobile ? mix(1, -2, travel) : mix(1, -3, travel),
    rotation: mobile ? mix(-1, 1, travel) : mix(-1.2, 1.2, travel),
    stretchX: 1 + (mobile ? 0.28 : 0.72) * flourish,
    skewX: (mobile ? -18 : -28) * flourish,
    scale: mobile ? mix(1.05, 1.12, flourish) : mix(1.18, 1.42, flourish),
  };
}

export function aboutScenePose(progress: number, mobile: boolean) {
  const u = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  const pullback = ease(.05, 1.45, u);
  const retreat = ease(mobile ? 2.75 : 1.7, mobile ? 3.5 : 3.15, u);
  const editorial = ease(3.6, 5, u);
  const team = ease(6.2, 6.95, u);
  const valleyZ = mix(mobile ? 22 : 20, mobile ? 48 : 72, retreat);
  const valleyY = mix(4.6, mobile ? 12 : 17, retreat);
  const valleyLook = mix(4.1, mobile ? 8 : 9.8, retreat);
  return {
    pullback, editorial, team,
    x: Math.sin(editorial * 1.2) * .6,
    y: mix(8.15, mix(valleyY, 6.6, editorial), pullback),
    z: mix(mobile ? 8.6 : 6.9, mix(valleyZ, mobile ? 21.5 : 18.2, editorial), pullback),
    lookY: mix(8.15, mix(valleyLook, mix(7.6, .85, team), editorial), pullback),
  };
}
