#!/usr/bin/env python3
"""Post-proceso de assets pixel art generados con el CLI de codex.

Reemplaza los scripts que vivian en scratchpad/ (sin versionar). Ahora esto va
en el repo: el pipeline de arte no puede depender de archivos locales.

Pipeline completo (sprites/UI):
    chroma key (quita el fondo verde) -> recorte a contenido -> resize -> quantize

Pipeline de fondos (sin transparencia):
    resize -> quantize

Uso:
    # fondo de escena: solo resize + quantize
    python scripts/postprocess.py in.png out.png --size 640x360 --colors 32

    # sprite o elemento de UI: chroma key + recorte + resize
    python scripts/postprocess.py in.png out.png --size 128x128 --chroma --trim

    # UI de ancho fijo que NO debe recortarse (barras, marcos)
    python scripts/postprocess.py in.png out.png --size 208x20 --chroma --no-aspect
"""

import argparse
import sys

from PIL import Image

# Tolerancia del chroma key: cuanto mas verde que rojo/azul tiene que ser un
# pixel para considerarse fondo. Los fondos verdes de codex son muy saturados.
CHROMA_DOMINANCE = 40
CHROMA_MIN_GREEN = 90


def parse_size(value):
    try:
        w, h = value.lower().split("x")
        return int(w), int(h)
    except ValueError:
        raise argparse.ArgumentTypeError(f"--size espera WxH, recibi {value!r}")


def chroma_key(img):
    """Vuelve transparente el fondo verde. Devuelve la imagen en RGBA."""
    img = img.convert("RGBA")
    pixels = img.load()
    width, height = img.size
    removed = 0
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a == 0:
                continue
            if g > CHROMA_MIN_GREEN and g - r > CHROMA_DOMINANCE and g - b > CHROMA_DOMINANCE:
                pixels[x, y] = (0, 0, 0, 0)
                removed += 1
    print(f"  chroma key: {removed} pixeles a transparente")
    return img


def trim_to_content(img):
    """Recorta el margen transparente."""
    bbox = img.convert("RGBA").getbbox()
    if not bbox:
        print("  recorte: imagen vacia, se deja como esta")
        return img
    print(f"  recorte: {img.size} -> {(bbox[2] - bbox[0], bbox[3] - bbox[1])}")
    return img.crop(bbox)


def resize(img, size, keep_aspect):
    """Escala con NEAREST: es pixel art, cualquier interpolacion lo arruina."""
    target_w, target_h = size
    if not keep_aspect:
        print(f"  resize: {img.size} -> {size} (estirado)")
        return img.resize(size, Image.NEAREST)

    # encaja dentro del target sin deformar, y centra sobre un lienzo transparente
    scale = min(target_w / img.width, target_h / img.height)
    new_w = max(1, round(img.width * scale))
    new_h = max(1, round(img.height * scale))
    scaled = img.resize((new_w, new_h), Image.NEAREST)
    if (new_w, new_h) == size:
        print(f"  resize: {img.size} -> {size}")
        return scaled

    canvas = Image.new("RGBA", size, (0, 0, 0, 0))
    canvas.paste(scaled, ((target_w - new_w) // 2, (target_h - new_h) // 2))
    print(f"  resize: {img.size} -> {(new_w, new_h)} centrado en {size}")
    return canvas


def quantize(img, colors):
    """Reduce la paleta preservando el canal alfa."""
    img = img.convert("RGBA")
    alpha = img.getchannel("A")
    rgb = img.convert("RGB").quantize(colors=colors, method=Image.MEDIANCUT)
    out = rgb.convert("RGBA")
    out.putalpha(alpha)
    print(f"  quantize: {colors} colores")
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("source")
    parser.add_argument("dest")
    parser.add_argument("--size", type=parse_size, required=True, help="tamano final, ej 640x360")
    parser.add_argument("--colors", type=int, default=16, help="colores de la paleta final (default 16)")
    parser.add_argument("--chroma", action="store_true", help="quitar el fondo verde")
    parser.add_argument("--trim", action="store_true", help="recortar el margen transparente")
    parser.add_argument(
        "--no-aspect",
        dest="keep_aspect",
        action="store_false",
        help="estirar al tamano exacto en vez de encajar sin deformar",
    )
    args = parser.parse_args()

    try:
        img = Image.open(args.source)
    except OSError as error:
        print(f"ERROR: no pude abrir {args.source}: {error}", file=sys.stderr)
        return 1

    print(f"{args.source} -> {args.dest}  ({img.size}, {img.mode})")
    if args.chroma:
        img = chroma_key(img)
    if args.trim:
        img = trim_to_content(img)
    img = resize(img.convert("RGBA"), args.size, args.keep_aspect)
    img = quantize(img, args.colors)
    img.save(args.dest)
    print(f"OK {args.dest}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
