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
    // Las cartas que NO son la respuesta se muestran apagadas y no se pueden jugar.
    //
    // ⚠️ Esto contradice el modelo de enseñanza que documentan startRound y pickCard: ahí
    // el punto era que el jugador PUEDA elegir una equivocada, porque leerla es cómo
    // descubre que no sirve, y descartar es la habilidad que después le pide la revancha.
    // Con las cartas bloqueadas el tutorial se vuelve "apretá la que brilla" y esa práctica
    // no ocurre. Se implementó porque el jugador lo pidió explícitamente al probarlo.
    // Poner esto en false devuelve el tutorial al diseño original. La ficha se puede leer
    // igual: el badge '?' sigue funcionando sobre las cartas bloqueadas.
    lockWrongCards: true,
    explainAlways: true,            // el mentor explica acertando o fallando
    explainOnMistake: true,         // y con más razón si erraste
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
    lockWrongCards: false,          // en la revancha las cuatro cartas están en juego
    explainAlways: false,
    // El pingüino NO frena la revancha, ni siquiera cuando erras.
    //
    // Esto revierte el requisito 5.7 del spec tutorial-revancha, que pedía explicar la
    // característica antes de continuar si erraste carta o falláste el bloqueo. El
    // razonamiento del spec era bueno — si erraste no lo aprendiste, entonces te lo
    // enseño — pero jugándolo no se sostiene: un error ya te cuesta un corazón, y encima
    // te comías una pantalla modal con el MISMO texto que ya leíste en el tutorial para
    // ese mismo problema. Tres castigos por un error, y el tercero te saca del ritmo justo
    // cuando estás corriendo contra un reloj de 5 segundos.
    //
    // La intención del requisito se conserva: la lección sigue apareciendo, como texto
    // flotante que no pide input (ver mistakeHint en endRound). Deja de ser un freno.
    // Para volver al comportamiento del spec, poner esto en true. Nada más.
    explainOnMistake: false,
    problemNeedsSpace: false,       // encadena solo
    specialTriggersFinisher: true,
    bossHpMirrorsSpecial: true,     // en la revancha el especial ES la vida del jefe
    atkSpeedMult: 1.35,
  },
}
