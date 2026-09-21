'use strict';
(()=>{
 const details=document.createElement('details');details.className='visual-audit';details.innerHTML='<summary>Lihat area berbeda</summary><p id="qualitySummary"></p><canvas id="qualityMap" aria-label="Peta perbedaan: merah menunjukkan selisih lebih besar"></canvas><small>Merah lebih terang = perbedaan lebih besar. Termasuk perubahan warna yang disengaja. Detail lebih kecil dari resolusi pemeriksaan bisa terlewat.</small>';
 $('fidelity').append(details);
 $('fidelity').querySelector('small').textContent='Pemeriksaan maks. 768 px di atas latar putih. Lebih kecil lebih mirip; bukan skor kelulusan.';
 measureDifference=async function(){
  if(!result||!source)return;const rev=++renderRevision,current=result,originalSource=source;
  try{
   const factor=Math.min(1,768/Math.max(source.width,source.height)),w=Math.max(1,Math.round(source.width*factor)),h=Math.max(1,Math.round(source.height*factor));
   const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;const ctx=canvas.getContext('2d',{willReadFrequently:true});
   const render=image=>{ctx.clearRect(0,0,w,h);ctx.fillStyle='white';ctx.fillRect(0,0,w,h);ctx.drawImage(image,0,0,w,h);return ctx.getImageData(0,0,w,h).data;};
   const original=render(source.image),img=await svgImage(current.svg);
   if(rev!==renderRevision||current!==result||source!==originalSource)return;
   const traced=render(img),map=new Uint8ClampedArray(w*h*4);let error=0,changed=0;
   const edges=data=>{const out=new Uint8Array(w*h);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;let gradient=0;for(let k=0;k<3;k++)gradient=Math.max(gradient,Math.abs(data[i+4+k]-data[i-4+k]),Math.abs(data[i+w*4+k]-data[i-w*4+k]));out[y*w+x]=gradient>40?1:0;}return out;};
   const a=edges(original),b=edges(traced);
   const missed=(from,to)=>{let total=0,missing=0;for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){if(!from[y*w+x])continue;total++;let found=false;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(to[(y+dy)*w+x+dx])found=true;if(!found)missing++;}return total?missing/total*100:0;};
   for(let i=0;i<original.length;i+=4){let e=0;for(let k=0;k<3;k++)e+=Math.abs(original[i+k]-traced[i+k]);error+=e;if(e/3>32)changed++;const strength=Math.min(1,e/3/80);map[i]=Math.round(245*strength+35*(1-strength));map[i+1]=Math.round(35*(1-strength));map[i+2]=Math.round(45*(1-strength));map[i+3]=255;}
   const percent=error/(w*h*3*255)*100,report={width:w,height:h,meanDifference:percent,changedArea:changed/(w*h)*100,missingEdges:missed(a,b),extraEdges:missed(b,a)};current.visualAudit=report;
   $('fidelity').hidden=false;$('diffValue').textContent=percent.toFixed(2)+'%';$('diffMeter').style.width=Math.max(1,100-percent)+'%';
   $('qualitySummary').textContent='Area berbeda nyata: '+report.changedArea.toFixed(1)+'% · Tepi sumber tanpa pasangan: '+report.missingEdges.toFixed(1)+'% · Tepi tambahan: '+report.extraEdges.toFixed(1)+'%. Pemeriksaan '+w+' × '+h+' px; toleransi posisi tepi 1 px.';
   const heat=$('qualityMap');heat.width=w;heat.height=h;heat.getContext('2d').putImageData(new ImageData(map,w,h),0,0);
  }catch(e){if(rev===renderRevision&&current===result)showToast('Pemeriksaan visual gagal: '+e.message);}
 };
})();
