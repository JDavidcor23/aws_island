import { LAYOUT } from './LAYOUT'

// Antesala del combate. El jugador llega a la arena, el jefe YA ESTÁ ahí, y todo se queda
// quieto mientras el mentor se lo señala y le dice cómo se lo vence.
//
// POR QUÉ EXISTE. Antes la intro cortaba directo a PROBLEM: entrabas y en el mismo frame el
// jefe te estaba gritando y atacando, sin que nadie te hubiera dicho contra qué peleás ni
// que las cartas son la respuesta. El tutorial te marcaba la carta correcta con un brillo,
// pero un brillo dice CUÁL, no POR QUÉ hay que apretar algo.
//
// Es un eje distinto del tutorial: el tutorial enseña las MECÁNICAS jugando (brillo + ficha
// obligatoria), el briefing planta el OBJETIVO. Por eso es una pantalla de texto y no una
// mecánica: se lee una vez, no se practica.
//
// ⚠️ Va en su propio archivo y NO en LAYOUT.js ni TIMING.js: son los dos archivos
// compartidos por todo el equipo y cada agregado ahí es un conflicto de merge garantizado.
export const BRIEFING = {
  INITIAL: {
    line: 0,
    revealTime: 0,
    typedChars: 0,   // último carácter que ya sonó: sin esto el blip se repite por frame
  },

  SPEAKER: 'MENTOR 🐧',

  // El mentor entra en cuadro a la derecha del héroe, entre él y el jefe, para que la
  // lectura sea héroe -> mentor -> jefe de izquierda a derecha. Ese orden es el que hace que
  // "mirá allá" señale a algo que ya está en el recorrido natural del ojo.
  PENGUIN_X: 152,
  PENGUIN_SIZE: 64,

  // Línea de piso de la arena. MEDIDA, no estimada: los sprites del héroe son de 128 px
  // dibujados a 96 y su bbox termina en la fila 123, así que apoyan en
  // 244 + 123 * 96/128 = 336. Ver .kiro/specs/ASSETS.md, "Verificación de A-13 — el
  // anclado". Poner acá LAYOUT.HERO.y + size/2 (= 340) dejaría al pingüino 4 px hundido
  // respecto del héroe que tiene al lado.
  GROUND_Y: 336,

  // Rebote del pingüino mientras habla: está quieto, pero no congelado.
  BOB_AMP: 2,
  BOB_FREQ: 3.2,

  // Flecha que señala al jefe. Es lo que convierte "mirá allá" en una instrucción: sin
  // algo que apunte, "allá" es todo el cuadro.
  POINTER: {
    CHAR: '▼',
    X: LAYOUT.BOSS.x,
    // Arriba de la cabeza del jefe. El jefe está centrado en BOSS.y (196) con size 192, o
    // sea que su borde superior cae en 100: 84 lo deja despegado sin salirse del canvas.
    Y: 84,
    SIZE: 18,
    BOB_AMP: 5,
    BOB_FREQ: 3.4,
    COLOR: '#ffd94a',   // el dorado de "esto es lo importante" que ya usa la carta correcta
  },

  // Velo muy tenue. NO está para que se lea el texto —la caja de diálogo es un PNG opaco y
  // no necesita ayuda— sino para que la escena se lea como DETENIDA: todavía no empezó la
  // pelea. Por eso es 0.2 y no 0.32 como estaba: el jefe es lo que esta pantalla viene a
  // mostrar, y bajarle un tercio del brillo trabaja en contra de la flecha que lo señala.
  // Comparar con el velo del panel de carta, que sí tapa a propósito: 0.78.
  VEIL: 'rgba(4,6,20,0.2)',

  REVEAL_CHARS_PER_SEC: 30,   // igual que la intro: el tipeo del juego es uno solo
  TYPE_SFX_EVERY: 3,          // un blip cada 3 caracteres ~ 10 golpes por segundo
}

// Tres líneas y se termina. La regla del producto es jugar > leer: el briefing planta el
// objetivo y se va. Cada concepto se explica DESPUÉS del golpe, en una línea, y la ficha de
// cada carta ya es lectura obligatoria en el tutorial.
//
// ⚠️ Límite duro: drawTypedDialogue envuelve a 40 caracteres y la caja aguanta 4 renglones
// — el 5º cae encima del '▼ ESPACIO'. Las tres líneas son de 3 renglones. Si alargás una,
// volvé a medirla.
//
// La línea 2 es la que carga el encuadre de "característica vs. lo que te da": el jefe grita
// un PROBLEMA y la carta es una característica de la nube que lo resuelve. No se nombra
// ninguna de las cuatro acá — eso es lo que el jugador tiene que descubrir jugando.
export const BRIEFING_LINES = [
  {
    text: 'Ahí lo tenés. Ese es el Legacy Server: la máquina que hacía todo sola, y ya no da más.',
  },
  {
    text: 'No lo vas a romper a golpes. Te va a gritar un problema, y vos le contestás con algo que la nube sabe hacer y él no.',
  },
  {
    text: 'Cuatro problemas, cuatro cartas. Elegí la que resuelve LO QUE ESTÁ PASANDO y bloqueale el golpe.',
  },
]
