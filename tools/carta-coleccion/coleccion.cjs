#!/usr/bin/env node
// Carta de colección GARA — una carta física (poker 63.5 x 88.9 mm + 3 mm de sangrado) por pieza vendida.
// Frente: recorte de SU pieza, nombre, N.º, propietario y código. Reverso: agradecimiento con su nombre + QR a SU certificado.
//
// Uso:  node coleccion.cjs <pieza.json> <recorte.(webp|png)> <salida/>  [--sin-sangrado]
//   pieza.json  = piezas/<slug>.json (nombre, numero, codigo, propietario, saludo, color, categoria?, anio?)
// Genera: <salida>/<codigo>-frente.png, -reverso.png (300 dpi con sangrado), <codigo>-vista-*.png (con esquinas),
//         <codigo>-imprenta.pdf (2 páginas, con sangrado)
const fs = require('fs'), path = require('path');
const R = (p) => require(path.join(process.env.GARA_NODE_MODULES || path.join(__dirname, '..', 'node_modules'), p));   // sharp y qrcode: tools/node_modules
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const sharp = R('sharp'), QR = R('qrcode');

const AQUI = __dirname, FONTS = path.join(AQUI, 'fonts');
const FLOR = JSON.parse(fs.readFileSync(path.join(AQUI, 'flor-trace.json'), 'utf8')).d;
const CAT = { CB: 'CARTERA', TJ: 'TARJETERO', TP: 'TARJETERO', NC: 'NECESER', EL: 'ESTUCHE', BT: 'BOLSA', TB: 'BOLSA' };

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

async function recorteRecortado(src) {
  // recorta los bordes transparentes para que la pieza ocupe el panel completo
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = info.width, y0 = info.height, x1 = 0, y1 = 0;
  for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 24) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const buf = await sharp(src).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 }).png().toBuffer();
  return { uri: 'data:image/png;base64,' + buf.toString('base64'), w: x1 - x0 + 1, h: y1 - y0 + 1 };
}

async function qrSvg(url) {
  const svg = await QR.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#1a140d', light: '#00000000' } });
  return svg.replace(/<svg /, '<svg shape-rendering="crispEdges" ');
}

const flor = (id) => `<svg class="flor" viewBox="303 216 1651 1666"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f6dca0"/><stop offset=".5" stop-color="#c98a3a"/><stop offset="1" stop-color="#f1cf8a"/></linearGradient></defs><path fill="url(#${id})" fill-rule="evenodd" d="${FLOR}"/></svg>`;

function html(d, rec, qr) {
  const f = (n) => 'file://' + path.join(FONTS, n);
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:CG;src:url("${f('CormorantGaramond.ttf')}");font-weight:300 700}
@font-face{font-family:CG;src:url("${f('CormorantGaramond-Italic.ttf')}");font-weight:300 700;font-style:italic}
@font-face{font-family:PM;src:url("${f('IBMPlexMono-Medium.ttf')}")}
@font-face{font-family:IN;src:url("${f('Inter-Regular.otf')}");font-weight:400}
@font-face{font-family:IN;src:url("${f('Inter-Medium.otf')}");font-weight:500}
*{box-sizing:border-box;margin:0;padding:0}
@page{size:69.5mm 94.9mm;margin:0}
html,body{background:#555}
@media print{html,body{background:#0a0907}}
html:has(body.vista){background:#3a3632}
.pg{position:relative;width:69.5mm;height:94.9mm;overflow:hidden;background:radial-gradient(120% 75% at 50% 30%,#2b2218 0%,#15120e 52%,#0a0907 100%);page-break-after:always;color:#efe7d8;font-family:IN,sans-serif}
.pg:last-child{page-break-after:auto}
.trim{position:absolute;left:3mm;top:3mm;width:63.5mm;height:88.9mm}
.holo{position:absolute;inset:3mm;border-radius:2.7mm;padding:.5mm;background:linear-gradient(125deg,#bfe3ff 0%,#f6c1e6 28%,#f7d58a 55%,#d99a45 80%,#9b6a2c 100%);-webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask-composite:exclude}
.mono{font-family:PM,monospace;letter-spacing:.14em;text-transform:uppercase}
.oro{color:#d8ae68}
.top{position:absolute;left:7.4mm;right:7.4mm;top:6.3mm;display:flex;align-items:center;justify-content:space-between}
.top .marca{display:flex;align-items:center;gap:1.4mm}
.flor{width:4.4mm;height:4.4mm;display:block}
.gara{font-family:CG,serif;font-weight:600;font-size:3.6mm;letter-spacing:.42em;color:#e2bd7c}
.top .num{font-size:2.25mm;color:#c9a46a}
.panel{position:absolute;left:6.6mm;top:11.8mm;width:50.3mm;height:40.2mm;padding-top:3.4mm;border-radius:2mm;background:radial-gradient(85% 85% at 50% 42%,#2f261b 0%,#17130f 100%);border:.13mm solid rgba(255,255,255,.09);display:flex;align-items:center;justify-content:center;overflow:hidden}
.panel img{max-width:82%;max-height:90%;object-fit:contain;filter:drop-shadow(0 1.1mm 1.5mm rgba(0,0,0,.65))}
.badge{position:absolute;right:1.7mm;top:1.7mm;font-size:1.55mm;padding:.65mm 1.5mm .6mm;border-radius:9mm;background:linear-gradient(#f4d58f,#c8923f);color:#2a1d08;letter-spacing:.16em}
.kick{position:absolute;left:7.2mm;top:54.4mm;font-size:2mm;letter-spacing:.24em}
.nombre{position:absolute;left:7.2mm;top:57.6mm;width:max-content;font-family:CG,serif;font-weight:500;font-size:8mm;line-height:1;white-space:nowrap;color:#f6eee0}
.desc{position:absolute;left:7.2mm;right:7.2mm;top:67.6mm;font-size:2.3mm;line-height:1.36;color:#b3a894;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-height:6.4mm}
.hr{position:absolute;left:7.2mm;right:7.2mm;top:73.9mm;height:.13mm;background:rgba(255,255,255,.14)}
.lab{position:absolute;left:7.2mm;top:75.9mm;font-size:1.55mm;color:#8d8272;letter-spacing:.22em}
.own{position:absolute;left:7.2mm;top:78.4mm;width:max-content;font-size:3.3mm;font-weight:500;color:#f1e9da;white-space:nowrap}
.cod{position:absolute;right:7.2mm;top:75.6mm;font-size:1.8mm;color:#d8ae68;letter-spacing:.1em}
/* reverso */
.b-flor{position:absolute;left:50%;top:7.2mm;transform:translateX(-50%)}
.b-flor .flor{width:8mm;height:8mm}
.gracias{position:absolute;left:7mm;right:7mm;top:18.4mm;text-align:center;font-family:CG,serif;font-style:italic;font-weight:500;color:#e4bf7e;line-height:1.04;font-size:8.2mm}
.gracias .s{display:block;width:max-content;margin:0 auto;font-size:6.6mm;white-space:nowrap;color:#f0d9a8}
.cuerpo{position:absolute;left:8.2mm;right:8.2mm;top:37.2mm;text-align:center;font-family:CG,serif;font-weight:500;font-size:3.2mm;line-height:1.36;color:#e9e0cf}
.lema{position:absolute;left:7mm;right:7mm;top:53.2mm;text-align:center;font-family:CG,serif;font-style:italic;font-weight:500;font-size:4.3mm;color:#d8ae68}
.b-hr{position:absolute;left:7.2mm;right:7.2mm;top:61.4mm;height:.13mm;background:rgba(255,255,255,.14)}
.qrbox{position:absolute;left:7.2mm;top:64.2mm;width:17.2mm;height:17.2mm;border-radius:1.4mm;background:#f3ecdc;padding:1.3mm}
.qrbox svg{width:100%;height:100%;display:block}
.qt{position:absolute;left:27mm;right:7mm;top:65.6mm}
.qt .a{font-size:1.85mm;color:#d8ae68;letter-spacing:.2em;line-height:1.5}
.qt .u{font-size:1.7mm;color:#b8ad98;letter-spacing:.02em;margin-top:1.4mm;line-height:1.6;text-transform:none;white-space:nowrap}
.qt .n{font-size:1.7mm;color:#d8ae68;letter-spacing:.1em;margin-top:1.8mm;line-height:1.5;opacity:.85}
/* vista previa con esquinas redondeadas */
.vista .pg{border-radius:3.5mm;width:63.5mm;height:88.9mm}
.vista .trim{left:0;top:0}
</style></head><body>${d.cuerpoHtml}</body></html>`;
}

function paginas(d, rec, qr, vista) {
  const frente = `<div class="pg"><div class="trim">
  <div class="holo"></div>
  <div class="top"><div class="marca">${flor('gf')}<span class="gara">GARA</span></div><span class="num mono">N.º ${esc(d.numero)}</span></div>
  <div class="panel"><img src="${rec.uri}" alt=""><span class="badge mono">✦ Ejemplar único</span></div>
  <div class="kick mono oro">${esc(d.categoria)} · ${esc(d.anio)}</div>
  <div class="nombre" id="nombre">${esc(d.nombre)}</div>
  <div class="desc">${esc(d.color)}</div>
  <div class="hr"></div>
  <div class="lab mono">Propietario</div>
  <div class="cod mono">${esc(d.codigo)}</div>
  <div class="own" id="own">${esc(d.propietario)}</div>
</div></div>`;
  const reverso = `<div class="pg"><div class="trim">
  <div class="holo"></div>
  <div class="b-flor">${flor('gb')}</div>
  <div class="gracias"><span>Gracias,</span><span class="s" id="saludo">${esc(d.saludo)}.</span></div>
  <div class="cuerpo">Tu pieza fue cortada, cosida y terminada a mano en Acapulco, una sola vez y para una sola persona.</div>
  <div class="lema">Cuídala. Úsala. Vívela.</div>
  <div class="b-hr"></div>
  <div class="qrbox">${qr}</div>
  <div class="qt mono"><div class="a">Tu certificado</div><div class="u">garaleathergoods.mx<br>/verify/gara-${esc(d.numero)}</div><div class="n">${esc(d.codigo)}</div></div>
</div></div>`;
  return { frente, reverso };
}

async function generar(piezaPath, recortePath, salida, opts = {}) {
  salida = path.resolve(salida); piezaPath = path.resolve(piezaPath); recortePath = path.resolve(recortePath);
  const p = JSON.parse(fs.readFileSync(piezaPath, 'utf8'));
  const num = p.numero || (p.codigo.match(/(\d{6})$/) || [])[1];
  const pref = (p.codigo.match(/^GA-([A-Z]{2})-/) || [])[1];
  const d = {
    nombre: p.nombre, numero: num, codigo: p.codigo, propietario: p.propietario, saludo: p.saludo || p.propietario.split(' ')[0],
    color: p.color || '', categoria: p.categoria || CAT[pref] || 'PIEZA', anio: p.anio || (p.codigo.match(/^GA-[A-Z]{2}-(\d{2})-/) || [])[1] ? '20' + p.codigo.match(/^GA-[A-Z]{2}-(\d{2})-/)[1] : '2026',
    urlCorta: `garaleathergoods.mx/verify/gara-${num}`,
  };
  const url = `https://garaleathergoods.mx/verify/gara-${num}/`;
  const rec = await recorteRecortado(recortePath);
  const qr = await qrSvg(url);
  const { frente, reverso } = paginas(d, rec, qr);
  fs.mkdirSync(salida, { recursive: true });
  const base = path.join(salida, d.codigo.toLowerCase());
  const browser = await chromium.launch();
  const ajusta = async (page) => page.evaluate(() => {
    // reduce los textos que se saldrían del ancho útil (nombres largos, propietarios con título, etc.)
    document.querySelectorAll('#nombre,#own,#saludo').forEach((e) => {
      const box = e.closest('.trim').getBoundingClientRect();
      const max = box.width - 2 * 7.4 * 96 / 25.4;
      let sz = parseFloat(getComputedStyle(e).fontSize);
      while (e.getBoundingClientRect().width > max && sz > 6) { sz -= 0.4; e.style.fontSize = sz + 'px'; }
    });
  });
  try {
    const hoja = path.join(salida, '.tmp.html');
    // --- impresión: sangrado completo, página por lado
    d.cuerpoHtml = frente + reverso;
    fs.writeFileSync(hoja, html(d, rec, qr));
    const pg = await browser.newPage({ deviceScaleFactor: 300 / 96 });
    await pg.setViewportSize({ width: 270, height: 366 });
    await pg.goto('file://' + hoja); await pg.evaluate(() => document.fonts.ready); await ajusta(pg);
    const els = await pg.$$('.pg');
    await els[0].screenshot({ path: base + '-frente.png' });
    await els[1].screenshot({ path: base + '-reverso.png' });
    await pg.pdf({ path: base + '-imprenta.pdf', preferCSSPageSize: true, printBackground: true, margin: { top: 0, right: 0, bottom: 0, left: 0 } });
    await pg.close();
    // --- vista previa: esquinas redondeadas como la carta final
    fs.writeFileSync(hoja, html(d, rec, qr).replace('<body>', '<body class="vista" style="background:#3a3632;padding:8mm;display:flex;gap:8mm">'));
    const pv = await browser.newPage({ deviceScaleFactor: 6 });
    await pv.setViewportSize({ width: 560, height: 420 });
    await pv.goto('file://' + hoja); await pv.evaluate(() => document.fonts.ready); await ajusta(pv);
    const vs = await pv.$$('.pg');
    // las cartas sueltas llevan esquinas transparentes; el par va sobre fondo gris
    await pv.evaluate(() => { document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; });
    await vs[0].screenshot({ path: base + '-vista-frente.png', omitBackground: true });
    await vs[1].screenshot({ path: base + '-vista-reverso.png', omitBackground: true });
    await pv.evaluate(() => { document.documentElement.style.background = '#3a3632'; document.body.style.background = '#3a3632'; });
    await pv.screenshot({ path: base + '-vista-par.png', fullPage: true });
    await pv.close();
    fs.unlinkSync(hoja);
  } finally { await browser.close(); }
  return base;
}

if (require.main === module) {
  const [pz, rc, out] = process.argv.slice(2);
  if (!pz || !rc || !out) { console.error('uso: node coleccion.cjs <pieza.json> <recorte> <salida/>'); process.exit(1); }
  generar(pz, rc, out).then((b) => console.log('listo', b)).catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { generar };
