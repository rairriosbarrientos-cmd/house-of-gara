/* GARA — ficha editorial: secuencia de fotos con rol, visor (ampliar y comparar) y ruta de acción. Solo agrega; lo original queda oculto en el HTML. */
(function () {
  'use strict';
  var m = location.pathname.match(/^\/productos\/([a-z0-9-]+)\/?$/);
  if (window.__garaFicha || !m) return;
  window.__garaFicha = true;
  var SLUG = m[1];
  var ETQ = { portada: 'Portada', interior: 'Interior', reverso: 'Reverso', detalle: 'Detalle', 'en-mano': 'En mano', alterna: 'Otra vista' };
  function e(t, c, h) { var n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  function hidratado() { var x = document.querySelector('main'); if (!x) return false; for (var k in x) if (k.indexOf('__reactFiber') === 0) return true; return false; }
  var ICO = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';

  /* ---------- zoom / paneo / deslizar sobre un panel ---------- */
  function zoomable(pane, img, onSwipe, onTap) {
    var s = 1, x = 0, y = 0, P = {}, d0 = 0, s0 = 1, t0 = 0, ult = 0, mov = 0, ini = null;
    function lim() { var w = pane.clientWidth, h = pane.clientHeight; x = Math.min(0, Math.max(w - w * s, x)); y = Math.min(0, Math.max(h - h * s, y)); }
    function pon(anim) { lim(); img.style.transition = anim ? 'transform .25s' : 'none'; img.style.transform = 'translate(' + x + 'px,' + y + 'px) scale(' + s + ')'; }
    function en(cx, cy, ns) { ns = Math.min(5, Math.max(1, ns)); x = cx - (cx - x) * (ns / s); y = cy - (cy - y) * (ns / s); s = ns; if (s === 1) { x = 0; y = 0; } }
    function pt(ev) { var r = pane.getBoundingClientRect(); return [ev.clientX - r.left, ev.clientY - r.top]; }
    pane.addEventListener('pointerdown', function (ev) {
      pane.setPointerCapture(ev.pointerId); P[ev.pointerId] = pt(ev); ini = pt(ev); mov = 0; t0 = Date.now();
      var k = Object.keys(P); if (k.length === 2) { d0 = Math.hypot(P[k[0]][0] - P[k[1]][0], P[k[0]][1] - P[k[1]][1]); s0 = s; }
    });
    pane.addEventListener('pointermove', function (ev) {
      if (!P[ev.pointerId]) return; var n = pt(ev), k = Object.keys(P);
      if (k.length === 2) {
        P[ev.pointerId] = n; var a = P[k[0]], b = P[k[1]], d = Math.hypot(a[0] - b[0], a[1] - b[1]); en((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, s0 * d / (d0 || 1)); pon(); mov = 99;
      } else if (s > 1) { x += n[0] - P[ev.pointerId][0]; y += n[1] - P[ev.pointerId][1]; P[ev.pointerId] = n; pon(); mov += Math.abs(n[0] - ini[0]); }
      else { P[ev.pointerId] = n; mov = Math.max(mov, Math.hypot(n[0] - ini[0], n[1] - ini[1])); }
    });
    function fin(ev) {
      if (!P[ev.pointerId]) return; var n = P[ev.pointerId]; delete P[ev.pointerId];
      if (Object.keys(P).length) return;
      var dx = n[0] - ini[0], dy = n[1] - ini[1];
      if (s === 1 && Math.abs(dx) > 55 && Math.abs(dy) < 60 && onSwipe) { onSwipe(dx < 0 ? 1 : -1); return; }
      if (mov < 8 && Date.now() - t0 < 350) {
        if (Date.now() - ult < 320) { if (s > 1) { s = 1; x = 0; y = 0; } else en(n[0], n[1], 2.6); pon(true); ult = 0; }
        else { ult = Date.now(); if (onTap) setTimeout(function () { if (ult) onTap(); }, 330); }
      }
      if (s < 1.02) { s = 1; x = 0; y = 0; pon(true); }
    }
    pane.addEventListener('pointerup', fin); pane.addEventListener('pointercancel', fin);
    return { reset: function () { s = 1; x = 0; y = 0; pon(); } };
  }

  /* ---------- visor ---------- */
  function visor(p, i0) {
    var F = p.fotos, A = i0, B = (i0 + 1) % F.length, slot = 0, dos = false;
    var v = e('div', 'gv'); v.setAttribute('role', 'dialog'); v.setAttribute('aria-modal', 'true'); v.setAttribute('aria-label', 'Fotografías de ' + p.nombre);
    v.style.setProperty('--g-acento', p.acento || '#c8a14e');
    v.innerHTML = '<div class="gv-top"><b>' + esc(p.nombre) + '</b><div><button type="button" class="cmp" aria-pressed="false">Comparar</button><button type="button" class="cerrar" aria-label="Cerrar">Cerrar ✕</button></div></div><div class="gv-lienzo"></div><p class="gv-nota"></p><div class="gv-tiras"></div>';
    var lienzo = v.querySelector('.gv-lienzo'), nota = v.querySelector('.gv-nota'), tiras = v.querySelector('.gv-tiras'), cmp = v.querySelector('.cmp');
    var paneles = [];
    function panel(i) {
      var pn = e('div', 'gv-pane'), im = e('img'); im.draggable = false; pn.appendChild(im); var em = e('em'); pn.appendChild(em);
      var z = zoomable(pn, im, function (d) { if (!dos) ir(d); }, function () { if (dos) { slot = paneles.indexOf(o); marca(); } });
      var o = { pn: pn, im: im, em: em, z: z }; return o;
    }
    function pinta(o, i) { o.im.src = F[i].src; o.im.alt = p.nombre + ' — ' + ETQ[F[i].rol]; o.em.textContent = ETQ[F[i].rol]; o.z.reset(); }
    function marca() { paneles.forEach(function (o, k) { o.pn.style.outline = dos && k === slot ? '2px solid var(--g-acento)' : 'none'; }); [].forEach.call(tiras.children, function (b, k) { var on = k === (dos ? (slot ? B : A) : A); if (on) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); }); }
    function dibuja() {
      lienzo.innerHTML = ''; paneles = [panel(A)]; if (dos) paneles.push(panel(B));
      lienzo.className = 'gv-lienzo' + (dos ? ' dos' : ''); paneles.forEach(function (o) { lienzo.appendChild(o.pn); });
      pinta(paneles[0], A); if (dos) pinta(paneles[1], B);
      nota.textContent = dos ? 'Toca una vista y luego una miniatura para cambiarla · pellizca o toca dos veces para acercar' : 'Desliza para cambiar · pellizca o toca dos veces para acercar';
      cmp.setAttribute('aria-pressed', String(dos)); marca();
    }
    function ir(d) { A = (A + d + F.length) % F.length; pinta(paneles[0], A); marca(); }
    F.forEach(function (f, k) {
      var b = e('button', '', '<img src="' + f.src + '" alt="" loading="lazy">'); b.type = 'button'; b.setAttribute('aria-label', ETQ[f.rol] + ' (' + (k + 1) + ' de ' + F.length + ')');
      b.addEventListener('click', function () { if (dos && slot) { B = k; pinta(paneles[1], B); } else { A = k; pinta(paneles[0], A); } marca(); tiras.children[k].scrollIntoView({ inline: 'center', block: 'nearest' }); });
      tiras.appendChild(b);
    });
    cmp.addEventListener('click', function () { dos = !dos; slot = 0; if (dos && B === A) B = (A + 1) % F.length; dibuja(); });
    function cerrar(desdeHistoria) {
      document.removeEventListener('keydown', tecla); window.removeEventListener('popstate', atras); v.classList.remove('ver');
      setTimeout(function () { v.remove(); document.documentElement.style.overflow = ''; }, 250);
      if (!desdeHistoria && history.state && history.state.gv) history.back();
    }
    function atras() { cerrar(true); }
    function tecla(ev) { if (ev.key === 'Escape') cerrar(); else if (ev.key === 'ArrowRight' && !dos) ir(1); else if (ev.key === 'ArrowLeft' && !dos) ir(-1); }
    v.querySelector('.cerrar').addEventListener('click', function () { cerrar(); });
    document.addEventListener('keydown', tecla); window.addEventListener('popstate', atras);
    history.pushState({ gv: 1 }, '');
    document.documentElement.style.overflow = 'hidden'; document.body.appendChild(v); dibuja();
    requestAnimationFrame(function () { v.classList.add('ver'); v.querySelector('.cerrar').focus(); });
  }

  /* ---------- ficha ---------- */
  function construir(D) {
    var p = D.piezas.filter(function (x) { return x.slug === SLUG; })[0]; if (!p) return;
    var main = document.querySelector('main'), fila = main.querySelector('div.mt-6.grid'); if (!fila) return;
    var orig = fila.children[0], det = fila.children[1]; if (!orig || !det) return;
    var F = p.fotos, idx = 0, ancha = F[0].ar > 1.15;
    main.style.setProperty('--g-acento', p.acento || '#c8a14e'); main.dataset.tono = p.tono || '';
    // galería
    var escena = e('div', 'gf-escena'), vista = e('div', 'gf-vista' + (ancha ? ' ancha' : '')); vista.style.viewTransitionName = 'p-' + p.slug;
    vista.setAttribute('role', 'button'); vista.tabIndex = 0; vista.setAttribute('aria-label', 'Ampliar fotografía de ' + p.nombre);
    var rol = e('span', 'gf-rol'), amp = e('span', 'gf-ampliar', ICO); vista.appendChild(rol); vista.appendChild(amp);
    var tiras = e('div', 'gf-tiras'); tiras.setAttribute('role', 'tablist');
    function mostrar(i) {
      idx = (i + F.length) % F.length; var viejo = vista.querySelector('img'), im = new Image();
      im.alt = p.nombre + ' — ' + ETQ[F[idx].rol]; im.decoding = 'async'; im.className = 'sal'; im.src = F[idx].src;
      im.onload = function () { vista.insertBefore(im, rol); requestAnimationFrame(function () { im.classList.remove('sal'); if (viejo) setTimeout(function () { viejo.remove(); }, 460); }); };
      rol.textContent = ETQ[F[idx].rol] + ' · ' + (idx + 1) + '/' + F.length;
      [].forEach.call(tiras.children, function (b, k) { if (k === idx) b.setAttribute('aria-current', 'true'); else b.removeAttribute('aria-current'); });
    }
    F.forEach(function (f, k) {
      var b = e('button', '', '<img src="' + f.src + '" alt="" loading="lazy" decoding="async"><span>' + ETQ[f.rol] + '</span>'); b.type = 'button';
      b.setAttribute('aria-label', ETQ[f.rol]); b.addEventListener('click', function () { mostrar(k); }); tiras.appendChild(b);
    });
    var primero = new Image(); primero.alt = p.nombre + ' — ' + ETQ[F[0].rol]; primero.src = F[0].src; vista.insertBefore(primero, rol);
    escena.appendChild(vista); escena.appendChild(tiras); orig.parentNode.insertBefore(escena, orig);
    rol.textContent = ETQ[F[0].rol] + ' · 1/' + F.length; tiras.children[0].setAttribute('aria-current', 'true');
    var x0 = 0;
    vista.addEventListener('touchstart', function (ev) { x0 = ev.touches[0].clientX; }, { passive: true });
    vista.addEventListener('touchend', function (ev) { var dx = ev.changedTouches[0].clientX - x0; if (Math.abs(dx) > 50) { mostrar(idx + (dx < 0 ? 1 : -1)); vista.dataset.sw = Date.now(); } }, { passive: true });
    function abrir() { if (Date.now() - (+vista.dataset.sw || 0) < 400) return; visor(p, idx); }
    vista.addEventListener('click', abrir); vista.addEventListener('keydown', function (ev) { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); abrir(); } });

    // ruta + datos (después del precio)
    var h1 = det.querySelector('h1'), precio = h1 && h1.nextElementSibling, wa = det.querySelector('a[href^="https://wa.me/"]');
    var ruta = e('ol', 'gf-ruta');
    ruta.innerHTML = '<li class="aqui"><div><b>Explora</b><small>' + F.length + ' vistas</small></div></li>' +
      (p.config ? '<li><a href="/personaliza/?modelo=' + p.slug + '"><b>Personaliza</b><small>Pieles, hilo y canto</small></a></li>' : '<li class="off"><div><b>Personaliza</b><small>No aplica a esta pieza</small></div></li>') +
      '<li><a ' + (wa ? 'href="' + wa.href + '" target="_blank" rel="noopener"' : 'href="/autentica/"') + '><b>Consulta</b><small>Disponibilidad y precio</small></a></li>' +
      '<li><a href="/autentica/"><b>Verifica</b><small>GARA Registry</small></a></li>';
    var datos = e('div', 'gf-datos', '<div><i>Lugar</i><span>' + esc(p.origen || 'Taller GARA · Acapulco') + '</span></div><div><i>Mano</i><span>' + (p.disp === 'hecho_a_pedido' ? 'Hecho a pedido' : 'Cortada y cosida a mano') + '</span></div><div><i>Historia</i><span><a href="#historia" style="color:inherit;text-decoration:underline;text-underline-offset:3px">Léela abajo</a></span></div>');
    var ancla = precio || h1; ancla.parentNode.insertBefore(ruta, ancla.nextSibling); ruta.parentNode.insertBefore(datos, ruta.nextSibling);
    var his = det.querySelector('p.border-t'); if (his) { his.id = 'historia'; his.classList.add('gf-historia'); }

    // barra fija en móvil
    var cta = det.querySelector('div.mt-8.flex');
    var barra = e('div', 'gf-barra', '<a ' + (wa ? 'href="' + wa.href + '" target="_blank" rel="noopener"' : 'href="/autentica/"') + '>Consultar disponibilidad</a><a href="/autentica/">Verificar</a>');
    document.body.appendChild(barra);
    if ('IntersectionObserver' in window && cta) {
      var visto = false; new IntersectionObserver(function (es) { visto = es[0].isIntersecting; barra.classList.toggle('ver', !visto && scrollY > 300); }).observe(cta);
      addEventListener('scroll', function () { barra.classList.toggle('ver', !visto && scrollY > 300); }, { passive: true });
    } else barra.classList.add('ver');
    document.documentElement.classList.add('gara-ficha');
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
