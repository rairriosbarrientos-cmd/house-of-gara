# Flor GARA "con venas": la flor oficial (contorno y pétalos en forma de corazón) con las nervaduras grabadas
# dentro de cada pétalo, como el relieve de la carta actual. Todo en coordenadas del trazo original.
import math, os, random, re, sys
import numpy as np

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'carta-v3', 'generador'))
from lib import FLOR, FBOX, bbox

TOK = re.compile(r'[MCLZ]|-?\d+\.?\d*')


def aplanar(sub, pasos=10):
    """Subtrazo (M, L, C absolutos) -> lista de puntos."""
    t = TOK.findall(sub); i = 0; pts = []; cur = None; cmd = None
    while i < len(t):
        if t[i] in 'MCLZ':
            cmd = t[i]; i += 1
            if cmd == 'Z': continue
        if cmd == 'M':
            cur = (float(t[i]), float(t[i + 1])); i += 2; pts.append(cur); cmd = 'L'
        elif cmd == 'L':
            cur = (float(t[i]), float(t[i + 1])); i += 2; pts.append(cur)
        elif cmd == 'C':
            p1 = (float(t[i]), float(t[i + 1])); p2 = (float(t[i + 2]), float(t[i + 3])); p3 = (float(t[i + 4]), float(t[i + 5])); i += 6
            for k in range(1, pasos + 1):
                u = k / pasos; a = (1 - u) ** 3; b = 3 * (1 - u) ** 2 * u; c = 3 * (1 - u) * u ** 2; d = u ** 3
                pts.append((a * cur[0] + b * p1[0] + c * p2[0] + d * p3[0], a * cur[1] + b * p1[1] + c * p2[1] + d * p3[1]))
            cur = p3
    return np.array(pts)


SUBS = re.findall(r'M[^M]+', FLOR)
POL = [aplanar(s) for s in SUBS]
AREAS = [(p[:, 0].max() - p[:, 0].min()) * (p[:, 1].max() - p[:, 1].min()) for p in POL]
IDX_CENTRO = int(np.argmin(AREAS))
IDX_PETALOS = [i for i in range(1, len(POL)) if i != IDX_CENTRO]
CENTRO = POL[IDX_CENTRO].mean(axis=0)          # centro de la flor (en unidades del trazo)
ESC_UNIDAD = (FBOX[2] - FBOX[0])               # ancho total de la flor en unidades


def intervalos(p0, ang, poly):
    """Distancias t (a lo largo del rayo desde p0 con ángulo ang) donde el rayo cruza el polígono, ordenadas."""
    dx, dy = math.cos(ang), math.sin(ang)
    a = poly; b = np.roll(poly, -1, axis=0)
    ex, ey = b[:, 0] - a[:, 0], b[:, 1] - a[:, 1]
    den = dx * ey - dy * ex
    ok = np.abs(den) > 1e-9
    wx, wy = a[:, 0] - p0[0], a[:, 1] - p0[1]
    t = np.where(ok, (wx * ey - wy * ex) / np.where(ok, den, 1), -1)
    s = np.where(ok, (wx * dy - wy * dx) / np.where(ok, den, 1), -1)
    hit = ok & (t > 1e-6) & (s >= 0) & (s <= 1)
    return np.sort(t[hit])


def venas_petalo(poly, rng, paso_mm, ancho_unidad_mm):
    """Venas de un pétalo: abanico desde la base del corazón hacia su borde."""
    k = ancho_unidad_mm                       # mm por unidad
    d = np.hypot(poly[:, 0] - CENTRO[0], poly[:, 1] - CENTRO[1])
    base = poly[int(np.argmin(d))]            # punta del corazón (la más cercana al centro)
    cen = poly.mean(axis=0)
    eje = math.atan2(cen[1] - base[1], cen[0] - base[0])
    L = float(np.max(np.hypot(poly[:, 0] - base[0], poly[:, 1] - base[1])))      # largo del pétalo (unidades)
    apex = np.array([base[0] + 0.05 * L * math.cos(eje), base[1] + 0.05 * L * math.sin(eje)])
    th = math.radians(62)
    Lmm = L * k
    n = max(9, int(round(2 * th * Lmm / paso_mm)))
    lineas = []
    for j in range(n):
        v = -1 + 2 * j / (n - 1)
        nivel = 0 if j % 4 == 0 else 1 if j % 4 == 2 else 2
        ang = eje + v * th
        ts = intervalos(apex, ang, poly)
        if len(ts) == 0: continue
        t1 = ts[0]                                   # primer cruce = salida del pétalo
        corte = {0: 0.0, 1: 0.20, 2: 0.45}[nivel] * t1
        s0 = corte + rng.uniform(0, 0.8) / k
        s1 = t1 - (0.8 + rng.uniform(0, 1.8) * (0.35 + 0.65 * abs(v))) / k
        if (s1 - s0) * k < 3.5: continue
        pts = []
        m = 14
        for q in range(m + 1):
            u = q / m; r = s0 + (s1 - s0) * u
            desv = (0.13 * v * (1 - v * v) * u * u + 0.010 * math.sin(6.5 * u + j * 1.7)) * (s1 - s0)      # apertura suave + pulso de mano
            pts.append((apex[0] + r * math.cos(ang) - desv * math.sin(ang), apex[1] + r * math.sin(ang) + desv * math.cos(ang)))
        lineas.append(pts)
    return lineas


def todas_las_venas(paso_mm=0.95, ancho_mm=64.0, semilla=7):
    rng = random.Random(semilla)
    k = ancho_mm / ESC_UNIDAD
    out = []
    for i in IDX_PETALOS:
        out += venas_petalo(POL[i], rng, paso_mm, k)
    return out


def trazo_venas(lineas, cx, cy, ancho_mm, grosor=0.2):
    """Convierte las venas a un <g> de caminos SVG en mm, centrado en (cx, cy)."""
    k = ancho_mm / ESC_UNIDAD
    mx = (FBOX[0] + FBOX[2]) / 2; my = (FBOX[1] + FBOX[3]) / 2
    ds = []
    for pts in lineas:
        q = [(cx + (x - mx) * k, cy + (y - my) * k) for x, y in pts]
        ds.append('M' + 'L'.join(f'{x:.2f} {y:.2f}' for x, y in q))
    return f'<path d="{" ".join(ds)}" fill="none" stroke-width="{grosor}" stroke-linecap="round" stroke-linejoin="round"/>'


if __name__ == '__main__':
    L = todas_las_venas()
    print('venas:', len(L), 'petalos:', len(IDX_PETALOS), 'centro:', CENTRO)
