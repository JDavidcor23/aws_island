import { BRIEFING, BRIEFING_LINES } from '../../constants/BRIEFING'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { sfxService } from '../../services/sfx.service'
import { startRound } from '../battle/battleLogic'

// Sub-máquina del briefing: el mentor señala al jefe y suelta tres líneas antes del primer
// problema. Mismo patrón que introScene y finisher — el estado vive en G.briefing y NO en
// una variable de módulo, así reset() (la tecla R) lo borra recreando G y la escena vuelve
// a arrancar limpia sin que este archivo tenga que saber qué campos tiene adentro.
const ensureBriefing = (G) => {
  if (!G.briefing) G.briefing = { ...BRIEFING.INITIAL }
  return G.briefing
}

// El ÚNICO camino al briefing. Lo llaman los dos finales de la intro: el WALK_OUT normal y
// el salteo con T.
export const startBriefing = (engine) => {
  engine.G.briefing = { ...BRIEFING.INITIAL }
  engine.setState(GAME_STATES.BRIEFING)
}

// Cuántos caracteres de la línea actual ya se revelaron. Lo comparten el update (para el
// sonido de tecleo) y el draw (para saber cuánto pintar), así que sale de un solo lugar.
export const revealedChars = (briefing) =>
  Math.floor(briefing.revealTime * BRIEFING.REVEAL_CHARS_PER_SEC)

export const currentBriefingLine = (briefing) =>
  BRIEFING_LINES[Math.min(briefing.line, BRIEFING_LINES.length - 1)]

// Se llama cada frame desde GameEngine.update() mientras G.state === BRIEFING
export const updateBriefing = (engine, dt) => {
  const briefing = ensureBriefing(engine.G)
  briefing.revealTime += dt

  // Tecleo. Va acá y NO en el draw a propósito: el draw tiene que quedar libre de efectos
  // colaterales, o el día que se dibuje dos veces por frame el audio se duplica. Suena sólo
  // al CRUZAR un múltiplo de TYPE_SFX_EVERY, que es lo que evita un blip por frame.
  const text = currentBriefingLine(briefing).text
  const revealed = Math.min(text.length, revealedChars(briefing))
  const every = BRIEFING.TYPE_SFX_EVERY
  if (Math.floor(revealed / every) > Math.floor(briefing.typedChars / every)) {
    sfxService.type()
  }
  briefing.typedChars = revealed
}

// Se llama desde el caso BRIEFING de advance() cuando el jugador aprieta ESPACIO.
// Mismo contrato de dos tiempos que la intro: el primer ESPACIO completa la línea que se
// está tipeando, el segundo pasa a la siguiente. Completar de una en vez de saltear es lo
// que hace que el botón nunca se sienta muerto.
export const advanceBriefing = (engine) => {
  const briefing = ensureBriefing(engine.G)
  const text = currentBriefingLine(briefing).text

  if (revealedChars(briefing) < text.length) {
    // typedChars se mueve junto con revealTime: si se quedara atrás, el update del frame
    // siguiente vería un salto de 40 caracteres y soltaría un blip de más.
    briefing.revealTime = text.length / BRIEFING.REVEAL_CHARS_PER_SEC
    briefing.typedChars = text.length
    return
  }

  briefing.line += 1
  if (briefing.line >= BRIEFING_LINES.length) {
    startRound(engine)
    return
  }
  briefing.revealTime = 0
  briefing.typedChars = 0
  sfxService.confirm()
}
