"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AboutExpertiseCards } from "@/components/pages/AboutExpertiseCards";
import { LUSION_ABOUT } from "@/data/reference";
import { aboutScenePose, aboutWordmarkSweepPose, aboutLetteringPose } from "@/lib/about-scene-motion";
import { createAboutScenePost } from "@/components/three/AboutScenePost";
import { createAboutReferenceWorld } from "@/components/three/AboutReferenceWorld";
import { aboutEditorialProgress, aboutEditorialWordPose } from "@/lib/about-editorial-motion";
import { cinematicRenderDpr } from "@/lib/home-motion";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { AboutContactSection } from "@/components/pages/AboutContactSection";
import { AboutRecognition } from "@/components/pages/AboutRecognition";
import { AboutPageStyles } from "@/components/pages/AboutPageStyles";
import { createAboutSourceTeam } from "@/components/three/AboutSourceTeam";
import { createAboutWordmarkSweep } from "@/components/three/AboutWordmarkSweep";
import { StudioFooter } from "@/components/sections/StudioFooter";

declare global {
  interface Window {
    __enableAboutProbe?: boolean;
    __aboutProbe?: () => { frames: number; u: number; time: number; pointer: number[]; pointerActive: number; pending: boolean; state?: string; explorer?: string; explorerScale?: number; teamAsset?: string; teamReady?: boolean; teamMorph?: number; count: number; portraitPoints: number; streakCount: number; qualityTier: string; reducedMotion: boolean; frameTimes: number[]; draws: number; triangles: number; memory: { geometries: number; textures: number }; width: number; height: number; camera: number[] };
  }
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / Math.max(1e-5, e1 - e0));
  return t * t * (3 - 2 * t);
};

/** Native Three.js sticky world. Retains local legacy scroll coordinates for
 * camera/DOM choreography; original shader filament flow and sculptural studies.
 * Historical captures support the layout; current live fidelity is unverified.
 */
/** Original 4×5 block-pixel initials for the seven-member studio roster. */
const PIXEL_FONT: Record<string, string[]> = {
  A: [".##.", "#..#", "####", "#..#", "#..#"],
  E: ["####", "#...", "###.", "#...", "####"],
  F: ["####", "#...", "###.", "#...", "#..."],
  P: ["###.", "#..#", "###.", "#...", "#..."],
  S: [".###", "#...", ".##.", "...#", "###."],
  Y: ["#..#", "#..#", ".##.", ".##.", ".##."],
};

function PixelGlyph({ char, className }: { char: string; className?: string }) {
  const rows = PIXEL_FONT[(char || "A").toUpperCase()] ?? PIXEL_FONT.A;
  return (
    <svg
      viewBox="0 0 4 5"
      aria-hidden="true"
      shapeRendering="crispEdges"
      className={className}
    >
      {rows.flatMap((row, y) =>
        row.split("").map((cell, x) =>
          cell === "#" ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#fff" /> : null
        )
      )}
    </svg>
  );
}

interface AboutWhoStageProps {
  activeMemberIdx: number;
  onStepMember: (delta: number) => void;
  onSelectMember: (index: number) => void;
  reducedMotion: boolean;
}

function AboutWhoExperience({
  activeMemberIdx,
  onStepMember,
  onSelectMember,
  reducedMotion,
}: AboutWhoStageProps) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const heroWordmarkRef = useRef<HTMLDivElement | null>(null);
  const sweepWordmarkRef = useRef<HTMLDivElement | null>(null);
  const scrollPromptRef = useRef<HTMLDivElement | null>(null);
  const chromaticRingRef = useRef<HTMLDivElement | null>(null);
  const manifestoOverlayRef = useRef<HTMLDivElement | null>(null);
  const narrativeOverlayRef = useRef<HTMLDivElement | null>(null);
  const narrativeWordRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const teamOverlayRef = useRef<HTMLDivElement | null>(null);
  const teamCursorRef = useRef<HTMLDivElement | null>(null);
  const sourceTeamRef = useRef<ReturnType<typeof createAboutSourceTeam> | null>(null);
  const [sourceTeamState, setSourceTeamState] = useState("loading");
  const fallbackPosterRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const requestSceneRenderRef = useRef<(() => void) | null>(null);

  const [sceneGeneration, setSceneGeneration] = useState(0);
  const contextRecoveryRef = useRef<{ u: number; time: number } | null>(null);
  const memberRef = useRef(activeMemberIdx);
  const team = LUSION_ABOUT.who.team;
  const activeMember = team[activeMemberIdx] ?? team[0];
  const narrativeWords = (words: string[], offset: number, italicCount = 0, separated = true) =>
    words.map((word, index) => (
      <React.Fragment key={offset + index}>
        {separated && index > 0 ? " " : null}
        <span
          ref={el => { narrativeWordRefs.current[offset + index] = el; }}
          className={`about-narrative-word${index < italicCount ? " is-italic" : ""}`}
        >
          {word}
        </span>
      </React.Fragment>
    ));
  


  useEffect(() => {
    if (reducedMotion) return;
    let timeoutId = 0;
    const clearAdvance = () => {
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = 0;
    };
    const evaluateTeamStage = () => {
      if (document.hidden || teamOverlayRef.current?.dataset.teamActive !== "true") {
        clearAdvance();
        return;
      }
      if (!timeoutId) {
        timeoutId = window.setTimeout(() => {
          timeoutId = 0;
          if (!document.hidden && teamOverlayRef.current?.dataset.teamActive === "true") {
            onStepMember(1);
          }
        }, 4800);
      }
    };
    const pollId = window.setInterval(evaluateTeamStage, 160);
    const onVisibility = () => {
      clearAdvance();
      if (!document.hidden) evaluateTeamStage();
    };
    document.addEventListener("visibilitychange", onVisibility);
    evaluateTeamStage();
    return () => {
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
      clearAdvance();
    };
  }, [activeMemberIdx, onStepMember, reducedMotion]);

  useEffect(() => {
    memberRef.current = activeMemberIdx;
    void sourceTeamRef.current?.setMember(activeMemberIdx, reducedMotion);
  }, [activeMemberIdx, reducedMotion]);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const hostEl = canvasHostRef.current;
    if (!sectionEl || !hostEl) return;

    let contextLost = false, disposed = false, assetsFailed = false;
    const fallback = (reason: string) => {
      sectionEl.dataset.sceneState = reason;
      if (fallbackPosterRef.current) fallbackPosterRef.current.style.display = "flex";
    };
    sectionEl.dataset.sceneState = "initializing";
    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      fallback("unavailable");
      return;
    }

    const glRenderer = renderer;
    if (!glRenderer.extensions.has("EXT_color_buffer_float")) {
      glRenderer.dispose(); fallback("unavailable"); return;
    }
    if (fallbackPosterRef.current) fallbackPosterRef.current.style.display = "none";
    const ctx = glRenderer.getContext(), debug = ctx.getExtension("WEBGL_debug_renderer_info");
    const software = debug ? /swiftshader|llvmpipe|software/i.test(String(ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL))) : false;
    const tier = useStudioStore.getState().qualityTier;
    glRenderer.setClearColor(0x000302, 1);
    glRenderer.outputColorSpace = THREE.SRGBColorSpace;
    glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    glRenderer.toneMappingExposure = 1.05;
    glRenderer.domElement.style.width = "100%";
    glRenderer.domElement.style.height = "100%";
    glRenderer.domElement.style.display = "block";
    glRenderer.domElement.style.opacity = "0";
    glRenderer.domElement.style.transition = reducedMotion ? "none" : "opacity .25s";
    hostEl.appendChild(glRenderer.domElement);
    const openingSvg = heroWordmarkRef.current?.querySelector("svg");
    const manifestoLogoLine = manifestoOverlayRef.current?.querySelector<HTMLSpanElement>("h2 > span:nth-child(2)");

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const scene = new THREE.Scene();
    const sceneOverlay = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, 16 / 10, .1, 220);

    const referenceWorld = track(createAboutReferenceWorld(glRenderer,
      software || window.innerWidth < 820 || tier === "low", reducedMotion,
      () => ensureLoop(), state => {
        if (disposed) return;
        sectionEl.dataset.landscapeSourceState = state;
        if (state === "ready") { sectionEl.dataset.sceneState = "ready"; glRenderer.domElement.style.opacity = "1"; }
        if (state === "unavailable") { assetsFailed = true; fallback("unavailable"); }
      }));
    scene.add(referenceWorld.group);
    const wordmarkSweep = track(createAboutWordmarkSweep(() => ensureLoop()));
    sceneOverlay.add(wordmarkSweep.mesh);
    document.fonts.ready.then(() => {
      if (!disposed) { wordmarkSweep.repaint(); resize(); ensureLoop(); }
    });

    // Authorized source roster points and captured topographic contours. This
    // replaces the user's photo, reconstructed mesh and invented anatomical bust.
    let teamAssemblyStart = -1, teamWasVisible = false;
    const sourceTeam = track(createAboutSourceTeam(() => ensureLoop(), (state, id) => {
      if (disposed) return;
      if (id === "contours") { sectionEl.dataset.teamTerrainState = state; return; }
      sectionEl.dataset.teamPortraitSource = "source-roster";
      sectionEl.dataset.teamAssetState = state;
      sectionEl.dataset.teamAssetId = id;
      setSourceTeamState(state);
    }));
    sourceTeamRef.current = sourceTeam;
    scene.add(sourceTeam.group);
    const scenePost = track(createAboutScenePost(glRenderer, scene, camera, sceneOverlay, referenceWorld.renderMotion));
    void sourceTeam.setMember(memberRef.current, reducedMotion);

    // -------------------------------------------------------------------------
    // Scroll & Camera Spline Update Loop
    // -------------------------------------------------------------------------
    let targetScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let smoothScrollY = targetScrollY;
    const chromeBlocked = () => { const s = useStudioStore.getState(); return s.menuOpen || s.reelOpen || s.isTransitioning; };
    let docVisible = document.visibilityState === "visible";
    let lastTime = performance.now(), sceneTime = contextRecoveryRef.current?.time ?? 0, frames = 0, lastU = 0;
    const frameTimes: number[] = [];
    const pointerTarget = new THREE.Vector2();
    let rafId = 0;
    const pointerNDC = new THREE.Vector2(0, 0);
    let pointerActive = 0;


    let ownedInspector: unknown;
    const syncInspector = () => {
      const H = Math.max(1, window.innerHeight);
      window.__lusionInspector = {
        ...window.__lusionInspector,
        properties: { hasStarted: true },
        scrollManager: {
          scrollPixel: window.scrollY,
          contentSizePixel: Math.max(0, document.documentElement.scrollHeight - H),
          scrollLimit: Math.max(0, document.documentElement.scrollHeight - H),
          scrollToPixel: (y: number) => {
            const win = window as unknown as {
              __lenis?: { resize: () => void; scrollTo: (t: number, o?: { immediate?: boolean }) => void };
            };
            win.__lenis?.resize();
            win.__lenis?.scrollTo(y, { immediate: true });
            window.scrollTo({ top: y, behavior: "instant" });
            targetScrollY = y;
            smoothScrollY = y;
          },
        },
      };
      ownedInspector = window.__lusionInspector.scrollManager;
    };

    const resize = () => {
      const W = Math.max(1, window.innerWidth);
      const H = Math.max(1, window.innerHeight);
      const dpr = Math.min(tier === "low" ? 1 : 1.5, cinematicRenderDpr(W, H, window.devicePixelRatio || 1, software, reducedMotion));
      glRenderer.setPixelRatio(dpr);
      glRenderer.setSize(W, H, false);
      scenePost.resize(W, H, dpr);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      if (manifestoLogoLine) {
        const range = document.createRange(); range.selectNodeContents(manifestoLogoLine);
        const rect = range.getBoundingClientRect();
        const capHeight = rect.height * .75;
        const parentShift = manifestoOverlayRef.current ? new DOMMatrixReadOnly(getComputedStyle(manifestoOverlayRef.current).transform).m41 : 0;
        wordmarkSweep.layout(W, H, { x: rect.left - parentShift, y: rect.top + (rect.height - capHeight) * .5, width: rect.width / .92, height: capHeight });
      } else wordmarkSweep.layout(W, H);
      syncInspector();
    };

    const renderAtScroll = (sy: number, elapsedSec: number) => {
      const W = Math.max(1, window.innerWidth);
      const H = Math.max(1, window.innerHeight);
      const isMobile = W < 820;

      // Retained legacy unit scroll parameter, not a fresh live measurement of 'lusion.co/about/':
      // Desktop: 'u = (sy - sectionTop) / W' in '[0 .. 9.5]'
      // Mobile:  'u = (sy - sectionTop) / H' in '[0 .. 11.25]'
      const secRect = sectionEl.getBoundingClientRect();
      const secTop = secRect.top + window.scrollY;
      const unit = isMobile ? H : W;
      const u = Math.max(0, (sy - secTop) / Math.max(1, unit));
      lastU = u;

      if (window.__lusionInspector?.scrollManager) {
        window.__lusionInspector.scrollManager.scrollPixel = sy;
      }

      // -----------------------------------------------------------------------
      // One scroll-owned pose: close volume → basin → distant basin → editorial.
      // The archived spline overrides this safe initial pose once its data arrives.
      // -----------------------------------------------------------------------
      const tTeamPhase = aboutScenePose(u, isMobile).team;
      // Native opening pose until the required spline arrives, not the retired
      // invented camera path. The canvas reveals only after required data loads.
      camera.fov = isMobile ? 70 : 60;
      camera.position.set(0, 7.29944, 5.00107);
      camera.lookAt(0, 7.29944, 0);
      camera.updateProjectionMatrix();

      referenceWorld.update(camera, u, elapsedSec, isMobile, pointerNDC);

      // Source portrait and terrain share one camera-aligned stage. Terrain
      // does not rotate with the head and is not disguised as a shirt/torso.
      const teamVisible = tTeamPhase > .02 && sourceTeam.ready;
      if (teamVisible && !teamWasVisible) teamAssemblyStart = elapsedSec;
      teamWasVisible = teamVisible;
      sourceTeam.update(camera, elapsedSec, tTeamPhase,
        smoothstep(5.25, 6.125, u) * (1 - tTeamPhase), pointerNDC,
        window.innerWidth, window.innerHeight, glRenderer.getPixelRatio(), reducedMotion,
        reducedMotion ? 1.2 : 1.2 * smoothstep(0, 1.1, Math.max(0, elapsedSec - teamAssemblyStart)));

      // -----------------------------------------------------------------------
      // Synchronized DOM HUD Layers (Zero React 'setState' per frame!)
      // -----------------------------------------------------------------------
      // A. Exclusive lettering chapters: opening → flourish → manifesto.
      // One pure packet owns visibility; no second playhead or delayed callbacks.
      const lettering = aboutLetteringPose(u, isMobile);
      if (teamCursorRef.current) {
        teamCursorRef.current.style.opacity = hasPointer && !pointerOverControl && !reducedMotion && !isMobile ? String(tTeamPhase) : "0";
        const x = (pointerNDC.x + 1) * window.innerWidth * .5;
        const y = (1 - pointerNDC.y) * window.innerHeight * .5;
        const scale = 1;
        teamCursorRef.current.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-50%) scale(${scale})`;
      }
      if (heroWordmarkRef.current) {
        const wordOut = lettering.opening;
        const slideX = reducedMotion ? 0 : -lettering.openingTravel * (isMobile ? 24 : 36);
        heroWordmarkRef.current.style.opacity = String(wordOut);
        heroWordmarkRef.current.style.transform = `translate3d(${slideX}vw, 0, 0)`;
        heroWordmarkRef.current.style.visibility = wordOut > 0.005 ? "visible" : "hidden";
      }

      if (scrollPromptRef.current) {
        const promptVis = 1 - smoothstep(0.08, 0.55, u);
        scrollPromptRef.current.style.opacity = String(promptVis);
         // Faint chromatic edge ring belongs only to the pullback/wide-shot beat.
         // It is a CSS overlay over the original scene, never a copied post-process.
         if (chromaticRingRef.current) {
           const wideShot = smoothstep(1.35, 1.68, u) * (1 - smoothstep(3.55, 3.95, u));
           chromaticRingRef.current.style.opacity = String(wideShot * 0.42);
         }
      }

      // A2. Continuous type surface, sharing this renderer and scroll authority.
      const sweep = aboutWordmarkSweepPose(u, isMobile);
      const sourceLogo = wordmarkSweep.ready && referenceWorld.ready && !isMobile;
      wordmarkSweep.mesh.visible = sourceLogo && u < 4.35;
      wordmarkSweep.uniforms.uOpacity.value = 1 - smoothstep(3.65, 4.35, u);
      if (openingSvg) openingSvg.style.opacity = sourceLogo ? "0" : "1";
      if (manifestoLogoLine) manifestoLogoLine.style.opacity = sourceLogo ? "0" : "1";
      wordmarkSweep.uniforms.uPhase.value = sweep.deformation;
      wordmarkSweep.uniforms.uSlideX.value = -Math.min(1.25, aboutEditorialProgress(u)) * W;
      wordmarkSweep.uniforms.uAspect.value = W / H;
      if (sweepWordmarkRef.current) {
        sweepWordmarkRef.current.style.opacity = String(sweep.opacity);
        sweepWordmarkRef.current.style.visibility = sweep.opacity > .005 ? "visible" : "hidden";
        sweepWordmarkRef.current.dataset.deformation = sweep.deformation.toFixed(4);
      }

      // B. The two-sided studio statement arrives after the first wordmark
      // distortion and remains alongside the valley shot until the later narrative.
      if (manifestoOverlayRef.current) {
        const manVis = lettering.manifesto;
        manifestoOverlayRef.current.style.opacity = String(manVis);
        manifestoOverlayRef.current.style.visibility = manVis > 0.005 ? "visible" : "hidden";
        manifestoOverlayRef.current.style.transform = `translate3d(${lerp(4, 0, smoothstep(isMobile ? 1.95 : 1.1, isMobile ? 2.42 : 1.6, u)) - (isMobile ? 0 : Math.min(1.25, aboutEditorialProgress(u)) * 100)}vw, 0, 0)`;
      }

      // C. Studio Narrative HUD: each word owns a deterministic scroll window.
      // No React state or per-frame DOM queries; the same playhead drives reverse fade/slide.
      if (narrativeOverlayRef.current) {
        const exit = smoothstep(5.82, 6.42, u);
        const narVis = lettering.narrative;
        narrativeOverlayRef.current.style.opacity = "1";
        narrativeOverlayRef.current.style.visibility = (isMobile ? narVis > .005 : u > 3.5 && u < 7) ? "visible" : "hidden";
        narrativeOverlayRef.current.style.transform = isMobile ? `translate3d(${(1 - smoothstep(4.42, 4.9, u)) * 105 - 58 * exit}vw,0,0)` : "none";
        for (let i = 0; i < narrativeWordRefs.current.length; i++) {
          const word = narrativeWordRefs.current[i];
          if (!word) continue;
          if (!isMobile) {
            const pose = aboutEditorialWordPose(u, i);
            word.style.opacity = String(pose.opacity);
            word.style.transform = `translate3d(${pose.xVw}vw,0,0) translate3d(${pose.xEm}em,0,0)`;
            continue;
          }
          const stagger = i * 0.014;
          const enter = smoothstep(4.45 + stagger, 4.69 + stagger, u);
          const leave = 1 - smoothstep(5.82 + stagger * .65, 6.12 + stagger * .65, u);
          word.style.opacity = String(enter * leave);
          word.style.transform = `translate3d(${lerp(16, 0, enter) - 10 * exit}px,0,0)`;
        }
      }

      // D. Full-Bleed Interactive 'T E A M' Hologram HUD ('about-04-team-hologram', 'u >= 6.45')
      if (teamOverlayRef.current) {
        teamOverlayRef.current.style.opacity = String(tTeamPhase);
        teamOverlayRef.current.style.visibility = tTeamPhase > 0.01 ? "visible" : "hidden";
        teamOverlayRef.current.style.pointerEvents = tTeamPhase > 0.45 ? "auto" : "none";
        teamOverlayRef.current.dataset.teamActive = tTeamPhase > .985 ? "true" : "false";
      }

      scenePost.render(u);
      frames++;
    };

    const tick = () => {
      rafId = 0;
      if (!docVisible || disposed || contextLost || assetsFailed || chromeBlocked()) return;
      const now = performance.now(), elapsed = Math.max(0, (now - lastTime) / 1000), dt = Math.min(.08, elapsed);
      lastTime = now;
      const rect = sectionEl.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      // Scene time follows active elapsed time; the GPU integrator bounds substeps.
      // Keep the bounded dt only for damping; ensureLoop resets lastTime after sleep.
      if (!reducedMotion) sceneTime += elapsed;
      frameTimes.push(elapsed * 1000); if (frameTimes.length > 180) frameTimes.shift();
      targetScrollY = window.scrollY;
      const diff = targetScrollY - smoothScrollY;
      smoothScrollY = reducedMotion || Math.abs(diff) > window.innerHeight * .42 ? targetScrollY : smoothScrollY + diff * (1 - Math.exp(-25 * dt));
      if (Math.abs(targetScrollY - smoothScrollY) < .15) smoothScrollY = targetScrollY;
      pointerNDC.lerp(pointerTarget, 1 - Math.exp(-12 * dt));
      pointerActive *= Math.exp(-3.8 * dt);
      renderAtScroll(smoothScrollY, sceneTime);
      if (!reducedMotion) rafId = window.requestAnimationFrame(tick);
    };
    const ensureLoop = () => {
      if (!rafId && docVisible && !disposed && !contextLost && !assetsFailed && !chromeBlocked()) {
        lastTime = performance.now();
        rafId = window.requestAnimationFrame(tick);
      }
    };
    requestSceneRenderRef.current = ensureLoop;
    let hasPointer = false, pointerOverControl = false;
    const releasePointer = () => { hasPointer = false; pointerTarget.set(0, 0); ensureLoop(); };
    const onPointerMove = (e: PointerEvent) => {
      if (e.pointerType === "touch" || reducedMotion) return;
      hasPointer = true; pointerOverControl = e.target instanceof Element && !!e.target.closest("button,a,input");
      pointerTarget.set(Math.max(-1, Math.min(1, e.clientX / Math.max(1, window.innerWidth) * 2 - 1)), Math.max(-1, Math.min(1, 1 - e.clientY / Math.max(1, window.innerHeight) * 2)));
      pointerActive = 1;
      ensureLoop();
    };
    const onResize = () => { if (!contextLost) { resize(); ensureLoop(); } };
    const onLost = (event: Event) => {
      event.preventDefault();
      // The renderer sleeps below this world. Its last submitted camera pose
      // is not the reader's position in awards/cards/footer when loss occurs.
      // Snapshot native document progress before the fallback collapses flow.
      const unit = window.innerWidth < 820 ? window.innerHeight : window.innerWidth;
      const scrollU = Math.max(0, -sectionEl.getBoundingClientRect().top / Math.max(1, unit));
      contextRecoveryRef.current = { u: scrollU, time: sceneTime };
      contextLost = true;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      fallback("lost");
    };
    const onRestored = () => { if (!disposed) setSceneGeneration(n => n + 1); };
    const probe = () => ({ frames, u: lastU, time: sceneTime, pointer: pointerNDC.toArray(), pointerActive, pending: !!rafId,
      state: sectionEl.dataset.sceneState, explorer: referenceWorld.status, explorerScale: 1,
      teamYaw: sourceTeam.head.rotation.y, teamPitch: sourceTeam.head.rotation.x,
      teamAsset: sourceTeam.member, teamReady: sourceTeam.ready, teamMorph: sourceTeam.morph,
      teamMember: teamOverlayRef.current?.querySelector("#about-who-team-name")?.textContent?.trim() ?? null,
      count: referenceWorld.count, motionBackground: scenePost.velocityBackground(),
      portraitPoints: sourceTeam.count,
      streakCount: 0, qualityTier: tier, reducedMotion, frameTimes: [...frameTimes],
      draws: glRenderer.info.render.calls, triangles: glRenderer.info.render.triangles,
      memory: { ...glRenderer.info.memory }, width: glRenderer.domElement.width, height: glRenderer.domElement.height, camera: camera.position.toArray() });
    if (window.__enableAboutProbe) window.__aboutProbe = probe;
    glRenderer.domElement.addEventListener("webglcontextlost", onLost);
    glRenderer.domElement.addEventListener("webglcontextrestored", onRestored);

    const unsubscribeChrome = useStudioStore.subscribe((state, previous) => {
      if (state.menuOpen !== previous.menuOpen || state.reelOpen !== previous.reelOpen || state.isTransitioning !== previous.isTransitioning) ensureLoop();
    });
    const onScroll = () => {
      targetScrollY = window.scrollY;
      ensureLoop();
    };

    const onVisibility = () => {
      docVisible = document.visibilityState === "visible";
      if (!docVisible) {
        // A backgrounded browser may defer this callback indefinitely. Do not
        // leave a stale pending id that blocks a fresh request on return.
        if (rafId) window.cancelAnimationFrame(rafId);
        rafId = 0;
      } else {
        ensureLoop();
      }
    };

    resize();
    if (contextRecoveryRef.current) {
      const unit = window.innerWidth < 820 ? window.innerHeight : window.innerWidth;
      const y = sectionEl.getBoundingClientRect().top + window.scrollY + contextRecoveryRef.current.u * unit;
      const win = window as unknown as { __lenis?: { resize: () => void; scrollTo: (y: number, o: { immediate: boolean }) => void } };
      win.__lenis?.resize(); win.__lenis?.scrollTo(y, { immediate: true });
      window.scrollTo({ top: y, behavior: "instant" }); targetScrollY = smoothScrollY = y;
      contextRecoveryRef.current = null;
    }
    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointercancel", releasePointer);
    window.addEventListener("blur", releasePointer);
    document.documentElement.addEventListener("pointerleave", releasePointer);
    ensureLoop();

    return () => {
      disposed = true;
      if (requestSceneRenderRef.current === ensureLoop) requestSceneRenderRef.current = null;
      if (sourceTeamRef.current === sourceTeam) sourceTeamRef.current = null;
      unsubscribeChrome();
      if (window.__aboutProbe === probe) delete window.__aboutProbe;
      if (window.__lusionInspector?.scrollManager === ownedInspector && window.__lusionInspector) delete window.__lusionInspector.scrollManager;
      glRenderer.domElement.removeEventListener("webglcontextlost", onLost);
      glRenderer.domElement.removeEventListener("webglcontextrestored", onRestored);
      window.removeEventListener("pointercancel", releasePointer);
      window.removeEventListener("blur", releasePointer);
      document.documentElement.removeEventListener("pointerleave", releasePointer);
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);

      for (const item of disposables) {
        item.dispose();
      }
      glRenderer.dispose();
      glRenderer.forceContextLoss();
      if (glRenderer.domElement.parentElement === hostEl) {
        hostEl.removeChild(glRenderer.domElement);
      }
    };
  }, [reducedMotion, sceneGeneration]);

  return (
    <section
      ref={sectionRef}
      id="about-who"
      className="about-who-track relative w-full bg-[#000000] text-white"
    >
      {/* Retained local scroll span: `100vh + 950vw` on desktop, `1225vh` on mobile */}
      <style>{`
        .about-who-track {
          height: calc(100vh + 950vw);
        }
        .about-who-track[data-scene-state="unavailable"], .about-who-track[data-scene-state="lost"] { height: auto; }
        .about-who-track[data-scene-state="unavailable"] > .sticky, .about-who-track[data-scene-state="lost"] > .sticky { position: relative; height: auto; min-height: 100svh; }
        @media (max-width: 819px) {
          .about-who-track {
            height: 1225vh;
          }
        }
      `}</style>

      {/* Screen-Reader Accessible Complete Manifesto Heading & Copy */}
      <div className="sr-only">
        <h1>
          I AM JITHIN AN AI PRODUCT ENGINEER. BLENDING DESIGN, CODE &amp; 3D TO BUILD IMMERSIVE DIGITAL EXPERIENCES.
        </h1>
        <p lang="ja">プロンプトエンジニアリング、 AIエージェント向けスキルの設計・開発、 業務自動化。</p>
        <p lang="ja">ひらめきで終わらせず、動くかたちに。 試行錯誤を重ね、細部まで磨き上げ、 実際に使えるプロダクトへと仕上げる。</p>
      </div>

      {/* Sticky 100vh Full-Bleed WebGL + Architectural HUD Stage */}
      <div
        onTouchStart={(e) => {
          touchStartYRef.current = e.touches[0]?.clientY ?? null;
          touchStartXRef.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartXRef.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
          touchStartXRef.current = null;
          const dy = (e.changedTouches[0]?.clientY ?? 0) - (touchStartYRef.current ?? 0);
          if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.5 && Number(teamOverlayRef.current?.style.opacity) > .45) onStepMember(dx < 0 ? 1 : -1);
        }}
        onTouchCancel={() => { touchStartXRef.current = null; touchStartYRef.current = null; }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#0d0c0f]"
      >
        {/* Full-Bleed WebGL Canvas Host */}
        <div ref={canvasHostRef} className="absolute inset-0 h-full w-full" />
        <div ref={chromaticRingRef} aria-hidden="true" className="about-wide-chromatic-ring" />

        {/* Graceful Non-WebGL Atmospheric Fallback */}
        <div
          ref={fallbackPosterRef}
          style={{ display: "none" }}
          role="status"
          className="relative z-40 min-h-svh flex-col items-start justify-center gap-6 bg-[#0d0c0f] px-[var(--base-padding-x)] py-32"
        >
          <h2 className="max-w-3xl text-5xl">We are a creative production studio.</h2>
          <p className="max-w-xl text-xl">プロンプトエンジニアリング、AIエージェント向けスキルの設計・開発、業務自動化。 ひらめきで終わらせず、動くかたちに。試行錯誤を重ね、細部まで磨き上げ、実際に使えるプロダクトへと仕上げる。</p>
          <p>The interactive scene is unavailable. All studio information remains below; a restored graphics context will retry automatically.</p>
          <a className="underline" href="#about-clients">Continue to studio information</a>
          <ul>{team.map(member => <li key={member.id}>{member.name} — {member.rolePlain}</li>)}</ul>
        </div>

        {/* Constant 5 Mid-Viewport Horizontal Registration Crosses (`+  +  +  +  +`) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-[var(--base-padding-x)] top-1/2 z-20 flex -translate-y-1/2 items-center justify-between text-white/55"
        >
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
          <span className="lusion-plus-cross" />
        </div>

        {/* Layer 1: Monumental Solid `LUSION` Hero Wordmark (`about-01` & `about-02`) */}
        <div
          ref={heroWordmarkRef}
          data-about-opening-wordmark
          className="pointer-events-none absolute inset-x-[var(--base-padding-x)] bottom-4 z-20 will-change-transform"
        >
          <svg
            viewBox="0 0 1400 365"
            fill="none"
            aria-hidden="true"
            className="block h-auto w-full translate-y-[2.7vh] select-none"
          >
            <text
              x="-30"
              y="350"
              textLength="1454"
              lengthAdjust="spacingAndGlyphs"
              fill="#ffffff"
              fontFamily="LusionSansCalibrated, system-ui, sans-serif"
              fontSize="390"
              fontWeight="550"
            >
              JITHIN
            </text>
          </svg>

          <div
            ref={scrollPromptRef}
            className="mt-1 flex translate-y-[1.35vh] items-center justify-center min-[820px]:justify-end"
          >
            <span
              id="about-who-title-main-scroll"
              className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/95 min-[820px]:text-[1.65vw] min-[820px]:tracking-[-0.035em]"
            >
              {LUSION_ABOUT.who.scrollPrompt}
            </span>
          </div>
        </div>

        {/* Accessible/inspectable phase marker; the continuous glyph mesh is
            rendered by the existing world, not a second canvas or textPath. */}
        <div ref={sweepWordmarkRef} aria-hidden="true" data-about-wordmark-sweep
          data-wordmark-surface="continuous-mesh"
          style={{ opacity: 0, visibility: "hidden" }} className="pointer-events-none absolute inset-0" />

        {/* Layer 2: Horizontal `WE ARE A CREATIVE PRODUCTION STUDIO` Reveal (`u = 2.05 .. 4.35`) */}
        <div
          ref={manifestoOverlayRef}
          data-about-manifesto
          style={{ opacity: 0, visibility: "hidden" }}
          className="pointer-events-none absolute inset-x-[var(--base-padding-x)] bottom-10 min-[820px]:bottom-[5.7vh] z-20 grid grid-cols-1 gap-6 min-[820px]:grid-cols-12 will-change-transform"
        >
          <div id="about-who-title-left" className="min-[820px]:col-span-6">
            <h2 className="font-sans text-[9.6vw] font-[550] uppercase leading-[0.95] tracking-[-0.025em] text-white min-[820px]:text-[3.85vw] min-[820px]:leading-[1.19]">
              {["I AM", "JITHIN", "AN AI PRODUCT", "ENGINEER."].map((line, idx) => (
                <span
                  key={idx}
                  className={idx === 1 ? "block" : "block origin-left min-[820px]:scale-y-[1.15]"}
                  style={idx === 1 ? undefined : { translate: idx === 2 ? "-0.018em 0" : "-0.055em 0" }}
                >
                  {line}
                </span>
              ))}
            </h2>
          </div>
          <div className="flex items-end min-[820px]:col-span-6">
            <p
              id="about-who-title-right"
              className="w-full whitespace-pre-line font-sans text-right italic text-[5.6vw] font-normal uppercase leading-[1.06] tracking-[-0.02em] text-white/95 min-[820px]:text-[2.9vw] min-[820px]:leading-[1.19]"
            >
              {"BLENDING DESIGN, CODE & 3D\nTO BUILD IMMERSIVE\nDIGITAL EXPERIENCES."}
            </p>
          </div>
        </div>

        {/* Layer 3: Narrative HUD over Glowing 3D Topographic Contours (`about-03-details-hud`) */}
        <div
          ref={narrativeOverlayRef}
          style={{ opacity: 0, visibility: "hidden" }}
          data-about-narrative
          className="about-narrative-layout pointer-events-none absolute inset-x-[var(--base-padding-x)] top-[14vh] bottom-[6vh] z-20"
        >
          <p
            id="about-who-desc-top"
            lang="ja"
            aria-label="プロンプトエンジニアリング、 AIエージェント向けスキルの設計・開発、 業務自動化。"
            className="about-narrative-japanese text-[clamp(1.35rem,3.9vw,3.55rem)] font-normal leading-[1.35] tracking-[-0.02em] text-white"
          >
            {narrativeWords(["プロン", "プト", "エンジニア", "リング、"], 0, 0, false)}<br />
            {narrativeWords(["AIエージェント向け", "スキルの", "設計・開発、"], 4, 0, false)}<br />
            {narrativeWords(["業", "務", "自動", "化。"], 7, 0, false)}
          </p>
          <p
            id="about-who-desc-bottom"
            lang="ja"
            aria-label="ひらめきで終わらせず、動くかたちに。 試行錯誤を重ね、細部まで磨き上げ、 実際に使えるプロダクトへと仕上げる。"
            className="about-narrative-japanese text-[clamp(1.35rem,3.9vw,3.55rem)] font-normal leading-[1.35] tracking-[-0.02em] text-white"
          >
            {narrativeWords(["ひらめきで", "終わらせず、", "動くかたちに。"], 11, 0, false)}<br />
            {narrativeWords(["試行錯誤を", "重ね、", "細部まで", "磨き上げ、"], 14, 0, false)}<br />
            {narrativeWords(["実際に使える", "プロダクトへと", "仕上げる。"], 18, 0, false)}
          </p>
        </div>

        {/* Layer 4: Full-Bleed `T E A M` Hologram Stage (`about-04-team-hologram`) */}
        <div
          ref={teamOverlayRef}
          style={{ opacity: 0, visibility: "hidden" }}
          data-team-active="false"
          onPointerUp={event => {
            if (event.pointerType === "mouse" && event.target instanceof Element && !event.target.closest("button,a,input")) onStepMember(1);
          }}
          data-reduced={reducedMotion}
          className="about-who-team-overlay absolute inset-0 z-30 flex flex-col justify-between px-[var(--base-padding-x)] pb-8"
        >
          <div ref={teamCursorRef} className="about-team-cursor" aria-hidden="true">→</div>
          {/* Top Index Bar + Mobile Full-Width `T E A M` / Desktop Right-Aligned `T E A M` */}
          <div>
            {/* Mobile full-width spaced `T E A M` above index row (`390x844/about-04`) */}
            <div
              aria-hidden="true"
              data-team-hud-title className="mb-3 flex w-full items-center justify-between font-sans text-[19vw] font-normal uppercase leading-none text-white min-[820px]:hidden"
            >
              <span>T</span>
              <span>E</span>
              <span>A</span>
              <span>M</span>
            </div>

            <div className="flex items-start justify-between gap-4">
              <span
                data-team-compass="true"
                className="font-mono text-xs font-medium tracking-[0.22em] text-white"
              >
                [[ {activeMember.indexFormatted} ]]
              </span>

              {/* Precision tick ruler (`1440x900/about-04`) */}
              <span
                aria-hidden="true"
                data-team-ruler="true" className="hidden font-mono text-[10px] tracking-[0.42em] text-white/75 min-[820px]:inline-block"
              >
                |····|····|····|····|
              </span>

              {/* Interactive `2x7` / Dot-Matrix Specialist Selector + Desktop `T E A M` Title */}
              <div className="flex items-start gap-8">
                <div className="about-team-selector grid grid-cols-7 gap-1.5 pt-1">
                  {team.map((member, idx) => (
                    <button
                      key={member.id}
                      type="button"
                      aria-label={`Select ${member.name}`}
                      aria-pressed={idx === activeMemberIdx}
                      onClick={() => onSelectMember(idx)}
                      onKeyDown={event => {
                        if (event.key !== "Enter" && event.key !== " ") return;
                        event.preventDefault();
                        onSelectMember(idx);
                      }}
                      className="grid h-6 w-6 place-items-center rounded-full focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-0 focus-visible:outline-white"
                    >
                      <span
                        aria-hidden="true"
                        className={`block h-2 w-2 rounded-full transition-transform ${
                          idx === activeMemberIdx
                            ? "scale-125 bg-white"
                            : "bg-white/40 hover:bg-white/80"
                        }`}
                      />
                    </button>
                  ))}
                  {team.map((member, idx) => (
                    <span
                      key={`${member.id}-row2`}
                      aria-hidden="true"
                      className="grid h-6 w-6 place-items-center"
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${
                        idx === activeMemberIdx ? "bg-white/90" : "bg-white/30"
                      }`} />
                    </span>
                  ))}
                </div>

                <div
                  aria-hidden="true"
                  data-team-hud-title className="hidden items-center gap-6 font-sans text-[5.4vw] font-normal uppercase leading-[0.88] tracking-[0.06em] text-white min-[820px]:flex"
                >
                  <span>T</span>
                  <span>E</span>
                  <span>A</span>
                  <span>M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Specialist Bio Left + Translucent Specialist Monogram + Studio Copy Right */}
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="font-mono text-xs tracking-widest text-white/75">
                  ::
                </span>
                <h3 id="about-who-team-name" aria-live="polite" className="font-sans text-xl font-normal tracking-[-0.01em] text-white md:text-2xl">
                  {activeMember.name}
                </h3>
              </div>
              <p className="mt-1.5 font-mono text-[10px] uppercase leading-relaxed tracking-[0.08em] text-white/65 md:text-[11px]">
                {activeMember.roleLines.map((line, i) => (
                  <span key={i} className="block">
                    {line}
                  </span>
                ))}
              </p>
              <p className="mt-2 font-mono text-[9px] uppercase tracking-[0.16em] text-white/55 min-[820px]:hidden">
                {LUSION_ABOUT.who.mobileSwipeHint}
              </p>
              <div className="about-team-progress mt-3" aria-hidden="true">
                <span key={activeMemberIdx} className="about-team-progress-fill" />
              </div>
              <p className="sr-only" aria-live="polite">{sourceTeamState === "ready" ? `Original point portrait of ${activeMember.name}.` : sourceTeamState === "unavailable" ? "Team portrait unavailable." : "Loading team portrait."}</p>
            </div>

            <div className="flex items-end gap-6">
              <PixelGlyph
                char={activeMember.name[0]}
                className="hidden h-[max(56px,5vw)] w-auto opacity-90 min-[820px]:block"
              />

              <p
                id="about-who-team-desc-text"
                className="hidden max-w-[38ch] font-sans text-xs leading-relaxed text-white/85 min-[820px]:block"
              >
                {LUSION_ABOUT.who.teamDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Verified bundled brand artwork. Duplicate marquee copies remain hidden from AT. */
function ClientLogoTile({ name, src, id }: { name: string; src: string; id: string }) {
  // The supplied About recording identifies this mark as European Partners;
  // preserve the frozen manifest's provenance instead of rewriting its old label.
  const label = id === "cocacola" ? "Coca-Cola European Partners" : name;
  return (
    <div role="listitem" className="about-client-logo-tile flex h-24 min-w-0 flex-1 items-center justify-center overflow-hidden px-2 md:px-4">
      {/* Native SVG image preserves the verified mark's exact viewBox and linework. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={label} width={240} height={240} loading="lazy" decoding="async" className="about-client-logo-art" />
    </div>
  );
}

/** Keep decorative marquees off the compositor when the brand wall is off-screen. */
function AboutClientMarqueeLifecycle() {
  useEffect(() => {
    const rows = [...document.querySelectorAll<HTMLElement>("#about-clients .about-client-marquee")];
    if (!rows.length) return;
    if (!("IntersectionObserver" in window)) {
      rows.forEach(row => row.classList.add("is-in-view"));
      return;
    }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        (entry.target as HTMLElement).classList.toggle("is-in-view", entry.isIntersecting);
      }
    }, { rootMargin: "140px 0px", threshold: 0.01 });
    rows.forEach(row => observer.observe(row));
    return () => {
      observer.disconnect();
      rows.forEach(row => row.classList.remove("is-in-view"));
    };
  }, []);
  return null;
}

/** Historical-evidence reconstruction, not a claim of exact current live parity.
 * Sticky native Three world → brands → recognition → expertise → owned CTA/shared footer.
 * Authorized source team points replace the former personal-photo reconstruction;
 * the About CTA uses an original pressure-projected PIC/FLIP glyph liquid.
 */
export function AboutPageView() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  const darkUpperRef = useRef<HTMLDivElement>(null);
  const capabilityBandRef = useRef<HTMLElement>(null);
  const lastSurfaceRef = useRef<"ice" | "void" | "cobalt" | null>(null);
  const [activeMemberIdx, setActiveMemberIdx] = useState(0);

  const team = LUSION_ABOUT.who.team;

  // Measure only after reflow. Scroll frames compare cached document-space bounds,
  // so a fast wheel burst never forces three synchronous layouts per native event.
  useEffect(() => {
    let rafId = 0;
    let dirty = true;
    let disposed = false;
    const elements = [capabilityBandRef.current, darkUpperRef.current, document.getElementById("end-section")];
    let bands: ({ top: number; bottom: number } | null)[] = [];
    const capability = capabilityBandRef.current;
    const cardFaces = [...(capability?.querySelectorAll<HTMLElement>(".about-card-front") ?? [])];
    let cardBands: { top: number; bottom: number; left: number; right: number }[] = [];
    let logoSample = { x: 0, y: 0 };
    const syncHeaderSurface = () => {
      rafId = 0;
      if (document.hidden) return;
      const y = window.scrollY;
      if (dirty) {
        bands = elements.map((el) => {
          if (!el) return null;
          const rect = el.getBoundingClientRect();
          return { top: rect.top + y, bottom: rect.bottom + y };
        });
        // Reading-layout cards can pass underneath the fixed header. Sample
        // the wordmark's actual position, not only the blue section background.
        const logo = document.getElementById("header-logo")?.getBoundingClientRect();
        if (logo) logoSample = { x: logo.x + logo.width / 2, y: logo.y + logo.height / 2 };
        cardBands = cardFaces.map(face => {
          const rect = face.getBoundingClientRect();
          return { top: rect.top + y, bottom: rect.bottom + y, left: rect.left, right: rect.right };
        });
        dirty = false;
      }
      const line = y + window.innerHeight * 0.12;
      const [cap, dark, end] = bands;
      const covers = (band: { top: number; bottom: number } | null) => band && band.top <= line && band.bottom >= line;
      const overReadingCard = capability?.dataset.cardLayout === "reading" && cardBands.some(band =>
        band.top <= y + logoSample.y && band.bottom >= y + logoSample.y &&
        band.left <= logoSample.x && band.right >= logoSample.x);
      const nextSurface = overReadingCard ? "ice" : covers(cap) || covers(end) ? "cobalt" : dark && dark.bottom >= line ? "void" : "ice";
      if (lastSurfaceRef.current !== nextSurface) {
        lastSurfaceRef.current = nextSurface;
        setActiveSurface(nextSurface);
      }
    };
    const schedule = () => {
      if (!disposed && !rafId && !document.hidden) rafId = window.requestAnimationFrame(syncHeaderSurface);
    };
    const reflow = () => { dirty = true; schedule(); };
    const observer = new ResizeObserver(reflow);
    for (const el of elements) if (el) observer.observe(el);
    document.fonts.ready.then(reflow);
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", reflow, { passive: true });
    document.addEventListener("visibilitychange", reflow);
    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", reflow);
      document.removeEventListener("visibilitychange", reflow);
      lastSurfaceRef.current = null;
      setActiveSurface("ice");
    };
  }, [setActiveSurface]);


  const stepMember = (delta: number) => {
    soundEngine.playClick();
    setActiveMemberIdx((prev) => (prev + delta + team.length) % team.length);
  };

  const selectMember = (idx: number) => {
    soundEngine.playHover();
    setActiveMemberIdx(idx);
  };

  return (
    <main id="about" data-scene-version="about-reference-dynamics-v7" data-build-commit={process.env.NEXT_PUBLIC_BUILD_SHA ?? "development"} className="relative overflow-x-clip bg-[#0d0c0f] text-white">
      {/* Dark Studio Upper Monolith (`#about-who` + `#about-clients` + `#about-award`) */}
      <AboutPageStyles />
      <div ref={darkUpperRef} className="bg-[#0d0c0f] text-white">
        {/* =====================================================================
            1. 3D SPHERE VORTEX + CRATER LANDSCAPE + TOPOGRAPHIC HUD + TEAM (`#about-who`)
           ===================================================================== */}
        <AboutWhoExperience
          activeMemberIdx={activeMemberIdx}
          onStepMember={stepMember}
          onSelectMember={selectMember}
          reducedMotion={reducedMotion}
        />

        {/* =====================================================================
            2. BRANDS WE WORK WITH (`#about-clients` — 3 White SVG Logo Rows on `#000000`)
           ===================================================================== */}
        <section
          id="about-clients"
          className="border-t border-white/10 bg-[#0d0c0f] px-[var(--base-padding-x)] py-24 text-white min-[813px]:py-32"
        >
          <div className="grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:grid-cols-12">
            <div className="col-span-6 min-[813px]:col-span-7">
              <h2 className="font-sans text-[10vw] leading-[0.98] font-normal tracking-[-0.025em] text-white min-[813px]:text-[3.6vw]">
                {LUSION_ABOUT.clients.heading}
              </h2>
            </div>
            <div className="col-span-6 mt-5 flex items-center min-[813px]:col-start-9 min-[813px]:col-span-4 min-[813px]:mt-0">
              <p className="max-w-md font-sans text-xs leading-relaxed tracking-[0.05em] text-white/80 uppercase md:text-[13px]">
                {LUSION_ABOUT.clients.description}
              </p>
            </div>
          </div>

          <AboutClientMarqueeLifecycle />
          <div className="about-client-marquee-stack mt-16 flex flex-col gap-6 md:mt-20 md:gap-8">
            {LUSION_ABOUT.clients.carouselRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                role="list"
                className="about-client-marquee group"
                data-direction={rowIdx === 1 ? "reverse" : "forward"}
                style={{ "--marquee-duration": `${34 + rowIdx * 7}s` } as React.CSSProperties}
                aria-label={`Client brands row ${rowIdx + 1}`}
              >
                <div className="about-client-marquee-track">
                  {[0, 1, 2].map(copy => (
                    <div
                      key={copy}
                      className="about-client-marquee-set"
                      aria-hidden={copy > 0 ? true : undefined}
                    >
                      {row.map((client, cIdx) => (
                        <ClientLogoTile
                          key={`${copy}-${client.id}-${cIdx}`}
                          name={client.name}
                          id={client.id}
                          src={client.src}
                        />
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            3. RECOGNITION — consecutive awards, articles and talks in document flow
           ===================================================================== */}
        <AboutRecognition />
      </div>

      {/* =====================================================================
          4. AREA OF EXPERTISE (`#about-capability` — route-owned blue playing-card act)
         ===================================================================== */}
      <AboutExpertiseCards sectionRef={capabilityBandRef} reducedMotion={reducedMotion} />

      {/* =====================================================================
          5, 6 & 7. END CTA, STUDIO FOOTER & SCROLL PORTAL (`Our Projects` -> `/projects`)
         ===================================================================== */}
      <AboutContactSection />
      <StudioFooter nextHref="/projects" nextLabel={LUSION_ABOUT.scrollNav.targetTitle} />
    </main>
  );
}
