# GARA — fuente y herramientas

Esta rama (`fuente`) **no se publica**. El sitio que ve el cliente vive en `main`, que Netlify publica tal cual. `main` es el export estático de Next.js: HTML, archivos `__next.*.txt` y `_next/static`.

El código fuente original de Next.js (`GARA_proyecto_fuente.zip`) se perdió. Esta rama guarda lo que sí se pudo recuperar y las herramientas para seguir trabajando sin él.

## Qué hay aquí

| Carpeta | Contenido |
|---|---|
| `data/productos.json` | Los 20 productos del sitio, extraídos del inicio. Incluye nombre, historia, materiales, color, cuidados, fotos y acento. |
| `data/registros.json` | Las piezas registradas (GARA-000128 a 000142) con propietario, saludo, fecha, código, mensaje de voz, video y certificado. |
| `tools/nueva-pieza.cjs` | Da de alta una pieza nueva de punta a punta (ver abajo). |
| `tools/limpiar-certificado.cjs` | Limpia un certificado PDF que se hizo copiando uno viejo: quita textos ocultos y corrige los links. |
| `piezas/*.json` | Una ficha por pieza, que es la entrada de `nueva-pieza`. |
| `recuperado-sep-2026/` | Los 5 archivos fuente que quedaron en el historial de git (septiembre). Están desactualizados y sirven solo como referencia. |

## Alta de una pieza nueva

```bash
cd tools && npm install          # una sola vez
node tools/nueva-pieza.cjs piezas/<pieza>.json --sitio /ruta/a/house-of-gara
```

1. Copia `piezas/majin-boo.json` y cambia los datos de la pieza nueva.
   - `plantilla` es una pieza ya publicada de la **misma categoría**: `axioma` para tarjeteros, `ignis` para neceser, `azimut` para estuches, etc.
   - `materiales` debe tener la misma cantidad que la plantilla.
   - `fotos` son 3 rutas (frente, reverso y detalle).
   - `recorte` es un PNG con fondo transparente.
   - `certificado` es el PDF ya limpio.
2. El script genera todo esto:
   - las 4 páginas de verificación (normal, NFC y por código) con su QR nuevo;
   - la ficha, la tarjeta del catálogo y el panel del inicio;
   - la entrada en el sitemap;
   - las fotos webp y el recorte 3D;
   - los certificados;
   - la imagen para compartir y la vista previa de WhatsApp.
3. Antes de escribir, el script revisa que no quede **ningún** dato de la pieza plantilla (nombre, dueño, número). Si queda alguno, se detiene.
4. Revisa en el navegador y haz commit en `main`.

Prueba de que funciona: al regenerar Majin Boo desde la plantilla Axioma, el resultado salió **idéntico byte por byte** a lo publicado.

**Pendiente:** el mensaje de voz y el video todavía se agregan aparte. Usan como plantilla una pieza que ya los tenga (Oráculo, Vigía, Baluarte, Azimut).

## Reconstrucción del proyecto Next.js (siguiente fase)

Componentes que hay que rehacer a partir de los chunks compilados:

- `Nav`, `Hero`, `RoomsGallery`, `TiltCard`, `OwnerCardShell`, `CinematicIntro`, `ScrollReveal`, `SmoothScrollProvider`
- `BifoldConfigurator` (3D), `AuthenticateForm`, `PaymentPanel`

Páginas:

- `/`, `/productos`, `/productos/[slug]`, `/personaliza`, `/leather-library`, `/autentica`, `/pagar`, `/rair`, `/verify/[code]`

El plan es hacerlo página por página en esta rama. Cada página se compara con capturas del sitio actual, y solo se cambia lo que publica Netlify cuando todo coincida.
