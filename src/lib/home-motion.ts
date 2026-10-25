/** Shared, allocation-free motion math. Rendering and DOM ownership stay with their components. */
export const GOAL_CINEMATIC_SECONDS = 23.5;
export const UHD_PIXEL_BUDGET = 3840 * 2160;
export const clampMotion = (value: number) => Math.max(0, Math.min(1, value));

/** Full UHD at 3840×2160; avoid accidentally allocating 8K buffers on a 2× UHD screen. */
export function homeRenderDpr(width: number, height: number, deviceDpr: number): number {
  return Math.min(Math.max(0.25, deviceDpr || 1), 2, Math.sqrt(UHD_PIXEL_BUDGET / Math.max(1, width * height)));
}

/** Normalized constant-acceleration travel: nonzero entry velocity, increasing fall speed. */
export function acceleratedFall(progress: number): number {
  const t = clampMotion(progress);
  return 0.28 * t + 0.72 * t * t;
}

export interface MotionSpring { value: number; velocity: number }

/** Exact critically damped spring integration, independent of the display refresh rate. */
export function stepMotionSpring(spring: MotionSpring, target: number, delta: number, frequency = 13): void {
  const dt = Math.max(0, Math.min(delta, 0.1));
  const error = spring.value - target;
  const impulse = spring.velocity + frequency * error;
  const decay = Math.exp(-frequency * dt);
  spring.value = target + (error + impulse * dt) * decay;
  spring.velocity = (spring.velocity - frequency * impulse * dt) * decay;
  if (Math.abs(spring.value - target) < 0.0001 && Math.abs(spring.velocity) < 0.0001) {
    spring.value = target;
    spring.velocity = 0;
  }
}

export function motionEase(progress: number): number {
  const t = clampMotion(progress);
  return t * t * (3 - 2 * t);
}
