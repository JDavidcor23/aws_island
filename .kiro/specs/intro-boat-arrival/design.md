# Llegada en barco

**Estado:** implementado · **Rama:** `main`

## Problema

La intro arrancaba con el héroe ya caminando por la aldea. Nunca se veía **llegar**: aparecía
adentro de la isla sin que el jugador supiera de dónde salió, y el pingüino le hablaba de un lugar
al que aparentemente ya pertenecía.

## Decisión de diseño: dos fondos y un corte a negro

La llegada pasa en el mar y la charla en la aldea, con un corte a negro en el medio. Un corte y no
una escena continua, y no es pereza:

Las líneas de `INTRO_LINES` señalan **cosas que están en pantalla** — el molino roto, el agua verde,
las casas tapiadas, la torre echando humo. `INTRO_SCENE.js` documenta la regla: *ninguna palabra
técnica se nombra sin algo en pantalla que la sostenga.* Ese encuadre sólo existe en
`scene_island_path.png`. Mudar la charla a la playa rompería el diseño narrativo de la Isla 0 para
ganar continuidad de cámara, que es un mal cambio.

Entonces la llegada es una escena **extra**, no un reemplazo. Cuesta un fondo más.

## Requisitos

1. La intro SHALL abrir con el héroe llegando a la isla en barco desde el mar.
2. El bote SHALL desacelerar al entrar. Un bote que llega a velocidad constante y frena de golpe no
   se lee como un bote.
3. El héroe SHALL bajarse al muelle con un salto, no deslizándose.
4. El cambio de la costa a la aldea SHALL pasar con la pantalla completamente negra.
5. Después del corte, `WALK_IN` SHALL comportarse exactamente como antes.
6. `T` (saltear la intro) SHALL funcionar desde los pasos nuevos.
7. `ESPACIO` durante la llegada SHALL adelantar el bote hasta el muelle, no saltear la escena.

## Sub-máquina

```
BOAT_IN (2.6s) -> DISEMBARK (0.75 + 0.45s) -> FADE (1.0s) -> WALK_IN -> TALK -> WALK_OUT
└─────────── scene_island_shore ──────────┘   ↑ cambia acá   └──── scene_island_path ────┘
                                     pantalla en negro
```

`goToStep()` es el único camino para cambiar de paso, y resetea `stepTime` en el mismo frame.
Sin eso el paso nuevo arranca con el tiempo acumulado del anterior y se saltea entero — es el bug
más fácil de cometer con una sub-máquina de tiempos.

El fade es un solo paso con alpha triangular: sube a 1 en la primera mitad, baja en la segunda, y
el fondo cambia en el punto medio. `fadePastMidpoint()` es lo que decide qué fondo se pinta.

## Geometría medida sobre `scene_island_shore.png`

Los valores de Y no son estimados. Salen de recorrer el PNG buscando la madera del muelle y el
primer píxel de agua por columna:

| Qué | Valor | Cómo se midió |
|---|---|---|
| Cubierta del muelle | `y=252` | densidad de píxeles de madera máxima entre `y=246` y `y=262` |
| Extensión del muelle | `x=170..336` | misma pasada |
| Línea de agua del bote | `y=318` | agua de primer plano, debajo del muelle |
| Aterrizaje | `(268, 252)` | sobre las tablas, dentro del rango del muelle |

La geometría del bote y del salto se exporta desde `introScene.js` (`boatX`, `heroBoatPos`) y la
consume `drawIntroScene`. Con las cuentas duplicadas en los dos lados, el día que se tunee `DOCK_X`
el héroe salta desde un bote que ya no está ahí.

El salto usa una parábola invertida (`4p(1-p)`): sin altura de arco el héroe se desliza en diagonal
y no se lee como un salto.

## Artefacto del generador — y por qué existe `patch_solid_block.py`

Al fondo se le pidió que la esquina superior derecha quedara "oscura y vacía" para poner el hint de
saltear encima. Lo devolvió **literal**: un rectángulo de color liso `(35,29,44)` de 120×40 con
bordes rectos, que en pantalla se lee como un tile que falta.

`scripts/patch_solid_block.py` lo detecta por color modal desde la esquina y lo tapa clonando el
bloque vecino de igual tamaño, **espejado en X** — pegarlo tal cual repite las mismas nubes a
distancia fija y el ojo engancha el patrón.

El prompt de `gen_boat_scene.sh` ya está corregido para no pedir zonas vacías por coordenadas, pero
el parche queda: es idempotente y si no encuentra bloque no toca nada.

## Sonido

Tres efectos nuevos en `sfx.service`, todos generados con WebAudio como el resto:

- `wave` — oleaje. Lo más suave del juego: es ambiente, si se nota está mal. Suena dos veces
  (al salir y al llegar) y no en loop, porque a este volumen repetirlo seguido sólo suma zumbido.
- `thud` — la pisada en la madera. Suena al **tocar** el muelle, no al terminar el hold.

## Verificado

Corriendo la máquina con `dt` fijo de 1/60:

```
BOAT_IN @ 0.02s -> DISEMBARK @ 2.62s -> FADE @ 3.82s -> WALK_IN @ 4.82s -> TALK @ 7.27s
```

Cada paso dura lo que dice su constante. `R` en pleno bote deja `G.intro` en `null` y la escena
se re-inicializa limpia. Los 6 pasos dibujan sin excepciones.

**Costo de ritmo:** 4.8 s de cinemática antes de que el héroe empiece a caminar, y 7.3 s hasta la
primera línea de diálogo. Es salteable con `T` y `ESPACIO` adelanta el bote, pero para una demo con
jurado conviene saber que está ahí.
