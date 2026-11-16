import * as THREE from "three";
import type { HomePhysicsStep } from "./home-free-body-physics";

/** Native cyrb128/sfc32 seed stream. Isolated: never replace global Math.random. */
export function createHomeSeed(seed: string) {
  let a = 1779033703, b = 3144134277, c = 1013904242, d = 2773480762;
  for (let i = 0; i < seed.length; i++) {
    const k = seed.charCodeAt(i);
    a = b ^ Math.imul(a ^ k, 597399067); b = c ^ Math.imul(b ^ k, 2869860233);
    c = d ^ Math.imul(c ^ k, 951274213); d = a ^ Math.imul(d ^ k, 2716044179);
  }
  const aa = Math.imul(c ^ (a >>> 18), 597399067), bb = Math.imul(d ^ (b >>> 22), 2869860233);
  const cc = Math.imul(a ^ (c >>> 17), 951274213), dd = Math.imul(b ^ (d >>> 19), 2716044179);
  a = aa; b = bb; c = cc; d = dd;
  return () => { a |= 0; b |= 0; c |= 0; d |= 0; const n = (((a + b) | 0) + d) | 0; d = (d + 1) | 0; a = b ^ (b >>> 9); b = (c + (c << 3)) | 0; c = (c << 21) | (c >>> 11); c = (c + n) | 0; return (n >>> 0) / 4294967296; };
}

export const HOME_NATIVE_MATERIALS = [
  "blue-rough", "blue-rough", "blue-gloss", "white-rough", "white-rough", "white-rough", "white-gloss",
  "black-rough", "black-rough", "black-rough", "black-gloss",
  "blue-rough", "blue-rough", "blue-gloss", "white-rough", "white-rough", "white-rough", "white-gloss",
  "black-rough", "black-rough", "black-rough", "black-gloss", "white-glass", "blue-glass",
] as const;

export class HomeNativeBody {
  readonly position = new THREE.Vector3();
  readonly spawn = new THREE.Vector3();
  readonly velocity = new THREE.Vector3();
  readonly quaternion = new THREE.Quaternion();
  readonly radius = 1.05;
  readonly mass = Math.PI * this.radius ** 3 * 1.333333;
  readonly inertia = this.mass * this.radius ** 2 * .4;
  frictionTotal = 0;
  constructor(random: () => number, glass: boolean) {
    this.position.set((random() - .5) * 12, (random() - .5) * 12, glass ? 7 + random() : (random() - .5) * 6);
    this.spawn.copy(this.position); this.velocity.copy(this.position).multiplyScalar(-2);
  }
}

/** Source spherical-contact solver, NOT capsule contacts/anchored oscillators.
 * Fixed bounded integration is a browser stability adaptation; source constants,
 * seed, equal radii, contact drag and velocity-led rotation remain explicit. */
export class HomeNativePhysics {
  readonly bodies: HomeNativeBody[];
  readonly stats: HomePhysicsStep = { collisions: 0, influencedPieces: 0, interactionEnergy: 0, kineticEnergy: 0, maxTravel: 0, meanRadius: 0 };
  private readonly pos = new THREE.Vector3();
  private readonly vel = new THREE.Vector3();
  private readonly otherPos = new THREE.Vector3();
  private readonly otherVel = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();
  private readonly axis = new THREE.Vector3();
  private readonly temp = new THREE.Vector3();
  private readonly perpendicular = new THREE.Vector3();
  private readonly mouse = new THREE.Vector3();
  private readonly previousMouse = new THREE.Vector3();
  private readonly mouseBA = new THREE.Vector3();
  private readonly push = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();
  private readonly touched: boolean[];
  private readonly impulseRandom = createHomeSeed("home-click-impulse");
  private accumulator = 0;
  private pointerWasActive = false;
  private impulsePending = false;
  interactionEnergy = 0;
  pointerDisplacement = 0;
  constructor(mobile: boolean) {
    const random = createHomeSeed("balloonBody-25");
    this.bodies = Array.from({ length: mobile ? 22 : 24 }, (_, i) => new HomeNativeBody(random, i >= 22));
    this.touched = this.bodies.map(() => false);
    // Stable reduced-motion fallback shows the settled source cloud, not the spawn scatter.
    for (let i = 0; i < 100; i++) this.integrate(1 / 60, null);
  }
  impulse() {
    for (const body of this.bodies) {
      this.temp.copy(body.position).multiplyScalar(-10);
      this.axis.set(this.impulseRandom() - .5, this.impulseRandom() - .5, this.impulseRandom() - .5).multiplyScalar(80);
      this.temp.add(this.axis).multiplyScalar(1 / body.mass); body.velocity.negate().add(this.temp);
    }
    this.interactionEnergy = 1; this.impulsePending = true;
  }
  step(elapsed: number, ray: THREE.Ray | null, reduced: boolean): HomePhysicsStep {
    this.stats.collisions = 0; this.pointerDisplacement = 0; this.touched.fill(false);
    // A newly delivered click/key pulse did not exist during the previous GPU
    // frame. Do not age it by that whole stalled interval before first display.
    if (!ray && !this.impulsePending) this.interactionEnergy *= Math.exp(-2.4 * Math.max(0, elapsed));
    this.impulsePending = false;
    if (this.interactionEnergy < .00001) this.interactionEnergy = 0;
    if (!reduced) {
      this.accumulator += Math.min(.05, Math.max(0, elapsed));
      let steps = 0;
      while (this.accumulator >= 1 / 60 && steps++ < 3) { this.integrate(1 / 60, ray); this.accumulator -= 1 / 60; }
    }
    let kinetic = 0, radius = 0, travel = 0;
    for (const body of this.bodies) { kinetic += body.velocity.lengthSq(); radius += body.position.length(); travel = Math.max(travel, body.position.distanceTo(body.spawn)); }
    let influenced = 0; for (const touched of this.touched) if (touched) influenced++;
    this.stats.influencedPieces = influenced;
    this.stats.interactionEnergy = reduced ? 0 : this.interactionEnergy;
    this.stats.kineticEnergy = reduced ? 0 : kinetic;
    this.stats.meanRadius = radius / this.bodies.length; this.stats.maxTravel = travel;
    return this.stats;
  }
  private integrate(h: number, ray: THREE.Ray | null) {
    if (ray) {
      const t = Math.abs(ray.direction.z) > .00001 ? -ray.origin.z / ray.direction.z : 0;
      this.mouse.copy(ray.origin).addScaledVector(ray.direction, t);
      if (!this.pointerWasActive) this.previousMouse.copy(this.mouse);
      this.push.copy(this.mouse).sub(this.previousMouse).multiplyScalar(.12 / h);
      this.previousMouse.copy(this.mouse); this.mouseBA.copy(this.mouse).sub(ray.origin);
    }
    this.pointerWasActive = ray !== null;
    for (let i = 0; i < this.bodies.length; i++) {
      const body = this.bodies[i];
      body.velocity.addScaledVector(body.position, -40 * h / body.mass / (1 + body.frictionTotal)); body.frictionTotal *= .5;
      this.pos.copy(body.position); this.vel.copy(body.velocity);
      for (let j = i + 1; j < this.bodies.length; j++) {
        const other = this.bodies[j]; this.otherPos.copy(other.position); this.otherVel.copy(other.velocity);
        this.normal.copy(this.pos).sub(this.otherPos); const distance = this.normal.length(), radii = body.radius + other.radius;
        if (distance < radii) {
          body.frictionTotal += 2; other.frictionTotal += 2;
          if (distance < 1e-8) this.normal.set(1, 0, 0); else this.normal.multiplyScalar(1 / distance);
          this.temp.copy(this.normal).multiplyScalar(.5 * (distance - radii)); this.pos.sub(this.temp); this.otherPos.add(this.temp);
          // Native code normalizes the negative penetration vector before the impulse.
          this.normal.negate(); const m = this.vel.dot(this.normal), s = this.otherVel.dot(this.normal);
          const targetM = (body.mass * m + other.mass * s - other.mass * (m - s) * .8) / (body.mass + other.mass);
          const targetS = (body.mass * m + other.mass * s - body.mass * (s - m) * .8) / (body.mass + other.mass);
          this.vel.addScaledVector(this.normal, (targetM - m) / 3); this.otherVel.addScaledVector(this.normal, (targetS - s) / 3);
          other.position.copy(this.otherPos); other.velocity.copy(this.otherVel); this.stats.collisions++;
        }
      }
      if (ray) {
        this.axis.copy(this.pos).sub(ray.origin);
        const fraction = this.axis.dot(this.mouseBA) / Math.max(1e-8, this.mouseBA.lengthSq());
        const distance = this.axis.sub(this.temp.copy(this.mouseBA).multiplyScalar(fraction)).length() - body.radius - .025;
        if (distance < 0) {
          this.axis.copy(this.pos).sub(ray.origin).cross(this.mouseBA).normalize();
          this.perpendicular.copy(this.mouseBA).cross(this.axis).normalize();
          this.pos.addScaledVector(this.perpendicular, -.1 * distance);
          this.pointerDisplacement += -.1 * distance;
          this.vel.addScaledVector(this.perpendicular, -.012 * distance / h).add(this.push);
          this.touched[i] = true; this.interactionEnergy = Math.min(1, this.interactionEnergy + .12);
        }
      }
      const length = this.pos.length(); this.axis.set(1, 1, 1).normalize();
      if (length > 0) {
        const p = (1 - Math.abs(this.axis.dot(this.temp.copy(this.pos).normalize()))) * h * Math.min(1, length / 2) * .5 * (i % 2 * 2 - 1);
        this.rotation.setFromAxisAngle(this.axis, p);
        this.temp.copy(this.pos).applyQuaternion(this.rotation).sub(this.pos); this.vel.add(this.temp);
      }
      this.axis.cross(this.vel); const torque = this.axis.length() / body.inertia;
      if (torque > 0) { this.axis.normalize(); this.rotation.setFromAxisAngle(this.axis, torque * h); body.quaternion.premultiply(this.rotation).normalize(); }
      body.position.copy(this.pos).addScaledVector(this.vel, h); body.velocity.copy(this.vel).multiplyScalar(Math.pow(.2, h));
    }
  }
}
