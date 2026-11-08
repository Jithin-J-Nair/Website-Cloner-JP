import { useStudioStore } from "@/lib/store";
import { registerRouteNavigation, type RouteNavigationRequest } from "@/lib/route-navigation";
import { drawRouteAperture } from "@/lib/route-transition-motion";

interface Transaction extends RouteNavigationRequest {
  phase: "hiding" | "waiting" | "preparing" | "showing";
  elapsed: number;
  target: string;
  previousPath: string;
  committed: boolean;
  reduced: boolean;
}

/** Generic page transitions only. Case→case's existing full-bleed morph stays independent. */
export function createRouteTransitionMotion(root: HTMLElement, canvas: HTMLCanvasElement, status: HTMLElement) {
  const ctx = canvas.getContext("2d");
  let job: Transaction | null = null, raf = 0, previous = 0, disposed = false, deadline = 0, frames = 0;
  let width = innerWidth, height = innerHeight, dpr = 1, dirty = true;
  let inertTargets: { element: HTMLElement; inert: boolean; busy: string | null }[] = [];
  let oldFocus: HTMLElement | null = null;
  const reduced = () => useStudioStore.getState().reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setPhase = () => { root.dataset.routePhase = job?.phase ?? "idle"; };
  const schedule = () => { if (!disposed && job && job.phase !== "waiting" && !document.hidden && !raf) raf = requestAnimationFrame(frame); };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };
  const measure = () => {
    width = innerWidth; height = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.ceil((width + 2) * dpr); canvas.height = Math.ceil((height + 2) * dpr);
    canvas.style.width = `${width + 2}px`; canvas.style.height = `${height + 2}px`; dirty = false;
  };
  const release = () => {
    for (const { element, inert, busy } of inertTargets) {
      element.inert = inert;
      if (busy === null) element.removeAttribute("aria-busy"); else element.setAttribute("aria-busy", busy);
    }
    inertTargets = [];
  };
  const finish = (cancelled = false) => {
    const completed = job;
    job = null; pause(); clearTimeout(deadline); release();
    root.hidden = true; root.style.removeProperty("opacity"); root.dataset.routeResult = cancelled ? "cancelled" : "completed"; setPhase();
    useStudioStore.getState().setTransition(false, "");
    status.textContent = cancelled ? "Navigation interrupted. You can try the link again." : "";
    if (cancelled) { if (oldFocus?.isConnected) {
      const target = oldFocus.closest("[inert]") ? document.getElementById("header-right-menu-btn") : oldFocus;
      target?.focus({ preventScroll: true });
    } }
    else if (completed?.committed) {
      const target = document.getElementById("main-content");
      if (target) { target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
    }
    oldFocus = null;
  };
  const commit = () => {
    if (!job || job.committed) return;
    job.committed = true; job.phase = "waiting"; job.elapsed = 0; setPhase();
    const transaction = job;
    deadline = window.setTimeout(() => { if (job === transaction) finish(true); }, 12000);
    try { job.commit(); } catch { finish(true); }
  };
  const paint = () => {
    if (!job) return;
    if (dirty) measure();
    const active = job.phase === "hiding" ? job.elapsed : job.phase === "showing" ? 1 - job.elapsed : 1;
    if (ctx && !job.reduced) {
      root.style.opacity = "1";
      root.style.removeProperty("background-color");
      drawRouteAperture(ctx, width, height, dpr, active, job.phase === "showing");
    } else {
      // Context failure is an opacity fallback, not a new WebGL requirement.
      root.style.backgroundColor = "#000";
      root.style.opacity = job.reduced ? "0" : String(Math.max(0, Math.min(1, active)));
    }
    root.dataset.routeProgress = Math.min(1, job.elapsed).toFixed(4);
    root.dataset.routeFrames = String(++frames);
  };
  // Bounded DOM readiness, never a fabricated asset-loading percentage. Scene owners
  // resume under the covered aperture so they can measure/render before disclosure.
  const ready = () => {
    if (document.fonts.status !== "loaded") return false;
    const content = document.getElementById("main-content");
    return !!content?.firstElementChild && [...content.querySelectorAll("img")].every(img => {
      if (img.complete) return true; // includes settled failures: keep their DOM fallback
      const r = img.getBoundingClientRect();
      return r.width === 0 || r.bottom <= 0 || r.top >= height || r.right <= 0 || r.left >= width;
    });
  };
  function frame(now: number) {
    raf = 0;
    if (!job || document.hidden || disposed) { previous = 0; return; }
    const dt = previous ? Math.min(.1, Math.max(0, (now - previous) / 1000)) : 0;
    previous = now; job.elapsed += dt;
    if (job.phase === "hiding" && (job.elapsed >= 1 || job.reduced)) {
      job.elapsed = 1; paint(); commit();
    } else if (job.phase === "preparing" && job.elapsed >= .032 && (ready() || job.elapsed >= 1.5)) {
      job.phase = "showing"; job.elapsed = 0; setPhase();
    } else if (job.phase === "showing" && (job.elapsed >= 1 || job.reduced)) {
      finish(); return;
    }
    paint(); schedule();
  }
  const unregister = registerRouteNavigation(request => {
    if (job || disposed) return false;
    const state = useStudioStore.getState();
    state.setMenuOpen(false);
    if (reduced()) { request.commit(); return true; }
    const target = new URL(request.href, location.href);
    job = { ...request, target: target.pathname.replace(/\/$/, "") || "/", previousPath: location.pathname, phase: "hiding", elapsed: 0, committed: false, reduced: false };
    oldFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    inertTargets = [document.getElementById("main-content"), document.getElementById("header")]
      .filter((element): element is HTMLElement => !!element)
      .map(element => ({ element, inert: element.inert, busy: element.getAttribute("aria-busy") }));
    for (const { element } of inertTargets) { element.inert = true; element.setAttribute("aria-busy", "true"); }
    status.textContent = `Loading ${request.label}`;
    root.hidden = false; root.dataset.routeTarget = request.href; setPhase();
    state.setTransition(true, request.label);
    paint(); schedule();
    return true;
  });
  const popstate = () => { if (job) finish(true); };
  window.addEventListener("popstate", popstate);
  const visibility = () => { pause(); schedule(); };
  const resize = () => { dirty = true; if (job) paint(); schedule(); };
  const preventScroll = (event: Event) => { if (job) event.preventDefault(); };
  const escape = (event: KeyboardEvent) => { if (job && event.key === "Escape") { event.preventDefault(); finish(true); } };
  const unsubscribe = useStudioStore.subscribe((state, before) => {
    if (state.reducedMotion && !before.reducedMotion && job) { job.reduced = true; schedule(); }
  });
  document.addEventListener("visibilitychange", visibility);
  window.addEventListener("resize", resize, { passive: true });
  window.addEventListener("keydown", escape);
  root.addEventListener("wheel", preventScroll, { passive: false });
  root.addEventListener("touchmove", preventScroll, { passive: false });
  setPhase();
  return {
    routeCommitted(pathname: string) {
      if (!job) return;
      const path = pathname.replace(/\/$/, "") || "/";
      // External/back navigation supersedes a pending request; never push it later.
      if (!job.committed && path !== job.previousPath) { finish(true); return; }
      if (job.committed && path !== job.previousPath) {
        clearTimeout(deadline); deadline = 0;
        job.phase = "preparing"; job.elapsed = 0; previous = 0; setPhase();
        useStudioStore.getState().setTransition(false, ""); schedule();
      } else if (job.committed && path === job.target) {
        clearTimeout(deadline); deadline = 0;
        job.phase = "preparing"; job.elapsed = 0; previous = 0; setPhase();
        useStudioStore.getState().setTransition(false, ""); schedule();
      }
    },
    dispose() {
      if (disposed) return;
      unregister(); if (job) finish(true); disposed = true; pause(); clearTimeout(deadline); release(); unsubscribe();
      window.removeEventListener("popstate", popstate);
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("resize", resize); window.removeEventListener("keydown", escape);
      root.removeEventListener("wheel", preventScroll); root.removeEventListener("touchmove", preventScroll);
    },
  };
}
