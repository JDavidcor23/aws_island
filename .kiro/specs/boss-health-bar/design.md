# Diseño Técnico — Barra de Vida del Jefe

**Owner:** Jennifer · **Rama:** `feature/jennifer`

## Wireframe

Mockup a escala en [`mockup.svg`](./mockup.svg) — abrilo en el navegador.

```
  0                                                                   640
  ┌───────────────────────────────────────────────────────────────────┐ 0
  │ ❤❤❤❤                                             PROBLEMA 2/4    │
  │ ▓▓▓▓▓▓▓▓░░░░░  ← especial (ya existe, NO la toques)               │
  │                        LEGACY SERVER                             │ 58  ← rótulo
  │              ┌────────────────────────────┐                      │
  │              │██████████████│░░░░░│░░░░░░░│  ← ESTA barra        │ 66..78
  │              └──┬──────┬──────┬──────┬────┘                      │
  │                 └ 4 segmentos, uno por problema                  │
  │                                                                  │
  │                        ▓▓▓▓▓▓▓▓▓▓                                │
  │                       ▓ LEGACY   ▓  ← el jefe, 192px             │ 100..292
  │                       ▓  SERVER  ▓     centro en (320, 196)      │
  │                        ▓▓▓▓▓▓▓▓▓▓                                │
  │  🧍                                                              │
  │       ┌──────────────────────────────────────────┐               │
  │       │  caja de diálogo (ya existe)             │               │ 232..354
  └───────┴──────────────────────────────────────────┴───────────────┘ 360
```

**Geometría elegida y por qué no choca con nada:**

| Elemento | Ocupa | ¿Choca? |
|---|---|---|
| Corazones | `x` 12..126, `y` 10..36 | No, la barra arranca en `y` 58 |
| Barra especial | `x` 10..205, `y` 42..80 | No, la barra arranca en `x` 216 |
| Indicador de ronda | esquina sup. der., `y` ~20 | No |
| Caja de diálogo | `y` 232..354 | No |
| Cabeza del jefe | arranca en `y` 100 | No, la barra termina en `y` 78 |

---

## Decisión de arquitectura

**Esto va en canvas, no en DOM.** La barra es HUD: tiene que estar alineada al píxel con los corazones y
con la cabeza del jefe, en el espacio lógico de 640×360. Si la hacés en DOM, tenés que replicar a mano el
factor de escala del CSS y se te va a desalinear en cuanto cambie el tamaño de la ventana.

Ventaja extra: `drawHUD.js` es **tuyo en exclusiva** en esta entrega. Los otros dos features son DOM y no
lo tocan. Cero conflictos de merge.

### De dónde sale el valor (esto es lo importante)

```
G.round        →  cuántos problemas resolvió el jugador (0-based, arranca en 0)
ROUNDS.length  →  4
```

`G.round` se incrementa en `battleLogic.js` dentro de `advance()`, en la fase `EXPLAIN`, cuando el jugador
aprieta ESPACIO después de la explicación del pingüino. **Vos solo lo leés.**

```js
// Cuartos que ya le sacaste al jefe. Se clampea a SEGMENTS - 1 (=3) porque
// el último cuarto NO lo saca una ronda: lo saca el remate (CLOUD_QUEST.md §5).
const chunksLost = Math.min(G.round, BOSS_HEALTH.SEGMENTS - 1)
const targetHp = 1 - chunksLost / BOSS_HEALTH.SEGMENTS
// → ronda 0: 1.00 · ronda 1: 0.75 · ronda 2: 0.50 · ronda 3+: 0.25
```

**Cuidado con `G.extraRound`.** Si el jugador falla timings, `G.round` puede pasar de 4 (el jefe "insiste").
Sin el `Math.min` la barra quedaría en negativo. El clamp resuelve eso: se queda en 25% y pulsa.

### La animación

La barra no puede saltar de 100% a 75% en un frame: se ve barato. Se interpola.

El valor animado se guarda en `G.bossHpDisplay`, con inicialización perezosa dentro de la función de dibujo:

```js
if (G.bossHpDisplay === undefined) G.bossHpDisplay = 1
G.bossHpDisplay += (targetHp - G.bossHpDisplay) * BOSS_HEALTH.LERP
```

Dos cosas que tenés que entender de esto:

1. **Sí, una función de dibujo está mutando estado.** En este codebase eso ya se hace: `drawScene.js`
   empuja partículas a `effects.parts` desde `drawBoss`. Somos consistentes con el estilo que ya existe.
2. **Guardarlo en `G` y no en una variable de módulo resuelve el reinicio gratis.** Cuando el jugador
   aprieta `R`, el engine recrea `G`, entonces `G.bossHpDisplay` vuelve a ser `undefined` y se re-inicializa
   en 1. Si lo guardaras en una variable de módulo (`let displayed = 1` arriba del archivo), sobreviviría al
   reinicio y arrancarías la partida nueva con la barra a medio vaciar. **Ese es el bug que este diseño evita.**

> Nota honesta sobre el lerp: `LERP` es un factor por frame, así que la velocidad depende del framerate.
> A 60fps se ve bien y para un hackatón alcanza. No lo "arregles" con `dt`: las funciones de dibujo no lo reciben.

### El remate

En `FINISH_ANIM` la barra se vacía por tiempo, no por rondas:

```js
if (G.state === GAME_STATES.FINISH_ANIM) {
  const progress = Math.min(1, G.t / TIMING.FINISH_BREAK_DURATION)
  // ...arrastrás bossHpDisplay hacia 0 con este progress
}
```

`TIMING.FINISH_BREAK_DURATION` ya existe y vale `3.2`. **Leelo, no lo redefinas.**

---

## Archivos

### Creás (son tuyos)

```
src/game/render/drawBossHealth.js
src/constants/BOSS_HEALTH.js
```

### Modificás (2 líneas, nada más)

```
src/game/render/drawHUD.js
```

```js
// 1) el import, junto a los otros
import { drawBossHealth } from './drawBossHealth'

// 2) la llamada, DENTRO de drawHUD.
//    ⚠️ CONFIRMAR: tiene que ir ANTES del loop de `effects.floats` del final,
//    para que los textos flotantes queden por encima de tu barra.
drawBossHealth(engine)
```

> **No** agregues campos a `LAYOUT.js` ni a `TIMING.js`. Son archivos compartidos y garantizan conflicto.
> Tus constantes van en tu propio `BOSS_HEALTH.js`.

---

## Constantes

`src/constants/BOSS_HEALTH.js`:

```js
// Barra de vida del Legacy Server. Es un espejo de solo lectura del progreso
// de rondas (G.round). NO es una condición de victoria: ver CLOUD_QUEST.md §5.
export const BOSS_HEALTH = {
  // geometría en el espacio lógico del canvas (640x360)
  x: 216,
  y: 66,
  w: 208,
  h: 12,
  borderWidth: 2,
  labelY: 58,
  labelSize: 9,

  // 4 segmentos = los 4 problemas del jefe
  SEGMENTS: 4,

  // velocidad de la animación (factor de lerp por frame)
  LERP: 0.12,

  // umbral para el pulso de "el remate está cerca"
  PULSE_THRESHOLD: 0.3,
  PULSE_FREQ: 6,

  LABEL: 'LEGACY SERVER',

  // fracción del ancho/alto del PNG donde va el gauge, dentro del marco
  INNER: { x0: 0.075, x1: 0.925, y0: 0.30, y1: 0.70 },

  COLORS: {
    frame: '#3d4763',
    empty: 'rgba(8,10,28,0.82)',
    fill: '#ff5544',
    fillPulse: '#ffd94a',
    label: '#ffffff',
    divider: '#0b0b12',
  },
}

// Fases en las que la barra se dibuja. Fuera de estas, el jefe no está en pantalla.
export const BOSS_HEALTH_VISIBLE_STATES = [
  'PROBLEM',
  'CHOOSE',
  'TIMING',
  'RESOLVE',
  'EXPLAIN',
  'FINISH_LINE',
  'FINISH_ANIM',
]
```

> Importá `GAME_STATES` y armá la lista con sus valores en vez de strings sueltos si querés hacerlo más
> prolijo — es mejor práctica. Los strings de arriba están para que veas cuáles son.

---

## La función de dibujo

`src/game/render/drawBossHealth.js` — firma igual a todas las demás del renderer:

```js
export const drawBossHealth = (engine) => {
  const { ctx, IMG, G } = engine
  // 1. guardas: sprite del jefe cargado + estado visible  → si no, return
  // 2. calcular targetHp desde G.round (con el clamp)
  // 3. si FINISH_ANIM, sobreescribir el target con el vaciado por tiempo
  // 4. lerp de G.bossHpDisplay hacia el target (con init perezoso)
  // 5. si bossHpDisplay <= 0.001 → return (ya no se dibuja)
  // 6. dibujar: rótulo → marco → fondo vacío → relleno → divisores de segmento
}
```

Herramientas que ya tenés y **debés** usar:

| Necesitás | Usá |
|---|---|
| Texto con contorno pixel art | `drawTextOutlined(ctx, txt, x, y, size, color, align)` de `./textHelpers` |
| Rectángulos | `ctx.fillStyle` + `ctx.fillRect` |
| Blink / pulso | `G.time` (segundos totales) — mirá cómo lo hace `drawHUD.js` con `¡MAX!` |

**Redondeá siempre las coordenadas** con `Math.round()` antes de `fillRect`. Es pixel art: media unidad de
píxel te deja bordes borrosos. Fijate que `drawHUD.js` y `drawScene.js` lo hacen en todos los `fillRect`
y `drawImage`.

Orden de dibujo (importa, es canvas: lo último tapa a lo anterior):

```
rótulo LEGACY SERVER
marco (rect del color frame, del tamaño total + borderWidth)
fondo vacío (rect interior, color empty)
relleno (rect interior de ancho = interior * bossHpDisplay, color fill o fillPulse)
divisores (3 líneas verticales de 1px que parten el ancho en 4 segmentos)
```

---

## Cómo lo probás

1. `npm run dev`, apretá ESPACIO hasta entrar al combate.
2. La barra aparece sobre el jefe, al 100%, con su rótulo.
3. Resolvé el problema 1 → la barra **baja suave** a 75%, no de golpe.
4. Resolvé 2 y 3 → 50% y 25%. En 25% **pulsa**.
5. **Fallá timings a propósito** hasta que salga `¡EL JEFE INSISTE!` → la barra se queda en 25%, **no** desaparece ni se va a negativo. (Este es el caso que rompe si te olvidaste el `Math.min`.)
6. Llená la especial → en el remate la barra se vacía a 0 y deja de dibujarse.
7. Apretá `R` → la barra vuelve a 100%, **sin arrastrar el valor animado anterior**.
8. Verificá que corazones, especial, indicador de ronda y diálogos siguen visibles y sin tapar.
9. `git status` → modificaste exactamente **un** archivo compartido: `drawHUD.js`.

---

## El marco pixel art ya existe: `IMG.bossBar`

`boss_bar_frame.png` está generado (208×20, exactamente el tamaño de `BOSS_HEALTH.w` × `.h`) y **ya
registrado** en `ASSETS_MANIFEST.js` con la clave `bossBar`. No tenés que tocar el manifest.

Es un marco de metal oxidado con remaches, un LED rojo en la punta izquierda y **los 3 divisores ya
dibujados** que parten el interior en 4 segmentos. El centro es transparente: **el relleno lo pintás vos
por código, debajo del marco.**

Eso cambia el orden de dibujado:

```
1. rótulo LEGACY SERVER
2. fondo vacío         rect del color `empty`, en el área interna
3. relleno             rect de ancho = interior * bossHpDisplay
4. el marco encima     ctx.drawImage(IMG.bossBar, x, y, w, h)   ← tapa los bordes del relleno
```

**El relleno va DEBAJO del marco, no encima.** Si lo dibujás después, le tapás los remaches y los
divisores, y se pierde todo el detalle del asset.

Como el marco ya trae los divisores, **no los dibujes vos**: te quedarían dobles.

### Mantené el fallback

```js
if (IMG.bossBar) {
  ctx.drawImage(IMG.bossBar, x, y, w, h)
} else {
  // marco dibujado con rects (el diseño original)
}
```

Dos razones: si el archivo se corrompe o alguien lo renombra, la barra sigue funcionando; y te deja
comparar las dos versiones para confirmar que el asset mejora las cosas y no las empeora.

### El área interna

El PNG tiene el marco pegado a los bordes, así que el área rellenable es el rectángulo interior. Empezá
con estos valores y **ajustalos mirándolo corriendo** — están en `BOSS_HEALTH.js`:

```js
// fracción del ancho/alto total donde va el gauge, dentro del PNG
INNER: { x0: 0.075, x1: 0.925, y0: 0.30, y1: 0.70 },
```

Si el relleno se asoma por fuera del marco, subí `x0` / `y0` y bajá `x1` / `y1`.
