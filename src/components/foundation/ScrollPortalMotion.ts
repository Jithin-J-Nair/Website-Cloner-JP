import { useStudioStore } from "@/lib/store";
import { stepScrollPortal, type ScrollPortalState } from "@/lib/route-transition-motion";

/** Native elapsed-time charge, not a second scroll engine. Existing document/Lenis
 * owns position; this owner only observes input at the bottom of its chapter. */
export function createScrollPortalMotion(root: HTMLElement, bar: HTMLElement, reduced: boolean, activate: () => boolean) {
  let state: ScrollPortalState = { charge: 0, wait: 0 };
  let raf = 0, previous = 0, pendingDelta = 0, touchY: number | null = null, disposed = false, triggered = false, frames = 0;
  const blocked = () => {
    const s = useStudioStore.getState();
    const phase = document.getElementById("route-transition")?.dataset.routePhase;
    return reduced || document.hidden || s.menuOpen || s.reelOpen || s.isTransitioning || (phase !== undefined && phase !== "idle");
  };
  const paint = () => {
    bar.style.transform = `scaleX(${state.charge.toFixed(5)})`;
    root.dataset.portalCharge = state.charge.toFixed(5); root.dataset.portalFrames = String(frames);
  };
  const reset = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; pendingDelta = 0; touchY = null; state = { charge: 0, wait: 0 }; paint(); };
  const schedule = () => { if (!disposed && !raf && !triggered && !blocked()) raf = requestAnimationFrame(frame); };
  function frame(now: number) {
    raf = 0; if (disposed || blocked()) { reset(); return; }
    const dt = previous ? Math.min(.1, Math.max(0, (now - previous) / 1000)) : 1 / 60; previous = now;
    const r = root.getBoundingClientRect(), visible = r.top < innerHeight && r.bottom > 0;
    const atEnd = scrollY >= document.documentElement.scrollHeight - innerHeight - 5;
    state = stepScrollPortal(state, dt, visible, atEnd, Math.sign(pendingDelta)); pendingDelta = 0; frames++; paint();
    if (state.charge >= 1) {
      triggered = true; previous = 0;
      if (!activate()) { triggered = false; reset(); }
      return;
    }
    if (visible && (state.charge > 0 || state.wait > 0)) schedule(); else previous = 0;
  }
  const wheel = (e: WheelEvent) => { if (blocked() || (e.target instanceof Element && e.target.closest("input,textarea,select,[contenteditable]"))) return; pendingDelta += e.deltaY || e.deltaX; schedule(); };
  const touchStart = (e: TouchEvent) => { touchY = !blocked() && e.touches.length === 1 ? e.touches[0].clientY : null; };
  const touchMove = (e: TouchEvent) => {
    if (blocked() || touchY === null || e.touches.length !== 1) { touchY = null; return; }
    const y = e.touches[0].clientY; pendingDelta += touchY - y; touchY = y; schedule();
  };
  const touchEnd = () => { touchY = null; };
  const scroll = () => { if (state.charge > 0) schedule(); };
  const visibility = () => { reset(); };
  let transactionWasActive = false;
  const unsubscribe = useStudioStore.subscribe(state => {
    const phase = document.getElementById("route-transition")?.dataset.routePhase;
    const transactionActive = state.isTransitioning || (phase !== undefined && phase !== "idle");
    if (blocked()) reset();
    else if (transactionWasActive) { triggered = false; reset(); }
    transactionWasActive = transactionActive;
  });
  window.addEventListener("wheel", wheel, { passive: true });
  window.addEventListener("touchstart", touchStart, { passive: true }); window.addEventListener("touchmove", touchMove, { passive: true });
  window.addEventListener("touchend", touchEnd, { passive: true }); window.addEventListener("touchcancel", touchEnd, { passive: true });
  window.addEventListener("scroll", scroll, { passive: true }); window.addEventListener("resize", reset, { passive: true });
  document.addEventListener("visibilitychange", visibility);
  paint();
  return () => {
    disposed = true; reset(); unsubscribe();
    window.removeEventListener("wheel", wheel); window.removeEventListener("touchstart", touchStart); window.removeEventListener("touchmove", touchMove);
    window.removeEventListener("touchend", touchEnd); window.removeEventListener("touchcancel", touchEnd); window.removeEventListener("scroll", scroll); window.removeEventListener("resize", reset);
    document.removeEventListener("visibilitychange", visibility);
    delete root.dataset.portalCharge; delete root.dataset.portalFrames;
  };
}
