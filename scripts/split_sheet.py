#!/usr/bin/env python3
"""Parte un sprite sheet horizontal en frames individuales, con baseline compartida.

Por que existe: si recortas cada frame por separado, el frame con la aleta
levantada tiene un bounding box distinto al de la aleta baja. Al escalar cada uno
a su propio tamano, los pies quedan a distinta altura y el sprite SALTA al
alternar frames.

La solucion es recortar todos los frames con las MISMAS coordenadas verticales:
se calcula la union de los bounding boxes y se aplica a todos.

Uso:
    python scripts/split_sheet.py sheet.png out_prefix --frames 2 --size 128x128
    # produce out_prefix_1.png y out_prefix_2.png
"""

import argparse
import sys

from PIL import Image

sys.path.insert(0, __file__.rsplit("\\", 1)[0].rsplit("/", 1)[0])
from postprocess import chroma_key, parse_size, quantize  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source")
    parser.add_argument("prefix", help="prefijo de salida, sin _N.png")
    parser.add_argument("--frames", type=int, required=True)
    parser.add_argument("--size", type=parse_size, required=True)
    parser.add_argument("--colors", type=int, default=16)
    parser.add_argument("--chroma", action="store_true")
    args = parser.parse_args()

    sheet = Image.open(args.source)
    print(f"{args.source}  ({sheet.size}, {sheet.mode})")
    if args.chroma:
        sheet = chroma_key(sheet)
    sheet = sheet.convert("RGBA")

    frame_w = sheet.width // args.frames
    frames = [sheet.crop((i * frame_w, 0, (i + 1) * frame_w, sheet.height)) for i in range(args.frames)]

    # union de bounding boxes -> misma ventana de recorte para todos
    boxes = [f.getbbox() for f in frames]
    if any(b is None for b in boxes):
        print("ERROR: al menos un frame quedo vacio tras el chroma key", file=sys.stderr)
        return 1
    left = min(b[0] for b in boxes)
    top = min(b[1] for b in boxes)
    right = max(b[2] for b in boxes)
    bottom = max(b[3] for b in boxes)
    print(f"  bbox compartido: {(left, top, right, bottom)}  (baseline unica para los {args.frames} frames)")

    target_w, target_h = args.size
    crop_w, crop_h = right - left, bottom - top
    scale = min(target_w / crop_w, target_h / crop_h)
    new_w, new_h = max(1, round(crop_w * scale)), max(1, round(crop_h * scale))

    for index, frame in enumerate(frames, start=1):
        cropped = frame.crop((left, top, right, bottom))
        scaled = cropped.resize((new_w, new_h), Image.NEAREST)
        canvas = Image.new("RGBA", args.size, (0, 0, 0, 0))
        # anclado ABAJO y centrado: los pies siempre en el mismo pixel
        canvas.paste(scaled, ((target_w - new_w) // 2, target_h - new_h))
        canvas = quantize(canvas, args.colors)
        dest = f"{args.prefix}_{index}.png"
        canvas.save(dest)
        print(f"  OK {dest}")

    return 0


if __name__ == "__main__":
    sys.exit(main())
