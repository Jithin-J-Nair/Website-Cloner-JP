import * as THREE from "three";

export const RadialSpeedBlurShader = {
  uniforms: {
    tDiffuse: { value: null },
    uCenter: { value: new THREE.Vector2(0.5, 0.5) },
    uSpeed: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform vec2 uCenter; uniform float uSpeed; varying vec2 vUv;
    void main(){
      vec2 dir = (vUv - uCenter);
      float len = length(dir);
      vec3 sum = vec3(0.0); float wsum = 0.0;
      for (int i = 0; i < 10; i++) {
        float f = float(i) / 9.0;
        float w = 1.0 - f * 0.6;
        sum += texture2D(tDiffuse, vUv - dir * f * uSpeed * 0.06 * smoothstep(0.05, 0.6, len)).rgb * w;
        wsum += w;
      }
      gl_FragColor = vec4(sum / wsum, 1.0);
    }
  `
};

export const ChromaticAberrationShader = {
  uniforms: {
    tDiffuse: { value: null },
    uAmount: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uAmount; varying vec2 vUv;
    void main() {
      vec2 dir = vUv - 0.5;
      float d = length(dir);
      vec2 offset = dir * (uAmount * d);
      float r = texture2D(tDiffuse, vUv + offset).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - offset).b;
      gl_FragColor = vec4(r, g, b, 1.0);
    }
  `
};

export const VignetteGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uGrain: { value: 0.04 },
    uTime: { value: 0.0 },
  },
  vertexShader: `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float uGrain; uniform float uTime; varying vec2 vUv;
    float rand(vec2 co){ return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453); }
    void main() {
      vec4 tex = texture2D(tDiffuse, vUv);
      vec2 p = vUv * 2.0 - 1.0;
      float len = length(p);
      float vignette = smoothstep(1.5, 0.5, len);
      float noise = (rand(vUv + uTime) - 0.5) * uGrain;
      gl_FragColor = vec4(tex.rgb * vignette + noise, tex.a);
    }
  `
};
