'use strict';
(()=>{
 const histories=new WeakMap(),base=renderPalette;
 let isolated=null,ghost=null;
 const removeGhost=()=>{ghost?.remove();ghost=null;};
 const resetIsolation=()=>{isolated=null;document.querySelectorAll('[data-seam-underlay]').forEach(g=>g.style.display='');document.querySelectorAll('#vectorImage g[id^="color-"]').forEach(g=>g.style.display='');document.querySelectorAll('.color-chip').forEach(c=>c.setAttribute('aria-pressed','false'));};
 const previousView=setView;setView=function(next){resetIsolation();return previousView(next);};
 const previousRender=renderResult;renderResult=function(){removeGhost();resetIsolation();return previousRender();};
 const key=c=>[c.r,c.g,c.b,c.a].join(',');
 renderPalette=function(){removeGhost();resetIsolation();base();if(!result)return;const current=result,td=current.td;
  const ids=[...new Set(PreciseEngine.objects(td).map(o=>o.layer))].sort((a,b)=>a-b),groups=new Map();
  for(const id of ids){const k=key(td.palette[id]);if(!groups.has(k))groups.set(k,[]);groups.get(k).push(id);}
  const rows=[...$('palette').querySelectorAll('.palette-editor')];
  const apply=(members,color)=>{if(result!==current||busy)return;const history=histories.get(current)||[];history.push(structuredClone(td.palette));if(history.length>20)history.shift();histories.set(current,history);for(const id of members)td.palette[id]={...color};current.stats=PreciseEngine.stats(td);renderResult();renderPalette();setView('vector');measureDifference();};
  const hex=c=>'#'+[c.r,c.g,c.b].map(v=>Math.round(v).toString(16).padStart(2,'0')).join('');
  let picked=null,drag=null,ignoreClick=false;
  const clear=()=>{document.querySelectorAll('.color-chip').forEach(el=>el.classList.remove('merge-target','merge-source'));};
  ids.forEach((id,index)=>{const row=rows[index],members=groups.get(key(td.palette[id]));if(!row)return;if(id!==members[0]){row.remove();return;}
   row.classList.add('compact-color');row.dataset.colorId=id;
   const inputs=[...row.querySelectorAll('input')];for(const input of inputs){input.hidden=true;input.addEventListener('input',()=>{if(result!==current)return;for(const member of members)td.palette[member]={...td.palette[id]};chip.style.background=hex(td.palette[id]);chip.title=hex(td.palette[id])+' · Klik untuk melihat objek warna ini, geser untuk gabung';current.stats=PreciseEngine.stats(td);renderResult();});}
   const chip=document.createElement('button');chip.className='color-chip';chip.style.background=hex(td.palette[id]);chip.dataset.colorId=id;chip.title=hex(td.palette[id])+' · Klik untuk melihat objek warna ini, geser untuk gabung';chip.setAttribute('aria-label','Warna '+hex(td.palette[id])+'. Spasi untuk memilih, Enter pada warna tujuan untuk gabung.');
   chip.onclick=()=>{if(ignoreClick){ignoreClick=false;return;}if(result!==current)return;const same=isolated===id;setView('vector');if(same)return;isolated=id;document.querySelectorAll('[data-seam-underlay]').forEach(g=>g.style.display='none');document.querySelectorAll('#vectorImage g[id^="color-"]').forEach(g=>{g.style.display=members.includes(Number(g.id.slice(6)))?'':'none';});chip.setAttribute('aria-pressed','true');$('canvasBadge').textContent='WARNA '+hex(td.palette[id])+' · klik lagi untuk semua';};
   chip.onkeydown=e=>{if(e.code==='Space'){e.preventDefault();clear();picked=id;chip.classList.add('merge-source');}if(e.key==='Escape'){picked=null;clear();}if(e.key==='Enter'&&picked!==null){e.preventDefault();if(picked!==id)apply(groups.get(key(td.palette[picked])),td.palette[id]);picked=null;clear();}};
   chip.onpointerdown=e=>{if(e.button!==0||busy)return;ignoreClick=false;drag={id,x:e.clientX,y:e.clientY,moved:false,pointer:e.pointerId};chip.setPointerCapture(e.pointerId);};
   chip.onpointermove=e=>{if(!drag||drag.pointer!==e.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)>7)drag.moved=true;if(!drag.moved)return;e.preventDefault();if(!ghost){ghost=document.createElement('div');ghost.className='color-drag-ghost';ghost.style.background=hex(td.palette[id]);document.body.append(ghost);}ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';clear();chip.classList.add('merge-source');const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.color-chip');if(target&&Number(target.dataset.colorId)!==id)target.classList.add('merge-target');};
   chip.onpointerup=e=>{if(!drag)return;const moved=drag.moved;drag=null;removeGhost();clear();if(chip.hasPointerCapture(e.pointerId))chip.releasePointerCapture(e.pointerId);if(moved){ignoreClick=true;const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('.color-chip');if(target&&Number(target.dataset.colorId)!==id)apply(members,td.palette[Number(target.dataset.colorId)]);}};
   chip.onpointercancel=()=>{drag=null;removeGhost();clear();};chip.onlostpointercapture=()=>{drag=null;removeGhost();clear();};
   const remove=document.createElement('button');remove.className='palette-remove';remove.textContent='×';remove.title='Hapus '+hex(td.palette[id])+' menjadi transparan';remove.setAttribute('aria-label',remove.title);remove.onclick=()=>apply(members,{...td.palette[id],a:0});row.prepend(chip,remove);
  });
  const undo=document.createElement('button');undo.className='button secondary compact';undo.id='paletteUndo';undo.textContent='Undo warna';undo.disabled=!(histories.get(current)?.length);undo.onclick=()=>{if(result!==current||busy)return;td.palette=histories.get(current).pop();current.stats=PreciseEngine.stats(td);renderResult();renderPalette();measureDifference();};$('palette').append(undo);
  $('paletteNote').textContent='Geser warna ke warna tujuan untuk gabung. Klik untuk melihat objek warna itu · klik lagi untuk semua · × untuk hapus. Tracing ulang mengganti edit.';
 };
})();


