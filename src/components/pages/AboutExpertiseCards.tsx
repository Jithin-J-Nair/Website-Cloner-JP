"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { LUSION_ABOUT } from "@/data/reference";
import { expertiseCardPose, expertiseHeadingPose } from "@/lib/about-expertise-motion";
import { soundEngine } from "@/lib/audio";

function CapabilityGlyph({ index }: { index: number }) {
  const paths = [
    "M3 0h15v6H9v3h9v12H0v-6h9v-3H3Z",
    "M6 0h12v6H6v9h12v6H6v-6H0V6h6Z",
    "M0 0h18v6h-6v15H6V6H0Z",
    "M0 0h12v3h6v9h-6v3H6v6H0Zm6 6v3h6V6Z",
  ];
  return <svg aria-hidden="true" viewBox="0 0 18 21" className="about-card-glyph"><path fill="currentColor" fillRule="evenodd" d={paths[index]} /></svg>;
}

/** Archived About card artwork, delivered only through the About allowlist. */
function CardBack() {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className="about-card-back-art" src="/about/scene/card-back.png" width={628} height={876} alt="" aria-hidden="true" />;
}

export function AboutExpertiseCards({ sectionRef, reducedMotion }: {
  sectionRef: RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}) {
  const headingRef = useRef<HTMLDivElement>(null);
  const flourishRef = useRef<SVGSVGElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const flipRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const cards = LUSION_ABOUT.capability.cards;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const desktop = window.matchMedia("(min-width: 1000px) and (min-height: 650px)");
    let raf = 0, disposed = false, dirty = true, top = 0, range = 1, previous = -1;
    const render = () => {
      raf = 0;
      if (disposed || document.hidden) return;
      if (dirty) {
        top = section.getBoundingClientRect().top + window.scrollY;
        range = Math.max(1, section.offsetHeight - window.innerHeight);
        previous = -1;
        dirty = false;
      }
      const cinematic = desktop.matches && !reducedMotion;
      const p = cinematic ? Math.max(0, Math.min(1, (window.scrollY - top) / range)) : 1;
      if (p === previous) return;
      previous = p;
      section.dataset.cardProgress = p.toFixed(4);
      section.dataset.cardLayout = cinematic ? "cinematic" : "reading";
      const heading = expertiseHeadingPose(p);
      if (headingRef.current) {
        headingRef.current.style.transform = cinematic ? `translate3d(0,${heading.yVh + 7 * (1 - Math.min(1, p / .22))}vh,0)` : "";
        headingRef.current.style.opacity = cinematic ? String(heading.opacity) : "1";
        headingRef.current.style.pointerEvents = cinematic && heading.opacity < .01 ? "none" : "";
        headingRef.current.querySelectorAll("button").forEach(button => { button.tabIndex = cinematic && heading.opacity < .01 ? -1 : 0; });
      }
      if (flourishRef.current) {
        const enter = Math.max(0, Math.min(1, (p - .08) / .14));
        const exit = Math.max(0, Math.min(1, (p - .68) / .2));
        flourishRef.current.style.opacity = String(enter * (1 - exit));
        flourishRef.current.style.transform = `translate3d(${exit * 25}vw,${exit * -55}vh,0) rotate(${p * -12}deg)`;
      }
      cards.forEach((_, i) => {
        const pose = expertiseCardPose(p, i), slot = slotRefs.current[i], flip = flipRefs.current[i];
        if (slot) {
          slot.style.transform = cinematic
            ? `translate3d(${pose.xVw}vw,calc(-50% + ${pose.dropVh}vh),${pose.z}px) rotateZ(${pose.roll}deg) rotateY(${pose.yaw}deg) rotateX(${pose.pitch}deg) scale(${pose.scale})`
            : "";
          slot.style.opacity = String(pose.opacity);
        }
        if (flip) flip.style.transform = `rotateY(${pose.flip}deg)`;
      });
    };
    const schedule = () => { if (!disposed && !raf && !document.hidden) raf = requestAnimationFrame(render); };
    const reflow = () => { dirty = true; schedule(); };
    const visibility = () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; } else reflow(); };
    const observer = new ResizeObserver(reflow);
    observer.observe(section);
    // An upstream WebGL fallback (or late content) can move this section
    // without changing its own size. Observe the page's flow height as well.
    const page = section.closest("main");
    if (page) observer.observe(page);
    document.fonts.ready.then(() => { if (!disposed) reflow(); });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", reflow, { passive: true });
    desktop.addEventListener("change", reflow);
    document.addEventListener("visibilitychange", visibility);
    schedule();
    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", reflow);
      desktop.removeEventListener("change", reflow);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, [cards, reducedMotion, sectionRef]);

  const readCard = (index: number, focus = false) => {
    setActive(index);
    const section = sectionRef.current;
    if (section?.dataset.cardLayout === "cinematic" && Number(section.dataset.cardProgress) < .85) {
      const y = section.getBoundingClientRect().top + window.scrollY + (section.offsetHeight - window.innerHeight) * .88;
      const driver = (window as unknown as { __lenis?: { scrollTo: (y: number, options: { immediate: boolean }) => void } }).__lenis;
      if (driver) driver.scrollTo(y, { immediate: true });
      window.scrollTo({ top: y, behavior: "instant" });
    }
    if (focus) cardRefs.current[index]?.focus({ preventScroll: true });
  };

  return (
    <section id="about-capability" ref={sectionRef} className="about-playing-expertise" data-reduced={reducedMotion} aria-labelledby="about-expertise-heading">
      <div className="about-expertise-stage">
        <svg width="0" height="0" aria-hidden="true" className="absolute"><defs>
          <filter id="about-card-back-colors" colorInterpolationFilters="sRGB">
            <feColorMatrix type="matrix" values=".913 0 .087 0 0  0 .93 .07 0 0  .105 0 .895 0 0  0 0 0 1 0" />
          </filter>
        </defs></svg>
        <svg ref={flourishRef} className="about-expertise-flourish" viewBox="0 0 1440 900" preserveAspectRatio="none" fill="none" aria-hidden="true">
          <path d="M390 510C690 510 1220 240 1150 -120" stroke="currentColor" strokeWidth="24" strokeLinecap="round" />
        </svg>
        {/* The overlapping editorial heading is not a hit target; keep the
            actual controls interactive without masking the cards underneath. */}
        <div ref={headingRef} className="about-expertise-heading pointer-events-none">
          <h2 id="about-expertise-heading"><span>AREA OF</span><span>EXPERTISE</span></h2>
          <div className="about-expertise-caption">
            <p>{LUSION_ABOUT.capability.subtitle}</p>
            <div className="about-expertise-controls pointer-events-auto" aria-label="Expertise areas">
              {cards.map((card, i) => <button key={card.title} type="button" aria-label={`Focus ${card.title}`} aria-controls={`expertise-${i}`} aria-pressed={active === i} onClick={() => { soundEngine.playClick(); readCard(i, true); }}><CapabilityGlyph index={i} /></button>)}
            </div>
          </div>
        </div>
        <div className="about-playing-cards">
          {cards.map((card, i) => <div key={card.title} ref={el => { slotRefs.current[i] = el; }} className="about-card-slot">
            <div
              id={`expertise-${i}`}
              ref={el => { cardRefs.current[i] = el; }}
              className="about-service-card"
              role="button"
              tabIndex={0}
              aria-label={`${card.title} expertise`}
              aria-describedby={`expertise-services-${i}`}
              aria-pressed={active === i}
              onFocus={() => readCard(i)}
              onClick={() => { soundEngine.playClick(); readCard(i); }}
              onKeyDown={event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); soundEngine.playClick(); readCard(i); } }}
              onPointerMove={event => {
                if (reducedMotion || event.pointerType === "touch" || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
                const bounds = event.currentTarget.getBoundingClientRect();
                const x = Math.max(-1, Math.min(1, (event.clientX - bounds.left) / bounds.width * 2 - 1));
                const y = Math.max(-1, Math.min(1, (event.clientY - bounds.top) / bounds.height * 2 - 1));
                event.currentTarget.style.transform = `perspective(900px) rotateX(${-y * 2}deg) rotateY(${x * 2}deg)`;
              }}
              onPointerLeave={event => { event.currentTarget.style.transform = ""; }}
              onPointerCancel={event => { event.currentTarget.style.transform = ""; }}
              onBlur={event => { event.currentTarget.style.transform = ""; }}
            >
              <div ref={el => { flipRefs.current[i] = el; }} className="about-card-flip">
                <div className="about-card-face about-card-front">
                  <div className="about-card-corner"><h3>{card.title}</h3><CapabilityGlyph index={i} /></div>
                  <ul id={`expertise-services-${i}`}>{card.items.map(item => <li key={item}>{item}</li>)}</ul>
                  <div className="about-card-corner about-card-corner-inverted" aria-hidden="true"><span>{card.title}</span><CapabilityGlyph index={i} /></div>
                </div>
                <div className="about-card-face about-card-back"><CardBack /></div>
              </div>
            </div>
          </div>)}
        </div>
      </div>
    </section>
  );
}
