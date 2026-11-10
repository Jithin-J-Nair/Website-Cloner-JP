export interface CaseMediaReadiness {
  source: string;
  loaded: boolean;
  ratio: number;
}

/** Independent of viewport entrance. A decoded texture becomes ready over one
 * second, including while offscreen; reverse entry must not reload/re-fade it.
 * A responsive/currentSrc replacement starts a new lifetime. The case owner is
 * the only clock; reduced motion reveals a decoded source immediately.
 */
export function advanceCaseMediaReadiness(
  state: CaseMediaReadiness,
  source: string,
  decoded: boolean,
  dt: number,
  reduced: boolean,
): number {
  if (source !== state.source) {
    state.source = source;
    state.loaded = false;
    state.ratio = 0;
  }
  state.loaded ||= decoded;
  if (state.loaded) {
    const elapsed = Number.isFinite(dt) ? Math.max(0, dt) : 0;
    state.ratio = reduced ? 1 : Math.min(1, state.ratio + elapsed);
  }
  return state.ratio;
}
