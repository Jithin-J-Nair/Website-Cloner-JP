import { AWARDS } from "./data";

export function Awards() {
  return (
    <section className="awards band" aria-label="Recognition">
      <ul className="awards__row container">
        {AWARDS.map((award) => (
          <li className="award" data-reveal key={award.name}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={award.image} width={60} height={60} alt="" />
            <div>
              <p className="award__name">{award.name}</p>
              <p className="muted">{award.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
