/** The cursor's existing 0.2-at-60Hz response, independent of display refresh rate. */
export function cursorDamping(deltaSeconds: number): number {
  if (!Number.isFinite(deltaSeconds) || deltaSeconds <= 0) return 0;
  return -Math.expm1(Math.log(0.8) * deltaSeconds * 60);
}
