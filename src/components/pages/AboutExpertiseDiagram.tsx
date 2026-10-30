import React from "react";

/** Original technical line studies. Not reference artwork or generic feature icons. */
export function AboutExpertiseDiagram({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 320 280" aria-hidden="true" className="about-expertise-diagram h-auto w-full overflow-visible" fill="none" stroke="currentColor" strokeWidth="0.8">
      <g opacity=".28">
        <path d="M0 140H320M160 10V270" strokeDasharray="2 7" />
        {[20, 300].map(x => <path key={x} d={`M${x - 5} 140h10M${x} 135v10`} />)}
        <circle cx="160" cy="140" r="113" strokeDasharray="1 8" />
      </g>
      <g data-expertise-plane>
        {index === 0 && <>
          {[0, 30, 60, 90, 120, 150].map(angle => <ellipse key={angle} cx="160" cy="140" rx="98" ry="39" transform={`rotate(${angle} 160 140)`} opacity={angle % 60 === 0 ? 1 : .42} />)}
          {[35, 63, 97].map(r => <circle key={r} cx="160" cy="140" r={r} opacity=".7" />)}
          <path d="M40 240L280 40M40 40L280 240M53 245H267M53 240v10M267 240v10" opacity=".5" />
        </>}
        {index === 1 && <>
          {Array.from({ length: 19 }, (_, i) => {
            const y = 48 + i * 9;
            return <path key={i} d={`M36 ${y}C105 ${y - 95} 108 ${280 - y} 160 ${270 - y}S238 ${y + 120} 284 ${y - 30}`} opacity={.35 + i / 30} />;
          })}
          <path d="M36 48L36 210M284 18V180M32 48h8M32 210h8M280 18h8M280 180h8" />
        </>}
        {index === 2 && <>
          {[0, 1, 2, 3, 4].map(layer => <g key={layer} transform={`translate(0 ${layer * 32})`} opacity={.35 + layer * .15}>
            <path d="M160 26L283 77L160 128L37 77Z" />
            {Array.from({ length: 7 }, (_, i) => <path key={i} d={`M${52 + i * 15.4} ${70.8 - i * 6.4}l123 51M${52 + i * 15.4} ${83.2 + i * 6.4}l123 -51`} opacity=".5" />)}
          </g>)}
          <path d="M37 77V205M283 77V205M160 26V154" strokeDasharray="3 5" />
        </>}
        {index === 3 && <>
          {[0, 1, 2].map(layer => <g key={layer} transform={`translate(0 ${layer * 63})`} opacity={.5 + layer * .25}>
            <path d="M160 24L248 68L160 112L72 68Z M72 68V89L160 133L248 89V68M160 112V133" />
            <path d="M101 53L189 97M130 39L218 83M101 83L189 39M130 97L218 53" opacity=".6" />
          </g>)}
          <path d="M72 68V215M248 68V215M160 24V260" strokeDasharray="2 5" opacity=".4" />
        </>}
      </g>
    </svg>
  );
}
