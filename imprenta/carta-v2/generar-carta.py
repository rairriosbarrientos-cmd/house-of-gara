# Carta GARA v2 — 152 x 102 mm (+3 mm sangrado). Capas: impresion, barniz (UV sectorizado), foil, gofrado.
import json, re, os, sys, math, subprocess
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

D = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1]
os.makedirs(OUT, exist_ok=True)
W, H, B = 158.0, 108.0, 3.0
TW, TH = 152.0, 102.0
CX, CY = W / 2, H / 2

FONTS = {k: TTFont(os.path.join(D, 'fonts', f)) for k, f in
         {'cg5': 'CG-500.ttf', 'cg6': 'CG-600.ttf', 'cgi': 'CGI-500.ttf', 'ms5': 'MS-500.ttf', 'ms4': 'MS-400.ttf'}.items()}

def glyphs(font, s, size, track=0.0):
    f = FONTS[font]; gs = f.getGlyphSet(); cmap = f.getBestCmap(); k = size / f['head'].unitsPerEm
    out = []
    for c in s:
        g = cmap[ord(c)]; pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, 0, 0)))
        out.append((pen.getCommands(), f['hmtx'][g][0] * k + track * size))
    return out

def text(font, s, size, x, y, anchor='middle', track=0.0):
    gl = glyphs(font, s, size, track)
    width = sum(a for _, a in gl) - track * size
    cx = x - (width / 2 if anchor == 'middle' else width if anchor == 'end' else 0)
    parts = []
    for d, a in gl:
        if d: parts.append(f'<path transform="translate({cx:.3f} {y:.3f})" d="{d}"/>')
        cx += a
    return ''.join(parts), width

def circle_text(font, s, size, cx, cy, r, centro=''):
    """Texto alrededor de un círculo (base hacia el centro), repartido para cerrar la vuelta."""
    gl = glyphs(font, s, size)
    total = sum(a for _, a in gl); extra = (2 * math.pi * r - total) / len(gl)
    pos = -(sum(a for _, a in glyphs(font, centro, size)) + extra * len(centro)) / 2 if centro else 0; parts = []
    for d, a in gl:
        a2 = a + extra
        th = (pos + a / 2) / r  # ángulo del centro del glifo
        deg = math.degrees(th)
        if d: parts.append(f'<path transform="translate({cx:.3f} {cy:.3f}) rotate({deg:.3f}) translate({-a/2:.3f} {-r:.3f})" d="{d}"/>')
        pos += a2
    return ''.join(parts)

def load(n): return json.load(open(os.path.join(D, n)))
lock, flor, firma = load('lockup-trace.json'), load('flor-trace.json'), load('firma-trace.json')

def bbox(d):
    nums = list(map(float, re.findall(r'-?\d+\.?\d*', d)))
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)

LP = {'flor': [], 'gara': [], 'tag': []}
for sub in re.findall(r'M[^M]+', lock['d']):
    y = float(re.findall(r'-?\d+\.?\d*', sub)[1])
    LP['flor' if y < 1000 else 'gara' if y < 1850 else 'tag'].append(sub)
LP = {k: ' '.join(v) for k, v in LP.items()}

def place(d, cx, top, w):
    x0, y0, x1, y1 = bbox(d); s = w / (x1 - x0)
    return f'<path fill-rule="evenodd" transform="translate({cx - w/2 - x0*s:.3f} {top - y0*s:.3f}) scale({s:.6f})" d="{d}"/>', (y1 - y0) * s

def place_c(d, cx, cy, w):
    x0, y0, x1, y1 = bbox(d); s = w / (x1 - x0)
    return f'<path fill-rule="evenodd" transform="translate({cx - (x0+x1)/2*s:.3f} {cy - (y0+y1)/2*s:.3f}) scale({s:.6f})" d="{d}"/>'

FLOR = flor['d']

def qr(url, x, y, size):
    svg = subprocess.check_output(['node', '-e', f"require('qrcode').toString({json.dumps(url)},{{type:'svg',margin:0,errorCorrectionLevel:'M'}},(e,s)=>process.stdout.write(s))"], cwd=os.path.join(D, '..', 'og')).decode()
    n = int(re.search(r'viewBox="0 0 (\d+)', svg).group(1)); d = re.search(r'<path stroke="#000000" d="([^"]+)"', svg).group(1)
    return f'<path transform="translate({x} {y}) scale({size/n:.5f})" d="{d}" fill="none" stroke-width="1"/>'

def poly(pts, sw):
    return '<path fill="none" stroke-width="%s" d="M%s"/>' % (sw, ' L'.join(f'{x:.3f} {y:.3f}' for x, y in pts))

def rosette(cx, cy, R, a, p, copies, sw, b=0.0, q=0):
    out = []
    for k in range(copies):
        ph = 2 * math.pi * k / copies / p
        pts = []
        for i in range(0, 1441):
            t = 2 * math.pi * i / 1440
            r = R + a * math.cos(p * (t + ph)) + b * math.cos(q * (t - ph))
            pts.append((cx + r * math.cos(t), cy + r * math.sin(t)))
        out.append(poly(pts, sw))
    return ''.join(out)

def rope_frame(inset, gap, amp, wl, sw):
    """Marco de cordón guilloché: dos senoidales entrelazadas entre dos líneas."""
    x0, y0, x1, y1 = B + inset, B + inset, B + TW - inset, B + TH - inset
    mid = inset + gap / 2
    out = [f'<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="none" stroke-width="0.3"/>',
           f'<rect x="{x0+gap}" y="{y0+gap}" width="{x1-x0-2*gap}" height="{y1-y0-2*gap}" fill="none" stroke-width="0.15"/>']
    m = B + mid
    segs = [((m, m), (B + TW - mid, m)), ((B + TW - mid, m), (B + TW - mid, B + TH - mid)),
            ((B + TW - mid, B + TH - mid), (m, B + TH - mid)), ((m, B + TH - mid), (m, m))]
    for (ax, ay), (bx, by) in segs:
        L = math.hypot(bx - ax, by - ay); ux, uy = (bx - ax) / L, (by - ay) / L; nx, ny = -uy, ux
        n = max(2, round(L / wl)); wl2 = L / n
        for ph in (0, math.pi):
            pts = []
            for i in range(int(L / 0.2) + 1):
                s = min(i * 0.2, L); o = amp * math.sin(2 * math.pi * s / wl2 + ph)
                pts.append((ax + ux * s + nx * o, ay + uy * s + ny * o))
            out.append(poly(pts, sw))
    return ''.join(out)

def frente():
    L = {'impresion': [f'<rect width="{W}" height="{H}"/>'], 'barniz': [], 'foil': [], 'gofrado': []}
    # barniz UV: roseta guilloché grande detrás del sello y una segunda roseta interior
    L['barniz'].append(rosette(CX, CY, 37, 3.4, 22, 14, 0.14))
    L['barniz'].append(rosette(CX, CY, 25, 2.2, 16, 10, 0.14, b=0.8, q=48))
    L['foil'].append(rope_frame(4.5, 2.2, 0.55, 2.6, 0.18))
    # flores en las esquinas, dentro del marco
    for x, y in [(B + 12, B + 12), (B + TW - 12, B + 12), (B + 12, B + TH - 12), (B + TW - 12, B + TH - 12)]:
        L['foil'].append(place_c(FLOR, x, y, 5.2))
    # sello
    sy = B + 30
    seal = (f'<circle cx="{CX}" cy="{sy}" r="13" fill="none" stroke-width="0.32"/>'
            f'<circle cx="{CX}" cy="{sy}" r="9.6" fill="none" stroke-width="0.18"/>')
    dots = ''.join(f'<circle cx="{CX + 13.9*math.cos(2*math.pi*i/72):.3f}" cy="{sy + 13.9*math.sin(2*math.pi*i/72):.3f}" r="0.16"/>' for i in range(72))
    L['foil'].append(seal + dots)
    L['foil'].append(circle_text('ms5', 'ARCHIVO GARA · PIEZA ÚNICA · HECHO A MANO EN MÉXICO · ', 1.45, CX, sy, 10.55, centro='ARCHIVO GARA'))
    L['foil'].append(place_c(FLOR, CX, sy, 13.6))
    L['gofrado'].append(place_c(FLOR, CX, sy, 13.6) + seal)
    # GARA + tagline
    g, h = place(LP['gara'], CX, B + 50.5, 66); L['foil'].append(g)
    t, ht = place(LP['tag'], CX, B + 50.5 + h + 3.6, 56); L['foil'].append(t)
    yb = B + 50.5 + h + 3.6 + ht + 7.5
    L['foil'].append(f'<rect x="{CX-17}" y="{yb-0.1}" width="13" height="0.2"/><rect x="{CX+4}" y="{yb-0.1}" width="13" height="0.2"/>')
    L['foil'].append(place_c(FLOR, CX, yb, 4.2))
    return L

def reverso():
    L = {'impresion': [], 'barniz': [], 'foil': []}
    # marca de agua en barniz detrás del texto
    L['barniz'].append(f'<clipPath id="arriba"><rect x="0" y="0" width="{W}" height="{B+70.5}"/></clipPath><g clip-path="url(#arriba)">' + place_c(FLOR, CX, B + 40, 58) + '</g>')
    L['foil'].append(f'<rect x="{B+5}" y="{B+5}" width="{TW-10}" height="{TH-10}" fill="none" stroke-width="0.22"/>')
    for x, y in [(B + 9.5, B + 9.5), (B + TW - 9.5, B + 9.5)]:
        L['foil'].append(place_c(FLOR, x, y, 3.6))
    L['foil'].append(place_c(FLOR, CX, B + 12, 9))
    d, _ = text('cgi', 'Gracias por elegir GARA', 6.6, CX, B + 25.2); L['foil'].append(d)
    L['foil'].append(f'<rect x="{CX-16}" y="{B+28.6}" width="12" height="0.2"/><rect x="{CX+4}" y="{B+28.6}" width="12" height="0.2"/>')
    L['foil'].append(place_c(FLOR, CX, B + 28.7, 2.6))
    lines = ['Esta pieza fue cortada, cosida y terminada a mano,',
             'una sola vez y para una sola persona.',
             'Con el tiempo su piel cambiará contigo:',
             'cada marca que gane será parte de su historia.']
    for i, l in enumerate(lines):
        d, _ = text('cg5', l, 3.6, CX, B + 35.5 + i * 4.6); L['impresion'].append(d)
    d, _ = text('cgi', 'Cuídala. Úsala. Vívela.', 4.3, CX, B + 56.5); L['foil'].append(d)
    f, fh = place(firma['d'], CX, B + 58.6, 21); L['foil'].append(f)
    d, _ = text('ms5', 'ATELIER GARA', 1.3, CX, B + 58.6 + fh + 2.4, track=0.35); L['impresion'].append(d)
    yb = B + 71.5
    L['impresion'].append(f'<rect x="{B+9}" y="{yb}" width="{TW-18}" height="0.14"/>')
    L['impresion'].append(qr('https://garaleathergoods.mx/autentica/', B + 10, yb + 4, 16))
    d, _ = text('ms5', 'CONOCE SU HISTORIA', 1.55, B + 30, yb + 8, anchor='start', track=0.22); L['impresion'].append(d)
    for i, l in enumerate(['Escanea para ver el certificado', 'y el registro de tu pieza en', 'el Archivo GARA.']):
        d, _ = text('cg5', l, 2.95, B + 30, yb + 12.3 + i * 3.5, anchor='start'); L['impresion'].append(d)
    fx, fw = B + 84, 58
    for i, lab in enumerate(['PARA', 'PIEZA', 'CÓDIGO']):
        yy = yb + 7.5 + i * 6
        d, _ = text('ms5', lab, 1.5, fx, yy, anchor='start', track=0.22); L['impresion'].append(d)
        L['foil'].append(f'<rect x="{fx+13}" y="{yy+0.2}" width="{fw-13}" height="0.18"/>')
    return L

def svg(layers, styles, bg=None, defs=''):
    body = ''.join(f'<g id="{n}" {st}>' + ''.join(layers[n]) + '</g>' for n, st in styles if n in layers and layers[n])
    bgr = f'<rect width="{W}" height="{H}" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}mm" height="{H}mm" viewBox="0 0 {W} {H}"><defs>{defs}</defs>{bgr}{body}</svg>'

DEFS = ('<linearGradient id="oro" x1="0" y1="0" x2="1" y2="1">'
        '<stop offset="0" stop-color="#8a5a2b"/><stop offset=".28" stop-color="#e8bf84"/><stop offset=".46" stop-color="#a8713d"/>'
        '<stop offset=".68" stop-color="#f3d39f"/><stop offset=".86" stop-color="#b47c45"/><stop offset="1" stop-color="#8f5d2d"/></linearGradient>'
        '<filter id="relieve" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur in="SourceAlpha" stdDeviation="0.25" result="b"/>'
        '<feSpecularLighting in="b" surfaceScale="2" specularConstant="0.7" specularExponent="20" lighting-color="#fff" result="s">'
        '<feDistantLight azimuth="225" elevation="35"/></feSpecularLighting><feComposite in="s" in2="SourceAlpha" operator="in" result="h"/>'
        '<feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="h"/></feMerge></filter>')

def write(n, c): open(os.path.join(OUT, n), 'w').write(c)

for lado, L, papel, tinta, barniz in [('frente', frente(), '#120e0b', '#120e0b', '#2b221a'),
                                      ('reverso', reverso(), '#f4efe6', '#2e2118', '#ede6da')]:
    for capa in L:
        if L[capa]: write(f'{lado}-{capa}.svg', svg({capa: L[capa]}, [(capa, 'fill="#000" stroke="#000" stroke-width="0"')], bg='#fff'))
    styles = [('barniz', f'fill="{barniz}" stroke="{barniz}" stroke-width="0"'),
              ('impresion', f'fill="{tinta}" stroke="{tinta}" stroke-width="0"'),
              ('foil', 'fill="url(#oro)" stroke="url(#oro)" stroke-width="0" filter="url(#relieve)"')]
    write(f'{lado}-vista.svg', svg(L, styles, bg=papel, defs=DEFS))
print('ok')
