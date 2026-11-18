import './portfolio-data.js';
import {StackGallery} from './stack-gallery.mjs';
import {initPageMotion} from './motion.mjs';
import {initReferenceMotion} from './reference-motion.mjs';
import {initProfile} from './profile.mjs';
import {createDesignNote} from './design-note.mjs';
import {initSignatureAnimations} from './signature.mjs';
import {initEntrances} from './entrances.mjs';
import {initImpactTitles} from './impact-titles.mjs';
 'use strict';
const projects=window.portfolioSections;
const grid=document.querySelector('#work-grid');
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n};
function createArtwork(item,cls){
 const frame=make('div',cls);if(item.src){const img=document.createElement('img');img.src=cls.includes('collection-cover')?item.thumb:item.src;img.alt=item.alt;img.loading='lazy';img.decoding='async';img.srcset=`${item.thumb} ${item.thumbWidth}w, ${item.src} ${item.width}w`;img.sizes=cls.includes('collection-cover')?'(max-width: 760px) 46vw, (max-width: 1050px) 30vw, 370px':'(max-width: 760px) 92vw, 916px';if(item.width)img.width=item.width;if(item.height)img.height=item.height;frame.append(img)}else{frame.classList.add('artwork-pending');frame.append(make('span','',item.title),make('small','','作品原图待接入'))}return frame;
}
projects.forEach((p,index)=>{
 const article=make('article','work-card');article.dataset.category=p.id;const button=make('button','work-open');button.dataset.project=String(index);button.setAttribute('aria-label',`浏览${p.title}，共 ${p.count} 张作品与过程图`);const cover=p.groups.flatMap(g=>g.images).find(i=>i.sourceOrder===p.cover);const visual=createArtwork(cover,'work-image collection-cover');visual.append(make('span','collection-number',String(index+1).padStart(2,'0')),make('span','open-icon','↗'));const info=make('div','work-info');const copy=make('div');copy.append(make('h3','',p.title),make('p','',p.subtitle));info.append(copy,make('span','category-label',`${p.count} 张`));button.append(visual,info);button.addEventListener('click',()=>{renderProject(index);openDialog(projectDialog,button)});article.append(button);grid.append(article);
});
const filters=document.querySelectorAll('.filter');
filters.forEach(button=>button.addEventListener('click',()=>{filters.forEach(b=>{b.classList.toggle('active',b===button);b.setAttribute('aria-pressed',String(b===button))});document.querySelectorAll('.work-card').forEach(card=>{card.hidden=button.dataset.filter!=='all'&&card.dataset.category!==button.dataset.filter});document.querySelector('#filter-status').textContent=button.dataset.filter==='all'?'六个创作板块 · 50 张作品与过程图':`${button.textContent.trim()} · 点击封面浏览完整合集`}));
const projectDialog=document.querySelector('#project-dialog');let projectIndex=0,returnFocus=null,currentDeck=null;
const designNote = createDesignNote(projectDialog);
function renderProject(index){
 currentDeck?.destroy();projectIndex=index;const p=projects[index];document.querySelector('#project-title').textContent=p.title;document.querySelector('#project-type').textContent=`${String(index+1).padStart(2,'0')} / ${p.en}`;document.querySelector('#project-description').textContent=p.description;document.querySelector('#collection-count').textContent=`${p.groups.length} 组系列 · ${p.count} 张作品与过程图`;
 designNote.render(p.designNote);
 const seriesNav=document.querySelector('#series-nav');seriesNav.replaceChildren();let offset=0;
 const seriesButtons=p.groups.map((g,groupIndex)=>{const first=offset;offset+=g.images.length;const button=make('button','series-jump',g.title);button.type='button';button.setAttribute('aria-pressed','false');button.addEventListener('click',()=>currentDeck?.goTo(first));seriesNav.append(button);return button;});
 const images=p.groups.flatMap((group,groupIndex)=>group.images.map(image=>({...image,groupTitle:group.title,groupIndex})));
 currentDeck=new StackGallery(document.querySelector('#collection-gallery'),images,{onChange:(index,item)=>seriesButtons.forEach((button,groupIndex)=>{button.classList.toggle('active',groupIndex===item.groupIndex);button.setAttribute('aria-pressed',String(groupIndex===item.groupIndex));})});
 document.querySelector('.project-dialog-scroll').scrollTop=0;
}
function openDialog(dialog,trigger){returnFocus=trigger;dialog.showModal();document.body.style.overflow='hidden';if(dialog===projectDialog){currentDeck?.activate();designNote.refresh();}document.dispatchEvent(new Event('sunny:dialogchange'))}
function closeDialog(dialog){dialog.close()}
document.querySelector('.next-project').addEventListener('click',()=>renderProject((projectIndex+1)%projects.length));
document.querySelector('#collection-jump').addEventListener('click',event=>{event.preventDefault();document.querySelector('.deck-thumbnails').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'})});
document.querySelectorAll('dialog').forEach(dialog=>{dialog.querySelector('.dialog-close').addEventListener('click',()=>closeDialog(dialog));dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDialog(dialog)}});dialog.addEventListener('close',()=>{if(dialog===projectDialog){currentDeck?.destroy();designNote.stop();}document.body.style.overflow='';returnFocus?.focus();document.dispatchEvent(new Event('sunny:dialogchange'))})});
const contactDialog=document.querySelector('#contact-dialog');document.querySelector('#contact-open').addEventListener('click',event=>openDialog(contactDialog,event.currentTarget));
const form=document.querySelector('#brief-form'),result=document.querySelector('#brief-result'),output=document.querySelector('#brief-output');
form.addEventListener('submit',event=>{event.preventDefault();const idea=document.querySelector('#brief-text');if(!idea.value.trim()){idea.setCustomValidity('请写下一点你的项目想法。');idea.reportValidity();return}idea.setCustomValidity('');output.value=`合作需求清单\n\n项目类型：${document.querySelector('#brief-type').value}\n项目想法：${idea.value.trim()}\n期待时间：${document.querySelector('#brief-time').value.trim()||'待商议'}\n\n期待一起创造一点好心情。`;form.hidden=true;result.hidden=false;document.querySelector('#copy-status').textContent='';document.querySelector('#copy-brief').focus()});
document.querySelector('#brief-text').addEventListener('input',event=>event.target.setCustomValidity(''));
document.querySelector('#edit-brief').addEventListener('click',()=>{result.hidden=true;form.hidden=false;document.querySelector('#brief-text').focus()});
document.querySelector('#copy-brief').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(output.value);document.querySelector('#copy-status').textContent='已复制，可以粘贴到你的聊天或邮件中。'}catch{output.focus();output.select();document.querySelector('#copy-status').textContent='请使用 Ctrl+C 或长按复制所选内容。'}});
document.querySelector('#download-brief').addEventListener('click',()=>{const url=URL.createObjectURL(new Blob([output.value],{type:'text/plain;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='合作需求清单.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)});
if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){document.querySelectorAll('.nav-link').forEach(link=>link.classList.toggle('active',link.getAttribute('href')==='#'+entry.target.id))}})},{rootMargin:'-15% 0px -55% 0px'});['works','profile','contact'].forEach(id=>observer.observe(document.getElementById(id)))}

initPageMotion();

document.addEventListener('sunny:open-collection',event=>{const index=event.detail?.index;if(!Number.isInteger(index)||index<0||index>=projects.length||projectDialog.open)return;renderProject(index);openDialog(projectDialog,event.detail.trigger);});
initReferenceMotion(projects);

initProfile();

initSignatureAnimations();

export const impactTitles=initImpactTitles();
export const pageEntrances=initEntrances({impactTitles});
