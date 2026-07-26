# Generación de arte — cómo se hace

**Kiro no genera imágenes. El arte lo genera el CLI de `codex`, desde la terminal.**
Este archivo es el procedimiento. Los prompts de cada asset y su historial viven en
[`.kiro/specs/ASSETS.md`](../specs/ASSETS.md).

---

## El flujo, siempre igual

```
1. GENERAR    codex exec  ->  assets/art/generated/<nombre>.png   (raw, miles de colores)
2. PROCESAR   scripts/*.py ->  public/assets/art/_gameready/<nombre>.png
3. REGISTRAR  la clave en src/constants/ASSETS_MANIFEST.js
```

**Nunca se salta el paso 2.** Las imágenes del generador vienen con decenas de miles de colores —
gradientes y antialiasing disfrazados de pixel art. Medido: `scene_island_after` salió con **133.786
colores y 485 KB** contra los 32 colores de los assets originales. Escalado ~3x con
`image-rendering: pixelated` eso se ve pastoso y contradice la dirección de arte.

### El comando de generación

```bash
codex exec --sandbox danger-full-access -m gpt-5.5 -- "<prompt>" < /dev/null

# con imagen de referencia (obligatorio si el personaje YA existe):
codex exec --sandbox danger-full-access -m gpt-5.5 -i ref1.png -i ref2.png -- "<prompt>" < /dev/null
```

- `< /dev/null` es **obligatorio** o codex se cuelga esperando stdin.
- Los scripts de generación viven en `scripts/gen_*.sh`. **Cada uno trae su prompt adentro y el
  historial de lo que salió mal.** Leelos antes de escribir un prompt nuevo.
- Si lo corrés desde un agente, usá **ruta absoluta** al script. Un `cd` previo que quedó en otra
  carpeta hace fallar el job sin decir por qué.

---

## Las seis reglas que no se negocian

### 1 · Si el personaje ya existe, se adjunta la IMAGEN. Y el prompt habla SOLO de la pose.

Costó **tres intentos** generar los sprites de combate del héroe:

| Intento | Qué se le pasó | Qué salió |
|---|---|---|
| 1 | descripción de texto, sin referencia | otro chico: proporción adolescente, sombreado con pliegues, sin el cuadradito naranja del pecho |
| 2 | referencia + lista larga de reglas de estilo ("colores planos", "dos tonos por material", "proporción chibi") | un muñeco de tubos con contorno grueso, y los puños salieron como **cuadrados naranjas** |
| 3 | referencia + prompt corto, sólo la pose | **en modelo** |

> **Los adjetivos de estilo PELEAN contra la imagen de referencia.** Cuando hay referencia adjunta, el
> estilo lo define el PNG, no las palabras. Describí la pose y callate sobre el estilo.

### 2 · Los sets que se animan o se comparan van en UNA SOLA corrida

Pares antes/después, ciclos de caminata, frames de una pose. Generarlos por separado devuelve
personajes o lugares **distintos**. Ya pasó dos veces: cuatro islas distintas en vez de cuatro vistas
del mismo lugar, y cinco chicos distintos en vez de cinco poses de uno.

### 3 · Pedí una HOJA horizontal, no archivos sueltos

Si necesitás varios frames del mismo personaje, pedí **un sheet horizontal** y partilo con
`split_sheet.py`, que ya resuelve el recorte compartido y el anclado. Pedir N archivos sueltos obliga
a empaquetarlos con `pack_sprite_set.py`, que hace lo mismo por otro camino.
**Esta duplicación existe porque se pidieron archivos sueltos sin mirar que `split_sheet.py` ya
estaba.** No la agrandes.

### 4 · Fondo verde puro para sprites, opaco para fondos

`#00b140` liso, sin piso, sin sombra, sin viñeta. Es más confiable que pedir alfa, y el chroma key lo
resuelve. Los fondos de escena van sin chroma.

### 5 · Nada de zonas "vacías" pedidas por coordenadas

Pedirle que un rincón quede "oscuro y vacío" para poner HUD encima te puede devolver un **rectángulo
de color liso con bordes rectos**, que se lee como un tile que falta. Pasó en la costa de la isla: un
bloque `(35,29,44)` de 120×40. Pedí "que se funda con el cielo, sin caja ni panel". Si igual aparece,
`patch_solid_block.py` lo tapa.

### 6 · Las posiciones que salen de un sprite se MIDEN, no se estiman

El origen de un rayo, un orbe entre las manos, la línea de piso. Se mide el sprite final y se convierte
a coordenadas del canvas con la escala real de dibujado. A ojo, el rayo del remate salía **16 px por
encima de las manos** y el orbe 20 px afuera de ellas.

> Si regenerás los sprites de combate, hay que volver a medir `BEAM_FROM` y `ORB_FROM` en
> `src/constants/FINISHER.js`. `gen_hero_combat.sh` lo avisa al terminar.

---

## Qué script uso — tabla de decisión

| Tengo | Uso | Por qué |
|---|---|---|
| Un fondo de escena | `postprocess.py --size 640x360 --colors 48` | sólo resize + quantize |
| Un sprite suelto de pie | `postprocess.py --size 128x128 --chroma --trim` | recorta a su contenido |
| Un sprite que **no** es una figura de pie (un cuerpo tirado) | `postprocess.py ... --pad-bottom 5` | centrado en el lienzo queda flotando; ver abajo |
| Un marco de UI de tamaño fijo | `postprocess.py ... --chroma --trim --no-aspect` | estira al tamaño exacto sin deformar el layout |
| **Una hoja** horizontal de frames | `split_sheet.py --frames N` | bbox unión + anclado abajo, en un paso |
| **N archivos** de frames de una animación | `pack_sprite_set.py` | bbox unión sobre archivos separados |

### El anclado, que es la trampa menos obvia

El motor dibuja **todos** los sprites del héroe en la misma caja de 96 px anclada en `LAYOUT.HERO`, así
que la línea de piso es el **borde inferior del lienzo**. Un sprite centrado verticalmente en su lienzo
queda flotando en el aire: medido, `hero_down` flotaba **25 px**. Con `--pad-bottom 5` las poses de
victoria, derrota y guardia apoyan todas en canvas `y=336`.

**Cómo se verifica:**

```bash
python -c "
from PIL import Image
for n in ('hero_stance_1','hero_down_1','hero_win_1'):
    b = Image.open(f'public/assets/art/_gameready/{n}.png').convert('RGBA').getbbox()
    print(f'{n:<14} apoya en canvas y={244 + b[3]*96/128:.0f}')
"
```

Los tres tienen que dar el **mismo** número. Si uno difiere, ese sprite flota o se hunde.

---

## Antes de dar un asset por bueno

- [ ] Pasó por `postprocess.py`. Cuantizado, no crudo.
- [ ] Está en `public/assets/art/_gameready/` con el nombre exacto del manifest.
- [ ] La clave está en `src/constants/ASSETS_MANIFEST.js`.
- [ ] Si es parte de una animación: todos los frames apoyan en la misma línea.
- [ ] Si es un personaje que ya existía: se parece al de las otras pantallas.

> El manifest se carga entero al arrancar y una clave **sin archivo no rompe el juego**: entra en
> `engine.loadErrors`. Podés registrar la clave antes de tener la imagen y programar contra ella.

---

## Distribución

🔴 **Los PNG se commitean a `main`, nunca a una rama de feature.** Git no mergea binarios: si el mismo
archivo entra por dos ramas, el conflicto se resuelve a mano. Ver el detalle en
[`ASSETS.md`](../specs/ASSETS.md#cuando-generes-uno--el-flujo-de-distribución).
