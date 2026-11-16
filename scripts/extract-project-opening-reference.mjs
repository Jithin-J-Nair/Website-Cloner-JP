#!/usr/bin/env node
/** Extract evidence from the user-supplied film. Does not modify the application. */
import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync,execFileSync} from 'node:child_process';
import sharp from 'sharp';

const input=process.env.OPENING_REFERENCE_VIDEO||'public/videos/lusion-project-opening.mp4';
const out=process.env.OPENING_REFERENCE_OUT||'temp/project-opening-video-audit/reference';
const bundled='temp/video-tools/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v9.0.2';
const ffmpeg=process.env.FFMPEG_PATH||(fs.existsSync(bundled)?bundled:'ffmpeg');
fs.mkdirSync(out,{recursive:true});
const bytes=fs.readFileSync(input);
// An input-only invocation deliberately exits 1 (no output specified). Parse its
// metadata, but reject missing input/decoder metadata rather than hiding failure.
const inspection=spawnSync(ffmpeg,['-hide_banner','-i',input],{encoding:'utf8'});
if(inspection.error)throw inspection.error;
const metadata=inspection.stderr||'';
const duration=metadata.match(/Duration: (\d+):(\d+):([\d.]+)/);
const dimensions=metadata.match(/Video:.*?\b(\d{3,5})x(\d{3,5})\b/);
const fps=metadata.match(/Video:.*?([\d.]+) fps/);
if(!duration||!dimensions||inspection.status!==1)throw new Error(`Cannot inspect reference film: ${metadata}`);
const series=(start,count)=>Array.from({length:count},(_,i)=>Number((start+i/6).toFixed(6)));
const groups=[
 {name:'hover',times:[0,1,2,3,4,5,6,7]},
 {name:'oryzo-opening',times:series(7.333333,18)},
 {name:'oryzo-reverse',times:series(16,15)},
 {name:'atlas-opening',times:series(19,18)},
 {name:'gallery',times:[10.5,11.5,12.5,13.5,14.5,15.5,16,22.5,24]},
];
const manifest={
 input,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex'),
 gitBlob:createHash('sha1').update(`blob ${bytes.length}\0`).update(bytes).digest('hex'),
 durationSeconds:Number(duration[1])*3600+Number(duration[2])*60+Number(duration[3]),
 encodedFrame:{width:Number(dimensions[1]),height:Number(dimensions[2]),fps:fps?Number(fps[1]):null},
 note:'Times are nominal seek samples, rounded to the encoded frame grid. They are not browser input-event timestamps. Full frames retain browser chrome and recording margins. Contact sheets are actual extracted frames, not generated reference art.',
 groups:[],
};
const thumbWidth=430,thumbHeight=242,labelHeight=26,columns=6;
for(const group of groups){
 const dir=path.join(out,group.name);fs.mkdirSync(dir,{recursive:true});
 const entries=[],composite=[];
 for(const [index,time] of group.times.entries()){
  const file=`frame-${String(index).padStart(2,'0')}.jpg`;
  const dest=path.join(dir,file);
  execFileSync(ffmpeg,['-hide_banner','-loglevel','error','-ss',String(time),'-i',input,'-frames:v','1','-q:v','2','-y',dest],{stdio:'pipe'});
  const image=await sharp(dest).resize(thumbWidth,thumbHeight,{fit:'contain',background:'#151515'}).toBuffer();
  const label=Buffer.from(`<svg width="${thumbWidth}" height="${labelHeight}"><rect width="100%" height="100%" fill="#151515"/><text x="12" y="18" fill="#ffffff" font-size="14">${group.name} | approximately ${time.toFixed(3)} s</text></svg>`);
  const left=index%columns*thumbWidth,top=Math.floor(index/columns)*(thumbHeight+labelHeight);
  composite.push({input:label,left,top},{input:image,left,top:top+labelHeight});
  entries.push({file:path.relative(out,dest),nominalSeconds:time});
 }
 const sheet=`${group.name}-timeline.jpg`;
 await sharp({create:{width:columns*thumbWidth,height:Math.ceil(entries.length/columns)*(thumbHeight+labelHeight),channels:3,background:'#151515'}}).composite(composite).jpeg({quality:90}).toFile(path.join(out,sheet));
 manifest.groups.push({name:group.name,sheet,frames:entries});
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({...manifest,groups:manifest.groups.map(({name,sheet,frames})=>({name,sheet,samples:frames.length}))},null,2));
