import * as THREE from "three";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";

const passVertex = `varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}`;
// Reference ScreenPaint: quarter-resolution advected velocity + two independently
// dissipating weights. A swept segment, not a cursor-following circular mask.
const paintFragment = `
  uniform sampler2D uPrevious,uLow;uniform vec2 uSize,uVelocity,uScroll;
  uniform vec4 uFrom,uTo;uniform float uStep;
  varying vec2 vUv;
  vec2 hash(vec2 p){vec3 p3=fract(vec3(p.xyx)*vec3(.1031,.1030,.0973));p3+=dot(p3,p3.yzx+33.33);return fract((p3.xx+p3.yz)*p3.zy)*2.-1.;}
  vec3 noised(vec2 p){vec2 i=floor(p),f=fract(p),u=f*f*f*(f*(f*6.-15.)+10.),du=30.*f*f*(f*(f-2.)+1.);
    vec2 ga=hash(i),gb=hash(i+vec2(1,0)),gc=hash(i+vec2(0,1)),gd=hash(i+vec2(1));
    float va=dot(ga,f),vb=dot(gb,f-vec2(1,0)),vc=dot(gc,f-vec2(0,1)),vd=dot(gd,f-vec2(1));
    return vec3(va+u.x*(vb-va)+u.y*(vc-va)+u.x*u.y*(va-vb-vc+vd),ga+u.x*(gb-ga)+u.y*(gc-ga)+u.x*u.y*(ga-gb-gc+gd)+du*(u.yx*(va-vb-vc+vd)+vec2(vb,vc)-va));}
  void main(){vec2 p=vUv*uSize,ba=uTo.xy-uFrom.xy;float h=clamp(dot(p-uFrom.xy,ba)/max(dot(ba,ba),.0001),0.,1.);
    vec2 rw=mix(uFrom.zw,uTo.zw,h);float d=1.-smoothstep(-.01,max(.001,rw.x),length(p-uFrom.xy-ba*h));
    vec4 low=texture2D(uLow,vUv-uScroll);vec2 inv=(.5-low.xy)*25.;
    vec3 n3=noised(p*.02*(1.-low.xy));vec2 n=noised(p*.02*(2.-low.xy*(.5+n3.x)+n3.yz*.1)).yz;
    inv+=n*(low.z+low.w)*3.;
    vec4 data=texture2D(uPrevious,vUv-uScroll+inv/uSize*uStep);data.xy-=.5;
    vec4 delta=(pow(vec4(.975,.975,.95,.8),vec4(uStep))-1.)*data+vec4(uVelocity*d,rw.yy*d*uStep);
    delta.zw=sign(delta.zw)*max(vec2(.004*uStep),abs(delta.zw));data+=delta;data.xy+=.5;
    gl_FragColor=clamp(data,0.,1.);}`;
const blurFragment = `uniform sampler2D uTexture;uniform vec2 uDelta;varying vec2 vUv;
  void main(){vec4 c=texture2D(uTexture,vUv)*.227027;
    c+=(texture2D(uTexture,vUv+uDelta*1.384615)+texture2D(uTexture,vUv-uDelta*1.384615))*.316216;
    c+=(texture2D(uTexture,vUv+uDelta*3.230769)+texture2D(uTexture,vUv-uDelta*3.230769))*.070270;gl_FragColor=c;}`;
const titleVertex = `
  uniform vec2 uViewport;uniform float uTop,uScrollRatio,uRadius;varying vec2 vNode;
  #ifdef IS_EDGE
  attribute vec2 aStart,aEnd;
  #endif
  void main(){
    #ifdef IS_EDGE
      vec2 source=position.y>0.?aStart:aEnd;
    #else
      vec2 source=position.xy;
    #endif
    vec2 p=source/vec2(1438.,1252.);float row=floor(p.y*6.)/6.;p*=1.5;
    p.x-=clamp((uScrollRatio-row*.4)/.56,0.,1.)*.5;
    vec2 pixel=p*vec2(uViewport.x,uViewport.x*1250./1440.);pixel.y+=uTop;
    #ifdef IS_EDGE
      vec2 ab=(aStart-aEnd)*vec2(1.,1250./1440.*1438./1252.);float angle=atan(ab.y,ab.x)+1.5707963;
      float s=sin(angle),c=cos(angle);vNode=mat2(c,-s,s,c)*(position.xy*vec2(1.,step(.5,abs(position.y))));pixel+=vNode*uRadius;
    #else
      vNode=vec2(0.);
    #endif
    gl_Position=vec4(pixel/uViewport*vec2(2.,-2.)+vec2(-1.,1.),0.,1.);
  }`;
const titleFragment = `
  uniform sampler2D uPaint,uGradient;uniform vec2 uResolution;uniform float uTime,uInvert;varying vec2 vNode;
  void main(){vec2 uv=gl_FragCoord.xy/uResolution;vec4 paint=texture2D(uPaint,uv);float t=uTime;
    #ifdef IS_EDGE
      t+=3.1415926;
    #endif
    float d=cos((uv.x+uv.y)*4.+t)*.5+.5,alpha=1.,strength=1.,constantStrength=0.;
    vec3 base=vec3(.004+d*d*.015);
    #ifdef IS_EDGE
      float dist=length(vNode);alpha=1.-smoothstep(1.,1.+fwidth(dist),dist);
      base=vec3(.004+d*d*.15);strength=4.;constantStrength=max(0.,d*2.-1.)*.15;
    #endif
    float hue=(paint.x+paint.y)*1.5+d*2.;
    vec3 color=mix(base,texture2D(uGradient,vec2(hue,0.)).rgb,max(paint.z,paint.w)*strength+constantStrength);
    float noise=fract(sin(dot(gl_FragCoord.xy,vec2(12.9898,78.233)))*43758.5453)*.004;
    gl_FragColor=vec4(mix(color+noise,1.-color-noise,uInvert),alpha);
  }`;

/** Boundary capsules from the SAME triangulated title, preserving counters and
 * curved contours. Interior triangulation edges are not rendered as outlines. */
export function createRecognitionEdges(geometry: THREE.BufferGeometry) {
  const positions = geometry.getAttribute("position"), indices = geometry.index;
  if (!indices) throw new Error("Recognition title must be indexed");
  const edges = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < indices.count; i += 3) {
    const tri = [indices.getX(i), indices.getX(i + 1), indices.getX(i + 2)];
    for (let j = 0; j < 3; j++) {
      const a = tri[j], b = tri[(j + 1) % 3], key = a < b ? `${a}_${b}` : `${b}_${a}`;
      const edge = edges.get(key); if (edge) edge.count++; else edges.set(key, { a, b, count: 1 });
    }
  }
  const starts: number[] = [], ends: number[] = [];
  for (const { a, b, count } of edges.values()) if (count === 1) {
    starts.push(positions.getX(a), positions.getY(a)); ends.push(positions.getX(b), positions.getY(b));
  }
  const plane = new THREE.PlaneGeometry(2, 2, 1, 3), result = new THREE.InstancedBufferGeometry();
  result.setIndex(plane.index); result.setAttribute("position", plane.getAttribute("position"));
  result.setAttribute("aStart", new THREE.InstancedBufferAttribute(new Float32Array(starts), 2));
  result.setAttribute("aEnd", new THREE.InstancedBufferAttribute(new Float32Array(ends), 2));
  result.instanceCount = starts.length / 2;
  return result;
}

/** No clock/listeners here. The recognition component owns the sole RAF and
 * supplies viewport, scroll, pointer and lifetime to all four GPU targets. */
export function createAboutRecognitionPaint(renderer: THREE.WebGLRenderer, svg: string, gradient: THREE.Texture) {
  const data = new SVGLoader().parse(svg);
  const geometry = new THREE.ShapeGeometry(data.paths.flatMap(path => path.toShapes()));
  const edgeGeometry = createRecognitionEdges(geometry);
  const target = () => new THREE.WebGLRenderTarget(1, 1, { depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  let previous = target(), current = target();
  const low = target(), scratch = target();
  const paintUniforms = {
    uPrevious: { value: previous.texture }, uLow: { value: low.texture }, uSize: { value: new THREE.Vector2(1, 1) },
    uVelocity: { value: new THREE.Vector2() }, uScroll: { value: new THREE.Vector2() },
    uFrom: { value: new THREE.Vector4(-100, -100, 0, 0) }, uTo: { value: new THREE.Vector4(-100, -100, 0, 0) }, uStep: { value: 1 },
  };
  const titleUniforms = {
    uPaint: { value: current.texture }, uGradient: { value: gradient }, uViewport: { value: new THREE.Vector2(1, 1) },
    uResolution: { value: new THREE.Vector2(1, 1) }, uTop: { value: 0 }, uTime: { value: .5 },
    uScrollRatio: { value: 0 }, uRadius: { value: 1 }, uInvert: { value: 0 },
  };
  gradient.wrapS = gradient.wrapT = THREE.RepeatWrapping; gradient.minFilter = THREE.LinearFilter;
  const paintMaterial = new THREE.ShaderMaterial({ uniforms: paintUniforms, vertexShader: passVertex, fragmentShader: paintFragment, depthTest: false, depthWrite: false });
  const blurUniforms = { uTexture: { value: current.texture }, uDelta: { value: new THREE.Vector2() } };
  const blurMaterial = new THREE.ShaderMaterial({ uniforms: blurUniforms, vertexShader: passVertex, fragmentShader: blurFragment, depthTest: false, depthWrite: false });
  const faceMaterial = new THREE.ShaderMaterial({ uniforms: titleUniforms, vertexShader: titleVertex, fragmentShader: titleFragment, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
  const edgeMaterial = new THREE.ShaderMaterial({ uniforms: titleUniforms, defines: { IS_EDGE: 1 }, vertexShader: titleVertex, fragmentShader: titleFragment, transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
  const titleScene = new THREE.Scene(), passScene = new THREE.Scene(), camera = new THREE.Camera();
  const edge = new THREE.Mesh(edgeGeometry, edgeMaterial), face = new THREE.Mesh(geometry, faceMaterial);
  edge.frustumCulled = face.frustumCulled = false; face.renderOrder = 1; titleScene.add(edge, face);
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), paintMaterial); passScene.add(quad); quad.frustumCulled = false;
  const renderPass = (material: THREE.ShaderMaterial, destination: THREE.WebGLRenderTarget) => {
    quad.material = material; renderer.setRenderTarget(destination); renderer.render(passScene, camera);
  };
  let width = 1, height = 1, px = -1, py = -1, lastScroll = 0;
  const deltaVelocity = new THREE.Vector2();
  const clear = () => {
    // These are data, not display colors: neutral velocity is (.5,.5),
    // and alpha is the second weight (zero). Non-premultiplied clear is vital.
    for (const rt of [previous, current, low, scratch]) {
      renderer.setRenderTarget(rt); renderer.setClearColor(new THREE.Color(.5, .5, 0), 0); renderer.clear();
    }
    renderer.setRenderTarget(null); renderer.setClearColor(0, 0);
    paintUniforms.uVelocity.value.set(0, 0); paintUniforms.uFrom.value.set(-100, -100, 0, 0); paintUniforms.uTo.value.copy(paintUniforms.uFrom.value); px = py = -1;
  };
  return {
    uniforms: titleUniforms, edgeCount: edgeGeometry.instanceCount,
    resize(w: number, h: number, dpr: number) {
      width = w; height = h;
      const qw = Math.max(1, w >> 2), qh = Math.max(1, h >> 2);
      previous.setSize(qw, qh); current.setSize(qw, qh); low.setSize(Math.max(1, w >> 3), Math.max(1, h >> 3)); scratch.setSize(low.width, low.height);
      paintUniforms.uSize.value.set(qw, qh); titleUniforms.uViewport.value.set(w, h); titleUniforms.uResolution.value.set(w * dpr, h * dpr);
      titleUniforms.uRadius.value = Math.max(1, w / 1200); clear();
    },
    update(dt: number, top: number, sectionHeight: number, scroll: number, pointer: { x: number; y: number; active: boolean }, reduced: boolean, invert: number) {
      const step = Math.min(3, Math.max(.01, dt * 60));
      titleUniforms.uTop.value = top; titleUniforms.uInvert.value = invert;
      const ratio = Math.min(0, (height - top) / sectionHeight - 1) + Math.max(0, -top / sectionHeight);
      titleUniforms.uScrollRatio.value = reduced ? .5 : THREE.MathUtils.clamp((ratio + .75) / 1.5, 0, 1);
      if (!reduced) titleUniforms.uTime.value += dt;
      const scrollDelta = reduced ? 0 : scroll - lastScroll; lastScroll = scroll;
      paintUniforms.uScroll.value.set(0, -scrollDelta / height);
      if (!reduced) {
        const q = current.height / height, x = pointer.x * q, y = (height - pointer.y) * q;
        const distance = px < 0 || !pointer.active ? 0 : Math.hypot(pointer.x - px, pointer.y - py + scrollDelta * 3);
        const radius = Math.min(1, distance / 100) * Math.max(40, width / 20) * q;
        paintUniforms.uFrom.value.copy(paintUniforms.uTo.value);
        if (px < 0) paintUniforms.uFrom.value.set(x, y, 0, 0);
        paintUniforms.uTo.value.set(x, y, radius, pointer.active ? 1 : 0);
        paintUniforms.uVelocity.value.multiplyScalar(Math.pow(.8, step)).add(deltaVelocity.set(x - paintUniforms.uFrom.value.x, y - paintUniforms.uFrom.value.y).multiplyScalar(Math.min(dt, .05) * .8));
        paintUniforms.uStep.value = step; px = pointer.active ? pointer.x : -1; py = pointer.active ? pointer.y : -1;
        [previous, current] = [current, previous]; paintUniforms.uPrevious.value = previous.texture;
        renderPass(paintMaterial, current);
        blurUniforms.uTexture.value = current.texture; blurUniforms.uDelta.value.set(8 / current.width, 0); renderPass(blurMaterial, scratch);
        blurUniforms.uTexture.value = scratch.texture; blurUniforms.uDelta.value.set(0, 8 / current.height); renderPass(blurMaterial, low);
      }
      titleUniforms.uPaint.value = current.texture; renderer.setRenderTarget(null); renderer.clear();
      // Render in source order; separate scenes avoid Three's opaque/transparent buckets.
      face.visible = false; renderer.render(titleScene, camera); face.visible = true; edge.visible = false; renderer.autoClear = false;
      renderer.render(titleScene, camera); renderer.autoClear = true; edge.visible = true;
    },
    clear,
    dispose() {
      geometry.dispose(); edgeGeometry.dispose(); quad.geometry.dispose();
      for (const material of [paintMaterial, blurMaterial, faceMaterial, edgeMaterial]) material.dispose();
      for (const rt of [previous, current, low, scratch]) rt.dispose(); gradient.dispose();
    },
  };
}
