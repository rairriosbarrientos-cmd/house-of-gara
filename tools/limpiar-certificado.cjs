// Limpia un certificado PDF hecho a partir de uno viejo: renderiza la página (300 dpi, ver README), tapa la marca
// fantasma en (1760,2495) 360x110 px y rehace un PDF de 1 página A4 con links al registro de la pieza.
// Uso: node tools/limpiar-certificado.cjs pagina.png salida.pdf "Título" GARA-000142 https://garaleathergoods.mx/verify/gara-000142/ x1,y1,x2,y2 [...]
const sharp = require('sharp'); const fs = require('fs');
const { PDFDocument, PDFName, PDFString } = require('pdf-lib');
const [png, out, title, serial, url, ...rects] = process.argv.slice(2);
(async () => {
  const bgc = { r: 247, g: 242, b: 231 };
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true });
  const i = (2540 * info.width + 1600) * info.channels; const bg = { r: data[i], g: data[i + 1], b: data[i + 2] };
  const patch = await sharp({ create: { width: 360, height: 110, channels: 3, background: bg } }).png().toBuffer();
  const jpg = await sharp(png).composite([{ input: patch, left: 1760, top: 2495 }]).jpeg({ quality: 90, chromaSubsampling: '4:4:4' }).toBuffer();
  fs.writeFileSync(out.replace('.pdf', '-preview.jpg'), jpg);
  const pdf = await PDFDocument.create();
  pdf.setTitle(title); pdf.setAuthor('GARA Atelier'); pdf.setSubject(serial); pdf.setProducer('GARA Atelier'); pdf.setCreator('GARA Atelier');
  const page = pdf.addPage([595.28, 841.89]);
  page.drawImage(await pdf.embedJpg(jpg), { x: 0, y: 0, width: 595.28, height: 841.89 });
  const annots = rects.map((r) => pdf.context.register(pdf.context.obj({ Type: 'Annot', Subtype: 'Link', Rect: r.split(',').map(Number), Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: PDFString.of(url) } })));
  page.node.set(PDFName.of('Annots'), pdf.context.obj(annots));
  fs.writeFileSync(out, await pdf.save()); console.log('ok', bg);
})();
