#!/usr/bin/env node
/*
 * GARA — alta de una pieza nueva sobre el sitio ya construido (export estático de Next.js).
 *
 * Uso:
 *   node tools/nueva-pieza.cjs piezas/majin-boo.json --sitio /ruta/a/house-of-gara [--sin-imagenes]
 *
 * Toma como plantilla una pieza existente de la MISMA categoría (p. ej. "axioma" para tarjeteros)
 * y genera:
 *   verify/gara-NNNNNN, verify/gara-NNNNNN-nfc, verify/<codigo>, verify/<codigo>-nfc  (QR regenerado)
 *   productos/<slug>/ (ficha), productos/<slug>-01..03.webp, productos/<slug>-recorte.webp
 *   certificates/gara-NNNNNN.pdf y certificates/<codigo>.pdf
 *   share/<codigo>.jpg (historia 2160x3840) y share/og/<codigo>.jpg (vista previa 1200x630)
 *   tarjeta en /productos/, panel en el inicio y entrada en sitemap.xml
 *
 * Requiere: node >= 18, sharp, qrcode (npm i en tools/), y playwright para las imágenes de share.
 */
const fs = require('fs');
const path = require('path');
const http = require('http');

const args = process.argv.slice(2);
const cfgPath = args.find((a) => !a.startsWith('--'));
const sitio = path.resolve(args[args.indexOf('--sitio') + 1] || '.');
const sinImagenes = args.includes('--sin-imagenes');
if (!cfgPath || !fs.existsSync(path.join(sitio, 'verify'))) {
  console.error('Uso: node tools/nueva-pieza.cjs pieza.json --sitio /ruta/house-of-gara');
  process.exit(1);
}
const cfgDir = path.dirname(path.resolve(cfgPath));
const cfg = JSON.parse(fs.readFileSync(cfgPath, 'utf8'));
const S = (...p) => path.join(sitio, ...p);
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, t) => fs.writeFileSync(p, t);
const fail = (m) => { console.error('✗ ' + m); process.exit(1); };
const ok = (m) => console.log('✓ ' + m);

// ---------- 1. Datos de la plantilla ----------
function productosDelInicio() {
  const line = read(S('index.txt')).split('\n').find((l) => l.includes('{"products":['));
  if (!line) fail('No encontré la lista de productos en index.txt');
  return JSON.parse(line.slice(line.indexOf(':') + 1))[3].products;
}
const productos = productosDelInicio();
const tpl = productos.find((p) => p.slug === cfg.plantilla);
if (!tpl) fail(`Plantilla "${cfg.plantilla}" no existe. Opciones: ${productos.map((p) => p.slug).join(', ')}`);
if (productos.some((p) => p.slug === cfg.slug)) fail(`Ya existe un producto con slug "${cfg.slug}"`);

const tplNum = tpl.description.match(/GA-[A-Z]+-\d+-(\d{6})/)[1];
const tplCode = tpl.description.match(/(GA-[A-Z]+-\d+-\d{6})/)[1];
const tplSerial = `gara-${tplNum}`;
const tplHtml = read(S('verify', tplSerial, 'index.html'));
const unesc = (s) => s.replace(/&amp;/g, '&').replace(/&quot;/g, '"').replace(/&#x27;/g, "'");
const tplOwner = unesc(tplHtml.match(/propiedad de (.*?)\."/)[1]);
const tplSaludo = unesc(tplHtml.match(/Hola, <!-- -->(.*?)<!-- -->/)[1]);
const tplFecha = tplHtml.match(/(\d{1,2} de [a-z]+ de 20\d\d)/)[1];
const SUFIJO = ' Pieza única. Hecha a mano en México.';
const tplDesc = tpl.description.split(SUFIJO)[0];

const num = String(cfg.numero).padStart(6, '0');
const code = cfg.codigo.toUpperCase();
if (!code.endsWith(num)) fail('El código debe terminar con el número de la pieza');
const serial = `gara-${num}`;
if (fs.existsSync(S('verify', serial))) fail(`verify/${serial} ya existe`);
for (const k of ['slug', 'nombre', 'propietario', 'saludo', 'fecha', 'historia', 'descripcion', 'color', 'materiales'])
  if (!cfg[k]) fail(`Falta "${k}" en ${cfgPath}`);
if (cfg.materiales.length !== tpl.materials.length)
  fail(`La plantilla tiene ${tpl.materials.length} materiales; pon exactamente ${tpl.materials.length}`);

// ---------- 2. Tabla de reemplazos ----------
const articulo = (n) => (/^(Ing|Lic|Dr|Arq|Mtro|Sr)\.? /.test(n) ? 'el ' : /^(Dra|Mtra|Sra|Lica)\.? /.test(n) ? 'la ' : '');
const pairs = [];
const add = (a, b) => { if (a && a !== b) pairs.push([a, b]); };
// Pieza disponible (aún sin dueño): textos de venta en lugar de los de propietario.
if (cfg.disponible) {
  add(`propiedad de ${tplOwner}.`, 'ejemplar único disponible para su primer dueño.');
  add(`a nombre de ${tplOwner}.`, 'lista para registrarse a nombre de su primer dueño.');
  add(`Pieza registrada para ${articulo(tplOwner)}${tplOwner}.`, 'Esta pieza espera a su primer dueño.');
  add('. Esta pieza es tuya y está registrada en el atelier.', '. Esta pieza está registrada en el atelier y espera a su primer dueño.');
  add('Esta pieza es tuya.', 'Esta pieza puede ser tuya.');
  add(`Mi ${tpl.name} de GARA: pieza auténtica, hecha a mano y registrada a mi nombre.`, `${tpl.name} de GARA: pieza auténtica, hecha a mano y registrada en el Archivo GARA.`);
  add('tengo%20la%20pieza%20', 'me%20interesa%20la%20pieza%20');
  add('Contactar al atelier', 'La quiero · WhatsApp');
}
// Cambio de categoría (p. ej. plantilla de tarjetero para una cartera o un estuche).
if (cfg.subtitulo) add(tpl.subtitle, cfg.subtitulo);
if (cfg.subtituloCertificado) add(tpl.certificateSubtitle, cfg.subtituloCertificado);
if (cfg.categoria) {
  add(`"category":"${tpl.category}"`, `"category":"${cfg.categoria.clave}"`);
  add(`\\"category\\":\\"${tpl.category}\\"`, `\\"category\\":\\"${cfg.categoria.clave}\\"`);
  add(cfg.categoria.etiquetaPlantilla, cfg.categoria.etiqueta);
}
for (const [a, b] of cfg.extra || []) add(a, b);
add(tpl.story, '@@HISTORIA@@');
add(tplDesc, '@@DESCRIPCION@@');
tpl.materials.forEach((m, i) => add(m, `@@MAT${i}@@`));
add(tpl.color, cfg.color);
tpl.materials.forEach((m, i) => { if (m !== cfg.materiales[i]) pairs.push([`@@MAT${i}@@`, cfg.materiales[i]]); else pairs.push([`@@MAT${i}@@`, m]); });
if (cfg.craftNote) add(tpl.craftNote, cfg.craftNote);
add(`para ${articulo(tplOwner)}${tplOwner}`, `para ${articulo(cfg.propietario)}${cfg.propietario}`);
add(tplOwner, '@@OWNER@@');
add(tplSaludo, cfg.saludo);
pairs.push(['@@OWNER@@', cfg.propietario]);
add(`GARA-${tpl.name.replace(/ /g, '-')}-`, `GARA-${cfg.nombre.replace(/ /g, '-')}-`);
add(`${encodeURIComponent(tpl.name)}%20(`, `${encodeURIComponent(cfg.nombre)}%20(`);
add(tpl.name, cfg.nombre);
add(tpl.name.toUpperCase(), cfg.nombre.toUpperCase());
add(tpl.slug, cfg.slug);
add(tplFecha, cfg.fecha);
if (cfg.accent) add(tpl.accent, cfg.accent);
if (cfg.swatch) add(`"swatch":"${tpl.swatch}","accent"`, `"swatch":"${cfg.swatch}","accent"`), add(`\\"swatch\\":\\"${tpl.swatch}\\",\\"accent\\"`, `\\"swatch\\":\\"${cfg.swatch}\\",\\"accent\\"`);
add(tplCode, code);
add(tplCode.toLowerCase(), code.toLowerCase());
add(tplNum, num);
// Los textos nuevos entran al final para que ningún reemplazo posterior los toque (p. ej. si mencionan otra pieza).
pairs.push(['@@HISTORIA@@', cfg.historia], ['@@DESCRIPCION@@', cfg.descripcion]);
const tr = (s) => pairs.reduce((acc, [a, b]) => acc.split(a).join(b), s);

// Restos que no deben quedar en los archivos nuevos
const prohibidos = [tplOwner, tpl.name, tpl.slug, tplNum, tpl.story.slice(0, 40)].filter(
  (x) => !cfg.nombre.includes(x) && !cfg.propietario.includes(x) && !cfg.historia.includes(x) && !cfg.descripcion.includes(x)
);
function revisar(t, donde) {
  for (const p of prohibidos) if (t.includes(p)) fail(`Quedó "${p}" de la plantilla en ${donde}`);
}

// ---------- 3. Páginas de verificación (con QR nuevo) ----------
async function paginasVerify() {
  const Q = require('qrcode');
  const opt = { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#171412', light: '#0000' } };
  const dpath = (s) => s.match(/<path stroke="#171412" d="([^"]+)"/)[1];
  const variantes = [
    [tplSerial, serial],
    [`${tplSerial}-nfc`, `${serial}-nfc`],
    [tplCode.toLowerCase(), code.toLowerCase()],
    [`${tplCode.toLowerCase()}-nfc`, `${code.toLowerCase()}-nfc`],
  ];
  for (const [src, dst] of variantes) {
    const base = src.replace(/-nfc$/, '');
    const nbase = dst.replace(/-nfc$/, '');
    const oldQ = await Q.toString(`https://garaleathergoods.mx/verify/${base}/`, opt);
    const newQ = await Q.toString(`https://garaleathergoods.mx/verify/${nbase}/`, opt);
    if (oldQ.slice(0, 90) !== newQ.slice(0, 90)) fail('El QR nuevo cambió de tamaño; revisar a mano');
    const oT = `:T${Buffer.byteLength(oldQ).toString(16)},`;
    const nT = `:T${Buffer.byteLength(newQ).toString(16)},`;
    fs.mkdirSync(S('verify', dst), { recursive: true });
    for (const f of fs.readdirSync(S('verify', src))) {
      let t = read(S('verify', src, f));
      t = t.split(dpath(oldQ)).join(dpath(newQ)).split(oT).join(nT);
      t = tr(t);
      revisar(t, `verify/${dst}/${f}`);
      write(S('verify', dst, f), t);
    }
  }
  ok('Páginas de verificación (4) con QR nuevo');
}

// ---------- 4. Ficha de producto ----------
function ficha() {
  const src = S('productos', tpl.slug), dst = S('productos', cfg.slug);
  fs.mkdirSync(dst, { recursive: true });
  for (const f of fs.readdirSync(src)) {
    const t = tr(read(path.join(src, f)));
    revisar(t, `productos/${cfg.slug}/${f}`);
    write(path.join(dst, f), t);
  }
  ok(`Ficha productos/${cfg.slug}/`);
}

// ---------- 5. Catálogo (/productos/) ----------
function divBalanceado(h, start) {
  let d = 0;
  const re = /<div\b|<\/div>/g;
  re.lastIndex = start;
  let m;
  while ((m = re.exec(h))) { d += m[0] === '<div' ? 1 : -1; if (d === 0) return m.index + m[0].length; }
  fail('HTML sin cerrar');
}
function catalogo() {
  const dir = S('productos');
  const ultimo = productos[productos.length - 1].slug;
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.txt'))) {
    let t = read(path.join(dir, f));
    const lines = t.split('\n');
    const id = (l) => l.slice(0, l.indexOf(':'));
    const lt = lines.find((l) => new RegExp(`^[0-9a-f]+:\\["\\$","\\$L[0-9a-f]+","${tpl.slug}"`).test(l));
    if (!lt) continue;
    const iu = lines.findIndex((l) => new RegExp(`^[0-9a-f]+:\\["\\$","\\$L[0-9a-f]+","${ultimo}"`).test(l));
    const usados = lines.map(id).filter((x) => /^[0-9a-f]+$/.test(x)).map((x) => parseInt(x, 16));
    const nid = (Math.max(...usados) + 1).toString(16);
    lines.splice(iu + 1, 0, nid + tr(lt.slice(id(lt).length)));
    t = lines.join('\n');
    const ref = `"$L${id(lines[iu])}"]`;
    if (t.split(ref).length !== 2) fail(`Lista del catálogo ambigua en ${f}`);
    write(path.join(dir, f), t.replace(ref, `"$L${id(lines[iu])}","$L${nid}"]`));
    if (f === 'index.txt') catalogo.nid = nid, catalogo.uid = id(lines[iu]), catalogo.tid = id(lt);
  }
  let h = read(S('productos', 'index.html'));
  const tarjeta = (slug) => { const i = h.indexOf(`href="/productos/${slug}/"`); const s = h.lastIndexOf('<div class="tilt-stage">', i); return [s, divBalanceado(h, s)]; };
  const [a0, a1] = tarjeta(tpl.slug);
  const [, z1] = tarjeta(ultimo);
  h = h.slice(0, z1) + tr(h.slice(a0, a1)) + h.slice(z1);
  const esc = (x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const push = (n, slug) => h.match(new RegExp(`<script>self\\.__next_f\\.push\\(\\[1,"${n}:\\[\\\\"\\$\\\\",\\\\"\\$L[0-9a-f]+\\\\",\\\\"${esc(slug)}\\\\".*?</script>`, 's'));
  const pt = push(catalogo.tid, tpl.slug), pu = push(catalogo.uid, ultimo);
  if (!pt || !pu) fail('No encontré los scripts del catálogo en productos/index.html');
  const nuevo = tr(pt[0]).replace(`push([1,"${catalogo.tid}:`, `push([1,"${catalogo.nid}:`);
  const fin = pu.index + pu[0].length;
  h = h.slice(0, fin) + nuevo + h.slice(fin);
  const ref = `\\"$L${catalogo.uid}\\"]`;
  if (h.split(ref).length !== 2) fail('Lista del catálogo ambigua en index.html');
  write(S('productos', 'index.html'), h.replace(ref, `\\"$L${catalogo.uid}\\",\\"$L${catalogo.nid}\\"]`));
  ok('Tarjeta en el catálogo');
}

// ---------- 6. Inicio ----------
function inicio() {
  const ultimo = productos[productos.length - 1].slug;
  const sig = productos[productos.indexOf(tpl) + 1];
  const insertar = (t, q) => {
    const a = t.indexOf(`{${q}id${q}:${q}${tpl.slug}${q}`);
    const b = sig ? t.indexOf(`,{${q}id${q}:${q}${sig.slug}${q}`, a) : t.indexOf(']}]', a);
    const z = t.indexOf(`{${q}id${q}:${q}${ultimo}${q}`);
    const e = t.indexOf(']}]', z);
    if (a < 0 || b < 0 || z < 0 || e < 0) fail('No encontré la lista de productos del inicio');
    return t.slice(0, e) + ',' + tr(t.slice(a, b)) + t.slice(e);
  };
  for (const f of ['index.txt', '__next._full.txt', '__next.__page__.txt']) write(S(f), insertar(read(S(f)), '"'));
  let h = insertar(read(S('index.html')), '\\"');
  const panel = (slug) => { const i = h.indexOf(`src="/productos/${slug}-01.webp"`); const s = h.lastIndexOf('<article', i); return [s, h.indexOf('</article>', i) + 10]; };
  const [a0, a1] = panel(tpl.slug);
  const [, z1] = panel(ultimo);
  const nModelo = String(productos.length + 1).padStart(2, '0');
  const art = tr(h.slice(a0, a1)).replace(/Modelo <!-- -->\d+/, `Modelo <!-- -->${nModelo}`);
  write(S('index.html'), h.slice(0, z1) + art + h.slice(z1));
  ok(`Panel en el inicio (modelo ${nModelo})`);
}

// ---------- 7. Sitemap ----------
function sitemap() {
  let t = read(S('sitemap.xml'));
  if (t.includes(`/productos/${cfg.slug}/`)) return;
  const blk = t.slice(t.lastIndexOf('<url>'), t.lastIndexOf('</url>') + 6);
  const nuevo = blk.replace(/<loc>.*?<\/loc>/, `<loc>https://garaleathergoods.mx/productos/${cfg.slug}/</loc>`).replace(/<lastmod>.*?<\/lastmod>/, `<lastmod>${new Date().toISOString()}</lastmod>`);
  write(S('sitemap.xml'), t.replace('</urlset>', nuevo + '\n</urlset>'));
  ok('Sitemap');
}

// ---------- 8. Archivos: fotos, recorte, certificado ----------
async function archivos() {
  const sharp = require('sharp');
  const rel = (p) => path.resolve(cfgDir, p);
  (cfg.fotos || []).forEach((f, i) => { if (!fs.existsSync(rel(f))) fail(`No existe la foto ${f}`); });
  for (let i = 0; i < (cfg.fotos || []).length; i++)
    await sharp(rel(cfg.fotos[i])).rotate().resize(1086, 1448, { fit: 'cover' }).webp({ quality: 86 }).toFile(S('productos', `${cfg.slug}-0${i + 1}.webp`));
  if (cfg.recorte) {
    const pad = Object.assign({ arriba: 0.2, izquierda: 0.06, derecha: 0.06 }, cfg.margenRecorte || {});
    const buf = await sharp(rel(cfg.recorte)).ensureAlpha().trim().png().toBuffer();
    const m = await sharp(buf).metadata();
    await sharp(buf).extend({ top: Math.round(m.height * pad.arriba), left: Math.round(m.width * pad.izquierda), right: Math.round(m.width * pad.derecha), bottom: 0, background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality: 88, alphaQuality: 90 }).toFile(S('productos', `${cfg.slug}-recorte.webp`));
  }
  if (cfg.certificado) {
    fs.copyFileSync(rel(cfg.certificado), S('certificates', `${serial}.pdf`));
    fs.copyFileSync(rel(cfg.certificado), S('certificates', `${code.toLowerCase()}.pdf`));
  }
  ok('Fotos, recorte y certificado');
}

// ---------- 9. Imagen para compartir + vista previa (og) ----------
function servidor() {
  const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.txt': 'text/plain', '.json': 'application/json', '.mp3': 'audio/mpeg' };
  return new Promise((res) => {
    const srv = http.createServer((q, r) => {
      let p = decodeURIComponent(q.url.split('?')[0]);
      let f = S(p);
      if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
      if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); }
      r.writeHead(200, { 'content-type': tipos[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(r);
    }).listen(0, () => res(srv));
  });
}
async function compartir() {
  let chromium;
  try { ({ chromium } = require('playwright')); } catch { fail('Falta playwright para las imágenes de compartir (o usa --sin-imagenes)'); }
  const sharp = require('sharp');
  const srv = await servidor();
  const base = `http://localhost:${srv.address().port}`;
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 2 });
  await p.goto(`${base}/verify/${serial}/`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(6000);
  await p.evaluate(({ serial, owner, label }) => {
    const card = document.querySelector('.owner-flip').cloneNode(true);
    card.querySelectorAll('.owner-back').forEach((e) => e.remove());
    card.style.cssText = 'width:340px;transform:scale(1.9) rotate(-1.5deg);transform-origin:center center;';
    document.body.innerHTML = '';
    document.body.style.cssText = 'margin:0;background:#050403;overflow:hidden';
    const s = document.createElement('div');
    s.style.cssText = 'position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(ellipse 70% 45% at 50% 46%,#2a2012 0%,#120d08 45%,#050403 80%);display:flex;flex-direction:column;align-items:center;';
    s.innerHTML = `<div style="position:absolute;inset:0;background:repeating-radial-gradient(circle at 50% 46%,rgba(200,161,78,.035) 0 2px,transparent 2px 46px)"></div>
 <img src="/brand/gara-lockup-official.png" style="position:relative;margin-top:128px;width:380px">
 <p class="font-data" style="position:relative;margin-top:44px;color:#d9b45f;font-size:22px;letter-spacing:.32em;text-transform:uppercase">Pieza auténtica · Atelier Registry</p>
 <div id="slot" style="position:relative;margin-top:300px;width:340px;height:476px;filter:drop-shadow(0 40px 60px rgba(0,0,0,.8))"></div>
 <p class="font-data" style="position:relative;margin-top:330px;color:#a49a88;font-size:19px;letter-spacing:.34em;text-transform:uppercase">${label}</p>
 <p class="font-display" style="position:relative;margin-top:14px;color:#efe6d4;font-size:58px;line-height:1.1">${owner}</p>
 <p class="font-display" style="position:relative;margin-top:14px;color:#d9b45f;font-size:30px;font-style:italic">Hecha a mano en México</p>
 <div class="font-data" style="position:relative;margin-top:44px;padding:18px 36px;border:1px solid rgba(200,161,78,.4);border-radius:999px;color:#efe6d4;font-size:24px;letter-spacing:.06em;background:rgba(0,0,0,.35)">garaleathergoods.mx/verify/${serial}</div>`;
    document.body.appendChild(s);
    s.querySelector('#slot').appendChild(card);
  }, { serial, owner: cfg.disponible ? 'Busca a su primer dueño' : cfg.propietario, label: cfg.disponible ? 'Ejemplar único' : 'Propietario' });
  await p.waitForTimeout(1500);
  const share = S('share', `${code.toLowerCase()}.jpg`);
  await p.screenshot({ path: share, type: 'jpeg', quality: 86, clip: { x: 0, y: 0, width: 1080, height: 1920 } });
  await b.close();
  srv.close();

  const W = 1200, H = 630;
  const bg = await sharp(S('leathers/lth-011-cafe-pullup-marcado.webp')).resize(W, H, { fit: 'cover' }).modulate({ brightness: 0.34 }).toBuffer();
  const vig = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="v" cx="50%" cy="50%" r="70%"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#v)"/><rect x="28" y="28" width="${W - 56}" height="${H - 56}" fill="none" stroke="#c8a14e" stroke-opacity=".55" stroke-width="2"/></svg>`);
  const lockup = await sharp(S('brand/gara-lockup-official.png')).resize({ width: 460 }).toBuffer();
  const lm = await sharp(lockup).metadata();
  const m = await sharp(share).metadata();
  const card = await sharp(share).extract({ left: Math.round(m.width * 0.08), top: Math.round(m.height * 0.225), width: Math.round(m.width * 0.84), height: Math.round(m.height * 0.53) }).resize({ height: 560 }).toBuffer();
  const cm = await sharp(card).metadata();
  const fe = 10;
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cm.width}" height="${cm.height}"><defs><filter id="b"><feGaussianBlur stdDeviation="5"/></filter></defs><rect x="${fe}" y="${fe}" width="${cm.width - 2 * fe}" height="${cm.height - 2 * fe}" rx="30" fill="#fff" filter="url(#b)"/></svg>`);
  const cardA = await sharp(card).ensureAlpha().composite([{ input: await sharp(mask).resize(cm.width, cm.height).png().toBuffer(), blend: 'dest-in' }]).png().toBuffer();
  fs.mkdirSync(S('share', 'og'), { recursive: true });
  await sharp(bg).composite([{ input: vig }, { input: lockup, left: 90, top: Math.round((H - lm.height) / 2) }, { input: cardA, left: W - cm.width - 80, top: Math.round((H - cm.height) / 2) }])
    .jpeg({ quality: 84, mozjpeg: true }).toFile(S('share', 'og', `${code.toLowerCase()}.jpg`));
  ok('Imagen para compartir y vista previa de links');
}

(async () => {
  console.log(`Plantilla: ${tpl.name} (${tplCode}, ${tplOwner}) → ${cfg.nombre} (${code}, ${cfg.propietario})`);
  await archivos();
  await paginasVerify();
  ficha();
  catalogo();
  inicio();
  sitemap();
  require('child_process').execFileSync('python3', [path.join(__dirname, 'cuidado-ics.py'), sitio], { stdio: 'ignore' });
  ok('Recordatorio de cuidado (nfc/cuidado/' + code.toLowerCase() + '.ics)');
  if (!sinImagenes) await compartir();
  console.log(`\nListo. NFC: https://garaleathergoods.mx/verify/${serial}-nfc`);
})().catch((e) => fail(e.stack || e));
