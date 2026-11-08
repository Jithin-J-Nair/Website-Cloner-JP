#!/usr/bin/env node
/** Package this repair's actual browser evidence, never generated scene imagery.
 * Run only after the commands in docs/validation/about-nov06-repair-results.md.
 * Large temporary captures stay ignored; review JPEGs/reports retain SHA-256s.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import assert from 'node:assert/strict';
import sharp from 'sharp';

const input = 'temp/about-nov06';
const out = 'docs/validation/about-nov06-repair';
const logSources = [];
const writeReviewLog = (from,to) => {
  const bytes=fs.readFileSync(from);
  logSources.push({path:from,rawSha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  const text=bytes.toString('utf8').replace(/\r\n?/g,'\n').split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n';
  fs.writeFileSync(to,text);
};
const statuses = fs.readFileSync(`${input}/logs/final-status.txt`, 'utf8').trim().split('\n');
for (const suite of ['wordmark','accessibility','experience','handoffs']) {
  assert.ok(statuses.includes(`${suite}:0`), `finish and pass ${suite} before packaging final evidence`);
}
const copy = async (from, to, transformImages = false) => {
  if (!fs.existsSync(from)) return;
  fs.mkdirSync(to,{recursive:true});
  for (const entry of fs.readdirSync(from,{withFileTypes:true})) {
    if (!entry.isFile()) continue;
    const source=path.join(from,entry.name);
    if (entry.name.endsWith('.png') && transformImages) {
      await sharp(source).jpeg({quality:85}).toFile(path.join(to,entry.name.replace(/\.png$/,'.jpg')));
    } else if (entry.name.endsWith('.log')) writeReviewLog(source,path.join(to,entry.name));
    else if (/\.(jpg|json|txt)$/.test(entry.name)) fs.copyFileSync(source,path.join(to,entry.name));
  }
};
await copy(`${input}/before`,`${out}/before`);
for (const suite of ['wordmark','accessibility','experience','handoffs']) await copy(`${input}/final/${suite}`,`${out}/${suite}`,true);
await copy(`${input}/logs`,`${out}/logs`);
for (const file of fs.readdirSync(input).filter(name=>name.startsWith('baseline-')&&name.endsWith('.log'))) {
  writeReviewLog(`${input}/${file}`,`${out}/logs/${file}`);
}
fs.copyFileSync(`${input}/live-access.json`,`${out}/live-access.json`);
const label = (text,width,height=38) => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#202127"/><text x="14" y="25" fill="#fff" font-family="sans-serif" font-size="17">${text}</text></svg>`);
const w=784,h=416,gap=12,bar=38,top=94;
const panels=[],references=[];
for (const [row,name] of ['opening','close','wide'].entries()) {
  const local=name==='close'?'basin':name;
  const reference=`docs/validation/about-supplied-frames/reference-${name}.jpg`;
  references.push({path:reference,sha256:crypto.createHash('sha256').update(fs.readFileSync(reference)).digest('hex')});
  for (const [column,file] of [reference,`${out}/before/1568-${local}.jpg`,`${out}/handoffs/1568-${local}.jpg`].entries()) {
    const left=gap+column*(w+gap),y=top+row*(h+bar+gap);
    const title=['SUPPLIED SOURCE STILL','UPDATED BRANCH 8be3318','REPAIRED (ORIGINAL SUBSTITUTES)'][column];
    panels.push({input:label(`${title} / ${name.toUpperCase()}`,w),left,top:y});
    panels.push({input:await sharp(file).resize(w,h,{fit:'fill'}).jpeg({quality:88}).toBuffer(),left,top:y+bar});
  }
}
const width=3*w+4*gap,height=top+3*(h+bar+gap)+42;
panels.unshift({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="90"><text x="16" y="30" fill="white" font-family="sans-serif" font-size="24">About: source stills / supplied updated branch / repair</text><text x="16" y="62" fill="#c3c5ce" font-family="sans-serif" font-size="17">Local milestones use authored scroll positions. Stills do not establish source motion timing. This is not exact-clone certification.</text></svg>`),left:0,top:0});
await sharp({create:{width,height,channels:3,background:'#0d0c0f'}}).composite(panels).jpeg({quality:90}).toFile(`${out}/comparison.jpg`);
const files=[];
const walk = directory => { for(const entry of fs.readdirSync(directory,{withFileTypes:true})) {
  const file=path.join(directory,entry.name);
  if(entry.isDirectory()) walk(file);
  else if(entry.name!=='manifest.json') {
    const bytes=fs.readFileSync(file);
    files.push({path:path.relative(out,file),bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
}};
walk(out);
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify({baseline:'8be3318bbcb46dc3e7d296da9160ceb1735462b9',branch:'arena/53eb1ea0-website-cloner-jp',statuses,sourceEvidence:'Three supplied stills; upstream video review is secondary. Interactive official browser failed ERR_CONNECTION_CLOSED.',limitations:'Not pixel/animation parity, hardware FPS, physical touch or audio certification. Restricted scene/portrait assets remain unauthorized.',logNormalization:'Review logs normalize CRLF, trailing horizontal whitespace and excess terminal blank lines only; raw logs remain unchanged in ignored temp and their SHA-256s are recorded.',logSources,references,files},null,2));
console.log(`Packaged ${files.length} evidence files (${(files.reduce((n,f)=>n+f.bytes,0)/1048576).toFixed(2)} MiB) with SHA-256 manifest.`);
