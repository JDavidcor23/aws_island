# Tareas — Tutorial Guiado + Revancha

**Rama:** `feature/tutorial-revancha` · Leé [`design.md`](./design.md) antes de empezar.

> **El orden importa.** Está armado para que el valor entre primero y el riesgo al final. Las tareas 1-8
> arreglan el problema reportado (las cartas no dicen qué hacen, el tutorial no guía) y **dejan el juego
> jugable**. Las 9-14 son la reestructuración del ritmo, que toca el nervio del combate.
>
> **Si el tiempo se termina, se corta después de la 8.** Ver la línea de corte más abajo.

---

## Bloque A — Constantes y datos (sin riesgo, no cambia comportamiento)

- [ ] **1. Crear `src/constants/PHASES.js`**
  `PHASES` con `TUTORIAL` y `REMATCH`, y `PHASE_CONFIG` con las **siete** claves de cada fase, copiado tal
  cual de `design.md` §1. Nadie lo consume todavía. _(Req 1.2)_

- [ ] **2. Ampliar `src/constants/CARDS.js`**
  Agregar `es`, `what` y `blocks` a `ela`, `self`, `net` y `pool`, con los textos de `design.md` §2.
  **No tocar `label` ni las claves** — `label` lo dibuja `drawCards.js:55` y las claves son las de
  `ASSETS_MANIFEST`. _(Req 2.1)_

- [ ] **3. Crear `src/constants/CARD_INFO.js`**
  Geometría del panel (recuadro centrado sobre 640×360), geometría del badge `?`, colores, y los textos
  fijos: etiqueta `BLOQUEA:`, cómo cerrar el panel, y `GATE_HINT` (el aviso del mentor del problema 1).
  Cero valores mágicos suelto en el render. _(Req 2.5, 3.2 · convención 2)_

- [ ] **4. Ampliar `src/constants/GAME_STATES.js`**
  Agregar `TUTORIAL_CLEAR` y `REMATCH_INTRO`. Solo las claves; nadie las usa todavía.

- [ ] **5. Ampliar el estado inicial en `GameEngine.js`**
  En `createInitialState()`: `phase`, `tutorialDone`, `order`, `infoCard`, `infoSeen`, según `design.md` §3.
  ⚠️ `order: [0, 1, 2, 3]` **no es opcional** — trampa 4. _(Req 1.1)_

**Verificación del bloque A:** `npm run dev` levanta y el juego se juega exactamente igual que antes.
Nada cambió todavía.

---

## Bloque B — Panel de información (el arreglo del problema reportado)

- [ ] **6. Crear `src/game/render/drawCardInfo.js`**
  Velo sobre el canvas + recuadro con `es`, `label`, `what` (con `wrapText`), `blocks` destacado y la línea
  de cierre. **Fallback obligatorio:** si falta `what` o `blocks`, dibuja lo que hay y no revienta.
  Se dibuja en canvas — nada de DOM. _(Req 2.5, 2.7, 2.8, 8.6 · convenciones 5 y 9)_

- [ ] **7. Badge `?` en `drawCards.js`**
  Dibujar el badge en cada carta y exportar `cardInfoBadgeAt(x, y) → índice | -1`, con la geometría de
  `CARD_INFO.BADGE`. _(Req 2.2)_

- [ ] **8. Abrir y cerrar el panel**
  En `battleLogic.js`: `openCardInfo` y `closeCardInfo` (`design.md` §4).
  En `GameEngine.js`: el bloque de `G.infoCard` en `handleKeyDown` (después de `R`, antes de `CHOOSE`), la
  tecla `I` dentro de `CHOOSE`, el guard en `handleMouseMove`, y en `handleMouseDown`
  **`cardInfoBadgeAt(x, y, G.sel)` antes de `cardIndexAt`** — trampas 3 y 5. El tercer argumento no es
  opcional: sin él el badge de la carta apuntada deja de responder, sin error.
  En `draw()`: `if (G.infoCard) drawCardInfo(this)` justo después de `drawCards(this)`.
  **`ESPACIO` y `ENTER` NO cierran el panel** — solo `I`, `Escape` y el clic. Ver el aviso de `design.md` §5:
  si cerraran, el segundo `ESPACIO` (o el auto-repeat del teclado) confirmaría la carta que se estaba
  leyendo y costaría un corazón.
  **`openCardInfo` no mueve `G.sel` si la carta está en `G.wrong`.** Inspeccionar una carta ya descartada
  dejaría la selección en una carta que `pickCard` rechaza en silencio: sin marco, sin sonido, y `ESPACIO`
  sin efecto. _(Req 2.3, 2.4, 2.6)_

- [ ] **10. El tutorial deja de castigar** ← va ANTES de la 9 a propósito, ver la línea de corte
  `pickCard`: `if (cfg.loseHeartOnWrong) loseHeart(engine); else sfxService.wrong()`.
  `updateChooseTimer`: leer el límite de `PHASE_CONFIG` y salir temprano si es `null` — **quitar** el guard
  `G.round < COMBAT_PACING.FIRST_TIMED_ROUND`.
  `drawCards.js`: dibujar el temporizador solo si el límite no es `null`, y usar ese límite en el arco y en
  el número. `TIMEOUT_WARN_THRESHOLD` sigue viniendo de `COMBAT_PACING`.
  `drawCardInfo.js`: cuando la fase TIENE límite de tiempo, redibujar los segundos restantes **por encima
  del velo** — trampa 6. El velo tapa el temporizador, y en la revancha el reloj sigue corriendo mientras
  leés (Req 5.9): sin esto, corrés contra un reloj que no ves. _(Req 4.1, 4.2, 5.3, 5.9)_

**Verificación del bloque B:** en `CHOOSE`, `I` abre el panel de la carta seleccionada y clic en `?` abre el
de esa carta **sin elegirla**. `I`, `Escape` o un clic lo cierran, con la misma carta seleccionada. `ESPACIO`
con el panel abierto no hace nada y **no confirma la carta al cerrarse**. `R` sigue funcionando con el panel
abierto. Y lo más importante: **leer las 4 cartas en el tutorial no cuesta un solo corazón.**

---

### ✂️ LÍNEA DE CORTE

**Si la entrega aprieta, se corta acá y se pide merge.** Lo entregado ya resuelve lo que se reportó jugando:
las cartas explican qué hacen y qué ataque bloquean, y el jugador puede razonar antes de apostar un corazón.
El juego sigue siendo una sola pelea, como hoy.

> ⚠️ **La tarea 10 está de este lado del corte, y no es negociable.** Sin ella el tutorial conserva el timer
> de 5s de `COMBAT_PACING` en los problemas 2, 3 y 4, y el velo del panel tapa la cuenta regresiva: abrir la
> info a leer cinco renglones cuesta un corazón, tres veces, sobre cuatro corazones. El feature entregaría
> exactamente lo contrario de su premisa — castigar al que lee. Cortar en la 8 pelada **no es una entrega
> válida.**

---

## Bloque C — La pelea tutorial guiada

- [ ] **9. Brillo guía y gate de información**
  En `drawCards.js`: marco dorado pulsante + `▼` sobre la carta `currentRound(G).ans`, **solo** si
  `PHASE_CONFIG[G.phase].guidedFirstProblem && G.round === 0`. Antes del marco de selección.
  En `pickCard`: el bloque de gate de `design.md` §4 — la carta correcta no se confirma si su info no se
  consultó. _(Req 3.1, 3.2, 3.3, 3.4, 3.5)_

**Verificación del bloque C:** en el problema 1 la carta correcta brilla y no se puede confirmar sin leer su
info; el mentor lo avisa. Problemas 2-4 sin brillo.

---

## Bloque D — El ritmo y la revancha (el bloque de riesgo)

- [ ] **11. `endRound` + `needsExplain` + `currentRound` por `order`**
  En `battleLogic.js`, tal cual `design.md` §4. `startRound` limpia **`lastResult` y `infoCard`** —
  trampas 1 y 2. El caso `EXPLAIN` de `advance()` queda en una línea: `endRound(engine)`.
  En `GameEngine.update()`: `RESOLVE` bifurca con `needsExplain`.
  En `GameEngine.setState()`: agregar `this.G.infoCard = null` como primera línea — **trampa 6**. Limpiarlo
  solo en `startRound` no alcanza: el camino del timeout no pasa por ahí. _(Req 4.4, 4.5, 5.6, 5.7, 5.10)_

- [ ] **12. Auto-avance de `PROBLEM` y velocidad por fase**
  En `GameEngine.update()`: el bloque de `problemNeedsSpace`.
  En `battleLogic.js`: `attackSpeed` multiplicado por `atkSpeedMult`. _(Req 5.5, 5.8)_

- [ ] **13. Las dos pantallas nuevas**
  Crear `src/game/render/drawPhaseScreens.js` con `drawTutorialClearScreen` y `drawRematchIntroScreen`
  (reusan `drawDialogue` y `drawTextOutlined`, sin arte nuevo). Textos en `UI_TEXTS.js`.
  Registrarlas en `SCREEN_DRAWERS` y sumar ambas a `NO_HUD_STATES`.
  Agregar sus dos casos a `advance()`. _(Req 4.6)_

- [ ] **14. `beginRematch` y `reset()`**
  `beginRematch` en `battleLogic.js` (`design.md` §4): fase **antes** de `startRound`, corazones al máximo,
  especial y *perfects* en 0, `order` mezclado, `infoSeen` limpio.
  `reset()` en `GameEngine.js` preserva `tutorialDone` y cae en `REMATCH_INTRO`. _(Req 5.1, 5.2, 6.1, 6.2, 6.3)_

- [ ] **15. Acortar la introducción**
  `INTRO_SCENE.js`: `INTRO_LINES` de 5 líneas a 2, solo narrativa. Se van las que explican cartas, bloqueo y
  especial — eso ahora lo enseña la pelea tutorial.
  **No tocar nada más de la escena:** caminata, animación del mentor, salida, tecla de saltear y tipeo quedan
  igual. _(Req 7.1, 7.2, 7.3)_

---

## 16. Verificación final — los cinco caminos

Sin tests automatizados. `npm run dev` y jugar los cinco de la tabla de `design.md`:

- [ ] **Tutorial completo, todo bien** — gate en el problema 1 · sin brillo en 2-4 · sin timer · explica las
      4 veces · **no gana el juego** con 4 bloqueos perfectos → `TUTORIAL_CLEAR`
- [ ] **Tutorial errando cartas** — se descartan, corazones intactos en 4/4
- [ ] **Revancha limpia** — timer de 3s · `PROBLEM` no pide `ESPACIO` · **cero pantallas de explicación** ·
      orden de problemas distinto al del tutorial
- [ ] **Revancha errando** — explicación al fallar · corazón menos · 4 fallos → `DEFEAT`
- [ ] **`R` en cada pantalla** — antes del tutorial vuelve al inicio · después cae en `REMATCH_INTRO` y
      **nunca** al tutorial · panel cerrado
- [ ] **Clic en `?`** abre info y no elige carta, en las dos fases
- [ ] Cero `console.log` · cero valores mágicos nuevos fuera de `src/constants/`
- [ ] El combate se juega de punta a punta sin romperse _(Req 8.1 a 8.5)_
