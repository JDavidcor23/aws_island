import { INTRO_SCENE, INTRO_STEPS, INTRO_LINES } from '../../constants/INTRO_SCENE'
import { startBriefing } from './briefingScene'
import { sfxService } from '../../services/sfx.service'

// Inicialización perezosa: el estado vive en G.intro, NO en variable de módulo.
// reset() recrea G entero → G.intro desaparece → se re-inicializa limpio.
const ensureIntro = (G) => {
  if (!G.intro) G.intro = { ...INTRO_SCENE.INITIAL }
  return G.intro
}

// Cambiar de paso SIEMPRE por acá: stepTime tiene que volver a cero en el mismo frame en
// que cambia el paso, o el paso nuevo arranca con el tiempo acumulado del anterior y se
// saltea entero. Es el bug más fácil de cometer con una sub-máquina de tiempos.
const goToStep = (intro, step) => {
  intro.step = step
  intro.stepTime = 0
}

// --- geometría de la llegada ---
// Se exporta para que drawIntroScene dibuje EXACTAMENTE donde la lógica cree que está el
// bote. Con las cuentas duplicadas en los dos lados, el día que se tunee DOCK_X el héroe
// salta desde un bote que ya no está ahí.

const easeOutCubic = (t) => 1 - (1 - t) ** 3

// Centro del bote en X. Desacelera al entrar: un bote que llega a velocidad constante y
// frena de golpe no se lee como un bote.
export const boatX = (intro) => {
  const { START_X, DOCK_X, DURATION } = INTRO_SCENE.BOAT
  if (intro.step === INTRO_STEPS.BOAT_IN) {
    const progress = easeOutCubic(Math.min(1, intro.stepTime / DURATION))
    return START_X + (DOCK_X - START_X) * progress
  }
  return DOCK_X
}

// Posición del héroe durante la llegada: parado adentro del bote, y nada más.
// Devuelve { x, y } con y = la línea donde apoya los PIES.
export const heroBoatPos = (intro) => {
  const { BOAT } = INTRO_SCENE
  return {
    x: boatX(intro) + BOAT.HERO_DX,
    y: BOAT.WATERLINE_Y + BOAT.HERO_FEET_DY,
  }
}

// 0..1 de opacidad del negro. Sube hasta 1 en la primera mitad del fade y baja en la
// segunda: la pantalla queda completamente negra exactamente en el medio, que es donde
// drawIntroScene cambia de fondo.
export const fadeAlpha = (intro) => {
  if (intro.step !== INTRO_STEPS.FADE) return 0
  const half = INTRO_SCENE.FADE_DURATION / 2
  return intro.stepTime < half
    ? Math.min(1, intro.stepTime / half)
    : Math.max(0, 1 - (intro.stepTime - half) / half)
}

// La segunda mitad del fade ya está mostrando la aldea, no la costa
export const fadePastMidpoint = (intro) =>
  intro.step === INTRO_STEPS.FADE && intro.stepTime >= INTRO_SCENE.FADE_DURATION / 2

// Se llama cada frame desde GameEngine.update() mientras G.state === INTRO
export const updateIntroScene = (engine, dt) => {
  const intro = ensureIntro(engine.G)
  intro.stepTime += dt

  switch (intro.step) {
    case INTRO_STEPS.BOAT_IN: {
      const { DURATION, HOLD } = INTRO_SCENE.BOAT
      // Un swell de oleaje al salir y otro al llegar. Dos y no un loop: el oleaje es
      // textura, y a este volumen repetirlo seguido sólo suma zumbido.
      if (intro.stepTime - dt <= 0) sfxService.wave()
      if (intro.stepTime >= DURATION && intro.stepTime - dt < DURATION) sfxService.wave()
      if (intro.stepTime >= DURATION + HOLD) goToStep(intro, INTRO_STEPS.FADE)
      break
    }

    case INTRO_STEPS.FADE:
      if (intro.stepTime >= INTRO_SCENE.FADE_DURATION) {
        goToStep(intro, INTRO_STEPS.WALK_IN)
        // El héroe vuelve al borde izquierdo: la caminata por la aldea es una escena
        // nueva, no la continuación del salto. El corte a negro es lo que compra ese
        // reposicionamiento sin que se lea como un teleport.
        intro.heroX = INTRO_SCENE.WALK_START_X
        intro.walkTime = 0
      }
      break

    case INTRO_STEPS.WALK_IN:
      intro.heroX += INTRO_SCENE.WALK_SPEED * dt
      intro.walkTime += dt
      if (intro.heroX >= INTRO_SCENE.HERO_MEET_X) {
        intro.heroX = INTRO_SCENE.HERO_MEET_X
        goToStep(intro, INTRO_STEPS.TALK)
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

    case INTRO_STEPS.WALK_OUT: {
      // Se van los DOS. El pingüino acaba de decir "Vení, que te lo muestro una vez" y
      // antes se quedaba clavado en PENGUIN_X mientras el héroe salía solo: el jugador se
      // queda esperando a que arranque el que lo invitó.
      //
      // Los dos arrancan con retardos distintos, leídos de stepTime (que goToStep puso en
      // cero al entrar acá). El mentor primero, el héroe después: el que guía va adelante y
      // el que sigue reacciona. Arrancando los dos en el mismo frame parece que los movió
      // la misma palanca.
      const { PENGUIN_WALK } = INTRO_SCENE
      if (intro.stepTime >= PENGUIN_WALK.START_DELAY && intro.penguinX < PENGUIN_WALK.EXIT_X) {
        intro.penguinX += PENGUIN_WALK.SPEED * dt
        intro.penguinWalkTime += dt
      }
      if (intro.stepTime >= PENGUIN_WALK.HERO_START_DELAY) {
        intro.heroX += INTRO_SCENE.WALK_SPEED * dt
        intro.walkTime += dt
      }
      // El corte lo sigue disparando el HÉROE, no el pingüino: es el personaje del jugador.
      // El pingüino ya salió de cuadro antes (va más rápido y su EXIT_X es mayor).
      if (intro.heroX >= INTRO_SCENE.HERO_EXIT_X) startBriefing(engine)
      break
    }
  }
}

// ¿El mentor está caminando ahora mismo? Lo consume drawIntroScene para elegir entre el
// ciclo de caminata y los frames de habla. Vive acá y no en el draw porque la condición es
// de la sub-máquina: el draw no tiene por qué saber qué significa START_DELAY.
export const penguinIsWalking = (intro) =>
  intro.step === INTRO_STEPS.WALK_OUT &&
  intro.stepTime >= INTRO_SCENE.PENGUIN_WALK.START_DELAY

// Se llama desde el caso INTRO de advance() cuando el jugador aprieta ESPACIO
export const advanceIntroScene = (engine) => {
  const intro = ensureIntro(engine.G)

  // Durante la llegada, ESPACIO adelanta el bote hasta el muelle en vez de no hacer nada.
  // Mismo criterio que el primer ESPACIO del typewriter: completa el beat actual de una,
  // no se lo saltea. El que quiere saltear la intro entera tiene la T.
  if (intro.step === INTRO_STEPS.BOAT_IN) {
    intro.stepTime = INTRO_SCENE.BOAT.DURATION
    return
  }

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
      goToStep(intro, INTRO_STEPS.WALK_OUT)
      intro.walkTime = 0
    } else {
      intro.revealTime = 0
      intro.typedChars = 0
      sfxService.confirm()
    }
  }
}

// Saltear con T: se salta la llegada, la caminata y las seis líneas del mentor.
// Cae en el BRIEFING y NO directo al primer problema: el briefing es lo único que le dice
// al jugador contra QUÉ pelea y que las cartas son la respuesta. Saltear la intro es "ya
// sé la historia", no "tirame a una pelea que no entiendo". Son dos pantallas de texto y
// se avanzan con ESPACIO.
export const skipIntroScene = (engine) => startBriefing(engine)
