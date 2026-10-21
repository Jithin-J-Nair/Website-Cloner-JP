import { PILLARS } from "./data";

export function Pillars() {
  return (
    <section className="pillars band" aria-label="What I do">
      <div className="pillars__grid container">
        {PILLARS.map((pillar) => (
          <article className="pillar" data-reveal key={pillar.title}>
            {pillar.tiled ? (
              <span className="pillar__icon pillar__icon--tile">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pillar.icon} width={24} height={24} alt="" />
              </span>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img className="pillar__icon" src={pillar.icon} width={56} height={56} alt="" />
            )}
            <div>
              <h2 className="pillar__title">{pillar.title}</h2>
              <p className="pillar__body">{pillar.body}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
