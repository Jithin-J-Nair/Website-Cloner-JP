#!/usr/bin/env node
/** Assemble labeled comparisons from supplied stills and actual browser captures.
 * Never paints a reference into the app or substitutes it for a rendered scene. */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root='temp/about-new-reference';
const out='docs/validation/about-supplied-frames';
fs.mkdirSync(out,{recursive:true});
const hash=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const copy=(from,to)=>{fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(from,to);};
const references=[];
for(const [name,n]of [['opening',4],['close',5],['wide',6]]){
 const original=`/tmp/arena-coding-uploads/image-${n}.png`,file=`reference-${name}.jpg`;
 await sharp(original).jpeg({quality:88}).toFile(`${out}/${file}`);
 references.push({name,original:`image-${n}.png`,originalSha256:hash(original),file,provenance:'User-supplied still, not a live browser capture; not an app asset.'});
 copy(`${root}/before/${name}.jpg`,`${out}/before/${name}.jpg`);
}
for(const name of fs.readdirSync(`${root}/final-matched`))copy(`${root}/final-matched/${name}`,`${out}/after/${name}`);
for(const name of fs.readdirSync(`${root}/final-responsive`))copy(`${root}/final-responsive/${name}`,`${out}/responsive/${name}`);
copy(`${root}/access.json`,`${out}/live-access.json`);
copy(`${root}/retained-failure/390-before-budget-fix.json`,`${out}/retained-failure/390-before-budget-fix.json`);
for(const file of fs.readdirSync(`${root}/logs`)){
 copy(`${root}/logs/${file}`,`${out}/logs/${file}`);
 if(file.endsWith('.log')){
  // Preserve results/stacks; only normalize terminal CR and trailing whitespace.
  const target=`${out}/logs/${file}`;
  fs.writeFileSync(target,fs.readFileSync(target,'utf8').replaceAll('\r','').split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');
 }
}
if(fs.existsSync('temp/about-audit/after'))for(const name of fs.readdirSync('temp/about-audit/after')){
 if(name.endsWith('.json'))copy(`temp/about-audit/after/${name}`,`${out}/functional/${name}`);
}
// Three columns, three states, equal scaling and explicit provenance.
const cellW=784,cellH=416,gap=14,top=114,rowH=460,width=cellW*3+gap*4,height=top+3*rowH+25;
const escape=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;');
const text=(s,x,y,size=24)=>`<text x="${x}" y="${y}" font-family="Arial,sans-serif" font-size="${size}" fill="white">${escape(s)}</text>`;
let labels=text('ABOUT — supplied reference / previous render / updated render',gap,35,30);
for(const [i,label]of ['SUPPLIED STILL (motion unknown)','BEFORE — 41b549a, development','AFTER — production build'].entries())labels+=text(label,gap+i*(cellW+gap),85,23);
const composite=[];
for(const [i,name]of ['opening','close','wide'].entries()){
 const y=top+i*rowH;
 labels+=text(name.toUpperCase()+(name==='wide'?' — physically distant camera':''),gap,y+27,22);
 for(const [j,f]of [`reference-${name}.jpg`,`before/${name}.jpg`,`after/${name}.jpg`].entries()){
  const input=await sharp(`${out}/${f}`).resize(cellW,cellH).toBuffer();
  composite.push({input,left:gap+j*(cellW+gap),top:y+36});
 }
}
composite.push({input:Buffer.from(`<svg width="${width}" height="${height}">${labels}</svg>`),top:0,left:0});
await sharp({create:{width,height,channels:3,background:'#18191f'}}).composite(composite).jpeg({quality:89}).toFile(`${out}/comparison.jpg`);
const sourceFiles=['src/lib/about-scene-motion.ts','src/components/pages/AboutPageView.tsx','src/components/three/AboutPlume.ts','src/components/three/AboutTerrain.ts'];
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const files=walk(out).filter(f=>!f.endsWith('/manifest.json'));
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({buildId:fs.readFileSync('.next/BUILD_ID','utf8').trim(),referenceScope:'Three user-provided 1568×832 stills. No observed live source animation.',references,sourceFiles:sourceFiles.map(file=>({file,sha256:hash(file)})),files:files.map(file=>({file:path.relative(out,file),bytes:fs.statSync(file).size,sha256:hash(file)}))},null,2));
console.log(`Built ${files.length} labeled artifacts; source/capture hashes recorded.`);
