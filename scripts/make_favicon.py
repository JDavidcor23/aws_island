#!/usr/bin/env python3
"""Deriva todos los tamanos de icono desde un PNG cuadrado grande.

Uso:
    python scripts/make_favicon.py assets/art/generated/f1_favicon.png

Escribe en public/:
    favicon.ico          16 + 32 + 48, que es lo que pide el navegador para la pestana
    favicon-32.png       para navegadores que prefieren PNG antes que .ico
    apple-touch-icon.png 180x180, iOS al agregar a la pantalla de inicio
    icon-512.png         512x512, PWA y previsualizaciones

⚠️ POR QUE NO SE USA NEAREST ACA, si todo el resto del pipeline de arte lo exige.

La regla de arte.md ("es pixel art, cualquier interpolacion lo arruina") vale para los
sprites del juego, que se dibujan a una escala cercana a la nativa. Un favicon es otro
problema: bajar de 1024 a 16 px es tirar 1 de cada 64 pixeles, y con NEAREST el pixel que
sobrevive es arbitrario -- el contorno se corta, la chispa dorada puede desaparecer entera
porque justo no cayo en la grilla. A 16 px la legibilidad le gana a la pureza del pixel, y
LANCZOS promedia el vecindario, que es lo que conserva la silueta.

Comprobado con los dos: en NEAREST el 16x16 pierde el borde inferior del badge.
"""

import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUBLIC = os.path.join(ROOT, "public")

ICO_SIZES = [16, 32, 48]
PNG_TARGETS = [
    ("favicon-32.png", 32),
    ("apple-touch-icon.png", 180),
    ("icon-512.png", 512),
]


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 1
    src = sys.argv[1]
    if not os.path.isabs(src):
        src = os.path.join(ROOT, src)
    if not os.path.isfile(src):
        print(f"ERROR: no existe {src}", file=sys.stderr)
        return 1

    img = Image.open(src).convert("RGBA")
    print(f"{src}  ({img.size}, {img.mode})")

    if img.width != img.height:
        # Un icono no cuadrado lo deforma el navegador. Se recorta al cuadrado centrado.
        lado = min(img.size)
        izq = (img.width - lado) // 2
        arr = (img.height - lado) // 2
        img = img.crop((izq, arr, izq + lado, arr + lado))
        print(f"  recortado a cuadrado: {img.size}")

    os.makedirs(PUBLIC, exist_ok=True)

    for nombre, size in PNG_TARGETS:
        dest = os.path.join(PUBLIC, nombre)
        img.resize((size, size), Image.LANCZOS).save(dest, optimize=True)
        print(f"  OK {nombre:<22} {size}x{size}  {os.path.getsize(dest) / 1024:.1f} KB")

    ico = os.path.join(PUBLIC, "favicon.ico")
    # Pillow arma el .ico multi-tamano solo, pero escala internamente: se le pasa la imagen
    # grande y la lista de tamanos.
    img.save(ico, sizes=[(s, s) for s in ICO_SIZES])
    print(f"  OK {'favicon.ico':<22} {'+'.join(str(s) for s in ICO_SIZES)}  "
          f"{os.path.getsize(ico) / 1024:.1f} KB")

    # Contraste: si el 16x16 queda casi de un solo color, el icono no se va a leer en la
    # pestana. Vale avisarlo ahora y no descubrirlo en el navegador.
    chico = img.resize((16, 16), Image.LANCZOS).convert("RGB")
    lums = [int(0.299 * r + 0.587 * g + 0.114 * b) for r, g, b in chico.getdata()]
    rango = max(lums) - min(lums)
    print()
    print(f"contraste del 16x16: rango de luminancia {rango} de 255")
    if rango < 90:
        print("MAL  a 16 px se ve casi plano: el icono no se va a distinguir en la pestana")
    else:
        print("OK   a 16 px hay contraste suficiente para que se lea")
    return 0


if __name__ == "__main__":
    sys.exit(main())
