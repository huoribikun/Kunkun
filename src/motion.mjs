export function initPageMotion(){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  try{localStorage.removeItem('sunny-motion-paused');}catch{}
  const progress=document.createElement('div');progress.className='scroll-progress';progress.setAttribute('aria-hidden','true');document.body.prepend(progress);
  let raf=0,progressNow=0;const layers=Array.from(document.querySelectorAll('.hero-art,.about-art')).map((element,index)=>({element,rate:index===0?.055:.035,y:0,top:0,height:0}));
  function refreshPositions(){layers.forEach(layer=>{const rect=layer.element.getBoundingClientRect();layer.top=rect.top+window.scrollY-layer.y;layer.height=rect.height;});requestFrame();}
  function frame(){
    raf=0;const staticMode=reduced.matches;let moving=false;
    const target=Math.max(0,Math.min(1,window.scrollY/Math.max(1,document.documentElement.scrollHeight-window.innerHeight)));
    progressNow=staticMode?target:progressNow+(target-progressNow)*.18;
    if(Math.abs(target-progressNow)>.0003)moving=true;else progressNow=target;
    document.documentElement.style.setProperty('--scroll-progress',String(progressNow));
    layers.forEach(layer=>{const targetY=staticMode?0:Math.max(-30,Math.min(30,(window.innerHeight/2-(layer.top-window.scrollY+layer.height/2))*layer.rate));layer.y=staticMode?0:layer.y+(targetY-layer.y)*.12;if(Math.abs(targetY-layer.y)>.08)moving=true;else layer.y=targetY;layer.element.style.setProperty('--parallax-y',`${layer.y.toFixed(2)}px`);});
    if(moving&&!document.hidden)requestFrame();
  }
  function requestFrame(){if(!raf&&!document.hidden)raf=requestAnimationFrame(frame);}
  function sync(){document.documentElement.classList.toggle('motion-disabled',reduced.matches);window.dispatchEvent(new CustomEvent('sunny:motionchange'));requestFrame();}
  reduced.addEventListener('change',sync);
  window.addEventListener('scroll',requestFrame,{passive:true});window.addEventListener('resize',refreshPositions,{passive:true});
  document.addEventListener('visibilitychange',()=>{document.documentElement.classList.toggle('page-idle',document.hidden);if(document.hidden){cancelAnimationFrame(raf);raf=0;}else requestFrame();});
  const loops=['.hero-work-front','.hero-work-back','.art-badge','.contact h2 i','.section-heading h2 i','.ticker-track'];
  loops.forEach(selector=>document.querySelectorAll(selector).forEach(element=>element.dataset.loop=''));
  const zones=document.querySelectorAll('.site-header,.hero,.ticker,.works,.about,.contact');
  if('IntersectionObserver'in window){
    const zoneObserver=new IntersectionObserver(entries=>entries.forEach(entry=>entry.target.classList.toggle('motion-inview',entry.isIntersecting)),{rootMargin:'80px'});zones.forEach(zone=>{zone.classList.add('motion-zone');zoneObserver.observe(zone);});

  }
  const finePointer=matchMedia('(hover: hover) and (pointer: fine)');
  document.querySelectorAll('.work-open').forEach(button=>{let tiltFrame=0;button.addEventListener('pointermove',event=>{if(!finePointer.matches||reduced.matches)return;cancelAnimationFrame(tiltFrame);tiltFrame=requestAnimationFrame(()=>{const rect=button.getBoundingClientRect();button.style.setProperty('--tilt-x',`${((event.clientX-rect.left)/rect.width-.5)*9}deg`);button.style.setProperty('--tilt-y',`${-((event.clientY-rect.top)/rect.height-.5)*7}deg`);});});button.addEventListener('pointerleave',()=>{cancelAnimationFrame(tiltFrame);button.style.setProperty('--tilt-x','0deg');button.style.setProperty('--tilt-y','0deg');});});
  if('ResizeObserver'in window)new ResizeObserver(refreshPositions).observe(document.body);
  refreshPositions();sync();
}
