import * as THREE from "three";
import { LUSION_PROJECTS_ARCHIVE, type LusionProjectCard } from "@/data/reference";
import { editorialProjectVertex, editorialProjectFragment } from "@/components/home/HomeEditorialShaders";
import { projectZoomPose, type ProjectZoomBox } from "@/lib/project-zoom-motion";
import type { ProjectSourceSnapshot } from "@/lib/project-transition";

export interface ProjectZoomSelection { id: string; box: ProjectZoomBox; background: string; snapshot?: ProjectSourceSnapshot | null; settled?: boolean }

/** Transaction-owned handoff surface. No RAF/listeners of its own. Textures/materials
 * are independently owned so Next may dispose the original list at route commit. */
export function createProjectZoomSurface(root: HTMLElement, selection: ProjectZoomSelection) {
  const host = document.createElement("div"); host.id = "project-zoom-surface";
  host.style.cssText = "position:absolute;inset:0;pointer-events:none;overflow:hidden";
  root.append(host);
  const canvas = document.createElement("canvas"); canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  host.append(canvas);
  const fallback = document.createElement("div"); fallback.style.cssText = "position:absolute;inset:0;transform-origin:0 0"; host.append(fallback);
  const fog = document.createElement("div"); fog.style.cssText = `position:absolute;inset:0;background:${selection.background};opacity:0`; host.append(fog);
  const scene = new THREE.Scene(), group = new THREE.Group(), pivot = new THREE.Group(); group.add(pivot); scene.add(group);
  const camera = new THREE.OrthographicCamera(0, innerWidth, 0, -innerHeight, -100000, 100000);
  const resources = new Set<{ dispose(): void }>();
  const keep = <T extends { dispose(): void }>(resource: T): T => { resources.add(resource); return resource; };
  let disposed = false, renderer: THREE.WebGLRenderer | null = null, lost = false;
  const focusTarget = new THREE.Vector3(0,0,.5);
  const cards = LUSION_PROJECTS_ARCHIVE.projects;
  const selected = cards.find(card => card.id === selection.id)!;
  const sourceCards = selection.snapshot?.cards ?? [{ id: selected.id, rect: selection.box, mesh: null }];
  const entries: { id: string; mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; rect: ProjectZoomBox; focus: THREE.Vector3; zoom: number }[] = [];
  const white = keep(new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1)); white.needsUpdate = true;
  function load(url: string, assign: (texture: THREE.Texture) => void) {
    new THREE.TextureLoader().load(url, texture => {
      if (disposed) { texture.dispose(); return; }
      keep(texture); texture.colorSpace = THREE.NoColorSpace; assign(texture);
    }, undefined, () => { host.dataset.assetFallback = "true"; });
  }
  function makeMaterial(card: LusionProjectCard, rect: ProjectZoomBox) {
    return keep(new THREE.ShaderMaterial({ vertexShader: editorialProjectVertex, fragmentShader: editorialProjectFragment,
      transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide,
      defines: { PARALLAX_SAMPLES: 12, BLUR_SAMPLES: 6 }, uniforms: {
        u_domXY:{value:new THREE.Vector2(rect.x,rect.y)},u_domWH:{value:new THREE.Vector2(rect.width,rect.height)},u_rotation:{value:0},u_padding:{value:new THREE.Vector2()},
        u_texture:{value:white},u_depthTexture:{value:white},u_textureSize:{value:new THREE.Vector2(card.thumbnailWidth,card.thumbnailHeight)},u_colorBg:{value:new THREE.Color(card.colorBg)},
        u_showRatio:{value:1},u_activeRatio:{value:0},u_shiftXY:{value:new THREE.Vector2()},u_focusPos:{value:new THREE.Vector3(0,0,-1)},u_time:{value:0},u_zoomRatio:{value:0},
        u_dofRangeOffset:{value:0},u_saturation:{value:0},u_brightness:{value:0},u_borderRatio:{value:0},u_rippleStrength:{value:0},u_resolution:{value:new THREE.Vector2(innerWidth,innerHeight)},u_globalRadius:{value:15},
        u_blueNoiseTexture:{value:white},u_blueNoiseCoordOffset:{value:new THREE.Vector2()},
      },
    }));
  }
  try {
    if (new URLSearchParams(location.search).get("forceWebglFallback") === "1") throw new Error("Requested DOM fallback");
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "low-power" });
    renderer.setClearColor(0,0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  } catch { lost = true; canvas.hidden = true; }
  host.dataset.graphics = renderer ? "depth" : "fallback";
  for (const source of sourceCards) {
    const card = cards.find(card => card.id === source.id); if (!card) continue;
    const rect = { x: source.rect.x, y: source.rect.y, width: source.rect.width, height: source.rect.height };
    const image = document.createElement("img"); image.src = card.thumbnail; image.alt = "";
    image.style.cssText = `position:absolute;left:${rect.x}px;top:${rect.y}px;width:${rect.width}px;height:${rect.height}px;object-fit:cover;border-radius:15px`;
    fallback.append(image);
    if (!renderer) continue;
    const material = source.mesh ? keep(source.mesh.material.clone()) : makeMaterial(card,rect);
    if (source.mesh) {
      // ShaderMaterial.clone() already deep-clones texture uniforms in Three.
      // Register those copies, never the list's original GPU resources.
      for (const uniform of Object.values(material.uniforms)) {
        if (uniform.value instanceof THREE.Texture) keep(uniform.value);
      }
    }
    const u = material.uniforms;
    if (selection.settled) u.u_showRatio.value = 1;
    (u.u_domXY.value as THREE.Vector2).set(rect.x,rect.y);
    (u.u_domWH.value as THREE.Vector2).set(rect.width,rect.height);
    (u.u_padding.value as THREE.Vector2).set(0,0); u.u_rotation.value = 0;
    if (source.id === selection.id) (u.u_colorBg.value as THREE.Color).set(selection.background);
    const geometry = keep(source.mesh ? source.mesh.geometry.clone() : new THREE.PlaneGeometry(1,1).translate(.5,.5,0));
    const mesh = new THREE.Mesh(geometry,material); mesh.frustumCulled = false; mesh.renderOrder = source.id === selection.id ? 2 : 1; pivot.add(mesh);
    entries.push({ id: source.id, mesh, rect, focus: (u.u_focusPos.value as THREE.Vector3).clone(), zoom: u.u_zoomRatio.value as number });
    if (!source.mesh) {
      // Until a real image arrives use the DOM image, never a gray GPU placeholder.
      mesh.visible = false;
      load(card.thumbnail, texture => { u.u_texture.value = texture; mesh.visible = true; });
      load(card.depthMap, texture => { u.u_depthTexture.value = texture; });
    }
  }
  const contextLost = (event: Event) => { event.preventDefault(); lost = true; canvas.hidden = true; fallback.hidden = false; host.dataset.graphics = "fallback"; };
  canvas.addEventListener("webglcontextlost", contextLost);
  function resize() {
    camera.right = innerWidth; camera.bottom = -innerHeight; camera.updateProjectionMatrix();
    renderer?.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5)); renderer?.setSize(innerWidth,innerHeight,false);
  }
  resize();
  return {
    host,
    setBox(box: ProjectZoomBox) {
      selection.box = box;
      const entry = entries.find(entry => entry.id === selection.id);
      if (entry) { entry.rect = box; (entry.mesh.material.uniforms.u_domXY.value as THREE.Vector2).set(box.x,box.y); (entry.mesh.material.uniforms.u_domWH.value as THREE.Vector2).set(box.width,box.height); }
      const image = fallback.querySelector<HTMLImageElement>("img");
      if (image) Object.assign(image.style,{left:`${box.x}px`,top:`${box.y}px`,width:`${box.width}px`,height:`${box.height}px`});
    },
    resize,
    paint(ratio: number, opacity = 1) {
      if (disposed) return;
      const pose = projectZoomPose(innerWidth,innerHeight,selection.box,ratio);
      group.position.set(innerWidth/2,-innerHeight/2,0); group.rotation.set(0,pose.angle,-pose.angle); group.scale.setScalar(pose.scale); pivot.position.set(pose.pivotX,pose.pivotY,0);
      for (const entry of entries) {
        const u = entry.mesh.material.uniforms, active = entry.id === selection.id ? pose.active : 0;
        u.u_activeRatio.value = active;
        (u.u_focusPos.value as THREE.Vector3).copy(entry.focus).lerp(focusTarget,ratio);
        u.u_zoomRatio.value = entry.zoom + (1-entry.zoom)*ratio; u.u_rippleStrength.value = 0;
        (u.u_resolution.value as THREE.Vector2).set(innerWidth*(renderer?.getPixelRatio()||1),innerHeight*(renderer?.getPixelRatio()||1));
      }
      host.style.opacity = String(opacity);
      const fogRatio = Math.max(0,Math.min(1,(ratio-.65)/.35));
      // Coverage at the final state is guaranteed even for missing depth/GL assets.
      fog.style.opacity = String(fogRatio * fogRatio);
      // The fully fogged state is an opaque color plate. Do not raymarch an
      // invisible image while waiting/preparing/revealing the destination.
      if (renderer && !lost && ratio < 1) {
        try { renderer.render(scene,camera); fallback.hidden = entries.every(entry => entry.mesh.visible); host.dataset.graphics = "depth"; }
        catch { contextLost(new Event("webglcontextlost")); }
      }
      {
        group.updateMatrixWorld(true);
        const flip = new THREE.Matrix4().makeScale(1,-1,1), matrix = flip.clone().multiply(pivot.matrixWorld).multiply(flip);
        fallback.style.transform = `matrix3d(${matrix.elements.join(",")})`;
      }
      host.dataset.zoom = ratio.toFixed(4); host.dataset.scale = pose.scale.toFixed(4); host.dataset.activeDepth = pose.active.toFixed(4);
    },
    dispose() {
      if (disposed) return;
      disposed = true; canvas.removeEventListener("webglcontextlost",contextLost); resources.forEach(resource => resource.dispose()); renderer?.dispose(); renderer?.forceContextLoss(); host.remove();
    },
  };
}
