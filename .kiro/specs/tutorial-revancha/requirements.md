# Requisitos — Tutorial Guiado + Revancha

**Rama:** `feature/tutorial-revancha` · **Entrega:** lunes 27

## Introducción

Hoy el juego tiene un problema de estructura, no de contenido: **la primera pelea ES el juego entero.**
Vencés al Legacy Server una vez y se terminó. Y el "tutorial" (`INTRO_SCENE.js`) son cinco líneas de
diálogo del pingüino que explican la mecánica **en texto**, antes de que el jugador haya tocado una sola
carta. Nadie aprende así.

El síntoma concreto, reportado jugando: aparece *"¡Llegaron 100.000 usuarios DE GOLPE!"*, el jugador mira
cuatro cartas que dicen `Rapid Elasticity`, `Self-Service`, `Network Access` y `Resource Pooling` — **y
nada más**. `CARDS.js` no tiene una sola línea que explique qué hace cada carta ni qué ataque bloquea. El
jugador adivina, pierde un corazón, y el pingüino le explica **después**. Eso no es dificultad, es una
interfaz incompleta.

Este feature reestructura el juego en **dos peleas contra el mismo jefe**, al estilo Mortal Kombat: una
primera pelea guiada que enseña jugando, y una revancha sin ayudas que es el juego de verdad.

```
LOAD → TITLE → INTRO (2 líneas, solo narrativa)
   ├─ [TUTORIAL]  PROBLEM→CHOOSE→TIMING→RESOLVE→EXPLAIN  ×4
   ├─ TUTORIAL_CLEAR   el jefe cae... y se reinicia
   ├─ REMATCH_INTRO    "FASE 2 — sin ayudas"
   ├─ [REMATCH]   PROBLEM→CHOOSE→TIMING→RESOLVE(→EXPLAIN solo si falló)  ×4+
   └─ FINISH_LINE → FINISH_ANIM → VICTORY
```

**No se agrega contenido nuevo.** Mismo jefe, mismas 4 cartas, mismos 4 problemas, mismo arte. Lo que
cambia es cuánto te ayuda el juego y cuánto te aprieta.

## ⚠️ Esto revierte una decisión anterior, a propósito

[`intro-tutorial/requirements.md`](../intro-tutorial/requirements.md) declara fuera de alcance:

> *"Coach marks u overlays de ayuda durante el combate. Eso era el diseño anterior y quedó descartado: el
> tutorial es esta escena y nada más."*

**Este spec reinstala esa idea, y la línea de arriba queda superada.** No es una contradicción del equipo:
la ayuda en combate se había descartado por tiempo, y jugando quedó claro que la escena de diálogo sola no
alcanza. La diferencia con el diseño viejo es que ahora la ayuda **está confinada a la pelea tutorial** y
desaparece por completo en la revancha.

## ⚠️ El brillo pasó a estar en las 4 rondas — y esto revierte lo que decía este mismo spec

**Versión original de esta sección:** *"La tentación es señalar la carta correcta en los 4 problemas. No se
hace, y es deliberado: si la carta brilla, el jugador sigue la luz y no razona nunca. El brillo aparece una
única vez en todo el juego — problema 1 del tutorial."*

**Eso quedó superado, jugándolo.** El brillo ahora marca la carta correcta en las **cuatro** rondas del
tutorial y se apaga por completo en la revancha.

El razonamiento original era correcto **para el diseño que existía cuando se escribió**: en ese momento el
brillo era la única ayuda, y un brillo suelto sí produce un jugador que sigue la luz. Lo que cambió es que la
lectura de la ficha dejó de ser una sugerencia y pasó a ser un **paso obligatorio en todas las rondas** — no
se puede jugar una carta sin abrir su panel primero (requisito 3.2). Con eso el brillo dice **CUÁL** y la
ficha dice **POR QUÉ**, que es una demostración y no un atajo.

**Lo que se paga, explícitamente:** el tutorial ya no tiene ningún momento en el que el jugador resuelva un
problema por su cuenta. La primera vez que razona sin ayuda es la revancha, en frío y contra reloj. Se acepta
a cambio de que el tutorial enseñe de verdad las cuatro características en vez de tres a la adivinanza.

**La regla que sigue en pie, y es la importante:** ninguna ayuda sobrevive a la revancha. Ni brillo, ni panel
obligatorio, ni ausencia de castigo.

---

## Requisito 1 — Dos fases sobre la misma máquina de estados

**Historia:** Como equipo, necesitamos dos comportamientos de combate sin duplicar pantallas ni lógica, a
dos días de la entrega.

### Criterios de aceptación

1. WHEN arranca una partida nueva THEN el sistema SHALL poner la fase de combate en `TUTORIAL`.
2. WHILE una fase está activa THE SYSTEM SHALL leer de un único origen de configuración todos los
   parámetros que difieren entre fases: límite de tiempo, castigo por carta equivocada, guía del primer
   problema (brillo y panel obligatorio, que van siempre juntos), cuándo explica el mentor, si `PROBLEM`
   espera input, velocidad del ataque y si el especial dispara el remate.
3. WHEN el sistema cambia de fase THEN el sistema SHALL reutilizar las mismas pantallas de combate
   (`PROBLEM`, `CHOOSE`, `TIMING`, `RESOLVE`, `EXPLAIN`) sin crear variantes duplicadas.
4. WHEN el sistema cambia de fase THEN el sistema SHALL notificar el cambio a React por el mismo callback
   discreto que ya usa (`onScreenChange`), sin agregar updates dentro del loop.

## Requisito 2 — Las cartas dicen qué hacen

**Historia:** Como jugador, quiero poder leer qué hace una carta **antes** de apostarle un corazón.

### Criterios de aceptación

1. WHEN se define una carta THEN el sistema SHALL incluir su nombre en español, una descripción de qué hace
   la característica, y qué **tipo de ataque bloquea**.
2. WHILE la fase `CHOOSE` está activa THE SYSTEM SHALL dibujar en cada carta un indicador visible de que su
   información se puede consultar.
3. WHEN el jugador presiona la tecla de información THEN el sistema SHALL abrir el panel de la carta
   actualmente seleccionada.
4. WHEN el jugador hace clic en el indicador de una carta THEN el sistema SHALL abrir el panel de **esa**
   carta, sin elegirla ni consumirla.
5. WHILE el panel está abierto THE SYSTEM SHALL mostrar el nombre en español, la descripción y el tipo de
   ataque que bloquea, y SHALL indicar cómo se cierra.
6. WHEN el jugador cierra el panel THEN el sistema SHALL devolverlo a `CHOOSE` con la misma carta
   seleccionada y sin haber alterado corazones, especial ni cartas descartadas.
7. WHILE el panel está abierto THE SYSTEM SHALL seguir dibujando la escena de combate detrás, atenuada.
8. WHEN el panel se dibuja THEN el sistema SHALL hacerlo **dentro del canvas**, y SHALL NO introducir
   ningún elemento DOM por encima del canvas.

## Requisito 3 — El tutorial entero enseña el gesto

**Historia:** Como jugador nuevo, quiero que el juego me muestre cómo se resuelve cada problema, en lugar de
explicármelo en un texto que leo antes de entender el contexto.

### Criterios de aceptación

1. WHILE la fase es `TUTORIAL` THE SYSTEM SHALL resaltar visualmente la carta que resuelve el problema
   actual, en **todos** los problemas de la fase.
2. WHILE la fase es `TUTORIAL` AND el jugador todavía no consultó la información de la carta que intenta
   jugar THEN el sistema SHALL abrir el panel de **esa** carta en lugar de jugarla, y SHALL NO consumir el
   turno ni descartarla. Aplica tanto a la carta correcta como a las equivocadas: leerlas es cómo el jugador
   descubre que no resuelven este problema.
3. WHEN el jugador ya consultó la información de una carta en la ronda actual THEN el sistema SHALL
   permitirle jugarla con normalidad, desde el propio panel o desde la fila de cartas.
4. WHEN el sistema empieza una ronda THEN el sistema SHALL olvidar qué fichas se consultaron, de modo que la
   lectura se vuelva a pedir en cada problema. Leer una característica en el problema 1 no dice nada sobre si
   sirve para el problema 3, y descartarla es justamente lo que hay que aprender.
5. WHILE la fase es `REMATCH` THE SYSTEM SHALL NO resaltar ninguna carta en ningún problema, y SHALL NO
   obligar a consultar información.

## Requisito 4 — El tutorial no castiga

**Historia:** Como jugador, quiero equivocarme mientras aprendo sin que el juego me cobre por explorar.

### Criterios de aceptación

1. WHILE la fase es `TUTORIAL` AND el jugador elige una carta equivocada THEN el sistema SHALL descartar esa
   carta y mostrar el aviso correspondiente, y SHALL NO restar un corazón.
2. WHILE la fase es `TUTORIAL` THE SYSTEM SHALL NO aplicar límite de tiempo para elegir carta, y SHALL NO
   dibujar el temporizador.
3. WHILE la fase es `TUTORIAL` THE SYSTEM SHALL mantener el castigo por bloqueo fallado tal como está hoy:
   el ataque impacta al héroe y el mentor lo señala, sin restar corazón por la elección.
4. WHILE la fase es `TUTORIAL` THE SYSTEM SHALL explicar la característica al terminar cada problema,
   acertado o no.
5. WHILE la fase es `TUTORIAL` THE SYSTEM SHALL NO disparar el remate por especial lleno, aunque el
   jugador bloquee los cuatro ataques perfecto.
6. WHEN el jugador completa los cuatro problemas del tutorial THEN el sistema SHALL pasar a la pantalla de
   tutorial superado.

## Requisito 5 — La revancha es el juego

**Historia:** Como jugador que ya entendió, quiero una pelea que no me frene y que me exija.

### Criterios de aceptación

1. WHEN arranca la revancha THEN el sistema SHALL reponer los corazones al máximo y poner el especial y el
   contador de *perfects* en cero.
2. WHEN arranca la revancha THEN el sistema SHALL presentar los cuatro problemas en **orden aleatorio**.
3. WHILE la fase es `REMATCH` THE SYSTEM SHALL aplicar el límite de tiempo de la fase para elegir carta, y
   SHALL dibujar el temporizador.
4. WHILE la fase es `REMATCH` AND el jugador elige una carta equivocada THEN el sistema SHALL restar un
   corazón.
5. WHILE la fase es `REMATCH` THE SYSTEM SHALL avanzar de `PROBLEM` a `CHOOSE` automáticamente al cumplirse
   la espera mínima, sin pedir input.
6. WHILE la fase es `REMATCH` AND el jugador resolvió el problema sin errar carta ni fallar el bloqueo THEN
   el sistema SHALL encadenar directamente al problema siguiente, **sin pantalla de explicación y sin pedir
   input**.
7. WHILE la fase es `REMATCH` AND el jugador erró alguna carta O falló el bloqueo THEN el sistema SHALL
   mostrar la explicación de esa característica antes de continuar.
8. WHILE la fase es `REMATCH` THE SYSTEM SHALL aplicar el multiplicador de velocidad de ataque de la fase.
9. WHILE el panel de información está abierto AND la fase es `REMATCH` THE SYSTEM SHALL seguir descontando
   el temporizador de elección.
10. WHILE la fase es `REMATCH` AND el especial llega al máximo THEN el sistema SHALL disparar el remate tal
    como lo hace hoy.

## Requisito 6 — Reiniciar no te devuelve al tutorial

**Historia:** Como jugador que perdió en la revancha, quiero reintentar la revancha, no volver a hacer el
tutorial.

### Criterios de aceptación

1. WHEN el jugador presiona `R` AND todavía no superó el tutorial THEN el sistema SHALL reiniciar al estado
   inicial de la partida, en fase `TUTORIAL`.
2. WHEN el jugador presiona `R` AND ya superó el tutorial THEN el sistema SHALL reiniciar directamente en la
   antesala de la revancha, en fase `REMATCH`.
3. WHEN el sistema reinicia THEN el sistema SHALL dejar el panel de información cerrado y el registro de
   información consultada en su estado inicial de la fase que corresponda.
4. WHEN el sistema reinicia THEN el sistema SHALL dejar la escena de introducción en su estado inicial y no
   a mitad de camino.

## Requisito 7 — La introducción deja de explicar mecánicas

**Historia:** Como jugador, no quiero que me expliquen en texto algo que el juego está por enseñarme
jugando.

### Criterios de aceptación

1. WHEN se muestra la escena de introducción THEN el sistema SHALL limitar el diálogo del mentor al contexto
   narrativo: qué es el Legacy Server y por qué hay que enfrentarlo.
2. WHEN se muestra la escena de introducción THEN el sistema SHALL NO explicar cómo se eligen las cartas, ni
   cómo se bloquea, ni cómo se carga el especial. Eso lo enseña la pelea tutorial.
3. WHEN se acorta el diálogo THEN el sistema SHALL mantener intactos el resto de la escena: caminata de
   entrada, animación del mentor, caminata de salida, tecla de saltear y efecto de tipeo.

## Requisito 8 — No rompe nada de lo que ya funciona

**Historia:** Como equipo, a dos días de la entrega no podemos permitirnos que el combate deje de funcionar.

### Criterios de aceptación

1. WHEN el feature está integrado THEN el sistema SHALL mantener el juego jugable de punta a punta:
   introducción → tutorial → antesala → revancha → remate → victoria.
2. WHEN el feature está integrado THEN el sistema SHALL mantener funcionando la derrota por corazones
   agotados y su reinicio.
3. WHEN el feature está integrado THEN el sistema SHALL NO modificar el HUD, la barra de vida del jefe, la
   pantalla de título ni el menú.
4. WHEN el feature está integrado THEN el sistema SHALL NO importar React, hooks ni el store desde ningún
   archivo de `src/game/`.
5. WHEN el feature está integrado THEN el sistema SHALL mantener el input existente funcionando en todas las
   fases: `ESPACIO`, `1`-`4`, flechas, clic, `R` y la tecla de saltear.
6. IF una carta no tiene textos de información definidos THEN el sistema SHALL abrir el panel con el nombre
   disponible y seguir funcionando, sin lanzar error.

---

## Fuera de alcance (NO lo construyas)

- **Jefe nuevo, cartas nuevas o problemas nuevos.** La revancha reusa los cuatro que ya existen. Evaluado y
  descartado por tiempo: la Isla 1 sigue siendo `🔒 Próximamente`.
- **Modo *survival* infinito.** Evaluado y descartado: agota el aprendizaje en dos minutos.
- **Explicación como texto flotante durante el combate.** Evaluado y descartado: nadie lee teoría en medio
  de la acción, así que equivale a no explicar.
- Tercera fase, o dificultad seleccionable.
- Persistir en `localStorage` que el tutorial ya se superó. `R` alcanza para lo que necesitamos.
- Panel de información como componente React. Va en canvas — convenciones 5 y 9.
- Rebalancear la vida del jefe, los corazones máximos o las ganancias de especial.
- Arte nuevo. Este spec no pide un solo asset.
