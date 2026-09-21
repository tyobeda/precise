'use strict';
(()=>{
 const stage=document.getElementById('stage');
 const dock=document.createElement('div');dock.className='canvas-tools-dock';
 const toolbar=document.querySelector('.canvas-toolbar');
 const refine=document.querySelector('.refine-toolbar');
 dock.append(toolbar,refine);stage.prepend(dock);
 const rename=document.querySelector('.bulk-rename-form');
 const toggle=document.createElement('button');toggle.className='button secondary compact';toggle.id='toggleBulkRename';toggle.textContent='Rename semua';toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-controls','bulkRenameForm');
 rename.id='bulkRenameForm';rename.hidden=true;
 document.getElementById('bulkNewQueue').after(toggle);
 toggle.onclick=()=>{rename.hidden=!rename.hidden;toggle.setAttribute('aria-expanded',String(!rename.hidden));if(!rename.hidden)document.getElementById('bulkRenameBase').focus();};
})();
