import * as THREE from "three";

/** Original two-emitter glyph flow: gravity-fed side ribbons meet and rebound
 * into a full-width sloshing reservoir. Closed-form advection, NOT a FLIP/SPH
 * fluid solve or reference playback. One bounded draw, one owner clock. */
export function createAboutContactWave(requestedCount = 3600) {
  const count = Math.max(120, Math.min(5600, Math.floor(Number.isFinite(requestedCount) ? requestedCount : 3600)));
  const columns = Math.max(12, Math.round(Math.sqrt(count * 2.25)));
  const rows = Math.ceil(count / columns);
  const seed = new Float32Array(count * 4);
  for (let i = 0; i < count; i++) {
    const x = i % columns, y = Math.floor(i / columns);
    seed.set([x / (columns - 1) * 2 - 1, y / Math.max(1, rows - 1),
      Math.sin(i * 127.1) * .45, (Math.sin(i * 311.7) + 1) * .5], i * 4);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seed, 4));
  const uniforms = {
    uTime: { value: 0 }, uProgress: { value: 0 }, uReduced: { value: 0 },
    uViewport: { value: new THREE.Vector2(16, 9) }, uPointer: { value: new THREE.Vector3() },
    uPixelRatio: { value: 1 },
  };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false,
    vertexShader: `attribute vec4 aSeed;
      uniform float uTime,uProgress,uReduced,uPixelRatio;
      uniform vec2 uViewport; uniform vec3 uPointer;
      varying float vShape,vAngle,vAlpha;
      void main(){
        float t=uTime*(1.-uReduced);
        float W=uViewport.x,H=uViewport.y;
        float h=clamp(aSeed.y/.76,0.,1.);
        float jitter=aSeed.z;
        vec3 p=vec3(aSeed.x*W*.54+jitter*W*.013,0.,jitter*.12);
        // Most grains remain in the broad reservoir. Counterpropagating packets
        // converge on the centre, raise a crest, then pass back toward the sides.
        float crestX=(-.55+fract(t*.13)*1.10)*W;
        float incoming=exp(-pow((p.x-crestX)/(W*.13),2.))
          +exp(-pow((p.x+crestX)/(W*.13),2.));
        float surface=(sin(p.x/W*9.-t*.9)*.045
          +sin(p.x/W*15.+t*.63)*.025+incoming*.115)*H;
        p.y=(-.53+h*.46)*H+surface*pow(h,1.8)+(aSeed.w-.5)*H*.014;
        p.x+=sin(h*5.+t*.65)*W*.018*h;
        p.x+=sin(p.x/W*11.-t*.75)*W*.012*h*h;
        if(aSeed.y>.76 && uReduced<.5){
          // Symmetric upper-corner emitters. Descent accelerates under gravity;
          // inward momentum is redirected into an upward/outward collision fan.
          float side=aSeed.z<0.?-1.:1.;
          float age=fract(t*.19+aSeed.w);
          float lane=aSeed.x*W*.043;
          if(age<.68){
            float fall=age/.68;
            p.x=side*(.55-.47*pow(fall,3.))*W+lane*(.4+sin(fall*3.14159));
            p.y=(.62-.98*fall*fall)*H;
          }else{
            float splash=(age-.68)/.32;
            p.x=side*mix(.08,.38,splash)*W+lane;
            p.y=(-.36+sin(splash*3.14159)*.44-splash*.14)*H;
          }
          p.y+=jitter*H*.016;
        }
        vec2 d=p.xy-uPointer.xy;float r=length(d);
        float influence=exp(-r*r/pow(H*.23,2.))*uPointer.z*(1.-uReduced);
        float angle=influence*2.1;
        mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
        p.xy+=rot*d-d;
        p.xy+=normalize(d+vec2(.001))*influence*H*.065;
        p.y+=influence*H*.16;
        vec4 eye=modelViewMatrix*vec4(p,1.);
        float perspective=10./max(3.,-eye.z);
        gl_PointSize=(6.5+aSeed.w*2.0)*uPixelRatio*perspective;
        vShape=mod(floor((aSeed.x+1.)*11.+aSeed.y*17.),4.);
        vAngle=aSeed.w*6.28+t*(.18+jitter*.25);
        vAlpha=.84+.16*aSeed.w;
        gl_Position=projectionMatrix*eye;
      }`,
    fragmentShader: `varying float vShape,vAngle,vAlpha;
      void main(){
        vec2 p=(gl_PointCoord-.5)*2.;
        p=mat2(cos(vAngle),-sin(vAngle),sin(vAngle),cos(vAngle))*p;
        float d;
        if(vShape<.5)d=length(p)-.74;
        else if(vShape<1.5)d=min(max(abs(p.x)-.18,abs(p.y)-.86),max(abs(p.x)-.86,abs(p.y)-.18));
        else if(vShape<2.5)d=max(abs(p.x),abs(p.y))-.66;
        else d=max(abs(p.x)*.866+p.y*.5,-p.y)-.48;
        float alpha=(1.-smoothstep(-.12,.12,d))*vAlpha;
        if(alpha<.01)discard;
        gl_FragColor=vec4(vec3(1.),alpha);
      }`,
  });
  const group = new THREE.Group(); group.add(new THREE.Points(geometry, material));
  let disposed = false;
  return { group, uniforms, count, setTime(time: number) { uniforms.uTime.value = Number.isFinite(time) ? time : 0; },
    dispose() { if (disposed) return; disposed = true; geometry.dispose(); material.dispose(); } };
}
