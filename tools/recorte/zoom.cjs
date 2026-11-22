// Recorta una región de la foto, la amplía y le dibuja una cuadrícula con las coordenadas ORIGINALES (para trazar la silueta).
const sharp=require('sharp');
const [foto,x0,y0,w,h,esc,paso,out]=process.argv.slice(2);
(async()=>{
 const X=+x0,Y=+y0,W=+w,H=+h,E=+esc,P=+paso;
 let g='';
 for(let x=Math.ceil(X/P)*P;x<=X+W;x+=P){const px=(x-X)*E;g+=`<line x1="${px}" y1="0" x2="${px}" y2="${H*E}" stroke="#0ff" stroke-width="1" opacity=".6"/><text x="${px+3}" y="13" font-size="13" fill="#0ff" font-family="monospace">${x}</text>`}
 for(let y=Math.ceil(Y/P)*P;y<=Y+H;y+=P){const py=(y-Y)*E;g+=`<line x1="0" y1="${py}" x2="${W*E}" y2="${py}" stroke="#ff0" stroke-width="1" opacity=".6"/><text x="3" y="${py-3}" font-size="13" fill="#ff0" font-family="monospace">${y}</text>`}
 const svg=Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W*E}" height="${H*E}">${g}</svg>`);
 const base=await sharp(foto).extract({left:X,top:Y,width:W,height:H}).resize(W*E,H*E,{kernel:'lanczos3'}).toBuffer();
 await sharp(base).composite([{input:svg}]).jpeg({quality:90}).toFile(out);
 console.log('ok',out);
})();
