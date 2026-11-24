/* GARA — colección editorial de /productos/. Solo agrega: la cuadrícula original queda en el HTML (oculta). Datos: /nfc/coleccion.json */
(function () {
  'use strict';
  if (window.__garaCol || !/^\/productos\/?$/.test(location.pathname)) return;
  window.__garaCol = true;
  var WA = 'https://wa.me/5217444001162?text=';
  var TIPOS = [['cartera', 'Carteras'], ['tarjetero', 'Tarjeteros'], ['bolsa', 'Bolsas'], ['neceser', 'Neceseres'], ['estuche', 'Estuches']];
  var ESTADOS = [['unica', 'Pieza única', function (p) { return p.disp === 'pieza_unica'; }],
    ['pedido', 'Hecho a pedido', function (p) { return p.disp === 'hecho_a_pedido'; }],
    ['config', 'Personalizable', function (p) { return p.config; }]];
  var ETQ = { pieza_unica: 'Pieza única', hecho_a_pedido: 'Hecho a pedido' };
  var DESTACADAS = ['atlante', 'veta', 'campana'];
  function e(t, c, h) { var n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hidratado() { var m = document.querySelector('main'); if (!m) return false; for (var k in m) if (k.indexOf('__reactFiber') === 0) return true; return false; }
  function portada(p) { return p.fotos.filter(function (f) { return f.rol === 'portada'; })[0] || p.fotos[0]; }
  function segunda(p) { var c = portada(p); return p.fotos.filter(function (f) { return f !== c && f.rol !== 'alterna'; })[0] || null; }

  function construir(D) {
    var main = document.querySelector('main'), P = D.piezas;
    var intro = main.querySelector('div.mt-10.grid');
    var q = new URLSearchParams(location.search), tipo = q.get('tipo') || '', est = q.get('est') || '';
    var raiz = e('div', 'gc-raiz');
    // lema y collage
    raiz.appendChild(e('p', 'gc-lema', 'Cada pieza guarda <b>un lugar, una mano y una historia.</b>'));
    var col = e('div', 'gc-collage');
    DESTACADAS.map(function (s) { return P.filter(function (p) { return p.slug === s; })[0]; }).filter(Boolean).forEach(function (p, i) {
      var f = portada(p), a = e('a', '', '<img src="' + f.src + '" alt="' + esc(p.nombre) + '" ' + (i ? 'loading="lazy"' : 'fetchpriority="high"') + ' decoding="async"><span>' + esc(p.nombre) + ' · ' + esc(p.subtitulo.split('·')[0]) + '</span>');
      a.href = '/productos/' + p.slug + '/'; col.appendChild(a);
    });
    raiz.appendChild(col);
    // barra de filtros
    var barra = e('div', 'gc-barra'), fila = e('div', 'gc-chips'), sec = e('div', 'gc-chips gc-sec');
    barra.setAttribute('role', 'region'); barra.setAttribute('aria-label', 'Filtros de la colección');
    function chip(host, clave, txt, n, grupo) {
      var b = e('button', '', esc(txt) + '<small>' + n + '</small>'); b.type = 'button'; b.dataset.k = clave; b.dataset.g = grupo; host.appendChild(b); return b;
    }
    chip(fila, '', 'Todas', P.length, 'tipo');
    TIPOS.forEach(function (t) { var n = P.filter(function (p) { return p.tipo === t[0]; }).length; if (n) chip(fila, t[0], t[1], n, 'tipo'); });
    ESTADOS.forEach(function (s) { var n = P.filter(s[2]).length; if (n) chip(sec, s[0], s[1], n, 'est'); });
    barra.appendChild(fila); barra.appendChild(sec); raiz.appendChild(barra);
    var cuenta = e('p', 'gc-cuenta'); cuenta.setAttribute('aria-live', 'polite'); raiz.appendChild(cuenta);
    // tarjetas
    var ul = e('ul', 'gc-grid');
    P.forEach(function (p) {
      var f = portada(p), s = segunda(p), li = e('li', 'gc-card');
      li.style.setProperty('--g-acento', p.acento || '#c8a14e'); li.dataset.tipo = p.tipo; li.dataset.slug = p.slug;
      var estado = ETQ[p.disp] || '';
      var a = e('a', '', '<div class="gc-foto"><img src="' + f.src + '" alt="' + esc(p.nombre) + ' — ' + esc(p.subtitulo) + '" loading="lazy" decoding="async" style="view-transition-name:p-' + p.slug + '"></div>' +
        '<div class="gc-meta"><i>' + esc(p.tipo) + (estado ? ' · ' + estado : '') + '</i><h3>' + esc(p.nombre) + '</h3><p class="' + (/confirmar/i.test(p.precio) ? 'por' : '') + '">' + esc(p.precio) + '</p></div>');
      a.href = '/productos/' + p.slug + '/';
      if (s) a.addEventListener('pointerenter', function once() { a.removeEventListener('pointerenter', once); var im = new Image(); im.alt = ''; im.decoding = 'async'; im.src = s.src; a.querySelector('.gc-foto').appendChild(im); }, { once: true });
      li.appendChild(a); ul.appendChild(li);
    });
    raiz.appendChild(ul);
    var vacio = e('div', 'gc-vacio', 'Ninguna pieza coincide con esa combinación.<button type="button">Ver toda la colección</button>'); raiz.appendChild(vacio);
    // ruta: de la inspiración a la acción
    var ruta = e('section', 'gc-ruta', '<h2>De la inspiración a tu mano.</h2><ol class="gc-pasos">' +
      '<li><a href="#" data-sube="1"><b>Explora</b><span>Cada pieza real, con su historia y sus fotos.</span></a></li>' +
      '<li><a href="/personaliza/"><b>Personaliza</b><span>Las piezas marcadas “Personalizable” admiten tus pieles, hilo y canto.</span></a></li>' +
      '<li><a href="' + WA + encodeURIComponent('Hola GARA, quiero consultar disponibilidad de una pieza.') + '" target="_blank" rel="noopener"><b>Consulta</b><span>Disponibilidad, precio y tiempos, directo con el taller.</span></a></li>' +
      '<li><a href="/autentica/"><b>Verifica</b><span>Cada pieza se registra en GARA Registry con su certificado.</span></a></li></ol>');
    raiz.appendChild(ruta);
    ruta.querySelector('[data-sube]').addEventListener('click', function (ev) { ev.preventDefault(); barra.scrollIntoView({ behavior: 'smooth' }); });
    intro.parentNode.insertBefore(raiz, intro);

    // filtros
    var tarjetas = [].slice.call(ul.children);
    function aplicar(push) {
      var ef = ESTADOS.filter(function (s) { return s[0] === est; })[0], vis = 0;
      tarjetas.forEach(function (li) {
        var p = P.filter(function (x) { return x.slug === li.dataset.slug; })[0];
        var ok = (!tipo || p.tipo === tipo) && (!ef || ef[2](p)); li.hidden = !ok; if (ok) vis++;
      });
      [].forEach.call(barra.querySelectorAll('button'), function (b) { b.setAttribute('aria-pressed', String(b.dataset.g === 'tipo' ? b.dataset.k === tipo : b.dataset.k === est)); });
      cuenta.textContent = vis + (vis === 1 ? ' pieza' : ' piezas') + (tipo || est ? ' · filtrada' : ' reales del Atelier');
      vacio.style.display = vis ? 'none' : 'block';
      var u = new URL(location.href); tipo ? u.searchParams.set('tipo', tipo) : u.searchParams.delete('tipo'); est ? u.searchParams.set('est', est) : u.searchParams.delete('est');
      history.replaceState(null, '', u.pathname + u.search);
      if (push) revelar();
    }
    barra.addEventListener('click', function (ev) {
      var b = ev.target.closest('button'); if (!b) return;
      if (b.dataset.g === 'tipo') tipo = b.dataset.k; else est = est === b.dataset.k ? '' : b.dataset.k;
      aplicar(true);
    });
    vacio.querySelector('button').addEventListener('click', function () { tipo = ''; est = ''; aplicar(true); });
    // aparición suave
    var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) { es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('en'); io.unobserve(x.target); } }); }, { rootMargin: '0px 0px -6% 0px' }) : null;
    function revelar() { tarjetas.forEach(function (li) { if (li.hidden) return; if (io && !li.classList.contains('en')) io.observe(li); else li.classList.add('en'); }); }
    var nav = document.querySelector('header'); if (nav) document.documentElement.style.setProperty('--g-nav', nav.getBoundingClientRect().height + 'px');
    document.documentElement.classList.add('gara-col');
    aplicar(false); revelar();
    if (tipo || est) setTimeout(function () { barra.scrollIntoView({ behavior: 'smooth' }); }, 350);
  }

  function arrancar() {
    var t0 = Date.now();
    (function esperar() {
      if (hidratado()) { fetch('/nfc/coleccion.json').then(function (r) { return r.json(); }).then(construir).catch(function () {}); return; }
      if (Date.now() - t0 < 10000) setTimeout(esperar, 60);
    })();
  }
  if (document.readyState === 'complete') arrancar(); else window.addEventListener('load', arrancar);
})();
