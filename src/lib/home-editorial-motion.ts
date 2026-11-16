/** HomeReel / ProjectItem timing from the inspected reference, independent of React. */
export const editorialClamp = (n: number) => Math.max(0, Math.min(1, n));
export const editorialFit = (n: number, from: number, to: number) => editorialClamp((n - from) / (to - from));
export const editorialExpoOut = (n: number) => n <= 0 ? 0 : n >= 1 ? 1 : 1 - 2 ** (-10 * n);
export const editorialExpoInOut = (n: number) => n <= 0 ? 0 : n >= 1 ? 1 : n < .5 ? 2 ** (20 * n - 10) / 2 : (2 - 2 ** (-20 * n + 10)) / 2;

/** Reference ease.lusion = cubic-bezier(.35,0,0,1), not smoothstep. */
export function editorialEase(value: number): number {
  const x = editorialClamp(value);
  let lo = 0, hi = 1;
  for (let i = 0; i < 24; i++) {
    const t = (lo + hi) / 2;
    const v = 3 * (1 - t) ** 2 * t * .35 + t ** 3;
    if (v < x) lo = t; else hi = t;
  }
  const t = (lo + hi) / 2;
  return x === 0 || x === 1 ? x : t * t * (3 - 2 * t);
}

export function reelMorphProgress(scroll: number, thumbTop: number, thumbHeight: number, containerTop: number, containerHeight: number, vh: number): number {
  const from = thumbTop - (vh - thumbHeight) * .5;
  const to = containerTop - (vh - containerHeight) * .5;
  return editorialFit(scroll, from, Math.max(from + 1, to));
}

/** ScrollManager.getEaseInOutOffset(scroll - outerTop + (vh-innerHeight)/2, vh, 1, 0). */
export function reelPinOffset(scroll: number, outerTop: number, innerHeight: number, vh: number): number {
  const e = scroll - outerTop + (vh - innerHeight) * .5;
  const g = vh * 2;
  const ratio = Math.min(1, (e + g * .5 - vh * .5) / g);
  if (ratio <= 0) return 0;
  const m = ratio * 4;
  const bezier = (a: number, b: number, c: number, d: number, t: number) => (1-t)**3*a+3*(1-t)**2*t*b+3*(1-t)*t*t*c+t**3*d;
  const transformed = m <= 1.5 ? bezier(0,.5,1,1,m/1.5) : m <= 2.5 ? 1 : m <= 4 ? bezier(1,1,1.5,2,(m-2.5)/1.5) : m-2;
  return (m-transformed)/2*vh;
}

export function reelLineProgress(sectionScreenY: number, vh: number): number {
  const t = editorialClamp(-(sectionScreenY - .4 * vh) / (1.3 * vh));
  return t < .5 ? 2*t*t : 1-2*(1-t)**2;
}

export interface EditorialSpring { value: number; velocity: number; previous: number }
export const createEditorialSpring = (value: number): EditorialSpring => ({ value, velocity: 0, previous: value });
/** Substepped second-order dynamics, with the reference frequency/damping/response. */
export function stepEditorialSpring(s: EditorialSpring, target: number, dt: number, frequency: number, damping: number, response: number): void {
  if (dt <= 0) return;
  const k1 = damping / (Math.PI * frequency), k2 = 1 / (2*Math.PI*frequency)**2, k3 = response*damping/(2*Math.PI*frequency);
  const targetVelocity = (target-s.previous)/dt;
  s.previous = target;
  const count = Math.max(1,Math.ceil(dt/(1/120))), h = dt/count;
  for (let i=0;i<count;i++) {
    s.value += h*s.velocity;
    s.velocity += h*(target+k3*targetVelocity-s.value-k1*s.velocity)/k2;
  }
  if (Math.abs(s.value-target)<1e-5 && Math.abs(s.velocity)<1e-5) { s.value=target; s.velocity=0; }
}
