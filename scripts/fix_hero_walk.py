#!/usr/bin/env python3
"""Re-procesa hero_walk_1..6 desde el sheet original para recuperar la camisa perdida.

EL PROBLEMA. Medido con scripts/check_hero_walk.py:

    final  hero_walk_1..4,6 -> camisa 12.4..13.0% del sprite
    final  hero_walk_5      -> camisa  6.0%          <-- la mitad
    origen frame 5          -> camisa 10.2%  (vs 11.7% promedio)

O sea que el ORIGINAL esta bien: en esa pose el brazo le tapa algo de camisa y baja un
punto, nada mas. El agujero lo metio el post-proceso viejo. Es el bug que documenta
ASSETS.md: se cuantizaba con MEDIANCUT + dithering Floyd-Steinberg por defecto, y median
cut corta el espacio de color por POBLACION, asi que en el frame donde la camisa es el
color con menos pixeles, la camisa se fusiona con otro tono y desaparece. postprocess.py
ya se corrigio (MAXCOVERAGE + dither NONE) pero estos 6 frames son anteriores al arreglo.

POR QUE NO ALCANZA CON split_sheet.py. Su chroma key saca VERDE, y este sheet tiene fondo
BLANCO. Y no se puede reemplazar por un umbral de blanco: la camisa del heroe es crema casi
blanca (min>=190), asi que "blanco = fondo" le borra la camisa a los SEIS frames. El fondo
se detecta por CONECTIVIDAD desde el borde: lo que toca el marco es fondo, lo que esta
rodeado por el contorno del personaje es camisa.

SEGURIDAD. Por defecto es DRY RUN: mide, escribe un preview y NO toca nada. Solo con
--apply sobreescribe, y solo si la geometria nueva coincide con la vieja (misma linea de
piso, mismo alto), porque si cambia el heroe salta o cambia de tamano en la intro.

Uso:
    python scripts/fix_hero_walk.py            # dry run: mide y deja preview
    python scripts/fix_hero_walk.py --apply    # sobreescribe si la geometria coincide
"""

import argparse
import os
import sys
from collections import deque

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
READY = os.path.join(ROOT, "public", "assets", "art", "_gameready")
SHEET = os.path.join(ROOT, "assets", "art", "characters", "06_hero_walk_right_6_sheet.png")
FRAMES = 6
SIZE = (64, 64)      # resolucion NATIVA de walk1..6 segun INTRO_SCENE.HERO_SIZE
COLORS = 24          # 16 era lo viejo; 24 le da aire a la camisa sin engordar el archivo
ZOOM = 6
PREVIEW = os.path.join(ROOT, "tmp_walk_fixed_zoom.png")
# Cuanto puede diferir la geometria nueva de la vieja antes de considerarlo un cambio
# visible. 1 px en un sprite de 64 dibujado a 64 es 1 px en pantalla: eso ya se nota, pero
# es el minimo alcanzable si el bbox cambia. 2 px es donde el heroe salta.
GEOM_TOLERANCE = 1


def background_mask(frame):
    """True donde hay FONDO, detectado por conectividad desde el borde.

    Un flood fill desde los cuatro lados sobre pixeles casi blancos. La camisa tambien es
    casi blanca pero esta encerrada por el contorno oscuro del personaje, asi que el fill
    no llega. Es la unica forma de separarlas: por color son el mismo color.
    """
    w, h = frame.size
    px = frame.load()

    def is_pale(x, y):
        r, g, b, a = px[x, y]
        return a > 0 and r > 236 and g > 236 and b > 236

    mask = [[False] * w for _ in range(h)]
    q = deque()
    for x in range(w):
        for y in (0, h - 1):
            if is_pale(x, y) and not mask[y][x]:
                mask[y][x] = True
                q.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if is_pale(x, y) and not mask[y][x]:
                mask[y][x] = True
                q.append((x, y))

    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nx, ny = x + dx, y + dy
            if 0 <= nx < w and 0 <= ny < h and not mask[ny][nx] and is_pale(nx, ny):
                mask[ny][nx] = True
                q.append((nx, ny))
    return mask


def cut_frames():
    """Devuelve los 6 frames del sheet ya con fondo transparente."""
    sheet = Image.open(SHEET).convert("RGBA")
    fw = sheet.width // FRAMES
    out = []
    for i in range(FRAMES):
        frame = sheet.crop((i * fw, 0, (i + 1) * fw, sheet.height))
        mask = background_mask(frame)
        px = frame.load()
        w, h = frame.size
        borrados = 0
        for y in range(h):
            row = mask[y]
            for x in range(w):
                if row[x]:
                    px[x, y] = (0, 0, 0, 0)
                    borrados += 1
        print(f"  frame {i+1}: fondo quitado {borrados} px de {w*h}")
        out.append(frame)
    return out


def pack(frames):
    """Escala cada frame a 64 de alto y lo ancla ABAJO, replicando la geometria actual.

    ⚠️ A PROPOSITO no usa el bbox UNION como split_sheet.py. Medido, los 6 frames que hay
    hoy en el juego tienen todos alto=64 y pies en y=63, o sea que el pipeline viejo escalo
    cada frame para llenar los 64 px de alto. Con bbox union los frames de paso salen 61-62
    y aparece un rebote de 3 px que HOY NO EXISTE.
    
    Ese rebote seria mas correcto como animacion, pero el pedido era arreglar la camisa sin
    cambiar nada mas. Cambiar la altura del heroe es un cambio visual que nadie pidio, y
    encima lo dejaria hasta 3 px mas bajo caminando que parado (hero_side_64 mide 64), o sea
    que se veria un salto al frenar. Reproducir la geometria vieja al pixel es lo que hace
    que este arreglo sea seguro: lo UNICO que cambia es la paleta.

    Si algun dia se quiere el rebote de verdad, hay que rehacer la caminata entera con bbox
    union Y volver a empaquetar hero_side_64 con la misma ventana, para que apoyen igual.
    """
    tw, th = SIZE
    packed = []
    for f in frames:
        b = f.getbbox()
        if b is None:
            raise SystemExit("ERROR: un frame quedo vacio")
        cropped = f.crop(b)
        # alto exacto = th, ancho por aspecto y topeado al lienzo
        nh = th
        nw = max(1, min(tw, round(cropped.width * th / cropped.height)))
        scaled = cropped.resize((nw, nh), Image.NEAREST)
        canvas = Image.new("RGBA", SIZE, (0, 0, 0, 0))
        canvas.paste(scaled, ((tw - nw) // 2, th - nh))   # anclado ABAJO, margen 0
        packed.append(canvas)
    return packed


def palette_from_existing():
    """Paleta tomada de los sprites del heroe QUE YA ESTAN EN EL JUEGO.

    Es la opcion por defecto y el motivo es "no dañar nada". Calcular una paleta nueva desde
    el original de alta resolucion da un resultado MAS FIEL —medido: el cuadradito del pecho
    vuelve a ser naranja en vez del marron al que lo degrado el median cut viejo— pero
    tambien cambia el color de los SEIS frames, y el resto de los sprites del heroe
    (hero_side_64, hero_stance, hero_charge, hero_fire) siguen procesados con el pipeline
    viejo y su paleta apagada. Resultado: el pibe cambiaria de color al frenar de caminar,
    dentro de la misma escena.

    Tomando la paleta de lo que ya hay, lo unico que cambia es que el frame 5 recupera la
    camisa. El color de la camisa YA esta en esta paleta (los frames 1-4 y 6 lo tienen): al 5
    le faltaba solo porque se cuantizo solo y ahi la camisa era minoritaria.

    hero_side_64 entra en la union a proposito: es el sprite al que el heroe vuelve cuando
    deja de caminar, asi que es el que define a que tiene que parecerse la caminata.
    """
    fuentes = [f"hero_walk_{i}.png" for i in range(1, FRAMES + 1)] + ["hero_side_64.png"]
    colores = {}
    for fn in fuentes:
        p = os.path.join(READY, fn)
        if not os.path.isfile(p):
            continue
        im = Image.open(p).convert("RGBA")
        px = im.load()
        w, h = im.size
        for y in range(h):
            for x in range(w):
                r, g, b, a = px[x, y]
                if a >= 128:
                    colores[(r, g, b)] = colores.get((r, g, b), 0) + 1
    if not colores:
        return None
    # Ordenados por frecuencia y topeados a 256: si algun dia la union creciera, se quedan
    # los mas usados, que es lo que menos se nota.
    orden = [c for c, _n in sorted(colores.items(), key=lambda kv: -kv[1])][:256]
    print(f"  paleta tomada de los sprites actuales: {len(orden)} colores unicos")
    pal = Image.new("P", (1, 1))
    flat = []
    for c in orden:
        flat.extend(c)
    flat.extend([0, 0, 0] * (256 - len(orden)))
    pal.putpalette(flat)
    return pal


def shared_palette(frames, colors):
    """UNA paleta calculada desde el ORIGINAL. Mas fiel, pero cambia el color de los 6.

    ⚠️ ESTA ES LA CAUSA RAIZ DEL BUG, y me la comi yo tambien en el primer intento.
    Cuantizando cada frame POR SEPARADO, cada uno arma su paleta segun SU propia poblacion
    de colores. La camisa del heroe es un color minoritario, y en cualquier frame donde el
    brazo la tape un poco mas, se queda sin entrada y desaparece. El pipeline viejo perdio
    la camisa en el frame 5; mi primer intento la perdio en el frame 1. No era el frame: era
    el metodo.

    Con una paleta calculada sobre los SEIS frames juntos, la camisa suma sus pixeles de
    todos y ya no es minoritaria en ninguno. Bonus: los colores dejan de bailar entre
    frames, que es otro artefacto de animacion que nadie mira hasta que lo ve.
    """
    tw, th = SIZE
    atlas = Image.new("RGB", (tw * len(frames), th))
    for i, f in enumerate(frames):
        rgb = f.convert("RGB")
        alpha = f.getchannel("A")
        px = rgb.load()
        mask = alpha.load()
        visibles = [px[x, y] for y in range(th) for x in range(tw) if mask[x, y] >= 128]
        if visibles:
            # Aplanar lo invisible al color visible MAS OSCURO (el contorno) y no al mas
            # frecuente como hace postprocess.quantize: el mas frecuente es el azul del
            # pantalon, y meterlo de relleno lo infla artificialmente para que compita por
            # entradas de paleta contra la camisa, que es justo lo que hay que salvar.
            flat = min(visibles, key=lambda c: sum(c))
            for y in range(th):
                for x in range(tw):
                    if mask[x, y] < 128:
                        px[x, y] = flat
        atlas.paste(rgb, (i * tw, 0))
    pal = atlas.quantize(colors=colors, method=Image.MAXCOVERAGE, dither=Image.NONE)
    print(f"  paleta compartida de {colors} colores calculada sobre los {len(frames)} frames juntos")
    return pal


def apply_palette(img, pal):
    """Mapea un frame a la paleta compartida, preservando el alfa."""
    alpha = img.getchannel("A")
    rgb = img.convert("RGB")
    px = rgb.load()
    mask = alpha.load()
    w, h = rgb.size
    visibles = [px[x, y] for y in range(h) for x in range(w) if mask[x, y] >= 128]
    if visibles:
        flat = min(visibles, key=lambda c: sum(c))
        for y in range(h):
            for x in range(w):
                if mask[x, y] < 128:
                    px[x, y] = flat
    reduced = rgb.quantize(palette=pal, dither=Image.NONE)
    out = reduced.convert("RGBA")
    out.putalpha(alpha)
    return out


def shirt_pct(img):
    img = img.convert("RGBA")
    px = img.load()
    w, h = img.size
    opacos = camisa = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a <= 128:
                continue
            opacos += 1
            if min(r, g, b) >= 190 and (max(r, g, b) - min(r, g, b)) <= 28:
                camisa += 1
    return (camisa / opacos * 100) if opacos else 0


def geom(img):
    b = img.convert("RGBA").getbbox()
    if not b:
        return None
    return {"pies_y": b[3] - 1, "alto": b[3] - b[1], "ancho": b[2] - b[0]}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--apply", action="store_true", help="sobreescribir los PNG del juego")
    ap.add_argument(
        "--fresh-palette",
        action="store_true",
        help="calcular la paleta desde el original en vez de heredarla de los sprites "
             "actuales. Mas fiel al arte original (recupera el naranja del pecho) pero "
             "cambia el color de los 6 frames y los desalinea del resto de los sprites "
             "del heroe, que siguen con la paleta vieja.",
    )
    args = ap.parse_args()

    if not os.path.isfile(SHEET):
        print(f"ERROR: falta el sheet original {SHEET}", file=sys.stderr)
        return 1

    print("=== 1. quitar el fondo blanco por conectividad ===")
    frames = cut_frames()

    print()
    print("=== 2. recorte comun + escala + anclado abajo ===")
    packed = pack(frames)

    print()
    print("=== 3. cuantizar con UNA paleta compartida (sin dither) ===")
    if args.fresh_palette:
        print("  modo --fresh-palette: paleta nueva desde el original (mas fiel, cambia el color de los 6)")
        pal = shared_palette(packed, COLORS)
    else:
        pal = palette_from_existing()
        if pal is None:
            print("  no hay sprites previos de donde sacar la paleta, cayendo a paleta nueva")
            pal = shared_palette(packed, COLORS)
    nuevos = [apply_palette(f, pal) for f in packed]

    print()
    print("=== 4. comparacion viejo vs nuevo ===")
    print(f"{'frame':<8} {'camisa_vieja':>13} {'camisa_nueva':>13}   {'geom_vieja':<28} {'geom_nueva'}")
    ok_geom = True
    for i, nuevo in enumerate(nuevos, start=1):
        p = os.path.join(READY, f"hero_walk_{i}.png")
        viejo = Image.open(p) if os.path.isfile(p) else None
        pv = shirt_pct(viejo) if viejo else 0
        pn = shirt_pct(nuevo)
        gv = geom(viejo) if viejo else None
        gn = geom(nuevo)
        print(f"{i:<8} {pv:12.1f}% {pn:12.1f}%   {str(gv):<28} {gn}")
        if gv and gn:
            if abs(gv["pies_y"] - gn["pies_y"]) > GEOM_TOLERANCE or abs(gv["alto"] - gn["alto"]) > GEOM_TOLERANCE:
                ok_geom = False

    # heroSide comparte la MISMA caja de dibujado que la caminata: si no apoyan igual, el
    # heroe salta al pasar de caminar a quedarse quieto.
    side_path = os.path.join(READY, "hero_side_64.png")
    if os.path.isfile(side_path):
        gs = geom(Image.open(side_path))
        print()
        print(f"hero_side_64 (el sprite de quieto, misma caja): {gs}")
        pies_nuevos = {geom(n)["pies_y"] for n in nuevos}
        print(f"pies de la caminata nueva: {sorted(pies_nuevos)}")
        if len(pies_nuevos) > 1:
            print("MAL  los 6 frames nuevos no apoyan todos en la misma fila")
            ok_geom = False
        elif gs and abs(gs["pies_y"] - next(iter(pies_nuevos))) > GEOM_TOLERANCE:
            print("OJO  la caminata no apoya donde apoya hero_side_64: el heroe saltaria al frenar")

    pcts = [shirt_pct(n) for n in nuevos]
    media = sum(pcts) / len(pcts)
    peor = min(pcts)
    print()
    print(f"camisa nueva: promedio {media:.1f}%, peor frame {peor:.1f}%")
    if peor < media * 0.55:
        print("MAL  todavia hay un frame sin camisa; subir COLORS y volver a correr")
    else:
        print("OK   ningun frame perdio la camisa")

    # preview ampliado
    fw, fh = SIZE
    strip = Image.new("RGBA", (fw * FRAMES * ZOOM, fh * ZOOM * 2), (255, 0, 255, 255))
    for i, nuevo in enumerate(nuevos, start=1):
        p = os.path.join(READY, f"hero_walk_{i}.png")
        if os.path.isfile(p):
            big_old = Image.open(p).convert("RGBA").resize((fw * ZOOM, fh * ZOOM), Image.NEAREST)
            strip.alpha_composite(big_old, ((i - 1) * fw * ZOOM, 0))
        big_new = nuevo.convert("RGBA").resize((fw * ZOOM, fh * ZOOM), Image.NEAREST)
        strip.alpha_composite(big_new, ((i - 1) * fw * ZOOM, fh * ZOOM))
    strip.save(PREVIEW)
    print(f"preview {ZOOM}x (fila de arriba = VIEJO, abajo = NUEVO): {PREVIEW}")

    if not args.apply:
        print()
        print("DRY RUN: no se toco ningun archivo del juego. Con --apply se sobreescriben.")
        return 0

    if not ok_geom:
        print()
        print("ABORTADO: la geometria nueva no coincide con la vieja. Sobreescribir haria")
        print("que el heroe salte o cambie de tamano en la intro. No se toco nada.")
        return 1

    for i, nuevo in enumerate(nuevos, start=1):
        dest = os.path.join(READY, f"hero_walk_{i}.png")
        nuevo.save(dest, optimize=True)
        print(f"  escrito {dest}  ({os.path.getsize(dest)/1024:.1f} KB)")
    print("LISTO")
    return 0


if __name__ == "__main__":
    sys.exit(main())
