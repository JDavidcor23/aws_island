# Requisitos — Barra de Vida del Jefe

**Owner:** Jennifer · **Rama:** `feature/jennifer`

## Introducción

Hoy el jugador ve sus 4 corazones y su barra especial, pero **el jefe no tiene ninguna representación
de daño**. Pega y recibe golpes sin que nada cambie en pantalla, así que el combate no se siente
como que estás ganando.

Este feature agrega una **barra de vida del Legacy Server sobre su cabeza**, dibujada en canvas.

## ⚠️ Leé esto antes de empezar: la barra NO es una condición de victoria

Según el diseño del juego (`CLOUD_QUEST.md` §5), **el jefe NO cae por perder vida**. Cae cuando la
**barra especial del jugador se llena** y se dispara el remate. Esa es la única condición de victoria y
**no la vas a cambiar**.

Entonces, ¿qué representa esta barra? **El progreso del combate.** Cada problema que el jugador resuelve
le saca visiblemente un pedazo al jefe. Es un espejo de `G.round`, en modo **solo lectura**.

| Barra | Qué significa | De dónde sale |
|---|---|---|
| Corazones | Tu vida | `G.hearts` |
| Barra especial | Qué tan cerca está tu remate | `G.special` |
| **Barra del jefe (esta)** | **Cuánto avanzaste en el combate** | **`G.round` (solo lectura)** |

Las tres dicen cosas **distintas**. Si la barra del jefe fuera un espejo invertido de la especial, sería
ruido en pantalla. No lo es.

**Por eso este feature NO agrega estado nuevo al juego y NO toca `battleLogic.js`.** Si en algún momento
sentís que necesitás modificar la lógica de combate, pará y preguntá en el grupo: te estás yendo del alcance.

---

## Requisito 1 — La barra existe y refleja el progreso

**Historia:** Como jugador, quiero ver que el jefe se debilita cuando resuelvo un problema, para sentir que voy ganando.

### Criterios de aceptación

1. WHEN el combate está activo THEN el sistema SHALL dibujar una barra de vida sobre la cabeza del jefe, con el rótulo `LEGACY SERVER`.
2. WHEN el combate empieza THEN el sistema SHALL mostrar la barra al 100%.
3. WHEN el jugador resuelve un problema y avanza de ronda THEN el sistema SHALL bajar la barra un cuarto (25%).
4. WHILE el combate está activo THE SYSTEM SHALL mantener la barra en un mínimo de 25% — nunca llega a cero por rondas resueltas.
5. WHEN la barra cambia de valor THEN el sistema SHALL animar la transición, no saltar de golpe.
6. WHEN la barra está en su mínimo (25%) THEN el sistema SHALL pulsarla para avisar que el remate está cerca.

> El punto 4 es la traducción visual del diseño: el jefe **no muere por daño de rondas**. El último cuarto
> se lo saca el remate.

## Requisito 2 — El remate la vacía

**Historia:** Como jugador, quiero ver la barra del jefe reventar durante el remate, porque ahí es donde realmente cae.

### Criterios de aceptación

1. WHEN el juego entra en la fase `FINISH_ANIM` THEN el sistema SHALL vaciar la barra progresivamente hasta 0 a lo largo de la animación.
2. WHEN la barra llega a 0 THEN el sistema SHALL dejar de dibujarla.

## Requisito 3 — Aparece solo cuando corresponde

**Historia:** Como jugador, no quiero ver la barra de un jefe que no está en pantalla.

### Criterios de aceptación

1. WHILE `G.state` es una de las fases de combate (`PROBLEM`, `CHOOSE`, `TIMING`, `RESOLVE`, `EXPLAIN`, `FINISH_LINE`, `FINISH_ANIM`) THE SYSTEM SHALL dibujar la barra.
2. WHILE `G.state` es `LOAD`, `TITLE`, `INTRO`, `VICTORY` o `DEFEAT` THE SYSTEM SHALL NO dibujar la barra.
3. IF el sprite del jefe no está cargado THEN el sistema SHALL NO dibujar la barra.

## Requisito 4 — No tapa nada de lo que ya está

**Historia:** Como jugador, quiero seguir viendo mis corazones, mi especial, el contador de ronda y los diálogos.

### Criterios de aceptación

1. WHEN la barra se dibuja THEN el sistema SHALL NO superponerse con los corazones (`x` 12..126, `y` 10..36).
2. WHEN la barra se dibuja THEN el sistema SHALL NO superponerse con la barra especial (`x` 10..205, `y` 42..80).
3. WHEN la barra se dibuja THEN el sistema SHALL NO superponerse con el indicador de ronda (esquina superior derecha).
4. WHEN la barra se dibuja THEN el sistema SHALL NO superponerse con la caja de diálogo (`y` 232..354).
5. WHEN la barra se dibuja THEN el sistema SHALL quedar por encima del sprite del jefe, nunca detrás.

## Requisito 5 — El reinicio la resetea

**Historia:** Como jugador, cuando aprieto `R` quiero empezar limpio.

### Criterios de aceptación

1. WHEN el jugador reinicia la partida THEN el sistema SHALL volver a mostrar la barra al 100%.
2. WHEN el jugador reinicia THEN el sistema SHALL NO conservar el valor animado de la partida anterior.

---

## Fuera de alcance (NO lo construyas)

- Vida real del jefe como segunda condición de victoria. **No.**
- Números de daño flotando sobre el jefe (`effects.addFloat` ya existe para eso, no es este feature).
- Modificar `battleLogic.js`, `TIMING.js`, `LAYOUT.js`, `GAME_STATES.js` ni ningún archivo compartido más allá de los 2 renglones que dice el diseño.
- Sprite nuevo para el marco de la barra. Se dibuja con rectángulos de canvas.
