'use strict';
(()=>{
 const ns='http://www.w3.org/2000/svg',overlay=document.createElementNS(ns,'svg');overlay.id='lassoOverlay';overlay.hidden=true;overlay.style.display='none';$('artboard').append(overlay);
 const panel=document.createElement('div');panel.className='lasso-panel';panel.hidden=true;panel.innerHTML='<span id="lassoHelp">Geser menyentuh bidang atau lingkari area. Bidang yang tersentuh dipilih seluruhnya.</span><div id="lassoColors"></div><button id="lassoApply" class="button dark compact" disabled>Gabungkan warna</button><button id="lassoClear" class="button secondary compact">Batal pilih</button><button id="lassoUndo" class="button secondary compact" disabled>Undo lasso</button>';
 document.querySelector('.canvas-tools-dock').append(panel);
 const button=document.createElement('button');button.id='lassoBtn';button.className='button secondary compact';button.textContent='Lasso warna';button.setAttribute('aria-pressed','false');document.querySelector('.canvas-toolbar').append(button);
 let owner=null,active=false,points=[],drawing=false,selected=[],target=null;const history=new WeakMap();
 const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const clear=()=>{selected=[];points=[];overlay.replaceChildren();document.querySelectorAll('.lasso-selected').forEach(p=>p.classList.remove('lasso-selected'));$('lassoApply').disabled=true;};
 const stop=()=>{clear();active=false;drawing=false;overlay.hidden=true;overlay.style.display='none';panel.hidden=true;button.setAttribute('aria-pressed','false');};
 function colors(){const el=$('lassoColors');el.replaceChildren();const used=new Set();for(const o of PreciseEngine.objects(result.td)){const id=o.layer,c=o.color,key=[c.r,c.g,c.b].join(',');if(used.has(key))continue;used.add(key);const b=document.createElement('button');b.style.background='rgb('+key+')';b.title='Warna tujuan rgb('+key+')';b.setAttribute('aria-label',b.title);b.setAttribute('aria-pressed',String(target===id));b.onclick=()=>{target=id;colors();$('lassoApply').disabled=!selected.length;};el.append(b);}}
 button.onclick=()=>{if(active){stop();return;}if(!result?.td.graph){showToast('Lasso warna tersedia setelah tracing ilustrasi berwarna.');return;}if(refineState.active)$('refineBtn').click();setView('vector');owner=result;active=true;target=null;clear();overlay.hidden=false;overlay.style.display='block';panel.hidden=false;overlay.setAttribute('viewBox','0 0 '+result.td.width+' '+result.td.height);overlay.setAttribute('preserveAspectRatio','none');button.setAttribute('aria-pressed','true');$('lassoUndo').disabled=!history.get(owner)?.length;colors();};
 const point=e=>{const r=overlay.getBoundingClientRect();return [(e.clientX-r.left)*result.td.width/r.width,(e.clientY-r.top)*result.td.height/r.height];};
 overlay.onpointerdown=e=>{if(!active||result!==owner||e.button!==0)return;e.preventDefault();clear();drawing=true;points=[point(e)];overlay.setPointerCapture(e.pointerId);};
 overlay.onpointermove=e=>{if(!drawing)return;const p=point(e);if(Math.hypot(p[0]-points.at(-1)[0],p[1]-points.at(-1)[1])<1)return;points.push(p);let path=overlay.firstChild;if(!path){path=document.createElementNS(ns,'path');overlay.append(path);}path.setAttribute('d','M'+points.map(p=>p.join(',')).join(' L')+' Z');};
 overlay.onpointerup=e=>{if(!drawing)return;drawing=false;if(overlay.hasPointerCapture(e.pointerId))overlay.releasePointerCapture(e.pointerId);if(points.length<2)return;const objects=PreciseEngine.objects(result.td),paths=[...$('vectorImage').querySelectorAll('g[id^=color-] > path')];paths.forEach((path,i)=>{if(objects[i].outlineOverlay)return;const loops=objects[i].paths.map(p=>GeometryFit.flatten(p.segments));if(LassoHit.touches(loops,points)){selected.push(objects[i].paths[0].graphFace);path.classList.add('lasso-selected');}});selected=[...new Set(selected)];$('lassoHelp').textContent=selected.length+' bidang terpilih seluruhnya. Pilih warna tujuan, lalu Gabungkan warna.';$('lassoApply').disabled=!selected.length||target===null;};
 overlay.onpointercancel=()=>{drawing=false;clear();};$('lassoClear').onclick=clear;
 $('lassoApply').onclick=()=>{if(owner!==result||!selected.length||target===null||busy)return;const h=history.get(owner)||[];h.push(result.td.graph.faces.map(f=>f.color));if(h.length>20)h.shift();history.set(owner,h);for(const id of selected)result.td.graph.faces[id].color=target;VectorGraph.sync(result.td);finish();};
 function finish(){result.stats=PreciseEngine.stats(result.td);renderResult();renderPalette();measureDifference();showToast('Warna bidang diperbarui.');}
 $('lassoUndo').onclick=()=>{if(owner!==result||busy)return;const previous=history.get(owner)?.pop();if(!previous)return;result.td.graph.faces.forEach((f,i)=>f.color=previous[i]);VectorGraph.sync(result.td);finish();};
 const previous=renderResult;renderResult=function(){stop();const value=previous();button.disabled=!result?.td.graph;return value;};
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&active)stop();});
 document.querySelectorAll('[data-view]').forEach(b=>b.addEventListener('click',stop));
})();



