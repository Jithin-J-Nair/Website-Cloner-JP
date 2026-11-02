import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { MeshoptDecoder } from "three/addons/libs/meshopt_decoder.module.js";

/** The project's already-attributed NASA Gemini suit, not a Lusion model.
 * The procedural explorer remains the immediate/offline fallback. Loading owns
 * no clock or RAF; the existing About world owns placement and head response.
 * Each mount owns its parsed GLB resources, including late/cancelled parses. */
export function upgradeAboutExplorer(parent: THREE.Group, invalidate: () => void) {
  const abort = new AbortController();
  let disposed = false, suit: THREE.Object3D | null = null, head: THREE.Object3D | undefined;
  let status: "loading" | "ready" | "fallback" | "disposed" = "loading";
  const hidden: THREE.Object3D[] = [];
  const headRest = new THREE.Euler();
  const release = (root: THREE.Object3D) => {
    const geometries = new Set<THREE.BufferGeometry>();
    const materials = new Set<THREE.Material>();
    const textures = new Set<THREE.Texture>();
    const skeletons = new Set<THREE.Skeleton>();
    root.traverse(object => {
      const mesh = object as THREE.Mesh;
      if (!mesh.isMesh) return;
      geometries.add(mesh.geometry);
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        materials.add(material);
        for (const value of Object.values(material)) if (value instanceof THREE.Texture) textures.add(value);
      }
      if ((mesh as THREE.SkinnedMesh).isSkinnedMesh) skeletons.add((mesh as THREE.SkinnedMesh).skeleton);
    });
    for (const geometry of geometries) geometry.dispose();
    for (const material of materials) material.dispose();
    for (const texture of textures) {
      const image = texture.image;
      texture.dispose();
      if (typeof ImageBitmap !== "undefined" && image instanceof ImageBitmap) image.close();
    }
    for (const skeleton of skeletons) skeleton.dispose();
    root.removeFromParent();
  };
  void (async () => {
    try {
      const response = await fetch("/models/astronaut.glb", { signal: abort.signal });
      if (!response.ok) throw new Error(`NASA suit HTTP ${response.status}`);
      const bytes = await response.arrayBuffer();
      if (disposed) return;
      const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
      const gltf = await loader.parseAsync(bytes, "/models/");
      // Parsing (embedded image decoding) cannot be aborted by fetch's signal.
      // Explicitly dispose the late result rather than attaching to a dead world.
      if (disposed) { release(gltf.scene); return; }
      suit = gltf.scene;
      suit.name = "about-licensed-nasa-suit";
      const standing: Record<string, [number, number, number]> = {
        Head: [.02, 0, 0], ShoulderR: [-.04, 0, .24], ShoulderL: [-.04, 0, -.24],
        ElbowR: [-.1, 0, .06], ElbowL: [-.1, 0, -.06],
        HipR: [-.02, 0, .02], HipL: [-.02, 0, -.02], KneeR: [.04, 0, 0], KneeL: [.04, 0, 0],
      };
      suit.traverse(object => {
        if ((object as THREE.Bone).isBone && standing[object.name]) object.rotation.set(...standing[object.name]);
        const mesh = object as THREE.Mesh;
        if (mesh.isMesh) mesh.frustumCulled = false;
      });
      suit.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(suit, true);
      const size = bounds.getSize(new THREE.Vector3());
      if (!Number.isFinite(size.y) || size.y <= 0) throw new Error("NASA suit has invalid bounds");
      const center = bounds.getCenter(new THREE.Vector3()), scale = 1.76 / size.y;
      suit.scale.setScalar(scale);
      suit.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      head = suit.getObjectByName("Head");
      if (head) headRest.copy(head.rotation);
      // Preserve the original contact shadow; remove only the placeholder suit.
      for (const name of ["explorer-suit", "explorer-helmet"]) {
        const object = parent.getObjectByName(name);
        if (object) { object.visible = false; hidden.push(object); }
      }
      parent.add(suit);
      status = "ready";
      invalidate();
    } catch (error) {
      if (suit) { release(suit); suit = null; }
      if (disposed) return;
      status = "fallback";
      for (const object of hidden) object.visible = true;
      console.warn("About: licensed NASA suit unavailable; keeping procedural fallback.", error);
      invalidate();
    }
  })();
  return {
    get status() { return status; },
    pose(pointerX: number, pointerY: number, reduced: boolean) {
      if (disposed || !head) return;
      const x = reduced || !Number.isFinite(pointerX) ? 0 : THREE.MathUtils.clamp(pointerX, -1, 1);
      const y = reduced || !Number.isFinite(pointerY) ? 0 : THREE.MathUtils.clamp(pointerY, -1, 1);
      head.rotation.set(headRest.x - y * .035, headRest.y + x * .12, headRest.z);
    },
    dispose() {
      if (disposed) return;
      disposed = true; status = "disposed"; abort.abort();
      if (suit) { release(suit); suit = null; }
      head = undefined;
      for (const object of hidden) object.visible = true;
    },
  };
}
