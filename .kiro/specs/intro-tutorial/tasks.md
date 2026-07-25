# Tareas — Escena de Tutorial

**Owner:** Osvaldo · **Rama:** `feature/osvaldo`

Marcá cada casilla cuando la termines. Cada tarea referencia el requisito que cubre.

---

- [x] **1. Preparar la rama**
  - `git checkout feature/osvaldo && git pull`
  - `npm run dev` levanta y se juega el combate completo. Si no, avisá en el grupo: no es tu culpa.
  - **El arte ya está hecho** — ver la tabla en el `requirements.md`. No tenés que pedir nada, solo registrarlo (tarea 3).

- [x] **2. Mapear el terreno (no lo saltees, son 30 min que ahorran horas)**
  - `src/game/GameEngine.js` — `update()` (dónde vas a enganchar), `draw()` y `NO_HUD_STATES`, `handleKeyDown` (cómo se maneja el teclado por fase), `createInitialState()` y `reset()`.
  - `src/game/battle/battleLogic.js` — `advance()`, caso `INTRO`: hoy arranca el combate directo. Y `startRound()`, que es a quien vas a llamar.
  - `src/game/render/drawScreens.js` — `drawDialogue()` (**la vas a reusar tal cual**), `drawIntroScreen` (el que vas a reemplazar) y `SCREEN_DRAWERS`.
  - `src/game/render/drawScene.js` — cómo dibuja sprites con `Math.round()` y bobbing.
  - `src/constants/LAYOUT.js` — el espacio lógico de 640×360.

- [x] **3. Registrar los assets en el manifest**
  - Agregá a `ASSETS_MANIFEST.js` las claves del diff del `design.md`: `islandPath`, `heroSide`, `walk1`..`walk6`, `penguinTalk1`, `penguinTalk2`.
  - Los archivos **ya existen** en `public/assets/art/_gameready/`. Lo único que falta es que el manifest los conozca.
  - Verificá en la pantalla de título que no aparezca ningún aviso `⚠ no cargó:`.
  - _Requisitos: 1.3, 6.5, 6.6_

- [x] **4. Crear las constantes**
  - Creá `src/constants/INTRO_SCENE.js` con el contenido del `design.md`: `INTRO_STEPS`, `INTRO_SCENE` y las 5 `INTRO_LINES`.
  - Cero números y cero textos sueltos después de esto.
  - _Requisitos: 2.3, 4.1_

- [x] **5. Dibujar la escena quieta**
  - Creá `src/game/render/drawIntroScene.js` con firma `(engine) => {}`.
  - Fondo (o `FALLBACK_BG`), pingüino en `PENGUIN_X`, héroe quieto en `HERO_MEET_X`, hint de saltear.
  - Enganchá `SCREEN_DRAWERS[INTRO]` a tu drawer y **borrá** `drawIntroScreen` y `drawPenguin` si quedan sin uso.
  - 🔴 **Los pies apoyados en el piso:** la esquina superior del sprite va en `GROUND_Y - HERO_SIZE`, no centrada. Si copiás el patrón de `drawScene.js` (que centra en `y`), los personajes flotan medio cuerpo. Usá el helper `drawGrounded` del `design.md`.
  - 🔴 **Escalas nativas:** héroe a 64 (1:1), pingüino a 64 (0.5x desde 128). Nunca a 96 — es 1.5x y deja píxeles desparejos.
  - `Math.round()` en todas las coordenadas.
  - _Requisitos: 1.1, 1.5, 2.1, 4.1, 6.5_

- [x] **6. Apagar el HUD en la escena**
  - Agregá `GAME_STATES.INTRO` a `NO_HUD_STATES` en `GameEngine.js`.
  - Verificá: ni corazones, ni especial, ni indicador de ronda sobre tu escena.
  - Avisale a Jennifer que su barra del jefe tampoco tiene que aparecer acá.
  - _Requisito: 6.4_

- [x] **7. La caminata de entrada**
  - Creá `src/game/scenes/introScene.js` con `updateIntroScene(engine, dt)` y el `ensureIntro()` de init perezoso.
  - Enganchá la llamada en `GameEngine.update()` (1 línea).
  - `WALK_IN`: avanzar `heroX` hacia `HERO_MEET_X` usando `dt`. Al llegar → `TALK`.
  - Ciclo de caminata con el acumulador `walkTime`, no con `G.time`.
  - 🔴 **`ensureIntro` inicializa `G.intro`, NO una variable de módulo.** Releé el `design.md`, sección 3, para entender por qué eso rompe el reinicio.
  - _Requisitos: 1.2, 1.3, 1.4, 5.1, 5.2_

- [x] **8. El diálogo**
  - `advanceIntroScene(engine)` en `introScene.js`.
  - Redirigí el caso `INTRO` de `advance()` en `battleLogic.js` a esa función.
  - En el drawer, cuando `step === TALK`, llamá a `drawDialogue(engine, speaker, text)` con la línea actual.
  - **No escribas tu propia caja de diálogo.** `drawDialogue` ya hace el wrap, el nombre y el `▼ ESPACIO` parpadeante.
  - `sfxService.confirm()` al avanzar.
  - _Requisitos: 2.2, 2.3, 2.4, 2.5_

- [x] **9. El pingüino habla**
  - Alterná `IMG.penguinTalk1` / `IMG.penguinTalk2` con `G.time` y `PENGUIN_TALK_FRAME_DURATION`, solo cuando `step === TALK`.
  - Fuera de `TALK`, siempre `penguinTalk2` (boca cerrada).
  - Los dos frames tienen los pies en la misma fila, así que no debería saltar. Si salta, estás anclando por el centro en vez de por los pies.
  - _Requisitos: 2.6, 2.7_

- [x] **10. La salida y el arranque del combate**
  - Después de la última línea → `step = WALK_OUT`, ocultar el diálogo.
  - `WALK_OUT`: avanzar `heroX` hacia `HERO_EXIT_X`. Al salir → `startRound(engine)`.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 6.1_

- [x] **11. Saltear con `T`**
  - `skipIntroScene(engine)` → `startRound(engine)`.
  - El caso en `handleKeyDown`, gateado a `G.state === INTRO`.
  - Verificá que `ESPACIO`, `1`-`4`, `R` y las flechas siguen funcionando **igual en todas las fases**.
  - _Requisitos: 4.2, 4.3, 4.4_

- [x] **12. Probar los casos que rompen**
  - [x] **`R` después de la escena** → vuelve a arrancar desde el principio, héroe fuera de pantalla. _(Si usaste variable de módulo en la tarea 7, acá revienta.)_
  - [x] **`R` durante la escena** → reinicia sin quedar trabado.
  - [x] **Pies en el piso** durante toda la caminata, sin flotar ni hundirse.
  - [x] **Sin fondo:** renombrá `scene_island_path.png` → sigue funcionando con color plano.
  - [x] **Sin un frame de caminata:** renombrá `hero_walk_3.png` → sigue funcionando.
  - [x] **HUD apagado** en toda la escena, incluida la barra del jefe de Jennifer.
  - [x] **El combate intacto:** 4 rondas → remate → victoria, sin ningún cambio de comportamiento.
  - _Requisitos: 3.4, 5.1, 5.2, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

- [x] **13. Afinar la composición contra el fondo real**
  - `GROUND_Y`, `HERO_MEET_X` y `PENGUIN_X` vienen con valores calculados a ojo sobre el fondo. **Miralo corriendo y ajustalos**: los pies tienen que quedar sobre las losas, no sobre el pasto del primer plano ni flotando.
  - Los tres valores están en `INTRO_SCENE.js`. Es lo único que deberías necesitar tocar.
  - _Requisitos: 1.5, 2.1_

- [x] **14. Repaso final antes de pedir merge**
  - [x] Cero valores mágicos: todo sale de `INTRO_SCENE.js` o de constantes que ya existían.
  - [x] Todo el movimiento usa `dt`. Nada de sumar píxeles fijos por frame.
  - [x] `Math.round()` en todas las coordenadas de `drawImage`.
  - [x] Cero `console.log`. Cero código muerto (`drawIntroScreen` borrado si quedó sin uso).
  - [x] No agregaste fases a `GAME_STATES` ni campos a `createInitialState()`.
  - [x] No modificaste las reglas de combate más allá del caso `INTRO` de `advance()`.
  - [x] `git status`: tus 3 archivos nuevos + `GameEngine.js`, `battleLogic.js`, `drawScreens.js`, `ASSETS_MANIFEST.js`. Nada más.
  - [x] El juego se juega completo: escena → 4 rondas → remate → victoria.

---

## Si te trabás

1. Releé el `design.md`, sección **Los 4 enganches**.
2. Si te aparece la tentación de agregar fases a `GAME_STATES` → pará. La sub-máquina en `G.intro` existe justamente para no hacer eso.
3. Si querés que el jugador controle la caminata → pará. Está explícitamente fuera de alcance y toca el input del motor.
4. Si tu escena necesita un asset que no existe → pedilo en el grupo con su número de [`ASSETS.md`](../ASSETS.md). **No dibujes arte a mano.**
5. Nunca hagas `git push --force` ni commitees a `main`.
