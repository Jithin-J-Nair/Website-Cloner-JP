import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const input='temp/reference-cards',out='docs/validation/about-reference-cards';
fs.mkdirSync(`${out}/after`,{recursive:true});fs.mkdirSync(`${out}/checks`,{recursive:true});
for(const name of fs.readdirSync(input)) {
 if(name.endsWith('.jpg')||name.endsWith('.json'))fs.copyFileSync(`${input}/${name}`,`${out}/after/${name}`);
 if(name.endsWith('.log'))fs.writeFileSync(`${out}/checks/${name}`,fs.readFileSync(`${input}/${name}`,'utf8').replace(/\u001b\[[0-9;]*m/g,'').replace(/\r/g,'\n').split('\n').map(s=>s.trimEnd()).join('\n').trimEnd()+'\n');
}
for(const sub of ['boundaries','boundaries-before']){fs.mkdirSync(`${out}/${sub}`,{recursive:true});for(const file of fs.readdirSync(`${input}/${sub}`))fs.copyFileSync(`${input}/${sub}/${file}`,`${out}/${sub}/${file}`);}
const label=(text,width)=>Buffer.from(`<svg width="${width}" height="30"><rect width="100%" height="100%" fill="#17191e"/><text x="12" y="20" fill="#f9f9fa" font-family="sans-serif" font-size="13">${text.replaceAll('&','&amp;')}</text></svg>`);
async function sheet(width,tiles,columns,file){
 const height=Math.round(width*tiles[0].height/tiles[0].width),tileH=height+30;
 const composite=[];
 for(let i=0;i<tiles.length;i++){
  const tile=tiles[i],left=(i%columns)*width,top=Math.floor(i/columns)*tileH;
  composite.push({input:label(tile.label,width),left,top});
  composite.push({input:await sharp(tile.path).resize(width,height,{fit:'contain',background:'#101216'}).toBuffer(),left,top:top+30});
 }
 await sharp({create:{width:width*columns,height:tileH*Math.ceil(tiles.length/columns),channels:3,background:'#101216'}}).composite(composite).jpeg({quality:84}).toFile(`${out}/${file}`);
}
await sheet(720,[['1440-opening.jpg','Opening / solid wordmark'],['1440-terrain.jpg','Pullback / grounded explorer / manifesto'],['1440-cards-2-p0.jpg','Expertise / back composition'],['1440-cards-6-p0.88.jpg','Expertise / settled service fronts']].map(([file,label])=>({path:`${input}/${file}`,label,width:1440,height:900})),2,'desktop-sheet.jpg');
await sheet(390,[['390-opening.jpg','Phone / opening'],['390-terrain.jpg','Phone / pullback intermediate'],['390-reading-card-0.jpg','Phone / Strategy'],['390-reading-card-3.jpg','Phone / Production']].map(([file,label])=>({path:`${input}/${file}`,label,width:390,height:844})),2,'phone-sheet.jpg');
for(const [ref,local,name] of [
 ['11_expertise_cards_vs_strategy_cards.jpg','1440-cards-2-p0.jpg','historical-back-comparison.jpg'],
 ['12_lets_work_together_cta.jpg','1440-cards-6-p0.88.jpg','historical-front-comparison.jpg'],
]){
 const original=`reference/side-by-side/${ref}`,meta=await sharp(original).metadata();
 const half=await sharp(original).extract({left:0,top:28,width:Math.floor(meta.width/2)-4,height:meta.height-28}).resize({width:720}).toBuffer();
 const localBuffer=await sharp(`${input}/${local}`).resize(720,450).toBuffer();
 await sharp({create:{width:1440,height:480,channels:3,background:'#101216'}}).composite([
  {input:label('Historical official still / viewport differs / motion unverified',720),left:0,top:0},
  {input:label('Local 1440 x 900 / authored reversible interpolation',720),left:720,top:0},
  {input:half,left:0,top:30},{input:localBuffer,left:720,top:30},
 ]).jpeg({quality:85}).toFile(`${out}/${name}`);
}
const baseline='docs/validation/about-structures/after';
await sheet(720,[
 {path:`${baseline}/1440-u0.jpg`,label:'Before / 30c8643 opening',width:1440,height:900},
 {path:`${input}/1440-opening.jpg`,label:'After / wordmark and finer grains',width:1440,height:900},
 {path:`${baseline}/1440-u1.6.jpg`,label:'Before / 30c8643 basin',width:1440,height:900},
 {path:`${input}/1440-terrain.jpg`,label:'After / asymmetric ridge, figure and editorial split',width:1440,height:900},
],2,'local-before-after.jpg');
console.log(`Saved labeled evidence in ${path.resolve(out)}; historical/source and local viewport differences are explicit.`);
for(const width of [1440,768,390]) {
 const dir='temp/master/after',report=JSON.parse(fs.readFileSync(`${dir}/${width}.json`,'utf8'));
 fs.copyFileSync(`${dir}/${width}.json`,`${out}/checks/master-${width}.json`);
 await sheet(width===390?260:420,report.shots.map(shot=>({path:`${dir}/${shot.file}`,label:shot.file,width,height:report.height})),3,`journey-${width}.jpg`);
}
