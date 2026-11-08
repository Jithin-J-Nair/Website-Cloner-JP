/** About-owned 2D free-surface PIC/FLIP solver. MAC-grid pressure projection,
 * gravity, particle separation and a moving pointer obstacle—not prescribed
 * wave trajectories. Normalized height = 1. No timers, rendering or allocation
 * per substep; the contact renderer supplies its active clock and owns disposal.
 * This is an original solver, not Lusion's recovered simulation/code. */
export class AboutGlyphFluid {
  readonly x: Float32Array;
  readonly y: Float32Array;
  readonly vx: Float32Array;
  readonly vy: Float32Array;
  private aspect = 1;
  private nx = 1;
  private ny = 42;
  private hx = 1;
  private hy = 1 / 42;
  private u = new Float32Array(0);
  private v = new Float32Array(0);
  private oldU = new Float32Array(0);
  private oldV = new Float32Array(0);
  private weightU = new Float32Array(0);
  private weightV = new Float32Array(0);
  private pressure = new Float32Array(0);
  private nextPressure = new Float32Array(0);
  private rhs = new Float32Array(0);
  private density = new Float32Array(0);
  private fluid = new Uint8Array(0);
  private head = new Int32Array(0);
  private next: Int32Array;
  private clock = 0;
  private emission = 0;
  private cursor = 0;
  private pointerX = 0;
  private pointerY = 0;
  private pointerWasActive = false;
  private randomState = 0x74a923;
  private still = false;
  private radius = .007;
  // Mean absolute pressure-target residual (includes density-drift correction).
  lastProjectionBefore = 0;
  lastProjectionAfter = 0;
  steps = 0;

  constructor(readonly count: number, aspect: number) {
    this.x = new Float32Array(count); this.y = new Float32Array(count);
    this.vx = new Float32Array(count); this.vy = new Float32Array(count);
    this.next = new Int32Array(count);
    this.resize(aspect); this.reset(false);
  }
  private random() {
    this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0;
    return this.randomState / 4294967296;
  }
  resize(aspect: number) {
    const a = Math.max(.35, Math.min(4, Number.isFinite(aspect) ? aspect : 1));
    if (Math.abs(this.aspect - a) < .0001 && this.u.length) return;
    const ratio = a / this.aspect;
    for (let i = 0; i < this.count; i++) { this.x[i] *= ratio; this.vx[i] *= ratio; }
    this.aspect = a; this.nx = Math.max(18, Math.round(a * this.ny));
    this.hx = a / this.nx;
    const cells = this.nx * this.ny;
    this.u = new Float32Array((this.nx + 1) * this.ny);
    this.v = new Float32Array(this.nx * (this.ny + 1));
    this.oldU = new Float32Array(this.u.length); this.oldV = new Float32Array(this.v.length);
    this.weightU = new Float32Array(this.u.length); this.weightV = new Float32Array(this.v.length);
    this.pressure = new Float32Array(cells); this.nextPressure = new Float32Array(cells);
    this.rhs = new Float32Array(cells); this.density = new Float32Array(cells);
    this.fluid = new Uint8Array(cells); this.head = new Int32Array(cells);
    this.radius = .53 * Math.sqrt(a * .48 / this.count);
  }
  reset(still: boolean) {
    this.still = still; this.randomState = 0x74a923;
    this.clock = 0; this.emission = 0; this.cursor = 0; this.steps = 0; this.pointerWasActive = false;
    const pool = still ? this.count : Math.floor(this.count * .68);
    const spacing = Math.sqrt(this.aspect * .48 / this.count);
    const columns = Math.max(10, Math.floor((this.aspect - .03) / spacing));
    for (let i = 0; i < this.count; i++) {
      if (i < pool) {
        this.x[i] = .015 + ((i % columns) + .2 + this.random() * .6) / columns * (this.aspect - .03);
        this.y[i] = .016 + (Math.floor(i / columns) + this.random() * .7) * spacing;
        this.vx[i] = still ? 0 : .16 * Math.sin(this.x[i] / this.aspect * Math.PI * 2);
        this.vy[i] = 0;
      } else {
        const left = i % 3 === 0;
        const edge = .025 + this.random() * Math.min(.50, this.aspect * .30);
        this.x[i] = left ? edge : this.aspect - edge;
        this.y[i] = (left ? .22 : .48) + this.random() * .30;
        this.vx[i] = (left ? 1 : -1) * (.25 + this.random() * .30);
        this.vy[i] = -.10 - this.random() * .15;
      }
    }
  }
  private splat(array: Float32Array, weights: Float32Array, w: number, h: number, x: number, y: number, value: number) {
    x = Math.max(0, Math.min(w - 1.001, x)); y = Math.max(0, Math.min(h - 1.001, y));
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j;
    const a = (1 - fx) * (1 - fy), b = fx * (1 - fy), c = (1 - fx) * fy, d = fx * fy;
    const q = i + j * w;
    array[q] += a * value; weights[q] += a;
    array[q + 1] += b * value; weights[q + 1] += b;
    array[q + w] += c * value; weights[q + w] += c;
    array[q + w + 1] += d * value; weights[q + w + 1] += d;
  }
  private sample(array: Float32Array, w: number, h: number, x: number, y: number) {
    x = Math.max(0, Math.min(w - 1.001, x)); y = Math.max(0, Math.min(h - 1.001, y));
    const i = Math.floor(x), j = Math.floor(y), fx = x - i, fy = y - j, q = i + j * w;
    return (array[q] * (1 - fx) + array[q + 1] * fx) * (1 - fy)
      + (array[q + w] * (1 - fx) + array[q + w + 1] * fx) * fy;
  }
  private transferToGrid() {
    this.u.fill(0); this.v.fill(0); this.weightU.fill(0); this.weightV.fill(0);
    this.fluid.fill(0); this.density.fill(0);
    for (let k = 0; k < this.count; k++) {
      if (this.y[k] >= 1) continue; // Open surface: airborne grains remain ballistic.
      const gx = this.x[k] / this.hx, gy = this.y[k] / this.hy;
      const cell = Math.min(this.nx - 1, Math.max(0, Math.floor(gx)))
        + Math.min(this.ny - 1, Math.max(0, Math.floor(gy))) * this.nx;
      this.fluid[cell] = 1; this.density[cell]++;
      this.splat(this.u, this.weightU, this.nx + 1, this.ny, gx, gy - .5, this.vx[k]);
      this.splat(this.v, this.weightV, this.nx, this.ny + 1, gx - .5, gy, this.vy[k]);
    }
    for (let k = 0; k < this.u.length; k++) if (this.weightU[k] > 0) this.u[k] /= this.weightU[k];
    for (let k = 0; k < this.v.length; k++) if (this.weightV[k] > 0) this.v[k] /= this.weightV[k];
    this.oldU.set(this.u); this.oldV.set(this.v);
  }
  private boundaries() {
    for (let j = 0; j < this.ny; j++) { this.u[j * (this.nx + 1)] = 0; this.u[this.nx + j * (this.nx + 1)] = 0; }
    for (let i = 0; i < this.nx; i++) this.v[i] = 0;
  }
  private project(dt: number) {
    const { nx, ny, hx, hy, u, v, fluid, rhs } = this;
    const ix = 1 / (hx * hx), iy = 1 / (hy * hy);
    this.pressure.fill(0); this.nextPressure.fill(0);
    let before = 0, cells = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const c = i + j * nx;
      if (!fluid[c]) continue;
      const div = (u[i + 1 + j * (nx + 1)] - u[i + j * (nx + 1)]) / hx
        + (v[i + (j + 1) * nx] - v[c]) / hy;
      const restDensity = this.count * hx * hy / (this.aspect * .48);
      const compression = Math.min(1.5, Math.max(0, this.density[c] / restDensity - 1.1));
      rhs[c] = (div - compression * .12 / dt) / dt; before += Math.abs(rhs[c] * dt); cells++;
    }
    // Air has zero pressure. Solid side/floor neighbours have Neumann boundary
    // conditions, so they are excluded from the diagonal, not treated as air.
    for (let iteration = 0; iteration < 28; iteration++) {
      const p = this.pressure, q = this.nextPressure;
      for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
        const c = i + j * nx;
        if (!fluid[c]) { q[c] = 0; continue; }
        let sum = 0, diagonal = 0;
        if (i > 0) { sum += p[c - 1] * ix; diagonal += ix; }
        if (i < nx - 1) { sum += p[c + 1] * ix; diagonal += ix; }
        if (j > 0) { sum += p[c - nx] * iy; diagonal += iy; }
        if (j < ny - 1) sum += p[c + nx] * iy;
        diagonal += iy; // Open upper boundary.
        q[c] = (sum - rhs[c]) / diagonal;
      }
      this.pressure = q; this.nextPressure = p;
    }
    const p = this.pressure;
    for (let j = 0; j < ny; j++) for (let i = 1; i < nx; i++) {
      const c = i + j * nx;
      if (fluid[c] || fluid[c - 1]) u[i + j * (nx + 1)] -= dt * (p[c] - p[c - 1]) / hx;
    }
    for (let j = 1; j <= ny; j++) for (let i = 0; i < nx; i++) {
      const c = i + j * nx;
      if ((j < ny && fluid[c]) || fluid[c - nx]) v[c] -= dt * ((j < ny ? p[c] : 0) - p[c - nx]) / hy;
    }
    this.boundaries();
    let after = 0;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const c = i + j * nx;
      if (fluid[c]) {
        const target = Math.min(1.5, Math.max(0, this.density[c] / (this.count * hx * hy / (this.aspect * .48)) - 1.1)) * .12 / dt;
        after += Math.abs((u[i + 1 + j * (nx + 1)] - u[i + j * (nx + 1)]) / hx
          + (v[i + (j + 1) * nx] - v[c]) / hy - target);
      }
    }
    this.lastProjectionBefore = before / Math.max(1, cells);
    this.lastProjectionAfter = after / Math.max(1, cells);
  }
  private separate() {
    this.head.fill(-1);
    for (let k = 0; k < this.count; k++) {
      if (this.y[k] > 1) { this.next[k] = -1; continue; }
      const c = Math.max(0, Math.min(this.nx - 1, Math.floor(this.x[k] / this.hx)))
        + Math.max(0, Math.min(this.ny - 1, Math.floor(this.y[k] / this.hy))) * this.nx;
      this.next[k] = this.head[c]; this.head[c] = k;
    }
    const distance = this.radius * 2, d2 = distance * distance;
    for (let k = 0; k < this.count; k++) {
      if (this.y[k] > 1) continue;
      const cx = Math.floor(this.x[k] / this.hx), cy = Math.floor(this.y[k] / this.hy);
      for (let j = Math.max(0, cy - 1); j <= Math.min(this.ny - 1, cy + 1); j++) {
        for (let i = Math.max(0, cx - 1); i <= Math.min(this.nx - 1, cx + 1); i++) {
          for (let other = this.head[i + j * this.nx]; other >= 0; other = this.next[other]) {
            if (other <= k) continue;
            const dx = this.x[other] - this.x[k], dy = this.y[other] - this.y[k], r2 = dx * dx + dy * dy;
            if (r2 < .00000001 || r2 >= d2) continue;
            const r = Math.sqrt(r2), s = .28 * (distance - r) / r;
            this.x[k] -= dx * s; this.y[k] -= dy * s;
            this.x[other] += dx * s; this.y[other] += dy * s;
          }
        }
      }
    }
  }
  update(elapsed: number, px: number, py: number, active: boolean, reduced: boolean) {
    if (reduced !== this.still) this.reset(reduced);
    if (reduced) return;
    const duration = Math.max(0, Math.min(.05, Number.isFinite(elapsed) ? elapsed : 0));
    if (!duration) return;
    const substeps = Math.max(1, Math.ceil(duration / (1 / 60))), dt = duration / substeps;
    const pointerVX = active && this.pointerWasActive ? Math.max(-3, Math.min(3, (px - this.pointerX) / duration)) : 0;
    const pointerVY = active && this.pointerWasActive ? Math.max(-3, Math.min(3, (py - this.pointerY) / duration)) : 0;
    this.pointerX = px; this.pointerY = py; this.pointerWasActive = active;
    for (let step = 0; step < substeps; step++) {
      this.clock += dt;
      if (active) for (let k = 0; k < this.count; k++) {
        const dx = this.x[k] - px, dy = this.y[k] - py, r2 = dx * dx + dy * dy;
        if (r2 > .065 || r2 < .000001) continue;
        const r = Math.sqrt(r2), influence = Math.exp(-r2 / .018);
        this.vx[k] += (dx / r * 3.5 + pointerVX * 6 - dy * pointerVY * 10) * influence * dt;
        this.vy[k] += (dy / r * 3.5 + pointerVY * 6 + dx * pointerVX * 10) * influence * dt;
      }
      this.transferToGrid();
      for (let k = 0; k < this.v.length; k++) if (this.weightV[k] > 0) this.v[k] -= 1.65 * dt;
      this.boundaries(); this.project(dt);
      for (let k = 0; k < this.count; k++) {
        if (this.y[k] >= 1) {
          this.vy[k] -= 1.65 * dt;
          this.x[k] += this.vx[k] * dt; this.y[k] += this.vy[k] * dt;
        } else {
          const gx = this.x[k] / this.hx, gy = this.y[k] / this.hy;
          const picX = this.sample(this.u, this.nx + 1, this.ny, gx, gy - .5);
          const picY = this.sample(this.v, this.nx, this.ny + 1, gx - .5, gy);
          const deltaX = picX - this.sample(this.oldU, this.nx + 1, this.ny, gx, gy - .5);
          const deltaY = picY - this.sample(this.oldV, this.nx, this.ny + 1, gx - .5, gy);
          this.vx[k] = Math.max(-2.2, Math.min(2.2, .72 * (this.vx[k] + deltaX) + .28 * picX));
          this.vy[k] = Math.max(-2.2, Math.min(2.2, .72 * (this.vy[k] + deltaY) + .28 * picY));
          this.x[k] += this.vx[k] * dt; this.y[k] += this.vy[k] * dt;
        }
      }
      this.separate();
      for (let k = 0; k < this.count; k++) {
        if (this.x[k] < .012) { this.x[k] = .012; this.vx[k] = Math.max(0, this.vx[k]) * .7; }
        if (this.x[k] > this.aspect - .012) { this.x[k] = this.aspect - .012; this.vx[k] = Math.min(0, this.vx[k]) * .7; }
        if (this.y[k] < .012) { this.y[k] = .012; this.vy[k] = Math.max(0, -this.vy[k] * .1); }
        if (this.y[k] > 2) { this.y[k] = 1.05; this.vy[k] = -.1; }
      }
      // A low-rate, mass-conserving edge recirculation sustains the pour without
      // increasing particle count or prescribing a wave surface.
      this.emission = Math.min(12, this.emission + this.count * .10 * dt);
      if (this.clock > 1.5 && this.emission >= 1) {
        for (let attempt = 0; attempt < 80 && this.emission >= 1; attempt++) {
          const k = this.cursor++ % this.count;
          if (this.y[k] > .065 || (this.x[k] > this.aspect * .2 && this.x[k] < this.aspect * .8)) continue;
          const left = k % 2 === 0;
          const edge = .025 + this.random() * Math.min(.50, this.aspect * .30);
          this.x[k] = left ? edge : this.aspect - edge;
          // Alternating broad inlet heights feed the solver, not a prescribed surface.
          this.y[k] = .4 + .22 * Math.sin(this.clock * .8 + (left ? Math.PI : 0)) + this.random() * .2;
          this.vx[k] = (left ? 1 : -1) * (.28 + this.random() * .32); this.vy[k] = -.12 - this.random() * .15; this.emission--;
        }
      }
      this.steps++;
    }
  }
}
