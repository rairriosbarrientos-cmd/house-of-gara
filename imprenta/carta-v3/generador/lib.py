# Biblioteca compartida para las cartas GARA v3 (SVG por capas, texto convertido a curvas).
# Unidades: mm. Hoja con sangrado: 158 x 108 (corte final 152 x 102, 3 mm de sangrado por lado).
import json, math, os, re, subprocess
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

D = os.path.dirname(os.path.abspath(__file__))
ASSETS = os.path.join(D, 'assets')                      # trazos vectoriales (flor, logotipo, firma) y tipografías
NODE_MODULES = os.environ.get('GARA_NODE_MODULES', os.path.join(D, '..', '..', '..', 'tools', 'node_modules'))   # necesita "qrcode"
W, H, B = 158.0, 108.0, 3.0
TW, TH = 152.0, 102.0

FONTS = {k: TTFont(p) for k, p in {
    'mono': os.path.join(ASSETS, 'fonts', 'IBMPlexMono-Medium.ttf'),
    'cg5': os.path.join(ASSETS, 'fonts', 'CG-500.ttf'),
    'cg6': os.path.join(ASSETS, 'fonts', 'CG-600.ttf'),
    'cgi': os.path.join(ASSETS, 'fonts', 'CGI-500.ttf'),
}.items()}


def glyphs(font, s, size, track=0.0):
    f = FONTS[font]; gs = f.getGlyphSet(); cmap = f.getBestCmap(); k = size / f['head'].unitsPerEm
    out = []
    for c in s:
        g = cmap.get(ord(c)) or cmap[ord('?')]
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, 0, 0)))
        out.append((pen.getCommands(), f['hmtx'][g][0] * k + track * size))
    return out


def ancho(font, s, size, track=0.0):
    return sum(a for _, a in glyphs(font, s, size, track)) - track * size


def text(font, s, size, x, y, anchor='middle', track=0.0, rot=0):
    """Texto a curvas. (x, y) = línea base. anchor: start | middle | end. rot en grados alrededor de (x, y)."""
    gl = glyphs(font, s, size, track)
    width = sum(a for _, a in gl) - track * size
    cx = -(width / 2 if anchor == 'middle' else width if anchor == 'end' else 0)
    parts = []
    for d, a in gl:
        if d: parts.append(f'<path transform="translate({cx:.3f} 0)" d="{d}"/>')
        cx += a
    g = f'<g transform="translate({x:.3f} {y:.3f}) rotate({rot})">' + ''.join(parts) + '</g>'
    return g


def texto_arco(font, s, size, cx, cy, r, ang0=-90.0, track=0.0, completo=False):
    """Texto sobre un círculo (se lee en sentido horario, letras hacia afuera). completo=True reparte el
    tracking para cerrar exactamente 360°. Devuelve un <g> de trazos."""
    gl = glyphs(font, s, size, track)
    if completo:
        base = sum(a for _, a in glyphs(font, s, size, 0.0))
        track = (2 * math.pi * r - base) / len(s) / size
        gl = glyphs(font, s, size, track)
    total = sum(a for _, a in gl)
    cum, partes = 0.0, []
    a0 = math.radians(ang0) - (total / r) / 2
    for d, adv in gl:
        th = a0 + (cum + adv / 2) / r
        if d:
            partes.append(f'<path transform="translate({cx:.3f} {cy:.3f}) rotate({math.degrees(th) + 90:.3f}) translate({-adv / 2:.3f} {-r:.3f})" d="{d}"/>')
        cum += adv
    return '<g>' + ''.join(partes) + '</g>'


def envolver(font, s, size, maxw, track=0.0):
    lineas, actual = [], ''
    for palabra in s.split():
        prueba = (actual + ' ' + palabra).strip()
        if ancho(font, prueba, size, track) <= maxw or not actual: actual = prueba
        else: lineas.append(actual); actual = palabra
    if actual: lineas.append(actual)
    return lineas


def cargar(n): return json.load(open(os.path.join(ASSETS, n)))
lock, flor, firma = cargar('lockup-trace.json'), cargar('flor-trace.json'), cargar('firma-trace.json')


def bbox(d):
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', d)))
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)


LP = {'flor': [], 'gara': [], 'tag': []}
for sub in re.findall(r'M[^M]+', lock['d']):
    y = float(re.findall(r'-?\d+\.?\d*', sub)[1])
    LP['flor' if y < 1000 else 'gara' if y < 1850 else 'tag'].append(sub)
LP = {k: ' '.join(v) for k, v in LP.items()}
FLOR = flor['d']
FLOR_SOLIDA = re.findall(r'M[^M]+', FLOR)[0] + ' Z'
FBOX = bbox(FLOR)          # la flor es casi cuadrada: 1651 x 1666
FW, FH = FBOX[2] - FBOX[0], FBOX[3] - FBOX[1]


def colocar(d, cx, cy, ancho_mm, id_=None):
    """Coloca un trazo centrado en (cx, cy) con el ancho dado (mm). Devuelve el elemento <path> con transform."""
    x0, y0, x1, y1 = bbox(d); s = ancho_mm / (x1 - x0)
    return f'<path fill-rule="evenodd" transform="translate({cx - (x0 + x1) / 2 * s:.3f} {cy - (y0 + y1) / 2 * s:.3f}) scale({s:.6f})" d="{d}"/>'


def flor_en(cx, cy, diam):
    return colocar(FLOR, cx, cy, diam)


def gara_en(cx, cy, ancho_mm):
    return colocar(LP['gara'], cx, cy, ancho_mm)


def flor_solida_en(cx, cy, diam):
    return colocar(FLOR_SOLIDA, cx, cy, diam)


def firma_en(cx, cy, ancho_mm):
    return colocar(firma['d'], cx, cy, ancho_mm)


def qr(url, x, y, size):
    js = f"require('qrcode').toString({json.dumps(url)},{{type:'svg',margin:0,errorCorrectionLevel:'M'}},(e,s)=>process.stdout.write(s))"
    svg = subprocess.check_output(['node', '-e', js], env={**os.environ, 'NODE_PATH': NODE_MODULES}).decode()
    n = int(re.search(r'viewBox="0 0 (\d+)', svg).group(1)); d = re.search(r'<path stroke="#000000" d="([^"]+)"', svg).group(1)
    return f'<path transform="translate({x} {y}) scale({size / n:.5f})" d="{d}" fill="none" stroke-width="1" stroke-linecap="butt"/>'


# ---------- primitivas de dibujo técnico ----------
def linea(x1, y1, x2, y2, w=0.2, dash=None, cap='butt'):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<path d="M{x1:.3f} {y1:.3f}L{x2:.3f} {y2:.3f}" fill="none" stroke-width="{w}"{d} stroke-linecap="{cap}"/>'


def rect(x, y, w, h, sw=0.2, r=0):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="none" stroke-width="{sw}"/>'


def circulo(cx, cy, r, w=0.2, dash=None):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<circle cx="{cx:.3f}" cy="{cy:.3f}" r="{r:.3f}" fill="none" stroke-width="{w}"{d}/>'


def flecha(x, y, ang, largo=2.1, ancho_=0.75):
    """Punta de flecha rellena con la punta en (x, y) apuntando hacia 'ang' grados (0 = derecha)."""
    a = math.radians(ang); ux, uy = math.cos(a), math.sin(a); nx, ny = -uy, ux
    bx, by = x - ux * largo, y - uy * largo
    return f'<path d="M{x:.3f} {y:.3f}L{bx + nx * ancho_:.3f} {by + ny * ancho_:.3f}L{bx - nx * ancho_:.3f} {by - ny * ancho_:.3f}Z" stroke-width="0"/>'


def arco(cx, cy, r, a0, a1, w=0.2):
    """Arco de a0 a a1 grados (0 = derecha, crece en sentido horario en pantalla)."""
    p0 = (cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0)))
    p1 = (cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1)))
    grande = 1 if abs(a1 - a0) > 180 else 0; barrido = 1 if a1 > a0 else 0
    return f'<path d="M{p0[0]:.3f} {p0[1]:.3f}A{r:.3f} {r:.3f} 0 {grande} {barrido} {p1[0]:.3f} {p1[1]:.3f}" fill="none" stroke-width="{w}"/>'


def svg_doc(capas, estilos, bg=None, defs=''):
    cuerpo = ''.join(f'<g id="{n}" {st}>' + ''.join(capas[n]) + '</g>' for n, st in estilos if n in capas and capas[n])
    fondo = f'<rect width="{W}" height="{H}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">'
            f'<defs>{defs}</defs>{fondo}{cuerpo}</svg>')


# degradados de foil en coordenadas de la hoja. Se aplican con una máscara sobre un rectángulo de hoja completa,
# para que ningún trazo (con su propio transform/scale) deforme el degradado.
GRADS = {
    'oro': [(0, '#8a5a2b'), (.22, '#f0cc94'), (.44, '#b27a43'), (.66, '#f7dca8'), (.86, '#b88049'), (1, '#93602f')],
    'cobre': [(0, '#6f4521'), (.25, '#c28c4d'), (.5, '#8a5a2b'), (.75, '#cf9a5a'), (1, '#74491f')],
}


def _grad(nombre):
    st = ''.join(f'<stop offset="{o}" stop-color="{c}"/>' for o, c in GRADS[nombre])
    return (f'<linearGradient id="g-{nombre}" gradientUnits="userSpaceOnUse" x1="14" y1="8" x2="128" y2="104" spreadMethod="reflect">{st}</linearGradient>')


DEFS_PREVIA = (_grad('oro') + _grad('cobre') +
               '<filter id="relieve" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108"><feGaussianBlur in="SourceAlpha" stdDeviation="0.2" result="b"/>'
               '<feSpecularLighting in="b" surfaceScale="2" specularConstant="0.55" specularExponent="22" lighting-color="#fff" result="s">'
               '<feDistantLight azimuth="225" elevation="35"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="h"/>'
               '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="h"/></feMerge></filter>'
               '<filter id="grabado" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108"><feGaussianBlur in="SourceAlpha" stdDeviation="0.35" result="b"/>'
               '<feSpecularLighting in="b" surfaceScale="3" specularConstant="0.5" specularExponent="14" lighting-color="#d9c9a6" result="s">'
               '<feDistantLight azimuth="225" elevation="38"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="h"/>'
               '<feOffset dx="-0.18" dy="-0.18" in="SourceAlpha" result="o"/><feGaussianBlur in="o" stdDeviation="0.2" result="ob"/>'
               '<feFlood flood-color="#000" flood-opacity=".7"/><feComposite in2="ob" operator="in" result="sombra"/>'
               '<feMerge><feMergeNode in="sombra"/><feMergeNode in="SourceGraphic"/><feMergeNode in="h"/></feMerge></filter>'
               '<filter id="brillo" filterUnits="userSpaceOnUse" x="0" y="0" width="158" height="108"><feGaussianBlur in="SourceAlpha" stdDeviation="0.28" result="b"/>'
               '<feSpecularLighting in="b" surfaceScale="1.6" specularConstant="0.9" specularExponent="26" lighting-color="#e8e2d8" result="s">'
               '<feDistantLight azimuth="225" elevation="42"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="h"/>'
               '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="h"/></feMerge></filter>')


def previa_svg(capas, bg, tinta='#100c09', gofrado=None, foil='oro', uv=None, extra_defs=''):
    """Vista previa simulada: papel + tinta + gofrado + (barniz UV) + foil con brillo."""
    defs, cuerpo = DEFS_PREVIA + extra_defs, ''
    if capas.get('impresion'):
        cuerpo += f'<g fill="{tinta}" stroke="{tinta}" stroke-width="0">' + ''.join(capas['impresion']) + '</g>'
    if gofrado and capas.get('gofrado'):
        cuerpo += f'<g fill="{gofrado}" stroke-width="0" filter="url(#grabado)">' + ''.join(capas['gofrado']) + '</g>'
    if uv and capas.get('uv'):
        cuerpo += f'<g fill="{uv}" stroke="{uv}" stroke-width="0" filter="url(#brillo)">' + ''.join(capas['uv']) + '</g>'
    if capas.get('foil'):
        defs += (f'<mask id="m-foil" maskUnits="userSpaceOnUse" x="0" y="0" width="{W}" height="{H}"><g fill="#fff" stroke="#fff" stroke-width="0">'
                 + ''.join(capas['foil']) + '</g></mask>')
        cuerpo += f'<g filter="url(#relieve)"><rect width="{W}" height="{H}" fill="url(#g-{foil})" mask="url(#m-foil)"/></g>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}">'
            f'<defs>{defs}</defs><rect width="{W}" height="{H}" fill="{bg}"/>{cuerpo}</svg>')


def exportar(nombre, capas, salida, previa):
    """Escribe una placa SVG por capa (negro 100 %) y la vista previa simulada."""
    os.makedirs(salida, exist_ok=True)
    for capa, elems in capas.items():
        if elems:
            open(os.path.join(salida, f'{nombre}-{capa}.svg'), 'w').write(
                svg_doc({capa: elems}, [(capa, 'fill="#000" stroke="#000" stroke-width="0"')], bg='#fff'))
    open(os.path.join(salida, f'{nombre}-vista.svg'), 'w').write(previa)
