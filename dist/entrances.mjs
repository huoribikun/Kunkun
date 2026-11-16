const clamp01=value=>Math.max(0,Math.min(1,value));
export function entranceProgress(top,height,viewportHeight){
 const span=Math.min(Math.max(1,height),viewportHeight*.8);
 return clamp01((viewportHeight-top)/Math.max(1,span));
}
const boxOf=element=>{
 const rect=element.getBoundingClientRect();let top;
 if(typeof element.offsetTop==='number'){top=0;for(let node=element;node;node=node.offsetParent)top+=node.offsetTop||0;}
 else top=rect.top+window.scrollY;
 return {top,height:element.offsetHeight||rect.height||1};
};
export function initEntrances({impactTitles=null}={}){
 const media=matchMedia('(prefers-reduced-motion: reduce)'),records=[],byElement=new Map(),groups=new Map(),abort=new AbortController();let destroyed=false,raf=0,dirty=true;
 const reduced=()=>media.matches;
 function register(element,{delay=0,x=0,y=0,fadeOnly=false,immediate=false}={}){
  if(!element||byElement.has(element))return;
  element.classList.remove('motion-reveal');element.classList.add('section-entry-item');element.dataset.entryState='waiting';element.dataset.entryMode=immediate?'load':'scroll';
  const group=immediate?null:element.closest('.story-sticky,#works,#about,#contact');if(group&&!groups.has(group))groups.set(group,{top:0,height:1});
  const record={element,delay,x,y,fadeOnly,immediate,group,state:'waiting',animation:null,revision:0,focused:false,progress:-1,top:0,height:1,savedOpacity:element.style.opacity,savedTransform:element.style.transform,visual:element.matches('.work-card,.about-art,.story-stage,.hero-work-front,.hero-work-back'),headings:element.matches('[data-impact-title]')?[element]:[...element.querySelectorAll('[data-impact-title]')]};records.push(record);byElement.set(element,record);
 }
 // The first screen is a finite, coordinated left/right entrance on page load.
 const hero=[['.site-header .brand',0,-24,0],['.site-header nav',70,28,0],['.hero-copy>.eyebrow',80,-45,0],['.hero-copy>h1',150,-72,0],['.hero-copy>.intro',260,-55,0],['.hero-copy>.button',360,0,0],['.hero-copy>.hero-note',460,-34,0],['.hero-work-back',140,100,-12],['.hero-work-front',240,85,8],['.hero-art>.art-note',370,48,0],['.hero-art>.art-badge',450,45,12],['.hero-scene-controls',500,25,0],['.hero-bottom',500,0,18]];
 hero.forEach(([selector,delay,x,y])=>register(document.querySelector(selector),{delay,x,y,fadeOnly:x===0&&y===0,immediate:true}));
 document.querySelector('.about-copy')?.classList.remove('motion-reveal');
 register(document.querySelector('.story-header'),{x:-65,y:8});register(document.querySelector('.story-stage'),{x:85,y:18});register(document.querySelector('.story-caption'),{x:-55});register(document.querySelector('.story-chapters'),{x:60});register(document.querySelector('.story-hint'),{y:20});
 register(document.querySelector('#works>.section-heading'),{x:-60,y:8});register(document.querySelector('#works>.filter-row'),{x:60});register(document.querySelector('#works>.works-end'),{y:20});
 document.querySelectorAll('.work-card').forEach((el,index)=>{const columns=window.innerWidth<=760?2:3,col=index%columns;register(el,{x:col===0?-85:col===columns-1?85:0,y:col===1?42:18});});
 register(document.querySelector('.about-art'),{x:-80,y:12});document.querySelectorAll('.about-copy>*').forEach((el,index)=>register(el,{x:index%2?65:50,y:8}));
 document.querySelectorAll('#contact>.eyebrow,#contact>h2,#contact>p:not(.eyebrow),#contact>.button,#contact>small').forEach((el,index)=>register(el,{x:index===3?0:index%2?-55:55,y:index===3?22:8,fadeOnly:index===3}));
 function travelFor(record){const factor=window.innerWidth<=760?2.35:3.1,limit=Math.min(record.visual?350:240,Math.max(150,window.innerWidth*.56)),gentle=reduced()?.8:1;return {x:Math.max(-limit,Math.min(limit,record.x*factor))*gentle,y:Math.max(-105,Math.min(105,record.y*2.1))*gentle};}
 function restore(record){
  for(const [property,value]of [['opacity',record.savedOpacity],['transform',record.savedTransform]]){if(value)record.element.style[property]=value;else record.element.style.removeProperty(property);}
 }
 function baseOf(record){return typeof getComputedStyle==='function'?getComputedStyle(record.element).transform:record.savedTransform||'none';}
 function readLayout(){
  groups.forEach((box,element)=>Object.assign(box,boxOf(element)));
  records.filter(record=>!record.immediate&&!record.element.hidden).forEach(record=>{Object.assign(record,boxOf(record.element));record.relativeTop=record.group?record.top-groups.get(record.group).top:0;});dirty=false;
 }
 function paint(record,progress){
  const p=clamp01(progress);const syncHeadings=()=>{if(p<.035)record.headings.forEach(heading=>impactTitles?.reset(heading));else if(p>=.58)record.headings.forEach(heading=>{impactTitles?.play(heading);});};if(record.progress===p){syncHeadings();return;}record.progress=p;record.element.dataset.entryProgress=p.toFixed(4);record.state=p===1?'shown':p===0?'waiting':'revealing';record.element.dataset.entryState=record.state;
  if(p===1){restore(record);syncHeadings();return;}
  const remaining=Math.pow(1-p,1.3),travel=travelFor(record),angle=record.visual?Math.sign(record.x||1)*5.5*remaining:0,scale=record.visual?1-.18*remaining:1;
  record.element.style.opacity=String(Math.pow(p,1.1));
  if(!record.fadeOnly)record.element.style.transform=`translate3d(${(remaining*travel.x).toFixed(2)}px,${(remaining*travel.y).toFixed(2)}px,0) rotate(${angle.toFixed(2)}deg) scale(${scale.toFixed(4)}) ${record.base==='none'?'':record.base}`.trim();
  syncHeadings();
 }
 function render(){
  raf=0;if(destroyed||document.hidden)return;if(dirty)readLayout();
  const stickyBounds=new Map();groups.forEach((box,element)=>{if(element.classList.contains('story-sticky'))stickyBounds.set(element,element.getBoundingClientRect());});
  records.filter(record=>!record.immediate&&!record.element.hidden).forEach(record=>{
   const group=groups.get(record.group),sticky=stickyBounds.get(record.group);const top=sticky?sticky.top+record.relativeTop:record.top-window.scrollY;const groupTop=sticky?sticky.top:group?group.top-window.scrollY:0;
   const fullyEntered=group&&group.height<=window.innerHeight&&groupTop+group.height<=window.innerHeight;
   const progress=record.focused||fullyEntered?1:entranceProgress(top,record.height,window.innerHeight);paint(record,progress);
  });
 }
 function requestFrame(){if(!raf&&!destroyed&&!document.hidden)raf=requestAnimationFrame(render);}
 function refresh(){dirty=true;requestFrame();}
 async function playHero(record){
  if(destroyed||record.state==='playing'||record.state==='shown')return;
  if(typeof record.element.animate!=='function'){record.state='shown';record.element.dataset.entryState='shown';return;}
  const revision=++record.revision;record.state='playing';record.element.dataset.entryState='playing';
  if(impactTitles&&record.element.matches('[data-impact-title]')){await impactTitles.play(record.element,{delay:Math.min(record.delay,100)});if(!destroyed&&record.revision===revision){record.state='shown';record.element.dataset.entryState='shown';record.element.dataset.entryProgress='1';}return;}
  const travel=travelFor(record),base=record.base==='none'?'':record.base;
  const frames=record.fadeOnly?[{opacity:0},{opacity:1}]:[{offset:0,opacity:0,transform:`translate3d(${travel.x}px,${travel.y}px,0) rotate(${record.visual?Math.sign(record.x)*7:0}deg) scale(${record.visual?.82:1}) ${base}`.trim()},{offset:.68,opacity:1,transform:`translate3d(${-Math.sign(record.x)*10}px,0,0) rotate(${record.visual?-Math.sign(record.x):0}deg) scale(${record.visual?1.035:1}) ${base}`.trim()},{offset:1,opacity:1,transform:record.base}];
  const animation=record.element.animate(frames,{duration:record.visual?900:720,delay:record.delay,easing:'cubic-bezier(.16,.75,.25,1)',fill:'both'});record.animation=animation;
  await animation.finished.catch(()=>{});if(destroyed||revision!==record.revision)return;record.state='shown';record.element.dataset.entryState='shown';record.element.dataset.entryProgress='1';animation.cancel();record.animation=null;
 }
 records.forEach(record=>record.base=baseOf(record));
 document.documentElement.classList.add('entrances-ready');readLayout();render();
 requestAnimationFrame(()=>records.filter(record=>record.immediate).forEach(playHero));
 window.addEventListener('scroll',requestFrame,{passive:true,signal:abort.signal});window.addEventListener('resize',refresh,{passive:true,signal:abort.signal});window.addEventListener('sunny:motionchange',()=>{records.forEach(record=>record.progress=-1);refresh();},{signal:abort.signal});
 media.addEventListener('change',()=>{records.forEach(record=>record.progress=-1);refresh();},{signal:abort.signal});
 document.querySelectorAll('.filter').forEach(button=>button.addEventListener('click',refresh,{signal:abort.signal}));
 document.addEventListener('focusin',event=>{records.forEach(record=>{if(record.element.contains(event.target)){record.focused=true;record.headings.forEach(heading=>impactTitles?.finish(heading));record.revision++;record.animation?.cancel();record.animation=null;if(record.immediate){record.state='shown';record.element.dataset.entryState='shown';}else paint(record,1);}});},{signal:abort.signal});
 document.addEventListener('focusout',event=>{records.forEach(record=>{if(record.focused&&!record.element.contains(event.relatedTarget))record.focused=false;});requestFrame();},{signal:abort.signal});
 document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(raf);raf=0;records.filter(record=>record.immediate&&record.state==='playing').forEach(record=>{record.revision++;record.state='shown';record.element.dataset.entryState='shown';record.animation?.cancel();record.animation=null;});}else refresh();},{signal:abort.signal});
 let resizeObserver=null;if('ResizeObserver'in window){resizeObserver=new ResizeObserver(refresh);resizeObserver.observe(document.body);}document.fonts?.ready.then(refresh);
 return {records,render,refresh,destroy(){destroyed=true;abort.abort();resizeObserver?.disconnect();cancelAnimationFrame(raf);records.forEach(record=>{record.headings.forEach(heading=>impactTitles?.finish(heading));record.revision++;record.animation?.cancel();restore(record);record.element.classList.remove('section-entry-item');delete record.element.dataset.entryState;delete record.element.dataset.entryMode;delete record.element.dataset.entryProgress;});document.documentElement.classList.remove('entrances-ready');}};
}
