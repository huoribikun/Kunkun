export const wrapIndex = (index, length) => length > 0 ? ((index % length) + length) % length : 0;
export const stackIndices = (index, length, depth = 4) => Array.from({length: Math.min(depth, length)}, (_, layer) => wrapIndex(index + layer, length));
const poses = [
  'translate3d(0,0,0) rotate(0deg) scale(1)',
  'translate3d(22px,15px,-30px) rotate(4deg) scale(.97)',
  'translate3d(-23px,31px,-60px) rotate(-5deg) scale(.94)',
  'translate3d(7px,46px,-90px) rotate(7deg) scale(.91)'
];
const node = (tag, className, text) => {const element = document.createElement(tag); if(className) element.className = className; if(text) element.textContent = text; return element;};

export class StackGallery {
  constructor(root, items, options = {}) {
    if(!items.length) throw new Error('A gallery needs at least one artwork.');
    this.root=root; this.items=items; this.options=options; this.index=0; this.destroyed=false; this.animating=false; this.revision=0; this.animations=[];this.preloaded=new Set();
    this.abort=new AbortController(); this.signal=this.abort.signal;
    this.media=matchMedia('(prefers-reduced-motion: reduce)');
    this.autoRequested=!this.media.matches; this.hovered=false; this.focused=false; this.pointer=null;
    this.dialog=root.closest('dialog');
    root.classList.add('stack-gallery');
    this.stage=node('div','deck-stage'); this.stage.setAttribute('aria-label','层叠作品画廊，可左右滑动切换');
    this.stage.setAttribute('aria-roledescription','轮播图');
    this.caption=node('div','deck-caption'); this.caption.setAttribute('role','status'); this.caption.setAttribute('aria-live','off');
    const captionCopy=node('div','deck-caption-copy'); this.groupLabel=node('p','deck-group'); this.title=node('h3','deck-title'); captionCopy.append(this.groupLabel,this.title);
    this.counter=node('span','deck-counter'); this.caption.append(captionCopy,this.counter);
    this.controls=node('div','deck-controls');
    this.prev=node('button','deck-arrow','←');this.prev.type='button';this.prev.setAttribute('aria-label','上一张作品');
    this.next=node('button','deck-arrow','→');this.next.type='button';this.next.setAttribute('aria-label','下一张作品');
    this.play=node('button','deck-play');this.play.type='button';
    this.original=node('a','deck-original','查看原图 ↗');this.original.target='_blank';this.original.rel='noopener';
    this.controls.append(this.prev,this.next,this.play,this.original);
    this.help=node('p','deck-help','左右切换 / 手机横滑 · 鼠标移入图片可暂停');
    const thumbHeading=node('div','deck-thumbs-heading');thumbHeading.append(node('span','','全部作品'),node('span','',`${items.length} 张`));
    this.thumbnails=node('div','deck-thumbnails');this.thumbnails.setAttribute('role','group');this.thumbnails.setAttribute('aria-label','选择作品');
    this.thumbButtons=items.map((item,index)=>{const button=node('button','deck-thumb');button.type='button';button.setAttribute('aria-label',`第 ${index+1} 张：${item.title}`);button.title=item.title;const image=node('img');image.src=item.thumb;image.alt='';image.loading='lazy';image.decoding='async';image.width=80;image.height=80;button.append(image,node('span','',String(index+1).padStart(2,'0')));button.addEventListener('click',()=>this.goTo(index),{signal:this.signal});this.thumbnails.append(button);return button;});
    root.replaceChildren(this.stage,this.caption,this.controls,this.help,thumbHeading,this.thumbnails);
    this.prev.addEventListener('click',()=>this.step(-1),{signal:this.signal});
    this.next.addEventListener('click',()=>this.step(1),{signal:this.signal});
    this.play.addEventListener('click',()=>{this.autoRequested=!this.autoRequested;this.syncPlayback();},{signal:this.signal});
    this.stage.addEventListener('pointerenter',event=>{if(event.pointerType==='mouse'){this.hovered=true;this.schedule();}},{signal:this.signal});
    this.stage.addEventListener('pointerleave',()=>{this.hovered=false;this.schedule();},{signal:this.signal});
    this.stage.addEventListener('focusin',()=>{this.focused=true;this.schedule();},{signal:this.signal});
    this.stage.addEventListener('focusout',event=>{if(!this.stage.contains(event.relatedTarget)){this.focused=false;this.schedule();}},{signal:this.signal});
    this.dialog.addEventListener('keydown',event=>{
      if(/INPUT|TEXTAREA|SELECT/.test(event.target.tagName))return;
      if(event.key==='ArrowRight'||event.key==='ArrowLeft'){event.preventDefault();this.step(event.key==='ArrowRight'?1:-1);}
    },{signal:this.signal});
    this.stage.addEventListener('pointerdown',event=>{if(event.pointerType!=='mouse'&&event.isPrimary){this.pointer={id:event.pointerId,x:event.clientX,y:event.clientY};this.schedule();}},{signal:this.signal});
    window.addEventListener('pointerup',event=>{
      if(!this.pointer||event.pointerId!==this.pointer.id)return;
      const dx=event.clientX-this.pointer.x,dy=event.clientY-this.pointer.y;this.pointer=null;
      if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25){this.suppressClick=true;clearTimeout(this.suppressTimer);this.suppressTimer=setTimeout(()=>{this.suppressClick=false;},400);this.step(dx<0?1:-1);}else this.schedule();
    },{signal:this.signal});
    window.addEventListener('pointercancel',()=>{this.pointer=null;this.schedule();},{signal:this.signal});
    this.stage.addEventListener('click',event=>{if(this.suppressClick){event.preventDefault();event.stopPropagation();this.suppressClick=false;}},{capture:true,signal:this.signal});
    document.addEventListener('visibilitychange',()=>this.schedule(),{signal:this.signal});
    this.media.addEventListener('change',()=>{if(this.media.matches)this.autoRequested=false;this.settle();this.syncPlayback();},{signal:this.signal});
    window.addEventListener('sunny:motionchange',()=>{this.settle();this.syncPlayback();},{signal:this.signal});
    this.render();this.syncPlayback();
  }
  reduced(){return this.media.matches||document.documentElement.classList.contains('motion-disabled');}
  canPlay(){return this.autoRequested&&!this.reduced()&&!this.destroyed&&!this.animating&&!this.hovered&&!this.focused&&!this.pointer&&!document.hidden&&this.dialog.open&&this.items.length>1;}
  schedule(){clearTimeout(this.timer);this.timer=null;if(this.canPlay())this.timer=setTimeout(()=>this.goTo(this.index+1,1,true),6500);}
  syncPlayback(){
    const disabled=this.reduced()||this.items.length<2;
    this.play.disabled=disabled;
    this.play.textContent=disabled?'静态浏览':this.autoRequested?'Ⅱ 暂停循环':'▶ 自动循环';
    this.play.setAttribute('aria-label',disabled?'当前为静态浏览模式':this.autoRequested?'暂停自动循环':'开始自动循环');
    this.play.setAttribute('aria-pressed',String(this.autoRequested&&!disabled));
    this.schedule();
  }
  activate(){this.schedule();}
  card(index,layer){
    const item=this.items[index],card=node('div','deck-card');card.dataset.index=String(index);card.dataset.layer=String(layer);card.style.transform=poses[layer];card.style.zIndex=String(4-layer);
    const link=layer===0?node('a','deck-image-link'):node('div','deck-image-link');
    if(layer===0){link.href=item.original;link.target='_blank';link.rel='noopener';link.setAttribute('aria-label',`查看${item.title}原图`);}else{card.setAttribute('aria-hidden','true');card.inert=true;}
    const img=node('img');img.src=layer===0?item.src:item.thumb;img.alt=layer===0?item.alt:'';img.decoding='async';img.draggable=false;img.width=item.width;img.height=item.height;
    if(layer===0){img.srcset=`${item.thumb} ${item.thumbWidth}w, ${item.src} ${item.width}w`;img.sizes='(max-width: 760px) 84vw, 800px';}
    link.append(img);card.append(link);return card;
  }
  render(){
    this.stage.replaceChildren(...stackIndices(this.index,this.items.length).map((index,layer)=>this.card(index,layer)));
    const item=this.items[this.index];this.title.textContent=item.title;this.groupLabel.textContent=item.groupTitle;this.counter.textContent=`${String(this.index+1).padStart(2,'0')} / ${String(this.items.length).padStart(2,'0')}`;
    this.original.href=item.original;this.original.setAttribute('aria-label',`在新标签页查看${item.title}原图`);
    this.thumbButtons.forEach((button,index)=>{button.classList.toggle('active',index===this.index);if(index===this.index)button.setAttribute('aria-current','true');else button.removeAttribute('aria-current');});
    this.prev.disabled=this.items.length<2;this.next.disabled=this.items.length<2;
    this.options.onChange?.(this.index,item);
    if(typeof Image==='function'&&this.items.length>1){[1,-1,2].forEach(offset=>{const source=this.items[wrapIndex(this.index+offset,this.items.length)].src;if(!this.preloaded.has(source)){this.preloaded.add(source);const image=new Image();image.decoding='async';image.src=source;}});}

  }
  step(direction){return this.goTo(this.index+direction,direction);}
  async goTo(target,direction=1,automatic=false){
    if(this.destroyed||this.animating)return false;
    const nextIndex=wrapIndex(target,this.items.length);if(nextIndex===this.index){this.schedule();return false;}
    clearTimeout(this.timer);this.caption.setAttribute('aria-live',automatic?'off':'polite');
    const oldIndex=this.index,oldLayers=stackIndices(this.index,this.items.length),oldTop=this.stage.firstElementChild;
    const oldPositions=new Map(oldLayers.map((index,layer)=>[index,poses[layer]]));
    const outgoing=direction===1&&oldTop?oldTop.cloneNode(true):null;
    this.index=nextIndex;this.render();
    if(this.reduced()||typeof this.stage.animate!=='function'){this.schedule();return true;}
    this.animating=true;const revision=++this.revision;this.root.classList.add('deck-transitioning');
    const timing={duration:640,easing:'cubic-bezier(.22,1,.36,1)',fill:'both'};
    this.animations=Array.from(this.stage.children).map((card,layer)=>{
      const index=Number(card.dataset.index),end=poses[layer];
      const recycled=direction===1&&index===oldIndex;
      const start=recycled?poses[3]:oldPositions.get(index)||(layer===0?'translate3d(-100px,35px,-70px) rotate(-12deg) scale(.9)':poses[3]);
      return card.animate([{transform:start,opacity:recycled||!oldPositions.has(index)?0:1},{transform:end,opacity:1}],{...timing,delay:recycled?100:0});
    });
    if(outgoing){outgoing.classList.add('deck-exiting');outgoing.style.zIndex='8';outgoing.inert=true;outgoing.setAttribute('aria-hidden','true');this.stage.append(outgoing);this.animations.push(outgoing.animate([{transform:poses[0],opacity:1},{transform:'translate3d(-115%,30px,70px) rotate(-18deg) scale(.88)',opacity:0}],{...timing,duration:540}));}
    await Promise.all(this.animations.map(animation=>animation.finished.catch(()=>{})));
    if(this.destroyed||revision!==this.revision)return false;
    this.animations.forEach(animation=>animation.cancel());this.animations=[];outgoing?.remove();this.animating=false;this.root.classList.remove('deck-transitioning');this.schedule();return true;
  }
  settle(){this.revision++;this.animations.forEach(animation=>animation.cancel());this.animations=[];this.animating=false;this.root.classList.remove('deck-transitioning');if(!this.destroyed)this.render();}
  destroy(){this.destroyed=true;this.revision++;clearTimeout(this.timer);clearTimeout(this.suppressTimer);this.abort.abort();this.animations.forEach(animation=>animation.cancel());this.animations=[];}
}
