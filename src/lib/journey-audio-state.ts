/** Audio follows existing scene coordinates, never its own visual playhead.
 * Boundaries copied from GoalTunnelSection: flash .785–.865, glass opacity
 * .30–.40, and endDecor .92–.99. These are NOT observed reference audio cues.
 */
export type JourneyStage = "home" | "black-title" | "solar" | "tesseract" | "white-transition" | "blue" | "glass" | "fracture" | "contact";
export type StemName = "orbit" | "pulse" | "bass" | "prism" | "resolve";
export const STEM_NAMES: readonly StemName[] = ["orbit", "pulse", "bass", "prism", "resolve"];
export interface JourneyAudioInput {
  active: boolean;
  title: boolean;
  emergence: boolean;
  tunnel: number;
  drop: number;
  wait: number;
  fractureVisible: boolean;
  paused: boolean;
}
export const IDLE_JOURNEY: JourneyAudioInput = {
  active: false, title: false, emergence: false, tunnel: 0, drop: 0, wait: 0, fractureVisible: false, paused: false,
};
export interface JourneyMix {
  stage: JourneyStage;
  gains: readonly number[];
  cutoff: number;
  level: number;
}
const smooth = (a: number, b: number, x: number) => {
  const t = Math.max(0, Math.min(1, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const blend = (a: readonly number[], b: readonly number[], t: number) => a.map((v, i) => v + (b[i] - v) * t);
const ORBIT = [0.62, 0, 0.10, 0.06, 0];
const SHAFT = [0.22, 0.64, 0.54, 0.08, 0];
const BLUE = [0.12, 0.34, 0.62, 0.70, 0];
const GLASS = [0.36, 0.10, 0.22, 0.26, 0.18];
const RESOLVE = [0.28, 0, 0.08, 0.08, 0.68];
export function journeyMix(input: JourneyAudioInput): JourneyMix {
  if (!input.active) return { stage: "home", gains: [0.20, 0, 0, 0, 0.10], cutoff: 2300, level: 0.45 };
  if (input.title) return { stage: "black-title", gains: [0.30, 0, 0.04, 0, 0], cutoff: 1500, level: 0.55 };
  if (input.emergence) return { stage: "solar", gains: ORBIT, cutoff: 3800, level: 0.70 };
  const blue = smooth(0.785, 0.865, input.tunnel);
  const glass = smooth(0, 0.30, input.drop);
  const end = Math.max(smooth(0.92, 0.99, input.drop), input.wait > 0 ? 1 : 0);
  const stage: JourneyStage = end > 0 ? "contact" : input.drop >= 0.30 ? "fracture" : input.drop > 0 ? "glass" : input.tunnel >= 0.865 ? "blue" : input.tunnel >= 0.785 ? "white-transition" : "tesseract";
  return {
    stage,
    gains: blend(blend(blend(SHAFT, BLUE, blue), GLASS, glass), RESOLVE, end),
    cutoff: (3200 + blue * 6400) * (1 - glass * 0.52) * (1 - end) + end * 4200,
    level: 0.78 - glass * 0.10 - end * 0.06,
  };
}
/** A sampled visible rising edge, not a timer. Reverse is silent and rearms.
 * First entry, mute/hidden/pause, and skipped invisible fracture never emit late SFX.
 */
export function crossesFracture(previous: JourneyAudioInput | null, next: JourneyAudioInput): boolean {
  return !!previous && previous.active && next.active && !next.paused &&
    next.fractureVisible && !previous.fractureVisible && next.drop > previous.drop && next.wait === 0;
}
