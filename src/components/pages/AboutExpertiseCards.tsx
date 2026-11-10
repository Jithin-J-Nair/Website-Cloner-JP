"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { LUSION_ABOUT } from "@/data/reference";
import { createAboutExpertiseMotion } from "./AboutExpertiseMotion";
import "./about-expertise.css";
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

/** Keep the captured linework; replace only the old center mark. */
function CardBack({ index }: { index: number }) {
  const marks = ["ジ", "テ", "ィ", "ン"] as const;
  return <>
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img className="about-card-back-art" src="/sites/jithin/expertise-card-back.png" width={628} height={876} alt="" aria-hidden="true" />
    <svg className="about-card-back-mark" viewBox="0 0 628 876" aria-hidden="true" focusable="false">
      <text x="314" y="438" textAnchor="middle" dominantBaseline="central">{marks[index]}</text>
    </svg>
  </>;
}

export function AboutExpertiseCards({ sectionRef, reducedMotion }: {
  sectionRef: RefObject<HTMLElement | null>;
  reducedMotion: boolean;
}) {
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [active, setActive] = useState(0);
  const cards = LUSION_ABOUT.capability.cards;

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    return createAboutExpertiseMotion(section, reducedMotion);
  }, [reducedMotion, sectionRef]);

  const readCard = (index: number, focus = false) => {
    setActive(index);
    const section = sectionRef.current;
    if (section?.dataset.cardLayout === "native") {
      const y = section.getBoundingClientRect().top + window.scrollY + (section.offsetHeight + window.innerHeight) * .675 - window.innerHeight;
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
        <div className="about-expertise-lines" aria-hidden="true"><canvas id="about-expertise-lines-canvas" /></div>
        {/* The overlapping editorial heading is not a hit target; keep the
            actual controls interactive without masking the cards underneath. */}
        <div className="about-expertise-heading pointer-events-none">
          <h2 id="about-expertise-heading"><span className="about-expertise-title-clip"><span data-expertise-title-word>AREA</span>{" "}<span data-expertise-title-word>OF</span></span><span className="about-expertise-title-clip"><span data-expertise-title-word>EXPERTISE</span></span></h2>
          <div className="about-expertise-caption">
            <p>{LUSION_ABOUT.capability.subtitle}</p>
            <div className="about-expertise-controls pointer-events-auto" aria-label="Expertise areas">
              {cards.map((card, i) => <button key={card.title} type="button" aria-label={`Focus ${card.title}`} aria-controls={`expertise-${i}`} aria-pressed={active === i} onClick={() => { soundEngine.playClick(); readCard(i, true); }}><CapabilityGlyph index={i} /></button>)}
            </div>
          </div>
        </div>
        <div className="about-expertise-cards-wrapper"><div className="about-playing-cards">
          {cards.map((card, i) => <div key={card.title} className="about-card-slot">
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
              onBlur={event => { event.currentTarget.style.transform = ""; }}
            >
              <div className="about-card-flip">
                <div className="about-card-face about-card-front">
                  <div className="about-card-corner"><h3>{card.title}</h3><CapabilityGlyph index={i} /></div>
                  <ul id={`expertise-services-${i}`}>{card.items.map(item => <li key={item}>{item}</li>)}</ul>
                  <div className="about-card-corner about-card-corner-inverted" aria-hidden="true"><span>{card.title}</span><CapabilityGlyph index={i} /></div>
                </div>
                <div className="about-card-face about-card-back"><CardBack index={i} /></div>
              </div>
            </div>
          </div>)}
        </div></div>
      </div>
    </section>
  );
}
