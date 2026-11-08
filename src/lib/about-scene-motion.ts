/** Original, reversible framing informed by the three supplied About stills.
 * The stills establish framing, not Lusion's timing, spline or simulation.
 * Keep this pure: scroll is the only camera authority, never an elapsed timer.
 */
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (a: number, b: number, u: number) => {
  const t = Math.max(0, Math.min(1, (u - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
/** The personally reviewed recording shows one continuous flattened type
 * surface. These reversible scroll windows are authored, not recovered source
 * constants; mobile remains an adaptation without an official mobile video. */
export function aboutWordmarkSweepPose(progress: number, mobile: boolean) {
  const u = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  const start = mobile ? 1.65 : .68;
  const peak = mobile ? 1.94 : .86;
  const holdEnd = mobile ? 2.48 : 1.24;
  const end = mobile ? 2.82 : 1.45;
  return {
    opacity: ease(start, peak, u) * (1 - ease(holdEnd, end, u)),
    deformation: ease(start, end, u),
    // Retained neutral affine pose for callers: deformation now lives in the mesh.
    xVw: 0, yVh: 0, rotation: 0, stretchX: 1, skewX: 0, scale: 1,
  };
}

export function aboutScenePose(progress: number, mobile: boolean) {
  const u = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  const pullback = ease(.05, 1.45, u);
  const retreat = ease(mobile ? 2.75 : 1.7, mobile ? 3.5 : 3.15, u);
  const editorial = ease(3.6, 5, u);
  const team = ease(6.2, 6.95, u);
  const valleyZ = mix(mobile ? 22 : 20, mobile ? 48 : 72, retreat);
  const valleyY = mix(4.6, mobile ? 12 : 17, retreat);
  const valleyLook = mix(4.1, mobile ? 8 : 9.8, retreat);
  return {
    pullback, editorial, team,
    x: Math.sin(editorial * 1.2) * .6,
    y: mix(8.15, mix(valleyY, 6.6, editorial), pullback),
    z: mix(mobile ? 8.6 : 6.9, mix(valleyZ, mobile ? 21.5 : 18.2, editorial), pullback),
    lookY: mix(8.15, mix(valleyLook, mix(7.6, .85, team), editorial), pullback),
  };
}

/** One lettering packet prevents HUD chapters from drifting independently.
 * Pure/reversible: no timers, React updates, renderer or input ownership here. */
export function aboutLetteringPose(progress: number, mobile: boolean) {
  const u = Number.isFinite(progress) ? Math.max(0, progress) : 0;
  return {
    opening: 1 - ease(mobile ? 1.65 : .68, mobile ? 1.94 : .86, u),
    openingTravel: ease(mobile ? 1.65 : .68, mobile ? 1.94 : .86, u),
    manifesto: ease(mobile ? 1.95 : 1.44, mobile ? 2.42 : 1.6, u) * (1 - ease(3.65, 4.35, u)),
    narrative: ease(4.45, 4.82, u) * (1 - ease(5.82, 6.42, u)),
  };
}
