# Textura de piel (grano plena flor) y de papel, generadas con numpy. Sirven para la vista previa y como capa impresa.
import struct, zlib
import numpy as np
from scipy import ndimage as ndi
from scipy.spatial import cKDTree


def png_escribir(ruta, rgb):
    h, w, c = rgb.shape
    crudo = b''.join(b'\x00' + rgb[y].tobytes() for y in range(h))
    def chunk(t, d):
        return struct.pack('>I', len(d)) + t + d + struct.pack('>I', zlib.crc32(t + d) & 0xffffffff)
    open(ruta, 'wb').write(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2 if c == 3 else 6, 0, 0, 0))
                           + chunk(b'IDAT', zlib.compress(crudo, 6)) + chunk(b'IEND', b''))


def ruido(h, w, celda, rng):
    gh, gw = int(h / celda) + 4, int(w / celda) + 4
    g = rng.random((gh, gw))
    z = ndi.zoom(g, (h / (gh - 3) , w / (gw - 3)), order=3, mode='reflect')
    return z[:h, :w] if z.shape[0] >= h and z.shape[1] >= w else np.pad(z, ((0, max(0, h - z.shape[0])), (0, max(0, w - z.shape[1]))), mode='edge')[:h, :w]


def fbm(h, w, celda, octavas, rng, persist=0.5):
    out = np.zeros((h, w)); amp = 1.0; tot = 0
    for o in range(octavas):
        out += amp * ruido(h, w, max(2, celda / (2 ** o)), rng); tot += amp; amp *= persist
    out /= tot
    return (out - out.min()) / (out.max() - out.min() + 1e-9)


def celular(h, w, celda, rng):
    gy, gx = int(np.ceil(h / celda)) + 2, int(np.ceil(w / celda)) + 2
    iy, ix = np.mgrid[0:gy, 0:gx]
    py = (iy + rng.random((gy, gx)) * 0.9 - 0.45) * celda
    px = (ix + rng.random((gy, gx)) * 0.9 - 0.45) * celda
    pts = np.stack([px.ravel(), py.ravel()], 1)
    tree = cKDTree(pts)
    yy, xx = np.mgrid[0:h, 0:w]
    d, idx = tree.query(np.stack([xx.ravel(), yy.ravel()], 1), k=2, workers=-1)
    return d[:, 0].reshape(h, w), d[:, 1].reshape(h, w), idx[:, 0].reshape(h, w), len(pts)


def pliegues(h, w, px_mm, rng, n=3):
    """Unos pocos pliegues largos y suaves (como una piel pull-up), no mapa de curvas."""
    pts = []
    for _ in range(n):
        x0, y0 = rng.uniform(-0.1, 1.1) * w, rng.uniform(-0.1, 1.1) * h
        ang = rng.uniform(1.0, 2.2); largo = rng.uniform(0.25, 0.5) * w
        ctrl = rng.uniform(-0.45, 0.45) * largo
        t = np.linspace(0, 1, 120)
        x = x0 + np.cos(ang) * largo * (t - 0.5) - np.sin(ang) * ctrl * 4 * t * (1 - t)
        y = y0 + np.sin(ang) * largo * (t - 0.5) + np.cos(ang) * ctrl * 4 * t * (1 - t)
        pts.append(np.stack([x, y], 1))
    pts = np.concatenate(pts)
    tree = cKDTree(pts)
    yy, xx = np.mgrid[0:h, 0:w]
    d, _ = tree.query(np.stack([xx.ravel(), yy.ravel()], 1), k=1, workers=-1)
    d = d.reshape(h, w) / px_mm
    oscuro = np.exp(-(d / 1.5) ** 2) * 0.8
    luz = np.exp(-((d - 2.6) / 1.2) ** 2) * 0.5
    return ndi.gaussian_filter(oscuro, 1.0), ndi.gaussian_filter(luz, 1.0)


def piel(w, h, px_mm, semilla=3, ambar=1.0, brillo=1.0, pliegue=0.0):
    """Piel negra de grano plena flor con pliegues y reflejos ámbar. w,h en píxeles; px_mm = píxeles por mm."""
    rng = np.random.default_rng(semilla)
    celda = 0.95 * px_mm                                    # grano de ~0.95 mm
    F1, F2, idx, n = celular(h, w, celda, rng)
    var = rng.random(n)[idx]
    borde = np.clip((F2 - F1) / (0.30 * celda), 0, 1)
    borde = borde * borde * (3 - 2 * borde)
    cupula = np.clip(1 - (F1 / (0.62 * celda)) ** 2, 0, 1)
    gr = borde * (0.55 + 0.45 * cupula) * (0.82 + 0.18 * var)
    gr = ndi.gaussian_filter(gr, 0.55 * px_mm / 4 + 0.4)
    # micrograno fino
    mg = ndi.gaussian_filter(rng.standard_normal((h, w)), 0.8) * 0.5
    # ondulaciones amplias (pliegues) y pliegues finos tipo arruga
    amplio = fbm(h, w, 38 * px_mm, 4, rng)
    medio = fbm(h, w, 9 * px_mm, 4, rng)
    pl_oscuro, pl_luz = pliegues(h, w, px_mm, rng)
    altura = gr * 1.0 + 0.10 * mg + 0.9 * ndi.gaussian_filter(amplio, 3 * px_mm) * 0.0
    # normales por gradiente
    gy, gx = np.gradient(altura * (1.0))
    k = 2.2
    nx, ny, nz = -gx * k * px_mm, -gy * k * px_mm, np.ones_like(altura)
    ln = np.sqrt(nx * nx + ny * ny + nz * nz); nx, ny, nz = nx / ln, ny / ln, nz / ln
    L = np.array([-0.45, -0.55, 0.70]); L /= np.linalg.norm(L)
    Hh = L + np.array([0, 0, 1.0]); Hh /= np.linalg.norm(Hh)
    dif = np.clip(nx * L[0] + ny * L[1] + nz * L[2], 0, 1)
    esp = np.clip(nx * Hh[0] + ny * Hh[1] + nz * Hh[2], 0, 1) ** 46
    # pliegues grandes: luz suave variable
    luz = 0.78 + 0.5 * (ndi.gaussian_filter(amplio, 6 * px_mm / 4) - 0.5) + 0.25 * (medio - 0.5)
    # zonas ámbar (reflejo cálido de la piel) y oscuras
    mancha = np.clip((ndi.gaussian_filter(amplio, 2 * px_mm) - 0.47) * 2.6, 0, 1) ** 1.4 * ambar
    mancha2 = np.clip((ndi.gaussian_filter(fbm(h, w, 60 * px_mm, 3, rng), 3 * px_mm) - 0.55) * 3.0, 0, 1) * 0.5 * ambar
    base = np.array([27, 20, 15], float)
    calido = np.array([104, 62, 25], float)
    alb = base[None, None, :] * (1 - 0)
    mezcla = np.clip(mancha * 0.5 + mancha2 * 0.4, 0, 0.5)
    rgb = base[None, None, :] * (1 - mezcla[..., None]) + calido[None, None, :] * mezcla[..., None]
    rgb *= (0.62 + 0.55 * dif)[..., None] * luz[..., None]
    rgb *= (1 - 0.42 * pliegue * pl_oscuro)[..., None]
    rgb += (pl_luz * 16 * pliegue)[..., None]
    rgb += (esp * 60 * brillo)[..., None] * np.array([1.0, 0.88, 0.70])[None, None, :] * (0.4 + 0.6 * mezcla[..., None] + 0.25)
    rgb = np.clip(rgb, 0, 255)
    # viñeta suave
    yy, xx = np.mgrid[0:h, 0:w]
    v = 1 - 0.35 * (((xx / w - 0.5) / 0.75) ** 2 + ((yy / h - 0.5) / 0.75) ** 2)
    rgb *= np.clip(v, 0.55, 1)[..., None]
    return np.clip(rgb, 0, 255).astype(np.uint8)


def papel(w, h, px_mm, semilla=2):
    """Papel de algodón marfil: grano fino, fibras alargadas y variación suave."""
    rng = np.random.default_rng(semilla)
    base = np.array([244, 238, 226], float)
    fibra = ndi.gaussian_filter(rng.standard_normal((h, w)), 0.7) * 1.7
    fibra2 = ndi.gaussian_filter(rng.standard_normal((h, w)), [0.6, 3.2]) * 1.0
    amplio = (fbm(h, w, 30 * px_mm, 3, rng) - 0.5) * 6
    yy, xx = np.mgrid[0:h, 0:w]
    v = 1 - 0.06 * (((xx / w - .5) / .75) ** 2 + ((yy / h - .5) / .75) ** 2)
    rgb = (base[None, None, :] + (fibra + fibra2 + amplio)[..., None]) * v[..., None]
    return np.clip(rgb, 0, 255).astype(np.uint8)


if __name__ == '__main__':
    import time, sys
    t = time.time()
    px = 10
    a = piel(158 * px, 108 * px, px)
    png_escribir('piel-prueba.png', a)
    print('ok', a.shape, round(time.time() - t, 1), 's')
