#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ts from 'typescript';
const source = ts.transpileModule(fs.readFileSync('src/components/three/AboutGlyphFluid.ts', 'utf8'), {
  compilerOptions: {module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022},
}).outputText;
const {AboutGlyphFluid} = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
for (const [count, aspect] of [[120,.46],[900,16/9],[3600,16/9]]) {
  const fluid = new AboutGlyphFluid(count, aspect);
  const buffers = [fluid.x,fluid.y,fluid.vx,fluid.vy];
  let changed = false;
  const start = fluid.x.slice();
  for (let frame=0;frame<180;frame++) {
    fluid.update(1/60, aspect*.5+Math.sin(frame/20)*.1, .45, frame>60&&frame<120, false);
    for (const a of buffers) assert.ok(a.every(Number.isFinite),'all particles remain finite');
    assert.ok(fluid.x.every(x=>x>=.01199&&x<=aspect-.01199),'side boundaries contain every particle');
    assert.ok(fluid.y.every(y=>y>=.01199&&y<=2),'floor/open-surface bounds remain finite');
    assert.ok(Number.isFinite(fluid.lastProjectionBefore)&&Number.isFinite(fluid.lastProjectionAfter));
    if (fluid.x.some((x,i)=>Math.abs(x-start[i])>.001)) changed=true;
  }
  assert.ok(changed,'liquid actually evolves');
  assert.equal(fluid.x,buffers[0],'the render buffer is reused, not replaced per update');
  fluid.update(1/60,0,0,false,true);
  const still = fluid.x.slice(), stillY = fluid.y.slice();
  fluid.update(10,0,0,true,true);
  assert.deepEqual(fluid.x,still);assert.deepEqual(fluid.y,stillY);
  fluid.update(NaN,0,0,false,true);assert.deepEqual(fluid.x,still);
  fluid.update(1/60,0,0,false,false);assert.ok(fluid.steps>0,'motion can resume');
  fluid.resize(aspect*.9);assert.ok(fluid.x.every(Number.isFinite));
  console.log(`PASS glyph liquid: ${count} particles, aspect ${aspect.toFixed(2)}, pointer interaction, bounded transport, stable buffers and reduced-motion restart.`);
}
