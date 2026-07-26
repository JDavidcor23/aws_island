# Tareas — Menú Principal

**Owner:** Nicolás · **Rama:** `feature/nicolas`

Marcá cada casilla cuando la termines. Cada tarea referencia el requisito que cubre.

---

- [x] **1. Preparar la rama**
  - Salí de `main` actualizado: `git checkout feature/nicolas && git pull`
  - Verificá que `npm run dev` levanta ANTES de tocar nada. Si no levanta, avisá en el grupo: no es tu culpa.

- [x] **2. Crear las constantes**
  - Creá `src/constants/MAIN_MENU.js` con el contenido completo del `design.md`.
  - No dejes ningún texto ni tecla hardcodeado en los componentes que siguen.
  - _Requisitos: 1.2, 1.3, 3.2, 3.3, 4.1_

- [x] **3. Maquetar el menú (solo visual, sin interacción)**
  - Creá `src/components/MainMenu/MainMenu.jsx` y `MainMenu.css`.
  - Fondo con `MENU_BACKGROUND` + velo + `image-rendering: pixelated`.
  - Título, subtítulo, las 3 opciones como `<button>`, y la ayuda de controles.
  - Fallback de color sólido si el fondo no carga.
  - Montalo temporalmente en `App.jsx` para verlo.
  - _Requisitos: 1.2, 1.3, 1.4, 6.3_

- [x] **4. Foco y navegación por teclado**
  - Creá `src/components/MainMenu/useMainMenu.hook.js`.
  - `focusedIndex` arranca en 0 (`JUGAR`).
  - `ArrowUp` / `ArrowDown` con wrap-around. `Enter` / `Space` activan.
  - `onMouseEnter` de cada botón mueve el foco.
  - La opción enfocada se distingue: caret `▶` + color `#ffd94a`.
  - Toda la lógica en el hook. `MainMenu.jsx` solo JSX.
  - _Requisitos: 5.1, 5.2, 5.3, 5.4, 5.5_

- [x] **5. Panel de CÓMO SE JUEGA y CRÉDITOS**
  - Creá `src/components/MainMenu/MenuPanel.jsx` y `MenuPanel.css`.
  - Un solo componente, recibe por props qué contenido mostrar.
  - `Escape` y el botón VOLVER cierran.
  - **Verificá el bug clásico:** con el panel abierto, las flechas y el Enter NO deben mover ni activar el menú de atrás.
  - _Requisitos: 3.1, 3.2, 3.3, 3.4, 4.1, 4.2_

- [x] **6. Enganchar con el juego**
  - `App.jsx`: `useState` para `started`, `<MainMenu onStart={...} />` cuando es `false`.
  - `<BattlePage initialState={GAME_STATES.INTRO} />` cuando es `true`.
  - `initialState` ya está soportado de punta a punta (`App` → `BattlePage` → `GameCanvas` → `GameEngine`). No tenés que tocar nada del motor.
  - _Requisitos: 1.1, 2.1, 2.2, 2.3, 2.4_

- [x] **7. Responsive**
  - Probá a 1280px y a 768px. Sin scroll horizontal, todo legible y clickeable.
  - _Requisitos: 6.1, 6.2_

- [x] **8. Repaso final antes de pedir merge**
  - [x] Cero estilos inline (salvo valores calculados).
  - [x] Cero strings o números mágicos: todo sale de `MAIN_MENU.js`.
  - [x] `MainMenu.jsx` y `MenuPanel.jsx` no tienen `useState` ni `useEffect` — eso vive en el hook.
  - [x] El listener de `keydown` tiene su cleanup en el `return` del `useEffect`.
  - [x] Los archivos que modificaste son exactamente: `src/App.jsx`. Nada más. Confirmalo con `git status`.
  - [x] El combate sigue jugable de punta a punta después de apretar JUGAR.
  - [x] `npm run dev` sin warnings nuevos en consola.

---

## Cierre — implementado en `main`

Nicolás no llegó a tomar el spec (`feature/nicolas` quedó en 0 commits sobre `main`), así que se
implementó tal cual está escrito. Dos desvíos, los dos a conciencia:

1. **Se agregó el elenco a la portada.** El héroe abajo a la izquierda y el pingüino abajo a la
   derecha, con respiración por CSS. No es arte nuevo — son `hero_front_128` y `penguin_128`, que ya
   estaban. Van en las esquinas bajas porque ahí el fondo tiene suelo vacío y no compiten con el
   logo ni con los botones. `reference.png` no los tiene: la imagen quedó desactualizada.
2. **El menú vive en un "stage" 16:9 con la misma fórmula de tamaño que `.game-canvas`.** Sin eso,
   el menú ocupaba todo el viewport y el canvas sólo un rectángulo en el medio, así que apretar
   JUGAR daba un salto de layout. Ocupando el mismo rectángulo el corte es limpio, y de paso los
   porcentajes reproducen la composición de `reference.png` en cualquier viewport.

Una duplicación aceptada: la ruta de `menu_button.png` está en `MAIN_MENU.js` **y** en el
`background-image` del CSS. El CSS no puede leer una constante de JS sin pasar por una custom
property, y el `design.md` prescribe justamente ese snippet. Queda así.

> ⚠️ `reference.png` también quedó vieja en el fondo: `scene_island_before.png` se regeneró en
> `153fa49` (*"regenera las 6 vistas de la Isla 0 desde un concepto unico"*), posterior a la imagen.
> El menú usa el asset actual, que es el correcto.

## Si te trabás

1. Releé el `design.md`, sección **Contrato de integración**.
2. Si el problema está fuera de tus archivos → **grupo de WhatsApp, no lo arregles vos.**
3. Nunca hagas `git push --force` ni commitees a `main`.
