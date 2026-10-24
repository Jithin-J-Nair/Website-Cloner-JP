"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { STAGE_TELEMETRY, useStudioStore } from "@/lib/store";
import {
  configureCompressedAssetPipeline,
  detectGpuCapabilities,
} from "@/lib/asset-pipeline";
import {
  OPTICAL_GLASS_FRAGMENT,
  OPTICAL_GLASS_VERTEX,
  RIBBON_WAVE_FRAGMENT,
  RIBBON_WAVE_VERTEX,
} from "@/components/webgl/shaders";

/**
 * Rolling 45-frame FPS watchdog: monitors actual render throughput after warm-up
 * and gracefully steps down quality tier (`high -> medium -> low`) if sustained FPS drops.
 */
function FpsWatchdog() {
  const { gl } = useThree();
  const setFps = useStudioStore((s) => s.setFps);
  const qualityTier = useStudioStore((s) => s.qualityTier);
  const setQualityTier = useStudioStore((s) => s.setQualityTier);

  const sampleRef = useRef({ frames: 0, elapsed: 0, lowStrikes: 0, grace: 2.5 });

  useEffect(() => {
    configureCompressedAssetPipeline(gl);
  }, [gl]);

  useFrame((_, delta) => {
    const s = sampleRef.current;
    if (s.grace > 0) {
      s.grace -= delta;
      return;
    }
    s.frames += 1;
    s.elapsed += delta;

    if (s.elapsed >= 0.75) {
      const currentFps = Math.round(s.frames / s.elapsed);
      setFps(Math.min(144, Math.max(1, currentFps)));

      if (currentFps < 34) {
        s.lowStrikes += 1;
        if (s.lowStrikes >= 2) {
          if (qualityTier === "high") setQualityTier("medium");
          else if (qualityTier === "medium") setQualityTier("low");
          s.lowStrikes = 0;
        }
      } else {
        s.lowStrikes = 0;
      }

      s.frames = 0;
      s.elapsed = 0;
    }
  });

  return null;
}

/**
 * 6-Channel organic camera rig combining smooth pointer parallax with subtle fBm-like drift.
 */
function CameraRig() {
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const webglMode = useStudioStore((s) => s.webglMode);

  useFrame(({ camera, clock }, delta) => {
    const t = clock.getElapsedTime();
    const lerpFactor = 1 - Math.pow(0.0018, delta);

    STAGE_TELEMETRY.smoothPointerX = THREE.MathUtils.lerp(
      STAGE_TELEMETRY.smoothPointerX,
      STAGE_TELEMETRY.pointerX,
      lerpFactor
    );
    STAGE_TELEMETRY.smoothPointerY = THREE.MathUtils.lerp(
      STAGE_TELEMETRY.smoothPointerY,
      STAGE_TELEMETRY.pointerY,
      lerpFactor
    );

    const baseZ =
      webglMode === "labs-sandbox"
        ? 5.2
        : webglMode === "capabilities"
          ? 6.1
          : webglMode === "dispersion-tunnel"
            ? 4.7
            : 5.8;

    const driftX = reducedMotion
      ? 0
      : Math.sin(t * 0.37) * 0.14 + Math.sin(t * 0.83) * 0.05;
    const driftY = reducedMotion
      ? 0
      : Math.cos(t * 0.31) * 0.12 + Math.cos(t * 0.71) * 0.04;

    camera.position.x = THREE.MathUtils.lerp(
      camera.position.x,
      STAGE_TELEMETRY.smoothPointerX * 0.65 + driftX,
      0.06
    );
    camera.position.y = THREE.MathUtils.lerp(
      camera.position.y,
      STAGE_TELEMETRY.smoothPointerY * 0.48 + driftY,
      0.06
    );
    camera.position.z = THREE.MathUtils.lerp(
      camera.position.z,
      baseZ - Math.min(Math.abs(STAGE_TELEMETRY.scrollVelocity) * 0.0005, 0.55),
      0.05
    );
    camera.lookAt(0, 0, 0);
  });

  return null;
}

/**
 * Centerpiece Cauchy Dispersion Optical Sculpture + 48 Instanced Spring-Collision Spheres
 * + GPU Curl-Field Particle Halo + Harmonic Satin Ribbon Wave Plane.
 */
function ProceduralWorld() {
  const activeSurface = useStudioStore((s) => s.activeSurface);
  const webglMode = useStudioStore((s) => s.webglMode);
  const capabilityIndex = useStudioStore((s) => s.capabilityIndex);
  const projectAccentHex = useStudioStore((s) => s.projectAccentHex);
  const qualityTier = useStudioStore((s) => s.qualityTier);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const labUniforms = useStudioStore((s) => s.labUniforms);

  const coreMeshRef = useRef<THREE.Mesh>(null);
  const glassMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const ribbonMaterialRef = useRef<THREE.ShaderMaterial>(null);
  const instancedRef = useRef<THREE.InstancedMesh>(null);
  const particlesRef = useRef<THREE.Points>(null);

  const sphereCount = qualityTier === "high" ? 44 : qualityTier === "medium" ? 26 : 14;
  const particleCount = qualityTier === "high" ? 1400 : qualityTier === "medium" ? 750 : 300;

  // Pre-allocated zero-GC simulation buffers stored in a mutable ref for React Compiler purity
  const simRef = useRef<{
    positions: Float32Array;
    velocities: Float32Array;
    radii: Float32Array;
    homeOffsets: Float32Array;
    paletteIndices: Uint8Array;
    count: number;
  } | null>(null);

  useEffect(() => {
    const positions = new Float32Array(sphereCount * 3);
    const velocities = new Float32Array(sphereCount * 3);
    const radii = new Float32Array(sphereCount);
    const homeOffsets = new Float32Array(sphereCount * 3);
    const paletteIndices = new Uint8Array(sphereCount);

    for (let i = 0; i < sphereCount; i++) {
      const phi = Math.acos(1 - (2 * (i + 0.5)) / sphereCount);
      const theta = Math.PI * (1 + Math.sqrt(5)) * i;
      const dist = 1.65 + (i % 5) * 0.24;

      const hx = Math.sin(phi) * Math.cos(theta) * dist;
      const hy = Math.sin(phi) * Math.sin(theta) * dist * 0.85;
      const hz = Math.cos(phi) * dist * 0.72;

      positions[i * 3] = hx * 1.4;
      positions[i * 3 + 1] = hy * 1.4;
      positions[i * 3 + 2] = hz * 1.4;

      homeOffsets[i * 3] = hx;
      homeOffsets[i * 3 + 1] = hy;
      homeOffsets[i * 3 + 2] = hz;

      radii[i] = 0.11 + (i % 4) * 0.048;
      paletteIndices[i] = i % 5;
    }

    simRef.current = {
      positions,
      velocities,
      radii,
      homeOffsets,
      paletteIndices,
      count: sphereCount,
    };
  }, [sphereCount]);

  // Particle halo buffers
  const particleGeometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      const u = (i + 0.5) / particleCount;
      const angle = i * 2.399963;
      const r = 1.8 + Math.sqrt(u) * 5.2;
      pos[i * 3] = Math.cos(angle) * r;
      pos[i * 3 + 1] = ((i % 97) / 97 - 0.5) * 5.6;
      pos[i * 3 + 2] = Math.sin(angle) * r * 0.75 - 1.2;
    }
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return geo;
  }, [particleCount]);

  const glassUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uIor: { value: 1.46 },
      uDispersion: { value: 0.34 },
      uTurbulence: { value: 0.42 },
      uMorph: { value: 0 },
      uSurfaceIsLight: { value: 1 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uPrimaryColor: { value: new THREE.Color("#2434ff") },
      uSecondaryColor: { value: new THREE.Color("#00d2ff") },
    }),
    []
  );

  const ribbonUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uScrollVelocity: { value: 0 },
      uPointer: { value: new THREE.Vector2(0, 0) },
      uColorA: { value: new THREE.Color("#2434ff") },
      uColorB: { value: new THREE.Color("#00d2ff") },
      uOpacity: { value: 0.34 },
    }),
    []
  );

  const dummyObj = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);
  const targetPrimary = useMemo(() => new THREE.Color("#2434ff"), []);
  const targetSecondary = useMemo(() => new THREE.Color("#00d2ff"), []);

  // Re-tint instanced spheres whenever surface or project accent changes
  useEffect(() => {
    const mesh = instancedRef.current;
    const sim = simRef.current;
    if (!mesh || !sim) return;
    const isLight = activeSurface === "ice";
    const accent = webglMode === "case-study" ? projectAccentHex : "#2434ff";

    for (let i = 0; i < sim.count; i++) {
      const slot = sim.paletteIndices[i];
      if (slot === 0) tempColor.set(accent);
      else if (slot === 1) tempColor.set(isLight ? "#0c0f18" : "#1b2236");
      else if (slot === 2) tempColor.set("#00d2ff");
      else if (slot === 3) tempColor.set(isLight ? "#dfe4f2" : "#f4f6fb");
      else tempColor.set("#5b68ff");
      mesh.setColorAt(i, tempColor);
    }
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  }, [activeSurface, projectAccentHex, sphereCount, tempColor, webglMode]);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(rawDelta, 0.033);
    const t = reducedMotion ? 2.4 : clock.getElapsedTime();
    const isSandbox = webglMode === "labs-sandbox";

    // Update centerpiece Cauchy Optical Glass uniforms
    if (glassMaterialRef.current) {
      const u = glassMaterialRef.current.uniforms;
      u.uTime.value = t;
      u.uPointer.value.set(STAGE_TELEMETRY.smoothPointerX, STAGE_TELEMETRY.smoothPointerY);
      u.uSurfaceIsLight.value = THREE.MathUtils.lerp(
        u.uSurfaceIsLight.value,
        activeSurface === "ice" ? 1.0 : 0.08,
        0.06
      );

      const targetIor = isSandbox ? labUniforms.ior : 1.46;
      const targetDisp = isSandbox
        ? labUniforms.dispersion
        : webglMode === "dispersion-tunnel"
          ? 0.58
          : 0.34;
      const targetTurb = isSandbox
        ? labUniforms.turbulence
        : webglMode === "capabilities"
          ? 0.3 + capabilityIndex * 0.16
          : 0.42;

      u.uIor.value = THREE.MathUtils.lerp(u.uIor.value, targetIor, 0.08);
      u.uDispersion.value = THREE.MathUtils.lerp(u.uDispersion.value, targetDisp, 0.08);
      u.uTurbulence.value = THREE.MathUtils.lerp(u.uTurbulence.value, targetTurb, 0.08);
      u.uMorph.value = THREE.MathUtils.lerp(
        u.uMorph.value,
        webglMode === "capabilities" ? capabilityIndex * 0.5 : STAGE_TELEMETRY.scrollProgress,
        0.06
      );

      targetPrimary.set(webglMode === "case-study" ? projectAccentHex : "#2434ff");
      targetSecondary.set(
        activeSurface === "cobalt"
          ? "#ffffff"
          : webglMode === "lost-404"
            ? "#ff4d2e"
            : "#00d2ff"
      );
      u.uPrimaryColor.value.lerp(targetPrimary, 0.06);
      u.uSecondaryColor.value.lerp(targetSecondary, 0.06);
      glassMaterialRef.current.wireframe = isSandbox ? labUniforms.wireframe : false;
    }

    // Rotate core sculpture smoothly with scroll progress + subtle idle float
    if (coreMeshRef.current) {
      const targetScale =
        webglMode === "work-gallery"
          ? 0.86
          : webglMode === "labs-sandbox"
            ? 1.24
            : 1.08;
      const nextScale = THREE.MathUtils.lerp(coreMeshRef.current.scale.x, targetScale, 0.06);
      coreMeshRef.current.scale.setScalar(nextScale);
      coreMeshRef.current.rotation.y = t * 0.18 + STAGE_TELEMETRY.scrollProgress * Math.PI * 1.4;
      coreMeshRef.current.rotation.x = Math.sin(t * 0.24) * 0.22 + STAGE_TELEMETRY.smoothPointerY * 0.25;
      // Offset core subtly right on hero so left display headline has crystal-clear reading room
      const targetX = webglMode === "hero-cluster" ? 1.15 : webglMode === "capabilities" ? -1.35 : 0.0;
      coreMeshRef.current.position.x = THREE.MathUtils.lerp(
        coreMeshRef.current.position.x,
        targetX,
        0.045
      );
    }

    // Analytical damped spring + sphere-sphere repulsion + pointer repulsion step
    const mesh = instancedRef.current;
    const sim = simRef.current;
    if (mesh && sim) {
      const { positions, velocities, radii, homeOffsets, count } = sim;
      const cursorWorldX = STAGE_TELEMETRY.smoothPointerX * 3.1;
      const cursorWorldY = STAGE_TELEMETRY.smoothPointerY * 2.1;
      const stiffness = isSandbox ? 2.2 + labUniforms.spring * 5.0 : 4.2;
      const spread =
        webglMode === "work-gallery"
          ? 1.65
          : webglMode === "lost-404"
            ? 2.15
            : 1.05 + STAGE_TELEMETRY.scrollProgress * 0.25;

      const centerShiftX = coreMeshRef.current ? coreMeshRef.current.position.x : 0;

      if (!reducedMotion) {
        for (let i = 0; i < count; i++) {
          const ix = i * 3;
          const orbitAngle = t * 0.22 + (i % 7) * 0.04;
          const cosA = Math.cos(orbitAngle);
          const sinA = Math.sin(orbitAngle);

          const hx =
            (homeOffsets[ix] * cosA - homeOffsets[ix + 2] * sinA) * spread + centerShiftX;
          const hy = homeOffsets[ix + 1] * spread;
          const hz = (homeOffsets[ix] * sinA + homeOffsets[ix + 2] * cosA) * spread;

          let fx = (hx - positions[ix]) * stiffness;
          let fy = (hy - positions[ix + 1]) * stiffness;
          let fz = (hz - positions[ix + 2]) * stiffness;

          // Pointer ray repulsion
          const cdx = positions[ix] - cursorWorldX;
          const cdy = positions[ix + 1] - cursorWorldY;
          const cDistSq = cdx * cdx + cdy * cdy + 0.08;
          if (cDistSq < 2.2) {
            const push = 3.4 / cDistSq;
            fx += cdx * push;
            fy += cdy * push;
          }

          // Pairwise soft collision repulsion
          for (let j = i + 1; j < count; j++) {
            const jx = j * 3;
            const dx = positions[ix] - positions[jx];
            const dy = positions[ix + 1] - positions[jx + 1];
            const dz = positions[ix + 2] - positions[jx + 2];
            const minDist = (radii[i] + radii[j]) * 1.65;
            const dSq = dx * dx + dy * dy + dz * dz;
            if (dSq < minDist * minDist && dSq > 0.0001) {
              const d = Math.sqrt(dSq);
              const overlap = (minDist - d) * 14.0;
              const nx = (dx / d) * overlap;
              const ny = (dy / d) * overlap;
              const nz = (dz / d) * overlap;
              fx += nx;
              fy += ny;
              fz += nz;
              velocities[jx] -= nx * dt;
              velocities[jx + 1] -= ny * dt;
              velocities[jx + 2] -= nz * dt;
            }
          }

          velocities[ix] = (velocities[ix] + fx * dt) * 0.88;
          velocities[ix + 1] = (velocities[ix + 1] + fy * dt) * 0.88;
          velocities[ix + 2] = (velocities[ix + 2] + fz * dt) * 0.88;

          positions[ix] += velocities[ix] * dt;
          positions[ix + 1] += velocities[ix + 1] * dt;
          positions[ix + 2] += velocities[ix + 2] * dt;
        }
      }

      for (let i = 0; i < count; i++) {
        const ix = i * 3;
        dummyObj.position.set(positions[ix], positions[ix + 1], positions[ix + 2]);
        dummyObj.scale.setScalar(radii[i]);
        dummyObj.updateMatrix();
        mesh.setMatrixAt(i, dummyObj.matrix);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }

    // Update harmonic wave ribbon shader
    if (ribbonMaterialRef.current) {
      ribbonMaterialRef.current.uniforms.uTime.value = t;
      ribbonMaterialRef.current.uniforms.uScrollVelocity.value = STAGE_TELEMETRY.scrollVelocity;
      ribbonMaterialRef.current.uniforms.uPointer.value.set(
        STAGE_TELEMETRY.smoothPointerX,
        STAGE_TELEMETRY.smoothPointerY
      );
      ribbonMaterialRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        ribbonMaterialRef.current.uniforms.uOpacity.value,
        activeSurface === "ice" ? 0.17 : 0.36,
        0.06
      );
    }

    // Gentle orbital drift on particle field
    if (particlesRef.current && !reducedMotion) {
      particlesRef.current.rotation.y = t * 0.035;
      particlesRef.current.rotation.z = Math.sin(t * 0.12) * 0.06;
    }
  });

  return (
    <group>
      {/* Studio three-point lighting for instanced glossy & matte bodies */}
      <ambientLight intensity={activeSurface === "ice" ? 1.35 : 0.65} />
      <directionalLight position={[-4, 6, 5]} intensity={2.2} color="#ffffff" />
      <pointLight position={[4, -2, 3]} intensity={2.6} color="#2434ff" />
      <pointLight position={[-3, -3, -2]} intensity={1.5} color="#00d2ff" />

      {/* Centerpiece Cauchy Optical Dispersion Sculpture */}
      <mesh ref={coreMeshRef}>
        <icosahedronGeometry args={[1.05, qualityTier === "low" ? 3 : 5]} />
        <shaderMaterial
          ref={glassMaterialRef}
          vertexShader={OPTICAL_GLASS_VERTEX}
          fragmentShader={OPTICAL_GLASS_FRAGMENT}
          uniforms={glassUniforms}
          transparent
        />
      </mesh>

      {/* Spring-coupled orbital sphere swarm */}
      <instancedMesh ref={instancedRef} args={[undefined, undefined, sphereCount]}>
        <sphereGeometry args={[1, qualityTier === "low" ? 14 : 24, qualityTier === "low" ? 14 : 24]} />
        <meshStandardMaterial roughness={0.16} metalness={0.62} />
      </instancedMesh>

      {/* Harmonic wave silk ribbon backdrop */}
      <mesh position={[0, -0.4, -2.6]} rotation={[-0.62, 0, 0]}>
        <planeGeometry args={[15, 9, qualityTier === "low" ? 28 : 64, qualityTier === "low" ? 20 : 44]} />
        <shaderMaterial
          ref={ribbonMaterialRef}
          vertexShader={RIBBON_WAVE_VERTEX}
          fragmentShader={RIBBON_WAVE_FRAGMENT}
          uniforms={ribbonUniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Atmospheric GPU particle field */}
      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          size={0.028}
          color={activeSurface === "ice" ? "#2434ff" : "#7dd3fc"}
          transparent
          opacity={activeSurface === "ice" ? 0.35 : 0.55}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
    </group>
  );
}

/**
 * Persistent root WebGL canvas with automatic graceful fallback for no-WebGL environments.
 */
export function GlobalStage() {
  const dpr = useStudioStore((s) => s.dpr);
  const webglSupported = useStudioStore((s) => s.webglSupported);
  const setWebglSupported = useStudioStore((s) => s.setWebglSupported);
  const setQualityTier = useStudioStore((s) => s.setQualityTier);
  const activeSurface = useStudioStore((s) => s.activeSurface);

  useEffect(() => {
    const profile = detectGpuCapabilities();
    setWebglSupported(profile.supported);
    setQualityTier(profile.initialTier);
  }, [setQualityTier, setWebglSupported]);

  if (!webglSupported) {
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden transition-colors duration-700"
        style={{
          background:
            activeSurface === "ice"
              ? "radial-gradient(circle at 68% 42%, rgba(36,52,255,0.16), rgba(0,210,255,0.08) 38%, #eef0f6 72%)"
              : "radial-gradient(circle at 65% 40%, rgba(36,52,255,0.28), rgba(0,210,255,0.10) 38%, #090b10 74%)",
        }}
      />
    );
  }

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0 h-screen w-screen overflow-hidden"
    >
      <Canvas
        dpr={dpr}
        camera={{ position: [0, 0, 5.8], fov: 42, near: 0.1, far: 40 }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
        }}
      >
        <FpsWatchdog />
        <CameraRig />
        <ProceduralWorld />
      </Canvas>
    </div>
  );
}
