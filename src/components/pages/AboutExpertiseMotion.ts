import { useStudioStore } from "@/lib/store";
import { expertiseCardPose, expertiseFit, expertiseScreenRatio, expertiseMobileFlip, expertisePinOffset } from "@/lib/about-expertise-motion";
import { editorialEase } from "@/lib/home-editorial-motion";
import { createAboutExpertiseLines } from "./AboutExpertiseLines";

/** Single owner for DOM poses and the optional encoded ribbons. Measured normal
 * document flow, not a second scroll engine or an authored sticky deck timeline. */
export function createAboutExpertiseMotion(section: HTMLElement, reduced: boolean) {
  const heading=section.querySelector<HTMLElement>(".about-expertise-heading")!, wrapper=section.querySelector<HTMLElement>(".about-expertise-cards-wrapper")!, cards=section.querySelector<HTMLElement>(".about-playing-cards")!;
  const slots=[...section.querySelectorAll<HTMLElement>(".about-card-slot")], flips=[...section.querySelectorAll<HTMLElement>(".about-card-flip")], words=[...section.querySelectorAll<HTMLElement>("[data-expertise-title-word]")];
  const canvas=section.querySelector<HTMLCanvasElement>(".about-expertise-lines canvas")!;
  let graphics:ReturnType<typeof createAboutExpertiseLines>|null=null, lost=false, disposed=false, dirty=true, raf=0, last=0, time=0, titleTime=0, entered=false, frames=0;
  let top=0,height=1,wrapperTop=0,wrapperWidth=1,cardHeight=1,cardWidth=1,width=innerWidth,vh=innerHeight;
  const blocked=()=>{const s=useStudioStore.getState();return s.menuOpen||s.reelOpen||s.isTransitioning;};
  const schedule=()=>{if(!disposed&&!raf&&!document.hidden&&!blocked())raf=requestAnimationFrame(render);};
  const pause=()=>{cancelAnimationFrame(raf);raf=0;last=0;section.dataset.expertiseRunning="false";};
  const measure=()=>{
    width=innerWidth;vh=innerHeight;cards.style.transform="";
    cardWidth=slots[0].offsetWidth;cardHeight=slots[0].offsetHeight;
    cards.style.height=width>812&&!reduced?`${cardHeight}px`:"";
    top=section.getBoundingClientRect().top+scrollY;height=section.offsetHeight;
    wrapperTop=wrapper.getBoundingClientRect().top+scrollY;wrapperWidth=wrapper.offsetWidth;
    if(width>812&&!reduced&&!graphics&&!lost){
      try{if(new URLSearchParams(location.search).get("forceWebglFallback")==="1")throw new Error("Forced optional fallback");graphics=createAboutExpertiseLines(canvas,schedule);}
      catch{lost=true;section.dataset.expertiseLines="fallback";}
    }
    if((width<=812||reduced)&&graphics){graphics.dispose();graphics=null;}
    graphics?.resize(width,vh);canvas.style.display=graphics?"block":"none";dirty=false;
  };
  function render(now:number){
    raf=0;if(disposed||document.hidden||blocked()){last=0;return;}
    if(dirty)measure();
    const screenY=top-scrollY,active=screenY<vh&&screenY+height>0;
    if(!active){entered=false;titleTime=0;pause();return;}
    const dt=last?Math.max(0,(now-last)/1000):0;last=now;
    const sr=expertiseScreenRatio(screenY,height,vh),desktop=width>812&&!reduced;
    if(!reduced)time+=dt;
    section.dataset.expertiseTime=time.toFixed(4);section.dataset.expertiseTitleTime=titleTime.toFixed(4);
    section.dataset.cardProgress=expertiseFit(sr,-1,1).toFixed(4);section.dataset.cardRange=sr.toFixed(5);section.dataset.cardLayout=desktop?"native":"reading";
    if(desktop){
      cards.style.transform=`translate3d(0,${expertisePinOffset(scrollY-wrapperTop+(vh-cardHeight)*.5,vh)}px,0)`;
      slots.forEach((slot,i)=>{const pose=expertiseCardPose(sr,i,wrapperWidth,cardWidth,time);slot.style.transform=`translate3d(${pose.x}px,${pose.y}px,0) rotateZ(${pose.roll}deg)`;slot.style.opacity="1";flips[i].style.transform=`rotateY(${pose.flip}deg)`;slot.dataset.nativeFlip=pose.flip.toFixed(4);});
    }else{
      cards.style.transform="";
      slots.forEach((slot,i)=>{slot.style.transform="";slot.style.opacity="1";const r=slot.getBoundingClientRect(),flip=reduced?0:expertiseMobileFlip(expertiseScreenRatio(r.top,r.height,vh),i);flips[i].style.transform=`rotateY(${flip}deg)`;slot.dataset.nativeFlip=flip.toFixed(4);});
    }
    const hr=heading.getBoundingClientRect(),show=hr.top<vh&&hr.bottom>0;
    if(show&&!entered){entered=true;titleTime=0;}if(show&&!reduced)titleTime+=dt;
    words.forEach((word,i)=>{
      if(!desktop){word.style.transform="";return;}
      const lift=i<2?100*(1-editorialEase(expertiseFit(titleTime-i/10,0,1))):-100*(1-editorialEase(expertiseFit(titleTime-i/10,.1,1.1)));
      const x=i<2?0:-width*.24*(1-editorialEase(expertiseFit(titleTime-i/10,1,2)));
      word.style.transform=`translate3d(${x}px,${lift}%,0)`;
    });
    heading.style.transform="";heading.style.opacity="1";
    const caption=heading.querySelector<HTMLElement>(".about-expertise-caption")!;
    caption.style.transform=desktop?`translateY(${110*(1-(titleTime>.25?1-2**(-10*expertiseFit(titleTime-.25,0,1)):0))}%)`:"";
    if(graphics&&!lost){try{graphics.render(screenY,canvas.getBoundingClientRect().top);section.dataset.expertiseLines=canvas.dataset.lineState||"loading";}catch{lost=true;canvas.style.display="none";section.dataset.expertiseLines="fallback";}}
    frames++;section.dataset.expertiseFrames=String(frames);section.dataset.expertiseRunning=String(!reduced);
    if(!reduced)schedule();else last=0;
  }
  const reflow=()=>{dirty=true;schedule();},visibility=()=>{if(document.hidden)pause();else reflow();};
  const onLost=(event:Event)=>{event.preventDefault();lost=true;canvas.style.display="none";section.dataset.expertiseLines="fallback";};
  const onRestored=()=>{lost=false;dirty=true;schedule();};
  const off=useStudioStore.subscribe((s,previous)=>{if(blocked())pause();else if(s.menuOpen!==previous.menuOpen||s.reelOpen!==previous.reelOpen||s.isTransitioning!==previous.isTransitioning)schedule();});
  const observer=new ResizeObserver(reflow);observer.observe(section);const main=section.closest("main");if(main)observer.observe(main);
  window.addEventListener("scroll",schedule,{passive:true});window.addEventListener("resize",reflow);document.addEventListener("visibilitychange",visibility);
  canvas.addEventListener("webglcontextlost",onLost);canvas.addEventListener("webglcontextrestored",onRestored);
  void document.fonts.ready.then(()=>{if(!disposed)reflow();});schedule();
  return()=>{disposed=true;pause();off();observer.disconnect();window.removeEventListener("scroll",schedule);window.removeEventListener("resize",reflow);document.removeEventListener("visibilitychange",visibility);canvas.removeEventListener("webglcontextlost",onLost);canvas.removeEventListener("webglcontextrestored",onRestored);graphics?.dispose();};
}
