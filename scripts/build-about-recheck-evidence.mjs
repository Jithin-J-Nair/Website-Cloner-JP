#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {execFileSync} from 'node:child_process';
import sharp from 'sharp';
const input='temp/visual-recheck',out='docs/validation/about-visual-recheck';
fs.mkdirSync(out,{recursive:true});
function copyTree(from,to){if(!fs.existsSync(from))return;fs.mkdirSync(to,{recursive:true});for(const entry of fs.readdirSync(from,{withFileTypes:true})){const source=path.join(from,entry.name),destination=path.join(to,entry.name);if(entry.isDirectory())copyTree(source,destination);else if(/\.(jpg|json)$/.test(entry.name))fs.copyFileSync(source,destination);}}
copyTree(`${input}/final`,`${out}/after`);copyTree(`${input}/boundaries`,`${out}/boundaries`);
fs.mkdirSync(`${out}/checks`,{recursive:true});
for(const name of ['final-check','final-lint','final-types','browser','cards','boundaries','about','master','portals','home','home-touch','site-scroll','qa','assets','units']){const file=`${input}/${name}.log`;if(!fs.existsSync(file))continue;const text=fs.readFileSync(file,'utf8').replace(/\u001b\[[0-9;]*m/g,'').split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n';fs.writeFileSync(`${out}/checks/${name}.log`,text);}
fs.copyFileSync(`${input}/served-before.json`,`${out}/served-before.json`);
const served=JSON.parse(fs.readFileSync(`${out}/after/1440.json`));
fs.writeFileSync(`${out}/served-after.json`,JSON.stringify({url:served.url,cacheControl:served.cacheControl,buildId:served.buildId,revision:served.revision,coldSession:served.coldSession,models:served.models,errors:served.errors,probe:served.captures[0].probe},null,2)+'\n');
fs.mkdirSync(`${out}/before`,{recursive:true});
for(const name of ['opening','cards'])fs.copyFileSync(`${input}/before-${name}.jpg`,`${out}/before/1440-${name}.jpg`);
fs.copyFileSync('docs/validation/about-reference-cards/after/1440-terrain.jpg',`${out}/before/1440-terrain.jpg`);
const escape=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;');
const label=(text,width,height=40)=>({input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="#17191d"/><text x="12" y="25" fill="white" font-size="14" font-family="sans-serif">${escape(text)}</text></svg>`)});
async function tile(file,width,height){return sharp(file).resize(width,height,{fit:'contain',background:'#08090b'}).jpeg({quality:86}).toBuffer();}
const parts=[];let y=0;
for(const [name,after]of [['opening','opening'],['terrain','terrain'],['cards','about-capability']]){
 parts.push({...label(`BEFORE: ${name} — 1440x900`,720),left:0,top:y},{...label(`AFTER: ${name} — 1440x900`,720),left:720,top:y});y+=40;
 parts.push({input:await tile(`${out}/before/1440-${name}.jpg`,720,450),left:0,top:y},{input:await tile(`${out}/after/1440-${after}.jpg`,720,450),left:720,top:y});y+=450;
}
await sharp({create:{width:1440,height:y,channels:3,background:'#08090b'}}).composite(parts).jpeg({quality:87}).toFile(`${out}/before-after.jpg`);
for(const width of [1440,768,390]){
 const data=JSON.parse(fs.readFileSync(`${out}/after/${width}.json`)),w=width===390?260:480,h=Math.round(w*data.height/width),columns=width===390?3:2,rows=Math.ceil(data.captures.length/columns),composite=[];
 for(let i=0;i<data.captures.length;i++){const s=data.captures[i],x=(i%columns)*w,top=Math.floor(i/columns)*(h+40);composite.push({...label(`${s.name} — y=${Math.round(s.scroll)}`,w),left:x,top},{input:await tile(`${out}/after/${s.file}`,w,h),left:x,top:top+40});}
 await sharp({create:{width:w*columns,height:rows*(h+40),channels:3,background:'#08090b'}}).composite(composite).jpeg({quality:83}).toFile(`${out}/journey-${width}.jpg`);
}
// The official half is historical and has a different aspect/scroll sample.
const referenceParts=[];let top=0;
for(const [source,after,title]of [['09_about_plume_wordmark.jpg','opening','Opening'],['10_about_terrain.jpg','terrain','Terrain']]){
 const metadata=await sharp(`reference/side-by-side/${source}`).metadata();
 const halfWidth=Math.floor(metadata.width/2);
 referenceParts.push({...label(`${title}: OFFICIAL HALF ${halfWidth}x${metadata.height} (capture)`,720),left:0,top},{...label(`${title}: LOCAL, 1440x900 — different aspect/time`,720),left:720,top});top+=40;
 referenceParts.push({input:await sharp(`reference/side-by-side/${source}`).extract({left:0,top:0,width:halfWidth,height:metadata.height}).resize(720,450,{fit:'contain',background:'#08090b'}).jpeg({quality:87}).toBuffer(),left:0,top},{input:await tile(`${out}/after/1440-${after}.jpg`,720,450),left:720,top});top+=450;
}
await sharp({create:{width:1440,height:top,channels:3,background:'#08090b'}}).composite(referenceParts).jpeg({quality:87}).toFile(`${out}/historical-comparison.jpg`);
const files=['src/components/pages/AboutPageView.tsx','src/components/three/AboutPlume.ts','src/components/three/AboutTerrain.ts','src/components/three/AboutLicensedExplorer.ts','src/app/globals.css','src/lib/about-expertise-motion.ts','public/models/astronaut.glb'];
const manifest={baseCommit:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),branch:execFileSync('git',['branch','--show-current'],{encoding:'utf8'}).trim(),buildId:fs.readFileSync('.next/BUILD_ID','utf8').trim(),sourceHashes:Object.fromEntries(files.map(file=>[file,crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')])),evidenceLimits:'Actual local browser renders; historical official half only, different viewport/time; not pixel/motion parity, physical GPU, 60Hz or audio certification.'};
fs.writeFileSync(`${out}/manifest.json`,JSON.stringify(manifest,null,2)+'\n');
console.log(`Archived checks, three-width journeys, local before/after, labeled historical comparison and tested-source hashes in ${out}.`);
