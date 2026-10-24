/**
 * Lusion Verified Design System & Optical Architecture Tokens
 * Grounded in extracted `:root` declarations from `_astro/about.CNa9RfUh.css`
 * and calibrated licensed typography (Font Option 2: OFL Instrument Sans + IBM Plex Mono).
 */

export type SurfaceTheme = "ice" | "void" | "cobalt";

export const DESIGN_TOKENS = {
  brand: {
    name: "Lusion",
    mark: "LUSION",
    domain: "lusion.co",
    labsDomain: "labs.lusion.co",
    emailGeneral: "hello@lusion.co",
    emailBusiness: "business@lusion.co",
    emailCareers: "hello@lusion.co",
  },
  colors: {
    void: "#000000",
    voidElevated: "#121416",
    voidSubtle: "#2b2e3a",
    ice: "#f0f1fa",
    iceElevated: "#e4e6ef",
    iceCard: "#ffffff",
    cobalt: "#1a2ffb",
    cobaltDeep: "#071bdf",
    iris: "#8832f7",
    cyan: "#c1ff00",
    ember: "#ff4c41",
    emerald: "#c1ff00",
    ink: "#000000",
    inkMuted: "#4a5064",
    chalk: "#ffffff",
    chalkMuted: "#9ea6ba",
  },
  typography: {
    fonts: {
      display:
        '"LusionSansCalibrated", "Instrument Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
      sans: '"LusionSansCalibrated", "Instrument Sans", ui-sans-serif, system-ui, -apple-system, sans-serif',
      mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    },
    scale: [
      {
        name: "Hero Statement",
        token: "--text-hero",
        value: "clamp(2.5rem, 5.4vw, 5.5rem)",
        lineHeight: "1.02",
        tracking: "-0.025em",
        sample:
          "We create 3D visual storytelling and interactive web experiences that help brands stand out",
      },
      {
        name: "End-Section CTA",
        token: "--text-h1",
        value: "clamp(3.25rem, 10vw, 10rem)",
        lineHeight: "0.98",
        tracking: "-0.03em",
        sample: "Let's work together!",
      },
      {
        name: "Archive & Portal Heading",
        token: "--text-h2",
        value: "clamp(2.25rem, 3.6vw, 3.75rem)",
        lineHeight: "1.0",
        tracking: "-0.02em",
        sample: "PROJECTS (19)",
      },
      {
        name: "Newsletter & Card Heading",
        token: "--text-h3",
        value: "clamp(1.625rem, 2.4vw, 3.375rem)",
        lineHeight: "1.06",
        tracking: "-0.02em",
        sample: "Subscribe to our newsletter",
      },
      {
        name: "Editorial Body",
        token: "--text-body-lg",
        value: "clamp(1.0625rem, 1.2vw, 1.25rem)",
        lineHeight: "1.5",
        tracking: "-0.005em",
        sample:
          "We help brands create digital experiences that connect with their audience.",
      },
      {
        name: "Case-Study Copy",
        token: "--text-body",
        value: "1rem",
        lineHeight: "1.6",
        tracking: "-0.005em",
        sample:
          "Suite 2, 9 Marsh Street, Bristol, BS1 4AA, United Kingdom — hello@lusion.co",
      },
      {
        name: "UI Pill & Telemetry",
        token: "--text-micro",
        value: "0.75rem",
        lineHeight: "1.2",
        tracking: "0.08em",
        sample: "[[ 001 ]] // LET'S TALK • MENU •• LABS",
      },
    ],
  },
  spacing: [
    { token: "--space-1", px: 8, rem: "0.5rem" },
    { token: "--space-2", px: 16, rem: "1rem" },
    { token: "--space-3", px: 24, rem: "1.5rem" },
    { token: "--space-4", px: 32, rem: "2rem" },
    { token: "--space-5", px: 40, rem: "2.5rem" },
    { token: "--space-6", px: 48, rem: "3rem" },
    { token: "--space-8", px: 64, rem: "4rem" },
    { token: "--space-10", px: 80, rem: "5rem" },
    { token: "--space-12", px: 96, rem: "6rem" },
    { token: "--space-16", px: 128, rem: "8rem" },
    { token: "--space-20", px: 160, rem: "10rem" },
  ],
  radii: [
    { token: "--radius-xs", value: "6px", usage: "Scroll indicator bar & tags" },
    { token: "--radius-sm", value: "10px", usage: "Floating `#header-menu` cards (`0.625em`)" },
    { token: "--radius-md", value: "18px", usage: "Newsletter input fields (`1.125rem`)" },
    { token: "--radius-lg", value: "20px", usage: "Global stage & card radius (`--global-border-radius`)" },
    { token: "--radius-xl", value: "28px", usage: "Footer top wave crest" },
    { token: "--radius-pill", value: "9999px", usage: "`LET'S TALK`, `MENU`, `← BACK`, and `CONTINUE TO SCROLL` pills" },
  ],
  easings: [
    {
      name: "Lusion UI Curve",
      token: "--ease-lusion",
      css: "cubic-bezier(0.4, 0, 0.1, 1)",
      gsap: "power2.inOut",
      bezier: [0.4, 0, 0.1, 1] as const,
      usage: "Header pills (`MENU`/`CLOSE`, `LET'S TALK`), menu card tilt-in, and clone text swaps",
    },
    {
      name: "Expo Out",
      token: "--ease-expo-out",
      css: "cubic-bezier(0.16, 1, 0.3, 1)",
      gsap: "expo.out",
      bezier: [0.16, 1, 0.3, 1] as const,
      usage: "`#project-details-header-back-background` bottom-up fill and masked reveals",
    },
    {
      name: "Architectural Underline",
      token: "--ease-architectural",
      css: "cubic-bezier(0.35, 0, 0, 1)",
      gsap: "power3.out",
      bezier: [0.35, 0, 0, 1] as const,
      usage: "Footer email underlines (`hello@lusion.co`, `business@lusion.co`, `labs.lusion.co`) & `↑` button",
    },
    {
      name: "Curtain Wipe",
      token: "--ease-curtain",
      css: "cubic-bezier(0.76, 0, 0.24, 1)",
      gsap: "power4.inOut",
      bezier: [0.76, 0, 0.24, 1] as const,
      usage: "Full-bleed route transition curtain sweep",
    },
  ],
  durations: [
    { token: "--duration-micro", ms: 180, usage: "Focus states & audio waveform step" },
    { token: "--duration-ui", ms: 320, usage: "Header pill morphs (`0.3s`–`0.4s` reference timing)" },
    { token: "--duration-reveal", ms: 500, usage: "Floating menu card stagger (`0.5s`)" },
    { token: "--duration-cinema", ms: 900, usage: "`#preloader` `000 -> 100` sequence" },
  ],
  zIndex: [
    { token: "--z-stage", level: 0, layer: "Persistent Fixed WebGL Canvas Stage" },
    { token: "--z-content", level: 10, layer: "Document Sections, `#end-section`, `#footer-section`, `#scroll-nav-section`" },
    { token: "--z-hud", level: 52, layer: "`#header`, `#header-menu`, `#header-center-project-back-btn`, `#scroll-indicator`" },
    { token: "--z-curtain", level: 90, layer: "Route Transition Wipe Curtain" },
    { token: "--z-modal", level: 99, layer: "`#video-overlay` Cinema Player" },
    { token: "--z-cursor", level: 100, layer: "Reactive Pointer & Video Close Cursor" },
    { token: "--z-preloader", level: 200, layer: "`#preloader` Stepped-`L` & `000 -> 100` Counter" },
  ],
} as const;
