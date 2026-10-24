/**
 * Lusion Original Procedural GLSL Shaders
 * Written from first principles for Lusion Studio:
 * 1. Cauchy Optical Glass Dispersion Shader (Snell's Law 3-channel refraction + Schlick Fresnel + procedural studio environment)
 * 2. Curl-Noise Harmonic Particle Field Shader (GPU vertex advection + soft optical bokeh discs)
 * 3. Harmonic Satin Wave Ribbon Shader (Analytic multi-wave displacement + iridescent rim caustics)
 */

export const GLSL_NOISE_HEAD = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }
`;

export const OPTICAL_GLASS_VERTEX = /* glsl */ `
  ${GLSL_NOISE_HEAD}

  uniform float uTime;
  uniform float uTurbulence;
  uniform float uMorph;
  uniform vec2 uPointer;

  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying float vDisplacement;

  void main() {
    vec3 pos = position;
    vec3 nrm = normalize(normal);

    float slow = uTime * 0.42;
    float n1 = snoise(pos * (1.25 + uMorph * 0.8) + vec3(slow, -slow * 0.7, slow * 0.5));
    float n2 = snoise(pos * 2.7 - vec3(slow * 1.2, slow * 0.6, 0.0)) * 0.45;
    float pointerInfluence = dot(nrm.xy, uPointer) * 0.14;

    float disp = (n1 + n2) * uTurbulence * 0.28 + pointerInfluence;
    vDisplacement = disp;

    pos += nrm * disp;

    // Finite-difference tangent normal reconstruction for smooth liquid speculars
    float eps = 0.035;
    vec3 tangent = normalize(abs(nrm.x) > 0.9 ? cross(nrm, vec3(0.0, 1.0, 0.0)) : cross(nrm, vec3(1.0, 0.0, 0.0)));
    vec3 bitangent = cross(nrm, tangent);

    vec3 pT = position + tangent * eps;
    vec3 pB = position + bitangent * eps;
    float dT = (snoise(pT * (1.25 + uMorph * 0.8) + vec3(slow, -slow * 0.7, slow * 0.5))) * uTurbulence * 0.28;
    float dB = (snoise(pB * (1.25 + uMorph * 0.8) + vec3(slow, -slow * 0.7, slow * 0.5))) * uTurbulence * 0.28;

    pT += normalize(pT) * dT;
    pB += normalize(pB) * dB;

    vec3 displacedNormal = normalize(cross(pT - pos, pB - pos));
    vec4 worldPos = modelMatrix * vec4(pos, 1.0);

    vWorldNormal = normalize(mat3(modelMatrix) * mix(nrm, displacedNormal, 0.68));
    vViewDir = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`;

export const OPTICAL_GLASS_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uIor;
  uniform float uDispersion;
  uniform float uSurfaceIsLight;
  uniform vec3 uPrimaryColor;
  uniform vec3 uSecondaryColor;

  varying vec3 vWorldNormal;
  varying vec3 vViewDir;
  varying float vDisplacement;

  // Analytic procedural studio environment light probe (zero external HDR file needed)
  vec3 sampleStudioProbe(vec3 dir) {
    float up = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    vec3 darkSky = mix(vec3(0.025, 0.032, 0.065), vec3(0.11, 0.16, 0.36), up);
    vec3 lightSky = mix(vec3(0.68, 0.72, 0.84), vec3(0.96, 0.97, 1.0), up);
    vec3 base = mix(darkSky, lightSky, uSurfaceIsLight * 0.72);

    // Key overhead softbox strip
    float softbox1 = smoothstep(0.62, 0.96, dot(normalize(dir), normalize(vec3(-0.45, 0.78, 0.42))));
    // Rim ultramarine accent strip
    float softbox2 = smoothstep(0.50, 0.92, dot(normalize(dir), normalize(vec3(0.75, -0.18, 0.62))));
    // Counter spectral warm rim
    float softbox3 = smoothstep(0.68, 0.97, dot(normalize(dir), normalize(vec3(-0.72, -0.45, -0.5))));

    base += vec3(0.95, 0.97, 1.0) * softbox1 * 1.15;
    base += uPrimaryColor * softbox2 * 1.05;
    base += uSecondaryColor * softbox3 * 0.78;
    return base;
  }

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(vViewDir);

    // Snell's Law with Cauchy RGB dispersion spread
    float etaG = 1.0 / max(1.05, uIor);
    float spread = uDispersion * 0.095;

    vec3 refractR = refract(-V, N, etaG - spread);
    vec3 refractG = refract(-V, N, etaG);
    vec3 refractB = refract(-V, N, etaG + spread);

    vec3 col;
    col.r = sampleStudioProbe(refractR).r;
    col.g = sampleStudioProbe(refractG).g;
    col.b = sampleStudioProbe(refractB).b;

    // Schlick Fresnel reflection
    float cosTheta = clamp(dot(N, V), 0.0, 1.0);
    float f0 = pow((1.0 - uIor) / (1.0 + uIor), 2.0);
    float fresnel = f0 + (1.0 - f0) * pow(1.0 - cosTheta, 4.2);

    vec3 refl = reflect(-V, N);
    vec3 reflected = sampleStudioProbe(refl);

    // Crisp specular highlight
    vec3 keyLight = normalize(vec3(-0.5, 0.82, 0.55));
    vec3 halfVec = normalize(keyLight + V);
    float spec = pow(max(dot(N, halfVec), 0.0), 96.0);

    // Subsurface core glow modulated by vertex wave displacement
    vec3 coreTint = mix(uPrimaryColor, uSecondaryColor, clamp(vDisplacement * 2.4 + 0.5, 0.0, 1.0));
    col = mix(col * 0.92 + coreTint * 0.22, reflected, clamp(fresnel * 1.35, 0.0, 0.95));
    col += vec3(1.0) * spec * 1.25;

    gl_FragColor = vec4(col, 0.96);
  }
`;

export const RIBBON_WAVE_VERTEX = /* glsl */ `
  uniform float uTime;
  uniform float uScrollVelocity;
  uniform vec2 uPointer;

  varying vec2 vUv;
  varying float vWave;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float travel = uTime * 0.85;
    float w1 = sin(pos.x * 0.72 + travel) * cos(pos.y * 0.55 - travel * 0.65);
    float w2 = sin((pos.x * 0.42 - pos.y * 0.8) + travel * 1.35) * 0.5;
    float velBoost = 1.0 + min(abs(uScrollVelocity) * 0.0012, 1.35);

    float zLift = (w1 + w2) * 0.62 * velBoost + (uPointer.x * pos.x + uPointer.y * pos.y) * 0.08;
    pos.z += zLift;
    vWave = zLift;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

export const RIBBON_WAVE_FRAGMENT = /* glsl */ `
  uniform vec3 uColorA;
  uniform vec3 uColorB;
  uniform float uOpacity;
  uniform float uTime;

  varying vec2 vUv;
  varying float vWave;

  void main() {
    float linePattern = abs(fract(vUv.y * 26.0 - uTime * 0.12 + vWave * 0.28) - 0.5) * 2.0;
    float filament = smoothstep(0.76, 0.99, linePattern);

    float radialMask = smoothstep(0.5, 0.08, length(vUv - 0.5));
    vec3 tint = mix(uColorA, uColorB, clamp(vWave * 0.65 + 0.5, 0.0, 1.0));

    float alpha = filament * radialMask * uOpacity;
    if (alpha < 0.004) discard;

    gl_FragColor = vec4(tint, alpha);
  }
`;
