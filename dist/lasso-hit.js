(function(root){
 const inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>p[1])!==(b[1]>p[1])&&p[0]<(b[0]-a[0])*(p[1]-a[1])/(b[1]-a[1])+a[0])yes=!yes;}return yes;};
 const cross=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);
 function intersects(a,b,c,d){if(Math.max(a[0],b[0])+1e-8<Math.min(c[0],d[0])||Math.max(c[0],d[0])+1e-8<Math.min(a[0],b[0])||Math.max(a[1],b[1])+1e-8<Math.min(c[1],d[1])||Math.max(c[1],d[1])+1e-8<Math.min(a[1],b[1]))return false;return cross(a,b,c)*cross(a,b,d)<=1e-8&&cross(c,d,a)*cross(c,d,b)<=1e-8;}
 function touches(loops,lasso){if(lasso.length<2)return false;for(const loop of loops){for(let i=0;i<loop.length;i++){const a=loop[i],b=loop[(i+1)%loop.length];if(lasso.length>=3&&inside(a,lasso))return true;for(let j=0;j<lasso.length;j++)if(intersects(a,b,lasso[j],lasso[(j+1)%lasso.length]))return true;}}return lasso.some(p=>loops.reduce((hit,loop)=>hit!==inside(p,loop),false));}
 root.LassoHit={touches};if(typeof module!=='undefined')module.exports=root.LassoHit;
})(globalThis);
