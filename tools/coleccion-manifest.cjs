#!/usr/bin/env node
/* Genera nfc/coleccion.json (lo lee la colección y las fichas) a partir de los datos reales del sitio:
 * productos del inicio (index.txt) + roles de foto (tools/fotos-roles.json) + origen de la historia (nfc/pieza/<codigo>.json).
 * Uso: node tools/coleccion-manifest.cjs /ruta/a/house-of-gara   -> escribe nfc/coleccion.json y avisa de tomas faltantes. */
const fs = require('fs'), path = require('path');
const sitio = path.resolve(process.argv[2] || '.');
const S = (...p) => path.join(sitio, ...p);
const linea = fs.readFileSync(S('index.txt'), 'utf8').split('\n').find((l) => l.includes('{"products":['));
const P = JSON.parse(linea.slice(linea.indexOf(':') + 1))[3].products;
const roles = JSON.parse(fs.readFileSync(path.join(__dirname, 'fotos-roles.json'), 'utf8')).roles;
const ORDEN = ['portada', 'interior', 'reverso', 'detalle', 'en-mano', 'alterna'];
const tipoDe = (p) => /neceser/i.test(p.subtitle + ' ' + p.name) ? 'neceser' : /estuche/i.test(p.subtitle + ' ' + p.name) ? 'estuche' : p.category;
const primera = (t) => (t.match(/^.{40,170}?[.!?](?=\s|$)/) || [t.slice(0, 150)])[0];
let sharp; try { sharp = require('sharp'); } catch { sharp = null; }
(async () => {
  const out = [], faltan = [], sinRol = [];
  for (const p of P) {
    const srcs = [...new Set([...(p.gallery || []), p.image].filter(Boolean))].filter((x) => !/recorte/.test(x));
    const fotos = [];
    for (const src of srcs) {
      const k = path.basename(src).replace(/\.webp$/, '');
      if (!roles[k]) sinRol.push(k);
      let ar = 1;
      if (sharp && fs.existsSync(S(src))) { const m = await sharp(S(src)).metadata(); ar = +(m.width / m.height).toFixed(3); }
      fotos.push({ src, rol: roles[k] || 'alterna', ar });
    }
    fotos.sort((a, b) => ORDEN.indexOf(a.rol) - ORDEN.indexOf(b.rol));
    const cod = ((p.description || '').match(/(GA-[A-Z]+-\d+-\d{6})/) || [])[1];
    let origen = null;
    if (cod && fs.existsSync(S('nfc', 'pieza', cod.toLowerCase() + '.json'))) origen = JSON.parse(fs.readFileSync(S('nfc', 'pieza', cod.toLowerCase() + '.json'), 'utf8')).origen?.nombre || null;
    const tiene = new Set(fotos.map((f) => f.rol));
    const falta = ['interior', 'reverso', 'detalle'].filter((r) => !tiene.has(r));
    if (falta.length) faltan.push([p.slug, falta]);
    out.push({
      slug: p.slug, nombre: p.name, tipo: tipoDe(p), categoria: p.category, subtitulo: p.subtitle,
      precio: p.priceLabel || 'Precio por confirmar', disp: p.availability, config: !!p.configurable,
      acento: p.accent, tono: p.swatch, codigo: cod || null, origen, resumen: primera(p.story || ''), fotos,
    });
  }
  fs.writeFileSync(S('nfc', 'coleccion.json'), JSON.stringify({ piezas: out }));
  console.log('nfc/coleccion.json:', out.length, 'piezas');
  if (sinRol.length) console.log('SIN ROL (agrégalas a tools/fotos-roles.json):', sinRol.join(', '));
  console.log('Tomas que faltan (interior / reverso / detalle):\n' + faltan.map(([s, f]) => '  ' + s.padEnd(38) + f.join(', ')).join('\n'));
})();
