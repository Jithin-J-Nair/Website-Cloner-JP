import * as THREE from "three";
import type { ParsedBufData } from "@/lib/lusion-buf-loader";
import { createGoalCloneReflection } from "./GoalCloneReflection";
import { GOAL_WORLD_SCALE, sampleGoalBrownian } from "./GoalReferenceWorlds";
import { goalCloneVertex, goalCloneFragment } from "./GoalReferenceCloneShaders";

const BONE_COUNT = 53;
export const GOAL_CLONE_COUNT = 4;

/** Native uses g=1..4 (the primary is g=0), not a simultaneous linear spread. */
export function goalCloneMainWeight(index: number, show: number) {
  const delay = (index + 1) / (GOAL_CLONE_COUNT - 1) * .3;
  const t = THREE.MathUtils.clamp((show - delay) / .7, 0, 1);
  return .5 + .5 * Math.cos(t * Math.PI);
}

/** Frame-major palette: no CPU skinning, quaternion averaging or bind-pose offset.
 * Integer frame interpolation happens on the transformed points in the shader. */
export function createGoalCloneAnimationTextures(animation: ParsedBufData) {
  const frames = animation.header.vertexCount / BONE_COUNT;
  if (frames !== 288 || animation.attributes.orient.length !== BONE_COUNT * frames * 4) {
    throw new Error("Unexpected clone animation layout");
  }
  const positions = new Float32Array(BONE_COUNT * frames * 4);
  for (let i = 0; i < animation.header.vertexCount; i++) {
    positions.set(animation.attributes.position.subarray(i * 3, i * 3 + 3), i * 4);
  }
  const position = new THREE.DataTexture(positions, BONE_COUNT, frames, THREE.RGBAFormat, THREE.FloatType);
  const orient = new THREE.DataTexture(new Float32Array(animation.attributes.orient), BONE_COUNT, frames, THREE.RGBAFormat, THREE.FloatType);
  for (const texture of [position, orient]) {
    texture.minFilter = texture.magFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    texture.flipY = false;
    texture.needsUpdate = true;
  }
  return { position, orient };
}

/** Four full captured suits in FOUR draws, not sixteen independently skinned
 * PBR meshes. This is a scene child, not another renderer, RAF or scroll owner.
 * Feedback is supplied by the existing world owner after its ping-pong swap.
 */
export function createGoalReferenceClones(
  parts: ParsedBufData[],
  animation: ParsedBufData,
  maps: { arm: THREE.Texture; normal: THREE.Texture }[],
  track: <T extends { dispose: () => void }>(resource: T) => T,
) {
  const group = new THREE.Group();
  group.name = "ReferenceAstronautClones";
  group.scale.setScalar(GOAL_WORLD_SCALE);
  group.visible = false;
  const reflection = createGoalCloneReflection(track);
  const palette = createGoalCloneAnimationTextures(animation);
  track(palette.position); track(palette.orient);
  const position = new THREE.InstancedBufferAttribute(new Float32Array(GOAL_CLONE_COUNT * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const orient = new THREE.InstancedBufferAttribute(new Float32Array(GOAL_CLONE_COUNT * 4), 4).setUsage(THREE.DynamicDrawUsage);
  const frame = new THREE.InstancedBufferAttribute(new Float32Array(GOAL_CLONE_COUNT * 3), 3).setUsage(THREE.DynamicDrawUsage);
  const uniforms = {
    u_animationPositionTexture: { value: palette.position },
    u_animationOrientTexture: { value: palette.orient },
    u_animationTextureSize: { value: new THREE.Vector2(BONE_COUNT, 288) },
    u_feedbackTexture: { value: reflection.texture },
    u_alpha: { value: 0 }, u_endRatio: { value: 0 },
  };
  parts.forEach((part, index) => {
    const geometry = track(new THREE.InstancedBufferGeometry());
    for (const [name, attribute] of Object.entries(part.geometry.attributes)) geometry.setAttribute(name, attribute);
    geometry.setIndex(part.geometry.index);
    geometry.setAttribute("instancePos", position);
    geometry.setAttribute("instanceOrient", orient);
    geometry.setAttribute("instanceAnimationFrameFromToBlend1", frame);
    geometry.instanceCount = GOAL_CLONE_COUNT;
    const material = track(new THREE.ShaderMaterial({
      name: "ReferenceBlackCloneMaterial", defines: { BONE_COUNT },
      uniforms: { ...uniforms, u_armTexture: { value: maps[index].arm }, u_normalTexture: { value: maps[index].normal } },
      vertexShader: goalCloneVertex, fragmentShader: goalCloneFragment,
      transparent: true, blending: THREE.CustomBlending,
      blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      depthTest: false, side: THREE.DoubleSide,
    }));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false;
    group.add(mesh);
  });
  const noisePosition = new THREE.Vector3(), noiseRotation = new THREE.Quaternion(), mainPosition = new THREE.Vector3();
  return {
    group, uniforms, position, orient, frame,
    renderReflection(renderer: THREE.WebGLRenderer, feedback: THREE.Texture) {
      if (group.visible) reflection.render(renderer, feedback);
    },
    update(visible: boolean, time: number, loopFrame: number, blackRatio: number, show: number, mainWorldPosition: THREE.Vector3) {
      group.visible = visible;
      if (!visible) return;
      uniforms.u_alpha.value = show;
      uniforms.u_endRatio.value = THREE.MathUtils.smoothstep(blackRatio, .65, .9);
      mainPosition.copy(mainWorldPosition).multiplyScalar(1 / GOAL_WORLD_SCALE);
      for (let index = 0; index < GOAL_CLONE_COUNT; index++) {
        sampleGoalBrownian(time, index + 1, 12, 10, .2, .6, noisePosition, noiseRotation);
        // Clones own their origin/orientation. Do not add the primary's already
        // perturbed root a second time; only the source reveal lerps positions.
        noisePosition.lerp(mainPosition, goalCloneMainWeight(index, show));
        noisePosition.toArray(position.array, index * 3);
        noiseRotation.toArray(orient.array, index * 4);
        const sample = ((loopFrame + (index + 1) * 17) % 89 + 89) % 89;
        frame.setXYZ(index, Math.floor(sample), Math.ceil(sample), sample % 1);
      }
      position.needsUpdate = orient.needsUpdate = frame.needsUpdate = true;
    },
  };
}

export type GoalReferenceCloneField = ReturnType<typeof createGoalReferenceClones>;
