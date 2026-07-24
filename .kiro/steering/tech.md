# Stack técnico

| Decisión | Elección | Por qué |
|---|---|---|
| **Framework** | React 19 + Vite 6 | El equipo ya sabe JS. Cero curva de motor a días de la entrega. |
| **Render del juego** | Canvas 2D a mano, 640×360 lógicos | Pixel art nítido, control total del timing. |
| **Estado del juego** | Objeto `G` mutado imperativamente dentro de `GameEngine` | Un loop de juego no necesita el ciclo de render de React. |
| **Estado compartido con React** | Zustand (`useGameStore.store.js`) | Solo eventos discretos: pantalla, fase, stats. |
| **Audio** | WebAudio generado en código (`sfx.service.js`) | Cero archivos, cero latencia de carga. |
| **Despliegue** | **Vercel** | Deploy automático desde GitHub en cada push a `main`. |

> **No es Godot y no es AWS.** El diseño original planteaba Godot 4 + S3/CloudFront; se cambió por plazo y
> por curva de aprendizaje del equipo. **No instalar Godot, no tocar AWS.**

## Comandos

```bash
npm install      # instalar dependencias
npm run dev      # servidor de desarrollo → http://localhost:5173
npm run build    # build de producción
npm run preview  # previsualizar el build
```

## LA regla de oro de la arquitectura

**React es el shell, el motor es JS puro.**

El loop corre con `requestAnimationFrame` dentro de `GameEngine` y muta su propio estado (`engine.G`).
React **NUNCA** se entera de un frame. El motor notifica solo **eventos discretos** vía `onScreenChange`,
que `useGameCanvas.hook.js` sincroniza al store.

```
GameEngine.setState(state)
  └─ onScreenChange(screen, stats, phase)
       └─ useGameCanvas.hook.js  →  useGameStore.setScreen / setPhase / setStats
            └─ cualquier hook de React  →  useGameStore((s) => s.phase)
```

> ❌ **PROHIBIDO** meter `setState` de React o updates del store dentro del loop del juego.
> Eso mata el rendimiento y es el error más grave que se puede cometer en este codebase.

## Regla de rendimiento del canvas

`shadowBlur` y `ctx.filter` **por frame están PROHIBIDOS** — son los que hacían sentir lento el prototipo.
Todo glow o flash se pre-renderiza **una sola vez** en `assets.service.js` (`makeWhiteSprite`,
`makeGlowSprite`) y en el loop solo se hace `drawImage`.

Otras reglas del canvas:

- **Redondear siempre** las coordenadas con `Math.round()` antes de `fillRect` y `drawImage`. Es pixel art:
  media unidad de píxel deja bordes borrosos.
- `imageSmoothingEnabled = false` ya está seteado en el constructor del motor. No lo cambies.
- El orden de dibujado importa: lo último tapa lo anterior. Ver `GameEngine.draw()`.

## El objeto `G` (estado del juego)

Se crea en `createInitialState()` y se **recrea entero** en `reset()` (tecla `R`). Cualquier cosa que
guardes en `G` se resetea gratis con el reinicio.

| Campo | Qué es |
|---|---|
| `state` | fase actual, uno de los 12 `GAME_STATES` |
| `t` | segundos dentro de la fase actual |
| `time` | segundos totales (para blinks y bobbing) |
| `round` | ronda actual, 0-based |
| `extraRound` | `true` si el jefe insiste más allá de la ronda 4 |
| `hearts` | vida del jugador, 0..4 |
| `special` | barra especial, 0..100 |
| `perfects` | contador de bloqueos perfectos |
| `lastResult` | `'perfect'` · `'good'` · `'miss'` |
| `atk` | el orbe en vuelo: `{ phase, t, x, y, blocked }` o `null` |

`GAME_STATES` tiene 12 fases: `LOAD` `TITLE` `INTRO` `PROBLEM` `CHOOSE` `TIMING` `RESOLVE` `EXPLAIN`
`FINISH_LINE` `FINISH_ANIM` `VICTORY` `DEFEAT`.

⚠️ El `screen` del store **NO** es lo mismo que `G.state`: `REACT_SCREENS` colapsa las 12 fases en 5
(`LOAD` `TITLE` `BATTLE` `VICTORY` `DEFEAT`). Si necesitás la fase real, usá `phase` del store.

## Debug

En desarrollo el motor queda expuesto en `window.__CLOUD_QUEST__`. Desde la consola podés inspeccionar
`__CLOUD_QUEST__.G` en vivo. **Solo para debug — nunca en código que se commitea.**
