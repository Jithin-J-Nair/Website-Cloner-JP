/** About CTA PIC liquid, adapted from the inspected reference FlipSim equations.
 * A real free surface, not an authored wave path: gravity -> separation -> solid
 * collisions -> particle/grid transfer -> density -> pressure -> PIC advection.
 * The floor opens during a held pour, recycling drained grains at the pointer.
 * No timers, renderer, per-step allocation or independent animation owner. */
const clamp = (x: number, a: number, b: number) => Math.max(a, Math.min(b, x));
const fit = (w: number, a: number, b: number) => a + (b - a) * clamp((w - 320) / 2240, 0, 1);
const FLUID = 0, AIR = 1, SOLID = 2;
type Collider = { left: number; right: number; bottom: number; top: number };

export function aboutContactMetrics(width: number, height: number, limit = 5600, textured = false) {
  const w = Math.max(1, width), h = Math.max(1, height);
  const scale = textured ? .4 : 1;
  const columns = Math.ceil(fit(w, 20, 90) * scale), particleColumns = Math.ceil(fit(w, 20, 80) * scale);
  const tankHeight = 2 * h / w, spacing = 2 / columns;
  return { width: 2, height: tankHeight, spacing, radius: .2 * spacing,
    gravity: Math.ceil(fit(w, -15, -3)) * (textured ? 1.5 : 1),
    count: Math.max(4, Math.min(limit, Math.ceil(particleColumns * Math.ceil(particleColumns * h / w) / 4) * 4)) };
}

export class AboutContactFluid {
  count = 0;
  x = new Float32Array(0); y = new Float32Array(0);
  vx = new Float32Array(0); vy = new Float32Array(0);
  outX = new Float32Array(0); outY = new Float32Array(0);
  angle = new Float32Array(0); spin = new Float32Array(0);
  active = new Uint8Array(0);
  width = 2; height = 1; radius = .006; gravity = -8;
  pouring = false; emitted = 0; drained = 0; steps = 0;
  private nx = 0; private ny = 0; private h = 1;
  private u = new Float32Array(0); private v = new Float32Array(0);
  private weightU = new Float32Array(0); private weightV = new Float32Array(0);
  private density = new Float32Array(0); private solid = new Uint8Array(0); private cells = new Uint8Array(0);
  private bucketCounts = new Uint32Array(0); private bucketStarts = new Uint32Array(0); private bucketIds = new Uint32Array(0);
  private hashNx = 0; private hashNy = 0; private hashScale = 1;
  private indices = new Int32Array(4); private weights = new Float64Array(4);
  private restDensity = 1.5;
  private hoverRadius = .075; private credit = 0; private randomState = 0x74a923;
  private pointerX = 1; private pointerY = .5; private hasPointer = false;
  private emitterX = 1; private emitterY = .5; private hasPoured = false;
  private collider: Collider | null = null;
  private still = false;

  get emitterPosition() { return [this.emitterX / this.width, this.emitterY / this.height]; }

  private random() { this.randomState = (Math.imul(this.randomState, 1664525) + 1013904223) >>> 0; return this.randomState / 4294967296; }
  configure(pixelWidth: number, pixelHeight: number, limit = 5600, reduced = false, textured = false) {
    const m = aboutContactMetrics(pixelWidth, pixelHeight, limit, textured);
    this.nx = Math.ceil(m.width / m.spacing) + 1; this.ny = Math.ceil(m.height / m.spacing) + 1;
    this.h = Math.max(m.width / this.nx, m.height / this.ny);
    this.width = (this.nx - 2) * this.h; this.height = (this.ny - 2) * this.h;
    this.radius = m.radius; this.gravity = m.gravity; this.count = m.count;
    this.x = new Float32Array(this.count); this.y = new Float32Array(this.count);
    this.vx = new Float32Array(this.count); this.vy = new Float32Array(this.count);
    this.outX = new Float32Array(this.count); this.outY = new Float32Array(this.count);
    this.angle = new Float32Array(this.count); this.spin = new Float32Array(this.count); this.active = new Uint8Array(this.count);
    const cells = this.nx * this.ny;
    this.u = new Float32Array(cells); this.v = new Float32Array(cells);
    this.weightU = new Float32Array(cells); this.weightV = new Float32Array(cells); this.density = new Float32Array(cells);
    this.cells = new Uint8Array(cells); this.solid = new Uint8Array(cells);
    for (let i = 1; i < this.nx - 1; i++) for (let j = 1; j < this.ny - 1; j++) this.solid[i * this.ny + j] = 1;
    this.hashScale = 1 / (2.2 * this.radius);
    this.hashNx = Math.floor(m.width * this.hashScale) + 1; this.hashNy = Math.floor(m.height * this.hashScale) + 1;
    this.bucketCounts = new Uint32Array(this.hashNx * this.hashNy);
    this.bucketStarts = new Uint32Array(this.bucketCounts.length + 1); this.bucketIds = new Uint32Array(this.count);
    // The source estimates density from its first emitted frame, making tank
    // volume depend on refresh rate. The recording's settled surface occupies
    // about 55% of the tank; 1.5 grains/cell reproduces that volume consistently.
    this.randomState = 0x74a923; this.restDensity = 1.5; this.hoverRadius = 150 / Math.max(1, pixelWidth); this.credit = 0;
    this.emitted = 0; this.drained = 0; this.steps = 0; this.pouring = false; this.hasPoured = false; this.hasPointer = false;
    this.emitterX = this.width * .5; this.emitterY = this.height * .5; this.still = reduced; this.collider = null;
    this.x.fill(-10000); this.outX.fill(-10000);
    if (reduced) {
      const columns = Math.max(1, Math.ceil(Math.sqrt(this.count * this.width / (this.height * .55))));
      const rows = Math.ceil(this.count / columns), dx = this.width / columns, dy = this.height * .55 / rows;
      for (let k = 0; k < this.count; k++) {
        this.active[k] = 1; this.angle[k] = this.random() * Math.PI * 2;
        this.outX[k] = this.x[k] = ((k % columns) + .25 + this.random() * .5) * dx;
        this.outY[k] = this.y[k] = (Math.floor(k / columns) + .25 + this.random() * .5) * dy;
      }
    }
  }
  setCollider(rect: Collider) {
    this.collider = rect;
    for (let i = 1; i < this.nx - 1; i++) for (let j = 1; j < this.ny - 1; j++) {
      const x = (i - .5) * this.h, y = (j - .5) * this.h;
      this.solid[i * this.ny + j] = x > rect.left && x < rect.right && y > rect.bottom && y < rect.top ? 0 : 1;
    }
  }
  private hash(x: number, y: number) { return clamp(Math.floor(x * this.hashScale), 0, this.hashNx - 1) * this.hashNy + clamp(Math.floor(y * this.hashScale), 0, this.hashNy - 1); }
  private separate() {
    this.bucketCounts.fill(0);
    for (let k = 0; k < this.count; k++) if (this.active[k]) this.bucketCounts[this.hash(this.x[k], this.y[k])]++;
    let sum = 0;
    for (let c = 0; c < this.bucketCounts.length; c++) { sum += this.bucketCounts[c]; this.bucketStarts[c] = sum; }
    this.bucketStarts[this.bucketCounts.length] = sum;
    for (let k = 0; k < this.count; k++) if (this.active[k]) this.bucketIds[--this.bucketStarts[this.hash(this.x[k], this.y[k])]] = k;
    const distance = 3 * this.radius, squared = distance * distance;
    for (let iteration = 0; iteration < 4; iteration++) {
      for (let k = 0; k < this.count; k++) if (this.active[k]) {
        const cx = Math.floor(this.x[k] * this.hashScale), cy = Math.floor(this.y[k] * this.hashScale);
        for (let i = Math.max(0, cx - 1); i <= Math.min(this.hashNx - 1, cx + 1); i++) for (let j = Math.max(0, cy - 1); j <= Math.min(this.hashNy - 1, cy + 1); j++) {
          const cell = i * this.hashNy + j;
          for (let n = this.bucketStarts[cell]; n < this.bucketStarts[cell + 1]; n++) {
            const other = this.bucketIds[n]; if (other === k) continue;
            const dx = this.x[other] - this.x[k], dy = this.y[other] - this.y[k], d2 = dx * dx + dy * dy;
            if (d2 <= 1e-12 || d2 >= squared) continue;
            const d = Math.sqrt(d2), scale = .5 * (distance - d) / d;
            this.x[k] -= dx * scale; this.y[k] -= dy * scale; this.x[other] += dx * scale; this.y[other] += dy * scale;
          }
        }
      }
    }
  }
  /** Bilinear MAC stencil. Arrays are reused throughout the solver. */
  private stencil(x: number, y: number, offsetX: number, offsetY: number) {
    const gx = (clamp(x, this.h, (this.nx - 1) * this.h) - offsetX) / this.h;
    const gy = (clamp(y, this.h, (this.ny - 1) * this.h) - offsetY) / this.h;
    const i = Math.min(Math.floor(gx), this.nx - 2), j = Math.min(Math.floor(gy), this.ny - 2);
    const fx = gx - i, fy = gy - j;
    this.indices[0] = i * this.ny + j; this.indices[1] = (i + 1) * this.ny + j;
    this.indices[2] = (i + 1) * this.ny + j + 1; this.indices[3] = i * this.ny + j + 1;
    this.weights[0] = (1 - fx) * (1 - fy); this.weights[1] = fx * (1 - fy);
    this.weights[2] = fx * fy; this.weights[3] = (1 - fx) * fy;
  }
  private transferToGrid() {
    this.u.fill(0); this.v.fill(0); this.weightU.fill(0); this.weightV.fill(0); this.density.fill(0);
    for (let c = 0; c < this.cells.length; c++) this.cells[c] = this.solid[c] ? AIR : SOLID;
    for (let k = 0; k < this.count; k++) if (this.active[k]) {
      const cell = clamp(Math.floor((this.x[k] + this.h) / this.h), 0, this.nx - 1) * this.ny + clamp(Math.floor((this.y[k] + this.h) / this.h), 0, this.ny - 1);
      if (this.cells[cell] === AIR) this.cells[cell] = FLUID;
      for (let axis = 0; axis < 2; axis++) {
        this.stencil(this.x[k] + this.h, this.y[k] + this.h, axis === 0 ? 0 : this.h * .5, axis === 0 ? this.h * .5 : 0);
        const grid = axis === 0 ? this.u : this.v, weight = axis === 0 ? this.weightU : this.weightV, velocity = axis === 0 ? this.vx[k] : this.vy[k];
        for (let n = 0; n < 4; n++) { const c = this.indices[n], w = this.weights[n]; grid[c] += velocity * w; weight[c] += w; }
      }
      this.stencil(this.x[k] + this.h, this.y[k] + this.h, this.h * .5, this.h * .5);
      for (let n = 0; n < 4; n++) this.density[this.indices[n]] += this.weights[n];
    }
    for (let i = 0; i < this.nx; i++) for (let j = 0; j < this.ny; j++) {
      const c = i * this.ny + j;
      if (this.weightU[c] > 0) this.u[c] /= this.weightU[c];
      if (this.weightV[c] > 0) this.v[c] /= this.weightV[c];
      if (!this.solid[c] || (i > 0 && !this.solid[c - this.ny])) this.u[c] = 0;
      if (!this.solid[c] || (j > 0 && !this.solid[c - 1])) this.v[c] = 0;
    }
  }

  private project() {
    for (let iteration = 0; iteration < 60; iteration++) for (let i = 1; i < this.nx - 1; i++) for (let j = 1; j < this.ny - 1; j++) {
      const c = i * this.ny + j; if (this.cells[c] !== FLUID) continue;
      const left = this.solid[c - this.ny], right = this.solid[c + this.ny], bottom = this.solid[c - 1], top = this.solid[c + 1];
      const sides = left + right + bottom + top; if (!sides) continue;
      const div = this.u[c + this.ny] - this.u[c] + this.v[c + 1] - this.v[c] - .5 * Math.max(0, this.density[c] - this.restDensity);
      const pressure = -div / sides;
      this.u[c] -= left * pressure; this.u[c + this.ny] += right * pressure;
      this.v[c] -= bottom * pressure; this.v[c + 1] += top * pressure;
    }
  }
  private transferToParticles() {
    for (let k = 0; k < this.count; k++) if (this.active[k]) for (let axis = 0; axis < 2; axis++) {
      this.stencil(this.x[k] + this.h, this.y[k] + this.h, axis === 0 ? 0 : this.h * .5, axis === 0 ? this.h * .5 : 0);
      const grid = axis === 0 ? this.u : this.v, offset = axis === 0 ? this.ny : 1;
      let sum = 0, weight = 0;
      for (let n = 0; n < 4; n++) {
        const c = this.indices[n];
        if (this.cells[c] === AIR && this.cells[c - offset] === AIR) continue;
        sum += this.weights[n] * grid[c]; weight += this.weights[n];
      }
      if (weight > 0) { if (axis === 0) this.vx[k] = sum / weight; else this.vy[k] = sum / weight; }
    }
  }
  update(elapsed: number, px: number, py: number, pointerActive: boolean, held: boolean) {
    if (this.still || !this.count) return;
    const duration = clamp(Number.isFinite(elapsed) ? elapsed : 0, 0, .05); if (!duration) return;
    px = clamp(Number.isFinite(px) ? px : .5, 0, 1) * this.width;
    py = clamp(Number.isFinite(py) ? py : .5, 0, 1) * this.height;
    const previousX = this.hasPointer ? this.pointerX : px, previousY = this.hasPointer ? this.pointerY : py;
    const pointerVX = pointerActive && this.hasPointer ? (px - previousX) / duration : 0;
    const pointerVY = pointerActive && this.hasPointer ? (py - previousY) / duration : 0;
    this.hasPointer = pointerActive; this.pointerX = px; this.pointerY = py;
    this.pouring = held && pointerActive;
    if (this.pouring) { this.emitterX = px; this.emitterY = py; this.hasPoured = true; }
    else if (!this.hasPoured) { this.emitterX = this.width * .5; this.emitterY = this.height * .5; }
    const substeps = Math.max(1, Math.ceil(duration * 60)), dt = duration / substeps;
    for (let step = 0; step < substeps; step++) {
      this.credit += 2000 * dt;
      for (let k = 0; k < this.count && this.credit >= 1; k++) if (!this.active[k]) {
        const t = this.random();
        this.x[k] = this.emitterX + (this.pouring ? (previousX - px) * t : 0) + (this.random() - .5) * .01;
        this.y[k] = this.emitterY + (this.pouring ? (previousY - py) * t : 0) + (this.random() - .5) * .01;
        this.vx[k] = 0; this.vy[k] = (2 + this.random() ** 2 * 3) * this.gravity * .1;
        this.outX[k] = this.x[k]; this.outY[k] = this.y[k]; this.active[k] = 1; this.angle[k] = this.random() * Math.PI * 2;
        this.spin[k] = 0; this.credit--; this.emitted++;
      }
      this.credit = Math.min(34, this.credit);
      for (let k = 0; k < this.count; k++) if (this.active[k]) {
        this.vy[k] += this.gravity * dt; this.x[k] += this.vx[k] * dt; this.y[k] += this.vy[k] * dt;
      }
      this.separate();
      const obstacleRadius = this.hoverRadius * (.2 + .8 * clamp(Math.hypot(pointerVX, pointerVY) / 2, 0, 1));
      for (let k = 0; k < this.count; k++) if (this.active[k]) {
        let x = this.x[k], y = this.y[k];
        if (pointerActive && !this.pouring) {
          const dx = x - px, dy = y - py, d = Math.hypot(dx, dy), radius = obstacleRadius + this.radius;
          if (d < radius && d > 1e-9) { x += dx * (radius - d) / d; y += dy * (radius - d) / d; this.vx[k] = pointerVX * 2; this.vy[k] = pointerVY * 2; }
        }
        const rect = this.collider;
        if (rect && x > rect.left && x < rect.right && y > rect.bottom && y < rect.top) {
          const minimum = Math.min(x - rect.left, rect.right - x, y - rect.bottom, rect.top - y);
          if (minimum === rect.top - y) { y = rect.top; this.vy[k] = Math.max(0, this.vy[k]); }
          else if (minimum === y - rect.bottom) { y = rect.bottom; this.vy[k] = Math.min(0, this.vy[k]); }
          else { x = minimum === x - rect.left ? rect.left : rect.right; this.vx[k] = 0; }
        }
        if (x < this.radius) { x = this.radius; this.vx[k] = 0; }
        if (x > this.width - this.radius) { x = this.width - this.radius; this.vx[k] = 0; }
        if (y < this.radius) {
          if (this.pouring) { this.active[k] = 0; this.x[k] = this.outX[k] = -10000; this.y[k] = this.outY[k] = 0; this.drained++; continue; }
          y = this.radius; this.vy[k] = 0;
        }
        if (y > this.height - this.radius) { y = this.height - this.radius; this.vy[k] = 0; }
        this.x[k] = x; this.y[k] = y;
        const speed = Math.hypot(this.vx[k], this.vy[k]);
        this.spin[k] *= Math.exp(-4 * dt);
        if (speed > 1e-5) this.spin[k] += speed * Math.atan2(Math.sin(Math.atan2(this.vy[k], this.vx[k]) + Math.PI * .5), Math.cos(Math.atan2(this.vy[k], this.vx[k]) + Math.PI * .5));
        this.angle[k] += this.spin[k] * dt;
      }
      this.transferToGrid(); this.project(); this.transferToParticles();
      for (let k = 0; k < this.count; k++) if (this.active[k]) {
        // Native half-step output smoothing, without changing physical state.
        this.outX[k] += (this.x[k] - this.outX[k]) * .5; this.outY[k] += (this.y[k] - this.outY[k]) * .5;
      }
      this.steps++;
    }
  }
}
