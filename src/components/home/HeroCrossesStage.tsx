"use client";

import React, { Component, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { createHollowCrossGeometry } from "@/components/home/HollowCrossGeometry";
import { soundEngine } from "@/lib/audio";
import { useStudioStore } from "@/lib/store";

/**
 * Verified Lusion Hero Accent Palette (`COLORS$1` in reference runtime)
 * Starts deterministically at index 0 (`#061dfb` electric cobalt) and cycles on click.
 */
export const HERO_ACCENT_PALETTE = [
  "#061dfb",
  "#ADFF00",
  "#f6000e",
  "#7e09f5",
  "#ffc000",
] as const;

type SurfaceKind = "accent" | "white" | "black";

interface CrossBodySpec {
  kind: SurfaceKind;
  isGlossy: boolean;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  quaternion: THREE.Quaternion;
  angularVelocity: THREE.Vector3;
  radius: number;
  mass: number;
  frictionTot: number;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const CROSS_VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vLocalPos = position;
    vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
    vViewPos = -mvPos.xyz;
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * mvPos;
  }
`;

const CROSS_FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uRoughness;
  uniform vec3 uKeyLight;
  uniform vec3 uAccentBounce;

  varying vec3 vNormalView;
  varying vec3 vViewPos;
  varying vec3 vLocalPos;

  void main() {
    vec3 N = normalize(vNormalView);
    vec3 V = normalize(vViewPos);

    // Analytic inner-bore & central-pocket ambient occlusion so each hollow barrel reads sharply
    float rXY = length(vLocalPos.xy);
    float rXZ = length(vLocalPos.xz);
    float rYZ = length(vLocalPos.yz);
    float minBoreDist = min(rXY, min(rXZ, rYZ));
    float boreAO = smoothstep(0.085, 0.235, minBoreDist);
    float hubDepth = smoothstep(0.18, 0.92, length(vLocalPos));
    float ao = mix(0.22, 1.0, boreAO) * mix(0.66, 1.0, hubDepth);

    // Soft studio key + cool overhead fill + subtle dark ground bounce
    vec3 L1 = normalize(uKeyLight);
    vec3 L2 = normalize(vec3(-7.0, 5.5, 6.0));
    vec3 L3 = normalize(vec3(0.0, -8.0, 3.0));

    float diff1 = max(dot(N, L1), 0.0);
    float diff2 = max(dot(N, L2), 0.0);
    float wrap = max(dot(N, L1) * 0.5 + 0.5, 0.0);

    vec3 H1 = normalize(L1 + V);
    vec3 H2 = normalize(L2 + V);
    float shininess = mix(96.0, 18.0, uRoughness);
    float specStrength = mix(0.62, 0.14, uRoughness);
    float spec = pow(max(dot(N, H1), 0.0), shininess) * specStrength
               + pow(max(dot(N, H2), 0.0), shininess * 0.65) * (specStrength * 0.42);

    float fresnel = pow(1.0 - max(dot(N, V), 0.0), 3.6);

    // Hue-preserving studio soft-box lighting + crisp studio rim highlights on obsidian crosses
    float shade = clamp(0.24 + 0.68 * diff1 + 0.24 * diff2 + 0.12 * wrap, 0.0, 1.22);
    vec3 lit = uColor * shade * ao;
    lit += vec3(0.96, 0.97, 1.0) * spec * ao;
    lit += mix(vec3(0.68, 0.72, 0.84), uAccentBounce, 0.30) * fresnel * mix(0.42, 0.16, uRoughness) * ao;
    lit += uAccentBounce * max(dot(N, L3), 0.0) * 0.05 * ao;

    // Luminance-preserving shoulder so saturated #061dfb cobalt never washes cyan
    float peak = max(max(lit.r, lit.g), lit.b);
    if (peak > 1.0) {
      lit = mix(lit / peak, vec3(1.0), clamp((peak - 1.0) * 0.35, 0.0, 0.45));
    }
    gl_FragColor = vec4(clamp(lit, 0.0, 1.0), 1.0);
  }
`;

interface PhysicsSceneProps {
  accentHex: string;
  impulseNonce: number;
  pointerNdcRef: React.MutableRefObject<{ x: number; y: number; active: boolean }>;
  reducedMotion: boolean;
  onShaderVerified: (ok: boolean, detail: string) => void;
  onPointerDisplaced: () => void;
}

function HollowCrossCluster({
  accentHex,
  impulseNonce,
  pointerNdcRef,
  reducedMotion,
  onShaderVerified,
  onPointerDisplaced,
}: PhysicsSceneProps) {
  const { camera, gl, size } = useThree();
  const isCompact = size.width < 680;
  const geometry = useMemo(() => createHollowCrossGeometry(isCompact ? 30 : 38), [isCompact]);

  // 22 sculpted crosses (`6` accent cobalt + `8` white + `8` obsidian black) matching Lusion's ratio
  const initialBodies = useMemo<CrossBodySpec[]>(() => {
    const rng = mulberry32(20260923);
    const pattern: Array<{ kind: SurfaceKind; isGlossy: boolean }> = [
      { kind: "accent", isGlossy: false },
      { kind: "white", isGlossy: false },
      { kind: "black", isGlossy: true },
      { kind: "white", isGlossy: true },
      { kind: "accent", isGlossy: true },
      { kind: "black", isGlossy: false },
      { kind: "white", isGlossy: false },
      { kind: "accent", isGlossy: false },
      { kind: "black", isGlossy: false },
      { kind: "white", isGlossy: false },
      { kind: "black", isGlossy: true },
      { kind: "accent", isGlossy: false },
      { kind: "white", isGlossy: true },
      { kind: "black", isGlossy: false },
      { kind: "accent", isGlossy: true },
      { kind: "white", isGlossy: false },
      { kind: "black", isGlossy: false },
      { kind: "white", isGlossy: false },
      { kind: "accent", isGlossy: false },
      { kind: "black", isGlossy: false },
      { kind: "white", isGlossy: false },
      { kind: "black", isGlossy: true },
    ];

    const list: CrossBodySpec[] = pattern.map((spec, idx) => {
      const goldenAngle = idx * 2.399963;
      const shellR = 0.55 + Math.sqrt(idx / pattern.length) * 2.35;
      const px = Math.cos(goldenAngle) * shellR * 1.25;
      const py = Math.sin(goldenAngle) * shellR * 0.92 - 0.12;
      const pz = ((idx % 5) - 2) * 0.62 + (rng() - 0.5) * 0.4;

      const q = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(rng() * Math.PI * 2, rng() * Math.PI * 2, rng() * Math.PI * 2)
      );

      return {
        kind: spec.kind,
        isGlossy: spec.isGlossy,
        position: new THREE.Vector3(px, py, pz),
        velocity: new THREE.Vector3(0, 0, 0),
        quaternion: q,
        angularVelocity: new THREE.Vector3(
          (rng() - 0.5) * 0.16,
          (rng() - 0.5) * 0.16,
          (rng() - 0.5) * 0.16
        ),
        radius: 1.02,
        mass: 4.39,
        frictionTot: 0,
      };
    });

    // Run 95 deterministic pre-settle physics steps so frame 1 renders a tight, natural sculptural pile
    const nTmp = new THREE.Vector3();
    for (let step = 0; step < 95; step++) {
      const dt = 1 / 60;
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        b.velocity.addScaledVector(b.position, (-38 / b.mass) * dt);
      }
      for (let i = 0; i < list.length; i++) {
        const a = list[i];
        for (let j = i + 1; j < list.length; j++) {
          const b = list[j];
          nTmp.copy(a.position).sub(b.position);
          const dist = nTmp.length();
          const minDist = (a.radius + b.radius) * 0.88;
          if (dist > 0.0001 && dist < minDist) {
            nTmp.divideScalar(dist);
            const overlap = 0.5 * (minDist - dist);
            a.position.addScaledVector(nTmp, overlap);
            b.position.addScaledVector(nTmp, -overlap);
            const relV = a.velocity.dot(nTmp) - b.velocity.dot(nTmp);
            if (relV < 0) {
              const imp = -relV * 0.72;
              a.velocity.addScaledVector(nTmp, imp * 0.5);
              b.velocity.addScaledVector(nTmp, -imp * 0.5);
            }
          }
        }
      }
      for (let i = 0; i < list.length; i++) {
        const b = list[i];
        b.position.addScaledVector(b.velocity, dt);
        b.velocity.multiplyScalar(0.92);
      }
    }

    return list;
  }, []);

  const materials = useMemo(() => {
    const accentColor = new THREE.Color(HERO_ACCENT_PALETTE[0]);
    const makeMat = (hex: string, roughness: number) =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(hex) },
          uRoughness: { value: roughness },
          uKeyLight: { value: new THREE.Vector3(10, 10, 6) },
          uAccentBounce: { value: accentColor.clone() },
        },
        vertexShader: CROSS_VERTEX_SHADER,
        fragmentShader: CROSS_FRAGMENT_SHADER,
      });

    return {
      accentRough: makeMat(HERO_ACCENT_PALETTE[0], 0.56),
      accentGloss: makeMat(HERO_ACCENT_PALETTE[0], 0.14),
      whiteRough: makeMat("#eceef6", 0.54),
      whiteGloss: makeMat("#f8f9fc", 0.12),
      blackRough: makeMat("#20232b", 0.48),
      blackGloss: makeMat("#15171d", 0.11),
    };
  }, []);

  const bodiesRef = useRef<CrossBodySpec[]>(initialBodies);
  const meshRefs = useRef<(THREE.Mesh | null)[]>([]);
  const lastImpulseRef = useRef(0);
  const shaderCheckedRef = useRef(false);
  const pointerHitReportedRef = useRef(false);

  // Smoothly update accent uniforms & trigger impulse burst on click
  useEffect(() => {
    const target = new THREE.Color(accentHex);
    materials.accentRough.uniforms.uColor.value.copy(target);
    materials.accentGloss.uniforms.uColor.value.copy(target);
    Object.values(materials).forEach((m) => {
      m.uniforms.uAccentBounce.value.copy(target);
    });
  }, [accentHex, materials]);

  useEffect(() => {
    if (impulseNonce === 0 || impulseNonce === lastImpulseRef.current) return;
    lastImpulseRef.current = impulseNonce;
    bodiesRef.current.forEach((b, idx) => {
      const radial = b.position.clone().normalize().multiplyScalar(6.5);
      const swirl = new THREE.Vector3(
        Math.sin(idx * 1.7) * 5.2,
        Math.cos(idx * 2.3) * 5.2,
        Math.sin(idx * 3.1) * 3.8
      );
      b.velocity.add(radial).add(swirl);
      b.angularVelocity.set(
        (Math.sin(idx * 2.1) - 0.2) * 2.4,
        (Math.cos(idx * 1.4) + 0.2) * 2.4,
        Math.sin(idx * 0.9) * 2.0
      );
    });
  }, [impulseNonce]);

  // Dispose GPU resources on unmount
  useEffect(() => {
    return () => {
      geometry.dispose();
      Object.values(materials).forEach((m) => m.dispose());
    };
  }, [geometry, materials]);

  const tmpNormal = useMemo(() => new THREE.Vector3(), []);
  const tmpRayOrigin = useMemo(() => new THREE.Vector3(), []);
  const tmpRayDir = useMemo(() => new THREE.Vector3(), []);
  const tmpCursor3D = useMemo(() => new THREE.Vector3(), []);
  const prevCursor3D = useMemo(() => new THREE.Vector3(), []);
  const tmpPush = useMemo(() => new THREE.Vector3(), []);
  const tmpQ = useMemo(() => new THREE.Quaternion(), []);
  const tmpAxis = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, rawDelta) => {
    const dt = Math.min(rawDelta, 1 / 30);
    const activeBodies = bodiesRef.current;

    const aspect = size.width / Math.max(1, size.height);
    const targetZ = aspect < 0.85 ? 14.2 : 10.6;
    const targetX = aspect < 0.85 ? 0.0 : 0.42;
    const cam = state.camera as THREE.PerspectiveCamera;
    if (
      Math.abs(cam.position.z - targetZ) > 0.01 ||
      Math.abs(cam.position.x - targetX) > 0.01 ||
      cam.fov !== 25
    ) {
      cam.position.set(targetX, -0.14, targetZ);
      cam.fov = 25;
      cam.updateProjectionMatrix();
    }

    // One-time WebGL shader program link diagnostic check after first compiled frame
    if (!shaderCheckedRef.current) {
      const programs = (gl.info as unknown as { programs?: Array<{ diagnostics?: { runnable?: boolean } }> })
        .programs;
      if (programs && programs.length > 0) {
        const allRunnable = programs.every((p) => p.diagnostics?.runnable !== false);
        shaderCheckedRef.current = true;
        onShaderVerified(allRunnable, `programs=${programs.length}`);
      }
    }

    if (!reducedMotion) {
      // Project normalized pointer onto Z=0 plane (`HomeBalloonsPhysics` cursor repulsion)
      const ptr = pointerNdcRef.current;
      if (ptr.active) {
        tmpRayDir.set(ptr.x, ptr.y, 0.5).unproject(camera).sub(camera.position).normalize();
        const tPlane = (0 - camera.position.z) / (tmpRayDir.z || -1);
        tmpCursor3D.copy(camera.position).addScaledVector(tmpRayDir, tPlane);
        tmpPush.copy(tmpCursor3D).sub(prevCursor3D).multiplyScalar(14);
        prevCursor3D.copy(tmpCursor3D);
      }

      for (let i = 0; i < activeBodies.length; i++) {
        const a = activeBodies[i];
        // Central spring gravity toward `(0, -0.35, 0)` keeping sculptural pile tight in frame
        tmpRayOrigin.set(a.position.x, a.position.y + 0.35, a.position.z * 1.15);
        a.velocity.addScaledVector(tmpRayOrigin, (-36 / a.mass) * dt);

        // Cursor ray repulsion
        if (ptr.active) {
          tmpNormal.copy(a.position).sub(tmpCursor3D);
          const dCursor = tmpNormal.length();
          const influenceR = 2.15;
          if (dCursor > 0.001 && dCursor < influenceR) {
            const strength = (1 - dCursor / influenceR) * 26 * dt;
            tmpNormal.divideScalar(dCursor);
            a.velocity.addScaledVector(tmpNormal, strength);
            a.velocity.addScaledVector(tmpPush, 0.16 * dt);
            a.angularVelocity.x += tmpNormal.y * strength * 0.45;
            a.angularVelocity.y -= tmpNormal.x * strength * 0.45;
            if (!pointerHitReportedRef.current) {
              pointerHitReportedRef.current = true;
              onPointerDisplaced();
            }
          }
        }
      }

      // Pairwise elastic collision + rolling friction
      for (let i = 0; i < activeBodies.length; i++) {
        const a = activeBodies[i];
        for (let j = i + 1; j < activeBodies.length; j++) {
          const b = activeBodies[j];
          tmpNormal.copy(a.position).sub(b.position);
          const dist = tmpNormal.length();
          const minDist = (a.radius + b.radius) * 0.88;
          if (dist > 0.0001 && dist < minDist) {
            tmpNormal.divideScalar(dist);
            const overlap = 0.5 * (minDist - dist);
            a.position.addScaledVector(tmpNormal, overlap);
            b.position.addScaledVector(tmpNormal, -overlap);

            const vA = a.velocity.dot(tmpNormal);
            const vB = b.velocity.dot(tmpNormal);
            const relV = vA - vB;
            if (relV < 0) {
              const restitution = 0.72;
              const jImp = (-(1 + restitution) * relV) * 0.5;
              a.velocity.addScaledVector(tmpNormal, jImp);
              b.velocity.addScaledVector(tmpNormal, -jImp);
            }
          }
        }
      }

      // Integrate linear + angular velocities with gentle breathing torque
      for (let i = 0; i < activeBodies.length; i++) {
        const b = activeBodies[i];
        b.position.addScaledVector(b.velocity, dt);
        b.velocity.multiplyScalar(Math.pow(0.22, dt));

        // Subtle ambient drift so the cluster never freezes stone-dead
        b.angularVelocity.x += Math.sin(performance.now() * 0.0005 + i) * 0.08 * dt;
        b.angularVelocity.y += Math.cos(performance.now() * 0.0004 + i * 1.3) * 0.08 * dt;
        b.angularVelocity.multiplyScalar(Math.pow(0.35, dt));

        const speed = b.angularVelocity.length();
        if (speed > 0.0001) {
          tmpAxis.copy(b.angularVelocity).divideScalar(speed);
          tmpQ.setFromAxisAngle(tmpAxis, speed * dt);
          b.quaternion.premultiply(tmpQ).normalize();
        }
      }
    }

    // Commit transforms directly to Three.js meshes (zero React rerenders)
    for (let i = 0; i < activeBodies.length; i++) {
      const mesh = meshRefs.current[i];
      if (!mesh) continue;
      mesh.position.copy(activeBodies[i].position);
      mesh.quaternion.copy(activeBodies[i].quaternion);
    }
  });

  const pickMaterial = (b: CrossBodySpec) => {
    if (b.kind === "accent") return b.isGlossy ? materials.accentGloss : materials.accentRough;
    if (b.kind === "white") return b.isGlossy ? materials.whiteGloss : materials.whiteRough;
    return b.isGlossy ? materials.blackGloss : materials.blackRough;
  };

  return (
    <group>
      {initialBodies.map((b, idx) => (
        <mesh
          key={idx}
          ref={(el) => {
            meshRefs.current[idx] = el;
          }}
          geometry={geometry}
          material={pickMaterial(b)}
          position={b.position}
          quaternion={b.quaternion}
        />
      ))}
    </group>
  );
}

class StageErrorBoundary extends Component<
  { fallback: React.ReactNode; children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

function StaticSculpturalFallback({ accentHex }: { accentHex: string }) {
  return (
    <div
      data-webgl-fallback="active"
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#141515]"
    >
      <svg
        viewBox="0 0 800 500"
        className="h-full w-full max-w-[900px]"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="crossWhite" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="70%" stopColor="#cfd3e2" />
            <stop offset="100%" stopColor="#7f8599" />
          </radialGradient>
          <radialGradient id="crossAccent" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor={accentHex} />
            <stop offset="100%" stopColor="#050b52" />
          </radialGradient>
          <radialGradient id="crossBlack" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#353844" />
            <stop offset="70%" stopColor="#12141a" />
            <stop offset="100%" stopColor="#06070a" />
          </radialGradient>
        </defs>
        {[
          { x: 250, y: 270, rot: -22, fill: "url(#crossWhite)", scale: 1.05 },
          { x: 405, y: 235, rot: 28, fill: "url(#crossAccent)", scale: 1.15 },
          { x: 545, y: 265, rot: -35, fill: "url(#crossBlack)", scale: 1.08 },
          { x: 335, y: 365, rot: 14, fill: "url(#crossAccent)", scale: 0.98 },
          { x: 475, y: 375, rot: 40, fill: "url(#crossWhite)", scale: 0.96 },
        ].map((item, idx) => (
          <g
            key={idx}
            transform={`translate(${item.x} ${item.y}) rotate(${item.rot}) scale(${item.scale})`}
          >
            <rect x="-105" y="-36" width="210" height="72" rx="14" fill={item.fill} />
            <rect x="-36" y="-105" width="72" height="210" rx="14" fill={item.fill} />
            <circle cx="0" cy="0" r="14" fill="#0b0c10" />
          </g>
        ))}
      </svg>
    </div>
  );
}

export function HeroCrossesStage() {
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const [colorIdx, setColorIdx] = useState(0);
  const [impulseNonce, setImpulseNonce] = useState(0);
  const [webglSupported, setWebglSupported] = useState(true);
  const [shaderStatus, setShaderStatus] = useState<"booting" | "ready" | "error">("booting");
  const [pointerHits, setPointerHits] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const pointerNdcRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 0,
    y: 0,
    active: false,
  });

  useEffect(() => {
    const raf = window.requestAnimationFrame(() => {
      try {
        const params = new URLSearchParams(window.location.search);
        if (params.get("forceWebglFallback") === "1") {
          setWebglSupported(false);
          return;
        }
        const probe = document.createElement("canvas");
        const gl = probe.getContext("webgl2") || probe.getContext("webgl");
        if (!gl) {
          setWebglSupported(false);
        }
      } catch {
        setWebglSupported(false);
      }
    });
    return () => window.cancelAnimationFrame(raf);
  }, []);

  const accentHex = HERO_ACCENT_PALETTE[colorIdx % HERO_ACCENT_PALETTE.length];

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    pointerNdcRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    pointerNdcRef.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
    pointerNdcRef.current.active = true;
  }, []);

  const handlePointerLeave = useCallback(() => {
    pointerNdcRef.current.active = false;
  }, []);

  const handleStageClick = useCallback(() => {
    soundEngine.playClick();
    setColorIdx((prev) => (prev + 1) % HERO_ACCENT_PALETTE.length);
    setImpulseNonce((prev) => prev + 1);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handleStageClick();
      }
    },
    [handleStageClick]
  );

  const fallbackNode = <StaticSculpturalFallback accentHex={accentHex} />;
  const [stageInView, setStageInView] = useState(true);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]) setStageInView(entries[0].isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div
      id="home-hero-visual-container"
      ref={containerRef}
      role="button"
      tabIndex={0}
      aria-label="Interactive 3D Lusion connector stage — move pointer to sculpt or activate to cycle studio palette"
      data-color-index={colorIdx}
      data-accent-color={accentHex}
      data-webgl-status={webglSupported ? shaderStatus : "fallback"}
      data-pointer-interactions={pointerHits}
      onClick={handleStageClick}
      onKeyDown={handleKeyDown}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative h-full w-full cursor-pointer overflow-hidden rounded-[var(--global-border-radius)] bg-[#141515] select-none focus-visible:outline-2 focus-visible:outline-[#1a2ffb]"
    >
      {webglSupported ? (
        <StageErrorBoundary fallback={fallbackNode}>
          <Canvas
            dpr={[1, 1.5]}
            frameloop={reducedMotion || !stageInView ? "demand" : "always"}
            gl={{
              antialias: true,
              alpha: false,
              powerPreference: "high-performance",
            }}
            onCreated={({ gl }) => {
              gl.setClearColor("#141515", 1);
              gl.domElement.addEventListener("webglcontextlost", (ev) => {
                ev.preventDefault();
                setWebglSupported(false);
              });
            }}
            className="h-full w-full"
          >
            <HollowCrossCluster
              accentHex={accentHex}
              impulseNonce={impulseNonce}
              pointerNdcRef={pointerNdcRef}
              reducedMotion={reducedMotion}
              onShaderVerified={(ok) => setShaderStatus(ok ? "ready" : "error")}
              onPointerDisplaced={() => setPointerHits((c) => c + 1)}
            />
          </Canvas>
        </StageErrorBoundary>
      ) : (
        fallbackNode
      )}
    </div>
  );
}
