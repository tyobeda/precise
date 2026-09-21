/* Detect flat-region colors before quantization; edge blends are not palette seeds. */
(function(root){'use strict';
function detect(image){const {width:w,height:h,data:d}=image,bins=new Map();let opaque=0,flat=0,transparent=false;const tileSize=32,columns=Math.ceil(w/tileSize),tileTotals=new Uint32Array(columns*Math.ceil(h/tileSize));const distance=(a,b)=>(a.r-b.r)**2+(a.g-b.g)**2+(a.b-b.b)**2;
for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(d[i+3]===0){transparent=true;continue;}opaque++;let stable=true;for(const [dx,dy] of [[-2,0],[2,0],[0,-2],[0,2]]){const xx=x+dx,yy=y+dy;if(xx<0||xx>=w||yy<0||yy>=h)continue;const j=(yy*w+xx)*4;if(d[j+3]===0||Math.max(Math.abs(d[i]-d[j]),Math.abs(d[i+1]-d[j+1]),Math.abs(d[i+2]-d[j+2]))>12){stable=false;break;}}if(!stable)continue;flat++;const tile=Math.floor(y/tileSize)*columns+Math.floor(x/tileSize);tileTotals[tile]++;const key=(d[i]>>3)*1024+(d[i+1]>>3)*32+(d[i+2]>>3);let c=bins.get(key);if(!c){c={r:0,g:0,b:0,w:0,tiles:new Map()};bins.set(key,c);}c.r+=d[i];c.g+=d[i+1];c.b+=d[i+2];c.w++;c.tiles.set(tile,(c.tiles.get(tile)||0)+1);}
// Recognize neutral black/white ink only when intermediate tones have no broad interior.
let neutral=0,dark=0,light=0,grayInterior=0;for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=(y*w+x)*4;if(!d[i+3])continue;const v=(d[i]+d[i+1]+d[i+2])/3;if(Math.max(d[i],d[i+1],d[i+2])-Math.min(d[i],d[i+1],d[i+2])<10)neutral++;if(v<40)dark++;if(v>230)light++;if(v<=40||v>=225||x<4||y<4||x>=w-4||y>=h-4)continue;let interior=true;for(const [dx,dy] of [[-4,0],[4,0],[0,-4],[0,4],[-3,-3],[3,3],[-3,3],[3,-3]]){const j=((y+dy)*w+x+dx)*4;if(!d[j+3]||Math.abs((d[j]+d[j+1]+d[j+2])/3-v)>12){interior=false;break;}}if(interior)grayInterior++;}
if(opaque&&neutral/opaque>.995&&dark/opaque>.005&&light/opaque>.2&&grayInterior/opaque<.0005){const palette=[{r:0,g:0,b:0,a:255},{r:255,g:255,b:255,a:255}];if(transparent)palette.push({r:0,g:0,b:0,a:0});return {palette,kind:'ink',flatRatio:flat/opaque};}
if(!opaque)throw Error('PNG sepenuhnya transparan. Pilih gambar yang memiliki artwork.');
if(flat<Math.max(8,opaque*.15))return {palette:root.PreciseEngine.paletteFor(d,16),kind:'complex',flatRatio:flat/opaque};
const seeds=[...bins.values()].map(c=>({r:c.r/c.w,g:c.g/c.w,b:c.b/c.w,w:c.w,tiles:c.tiles})).sort((a,b)=>b.w-a.w),groups=[];
for(const c of seeds){let best=null,error=24*24;for(const g of groups){const e=distance(c,g.seed);if(e<error){error=e;best=g;}}if(best){best.r+=c.r*c.w;best.g+=c.g*c.w;best.b+=c.b*c.w;best.w+=c.w;for(const [tile,count] of c.tiles)best.tiles.set(tile,(best.tiles.get(tile)||0)+count);}else {groups.push({seed:c,r:c.r*c.w,g:c.g*c.w,b:c.b*c.w,w:c.w,tiles:new Map(c.tiles)});if(groups.length>128)return {palette:root.PreciseEngine.paletteFor(d,16),kind:'complex',flatRatio:flat/opaque};}}
const minimum=Math.min(64,Math.max(4,flat*.00005));for(const c of groups)c.localSupport=Math.max(0,...[...c.tiles].map(([tile,count])=>count>=4?count/Math.max(1,tileTotals[tile]):0));const significant=groups.filter(c=>c.w>=minimum||c.localSupport>=.015).sort((a,b)=>(b.localSupport+Math.sqrt(b.w/flat))-(a.localSupport+Math.sqrt(a.w/flat))).slice(0,64);
if(!significant.length)return {palette:root.PreciseEngine.paletteFor(d,16),kind:'complex',flatRatio:flat/opaque};
const consolidated=[];for(const c of significant){const color={r:c.r/c.w,g:c.g/c.w,b:c.b/c.w};const near=consolidated.find(g=>distance(color,{r:g.r/g.w,g:g.g/g.w,b:g.b/g.w})<24*24);if(near){near.r+=c.r;near.g+=c.g;near.b+=c.b;near.w+=c.w;}else consolidated.push({...c});}const palette=consolidated.map(c=>({r:Math.round(c.r/c.w),g:Math.round(c.g/c.w),b:Math.round(c.b/c.w),a:255}));if(transparent)palette.push({r:0,g:0,b:0,a:0});return {palette,kind:'flat',flatRatio:flat/opaque,localColors:significant.filter(c=>c.w<minimum).length,localAnalysis:true};}
function refineLabels(image,indexed){
 const {width:w,height:h,data:d}=image,pal=indexed.palette,near=new Int16Array(w*h).fill(-1),core=new Int16Array(w*h).fill(-1);
 const error=(i,c)=>(d[i]-c.r)**2+(d[i+1]-c.g)**2+(d[i+2]-c.b)**2;
 for(let j=0;j<w*h;j++){const i=j*4;if(d[i+3]!==255)continue;let best=144;for(let k=0;k<pal.length;k++){const c=pal[k];if(c.a!==255)continue;const e=error(i,c);if(e<best){best=e;near[j]=k;}}}
 // A palette match alone is not evidence of an interior: require local support.
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const id=near[y*w+x];if(id<0)continue;let support=0;for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const xx=x+dx,yy=y+dy;if(xx>=0&&xx<w&&yy>=0&&yy<h&&near[yy*w+xx]===id)support++;}if(support>=3)core[y*w+x]=id;}
 let changed=0;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=(y*w+x)*4;if(d[i+3]!==255||core[y*w+x]>=0)continue;
  // Preserve exact small colored details even when they have no broad interior.
  if(near[y*w+x]>=0&&error(i,pal[near[y*w+x]])<=9)continue;
  const support=new Map();for(let yy=Math.max(0,y-3);yy<=Math.min(h-1,y+3);yy++)for(let xx=Math.max(0,x-3);xx<=Math.min(w-1,x+3);xx++){const id=core[yy*w+xx];if(id<0)continue;let q=support.get(id);if(!q){q={id,n:0,x:0,y:0};support.set(id,q);}q.n++;q.x+=xx-x;q.y+=yy-y;}
  const list=[...support.values()].filter(q=>q.n>=2).sort((a,b)=>b.n-a.n).slice(0,4);let best=null,second=Infinity;
  for(let a=0;a<list.length;a++)for(let b=a+1;b<list.length;b++){
   const A=list[a],B=list[b];if(A.x*B.x+A.y*B.y>=0)continue;
   const ca=pal[A.id],cb=pal[B.id],v=[ca.r-cb.r,ca.g-cb.g,ca.b-cb.b],q=[d[i]-cb.r,d[i+1]-cb.g,d[i+2]-cb.b],den=v.reduce((s,n)=>s+n*n,0);if(den<1600)continue;
   const t=q.reduce((s,n,k)=>s+n*v[k],0)/den;if(t<.05||t>.95)continue;
   const residual=q.reduce((s,n,k)=>s+(n-t*v[k])**2,0),label=t>=.5?A.id:B.id;
   if(!best||residual<best.residual){if(best)second=best.residual;best={residual,label};}else second=Math.min(second,residual);
  }
  // Ambiguous three-color junctions and gradients retain their original labels.
  if(best&&best.residual<144&&second-best.residual>36&&indexed.array[y+1][x+1]!==best.label){indexed.array[y+1][x+1]=best.label;changed++;}
 }
 return changed;
}
root.AutoPalette={detect,refineLabels};if(typeof module!=='undefined')module.exports=root.AutoPalette;
})(typeof self!=='undefined'?self:globalThis);

