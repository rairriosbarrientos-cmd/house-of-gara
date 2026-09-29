/* GARA · experiencia de verificación NFC.
 * Se carga desde las páginas /verify/*. Los datos vienen en los data-* del <script>:
 *   data-nfc="1"   → la visita llegó por un tag NFC (muestra la pantalla de verificación)
 *   data-owner, data-product, data-serial → datos del certificado
 */
(function () {
  var script = document.currentScript;
  if (!script) return;

  var WHATSAPP = "527444001162";
  var isNfc = script.getAttribute("data-nfc") === "1";
  var owner = script.getAttribute("data-owner") || "";
  var product = script.getAttribute("data-product") || "";
  var serial = script.getAttribute("data-serial") || "";
  var firstName = owner.trim().split(/\s+/)[0] || "";

  function el(tag, attrs, html) {
    var node = document.createElement(tag);
    for (var key in attrs) node.setAttribute(key, attrs[key]);
    if (html != null) node.innerHTML = html;
    return node;
  }

  function text(value) {
    var span = document.createElement("span");
    span.textContent = value;
    return span.innerHTML;
  }

  function mount() {
    if (isNfc) {
      var overlay = el(
        "div",
        { class: "gnfc-overlay", role: "status", "aria-live": "polite" },
        '<img class="gnfc-logo" src="/brand/gara-flower-official.png" alt="GARA">' +
          '<svg class="gnfc-seal" viewBox="0 0 64 64" aria-hidden="true">' +
          '<circle cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-opacity="0.15" stroke-width="1.5"/>' +
          '<circle class="gnfc-pulse" cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="1"/>' +
          '<circle class="gnfc-ring" cx="32" cy="32" r="28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" pathLength="100"/>' +
          '<path class="gnfc-check" d="M21 33 l7 7 l15 -16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" pathLength="100"/>' +
          "</svg>" +
          '<div class="gnfc-status"><span class="gnfc-pending">Verificando autenticidad…</span>' +
          '<span class="gnfc-done">Pieza auténtica · NFC</span></div>' +
          '<p class="gnfc-hello">' +
          (firstName ? "Hola, " + text(firstName) + ".<br>Esta pieza es tuya." : "Pieza registrada en el atelier.") +
          (serial ? "<small>" + text(serial) + "</small>" : "") +
          "</p>"
      );

      var close = function () {
        if (!overlay.parentNode) return;
        overlay.classList.add("is-leaving");
        window.setTimeout(function () {
          if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 320);
      };
      overlay.addEventListener("click", close);
      overlay.addEventListener("animationend", function (event) {
        if (event.target === overlay && event.animationName === "gnfc-out") {
          overlay.parentNode && overlay.parentNode.removeChild(overlay);
        }
      });
      document.body.appendChild(overlay);

      // Vibración corta al confirmar (Android; iOS la ignora).
      window.setTimeout(function () {
        if (navigator.vibrate) navigator.vibrate(35);
      }, 1350);
    }

    var message = "Hola GARA, tengo la pieza " + product + (serial ? " (" + serial + ")" : "") + ".";
    var bar = el(
      "div",
      { class: "gnfc-bar" },
      '<span class="gnfc-badge">' +
        (isNfc ? "✓ Verificado por NFC" : "✓ Pieza auténtica GARA") +
        "</span>" +
        '<a class="gnfc-wa" target="_blank" rel="noopener noreferrer" href="https://wa.me/' +
        WHATSAPP +
        "?text=" +
        encodeURIComponent(message) +
        '">' +
        '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.8 11.8 0 0 0 4.5 4c1.7.7 2.3.8 3.2.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.2-1.2-.1-.1-.3-.2-.5-.3Z"/></svg>' +
        "Contactar al atelier</a>"
    );
    document.body.appendChild(bar);
    document.body.classList.add("gnfc-has-bar");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
