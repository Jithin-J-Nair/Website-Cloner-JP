import assert from 'node:assert/strict';
import fs from 'node:fs';
import {launchMotionBrowser} from './lib/browser-runtime.mjs';
const base=process.env.BASE_URL||'http://127.0.0.1:3003';
const out=process.env.NAV_CAPTURES||'temp/motion-fidelity-round4/navigation';fs.mkdirSync(out,{recursive:true});
const browser=await launchMotionBrowser();const contexts=[];const errors=[];const report={base,scenarios:[]};
async function setup(options={}){
 const c=await browser.newContext({viewport:{width:1440,height:764},...options});contexts.push(c);
 await c.addInitScript(()=>{sessionStorage.setItem('lusion_booted_v1','1');window.__motionHidden=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__motionHidden});});
 const p=await c.newPage();p.on('pageerror',e=>errors.push(e.message));return{c,p};
}
const phase=async(p,want)=>p.waitForFunction(want=>document.querySelector('#route-transition')?.dataset.routePhase===want,want,{timeout:30000});
async function menuLink(p,href){await p.getByRole('button',{name:'Open navigation menu'}).click();await p.locator('#header-menu.--opened').waitFor();await p.locator(`#header-menu a[href="${href}"]`).click();}
async function released(p){await phase(p,'idle');assert.equal(await p.locator('#main-content').evaluate(e=>e.inert),false);assert.equal(await p.locator('#header').evaluate(e=>e.inert),false);assert.equal(await p.locator('#route-transition').evaluate(e=>e.hidden),true);}
try{
 // Slow destination: same visible owner must cover until Next commits, not a 120ms guess.
 const {c,p}=await setup();let release;const gate=new Promise(r=>release=r);
 await c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.pathname==='/about'&&u.searchParams.has('_rsc'))await gate;await r.continue();});
 await p.goto(base+'/projects');await p.waitForSelector('#projects-title');
 await p.getByRole('button',{name:'Open navigation menu'}).click();await p.waitForTimeout(650);
 const menu=await p.locator('#header-menu').evaluate(e=>['links','newsletter','talk','labs'].map(id=>{const s=getComputedStyle(e.querySelector('#header-menu-'+id));return{id,delay:s.transitionDelay,transform:s.transform};}));
 assert.deepEqual(menu.map(x=>x.delay),['0s','0.02s','0.04s','0.06s']);
 await p.locator('#header-menu a[href="/about"]').click();
 const pixels=await p.waitForFunction(()=>{
  const root=document.querySelector('#route-transition');if(root?.dataset.routePhase!=='hiding'||+root.dataset.routeProgress<.4||+root.dataset.routeProgress>.7)return false;
  const canvas=document.querySelector('#transition-overlay'),a=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;let transparent=0,opaque=0,white=0;
  for(let i=0;i<a.length;i+=4){if(a[i+3]<250)transparent++;if(a[i+3]===255)opaque++;if(a[i]>200&&a[i+1]>200&&a[i+2]>200)white++;}
  return{progress:+root.dataset.routeProgress,transparent,opaque,white};
 },null,{timeout:30000}).then(h=>h.jsonValue());
 assert.ok(pixels.transparent>100&&pixels.opaque>100&&pixels.white>100,'actual XOR cutout and white arms, not an opaque black rectangle');
 await p.screenshot({path:out+'/aperture-hiding.jpg'});
 // Programmatic double activation must not replace the in-flight destination.
 await p.locator('#header-menu a[href="/"]').evaluate(e=>e.click());await phase(p,'waiting');
 assert.equal(new URL(p.url()).pathname,'/projects');assert.equal(await p.locator('#main-content').evaluate(e=>e.inert),true);
 const frozen=await p.locator('#route-transition').getAttribute('data-route-frames');await p.waitForTimeout(200);assert.equal(await p.locator('#route-transition').getAttribute('data-route-frames'),frozen,'covered wait has no RAF');
 await p.screenshot({path:out+'/aperture-covered.jpg'});release();await p.waitForURL('**/about',{timeout:30000});await released(p);
 await p.waitForSelector('#about-who[data-scene-state="ready"]',{timeout:45000});assert.equal(await p.locator('#main-content').evaluate(e=>e===document.activeElement),true,JSON.stringify(await p.evaluate(()=>({active:document.activeElement?.outerHTML.slice(0,300),main:document.querySelector('#main-content')?.outerHTML.slice(0,160),route:document.querySelector('#route-transition')?.dataset}))));
 report.scenarios.push({name:'delayed commit, actual aperture pixels, single activation, static covered wait, ready destination and focus',pixels,menu});
 // Escape cancels before push: no stale component timer may navigate afterwards.
 await menuLink(p,'/projects');await phase(p,'hiding');await p.keyboard.press('Escape');await released(p);await p.waitForTimeout(1400);assert.equal(new URL(p.url()).pathname,'/about');assert.equal(await p.locator('#header-right-menu-btn').evaluate(e=>e===document.activeElement),true);report.scenarios.push({name:'Escape cancels uncommitted navigation and restores trigger'});
 // Visibility pause has no large hidden-time jump or background push.
 await menuLink(p,'/projects');await phase(p,'hiding');await p.evaluate(()=>{window.__motionHidden=true;document.dispatchEvent(new Event('visibilitychange'));});
 const paused=await p.locator('#route-transition').getAttribute('data-route-frames');await p.waitForTimeout(1200);assert.equal(await p.locator('#route-transition').getAttribute('data-route-frames'),paused);assert.equal(new URL(p.url()).pathname,'/about');
 await p.evaluate(()=>{window.__motionHidden=false;document.dispatchEvent(new Event('visibilitychange'));});await p.waitForURL('**/projects',{timeout:30000});await released(p);report.scenarios.push({name:'hidden sleep/resume'});
 // Native time-based portal: one huge real packet cannot skip the charge.
 await p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await p.waitForTimeout(250);
 assert.equal(Number(await p.locator('#scroll-nav-section').getAttribute('data-portal-charge')),0);await p.mouse.wheel(0,2400);await p.waitForTimeout(60);
 const packet=Number(await p.locator('#scroll-nav-section').getAttribute('data-portal-charge'));assert.ok(packet>0&&packet<.5,'real large packet has elapsed-time charge');
 await p.waitForTimeout(1200);assert.equal(new URL(p.url()).pathname,'/projects');assert.equal(Number(await p.locator('#scroll-nav-section').getAttribute('data-portal-charge')),0);
 const idle=await p.locator('#scroll-nav-section').getAttribute('data-portal-frames');await p.waitForTimeout(150);assert.equal(await p.locator('#scroll-nav-section').getAttribute('data-portal-frames'),idle,'empty portal sleeps');
 await p.evaluate(()=>{const id=setInterval(()=>{if(document.querySelector('#route-transition')?.dataset.routePhase!=='idle'){clearInterval(id);return;}window.dispatchEvent(new WheelEvent('wheel',{deltaY:40}));},16);});
 await phase(p,'hiding');await p.keyboard.press('Escape');await released(p);assert.equal(new URL(p.url()).pathname,'/projects');
 await p.evaluate(()=>{const id=setInterval(()=>{if(document.querySelector('#route-transition')?.dataset.routePhase!=='idle'){clearInterval(id);return;}window.dispatchEvent(new WheelEvent('wheel',{deltaY:40}));},16);});
 await phase(p,'hiding');await p.waitForURL(base+'/',{timeout:30000});await released(p);report.scenarios.push({name:'portal zero start, packet isolation, idle decay/sleep, cancelled-charge rearm and sustained auto-navigation',packet});
 await menuLink(p,'/about');await phase(p,'hiding');await p.goBack();await released(p);await p.waitForTimeout(1200);assert.equal(new URL(p.url()).pathname,'/projects');report.scenarios.push({name:'browser Back supersedes an uncommitted request without a stale push'});
 await c.close();contexts.splice(contexts.indexOf(c),1);
 // Reduced mobile: all three chapter links stay exposed without focus-expansion jumps.
 const mobile=await setup({viewport:{width:390,height:844},isMobile:true,hasTouch:true,reducedMotion:'reduce'});
 for(const route of ['/', '/about', '/projects']){
  await mobile.p.goto(base+route);const btn=mobile.p.locator('#scroll-nav-next');await btn.scrollIntoViewIfNeeded();const before=await btn.boundingBox();await btn.focus();const after=await btn.boundingBox();assert.ok(before&&after);assert.ok(Math.abs(before.y-after.y)<2,'focus does not resize/move mobile portal');
  assert.equal(await mobile.p.locator('#scroll-nav-section').evaluate(e=>e.scrollHeight<=e.clientHeight+1),true,'mobile chapter controls are not clipped');
 }
 await mobile.p.locator('#scroll-nav-next').tap();await mobile.p.waitForURL(base+'/');await released(mobile.p);assert.equal(Number(await mobile.p.locator('#route-transition').getAttribute('data-route-frames')||0),0);report.scenarios.push({name:'mobile stable unclipped chapter controls / reduced no-aperture navigation'});
 // Canvas2D failure: fade fallback still commits and releases input.
 await mobile.c.close();contexts.splice(contexts.indexOf(mobile.c),1);
 const fallback=await setup();await fallback.p.addInitScript(()=>{const get=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){return this.id==='transition-overlay'&&type==='2d'?null:get.call(this,type,...args);};});
 await fallback.p.goto(base+'/projects');await menuLink(fallback.p,'/about');await fallback.p.waitForURL('**/about');await released(fallback.p);report.scenarios.push({name:'Canvas2D failure retains usable fade/navigation'});
 // Live reduced-motion change consumes the existing transaction, not a second push.
 await menuLink(fallback.p,'/projects');await phase(fallback.p,'hiding');await fallback.p.emulateMedia({reducedMotion:'reduce'});await fallback.p.waitForURL('**/projects');await released(fallback.p);await fallback.p.waitForTimeout(1100);assert.equal(new URL(fallback.p.url()).pathname,'/projects');report.scenarios.push({name:'live reduced-motion change'});
 await fallback.c.close();contexts.splice(contexts.indexOf(fallback.c),1);
 // A genuinely hung RSC load releases input; later delivery cannot resurrect the aperture.
 const hung=await setup();let unblock;const blocked=new Promise(r=>unblock=r);
 await hung.c.route('**/*',async r=>{const u=new URL(r.request().url());if(u.pathname==='/projects/oryzo_ai'&&u.searchParams.has('_rsc'))await blocked;await r.continue();});
 await hung.p.goto(base+'/projects');await hung.p.locator('a[href="/projects/oryzo_ai"]').first().click();await phase(hung.p,'waiting');
 await hung.p.waitForFunction(()=>document.querySelector('#route-transition')?.dataset.routeResult==='cancelled',null,{timeout:20000});await released(hung.p);assert.equal(new URL(hung.p.url()).pathname,'/projects');
 unblock();await hung.p.waitForURL('**/projects/oryzo_ai',{timeout:30000});await released(hung.p);
 // Case-menu Contact is a Home/footer handoff, not an unexpected mail client.
 await hung.p.getByRole('button',{name:'Open navigation menu'}).click();await hung.p.locator('#header-menu').getByRole('button',{name:'Contact',exact:true}).click();await hung.p.waitForURL('**/#footer-section',{timeout:30000});await released(hung.p);
 const contact=await hung.p.locator('#footer-section').boundingBox();assert.ok(contact&&contact.y<764&&contact.y+contact.height>0,'case Contact preserves fragment scroll');
 report.scenarios.push({name:'hung request recovery / late delivery / case Contact-to-Home-footer fragment'});
 await hung.c.close();contexts.splice(contexts.indexOf(hung.c),1);
 const touch=await setup({viewport:{width:390,height:844},isMobile:true,hasTouch:true});await touch.p.goto(base+'/projects?forceWebglFallback=1');await touch.p.waitForSelector('#scroll-nav-section[data-portal-charge]');await touch.p.evaluate(()=>document.fonts.ready);await touch.p.evaluate(()=>window.scrollTo(0,document.documentElement.scrollHeight));await touch.p.waitForFunction(()=>Math.abs(scrollY+innerHeight-document.documentElement.scrollHeight)<5);await touch.p.waitForTimeout(100);
 const touchSession=await touch.c.newCDPSession(touch.p);
 await touchSession.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:180,y:700}]});
 await touchSession.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:180,y:680}]});
 await touch.p.waitForTimeout(60);const touchCharge=Number(await touch.p.locator('#scroll-nav-section').getAttribute('data-portal-charge'));assert.ok(touchCharge>0&&touchCharge<1);
 await touchSession.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});await touchSession.detach();await touch.p.waitForTimeout(1000);assert.equal(Number(await touch.p.locator('#scroll-nav-section').getAttribute('data-portal-charge')),0);report.scenarios.push({name:'real CDP touch upward input and cancellation, isolated with forced graphics fallback',touchCharge});
 assert.deepEqual(errors,[]);report.errors=errors;fs.writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log('PASS shared navigation:',report.scenarios.map(x=>x.name).join('; '));
}catch(error){fs.writeFileSync(out+'/failed-report.json',JSON.stringify({...report,errors,error:String(error)},null,2));throw error;}finally{for(const c of contexts)await c.close().catch(()=>{});await browser.close();}
