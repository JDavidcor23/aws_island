#!/usr/bin/env bash
# Postproceso de la hoja de caminata del pinguino: chroma + recorte COMUN + quantize,
# y despues la verificacion de anclado.
#
# Vive separado de gen_penguin_walk.sh para poder RE-postprocesar sin volver a generar.
# La generacion cuesta minutos y tokens; el postproceso es instantaneo y es lo que se
# repite cuando hay que probar otro --colors o otro --size.
cd "$(dirname "$0")/.." || exit 1

# p2 y NO p1: p1 es la hoja del intento 1, la que devolvio cuatro veces el mismo pinguino
# parado. Se borro del repo; el historial de por que fallo esta en gen_penguin_walk.sh.
SHEET="${1:-assets/art/generated/p2_penguin_walk_4_sheet.png}"
[ -f "$SHEET" ] || { echo "FALTA la hoja $SHEET"; exit 1; }

echo "=== postproceso: recorte COMUN a los 4 frames + chroma + quantize ==="
# --size 128x128 para que compartan escala con penguin_talk_1/2, que se dibujan a
# PENGUIN_SIZE 64 (o sea 0.5x exacto, sin artefactos de resampleo).
python scripts/split_sheet.py "$SHEET" public/assets/art/_gameready/penguin_walk \
  --frames 4 --size 128x128 --colors 24 --chroma || exit 1

echo
echo "=== verificacion: los 4 de caminata y los 2 de habla tienen que apoyar IGUAL ==="
python - <<'PY'
from PIL import Image

names = ('penguin_talk_1', 'penguin_talk_2',
         'penguin_walk_1', 'penguin_walk_2', 'penguin_walk_3', 'penguin_walk_4')
rows = []
for n in names:
    try:
        im = Image.open(f'public/assets/art/_gameready/{n}.png').convert('RGBA')
    except FileNotFoundError:
        print(f'{n:<16} FALTA')
        continue
    b = im.getbbox()
    rows.append((n, b[3] - 1, b[3] - b[1], b[2] - b[0]))
    print(f'{n:<16} pies_y={b[3]-1:<4} alto={b[3]-b[1]:<4} ancho={b[2]-b[0]}')

walk = [r for r in rows if r[0].startswith('penguin_walk')]
print()

# --- 1. la linea de piso ---
# Es LO UNICO que tiene que ser igual en los 6. Tolerancia de 1 px y no igualdad exacta:
# estos PNG son de 128 y el motor los dibuja a PENGUIN_SIZE 64, o sea que 1 px de origen es
# MEDIO pixel en pantalla y drawGrounded redondea.
pies = [r[1] for r in rows]
if max(pies) - min(pies) <= 1:
    print(f'OK  los 6 apoyan en la misma fila (+-{max(pies) - min(pies)} px, imperceptible a 64px)')
else:
    print('MAL los pies NO estan a la misma altura -> el pinguino salta')

# --- 2. el rebote ---
# ⚠️ ESTE CHEQUEO ESTABA AL REVES. Antes decia: "dispersion de alto > 3px => MAL, el
# pinguino cambia de tamano". Eso es falso y ademas peligroso, porque marcaba como ERROR
# justo lo que queremos.
#
# En un ciclo de caminata la altura del bbox VARIA por definicion: en los frames de contacto
# las piernas estan abiertas y el cuerpo baja (bbox mas corto), y en los de paso las piernas
# estan juntas y estiradas y el cuerpo sube (bbox mas alto). Se ve clarito en la caminata del
# heroe, que es la referencia. Eso es el rebote, no un cambio de escala.
#
# Y el cambio de escala NO PUEDE PASAR acá: split_sheet.py recorta los 4 frames con la MISMA
# ventana y los escala con el MISMO factor, asi que la escala es identica por construccion.
# Lo unico que podia variar era lo que este chequeo llamaba error.
#
# Asi que se invierte: alto TODO IGUAL es la senal de alarma. Significa que el generador
# devolvio la misma pose cuatro veces y no hay animacion. Fue exactamente el intento 1.
if walk:
    alturas = [r[2] for r in walk]
    spread = max(alturas) - min(alturas)
    print(f'    rebote (dispersion de alto entre los 4 frames): {spread} px')
    if spread < 2:
        print('MAL  el cuerpo NO sube ni baja: son 4 veces la misma pose, no un ciclo.')
        print('     Es el fallo del intento 1. Ver el historial en gen_penguin_walk.sh.')
    else:
        print('OK   el cuerpo rebota, o sea que hay ciclo')

    anchos = [r[3] for r in walk]
    print(f'    zancada (dispersion de ancho entre los 4 frames): {max(anchos) - min(anchos)} px')
    if max(anchos) - min(anchos) < 2:
        print('MAL  los pies no se separan en ningun frame: no hay zancada.')
    else:
        print('OK   hay zancada')

# --- 3. el tamano del CUERPO, no del bbox ---
# El bbox miente para este personaje: el pinguino lleva un BASTON, y en los frames de paso
# lo levanta por encima de la cabeza. split_sheet escala por la union de los bbox, asi que
# si el baston es lo mas alto del set, el CUERPO entra mas chico en el lienzo de 128 y el
# pinguino se ve encogerse justo cuando arranca a caminar, aunque el bbox diga que mide lo
# mismo. Es la version de este sprite del bug de "media unidad de pixel" de arte.md.
#
# Se mide la corona de la CABEZA y no el bbox: la cabeza es negra y maciza, el baston es
# marron y fino. Se busca la primera fila con >=8 pixeles oscuros, que descarta el contorno
# de 1-2 px del baston y del gorro pero engancha la cabeza entera.
print()
print('--- corona de la cabeza (fila del primer pixel de cabeza, no del baston) ---')
coronas = {}
for n in names:
    try:
        im = Image.open(f'public/assets/art/_gameready/{n}.png').convert('RGBA')
    except FileNotFoundError:
        continue
    w, h = im.size
    px = im.load()
    corona = None
    for y in range(h):
        oscuros = 0
        for x in range(w):
            r, g, b, a = px[x, y]
            if a > 128 and r < 70 and g < 70 and b < 70:
                oscuros += 1
        if oscuros >= 8:
            corona = y
            break
    coronas[n] = corona
    alto_cuerpo = (127 - corona) if corona is not None else None
    print(f'{n:<16} corona_y={corona}  alto_de_cabeza_a_pies={alto_cuerpo}')

cuerpos = [127 - c for c in coronas.values() if c is not None]
talk_c = [127 - coronas[n] for n in ('penguin_talk_1', 'penguin_talk_2') if coronas.get(n) is not None]
walk_c = [127 - coronas[n] for n in ('penguin_walk_1', 'penguin_walk_2', 'penguin_walk_3', 'penguin_walk_4')
          if coronas.get(n) is not None]
if talk_c and walk_c:
    # Se compara contra el frame de caminata MAS ALTO (los de paso, piernas estiradas): ese
    # es el que deberia medir practicamente lo mismo que el pinguino parado hablando.
    d = max(talk_c) - max(walk_c)
    print()
    print(f'    parado hablando: {max(talk_c)} px de alto | caminando (frame mas alto): {max(walk_c)} px')
    print(f'    diferencia: {d} px en origen = {d * 64 / 128:.1f} px en pantalla a PENGUIN_SIZE 64')
    if abs(d) <= 4:
        print('OK   el cuerpo mide lo mismo parado y caminando')
    else:
        print('MAL  el pinguino cambia de tamano al arrancar a caminar.')
        print('     Causa: el baston levantado estira el bbox y split_sheet mete el cuerpo')
        print('     mas chico en el lienzo. Se corrige con PENGUIN_WALK.SIZE en')
        print('     src/constants/INTRO_SCENE.js, escalado por este mismo factor.')
        print(f'     SIZE sugerido = round(64 * {max(talk_c)} / {max(walk_c)}) = {round(64 * max(talk_c) / max(walk_c))}')
PY
