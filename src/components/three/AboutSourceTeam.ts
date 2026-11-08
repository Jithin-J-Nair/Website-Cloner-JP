import * as THREE from "three";
import { decodeAboutSourceBuffer } from "@/lib/about-source-buffer";

const ids = ["edan", "ffi", "pierre", "yannic", "paul", "andrii", "sunny"] as const;
type SourceHead = { position: Float32Array; normal: Float32Array; shade: Float32Array };
/** Actual bundled roster data, enabled by the user's explicit reuse permission.
 * One 8192-point portrait, with interruptible per-member buffer morphs. The
 * existing About renderer owns time, scheduling, visibility and context rebuild.
 * No photograph, reconstructed face mesh, invented likeness or fake torso. */
export function createAboutSourceTeam(invalidate: () => void, onState: (state: string, id: string) => void) {
  const group = new THREE.Group(), head = new THREE.Group(); group.add(head);
  const abort = new AbortController(), cache = new Map<string, SourceHead>();
  let disposed = false, selected = 0, revision = 0, ready = false, morph = 1, lastTime = 0;
  const count = 8192;
  const geometry = new THREE.BufferGeometry();
  for (const name of ["position", "aFrom", "aNormal", "aNormalFrom"]) geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count * 3), 3));
  for (const name of ["aShade", "aShadeFrom"]) geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(count), 1));
  const uniforms = { uOpacity: { value: 0 }, uTime: { value: 0 }, uMorph: { value: 1 }, uReveal: { value: 0 },
    uPointer: { value: new THREE.Vector2() }, uPointSize: { value: 2 }, uPixelRatio: { value: 1 } };
  const material = new THREE.ShaderMaterial({ uniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `attribute vec3 aFrom,aNormal,aNormalFrom;attribute float aShade,aShadeFrom;
      uniform float uTime,uMorph,uReveal,uPointSize,uPixelRatio;uniform vec2 uPointer;
      varying float vShade,vBirth,vGlint;
      void main(){float t=clamp(uMorph,0.,1.);t=t*t*(3.-2.*t);vec3 p=mix(aFrom,position,t);
        vec3 raw=mix(aNormalFrom,aNormal,t)*2.-1.;vec3 n=raw*inversesqrt(max(dot(raw,raw),.000001));
        vec3 light=normalize(vec3(.35+uPointer.x*1.1,.2+uPointer.y*.45,.8));
        float diffuse=max(0.,dot(n,light));float shade=mix(aShadeFrom,aShade,t);
        vShade=pow(shade,1.1)*(.18+diffuse*.65);
        float hot=exp(-dot(p.xy-uPointer*vec2(1.4,1.1),p.xy-uPointer*vec2(1.4,1.1))*3.);
        vGlint=pow(max(0.,dot(n,normalize(light+vec3(0.,0.,1.)))),22.)*hot*shade*.8;
        // Soft cheek emitter, modulated by the real captured per-point shade.
        vec2 cheek=p.xy-vec2(.10,-.15);
        vGlint+=exp(-dot(cheek,cheek)*24.)*shade*10.;
        float phase=clamp((p.y+1.8)/3.6,0.,1.);vBirth=smoothstep(phase-.22,phase+.12,uReveal)*smoothstep(-1.2,-.5,p.y);
        p.z+=sin(p.y*35.-uTime*.6)*.002;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=uPointSize*uPixelRatio;
      }`,
    fragmentShader: `uniform float uOpacity;varying float vShade,vBirth,vGlint;
      void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
        float a=exp(-r*r*18.)*uOpacity*vBirth;
        gl_FragColor=vec4(vec3(.64,.78,.83)*(vShade*.90+vGlint),a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
  const points = new THREE.Points(geometry, material); points.frustumCulled = false; head.add(points);
  const contourGroup = new THREE.Group(); group.add(contourGroup);
  const terrainUniforms = { uTime: { value: 0 }, uOpacity: { value: 0 }, uTeam: { value: 0 } };
  const contourGeometry = new THREE.BufferGeometry(), glowGeometry = new THREE.BufferGeometry();
  const contourVertex = `uniform float uTeam;varying vec3 vSource;void main(){vSource=position;
    vec3 ground=vec3(position.x*.073,(position.y-5.)*.07-(position.z-5.)*.023-1.35,-position.z*.012);
    // The captured field is U-shaped in plan. Turn it toward the camera as the
    // head appears: preserve its real central void, rather than flattening the
    // far and near contours together into an invented shirt/chest silhouette.
    vec3 overhead=vec3(position.x*.073-.45,-position.z*.042-1.15+(position.y-5.)*.02,-position.y*.012);
    vec3 p=mix(ground,overhead,uTeam);
    gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.);gl_PointSize=24.*exp(-pow(position.x/32.,2.))*exp(-pow((position.z-12.)/34.,2.));}`;
  const contourMaterial = new THREE.ShaderMaterial({ uniforms: terrainUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: contourVertex, fragmentShader: `uniform float uOpacity,uTime,uTeam;varying vec3 vSource;
      void main(){float band=pow(.5+.5*sin(vSource.y*2.8+vSource.z*.06-uTime*.65),8.);
        float focus=exp(-pow(vSource.x/27.,2.))*exp(-pow((vSource.z-12.)/34.,2.));
        float fade=1.-smoothstep(35.,66.,abs(vSource.x));
        float far= mix(1.,smoothstep(-5.,15.,vSource.z),uTeam);
        float alpha=(.24+band*(.62+uTeam*focus*1.65))*fade*far*uOpacity;
        gl_FragColor=vec4(mix(vec3(.24,.37,.39),vec3(.85,.95,.96),band),alpha);}` });
  const glowMaterial = new THREE.ShaderMaterial({ uniforms: terrainUniforms, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: contourVertex, fragmentShader: `uniform float uOpacity,uTime,uTeam;varying vec3 vSource;
      void main(){float r=length(gl_PointCoord-.5);if(r>.5)discard;
        float band=pow(.5+.5*sin(vSource.y*2.8+vSource.z*.06-uTime*.65),10.);
        float fade=exp(-pow(vSource.x/32.,2.))*exp(-pow((vSource.z-12.)/34.,2.));
        gl_FragColor=vec4(.60,.83,.87,pow(1.-r*2.,3.)*band*fade*uOpacity*uTeam*.9);}` });
  contourGroup.add(new THREE.LineSegments(contourGeometry, contourMaterial), new THREE.Points(glowGeometry, glowMaterial));
  // Authored glyph atlas using the existing OFL IBM Plex Mono, not Lusion's
  // excluded font software. One texture/quad, no DOM rain/timer/extra renderer.
  const glyphCanvas = typeof document !== "undefined" ? document.createElement("canvas") : null;
  if (glyphCanvas) { glyphCanvas.width = 256; glyphCanvas.height = 256; }
  const glyphTexture = glyphCanvas ? new THREE.CanvasTexture(glyphCanvas) : new THREE.DataTexture(new Uint8Array([255, 255, 255, 255]), 1, 1);
  glyphTexture.generateMipmaps = false; glyphTexture.minFilter = THREE.LinearFilter;
  const paintGlyphs = () => {
    const ctx = glyphCanvas?.getContext("2d"); if (!ctx) return;
    ctx.fillStyle = "black"; ctx.fillRect(0, 0, 256, 256); ctx.fillStyle = "white";
    ctx.font = '24px "IBM Plex Mono",monospace'; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789<>/[]{}+=:*.-abcdefghijklmnop";
    for (let i = 0; i < 64; i++) ctx.fillText(chars[i], (i % 8) * 32 + 16, Math.floor(i / 8) * 32 + 16);
    glyphTexture.needsUpdate = true;
  };
  paintGlyphs();
  if (typeof document !== "undefined") void document.fonts.ready.then(() => { if (!disposed) { paintGlyphs(); invalidate(); } });
  const columnGeometry = new THREE.PlaneGeometry(14, 8);
  const columnMaterial = new THREE.ShaderMaterial({ uniforms: { ...terrainUniforms, uGlyphs: { value: glyphTexture } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv;void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `uniform float uTime,uTeam;uniform sampler2D uGlyphs;varying vec2 vUv;
      float hash(float n){return fract(sin(n*127.1)*43758.5453);}
      void main(){float x=vUv.x*64.;float id=floor(x);float seed=hash(id);float y=vUv.y*112.+seed*100.+uTime*.25;
        vec2 cell=vec2((fract(x)-(.25+seed*.5))*3.+.5,fract(y));float glyph=floor(hash(id*53.+floor(y))*64.);
        vec2 atlas=(vec2(mod(glyph,8.),7.-floor(glyph/8.))+clamp(cell,0.,1.))/8.;
        float ink=texture2D(uGlyphs,atlas).r*step(0.,cell.x)*step(cell.x,1.);
        float trail=pow(.5+.5*sin(vUv.y*18.+seed*21.-uTime*.2),6.);
        float axis=fract(x)-.5;float core=exp(-pow(axis/.018,2.));float halo=exp(-pow(axis/.10,2.));
        float fade=smoothstep(0.,.12,vUv.y)*(1.-smoothstep(.85,1.,vUv.y));
        float alpha=(ink*trail*1.2+core*.025+halo*trail*.07)*(.25+seed*seed)*fade*uTeam;
        gl_FragColor=vec4(.48,.64,.72,alpha);}` });
  const columns = new THREE.Mesh(columnGeometry, columnMaterial); columns.position.z = -.8; group.add(columns);
  const fetchGeometry = async (asset: string) => {
    const response = await fetch(`/about/scene/${asset}.buf`, { signal: abort.signal });
    if (!response.ok) throw new Error(`About asset ${asset}: ${response.status}`);
    return decodeAboutSourceBuffer(await response.arrayBuffer());
  };
  void fetchGeometry("contours").then(data => {
    if (disposed) return;
    const p = data.attributes.position, lines: number[] = [], glow: number[] = [];
    if (p.length !== data.count * 3) throw new Error("Invalid terrain positions");
    for (let i = 3; i < p.length; i += 3) {
      const dx = p[i] - p[i - 3], dy = p[i + 1] - p[i - 2], dz = p[i + 2] - p[i - 1];
      // Captured contours are ordered samples. Never bridge separate elevations
      // or distant spline ends with a diagonal line across the scene.
      if (Math.abs(dy) < .01 && dx * dx + dz * dz < 9) lines.push(p[i - 3], p[i - 2], p[i - 1], p[i], p[i + 1], p[i + 2]);
      if (i % 12 === 0) glow.push(p[i], p[i + 1], p[i + 2]);
    }
    contourGeometry.setAttribute("position", new THREE.Float32BufferAttribute(lines, 3));
    glowGeometry.setAttribute("position", new THREE.Float32BufferAttribute(glow, 3));
    onState("ready", "contours"); invalidate();
  }).catch(() => { if (!disposed) onState("unavailable", "contours"); });

  async function setMember(index: number, reduced: boolean) {
    if (disposed) return;
    selected = Number.isFinite(index) ? Math.max(0, Math.min(6, Math.round(index))) : 0; const id = ids[selected], token = ++revision;
    onState("loading", id);
    try {
      let data = cache.get(id);
      if (!data) {
        const source = await fetchGeometry(id), ns = source.attributes.nShade;
        if (source.count !== count || source.attributes.position.length !== count * 3 || !ns || ns.length !== count * 4) throw new Error("Unexpected roster geometry");
        const normal = new Float32Array(count * 3), shade = new Float32Array(count);
        for (let i = 0; i < count; i++) { normal.set([ns[i * 4] / 255, ns[i * 4 + 1] / 255, ns[i * 4 + 2] / 255], i * 3); shade[i] = ns[i * 4 + 3] / 255; }
        data = { position: source.attributes.position, normal, shade }; cache.set(id, data);
      }
      if (disposed || token !== revision) return;
      const visibleMorph = morph * morph * (3 - 2 * morph);
      for (const [name, fromName, target] of [["position", "aFrom", data.position], ["aNormal", "aNormalFrom", data.normal], ["aShade", "aShadeFrom", data.shade]] as const) {
        const to = geometry.getAttribute(name) as THREE.BufferAttribute, from = geometry.getAttribute(fromName) as THREE.BufferAttribute;
        for (let i = 0; i < to.array.length; i++) from.array[i] = ready ? from.array[i] * (1 - visibleMorph) + to.array[i] * visibleMorph : target[i];
        to.array.set(target); to.needsUpdate = true; from.needsUpdate = true;
      }
      morph = reduced || !ready ? 1 : 0; ready = true; onState("ready", id); invalidate();
    } catch { if (!disposed && token === revision) { ready = false; onState("unavailable", id); invalidate(); } }
  }
  const forward = new THREE.Vector3();
  return { group, head, count, get ready() { return ready; }, get member() { return ids[selected]; }, get morph() { return morph; }, setMember,
    update(camera: THREE.PerspectiveCamera, time: number, team: number, narrative: number, pointer: THREE.Vector2, width: number, height: number, dpr: number, reduced: boolean, reveal: number) {
      const dt = Math.max(0, Math.min(.1, time - lastTime)); lastTime = time;
      morph = reduced ? 1 : Math.min(1, morph + dt / .85); uniforms.uMorph.value = morph;
      group.visible = team > .001 || narrative > .001;
      camera.getWorldDirection(forward);
      group.position.copy(camera.position).addScaledVector(forward, 6); group.quaternion.copy(camera.quaternion);
      const mobile = width < 820;
      head.position.set(mobile ? -.08 : -.53, mobile ? .12 : .50, .05); head.scale.setScalar(mobile ? 1.35 : 1.5);
      head.rotation.set(reduced ? 0 : -pointer.y * .035, reduced ? 0 : pointer.x * .09, 0);
      // Static desktop presentation faces the recorded three-quarter view;
      // pointer response remains a small additive tilt and stops in reduced motion.
      head.rotation.y += mobile ? 0 : .28;
      head.visible = ready && team > .001;
      uniforms.uOpacity.value = team * .82; uniforms.uReveal.value = reveal; uniforms.uTime.value = reduced ? 0 : time;
      uniforms.uPointer.value.copy(pointer); uniforms.uPointSize.value = 8.0 * Math.min(1.5, Math.max(.85, height / 832)); uniforms.uPixelRatio.value = dpr;
      terrainUniforms.uOpacity.value = Math.max(narrative * .55, team); terrainUniforms.uTeam.value = team; terrainUniforms.uTime.value = reduced ? 0 : time;
      contourGroup.position.y = team * .35 - narrative * .35;
    },
    dispose() { disposed = true; revision++; abort.abort(); cache.clear(); geometry.dispose(); material.dispose(); contourGeometry.dispose(); contourMaterial.dispose(); glowGeometry.dispose(); glowMaterial.dispose(); columnGeometry.dispose(); columnMaterial.dispose(); glyphTexture.dispose(); group.removeFromParent(); }
  };
}
