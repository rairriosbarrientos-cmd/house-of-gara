# Recorte de una pieza (para la tarjeta 3D)

Saca la pieza de su foto con una silueta trazada a mano que **se pega sola al borde real** (no hay que ser exacto al píxel).

```bash
cd tools && npm install                                   # sharp (una vez)
node recorte/zoom.cjs foto.png 290 190 540 250 2 25 z.jpg # recorte ampliado con cuadrícula: lee las coordenadas ORIGINALES
# escribe la silueta como un path SVG (M x y L x y ... Z) en silueta.txt
node recorte/snap.cjs foto.png silueta.txt silueta-ajustada.txt 9 4
node recorte/mask.cjs foto.png silueta-ajustada.txt recorte.png revision.jpg
```

- `zoom.cjs` ⇒ imagen ampliada con una cuadrícula etiquetada (en píxeles de la foto original) para leer puntos.
- `snap.cjs` ⇒ mueve cada punto, a lo largo de su normal (±9 px), al cambio más fuerte de luminosidad (cuero claro → mesa oscura) y suaviza los desplazamientos.
- `mask.cjs` ⇒ aplica la silueta con un borde suave de ~1 px, recorta el fondo transparente (`recorte.png`) y genera una hoja de revisión con la silueta en cian sobre ocho tramos del borde.

Ejemplo real: `piezas/veta-silueta.txt` (Veta, foto con la solapa entreabierta). Después, en la ficha de la pieza, `"recorte": "…/recorte.png"` y `margenRecorte` (si la tarjeta 3D tapa el sello "Ejemplar único", sube `arriba` a 0.34).
Para rehacer solo las imágenes de una pieza ya publicada: `node tools/nueva-pieza.cjs piezas/<pieza>.json --sitio … --solo-imagenes`.
