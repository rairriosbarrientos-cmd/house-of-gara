#!/usr/bin/env python3
# Regenera las propuestas A (Plano) y B (Monograma) de la carta de agradecimiento v3:
# placas SVG por acabado, vistas previas, PDFs de imprenta, LEEME y zips.
#   python3 armar.py            -> escribe en ../entrega/  y los zips en ./_salida/
# Requiere: python3 + fontTools, node con "playwright" (global) y "qrcode" (tools/node_modules).
# La propuesta C (carta de colección, por pieza) se genera con tools/carta-coleccion/coleccion.cjs.
import json, os, shutil, subprocess, sys, zipfile

D = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.abspath(os.path.join(D, '..', 'entrega'))
TMP = os.path.join(D, '_salida')
OG = D          # render.cjs y pdf.cjs viven aquí


def limpiar(p):
    if os.path.isdir(p):
        shutil.rmtree(p)
    os.makedirs(p, exist_ok=True)


def pdfs(pares):
    subprocess.check_call(['node', f'{OG}/pdf.cjs', json.dumps(pares)], cwd=OG, stdout=subprocess.DEVNULL)


def zipdir(carpeta, destino):
    with zipfile.ZipFile(destino, 'w', zipfile.ZIP_DEFLATED) as z:
        base = os.path.dirname(carpeta)
        for raiz, _, archivos in os.walk(carpeta):
            for a in sorted(archivos):
                p = os.path.join(raiz, a)
                z.write(p, os.path.relpath(p, base))


COMUN = """Medida final: 152 x 102 mm. Archivos a 158 x 108 mm (3 mm de sangrado por lado).
Todo el texto está convertido a curvas. Cada placa va en negro 100 %: el negro marca dónde va cada acabado.
Foil: líneas mínimas de 0.2 mm y texto mínimo de 2.4 mm (ya cumplen). El foil nunca se encima con el barniz UV.
"""


def paquete(clave, titulo, orig, placas, leeme, previas):
    carpeta = f'{OUT}/{clave}'
    limpiar(carpeta)
    os.makedirs(f'{carpeta}/imprenta/svg'); os.makedirs(f'{carpeta}/vista')
    pares = []
    for n, (svg, nombre) in enumerate(placas, 1):
        shutil.copy(f'{orig}/{svg}.svg', f'{carpeta}/imprenta/svg/{svg}.svg')
        pares.append([[f'{orig}/{svg}.svg'], f'{carpeta}/imprenta/{n}-{nombre}.pdf'])
    pares.append([[f'{orig}/frente-vista.svg', f'{orig}/reverso-vista.svg'], f'{carpeta}/vista/{clave}-vista.pdf'])
    pdfs(pares)
    for lado in ('frente', 'reverso'):
        shutil.copy(f'{orig}/{lado}-vista.png', f'{carpeta}/vista/{lado}.png')
    open(f'{carpeta}/imprenta/LEEME-imprenta.txt', 'w').write(leeme)
    os.makedirs(TMP, exist_ok=True)
    zipdir(carpeta, f'{TMP}/GARA-carta-{clave}.zip')
    return carpeta


LEEME_A = f"""GARA — Carta de agradecimiento · Propuesta A "PLANO" (versión 3)

{COMUN}
FRENTE (papel negro)
  1-frente-impresion.pdf   Fondo negro a sangre. Si el papel ya es negro, esta placa NO se imprime.
  2-frente-foil.pdf        Foil cobre / oro: marcos con zonas 1-6 y A-D, ejes, cotas, la flor GARA a escala 1:1 y el cuadro de rotulación con el logotipo.
  3-frente-gofrado.pdf     Bajo relieve de la flor, en registro con el foil: "foil + gofrado".

REVERSO (papel marfil)
  4-reverso-impresion.pdf  Notas generales, QR y pie de página en tinta café oscuro (Pantone 4625 C o K 90 %).
  5-reverso-foil.pdf       Foil: marcos, "PLANO DE ENTREGA", "Gracias.", numeración de notas, cuadro de entrega y firma en "Aprobó".

PAPEL Y ACABADO SUGERIDOS
  Duplex de 600 g (negro mate + marfil algodón pegados) o algodón 600 g. Extra: canto pintado cobre.

QR: https://garaleathergoods.mx/autentica/ (decodificado y comprobado).
Cuadro de entrega (PARA / PIEZA / CÓDIGO / FECHA): se llena a mano con pluma negra o dorada.
vista/ trae la simulación del acabado final (no es para imprimir).
"""

LEEME_B = f"""GARA — Carta de agradecimiento · Propuesta B "MONOGRAMA" (versión 3)

{COMUN}
FRENTE (papel negro mate / soft-touch)
  1-frente-impresion.pdf    Fondo negro a sangre. Si el papel ya es negro, esta placa NO se imprime.
  2-frente-barniz-UV.pdf    Barniz UV selectivo brillante: patrón de flores (línea de ~0.35 mm) sobre el negro mate. Deja libre el círculo del sello.
  3-frente-foil.pdf         Foil cobre / oro: marco doble y sello circular (anillos, texto "Hecho a mano en México · Pieza única · Archivo GARA", flor, GARA y ACAPULCO).

REVERSO (papel marfil)
  4-reverso-impresion.pdf   Texto, QR y etiquetas en tinta café oscuro (Pantone 4625 C o K 90 %).
  5-reverso-barniz-UV.pdf   Barniz UV: marco de flores alrededor de la carta (efecto tono sobre tono).
  6-reverso-foil.pdf        Foil: "Gracias.", línea con flor, "Cuídala. Úsala. Vívela.", etiqueta superior y líneas para llenar a mano.

PAPEL Y ACABADO SUGERIDOS
  Duplex de 600 g (negro soft-touch + marfil algodón) o algodón 600 g. Extra: canto pintado cobre.
  El UV fino (línea de 0.35 mm) sale mejor con barniz UV digital (tipo MGI / Scodix) que con serigrafía.

QR: https://garaleathergoods.mx/autentica/ (decodificado y comprobado).
Líneas PARA / PIEZA / CÓDIGO: se llenan a mano con pluma negra o dorada.
vista/ trae la simulación del acabado final (no es para imprimir).
"""

def generar(modulo, carpeta):
    subprocess.check_call([sys.executable, os.path.join(D, f'{modulo}.py'), carpeta])
    subprocess.check_call(['node', f'{OG}/render.cjs', json.dumps([
        [f'{carpeta}/frente-vista.svg', f'{carpeta}/frente-vista.png', 1580],
        [f'{carpeta}/reverso-vista.svg', f'{carpeta}/reverso-vista.png', 1580]])], cwd=OG)


if __name__ == '__main__':
    os.makedirs(OUT, exist_ok=True)
    pl, mo = f'{TMP}/plano', f'{TMP}/monograma'
    generar('plano', pl)
    generar('monograma', mo)
    paquete('A-plano', 'Plano', pl,
            [('frente-impresion', 'frente-impresion'), ('frente-foil', 'frente-foil'), ('frente-gofrado', 'frente-gofrado'),
             ('reverso-impresion', 'reverso-impresion'), ('reverso-foil', 'reverso-foil')], LEEME_A, None)
    paquete('B-monograma', 'Monograma', mo,
            [('frente-impresion', 'frente-impresion'), ('frente-uv', 'frente-barniz-UV'), ('frente-foil', 'frente-foil'),
             ('reverso-impresion', 'reverso-impresion'), ('reverso-uv', 'reverso-barniz-UV'), ('reverso-foil', 'reverso-foil')], LEEME_B, None)
    print('listo:', OUT)
