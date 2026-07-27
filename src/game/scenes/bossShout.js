import { PROBLEM_STAGING } from '../../constants/PROBLEM_STAGING'
import { sfxService } from '../../services/sfx.service'
import { currentRound } from '../battle/battleLogic'

// Sub-máquina del grito del jefe: el problema se TIPEA dentro de un bocadillo anclado a él
// y se queda en pantalla mientras el jugador elige la carta.
//
// Mismo patrón que intro, briefing y finisher: el estado vive en G.shout, nace en null y lo
// borra reset() recreando G.
//
// ⚠️ El revelado NO se duplica: el contrato de dos tiempos es el mismo del briefing (el
// primer ESPACIO completa la línea, el segundo avanza) y el dibujado reusa wrapText — se
// envuelve el texto COMPLETO y después se recorta lo revelado. Al revés, envolviendo el
// prefijo que crece, las palabras saltan de renglón mientras se tipean. Está documentado en
// drawDialogue.js y no vale la pena tropezarse dos veces con el mismo bug.

// El ÚNICO camino al grito. Lo llama startRound, después de setState(PROBLEM).
export const startShout = (engine) => {
  const { G } = engine
  G.shout = { ...PROBLEM_STAGING.INITIAL, text: currentRound(G).prob }
}

// Cuántos caracteres ya se revelaron. Lo comparten el update (para el tecleo) y el draw
// (para saber cuánto pintar), así que sale de un solo lugar.
export const shoutRevealedChars = (shout) =>
  Math.floor(shout.revealTime * PROBLEM_STAGING.REVEAL_CHARS_PER_SEC)

// Sin bocadillo se considera completo: el ESPACIO del tutorial no puede quedar muerto
// esperando un revelado que no existe. Ver la nota de shoutReadyToAdvance.
export const shoutComplete = (shout) =>
  !shout || shoutRevealedChars(shout) >= shout.text.length

// ¿Ya se puede pasar a CHOOSE? Cuando el revelado terminó y pasó el beat de lectura. El
// beat es lo que evita que el último carácter y las cuatro cartas aparezcan en el mismo
// frame.
//
// Sin bocadillo devuelve true, y eso es a propósito: PROBLEM ya no avanza por tiempo, así
// que si alguna vez se llega a esa pantalla sin haber pasado por startShout, esperar al
// revelado de algo que no existe dejaría la partida colgada para siempre. Preferimos
// avanzar de más antes que trabar el juego.
export const shoutReadyToAdvance = (G) => {
  const shout = G.shout
  if (!shout) return true
  if (shout.doneAt === null) return false
  return G.t >= shout.doneAt + PROBLEM_STAGING.HOLD_AFTER_REVEAL
}

// Completa el revelado de golpe (el primer ESPACIO del tutorial). typedChars se mueve junto
// con revealTime: si se quedara atrás, el update del frame siguiente vería un salto de 40
// caracteres y soltaría un blip de más.
export const completeShout = (engine) => {
  const { G } = engine
  const shout = G.shout
  if (!shout) return
  shout.revealTime = shout.text.length / PROBLEM_STAGING.REVEAL_CHARS_PER_SEC
  shout.typedChars = shout.text.length
  if (shout.doneAt === null) shout.doneAt = G.t
}

// Se llama cada frame desde GameEngine.update() mientras G.state === PROBLEM.
export const updateShout = (engine, dt) => {
  const { G } = engine
  const shout = G.shout
  if (!shout) return
  shout.revealTime += dt

  // Tecleo. Va acá y NO en el draw a propósito: el draw tiene que quedar libre de efectos
  // colaterales, o el día que se dibuje dos veces por frame el audio se duplica. Suena sólo
  // al CRUZAR un múltiplo de TYPE_SFX_EVERY, que es lo que evita un blip por frame.
  const revealed = Math.min(shout.text.length, shoutRevealedChars(shout))
  const every = PROBLEM_STAGING.TYPE_SFX_EVERY
  if (Math.floor(revealed / every) > Math.floor(shout.typedChars / every)) {
    sfxService.type()
  }
  shout.typedChars = revealed

  if (shout.doneAt === null && revealed >= shout.text.length) shout.doneAt = G.t
}
