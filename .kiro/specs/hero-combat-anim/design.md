# Pose de pelea y ataque supremo

**Estado:** implementado · **Rama:** `main`

## Problema

Dos cosas, y la primera se ve en cada frame de combate.

1. **El héroe posaba para la foto.** `drawHero` dibujaba siempre `hero_front_128.png`: un sprite
   de frente, brazos al costado, cara neutra. El jefe está en `x=320` y el héroe en `x=78`, o sea
   que el pibe pasaba la pelea entera mirando a cámara mientras lo atacaban desde la derecha.
2. **El remate no era un remate.** `FINISH_ANIM` hacía crecer una nube blanca gigante detrás del
   héroe y nada más. El jugador cargaba la barra especial durante cuatro bloqueos perfectos y el
   pago era un círculo blanco.

## Decisión de diseño: el rayo es de la NUBE, no del héroe

El pedido fue "un Kamehameha". Se hizo el **gesto** de Kamehameha, pero lo que dispara es la nube,
y eso no es un detalle decorativo:

- La única línea del héroe en todo el juego es `HERO_FINISHER`: *"Encontré una forma mejor."*
- El pingüino se lo dice en la intro: *"No lo vas a vencer a golpes."*

Un rayo de energía propia contradice las dos. Por eso el rayo es **blanco y cyan**, no naranja de
ki; la nube crece detrás del héroe mientras carga y se descarga cuando dispara; y el cartel sigue
diciendo `☁ LA NUBE RESPONDE ☁`. Se gana el momento sin romper la premisa.

## Requisitos

1. En los estados de combate el héroe SHALL mostrarse en guardia, mirando al jefe.
2. En `TITLE` y `VICTORY` SHALL seguir usando el sprite de frente. Ahí sonreír está bien.
3. Si los sprites de combate no cargan, el fallback SHALL ser `hero_side` y NO `hero_front`:
   el peor caso aceptable sigue siendo un héroe que mira al jefe.
4. El remate SHALL tener tres tiempos legibles: carga, disparo, desintegración.
5. El rayo SHALL salir de las manos del héroe, no de su torso ni de su cabeza.
6. El remate SHALL correr sin HUD.

## Arquitectura

| Archivo | Qué hace |
|---|---|
| `constants/FINISHER.js` | todos los números del remate |
| `game/battle/finisher.js` | sub-máquina `CHARGE -> FIRE` + geometría exportada |
| `game/render/drawFinisher.js` | nube, orbe y rayo procedural |
| `game/render/drawScene.js` | `heroSprite()`: selector de sprite por estado |
| `game/fx/effects.js` | `implode()`: partículas que convergen |

La sub-máquina vive en `G.finisher` y sigue el patrón de `introScene`: `reset()` recrea `G`, así
que el remate se re-inicializa limpio sin que `GameEngine` sepa qué campos tiene adentro.

**El rayo es 100% procedural, cero assets.** Se dibuja en espacio rotado (translate al origen +
rotate al ángulo del jefe) con tres barras de borde ondulado, de afuera hacia adentro, más un
adelgazamiento cerca del origen para que parezca salir de las manos.

## Números medidos, no estimados

`BEAM_FROM` y `ORB_FROM` salen de medir el **centroide de los píxeles de piel** en
`hero_fire_1.png` y `hero_charge_1.png`, convertido a canvas con la escala real de dibujado
(sprite de 128 pintado a 96 → factor 0.75).

| Constante | Estimado a ojo | Medido | Error |
|---|---|---|---|
| `BEAM_FROM` | `{dx: 34, dy: -28}` | `{dx: 32, dy: -12}` | el rayo salía 16 px sobre las manos |
| `ORB_FROM` | `{dx: -4, dy: -24}` | `{dx: -15, dy: 9}` | el orbe flotaba 20 px afuera de las manos |

**Si se regeneran los sprites, hay que volver a medir.** `scripts/gen_hero_combat.sh` lo avisa al
terminar.

## Lecciones del arte — tres intentos

| Intento | Qué se le pasó | Resultado |
|---|---|---|
| 1 | descripción de texto, sin referencia | otro chico: proporción adolescente, sombreado con pliegues, sin el cuadradito naranja |
| 2 | referencias + lista larga de reglas de estilo | muñeco de tubos con contorno grueso, y los puños salieron como cuadrados naranjas |
| 3 | referencias + prompt corto hablando SOLO de la pose | **en modelo** |

**La lección: los adjetivos de estilo pelean contra la imagen de referencia.** Cuando hay
referencia adjunta, el prompt tiene que hablar de la pose y callarse sobre el estilo. El estilo lo
define la imagen.

Y un detalle de empaquetado que también costó: `postprocess.py --trim` recorta **cada** imagen por
su propio contenido. La pose de disparo mide 501 px de ancho y la de guardia 385, así que
recortadas por separado quedan con escalas distintas y el personaje salta de tamaño entre frames.
Para eso está `scripts/pack_sprite_set.py`, que calcula el bbox **unión** del set y recorta todo
con el mismo box.

## Juice que casi no cuesta

Cuatro líneas en `heroOffsetX` y son lo que hace que el bloqueo se sienta:

- `windup` → el héroe retrocede 2 px (se planta)
- `reflect` → avanza 3 px (se tira adelante)
- `FIRE` → retrocede 7 px (retroceso del disparo)

## Verificado

- Los 40 caminos de dibujo (14 estados × 2 fases + modal + 6 pasos de intro + 2 del remate) sin excepciones.
- `FINISH_LINE` + ESPACIO → `CHARGE` 1.40 s → `FIRE` → `VICTORY` a los 3.12 s, `bossGone` en 1.000,
  6 explosiones (una por `BOOM_EVERY`, no una por frame).
- Con los cinco sprites ausentes el juego sigue jugable y cae a `hero_side`.
