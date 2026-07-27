import { LAYOUT } from './LAYOUT'

// El grito del jefe, puesto en escena. Antes el problema vivía en dos lugares y los dos
// fallaban:
//
//   1. En PROBLEM, dentro de la caja de diálogo de abajo. En la revancha
//      problemNeedsSpace: false + PROBLEM_MIN_WAIT: 0.5 la hacían durar medio segundo.
//   2. En CHOOSE, como una línea de 13 px en y=26 — la banda MÁS cargada del canvas, que
//      comparte con los 4 corazones (y 10..36), "PROBLEMA 1/4" (y 20), la pregunta (y 48),
//      LEGACY SERVER (y 58) y la barra del jefe (y 66..78). Sin entrada animada y sin nada
//      que la ate a quién está hablando.
//
// Ahora es un bocadillo anclado al jefe por su cola, que se TIPEA mientras el jefe grita y
// se QUEDA en pantalla durante toda la elección de carta.
//
// ⚠️ Va en archivo propio y NO en LAYOUT.js: ese archivo es compartido por todo el equipo.
export const PROBLEM_STAGING = {
  // Sub-máquina del revelado (G.shout). Nace acá y la borra reset() recreando G, igual que
  // intro, briefing y finisher. `doneAt` guarda el segundo en que terminó de revelarse: es
  // lo que le permite a PROBLEM esperar un beat antes de pasar a CHOOSE.
  INITIAL: {
    revealTime: 0,
    typedChars: 0,   // último carácter que ya sonó: sin esto el blip se repite por frame
    doneAt: null,
  },

  // Mismo tipeo que la intro y el briefing: el juego tiene UN typewriter, no tres.
  // Un poco más rápido que el del mentor (30) porque esto es un grito, no una explicación.
  REVEAL_CHARS_PER_SEC: 34,
  TYPE_SFX_EVERY: 3,
  // Beat después del revelado antes de habilitar las cartas. Sin él, el último carácter y
  // la aparición de las cuatro cartas caen en el mismo frame y el grito no se termina de leer.
  HOLD_AFTER_REVEAL: 0.4,

  // El globo va a la IZQUIERDA del jefe y no sobre su cabeza.
  //
  // La banda libre es y≈86..184: debajo de la barra de vida del jefe (66..78) y arriba de
  // las cartas (245). Pero en x el jefe ocupa 224..416 — un globo centrado le taparía la
  // cara, que es su personaje entero. A la izquierda queda aire de sobra: el héroe arranca
  // en y=244 y las cartas en x=188.
  //
  // El alto NO es fijo: lo calcula drawBossSpeech según los renglones que salgan del wrap,
  // con MIN_H como piso para que la columna del icono nunca quede apretada. Un globo de
  // alto fijo con un texto de dos renglones se ve como una caja vacía.
  BUBBLE: {
    x: 12,
    y: 92,
    w: 210,
    minH: 56,
    pad: 10,
    radius: 8,
    borderWidth: 2,
  },

  // La cola: sale del borde derecho del globo y apunta a la boca del jefe. El ancla es el
  // JEFE (LAYOUT.BOSS) y no un par de números sueltos, así que si el jefe se mueve de
  // lugar la cola lo sigue.
  TAIL: {
    tipX: LAYOUT.BOSS.x - 70,
    tipY: LAYOUT.BOSS.y - 44,
    baseHalfHeight: 11,
  },

  // Columna del icono, a la izquierda del texto. Si el PNG no cargó se dibuja un aro con
  // el acento del problema y un '!' adentro: el globo NUNCA queda con un hueco.
  ICON: {
    size: 30,
    dx: 10,          // respecto del borde izquierdo del globo
    fallbackChar: '!',
  },

  TEXT: {
    size: 11,
    lineHeight: 14,
    // 22 caracteres: el ancho útil es 210 - 48 (columna del icono) - 10 (pad) = 152 px, y a
    // 11 px de monospace bold cada carácter mide ~6.6. Medido con el problema más largo
    // ("¡MIL clientes quieren usar la misma máquina!", 44 caracteres) da 3 renglones.
    wrapChars: 22,
    indent: 48,      // dónde arranca el texto, respecto del borde izquierdo del globo
    color: '#ffffff',
  },

  // Paleta del steering: panel #101528, borde de peligro #ff5544 (habla el jefe), texto
  // blanco. Nada inventado.
  COLORS: {
    bg: 'rgba(16,21,40,0.94)',
    border: '#ff5544',
    iconBg: 'rgba(11,11,18,0.9)',
  },

  // El '!!' sobre el jefe mientras grita. Estaba hardcodeado en drawProblemScreen.
  BANG: {
    char: '!!',
    dx: 70,
    dy: -100,
    size: 26,
    color: '#ff5544',
  },
}
