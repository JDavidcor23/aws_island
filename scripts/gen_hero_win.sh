#!/usr/bin/env bash
# Sprite de victoria: el heroe festejando.
#
# Misma receta que gen_hero_combat.sh y gen_hero_down.sh: referencia adjunta y prompt CORTO
# que habla solo de la pose. Cero adjetivos de estilo -- pelean contra la imagen y te
# devuelven otro personaje. Ver el historial en gen_hero_combat.sh.
#
# De pie y con los pies en el piso, NO saltando: todos los sprites del heroe se dibujan en
# la misma caja de 96 px anclada en LAYOUT.HERO, asi que un cuerpo en el aire habria que
# anclarlo distinto. El festejo se lee igual con el puno arriba.
cd "C:/Users/jdiaz483/Documents/work/my-proyects/hackaton_aws" || exit 1

REF_SIDE="assets/art/characters/06_hero_side_idle_1.png"
REF_STANCE="assets/art/generated/c1_hero_stance_1.png"

for f in "$REF_SIDE" "$REF_STANCE"; do
  [ -f "$f" ] || { echo "FALTA la referencia $f"; exit 1; }
done

echo "=== sprite de victoria ==="
codex exec --sandbox danger-full-access -m gpt-5.5 \
  -i "$REF_SIDE" -i "$REF_STANCE" -- \
"The attached images are the hero of my game: the first is his idle sprite, the second is his battle stance.

Redraw that exact same character CELEBRATING a victory. Treat this as editing the attached sprite, not as drawing a new character.

Keep him pixel-identical to the attachments: same palette, same outline, same proportions, same head size, same hair, same shirt with its orange chest square, same backpack, same trousers, same boots, same amount of detail and shading. Do not restyle him and do not add detail.

Save one PNG, at least 768x768, on a flat pure green #00b140 background, as assets/art/generated/c7_hero_win_1.png

The pose: he stands facing slightly toward the viewer and punches ONE fist straight up over his head in triumph. The other arm is relaxed at his side. Both feet stay planted on an invisible floor line near the bottom of the frame -- he is NOT jumping and NOT airborne. Chest out, chin up, looking upward past his raised fist. He is grinning wide, eyes open and happy. This is the one moment in the whole game where he smiles, so it has to read from across the room.

Full body, head to toe, with a small margin above his raised fist and below his boots.

Do not draw energy, glow, light, sparkles, confetti or auras anywhere. No shadow on the green, no ground, no props, no text. The game engine adds all the effects at runtime." < /dev/null

echo "=== postproceso ==="
# --pad-bottom 5 para que apoye en la MISMA linea de piso que las otras poses del heroe
python scripts/postprocess.py assets/art/generated/c7_hero_win_1.png \
  public/assets/art/_gameready/hero_win_1.png --size 128x128 --chroma --trim --colors 24 --pad-bottom 5 || exit 1

echo "=== FIN ==="
ls -la public/assets/art/_gameready/hero_win_1.png
