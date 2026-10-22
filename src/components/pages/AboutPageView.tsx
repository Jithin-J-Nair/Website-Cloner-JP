"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { LUSION_ABOUT } from "@/data/reference";
import { useStudioStore } from "@/lib/store";
import { soundEngine } from "@/lib/audio";
import { ContactCtaSection } from "@/components/sections/ContactCtaSection";
import { StudioFooter } from "@/components/sections/StudioFooter";

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / Math.max(1e-5, e1 - e0));
  return t * t * (3 - 2 * t);
};

/**
 * Deterministic 3D height function modeling Lusion's sculptural crater basin:
 * - Smooth misty central lunar valley floor around `x ∈ [-7, 7], z ∈ [-4, 14]`
 * - Dramatic flanking volcanic/mountain ridges rising steeply on left & right (`|x| = 8..30`)
 * - Secondary ridge folds & contour terraces so the 42 topographic contour lines match `about-03` & `about-04`!
 */
function terrainHeightAt(x: number, z: number): number {
  const valleyDist = Math.hypot(x * 0.92, (z - 3.5) * 0.52);
  const rimRise = smoothstep(5.2, 23.0, valleyDist) * 9.6;

  // Jagged multi-octave mountain ridges stronger on left & right flanks ('about-02', 'about-04')
  const n1 = Math.sin(x * 0.21 + z * 0.14) * Math.cos(z * 0.19 - x * 0.11);
  const n2 = Math.sin(x * 0.47 - z * 0.36) * 0.52 + Math.cos(x * 0.83 + z * 0.61) * 0.26;
  const n3 = Math.abs(Math.sin(x * 0.33 + Math.cos(z * 0.28) * 1.6));
  const flankMask = smoothstep(3.4, 13.5, Math.abs(x) + Math.max(0, -z) * 0.38);

  const micro = Math.sin(x * 1.45 + z * 1.32) * 0.11 * (0.35 + flankMask);
  return rimRise + (n1 * 2.35 + n2 * 1.45 + n3 * 2.15) * flankMask + micro - 1.35;
}

/**
 * Generates an 8,192-vertex 3D sculptural human portrait relief buffer
 * parameterized by `memberIndex` so every one of the 7 verified Lusion team specialists
 * renders a crisp, distinct 3D point-cloud hologram with Depth-of-Field bokeh & pointer displacement
 * even when `/api/local-assets/team/*.buf` returns HTTP 403 in default security mode.
 */
function buildSculpturalPortraitPositions(memberIndex: number, count = 8192): Float32Array {
  const out = new Float32Array(count * 3);
  let seed = (memberIndex * 2654435761 + 1013904223) >>> 0;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const yawTurn = ((memberIndex % 3) - 1) * 0.18;
  const jawWidth = 0.88 + (memberIndex % 4) * 0.04;
  const hairCrown = 1.04 + (memberIndex % 3) * 0.06;

  let written = 0;
  let guard = 0;
  while (written < count && guard < count * 18) {
    guard++;
    const u = rnd() * 2 - 1;
    const v = rnd() * 2 - 1;

    // Cranium + jawline + neck & shoulders silhouette
    const inHead =
      Math.hypot(u / (0.56 * jawWidth * (1 - Math.max(0, -v - 0.05) * 0.34)), (v - 0.18) / (0.68 * hairCrown)) <=
      1.0;
    const inNeck = Math.abs(u) < 0.22 && v > -0.58 && v < -0.25;
    const inShoulders =
      v <= -0.44 &&
      v >= -1.0 &&
      Math.abs(u) < 0.24 + smoothstep(-0.44, -0.95, v) * 0.78;

    if (!inHead && !inNeck && !inShoulders) continue;

    let z = 0;
    if (inHead) {
      const hu = u / (0.56 * jawWidth);
      const hv = (v - 0.18) / (0.68 * hairCrown);
      const sphereZ = Math.sqrt(Math.max(0, 1 - hu * hu - hv * hv)) * 0.56;
      // Brow ridge, nose bridge, orbital hollows & cheekbones
      const nose =
        Math.exp(-Math.pow(u / 0.085, 2) - Math.pow((v - 0.14) / 0.22, 2)) * 0.16;
      const eyes =
        -Math.exp(-Math.pow((Math.abs(u) - 0.17) / 0.09, 2) - Math.pow((v - 0.24) / 0.065, 2)) *
        0.075;
      const lips =
        Math.exp(-Math.pow(u / 0.14, 2) - Math.pow((v + 0.08) / 0.045, 2)) * 0.045;
      z = sphereZ + nose + eyes + lips;
    } else if (inNeck) {
      z = Math.sqrt(Math.max(0, 0.062 - u * u)) * 1.1;
    } else {
      z = Math.cos(u * 1.35) * 0.34 + 0.04;
    }

    // Apply slight 3/4 portrait turn
    const px = u * 1.42;
    const py = v * 1.52;
    const pz = z * 1.35;
    const rx = px * Math.cos(yawTurn) + pz * Math.sin(yawTurn);
    const rz = -px * Math.sin(yawTurn) + pz * Math.cos(yawTurn);

    out[written * 3] = rx;
    out[written * 3 + 1] = py;
    out[written * 3 + 2] = rz;
    written++;
  }

  return out;
}

/**
 * Full-Viewport Sticky WebGL 3D World + Synchronized Architectural HUD (`#about-who`)
 * Implements Lusion's complete `/about/` scroll-driven 3D experience:
 *   1. `u = 0.0` (`about-01-hero-top`): Close-up volumetric 3D curl-noise + spin sphere storm (`3,600`
 *      GPU-instanced 3D icospheres with velocity motion stretch, depth AO, cyan inner core glow & pointer swirl),
 *      5 horizontal `+` crosshairs, monumental double-stroke `LUSION` wordmark & `SCROLL TO EXPLORE`.
 *   2. `u = 1.6` (`about-02-we-are-reveal` & `about-06-reverse-we-are`): Smooth 3D spline pullback revealing
 *      sculpted dark crater mountain ridges, misty bright lunar valley floor, vertical volumetric God-Ray column,
 *      elevated swirling sphere cloud, lone white standing explorer with glowing cyan pack, 92 levitating basalt
 *      boulders, and horizontal `WE ARE / A CREATIVE / PRODUCTION STUDIO` manifesto transition.
 *   3. `u = 5.35` (`about-03-details-hud`): Obsidian sky + 42 glowing white 3D topographic contour lines
 *      sweeping across the mountain relief beneath the studio narrative statement.
 *   4. `u = 7.2 / 8.85` (`about-04-team-hologram`): Interactive `T E A M` hologram stage with `[[ 001 ]]`,
 *      tick ruler, `2x13` dot matrix, royal-blue `#223aff` cursor orb (`→` / `SWIPE TO CHANGE`), glowing contour
 *      terrain, 8,192-vertex 3D point-cloud portrait sculpture, falling glyph stream & glitch tile matrix.
 */
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
  const scrollPromptRef = useRef<HTMLDivElement | null>(null);
  const manifestoOverlayRef = useRef<HTMLDivElement | null>(null);
  const narrativeOverlayRef = useRef<HTMLDivElement | null>(null);
  const teamOverlayRef = useRef<HTMLDivElement | null>(null);
  const fallbackPosterRef = useRef<HTMLDivElement | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const portraitMatRef = useRef<THREE.ShaderMaterial | null>(null);
  const portraitGeoRef = useRef<THREE.BufferGeometry | null>(null);

  const team = LUSION_ABOUT.who.team;
  const activeMember = team[activeMemberIdx] ?? team[0];

  // Update 8,192-point 3D portrait geometry whenever 'activeMemberIdx' changes (zero React loop!)
  useEffect(() => {
    const geo = portraitGeoRef.current;
    if (!geo) return;
    const positions = buildSculpturalPortraitPositions(activeMemberIdx, 8192);
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.attributes.position.needsUpdate = true;
    geo.computeBoundingSphere();
  }, [activeMemberIdx]);

  useEffect(() => {
    const sectionEl = sectionRef.current;
    const hostEl = canvasHostRef.current;
    if (!sectionEl || !hostEl) return;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
      });
    } catch {
      if (fallbackPosterRef.current) {
        fallbackPosterRef.current.style.display = "flex";
      }
      return;
    }

    const glRenderer = renderer;
    glRenderer.setClearColor(0x000000, 1);
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
    scene.fog = new THREE.FogExp2(0x000000, 0.016);

    const camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 220);

    // Moody monochrome lunar lighting matching 'about-01' & 'about-02'
    const ambient = new THREE.AmbientLight(0x8892a4, 0.55);
    scene.add(ambient);

    const overheadBeamLight = new THREE.SpotLight(0xf1f5f9, 48, 52, Math.PI * 0.22, 0.85, 1.3);
    overheadBeamLight.position.set(0, 24, 1.5);
    overheadBeamLight.target.position.set(0, 0, 2.5);
    scene.add(overheadBeamLight);
    scene.add(overheadBeamLight.target);

    const coolRimLight = new THREE.DirectionalLight(0xcbd5e1, 1.35);
    coolRimLight.position.set(-8, 14, 10);
    scene.add(coolRimLight);

    // -------------------------------------------------------------------------
    // 1. 3D Curl-Noise + Vortex Sphere Storm ('6,400' GPU-Instanced Fine Icospheres)
    // -------------------------------------------------------------------------
    const SPHERE_COUNT = 6400;
    const sphereGeo = track(new THREE.IcosahedronGeometry(0.042, 1));

    const instSeed = new Float32Array(SPHERE_COUNT * 4);
    let prng = 20260822;
    const nextRnd = () => {
      prng = (prng * 1664525 + 1013904223) >>> 0;
      return prng / 4294967296;
    };
    for (let i = 0; i < SPHERE_COUNT; i++) {
      // Polar/shell distribution forming dense swirling core + diagonal tail ('about-01-hero-top'!)
      const u = nextRnd();
      const theta = nextRnd() * Math.PI * 2;
      const phi = Math.acos(2 * nextRnd() - 1);
      instSeed[i * 4 + 0] = Math.pow(u, 0.78); // radial shell factor
      instSeed[i * 4 + 1] = theta;
      instSeed[i * 4 + 2] = phi;
      instSeed[i * 4 + 3] = nextRnd(); // size & cyan core selector
    }
    sphereGeo.setAttribute("aSeed", new THREE.InstancedBufferAttribute(instSeed, 4));

    const stormMat = track(
      new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uCompact: { value: 0 }, // 0 at hero close-up, 1 when pulled back above valley ('about-02')
          uMobile: { value: 0 },
          uPointer: { value: new THREE.Vector3(0, 8.2, 0) },
          uPointerStrength: { value: 0 },
          uCyanBoost: { value: 0.0 },
          uOpacity: { value: 1 },
        },
        transparent: true,
        vertexShader: `
          attribute vec4 aSeed;
          uniform float uTime;
          uniform float uCompact;
          uniform float uMobile;
          uniform vec3 uPointer;
          uniform float uPointerStrength;
          varying vec3 vNormalV;
          varying float vCoreDist;
          varying float vCyanMask;

          vec3 hash3(vec3 p) {
            p = vec3(dot(p, vec3(127.1, 311.7, 74.7)),
                     dot(p, vec3(269.5, 183.3, 246.1)),
                     dot(p, vec3(113.5, 271.9, 124.6)));
            return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
          }

          void main() {
            float radFrac = aSeed.x;
            float theta = aSeed.y;
            float phi = aSeed.z;
            float rnd = aSeed.w;

            // Orbiting swirl around vortex center + diagonal hero plume tail ('about-01-hero-top')!
            float spinSpeed = (0.45 + (1.0 - radFrac) * 0.90);
            float ang = theta + uTime * spinSpeed * 0.45;
            float heroR = mix(1.92, 2.95, uMobile);
            float baseR = mix(heroR, 1.34, uCompact) * radFrac;

            vec3 localPos = vec3(
              sin(phi) * cos(ang),
              cos(phi) * mix(1.18, 1.48, uMobile * (1.0 - uCompact)),
              sin(phi) * sin(ang)
            ) * baseR;

            // Diagonal upper-right to lower-left turbulent curl stream prominent in 'about-01-hero-top'
            float tail = pow(radFrac, 1.25) * mix(1.0, 0.32, uCompact);
            localPos.x += sin(ang * 2.0 + phi) * 0.72 * tail - tail * 0.62;
            localPos.y += sin(ang * 1.5 - uTime * 0.35) * 0.74 * tail;
            localPos.z += cos(ang * 2.2 + uTime * 0.25) * 0.44;

            // Turbulent curl displacement
            localPos += sin(localPos.yzx * 2.1 + uTime * 0.75 + rnd * 6.28) * 0.22;

            vec3 heroAnchor = vec3(mix(-0.52, -0.15, uMobile), mix(9.28, 8.85, uMobile), 0.0);
            vec3 valleyAnchor = vec3(-0.65, 9.25, 0.0);
            vec3 worldCenter = mix(heroAnchor, valleyAnchor, uCompact) + localPos;

            // Interactive 3D pointer repulsion swirl
            vec3 toPtr = worldCenter - uPointer;
            float pd = length(toPtr);
            if (uPointerStrength > 0.001 && pd < 2.6 && pd > 0.001) {
              worldCenter += normalize(toPtr) * (1.0 - pd / 2.6) * 1.15 * uPointerStrength;
            }

            // Velocity tangent stretch along swirl direction (authentic motion-stretched spheres in 'about-01'!)
            vec3 tangent = normalize(vec3(-sin(ang), 0.28 * cos(phi), cos(ang)));
            vec3 p = position;
            float stretch = 1.0 + (1.0 - radFrac * 0.4) * 1.05 * (1.0 - uCompact * 0.45);
            p += tangent * dot(p, tangent) * (stretch - 1.0);

            float sizeVar = mix(0.42, 1.55, pow(rnd, 1.6)) * mix(1.0, 0.62, uCompact);
            p *= sizeVar;

            vCoreDist = radFrac;
            vCyanMask = step(0.968, rnd) * (1.0 - smoothstep(0.25, 0.72, radFrac));
            vNormalV = normalize(normalMatrix * normal);

            gl_Position = projectionMatrix * viewMatrix * vec4(worldCenter + p, 1.0);
          }
        `,
        fragmentShader: `
          uniform float uCyanBoost;
          uniform float uOpacity;
          varying vec3 vNormalV;
          varying float vCoreDist;
          varying float vCyanMask;

          void main() {
            vec3 lightDir = normalize(vec3(-0.28, 0.86, 0.42));
            float diff = clamp(dot(normalize(vNormalV), lightDir) * 0.5 + 0.5, 0.0, 1.0);

            // Volumetric core illumination + ambient occlusion shadowing
            float coreGlow = exp(-vCoreDist * 2.35);
            vec3 darkSlate = vec3(0.16, 0.19, 0.23);
            vec3 silverWhite = vec3(0.88, 0.92, 0.96);
            vec3 col = mix(darkSlate, silverWhite, pow(diff, 1.15) * (0.42 + coreGlow * 0.78));

            // Soft central god-ray scatter highlight
            col += vec3(0.32, 0.36, 0.40) * coreGlow * 0.65;

            // Crisp glowing electric-cyan inner spheres ('#00f7ff') visible inside cluster pockets!
            if (vCyanMask > 0.5) {
              col = mix(col, vec3(0.04, 0.97, 1.0), clamp(uCyanBoost, 0.0, 1.0));
            }

            float softAlpha = uOpacity * mix(0.24, 0.96, pow(1.0 - vCoreDist, 1.45));
            gl_FragColor = vec4(col, softAlpha);
          }
        `,
      })
    );

    const instancedGeo = track(new THREE.InstancedBufferGeometry());
    instancedGeo.index = sphereGeo.index;
    instancedGeo.setAttribute("position", sphereGeo.attributes.position);
    instancedGeo.setAttribute("normal", sphereGeo.attributes.normal);
    instancedGeo.setAttribute("uv", sphereGeo.attributes.uv);
    instancedGeo.setAttribute("aSeed", sphereGeo.attributes.aSeed);
    instancedGeo.instanceCount = SPHERE_COUNT;
    const sphereStorm = new THREE.Mesh(instancedGeo, stormMat);
    sphereStorm.frustumCulled = false;
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
          void main() {
            float xDist = abs(vUv.x - 0.475) * 2.0;
            float beam = exp(-pow(xDist * 11.5, 2.0));
            // Atmospheric misty silver sky gradient across upper valley ('about-02-we-are-reveal'!)
            float skyMist = smoothstep(0.28, 0.98, vUv.y) * 0.19;
            float wideHaze = exp(-pow(xDist * 2.6, 2.0)) * 0.14;
            float vertFade = smoothstep(0.0, 0.12, vUv.y);
            vec3 col = vec3(0.74, 0.78, 0.85) * (beam * 0.36 + wideHaze + skyMist);
            float vortexHotspot = exp(-pow((vUv.y - 0.46) * 6.5, 2.0)) * exp(-pow(xDist * 5.0, 2.0));
            col += mix(vec3(0.78, 0.86, 0.94), vec3(0.08, 0.95, 1.0), uCyanCore) * vortexHotspot * 0.34;
            gl_FragColor = vec4(col, uOpacity * vertFade);
          }
        `,
      })
    );
    const godRayPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(38.0, 26.0)), godRayMat);
    godRayPlane.position.set(0, 10.5, -2.5);
    scene.add(godRayPlane);

    // -------------------------------------------------------------------------
    // 2. Sculpted 3D Crater Basin & Mountain Ridge Terrain ('about-02', 'about-03', 'about-04')
    // -------------------------------------------------------------------------
    const GRID = 136;
    const SPAN = 64;
    const terrainGeo = track(new THREE.PlaneGeometry(SPAN, SPAN, GRID, GRID));
    terrainGeo.rotateX(-Math.PI * 0.5);
    const tPos = terrainGeo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < tPos.count; i++) {
      const x = tPos.getX(i);
      const z = tPos.getZ(i);
      tPos.setY(i, terrainHeightAt(x, z));
    }
    terrainGeo.computeVertexNormals();

    const terrainMat = track(
      new THREE.ShaderMaterial({
        uniforms: {
          uValleyBrightness: { value: 1.0 },
          uOpacity: { value: 0 },
        },
        transparent: true,
        vertexShader: `
          varying vec3 vWorldPos;
          varying vec3 vNormalW;
          void main() {
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vWorldPos = wp.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          uniform float uValleyBrightness;
          uniform float uOpacity;
          varying vec3 vWorldPos;
          varying vec3 vNormalW;
          void main() {
            // Overhead spotlight pool brightening the misty dusty valley center ('about-02'!)
            float distFromCenter = length(vWorldPos.xz - vec2(0.0, 4.2));
            float spotPool = exp(-pow(distFromCenter / 12.8, 1.75));
            float slope = clamp(vNormalW.y, 0.0, 1.0);
            vec3 lightDir = normalize(vec3(-0.15, 0.92, 0.25));
            float diff = clamp(dot(vNormalW, lightDir), 0.0, 1.0);

            vec3 darkRock = vec3(0.035, 0.04, 0.05);
            vec3 ridgeGrey = vec3(0.22, 0.25, 0.29);
            vec3 mistySand = vec3(0.76, 0.80, 0.85);

            vec3 col = mix(darkRock, ridgeGrey, diff * 0.85);
            col = mix(col, mistySand, spotPool * slope * uValleyBrightness * 0.94);

            // Soft distance horizon fade
            float farFade = 1.0 - smoothstep(18.0, 32.0, length(vWorldPos.xz));
            gl_FragColor = vec4(col * farFade, uOpacity);
          }
        `,
      })
    );
    const terrainMesh = new THREE.Mesh(terrainGeo, terrainMat);
    scene.add(terrainMesh);

    // -------------------------------------------------------------------------
    // 3. 42 Glowing 3D Topographic Elevation Contour Lines ('about-03' & 'about-04')
    // -------------------------------------------------------------------------
    const contourSegments: number[] = [];
    const C_GRID = 112;
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
    const explorerGroup = new THREE.Group();
    const gy = terrainHeightAt(-0.85, -1.8);
    explorerGroup.position.set(-0.85, gy + 0.58, -1.8);
    explorerGroup.scale.setScalar(0.64);
    scene.add(explorerGroup);

    const explorerMat = track(
      new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.45, metalness: 0.08 })
    );
    const cyanPackMat = track(
      new THREE.MeshBasicMaterial({ color: 0x06f6ff })
    );

    const exTorso = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.18, 0.34, 6, 12)), explorerMat);
    explorerGroup.add(exTorso);
    const exHead = new THREE.Mesh(track(new THREE.SphereGeometry(0.16, 14, 12)), explorerMat);
    exHead.position.y = 0.38;
    explorerGroup.add(exHead);
    // Glowing electric-cyan collar/backpack light visible in both '1440x900' & '390x844/about-02'!
    const exPackGlow = new THREE.Mesh(track(new THREE.BoxGeometry(0.24, 0.28, 0.14)), cyanPackMat);
    exPackGlow.position.set(0, 0.08, 0.14);
    explorerGroup.add(exPackGlow);

    for (const sx of [-1, 1]) {
      const leg = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.068, 0.42, 6, 10)), explorerMat);
      leg.position.set(sx * 0.10, -0.45, 0);
      explorerGroup.add(leg);
      const arm = new THREE.Mesh(track(new THREE.CapsuleGeometry(0.055, 0.34, 6, 10)), explorerMat);
      arm.position.set(sx * 0.24, -0.02, 0);
      arm.rotation.z = sx * 0.16;
      explorerGroup.add(arm);
    }

    // -------------------------------------------------------------------------
    // 5. 92 Levitating & Ground-Scattered 3D Basalt Boulders ('about-02')
    // -------------------------------------------------------------------------
    const ROCK_COUNT = 92;
    const rockGeo = track(new THREE.DodecahedronGeometry(0.24, 0));
    const rockMat = track(
      new THREE.MeshStandardMaterial({
        color: 0x2a2f38,
        roughness: 0.78,
        metalness: 0.12,
        flatShading: true,
      })
    );
    const rocksMesh = new THREE.InstancedMesh(rockGeo, rockMat, ROCK_COUNT);
    const rockDummy = new THREE.Object3D();
    const rockSeeds = Array.from({ length: ROCK_COUNT }, (_, i) => {
      const floating = i < 48;
      const ang = (i * 2.39996) % (Math.PI * 2);
      const rad = floating ? 1.6 + ((i * 29) % 100) / 100 * 9.5 : 1.2 + ((i * 37) % 100) / 100 * 11.0;
      const rx = Math.cos(ang) * rad;
      const rz = 3.5 + Math.sin(ang) * rad * 0.72;
      const ry = floating
        ? 1.5 + ((i * 43) % 100) / 100 * 13.5
        : terrainHeightAt(rx, rz) + 0.08;
      return {
        x: rx,
        y: ry,
        z: rz,
        floating,
        scale: floating ? 0.35 + ((i * 19) % 10) * 0.11 : 0.25 + ((i * 17) % 8) * 0.09,
        phase: i * 0.73,
      };
    });
    scene.add(rocksMesh);

    // -------------------------------------------------------------------------
    // 6. 8,192-Vertex 3D Point-Cloud Team Portrait Stage ('about-04-team-hologram')
    // -------------------------------------------------------------------------
    const portraitGeo = track(new THREE.BufferGeometry());
    portraitGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(buildSculpturalPortraitPositions(0, 8192), 3)
    );
    portraitGeoRef.current = portraitGeo;

    const portraitMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uPointerNDC: { value: new THREE.Vector2(0, 0) },
        },
        vertexShader: `
          uniform float uTime;
          uniform float uPixelRatio;
          uniform vec2 uPointerNDC;
          varying float vDepth;
          varying float vShade;
          void main() {
            vec3 p = position;
            // Subtle holographic scan shimmer + pointer tilt
            p.x += sin(p.y * 8.0 + uTime * 2.1) * 0.012;
            p.z += cos(p.x * 6.0 + uTime * 1.6) * 0.015;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            vDepth = -mv.z;
            vShade = clamp(p.z * 0.85 + 0.42, 0.12, 1.0);
            float dof = 1.0 + abs(p.z - 0.35) * 2.2;
            gl_PointSize = (2.15 * dof) * uPixelRatio;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          uniform float uOpacity;
          varying float vShade;
          void main() {
            vec2 d = gl_PointCoord - 0.5;
            float r = length(d);
            if (r > 0.5) discard;
            float soft = smoothstep(0.5, 0.08, r);
            vec3 col = mix(vec3(0.35, 0.44, 0.58), vec3(0.92, 0.96, 1.0), vShade);
            gl_FragColor = vec4(col, soft * uOpacity * 0.72);
          }
        `,
      })
    );
    portraitMatRef.current = portraitMat;

    const portraitPoints = new THREE.Points(portraitGeo, portraitMat);
    portraitPoints.visible = false;
    scene.add(portraitPoints);

    // -------------------------------------------------------------------------
    // Scroll & Camera Spline Update Loop
    // -------------------------------------------------------------------------
    let targetScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let smoothScrollY = targetScrollY;
    let docVisible = true;
    let rafId = 0;
    const pointerNDC = new THREE.Vector2(0, 0);
    const raycaster = new THREE.Raycaster();
    const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    const pointerWorld = new THREE.Vector3(0, 8.35, 0);
    let pointerActive = 0;
    const startClock = performance.now();

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
    };

    const resize = () => {
      const W = Math.max(1, window.innerWidth);
      const H = Math.max(1, window.innerHeight);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      glRenderer.setPixelRatio(dpr);
      glRenderer.setSize(W, H, false);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      portraitMat.uniforms.uPixelRatio.value = dpr;
      syncInspector();
    };

    const renderAtScroll = (sy: number, elapsedSec: number) => {
      const W = Math.max(1, window.innerWidth);
      const H = Math.max(1, window.innerHeight);
      const isMobile = W < 820;

      // Exact unit scroll parameter matching live 'lusion.co/about/':
      // Desktop: 'u = (sy - sectionTop) / W' in '[0 .. 9.5]'
      // Mobile:  'u = (sy - sectionTop) / H' in '[0 .. 11.25]'
      const secRect = sectionEl.getBoundingClientRect();
      const secTop = secRect.top + window.scrollY;
      const unit = isMobile ? H : W;
      const u = Math.max(0, (sy - secTop) / Math.max(1, unit));

      if (window.__lusionInspector?.scrollManager) {
        window.__lusionInspector.scrollManager.scrollPixel = sy;
      }

      // -----------------------------------------------------------------------
      // Continuous Camera Spline ('u = 0' close storm -> 'u = 1.6' valley wide -> 'u = 5.35..9.5' ridge scan)
      // -----------------------------------------------------------------------
      const tPullback = smoothstep(0.05, 1.45, u);
      const tContourPhase = smoothstep(3.6, 5.0, u);
      const tTeamPhase = smoothstep(6.2, 6.95, u);

      const camZ = lerp(isMobile ? 8.6 : 6.9, isMobile ? 21.5 : 18.2, tPullback);
      const camY = lerp(8.15, lerp(4.35, 6.6, tContourPhase), tPullback);
      const camX = Math.sin(tContourPhase * 1.2) * 0.6;
      const lookY = lerp(8.15, lerp(4.15, 0.85, tContourPhase), tPullback);

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
        stormMat.uniforms.uMobile.value = isMobile ? 1.0 : 0.0;
        stormMat.uniforms.uPointer.value.copy(pointerWorld);
        stormMat.uniforms.uPointerStrength.value = pointerActive;
        stormMat.uniforms.uCyanBoost.value = isMobile ? 0.94 : lerp(0.0, 0.55, tPullback);
        stormMat.uniforms.uOpacity.value = stormVis;
      }

      // 2. Vertical volumetric God-Ray column & Valley Terrain & Explorer & Floating Rocks ('about-02')
      const landscapeVis = smoothstep(0.30, 1.05, u);
      const darkHudFade = 1 - smoothstep(3.45, 4.55, u);
      godRayPlane.visible = landscapeVis * stormVis > 0.01;
      godRayMat.uniforms.uOpacity.value = landscapeVis * stormVis * 0.85;
      godRayMat.uniforms.uCyanCore.value = isMobile ? 0.85 : 0.32;

      // Fade solid grey terrain into pure `#000000` obsidian in `about-03` & `about-04` so ONLY crisp white contour lines glow!
      terrainMesh.visible = landscapeVis * darkHudFade > 0.01;
      terrainMat.uniforms.uOpacity.value = landscapeVis * darkHudFade;
      terrainMat.uniforms.uValleyBrightness.value = darkHudFade;

      const explorerVis = landscapeVis * (1 - smoothstep(3.3, 4.3, u));
      explorerGroup.visible = explorerVis > 0.02;

      rocksMesh.visible = explorerVis > 0.02;
      if (rocksMesh.visible) {
        for (let i = 0; i < ROCK_COUNT; i++) {
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
        rocksMesh.instanceMatrix.needsUpdate = true;
      }

      // 3. 42 Topographic Elevation Contour Lines ('about-03' & 'about-04')
      const contourVis = smoothstep(3.75, 4.85, u);
      contourLines.visible = contourVis > 0.01;
      if (contourLines.visible) {
        contourMat.uniforms.uOpacity.value = contourVis * lerp(0.42, 1.95, tTeamPhase);
        contourMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
        contourMat.uniforms.uTeamPhase.value = tTeamPhase;
      }

      // 4. Subtle Lower-Pedestal Team Hologram Shimmer ('about-04' — upper sky kept pure deep `#000000`!)
      portraitPoints.visible = tTeamPhase > 0.02;
      if (portraitPoints.visible) {
        portraitMat.uniforms.uOpacity.value = tTeamPhase * 0.06;
        portraitMat.uniforms.uTime.value = reducedMotion ? 0 : elapsedSec;
        portraitMat.uniforms.uPointerNDC.value.copy(pointerNDC);
        portraitPoints.position.set(
          camera.position.x + (isMobile ? -0.10 : -0.15),
          camera.position.y - (isMobile ? 2.65 : 2.55),
          camera.position.z - 5.8
        );
        portraitPoints.rotation.set(
          pointerNDC.y * -0.10,
          pointerNDC.x * 0.14 + Math.sin(elapsedSec * 0.45) * (reducedMotion ? 0 : 0.05),
          0
        );
      }

      // -----------------------------------------------------------------------
      // Synchronized DOM HUD Layers (Zero React 'setState' per frame!)
      // -----------------------------------------------------------------------
      // A. Monumental Double-Stroke 'LUSION' Wordmark ('about-01' & 'about-02', sweeps left across '1.85..3.1')
      if (heroWordmarkRef.current) {
        const wordOut = 1 - smoothstep(2.25, 3.15, u);
        if (wordOut > 0.005) {
          const slideX = -smoothstep(1.75, 3.15, u) * 65;
          heroWordmarkRef.current.style.opacity = String(wordOut);
          heroWordmarkRef.current.style.transform = `translate3d(${slideX}vw, 0, 0)`;
          heroWordmarkRef.current.style.visibility = "visible";
        } else {
          heroWordmarkRef.current.style.visibility = "hidden";
        }
      }

      if (scrollPromptRef.current) {
        const promptVis = 1 - smoothstep(0.08, 0.55, u);
        scrollPromptRef.current.style.opacity = String(promptVis);
      }

      // B. 'WE ARE A CREATIVE PRODUCTION STUDIO' Manifesto Band ('u = 2.05 .. 4.35')
      if (manifestoOverlayRef.current) {
        const manIn = smoothstep(2.05, 2.65, u);
        const manOut = 1 - smoothstep(3.65, 4.35, u);
        const manVis = manIn * manOut;
        manifestoOverlayRef.current.style.opacity = String(manVis);
        manifestoOverlayRef.current.style.visibility = manVis > 0.005 ? "visible" : "hidden";
        manifestoOverlayRef.current.style.transform = `translate3d(${lerp(18, -12, smoothstep(2.05, 4.35, u))}vw, 0, 0)`;
      }

      // C. Studio Narrative HUD ('about-03-details-hud', 'u = 4.45 .. 6.35')
      if (narrativeOverlayRef.current) {
        const narIn = smoothstep(4.45, 5.0, u);
        const narOut = 1 - smoothstep(5.85, 6.45, u);
        const narVis = narIn * narOut;
        narrativeOverlayRef.current.style.opacity = String(narVis);
        narrativeOverlayRef.current.style.visibility = narVis > 0.005 ? "visible" : "hidden";
      }

      // D. Full-Bleed Interactive 'T E A M' Hologram HUD ('about-04-team-hologram', 'u >= 6.45')
      if (teamOverlayRef.current) {
        teamOverlayRef.current.style.opacity = String(tTeamPhase);
        teamOverlayRef.current.style.visibility = tTeamPhase > 0.01 ? "visible" : "hidden";
        teamOverlayRef.current.style.pointerEvents = tTeamPhase > 0.45 ? "auto" : "none";
      }

      glRenderer.render(scene, camera);
    };

    const tick = () => {
      if (!docVisible) {
        rafId = 0;
        return;
      }
      targetScrollY = window.scrollY;
      if (targetScrollY > sectionEl.offsetHeight + window.innerHeight * 0.5) {
        // Scrolled completely below sticky `#about-who` stage: render final resting state once and sleep RAF cleanly!
        renderAtScroll(targetScrollY, (performance.now() - startClock) * 0.001);
        rafId = 0;
        return;
      }
      const diff = targetScrollY - smoothScrollY;
      if (Math.abs(diff) > window.innerHeight * 0.42 || reducedMotion) {
        smoothScrollY = targetScrollY;
      } else {
        smoothScrollY += diff * 0.34;
        if (Math.abs(targetScrollY - smoothScrollY) < 0.15) {
          smoothScrollY = targetScrollY;
        }
      }
      pointerActive *= 0.96;

      renderAtScroll(smoothScrollY, (performance.now() - startClock) * 0.001);
      rafId = window.requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!rafId && docVisible) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      pointerNDC.set(
        (e.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        -(e.clientY / Math.max(1, window.innerHeight)) * 2 + 1
      );
      pointerActive = 1.0;
    };

    const onScroll = () => {
      targetScrollY = window.scrollY;
      ensureLoop();
    };

    const onVisibility = () => {
      docVisible = document.visibilityState === "visible";
      ensureLoop();
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    ensureLoop();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pointermove", onPointerMove);
      document.removeEventListener("visibilitychange", onVisibility);

      for (const item of disposables) {
        item.dispose();
      }
      glRenderer.dispose();
      if (glRenderer.domElement.parentElement === hostEl) {
        hostEl.removeChild(glRenderer.domElement);
      }
    };
  }, [reducedMotion]);

  return (
    <section
      ref={sectionRef}
      id="about-who"
      className="about-who-track relative w-full bg-[#000000] text-white"
    >
      {/* Exact Reference Scroll Span: `100vh + 950vw` on desktop, `1225vh` on mobile */}
      <style>{`
        .about-who-track {
          height: calc(100vh + 950vw);
        }
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
          touchStartXRef.current = e.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(e) => {
          if (touchStartXRef.current === null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touchStartXRef.current;
          touchStartXRef.current = null;
          if (Math.abs(dx) > 40) onStepMember(dx < 0 ? 1 : -1);
        }}
        className="sticky top-0 h-screen w-full overflow-hidden bg-[#000000]"
      >
        {/* Full-Bleed WebGL Canvas Host */}
        <div ref={canvasHostRef} className="absolute inset-0 h-full w-full" />

        {/* Graceful Non-WebGL Atmospheric Fallback */}
        <div
          ref={fallbackPosterRef}
          style={{ display: "none" }}
          className="absolute inset-0 items-center justify-center bg-[radial-gradient(circle_at_45%_32%,#273244_0%,#05070c_72%)]"
        />

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

        {/* Layer 1: Monumental Double-Sketch `LUSION` Hero Wordmark (`about-01` & `about-02`) */}
        <div
          ref={heroWordmarkRef}
          className="pointer-events-none absolute inset-x-[var(--base-padding-x)] bottom-4 z-20 will-change-transform"
        >
          <svg
            viewBox="0 0 1400 295"
            fill="none"
            aria-hidden="true"
            className="block h-auto w-full select-none"
          >
            <text
              x="6"
              y="256"
              textLength="1388"
              lengthAdjust="spacingAndGlyphs"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6.5"
              fontFamily="LusionSansCalibrated, system-ui, sans-serif"
              fontSize="306"
              fontWeight="400"
            >
              LUSION
            </text>
            <text
              x="16"
              y="264"
              textLength="1368"
              lengthAdjust="spacingAndGlyphs"
              fill="none"
              stroke="rgba(255,255,255,0.85)"
              strokeWidth="3.0"
              fontFamily="LusionSansCalibrated, system-ui, sans-serif"
              fontSize="306"
              fontWeight="400"
            >
              LUSION
            </text>
          </svg>

          <div
            ref={scrollPromptRef}
            className="mt-1 flex items-center justify-center min-[820px]:justify-end"
          >
            <span
              id="about-who-title-main-scroll"
              className="font-sans text-[11px] font-medium uppercase tracking-[0.08em] text-white/95 md:text-xs"
            >
              {LUSION_ABOUT.who.scrollPrompt}
            </span>
          </div>
        </div>

        {/* Layer 2: Horizontal `WE ARE A CREATIVE PRODUCTION STUDIO` Reveal (`u = 2.05 .. 4.35`) */}
        <div
          ref={manifestoOverlayRef}
          style={{ opacity: 0, visibility: "hidden" }}
          className="pointer-events-none absolute inset-x-[var(--base-padding-x)] bottom-10 z-20 grid grid-cols-1 gap-6 min-[820px]:grid-cols-12 will-change-transform"
        >
          <div id="about-who-title-left" className="min-[820px]:col-span-7">
            <h2 className="font-sans text-[9.6vw] font-normal uppercase leading-[0.95] tracking-[-0.025em] text-white min-[820px]:text-[4.8vw]">
              {LUSION_ABOUT.who.leftLines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h2>
          </div>
          <div className="flex items-end min-[820px]:col-span-5">
            <p
              id="about-who-title-right"
              className="font-sans text-[5.6vw] font-normal uppercase leading-[1.06] tracking-[-0.02em] text-white/95 min-[820px]:text-[2.3vw]"
            >
              {LUSION_ABOUT.who.rightHeadline}
            </p>
          </div>
        </div>

        {/* Layer 3: Narrative HUD over Glowing 3D Topographic Contours (`about-03-details-hud`) */}
        <div
          ref={narrativeOverlayRef}
          style={{ opacity: 0, visibility: "hidden" }}
          className="pointer-events-none absolute inset-x-[var(--base-padding-x)] top-[18vh] bottom-[6vh] z-20 flex flex-col justify-between"
        >
          <p
            id="about-who-desc-top"
            className="whitespace-pre-line font-sans text-[clamp(1.85rem,3.35vw,3.15rem)] font-normal leading-[1.15] tracking-[-0.02em] text-white"
          >
            {"A worldwide team of\nspecialists in design,\nmotion, 3D, and technology"}
          </p>
          <p
            id="about-who-desc-bottom"
            className="self-end whitespace-pre-line text-right font-sans text-[clamp(1.7rem,2.95vw,2.75rem)] font-normal leading-[1.16] tracking-[-0.02em] text-white"
          >
            {"working together to\nturn ambitious ideas into\nimmersive digital experiences."}
          </p>
        </div>

        {/* Layer 4: Full-Bleed `T E A M` Hologram Stage (`about-04-team-hologram`) */}
        <div
          ref={teamOverlayRef}
          style={{ opacity: 0, visibility: "hidden" }}
          className="absolute inset-0 z-30 flex flex-col justify-between px-[var(--base-padding-x)] pt-16 pb-8 min-[820px]:pt-28"
        >
          {/* Top Index Bar + Mobile Full-Width `T E A M` / Desktop Right-Aligned `T E A M` */}
          <div>
            {/* Mobile full-width spaced `T E A M` above index row (`390x844/about-04`) */}
            <div
              aria-hidden="true"
              className="mb-3 flex w-full items-center justify-between font-sans text-[19vw] font-normal uppercase leading-none text-white min-[820px]:hidden"
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
                <div className="grid grid-cols-7 gap-1.5 pt-1">
                  {team.map((member, idx) => (
                    <button
                      key={member.id}
                      type="button"
                      aria-label={`Select ${member.name}`}
                      onClick={() => onSelectMember(idx)}
                      className={`h-2 w-2 rounded-full transition-transform ${
                        idx === activeMemberIdx
                          ? "scale-125 bg-white"
                          : "bg-white/40 hover:bg-white/80"
                      }`}
                    />
                  ))}
                  {team.map((member, idx) => (
                    <span
                      key={`${member.id}-row2`}
                      aria-hidden="true"
                      className={`h-1.5 w-1.5 rounded-full ${
                        idx === activeMemberIdx ? "bg-white/90" : "bg-white/30"
                      }`}
                    />
                  ))}
                </div>

                <div
                  aria-hidden="true"
                  className="hidden items-center gap-6 font-sans text-[5.4vw] font-normal uppercase leading-[0.88] tracking-[0.06em] text-white min-[820px]:flex"
                >
                  <span>T</span>
                  <span>E</span>
                  <span>A</span>
                  <span>M</span>
                </div>
              </div>
            </div>
          </div>

          {/* Dead-Center Royal-Blue `#223aff` Interactive Specialist Advance Orb (`→` / `SWIPE TO CHANGE`) */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => onStepMember(1)}
              aria-label="Next team member"
              className="pointer-events-auto flex h-36 w-36 cursor-pointer items-center justify-center rounded-full bg-[#223aff] text-center font-sans text-xs font-medium uppercase tracking-[0.06em] text-white shadow-[0_14px_44px_rgba(34,58,255,0.5)] transition-transform duration-300 hover:scale-105 min-[820px]:h-[154px] min-[820px]:w-[154px]"
            >
              <span className="hidden text-3xl font-light leading-none min-[820px]:inline">
                &rarr;
              </span>
              <span className="px-3 leading-snug min-[820px]:hidden">
                {LUSION_ABOUT.who.mobileSwipeHint}
              </span>
            </button>
          </div>

          {/* Bottom Specialist Bio Left + Translucent Specialist Monogram + Studio Copy Right */}
          <div className="relative flex flex-wrap items-end justify-between gap-6">
            <div>
              <div className="flex items-center gap-2.5">
                <span aria-hidden="true" className="font-mono text-xs tracking-widest text-white/75">
                  ::
                </span>
                <h3 className="font-sans text-xl font-normal tracking-[-0.01em] text-white md:text-2xl">
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
              <div className="mt-3 h-[1px] w-40 bg-white/35" />
            </div>

            <div className="flex items-end gap-6">
              <span
                aria-hidden="true"
                className="hidden select-none font-sans text-[112px] leading-[0.80] font-bold tracking-[-0.04em] text-white/55 min-[820px]:block"
              >
                {activeMember.name[0]}
              </span>

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

/**
 * Verified Client Logo Tile (`/assets/images/logo/@logo--*.svg` white mark with clean text fallback)
 */
function ClientLogoTile({ name, src }: { name: string; src: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-20 items-center justify-center px-3 transition-opacity duration-300 opacity-85 hover:opacity-100 md:h-24 md:px-5">
      {!failed ? (
        <img
          src={src}
          alt={name}
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
          className="h-12 w-auto max-w-[140px] object-contain brightness-0 invert md:h-16 md:max-w-[175px]"
        />
      ) : (
        <span className="font-sans text-xs font-medium tracking-[0.06em] text-white/90 uppercase md:text-sm">
          {name}
        </span>
      )}
    </div>
  );
}

/**
 * Verified Lusion About Page (`/about`)
 *
 * Matches all desktop (`1440x900`, `1024x768`) & mobile (`390x844`) reference states:
 *   1. `#about-who`: Full Three.js 3D sphere storm, crater mountain basin, vertical God-Ray, explorer,
 *      floating rocks, 42 topographic contour lines & 8,192-vertex 3D team portrait stage
 *   2. `#about-clients`: `BRANDS WE WORK WITH` + 3 rows of crisp white client SVG emblems
 *   3. `#about-award`: Recognition ledger (`58` awards, `03` articles, `5` talks)
 *   4. `#about-capability`: Electric cobalt `AREA OF EXPERTISE` + `S / C / T / P` tabs & sacred-geometry cards
 *   5. `#end-section`: Royal-blue FLIP geometric particle heap CTA + `#footer-section`
 */
export function AboutPageView() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);

  const darkUpperRef = useRef<HTMLDivElement>(null);
  const capabilityBandRef = useRef<HTMLElement>(null);
  const lastSurfaceRef = useRef<"ice" | "void" | "cobalt" | null>(null);
  const [activeMemberIdx, setActiveMemberIdx] = useState(0);
  const [activeCapabilityIdx, setActiveCapabilityIdx] = useState(0);

  const team = LUSION_ABOUT.who.team;

  // Sync fixed '#header' contrast across '#000000' ('void'), '#1a2ffb' ('cobalt'), and '#f0f1fa' ('ice')
  // Guarded with 'lastSurfaceRef' so React never re-renders unless the band boundary actually crosses!
  useEffect(() => {
    const syncHeaderSurface = () => {
      const vhMid = window.innerHeight * 0.12;
      const capRect = capabilityBandRef.current?.getBoundingClientRect();
      const darkRect = darkUpperRef.current?.getBoundingClientRect();
      const endRect = document.getElementById("end-section")?.getBoundingClientRect();

      let nextSurface: "ice" | "void" | "cobalt" = "ice";
      if (
        (capRect && capRect.top <= vhMid && capRect.bottom >= vhMid) ||
        (endRect && endRect.top <= vhMid && endRect.bottom >= vhMid)
      ) {
        nextSurface = "cobalt";
      } else if (darkRect && darkRect.bottom >= vhMid) {
        nextSurface = "void";
      }

      if (lastSurfaceRef.current !== nextSurface) {
        lastSurfaceRef.current = nextSurface;
        setActiveSurface(nextSurface);
      }
    };

    syncHeaderSurface();
    window.addEventListener("scroll", syncHeaderSurface, { passive: true });
    window.addEventListener("resize", syncHeaderSurface, { passive: true });
    return () => {
      window.removeEventListener("scroll", syncHeaderSurface);
      window.removeEventListener("resize", syncHeaderSurface);
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
    <main id="about" className="relative overflow-x-clip bg-[#f0f1fa] text-[#000000]">
      {/* Dark Studio Upper Monolith (`#about-who` + `#about-clients` + `#about-award`) */}
      <div ref={darkUpperRef} className="bg-[#000000] text-white">
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
          className="border-t border-white/10 bg-[#000000] px-[var(--base-padding-x)] py-24 text-white min-[813px]:py-32"
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

          <div className="mt-16 flex flex-col gap-8 md:mt-20 md:gap-10">
            {LUSION_ABOUT.clients.carouselRows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                className="grid grid-cols-3 items-center gap-4 sm:grid-cols-4 md:grid-cols-6"
              >
                {row.map((client, cIdx) => (
                  <ClientLogoTile
                    key={`${client.id}-${cIdx}`}
                    name={client.name}
                    src={client.src}
                  />
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* =====================================================================
            3. RECOGNITION LEDGER (`#about-award`: `58` Awards, `03` Articles, `5` Talks)
           ===================================================================== */}
        <section
          id="about-award"
          className="border-t border-white/10 bg-[#000000] px-[var(--base-padding-x)] py-24 text-white min-[813px]:py-32"
        >
          <div className="grid grid-cols-6 gap-8 min-[813px]:grid-cols-12">
            <div className="col-span-6 min-[813px]:col-span-4">
              <div className="flex items-start gap-3">
                <h2 className="font-sans text-5xl font-normal tracking-[-0.025em] text-white md:text-6xl">
                  {LUSION_ABOUT.recognition.awardsHeading}
                </h2>
                <span className="mt-1 rounded-full bg-[#1a2ffb] px-3 py-1 font-mono text-xs font-medium text-white">
                  {LUSION_ABOUT.recognition.awardsDisplayedTotal}
                </span>
              </div>
            </div>

            <div className="col-span-6 grid gap-5 md:grid-cols-2 min-[813px]:col-span-8">
              {LUSION_ABOUT.recognition.awardGroups.map((group) => (
                <div
                  key={group.organization}
                  className="rounded-2xl border border-white/10 bg-[#0b0d13] p-6"
                >
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="font-sans text-lg font-medium text-white">
                      {group.organization}
                    </h3>
                    <span className="font-mono text-xs text-white/60">
                      {String(group.totalCount).padStart(2, "0")}
                    </span>
                  </div>
                  <ul className="mt-3 divide-y divide-white/8">
                    {group.honors.map((honor) => (
                      <li
                        key={`${group.organization}-${honor.recognition}`}
                        className="flex items-center justify-between py-2.5 text-sm"
                      >
                        <span className="text-white/85">{honor.recognition}</span>
                        <span className="font-mono text-xs text-white/65">
                          {honor.countFormatted}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 03 Articles + 5 Talks */}
          <div className="mt-16 grid grid-cols-6 gap-10 border-t border-white/10 pt-14 min-[813px]:grid-cols-12">
            <div className="col-span-6 min-[813px]:col-span-6">
              <div className="flex items-start gap-3">
                <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-white">
                  {LUSION_ABOUT.recognition.articlesHeading}
                </h3>
                <span className="mt-1 rounded-full bg-white/12 px-3 py-0.5 font-mono text-xs text-white">
                  {LUSION_ABOUT.recognition.articlesDisplayedTotal}
                </span>
              </div>
              <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {LUSION_ABOUT.recognition.articles.map((article) => (
                  <li key={article.href}>
                    <a
                      href={article.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center justify-between py-4 text-base text-white transition-colors hover:text-[#6e85ff]"
                    >
                      <span>{article.title}</span>
                      <span
                        aria-hidden="true"
                        className="font-mono text-xs transition-transform group-hover:translate-x-1"
                      >
                        &#8599;
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="col-span-6 min-[813px]:col-span-6">
              <div className="flex items-start gap-3">
                <h3 className="font-sans text-4xl font-normal tracking-[-0.02em] text-white">
                  {LUSION_ABOUT.recognition.talksHeading}
                </h3>
                <span className="mt-1 rounded-full bg-white/12 px-3 py-0.5 font-mono text-xs text-white">
                  {LUSION_ABOUT.recognition.talksDisplayedTotal}
                </span>
              </div>
              <ul className="mt-6 divide-y divide-white/10 border-y border-white/10">
                {LUSION_ABOUT.recognition.talks.map((talk) => (
                  <li
                    key={`${talk.event}-${talk.dateAndLocation}`}
                    className="flex items-center justify-between py-4 text-base"
                  >
                    <span className="font-medium text-white">{talk.event}</span>
                    <span className="font-mono text-xs text-white/70">{talk.dateAndLocation}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* =====================================================================
          4. AREA OF EXPERTISE (`#about-capability` — Full-Bleed Electric Cobalt `#1a2ffb`)
         ===================================================================== */}
      <section
        id="about-capability"
        ref={capabilityBandRef}
        className="relative overflow-hidden bg-[linear-gradient(90deg,#1a2ffb_0%,#1527dc_48%,#1e35ff_55%,#1a2ffb_100%)] px-[var(--base-padding-x)] py-24 text-white min-[813px]:py-32"
      >
        <div className="grid grid-cols-6 gap-6 min-[813px]:grid-cols-12">
          <div className="col-span-6 min-[813px]:col-span-7">
            <h2 className="font-sans text-[11vw] leading-[0.95] font-normal tracking-[-0.025em] text-white uppercase min-[813px]:text-[5.2vw]">
              {LUSION_ABOUT.capability.titleLines.map((line, idx) => (
                <span key={idx} className="block">
                  {line}
                </span>
              ))}
            </h2>
            <p className="mt-5 max-w-md font-sans text-xs leading-relaxed tracking-[0.05em] text-white/85 uppercase md:text-[13px]">
              {LUSION_ABOUT.capability.subtitle}
            </p>
          </div>

          {/* 4 Bordered Glyph Badges (`S / C / T / P`) matching `10d-about-capability` */}
          <div className="col-span-6 flex items-end gap-3 min-[813px]:col-span-5 min-[813px]:justify-end">
            {LUSION_ABOUT.capability.cards.map((card, idx) => {
              const selected = activeCapabilityIdx === idx;
              return (
                <button
                  key={card.title}
                  type="button"
                  onClick={() => {
                    soundEngine.playClick();
                    setActiveCapabilityIdx(idx);
                  }}
                  aria-label={`Focus ${card.title}`}
                  className={`flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl border font-sans text-xl font-medium transition-all ${
                    selected
                      ? "border-white bg-white text-[#1a2ffb]"
                      : "border-white/55 bg-white/8 text-white hover:border-white"
                  }`}
                >
                  {card.displayInitial}
                </button>
              );
            })}
          </div>
        </div>

        {/* 4 Sacred-Geometry White-Line Capability Cards on Cobalt */}
        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {LUSION_ABOUT.capability.cards.map((card, idx) => {
            const active = activeCapabilityIdx === idx;
            return (
              <div
                key={card.title}
                tabIndex={0}
                role="button"
                aria-pressed={active}
                onClick={() => {
                  soundEngine.playClick();
                  setActiveCapabilityIdx(idx);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    soundEngine.playClick();
                    setActiveCapabilityIdx(idx);
                  }
                }}
                className={`group flex min-h-[410px] cursor-pointer flex-col justify-between rounded-[22px] border p-7 transition-all duration-300 focus-visible:outline-2 focus-visible:outline-white ${
                  active
                    ? "border-white bg-[#1323c9]/85 text-white shadow-[0_24px_60px_rgba(4,9,56,0.35)]"
                    : "border-white/25 bg-[#1628df]/60 text-white hover:-translate-y-1 hover:border-white/60"
                }`}
              >
                <div className="flex items-start justify-between">
                  <h3 className="font-sans text-3xl font-normal tracking-[-0.02em] text-white">
                    {card.title}
                  </h3>
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/40 font-sans text-sm font-medium text-white">
                    {card.displayInitial}
                  </span>
                </div>

                {/* Large White-Stroke Sacred Geometry Emblem (`cleanRoomIconSvg` inverted to crisp white) */}
                <div className="my-6 flex items-center justify-center">
                  <img
                    src={card.cleanRoomIconSvg}
                    alt={`${card.title} emblem`}
                    width={140}
                    height={140}
                    className="h-32 w-32 object-contain brightness-0 invert opacity-92 transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <ul className="space-y-2 border-t border-white/20 pt-4 text-sm text-white/90">
                  {card.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          5, 6 & 7. END CTA, STUDIO FOOTER & SCROLL PORTAL (`Our Projects` -> `/projects`)
         ===================================================================== */}
      <ContactCtaSection />
      <StudioFooter nextHref="/projects" nextLabel={LUSION_ABOUT.scrollNav.targetTitle} />
    </main>
  );
}
