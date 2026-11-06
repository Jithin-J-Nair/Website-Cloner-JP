import * as THREE from "three";

/** Original bust isocontours informed by the supplied recording (7–14 s).
 * These are shoulder/neck loops, not the landscape contours stretched up a wall.
 * Geometry is seeded once; the About scene owns time, visibility and disposal.
 */
export function createAboutBodyContours() {
  const vertices: number[] = [], glow: number[] = [];
  const sample = (level: number, angle: number) => {
    const t = level / 61;
    const rx = .27 + 3.7 * Math.pow(t, .72), rz = .23 + 1.45 * t;
    const ripple = .045 * Math.sin(angle * 13 + t * 29) + .028 * Math.sin(angle * 23 - t * 37);
    const x = Math.cos(angle) * (rx + ripple);
    const shoulder = Math.exp(-Math.pow((Math.abs(x) - 1.42) / .72, 2));
    const front = Math.max(0, Math.sin(angle));
    // Trapezius rises into two shoulders; sternum and pectoral volumes break
    // the former flat conical rings into an anatomical, asymmetric chest.
    const y = -1.12 - 1.5 * t + shoulder * .96 * Math.pow(t, .3)
      - .28 * Math.exp(-x * x / .12) * front * t
      + .08 * Math.sin(angle * 5 + t * 17) * t;
    const z = Math.sin(angle) * (rz + ripple) - .1 + shoulder * front * .26;
    return [x, y, z];
  };
  for (let level = 0; level < 62; level++) {
    for (let i = 0; i < 160; i++) {
      const a = sample(level, i / 160 * Math.PI * 2);
      vertices.push(...a, ...sample(level, (i + 1) / 160 * Math.PI * 2));
      if (i % 4 === 0) glow.push(...a);
    }
  }
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 } };
  const vertexShader = `uniform float uTime; varying vec3 vLocal;
    void main(){ vLocal=position; vec3 p=position;
      p.z+=sin(p.x*3.1+uTime*.65+p.y*2.)*.018;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);
      gl_PointSize=7.; }`;
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader,
    fragmentShader: `uniform float uTime,uOpacity; varying vec3 vLocal;
      void main(){
        float pulse=pow(.5+.5*sin(vLocal.x*4.3+vLocal.y*5.5+sin(vLocal.z*11.)*.9-uTime*.45),6.);
        float shoulder=exp(-pow((abs(vLocal.x)-1.55)/.56,2.));
        float neck=exp(-pow(vLocal.x/.42,2.))*exp(-pow((vLocal.y+1.35)/.6,2.));
        float front=smoothstep(-.6,.4,vLocal.z);
        float fade=1.-smoothstep(2.7,3.6,abs(vLocal.x));
        vec3 silver=mix(vec3(.25,.38,.43),vec3(.88,.96,.92),pulse);
        gl_FragColor=vec4(silver,uOpacity*fade*front*(.09+pulse*(.55+shoulder*1.2)+neck*.22));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const group = new THREE.Group(); group.add(new THREE.LineSegments(geometry, material));
  const glowGeometry = new THREE.BufferGeometry();
  glowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(glow, 3));
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader,
    fragmentShader: `uniform float uTime,uOpacity; varying vec3 vLocal;
      void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
        float pulse=pow(.5+.5*sin(vLocal.x*3.3+vLocal.y*5.8-uTime*.85),15.);
        float alpha=pow(1.-r*2.,2.)*pulse*.24*uOpacity*smoothstep(-.4,.4,vLocal.z);
        gl_FragColor=vec4(.68,.85,.82,alpha);
      }`,
  });
  group.add(new THREE.Points(glowGeometry, glowMaterial));
  let disposed = false;
  return { group, uniforms, dispose() {
    if (disposed) return; disposed = true;
    geometry.dispose(); glowGeometry.dispose(); material.dispose(); glowMaterial.dispose();
  } };
}
