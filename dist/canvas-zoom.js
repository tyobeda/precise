'use strict';
(()=>{
const controls=document.querySelector('.zoom-controls');controls.classList.add('canvas-zoom-top');$('stage').append(controls);$('zoomFit').title='Kembalikan ke ukuran pas (100%)';
const area=$('artScroll');area.addEventListener('wheel',e=>{if(!source||busy||e.target.closest('button,input,select'))return;e.preventDefault();const rect=$('artboard').getBoundingClientRect(),x=(e.clientX-rect.left)/rect.width,y=(e.clientY-rect.top)/rect.height;const delta=e.deltaY*(e.deltaMode===1?16:e.deltaMode===2?area.clientHeight:1),next=Math.max(.5,Math.min(8,zoom*Math.exp(-Math.max(-150,Math.min(150,delta))*.003)));if(next===zoom)return;zoom=next;fitArt();const after=$('artboard').getBoundingClientRect();area.scrollLeft+=after.left+x*after.width-e.clientX;area.scrollTop+=after.top+y*after.height-e.clientY;},{passive:false});
let gesture=null;
const compare=e=>{const r=$('artboard').getBoundingClientRect();$('splitRange').value=Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100));updateSplit();};
area.addEventListener('pointerdown',e=>{if(!source||busy)return;const pan=e.button===1,split=e.button===0&&view==='compare';if(!pan&&!split)return;e.preventDefault();e.stopImmediatePropagation();gesture={id:e.pointerId,pan,x:e.clientX,y:e.clientY,left:area.scrollLeft,top:area.scrollTop};area.setPointerCapture(e.pointerId);if(pan)area.classList.add('hand-panning');else compare(e);},true);
area.addEventListener('pointermove',e=>{if(!gesture||gesture.id!==e.pointerId)return;e.preventDefault();e.stopImmediatePropagation();if(gesture.pan){area.scrollLeft=gesture.left-(e.clientX-gesture.x);area.scrollTop=gesture.top-(e.clientY-gesture.y);}else compare(e);},true);
const finish=e=>{if(!gesture||gesture.id!==e.pointerId)return;gesture=null;area.classList.remove('hand-panning');if(area.hasPointerCapture(e.pointerId))area.releasePointerCapture(e.pointerId);};
area.addEventListener('pointerup',finish,true);area.addEventListener('pointercancel',finish,true);area.addEventListener('lostpointercapture',finish);
area.addEventListener('auxclick',e=>{if(e.button===1)e.preventDefault();});
})();
