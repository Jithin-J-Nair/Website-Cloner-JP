import type * as THREE from "three";

export interface ProjectSourceCard {
  el: HTMLAnchorElement;
  stage: HTMLElement;
  mesh: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null;
}
export interface ProjectSourceSnapshot {
  canvas: HTMLCanvasElement;
  cards: { id: string; rect: DOMRect; mesh: ProjectSourceCard["mesh"] }[];
}
type Source = (anchor: HTMLElement) => ProjectSourceSnapshot | null;
const sources = new Set<Source>();
let disclosure: number | null = null;
let origin: string | null = null;
const key = "studio-project-origin-v1";

/** Resource references are read synchronously; the shell clones before route disposal. */
export function registerProjectListSource(root: HTMLElement, canvas: HTMLCanvasElement, cards: ProjectSourceCard[]) {
  const source: Source = anchor => root.contains(anchor) ? {
    canvas,
    cards: cards.map(card => ({ id: card.el.dataset.id!, rect: card.stage.getBoundingClientRect(), mesh: card.mesh }))
      .filter(card => card.rect.width > 0 && card.rect.bottom > 0 && card.rect.top < innerHeight),
  } : null;
  sources.add(source);
  return () => { sources.delete(source); };
}
export function captureProjectListSource(anchor: HTMLElement) {
  for (const source of sources) { const snapshot = source(anchor); if (snapshot) return snapshot; }
  return null;
}
export function setProjectDisclosure(value: number | null) { disclosure = value; }
export function getProjectDisclosure() { return disclosure; }
export function rememberProjectOrigin(path: string) {
  if (!["/", "/projects", "/work"].includes(path)) return;
  origin = path;
  try { sessionStorage.setItem(key, path); } catch { /* Storage is optional. */ }
}
export function getProjectReturnPath() {
  if (origin) return origin;
  try { const saved = sessionStorage.getItem(key); if (saved && ["/", "/projects", "/work"].includes(saved)) return saved; } catch { /* Direct entry remains usable. */ }
  return "/";
}
