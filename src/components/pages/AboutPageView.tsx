"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { AboutExpertiseCards } from "@/components/pages/AboutExpertiseCards";
import { LUSION_ABOUT } from "@/data/reference";
import { aboutScenePose, aboutWordmarkSweepPose, aboutLetteringPose } from "@/lib/about-scene-motion";
import { buildSculpturalPortraitPositions } from "@/lib/about-portrait-geometry";
import { loadAboutPhotoPortrait, sampleAboutPhotoPortrait, type AboutPhotoPortrait } from "@/components/three/AboutPhotoPortrait";
import { createAboutPlume } from "@/components/three/AboutPlume";
import { createAboutExplorer } from "@/components/three/AboutExplorer";
import { upgradeAboutExplorer } from "@/components/three/AboutLicensedExplorer";
import { createAboutTerrainMaterial, createAboutGroundClasts, attachAboutGroundFlow, terrainHeightAt } from "@/components/three/AboutTerrain";
import { cinematicRenderDpr } from "@/lib/home-motion";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { AboutContactSection } from "@/components/pages/AboutContactSection";
import { AboutRecognition } from "@/components/pages/AboutRecognition";
import { AboutPageStyles } from "@/components/pages/AboutPageStyles";
import { createAboutWordmarkSweep } from "@/components/three/AboutWordmarkSweep";
import { createAboutBodyContours } from "@/components/three/AboutBodyContours";
import { StudioFooter } from "@/components/sections/StudioFooter";

declare global {
  interface Window {
    __enableAboutProbe?: boolean;
    __aboutProbe?: () => { frames: number; u: number; time: number; pointer: number[]; pointerActive: number; pending: boolean; state?: string; explorer?: string; explorerScale?: number; count: number; portraitPoints: number; streakCount: number; qualityTier: string; reducedMotion: boolean; frameTimes: number[]; draws: number; triangles: number; memory: { geometries: number; textures: number }; width: number; height: number; camera: number[] };
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
  const portraitCountRef = useRef(8192);
  const photoDataRef = useRef<AboutPhotoPortrait | null>(null);
  const [portraitLoaded, setPortraitLoaded] = useState(false);
  const fallbackPosterRef = useRef<HTMLDivElement | null>(null);
  const touchStartYRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const portraitMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const portraitGeoRef = useRef<THREE.BufferGeometry | null>(null);
  const requestSceneRenderRef = useRef<(() => void) | null>(null);

  const [sceneGeneration, setSceneGeneration] = useState(0);
  const contextRecoveryRef = useRef<{ u: number; time: number } | null>(null);
  const portraitMorphStartRef = useRef<number | null>(null);
  const memberRef = useRef(activeMemberIdx);
  const team = LUSION_ABOUT.who.team;
  const activeMember = team[activeMemberIdx] ?? team[0];
  const narrativeWords = (words: string[], offset: number, italicCount = 0) =>
    words.map((word, index) => (
      <React.Fragment key={offset + index}>
        {index > 0 ? " " : null}
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

  // Photo-derived portrait with an abstract fallback. A selection interpolates from
  // the currently visible point positions, so rapid selections remain interruptible.
  useEffect(() => {
    memberRef.current = activeMemberIdx;
    const geo = portraitGeoRef.current;
    if (!geo) return;
    const position = geo.getAttribute("position") as THREE.BufferAttribute;
    const from = geo.getAttribute("aMorphFrom") as THREE.BufferAttribute | undefined;
    if (!from) return;
    const currentMorph = portraitMatRef.current?.uniforms.uMorph.value ?? 1;
    for (let i = 0; i < position.array.length; i++) {
      from.array[i] = from.array[i] * (1 - currentMorph) + position.array[i] * currentMorph;
    }
    // Bake the currently visible GPU transport into the next start buffer.
    // Otherwise a rapid selection during assembly would jump back to its
    // undisplaced linear position before starting the next transition.
    const transport = Math.sin(clamp01(currentMorph) * Math.PI) * (portraitMatRef.current?.uniforms.uPhoto.value ?? 0);
    const oldShade = geo.getAttribute("aPhotoShade") as THREE.BufferAttribute;
    if (transport > 0) for (let i = 0; i < position.count; i++) {
      from.array[i * 3] += Math.sin(position.array[i * 3 + 1] * 7 + oldShade.array[i] * 11) * transport * .28;
      from.array[i * 3 + 2] += Math.cos(position.array[i * 3] * 9 + oldShade.array[i] * 13) * transport * .35;
    }
    from.needsUpdate = true;
    const photo = photoDataRef.current;
    const sampled = photo ? sampleAboutPhotoPortrait(photo, portraitCountRef.current, activeMemberIdx) : null;
    position.array.set(sampled?.positions ?? buildSculpturalPortraitPositions(activeMemberIdx, portraitCountRef.current));
    if (sampled) {
      const shade = geo.getAttribute("aPhotoShade") as THREE.BufferAttribute;
      shade.array.set(sampled.shades); shade.needsUpdate = true;
    }
    position.needsUpdate = true;
    geo.computeBoundingSphere();
    portraitMorphStartRef.current = -1;
    if (reducedMotion && portraitMatRef.current) {
      portraitMatRef.current.uniforms.uMorph.value = 1;
      portraitMorphStartRef.current = null;
    }
    // Reduced motion sleeps after each draw. Uploading new attributes alone
    // would leave the selected portrait stale until the next scroll/resize.
    // Reuse the owned scheduler: one static frame, not another animation loop.
    requestSceneRenderRef.current?.();
  }, [activeMemberIdx, reducedMotion]);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const hostEl = canvasHostRef.current;
    if (!sectionEl || !hostEl) return;

    let contextLost = false, disposed = false;
    const portraitRequest = new AbortController();
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
    if (fallbackPosterRef.current) fallbackPosterRef.current.style.display = "none";
    sectionEl.dataset.sceneState = "ready";
    const ctx = glRenderer.getContext(), debug = ctx.getExtension("WEBGL_debug_renderer_info");
    const software = debug ? /swiftshader|llvmpipe|software/i.test(String(ctx.getParameter(debug.UNMASKED_RENDERER_WEBGL))) : false;
    const tier = useStudioStore.getState().qualityTier;
    const count = reducedMotion ? 900 : software || window.innerWidth < 820 || tier === "low" ? 1800 : tier === "medium" ? 3200 : 4800;
    // Portrait quality stays bounded and independent from the plume's bead budget.
    portraitCountRef.current = reducedMotion || tier === "low" || window.innerWidth < 820 ? 8192
      : tier === "medium" ? 16384 : 32768;
    glRenderer.setClearColor(0x000302, 1);
    glRenderer.outputColorSpace = THREE.SRGBColorSpace;
    glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    glRenderer.toneMappingExposure = 1.05;
    glRenderer.domElement.style.width = "100%";
    glRenderer.domElement.style.height = "100%";
    glRenderer.domElement.style.display = "block";
    hostEl.appendChild(glRenderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [];
    const track = <T extends { dispose: () => void }>(item: T): T => {
      disposables.push(item);
      return item;
    };

    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x0d0c0f, 0.016);

    const camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 220);

    // Moody monochrome lunar lighting matching 'about-01' & 'about-02'
    const ambient = new THREE.AmbientLight(0xd4d9dd, .85);
    scene.add(ambient);

    const overheadBeamLight = new THREE.SpotLight(0xf1f5f9, 48, 52, Math.PI * 0.22, 0.85, 1.3);
    overheadBeamLight.position.set(0, 24, 1.5);
    overheadBeamLight.target.position.set(0, 0, 2.5);
    scene.add(overheadBeamLight);
    scene.add(overheadBeamLight.target);

    const coolRimLight = new THREE.DirectionalLight(0xe5edf1, 2.5);
    coolRimLight.position.set(-8, 14, 10);
    scene.add(coolRimLight);

    // -------------------------------------------------------------------------
    // 1. Original GPU filament field: instanced grains and seeded fine silver dust
    // -------------------------------------------------------------------------
    const plume = track(createAboutPlume(count));
    const sphereStorm = plume.group, stormMat = plume.material;
    // GPU-displaced points have a CPU sorting centre at the origin. Render the
    // transparent background first, not over the fine plume after its draw.
    sphereStorm.renderOrder = 1;
    scene.add(sphereStorm);

    // Soft Volumetric Core Haze & Vertical God-Ray Shaft ('about-01' & 'about-02'!)
    const godRayMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: {
          uOpacity: { value: 0 },
          uCyanCore: { value: 0.25 },
          uOpening: { value: 1 },
          uWide: { value: 0 },
        },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uOpacity;
          uniform float uCyanCore;
          uniform float uOpening;
          uniform float uWide;
          void main() {
            // A finite overhead emitter and widening cone, not a laser joining
            // the cloud to the ground. Its top naturally enters the wide shot.
            float x = (vUv.x - .5) * 38.;
            float y = vUv.y * 56. - 2.5;
            // Opening needs only a compact cloud veil. Avoid evaluating every
            // shaft/emitter Gaussian over the entire screen while their weight
            // is exactly zero; the later pullback still uses the full material.
            if (uOpening > .999) {
              float haze = exp(-pow(x / 3., 2.) - pow((y - 8.4) / 3., 2.));
              vec3 openingColor = mix(vec3(.74, .82, .85), vec3(.1, .95, 1.), uCyanCore) * haze * .15;
              float fade = smoothstep(-2.5, 0., y) * (1. - smoothstep(42., 53.5, y));
              gl_FragColor = vec4(openingColor, uOpacity * fade);
              #include <tonemapping_fragment>
              #include <colorspace_fragment>
              return;
            }
            float coneWidth = mix(3., .30, smoothstep(8., 23.2, y));
            float beam = exp(-pow(x / coneWidth, 2.)) * smoothstep(6., 10., y)
              * (1. - smoothstep(23.3, 24.4, y));
            float emitter = exp(-pow(x / .42, 2.) - pow((y - 23.2) / .42, 2.));
            float halo = exp(-pow(x / mix(1.6, 3.6, uWide), 2.)
              - pow((y - 23.2) / mix(2.6, 6.8, uWide), 2.));
            float cloudHaze = exp(-pow(x / 3., 2.) - pow((y - 8.4) / 3., 2.));
            float wideHaze = exp(-pow(x / 9., 2.)) * mix(.014, .035, uWide);
            float beamVeil = exp(-pow(x / (coneWidth * 2.4), 2.))
              * smoothstep(4., 11., y) * (1. - smoothstep(23.3, 25., y));
            float atmosphere = exp(-pow(x / 7., 2.) - pow((y - 19.) / 11., 2.));
            float vertFade = smoothstep(-2.5, 0., y) * (1. - smoothstep(42., 53.5, y));
            vec3 col = mix(vec3(.74, .82, .85), vec3(.1, .95, 1.), uCyanCore)
              * ((beam * .22 + beamVeil * .075 + emitter * 4. + halo * .30
                + atmosphere * .055 * uWide + wideHaze) * (1. - uOpening)
                + cloudHaze * mix(.15, .09, 1. - uOpening));
            gl_FragColor = vec4(col, uOpacity * vertFade);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    const godRayPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(38.0, 56.0)), godRayMat);
    godRayPlane.position.set(-.35, 25.5, -2.5);
    godRayPlane.renderOrder = -1;
    scene.add(godRayPlane);

    // -------------------------------------------------------------------------
    // 2. Sculpted 3D Crater Basin & Mountain Ridge Terrain ('about-02', 'about-03', 'about-04')
    // -------------------------------------------------------------------------
    const GRID = software || tier === "low" ? 136 : window.innerWidth < 820 ? 224 : 320;
    const SPAN = 96;
    const terrainGeo = track(new THREE.PlaneGeometry(SPAN, SPAN, GRID, GRID));
    terrainGeo.rotateX(-Math.PI * 0.5);
    const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
    // Spend vertices near the subject, not on the dark fading perimeter.
    // The software tier keeps its former triangle budget while the domain
    // expands for the distant shot. Height/contact/contours still share one field.
    const warp = (v: number) => {
      const t = v / (SPAN * .5);
      return t * 24 + Math.pow(t, 5) * 24;
    };
    for (let i = 0; i < tPos.count; i++) {
      const x = warp(tPos.getX(i)), z = warp(tPos.getZ(i));
      tPos.setXYZ(i, x, terrainHeightAt(x, z), z);
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = track(createAboutTerrainMaterial());
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    terrainMesh.renderOrder = -2;
    scene.add(terrainMesh);

    // -------------------------------------------------------------------------
    // 3. 36 Glowing 3D Topographic Elevation Contour Lines ('about-03' & 'about-04')
    // -------------------------------------------------------------------------
    const contourSegments: number[] = [];
    const C_GRID = 168;
    const step = SPAN / C_GRID;
    // Marching-squares iso-contour extraction across the exact 3D 'terrainHeightAt' grid!
    const hGrid = new Float32Array((C_GRID + 1) * (C_GRID + 1));
    for (let j = 0; j <= C_GRID; j++) {
      for (let i = 0; i <= C_GRID; i++) {
        const x = -SPAN * 0.5 + i * step;
        const z = -SPAN * 0.5 + j * step;
        hGrid[j * (C_GRID + 1) + i] = terrainHeightAt(x, z);
      }
    }

    const NUM_LEVELS = 36;
    for (let lv = 0; lv < NUM_LEVELS; lv++) {
      const iso = -1.2 + lv * 0.34;
      for (let j = 0; j < C_GRID; j++) {
        for (let i = 0; i < C_GRID; i++) {
          const i00 = hGrid[j * (C_GRID + 1) + i];
          const i10 = hGrid[j * (C_GRID + 1) + i + 1];
          const i01 = hGrid[(j + 1) * (C_GRID + 1) + i];
          const i11 = hGrid[(j + 1) * (C_GRID + 1) + i + 1];

          const x0 = -SPAN * 0.5 + i * step;
          const z0 = -SPAN * 0.5 + j * step;
          const pts: Array<[number, number]> = [];

          if ((i00 < iso) !== (i10 < iso)) {
            const t = (iso - i00) / (i10 - i00);
            pts.push([x0 + t * step, z0]);
          }
          if ((i10 < iso) !== (i11 < iso)) {
            const t = (iso - i10) / (i11 - i10);
            pts.push([x0 + step, z0 + t * step]);
          }
          if ((i01 < iso) !== (i11 < iso)) {
            const t = (iso - i01) / (i11 - i01);
            pts.push([x0 + t * step, z0 + step]);
          }
          if ((i00 < iso) !== (i01 < iso)) {
            const t = (iso - i00) / (i01 - i00);
            pts.push([x0, z0 + t * step]);
          }

          if (pts.length >= 2) {
            contourSegments.push(
              pts[0][0],
              iso + 0.045,
              pts[0][1],
              pts[1][0],
              iso + 0.045,
              pts[1][1]
            );
          }
        }
      }
    }

    const contourGeo = track(new THREE.BufferGeometry());
    contourGeo.setAttribute("position", new THREE.Float32BufferAttribute(contourSegments, 3));
    const contourMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uTeamPhase: { value: 0 },
        },
        vertexShader: `
          varying vec3 vPosW;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vPosW = wp.xyz;
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          uniform float uTime;
          uniform float uTeamPhase;
          varying vec3 vPosW;
          void main() {
            float wave = 0.55 + 0.45 * sin(vPosW.y * 2.4 - uTime * 1.4 + vPosW.x * 0.15);
            float distFade = 1.0 - smoothstep(10.0, 29.0, length(vPosW.xz - vec2(0.0, 4.0)));
            // In 'about-04-team-hologram', upper sky becomes pure deep '#000000' while lower-foreground ridges glow electric ice-blue!
            float lowerBand = smoothstep(2.2, 8.8, vPosW.z);
            float teamMask = mix(1.0, lowerBand, uTeamPhase);
            float ridgeGlow = smoothstep(-0.8, 3.2, vPosW.y) * 0.75 + 0.25;
            vec3 baseCol = mix(vec3(0.48, 0.56, 0.68), vec3(0.95, 0.98, 1.0), wave);
            vec3 causticCol = mix(vec3(0.42, 0.76, 1.0), vec3(0.92, 0.98, 1.0), pow(wave, 1.4)) * 1.28;
            vec3 col = mix(baseCol, causticCol, uTeamPhase);
            gl_FragColor = vec4(col, uOpacity * distFade * ridgeGlow * teamMask * (0.45 + wave * 0.55));
          }
        `,
      })
    );
    const contourLines = new THREE.LineSegments(contourGeo, contourMat);
    contourLines.visible = false;
    scene.add(contourLines);

    // -------------------------------------------------------------------------
    // 4. Lone White Explorer / Astronaut Figure Standing on Valley Floor ('about-02')
    // -------------------------------------------------------------------------
    const explorer = track(createAboutExplorer());
    const explorerGroup = explorer.group;
    // Feet, not the centre of a capsule, are anchored to the same basin function.
    explorerGroup.position.set(-.35, terrainHeightAt(-.35, -1.8) + .012, -1.8);
    scene.add(explorerGroup);
    // Reuse the project's permitted NASA suit, never a captured Lusion model.
    // The procedural suit and contact shadow remain a zero-network fallback.
    const licensedExplorer = track(upgradeAboutExplorer(explorerGroup, () => ensureLoop()));

    // -------------------------------------------------------------------------
    // 5. One instanced draw: 48 suspended stones and 272 grounded grains.
    // -------------------------------------------------------------------------
    const ROCK_COUNT = 224, FLOATING_ROCK_COUNT = 16;
    const rockGeo = track(new THREE.DodecahedronGeometry(0.24, 0));
    const rockMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x747d85,
        roughness: 0.86,
        metalness: 0.12,
        flatShading: true,
      })
    );
    const rocksMesh = track(new THREE.InstancedMesh(rockGeo, rockMat, ROCK_COUNT));
    const rockDummy = new THREE.Object3D();
    const rockSeeds = Array.from({ length: ROCK_COUNT }, (_, i) => {
      const floating = i < FLOATING_ROCK_COUNT;
      const ang = (i * 2.39996) % (Math.PI * 2);
      const rad = floating ? 1.6 + ((i * 29) % 100) / 100 * 9.5 : 1.2 + ((i * 37) % 100) / 100 * 8.5;
      const rx = floating ? Math.cos(ang) * rad : Math.sin(i * 7.31) * (2 + ((i * 37) % 100) * .095);
      const rz = floating ? 3.5 + Math.sin(ang) * rad * .72 : -11 + ((i * 43) % 100) * .39;
      const scale = floating ? .38 + ((i * 19) % 10) * .078 : .06 + Math.pow(((i * 17) % 100) / 100, 4) * .58;
      // Half-embed small clasts instead of lifting every size eight centimetres
      // above the floor. Concentrate the same population on the visible basin.
      const ry = floating
        ? 1.5 + ((i * 43) % 100) / 100 * 13.5
        : terrainHeightAt(rx, rz) + scale * .24 * .58 * .55;
      return {
        x: rx,
        y: ry,
        z: rz,
        floating,
        scale,
        phase: i * 0.73,
      };
    });
    // Seed rest transforms once. GPU flow transports the grounded population;
    // only the sixteen freely suspended rocks need CPU pose updates.
    for (let i = 0; i < ROCK_COUNT; i++) {
      const rs = rockSeeds[i];
      rockDummy.position.set(rs.x, rs.y, rs.z);
      rockDummy.rotation.set(rs.phase, rs.phase * 1.4, 0);
      rockDummy.scale.set(rs.scale * .7, rs.scale * (rs.floating ? .58 : .3), rs.scale * .5);
      rockDummy.updateMatrix(); rocksMesh.setMatrixAt(i, rockDummy.matrix);
      rocksMesh.setColorAt(i, new THREE.Color(rs.floating ? 0xb3bdc4 : 0x4e5458));
    }
    rocksMesh.instanceMatrix.needsUpdate = true;
    scene.add(rocksMesh);

    // Angular sediment is actual contact-anchored geometry, not black polka dots.
    // One bounded GPU-advected instanced draw; the aura carries grains outward and upward.
    const sediment = createAboutGroundClasts(software ? 1100 : window.innerWidth < 820 ? 1600 : 3200);
    const sedimentGeo = track(new THREE.IcosahedronGeometry(1, 0));
    const sedimentMaterial = track(rockMat.clone());
    const groundFlow = attachAboutGroundFlow(sedimentGeo, sedimentMaterial, sediment);
    const rockFlow = attachAboutGroundFlow(rockGeo, rockMat, rockSeeds.map(seed => ({
      x: seed.x, y: seed.y, z: seed.z, size: seed.scale * .24, aspect: .3, angle: seed.phase,
    })), FLOATING_ROCK_COUNT);
    const sedimentMesh = track(new THREE.InstancedMesh(sedimentGeo, sedimentMaterial, sediment.length));
    sedimentMesh.frustumCulled = false;
    for (let i = 0; i < sediment.length; i++) {
      const stone = sediment[i];
      rockDummy.position.set(stone.x, stone.y, stone.z);
      rockDummy.rotation.set(0, stone.angle, .12 * Math.sin(stone.angle));
      rockDummy.scale.set(stone.size, stone.size * stone.aspect, stone.size * (1.1 + .3 * Math.sin(stone.angle)));
      rockDummy.updateMatrix(); sedimentMesh.setMatrixAt(i, rockDummy.matrix);
      sedimentMesh.setColorAt(i, new THREE.Color().setScalar(.36 + .3 * (i % 17) / 16));
    }
    sedimentMesh.instanceMatrix.needsUpdate = true;
    scene.add(sedimentMesh);
    const wordmarkSweep = track(createAboutWordmarkSweep());
    scene.add(wordmarkSweep.mesh);
    document.fonts.ready.then(() => {
      if (!disposed) { wordmarkSweep.repaint(); ensureLoop(); }
    });

    // -------------------------------------------------------------------------
    // 6. 8,192-Vertex 3D Point-Cloud Team Portrait Stage ('about-04-team-hologram')
    // -------------------------------------------------------------------------
    const portraitGeo = track(new THREE.BufferGeometry());
    const cachedPhoto = photoDataRef.current ? sampleAboutPhotoPortrait(photoDataRef.current, portraitCountRef.current, memberRef.current) : null;
    const initialPortrait = cachedPhoto?.positions ?? buildSculpturalPortraitPositions(memberRef.current, portraitCountRef.current);
    portraitGeo.setAttribute("position", new THREE.BufferAttribute(initialPortrait, 3));
    portraitGeo.setAttribute("aMorphFrom", new THREE.BufferAttribute(initialPortrait.slice(), 3));
    portraitGeo.setAttribute("aPhotoShade", new THREE.BufferAttribute(cachedPhoto?.shades ?? new Float32Array(portraitCountRef.current).fill(.75), 1));
    portraitGeoRef.current = portraitGeo;
    sectionEl.dataset.teamPortraitSource = "procedural-study";

    const portraitMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uMorph: { value: 1 },
          uPhoto: { value: 0 },
          uReveal: { value: 0 },
          uPhotoPointSize: { value: reducedMotion ? 2.8 : 2.3 },
          uViewportHeight: { value: window.innerHeight },
          uPixelRatio: { value: 1 },
          uPointerNDC: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPixelRatio;
          uniform float uMorph;
          uniform float uPhoto, uViewportHeight, uReveal, uPhotoPointSize;
          attribute float aPhotoShade;
          uniform vec2 uPointerNDC;
          attribute vec3 aMorphFrom;
          varying float vDepth;
          varying float vShade;
          varying float vBirth;
          varying float vGlint;
          void main() {
            vec3 p = mix(aMorphFrom, position, clamp(uMorph, 0.0, 1.0));
            // An interruptible outward transport builds the photo from grains,
            // on the existing clock. No CPU particle integration or extra RAF.
            float assembly = sin(clamp(uMorph, 0., 1.) * 3.14159265) * uPhoto;
            p.x += sin(position.y * 7. + aPhotoShade * 11.) * assembly * .28;
            p.z += cos(position.x * 9. + aPhotoShade * 13.) * assembly * .35;
            // Pointer repulsion bends only nearby grains; the silhouette remains readable.
            vec2 pointerDelta = p.xy - uPointerNDC * vec2(.82, 1.34);
            float pointerInfluence = exp(-dot(pointerDelta, pointerDelta) * 5.2);
            p.xy += normalize(pointerDelta + vec2(.0001)) * pointerInfluence * .032;
            // Scan motion is small enough to retain eyes, lips and hair detail.
            p.x += sin(p.y * 8.0 + uTime * 2.1) * 0.004;
            p.z += cos(p.x * 6.0 + uTime * 1.6) * 0.015;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vDepth = -mv.z;
            vec3 normal = normalize(vec3(p.x * 1.6, p.y * .55, .55));
            vec3 light = normalize(vec3(.9 + uPointerNDC.x * 1.8, .3 + uPointerNDC.y * .8, .6));
            float illumination = .35 + .65 * max(0., dot(normal, light));
            vShade = mix(clamp(p.z * .85 + .42, .12, 1.), pow(aPhotoShade, 1.2) * illumination, uPhoto);
            vGlint = pow(max(0., dot(normal, normalize(light + vec3(0.,0.,1.)))), 38.) * .24 * aPhotoShade;
            vBirth = smoothstep(clamp((position.y + 1.55) / 3.1,0.,1.) - .18,
              clamp((position.y + 1.55) / 3.1,0.,1.) + .10, uReveal);
            float dof = 1.0 + abs(p.z - 0.35) * 2.2;
            gl_PointSize = mix(2.45 * dof, uPhotoPointSize * clamp(uViewportHeight / 900., .85, 2.4), uPhoto) * uPixelRatio;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying float vShade;
          varying float vBirth;
          varying float vGlint;
          void main() {
            vec2 d = gl_PointCoord - 0.5;
            float r = length(d);
            if (r > 0.5) discard;
            float soft = smoothstep(0.5, 0.08, r);
            vec3 col = mix(vec3(.025,.035,.04), vec3(.72,.80,.83), vShade) + vGlint;
            gl_FragColor = vec4(col, soft * uOpacity * (.25 + .75 * vShade) * vBirth);
            #include <tonemapping_fragment>
            #include <colorspace_fragment>
          }
        `,
      })
    );
    portraitMatRef.current = portraitMat;

    let portraitLastTime = 0, teamAssemblyStart = -1, teamWasVisible = false;
    const portraitPoints = new THREE.Points(portraitGeo, portraitMat);
    portraitPoints.visible = false;
    scene.add(portraitPoints);
    const bodyContours = track(createAboutBodyContours());
    bodyContours.group.visible = false; scene.add(bodyContours.group);
    // Keep the previous buffers alive on photo arrival, selection and recovery.
    // The original photograph is never fetched by the browser.
    Promise.resolve(photoDataRef.current ?? loadAboutPhotoPortrait(portraitRequest.signal)).then(data => {
      if (disposed) return;
      photoDataRef.current = data;
      const sampled = sampleAboutPhotoPortrait(data, portraitCountRef.current, memberRef.current);
      const position = portraitGeo.getAttribute("position") as THREE.BufferAttribute;
      const from = portraitGeo.getAttribute("aMorphFrom") as THREE.BufferAttribute;
      const shade = portraitGeo.getAttribute("aPhotoShade") as THREE.BufferAttribute;
      from.array.set(position.array); from.needsUpdate = true;
      position.array.set(sampled.positions); position.needsUpdate = true;
      shade.array.set(sampled.shades); shade.needsUpdate = true;
      portraitGeo.computeBoundingSphere();
      portraitMat.uniforms.uPhoto.value = 1;
      portraitMat.uniforms.uMorph.value = reducedMotion || cachedPhoto ? 1 : 0;
      portraitMorphStartRef.current = reducedMotion || cachedPhoto ? null : -1;
      sectionEl.dataset.teamPortraitSource = "jithin-photo-relief";
      setPortraitLoaded(true);
      ensureLoop();
    }).catch(() => {
      if (!disposed && !portraitRequest.signal.aborted) sectionEl.dataset.teamPortraitSource = "photo-unavailable-abstract-fallback";
    });

    // Original depth-layered vertical light field, sharing the portrait clock.
    // These are abstract atmosphere, never a replacement claim for an employee likeness.
    const streakCount = 144;
    const lightPositions = new Float32Array(streakCount * 6);
    for (let i = 0; i < streakCount; i++) {
      const x = (i / (streakCount - 1) - .5) * 10.5;
      const z = Math.sin(i * 17.31) * 1.2 - .6;
      const bottom = -4.8 + Math.sin(i * 9.1) * .4;
      const top = 4.5 + Math.cos(i * 4.7) * .75;
      lightPositions.set([x, bottom, z, x, top, z], i * 6);
    }
    const lightGeometry = track(new THREE.BufferGeometry());
    lightGeometry.setAttribute("position", new THREE.BufferAttribute(lightPositions, 3));
    const lightMaterial = track(new THREE.ShaderMaterial({
      uniforms: portraitMat.uniforms, transparent: true, depthWrite: false,
      blending: THREE.AdditiveBlending,
      vertexShader: `varying vec3 vLocal; void main() { vLocal = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
      fragmentShader: `uniform float uTime, uOpacity; varying vec3 vLocal;
        void main() {
          float envelope = smoothstep(-2.4, -1.2, vLocal.y) * (1. - smoothstep(1.8, 3.3, vLocal.y));
          float scan = pow(.5 + .5 * sin(vLocal.y * 72. - uTime * .65 + vLocal.x * 17.), 18.);
          float edge = .25 + .75 * smoothstep(.3, 1.6, abs(vLocal.x));
          gl_FragColor = vec4(mix(vec3(.35,.42,.54), vec3(.75,.85,1.), scan), envelope * edge * (.003 + scan * .11) * uOpacity);
        }`,
    }));
    const portraitLightField = new THREE.LineSegments(lightGeometry, lightMaterial);
    portraitLightField.visible = false;
    scene.add(portraitLightField);


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
    const raycaster = new THREE.Raycaster();
    const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const pointerWorld = new THREE.Vector3(0, 8.35, 0);
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
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      portraitMat.uniforms.uPixelRatio.value = dpr;
      portraitMat.uniforms.uViewportHeight.value = H;
      stormMat.uniforms.uPixelRatio.value = dpr;
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
      // Positions are still-led original framing; live-source timing is unverified.
      // -----------------------------------------------------------------------
      const pose = aboutScenePose(u, isMobile);
      const tPullback = pose.pullback;
      const tTeamPhase = pose.team;
      const { x: camX, y: camY, z: camZ, lookY } = pose;

      camera.fov = isMobile ? 54 : 45;
      camera.position.set(camX, camY, camZ);
      camera.lookAt(0, lookY, 0);
      camera.updateProjectionMatrix();

      // Update 3D pointer projection for live sphere repulsion
      if (pointerActive > 0.01) {
        raycaster.setFromCamera(pointerNDC, camera);
        raycaster.ray.intersectPlane(pointerPlane, pointerWorld);
      }

      // 1. Sphere storm uniforms
      const stormVis = 1 - smoothstep(3.35, 4.45, u);
      sphereStorm.visible = stormVis > 0.01;
      if (sphereStorm.visible) {
        stormMat.uniforms.uTime.value = reducedMotion ? 0.5 : elapsedSec;
        stormMat.uniforms.uCompact.value = tPullback;
        // Focus follows the existing camera, rather than leaving distant grains
        // defocused and oversized as if the opening shot were still active.
        stormMat.uniforms.uFocusDistance.value = Math.hypot(camX + .35, camY - 8.4, camZ);
        stormMat.uniforms.uMobile.value = isMobile ? 1.0 : 0.0;
        stormMat.uniforms.uPointer.value.copy(pointerWorld);
        stormMat.uniforms.uPointerStrength.value = pointerActive;
        stormMat.uniforms.uCyanBoost.value = isMobile ? .16 : 0;
        stormMat.uniforms.uOpacity.value = stormVis;
      }

      // 2. Vertical volumetric God-Ray column & Valley Terrain & Explorer & Floating Rocks ('about-02')
      const landscapeVis = smoothstep(0.30, 1.05, u);
      const darkHudFade = 1 - smoothstep(3.45, 4.55, u);
      const atmosphereVis = Math.max(landscapeVis, (1 - landscapeVis) * .34) * stormVis;
      godRayPlane.visible = atmosphereVis > 0.01;
      godRayMat.uniforms.uOpacity.value = atmosphereVis * 0.85;
      godRayMat.uniforms.uOpening.value = 1 - landscapeVis;
      godRayMat.uniforms.uWide.value = smoothstep(30, 65, camZ);
      godRayMat.uniforms.uCyanCore.value = isMobile ? .20 : 0;

      // The reference opening already has a readable, near-black basin rim behind
      // the silver plume. Reveal the terrain silhouette independently from the
      // astronaut and god-ray beat: the world should not begin as a floating
      // particle-only void. The full landscape, explorer and shaft still arrive
      // on the later pullback cue.
      const terrainReveal = lerp(.04, 1, smoothstep(.12, .92, u));
      // Team mode returns to black to preserve portrait contrast.
      const narrativeGround = (1 - tTeamPhase) * .22;
      const terrainVis = terrainReveal * Math.max(darkHudFade, narrativeGround);
      // Do not shade a full terrain pass at four-percent opacity behind the
      // opening lettering. It enters with the existing pullback reveal.
      terrainMesh.visible = terrainVis > .05;
      terrainMat.uniforms.uOpacity.value = terrainVis;
      terrainMat.uniforms.uValleyBrightness.value = lerp(.16, 1, darkHudFade);

      const explorerVis = landscapeVis * (1 - smoothstep(3.3, 4.3, u));
      explorerGroup.visible = explorerVis > 0.02;
      // Scale here, not just at mount: this authoritative render assignment
      // otherwise silently overwrites the corrected historical-frame size.
      // The feet remain fixed throughout both basin camera distances.
      explorerGroup.scale.setScalar(isMobile ? 1.0 : 1.33);
      if (explorerGroup.visible) {
        explorer.pose(elapsedSec, pointerNDC.x, pointerNDC.y, reducedMotion);
        licensedExplorer.pose(pointerNDC.x, pointerNDC.y, reducedMotion);
      }

      rocksMesh.visible = explorerVis > 0.02;
      sedimentMesh.visible = rocksMesh.visible;
      groundFlow.uGroundTime.value = elapsedSec;
      groundFlow.uGroundMotion.value = reducedMotion ? 0 : 1;
      rockFlow.uGroundTime.value = elapsedSec;
      rockFlow.uGroundMotion.value = reducedMotion ? 0 : 1;
      if (rocksMesh.visible) {
        for (let i = 0; i < FLOATING_ROCK_COUNT; i++) {
          const rs = rockSeeds[i];
          const bob = rs.floating && !reducedMotion ? Math.sin(elapsedSec * 0.9 + rs.phase) * 0.22 : 0;
          rockDummy.position.set(rs.x, rs.y + bob, rs.z);
          rockDummy.rotation.set(
            rs.phase + (reducedMotion ? 0 : elapsedSec * 0.25),
            rs.phase * 1.4 + (reducedMotion ? 0 : elapsedSec * 0.18),
            0
          );
          rockDummy.scale.setScalar(rs.scale * 0.58);
          rockDummy.updateMatrix();
          rocksMesh.setMatrixAt(i, rockDummy.matrix);
        }
        rocksMesh.instanceMatrix.addUpdateRange(0, FLOATING_ROCK_COUNT * 16);
        rocksMesh.instanceMatrix.needsUpdate = true;
      }

      // 3. 36 Topographic Elevation Contour Lines ('about-03' & 'about-04')
      const contourVis = smoothstep(3.75, 4.85, u);
      contourLines.visible = contourVis > 0.01 && tTeamPhase < .99;
      if (contourLines.visible) {
        contourMat.uniforms.uOpacity.value = contourVis * lerp(.42, .12, tTeamPhase);
        contourMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
        contourMat.uniforms.uTeamPhase.value = tTeamPhase;
      }

      // 4. Subtle Lower-Pedestal Team Hologram Shimmer ('about-04' — upper sky kept pure deep `#000000`!)
      portraitPoints.visible = tTeamPhase > 0.02;
      portraitLightField.visible = portraitPoints.visible;
      bodyContours.group.visible = portraitPoints.visible;
      bodyContours.uniforms.uOpacity.value = tTeamPhase;
      bodyContours.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
      if (portraitPoints.visible && !teamWasVisible) teamAssemblyStart = elapsedSec;
      teamWasVisible = portraitPoints.visible;
      portraitMat.uniforms.uReveal.value = reducedMotion || cachedPhoto ? 1.15
        : 1.15 * smoothstep(0, .9, Math.max(0, elapsedSec - teamAssemblyStart));
      if (portraitPoints.visible) {
        if (reducedMotion) {
          portraitMat.uniforms.uMorph.value = 1;
          portraitMorphStartRef.current = null;
        } else if (portraitMorphStartRef.current !== null) {
          if (portraitMorphStartRef.current < 0) portraitMorphStartRef.current = elapsedSec;
          const morphT = Math.max(0, Math.min(1, (elapsedSec - portraitMorphStartRef.current) / .58));
          portraitMat.uniforms.uMorph.value = 1 - Math.pow(1 - morphT, 3);
          if (morphT >= 1) portraitMorphStartRef.current = null;
        }
        portraitMat.uniforms.uOpacity.value = tTeamPhase * .95;
        portraitMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
        portraitMat.uniforms.uPointerNDC.value.copy(pointerNDC);
        // One damped whole-form target combines cursor tilt and subtle idle drift.
        // Do not follow this with a direct rotation.set(): it would overwrite the easing.
        const portraitTilt = reducedMotion ? 0 : 1;
        const targetPitch = pointerNDC.y * -0.10 * portraitTilt;
        const targetYaw = pointerNDC.x * 0.14 * portraitTilt + Math.sin(elapsedSec * 0.45) * (reducedMotion ? 0 : 0.05);
        const portraitDamping = 1 - Math.exp(-12 * Math.min(.1, Math.max(0, elapsedSec - portraitLastTime)));
        portraitLastTime = elapsedSec;
        portraitPoints.rotation.x = THREE.MathUtils.lerp(portraitPoints.rotation.x, targetPitch, portraitDamping);
        portraitPoints.rotation.y = THREE.MathUtils.lerp(portraitPoints.rotation.y, targetYaw, portraitDamping);
        portraitPoints.rotation.z = 0;
        portraitPoints.scale.setScalar(isMobile ? .70 : .80);
        portraitPoints.position.set(
          camera.position.x + (isMobile ? -0.12 : -1.0),
          camera.position.y - (isMobile ? 2.10 : 1.92),
          camera.position.z - 5.8
        );
        portraitLightField.position.copy(portraitPoints.position);
        bodyContours.group.position.copy(portraitPoints.position);
        bodyContours.group.rotation.copy(portraitPoints.rotation);
        bodyContours.group.scale.copy(portraitPoints.scale).multiplyScalar(isMobile ? 1.05 : 1.32);
      }

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
        const scale = .8 + Math.min(.6, pointerActive * .5);
        teamCursorRef.current.style.transform = `translate3d(${x - 52}px,${y - 52}px,0) scale(${scale})`;
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
      wordmarkSweep.mesh.visible = sweep.opacity > .005;
      wordmarkSweep.uniforms.uOpacity.value = sweep.opacity;
      wordmarkSweep.uniforms.uPhase.value = sweep.deformation;
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
        manifestoOverlayRef.current.style.transform = `translate3d(${lerp(4, 0, smoothstep(isMobile ? 1.95 : 1.1, isMobile ? 2.42 : 1.6, u))}vw, 0, 0)`;
      }

      // C. Studio Narrative HUD: each word owns a deterministic scroll window.
      // No React state or per-frame DOM queries; the same playhead drives reverse fade/slide.
      if (narrativeOverlayRef.current) {
        const exit = smoothstep(5.82, 6.42, u);
        const narVis = lettering.narrative;
        narrativeOverlayRef.current.style.opacity = "1";
        narrativeOverlayRef.current.style.visibility = narVis > 0.005 ? "visible" : "hidden";
        narrativeOverlayRef.current.style.transform = `translate3d(${-7 * exit}vw,0,0)`;
        for (let i = 0; i < narrativeWordRefs.current.length; i++) {
          const word = narrativeWordRefs.current[i];
          if (!word) continue;
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

      glRenderer.render(scene, camera);
      frames++;
    };

    const tick = () => {
      rafId = 0;
      if (!docVisible || disposed || contextLost || chromeBlocked()) return;
      const now = performance.now(), elapsed = Math.max(0, (now - lastTime) / 1000), dt = Math.min(.08, elapsed);
      lastTime = now;
      const rect = sectionEl.getBoundingClientRect();
      if (rect.bottom <= 0 || rect.top >= window.innerHeight) return;
      // Analytical shaders/reveals follow active elapsed time even on slow GPUs.
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
      if (!rafId && docVisible && !disposed && !contextLost && !chromeBlocked()) {
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
      state: sectionEl.dataset.sceneState, explorer: licensedExplorer.status, explorerScale: explorerGroup.scale.x,
      teamYaw: portraitPoints.rotation.y, teamPitch: portraitPoints.rotation.x,
      teamMember: teamOverlayRef.current?.querySelector("#about-who-team-name")?.textContent?.trim() ?? null,
      count,
      portraitPoints: (portraitGeoRef.current?.getAttribute("position") as THREE.BufferAttribute | undefined)?.count ?? 0,
      streakCount, qualityTier: tier, reducedMotion, frameTimes: [...frameTimes],
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
      portraitRequest.abort();
      unsubscribeChrome();
      if (window.__aboutProbe === probe) delete window.__aboutProbe;
      if (window.__lusionInspector?.scrollManager === ownedInspector && window.__lusionInspector) delete window.__lusionInspector.scrollManager;
      portraitGeoRef.current = null; portraitMatRef.current = null;
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
          Lusion — {LUSION_ABOUT.who.leftLines.join(" ")} {LUSION_ABOUT.who.rightHeadline}
        </h1>
        <p>{LUSION_ABOUT.who.detailsTop}</p>
        <p>{LUSION_ABOUT.who.detailsBottom}</p>
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
          <p className="max-w-xl text-xl">A worldwide team of specialists in design, motion, 3D, and technology working together to turn ambitious ideas into immersive digital experiences.</p>
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
              fontWeight="450"
            >
              LUSION
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
            <h2 className="font-sans text-[9.6vw] font-normal uppercase leading-[0.95] tracking-[-0.025em] text-white min-[820px]:text-[3.85vw] min-[820px]:leading-[1.19]">
              {[LUSION_ABOUT.who.leftLines[0], "LUSION", ...LUSION_ABOUT.who.leftLines.slice(1)].map((line, idx) => (
                <span key={idx} className={idx === LUSION_ABOUT.who.leftLines.length ? "block italic" : "block"}>
                  {line}
                </span>
              ))}
            </h2>
          </div>
          <div className="flex items-end min-[820px]:col-span-6">
            <p
              id="about-who-title-right"
              className="w-full whitespace-pre-line font-sans text-right italic text-[5.6vw] font-normal uppercase leading-[1.06] tracking-[-0.02em] text-white/95 min-[820px]:text-[3.85vw] min-[820px]:leading-[1.19]"
            >
              {LUSION_ABOUT.who.rightHeadline.replace(" DIGITAL", "\nDIGITAL")}
            </p>
          </div>
        </div>

        {/* Layer 3: Narrative HUD over Glowing 3D Topographic Contours (`about-03-details-hud`) */}
        <div
          ref={narrativeOverlayRef}
          style={{ opacity: 0, visibility: "hidden" }}
          data-about-narrative
          className="pointer-events-none absolute inset-x-[var(--base-padding-x)] top-[14vh] bottom-[6vh] z-20 flex flex-col items-center justify-center text-center"
        >
          <p
            id="about-who-desc-top"
            aria-label="A worldwide team of specialists in design, motion, 3D, and technology"
            className="font-sans text-[clamp(1.35rem,3.9vw,3.55rem)] font-normal leading-[1.12] tracking-[-0.02em] text-white"
          >
            {narrativeWords(["A", "worldwide", "team", "of"], 0, 3)}<br />
            {narrativeWords(["specialists", "in", "design,"], 4)}<br />
            {narrativeWords(["motion,", "3D,", "and", "technology"], 7)}
          </p>
          <p
            id="about-who-desc-bottom"
            aria-label="working together to turn ambitious ideas into immersive digital experiences."
            className="font-sans text-[clamp(1.35rem,3.9vw,3.55rem)] font-normal leading-[1.12] tracking-[-0.02em] text-white"
          >
            {narrativeWords(["working", "together", "to"], 11)}<br />
            {narrativeWords(["turn", "ambitious", "ideas", "into"], 14)}<br />
            {narrativeWords(["immersive", "digital"], 18)}<br />
            {narrativeWords(["experiences."], 20)}
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
          <div ref={teamCursorRef} className="about-team-cursor" aria-hidden="true">↗</div>
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
                className="hidden font-mono text-[10px] tracking-[0.42em] text-white/75 min-[820px]:inline-block"
              >
                |····|····|
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
              {portraitLoaded ? <p className="mt-2 font-mono text-[9px] uppercase tracking-[.12em] text-white/65">Portrait: Jithin · photo-derived particle study</p> : null}
              {portraitLoaded ? <p className="sr-only">Particle bas-relief of Jithin from the supplied photo, not a photograph of {activeMember.name}. Depth is estimated, not a 3D scan.</p> : <p className="sr-only">Abstract procedural visualization; not a likeness of {activeMember.name}.</p>}
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

/** Accessible text-only brand names; no captured logo artwork is requested.
 * The second marquee copy is hidden from assistive technology.
 */
function ClientLogoTile({ name }: { name: string }) {
  return (
    <div role="listitem" className="about-client-logo-tile flex h-24 min-w-0 flex-1 items-center justify-center overflow-hidden px-2 md:px-4">
      <span className="about-client-wordmark" aria-label={name} data-brand={name}>
        {name}
      </span>
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
 * The supplied Jithin portrait and procedural geometry replace restricted capture data;
 * the About CTA uses an original analytical glyph wave, not a FLIP solver.
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

  useEffect(() => {
    const award = document.getElementById("about-award");
    const word = award?.querySelector<HTMLElement>("[data-awards-word]");
    const revealTargets = award ? [...award.querySelectorAll<HTMLElement>("[data-award-reveal]")] : [];
    let revealObserver: IntersectionObserver | null = null;
    if (award && !reducedMotion && "IntersectionObserver" in window && revealTargets.length) {
      award.dataset.awardsMotionReady = "true";
      revealObserver = new IntersectionObserver(entries => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          (entry.target as HTMLElement).classList.add("is-in-view");
          revealObserver?.unobserve(entry.target);
        }
      }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
      revealTargets.forEach(target => revealObserver?.observe(target));
    }
    let raf = 0, dirty = true, disposed = false, awardTop = 0;
    const measure = (el: HTMLElement | null) => el ? el.getBoundingClientRect().top + window.scrollY : 0;
    const render = () => {
      raf = 0;
      if (document.hidden) return;
      if (dirty) { awardTop = measure(award); dirty = false; }
      const vh = Math.max(1, window.innerHeight), y = window.scrollY;
      const awardsP = reducedMotion ? .5 : clamp01((y - awardTop + vh) / (vh * 2));
      if (award) award.style.setProperty("--recognition-progress", String(clamp01((y - awardTop) / Math.max(1, award.offsetHeight - vh))));
      if (word) word.style.transform = `translate3d(${lerp(3, -3, awardsP)}%,0,0)`;

    };
    const schedule = () => { if (!disposed && !raf && !document.hidden) raf = requestAnimationFrame(render); };
    const reflow = () => { dirty = true; schedule(); };
    const ro = new ResizeObserver(reflow);
    if (award) ro.observe(award);
    document.fonts.ready.then(reflow); schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", reflow, { passive: true });
    document.addEventListener("visibilitychange", reflow);
    return () => {
      disposed = true; cancelAnimationFrame(raf); ro.disconnect(); revealObserver?.disconnect();
      if (award) delete award.dataset.awardsMotionReady;
      window.removeEventListener("scroll", schedule); window.removeEventListener("resize", reflow);
      document.removeEventListener("visibilitychange", reflow);
    };
  }, [reducedMotion]);

  const stepMember = (delta: number) => {
    soundEngine.playClick();
    setActiveMemberIdx((prev) => (prev + delta + team.length) % team.length);
  };

  const selectMember = (idx: number) => {
    soundEngine.playHover();
    setActiveMemberIdx(idx);
  };

  return (
    <main id="about" data-scene-version="about-photo-terrain-v4" className="relative overflow-x-clip bg-[#0d0c0f] text-white">
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
            <div className="col-span-6 min-[813px]:col-span-5">
              <h2 className="font-sans text-[10vw] leading-[0.98] font-normal tracking-[-0.025em] text-white min-[813px]:text-[3.6vw]">
                {LUSION_ABOUT.clients.heading}
              </h2>
            </div>
            <div className="col-span-6 mt-5 flex items-center min-[813px]:col-start-8 min-[813px]:col-span-5 min-[813px]:mt-0">
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
                  {[0, 1].map(copy => (
                    <div
                      key={copy}
                      className="about-client-marquee-set"
                      aria-hidden={copy === 1 ? true : undefined}
                    >
                      {row.map((client, cIdx) => (
                        <ClientLogoTile
                          key={`${copy}-${client.id}-${cIdx}`}
                          name={client.name}
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
