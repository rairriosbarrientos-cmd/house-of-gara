# Certificado + NFC — qué cambió

5 archivos, todos para reemplazar tal cual en tu repo (mismas rutas):

- components/CertificateCard.tsx
- components/AuthenticateForm.tsx
- components/CinematicIntro.tsx
- app/verify/[code]/page.tsx
- app/globals.css

No toqué data/codes.ts, data/products.ts, ni ningún script de generación — tus 4 piezas registradas siguen exactamente igual.

## Qué hace cada cambio

- **CertificateCard.tsx** — agrega el sello (anillo dorado + destello), la marca de agua de la flor GARA de fondo, y la pastilla "Verificado por NFC / por código QR / por código" según de dónde vino la visita.
- **app/verify/[code]/page.tsx** — por cada código ahora se generan DOS páginas estáticas al hacer build: la normal (para el QR de los PDFs) y una con `-NFC` al final (para grabar en los tags físicos). Ambas cargan instantáneo, sin JavaScript de por medio.
- **CinematicIntro.tsx** — la intro de 6s con pétalos ya no se reproduce en `/verify/*`, para que un tap de NFC vaya directo al certificado.
- **AuthenticateForm.tsx** — la búsqueda manual en /autentica también distingue si el código llegó por link o se tecleó.

## Cómo instalarlo

1. Reemplaza los 5 archivos en tu repo local, en las mismas rutas.
2. `npm run build` (o solo `npx next build`, ya que prebuild corre los generadores de PDF — no hace falta tocarlos).
3. Sube el `out/` a Netlify como siempre.

Ya lo corrí completo aquí: `tsc --noEmit` limpio y `next build` generó las 36 páginas sin errores, incluidas las 8 variantes `-NFC`.

## Qué grabar en cada NFC

Para cada pieza que ya está en data/codes.ts, la URL del tag es la del `/verify/` normal **+ `-NFC`** al final:

```
https://garaleathergoods.mx/verify/GARA-000128-NFC/
https://garaleathergoods.mx/verify/GARA-000129-NFC/
https://garaleathergoods.mx/verify/GARA-000131-NFC/
https://garaleathergoods.mx/verify/GARA-000132-NFC/
```

(el código corto `GARA-0001XX`, no el serial `GA-XX-26-...` — cualquiera de los dos funciona igual, pero el corto es más fácil de teclear si algún NFC falla y alguien lo escribe a mano).

Para una **pieza nueva** que registres después:
1. Agrégala a data/codes.ts como ya lo haces (con su `code` y `serial`).
2. Build + deploy.
3. Graba en el NFC: `https://garaleathergoods.mx/verify/<code>-NFC/`

## Cómo se escribe (con NFC Tools, ya lo vimos)

Write → Add a record → URL/URI → pega el link de arriba (con el `-NFC`) → Write, acercando el cel al tag.
