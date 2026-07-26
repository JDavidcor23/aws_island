import { COMBAT_PACING } from './COMBAT_PACING'

// Fases de combate. Es un eje ORTOGONAL a GAME_STATES: la fase no dice qué
// pantalla se muestra, dice cómo se comporta la pantalla que se está mostrando.
export const PHASES = {
  TUTORIAL: 'TUTORIAL',
  REMATCH: 'REMATCH',
}

export const PHASE_CONFIG = {
  [PHASES.TUTORIAL]: {
    chooseTimeLimit: null,          // null = sin timer, y no se dibuja
    loseHeartOnWrong: false,        // equivocarse mientras aprendés no cuesta
    // El brillo marca la carta correcta en las CUATRO rondas del tutorial, no solo en
    // la primera. Se llamaba guidedFirstProblem justamente porque era solo el problema 1.
    // Es seguro porque no viaja solo: openInfoOnPick obliga a leer la ficha de la carta
    // antes de jugarla, así que el brillo dice CUÁL y la ficha dice POR QUÉ. El brillo
    // suelto sí sería un problema — ver la nota del spec en tutorial-revancha.
    highlightAnswer: true,
    openInfoOnPick: true,           // jugar una carta sin leer la abre en vez de jugarla
    explainAlways: true,            // el mentor explica acertando o fallando
    problemNeedsSpace: true,        // PROBLEM espera ESPACIO
    specialTriggersFinisher: false, // el tutorial termina por rondas, no por especial
    bossHpMirrorsSpecial: false,    // en el tutorial la barra del jefe cuenta problemas
    atkSpeedMult: 1,
  },
  [PHASES.REMATCH]: {
    // El límite sale de COMBAT_PACING y no de un número acá: era el MISMO concepto
    // declarado en dos archivos con valores distintos (3 vs 5), y el que ganaba era
    // este. Un solo origen o se desincronizan otra vez.
    chooseTimeLimit: COMBAT_PACING.CHOOSE_TIME_LIMIT,
    loseHeartOnWrong: true,
    highlightAnswer: false,         // acá se terminan las ayudas: ninguna carta se marca
    openInfoOnPick: false,          // acá el panel es consulta voluntaria, no un paso
    explainAlways: false,           // solo explica si erraste carta o falláste el bloqueo
    problemNeedsSpace: false,       // encadena solo
    specialTriggersFinisher: true,
    bossHpMirrorsSpecial: true,     // en la revancha el especial ES la vida del jefe
    atkSpeedMult: 1.35,
  },
}
