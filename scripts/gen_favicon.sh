#!/usr/bin/env bash
# Icono de la pestaña (favicon) y de la app.
#
# POR QUE NO SE REUSA logo_cloud_quest.png. El logo son las palabras CLOUD QUEST en dos
# renglones a 400x214. A 16 px de pestana eso es una mancha ilegible: el texto no sobrevive.
# Un icono es un problema de diseno distinto al de un logo, y necesita su propio arte —
# silueta unica, gruesa y centrada, que se lea en un cuadrado de 16 px.
#
# POR QUE NO LLEVA REFERENCIA ADJUNTA. La regla 1 de arte.md (si el personaje ya existe, se
# adjunta la imagen y el prompt habla SOLO de la pose) aplica a PERSONAJES que tienen que
# quedar on-model. Acá no hay personaje: es una nube, no existe todavia, y no hay identidad
# que preservar. Entonces si corresponde describir el estilo con palabras.
#
# POR QUE OPACO Y NO CON ALFA. Un icono de app es una placa: fondo propio, esquinas
# redondeadas. Con alfa, en una pestana clara el dibujo queda flotando sin contorno.
cd "$(dirname "$0")/.." || exit 1

OUT="assets/art/generated/f1_favicon.png"
mkdir -p assets/art/generated

# Resolver el binario de codex: la instalacion standalone de Windows lo deja en
# ~/.codex/packages/standalone/current/bin/ y ESO NO ENTRA AL PATH. Ver gen_penguin_walk.sh.
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

echo "=== generacion: icono de la app ==="
"$CODEX" exec --sandbox danger-full-access -m gpt-5.5 -- \
"Generate ONE square pixel art app icon and save it in the current project directory as $OUT, exactly 1024x1024 pixels, fully opaque.

This is the icon for a retro pixel art game called Cloud Quest, about beating an obsolete legacy server by answering its problems with cloud computing. The icon has to survive being shrunk down to 16x16 pixels in a browser tab, so it must be ONE bold centered shape and nothing else.

Composition: a rounded square badge that fills the whole image edge to edge, with a thick dark outline. Inside the badge, one single chunky CLOUD, centered, taking up most of the space, drawn in soft white with cyan shading on its underside. A small four-pointed golden sparkle sits at the upper right of the cloud, overlapping its edge slightly.

Background inside the badge: a dark navy blue, flat, slightly lighter toward the top so the white cloud reads against it. No scene, no landscape, no horizon.

Palette, use these and nothing else: cyan #7de0ff, gold #ffd94a, white #ffffff, dark navy #101528, near black #0b0b12.

Style: clean HD pixel art, crisp hard pixel edges, chunky forms, thick dark outlines, limited flat palette, no anti-aliasing, no blur, no gradients beyond a single flat step.

Critical constraints: no text, no letters, no numbers, no characters, no penguin, no boy, no server, no buildings. Do not draw a thin or detailed illustration -- at 16 pixels only the cloud silhouette and the sparkle should still be distinguishable. Fill the frame: no wide empty margins around the badge." < /dev/null

echo "=== FIN generacion ==="
ls -la assets/art/generated/ | grep -E "f1_favicon"

exec python scripts/make_favicon.py "$OUT"
