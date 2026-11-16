import * as THREE from "three";
import { loadLusionBuf } from "@/lib/lusion-buf-loader";
import { casePlantVertex, casePlantFragment } from "./CaseStudyShaders";

const vertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const blur = `uniform sampler2D uTexture;uniform vec2 uDelta;varying vec2 vUv;
void main(){vec4 c=texture2D(uTexture,vUv)*.1633;
c+=(texture2D(uTexture,vUv-uDelta)+texture2D(uTexture,vUv+uDelta))*.1531;
c+=(texture2D(uTexture,vUv-uDelta*2.)+texture2D(uTexture,vUv+uDelta*2.))*.12245;
c+=(texture2D(uTexture,vUv-uDelta*3.)+texture2D(uTexture,vUv+uDelta*3.))*.0918;
c+=(texture2D(uTexture,vUv-uDelta*4.)+texture2D(uTexture,vUv+uDelta*4.))*.051;gl_FragColor=c;}`;

/** Inspected ProjectDetailsScreen pipeline: one RGB layer per depth, sequential
 * in-place 9-tap blur and channel capture. No RAF, listeners or global GL patches. */
export function createCaseStudyShadows(renderer: THREE.WebGLRenderer, wake: () => void) {
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .001, 50);
  camera.position.set(0, 0, 10); camera.lookAt(.2, 0, 0); camera.zoom = 2500;
  const raw = new THREE.WebGLRenderTarget(1, 1), result = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false });
  const intermediates = [1, .5, .75].map(() => new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false }));
  const quadGeometry = new THREE.PlaneGeometry(2, 2), postScene = new THREE.Scene(), postCamera = new THREE.Camera();
  const blurMaterial = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: blur, depthTest: false, depthWrite: false, toneMapped: false,
    uniforms: { uTexture: { value: raw.texture }, uDelta: { value: new THREE.Vector2() } },
  });
  const copyMaterial = new THREE.ShaderMaterial({ vertexShader: vertex, fragmentShader: `uniform sampler2D uTexture;varying vec2 vUv;void main(){gl_FragColor=texture2D(uTexture,vUv);}`,
    depthTest: false, depthWrite: false, toneMapped: false, uniforms: { uTexture: { value: raw.texture } },
  });
  const quad = new THREE.Mesh(quadGeometry, blurMaterial); postScene.add(quad);
  const plants: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [];
  let disposed = false, geometry: THREE.BufferGeometry | null = null, angle = 0, angleEased = 0;
  const follow = new THREE.Vector3();
  void loadLusionBuf("/assets/models/plant.buf").then(data => {
    if (disposed) return;
    geometry = data.geometry.clone(); geometry.computeBoundingBox(); const box = geometry.boundingBox!;
    const positions = [[-.55, -.8, -5], [-.75, -.8, 0], [-.45, -.8, 5]], rotations = [[0, -.2, -.2], [0, .2, -.5], [.3, .3, .1]];
    for (let i = 0; i < 3; i++) {
      const material = new THREE.ShaderMaterial({ vertexShader: casePlantVertex, fragmentShader: casePlantFragment, side: THREE.DoubleSide, toneMapped: false,
        uniforms: { u_time: { value: 0 }, u_delay: { value: [0, .2, .5][i] }, u_bbMin: { value: box.min }, u_bbMax: { value: box.max }, u_angleForce: { value: 0 }, u_mask: { value: new THREE.Vector3(i === 0 ? 1 : 0, i === 1 ? 1 : 0, i === 2 ? 1 : 0) } },
      });
      const mesh = new THREE.Mesh(geometry, material); mesh.position.fromArray(positions[i]); mesh.rotation.set(...rotations[i] as [number, number, number]);
      mesh.onBeforeRender = () => renderer.getContext().colorMask(i === 0, i === 1, i === 2, true);
      plants.push(mesh); scene.add(mesh);
    }
    wake();
  }).catch(() => { renderer.domElement.dataset.plant = "unavailable"; wake(); });
  return {
    texture: result.texture, view: camera.matrixWorldInverse,
    resize(width: number, height: number) {
      const size = renderer.getDrawingBufferSize(new THREE.Vector2());
      raw.setSize(Math.ceil(size.x * .75), Math.ceil(size.y * .75)); result.setSize(raw.width, raw.height);
      [1, .5, .75].forEach((scale, i) => intermediates[i].setSize(Math.ceil(raw.width * scale), Math.ceil(raw.height * scale)));
      camera.left = -width / 2; camera.right = width / 2; camera.top = height / 2; camera.bottom = -height / 2; camera.updateProjectionMatrix();
    },
    render(time: number, dt: number, scrollDelta: number, pointerX: number, pointerY: number, reduced: boolean) {
      if (disposed) return;
      follow.set(-.1 + pointerX * .03, .1 + pointerY * .015, 10);
      camera.position.lerp(follow, reduced ? 1 : Math.min(1, 4 * dt)); camera.lookAt(-.1, 0, 0); camera.updateMatrixWorld();
      angle += Math.abs(scrollDelta); angleEased += (angle - angleEased) * .02;
      plants.forEach(mesh => { mesh.material.uniforms.u_time.value = reduced ? 0 : time; mesh.material.uniforms.u_angleForce.value = reduced ? 0 : THREE.MathUtils.clamp(angle - angleEased, -1, 1); });
      const gl = renderer.getContext(), autoClear = renderer.autoClear;
      renderer.autoClear = false;
      try {
        gl.colorMask(true, true, true, true);
        renderer.setRenderTarget(raw); renderer.clear(); renderer.render(scene, camera); gl.colorMask(true, true, true, true);
        renderer.setRenderTarget(result); renderer.clear();
        // Each blur writes BACK to raw, as the native Blur helper does. The green
        // and blue snapshots therefore include earlier blur stages, not three
        // independent copies or one combined max-channel blur.
        for (let i = 0; i < 3; i++) {
          const intermediate = intermediates[i], radius = i === 0 ? 2 : 4;
          quad.material = blurMaterial; blurMaterial.uniforms.uTexture.value = raw.texture;
          (blurMaterial.uniforms.uDelta.value as THREE.Vector2).set(radius / intermediate.width * .25, 0);
          renderer.setRenderTarget(intermediate); renderer.render(postScene, postCamera);
          blurMaterial.uniforms.uTexture.value = intermediate.texture;
          (blurMaterial.uniforms.uDelta.value as THREE.Vector2).set(0, radius / intermediate.height * .25);
          renderer.setRenderTarget(raw); renderer.render(postScene, postCamera);
          quad.material = copyMaterial; renderer.setRenderTarget(result);
          gl.colorMask(i === 0, i === 1, i === 2, false); renderer.render(postScene, postCamera); gl.colorMask(true, true, true, true);
        }
      } finally { gl.colorMask(true, true, true, true); renderer.autoClear = autoClear; }
      renderer.domElement.dataset.plant = plants.length ? "ready" : (renderer.domElement.dataset.plant || "loading");
      renderer.domElement.dataset.shadowPipeline = "native-rgb-projected";
    },
    dispose() {
      if (disposed) return; disposed = true; plants.forEach(mesh => mesh.material.dispose()); geometry?.dispose(); raw.dispose(); result.dispose(); intermediates.forEach(rt => rt.dispose()); quadGeometry.dispose(); blurMaterial.dispose(); copyMaterial.dispose();
    },
  };
}
