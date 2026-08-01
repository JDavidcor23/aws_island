import { LAYOUT } from './LAYOUT'

// El combo de parries. Cada problema del jefe son TRES golpes con su propio ritmo, y la
// ronda se resuelve por la CADENA completa, no por un solo ESPACIO.
//
// ⚠️ Las ventanas de acierto (PERFECT_DIST / GOOD_DIST) NO se duplican acá: siguen
// viviendo en TIMING.js, que es de donde también las lee drawAttack. Un solo origen o se
// desincronizan — es el mismo accidente que tuvo chooseTimeLimit declarado en dos archivos
// con valores distintos. Lo que sí vive acá es todo lo que el combo AGREGA: patrones,
// pausas, orígenes, economía y textos.
//
// ⚠️ Va en archivo propio y NO en TIMING.js ni LAYOUT.js: esos dos son compartidos por
// todo el equipo y cada agregado ahí es un conflicto de merge garantizado.
//
// SOBRE EL COLOR. Los tres golpes son de la MISMA familia roja del jefe, a propósito. El
// steering de producto fija la paleta y #7de0ff ya significa "esto lo devolvió el
// jugador": pintar cada concepto de un color nuevo rompería la paleta y convertiría el
// combate en un juego de emparejar colores en vez de entender el problema. La identidad de
// cada problema la llevan la FORMA (radio del orbe), el ORIGEN, el RITMO, el ICONO y el
// SONIDO. El acento del concepto se usa sólo como detalle: el aro del icono del bocadillo.
export const COMBO_ORIGINS = {
  BOSS: 'BOSS',   // frontal, como fue siempre
  HIGH: 'HIGH',   // cae desde arriba
  LOW: 'LOW',     // rasante desde abajo, por el lado del jefe
}

export const COMBO = {
  // Largo canónico. La fase puede acortarlo (PHASE_CONFIG.comboLength) pero nunca
  // alargarlo más allá de los golpes que trae el patrón.
  LENGTH: 3,

  // Posición de salida por origen. El punto de bloqueo NO se mueve nunca: LAYOUT.BLOCK
  // sigue siendo el único lugar donde mirar. Lo que cambia es la dirección de llegada.
  // HIGH y LOW nacen FUERA del canvas para que el golpe entre en cuadro ya en movimiento;
  // la telegrafía se dibuja pegada al borde (ORIGIN_TELEGRAPH_MARGIN) porque un aro de
  // carga fuera de pantalla no avisa nada.
  ORIGIN_POS: {
    [COMBO_ORIGINS.BOSS]: { x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y },
    [COMBO_ORIGINS.HIGH]: { x: LAYOUT.BLOCK.x + 54, y: -26 },
    [COMBO_ORIGINS.LOW]: { x: LAYOUT.BOSS.x + 40, y: LAYOUT.H + 26 },
  },
  ORIGIN_TELEGRAPH_MARGIN: 24,

  // Telegrafía. El primer golpe se anuncia como siempre (mismo valor que
  // TIMING.WINDUP_DURATION); los que siguen son más cortos, porque el jugador ya está en
  // guardia y la pausa del patrón ya hizo de anticipación.
  WINDUP_FIRST: 0.45,
  WINDUP_NEXT: 0.22,

  // Beat entre el último golpe resuelto y el cierre del combo. Sin él, el cartel del
  // resultado aparece en el mismo frame que la partícula del tercer parry y no se lee.
  CLOSE_DELAY: 0.28,

  // Cuánto tiene que PASAR el orbe el punto de bloqueo para contar como fallado. Se mide
  // por proyección sobre la dirección de vuelo, no comparando x e y: con golpes que entran
  // desde arriba o desde abajo, el `atk.x < BLOCK.x - 22` de antes no se cumplía nunca y
  // el miss no se detectaba.
  MISS_PAST_PX: 22,

  ORB_RADIUS: 10,

  // Orbes ya parreados esperando el cierre. Flotan sobre el hombro del héroe: son la
  // munición del contraataque, así que tienen que estar VISIBLES antes de dispararse.
  HELD: {
    x: LAYOUT.BLOCK.x - 4,
    y: LAYOUT.BLOCK.y - 62,
    gap: 20,
    radius: 7,
    riseTime: 0.18,
    bobAmp: 2,
    bobFreq: 5,
  },

  // Progreso de la cadena: un pip por golpe, junto al punto de bloqueo. Es lo único que
  // dice "faltan dos más" sin texto.
  PIPS: {
    y: LAYOUT.BLOCK.y + 44,
    gap: 13,
    radius: 4,
    COLORS: {
      pending: '#3d4763',
      live: '#ffffff',
      perfect: '#ffd94a',
      good: '#7de0ff',
      miss: '#ff5544',
    },
  },

  // Contraataque. Los orbes retenidos convergen sobre el jefe; en 3/3 perfect llegan TODOS
  // AL MISMO TIEMPO (de ahí el tiempo de vuelo fijo en vez de una velocidad fija), y esa
  // convergencia es lo que lo hace verse distinto de una devolución cualquiera.
  COUNTER: {
    TRAVEL: 0.3,          // segundos de vuelo cuando convergen (3/3 perfect)
    STAGGER: 0.12,        // retardo entre orbes cuando NO es contraataque
    TIMEOUT: 1.6,         // red de seguridad: nunca se queda colgado esperando a un orbe
    FLASH: '#ffe98a',
    FLASH_ALPHA: 0.75,
    SHAKE: 16,
    SHAKE_WEAK: 8,
    PARTICLES: 60,
    PARTICLES_WEAK: 26,
    PALETTE: ['#7de0ff', '#ffffff', '#ffd94a', '#4aa3ff'],
    BANNER_Y: 108,
  },

  // La tabla de resultados. La resuelve resolveComboOutcome() en game/battle/combo.js:
  // acá sólo viven los datos.
  //
  // ⚠️ INVARIANTE: ninguna recompensa supera 25, que es lo que garantiza que la barra
  // especial (0..100) nunca se llene en menos de 4 rondas. Ese invariante está documentado
  // en TIMING.js y es lo que evita que el remate se coma contenido del juego.
  OUTCOMES: {
    COUNTER: {
      id: 'COUNTER',
      gain: 25,
      damage: false,
      lastResult: 'perfect',
      label: '¡CONTRAATAQUE! +25',
      color: '#ffd94a',
    },
    BLOCKED: {
      id: 'BLOCKED',
      gain: 18,
      damage: false,
      lastResult: 'good',
      label: '¡BLOQUEADO! +18',
      color: '#7de0ff',
    },
    PARTIAL: {
      id: 'PARTIAL',
      gain: 10,
      damage: false,
      lastResult: 'miss',
      label: 'CASI · +10',
      color: '#7de0ff',
    },
    GRAZED: {
      id: 'GRAZED',
      gain: 5,
      damage: true,
      lastResult: 'miss',
      label: 'TE ROZÓ · +5',
      color: '#ff9d7a',
    },
    FAILED: {
      id: 'FAILED',
      gain: 0,
      damage: true,
      lastResult: 'miss',
      label: '¡TE DIO DE LLENO!',
      color: '#ff5544',
    },
    // Carta equivocada: se puede parrear —el golpe se frena— pero no se refleja ni se
    // carga. El corazón ya lo cobró pickCard al elegir mal, así que acá `damage` va en
    // false: un combo cuesta como MÁXIMO un corazón, igual que antes del combo.
    NO_SHIELD: {
      id: 'NO_SHIELD',
      gain: 0,
      damage: false,
      lastResult: 'miss',
      label: 'Sin escudo: frenás, pero no devolvés',
      color: '#ff9d7a',
    },
  },


  TEXTS: {
    // Un texto por eslabón de la cadena: el parry 3 tiene que sentirse distinto del 1.
    PARRY: ['¡PARRY!', '¡DOS!', '¡Y TRES!'],
    TOO_EARLY: '¡Muy pronto!',
    TOO_LATE: '¡MUY TARDE!',
    NOT_YET: '¡Todavía no!',
    NO_SHIELD_PARRY: 'Frenado',
    COUNTER_BANNER: '⚡ CONTRAATAQUE ⚡',
    SPECIAL_FULL: '¡BARRA LLENA — REMATE LISTO!',
    HINT: '¡ESPACIO cuando llegue al círculo!',
    INCOMING: '¡AHÍ VIENE!',
  },
}
