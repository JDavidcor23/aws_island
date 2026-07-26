# Memoria del proyecto — Cloud Quest / Isla 0

> Exportado de [Engram](https://github.com/Gentleman-Programming/engram) el 2026-07-26.
> Son las decisiones, los bugs y los descubrimientos que se fueron acumulando trabajando en este repo.
>
> **Para levantarlo en tu propio agente:** `engram import .engram/aws_island.json`
> **Para leerlo sin instalar nada:** este archivo.
>
> No está atado a ningún agente. Engram habla MCP, así que el import sirve igual en Claude
> Code, OpenCode, Codex, Gemini CLI, Cursor, Windsurf o Kiro. Y si no querés instalar nada,
> este markdown se lee solo.
>
> Contiene solo observaciones de este proyecto y de scope `project`. Nada personal, nada de
> otros repos, y ningún prompt.


## Arquitectura (5)

### Construido prototipo jugable del combate principal de Cloud Quest

*2026-07-24*

**What**: Prototipo completo del combate por turnos de Cloud Quest en un solo `index.html` (Canvas 2D vanilla, 640x360 pixelado, sin dependencias). Máquina de estados: TITLE → INTRO → PROBLEM → CHOOSE → TIMING → RESOLVE → EXPLAIN → FINISH_LINE → FINISH_ANIM → VICTORY/DEFEAT.

**Why**: El usuario necesitaba presentar el gameplay principal YA (demo del hackatón). El doc maestro CLOUD_QUEST.md define Godot 4 como motor final, pero para la demo inmediata se eligió HTML+Canvas: corre en navegador sin instalar nada. Se sirve con `python -m http.server 8377`.

**Where**: `index.html` en la raíz del proyecto. Usa assets de `assets/art/_gameready/` (rutas relativas).

**Learned**:
- FEEDBACK CLAVE del usuario que CAMBIÓ la mecánica de timing: en vez de un anillo abstracto que se cierra, el jefe LANZA un ataque visible (orbe rojo) que viaja hacia el héroe y el jugador lo BLOQUEA con la carta elegida en el momento justo (círculo de bloqueo frente al héroe). Si bloquea bien, el ataque SE REFLEJA de vuelta al jefe. Perfect ±16px = +25 especial, Good ±42px = +12, Miss = -1 corazón.
- Las cartas van ABAJO, chicas (58x81), SIN tapar la escena — el usuario rechazó el overlay a pantalla completa.
- Nombres de cartas: texto blanco con contorno DEBAJO de cada carta (alternando altura para que no se toquen); el banner interno de las cartas es ilegible a ese tamaño.
- La barra especial (special_bar.png) se dibuja llena por diseño: para mostrar progreso se tapa la parte vacía con rect oscuro sobre el gauge (área interna ≈ x 15.5%-96.5%, y 22%-80% del PNG).
- HUD se oculta en TITLE, DEFEAT y VICTORY para no tapar textos.
- Playwright MCP bloquea file:// — siempre servir por HTTP local. Sus screenshots con filename relativo caen en la RAÍZ del proyecto.
- Flujo verificado end-to-end con Playwright: miss path, perfect block + reflect, finisher y victoria con transición de isla.

### Migrado Cloud Quest a React+Vite con motor JS puro y fixes de rendimiento

*2026-07-24 · `architecture/react-migration`*

**What**: Migración completa del prototipo canvas a Vite + React 19 + JavaScript + Zustand, siguiendo las convenciones del usuario (carpeta agents/): componente = solo JSX, lógica en use*.hook.js, CSS por componente, constantes UPPER_SNAKE en src/constants/, Zustand granular solo desde hooks.

**Why**: El usuario reparte tareas a un equipo y exigió React.js con JavaScript (no TS) y cero Python (Vite dev server).

**Where**: src/ completo. GameEngine.js (clase, rAF loop), game/battle/ (battleLogic, attack), game/render/ (drawScene/HUD/Cards/Attack/Screens, textHelpers), game/fx/effects.js, services/ (assets con prerender, sfx WebAudio), stores/useGameStore.store.js, components/GameCanvas/, pages/BattlePage/. Prototipo original preservado en prototype/index.html (backup demo, abre con doble clic). Assets copiados a public/assets/art/_gameready/. README.md con arquitectura + tareas para el equipo.

**Learned**:
- Frontera React/motor: el motor muta engine.G por frame y solo notifica eventos discretos (onScreenChange → store). El hint de BattlePage cambia por pantalla — verificado que la sincronización funciona.
- Fix de rendimiento (queja "se siente lento/smooth"): eliminados shadowBlur y ctx.filter por frame; reemplazados por sprites pre-renderizados (makeWhiteSprite para flash del jefe, makeGlowSprite para halos del orbe) y marco+tinte para la carta seleccionada. Tempo subido: windup 0.45s, orbe base 250px/s, RESOLVE 0.75s.
- Todos los números de "feel" viven en constants/TIMING.js — tunear ahí, no en el código.
- window.__CLOUD_QUEST__ expuesto solo en DEV para depuración/E2E.
- Verificado end-to-end con Playwright en localhost:5173: perfect block + reflect, explicación, finisher, victoria (con HMR de Vite funcionando).
- React StrictMode doble-monta el hook: el engine se crea/destruye dos veces en dev — destroy() cancela el rAF, sin fugas.

### Construido mapamundi caminable con Isla 0 en dos estados

*2026-07-25 · `architecture/overworld-map`*

**What**: Overworld top-down caminable (grafo de 9 nodos) como pantalla propia, con la Isla 0 en dos estados de arte: oxidada antes de ganar, revivida despues. Flujo: titulo -> mapa -> combate -> victoria -> mapa revivido.

**Why**: El usuario pidio un "playable overworld map" estilo Super Mario World, no una ilustracion estatica. Rechazo dos imagenes generadas (a1_island_path y scene_world_map). Despues objeto que la Isla 0 del mapa no cuadraba con el arte real de la isla, y eligio la opcion de nodo con dos estados para que la transformacion de CLOUD_QUEST.md 6.7 se vea EN EL MAPA y no solo en la pantalla de victoria.

**Where**:
- src/constants/OVERWORLD.js (nodos, aristas, manifest propio OVERWORLD_ASSETS, config)
- src/constants/OVERWORLD_TEXTS.js, src/constants/APP_ROUTES.js
- src/game/overworld/OverworldEngine.js + render/drawOverworld.js + render/pixel.js
- src/pages/OverworldPage/ (jsx, css, hook)
- src/useApp.hook.js + src/App.jsx (ruteo)
- src/services/assets.service.js (loadFrom para manifests alternativos)
- scripts/clean_overworld_plate.py (post-proceso del PNG)
- public/assets/art/_gameready/scene_overworld_map.png, island0_before.png, island0_after.png

**Learned**:
1. DECISION CLAVE: el camino punteado se dibuja en CODIGO, no viene en el PNG. El punteado generado venia roto (dos cadenas cortadas, la isla jugable sin salida). Con el camino en codigo, la ruta que ve el jugador y el grafo por el que camina el heroe salen del mismo dato y no se pueden desincronizar. Las coordenadas de los nodos son centros de bounding boxes MEDIDOS con deteccion de blobs sobre el PNG, no a ojo.
2. GOTCHA de borrado de puntos por color: cada punto es nucleo casi blanco (253,252,232) con halo que se degrada hasta el azul del agua. Filtrar por color borra el nucleo y DEJA el halo, que se ve como un punto mas chico. Fallo tres veces. Solucion: clasificar la mancha conexa COMPLETA por luminancia media (clara=camino, oscura=roca) + dilatar 2px. Relleno copiado de la MISMA fila porque el oceano tiene bandeado horizontal.
3. GOTCHA de acarreo de input entre pantallas: el ESPACIO que salta de victoria al mapa lo recibia TAMBIEN el mapa recien montado y entraba de una a la isla, asi que el mapa nunca se veia. Se arregla con OVERWORLD.INPUT_LOCK (0.3s) que arranca al terminar de cargar assets, no en el constructor (antes de cargar no corre el loop y no habria nada que lo descuente).
4. La costura con el motor de combate es de SOLO LECTURA: useApp lee screen y phase del store. Cero lineas nuevas en GameEngine, battleLogic, drawScreens ni ASSETS_MANIFEST -- que son los archivos del spec intro-tutorial de otro dev. El mapamundi tiene su propio manifest para eso.
5. Del titulo al mapa se detecta por phase===INTRO en vez de tocar el motor.
6. Para arte con dos estados que deben leerse como el MISMO lugar, generar los dos sprites en UNA sola corrida de codex con instruccion explicita de silueta y posiciones identicas. Generarlos por separado da dos islas distintas.
7. Al testear con Playwright hay que esperar el ENTER_DELAY de 0.4s del fogonazo: dos pruebas dieron falso negativo por pegarle al motor ya destruido.
8. PENDIENTE de arte: en island0_after la torre blanca y la torre de agua se leen como losas blancas en blanco. Es el arte mas flojo en pantalla.

### Definido concepto visual de Isla 0 y corregido postprocess.py

*2026-07-25 · `architecture/concepto-isla-0`*

**What**: Se escribio .kiro/specs/CONCEPTO_ISLA_0.md (7 elementos fijos + paletas pareadas) y se regeneraron las 6 vistas de la Isla 0 desde ese concepto: scene_island_before/after, scene_battle_arena, scene_island_path, island0_before/after. Se corrigio scripts/postprocess.py con 3 bugs que degradaban todo el arte.

**Why**: El usuario objeto que "donde venzo al boss es una cosa y cuando se libera es otra". Diagnostico real: cada asset se habia generado con un prompt INDEPENDIENTE, asi que eran cuatro mundos distintos y no cuatro vistas del mismo lugar. No compartian ni un punto de referencia. El usuario autorizo cambiar todos los paisajes, arena incluida, tras advertirle el riesgo.

**Where**:
- .kiro/specs/CONCEPTO_ISLA_0.md (nuevo, el contrato de arte)
- scripts/gen_isla0.sh (las 3 corridas de codex, versionado)
- scripts/check_arena.py (gate de LAYOUT.js)
- scripts/postprocess.py (corregido)
- .kiro/specs/ASSETS.md (A-8, A-9, A-10; A-7 marcado como reemplazado)
- public/assets/art/_gameready/ (las 6 imagenes)

**Learned**:
1. EL TRUCO QUE HIZO FUNCIONAR LA CONTINUIDAD: el Legacy Server no desaparece al ganar, queda su ESQUELETO tomado por el verde, y las tuberias siguen cruzando el mismo suelo, ahora limpias. La silueta es identica antes y despues, asi que es imposible no reconocer el lugar. Y narra mejor que borrarlo: no destruiste el pasado, lo superaste, que es la tesis del juego. Sin esto el "after" se lee como demolicion.
2. Los pares antes/despues se generan SIEMPRE en la misma corrida de codex, con instruccion explicita de silueta y posiciones identicas. Por separado da dos islas distintas.
3. postprocess.py tenia 3 bugs que degradaban TODO asset: (a) method=MEDIANCUT corta por poblacion y los colores minoritarios desaparecen -- el terracota de los techos quedaba marron; se cambio a MAXCOVERAGE. (b) no pasaba dither, asi que PIL usaba Floyd-Steinberg por defecto y todo el arte anterior salio dithereado, que es ruido en pixel art; ahora dither=NONE. (c) hacia convert("RGBA") y guardaba sin optimize: 206 KB en RGBA contra 76 KB en modo paleta con los mismos 48 colores. Set entero de 2.43 MB a 1.03 MB.
4. GOTCHA de las imagenes generadas: vienen con decenas de miles de colores (scene_island_after salio con 133.786), gradientes y antialiasing disfrazados de pixel art. Hay que cuantizar SIEMPRE.
5. LECCION SOBRE TESTS AUTOMATICOS DE ESTETICA: escribi check_arena.py y se equivoco DOS veces. Primero medi "contraste de luminancia media entre fondo y jefe" y rechazo la arena que funciona (contraste 6.1) -- el jefe se lee por su contorno y los ojos rojos, no por luminancia media. Segundo, medi desvio estandar como "ruido" y rechazo la arena nueva (61.96) cuando en realidad el hueco palido liso que la hacia dar alto es JUSTO lo que silueta al jefe. La metrica correcta es energia de alta frecuencia (diferencia entre pixeles vecinos). MORALEJA: calibrar el test contra un caso conocido-bueno ANTES de confiar en el, y dejar el juicio estetico al montaje visual.
6. La arena es fondo de juego, no ilustracion: check_arena.py monta el jefe a 192px en (320,196) y el heroe a 96px en (78,292) y compara contra una referencia. La arena nueva quedo MEJOR: menos detalle detras del jefe (7.82 vs 9.72) y piso mas plano (11.18 vs 26.23).
7. PENDIENTE PREEXISTENTE, no lo introdujo este cambio (verificado con la imagen vieja): en la pantalla de victoria el texto blanco de los stats y la linea "Isla 1: EC2 -- Proximamente" casi no se leen sobre el fondo brillante. El arreglo va en drawScreens.js, archivo del spec intro-tutorial, asi que lo decide su owner.

### Reestructuró Cloud Quest en dos fases: tutorial guiado + revancha

*2026-07-26 · `architecture/tutorial-revancha`*

**What**: Se partió el combate de Cloud Quest en dos peleas contra el mismo jefe usando un eje `G.phase` (TUTORIAL | REMATCH) ORTOGONAL a `G.state`. Todo lo que difiere entre fases se lee de una única tabla `PHASE_CONFIG` (7 claves) en `src/constants/PHASES.js`. Cero pantallas duplicadas.

**Why**: El usuario reportó jugando que el juego "es divertido pero aburrido": el tutorial eran 5 líneas de diálogo del pingüino y después el juego entero de golpe, con interrupciones cada ronda. Y las cartas solo tenían un label en inglés (`ela: { label: 'Rapid Elasticity' }`), sin decir qué hacen — imposible razonar qué carta usar. Modelo pedido: Mortal Kombat (pelea de práctica, la ganás, empieza el juego real).

**Where**: Spec en `.kiro/specs/tutorial-revancha/` (requirements + design + tasks). Nuevos: `constants/PHASES.js`, `constants/CARD_INFO.js`, `render/drawCardInfo.js`, `render/drawPhaseScreens.js`, `render/drawDialogue.js`. Modificados: CARDS, GAME_STATES, INTRO_SCENE, UI_TEXTS, battleLogic, drawCards, drawScreens, GameEngine. Rama `feature/tutorial-revancha`.

**Decisiones de diseño no obvias**:
- El brillo guía aparece UNA sola vez (problema 1) y su trabajo NO es dar la respuesta: es enseñar que el panel de info existe. Brillar en los 4 problemas mata el aprendizaje (el jugador sigue la luz).
- La revancha solo interrumpe con EXPLAIN si el jugador falló (`needsExplain`). El que sabe nunca se frena.
- El panel de info es un FLAG (`G.infoCard`), no un GAME_STATE nuevo: se dibuja encima de CHOOSE. Así el timer de la revancha sigue corriendo mientras leés (aprender tiene valor mecánico) sin agregar transiciones que puedan trabar el juego.
- `beginRematch` es el ÚNICO camino a la fase 2, para que no haya dos lugares inicializando corazones/especial.
- `ESPACIO` y `ENTER` NO cierran el panel: ESPACIO ya avanza/bloquea/confirma, y si cerrara, el segundo ESPACIO (o el auto-repeat del teclado) confirmaría la carta que estabas leyendo y costaría un corazón.

**Learned — 7 trampas que no dan error en consola** (documentadas en design.md):
1. `G.lastResult` se escribía en `timingPress` y NUNCA se limpiaba. `needsExplain` lo lee → un miss en la ronda 1 hacía que la revancha frenara en TODAS las rondas siguientes. `startRound` lo pone en null.
2. `G.infoCard` sobreviviendo al cambio de ronda deja el panel pintado sobre PROBLEM y se come todo el input.
3. El badge `?` vive DENTRO del rectángulo de `cardIndexAt`, así que en `handleMouseDown` hay que chequear `cardInfoBadgeAt` PRIMERO o el clic en `?` elige la carta.
4. `G.order` sin inicializar revienta desde una función de DIBUJO (`currentRound` la llaman 3 renders), y el stack apunta al render en vez de al estado.
5. `cardInfoBadgeAt(x, y, selectedIndex)` toma TRES argumentos. Sin el tercero, el badge de la carta apuntada se separa 10px de su área de clic (las cartas se dibujan con `SELECTED_LIFT = 10` cuando están seleccionadas) y deja de responder, sin error.
6. `updateChooseTimer` saca de CHOOSE con `setState(RESOLVE)` sin cerrar el panel. Se arregla en `setState()` (único punto de paso), NO en `startRound`: el camino del timeout no pasa por ahí.
7. `advance()` disparaba FINISH_LINE con el especial lleno sin mirar la fase. Cuatro bloqueos perfectos dan 100 exactos → un jugador bueno se salteaba la revancha entera ganando en el tutorial. Lo tapa `specialTriggersFinisher: false`.

**Learned — el bug de severidad que medí mal**: el velo del panel (alpha 0.78) TAPA el temporizador. Con el timer de 5s que había en los problemas 2-4, leer la ficha costaba un corazón tres veces sobre cuatro. La "línea de corte" del plan de tareas quedaba en un estado que entregaba lo CONTRARIO a la premisa del feature (castigar al que lee), así que hubo que mover la tarea 10 antes del corte. `drawCardInfo` ahora redibuja los segundos por encima del velo.

## Decisiones (3)

### Constraint: Cloud Quest migra a React.js + JavaScript, sin Python

*2026-07-24*

**What**: El usuario decidió que Cloud Quest se desarrolla en React.js con JavaScript (explícitamente NO TypeScript) y sin tooling Python (nada de http.server; dev server JS → Vite). El prototipo canvas vanilla de index.html se migra a esa estructura.

**Why**: Va a trabajar con un equipo y necesita repartir tareas sobre una base organizada. Validó el prototipo en su presentación y quedó conforme con la mecánica.

**Where**: Todo el proyecto hackaton_aws.

**Learned**:
- Queja de rendimiento en el prototipo: animaciones "lentas/muy smooth" → causa probable: shadowBlur y ctx.filter por frame en Canvas 2D (muy costosos) + tempo bajo (orbe 190px/s, bobs suaves). En la migración: glows pre-renderizados, sin filter por frame, tempo más seco.
- Arquitectura acordada a proponer: React solo como shell (pantallas/HUD), motor del juego en módulos JS puros con requestAnimationFrame — nunca setState por frame.
- El usuario tiene una convención propia de estructura de proyectos que ofreció compartir — preguntada antes de scaffoldear.

### Revancha: la vida del jefe ahora espeja la barra especial

*2026-07-26*

**What**: En fase REMATCH la barra de vida del jefe pasó a ser el espejo invertido de `G.special` en vez de un contador de rondas, y `GOOD_GAIN` subió de 12 a 20. Nuevo flag `bossHpMirrorsSpecial` en PHASE_CONFIG (false en TUTORIAL, true en REMATCH).

**Why**: Reportado jugando: "no veo que yo lance los poderes". Diagnóstico: las rondas de la revancha ciclan sin límite hasta que el especial se llena, pero `chunksLost` está topeado en `SEGMENTS-1`, así que la barra del jefe quedaba congelada en 1/4 mientras el jugador seguía bloqueando sin ninguna señal de avanzar. Con GOOD_GAIN=12 hacían falta 9 bloqueos para el remate.

**Where**: src/game/render/drawBossHealth.js, src/constants/PHASES.js, src/constants/TIMING.js, src/game/battle/battleLogic.js (float "¡BARRA LLENA — REMATE LISTO!" en timingPress + reset de bossHpDisplay en beginRematch), src/game/render/drawHUD.js (¡MAX! → ¡REMATE!)

**Learned**: Verificado por simulación con la lógica real: 4 PERFECT → remate en el bloqueo 4 con la barra cayendo 75/50/25/0; 4 GOOD + 1 → remate en el bloqueo 5; y el guard `specialTriggersFinisher: false` del tutorial sigue firme (4 perfects van a TUTORIAL_CLEAR, no rematan). Ninguna combinación llena la barra en menos de 4 rondas porque el máximo por ronda es 25 — el remate no puede comerse contenido del juego. Trampa encontrada: la rama de FINISH_ANIM forzaba `targetHp = 1/SEGMENTS`, que con el espejo haría SUBIR la barra al arrancar el remate; ahora es 0 y el lerp arrastra desde donde esté. Segunda trampa: `beginRematch` tiene que olvidar `G.bossHpDisplay` o la barra entra a la revancha con el 25% del tutorial y se ve rellenándose sola.

### El brillo de la carta correcta pasó a las 4 rondas del tutorial (revierte el spec)

*2026-07-26 · `decision/tutorial-brillo-4-rondas`*

**What**: `guidedFirstProblem` se renombró a `highlightAnswer` y perdió la condición `G.round === 0`: el brillo sobre la carta correcta ahora está en las cuatro rondas del tutorial y se apaga en REMATCH. Además `COMBAT_PACING.CHOOSE_TIME_LIMIT` pasó de 5 a 15 segundos (provisorio, a la baja).

**Why**: Pedido explícito del usuario: "no solo es que me sugiera la primera tarjeta, es todas las tarjetas. Ya cuando ves al boss, ahí sí se acaban las sugerencias". Y 3s (después 5s) no alcanzaban ni para leer las cuatro cartas.

**Where**: src/constants/PHASES.js, src/game/render/drawCards.js:75, src/constants/COMBAT_PACING.js, .kiro/specs/tutorial-revancha/requirements.md (sección del brillo + Requisito 3 reescritos)

**Learned**: Esto REVIERTE una decisión deliberada del propio spec, que tenía una sección con ⚠️ diciendo "La tentación es señalar la carta correcta en los 4 problemas. No se hace, y es deliberado". Se le planteó al usuario y lo reafirmó. El argumento que lo hace defendible: cuando se escribió esa sección el brillo era la ÚNICA ayuda; ahora viaja junto a `openInfoOnPick`, que obliga a abrir la ficha de cualquier carta antes de jugarla en todas las rondas. El brillo dice CUÁL y la ficha dice POR QUÉ. Costo aceptado y anotado en el spec: el tutorial ya no tiene ningún momento en el que el jugador resuelva algo solo.

⚠️ Deuda de documentación: `.kiro/specs/tutorial-revancha/design.md` (líneas ~66, 75, 85, 181, 437) y `tasks.md` (~101) siguen citando `guidedFirstProblem` y el gate viejo. requirements.md —que es el contrato— sí quedó actualizado.

## Bugs arreglados (2)

### Nieve fantasma en todas las pantallas: vapor del jefe pintado sobre la intro

*2026-07-26*

**What**: Las "partículas de nieve" que aparecían en el tutorial y en todas las pantallas eran el vapor ambiente del jefe. `drawBoss` empuja una partícula gris (`rgba(200,200,200,0.35)`, size 5) con probabilidad 0.06 por frame, y `GameEngine.draw()` llamaba a `drawBoss`/`drawHero` en TODOS los estados menos VICTORY y TITLE. En INTRO el jefe queda tapado por el fondo de la isla, pero el vapor se seguía emitiendo y `drawParticles` corre DESPUÉS del SCREEN_DRAWER — o sea, encima de la isla. Con GRAVITY=220 los cuadraditos caían y se leían como nieve.

**Why**: Reportado jugando: "hay partículas que se muestran en todas las pantallas, como si estuviera lloviendo nieve".

**Where**: src/game/GameEngine.js (nueva const `OWN_SCENE_STATES` = [TITLE, INTRO, VICTORY]), src/game/render/drawScene.js:57 (el emisor), src/game/render/drawIntroScene.js

**Learned**: El orden de `GameEngine.draw()` es la trampa: fondo → jefe/héroe → SCREEN_DRAWER → partículas → HUD. Cualquier pantalla que pinte su propia escena completa TIENE que estar excluida del bloque jefe/héroe, no solo porque es trabajo perdido, sino porque `drawBoss` tiene un efecto colateral (emite partículas) que sobrevive al repintado. Si mañana se agrega otra pantalla con escena propia, va en `OWN_SCENE_STATES`.

### El panel de carta es un modal y va al final de draw(), no pegado a drawCards

*2026-07-26*

**What**: `drawCardInfo` se movió del branch de CHOOSE al final de `GameEngine.draw()`, después del HUD y del flash, y fuera del `ctx.restore()` del shake. Y el hint del panel se movió de 12px POR DEBAJO del panel a 14px por dentro de su borde inferior (`GAP.hintBelow` → `GAP.hintInside`).

**Why**: Reportado con captura: la barra de vida del jefe se dibujaba encima del título de la carta, y había cuadraditos grises (vapor ambiente del jefe) cayendo adentro del recuadro. Además el hint pisaba la fila de cartas.

**Where**: src/game/GameEngine.js (draw), src/game/render/drawCardInfo.js (GAP + posición del hint)

**Learned**:
1. **No era un problema de coordenadas, era de ORDEN.** El panel estaba justo después de `drawCards`, y después de ese punto `draw()` todavía dibuja partículas, HUD, barra del jefe y textos flotantes — todo eso caía encima del velo. Un modal va último o no es un modal. Las tres cosas rotas eran el mismo bug.
2. Lo destapó un cambio propio: al crecer el panel de 200 a 268px de alto, `py` bajó de 80 a 46 y el título pasó a y=74, justo en la banda de la barra del jefe (y 66..78). Antes había solape cero por casualidad, no por diseño.
3 Medido después del fix: panel 440x268, py=46, borde inferior 314, hint en 300, el contenido más largo (`ela`) termina en 283 → 17px de aire. Los dos hints entran en los 400px internos.
4. **Trampa de verificación:** mi primer test asertaba "el hint no pisa la banda vertical de las cartas" y daba ❌ correctamente pero por un invariante equivocado. El panel se rellena con `COLORS.panel` opaco antes de escribir, así que cualquier cosa adentro tapa las cartas por definición. El invariante bueno es "el hint cae dentro del rect opaco". Preguntar por las cartas solo tenía sentido cuando el hint vivía afuera, sobre el velo semitransparente.
5. Script de verificación: `verify-panel-layout.mjs` en el scratchpad, corre con `node --import ./register.mjs`.

## Patrones y convenciones (1)

### Implementada la historia de la Isla 0: 3 archivos, todo texto

*2026-07-26 · `decision/historia-isla-0`*

**What**: Spec de `historia-isla-0` implementado y verificado. Cambios: `INTRO_LINES` pasó de 2 a 6 líneas (on-premise + legacy + Amazon, sobre el pueblo enfermo que ya estaba dibujado); nuevo `UI_TEXTS.TUTORIAL_CLOUD_REVEAL` que se muestra solo en el EXPLAIN de la ronda 0 del tutorial; `VICTORY_PAYOFF` y `VICTORY_NEXT_ISLAND` reemplazan "Bienvenido al mundo Cloud." y el pie de Isla 1; `DEFEAT_TITLE`/`DEFEAT_STAKE` cambian la derrota para que duela por el pueblo y no por el servidor. Borrado `UI_TEXTS.INTRO_MENTOR` (estaba muerto).

**Why**: El juego arrancaba sin apuesta y decía "nube" 4 veces sin explicarla nunca. Premisa aprobada: novato mandado por Amazon, Isla 0 = campo de entrenamiento. Audiencia: chico de 8-12.

**Where**: src/constants/INTRO_SCENE.js, src/constants/UI_TEXTS.js, src/game/render/drawScreens.js (único import nuevo del cambio: PHASES). Spec en .kiro/specs/historia-isla-0/design.md.

**Learned**:
1. **Verificado midiendo las constantes REALES importadas de los archivos**, no copias del borrador: las 6 líneas de intro dan 3/4 renglones cada una; el reveal de la nube da 3/4 con prefijo de acierto y 4/4 con prefijo de error; los textos sueltos de victoria/derrota entran en 640px. Y se confirmó por código que `INTRO_MENTOR` ya no existe, que "AWS" no aparece en ningún texto y que "Amazon" aparece exactamente 2 veces.
2. **Descubrimiento no buscado: la ronda 4 (pool) ya estaba en 4/4 renglones con el prefijo de error**, desde antes de este cambio. O sea que el techo de la caja ya se estaba tocando con contenido preexistente. Cualquier texto nuevo en `ROUNDS[3].expl` o en `EXPLAIN_MISS_PREFIX` desborda.
3. El script de verificación vive en el scratchpad (`verify-historia.mjs`) y necesita un resolver de extensiones: el proyecto importa sin `.js` (lo resuelve Vite, Node no). El hook está en `ext-loader.mjs` + `register.mjs`, se corre con `node --import ./register.mjs`. Sirve para medir cualquier texto del juego sin buildear.
4. `G.round === 0` es válido durante el EXPLAIN del primer problema porque `endRound` incrementa después. Y los dos prefijos existentes alcanzan porque al EXPLAIN del tutorial solo se llega con la carta correcta (`pickCard` solo pasa a TIMING si acertás, y el tutorial no tiene timeout).

## Descubrimientos y trampas (6)

### Generación de sprites en hackaton_aws vía Codex CLI (motor de PixelForge)

*2026-07-24 · `hackaton_aws/art-generation-pipeline`*

What: Genero los sprites del juego (Cloud Quest, hackatón AWS) llamando el CLI de Codex directo — el mismo motor que usa PixelForge (ya NO usa PixelLab pese a que el código conserva esos nombres).

Comando (verificado funcionando): `codex exec --sandbox danger-full-access --skip-git-repo-check -m gpt-5.5 -- "<PROMPT>" < /dev/null`
GOTCHA CRÍTICO: hay que redirigir `< /dev/null` o codex se cuelga en "Reading additional input from stdin..." (es el equivalente al `child.stdin.end()` del route de PixelForge). Sin eso, cuelga hasta el timeout.

Prompt base de personajes (CODEX_BASE_PROMPT, se antepone): "Generate a 64x64 pixel art sprite, limited palette of max 16 colors, no anti-aliasing, transparent background, full body centered, retro 16-bit style. Subject: " + descripción corta del sujeto.

Salida: PNGs en $AI_OUTPUT_DIR = C:\Users\<usuario>\.codex\generated_images\<sesión>\call_*.png, ~1254x1254 RGB. Codex emite DOS por generación: una transparente (call_*-transparent.png) y una con fondo verde/sólido (cruda, para chroma key). Auth por ChatGPT.

Restricciones del pipeline: el prompt base es SOLO para personajes (full body centered). Fondos/escenarios y UI compleja necesitan prompt propio SIN la base. PixelForge solo downscalea a 64 o 128 (el jefe grande topa en 128).

Where: assets del proyecto en hackaton_aws/assets/art/{characters,ui,scenes,grid}. Script generador: scratchpad/gen_batch1.sh. Grillas copiadas de pixelforge/public/ai-guides.

Learned: héroe salió excelente al primer intento (niño pelo negro semi-anime, suéter blanco con recuadro naranja para pegar el logo AWS, jeans, botas, mochila). Estilo aprobado.

### Created hero walk sprite sheet

*2026-07-24*

**What**: Generated a six-frame right-facing walk-cycle sprite sheet from the hero side-idle reference and post-processed it into a transparent 6:1 PNG.
**Why**: User requested a single horizontal walk animation sheet preserving the existing character design and pixel-art constraints.
**Where**: assets/art/characters/06_hero_walk_right_6_sheet.png; source reference assets/art/characters/06_hero_side_idle_1.png
**Learned**: The image generation output included a checkerboard-like background and a 3:1 canvas, so it required local alpha cleanup and recomposition into six equal square cells (4344x724) with transparent gutters.

### Playwright entrega 1 fps de requestAnimationFrame

*2026-07-25 · `testing/playwright-raf-throttling`*

**What**: El navegador de Playwright entrega ~1 callback de requestAnimationFrame por segundo, aun cuando document.visibilityState es "visible" y document.hasFocus() es true. Medido: 1 frame en 1000ms.

**Why**: Importa mucho en este proyecto porque el juego entero corre sobre rAF (GameEngine y OverworldEngine). Cualquier verificacion que dependa de que pase tiempo simulado -- animaciones, transiciones, el fogonazo de entrada al nivel, la caminata del heroe entre nodos -- se cuelga o parece rota.

**Where**: Verificacion de la rama test/integracion, con el mapamundi y la escena de intro mergeados.

**Learned**:
1. SINTOMA: una transicion que deberia tardar 0.4s parecia no completarse nunca. enterFlash iba en 0.25 despues de 2 segundos reales. Con MAX_DT=0.05 clampeando cada frame, 1 fps significa que 1 segundo real avanza 0.05s de mundo: 20x mas lento.
2. Me hizo perder varios intentos diagnosticando un bug de producto que NO existia. Tres veces distintas en esta sesion un test dio falso negativo por timing y no por codigo.
3. DOS FORMAS DE EVITARLO:
   - Intercalar browser_take_screenshot entre acciones: fuerza un repintado y sube la tasa de frames. Es por esto que las primeras verificaciones si funcionaron.
   - Mejor y determinista: avanzar el motor a mano desde browser_evaluate, con un helper que llame motor.update(0.05) N veces, y despues motor.draw() antes de la captura. Prueba la LOGICA sin depender del renderer.
4. Verificar por estado y no por pixel: exponer el motor en window bajo import.meta.env.DEV (window.__CLOUD_QUEST__ y window.__CLOUD_QUEST_MAP__) y leer el estado, en vez de inferirlo de un screenshot.
5. GOTCHA relacionado: un motor destruido sigue respondiendo a setState y su callback onScreenChange todavia actualiza el store de Zustand. Si el test le pega al objeto viejo de window despues de un remount, dispara transiciones fantasma. Chequear siempre engine.destroyed antes de creerle a lo que leas.

### Merge de feature/Jennifer (barra de vida del boss) a main + trampa de case-collision en refs

*2026-07-25 · `git/branches/jennifer-boss-health`*

**What**: Mergeado `origin/feature/Jennifer` (commit ebe4db8, "feat: add boss health bar UI") a `main` con `--no-ff` → merge commit caa8bf2. Sin conflictos. NO pusheado todavía.

**Why**: El usuario pidió traer los cambios de Jennifer y eligió integrarlos directo a main en lugar de pasar por test/integracion.

**Where**:
- `src/constants/BOSS_HEALTH.js` (nuevo, 49 líneas)
- `src/game/render/drawBossHealth.js` (nuevo, 72 líneas)
- `src/game/render/drawHUD.js` (+4, llama a drawBossHealth antes de los floats)

**Learned** (gotchas importantes):

1. **TRAMPA DE CASE-COLLISION EN REFS**: existen `feature/jennifer` (minúscula, local, apunta al merge-base viejo 1be927f, VACÍA) y `origin/feature/Jennifer` (MAYÚSCULA, el trabajo real). Windows tiene filesystem case-insensitive, así que las refs colisionan: `git fetch --prune` reemplazó la remota minúscula por la mayúscula. Si haces `git checkout feature/jennifer` te llevas la rama vacía. La local minúscula quedó pendiente de borrar.

2. **`IMG.bossBar` NUNCA existe**: no está en `src/constants/ASSETS_MANIFEST.js`. El `if (IMG.bossBar)` de drawBossHealth siempre es false → siempre usa el fallback de rects. Pero las proporciones `INNER` (y0:0.30, y1:0.70 → 4.8px de alto) fueron calibradas para un PNG que no existe, mientras el marco fallback tiene borde de 2px sobre 12px de alto (interior de 8px). Queda un gap visual. `COLORS.divider` es código muerto.

3. **BUG REAL — lerp dependiente del framerate**: `G.bossHpDisplay += (target - actual) * BOSS_HEALTH.LERP` con `LERP: 0.12` por FRAME, no por `dt`. Rompe la convención del resto del codebase, que sí usa dt (ej. `G.bossHit = Math.max(0, G.bossHit - dt)` en GameEngine.js:192). En un monitor de 144Hz la barra se anima ~2.4x más rápido que en 60Hz.

4. **Mutación de estado en la capa de render**: `bossHpDisplay` se inicializa perezosamente Y se lerpea DENTRO de `drawBossHealth`, que es una función de dibujo. La animación solo avanza cuando se dibuja. Además falta en `createInitialState()` (GameEngine.js:27-47); el `reset()` funciona por accidente porque reemplaza todo `this.G` y el init perezoso lo vuelve a poner en 1. El comentario de Jennifer dice "en G para sobrevivir reinicio", pero NO sobrevive el reinicio — y no debería. Comentario engañoso.

5. **Geometría verificada OK**: barra especial ocupa x 10-205, barra del boss x 216-424 (gap de 11px). Indicador de ronda a la derecha (x=626). Barra del boss en y 66-78, justo encima del sprite del boss (y 100-292). No hay solapamientos.

6. `test/integracion` está desactualizada respecto a main (le faltan los 3 commits de assets/specs).

### Merge de feature/osvaldo (tutorial + ritmo CHOOSE) y colision de texto con la barra del boss de Jennifer

*2026-07-26 · `git/branches/osvaldo-intro-pacing`*

**What**: Mergeado `origin/feature/osvaldo` a `main` con `--no-ff` → merge commit 653584c. Sin conflictos textuales. `main` quedó 6 commits adelante de `origin/main`, NO pusheado.

**Why**: El usuario pidió traer lo que subió Osvaldo, siguiendo la misma decisión de integrar directo a main que tomó con Jennifer.

**Where** (3 commits, él ya había sincronizado main en 21c0ced):
- `1de9279` escena de tutorial: `src/game/scenes/introScene.js`, `src/game/render/drawIntroScene.js`, `src/constants/INTRO_SCENE.js`, +10 assets
- `bb2d1b0` timer de 5s en CHOOSE + typewriter: `src/constants/COMBAT_PACING.js`, `src/game/render/drawCards.js`, `updateChooseTimer` en `battleLogic.js`
- 11 archivos, +454/-39

**Learned**:

1. **COLISION DE TEXTO CONFIRMADA en CHOOSE (defecto de integración, no de ninguna rama sola)**. `drawTextOutlined` usa `textBaseline: 'middle'` y `lineWidth: 3` (1.5px por lado). Cuentas:
   - Pregunta de Osvaldo/main: `drawCards.js:30`, y=48, size 11 → ocupa **y 41-55**, centrada en x=320
   - Rótulo "LEGACY SERVER" de Jennifer: `BOSS_HEALTH.labelY: 58`, size 9 → ocupa **y 52-64**, centrada en x=320
   - **Solapan y 52-55**, mismo centro horizontal. En pixel art 640x360 escalado 2-3x, el contorno #141420 de uno muerde los glifos del otro.

2. **Jennifer reintrodujo lo que la convención había sacado**. `drawHUD.js:28-29` oculta la barra especial en CHOOSE con el comentario "En CHOOSE se oculta para no tapar la pregunta" — la barra especial ocupa y 42-80 (LAYOUT.HUD barY:42 barH:38). La barra del boss de Jennifer ocupa y 52-78, la MISMA banda, y `BOSS_HEALTH_VISIBLE_STATES` sí incluye CHOOSE. **Fix de una línea: sacar CHOOSE de BOSS_HEALTH_VISIBLE_STATES**, siguiendo la convención que ya existe.

3. **El timer de Osvaldo NO choca con la barra del boss**: arco en (320, 211) r=14 → y 197-225; barra del boss y 66-78. Sin solape. Además `drawCards` corre antes de `drawHUD`, así que el HUD gana si algún día se cruzan.

4. **Falsa alarma que verifiqué**: sospeché loop infinito de pérdida de corazones en `updateChooseTimer` (el guard `if (G.hearts > 0)` no hace setState cuando llega a 0). NO existe: `loseHeart` ya hace `setState(DEFEAT)` cuando `hearts <= 0`, así que el guard de estado del frame siguiente corta. El código de Osvaldo está bien.

5. **Contraste de calidad entre las dos ramas**: el timer de Osvaldo se basa en `G.t`, que acumula por `dt` → correcto e independiente del framerate. El lerp de Jennifer (`BOSS_HEALTH.LERP: 0.12` por frame) NO usa dt → dependiente del framerate. Sigue sin arreglar.

6. **Los 10 assets de Osvaldo están todos commiteados** en `public/assets/art/_gameready/` (verificado con git ls-files). El único que falta es `boss_bar.png`, de Jennifer — y ni siquiera está en `ASSETS_MANIFEST.js` después del +10 de Osvaldo, así que `IMG.bossBar` es permanentemente falsy y la barra vive en el fallback de rects con proporciones INNER descalibradas.

7. Osvaldo agregó `GAME_STATES.INTRO` a `NO_HUD_STATES` y `BOSS_HEALTH_VISIBLE_STATES` de Jennifer no incluye INTRO → consistente, sin problema ahí.

### agy Claude Opus 4.6 alucina archivos delegando a subagentes internos

*2026-07-26 · `tooling/agy-opus-46-hallucination`*

**What**: Despachando la tarea más riesgosa de un feature a `agy --model "Claude Opus 4.6 (Thinking)"`, el ejecutor lanzó subagentes internos "en paralelo" para leer los archivos de contexto, y esos subagentes DEVOLVIERON CONTENIDO INVENTADO. Le reportaron un `ROUNDS.js` con cartas de AWS Lambda/EC2/S3, un `GAME_STATES.RULES` inexistente, `MAX_HEARTS: 3` en vez de 4, y un `PHASE_CONFIG` con claves que no existen. Describieron un juego distinto al del repo. Después salió con exit code 1, abortando a mitad del trabajo.

**Why importa**: el resumen del ejecutor NO revela la alucinación — hay que leer su transcript completo o verificar el diff real. Si se le hubiera creído, se habría dado por bueno código escrito contra una ficción. Es exactamente el fallo que el paso de verificación del model-router existe para atrapar.

**Where**: proyecto hackaton_aws (Cloud Quest), tarea de refactor del ciclo de rondas en `src/game/battle/battleLogic.js` + `GameEngine.js`.

**Learned**:
- Los modelos de `agy` con capacidad de spawn de subagentes pueden contaminarse con contexto alucinado de sus propios subagentes. En prompts para `agy`, conviene instruir explícitamente: "leé los archivos VOS MISMO con Read, no delegues la lectura".
- Media suerte: el trabajo que SÍ alcanzó a escribir en `battleLogic.js` quedó correcto (había leído los archivos reales también). O sea que la alucinación de los subagentes no llegó a manejar las ediciones — pero eso fue suerte, no diseño.
- Ante alucinación en el nervio de un sistema, NO gastar los 2 reintentos: escalar directo a Claude nativo. Opus 4.8 nativo completó la mitad restante y además encontró 4 defectos reales que no le habían pedido, incluido uno de diseño (`updateChooseTimer` no seteaba `lastResult = 'miss'` en el timeout, así que un timeout cobraba un corazón y encadenaba sin explicar nada).
- `agy --print` con prompts muy largos rompe el quoting de bash. Solución: escribir el prompt a un archivo y pasarlo como `--print "$(cat archivo)"`.

## Resúmenes de sesión (6)

### Session summary: hackaton_aws

*2026-07-24*

#### Goal
Construir el gameplay principal de Cloud Quest (combate por turnos contra el Legacy Server) como prototipo jugable para presentación inmediata del hackatón.

#### Instructions
- Feedback del usuario en vivo: (1) letras de cartas deben ser legibles, (2) el jefe lanza ataques visibles que se bloquean con timing (no anillo abstracto), (3) cartas chicas abajo sin tapar la pantalla.
- El doc maestro es CLOUD_QUEST.md en la raíz — leerlo antes de tocar código o generar assets.

#### Discoveries
- El proyecto solo tenía assets (assets/art/_gameready/) y el doc maestro; cero código previo.
- Playwright MCP bloquea file://, servir con `python -m http.server 8377`; sus screenshots caen en la raíz del proyecto.
- special_bar.png viene dibujada llena: el progreso se simula tapando la parte vacía con un rect oscuro.

#### Accomplished
- `index.html` completo: máquina de estados del combate (problema → carta → bloqueo con timing → reflejo → explicación del mentor → remate épico → isla transformada), 4 rondas NIST, corazones, barra especial, partículas, screen shake, SFX WebAudio sin assets, derrota y reinicio con R.
- Verificado end-to-end con Playwright: camino miss, bloqueo perfect con reflejo al jefe, finisher y pantalla de victoria.

#### Next Steps
- Balancear velocidad del ataque por ronda (atkSpeed) probándolo a mano.
- Carta equivocada hoy cuesta un corazón — validar si es muy castigador para la demo.
- Sonido/música reales, animación de caminata (hero_walk_1..6) para una intro caminando, deploy a S3+CloudFront.
- Decisión pendiente: portar a Godot 4 (plan original) o quedarse en Canvas/Phaser para el hackatón.

#### Relevant Files
- index.html — el juego completo (prototipo jugable del combate)
- CLOUD_QUEST.md — documento maestro de diseño
- assets/art/_gameready/ — sprites y escenas usados por el juego

### Session summary: hackaton_aws

*2026-07-24*

#### Goal
Migrar Cloud Quest de prototipo canvas vanilla a React.js + JavaScript organizado para trabajo en equipo, y arreglar la sensación de lentitud en las animaciones.

#### Instructions
- Stack obligatorio: React.js con JavaScript (NO TypeScript), cero tooling Python (Vite).
- Convenciones del usuario en agents/*.md: JSX puro en componentes, lógica en use*.hook.js, CSS por componente, constantes UPPER_SNAKE, Zustand granular solo desde hooks, sin console.log, sin index.jsx.

#### Discoveries
- La lentitud del prototipo venía de shadowBlur y ctx.filter por frame (carísimos en Canvas 2D) — reemplazados por sprites pre-renderizados en assets.service.js.
- StrictMode doble-monta el hook del motor: destroy() debe cancelar el rAF.
- Playwright screenshots con path relativo caen en la raíz del proyecto (mover a scratchpad después).

#### Accomplished
- Scaffold Vite + React 19 + Zustand con la estructura del usuario (components/pages/stores/services/constants + src/game para el motor).
- Motor portado completo: GameEngine (rAF, input), battleLogic, attack, effects, 6 módulos de render. React solo shell; sincronización por eventos discretos al store (verificada: el hint cambia por pantalla).
- Tempo mejorado (windup 0.45s, orbe 250px/s+, resolve 0.75s); todos los knobs en constants/TIMING.js.
- Prototipo preservado en prototype/index.html como backup de demo.
- README.md con arquitectura, regla de oro (no setState por frame, no shadowBlur/filter) y checklist de tareas para el equipo.
- Verificado E2E en localhost:5173: perfect block + reflect, explicación, finisher, victoria. Juego reseteado en TITLE.

#### Next Steps
- Repartir las tareas del README: música/SFX reales, intro caminando (hero_walk_1..6), HUD en React DOM, balance de TIMING.js, mapa mundi, mobile/touch, deploy S3+CloudFront.
- Decidir favicon (404 inofensivo en consola).

#### Relevant Files
- src/game/GameEngine.js — motor: loop, input, orquestación
- src/game/battle/battleLogic.js — reglas del combate
- src/constants/TIMING.js — todos los números de dificultad/tempo
- src/services/assets.service.js — carga + pre-render de glows (fix de rendimiento)
- src/components/GameCanvas/useGameCanvas.hook.js — ciclo de vida motor↔React
- README.md — arquitectura + tareas para el equipo
- prototype/index.html — prototipo original (backup)

### Session summary: aws_island

*2026-07-25*

#### Goal
Generate and save a pixel-art 2D adventure overworld map asset for the current project.

#### Instructions
The requested asset needed to be exactly 640x360 pixels and saved at `assets/art/generated/a6_overworld_map.png`.

#### Discoveries
- Built-in imagegen saved the generated source under `C:/Users/<usuario>/.codex/generated_images/...`; project-bound assets need to be copied into the workspace.
- Final exact dimensions were enforced with nearest-neighbor resizing to preserve crisp pixel-art edges.

#### Accomplished
- ✅ Generated a bright tropical pixel-art overworld map with nine islands, a cream dotted serpentine route, one revealed island, and eight locked/clouded islands.
- ✅ Saved the final PNG at exactly 640x360 pixels.

#### Next Steps
- None for this asset unless the user wants iteration or integration into game code.

#### Relevant Files
- assets/art/generated/a6_overworld_map.png — generated 640x360 pixel-art overworld map asset.

### Session summary: aws_island

*2026-07-25*

#### Goal
Generate two paired pixel-art island sprites for the current project.

#### Instructions
User required exact filenames, 112x96 pixels, RGBA fully transparent background, identical island silhouette/shoreline/building layout, and before/after condition changes only.

#### Discoveries
- Pillow 12.0.0 is available in the project environment.
- Deterministic Pillow pixel drawing best satisfied the exact-size, hard-edge, shared-layout constraints.

#### Accomplished
- ✅ Created `assets/art/generated/a7_island0_before.png` as the decayed island state with rusted server tower, smoke, broken windmill, rusted water tower, damaged houses, cracked slabs, dead trees, toxic puddles, and pipes.
- ✅ Created `assets/art/generated/a7_island0_after.png` as the revived island state with the same layout, lighthouse-like tower, repaired windmill/water tower/houses, clean slabs, leafy trees, clear water, flowers, and vivid palette.
- ✅ Validated both PNGs are exactly 112x96, mode RGBA, transparent corners, and alpha values are only 0/255.

#### Next Steps
- If needed, visually tune the art direction after in-game preview against the ocean/world-map background.

#### Relevant Files
- assets/art/generated/a7_island0_before.png — decayed island sprite asset.
- assets/art/generated/a7_island0_after.png — revived island sprite asset.

### Session summary: aws_island

*2026-07-25*

#### Goal
Generate two project-bound pixel art island background assets for Isla 0, "Server Town".

#### Instructions
User required exact 640x360 PNGs saved under assets/art/generated, with identical before/after island framing and no text/characters/UI.

#### Discoveries
- Built-in image generation produced 1672x941 PNGs, so outputs were center-cropped to 16:9 and resized to exact 640x360 using nearest-neighbor resampling to preserve hard pixel-art edges.

#### Accomplished
- ✅ Generated sick-state Server Town island image and saved it as assets/art/generated/a8_island_before.png.
- ✅ Generated healed-state repaint preserving the same island layout and saved it as assets/art/generated/a8_island_after.png.
- ✅ Verified both final PNGs are exactly 640x360.

#### Next Steps
- Use the two PNGs in the game/app asset pipeline as needed.

#### Relevant Files
- assets/art/generated/a8_island_before.png — sick-state pixel art island background.
- assets/art/generated/a8_island_after.png — healed-state pixel art island background.

### Session summary: aws_island

*2026-07-25*

#### Goal
Generate two SICK-state pixel art background images for Isla 0 Server Town and save them into the project at exact 640x360 resolution.

#### Instructions
User required no text/UI/characters/people; fixed landmark relative positions across views; battle arena needed HUD, boss-silhouette, floor, and dialogue-box clearance constraints.

#### Discoveries
- Built-in image generation saved source files under C:/Users/<usuario>/.codex/generated_images/... at 1672x941.
- Final project assets were resized to exact 640x360 using nearest-neighbor resampling to preserve hard pixel-art edges.

#### Accomplished
- ✅ Generated and saved assets/art/generated/a10_battle_arena.png as a SICK close battle arena at the foot of the legacy server tower.
- ✅ Generated and saved assets/art/generated/a10_island_path.png as a SICK side-scrolling village path with the server tower distant on the horizon.
- ✅ Verified both final PNGs are 640x360 RGBA.

#### Next Steps
- Review the images in-game for sprite/dialogue/HUD readability and request a targeted regeneration if any gameplay zone needs more clearance.

#### Relevant Files
- assets/art/generated/a10_battle_arena.png — final generated boss battle background.
- assets/art/generated/a10_island_path.png — final generated side-scrolling island path background.

---

_Se omitieron 6 entradas de telemetría (project, passive, file_change). Están en el JSON._
