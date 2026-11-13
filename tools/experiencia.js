/*
 * GARA — experiencia NFC (mejora las páginas /verify/* sin tocar el build de Next.js)
 *  1. Giroscopio: en iPhone, el primer toque en la página activa "Moverla con el celular".
 *  2. Apertura personalizada: la primera vez que se abre la página de una pieza (NFC o QR).
 *     Para verla otra vez: agregar ?bienvenida al link.
 *  3. Recordatorio de cuidado: botón que agrega avisos al calendario (/nfc/cuidado/<codigo>.ics).
 */
(function () {
  'use strict';
  if (window.__garaExperiencia) return;
  window.__garaExperiencia = true;

  var esNFC = /-nfc\/?$/.test(location.pathname);
  var reducido = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- datos de la pieza (del título y del texto de la página) ----------
  function datos() {
    var m = document.title.match(/^(.*?) · (GA-[A-Z]+-\d+-\d{6})/);
    var texto = document.body ? document.body.textContent.replace(/\s+/g, ' ') : '';
    var hola = texto.match(/Hola,\s*(.{1,60}?)\.\s*Esta pieza (es|puede ser) tuya/);
    return {
      nombre: m ? m[1] : 'tu pieza',
      codigo: m ? m[2] : '',
      saludo: hola ? hola[1].trim() : '',
      disponible: hola ? hola[2] === 'puede ser' : false,
      numero: m ? m[2].slice(-6) : ''
    };
  }

  // ---------- 1. giroscopio automático en iPhone ----------
  function botonMovimiento() {
    var bs = document.querySelectorAll('button');
    for (var i = 0; i < bs.length; i++) if (/Moverla con el celular/i.test(bs[i].textContent)) return bs[i];
    return null;
  }
  function activarMovimiento(ev) {
    // iPhone: el permiso para "agitar" se pide en cualquier toque, exista o no el botón de la tarjeta.
    try { if (window.DeviceMotionEvent && typeof DeviceMotionEvent.requestPermission === 'function') DeviceMotionEvent.requestPermission().catch(function () {}); } catch (e) {}
    var b = botonMovimiento();
    if (!b) return;
    if (ev && ev.target && b.contains(ev.target)) return; // ya lo tocó directo
    try { b.click(); } catch (e) {}
  }
  function escucharPrimerToque() {
    var una = function (ev) {
      document.removeEventListener('touchend', una, true);
      document.removeEventListener('click', una, true);
      activarMovimiento(ev);
    };
    document.addEventListener('touchend', una, true);
    document.addEventListener('click', una, true);
  }

  // ---------- 2. apertura personalizada ----------
  var CSS = '' +
    '.gx-open{position:fixed;inset:0;z-index:2147483000;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;padding:24px;text-align:center;' +
    'background:radial-gradient(60% 45% at 50% 42%,#2a1f12 0%,#0d0a07 55%,#050403 100%);color:#efe6d4;opacity:0;transition:opacity .6s ease}' +
    '.gx-open.gx-in{opacity:1}.gx-open.gx-out{opacity:0;transition:opacity .7s ease}' +
    '.gx-ring{position:relative;width:132px;height:132px;display:flex;align-items:center;justify-content:center}' +
    '.gx-ring:before{content:"";position:absolute;inset:-26px;border-radius:50%;background:radial-gradient(circle,#ecc87855 0%,#ecc87800 65%);animation:gx-pulse 2.6s ease-in-out infinite}' +
    '.gx-ring:after{content:"";position:absolute;inset:-6px;border-radius:50%;border:1px solid #c8a14e66;transform:scale(.6);opacity:0;animation:gx-wave 2.6s ease-out .9s infinite}' +
    '.gx-flor{width:100%;height:auto;opacity:0;transform:scale(.55) rotate(-60deg);filter:drop-shadow(0 0 18px #ecc87866);animation:gx-bloom 1.6s cubic-bezier(.2,.8,.2,1) .25s forwards}' +
    '.gx-num{margin-top:34px;font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#d9b45f;opacity:0;animation:gx-up .9s ease 1.2s forwards}' +
    '.gx-hola{margin-top:14px;font-size:34px;line-height:1.1;opacity:0;animation:gx-up 1s ease 1.6s forwards}' +
    '.gx-msg{margin-top:8px;font-size:21px;font-style:italic;color:#d9c9a6;max-width:320px;opacity:0;animation:gx-up 1s ease 2.1s forwards}' +
    '.gx-btn{margin-top:38px;border:1px solid #c8a14e88;border-radius:999px;padding:12px 26px;background:#0000;color:#ecc878;font-size:10px;letter-spacing:.26em;text-transform:uppercase;opacity:0;animation:gx-up .8s ease 2.8s forwards;cursor:pointer}' +
    '.gx-skip{position:absolute;bottom:22px;font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#a49a8880}' +
    '.gx-cuidado{margin-top:16px;display:inline-flex;align-items:center;gap:10px;border:1px solid #c8a14e66;border-radius:999px;padding:11px 18px;color:#ecc878;font-size:10px;letter-spacing:.2em;text-transform:uppercase;text-decoration:none;transition:border-color .3s,background .3s}' +
    '.gx-aviso{margin-top:14px;display:flex;gap:10px;align-items:flex-start;border:1px solid #c8a14e40;border-radius:14px;padding:12px 14px;background:#0a0806;color:#a49a88;font-size:12px;line-height:1.5}' +
    '.gx-aviso svg{flex:none;color:#ecc878;margin-top:1px}.gx-aviso strong{color:#ecc878;font-weight:500}.gx-aviso p{margin:0}' +
    '.gx-cuidado:hover{border-color:#ecc878;background:#ecc87812}' +
    '@keyframes gx-bloom{60%{opacity:1;transform:scale(1.06) rotate(6deg)}100%{opacity:1;transform:scale(1) rotate(0)}}' +
    '@keyframes gx-up{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}' +
    '@keyframes gx-pulse{0%,100%{opacity:.55;transform:scale(.92)}50%{opacity:1;transform:scale(1.08)}}' +
    '@keyframes gx-wave{0%{transform:scale(.6);opacity:.9}100%{transform:scale(1.9);opacity:0}}' +
    '@media (prefers-reduced-motion: reduce){.gx-flor,.gx-num,.gx-hola,.gx-msg,.gx-btn{animation:none;opacity:1;transform:none}.gx-ring:before,.gx-ring:after{animation:none}}';

  function estilos() {
    if (document.getElementById('gx-css')) return;
    var s = document.createElement('style');
    s.id = 'gx-css'; s.textContent = CSS;
    document.head.appendChild(s);
  }

  function vista(clave) { try { return localStorage.getItem(clave) === '1'; } catch (e) { return false; } }
  function marcar(clave) { try { localStorage.setItem(clave, '1'); } catch (e) {} }

  function introTerminada() {
    var sello = document.querySelector('.nfc-verify-seal');
    if (!sello) return true;
    var cont = sello.closest('[class*="fixed"]') || sello.parentElement;
    if (!cont || !document.body.contains(cont)) return true;
    var st = getComputedStyle(cont);
    return st.display === 'none' || st.visibility === 'hidden' || parseFloat(st.opacity) < 0.05;
  }


  // ---------- 8. duelo de piezas: tu pieza saluda a la de otro dueño ----------
  function leerVisitas() { try { return JSON.parse(localStorage.getItem('gara-visitas') || '{}') || {}; } catch (e) { return {}; } }
  function registrarVisita(d) {
    if (!d.codigo) return;
    var v = leerVisitas(), img = document.querySelector('.owner-pop img');
    var r = v[d.codigo] || { n: 0 };
    r.n += 1; r.nombre = d.nombre; r.numero = d.numero; if (img) r.img = img.getAttribute('src');
    v[d.codigo] = r;
    try { localStorage.setItem('gara-visitas', JSON.stringify(v)); } catch (e) {}
  }
  // "Mi pieza" = la que más veces he abierto en este celular (mínimo 2) y que no es la que estoy viendo.
  function miPieza(d) {
    var v = leerVisitas(), yo = v[d.codigo] ? v[d.codigo].n : 0, mejor = null;
    for (var c in v) if (c !== d.codigo && v[c].n >= 2 && v[c].n > yo && (!mejor || v[c].n > mejor.n)) mejor = v[c];
    return mejor;
  }
  var CSS_DUELO = '' +
    '.gd{position:fixed;inset:0;z-index:2147483001;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;overflow:hidden;' +
    'background:radial-gradient(60% 45% at 50% 42%,#2a1f12 0%,#0d0a07 58%,#050403 100%);color:#efe6d4;opacity:0;transition:opacity .6s}' +
    '.gd.gx-in{opacity:1}.gd.gx-out{opacity:0;transition:opacity .7s}' +
    '.gd-top{font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#d9b45f}' +
    '.gd-ring{position:relative;margin-top:26px;width:min(86vw,340px);height:190px}' +
    '.gd-ring img{position:absolute;top:0;width:46%;height:100%;object-fit:contain;object-position:bottom;filter:drop-shadow(0 16px 18px #000c)}' +
    '.gd-a{left:0;animation:gd-izq 1.2s cubic-bezier(.2,.8,.2,1) .3s both}.gd-b{right:0;animation:gd-der 1.2s cubic-bezier(.2,.8,.2,1) .3s both}' +
    '.gd-x{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px;background:url(/brand/gara-flower-official.png) center/contain no-repeat;opacity:0;animation:gd-flor 1s ease 1.3s forwards;filter:drop-shadow(0 0 14px #ecc878aa)}' +
    '.gd-t{margin-top:26px;font-size:25px;line-height:1.2;max-width:330px;opacity:0;animation:gx-up 1s ease 1.5s forwards}' +
    '.gd-s{margin-top:10px;font-size:17px;font-style:italic;color:#d9c9a6;max-width:320px;opacity:0;animation:gx-up 1s ease 1.9s forwards}' +
    '.gd-n{margin-top:14px;font-size:9px;letter-spacing:.26em;text-transform:uppercase;color:#a49a88;opacity:0;animation:gx-up 1s ease 2.2s forwards}' +
    '@keyframes gd-izq{from{transform:translateX(-120%) rotate(-14deg);opacity:0}to{transform:translateX(6%) rotate(-5deg);opacity:1}}' +
    '@keyframes gd-der{from{transform:translateX(120%) rotate(14deg);opacity:0}to{transform:translateX(-6%) rotate(5deg);opacity:1}}' +
    '@keyframes gd-flor{0%{opacity:0;transform:scale(.2) rotate(-90deg)}60%{opacity:1;transform:scale(1.25) rotate(10deg)}100%{opacity:1;transform:scale(1) rotate(0)}}';
  var SALUDOS = ['Dos piezas del Archivo GARA acaban de conocerse.', 'Hechas por las mismas manos, llevadas por caminos distintos.', 'Ninguna se repite. Hoy se encontraron.', 'Se reconocen: las dos nacieron en el mismo taller.'];

  function duelo(d, mia) {
    estilos();
    if (!document.getElementById('gd-css')) { var st = document.createElement('style'); st.id = 'gd-css'; st.textContent = CSS_DUELO; document.head.appendChild(st); }
    var aqui = document.querySelector('.owner-pop img');
    var o = document.createElement('div');
    o.className = 'gd'; o.setAttribute('role', 'dialog'); o.setAttribute('aria-label', 'Encuentro de piezas GARA');
    o.innerHTML = '<p class="gd-top font-data">Encuentro de piezas</p>' +
      '<div class="gd-ring">' + (mia.img ? '<img class="gd-a" alt="">' : '') + (aqui ? '<img class="gd-b" alt="">' : '') + '<span class="gd-x"></span></div>' +
      '<p class="gd-t font-display"></p><p class="gd-s font-display"></p><p class="gd-n font-data"></p>' +
      '<button type="button" class="gx-btn font-data">Conocer a ' + '</button>';
    if (mia.img) o.querySelector('.gd-a').src = mia.img;
    if (aqui) o.querySelector('.gd-b').src = aqui.getAttribute('src');
    o.querySelector('.gd-t').textContent = mia.nombre + ' saluda a ' + d.nombre;
    o.querySelector('.gd-s').textContent = SALUDOS[Math.floor(Math.random() * SALUDOS.length)];
    o.querySelector('.gd-n').textContent = 'N.º ' + mia.numero + ' × N.º ' + d.numero;
    o.querySelector('.gx-btn').textContent = 'Conocer a ' + d.nombre;
    document.body.appendChild(o);
    requestAnimationFrame(function () { o.classList.add('gx-in'); });
    setTimeout(function () { petalos(22); if (navigator.vibrate && !reducido) { try { navigator.vibrate([20, 60, 20, 60, 40]); } catch (e) {} } }, 1400);
    o.querySelector('.gx-btn').addEventListener('click', function (ev) {
      activarMovimiento(ev);
      o.classList.add('gx-out');
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 750);
    });
  }

  // Modo taller (celular de GARA): abrir cualquier página con ?taller=1 una vez. Desde entonces ese celular
  // siempre ve la bienvenida o el sobre como si fuera la primera vez, y nunca el encuentro de piezas. ?taller=0 lo apaga.
  function modoTaller() {
    var m = location.search.match(/[?&]taller=([01])/);
    try {
      if (m) { if (m[1] === '1') localStorage.setItem('gara-taller', '1'); else localStorage.removeItem('gara-taller'); }
      return localStorage.getItem('gara-taller') === '1';
    } catch (e) { return false; }
  }

  var cartaRegalo = null; // para volver a abrir el sobre desde la página
  function apertura() {
    var d = datos();
    var clave = 'gara-apertura-' + (d.codigo || location.pathname);
    var taller = modoTaller();
    var forzar = taller || /[?&]bienvenida\b/.test(location.search);
    if (!d.codigo) return;
    var esperado = 0;
    (function esperar() {
      if (!introTerminada() && esperado < 5000) { esperado += 200; return setTimeout(esperar, 200); }
      fetch('/nfc/regalo/' + d.codigo.toLowerCase() + '.json').then(function (r) { return r.ok ? r.json() : null; }, function () { return null; }).then(function (cfg) {
        var esRegalo = !!(cfg && cfg.mensaje), primera = !vista(clave) || forzar;
        if (esRegalo) cartaRegalo = function () { regalo(d, clave, cfg); };
        // 1.º el sobre de regalo: la primera vez en este celular siempre gana.
        if (esRegalo && primera) return regalo(d, clave, cfg);
        // 2.º encuentro de piezas: este celular ya es "de" otra pieza. Una vez al día por pareja.
        var mia = taller ? null : miPieza(d);
        if (mia) {
          var cd = 'gara-duelo-' + mia.numero + '-' + d.numero + '-' + new Date().toISOString().slice(0, 10);
          if (vista(cd)) return;
          marcar(cd);
          return duelo(d, mia);
        }
        // 3.º bienvenida normal, la primera vez.
        if (primera) mostrar(d, clave);
      });
    })();
  }


  // ---------- 6. modo regalo: sobre con sello de cera antes de ver la pieza ----------
  var CSS_REGALO = '' +
    '.gr-wrap{position:fixed;inset:0;z-index:2147483001;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center;' +
    'background:radial-gradient(60% 45% at 50% 45%,#2a1f12 0%,#0d0a07 58%,#050403 100%);color:#efe6d4;opacity:0;transition:opacity .6s}' +
    '.gr-wrap.gx-in{opacity:1}.gr-wrap.gx-out{opacity:0;transition:opacity .8s}' +
    '.gr-top{font-size:10px;letter-spacing:.32em;text-transform:uppercase;color:#d9b45f;opacity:0;animation:gx-up .9s ease .3s forwards}' +
    '.gr-title{margin-top:10px;font-size:30px;line-height:1.15;opacity:0;animation:gx-up 1s ease .6s forwards}' +
    '.gr-env{position:relative;margin-top:34px;width:min(78vw,300px);aspect-ratio:3/2;perspective:900px;opacity:0;animation:gx-up 1s ease 1s forwards}' +
    '.gr-back,.gr-front{position:absolute;inset:0;border-radius:6px}' +
    '.gr-back{background:linear-gradient(160deg,#e9dcc0,#cdb88f);box-shadow:0 30px 60px -20px #000}' +
    '.gr-letter{position:absolute;left:6%;right:6%;top:8%;height:84%;border-radius:4px;background:#f6efe1;color:#2a2018;padding:16px 16px 12px;box-shadow:0 6px 18px #0004;' +
    'transform:translateY(0);transition:transform 1.1s cubic-bezier(.2,.8,.2,1) .55s;display:flex;flex-direction:column;justify-content:center;gap:8px;overflow:hidden}' +
    '.gr-letter p{margin:0}.gr-msg{font-size:17px;line-height:1.35;font-style:italic}.gr-from{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#8a6a2e}' +
    '.gr-front{background:linear-gradient(200deg,#e2d3b3,#c9b386);clip-path:polygon(0 0,50% 52%,100% 0,100% 100%,0 100%);z-index:2}' +
    '.gr-flap{position:absolute;left:0;right:0;top:0;height:60%;z-index:3;transform-origin:top;transition:transform .7s ease;' +
    'background:linear-gradient(180deg,#d8c59c,#c4ad7f);clip-path:polygon(0 0,100% 0,50% 100%);filter:drop-shadow(0 4px 4px #0003)}' +
    '.gr-seal{position:absolute;left:50%;top:60%;z-index:4;width:68px;height:68px;margin:-34px 0 0 -34px;border:0;border-radius:50%;cursor:pointer;' +
    'background:radial-gradient(circle at 35% 30%,#b8323a,#7a1018 70%);box-shadow:0 6px 14px #0007,inset 0 2px 4px #ffffff33,inset 0 -3px 6px #0006;display:flex;align-items:center;justify-content:center;' +
    'transition:transform .5s ease,opacity .5s ease;animation:gr-pulse 2.2s ease-in-out 2s infinite}' +
    '.gr-seal img{width:62%;filter:brightness(0) invert(1) sepia(1) saturate(2) hue-rotate(-20deg) brightness(.85) drop-shadow(0 1px 0 #0006);opacity:.85}' +
    '.gr-hint{margin-top:26px;font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#a49a88;opacity:0;animation:gx-up .8s ease 2s forwards}' +
    '.gr-open .gr-flap{transform:rotateX(180deg);z-index:1}.gr-open .gr-seal{transform:scale(.4) translateY(-40px);opacity:0;pointer-events:none;animation:none}' +
    '.gr-env{transition:margin-top .9s cubic-bezier(.2,.8,.2,1)}.gr-open .gr-env{margin-top:150px}.gr-open .gr-letter{transform:translateY(-62%);z-index:5;box-shadow:0 14px 30px #0006}' +
    '.gr-btn{margin-top:44px;border:1px solid #c8a14e88;border-radius:999px;padding:12px 26px;background:#0000;color:#ecc878;font-size:10px;letter-spacing:.26em;text-transform:uppercase;opacity:0;pointer-events:none;transition:opacity .8s ease 1.2s;cursor:pointer}' +
    '.gr-open .gr-btn{opacity:1;pointer-events:auto}.gr-open .gr-hint{display:none}' +
    '@keyframes gr-pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}' +
    '@media (prefers-reduced-motion: reduce){.gr-seal{animation:none}.gr-letter,.gr-flap{transition:none}}';

  function regalo(d, clave, cfg) {
    estilos();
    if (!document.getElementById('gr-css')) { var st = document.createElement('style'); st.id = 'gr-css'; st.textContent = CSS_REGALO; document.head.appendChild(st); }
    var o = document.createElement('div');
    o.className = 'gr-wrap';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', 'Tienes un regalo');
    o.innerHTML = '<p class="gr-top font-data"></p><p class="gr-title font-display"></p>' +
      '<div class="gr-env"><div class="gr-back"></div><div class="gr-letter"><p class="gr-msg font-display"></p><p class="gr-from font-data"></p></div>' +
      '<div class="gr-front"></div><div class="gr-flap"></div>' +
      '<button type="button" class="gr-seal" aria-label="Abrir el sobre"><img src="/brand/gara-flower-official.png" alt=""></button></div>' +
      '<p class="gr-hint font-data">Toca el sello para abrir</p>' +
      '<button type="button" class="gr-btn font-data">Ver mi regalo</button>';
    o.querySelector('.gr-top').textContent = d.nombre.toUpperCase() + ' · N.º ' + d.numero;
    o.querySelector('.gr-title').textContent = (d.saludo ? d.saludo + ', tienes' : 'Tienes') + ' un regalo';
    o.querySelector('.gr-msg').textContent = '“' + cfg.mensaje + '”';
    o.querySelector('.gr-from').textContent = cfg.de ? '— ' + cfg.de : '';
    document.body.appendChild(o);
    marcar(clave);
    requestAnimationFrame(function () { o.classList.add('gx-in'); });
    o.querySelector('.gr-seal').addEventListener('click', function (ev) {
      activarMovimiento(ev);
      if (navigator.vibrate && !reducido) { try { navigator.vibrate([25, 60, 40]); } catch (e) {} }
      o.classList.add('gr-open');
    });
    o.querySelector('.gr-btn').addEventListener('click', function (ev) {
      activarMovimiento(ev);
      if (reproductor && reproductor.alAbrir) { try { reproductor.audio.play().catch(function () {}); } catch (e) {} }
      o.classList.add('gx-out');
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 850);
    });
  }

  function mostrar(d, clave) {
    estilos();
    var o = document.createElement('div');
    o.className = 'gx-open';
    o.setAttribute('role', 'dialog');
    o.setAttribute('aria-label', 'Bienvenida GARA');
    var hola = d.disponible || !d.saludo ? 'Hola.' : d.saludo + ',';
    var msg = d.disponible ? d.nombre + ' espera a su primer dueño.' : 'esta pieza te estaba esperando.';
    o.innerHTML =
      '<div class="gx-ring"><img class="gx-flor" src="/brand/gara-flower-official.png" alt=""></div>' +
      '<p class="gx-num font-data">' + d.nombre.toUpperCase() + ' · N.º ' + d.numero + '</p>' +
      '<p class="gx-hola font-display"></p>' +
      '<p class="gx-msg font-display"></p>' +
      '<button type="button" class="gx-btn font-data">' + (d.disponible ? 'Conocer la pieza' : 'Ver mi pieza') + '</button>' +
      '<span class="gx-skip font-data">Toca para continuar</span>';
    o.querySelector('.gx-hola').textContent = hola;
    o.querySelector('.gx-msg').textContent = msg;
    document.body.appendChild(o);
    marcar(clave);
    requestAnimationFrame(function () { o.classList.add('gx-in'); });
    if (navigator.vibrate && !reducido) setTimeout(function () { try { navigator.vibrate([18, 80, 28]); } catch (e) {} }, 1300);
    var listo = false;
    setTimeout(function () { listo = true; }, 900);
    var cerrar = function (ev) {
      if (!listo) return;
      activarMovimiento(ev); // el toque que cierra también activa el giroscopio en iPhone
      if (reproductor && reproductor.alAbrir) { try { reproductor.audio.play().catch(function () {}); } catch (e) {} }
      o.classList.add('gx-out');
      setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 750);
      o.removeEventListener('click', cerrar);
    };
    o.addEventListener('click', cerrar);
  }

  // ---------- 3. recordatorio de cuidado ----------
  function cuidado() {
    var d = datos();
    if (!d.codigo || d.disponible) return;
    var titulo = null, ps = document.querySelectorAll('section > p');
    for (var i = 0; i < ps.length; i++) if (/^\s*Cuidados\s*$/i.test(ps[i].textContent)) { titulo = ps[i]; break; }
    if (!titulo || document.querySelector('.gx-cuidado')) return;
    var url = '/nfc/cuidado/' + d.codigo.toLowerCase() + '.ics';
    fetch(url, { method: 'HEAD' }).then(function (r) {
      if (!r.ok) return;
      estilos();
      var a = document.createElement('a');
      a.className = 'gx-cuidado font-data';
      a.href = url;
      a.setAttribute('download', 'GARA-cuidado-' + d.nombre.replace(/\s+/g, '-') + '.ics');
      a.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/><path d="M9.5 15.5l2 2 3.5-4" stroke-linecap="round" stroke-linejoin="round"/></svg>Recuérdame cuidar mi ' + d.nombre;
      // iOS abre el .ics directo en Calendario; el atributo download estorba ahí
      if (/iP(hone|ad|od)/.test(navigator.userAgent)) a.removeAttribute('download');
      var lista = titulo.nextElementSibling;
      (lista || titulo).insertAdjacentElement('afterend', a);
    }).catch(function () {});
  }


  // ---------- 4. mensaje o canción agregada (/mensajes/<codigo>.mp3 + /mensajes/<codigo>.json) ----------
  var reproductor = null;
  function mensaje() {
    var d = datos();
    if (!d.codigo || document.querySelector('.owner-message')) return Promise.resolve();
    var base = '/mensajes/' + d.codigo.toLowerCase();
    return fetch(base + '.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (cfg) {
      if (!cfg || document.querySelector('.gx-msg-box')) return;
      var ancla = null, ps = document.querySelectorAll('p');
      for (var i = 0; i < ps.length; i++) if (/Ejemplar único\s*$/.test(ps[i].textContent) && /max-w-md/.test(ps[i].className)) { ancla = ps[i]; break; }
      if (!ancla) return;
      var alturas = [35, 60, 90, 50, 75, 100, 65, 40, 80, 55, 95, 45, 70, 30, 60, 85, 50, 70, 40, 90, 60, 35];
      var barras = alturas.map(function (h, k) { return '<span class="owner-message-bar w-[3px] rounded-full bg-parchment/25" style="height:' + h + '%;animation-delay:' + (k % 6) * 0.11 + 's"></span>'; }).join('');
      var box = document.createElement('div');
      box.className = 'owner-message gx-msg-box mx-auto mt-8 max-w-[340px] rounded-2xl border border-brass/35 bg-ink/60 p-4 text-left';
      box.innerHTML = '<p class="font-data text-[9px] uppercase tracking-[0.22em] text-brass-bright"></p>' +
        '<p class="mt-1 text-[13px] text-parchment-dim"></p>' +
        '<div class="mt-3 flex items-center gap-3"><button type="button" aria-label="Escuchar" class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brass text-ink transition hover:bg-brass-bright"></button>' +
        '<div aria-hidden="true" class="flex h-9 flex-1 items-center justify-between">' + barras + '</div></div>';
      box.children[0].textContent = cfg.etiqueta || 'Mensaje para ti';
      box.children[1].textContent = cfg.texto || ('Para ' + (cfg.para || d.saludo));
      var btn = box.querySelector('button');
      var play = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="ml-0.5 h-4 w-4"><path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5Z"></path></svg>';
      var pausa = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" class="h-4 w-4"><rect x="6" y="5" width="4" height="14" rx="1"></rect><rect x="14" y="5" width="4" height="14" rx="1"></rect></svg>';
      btn.innerHTML = play;
      var audio = new Audio(base + '.mp3'); audio.preload = 'auto';
      var pintar = function () { var on = !audio.paused; box.classList.toggle('is-playing', on); btn.innerHTML = on ? pausa : play; btn.setAttribute('aria-label', on ? 'Pausar' : 'Escuchar'); };
      audio.addEventListener('play', pintar); audio.addEventListener('pause', pintar); audio.addEventListener('ended', pintar);
      btn.addEventListener('click', function () { if (audio.paused) audio.play().catch(function () {}); else audio.pause(); });
      ancla.insertAdjacentElement('afterend', box);
      reproductor = { audio: audio, alAbrir: !!cfg.alAbrir };
    }).catch(function () {});
  }


  // ---------- 5. aviso anti-falsificación junto a la descarga del certificado ----------
  function aviso() {
    if (document.querySelector('.gx-aviso')) return;
    var as = document.querySelectorAll('a'), boton = null;
    for (var i = 0; i < as.length; i++) if (/Descargar certificado/i.test(as[i].textContent)) { boton = as[i]; break; }
    if (!boton || !boton.parentElement) return;
    estilos();
    var d = document.createElement('div');
    d.className = 'gx-aviso';
    d.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 3l7 3v6c0 4.5-3 7.6-7 9-4-1.4-7-4.5-7-9V6l7-3z"/><path d="M9 12l2 2 4-4" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<p>Un certificado GARA solo es válido si lo abres en <strong>garaleathergoods.mx/verify</strong>. Un PDF, una foto o una captura no prueban la autenticidad: el registro original vive únicamente aquí.</p>';
    boton.parentElement.insertAdjacentElement('afterend', d);
  }


  // ---------- 7. extras: días juntos, oráculo, origen en el mapa, secretos y "si me encuentras" ----------
  var CSS_EXTRA = '' +
    '.gx-extras{margin:22px auto 0;max-width:340px;display:flex;flex-direction:column;gap:10px;text-align:center}' +
    '.gx-dias{font-size:10px;letter-spacing:.24em;text-transform:uppercase;color:#d9b45f}' +
    '.gx-dias b{font-weight:500;color:#efe6d4;font-size:13px;letter-spacing:.12em}' +
    '.gx-oraculo{border:1px solid #c8a14e40;border-radius:16px;background:#0a0806;padding:14px 16px;cursor:pointer;-webkit-tap-highlight-color:transparent}' +
    '.gx-oraculo small{display:block;font-size:9px;letter-spacing:.24em;text-transform:uppercase;color:#d9b45f}' +
    '.gx-oraculo q{display:block;margin-top:6px;font-size:19px;line-height:1.3;font-style:italic;color:#efe6d4;quotes:"“" "”";transition:opacity .35s}' +
    '.gx-oraculo i{display:block;margin-top:8px;font-size:8px;font-style:normal;letter-spacing:.24em;text-transform:uppercase;color:#a49a8899}' +
    '.gx-origen,.gx-perdida{display:inline-flex;align-items:center;justify-content:center;gap:9px;border:1px solid #c8a14e66;border-radius:999px;padding:11px 16px;color:#ecc878;font-size:10px;letter-spacing:.18em;text-transform:uppercase;text-decoration:none}' +
    '.gx-carta{background:#0000;cursor:pointer;width:100%}' +
    '.gx-perdida{margin-top:12px;border-color:#ffffff22;color:#a49a88;width:100%;box-sizing:border-box}' +
    '.gx-especial{margin:0 auto;display:inline-block;border-radius:999px;padding:7px 14px;font-size:9px;letter-spacing:.18em;text-transform:uppercase;color:#171412;background:linear-gradient(110deg,#c8a14e,#fbe7b0 45%,#ecc878 60%,#a7802f)}' +
    '.gx-archivo{display:block;font-size:9px;line-height:1.7;letter-spacing:.16em;text-transform:uppercase;color:#a49a88;text-decoration:none}' +
    '.gx-petalo{position:fixed;left:50%;top:42%;z-index:2147483002;width:26px;height:26px;margin:-13px;pointer-events:none;background:url(/brand/gara-flower-official.png) center/contain no-repeat;animation:gx-volar var(--t,1.8s) cubic-bezier(.15,.6,.3,1) forwards}' +
    '@keyframes gx-volar{0%{transform:translate(0,0) rotate(0) scale(.3);opacity:1}100%{transform:translate(var(--x),var(--y)) rotate(var(--r)) scale(var(--s,1));opacity:0}}' +
    '.gx-secreto{position:fixed;inset:0;z-index:2147483003;display:flex;align-items:center;justify-content:center;padding:28px;background:#050403e6;opacity:0;transition:opacity .5s}' +
    '.gx-secreto.gx-in{opacity:1}.gx-secreto div{max-width:320px;text-align:center;border:1px solid #c8a14e66;border-radius:20px;padding:26px 22px;background:#0d0a07}' +
    '.gx-secreto small{font-size:9px;letter-spacing:.28em;text-transform:uppercase;color:#d9b45f}.gx-secreto p{margin:12px 0 0;font-size:20px;line-height:1.35;font-style:italic;color:#efe6d4}' +
    '.gx-secreto em{display:block;margin-top:16px;font-size:9px;font-style:normal;letter-spacing:.24em;text-transform:uppercase;color:#a49a88}';

  var FRASES = ['Lo hecho a mano no se repite dos veces.', 'La piel recuerda cada día que pasa contigo.', 'Las marcas no son defectos: son tu historia.', 'Lo bien hecho no necesita prisa.', 'Cada puntada fue una decisión.', 'Envejecer bien también es un arte.', 'Guarda lo esencial; suelta lo demás.'];
  var MESES = { enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4, junio: 5, julio: 6, agosto: 7, septiembre: 8, octubre: 9, noviembre: 10, diciembre: 11 };

  function petalos(n) {
    if (reducido) return;
    for (var i = 0; i < (n || 26); i++) {
      var s = document.createElement('span'), a = Math.random() * Math.PI * 2, r = 120 + Math.random() * 260;
      s.className = 'gx-petalo';
      s.style.setProperty('--x', Math.cos(a) * r + 'px'); s.style.setProperty('--y', Math.sin(a) * r + 90 + 'px');
      s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg'); s.style.setProperty('--s', 0.5 + Math.random());
      s.style.setProperty('--t', 1.3 + Math.random() * 1.2 + 's');
      document.body.appendChild(s);
      (function (el) { setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 2800); })(s);
    }
    if (navigator.vibrate) { try { navigator.vibrate(30); } catch (e) {} }
  }

  function secreto(texto) {
    if (document.querySelector('.gx-secreto')) return;
    var o = document.createElement('div');
    o.className = 'gx-secreto';
    o.innerHTML = '<div><small class="font-data">Secreto del taller</small><p class="font-display"></p><em class="font-data">Toca para cerrar</em></div>';
    o.querySelector('p').textContent = texto;
    document.body.appendChild(o);
    requestAnimationFrame(function () { o.classList.add('gx-in'); });
    petalos(14);
    o.addEventListener('click', function () { o.classList.remove('gx-in'); setTimeout(function () { if (o.parentNode) o.parentNode.removeChild(o); }, 500); });
  }

  function diasJuntos() {
    var m = (document.body.textContent || '').match(/Hecha el\s*(\d{1,2}) de ([a-záé]+) de (20\d\d)/i);
    if (!m || MESES[m[2].toLowerCase()] === undefined) return null;
    var ini = new Date(+m[3], MESES[m[2].toLowerCase()], +m[1]), hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    var dias = Math.round((hoy - ini) / 86400000);
    if (dias < 0) return null;
    var anios = hoy.getFullYear() - ini.getFullYear();
    return { dias: dias, aniversario: anios > 0 && hoy.getMonth() === ini.getMonth() && hoy.getDate() === ini.getDate() ? anios : 0 };
  }

  var extrasListos = false;
  function extras() {
    var d = datos();
    if (extrasListos || !d.codigo) return;
    var ancla = null, ps = document.querySelectorAll('p');
    for (var i = 0; i < ps.length; i++) if (/Ejemplar único\s*$/.test(ps[i].textContent) && /max-w-md/.test(ps[i].className)) { ancla = ps[i]; break; }
    if (!ancla) return;
    extrasListos = true;
    estilos();
    if (!document.getElementById('gx-css2')) { var st = document.createElement('style'); st.id = 'gx-css2'; st.textContent = CSS_EXTRA; document.head.appendChild(st); }
    fetch('/nfc/pieza/' + d.codigo.toLowerCase() + '.json').then(function (r) { return r.ok ? r.json() : {}; }, function () { return {}; }).then(function (cfg) {
      cfg = cfg || {};
      var box = document.createElement('div');
      box.className = 'gx-extras';
      // días juntos
      var dj = d.disponible ? null : diasJuntos();
      if (dj) {
        var p = document.createElement('p');
        p.className = 'gx-dias font-data';
        p.innerHTML = dj.aniversario ? 'Hoy cumplen <b>' + dj.aniversario + (dj.aniversario === 1 ? ' año' : ' años') + '</b> juntos'
          : dj.dias === 0 ? 'Hoy empieza su historia' : 'Llevan <b>' + dj.dias + (dj.dias === 1 ? ' día' : ' días') + '</b> juntos';
        box.appendChild(p);
        if (dj.aniversario) setTimeout(function () { petalos(40); }, 1200);
      }
      // oráculo
      var frases = (cfg.frases || []).concat(FRASES), k = Math.floor(Math.random() * Math.min(frases.length, (cfg.frases || []).length || frases.length));
      var o = document.createElement('div');
      o.className = 'gx-oraculo';
      o.setAttribute('role', 'button');
      o.innerHTML = '<small class="font-data"></small><q class="font-display"></q><i class="font-data">Toca para otra</i>';
      o.querySelector('small').textContent = d.nombre + ' dice';
      var q = o.querySelector('q'); q.textContent = frases[k];
      o.addEventListener('click', function () { k = (k + 1) % frases.length; q.style.opacity = 0; setTimeout(function () { q.textContent = frases[k]; q.style.opacity = 1; }, 300); });
      box.appendChild(o);
      // origen
      if (cfg.origen && cfg.origen.buscar) {
        var a = document.createElement('a');
        a.className = 'gx-origen font-data'; a.target = '_blank'; a.rel = 'noopener';
        a.href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(cfg.origen.buscar);
        a.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg><span></span>';
        a.querySelector('span').textContent = 'Llévame al origen · ' + cfg.origen.nombre;
        box.appendChild(a);
      }
      // piezas de regalo: volver a leer la carta cuando quiera
      var bc = document.createElement('button');
      bc.type = 'button'; bc.className = 'gx-origen gx-carta font-data'; bc.style.display = 'none';
      bc.innerHTML = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="1.6"/><path d="M3.5 6.8l8.5 6.4 8.5-6.4" stroke-linejoin="round"/></svg><span>Volver a abrir mi carta</span>';
      bc.addEventListener('click', function () { if (cartaRegalo && !document.querySelector('.gr-wrap')) cartaRegalo(); });
      box.appendChild(bc);
      var nc = 0;
      (function ver() { if (cartaRegalo) bc.style.display = ''; else if (++nc < 30) setTimeout(ver, 400); })();
      // números especiales del Archivo y enlace al mapa
      var num = parseInt(d.numero, 10), pie = document.createElement('a');
      pie.className = 'gx-archivo font-data'; pie.href = '/mapa/';
      box.appendChild(pie);
      if (num % 50 === 0) {
        var chip = document.createElement('p');
        chip.className = 'gx-especial font-data';
        chip.textContent = '★ Número de colección · Pieza N.º ' + num + ' del Archivo';
        box.insertBefore(chip, box.firstChild);
      }
      pie.textContent = 'Ver GARA en el mapa →';
      fetch('/nfc/archivo.json').then(function (r) { return r.ok ? r.json() : null; }).then(function (ar) {
        if (!ar || !ar.siguienteEspecial) return;
        var faltan = ar.siguienteEspecial - ar.ultimo;
        pie.textContent = 'El Archivo va en la N.º ' + ar.ultimo + ' · faltan ' + faltan + ' para la N.º ' + ar.siguienteEspecial + ', que trae sorpresa · Ver el mapa →';
      }).catch(function () {});
      var caja = document.querySelector('.owner-message');
      (caja || ancla).insertAdjacentElement('afterend', box);
      // secretos: 5 toques al sello giratorio, o agitar el celular
      var sello = document.querySelector('.cert-seal-spin');
      var texto = cfg.secreto || 'Antes de entregarla, esta pieza pasó una última vez por mis manos. Si la tienes tú, es porque quedó como debía.';
      if (sello && sello.parentElement) {
        var toques = 0, t0 = 0;
        sello.parentElement.style.cursor = 'pointer';
        sello.parentElement.addEventListener('click', function () { var n = Date.now(); if (n - t0 > 2500) toques = 0; t0 = n; if (++toques >= 5) { toques = 0; secreto(texto); } });
      }
      // Agitar: 3 golpes de aceleración fuertes en menos de un segundo (caminar o girar el celular no lo dispara).
      var ultimo = 0, golpes = [];
      window.addEventListener('devicemotion', function (e) {
        var a = e.acceleration, g = e.accelerationIncludingGravity, fuerza = null;
        if (a && a.x != null) fuerza = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z);
        else if (g && g.x != null) fuerza = Math.abs(Math.sqrt(g.x * g.x + g.y * g.y + g.z * g.z) - 9.81);
        if (fuerza === null || fuerza < 11) return;
        var n = Date.now();
        if (golpes.length && n - golpes[golpes.length - 1] < 70) return; // misma sacudida
        golpes.push(n);
        while (golpes.length && n - golpes[0] > 1000) golpes.shift();
        if (golpes.length >= 3 && n - ultimo > 2500) { ultimo = n; golpes = []; petalos(34); }
      });
    });
  }

  function encontrada() {
    var d = datos(), av = document.querySelector('.gx-aviso');
    if (!av || d.disponible || !d.codigo || document.querySelector('.gx-perdida')) return;
    var a = document.createElement('a');
    a.className = 'gx-perdida font-data'; a.target = '_blank'; a.rel = 'noopener';
    a.href = 'https://wa.me/527444001162?text=' + encodeURIComponent('Hola GARA, encontré la pieza ' + d.nombre + ' (' + d.codigo + ') y quiero ayudar a que regrese con su dueño.');
    a.textContent = '¿La encontraste? Ayúdala a volver';
    av.insertAdjacentElement('afterend', a);
  }

  function iniciar() {
    escucharPrimerToque();
    registrarVisita(datos());
    mensaje().then(apertura, apertura);
    // la sección de cuidados aparece después de la hidratación; reintento unos segundos
    var n = 0;
    (function intento() { cuidado(); aviso(); encontrada(); extras(); if ((!document.querySelector('.gx-cuidado') || !document.querySelector('.gx-aviso') || !extrasListos) && ++n < 20) setTimeout(intento, 400); })();
  }

  // Esperar a que React termine de hidratar la página antes de tocar el DOM (si no, React marca error #418).
  function hidratado() {
    var el = document.querySelector('.tilt-card') || document.querySelector('main');
    if (!el) return false;
    for (var k in el) if (k.indexOf('__reactFiber') === 0 || k.indexOf('__reactProps') === 0) return true;
    return false;
  }
  var espera = 0;
  (function listo() {
    if (!hidratado() && espera < 6000) { espera += 150; return setTimeout(listo, 150); }
    setTimeout(iniciar, 400);
  })();
})();
