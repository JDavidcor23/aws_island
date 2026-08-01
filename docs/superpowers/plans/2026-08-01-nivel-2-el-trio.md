# Nivel 2 — "El Trío" · plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: superpowers:subagent-driven-development o superpowers:executing-plans.

**Goal:** Un segundo nivel de la Isla 0 que repite los cuatro problemas del nivel 1 contra tres enemigos que atacan encadenado y sin pausa, para consolidar las cuatro cartas antes de introducir un concepto nuevo.

**Architecture:** El ritmo de combate (`PHASE_CONFIG`) baja de constante global a dato del nivel. El render del jefe pasa de dibujar uno fijo a dibujar la formación que el nivel declare. Ninguna de las dos cosas es una mecánica nueva: el nivel 2 sigue siendo `mechanic: 'cards'`.

**Tech Stack:** React 19, Vite 6, Vitest 2.1.9, canvas 2D.

## Global Constraints

- Rama `dev`. Commits convencionales, sin atribución a IA.
- **No crear tests.** Los 23 existentes tienen que seguir pasando.
- **No correr `npm run build`.** Verificación: `npm test` + `npm run dev`.
- El **nivel 1 no puede cambiar en nada**. Es la regresión que hay que vigilar en cada tarea.
- Comentarios en español rioplatense, explicando el POR QUÉ.

## Por qué este nivel existe

No agrega contenido: repite el del nivel 1 bajo presión. Eso es **práctica intercalada** — se retiene más practicando lo aprendido antes de sumar lo siguiente que encadenando conceptos nuevos. El nivel 1 enseña las cuatro cartas de a una, con el pingüino explicando; el nivel 2 las cobra las cuatro juntas, sin ayuda y sin tiempo.

## El problema de espacio (medido, no supuesto)

| Elemento | Coordenadas actuales |
|---|---|
| Canvas | 640 × 360 |
| Jefe único | x 320, y 196, **size 192** |
| Cartas | x 188–470, y 245–326 |
| Héroe | x 78, y 292 |
| HUD | x 0–210, y 0–90 |

Tres jefes de 192 px son 576 px de ancho sin contar separación, y pisarían las cartas. **No entran.** El trío usa sprites de 104 px alineados arriba de la franja de cartas.

`LAYOUT.js` **no se modifica** — se le **agrega** una clave `TRIO`. Las coordenadas existentes están verificadas contra el arte de la arena (`.kiro/specs/CONCEPTO_ISLA_0.md`) y tocarlas rompe el nivel 1.

---

### Task 1: El ritmo baja al nivel

Hoy `PHASE_CONFIG` es una constante global con dos entradas (`TUTORIAL`, `REMATCH`) y trece campos. El nivel 2 necesita su propio ritmo sin duplicar los trece.

**Files:**
- Modify: `src/constants/PHASES.js`
- Modify: `src/game/battle/battleLogic.js` (todos los `PHASE_CONFIG[G.phase]`)
- Modify: `src/game/battle/combo.js`, `src/game/GameEngine.js`, `src/game/render/drawCards.js`, `src/game/render/drawCardInfo.js` (mismo patrón)
- Modify: `src/content/levels/isla0-n1.js` (declarar que usa el ritmo por defecto)

**Interfaces:**
- Produces: `phaseConfig(G): PhaseConfig` exportada de `src/constants/PHASES.js`. Resuelve el ritmo efectivo: parte de `PHASE_CONFIG[G.phase]` y le aplica encima `G.level.pacing?.[G.phase]` si el nivel lo declara.

- [ ] **Step 1: Agregar el resolvedor a `PHASES.js`**

```js
// El ritmo efectivo de la fase actual. Sale de dos capas:
//   1. PHASE_CONFIG — el ritmo por defecto, que documenta cada campo y es el del nivel 1.
//   2. level.pacing[fase] — lo que ese nivel quiera pisar, y NADA más.
//
// Es merge y no reemplazo a propósito: un nivel que sólo quiere el timer más corto declara
// UN campo, no los trece. Copiar los trece para cambiar uno es cómo se desincronizan.
export const phaseConfig = (G) => {
  const base = PHASE_CONFIG[G.phase]
  const override = G.level?.pacing?.[G.phase]
  return override ? { ...base, ...override } : base
}
```

- [ ] **Step 2: Reemplazar los usos**

Buscar todos los `PHASE_CONFIG[G.phase]` y cambiarlos por `phaseConfig(G)`:

Run: `rg "PHASE_CONFIG\[" src`

En `battleLogic.js` hay varios dentro de funciones que ya tienen `G` en scope. En `GameEngine.js` (`handleKeyDown`) también. En los drawers, verificar si la función recibe `G` o `engine`.

⚠️ `PHASE_CONFIG` sigue exportado y no se borra: es la capa base y su documentación es el contrato.

- [ ] **Step 3: Verificar que el nivel 1 no cambió**

Run: `npm test` → 23 tests PASS.
Run: `npm run dev` → jugar el tutorial del nivel 1. Sin `pacing` declarado, `phaseConfig(G)` devuelve exactamente `PHASE_CONFIG[G.phase]`.

- [ ] **Step 4: Commit**

```bash
git add -A && git commit -m "refactor(motor): el ritmo de combate se puede pisar por nivel"
```

---

### Task 2: La formación de enemigos baja al nivel

`drawBoss` dibuja un sprite en `LAYOUT.BOSS`. El nivel 2 necesita tres.

**Files:**
- Modify: `src/constants/LAYOUT.js` (**agregar** `TRIO`, no tocar nada existente)
- Modify: `src/game/render/drawScene.js` (`drawBoss`)
- Modify: `src/content/levels/isla0-n1.js` (declarar su formación)

**Interfaces:**
- Produces: `level.formation: Array<{ id, x, y, size, tint? }>`. El nivel 1 declara uno solo con las coordenadas de `LAYOUT.BOSS`; el nivel 2 declara tres.
- Produces: `G.activeEnemy: string` — id del enemigo que está atacando. `null` fuera de combate.

- [ ] **Step 1: Agregar `TRIO` a `LAYOUT.js`**

```js
  // Formación de tres enemigos del nivel 2. Son 104 px y no 192 como el jefe único: tres de
  // 192 son 576 px de ancho en un canvas de 640 y pisarían la fila de cartas (x 188-470).
  // Van en y=150, arriba de las cartas (y 245) y debajo del bocadillo.
  TRIO: [
    { x: 250, y: 150, size: 104 },
    { x: 390, y: 150, size: 104 },
    { x: 530, y: 150, size: 104 },
  ],
```

- [ ] **Step 2: `drawBoss` dibuja la formación**

Refactorizar `drawBoss` para que itere `G.level.formation` en vez de leer `LAYOUT.BOSS` directo. El cuerpo del dibujo (bob, flash de daño, vapor, temblor de windup) se extrae a una función `drawEnemy(engine, enemy)` que recibe las coordenadas.

Reglas del dibujo con formación:
- El **enemigo activo** (`G.activeEnemy === enemy.id`) se dibuja a alpha 1 y con su bob normal.
- Los **inactivos** van a `globalAlpha 0.55` y sin vapor. Sin esto, tres columnas de vapor saturan la pantalla y no se entiende cuál ataca.
- El flash de daño y el temblor de windup se aplican **sólo al activo**.
- El vapor ambiente sale **sólo del activo**, y con la mitad de probabilidad (0.03): con tres enemigos, 0.06 cada uno es el triple de partículas.
- `tint` (opcional): si el enemigo lo declara, se pinta un rectángulo del color en modo `multiply` recortado al sprite. Si complica, se puede omitir en la primera pasada — la diferencia de alpha entre activo e inactivo ya comunica quién ataca.

⚠️ El remate (`FINISH_ANIM`/`FINISH_LINE`) sigue operando sobre **un** enemigo. En el nivel 2 el remate lo recibe el último que quede activo. No inventar una animación de remate triple en esta tarea.

- [ ] **Step 3: El nivel 1 declara su formación**

```js
  // Un solo jefe, en las coordenadas históricas de LAYOUT.BOSS. Se declara explícito para
  // que el motor no tenga que saber cuál es el caso "normal": todos los niveles declaran.
  formation: [{ id: 'legacy', x: 320, y: 196, size: 192 }],
```

- [ ] **Step 4: Verificar el nivel 1 pixel a pixel**

Run: `npm run dev`, jugar el nivel 1 y confirmar que el jefe se ve **idéntico**: misma posición, mismo tamaño, mismo vapor, mismo flash al recibir daño, mismo remate.

- [ ] **Step 5: Commit**

```bash
git add -A && git commit -m "feat(motor): la formacion de enemigos la declara el nivel"
```

---

### Task 3: El nivel 2

**Files:**
- Create: `src/content/levels/isla0-n2.js`
- Modify: `src/content/levels/index.js` (registrarlo)
- Modify: `src/content/islands/island0.js` (sumarlo a `levels`)
- Modify: `src/constants/ISLAND_MAP.js` (nodo en el mapa)

- [ ] **Step 1: El nivel**

Importa `rounds`, `cards` y `combos` de `isla0-n1` — **no los copia**. Es el mismo contenido a propósito: el nivel 2 es práctica, no material nuevo. Duplicarlo sería garantizar que un día se desincronicen.

```js
import { isla0n1 } from './isla0-n1'
import { PHASES } from '../../constants/PHASES'
import { COMBAT_PACING } from '../../constants/COMBAT_PACING'

// Nivel 2 — "El Trío". Los MISMOS cuatro problemas del nivel 1, contra tres enemigos que
// atacan encadenado y sin pausa.
//
// No agrega contenido: lo cobra. El nivel 1 enseña las cuatro cartas de a una con el
// pingüino explicando cada una; acá no hay pingüino, no hay explicación y no hay tiempo.
// Practicar lo aprendido antes de sumar lo siguiente retiene más que encadenar conceptos
// nuevos — por eso este nivel va ANTES del que trae material nuevo.
export const isla0n2 = {
  id: 'isla0-n2',
  mechanic: 'cards',
  concept: 'Las 5 características, sin ayuda y contra reloj',

  // El contenido se REFERENCIA, no se copia: es deliberadamente el mismo del nivel 1.
  rounds: isla0n1.rounds,
  cards: isla0n1.cards,
  combos: isla0n1.combos,

  formation: [
    { id: 'rack-a', x: 250, y: 150, size: 104, tint: '#c4402a' },
    { id: 'rack-b', x: 390, y: 150, size: 104, tint: '#7a9a3a' },
    { id: 'rack-c', x: 530, y: 150, size: 104, tint: '#5a4a68' },
  ],

  // Este nivel no tiene tutorial: arranca en REMATCH.
  startPhase: PHASES.REMATCH,

  pacing: {
    [PHASES.REMATCH]: {
      // Menos tiempo que la revancha del nivel 1. Es el punto del nivel: el jugador ya sabe
      // las cuatro cartas, ahora tiene que elegirlas sin pensar.
      chooseTimeLimit: COMBAT_PACING.CHOOSE_TIME_LIMIT * 0.8,
      atkSpeedMult: 1.5,
      comboSpeedMult: 1.5,
    },
  },
}
```

⚠️ Verificar el valor real de `COMBAT_PACING.CHOOSE_TIME_LIMIT` antes de escribir esto. Si el resultado baja de 3 segundos, dejarlo en 3: por debajo de eso no hay decisión, hay lotería.

- [ ] **Step 2: `startPhase` — el nivel arranca en REMATCH**

`createInitialState` hoy fija `phase: PHASES.TUTORIAL`. Pasa a `phase: level.startPhase ?? PHASES.TUTORIAL`.

⚠️ **Trampa**: `beginRematch()` es hoy el único camino que inicializa corazones, especial y `order` para la fase REMATCH. Un nivel que arranca en REMATCH sin pasar por ahí puede entrar con estado a medio armar. Verificar `createInitialState` contra lo que hace `beginRematch` y completar lo que falte.

- [ ] **Step 3: Rotar el enemigo activo por ronda**

En `startRound` (`battleLogic.js`), asignar el enemigo que ataca:

```js
  // El enemigo que lanza este problema. Rota por ronda, así los tres atacan. Con un solo
  // enemigo en la formación siempre da el mismo, que es el comportamiento del nivel 1.
  G.activeEnemy = G.level.formation[G.round % G.level.formation.length].id
```

- [ ] **Step 4: Registrar el nivel**

En `content/levels/index.js` sumar `isla0n2` a `LEVELS`. En `island0.js` sumar `'isla0-n2'` a `levels`. En `ISLAND_MAP.js` agregar el nodo — buscar una posición sobre el dibujo que no pise el nodo 1 (que está en x 28, y 62).

- [ ] **Step 5: Verificar el flujo entero**

Run: `npm run dev`
1. Nivel 1 completo → vuelve al mapa → **el nodo 2 aparece desbloqueado**.
2. Nivel 2: se ven **tres** enemigos, el que ataca se distingue de los otros dos.
3. Los problemas encadenan sin pausa y el timer es más corto que en la revancha del nivel 1.
4. **No aparece el pingüino** ni pantalla de explicación.
5. Ganar el nivel 2 → el nodo 2 queda completado.

- [ ] **Step 6: Commit**

```bash
git add -A && git commit -m "feat(nivel): el trio, practica de las 5 caracteristicas contra reloj"
```

---

## Riesgos

**El remate con tres enemigos.** El finisher está escrito para un jefe que cae. Con formación de tres, esta versión lo aplica al activo y los otros dos quedan quietos. Se va a ver raro. Es aceptable para la primera pasada y merece su propia tarea después de verlo corriendo.

**El bocadillo del jefe.** `drawBossSpeech` dibuja la cola del globo apuntando al jefe único. Con tres enemigos tiene que apuntar al activo. Si al probarlo la cola apunta al lugar equivocado, es un fix chico en `drawBossSpeech` — pero hay que mirarlo.

**`beginRematch` como único inicializador.** Ver la trampa de la Task 3 Step 2. Es el punto más probable de bug en todo el plan.
