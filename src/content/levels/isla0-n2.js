import { PHASES } from '../../constants/PHASES'
import { LAYOUT } from '../../constants/LAYOUT'
import { isla0n1 } from './isla0-n1'

// Nivel 2 — "El Trío". Los MISMOS cuatro problemas del nivel 1, contra tres enemigos que
// atacan encadenado y sin pausa.
//
// No agrega contenido: lo cobra. El nivel 1 enseña las cuatro cartas de a una, con el
// pingüino explicando cada una y sin reloj; acá no hay pingüino, no hay explicación y no hay
// tiempo. Practicar lo aprendido antes de sumar lo siguiente retiene más que encadenar
// conceptos nuevos uno atrás del otro — por eso este nivel va ANTES del que trae material
// nuevo, y no después.
export const isla0n2 = {
  id: 'isla0-n2',
  mechanic: 'cards',
  concept: 'Las 5 características, sin ayuda y contra reloj',

  // El contenido se REFERENCIA, no se copia. Es deliberadamente el mismo del nivel 1: si se
  // duplicara, el día que se corrija un texto en un lado el otro queda viejo y el jugador
  // practica una versión distinta de la que aprendió.
  rounds: isla0n1.rounds,
  cards: isla0n1.cards,
  combos: isla0n1.combos,

  // Tres enemigos sobre las coordenadas de LAYOUT.TRIO. Es el MISMO sprite del jefe tres
  // veces: el tinte es lo único que los separa, y alcanza porque nunca están los tres
  // activos a la vez. Los colores salen de la paleta ENFERMA de la isla
  // (.kiro/specs/CONCEPTO_ISLA_0.md): rojo alarma, verde tóxico y smog violeta.
  formation: [
    { id: 'rack-a', ...LAYOUT.TRIO[0], tint: '#c4402a' },
    { id: 'rack-b', ...LAYOUT.TRIO[1], tint: '#7a9a3a' },
    { id: 'rack-c', ...LAYOUT.TRIO[2], tint: '#5a4a68' },
  ],

  // Este nivel no tiene tutorial: arranca directo en la fase de revancha, que es la que no
  // marca la carta correcta, no bloquea las equivocadas y cobra los errores con vida.
  startPhase: PHASES.REMATCH,

  // Y tampoco tiene briefing. El pingüino ya presentó al Legacy Server en el nivel 1;
  // repetirlo acá sería hacerle perder el tiempo a alguien que viene a practicar.
  skipBriefing: true,

  pacing: {
    [PHASES.REMATCH]: {
      // 8 segundos contra los 15 de la revancha del nivel 1. Es el punto del nivel: el
      // jugador ya sabe las cuatro cartas, ahora tiene que elegirlas sin pensarlas.
      //
      // El 8 no es arbitrario. COMBAT_PACING documenta que 3 segundos no alcanzaban ni para
      // LEER las cuatro cartas, y por eso se abrió a 15. Pero acá el jugador ya no lee:
      // reconoce. 8 le sobra a quien aprendió y aprieta a quien no.
      chooseTimeLimit: 8,
      // El orbe viaja más rápido y el patrón de parries se aprieta. Los dos se multiplican
      // sobre valores distintos (velocidad del orbe vs. pausas del combo), así que 1.5 en
      // los dos NO es 2.25: son dos ejes independientes.
      atkSpeedMult: 1.5,
      comboSpeedMult: 1.5,
    },
  },
}
