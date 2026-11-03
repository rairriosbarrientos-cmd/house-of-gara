/*
 * GARA — experiencia NFC (mejora las páginas /verify/* sin tocar el build de Next.js)
 *  1. Giroscopio: en iPhone, el primer toque en la página activa "Moverla con el celular".
 *  2. Apertura personalizada: la primera vez que se abre la página NFC de una pieza.
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

  function apertura() {
    var d = datos();
    var clave = 'gara-apertura-' + (d.codigo || location.pathname);
    if (!esNFC || vista(clave) || !d.codigo) return;
    var esperado = 0;
    (function esperar() {
      if (!introTerminada() && esperado < 9000) { esperado += 200; return setTimeout(esperar, 200); }
      mostrar(d, clave);
    })();
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

  function iniciar() {
    escucharPrimerToque();
    apertura();
    // la sección de cuidados aparece después de la hidratación; reintento unos segundos
    var n = 0;
    (function intento() { cuidado(); if (!document.querySelector('.gx-cuidado') && ++n < 20) setTimeout(intento, 400); })();
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
    if (!hidratado() && espera < 12000) { espera += 150; return setTimeout(listo, 150); }
    setTimeout(iniciar, 400);
  })();
})();
