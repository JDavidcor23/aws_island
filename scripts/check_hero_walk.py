#!/usr/bin/env python3
"""Diagnostica el ciclo de caminata del heroe frame por frame.

Motivo: en hero_walk_5 la camisa se ve "borrada". A 64 px eso no se puede juzgar a ojo,
asi que se cuenta. Y se compara el resultado FINAL contra el sheet ORIGINAL de alta
resolucion, porque la causa cambia el arreglo:

  - si el original tambien tiene poca camisa  -> el problema viene del generador
  - si el original esta bien                  -> lo rompio el postproceso (quantize/chroma)

Tambien escribe un strip ampliado para poder mirarlo, porque los numeros dicen QUE pasa
pero no COMO se ve.

Uso:
    python scripts/check_hero_walk.py
"""

import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
READY = os.path.join(ROOT, "public", "assets", "art", "_gameready")
SHEET = os.path.join(ROOT, "assets", "art", "characters", "06_hero_walk_right_6_sheet.png")
FRAMES = 6
ZOOM = 6
OUT_STRIP = os.path.join(ROOT, "tmp_walk_zoom.png")


def stats(img):
    """Cuenta pixeles opacos y, de esos, cuantos son la CAMISA.

    La camisa del heroe es crema muy claro. Se la separa por luminancia alta y saturacion
    baja: la piel tambien es clara pero es notablemente mas naranja, y el pantalon es azul
    saturado. El umbral 190/28 sale de mirar los valores del sprite original, no de estimar.
    """
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    opacos = 0
    camisa = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a <= 128:
                continue
            opacos += 1
            mx, mn = max(r, g, b), min(r, g, b)
            if mn >= 190 and (mx - mn) <= 28:
                camisa += 1
    return opacos, camisa


def main():
    print("=== FINAL: public/assets/art/_gameready/hero_walk_N.png ===")
    finales = []
    for i in range(1, FRAMES + 1):
        p = os.path.join(READY, f"hero_walk_{i}.png")
        if not os.path.isfile(p):
            print(f"  hero_walk_{i}  FALTA")
            continue
        im = Image.open(p)
        opacos, camisa = stats(im)
        pct = (camisa / opacos * 100) if opacos else 0
        finales.append((i, im, opacos, camisa, pct))
        print(f"  hero_walk_{i}  opacos={opacos:<6} camisa={camisa:<5} ({pct:.1f}% del sprite)")

    if finales:
        pcts = [f[4] for f in finales]
        media = sum(pcts) / len(pcts)
        peor = min(finales, key=lambda f: f[4])
        print()
        print(f"  promedio de camisa: {media:.1f}%   peor frame: hero_walk_{peor[0]} con {peor[4]:.1f}%")
        # Un frame con menos de la mitad de camisa que el promedio es un agujero, no una pose.
        if peor[4] < media * 0.55:
            print(f"  >>> hero_walk_{peor[0]} tiene MUY poca camisa: es el frame roto.")
        else:
            print("  >>> ningun frame se sale del rango: la camisa no falta en ninguno.")

    print()
    print("=== ORIGEN: assets/art/characters/06_hero_walk_right_6_sheet.png ===")
    if not os.path.isfile(SHEET):
        print("  FALTA el sheet original, no se puede saber de donde viene el problema")
    else:
        sheet = Image.open(SHEET).convert("RGBA")
        fw = sheet.width // FRAMES
        # El sheet original tiene fondo BLANCO opaco, no alfa: el blanco del fondo entraria
        # en el contador de camisa y falsearia todo. Se recorta al bbox de cada frame
        # tratando el blanco como fondo.
        for i in range(FRAMES):
            frame = sheet.crop((i * fw, 0, (i + 1) * fw, sheet.height))
            px = frame.load()
            w, h = frame.size
            # marcar como transparente lo que sea blanco puro de fondo
            for y in range(h):
                for x in range(w):
                    r, g, b, a = px[x, y]
                    if r > 245 and g > 245 and b > 245:
                        px[x, y] = (r, g, b, 0)
            opacos, camisa = stats(frame)
            pct = (camisa / opacos * 100) if opacos else 0
            print(f"  frame {i+1}      opacos={opacos:<6} camisa={camisa:<5} ({pct:.1f}% del sprite)")
        print()
        print("  OJO: el original tiene fondo blanco, asi que 'camisa' aca puede incluir")
        print("  pixeles claros del borde. Sirve para COMPARAR entre frames, no en absoluto.")

    # strip ampliado para mirar
    if finales:
        fw, fh = finales[0][1].size
        strip = Image.new("RGBA", (fw * len(finales) * ZOOM, fh * ZOOM), (255, 0, 255, 255))
        for idx, (_i, im, *_rest) in enumerate(finales):
            big = im.convert("RGBA").resize((fw * ZOOM, fh * ZOOM), Image.NEAREST)
            strip.alpha_composite(big, (idx * fw * ZOOM, 0))
        strip.save(OUT_STRIP)
        print()
        print(f"strip ampliado {ZOOM}x escrito en {OUT_STRIP} (fondo magenta = transparente)")

    return 0


if __name__ == "__main__":
    sys.exit(main())
