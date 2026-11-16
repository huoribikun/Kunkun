const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export function orbitPose(progress,rx,ry){
 const t=clamp(progress,0,1);if(t===0)return {x:0,y:0,angle:-10};if(t===1)return {x:0,y:0,angle:350};
 const theta=t*Math.PI*2;let tangent=Math.atan2(-ry*Math.cos(theta),rx*Math.sin(theta))*180/Math.PI;if(tangent< -90)tangent+=360;
 const start=40*(1-clamp(t/.1,0,1)),end=40*clamp((t-.9)/.1,0,1);
 return {x:rx*(1-Math.cos(theta)),y:-ry*Math.sin(theta),angle:tangent+40+start+end};
}
export function orbitKeyframes(rx,ry,samples=64){return Array.from({length:samples+1},(_,i)=>{const t=i/samples,p=orbitPose(t,rx,ry);return {offset:t,transform:`translate3d(${p.x.toFixed(3)}px,${p.y.toFixed(3)}px,0) rotate(${p.angle.toFixed(3)}deg)`};});}
export function initSignatureAnimations(){
 const media=matchMedia('(prefers-reduced-motion: reduce)'),contact=document.querySelector('#contact'),plane=document.querySelector('.contact-doodle'),flower=document.querySelector('.about-flower');
 const flight=document.createElement('div');flight.className='contact-plane-motion';flight.append(...Array.from(plane.childNodes));plane.append(flight);
 const sentinel=document.createElement('span');sentinel.className='flower-entry-sentinel';sentinel.setAttribute('aria-hidden','true');flower.parentElement.append(sentinel);
 const abort=new AbortController(),signal=abort.signal;let planeAnimation=null,flowerAnimation=null,planeRevision=0,flowerRevision=0,destroyed=false;
 const reduced=()=>media.matches;
 const resetPlane=()=>{planeRevision++;planeAnimation?.cancel();planeAnimation=null;flight.style.transform='rotate(-10deg)';flight.style.opacity='1';};
 const resetFlower=()=>{flowerRevision++;flowerAnimation?.cancel();flowerAnimation=null;flower.style.removeProperty('transform');flower.style.removeProperty('opacity');flower.classList.remove('flower-landed');};
 async function playPlane(){
  resetPlane();if(destroyed||document.hidden||typeof flight.animate!=='function')return;
  const token=planeRevision;let frames,timing;
  {
   const area=contact.getBoundingClientRect(),heading=contact.querySelector('h2').getBoundingClientRect();
   const width=plane.offsetWidth||area.width*.12,height=plane.offsetHeight||width*.93;
   const homeX=plane.offsetLeft+width/2,homeY=plane.offsetTop+height/2;
   const centerX=heading.left-area.left+heading.width/2;
   const availableX=Math.max(24,(area.width-homeX-width/2-14)/2);
   const rx=clamp(centerX-homeX,24,availableX);
   const availableY=Math.max(24,Math.min(homeY-height/2-14,area.height-homeY-height/2-14));
   const ry=Math.min(availableY,Math.max(65,heading.height*.7+20));
   frames=orbitKeyframes(rx,ry);if(reduced())frames=frames.map(frame=>({...frame,transform:frame.transform.replace(/rotate\([^)]*\)/,'rotate(-10deg)')}));timing={duration:reduced()?4400:3400,delay:140,easing:'cubic-bezier(.4,0,.25,1)',fill:'both'};
  }
  planeAnimation=flight.animate(frames,timing);const animation=planeAnimation;
  await animation.finished.catch(()=>{});if(destroyed||token!==planeRevision)return;
  flight.style.transform='rotate(-10deg)';flight.style.opacity='1';animation.cancel();planeAnimation=null;
 }
 async function playFlower(){
  resetFlower();if(destroyed)return;const token=flowerRevision;
  if(typeof flower.animate!=='function'){flower.classList.add('flower-landed');return;}
  const frames=reduced()?[{opacity:0,transform:'translate3d(0,-32px,0) rotate(10deg)'},{opacity:1,transform:'translate3d(0,0,0) rotate(10deg)'}]:[
   {opacity:0,transform:'translate3d(0,-125px,0) rotate(-32deg) scale(.65)',offset:0},
   {opacity:.85,transform:'translate3d(0,-34px,0) rotate(-5deg) scale(.94)',offset:.42},
   {opacity:1,transform:'translate3d(0,11px,0) rotate(16deg) scale(1.05)',offset:.7},
   {opacity:1,transform:'translate3d(0,-4px,0) rotate(7deg) scale(.98)',offset:.86},
   {opacity:1,transform:'translate3d(0,0,0) rotate(10deg) scale(1)',offset:1}
  ];
  flowerAnimation=flower.animate(frames,{duration:reduced()?650:1150,easing:'cubic-bezier(.25,.6,.35,1)',fill:'both'});const animation=flowerAnimation;
  await animation.finished.catch(()=>{});if(destroyed||token!==flowerRevision)return;
  flower.classList.add('flower-landed');animation.cancel();flowerAnimation=null;
 }
 const watches=[{target:contact,threshold:.75,visible:false,play:playPlane,reset:resetPlane},{target:sentinel,threshold:.6,visible:false,play:playFlower,reset:resetFlower}];
 const onEntries=entries=>{for(const entry of entries){const watch=watches.find(w=>w.target===entry.target);if(!watch)continue;const ratio=entry.isIntersecting?(entry.intersectionRatio??1):0;if(ratio>=watch.threshold&&!watch.visible){watch.visible=true;watch.play();}else if(ratio<.1&&watch.visible){watch.visible=false;watch.reset();}}};
 let observer=null;
 if('IntersectionObserver'in window){observer=new IntersectionObserver(onEntries,{threshold:[0,.1,.6,.75,1]});watches.forEach(watch=>observer.observe(watch.target));}
 else{flower.classList.add('flower-landed');}
 document.addEventListener('visibilitychange',()=>{if(document.hidden)watches.forEach(w=>w.reset());else watches.filter(w=>w.visible).forEach(w=>w.play());},{signal});
 media.addEventListener('change',()=>{watches.forEach(w=>w.reset());watches.filter(w=>w.visible).forEach(w=>w.play());},{signal});
 window.addEventListener('resize',()=>{if(planeAnimation)resetPlane();},{passive:true,signal});
 document.documentElement.classList.add('signature-ready');
 return {playPlane,playFlower,onEntries,destroy(){destroyed=true;abort.abort();observer?.disconnect();resetPlane();resetFlower();sentinel.remove();}};
}
