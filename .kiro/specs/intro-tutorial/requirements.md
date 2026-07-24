# Requisitos — Escena de Tutorial

**Owner:** Osvaldo · **Rama:** `feature/osvaldo`

## Introducción

Hoy el jugador aprende las mecánicas **perdiendo corazones**: entra al combate sin saber que hay que elegir
una carta según el problema, ni que hay que bloquear con timing. Para un jurado que tiene 5 minutos, eso es
fatal — se frustra en la primera ronda y no llega a ver la parte buena.

Este feature convierte la fase `INTRO` en una **escena caminable propia**: el héroe entra caminando por la
isla oxidada, se encuentra con el pingüino mentor, el pingüino le explica las tres mecánicas en diálogo, y
después el héroe sigue caminando hacia el servidor. Recién ahí arranca el combate.

**Es una escena aparte, NO un overlay sobre la pelea.** El escenario es un lugar distinto: `A-1`
(`scene_island_path.png`), un camino a nivel de suelo con la isla oxidada de fondo y el servidor todavía
lejos, en el horizonte. No es la arena del combate.

## ⚠️ Dependencia bloqueante

Este feature **necesita el asset A-1**, que todavía no existe. Lo genera Jorge — ver
[`../ASSETS.md`](../ASSETS.md).

**Podés arrancar sin él:** el fondo se dibuja con un color plano de la paleta hasta que A-1 esté listo. Todo
lo demás (caminata, diálogo, transición) se desarrolla y se prueba igual. Pero **no se da por terminado**
hasta que el fondo real esté integrado.

## ⚠️ El tutorial NO le pide al jugador que aprenda a caminar

La caminata es **cinemática**: el héroe entra y sale solo, sin input. La única tecla que el jugador usa en
toda la escena es **`ESPACIO`**, para avanzar el diálogo.

Eso es deliberado, y por dos razones:

1. **`ESPACIO` es la tecla que importa.** Es la que usa para avanzar diálogos Y para bloquear en el combate.
   El tutorial le enseña esa tecla **usándola**, que es la única forma en que la gente aprende un control.
2. **Controlar la caminata exigiría meter mano en el input del motor.** `GameEngine.handleKeyDown` ya maneja
   teclado por fase y agregarle movimiento libre, con sus bordes y colisiones, es la forma más rápida de
   romper el combate a 2 días de la entrega.

**No agregues movimiento controlado por el jugador.** Si el escenario pide más vida, se resuelve con
animación, no con input.

---

## Requisito 1 — El héroe entra caminando

**Historia:** Como jugador, quiero ver a mi personaje llegar a la isla, para entender dónde estoy y quién soy.

### Criterios de aceptación

1. WHEN el juego entra en la fase `INTRO` THEN el sistema SHALL dibujar la escena del camino de la isla, con el héroe fuera del borde izquierdo de la pantalla.
2. WHILE el héroe está entrando THE SYSTEM SHALL desplazarlo horizontalmente hacia su posición de encuentro, a velocidad constante.
3. WHILE el héroe se desplaza THE SYSTEM SHALL animar su ciclo de caminata con los 6 frames de `hero_walk_1..6`, en bucle.
4. WHEN el héroe llega a la posición de encuentro THEN el sistema SHALL detenerlo, cambiarlo al sprite quieto de perfil y arrancar el diálogo.
5. WHILE el héroe camina THE SYSTEM SHALL apoyar sus pies sobre la línea de piso del fondo, sin flotar ni hundirse.

## Requisito 2 — El pingüino explica las mecánicas

**Historia:** Como jugador nuevo, quiero que alguien me explique cómo se juega antes de que me ataquen.

### Criterios de aceptación

1. WHEN arranca el diálogo THEN el sistema SHALL dibujar al pingüino mentor en la escena, a la derecha del héroe y mirándolo.
2. WHEN arranca el diálogo THEN el sistema SHALL mostrar la caja de diálogo con la primera línea y el nombre del que habla.
3. WHILE el diálogo está activo THE SYSTEM SHALL recorrer, en orden, líneas que cubran las tres cosas que el jugador necesita saber: **(a)** que el Legacy Server ya no da abasto y hay que enfrentarlo, **(b)** que a cada problema se responde eligiendo la característica de la nube que lo resuelve, con `1-4` o clic, y **(c)** que el ataque se bloquea apretando `ESPACIO` en el momento justo, y que más precisión carga más el especial.
4. WHEN el jugador presiona `ESPACIO` THEN el sistema SHALL avanzar a la línea siguiente.
5. WHILE el diálogo está activo THE SYSTEM SHALL mostrar el indicador de "continuar" parpadeante que ya usa el juego.
6. WHILE el pingüino habla THE SYSTEM SHALL animarlo de alguna forma perceptible, para que la escena no se sienta congelada.

## Requisito 3 — El héroe se va y arranca el combate

**Historia:** Como jugador, quiero que la transición al combate se sienta como una consecuencia de la escena, no como un corte.

### Criterios de aceptación

1. WHEN se termina la última línea de diálogo THEN el sistema SHALL ocultar la caja de diálogo y hacer que el héroe camine hacia el borde derecho.
2. WHILE el héroe se va THE SYSTEM SHALL animar de nuevo el ciclo de caminata.
3. WHEN el héroe sale de la pantalla THEN el sistema SHALL arrancar la primera ronda del combate.
4. WHEN arranca el combate THEN el sistema SHALL dejar el estado del juego exactamente como lo dejaba antes de este feature — mismos corazones, mismo especial, misma ronda.

## Requisito 4 — Se puede saltear

**Historia:** Como jurado que ya vio el juego, o como desarrollador probando el combate cincuenta veces, quiero saltarme la escena.

### Criterios de aceptación

1. WHILE la escena de tutorial está activa THE SYSTEM SHALL mostrar un aviso discreto de que se puede saltear, en una zona que no tape al héroe, al pingüino ni la caja de diálogo.
2. WHEN el jugador presiona la tecla de saltear THEN el sistema SHALL terminar la escena y arrancar la primera ronda de inmediato.
3. WHEN el jugador saltea THEN el sistema SHALL dejar el estado del juego idéntico al que habría quedado viendo la escena completa.
4. WHEN el jugador presiona la tecla de saltear THEN el sistema SHALL NO interferir con las teclas que el motor ya usa (`ESPACIO`, `1`-`4`, `R`, flechas).

## Requisito 5 — El reinicio funciona

**Historia:** Como jugador, cuando aprieto `R` quiero volver a un estado consistente.

### Criterios de aceptación

1. WHEN el jugador presiona `R` durante la escena THEN el sistema SHALL reiniciar la partida sin quedar trabado en la escena.
2. WHEN el jugador presiona `R` después de la escena THEN el sistema SHALL reiniciar al estado inicial que corresponda, con la escena en su estado inicial y no a mitad de camino.

## Requisito 6 — No rompe nada de lo que ya funciona

**Historia:** Como equipo, no podemos permitirnos que el combate deje de funcionar a 2 días de la entrega.

### Criterios de aceptación

1. WHEN la escena de tutorial termina THEN el sistema SHALL entregar el control al combate por el mismo camino que usa hoy.
2. WHEN el feature está integrado THEN el sistema SHALL NO modificar las reglas de combate, ni el manejo de input existente, ni el HUD.
3. WHEN el feature está integrado THEN el sistema SHALL mantener el juego jugable de punta a punta: escena → 4 rondas → remate → victoria.
4. WHILE la escena está activa THE SYSTEM SHALL NO dibujar el HUD de combate (corazones, especial, indicador de ronda).
5. IF el fondo de la escena no está cargado THEN el sistema SHALL dibujar un color plano de la paleta y seguir funcionando.
6. IF los frames de caminata no están cargados THEN el sistema SHALL usar el sprite quieto y seguir funcionando.

---

## Fuera de alcance (NO lo construyas)

- **Movimiento controlado por el jugador.** Explicado arriba.
- Coach marks u overlays de ayuda **durante** el combate. Eso era el diseño anterior y quedó descartado: el tutorial es esta escena y nada más.
- Scroll de cámara o parallax. El fondo es una imagen fija de 640×360.
- NPCs, objetos recogibles, ramas de diálogo, o cualquier cosa que se elija.
- Voces, música propia de la escena, o cinemática de más de ~20 segundos.
- Persistir en `localStorage` que el jugador ya la vio.
- Tocar `battleLogic.js` más allá del único caso que dice el diseño.
