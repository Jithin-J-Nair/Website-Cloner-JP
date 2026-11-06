import * as THREE from "three";

/** Front-surface isodepth contours of an original anatomical torso. The former
 * nested expanding ellipses made a poncho; here clavicles, neck, pectorals and
 * deltoids are independent volumes, intersected by marching squares. No
 * proprietary bust geometry. Seed once; the existing world owns its lifetime. */
export function createAboutBodyContours() {
  const nx = 192, ny = 112, left = -3.7, bottom = -3.7, dx = 7.4 / nx, dy = 3.04 / ny;
  const depth = new Float32Array((nx + 1) * (ny + 1));
  const gaussian = (x: number, y: number, cx: number, cy: number, rx: number, ry: number) =>
    Math.exp(-(((x - cx) / rx) ** 2) - ((y - cy) / ry) ** 2);
  const front = (x: number, y: number, cx: number, cy: number, rx: number, ry: number, rz: number) => {
    const r = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
    return r < 1 ? rz * Math.sqrt(1 - r) : 0;
  };
  const union = (a: number, b: number) => {
    if (a <= 0 || b <= 0) return Math.max(a, b);
    const h = THREE.MathUtils.clamp(.5 + .5 * (a - b) / .18, 0, 1);
    return THREE.MathUtils.lerp(b, a, h) + .18 * h * (1 - h);
  };
  const surface = (x: number, y: number) => {
    // Front intersections of smoothly united ellipsoids. Their real curved
    // boundaries replace a masked polygon, which produced serrated shoulders.
    let z = front(x, y, 0, -3.3, 3.25, 1.8, .70);
    z = union(z, front(x, y, 0, -1.35, .42, .69, .88));
    for (const side of [-1, 1]) {
      z = union(z, front(x, y, side * .76, -1.65, 1.06, .59, .64));
      z = union(z, front(x, y, side * 2.19, -2.45, .98, 1.25, .89));
      z = union(z, front(x, y, side * 1.02, -2.50, 1.23, 1.01, 1.06));
    }
    if (z <= 0) return 0;
    const ax = Math.abs(x);
    const clavicle = -.085 * Math.exp(-(((y + 1.65 + ax * .10) / .12) ** 2)) * Math.exp(-x * x / 4.7);
    const sternum = -.13 * gaussian(x, y, 0, -2.35, .18, .8);
    const detail = .012 * Math.sin(x * 23 + y * 17) + .008 * Math.sin(x * 43 - y * 31)
      + .019 * Math.sin(x * 9.8 + Math.sin(y * 11));
    return Math.max(0, z + (clavicle + sternum + detail) * Math.min(1, z * 4));
  };
  for (let j = 0; j <= ny; j++) for (let i = 0; i <= nx; i++) depth[i + j * (nx + 1)] = surface(left + i * dx, bottom + j * dy);
  const vertices: number[] = [], sparks: number[] = [];
  const edges = [[0, 1], [1, 2], [2, 3], [3, 0]];
  const corners = [[0, 0], [1, 0], [1, 1], [0, 1]];
  // Cross-sections of depth, not concentric rings drawn on an arbitrary cone.
  for (let level = .045; level < 1.48; level += .019) {
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const q = i + j * (nx + 1);
      const values = [depth[q], depth[q + 1], depth[q + nx + 2], depth[q + nx + 1]];
      if (values.some(v => v < 0)) continue;
      const crossings: number[][] = [];
      for (const [a, b] of edges) {
        if ((values[a] < level) === (values[b] < level)) continue;
        const t = (level - values[a]) / (values[b] - values[a]);
        crossings.push([left + (i + corners[a][0] + (corners[b][0] - corners[a][0]) * t) * dx,
          bottom + (j + corners[a][1] + (corners[b][1] - corners[a][1]) * t) * dy, level]);
      }
      for (let k = 0; k + 1 < crossings.length; k += 2) {
        vertices.push(...crossings[k], ...crossings[k + 1]);
        if ((i + j) % 5 === 0) sparks.push(...crossings[k]);
      }
    }
  }
  const uniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uPointer: { value: new THREE.Vector2() } };
  const vertexShader = `uniform float uTime; varying vec3 vLocal;
    void main(){vLocal=position;vec3 p=position;
      p.z+=sin(p.x*2.1+p.y*3.+uTime*.42)*.006;
      gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=8.;}`;
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader,
    fragmentShader: `uniform float uTime,uOpacity;uniform vec2 uPointer;varying vec3 vLocal;
      void main(){
        float band=pow(.5+.5*sin(vLocal.z*33.-uTime*.55+vLocal.x*.6),4.);
        float light=exp(-pow((vLocal.x-uPointer.x*2.)/1.8,2.));
        float neck=exp(-vLocal.x*vLocal.x/ .35)*exp(-pow((vLocal.y+1.3)/.6,2.));
        float shoulder=exp(-pow((abs(vLocal.x)-1.9)/.55,2.));
        float fade=smoothstep(-3.7,-3.1,vLocal.y)*(1.-smoothstep(2.9,3.55,abs(vLocal.x)));
        float alpha=(.10+band*(.28+light*.30)+neck*.25+shoulder*band*.45)*uOpacity*fade;
        gl_FragColor=vec4(mix(vec3(.23,.34,.36),vec3(.84,.94,.91),band),alpha);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
  const glowGeometry = new THREE.BufferGeometry(); glowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(sparks, 3));
  const glowMaterial = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexShader,
    fragmentShader: `uniform float uTime,uOpacity;varying vec3 vLocal;
      void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
        float band=pow(.5+.5*sin(vLocal.z*33.-uTime*.55+vLocal.x*.6),6.);
        gl_FragColor=vec4(.65,.84,.81,pow(1.-r*2.,2.)*band*.24*uOpacity);}`,
  });
  const group = new THREE.Group(); group.add(new THREE.LineSegments(geometry, material), new THREE.Points(glowGeometry, glowMaterial));
  let disposed = false;
  return { group, uniforms, dispose() { if (disposed) return; disposed = true;
    geometry.dispose(); glowGeometry.dispose(); material.dispose(); glowMaterial.dispose();
  } };
}
