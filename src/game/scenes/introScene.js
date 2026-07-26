import { INTRO_SCENE, INTRO_STEPS, INTRO_LINES } from '../../constants/INTRO_SCENE'
import { startRound } from '../battle/battleLogic'
import { sfxService } from '../../services/sfx.service'

// Inicialización perezosa: el estado vive en G.intro, NO en variable de módulo.
// reset() recrea G entero → G.intro desaparece → se re-inicializa limpio.
const ensureIntro = (G) => {
  if (!G.intro) G.intro = { ...INTRO_SCENE.INITIAL }
  return G.intro
}

// Se llama cada frame desde GameEngine.update() mientras G.state === INTRO
export const updateIntroScene = (engine, dt) => {
  const intro = ensureIntro(engine.G)

  switch (intro.step) {
    case INTRO_STEPS.WALK_IN:
      intro.heroX += INTRO_SCENE.WALK_SPEED * dt
      intro.walkTime += dt
      if (intro.heroX >= INTRO_SCENE.HERO_MEET_X) {
        intro.heroX = INTRO_SCENE.HERO_MEET_X
        intro.step = INTRO_STEPS.TALK
      }
      break
    case INTRO_STEPS.TALK: {
      intro.revealTime += dt
      // Tecleo. Va acá y NO en el draw a propósito: el draw tiene que quedar libre
      // de efectos colaterales, o el día que se dibuje dos veces por frame el audio
      // se duplica. Sonar solo al CRUZAR un múltiplo de TYPE_SFX_EVERY es lo que
      // evita que se dispare un blip por frame en vez de uno por tecla.
      const text = INTRO_LINES[intro.line].text
      const revealed = Math.min(
        text.length,
        Math.floor(intro.revealTime * INTRO_SCENE.REVEAL_CHARS_PER_SEC),
      )
      const every = INTRO_SCENE.TYPE_SFX_EVERY
      if (Math.floor(revealed / every) > Math.floor(intro.typedChars / every)) {
        sfxService.type()
      }
      intro.typedChars = revealed
      break
    }
    case INTRO_STEPS.WALK_OUT:
      intro.heroX += INTRO_SCENE.WALK_SPEED * dt
      intro.walkTime += dt
      if (intro.heroX >= INTRO_SCENE.HERO_EXIT_X) {
        startRound(engine)
      }
      break
  }
}

// Se llama desde el caso INTRO de advance() cuando el jugador aprieta ESPACIO
// Primer SPACE: completa la línea instantáneamente. Segundo SPACE: avanza a la siguiente.
export const advanceIntroScene = (engine) => {
  const intro = ensureIntro(engine.G)
  if (intro.step !== INTRO_STEPS.TALK) return

  // ¿La línea actual ya se reveló por completo?
  const currentText = INTRO_LINES[intro.line].text
  const revealedChars = Math.floor(intro.revealTime * INTRO_SCENE.REVEAL_CHARS_PER_SEC)
  const isComplete = revealedChars >= currentText.length

  if (!isComplete) {
    // Primer SPACE: completar la línea instantáneamente.
    // typedChars va al final junto con revealTime: si se dejara atrás, el update del
    // frame siguiente vería un salto de 40 caracteres y soltaría un blip de más.
    intro.revealTime = currentText.length / INTRO_SCENE.REVEAL_CHARS_PER_SEC
    intro.typedChars = currentText.length
  } else {
    // Segundo SPACE: avanzar a la siguiente línea
    intro.line += 1
    if (intro.line >= INTRO_LINES.length) {
      intro.step = INTRO_STEPS.WALK_OUT
      intro.walkTime = 0
    } else {
      intro.revealTime = 0
      intro.typedChars = 0
      sfxService.confirm()
    }
  }
}

// Saltear: arranca el combate ya
export const skipIntroScene = (engine) => startRound(engine)
