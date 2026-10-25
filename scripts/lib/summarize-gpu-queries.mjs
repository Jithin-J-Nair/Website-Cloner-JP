/** Phase-end snapshots can contain queries delivered after their originating sweep.
 * Deduplicate the bounded telemetry ring by ID and preserve the originating phase.
 * These are not RAF-frame-paired or strictly in-window statistics.
 */
export function summarizeGpuQueries(phases) {
  const buckets = new Map(phases.map(phase => [phase.name, []]));
  const seen = new Set();
  for (const phase of phases) {
    for (const entry of phase.telemetry?.gpuTiming?.recent ?? []) {
      if (entry.id <= 0 || seen.has(entry.id) || !Number.isFinite(entry.ms) || entry.ms <= 0) continue;
      const bucket = buckets.get(entry.phase);
      if (!bucket) continue;
      seen.add(entry.id);
      bucket.push(entry.ms);
    }
  }
  return [...buckets].map(([phase, values]) => {
    values.sort((a, b) => a - b);
    return { phase, samples: values.length, executionMs: values.length ? {
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      p50: values[Math.floor(values.length * 0.5)],
      p95: values[Math.min(values.length - 1, Math.floor(values.length * 0.95))],
    } : null };
  });
}
