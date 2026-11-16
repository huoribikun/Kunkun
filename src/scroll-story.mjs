export const clamp01=value=>Math.max(0,Math.min(1,value));
export const smoothStep=value=>{const t=clamp01(value);return t*t*(3-2*t);};
export const segment=(progress,start,end)=>clamp01((progress-start)/(end-start));
export function storyAt(progress){
 const p=clamp01(progress),intro=smoothStep(segment(p,0,.2));
 return {progress:p,index:p<.4?0:p<.74?1:2,scale:.83+.17*intro,radius:48-28*intro,orchard:smoothStep(segment(p,.28,.5)),farm:smoothStep(segment(p,.62,.84)),star:{x:-.1+.82*p,y:Math.sin(p*Math.PI*2)*45-10,rotation:p*340},guitar:{x:125*(1-smoothStep(segment(p,.05,.42)))-20*p,y:40*(1-intro),rotation:-28+42*p},note:{x:Math.sin(p*Math.PI*2)*30,y:100-210*p,rotation:-25+65*p},trail:1-segment(p,.03,.9)};
}
export function sceneCardPose(index,active,count=3){const layer=((index-active)%count+count)%count;const poses=[{x:0,y:0,angle:-1.3,scale:1},{x:25,y:-10,angle:5.5,scale:.97},{x:-24,y:14,angle:-6,scale:.95}];return {layer,z:count-layer,...poses[layer]};}
const make=(tag,cls,text)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(text)el.textContent=text;return el;};
export function initScrollStory(projects){
 const media=matchMedia('(prefers-reduced-motion: reduce)');const isStatic=()=>media.matches||document.documentElement.classList.contains('motion-disabled');
 const sceneProject=projects.find(p=>p.id==='scenes'),source=sceneProject.groups.flatMap(g=>g.images);
 const scenes=[32,27,31].map(order=>source.find(image=>image.sourceOrder===order));
 const copy=['从一个音符，走进想象。','一颗小小的灵感，慢慢开花结果。','把心里的世界，画成眼前的风景。'];
 const section=make('section','scroll-story');section.id='illustration-story';section.setAttribute('aria-labelledby','story-title');
 const sticky=make('div','story-sticky'),inner=make('div','story-inner');
 const header=make('div','story-header'),heading=make('div');heading.append(make('p','eyebrow','SCROLL TO PLAY / 插画小剧场'));const title=make('h2','','我的插画');title.id='story-title';title.append(make('span','','小世界'));heading.append(title);const skip=make('a','story-skip','直接看作品 ↘');skip.href='#works';header.append(heading,skip);
 const stage=make('div','story-stage'),screen=make('div','story-screen');
 const panels=scenes.map((image,index)=>{const panel=make('div',`story-panel story-panel-${index}`);const img=make('img');img.src=image.src;img.alt=image.alt;img.width=image.width;img.height=image.height;img.loading='lazy';img.decoding='async';panel.append(img);screen.append(panel);return panel;});
 const props=['music-star','guitar','music-note'].map((name,index)=>{const img=make('img',`story-prop story-prop-${index}`);img.src=`assets/motion/${name}.svg`;img.alt='';img.setAttribute('aria-hidden','true');img.draggable=false;stage.append(img);return img;});
 const trail=document.createElementNS('http://www.w3.org/2000/svg','svg');trail.setAttribute('viewBox','0 0 1000 180');trail.setAttribute('class','story-trail');trail.setAttribute('aria-hidden','true');const path=document.createElementNS('http://www.w3.org/2000/svg','path');path.setAttribute('d','M25 135C180 20 270 175 420 80S670 170 790 70S940 40 975 65');path.setAttribute('pathLength','1');trail.append(path);stage.append(trail);stage.prepend(screen);
 const footer=make('div','story-footer'),caption=make('div','story-caption');const currentTitle=make('p','story-current',scenes[0].title),currentCopy=make('p','story-copy',copy[0]);caption.append(currentTitle,currentCopy);caption.setAttribute('aria-live','polite');
 const chapters=make('div','story-chapters');chapters.setAttribute('role','group');chapters.setAttribute('aria-label','选择插画场景');
 const buttons=scenes.map((scene,index)=>{const button=make('button','story-chapter');button.type='button';button.append(make('span','',String(index+1).padStart(2,'0')),make('span','',scene.title));button.setAttribute('aria-label',`滚动到${scene.title}`);button.addEventListener('click',()=>{if(isStatic()){staticIndex=index;paint(index===0?0:index===1?.55:1,true);}else window.scrollTo({top:top+[.12,.55,.93][index]*range,behavior:'smooth'});});chapters.append(button);return button;});
 footer.append(caption,chapters);const hint=make('p','story-hint','继续向下滑动，让灵感一幕幕展开 ↓');inner.append(header,stage,footer,hint);sticky.append(inner);section.append(sticky);document.querySelector('.ticker').after(section);
 document.querySelectorAll('.work-card').forEach(element=>{element.classList.remove('motion-reveal');element.classList.add('scroll-work-card');});
 let top=0,range=1,stageWidth=1000,heroHeight=600,raf=0,staticIndex=0,lastIndex=-1,dirty=true,paintingStatic=false,sceneFocus=null;
 function readLayout(){
  top=section.getBoundingClientRect().top+window.scrollY;range=Math.max(1,section.offsetHeight-sticky.offsetHeight);stageWidth=stage.getBoundingClientRect().width||window.innerWidth;heroHeight=Math.max(1,document.querySelector('.hero').offsetHeight||window.innerHeight);
  dirty=false;
 }
 function paint(progress,staticMode=false){
  const state=storyAt(progress);const scale=staticMode?1:state.scale;
  section.style.setProperty('--story-scale',scale.toFixed(4));section.style.setProperty('--story-radius',`${staticMode?16:state.radius.toFixed(2)}px`);
  const active=state.index;panels.forEach((panel,index)=>{const pose=sceneCardPose(index,active,panels.length);panel.style.clipPath='none';panel.style.zIndex=String(pose.z);panel.style.transform=`translate3d(${pose.x}px,${pose.y}px,0) rotate(${pose.angle}deg) scale(${pose.scale})`;panel.dataset.layer=String(pose.layer);panel.setAttribute('aria-hidden',String(index!==active));});
  const transforms=[`translate3d(${state.star.x*stageWidth}px,${state.star.y}px,0) rotate(${state.star.rotation}deg)`,`translate3d(${state.guitar.x}px,${state.guitar.y}px,0) rotate(${state.guitar.rotation}deg)`,`translate3d(${state.note.x}px,${state.note.y}px,0) rotate(${state.note.rotation}deg)`];
  props.forEach((prop,index)=>{prop.style.transform=transforms[index];prop.style.opacity=staticMode?'0':String(.2+.8*smoothStep(segment(progress,0,.12)));});path.style.strokeDashoffset=String(state.trail);
  buttons.forEach((button,index)=>{button.classList.toggle('active',index===active);button.style.setProperty('--chapter-progress',String(segment(progress,index/3,(index+1)/3)));if(index===active)button.setAttribute('aria-current','step');else button.removeAttribute('aria-current');});
  if(active!==lastIndex){sceneFocus?.cancel();if(typeof panels[active].animate==='function')sceneFocus=panels[active].animate([{opacity:.65},{opacity:1}],{duration:staticMode?400:650,easing:'ease-out'});currentTitle.textContent=scenes[active].title;currentCopy.textContent=copy[active];lastIndex=active;staticIndex=active;}
  hint.textContent=staticMode?'选择场景，看看不同的小世界':'继续向下滑动，让灵感一幕幕展开 ↓';
  section.dataset.scene=String(active);section.dataset.progress=progress.toFixed(4);
 }
 function frame(){
  raf=0;if(dirty)readLayout();const staticMode=isStatic();
  if(staticMode){paint(staticIndex===0?0:staticIndex===1?.55:1,true);document.documentElement.style.setProperty('--hero-departure','0');paintingStatic=true;return;}
  if(paintingStatic){dirty=true;paintingStatic=false;readLayout();}
  const progress=clamp01((window.scrollY-top)/range);paint(progress);
  const departure=clamp01(window.scrollY/(heroHeight*.8));document.documentElement.style.setProperty('--hero-departure',String(departure));

 }
 function requestFrame(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
 function invalidate(){dirty=true;requestFrame();}
 window.addEventListener('scroll',requestFrame,{passive:true});window.addEventListener('resize',invalidate,{passive:true});window.addEventListener('sunny:motionchange',invalidate);media.addEventListener('change',invalidate);document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;}else invalidate();});
 document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',invalidate));
 if('ResizeObserver'in window)new ResizeObserver(invalidate).observe(document.body);document.fonts?.ready.then(invalidate);
 document.documentElement.classList.add('scroll-story-ready');requestFrame();
 return {section,paint,refresh:invalidate,render:frame};
}
