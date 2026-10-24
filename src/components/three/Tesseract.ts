import * as THREE from "three"

const V4: number[][] = []
for (let i = 0; i < 16; i++) V4.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1])
const EDGES: [number, number][] = []
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) { const j = i ^ (1 << b); if (i < j) EDGES.push([i, j]) }

const rot = (p: number[], a: number, i: number, j: number) => {
  const c = Math.cos(a), s = Math.sin(a), x = p[i], y = p[j]
  p[i] = x * c - y * s; p[j] = x * s + y * c
}

export interface TesseractOptions {
  radius?: number          // 3D half-size
  tube?: number            // edge radius
  node?: number            // node radius
  d?: number               // 4D camera distance (>1)
  edgeMaterial: THREE.Material
  nodeMaterial: THREE.Material
}

export class Tesseract extends THREE.Group {
  private edges: THREE.InstancedMesh
  private nodes: THREE.InstancedMesh
  private p3 = Array.from({ length: 16 }, () => new THREE.Vector3())
  private o: Required<Pick<TesseractOptions, "radius" | "tube" | "node" | "d">>
  private m = new THREE.Matrix4(); private q = new THREE.Quaternion()
  private _up = new THREE.Vector3(0, 1, 0); private dir = new THREE.Vector3(); private mid = new THREE.Vector3(); private s = new THREE.Vector3()

  constructor(opts: TesseractOptions) {
    super()
    this.o = { radius: opts.radius ?? 3, tube: opts.tube ?? 0.035, node: opts.node ?? 0.09, d: opts.d ?? 2.6 }
    this.edges = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true), opts.edgeMaterial, EDGES.length)
    this.nodes = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1), opts.nodeMaterial, 16)
    this.edges.frustumCulled = false; this.nodes.frustumCulled = false
    this.add(this.edges, this.nodes)
  }

  /** a = rotation angles in radians for the 4D planes */
  update(a: { xw: number; yw: number; zw: number; xy?: number; zy?: number }) {
    const { radius, tube, node, d } = this.o
    for (let i = 0; i < 16; i++) {
      const p = V4[i].slice()
      rot(p, a.xw, 0, 3); rot(p, a.yw, 1, 3); rot(p, a.zw, 2, 3)
      if (a.xy) rot(p, a.xy, 0, 1)
      if (a.zy) rot(p, a.zy, 2, 1)
      const k = d / (d - p[3])
      this.p3[i].set(p[0] * k, p[1] * k, p[2] * k).multiplyScalar(radius / 1.6)
      this.m.compose(this.p3[i], this.q.identity(), this.s.setScalar(node * (0.7 + 0.3 * k)))
      this.nodes.setMatrixAt(i, this.m)
    }
    EDGES.forEach(([i, j], e) => {
      const A = this.p3[i], B = this.p3[j]
      this.dir.subVectors(B, A); const len = this.dir.length()
      this.mid.addVectors(A, B).multiplyScalar(0.5)
      this.q.setFromUnitVectors(this._up, this.dir.divideScalar(len || 1))
      this.m.compose(this.mid, this.q, this.s.set(tube, len, tube))
      this.edges.setMatrixAt(e, this.m)
    })
    this.edges.instanceMatrix.needsUpdate = true
    this.nodes.instanceMatrix.needsUpdate = true
  }
  
  dispose() { this.edges.geometry.dispose(); this.nodes.geometry.dispose(); this.edges.dispose(); this.nodes.dispose() }
}