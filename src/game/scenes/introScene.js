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
    case INTRO_STEPS.TALK:
      // El diálogo avanza por input (advanceIntroScene), no por frame.
      break
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
export const advanceIntroScene = (engine) => {
  const intro = ensureIntro(engine.G)
  if (intro.step !== INTRO_STEPS.TALK) return
  intro.line += 1
  if (intro.line >= INTRO_LINES.length) {
    intro.step = INTRO_STEPS.WALK_OUT
    intro.walkTime = 0
  } else {
    sfxService.confirm()
  }
}

// Saltear: arranca el combate ya
export const skipIntroScene = (engine) => startRound(engine)
