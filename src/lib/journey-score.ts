/** Original procedural composition for this repository; MIT, no sampled media.
 * D minor / Bb / F / C, 96 BPM, four bars (10 seconds). Five phase-coherent
 * stereo stems. Periodic pad phases + zero-ended note envelopes make loop seams
 * continuous. Generated only after sound opt-in; no requests or decoder formats.
 */
import { STEM_NAMES, type StemName } from "./journey-audio-state";
export const SCORE_SECONDS = 10;
export const SCORE_SAMPLE_RATE = 24000;
const ROOTS = [146.8324, 116.5409, 174.6141, 130.8128];
const TRIADS = [[0, 3, 7, 14], [0, 4, 7, 12], [0, 4, 7, 14], [0, 4, 7, 12]];
const TAU = Math.PI * 2;
const envelope = (t: number, length: number) => t <= 0 || t >= length ? 0 : Math.min(1, t / 0.018) * Math.pow(1 - t / length, 2);
export function createScore(ctx: BaseAudioContext): Map<StemName, AudioBuffer> {
  const result = new Map<StemName, AudioBuffer>();
  const n = SCORE_SECONDS * SCORE_SAMPLE_RATE;
  for (const name of STEM_NAMES) {
    const buffer = ctx.createBuffer(2, n, SCORE_SAMPLE_RATE);
    for (let channel = 0; channel < 2; channel++) {
      const data = buffer.getChannelData(channel);
      for (let i = 0; i < n; i++) {
        const t = i / SCORE_SAMPLE_RATE;
        const bar = Math.min(3, Math.floor(t / 2.5));
        const root = ROOTS[bar];
        const beat = t / 0.625;
        const step = Math.floor(beat * (name === "prism" ? 4 : 2));
        const age = t - step * (name === "prism" ? 0.15625 : 0.3125);
        let value = 0;
        if (name === "orbit" || name === "resolve") {
          // Quantize oscillations to integer loop periods, ensuring exact periodicity.
          const tones = name === "orbit" ? [146.8, 220, 293.6, 329.6] : [174.6, 220, 261.6, 349.2];
          for (let k = 0; k < tones.length; k++) {
            const hz = Math.round((tones[k] + channel * 0.2) * SCORE_SECONDS) / SCORE_SECONDS;
            value += Math.sin(TAU * hz * t + k * 0.4) * (0.026 + 0.014 * Math.cos(TAU * t / 10 + k));
          }
        } else if (name === "bass") {
          const hz = root / 2;
          value = (Math.sin(TAU * hz * age) + 0.16 * Math.sin(TAU * hz * 2 * age)) * envelope(age, 0.30) * 0.25;
          const kickAge = t % 0.625;
          value += Math.sin(TAU * (48 * kickAge + 4 * (1 - Math.exp(-kickAge * 30)))) * envelope(kickAge, 0.19) * 0.12;
        } else {
          const note = TRIADS[bar][(step + (name === "prism" ? channel : 0)) % 4];
          const hz = root * Math.pow(2, note / 12) * (name === "prism" ? 2 : 1);
          value = (Math.sin(TAU * hz * age) + 0.22 * Math.sin(TAU * hz * 3 * age)) * envelope(age, name === "prism" ? 0.15 : 0.30) * (name === "prism" ? 0.12 : 0.16);
        }
        data[i] = value;
      }
    }
    result.set(name, buffer);
  }
  return result;
}
/** Original glass-like transient: seeded noise + decaying inharmonic modes.
 * It is an authored substitute, not a recording of the reference glass effect.
 */
export function createFracture(ctx: BaseAudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(2, SCORE_SAMPLE_RATE * 1.4, SCORE_SAMPLE_RATE);
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel);
    let seed = 1827 + channel * 719;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const t = i / SCORE_SAMPLE_RATE;
      const attack = Math.min(1, t / 0.003);
      const tail = Math.max(0, 1 - t / 1.4);
      const noise = (seed / 2147483648) * Math.exp(-t * 13) * 0.24;
      let ring = 0;
      for (const hz of [1137, 1789, 2711, 4219]) ring += Math.sin(TAU * (hz + channel * 13) * t) * Math.exp(-t * 5) * 0.035;
      data[i] = (noise + ring) * attack * tail;
    }
  }
  return buffer;
}
