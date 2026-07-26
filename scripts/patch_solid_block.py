#!/usr/bin/env python3
"""Tapa un bloque de color LISO en un fondo generado, clonando el cielo de al lado.

Por que existe: cuando al generador le pedis que una zona quede "oscura y vacia" para
poner HUD encima, a veces te la devuelve literal -- un rectangulo de un solo color con
bordes rectos, que se lee como un tile que falta. Paso en c4_island_shore.png, esquina
superior derecha.

El parche clona el bloque de igual tamano que esta INMEDIATAMENTE a la izquierda y lo
espeja en X. Espejarlo importa: pegarlo tal cual repite las mismas nubes a distancia
fija y el ojo engancha el patron enseguida.

Uso:
    python scripts/patch_solid_block.py in.png out.png
    python scripts/patch_solid_block.py in.png out.png --corner top-right --tolerance 6
"""

import argparse
import sys

from PIL import Image

# Cuanto puede variar un pixel del color modal y seguir contando como "parte del bloque".
DEFAULT_TOLERANCE = 6
# Un bloque mas chico que esto no vale la pena parchear: es detalle legitimo del dibujo.
MIN_BLOCK = 16


def find_solid_block(img, corner, tolerance):
    """Devuelve (x0, y0, x1, y1) del bloque liso pegado a la esquina, o None."""
    width, height = img.size
    pixels = img.load()
    origin = {
        "top-right": (width - 1, 0),
        "top-left": (0, 0),
        "bottom-right": (width - 1, height - 1),
        "bottom-left": (0, height - 1),
    }[corner]
    target = pixels[origin]
    step_x = -1 if "right" in corner else 1
    step_y = -1 if "bottom" in corner else 1

    def matches(x, y):
        p = pixels[x, y]
        return all(abs(p[i] - target[i]) <= tolerance for i in range(3))

    # Ancho: avanzar desde la esquina por la fila de la esquina
    span_x = 0
    x = origin[0]
    while 0 <= x < width and matches(x, origin[1]):
        span_x += 1
        x += step_x

    # Alto: avanzar por la columna de la esquina
    span_y = 0
    y = origin[1]
    while 0 <= y < height and matches(origin[0], y):
        span_y += 1
        y += step_y

    if span_x < MIN_BLOCK or span_y < MIN_BLOCK:
        return None

    x0 = origin[0] - span_x + 1 if step_x < 0 else 0
    y0 = origin[1] - span_y + 1 if step_y < 0 else 0
    return (x0, y0, x0 + span_x, y0 + span_y)


def patch(img, box):
    """Reemplaza `box` por el bloque vecino de igual tamano, espejado en X."""
    x0, y0, x1, y1 = box
    block_w = x1 - x0
    width, _ = img.size

    # El vecino sale del lado que tenga lugar. En una esquina derecha es la izquierda.
    if x0 - block_w >= 0:
        source_box = (x0 - block_w, y0, x0, y1)
    elif x1 + block_w <= width:
        source_box = (x1, y0, x1 + block_w, y1)
    else:
        raise SystemExit("ERROR: no hay un bloque vecino del mismo ancho para clonar")

    donor = img.crop(source_box).transpose(Image.FLIP_LEFT_RIGHT)
    img.paste(donor, (x0, y0))
    return source_box


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source")
    parser.add_argument("dest")
    parser.add_argument("--corner", default="top-right",
                        choices=["top-right", "top-left", "bottom-right", "bottom-left"])
    parser.add_argument("--tolerance", type=int, default=DEFAULT_TOLERANCE)
    args = parser.parse_args()

    img = Image.open(args.source).convert("RGB")
    box = find_solid_block(img, args.corner, args.tolerance)
    if not box:
        print(f"{args.source}: no encontre bloque liso en {args.corner}, se copia sin cambios")
        img.save(args.dest)
        return 0

    print(f"{args.source}: bloque liso en {box} ({box[2] - box[0]}x{box[3] - box[1]} px)")
    source_box = patch(img, box)
    print(f"  clonado desde {source_box}, espejado en X")
    img.save(args.dest)
    print(f"OK {args.dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
