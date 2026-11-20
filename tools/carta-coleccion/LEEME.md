# Carta de colección GARA

Una carta física por pieza vendida (póker 63.5 × 88.9 mm, 3 mm de sangrado): el recorte de **su** pieza, nombre, N.º,
propietario y código; atrás "Gracias, {nombre}" y un QR a **su** certificado (`/verify/gara-NNNNNN/`).

```bash
cd tools && npm install                      # sharp y qrcode (una vez)
node carta-coleccion/coleccion.cjs  piezas/atlante.json  /ruta/al/sitio/productos/atlante-recorte.webp  salida/
```

Entrada: `piezas/<slug>.json` (usa `nombre`, `numero`, `codigo`, `propietario`, `saludo`, `color`; opcionales `categoria`, `anio`)
y el recorte con transparencia (`productos/<slug>-recorte.webp` del sitio).

Salida en `salida/`:
- `<codigo>-imprenta.pdf` — 2 páginas (frente y reverso) con sangrado, para la imprenta.
- `<codigo>-frente.png`, `-reverso.png` — 300 dpi con sangrado.
- `<codigo>-vista-*.png` — simulación con esquinas redondeadas (no imprimir).

Los textos largos (nombres, propietarios con título) se reducen solos para caber. Playwright (Chromium) debe estar instalado globalmente.
