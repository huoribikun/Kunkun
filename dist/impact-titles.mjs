export function brakeFrames(direction=-1,travel=240,gentle=false){
 const d=Math.sign(direction)||-1,compression=gentle?.84:.68,stretch=gentle?1.14:1.32,skew=gentle?5:13;
 return [
  {offset:0,opacity:0,transform:`translate3d(${d*travel}px,0,0) skewX(${-d*skew}deg) scale(1.14,.86)`},
  {offset:.18,opacity:.9,transform:`translate3d(${d*travel*.58}px,0,0) skewX(${-d*skew}deg) scale(1.12,.9)`},
  {offset:.43,opacity:1,transform:`translate3d(${-d*13}px,0,0) skewX(${d*skew}deg) scale(${compression},${stretch})`},
  {offset:.59,opacity:1,transform:`translate3d(${d*6}px,0,0) skewX(${-d*7}deg) scale(1.16,.88)`},
  {offset:.77,opacity:1,transform:`translate3d(${-d*3}px,0,0) skewX(${d*3}deg) scale(.95,1.05)`},
  {offset:1,opacity:1,transform:'translate3d(0,0,0) skewX(0deg) scale(1,1)'}
 ];
}
export function initImpactTitles(){
 const media=matchMedia('(prefers-reduced-motion: reduce)'),records=new Map(),abort=new AbortController();let destroyed=false;
 const selectors=[['.hero-copy h1',-1],['.story-header h2',-1],['#works .section-heading h2',1],['.about-copy h2',-1],['#contact h2',1]];
 selectors.forEach(([selector,direction])=>{
  const heading=document.querySelector(selector);if(!heading)return;const label=heading.getAttribute('aria-label')||heading.textContent;const walker=document.createTreeWalker(heading,NodeFilter.SHOW_TEXT),texts=[];
  while(walker.nextNode()){const text=walker.currentNode;if(text.textContent.trim()&&!text.parentElement.closest('.title-letter,svg,i'))texts.push(text);}
  texts.forEach(text=>{const fragment=document.createDocumentFragment();Array.from(text.textContent).forEach(character=>{if(!character.trim()){fragment.append(document.createTextNode(character));return;}const letter=document.createElement('span');letter.className='title-letter';letter.setAttribute('aria-hidden','true');letter.textContent=character;fragment.append(letter);});text.replaceWith(fragment);});
  const glyphs=[...heading.querySelectorAll('.title-letter')].map(letter=>{const glyph=document.createElement('span');glyph.className='impact-glyph';glyph.append(...Array.from(letter.childNodes));letter.append(glyph);return glyph;});
  heading.classList.add('impact-title');heading.dataset.impactTitle='';heading.dataset.impactState='waiting';heading.setAttribute('aria-label',label);records.set(heading,{heading,glyphs,direction,state:'waiting',revision:0,animations:[]});
 });
 function settle(record,state){record.revision++;record.animations.forEach(a=>a.cancel());record.animations=[];record.state=state;record.heading.dataset.impactState=state;}
 function finish(heading){const record=records.get(heading);if(record)settle(record,'shown');}
 function reset(heading){const record=records.get(heading);if(record&&record.state!=='waiting')settle(record,'waiting');}
 async function play(heading,{delay=0}={}){
  const record=records.get(heading);if(!record||destroyed||record.state==='playing'||record.state==='shown')return false;
  const bounds=heading.getBoundingClientRect();if(bounds.bottom<=0||typeof record.glyphs[0]?.animate!=='function'){finish(heading);return false;}if(document.hidden||bounds.top>=window.innerHeight)return false;
  const revision=++record.revision;record.state='playing';heading.dataset.impactState='playing';const gentle=media.matches,travel=Math.min(250,Math.max(155,window.innerWidth*.3))*(gentle?.72:1),lines=[...heading.querySelectorAll('.title-line')];
  record.animations=record.glyphs.map((glyph,index)=>{
   const line=glyph.closest('.title-line'),lineIndex=lines.indexOf(line);const direction=lineIndex===1?-record.direction:record.direction;
   glyph.style.transformOrigin=direction<0?'100% 72%':'0% 72%';
   return glyph.animate(brakeFrames(direction,travel,gentle),{duration:gentle?680:820,delay:delay+Math.min(index*15,155),easing:'linear',fill:'both'});
  });
  await Promise.all(record.animations.map(animation=>animation.finished.catch(()=>{})));if(destroyed||revision!==record.revision)return false;
  record.state='shown';heading.dataset.impactState='shown';record.animations.forEach(a=>a.cancel());record.animations=[];return true;
 }
 document.addEventListener('visibilitychange',()=>{if(document.hidden)records.forEach(record=>{if(record.state==='playing')settle(record,'shown');});},{signal:abort.signal});
 media.addEventListener('change',()=>records.forEach(record=>{if(record.state==='playing')settle(record,'shown');}),{signal:abort.signal});
 return {records,play,reset,finish,destroy(){destroyed=true;abort.abort();records.forEach(record=>{settle(record,'shown');record.heading.classList.remove('impact-title');delete record.heading.dataset.impactTitle;delete record.heading.dataset.impactState;});}};
}
