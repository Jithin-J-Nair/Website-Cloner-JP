"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { TransitionLink } from "@/components/studio/TransitionLink";
import { useStudioStore, type ProjectThemeConfig } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { LUSION_GLOBAL_CHROME, LUSION_PROJECT_DETAILS } from "@/data/reference";

declare global {
  interface Window {
    __enableJourneyAudioProbe?: boolean;
    __journeyAudioProbe?: () => ReturnType<typeof soundEngine.snapshot>;
  }
}

const PROJECT_THEME_MAP = new Map<string, ProjectThemeConfig>(
  LUSION_PROJECT_DETAILS.map((p) => [
    p.id,
    {
      slug: p.id,
      bg: p.theme.colorBg || "#000000",
      highlight: p.theme.colorHighlight || "#ffffff",
      btnBg: p.theme.colorBtnBg || "#ffffff",
      btnText: p.theme.colorBtnText || "#000000",
      btnBgHover: p.theme.colorBtnBgHover || p.theme.colorHighlight || "#1a2ffb",
      btnTextHover: p.theme.colorBtnTextHover || "#ffffff",
    },
  ])
);

function MenuDiagonalArrow({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
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
        d="M7.58991 6.75C7.1757 6.75 6.83991 6.41421 6.83991 6C6.83991 5.58579 7.1757 5.25 7.58991 5.25L17.9999 5.25C18.0987 5.25 18.1947 5.26905 18.2831 5.30495C18.374 5.34189 18.4581 5.39649 18.5302 5.46867C18.6001 5.53852 18.6536 5.61977 18.6904 5.70736C18.7289 5.79871 18.7499 5.89811 18.7499 6.00051L18.7499 16.41C18.7499 16.8242 18.4141 17.16 17.9999 17.16C17.5857 17.16 17.2499 16.8242 17.2499 16.41L17.2499 7.81066L6.53024 18.5303C6.23735 18.8232 5.76247 18.8232 5.46958 18.5303C5.17669 18.2374 5.17669 17.7626 5.46958 17.4697L16.1892 6.75L7.58991 6.75Z"
        fill="currentColor"
      />
    </svg>
  );
}

function RightArrowSvg({ fill = "currentColor" }: { fill?: string }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1.9999 11.9998C1.9999 12.552 2.44762 12.9997 2.9999 12.9997H18.9757C18.8901 13.148 18.7838 13.2876 18.657 13.4144L12.2931 19.7784C11.9025 20.1689 11.9025 20.8021 12.2931 21.1926C12.6836 21.5831 13.3168 21.5831 13.7073 21.1926L22.1926 12.7073C22.5831 12.3168 22.5831 11.6836 22.1926 11.2931L22.1924 11.293L13.7071 2.80767C13.3166 2.41715 12.6834 2.41715 12.2929 2.80767C11.9024 3.1982 11.9024 3.83136 12.2929 4.22189L18.657 10.586C18.7836 10.7126 18.8896 10.8518 18.9752 10.9998H2.9999C2.44762 10.9997 1.9999 11.4475 1.9999 11.9998Z"
        fill={fill}
      />
    </svg>
  );
}

/**
 * Shared Lusion Header, Menu Popover, Case-Study Back Control & Scroll Indicator
 * Reconstructed from verified `#header`, `#header-menu`, `#header-center-project-back-btn`,
 * and `#scroll-indicator` markup and CSS in `LUSION_GLOBAL_CHROME`.
 */
export function StudioHud() {
  const pathname = usePathname();
  const router = useRouter();

  const activeSurface = useStudioStore((s) => s.activeSurface);
  const audioEnabled = useStudioStore((s) => s.audioEnabled);
  const setAudioEnabled = useStudioStore((s) => s.setAudioEnabled);
  const [audioStatus, setAudioStatus] = useState(soundEngine.getStatus);
  const [audioStage, setAudioStage] = useState("home");
  useEffect(() => {
    const detach = soundEngine.attach();
    const sync = () => {
      setAudioStatus(soundEngine.getStatus());
      setAudioStage(soundEngine.snapshot().stage);
      setAudioEnabled(soundEngine.isEnabled());
    };
    const unsubscribe = soundEngine.subscribe(sync);
    const syncChrome = () => {
      const state = useStudioStore.getState();
      soundEngine.setOverlayPaused(state.reelOpen || state.menuOpen || state.isTransitioning);
    };
    const unsubscribeChrome = useStudioStore.subscribe(syncChrome);
    syncChrome();
    const probe = () => soundEngine.snapshot();
    if (window.__enableJourneyAudioProbe) window.__journeyAudioProbe = probe;
    sync();
    return () => {
      unsubscribe(); unsubscribeChrome(); detach(); setAudioEnabled(false);
      if (window.__journeyAudioProbe === probe) delete window.__journeyAudioProbe;
    };
  }, [setAudioEnabled]);
  const navMenuOpen = useStudioStore((s) => s.menuOpen);
  const setNavMenuOpen = useStudioStore((s) => s.setMenuOpen);
  const activeProjectTheme = useStudioStore((s) => s.activeProjectTheme);
  const setActiveProjectTheme = useStudioStore((s) => s.setActiveProjectTheme);
  const setTransition = useStudioStore((s) => s.setTransition);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  const [previewProjectSlug, setPreviewProjectSlug] = useState<string | null>(null);
  const [scrolledHeader, setScrolledHeader] = useState(false);
  const [menuEmail, setMenuEmail] = useState("");
  const [menuNewsletterStatus, setMenuNewsletterStatus] = useState<"idle" | "error" | "saved">("idle");
  const [lucyHover, setLucyHover] = useState(false);
  const [lucyEyeOffset, setLucyEyeOffset] = useState({ x: 0, y: 0 });

  const waveCanvasRef = useRef<HTMLCanvasElement>(null);
  const scrollBarRef = useRef<HTMLDivElement>(null);

  // Track vertical scroll so fixed top chrome masks underlying scrolling copy cleanly
  useEffect(() => {
    const onScroll = () => setScrolledHeader(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Read optional shell preview parameter (`?projectBack=<slug>`) without breaking static rendering
  useEffect(() => {
    const readPreviewParam = () => {
      const sp = new URLSearchParams(window.location.search);
      setPreviewProjectSlug(sp.get("projectBack"));
    };
    readPreviewParam();
    window.addEventListener("popstate", readPreviewParam);
    return () => window.removeEventListener("popstate", readPreviewParam);
  }, [pathname]);

  // Resolve active case-study route (`/projects/[slug]`, `/work/[slug]`, or `?projectBack=<slug>`)
  const resolvedProjectTheme = useMemo<ProjectThemeConfig | null>(() => {
    if (previewProjectSlug) {
      return (
        PROJECT_THEME_MAP.get(previewProjectSlug) ?? {
          slug: previewProjectSlug,
          bg: "#1a1411",
          highlight: "#dc5000",
          btnBg: "#ffffff",
          btnText: "#000000",
          btnBgHover: "#dc5000",
          btnTextHover: "#ffffff",
        }
      );
    }

    if (pathname.startsWith("/projects/")) {
      const slug = pathname.replace("/projects/", "").split("/")[0];
      if (slug) {
        return (
          PROJECT_THEME_MAP.get(slug) ?? {
            slug,
            bg: "#000000",
            highlight: "#ffffff",
            btnBg: "#ffffff",
            btnText: "#000000",
            btnBgHover: "#1a2ffb",
            btnTextHover: "#ffffff",
          }
        );
      }
    }

    if (pathname.startsWith("/work/")) {
      const slug = pathname.replace("/work/", "").split("/")[0];
      if (slug) {
        return {
          slug,
          bg: "#000000",
          highlight: "#ffffff",
          btnBg: "#ffffff",
          btnText: "#000000",
          btnBgHover: "#1a2ffb",
          btnTextHover: "#ffffff",
        };
      }
    }

    return null;
  }, [pathname, previewProjectSlug]);

  useEffect(() => {
    setActiveProjectTheme(resolvedProjectTheme);
  }, [resolvedProjectTheme, setActiveProjectTheme]);

  // Close menu on route changes & Escape key
  useEffect(() => {
    setNavMenuOpen(false);
  }, [pathname, setNavMenuOpen]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && navMenuOpen) {
        setNavMenuOpen(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [navMenuOpen, setNavMenuOpen]);

  // Sound canvas waveform renderer (`#header-right-sound-btn canvas`)
  useEffect(() => {
    const canvas = waveCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let phase = 0;
    let amp = audioEnabled ? 1 : 0;

    const draw = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const size = 40;
      if (canvas.width !== size * dpr) {
        canvas.width = size * dpr;
        canvas.height = size * dpr;
      }

      const targetAmp = audioEnabled && !reducedMotion ? 1 : 0;
      amp += (targetAmp - amp) * 0.14;
      phase += 0.12;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 1.65;
      ctx.lineCap = "round";
      ctx.beginPath();

      const startX = 11;
      const endX = 29;
      const midY = 20;
      for (let x = startX; x <= endX; x += 0.75) {
        const u = (x - startX) / (endX - startX);
        const envelope = Math.sin(u * Math.PI);
        const y = midY + Math.sin(u * Math.PI * 2.6 + phase) * 4.5 * amp * envelope;
        if (x === startX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      if (audioEnabled || Math.abs(targetAmp - amp) > 0.005) {
        rafId = window.requestAnimationFrame(draw);
      }
    };

    draw();
    return () => window.cancelAnimationFrame(rafId);
  }, [audioEnabled, reducedMotion]);

  // Right-edge scroll progress indicator (`#scroll-indicator-bar`)
  useEffect(() => {
    let rafId = 0;
    const updateScrollIndicator = () => {
      const bar = scrollBarRef.current;
      if (bar) {
        const doc = document.documentElement;
        const maxScroll = Math.max(1, doc.scrollHeight - window.innerHeight);
        const ratio = Math.min(1, Math.max(0.06, window.scrollY / maxScroll));
        bar.style.transform = `scaleY(${ratio.toFixed(4)})`;
      }
    };

    const onScroll = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(updateScrollIndicator);
    };

    updateScrollIndicator();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [pathname]);

  const toggleSound = () => {
    const next = audioStatus === "suspended" || audioStatus === "unavailable" ? true : !soundEngine.isEnabled();
    const ok = soundEngine.setEnabled(next);
    setAudioEnabled(ok);
  };

  const scrollToContactSection = useCallback(() => {
    soundEngine.playClick();
    setNavMenuOpen(false);
    const target =
      document.getElementById("end-section") ?? document.getElementById("footer-section");
    if (target) {
      target.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
      return;
    }
    window.location.href = `mailto:${LUSION_GLOBAL_CHROME.footer.enquiriesEmail}`;
  }, [reducedMotion, setNavMenuOpen]);

  const handleProjectBack = () => {
    soundEngine.playClick();
    soundEngine.playTransitionWhoosh();
    if (previewProjectSlug) {
      router.push("/");
      return;
    }
    const target = pathname.startsWith("/work/") ? "/work" : "/projects";
    if (!reducedMotion) {
      setTransition(true, "Projects");
      window.setTimeout(() => {
        router.push(target);
        window.setTimeout(() => setTransition(false, ""), 380);
      }, 240);
    } else {
      router.push(target);
    }
  };

  const handleMenuNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!menuEmail.trim() || !menuEmail.includes("@")) {
      setMenuNewsletterStatus("error");
      return;
    }
    soundEngine.playClick();
    setMenuNewsletterStatus("saved");
    setMenuEmail("");
  };

  const isDarkSurface =
    Boolean(activeProjectTheme) || activeSurface === "void" || activeSurface === "cobalt";

  const logoColorStyle: React.CSSProperties | undefined = activeProjectTheme
    ? { color: activeProjectTheme.highlight }
    : navMenuOpen
      ? undefined
      : { color: isDarkSurface ? "#ffffff" : "#000000" };

  return (
    <>
      {/* Optional visual band when testing `?projectBack=<slug>` on shell before Phase E routes */}
      {previewProjectSlug && activeProjectTheme && (
        <div
          aria-hidden="true"
          style={{ backgroundColor: activeProjectTheme.bg }}
          className="pointer-events-none fixed inset-x-0 top-0 z-[50] h-28 shadow-md"
        />
      )}

      <header
        id="header"
        className={`pointer-events-none fixed top-0 left-0 z-[52] w-full px-[var(--base-padding-x)] py-[var(--base-padding-y)] text-[clamp(1rem,1vw,1.5rem)] transition-colors duration-300 ${
          navMenuOpen ? "--menu-opened" : ""
        }`}
      >
        {/* Mobile-only top edge readability scrim on light scrolled surfaces (`<= 812px`) */}
        {scrolledHeader && !navMenuOpen && !isDarkSurface && (
          <div
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-0 top-0 z-0 h-20 bg-gradient-to-b from-[#f0f1fa]/92 via-[#f0f1fa]/65 to-transparent min-[813px]:hidden"
          />
        )}
        {/* Backdrop Scrim (`#header-background`: blue full-bleed on `<= 812px`, right gradient on desktop) */}
        <div
          id="header-background"
          aria-hidden="true"
          onClick={() => setNavMenuOpen(false)}
          className={`fixed inset-0 transition-opacity duration-300 ${
            navMenuOpen
              ? "pointer-events-auto opacity-100 max-[812px]:bg-[#0016ec] min-[813px]:left-1/2 min-[813px]:bg-[linear-gradient(270deg,rgba(11,11,18,0.38),rgba(11,11,18,0))]"
              : "pointer-events-none opacity-0"
          }`}
        />

        <div id="header-container" className="relative z-10 flex items-center justify-between">
          {/* Brand Wordmark (`#header-logo` exact vector path from `LUSION_GLOBAL_CHROME`) */}
          <TransitionLink
            href="/"
            transitionLabel="Home"
            aria-label="Lusion Home"
            id="header-logo"
            style={logoColorStyle}
            onClick={() => setNavMenuOpen(false)}
            className={`pointer-events-auto relative z-10 inline-flex items-center transition-colors duration-300 ${
              navMenuOpen ? "max-[812px]:!text-black" : ""
            }`}
          >
            <svg
              width="121"
              height="24"
              viewBox="0 0 121 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
              className="h-auto w-[6em] min-[813px]:w-[7.5em]"
            >
              <path
                d="M19.0191 18.6957V23.0435H0.470703V0.782608H5.48599V18.6957H19.0191Z"
                fill="currentColor"
              />
              <path
                d="M32.4995 23.4783C29.4036 23.4783 26.942 22.6482 25.1149 20.9881C23.2877 19.3281 22.3741 17.0751 22.3741 14.2292V0.782608H27.3894V14.2292C27.3894 15.8696 27.8495 17.1344 28.7697 18.0237C29.69 18.8933 30.9333 19.3281 32.4995 19.3281C34.0658 19.3281 35.2983 18.8933 36.1969 18.0237C37.1172 17.1344 37.5773 15.8696 37.5773 14.2292V0.782608H42.5926V14.2292C42.5926 17.0751 41.679 19.3281 39.8518 20.9881C38.0246 22.6482 35.5739 23.4783 32.4995 23.4783Z"
                fill="currentColor"
              />
              <path
                d="M57.6485 23.4783C54.6805 23.4783 52.2397 22.8459 50.326 21.581C48.4123 20.3162 47.3401 18.498 47.1093 16.1265H51.9966C52.1627 17.2727 52.7176 18.1423 53.6612 18.7352C54.6261 19.3281 55.9448 19.6245 57.6174 19.6245C59.1629 19.6245 60.3547 19.3577 61.1929 18.8241C62.0525 18.2905 62.4823 17.5692 62.4823 16.6601C62.4823 15.9684 62.23 15.4249 61.7254 15.0296C61.2421 14.6146 60.6305 14.3083 59.8906 14.1107C59.172 13.8933 58.0978 13.6462 56.6678 13.3696C54.6442 12.9743 53.0357 12.5692 51.8423 12.1542C50.6489 11.7391 49.6499 11.1067 48.8453 10.2569C48.062 9.40711 47.6703 8.26087 47.6703 6.81818C47.6703 5.49407 48.062 4.33794 48.8453 3.35079C49.6499 2.34289 50.7798 1.56126 52.2351 1.00593C53.6904 0.450593 55.3738 0.172925 57.2852 0.172925C60.1525 0.172925 62.4449 0.785573 64.1624 2.01087C65.8799 3.23617 66.8548 4.95553 67.0872 7.16897H62.1387C61.994 6.1413 61.5198 5.34091 60.716 4.76779C59.9336 4.19466 58.7689 3.9081 57.2219 3.9081C55.8763 3.9081 54.8122 4.15514 54.0295 4.64921C53.2468 5.12352 52.8554 5.79545 52.8554 6.66502C52.8554 7.31719 53.0859 7.83103 53.547 8.20652C54.0295 8.58202 54.6305 8.86858 55.35 9.06621C56.0695 9.26383 57.1333 9.50099 58.5414 9.77767C60.5877 10.1729 62.2189 10.588 63.435 11.0227C64.6512 11.4575 65.6611 12.1097 66.4648 12.9792C67.2899 13.8291 67.7024 15.005 67.7024 16.5069C67.7024 17.8706 67.2999 19.0761 66.4949 20.1235C65.7113 21.1709 64.5572 21.9911 63.0326 22.584C61.508 23.1769 59.7133 23.475 57.6485 23.4783Z"
                fill="currentColor"
              />
              <path d="M77.6742 0.782608V23.0435H72.6589V0.782608H77.6742Z" fill="currentColor" />
              <path
                d="M94.0846 23.4783C91.9089 23.4783 89.9547 22.9941 88.2219 22.0257C86.5106 21.0573 85.1642 19.7036 84.1829 17.9644C83.2229 16.2055 82.7429 14.1897 82.7429 11.917C82.7429 9.64427 83.2229 7.63834 84.1829 5.89921C85.1642 4.14032 86.5106 2.77668 88.2219 1.8083C89.9547 0.839921 91.9089 0.355731 94.0846 0.355731C96.2603 0.355731 98.2039 0.839921 99.9152 1.8083C101.648 2.77668 102.994 4.14032 103.954 5.89921C104.936 7.63834 105.426 9.64427 105.426 11.917C105.426 14.1897 104.936 16.2055 103.954 17.9644C102.994 19.7036 101.648 21.0573 99.9152 22.0257C98.2039 22.9941 96.2603 23.4783 94.0846 23.4783ZM94.0846 19.1304C95.3247 19.1304 96.4227 18.834 97.3785 18.2411C98.3556 17.6285 99.1157 16.7787 99.6589 15.6917C100.223 14.585 100.506 13.3267 100.506 11.917C100.506 10.5072 100.223 9.25889 99.6589 8.17194C99.1157 7.06522 98.3556 6.20553 97.3785 5.59289C96.4227 4.98024 95.3247 4.67391 94.0846 4.67391C92.8445 4.67391 91.7359 4.98024 90.7588 5.59289C89.803 6.20553 89.0535 7.06522 88.5104 8.17194C87.9672 9.25889 87.6956 10.5072 87.6956 11.917C87.6956 13.3267 87.9672 14.585 88.5104 15.6917C89.0535 16.7787 89.803 17.6285 90.7588 18.2411C91.7359 18.834 92.8445 19.1304 94.0846 19.1304Z"
                fill="currentColor"
              />
              <path
                d="M120.89 23.0435H116.594L109.729 10.1779V23.0435H104.714V0.782608H109.01L115.875 13.6779V0.782608H120.89V23.0435Z"
                fill="currentColor"
              />
            </svg>
          </TransitionLink>

          {/* Right Header Controls + Project Details Back Control */}
          <div id="header-right" className="pointer-events-auto relative z-10 flex items-center gap-2.5">
            {/* Case-Study `← BACK` Pill (`#header-center-project-back-btn`) */}
            {activeProjectTheme && (
              <div
                id="header-center"
                className="min-[813px]:fixed min-[813px]:top-[var(--base-padding-y)] min-[813px]:left-[46%]"
              >
                <button
                  id="header-center-project-back-btn"
                  type="button"
                  onClick={handleProjectBack}
                  aria-label="Back to Projects"
                  style={
                    {
                      "--back-hover-bg": activeProjectTheme.btnBgHover,
                      "--back-hover-text": activeProjectTheme.btnTextHover,
                    } as React.CSSProperties
                  }
                  className="group relative flex h-[3.2em] cursor-pointer items-center justify-center gap-[0.625em] overflow-hidden rounded-full bg-white text-[0.875em] font-medium tracking-[0.02em] text-black uppercase shadow-xs transition-colors duration-300 hover:text-[var(--back-hover-text)] max-[812px]:w-[3.2em] max-[812px]:px-0 min-[813px]:px-[1.25em]"
                >
                  <span
                    id="project-details-header-back-background"
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 origin-bottom scale-y-0 bg-[var(--back-hover-bg)] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-y-100"
                  />
                  <svg
                    id="header-center-project-back-btn-svg"
                    width="15"
                    height="15"
                    viewBox="0 0 14 14"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                    className="relative z-10 h-[1.15em] w-[1.15em] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] min-[813px]:group-hover:-translate-x-6"
                  >
                    <path
                      d="M12.5 7H1.5M1.5 7L6.25 2.25M1.5 7L6.25 11.75"
                      stroke="currentColor"
                      strokeWidth="1.6"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                  <span
                    id="header-center-project-back-btn-text"
                    className="relative z-10 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] max-[812px]:hidden min-[813px]:group-hover:-translate-x-2"
                  >
                    {LUSION_GLOBAL_CHROME.header.backButtonLabel}
                  </span>
                </button>
              </div>
            )}

            {/* Circular Waveform Sound Toggle (`#header-right-sound-btn`, desktop `> 812px`) */}
            <button
              id="header-right-sound-btn"
              type="button"
              onClick={toggleSound}
              data-audio-status={audioStatus}
              data-audio-stage={audioStage}
              aria-describedby="studio-audio-status"
              aria-pressed={audioEnabled}
              aria-label={audioStatus === "suspended" ? "Resume studio sound" : audioEnabled ? "Mute studio sound" : "Enable studio sound"}
              title={audioStatus === "suspended" ? "Resume sound" : audioEnabled ? "Mute sound" : "Enable sound"}
              className={`relative flex h-[3.2em] w-[3.2em] cursor-pointer items-center justify-center overflow-hidden rounded-full text-[0.875em] transition-colors duration-300 max-[812px]:hidden ${
                navMenuOpen || audioEnabled || isDarkSurface
                  ? "bg-white text-black shadow-xs hover:bg-[#eaecf6]"
                  : "bg-[#e4e6ef] text-black hover:bg-white"
              }`}
            >
              <span id="studio-audio-status" role="status" className="sr-only">
                {audioStatus === "unavailable" ? "Sound unavailable. The visual experience is unaffected; activate to retry." : audioStatus === "starting" ? "Starting sound" : audioStatus === "suspended" ? "Sound suspended by browser; activate to resume" : audioEnabled ? "Original journey sound enabled" : "Sound off"}
              </span>
              <canvas ref={waveCanvasRef} className="h-full w-full" aria-hidden="true" />
            </button>

            {/* Desktop `LET'S TALK •` Pill (`#header-right-talk-btn`, hidden `<= 812px`) */}
            <button
              id="header-right-talk-btn"
              type="button"
              onClick={scrollToContactSection}
              className="group relative flex h-[3.2em] cursor-pointer items-center justify-center overflow-hidden rounded-full bg-[#2b2e3a] px-[1.35em] text-[0.875em] font-medium tracking-[0.02em] whitespace-nowrap text-white uppercase transition-colors duration-300 hover:bg-[#0016ec] max-[812px]:hidden"
            >
              <span className="flex items-center gap-[0.6em]">
                <span className="transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:translate-x-1">
                  {LUSION_GLOBAL_CHROME.header.talkButtonLabel}
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block h-[0.36em] w-[0.36em] rounded-full bg-current transition-transform duration-300 group-hover:scale-125"
                />
              </span>
            </button>

            {/* Menu Toggle Pill (`#header-right-menu-btn`, `MENU ••` / `CLOSE ••`) */}
            <button
              id="header-right-menu-btn"
              type="button"
              aria-expanded={navMenuOpen}
              aria-controls="header-menu"
              aria-label={navMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              onClick={() => {
                soundEngine.playClick();
                setNavMenuOpen(!navMenuOpen);
              }}
              className={`group relative flex h-[3.2em] cursor-pointer items-center justify-center rounded-full text-[0.875em] font-medium tracking-[0.02em] text-black uppercase transition-colors duration-300 max-[812px]:w-[3.2em] max-[812px]:px-0 min-[813px]:px-[1.45em] ${
                navMenuOpen
                  ? "--opened bg-white"
                  : isDarkSurface
                    ? "bg-white hover:bg-[#eaecf6]"
                    : "bg-[#e4e6ef] hover:bg-white"
              }`}
            >
              <span id="header-right-menu-btn-inner" className="flex items-center gap-[0.625em] overflow-hidden">
                <span className="relative inline-block h-[1.2em] overflow-hidden leading-[1.2em] max-[812px]:hidden">
                  <span aria-hidden="true" className="invisible block select-none">
                    {LUSION_GLOBAL_CHROME.header.menuCloseLabel}
                  </span>
                  <span
                    id="header-right-menu-btn-text"
                    className={`absolute inset-x-0 top-0 block text-center transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] ${
                      navMenuOpen ? "-translate-y-full" : "translate-y-0"
                    }`}
                  >
                    {LUSION_GLOBAL_CHROME.header.menuOpenLabel}
                  </span>
                  <span
                    id="header-right-menu-btn-text-close"
                    className={`absolute inset-x-0 top-0 block text-center transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] ${
                      navMenuOpen ? "translate-y-0" : "translate-y-full"
                    }`}
                  >
                    {LUSION_GLOBAL_CHROME.header.menuCloseLabel}
                  </span>
                </span>

                {/* Rotating Twin Dots (`#header-right-menu-btn-dots`) */}
                <span
                  id="header-right-menu-btn-dots"
                  aria-hidden="true"
                  className={`relative inline-flex h-[1.15em] w-[1.15em] items-center justify-between transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] max-[812px]:text-[1.25em] ${
                    navMenuOpen ? "rotate-90" : "rotate-0 group-hover:rotate-90"
                  }`}
                >
                  <span className="h-[0.3em] w-[0.3em] rounded-full bg-current" />
                  <span className="h-[0.3em] w-[0.3em] rounded-full bg-current" />
                </span>
              </span>
            </button>
          </div>
        </div>

        {/* Floating Stacked Menu Popover (`#header-menu`) */}
        <nav
          id="header-menu"
          aria-label="Primary Navigation"
          aria-hidden={!navMenuOpen}
          className={`fixed top-[calc(var(--base-padding-y)+3.45rem)] right-[var(--base-padding-x)] z-20 flex flex-col gap-[0.625em] text-black max-[812px]:left-[var(--base-padding-x)] min-[813px]:w-[19.4em] ${
            navMenuOpen ? "--opened pointer-events-auto" : "pointer-events-none"
          }`}
        >
          {/* Card 1: Verified Route Links (`Home`, `About us`, `Projects`, `Contact`) */}
          <div
            id="header-menu-links"
            className={`flex flex-col rounded-[0.625em] bg-white px-[0.35em] py-[0.85em] shadow-[0_18px_48px_rgba(0,0,0,0.12)] transition-[transform,opacity] duration-500 ease-[cubic-bezier(0.4,0,0.1,1)] ${
              navMenuOpen
                ? "translate-y-0 rotate-0 opacity-100"
                : "translate-y-12 rotate-[3.5deg] opacity-0"
            }`}
          >
            {LUSION_GLOBAL_CHROME.menu.links.map((item) => {
              const isContactButton = item.href === null;
              const isActive =
                !isContactButton &&
                (item.href === "/"
                  ? pathname === "/" && !previewProjectSlug
                  : pathname === item.href || pathname.startsWith(`${item.href}/`));

              if (isContactButton) {
                return (
                  <button
                    key={item.label}
                    type="button"
                    data-scroll-to={item.dataScrollTo ?? "contact"}
                    tabIndex={navMenuOpen ? 0 : -1}
                    onClick={scrollToContactSection}
                    onMouseEnter={() => soundEngine.playHover()}
                    className="header-menu-link group relative w-full cursor-pointer overflow-hidden rounded-full px-[1.5em] py-[0.72em] text-left leading-none text-black"
                  >
                    <span className="pointer-events-none absolute inset-0 scale-90 rounded-full bg-[#0016ec]/0 transition-all duration-300 group-hover:scale-100 group-hover:bg-[#0016ec]/10" />
                    <span className="relative flex items-center justify-between overflow-hidden">
                      <span className="relative block overflow-hidden text-[1.5em] font-normal tracking-[-0.01em] uppercase">
                        <span className="block transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:-translate-y-full">
                          {item.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className="absolute inset-x-0 top-0 block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:translate-y-0"
                        >
                          {item.label}
                        </span>
                      </span>
                      <MenuDiagonalArrow className="h-[1.35em] w-[1.35em] scale-0 transition-transform duration-200 group-hover:scale-100" />
                    </span>
                  </button>
                );
              }

              return (
                <TransitionLink
                  key={item.label}
                  href={item.href ?? "/"}
                  transitionLabel={item.label}
                  tabIndex={navMenuOpen ? 0 : -1}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setNavMenuOpen(false)}
                  onMouseEnter={() => soundEngine.playHover()}
                  className={`header-menu-link group relative block w-full overflow-hidden rounded-full px-[1.5em] py-[0.72em] leading-none text-black ${
                    isActive ? "--active" : ""
                  }`}
                >
                  <span className="pointer-events-none absolute inset-0 scale-90 rounded-full bg-[#0016ec]/0 transition-all duration-300 group-hover:scale-100 group-hover:bg-[#0016ec]/10" />
                  <span className="relative flex items-center justify-between overflow-hidden">
                    <span className="relative block overflow-hidden text-[1.5em] font-normal tracking-[-0.01em] uppercase">
                      <span className="block transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:-translate-y-full">
                        {item.label}
                      </span>
                      <span
                        aria-hidden="true"
                        className="absolute inset-x-0 top-0 block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:translate-y-0"
                      >
                        {item.label}
                      </span>
                    </span>

                    {isActive ? (
                      <span
                        aria-hidden="true"
                        className="h-[0.45em] w-[0.45em] rounded-full bg-black"
                      />
                    ) : (
                      <MenuDiagonalArrow className="h-[1.35em] w-[1.35em] scale-0 transition-transform duration-200 group-hover:scale-100" />
                    )}
                  </span>
                </TransitionLink>
              );
            })}
          </div>

          {/* Card 2: Newsletter Card (`#header-menu-newsletter`, desktop height > 650px) */}
          <div
            id="header-menu-newsletter"
            className={`rounded-[0.625em] bg-white p-[1.5em] shadow-[0_18px_48px_rgba(0,0,0,0.12)] transition-[transform,opacity] delay-75 duration-500 ease-[cubic-bezier(0.4,0,0.1,1)] max-[812px]:hidden max-[1440px]:max-h-[650px]:hidden ${
              navMenuOpen
                ? "translate-y-0 rotate-0 opacity-100"
                : "translate-y-16 -rotate-[3.5deg] opacity-0"
            }`}
          >
            <div
              id="header-menu-newsletter-title"
              className="text-[1.95em] leading-[1.06] font-normal tracking-[-0.02em] text-black"
            >
              Subscribe to
              <br />
              our newsletter
            </div>
            <form
              id="header-menu-newsletter-form"
              onSubmit={handleMenuNewsletterSubmit}
              noValidate
              className="mt-4"
            >
              <div id="header-menu-newsletter-input" className="relative flex items-center">
                <label htmlFor="header-menu-newsletter-input-field" className="sr-only">
                  {LUSION_GLOBAL_CHROME.menu.newsletterInputPlaceholder}
                </label>
                <input
                  id="header-menu-newsletter-input-field"
                  type="email"
                  name="EMAIL"
                  tabIndex={navMenuOpen ? 0 : -1}
                  value={menuEmail}
                  onChange={(e) => {
                    setMenuEmail(e.target.value);
                    if (menuNewsletterStatus !== "idle") setMenuNewsletterStatus("idle");
                  }}
                  placeholder={LUSION_GLOBAL_CHROME.menu.newsletterInputPlaceholder}
                  className="h-[3.1em] w-full rounded-[0.95rem] bg-[#f0f1fa] pr-11 pl-4 text-[0.95em] text-black placeholder:text-black/35 focus:outline-2 focus:outline-[#1a2ffb]"
                />
                <button
                  id="header-menu-newsletter-input-arrow"
                  type="submit"
                  tabIndex={navMenuOpen ? 0 : -1}
                  aria-label="Subscribe to newsletter"
                  className="absolute right-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-black transition-transform hover:translate-x-0.5"
                >
                  <RightArrowSvg fill="#000000" />
                </button>
              </div>
              {menuNewsletterStatus === "error" && (
                <p
                  id="header-menu-newsletter-feedback-message"
                  role="alert"
                  className="mt-2 text-xs text-[#e90000]"
                >
                  Please enter a valid email address.
                </p>
              )}
              {menuNewsletterStatus === "saved" && (
                <p
                  id="header-menu-newsletter-feedback-message"
                  role="status"
                  className="mt-2 text-xs text-[#1a2ffb]"
                >
                  Recorded locally (static mode — write hello@lusion.co for studio updates).
                </p>
              )}
            </form>
          </div>

          {/* Card 3: Mobile `LET'S TALK` Card (`#header-menu-talk`, shown at `<= 812px`) */}
          <div
            id="header-menu-talk"
            className={`relative hidden items-center justify-between rounded-[0.625em] bg-white px-[1.5em] py-[1.35em] text-black shadow-[0_18px_48px_rgba(0,0,0,0.14)] transition-[transform,opacity] delay-75 duration-500 ease-[cubic-bezier(0.4,0,0.1,1)] max-[812px]:flex ${
              navMenuOpen
                ? "translate-y-0 rotate-0 opacity-100"
                : "translate-y-16 -rotate-[3.5deg] opacity-0"
            }`}
          >
            <a
              href={`mailto:${LUSION_GLOBAL_CHROME.footer.enquiriesEmail}`}
              tabIndex={navMenuOpen ? 0 : -1}
              aria-label="Email hello@lusion.co"
              className="absolute inset-0 z-10"
            />
            <span id="header-menu-text" className="text-[1.45em] uppercase">
              {LUSION_GLOBAL_CHROME.menu.talkButtonLabel}
            </span>
            <span id="header-menu-talk-icon" aria-hidden="true" className="h-[1.45em] w-[1.45em]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M0 0h24v24H0z" fill="#fff" />
                <rect x="3" y="3" width="18" height="18" rx="2" stroke="#000" strokeWidth="1.5" />
                <rect x="6" y="14" width="12" height="4" rx="2" fill="#000" />
                <path d="M7 7h10M7 10h10" stroke="#000" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </div>

          {/* Card 4: Lusion Labs Card (`#header-menu-labs` with exact reference `#header-menu-labs-lucy-svg`) */}
          <a
            id="header-menu-labs"
            href={LUSION_GLOBAL_CHROME.menu.labsHref}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={navMenuOpen ? 0 : -1}
            onMouseEnter={() => {
              setLucyHover(true);
              soundEngine.playHover();
            }}
            onMouseLeave={() => {
              setLucyHover(false);
              setLucyEyeOffset({ x: 0, y: 0 });
            }}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const nx = ((e.clientX - rect.left) / Math.max(1, rect.width) - 0.5) * 3;
              const ny = ((e.clientY - rect.top) / Math.max(1, rect.height) - 0.5) * 2;
              setLucyEyeOffset({ x: nx, y: ny });
            }}
            className={`group block rounded-[0.625em] bg-[#000000] px-[1.875em] py-[1.25em] text-white shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition-[transform,opacity] delay-100 duration-500 ease-[cubic-bezier(0.4,0,0.1,1)] ${
              navMenuOpen
                ? "translate-y-0 rotate-0 opacity-100"
                : "translate-y-20 -rotate-[3.5deg] opacity-0"
            }`}
          >
            <span id="header-menu-labs-inner" className="relative flex items-center gap-[1.5em] overflow-hidden">
              {/* Exact Reference Lucy Mark (`#header-menu-labs-lucy-svg`) */}
              <span
                id="header-menu-labs-lucy"
                aria-hidden="true"
                className={`h-[2.375em] w-[2.375em] shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  lucyHover ? "-translate-y-0.5 scale-105" : "translate-y-0"
                }`}
              >
                <svg
                  id="header-menu-labs-lucy-svg"
                  width="28"
                  height="38"
                  viewBox="0 0 28 38"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-full w-full"
                >
                  <path
                    d="M20.128 29.65C18.584 31.217 16.532 32 13.972 32c-2.56 0-4.612-.783-6.156-2.35C6.272 28.05 5.5 26 5.5 23.5c0-2.5.772-4.533 2.316-6.1 1.544-1.6 3.596-2.4 6.156-2.4 2.56 0 4.612.8 6.156 2.4C21.71 18.967 22.5 21 22.5 23.5c0 2.5-.79 4.55-2.372 6.15Z"
                    stroke="#FFFFFF"
                    strokeWidth="5"
                  />
                  <path
                    style={{
                      transform: `translate(${lucyEyeOffset.x}px, ${lucyEyeOffset.y}px)`,
                      transition: "transform 120ms ease-out",
                    }}
                    d="M23.5 4.25a3.25 3.25 0 1 0-6.5 0 3.25 3.25 0 0 0 6.5 0ZM11 4.25a3.25 3.25 0 1 0-6.5 0 3.25 3.25 0 0 0 6.5 0Z"
                    fill="#FFFFFF"
                  />
                </svg>
              </span>

              <span
                id="header-menu-labs-texts"
                className="relative flex-1 overflow-hidden text-[1.5em] leading-none font-normal uppercase"
              >
                <span
                  id="header-menu-labs-text"
                  className="block transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:-translate-y-full"
                >
                  {LUSION_GLOBAL_CHROME.menu.labsLabel}
                </span>
                <span
                  id="header-menu-labs-text-clone"
                  aria-hidden="true"
                  className="absolute inset-x-0 top-0 block translate-y-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:translate-y-0"
                >
                  {LUSION_GLOBAL_CHROME.menu.labsLabel}
                </span>
              </span>

              <span className="relative h-[1.45em] w-[1.45em] shrink-0 overflow-hidden">
                <MenuDiagonalArrow className="h-full w-full transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:translate-x-5 group-hover:-translate-y-5" />
                <MenuDiagonalArrow className="absolute inset-0 h-full w-full -translate-x-5 translate-y-5 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.1,1)] group-hover:translate-x-0 group-hover:translate-y-0" />
              </span>
            </span>
          </a>
        </nav>
      </header>

      {/* Fixed Right-Edge Scroll Progress Indicator (`#scroll-indicator`) */}
      <div
        id="scroll-indicator"
        aria-hidden="true"
        className={`pointer-events-none fixed top-[40vh] right-4 z-[51] h-[20vh] w-[6px] overflow-hidden rounded-full max-[812px]:right-[6px] max-[812px]:w-[2px] ${
          isDarkSurface ? "bg-white/15" : "bg-black/12"
        }`}
      >
        <div
          id="scroll-indicator-bar"
          ref={scrollBarRef}
          style={{ transform: "scaleY(0.08)" }}
          className={`h-full w-full origin-top rounded-full ${
            isDarkSurface ? "bg-white" : "bg-black"
          }`}
        />
      </div>
    </>
  );
}
