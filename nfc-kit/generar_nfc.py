#!/usr/bin/env python3
"""GARA · agrega la experiencia NFC al sitio ya compilado.

Uso (desde la raíz del sitio, donde está la carpeta verify/):
    python3 nfc-kit/generar_nfc.py

Qué hace, y se puede correr las veces que quieras:
  1. En cada verify/<codigo>/index.html agrega el kit (salta la intro de pétalos,
     barra con WhatsApp del atelier).
  2. Crea verify/<codigo>-nfc/ con la pantalla "Verificando autenticidad… ✓".
     Esa es la URL que se graba en el tag NFC.

Si vuelves a subir un build nuevo de Next (out/), corre este script otra vez
antes de subirlo a Netlify.
"""

from __future__ import annotations

import html
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
VERIFY = ROOT / "verify"
NFC_SUFFIX = "-nfc"
MARK_START = "<!--gara-nfc-->"
MARK_END = "<!--/gara-nfc-->"
HEAD_ANCHOR = '<meta charSet="utf-8"/>'


def extract(pattern: str, page: str) -> str:
    match = re.search(pattern, page, re.S)
    return html.unescape(match.group(1).strip()) if match else ""


def attr(value: str) -> str:
    return html.escape(value, quote=True)


def build_snippet(page: str, is_nfc: bool) -> str:
    product = extract(r'<h2 class="mt-2 font-display[^"]*">(.*?)</h2>', page)
    serial = extract(r"No\. de serie</dt><dd[^>]*>(.*?)</dd>", page)
    owner = extract(r"Propietario registrado</dt><dd[^>]*>(.*?)</dd>", page)
    return (
        MARK_START
        + '<script>try{sessionStorage.setItem("gara-intro-v4","seen")}catch(e){}</script>'
        + '<link rel="stylesheet" href="/nfc-kit/gara-nfc.css"/>'
        + '<script src="/nfc-kit/gara-nfc.js" defer=""'
        + f' data-nfc="{"1" if is_nfc else "0"}"'
        + f' data-product="{attr(product)}"'
        + f' data-serial="{attr(serial)}"'
        + f' data-owner="{attr(owner)}"></script>'
        + MARK_END
    )


def inject(index_file: Path, is_nfc: bool) -> None:
    page = index_file.read_text(encoding="utf-8")
    page = re.sub(re.escape(MARK_START) + ".*?" + re.escape(MARK_END), "", page, flags=re.S)
    if HEAD_ANCHOR not in page:
        sys.exit(f"No encontré <meta charSet> en {index_file}; no lo toqué.")
    if "Propietario registrado" not in page:
        sys.exit(f"{index_file} no parece un certificado; no lo toqué.")
    page = page.replace(HEAD_ANCHOR, HEAD_ANCHOR + build_snippet(page, is_nfc), 1)
    index_file.write_text(page, encoding="utf-8")


def main() -> None:
    if not VERIFY.is_dir():
        sys.exit(f"No existe {VERIFY}")

    bases = sorted(
        d for d in VERIFY.iterdir() if d.is_dir() and not d.name.endswith(NFC_SUFFIX) and (d / "index.html").exists()
    )
    for base in bases:
        inject(base / "index.html", is_nfc=False)

        nfc_dir = VERIFY / f"{base.name}{NFC_SUFFIX}"
        if nfc_dir.exists():
            shutil.rmtree(nfc_dir)
        shutil.copytree(base, nfc_dir)
        inject(nfc_dir / "index.html", is_nfc=True)
        print(f"ok  /verify/{base.name}/  +  /verify/{nfc_dir.name}/")

    print(f"\n{len(bases)} certificados listos.")


if __name__ == "__main__":
    main()
