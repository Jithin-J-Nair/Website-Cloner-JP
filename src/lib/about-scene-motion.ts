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
  const start = mobile ? 1.95 : 0.65;
  const peak = mobile ? 2.45 : 1.25;
  // The desktop sweep is a brief transition between the opening wordmark and
  // the settled valley. It must clear before the two-sided manifesto is read.
  const holdEnd = mobile ? 2.9 : 1.32;
  const end = mobile ? 3.45 : 1.58;
  const enter = ease(start, peak, u);
  const exit = 1 - ease(holdEnd, end, u);
  const travel = ease(start, end, u);
  return {
    opacity: enter * exit,
    xVw: mobile ? mix(0, -2, travel) : mix(4, -7, travel),
    yVh: mobile ? mix(0, -0.8, travel) : mix(2, -1, travel),
    rotation: mobile ? mix(-0.8, 0.6, travel) : mix(-4, 2, travel),
    scale: mobile ? mix(1, 1.025, travel) : mix(0.96, 1.045, travel),
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
