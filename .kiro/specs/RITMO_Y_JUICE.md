# Ritmo y juice — tareas extra

> **Owner: Osvaldo** (T-1 y T-2). T-3 **no es suya**: ver abajo por qué.
> Salieron de una revisión de Jorge sobre la build integrada del sábado 25.

Antes de tocar nada, dos cosas que ya están resueltas y no hay que rehacer.

---

## T-0 · La historia y el tutorial: YA ESTÁN. Solo verificar.

El pedido original era *"el juego debe explicar qué está pasando y qué hay que hacer"*. Eso ya lo hace la
escena de intro, con estas cinco líneas (`src/constants/INTRO_SCENE.js`):

| # | Línea | Qué cubre |
|---|---|---|
| 1 | "Al fin llegaste. ¿Ves esa torre al fondo? Es el Legacy Server, y ya no da abasto con la isla." | **qué está pasando** |
| 2 | "No lo vas a vencer a golpes. Cada vez que ataque va a gritar un PROBLEMA concreto." | la mecánica |
| 3 | "Vos elegís la característica de la nube que resuelve ESE problema. Con 1-4 o con un clic." | **qué hacer** — cartas |
| 4 | "Y cuando el ataque venga hacia vos, apretá ESPACIO en el momento justo para bloquearlo." | **qué hacer** — timing |
| 5 | "Mientras más preciso el bloqueo, más se carga tu especial. Cuando se llene, lo terminás. ¡Andá!" | la condición de victoria |

**Lo único que falta es una frase, no una tarea.** El juego nunca dice qué está en juego ni cuál es el
objetivo. Sugerencia para la línea 1, que ya la tiene casi:

> "Al fin llegaste. ¿Ves esa torre? Es el Legacy Server. Se está comiendo la isla, y si nadie lo para, no
> queda nada. **Vos vas a pararlo.**"

Y ojo con la tentación de agregar más texto de historia: `CLOUD_QUEST.md` §2 dice *"Jugar > leer: el texto
explica en UNA línea, después del golpe. Nunca antes, nunca en párrafos"*. Cinco líneas antes de pelear ya
está en el límite. **Sumar historia acá va en contra de T-2**, que busca justo lo contrario.

---

## T-1 · El texto se escribe solo, estilo Mario

**Qué.** Las líneas de diálogo aparecen carácter por carácter en vez de golpe. ESPACIO completa la línea al
instante; el ESPACIO siguiente avanza a la próxima.

**Por qué.** Es el juice más barato que hay: cero arte nuevo, cero lógica nueva, y cambia por completo cómo se
siente leer. Además marca el ritmo — el jugador lee al paso del personaje, no de un bloque de texto.

**Archivos** (todos del spec `intro-tutorial`, cero conflicto):

| Archivo | Qué va |
|---|---|
| `src/constants/INTRO_SCENE.js` | `REVEAL_CHARS_PER_SEC` y nada más |
| `src/game/render/drawIntroScene.js` | dibujar solo los primeros N caracteres |
| `src/game/scenes/introScene.js` | avanzar el revelado con `dt`, y el "completar al instante" |

**Las trampas.** Las tres dan bugs que no tiran ningún error:

1. **`wrapText` corta por cantidad de caracteres.** Si revelás N caracteres del texto crudo y después
   envolvés, el texto **se reacomoda solo mientras escribe** y salta de línea. Hay que envolver PRIMERO, y
   después revelar sobre las líneas ya envueltas, contando los caracteres acumulados.
2. **Avanzar por frames y no por `dt`.** Si contás un carácter por frame, la velocidad del texto depende de
   los FPS de la máquina. Usar `dt`, como todo el resto del motor.
3. **El primer ESPACIO no debe avanzar de línea.** Si completa Y avanza en el mismo golpe, el jugador se
   saltea la línea sin leerla. Primer ESPACIO completa, segundo avanza.

**Si querés extenderlo al combate** (`drawDialogue` en `drawScreens.js`, para las fases PROBLEM y EXPLAIN):
el estado del revelado tiene que **reiniciarse en cada línea nueva**, y ahí no sirve `G.intro` porque es solo
de la intro. Guardalo colgado del cambio de fase. **Consultalo antes**, porque el grito del jefe con máquina
de escribir puede matarle el impacto — hoy entra de golpe y pega.

**Verificación.**

- [ ] El texto no se reacomoda ni salta de línea mientras escribe.
- [ ] La velocidad se siente igual en dos máquinas distintas.
- [ ] Primer ESPACIO completa la línea, segundo avanza.
- [ ] `T` sigue salteando toda la escena en cualquier momento.

---

## T-2 · Máximo 5 segundos para elegir la carta

**Qué.** En la fase `CHOOSE` arranca una cuenta de ~5 segundos, visible. Si se agota, el jugador pierde el turno.

**Por qué.** Es la tarea más valiosa de las cuatro. Hoy `CHOOSE` **espera para siempre**: el jugador puede
pensar dos minutos, y sin presión no hay tensión. Y separa bien las dos cosas: el tutorial es lento y
explicativo, el gameplay es rápido y tenso.

**Tres decisiones que hay que tomar ANTES de codear:**

1. **¿Qué pasa cuando se agota?** Propuesta: **lo mismo que un Miss** — pierde un corazón y el ataque entra.
   Es consistente con el castigo que ya existe y no hay que inventar una regla nueva.
2. **¿Corre en la ronda 1?** Propuesta: **no**. Un jugador que ve las cartas por primera vez está leyendo, y
   castigarlo ahí enseña "este juego es injusto". Que arranque en la ronda 2.
3. **¿Sigue corriendo después de una carta equivocada?** Hoy `G.wrong` te deja reintentar. Propuesta: **el
   reloj NO se reinicia** — equivocarte cuesta tiempo, no solo un corazón.

**Archivos.**

| Archivo | Qué va | Ojo |
|---|---|---|
| `src/constants/COMBAT_PACING.js` | **nuevo**, tuyo. `CHOOSE_TIME_LIMIT`, `FIRST_TIMED_ROUND` | ⚠️ **NO** lo pongas en `TIMING.js`. Semánticamente iría ahí, pero es archivo compartido y la regla 3 de `conventions.md` lo prohíbe justamente para no chocar en el merge |
| `src/game/battle/battleLogic.js` | el conteo y el timeout | es tuyo, cero conflicto |
| la cuenta visible | un anillo o barra abajo de las cartas | ⚠️ `drawCards.js` **no está en el spec de nadie**. Avisá en el grupo antes de tocarlo |

**Las trampas.**

1. **El reloj no puede correr en `PROBLEM`.** Esa fase es el grito del jefe, antes de que se vean las cartas.
   Si arranca ahí, el jugador pierde segundos sin poder hacer nada.
2. **Nada de `setTimeout`.** El tiempo se acumula con `G.t` y `dt` dentro del loop, como el resto del motor.
   Un `setTimeout` sigue corriendo si el jugador aprieta `R` y reinicia.
3. **Cero updates del store por frame.** La cuenta se dibuja en el canvas, no en React. Está en la regla 4 de
   `conventions.md` y es el bug de rendimiento más caro del proyecto.

**Verificación.**

- [ ] La cuenta arranca cuando aparecen las cartas, no antes.
- [ ] Al agotarse se pierde un corazón y el ataque entra, igual que un Miss.
- [ ] La ronda 1 no tiene reloj.
- [ ] `R` reinicia y el reloj queda limpio.
- [ ] El combate sigue jugable de punta a punta.

---

## T-3 · "El jefe debe tener mucha vida" — NO como está pedido

**El jefe no tiene vida.** No existe ninguna variable de HP en el motor. El combate termina cuando la **barra
especial** llega a 100:

```
PERFECT_GAIN: 25    →  4 perfects y ganaste
GOOD_GAIN:    12    →  ~9 goods
SPECIAL_MAX:  100
```

Y hay exactamente **4 rondas** definidas en `ROUNDS.js`. Si el combate se alargara, el motor **repite los
mismos 4 problemas** (`extraRound` en `battleLogic.js`). O sea: más duración = los mismos 4 conceptos otra
vez. No enseña nada nuevo y aburre. **Va en contra de T-2**, que busca que el combate sea rápido y tenso.

Además la barra de vida del jefe es el spec **`boss-health-bar`, de Jennifer**, y vive en `drawHUD.js`.

**Lo que probablemente sea el problema real:** el combate termina rápido y no se siente una pelea de jefe.
Tres formas de arreglar ESO:

| Opción | Qué cuesta | Quién |
|---|---|---|
| **a)** La barra de Jennifer ya hace que se SIENTA vida. Bajando de a poco cuenta la historia de una pelea larga sin alargarla | **cero**, ya está en su spec | Jennifer |
| **b)** Bajar `PERFECT_GAIN` a ~17 → hacen falta 6 bloqueos en vez de 4 | un número, pero `TIMING.js` es compartido | Jorge |
| **c)** Sumar la 5ª característica de NIST, **Measured Service**, como 5ª ronda real | una ronda nueva + una carta | Jorge (arte) + quien tome la ronda |

**Recomendación: (a), y (c) solo si sobra tiempo.** La (c) es la única que alarga el combate **sin repetir**,
y `CLOUD_QUEST.md` §4 ya la deja anotada como alternativa. La inflación de vida no, en ningún caso.

---

## Prioridad, con el reloj en la mano

Es sábado 25. Se entrega el lunes 27. **El deploy en Vercel y el video de 5 minutos están en cero**, y son
entregables obligatorios.

| Orden | Tarea | Por qué |
|---|---|---|
| 1 | **T-2** (5 segundos) | es la que más cambia el juego. Sin presión no hay diversión |
| 2 | **T-1** (typewriter) | barato, vistoso, cero riesgo, todo en archivos propios |
| 3 | T-0 (una frase) | 2 minutos |
| — | T-3 | no es de Osvaldo, y no como está pedido |

**Si hay que elegir una sola, es T-2.** Y ninguna de las dos vale más que tener el deploy andando: un juego
divertido que el jurado no puede abrir vale cero.
