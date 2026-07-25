# Concepto de la Isla 0 — "El Pueblo del Servidor"

> **Esto se lee ANTES de generar cualquier arte de la Isla 0.** No es decoración: es el contrato que hace
> que todas las vistas sean **el mismo lugar**.

---

## El problema que este documento resuelve

Los primeros assets se generaron con prompts independientes. Resultado: cuatro mundos distintos en vez de
cuatro vistas del mismo lugar. La arena del combate era una torre industrial oscura, el `island_after` un
pueblo idílico con ríos, y el nodo del mapa una isla tropical con palmeras. **No compartían ni un punto de
referencia.** El jugador vencía al jefe en un lugar y la victoria le mostraba otro.

La causa no era el estilo ni la paleta. Era que **no había concepto**: cada prompt inventaba la isla de cero.

---

## Los 7 elementos fijos

Estos siete elementos aparecen en **TODAS** las vistas de la Isla 0, en la **misma posición relativa**. Si una
vista no los muestra todos por encuadre, muestra los que entran, en su lugar.

| # | Elemento | Dónde | ENFERMA | SANA |
|---|---|---|---|---|
| 1 | **El Molino** | colina alta, izquierda | torcido, aspas rotas, madera gris astillada | derecho, blanco con vivo rojo, aspas enteras |
| 2 | **La Torre de Agua** | derecha, cilíndrica sobre patas | oxidada, manchada, goteando | pintada blanco y teal, con un logo de nube |
| 3 | **El Legacy Server** | centro-fondo, sobre la colina | colosal, metal corroído, racks apilados, cables como raíces, columnas de humo | **su esqueleto sigue en pie, tomado por el verde y las flores** |
| 4 | **Las Casas** | 4-5 juntas, abajo-centro | ladrillo y madera, techos hundidos, ventanas tapiadas | reparadas, tejas terracota, flores en las ventanas |
| 5 | **El Canal y el Puente** | primer plano, puente de arco de piedra | lodo verde tóxico estancado, puente partido | agua celeste clara, puente entero |
| 6 | **Las Tuberías** | cruzan el suelo | gruesas, corroídas, con fugas | **siguen ahí**, pintadas blanco y cyan, limpias |
| 7 | **Los Álamos** | fila junto al camino | pelados, muertos, inclinados | frondosos, verde saturado |

### Por qué el 3 y el 6 son los importantes

El servidor **no desaparece**: queda su **esqueleto cubierto de verde**. Las tuberías **no se levantan**:
siguen cruzando el pueblo, ahora limpias.

Eso hace dos cosas a la vez:

1. **La silueta es idéntica antes y después.** Es imposible no reconocer el lugar. Es el único truco que
   garantiza continuidad, porque la silueta es lo primero que lee el ojo.
2. **Narra mejor que borrarlo.** No destruiste el pasado: lo superaste. Que es exactamente la tesis del juego
   — *"No lo vencés a golpes: sus limitaciones no pueden competir con la nube"* (`CLOUD_QUEST.md` §5).

Si el servidor desapareciera, la victoria se leería como demolición. Con el esqueleto verde se lee como
evolución.

---

## Paletas pareadas

Las dos paletas comparten estructura: cada color sano es el color enfermo **saturado y aclarado**, no un color
nuevo. Eso es lo que hace que se lean como el mismo lugar en dos momentos y no como dos ilustraciones.

| Rol | ENFERMA | SANA |
|---|---|---|
| Tierra / madera | óxido `#8a5a32` | terracota `#c9603c` |
| Sombra / estructura | marrón podrido `#4a3a2a` | marrón cálido `#7a5236` |
| Metal | acero apagado `#5c6272` | blanco hueso `#f2e8d5` |
| Vegetación | verde tóxico `#7a9a3a` | verde vivo `#63c74d` |
| Agua | lodo verde `#5a6b2a` | celeste `#5cb4ee` |
| Cielo | smog violeta `#5a4a68` | cielo claro `#7dc4f0` |
| Acento | rojo alarma `#c4402a` | cyan nube `#7de0ff` |

---

## Estilo (frase idéntica en todos los prompts)

```
Style: clean HD pixel art, western semi-anime like Sea of Stars and Eastward,
crisp hard pixel edges, limited palette, no blur, no anti-aliasing, no gradients,
detailed but readable.
```

Nunca anime exagerado, nunca pixel art oscuro, nunca pintura ni fotorrealismo.

---

## Restricciones mecánicas — la arena del combate

⚠️ `scene_battle_arena.png` **no es una ilustración**: es el fondo sobre el que corre todo el combate. Las
coordenadas salen de `src/constants/LAYOUT.js` y el arte tiene que respetarlas o el juego deja de leerse.

| Zona | Coordenadas | Qué la ocupa | Qué necesita del fondo |
|---|---|---|---|
| Jefe | x 224–416, y 100–292 | sprite de 192px, oscuro y oxidado | fondo **más claro o de bajo contraste** detrás, o el jefe se pierde |
| Héroe | x 30–126, y 244–340 | sprite de 96px | **línea de piso plana y clara** a esa altura |
| Cartas | x 200–500, y 204–290 | 4 cartas de 58×81 | zona tranquila, sin detalle que compita |
| HUD | x 0–210, y 0–90 | corazones y barra especial | esquina superior izquierda **calma y oscura** |
| Diálogo | x 128–512, y 232–354 | caja de 384×122 | queda tapado, no poner nada importante |

**Verificación obligatoria antes de aceptar una arena nueva:**

```bash
python scripts/check_arena.py <arena_nueva> <arena_de_referencia>
```

Monta el jefe a 192px en (320,196) y el héroe a 96px en (78,292), mide tres cosas contra la arena de
referencia y escribe el montaje en `tmp/arena_check.png`. Sale con código 1 si la nueva **regresa**:

| Métrica | Por qué | Referencia actual |
|---|---|---|
| Ruido en la banda del jefe | si el fondo se carga, el sprite se pierde | 37.05 (tolerado hasta 50) |
| Luma de la esquina del HUD | los corazones y el texto son blancos | 39.13 (tolerado hasta 74) |
| Rugosidad del piso | el héroe necesita línea de piso plana | 26.23 (tolerado hasta 39) |

> ⚠️ **El script NO decide si la silueta del jefe se lee.** El primer intento medía "contraste de luminancia
> media entre el fondo y el jefe" y **rechazó la arena que funciona**, con 6.1 de contraste. El jefe no se lee
> por ser más claro o más oscuro que el fondo: se lee por su contorno oscuro, su silueta y los ojos rojos. Eso
> no se mide con un promedio. El script mide lo medible y **el montaje lo mirás vos**.

Si falla: se descarta la imagen. **No se mueven las coordenadas de `LAYOUT.js`** — es archivo compartido entre
los tres features.

---

## Inventario de vistas

| Vista | Archivo | Encuadre | Estado |
|---|---|---|---|
| Panorámica enferma | `scene_island_before.png` | isla entera de lejos | ENFERMA |
| Panorámica sana | `scene_island_after.png` | mismo encuadre exacto | SANA |
| Camino del tutorial | `scene_island_path.png` | de perfil, a nivel del suelo | ENFERMA |
| Arena del jefe | `scene_battle_arena.png` | al pie del servidor | ENFERMA |
| Nodo del mapa, enfermo | `island0_before.png` | de arriba, 112×96 | ENFERMA |
| Nodo del mapa, sano | `island0_after.png` | ídem, misma silueta | SANA |

> Las dos panorámicas y los dos nodos son **pares**: mismo encuadre, misma silueta, mismas posiciones. Se
> generan siempre **en la misma corrida**, nunca por separado — generarlos aparte da dos islas distintas.
> Verificado: es exactamente el error que produjo el primer nodo del mapa.

Los prompts tal cual se usaron quedan en [`ASSETS.md`](./ASSETS.md).
