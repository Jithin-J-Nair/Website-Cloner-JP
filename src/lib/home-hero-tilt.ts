/** Relative, screen-oriented tilt in the range [-1, 1]. Calibration uses only
 * pitch and roll; compass heading is never read or retained. */
export function heroTiltFromOrientation(beta: number, gamma: number, baseBeta: number, baseGamma: number, screenAngle: number) {
  const wrap = (value: number) => ((value + 540) % 360) - 180;
  const pitch = wrap(beta - baseBeta), roll = wrap(gamma - baseGamma);
  const angle = ((screenAngle % 360) + 360) % 360;
  const [x, y] = angle === 90 ? [pitch, -roll] : angle === 180 ? [-roll, -pitch] : angle === 270 ? [-pitch, roll] : [roll, pitch];
  const clamp = (n: number) => Math.max(-1, Math.min(1, n / 25));
  return { x: clamp(x), y: clamp(y) };
}

export function smoothHeroTilt(current: number, target: number, seconds: number) {
  return current + (target - current) * (1 - Math.exp(-Math.min(Math.max(seconds, 0), .1) * 5));
}
