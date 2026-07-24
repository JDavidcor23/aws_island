# Diseño Técnico — Escena de Tutorial

**Owner:** Osvaldo · **Rama:** `feature/osvaldo`

## Wireframe

Mockup a escala en [`mockup.svg`](./mockup.svg) — abrilo en el navegador.

```
PASO 1 — WALK_IN (el héroe entra, sin input)
┌────────────────────────────────────────────────────────────────┐
│  cielo morado con smog          ░ servidor lejano, humo ░      │
│     ╱▔▔╲   ┌─┐  ╱▔╲                    ▓▓                     │
│    casas oxidadas, molino roto, cables saliendo del suelo      │
│ ═══════════════════════════════════════════════════════════ ←piso 300
│  🚶→                                            🐧             │
│  x=-40 → 180                                   x=430           │
│                                          [T para saltear]      │
└────────────────────────────────────────────────────────────────┘

PASO 2 — TALK (ESPACIO avanza)              PASO 3 — WALK_OUT (sin input)
┌────────────────────────────────┐          ┌────────────────────────────────┐
│  ░ isla oxidada de fondo ░     │          │  ░ isla oxidada de fondo ░     │
│ ═════════════════════════════  │          │ ═════════════════════════════  │
│   🧍          🐧               │          │            🚶→                 │
│  x=180       x=430             │          │        x=180 → 700             │
│ ┌────────────────────────────┐ │          │                                │
│ │ MENTOR 🐧                  │ │          │  (sale de pantalla)            │
│ │ Cuando ataque, elegí la    │ │          │        ↓                       │
│ │ carta que resuelve ESE     │ │          │   startRound() → COMBATE       │
│ │ problema. 1-4 o clic.      │ │          └────────────────────────────────┘
│ │                 ▼ ESPACIO  │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

---

## Decisión de arquitectura

### 1. Canvas, no DOM

La escena vive **dentro del canvas**, en el espacio lógico de 640×360, como todo el resto del juego.
No es un overlay de React.

Por qué: los sprites del héroe y del pingüino tienen que compartir la línea de piso del fondo, píxel a
píxel, y el ciclo de caminata tiene que correr en el mismo loop que ya existe. En DOM tendrías que replicar
la escala del canvas a mano y sincronizar dos relojes distintos.

### 2. Sub-máquina de estados dentro de `INTRO` — sin tocar `GAME_STATES`

La fase `INTRO` **ya existe** y ya está enganchada: el menú entra ahí y `advance()` la saca hacia el combate.
No vas a agregar fases nuevas al enum de 12 estados.

En vez de eso, la escena lleva su propia sub-máquina en `G.intro`:

```js
G.intro = {
  step: 'WALK_IN',   // 'WALK_IN' | 'TALK' | 'WALK_OUT'
  heroX: -40,        // posición del héroe en el espacio lógico
  line: 0,           // índice de la línea de diálogo actual
  walkTime: 0,       // acumulador para el frame del ciclo de caminata
}
```

Por qué así y no fases nuevas: `GAME_STATES` lo consumen `battleLogic.js`, `drawHUD.js`, `drawScreens.js`,
`GameEngine.js` y `REACT_SCREENS`. Agregar tres valores te obliga a revisar cada uno de esos lugares y a
coordinar con los otros dos features. Una sub-máquina local no toca nada de eso.

### 3. Inicialización perezosa de `G.intro`

`createInitialState()` en `GameEngine.js` **no** define `G.intro`, y no se lo vas a agregar. Se inicializa
solo, la primera vez que la escena corre:

```js
const ensureIntro = (G) => {
  if (!G.intro) G.intro = { ...INTRO_SCENE.INITIAL }
  return G.intro
}
```

Eso resuelve el **Requisito 5** gratis: `reset()` recrea `G` entero, así que `G.intro` desaparece y se
re-inicializa limpio. Si en cambio guardaras el estado en una variable de módulo (`let heroX = -40` arriba
del archivo), sobreviviría al reinicio y el jugador vería la escena arrancando por la mitad. **Ese es el bug
que este diseño evita.**

### 4. La caminata es cinemática: `ESPACIO` es la única tecla

`advance(engine)` en `battleLogic.js` ya se llama cuando el jugador aprieta `ESPACIO` o `Enter` en `INTRO`.
Vas a redirigir ese caso a tu escena. **Cero código de input nuevo.**

Durante `WALK_IN` y `WALK_OUT`, `ESPACIO` no hace nada (o corta la caminata, a tu criterio). Durante `TALK`,
avanza la línea. Cuando se termina la última, arranca `WALK_OUT`.

---

## Archivos

### Creás (son tuyos)

```
src/game/scenes/introScene.js        # la sub-máquina: updateIntroScene + advanceIntroScene
src/game/render/drawIntroScene.js    # el dibujado de la escena
src/constants/INTRO_SCENE.js         # geometría, tiempos y los textos del diálogo
```

### Modificás — 4 renglones, todos exclusivamente tuyos

| Archivo | Cambio |
|---|---|
| `src/game/GameEngine.js` | 1 línea en `update()`: llamar a `updateIntroScene` |
| `src/game/battle/battleLogic.js` | el caso `INTRO` de `advance()` delega a `advanceIntroScene` |
| `src/game/render/drawScreens.js` | `SCREEN_DRAWERS[INTRO]` apunta a tu drawer |
| `src/constants/ASSETS_MANIFEST.js` | registrar el fondo y los 6 frames de caminata |

> **Ninguno de los otros dos features toca estos archivos.** Nicolás está en `App.jsx`, Jennifer en `drawHUD.js`.
> Igual: hacelos **después** de que Jorge cierre el [PASO 0](../PASO-0-DIAZ.md), que toca `GameEngine.js`.

---

## 🔴 Los 6 frames de caminata NO se están cargando

Los archivos existen en `public/assets/art/_gameready/hero_walk_1.png` … `hero_walk_6.png`, pero
**no están en `ASSETS_MANIFEST.js`**, así que `engine.IMG` no los tiene. Si intentás dibujarlos sin
registrarlos, no vas a ver nada y no vas a tener ningún error.

```diff
 export const ASSETS_MANIFEST = {
   arena: 'scene_battle_arena.png',
   after: 'scene_island_after.png',
+  islandPath: 'scene_island_path.png',   // ← asset A-1, lo genera Jorge
   boss: 'boss_192.png',
   hero: 'hero_front_128.png',
+  heroSide: 'hero_side_128.png',
+  walk1: 'hero_walk_1.png',
+  walk2: 'hero_walk_2.png',
+  walk3: 'hero_walk_3.png',
+  walk4: 'hero_walk_4.png',
+  walk5: 'hero_walk_5.png',
+  walk6: 'hero_walk_6.png',
   penguin: 'penguin_64.png',
```

> El manifest se carga entero al arrancar. Si una clave apunta a un archivo que no existe, **el juego no
> explota**: entra en `engine.loadErrors`. Por eso podés registrar `islandPath` antes de que A-1 esté listo
> y desarrollar con el fallback de color plano.

---

## Constantes

`src/constants/INTRO_SCENE.js`:

```js
import { LAYOUT } from './LAYOUT'

// Escena de tutorial: el héroe entra caminando, el pingüino explica, el héroe se va.
// Sub-máquina de la fase INTRO. Ver .kiro/specs/intro-tutorial/
export const INTRO_STEPS = {
  WALK_IN: 'WALK_IN',
  TALK: 'TALK',
  WALK_OUT: 'WALK_OUT',
}

export const INTRO_SCENE = {
  INITIAL: {
    step: INTRO_STEPS.WALK_IN,
    heroX: -40,
    line: 0,
    walkTime: 0,
  },

  // geometría en el espacio lógico del canvas (640x360)
  GROUND_Y: 300,        // línea de piso: los PIES del sprite se apoyan acá
  HERO_SIZE: 96,
  HERO_MEET_X: 180,     // dónde se detiene el héroe a hablar
  HERO_EXIT_X: 700,     // fuera del borde derecho (LAYOUT.W = 640)
  PENGUIN_X: 430,
  PENGUIN_SIZE: 72,

  WALK_SPEED: 92,       // px por segundo
  WALK_FRAME_DURATION: 0.1,   // segundos por frame -> 10 fps
  WALK_FRAME_COUNT: 6,

  PENGUIN_BOB_FREQ: 5,  // el pingüino "habla": oscila mientras dura el diálogo
  PENGUIN_BOB_AMP: 3,

  SKIP_KEY: 't',
  SKIP_HINT: 'T para saltear',

  FALLBACK_BG: '#2b2333',   // si el fondo A-1 no cargó
}

// Las 3 cosas que el jugador necesita saber, en orden.
export const INTRO_LINES = [
  {
    speaker: 'MENTOR 🐧',
    text: 'Al fin llegaste. ¿Ves esa torre al fondo? Es el Legacy Server, y ya no da abasto con la isla.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'No lo vas a vencer a golpes. Cada vez que ataque va a gritar un PROBLEMA concreto.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Vos elegís la característica de la nube que resuelve ESE problema. Con 1-4 o con un clic.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Y cuando el ataque venga hacia vos, apretá ESPACIO en el momento justo para bloquearlo.',
  },
  {
    speaker: 'MENTOR 🐧',
    text: 'Mientras más preciso el bloqueo, más se carga tu especial. Cuando se llene, lo terminás. ¡Andá!',
  },
]
```

> `GROUND_Y` es la coordenada donde apoyan **los pies**. Al dibujar, la esquina superior del sprite va en
> `GROUND_Y - HERO_SIZE`. Si dibujás centrado como hace `drawScene.js` con el héroe de batalla, el personaje
> va a flotar. Es el error más fácil de cometer acá.

---

## La sub-máquina

`src/game/scenes/introScene.js` expone dos funciones:

```js
// Se llama cada frame desde GameEngine.update() mientras G.state === INTRO
export const updateIntroScene = (engine, dt) => {
  const intro = ensureIntro(engine.G)

  switch (intro.step) {
    case INTRO_STEPS.WALK_IN:
      // avanzar heroX hacia HERO_MEET_X; acumular walkTime
      // al llegar -> intro.step = TALK
      break
    case INTRO_STEPS.TALK:
      // nada que actualizar: el diálogo avanza por input
      break
    case INTRO_STEPS.WALK_OUT:
      // avanzar heroX hacia HERO_EXIT_X
      // al salir -> startRound(engine)
      break
  }
}

// Se llama desde el caso INTRO de advance() cuando el jugador aprieta ESPACIO
export const advanceIntroScene = (engine) => {
  const intro = ensureIntro(engine.G)
  if (intro.step !== INTRO_STEPS.TALK) return
  intro.line += 1
  if (intro.line >= INTRO_LINES.length) intro.step = INTRO_STEPS.WALK_OUT
  else sfxService.confirm()
}

// Saltear: arranca el combate ya
export const skipIntroScene = (engine) => startRound(engine)
```

**Movimiento independiente del framerate.** Usá siempre `dt`:

```js
intro.heroX += INTRO_SCENE.WALK_SPEED * dt          // ✅
intro.heroX += 1.5                                  // ❌ depende del framerate
```

`GameEngine.update()` ya clampea `dt` a `MAX_DT = 0.05`, así que un frame lento no te teletransporta al héroe.

**El frame de caminata** sale del acumulador, no de `G.time`, así el ciclo arranca siempre en el frame 1:

```js
const frameIndex = Math.floor(intro.walkTime / INTRO_SCENE.WALK_FRAME_DURATION) % INTRO_SCENE.WALK_FRAME_COUNT
```

---

## El dibujado

`src/game/render/drawIntroScene.js`, firma igual a todos los demás drawers: `(engine) => {}`.

Orden de dibujado (es canvas: lo último tapa lo anterior):

```
1. fondo               IMG.islandPath, o fillRect con FALLBACK_BG si no cargó
2. pingüino            en PENGUIN_X, con el bob si step === TALK
3. héroe               frame de caminata si camina, heroSide si está quieto
4. hint de saltear     drawTextOutlined, esquina que no tape nada
5. caja de diálogo     solo si step === TALK
```

Herramientas que **ya existen** y tenés que reusar en vez de reescribir:

| Necesitás | Usá | Está en |
|---|---|---|
| La caja de diálogo con nombre, wrap de texto y el `▼ ESPACIO` parpadeante | `drawDialogue(engine, speaker, msg)` | `drawScreens.js` |
| Texto con contorno pixel art | `drawTextOutlined(ctx, txt, x, y, size, color, align)` | `textHelpers.js` |
| Sonido de confirmación al avanzar diálogo | `sfxService.confirm()` | `sfx.service.js` |
| Arrancar el combate | `startRound(engine)` | `battleLogic.js` |

> `drawDialogue` ya está exportado y ya hace el wrap a 40 caracteres, el nombre del hablante y el
> parpadeo. **No escribas tu propia caja de diálogo.** El Requisito 2.5 se cumple usando esta.

**Redondeá las coordenadas** con `Math.round()` antes de cada `drawImage`. Es pixel art: media unidad de
píxel deja el sprite borroso. Fijate que `drawScene.js` lo hace en todos los `drawImage`.

---

## Los 4 enganches

**1 · `GameEngine.js` — en `update()`, junto a los otros bloques por fase:**

```diff
     effects.update(dt)
     updateAttack(this, dt)

+    if (G.state === GAME_STATES.INTRO) updateIntroScene(this, dt)
+
     if (G.state === GAME_STATES.RESOLVE && G.t > TIMING.RESOLVE_DURATION) {
```

**2 · `battleLogic.js` — el caso `INTRO` de `advance()`:**

```diff
     case GAME_STATES.INTRO:
-      sfxService.confirm()
-      startRound(engine)
+      advanceIntroScene(engine)
       break
```

> Antes, `ESPACIO` en `INTRO` arrancaba el combate directo. Ahora avanza el diálogo, y es tu escena la que
> decide cuándo llamar a `startRound`.

**3 · `drawScreens.js` — el mapa de drawers:**

```diff
 export const SCREEN_DRAWERS = {
   [GAME_STATES.TITLE]: drawTitleScreen,
-  [GAME_STATES.INTRO]: drawIntroScreen,
+  [GAME_STATES.INTRO]: drawIntroScene,
```

`drawIntroScreen` (el viejo, que solo dibujaba pingüino + diálogo) queda sin uso. **Borralo** junto con
`drawPenguin` si nadie más lo usa — no dejes código muerto.

**4 · `ASSETS_MANIFEST.js`** — el diff de más arriba.

### El HUD ya se apaga solo

`GameEngine.draw()` tiene `NO_HUD_STATES = [TITLE, DEFEAT, VICTORY]`. `INTRO` **no** está en esa lista, así
que hoy el HUD se dibujaría sobre tu escena y rompe el **Requisito 6.4**.

Agregá `GAME_STATES.INTRO` a ese array. Es una palabra:

```diff
-const NO_HUD_STATES = [GAME_STATES.TITLE, GAME_STATES.DEFEAT, GAME_STATES.VICTORY]
+const NO_HUD_STATES = [GAME_STATES.TITLE, GAME_STATES.INTRO, GAME_STATES.DEFEAT, GAME_STATES.VICTORY]
```

> ⚠️ Coordinalo con Jennifer: esa línea está en `GameEngine.js`, no en `drawHUD.js`, así que **no chocan**.
> Pero avisale igual, porque su barra del jefe tampoco tiene que aparecer en tu escena.

### La tecla de saltear

`GameEngine.handleKeyDown` maneja el teclado por fase. `T` no está usada por nada. Agregá el caso al
principio, junto al de `R`:

```js
if (G.state === GAME_STATES.INTRO && (key === 't' || key === 'T')) {
  skipIntroScene(this)
  return
}
```

**Verificá que no rompiste nada:** `ESPACIO`, `1`-`4`, `R` y las flechas tienen que seguir funcionando
exactamente igual en todas las fases.

---

## Estilo visual

Paleta del juego — usá estos valores, no inventes otros:

| Uso | Color |
|---|---|
| Hint de saltear | `#9fb6d8` |
| Fondo de fallback | `#2b2333` |
| Texto de diálogo | lo maneja `drawDialogue`, no lo toques |

La escena es **oxidada y vieja**, sin contraste vivo/muerto: ese contraste es del par
`island_before` / `island_after`, no de acá.

---

## Cómo lo probás

1. `npm run dev` → apretá `ESPACIO` en el título → entrás a la escena.
2. El héroe **entra caminando** desde la izquierda, con el ciclo de 6 frames, y **los pies apoyados en el piso**.
3. Se detiene junto al pingüino y aparece la caja de diálogo.
4. `ESPACIO` recorre las 5 líneas. El pingüino se mueve mientras habla.
5. Después de la última línea, el héroe camina hacia la derecha, sale de pantalla, y **arranca el combate**.
6. El combate funciona **exactamente** como antes: 4 rondas → remate → victoria.
7. **Sin HUD durante la escena:** ni corazones, ni especial, ni indicador de ronda, ni la barra del jefe.
8. `T` en cualquier momento de la escena → salta directo al combate, con el estado intacto.
9. `R` durante la escena → reinicia sin quedar trabado.
10. `R` después de la escena → la escena vuelve a arrancar **desde el principio**, con el héroe fuera de pantalla. _(Si guardaste el estado en una variable de módulo, acá revienta.)_
11. Renombrá `scene_island_path.png` a mano → la escena sigue funcionando con el color plano.
12. Renombrá `hero_walk_3.png` → la escena sigue funcionando, sin frame faltante que rompa.
13. Redimensioná la ventana: el héroe sigue apoyado en el piso (el canvas escala solo, no hay nada que ajustar).
