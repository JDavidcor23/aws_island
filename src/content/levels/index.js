import { isla0n1 } from './isla0-n1'

export const LEVELS = {
  [isla0n1.id]: isla0n1,
}

// Un nivel incoherente no falla en la carga: falla a mitad de una ronda, con un
// `currentRound(G).ans` que no existe en el mazo y un combo que devuelve undefined. Eso se
// ve como un juego colgado, no como un error de datos. Esta verificación lo convierte en un
// throw al arrancar, que es donde se puede leer.
//
// Reemplaza lo que hoy verifica COMBO.test.js sobre las constantes globales.
const assertCoherent = (level) => {
  const cardIds = Object.keys(level.cards)
  for (const round of level.rounds) {
    if (!cardIds.includes(round.ans)) {
      throw new Error(`[${level.id}] la ronda "${round.prob}" responde "${round.ans}", que no está en cards`)
    }
  }
  for (const id of cardIds) {
    if (!level.combos[id]) throw new Error(`[${level.id}] la carta "${id}" no tiene patrón de combo`)
  }
}

Object.values(LEVELS).forEach(assertCoherent)

export const getLevel = (id) => {
  const level = LEVELS[id]
  if (!level) throw new Error(`nivel desconocido: ${id}`)
  return level
}
