#!/usr/bin/env python3
"""Empaqueta un SET de sprites que son frames de una misma animacion.

Por que existe y por que no alcanza postprocess.py --trim: --trim recorta CADA imagen por
su propio contenido. En frames de una animacion eso es exactamente lo que no hay que
hacer -- la pose de disparo es 491 px de ancho y la de guardia 370, asi que recortadas por
separado terminan con escalas distintas y el personaje salta de tamano y de posicion entre
frames. Medido en los sprites de combate del heroe.

La solucion es un recorte UNICO: se calcula el bounding box union de todo el set y se
recorta todo con ese mismo box. El personaje queda anclado y solo se mueve lo que
realmente cambia de pose a pose.

Pipeline: chroma key -> bbox union -> recorte comun -> resize sin deformar -> quantize.

Uso:
    python scripts/pack_sprite_set.py --size 128x128 --colors 24 \\
        in1.png:out1.png in2.png:out2.png ...
"""

import argparse
import os
import sys

from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from postprocess import chroma_key, parse_size, quantize, resize  # noqa: E402


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("pairs", nargs="+", metavar="ENTRADA:SALIDA")
    parser.add_argument("--size", type=parse_size, required=True)
    parser.add_argument("--colors", type=int, default=24)
    parser.add_argument("--no-chroma", dest="chroma", action="store_false")
    args = parser.parse_args()

    pairs = []
    for pair in args.pairs:
        if ":" not in pair:
            print(f"ERROR: {pair!r} no tiene la forma ENTRADA:SALIDA", file=sys.stderr)
            return 1
        source, dest = pair.rsplit(":", 1)
        pairs.append((source, dest))

    images = []
    for source, dest in pairs:
        img = Image.open(source)
        if args.chroma:
            img = chroma_key(img)
        images.append((source, dest, img.convert("RGBA")))

    boxes = [img.getbbox() for _, _, img in images]
    if any(box is None for box in boxes):
        print("ERROR: alguna imagen quedo vacia despues del chroma key", file=sys.stderr)
        return 1

    union = (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )
    print(f"bbox union: {union}  ({union[2] - union[0]}x{union[3] - union[1]})")
    for (source, _, _), box in zip(images, boxes):
        print(f"  {os.path.basename(source):<24} {box[2] - box[0]:>4}x{box[3] - box[1]:<4} bbox={box}")

    for source, dest, img in images:
        out = resize(img.crop(union), args.size, keep_aspect=True)
        out = quantize(out, args.colors)
        out.save(dest, optimize=True)
        print(f"OK {dest}  ({out.mode}, {os.path.getsize(dest) / 1024:.1f} KB)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
