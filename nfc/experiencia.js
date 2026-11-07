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

  function apertura() {
    var d = datos();
    var clave = 'gara-apertura-' + (d.codigo || location.pathname);
    var forzar = /[?&]bienvenida\b/.test(location.search);
    if (!d.codigo || (vista(clave) && !forzar)) return;
    var esperado = 0;
    (function esperar() {
      if (!introTerminada() && esperado < 5000) { esperado += 200; return setTimeout(esperar, 200); }
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

  function iniciar() {
    escucharPrimerToque();
    mensaje().then(apertura, apertura);
    // la sección de cuidados aparece después de la hidratación; reintento unos segundos
    var n = 0;
    (function intento() { cuidado(); aviso(); if ((!document.querySelector('.gx-cuidado') || !document.querySelector('.gx-aviso')) && ++n < 20) setTimeout(intento, 400); })();
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
