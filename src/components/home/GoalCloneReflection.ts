import * as THREE from "three";
import { FullScreenQuad } from "three/addons/postprocessing/Pass.js";

/** Native astronaut environment: copy feedback to half-size power-of-two RGBA8,
 * then separable radius-16 and radius-4 filters with half-size intermediates.
 * Raw feedback gives the additive suits sparkling/cropped neon pixels instead
 * of the broad reflected light in the reference. No scene capture or new RAF.
 */
export function createGoalCloneReflection(track: <T extends { dispose: () => void }>(resource: T) => T) {
  const target = track(new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }));
  const intermediate = track(new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }));
  const uniforms = { u_texture: { value: null as THREE.Texture | null }, u_delta: { value: new THREE.Vector2() } };
  const vertexShader = "varying vec2 v_uv;void main(){v_uv=uv;gl_Position=vec4(position.xy,0.,1.);}";
  const copy = track(new THREE.ShaderMaterial({ uniforms, vertexShader, depthTest: false, depthWrite: false,
    fragmentShader: "uniform sampler2D u_texture;varying vec2 v_uv;void main(){gl_FragColor=texture2D(u_texture,v_uv);}" }));
  const blur = track(new THREE.ShaderMaterial({ uniforms, vertexShader, depthTest: false, depthWrite: false,
    fragmentShader: `uniform sampler2D u_texture;uniform vec2 u_delta;varying vec2 v_uv;
      void main(){vec4 color=texture2D(u_texture,v_uv)*.1633;
        color+=(texture2D(u_texture,v_uv-u_delta)+texture2D(u_texture,v_uv+u_delta))*.1531;
        color+=(texture2D(u_texture,v_uv-2.*u_delta)+texture2D(u_texture,v_uv+2.*u_delta))*.12245;
        color+=(texture2D(u_texture,v_uv-3.*u_delta)+texture2D(u_texture,v_uv+3.*u_delta))*.0918;
        color+=(texture2D(u_texture,v_uv-4.*u_delta)+texture2D(u_texture,v_uv+4.*u_delta))*.051;
        gl_FragColor=color;}` }));
  const quad = new FullScreenQuad(copy);
  track({ dispose: () => quad.dispose() });
  const size = new THREE.Vector2();
  return {
    texture: target.texture,
    render(renderer: THREE.WebGLRenderer, source: THREE.Texture) {
      renderer.getDrawingBufferSize(size);
      const width = Math.max(2, THREE.MathUtils.floorPowerOfTwo(Math.ceil(size.x * .25) * 2));
      const height = Math.max(2, THREE.MathUtils.floorPowerOfTwo(Math.ceil(size.y * .25) * 2));
      if (target.width !== width || target.height !== height) {
        target.setSize(width, height); intermediate.setSize(width / 2, height / 2);
      }
      const previous = renderer.getRenderTarget(), autoClear = renderer.autoClear;
      try {
        renderer.autoClear = false;
        quad.material = copy; uniforms.u_texture.value = source;
        renderer.setRenderTarget(target); quad.render(renderer);
        quad.material = blur;
        for (const radius of [16, 4]) {
          uniforms.u_texture.value = target.texture; uniforms.u_delta.value.set(radius / intermediate.width * .25, 0);
          renderer.setRenderTarget(intermediate); quad.render(renderer);
          uniforms.u_texture.value = intermediate.texture; uniforms.u_delta.value.set(0, radius / intermediate.height * .25);
          renderer.setRenderTarget(target); quad.render(renderer);
        }
      } finally {
        renderer.setRenderTarget(previous); renderer.autoClear = autoClear;
      }
    },
  };
}
