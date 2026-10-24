import { create } from "zustand";
import type { SurfaceTheme } from "@/lib/tokens";

export type WebGLSceneMode =
  | "hero-cluster"
  | "showreel"
  | "work-gallery"
  | "capabilities"
  | "dispersion-tunnel"
  | "labs-sandbox"
  | "about-sculpture"
  | "case-study"
  | "contact-beacon"
  | "lost-404"
  | "portal";

export type QualityTier = "high" | "medium" | "low";

export type CursorVariant = "default" | "interactive" | "badge" | "drag";

export interface LabUniformState {
  experiment: 0 | 1 | 2 | 3;
  ior: number;
  dispersion: number;
  turbulence: number;
  spring: number;
  wireframe: boolean;
}

export interface ProjectThemeConfig {
  slug: string;
  bg: string;
  highlight: string;
  btnBg: string;
  btnText: string;
  btnBgHover: string;
  btnTextHover: string;
}

export interface VideoOverlayConfig {
  title: string;
  desktopSrc: string;
  mobileSrc: string;
  vimeoId?: string;
}

/**
 * High-frequency mutable telemetry read directly inside R3F `useFrame` and RAF loops
 * to guarantee zero React re-renders and zero garbage collection during scroll/pointer motion.
 */
export const STAGE_TELEMETRY = {
  pointerX: 0,
  pointerY: 0,
  smoothPointerX: 0,
  smoothPointerY: 0,
  pointerVelocity: 0,
  clientX: -100,
  clientY: -100,
  scrollProgress: 0,
  scrollVelocity: 0,
  scrollY: 0,
  accentHue: 0.64,
};

interface StudioState {
  activeSurface: SurfaceTheme;
  webglMode: WebGLSceneMode;
  capabilityIndex: number;
  projectAccentHex: string;
  activeProjectTheme: ProjectThemeConfig | null;

  cursorVariant: CursorVariant;
  cursorLabel: string;

  audioEnabled: boolean;
  menuOpen: boolean;
  reelOpen: boolean;
  videoConfig: VideoOverlayConfig;
  preloaderDone: boolean;

  isTransitioning: boolean;
  transitionLabel: string;

  qualityTier: QualityTier;
  dpr: [number, number];
  fps: number;
  webglSupported: boolean;
  reducedMotion: boolean;

  labUniforms: LabUniformState;

  setActiveSurface: (surface: SurfaceTheme) => void;
  setWebglMode: (mode: WebGLSceneMode) => void;
  setCapabilityIndex: (index: number) => void;
  setProjectAccentHex: (hex: string) => void;
  setActiveProjectTheme: (theme: ProjectThemeConfig | null) => void;
  setCursor: (variant: CursorVariant, label?: string) => void;
  resetCursor: () => void;
  setAudioEnabled: (enabled: boolean) => void;
  setMenuOpen: (open: boolean) => void;
  setReelOpen: (open: boolean, config?: Partial<VideoOverlayConfig>) => void;
  setPreloaderDone: (done: boolean) => void;
  setTransition: (active: boolean, label?: string) => void;
  setQualityTier: (tier: QualityTier) => void;
  setFps: (fps: number) => void;
  setWebglSupported: (supported: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  updateLabUniforms: (patch: Partial<LabUniformState>) => void;
}

const DEFAULT_REEL_CONFIG: VideoOverlayConfig = {
  title: "Lusion Showreel",
  desktopSrc: "/assets/textures/reel/desktop.mp4",
  mobileSrc: "/assets/textures/reel/mobile.mp4",
  vimeoId: "761102167",
};

export const useStudioStore = create<StudioState>((set) => ({
  activeSurface: "ice",
  webglMode: "hero-cluster",
  capabilityIndex: 0,
  projectAccentHex: "#1a2ffb",
  activeProjectTheme: null,

  cursorVariant: "default",
  cursorLabel: "",

  audioEnabled: false,
  menuOpen: false,
  reelOpen: false,
  videoConfig: DEFAULT_REEL_CONFIG,
  preloaderDone: false,

  isTransitioning: false,
  transitionLabel: "",

  qualityTier: "high",
  dpr: [1, 2],
  fps: 60,
  webglSupported: true,
  reducedMotion: false,

  labUniforms: {
    experiment: 0,
    ior: 1.46,
    dispersion: 0.34,
    turbulence: 0.52,
    spring: 0.65,
    wireframe: false,
  },

  setActiveSurface: (activeSurface) => set({ activeSurface }),
  setWebglMode: (webglMode) => set({ webglMode }),
  setCapabilityIndex: (capabilityIndex) => set({ capabilityIndex }),
  setProjectAccentHex: (projectAccentHex) => set({ projectAccentHex }),
  setActiveProjectTheme: (activeProjectTheme) => set({ activeProjectTheme }),
  setCursor: (cursorVariant, cursorLabel = "") => set({ cursorVariant, cursorLabel }),
  resetCursor: () => set({ cursorVariant: "default", cursorLabel: "" }),
  setAudioEnabled: (audioEnabled) => set({ audioEnabled }),
  setMenuOpen: (menuOpen) => set({ menuOpen }),
  setReelOpen: (reelOpen, config) =>
    set((state) => ({
      reelOpen,
      videoConfig: config
        ? { ...DEFAULT_REEL_CONFIG, ...config }
        : reelOpen
          ? state.videoConfig
          : DEFAULT_REEL_CONFIG,
    })),
  setPreloaderDone: (preloaderDone) => set({ preloaderDone }),
  setTransition: (isTransitioning, transitionLabel = "") =>
    set({ isTransitioning, transitionLabel }),
  setQualityTier: (qualityTier) =>
    set({
      qualityTier,
      dpr: qualityTier === "high" ? [1, 2] : qualityTier === "medium" ? [1, 1.5] : [1, 1],
    }),
  setFps: (fps) => set({ fps }),
  setWebglSupported: (webglSupported) => set({ webglSupported }),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  updateLabUniforms: (patch) =>
    set((state) => ({ labUniforms: { ...state.labUniforms, ...patch } })),
}));
