#!/usr/bin/env python3
"""Genera nfc/cuidado/<codigo>.ics para cada pieza registrada (avisos de cuidado cada 3 meses).
Uso: python3 tools/cuidado-ics.py /ruta/a/house-of-gara"""
import os, re, sys, html, datetime
SITIO = sys.argv[1]
MESES = {m: i + 1 for i, m in enumerate(['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'])}

def esc(t): return t.replace('\\', '\\\\').replace(';', '\;').replace(',', '\\,').replace('\n', '\\n')
def fold(line):
    b = line.encode('utf-8'); out = []
    while len(b) > 74:
        cut = 74
        while (b[cut] & 0xC0) == 0x80: cut -= 1
        out.append(b[:cut].decode()); b = b' ' + b[cut:]
    out.append(b.decode()); return '\r\n'.join(out)
def mas_meses(d, n):
    m = d.month - 1 + n; y = d.year + m // 12; m = m % 12 + 1
    return datetime.date(y, m, min(d.day, 28))

os.makedirs(os.path.join(SITIO, 'nfc', 'cuidado'), exist_ok=True)
hechos = 0
for d in sorted(os.listdir(os.path.join(SITIO, 'verify'))):
    if not re.fullmatch(r'gara-\d{6}', d): continue
    h = open(os.path.join(SITIO, 'verify', d, 'index.html'), encoding='utf-8').read()
    t = re.search(r'<title>(.*?) · (GA-[A-Z]+-\d+-\d{6}) — GARA Registry</title>', h)
    f = re.search(r'(\d{1,2}) de ([a-z]+) de (20\d\d)', h)
    if not t or not f: continue
    nombre, codigo = html.unescape(t.group(1)), t.group(2)
    reg = datetime.date(int(f.group(3)), MESES[f.group(2)], int(f.group(1)))
    ini = mas_meses(reg, 3); fin = ini + datetime.timedelta(days=1)
    url = f'https://garaleathergoods.mx/verify/{d}/'
    desc = (f'Hora de consentir tu {nombre}:\n'
            '1. Límpiala con un paño seco o apenas húmedo.\n'
            '2. Aplica un poco de acondicionador para piel y deja que absorba.\n'
            '3. Guárdala lejos del sol directo y la humedad.\n\n'
            f'Tu certificado: {url}')
    lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//GARA Atelier//Cuidado//ES', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
             'BEGIN:VEVENT', f'UID:cuidado-{codigo.lower()}@garaleathergoods.mx',
             'DTSTAMP:' + datetime.datetime.utcnow().strftime('%Y%m%dT%H%M%SZ'),
             'DTSTART;VALUE=DATE:' + ini.strftime('%Y%m%d'), 'DTEND;VALUE=DATE:' + fin.strftime('%Y%m%d'),
             'RRULE:FREQ=MONTHLY;INTERVAL=3;COUNT=12',
             'SUMMARY:' + esc(f'Cuidado GARA · Hidrata tu {nombre}'),
             'DESCRIPTION:' + esc(desc), 'URL:' + url, 'TRANSP:TRANSPARENT',
             'BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + esc(f'Hidrata tu {nombre} GARA'), 'TRIGGER:PT10H', 'END:VALARM',
             'END:VEVENT', 'END:VCALENDAR']
    open(os.path.join(SITIO, 'nfc', 'cuidado', codigo.lower() + '.ics'), 'w', encoding='utf-8', newline='').write('\r\n'.join(fold(l) for l in lines) + '\r\n')
    hechos += 1
    print(codigo, nombre, ini)
print('archivos:', hechos)

# ---- nfc/archivo.json: resumen del registro (último número, piezas con dueño) para el mapa y los números especiales ----
import json as _json
_nums, _con = [], 0
for _d in sorted(os.listdir(os.path.join(SITIO, 'verify'))):
    if not re.fullmatch(r'gara-\d{6}', _d): continue
    _h = open(os.path.join(SITIO, 'verify', _d, 'index.html'), encoding='utf-8').read()
    _nums.append(int(_d[-6:]))
    if 'Esta pieza es tuya' in _h: _con += 1
_ult = max(_nums); _esp = (_ult // 50 + 1) * 50
_json.dump({'ultimo': _ult, 'registradas': len(_nums), 'conDueno': _con, 'siguienteEspecial': _esp},
           open(os.path.join(SITIO, 'nfc', 'archivo.json'), 'w'), indent=1)
print('archivo.json', _ult, len(_nums), _con, _esp)
