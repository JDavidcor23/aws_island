# Cloud Quest — Isla 0 🏝️

**RPG por turnos donde aprendés Cloud Computing (AWS) jugando.** El jefe (Legacy Server) lanza PROBLEMAS;
los bloqueás eligiendo la característica de la nube correcta y con timing.

**Entrega: lunes 27.** Si es tu primer día en el proyecto, seguí este archivo en orden.
El diseño completo del juego vive en [CLOUD_QUEST.md](./CLOUD_QUEST.md).

---

## 📑 Índice

- [PARTE 1 — Instalar todo](#parte-1--instalar-todo-una-sola-vez-15-min)
- [PARTE 2 — Correr el proyecto](#parte-2--correr-el-proyecto-5-min)
- [PARTE 3 — Tu tarea](#parte-3--tu-tarea)
- [PARTE 4 — Subir tu trabajo](#parte-4--subir-tu-trabajo)
- [Las 7 reglas](#las-7-reglas-no-negociables)
- [Si algo no funciona](#si-algo-no-funciona)
- [Arquitectura (leer antes de codear)](#arquitectura-leer-antes-de-codear)

---

# PARTE 1 — Instalar todo (una sola vez, ~15 min)

## Paso 1 · Node.js

Node es lo que hace correr el proyecto. Sin esto no arranca nada.

1. Andá a **https://nodejs.org**
2. Descargá el botón que dice **LTS** (el de la izquierda, dice algo como "22.x.x LTS").
   - **Windows:** el `.msi`. Siguiente a todo, no cambies nada.
   - **Mac:** el `.pkg`. Igual, Siguiente a todo.
3. **Cerrá y volvé a abrir la terminal.** Importante: si no, no lo va a encontrar.
4. Verificá:

```bash
node --version
npm --version
```

Tenés que ver dos números, tipo `v22.14.0` y `10.9.2`. **El de Node tiene que empezar en 18 o más.**

> **¿Dónde está "la terminal"?**
> **Windows:** tecla Windows → escribí `powershell` → Enter.
> **Mac:** Cmd+Espacio → escribí `terminal` → Enter.

## Paso 2 · Git

Git es lo que nos permite trabajar los cuatro sin pisarnos.

1. **https://git-scm.com/downloads** → descargá el de tu sistema → Siguiente a todo.
2. Cerrá y abrí la terminal. Verificá con `git --version`.
3. Configurate (con el **mismo mail de tu cuenta de GitHub**):

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu@mail.com"
```

## Paso 3 · Editor de código

Si no tenés: **https://code.visualstudio.com** → descargá → Siguiente a todo.

## Paso 4 · Mandá tu usuario de GitHub al grupo

Si no tenés cuenta, creala en **https://github.com/signup**.
**Mandá tu usuario al grupo de WhatsApp** para que Jorge te agregue al repo. Sin esto no podés subir nada.

---

# PARTE 2 — Correr el proyecto (~5 min)

Copiá y pegá en la terminal, línea por línea:

```bash
git clone https://github.com/JDavidcor23/aws_island.git
cd aws_island
npm install          # tarda 1-2 min, es normal
npm run dev
```

Vas a ver:

```
  VITE v6.3.5  ready in 412 ms
  ➜  Local:   http://localhost:5173/
```

**Abrí `http://localhost:5173`.** Ahí está el juego.

> El servidor **queda corriendo** en esa terminal. Dejala abierta: cada vez que guardes un archivo, la
> página se actualiza sola. Para apagarlo, `Ctrl+C`.

## Jugalo completo antes de escribir código

Necesitás saber cómo se siente para no romperlo.

| Tecla | Qué hace |
|---|---|
| `ESPACIO` | Avanzar diálogos · **Bloquear** el ataque |
| `1` `2` `3` `4`, flechas ← → , o clic | Elegir carta |
| `R` | Reiniciar |

**Recorrido:** título → `ESPACIO` → el pingüino explica → `ESPACIO` → el jefe grita un problema → elegís la
carta correcta → esperás que el orbe llegue al círculo frente al héroe y apretás `ESPACIO` → repetís 4 veces
→ se llena la barra especial → **remate** → la isla revive.

Si llegaste al final, tenés el entorno andando. Ahora sí, tu tarea.

---

# PARTE 3 — Tu tarea

Cada uno tiene **su rama** y **su spec**. Buscá tu nombre:

| Vos sos | Tu rama | Tu spec | Figura | Paradigma |
|---|---|---|---|---|
| **Nicolás** | `feature/nicolas` | [`.kiro/specs/main-menu/`](./.kiro/specs/main-menu/) | **FIG-1** | React + CSS |
| **Jennifer** | `feature/jennifer` | [`.kiro/specs/boss-health-bar/`](./.kiro/specs/boss-health-bar/) | **FIG-2** | Canvas |
| **Osvaldo** | `feature/osvaldo` | [`.kiro/specs/intro-tutorial/`](./.kiro/specs/intro-tutorial/) | **FIG-3** | Canvas |
| **Jorge** | `main` | [`ASSETS.md`](./.kiro/specs/ASSETS.md) → Vercel, arte, integración, video | — | integración |

Tu rama ya está creada en GitHub: hacé `git checkout feature/tunombre` y listo, no tenés que crearla.

> ✅ **No hay nada que esperar.** El motor ya está preparado y el arte ya está hecho. Cada uno hace
> `git checkout` de su rama y arranca.

## Tu spec tiene 4 archivos. Leelos en este orden:

| # | Archivo | Qué te dice |
|---|---|---|
| 1 | `requirements.md` | **QUÉ** hay que construir y cuándo está terminado |
| 2 | `reference.png` | **CÓMO SE VE** — tu FIG, compuesta con los assets reales del juego |
| 3 | `design.md` | **CÓMO** se construye: archivos exactos, código de ejemplo, trampas |
| 4 | `tasks.md` | **EN QUÉ ORDEN** — checklist, tachá a medida que avanzás |

**Leé los cuatro completos antes de escribir código.** Cada spec tiene una sección de trampas: son errores
que **no dan mensaje de error**, simplemente algo deja de funcionar y no sabés por qué. Están ahí porque ya
las revisamos por vos.

---

## 🧑‍💻 Nicolás — Menú Principal · FIG-1

**Rama:** `feature/nicolas` · **Spec:** [`.kiro/specs/main-menu/`](./.kiro/specs/main-menu/)

Hoy el juego arranca directo en la pantalla de título y lo único que podés hacer es apretar ESPACIO.
Vas a construir un **menú de verdad**: título, `JUGAR`, `CÓMO SE JUEGA`, `CRÉDITOS`, navegable con las flechas.

**Es React y CSS puro. No tocás nada del motor del juego.** Es la tarea más aislada de las tres: podés
trabajar sin miedo a romper el combate.

```bash
git checkout feature/nicolas
git pull
```

- **Creás:** `src/components/MainMenu/` · `src/constants/MAIN_MENU.js`
- **Compartido que tocás:** solo `src/App.jsx` (3 líneas)

---

## 🧑‍💻 Jennifer — Barra de Vida del Jefe · FIG-2

**Rama:** `feature/jennifer` · **Spec:** [`.kiro/specs/boss-health-bar/`](./.kiro/specs/boss-health-bar/)

Hoy el jefe recibe golpes y **nada cambia en pantalla**, así que el combate no se siente como que estás
ganando. Vas a agregarle una **barra de vida sobre la cabeza** que baja un cuarto cada vez que el jugador
resuelve un problema.

**Esto se dibuja en canvas**, no con HTML. Suena raro pero es más simple: son rectángulos y texto. El spec
te lleva de la mano paso a paso.

⚠️ **Ojo:** el jefe **NO muere por tu barra**. Muere cuando la barra especial del jugador se llena y se
dispara el remate. Tu barra muestra *progreso del combate*, y **no vas a tocar la lógica de combate**.
El `requirements.md` explica por qué — leelo, no lo saltees.

```bash
git checkout feature/jennifer
git pull
```

- **Creás:** `src/game/render/drawBossHealth.js` · `src/constants/BOSS_HEALTH.js`
- **Compartido que tocás:** solo `src/game/render/drawHUD.js` (2 líneas)

---

## 🧑‍💻 Osvaldo — Escena de Tutorial · FIG-3

**Rama:** `feature/osvaldo` · **Spec:** [`.kiro/specs/intro-tutorial/`](./.kiro/specs/intro-tutorial/)

Hoy el jugador aprende las mecánicas **perdiendo corazones**. Para un jurado con 5 minutos, eso es fatal.

Vas a construir una **escena caminable propia**, antes del combate: el héroe entra caminando por la isla
oxidada, se encuentra con el pingüino mentor, el pingüino le explica las tres mecánicas en diálogo, y después
el héroe sigue caminando hacia el servidor. Recién ahí arranca la pelea.

**Es canvas, no HTML** — sprites, ciclo de caminata de 6 frames y una línea de piso. Y es la tarea más
acoplada de las tres: engancha en 4 lugares del motor. El spec te da los 4 diffs exactos.

⚠️ **Tenés una dependencia de arte:** el fondo de la escena (`A-1`) todavía no existe, lo genera Jorge.
**Podés arrancar igual** — el spec te dice cómo trabajar con un fondo de color plano hasta que esté.

```bash
git checkout feature/osvaldo
git pull
```

- **Creás:** `src/game/scenes/introScene.js` · `src/game/render/drawIntroScene.js` · `src/constants/INTRO_SCENE.js`
- **Compartido que tocás:** `GameEngine.js`, `battleLogic.js`, `drawScreens.js` y `ASSETS_MANIFEST.js` — un par de líneas en cada uno, y ninguno de los otros dos los toca

---

# PARTE 4 — Subir tu trabajo

Hacé esto **varias veces al día**, no una sola vez al final. Si guardás todo para el domingo y algo sale
mal, no hay tiempo de arreglarlo.

```bash
git status                                       # ¿qué cambié?
git add .                                        # agregar mis cambios
git commit -m "feat: navegación por teclado en el menú"
git push origin feature/nicolas                # ← poné TU rama
```

La primera vez que hagas `push` te va a pedir usuario y contraseña. Si te rechaza la contraseña, es porque
GitHub ya no las acepta: avisá en el grupo y te pasamos cómo generar un token.

**Mensajes de commit:** `feat:` algo nuevo · `fix:` un arreglo · `style:` CSS.

## Cuando avisen que hay arte nuevo

El arte lo genera **Jorge** y lo sube a `main`. **Nadie se pasa imágenes por WhatsApp.**
Cuando avise en el grupo, traelas a tu rama así:

```bash
git add . && git commit -m "wip"   # guardá tu trabajo primero
git fetch origin
git merge origin/main              # trae los assets nuevos sin pisar lo tuyo
```

`git merge origin/main` y no `git pull`: te trae lo de `main` sin tocar tu trabajo.

> ⚠️ Si te aparece un conflicto en un archivo `.png`, **no lo resuelvas vos** — avisá en el grupo.
> Significa que un asset entró por dos ramas y hay que arreglarlo en `main`.

---

# Las 7 reglas (no negociables)

1. **Nunca trabajes en `main`.** Siempre en tu rama. Si escribiste código estando en `main`, avisá antes de tocar nada más.
2. **Nunca uses `git push --force`.** Nunca. Si se complicó, avisá en el grupo.
3. **Tocá SOLO los archivos que tu spec lista.** Si necesitás otro, preguntá **antes**.
4. **Constantes nuevas → tu propio archivo** en `src/constants/`. No agregues nada a `LAYOUT.js` ni a `TIMING.js`: son de todos y garantizan conflictos.
5. **Cero valores mágicos.** Todo número o texto que signifique algo va a tu archivo de constantes.
6. **Cero estilos inline** (`style={{...}}`) y **cero `console.log`** en lo que subís. CSS en el `.css` de tu componente. Excepción única: valores calculados, tipo el ancho de una barra.
7. **Antes de pedir merge:** jugá el juego completo. Si tu cambio deja el combate a medias, se revierte.

---

# Si algo no funciona

| Lo que ves | Qué pasa | Cómo se arregla |
|---|---|---|
| `node: command not found` / `no se reconoce` | La terminal no encuentra Node | Cerrá y abrí la terminal. Si sigue, reinstalá Node LTS |
| `npm install` tira errores raros | Instalación a medias | Borrá `node_modules` y `package-lock.json`, corré `npm install` de nuevo |
| Página en blanco | Error de JavaScript | `F12` → pestaña **Console** → copiá el error rojo al grupo |
| `Port 5173 is already in use` | Ya lo tenés corriendo en otra terminal | Usá esa, o `Ctrl+C` en la otra |
| `git push` rechazado | No tenés permiso en el repo | Mandá tu usuario de GitHub al grupo |
| Guardo un archivo y no pasa nada | El servidor se cayó | Mirá la terminal de `npm run dev`; si murió, corrélo otra vez |
| El juego se ve borroso | Falta `image-rendering: pixelated` | Está en el spec del menú. En los otros, avisá |
| El mouse dejó de funcionar en el juego | Un overlay se está comiendo los clics | Te falta `pointer-events: none`. Está en el spec del tutorial |

**Regla de oro del grupo:** si estás trabado más de **20 minutos**, escribí al grupo. No es debilidad, es
que tenemos 2 días y medio y alguien ya se topó con eso.

## Referencia rápida

```bash
npm run dev              # levantar el servidor (dejalo corriendo)
Ctrl+C                   # apagarlo
git status               # ¿qué cambié?
git branch               # ¿en qué rama estoy? (el * marca la actual)
git checkout mi-rama     # cambiar de rama
git pull                 # traer lo último de GitHub
git push origin mi-rama  # subir mis cambios
```

---

# Arquitectura (leer antes de codear)

## LA regla de oro

**React es el shell, el motor es JS puro.** El loop del juego corre con `requestAnimationFrame` y muta su
propio estado (`engine.G`). React **NUNCA** se entera de un frame: el motor notifica solo **eventos
discretos** (cambio de pantalla o de fase) vía `onScreenChange` → Zustand.

> **PROHIBIDO** meter `setState` o updates del store dentro del loop. Eso mata el rendimiento.

Si venís de React "normal", esto es lo que más te va a confundir: **no hay componentes que se
re-rendericen cuando el jugador juega.** Hay un `<canvas>` y un objeto `G` que se modifica directamente.

```
src/
├── App.jsx                          # punto de entrada
├── components/GameCanvas/           # el canvas + ciclo de vida del motor
├── pages/BattlePage/                # página del combate (shell React)
├── stores/useGameStore.store.js     # screen + phase + stats (eventos discretos, NO frames)
├── services/
│   ├── assets.service.js            # carga sprites + pre-renderiza glows/flashes
│   └── sfx.service.js               # SFX retro con WebAudio (sin archivos)
├── constants/                       # TODOS los números y textos del juego
│   ├── TIMING.js                    # ← tunear dificultad/tempo SOLO acá
│   ├── ROUNDS.js                    # los 4 problemas del jefe (doc §4)
│   ├── LAYOUT.js                    # geometría del canvas 640x360
│   └── CARDS.js · GAME_STATES.js · ASSETS_MANIFEST.js · UI_TEXTS.js
└── game/
    ├── GameEngine.js                # loop, input, orquestación update/draw
    ├── battle/battleLogic.js        # reglas: rondas, cartas, bloqueo, vida
    ├── battle/attack.js             # física del orbe (windup/fly/reflect/hit)
    ├── fx/effects.js                # partículas y textos flotantes
    └── render/                      # dibujo por responsabilidad (escena, HUD, cartas...)
```

## El objeto `G` (el estado del juego)

| Campo | Qué es |
|---|---|
| `G.state` | fase actual, uno de los 12 `GAME_STATES` |
| `G.t` | segundos dentro de la fase actual |
| `G.time` | segundos totales (para blinks y bobbing) |
| `G.round` | ronda actual, 0-based |
| `G.hearts` | vida del jugador, 0..4 |
| `G.special` | barra especial, 0..100 |
| `G.lastResult` | `'perfect'` · `'good'` · `'miss'` |
| `G.extraRound` | `true` si el jefe insiste más allá de la ronda 4 |

`G` se recrea entero en `reset()` (cuando el jugador aprieta `R`). Si guardás algo en `G`, se resetea gratis.

## Convenciones del repo

Las reglas completas, con ejemplo incorrecto y correcto de cada una, están en
[`.kiro/steering/conventions.md`](./.kiro/steering/conventions.md). Resumen:

Componente = **solo JSX** · lógica en `use*.hook.js` · CSS por componente, sin inline styles · constantes en
`src/constants/` en UPPER_SNAKE, **archivo propio por feature** · Zustand **con selectores granulares**
(`useGameStore(s => s.phase)`, nunca destructuring) y consumido **solo desde hooks** · nada de `src/game/`
importa React · sin `console.log`.

## Steering de Kiro

Este proyecto usa **Kiro** con specs y steering. Kiro lee automáticamente todo lo que está en
`.kiro/steering/` como contexto del proyecto:

| Archivo | Qué define |
|---|---|
| [`product.md`](./.kiro/steering/product.md) | qué es el juego, la mecánica, la paleta, el criterio de éxito |
| [`tech.md`](./.kiro/steering/tech.md) | stack, la regla de oro de la arquitectura, reglas del canvas |
| [`structure.md`](./.kiro/steering/structure.md) | dónde va cada cosa, naming, regla anti-conflictos |
| [`conventions.md`](./.kiro/steering/conventions.md) | las 10 reglas de código con ejemplos |

**Si trabajás con Kiro, no le tenés que explicar el proyecto: ya lo sabe.** Abrí tu spec en
`.kiro/specs/<tu-feature>/` y pedile que ejecute las tareas de `tasks.md`.

## Regla de rendimiento (canvas)

`shadowBlur` y `ctx.filter` por frame están **PROHIBIDOS** — son los que hacían sentir lento el prototipo.
Todo glow/flash se pre-renderiza una vez en `assets.service.js` y en el loop solo se hace `drawImage`.

## Debug

En desarrollo, el motor queda expuesto en `window.__CLOUD_QUEST__`. Desde la consola del navegador podés
inspeccionar `__CLOUD_QUEST__.G` para ver el estado en vivo. **Solo para debug, nunca en código que subís.**

> `prototype/index.html` es el prototipo original en canvas vanilla (backup de demo, se abre con doble clic).
> **No se desarrolla más ahí.**
