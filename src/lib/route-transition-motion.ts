import { editorialClamp as clamp, editorialExpoInOut as expoInOut } from "./home-editorial-motion";

/** TransitionOverlay's native transform. Hide rotates negative, show positive. */
export function routeAperturePose(width: number, height: number, activeRatio: number, showing: boolean) {
  const w = width + 2, h = height + 2;
  const unit = Math.max(1, Math.floor(Math.min(42, width / 30)));
  const diagonal = Math.hypot(w, h) / unit;
  const f = expoInOut(1 - clamp(activeRatio));
  return { width: w, height: h, unit, zoom: (1 + f * diagonal) * unit, angle: f * (showing ? 1 : -1), x: unit * f * diagonal, y: -unit * .5 * f * diagonal, ink: 1 - f };
}

/** No WebGL/context/asset dependency: the native overlay is a Canvas2D XOR mask. */
export function drawRouteAperture(ctx: CanvasRenderingContext2D, width: number, height: number, dpr: number, active: number, showing: boolean) {
  const p = routeAperturePose(width, height, active, showing);
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, p.width, p.height);
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, p.width, p.height);
  ctx.translate(p.width * .5, p.height * .5);
  ctx.rotate(p.angle);
  ctx.translate(p.x, p.y);
  ctx.scale(p.zoom, p.zoom);
  ctx.translate(-1, 1.5);
  ctx.save();
  ctx.translate(.5, -.5);
  ctx.rotate(Math.PI * .5);
  ctx.globalCompositeOperation = "xor";
  ctx.fillRect(-3, 0, 3, 1);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = p.ink;
  ctx.fillRect(-3, 0, 3, 1);
  ctx.restore();
  ctx.save();
  ctx.translate(.5, -.5);
  ctx.globalCompositeOperation = "xor";
  ctx.fillRect(0, 0, 2, 1);
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = "#fff";
  ctx.globalAlpha = p.ink;
  ctx.fillRect(0, 0, 2, 1);
  ctx.restore();
  ctx.restore();
}

export interface ScrollPortalState { charge: number; wait: number }
/** Source ScrollNavSection: input is direction, not wheel packet magnitude. */
export function stepScrollPortal(state: ScrollPortalState, dt: number, visible: boolean, atEnd: boolean, direction: number): ScrollPortalState {
  const delta = Math.max(0, dt);
  const wait = direction > 0 ? .3 : Math.max(0, state.wait - delta);
  const rate = atEnd && direction > 0 ? 2 : wait > 0 ? 0 : direction < 0 ? -5 : -.2;
  return { charge: visible ? clamp(state.charge + delta * rate) : 0, wait };
}
