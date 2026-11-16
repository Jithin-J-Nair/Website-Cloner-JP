import { useStudioStore } from "@/lib/store";
import { registerRouteNavigation, type RouteNavigationRequest } from "@/lib/route-navigation";
import { drawRouteAperture } from "@/lib/route-transition-motion";
import { projectDomOpacity, projectZoomProgress } from "@/lib/project-zoom-motion";
import { captureProjectListSource, rememberProjectOrigin, setProjectDisclosure } from "@/lib/project-transition";
import { LUSION_HOME, LUSION_PROJECTS_ARCHIVE, LUSION_PROJECT_DETAILS } from "@/data/reference";
import { createProjectZoomSurface, type ProjectZoomSelection } from "./ProjectZoomSurface";

interface Transaction extends RouteNavigationRequest {
  phase: "hiding" | "waiting" | "preparing" | "showing";
  elapsed: number;
  target: string;
  previousPath: string;
  committed: boolean;
  reduced: boolean;
  returnId?: string;
  zoom?: { selection: ProjectZoomSelection; surface: ReturnType<typeof createProjectZoomSurface>; reverse: boolean; restored: boolean };
}

/** One persistent route owner. Selected projects use a retained depth/list surface;
 * unrelated navigation keeps the existing generic aperture. No link-local clocks. */
export function createRouteTransitionMotion(root: HTMLElement, canvas: HTMLCanvasElement, status: HTMLElement) {
  const ctx = canvas.getContext("2d");
  let job: Transaction | null = null, raf = 0, previous = 0, disposed = false, deadline = 0, frames = 0;
  let width = innerWidth, height = innerHeight, dpr = 1, dirty = true;
  let inertTargets: { element: HTMLElement; inert: boolean; busy: string | null }[] = [];
  let hiddenSources: { canvas: HTMLCanvasElement; visibility: string }[] = [];
  let oldFocus: HTMLElement | null = null, oldOpacity = "";
  const content = () => document.getElementById("main-content");
  const reduced = () => useStudioStore.getState().reducedMotion || matchMedia("(prefers-reduced-motion: reduce)").matches;
  const setPhase = () => { root.dataset.routePhase = job?.phase ?? "idle"; };
  const schedule = () => { if (!disposed && job && job.phase !== "waiting" && !document.hidden && !raf) raf = requestAnimationFrame(frame); };
  const pause = () => { cancelAnimationFrame(raf); raf = 0; previous = 0; };
  const measure = () => {
    width = innerWidth; height = innerHeight; dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.ceil((width + 2) * dpr); canvas.height = Math.ceil((height + 2) * dpr);
    canvas.style.width = `${width + 2}px`; canvas.style.height = `${height + 2}px`; job?.zoom?.surface.resize(); dirty = false;
  };
  const hideSource = (source: HTMLCanvasElement | undefined) => {
    if (!source || hiddenSources.some(entry => entry.canvas === source)) return;
    hiddenSources.push({ canvas: source, visibility: source.style.visibility }); source.style.visibility = "hidden";
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
    completed?.zoom?.surface.dispose();
    for (const entry of hiddenSources) entry.canvas.style.visibility = entry.visibility;
    hiddenSources = [];
    if (content()) content()!.style.opacity = oldOpacity;
    oldOpacity = ""; setProjectDisclosure(null);
    canvas.hidden = false; root.hidden = true; root.style.removeProperty("opacity"); root.style.removeProperty("background-color"); root.style.removeProperty("z-index");
    root.dataset.routeResult = cancelled ? "cancelled" : "completed"; setPhase();
    useStudioStore.setState({ routeTransitionActive: false }); useStudioStore.getState().setTransition(false, "");
    status.textContent = cancelled ? "Navigation interrupted. You can try the link again." : "";
    if (cancelled && oldFocus?.isConnected) {
      const target = oldFocus.closest("[inert]") ? document.getElementById("header-right-menu-btn") : oldFocus;
      target?.focus({ preventScroll: true });
    } else if (completed?.committed) {
      const target = completed.returnId ? document.querySelector<HTMLElement>(`.project-item[data-id="${completed.returnId}"]`) : content();
      if (target) { if (!target.matches("a,button")) target.setAttribute("tabindex", "-1"); target.focus({ preventScroll: true }); }
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
    if (job.zoom) {
      const { surface, reverse } = job.zoom;
      root.style.opacity = "1";
      const p = Math.min(1, job.elapsed / (reverse ? 1.5 : 1));
      if (job.phase === "hiding") {
        const hide = Math.min(1,job.elapsed / (reverse ? 1 : 1.5));
        surface.paint(reverse ? 1 : projectZoomProgress(hide),reverse ? hide : 1);
        if (content()) content()!.style.opacity = String(projectDomOpacity(hide));
      } else if (job.phase === "showing") {
        surface.paint(reverse ? 1-projectZoomProgress(p) : 1,reverse ? 1 : 1-Math.max(0,(p-.35)/.65));
        if (content()) content()!.style.opacity = String(Math.max(0,Math.min(1,(p-.5)/.5)));
        if (!reverse) setProjectDisclosure(p);
      } else { surface.paint(1); if (content()) content()!.style.opacity = "0"; }
    } else {
      const active = job.phase === "hiding" ? job.elapsed : job.phase === "showing" ? 1 - job.elapsed : 1;
      if (ctx && !job.reduced) {
        root.style.opacity = "1"; root.style.removeProperty("background-color");
        drawRouteAperture(ctx, width, height, dpr, active, job.phase === "showing");
      } else { root.style.backgroundColor = "#000"; root.style.opacity = job.reduced ? "0" : String(Math.max(0, Math.min(1, active))); }
    }
    root.dataset.routeProgress = Math.min(1, job.elapsed).toFixed(4); root.dataset.routeFrames = String(++frames);
  };
  const restoreListing = () => {
    if (!job?.returnId) return true;
    const anchor = document.querySelector<HTMLAnchorElement>(`.project-item[data-id="${job.returnId}"]`);
    const stage = anchor?.querySelector<HTMLElement>(".project-item-main");
    if (!anchor || !stage) return false;
    // Existing Lenis observes window.scrollTo; no second scroll engine/RAF.
    window.scrollTo(0,Math.max(0,stage.getBoundingClientRect().top+scrollY-height*.25));
    const rect = stage.getBoundingClientRect();
    if (!job.zoom) return true;
    job.zoom.surface.setBox({ x:rect.x,y:rect.y,width:rect.width,height:rect.height });
    const snapshot = captureProjectListSource(anchor);
    if (!job.zoom.restored && (stage.dataset.depthReady === "true" || job.elapsed >= 1.5)) {
      const selection = { ...job.zoom.selection, box:{x:rect.x,y:rect.y,width:rect.width,height:rect.height}, snapshot };
      const replacement = createProjectZoomSurface(root,selection); replacement.paint(1);
      job.zoom.surface.dispose(); job.zoom.surface = replacement; job.zoom.selection = selection; job.zoom.restored = true;
      hideSource(snapshot?.canvas);
    }
    return job.zoom.restored;
  };
  const ready = () => {
    if (document.fonts.status !== "loaded") return false;
    const container = content();
    return !!container?.firstElementChild && [...container.querySelectorAll("img")].every(img => {
      if (img.complete) return true;
      const r = img.getBoundingClientRect(); return r.width === 0 || r.bottom <= 0 || r.top >= height || r.right <= 0 || r.left >= width;
    });
  };
  function frame(now: number) {
    raf = 0;
    if (!job || document.hidden || disposed) { previous = 0; return; }
    const dt = previous ? Math.min(.1, Math.max(0, (now - previous) / 1000)) : 0;
    previous = now; job.elapsed += dt;
    const hideDuration = job.zoom && !job.zoom.reverse ? 1.5 : 1;
    const showDuration = job.zoom?.reverse ? 1.5 : 1;
    if (job.phase === "hiding" && (job.elapsed >= hideDuration || job.reduced)) {
      job.elapsed = hideDuration; paint(); commit();
    } else if (job.phase === "preparing") {
      const listingReady = restoreListing();
      if (job.elapsed >= .08 && ((ready() && listingReady) || job.elapsed >= 2)) { job.phase = "showing"; job.elapsed = 0; setPhase(); }
    } else if (job.phase === "showing" && (job.elapsed >= showDuration || job.reduced)) { finish(); return; }
    paint(); schedule();
  }
  const unregister = registerRouteNavigation(request => {
    if (job || disposed) return false;
    const state = useStudioStore.getState();
    const target = new URL(request.href, location.href);
    state.setMenuOpen(false);
    if (request.project?.direction === "open") rememberProjectOrigin(location.pathname);
    if (reduced() && !request.project) { request.commit(); return true; }
    job = { ...request, target: target.pathname.replace(/\/$/, "") || "/", previousPath: location.pathname, phase: "hiding", elapsed: 0, committed: false, reduced: reduced() };
    oldFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    oldOpacity = content()?.style.opacity ?? "";
    const project = request.project;
    const card = project && LUSION_PROJECTS_ARCHIVE.projects.find(card => card.id === project.id);
    const eligibleReturn = project?.direction === "return" && (target.pathname === "/projects" || target.pathname === "/work" || (target.pathname === "/" && LUSION_HOME.featured.projects.some(card => card.id === project.id)));
    if (eligibleReturn) job.returnId = project.id;
    if (!job.reduced && card && project && (project.anchor?.isConnected || eligibleReturn)) {
      const stage = project.anchor?.querySelector<HTMLElement>(".project-item-main"), rect = stage?.getBoundingClientRect();
      const w = innerWidth * (innerWidth <= 812 ? .9 : .44);
      const background = LUSION_PROJECT_DETAILS.find(detail => detail.id === card.id)?.theme.colorBg ?? card.colorBg;
      const selection: ProjectZoomSelection = { id:card.id,background,settled:project.direction === "return",box:rect ? {x:rect.x,y:rect.y,width:rect.width,height:rect.height} : {x:innerWidth*.05,y:innerHeight*.25,width:w,height:w*.65},snapshot:project.anchor ? captureProjectListSource(project.anchor) : null };
      try {
        job.zoom = { selection,surface:createProjectZoomSurface(root,selection),reverse:project.direction === "return",restored:false };
        canvas.hidden = true; root.style.zIndex = "45"; setProjectDisclosure(project.direction === "open" ? 0 : null);
        hideSource(selection.snapshot?.canvas);
      } catch { job.zoom = undefined; }
    }
    inertTargets = [content(), document.getElementById("header")]
      .filter((element): element is HTMLElement => !!element)
      .map(element => ({ element, inert: element.inert, busy: element.getAttribute("aria-busy") }));
    for (const { element } of inertTargets) { element.inert = true; element.setAttribute("aria-busy", "true"); }
    status.textContent = `Loading ${request.label}`;
    root.hidden = false; root.dataset.routeTarget = request.href; root.dataset.routeKind = job.zoom ? (job.zoom.reverse ? "project-return" : "project-open") : "generic"; setPhase();
    useStudioStore.setState({ routeTransitionActive:true }); state.setTransition(true, request.label);
    paint(); schedule(); return true;
  });
  const popstate = () => { if (job) finish(true); };
  window.addEventListener("popstate", popstate);
  const visibility = () => { pause(); schedule(); };
  const resize = () => { dirty = true; if (job) paint(); schedule(); };
  const preventScroll = (event: Event) => { if (job) event.preventDefault(); };
  const escape = (event: KeyboardEvent) => { if (job && ["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","PageUp","PageDown","Home","End"," "].includes(event.key)) event.preventDefault(); if (job && event.key === "Escape") { event.preventDefault(); finish(true); } };
  const unsubscribe = useStudioStore.subscribe((state, before) => { if (state.reducedMotion && !before.reducedMotion && job) { job.reduced = true; if (!job.committed) commit(); else finish(); schedule(); } });
  document.addEventListener("visibilitychange", visibility); window.addEventListener("resize", resize, { passive:true }); window.addEventListener("keydown", escape);
  // Also gate input above the zoom layer (persistent header/canvas), not only its root.
  window.addEventListener("wheel", preventScroll, { passive:false }); window.addEventListener("touchmove", preventScroll, { passive:false });
  setPhase();
  return {
    routeCommitted(pathname: string) {
      if (!job) return;
      const path = pathname.replace(/\/$/, "") || "/";
      if (!job.committed && path !== job.previousPath) { finish(true); return; }
      if (job.committed && (path !== job.previousPath || path === job.target)) {
        clearTimeout(deadline); deadline = 0; job.phase = "preparing"; job.elapsed = 0; previous = 0; setPhase();
        useStudioStore.getState().setTransition(false, ""); schedule();
      }
    },
    dispose() {
      unregister(); if (job) finish(true); disposed = true; pause(); clearTimeout(deadline); release(); unsubscribe();
      window.removeEventListener("popstate", popstate); document.removeEventListener("visibilitychange", visibility); window.removeEventListener("resize", resize); window.removeEventListener("keydown", escape);
      window.removeEventListener("wheel", preventScroll); window.removeEventListener("touchmove", preventScroll);
    },
  };
}
