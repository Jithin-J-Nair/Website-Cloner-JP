/** Isolated equations inspected in AboutCapabilitySection / ScrollDomRange / Line.
 * Coordinates are native viewport range [-1,1], not an invented deck timeline. */
export const expertiseClamp = (value: number) => Math.max(0, Math.min(1, Number.isFinite(value) ? value : 0));
export const expertiseFit = (value: number, start: number, end: number) => expertiseClamp((value - start) / (end - start));
const expoOut = (t: number) => t === 1 ? 1 : 1 - 2 ** (-10 * t);
const expoInOut = (t: number) => t === 0 || t === 1 ? t : t < .5 ? .5 * 1024 ** (t * 2 - 1) : .5 * (-(1024 ** (-t * 2 + 1)) + 2);
const backInOut = (t: number) => { const s = 2.5949095; return (t *= 2) < 1 ? .5 * t * t * ((s + 1) * t - s) : .5 * ((t -= 2) * t * ((s + 1) * t + s) + 2); };
export function expertiseScreenRatio(screenY: number, elementHeight: number, viewportHeight: number) {
  return expertiseFit(screenY, viewportHeight, -elementHeight) * 2 - 1;
}
export function expertiseCardPose(screenRatio: number, index: number, width: number, cardWidth: number, time = 0) {
  const sr = Number.isFinite(screenRatio) ? Math.max(-1, Math.min(1, screenRatio)) : -1;
  const i = Math.max(0, Math.min(3, Math.round(Number.isFinite(index) ? index : 0)));
  const n = expertiseFit(sr, -.6, .2), a = expertiseFit(sr, -.5, .7), l = -Math.PI / 2 + a * Math.PI;
  const offset = width - cardWidth * 4, centre = (width - cardWidth) / 2, target = i / 4 * (width + offset / 3);
  const spread = expoOut(expertiseFit(n, .2, 1));
  return {
    x: centre + (target - centre) * spread,
    y: Math.cos(time * 3 + i) * Math.cos(l) * 10,
    roll: (i - 1.5) * 9 * expoInOut(expertiseFit(Math.abs(expertiseFit(n, 0, .75) * 2 - 1), 1, 0)),
    flip: 180 * (1 - backInOut(expertiseFit(a, 0, .7 - Math.abs(3 - i) / 20))),
  };
}
export function expertiseMobileFlip(screenRatio: number, index: number) {
  const t = expertiseFit(screenRatio, -.85 - (index % 2) / 10, 0);
  const eased = t < .5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2;
  return 180 * (1 - eased);
}
/** Native getEaseInOutOffset(scroll - wrapperTop + centre, vh*3, 5, 1). */
export function expertisePinOffset(pixel: number, viewportHeight: number) {
  const duration = viewportHeight * 3, a = 2.5, hold = 5, l = 8, end = 10;
  const g = duration * end / l, v = pixel + g / 2 - duration / 2, p = Math.min(1, v / g);
  if (p <= 0) return 0;
  const m = p * end;
  const bezier = (p0: number, p1: number, p2: number, p3: number, t: number) => (1 - t) ** 3 * p0 + 3 * (1 - t) ** 2 * t * p1 + 3 * (1 - t) * t ** 2 * p2 + t ** 3 * p3;
  const t = m <= a ? bezier(0, a / 3, 1, 1, m / a) : m <= a + hold ? 1 : bezier(1, 1, 2 - a / 3, 2, (m - a - hold) / a);
  return (m - t) / l * duration;
}
export function expertiseLineProgress(screenY: number, viewportHeight: number, office = false) {
  const t = expertiseClamp(-(screenY - (office ? -2 : 0) * viewportHeight) / ((office ? 1.85 : 2) * viewportHeight));
  return t < .5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2;
}
