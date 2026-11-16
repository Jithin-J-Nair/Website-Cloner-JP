import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";
import { bloomHighPass, bloomFft, bloomKernel, bloomMultiply } from "./GoalReferenceShaders";

const vertexShader = `varying vec2 v_uv; void main(){v_uv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
/** Source convolution bloom, including its eight-ray diffraction kernel and
 * RGB-separated halo. Kept separate from the earlier emergence's color pipeline.
 * Input alpha is light-selection data; only the final display is made opaque. */
export class GoalReferenceBloomPass extends Pass {
  amount = 6;
  saturation = 1;
  haloStrength = 0;
  private dirty = true;
  // The original scene/feedback targets are RGBA8, even though FFT scratch is
  // float. This boundary is essential: unclamped HDR feedback runs away, while
  // alpha > 1 turns late-stage diffraction into a saturated magenta flood.
  private readonly cache = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, type: THREE.UnsignedByteType });
  private readonly source = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, type: THREE.UnsignedByteType });
  private readonly targets = Array.from({ length: 4 }, () => new THREE.WebGLRenderTarget(1, 1, {
    type: THREE.FloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
    wrapS: THREE.RepeatWrapping, wrapT: THREE.RepeatWrapping,
  }));
  private readonly high = new THREE.ShaderMaterial({ vertexShader, fragmentShader: bloomHighPass,
    defines: { USE_HALO: 1, USE_CONVOLUTION: 1 }, depthTest: false, depthWrite: false,
    uniforms: {
      u_texture: { value: null }, u_luminosityThreshold: { value: 0 }, u_smoothWidth: { value: 0 }, u_amount: { value: 1 },
      u_texelSize: { value: new THREE.Vector2() }, u_aspect: { value: new THREE.Vector2() },
      u_haloWidth: { value: .6 }, u_haloRGBShift: { value: .02 }, u_haloStrength: { value: 0 },
      u_haloMaskInner: { value: .3 }, u_haloMaskOuter: { value: .5 }, u_convolutionBuffer: { value: .1 },
    },
  });
  private readonly kernel = new THREE.ShaderMaterial({ vertexShader, fragmentShader: bloomKernel,
    uniforms: { u_aspect: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false });
  private readonly fftUniforms = {
    u_texture: { value: null as THREE.Texture | null }, u_texelSize: { value: new THREE.Vector2() },
    u_subtransformSize: { value: 2 }, u_normalization: { value: 1 }, u_isForward: { value: true },
  };
  private readonly fftH = new THREE.ShaderMaterial({ vertexShader, fragmentShader: bloomFft,
    uniforms: this.fftUniforms, defines: { HORIZTONAL: 1 }, depthTest: false, depthWrite: false });
  private readonly fftV = new THREE.ShaderMaterial({ vertexShader, fragmentShader: bloomFft,
    uniforms: this.fftUniforms, depthTest: false, depthWrite: false });
  private readonly multiply = new THREE.ShaderMaterial({ vertexShader, fragmentShader: bloomMultiply,
    uniforms: { u_texture: { value: null }, u_kernelTexture: { value: null } }, depthTest: false, depthWrite: false });
  private readonly display = new THREE.ShaderMaterial({ vertexShader, depthTest: false, depthWrite: false,
    uniforms: { u_texture: { value: null }, u_bloom: { value: null }, u_amount: { value: 0 }, u_saturation: { value: 1 } },
    fragmentShader: `varying vec2 v_uv;uniform sampler2D u_texture;uniform sampler2D u_bloom;
      void main(){gl_FragColor=vec4(texture2D(u_texture,v_uv).rgb+texture2D(u_bloom,(v_uv-.5)/1.1+.5).rgb,1.);}`,
  });
  private readonly quad = new FullScreenQuad();

  override setSize(width: number, height: number) {
    this.source.setSize(width, height);
    const w = Math.max(2, THREE.MathUtils.ceilPowerOfTwo(width / 2) / 2);
    const h = Math.max(2, THREE.MathUtils.ceilPowerOfTwo(height / 2) / 2);
    for (const target of this.targets) if (target.width !== w || target.height !== h) { target.setSize(w, h); this.dirty = true; }
    this.cache.setSize(w, h);
    this.kernel.uniforms.u_aspect.value.set(width / Math.max(width, height), height / Math.max(width, height));
    this.high.uniforms.u_texelSize.value.set(1 / width, 1 / height);
    this.high.uniforms.u_aspect.value.set(2 * width / Math.hypot(width, height), 2 * height / Math.hypot(width, height));
    this.high.uniforms.u_haloRGBShift.value = .02 * width;
    this.dirty = true;
  }
  private draw(renderer: THREE.WebGLRenderer, material: THREE.ShaderMaterial, target: THREE.WebGLRenderTarget | null) {
    this.quad.material = material; renderer.setRenderTarget(target); this.quad.render(renderer);
  }
  /** Stockham autosort FFT. Every butterfly reads one target and writes another;
   * the kernel target is never used as ping-pong scratch. Unitary normalization
   * in each direction matches the source packed RG/BA complex transform. */
  private transform(renderer: THREE.WebGLRenderer, input: THREE.WebGLRenderTarget, scratch: THREE.WebGLRenderTarget, forward: boolean) {
    const nx = Math.round(Math.log2(input.width)), ny = Math.round(Math.log2(input.height));
    const u = this.fftUniforms;
    u.u_texelSize.value.set(1 / input.width, 1 / input.height); u.u_isForward.value = forward;
    for (let stage = 0; stage < nx + ny; stage++) {
      u.u_texture.value = input.texture; u.u_normalization.value = stage === 0 ? 1 / Math.sqrt(input.width * input.height) : 1;
      u.u_subtransformSize.value = 2 ** ((stage < nx ? stage : stage - nx) + 1);
      this.draw(renderer, stage < nx ? this.fftH : this.fftV, scratch);
      [input, scratch] = [scratch, input];
    }
    return { result: input, scratch };
  }
  override render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget) {
    const [a, b, kernelTarget, spare] = this.targets;
    const previousTarget = renderer.getRenderTarget(), autoClear = renderer.autoClear;
    try {
      renderer.autoClear = false;
      this.copy.uniforms.map.value = readBuffer.texture; this.draw(renderer, this.copy, this.source);
      if (this.dirty) {
        this.draw(renderer, this.kernel, a);
        const fft = this.transform(renderer, a, b, true);
        // Copy into dedicated storage; avoid aliasing the scratch targets on
        // rectangular dimensions (odd total FFT stages) as well as square ones.
        // Preserve all four packed complex channels.
        this.quad.material = this.copy;
        this.copy.uniforms.map.value = fft.result.texture; renderer.setRenderTarget(kernelTarget); this.quad.render(renderer);
        this.dirty = false;
      }
      this.high.uniforms.u_texture.value = this.source.texture; this.high.uniforms.u_haloStrength.value = this.haloStrength;
      this.draw(renderer, this.high, a);
      const forward = this.transform(renderer, a, b, true);
      this.multiply.uniforms.u_texture.value = forward.result.texture; this.multiply.uniforms.u_kernelTexture.value = kernelTarget.texture;
      this.draw(renderer, this.multiply, spare);
      const inverse = this.transform(renderer, spare, forward.scratch, false);
      // Match the archived gain, which depends on log2 of FFT area, not dimensions.
      const gain = this.amount * 1024 / Math.ceil(Math.log2(a.width * a.height)) ** 4 * .85;
      this.cacheMaterial.uniforms.u_texture.value = inverse.result.texture;
      this.cacheMaterial.uniforms.u_amount.value = gain; this.cacheMaterial.uniforms.u_saturation.value = this.saturation;
      this.draw(renderer, this.cacheMaterial, this.cache);
      this.display.uniforms.u_texture.value = this.source.texture; this.display.uniforms.u_bloom.value = this.cache.texture;
      this.draw(renderer, this.display, this.renderToScreen ? null : writeBuffer);
    } finally { renderer.autoClear = autoClear; renderer.setRenderTarget(previousTarget); }
  }
  private readonly copy = new THREE.ShaderMaterial({ vertexShader, depthTest: false, depthWrite: false,
    uniforms: { map: { value: null } }, fragmentShader: `varying vec2 v_uv;uniform sampler2D map;void main(){gl_FragColor=texture2D(map,v_uv);}` });
  private readonly cacheMaterial = new THREE.ShaderMaterial({ vertexShader, depthTest: false, depthWrite: false,
    uniforms: { u_texture: { value: null }, u_amount: { value: 0 }, u_saturation: { value: 1 } },
    fragmentShader: `varying vec2 v_uv;uniform sampler2D u_texture;uniform float u_amount;uniform float u_saturation;
      void main(){vec3 c=texture2D(u_texture,v_uv).rgb*u_amount;gl_FragColor=vec4(mix(vec3(dot(c,vec3(.299,.587,.114))),c,u_saturation),1.);}` });
  override dispose() {
    this.cache.dispose(); this.source.dispose();
    for (const target of this.targets) target.dispose();
    for (const material of [this.high, this.kernel, this.fftH, this.fftV, this.multiply, this.display, this.copy, this.cacheMaterial]) material.dispose();
    this.quad.dispose();
  }
}
