import * as THREE from "three";
import { Pass, FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** Native PreUfx (order 50) follows bloom (10) and final display (30).
 * Refract the completed image, never feed fracture coverage back into bloom.
 * The caller owns the scene, camera, meshes and their disposal; this pass owns
 * only its copy material/quad. No extra scene capture, clock or read/write alias.
 */
export class GoalReferenceOverlayPass extends Pass {
  private readonly copy = new THREE.ShaderMaterial({
    uniforms: { source: { value: null as THREE.Texture | null } },
    depthTest: false, depthWrite: false,
    vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
    fragmentShader: "varying vec2 vUv;uniform sampler2D source;void main(){gl_FragColor=vec4(texture2D(source,vUv).rgb,1.);}",
  });
  private readonly quad = new FullScreenQuad(this.copy);

  constructor(private readonly scene: THREE.Scene, private readonly camera: THREE.Camera,
    private readonly prepare: (texture: THREE.Texture, width: number, height: number) => void) {
    super();
    this.enabled = false;
  }

  render(renderer: THREE.WebGLRenderer, writeBuffer: THREE.WebGLRenderTarget, readBuffer: THREE.WebGLRenderTarget): void {
    const target = renderer.getRenderTarget(), autoClear = renderer.autoClear;
    try {
      this.prepare(readBuffer.texture, readBuffer.width, readBuffer.height);
      this.copy.uniforms.source.value = readBuffer.texture;
      renderer.setRenderTarget(this.renderToScreen ? null : writeBuffer);
      renderer.autoClear = false;
      this.quad.render(renderer);
      renderer.clear(false, true, true);
      renderer.render(this.scene, this.camera);
    } finally {
      renderer.autoClear = autoClear;
      renderer.setRenderTarget(target);
    }
  }

  dispose(): void { this.copy.dispose(); this.quad.dispose(); }
}
