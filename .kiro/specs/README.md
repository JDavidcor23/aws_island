# Specs — Cloud Quest

> Entrega: **lunes 27**. Un solo nivel (Isla 0), pulido.
> Si es tu primer día, arrancá por el [README raíz](../../README.md) — instalación paso a paso.

---

## 🔴 Nadie arranca hasta que Jorge termine el PASO 0

[`PASO-0-DIAZ.md`](./PASO-0-DIAZ.md) son 4 parches chiquitos al motor que existen para que ustedes tres
**NO tengan que tocar los mismos archivos**. Sin eso, los tres features chocan en `GameEngine.js`.

---

## Reparto

| Spec | Rama | Owner | Figura | Paradigma | Archivos compartidos que tocás |
|---|---|---|---|---|---|
| [`main-menu`](./main-menu/) | `feature/nicolas` | **Nicolás** | FIG-1 | React DOM puro | `src/App.jsx` |
| [`boss-health-bar`](./boss-health-bar/) | `feature/jennifer` | **Jennifer** | FIG-2 | Canvas | `src/game/render/drawHUD.js` |
| [`intro-tutorial`](./intro-tutorial/) | `feature/osvaldo` | **Osvaldo** | FIG-3 | Canvas | `GameEngine.js` · `battleLogic.js` · `drawScreens.js` · `ASSETS_MANIFEST.js` |

Además: [`ASSETS.md`](./ASSETS.md) tiene los prompts del arte que falta. **Solo Jorge genera assets** — si tu
spec necesita uno, pedilo en el grupo por su número (`A-1`, `A-2`…).

**Los tres archivos compartidos son distintos.** Cero intersección, cero conflictos de merge. Eso no es
casualidad: el reparto está diseñado así.

El reparto tampoco es por gusto: es por **acoplamiento**. `intro-tutorial` es el único que necesita
es el único que reacciona a las fases del juego y el único que necesita un asset nuevo. `main-menu` no toca el motor
en absoluto, por eso es el más seguro.

Cada spec tiene su `mockup.svg` — esa es su figura (FIG-1 / FIG-2 / FIG-3), a escala 640×360 real.
**Abrilos en el navegador**, no en el editor.

---

## Anatomía de un spec

| # | Archivo | Qué te dice |
|---|---|---|
| 1 | `requirements.md` | **QUÉ** construir, en formato EARS, y cuándo está terminado |
| 2 | `mockup.svg` | **CÓMO SE VE** — tu figura, a escala real |
| 3 | `design.md` | **CÓMO** se construye: archivos exactos, código, y las trampas |
| 4 | `tasks.md` | **EN QUÉ ORDEN** — checklist ejecutable |

Leé los cuatro completos antes de escribir código. La sección de trampas de cada `design.md` documenta
errores que **no dan mensaje de error**: algo simplemente deja de funcionar. Están ahí porque ya las
revisamos.

---

## Contexto que necesitás antes de tocar código

El proyecto tiene su steering en [`../steering/`](../steering/) y **Kiro lo lee automáticamente**:

| Archivo | Qué define |
|---|---|
| [`product.md`](../steering/product.md) | qué es el juego, la mecánica, la paleta, el criterio de éxito |
| [`tech.md`](../steering/tech.md) | stack, la regla de oro de la arquitectura, reglas del canvas, el objeto `G` |
| [`structure.md`](../steering/structure.md) | dónde va cada cosa, naming, regla anti-conflictos |
| [`conventions.md`](../steering/conventions.md) | las 10 reglas de código, con ejemplo incorrecto y correcto |

**Si trabajás con Kiro, no le tenés que explicar el proyecto: ya lo sabe.** Abrí tu spec y pedile que
ejecute las tareas de `tasks.md`.

### Lo mínimo, si vas a leer una sola cosa

**El juego NO son componentes de React que se re-renderizan.** Es un `<canvas>` de 640×360 lógicos y un
objeto `G` que se muta directamente dentro de `GameEngine`, con `requestAnimationFrame`. React solo
sostiene el canvas.

React se entera del juego **solo por eventos discretos**:

```
GameEngine.setState(state)
  └─ onScreenChange(screen, stats, phase)
       └─ useGameCanvas.hook.js  →  useGameStore (Zustand)
            └─ tu hook  →  useGameStore((s) => s.phase)
```

⚠️ **`screen` no es lo mismo que `phase`.** `screen` colapsa las 12 fases en 5 (`LOAD` `TITLE` `BATTLE`
`VICTORY` `DEFEAT`). Si necesitás saber si el jugador está eligiendo carta o bloqueando, usá `phase`.

> ❌ **PROHIBIDO** meter updates del store dentro del loop del juego. Mata el rendimiento.

---

## Reglas de trabajo (no negociables)

1. **Una rama por feature**, salida de `main`. Nunca commitees a `main`.
2. **Tocás SOLO los archivos que tu spec lista.** Si necesitás otro, avisá en el grupo **antes**.
3. **Constantes nuevas → tu propio archivo** en `src/constants/`. No agregues campos a `LAYOUT.js` ni a `TIMING.js`: son compartidos y garantizan conflicto de merge.
4. **Cero estilos inline.** Excepción única: valores calculados (`style={{ width: `${pct}%` }}`).
5. **Cero valores mágicos** y **cero `console.log`** en lo que subís.
6. **Zustand con selectores granulares**, consumido solo desde hooks.
7. Antes de pedir merge: `npm run dev` levanta, tu feature funciona, y **el combate sigue jugable de punta a punta**.
8. Si estás trabado más de 20 minutos → grupo de WhatsApp. Tenemos 2 días y medio.
