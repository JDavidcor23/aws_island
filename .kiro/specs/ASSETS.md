# Assets — estado y prompts de generación

**Owner: Jorge.** Nadie más genera arte. Los specs referencian estos assets por número (`A-1`, `A-2`…).

> 🧭 **Si sólo querés saber CÓMO se genera un asset**, el procedimiento corto está en
> [`.kiro/steering/arte.md`](../steering/arte.md) — Kiro lo carga solo. Este archivo es el registro
> largo: el prompt de cada asset, tal cual se usó, y qué salió mal en el camino.

**Los cinco ya están generados, post-procesados y registrados.** Este documento queda como registro
reproducible del pipeline.

## Pipeline

```bash
codex exec --sandbox danger-full-access -m gpt-5.5 -- "<prompt>" < /dev/null
```

> El `< /dev/null` es **obligatorio** o codex se cuelga esperando stdin.

**Pedile fondo verde puro (RGB 0,255,0), no transparente.** Es más confiable que pedir alfa, y el chroma
key lo resuelve después. Los fondos de escena van sin chroma.

> 🔧 **`postprocess.py` se corrigió el 25/07 y esto afecta a TODO asset que se genere de acá en adelante.**
> Tenía tres problemas que degradaban silenciosamente el arte:
>
> | Antes | Ahora | Por qué importa |
> |---|---|---|
> | `method=MEDIANCUT` | `method=MAXCOVERAGE` | median cut corta el espacio de color por **población**: en una escena dominada por verdes y azules, los colores minoritarios se fusionan y desaparecen. Medido: el terracota de los techos quedaba **marrón** |
> | `dither` por defecto = **Floyd-Steinberg** | `dither=NONE` | el dithering mezcla píxeles para simular tonos intermedios. En pixel art eso es **ruido**: ensucia las zonas planas y pelea con el escalado nearest-neighbor del canvas. **Todo el arte anterior salió dithereado** |
> | `convert("RGBA")` + `save()` sin optimize | modo **paleta** si no hay alfa, `optimize=True` | volver a RGBA tira la compresión. Medido en `scene_island_after`: **206 KB en RGBA contra 76 KB en paleta**, con los mismos 48 colores |
>
> Si algún asset viejo se ve sucio o pesa de más, es esto: **basta con volver a correr `postprocess.py`** sobre
> su raw de `assets/art/`, sin regenerar nada.

Post-proceso — los scripts **viven en el repo**, en `scripts/`:

```bash
# fondo de escena: resize + quantize
python scripts/postprocess.py in.png out.png --size 640x360 --colors 48

# sprite o UI con fondo verde: chroma key + recorte + resize + quantize
python scripts/postprocess.py in.png out.png --size 240x44 --colors 16 --chroma --trim --no-aspect

# sprite sheet horizontal, con baseline COMPARTIDA entre frames
python scripts/split_sheet.py sheet.png out_prefix --frames 2 --size 128x128 --chroma
```

`--no-aspect` estira al tamaño exacto (para marcos de UI). Sin él, encaja sin deformar y centra.

> ⚠️ **`split_sheet.py` existe por una razón concreta:** si recortás cada frame de un sheet por separado, el
> frame con la aleta levantada tiene otro bounding box, se escala distinto, y **los pies quedan a distinta
> altura** — el sprite salta al alternar frames. El script calcula la unión de los bounding boxes y recorta
> todos con la misma ventana, anclando por abajo.

### Tres herramientas más, agregadas con los sprites de combate (26/07)

```bash
# N archivos separados que son frames de una animacion: bbox UNION + recorte comun
python scripts/pack_sprite_set.py --size 128x128 --colors 24 in1.png:out1.png in2.png:out2.png ...

# un sprite que NO es una figura de pie: se ancla abajo en vez de centrarse
python scripts/postprocess.py in.png out.png --size 128x128 --chroma --trim --pad-bottom 5

# tapa un rectangulo de color liso que el generador deja en una esquina
python scripts/patch_solid_block.py in.png out.png
```

> 🔴 **`pack_sprite_set.py` se solapa con `split_sheet.py` y es culpa de haber pedido mal el arte.**
> Los dos calculan el bbox unión de un set y recortan todo con la misma ventana. La diferencia es la
> entrada: `split_sheet` parte **una hoja horizontal**, `pack_sprite_set` toma **N archivos sueltos**.
> Los cinco sprites de combate se pidieron como cinco archivos porque no se miró que `split_sheet` ya
> existía. **Para el próximo set: pedí una hoja horizontal y usá `split_sheet.py`.** No hacen falta
> dos herramientas para esto.
>
> Diferencia de comportamiento, por si importa: `split_sheet` ancla abajo con margen 0;
> `pack_sprite_set` centra, y el anclado se pide aparte con `postprocess.py --pad-bottom`.

**Por qué `--pad-bottom`.** El motor dibuja todos los sprites del héroe en la misma caja de 96 px anclada
en `LAYOUT.HERO`, o sea que la línea de piso es el **borde inferior del lienzo**. Un cuerpo TIRADO
centrado en su lienzo queda flotando: medido, `hero_down` flotaba **25 px** contra las poses de pie. Con
`--pad-bottom 5`, guardia, derrota y victoria apoyan las tres en canvas `y=336`.

**Por qué `patch_solid_block.py`.** Ver A-11 más abajo: pedirle al generador que una zona quede "oscura y
vacía" para poner HUD encima puede devolver un rectángulo de color liso con bordes rectos.

Destino final: `public/assets/art/_gameready/` y registrar la clave en `src/constants/ASSETS_MANIFEST.js`.

## Dirección de arte (aplica a TODOS los prompts)

Pixel art HD, limpio, muy colorido. Semi-anime occidental estilo *Sea of Stars* / *Eastward*.
**Nunca** anime exagerado ni pixel art oscuro. Paleta cálida y saturada en lo sano; óxido, gris y verde
tóxico en la zona del servidor. **El contraste ES la narrativa: mundo vivo vs. tecnología muerta.**

---

## Estado — ✅ TODO GENERADO

Los cinco assets están en `public/assets/art/_gameready/` y **registrados** en
`src/constants/ASSETS_MANIFEST.js`. Los tres specs se pueden ejecutar sin esperar arte.

| # | Asset | Archivo | Tamaño | Clave | Para |
|---|---|---|---|---|---|
| **A-1** | Fondo de la escena de tutorial | `scene_island_path.png` | 640×360 | `islandPath` | `intro-tutorial` |
| **A-2** | Marco de la barra del jefe | `boss_bar_frame.png` | 208×20 | `bossBar` | `boss-health-bar` |
| **A-3** | Logo CLOUD QUEST | `logo_cloud_quest.png` | 400×214 | `logo` | `main-menu` |
| **A-4** | Pingüino hablando | `penguin_talk_1.png` · `penguin_talk_2.png` | 128×128 | `penguinTalk1` · `penguinTalk2` | `intro-tutorial` |
| **A-5** | Marco de botón del menú | `menu_button.png` | 240×44 | `menuButton` | `main-menu` |
| **A-6** | Plancha del mapamundi | `scene_overworld_map.png` | 640×360 | `map` | `overworld` |
| ~~A-7~~ | ~~Nodo de la Isla 0~~ | **reemplazado por A-9** | — | — | — |
| **A-8** | Panorámicas de la isla, par | `scene_island_before.png` · `scene_island_after.png` | 640×360 | `after` | victoria |
| **A-9** | Nodo de la Isla 0, 2 estados | `island0_before.png` · `island0_after.png` | 112×96 | `island0Before` · `island0After` | `overworld` |
| **A-10** | Arena del jefe · camino del tutorial | `scene_battle_arena.png` · `scene_island_path.png` | 640×360 | `arena` · `islandPath` | combate · `intro-tutorial` |
| **A-11** | Costa de la isla desde el mar · bote | `scene_island_shore.png` · `boat.png` | 640×360 · 128×40 | `islandShore` · `boat` | `intro-boat-arrival` |
| **A-12** | Poses de combate del héroe, 5 frames | `hero_stance_1/2` · `hero_charge_1/2` · `hero_fire_1` | 128×128 | `heroStance1/2` · `heroCharge1/2` · `heroFire` | `hero-combat-anim` |
| **A-13** | Derrota y victoria del héroe | `hero_down_1.png` · `hero_win_1.png` | 128×128 | `heroDown` · `heroWin` | `hero-combat-anim` |

> 🔴 **A-8, A-9 y A-10 salen del mismo concepto**: [`CONCEPTO_ISLA_0.md`](./CONCEPTO_ISLA_0.md). **Leelo antes de
> regenerar cualquiera de los seis.** Los primeros assets se generaron con prompts independientes y el
> resultado fueron cuatro mundos distintos en vez de cuatro vistas del mismo lugar — es el error que ese
> documento existe para no repetir.

> ⚠️ A-6 y A-7 **no** van en `ASSETS_MANIFEST.js`. El mapamundi tiene su propio manifest en
> `src/constants/OVERWORLD.js` (`OVERWORLD_ASSETS`), justamente para no tocar el archivo compartido del
> combate. Ver A-6 y A-7 abajo.

Además se registraron los 6 frames de caminata (`walk1`..`walk6`) y `heroSide`, que **existían como
archivos pero no estaban en el manifest**, así que no se cargaban.

Verificado: cero píxeles verdes residuales tras el chroma key, y los dos frames del pingüino tienen los
pies en la misma fila (`y=127`) para que no salte al alternarlos.

Cada asset conserva abajo su prompt y su comando de post-proceso, **tal cual se usaron**. Si hay que
regenerar alguno, es copiar y pegar.

---

## A-1 · Fondo de la escena de tutorial — `scene_island_path.png`

**Por qué hace falta.** Ninguno de los dos fondos que ya tenés sirve para una escena caminable:

| Fondo existente | Qué es | Por qué no sirve acá |
|---|---|---|
| `scene_island_before.png` | plano panorámico de la isla entera vista de lejos, casas de 20px | el héroe a 96px quedaría del tamaño de un molino. No hay línea de piso a su escala |
| `scene_battle_arena.png` | el pie de la torre del servidor en primer plano, plataforma de piedra | **esa es la escena de la pelea.** Ya estás ahí, no caminás hacia nada |

A-1 es **el momento intermedio**: caminás por la isla oxidada, con el servidor todavía **lejos**, al fondo.
Es lo que genera el "tengo que llegar hasta allá".

**Clave en el manifest:** `islandPath`
**Tamaño final:** 640×360

```
Pixel art background, 640x360, side-scrolling adventure game, ground-level eye
view. Foreground: a wide flat walkable path of cracked stone slabs and dry dirt
running horizontally across the lower third, with a clear unobstructed floor line
and empty space above it for character sprites. Midground: an old decayed island
village seen from the side — weathered wooden houses with broken tiled roofs, a
crooked windmill with torn blades, a rusted water tower, dead leaning trees, sickly
yellow-green grass, puddles of stagnant water. Thick rusted cables and corroded
pipes snake out of the ground and run along the path toward the right. Far
background, small and distant on the horizon: the silhouette of a colossal rusted
server tower with faint red glowing lights and columns of dark smoke rising from
it. Everything is old, oxidized and abandoned — rust orange, muted brown, gray
steel, toxic green accents. Overcast purple-gray smoggy sky.
Style: clean HD pixel art, western semi-anime like Sea of Stars and Eastward,
detailed but readable. The server must read as FAR AWAY on the horizon, not
looming in the foreground. No characters, no text, no UI.
```

**Verificación antes de aceptarla:**

- [ ] Hay una **línea de piso plana y clara** en el tercio inferior, sin obstáculos que estorben.
- [x] Un sprite de 64px parado en el camino se ve **proporcionado** con las casas del midground (a 96 quedaba gigante: la casa mide ~155px en el escenario).
- [ ] El servidor se lee **lejano, en el horizonte** — no ocupando media pantalla como en la arena.
- [ ] Se nota que **todo** está viejo y oxidado. Acá no hay contraste vivo/muerto: eso es el par
      `island_before` / `island_after`.
- [ ] Al ponerla al lado de `scene_battle_arena.png`, se entiende que son **dos lugares distintos**.
- [ ] Cero personajes, cero texto.

---

## A-2 · Marco de la barra de vida del jefe — `boss_bar_frame.png`

**Clave en el manifest:** `bossBar`
**Tamaño final:** 208×20 (el área rellenable va en `BOSS_HEALTH.INNER`)

```
Pixel art UI element, horizontal health bar frame for a video game boss, 208x20
pixels, transparent background. Rusted dark metal frame with visible rivets and
chipped paint, industrial and decayed, like salvaged server rack hardware. The
inner area is an empty hollow channel meant to be filled with a red bar by code —
leave it fully transparent, do NOT draw any fill. Three thin vertical divider
notches split the inner channel into four equal segments. Small red warning LED on
the left end cap. Style: clean HD pixel art, 16 colors, crisp 1px outlines, colors
in the rust and dark steel range (#3d4763, #4a4038, #5c5145). No text, no numbers.
```

**Verificación:**

- [ ] El área interna es **transparente**, no rellena (el código pinta el relleno).
- [ ] Los 3 divisores parten el interior en 4 partes **iguales**.
- [ ] A 208px de ancho se ve nítido, sin antialiasing.
- [ ] Pega con `special_bar.png`, que es la barra del jugador.

---

## A-3 · Logo del título — `logo_cloud_quest.png`

**Clave en el manifest:** `logo`
**Tamaño final:** 400×214 (el logo salió 1.875:1, no 3.5:1 como estimé antes de verlo)

```
Pixel art game logo, the words "CLOUD QUEST" on two lines,
transparent background. Chunky bold pixel letterforms with a thick dark outline and
a subtle 3D bevel. The word CLOUD is rendered in soft cyan-white cloud tones with
puffy cloud shapes integrated into the letters; the word QUEST is in warm golden
yellow with a slight metallic shine, like an adventure game title. A tiny orange
AWS-style cube sits as a decorative accent. Palette centered on #7de0ff cyan and
#ffd94a gold, dark navy outline (#0b0b12). Style: clean HD pixel art, readable at
small size, western semi-anime game title like Sea of Stars. Transparent
background, no frame, no tagline, no extra text beyond CLOUD QUEST.
```

**Verificación:**

- [ ] Se lee **CLOUD QUEST** sin ambigüedad, incluso al 60% del tamaño.
- [ ] Fondo transparente de verdad (no verde, no blanco).
- [ ] No dice nada más que "CLOUD QUEST".

---

## A-4 · Pingüino hablando — `penguin_talk_1.png`, `penguin_talk_2.png`

Dos frames para alternar mientras el pingüino habla — le da mucha vida a la escena de tutorial por muy
poco costo.

**Claves en el manifest:** `penguinTalk1`, `penguinTalk2`
**Tamaño final:** 128×128 cada uno

```
Pixel art character sprite sheet, 2 frames side by side, 128x128 per frame,
transparent background. A cute chubby penguin mentor: black back and head, white
belly, orange beak and feet, bright red knitted scarf, small wooden walking staff,
brown backpack. Frame 1: beak open mid-speech, one flipper raised in an explaining
gesture, eyes wide and enthusiastic. Frame 2: beak closed, flipper lowered, eyes
slightly squinted in a warm smile. Same pose, same scale, same baseline in both
frames — only the beak and flipper change. Style: clean HD pixel art, expressive
and exaggerated, western semi-anime like Sea of Stars. Facing right. Transparent
background, no shadow, no text.
```

> ⚠️ **"Same baseline in both frames"** es crítico: si los pies no están a la misma altura, el pingüino
> salta al alternar frames. Es el mismo bug que hay que corregir en el ciclo de caminata (`CLOUD_QUEST.md` §14).

---

## A-5 · Marco de botón del menú — `menu_button.png`

Solo vale la pena si el menú termina muy pelado. **Consultalo antes de generarlo.**

**Clave en el manifest:** `menuButton`
**Tamaño final:** 240×44

```
Pixel art UI button frame, 240x44 pixels, transparent background. Rounded
rectangular plate with a 2px dark outline and a soft inner glow, semi-transparent
dark navy fill (#101528) with a cyan accent border (#7de0ff). Two small cloud-shaped
pixel ornaments at the left and right ends. The center is empty and flat so text can
be drawn on top by code. Style: clean HD pixel art, 16 colors, crisp edges, modern
retro game menu. No text.
```

---

## A-6 · Plancha del mapamundi — `scene_overworld_map.png`

**Clave en el manifest:** `map` (en `OVERWORLD_ASSETS`, no en `ASSETS_MANIFEST`)
**Tamaño final:** 640×360

Es **solo paisaje**: océano y las 8 islas bloqueadas. Dos cosas NO están en el PNG y son a propósito:

| Qué falta en el PNG | Quién lo pone | Por qué |
|---|---|---|
| El camino punteado | `drawOverworld.js` | El camino y el grafo por donde camina el héroe tienen que salir del **mismo dato**. Si el camino es arte, cada nodo hay que reconstruirlo leyendo píxeles y a la primera corrección se desincroniza. |
| El nodo de la Isla 0 | sprite A-7 compuesto en runtime | Tiene **dos estados**, oxidado y revivido. |

```
Top-down overworld world map for a 2D pixel art adventure game, exactly 640x360,
in the spirit of the overworld maps of Super Mario World and Cuphead. Bright
saturated tropical ocean, vivid blue water with crisp pixel wave highlights and
light foam. Nine small compact islands laid out in a single winding serpentine
route, from the bottom-left corner up to the upper-right area. A clearly visible
continuous dotted path of small cream-colored dots connects the islands in order.
Each island is small and readable with a flat open clearing in its middle, so a
32 pixel tall character sprite standing on it reads clearly. The bottom-left
island is fully revealed and cheerful. The other eight are visibly locked: partly
wrapped in soft white clouds and mist, slightly desaturated and cooler, each
marked with a small light-gray padlock icon, but still readable in silhouette.
Art direction, critical: clean HD pixel art, VERY colorful, warm, cheerful and
saturated, western semi-anime like Sea of Stars and Eastward. Absolutely NOT
dark, NOT grim, NOT muddy brown, NOT post-apocalyptic, NOT painterly, NOT
photorealistic. Crisp hard pixel edges, limited palette, no blur, no
anti-aliasing, no gradients. No characters, no people, no text, no letters, no
numbers, no UI frames, no borders.
```

**Post-proceso — OBLIGATORIO, son DOS pasos:**

```bash
# 1. borra el camino punteado que trae la imagen y el pueblo tropical de la Isla 0,
#    rellenando con océano. Lee de assets/art/generated/a6_overworld_map.png
python scripts/clean_overworld_plate.py

# 2. cuantiza. El paso 1 NO cuantiza, y la imagen generada trae ~49.000 colores
python scripts/postprocess.py \
  public/assets/art/_gameready/scene_overworld_map.png \
  public/assets/art/_gameready/scene_overworld_map.png --size 640x360 --colors 48
```

> El paso 2 es fácil de olvidar y sale caro: sin cuantizar, la plancha pesa **324 KB** y es el asset más
> grande del set. Cuantizada baja a **27 KB**, sin pérdida visible — el océano queda incluso más limpio.
> El paso 1 termina imprimiendo el comando del paso 2 para que no se pase por alto.

> **Lo que se aprendió peleándola.** El punteado generado venía **roto**: dos cadenas cortadas y la isla
> jugable sin ninguna salida — el héroe no podía salir de la Isla 0. Y borrarlo por color falla tres veces:
> cada punto es un núcleo casi blanco `(253,252,232)` con un halo que se degrada hasta el azul del agua, así
> que filtrar por color borra el núcleo y **deja el halo, que se ve como un punto más chico**. La solución es
> clasificar la **mancha conexa completa** por luminancia media (clara = camino, oscura = roca del océano) y
> dilatar 2px. El relleno se copia de la **misma fila**: el océano tiene bandeado horizontal y muestrear de
> otra fila deja un escalón visible.

**Verificación:**

- [x] El script chequea el resultado y sale con código **1** si queda alguna mancha clara de más de 20px.
- [x] Las rocas chicas del océano sobreviven (se protegen por ser oscuras).
- [x] El lugar de la Isla 0 queda como agua limpia, sin costura.
- [ ] Quedan **3 manchas de 16, 6 y 2 px** pegadas a la costa de algunas islas: son el primer punto de cada
      tramo, que cae dentro del margen protegido. Se leen como arena y están toleradas. Si molestan, hay que
      bajar `MARGIN` en el script para esas islas puntuales.

---

## A-8 · A-9 · A-10 — las seis vistas del concepto

Los prompts completos, tal cual se usaron, están en [`scripts/gen_isla0.sh`](../../scripts/gen_isla0.sh) y su
estructura es siempre la misma: un bloque `CONCEPT` con los 7 elementos fijos, un bloque `SICK` y un bloque
`HEALED` con las paletas pareadas, y después el encuadre de cada archivo. **Los tres bloques se pegan
literales en cada prompt.** Eso es lo único que garantiza que las seis vistas sean el mismo lugar.

Ver [`CONCEPTO_ISLA_0.md`](./CONCEPTO_ISLA_0.md) para los 7 elementos, las dos paletas y las restricciones
mecánicas de la arena.

### Post-proceso — OBLIGATORIO en las seis

```bash
# las 4 escenas
python scripts/postprocess.py assets/art/generated/a8_island_before.png \
  public/assets/art/_gameready/scene_island_before.png --size 640x360 --colors 48
# los 2 nodos del mapa
python scripts/postprocess.py assets/art/generated/a9_node_before.png \
  public/assets/art/_gameready/island0_before.png --size 112x96 --colors 48
```

**Por qué no es opcional.** Las imágenes que devuelve el generador vienen con **decenas de miles de colores**:
gradientes y antialiasing disfrazados de pixel art. Medido: `scene_island_after` salió con **133.786 colores y
485 KB**, contra los **32 colores** de los assets originales del proyecto. Escalado ~3x con
`image-rendering: pixelated`, eso se ve pastoso y contradice la dirección de arte.

Cuantizadas: **48 colores, 54–76 KB, entre −83% y −86% de peso.** El set entero de `_gameready` quedó en 1.03 MB.

> **Por qué 48 colores con MAXCOVERAGE y no 32 con median cut.** Se comparó en pantalla, no a ojo:
>
> | Método | Resultado |
> |---|---|
> | median cut 32 y 48 | el **terracota de los techos desaparece** y queda marrón. Median cut corta por población y los verdes y azules aplastan numéricamente a los rojos |
> | MAXCOVERAGE 32 | recupera el terracota pero mete tinte violeta en las paredes claras |
> | **MAXCOVERAGE 48** | **fiel al original, 76 KB** ← este |
> | octree 32 y 48 | recupera el terracota pero deja motas celestes sueltas en los techos |
> | median cut 96 | también sirve, pero pesa 117 KB: más caro y menos fiel |
>
> MAXCOVERAGE optimiza cobertura del espacio de color en vez de población, así que los colores minoritarios
> —los techos— sobreviven. Y siempre `dither=NONE`: el dithering inventa ruido y arruina el pixel art.

### Verificación

- [x] Las seis a 48 colores, y el alfa de los dos nodos preservado como transparencia binaria.
- [x] Las panorámicas comparten encuadre, horizonte y silueta exactos; los 7 elementos en su posición.
- [x] El esqueleto del servidor **sigue en pie** en las versiones sanas, tomado por el verde. Misma silueta.
- [x] Las tuberías **siguen cruzando** el mismo suelo, ahora blancas y limpias.
- [x] La arena pasa `check_arena.py`: menos detalle detrás del jefe (7.82 vs 9.72) y piso más plano (11.18 vs 26.23) que la referencia.
- [x] Verificado en el navegador: el jefe se lee **mejor** que en la arena vieja, siluetado contra el hueco pálido.
- [ ] ⚠️ **Preexistente, no lo introdujo A-8.** En la pantalla de victoria el texto blanco de los stats y la
      línea `🔒 Isla 1: EC2 — Próximamente...` **casi no se leen** sobre el fondo brillante. Comprobado con la
      imagen vieja: pasaba igual. El arreglo va en `drawScreens.js` (caja oscura translúcida detrás del texto,
      o subir el contorno) — **archivo del spec `intro-tutorial`**, así que lo decide su owner.

---

## A-11 · A-12 · A-13 — la llegada en barco y las poses del héroe

Los prompts completos, tal cual se usaron, están en los scripts:

| Script | Genera |
|---|---|
| [`scripts/gen_boat_scene.sh`](../../scripts/gen_boat_scene.sh) | A-11 · costa + bote, **y corre el post-proceso** |
| [`scripts/gen_hero_combat.sh`](../../scripts/gen_hero_combat.sh) | A-12 · los 5 frames de combate, **y los empaqueta** |
| [`scripts/gen_hero_down.sh`](../../scripts/gen_hero_down.sh) | A-13 · derrota |
| [`scripts/gen_hero_win.sh`](../../scripts/gen_hero_win.sh) | A-13 · victoria |

Los cuatro traen el historial de errores escrito en el encabezado. **Leelos antes de escribir un prompt
nuevo de personaje** — ahí está la lección que costó tres corridas.

### La lección de A-12: la referencia manda, los adjetivos de estilo la rompen

| Intento | Qué se le pasó | Qué salió |
|---|---|---|
| 1 | descripción de texto, sin referencia | otro chico: proporción adolescente, sombreado con pliegues, sin el cuadradito naranja del pecho |
| 2 | referencias adjuntas **+** lista larga de reglas de estilo ("colores planos", "dos tonos por material", "proporción chibi", "sin pliegues") | un muñeco de tubos con contorno grueso. Y encima interpretó "el cuadradito naranja del pecho" como cuadrados naranjas en los **puños** |
| 3 | referencias adjuntas **+** prompt corto que sólo describe la pose | **en modelo** |

> **Cuando hay imagen de referencia, el prompt tiene que hablar SOLO de la pose.** Los adjetivos de
> estilo pelean contra la imagen y devuelven otro personaje. El estilo lo define el PNG.

Referencias que se adjuntaron con `-i`: `06_hero_side_idle_1.png` (el personaje a resolución de
generación) y `06_hero_walk_right_6_sheet.png` (proporciones en movimiento).

Y un dato de textura: **lo chunky del pixel art del proyecto sale del downscale duro**, no del tamaño de
generación. El original se generó a 1254 px y las hojas a 724 px por frame, y se bajaron a 128/64.
Generar a 256 da demasiado detalle fino y se lee como otro personaje aunque el dibujo esté bien.

### El artefacto de A-11: el rectángulo liso

Al fondo de la costa se le pidió que la esquina superior derecha quedara "oscura y vacía" para poner el
hint de saltear encima. Lo devolvió **literal**: un rectángulo de color liso `(35,29,44)` de 120×40 con
bordes rectos, que en pantalla se lee como un tile que falta.

`patch_solid_block.py` lo detecta por color modal desde la esquina y lo tapa clonando el bloque vecino
de igual tamaño, **espejado en X** — pegarlo tal cual repite las mismas nubes a distancia fija y el ojo
engancha el patrón enseguida.

El prompt de `gen_boat_scene.sh` ya está corregido para no pedir zonas vacías por coordenadas ("que se
funda con el cielo, sin caja ni panel"), pero el parche queda: es idempotente y si no encuentra bloque
no toca nada.

### La geometría de A-11 se midió, no se estimó

Todos los valores de Y de `INTRO_SCENE.BOAT` salen de recorrer el PNG buscando la madera del muelle y el
primer píxel de agua por columna:

| Qué | Valor | Cómo se midió |
|---|---|---|
| Cubierta del muelle | `y=252` | densidad de píxeles de madera máxima entre `y=246` y `y=262` |
| Extensión del muelle | `x=170..336` | misma pasada |
| Línea de agua del bote | `y=318` | agua de primer plano, debajo del muelle |

Lo mismo con A-12: `BEAM_FROM` y `ORB_FROM` en `src/constants/FINISHER.js` salen del **centroide de los
píxeles de piel** en `hero_fire_1.png` y `hero_charge_1.png`, convertido a canvas con la escala real de
dibujado (sprite de 128 pintado a 96 → factor 0.75). Estimados a ojo, el rayo salía **16 px por encima
de las manos** y el orbe 20 px afuera.

> 🔴 **Si regenerás A-12, hay que volver a medir.** `gen_hero_combat.sh` lo avisa al terminar.

### Verificación de A-13 — el anclado

Las tres poses nuevas tienen que apoyar en la misma línea de piso que las de pie, o el héroe flota o se
hunde al cambiar de pantalla:

```bash
python -c "
from PIL import Image
for n in ('hero_stance_1','hero_down_1','hero_win_1'):
    b = Image.open(f'public/assets/art/_gameready/{n}.png').convert('RGBA').getbbox()
    print(f'{n:<14} apoya en canvas y={244 + b[3]*96/128:.0f}')
"
```

- [x] Las tres dan `y=336`.
- [ ] ⚠️ **Sin verificar en pantalla.** La herramienta de browser se cayó antes de poder mirar el
      resultado corriendo. Se verificó la geometría medida sobre los PNG, no el render.

---

## ~~A-7~~ · Nodo de la Isla 0 — reemplazado por A-9

Primer intento del nodo con dos estados. Quedó obsoleto: se generó **antes** de que existiera el concepto, así
que la isla no compartía elementos con el resto de las vistas, y la torre blanca del estado sano se leía como
una losa en blanco. Se conserva el registro porque de acá salió la lección: los pares antes/después **se
generan en la misma corrida**, y sin concepto escrito cada corrida inventa una isla nueva.

El prompt viejo, para referencia histórica:

**Claves:** `island0Before` · `island0After` (en `OVERWORLD_ASSETS`)
**Tamaño final:** 112×96, **fondo transparente**

**Por qué existe.** El pueblo tropical que traía A-6 no era esta isla: la Isla 0 es un **pueblo-empresa
oxidado** con molino, torre de agua y el Legacy Server encima. El molino es su firma visual y aparece en
`island_before`, `island_path` e `island_after`. Un pueblo con palmeras no comparte ni un punto de referencia.

**El requisito difícil es la continuidad**: las dos versiones tienen que ser el MISMO lugar. Por eso se
generan en **una sola corrida**, con instrucción explícita de mantener silueta y posiciones idénticas y
cambiar solo el estado. Generarlas por separado da dos islas distintas.

```
Generate TWO pixel art sprites [...] exactly 112x96 with a fully TRANSPARENT background.

CRITICAL: the two sprites must be the SAME ISLAND in two different states.
Identical island silhouette, identical shoreline, identical positions for every
building. Only the condition changes: decayed versus revived. Draw the second by
repainting the first, not by inventing a new island.

Layout, identical in both: a tall structure on the highest point at the upper
middle; a windmill on the left; a cylindrical water tower on the right; three
small houses in the lower middle; a path of stone slabs winding between them; a
few trees near the edges. Sandy beach ring and a thin white foam outline at the
shore. Everything outside the island silhouette transparent. No padlock, no
characters, no text.

BEFORE: the tall structure is a colossal rusted legacy server tower, dark
corroded metal, stacked server racks, thick cables spilling down like roots, two
or three columns of dark smoke. Windmill crooked with torn blades. Water tower
rusted and stained. Houses with broken sagging roofs. Cracked slabs. Bare dead
trees. Sickly gray-yellow patchy grass, stagnant toxic green puddles, corroded
pipes. Palette: rust orange, corroded brown, gray steel, sickly yellow-green.

AFTER, exact same layout: the rusted tower is GONE, in its place a clean bright
white lighthouse-like tower with soft cyan accents. No smoke. Windmill repaired
and white. Water tower clean. Houses with warm blue-teal tiled roofs. Slabs whole.
Trees full and leafy green. Vivid saturated green grass with small flowers, clear
blue puddles. Palette: warm, saturated, cheerful and alive.
```

**Verificación:**

- [x] Fondo realmente transparente en las dos (verificado por canal alfa).
- [x] Misma silueta, mismo anillo de arena, y molino / torre de agua / 3 casas en la **misma posición**.
- [x] El estado oxidado se lee claramente distinto de las 8 islas coloridas: "esta está enferma".
- [ ] ⚠️ **Pendiente de pulido:** en `island0_after` la torre blanca y la torre de agua se leen como losas
      blancas en blanco, sin remate. Es el arte más flojo que hay en pantalla.

---

## Cuando generes uno — el flujo de distribución

> 🔴 **Los assets se commitean SIEMPRE a `main`, nunca a una rama de feature.**
>
> Los PNG son binarios y **git no los puede mergear**. Si el mismo archivo entra por dos ramas distintas,
> cuando las dos vayan a `main` tenés un conflicto binario que hay que resolver a mano, archivo por archivo.
> Con los assets en `main` hay **una sola fuente de verdad** y nadie se pasa imágenes por WhatsApp.

**Jorge, cuando termines un asset:**

```bash
git checkout main && git pull

# 1. el archivo va acá, con el nombre exacto de este documento
#    public/assets/art/_gameready/<nombre>.png
# 2. registrá la clave en src/constants/ASSETS_MANIFEST.js

git add public/assets/art/_gameready/ src/constants/ASSETS_MANIFEST.js
git commit -m "feat(assets): agrega A-1 scene_island_path"
git push origin main
```

Después avisá en el grupo: **"ya está A-1, hagan `git merge origin/main`"**, y marcá la fila en la tabla de
**Estado** de arriba.

**Nicolás, Jennifer, Osvaldo — cuando avisen que hay un asset nuevo:**

```bash
git add . && git commit -m "wip"   # guardá tu trabajo primero
git fetch origin
git merge origin/main              # trae los assets nuevos a tu rama
```

`git merge origin/main` en vez de `git pull`: te trae lo de `main` **sin** pisar tu trabajo, y si hay
conflicto es en código, no en imágenes.

> ⚠️ **Si te aparece un conflicto en un `.png`**, algo se hizo mal: un asset entró por dos ramas.
> **No lo resuelvas vos** — avisá en el grupo.

**Podés registrar la clave en el manifest antes de tener la imagen.** El manifest se carga entero al
arrancar y una clave sin archivo **no rompe el juego**: entra en `engine.loadErrors` y se dibuja el aviso
en la pantalla de título. Eso desbloquea a quien esté esperando el asset: programa contra la clave, y
cuando el PNG aparece, funciona sin tocar nada.

> El manifest se carga entero en `assets.service.js` al arrancar. Si agregás una clave y el archivo no
> existe, el juego **no explota**: entra en `engine.loadErrors` y se dibuja el aviso en la pantalla de título.
> Aprovechá eso: podés registrar la clave antes de tener la imagen.
