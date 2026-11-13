/* GARA — agrega al inicio la sección "La experiencia GARA" sin tocar el build de Next.js. */
(function () {
  'use strict';
  if (window.__garaInicio) return;
  window.__garaInicio = true;
  var DEMO = '/verify/gara-000143-nfc/?bienvenida'; // pieza en venta: demo sin exponer a ningún cliente
  var ICO = {
    hola: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="2.2"/><path d="M3.5 9c-1 2-1 4 0 6M20.5 9c1 2 1 4 0 6" stroke-linecap="round"/><circle cx="12" cy="12" r="1.6"/></svg>',
    regalo: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="6" width="18" height="13" rx="1.6"/><path d="M3.5 6.8l8.5 6.4 8.5-6.4" stroke-linejoin="round"/><circle cx="12" cy="13.4" r="2.2" fill="currentColor" stroke="none" opacity=".85"/></svg>',
    mapa: '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>'
  };
  function construir() {
    var s = document.createElement('section');
    s.className = 'gi'; s.id = 'experiencia-gara';
    s.innerHTML = '<div class="gi-in">' +
      '<p class="gi-k font-data">La experiencia GARA</p>' +
      '<h2 class="font-display">Tu pieza <em>te reconoce.</em></h2>' +
      '<p class="gi-p">Cada pieza lleva un chip NFC. Acerca tu celular y te saluda por tu nombre, te cuenta su historia y guarda tu certificado de autenticidad para siempre.</p>' +
      '<div class="gi-g">' +
      '<div class="gi-c">' + ICO.hola + '<h3 class="font-display">Te saluda por tu nombre</h3><p>La primera vez que la tocas, la flor GARA se abre y tu pieza te da la bienvenida. Inclina el celular y la tarjeta se mueve contigo.</p></div>' +
      '<div class="gi-c">' + ICO.regalo + '<h3 class="font-display">Llega como regalo</h3><p>Un sobre con sello de cera guarda el mensaje de quien te la regaló. Se abre con un toque, antes de ver la pieza.</p></div>' +
      '<div class="gi-c">' + ICO.mapa + '<h3 class="font-display">Vive en el mapa</h3><p>Cada pieza suma un punto dorado en la ciudad donde encontró a su dueño. Ninguna se repite.</p></div>' +
      '</div>' +
      '<div class="gi-b"><a class="gi-1" href="' + DEMO + '">Probar la experiencia →</a><a class="gi-2" href="/mapa/">Ver GARA en el mapa</a></div>' +
      '</div>';
    return s;
  }
  function enInicio() { return location.pathname === '/' || location.pathname === '/index.html'; }
  function hidratado() {
    var el = document.querySelector('.rooms-track') || document.querySelector('main');
    if (!el) return false;
    for (var k in el) if (k.indexOf('__reactFiber') === 0 || k.indexOf('__reactProps') === 0) return true;
    return false;
  }
  function colocar() {
    var ya = document.getElementById('experiencia-gara');
    if (!enInicio()) { if (ya) ya.remove(); return; }
    if (ya || !hidratado()) return;
    var hero = document.querySelector('section.hero-shell'); // justo debajo de la portada
    if (!hero || !hero.parentElement) return;
    hero.insertAdjacentElement('afterend', construir());
    // La galería fija calculó su posición antes de insertar la sección: pedirle que la recalcule.
    setTimeout(function () { try { window.dispatchEvent(new Event('resize')); } catch (e) {} }, 60);
  }
  setInterval(colocar, 600);
})();
