#!/usr/bin/env python3
# Arma el paquete de entrega de la carta "RELIEVE": placas por acabado (SVG y PDF), piel a 300 dpi, vistas y LEEME.
#   python3 armar.py [carpeta_de_trabajo] [carpeta_de_entrega]
import json, os, shutil, subprocess, sys, zipfile

AQUI = os.path.dirname(os.path.abspath(__file__))
TRABAJO = os.path.abspath(sys.argv[1]) if len(sys.argv) > 1 else os.path.join(AQUI, '_salida')
ENTREGA = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else os.path.join(AQUI, 'entrega')
OG = os.environ.get('GARA_RENDER', AQUI)          # render.cjs y pdf.cjs

LEEME = """GARA — Carta de agradecimiento "RELIEVE" (versión 4)

Medida final: 152 x 102 mm. Archivos a 158 x 108 mm (3 mm de sangrado por lado). Esquinas redondeadas de 4 mm (opcional).
Todo el texto está convertido a curvas. Cada placa va en negro 100 %: el negro marca dónde va cada acabado.
Foil: líneas mínimas de 0.2 mm y texto mínimo de 2.4 mm (ya cumplen). El foil nunca se encima con el barniz.

FRENTE — piel negra
  1-frente-piel-300dpi.png        Piel de grano plena flor impresa a todo color a sangre (300 dpi). Si usas papel símil piel, esta placa no se imprime.
  2-frente-foil.pdf               Foil cobre / oro: la flor GARA con sus venas grabadas y el marco de puntadas.
  3-frente-relieve-flor.pdf       Alto relieve en registro con el foil (la silueta completa de la flor): "foil + relieve".
  4-frente-sello-GARA-seco.pdf    Bajo relieve ciego del logotipo GARA, como el sello que llevan tus piezas.

REVERSO — papel marfil
  5-reverso-tinta.pdf             Texto y QR en tinta café oscuro (Pantone 4625 C o K 90 %).
  6-reverso-foil.pdf              Foil: costura vertical, "Gracias por elegir GARA.", "THANK YOU FOR CHOOSING GARA", línea, lema, firma y "ARCHIVO GARA".
  7-reverso-relieve-flor.pdf      Alto relieve ciego del contorno y los pétalos de la flor grande (recortada por el borde izquierdo).
  8-reverso-venas-grabadas.pdf    Bajo relieve ciego de las venas (líneas de 0.25 mm). Si el impresor pide más grueso, se sube a 0.3 mm.

PAPEL Y ACABADO SUGERIDOS
  Duplex de 600-700 g: frente negro mate + reverso algodón marfil.
  Canto pintado cobre. Esquinas redondeadas de 4 mm.
  Alternativa para el frente: papel negro símil piel (leatherette) en lugar de imprimir la placa 1.

QR: https://garaleathergoods.mx/autentica/ (decodificado y comprobado).
vista/ trae la simulación del acabado final (no es para imprimir).
"""


MOCKUP = """<!doctype html><html><head><meta charset="utf-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1800px;height:1200px;overflow:hidden;background:#0c0907;position:relative}
.mesa{position:absolute;inset:0;background:url("file://@@mesa@@") center/cover}
.luz{position:absolute;inset:0;background:radial-gradient(60% 70% at 38% 30%,rgba(255,226,170,.10),rgba(0,0,0,0) 70%),radial-gradient(90% 90% at 50% 50%,rgba(0,0,0,0) 40%,rgba(0,0,0,.65) 100%)}
.carta{position:absolute;width:840px;height:563px;border-radius:21px}
.carta img{width:100%;height:100%;display:block;border-radius:21px;position:relative}
.canto{position:absolute;inset:0;border-radius:21px;transform:translate(2px,4px)}
.atras{left:60px;top:440px;transform:rotate(-4deg);filter:drop-shadow(0 22px 26px rgba(0,0,0,.7)) drop-shadow(0 3px 4px rgba(0,0,0,.6))}
.atras .canto{background:#d8cdb7}
.frente{left:890px;top:130px;transform:rotate(3deg);filter:drop-shadow(0 26px 30px rgba(0,0,0,.75)) drop-shadow(0 3px 4px rgba(0,0,0,.6))}
.frente .canto{background:linear-gradient(90deg,#a8672b,#e6b570,#a8672b)}
</style></head><body>
<div class="mesa"></div><div class="luz"></div>
<div class="carta atras"><div class="canto"></div><img src="file://@@reverso@@"></div>
<div class="carta frente"><div class="canto"></div><img src="file://@@frente@@"></div>
</body></html>"""


def correr(*cmd, **kw):
    subprocess.check_call(list(cmd), **kw)


def main():
    os.makedirs(TRABAJO, exist_ok=True)
    correr(sys.executable, os.path.join(AQUI, 'relieve.py'), TRABAJO)
    sys.path.insert(0, AQUI)
    import piel as pl
    # piel a 300 dpi para imprimir (misma semilla que la vista previa)
    px = 300 / 25.4
    ruta_piel = os.path.join(TRABAJO, '1-frente-piel-300dpi.png')
    pl.png_escribir(ruta_piel, pl.piel(round(158 * px), round(108 * px), px, semilla=5))
    # PDFs por placa
    placas = [('frente-foil', '2-frente-foil'), ('frente-relieve', '3-frente-relieve-flor'), ('frente-gofrado', '4-frente-sello-GARA-seco'),
              ('reverso-tinta', '5-reverso-tinta'), ('reverso-foil', '6-reverso-foil'), ('reverso-relieve', '7-reverso-relieve-flor'),
              ('reverso-venas', '8-reverso-venas-grabadas')]
    if os.path.isdir(ENTREGA): shutil.rmtree(ENTREGA)
    os.makedirs(f'{ENTREGA}/imprenta/svg'); os.makedirs(f'{ENTREGA}/vista')
    pares = []
    for svg, nombre in placas:
        shutil.copy(f'{TRABAJO}/{svg}.svg', f'{ENTREGA}/imprenta/svg/{nombre}.svg')
        pares.append([[f'{TRABAJO}/{svg}.svg'], f'{ENTREGA}/imprenta/{nombre}.pdf'])
    correr('node', f'{OG}/pdf.cjs', json.dumps(pares), cwd=OG, stdout=subprocess.DEVNULL)
    shutil.copy(ruta_piel, f'{ENTREGA}/imprenta/1-frente-piel-300dpi.png')
    # vistas (el render.cjs deja los PNG junto a los SVG de trabajo)
    correr('node', f'{OG}/render.cjs', json.dumps([
        [f'{TRABAJO}/frente-corte.svg', f'{TRABAJO}/frente.png', 1520], [f'{TRABAJO}/reverso-corte.svg', f'{TRABAJO}/reverso.png', 1520]]), cwd=OG)
    shutil.copy(f'{TRABAJO}/frente.png', f'{ENTREGA}/vista/frente.png'); shutil.copy(f'{TRABAJO}/reverso.png', f'{ENTREGA}/vista/reverso.png')
    # escena: las dos caras sobre una mesa de piel
    mesa = f'{TRABAJO}/mesa.png'
    if not os.path.exists(mesa): pl.png_escribir(mesa, pl.piel(1800, 1200, 6, semilla=9, ambar=0.5, brillo=0.6))
    open(f'{TRABAJO}/mockup.html', 'w').write(MOCKUP.replace('@@mesa@@', mesa).replace('@@frente@@', f'{TRABAJO}/frente.png').replace('@@reverso@@', f'{TRABAJO}/reverso.png'))
    correr('node', os.path.join(AQUI, 'shot.cjs'), f'{TRABAJO}/mockup.html', f'{TRABAJO}/mockup.png', stdout=subprocess.DEVNULL)
    shutil.copy(f'{TRABAJO}/mockup.png', f'{ENTREGA}/vista/mockup.png')
    open(f'{ENTREGA}/imprenta/LEEME-imprenta.txt', 'w').write(LEEME)
    print('listo:', ENTREGA)


if __name__ == '__main__':
    main()
