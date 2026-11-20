# Carta de agradecimiento GARA — "RELIEVE".
# Frente: piel negra de grano plena flor, la flor GARA con venas en foil sobre relieve, marco de puntadas a mano y sello GARA en seco.
# Reverso: papel marfil con la flor en relieve ciego (como la carta actual), costura vertical de foil y el texto.
import base64, math, os, sys
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'carta-v3', 'generador'))   # motor compartido (lib.py)
from lib import *
from fontTools.ttLib import TTFont
import venas, piel as pl

AQUI = os.path.dirname(os.path.abspath(__file__))
FONTS['ms4'] = TTFont(os.path.join(AQUI, 'assets', 'fonts', 'MS-400.ttf'))
FONTS['ms5'] = TTFont(os.path.join(AQUI, 'assets', 'fonts', 'MS-500.ttf'))
SALIDA = sys.argv[1] if len(sys.argv) > 1 else os.path.join(AQUI, 'out')
LOC = f'<g transform="translate({B} {B})">'


def loc(elems):
    return [LOC + ''.join(elems) + '</g>']


# ------------------------------------------------------------------ puntadas de talabartero
def trayecto_rect(x, y, w, h, r):
    """Piezas (longitud, f(s)->(x, y, ángulo)) de un rectángulo redondeado, desde el centro del borde inferior, sentido horario."""
    piezas = []
    mitad = (w - 2 * r) / 2
    def recta(x0, y0, ang, L):
        return (L, lambda s, x0=x0, y0=y0, ang=ang: (x0 + math.cos(ang) * s, y0 + math.sin(ang) * s, ang))
    def arco(cx, cy, a0):
        return (math.pi * r / 2, lambda s, cx=cx, cy=cy, a0=a0: (cx + r * math.cos(a0 + s / r), cy + r * math.sin(a0 + s / r), a0 + s / r + math.pi / 2))
    # inferior (hacia la izquierda): empezamos en el centro y vamos en sentido horario visto en pantalla
    piezas.append(recta(x + w / 2, y + h, math.pi, mitad))
    piezas.append(arco(x + r, y + h - r, math.pi / 2))
    piezas.append(recta(x, y + h - r, -math.pi / 2, h - 2 * r))
    piezas.append(arco(x + r, y + r, math.pi))
    piezas.append(recta(x + r, y, 0, w - 2 * r))
    piezas.append(arco(x + w - r, y + r, -math.pi / 2))
    piezas.append(recta(x + w, y + r, math.pi / 2, h - 2 * r))
    piezas.append(arco(x + w - r, y + h - r, 0))
    piezas.append(recta(x + w - r, y + h, math.pi, mitad))
    return piezas


def punto_en(piezas, s):
    for L, f in piezas:
        if s <= L + 1e-9: return f(s)
        s -= L
    return piezas[-1][1](piezas[-1][0])


def puntadas(piezas, largo=3.0, paso=3.95, grosor=0.62, inclin=20):
    P = sum(L for L, _ in piezas)
    n = round(P / paso); paso = P / n
    ds = []
    for i in range(n):
        x, y, a = punto_en(piezas, (i + 0.5) * paso)
        a += math.radians(inclin)
        dx, dy = math.cos(a) * largo / 2, math.sin(a) * largo / 2
        ds.append(f'M{x - dx:.2f} {y - dy:.2f}L{x + dx:.2f} {y + dy:.2f}')
    return f'<path d="{"".join(ds)}" fill="none" stroke-width="{grosor}" stroke-linecap="round"/>'


def costura_vertical(x, y0, y1, largo=3.0, paso=3.95, grosor=0.62, inclin=20):
    n = round((y1 - y0) / paso); paso = (y1 - y0) / n
    ds = []
    a = math.radians(90 + inclin)
    for i in range(n):
        cy = y0 + (i + 0.5) * paso
        dx, dy = math.cos(a) * largo / 2, math.sin(a) * largo / 2
        ds.append(f'M{x - dx:.2f} {cy - dy:.2f}L{x + dx:.2f} {cy + dy:.2f}')
    return f'<path d="{"".join(ds)}" fill="none" stroke-width="{grosor}" stroke-linecap="round"/>'


# ------------------------------------------------------------------ FRENTE
FD, FCX, FCY = 62.0, 76.0, 45.5          # diámetro y centro de la flor
VENAS = venas.todas_las_venas(paso_mm=0.95, ancho_mm=FD)


def frente():
    foil = [flor_en(FCX, FCY, FD), venas.trazo_venas(VENAS, FCX, FCY, FD, 0.2),
            puntadas(trayecto_rect(6, 6, 140, 90, 6))]
    relieve = [flor_solida_en(FCX, FCY, FD)]
    gofrado = [gara_en(FCX, 87.8, 40)]
    return {'foil': loc(foil), 'relieve': loc(relieve), 'gofrado': loc(gofrado)}


# ------------------------------------------------------------------ REVERSO
RD, RCX, RCY = 96.0, 18.0, 51.0           # flor grande en relieve ciego, recortada por el borde izquierdo
VENAS_R = venas.todas_las_venas(paso_mm=1.25, ancho_mm=RD, semilla=11)
CUERPO = 'Tu pieza fue cortada, cosida y terminada a mano, con cuidado, intención y amor por el diseño atemporal.'
XT = 80.0                                  # columna de texto


def reverso():
    f, t = [], []
    f.append(costura_vertical(71, 8, 94))
    f.append(text('cg6', 'Gracias por', 10.4, XT, 26.6, 'start'))
    f.append(text('cg6', 'elegir GARA.', 10.4, XT, 37.8, 'start'))
    f.append(text('ms5', 'THANK YOU FOR CHOOSING GARA', 2.4, XT, 45.4, 'start', .17))
    f.append(linea(XT, 49.6, XT + 22, 49.6, .25))
    y = 56.4
    for l in envolver('cg5', CUERPO, 3.15, 50):
        t.append(text('cg5', l, 3.15, XT, y, 'start')); y += 4.4
    f.append(text('cgi', 'Cuídala. Úsala. Vívela.', 4.9, XT, 72.6, 'start'))
    f.append(firma_en(131.5, 70.6, 17))
    t.append(qr('https://garaleathergoods.mx/autentica/', XT, 78, 15))
    f.append(text('ms5', 'ARCHIVO GARA', 2.4, XT + 18.5, 83.0, 'start', .17))
    t.append(text('ms4', 'Escanea para verificar', 2.4, XT + 18.5, 87.0, 'start'))
    t.append(text('ms4', 'tu pieza en el Archivo.', 2.4, XT + 18.5, 90.4, 'start'))
    return {'foil': loc(f), 'tinta': loc(t),
            'relieve': loc([flor_en(RCX, RCY, RD)]),                      # anillo y pétalos en alto relieve
            'venas': loc([venas.trazo_venas(VENAS_R, RCX, RCY, RD, 0.25)])}   # venas grabadas (bajo relieve)


# ------------------------------------------------------------------ VISTA PREVIA
def b64(ruta):
    return base64.b64encode(open(ruta, 'rb').read()).decode()


FILTROS = '''
<filter id="alto" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108" color-interpolation-filters="sRGB">
 <feGaussianBlur in="SourceAlpha" stdDeviation="0.5" result="b"/>
 <feSpecularLighting in="b" surfaceScale="3.4" specularConstant="1.5" specularExponent="38" lighting-color="#f2dcb4" result="s"><feDistantLight azimuth="225" elevation="36"/></feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="hi"/>
 <feOffset in="SourceAlpha" dx="0.3" dy="0.38" result="o"/><feGaussianBlur in="o" stdDeviation="0.38" result="ob"/>
 <feFlood flood-color="#000" flood-opacity=".62" result="fl"/><feComposite in="fl" in2="ob" operator="in" result="sh"/>
 <feComposite in="sh" in2="SourceAlpha" operator="out" result="sh2"/>
 <feMerge><feMergeNode in="sh2"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="hundido" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108" color-interpolation-filters="sRGB">
 <feGaussianBlur in="SourceAlpha" stdDeviation="0.17" result="b"/>
 <feSpecularLighting in="b" surfaceScale="-5" specularConstant="2.4" specularExponent="30" lighting-color="#ffd9a0" result="s"><feDistantLight azimuth="225" elevation="34"/></feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="hi"/>
 <feOffset in="SourceAlpha" dx="0.2" dy="0.26" result="o"/>
 <feComposite in="SourceAlpha" in2="o" operator="out" result="borde"/>
 <feGaussianBlur in="borde" stdDeviation="0.14" result="bb"/>
 <feFlood flood-color="#000" flood-opacity=".9" result="fl"/><feComposite in="fl" in2="bb" operator="in" result="sh"/>
 <feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="alto-papel" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108" color-interpolation-filters="sRGB">
 <feGaussianBlur in="SourceAlpha" stdDeviation="0.42" result="b"/>
 <feSpecularLighting in="b" surfaceScale="2.4" specularConstant="0.42" specularExponent="26" lighting-color="#ffffff" result="s"><feDistantLight azimuth="225" elevation="38"/></feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="hi"/>
 <feOffset in="SourceAlpha" dx="0.26" dy="0.32" result="o"/><feGaussianBlur in="o" stdDeviation="0.42" result="ob"/>
 <feFlood flood-color="#7a6240" flood-opacity=".32" result="fl"/><feComposite in="fl" in2="ob" operator="in" result="sh"/>
 <feComposite in="sh" in2="SourceAlpha" operator="out" result="sh2"/>
 <feMerge><feMergeNode in="sh2"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="hundido-papel" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108" color-interpolation-filters="sRGB">
 <feGaussianBlur in="SourceAlpha" stdDeviation="0.16" result="b"/>
 <feSpecularLighting in="b" surfaceScale="-2.4" specularConstant="1.0" specularExponent="30" lighting-color="#ffffff" result="s"><feDistantLight azimuth="225" elevation="36"/></feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="hi"/>
 <feGaussianBlur in="SourceAlpha" stdDeviation="0.14" result="g"/>
 <feFlood flood-color="#5a4630" flood-opacity=".3" result="fl"/><feComposite in="fl" in2="g" operator="in" result="sh"/>
 <feMerge><feMergeNode in="sh"/><feMergeNode in="hi"/></feMerge>
</filter>
<filter id="foilsombra" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108" color-interpolation-filters="sRGB">
 <feOffset in="SourceAlpha" dx="0.14" dy="0.18" result="o"/><feGaussianBlur in="o" stdDeviation="0.12" result="ob"/>
 <feFlood flood-color="#000" flood-opacity=".55" result="fl"/><feComposite in="fl" in2="ob" operator="in" result="sh"/>
 <feGaussianBlur in="SourceAlpha" stdDeviation="0.2" result="b"/>
 <feSpecularLighting in="b" surfaceScale="2" specularConstant="0.6" specularExponent="22" lighting-color="#fff" result="s"><feDistantLight azimuth="225" elevation="35"/></feSpecularLighting>
 <feComposite in="s" in2="SourceAlpha" operator="in" result="h"/>
 <feMerge><feMergeNode in="sh"/><feMergeNode in="SourceGraphic"/><feMergeNode in="h"/></feMerge>
</filter>
'''


def previa(lado, capas, base_png, foil='oro'):
    defs = DEFS_PREVIA + FILTROS
    cuerpo = f'<image href="data:image/png;base64,{b64(base_png)}" x="0" y="0" width="{W}" height="{H}" preserveAspectRatio="none"/>'
    if lado == 'frente':
        defs += '<radialGradient id="foco" gradientUnits="userSpaceOnUse" cx="79" cy="48" r="52"><stop offset="0" stop-color="#ffe2b0" stop-opacity=".16"/><stop offset="1" stop-color="#ffe2b0" stop-opacity="0"/></radialGradient>'
        cuerpo += f'<rect width="{W}" height="{H}" fill="url(#foco)"/>'
    papel = lado == 'reverso'
    if capas.get('relieve'):
        cuerpo += f'<g fill="#000" stroke="#000" stroke-width="0" filter="url(#{"alto-papel" if papel else "alto"})">' + ''.join(capas['relieve']) + '</g>'
    if capas.get('venas'):
        cuerpo += f'<g fill="none" stroke="#000" filter="url(#hundido-papel)">' + ''.join(capas['venas']) + '</g>'
    if capas.get('gofrado'):
        cuerpo += '<g fill="#4d3524" fill-opacity=".6" stroke="#000" stroke-width="0" filter="url(#hundido)">' + ''.join(capas['gofrado']) + '</g>'
    if capas.get('tinta'):
        cuerpo += '<g fill="#2b2017" stroke="#2b2017" stroke-width="0">' + ''.join(capas['tinta']) + '</g>'
    if capas.get('foil'):
        defs += (f'<mask id="m-foil" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><g fill="#fff" stroke="#fff" stroke-width="0">'
                 + ''.join(capas['foil']) + '</g></mask>')
        cuerpo += f'<g filter="url(#foilsombra)"><rect width="{W}" height="{H}" fill="url(#g-{foil})" mask="url(#m-foil)"/></g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">'
            f'<defs>{defs}</defs>{cuerpo}</svg>')


def placas(capas, nombre, salida, quitar=()):
    for capa, elems in capas.items():
        if not elems or capa in quitar: continue
        open(os.path.join(salida, f'{nombre}-{capa}.svg'), 'w').write(
            svg_doc({capa: elems}, [(capa, 'fill="#000" stroke="#000" stroke-width="0"')], bg='#fff'))


if __name__ == '__main__':
    os.makedirs(SALIDA, exist_ok=True)
    PXMM = 10
    piel_png = os.path.join(SALIDA, 'frente-piel-preview.png')
    if not os.path.exists(piel_png):
        pl.png_escribir(piel_png, pl.piel(int(W * PXMM), int(H * PXMM), PXMM, semilla=5))
    papel_png = os.path.join(SALIDA, 'reverso-papel-preview.png')
    if not os.path.exists(papel_png):
        pl.png_escribir(papel_png, pl.papel(int(W * PXMM), int(H * PXMM), PXMM, semilla=2))
    cf, cr = frente(), reverso()
    placas(cf, 'frente', SALIDA); placas(cr, 'reverso', SALIDA)
    vf, vr = previa('frente', cf, piel_png), previa('reverso', cr, papel_png, foil='cobre')
    open(os.path.join(SALIDA, 'frente-vista.svg'), 'w').write(vf)
    open(os.path.join(SALIDA, 'reverso-vista.svg'), 'w').write(vr)
    for lado, v in (('frente', vf), ('reverso', vr)):
        open(os.path.join(SALIDA, f'{lado}-corte.svg'), 'w').write(v.replace(f'width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}"', f'width="{TW}mm" height="{TH}mm" viewBox="{B} {B} {TW} {TH}"'))
    print('ok', SALIDA)
