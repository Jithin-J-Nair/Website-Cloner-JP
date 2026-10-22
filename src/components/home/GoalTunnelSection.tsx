"use client";

import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { LUSION_HOME } from "@/data/reference";
import { useStudioStore } from "@/lib/store";

declare global {
  interface Window {
    __lusionInspector?: {
      properties?: { hasStarted: boolean };
      scrollManager?: {
        scrollPixel: number;
        contentSizePixel: number;
        scrollLimit: number;
        scrollToPixel: (y: number, instant?: boolean) => void;
      };
      homeGoalSectionRanges?: {
        baseY: number;
        totalPixelCount: number;
        items: Record<
          string,
          { id: string; pixelFrom: number; pixelCount: number; pixelTo: number }
        >;
      };
    };
  }
}

interface GoalLayoutMetrics {
  goalTop: number;
  goalHeight: number;
  imgInLeft: number;
  imgInTop: number;
  imgInWidth: number;
  imgInHeight: number;
  imgInStart: number;
  imgInSpan: number;
  imgInEnd: number;
  tunnelStart: number;
  tunnelEnd: number;
  tunnelSpan: number;
  imgOutLeft: number;
  imgOutTop: number;
  imgOutWidth: number;
  imgOutHeight: number;
  endTop: number;
  endHeight: number;
  viewportW: number;
  viewportH: number;
  isMobile: boolean;
}

interface AstronautRig {
  root: THREE.Group;
  bodyPivot: THREE.Group;
  headGroup: THREE.Group;
  visorMesh: THREE.Mesh;
  visorMat: THREE.MeshPhysicalMaterial;
  suitMat: THREE.MeshStandardMaterial;
  harnessMat: THREE.MeshStandardMaterial;
  plumeGroup: THREE.Group;
  plumeMat: THREE.ShaderMaterial;
  shoulderL: THREE.Group;
  elbowL: THREE.Group;
  shoulderR: THREE.Group;
  elbowR: THREE.Group;
  hipL: THREE.Group;
  kneeL: THREE.Group;
  hipR: THREE.Group;
  kneeR: THREE.Group;
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smoothstep = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / Math.max(1e-5, e1 - e0));
  return t * t * (3 - 2 * t);
};

/**
 * High-resolution procedural organic cloud-Voronoi wall texture matching
 * `lusion.co` `whiteTunnel` (`#1a32ff` royal cobalt blue & sculpted `#f2f5ff` matte white cutouts
 * with glowing portal openings along the square tunnel walls).
 */
function createVoronoiTunnelTexture(): THREE.CanvasTexture {
  const S = 1024;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;

  // Base royal cobalt blue matching reference `home-07-white-blue-tunnel.png`
  const grad = ctx.createLinearGradient(0, 0, S, S);
  grad.addColorStop(0, "#1933ff");
  grad.addColorStop(0.5, "#152bf2");
  grad.addColorStop(1, "#1e3bff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);

  // Subtle architectural panel seam lines along tunnel axis
  ctx.strokeStyle = "rgba(8, 16, 115, 0.36)";
  ctx.lineWidth = 3;
  for (const xFrac of [0.24, 0.52, 0.78]) {
    ctx.beginPath();
    ctx.moveTo(S * xFrac, 0);
    ctx.lineTo(S * xFrac, S);
    ctx.stroke();
  }

  // Deterministic PRNG for organic scalloped cloud-Voronoi rings (`home-07`, `home-08`)
  let seed = 918273;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };

  const drawCloudRing = (cx: number, cy: number, baseR: number, lobes: number, rotOff: number) => {
    // Soft ambient shadow bevel under white sculpted relief
    ctx.save();
    ctx.translate(cx + 6, cy + 8);
    ctx.fillStyle = "rgba(8, 18, 130, 0.42)";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = rotOff + (i / lobes) * Math.PI * 2;
      const lr = baseR * (0.42 + 0.16 * Math.sin(i * 2.1));
      const px = Math.cos(a) * baseR * 0.74;
      const py = Math.sin(a) * baseR * 0.74;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();

    // Outer sculpted off-white cloud band (`#dce4ff` -> `#f4f6ff`)
    ctx.save();
    ctx.translate(cx, cy);
    ctx.fillStyle = "#e6ecff";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = rotOff + (i / lobes) * Math.PI * 2;
      const lr = baseR * (0.44 + 0.16 * Math.sin(i * 2.1));
      const px = Math.cos(a) * baseR * 0.74;
      const py = Math.sin(a) * baseR * 0.74;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();

    // Inner royal-blue cutout hollow creating the authentic figure-8 / cloud contour rings!
    ctx.fillStyle = "#1933ff";
    ctx.beginPath();
    for (let i = 0; i < lobes; i++) {
      const a = rotOff + (i / lobes) * Math.PI * 2;
      const lr = baseR * (0.27 + 0.11 * Math.sin(i * 2.1));
      const px = Math.cos(a) * baseR * 0.56;
      const py = Math.sin(a) * baseR * 0.56;
      ctx.moveTo(px + lr, py);
      ctx.arc(px, py, lr, 0, Math.PI * 2);
    }
    ctx.fill();
    ctx.restore();
  };

  const clusters = [
    [0.24, 0.22, 0.24, 7],
    [0.76, 0.30, 0.20, 6],
    [0.34, 0.68, 0.26, 8],
    [0.80, 0.78, 0.21, 6],
    [0.52, 0.46, 0.15, 5],
  ];
  for (const [fx, fy, fr, lobes] of clusters) {
    drawCloudRing(fx * S, fy * S, fr * S, lobes, rnd() * Math.PI * 2);
  }

  // Scattered crisp white Voronoi pebble islands matching `home-07`
  for (let i = 0; i < 14; i++) {
    const px = rnd() * S;
    const py = rnd() * S;
    const rx = 18 + rnd() * 34;
    const ry = rx * (0.65 + rnd() * 0.5);
    ctx.save();
    ctx.translate(px, py);
    ctx.rotate(rnd() * Math.PI);
    ctx.fillStyle = "#e8eeff";
    ctx.beginPath();
    ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    if (i % 2 === 0) {
      ctx.fillStyle = "#1933ff";
      ctx.beginPath();
      ctx.ellipse(0, 0, rx * 0.52, ry * 0.52, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Brilliant pure-white glowing skylight portal openings (`home-07` & `home-08`)
  for (const [gx, gy, grx, gry] of [
    [0.28, 0.44, 92, 54],
    [0.72, 0.60, 108, 62],
  ]) {
    const glow = ctx.createRadialGradient(gx * S, gy * S, 8, gx * S, gy * S, grx * 1.9);
    glow.addColorStop(0, "rgba(255,255,255,1)");
    glow.addColorStop(0.42, "rgba(235,245,255,0.95)");
    glow.addColorStop(0.7, "rgba(85,135,255,0.55)");
    glow.addColorStop(1, "rgba(25,51,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(gx * S, gy * S, grx * 1.9, gry * 1.9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.ellipse(gx * S, gy * S, grx, gry, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Procedural EVA spacesuit fabric weave + seam normal/bump texture
 * giving realistic quilted pressure-suit folds under directional studio lighting.
 */
function createSuitFabricBumpTexture(): THREE.CanvasTexture {
  const S = 256;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#808080";
  ctx.fillRect(0, 0, S, S);

  // Horizontal pressure-suit quilting ribs + subtle ripstop weave
  for (let y = 0; y < S; y += 2) {
    const rib = Math.sin((y / S) * Math.PI * 18) * 34;
    const fine = (y % 4 === 0 ? 8 : -8);
    const v = Math.max(0, Math.min(255, Math.round(128 + rib + fine)));
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, S, 2);
  }
  ctx.strokeStyle = "rgba(60,60,60,0.55)";
  ctx.lineWidth = 3;
  ctx.strokeRect(S * 0.25, 0, S * 0.5, S);

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/**
 * Procedural pop-art sticker badges matching `home-10-end-cta-wait.png`
 * (lime ghost/slime, slice of pizza, stacked double eyeballs, pink lollipop, green UFO saucer).
 */
function createStickerTexture(kind: number): THREE.CanvasTexture {
  const S = 192;
  const canvas = document.createElement("canvas");
  canvas.width = S;
  canvas.height = S;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, S, S);
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  const strokeWhiteBorder = (drawFn: () => void) => {
    ctx.save();
    drawFn();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 13;
    ctx.stroke();
    drawFn();
    ctx.strokeStyle = "#0b0d14";
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
  };

  if (kind === 0) {
    // Lime green slime smiley badge (`home-10` bottom-left)
    const path = () => {
      ctx.beginPath();
      ctx.arc(88, 96, 48, 0.35, Math.PI * 1.85);
      ctx.quadraticCurveTo(156, 78, 152, 92);
      ctx.quadraticCurveTo(132, 98, 158, 112);
      ctx.quadraticCurveTo(128, 118, 146, 132);
      ctx.closePath();
    };
    strokeWhiteBorder(path);
    path();
    ctx.fillStyle = "#b8f218";
    ctx.fill();
    ctx.fillStyle = "#0b0d14";
    ctx.beginPath();
    ctx.ellipse(72, 86, 6, 10, -0.2, 0, Math.PI * 2);
    ctx.ellipse(98, 96, 6, 10, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 1) {
    // Crisp red pizza slice (`home-10` lower-left)
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(64, 42);
      ctx.quadraticCurveTo(112, 34, 134, 62);
      ctx.lineTo(92, 154);
      ctx.closePath();
    };
    strokeWhiteBorder(path);
    path();
    ctx.fillStyle = "#e6392f";
    ctx.fill();
    ctx.fillStyle = "#f4a259";
    ctx.beginPath();
    ctx.ellipse(99, 52, 36, 11, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#2ec44d";
    ctx.beginPath();
    ctx.arc(95, 92, 9, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 2) {
    // Double cartoon eyeballs (`home-10` lower-left-center)
    const path = () => {
      ctx.beginPath();
      ctx.arc(86, 78, 28, 0, Math.PI * 2);
      ctx.moveTo(128, 112);
      ctx.arc(100, 112, 28, 0, Math.PI * 2);
    };
    strokeWhiteBorder(path);
    ctx.fillStyle = "#f8fafc";
    ctx.beginPath();
    ctx.arc(86, 78, 26, 0, Math.PI * 2);
    ctx.arc(100, 112, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#38bdf8";
    ctx.beginPath();
    ctx.arc(94, 78, 11, 0, Math.PI * 2);
    ctx.arc(108, 112, 11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#0b0d14";
    ctx.beginPath();
    ctx.arc(96, 78, 5, 0, Math.PI * 2);
    ctx.arc(110, 112, 5, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 3) {
    // Pink swirl lollipop (`home-10` lower-right)
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(72, 42);
      ctx.lineTo(106, 110);
      ctx.moveTo(140, 126);
      ctx.arc(112, 126, 28, 0, Math.PI * 2);
    };
    strokeWhiteBorder(path);
    ctx.strokeStyle = "#f1f5f9";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(72, 42);
    ctx.lineTo(106, 110);
    ctx.stroke();
    ctx.fillStyle = "#f43f6e";
    ctx.beginPath();
    ctx.arc(112, 126, 26, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Neon green & coral mini planet/bell (`home-10` far right)
    const path = () => {
      ctx.beginPath();
      ctx.arc(96, 108, 26, 0, Math.PI * 2);
      ctx.moveTo(130, 82);
      ctx.ellipse(96, 82, 34, 13, -0.25, 0, Math.PI * 2);
    };
    strokeWhiteBorder(path);
    ctx.fillStyle = "#ef4444";
    ctx.beginPath();
    ctx.arc(96, 108, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#4ade80";
    ctx.beginPath();
    ctx.ellipse(96, 82, 32, 11, -0.25, 0, Math.PI * 2);
    ctx.fill();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/**
 * Builds the detailed, articulated 3D EVA Astronaut rig matching `lusion.co`:
 * - Rounded white composite helmet + wide curved dark reflective visor + Earth reflection sheen
 * - Quilted matte-white pressure torso + off-white PLSS backpack + off-white chest/hip harness straps
 * - Distinct dark circular chest ports + waist belt buckle + thigh cargo pockets (`home-01`, `home-10`)
 * - Articulated multi-segment shoulders, elbows, gloved hands, hips, knees, cargo shins, and boots
 * - Chromatic blue-violet flame/teardrop plume above the helmet (`home-09`, `home-10`)
 */
function buildAstronautRig(bumpTex: THREE.CanvasTexture, isClone = false): AstronautRig {
  const root = new THREE.Group();
  const bodyPivot = new THREE.Group();
  root.add(bodyPivot);

  const suitMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#eef2fa"),
    roughness: 0.56,
    metalness: 0.06,
    bumpMap: bumpTex,
    bumpScale: 0.018,
  });

  // Explicit off-white composite straps & trim (NEVER flat pure black straps!)
  const harnessMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#cfd6e3"),
    roughness: 0.44,
    metalness: 0.14,
  });

  const darkAccentMat = new THREE.MeshStandardMaterial({
    color: new THREE.Color("#141821"),
    roughness: 0.35,
    metalness: 0.45,
  });

  const visorMat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#05070d"),
    emissive: new THREE.Color("#0d2247"),
    emissiveIntensity: 0.28,
    roughness: 0.07,
    metalness: 0.25,
    clearcoat: 1.0,
    clearcoatRoughness: 0.05,
    reflectivity: 1.0,
  });

  // 1. Torso & pelvis (athletic NASA/SpaceX EVA pressure suit silhouette matching `home-10`)
  const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.215, 0.30, 12, 24), suitMat);
  chest.position.set(0, 0.19, 0);
  chest.scale.set(1.04, 1.0, 0.80);
  bodyPivot.add(chest);

  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.205, 20, 16), suitMat);
  pelvis.position.set(0, -0.08, 0);
  pelvis.scale.set(0.98, 0.82, 0.78);
  bodyPivot.add(pelvis);

  // Off-white PLSS Life Support Backpack
  const backpack = new THREE.Mesh(new THREE.BoxGeometry(0.39, 0.56, 0.22), harnessMat);
  backpack.position.set(0, 0.22, -0.20);
  bodyPivot.add(backpack);

  // Off-white shoulder/chest/groin harness straps + buckle + 2 dark circular chest ports (`home-10`!)
  for (const sx of [-1, 1]) {
    const strap = new THREE.Mesh(new THREE.TorusGeometry(0.195, 0.018, 8, 24, Math.PI * 1.15), harnessMat);
    strap.position.set(sx * 0.105, 0.22, 0.02);
    strap.rotation.y = Math.PI * 0.5;
    strap.rotation.x = sx * 0.14;
    bodyPivot.add(strap);

    const legLoop = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.015, 8, 20, Math.PI), harnessMat);
    legLoop.position.set(sx * 0.082, -0.09, 0.075);
    legLoop.rotation.z = Math.PI;
    bodyPivot.add(legLoop);

    // Distinct dark circular EVA valve ports on lower chest (`home-01`, `home-03`, `home-10`)
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.024, 16), darkAccentMat);
    valve.rotation.x = Math.PI * 0.5;
    valve.position.set(sx * 0.092, 0.055, 0.176);
    bodyPivot.add(valve);
  }

  const chestCrossStrap = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.030, 0.035), harnessMat);
  chestCrossStrap.position.set(0, 0.32, 0.175);
  bodyPivot.add(chestCrossStrap);

  const waistBelt = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.036, 24), harnessMat);
  waistBelt.scale.set(1.02, 1, 0.80);
  waistBelt.position.set(0, -0.04, 0);
  bodyPivot.add(waistBelt);

  // 2. Helmet + wide curved front-facing (`+Z`!) glossy dark visor
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.51, 0.01);
  bodyPivot.add(headGroup);

  const neckRing = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.024, 10, 24), harnessMat);
  neckRing.rotation.x = Math.PI * 0.5;
  neckRing.position.set(0, -0.075, 0);
  headGroup.add(neckRing);

  const helmetShell = new THREE.Mesh(new THREE.SphereGeometry(0.195, 28, 24), suitMat);
  helmetShell.scale.set(0.95, 1.02, 1.03);
  headGroup.add(helmetShell);

  // In Three.js SphereGeometry, `phi = Math.PI * 0.5` points straight toward `+Z` (the viewer)!
  const visorMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.184, 28, 22, Math.PI * 0.5 - Math.PI * 0.37, Math.PI * 0.74, Math.PI * 0.25, Math.PI * 0.44),
    visorMat
  );
  visorMesh.position.set(0, 0.005, 0.026);
  headGroup.add(visorMesh);

  // Chromatic blue/violet teardrop energy plume above helmet (`home-09`, `home-10`)
  const plumeGroup = new THREE.Group();
  plumeGroup.position.set(0, 0.42, 0.02);
  plumeGroup.visible = false;
  headGroup.add(plumeGroup);

  const plumeMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uTime: { value: 0 },
      uOpacity: { value: 0 },
    },
    vertexShader: `
      varying vec2 vUv;
      uniform float uTime;
      void main() {
        vUv = uv;
        vec3 p = position;
        float taper = pow(1.0 - uv.y, 0.65);
        p.x *= taper;
        p.x += sin(uv.y * 7.0 - uTime * 3.2) * 0.035 * uv.y;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform float uOpacity;
      void main() {
        float cx = abs(vUv.x - 0.5) * 2.0;
        float core = smoothstep(1.0, 0.08, cx) * smoothstep(1.0, 0.06, vUv.y);
        float rim = smoothstep(0.95, 0.55, cx) * (1.0 - smoothstep(0.55, 0.15, cx));
        vec3 col = mix(vec3(0.06, 0.28, 1.0), vec3(0.65, 0.85, 1.0), core);
        col += vec3(0.85, 0.35, 0.12) * rim * 0.45;
        float a = (core * 0.92 + rim * 0.35) * uOpacity * smoothstep(0.0, 0.14, vUv.y);
        gl_FragColor = vec4(col, a);
      }
    `,
  });

  if (!isClone) {
    const plumePlaneA = new THREE.Mesh(new THREE.PlaneGeometry(0.28, 0.95, 8, 24), plumeMat);
    plumePlaneA.position.y = 0.34;
    plumeGroup.add(plumePlaneA);
    const plumePlaneB = plumePlaneA.clone();
    plumePlaneB.rotation.y = Math.PI * 0.42;
    plumeGroup.add(plumePlaneB);
  }

  // Helper to construct articulated limbs with pressure-suit cuffs & pockets
  const makeArm = (side: -1 | 1) => {
    const shoulder = new THREE.Group();
    shoulder.position.set(side * 0.245, 0.34, 0);
    bodyPivot.add(shoulder);

    const upper = new THREE.Mesh(new THREE.CapsuleGeometry(0.068, 0.21, 8, 16), suitMat);
    upper.position.set(0, -0.125, 0);
    shoulder.add(upper);

    const elbow = new THREE.Group();
    elbow.position.set(0, -0.255, 0);
    shoulder.add(elbow);

    const fore = new THREE.Mesh(new THREE.CapsuleGeometry(0.062, 0.20, 8, 16), suitMat);
    fore.position.set(0, -0.115, 0);
    elbow.add(fore);

    const cuff = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.013, 8, 16), harnessMat);
    cuff.rotation.x = Math.PI * 0.5;
    cuff.position.set(0, -0.22, 0);
    elbow.add(cuff);

    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.058, 14, 12), suitMat);
    glove.scale.set(0.84, 1.25, 0.68);
    glove.position.set(0, -0.275, 0.01);
    elbow.add(glove);

    return { shoulder, elbow };
  };

  const makeLeg = (side: -1 | 1) => {
    const hip = new THREE.Group();
    hip.position.set(side * 0.112, -0.16, 0);
    bodyPivot.add(hip);

    const thigh = new THREE.Mesh(new THREE.CapsuleGeometry(0.088, 0.29, 8, 16), suitMat);
    thigh.position.set(0, -0.185, 0);
    hip.add(thigh);

    // Sculpted thigh cargo pocket visible in `home-10-end-cta-wait.png`
    const pocket = new THREE.Mesh(new THREE.BoxGeometry(0.10, 0.165, 0.042), harnessMat);
    pocket.position.set(side * 0.012, -0.185, 0.082);
    hip.add(pocket);

    const knee = new THREE.Group();
    knee.position.set(0, -0.375, 0);
    hip.add(knee);

    const shin = new THREE.Mesh(new THREE.CapsuleGeometry(0.076, 0.30, 8, 16), suitMat);
    shin.position.set(0, -0.185, 0);
    knee.add(shin);

    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.115, 0.10, 0.21), harnessMat);
    boot.position.set(0, -0.385, 0.04);
    knee.add(boot);

    return { hip, knee };
  };

  const armL = makeArm(-1);
  const armR = makeArm(1);
  const legL = makeLeg(-1);
  const legR = makeLeg(1);

  return {
    root,
    bodyPivot,
    headGroup,
    visorMesh,
    visorMat,
    suitMat,
    harnessMat,
    plumeGroup,
    plumeMat,
    shoulderL: armL.shoulder,
    elbowL: armL.elbow,
    shoulderR: armR.shoulder,
    elbowR: armR.elbow,
    hipL: legL.hip,
    kneeL: legL.knee,
    hipR: legR.hip,
    kneeR: legR.knee,
  };
}

interface PoseAngles {
  bodyRot: [number, number, number];
  headRot: [number, number, number];
  shL: [number, number, number];
  elL: [number, number, number];
  shR: [number, number, number];
  elR: [number, number, number];
  hipL: [number, number, number];
  knL: number;
  hipR: [number, number, number];
  knR: number;
}

const POSE_TABLET_FLOAT: PoseAngles = {
  bodyRot: [-0.04, 0.03, 0],
  headRot: [0.05, -0.03, 0],
  shL: [-0.45, 0.18, -1.25],
  elL: [-1.45, 0.25, 0.18],
  shR: [-0.45, -0.18, 1.25],
  elR: [-1.45, -0.25, -0.18],
  hipL: [-0.18, 0, -0.10],
  knL: 0.30,
  hipR: [-0.12, 0, 0.10],
  knR: 0.24,
};

const POSE_TUNNEL_DIVE: PoseAngles = {
  bodyRot: [0.52, -0.24, 0.18],
  headRot: [-0.28, 0.10, 0],
  shL: [-0.72, 0.20, -1.22],
  elL: [-0.62, 0, 0.18],
  shR: [-0.68, -0.20, 1.22],
  elR: [-0.58, 0, -0.18],
  hipL: [0.24, 0, -0.16],
  knL: 0.52,
  hipR: [-0.18, 0, 0.16],
  knR: 0.65,
};

const POSE_BREAKOUT: PoseAngles = {
  bodyRot: [-0.08, 0.02, 0.02],
  headRot: [0.06, 0, 0],
  shL: [-0.75, 0.16, -1.42],
  elL: [-0.88, 0, 0.22],
  shR: [-0.75, -0.16, 1.42],
  elR: [-0.88, 0, -0.22],
  hipL: [-0.16, 0, -0.10],
  knL: 0.24,
  hipR: [-0.48, 0, 0.12],
  knR: 0.72,
};

const POSE_STANDING_WAIT: PoseAngles = {
  bodyRot: [0, 0, 0],
  headRot: [0.02, 0, 0],
  shL: [-0.04, 0, -0.14],
  elL: [-0.10, 0, 0.04],
  shR: [-0.04, 0, 0.14],
  elR: [-0.10, 0, -0.04],
  hipL: [-0.02, 0, -0.05],
  knL: 0.04,
  hipR: [-0.02, 0, 0.05],
  knR: 0.04,
};

function blendPose(a: PoseAngles, b: PoseAngles, t: number): PoseAngles {
  const v3 = (p: [number, number, number], q: [number, number, number]): [number, number, number] => [
    lerp(p[0], q[0], t),
    lerp(p[1], q[1], t),
    lerp(p[2], q[2], t),
  ];
  return {
    bodyRot: v3(a.bodyRot, b.bodyRot),
    headRot: v3(a.headRot, b.headRot),
    shL: v3(a.shL, b.shL),
    elL: v3(a.elL, b.elL),
    shR: v3(a.shR, b.shR),
    elR: v3(a.elR, b.elR),
    hipL: v3(a.hipL, b.hipL),
    knL: lerp(a.knL, b.knL, t),
    hipR: v3(a.hipR, b.hipR),
    knR: lerp(a.knR, b.knR, t),
  };
}

function applyPose(rig: AstronautRig, p: PoseAngles) {
  rig.bodyPivot.rotation.set(p.bodyRot[0], p.bodyRot[1], p.bodyRot[2]);
  rig.headGroup.rotation.set(p.headRot[0], p.headRot[1], p.headRot[2]);
  rig.shoulderL.rotation.set(p.shL[0], p.shL[1], p.shL[2]);
  rig.elbowL.rotation.set(p.elL[0], p.elL[1], p.elL[2]);
  rig.shoulderR.rotation.set(p.shR[0], p.shR[1], p.shR[2]);
  rig.elbowR.rotation.set(p.elR[0], p.elR[1], p.elR[2]);
  rig.hipL.rotation.set(p.hipL[0], p.hipL[1], p.hipL[2]);
  rig.kneeL.rotation.set(p.knL, 0, 0);
  rig.hipR.rotation.set(p.hipR[0], p.hipR[1], p.hipR[2]);
  rig.kneeR.rotation.set(p.knR, 0, 0);
}

/**
 * Verified Lusion Goal & Continuous 3D EVA Astronaut Scroll Experience (`#home-goal`)
 * Single continuous spatial & scroll timeline from:
 *   1. `#home-goal-context` editorial + physical left iPad bezel (`#home-goal-image-in`) with inner-screen clip
 *   2. Continuous monotonic tablet zoom & `+0.38 rad` tilt into full-bleed space
 *   3. `"STEP INTO A NEW WORLD / AND LET YOUR / IMAGINATION RUN WILD"` 3D portal zoom
 *   4. Dark metallic 3D greeble corridor + prismatic dispersion portal + 4 astronaut clones + roll twist
 *   5. Royal-blue (`#1933ff`) & sculpted white (`#e8eeff`) organic Voronoi cloud-cutout square tunnel
 *   6. Pullback into desktop display (`#home-goal-image-out`) + 3D chromatic glass shatter + foreground breakout
 *   7. Seamless handoff into `#end-section` standing center astronaut + diamonds + pop-art stickers + CTA
 */
export function GoalTunnelSection() {
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const lastSurfaceDarkRef = useRef(false);
  const goalRef = useRef<HTMLElement | null>(null);
  const imgInRef = useRef<HTMLDivElement | null>(null);
  const tunnelRef = useRef<HTMLDivElement | null>(null);
  const imgOutRef = useRef<HTMLDivElement | null>(null);

  const stageOverlayRef = useRef<HTMLDivElement | null>(null);
  const backdropGlowRef = useRef<HTMLDivElement | null>(null);
  const tabletBezelRef = useRef<HTMLDivElement | null>(null);
  const monitorBezelRef = useRef<HTMLDivElement | null>(null);
  const tunnelTitleWrapRef = useRef<HTMLDivElement | null>(null);
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const fallbackPosterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const goalEl = goalRef.current;
    const imgInEl = imgInRef.current;
    const tunnelEl = tunnelRef.current;
    const imgOutEl = imgOutRef.current;
    const overlayEl = stageOverlayRef.current;
    const backdropEl = backdropGlowRef.current;
    const tabletBezelEl = tabletBezelRef.current;
    const monitorBezelEl = monitorBezelRef.current;
    const titleWrapEl = tunnelTitleWrapRef.current;
    const hostEl = canvasHostRef.current;

    if (
      !goalEl ||
      !imgInEl ||
      !tunnelEl ||
      !imgOutEl ||
      !overlayEl ||
      !backdropEl ||
      !tabletBezelEl ||
      !monitorBezelEl ||
      !titleWrapEl ||
      !hostEl
    ) {
      return;
    }

    const reducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    let renderer: THREE.WebGLRenderer | null = null;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
    } catch {
      if (fallbackPosterRef.current) {
        fallbackPosterRef.current.style.display = "flex";
      }
      return;
    }

    const glRenderer = renderer;
    glRenderer.setClearColor(0x000000, 0);
    glRenderer.outputColorSpace = THREE.SRGBColorSpace;
    glRenderer.toneMapping = THREE.ACESFilmicToneMapping;
    glRenderer.toneMappingExposure = 1.06;
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
    const camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.1, 180);
    camera.position.set(0, 0, 5.2);

    // Studio three-point EVA illumination + grazing corridor cyan/indigo rim lights
    const ambient = new THREE.AmbientLight(0xd8e2ff, 0.72);
    scene.add(ambient);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.35);
    keyLight.position.set(-2.4, 3.8, 6.2);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0x8fb6ff, 0.95);
    fillLight.position.set(3.2, -1.6, 4.0);
    scene.add(fillLight);

    const tunnelRimLight = new THREE.PointLight(0x3b82f6, 3.2, 28, 1.4);
    tunnelRimLight.position.set(0, 0.5, -6);
    scene.add(tunnelRimLight);

    // -------------------------------------------------------------------------
    // 1. Curved Blue Earth Horizon Group (active inside Tablet Entry screen)
    // -------------------------------------------------------------------------
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);

    const earthMat = track(
      new THREE.ShaderMaterial({
        uniforms: {
          uOpacity: { value: 1 },
        },
        vertexShader: `
          varying vec3 vNormalW;
          varying vec3 vPosW;
          varying vec2 vUv;
          void main() {
            vUv = uv;
            vec4 wp = modelMatrix * vec4(position, 1.0);
            vPosW = wp.xyz;
            vNormalW = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * viewMatrix * wp;
          }
        `,
        fragmentShader: `
          varying vec3 vNormalW;
          varying vec3 vPosW;
          varying vec2 vUv;
          uniform float uOpacity;
          float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
          float noise(vec2 p) {
            vec2 i = floor(p); vec2 f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                       mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
          }
          void main() {
            vec3 V = normalize(cameraPosition - vPosW);
            float ndv = clamp(dot(normalize(vNormalW), V), 0.0, 1.0);
            float rim = pow(1.0 - ndv, 2.2);
            float clouds = smoothstep(0.42, 0.78, noise(vUv * vec2(18.0, 10.0) + noise(vUv * 36.0) * 0.55));
            vec3 ocean = mix(vec3(0.02, 0.14, 0.48), vec3(0.08, 0.42, 0.96), ndv * 0.8 + 0.2);
            vec3 surface = mix(ocean, vec3(0.86, 0.93, 1.0), clouds * 0.72);
            vec3 atmo = vec3(0.32, 0.74, 1.0) * rim * 2.15;
            vec3 finalCol = surface + atmo;
            gl_FragColor = vec4(finalCol, uOpacity);
          }
        `,
        transparent: true,
      })
    );

    const earthGeo = track(new THREE.SphereGeometry(5.2, 64, 48));
    const earthMesh = new THREE.Mesh(earthGeo, earthMat);
    earthMesh.position.set(-1.75, -6.45, -1.8);
    earthGroup.add(earthMesh);

    const atmoHaloMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: { uOpacity: { value: 1 } },
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
          void main() {
            vec2 d = (vUv - vec2(0.5, 0.08)) * vec2(1.0, 2.8);
            float r = length(d);
            float band = exp(-pow((r - 0.50) * 11.5, 2.0));
            vec3 col = mix(vec3(0.08, 0.48, 1.0), vec3(0.82, 0.97, 1.0), band);
            gl_FragColor = vec4(col, band * 0.95 * uOpacity);
          }
        `,
      })
    );
    const atmoHalo = new THREE.Mesh(track(new THREE.PlaneGeometry(12.5, 3.8)), atmoHaloMat);
    atmoHalo.position.set(-1.65, -1.55, -2.2);
    earthGroup.add(atmoHalo);

    // -------------------------------------------------------------------------
    // 2. Dark Metallic 3D Greeble Tunnel (`blackTunnel`: `home-05` & `home-06`)
    // -------------------------------------------------------------------------
    const blackTunnelGroup = new THREE.Group();
    blackTunnelGroup.visible = false;
    scene.add(blackTunnelGroup);

    const greebleMat = track(
      new THREE.MeshStandardMaterial({
        color: new THREE.Color("#2a3240"),
        roughness: 0.20,
        metalness: 0.72,
      })
    );
    const greebleBoxGeo = track(new THREE.BoxGeometry(1, 1, 1));
    const PANEL_COUNT = 576;
    const greeblePanels = new THREE.InstancedMesh(greebleBoxGeo, greebleMat, PANEL_COUNT);
    const dummy = new THREE.Object3D();
    const panelColor = new THREE.Color();
    for (let i = 0; i < PANEL_COUNT; i++) {
      const ring = Math.floor(i / 24);
      const slot = i % 24;
      const side = Math.floor(slot / 6);
      const along = ((slot % 6) - 2.5) * 0.92;
      const halfSpan = 2.75;
      const z = 1.5 - ring * 1.45;
      let px = 0;
      let py = 0;
      let sx = 0.78;
      let sy = 0.16 + ((i * 5) % 4) * 0.08;
      if (side === 0) {
        px = along;
        py = halfSpan;
      } else if (side === 1) {
        px = along;
        py = -halfSpan;
      } else if (side === 2) {
        px = -halfSpan;
        py = along;
        sx = 0.16 + ((i * 5) % 4) * 0.08;
        sy = 0.78;
      } else {
        px = halfSpan;
        py = along;
        sx = 0.16 + ((i * 5) % 4) * 0.08;
        sy = 0.78;
      }
      const inset = ((i * 7) % 6) * 0.075;
      dummy.position.set(
        px * (1 - inset * 0.09),
        py * (1 - inset * 0.09),
        z + ((i % 3) - 1) * 0.12
      );
      dummy.rotation.set(0, 0, ((ring % 2) * 0.03));
      dummy.scale.set(sx, sy, 1.15 + ((i * 3) % 4) * 0.22);
      dummy.updateMatrix();
      greeblePanels.setMatrixAt(i, dummy.matrix);

      // Detailed metallic silver/cyan/slate specular variation matching `home-05-black-tunnel-early`!
      const glint = i % 11 === 0 ? 1 : i % 17 === 0 ? 2 : 0;
      if (glint === 1) {
        panelColor.setRGB(0.62, 0.85, 0.95);
      } else if (glint === 2) {
        panelColor.setRGB(0.24, 0.56, 0.72);
      } else {
        const g = 0.14 + ((i * 13) % 9) * 0.024;
        panelColor.setRGB(g * 0.95, g * 1.02, g * 1.12);
      }
      greeblePanels.setColorAt(i, panelColor);
    }
    greeblePanels.instanceMatrix.needsUpdate = true;
    if (greeblePanels.instanceColor) greeblePanels.instanceColor.needsUpdate = true;
    blackTunnelGroup.add(greeblePanels);

    // Chromatic lens dispersion halo ring framing the dark metallic corridor (`home-05`, `home-06`)
    const portalRingMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
        uniforms: { uTime: { value: 0 }, uOpacity: { value: 1 } },
        vertexShader: `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          varying vec2 vUv;
          uniform float uTime;
          uniform float uOpacity;
          void main() {
            vec2 p = (vUv - 0.5) * 2.0;
            float r = length(p);
            float ringR = exp(-pow((r - 0.72) * 19.0, 2.0));
            float ringG = exp(-pow((r - 0.705) * 19.0, 2.0));
            float ringB = exp(-pow((r - 0.69) * 19.0, 2.0));
            vec3 col = vec3(ringR * 0.42, ringG * 0.36, ringB * 0.34);
            float a = clamp(max(max(ringR, ringG), ringB), 0.0, 1.0) * uOpacity;
            gl_FragColor = vec4(col, a);
          }
        `,
      })
    );
    const portalPlane = new THREE.Mesh(track(new THREE.PlaneGeometry(5.2, 5.2)), portalRingMat);
    portalPlane.position.set(0, 0, -2.2);
    blackTunnelGroup.add(portalPlane);

    // -------------------------------------------------------------------------
    // 3. Royal-Blue & Sculpted White Voronoi Square Tunnel (`home-07`, `home-08`, `home-09`)
    // -------------------------------------------------------------------------
    const whiteTunnelGroup = new THREE.Group();
    whiteTunnelGroup.visible = false;
    scene.add(whiteTunnelGroup);

    const voronoiTex = track(createVoronoiTunnelTexture());
    const whiteTunnelWallMat = track(
      new THREE.MeshBasicMaterial({
        map: voronoiTex,
        side: THREE.BackSide,
      })
    );

    const TUNNEL_SEG_LEN = 46;
    const whiteBoxGeo = track(new THREE.BoxGeometry(6.8, 6.8, TUNNEL_SEG_LEN, 1, 1, 8));
    // Scale lengthwise UVs so cloud-Voronoi shapes tile cleanly down the 46-unit square shaft
    const boxUv = whiteBoxGeo.attributes.uv as THREE.BufferAttribute;
    for (let i = 0; i < boxUv.count; i++) {
      // Faces 0..3 are left/right/top/bottom walls in Three.js BoxGeometry
      const faceIdx = Math.floor(i / 4);
      if (faceIdx < 4) {
        const u = boxUv.getX(i);
        const v = boxUv.getY(i);
        if (faceIdx < 2) {
          boxUv.setXY(i, u * 3.4, v * 1.0);
        } else {
          boxUv.setXY(i, u * 1.0, v * 3.4);
        }
      }
    }
    boxUv.needsUpdate = true;

    const whiteTunnelShaft = new THREE.Mesh(whiteBoxGeo, whiteTunnelWallMat);
    whiteTunnelShaft.position.set(0, 0, -TUNNEL_SEG_LEN * 0.46);
    whiteTunnelGroup.add(whiteTunnelShaft);

    // Glowing white end-portal cap deep inside the royal-blue shaft (`home-07`, `home-08`, `home-09`)
    const whiteEndGlowMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: { uOpacity: { value: 1 } },
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
          void main() {
            float d = length(vUv - 0.5) * 2.0;
            float core = smoothstep(0.95, 0.08, d);
            vec3 col = mix(vec3(0.10, 0.22, 1.0), vec3(1.0, 1.0, 1.0), pow(core, 0.65));
            gl_FragColor = vec4(col, uOpacity);
          }
        `,
      })
    );
    const whiteEndCap = new THREE.Mesh(track(new THREE.PlaneGeometry(7.2, 7.2)), whiteEndGlowMat);
    whiteEndCap.position.set(0, 0, -25.0);
    whiteTunnelGroup.add(whiteEndCap);

    // -------------------------------------------------------------------------
    // 4. Main Articulated 3D EVA Astronaut + 4 Tunnel Ghost Clones
    // -------------------------------------------------------------------------
    const suitBumpTex = track(createSuitFabricBumpTexture());
    const mainAstro = buildAstronautRig(suitBumpTex, false);
    track(mainAstro.suitMat);
    track(mainAstro.harnessMat);
    track(mainAstro.visorMat);
    track(mainAstro.plumeMat);
    scene.add(mainAstro.root);

    const clones: AstronautRig[] = [];
    for (let c = 0; c < 4; c++) {
      const cl = buildAstronautRig(suitBumpTex, true);
      track(cl.suitMat);
      track(cl.harnessMat);
      track(cl.visorMat);
      track(cl.plumeMat);
      cl.root.visible = false;
      applyPose(cl, POSE_TUNNEL_DIVE);
      scene.add(cl.root);
      clones.push(cl);
    }

    // -------------------------------------------------------------------------
    // 5. Shattered 3D Chromatic Iridescent Glass Shards (`home-09-glass-break-drop`)
    // -------------------------------------------------------------------------
    const SHARD_COUNT = 112;
    const shardGeo = track(new THREE.ConeGeometry(0.19, 0.44, 3));
    shardGeo.scale(1.0, 1.0, 0.09);
    const shardMat = track(
      new THREE.ShaderMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
        uniforms: {
          uOpacity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: `
          varying vec3 vNormalV;
          varying vec3 vPosV;
          void main() {
            vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
            vPosV = mv.xyz;
            vNormalV = normalize(normalMatrix * mat3(instanceMatrix) * normal);
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: `
          varying vec3 vNormalV;
          varying vec3 vPosV;
          uniform float uOpacity;
          void main() {
            vec3 V = normalize(-vPosV);
            float fres = pow(1.0 - abs(dot(normalize(vNormalV), V)), 1.65);
            vec3 deep = vec3(0.12, 0.28, 0.98);
            vec3 cyan = vec3(0.42, 0.86, 1.0);
            vec3 violet = vec3(0.68, 0.46, 1.0);
            vec3 col = mix(deep, mix(cyan, violet, vNormalV.x * 0.5 + 0.5), fres * 0.92 + 0.18);
            col += vec3(1.0) * pow(fres, 4.0) * 0.65;
            gl_FragColor = vec4(col, (0.48 + fres * 0.48) * uOpacity);
          }
        `,
      })
    );
    const shardsMesh = new THREE.InstancedMesh(shardGeo, shardMat, SHARD_COUNT);
    shardsMesh.visible = false;
    shardsMesh.frustumCulled = false;
    scene.add(shardsMesh);

    const shardSeeds = Array.from({ length: SHARD_COUNT }, (_, i) => {
      const a = (i / SHARD_COUNT) * Math.PI * 2 * 3.7;
      const rad = 0.74 + (((i * 37) % 100) / 100) * 1.68;
      return {
        dirX: Math.cos(a) * rad * 1.45,
        dirY: Math.sin(a) * rad * 0.92,
        dirZ: 0.45 + ((i * 19) % 100) / 100 * 2.25,
        rotX: ((i * 13) % 10) * 0.6,
        rotY: ((i * 29) % 10) * 0.6,
        rotZ: a,
        scale: 0.55 + ((i * 23) % 100) / 100 * 1.25,
      };
    });

    // -------------------------------------------------------------------------
    // 6. `#end-section` Starburst Crystal Diamonds + Pop-Art Stickers (`home-10`)
    // -------------------------------------------------------------------------
    const waitDecorGroup = new THREE.Group();
    waitDecorGroup.visible = false;
    scene.add(waitDecorGroup);

    const diamondGeo = track(new THREE.OctahedronGeometry(0.085, 0));
    const diamondMat = track(
      new THREE.MeshPhysicalMaterial({
        color: new THREE.Color("#dbeafe"),
        emissive: new THREE.Color("#60a5fa"),
        emissiveIntensity: 0.35,
        roughness: 0.08,
        metalness: 0.35,
        clearcoat: 1.0,
      })
    );
    const DIAMOND_COUNT = 22;
    const diamondAnchors: Array<[number, number, number, number]> = [];
    for (let i = 0; i < DIAMOND_COUNT; i++) {
      const angle = (i / DIAMOND_COUNT) * Math.PI * 2 + 0.3;
      const radiusX = 1.05 + ((i * 31) % 7) * 0.34;
      const py = -1.55 + ((i * 17) % 11) * 0.31;
      const pz = -0.6 - ((i * 13) % 5) * 0.45;
      const dm = new THREE.Mesh(diamondGeo, diamondMat);
      dm.position.set(Math.cos(angle) * radiusX, py, pz);
      const sc = 0.55 + ((i * 7) % 5) * 0.16;
      dm.scale.set(sc, sc * 0.72, sc);
      waitDecorGroup.add(dm);
      diamondAnchors.push([dm.position.x, dm.position.y, dm.position.z, i]);
    }

    const stickerMeshes: Array<{ mesh: THREE.Mesh; baseX: number; baseY: number; baseZ: number; phase: number }> = [];
    const stickerCoords: Array<[number, number, number, number]> = [
      [-2.18, -0.82, 0.35, 0], // Lime slime ghost bottom-left
      [-1.72, -1.24, 0.42, 1], // Pizza slice bottom-left
      [-1.18, -1.02, 0.30, 2], // Double eyeballs left-center
      [1.08, -0.96, 0.36, 3],  // Pink lollipop right-center
      [2.26, -0.68, 0.25, 4],  // Neon bell/planet far right
      [-1.06, 0.92, -0.35, 3], // Upper-left mini sticker
      [-0.48, 0.02, -0.25, 0], // Small green lollipop near left shoulder
    ];
    for (const [sx, sy, sz, kind] of stickerCoords) {
      const stTex = track(createStickerTexture(kind));
      const stMat = track(
        new THREE.MeshBasicMaterial({
          map: stTex,
          transparent: true,
          depthWrite: false,
        })
      );
      const stMesh = new THREE.Mesh(track(new THREE.PlaneGeometry(0.42, 0.42)), stMat);
      stMesh.position.set(sx, sy, sz);
      waitDecorGroup.add(stMesh);
      stickerMeshes.push({ mesh: stMesh, baseX: sx, baseY: sy, baseZ: sz, phase: sx * 1.7 + sy });
    }

    // -------------------------------------------------------------------------
    // Layout Measurement & Inspector Synchronization
    // -------------------------------------------------------------------------
    let metrics: GoalLayoutMetrics | null = null;
    let targetScrollY = typeof window !== "undefined" ? window.scrollY : 0;
    let smoothScrollY = targetScrollY;
    let docVisible = true;
    let wasInBand = true;
    let rafId = 0;
    const startClock = performance.now();

    const measure = () => {
      const W = Math.max(1, window.innerWidth);
      const H = Math.max(1, window.innerHeight);
      const sy = window.scrollY;

      const gRect = goalEl.getBoundingClientRect();
      const inRect = imgInEl.getBoundingClientRect();
      const outRect = imgOutEl.getBoundingClientRect();
      const endEl = document.getElementById("end-section");
      const endRect = endEl ? endEl.getBoundingClientRect() : null;

      const goalTop = gRect.top + sy;
      const goalHeight = gRect.height;
      const imgInLeft = inRect.left;
      const imgInTop = inRect.top + sy;
      const imgInWidth = Math.max(1, inRect.width);
      const imgInHeight = Math.max(1, inRect.height);

      const imgOutLeft = outRect.left;
      const imgOutTop = outRect.top + sy;
      const imgOutWidth = Math.max(1, outRect.width);
      const imgOutHeight = Math.max(1, outRect.height);

      const endTop = endRect ? endRect.top + sy : goalTop + goalHeight;
      const endHeight = endRect ? Math.max(H, endRect.height) : H * 2;

      const imgInStart = Math.max(0, imgInTop - H * 0.45);
      const imgInSpan = H * 1.4;
      const imgInEnd = imgInStart + imgInSpan;

      const tunnelStart = imgInEnd;
      const tunnelEnd = Math.max(tunnelStart + H * 4, imgOutTop + imgOutHeight - H);
      const tunnelSpan = Math.max(1, tunnelEnd - tunnelStart);

      metrics = {
        goalTop,
        goalHeight,
        imgInLeft,
        imgInTop,
        imgInWidth,
        imgInHeight,
        imgInStart,
        imgInSpan,
        imgInEnd,
        tunnelStart,
        tunnelEnd,
        tunnelSpan,
        imgOutLeft,
        imgOutTop,
        imgOutWidth,
        imgOutHeight,
        endTop,
        endHeight,
        viewportW: W,
        viewportH: H,
        isMobile: W < 820,
      };

      const dpr = Math.min(2, window.devicePixelRatio || 1);
      glRenderer.setPixelRatio(dpr);
      glRenderer.setSize(W, H, false);

      // Expose exact Lusion Inspector contract for automated harnesses & live inspection
      const blackTitleFrom = tunnelStart;
      const blackTitleTo = tunnelStart + tunnelSpan * 0.24;
      const blackTunnelFrom = blackTitleTo;
      const blackTunnelTo = tunnelStart + tunnelSpan * 0.78;
      const whiteTunnelFrom = blackTunnelTo;
      const whiteTunnelTo = tunnelEnd;
      const astroDropFrom = imgOutTop - H * 0.25;
      const astroDropTo = endTop;
      const astroWaitFrom = endTop;
      const astroWaitTo = endTop + endHeight;

      window.__lusionInspector = {
        ...window.__lusionInspector,
        properties: { hasStarted: true },
        scrollManager: {
          scrollPixel: sy,
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
        homeGoalSectionRanges: {
          baseY: goalTop,
          totalPixelCount: Math.max(1, astroWaitTo - goalTop),
          items: {
            blackTitle: {
              id: "blackTitle",
              pixelFrom: blackTitleFrom,
              pixelCount: blackTitleTo - blackTitleFrom,
              pixelTo: blackTitleTo,
            },
            blackTunnel: {
              id: "blackTunnel",
              pixelFrom: blackTunnelFrom,
              pixelCount: blackTunnelTo - blackTunnelFrom,
              pixelTo: blackTunnelTo,
            },
            whiteTunnel: {
              id: "whiteTunnel",
              pixelFrom: whiteTunnelFrom,
              pixelCount: whiteTunnelTo - whiteTunnelFrom,
              pixelTo: whiteTunnelTo,
            },
            astronautDrop: {
              id: "astronautDrop",
              pixelFrom: astroDropFrom,
              pixelCount: Math.max(1, astroDropTo - astroDropFrom),
              pixelTo: astroDropTo,
            },
            astronautWait: {
              id: "astronautWait",
              pixelFrom: astroWaitFrom,
              pixelCount: Math.max(1, astroWaitTo - astroWaitFrom),
              pixelTo: astroWaitTo,
            },
          },
        },
      };
    };

    const renderSceneAtScroll = (sy: number, elapsedSec: number) => {
      if (!metrics) measure();
      const m = metrics;
      if (!m) return;

      const W = m.viewportW;
      const H = m.viewportH;

      // Active spatial envelope covers from 1.2 viewports before `imgIn` all the way to the bottom of `#end-section`
      const activeStart = Math.max(0, m.goalTop - H * 0.9);
      const activeEnd = m.endTop + m.endHeight;

      if (sy < activeStart || sy > activeEnd) {
        overlayEl.style.visibility = "hidden";
        if (lastSurfaceDarkRef.current) {
          lastSurfaceDarkRef.current = false;
          setActiveSurface("ice");
        }
        return;
      }
      overlayEl.style.visibility = "visible";

      // -----------------------------------------------------------------------
      // Continuous Monotonic Sub-Progresses (100% pure function of `sy`!)
      // -----------------------------------------------------------------------
      // `tEmerge`: 0 at resting tablet entry (`home-01`), -> 1 when screen swallows full viewport (`home-03` = 0.90)
      const tEmerge = clamp01((sy - m.imgInStart) / m.imgInSpan);
      const wantDarkHeader = tEmerge > 0.75;
      if (lastSurfaceDarkRef.current !== wantDarkHeader) {
        lastSurfaceDarkRef.current = wantDarkHeader;
        setActiveSurface(wantDarkHeader ? "void" : "ice");
      }
      // `tTunnel`: 0..1 across deep tunnel journey (`home-04`..`home-07`)
      const tTunnel = clamp01((sy - m.tunnelStart) / m.tunnelSpan);
      // `tOutPull`: 0 -> 1 as royal-blue tunnel shrinks into `#home-goal-image-out` desktop monitor (`home-08`)
      const outPullStart = m.imgOutTop - H * 0.95;
      const outPullEnd = m.imgOutTop - H * 0.08;
      const tOutPull = smoothstep(outPullStart, outPullEnd, sy);
      // `tShatter`: 0 -> 1 across glass-break & foreground astronaut breakout (`home-09`..`home-10`)
      const shatterStart = m.imgOutTop + H * 0.06;
      const shatterEnd = m.endTop;
      const tShatter = clamp01((sy - shatterStart) / Math.max(1, shatterEnd - shatterStart));
      // `tWait`: 0 -> 1 down `#end-section` (`home-10` -> footer)
      const tWait = clamp01((sy - m.endTop) / Math.max(1, m.endHeight));

      // Keep inspector scrollPixel current
      if (window.__lusionInspector?.scrollManager) {
        window.__lusionInspector.scrollManager.scrollPixel = sy;
      }

      // -----------------------------------------------------------------------
      // A. Physical Tablet Bezel (`home-01` -> `home-03` & reverse `home-11`)
      //    SINGLE continuous transform scaling & rotating BOTH bezel & clip window!
      // -----------------------------------------------------------------------
      const inDocScreenTop = m.imgInTop - sy;
      const inCenterX0 = m.imgInLeft + m.imgInWidth * 0.5;
      const inCenterY0 = inDocScreenTop + m.imgInHeight * 0.5;

      // Smooth exponential scale curve so at tEmerge=0 it sits 1:1 over `#home-goal-image-in`,
      // at tEmerge=0.40 (`home-02`) it scales ~1.7x & tilts +0.17 rad, and by tEmerge=0.88 (`home-03`)
      // its inner black screen completely fills 100vw x 100vh with zero seam!
      const emergeEase = tEmerge * tEmerge * (2.2 - 1.2 * tEmerge);
      const minFullScale =
        (Math.hypot(W, H) / Math.max(1, Math.min(m.imgInWidth, m.imgInHeight))) * 1.24;
      const tabletScale = Math.pow(minFullScale, clamp01(tEmerge / 0.86));
      const tabletRotRad = smoothstep(0.04, 0.85, tEmerge) * 0.39;
      const tabletCenterX = lerp(inCenterX0, W * 0.44, emergeEase);
      const tabletCenterY = lerp(inCenterY0, H * 0.52, emergeEase);

      const inTabletPhase = tOutPull <= 0.001 && tTunnel < 0.02;
      if (inTabletPhase && tEmerge < 0.96) {
        tabletBezelEl.style.display = "block";
        tabletBezelEl.style.width = `${m.imgInWidth}px`;
        tabletBezelEl.style.height = `${m.imgInHeight}px`;
        tabletBezelEl.style.transform = `translate3d(${tabletCenterX - m.imgInWidth * 0.5}px, ${
          tabletCenterY - m.imgInHeight * 0.5
        }px, 0) rotate(${tabletRotRad}rad) scale(${tabletScale})`;
      } else {
        tabletBezelEl.style.display = "none";
      }

      // Clip `hostEl` strictly inside the inner tablet screen whenever `tEmerge < 0.87`
      // -> GUARANTEES ZERO astronaut head/hand/foot pop-through outside the bezel at EVERY scroll stop!
      if (inTabletPhase && tEmerge < 0.87) {
        const padFracX = 0.036;
        const padFracY = 0.046;
        const innerW = m.imgInWidth * (1 - padFracX * 2) * tabletScale;
        const innerH = m.imgInHeight * (1 - padFracY * 2) * tabletScale;
        const radiusPx = Math.max(12, 22 * tabletScale);
        hostEl.style.clipPath = "none";
        hostEl.style.width = `${innerW}px`;
        hostEl.style.height = `${innerH}px`;
        hostEl.style.borderRadius = `${radiusPx}px`;
        hostEl.style.overflow = "hidden";
        hostEl.style.transform = `translate3d(${tabletCenterX - innerW * 0.5}px, ${
          tabletCenterY - innerH * 0.5
        }px, 0) rotate(${tabletRotRad}rad)`;

        glRenderer.setSize(Math.max(2, Math.round(innerW)), Math.max(2, Math.round(innerH)), false);
        camera.aspect = innerW / Math.max(1, innerH);
      } else {
        hostEl.style.width = `${W}px`;
        hostEl.style.height = `${H}px`;
        hostEl.style.borderRadius = "0px";
        hostEl.style.overflow = "visible";
        hostEl.style.transform = "translate3d(0,0,0)";

        glRenderer.setSize(W, H, false);
        camera.aspect = W / Math.max(1, H);
      }

      // -----------------------------------------------------------------------
      // B. Backdrop Color & Desktop Monitor Frame (`home-08`, `home-09`, `home-10`)
      // -----------------------------------------------------------------------
      const outCenterX = m.imgOutLeft + m.imgOutWidth * 0.5;
      // During shatter (`home-09` -> `home-10`), monitor smoothly drifts up with document scroll
      const outBaseY =
        tShatter <= 0.001
          ? lerp(H * 0.5, H * 0.47, tOutPull)
          : lerp(H * 0.47, -m.imgOutHeight * 0.9, smoothstep(0.55, 1.0, tShatter));

      if (tEmerge < 0.87 && inTabletPhase) {
        // Transparent overlay outside the clipped tablet screen so `#home-goal-context` editorial shines cleanly!
        backdropEl.style.opacity = "0";
      } else if (tOutPull > 0.01 && tWait <= 0.001) {
        // Deep royal-indigo ambient monitor glow fading smoothly to pure `#000000` at `#end-section` (`home-10`)
        const indigoFade = 1 - smoothstep(0.62, 0.98, tShatter);
        backdropEl.style.opacity = "1";
        backdropEl.style.background = `radial-gradient(ellipse 68% 58% at 50% 48%, rgba(28, 44, 152, ${(
          0.92 * indigoFade
        ).toFixed(3)}) 0%, rgba(10, 16, 62, ${(0.95 * indigoFade).toFixed(3)}) 48%, #000000 100%)`;
      } else if (tWait > 0.001) {
        // In `#end-section`, transparent backdrop lets `#end-section`'s own `#000000` + white CTA copy shine through!
        backdropEl.style.opacity = "0";
      } else {
        backdropEl.style.opacity = "1";
        backdropEl.style.background = "#000000";
      }

      // Desktop Monitor Bezel + Brushed Silver Stand (`home-08` & `home-09`)
      if (tOutPull > 0.02 && tShatter < 0.94) {
        const monScale = lerp(2.35, 1.0, smoothstep(0.0, 0.86, tOutPull));
        const monRot = lerp(-0.26, 0.0, smoothstep(0.0, 0.72, tOutPull));
        monitorBezelEl.style.display = "block";
        monitorBezelEl.style.width = `${m.imgOutWidth}px`;
        monitorBezelEl.style.height = `${m.imgOutHeight}px`;
        monitorBezelEl.style.opacity = String(1 - smoothstep(0.76, 0.94, tShatter));
        monitorBezelEl.style.transform = `translate3d(${outCenterX - m.imgOutWidth * 0.5}px, ${
          outBaseY - m.imgOutHeight * 0.5
        }px, 0) rotate(${monRot}rad) scale(${monScale})`;
      } else {
        monitorBezelEl.style.display = "none";
      }

      // -----------------------------------------------------------------------
      // C. 3D Portal Headline (`"STEP INTO A NEW WORLD..."` — `home-04`)
      // -----------------------------------------------------------------------
      const titleIn = smoothstep(0.015, 0.09, tTunnel);
      const titleOut = 1 - smoothstep(0.18, 0.28, tTunnel);
      const titleVis = titleIn * titleOut;
      if (titleVis > 0.005) {
        const titleScale = lerp(0.74, 2.35, smoothstep(0.015, 0.28, tTunnel));
        titleWrapEl.style.display = "flex";
        titleWrapEl.style.opacity = String(titleVis);
        titleWrapEl.style.transform = `translate3d(-50%, -50%, 0) scale(${titleScale})`;
      } else {
        titleWrapEl.style.display = "none";
      }

      // -----------------------------------------------------------------------
      // D. 3D World Subsystems: Earth, Black Greeble Corridor, Blue/White Tunnel, Shards, Diamonds
      // -----------------------------------------------------------------------
      camera.fov = m.isMobile ? 54 : 45;
      camera.updateProjectionMatrix();

      // 1. Earth horizon (`home-01` -> fades smoothly by `home-03` so deep space is crisp black!)
      const earthAlpha = clamp01(1 - smoothstep(0.32, 0.80, tEmerge)) * (tTunnel > 0.01 ? 0 : 1);
      earthGroup.visible = earthAlpha > 0.005;
      if (earthGroup.visible) {
        earthMat.uniforms.uOpacity.value = earthAlpha;
        atmoHaloMat.uniforms.uOpacity.value = earthAlpha;
        earthGroup.position.set(
          lerp(0.15, -1.2, tEmerge),
          lerp(0.55, -2.6, smoothstep(0.15, 0.82, tEmerge)),
          0
        );
      }

      // 2. Dark Metallic Greeble Corridor (`home-05`..`home-06`)
      const blackIn = smoothstep(0.20, 0.31, tTunnel);
      const blackOut = 1 - smoothstep(0.76, 0.84, tTunnel);
      const blackVis = blackIn * blackOut;
      blackTunnelGroup.visible = blackVis > 0.01;
      if (blackTunnelGroup.visible) {
        const travel = ((tTunnel * 42) % 1.45);
        blackTunnelGroup.position.set(0, 0, travel);
        // Stereographic twist & roll rotation matching `home-06-black-tunnel-twist`!
        const twistProg = smoothstep(0.46, 0.78, tTunnel);
        blackTunnelGroup.rotation.set(
          Math.sin(twistProg * Math.PI) * 0.14,
          Math.sin(twistProg * Math.PI * 0.8) * 0.20,
          twistProg * 1.18
        );
        portalRingMat.uniforms.uTime.value = elapsedSec;
        portalRingMat.uniforms.uOpacity.value = blackVis;
        portalPlane.position.z = -1.6;
      }

      // 3. Royal-Blue & White Voronoi Square Tunnel (`home-07`, `home-08`, `home-09`)
      const whiteIn = smoothstep(0.76, 0.84, tTunnel);
      const whiteOut = 1 - smoothstep(0.78, 0.94, tShatter);
      const whiteVis = whiteIn * whiteOut * (tWait > 0.001 ? 0 : 1);
      whiteTunnelGroup.visible = whiteVis > 0.01;
      if (whiteTunnelGroup.visible) {
        voronoiTex.offset.y = -tTunnel * 3.8;
        const monShrink =
          tOutPull > 0.01 ? lerp(1.0, m.isMobile ? 0.56 : 0.65, smoothstep(0.0, 0.86, tOutPull)) : 1.0;
        const wideAspect =
          tOutPull > 0.01 ? lerp(1.0, m.isMobile ? 1.28 : 1.68, smoothstep(0.0, 0.86, tOutPull)) : 1.0;
        const monRoll =
          tOutPull > 0.01
            ? lerp(0.68, 0.0, smoothstep(0.0, 0.72, tOutPull))
            : lerp(0.55, 0.82, smoothstep(0.76, 1.0, tTunnel));
        const tunnelShiftY =
          tShatter > 0.001 ? ((H * 0.5 - outBaseY) / H) * 5.2 : 0;
        whiteTunnelGroup.scale.set(monShrink * wideAspect, monShrink, monShrink);
        whiteTunnelGroup.rotation.set(0, 0, monRoll);
        whiteTunnelGroup.position.set(0, tunnelShiftY, tOutPull > 0.01 ? -4.2 : 0);
        whiteEndGlowMat.uniforms.uOpacity.value = whiteVis;
      }

      // 4. Shattered 3D Chromatic Glass Shards (`home-09`)
      const shardVis =
        smoothstep(0.10, 0.24, tShatter) * (1 - smoothstep(0.76, 0.96, tShatter)) * (tWait > 0.001 ? 0 : 1);
      shardsMesh.visible = shardVis > 0.005;
      if (shardsMesh.visible) {
        const burst = smoothstep(0.08, 0.72, tShatter);
        shardMat.uniforms.uOpacity.value = shardVis;
        for (let i = 0; i < SHARD_COUNT; i++) {
          const s = shardSeeds[i];
          const spread = 0.35 + burst * 2.35;
          dummy.position.set(
            s.dirX * spread,
            s.dirY * spread + 0.15 - burst * burst * 0.55,
            1.15 + s.dirZ * burst * 1.15
          );
          dummy.rotation.set(
            s.rotX + burst * 2.2,
            s.rotY + burst * 2.6,
            s.rotZ + burst * 1.5
          );
          dummy.scale.setScalar(s.scale * (1 - burst * 0.18));
          dummy.updateMatrix();
          shardsMesh.setMatrixAt(i, dummy.matrix);
        }
        shardsMesh.instanceMatrix.needsUpdate = true;
      }

      // 5. `#end-section` Starburst Diamonds & Stickers (`home-10`)
      const waitVis = smoothstep(0.92, 1.0, tShatter);
      waitDecorGroup.visible = waitVis > 0.01;
      if (waitDecorGroup.visible) {
        const upwardScrollWorld = tWait * 5.6;
        waitDecorGroup.position.set(0, upwardScrollWorld * 0.65, 0);
        waitDecorGroup.children.forEach((child, idx) => {
          if (idx < DIAMOND_COUNT) {
            const [bx, by, bz, seedIdx] = diamondAnchors[idx];
            child.position.set(
              bx,
              by + Math.sin(elapsedSec * 1.1 + seedIdx) * (reducedMotion ? 0 : 0.05),
              bz
            );
            child.rotation.set(elapsedSec * 0.5 + seedIdx, elapsedSec * 0.7 + seedIdx, 0);
          }
        });
        for (const st of stickerMeshes) {
          st.mesh.position.set(
            st.baseX * (m.isMobile ? 0.52 : 1.0),
            st.baseY + (reducedMotion ? 0 : Math.sin(elapsedSec * 1.25 + st.phase) * 0.045),
            st.baseZ
          );
          st.mesh.rotation.z = Math.sin(elapsedSec * 0.8 + st.phase) * (reducedMotion ? 0 : 0.08);
        }
      }

      // -----------------------------------------------------------------------
      // E. Continuous 3D Astronaut Spatial Path, Pose & Lighting (ZERO cuts!)
      // -----------------------------------------------------------------------
      let pose: PoseAngles;
      let ax = 0;
      let ay = 0;
      let az = 2.4;
      const aScale = 1.0;
      const worldSpinX = 0;
      let worldSpinY = 0;
      let worldSpinZ = 0;

      if (tTunnel <= 0.001) {
        // Stage 1–2 (`home-01` -> `home-03` & reverse `home-11`):
        // Inside tablet screen -> waist-up EVA framing in `home-01` zooming cleanly to left-center `home-03`!
        pose = POSE_TABLET_FLOAT;
        ax = lerp(0.02, m.isMobile ? -0.18 : -0.68, smoothstep(0.25, 0.88, tEmerge));
        ay = lerp(-0.66, -0.56, smoothstep(0.15, 0.88, tEmerge));
        az = lerp(3.45, 2.75, smoothstep(0.10, 0.90, tEmerge));
        worldSpinZ = lerp(0, -0.32, smoothstep(0.25, 0.88, tEmerge));
        mainAstro.visorMat.emissive.setHex(0x164488);
        mainAstro.visorMat.emissiveIntensity = lerp(0.55, 0.16, tEmerge);
        mainAstro.plumeGroup.visible = false;
      } else if (tOutPull <= 0.001) {
        // Stage 3–5 (`home-04` -> `home-05` -> `home-06` -> `home-07`):
        // Continuous freefall through title portal, black greeble tunnel (with upside-down roll in `home-06`),
        // and deep royal-blue/white Voronoi tunnel (`home-07`)!
        const toDive = smoothstep(0.0, 0.16, tTunnel);
        pose = blendPose(POSE_TABLET_FLOAT, POSE_TUNNEL_DIVE, toDive);

        const intoWhite = smoothstep(0.75, 0.92, tTunnel);
        ax = lerp(
          lerp(m.isMobile ? -0.15 : -0.55, 0.02, smoothstep(0.0, 0.28, tTunnel)),
          0.16,
          intoWhite
        );
        ay = lerp(-0.32, 0.02, smoothstep(0.15, 0.35, tTunnel));
        // Dives smoothly down the corridor axis in `home-05`, `home-06`, and `home-07` just like reference!
        az = lerp(2.25, -4.4, smoothstep(0.16, 0.42, tTunnel));
        worldSpinZ = lerp(-0.30, Math.PI * 1.0, smoothstep(0.24, 0.46, tTunnel));
        worldSpinY = Math.sin(tTunnel * Math.PI * 1.5) * 0.24;

        mainAstro.visorMat.emissive.setHex(intoWhite > 0.5 ? 0x1d4ed8 : 0x0f2942);
        mainAstro.visorMat.emissiveIntensity = lerp(0.18, 0.42, intoWhite);
        mainAstro.plumeGroup.visible = false;
      } else if (tWait <= 0.001) {
        // Stage 6 (`home-08` desktop pullback -> `home-09` glass-shatter foreground breakout!):
        const burst = smoothstep(0.12, 0.56, tShatter);
        const settleStand = smoothstep(0.62, 1.0, tShatter);
        pose = blendPose(
          blendPose(POSE_TUNNEL_DIVE, POSE_BREAKOUT, burst),
          POSE_STANDING_WAIT,
          settleStand
        );
        ax = 0;
        ay = lerp(0.12, m.isMobile ? -0.10 : -0.44, settleStand);
        az = lerp(-2.2, m.isMobile ? 0.55 : 2.18, burst);
        worldSpinZ = lerp(0.35, 0, burst);
        mainAstro.visorMat.emissive.setHex(0x0b1636);
        mainAstro.visorMat.emissiveIntensity = 0.22;

        // Chromatic helmet plume ignites during breakout (`home-09`) and persists into `home-10`!
        mainAstro.plumeGroup.visible = burst > 0.15;
        mainAstro.plumeMat.uniforms.uTime.value = elapsedSec;
        mainAstro.plumeMat.uniforms.uOpacity.value = burst * 0.92;
      } else {
        // Stage 7 (`home-10`: standing centered in `#end-section`, scrolling smoothly up as user continues!)
        pose = POSE_STANDING_WAIT;
        ax = 0;
        const scrollUpWorld = Math.max(0, tWait - 0.05) * (m.isMobile ? 4.2 : 6.4);
        ay = (m.isMobile ? 0.06 : -0.44) + scrollUpWorld;
        az = m.isMobile ? 0.45 : 2.18;
        mainAstro.visorMat.emissive.setHex(0x09122b);
        mainAstro.visorMat.emissiveIntensity = 0.18;
        mainAstro.plumeGroup.visible = true;
        mainAstro.plumeMat.uniforms.uTime.value = elapsedSec;
        mainAstro.plumeMat.uniforms.uOpacity.value = 0.88;
      }

      // Subtle bounded idle breathing ONLY outside strict tablet clip so forward/reverse is 100% drift-free
      const idleAmp = reducedMotion || tEmerge < 0.95 ? 0 : 1;
      applyPose(mainAstro, pose);
      if (idleAmp > 0 && tWait > 0.001) {
        mainAstro.shoulderR.rotation.z += Math.sin(elapsedSec * 1.8) * 0.04;
        mainAstro.headGroup.rotation.y += Math.sin(elapsedSec * 1.1) * 0.05;
      }

      mainAstro.root.position.set(ax, ay + Math.sin(elapsedSec * 1.4) * 0.02 * idleAmp, az);
      mainAstro.root.rotation.set(worldSpinX, worldSpinY, worldSpinZ);
      mainAstro.root.scale.setScalar(aScale);

      // Update 4 trailing ghost clones inside `blackTunnel` (`home-05` & `home-06`)
      const clonesActive = tTunnel > 0.28 && tTunnel < 0.80 && tOutPull <= 0.001;
      for (let c = 0; c < clones.length; c++) {
        const cl = clones[c];
        cl.root.visible = clonesActive;
        if (clonesActive) {
          const depthT = (c + 1) / (clones.length + 0.5);
          const spiralA = tTunnel * 9.0 + c * 1.55;
          cl.root.position.set(
            Math.cos(spiralA) * (0.85 + c * 0.28),
            Math.sin(spiralA) * (0.62 + c * 0.22),
            -2.4 - depthT * 11.5
          );
          cl.root.rotation.set(0.45 + c * 0.3, spiralA * 0.35, worldSpinZ + c * 0.75);
          cl.root.scale.setScalar(0.88 - c * 0.08);
        }
      }

      glRenderer.render(scene, camera);
    };

    const tick = () => {
      if (!docVisible) {
        rafId = 0;
        return;
      }
      targetScrollY = window.scrollY;
      const vhNow = window.innerHeight;
      const inBand =
        metrics !== null &&
        targetScrollY + vhNow >= metrics.goalTop - vhNow * 0.5 &&
        targetScrollY <= metrics.goalTop + metrics.goalHeight + vhNow * 1.35;
      if (!inBand) {
        if (wasInBand) {
          renderSceneAtScroll(targetScrollY, (performance.now() - startClock) * 0.001);
          wasInBand = false;
        }
        rafId = 0;
        return;
      }
      wasInBand = true;

      const diff = targetScrollY - smoothScrollY;
      // Instant snap on programmatic jumps (> 0.42 viewport), critically damped smooth glide on wheel/touch
      if (Math.abs(diff) > window.innerHeight * 0.42 || reducedMotion) {
        smoothScrollY = targetScrollY;
      } else {
        smoothScrollY += diff * 0.34;
        if (Math.abs(targetScrollY - smoothScrollY) < 0.15) {
          smoothScrollY = targetScrollY;
        }
      }

      const elapsedSec = (performance.now() - startClock) * 0.001;
      renderSceneAtScroll(smoothScrollY, elapsedSec);
      rafId = window.requestAnimationFrame(tick);
    };

    const ensureLoop = () => {
      if (!rafId && docVisible) {
        rafId = window.requestAnimationFrame(tick);
      }
    };

    const onScroll = () => {
      targetScrollY = window.scrollY;
      ensureLoop();
    };

    const onResize = () => {
      measure();
      renderSceneAtScroll(window.scrollY, (performance.now() - startClock) * 0.001);
    };

    const onVisibility = () => {
      docVisible = document.visibilityState === "visible";
      ensureLoop();
    };

    const ro = new ResizeObserver(() => {
      measure();
    });

    measure();
    ro.observe(goalEl);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    ensureLoop();

    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);

      for (const item of disposables) {
        item.dispose();
      }
      glRenderer.dispose();
      if (glRenderer.domElement.parentElement === hostEl) {
        hostEl.removeChild(glRenderer.domElement);
      }
    };
  }, [setActiveSurface]);

  return (
    <section
      ref={goalRef}
      id="home-goal"
      aria-label="Our Goal"
      className="relative w-full bg-[#f0f1fa] text-[#111319]"
    >
      {/* =======================================================================
          Part A: Editorial Context Band + Left Physical Tablet Bezel (`home-01`)
          ======================================================================= */}
      <div
        id="home-goal-context"
        className="relative z-10 w-full overflow-x-clip bg-[#f0f1fa] pt-40 pb-36 md:pt-56 md:pb-32"
      >
        {/* Sculptural 3D Turquoise Tube Loop sweeping behind upper-right title (`home-01`) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 960"
          fill="none"
          className="pointer-events-none absolute inset-x-0 top-0 h-full w-full select-none"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="goalRibbonTube" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5ffbf5" />
              <stop offset="52%" stopColor="#46f0e8" />
              <stop offset="100%" stopColor="#6ffcf6" />
            </linearGradient>
          </defs>
          <path
            d="M 118 -40 C 175 235, 315 275, 342 70 C 362 -75, 468 -55, 398 118 C 338 265, 326 545, 456 540"
            stroke="url(#goalRibbonTube)"
            strokeWidth="26"
            strokeLinecap="round"
          />
          <path
            d="M 118 -40 C 175 235, 315 275, 342 70 C 362 -75, 468 -55, 398 118 C 338 265, 326 545, 456 540"
            stroke="#c7fffe"
            strokeOpacity="0.45"
            strokeWidth="7"
            strokeLinecap="round"
          />
        </svg>

        <div
          id="home-goal-context-inner"
          className="relative mx-auto w-full px-[var(--gutter-x)]"
        >
          {/* Large Left-Indented Display Heading (`Where Creative Ideas Become Immersive Experiences`) */}
          <h2
            id="home-goal-title"
            className="max-w-[14ch] pl-0 min-[820px]:pl-[5.2vw] font-sans text-[clamp(3.0rem,6.8vw,6.35rem)] font-normal leading-[1.03] tracking-[-0.03em] text-[#0c0e14]"
          >
            {LUSION_HOME.goal.heading}
          </h2>

          {/* Responsive Two-Column Row:
              - Mobile (<820px): Copy paragraphs FIRST, then full-width Tablet Bezel below (`390x844/home-01`)
              - Desktop (>=820px): Left Tablet Bezel (`53%`) + Right Two Paragraphs (`40%`) (`1440x900/home-01`) */}
          <div className="mt-10 min-[820px]:mt-14 flex flex-col min-[820px]:flex-row-reverse min-[820px]:items-end min-[820px]:justify-between gap-10 min-[820px]:gap-8">
            <div
              id="home-goal-texts"
              className="w-full min-[820px]:w-[40.5%] min-[820px]:pb-10 space-y-6 font-sans text-[clamp(0.95rem,1.08vw,1.08rem)] font-normal leading-[1.45] text-[#151821]"
            >
              {LUSION_HOME.goal.paragraphs.map((para, idx) => (
                <p key={idx} className="home-goal-texts-paragraph">
                  <span className="home-goal-texts-p block">{para}</span>
                </p>
              ))}
            </div>

            {/* Anchor Rect for Physical Tablet Device (`#home-goal-image-in`) */}
            <div
              ref={imgInRef}
              id="home-goal-image-in"
              className="relative w-full min-[820px]:w-[46.5%] aspect-[4/2.95] rounded-[24px] bg-[#07090e]"
            >
              {/* Graceful Reduced-Motion / Non-WebGL Fallback Poster */}
              <div
                ref={fallbackPosterRef}
                style={{ display: "none" }}
                className="h-full w-full items-center justify-center rounded-[24px] bg-gradient-to-b from-[#050811] via-[#09183a] to-[#1a56db] p-8 text-center text-white"
              >
                <p className="font-sans text-lg uppercase tracking-[0.08em]">
                  Step into a new world and let your imagination run wild
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* =======================================================================
          Part B: Deep 3D Tunnel Scroll Track + Exit Monitor Anchor (`#home-goal-image-out`)
          ======================================================================= */}
      <div
        ref={tunnelRef}
        id="home-goal-tunnel"
        className="relative w-full bg-[#000000]"
        style={{ height: "3550vh" }}
      >
        {/* Exit Desktop Display Anchor positioned near bottom of `#home-goal` (`home-08`, `home-09`) */}
        <div className="pointer-events-none absolute inset-x-0 bottom-[135vh] flex flex-col items-center justify-center">
          <div
            ref={imgOutRef}
            id="home-goal-image-out"
            className="w-[93vw] aspect-[4/3.05] min-[820px]:w-[81vw] min-[820px]:max-w-[1180px] min-[820px]:aspect-[16/9.6]"
          />
        </div>
      </div>

      {/* =======================================================================
          Part C: Fixed Full-Viewport Hardware-Accelerated Stage Overlay
          Synchronizes backdrop, tablet bezel, 3D WebGL canvas & desktop monitor
          ======================================================================= */}
      <div
        ref={stageOverlayRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-[12]"
        style={{ visibility: "hidden" }}
      >
        {/* Dynamic Space / Indigo Glow Backdrop */}
        <div ref={backdropGlowRef} className="absolute inset-0 transition-none" />

        {/* Physical Dark Brushed-Aluminum iPad Pro Bezel (`home-01` -> `home-03` & `home-11`) */}
        <div
          ref={tabletBezelRef}
          className="absolute left-0 top-0 rounded-[26px] border-[2px] border-[#343844] bg-[#0b0d12] shadow-[0_28px_70px_rgba(8,12,28,0.42)] will-change-transform"
          style={{ display: "none", transformOrigin: "50% 50%" }}
        >
          {/* Left bezel camera & LiDAR sensors matching `tablet.png` */}
          <span className="absolute left-[1.3%] top-[46%] h-2 w-2 rounded-full bg-[#1a2234]" />
          <span className="absolute left-[1.3%] top-[52%] h-1.5 w-1.5 rounded-full bg-[#151b28]" />
        </div>

        {/* Desktop Display Bezel + Brushed Aluminum Stand (`home-08` & `home-09`)
            Rendered BEHIND `canvasHostRef` during `home-09` shatter so astronaut & shards break IN FRONT! */}
        <div
          ref={monitorBezelRef}
          className="absolute left-0 top-0 will-change-transform"
          style={{ display: "none", transformOrigin: "50% 50%" }}
        >
          {/* Brushed silver stand neck below chin matching `desktop.png` */}
          <div
            className="mx-auto"
            style={{
              position: "absolute",
              left: "50%",
              bottom: "-15.5%",
              transform: "translateX(-50%)",
              width: "18%",
              height: "16%",
              background:
                "linear-gradient(90deg, #59607a 0%, #8f98b8 28%, #9ba4c4 52%, #676f8c 82%, #4a5168 100%)",
              borderBottomLeftRadius: "4px",
              borderBottomRightRadius: "4px",
              boxShadow: "0 12px 28px rgba(0,0,0,0.65)",
            }}
          />
          {/* Crisp dark studio display chassis */}
          <div className="h-full w-full rounded-[6px] border-[14px] border-[#0a0c12] bg-[#030612] shadow-[0_0_90px_rgba(32,58,205,0.45)]" />
        </div>

        {/* Continuous Single-World Three.js WebGL Stage Host */}
        <div
          ref={canvasHostRef}
          className="absolute left-0 top-0 will-change-transform"
          style={{ transformOrigin: "50% 50%" }}
        />

        {/* 3D Portal Headline (`home-04-title-portal`) */}
        <div
          ref={tunnelTitleWrapRef}
          id="home-goal-tunnel-title"
          className="pointer-events-none absolute left-1/2 top-1/2 flex w-[92vw] max-w-[1160px] flex-col items-center text-center text-white will-change-transform"
          style={{ display: "none" }}
        >
          {LUSION_HOME.goal.tunnelTitleLines.map((line, i) => (
            <span
              key={i}
              className="home-goal-tunnel-title-line block font-sans text-[clamp(1.75rem,3.65vw,3.45rem)] font-normal uppercase leading-[1.16] tracking-[0.04em] text-white drop-shadow-[0_2px_24px_rgba(90,145,255,0.28)]"
            >
              {line}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
