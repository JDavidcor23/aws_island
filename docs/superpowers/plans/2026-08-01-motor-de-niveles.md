# Motor de niveles — plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir el combate único de la Isla 0 en un motor que corre niveles cargados como dato, con progreso persistido y un mapa de isla para elegirlos.

**Architecture:** El contenido (rondas, cartas, patrones de parry) se muda de `src/constants/` a `src/content/levels/`. El motor deja de importar constantes de contenido y lee todo de `G.level`, que se le pasa al construirlo. El progreso vive en localStorage vía un service aislado. Una pantalla `ISLAND_MAP` en React elige el nivel antes de montar `BattlePage`.

**Tech Stack:** React 19, Zustand 5, Vite 6, Vitest 2.1.9, canvas 2D sin librerías.

## Global Constraints

- **Spec de referencia:** `docs/superpowers/specs/2026-08-01-motor-de-niveles-design.md`.
- **Criterio de aceptación global:** el nivel 1 se juega **exactamente igual que hoy**. Cualquier cambio de comportamiento observable en el combate es un bug, no una mejora.
- **No se crean tests nuevos.** Los tests existentes (`combo.test.js`, `COMBO.test.js`, `bossShout.test.js`) importan el contenido directo y van a romper: **actualizarlos es parte del trabajo**, y que vuelvan a pasar es la verificación. Si querés cobertura nueva, pedila aparte.
- **No correr `npm run build`.** La verificación es `npm test` y `npm run dev`.
- `src/constants/LAYOUT.js` **no se toca**: es archivo compartido y el arte de la arena está verificado contra sus coordenadas (`.kiro/specs/CONCEPTO_ISLA_0.md`).
- Comentarios en español, explicando el **por qué**, siguiendo el estilo del repo.
- Commits convencionales, sin atribución a IA.

---

### Task 1: El contenido del nivel 1, como dato

Copia el contenido vivo a `src/content/` sin tocar el motor. Al terminar esta tarea el juego corre igual que antes: nadie consume los archivos nuevos todavía.

**Files:**
- Create: `src/content/levels/isla0-n1.js`
- Create: `src/content/levels/index.js`
- Create: `src/content/islands/island0.js`
- Read (para copiar, no modificar): `src/constants/ROUNDS.js`, `src/constants/CARDS.js`, `src/constants/COMBO.js:174-220`

**Interfaces:**
- Consumes: nada.
- Produces:
  - `LEVELS: Record<string, Level>` y `getLevel(id: string): Level` desde `src/content/levels/index.js`
  - `ISLAND0: Island` desde `src/content/islands/island0.js`
  - Forma de `Level`: `{ id, mechanic, concept, rounds, cards, combos }`
    - `rounds: Array<{ prob: string, ans: string, expl: string }>`
    - `cards: Record<string, { label, es, what, why, blocks }>`
    - `combos: Record<string, { icon: string, accent: string, hits: Array<{origin, gap, speed, radius, offset?}> }>`
  - Forma de `Island`: `{ id, name, levels: string[] }`

- [ ] **Step 1: Crear el nivel 1**

Copiar el contenido **textualmente**. No reescribir ni "mejorar" los textos: cualquier cambio rompe el criterio de aceptación.

```js
// src/content/levels/isla0-n1.js
import { COMBO_ORIGINS } from '../../constants/COMBO'

// Nivel 1 de la Isla 0: las 5 características esenciales del cloud (NIST), de las que
// jugamos 4. Es el contenido que antes vivía en constants/ROUNDS.js, constants/CARDS.js y
// COMBO.PATTERNS — mismo texto, misma clave, mismo patrón de parry.
//
// La clave de `cards` es la que usan `rounds[].ans` y `combos`: los tres índices tienen que
// coincidir o el nivel es incoherente. Eso lo verifica levels/index.js al cargar.
export const isla0n1 = {
  id: 'isla0-n1',
  mechanic: 'cards',
  concept: '5 características del cloud computing',

  rounds: [
    { prob: '¡Llegaron 100.000 usuarios DE GOLPE!', ans: 'ela', expl: 'La nube crece y se achica sola según la demanda.' },
    { prob: '¡Necesitás otro servidor... YA!', ans: 'self', expl: 'Aprovisionás recursos vos mismo, sin esperar a nadie.' },
    { prob: '¡Ahora te entran usuarios de TODO EL MUNDO!', ans: 'net', expl: 'Se accede desde cualquier lado a través de la red.' },
    { prob: '¡MIL clientes quieren usar la misma máquina!', ans: 'pool', expl: 'Muchos clientes comparten la misma infraestructura, seguros y aislados.' },
  ],

  // ⚠️ Límite de largo: el panel entra 4 renglones de `what`, 3 de `why` y 2 de `blocks` a
  // 44 caracteres (CARD_INFO.WRAP_CHARS). Si alargás un texto, mirá el panel corriendo.
  cards: {
    ela: {
      label: 'Rapid Elasticity',
      es: 'Elasticidad Rápida',
      what: 'La capacidad crece y se achica sola, en minutos, siguiendo la demanda real. Nadie compra hardware por adelantado ni paga por lo que no usa.',
      why: 'Entran 100.000 usuarios de golpe y se suman servidores solos; cuando se van, se apagan. Pagás el pico mientras dura, no todo el año.',
      blocks: 'PICOS DE CARGA — avalanchas de usuarios, tráfico repentino, Black Friday.',
    },
    self: {
      label: 'Self-Service',
      es: 'Autoservicio bajo demanda',
      what: 'Pedís y activás los recursos vos mismo, desde un panel o una API, en el momento que los necesitás.',
      why: 'Necesitás otro servidor: lo levantás en minutos y seguís. Sin ticket, sin orden de compra, sin esperar a nadie.',
      blocks: 'ESPERAS Y TRÁMITES — pedidos que tardan días, aprobaciones y colas.',
    },
    net: {
      label: 'Network Access',
      es: 'Acceso amplio por red',
      what: 'Al servicio se llega por la red de siempre, desde cualquier lugar y con cualquier dispositivo: notebook, celular o tablet.',
      why: 'Te entran usuarios de todo el mundo y no hace falta una máquina en cada país: el mismo servicio se sirve por la red.',
      blocks: 'BARRERAS DE DISTANCIA — usuarios lejanos, acceso desde otro país o del celular.',
    },
    pool: {
      label: 'Resource Pooling',
      es: 'Recursos Compartidos',
      what: 'Una misma infraestructura física se reparte entre muchos clientes: cada uno recibe la porción que pide y queda aislado del resto.',
      why: 'Mil clientes en la misma máquina no se estorban: cada uno corre en su porción, y lo que uno libera lo usa otro.',
      blocks: 'SATURACIÓN POR MULTITUD — miles de clientes sobre la misma máquina.',
    },
  },

  // Un patrón de parry por carta. Campos de cada golpe:
  //   origin  clave de COMBO_ORIGINS
  //   gap     pausa ANTES de este golpe, en segundos (0 en el primero)
  //   speed   multiplicador de velocidad del orbe, sobre attackSpeed()
  //   radius  tamaño del orbe — es la "forma" que diferencia al problema
  //   offset  corrimiento del punto de salida, para que un enjambre no salga del mismo píxel
  combos: {
    // Elasticidad: oleadas que se ACELERAN, y un tercer golpe que se hace esperar y llega
    // más rápido que los dos anteriores. Es el pico de carga: creciente y traicionero.
    ela: {
      icon: 'iconEla',
      accent: '#ffd94a',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 0.95, radius: 10 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.3, speed: 1.2, radius: 11 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.85, speed: 1.55, radius: 12 },
      ],
    },
    // Autoservicio: tres golpes mecánicos, ritmo constante, como un trámite que no se apura.
    // Es el patrón de referencia contra el que se sienten los otros tres.
    self: {
      icon: 'iconSelf',
      accent: '#7de0ff',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 1.05, radius: 10 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.45, speed: 1.05, radius: 10 },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.45, speed: 1.05, radius: 10 },
      ],
    },
    // Acceso por red: tres orígenes distintos. El golpe puede venir de cualquier lado,
    // igual que los usuarios.
    net: {
      icon: 'iconNet',
      accent: '#9fb6d8',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 1, radius: 10 },
        { origin: COMBO_ORIGINS.HIGH, gap: 0.5, speed: 1.1, radius: 10 },
        { origin: COMBO_ORIGINS.LOW, gap: 0.5, speed: 1.1, radius: 10 },
      ],
    },
    // Recursos compartidos: tres orbes CHICOS que salen de puntos distintos del jefe y
    // convergen en el mismo punto de bloqueo. La multitud sobre una sola máquina.
    pool: {
      icon: 'iconPool',
      accent: '#ff9d7a',
      hits: [
        { origin: COMBO_ORIGINS.BOSS, gap: 0, speed: 1.15, radius: 7, offset: { x: -46, y: -28 } },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.24, speed: 1.15, radius: 7, offset: { x: 46, y: -14 } },
        { origin: COMBO_ORIGINS.BOSS, gap: 0.24, speed: 1.15, radius: 7, offset: { x: 0, y: 26 } },
      ],
    },
  },
}
```

⚠️ **Verificá antes de escribir**: `COMBO_ORIGINS` tiene que estar exportado desde `src/constants/COMBO.js`. Si es una constante local del módulo, agregale `export`. No la muevas de archivo: es geometría del motor, no contenido.

- [ ] **Step 2: Crear el registro de niveles con validación de coherencia**

```js
// src/content/levels/index.js
import { isla0n1 } from './isla0-n1'

export const LEVELS = {
  [isla0n1.id]: isla0n1,
}

// Un nivel incoherente no falla en la carga: falla a mitad de una ronda, con un
// `currentRound(G).ans` que no existe en el mazo y un combo que devuelve undefined. Eso se
// ve como un juego colgado, no como un error de datos. Esta verificación lo convierte en un
// throw al arrancar, que es donde se puede leer.
//
// Reemplaza lo que hoy verifica COMBO.test.js sobre las constantes globales.
const assertCoherent = (level) => {
  const cardIds = Object.keys(level.cards)
  for (const round of level.rounds) {
    if (!cardIds.includes(round.ans)) {
      throw new Error(`[${level.id}] la ronda "${round.prob}" responde "${round.ans}", que no está en cards`)
    }
  }
  for (const id of cardIds) {
    if (!level.combos[id]) throw new Error(`[${level.id}] la carta "${id}" no tiene patrón de combo`)
  }
}

Object.values(LEVELS).forEach(assertCoherent)

export const getLevel = (id) => {
  const level = LEVELS[id]
  if (!level) throw new Error(`nivel desconocido: ${id}`)
  return level
}
```

- [ ] **Step 3: Crear la isla 0**

```js
// src/content/islands/island0.js
// La isla agrupa niveles y es dueña de su intro: la llegada en barco, el mentor y el
// briefing son de la ISLA y corren UNA sola vez. Colgadas del nivel, el jugador se comería
// la llegada en barco una vez por nivel.
export const ISLAND0 = {
  id: 'island0',
  name: 'Isla 0 — El Pueblo del Servidor',
  levels: ['isla0-n1'],
}
```

- [ ] **Step 4: Verificar que nada se rompió**

Run: `npm test`
Expected: PASS — los mismos tests que pasaban antes. Ningún archivo nuevo está importado todavía por el motor.

- [ ] **Step 5: Verificar que el registro carga sin tirar**

Run: `npx vitest run --reporter=verbose` y confirmá que no aparece ningún `Error: [isla0-n1]`.
Si `assertCoherent` tira, hay una diferencia entre lo que copiaste y el contenido original. Compará contra `src/constants/ROUNDS.js` y `src/constants/CARDS.js`.

- [ ] **Step 6: Commit**

```bash
git add src/content
git commit -m "feat(content): el nivel 1 de la isla 0 como dato"
```

---

### Task 2: El motor consume `G.level`

El paso grande. El motor deja de importar contenido y lo recibe. Al terminar, `ROUNDS.js` y `CARDS.js` ya no existen.

**Files:**
- Modify: `src/game/GameEngine.js:65-99` (estado inicial), `:223`, `:240` (rango de teclas)
- Modify: `src/game/battle/battleLogic.js:2-3`, `:18`, `:66`, `:268`, `:301`, `:308`, `:326`
- Modify: `src/game/battle/combo.js:77`
- Modify: `src/game/render/drawCards.js:2`, `:131`
- Modify: `src/game/render/drawCardInfo.js:2`, `:83`
- Modify: `src/constants/COMBO.js` (quitar `PATTERNS`, dejar el resto)
- Modify: `src/pages/BattlePage/BattlePage.jsx`, `src/components/GameCanvas/GameCanvas.jsx`, `src/components/GameCanvas/useGameCanvas.hook.js` (pasar `level` hasta el motor)
- Modify: `src/game/battle/combo.test.js:6`, `:18`, `:28`; `src/game/scenes/bossShout.test.js:5`, `:19`, `:34`, `:43`
- Delete: `src/constants/ROUNDS.js`, `src/constants/CARDS.js`, `src/constants/COMBO.test.js`

**Interfaces:**
- Consumes: `getLevel(id)` de Task 1.
- Produces:
  - `new GameEngine(canvas, { onScreenChange, onPauseRequest, initialState, level })` — `level` es obligatorio
  - `engine.G.level: Level` — disponible desde el primer frame
  - `currentRound(G): Round` — sin cambio de firma, ahora indexa `G.level.rounds`

- [ ] **Step 1: El motor recibe el nivel**

En `GameEngine.js`, `createInitialState` pasa a recibirlo, y `order` deja de ser fijo:

```js
const createInitialState = (level) => ({
  state: GAME_STATES.LOAD,
  phase: PHASES.TUTORIAL,
  tutorialDone: false,
  // El nivel es dato de sólo lectura y vive en G porque TODO el motor lo necesita:
  // battleLogic, combo y los dos drawers de carta. Pasarlo por parámetro a cada función
  // habría tocado veinte firmas para el mismo efecto.
  level,
  // La cantidad de rondas la decide el nivel. Antes era [0,1,2,3] literal, que es la razón
  // por la que un nivel de 6 problemas habría jugado sólo los primeros 4.
  order: [...Array(level.rounds.length).keys()],
  infoCard: null,
  infoSeen: new Set(),
  t: 0,
  time: 0,
  round: 0,
  extraRound: false,
  hearts: TIMING.MAX_HEARTS,
  special: 0,
  perfects: 0,
  cards: [],
  wrong: new Set(),
  sel: 0,
  chosen: null,
  atk: null,
  lastResult: null,
  shake: 0,
  flashColor: null,
  flashAlpha: 0,
  bossHit: 0,
  bossGone: 0,
  intro: null,
  briefing: null,
  finisher: null,
  combo: null,
  shout: null,
})
```

En el constructor y en `reset()`:

```js
// constructor
constructor(canvas, { onScreenChange, onPauseRequest, initialState, level } = {}) {
  if (!level) throw new Error('GameEngine necesita un level')
  this.level = level
  // ... resto igual ...
  this.G = createInitialState(level)
}

// reset(): el nivel sobrevive al reset igual que tutorialDone — reiniciar la partida no
// cambia de nivel.
reset() {
  const tutorialDone = this.G.tutorialDone
  this.G = createInitialState(this.level)
  // ... resto igual ...
}
```

- [ ] **Step 2: El rango de teclas sale del mazo**

En `GameEngine.js`, las dos apariciones de `key >= '1' && key <= '4'` (líneas 223 y 240). Agregá el helper arriba de la clase:

```js
// El '4' estaba escrito literal en las dos ramas del teclado. Con niveles de otro tamaño
// eso deja cartas inalcanzables por teclado — sin error, sin nada: la tecla simplemente no
// hace nada. Se acota a 9 porque no hay tecla '10'.
const numberKeyIndex = (key, cardCount) => {
  if (key < '1' || key > '9') return -1
  const index = Number(key) - 1
  return index < cardCount ? index : -1
}
```

Y en los dos usos:

```js
// línea ~223, dentro del bloque de G.infoCard
const infoIndex = numberKeyIndex(key, G.cards.length)
if (infoIndex >= 0 && PHASE_CONFIG[G.phase].openInfoOnPick) {
  if (G.cards[infoIndex] === G.infoCard) confirmCardInfo(this)
  else openCardInfo(this, infoIndex)
}
return

// línea ~240, dentro de GAME_STATES.CHOOSE
const pickIndex = numberKeyIndex(key, G.cards.length)
if (pickIndex >= 0) {
  G.sel = pickIndex
  pickCard(this, G.sel)
} else if (key === 'ArrowLeft') {
  // ... sin cambios ...
```

- [ ] **Step 3: `battleLogic.js` lee del nivel**

Borrar los imports de las líneas 2-3 (`ROUNDS`, `CARDS`, `CARD_IDS`) y cambiar los cinco usos:

```js
// línea 18
export const currentRound = (G) => G.level.rounds[G.order[G.round % G.level.rounds.length]]

// línea 66, dentro de startRound
G.cards = shuffle(Object.keys(G.level.cards))

// línea 268, dentro de mistakeHint
const answer = G.level.cards[currentRound(G).ans]

// línea 301, dentro de endRound
if (G.phase === PHASES.TUTORIAL && G.round >= G.level.rounds.length) {

// línea 308, dentro de endRound
if (G.round >= G.level.rounds.length) G.extraRound = true

// línea 326, dentro de beginRematch
G.order = shuffle([...Array(G.level.rounds.length).keys()])
```

- [ ] **Step 4: `combo.js` lee del nivel**

Línea 77:

```js
const pattern = G.level.combos[currentRound(G).ans]
```

`COMBO` sigue importado: el módulo usa sus constantes de timing y sus `TEXTS`. Sólo `PATTERNS` se fue.

- [ ] **Step 5: Los dos drawers leen del nivel**

`drawCards.js` — borrar el import de `CARDS` (línea 2) y cambiar la 131:

```js
drawTextOutlined(ctx, G.level.cards[id].label, cx + w / 2, labelY, 8, labelColor)
```

⚠️ Confirmá que `G` está en scope en esa función. Si el drawer recibe `engine`, es `engine.G.level.cards[id]`.

`drawCardInfo.js` — borrar el import de `CARDS` (línea 2) y cambiar la 83:

```js
const card = G.level.cards[G.infoCard]
```

- [ ] **Step 6: Sacar `PATTERNS` de `COMBO.js`**

Borrar el bloque `PATTERNS: { ... }` completo (líneas 174-220). **No tocar** `COMBO_ORIGINS`, `LENGTH`, `RESULTS` ni `TEXTS`: eso es motor, no contenido. Asegurate de que `COMBO_ORIGINS` quede exportado (lo necesita `isla0-n1.js`).

- [ ] **Step 7: Pasar el nivel desde React hasta el motor**

`App.jsx` elige el nivel y lo baja por props. Por ahora fijo — el mapa llega en Task 4:

```js
// App.jsx
import { getLevel } from './content/levels'

// ... dentro del render de PLAYING:
<BattlePage
  initialState={GAME_STATES.INTRO}
  level={getLevel('isla0-n1')}
  onExitToMenu={exitToMenu}
/>
```

`BattlePage.jsx` lo reenvía a `GameCanvas`, `GameCanvas.jsx` a `useGameCanvas`, y el hook se lo pasa al `new GameEngine(...)`. Es plumbing: agregá el prop en cada capa, no cambies nada más.

⚠️ En `useGameCanvas.hook.js`, `level` tiene que entrar en el array de dependencias del `useEffect` que crea el motor. Sin eso, cambiar de nivel no reconstruye el motor y el jugador juega el nivel anterior con el título del nuevo.

- [ ] **Step 8: Actualizar los tests existentes**

`combo.test.js` (líneas 6, 18, 28) y `bossShout.test.js` (líneas 5, 19, 34, 43) importan `ROUNDS`. Cambiar el import por el nivel:

```js
import { isla0n1 } from '../../content/levels/isla0-n1'

const ROUNDS = isla0n1.rounds
```

Ese alias local deja el resto del test intacto — es la forma más chica de migrarlos y no hay razón para reescribirlos.

En los tests que construyen un engine a mano, hay que pasarle el nivel. En `bossShout.test.js:19`, donde hoy hay `order: [0, 1, 2, 3]`, agregar también `level: isla0n1`.

`COMBO.test.js` se **borra**: verificaba la coherencia entre `COMBO.PATTERNS`, `CARD_IDS` y `ROUNDS`, y eso ahora lo hace `assertCoherent` en `content/levels/index.js` para todos los niveles, no solo para el primero.

- [ ] **Step 9: Borrar los constants de contenido**

```bash
git rm src/constants/ROUNDS.js src/constants/CARDS.js src/constants/COMBO.test.js
```

- [ ] **Step 10: Verificar que no quedó ninguna referencia**

Run: `rg "constants/(ROUNDS|CARDS)|CARD_IDS|COMBO\.PATTERNS" src`
Expected: cero resultados. Cualquier hit es un import huérfano que revienta en runtime.

- [ ] **Step 11: Correr los tests**

Run: `npm test`
Expected: PASS. Si `combo.test.js` falla con `Cannot read properties of undefined (reading 'rounds')`, a algún engine de test le falta el `level`.

- [ ] **Step 12: Jugar el nivel entero**

Run: `npm run dev`

Verificar a mano, porque los tests no cubren esto:
1. Menú → JUGAR → placa de isla → intro del barco → mentor → briefing.
2. Las 4 rondas del tutorial: la carta correcta brilla, las otras están bloqueadas, el panel se abre al elegir.
3. Elegir carta con **teclado** (`1`–`4`) y con **mouse**.
4. Los tres parries por problema, y que el patrón del orbe cambie entre problemas (elasticidad acelera, autoservicio es constante, red viene de tres lados, pooling son tres orbes chicos).
5. `TUTORIAL_CLEAR` → revancha → el timer de elección aparece → remate del jefe → victoria.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "refactor(motor): el combate lee el contenido de G.level"
```

---

### Task 3: Progreso en localStorage

**Files:**
- Create: `src/services/progress.service.js`
- Create: `src/constants/PROGRESS.js`

**Interfaces:**
- Consumes: nada.
- Produces: `progressService` con `load(): {completed: string[], unlocked: string[]}`, `isCompleted(id): boolean`, `isUnlocked(id): boolean`, `complete(id, nextId): void`, `reset(): void`

- [ ] **Step 1: Constantes**

```js
// src/constants/PROGRESS.js
export const PROGRESS = {
  STORAGE_KEY: 'cq.progress.v1',
  // El primer nivel arranca desbloqueado siempre: sin esto, un localStorage vacío deja al
  // jugador sin nada que jugar.
  FIRST_LEVEL: 'isla0-n1',
}
```

- [ ] **Step 2: El service**

Mismo patrón que `audioSettings.service.js`: I/O aislado, `try/catch` en las dos puntas, fallback en memoria.

```js
// src/services/progress.service.js
import { PROGRESS } from '../constants/PROGRESS'

// Progreso del jugador: qué niveles completó y cuáles tiene desbloqueados.
//
// Por qué es un service y no estado de Zustand: esto sobrevive a la sesión, y el store se
// reconstruye en cada carga. El store puede LEER de acá, pero el dueño del dato es el
// localStorage.
//
// localStorage puede tirar excepción: modo privado de Safari, cookies bloqueadas, cuota
// llena. Un juego no se cae porque no pudo guardar el progreso — se sigue jugando con el
// valor en memoria y listo. Misma decisión que audioSettings.service.
const EMPTY = { completed: [], unlocked: [PROGRESS.FIRST_LEVEL] }

// Cache en memoria: es el fallback cuando localStorage no está, y evita parsear JSON en
// cada consulta del mapa de isla.
let cache = null

const read = () => {
  if (cache) return cache
  try {
    const raw = window.localStorage.getItem(PROGRESS.STORAGE_KEY)
    if (!raw) {
      cache = { ...EMPTY }
      return cache
    }
    const parsed = JSON.parse(raw)
    // Un localStorage corrupto o de una versión vieja no puede dejar el juego sin niveles
    // desbloqueados: si los campos no son arrays, se descarta todo y se arranca de cero.
    if (!Array.isArray(parsed.completed) || !Array.isArray(parsed.unlocked)) {
      cache = { ...EMPTY }
      return cache
    }
    // El primer nivel se fuerza siempre: un guardado sin él dejaría el mapa entero cerrado.
    const unlocked = parsed.unlocked.includes(PROGRESS.FIRST_LEVEL)
      ? parsed.unlocked
      : [...parsed.unlocked, PROGRESS.FIRST_LEVEL]
    cache = { completed: parsed.completed, unlocked }
    return cache
  } catch {
    cache = { ...EMPTY }
    return cache
  }
}

const write = (value) => {
  cache = value
  try {
    window.localStorage.setItem(PROGRESS.STORAGE_KEY, JSON.stringify(value))
  } catch {
    // sin persistencia el progreso igual vale para esta sesión
  }
}

export const progressService = {
  load: () => read(),
  isCompleted: (id) => read().completed.includes(id),
  isUnlocked: (id) => read().unlocked.includes(id),

  // Marca un nivel como completado y desbloquea el siguiente. `nextId` puede ser undefined
  // (último nivel de la isla) y entonces sólo marca el completado.
  complete: (id, nextId) => {
    const current = read()
    const completed = current.completed.includes(id) ? current.completed : [...current.completed, id]
    const unlocked = nextId && !current.unlocked.includes(nextId)
      ? [...current.unlocked, nextId]
      : current.unlocked
    write({ completed, unlocked })
  },

  reset: () => write({ ...EMPTY }),
}
```

- [ ] **Step 3: Verificar a mano en el navegador**

Run: `npm run dev`, abrir la consola del navegador:

```js
// no hay tests para esto por decisión del plan: se verifica corriendo
localStorage.removeItem('cq.progress.v1')
// recargar, y en la consola:
// (importar no se puede desde consola — verificalo en Task 4, cuando el mapa lo consuma)
```

La verificación real de este service es la Task 4: el mapa muestra el estado que este service reporta. Si el nodo 1 aparece disponible y no bloqueado, el service anda.

- [ ] **Step 4: Commit**

```bash
git add src/services/progress.service.js src/constants/PROGRESS.js
git commit -m "feat(progreso): persistencia de niveles completados y desbloqueados"
```

---

### Task 4: Pantalla `ISLAND_MAP`

**Files:**
- Create: `src/components/IslandMap/IslandMap.jsx`
- Create: `src/components/IslandMap/IslandMap.css`
- Create: `src/components/IslandMap/useIslandMap.hook.js`
- Create: `src/constants/ISLAND_MAP.js`
- Modify: `src/App.jsx:11-15` (agregar screen), `:22-43` (flujo)

**Interfaces:**
- Consumes: `progressService` (Task 3), `ISLAND0` y `getLevel` (Task 1)
- Produces: `<IslandMap island={Island} onPickLevel={(levelId: string) => void} onBack={() => void} />`

- [ ] **Step 1: Constantes de posición de nodos**

```js
// src/constants/ISLAND_MAP.js
// Posición de cada nodo sobre la panorámica de la isla, en PORCENTAJE del contenedor.
// Porcentaje y no píxeles porque el fondo escala con la ventana: con píxeles fijos, los
// nodos se despegan del lugar del dibujo al que apuntan.
//
// La clave es el id del nivel. Un nivel sin entrada acá no se dibuja — es intencional:
// agregar contenido sin decidir dónde va en el mapa es un olvido, no un default.
export const ISLAND_MAP = {
  BACKGROUND: '/assets/art/_gameready/island0_before.png',
  NODES: {
    'isla0-n1': { x: 28, y: 62, label: '1' },
  },
}
```

- [ ] **Step 2: El hook**

```js
// src/components/IslandMap/useIslandMap.hook.js
import { useMemo } from 'react'

import { ISLAND_MAP } from '../../constants/ISLAND_MAP'
import { getLevel } from '../../content/levels'
import { progressService } from '../../services/progress.service'

// Arma la lista de nodos a dibujar. Se calcula una vez por montaje y no por render:
// el progreso no cambia mientras el mapa está en pantalla — cambia cuando volvés de jugar,
// y para entonces el componente se remontó.
export const useIslandMap = (island) => {
  return useMemo(
    () =>
      island.levels
        .filter((id) => ISLAND_MAP.NODES[id])
        .map((id) => ({
          id,
          concept: getLevel(id).concept,
          ...ISLAND_MAP.NODES[id],
          completed: progressService.isCompleted(id),
          unlocked: progressService.isUnlocked(id),
        })),
    [island],
  )
}
```

- [ ] **Step 3: El componente**

```jsx
// src/components/IslandMap/IslandMap.jsx
import { ISLAND_MAP } from '../../constants/ISLAND_MAP'
import { useIslandMap } from './useIslandMap.hook'
import './IslandMap.css'

// Selección de nivel dentro de una isla. Container-presentational: el hook decide QUÉ
// nodos hay y en qué estado, esto sólo los pinta.
export const IslandMap = ({ island, onPickLevel, onBack }) => {
  const nodes = useIslandMap(island)

  return (
    <div className="island-map" style={{ backgroundImage: `url(${ISLAND_MAP.BACKGROUND})` }}>
      <h1 className="island-map__title">{island.name}</h1>

      {nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          className={`island-map__node island-map__node--${node.completed ? 'done' : node.unlocked ? 'open' : 'locked'}`}
          style={{ left: `${node.x}%`, top: `${node.y}%` }}
          disabled={!node.unlocked}
          // El concepto va en el title y no en el nodo: el nodo tiene que leerse de un
          // vistazo como un punto del mapa, no como una tarjeta de texto.
          title={node.concept}
          onClick={() => onPickLevel(node.id)}
        >
          {node.completed ? '✓' : node.label}
        </button>
      ))}

      <button type="button" className="island-map__back" onClick={onBack}>
        ← Menú
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Los estilos**

Seguí el estilo pixel-art del repo: mirá `src/components/MainMenu/MainMenu.css` y `LevelCard.css` antes de escribir, y reusá sus variables y su tipografía. Requisitos duros:

- `.island-map` — `background-size: cover`, `image-rendering: pixelated`, ocupa la ventana.
- `.island-map__node` — círculo, `transform: translate(-50%, -50%)` para que `left/top` sean el centro del nodo y no su esquina.
- `--done` verde `#63c74d`, `--open` cyan `#7de0ff` con pulso, `--locked` gris `#5c6272` y `cursor: not-allowed`.
- El nodo bloqueado tiene que leerse como bloqueado **sin** depender del color: agregale un candado o bajale la opacidad. Un jugador daltónico no distingue gris de verde apagado.

- [ ] **Step 5: Enganchar en `App.jsx`**

```jsx
import { useCallback, useState } from 'react'

import { IslandMap } from './components/IslandMap/IslandMap'
import { LevelCard } from './components/LevelCard/LevelCard'
import { MainMenu } from './components/MainMenu/MainMenu'
import { BattlePage } from './pages/BattlePage/BattlePage'

import { GAME_STATES } from './constants/GAME_STATES'
import { ISLAND0 } from './content/islands/island0'
import { getLevel } from './content/levels'
import { progressService } from './services/progress.service'

const APP_SCREENS = {
  MENU: 'MENU',
  LEVEL_CARD: 'LEVEL_CARD',
  ISLAND_MAP: 'ISLAND_MAP',
  PLAYING: 'PLAYING',
}

export const App = () => {
  const [screen, setScreen] = useState(APP_SCREENS.MENU)
  // Qué nivel se está jugando. Vive acá y no en el store por la misma razón que `screen`:
  // el motor lo recibe por props, no lo consulta.
  const [levelId, setLevelId] = useState(null)

  const start = useCallback(() => setScreen(APP_SCREENS.LEVEL_CARD), [])
  const toMap = useCallback(() => setScreen(APP_SCREENS.ISLAND_MAP), [])
  const exitToMenu = useCallback(() => setScreen(APP_SCREENS.MENU), [])

  const play = useCallback((id) => {
    setLevelId(id)
    setScreen(APP_SCREENS.PLAYING)
  }, [])

  // Al terminar un nivel se marca el progreso y se vuelve AL MAPA, no al menú: el mapa es
  // donde se ve lo que acabás de desbloquear.
  const finishLevel = useCallback((id) => {
    const index = ISLAND0.levels.indexOf(id)
    progressService.complete(id, ISLAND0.levels[index + 1])
    setScreen(APP_SCREENS.ISLAND_MAP)
  }, [])

  if (screen === APP_SCREENS.MENU) return <MainMenu onStart={start} />

  // JUGAR no entra directo al juego: pasa por la placa con el nombre de la isla.
  if (screen === APP_SCREENS.LEVEL_CARD) return <LevelCard onDone={toMap} />

  if (screen === APP_SCREENS.ISLAND_MAP) {
    return <IslandMap island={ISLAND0} onPickLevel={play} onBack={exitToMenu} />
  }

  return (
    <BattlePage
      initialState={GAME_STATES.INTRO}
      level={getLevel(levelId)}
      onExitToMenu={exitToMenu}
      onLevelComplete={() => finishLevel(levelId)}
    />
  )
}
```

- [ ] **Step 6: Disparar `onLevelComplete` al ganar**

`BattlePage` ya recibe el cambio de pantalla del motor por `onScreenChange`. Cuando la pantalla pasa a `VICTORY`, llamar a `onLevelComplete()`.

⚠️ **Trampa**: el motor puede notificar `VICTORY` más de una vez si el jugador reinicia con `R` después de ganar. `progressService.complete` es idempotente (chequea `includes` antes de agregar), así que llamarlo de más no rompe el dato — pero **sí** devolvería al jugador al mapa a mitad de algo. Guardá un flag local en `BattlePage` para llamarlo una sola vez por montaje.

- [ ] **Step 7: Verificar a mano**

Run: `npm run dev`

1. Menú → JUGAR → placa → **mapa de isla**. El nodo 1 aparece **disponible** (cyan).
2. Clic en el nodo 1 → arranca el nivel, igual que antes.
3. Ganar el nivel → vuelve al mapa → el nodo 1 aparece **completado** (✓ verde).
4. Recargar la página (F5) → JUGAR → el nodo 1 **sigue** completado. Si no, el service no está guardando.
5. En consola: `localStorage.removeItem('cq.progress.v1')` y recargar → el nodo 1 vuelve a estar disponible sin ✓.

- [ ] **Step 8: Commit**

```bash
git add src/components/IslandMap src/constants/ISLAND_MAP.js src/App.jsx src/pages/BattlePage
git commit -m "feat(mapa): selección de nivel dentro de la isla con progreso persistido"
```

---

### Task 5: La intro es de la isla, no del nivel

Hoy `App.jsx` arranca el motor en `GAME_STATES.INTRO` siempre. Con niveles, eso significa ver la llegada en barco una vez por nivel.

**Files:**
- Modify: `src/content/islands/island0.js` (agregar `introSeenKey`)
- Modify: `src/services/progress.service.js` (agregar `hasSeenIntro` / `markIntroSeen`)
- Modify: `src/App.jsx` (elegir `initialState` según si la intro ya corrió)

**Interfaces:**
- Consumes: `progressService` (Task 3)
- Produces: `progressService.hasSeenIntro(islandId): boolean`, `progressService.markIntroSeen(islandId): void`

- [ ] **Step 1: Guardar las intros vistas**

En `progress.service.js`, agregar `seenIntros` al shape. `EMPTY` pasa a ser:

```js
const EMPTY = { completed: [], unlocked: [PROGRESS.FIRST_LEVEL], seenIntros: [] }
```

⚠️ En `read()`, un guardado de la Task 3 **no tiene** `seenIntros`. No descartes el progreso por eso — normalizá:

```js
// Migración silenciosa: los guardados de la versión anterior no tienen seenIntros. Tratar
// eso como "corrupto" le borraría el progreso a quien ya jugó.
const seenIntros = Array.isArray(parsed.seenIntros) ? parsed.seenIntros : []
cache = { completed: parsed.completed, unlocked, seenIntros }
```

Y los dos métodos nuevos:

```js
hasSeenIntro: (islandId) => read().seenIntros.includes(islandId),

markIntroSeen: (islandId) => {
  const current = read()
  if (current.seenIntros.includes(islandId)) return
  write({ ...current, seenIntros: [...current.seenIntros, islandId] })
},
```

- [ ] **Step 2: `App.jsx` decide el estado inicial**

```jsx
const play = useCallback((id) => {
  setLevelId(id)
  setScreen(APP_SCREENS.PLAYING)
}, [])

// La intro (barco + mentor + briefing) es de la ISLA y corre UNA vez. El resto de los
// niveles entra directo al briefing: el jugador ya sabe dónde está y quién es el pingüino.
const firstVisit = !progressService.hasSeenIntro(ISLAND0.id)

// ... en el render de PLAYING:
<BattlePage
  initialState={firstVisit ? GAME_STATES.INTRO : GAME_STATES.BRIEFING}
  level={getLevel(levelId)}
  onExitToMenu={exitToMenu}
  onLevelComplete={() => {
    progressService.markIntroSeen(ISLAND0.id)
    finishLevel(levelId)
  }}
/>
```

⚠️ `markIntroSeen` se llama al **completar**, no al arrancar. Si se marcara al arrancar, un jugador que abandona el nivel a mitad de la intro perdería la presentación de la isla para siempre.

- [ ] **Step 3: Verificar a mano**

Run: `npm run dev`

1. `localStorage.removeItem('cq.progress.v1')`, recargar.
2. JUGAR → mapa → nivel 1 → **se ve la intro del barco**.
3. Ganar → volver al mapa → entrar de nuevo al nivel 1 → **NO se ve la intro**, arranca en el briefing con el jefe en pantalla.
4. Confirmar que el briefing se ve completo y el combate arranca bien sin haber pasado por INTRO. Si la arena aparece vacía o el jefe no está, `BRIEFING` depende de algo que inicializaba `INTRO` — buscalo en `introScene.js` y movelo.

- [ ] **Step 4: Commit**

```bash
git add src/services/progress.service.js src/App.jsx src/content/islands/island0.js
git commit -m "feat(isla): la intro corre una sola vez por isla"
```

---

### Task 6: Registro de mecánicas

El último paso, y el más chico. Deja la puerta abierta para la segunda mecánica sin construirla.

**Files:**
- Create: `src/game/mechanics/index.js`
- Create: `src/game/mechanics/cards.mechanic.js`
- Modify: `src/game/GameEngine.js` (resolver la mecánica en el constructor)

**Interfaces:**
- Consumes: `level.mechanic` (Task 1)
- Produces: `MECHANICS: Record<string, Mechanic>`; `Mechanic = { id: string, states: string[] }`

- [ ] **Step 1: Declarar la mecánica de cartas**

```js
// src/game/mechanics/cards.mechanic.js
import { GAME_STATES } from '../../constants/GAME_STATES'

// La mecánica de cartas: elegir la carta que responde al problema y parrear el combo.
// Es la única implementada. Su valor hoy no es el comportamiento —eso sigue viviendo en
// battleLogic y combo— sino DECLARAR qué estados le pertenecen.
//
// GAME_STATES mezcla dos máquinas: la del shell (LOAD, TITLE, INTRO, VICTORY, DEFEAT,
// BRIEFING, FINISH_*) y la del combate. Esta lista es la frontera. La segunda mecánica va a
// declarar la suya y el shell no va a tener que saber qué hay adentro de ninguna de las dos.
//
// FINISH_LINE y FINISH_ANIM NO están acá a propósito: el remate es la muerte del jefe, y
// cualquier mecánica futura termina con un jefe que cae y va a querer el mismo remate.
export const cardsMechanic = {
  id: 'cards',
  states: [
    GAME_STATES.PROBLEM,
    GAME_STATES.CHOOSE,
    GAME_STATES.TIMING,
    GAME_STATES.RESOLVE,
    GAME_STATES.EXPLAIN,
  ],
}
```

- [ ] **Step 2: El registro**

```js
// src/game/mechanics/index.js
import { cardsMechanic } from './cards.mechanic'

// Una mecánica por forma de pelear. El nivel declara cuál usa con `level.mechanic`.
//
// Hay UNA sola y es a propósito: el registro existe porque ya sabemos que hace falta una
// segunda —el nivel de las 6 ventajas del cloud no entra en `cards`, ver el spec— pero
// escribirla ahora sería adivinar. Esto es el enchufe, no el aparato.
export const MECHANICS = {
  [cardsMechanic.id]: cardsMechanic,
}

export const getMechanic = (id) => {
  const mechanic = MECHANICS[id]
  if (!mechanic) throw new Error(`mecánica desconocida: "${id}"`)
  return mechanic
}
```

- [ ] **Step 3: El motor la resuelve**

En el constructor de `GameEngine`, después de validar el nivel:

```js
// Falla acá y no a mitad de una ronda: un nivel con una mecánica que no existe es un error
// de contenido, y el único lugar donde se puede leer como tal es al construir el motor.
this.mechanic = getMechanic(level.mechanic)
```

- [ ] **Step 4: Verificar**

Run: `npm test`
Expected: PASS.

Run: `npm run dev` y jugar el nivel 1 completo. No debe cambiar **nada**.

Verificar que el error funciona: cambiá temporalmente `mechanic: 'cards'` por `mechanic: 'quiz'` en `isla0-n1.js`, recargá, y confirmá que la consola muestra `mecánica desconocida: "quiz"`. Revertí el cambio.

- [ ] **Step 5: Commit**

```bash
git add src/game/mechanics src/game/GameEngine.js
git commit -m "feat(motor): registro de mecánicas por nivel"
```

---

## Estado final

Después de las 6 tareas:

- Agregar un nivel nuevo = escribir un archivo en `src/content/levels/`, sumarlo a `LEVELS`, a `ISLAND0.levels` y a `ISLAND_MAP.NODES`. **Cero cambios en el motor.**
- El progreso sobrevive a recargas.
- La intro de la isla corre una vez.
- La segunda mecánica tiene dónde enchufarse.

## Divergencia declarada contra el spec

El spec (§4) pide que los estados de combate **pasen a ser propiedad** de la mecánica `cards`. El plan solo los **declara** en `cards.mechanic.js` (Task 6) y deja el despacho como está, en `GameEngine.update()` y `draw()`.

Es deliberado. Mover ese despacho es un refactor del corazón del motor cuyo único beneficio aparece cuando exista la segunda mecánica — y ahí vamos a saber qué interfaz necesita de verdad, en vez de adivinarla ahora. Hacerlo hoy es riesgo sin retorno sobre el único combate que funciona.

La frontera queda escrita y verificable. El movimiento se hace en el spec de la segunda mecánica.

## Lo que queda pendiente y por qué

- **XP, tienda, ítems y mobs**: fuera de scope por decisión del spec. El mapa de isla es donde van a colgar.
- **La mecánica para las 6 ventajas del cloud**: necesita su propio spec. No entra en `cards` porque las ventajas no son mutuamente excluyentes.
- **Niveles 2, 3 y 4 de la Isla 0**: son contenido, y el contenido se escribe cuando el motor lo puede correr. Ese es el punto de este plan.
