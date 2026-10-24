import * as THREE from "three"
type P = { x: number; y: number }
const clip = (poly: P[], nx: number, ny: number, c: number) => {      // keep nx*x+ny*y <= c
  const out: P[] = []
  for (let i = 0; i < poly.length; i++) {
    const a = poly[i], b = poly[(i + 1) % poly.length]
    const da = nx * a.x + ny * a.y - c, db = nx * b.x + ny * b.y - c
    if (da <= 0) out.push(a)
    if ((da < 0 && db > 0) || (da > 0 && db < 0)) { const t = da / (da - db); out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t }) }
  }
  return out
}
export function buildFracture(w: number, h: number, impact: P, cells = 220, seed = 7) {
  let s = seed >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
  const R = Math.hypot(w, h) * 0.7
  const sites: P[] = []
  for (let i = 0; i < cells; i++) { const a = rnd() * Math.PI * 2, r = Math.pow(rnd(), 1.8) * R; sites.push({ x: impact.x + Math.cos(a) * r, y: impact.y + Math.sin(a) * r }) }
  const pos: number[] = [], uv: number[] = [], ctr: number[] = [], rnd1: number[] = [], dist: number[] = [], edge: number[] = []
  sites.forEach((site, si) => {
    let poly: P[] = [{ x: -w / 2, y: -h / 2 }, { x: w / 2, y: -h / 2 }, { x: w / 2, y: h / 2 }, { x: -w / 2, y: h / 2 }]
    const near = sites.map((o, oi) => ({ o, oi, d: (o.x - site.x) ** 2 + (o.y - site.y) ** 2 })).filter(v => v.oi !== si).sort((a, b) => a.d - b.d).slice(0, 28)
    for (const { o } of near) { const nx = o.x - site.x, ny = o.y - site.y; const mx = (o.x + site.x) / 2, my = (o.y + site.y) / 2; poly = clip(poly, nx, ny, nx * mx + ny * my); if (poly.length < 3) break }
    if (poly.length < 3) return
    const cx = poly.reduce((a, p) => a + p.x, 0) / poly.length, cy = poly.reduce((a, p) => a + p.y, 0) / poly.length
    const rr = rnd(), dd = Math.min(1, Math.hypot(cx - impact.x, cy - impact.y) / R)
    const push = (x: number, y: number, e: number) => { pos.push(x, y, 0); uv.push(x / w + 0.5, y / h + 0.5); ctr.push(cx, cy, 0); rnd1.push(rr); dist.push(dd); edge.push(e) }
    for (let i = 0; i < poly.length; i++) { const a = poly[i], b = poly[(i + 1) % poly.length]; push(cx, cy, 1); push(a.x, a.y, 0); push(b.x, b.y, 0) }
  })
  const g = new THREE.BufferGeometry()
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2))
  g.setAttribute("aCenter", new THREE.Float32BufferAttribute(ctr, 3)); g.setAttribute("aRand", new THREE.Float32BufferAttribute(rnd1, 1))
  g.setAttribute("aDist", new THREE.Float32BufferAttribute(dist, 1)); g.setAttribute("aEdge", new THREE.Float32BufferAttribute(edge, 1))
  return g
}

export const FRACTURE_VERT = `
attribute vec3 aCenter; attribute float aRand; attribute float aDist; attribute float aEdge;
uniform float uBreak; uniform float uCrack; uniform float uBulge; uniform vec2 uImpact;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vRand; varying float vEdge; varying float vDist;
vec3 rotateAxis(vec3 v, vec3 a, float ang){ float c=cos(ang), s=sin(ang); return v*c + cross(a,v)*s + a*dot(a,v)*(1.0-c); }
void main(){
  vec3 p = position; vec3 c = aCenter;
  float delay = aDist * 0.22;
  float t = clamp((uBreak - delay) / (1.0 - delay), 0.0, 1.0);
  float e = 1.0 - pow(1.0 - t, 3.0);
  vec2 away = normalize(c.xy - uImpact + vec2(1e-4));
  vec3 vel = vec3(away * (1.2 + aRand * 3.6) * (1.0 - aDist * 0.45), 1.5 + aRand * 6.0);
  vec3 axis = normalize(vec3(aRand - 0.35, 0.7, aRand * 0.8 + 0.1));
  p = c + rotateAxis(p - c, axis, e * (aRand - 0.5) * 11.0);
  p += vel * e; p.y -= 0.5 * aRand * e * e;
  p.z += uBulge * exp(-dot(p.xy - uImpact, p.xy - uImpact) * 0.35) * (1.0 - t);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vN = normalize(normalMatrix * vec3(0.0, 0.0, 1.0)); vV = normalize(-mv.xyz);
  vUv = uv; vRand = aRand; vEdge = aEdge; vDist = aDist;
  gl_Position = projectionMatrix * mv;
}
`;

export const FRACTURE_FRAG = `
uniform sampler2D uMap; uniform float uBreak; uniform float uCrack;
varying vec2 vUv; varying vec3 vN; varying vec3 vV; varying float vRand; varying float vEdge; varying float vDist;
void main(){
  vec3 tex = texture2D(uMap, vUv).rgb;
  float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 3.0);
  float glint = pow(fres, 6.0) * vRand;
  float crackReach = 1.0 - smoothstep(uCrack - 0.08, uCrack, vDist);   // cracks grow outward from the impact
  float rim = (1.0 - smoothstep(0.0, 0.035, vEdge)) * crackReach;      // cell boundary lines
  vec3 col = tex * (0.88 + 0.12 * vRand) + vec3(0.7, 0.85, 1.0) * fres * 0.7 + vec3(1.0) * glint * 0.9;
  col += vec3(1.0) * rim * (1.0 - uBreak) * 1.6;                      // bright cracks before the break
  col += vec3(0.8, 0.9, 1.0) * rim * uBreak * 0.6;                    // bright edges while flying
  gl_FragColor = vec4(col, mix(1.0, 0.86, uBreak));
}
`;
