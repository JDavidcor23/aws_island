# Assets faltantes — prompts para generar

**Owner: Jorge.** Nadie más genera arte. Los specs referencian estos assets por número (`A-1`, `A-2`…).

## Pipeline

```bash
codex exec --sandbox danger-full-access -m gpt-5.5 -- "<prompt>" < /dev/null
```

> El `< /dev/null` es **obligatorio** o codex se cuelga esperando stdin.

Post-proceso (`scratchpad/*.py`): chroma key (quitar fondo) → recorte a contenido → fit → downscale →
quantize a 16 colores. **Gotcha conocido:** algunas imágenes de Codex vienen con fondo **verde** en vez de
transparente → hay que aplicar el chroma key.

Destino final: `public/assets/art/_gameready/` y registrar la clave en `src/constants/ASSETS_MANIFEST.js`.

## Dirección de arte (aplica a TODOS los prompts)

Pixel art HD, limpio, muy colorido. Semi-anime occidental estilo *Sea of Stars* / *Eastward*.
**Nunca** anime exagerado ni pixel art oscuro. Paleta cálida y saturada en lo sano; óxido, gris y verde
tóxico en la zona del servidor. **El contraste ES la narrativa: mundo vivo vs. tecnología muerta.**

---

## Estado

| # | Asset | Para | Prioridad |
|---|---|---|---|
| **A-1** | Fondo de la escena de tutorial (nivel de suelo) | `intro-tutorial` | 🔴 **BLOQUEANTE** |
| **A-2** | Marco de la barra de vida del jefe | `boss-health-bar` | 🟡 opcional |
| **A-3** | Logo "CLOUD QUEST" | `main-menu` | 🟡 opcional |
| **A-4** | Pingüino hablando (2 poses) | `intro-tutorial` | 🟢 nice to have |
| **A-5** | Marco de botón del menú | `main-menu` | 🟢 nice to have |

**Solo A-1 es bloqueante.** Los otros cuatro tienen fallback que ya funciona: la barra del jefe se dibuja
con rectángulos, el logo es texto con contorno, y el pingüino actual sirve para el diálogo.

---

## 🔴 A-1 · Fondo de la escena de tutorial — `scene_island_path.png`

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
- [ ] Un sprite de 96px parado en el camino se ve **proporcionado** con las casas del midground.
- [ ] El servidor se lee **lejano, en el horizonte** — no ocupando media pantalla como en la arena.
- [ ] Se nota que **todo** está viejo y oxidado. Acá no hay contraste vivo/muerto: eso es el par
      `island_before` / `island_after`.
- [ ] Al ponerla al lado de `scene_battle_arena.png`, se entiende que son **dos lugares distintos**.
- [ ] Cero personajes, cero texto.

---

## 🟡 A-2 · Marco de la barra de vida del jefe — `boss_bar_frame.png`

**Fallback actual:** `drawBossHealth.js` la dibuja con rectángulos de la paleta. Funciona y es lo entregable.
Este asset la sube de nivel, no la habilita.

**Clave en el manifest:** `bossBar`
**Tamaño final:** 208×20 (el gauge interno va de 155/208 a 965/1000 del ancho — ver `BOSS_HEALTH.js`)

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

## 🟡 A-3 · Logo del título — `logo_cloud_quest.png`

**Fallback actual:** texto `CLOUD QUEST` con `drawTextOutlined` en `#7de0ff`. Legible pero genérico.

**Clave en el manifest:** `logo`
**Tamaño final:** 420×120

```
Pixel art game logo, the words "CLOUD QUEST" on two lines, 420x120 pixels,
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

## 🟢 A-4 · Pingüino hablando — `penguin_talk_1.png`, `penguin_talk_2.png`

**Fallback actual:** `penguin_128.png` estático. Sirve perfectamente.

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

## 🟢 A-5 · Marco de botón del menú — `menu_button.png`

**Fallback actual:** CSS puro (borde + fondo de la paleta). Se ve bien y es más flexible.

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

## Cuando generes uno

1. Guardalo en `public/assets/art/_gameready/` con el nombre exacto de este documento.
2. Registrá la clave en `src/constants/ASSETS_MANIFEST.js`.
3. Avisá en el grupo con el número (`"ya está A-1"`) — hay gente esperando.
4. Marcá la fila en la tabla de **Estado** de arriba.

> El manifest se carga entero en `assets.service.js` al arrancar. Si agregás una clave y el archivo no
> existe, el juego **no explota**: entra en `engine.loadErrors` y se dibuja el aviso en la pantalla de título.
> Aprovechá eso: podés registrar la clave antes de tener la imagen.
