#!/usr/bin/env bash
# Sprite de derrota: el heroe tirado en el piso.
#
# Usa la receta que funciono en gen_hero_combat.sh al tercer intento: referencia adjunta y
# prompt CORTO que habla solo de la pose. Cero adjetivos de estilo -- los adjetivos pelean
# contra la imagen de referencia y te devuelven otro personaje.
#
# Este sprite se empaqueta SOLO y no junto a los cinco de combate, y esta bien que sea asi:
# el recorte comun existe para frames que se animan entre si, y la pantalla de DEFEAT no
# anima contra la pose de guardia -- hay un cambio de estado y un velo en el medio. Meter un
# cuerpo tirado (ancho y bajo) en el bbox union de los cinco de pie correria el centro
# horizontal de todos y romperia BEAM_FROM y ORB_FROM, que estan medidos.
cd "C:/Users/jdiaz483/Documents/work/my-proyects/hackaton_aws" || exit 1

REF_SIDE="assets/art/characters/06_hero_side_idle_1.png"
REF_STANCE="assets/art/generated/c1_hero_stance_1.png"

for f in "$REF_SIDE" "$REF_STANCE"; do
  [ -f "$f" ] || { echo "FALTA la referencia $f"; exit 1; }
done

echo "=== sprite de derrota ==="
codex exec --sandbox danger-full-access -m gpt-5.5 \
  -i "$REF_SIDE" -i "$REF_STANCE" -- \
"The attached images are the hero of my game: the first is his idle sprite, the second is his battle stance.

Redraw that exact same character KNOCKED OUT on the ground. Treat this as editing the attached sprite, not as drawing a new character.

Keep him pixel-identical to the attachments: same palette, same outline, same proportions, same head size, same hair, same shirt with its orange chest square, same backpack, same trousers, same boots, same amount of detail and shading. Do not restyle him and do not add detail.

Save one PNG, at least 768x768, on a flat pure green #00b140 background, as assets/art/generated/c6_hero_down_1.png

The pose: he is lying on his side on the ground, facing the viewer, collapsed after losing the fight. Head to the LEFT of the frame, boots to the RIGHT. One arm flopped out in front of him on the floor, the other under him. Legs slack, one knee slightly bent. Eyes closed, mouth slightly open. The backpack has slipped off one shoulder and lies against his back. His whole body is limp -- nothing braced, nothing tensed.

He must read as beaten and exhausted, NOT as injured: no blood, no wounds, no bruises, no torn clothes, no crosses over the eyes. This is a kids' game.

Draw him horizontal and centered in the frame, resting on an invisible floor line near the bottom, with a small margin below his body. No shadow on the green, no ground, no props, no text." < /dev/null

echo "=== postproceso ==="
python scripts/postprocess.py assets/art/generated/c6_hero_down_1.png \
  public/assets/art/_gameready/hero_down_1.png --size 128x128 --chroma --trim --colors 24 || exit 1

echo "=== FIN ==="
ls -la public/assets/art/_gameready/hero_down_1.png
