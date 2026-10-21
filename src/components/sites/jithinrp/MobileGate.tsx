import { SITE_LINKS } from "./data";
import { Signature } from "./Signature";

/**
 * Phones get the note instead of the site, exactly as on the reference
 * (Figma "Switch to desktop"): brand, message, and LinkedIn / Resume / Email.
 */
export function MobileGate() {
  return (
    <div className="mobile-gate">
      <span className="nav__brand mobile-gate__brand">
        <Signature />
      </span>
      <div className="mobile-gate__body">
        <h1 className="mobile-gate__title">
          Hey Mate,
          <br />
          9 years of work deserves a little more screen space. 🙂
        </h1>
        <p className="mobile-gate__sub">For the best experience, open this on a desktop.</p>
      </div>
      <nav className="mobile-gate__links" aria-label="Contact">
        <a href={SITE_LINKS.linkedin} target="_blank" rel="noopener">
          LinkedIn
        </a>
        <a href={SITE_LINKS.resume} rel="noopener" aria-label="Download resume (PDF)">
          Resume
        </a>
        <a href={SITE_LINKS.email}>Email</a>
      </nav>
    </div>
  );
}
