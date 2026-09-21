'use strict';
let geometryProposal=null;
const geometryNames={auto:'Otomatis',line:'Garis lurus',circle:'Lingkaran',ellipse:'Elips',box:'Persegi membulat',rectangle:'Persegi',roundedRectangle:'Persegi membulat',smooth:'Kurva halus'};
function geometryKey(){return JSON.stringify([revision,refineState.active,refineState.nodes,refineState.reverse,refineState.contour?.segments,$('geometryTolerance').value,$('geometryKind').value]);}
function geometrySync(){if(geometryProposal&&(geometryProposal.path!==refineState.contour||geometryProposal.key!==geometryKey()))geometryProposal=null;const ready=!!result&&refineState.active&&!!refineState.contour;$('geometryPreview').disabled=!ready;$('geometryApply').disabled=!geometryProposal;$('geometryCancel').disabled=!geometryProposal;}
function geometryDraw(overlay){if(geometryProposal)overlay.append(refineElement('path',{d:refineD(geometryProposal.segments),class:'geometry-proposal'}));}
function geometrySelection(){const path=refineState.contour;if(!path)throw Error('Pilih kontur terlebih dahulu.');const arc=refineArc();return {path,arc,segments:arc?arc.segments:path.segments,open:!!arc||!!path.open};}
function geometryBuild(kind,note=''){
 geometryProposal=null;const selection=geometrySelection(),{path,arc,segments,open}=selection,tol=Number($('geometryTolerance').value);if(!Number.isFinite(tol)||tol<1||tol>12)throw Error('Batas deviasi harus 1–12 px.');
 const points=GeometryFit.flatten(segments),last=refineNodes({segments,open:true}).at(-1);points.push([last.x1,last.y1]);if(points.length>16000)throw Error('Kontur terlalu panjang; pilih sebagian dengan dua node.');let fitted;
 if(kind==='line'){if(!open)throw Error('Pilih dua node untuk meluruskan sebagian kontur tertutup.');fitted={type:'line',segments:[{type:'L',x1:points[0][0],y1:points[0][1],x2:last.x1,y2:last.y1}]};}
 else if(kind==='smooth'||(kind==='auto'&&open))fitted={type:'smooth',segments:SmartCurve.fitOpen(points,tol*.6)};
 else {if(open)throw Error('Lingkaran, elips, dan persegi memerlukan kontur tertutup utuh. Klik kontur kembali untuk membatalkan seleksi node.');fitted=GeometryFit.detect(segments,tol,kind);}
 if(!fitted)throw Error('Bentuk ini tidak cocok dalam batas deviasi. Pilih bentuk lain atau sebagian kontur.');
 if(!GeometryFit.verify(points,fitted.segments,tol))throw Error('Usulan terlalu jauh dari kontur. Hasil tidak diterapkan.');
 // Keep contour winding so compound fills and holes retain their orientation.
 const area=p=>p.reduce((sum,a,i)=>{const b=p[(i+1)%p.length];return sum+a[0]*b[1]-b[0]*a[1];},0);
 if(!open&&area(points)*area(GeometryFit.flatten(fitted.segments))<0)fitted.segments=fitted.segments.slice().reverse().map(s=>s.type==='C'?{type:'C',x1:s.x4,y1:s.y4,x2:s.x3,y2:s.y3,x3:s.x2,y3:s.y2,x4:s.x1,y4:s.y1}:s.type==='Q'?{type:'Q',x1:s.x3,y1:s.y3,x2:s.x2,y2:s.y2,x3:s.x1,y3:s.y1}:{type:'L',x1:s.x2,y1:s.y2,x2:s.x1,y2:s.y1});
 let replacement=fitted.segments;if(arc){const n=path.segments.length;replacement=path.open?[...path.segments.slice(0,arc.a),...replacement,...path.segments.slice(arc.b)]:[...replacement,...Array.from({length:n-arc.count},(_,i)=>path.segments[(arc.b+i)%n])];}
 geometryProposal={path,segments:replacement,key:geometryKey()};refineRender();$('geometryStatus').textContent=`${note}${geometryNames[fitted.type]||fitted.type}: ${segments.length} → ${fitted.segments.length} segmen. Hijau = usulan; belum diterapkan. Deviasi diperiksa terhadap kontur saat ini (≤ ${tol} px, sampling).`;
}
$('geometryPreview').onclick=()=>{try{geometryBuild($('geometryKind').value);}catch(e){refineRender();$('geometryStatus').textContent=e.message;}};
$('geometryApply').onclick=()=>{geometrySync();if(!geometryProposal)return;const {path,segments}=geometryProposal;if(!refineCommit(path,structuredClone(segments)))return;geometryProposal=null;refineRender();$('geometryStatus').textContent=result.td.graph?'Batas bersama diterapkan ke kedua bidang dan ekspor. Undo tersedia.':'Geometri diterapkan ke hasil dan ekspor. Undo tersedia.';};
$('geometryCancel').onclick=()=>{geometryProposal=null;refineRender();$('geometryStatus').textContent='Pratinjau dibatalkan. Kontur tetap.';};
['geometryTolerance','geometryKind'].forEach(id=>$(id).addEventListener('input',()=>{geometryProposal=null;refineRender();}));

geometrySync();
