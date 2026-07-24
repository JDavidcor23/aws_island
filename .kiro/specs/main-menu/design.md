# Diseño Técnico — Menú Principal

**Owner:** Nicolás · **Rama:** `feature/nicolas`

## Wireframe

**Objetivo visual: [`reference.png`](./reference.png)** (assets reales) · wireframe anotado en [`mockup.svg`](./mockup.svg).

```
┌──────────────────────────────────────────────────────────────┐
│  ░░░ scene_island_before.png, oscurecido con un velo ░░░     │
│                                                              │
│                                                              │
│                    C L O U D   Q U E S T                     │  ← 1
│              Isla 0 — Fundamentos de la Nube                 │  ← 2
│                                                              │
│                                                              │
│                    ▶  J U G A R                              │  ← 3 (enfocado)
│                       CÓMO SE JUEGA                          │
│                       CRÉDITOS                               │
│                                                              │
│                                                              │
│              ↑↓ mover · ENTER elegir                         │  ← 4
└──────────────────────────────────────────────────────────────┘

1. Título. Grande, pixelado, color #7de0ff.
2. Subtítulo. Blanco.
3. Lista de opciones. La enfocada lleva el caret ▶ y cambia de color a #ffd94a.
4. Ayuda de controles. Chica, tenue.
```

Panel abierto (`CÓMO SE JUEGA` / `CRÉDITOS`) — mismo fondo, el menú se reemplaza:

```
┌──────────────────────────────────────────────────────────────┐
│                      CÓMO SE JUEGA                           │
│   ┌────────────────────────────────────────────────────┐     │
│   │  [1-4] o [clic]   Elegir carta                     │     │
│   │  [ESPACIO]        Avanzar diálogo · Bloquear       │     │
│   │  [R]              Reiniciar                        │     │
│   │                                                    │     │
│   │  El jefe grita un PROBLEMA. Elegí la carta que lo  │     │
│   │  resuelve. Después bloqueá el ataque en el momento │     │
│   │  justo: cuanto más preciso, más carga tu especial. │     │
│   └────────────────────────────────────────────────────┘     │
│                      ◀  VOLVER  (ESC)                        │
└──────────────────────────────────────────────────────────────┘
```

---

## Decisión de arquitectura

**El Menú es React/DOM puro. No toca el canvas ni el `engine`.**

Por qué: el menú no necesita nada del motor del juego, y dibujarlo en canvas te obligaría a editar
`drawScreens.js` (archivo compartido) y a pelearte con coordenadas de 640×360 y `drawTextOutlined`.
En DOM lo resolvés con CSS, en carpeta propia, sin riesgo de romper el combate.

**Consecuencia:** `App.jsx` decide qué se muestra con un `useState` local. **No metas esto en Zustand.**
El store (`useGameStore.store.js`) existe y lo usa el motor para sus eventos discretos, pero "¿el menú está
visible?" es estado local de `App`: si lo subís al store global, acoplás tu feature con el de los otros dos.

```
App.jsx
  └── started === false  →  <MainMenu onStart={...} />        ← este spec
      started === true   →  <BattlePage initialState={...} />  ← el juego que ya existe
```

---

## Archivos

### Creás (son tuyos, nadie más los toca)

```
src/components/MainMenu/
├── MainMenu.jsx              # JSX solamente
├── MainMenu.css              # todos los estilos
├── useMainMenu.hook.js       # toda la lógica: foco, teclado, panel abierto
├── MenuPanel.jsx             # panel de CÓMO SE JUEGA / CRÉDITOS
└── MenuPanel.css

src/constants/MAIN_MENU.js    # opciones, textos, teclas
```

### Modificás (solo esto, y son 3 líneas)

```
src/App.jsx
```

---

## Contrato de integración

`src/App.jsx` queda así:

```jsx
import { useState } from 'react'

import { MainMenu } from './components/MainMenu/MainMenu'
import { BattlePage } from './pages/BattlePage/BattlePage'

import { GAME_STATES } from './constants/GAME_STATES'

export const App = () => {
  const [started, setStarted] = useState(false)

  if (!started) return <MainMenu onStart={() => setStarted(true)} />

  // El motor arranca en INTRO (el diálogo del pingüino) en vez de TITLE,
  // así el jugador no ve DOS pantallas de título seguidas.
  return <BattlePage initialState={GAME_STATES.INTRO} />
}
```

**La prop `initialState` sale del [PASO 0](../PASO-0-DIAZ.md)** (parches 2 y 4), que hace Jorge antes de
repartir las ramas. Verificá que `src/game/GameEngine.js` tenga `this.initialState` en el constructor.
Si no está, **no la implementes vos** — son archivos del motor y te pondrías en colisión con los otros dos
features. Avisá en el grupo y mientras tanto trabajá con `<BattlePage />` pelado: tu feature se valida
igual, solo vas a ver la pantalla de título del canvas después del menú.

---

## Constantes

`src/constants/MAIN_MENU.js`:

```js
export const MENU_OPTIONS = {
  PLAY: 'PLAY',
  HOW_TO_PLAY: 'HOW_TO_PLAY',
  CREDITS: 'CREDITS',
}

export const MENU_ITEMS = [
  { id: MENU_OPTIONS.PLAY, label: 'JUGAR' },
  { id: MENU_OPTIONS.HOW_TO_PLAY, label: 'CÓMO SE JUEGA' },
  { id: MENU_OPTIONS.CREDITS, label: 'CRÉDITOS' },
]

export const MENU_TEXTS = {
  TITLE: 'CLOUD QUEST',
  SUBTITLE: 'Isla 0 — Fundamentos de la Nube',
  NAV_HINT: '↑↓ mover · ENTER elegir',
  BACK: '◀ VOLVER (ESC)',
}

export const HOW_TO_PLAY = {
  TITLE: 'CÓMO SE JUEGA',
  CONTROLS: [
    { keys: '1-4 o clic', action: 'Elegir carta' },
    { keys: 'ESPACIO', action: 'Avanzar diálogo · Bloquear' },
    { keys: 'R', action: 'Reiniciar' },
  ],
  BODY:
    'El jefe grita un PROBLEMA. Elegí la carta de la nube que lo resuelve. ' +
    'Después bloqueá el ataque en el momento justo: cuanto más preciso, más carga tu especial.',
}

export const CREDITS = {
  TITLE: 'CRÉDITOS',
  LINES: [
    'Un juego para aprender Cloud Computing jugando.',
    'Arte: pixel art generado con IA.',
    'Hackatón AWS — 2026',
  ],
  TEAM: ['Jorge', 'Nicolás', 'Jennifer', 'Osvaldo'],
}

// Los assets se sirven desde public/, así que las rutas empiezan en /assets/...
// NO los importes con `import`: son archivos estáticos, no módulos.
export const MENU_ASSETS = {
  BACKGROUND: '/assets/art/_gameready/scene_island_before.png',
  LOGO: '/assets/art/_gameready/logo_cloud_quest.png',   // 400x214
  BUTTON: '/assets/art/_gameready/menu_button.png',      // 240x44
}

export const MENU_KEYS = {
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
}
```

### Ya tenés logo y botón como imágenes

**Usá `MENU_ASSETS.LOGO` en vez de escribir "CLOUD QUEST" como texto.** Es un logo pixel art de 400×214
con las nubes dentro de las letras — se ve muchísimo mejor que texto con contorno.

```jsx
<img className="main-menu__logo" src={MENU_ASSETS.LOGO} alt={MENU_TEXTS.TITLE} />
```

El `alt` con el título de verdad: es una imagen que transmite información, no decoración.

**`MENU_ASSETS.BUTTON`** es el marco de 240×44 para las opciones. Va como `background-image` del `<button>`,
con el texto encima:

```css
.main-menu__option {
  background-image: url('/assets/art/_gameready/menu_button.png');
  background-size: 100% 100%;
  image-rendering: pixelated;   /* ← sin esto se ve borroneado */
  width: 240px;
  height: 44px;
}
```

> ⚠️ **`image-rendering: pixelated` en TODAS las imágenes pixel art**: el fondo, el logo y el botón.
> Sin eso el navegador las suaviza al escalarlas y arruina el estilo. Es el error más visible de este feature.
>
> Si el botón te queda incómodo de estilar, podés resolverlo con CSS puro (borde + fondo de la paleta) y
> dejar el PNG de lado. El logo sí usalo: ahí la diferencia es grande.

---

## El hook — la lógica va toda acá

`useMainMenu.hook.js` devuelve:

| Devuelve | Tipo | Para qué |
|---|---|---|
| `focusedIndex` | `number` | qué opción está enfocada |
| `openPanel` | `string \| null` | `MENU_OPTIONS.HOW_TO_PLAY`, `MENU_OPTIONS.CREDITS` o `null` |
| `handleSelect(id)` | `fn` | activa una opción: `PLAY` llama a `onStart`, el resto abre panel |
| `handleFocus(index)` | `fn` | mueve el foco (para el `onMouseEnter`) |
| `closePanel()` | `fn` | vuelve al menú |

El listener de teclado va en un `useEffect` **dentro del hook**, con su cleanup:

```js
useEffect(() => {
  const handleKeyDown = (event) => { /* ... */ }
  window.addEventListener('keydown', handleKeyDown)
  return () => window.removeEventListener('keydown', handleKeyDown)
}, [focusedIndex, openPanel])
```

**Cuidado con esto:** cuando `openPanel !== null`, las flechas y el Enter **no** deben mover ni activar
opciones del menú de atrás. Solo `Escape` responde. Es el bug más fácil de cometer en este feature.

---

## Estilo visual

Paleta ya en uso en el juego — usá estos valores, no invents otros:

| Uso | Color |
|---|---|
| Título / acentos frío | `#7de0ff` |
| Opción enfocada / destacados | `#ffd94a` |
| Texto normal | `#ffffff` |
| Texto tenue | `#9fb6d8` |
| Fondo sólido de fallback | `#0b0b12` |
| Velo sobre el fondo | `rgba(4, 6, 20, 0.55)` |

Reglas de CSS:

- Fuente `monospace` (ya es la global en `index.css`). No sumes webfonts: cuestan tiempo de carga y no hay tiempo.
- El fondo pixel art **tiene** que ir con `image-rendering: pixelated`. Sin eso se ve borroneado y arruina el estilo.
- Usá `rem`/`%`/`clamp()`. Nada de anchos fijos en px para el layout.
- Botones reales (`<button>`), no `<div onClick>`. Te dan foco y teclado gratis.

---

## Cómo lo probás

1. `npm run dev` → abrís `http://localhost:5173`.
2. Ves el menú, no el juego.
3. `ArrowDown` ×3 vuelve a `JUGAR` (wrap-around).
4. `CÓMO SE JUEGA` abre panel · `Escape` vuelve · las flechas dentro del panel no mueven el menú de atrás.
5. `JUGAR` monta el juego y el combate sigue jugable de punta a punta.
6. Ventana a 768px de ancho: sin scroll horizontal, todo legible.
7. Renombrá el PNG del fondo a mano para simular que no carga → el menú sigue usable con fondo sólido.
