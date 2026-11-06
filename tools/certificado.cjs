// Certificado GARA a partir del diseño base (render 300 dpi del certificado de Majin Boo).
const sharp=require('sharp'),fs=require('fs'),Q=require('qrcode');
const {PDFDocument,PDFName,PDFString}=require('pdf-lib');
const spec=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
const BASE=spec.base, BG={r:247,g:242,b:232}, INK='#1f1a15';
const esc=t=>String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const LS_DET=spec.lsDetalles??0;
(async()=>{
 const W=2481,H=3508;
 const rect=(x,y,w,h)=>({input:{create:{width:w,height:h,channels:3,background:BG}},left:x,top:y});
 const patches=[rect(1340,1100,980,140),rect(1340,1375,980,85),rect(1340,1645,980,75),rect(1340,1845,980,62),rect(1340,2365,980,100),rect(1760,2495,360,110),rect(1560,3020,500,70),rect(2105,3030,160,155)];
 const photo=await sharp(spec.foto).rotate().resize(926,1229,{fit:'cover',position:spec.fotoPos||'centre'}).toBuffer();
 const qrsvg=await Q.toString(spec.url,{type:'svg',margin:0,errorCorrectionLevel:'M',color:{dark:'#171412',light:'#0000'}});
 const qr=await sharp(Buffer.from(qrsvg)).resize(131,131,{kernel:'nearest'}).png().toBuffer();
 const t=(x,y,txt,font,size,extra='')=>`<text x="${x}" y="${y}" font-family="${font}" font-size="${size}" fill="${INK}" ${extra}>${esc(txt)}</text>`;
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
 ${t(1346,1167,spec.nombre,'DejaVu Serif',66.7,'font-weight="bold"')}
 ${t(1346,1221,spec.subtitulo,'DejaVu Sans',27.5,'font-weight="bold"')}
 ${t(1346,1437,spec.codigo,'DejaVu Serif',66.7)}
 ${t(1346,1700,spec.propietario,'DejaVu Serif',44.2)}
 ${t(1346,1892,spec.fecha,'DejaVu Serif',42.5)}
 ${t(1346,2404,spec.detalles[0],'DejaVu Serif',29.6,`letter-spacing="${LS_DET}"`)}
 ${t(1346,2450,spec.detalles[1]||'','DejaVu Serif',29.6,`letter-spacing="${LS_DET}"`)}
 ${spec.firma?t(1809,3067,spec.firma,'Liberation Serif',45.8,'font-style="italic" text-anchor="middle"'):''}
 </svg>`;
 const extra=[];
 if(spec.firmaImg){const fi=await sharp(spec.firmaImg).resize(470,215,{fit:'inside'}).png().toBuffer();const fm=await sharp(fi).metadata();
  extra.push(rect(1560,2930,500,250));extra.push({input:fi,left:Math.round(1806-fm.width/2),top:Math.round(3176-fm.height)});spec.firma='';}
 const png=await sharp(BASE).removeAlpha().composite([...patches,{input:photo,left:270,top:1009},{input:qr,left:2118,top:3043},{input:Buffer.from(svg),left:0,top:0},...extra]).png().toBuffer();
 const jpg=await sharp(png).jpeg({quality:90,chromaSubsampling:'4:4:4'}).toBuffer();
 fs.writeFileSync(spec.salida.replace(/\.pdf$/,'-preview.jpg'),jpg);
 const pdf=await PDFDocument.create();
 pdf.setTitle(spec.titulo);pdf.setAuthor('GARA Atelier');pdf.setSubject(spec.codigo);pdf.setProducer('GARA Atelier');pdf.setCreator('GARA Atelier');
 const page=pdf.addPage([595.28,841.89]);const img=await pdf.embedJpg(jpg);page.drawImage(img,{x:0,y:0,width:595.28,height:841.89});
 const k=595.28/W, pr=(x0,y0,x1,y1)=>[x0*k,841.89-y1*k,x1*k,841.89-y0*k];
 const annots=[pr(1340,1375,1950,1460),pr(2118,3043,2249,3174)].map(r=>pdf.context.register(pdf.context.obj({Type:'Annot',Subtype:'Link',Rect:r,Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(spec.url)}})));
 page.node.set(PDFName.of('Annots'),pdf.context.obj(annots));
 fs.writeFileSync(spec.salida,await pdf.save());console.log('ok',spec.salida);
})();
