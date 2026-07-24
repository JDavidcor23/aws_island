# Convenciones de código

Estas son las reglas que se revisan en cada merge. Cada una trae un ejemplo INCORRECTO y el CORRECTO.

---

## 1 · Separación de responsabilidades

| Archivo | Responsabilidad |
|---|---|
| `Componente.jsx` | JSX y nada más |
| `useComponente.hook.js` | todo el estado, efectos y handlers |
| `feature.service.js` | I/O y side effects |
| `useStore.store.js` | estado global compartido |

```jsx
// ❌ INCORRECTO — lógica dentro del componente
export const MainMenu = ({ onStart }) => {
  const [focused, setFocused] = useState(0)
  useEffect(() => {
    const onKey = (e) => { /* ... */ }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focused])
  return <nav>{/* ... */}</nav>
}

// ✅ CORRECTO — el componente solo pinta
export const MainMenu = ({ onStart }) => {
  const { focusedIndex, handleSelect, handleFocus } = useMainMenu(onStart)
  return <nav>{/* ... */}</nav>
}
```

---

## 2 · Cero valores mágicos

Todo número o texto que **significa algo** va a `src/constants/`.

```js
// ❌ INCORRECTO
if (bossHp <= 0.3) color = '#ffd94a'
drawText(ctx, 'LEGACY SERVER', 320, 58, 9)

// ✅ CORRECTO — src/constants/BOSS_HEALTH.js
export const BOSS_HEALTH = {
  PULSE_THRESHOLD: 0.3,
  LABEL: 'LEGACY SERVER',
  labelY: 58,
  labelSize: 9,
  COLORS: { fillPulse: '#ffd94a' },
}
```

Excepción razonable: constantes locales de un solo archivo de render (tipo `BOSS_BOB_FREQ` en
`drawScene.js`), declaradas arriba del archivo en UPPER_SNAKE.

---

## 3 · Cero estilos inline

```jsx
// ❌ INCORRECTO
<div style={{ display: 'flex', padding: '1rem', color: '#7de0ff' }}>

// ✅ CORRECTO — clase en el .css del componente
<div className="main-menu__options">
```

**Única excepción legítima: valores calculados en runtime.**

```jsx
// ✅ CORRECTO — la posición depende de datos
<div className="coach-mark" style={{ left: `${(x / LAYOUT.W) * 100}%` }}>
```

---

## 4 · Zustand: selectores granulares, siempre

```js
// ❌ INCORRECTO — re-renderiza cuando cambia CUALQUIER cosa del store
const { phase, stats } = useGameStore()

// ✅ CORRECTO — re-renderiza solo cuando cambia ese valor
const phase = useGameStore((state) => state.phase)
const stats = useGameStore((state) => state.stats)
```

Reglas adicionales del store:

- **El store se consume solo desde hooks**, nunca desde el JSX de un componente.
- Updates inmutables (spread), nunca mutación directa.
- Cero llamadas a I/O dentro del store: eso va en `services/`.
- **Cero updates del store dentro del loop del juego.** Solo eventos discretos.

---

## 5 · El motor no conoce React

```js
// ❌ INCORRECTO — dentro de src/game/
import { useGameStore } from '../stores/useGameStore.store'
useGameStore.setState({ phase })

// ✅ CORRECTO — el motor notifica por callback, React decide qué hacer
if (this.onScreenChange) this.onScreenChange(screen, stats, state)
```

Nada de `src/game/` importa React, hooks ni el store. La comunicación es **siempre** por callback hacia
afuera. Eso mantiene el motor testeable y el rendimiento intacto.

---

## 6 · Orden de imports

```js
// 1. React y librerías externas
import { useEffect, useRef, useState } from 'react'
// 2. Componentes internos
import { CoachMark } from './CoachMark'
// 3. Hooks internos
import { useBattleTutorial } from './useBattleTutorial.hook'
// 4. Stores y services
import { useGameStore } from '../../stores/useGameStore.store'
// 5. Constantes y tipos
import { LAYOUT } from '../../constants/LAYOUT'
// 6. CSS al final
import './BattleTutorial.css'
```

---

## 7 · Cero `console.log` en lo que se commitea

Para debug en desarrollo usá `window.__CLOUD_QUEST__` desde la consola del navegador. Los `console.log`
temporales se borran antes de pedir merge.

---

## 8 · Keys únicas en listas

```jsx
// ❌ INCORRECTO
{MENU_ITEMS.map((item, index) => <MenuItem key={index} item={item} />)}

// ✅ CORRECTO
{MENU_ITEMS.map((item) => <MenuItem key={item.id} item={item} />)}
```

---

## 9 · Overlays sobre el canvas: `pointer-events`

Cualquier `<div>` absoluto por encima del `<canvas>` **intercepta todos los clics** y el juego deja de
responder al mouse — **sin dar ningún error en consola**. Es el bug más caro de diagnosticar en este proyecto.

```css
/* ✅ CORRECTO */
.mi-overlay        { position: absolute; inset: 0; pointer-events: none; }
.mi-overlay__boton { pointer-events: auto; }   /* solo lo que DEBE ser clickeable */
```

Y nunca llames `preventDefault()` ni `stopPropagation()` en un listener de teclado: el motor escucha
`keydown` en `window` y le romperías el input.

---

## 10 · Git

- Una rama por feature, salida de `main`. **Nunca se commitea a `main` directo.**
- **Nunca `git push --force`.**
- Commits convencionales: `feat:` · `fix:` · `style:` · `refactor:` · `docs:` · `chore:`
- Tocá solo los archivos que tu spec lista. Si necesitás otro, se avisa **antes**.
- Antes de pedir merge: el juego se juega completo de punta a punta sin romperse.
