# Carta de agradecimiento GARA · "RELIEVE" (versión 4)

Reemplaza a las versiones 2 y 3. Sale del estilo propio de GARA, no de una plantilla:

- **Piel**: el frente es piel negra de grano plena flor con reflejos ámbar (la misma que tu imagen de marca), con **marco de puntadas a mano** en foil.
- **La flor GARA con venas**: el contorno y los pétalos en corazón del logotipo oficial, con las nervaduras grabadas dentro de cada pétalo, como el relieve de tu carta actual.
- **Sello en seco**: "GARA" en bajo relieve ciego, igual que el que llevan tus piezas.
- **Reverso marfil** (como tu carta actual): la flor grande en relieve ciego recortada por el borde, **costura vertical** de foil, "Gracias por elegir GARA." / "Thank you for choosing GARA", lema, firma y QR al Archivo.

`entrega/` = lo entregado: `imprenta/` (placas PDF y SVG por acabado, piel a 300 dpi, LEEME para la imprenta) y `vista/` (frente, reverso y escena).

## Regenerar
```bash
cd imprenta/carta-v4-relieve
python3 armar.py            # escribe en ./entrega  (trabajo en ./_salida)
```
Requiere `python3` con `numpy`, `scipy` y `fontTools`; `node` con Playwright global y `tools/node_modules` (qrcode). Comparte el motor `lib.py` con `../carta-v3/generador`.

- `venas.py` genera las nervaduras a partir de los pétalos del logotipo (abanico desde la base de cada corazón, con arranques escalonados para que no se amontonen).
- `piel.py` genera la piel (grano celular, luz y reflejos) y el papel marfil; sirve para la vista previa y para la placa impresa de piel.
- `relieve.py` define las capas (foil, relieve, sello, tinta, venas) y la vista simulada (foil con brillo, relieve, bajo relieve).
