# Concepto A — PLANO. Carta de agradecimiento como plano de ingeniería. Frente negro + foil + gofrado; reverso marfil.
import math, os, re, sys
from lib import *

SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(D, 'out-plano')
LOC = f'<g transform="translate({B} {B})">'


def loc(elems):
    return [LOC + ''.join(elems) + '</g>']


def marco(zonas=True):
    f = [rect(4, 4, 144, 94, .35), rect(7, 7, 138, 88, .22)]
    if zonas:
        for k in range(1, 6):
            x = 4 + 144 * k / 6; f += [linea(x, 4, x, 7, .2), linea(x, 95, x, 98, .2)]
        for k in range(1, 4):
            y = 4 + 94 * k / 4; f += [linea(4, y, 7, y, .2), linea(145, y, 148, y, .2)]
        for k in range(6):
            x = 4 + 144 * (k + .5) / 6; f += [text('mono', str(k + 1), 2.4, x, 6.3), text('mono', str(k + 1), 2.4, x, 97.3)]
        for k in range(4):
            y = 4 + 94 * (k + .5) / 4 + .8; f += [text('mono', 'ABCD'[k], 2.4, 5.5, y), text('mono', 'ABCD'[k], 2.4, 146.5, y)]
    return f


# punta de la flor en una dirección (para colgar las llamadas)
def radio_punta(grados, escala):
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', FLOR)))
    pts = list(zip(nums[0::2], nums[1::2]))
    cx0, cy0 = (FBOX[0] + FBOX[2]) / 2, (FBOX[1] + FBOX[3]) / 2
    ux, uy = math.cos(math.radians(grados)), math.sin(math.radians(grados))
    mejor = 0
    for x, y in pts:
        dx, dy = x - cx0, y - cy0
        along = dx * ux + dy * uy; perp = abs(-dx * uy + dy * ux)
        if perp < 55 and along > mejor: mejor = along
    return mejor * escala


CX, CY, D_FLOR = 50.5, 49.0, 50.0
R = D_FLOR / 2
ESC = D_FLOR / FW          # mm por unidad del trazo


def frente():
    f = marco()
    # --- ejes y circunferencias de construcción ---
    f.append(linea(CX - R - 15, CY, CX + R + 15, CY, .2, '6 1.2 1 1.2'))
    f.append(linea(CX, CY - R - 9, CX, CY + R + 3.5, .2, '6 1.2 1 1.2'))
    for s in (-1, 1):
        a = math.radians(45)
        f.append(linea(CX - s * (R + 4) * math.cos(a), CY - (R + 4) * math.sin(a), CX + s * (R + 4) * math.cos(a), CY + (R + 4) * math.sin(a), .2, '5 1.2 1 1.2'))
    f.append(circulo(CX, CY, R + 1.8, .2, '2.4 1.6'))
    f.append(circulo(CX, CY, R * .6, .2, '1.2 1.3'))
    f.append(flor_en(CX, CY, D_FLOR))
    # --- marcas de corte A-A en los extremos del eje ---
    for s in (-1, 1):
        x = CX + s * (R + 12.5)
        f.append(linea(x, CY + 4.5, x, CY - 3.2, .6))
        f.append(flecha(x, CY - 5.8, -90, 2.6, .95))
        f.append(text('mono', 'A', 2.7, x, CY - 8.4))
    # --- cota horizontal del diámetro ---
    yd = CY + R + 9.5
    for s in (-1, 1):
        f.append(linea(CX + s * R, CY + 4.2, CX + s * R, yd + 2.4, .2))
        f.append(linea(CX + s * (R), yd, CX + s * 6.4, yd, .2))
        f.append(flecha(CX + s * R, yd, 180 if s < 0 else 0, 2.3, .8))
    f.append(text('mono', 'Ø 50', 2.7, CX, yd + 0.95))
    # --- cota angular de 45° ---
    ra = R + 7
    f.append(arco(CX, CY, ra, -41.5, -3.5, .2))
    f.append(flecha(CX + ra * math.cos(math.radians(-45)), CY + ra * math.sin(math.radians(-45)), 225, 2.2, .75))
    f.append(flecha(CX + ra, CY, 90, 2.2, .75))
    f.append(text('mono', '45°', 2.7, CX + (ra + 2.5) * math.cos(math.radians(-22.5)), CY + (ra + 2.5) * math.sin(math.radians(-22.5)) + .9, 'start'))
    # --- llamadas ---
    rp = radio_punta(-45, ESC)
    px, py = CX + rp * math.cos(math.radians(-45)) * .96, CY + rp * math.sin(math.radians(-45)) * .96
    f.append(f'<circle cx="{px:.2f}" cy="{py:.2f}" r=".6" stroke-width="0"/>')
    ex, ey = px + 8, py - 8
    f.append(f'<path d="M{px:.2f} {py:.2f}L{ex:.2f} {ey:.2f}L{ex + 6:.2f} {ey:.2f}" fill="none" stroke-width=".2"/>')
    f.append(text('mono', 'PÉTALO ×8', 2.6, ex + 7.2, ey + .95, 'start'))
    rc = 3.25
    ang = math.radians(22.5)
    qx, qy = CX + rc * math.cos(ang), CY + rc * math.sin(ang)
    f.append(f'<circle cx="{qx:.2f}" cy="{qy:.2f}" r=".6" stroke-width="0"/>')
    lx, ly = CX + (R + 2.6) * math.cos(ang), CY + (R + 2.6) * math.sin(ang)
    f.append(f'<path d="M{qx:.2f} {qy:.2f}L{lx:.2f} {ly:.2f}L{lx + 4:.2f} {ly:.2f}" fill="none" stroke-width=".2"/>')
    f.append(text('mono', 'CENTRO Ø 6.5', 2.5, lx + 5.2, ly + .9, 'start'))
    # --- título de la vista y notas ---
    f.append(text('mono', 'VISTA FRONTAL', 2.8, CX, 91.2, track=.1))
    f.append(linea(CX - 22, 92.7, CX + 22, 92.7, .25))
    f.append(text('mono', 'DIMENSIONES EN MM', 2.4, 10.6, 12.4, 'start'))
    f.append(text('mono', 'ÁNGULOS EN GRADOS', 2.4, 10.6, 15.6, 'start'))
    # --- cuadro de rotulación ---
    x0, x1, y0 = 104.0, 145.0, 7.0
    f.append(linea(x0, y0, x0, 95, .3))
    f.append(gara_en((x0 + x1) / 2, y0 + 12, 31))
    f.append(linea(x0, y0 + 24, x1, y0 + 24, .3))
    filas = [('TÍTULO', 'LA FLOR GARA'), ('ESCALA', '1:1'), ('MATERIAL', 'PIEL DE PLENA FLOR'),
             ('ACABADO', 'HECHO A MANO'), ('ORIGEN', 'ACAPULCO, MÉXICO'), ('TOLERANCIA', 'LA QUE DA LA MANO')]
    y = y0 + 24
    for et, val in filas:
        f.append(text('mono', et, 2.4, x0 + 2.2, y + 3.5, 'start', .04))
        f.append(text('mono', val, 2.65, x0 + 2.2, y + 7.6, 'start'))
        y += 9.5
        f.append(linea(x0, y, x1, y, .2))
    f.append(linea((x0 + x1) / 2 + 1.5, y, (x0 + x1) / 2 + 1.5, 95, .2))
    f.append(text('mono', 'REV. A', 2.5, x0 + 2.2, y + 4.75, 'start'))
    f.append(text('mono', 'HOJA 1/1', 2.5, (x0 + x1) / 2 + 3.7, y + 4.75, 'start'))
    capas = {'impresion': [f'<rect width="{W}" height="{H}"/>'], 'foil': loc(f), 'gofrado': loc([flor_en(CX, CY, D_FLOR)])}
    return capas


NOTAS = [
    'Cortada, cosida y terminada a mano, una sola vez y para una sola persona.',
    'Sus marcas, vetas y variaciones son parte del diseño. Tolerancia: la que da la mano.',
    'Con el uso, la piel cambia de tono y gana carácter. Es el comportamiento esperado.',
    'Mantenimiento: hidratar cada 3 a 6 meses; evitar el sol directo y la humedad.',
    'Toda pieza vive en el Archivo GARA. Verifícala con su NFC o con el código QR.',
]


def reverso():
    f, t = marco(), []
    f.append(text('mono', 'PLANO DE ENTREGA', 2.5, 11, 14.6, 'start', .12))
    f.append(text('cgi', 'Gracias.', 15, 10.5, 30.0, 'start'))
    y = 39.0
    for i, n in enumerate(NOTAS):
        f.append(text('mono', str(i + 1), 2.7, 11, y, 'start'))
        lineas = envolver('cg5', n, 3.15, 74)
        for j, l in enumerate(lineas):
            t.append(text('cg5', l, 3.15, 16.8, y + j * 4.15, 'start'))
        y += len(lineas) * 4.15 + 2.1
    t.append(text('mono', 'GARALEATHERGOODS.MX · ACAPULCO, MÉXICO', 2.2, 11, 91.6, 'start', .04))
    # cuadro de entrega (a llenar con pluma dorada o blanca)
    x0, x1, y0 = 100.0, 141.0, 11.0
    f.append(rect(x0, y0, x1 - x0, 57.5, .3))
    f.append(text('mono', 'CUADRO DE ENTREGA', 2.4, (x0 + x1) / 2, y0 + 4.7, track=.08))
    f.append(linea(x0, y0 + 7, x1, y0 + 7, .25))
    yy = y0 + 7
    for et in ['PARA', 'PIEZA', 'CÓDIGO', 'FECHA']:
        f.append(text('mono', et, 2.4, x0 + 2.2, yy + 3.4, 'start', .06))
        yy += 9.4
        f.append(linea(x0, yy, x1, yy, .2))
    f.append(text('mono', 'APROBÓ', 2.4, x0 + 2.2, yy + 3.4, 'start', .06))
    f.append(firma_en((x0 + x1) / 2 + 3, yy + 7.2, 24))
    # QR
    t.append(qr('https://garaleathergoods.mx/autentica/', x0, 73, 20))
    t.append(text('mono', 'ESCANEA', 2.3, x0 + 23, 78.6, 'start', .08))
    t.append(text('mono', 'PARA VERIFICAR', 2.3, x0 + 23, 82.4, 'start', .0))
    t.append(text('mono', 'TU PIEZA', 2.3, x0 + 23, 86.2, 'start', .08))
    return {'impresion': loc(t), 'foil': loc(f)}


def previa(lado, capas):
    if lado == 'frente':
        return previa_svg(capas, '#0e0b08', tinta='#100c09', gofrado='#0d0a08', foil='oro')
    return previa_svg(capas, '#f3ede1', tinta='#2b2017', foil='cobre')


if __name__ == '__main__':
    for lado, fn in (('frente', frente), ('reverso', reverso)):
        c = fn()
        exportar(lado, c, SALIDA, previa(lado, c))
    print('ok', SALIDA)
