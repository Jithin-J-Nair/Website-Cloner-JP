import assert from 'node:assert/strict';
import path from 'node:path';
import sharp from 'sharp';

export async function checkHomeEditorial(page,{width,height,reduced,out}) {
 const result={line:[],morph:[],errors:[]};
 const seek=async y=>{
  y=Math.max(0,Math.round(y));
  await page.evaluate(y=>{if(window.__lenis)window.__lenis.scrollTo(y,{immediate:true,force:true});else window.scrollTo(0,y);},y);
  await page.waitForFunction(y=>Math.abs(Number(document.getElementById('home').dataset.editorialPixel)-y)<1,y);
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 };
 const box=selector=>page.locator(selector).first().evaluate(el=>{const r=el.getBoundingClientRect();return {top:r.top+scrollY,left:r.left,width:r.width,height:r.height};});
 const root=()=>page.locator('#home').evaluate(el=>({...el.dataset}));
 const frame=async()=>{const before=Number((await root()).editorialFrames);await page.evaluate(()=>window.dispatchEvent(new Event('scroll')));await page.waitForFunction(before=>Number(document.getElementById('home').dataset.editorialFrames)>before,before);};
 const capture=async name=>{const file=path.join(out,name+'.png');await page.screenshot({path:file,timeout:90000});return file;};
 const region=async(selector)=>{const b=await page.locator(selector).first().boundingBox();return {left:Math.round(b.x+b.width*.12),top:Math.round(Math.max(0,b.y)+b.height*.12),width:Math.round(b.width*.26),height:Math.round(Math.min(b.height*.25,height-Math.max(0,b.y)-4))};};
 const pixels=async(rect)=>sharp(await page.screenshot({timeout:90000})).extract(rect).removeAlpha().raw().toBuffer();
 const difference=(a,b)=>{assert.equal(a.length,b.length);let changed=0,total=0;for(let i=0;i<a.length;i++){const d=Math.abs(a[i]-b[i]);total+=d;if(d>4)changed++;}return {changed,mean:total/a.length};};
 await page.evaluate(()=>document.fonts.ready);
 const reel=await box('#home-reel');
 await seek((await box('#home-reel-title')).top-130);
 if(!reduced&&width>812)await page.waitForFunction(()=>[...document.querySelectorAll('[data-reel-word]')].every(el=>{const m=new DOMMatrix(getComputedStyle(el).transform);return Math.abs(m.m41)<.1&&Math.abs(m.m42)<.1;}));
 await capture('intro');
 for(const y of [reel.top-height*.4,reel.top+height*.9]){await seek(y);await page.waitForFunction(()=>document.getElementById('home').dataset.editorialLineVertices==='640');result.line.push((await root()).editorialLineProgress);}
 if(!reduced){assert.equal(Number(result.line[0]),0);assert.equal(Number(result.line[1]),1);await seek(reel.top-height*.4);assert.equal((await root()).editorialLineProgress,result.line[0]);}
 else assert.ok(result.line.every(p=>Number(p)===1),'reduced motion exposes a complete, static native ribbon');
 const thumb=await box('#home-reel-thumb'),outer=await box('#home-reel-container');
 const from=thumb.top-(height-thumb.height)*.5,to=outer.top-(height-outer.height)*.5;
 // Native playback starts only at a completed morph. Rounding a fractional
 // endpoint DOWN can stop a fraction of a pixel before it at 900px height.
 // Bracket both endpoints instead; do not weaken glyph or reversal assertions.
 const yValues=width>812&&!reduced?[Math.floor(from),(from+to)*.5,Math.ceil(to)]:[outer.top-height*.15];
 for(const [i,y] of yValues.entries()){
  await seek(y);await page.waitForFunction(()=>document.getElementById('home').dataset.editorialWebgl==='ready');await frame();
  result.morph.push({y,state:await root()});await capture('reel-'+i);
 }
 if(width>812&&!reduced){assert.ok(Number(result.morph[0].state.editorialMorph)<.002);assert.ok(Math.abs(Number(result.morph[1].state.editorialMorph)-.5)<.002);assert.ok(Number(result.morph[2].state.editorialMorph)>.998);await seek(yValues[1]);assert.equal((await root()).editorialMorph,result.morph[1].state.editorialMorph,'morph reverses to the same geometry coordinate');await seek(yValues[2]);}
 const filmRect=await region('#home-reel-video-container');
 const a=await pixels(filmRect);
 const stats=await sharp(a,{raw:{width:filmRect.width,height:filmRect.height,channels:3}}).stats();
 assert.ok(stats.channels.reduce((sum,c)=>sum+c.mean,0)>20,'decoded film pixels cannot be a black WebGL rectangle');
 const time=await page.locator('#home-reel-video').evaluate(v=>v.currentTime);
 if(!reduced){await page.waitForFunction(t=>document.getElementById('home-reel-video').currentTime>t+.15,time);await frame();}
 else await page.waitForTimeout(400);
 result.filmPixels=difference(a,await pixels(filmRect));
 if(!reduced)assert.ok(result.filmPixels.changed>100,'the visible shared film actually advances');
 else {assert.equal(result.filmPixels.changed,0,'reduced film stays pixel-static');assert.equal(await page.locator('#home-reel-video').evaluate(v=>v.paused),true);}
 if(!reduced&&width>812){
   const glyphs=()=>page.locator('[data-reel-glyph]').evaluateAll(es=>es.map(e=>e.style.transform).join('|'));
   await page.waitForTimeout(1500);const before=await glyphs();await page.waitForFunction(before=>[...document.querySelectorAll('[data-reel-glyph]')].map(e=>e.style.transform).join('|')!==before,before,{timeout:10000});result.glyphRoll=true;
   await page.waitForFunction(()=>[...document.querySelectorAll('[data-reel-glyph]')].some(el=>{const y=new DOMMatrix(getComputedStyle(el).transform).m42,h=parseFloat(getComputedStyle(el).fontSize);return Math.abs(y+h)<.1;}),null,{timeout:10000});
   const coverage=await page.locator('.reel-glyph-slot').evaluateAll(slots=>slots.map(slot=>{const r=slot.getBoundingClientRect();return [...slot.querySelectorAll('[data-reel-glyph]>span')].reduce((sum,el)=>{const b=el.getBoundingClientRect();return sum+Math.max(0,Math.min(r.bottom,b.bottom)-Math.max(r.top,b.top));},0)/r.height;}));
   assert.ok(coverage.every(value=>value>.98),'rolling a full em must reveal the duplicate glyph, not leave a blank letter');result.glyphCoverage=coverage;
 }
 const first=page.locator('#home-featured .project-item').first(),firstStage=first.locator('.project-item-main');
 const firstBox=await box('#home-featured .project-item-main');await seek(firstBox.top-170);
 await page.waitForFunction(()=>document.querySelector('#home-featured .project-item-main').dataset.depthReady==='true');
 // Settle the entry and spring before isolating pointer depth, rather than confusing entry pixels with hover.
 await page.waitForTimeout(reduced?100:2300);await frame();await page.mouse.move(2,2);
 const cardRect=await region('#home-featured .project-item-main');const before=await pixels(cardRect);
 if(width>812&&!reduced){
   const b=await firstStage.boundingBox();await page.mouse.move(b.x+b.width*.85,b.y+b.height*.25);
   await page.waitForFunction(()=>{const f=document.querySelector('#home-featured .project-item-main').dataset.focus?.split(',').map(Number);return f&&Math.abs(f[0])>20&&f[2]>.9;});
   result.hoverPixels=difference(before,await pixels(cardRect));assert.ok(result.hoverPixels.changed>100,'hover changes actual depth-rendered pixels, not just telemetry');
   await capture('card-depth-hover');await page.mouse.move(2,2);
   await page.waitForFunction(()=>{const f=document.querySelector('#home-featured .project-item-main').dataset.focus?.split(',').map(Number);return f&&Math.abs(f[0])<.1&&Math.abs(f[1])<.1&&Math.abs(f[2])<.001;},null,{timeout:30000});
   result.pointerReleased=true;
 }else {await page.waitForTimeout(350);result.staticCard=difference(before,await pixels(cardRect));if(reduced)assert.equal(result.staticCard.changed,0,'reduced card pixels remain still');else assert.ok((await firstStage.getAttribute('data-focus')).split(',').map(Number).every(n=>Math.abs(n)<.1),'touch cannot latch hover depth');}
 await capture('featured');
 const cards=await page.locator('#home-featured .project-item').evaluateAll(es=>es.map(e=>({href:e.getAttribute('href'),name:e.getAttribute('aria-label')})));
 assert.equal(cards.length,12);assert.ok(cards.every(c=>c.href.startsWith('/projects/')&&c.name));result.cards=cards;
 // Every pair must decode independently; fast jumps must not leave a blank surface or latched frame.
 for(let i=0;i<12;i+=width>812?2:1){const target=await box(`#home-featured .project-item:nth-child(${i+1}) .project-item-main`);await seek(target.top-150);await page.waitForFunction(i=>{const e=document.querySelectorAll('#home-featured .project-item-main')[i];return e.dataset.depthReady==='true'||e.dataset.depthFailed==='true';},i);assert.equal(await page.locator('#home-featured .project-item-main').nth(i).getAttribute('data-depth-ready'),'true');}
 await page.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight-innerHeight));await page.waitForFunction(()=>getComputedStyle(document.getElementById('home-editorial-canvas')).display==='none');
 await page.waitForFunction(()=>document.getElementById('home-reel-video').paused);
 const frozen=Number((await root()).editorialFrames);await page.waitForTimeout(400);assert.equal(Number((await root()).editorialFrames),frozen,'upper renderer sleeps outside its bands');result.offscreenPaused=true;
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 // Modal still opens on the real centered button, not a synthetic JS store action.
 await seek(width>812&&!reduced?to+100:outer.top-height*.15);
 await page.locator('#home-reel-video-watch-btn').click();await page.waitForFunction(()=>document.getElementById('home-reel-video').paused);
 result.modal=true;
 await page.keyboard.press('Escape');
 return result;
}
