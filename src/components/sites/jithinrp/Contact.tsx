import { CONTACT } from "./data";

export function Contact() {
  return (
    <section id="contact" className="contact band" aria-labelledby="contact-title">
      <div className="container contact__inner">
        <h2 id="contact-title" className="display">
          <span className="lline" data-condense>
              {CONTACT.title}
          </span>
        </h2>
        <p className="contact__sub" data-reveal>
          {CONTACT.sub}
        </p>
        <div className="contact__links" data-reveal>
          {CONTACT.links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener" : undefined}
              aria-label={link.label === "Resume" ? "Download resume (PDF)" : undefined}
              data-cursor-pill={"pill" in link ? link.pill : undefined}
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
