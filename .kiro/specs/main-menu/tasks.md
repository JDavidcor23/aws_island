# Tareas — Menú Principal

**Owner:** Nicolás · **Rama:** `feature/nicolas`

Marcá cada casilla cuando la termines. Cada tarea referencia el requisito que cubre.

---

- [ ] **1. Preparar la rama**
  - Salí de `main` actualizado: `git checkout feature/nicolas && git pull`
  - Verificá que `npm run dev` levanta ANTES de tocar nada. Si no levanta, avisá en el grupo: no es tu culpa.

- [ ] **2. Crear las constantes**
  - Creá `src/constants/MAIN_MENU.js` con el contenido completo del `design.md`.
  - No dejes ningún texto ni tecla hardcodeado en los componentes que siguen.
  - _Requisitos: 1.2, 1.3, 3.2, 3.3, 4.1_

- [ ] **3. Maquetar el menú (solo visual, sin interacción)**
  - Creá `src/components/MainMenu/MainMenu.jsx` y `MainMenu.css`.
  - Fondo con `MENU_BACKGROUND` + velo + `image-rendering: pixelated`.
  - Título, subtítulo, las 3 opciones como `<button>`, y la ayuda de controles.
  - Fallback de color sólido si el fondo no carga.
  - Montalo temporalmente en `App.jsx` para verlo.
  - _Requisitos: 1.2, 1.3, 1.4, 6.3_

- [ ] **4. Foco y navegación por teclado**
  - Creá `src/components/MainMenu/useMainMenu.hook.js`.
  - `focusedIndex` arranca en 0 (`JUGAR`).
  - `ArrowUp` / `ArrowDown` con wrap-around. `Enter` / `Space` activan.
  - `onMouseEnter` de cada botón mueve el foco.
  - La opción enfocada se distingue: caret `▶` + color `#ffd94a`.
  - Toda la lógica en el hook. `MainMenu.jsx` solo JSX.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] **5. Panel de CÓMO SE JUEGA y CRÉDITOS**
  - Creá `src/components/MainMenu/MenuPanel.jsx` y `MenuPanel.css`.
  - Un solo componente, recibe por props qué contenido mostrar.
  - `Escape` y el botón VOLVER cierran.
  - **Verificá el bug clásico:** con el panel abierto, las flechas y el Enter NO deben mover ni activar el menú de atrás.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [ ] **6. Enganchar con el juego**
  - `App.jsx`: `useState` para `started`, `<MainMenu onStart={...} />` cuando es `false`.
  - `<BattlePage initialState={GAME_STATES.INTRO} />` cuando es `true`.
  - `initialState` ya está soportado de punta a punta (`App` → `BattlePage` → `GameCanvas` → `GameEngine`). No tenés que tocar nada del motor.
  - _Requisitos: 1.1, 2.1, 2.2, 2.3, 2.4_

- [ ] **7. Responsive**
  - Probá a 1280px y a 768px. Sin scroll horizontal, todo legible y clickeable.
  - _Requisitos: 6.1, 6.2_

- [ ] **8. Repaso final antes de pedir merge**
  - [ ] Cero estilos inline (salvo valores calculados).
  - [ ] Cero strings o números mágicos: todo sale de `MAIN_MENU.js`.
  - [ ] `MainMenu.jsx` y `MenuPanel.jsx` no tienen `useState` ni `useEffect` — eso vive en el hook.
  - [ ] El listener de `keydown` tiene su cleanup en el `return` del `useEffect`.
  - [ ] Los archivos que modificaste son exactamente: `src/App.jsx`. Nada más. Confirmalo con `git status`.
  - [ ] El combate sigue jugable de punta a punta después de apretar JUGAR.
  - [ ] `npm run dev` sin warnings nuevos en consola.

---

## Si te trabás

1. Releé el `design.md`, sección **Contrato de integración**.
2. Si el problema está fuera de tus archivos → **grupo de WhatsApp, no lo arregles vos.**
3. Nunca hagas `git push --force` ni commitees a `main`.
