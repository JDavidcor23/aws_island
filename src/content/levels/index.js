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

// El nivel entra al estado del motor como `G.level`, y G es un objeto que TODO el motor muta
// en cada frame. Pero `G.level` NO es una copia: es la misma referencia que vive acá, en el
// módulo. Una mutación accidental —un `G.level.rounds.push(...)`, un campo pisado por error—
// contaminaría el contenido para toda la sesión, y como reset() reusa esta misma referencia,
// ni reiniciar la partida lo recupera.
//
// El freeze convierte ese bug silencioso en un TypeError en la línea que lo causa. Los
// módulos ES corren en modo estricto, así que la asignación tira en vez de fallar callada.
// Cuesta una pasada al cargar y nada más: el contenido es de sólo lectura por definición.
const deepFreeze = (value) => {
  if (value === null || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.values(value).forEach(deepFreeze)
  return Object.freeze(value)
}

Object.values(LEVELS).forEach((level) => {
  assertCoherent(level)
  deepFreeze(level)
})

export const getLevel = (id) => {
  const level = LEVELS[id]
  if (!level) throw new Error(`nivel desconocido: ${id}`)
  return level
}
