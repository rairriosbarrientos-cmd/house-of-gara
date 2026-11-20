# Concepto B — MONOGRAMA. Frente negro mate con patrón de flores en barniz UV selectivo + sello de foil. Reverso marfil con marco de flores en UV.
import math, os, sys
from lib import *

SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, 'out-monograma')
LOC = f'<g transform="translate({B} {B})">'


def loc(elems):
    return [LOC + ''.join(elems) + '</g>']


CXM, CYM = 76.0, 51.0     # centro de la carta (coordenadas de corte)


def patron():
    d, n, m = 8.6, 12, 11
    x0, x1, y0, y1 = 8 + d / 2, 144 - d / 2, 8 + d / 2, 94 - d / 2
    p, rs = (x1 - x0) / (n - 1), (y1 - y0) / (m - 1)
    flores = []
    for j in range(m):
        y = y0 + j * rs
        xs = [x0 + i * p for i in range(n)] if j % 2 == 0 else [x0 + p / 2 + i * p for i in range(n - 1)]
        for x in xs:
            if math.hypot(x - CXM, y - CYM) < 36.2: continue      # hueco del sello (el UV nunca toca el foil)
            flores.append(flor_en(x, y, d))
    return flores


def sello():
    f = [circulo(CXM, CYM, 30, .4), circulo(CXM, CYM, 28.6, .2), circulo(CXM, CYM, 21.4, .2)]
    f.append(texto_arco('mono', 'HECHO A MANO EN MÉXICO · PIEZA ÚNICA · ARCHIVO GARA · ', 2.5, CXM, CYM, 24.2, completo=True))
    f.append(flor_en(CXM, CYM - 8.6, 16))
    f.append(gara_en(CXM, CYM + 7.6, 29))
    f.append(text('mono', 'ACAPULCO', 2.3, CXM, CYM + 15.2, track=.3))
    return f


def frente():
    marco = [rect(4, 4, 144, 94, .35), rect(5.6, 5.6, 140.8, 90.8, .2)]
    return {'impresion': [f'<rect width="{W}" height="{H}"/>'],
            'uv': loc(patron()),
            'foil': loc(marco + sello())}


def marco_flores():
    d = 8.4
    x0, x1, y0, y1 = 9.0, 143.0, 9.0, 93.0
    n, m = 13, 9
    out = []
    for i in range(n):
        x = x0 + i * (x1 - x0) / (n - 1)
        out += [flor_en(x, y0, d), flor_en(x, y1, d)]
    for j in range(1, m - 1):
        y = y0 + j * (y1 - y0) / (m - 1)
        out += [flor_en(x0, y, d), flor_en(x1, y, d)]
    return out


CUERPO = ('Esta pieza fue cortada, cosida y terminada a mano, una sola vez y para una sola persona. '
          'Con el tiempo su piel cambiará contigo: cada marca que gane será parte de su historia.')


def reverso():
    f, t = [], []
    f.append(text('mono', 'UNA PIEZA HECHA A MANO', 2.4, 19, 23, 'start', .14))
    f.append(text('cgi', 'Gracias.', 23, 18.2, 45.5, 'start'))
    f.append(linea(19, 51.5, 66, 51.5, .25))
    f.append(flor_en(70.6, 51.5, 6.2))
    y = 59.5
    for l in envolver('cg5', CUERPO, 3.35, 78):
        t.append(text('cg5', l, 3.35, 19, y, 'start')); y += 4.6
    f.append(text('cgi', 'Cuídala. Úsala. Vívela.', 5.6, 19, y + 5.2, 'start'))
    # columna derecha: QR + datos a llenar a mano
    t.append(qr('https://garaleathergoods.mx/autentica/', 104, 18, 25))
    t.append(text('mono', 'CONOCE SU HISTORIA', 2.3, 104, 49.2, 'start', .02))
    t.append(text('mono', 'GARALEATHERGOODS.MX', 2.3, 104, 53.2, 'start'))
    yy = 61
    for et in ('PARA', 'PIEZA', 'CÓDIGO'):
        t.append(text('mono', et, 2.2, 104, yy, 'start', .1))
        f.append(linea(104, yy + 6.2, 135, yy + 6.2, .2))
        yy += 9.5
    return {'impresion': loc(t), 'uv': loc(marco_flores()), 'foil': loc(f)}


def previa(lado, capas):
    if lado == 'frente':
        return previa_svg(capas, '#0f0d0b', tinta='#100e0c', foil='oro', uv='#34302a')
    return previa_svg(capas, '#f3ede1', tinta='#2b2017', foil='cobre', uv='#e3d9c6')


if __name__ == '__main__':
    for lado, fn in (('frente', frente), ('reverso', reverso)):
        c = fn()
        exportar(lado, c, SALIDA, previa(lado, c))
    print('ok', SALIDA)
