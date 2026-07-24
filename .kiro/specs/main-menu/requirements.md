# Requisitos — Menú Principal

**Owner:** Nicolás · **Rama:** `feature/nicolas`

## 🖼️ Imagen de referencia — `reference.png`

**Abrí [`reference.png`](./reference.png) antes de escribir código.** Es el objetivo visual de este spec:
está compuesta con los assets REALES del juego, en las coordenadas REALES de las constantes de más abajo.

Si estás ejecutando este spec con una IA, **pasale esa imagen junto con el spec.** Los números están
anotados sobre el dibujo, así que la imagen y el texto no pueden contradecirse.

Muestra el menú con el logo (`logo_cloud_quest.png`), los tres botones (`menu_button.png`) y el fondo,
más la lista de rutas exactas de cada asset.

## Introducción

Hoy el juego arranca directo en la pantalla de título dibujada en canvas (`drawTitleScreen`) y la única
interacción es "ESPACIO para comenzar". No hay menú: el jugador no puede ver los controles antes de jugar
ni saber qué es esto.

Este feature agrega un **menú principal en React/DOM puro** que es la primera pantalla de la app.
Es DOM y no canvas a propósito: es la parte del juego que no necesita el motor, así que se construye
aislada y sin riesgo de romper el combate.

## Glosario

| Término | Significado |
|---|---|
| **Menú** | La pantalla nueva de este spec. React + CSS, sin canvas. |
| **Juego** | El `<canvas>` con el combate, que ya existe. |
| **Fondo** | `scene_island_before.png`, un PNG de 640×360 que ya está en `public/assets/art/_gameready/`. |

---

## Requisito 1 — El menú es la primera pantalla

**Historia:** Como jugador que abre el link por primera vez, quiero ver una portada con opciones claras,
para entender qué es el juego antes de que me ataquen.

### Criterios de aceptación

1. WHEN la app carga THEN el sistema SHALL mostrar el Menú y NO SHALL montar el Juego.
2. WHEN el Menú está visible THEN el sistema SHALL mostrar el título `CLOUD QUEST` y el subtítulo `Isla 0 — Fundamentos de la Nube`.
3. WHEN el Menú está visible THEN el sistema SHALL mostrar exactamente tres opciones, en este orden: `JUGAR`, `CÓMO SE JUEGA`, `CRÉDITOS`.
4. WHEN el Menú está visible THEN el sistema SHALL mostrar `scene_island_before.png` como fondo, escalado para cubrir la pantalla sin deformarse y con pixelado nítido (no suavizado).

## Requisito 2 — Entrar al juego

**Historia:** Como jugador, quiero apretar JUGAR y entrar al combate, sin pasar por una segunda pantalla de título.

### Criterios de aceptación

1. WHEN el jugador activa `JUGAR` THEN el sistema SHALL desmontar el Menú y montar el Juego.
2. WHEN el Juego se monta desde el Menú THEN el sistema SHALL arrancar en la fase `INTRO` (el diálogo del pingüino), NO en `TITLE`.
3. WHEN el Juego está montado THEN el sistema SHALL NO renderizar el Menú por encima.
4. IF el jugador vuelve a cargar la página THEN el sistema SHALL mostrar el Menú de nuevo (no se persiste nada).

## Requisito 3 — Cómo se juega

**Historia:** Como jugador nuevo, quiero leer los controles antes de empezar, para no perder corazones aprendiendo qué tecla es cuál.

### Criterios de aceptación

1. WHEN el jugador activa `CÓMO SE JUEGA` THEN el sistema SHALL mostrar un panel con los controles y la mecánica.
2. WHILE el panel está abierto THE SYSTEM SHALL mostrar, como mínimo: `1-4 o clic` = elegir carta, `ESPACIO` = avanzar diálogo y bloquear, `R` = reiniciar.
3. WHILE el panel está abierto THE SYSTEM SHALL explicar en una línea que la carta correcta se elige por el problema que grita el jefe, y que el bloqueo se acierta por timing.
4. WHEN el jugador activa el cierre del panel OR presiona `Escape` THEN el sistema SHALL volver al Menú con las tres opciones.

## Requisito 4 — Créditos

**Historia:** Como integrante del equipo, quiero que el jurado vea quiénes lo hicimos.

### Criterios de aceptación

1. WHEN el jugador activa `CRÉDITOS` THEN el sistema SHALL mostrar un panel con los nombres del equipo y la mención de que el arte es pixel art generado con IA.
2. WHEN el jugador activa el cierre del panel OR presiona `Escape` THEN el sistema SHALL volver al Menú.

## Requisito 5 — Navegación por teclado

**Historia:** Como jugador, quiero manejar el menú con el teclado, porque el resto del juego se juega con teclado.

### Criterios de aceptación

1. WHEN el Menú se muestra THEN el sistema SHALL dejar `JUGAR` como opción enfocada por defecto.
2. WHEN el jugador presiona `ArrowDown` o `ArrowUp` THEN el sistema SHALL mover el foco a la opción siguiente o anterior, con wrap-around en los extremos.
3. WHEN el jugador presiona `Enter` o `Space` THEN el sistema SHALL activar la opción enfocada.
4. WHEN una opción está enfocada THEN el sistema SHALL distinguirla visualmente de las no enfocadas.
5. WHEN el jugador usa el mouse sobre una opción THEN el sistema SHALL moverle el foco a esa opción.

## Requisito 6 — Se ve bien en la pantalla del jurado

**Historia:** Como jurado, voy a abrir el link en el navegador que tenga a mano.

### Criterios de aceptación

1. WHEN el viewport tiene un ancho de 1280px o más THEN el sistema SHALL mostrar el Menú centrado y completo sin scroll.
2. WHEN el viewport tiene un ancho de 768px THEN el sistema SHALL mantener las tres opciones legibles y accionables sin scroll horizontal.
3. WHEN el fondo no carga THEN el sistema SHALL mostrar un color de fondo sólido de la paleta y mantener el menú usable.

---

## Fuera de alcance (NO lo construyas)

- Selección de islas o niveles. Solo existe la Isla 0.
- Configuración de audio o de dificultad.
- Guardado de progreso, localStorage, backend.
- Animación de transición entre Menú y Juego. Un corte seco está bien.
- Tocar el canvas, el `engine`, `drawScreens.js` o cualquier archivo de `src/game/`.
