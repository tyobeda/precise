'use strict';
async function inspectRaster(file){
 if(file.size>25*1024*1024)throw Error('File melebihi 25 MB.');
 const b=new Uint8Array(await file.arrayBuffer());let width=0,height=0;
 if(b.length>=24&&[137,80,78,71,13,10,26,10].every((v,i)=>b[i]===v)){const d=new DataView(b.buffer);width=d.getUint32(16);height=d.getUint32(20);}
 else if(b[0]===255&&b[1]===216){let i=2;while(i<b.length){if(b[i++]!==255)break;while(b[i]===255)i++;const marker=b[i++];if(marker===217||marker===218)break;if(marker===1||(marker>=208&&marker<=215))continue;if(i+2>b.length)break;const length=(b[i]<<8)|b[i+1];if(length<2||i+length>b.length)break;if([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(marker)){if(length<8)break;height=(b[i+3]<<8)|b[i+4];width=(b[i+5]<<8)|b[i+6];break;}i+=length;}}
 else throw Error('Pilih PNG, JPG, atau JPEG yang valid.');
 if(!width||!height)throw Error('Header gambar rusak atau format tidak didukung.');
 if(width*height>40000000||width>32768||height>32768)throw Error('Batas gambar 40 megapiksel dan 32.768 px per sisi.');
 return {width,height};
}
