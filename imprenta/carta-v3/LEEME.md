# Carta de agradecimiento GARA · versión 3 (tres propuestas)

Se rehízo desde cero porque la v2 (`../carta-v2/`) no convenció. Tres conceptos distintos:

| | Concepto | Acabados | Formato |
|---|---|---|---|
| **A** | **Plano**: el frente es el dibujo técnico de la flor GARA con cuadro de rotulación; el reverso es el "plano de entrega" | papel negro + marfil, foil cobre, gofrado de la flor | 152 × 102 mm |
| **B** | **Monograma**: negro mate con patrón de flores en barniz UV y sello de foil; reverso marfil con marco de flores | negro soft-touch + marfil, UV selectivo, foil cobre | 152 × 102 mm |
| **C** | **Carta de colección**: una por pieza vendida, como la tarjeta 3D de la web, con QR a su certificado | impresión digital CMYK, laminado soft-touch (opcional foil holográfico) | póker 63.5 × 88.9 mm |

`comparativa.png` los pone lado a lado. `entrega/` guarda los archivos entregados (A y B: placas SVG/PDF por acabado + vistas; C: ejemplos de Atlante y Legado).

## Regenerar
- **A y B**: `cd generador && python3 armar.py` (necesita `fontTools`, Playwright global y `tools/node_modules` con `qrcode`). Escribe en `entrega/` y deja los zips en `generador/_salida/`.
  - `lib.py` trae el motor: texto a curvas (IBM Plex Mono / Cormorant), colocación de trazos vectoriales (flor, logotipo, firma), QR, primitivas de dibujo técnico y la vista previa del foil/UV.
  - `plano.py` y `monograma.py` definen las capas de cada concepto.
- **C**: `node ../../tools/carta-coleccion/coleccion.cjs piezas/<pieza>.json <recorte> <salida>` (ver `tools/carta-coleccion/LEEME.md`).

## Reglas de producción usadas
- Cada acabado es una placa SVG en negro 100 %; el texto va convertido a curvas.
- Foil: líneas ≥ 0.2 mm, texto ≥ 2.4 mm; el foil nunca se encima con el barniz UV.
- Vista previa: el degradado del foil se aplica con máscara en coordenadas de la hoja (así ningún trazo lo deforma).
- Los QR se decodificaron con jsQR sobre las imágenes finales: A y B → `/autentica/`; C → `/verify/gara-NNNNNN/` de cada pieza.
