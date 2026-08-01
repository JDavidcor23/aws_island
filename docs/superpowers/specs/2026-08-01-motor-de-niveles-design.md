# Motor de niveles — diseño

> Fecha: 2026-08-01 · Estado: aprobado para plan de implementación

## El problema

El juego no tiene niveles. Tiene **un** combate.

Las 4 rondas viven literales en `src/constants/ROUNDS.js`, las 4 cartas en `src/constants/CARDS.js`, y los
patrones de parry en `src/constants/COMBO.js`. Cuatro módulos del motor los importan por nombre. No existe el
concepto de "nivel", ni el de "isla", ni el de "progreso".

Eso bloquea todo lo que viene después. La Isla 0 tiene que enseñar cuatro conceptos (las 5 características del
cloud, las 6 ventajas, los problemas que resuelve la nube, y AWS Pricing Fundamentals), y después vienen más
islas. Con el contenido incrustado en el código, agregar el nivel 2 es editar el motor.

Y hay una consecuencia peor si se ignora: XP, tienda, ítems y mobs se construirían encima de un motor que solo
sabe correr un combate, y quedarían acoplados a él.

**Este documento cubre solo el motor de niveles.** XP, tienda, ítems y enemigos menores quedan explícitamente
fuera; son la fase siguiente.

## El acoplamiento real

Medido sobre el código, no supuesto:

| Archivo | Línea | Qué lo ata |
|---|---|---|
| `game/battle/battleLogic.js` | 2-3 | importa `ROUNDS`, `CARDS`, `CARD_IDS` |
| `game/battle/battleLogic.js` | 18 | `currentRound` indexa `ROUNDS` global |
| `game/battle/battleLogic.js` | 66 | `G.cards = shuffle(CARD_IDS)` — el mazo es global |
| `game/battle/battleLogic.js` | 301, 308, 326 | fin de nivel y orden derivados de `ROUNDS.length` |
| `game/render/drawCards.js` | 2, 131 | lee `CARDS` para el label |
| `game/render/drawCardInfo.js` | 2, 83 | lee `CARDS` para la ficha |
| `constants/COMBO.js` | 166 | un patrón de parry **por carta**, indexado por `ans` |
| `game/GameEngine.js` | 69 | `order: [0, 1, 2, 3]` fijo a 4 rondas |
| `game/GameEngine.js` | 223, 240 | teclas `'1'`–`'4'` fijas a 4 cartas |

`GameEngine.js` **no** importa el contenido. Su acoplamiento es distinto y más sutil: asume la *cardinalidad*
(cuatro de todo) en el estado inicial y en el input.

## Diseño

### 1. El contenido se muda a `src/content/`

```
src/content/
  islands/
    island0.js          → { id, name, intro, levels: ['isla0-n1', ...] }
  levels/
    isla0-n1.js         → { id, mechanic, concept, boss, rounds, cards, combos }
    index.js            → registro id → módulo
```

Un nivel es un objeto plano:

```js
export const isla0n1 = {
  id: 'isla0-n1',
  mechanic: 'cards',
  concept: '5 características del cloud computing',
  boss: { sprite: 'boss', name: '...' },
  rounds: [ { prob, ans, expl }, ... ],
  cards:  { ela: { label, es, what, why, blocks }, ... },
  combos: { ela: [...], ... },   // patrones de parry, hoy en COMBO.PATTERNS
}
```

`ROUNDS.js`, `CARDS.js` y `COMBO.PATTERNS` no se borran: se **convierten** en `isla0-n1.js`. El contenido que
hoy funciona sigue siendo exactamente el mismo, ahora como dato. `COMBO.js` conserva sus constantes de
*timing* (ventanas, tolerancias) — esas son del motor, no del nivel.

### 2. El motor recibe el nivel, no lo importa

`battleLogic.js`, `drawCards.js` y `drawCardInfo.js` dejan de importar constantes y leen de `G.level`, que el
motor pone al arrancar el combate. `currentRound(G)` pasa a indexar `G.level.rounds`. `G.cards` sale de
`Object.keys(G.level.cards)`.

La cardinalidad deja de ser constante: `order` se genera de `G.level.rounds.length`, y el rango de teclas
numéricas de `G.cards.length`, acotado a 9 (no hay tecla `'10'`). Un nivel con más de 9 cartas no es un
problema de teclado, es un problema de diseño: nadie elige entre diez opciones en 15 segundos.

### 3. Registro de mecánicas

```js
// src/game/mechanics/index.js
export const MECHANICS = { cards: cardsMechanic }
```

El nivel declara `mechanic`; el motor resuelve `MECHANICS[level.mechanic]`. **Se implementa una sola:
`cards`**, que es la que ya existe. El registro no es especulación: ya sabemos que las 6 ventajas del cloud no
entran en esta mecánica (ver Riesgos), así que va a haber una segunda. Lo que no hacemos es escribirla ahora.

### 4. Separar los estados de shell de los de combate

`GAME_STATES` hoy mezcla dos máquinas distintas:

- **Shell**: `LOAD`, `TITLE`, `INTRO`, `VICTORY`, `DEFEAT`
- **Combate de cartas**: `PROBLEM`, `CHOOSE`, `TIMING`, `RESOLVE`, `EXPLAIN`

Los segundos pasan a ser propiedad de la mecánica `cards`. Sin esta separación, la segunda mecánica tiene que
fingir que tiene un estado `CHOOSE` para que el shell la entienda.

`BRIEFING`, `TUTORIAL_CLEAR` y `REMATCH_INTRO` se quedan en el shell: son de la isla y del progreso, no del
combate.

`FINISH_LINE` y `FINISH_ANIM` **también se quedan en el shell.** El remate es la muerte del boss, no una fase
del combate de cartas: cualquier mecánica futura va a terminar con un boss que cae, y va a querer el mismo
remate. La mecánica avisa "el boss llegó a cero" y el shell corre la cinemática.

### 5. Progreso en localStorage

`src/services/progress.service.js`, mismo patrón que `audioSettings.service.js`: I/O aislado, `try/catch` en
lectura y escritura, y fallback en memoria si `localStorage` falla. Un juego no se cae porque no pudo guardar.

```js
{ completed: ['isla0-n1'], unlocked: ['isla0-n1', 'isla0-n2'] }
```

Nada más. **No hay XP en este spec.**

### 6. Pantalla `ISLAND_MAP`

Estado nuevo del shell, entre `TITLE` y el combate. Un nodo por nivel sobre `island0_before.png`, en tres
estados: **completado / disponible / bloqueado**. Sin arte nuevo. Al terminar un nivel se vuelve acá, no al
menú.

Es también el lugar donde después cuelgan la tienda y el contador de XP, cuando existan.

### 7. La intro es de la isla, no del nivel

La llegada en barco, el mentor y el briefing corren **una sola vez por isla**. Viven en `island0.js` y las
dispara el shell la primera vez que se entra a la isla. Si quedaran colgadas del nivel, el jugador se comería
la llegada en barco cuatro veces.

## Lo que no se toca

El combate de cartas, la intro del barco, el mentor, el briefing, el combo de parries, el finisher y el
sistema de fases `TUTORIAL`/`REMATCH`. Todo eso sigue funcionando igual: pasa a ser el nivel 1.

`LAYOUT.js` no se toca — es archivo compartido y el arte de la arena está verificado contra sus coordenadas
(`.kiro/specs/CONCEPTO_ISLA_0.md`).

## Riesgos

**Las 6 ventajas del cloud no entran en la mecánica `cards`.** Las 5 características NIST funcionan como
cartas porque son mutuamente excluyentes: cada problema tiene una respuesta y las otras están claramente mal.
Las ventajas se solapan — CapEx/OpEx, TCO, economías de escala y pay-as-you-go describen la misma idea desde
ángulos distintos (`cloud-computing-fundamentals.md` §6, §7, §8, §14). Un ataque como *"compraste 100
servidores y usás 10"* tiene tres respuestas defendibles. Con `cards`, ese nivel enseña a adivinar qué quiso
el diseñador, no el concepto.

Por eso existe el registro de mecánicas. **Ese nivel necesita otra mecánica, y su diseño es un spec aparte.**

**El sistema de fases `TUTORIAL`/`REMATCH` es un eje ortogonal al nivel.** Hoy `PHASE_CONFIG` decide si el
problema espera ESPACIO y si el panel de carta confirma la jugada. Al meter niveles hay que decidir si cada
nivel tiene su propio tutorial o si el tutorial es solo del primero. **Decisión de este spec: el tutorial es
del nivel 1 de cada isla.** Los demás niveles arrancan en `REMATCH`.

## Verificación

Los tests que ya existen (`combo.test.js`, `COMBO.test.js`, `bossShout.test.js`) importan `ROUNDS` y
`CARD_IDS` directo. Al mover el contenido hay que apuntarlos al nivel — y que sigan pasando es la prueba de
que la migración no rompió el combate.

Criterio de aceptación: **el nivel 1 se juega exactamente igual que hoy**, con el contenido cargado como dato.
