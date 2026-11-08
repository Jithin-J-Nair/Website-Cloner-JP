import * as THREE from "three";
import { EXRLoader } from "three/examples/jsm/loaders/EXRLoader.js";
import { loadLusionBuf } from "@/lib/lusion-buf-loader";
import { createHollowCrossGeometry } from "./HollowCrossGeometry";
import { HOME_NATIVE_MATERIALS, HomeNativePhysics } from "@/lib/home-native-physics";
import { homeRenderDpr } from "@/lib/home-motion";
import { nativeHeroVertex, nativeHeroFragment } from "./NativeHeroShaders";

/** Native colors are stored as raw RGB (the archived renderer disabled color
 * management). Never change THREE.ColorManagement globally: other scenes depend
 * on their existing linear/sRGB policy. These programs already output filmic RGB. */
const rawColor = (hex: string) => new THREE.Color().setStyle(hex, THREE.LinearSRGBColorSpace);
const screenVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
const copyFragment = `uniform sampler2D uTexture;varying vec2 vUv;void main(){gl_FragColor=vec4(texture2D(uTexture,vUv).rgb,1.);}`;
const blurFragment = `uniform sampler2D uTexture;uniform vec2 uDelta;varying vec2 vUv;void main(){vec4 c=texture2D(uTexture,vUv)*.227027027; c+=texture2D(uTexture,vUv+uDelta*1.384615385)*.316216216; c+=texture2D(uTexture,vUv-uDelta*1.384615385)*.316216216; c+=texture2D(uTexture,vUv+uDelta*3.230769231)*.070270270; c+=texture2D(uTexture,vUv-uDelta*3.230769231)*.070270270;gl_FragColor=c;}`;

/** No RAF/scroll ownership. The React owner supplies one visible-time clock. */
export function createNativeHeroScene(canvas: HTMLCanvasElement, mobile: boolean, wake: () => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: false, antialias: false, powerPreference: "high-performance" });
  renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.toneMapping = THREE.NoToneMapping; renderer.setClearColor(0x141515, 1);
  const gl = renderer.getContext(), debug = gl.getExtension("WEBGL_debug_renderer_info");
  const software = /swiftshader|llvmpipe|software/i.test(String(debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)));
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(18, 1, .01, 100);
  const physics = new HomeNativePhysics(mobile), raycaster = new THREE.Raycaster(), pointer = new THREE.Vector2();
  const quadGeometry = new THREE.PlaneGeometry(2, 2), copyScene = new THREE.Scene(), copyCamera = new THREE.Camera();
  const copyMaterial = new THREE.ShaderMaterial({ vertexShader: screenVertex, fragmentShader: copyFragment, uniforms: { uTexture: { value: null } }, depthTest: false, depthWrite: false, toneMapped: false });
  const blurMaterial = new THREE.ShaderMaterial({ vertexShader: screenVertex, fragmentShader: blurFragment, uniforms: { uTexture: { value: null }, uDelta: { value: new THREE.Vector2() } }, depthTest: false, depthWrite: false, toneMapped: false });
  const quad = new THREE.Mesh(quadGeometry, copyMaterial); quad.frustumCulled = false; copyScene.add(quad);
  const target = () => new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  const main = new THREE.WebGLRenderTarget(1, 1, { depthBuffer: true }), cache = target(), blurTargets = [target(), target(), target(), target()], blurInter = [target(), target(), target(), target()];
  const matcapFallback = new THREE.DataTexture(new Uint8Array([180, 50, 160, 255]), 1, 1); matcapFallback.needsUpdate = true;
  const noiseFallback = new THREE.DataTexture(new Uint8Array([128, 128, 128, 255]), 1, 1); noiseFallback.needsUpdate = true;
  const matcapUniform = { value: matcapFallback as THREE.Texture }, noiseUniform = { value: noiseFallback as THREE.Texture }, noiseOffset = { value: new THREE.Vector2() };
  const lightUniform = { value: new THREE.Vector3(10, 10, 5) }, textureSizes = blurTargets.map(() => new THREE.Vector2(1, 1));
  let disposed = false, loadedGeometry: THREE.BufferGeometry | null = null, loadedMatcap: THREE.Texture | null = null, loadedNoise: THREE.Texture | null = null;
  let width = 1, height = 1, viewportHeight = 1, firstFrame = true;
  const geometry = createHollowCrossGeometry(mobile ? 32 : 48);
  const count = geometry.getAttribute("position").count;
  geometry.setAttribute("ao", new THREE.BufferAttribute(new Float32Array(count).fill(1), 1));
  geometry.setAttribute("thickness", new THREE.BufferAttribute(new Float32Array(count), 1));
  geometry.setAttribute("SN", geometry.getAttribute("normal").clone());
  geometry.setAttribute("daoN", new THREE.BufferAttribute(new Float32Array(count * 3).fill(.333333), 3));
  geometry.setAttribute("daoP", new THREE.BufferAttribute(new Float32Array(count * 3).fill(.333333), 3));
  const materials: THREE.ShaderMaterial[] = [], meshes: THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial>[] = [], backs: (THREE.Mesh<THREE.BufferGeometry, THREE.ShaderMaterial> | null)[] = [];
  const glassCount = mobile ? 0 : 2;
  const blit = (texture: THREE.Texture, destination: THREE.WebGLRenderTarget | null) => { quad.material = copyMaterial; copyMaterial.uniforms.uTexture.value = texture; renderer.setRenderTarget(destination); renderer.render(copyScene, copyCamera); };
  const capture = (front: boolean) => {
    blit(main.texture, cache);
    if (front) {
      let source: THREE.Texture = cache.texture;
      for (let i = 0; i < 4; i++) {
        quad.material = blurMaterial; blurMaterial.uniforms.uTexture.value = source;
        (blurMaterial.uniforms.uDelta.value as THREE.Vector2).set(6 / blurInter[i].width * .25, 0);
        renderer.setRenderTarget(blurInter[i]); renderer.render(copyScene, copyCamera);
        blurMaterial.uniforms.uTexture.value = blurInter[i].texture;
        (blurMaterial.uniforms.uDelta.value as THREE.Vector2).set(0, 6 / blurInter[i].height * .25);
        renderer.setRenderTarget(blurTargets[i]); renderer.render(copyScene, copyCamera); source = blurTargets[i].texture;
      }
    }
    renderer.setRenderTarget(main);
  };
  for (let i = 0; i < physics.bodies.length; i++) {
    const kind = HOME_NATIVE_MATERIALS[i], glass = kind.endsWith("glass"), colour = rawColor(kind.startsWith("blue") ? "#061dfb" : kind.startsWith("white") ? glass ? "#eeeeee" : "#ffffff" : "#111111");
    if (kind === "blue-glass") colour.offsetHSL(0, 0, .3);
    const neighbours = physics.bodies.filter((_, j) => j !== i);
    const uniforms = {
      u_color: { value: colour }, u_bgColor: { value: rawColor("#141515") }, u_sssColor: { value: rawColor("#111111") }, u_sss: { value: 0 },
      u_matcap: matcapUniform, u_lightPosition: lightUniform, u_roughness: { value: kind.endsWith("gloss") ? .1 : .8 },
      u_selfPositionRadius: { value: new THREE.Vector4() }, u_selfRotation: { value: new THREE.Quaternion() }, u_time: { value: 0 },
      u_nearPositionRadiusList: { value: neighbours.map(() => new THREE.Vector4()) }, u_nearRotationList: { value: neighbours.map(() => new THREE.Quaternion()) },
      u_nearColorList: { value: neighbours.map(() => new THREE.Color()) }, u_nearTransparencyLumaList: { value: neighbours.map(() => new THREE.Vector2()) },
      u_blueNoiseTexture: noiseUniform, u_blueNoiseTexelSize: { value: new THREE.Vector2(1 / 128, 1 / 128) }, u_blueNoiseCoordOffset: noiseOffset,
      u_sceneTexture: { value: cache.texture }, u_blurredTextures: { value: blurTargets.map(t => t.texture) }, u_blurredTextureSizes: { value: textureSizes },
    };
    const material = new THREE.ShaderMaterial({ uniforms, vertexShader: nativeHeroVertex, fragmentShader: nativeHeroFragment, defines: { NEIGHBOUR_COUNT: physics.bodies.length - 1, ...(glass ? { IS_SEMITRANSPARENT: 1 } : {}) }, toneMapped: false });
    const mesh = new THREE.Mesh(geometry, material); mesh.frustumCulled = false; scene.add(mesh); meshes.push(mesh); materials.push(material);
    if (glass) {
      mesh.onBeforeRender = () => capture(true);
      const backMaterial = new THREE.ShaderMaterial({ uniforms, vertexShader: nativeHeroVertex, fragmentShader: nativeHeroFragment, defines: { NEIGHBOUR_COUNT: physics.bodies.length - 1, IS_SEMITRANSPARENT_BACK: 1 }, side: THREE.BackSide, toneMapped: false });
      const back = new THREE.Mesh(geometry, backMaterial); back.frustumCulled = false; back.onBeforeRender = () => capture(false); scene.add(back); backs.push(back); materials.push(backMaterial);
    } else backs.push(null);
  }
  const backgroundMaterial = new THREE.ShaderMaterial({ vertexShader: screenVertex, fragmentShader: `uniform sampler2D uNoise;uniform vec2 uNoiseOffset;uniform float uAspect;varying vec2 vUv;void main(){vec3 n=texture2D(uNoise,gl_FragCoord.xy/128.+uNoiseOffset).rgb;vec2 q=vUv-.5;q.x*=uAspect;vec3 c=mix(vec3(6.,29.,251.)/255.,vec3(20.,21.,21.)/255.,.925+.075*smoothstep(0.,1.,length(q)));gl_FragColor=vec4(c+n*.004,1.);}`, uniforms: { uNoise: noiseUniform, uNoiseOffset: noiseOffset, uAspect: { value: 1 } }, depthWrite: false, depthTest: false, toneMapped: false });
  const background = new THREE.Mesh(quadGeometry, backgroundMaterial); background.renderOrder = -1000; background.frustumCulled = false; scene.add(background);
  const assetFlags = { geometry: false, matcap: false, noise: false }, settled = { geometry: false, matcap: false, noise: false };
  void loadLusionBuf(`/assets/models/home/${mobile ? "cross_ld" : "cross"}.buf`).then(({ geometry: data }) => { if (disposed) return; loadedGeometry = data.clone(); meshes.forEach((mesh, i) => { mesh.geometry = loadedGeometry!; if (backs[i]) backs[i]!.geometry = loadedGeometry!; }); assetFlags.geometry = true; settled.geometry = true; wake(); }).catch(() => { canvas.dataset.meshFallback = "true"; settled.geometry = true; wake(); });
  new EXRLoader().setDataType(THREE.HalfFloatType).load(`/assets/textures/home/${mobile ? "matcap_ld" : "matcap"}.exr`, texture => {
    if (disposed) { texture.dispose(); return; } loadedMatcap = texture; texture.colorSpace = THREE.NoColorSpace; texture.generateMipmaps = false; texture.minFilter = texture.magFilter = THREE.LinearFilter; matcapUniform.value = texture; assetFlags.matcap = true; settled.matcap = true; wake();
  }, undefined, () => { canvas.dataset.matcapFallback = "true"; settled.matcap = true; wake(); });
  new THREE.TextureLoader().load("/assets/textures/LDR_RGB1_0.png", texture => {
    if (disposed) { texture.dispose(); return; } loadedNoise = texture; texture.colorSpace = THREE.NoColorSpace; texture.generateMipmaps = false; texture.minFilter = texture.magFilter = THREE.NearestFilter; texture.wrapS = texture.wrapT = THREE.RepeatWrapping; noiseUniform.value = texture; assetFlags.noise = true; settled.noise = true; wake();
  }, undefined, () => { canvas.dataset.noiseFallback = "true"; settled.noise = true; wake(); });
  const sorted = meshes.map((_, i) => i), offsets = meshes.map(() => [] as number[]);
  for (let i = 0; i < meshes.length; i++) for (let j = 0; j < meshes.length; j++) if (i !== j) offsets[i].push(j);
  return {
    renderer, software, physics,
    impulse() { physics.impulse(); },
    resize(w: number, h: number, vh: number, reduced: boolean) {
      width = w; height = h; viewportHeight = vh;
      const native = homeRenderDpr(w, h, devicePixelRatio || 1), dpr = software && !reduced ? Math.min(native, Math.sqrt(320000 / (w * h))) : native;
      renderer.setPixelRatio(dpr); renderer.setSize(w, h, false); main.setSize(Math.ceil(w * dpr), Math.ceil(h * dpr)); cache.setSize(main.width, main.height);
      let bw = main.width, bh = main.height;
      for (let i = 0; i < 4; i++) { bw = Math.max(1, bw >> 1); bh = Math.max(1, bh >> 1); blurTargets[i].setSize(bw, bh); blurInter[i].setSize(bw, bh); textureSizes[i].set(bw, bh); }
      camera.aspect = w / h; backgroundMaterial.uniforms.uAspect.value = w / h;
    },
    render(elapsed: number, visibleTime: number, reduced: boolean, x: number, y: number, active: boolean) {
      const aspect = width / height, fit = THREE.MathUtils.clamp((aspect - 2.2) / (2 / 3 - 2.2), 0, 1), nativeFov = 18 + fit * 12;
      const backOut = (t: number) => 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2;
      const arrival = reduced ? 1 : THREE.MathUtils.clamp((visibleTime - .3) / 1.7, 0, 1), lens = reduced ? 1 : THREE.MathUtils.clamp((visibleTime - .3) / 2.7, 0, 1);
      const distance = 25 + (17.5 - 25) * backOut(arrival), dolly = 100 * (1 - backOut(lens)), totalFov = nativeFov + dolly;
      camera.fov = THREE.MathUtils.radToDeg(2 * Math.atan(Math.tan(THREE.MathUtils.degToRad(totalFov) * .5) * height / viewportHeight));
      camera.position.set(0, 0, distance * Math.tan(nativeFov * Math.PI / 720) / Math.tan(totalFov * Math.PI / 720)); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix(); camera.updateMatrixWorld();
      pointer.set(x, y); raycaster.setFromCamera(pointer, camera);
      const stats = physics.step(firstFrame ? 0 : elapsed, active && !reduced ? raycaster.ray : null, reduced); firstFrame = false;
      noiseOffset.value.set(reduced ? 0 : (visibleTime * .618033989) % 1, reduced ? 0 : (visibleTime * .414213562) % 1);
      for (let i = 0; i < meshes.length; i++) {
        const body = physics.bodies[i], mesh = meshes[i], u = mesh.material.uniforms;
        mesh.position.copy(body.position); mesh.quaternion.copy(body.quaternion); if (backs[i]) { backs[i]!.position.copy(body.position); backs[i]!.quaternion.copy(body.quaternion); }
        (u.u_selfPositionRadius.value as THREE.Vector4).set(body.position.x, body.position.y, body.position.z, 1); (u.u_selfRotation.value as THREE.Quaternion).copy(body.quaternion); u.u_time.value = visibleTime;
        offsets[i].sort((a, b) => body.position.distanceToSquared(physics.bodies[a].position) - body.position.distanceToSquared(physics.bodies[b].position));
        for (let k = 0; k < offsets[i].length; k++) {
          const j = offsets[i][k], neighbour = physics.bodies[j], colour = meshes[j].material.uniforms.u_color.value as THREE.Color;
          (u.u_nearPositionRadiusList.value[k] as THREE.Vector4).set(neighbour.position.x, neighbour.position.y, neighbour.position.z, 1);
          (u.u_nearRotationList.value[k] as THREE.Quaternion).copy(neighbour.quaternion); (u.u_nearColorList.value[k] as THREE.Color).copy(colour);
          (u.u_nearTransparencyLumaList.value[k] as THREE.Vector2).set(j >= 22 ? 1 : 0, colour.r * .299 + colour.g * .587 + colour.b * .114);
        }
      }
      sorted.sort((a, b) => physics.bodies[a].position.z - physics.bodies[b].position.z);
      let order = 1;
      for (const i of sorted) { if (i >= 22) { backs[i]!.renderOrder = order++; meshes[i].renderOrder = order++; } else meshes[i].renderOrder = 0; }
      renderer.info.autoReset = false; renderer.info.reset(); renderer.setRenderTarget(main); renderer.clear(); renderer.render(scene, camera); blit(main.texture, null);
      canvas.dataset.nativeSettled = String(settled.geometry && settled.matcap && settled.noise); canvas.dataset.nativeAssets = String(assetFlags.geometry && assetFlags.matcap && assetFlags.noise); canvas.dataset.glassBodies = String(glassCount); canvas.dataset.neighbours = String(meshes.length - 1);
      return stats;
    },
    dispose() {
      if (disposed) return; disposed = true; materials.forEach(m => m.dispose()); backgroundMaterial.dispose(); copyMaterial.dispose(); blurMaterial.dispose(); quadGeometry.dispose(); geometry.dispose(); loadedGeometry?.dispose(); loadedMatcap?.dispose(); loadedNoise?.dispose(); matcapFallback.dispose(); noiseFallback.dispose(); main.dispose(); cache.dispose(); blurTargets.forEach(t => t.dispose()); blurInter.forEach(t => t.dispose()); renderer.dispose(); renderer.forceContextLoss();
    },
  };
}
