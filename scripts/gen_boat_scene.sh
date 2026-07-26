#!/usr/bin/env bash
# Assets de la llegada en barco: la costa de la Isla 0 vista desde el mar, y el bote.
# Corre la generacion Y el postproceso, asi que deja los PNG listos en _gameready.
#
# El bloque CONCEPT se reusa TEXTUAL de gen_isla0.sh a proposito: es lo unico que garantiza
# que la costa sea la MISMA isla y no otra parecida. Los siete landmarks tienen que
# reconocerse desde el mar igual que en las otras cinco vistas.
#
# OJO con las restricciones de layout por coordenadas: pedirle que una zona quede "oscura y
# vacia" para poner HUD encima te puede devolver un RECTANGULO de color liso con bordes
# rectos. Paso: la esquina superior derecha volvio como un bloque (35,29,44) de 120x40.
# Por eso el pipeline de abajo pasa por patch_solid_block.py, que lo detecta y lo tapa
# clonando el cielo vecino. Si el generador no mete el bloque, el script no toca nada.
cd "C:/Users/jdiaz483/Documents/work/my-proyects/hackaton_aws" || exit 1
mkdir -p tmp

STYLE='Style: clean HD pixel art, western semi-anime like Sea of Stars and Eastward, crisp hard pixel edges, limited palette, no blur, no anti-aliasing, no gradients, detailed but readable. No text, no letters, no numbers, no UI.'

CONCEPT='ISLAND CONCEPT -- Isla 0, "Server Town", in its SICK state. Landmarks that must be recognizable: a crooked WINDMILL with torn blades on a hill to the LEFT, a rusted cylindrical WATER TOWER on stilts to the RIGHT, and dominating the skyline at the CENTER-BACK a colossal LEGACY SERVER TOWER of dark corroded metal and stacked server racks with thick cables spilling down its sides like roots, two or three columns of dark smoke rising from it and faint red glowing lights. Below them a cluster of brick and timber HOUSES with sagging broken roofs and boarded windows, corroded leaking PIPES, and bare dead leaning POPLAR TREES. Palette: rust #8a5a32, rotten brown #4a3a2a, dull steel #5c6272, toxic green #7a9a3a, violet smog sky #5a4a68, alarm red #c4402a.'

echo "=== generacion: costa + bote ==="
codex exec --sandbox danger-full-access -m gpt-5.5 -- \
"Generate TWO pixel art images and save them in the current project directory as assets/art/generated/c4_island_shore.png (exactly 640x360, opaque background) and assets/art/generated/c5_boat.png (exactly 256x160, flat saturated pure green #00b140 background for chroma keying).

$STYLE

$CONCEPT

FILE c4_island_shore.png -- the island seen from the OPEN SEA as you arrive, a wide establishing shot from slightly above water level. This is the same island described above and it must read as the same place. HARD LAYOUT CONSTRAINTS, this is a game background and not an illustration, respect them exactly: (a) the LOWER THIRD of the image, from y=240 to y=360, is dark stagnant TOXIC WATER, oily and still, with a rim of sickly yellow-green foam where it meets the land -- keep it low detail, a boat sprite sails across it; (b) a rotten wooden JETTY on weathered pilings runs from the left shore out to the right into the water, its planks broken and its far end at roughly x=200, with its walking surface at roughly y=250 -- a character sprite stands on it, so that surface must be flat, unobstructed and clearly readable; (c) the left quarter of the water, from x=0 to x=170, must be EMPTY open water because the boat sails in from there; (d) the island rises behind the jetty across the middle band of the image with the smoking legacy server tower on the horizon at the center-back; (e) keep the top-right corner calm and low contrast, blending naturally into the sky -- a skip hint is drawn there, but do NOT draw a box, a panel or a flat block of color, it must stay sky; (f) no characters, no people, no boats, no animals anywhere in this image.

FILE c5_boat.png -- a small weathered WOODEN ROWBOAT seen from the SIDE in profile, prow pointing RIGHT. An open skiff with visible plank hull, a low bench across the middle, a single oar resting inside, chipped dull paint, waterline stains along the hull. It must read as a boat that just crossed an ocean and barely made it. Empty -- no passenger, no cargo, no rope to anything, no water around it, no wake, no reflection, no shadow. It sits alone on the flat green background. Draw only the part of the boat that sits ABOVE the waterline, because the engine draws the water over its base." < /dev/null

echo "=== postproceso: costa (parche del bloque liso + quantize) ==="
python scripts/patch_solid_block.py assets/art/generated/c4_island_shore.png tmp/shore_patched.png || exit 1
python scripts/postprocess.py tmp/shore_patched.png public/assets/art/_gameready/scene_island_shore.png \
  --size 640x360 --colors 48 || exit 1

echo "=== postproceso: bote ==="
# 128x40 y no 128x80: el sprite se ancla por su borde INFERIOR en la linea de agua, asi que
# relleno vertical de sobra solo hace que las constantes de INTRO_SCENE.BOAT mientan.
python scripts/postprocess.py assets/art/generated/c5_boat.png public/assets/art/_gameready/boat.png \
  --size 128x40 --chroma --trim --colors 24 || exit 1

echo "=== FIN ==="
ls -la public/assets/art/_gameready/ | grep -E "boat|shore"
