/**
 * Original procedural side-profile portrait study for the About team scene.
 *
 * This geometry is generated locally and is not derived from, or intended to
 * reproduce, any named team member's captured likeness or restricted model.
 */
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const smoothstep = (start: number, end: number, value: number) => {
  const t = clamp01((value - start) / (end - start));
  return t * t * (3 - 2 * t);
};

export function buildSculpturalPortraitPositions(memberIndex: number, count = 8192): Float32Array {
  const safeIndex = Number.isFinite(memberIndex) ? Math.abs(Math.floor(memberIndex)) % 7 : 0;
  const safeCount = Number.isFinite(count) ? Math.max(1, Math.min(32768, Math.floor(count))) : 8192;
  const out = new Float32Array(safeCount * 3);
  let seed = (safeIndex * 2654435761 + 1013904223) >>> 0;
  const random = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const facing = safeIndex % 2 === 0 ? 1 : -1;
  const headCenterX = -0.055 + (safeIndex % 3) * 0.015;
  const headCenterY = 0.18;
  const headRadiusX = 0.52 + (safeIndex % 4) * 0.014;
  const headRadiusY = 0.69 + (safeIndex % 3) * 0.012;
  const noseProjection = 0.115 + (safeIndex % 3) * 0.012;
  const yawTurn = ((safeIndex % 3) - 1) * 0.12;

  let written = 0;
  let guard = 0;
  while (written < safeCount && guard < safeCount * 18) {
    guard++;
    const u = random() * 2 - 1;
    const v = random() * 2 - 1;
    // Rounded cranial envelope; the shallow Gaussian at the front creates
    // the nose bridge without turning the profile into a rectangular volume.
    const headLevel = (v - headCenterY) / headRadiusY;
    const headHalfWidth = Math.abs(headLevel) <= 1
      ? headRadiusX * Math.sqrt(Math.max(0, 1 - headLevel * headLevel))
      : 0;
    const back = headCenterX - headHalfWidth;
    const nose = Math.exp(-Math.pow((v - 0.13) / 0.075, 2)) * noseProjection;
    const front = headCenterX + headHalfWidth + nose;

    // Human-scale side silhouette: rounded skull, brow, projecting nose, chin.
    const inHead = v > -0.58 && v < 0.9 && headHalfWidth > 0 && u > back && u < front;
    const inNeck = v > -0.95 && v <= -0.43 && u > -0.2 && u < 0.18;
    const shoulderReach = 0.52 + smoothstep(-0.72, -1, v) * 0.22;
    const inShoulders = v <= -0.72 && v >= -1 && Math.abs(u + 0.03) < shoulderReach;

    if (!inHead && !inNeck && !inShoulders) continue;

    let depth = 0;
    if (inHead) {
      const across = (u - headCenterX) / Math.max(0.001, headHalfWidth);
      const cranialDepth = Math.sqrt(Math.max(0, 1 - across * across)) * 0.34;

      // Small relief cues make the edge read as a profile without reconstructing
      // identifiable facial detail: a soft brow, nose bridge, cheek and mouth line.
      const nose = Math.exp(-Math.pow((u - front + 0.075) / 0.06, 2) - Math.pow((v - 0.13) / 0.16, 2)) * 0.075;
      const brow = Math.exp(-Math.pow((u - front + 0.17) / 0.07, 2) - Math.pow((v - 0.32) / 0.045, 2)) * 0.025;
      const cheek = Math.exp(-Math.pow((u - front + 0.2) / 0.14, 2) - Math.pow((v + 0.015) / 0.19, 2)) * 0.055;
      const mouth = Math.exp(-Math.pow((u - front + 0.06) / 0.055, 2) - Math.pow((v + 0.12) / 0.035, 2)) * 0.025;
      depth = cranialDepth + nose + cheek - brow + mouth;
    } else if (inNeck) {
      depth = Math.sqrt(Math.max(0, 0.052 - Math.pow(u - 0.01, 2))) * 0.9;
    } else {
      const shoulder = Math.max(0, 1 - Math.pow((u + 0.03) / shoulderReach, 2));
      depth = Math.sqrt(shoulder) * 0.28 + 0.025;
    }

    // Mirror the profile direction between generated variants and give each
    // sculpt a restrained 3/4 turn. The form stays distinct from a round bust.
    const px = (u + 0.1) * facing * 2.25;
    const py = v * 1.6;
    const pz = (depth + (random() - 0.5) * 0.012) * 1.45;
    const x = px * Math.cos(yawTurn) + pz * Math.sin(yawTurn);
    const z = -px * Math.sin(yawTurn) + pz * Math.cos(yawTurn);

    out[written * 3] = x;
    out[written * 3 + 1] = py;
    out[written * 3 + 2] = z;
    written++;
  }

  // The rejection sampler has generous headroom for the bounded silhouette.
  // Keep the GPU attribute fully populated if a future shape edit narrows it.
  if (written < safeCount) {
    for (let i = written; i < safeCount; i++) {
      const y = -0.78 + (i / Math.max(1, safeCount - 1)) * 0.24;
      out[i * 3] = 0;
      out[i * 3 + 1] = y * 1.6;
      out[i * 3 + 2] = 0;
    }
  }

  return out;
}
