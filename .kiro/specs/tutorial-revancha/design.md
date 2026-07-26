# Diseño — Tutorial Guiado + Revancha

**Rama:** `feature/tutorial-revancha` · Leé [`requirements.md`](./requirements.md) primero.

## La idea en una línea

`G.state` ya maneja las 12 pantallas. Le agregamos un eje **ortogonal**, `G.phase`, que decide *cómo se
comportan* esas pantallas. Dos fases, cero pantallas duplicadas.

```
G.state  →  QUÉ pantalla se está mostrando   (PROBLEM, CHOOSE, TIMING, ...)
G.phase  →  CÓMO se comporta esa pantalla    (TUTORIAL | REMATCH)
```

Todo lo que difiere entre fases vive en **una sola tabla** (`PHASE_CONFIG`). Si mañana hay que tunear la
revancha, se toca ahí y en ningún otro lado. Ese es el criterio de diseño: **una fuente de verdad por
diferencia**, no `if (phase === ...)` desparramados.

## Archivos

### Nuevos (4)

| Archivo | Responsabilidad |
|---|---|
| `src/constants/PHASES.js` | los dos identificadores de fase y la tabla `PHASE_CONFIG` |
| `src/constants/CARD_INFO.js` | geometría, colores y textos del panel de información y del badge `?` |
| `src/game/render/drawCardInfo.js` | dibuja el panel de información sobre `CHOOSE` |
| `src/game/render/drawPhaseScreens.js` | dibuja `TUTORIAL_CLEAR` y `REMATCH_INTRO` |

### Modificados (7)

| Archivo | Qué se toca |
|---|---|
| `src/constants/CARDS.js` | agrega `es`, `what`, `blocks` a las 4 cartas |
| `src/constants/GAME_STATES.js` | agrega `TUTORIAL_CLEAR` y `REMATCH_INTRO` |
| `src/constants/INTRO_SCENE.js` | `INTRO_LINES` baja de 5 líneas a 2 |
| `src/constants/UI_TEXTS.js` | textos de las dos pantallas nuevas |
| `src/game/battle/battleLogic.js` | **el nervio.** `startRound`, `currentRound`, `pickCard`, `updateChooseTimer`, `attackSpeed`, `advance`, + `endRound`, `needsExplain`, `beginRematch`, `openCardInfo`, `closeCardInfo` |
| `src/game/render/drawCards.js` | brillo guía, badge `?`, timer leído desde la fase |
| `src/game/render/drawScreens.js` | registrar las dos pantallas nuevas en `SCREEN_DRAWERS` |
| `src/game/GameEngine.js` | estado inicial, `reset()`, `setState()`, input del panel, auto-avance de `PROBLEM`, ruteo de dibujo |

**`COMBAT_PACING.js` NO se toca.** Conserva `TIMEOUT_WARN_THRESHOLD`, que sigue usándose. Su
`FIRST_TIMED_ROUND` queda sin consumidores — se deja para no ensanchar el diff a dos días de la entrega.

**No se toca:** `LAYOUT.js`, `TIMING.js`, `drawHUD.js`, `drawBossHealth.js`, `drawScene.js`, `attack.js`,
`ASSETS_MANIFEST.js`, ni nada de `src/components/`, `src/pages/`, `src/stores/`, `src/services/`.
Cero assets nuevos.

---

## 1 · `PHASES.js` — la tabla que manda

```js
// Fases de combate. Es un eje ORTOGONAL a GAME_STATES: la fase no dice qué
// pantalla se muestra, dice cómo se comporta la pantalla que se está mostrando.
export const PHASES = {
  TUTORIAL: 'TUTORIAL',
  REMATCH: 'REMATCH',
}

export const PHASE_CONFIG = {
  [PHASES.TUTORIAL]: {
    chooseTimeLimit: null,          // null = sin timer, y no se dibuja
    loseHeartOnWrong: false,        // equivocarse mientras aprendés no cuesta
    guidedFirstProblem: true,       // problema 1: la carta brilla Y exige leer su info
    explainAlways: true,            // el mentor explica acertando o fallando
    problemNeedsSpace: true,        // PROBLEM espera ESPACIO
    specialTriggersFinisher: false, // el tutorial termina por rondas, no por especial
    atkSpeedMult: 1,
  },
  [PHASES.REMATCH]: {
    chooseTimeLimit: 3,
    loseHeartOnWrong: true,
    guidedFirstProblem: false,
    explainAlways: false,           // solo explica si erraste carta o falláste el bloqueo
    problemNeedsSpace: false,       // encadena solo
    specialTriggersFinisher: true,
    atkSpeedMult: 1.35,
  },
}
```

> **Siete claves, no nueve.** El brillo y el panel obligatorio son **un solo flag**
> (`guidedFirstProblem`): siempre van juntos, y dos flags que nunca difieren son dos formas de que se
> desincronicen. Tampoco hay un `shuffleRoundOrder`: el orden lo mezcla `beginRematch`, que es el único
> camino a la fase 2 — un flag ahí sería configuración que nadie lee.

## 2 · `CARDS.js` — las cartas dicen qué hacen

Hoy es `ela: { label: 'Rapid Elasticity' }` y nada más. **Ese es el bug de diseño real.** Los campos nuevos
son lo que el jugador lee en el panel:

```js
export const CARDS = {
  ela: {
    label: 'Rapid Elasticity',
    es: 'Elasticidad Rápida',
    what: 'La nube agrega o quita servidores sola, según cuánta demanda haya en ese momento.',
    blocks: 'PICOS DE CARGA — avalanchas de usuarios, tráfico repentino.',
  },
  self: {
    label: 'Self-Service',
    es: 'Autoservicio',
    what: 'Pedís los recursos vos mismo, cuando los necesitás, sin trámite ni gente en el medio.',
    blocks: 'ESPERAS Y TRÁMITES — pedidos que tardan días en aprobarse.',
  },
  net: {
    label: 'Network Access',
    es: 'Acceso por Red',
    what: 'Al servicio se llega por la red desde cualquier lugar y con cualquier dispositivo.',
    blocks: 'BARRERAS DE DISTANCIA — usuarios lejanos, acceso desde otro país.',
  },
  pool: {
    label: 'Resource Pooling',
    es: 'Recursos Compartidos',
    what: 'Una misma infraestructura sirve a muchos clientes a la vez, aislados entre sí.',
    blocks: 'SATURACIÓN POR MULTITUD — miles de clientes sobre la misma máquina.',
  },
}
```

> Los `blocks` están redactados como **tipo de ataque**, no como definición de manual. Eso es a propósito:
> el jugador tiene que poder leer *"PICOS DE CARGA"* y mapearlo contra *"¡Llegaron 100.000 usuarios DE
> GOLPE!"* sin saber nada de nube.

## 3 · Estado nuevo en `G`

En `createInitialState()` de `GameEngine.js`:

```js
phase: PHASES.TUTORIAL,
tutorialDone: false,     // ÚNICO campo que sobrevive a reset()
order: [0, 1, 2, 3],     // índices de ROUNDS en el orden en que se juegan
infoCard: null,          // id de carta con el panel abierto, o null
infoSeen: new Set(),     // ids cuya info ya se consultó (alimenta el gate del problema 1)
lastResult: null,        // YA EXISTE — pero ahora hay que limpiarlo por ronda (ver trampa 1)
```

El panel de información es **un flag, no un `GAME_STATES` nuevo**. Se dibuja encima de `CHOOSE` y no
interrumpe la máquina de estados. Dos consecuencias buenas: el timer de la revancha sigue corriendo mientras
leés (requisito 5.9, gratis), y no hay una transición nueva que pueda dejar el juego trabado.

## 4 · `battleLogic.js` — el nervio

### `currentRound` pasa por `order`

```js
export const currentRound = (G) => ROUNDS[G.order[G.round % ROUNDS.length]]
```

### `startRound` limpia lo de la ronda anterior

```js
export const startRound = (engine) => {
  const { G } = engine
  G.cards = shuffle(CARD_IDS)
  G.wrong = new Set()
  G.sel = 0
  G.chosen = null
  G.atk = null
  G.lastResult = null   // ← NUEVO. Ver trampa 1.
  G.infoCard = null     // ← NUEVO. Ver trampa 2.
  engine.setState(GAME_STATES.PROBLEM)
  G.shake = 8
  sfxService.shout()
}
```

### `pickCard` — el gate de información y el castigo por fase

```js
export const pickCard = (engine, index) => {
  const { G, effects } = engine
  const id = G.cards[index]
  if (!id || G.wrong.has(id)) return
  const cfg = PHASE_CONFIG[G.phase]
  const isCorrect = id === currentRound(G).ans

  // Gate del problema 1: la carta brilla, pero no se confirma sin haber leído su info.
  if (isCorrect && cfg.guidedFirstProblem && G.round === 0 && !G.infoSeen.has(id)) {
    effects.addFloat(LAYOUT.W / 2, 120, CARD_INFO.GATE_HINT, CARD_INFO.COLORS.hint, 12)
    sfxService.select()
    return
  }

  if (isCorrect) {
    sfxService.confirm()
    G.chosen = id
    effects.addFloat(LAYOUT.W / 2, 120, UI_TEXTS.PICK_CORRECT, '#7dff7d', 13)
    G.atk = { phase: 'windup', t: 0, x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y, blocked: null, warned: false }
    engine.setState(GAME_STATES.TIMING)
  } else {
    G.wrong.add(id)
    effects.addFloat(LAYOUT.W / 2, 120, UI_TEXTS.PICK_WRONG, '#ff8866', 11)
    if (cfg.loseHeartOnWrong) loseHeart(engine)
    else sfxService.wrong()   // suena el error, pero no cuesta vida
  }
}
```

### `updateChooseTimer` — el timer lo decide la fase, no la ronda

```js
export const updateChooseTimer = (engine) => {
  const { G, effects } = engine
  if (G.state !== GAME_STATES.CHOOSE) return
  const limit = PHASE_CONFIG[G.phase].chooseTimeLimit
  if (limit === null) return          // reemplaza el guard de COMBAT_PACING.FIRST_TIMED_ROUND
  if (G.t < limit) return
  effects.addFloat(LAYOUT.W / 2, 120, UI_TEXTS.TIMEOUT, '#ff5544', 13)
  sfxService.miss()
  loseHeart(engine)                    // solo corre en REMATCH → no necesita guard de fase
  if (G.hearts > 0) {
    G.atk = { phase: 'hit', t: 0, x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y, blocked: 'miss', warned: false }
    engine.setState(GAME_STATES.RESOLVE)
  }
}
```

### `attackSpeed` con el multiplicador de fase

```js
export const attackSpeed = (G) =>
  (TIMING.ATK_BASE_SPEED + Math.min(G.round, TIMING.ATK_SPEED_MAX_ROUNDS) * TIMING.ATK_SPEED_PER_ROUND) *
  PHASE_CONFIG[G.phase].atkSpeedMult
```

### `needsExplain` y `endRound` — el corazón del ritmo

Hoy `EXPLAIN` es un paso obligatorio del que solo se sale con `ESPACIO`. Lo partimos en dos: **¿hace falta
explicar?** y **¿cómo se cierra la ronda?**

Ojo con una tercera forma de fallar que no es ni carta errada ni bloqueo fallado: **el timeout.**
`updateChooseTimer` cobra un corazón pero no escribía `lastResult`, así que `needsExplain` daba `false` y la
revancha encadenaba a la ronda siguiente sin explicar nada después de sacarte vida. El requisito 5.6 solo
autoriza encadenar cuando el jugador **resolvió** el problema, y un timeout no resolvió nada. Por eso la rama
del timeout setea `G.lastResult = 'miss'`.

```js
// La revancha solo frena si el jugador se equivocó de carta, falló el bloqueo o se le acabó el tiempo.
export const needsExplain = (G) =>
  PHASE_CONFIG[G.phase].explainAlways || G.wrong.size > 0 || G.lastResult === 'miss'

// Cierra la ronda: remate, siguiente problema, o fin del tutorial.
export const endRound = (engine) => {
  const { G } = engine
  const cfg = PHASE_CONFIG[G.phase]

  if (cfg.specialTriggersFinisher && G.special >= TIMING.SPECIAL_MAX) {
    engine.setState(GAME_STATES.FINISH_LINE)
    return
  }

  G.round++

  if (G.phase === PHASES.TUTORIAL && G.round >= ROUNDS.length) {
    G.tutorialDone = true
    engine.setState(GAME_STATES.TUTORIAL_CLEAR)
    return
  }

  if (G.round >= ROUNDS.length) G.extraRound = true
  startRound(engine)
}
```

`endRound` se llama desde **dos lugares**: el caso `EXPLAIN` de `advance()` (el jugador apretó `ESPACIO`) y
la transición automática de `RESOLVE` cuando no hace falta explicar. Ese es exactamente el punto donde
desaparecen las interrupciones de la revancha.

### `beginRematch` — el reset de la fase 2

```js
export const beginRematch = (engine) => {
  const { G } = engine
  G.phase = PHASES.REMATCH        // ANTES de startRound: PROBLEM lee la config de la fase
  G.round = 0
  G.extraRound = false
  G.hearts = TIMING.MAX_HEARTS
  G.special = 0
  G.perfects = 0
  G.order = shuffle([...Array(ROUNDS.length).keys()])
  G.infoSeen = new Set()
  startRound(engine)
}
```

### El panel: abrir y cerrar

```js
export const openCardInfo = (engine, index) => {
  const { G } = engine
  const id = G.cards[index]
  if (!id) return
  G.infoCard = id
  G.infoSeen.add(id)      // esto es lo que abre el gate del problema 1
  G.sel = index
  sfxService.select()
}

export const closeCardInfo = (engine) => {
  engine.G.infoCard = null
  sfxService.confirm()
}
```

### `advance()` — los dos casos nuevos y el `EXPLAIN` simplificado

```js
case GAME_STATES.PROBLEM:
  // solo llega acá si la fase pide input; en REMATCH avanza el motor solo
  if (G.t > TIMING.PROBLEM_MIN_WAIT) {
    sfxService.confirm()
    engine.setState(GAME_STATES.CHOOSE)
  }
  break

case GAME_STATES.EXPLAIN:
  sfxService.confirm()
  endRound(engine)          // reemplaza el bloque de special/round++/startRound
  break

case GAME_STATES.TUTORIAL_CLEAR:
  if (G.t > TIMING.PROBLEM_MIN_WAIT) {
    sfxService.confirm()
    engine.setState(GAME_STATES.REMATCH_INTRO)
  }
  break

case GAME_STATES.REMATCH_INTRO:
  if (G.t > TIMING.PROBLEM_MIN_WAIT) {
    sfxService.shout()
    beginRematch(engine)
  }
  break
```

## 5 · `GameEngine.js`

### `reset()` preserva un solo bit

```js
reset() {
  const tutorialDone = this.G.tutorialDone
  this.G = createInitialState()
  this.effects.clear()
  if (tutorialDone) {
    this.G.tutorialDone = true
    this.G.phase = PHASES.REMATCH
    this.setState(GAME_STATES.REMATCH_INTRO)   // el ESPACIO de acá llama a beginRematch
    return
  }
  this.setState(this.initialState)
}
```

`REMATCH_INTRO` y no `startRound` directo: así `beginRematch` es el **único** camino a la fase 2 y no hay dos
lugares que inicialicen corazones y especial.

### `update()` — auto-avance de `PROBLEM` y la bifurcación de `RESOLVE`

```js
if (G.state === GAME_STATES.PROBLEM &&
    !PHASE_CONFIG[G.phase].problemNeedsSpace &&
    G.t > TIMING.PROBLEM_MIN_WAIT) {
  this.setState(GAME_STATES.CHOOSE)
}

if (G.state === GAME_STATES.RESOLVE && G.t > TIMING.RESOLVE_DURATION) {
  if (needsExplain(G)) this.setState(GAME_STATES.EXPLAIN)
  else endRound(this)
}
```

### `handleKeyDown` — el panel se atiende primero

El bloque va **después** del check de `R` y **antes** del de `CHOOSE`:

```js
if (G.infoCard) {
  // ESPACIO y ENTER NO cierran: ver más abajo. Cierran I, ESC y cualquier clic.
  if (key === 'i' || key === 'I' || key === 'Escape') closeCardInfo(this)
  return          // mientras el panel está abierto, nada más recibe input
}

if (G.state === GAME_STATES.CHOOSE) {
  if (key === 'i' || key === 'I') { openCardInfo(this, G.sel); return }
  // ... el resto igual que hoy
}
```

> ⚠️ **`ESPACIO` y `ENTER` quedan FUERA del set de cierre, a propósito.** En este juego `ESPACIO` ya avanza
> diálogos, bloquea ataques y confirma carta, y el jugador está entrenado a machacarlo. Si cerrara el panel,
> el segundo `ESPACIO` — o el auto-repeat del teclado con la tecla apretada — caería en el bloque de `CHOOSE`
> y confirmaría `G.sel`, que es justo la carta que se estaba leyendo, porque `openCardInfo` la seleccionó.
> Resultado: inspeccionar una carta la juega, y eso cuesta un corazón. Se detectó revisando la tarea 8.
> `I` alterna el panel, `Escape` lo cierra, y cualquier clic también.

### `handleMouseDown` — el badge se chequea ANTES que la carta

```js
if (G.infoCard) { closeCardInfo(this); return }

if (G.state === GAME_STATES.CHOOSE) {
  const { x, y } = this.canvasCoords(e)
  const badge = cardInfoBadgeAt(x, y, G.sel)   // ← PRIMERO. Ver trampas 3 y 5.
  if (badge >= 0) { openCardInfo(this, badge); return }
  const index = cardIndexAt(x, y)
  if (index >= 0) { G.sel = index; pickCard(this, index) }
}
```

> ⚠️ **`cardInfoBadgeAt` toma TRES argumentos**, y el tercero es `G.sel`. No es opcional — ver trampa 5.

`handleMouseMove` arranca con `if (G.infoCard) return` para que mover el mouse no cambie la selección
mientras el panel está abierto.

### `draw()` y `NO_HUD_STATES`

```js
if (G.state === GAME_STATES.CHOOSE) {
  drawCards(this)
  if (G.infoCard) drawCardInfo(this)       // encima de las cartas
}
```

`NO_HUD_STATES` suma `TUTORIAL_CLEAR` y `REMATCH_INTRO`: en la antesala los corazones todavía no se
repusieron y mostrarlos confunde.

`SCREEN_DRAWERS` suma las dos pantallas nuevas, importadas de `drawPhaseScreens.js`.

## 6 · Render

### Brillo guía (`drawCards.js`)

Solo cuando `PHASE_CONFIG[G.phase].guidedFirstProblem && G.round === 0`, y solo sobre la carta cuyo id es
`currentRound(G).ans`: marco dorado pulsante (`Math.sin(G.time * 4)` sobre el alpha) más un `▼` que rebota
encima. Se dibuja **antes** del marco de selección para que el cyan de selección quede visible arriba.
Cero assets nuevos, cero `shadowBlur`.

### Badge `?` (`drawCards.js`)

Círculo chico en la esquina superior derecha de cada carta, con geometría en `CARD_INFO.BADGE`. Exporta:

```js
export const cardInfoBadgeAt = (x, y) => { /* devuelve índice de carta, o -1 */ }
```

### Panel (`drawCardInfo.js`)

Velo `rgba(4,6,20,0.78)` sobre todo el canvas — la escena queda visible detrás, atenuada (requisito 2.7) —
y un recuadro centrado con: nombre en español (grande), `label` en inglés (chico, secundario), `what` con
`wrapText`, y `blocks` destacado en otro color con su etiqueta *"BLOQUEA:"*. Abajo, cómo se cierra.

Fallback obligatorio (requisito 8.6): si falta `what` o `blocks`, se dibuja solo lo que hay. Nunca
`undefined` en pantalla, nunca un throw.

### `TUTORIAL_CLEAR` y `REMATCH_INTRO` (`drawPhaseScreens.js`)

Reusan `drawDialogue` de `drawScreens.js` — hay que exportarla, ya lo está. `TUTORIAL_CLEAR`: el mentor
avisa que el jefe se está reiniciando. `REMATCH_INTRO`: cartel grande estilo MK con `drawTextOutlined`
(*"FASE 2 · SIN AYUDAS"*) y una línea que enumera qué cambia. Sin arte nuevo.

---

## Trampas — errores que NO dan mensaje de error

Estas son las siete formas conocidas de romper este feature en silencio. La 5 y la 6 se descubrieron
revisando las tareas 7 y 8 ya implementadas, no escribiendo el diseño: si aparecen más, van acá.

### 1 · `G.lastResult` se hereda entre rondas

`lastResult` se escribe en `timingPress` y **hoy nunca se limpia**. Con `needsExplain` leyéndolo, un `miss`
en la ronda 1 hace que la revancha frene en **todas** las rondas siguientes aunque el jugador las haga
perfectas. Se ve como *"las interrupciones no se fueron"* y no hay error en consola.
**`startRound` lo pone en `null`. No es opcional.**

### 2 · El panel queda abierto al cambiar de ronda

Si `G.infoCard` sobrevive a `startRound`, el panel aparece dibujado sobre `PROBLEM` de la ronda siguiente y
`handleKeyDown` se come todo el input: el juego parece congelado.
**`startRound` lo pone en `null`.**

### 3 · El badge `?` vive dentro del área clickeable de la carta

`cardIndexAt` (`drawCards.js:9`) toma un rectángulo con margen que **contiene** al badge. Si en
`handleMouseDown` chequeás `cardIndexAt` primero, hacer clic en `?` elige la carta en lugar de abrir la
info — y en el problema 1 del tutorial eso choca de frente con el gate, dejando al jugador sin forma de
avanzar con el mouse. **`cardInfoBadgeAt` se chequea SIEMPRE primero.**

### 4 · `G.order` indefinido revienta el render, no la lógica

`currentRound` la llaman `drawCards.js:29`, `drawProblemScreen` y `drawExplainScreen`. Si `order` no está en
`createInitialState()`, el primer frame de combate tira `Cannot read properties of undefined` desde una
función de dibujo, y el stack apunta al render, no al estado. **Inicializarlo como `[0,1,2,3]`.**

### 5 · `cardInfoBadgeAt` sin su tercer argumento

La firma es `cardInfoBadgeAt(x, y, selectedIndex)`. Las cartas se dibujan con un *lift* de 10px cuando están
seleccionadas (`SELECTED_LIFT` en `drawCards.js`), y el badge lo replica: por eso el hit-test necesita saber
cuál está seleccionada.

Si lo llamás `cardInfoBadgeAt(x, y)`, `selectedIndex` queda `undefined`, ninguna carta se trata como
seleccionada, y el badge de la carta apuntada se desplaza 10px de su área de clic. Como `handleMouseMove`
selecciona la carta bajo el cursor **antes** de que llegue el clic, la carta afectada es siempre la única que
el jugador iba a tocar: el `?` deja de responder. **No tira error, no loguea nada.** Se detectó en la
revisión de la tarea 7, y el arreglo fue precisamente pasar `G.sel`.

### 6 · El timeout deja el panel abierto en un estado que no lo dibuja

`updateChooseTimer` saca al jugador de `CHOOSE` con `setState(RESOLVE)` **sin cerrar el panel**. Si el
temporizador vence con el panel abierto, queda `G.infoCard` seteado en un estado donde `draw()` no lo dibuja
(solo se dibuja dentro de `CHOOSE`). El jugador no ve nada raro, pero el guard de `handleKeyDown` sigue
interceptando: su próximo `ESPACIO` cierra un panel invisible en lugar de avanzar. Se pierde un input.

Se recupera solo — un clic o `Escape` limpian `infoCard`, y `R` nunca se bloquea porque se chequea antes —
así que **no cuelga el juego**. Pero limpiar `infoCard` en `startRound` **no lo tapa**: el camino del timeout
no pasa por `startRound`.

**Y el input perdido es la parte menos grave.** El velo del panel (alpha 0.78) se dibuja *después* de
`drawCards`, así que **tapa el temporizador**: el arco, el número de segundos y el parpadeo rojo de aviso
quedan debajo. El jugador lee sin ver cuánto le queda. En la fase `REMATCH` el timer sigue corriendo a
propósito (requisito 5.9), así que ahí es directamente injusto: **`drawCardInfo` tiene que redibujar los
segundos restantes por encima del velo cuando la fase tiene límite de tiempo.** Va en la tarea 10.

Arreglarlo donde no pueda volver: **`setState()` cierra el panel.** El panel es un overlay exclusivo de
`CHOOSE`, así que cualquier transición de estado debe descartarlo. Una línea, un solo punto de paso, y vuelve
imposible toda esta clase de bug — incluidas las transiciones nuevas que agrega la tarea 13.

```js
setState(state) {
  this.G.infoCard = null    // el panel es exclusivo de CHOOSE: cualquier transición lo descarta
  this.G.state = state
  // ... el resto igual
}
```

### 7 · Bonus: el especial del tutorial ganaba el juego

Hoy `advance()` dispara `FINISH_LINE` con `G.special >= SPECIAL_MAX` (`battleLogic.js:163`). Cuatro bloqueos
perfectos dan 100 exactos: **un jugador bueno se saltea la revancha entera**. Lo resuelve
`specialTriggersFinisher: false` en el tutorial, y `beginRematch` poniendo `special` en 0.

---

## Cómo se verifica (sin tests automatizados)

`npm run dev` y jugar los cinco caminos:

| # | Camino | Qué tiene que pasar |
|---|---|---|
| 1 | Tutorial completo, todo bien | Problema 1 no confirma hasta abrir la info · problemas 2-4 sin brillo · sin timer · el mentor explica las 4 veces · **no gana el juego** aunque los 4 bloqueos sean perfect → `TUTORIAL_CLEAR` |
| 2 | Tutorial errando cartas | Cartas equivocadas se descartan y **los corazones siguen en 4/4** |
| 3 | Revancha limpia | Timer de 3s visible · `PROBLEM` no pide `ESPACIO` · rondas encadenadas **sin una sola pantalla de explicación** · orden distinto al del tutorial |
| 4 | Revancha errando | Erré carta o fallé bloqueo → aparece la explicación · corazón menos · 4 fallos → `DEFEAT` |
| 5 | `R` en cada pantalla | Antes del tutorial → vuelve al inicio · después → cae en `REMATCH_INTRO`, nunca al tutorial · el panel queda cerrado |

Y el clic: badge `?` abre info y **no** elige carta, en las dos fases.

## Riesgo, dicho claro

`battleLogic.js` es el archivo que sostiene el combate y este spec le toca **siete funciones**. Es el cambio
más invasivo del proyecto desde que existe el motor, y la entrega es el lunes 27.

El orden de `tasks.md` está pensado para que eso sea manejable: **las constantes y el panel de información
primero, la refactorización del ritmo al final.** Si el tiempo se termina, se corta después de la tarea 8 y
lo que quede entregado ya arregla el problema que reportaste — las cartas dicen qué hacen y el tutorial
guía. La revancha es la mitad que se puede sacrificar; el panel de información no.
