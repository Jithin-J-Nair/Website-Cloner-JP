"use client";

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { LUSION_HOME } from "@/data/reference";
import { loadLusionBuf, type ParsedBufData } from "@/lib/lusion-buf-loader";
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
        items: Record<string, { id: string; pixelFrom: number; pixelCount: number; pixelTo: number }>;
      };
    };
  }
}

const BONE_COUNT = 53;
const STICKER_ATLAS_W = 1465;
const STICKER_ATLAS_H = 1024;
const STICKER_RECTS = [
  { x: 1132, y: 3, w: 195, h: 195 },
  { x: 744, y: 3, w: 195, h: 256 },
  { x: 525, y: 3, w: 213, h: 282 },
  { x: 242, y: 3, w: 277, h: 286 },
  { x: 1055, y: 633, w: 209, h: 209 },
  { x: 1076, y: 398, w: 209, h: 209 },
  { x: 3, y: 772, w: 298, h: 249 },
  { x: 945, y: 3, w: 181, h: 249 },
  { x: 1291, y: 389, w: 160, h: 197 },
  { x: 1055, y: 848, w: 83, h: 122 },
  { x: 1132, y: 204, w: 167, h: 179 },
  { x: 1270, y: 828, w: 192, h: 193 },
  { x: 780, y: 265, w: 182, h: 167 },
  { x: 564, y: 445, w: 294, h: 184 },
  { x: 307, y: 683, w: 205, h: 334 },
  { x: 864, y: 438, w: 206, h: 189 },
  { x: 968, y: 258, w: 149, h: 134 },
  { x: 734, y: 635, w: 165, h: 382 },
  { x: 605, y: 291, w: 169, h: 141 },
  { x: 302, y: 445, w: 256, h: 232 },
  { x: 518, y: 683, w: 210, h: 266 },
  { x: 242, y: 295, w: 357, h: 144 },
  { x: 3, y: 3, w: 233, h: 469 },
  { x: 905, y: 633, w: 144, h: 340 },
  { x: 1270, y: 613, w: 187, h: 209 },
  { x: 3, y: 478, w: 293, h: 288 },
];

// Decompiled dual-quaternion 53-bone GPU vertex skinning shader from `_astro/hoisted.CUO_IjfL.js`
const ASTRONAUT_VERTEX_GLSL = /* glsl */ `
  uniform sampler2D u_animationPositionTexture;
  uniform sampler2D u_animationOrientTexture;
  uniform vec2 u_animationTextureSize;
  uniform vec3 u_frameFromToBlend;
  uniform vec3 u_instancePos;
  uniform vec4 u_instanceOrient;

  attribute vec2 boneIndices;
  attribute vec2 boneWeights;
  attribute vec4 tangent;
  attribute float ao;

  varying vec3 v_worldPosition;
  varying vec4 v_worldTangent;
  varying vec3 v_worldNormal;
  varying vec2 v_uv;
  varying float v_ao;

  vec3 qrotate(vec4 q, vec3 v) {
    return v + 2.0 * cross(q.xyz, cross(q.xyz, v) + q.w * v);
  }

  void computeBonePair(inout vec3 pos, inout vec3 nor, inout vec3 tang, vec4 uvBone12) {
    vec3 bonePos1 = texture2D(u_animationPositionTexture, uvBone12.xy).xyz;
    vec3 bonePos2 = texture2D(u_animationPositionTexture, uvBone12.zw).xyz;
    vec4 boneOrient1 = texture2D(u_animationOrientTexture, uvBone12.xy);
    vec4 boneOrient2 = texture2D(u_animationOrientTexture, uvBone12.zw);
    pos = (qrotate(boneOrient1, pos) + bonePos1) * boneWeights.x +
          (qrotate(boneOrient2, pos) + bonePos2) * boneWeights.y;
    nor = normalize(qrotate(boneOrient1, nor) * boneWeights.x + qrotate(boneOrient2, nor) * boneWeights.y);
    tang = normalize(qrotate(boneOrient1, tang) * boneWeights.x + qrotate(boneOrient2, tang) * boneWeights.y);
  }

  void main() {
    v_ao = ao;
    vec4 dataOffset = boneIndices.xyxy + u_frameFromToBlend.xxyy * float(${BONE_COUNT}) + 0.5;
    vec4 fromUvsBone12 = vec4(
      floor(mod(dataOffset.xy, u_animationTextureSize.x)) + 0.5,
      floor(dataOffset.xy / u_animationTextureSize.x) + 0.5
    ).xzyw / u_animationTextureSize.xyxy;
    vec4 toUvsBone12 = vec4(
      floor(mod(dataOffset.zw, u_animationTextureSize.x)) + 0.5,
      floor(dataOffset.zw / u_animationTextureSize.x) + 0.5
    ).xzyw / u_animationTextureSize.xyxy;

    vec3 fromPos = position;
    vec3 fromNor = normal;
    vec3 fromTang = tangent.xyz;
    computeBonePair(fromPos, fromNor, fromTang, fromUvsBone12);

    vec3 toPos = position;
    vec3 toNor = normal;
    vec3 toTang = tangent.xyz;
    computeBonePair(toPos, toNor, toTang, toUvsBone12);

    vec3 pos = mix(fromPos, toPos, u_frameFromToBlend.z);
    vec3 nor = normalize(mix(fromNor, toNor, u_frameFromToBlend.z));
    vec3 tang = normalize(mix(fromTang, toTang, u_frameFromToBlend.z));

    pos = qrotate(u_instanceOrient, pos) + u_instancePos;
    nor = normalize(qrotate(u_instanceOrient, nor));
    tang = normalize(qrotate(u_instanceOrient, tang));

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    v_worldPosition = worldPos.xyz;
    v_worldNormal = normalize(mat3(modelMatrix) * nor);
    v_worldTangent = vec4(normalize(mat3(modelMatrix) * tang), tangent.w);
    v_uv = uv;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

// Decompiled physically-based EVA suit / helmet / obsidian reflective visor shader
const ASTRONAUT_FRAGMENT_GLSL = /* glsl */ `
  precision highp float;

  uniform sampler2D u_baseTexture;
  uniform sampler2D u_armTexture;
  uniform sampler2D u_norTexture;
  uniform sampler2D u_matcapTexture;
  uniform sampler2D u_envTexture;
  uniform vec3 u_sunPosition;
  uniform vec3 u_ambientColor;
  uniform float u_isGlass;
  uniform float u_isClone;
  uniform float u_cloneAlpha;
  uniform float u_tunnelGlow;
  uniform float u_opacity;

  varying vec3 v_worldPosition;
  varying vec4 v_worldTangent;
  varying vec3 v_worldNormal;
  varying vec2 v_uv;
  varying float v_ao;

  float saturateVal(float v) { return clamp(v, 0.0, 1.0); }
  float linearStep(float e0, float e1, float x) { return clamp((x - e0) / (e1 - e0), 0.0, 1.0); }

  void main() {
    vec3 N = normalize(v_worldNormal);
    vec3 T = normalize(v_worldTangent.xyz);
    vec3 B = normalize(cross(N, T)) * (-v_worldTangent.w);
    T = normalize(cross(B, N));
    vec3 nTex = texture2D(u_norTexture, v_uv).xyz * 2.0 - 1.0;
    N = normalize(nTex.x * T + nTex.y * B + nTex.z * N);

    vec4 arm = texture2D(u_armTexture, v_uv);
    vec3 baseCol = texture2D(u_baseTexture, v_uv).rgb;
    float ao = clamp(v_ao * (0.35 + 0.65 * arm.r), 0.0, 1.0);
    float roughness = clamp(arm.g, 0.04, 1.0);
    float metalness = clamp(arm.b, 0.0, 1.0);

    vec3 V = normalize(cameraPosition - v_worldPosition);
    float NdV = clamp(abs(dot(N, V)), 0.001, 1.0);
    float fresnel = pow(1.0 - NdV, 4.5);

    if (u_isClone > 0.5) {
      vec3 rimCol = mix(vec3(0.95, 0.14, 0.22), vec3(0.12, 0.78, 1.0), fresnel);
      float lum = (0.25 + 1.55 * fresnel) * ao * u_cloneAlpha;
      gl_FragColor = vec4(rimCol * lum, clamp(lum, 0.0, 0.85));
      return;
    }

    if (u_isGlass > 0.5) {
      // Curved obsidian reflective EVA visor with sharp studio key-light glint (ref-08, 07--390x844)
      vec3 keyLight = normalize(vec3(-0.62, 0.42, 0.88));
      vec3 H = normalize(V + keyLight);
      float specCore = pow(max(dot(N, H), 0.0), 420.0);
      float specHalo = pow(max(dot(N, H), 0.0), 26.0);
      vec3 R = reflect(-V, N);
      vec2 envUv = clamp(vec2(R.x, R.y) * 0.35 + 0.5, 0.0, 1.0);
      vec3 envRefl = texture2D(u_envTexture, envUv).rgb * 0.10;
      vec3 rim = vec3(0.72, 0.80, 0.94) * fresnel * 0.42;
      vec3 tunnelTint = mix(vec3(0.0), vec3(0.85, 0.20, 0.68), u_tunnelGlow) * fresnel * 0.85;
      vec3 visorColor = vec3(0.012, 0.014, 0.019) + envRefl + rim + tunnelTint +
                        vec3(1.0) * (specCore * 2.4 + specHalo * 0.22);
      gl_FragColor = vec4(visorColor, u_opacity);
      return;
    }

    // Studio key + cool space fill + matcap sculptural fold shading from Lusion fragBlack / fragWhite
    vec3 L = normalize(u_sunPosition - v_worldPosition);
    float sunNdL = saturateVal(dot(N, L));
    vec3 L2 = normalize(vec3(14.0, 10.0, 26.0) - v_worldPosition);
    float fillNdL = saturateVal(dot(N, L2));

    vec3 viewRight = normalize(vec3(V.z, 0.0, -V.x));
    vec3 viewUp = cross(V, viewRight);
    vec2 matUv = clamp(vec2(dot(viewRight, N), dot(viewUp, N)) * 0.49 + 0.5, 0.0, 1.0);
    float matcapShade = 0.52 + 0.48 * (1.0 - texture2D(u_matcapTexture, matUv).r);
    float zShade = linearStep(-0.30, 1.15, N.z) * (0.62 + 0.38 * ao);

    float albedoScalar = dot(baseCol, vec3(0.3333));
    float darkDetailMask = smoothstep(0.06, 0.34, albedoScalar) * (1.0 - metalness * 0.72);

    vec3 litSuit = baseCol * (matcapShade * 0.94 + zShade * 0.78);
    litSuit *= mix(vec3(0.72, 0.77, 0.85), vec3(1.18, 1.19, 1.22), sunNdL * 0.68 + fillNdL * 0.48);
    litSuit *= (0.55 + 0.45 * ao);
    litSuit *= mix(0.20, 1.08, darkDetailMask);

    // Subtle specular sheen on buckles, rings & suit creases
    vec3 H = normalize(V + L);
    float spec = pow(max(dot(N, H), 0.0), mix(18.0, 96.0, 1.0 - roughness));
    litSuit += vec3(0.85, 0.90, 1.0) * spec * (0.10 + 0.55 * metalness);
    litSuit += u_ambientColor * fresnel * 0.26;
    litSuit += mix(vec3(0.85, 0.10, 0.16), vec3(0.16, 0.75, 1.0), N.x * 0.5 + 0.5) * u_tunnelGlow * (0.35 + fresnel * 0.9);

    gl_FragColor = vec4(clamp(litSuit, 0.0, 1.0), u_opacity);
  }
`;

// Eager singleton cache so all `.buf` & PBR textures download immediately when `/` mounts
interface AstronautAssetBundle {
  parts: Record<"helmet" | "helmet_glass" | "glove_shoes" | "wearpack", ParsedBufData>;
  inAnim: ParsedBufData;
  outAnim: ParsedBufData;
  animPosTex: THREE.DataTexture;
  animOrientTex: THREE.DataTexture;
  animTexSize: THREE.Vector2;
  textures: Record<string, THREE.Texture>;
}

let bundlePromise: Promise<AstronautAssetBundle> | null = null;

function loadAstronautBundle(): Promise<AstronautAssetBundle> {
  if (bundlePromise) return bundlePromise;

  const texLoader = new THREE.TextureLoader();
  const loadTex = (url: string, srgb = false) =>
    new Promise<THREE.Texture>((resolve) => {
      texLoader.load(
        url,
        (t) => {
          t.wrapS = THREE.RepeatWrapping;
          t.wrapT = THREE.RepeatWrapping;
          if (srgb) t.colorSpace = THREE.SRGBColorSpace;
          t.needsUpdate = true;
          resolve(t);
        },
        undefined,
        () => {
          const fallback = new THREE.DataTexture(new Uint8Array([220, 224, 232, 255]), 1, 1);
          fallback.needsUpdate = true;
          resolve(fallback);
        }
      );
    });

  bundlePromise = Promise.all([
    loadLusionBuf("/assets/models/tunnels/astronaut_helmet.buf"),
    loadLusionBuf("/assets/models/tunnels/astronaut_helmet_glass.buf"),
    loadLusionBuf("/assets/models/tunnels/astronaut_glove_shoes.buf"),
    loadLusionBuf("/assets/models/tunnels/astronaut_wearpack.buf"),
    loadLusionBuf("/assets/models/tunnels/astronaut_animations.buf"),
    loadLusionBuf("/assets/models/tunnels/astronaut_in_animation.buf"),
    loadLusionBuf("/assets/models/tunnels/astronaut_out_animation.buf"),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_helmet_base.webp", true),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_helmet_arm.webp"),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_helmet_nor.webp"),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_glove_shoes_base.webp", true),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_glove_shoes_arm.webp"),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_glove_shoes_nor.webp"),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_wearpack_base.webp", true),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_wearpack_arm.webp"),
    loadTex("/assets/textures/tunnels/astronaut/astronaut_wearpack_nor.webp"),
    loadTex("/assets/textures/tunnels/white_matcap.jpg"),
    loadTex("/assets/textures/tunnels/earth.webp", true),
    loadTex("/assets/textures/tunnels/stickers.png", true),
  ]).then(
    ([
      helmet,
      helmet_glass,
      glove_shoes,
      wearpack,
      animBuf,
      inAnim,
      outAnim,
      helmet_base,
      helmet_arm,
      helmet_nor,
      glove_shoes_base,
      glove_shoes_arm,
      glove_shoes_nor,
      wearpack_base,
      wearpack_arm,
      wearpack_nor,
      matcap,
      earth,
      stickers,
    ]) => {
      const posArr = animBuf.attributes.position as Float32Array;
      const oriArr = animBuf.attributes.orient as Float32Array;
      const totalEntries = posArr.length / 3;
      const texW = Math.ceil(Math.sqrt(totalEntries));
      const texH = Math.ceil(totalEntries / texW);
      const paddedLen = texW * texH * 4;
      const posRgba = new Float32Array(paddedLen);
      const oriRgba = new Float32Array(paddedLen);

      for (let i = 0, p3 = 0, p4 = 0; i < totalEntries; i += 1, p3 += 3, p4 += 4) {
        posRgba[p4] = posArr[p3];
        posRgba[p4 + 1] = posArr[p3 + 1];
        posRgba[p4 + 2] = posArr[p3 + 2];
        posRgba[p4 + 3] = 1;
        oriRgba[p4] = oriArr[p4];
        oriRgba[p4 + 1] = oriArr[p4 + 1];
        oriRgba[p4 + 2] = oriArr[p4 + 2];
        oriRgba[p4 + 3] = oriArr[p4 + 3];
      }

      const animPosTex = new THREE.DataTexture(posRgba, texW, texH, THREE.RGBAFormat, THREE.FloatType);
      animPosTex.minFilter = THREE.NearestFilter;
      animPosTex.magFilter = THREE.NearestFilter;
      animPosTex.generateMipmaps = false;
      animPosTex.flipY = false;
      animPosTex.needsUpdate = true;

      const animOrientTex = new THREE.DataTexture(oriRgba, texW, texH, THREE.RGBAFormat, THREE.FloatType);
      animOrientTex.minFilter = THREE.NearestFilter;
      animOrientTex.magFilter = THREE.NearestFilter;
      animOrientTex.generateMipmaps = false;
      animOrientTex.flipY = false;
      animOrientTex.needsUpdate = true;

      stickers.wrapS = THREE.ClampToEdgeWrapping;
      stickers.wrapT = THREE.ClampToEdgeWrapping;

      return {
        parts: { helmet, helmet_glass, glove_shoes, wearpack },
        inAnim,
        outAnim,
        animPosTex,
        animOrientTex,
        animTexSize: new THREE.Vector2(texW, texH),
        textures: {
          helmet_base,
          helmet_arm,
          helmet_nor,
          glove_shoes_base,
          glove_shoes_arm,
          glove_shoes_nor,
          wearpack_base,
          wearpack_arm,
          wearpack_nor,
          matcap,
          earth,
          stickers,
        },
      };
    }
  );

  return bundlePromise;
}

function sampleSplineTransform(
  spline: ParsedBufData,
  frameFloat: number,
  outPos: THREE.Vector3,
  outQuat: THREE.Quaternion
) {
  const posArr = spline.attributes.position as Float32Array;
  const oriArr = spline.attributes.orient as Float32Array;
  const maxIdx = Math.max(0, spline.header.vertexCount - 1);
  const clamped = Math.max(0, Math.min(maxIdx, frameFloat));
  const i0 = Math.floor(clamped);
  const i1 = Math.min(maxIdx, i0 + 1);
  const t = clamped - i0;

  const p0 = new THREE.Vector3(posArr[i0 * 3], posArr[i0 * 3 + 1], posArr[i0 * 3 + 2]);
  const p1 = new THREE.Vector3(posArr[i1 * 3], posArr[i1 * 3 + 1], posArr[i1 * 3 + 2]);
  outPos.copy(p0).lerp(p1, t);

  const q0 = new THREE.Quaternion(oriArr[i0 * 4], oriArr[i0 * 4 + 1], oriArr[i0 * 4 + 2], oriArr[i0 * 4 + 3]);
  const q1 = new THREE.Quaternion(oriArr[i1 * 4], oriArr[i1 * 4 + 1], oriArr[i1 * 4 + 2], oriArr[i1 * 4 + 3]);
  outQuat.copy(q0).slerp(q1, t);
}

/**
 * Full-Viewport Real-Time Three.js WebGL Stage (`GoalTunnels` + `GoalTunnelAstronauts`):
 *  - Stage 1 (`blackTitle`, `u = 0.00..0.28`): Deep space + chromatic halo + 9,515-vertex 53-bone skinned 3D EVA astronaut
 *  - Stage 2 (`blackTunnel`, `u = 0.28..0.41`): Red/cyan 3D sci-fi box-frame greeble tunnel + receding astronaut + 4 ghost clones
 *  - Stage 3 (`phase-e 07` emergence `u = 0.41..0.49`): Close-up zero-G 3D EVA astronaut emerging into focus
 *  - Stage 4 (`whiteTunnel`, `u = 0.49..0.66`): Glowing magenta/pink/cyan 3D crystalline energy vortex
 *  - Stage 5 (`astronautDrop` / `phase-e 08`, `u = 0.66..0.86`): Razor-sharp close-up 3D EVA astronaut with obsidian visor star glint
 *  - Stage 6 (`astronautWait`, `u = 0.86..1.00`): Standing & waving full-body 3D EVA astronaut (`frames 140..287`) + 26 floating `stickers.png` + 3D chrome spheres
 */
function GoalTunnelWebGLCanvas({
  progress,
  reducedMotion,
}: {
  progress: number;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(progress);

  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return;

    // Kick off eager load immediately upon `/` mount
    const readyPromise = loadAstronautBundle();

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      powerPreference: "high-performance",
      preserveDrawingBuffer: true,
    });
    renderer.setPixelRatio(Math.min(1.75, window.devicePixelRatio || 1));
    renderer.setClearColor(0x000000, 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.display = "block";
    renderer.domElement.setAttribute("aria-hidden", "true");
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 16 / 10, 0.4, 220);
    camera.position.set(0, 0, 25);
    camera.lookAt(0, 0, 24);

    // 1. Background Chromatic Prism Eclipse & Energy Vortex Fullscreen Quad
    const backdropUniforms = {
      u_time: { value: 0 },
      u_aspect: { value: 1.6 },
      u_haloAlpha: { value: 0.85 },
      u_blackTunnelAmt: { value: 0 },
      u_vortexAmt: { value: 0 },
    };
    const backdropMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        depthTest: false,
        depthWrite: false,
        uniforms: backdropUniforms,
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = vec4(position.xy, 0.9999, 1.0);
          }
        `,
        fragmentShader: /* glsl */ `
          precision highp float;
          varying vec2 vUv;
          uniform float u_time;
          uniform float u_aspect;
          uniform float u_haloAlpha;
          uniform float u_blackTunnelAmt;
          uniform float u_vortexAmt;

          float hash21(vec2 p) {
            p = fract(p * vec2(123.34, 456.21));
            p += dot(p, p + 45.32);
            return fract(p.x * p.y);
          }

          void main() {
            vec2 centered = (vUv - 0.5) * vec2(u_aspect, 1.0);
            float r = length(centered);
            float ang = atan(centered.y, centered.x);

            // Warm amber -> cream -> cool cyan chromatic dispersion eclipse ring (ref-08, 07, 07--390x844)
            float ringBase = u_aspect > 1.0 ? 0.62 : 0.42;
            float ringR = exp(-pow((r - ringBase * 0.96) / 0.14, 2.0));
            float ringG = exp(-pow((r - ringBase * 1.02) / 0.15, 2.0));
            float ringB = exp(-pow((r - ringBase * 1.09) / 0.17, 2.0));
            vec3 col = vec3(ringR * 0.19, ringG * 0.155, ringB * 0.185) * u_haloAlpha;

            // Stage 2 (07b-home-goal-mid): Deep red/crimson + cyan rectangular sci-fi greeble tunnel perspective
            if (u_blackTunnelAmt > 0.001) {
              float boxDist = max(abs(centered.x / max(0.65, u_aspect * 0.62)), abs(centered.y / 0.62));
              float depthZ = 1.0 / max(0.06, boxDist);
              float gridZ = abs(fract(depthZ * 0.85 - u_time * 0.55) - 0.5);
              float gridA = abs(fract(ang * 3.183) - 0.5);
              float ribs = smoothstep(0.16, 0.0, gridZ) + smoothstep(0.10, 0.0, gridA) * 0.65;
              float sideTint = smoothstep(-0.35, 0.35, centered.x);
              vec3 sciCol = mix(vec3(0.76, 0.05, 0.08), vec3(0.05, 0.62, 0.78), sideTint * 0.55 + 0.15);
              vec3 tunnelGlow = sciCol * ribs * smoothstep(0.06, 0.85, boxDist) * 0.95;
              tunnelGlow += vec3(0.32, 0.03, 0.05) * exp(-boxDist * 1.6);
              col = mix(col, tunnelGlow, u_blackTunnelAmt);
            }

            // Stage 4 (08-home-goal-stage2): Glowing magenta/pink/cyan crystalline cylindrical vortex (08--1440x900)
            if (u_vortexAmt > 0.001) {
              float rr = max(0.02, r);
              float invR = 1.15 / (rr + 0.10);
              float spokes1 = pow(abs(sin(ang * 9.0 + sin(invR * 0.8 - u_time * 1.4))), 6.0);
              float spokes2 = pow(abs(cos(ang * 14.0 - invR * 0.55 + u_time * 1.1)), 8.0);
              float rings = pow(abs(sin(invR * 2.2 - u_time * 2.4)), 4.0);
              float core = exp(-rr * 4.2) * 1.35 + exp(-pow((rr - 0.24) / 0.13, 2.0)) * 0.55;
              float shards = (spokes1 * 0.75 + spokes2 * 0.65) * (0.45 + rings * 0.85) * smoothstep(0.03, 0.42, rr);
              vec3 cPink = vec3(1.0, 0.30, 0.74);
              vec3 cCyan = vec3(0.42, 0.72, 1.0);
              vec3 vortexCol = mix(cPink, cCyan, 0.5 + 0.5 * sin(ang * 3.0 + rr * 5.0));
              vec3 finalVortex = vortexCol * (shards * 1.25 + rings * 0.28) + vec3(1.0, 0.88, 0.98) * core;
              col = mix(col, clamp(finalVortex, 0.0, 1.0), u_vortexAmt);
            }

            gl_FragColor = vec4(col, 1.0);
          }
        `,
      })
    );
    backdropMesh.renderOrder = -100;
    backdropMesh.frustumCulled = false;
    scene.add(backdropMesh);

    // 2. 3D Sci-Fi Tunnel Wire Ribs (`07b` & `08`)
    const tunnelGroup = new THREE.Group();
    const ribGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(5.6, 5.6, 1.8));
    const ribMats: THREE.LineBasicMaterial[] = [];
    for (let i = 0; i < 12; i += 1) {
      const mat = new THREE.LineBasicMaterial({
        color: i % 3 === 0 ? 0x16b8df : 0xd61a2c,
        transparent: true,
        opacity: 0,
      });
      ribMats.push(mat);
      const seg = new THREE.LineSegments(ribGeo, mat);
      seg.position.z = 23 - i * 1.9;
      seg.rotation.z = (i % 2 === 0 ? 1 : -1) * 0.08 * i;
      tunnelGroup.add(seg);
    }
    scene.add(tunnelGroup);

    // 3. Real 53-Bone GPU-Skinned 3D EVA Astronaut + 4 Ghost Clones + Floating Stickers & Chrome Spheres
    const astronautGroup = new THREE.Group();
    scene.add(astronautGroup);

    const mainUniformsList: Record<string, THREE.IUniform>[] = [];
    const cloneGroups: Array<{ group: THREE.Group; uniformsList: Record<string, THREE.IUniform>[] }> = [];
    let stickerMesh: THREE.Mesh<THREE.InstancedBufferGeometry, THREE.ShaderMaterial> | null = null;
    const chromeGroup = new THREE.Group();
    scene.add(chromeGroup);
    chromeGroup.visible = false;

    const sphereGeo = new THREE.SphereGeometry(0.19, 20, 16);
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xd8e4ff,
      metalness: 0.92,
      roughness: 0.14,
    });
    const chromeSpheres: THREE.Mesh[] = [];
    for (let i = 0; i < 18; i += 1) {
      const sp = new THREE.Mesh(sphereGeo, chromeMat);
      const a = (i / 18) * Math.PI * 2;
      const rad = 1.15 + (i % 4) * 0.55;
      sp.position.set(Math.cos(a) * rad * 1.45, Math.sin(a * 1.7) * 1.35, 21.2 + (i % 5) * 0.45);
      sp.scale.setScalar(0.55 + (i % 3) * 0.32);
      chromeGroup.add(sp);
      chromeSpheres.push(sp);
    }
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
    keyLight.position.set(-6, 8, 28);
    scene.add(keyLight);
    const rimLight = new THREE.PointLight(0x689aff, 3.0, 20);
    rimLight.position.set(4, -2, 26);
    scene.add(rimLight);

    let bundleRef: AstronautAssetBundle | null = null;
    let disposed = false;

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const w = Math.max(320, Math.round(rect.width || window.innerWidth));
      const h = Math.max(320, Math.round(rect.height || window.innerHeight));
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.fov = w < h * 0.85 ? 50 : 45;
      camera.updateProjectionMatrix();
      backdropUniforms.u_aspect.value = w / h;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(host);

    const posTmp = new THREE.Vector3();
    const quatTmp = new THREE.Quaternion();
    const startClock = performance.now();

    const drawFrame = () => {
      const elapsed = reducedMotion ? 1.2 : (performance.now() - startClock) * 0.001;
      const p = progressRef.current;
      const isMobile = camera.aspect < 0.85;

      backdropUniforms.u_time.value = elapsed;

      // Smooth multi-stage envelope across `p in [0..1]`
      const blackTunnelAmt =
        p >= 0.27 && p <= 0.42
          ? Math.min(1, Math.min((p - 0.27) / 0.04, (0.42 - p) / 0.04))
          : 0;
      const vortexAmt =
        p >= 0.49 && p <= 0.65
          ? Math.min(1, Math.min((p - 0.49) / 0.04, (0.65 - p) / 0.04))
          : 0;
      const waitAmt = p >= 0.86 ? Math.min(1, (p - 0.86) / 0.05) : 0;

      backdropUniforms.u_blackTunnelAmt.value = blackTunnelAmt;
      backdropUniforms.u_vortexAmt.value = vortexAmt;
      backdropUniforms.u_haloAlpha.value = (1 - vortexAmt) * (1 - waitAmt * 0.85) * 0.92;

      // Update 3D sci-fi wire ribs
      tunnelGroup.visible = blackTunnelAmt > 0.01 || vortexAmt > 0.01;
      for (let i = 0; i < ribMats.length; i += 1) {
        ribMats[i].opacity = blackTunnelAmt * 0.55 + vortexAmt * 0.35;
        ribMats[i].color.setHex(
          vortexAmt > 0.3 ? (i % 2 === 0 ? 0xff49b8 : 0x5cc4ff) : i % 3 === 0 ? 0x16b8df : 0xd61a2c
        );
      }

      if (bundleRef) {
        let animFrame = 18;
        let astroOpacity = 1;

        if (p < 0.28) {
          // Stage 1 (`07-home-goal-stage1`):
          // Mobile: heroic close-up chest-up astronaut facing camera (`inAnim[1]`, `07--390x844.jpg`)
          // Desktop: astronaut turning slightly right behind "STEP INTO A NEW WORLD..." (`inAnim[17]`, `07--1440x900.jpg`)
          const subT = Math.min(1, Math.max(0, p / 0.28));
          const splineFrame = isMobile ? 1.5 + subT * 5.0 : 12.0 + subT * 10.0;
          sampleSplineTransform(bundleRef.inAnim, splineFrame, posTmp, quatTmp);
          if (isMobile) {
            posTmp.set(0.02, -0.86, 23.08);
          } else {
            posTmp.x -= 0.14;
            posTmp.y += 0.06;
          }
          animFrame = (elapsed * 24) % 89;
        } else if (p < 0.42) {
          // Stage 2 (`07b-home-goal-mid`): Flying deeper into red/cyan greeble tunnel (`z ~ 16.5`) + 4 clones
          sampleSplineTransform(bundleRef.inAnim, 58, posTmp, quatTmp);
          animFrame = (elapsed * 36) % 89;
        } else if (p < 0.49) {
          // Stage 3 (`phase-e 07` @ `0.44`): Close-up zero-G astronaut emerging toward camera
          sampleSplineTransform(bundleRef.inAnim, 2.0, posTmp, quatTmp);
          posTmp.set(-0.04, -0.78, 22.92);
          animFrame = 12;
        } else if (p < 0.65) {
          // Stage 4 (`08-home-goal-stage2`): Magenta/cyan energy vortex climax (astronaut recessed inside core)
          sampleSplineTransform(bundleRef.outAnim, 10, posTmp, quatTmp);
          astroOpacity = 0.22;
          animFrame = (elapsed * 40) % 89;
        } else if (p < 0.86) {
          // Stage 5 (`08b` & `phase-e 08` @ `0.78`): Razor-sharp close-up 3D EVA astronaut (`ref-08--1440x900.png`)
          sampleSplineTransform(bundleRef.inAnim, 0, posTmp, quatTmp);
          if (isMobile) {
            posTmp.set(-0.02, -0.58, 22.15);
          } else {
            posTmp.set(-0.02, -0.76, 22.96);
          }
          animFrame = 8 + (reducedMotion ? 0 : Math.sin(elapsed * 0.9) * 3.0 + 3.0);
        } else {
          // Stage 6 (`09a-home-end-cta` @ `astronautWait`): Full-body standing & waving right hand (`frames 140..287`)
          sampleSplineTransform(bundleRef.outAnim, 99, posTmp, quatTmp);
          posTmp.set(-0.26, -0.70, 22.15);
          if (isMobile) posTmp.set(0.0, -0.74, 21.65);
          // Frame ~198 in `astronaut_animations.buf` (`140..287`) raises the right arm high in greeting wave!
          animFrame = 196 + (reducedMotion ? 0 : Math.sin(elapsed * 2.2) * 14);
        }

        const f0 = Math.floor(animFrame);
        const f1 = Math.min(287, f0 + 1);
        const blend = animFrame - f0;

        for (const u of mainUniformsList) {
          u.u_instancePos.value.copy(posTmp);
          u.u_instanceOrient.value.set(quatTmp.x, quatTmp.y, quatTmp.z, quatTmp.w);
          u.u_frameFromToBlend.value.set(f0, f1, blend);
          u.u_tunnelGlow.value = Math.max(blackTunnelAmt * 0.75, vortexAmt);
          u.u_opacity.value = astroOpacity;
        }

        // Update 4 additive ghost clones visible inside `blackTunnel` (`07b`) — skip vertex skinning when hidden!
        const showClones = blackTunnelAmt > 0.05;
        for (let c = 0; c < cloneGroups.length; c += 1) {
          cloneGroups[c].group.visible = showClones;
          if (!showClones) continue;
          const ang = (c / cloneGroups.length) * Math.PI * 2 + elapsed * 0.45;
          const cf = ((animFrame + c * 19) % 88) + 1;
          for (const cu of cloneGroups[c].uniformsList) {
            cu.u_instancePos.value.set(
              posTmp.x + Math.cos(ang) * 1.9,
              posTmp.y + Math.sin(ang) * 1.35,
              posTmp.z - 1.2 - c * 1.1
            );
            cu.u_instanceOrient.value.set(quatTmp.x, quatTmp.y, quatTmp.z, quatTmp.w);
            cu.u_frameFromToBlend.value.set(Math.floor(cf), Math.min(89, Math.ceil(cf)), cf % 1);
            cu.u_cloneAlpha.value = blackTunnelAmt * 0.55;
          }
        }

        // Update floating `stickers.png` (`GoalWhiteTunnelStickers`) & chrome spheres at `09a`
        if (stickerMesh) {
          stickerMesh.visible = waitAmt > 0.02;
          stickerMesh.material.uniforms.u_activeRatio.value = waitAmt;
          stickerMesh.material.uniforms.u_time.value = 3.4 + elapsed * 0.35;
          stickerMesh.material.uniforms.u_aspect.value = camera.aspect;
        }
        chromeGroup.visible = waitAmt > 0.02;
        if (chromeGroup.visible) {
          for (let i = 0; i < chromeSpheres.length; i += 1) {
            chromeSpheres[i].position.y += Math.sin(elapsed + i) * 0.002;
          }
        }
      }

      renderer.render(scene, camera);
    };

    readyPromise
      .then((bundle) => {
        if (disposed) return;
        bundleRef = bundle;

        const partNames: Array<"wearpack" | "glove_shoes" | "helmet" | "helmet_glass"> = [
          "wearpack",
          "glove_shoes",
          "helmet",
          "helmet_glass",
        ];

        const buildAstronautMeshes = (isClone: boolean, targetGroup: THREE.Group) => {
          const uniformsList: Record<string, THREE.IUniform>[] = [];
          for (const partName of partNames) {
            if (isClone && partName === "helmet_glass") continue;
            const texPrefix = partName === "helmet_glass" ? "helmet" : partName;
            const uniforms: Record<string, THREE.IUniform> = {
              u_animationPositionTexture: { value: bundle.animPosTex },
              u_animationOrientTexture: { value: bundle.animOrientTex },
              u_animationTextureSize: { value: bundle.animTexSize },
              u_frameFromToBlend: { value: new THREE.Vector3(0, 1, 0) },
              u_instancePos: { value: new THREE.Vector3(0, -0.75, 23) },
              u_instanceOrient: { value: new THREE.Vector4(0, 0, 0, 1) },
              u_baseTexture: { value: bundle.textures[`${texPrefix}_base`] },
              u_armTexture: { value: bundle.textures[`${texPrefix}_arm`] },
              u_norTexture: { value: bundle.textures[`${texPrefix}_nor`] },
              u_matcapTexture: { value: bundle.textures.matcap },
              u_envTexture: { value: bundle.textures.earth },
              u_sunPosition: { value: new THREE.Vector3(-18, 6, 28) },
              u_ambientColor: { value: new THREE.Color("#566d80") },
              u_isGlass: { value: partName === "helmet_glass" ? 1 : 0 },
              u_isClone: { value: isClone ? 1 : 0 },
              u_cloneAlpha: { value: 0 },
              u_tunnelGlow: { value: 0 },
              u_opacity: { value: 1 },
            };
            const mat = new THREE.ShaderMaterial({
              uniforms,
              vertexShader: ASTRONAUT_VERTEX_GLSL,
              fragmentShader: ASTRONAUT_FRAGMENT_GLSL,
              side: THREE.DoubleSide,
              transparent: isClone || partName === "helmet_glass",
              blending: isClone ? THREE.AdditiveBlending : THREE.NormalBlending,
              depthWrite: !isClone,
            });
            const mesh = new THREE.Mesh(bundle.parts[partName].geometry, mat);
            mesh.frustumCulled = false;
            mesh.renderOrder = isClone ? 5 : partName === "helmet_glass" ? 3 : 2;
            targetGroup.add(mesh);
            uniformsList.push(uniforms);
          }
          return uniformsList;
        };

        mainUniformsList.push(...buildAstronautMeshes(false, astronautGroup));
        for (let c = 0; c < 4; c += 1) {
          const cloneGroup = new THREE.Group();
          cloneGroup.visible = false;
          astronautGroup.add(cloneGroup);
          cloneGroups.push({ group: cloneGroup, uniformsList: buildAstronautMeshes(true, cloneGroup) });
        }

        // Build `GoalWhiteTunnelStickers` instanced quad cloud (`stickers.png`)
        const count = 20;
        const plane = new THREE.PlaneGeometry(1, 1);
        const instGeo = new THREE.InstancedBufferGeometry();
        instGeo.index = plane.index;
        instGeo.setAttribute("position", plane.attributes.position);
        instGeo.setAttribute("uv", plane.attributes.uv);

        const uvInfo = new Float32Array(count * 4);
        const instPos = new Float32Array(count * 3);
        const instRotScale = new Float32Array(count * 2);
        for (let i = 0; i < count; i += 1) {
          const rect = STICKER_RECTS[i % STICKER_RECTS.length];
          uvInfo[i * 4] = rect.x / STICKER_ATLAS_W;
          uvInfo[i * 4 + 1] = rect.y / STICKER_ATLAS_H;
          uvInfo[i * 4 + 2] = rect.w / STICKER_ATLAS_W;
          uvInfo[i * 4 + 3] = rect.h / STICKER_ATLAS_H;

          const side = i % 2 === 0 ? -1 : 1;
          const col = (i % 5) / 5;
          instPos[i * 3] = side * (0.85 + col * 2.35) + (i % 3 === 0 ? 0.35 : -0.2);
          instPos[i * 3 + 1] = -1.65 + ((i * 0.37) % 1) * 3.35;
          instPos[i * 3 + 2] = 20.4 + (i % 4) * 0.45;
          instRotScale[i * 2] = ((i * 1.13) % 6.28) - 3.14;
          instRotScale[i * 2 + 1] = 0.30 + (i % 3) * 0.08;
        }
        instGeo.setAttribute("a_uvInfo", new THREE.InstancedBufferAttribute(uvInfo, 4));
        instGeo.setAttribute("a_offset", new THREE.InstancedBufferAttribute(instPos, 3));
        instGeo.setAttribute("a_rotScale", new THREE.InstancedBufferAttribute(instRotScale, 2));

        const stickerMat = new THREE.ShaderMaterial({
          transparent: true,
          depthWrite: false,
          uniforms: {
            u_texture: { value: bundle.textures.stickers },
            u_textureSize: { value: new THREE.Vector2(STICKER_ATLAS_W, STICKER_ATLAS_H) },
            u_activeRatio: { value: 0 },
            u_time: { value: 0 },
            u_aspect: { value: camera.aspect },
          },
          vertexShader: /* glsl */ `
            attribute vec4 a_uvInfo;
            attribute vec3 a_offset;
            attribute vec2 a_rotScale;
            uniform vec2 u_textureSize;
            uniform float u_activeRatio;
            uniform float u_time;
            varying vec2 vStickerUv;
            void main() {
              vec3 pos = position;
              pos.xy *= a_uvInfo.zw * u_textureSize * 0.0028 * a_rotScale.y * u_activeRatio;
              float ang = a_rotScale.x + sin(u_time * 0.6 + a_offset.x) * 0.22;
              float c = cos(ang);
              float s = sin(ang);
              pos.xy = mat2(c, s, -s, c) * pos.xy;
              pos += a_offset;
              pos.y += sin(u_time * 0.45 + a_offset.x * 1.7) * 0.14;
              vStickerUv = vec2(
                a_uvInfo.x + a_uvInfo.z * uv.x,
                1.0 - (a_uvInfo.y + a_uvInfo.w * (1.0 - uv.y))
              );
              gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
          `,
          fragmentShader: /* glsl */ `
            precision highp float;
            uniform sampler2D u_texture;
            uniform float u_activeRatio;
            varying vec2 vStickerUv;
            void main() {
              vec4 texel = texture2D(u_texture, vStickerUv);
              if (texel.a < 0.08) discard;
              gl_FragColor = vec4(texel.rgb, texel.a * u_activeRatio);
            }
          `,
        });

        stickerMesh = new THREE.Mesh(instGeo, stickerMat);
        stickerMesh.frustumCulled = false;
        stickerMesh.renderOrder = 8;
        stickerMesh.visible = false;
        scene.add(stickerMesh);

        drawFrame();
      })
      .catch(() => {});

    let rafId = 0;
    const loop = () => {
      if (disposed) return;
      const r = host.getBoundingClientRect();
      if (r.bottom > -240 && r.top < window.innerHeight + 240) {
        drawFrame();
      }
      rafId = window.requestAnimationFrame(loop);
    };
    loop();

    return () => {
      disposed = true;
      window.cancelAnimationFrame(rafId);
      ro.disconnect();
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [reducedMotion]);

  return <div ref={containerRef} className="h-full w-full bg-[#000000]" />;
}

/**
 * Verified Lusion Goal & Multi-Stage 3D EVA Astronaut Tunnel (`#home-goal`)
 */
export function GoalTunnelSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const tunnelTrackRef = useRef<HTMLDivElement>(null);
  const setActiveSurface = useStudioStore((s) => s.setActiveSurface);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Eagerly preload `.buf` astronaut meshes & PBR textures on homepage load
    loadAstronautBundle().catch(() => {});
  }, []);

  useEffect(() => {
    let rafId = 0;

    const syncInspectorRanges = () => {
      const track = tunnelTrackRef.current;
      if (!track || typeof window === "undefined") return;
      const rect = track.getBoundingClientRect();
      const baseY = Math.max(0, window.scrollY + rect.top);
      const vhSpan = Math.max(1, track.offsetHeight - (window.innerHeight || 900));

      window.__lusionInspector = {
        ...window.__lusionInspector,
        properties: { hasStarted: true },
        scrollManager: {
          scrollPixel: window.scrollY,
          contentSizePixel: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
          scrollLimit: Math.max(0, document.documentElement.scrollHeight - window.innerHeight),
          scrollToPixel: (y: number) => {
            const w = window as unknown as {
              __lenis?: { resize: () => void; scrollTo: (t: number, o?: { immediate?: boolean }) => void };
            };
            w.__lenis?.resize();
            w.__lenis?.scrollTo(y, { immediate: true });
            window.scrollTo({ top: y, behavior: "instant" });
          },
        },
        homeGoalSectionRanges: {
          baseY,
          items: {
            blackTitle: {
              id: "blackTitle",
              pixelFrom: Math.round(theSpan(vhSpan, 0.04)),
              pixelCount: Math.round(theSpan(vhSpan, 0.22)),
              pixelTo: Math.round(theSpan(vhSpan, 0.26)),
            },
            blackTunnel: {
              id: "blackTunnel",
              pixelFrom: Math.round(theSpan(vhSpan, 0.28)),
              pixelCount: Math.round(theSpan(vhSpan, 0.13)),
              pixelTo: Math.round(theSpan(vhSpan, 0.41)),
            },
            whiteTunnel: {
              id: "whiteTunnel",
              pixelFrom: Math.round(theSpan(vhSpan, 0.50)),
              pixelCount: Math.round(theSpan(constVh(vhSpan), 0.14)),
              pixelTo: Math.round(theSpan(vhSpan, 0.64)),
            },
            astronautDrop: {
              id: "astronautDrop",
              pixelFrom: Math.round(theSpan(vhSpan, 0.66)),
              pixelCount: Math.round(theSpan(vhSpan, 0.14)),
              pixelTo: Math.round(theSpan(vhSpan, 0.80)),
            },
          },
        },
      };
    };

    function constVh(v: number) {
      return v;
    }

    function theSpan(span: number, ratio: number) {
      return span * ratio;
    }

    const update = () => {
      const track = tunnelTrackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const vh = window.innerHeight || 900;
      const scrollable = Math.max(1, rect.height - vh);
      const raw = Math.min(1, Math.max(0, -rect.top / scrollable));
      setProgress(raw);
      syncInspectorRanges();

      if (rect.top <= 72 && rect.bottom >= 96) {
        setActiveSurface("void");
      }
    };

    const onScroll = () => {
      window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      window.cancelAnimationFrame(rafId);
    };
  }, [setActiveSurface]);

  // Stage 1 white title opacity: crisp `#ffffff` across `blackTitle` (`0.03..0.25`)
  const stage1TitleOpacity = reducedMotion
    ? 1
    : progress < 0.03
      ? progress / 0.03
      : progress <= 0.24
        ? 1
        : Math.max(0, 1 - (progress - 0.24) / 0.04);

  const stage1Scale = reducedMotion ? 1 : 0.97 + Math.min(0.25, progress) * 0.22;
  const showContinuePill = !reducedMotion && progress >= 0.87;

  return (
    <section
      id="home-goal"
      ref={sectionRef}
      className="section relative w-full text-[clamp(0.875rem,1vw,2rem)]"
    >
      {/* Part A: Context Editorial Band (`#home-goal-context` — `06-home-goal-intro`) */}
      <div
        id="home-goal-context"
        className="relative overflow-hidden grid grid-cols-6 gap-x-[var(--grid-gap)] bg-[#f0f1fa] px-[var(--base-padding-x)] pt-24 pb-24 text-[#000000] min-[813px]:grid-cols-12 min-[813px]:pt-32 min-[813px]:pb-32"
      >
        {/* Sculptural 3D Cyan Ribbon Loop sweeping behind upper-right (`06-home-goal-intro`) */}
        <svg
          aria-hidden="true"
          viewBox="0 0 1440 520"
          fill="none"
          className="pointer-events-none absolute top-0 left-0 h-full w-full object-cover opacity-95"
        >
          <defs>
            <linearGradient id="goal-cyan-loop" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#65f7f8" />
              <stop offset="55%" stopColor="#26e4eb" />
              <stop offset="100%" stopColor="#09b7c8" />
            </linearGradient>
          </defs>
          <path
            d="M 880 -40 C 835 165, 995 275, 1145 190 C 1270 118, 1210 -20, 1125 45 C 1040 110, 1185 330, 1490 275"
            stroke="url(#goal-cyan-loop)"
            strokeWidth="38"
            strokeLinecap="round"
          />
        </svg>

        <div
          id="home-goal-context-inner"
          className="relative z-10 col-span-6 grid grid-cols-6 gap-x-[var(--grid-gap)] min-[813px]:col-span-12 min-[813px]:grid-cols-12"
        >
          <h2
            id="home-goal-title"
            className="col-span-6 m-0 font-sans text-[11vw] leading-[1.06] font-normal tracking-[-0.025em] min-[813px]:col-span-8 min-[813px]:text-[5.5vw]"
          >
            {LUSION_HOME.goal.heading}
          </h2>

          <p
            id="home-goal-texts"
            className="col-span-6 mt-10 mb-0 font-sans text-[1.125rem] leading-[1.5] text-black/85 min-[813px]:col-start-7 min-[813px]:col-span-6 min-[813px]:mt-14 min-[813px]:text-[clamp(1.1rem,1.35vw,1.8rem)]"
          >
            {LUSION_HOME.goal.paragraphs.map((para, idx) => (
              <React.Fragment key={idx}>
                <span className="home-goal-texts-p block">{para}</span>
                {idx < LUSION_HOME.goal.paragraphs.length - 1 && (
                  <>
                    <br />
                    <br />
                  </>
                )}
              </React.Fragment>
            ))}
          </p>

          {/* Centered Device Portal Bezel transitioning into `#home-goal-tunnel` (`06-home-goal-intro`) */}
          <div
            id="home-goal-image-in"
            className="col-span-6 mt-14 mx-auto aspect-[16/10] w-full max-w-[44rem] rounded-[1.4rem] border-[6px] border-[#262932] bg-[#000000] shadow-[0_28px_70px_rgba(0,0,0,0.28)] min-[813px]:col-span-12 min-[813px]:mt-20"
          />
        </div>
      </div>

      {/* Part B: Full-Length Multi-Stage Sticky 3D WebGL Tunnel (`maxScroll ≈ 64,062px` matching live `lusion.co`) */}
      <div
        id="home-goal-tunnel"
        ref={tunnelTrackRef}
        className={`relative w-full bg-[#000000] ${
          reducedMotion ? "min-h-[100dvh]" : "h-[6000vh]"
        }`}
      >
        {/* Stage 6 anchor (`#end-section` — standing/waving EVA astronaut + pop-art stickers + scroll pill) */}
        <div
          id="end-section"
          aria-label="Astronaut finale and continue-scroll transition"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[100dvh]"
        />

        <div className="sticky top-0 h-[100dvh] w-full overflow-hidden bg-[#000000]">
          <GoalTunnelWebGLCanvas progress={progress} reducedMotion={reducedMotion} />

          {/* Stage 1 Centered High-Contrast White Display Headline (`21:1` WCAG AAA) */}
          <div
            id="home-goal-image-in-text"
            style={{
              opacity: stage1TitleOpacity,
              transform: `translate(-50%, -50%) scale(${stage1Scale.toFixed(3)})`,
            }}
            className="pointer-events-none absolute top-1/2 left-1/2 z-20 w-[94vw] text-center font-sans text-[5.15vw] leading-[1.18] font-normal tracking-[0.06em] whitespace-nowrap text-white uppercase drop-shadow-[0_4px_24px_rgba(0,0,0,0.9)] min-[813px]:w-[92vw] min-[813px]:text-[4.55vw] min-[813px]:tracking-[0.07em]"
          >
            {LUSION_HOME.goal.tunnelTitleLines.map((line, idx) => (
              <span key={idx} className="block">
                {line}
              </span>
            ))}
          </div>

          {/* Stage 6 Mobile Display CTA Overlay (`09a--390x844`) */}
          {showContinuePill && (
            <div className="pointer-events-none absolute inset-x-4 top-[29%] z-20 text-center text-white min-[813px]:hidden">
              <p className="font-sans text-[11px] font-medium tracking-[0.06em] uppercase opacity-95">
                IS YOUR BIG IDEA READY
                <br />
                TO GO WILD?
              </p>
              <p className="mt-4 font-sans text-[13.5vw] leading-[0.98] font-normal tracking-[-0.025em]">
                Let&apos;s work
                <br />
                together!
              </p>
            </div>
          )}

          {/* Stage 6 Bottom Continue-Scroll Pill (`09a` standing/waving EVA astronaut + stickers) */}
          {showContinuePill && (
            <div className="pointer-events-none absolute bottom-7 left-1/2 z-20 -translate-x-1/2 rounded-full bg-white px-5 py-2.5 font-mono text-[0.68rem] font-medium tracking-[0.08em] whitespace-nowrap text-[#000000] uppercase shadow-lg min-[813px]:left-[31%] min-[813px]:-translate-x-1/2">
              ↓ &nbsp; CONTINUE TO SCROLL &nbsp; ↓
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
