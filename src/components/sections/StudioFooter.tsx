"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import {
  LUSION_ABOUT,
  LUSION_GLOBAL_CHROME,
  LUSION_HOME,
  LUSION_PROJECTS_ARCHIVE,
} from "@/data/reference";

interface StudioFooterProps {
  nextHref?: string;
  nextLabel?: string;
}

function DiagonalSocialArrow() {
  return (
    <svg
      className="footer-socials-line-svg h-[1.15em] w-[1.15em] shrink-0 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M6.948 18.113a.75.75 0 0 1-1.06-1.06l9.885-9.886H8.65a.75.75 0 1 1 0-1.5h9.682v9.682a.75.75 0 0 1-1.5 0v-7.12l-9.884 9.884Z"
        fill="#000000"
      />
    </svg>
  );
}

/**
 * Shared Lusion Footer (`#footer-section`) & Next-Page Portal (`#scroll-nav-section`)
 *
 * Reconstructs the verified `#ffffff` 12-column Lusion studio footer (`Suite 2,
 * 9 Marsh Street, Bristol, BS1 4AA, United Kingdom`, `Twitter / X`, `Instagram`,
 * `Linkedin`, `hello@lusion.co`, `business@lusion.co`, `Subscribe to our newsletter`,
 * `©2026 LUSION Creative Studio`, `R&D: labs.lusion.co`, `Built by Lusion with ❤️`,
 * circular `#000000` `↑` scroll-up control) followed by the `#121416` dark
 * `#scroll-nav-section` chapter portal with `#c1ff00` wheel-overscroll bar.
 */
export function StudioFooter({
  nextHref = "/about",
  nextLabel = "About Us",
}: StudioFooterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const setTransition = useStudioStore((s) => s.setTransition);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "saved">("idle");

  const footerRef = useRef<HTMLElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
  const chargeBarRef = useRef<HTMLSpanElement>(null);
  const triggeredRef = useRef(false);

  // Switch header ink back to crisp `#000000` black whenever white `#footer-section` enters view
  useEffect(() => {
    const el = footerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setActiveSurface("ice");
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [setActiveSurface]);

  // Use canonical Lusion scroll-nav destinations for `/`, `/about`, and `/projects`
  const resolvedPortal = useMemo(() => {
    if (pathname === "/") {
      return {
        targetPath: "/about",
        label: LUSION_HOME.scrollNav.targetTitle,
      };
    }
    if (pathname === "/about") {
      return {
        targetPath: "/projects",
        label: LUSION_ABOUT.scrollNav.targetTitle,
      };
    }
    if (pathname === "/projects" || pathname === "/work") {
      return {
        targetPath: "/",
        label: LUSION_PROJECTS_ARCHIVE.scrollNav.targetTitle,
      };
    }
    return { targetPath: nextHref, label: nextLabel };
  }, [nextHref, nextLabel, pathname]);

  const navigateNextChapter = useCallback(() => {
    if (triggeredRef.current) return;
    triggeredRef.current = true;
    soundEngine.playTransitionWhoosh();

    if (reducedMotion) {
      router.push(resolvedPortal.targetPath);
      window.setTimeout(() => {
        triggeredRef.current = false;
      }, 600);
      return;
    }

    setTransition(true, resolvedPortal.label);
    window.setTimeout(() => {
      router.push(resolvedPortal.targetPath);
      window.setTimeout(() => {
        setTransition(false, "");
        triggeredRef.current = false;
      }, 420);
    }, 260);
  }, [reducedMotion, resolvedPortal.label, resolvedPortal.targetPath, router, setTransition]);

  // Bottom overscroll progress bar (`#scroll-nav-next-bar-inner`, zero-rerender DOM update)
  useEffect(() => {
    let charge = 0.5;
    if (chargeBarRef.current) {
      chargeBarRef.current.style.transform = "scaleX(0.500)";
    }
    if (reducedMotion) return;

    let decayTimer = 0;
    const onWheel = (e: WheelEvent) => {
      const el = portalRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const atBottom = rect.bottom <= window.innerHeight + 36;
      if (atBottom && e.deltaY > 0) {
        charge = Math.min(1, charge + Math.min(0.2, e.deltaY * 0.0014));
        if (chargeBarRef.current) {
          chargeBarRef.current.style.transform = `scaleX(${charge.toFixed(3)})`;
        }
        if (charge >= 0.995) {
          navigateNextChapter();
        }
        window.clearTimeout(decayTimer);
        decayTimer = window.setTimeout(() => {
          charge = 0.5;
          if (chargeBarRef.current) {
            chargeBarRef.current.style.transform = "scaleX(0.500)";
          }
        }, 460);
      }
    };

    window.addEventListener("wheel", onWheel, { passive: true });
    return () => {
      window.removeEventListener("wheel", onWheel);
      window.clearTimeout(decayTimer);
    };
  }, [navigateNextChapter, pathname, reducedMotion]);

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setStatus("error");
      return;
    }
    soundEngine.playClick();
    setStatus("saved");
    setEmail("");
  };

  const scrollToTop = () => {
    soundEngine.playClick();
    window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" });
  };

  return (
    <>
      {/* 1. Shared Crisp White Lusion Studio Footer (`#footer-section`) */}
      <footer
        id="footer-section"
        ref={footerRef}
        className="relative z-10 flex min-h-[calc(100vh-215px)] flex-col justify-between bg-[#ffffff] px-[var(--base-padding-x)] pt-28 pb-12 text-[clamp(0.875rem,1vw,1.15rem)] text-[#000000] md:pt-28 md:pb-14"
      >
        {/* Subtle Curved Top Edge Crest (`#footer-bg`) */}
        <div
          id="footer-bg"
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 -top-5 h-6 rounded-t-[24px] bg-[#ffffff]"
        />

        {/* Middle 12-Column Grid (`#footer-middle`) */}
        <div
          id="footer-middle"
          className="relative z-10 grid grid-cols-6 gap-x-[var(--grid-gap)] gap-y-14 min-[1001px]:grid-cols-12"
        >
          {/* Left 6 Columns (`#footer-middle-contact`, rendered second on mobile `<= 1000px`) */}
          <div
            id="footer-middle-contact"
            className="col-span-6 grid grid-cols-6 gap-x-[var(--grid-gap)] gap-y-10 text-[1.15em] max-[1000px]:order-2"
          >
            {/* Studio Address (`#footer-contact-address`) */}
            <a
              id="footer-contact-address"
              href={LUSION_GLOBAL_CHROME.footer.addressHref}
              target="_blank"
              rel="noopener noreferrer"
              className="group col-span-3 w-fit leading-[1.45] transition-opacity hover:opacity-70"
            >
              {LUSION_GLOBAL_CHROME.footer.addressLines.map((line) => (
                <div key={line} className="footer-address-line">
                  {line}
                </div>
              ))}
            </a>

            {/* Social Links (`#footer-contact-socials`) */}
            <div id="footer-contact-socials" className="col-span-3 flex flex-col gap-1">
              {LUSION_GLOBAL_CHROME.footer.socials.map((s, idx) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-socials-line group inline-flex w-fit items-center gap-2 leading-[1.4]"
                >
                  {idx === 0 ? (
                    <DiagonalSocialArrow />
                  ) : (
                    <span aria-hidden="true" className="h-[1.15em] w-[1.15em] shrink-0" />
                  )}
                  <span className="footer-socials-text">{s.label}</span>
                </a>
              ))}
            </div>

            {/* General Enquiries (`#footer-contact-enquires`) */}
            <div
              id="footer-contact-enquires"
              className="col-span-3 min-[1001px]:col-start-4"
            >
              <div className="mb-0.5 text-black">{LUSION_GLOBAL_CHROME.footer.enquiriesHeading}</div>
              <a
                id="footer-enquires-link"
                href={LUSION_GLOBAL_CHROME.footer.enquiriesHref}
                className="group relative inline-block pb-1"
              >
                <span>{LUSION_GLOBAL_CHROME.footer.enquiriesEmail}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[1.5px] origin-left scale-x-0 bg-black transition-transform duration-300 ease-[cubic-bezier(0.35,0,0,1)] group-hover:scale-x-100"
                />
              </a>
            </div>

            {/* New Business (`#footer-contact-business`) */}
            <div
              id="footer-contact-business"
              className="col-span-3 min-[1001px]:col-start-4"
            >
              <div className="mb-0.5 text-black">{LUSION_GLOBAL_CHROME.footer.businessHeading}</div>
              <a
                id="footer-business-link"
                href={LUSION_GLOBAL_CHROME.footer.businessHref}
                className="group relative inline-block pb-1"
              >
                <span>{LUSION_GLOBAL_CHROME.footer.businessEmail}</span>
                <span
                  aria-hidden="true"
                  className="absolute inset-x-0 bottom-0 h-[1.5px] origin-left scale-x-0 bg-black transition-transform duration-300 ease-[cubic-bezier(0.35,0,0,1)] group-hover:scale-x-100"
                />
              </a>
            </div>
          </div>

          {/* Right 6 Columns (`#footer-middle-newsletter`, first on mobile `<= 1000px`) */}
          <div id="footer-middle-newsletter" className="col-span-6 max-[1000px]:order-1">
            <h2
              id="footer-newsletter-header"
              className="font-sans text-[clamp(2.1rem,3.375vw,3.5rem)] leading-[1.06] font-normal tracking-[-0.02em] text-black"
            >
              Subscribe to
              <br />
              our newsletter
            </h2>

            <form
              id="footer-newsletter-form"
              onSubmit={handleNewsletterSubmit}
              noValidate
              className="mt-7 max-w-[33.75rem]"
            >
              <div
                id="footer-newsletter-input"
                className="relative flex h-[4.15rem] items-center rounded-[1.125rem] bg-[#f0f1fa]"
              >
                <label htmlFor="footer-newsletter-input-field" className="sr-only">
                  Your email
                </label>
                <input
                  id="footer-newsletter-input-field"
                  type="email"
                  name="EMAIL"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== "idle") setStatus("idle");
                  }}
                  placeholder="Your email"
                  className="h-full w-full rounded-[1.125rem] bg-transparent pr-14 pl-5 text-[1.15em] text-black placeholder:text-black/35 focus:outline-2 focus:outline-[#1a2ffb]"
                />
                <button
                  id="footer-newsletter-input-arrow"
                  type="submit"
                  aria-label="Submit newsletter email"
                  className="absolute right-5 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-black transition-transform hover:translate-x-0.5"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M1.9999 11.9998C1.9999 12.552 2.44762 12.9997 2.9999 12.9997H18.9757C18.8901 13.148 18.7838 13.2876 18.657 13.4144L12.2931 19.7784C11.9025 20.1689 11.9025 20.8021 12.2931 21.1926C12.6836 21.5831 13.3168 21.5831 13.7073 21.1926L22.1926 12.7073C22.5831 12.3168 22.5831 11.6836 22.1926 11.2931L22.1924 11.293L13.7071 2.80767C13.3166 2.41715 12.6834 2.41715 12.2929 2.80767C11.9024 3.1982 11.9024 3.83136 12.2929 4.22189L18.657 10.586C18.7836 10.7126 18.8896 10.8518 18.9752 10.9998H2.9999C2.44762 10.9997 1.9999 11.4475 1.9999 11.9998Z"
                      fill="#000000"
                    />
                  </svg>
                </button>
              </div>

              {status === "error" && (
                <p
                  id="footer-newsletter-feedback-message"
                  role="alert"
                  className="mt-2.5 text-sm text-[#e90000]"
                >
                  Please enter a valid email address.
                </p>
              )}
              {status === "saved" && (
                <p
                  id="footer-newsletter-feedback-message"
                  role="status"
                  className="mt-2.5 text-sm text-[#1a2ffb]"
                >
                  Saved locally (static reconstruction — write hello@lusion.co for studio dispatch).
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Bottom 12-Column Row (`#footer-bottom`) */}
        <div
          id="footer-bottom"
          className="relative z-10 mt-12 grid grid-cols-6 items-center gap-x-[var(--grid-gap)] gap-y-5 pr-16 min-[1001px]:mt-14 min-[1001px]:grid-cols-12"
        >
          <div
            id="footer-bottom-copyright"
            className="col-span-6 text-[0.95em] max-[1000px]:order-3 min-[1001px]:col-span-6"
          >
            {LUSION_GLOBAL_CHROME.footer.copyright}
          </div>

          <a
            id="footer-bottom-labs"
            href={LUSION_GLOBAL_CHROME.footer.labsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="group relative col-span-6 w-fit pb-0.5 text-[0.95em] max-[1000px]:order-1 min-[1001px]:col-span-3"
          >
            <span>{LUSION_GLOBAL_CHROME.footer.labsText}</span>
            <span
              aria-hidden="true"
              className="absolute inset-x-0 bottom-0 h-[1.5px] origin-left scale-x-0 bg-black transition-transform duration-300 ease-[cubic-bezier(0.35,0,0,1)] group-hover:scale-x-100"
            />
          </a>

          <div
            id="footer-bottom-tagline"
            className="col-span-6 inline-flex items-center gap-1.5 text-[0.95em] max-[1000px]:order-2 min-[1001px]:col-span-3"
          >
            <span>Built by Lusion with</span>
            <span className="sr-only">❤️</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="#ff4c41"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="inline-block shrink-0"
            >
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </div>

          {/* Circular Black Scroll-To-Top Button (`#footer-bottom-up`) */}
          <button
            id="footer-bottom-up"
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="group absolute right-0 bottom-0 flex h-[3.5em] w-[3.5em] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#000000] text-white transition-transform duration-300 hover:scale-105"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-[1.35em] w-[1.35em] transition-transform duration-300 ease-[cubic-bezier(0.35,0,0,1)] group-hover:-translate-y-8"
            >
              <path
                d="M12 19V5M12 5L5.5 11.5M12 5L18.5 11.5"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="absolute h-[1.35em] w-[1.35em] translate-y-8 transition-transform duration-300 ease-[cubic-bezier(0.35,0,0,1)] group-hover:translate-y-0"
            >
              <path
                d="M12 19V5M12 5L5.5 11.5M12 5L18.5 11.5"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>
      </footer>

      {/* 2. Bottom Overscroll Next-Page Portal (`#scroll-nav-section`, `#121416` slate) */}
      <div
        id="scroll-nav-section"
        ref={portalRef}
        data-path={resolvedPortal.targetPath}
        className="relative z-10 block bg-[#121416] px-[var(--base-padding-x)] py-10 text-[clamp(0.875rem,1vw,1.25rem)] text-white"
      >
        <div id="scroll-nav-content" className="uppercase">
          <div id="scroll-nav-subtitle" className="text-[0.85em] leading-[1.35] text-white/80">
            Keep Scrolling
            <br />
            to Learn More
          </div>

          <div
            id="scroll-nav-main"
            className="relative flex flex-col justify-between gap-5 py-7 min-[813px]:flex-row min-[813px]:items-center"
          >
            <button
              type="button"
              id="scroll-nav-text"
              onClick={navigateNextChapter}
              onMouseEnter={() => soundEngine.playHover()}
              className="w-fit cursor-pointer text-left font-sans text-[clamp(2.25rem,3.6vw,3.75rem)] leading-none font-normal tracking-[-0.02em] text-white uppercase transition-colors hover:text-[#c1ff00]"
            >
              {resolvedPortal.label}
            </button>

            <button
              type="button"
              id="scroll-nav-next"
              onClick={navigateNextChapter}
              aria-label={`Next page: ${resolvedPortal.label}`}
              className="flex min-w-[210px] cursor-pointer items-center gap-3 text-[0.85em] leading-none uppercase min-[813px]:w-[22%]"
            >
              <span id="scroll-nav-next-text" className="whitespace-nowrap">
                Next Page
              </span>
              <span
                id="scroll-nav-next-bar"
                className="relative h-[4px] flex-1 overflow-hidden bg-[#34393f]"
              >
                <span
                  id="scroll-nav-next-bar-inner"
                  ref={chargeBarRef}
                  style={{ transform: "scaleX(0.500)" }}
                  className="block h-full w-full origin-left bg-[#c1ff00] transition-transform duration-150"
                />
              </span>
              <span id="scroll-nav-next-arrow" aria-hidden="true" className="h-[1.2em] w-[1.2em] shrink-0">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M1.9999 11.9998C1.9999 12.552 2.44762 12.9997 2.9999 12.9997H18.9757C18.8901 13.148 18.7838 13.2876 18.657 13.4144L12.2931 19.7784C11.9025 20.1689 11.9025 20.8021 12.2931 21.1926C12.6836 21.5831 13.3168 21.5831 13.7073 21.1926L22.1926 12.7073C22.5831 12.3168 22.5831 11.6836 22.1926 11.2931L22.1924 11.293L13.7071 2.80767C13.3166 2.41715 12.6834 2.41715 12.2929 2.80767C11.9024 3.1982 11.9024 3.83136 12.2929 4.22189L18.657 10.586C18.7836 10.7126 18.8896 10.8518 18.9752 10.9998H2.9999C2.44762 10.9997 1.9999 11.4475 1.9999 11.9998Z"
                    fill="#FFFFFF"
                  />
                </svg>
              </span>
            </button>
          </div>

          <div
            id="scroll-nav-cross-line"
            aria-hidden="true"
            className="flex items-center justify-between pt-2 text-white/60 max-[812px]:hidden"
          >
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
            <span className="lusion-plus-cross" />
          </div>
        </div>
      </div>
    </>
  );
}
