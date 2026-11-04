import * as THREE from "three";

export interface HomePhysicsStep {
  collisions: number;
  influencedPieces: number;
  interactionEnergy: number;
}

function closestSegmentPoints(
  p1: THREE.Vector3, q1: THREE.Vector3,
  p2: THREE.Vector3, q2: THREE.Vector3,
  outA: THREE.Vector3, outB: THREE.Vector3
): number {
  const d1x=q1.x-p1.x, d1y=q1.y-p1.y, d1z=q1.z-p1.z;
  const d2x=q2.x-p2.x, d2y=q2.y-p2.y, d2z=q2.z-p2.z;
  const rx=p1.x-p2.x, ry=p1.y-p2.y, rz=p1.z-p2.z;
  const a=d1x*d1x+d1y*d1y+d1z*d1z, e=d2x*d2x+d2y*d2y+d2z*d2z;
  const f=d2x*rx+d2y*ry+d2z*rz, c=d1x*rx+d1y*ry+d1z*rz;
  const b=d1x*d2x+d1y*d2y+d1z*d2z;
  let u=0, v=0;
  if(a<1e-8) v=THREE.MathUtils.clamp(f/e,0,1);
  else if(e<1e-8) u=THREE.MathUtils.clamp(-c/a,0,1);
  else {
    const den=a*e-b*b;
    if(den>1e-8) u=THREE.MathUtils.clamp((b*f-c*e)/den,0,1);
    v=(b*u+f)/e;
    if(v<0){v=0;u=THREE.MathUtils.clamp(-c/a,0,1);}
    else if(v>1){v=1;u=THREE.MathUtils.clamp((b-c)/a,0,1);}
  }
  outA.set(p1.x+d1x*u,p1.y+d1y*u,p1.z+d1z*u);
  outB.set(p2.x+d2x*v,p2.y+d2y*v,p2.z+d2z*v);
  return outA.distanceToSquared(outB);
}

/**
 * Small deterministic rigid-body solver for the six-arm home connectors.
 * Each connector is represented by the union of three perpendicular capsules.
 * Spawn poses are not rest poses: only a weak shared centre force gathers the cloud.
 */
export class HomeConnectorPhysics {
  private readonly meshes: THREE.Mesh[];
  private readonly positions: THREE.Vector3[];
  private readonly linear: THREE.Vector3[];
  private readonly angular: THREE.Vector3[];
  private readonly starts: THREE.Vector3[][];
  private readonly ends: THREE.Vector3[][];
  private readonly basis = [
    new THREE.Vector3(1,0,0),
    new THREE.Vector3(0,1,0),
    new THREE.Vector3(0,0,1),
  ];
  private readonly closestA = new THREE.Vector3();
  private readonly closestB = new THREE.Vector3();
  private readonly bestA = new THREE.Vector3();
  private readonly bestB = new THREE.Vector3();
  private readonly normal = new THREE.Vector3();
  private readonly rA = new THREE.Vector3();
  private readonly rB = new THREE.Vector3();
  private readonly omegaRA = new THREE.Vector3();
  private readonly omegaRB = new THREE.Vector3();
  private readonly relative = new THREE.Vector3();
  private readonly crossA = new THREE.Vector3();
  private readonly crossB = new THREE.Vector3();
  private readonly angularA = new THREE.Vector3();
  private readonly angularB = new THREE.Vector3();
  private readonly impulse = new THREE.Vector3();
  private readonly friction = new THREE.Vector3();
  private readonly tangent = new THREE.Vector3();
  private readonly temp = new THREE.Vector3();
  private readonly axis = new THREE.Vector3();
  private readonly rotation = new THREE.Quaternion();
  private readonly touched: boolean[];
  private accumulator = 0;
  interactionEnergy = 0;

  private readonly stepSize = 1/120;
  private readonly iterations = 6;

  constructor(
    meshes: THREE.Mesh[],
    positions: THREE.Vector3[],
    linearVelocities: THREE.Vector3[],
    angularVelocities: THREE.Vector3[],
  ) {
    this.meshes=meshes;
    this.positions=positions;
    this.linear=linearVelocities;
    this.angular=angularVelocities;
    this.starts=meshes.map(()=>[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]);
    this.ends=meshes.map(()=>[new THREE.Vector3(),new THREE.Vector3(),new THREE.Vector3()]);
    this.touched=meshes.map(()=>false);
  }

  step(
    frameDt: number,
    timeSeconds: number,
    pointerRay: THREE.Ray | null,
    pointerSweep: THREE.Vector3,
  ): HomePhysicsStep {
    this.touched.fill(false);
    this.accumulator += Math.min(frameDt,0.05);
    let collisions=0;
    let steps=0;
    while(this.accumulator>=this.stepSize && steps<6) {
      const h=this.stepSize;
      const time=timeSeconds+(steps*h);
      this.interactionEnergy*=Math.exp(-2.4*h);
      this.interactionEnergy=Math.min(1,this.interactionEnergy+influence*h*2.8);
      // Free flight, light gravity and a shared soft attractor. The restoring force
      // grows only after a body leaves the loose cluster; it never targets a slot.
      for(let i=0;i<this.meshes.length;i++) {
        const p=this.positions[i],v=this.linear[i],w=this.angular[i];
        const radius=p.length();
        const outside=THREE.MathUtils.clamp((radius-1.9)/1.6,0,1);
        const smoothOutside=outside*outside*(3-2*outside);
        const returnK=0.045+smoothOutside*0.92;
        const phase=time*0.31+i*2.399963;
        v.x+=(-p.x*returnK+Math.sin(phase*1.17)*0.11)*h;
        v.y+=(-p.y*returnK-0.16+Math.cos(phase*0.83)*0.095)*h;
        v.z+=(-p.z*returnK+Math.sin(phase*0.69+0.8)*0.085)*h;
        v.multiplyScalar(Math.exp(-0.55*h));

        if(pointerRay) {
          pointerRay.closestPointToPoint(p,this.temp);
          this.normal.subVectors(p,this.temp);
          const d=this.normal.length();
          const reach=2.85*this.meshes[i].scale.x+0.24;
          if(d<reach) {
            if(d<0.015) this.normal.set(i%2===0?1:-1,((i%3)-1)*0.35,0.2).normalize();
            else this.normal.multiplyScalar(1/d);
            const influence=Math.pow(1-d/reach,2);
            // Hovering repels continuously; pointer travel adds a swipe impulse.
            v.addScaledVector(this.normal,175*influence*h);
            v.addScaledVector(pointerSweep,2.8*influence*h);
            w.addScaledVector(this.normal.cross(this.axis.set(0,0,1)).normalize(),pointerSweep.length()*0.12*influence*h);
            this.interactionEnergy=Math.min(1,this.interactionEnergy+influence*h*3.2);
            this.touched[i]=true;
          }
        }

        const maxSpeed=12.5;\n        if(v.length()>maxSpeed) v.setLength(maxSpeed);\n        p.addScaledVector(v,h);
        const speed=w.length();
        if(speed>1e-5) {
          this.axis.copy(w).multiplyScalar(1/speed);
          this.rotation.setFromAxisAngle(this.axis,speed*h);
          this.meshes[i].quaternion.premultiply(this.rotation).normalize();
        }
        w.multiplyScalar(Math.exp(-0.18*h));
      }

      // Correct capsule geometry: a 0.335-radius arm whose straight section ends
      // at 0.665, so the collider's total half-length is exactly the mesh's 1.0.
      for(let i=0;i<this.meshes.length;i++) {
        const mesh=this.meshes[i];
        for(let k=0;k<3;k++) {
          this.axis.copy(this.basis[k]).applyQuaternion(mesh.quaternion).normalize();
          const half=0.665*mesh.scale.x;
          this.starts[i][k].copy(this.positions[i]).addScaledVector(this.axis,-half);
          this.ends[i][k].copy(this.positions[i]).addScaledVector(this.axis,half);
        }
      }

      // Oriented arm-to-arm sequential impulses. A connector pair is checked across
      // all nine arm combinations; normal impulse, friction and torque are coupled.
      for(let pass=0;pass<this.iterations;pass++) {
        for(let i=0;i<this.meshes.length;i++) for(let j=i+1;j<this.meshes.length;j++) {
          const scaleA=this.meshes[i].scale.x,scaleB=this.meshes[j].scale.x;
          if(this.positions[i].distanceToSquared(this.positions[j])>Math.pow(1.25*(scaleA+scaleB),2)) continue;
          let best=Infinity;
          for(let a=0;a<3;a++) for(let b=0;b<3;b++) {
            const d=closestSegmentPoints(this.starts[i][a],this.ends[i][a],this.starts[j][b],this.ends[j][b],this.closestA,this.closestB);
            if(d<best) {best=d;this.bestA.copy(this.closestA);this.bestB.copy(this.closestB);}
          }
          const radiusA=0.335*scaleA,radiusB=0.335*scaleB;
          const minDistance=radiusA+radiusB;
          if(best>=minDistance*minDistance) continue;
          const distance=Math.sqrt(Math.max(best,1e-10));
          const penetration=minDistance-distance;
          this.normal.subVectors(this.bestB,this.bestA);
          if(this.normal.lengthSq()<1e-8) {
            this.normal.subVectors(this.positions[j],this.positions[i]);
            if(this.normal.lengthSq()<1e-8) this.normal.set(i%2===0?1:-1,0.15,0.2);
          }
          this.normal.normalize();

          const massA=scaleA*scaleA*scaleA,massB=scaleB*scaleB*scaleB;
          const invMassA=1/massA,invMassB=1/massB;
          const invIA=1/(0.40*massA*scaleA*scaleA),invIB=1/(0.40*massB*scaleB*scaleB);
          const correction=Math.max(penetration-0.002,0)*0.42/(invMassA+invMassB);
          if(correction>0) {
            const moveA=correction*invMassA,moveB=correction*invMassB;
            this.positions[i].addScaledVector(this.normal,-moveA);
            this.positions[j].addScaledVector(this.normal,moveB);
            this.bestA.addScaledVector(this.normal,-moveA);
            this.bestB.addScaledVector(this.normal,moveB);
            for(let k=0;k<3;k++) {
              this.starts[i][k].addScaledVector(this.normal,-moveA);this.ends[i][k].addScaledVector(this.normal,-moveA);
              this.starts[j][k].addScaledVector(this.normal,moveB);this.ends[j][k].addScaledVector(this.normal,moveB);
            }
          }

          this.rA.copy(this.bestA).addScaledVector(this.normal,radiusA).sub(this.positions[i]);
          this.rB.copy(this.bestB).addScaledVector(this.normal,-radiusB).sub(this.positions[j]);
          this.omegaRA.crossVectors(this.angular[i],this.rA);
          this.omegaRB.crossVectors(this.angular[j],this.rB);
          this.relative.copy(this.linear[j]).add(this.omegaRB).sub(this.linear[i]).sub(this.omegaRA);
          const closing=this.relative.dot(this.normal);
          if(closing<0) {
            this.crossA.crossVectors(this.rA,this.normal).multiplyScalar(invIA);
            this.crossB.crossVectors(this.rB,this.normal).multiplyScalar(invIB);
            this.angularA.crossVectors(this.crossA,this.rA);
            this.angularB.crossVectors(this.crossB,this.rB);
            const denominator=invMassA+invMassB+this.normal.dot(this.angularA.add(this.angularB));
            const normalImpulse=-(1+0.16)*closing/Math.max(denominator,1e-6);
            this.impulse.copy(this.normal).multiplyScalar(normalImpulse);
            this.linear[i].addScaledVector(this.impulse,-invMassA);
            this.linear[j].addScaledVector(this.impulse,invMassB);
            this.temp.crossVectors(this.rA,this.impulse);
            this.angular[i].addScaledVector(this.temp,-invIA);
            this.temp.crossVectors(this.rB,this.impulse);
            this.angular[j].addScaledVector(this.temp,invIB);

            this.omegaRA.crossVectors(this.angular[i],this.rA);
            this.omegaRB.crossVectors(this.angular[j],this.rB);
            this.relative.copy(this.linear[j]).add(this.omegaRB).sub(this.linear[i]).sub(this.omegaRA);
            this.tangent.copy(this.relative).addScaledVector(this.normal,-this.relative.dot(this.normal));
            const tangentSpeed=this.tangent.length();
            if(tangentSpeed>1e-5) {
              this.tangent.multiplyScalar(1/tangentSpeed);
              const jt=Math.min(tangentSpeed/(invMassA+invMassB),normalImpulse*0.24);
              this.friction.copy(this.tangent).multiplyScalar(-jt);
              this.linear[i].addScaledVector(this.friction,-invMassA);
              this.linear[j].addScaledVector(this.friction,invMassB);
              this.temp.crossVectors(this.rA,this.friction);
              this.angular[i].addScaledVector(this.temp,-invIA);
              this.temp.crossVectors(this.rB,this.friction);
              this.angular[j].addScaledVector(this.temp,invIB);
            }
          }
          collisions++;
        }
      }
      this.accumulator-=h;
      steps++;
    }

    if(this.interactionEnergy<0.00001) this.interactionEnergy=0;
    for(let i=0;i<this.meshes.length;i++) this.meshes[i].position.copy(this.positions[i]);
    return {
      collisions,
      influencedPieces:this.touched.reduce((count,value)=>count+(value?1:0),0),
      interactionEnergy:this.interactionEnergy,
    };
  }
}
