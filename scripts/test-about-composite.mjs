#!/usr/bin/env node
/** GPU regression for About's actual composer, not a screenshot-parity claim.
 * Scene alpha is an emission mask, NOT coverage. Exercise a straight-alpha
 * drawing buffer too: leaking that mask to it produces black terrain/person/sky.
 * Modules are intercepted locally; no test route/assets ship in the app. */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';

const origin = 'http://127.0.0.1:3003';
const root = '/__about-composite-test/';
const browser = await launchMotionBrowser();
try {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
  await page.route(`${origin}${root}**`, async route => {
    const file = new URL(route.request().url()).pathname.slice(root.length);
    if (file === '') {
      return route.fulfill({contentType:'text/html',body:`<!doctype html><style>body{margin:0;background:black}canvas{display:block}</style>
        <script type="importmap">{"imports":{"three":"${root}three/build/three.module.js","three/":"${root}three/"}}</script>`});
    }
    if (file.startsWith('three/')) {
      const relative = file.slice('three/'.length);
      assert.ok(!relative.includes('..'));
      return route.fulfill({contentType:'text/javascript',body:fs.readFileSync(path.resolve('node_modules/three',relative),'utf8')});
    }
    assert.ok(['AboutScenePost','about-reference-shaders'].includes(file));
    const source = fs.readFileSync(`src/components/three/${file}.ts`,'utf8');
    return route.fulfill({contentType:'text/javascript',body:ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText});
  });
  await page.goto(`${origin}${root}`);
  const results = await page.evaluate(async root => {
    const THREE = await import(`${root}three/build/three.module.js`);
    const {createAboutScenePost} = await import(`${root}AboutScenePost`);
    const results = [];
    for (const [width,height,dpr] of [[160,90,1],[104,82,1.5],[78,168,1]]) {
      for (const alpha of [false,true]) {
        const renderer = new THREE.WebGLRenderer({alpha,premultipliedAlpha:false,preserveDrawingBuffer:true});
        renderer.setPixelRatio(dpr); renderer.setSize(width,height); renderer.setClearColor(0,1);
        document.body.appendChild(renderer.domElement);
        const scene = new THREE.Scene(), overlay = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60,width/height,.1,220);
        const geometry = new THREE.PlaneGeometry(2,2);
        // Nonemissive sky/person and a stepped specular mask, plus an emissive
        // grain. RGB must survive independently of all those mask values.
        const material = new THREE.ShaderMaterial({
          vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
          fragmentShader:`varying vec2 vUv;void main(){
            float emission=step(.5,vUv.x)*step(.5,vUv.y);
            vec3 radiance=vec3(.25,.35,.45);
            if(distance(vUv,vec2(.75,.75))<.025){radiance=vec3(4.);emission=1.;}
            gl_FragColor=vec4(radiance,emission);
          }`,
        });
        scene.add(new THREE.Mesh(geometry,material));
        const neutralGeometry = new THREE.PlaneGeometry(2,2);
        const neutralMaterial = new THREE.ShaderMaterial({vertexShader:'void main(){gl_Position=vec4(position.xy,0.,1.);}',fragmentShader:'void main(){gl_FragColor=vec4(.5,.5,.5,1.);}',depthTest:false,depthWrite:false});
        const neutral = new THREE.Scene(); neutral.add(new THREE.Mesh(neutralGeometry,neutralMaterial));
        const post = createAboutScenePost(renderer,scene,camera,overlay,(_camera,target) => {
          const saved=renderer.getRenderTarget();
          try {renderer.setRenderTarget(target);renderer.render(neutral,camera);} finally {renderer.setRenderTarget(saved);}
        });
        post.resize(width,height,dpr);
        const gl = renderer.getContext();
        const size = renderer.getDrawingBufferSize(new THREE.Vector2());
        // Repeated forwards/backwards seeks also exercise composer ping-pong
        // swaps and enabling/disabling motion blur, not only its first frame.
        for (const u of [0,.525,.8,1.5,5.8,1.5,.525,0]) {
          post.render(u);
          const pixels = new Uint8Array(size.x*size.y*4);
          gl.readPixels(0,0,size.x,size.y,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
          let nonOpaque=0,black=0;
          for(let i=0;i<pixels.length;i+=4){
            if(pixels[i+3]!==255)nonOpaque++;
            if(pixels[i]+pixels[i+1]+pixels[i+2]<30)black++;
          }
          results.push({width,height,dpr,alpha,u,nonOpaque,black,error:gl.getError()});
        }
        post.dispose(); geometry.dispose(); material.dispose(); neutralGeometry.dispose(); neutralMaterial.dispose();
        renderer.dispose(); renderer.forceContextLoss(); renderer.domElement.remove();
      }
    }
    return results;
  }, root);
  assert.deepEqual(errors,[],'no browser or shader errors');
  for (const result of results) {
    assert.equal(result.error,0,`WebGL error: ${JSON.stringify(result)}`);
    assert.equal(result.black,0,`radiance was cut out: ${JSON.stringify(result)}`);
    assert.equal(result.nonOpaque,0,`emission mask leaked to display alpha: ${JSON.stringify(result)}`);
  }
  console.log(`PASS About GPU composite: ${results.length} frames; opaque/straight-alpha buffers; landscape/tall/mobile aspect ratios; DPR 1/1.5; reversible motion/bloom/HUD transitions; no black pixels or leaked emission alpha. SwiftShader, not physical-GPU certification.`);
} finally { await browser.close(); }
