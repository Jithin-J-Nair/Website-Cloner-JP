#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
const root='docs/validation/site-side-by-side';
const home='temp/side-by-side-repair/final',about='temp/side-by-side-repair/about';
fs.mkdirSync(root,{recursive:true});
const svg=(text,w,h=30)=>Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#202126"/><text x="10" y="21" fill="white" font-family="sans-serif" font-size="14">${text.replaceAll('&','&amp;').replaceAll('<','&lt;')}</text></svg>`);
async function tile(input,label,w=720,h=450){return sharp(input).resize(w,h,{fit:'contain',background:'#15161b'}).extend({top:30,bottom:0,left:0,right:0,background:'#202126'}).composite([{input:svg(label,w),left:0,top:0}]).jpeg({quality:83}).toBuffer()}
const pairs=[
 ['01_hero_crosses.jpg',`${home}/1440-hero.jpg`,'Hero'],
 ['02_play_reel_card.jpg',`${home}/1440-reel-stage.jpg`,'Reel: video frames not synchronized'],
 ['03_tablet_earth.jpg',`${home}/1440-tablet.jpg`,'Tablet'],
 ['04_step_into_new_world.jpg',`${home}/1440-title.jpg`,'Emergence title'],
 ['05_dark_truss_tunnel.jpg',`${home}/1440-dark.jpg`,'Dark shaft'],
 ['06_pink_wire_tunnel.jpg',`${home}/1440-pink.jpg`,'Pink vortex'],
 ['07_blue_white_room.jpg',`${home}/1440-blue.jpg`,'Blue corridor'],
 ['08_monitor_reveal_shards.jpg',`${home}/1440-shards.jpg`,'Monitor / shards'],
 ['09_about_plume_wordmark.jpg',`${about}/1440-opening.jpg`,'About opening'],
 ['10_about_terrain.jpg',`${about}/1440-terrain.jpg`,'About basin'],
 ['11_expertise_cards_vs_strategy_cards.jpg',`${about}/1440-about-capability.jpg`,'Expertise backs'],
 ['12_lets_work_together_cta.jpg',`${about}/1440-fronts.jpg`,'Expertise fronts (NOT a CTA reference)'],
];
for(let i=0;i<pairs.length;i++){
 const [ref,current,label]=pairs[i],p=`reference/side-by-side/${ref}`,m=await sharp(p).metadata();
 const source=await sharp(p).extract({left:0,top:0,width:Math.floor(m.width/2),height:m.height}).toBuffer();
 const left=await tile(source,'HISTORICAL SOURCE | viewport / motion phase unknown');
 const right=await tile(current,`LOCAL 1440 x 900 | ${label}`);
 await sharp({create:{width:1440,height:480,channels:3,background:'#15161b'}}).composite([{input:left,left:0,top:0},{input:right,left:720,top:0}]).jpeg({quality:84}).toFile(`${root}/${String(i+1).padStart(2,'0')}-comparison.jpg`);
}
const contactBefore=await tile(`${root}/before/1440-contact.jpg`,'CLONE BEFORE | Contact reset / stale overlay');
const contactAfter=await tile(`${home}/1440-route-contact.jpg`,'CLONE AFTER | Contact lands on footer');
await sharp({create:{width:1440,height:480,channels:3,background:'#15161b'}}).composite([{input:contactBefore,left:0,top:0},{input:contactAfter,left:720,top:0}]).jpeg({quality:84}).toFile(`${root}/contact-before-after.jpg`);
const fitBefore=await tile(`${root}/before/768-intermediate-hero.jpg`,'INTERMEDIATE CLONE | desktop anchors in narrow tablet stage');
const fitAfter=await tile(`${home}/768-hero.jpg`,'FINAL CLONE | existing portrait arrangement fits tablet');
await sharp({create:{width:1440,height:480,channels:3,background:'#15161b'}}).composite([{input:fitBefore,left:0,top:0},{input:fitAfter,left:720,top:0}]).jpeg({quality:84}).toFile(`${root}/tablet-fit-before-after.jpg`);
const beforeAfter=[];
for(const [row,name]of ['hero','tablet','title'].entries()){
 const source=await sharp(`${root}/${['01','03','04'][row]}-comparison.jpg`).extract({left:0,top:0,width:720,height:480}).resize(600,400,{fit:'contain',background:'#15161b'}).toBuffer();
 beforeAfter.push({input:source,left:0,top:row*430});
 beforeAfter.push({input:await tile(`temp/side-by-side-repair/before/1440-${name}.jpg`,`BEFORE | ${name}`,600,400),left:600,top:row*430});
 beforeAfter.push({input:await tile(`${home}/1440-${name}.jpg`,`AFTER | ${name}`,600,400),left:1200,top:row*430});
}
await sharp({create:{width:1800,height:1290,channels:3,background:'#15161b'}}).composite(beforeAfter).jpeg({quality:86}).toFile(`${root}/home-before-after.jpg`);
const homeNames=['hero','reel-intro','reel-stage','featured','tablet','title','dark','pink','blue','shards','contact','footer','reversed-hero','route-projects','route-contact'];
const aboutNames=['opening','pullback','terrain','narrative','team','about-clients','about-award','about-capability','fronts','cta','footer','reversed-opening'];
for(const width of [1440,768,390]){
 for(const [kind,folder,names]of [['home',home,homeNames],['about',about,aboutNames]]){
  const w=width===390?260:480,h=width===390?563:300,columns=3,tiles=[];
  for(const [i,name]of names.entries())tiles.push({input:await tile(`${folder}/${width}-${name}.jpg`,`${width}px | ${name}`,w,h),left:i%columns*w,top:Math.floor(i/columns)*(h+30)});
  await sharp({create:{width:columns*w,height:Math.ceil(tiles.length/columns)*(h+30),channels:3,background:'#15161b'}}).composite(tiles).jpeg({quality:80}).toFile(`${root}/${kind}-${width}.jpg`);
  fs.copyFileSync(`${folder}/${width}.json`,`${root}/${kind}-${width}.json`);
 }
}
for(const [folder,dest] of [[home,'home'],[about,'about']]){
 fs.mkdirSync(`${root}/${dest}`,{recursive:true});
 for(const file of fs.readdirSync(folder).filter(f=>f.endsWith('.jpg')))fs.copyFileSync(`${folder}/${file}`,`${root}/${dest}/${file}`);
}
if(fs.existsSync('temp/side-by-side-repair/fragments'))fs.cpSync('temp/side-by-side-repair/fragments',`${root}/fragments`,{recursive:true});
for(const name of ['hero','tablet','title'])fs.copyFileSync(`${home}/1440-${name}.jpg`,`${root}/1440-${name}.jpg`);
for(const width of [1440,768,390])fs.copyFileSync(`temp/home-motion-${width}-normal/report.json`,`${root}/interaction-${width}.json`);
for(const file of ['build.log','final-checks.log','remaining-checks.log','route-assets.log','final-after-fragment.log','final-responsive.log','interaction-recheck.log'])if(fs.existsSync(`temp/side-by-side-repair/${file}`))fs.writeFileSync(`${root}/${file}`,fs.readFileSync(`temp/side-by-side-repair/${file}`,'utf8').replace(/\r\n?/g,'\n').split('\n').map(line=>line.trimEnd()).join('\n').trimEnd()+'\n');
const sourceFiles=['src/components/home/HomePageView.tsx','src/components/home/HeroCrossesStage.tsx','src/components/home/GoalTunnelSection.tsx','src/components/foundation/SmoothScrollProvider.tsx','src/components/pages/AboutPageView.tsx','src/components/three/AboutTerrain.ts','src/components/three/AboutPlume.ts','src/components/three/AboutLicensedExplorer.ts'].map(file=>({file,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')}));
const manifest={sourceFiles,autonomousNormalStatus:'FAIL: zero records in glass interval; retained assertion failure',generatedAt:new Date().toISOString(),buildId:fs.readFileSync('.next/BUILD_ID','utf8').trim(),aboutCapturedBuildId:JSON.parse(fs.readFileSync(`${about}/1440.json`)).buildId,source:'Historical official halves only. Not fresh live access or synchronized source motion.',files:[]};
const walk=(dir,prefix='')=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name),prefix+e.name+'/'):[prefix+e.name]);
for(const file of walk(root).filter(f=>f!=='manifest.json')){const data=fs.readFileSync(path.join(root,file));manifest.files.push({file,bytes:data.length,sha256:crypto.createHash('sha256').update(data).digest('hex')})}
fs.writeFileSync(`${root}/manifest.json`,JSON.stringify(manifest,null,2));
console.log(`Built ${pairs.length} honest historical comparisons, before/after, and six route journeys. Build ${manifest.buildId}.`);
