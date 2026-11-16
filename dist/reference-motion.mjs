export const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
export const wrapScene=(index,count)=>((index%count)+count)%count;
export function magneticOffset(x,y,width,height){return {x:clamp((x-width/2)*.18,-12,12),y:clamp((y-height/2)*.18,-9,9)};}
const create=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
export function initReferenceMotion(projects){
 const media=matchMedia('(prefers-reduced-motion: reduce)'),fine=matchMedia('(hover: hover) and (pointer: fine)');
 const still=()=>media.matches||document.documentElement.classList.contains('motion-disabled');
 const hero=document.querySelector('.hero-art');const front=hero.querySelector('.hero-work-front'),back=hero.querySelector('.hero-work-back img');
 const sources=projects.find(p=>p.id==='scenes').groups.flatMap(g=>g.images);
 const scenes=[32,27,31].map(order=>sources.find(item=>item.sourceOrder===order));
 let index=0,timer=0,transition=[],revision=0,busy=false,visible=true,hover=false;
 const viewport=create('div','hero-scene-viewport');const label=front.querySelector('span');front.querySelector('img').remove();front.prepend(viewport);front.classList.add('hero-sequence');
 const sceneName=create('span','hero-scene-name');label.replaceChildren(sceneName,create('i','','↗'));
 const controls=create('div','hero-scene-controls');controls.setAttribute('role','group');controls.setAttribute('aria-label','切换首屏插画场景');
 const dots=scenes.map((scene,i)=>{const button=create('button','hero-scene-dot');button.type='button';button.setAttribute('aria-label',`切换到${scene.title}`);button.addEventListener('click',()=>show(i));controls.append(button);return button;});hero.append(controls);
 function image(scene){const img=create('img');img.src=scene.src;img.alt=scene.alt;img.width=scene.width;img.height=scene.height;img.decoding='async';img.draggable=false;return img;}
 function schedule(){clearTimeout(timer);if(!still()&&visible&&!hover&&!document.hidden&&!document.querySelector('dialog[open]'))timer=setTimeout(()=>show(index+1),5800);}
 function settle(){revision++;transition.forEach(animation=>animation.cancel());transition=[];busy=false;viewport.replaceChildren(image(scenes[index]));}
 async function show(next){
  const target=wrapScene(next,scenes.length);if(busy||target===index){schedule();return;}
  clearTimeout(timer);index=target;const current=viewport.firstElementChild,upcoming=image(scenes[index]);const token=++revision;
  sceneName.textContent=`${String(index+1).padStart(2,'0')} / ${scenes[index].title}`;dots.forEach((dot,i)=>{dot.classList.toggle('active',i===index);dot.setAttribute('aria-pressed',String(i===index));});back.src=scenes[wrapScene(index+1,scenes.length)].thumb;
  if(still()||typeof viewport.animate!=='function'){viewport.replaceChildren(upcoming);schedule();return;}
  busy=true;viewport.append(upcoming);const timing={duration:1000,easing:'cubic-bezier(.76,0,.24,1)',fill:'both'};
  transition=[current.animate([{transform:'translateY(0%) scale(1)',opacity:1},{transform:'translateY(-30%) scale(.96)',opacity:.4}],timing),upcoming.animate([{clipPath:'inset(100% 0 0 0)',transform:'translateY(24%) scale(1.12)'},{clipPath:'inset(0% 0 0 0)',transform:'translateY(0%) scale(1)'}],timing)];
  await Promise.all(transition.map(a=>a.finished.catch(()=>{})));if(revision!==token)return;transition.forEach(a=>a.cancel());transition=[];viewport.replaceChildren(upcoming);busy=false;schedule();
 }
 viewport.append(image(scenes[0]));sceneName.textContent=`01 / ${scenes[0].title}`;dots[0].classList.add('active');dots.forEach((dot,i)=>dot.setAttribute('aria-pressed',String(i===0)));back.src=scenes[1].thumb;
 hero.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse'){hover=true;schedule();}});hero.addEventListener('pointerleave',()=>{hover=false;schedule();});hero.addEventListener('focusin',()=>{hover=true;schedule();});hero.addEventListener('focusout',e=>{if(!hero.contains(e.relatedTarget)){hover=false;schedule();}});
 front.addEventListener('click',e=>{e.preventDefault();document.dispatchEvent(new CustomEvent('sunny:open-collection',{detail:{index:projects.findIndex(p=>p.id==='scenes'),trigger:front}}));});
 window.addEventListener('sunny:motionchange',()=>{settle();schedule();});media.addEventListener('change',()=>{settle();schedule();});document.addEventListener('visibilitychange',schedule);document.addEventListener('sunny:dialogchange',schedule);
 if('IntersectionObserver'in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;schedule();},{threshold:.05}).observe(hero);
 // Reuse each collection's actual next artworks as a hover preview, keeping the existing grid.
 document.querySelectorAll('.work-open').forEach((button,i)=>{const items=projects[i].groups.flatMap(g=>g.images);const coverIndex=items.findIndex(item=>item.sourceOrder===projects[i].cover);const fan=create('div','work-preview-fan');fan.setAttribute('aria-hidden','true');[1,2].forEach(offset=>{const item=items[wrapScene(coverIndex+offset,items.length)];const preview=create('img');preview.src=item.thumb;preview.alt='';preview.loading='lazy';preview.decoding='async';preview.width=640;preview.height=480;fan.append(preview);});button.prepend(fan);button.append(create('span','work-explore','探索这个小世界 ↗'));});
 // Reveal the original headline in two masked lines; preserve its wording and underline.
 const headline=document.querySelector('h1');const children=Array.from(headline.childNodes);headline.replaceChildren();let line=create('span','title-line'),inner=create('span','title-line-inner');line.append(inner);headline.append(line);let lineIndex=0;for(const child of children){if(child.nodeName==='BR'){line=create('span','title-line');inner=create('span','title-line-inner');inner.style.setProperty('--line-delay',`${++lineIndex*140}ms`);line.append(inner);headline.append(line);}else inner.append(child);}
 const headings=Array.from(document.querySelectorAll('h1,h2'));headings.forEach(heading=>{const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT);const texts=[];while(walker.nextNode()){const text=walker.currentNode;if(text.textContent.trim()&&!text.parentElement.closest('svg,i'))texts.push(text);}texts.forEach(text=>{const fragment=document.createDocumentFragment();Array.from(text.textContent).forEach(char=>{if(char.trim()){const letter=create('span','title-letter',char);letter.setAttribute('aria-hidden','true');fragment.append(letter);}else fragment.append(document.createTextNode(char));});text.replaceWith(fragment);});heading.setAttribute('aria-label',heading.textContent);});
 const cursor=create('div','project-cursor');cursor.setAttribute('aria-hidden','true');const cursorText=create('span','','查看 ↗');const cursorStar=create('img');cursorStar.src='assets/motion/music-star.svg';cursorStar.alt='';cursorStar.dataset.loop='';cursor.append(cursorStar,cursorText);document.body.append(cursor);
 let raf=0,pointer={x:0,y:0},cursorAt={x:0,y:0},cursorShown=false,magnet=null,letters=null,lastScroll=window.scrollY,lastTime=performance.now(),velocity=0;
 const targetScene={x:0,y:0},sceneAt={x:0,y:0};let sceneScrub=0;
 function frame(now){
  raf=0;const staticMode=still(),dt=Math.max(16,Math.min(64,now-lastTime));lastTime=now;const delta=window.scrollY-lastScroll;lastScroll=window.scrollY;velocity+=(clamp(delta/dt,-1,1)-velocity)*.18;
  const heroHeight=Math.max(1,document.querySelector('.hero').offsetHeight);const targetScrub=staticMode?0:clamp(window.scrollY/heroHeight,0,1);sceneScrub+=(targetScrub-sceneScrub)*.12;document.documentElement.style.setProperty('--hero-scrub',sceneScrub.toFixed(4));
  document.documentElement.style.setProperty('--scroll-lean',`${staticMode?0:clamp(velocity*2.6,-1.6,1.6)}deg`);
  sceneAt.x+=(targetScene.x-sceneAt.x)*.09;sceneAt.y+=(targetScene.y-sceneAt.y)*.09;hero.style.setProperty('--scene-x',`${staticMode?0:sceneAt.x.toFixed(2)}px`);hero.style.setProperty('--scene-y',`${staticMode?0:sceneAt.y.toFixed(2)}px`);
  if(cursorShown&&!staticMode&&fine.matches){cursorAt.x+=(pointer.x-cursorAt.x)*.23;cursorAt.y+=(pointer.y-cursorAt.y)*.23;cursor.style.transform=`translate3d(${cursorAt.x}px,${cursorAt.y}px,0)`;}
  if(magnet){const {element,x,y}=magnet;element.style.setProperty('--magnet-x',`${staticMode?0:x}px`);element.style.setProperty('--magnet-y',`${staticMode?0:y}px`);magnet=null;}
  if(letters&&!staticMode){letters.element.querySelectorAll('.title-letter').forEach(letter=>{const rect=letter.getBoundingClientRect();const distance=Math.abs(pointer.x-(rect.left+rect.width/2));const lift=Math.max(0,1-distance/110)*-9;letter.style.setProperty('--letter-y',`${lift.toFixed(1)}px`);});}
  const moving=Math.abs(velocity)>.003||Math.abs(sceneScrub-targetScrub)>.001||Math.abs(sceneAt.x-targetScene.x)>.08||Math.abs(sceneAt.y-targetScene.y)>.08||(cursorShown&&(Math.abs(cursorAt.x-pointer.x)>.2||Math.abs(cursorAt.y-pointer.y)>.2));if(moving&&!document.hidden&&!staticMode)requestFrame();
 }
 function requestFrame(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
 document.addEventListener('pointermove',event=>{
  if(event.pointerType==='touch'||!fine.matches||still())return;pointer.x=event.clientX;pointer.y=event.clientY;
  const card=event.target.closest('.work-open,.hero-work-front'),modal=document.querySelector('dialog[open]');const showCursor=Boolean(card&&!modal);if(showCursor&&!cursorShown){cursorAt={...pointer};}cursorShown=showCursor;cursor.classList.toggle('visible',showCursor);
  const nextMagnet=event.target.closest('.button.primary,.contact-nav');if(activeMagnet&&activeMagnet!==nextMagnet){activeMagnet.style.setProperty('--magnet-x','0px');activeMagnet.style.setProperty('--magnet-y','0px');}activeMagnet=nextMagnet;if(nextMagnet){const rect=nextMagnet.getBoundingClientRect();const offset=magneticOffset(event.clientX-rect.left,event.clientY-rect.top,rect.width,rect.height);magnet={element:nextMagnet,...offset};}
  if(hero.contains(event.target)){const rect=hero.getBoundingClientRect();targetScene.x=clamp(((event.clientX-rect.left)/rect.width-.5)*20,-10,10);targetScene.y=clamp(((event.clientY-rect.top)/rect.height-.5)*16,-8,8);}else{targetScene.x=0;targetScene.y=0;}
  const heading=event.target.closest('h1,h2');if(letters?.element!==heading){letters?.element.querySelectorAll('.title-letter').forEach(letter=>letter.style.setProperty('--letter-y','0px'));letters=heading?{element:heading}:null;}requestFrame();
 },{passive:true});let activeMagnet=null;
 function resetPointer(){cursorShown=false;cursor.classList.remove('visible');targetScene.x=0;targetScene.y=0;activeMagnet?.style.setProperty('--magnet-x','0px');activeMagnet?.style.setProperty('--magnet-y','0px');activeMagnet=null;letters?.element.querySelectorAll('.title-letter').forEach(letter=>letter.style.setProperty('--letter-y','0px'));letters=null;requestFrame();}
 document.documentElement.addEventListener('pointerleave',resetPointer);window.addEventListener('blur',resetPointer);document.addEventListener('sunny:dialogchange',resetPointer);window.addEventListener('sunny:motionchange',resetPointer);media.addEventListener('change',resetPointer);
 window.addEventListener('scroll',requestFrame,{passive:true});window.addEventListener('resize',requestFrame,{passive:true});document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;resetPointer();}else{lastTime=performance.now();lastScroll=window.scrollY;requestFrame();}});
 schedule();requestFrame();return {showScene:show,settle};
}
