import * as THREE from "three";

/** Original coherent glyph sheet, observed as a mound → broad liquid-like wave
 * in the supplied recording at 26–31 s. Analytical 3D advection, not a FLIP solve,
 * screen-recording playback, or a simulation imported from the reference. */
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
        float spread=smoothstep(.015,.20,uProgress);
        float h=aSeed.y;
        float width=mix(pow(1.-h,1.4)*.32, .55, spread)*uViewport.x;
        vec3 p=vec3(aSeed.x*width,(-.52+h*mix(.62,.57,spread))*uViewport.y,aSeed.z);
        float wave=sin(p.x*.7-t*.65)*.20+sin(p.x*1.31+t*.38)*.10;
        p.y+=wave*smoothstep(.1,.9,h)*spread;
        p.x+=sin(p.y*1.1+t*.3)*.14*spread;
        vec2 d=p.xy-uPointer.xy;float r=length(d);
        float influence=exp(-r*r/5.5)*uPointer.z*(1.-uReduced);
        float angle=influence*1.9;
        mat2 rot=mat2(cos(angle),-sin(angle),sin(angle),cos(angle));
        p.xy+=rot*d-d;
        p.xy+=normalize(d+vec2(.001))*influence*.9;
        // A broad advected wake lifts the free surface into a curling crest.
        p.y+=influence*(1.1+sin(p.x*1.4-t)*.35);
        p.z+=sin(p.x*.8+p.y*1.3-t*.5)*.16;
        vec4 eye=modelViewMatrix*vec4(p,1.);
        float perspective=10./max(3.,-eye.z);
        gl_PointSize=(7.0+aSeed.w*3.0)*uPixelRatio*perspective;
        vShape=mod(floor((aSeed.x+1.)*5.+aSeed.y*6.),4.);
        vAngle=aSeed.w*6.28+t*.12;
        vAlpha=.82+.18*aSeed.w;
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
