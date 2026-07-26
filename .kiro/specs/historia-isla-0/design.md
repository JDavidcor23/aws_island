# Historia de la Isla 0 — el novato de Amazon

**Rama sugerida:** `feature/historia-isla-0` · **Estado:** diseño aprobado, sin implementar

> Este spec es **solo texto y narrativa**. No pide un asset nuevo, no crea una pantalla nueva, no toca el
> motor, la lógica de combate ni la máquina de estados. Si alguien lo implementa y termina editando
> `GameEngine.js` o `battleLogic.js`, se salió del spec.

---

## El problema que este spec resuelve

El juego arranca en frío. El mentor dice que hay una torre y que hay que enfrentarla, y el jugador no tiene
ni idea de quién es, para quién trabaja, ni qué se pierde si el Legacy Server gana. No hay apuesta.

Y hay un problema peor, que se encontró grepeando `src/`:

| Palabra | Dónde la dice hoy, en pantalla | Veces que la explica |
|---|---|---|
| **nube** | 4: `drawCards.js:63`, `ROUNDS.js:7`, `drawScreens.js:29` (título), `drawScreens.js:84` (remate) | **0** |
| **Legacy** | es el nombre del jefe, en la barra de vida y en la derrota | **0** |
| **on-premise** | en ningún lado | — |
| **Amazon** / **AWS** | **0 veces en todo `src/`** | — |

Un juego que se llama *"Isla 0 — Fundamentos de la Nube"* dice "nube" cuatro veces en pantalla y nunca dice qué
es. Y no menciona a Amazon ni una sola vez.

> Hay una quinta aparición de "nube" en `UI_TEXTS.js:4` (`INTRO_MENTOR`) que **no cuenta**: ese texto está
> muerto, no lo consume nadie. Ver "Qué archivos toca".

Lo que este spec **no** hace es agregar un tutorial de teoría. Hace lo contrario: usa el arte que ya está
generado y sin explotar para que las palabras se peguen a imágenes.

---

## La premisa

**La organización.** Amazon manda gente isla por isla a arreglar las que quedaron atadas a una máquina vieja.
La Isla 0 es la primera y la más fácil: es donde entrenan a los nuevos. Eso resuelve dos cosas de un saque —
por qué el nivel se llama "Isla 0", y por qué mandarían a un novato a hacer este trabajo.

**El jugador.** Primera misión, recién entrado. No sabe nada, y eso es coherente con que el juego le enseñe.
Se descartó la variante "mejor soldado de su promoción": el jugador objetivo es un chico de 8-12 años y tiene
que poder identificarse con alguien que está aprendiendo igual que él.

**El mentor.** El pingüino es el veterano asignado. Ya hizo esto antes. Se lo muestra **una vez** y después el
novato se la arregla solo.

> Esa última frase **ya existe en el juego**: la segunda entrada de `INTRO_LINES` en `INTRO_SCENE.js` dice
> *"Vení, que te lo muestro una vez... y después te la arreglás."* La estructura tutorial → revancha ya era
> narrativa y nadie la había nombrado. Este spec no inventa esa estructura: le pone nombre.

**La apuesta.** Las casas están **tapiadas**. La gente se fue cuando la máquina dejó de dar abasto. Si el
jugador gana, vuelven — y eso es literalmente `scene_island_after.png`, con flores en las ventanas. Si pierde,
la isla queda como está.

> ⚠️ **Se eligió "se fueron" y no "están sufriendo" por una razón técnica, no estética: no hay sprites de
> aldeanos.** Si el mentor habla de gente que el jugador no ve, el guion promete arte que no existe. Un pueblo
> vacío es gratis y pega más fuerte.

**AWS todavía no se nombra.** En la Isla 0 el mentor dice "Amazon". AWS entra cuando entren los servicios con
nombre propio — la Isla 1 es EC2.

---

## ⚠️ La regla que gobierna todo el guion

**Ninguna palabra técnica aparece sin que haya algo en pantalla que la sostenga. Si no se ve, no se nombra.**

En ninguna línea de este guion hay una definición de diccionario. No se dice *"un servidor on-premise es un
servidor alojado en instalaciones propias"*. Se dice *"está adentro de la isla y es solo de ellos"* — y el
chico lo está mirando mientras lo escucha.

El orden dentro de cada concepto es siempre el mismo, y no es negociable:

```
primero VE la cosa  ->  después se le nombra dónde está  ->  después se le nombra por qué falla
```

El sustantivo técnico llega **último**, cuando ya hay una imagen a la que pegarlo.

---

## ⚠️ Relación con el requisito 7 de `tutorial-revancha`

Ese requisito dice que la introducción **no** explica mecánicas, y por él el diálogo bajó de 5 líneas a 2.
Este spec lo sube a 6. **No lo viola, y la distinción importa:**

- El requisito 7 prohíbe explicar **mecánicas** — cómo se elige carta, cómo se bloquea, cómo se carga el
  especial. Eso lo enseña la pelea tutorial jugando, y este spec no toca una sola línea de eso.
- `on-premise`, `legacy`, `cloud` y `Amazon` no son mecánicas: son **el contenido**, la razón de existir del
  juego. Enseñarlos no es una interrupción, es el producto.

Lo que **sí** se hereda del requisito 7 es su principio de fondo: nadie aprende de un muro de texto leído
antes de tener contexto. Por eso las cuatro palabras **no van todas en la intro** — van repartidas en el
momento en que cada una se siente. Ver el contrato de colocación.

---

## Contrato de colocación

| Momento | Pantalla | Palabra | Por qué ahí |
|---|---|---|---|
| Caminata de entrada | `INTRO` sobre `scene_island_path` | **on-premise** | los 7 elementos del concepto están en cuadro: la máquina que hace todo se ve |
| Misma caminata | `INTRO` | **legacy** | la torre echando tres columnas de humo *es* la imagen de "vieja y ya no da más" |
| Primer `EXPLAIN` del tutorial | `EXPLAIN`, ronda 0 | **cloud** | el único momento en que el jugador **sintió** que la ayuda vino de afuera |
| Las 4 fichas de carta | panel de carta (lectura ya obligatoria) | refuerzo de **cloud** | ya existe el gate que lo fuerza a leer las cuatro; no hace falta nada nuevo |
| Victoria, isla sana en pantalla | `VICTORY` | **Amazon** | cierra quién lo mandó y a dónde va |
| Derrota | `DEFEAT` | la apuesta | hoy esa pantalla no dice qué se perdió |

Verificado en el asset: `scene_island_path.png` tiene los **siete** elementos de `CONCEPTO_ISLA_0.md` en
cuadro — molino roto arriba a la izquierda, torre de agua oxidada a la derecha, el Legacy Server sobre la
colina al fondo con tres columnas de humo, las casas con los techos hundidos al centro, el canal de lodo verde
y el puente de arco en primer plano, las tuberías corroídas cruzando el suelo y la fila de álamos pelados. El
guion puede señalar cualquiera de esos y el jugador lo ve.

---

## ⚠️ Límites duros de las cajas de diálogo

**Medido sobre el código, no estimado.** Las dos cajas envuelven a **40 caracteres** (`wrapText(texto, 40)`) y
aguantan **4 renglones**. El quinto cae encima del indicador `▼ ESPACIO`:

| Caja | Archivo | `dy` | Renglones en | Indicador `▼` en | Techo |
|---|---|---|---|---|---|
| Intro | `drawIntroScene.js:80` | 6 | 52, 68, 84, 100, ~~116~~ | 114 | **4 renglones** |
| Combate | `drawDialogue.js:17` | 232 | 278, 294, 310, 326, ~~342~~ | 340 | **4 renglones** |

Los textos sueltos (`drawTextOutlined` centrado) no usan wrap: el límite es el ancho del canvas, 640px. A
font 13 bold monospace son ~7.8px por carácter, o sea **~48 caracteres cómodos**.

Todas las líneas de este guion están medidas contra esos números y entran.

---

## El guion

### Momento 1 · La caminata — `on-premise` y `legacy`

Reemplaza `INTRO_LINES` completo en `src/constants/INTRO_SCENE.js`. Las seis son de 3 renglones.

| # | Texto | Renglones |
|---|---|---|
| 1 | Primera isla, novato. Mirá bien: el molino roto, el agua verde, las casas tapiadas. Todo esto funcionaba. | 3 |
| 2 | ¿Ves esa torre que echa humo allá arriba? Una sola máquina hacía TODO acá. La luz, el agua, el molino. | 3 |
| 3 | Está adentro de la isla y es solo de ellos. Eso es on-premise: tu máquina, en tu lugar. Si no da más, nadie te ayuda. | 3 |
| 4 | Y ya no da más. Tan vieja que nadie sabe arreglarla y no puede crecer ni un poco. Una máquina así es un legacy. | 3 |
| 5 | La gente se fue. A mí Amazon me mandó a una isla como esta hace años. Hoy te toca a vos. | 3 |
| 6 | No lo vas a vencer a golpes. Vení, que te lo muestro una vez... y después te la arreglás. | 3 |

Todas con `speaker: 'MENTOR 🐧'`, igual que hoy.

> La línea 6 **es la línea 2 actual, sin cambios**. Ya hace exactamente lo que tiene que hacer: presenta la
> estructura tutorial → revancha sin nombrar una sola mecánica. No se toca.

**Costo aceptado explícitamente:** la intro pasa de 2 líneas a 6. Con `REVEAL_CHARS_PER_SEC: 30` son unos
**20-25 segundos** antes del primer gameplay, contando las pulsaciones. Es cuatro veces más texto del que
había. `T` sigue salteando todo (`INTRO_SCENE.SKIP_HINT`). Se acepta porque sin esto el juego no tiene apuesta.

### Momento 2 · El primer bloqueo — `cloud`

Texto nuevo, **solo** en el `EXPLAIN` de la ronda 0 del tutorial:

> Esa ayuda no salió de la isla: vino de afuera, de máquinas que no son tuyas. Eso es la NUBE.

Se concatena a los prefijos que ya existen, igual que el `expl` de siempre:

| Camino | Texto resultante | Renglones |
|---|---|---|
| Bloqueó bien | `EXPLAIN_HIT_PREFIX` + la línea | 3 |
| Falló el timing | `EXPLAIN_MISS_PREFIX` + la línea | **4 — en el techo** |

> ⚠️ **Trampa documentada:** el camino de error queda exactamente en 4 renglones, **cero margen**. Si alguien
> alarga esta línea, o alarga `EXPLAIN_MISS_PREFIX`, el texto se mete abajo del `▼ ESPACIO` y no se va a notar
> en la ronda que se probó — solo en la que falla el bloqueo. Cualquier cambio acá se vuelve a medir.

Acá **no** se explica elasticidad. Un concepto por momento: la elasticidad ya la explica la ficha de la carta,
que en el tutorial es lectura obligatoria en las cuatro rondas. Las rondas 1, 2 y 3 siguen con su `expl` de
`ROUNDS.js` sin tocar.

> **Por qué la condición es `G.round === 0` y funciona:** `endRound` incrementa `G.round` **después** del
> `EXPLAIN` (`advance` → `case EXPLAIN` → `endRound` → `G.round++`). Durante el `EXPLAIN` del primer problema
> `G.round` todavía vale 0. Verificado en `battleLogic.js`.
>
> **Y por qué el tutorial siempre llega acá con la carta correcta:** `pickCard` solo pasa a `TIMING` si la
> carta acertó, y el tutorial no tiene timeout (`chooseTimeLimit: null`). O sea que en la ronda 0 lo único que
> puede haber fallado es el timing, nunca la elección. Por eso los dos prefijos existentes alcanzan y no hace
> falta una tercera variante.

### Momento 3 · El cierre — `Amazon` y la apuesta

**`VICTORY`** — la isla sana (`scene_island_after.png`) ya está en pantalla:

| Posición | Texto | Cambio |
|---|---|---|
| y=60, font 28 | ¡LA ISLA REVIVE! | sin cambios |
| y=92, font 13 | Volvieron las familias. El legacy quedó de adorno. | reemplaza *"Bienvenido al mundo Cloud."* |
| y=120, font 11 | *(perfects y corazones)* | sin cambios |
| y=H-60, font 13 | Amazon te espera en la Isla 1: EC2 — Próximamente | reemplaza *"🔒 Isla 1: EC2 — Próximamente..."* |
| y=H-32 | R para jugar de nuevo | sin cambios |

*"Quedó de adorno"* no es un chiste suelto: es la tesis de `CONCEPTO_ISLA_0.md` §"Por qué el 3 y el 6 son los
importantes" — el esqueleto del servidor sigue en pie, tomado por el verde. No se demolió el pasado, se superó.

**`DEFEAT`:**

| Posición | Texto | Cambio |
|---|---|---|
| y=140, font 18 | La isla queda así. | reemplaza *"El Legacy Server sigue en pie..."* |
| y=168, font 12 | Las casas, tapiadas. Pero ya sabés cómo vencerlo. | reemplaza *"Pero ya sabés cómo vencerlo."* |
| y=220 | R para reintentar | sin cambios |

Se saca la mención al Legacy Server a propósito: al jugador objetivo no le importa el servidor, le importa el
pueblo. La derrota tiene que doler por lo que se perdió, no por lo que quedó en pie.

---

## Qué archivos toca

| Archivo | Qué se hace |
|---|---|
| `src/constants/INTRO_SCENE.js` | reemplazar `INTRO_LINES` por las 6 líneas |
| `src/constants/UI_TEXTS.js` | agregar `TUTORIAL_CLOUD_REVEAL`, los textos de victoria y derrota. **Borrar `INTRO_MENTOR`** |
| `src/game/render/drawScreens.js` | `drawExplainScreen` (rama de ronda 0 del tutorial), `drawVictoryScreen`, `drawDefeatScreen` |

**`UI_TEXTS.INTRO_MENTOR` está muerto:** se define en `UI_TEXTS.js:3` y no lo consume nadie. Verificado por
grep sobre `src/`. Es el texto que explicaba mecánicas en la intro, huérfano desde que se aplicó el requisito 7
de `tutorial-revancha`. Se borra en el mismo cambio.

`drawExplainScreen` necesita importar `PHASES` para la condición. Es el único import nuevo del spec.

**No se toca nada más.** Ni `GameEngine.js`, ni `battleLogic.js`, ni `PHASES.js`, ni `CARDS.js`, ni un asset.

---

## Criterios de aceptación

1. WHEN se muestra la escena de introducción THEN el sistema SHALL presentar las seis líneas del Momento 1 en
   orden, con el efecto de tipeo y el sonido de tecleo que ya existen.
2. WHEN se muestra cualquier texto de este spec **dentro de una caja de diálogo** THEN el sistema SHALL
   renderizarlo en 4 renglones o menos, sin superponerse al indicador `▼ ESPACIO`. Los textos de victoria y
   derrota no van en caja: su límite es el ancho del canvas.
3. WHILE la fase es `TUTORIAL` AND es el primer problema THE SYSTEM SHALL nombrar la nube en el `EXPLAIN`, y
   SHALL NO explicar ahí la característica de la carta.
4. WHILE la fase es `TUTORIAL` AND NO es el primer problema THE SYSTEM SHALL usar el `expl` de `ROUNDS.js` en
   el `EXPLAIN`, como hasta ahora.
5. WHILE la fase es `REMATCH` THE SYSTEM SHALL NO mostrar el texto de la nube en ningún `EXPLAIN`.
6. WHEN el jugador gana THEN la pantalla de victoria SHALL nombrar a Amazon y SHALL decir que las familias
   volvieron.
7. WHEN el jugador pierde THEN la pantalla de derrota SHALL nombrar qué quedó perdido en la isla.
8. WHEN el jugador aprieta la tecla de saltear en la introducción THEN el sistema SHALL saltear las seis
   líneas y pasar al combate, igual que hoy.
9. WHEN el feature está integrado THEN el sistema SHALL NO decir "AWS" en ninguna pantalla de la Isla 0.
10. WHEN el feature está integrado THEN el sistema SHALL mantener el juego jugable de punta a punta y SHALL NO
    modificar el combate, el HUD, la barra del jefe ni la máquina de estados.

---

## Fuera de alcance (NO lo construyas)

- **Cinemática con arte nuevo.** Evaluada como enfoque C y postergada: necesita assets y días. Este spec es la
  escritura; una cinemática después solo cambiaría **cómo** se muestra, no **qué** se dice. Nada de lo que hay
  acá se tira si se hace.
- **Sprites de aldeanos.** Es justamente lo que el guion está diseñado para no necesitar.
- **Explicar qué es AWS.** Se guarda para la Isla 1, junto con EC2.
- **Explicar la quinta característica de NIST (Measured Service).** No está en el juego; ver `RITMO_Y_JUICE.md`.
- **Voces, música o subtítulos.**
- **Diálogos del héroe.** Su única línea es `UI_TEXTS.HERO_FINISHER` — *"Encontré una forma mejor."* Con esta
  premisa esas cuatro palabras son el arco completo del novato. **No se toca.**
- **Segunda caja de diálogo, o diálogos de dos tiempos.** Todo entra en las cajas que ya existen.
