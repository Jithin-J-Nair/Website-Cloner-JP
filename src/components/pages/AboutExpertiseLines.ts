import * as THREE from "three";
import { loadLusionBuf } from "@/lib/lusion-buf-loader";
import { expertiseLineProgress } from "@/lib/about-expertise-motion";
import { editorialLineVertex, editorialLineFragment, editorialLineTipVertex, editorialLineTipFragment } from "@/components/home/HomeEditorialShaders";

/** Two native encoded ribbons, driven by the expertise owner's single clock.
 * No global shader/color changes and no independent RAF or scroll observer. */
export function createAboutExpertiseLines(canvas: HTMLCanvasElement, wake: () => void) {
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: false, powerPreference: "low-power" });
  renderer.setClearColor(0, 0); renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene(), camera = new THREE.OrthographicCamera(0, 1, 0, -1, -10, 10);
  const lines: {group: THREE.Group; geometry: THREE.BufferGeometry; material: THREE.ShaderMaterial; tip: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial>; office: boolean}[] = [];
  const tipGeometry = new THREE.PlaneGeometry(2, 2), p0 = new THREE.Vector3(), p1 = new THREE.Vector3();
  let disposed = false, width = 1, height = 1, pending = 2;
  for (const office of [false, true]) {
    void loadLusionBuf(`/assets/models/lines/line_${office ? "office" : "capability"}.buf`).then(data => {
      if (disposed) return;
      const geometry = data.geometry.clone(), group = new THREE.Group();
      const raw = (s: string) => new THREE.Color().setStyle(s, THREE.LinearSRGBColorSpace);
      const uniforms = {u_showRatio:{value:0},u_aoThreshold:{value:.0001},u_colorBg:{value:raw("#3733e8")},u_color0:{value:raw("#ffffff")},u_color1:{value:raw("#bbbbbb")},u_scrollY:{value:0},u_radius:{value:0},u_aspect:{value:new THREE.Vector2()},u_margin:{value:new THREE.Vector2()},u_viewportResolution:{value:new THREE.Vector2()}};
      const material = new THREE.ShaderMaterial({uniforms, vertexShader:editorialLineVertex,fragmentShader:editorialLineFragment,transparent:true,depthTest:false,depthWrite:false,toneMapped:false});
      const mesh = new THREE.Mesh(geometry,material); mesh.frustumCulled = false; group.add(mesh);
      const tip = new THREE.Mesh(tipGeometry,new THREE.ShaderMaterial({uniforms:{u_color0:uniforms.u_color0,u_color1:uniforms.u_color1,u_mixRatio:{value:0},u_ao:{value:1}},vertexShader:editorialLineTipVertex,fragmentShader:editorialLineTipFragment,side:THREE.DoubleSide,transparent:true,depthTest:false,depthWrite:false,toneMapped:false}));
      tip.frustumCulled = false; group.add(tip); scene.add(group); lines.push({group,geometry,material,tip,office});
    }).catch(() => {canvas.dataset.optionalFailure="true";}).finally(() => {if(!disposed){pending--;canvas.dataset.lineAssets=String(lines.length);wake();}});
  }
  return {
    resize(w: number, h: number) {
      width=w; height=h; const dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1500000/(w*h)));
      renderer.setPixelRatio(dpr);renderer.setSize(w,h,false);camera.right=w;camera.bottom=-h;camera.updateProjectionMatrix();
    },
    render(screenY: number, canvasTop: number) {
      if(disposed)return;
      const diagonal=Math.hypot(width,height), radius=.008*(2-THREE.MathUtils.clamp((width-540)/(1920-540),0,1));
      for(const line of lines){
        const ratio=expertiseLineProgress(screenY,height,line.office), u=line.material.uniforms;
        u.u_showRatio.value=ratio;u.u_radius.value=radius;
        line.group.position.set(0,(line.office?-2.2:-1.15)*diagonal-screenY+canvasTop,0);line.group.scale.set(diagonal,diagonal,1);line.group.visible=ratio>0;
        const cp=line.geometry.getAttribute("CP"), pos=line.geometry.getAttribute("position"), cd=line.geometry.getAttribute("Cd");
        let at=0;for(let i=0;i<pos.count;i++)if(ratio>=pos.getZ(i))at=i;
        const next=Math.min(at+1,pos.count-1), a=pos.getZ(at), b=pos.getZ(next), t=b>a?THREE.MathUtils.clamp((ratio-a)/(b-a),0,1):0;
        p0.fromBufferAttribute(cp,at);p1.fromBufferAttribute(cp,next);p0.lerp(p1,t);line.tip.position.copy(p0);line.tip.scale.set(radius,radius,1);
        const ao=.9+.1*THREE.MathUtils.lerp(cd.getX(at),cd.getX(next),t), aoRatio=THREE.MathUtils.clamp((ratio+.0199)/.04,0,1);
        line.tip.material.uniforms.u_ao.value=Math.min(1,ao+1-aoRatio);line.tip.material.uniforms.u_mixRatio.value=1-(1-THREE.MathUtils.clamp(THREE.MathUtils.lerp(a,b,t),0,1))**2;
      }
      renderer.render(scene,camera);canvas.dataset.lineProgress=expertiseLineProgress(screenY,height).toFixed(5);canvas.dataset.officeProgress=expertiseLineProgress(screenY,height,true).toFixed(5);canvas.dataset.lineState=pending?"loading":"settled";
    },
    dispose(){disposed=true;lines.forEach(line=>{line.geometry.dispose();line.material.dispose();line.tip.material.dispose();});tipGeometry.dispose();renderer.dispose();},
  };
}
