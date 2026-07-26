#!/usr/bin/env bash
# Sprites de combate del heroe: guardia, carga y disparo.
#
# HISTORIAL DE ESTE SCRIPT -- leelo antes de tocar el prompt, son dos errores ya pagados:
#
# Intento 1: personaje descrito con TEXTO, sin referencia. Salieron cinco sprites de un
#   chico distinto: proporcion adolescente, sombreado con pliegues, sin el cuadradito
#   naranja del pecho.
# Intento 2: referencias adjuntas CON una lista larga de reglas de estilo ("colores
#   planos", "dos tonos por material", "proporcion chibi", "sin pliegues"). Sobrecorrigio
#   a un muneco de tubos con contorno grueso, y ademas interpreto el "cuadradito naranja
#   del pecho" como cuadrados naranjas en los PUNOS.
#
# Conclusion: los adjetivos de estilo PELEAN contra la imagen de referencia. Cuando hay
# referencia, el prompt tiene que ser corto y hablar SOLO de la pose. El estilo lo define
# la imagen, no las palabras. De ahi que abajo no haya una sola regla de estilo.
cd "C:/Users/jdiaz483/Documents/work/my-proyects/hackaton_aws" || exit 1

REF_SIDE="assets/art/characters/06_hero_side_idle_1.png"
REF_SHEET="assets/art/characters/06_hero_walk_right_6_sheet.png"

for f in "$REF_SIDE" "$REF_SHEET"; do
  [ -f "$f" ] || { echo "FALTA la referencia $f"; exit 1; }
done

echo "=== sprites de combate del heroe (intento 3: referencia manda, prompt minimo) ==="
codex exec --sandbox danger-full-access -m gpt-5.5 \
  -i "$REF_SIDE" -i "$REF_SHEET" -- \
"The first attached image is a sprite of my game's hero. The second is his walk cycle.

Your task is to REDRAW that exact same sprite in five new poses. Treat this as editing the attached sprite, not as drawing a new character.

Keep the character pixel-identical to the attachment: same palette, same outline, same proportions, same head size, same face, same hair silhouette, same shirt with its orange chest square, same backpack, same trousers, same boots, same amount of detail and shading. Do not restyle him, do not simplify him, do not add detail. If a pixel does not need to move for the pose, it should not change.

Change ONLY his arms, his legs and the tilt of his torso.

He faces RIGHT in all five, same as the attachment. Same camera, same zoom, same ground line and same margin above his hair in all five, because these get played as one animation.

Save five PNGs, each at least 768x768, on a flat pure green #00b140 background, in the current project directory:

assets/art/generated/c1_hero_stance_1.png -- he raises both fists in front of his chest and bends his knees, feet apart, ready to fight.

assets/art/generated/c1_hero_stance_2.png -- the identical pose, one frame later while breathing: shoulders a couple of pixels higher. Nothing else moves.

assets/art/generated/c2_hero_charge_1.png -- he pulls both hands together, cupped, down at his hip behind him, and leans back. Hands empty.

assets/art/generated/c2_hero_charge_2.png -- the same pose, leaning back a little further, hair lifted. Hands empty.

assets/art/generated/c3_hero_fire_1.png -- he thrusts both arms straight forward to the right, palms together, front foot braced, hair blown back. Hands empty.

Do not draw energy, glow, light, beams or auras anywhere. His hands are empty in all five. The game engine adds all of that at runtime." < /dev/null

echo "=== FIN ==="
ls -la assets/art/generated/ | grep -E "c1_|c2_|c3_"

echo "=== postproceso: recorte COMUN a los cinco frames ==="
# pack_sprite_set.py y no postprocess.py --trim: --trim recorta cada imagen por su propio
# contenido, y como la pose de disparo es 501 px de ancho y la de guardia 385, recortadas
# por separado quedan con escalas distintas y el personaje salta entre frames.
G=assets/art/generated; R=public/assets/art/_gameready
python scripts/pack_sprite_set.py --size 128x128 --colors 24 \
  "$G/c1_hero_stance_1.png:$R/hero_stance_1.png" \
  "$G/c1_hero_stance_2.png:$R/hero_stance_2.png" \
  "$G/c2_hero_charge_1.png:$R/hero_charge_1.png" \
  "$G/c2_hero_charge_2.png:$R/hero_charge_2.png" \
  "$G/c3_hero_fire_1.png:$R/hero_fire_1.png" || exit 1

echo
echo "OJO: si regeneras estos sprites, hay que volver a MEDIR las manos y actualizar"
echo "BEAM_FROM y ORB_FROM en src/constants/FINISHER.js. Estan medidos, no estimados."
