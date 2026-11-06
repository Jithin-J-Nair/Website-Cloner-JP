import * as THREE from "three";
import type { AboutPhotoPortrait } from "./AboutPhotoPortrait";

/** Surface reconstructed ONLY from the user's permitted PLY photo relief.
 * A smoothed front surface plus normals makes continuous lit facial volumes,
 * rather than a uniformly glowing scatter. It remains an estimated 2.5D relief,
 * not a real head scan or an employee's likeness. */
export function createAboutPortraitSurface(data: AboutPhotoPortrait) {
  const w = 128, h = 152, n = w * h;
  const depth = new Float32Array(n), shade = new Float32Array(n), weight = new Float32Array(n);
  const valid = new Uint8Array(n);
  for (let k = 0; k < data.count; k++) {
    const x = data.samples[k * 4], y = data.samples[k * 4 + 1];
    const i = Math.max(0, Math.min(w - 1, Math.round((x + 2) / 4 * (w - 1))));
    const j = Math.max(0, Math.min(h - 1, Math.round((y + 2) / 4.3 * (h - 1))));
    const q = i + j * w;
    depth[q] += data.samples[k * 4 + 2]; shade[q] += data.samples[k * 4 + 3]; weight[q]++;
  }
  for (let q = 0; q < n; q++) if (weight[q]) { depth[q] /= weight[q]; shade[q] /= weight[q]; valid[q] = 1; }
  // Fill only enclosed sampling holes; never extrapolate a rectangular face.
  for (let pass = 0; pass < 3; pass++) {
    const nextDepth = depth.slice(), nextShade = shade.slice(), nextValid = valid.slice();
    for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) {
      const q = i + j * w;
      let d = 0, s = 0, samples = 0;
      for (let yy = -1; yy <= 1; yy++) for (let xx = -1; xx <= 1; xx++) {
        const at = q + xx + yy * w;
        if (valid[at]) { d += depth[at]; s += shade[at]; samples++; }
      }
      if (valid[q] && samples > 3) nextDepth[q] = depth[q] * .4 + d / samples * .6;
      else if (!valid[q] && samples >= 6) {
        nextDepth[q] = d / samples; nextShade[q] = s / samples; nextValid[q] = 1;
      }
    }
    depth.set(nextDepth); shade.set(nextShade); valid.set(nextValid);
  }
  const positions = new Float32Array(n * 3), indices: number[] = [];
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const q = i + j * w, x = i / (w - 1) * 4 - 2, y = j / (h - 1) * 4.3 - 2;
    const cranialVolume = .34 * Math.sqrt(Math.max(0, 1 - (x / 1.05) ** 2))
      * THREE.MathUtils.smoothstep(y, -.95, -.35);
    positions.set([x, y, depth[q] + cranialVolume], q * 3);
    if (i < w - 1 && j < h - 1 && valid[q] && valid[q + 1] && valid[q + w] && valid[q + w + 1]) {
      indices.push(q, q + 1, q + w, q + 1, q + w + 1, q + w);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aPhotoShade", new THREE.BufferAttribute(shade, 1));
  geometry.setIndex(indices); geometry.computeVertexNormals();
  const uniforms = { uOpacity: { value: 0 }, uTime: { value: 0 }, uReveal: { value: 0 }, uPointer: { value: new THREE.Vector2() } };
  const material = new THREE.ShaderMaterial({
    uniforms, transparent: true, depthWrite: true, side: THREE.DoubleSide,
    vertexShader: `attribute float aPhotoShade; varying float vShade;varying vec3 vNormal,vPosition;
      void main(){vShade=aPhotoShade;vNormal=normal;vPosition=position;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uOpacity,uTime,uReveal;uniform vec2 uPointer;
      varying float vShade;varying vec3 vNormal,vPosition;
      void main(){
        if(vPosition.y< -1.35)discard;
        float birth=smoothstep((vPosition.y+2.)/4.3-.15,(vPosition.y+2.)/4.3+.08,uReveal);
        if(birth*uOpacity<.005)discard;
        vec3 n=normalize(vNormal);if(n.z<0.)n=-n;
        vec3 light=normalize(vec3(.85+uPointer.x*1.5,.35+uPointer.y*.6,.55));
        float diffuse=max(0.,dot(n,light));
        float highlight=pow(max(0.,dot(n,normalize(light+vec3(0.,0.,1.)))),26.);
        float rim=pow(1.-max(0.,n.z),3.);
        float luminance=(.018+pow(vShade,1.5)*.29)*(.12+diffuse*.88)+highlight*vShade*.62+rim*.035;
        float grain=fract(sin(dot(floor(gl_FragCoord.xy),vec2(12.9898,78.233)))*43758.5453);
        if(grain<.015+(1.-birth)*.85)discard;
        vec3 color=vec3(.72,.87,.89)*luminance*(.94+grain*.12);
        gl_FragColor=vec4(color,uOpacity*birth*smoothstep(-1.35,-1.13,vPosition.y));
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const mesh = new THREE.Mesh(geometry, material);
  let disposed = false;
  return { mesh, uniforms, dispose() { if (disposed) return; disposed = true; geometry.dispose(); material.dispose(); } };
}
