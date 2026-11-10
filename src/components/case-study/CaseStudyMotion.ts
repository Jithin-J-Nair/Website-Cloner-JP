import { caseStudyScrollStrength } from "@/lib/case-study-motion";
import { shouldTransitionAnchor } from "@/lib/route-navigation";
import { getProjectDisclosure } from "@/lib/project-transition";
import type Lenis from "lenis";
import * as THREE from "three";
import type { LusionProjectDetail } from "@/data/reference";
import { useStudioStore } from "@/lib/store";
import { editorialClamp as clamp, editorialEase as ease, editorialExpoOut as expoOut, editorialExpoInOut as expoInOut, editorialFit as fit } from "@/lib/home-editorial-motion";
import { createCaseStudyGraphics, type CasePanelFrame } from "./CaseStudyGraphics";

/** A single case clock. Existing document/Lenis scroll supplies the horizontal
 * coordinate; no nested wheel smoother, perpetual per-media loop or scroll hijack. */
export function createCaseStudyMotion(root: HTMLElement, project: LusionProjectDetail, reduced: boolean, onNext: () => void) {
  const scrollWindow = window as Window & { __lenis?: Lenis };
  const stage = root.querySelector<HTMLElement>('.case-stage')!, track = root.querySelector<HTMLElement>('#project-details-items-move-container')!;
  const wrapper = root.querySelector<HTMLElement>('#project-details-items-wrapper')!, meta = root.querySelector<HTMLElement>('#project-details-meta')!;
  const title = root.querySelector<HTMLElement>('#project-details-title')!, desc = root.querySelector<HTMLElement>('#project-details-desc')!;
  const services = root.querySelector<HTMLElement>('#project-details-side-list-services'), links = root.querySelector<HTMLElement>('#project-details-side-list-links');
  const launch = root.querySelector<HTMLElement>('#project-details-launch-cta'), cue = root.querySelector<HTMLElement>('#project-details-header-info')!;
  const next = root.querySelector<HTMLElement>('#project-next')!;
  const nextBackground = new THREE.Color(), nextInk = new THREE.Color(), previewBackground = new THREE.Color("#f3f4f9"), previewInk = new THREE.Color("#c2c3c7"), targetBackground = new THREE.Color(project.nextProject.colorBg), targetInk = new THREE.Color(project.nextProject.colorText);
  const panels = [...root.querySelectorAll<HTMLElement>('.case-panel')].map(element => ({ element, left: 0, top: 0, width: 1, height: 1, time: 0, frame: { element, left: 0, top: 0, width: 1, height: 1, reveal: 1, fullscreen: element.dataset.fullscreen === "true" } as CasePanelFrame, fullscreen: element.dataset.fullscreen === 'true' }));
  const canvas = document.createElement('canvas'); canvas.id = 'case-gallery-canvas'; canvas.setAttribute('aria-hidden', 'true'); canvas.style.opacity = '0'; stage.append(canvas);
  const visiblePanels: CasePanelFrame[] = [];
  let disposed = false, lost = false, dirty = true, raf = 0, previous = 0, time = 0, frames = 0;
  let vertical = innerWidth <= 812, width = innerWidth, height = innerHeight, start = 0, maximum = 0, lastScroll = 0;
  let titleCenterOffset = 0, enteredViaHandoff = false;
  let morph = 0, nextTop = 0, nextTitleHeight = 0, targetTitleTop = 0;
  let touchY: number | null = null;
  let charge = 0, lastWheel = -1000, wheelDirection = 0, triggered = false, pointerX = 0, pointerY = 0;
  let suppressClick = false;
  let drag: { id: number; x: number; scroll: number } | null = null;
  let graphics: ReturnType<typeof createCaseStudyGraphics> | null = null;
  const listeners: (() => void)[] = [];
  const listen = (target: EventTarget, event: string, callback: EventListener, options?: AddEventListenerOptions) => { target.addEventListener(event, callback, options); listeners.push(() => target.removeEventListener(event, callback)); };
  const blocked = () => { const s = useStudioStore.getState(); return s.menuOpen || s.reelOpen || s.isTransitioning; };
  const schedule = () => { if (!disposed && !raf && !document.hidden && !blocked()) raf = requestAnimationFrame(frame); };
  const pause = () => { if (raf) cancelAnimationFrame(raf); raf = 0; previous = 0; drag = null; lastWheel = -1000; };
  const fallback = () => { graphics?.clearFallback(); canvas.style.opacity = '0'; root.dataset.caseGraphics = 'fallback'; };
  try { if (new URLSearchParams(location.search).get("forceWebglFallback") === "1") fallback(); else graphics = createCaseStudyGraphics(canvas, project.theme.shadow ?? 1, reduced, schedule); }
  catch { fallback(); }
  const measure = () => {
    width = innerWidth; height = innerHeight; vertical = width <= 812;
    track.style.removeProperty('transform'); next.style.removeProperty('transform');
    const r = wrapper.getBoundingClientRect();
    root.style.setProperty('--case-stage-height', `${r.height}px`); root.style.setProperty('--case-stage-top', `${wrapper.offsetTop}px`);
    start = root.getBoundingClientRect().top + scrollY;
    maximum = vertical ? 0 : Math.max(0, track.offsetWidth - width);
    root.style.height = vertical ? 'auto' : `${height + maximum}px`;
    for (const p of panels) {
      const r = p.element.getBoundingClientRect();
      p.left = vertical ? r.left : p.element.offsetLeft;
      p.top = vertical ? r.top + scrollY : wrapper.offsetTop + p.element.offsetTop;
      p.width = r.width; p.height = r.height;
    }
    nextTop = next.getBoundingClientRect().top + (vertical ? scrollY : 0);
    nextTitleHeight = next.querySelector("h2")!.getBoundingClientRect().height;
    targetTitleTop = vertical ? title.offsetTop : (height - meta.offsetHeight) * .5;
    title.style.removeProperty("transform");
    const titleBox = title.getBoundingClientRect(); titleCenterOffset = vertical ? 0 : height * .5 - titleBox.top - titleBox.height * .5;
    lastScroll = vertical ? scrollY : Math.max(0, Math.min(maximum, scrollY - start));
    graphics?.resize(width, height); dirty = false; root.dataset.caseReady = 'true';
  };
  function frame(now: number) {
    raf = 0; if (disposed || document.hidden || blocked()) { previous = 0; return; }
    if (dirty) measure();
    const dt = previous ? Math.min(.05, Math.max(0, (now - previous) / 1000)) : 1 / 60; previous = now;
    if (!reduced) time += dt;
    const scroll = vertical ? scrollY : Math.max(0, Math.min(maximum, scrollY - start));
    const delta = (scroll - lastScroll) / Math.max(1, vertical ? height : width); lastScroll = scroll;
    const scrollStrength = caseStudyScrollStrength(delta, reduced);
    if (!vertical) track.style.transform = `translate3d(${-scroll}px,0,0)`;
    const disclosure = getProjectDisclosure();
    if (disclosure !== null) enteredViaHandoff = true;
    const enter = reduced || (enteredViaHandoff && disclosure === null) ? 1 : disclosure ?? clamp(time / 1.5), alpha = vertical ? 1 : 1 - fit(scroll, 0, width * .25);
    const activate = alpha > .05;
    meta.style.pointerEvents = activate ? 'auto' : 'none'; meta.inert = !activate;
    const move = (el: HTMLElement | null, divisor: number, delay: number) => {
      if (!el) return;
      const p = reduced ? 1 : expoOut(fit(enter, delay, delay + .45));
      el.style.opacity = String(Math.min(alpha, p)); el.style.transform = `translate3d(${vertical ? 0 : -scroll / divisor}px,${(1 - p) * 30}px,0)`;
    };
    title.style.opacity = String(Math.min(alpha,fit(enter,.5,1)));
    title.style.transform = `translate3d(${vertical ? 0 : -scroll/2}px,${titleCenterOffset*(1-expoInOut(fit(enter,0,.65)))}px,0)`;
    move(desc, 3, .4); move(services, 5, .5); move(links, 4, .55); move(launch, Infinity, .45);
    cue.style.opacity = String(reduced ? 1 : 1 - ease(fit(scroll, 0, width * .1)));
    visiblePanels.length = 0;
    for (const p of panels) {
      const left = p.left - (vertical ? 0 : scroll), top = p.top - (vertical ? scrollY : 0);
      const visible = left < width && left + p.width > 0 && top < height && top + p.height > 0;
      p.time = visible ? p.time + dt : 0;
      p.element.dataset.caseVisible = String(visible);
      if (visible) { p.frame.left = left; p.frame.top = top; p.frame.width = p.width; p.frame.height = p.height; p.frame.reveal = reduced ? 1 : expoOut(clamp(p.time)); visiblePanels.push(p.frame); }
    }
    const atEnd = vertical ? scrollY + height >= document.documentElement.scrollHeight - 2 : scroll >= maximum - 2;
    if (!reduced && !triggered) charge = clamp(charge + dt * (atEnd && now - lastWheel < 120 ? wheelDirection > 0 ? 3 : -5 : -.2));
    root.style.setProperty('--case-charge', String(charge));
    if (charge >= 1) triggered = true;
    if (triggered) morph = clamp(morph + dt);
    const slide = morph < .5 ? 16 * morph ** 5 : 1 - (-2 * morph + 2) ** 5 / 2;
    next.style.transform = vertical ? `translateY(${-Math.max(0, nextTop - scrollY) * slide}px)` : `translateX(${-width * .75 * slide}px)`;
    const previewTitleTop = vertical ? height * .02 : (height - nextTitleHeight) * .5;
    next.style.setProperty('--case-next-y', `${(targetTitleTop - previewTitleTop) * morph}px`);
    next.style.backgroundColor = nextBackground.copy(previewBackground).lerp(targetBackground, fit(morph, .75, 1)).getStyle();
    next.style.color = nextInk.copy(previewInk).lerp(targetInk, fit(morph, .75, 1)).getStyle();
    if (morph >= 1) { pause(); onNext(); return; }
    if (graphics && !lost) {
      try { graphics.render(visiblePanels, time, scrollStrength, vertical, pointerX, pointerY, (project.theme.shadow ?? 1) + ((project.nextProject.shadow ?? 1) - (project.theme.shadow ?? 1)) * morph, dt, delta); canvas.style.opacity = '1'; root.dataset.caseGraphics = 'ready'; }
      catch { lost = true; fallback(); }
    }
    frames++; root.dataset.caseFrames = String(frames); root.dataset.caseScroll = scroll.toFixed(3); root.dataset.caseScrollStrength = scrollStrength.toFixed(6); root.dataset.caseMaximum = maximum.toFixed(3); root.dataset.caseAxis = vertical ? 'vertical' : 'horizontal';
    if (!reduced) schedule(); else previous = 0;
  }
  listen(window, 'scroll', schedule, { passive: true });
  listen(window, 'resize', () => { dirty = true; schedule(); }, { passive: true });
  listen(stage, 'load', () => { dirty = true; schedule(); }, { capture: true });
  listen(stage, 'loadeddata', schedule, { capture: true });
  listen(window, 'wheel', event => {
    const e = event as WheelEvent; if (blocked() || reduced) return;
    wheelDirection = Math.sign(e.deltaY || e.deltaX); lastWheel = performance.now(); schedule();
  }, { passive: true });
  listen(stage, 'pointerdown', event => {
    const e = event as PointerEvent;
    if (vertical || e.button !== 0 || blocked() || (e.target as Element).closest('a,button')) return;
    suppressClick = false;
    drag = { id: e.pointerId, x: e.clientX, scroll: scrollY };
  });
  listen(window, 'pointermove', event => {
    const e = event as PointerEvent; if (e.pointerType !== 'touch') { pointerX = e.clientX / width * 2 - 1; pointerY = 1 - e.clientY / height * 2; }
    if (drag && drag.id === e.pointerId) {
      if (Math.abs(drag.x - e.clientX) > 5) suppressClick = true;
      wheelDirection = Math.sign(drag.x - e.clientX); lastWheel = performance.now();
      const y = Math.max(0, Math.min(maximum, drag.scroll + drag.x - e.clientX));
      if (scrollWindow.__lenis) scrollWindow.__lenis.scrollTo(y, { immediate: true }); else window.scrollTo(0, y);
    }
    schedule();
  }, { passive: true });
  listen(stage, 'touchstart', event => { touchY = (event as TouchEvent).touches[0]?.clientY ?? null; }, { passive: true });
  listen(stage, 'touchmove', event => { const y = (event as TouchEvent).touches[0]?.clientY; if (vertical && !reduced && !blocked() && y !== undefined && touchY !== null) { wheelDirection = Math.sign(touchY - y); lastWheel = performance.now(); schedule(); } touchY = y ?? null; }, { passive: true });
  listen(stage, 'touchend', () => { touchY = null; }, { passive: true });
  // Click, Enter and end-scroll share this case owner's existing quintic morph.
  // Modified/new-tab clicks remain native; no generic L on a case chain.
  listen(next, 'click', event => {
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('a');
    if (!anchor || !shouldTransitionAnchor(event as MouseEvent,anchor)) return;
    event.preventDefault();
    if (blocked() || triggered) return;
    if (reduced) { triggered = true; onNext(); return; }
    triggered = true; schedule();
  });
  listen(stage, 'click', event => { if (suppressClick) { event.preventDefault(); event.stopPropagation(); suppressClick = false; } }, { capture: true });
  listen(window, 'pointerup', () => { drag = null; }); listen(window, 'pointercancel', () => { drag = null; }); listen(window, 'blur', pause); listen(window, 'focus', schedule);
  listen(document, 'visibilitychange', () => { if (document.hidden) pause(); else schedule(); });
  listen(stage, 'focusin', event => {
    if (vertical) return; const panel = (event.target as Element).closest<HTMLElement>('.case-panel,.case-next');
    if (!panel) return;
    const target = Math.max(0, Math.min(maximum, panel.offsetLeft - width * .1));
    if (scrollWindow.__lenis) scrollWindow.__lenis.scrollTo(target, { immediate: true }); else window.scrollTo(0, target);
    schedule();
  });
  listen(canvas, 'webglcontextlost', event => { event.preventDefault(); lost = true; fallback(); });
  listen(canvas, 'webglcontextrestored', () => { lost = false; dirty = true; schedule(); });
  const unsubscribe = useStudioStore.subscribe(() => { if (blocked()) pause(); else schedule(); });
  const observer = new ResizeObserver(() => { dirty = true; schedule(); }); observer.observe(wrapper); observer.observe(meta);
  void document.fonts.ready.then(() => { if (!disposed) { dirty = true; schedule(); } }); schedule();
  return () => {
    disposed = true; pause(); unsubscribe(); observer.disconnect(); listeners.forEach(remove => remove()); graphics?.dispose(); canvas.remove();
    root.style.removeProperty('height'); delete root.dataset.caseReady;
  };
}
