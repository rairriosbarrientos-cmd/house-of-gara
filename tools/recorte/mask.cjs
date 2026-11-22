// Recorte con silueta poligonal: node mask.cjs <foto> <silueta.txt> <recorte.png> <revision.png>
const s=require('sharp');const fs=require('fs');
const [f,dfile,out,rev]=process.argv.slice(2);
(async()=>{
 const d=fs.readFileSync(dfile,'utf8').trim();const m=await s(f).metadata();const W=m.width,H=m.height;
 const mk=await s(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#000"/><path d="${d}" fill="#fff"/></svg>`)).blur(0.9).greyscale().raw().toBuffer({resolveWithObject:true});
 const rgb=await s(f).removeAlpha().raw().toBuffer();const ch=mk.info.channels;
 const buf=Buffer.alloc(W*H*4);for(let i=0;i<W*H;i++){buf[i*4]=rgb[i*3];buf[i*4+1]=rgb[i*3+1];buf[i*4+2]=rgb[i*3+2];buf[i*4+3]=mk.data[i*ch]}
 const png=await s(buf,{raw:{width:W,height:H,channels:4}}).png().toBuffer();
 const t=await s(png).trim().png().toBuffer();fs.writeFileSync(out,t);
 // hoja de revisión: ocho recortes del borde con la silueta en cian, a 2x
 const line=await s(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><path d="${d}" fill="none" stroke="#0ff" stroke-width="1.2"/></svg>`)).png().toBuffer();
 const comb=await s(f).removeAlpha().composite([{input:line}]).png().toBuffer();
 const partes=[[290,260,160,120],[430,190,200,70],[610,200,200,160],[700,380,140,200],[740,900,100,200],[700,1150,140,110],[280,1150,160,110],[280,700,80,200],[290,380,70,240]];
 const ims=[];for(const [x,y,w,h] of partes)ims.push(await s(comb).extract({left:x,top:y,width:w,height:h}).resize(w*3,h*3,{kernel:'nearest'}).toBuffer());
 // acomodar en una hoja de 3 columnas
 const cols=3;const anchos=partes.map(p=>p[2]*3),altos=partes.map(p=>p[3]*3);
 const cw=Math.max(...anchos)+8;const filas=Math.ceil(partes.length/cols);const rh=[];for(let r=0;r<filas;r++)rh.push(Math.max(...altos.slice(r*cols,r*cols+cols))+8);
 const comp=[];let y=0;for(let r=0;r<filas;r++){for(let c=0;c<cols;c++){const i=r*cols+c;if(i<ims.length)comp.push({input:ims[i],left:c*cw,top:y})}y+=rh[r]}
 await s({create:{width:cw*cols,height:y,channels:3,background:'#fff'}}).composite(comp).jpeg({quality:88}).toFile(rev);
 const mt=await s(t).metadata();console.log('recorte',mt.width+'x'+mt.height);
})();
