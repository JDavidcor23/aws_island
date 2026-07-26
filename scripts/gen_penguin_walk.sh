#!/usr/bin/env bash
# Ciclo de caminata del pinguino mentor: 4 frames, de perfil, mirando a la DERECHA.
#
# POR QUE HACE FALTA. En la intro el pinguino dice "Veni, que te lo muestro una vez" y
# despues se quedaba CLAVADO en PENGUIN_X mientras el heroe se iba caminando solo. El
# jugador se queda esperando a que arranque el que lo invitó. Es el unico personaje del
# juego que pide que lo sigas y no se mueve.
#
# ============================================================================
# HISTORIAL -- LEER ANTES DE TOCAR EL PROMPT
# ============================================================================
#
# Intento 1: FALLO. Devolvio cuatro veces el mismo pinguino PARADO DE FRENTE, con los pies
#   moviendose dos pixeles. No era una caminata, era una foto repetida cuatro veces.
#   Dos errores, los dos mios y los dos en el prompt:
#
#   (a) Le copie el candado de gen_hero_combat.sh:
#         "Keep the character pixel-identical to the attachment [...] If a pixel does not
#          need to move for the pose, it should not change. Change ONLY his feet, his
#          flippers, his staff and the tilt of his body."
#       Eso funciona para POSES SUELTAS distintas (guardia, carga, disparo), donde lo que
#       hay que proteger es la identidad del personaje. En un CICLO DE CAMINATA es
#       exactamente lo contrario: le prohibe mover el cuerpo, y la caminata sale del cuerpo
#       —del sube y baja y del balanceo—, no de los pies. El candado que salvo al heroe mato
#       al pinguino.
#
#   (b) Le dije "seen from the side, same as the attachment" y la referencia
#       (02_penguin_mentor_1.png) es DE FRENTE. La instruccion se contradecia sola, y como
#       avisa arte.md, cuando hay imagen adjunta gana la imagen. Se quedo de frente, y un
#       personaje de frente desplazandose hacia la derecha se lee como que patina.
#
# Conclusion, y es una leccion nueva que no estaba en arte.md:
#
#   > Las reglas de "no cambies nada" son para SETS DE POSES, no para CICLOS. Para un ciclo
#   > hay que adjuntar un ciclo que ya funcione y pedir los deltas MEDIBLES (cuantos pixeles
#   > sube el cuerpo, si los pies estan separados o juntos). "Waddle" o "rock his body" son
#   > adjetivos y el generador los ignora; "4 to 6 pixels higher" no se puede ignorar.
#
# De ahi las DOS referencias de abajo: una dice QUIEN es el personaje, la otra dice QUE es
# un ciclo de caminata en este proyecto.
# ============================================================================
#
# ⚠️ DIFERENCIA CON LOS OTROS gen_*.sh DE ESTA CARPETA: los demas arrancan con
#   cd "C:/Users/jdiaz483/Documents/work/my-proyects/hackaton_aws"
# o sea la ruta absoluta de OTRA maquina, y por eso no corren en ningun otro checkout.
# Este resuelve la raiz del repo desde su propia ubicacion. Si tocas los otros, copiales
# esta linea.
cd "$(dirname "$0")/.." || exit 1

# REF_CHAR: QUIEN es. El ORIGINAL de alta resolucion y no penguin_talk_1.png (que ya esta
# bajado a 128): lo chunky del pixel art del proyecto sale del downscale duro al final, no
# del tamano de generacion. Partir de un PNG de 128 devuelve menos detalle que el resto del
# juego.
REF_CHAR="assets/art/characters/02_penguin_mentor_1.png"
# REF_CYCLE: QUE es un ciclo. Es la caminata del heroe que ya esta en el juego: perfil
# limpio, piernas claramente separadas, brazos balanceando y el cuerpo subiendo y bajando.
# Sin esta segunda referencia el intento 1 devolvio una foto repetida.
REF_CYCLE="assets/art/characters/06_hero_walk_right_6_sheet.png"

for f in "$REF_CHAR" "$REF_CYCLE"; do
  [ -f "$f" ] || { echo "FALTA la referencia $f"; exit 1; }
done

SHEET="assets/art/generated/p2_penguin_walk_4_sheet.png"
mkdir -p assets/art/generated

# Resolver el binario de codex. La instalacion standalone de Windows lo deja en
# ~/.codex/packages/standalone/current/bin/codex.exe (con un junction desde
# AppData/Local/Programs/OpenAI/Codex/bin) y ESO NO ENTRA AL PATH, ni en PowerShell ni en
# git bash. `command -v codex` devuelve vacio y el script moriria con "command not found"
# aunque codex este perfectamente instalado. Exporta CODEX=... para forzar otro.
CODEX="${CODEX:-codex}"
if ! command -v "$CODEX" >/dev/null 2>&1; then
  for candidate in \
    "$HOME/.codex/packages/standalone/current/bin/codex.exe" \
    "$HOME/AppData/Local/Programs/OpenAI/Codex/bin/codex.exe"
  do
    if [ -x "$candidate" ]; then CODEX="$candidate"; break; fi
  done
fi
command -v "$CODEX" >/dev/null 2>&1 || [ -x "$CODEX" ] || {
  echo "NO encuentro el binario de codex. Proba: CODEX=/ruta/a/codex.exe $0"; exit 1; }
echo "codex: $CODEX"

echo "=== generacion: hoja de caminata del pinguino (4 frames, una sola corrida) ==="
"$CODEX" exec --sandbox danger-full-access -m gpt-5.5 -i "$REF_CHAR" -i "$REF_CYCLE" -- \
"I am attaching TWO images and they serve different purposes.

Image 1 is the penguin mentor from my game. It defines WHO the character is: his palette, his outline weight, his shape language, his face, his orange beak and feet, his red scarf, his brown backpack and his wooden walking staff. Keep all of that identical.

Image 2 is the walk cycle of the hero of the same game. It defines WHAT I need you to produce: that camera, that side profile, that amount of leg separation, that arm swing, that rise and fall of the body. Do NOT copy the boy. Copy his ANIMATION.

Your task: draw the penguin from image 1 as a 4 frame WALK CYCLE built like the cycle in image 2.

Turn him to a SIDE PROFILE facing RIGHT. Image 1 shows him from the front and that is NOT what I want here: a front facing character moving sideways reads as sliding on ice. You will see only one eye, one flipper on the near side and one foot leading at a time, exactly like the boy in image 2.

This is an animation, so he MUST visibly move. Do not draw the same pose four times. These are the required differences between frames, and they are measurable, not stylistic:

FRAME 1 -- CONTACT. Near foot planted forward, far foot back and behind him, feet CLEARLY APART with open space between them. Near flipper swung BACK. Staff planted on the ground ahead of him. Body leaning forward over the front foot.
FRAME 2 -- PASSING. Feet together directly under his body, far leg lifted off the ground. His WHOLE BODY, head included, sits HIGHER than in frame 1 by roughly one tenth of his total height, because his legs are straight instead of spread: this is the top of the bounce. Flippers close to his sides. Staff lifted clear of the ground.
FRAME 3 -- CONTACT, MIRRORED STRIDE. The opposite of frame 1: far foot planted forward, near foot back. Feet CLEARLY APART again. Near flipper swung FORWARD. Staff planted again. Body leaning forward.
FRAME 4 -- PASSING. Like frame 2, feet together under the body and the body again at that same raised height, but with the NEAR leg lifted this time instead of the far one.

He is a penguin, so he waddles: in frames 1 and 3 tilt his whole body sideways toward the foot carrying his weight, and tilt it to the OPPOSITE side in frame 3 than in frame 1. The tilt has to be big enough to see at a glance. His scarf trails behind him, and it should hang differently in the high frames than in the low ones.

Ground contact rule: in frames 1 and 3 the planted foot touches the same ground line. In frames 2 and 4 the body is higher but his lowest foot still touches that same ground line. Never draw him floating.

Save ONE horizontal sprite sheet in the current project directory as $SHEET, with the 4 frames side by side left to right, every frame exactly the same width, each frame at least 640 pixels wide. Same camera distance and same zoom in all four frames. Flat saturated pure green #00b140 background across the whole sheet. No floor, no ground shadow, no vignette, no frame borders, no gutters between frames, no text, no numbers, no motion blur, no speed lines, no dust." < /dev/null

echo "=== FIN generacion ==="
ls -la assets/art/generated/ | grep -E "p2_penguin"

# El postproceso y la verificacion viven en su propio script para poder repetirlos sin
# volver a generar (la generacion cuesta minutos, el postproceso es instantaneo).
exec bash scripts/post_penguin_walk.sh "$SHEET"
