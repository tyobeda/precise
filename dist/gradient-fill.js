'use strict';
(()=>{
 const panel=document.createElement('div');panel.className='field';panel.innerHTML='<button id="detectGradient" class="button secondary compact">Deteksi gradient SVG</button><button id="clearGradient" class="text-button">Hapus gradient</button><p id="gradientStatus" class="hint">Gradient linear per bidang. SVG saja; EPS tetap memakai warna solid. Belum menggabungkan bidang yang terpecah.</p>';
 $('palette').closest('.palette-section').append(panel);
 const originalSVG=PreciseEngine.toSVG;
 PreciseEngine.toSVG=function(td,width){let svg=originalSVG(td,width);if(!td.linearGradients?.length)return svg;const doc=new DOMParser().parseFromString(svg,'image/svg+xml'),ns='http://www.w3.org/2000/svg',defs=doc.createElementNS(ns,'defs'),paths=[...doc.querySelectorAll('g[id^=color-] > path')],objects=PreciseEngine.objects(td);td.linearGradients.forEach((g,i)=>{const index=objects.findIndex(o=>!o.outlineOverlay&&o.paths[0].graphFace===g.face&&JSON.stringify(o.color)===g.color);if(index<0)return;const gradient=doc.createElementNS(ns,'linearGradient');gradient.id='gradient-'+i;gradient.setAttribute('gradientUnits','userSpaceOnUse');for(const k of ['x1','y1','x2','y2'])gradient.setAttribute(k,g[k]);g.stops.forEach((color,j)=>{const stop=doc.createElementNS(ns,'stop');stop.setAttribute('offset',j?'100%':'0%');stop.setAttribute('stop-color','rgb('+color.join(',')+')');gradient.append(stop);});defs.append(gradient);paths[index].setAttribute('fill','url(#'+gradient.id+')');});doc.documentElement.prepend(defs);return new XMLSerializer().serializeToString(doc);};
 $('clearGradient').onclick=()=>{if(!result)return;delete result.td.linearGradients;renderResult();measureDifference();$('gradientStatus').textContent='Gradient dihapus. Semua bidang memakai warna solid.';};
 $('detectGradient').onclick=async()=>{
  if(!result?.td.graph||!source||busy){showToast('Proses ilustrasi terlebih dahulu.');return;}
  const current=result,src=source;$('detectGradient').disabled=true;$('gradientStatus').textContent='Menganalisis transisi warna…';
  try{
   const td=current.td,scale=Math.min(1,768/Math.max(td.width,td.height)),w=Math.ceil(td.width*scale),h=Math.ceil(td.height*scale),canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(src.image,0,0,w,h);const pixels=ctx.getImageData(0,0,w,h).data;
   const doc=new DOMParser().parseFromString(originalSVG(td,td.width),'image/svg+xml'),paths=[...doc.querySelectorAll('g[id^=color-] > path')],objects=PreciseEngine.objects(td),gradients=[];
   // Fit both axes independently, requiring substantial improvement over a solid fill.
   for(let n=0;n<paths.length;n++){
    if(n%16===0){await new Promise(r=>setTimeout(r,0));if(result!==current||source!==src)return;}
    const object=objects[n];if(object.outlineOverlay||object.paths[0].graphFace===undefined)continue;
    const points=GeometryFit.flatten(object.paths[0].segments);let x0=w,y0=h,x1=0,y1=0;for(const p of points){x0=Math.min(x0,Math.floor(p[0]*scale));y0=Math.min(y0,Math.floor(p[1]*scale));x1=Math.max(x1,Math.ceil(p[0]*scale));y1=Math.max(y1,Math.ceil(p[1]*scale));}x0=Math.max(0,x0);y0=Math.max(0,y0);x1=Math.min(w,x1);y1=Math.min(h,y1);if((x1-x0)*(y1-y0)<144)continue;
    const path=new Path2D(paths[n].getAttribute('d')),samples=[],step=Math.max(1,Math.ceil(Math.sqrt((x1-x0)*(y1-y0)/1500)));
    for(let y=y0+1;y<y1-1;y+=step)for(let x=x0+1;x<x1-1;x+=step){const X=(x+.5)/scale,Y=(y+.5)/scale;if(!ctx.isPointInPath(path,X,Y,'evenodd')||!ctx.isPointInPath(path,X-1/scale,Y,'evenodd')||!ctx.isPointInPath(path,X+1/scale,Y,'evenodd')||!ctx.isPointInPath(path,X,Y-1/scale,'evenodd')||!ctx.isPointInPath(path,X,Y+1/scale,'evenodd'))continue;const i=(y*w+x)*4;if(pixels[i+3]<250)continue;samples.push([X,Y,pixels[i],pixels[i+1],pixels[i+2]]);}
    if(samples.length<30)continue;let best=null;
    for(let axis=0;axis<2;axis++){const mean=samples.reduce((a,p)=>a.map((v,k)=>v+p[k]/samples.length),[0,0,0,0,0]),variance=samples.reduce((a,p)=>a+(p[axis]-mean[axis])**2,0);if(variance<1)continue;const slope=[2,3,4].map(k=>samples.reduce((a,p)=>a+(p[axis]-mean[axis])*(p[k]-mean[k]),0)/variance);let error=0,flat=0;for(const p of samples)for(let k=0;k<3;k++){error+=(p[k+2]-mean[k+2]-slope[k]*(p[axis]-mean[axis]))**2;flat+=(p[k+2]-mean[k+2])**2;}const lo=(axis?y0:x0)/scale,hi=(axis?y1:x1)/scale,change=Math.hypot(...slope)*(hi-lo),rmse=Math.sqrt(error/(samples.length*3));if(change<18||rmse>8||error>flat*.25)continue;const stops=[lo,hi].map(t=>slope.map((v,k)=>Math.round(Math.max(0,Math.min(255,mean[k+2]+v*(t-mean[axis]))))));if(!best||rmse<best.error)best={error:rmse,face:object.paths[0].graphFace,color:JSON.stringify(object.color),x1:axis?0:lo,y1:axis?lo:0,x2:axis?0:hi,y2:axis?hi:0,stops};}
    if(best)gradients.push(best);
   }
   if(result!==current||source!==src)return;td.linearGradients=gradients;renderResult();setView('vector');await measureDifference();$('gradientStatus').textContent=gradients.length+' bidang memakai gradient linear. SVG mempertahankan gradient; EPS tetap solid.';
  }catch(e){showToast('Deteksi gradient gagal: '+e.message);}finally{$('detectGradient').disabled=false;}
 };
})();

