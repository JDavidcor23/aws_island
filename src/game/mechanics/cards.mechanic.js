import { GAME_STATES } from '../../constants/GAME_STATES'

// La mecánica de cartas: elegir la carta que responde al problema y parrear el combo.
// Es la única implementada. Su valor hoy no es el comportamiento —eso sigue viviendo en
// battleLogic y combo— sino DECLARAR qué estados le pertenecen.
//
// GAME_STATES mezcla dos máquinas: la del shell (LOAD, TITLE, INTRO, VICTORY, DEFEAT,
// BRIEFING, FINISH_*) y la del combate. Esta lista es la frontera. La segunda mecánica va a
// declarar la suya y el shell no va a tener que saber qué hay adentro de ninguna de las dos.
//
// FINISH_LINE y FINISH_ANIM NO están acá a propósito: el remate es la muerte del jefe, y
// cualquier mecánica futura termina con un jefe que cae y va a querer el mismo remate.
export const cardsMechanic = {
  id: 'cards',
  states: [
    GAME_STATES.PROBLEM,
    GAME_STATES.CHOOSE,
    GAME_STATES.TIMING,
    GAME_STATES.RESOLVE,
    GAME_STATES.EXPLAIN,
  ],
}
