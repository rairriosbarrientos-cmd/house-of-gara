# Sistema editorial GARA — «Cada pieza guarda un lugar, una mano y una historia»

Reglas reutilizables; ninguna página se escribe a mano por producto.

## Qué aporta cada pieza (solo tres datos + fotos)
1. **Acento** (`accent` de los datos) → `--g-acento`: línea de la tarjeta, borde de la miniatura activa, resplandor tras la foto y filete de la historia.
2. **Tono** (`swatch`) → `data-tono` en la ficha (tinte de fondo).
3. **Historia** → primer párrafo de la ficha, con filete del acento; «Lugar» sale de `nfc/pieza/<código>.json` (origen) o, si no existe, «Taller GARA · Acapulco».
4. **Fotos** → `tools/fotos-roles.json` (portada, interior, reverso, detalle, en-mano, alterna). La secuencia siempre va en ese orden.

## Qué es común (lo que hace que todo sea GARA)
- Encuadre de tarjeta 4/5; ficha 4/5 (4/3 si la portada es horizontal); sin marcos ni adornos sobre la pieza.
- Títulos en serif de la marca, apretados; datos en monoespaciada pequeña; cuerpo 1.7.
- Ruta de cuatro pasos en toda la colección y ficha: **Explora → Personaliza (solo si la pieza es personalizable) → Consulta → Verifica** (GARA Registry).
- Disponibilidad solo con los datos reales (`Pieza única` / `Hecho a pedido`); nada se presenta como inventario.

## Archivos (sitio)
`nfc/editorial.css` (tokens y estilos), `nfc/coleccion.js` + `nfc/ficha.js` (agregan, no reemplazan; lo original queda oculto en el HTML y reaparece solo a los 2.5 s si un script falla), `nfc/coleccion.json` (generado), `nfc/inicio.js` («Explora por tipo»).
## Regenerar
`node tools/coleccion-manifest.cjs <sitio>` (lo corre solo `nueva-pieza.cjs`); `python3 tools/enlazar-editorial.py <sitio>` enlaza CSS/JS en páginas nuevas.
