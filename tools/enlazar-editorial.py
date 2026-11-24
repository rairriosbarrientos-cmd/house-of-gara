#!/usr/bin/env python3
"""Enlaza el sistema editorial (nfc/editorial.css + coleccion.js / ficha.js) en inicio, /productos/ y las fichas. Idempotente.
Uso: python3 tools/enlazar-editorial.py /ruta/a/house-of-gara"""
import glob, os, sys
R = sys.argv[1] if len(sys.argv) > 1 else '.'
CSS = '<link rel="stylesheet" href="/nfc/editorial.css?v=1"/>'
JS = {'productos/index.html': '<script src="/nfc/coleccion.js?v=1" async=""></script>'}
for f in glob.glob(os.path.join(R, 'productos', '*', 'index.html')):
    JS[os.path.relpath(f, R)] = '<script src="/nfc/ficha.js?v=1" async=""></script>'
JS['index.html'] = ''
n = 0
for rel, js in JS.items():
    p = os.path.join(R, rel)
    s = open(p, encoding='utf-8').read()
    if '/nfc/editorial.css' in s or '</head>' not in s: continue
    open(p, 'w', encoding='utf-8').write(s.replace('</head>', CSS + js + '</head>', 1)); n += 1
print('páginas enlazadas:', n, 'de', len(JS))
