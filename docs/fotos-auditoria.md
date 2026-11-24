# Auditoría de fotografías (24 nov 2026)

Se revisaron las 103 imágenes que usa el sitio (portada, galería de cada ficha). Ninguna falta ni está duplicada. **No se inventó ninguna foto**: lo que falta se pide abajo.

## Respaldo
Las fotos originales (antes de la compresión del 21 nov, commit `9be2189`) están en `respaldo-fotos-originales/` de esta rama. Los nombres no cambiaron.

## Reemplazos exactos (mismo nombre de archivo)
| Archivo | Problema | Qué tomar |
|---|---|---|
| `productos/azimut-03.webp` | 1400×788 (única de baja resolución), gris liso distinto al resto de la serie | Vista lateral en el mismo set que `azimut-01` (muro crema + base gris), mínimo 1400×1050 |
| `productos/tote-zafira-02.webp` | Fondo gris liso y proporción 1.24; la 01 está en piedra gris | Frente del bolsillo en el set de `tote-zafira-01`, 3:4 |
| `productos/tarjetero-altata-gara-02.webp`, `-03.webp` | Tira vertical 0.56 sobre fondo moteado | Interior y detalle a 3:4 sobre fondo neutro (madera oscura como la serie 2026) |
| `productos/tarjetero-altata-gara-01.webp` | 0.70 | Reencuadrar a 3:4 |
| `productos/ignis-01.webp` | 3:2, único con ese encuadre | Repetir a 4:3 como `ignis-02` |
| `productos/bolsa-candado-dorado-02.webp`, `-04.webp` | Cuatro variantes del mismo ángulo frontal | Sustituir por interior, reverso y detalle del candado/cinta; conservar `-01` y `-03` |
| `productos/bifold-vintage-cerrada.webp`, `bifold-vintage-abierta.webp`, `tarjetero-vintage-cafe.webp`, `tarjetero-duo-naranja-marino.webp`, `bifold-duo-interior.webp` | Serie antigua 1:1; la abierta con sombra dura sobre crema | Repetir a 3:4 cuando se retome la serie |

Fondos claros (borde medio > 170): son muros **crema**, no blanco puro (no hay fondo blanco). Las series «muro crema + piedra gris» (neceseres, estuches de lentes) son coherentes entre sí y no se reemplazan.

## Tomas que faltan por pieza
Cada toma tiene un lugar fijo: **interior** → ficha (2.ª posición de la secuencia) y foto que aparece al pasar el dedo/cursor sobre la tarjeta de la colección; **reverso** → ficha (3.ª posición); **detalle** → ficha (4.ª posición: costura, grabado, herraje o grano de la piel).

```
bolsa-candado-dorado                  interior, reverso, detalle
  tarjetero-duo-naranja-marino          interior, reverso, detalle
  cartera-bifold-vintage-cafe           reverso, detalle
  cartera-bifold-duo-naranja-azul-hielo reverso, detalle
  tarjetero-animal-print                interior, reverso, detalle
  tarjetero-firma-gara                  reverso, detalle
  asterion-gara                         reverso, detalle
  tote-aurea-gara                       interior, detalle
  bandolera-eclipse                     interior, reverso
  tarjetero-altata-gara                 reverso
  neceser-siroco                        interior, reverso, detalle
  neceser-alisio                        interior, reverso, detalle
  tote-zafira                           interior, reverso
  oraculo                               reverso, detalle
  ignis                                 interior, reverso
  axioma                                detalle
  vigia                                 reverso, detalle
  baluarte                              reverso, detalle
  azimut                                reverso, detalle
  majin-boo                             detalle
  goku                                  reverso
  vegeta                                reverso
  broly                                 interior, reverso
  espinazo                              reverso, detalle
  more                                  interior, reverso
  nazas                                 reverso
  legado                                detalle
  atlante                               detalle
  campana                               reverso
  veta                                  reverso, detalle
```
Al subir una foto nueva: nombre `<slug>-0N.webp` (3:4, ≥1086×1448), añadir su rol en `tools/fotos-roles.json` y correr `node tools/coleccion-manifest.cjs <sitio>`.
