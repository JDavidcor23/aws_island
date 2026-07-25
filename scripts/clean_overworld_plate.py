"""Borra el camino punteado del mapamundi generado, dejando solo el paisaje.

El camino lo dibuja el codigo (misma fuente de verdad que el grafo por el que camina
el heroe), asi que la imagen tiene que quedar como plancha de oceano + islas.

Por que por BLOBS y no por color pixel a pixel: cada punto del camino es un nucleo
casi blanco (253,252,232) rodeado de un halo que se degrada hacia el azul del agua.
Filtrar por color borra el nucleo y deja el halo, que se ve como un punto mas chico
-- probado tres veces. Clasificando la mancha COMPLETA el halo se va con su nucleo.

Discriminador: mancha clara (luminancia media alta) = punto del camino, se borra.
Mancha oscura = roca del oceano, se protege.
"""

import sys
from collections import deque

from PIL import Image

SRC = 'assets/art/generated/a6_overworld_map.png'
DST = 'public/assets/art/_gameready/scene_overworld_map.png'

# Bounding boxes medidos de las 9 islas (deteccion de blobs sobre el PNG generado).
# Todo lo de adentro es arte y no se toca: la arena crema del pueblo y del desierto,
# y las nubes blancas que envuelven las islas bloqueadas.
ISLAND_BOXES = [
    (14, 245, 120, 335),   # pueblo tropical (se borra, ver ERASE_BOXES)
    (78, 152, 166, 227),   # isla verde
    (223, 171, 303, 242),  # desierto
    (339, 188, 421, 260),  # volcan
    (494, 160, 575, 208),  # cristales
    (167, 36, 259, 113),   # nieve
    (287, 73, 380, 152),   # pinos
    (410, 61, 494, 130),   # ruinas
    (531, 25, 622, 88),    # castillo
]
MARGIN = 3
# Regiones que se borran a oceano SIEMPRE. El pueblo tropical de la Isla 0 no cuadra
# con el arte real de la isla (que es un pueblo-empresa oxidado con molino y torre de
# agua), asi que el nodo pasa a ser un sprite aparte con dos estados -- oxidado y
# revivido -- que el motor compone en runtime. El margen extra se come el anillo de
# espuma, que no entra en el bounding box porque la espuma cuenta como agua.
ERASE_BOXES = [(14, 245, 120, 335)]
ERASE_MARGIN = 5
BRIGHT_MEAN = 175   # luminancia media que separa punto de camino de roca
MAX_DOT_AREA = 260  # una mancha mas grande que esto es roca, no punto
# Los primeros puntos de cada tramo caen DENTRO del margen protegido de su isla, asi
# que sobreviven al borrado. Son 3 manchas de menos de 20px pegadas a la costa y se
# leen como arena o espuma, no como camino. Por encima de este umbral si es un fallo.
TOLERATED_LEFTOVER = 20
DILATE = 2          # el halo exterior del punto se degrada hasta casi el azul del agua
# El relleno se copia de la MISMA fila: el oceano tiene bandeado horizontal, asi que
# muestrear de otra fila deja un escalon visible. Se prueban corrimientos crecientes.
SAMPLE_DX = [96, -96, 144, -144, 64, -64, 192, -192, 240, -240]


def is_ocean(pixel):
    r, _, b = pixel
    return b > r + 50 and b > 120


def luminance(pixel):
    return sum(pixel) / 3


def in_erase_box(x, y):
    return any(
        x0 - ERASE_MARGIN <= x <= x1 + ERASE_MARGIN and y0 - ERASE_MARGIN <= y <= y1 + ERASE_MARGIN
        for x0, y0, x1, y1 in ERASE_BOXES
    )


def in_island(x, y):
    if in_erase_box(x, y):
        return False  # se borra: no se protege como arte
    return any(
        x0 - MARGIN <= x <= x1 + MARGIN and y0 - MARGIN <= y <= y1 + MARGIN
        for x0, y0, x1, y1 in ISLAND_BOXES
    )


def find_blobs(source, width, height):
    """Manchas conexas que no son oceano y caen en agua abierta."""
    seen = [[False] * width for _ in range(height)]
    blobs = []
    for y in range(height):
        for x in range(width):
            if seen[y][x] or in_island(x, y) or is_ocean(source[x, y]):
                continue
            queue = deque([(x, y)])
            seen[y][x] = True
            points = []
            while queue:
                cx, cy = queue.popleft()
                points.append((cx, cy))
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                    nx, ny = cx + dx, cy + dy
                    if not (0 <= nx < width and 0 <= ny < height):
                        continue
                    if seen[ny][nx] or in_island(nx, ny) or is_ocean(source[nx, ny]):
                        continue
                    seen[ny][nx] = True
                    queue.append((nx, ny))
            blobs.append(points)
    return blobs


def main():
    image = Image.open(SRC).convert('RGB')
    width, height = image.size
    source = image.load()

    blobs = find_blobs(source, width, height)
    road, kept, protected = [], [], set()
    for points in blobs:
        # lo que cae en una zona a borrar se va completo, sin clasificar
        if any(in_erase_box(x, y) for x, y in points):
            road.extend(points)
            continue
        mean = sum(luminance(source[x, y]) for x, y in points) / len(points)
        if mean >= BRIGHT_MEAN and len(points) <= MAX_DOT_AREA:
            road.extend(points)
        else:
            kept.append((len(points), round(mean)))
            protected.update(points)

    # Dilatar la mascara: el borde del punto se degrada hasta quedar a un paso del
    # azul del agua, y si se deja queda un moteado con la forma del camino viejo.
    mask = set(road)
    # y toda la zona a borrar, incluida el agua de su anillo de espuma
    for x0, y0, x1, y1 in ERASE_BOXES:
        for y in range(max(0, y0 - ERASE_MARGIN), min(height, y1 + ERASE_MARGIN + 1)):
            for x in range(max(0, x0 - ERASE_MARGIN), min(width, x1 + ERASE_MARGIN + 1)):
                mask.add((x, y))
    for _ in range(DILATE):
        for x, y in list(mask):
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1), (1, 1), (-1, -1), (1, -1), (-1, 1)):
                nx, ny = x + dx, y + dy
                if not (0 <= nx < width and 0 <= ny < height):
                    continue
                if (nx, ny) in protected or in_island(nx, ny):
                    continue
                mask.add((nx, ny))

    out = image.copy()
    result = out.load()
    patched = 0
    for x, y in mask:
        for dx in SAMPLE_DX:
            sx = x + dx
            if not 0 <= sx < width:
                continue
            if (sx, y) in mask or (sx, y) in protected or in_island(sx, y):
                continue
            candidate = source[sx, y]
            if is_ocean(candidate):
                result[x, y] = candidate
                patched += 1
                break

    out.save(DST, 'PNG')

    check = Image.open(DST).convert('RGB')
    leftover = find_blobs(check.load(), width, height)
    still_bright = [
        len(p) for p in leftover
        if sum(luminance(check.load()[x, y]) for x, y in p) / len(p) >= BRIGHT_MEAN
    ]
    print()
    print('FALTA UN PASO: esta plancha todavia NO esta cuantizada.')
    print('La imagen generada trae ~49.000 colores y pesa 324 KB. Corre esto:')
    print('  python scripts/postprocess.py %s %s --size 640x360 --colors 48' % (DST, DST))
    print('Cuantizada baja a 27 KB sin perdida visible.')
    print()
    print('manchas en agua abierta: %d' % len(blobs))
    print('clasificadas como camino: %d manchas, %d pixeles' % (
        len(blobs) - len(kept), len(road)))
    print('protegidas (rocas): %s' % sorted(kept, reverse=True)[:8])
    print('mascara tras dilatar %dpx: %d pixeles' % (DILATE, len(mask)))
    print('parcheados: %d/%d' % (patched, len(mask)))
    failures = [area for area in still_bright if area > TOLERATED_LEFTOVER]
    print('manchas claras restantes: %d %s (toleradas <=%dpx)' % (
        len(still_bright), sorted(still_bright, reverse=True)[:8], TOLERATED_LEFTOVER))
    print('guardado: %s %s' % (DST, check.size))
    if failures:
        print('FALLO: manchas por encima del umbral: %s' % sorted(failures, reverse=True))
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
