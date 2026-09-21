'use strict';
const precisionBindings=[{id:'detail',target:'tolerance',to:v=>3-2.9*v/100,from:v=>(3-v)/2.9*100},{id:'smoothing',target:'smartTolerance',to:v=>.5+3.5*v/100,from:v=>(v-.5)/3.5*100}];
function syncPrecision(){for(const b of precisionBindings){const value=Math.round(b.from(Number($(b.target).value)));$(b.id+'Range').value=value;$(b.id+'Number').value=value;const disabled=b.id==='smoothing'&&!$('smart').checked;$(b.id+'Range').disabled=disabled;$(b.id+'Number').disabled=disabled;}}
const originalSyncLabels=syncLabels;syncLabels=function(){originalSyncLabels();syncPrecision();};
for(const b of precisionBindings){for(const suffix of ['Range','Number']){const el=$(b.id+suffix);el.addEventListener(suffix==='Range'?'change':'input',()=>{if(el.value===''||!el.validity.valid)return;const value=Math.min(100,Math.max(0,Number(el.value)));$(b.target).value=b.to(value).toFixed(3);$(b.target).dispatchEvent(new Event('input',{bubbles:true}));});el.addEventListener('change',syncPrecision);el.addEventListener('blur',syncPrecision);}}
syncPrecision();
// Keep result colors beside color-count controls, where users choose colors.
const editablePalette=$('palette').closest('.palette-section');
editablePalette.classList.add('controls-palette');
$('colors').closest('.field').after(editablePalette);

// Keep everyday choices visible; preserve the existing controls and event handlers.
const settingsPanel=$('settings');
document.querySelector('.controls .panel-heading h2').textContent='Gambar & pengaturan';
document.querySelector('label[for="preset"]').textContent='Jenis gambar';
const profileHelp=document.createElement('p');
profileHelp.className='hint profile-help';
$('preset').after(profileHelp);
const profileDescriptions={balanced:'Pilihan awal untuk kebanyakan ilustrasi.',detail:'Untuk ornamen dan detail kecil. Proses lebih lama.',line:'Untuk gambar garis dengan ketebalan seragam.',icon:'Untuk logo dan ikon dengan warna solid.',mono:'Untuk bentuk hitam putih yang terisi.',custom:'Menggunakan pengaturan yang kamu sesuaikan.'};
const advancedControls=document.createElement('details');
advancedControls.className='advanced simple-advanced';
advancedControls.innerHTML='<summary>Pengaturan lanjutan <span>Kurva, kualitas & latar</span></summary>';
const advancedBody=document.createElement('div');
advancedBody.className='advanced-body';
advancedControls.append(advancedBody);
const transparency=settingsPanel.querySelector('details.advanced');
advancedBody.append(settingsPanel.querySelector('.smart-section'),$('speckles').closest('.field'),$('resolution').closest('.field'),$('corners').closest('label'),transparency);
settingsPanel.append(advancedControls);
const lineAdvanced=document.createElement('details');
lineAdvanced.className='advanced line-advanced';
lineAdvanced.innerHTML='<summary>Perbaikan garis</summary>';
const lineRefinement=settingsPanel.querySelector('.line-refinement');
lineRefinement.before(lineAdvanced);lineAdvanced.append(lineRefinement);
document.querySelector('label[for="smoothingRange"]').textContent='Kehalusan kurva';
document.querySelector('label[for="smart"] span').textContent='Haluskan kurva';
document.querySelector('label[for="lineRefine"] span').textContent='Rapikan garis otomatis';
document.querySelector('label[for="colorMode"]').textContent='Warna';
$('colorMode').options[0].text='Otomatis';$('colorMode').options[1].text='Tentukan jumlah warna';
document.querySelector('label[for="alpha"]').textContent='Latar transparan';
$('alpha').options[0].text='Pertahankan transparansi';
$('alpha').options[1].text='Isi dengan warna latar';
document.querySelector('label[for="background"]').textContent='Warna latar';
document.querySelector('#detailRange').closest('.precision-control').querySelector('.hint').textContent='Lebih tinggi = lebih banyak detail.';
$('lineWidth').nextElementSibling.textContent='Semua garis memakai ketebalan yang sama.';
lineRefinement.querySelector('.hint').textContent='Merapikan posisi garis dan sambungannya.';
function syncSimpleControls(){
  const profile=$('preset').value;
  profileHelp.textContent=profileDescriptions[profile]||profileDescriptions.custom;
  const colorVisible=profile!=='line'&&profile!=='mono';
  $('colorMode').closest('.field').hidden=!colorVisible;
  $('colors').closest('.field').hidden=!colorVisible||$('colorMode').value!=='manual';
  $('colorModeHint').textContent=$('colorMode').value==='auto'?'Warna utama dideteksi dari gambar.':'Pilih jumlah warna yang ingin dipertahankan.';
  $('monoThreshold').closest('.field').hidden=profile!=='mono'&&profile!=='line';
}
const precisionSyncLabels=syncLabels;
syncLabels=function(){precisionSyncLabels();syncSimpleControls();};
syncSimpleControls();
