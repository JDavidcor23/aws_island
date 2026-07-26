# Walkthrough — Escena de Tutorial (Osvaldo)

**Rama:** `feature/osvaldo`  
**Estado global:** 🔲 En progreso

---

## Mapa de dependencias

```
Agente 1:  ████ Spec A (assets + constantes + drawer) ████
Agente 2:  ████ Spec B (lógica sub-máquina)          ████
                                                        │
                                              ┌─────────┘
                                              ▼
Agente 1 o 2:  ████ Spec C (integración 4 enganches) ████
                                                           │
                                                   ┌───────┘
                                                   ▼
Cualquiera:    ████ Spec D (QA + pulido + merge) ████
```

| Spec | Paralela con | Depende de | Estado |
|------|-------------|------------|--------|
| A — Fundamentos | B | Ninguna | 🔲 |
| B — Lógica | A | Ninguna | 🔲 |
| C — Integración | — | A + B | 🔲 |
| D — Pulido y QA | — | C | 🔲 |

---

## Spec A — Fundamentos (assets, constantes, drawer estático)

**Archivos:** `ASSETS_MANIFEST.js`, `src/constants/INTRO_SCENE.js`, `src/game/render/drawIntroScene.js`

### Task A1 — Registrar assets en el manifest
- [ ] Agregar claves: `islandPath`, `heroSide`, `walk1`..`walk6`, `penguinTalk1`, `penguinTalk2`
- [ ] Verificar: `npm run dev` → título sin `⚠ no cargó:`
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task A2 — Crear constantes (`INTRO_SCENE.js`)
- [ ] Crear `src/constants/INTRO_SCENE.js` con `INTRO_STEPS`, `INTRO_SCENE`, `INTRO_LINES`
- [ ] Verificar: importable sin errores
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task A3 — Crear el drawer estático (`drawIntroScene.js`)
- [ ] Crear `src/game/render/drawIntroScene.js`
- [ ] Helper `drawGrounded` ancla por pies (`GROUND_Y - size`)
- [ ] Fallbacks: color plano, sprite quieto
- [ ] **TRAMPA:** NO centrar como drawScene.js
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task A4 — Validar integridad
- [ ] `npm run dev` sin errores (drawer no enganchado)
- [ ] Imports correctos, sin circularidad
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

---

## Spec B — Lógica de la sub-máquina de estados

**Archivos:** `src/game/scenes/introScene.js`

### Task B1 — `ensureIntro` e inicialización perezosa
- [ ] Estado en `G.intro`, NUNCA variable de módulo
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task B2 — `updateIntroScene(engine, dt)`
- [ ] WALK_IN/TALK/WALK_OUT con `dt`
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task B3 — `advanceIntroScene(engine)`
- [ ] Avanzar línea, cambiar a WALK_OUT al terminar
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task B4 — `skipIntroScene(engine)`
- [ ] `(engine) => startRound(engine)`
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

---

## Spec C — Integración (enganches en el motor)

**Archivos:** `GameEngine.js`, `battleLogic.js`, `drawScreens.js`  
**Depende de:** Spec A + Spec B

### Task C1 — Enganchar update en `GameEngine.js`
- [ ] `if (G.state === GAME_STATES.INTRO) updateIntroScene(this, dt)`
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task C2 — Apagar HUD + tecla T
- [ ] `INTRO` en `NO_HUD_STATES` + handler de T
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task C3 — Redirigir `advance()` en `battleLogic.js`
- [ ] Caso INTRO → `advanceIntroScene(engine)`
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task C4 — Conectar drawer en `drawScreens.js`
- [ ] Cambiar SCREEN_DRAWERS, borrar código muerto
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

---

## Spec D — Pulido, QA y merge

**Depende de:** Spec C

### Task D1 — Edge cases de reinicio
- [ ] R durante y después de la escena
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task D2 — Fallbacks y resiliencia
- [ ] Sin fondo, sin frame, combate intacto
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task D3 — Ajuste visual
- [ ] `GROUND_Y`, `HERO_MEET_X`, `PENGUIN_X`
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

### Task D4 — Limpieza y merge
- [ ] Checklist completa, commit, push
- **Estado:** 🔲 | **Errores:** — | **Solución:** —

---

## 📋 Registro de errores y bugs

| # | Spec/Task | Descripción | Causa raíz | Solución | Fecha |
|---|-----------|-------------|------------|----------|-------|
| | | | | | |

---

## 📝 Trampas conocidas

- **Dibujar centrado en Y:** En esta escena se ancla por PIES: `GROUND_Y - size`, NO `y - size/2`.
- **Variable de módulo:** `reset()` no la limpia → escena arranca a mitad de camino. Usar `G.intro`.
- **HUD aparece:** Falta `GAME_STATES.INTRO` en `NO_HUD_STATES`.
- **ESPACIO no avanza:** `battleLogic.advance()` caso INTRO no delega a `advanceIntroScene`.
- **Héroe no se mueve:** `updateIntroScene` no está enganchado en `GameEngine.update()`.
