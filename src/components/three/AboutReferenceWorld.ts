import * as THREE from "three";
import { decodeAboutSourceBuffer } from "@/lib/about-source-buffer";
import { createAboutReferenceParticles } from "./AboutReferenceParticles";
import { aboutScatter, aboutGroundVertex, aboutGroundFragment, aboutPersonVertex, aboutPersonFragment, aboutRockVertex, aboutRockFragment, aboutFogVertex } from "./about-reference-shaders";

const clamp = (v: number) => Math.max(0, Math.min(1, v));
const fit = (x: number, a: number, b: number) => clamp((x - a) / (b - a));
type Source = ReturnType<typeof decodeAboutSourceBuffer>;

/** Source-coordinate assets remain together under one 180° Y rotation. This
 * preserves handedness and the negative-Z reference camera’s screen-right, rather than
 * misaligning camera, textures, animated bones and floor-contact coordinates.
 * Lifecycle, visibility and simulation are all driven by About's existing RAF. */
export function createAboutReferenceWorld(renderer: THREE.WebGLRenderer, low: boolean, reduced: boolean, invalidate: () => void, onState: (state: string) => void) {
  const group = new THREE.Group(), landscape = new THREE.Group(); landscape.rotation.y = Math.PI; group.add(landscape);
  const resources: Array<{ dispose(): void }> = [];
  const keep = <T extends { dispose(): void }>(item: T): T => { resources.push(item); return item; };
  const particles = keep(createAboutReferenceParticles(renderer, low, reduced)); group.add(particles.group);
  const controller = new AbortController();
  let assetState = "loading";
  let disposed = false, ready = false, cameraData: Source | undefined, boneData: Source | undefined;
  let terrain: THREE.Mesh | undefined, person: THREE.Mesh | undefined;
  const bonePos = new Float32Array(54 * 3), boneOrient = new Float32Array(54 * 4);
  const v0 = new THREE.Vector3(), v1 = new THREE.Vector3(), q0 = new THREE.Quaternion(), q1 = new THREE.Quaternion();
  const cameraDirection = new THREE.Vector3(), cameraTarget = new THREE.Vector3();
  const lightMixer = { value: new THREE.Vector3(1, 0, 0) };
  const sceneRatio = { value: 0 }, hudRatio = { value: 0 };
  const white = keep(new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1)); white.needsUpdate = true;
  const light = { u_lightPosition: { value: new THREE.Vector3(0, 8, 0) }, u_noiseStableFactor: particles.stable };
  const common = { ...light, ...particles.scatterUniforms, u_sceneRatio: sceneRatio, u_hudRatio: hudRatio };
  const noise = `vec3 getBlueNoise(vec2 p){return fract(sin(vec3(dot(p,vec2(12.9898,78.233)),dot(p,vec2(39.346,11.135)),dot(p,vec2(73.156,52.235))))*43758.5453);}`;
  const expand = (s: string) => s.replaceAll("#include <getScatter>", aboutScatter).replaceAll("#include <getBlueNoise>", noise).replaceAll("#include <getLightUv>", "");
  async function model(name: string) {
    const response = await fetch(`/about/scene/${name}.buf`, { signal: controller.signal });
    if (!response.ok) throw new Error(`About model unavailable: ${name}`);
    return decodeAboutSourceBuffer(await response.arrayBuffer());
  }
  async function texture(name: string, flipY = true) {
    const response = await fetch(`/about/scene/${name}`, { signal: controller.signal });
    if (!response.ok) throw new Error(`About texture unavailable: ${name}`);
    const bitmap = await createImageBitmap(await response.blob(), { imageOrientation: flipY ? "flipY" : "none", premultiplyAlpha: "none", colorSpaceConversion: "none" });
    if (disposed) { bitmap.close(); throw new Error("About world disposed"); }
    const map = keep(new THREE.Texture(bitmap));
    keep({ dispose: () => bitmap.close() });
    map.flipY = false; map.needsUpdate = true; map.colorSpace = THREE.NoColorSpace;
    map.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    return map;
  }
  function geometry(data: Source, owned = true) {
    const geo = new THREE.BufferGeometry(); if (owned) keep(geo);
    for (const [name, array] of Object.entries(data.attributes)) {
      if (name === "indices") geo.setIndex(new THREE.BufferAttribute(Uint16Array.from(array), 1));
      else geo.setAttribute(name, new THREE.BufferAttribute(array, array.length / data.count));
    }
    geo.computeBoundingSphere();
    return geo;
  }
  const haloUniforms = { ...common, u_inverseProjection: { value: new THREE.Matrix4() }, u_cameraWorld: { value: new THREE.Matrix4() } };
  const haloMaterial = keep(new THREE.ShaderMaterial({ uniforms: haloUniforms, depthWrite: false,
    vertexShader: `varying vec2 vClip;void main(){vClip=position.xy;gl_Position=vec4(position.xy,1.,1.);}`,
    fragmentShader: expand(`varying vec2 vClip;uniform mat4 u_inverseProjection,u_cameraWorld;uniform float u_sceneRatio,u_hudRatio;
      #include <getScatter>
      void main(){vec4 view=u_inverseProjection*vec4(vClip,1.,1.);vec3 ray=normalize(mat3(u_cameraWorld)*(view.xyz/view.w));
        float scatter=getScatter(cameraPosition,cameraPosition+ray*200.);gl_FragColor=vec4(vec3(scatter)*vec3(.91,.97,1.)*u_sceneRatio*(1.-u_hudRatio),0.);}`),
  }));
  const halo = new THREE.Mesh(keep(new THREE.PlaneGeometry(2, 2)), haloMaterial); halo.frustumCulled = false; halo.renderOrder = 10; group.add(halo);
  const groundMaterial = keep(new THREE.ShaderMaterial({ uniforms: {
    ...common, u_texture: { value: white as THREE.Texture }, u_groundShadowTexture: { value: white },
    u_color: { value: new THREE.Color(1, 1, 1) }, u_bgColor: { value: new THREE.Color(0, 0, 0) },
    u_fogA: { value: .03 }, u_fogB: { value: .285 },
  }, vertexShader: expand(aboutGroundVertex), fragmentShader: expand(aboutGroundFragment) }));
  // Light data remains RGB; base albedo is a separate sampler rather than an
  // intermediate channel-packing render target that would duplicate textures.
  const personMaterial = keep(new THREE.ShaderMaterial({ defines: { BONE_COUNT: 54 }, uniforms: {
    ...common, u_texture: { value: white as THREE.Texture }, u_albedo: { value: white as THREE.Texture }, u_lightMixer: lightMixer,
    u_bonePoses: { value: bonePos }, u_boneOrients: { value: boneOrient },
  }, vertexShader: expand(aboutPersonVertex), fragmentShader: expand(aboutPersonFragment)
    .replace("uniform sampler2D u_texture;", "uniform sampler2D u_texture;uniform sampler2D u_albedo;")
    .replace("float baseShade=map.a;", "float baseShade=texture2D(u_albedo,v_uv).r;") }));
  const rockMaterials: THREE.ShaderMaterial[] = [];
  function animationTextures(data: Source, columns: number) {
    if (data.count % columns !== 0 || !data.attributes.orient) throw new Error("Invalid About animation layout");
    const pos = new Float32Array(data.count * 4);
    for (let i = 0; i < data.count; i++) pos.set(data.attributes.position.subarray(i * 3, i * 3 + 3), i * 4);
    const position = keep(new THREE.DataTexture(pos, columns, data.count / columns, THREE.RGBAFormat, THREE.FloatType));
    const orient = keep(new THREE.DataTexture(data.attributes.orient, columns, data.count / columns, THREE.RGBAFormat, THREE.FloatType));
    position.needsUpdate = true; orient.needsUpdate = true;
    return { position, orient };
  }
  async function loadContactShadow() {
    const map = await texture("ground_person_shadow.webp", false);
    if (disposed) return;
    const mat = keep(new THREE.ShaderMaterial({ uniforms: { u_map: { value: map }, u_lightMixer: lightMixer },
      vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec2 vUv;uniform sampler2D u_map;uniform vec3 u_lightMixer;
        void main(){vec3 map=texture2D(u_map,vUv).rgb;float shadow=dot(map,u_lightMixer);gl_FragColor=vec4(vec3(shadow*shadow*.3+.7),1.);}`,
      transparent: true, premultipliedAlpha: true, depthWrite: false, blending: THREE.MultiplyBlending,
    }));
    const shadow = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.5, 1.5)), mat); shadow.rotation.x = -Math.PI / 2; shadow.position.y = .01; shadow.renderOrder = 10; landscape.add(shadow); invalidate();
  }
  const fogUniforms = { ...common, u_fogTexture: { value: white as THREE.Texture }, u_introTime: { value: 0 } };
  async function loadFog() {
    fogUniforms.u_fogTexture.value = await texture("fog.png", false);
    if (disposed) return;
    const plane = keep(new THREE.PlaneGeometry(1, 1, 3, 3)), geo = keep(new THREE.InstancedBufferGeometry());
    for (const name of Object.keys(plane.attributes)) geo.setAttribute(name, plane.getAttribute(name)); geo.setIndex(plane.index);
    const ids = new Float32Array(32), positions = new Float32Array(96), seeds = new Float32Array(96);
    for (let i = 0; i < 32; i++) {
      ids[i] = i;
      positions.set([12 * Math.sin(i * 7.133), -.25 + .5 * ((i * 17 % 31) / 31), 12 * (1 - i / 31 * 2)], i * 3);
      seeds.set([Math.sin(i * 13.37), Math.sin(i * 3.71), Math.cos(i * 5.71)], i * 3);
    }
    geo.setAttribute("a_instanceId", new THREE.InstancedBufferAttribute(ids, 1));
    geo.setAttribute("a_instancePos", new THREE.InstancedBufferAttribute(positions, 3));
    geo.setAttribute("a_instanceRands", new THREE.InstancedBufferAttribute(seeds, 3)); geo.instanceCount = 32;
    const material = keep(new THREE.ShaderMaterial({ uniforms: fogUniforms, vertexShader: expand(aboutFogVertex),
      fragmentShader: `uniform sampler2D u_fogTexture;varying vec2 v_uv;varying vec3 v_worldPosition;varying float v_opacity;
        void main(){vec2 map=texture2D(u_fogTexture,v_uv).rg;float density=max(0.,map.x*1.35-map.y*.15);
          float falloff=exp(-length(v_worldPosition+vec3(0.,0.,5.))*(.22-map.x*.2));
          gl_FragColor=vec4(vec3(density)*vec3(.55,.59,.61),falloff*map.y*v_opacity*.32);}`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide,
    }));
    const mesh = new THREE.Mesh(geo, material); mesh.renderOrder = 20; mesh.frustumCulled = false; landscape.add(mesh); invalidate();
  }
  async function loadRocks() {
    const rockMap = await texture("rocks.webp", false);
    await Promise.all([0, 1, 2, 3].map(async i => {
      const [data, animation] = await Promise.all([model(`rock_${i}`), model(`rock_animation_${i}`)]);
      if (disposed) return;
      const source = geometry(data), geo = keep(new THREE.InstancedBufferGeometry());
      for (const name of Object.keys(source.attributes)) geo.setAttribute(name, source.getAttribute(name));
      geo.setIndex(source.index);
      const count = low ? 32 : 64, ids = new Float32Array(count), seeds = new Float32Array(count * 4);
      for (let j = 0; j < count; j++) {
        ids[j] = i + j * 4;
        for (let k = 0; k < 4; k++) seeds[j * 4 + k] = ((Math.sin((j * 4 + k + i * 257 + 1) * 12.9898) * 43758.5453) % 1 + 1) % 1;
      }
      geo.setAttribute("instanceId", new THREE.InstancedBufferAttribute(ids, 1)); geo.setAttribute("instanceRands", new THREE.InstancedBufferAttribute(seeds, 4)); geo.instanceCount = count;
      const maps = animationTextures(animation, 16);
      const uniforms = { ...common, u_texture: { value: rockMap }, u_textureChannelMixer: { value: new THREE.Vector4(1, 0, 0, 0) },
        u_lightColor: { value: new THREE.Color(0, 0, 0) }, u_posRandTexture: { value: maps.position }, u_orientTexture: { value: maps.orient },
        u_animationTextureSize: { value: new THREE.Vector2(16, 120) }, u_time: { value: 0 }, u_globalTime: { value: 0 }, u_scale: { value: 0 },
      };
      const mat = keep(new THREE.ShaderMaterial({ uniforms, vertexShader: expand(aboutRockVertex), fragmentShader: expand(aboutRockFragment)
        .replace("float pattern=dot(u_textureChannelMixer,texture2D(u_texture,v_uv));", `float pattern=texture2D(u_texture,v_uv*.5+vec2(${i % 2 ? ".5" : "0."},${i > 1 ? ".5" : "0."})).g;`) }));
      rockMaterials.push(mat);
      const mesh = new THREE.Mesh(geo, mat); mesh.frustumCulled = false; landscape.add(mesh);
    }));
    if (!disposed) invalidate();
  }
  void Promise.all([model("terrain"), model("camera_spline"), model("person"), model("person_idle"),
    texture("terrain_shadow_light_height.webp"), texture("person.webp", false), texture("person_light.webp", false),
  ]).then(([ground, spline, human, idle, groundMap, albedo, lights]) => {
    if (disposed) return;
    if (!spline.attributes.orient || idle.count !== 54 * 85 || !human.attributes.boneIndices || human.attributes.boneIndices.some(i => i > 53 || i < 0 || !Number.isInteger(i))) throw new Error("Invalid About rig");
    cameraData = spline; boneData = idle;
    groundMaterial.uniforms.u_texture.value = groundMap; personMaterial.uniforms.u_texture.value = lights; personMaterial.uniforms.u_albedo.value = albedo;
    terrain = new THREE.Mesh(geometry(ground), groundMaterial); landscape.add(terrain);
    person = new THREE.Mesh(geometry(human), personMaterial); person.frustumCulled = false; landscape.add(person);
    ready = true; assetState = "source-rig"; onState("ready"); invalidate();
    void loadContactShadow().catch(() => { /* Optional contact texture must not block the accessible page. */ });
    void loadFog().catch(() => { /* Keep the readable ground if optional atmosphere fails. */ });
    void loadRocks().catch(() => { /* Terrain/person remain usable if optional debris fails. */ });
  }).catch(() => { if (!disposed) { assetState = "unavailable"; onState("unavailable"); invalidate(); } });
  for (const id of ["l", "m", "s", "xs"]) void model(`sphere_${id}`).then(data => {
    if (!disposed) { particles.setGeometry(id, geometry(data, false)); invalidate(); }
  }).catch(() => { /* A bounded geometric sphere remains if its optional LOD fails. */ });

  return {
    group, renderMotion: particles.renderMotion, count: particles.count, get ready() { return ready; }, get status() { return assetState; },
    update(camera: THREE.PerspectiveCamera, u: number, time: number, mobile: boolean, pointer: THREE.Vector2) {
      fogUniforms.u_introTime.value = reduced ? .5 : time;
      const intro = clamp(u / 5.25), hud = fit(u, 5.25, 6.125);
      const show = 1 - fit(u, 5.25, 6.125);
      particles.update(time, intro, show, false);
      sceneRatio.value = 1 - Math.pow(1 - fit(intro, .01, .1), 3); hudRatio.value = hud;
      landscape.visible = ready && sceneRatio.value > .001 && hud < .999;
      if (cameraData) {
        const index = Math.min(199, clamp(u / 5.25) * 149 + fit(u, 5.25, 9.5) * 50);
        const a = Math.floor(index), b = Math.min(199, a + 1), blend = index - a;
        const { position, orient } = cameraData.attributes;
        v0.fromArray(position, a * 3).lerp(v1.fromArray(position, b * 3), blend);
        q0.fromArray(orient, a * 4).slerp(q1.fromArray(orient, b * 4), blend);
        cameraDirection.set(0, 0, 1).applyQuaternion(q0); cameraDirection.x *= -1; cameraDirection.z *= -1;
        camera.position.set(-v0.x, v0.y, -v0.z);
        // Preserve the reference's small dolly compensation and pointer parallax.
        camera.position.addScaledVector(cameraDirection, -fit(intro, .4, .8) * .2);
        cameraTarget.copy(camera.position).add(cameraDirection);
        camera.lookAt(cameraTarget);
        if (!reduced && !mobile) { camera.rotateX(pointer.y * .035); camera.rotateY(-pointer.x * .035); }
        camera.fov = mobile ? 70 : 60; camera.updateProjectionMatrix();
      }
      if (boneData && landscape.visible) {
        const frame = (reduced ? 0 : time * 30) % 85, a = Math.floor(frame), b = (a + 1) % 85, blend = frame - a;
        const { position, orient } = boneData.attributes;
        for (let i = 0; i < 54; i++) {
          v0.fromArray(position, (a * 54 + i) * 3).lerp(v1.fromArray(position, (b * 54 + i) * 3), blend).toArray(bonePos, i * 3);
          q0.fromArray(orient, (a * 54 + i) * 4).slerp(q1.fromArray(orient, (b * 54 + i) * 4), blend).toArray(boneOrient, i * 4);
        }
        const phase = frame / 85 * 3;
        lightMixer.value.set(fit(phase, 2, 3) + 1 - fit(phase, 0, 1), fit(phase, 0, 1) * (1 - fit(phase, 1, 2)), fit(phase, 1, 2) * (1 - fit(phase, 2, 3)));
      }
      camera.updateMatrixWorld(); haloUniforms.u_inverseProjection.value.copy(camera.projectionMatrixInverse); haloUniforms.u_cameraWorld.value.copy(camera.matrixWorld);
      for (const mat of rockMaterials) { mat.uniforms.u_time.value = reduced ? 2.1 : time; mat.uniforms.u_globalTime.value = time; mat.uniforms.u_scale.value = fit(intro, 0, .2); }
    },
    dispose() { if (disposed) return; disposed = true; controller.abort(); group.removeFromParent(); for (const item of resources) item.dispose(); resources.length = 0; },
  };
}
