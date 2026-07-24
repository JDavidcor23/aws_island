# Tareas — Barra de Vida del Jefe

**Owner:** Jennifer · **Rama:** `feature/jennifer`

Marcá cada casilla cuando la termines. Cada tarea referencia el requisito que cubre.

---

- [ ] **1. Preparar la rama**
  - `git checkout feature/jennifer && git pull`
  - Verificá que `npm run dev` levanta y que llegás al combate ANTES de tocar nada. Si no levanta, avisá en el grupo: no es tu culpa.

- [ ] **2. Leer el código que vas a usar (30 min, no lo saltees)**
  - `src/game/render/drawHUD.js` — es el archivo donde vas a enganchar. Fijate cómo dibuja los corazones y cómo hace el blink de `¡MAX!` con `G.time`.
  - `src/game/battle/battleLogic.js`, función `advance()`, caso `EXPLAIN` — ahí se incrementa `G.round`. Ese es tu único input.
  - `src/game/render/textHelpers.js` — la firma de `drawTextOutlined`.
  - `src/constants/LAYOUT.js` y `TIMING.js` — para entender el espacio de 640×360. **Los leés, no los modificás.**

- [ ] **3. Crear las constantes**
  - Creá `src/constants/BOSS_HEALTH.js` con el contenido del `design.md`.
  - Cero números sueltos después de esto: toda coordenada, color y umbral sale de acá.
  - _Requisitos: 1.1, 4.1, 4.2, 4.3, 4.4_

- [ ] **4. Dibujar la barra estática al 100%**
  - Creá `src/game/render/drawBossHealth.js` con la firma `(engine) => {}`.
  - Dibujá rótulo → fondo vacío → relleno al 100% → **el marco `IMG.bossBar` encima** (con fallback a rects si no cargó).
  - **No dibujes los divisores:** el PNG ya los trae. Si los agregás, quedan dobles.
  - Enganchá el import y la llamada en `drawHUD.js` (2 líneas).
  - `Math.round()` en todas las coordenadas de `fillRect`.
  - Confirmá visualmente que no tapa corazones, especial, indicador de ronda ni diálogos.
  - _Requisitos: 1.1, 1.2, 4.1, 4.2, 4.3, 4.4, 4.5_

- [ ] **5. Guardas de visibilidad**
  - `return` temprano si el sprite del jefe no está cargado.
  - `return` temprano si `G.state` no está en `BOSS_HEALTH_VISIBLE_STATES`.
  - Probá: en TITLE, INTRO, VICTORY y DEFEAT la barra **no** aparece.
  - _Requisitos: 3.1, 3.2, 3.3_

- [ ] **6. Conectar con el progreso de rondas**
  - Calculá `chunksLost` con `Math.min(G.round, SEGMENTS - 1)` y de ahí `targetHp`.
  - Sin animación todavía: la barra puede saltar. Verificá los 4 valores: 1.00 / 0.75 / 0.50 / 0.25.
  - _Requisitos: 1.3, 1.4_

- [ ] **7. Animar la transición**
  - Init perezoso de `G.bossHpDisplay` y lerp hacia `targetHp` con `BOSS_HEALTH.LERP`.
  - **NO uses una variable de módulo** (`let displayed = 1` arriba del archivo). Releé el `design.md`, sección "La animación", punto 2, para entender por qué eso rompe el reinicio.
  - _Requisitos: 1.5, 5.1, 5.2_

- [ ] **7b. Ajustar el área interna del marco**
  - Mirá si el relleno se asoma por fuera del marco. Si sí, corregí `BOSS_HEALTH.INNER` (`x0`/`x1`/`y0`/`y1`).
  - _Requisito: 1.1_

- [ ] **8. Pulso en el mínimo**
  - Cuando `bossHpDisplay <= PULSE_THRESHOLD`, alterná el color del relleno usando `G.time` y `PULSE_FREQ`.
  - Mirá cómo `drawHUD.js` hace el blink de `¡MAX!`: `Math.floor(G.time * 3) % 2 === 0`.
  - _Requisito: 1.6_

- [ ] **9. Vaciado durante el remate**
  - En `FINISH_ANIM`, calculá el progreso con `G.t / TIMING.FINISH_BREAK_DURATION` y arrastrá la barra a 0.
  - Cuando `bossHpDisplay <= 0.001`, `return` — deja de dibujarse.
  - _Requisitos: 2.1, 2.2_

- [ ] **10. Probar los casos límite (los que rompen)**
  - [ ] **`¡EL JEFE INSISTE!`** — fallá timings a propósito hasta que aparezca. La barra se queda en 25%, no desaparece ni se va a negativo. _(Si te olvidaste el `Math.min` en la tarea 6, acá revienta.)_
  - [ ] **Reinicio** — apretá `R` a mitad del combate. La barra vuelve a 100% de una, sin arrastrar el valor anterior. _(Si usaste variable de módulo en la tarea 7, acá revienta.)_
  - [ ] **Derrota** — perdé los 4 corazones. La barra no se dibuja en `DEFEAT`.
  - [ ] **Victoria** — la barra no se dibuja en `VICTORY` (el jefe ya no está).
  - _Requisitos: 1.4, 2.2, 3.2, 5.1, 5.2_

- [ ] **11. Repaso final antes de pedir merge**
  - [ ] Cero valores mágicos: todo sale de `BOSS_HEALTH.js` o de constantes que ya existían.
  - [ ] `Math.round()` en todas las coordenadas de `fillRect`.
  - [ ] No importaste ni tocaste `battleLogic.js`. No agregaste campos a `LAYOUT.js` ni a `TIMING.js`.
  - [ ] `git status` muestra: 2 archivos nuevos + **`drawHUD.js` como único archivo compartido modificado**. Nada más.
  - [ ] El combate sigue jugable de punta a punta: TITLE → INTRO → 4 rondas → remate → VICTORY.
  - [ ] `npm run dev` sin warnings nuevos en consola.

---

## Si te trabás

1. Releé el `design.md`, sección **De dónde sale el valor**.
2. Si sentís que necesitás modificar `battleLogic.js` → **pará y preguntá en el grupo.** Te estás yendo del alcance del spec.
3. Nunca hagas `git push --force` ni commitees a `main`.
