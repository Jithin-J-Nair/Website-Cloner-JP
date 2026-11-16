import * as THREE from "three";
import { aboutMotionBlurFragment } from "./about-reference-shaders";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { CopyShader } from "three/examples/jsm/shaders/CopyShader.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

/** About-only HDR bloom, sharing the existing renderer/camera/RAF. No OutputPass:
 * reference materials already produce display values; an extra sRGB/ACES pass
 * would wash out the baked terrain and change every silver grain's contrast. */
export function createAboutScenePost(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.PerspectiveCamera, overlay: THREE.Scene, renderMotion: (camera: THREE.PerspectiveCamera, target: THREE.WebGLRenderTarget) => void) {
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, depthBuffer: true, stencilBuffer: false });
  const composer = new EffectComposer(renderer, target);
  const render = new RenderPass(scene, camera);
  const velocity = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter, depthBuffer: true });
  const motion = new ShaderPass({ uniforms: { tDiffuse: { value: null }, u_motionTexture: { value: null }, u_blurRatio: { value: 1 } },
    vertexShader: `varying vec2 v_uv;void main(){v_uv=uv;gl_Position=vec4(position.xy,0.,1.);}`,
    fragmentShader: aboutMotionBlurFragment.replace("#include <getBlueNoise>", `vec3 getBlueNoise(vec2 p){return fract(sin(vec3(dot(p,vec2(12.9898,78.233)),dot(p,vec2(39.346,11.135)),dot(p,vec2(73.156,52.235))))*43758.5453);}`),
  });
  // ShaderPass clones its initial uniforms. Render-target textures cannot be
  // cloned: bind the live velocity attachment AFTER construction, or the blur
  // samples black and creates constant diagonal streaks across the whole frame.
  motion.uniforms.u_motionTexture.value = velocity.texture;
  const bloom = new UnrealBloomPass(new THREE.Vector2(1, 1), 2.2, .25, .72);
  bloom.materialHighPassFilter.fragmentShader = bloom.materialHighPassFilter.fragmentShader.replace("float v = luminance( texel.xyz );", "float v = luminance( texel.xyz ) * clamp(texel.a,0.,1.);");
  // Intermediate alpha encodes emission (ground specular, zero for the person
  // and sky), not scene coverage. Never copy it into the browser's drawing
  // buffer: compositors/readbacks can interpret it as opacity and punch black
  // holes through otherwise valid RGB. Keep that mask for bloom, then publish
  // an opaque image without changing its radiance or adding color conversion.
  const copy = new ShaderPass({ name: "AboutOpaqueOutput", uniforms: { tDiffuse: { value: null } },
    vertexShader: CopyShader.vertexShader,
    fragmentShader: `uniform sampler2D tDiffuse;varying vec2 vUv;
      void main(){gl_FragColor=vec4(texture2D(tDiffuse,vUv).rgb,1.);}`,
  });
  copy.material.depthTest = false; copy.material.depthWrite = false; copy.material.blending = THREE.NoBlending;
  composer.addPass(render); composer.addPass(motion); composer.addPass(bloom); composer.addPass(copy);
  let disposed = false;
  return {
    resize(width: number, height: number, dpr: number) { composer.setPixelRatio(dpr); composer.setSize(width, height); velocity.setSize(Math.max(1, Math.floor(width * dpr / 4)), Math.max(1, Math.floor(height * dpr / 4))); },
    render(u: number) {
      const intro = THREE.MathUtils.clamp(u / 5.25, 0, 1);
      motion.uniforms.u_blurRatio.value = intro < .1 ? THREE.MathUtils.lerp(1, 1.5, intro / .1) : THREE.MathUtils.lerp(1.5, 0, THREE.MathUtils.clamp((intro - .1) / .05, 0, 1));
      motion.enabled = motion.uniforms.u_blurRatio.value > .001;
      if (motion.enabled) renderMotion(camera, velocity);
      const fall = THREE.MathUtils.smoothstep(intro, .1, .85);
      const hud = THREE.MathUtils.smoothstep(u, 5.25, 6.125);
      bloom.strength = THREE.MathUtils.lerp(2.8, 1.5, fall) * (1 - hud);
      // No bloom/pipeline color changes on the later portrait HUD.
      if (hud > .999) renderer.render(scene, camera); else composer.render();
      // The logo is post-effects geometry in the reference. Feeding its white
      // silhouette through bloom produces an enormous, incorrect white flare.
      const auto = renderer.autoClear;
      try { renderer.autoClear = false; renderer.render(overlay, camera); } finally { renderer.autoClear = auto; }
    },
    velocityBackground() {
      if (motion.uniforms.u_motionTexture.value !== velocity.texture) throw new Error("Detached About velocity sampler");
      const pixel = new Uint8Array(4), samples: number[] = [];
      for (const [x, y] of [[0, 0], [velocity.width - 1, 0], [0, velocity.height - 1], [velocity.width - 1, velocity.height - 1]]) {
        renderer.readRenderTargetPixels(velocity, x, y, 1, 1, pixel); samples.push(...pixel);
      }
      return samples;
    },
    dispose() { if (disposed) return; disposed = true; render.dispose(); motion.dispose(); velocity.dispose(); bloom.dispose(); copy.dispose(); composer.dispose(); },
  };
}
