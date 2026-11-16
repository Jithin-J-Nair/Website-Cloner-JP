import * as THREE from "three";
import { decodeAboutSourceBuffer } from "@/lib/about-source-buffer";

const ids = ["edan", "ffi", "pierre", "yannic", "paul", "andrii", "sunny"] as const;
type ScanData = { position: number[]; start: number[]; seed: number[]; intensity: number[]; height: number };
/** The supplied scan shares the About scene's renderer and animation lifecycle. */
export function createAboutSourceTeam(invalidate: () => void, onState: (state: string, id: string) => void) {
  const group = new THREE.Group(), head = new THREE.Group(); group.add(head);
  const abort = new AbortController();
  let disposed = false, selected = 0, revision = 0, ready = false, morph = 1, lastTime = 0;
  let scanPromise: Promise<ScanData> | null = null, count = 0, scanHeight = 2.5, enteredAt = 0, wasVisible = false;
  const geometry = new THREE.BufferGeometry();
  const uniforms = { uOpacity: { value: 0 }, uTime: { value: 0 }, uForm: { value: 0 }, uScanY: { value: 9 },
    uDir: { value: -1 }, uScan: { value: 0 }, uReveal: { value: 1 }, uPx: { value: 3 }, uCam: { value: 6 } };
  const vertexShader = `attribute vec3 aStart; attribute vec4 aSeed; attribute float aI;
    uniform float uTime,uForm,uScanY,uDir,uScan,uReveal,uPx,uCam,uSizeK,uAlphaK;
    varying vec3 vCol; varying float vA;
    void main(){
      float t=clamp((uForm-aSeed.x*.55)/.45,0.,1.); float e=1.-pow(1.-t,3.);
      vec3 p=mix(aStart,position,e);
      vec3 perp=normalize(cross(position-aStart,vec3(0.,1.,0.))+vec3(1e-4));
      p+=perp*sin(e*3.14159)*(1.+aSeed.y*2.4);
      p+=vec3(sin(uTime*1.2+aSeed.y*40.),cos(uTime+aSeed.z*40.),sin(uTime*.8+aSeed.y*20.))*.004*e;
      float k=(uScanY-p.y)*uDir*(3.1/2.1); float band=exp(-k*k*55.)*uScan;
      float trail=(k>0.?exp(-k*1.8):0.)*uScan; p.z+=band*.10*(2.1/3.1);
      // Brief horizontal scan interference, limited to a thin moving slice.
      float pulse=step(.985,fract(sin(floor(uTime*7.)*91.7)*43758.5453));
      p.x+=pulse*step(.91,fract(p.y*8.+uTime*2.))*.035*e;
      vec4 mv=modelViewMatrix*vec4(p,1.); gl_Position=projectionMatrix*mv;
      gl_PointSize=uPx*uSizeK*aSeed.w*(1.+band*.55)*(uCam/-mv.z);
      float lit=uReveal>.5?mix(.28,1.,smoothstep(-.08,.08,k)):1.;
      float I=aI*lit*(.35+.65*e)*(1.+band*2.3+trail*.30);
      vec3 c=mix(vec3(.70,.82,.92),vec3(1.),clamp(I*.55,0.,1.))*I;
      vCol=mix(c,vec3(.85,.95,1.)*I*1.15,clamp(band*.6,0.,1.)); vA=uAlphaK*(.3+.7*e);
    }`;
  const fragmentShader = `uniform float uOpacity; varying vec3 vCol; varying float vA;
    void main(){float d=length(gl_PointCoord-.5);if(d>.5)discard;
      gl_FragColor=vec4(vCol,smoothstep(.5,.2,d)*vA*uOpacity);}`;
  const makePoints = (size: number, alpha: number) => {
    const material = new THREE.ShaderMaterial({ uniforms: { ...uniforms, uSizeK: { value: size }, uAlphaK: { value: alpha } },
      vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending });
    const points = new THREE.Points(geometry, material); points.frustumCulled = false; head.add(points); return material;
  };
  const glowFaceMaterial = makePoints(7, .018), material = makePoints(1, 1);
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

  async function loadScan(): Promise<ScanData> {
    const load = async (path: string) => {
      const response = await fetch(path, { signal: abort.signal });
      if (!response.ok) throw new Error("Scan asset unavailable");
      const url = URL.createObjectURL(await response.blob());
      try {
        const image = new Image();
        await new Promise<void>((resolve, reject) => { image.onload = () => resolve(); image.onerror = () => reject(new Error("Scan decode failed")); image.src = url; });
        if (disposed) throw new Error("Disposed");
        const canvas = document.createElement("canvas"); canvas.width = image.width; canvas.height = image.height;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) throw new Error("Scan canvas unavailable");
        ctx.drawImage(image, 0, 0); return { width: image.width, height: image.height, pixels: ctx.getImageData(0, 0, image.width, image.height).data };
      } finally { URL.revokeObjectURL(url); }
    };
    const [face, depth] = await Promise.all([load("/sites/jithin/team-scan-face.png"), load("/sites/jithin/team-scan-depth.png")]);
    const w = face.width, h = face.height;
    if (depth.width !== w || depth.height !== h) throw new Error("Scan dimensions differ");
    const W = 2.1, H = W*h/w, sp = 4.7, rowH = sp*.866;
    const position: number[] = [], start: number[] = [], seed: number[] = [], intensity: number[] = [];
    let state = 0x62a9d9ed;
    const random = () => { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; return state / 4294967296; };
    const avg = (ix: number, iy: number, channel: number) => {
      let sum = 0;
      for (let j=-1;j<=1;j++) for (let i=-1;i<=1;i++) {
        const x=Math.min(w-1,Math.max(0,ix+i)), y=Math.min(h-1,Math.max(0,iy+j)); sum+=face.pixels[(y*w+x)*4+channel];
      }
      return sum/2295;
    };
    for (let row=0,y=sp*.5;y<h;y+=rowH,row++) for (let x=(row%2)*sp*.5+sp*.5;x<w;x+=sp) {
      const jx=x+(random()-.5)*sp*.2, jy=y+(random()-.5)*sp*.2, ix=Math.floor(jx), iy=Math.floor(jy);
      if (ix<0||iy<0||ix>=w||iy>=h) continue;
      const a=avg(ix,iy,3); if (a<.05) continue;
      const l=avg(ix,iy,0), b=Math.pow(Math.min(1,Math.max(0,(l-.05)/.85)),1.3);
      // Match the supplied HTML relief and depth map, scaled to this scene.
      const px=(jx/w-.5)*W, py=(.5-jy/h)*H, pz=(depth.pixels[(iy*w+ix)*4]/255-.35)*1.1*(W/3.1);
      position.push(px,py,pz);
      const th=random()*Math.PI*2, ph=Math.acos(2*random()-1), r=(3+random()*6)*(W/3.1);
      start.push(Math.sin(ph)*Math.cos(th)*r*1.5,Math.sin(ph)*Math.sin(th)*r*.9,Math.cos(ph)*r*.8+1.5);
      seed.push(random()*.7+.3*Math.min(1,Math.hypot(px,py)/(W*.6)),random(),random(),.78+.45*b+random()*.1);
      intensity.push((.09+.91*b)*a);
    }
    return { position, start, seed, intensity, height: H };
  }
  async function setMember(index: number, reduced: boolean) {
    if (disposed) return;
    selected = Number.isFinite(index) ? Math.max(0, Math.min(6, Math.round(index))) : 0;
    const id = ids[selected], token = ++revision; onState("loading", id);
    try {
      scanPromise ??= loadScan(); const data = await scanPromise;
      if (disposed || token !== revision) return;
      if (!ready) {
        geometry.setAttribute("position", new THREE.Float32BufferAttribute(data.position,3));
        geometry.setAttribute("aStart", new THREE.Float32BufferAttribute(data.start,3));
        geometry.setAttribute("aSeed", new THREE.Float32BufferAttribute(data.seed,4));
        geometry.setAttribute("aI", new THREE.Float32BufferAttribute(data.intensity,1));
        count=data.intensity.length; scanHeight=data.height;
      }
      morph = reduced ? 1 : 0; ready = true; onState("ready", id); invalidate();
    } catch { if (!disposed && token === revision) { scanPromise = null; ready = false; onState("unavailable", id); invalidate(); } }
  }
  const forward = new THREE.Vector3();
  return { group, head, get count() { return count; }, get ready() { return ready; }, get member() { return ids[selected]; }, get morph() { return morph; }, setMember,
    update(camera: THREE.PerspectiveCamera, time: number, team: number, narrative: number, width: number, height: number, dpr: number, reduced: boolean) {
      const dt = Math.max(0, Math.min(.1, time - lastTime)); lastTime = time;
      morph = reduced ? 1 : Math.min(1, morph + dt / .85);
      group.visible = team > .001 || narrative > .001;
      camera.getWorldDirection(forward);
      group.position.copy(camera.position).addScaledVector(forward, 6); group.quaternion.copy(camera.quaternion);
      const mobile = width < 820;
      head.position.set(mobile ? -.08 : -.53, mobile ? .12 : .50, .05); head.scale.setScalar(mobile ? 1.45 : 1.65);
      head.rotation.set(0, .2, 0);
      head.visible = ready && team > .001;
      if (head.visible && !wasVisible) enteredAt = time;
      wasVisible = head.visible;
      const t = reduced ? 20 : Math.max(0, time-enteredAt);
      const top=scanHeight/2+.1*(2.1/3.1), bottom=-scanHeight/2*.78;
      let y=top, dir=-1, on=0, first=1;
      if (t>3) {
        const elapsed=t-3, period=4.4, n=Math.floor(elapsed/period), u=(elapsed-n*period)/3.6;
        const k=.5-.5*Math.cos(Math.PI*Math.min(u,1)); dir=n%2 ? 1 : -1; first=n===0 ? 1 : 0;
        y=dir<0 ? top-k*(top-bottom) : bottom+k*(top-bottom);
        on=u>1 ? 0 : Math.min(1,u*6,(1-u)*6);
      }
      uniforms.uOpacity.value = team; uniforms.uTime.value = reduced ? 0 : t;
      uniforms.uForm.value = reduced ? 1 : Math.min(t/4.2,1);
      uniforms.uScanY.value=y; uniforms.uDir.value=dir; uniforms.uScan.value=reduced ? 0 : on; uniforms.uReveal.value=reduced ? 0 : first;
      // The standalone HTML sizes dots for a face that fills its viewport. Scale
      // them with the projected face here instead, keeping its open hex lattice
      // rather than merging the dots when the portrait occupies a smaller area.
      const projectedFaceWidth = height * camera.projectionMatrix.elements[5] * .5 * 2.1 * head.scale.x / 6;
      uniforms.uPx.value = projectedFaceWidth * .007 * dpr; uniforms.uCam.value=6;
      terrainUniforms.uOpacity.value = Math.max(narrative * .55, team); terrainUniforms.uTeam.value = team; terrainUniforms.uTime.value = reduced ? 0 : time;
      contourGroup.position.y = team * .35 - narrative * .35;
    },
    dispose() { disposed = true; revision++; abort.abort(); geometry.dispose(); material.dispose(); glowFaceMaterial.dispose(); contourGeometry.dispose(); contourMaterial.dispose(); glowGeometry.dispose(); glowMaterial.dispose(); columnGeometry.dispose(); columnMaterial.dispose(); glyphTexture.dispose(); group.removeFromParent(); }
  };
}
