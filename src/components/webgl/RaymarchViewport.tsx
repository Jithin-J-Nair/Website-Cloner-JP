"use client";

import React, { useEffect, useRef } from "react";
import { useStudioStore } from "@/lib/store";

const VERT_SRC = `
attribute vec2 aPos;
varying vec2 vUv;
void main() {
  vUv = aPos * 0.5 + 0.5;
  gl_Position = vec4(aPos, 0.0, 1.0);
}
`;

const FRAG_SRC = `
precision highp float;
varying vec2 vUv;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uMouse;
uniform float uDispersion;
uniform float uTurbulence;

// Smooth minimum operator blending separate SDF spheres into liquid glass union
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / max(0.001, k), 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float mapScene(vec3 p) {
  float t = uTime * (0.65 + uTurbulence * 0.5);
  vec3 cursorOrb = vec3(uMouse.x * 1.45, uMouse.y * 0.95, 0.25);

  float d = length(p - cursorOrb) - 0.44;
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    vec3 c = vec3(
      sin(t * (0.7 + fi * 0.19) + fi * 1.6) * 1.15,
      cos(t * (0.58 + fi * 0.15) + fi * 2.1) * 0.72,
      sin(t * 0.45 + fi * 1.1) * 0.55
    );
    float r = 0.28 + 0.07 * sin(fi * 3.1 + t);
    d = smin(d, length(p - c) - r, 0.46);
  }
  return d;
}

vec3 calcNormal(vec3 p) {
  vec2 e = vec2(0.0025, 0.0);
  return normalize(vec3(
    mapScene(p + e.xyy) - mapScene(p - e.xyy),
    mapScene(p + e.yxy) - mapScene(p - e.yxy),
    mapScene(p + e.yyx) - mapScene(p - e.yyx)
  ));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes.xy) / max(1.0, uRes.y);
  vec3 ro = vec3(0.0, 0.0, 3.35);
  vec3 rd = normalize(vec3(uv, -1.35));

  float totalDist = 0.0;
  bool hit = false;
  for (int step = 0; step < 52; step++) {
    vec3 p = ro + rd * totalDist;
    float d = mapScene(p);
    if (d < 0.002) {
      hit = true;
      break;
    }
    if (totalDist > 7.5) break;
    totalDist += d * 0.85;
  }

  // Deep studio gradient background
  vec3 bg = mix(vec3(0.028, 0.036, 0.065), vec3(0.06, 0.09, 0.20), vUv.y);

  if (!hit) {
    gl_FragColor = vec4(bg, 1.0);
    return;
  }

  vec3 pos = ro + rd * totalDist;
  vec3 n = calcNormal(pos);
  vec3 viewDir = normalize(ro - pos);

  float fres = pow(1.0 - clamp(dot(n, viewDir), 0.0, 1.0), 3.4);
  vec3 lightA = normalize(vec3(-0.6, 0.8, 0.7));
  vec3 lightB = normalize(vec3(0.8, -0.4, 0.5));

  float diffA = max(dot(n, lightA), 0.0);
  float diffB = max(dot(n, lightB), 0.0);
  float spec = pow(max(dot(reflect(-lightA, n), viewDir), 0.0), 64.0);

  vec3 col = vec3(0.05, 0.08, 0.22);
  col += vec3(0.14, 0.20, 1.0) * diffA * 0.95;
  col += vec3(0.0, 0.82, 1.0) * diffB * (0.45 + uDispersion * 0.65);
  col += mix(vec3(0.22, 0.35, 1.0), vec3(1.0, 0.32, 0.22), uDispersion) * fres * 1.25;
  col += vec3(1.0) * spec * 1.1;

  gl_FragColor = vec4(col, 1.0);
}
`;

/**
 * Self-contained Raw WebGL Analytical SDF Raymarching Viewport (`EXP // RAYMARCH`).
 * Renders smooth-union liquid glass metaballs fusing seamlessly with a pointer-driven orb.
 */
export function RaymarchViewport() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  const labUniforms = useStudioStore((s) => s.labUniforms);
  const reducedMotion = useStudioStore((s) => s.reducedMotion);
  const uniformsRef = useRef(labUniforms);

  useEffect(() => {
    uniformsRef.current = labUniforms;
  }, [labUniforms]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type);
      if (!sh) return null;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        gl.deleteShader(sh);
        return null;
      }
      return sh;
    };

    const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
    const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;

    const quad = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quad);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    );

    const aPos = gl.getAttribLocation(program, "aPos");
    const uRes = gl.getUniformLocation(program, "uRes");
    const uTime = gl.getUniformLocation(program, "uTime");
    const uMouse = gl.getUniformLocation(program, "uMouse");
    const uDisp = gl.getUniformLocation(program, "uDispersion");
    const uTurb = gl.getUniformLocation(program, "uTurbulence");

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(240, Math.floor(rect.width * dpr));
      canvas.height = Math.max(160, Math.floor(rect.height * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();

    let raf = 0;
    const draw = (ms: number) => {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, reducedMotion ? 2.2 : ms * 0.001);
      gl.uniform2f(uMouse, pointerRef.current.x, pointerRef.current.y);
      gl.uniform1f(uDisp, uniformsRef.current.dispersion);
      gl.uniform1f(uTurb, uniformsRef.current.turbulence);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!reducedMotion) {
        raf = window.requestAnimationFrame(draw);
      }
    };

    raf = window.requestAnimationFrame(draw);
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      gl.deleteBuffer(quad);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [reducedMotion]);

  return (
    <div className="overflow-hidden rounded-[26px] border border-white/14 bg-[#080b13]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 font-mono text-[11px] uppercase text-[#9aa3b8]">
        <span className="text-[#00d2ff]">● LIVE GLSL SDF RAYMARCHER</span>
        <span>DRAG / HOVER INSIDE VIEWPORT TO FUSE LIQUID ORBS</span>
      </div>
      <canvas
        ref={canvasRef}
        onPointerMove={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          pointerRef.current = {
            x: ((e.clientX - rect.left) / Math.max(1, rect.width)) * 2 - 1,
            y: -(((e.clientY - rect.top) / Math.max(1, rect.height)) * 2 - 1),
          };
        }}
        className="block aspect-[16/9] w-full cursor-crosshair"
        aria-label="Interactive raymarched liquid metaball shader study"
      />
    </div>
  );
}
