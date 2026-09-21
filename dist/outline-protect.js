(function(root){'use strict';
const lum=c=>.2126*c.r+.7152*c.g+.0722*c.b;
function restore(image,indexed){const {width:w,height:h,data:d}=image,pal=indexed.palette,dark=pal.map((c,i)=>({c,i})).filter(o=>o.c.a===255&&lum(o.c)<85);if(!dark.length)return 0;let changed=0;const light=i=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4,L=light(i);if(d[i+3]<200||L>110)continue;let contrast=0;for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2]]){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const j=(yy*w+xx)*4;if(d[j+3]>=200)contrast=Math.max(contrast,light(j)-L);}if(contrast<35)continue;const current=pal[indexed.array[y+1][x+1]];if(current&&lum(current)<=L+12)continue;let best=null,error=Infinity;for(const o of dark){const e=(d[i]-o.c.r)**2+(d[i+1]-o.c.g)**2+(d[i+2]-o.c.b)**2;if(e<error){error=e;best=o.i;}}if(best!==null&&Math.sqrt(error)<100){indexed.array[y+1][x+1]=best;changed++;}}return changed;}
const firstPass=restore;
restore=function(image,indexed){let changed=firstPass(image,indexed);const {width:w,height:h,data:d}=image,pal=indexed.palette,light=i=>.2126*d[i]+.7152*d[i+1]+.0722*d[i+2],neutral=pal.map((c,id)=>({c,id})).filter(o=>o.c.a===255&&lum(o.c)<65&&Math.max(o.c.r,o.c.g,o.c.b)-Math.min(o.c.r,o.c.g,o.c.b)<30).sort((a,b)=>lum(a.c)-lum(b.c));if(!neutral.length)return changed;const black=neutral[0].id,mask=new Uint8Array(w*h);
// Restore antialiased dark ridges between two lighter surfaces, not arbitrary boundaries.
for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=(y*w+x)*4,L=light(i);if(d[i+3]<200||L>120||Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])>70)continue;for(const [dx,dy] of [[2,0],[0,2],[2,2],[2,-2]]){const a=((y+dy)*w+x+dx)*4,b=((y-dy)*w+x-dx)*4;if(d[a+3]>200&&d[b+3]>200&&Math.min(light(a),light(b))-L>16){mask[y*w+x]=1;break;}}}
for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){const i=y*w+x;if(mask[i]&&indexed.array[y+1][x+1]!==black){indexed.array[y+1][x+1]=black;changed++;}}
// Single-pixel gaps only: source must also contain dark ink and both tips must agree.
const repairs=[];for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const i=(y*w+x)*4;if(d[i+3]<200||light(i)>115||indexed.array[y+1][x+1]===black)continue;for(const [dx,dy] of [[1,0],[0,1],[1,1],[1,-1]])if(indexed.array[y+1+dy][x+1+dx]===black&&indexed.array[y+1-dy][x+1-dx]===black){repairs.push([x,y]);break;}}
for(const [x,y] of repairs){indexed.array[y+1][x+1]=black;changed++;}return changed;};
function buildMask(image){const {width:w,height:h,data:d}=image,mask=new Uint8Array(w*h),weak=new Uint8Array(w*h),queue=new Int32Array(w*h);let tail=0;for(let p=0;p<w*h;p++){const i=p*4,L=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2],chroma=Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2]);if(d[i+3]<200)continue;if(L<65&&chroma<18){mask[p]=1;queue[tail++]=p;}else if(L<100&&chroma<28)weak[p]=1;}const strongCount=tail;for(let head=0;head<strongCount;head++){const p=queue[head],x=p%w,y=Math.floor(p/w);for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;const q=yy*w+xx;if(weak[q]&&!mask[q]){mask[q]=1;queue[tail++]=q;}}}return mask;}
function applyMask(image,indexed,mask){const candidates=indexed.palette.map((c,id)=>({c,id})).filter(o=>o.c.a===255&&lum(o.c)<65&&Math.max(o.c.r,o.c.g,o.c.b)-Math.min(o.c.r,o.c.g,o.c.b)<30).sort((a,b)=>lum(a.c)-lum(b.c));if(!candidates.length)return 0;let changed=0;const id=candidates[0].id;for(let p=0;p<mask.length;p++)if(mask[p]){const y=Math.floor(p/image.width)+1,x=p%image.width+1;if(indexed.array[y][x]!==id){indexed.array[y][x]=id;changed++;}}const base=indexed.palette[id],aliases=new Set(indexed.palette.map((c,k)=>({c,k})).filter(({c})=>c.a===255&&lum(c)<85&&Math.hypot(c.r-base.r,c.g-base.g,c.b-base.b)<32).map(o=>o.k));for(let y=0;y<image.height;y++)for(let x=0;x<image.width;x++){const old=indexed.array[y+1][x+1];if(old!==id&&aliases.has(old)){indexed.array[y+1][x+1]=id;changed++;}}indexed.outlineColor=id;indexed.outlineMask=mask;return changed;}
// Resolve quantized edge contamination from the source, without expanding into
// real colored details. Read a frozen neighborhood so repairs cannot flood.
function reconcile(image,indexed,mask){
 const {width:w,height:h,data:d}=image,id=indexed.outlineColor;
 if(id===undefined)return 0;
 const ink=indexed.palette[id],labels=new Int32Array(w*h);
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)labels[y*w+x]=indexed.array[y+1][x+1];
 let repaired=0;
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const p=y*w+x,i=p*4,c=indexed.palette[labels[p]];
  if(labels[p]===id||!c||c.a!==255||d[i+3]<200)continue;
  if(![-w,w,-1,1,-w-1,-w+1,w-1,w+1].some(k=>labels[p+k]===id))continue;
  const error=Math.hypot(d[i]-c.r,d[i+1]-c.g,d[i+2]-c.b);
  // A source-supported colored pixel is never replaced merely for touching ink.
  if(error<24)continue;
  const inkError=Math.hypot(d[i]-ink.r,d[i+1]-ink.g,d[i+2]-ink.b);
  let supported=inkError+18<error&&inkError<90;
  for(let dy=-2;dy<=2&&!supported;dy++)for(let dx=-2;dx<=2&&!supported;dx++){
   const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=w||yy>=h)continue;
   const other=indexed.palette[labels[yy*w+xx]];if(!other||other.a!==255||labels[yy*w+xx]===id)continue;
   const v=[other.r-ink.r,other.g-ink.g,other.b-ink.b],q=[d[i]-ink.r,d[i+1]-ink.g,d[i+2]-ink.b],den=v.reduce((s,n)=>s+n*n,0);
   if(den<3600)continue;const t=q.reduce((s,n,k)=>s+n*v[k],0)/den;
   const residual=Math.hypot(...q.map((n,k)=>n-t*v[k]));
   if(t>=0&&t<=.45&&residual<12&&residual+18<error)supported=true;
  }
  if(supported){indexed.array[y+1][x+1]=id;repaired++;}
 }
 // The overlay must use the SAME repaired ink labels as the color graph.
 // Previously it used the earlier threshold mask, missing restored line pixels.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++)mask[y*w+x]=+(indexed.array[y+1][x+1]===id);
 return repaired;
}
// Hysteresis along source-supported thin ridges. A weak tail can extend beyond
// the one-pixel repair ring, but a flat colored gap cannot become a bridge.
function recoverThin(image,indexed,mask){
 const {width:w,height:h,data:d}=image,id=indexed.outlineColor;if(id===undefined)return 0;
 const ink=indexed.palette[id],weak=new Uint8Array(w*h),depth=new Uint8Array(w*h),queue=[];
 const L=p=>.2126*d[p*4]+.7152*d[p*4+1]+.0722*d[p*4+2];
 for(let y=2;y<h-2;y++)for(let x=2;x<w-2;x++){
  const p=y*w+x,i=p*4;if(mask[p]||d[i+3]<200)continue;
  const c=indexed.palette[indexed.array[y+1][x+1]];if(!c||c.a!==255)continue;
  if(Math.hypot(d[i]-c.r,d[i+1]-c.g,d[i+2]-c.b)<18)continue;
  for(const [dx,dy] of [[2,0],[0,2],[2,2],[2,-2]]){
   const a=p+dy*w+dx,b=p-dy*w-dx;
   if(d[a*4+3]<200||d[b*4+3]<200||Math.min(L(a),L(b))-L(p)<6)continue;
   // Darker than both flanks; at least one must explain it as ink coverage.
   // Different fill colors on opposite sides need not share the same hue.
   let evidence=0;
   for(const q of [a,b]){const v=[d[q*4]-ink.r,d[q*4+1]-ink.g,d[q*4+2]-ink.b],z=[d[i]-ink.r,d[i+1]-ink.g,d[i+2]-ink.b],den=v.reduce((s,n)=>s+n*n,0);if(den<2500)continue;const t=z.reduce((s,n,k)=>s+n*v[k],0)/den,residual=Math.hypot(...z.map((n,k)=>n-t*v[k]));if(t>=0&&t<.92&&residual<20)evidence++;}
   if(evidence>=1){weak[p]=1;break;}
  }
 }
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){const p=y*w+x;if(weak[p]&&[-w,w,-1,1,-w-1,-w+1,w-1,w+1].some(k=>mask[p+k])){queue.push(p);depth[p]=1;}}
 let changed=0;
 for(let head=0;head<queue.length;head++){
  const p=queue[head],x=p%w,y=Math.floor(p/w);mask[p]=1;indexed.array[y+1][x+1]=id;changed++;
  if(depth[p]>=64)continue;
  for(const k of [-w,w,-1,1,-w-1,-w+1,w-1,w+1]){const q=p+k;if(weak[q]&&!depth[q]){depth[q]=depth[p]+1;queue.push(q);}}
 }
 return changed;
}
root.OutlineProtect={restore,buildMask,applyMask,reconcile,recoverThin};if(typeof module!=='undefined')module.exports=root.OutlineProtect;
})(globalThis);




