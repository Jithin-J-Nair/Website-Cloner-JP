import * as THREE from "three";

/**
 * Video-backed replacement for the original particle plume.
 * The source clip is keyed in the fragment shader so its grey studio backdrop
 * disappears into the scene while the dark glass forms and their highlights stay.
 * Scroll uniforms intentionally retain the legacy plume contract.
 */
export function createAboutPlume(_count: number) {
  const group = new THREE.Group();
  const video = document.createElement("video");
  video.src = "/videos/about-plume.mp4";
  video.crossOrigin = "anonymous";
  video.muted = true;
  video.defaultMuted = true;
  video.loop = true;
  video.autoplay = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("playsinline", "");
  video.setAttribute("muted", "");
  video.setAttribute("aria-hidden", "true");

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const uniforms = {
    uMap: { value: texture },
    uTime: { value: 0 },
    uCompact: { value: 0 },
    uMobile: { value: 0 },
    uPointer: { value: new THREE.Vector3(0, 8.65, 0) },
    uPointerStrength: { value: 0 },
    uOpacity: { value: 1 },
    uCyanBoost: { value: 0 },
    uPixelRatio: { value: 1 },
  };

  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    vertexShader: `
      uniform float uCompact;
      varying vec2 vUv;
      void main() {
        vUv = uv;
        vec3 p = position;
        // Keep the same scroll-driven contraction as the previous plume:
        // broad opening volume -> compact suspended cluster on pullback.
        float sx = mix(1.0, .74, uCompact);
        float sy = mix(1.0, .78, uCompact);
        p.x *= sx;
        p.y *= sy;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform float uOpacity;
      uniform float uCyanBoost;
      uniform float uMobile;
      varying vec2 vUv;
      void main() {
        vec4 sampleColor = texture2D(uMap, vUv);
        // Pexels source is monochrome on a mid-grey field. Remove that field
        // by keying its middle luminance range; preserve dark glass and bright
        // specular rims. Soft thresholds avoid a hard cutout around bubbles.
        float luma = dot(sampleColor.rgb, vec3(.2126, .7152, .0722));
        float body = 1.0 - smoothstep(.17, .39, luma);
        float highlight = smoothstep(.76, .94, luma) * .42;
        float alpha = max(body, highlight);
        alpha *= smoothstep(.045, .14, luma + body * .10);
        // Lift the near-black glass just enough to read against the charcoal
        // environment, with a restrained cool edge rather than a grey rectangle.
        float rim = smoothstep(.24, .52, luma) * (1.0 - smoothstep(.56, .82, luma));
        vec3 glass = vec3(.40, .45, .48) + vec3(.06, .20, .23) * uCyanBoost;
        vec3 color = mix(glass, vec3(.76, .84, .87), highlight);
        color += vec3(.015, .055, .065) * rim;
        gl_FragColor = vec4(color, alpha * uOpacity * .88);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });

  const geometry = new THREE.PlaneGeometry(13.2, 7.425, 1, 1);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-.35, 8.4, 0);
  mesh.renderOrder = 1;
  mesh.frustumCulled = false;
  group.add(mesh);

  const startPlayback = () => {
    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      void video.play().catch(() => undefined);
    }
  };
  video.addEventListener("loadeddata", startPlayback);
  const playPromise = video.play();
  if (playPromise) void playPromise.catch(() => undefined);

  return {
    group,
    material,
    count: 1,
    dispose() {
      video.pause();
      video.removeEventListener("loadeddata", startPlayback);
      video.removeAttribute("src");
      video.load();
      texture.dispose();
      geometry.dispose();
      material.dispose();
    },
  };
}
