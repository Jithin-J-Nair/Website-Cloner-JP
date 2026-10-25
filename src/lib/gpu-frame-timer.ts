/** Optional, nonblocking WebGL2 timing. No queries or polling in normal presentation. */
export interface GpuFrameTimer {
  begin: (phase: string) => void;
  end: () => void;
  dispose: () => void;
}

interface TimerExtension { TIME_ELAPSED_EXT: number; GPU_DISJOINT_EXT: number }

export function createGpuFrameTimer(
  gl: WebGL2RenderingContext,
  sample: (milliseconds: number, phase: string) => void,
  disjoint: () => void,
): GpuFrameTimer | null {
  const ext = gl.getExtension("EXT_disjoint_timer_query_webgl2") as TimerExtension | null;
  if (!ext) return null;
  const slots: { query: WebGLQuery; pending: boolean; phase: string }[] = [];
  for (let i = 0; i < 3; i++) {
    const query = gl.createQuery();
    if (!query) {
      for (const slot of slots) gl.deleteQuery(slot.query);
      return null;
    }
    slots.push({ query, pending: false, phase: "" });
  }
  let active = -1;
  let disposed = false;
  return {
    begin(phase) {
      if (disposed || active !== -1 || gl.isContextLost()) return;
      // Disjoint results must be discarded, never presented as valid frame timings.
      if (gl.getParameter(ext.GPU_DISJOINT_EXT)) {
        for (const slot of slots) slot.pending = false;
        disjoint();
        return;
      }
      for (const slot of slots) {
        if (slot.pending && gl.getQueryParameter(slot.query, gl.QUERY_RESULT_AVAILABLE)) {
          const ns: unknown = gl.getQueryParameter(slot.query, gl.QUERY_RESULT);
          slot.pending = false;
          if (typeof ns === "number" && Number.isFinite(ns) && ns > 0) sample(ns / 1e6, slot.phase);
        }
      }
      // Never wait for a busy query or allocate a replacement on a slow device.
      for (let i = 0; i < slots.length; i++) {
        if (!slots[i].pending) {
          active = i;
          slots[i].phase = phase;
          gl.beginQuery(ext.TIME_ELAPSED_EXT, slots[i].query);
          break;
        }
      }
    },
    end() {
      if (disposed || active === -1) return;
      if (gl.isContextLost()) {
        slots[active].pending = false;
        active = -1;
        return;
      }
      gl.endQuery(ext.TIME_ELAPSED_EXT);
      slots[active].pending = true;
      active = -1;
    },
    dispose() {
      if (disposed) return;
      if (active !== -1 && !gl.isContextLost()) gl.endQuery(ext.TIME_ELAPSED_EXT);
      for (const slot of slots) gl.deleteQuery(slot.query);
      active = -1;
      disposed = true;
    },
  };
}
