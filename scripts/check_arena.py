"""Verifica que una arena de combate nueva no sea PEOR que la que ya funciona.

scene_battle_arena.png no es una ilustracion: es el fondo sobre el que corre todo el
combate. Este script monta el jefe y el heroe en sus coordenadas reales de LAYOUT.js y
compara la candidata contra una arena de referencia.

Por que comparacion y no umbrales absolutos: el primer intento medio "contraste de
luminancia media entre el fondo y el jefe" y RECHAZO la arena que funciona, con 6.1 de
contraste. El jefe no se lee por ser mas claro o mas oscuro que el fondo -- se lee por su
silueta, su contorno oscuro y los ojos rojos. Eso no se mide con un promedio. Asi que el
script mide solo lo que SI es medible y objetivo, y deja la lectura de la silueta al ojo
sobre el montaje que genera.

Uso:
    python scripts/check_arena.py <arena_candidata> [arena_de_referencia]

Sale con codigo 1 si la candidata regresa respecto de la referencia.
"""

import os
import sys

from PIL import Image, ImageDraw

READY = 'public/assets/art/_gameready/'
OUT = 'tmp/arena_check.png'  # tmp/ esta en .gitignore

# Copiados de src/constants/LAYOUT.js. Si cambian alla, cambian aca.
W, H = 640, 360
BOSS = {'x': 320, 'y': 196, 'size': 192}
HERO = {'x': 78, 'y': 292, 'size': 96}
BOSS_BAND = (224, 100, 416, 292)      # lo tapa el sprite del jefe
HUD_ZONE = (0, 0, 210, 90)            # corazones y barra especial, texto blanco encima
CARD_ZONE = (200, 204, 500, 290)      # las 4 cartas
DIALOGUE_ZONE = (128, 232, 512, 354)  # caja de dialogo, queda tapada
FLOOR_STRIP = (0, 300, 640, 345)      # donde apoya el heroe

# Margenes de regresion respecto de la referencia.
DETAIL_TOLERANCE = 1.35   # cuanto mas ruidosa puede ser la banda del jefe
HUD_LUMA_MARGIN = 35      # cuanto mas clara puede ser la esquina del HUD
FLOOR_ROUGH_TOLERANCE = 1.5   # cuanto menos plano puede ser el piso


def luminance(pixel):
    r, g, b = pixel[:3]
    return 0.299 * r + 0.587 * g + 0.114 * b


def region_stats(image, box):
    values = [luminance(p) for p in image.crop(box).getdata()]
    mean = sum(values) / len(values)
    variance = sum((v - mean) ** 2 for v in values) / len(values)
    return mean, variance ** 0.5


def busyness(image, box):
    """Cuanto DETALLE tiene una zona: energia de alta frecuencia.

    Promedia la diferencia de luminancia entre pixeles vecinos. Una zona con textura
    cargada (canios, rejas, escombros) da valores altos; una zona lisa da valores bajos
    aunque tenga mucho contraste global.

    Por que no desvio estandar: el desvio mide contraste GLOBAL y no distingue "textura
    cargada" de "un ovalo claro y liso al lado de estructura oscura". La arena nueva tiene
    justo eso -- un hueco palido liso en el centro, que es lo que hace que la silueta
    oscura del jefe se lea -- y el desvio la rechazaba por 61.96 cuando en realidad el
    jefe se lee MEJOR que en la referencia. Segunda metrica que se equivoco: por eso el
    veredicto final lo da el ojo sobre el montaje.
    """
    crop = image.crop(box)
    width, height = crop.size
    pixels = crop.load()
    luma = [[luminance(pixels[x, y]) for x in range(width)] for y in range(height)]
    total = 0.0
    count = 0
    for y in range(height):
        for x in range(width):
            if x + 1 < width:
                total += abs(luma[y][x + 1] - luma[y][x])
                count += 1
            if y + 1 < height:
                total += abs(luma[y + 1][x] - luma[y][x])
                count += 1
    return total / count if count else 0.0


def floor_roughness(image, box):
    """Que tan poco plano es el piso.

    Promedia cada fila y mide cuanto varian los promedios entre filas. Un piso plano da
    filas parecidas; una pared de detalle o un piso inclinado da filas muy distintas.
    """
    crop = image.crop(box)
    width, height = crop.size
    pixels = crop.load()
    row_means = []
    for y in range(height):
        row_means.append(sum(luminance(pixels[x, y]) for x in range(width)) / width)
    mean = sum(row_means) / len(row_means)
    variance = sum((v - mean) ** 2 for v in row_means) / len(row_means)
    return variance ** 0.5


def measure(path):
    image = Image.open(path).convert('RGB')
    if image.size != (W, H):
        raise ValueError('%s mide %s y tiene que medir %s' % (path, image.size, (W, H)))
    hud_luma, _ = region_stats(image, HUD_ZONE)
    return {
        'image': image,
        'band_detail': busyness(image, BOSS_BAND),
        'hud_luma': hud_luma,
        'floor_rough': floor_roughness(image, FLOOR_STRIP),
    }


def build_montage(image):
    montage = image.copy().convert('RGBA')
    boss = Image.open(READY + 'boss_192.png').convert('RGBA').resize(
        (BOSS['size'], BOSS['size']), Image.NEAREST)
    hero = Image.open(READY + 'hero_front_128.png').convert('RGBA').resize(
        (HERO['size'], HERO['size']), Image.NEAREST)
    montage.alpha_composite(boss, (BOSS['x'] - BOSS['size'] // 2, BOSS['y'] - BOSS['size'] // 2))
    montage.alpha_composite(hero, (HERO['x'] - HERO['size'] // 2, HERO['y'] - HERO['size'] // 2))
    draw = ImageDraw.Draw(montage)
    for box, color in (
        (BOSS_BAND, (255, 217, 74, 255)),
        (HUD_ZONE, (125, 224, 255, 255)),
        (CARD_ZONE, (125, 255, 125, 255)),
        (FLOOR_STRIP, (255, 160, 60, 255)),
        (DIALOGUE_ZONE, (255, 120, 120, 255)),
    ):
        draw.rectangle(box, outline=color)
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    montage.convert('RGB').save(OUT)


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        return 2
    candidate_path = sys.argv[1]
    reference_path = sys.argv[2] if len(sys.argv) > 2 else None

    try:
        candidate = measure(candidate_path)
    except ValueError as error:
        print('FALLO: %s' % error)
        return 1

    build_montage(candidate['image'])
    print('candidata: %s' % candidate_path)
    print('  detalle en la banda del jefe : %6.2f' % candidate['band_detail'])
    print('  luma de la esquina del HUD : %6.2f' % candidate['hud_luma'])
    print('  rugosidad del piso         : %6.2f' % candidate['floor_rough'])
    print('montaje con el jefe y el heroe en sus coordenadas reales: %s' % OUT)

    if not reference_path:
        print('\nSin referencia: no hay veredicto automatico.')
        print('Mira el montaje y confirma que el jefe y el heroe se LEEN.')
        return 0

    reference = measure(reference_path)
    print('\nreferencia: %s' % reference_path)
    print('  detalle en la banda del jefe : %6.2f  (tolerado hasta %6.2f)'
          % (reference['band_detail'], reference['band_detail'] * DETAIL_TOLERANCE))
    print('  luma de la esquina del HUD : %6.2f  (tolerado hasta %6.2f)'
          % (reference['hud_luma'], reference['hud_luma'] + HUD_LUMA_MARGIN))
    print('  rugosidad del piso         : %6.2f  (tolerado hasta %6.2f)'
          % (reference['floor_rough'], reference['floor_rough'] * FLOOR_ROUGH_TOLERANCE))

    failures = []
    if candidate['band_detail'] > reference['band_detail'] * DETAIL_TOLERANCE:
        failures.append('la banda del jefe quedo mas cargada que la referencia: el sprite se va a perder')
    if candidate['hud_luma'] > reference['hud_luma'] + HUD_LUMA_MARGIN:
        failures.append('la esquina del HUD quedo mas clara: los corazones y el texto blanco no se van a leer')
    if candidate['floor_rough'] > reference['floor_rough'] * FLOOR_ROUGH_TOLERANCE:
        failures.append('el piso quedo menos plano: el heroe no va a tener linea de piso clara')

    if failures:
        print('\nFALLO -- se descarta la imagen:')
        for item in failures:
            print('  - %s' % item)
        print('\nNo se mueven las coordenadas de LAYOUT.js: es archivo compartido.')
        return 1

    print('\nOK: no regresa respecto de la referencia.')
    print('Falta el juicio del ojo: abri %s y confirma que la silueta del jefe se lee.' % OUT)
    return 0


if __name__ == '__main__':
    sys.exit(main())
