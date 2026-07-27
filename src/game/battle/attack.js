import { COMBO } from '../../constants/COMBO'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { TIMING } from '../../constants/TIMING'
import { sfxService } from '../../services/sfx.service'
import { attackSpeed } from './battleLogic'
import { comboHitLanded } from './combo'

// Física del golpe que VIENE: windup -> fly (hacia el punto de bloqueo) -> hit (sigue y
// pega al héroe). El golpe parreado ya no vive acá: los orbes devueltos los administra
// combo.js, que los retiene sobre el hombro del héroe hasta cerrar la ronda.
//
// Este archivo ya NO llama setState(RESOLVE) ni loseHeart. Antes cerraba la ronda en
// `reflect` y en `hit`, y con tres golpes por problema eso la cerraba en el primero. Ahora
// avisa a combo.js (comboHitLanded) y el combo decide si sigue o cierra.

// Velocidad mínima del orbe una vez que pasó de largo. Sin piso, un golpe lento que se
// escapó tardaba una eternidad en llegar al héroe y la ronda se sentía colgada.
const HIT_MIN_SPEED = 190
const HIT_SPEED_FACTOR = 0.8
// Red de seguridad: si por algún motivo el orbe no llega al héroe, el golpe se resuelve
// igual y la ronda sigue.
const HIT_TIMEOUT = 2.5

// Cuánto avanzó el orbe MÁS ALLÁ del punto de bloqueo, medido sobre su propia dirección de
// vuelo. Positivo = ya pasó.
//
// Antes esto era `atk.x < BLOCK.x - 22 || atk.y > BLOCK.y + 26`, que sólo describe la
// dirección jefe -> héroe. Un golpe que cae desde arriba o que entra rasante desde el otro
// lado nunca cumplía ninguna de las dos condiciones: el orbe se iba de pantalla, el miss no
// se detectaba y la ronda quedaba esperando para siempre. Con la proyección, el criterio es
// el mismo venga de donde venga, y el punto de bloqueo sigue siendo el único de LAYOUT.
const distancePastBlock = (atk) =>
  (atk.x - LAYOUT.BLOCK.x) * atk.dirX + (atk.y - LAYOUT.BLOCK.y) * atk.dirY

// El orbe que se escapó se REDIRIGE al héroe. Sin esto, un golpe que entra desde arriba
// seguía derecho hacia el piso y nunca "llegaba" a nadie: el impacto lo resolvía el timeout
// dos segundos después.
const aimAtHero = (atk) => {
  const dx = LAYOUT.HERO.x - atk.x
  const dy = LAYOUT.HERO.y - 12 - atk.y
  const len = Math.hypot(dx, dy) || 1
  const speed = Math.max(HIT_MIN_SPEED, Math.hypot(atk.vx ?? 0, atk.vy ?? 0) * HIT_SPEED_FACTOR)
  atk.vx = (dx / len) * speed
  atk.vy = (dy / len) * speed
  atk.aimed = true
}

const trail = (engine, atk, color) => {
  if (Math.random() >= 0.7) return
  engine.effects.parts.push({
    x: atk.x,
    y: atk.y,
    vx: (Math.random() - 0.5) * 30,
    vy: (Math.random() - 0.5) * 30,
    life: 0.35,
    max: 0.35,
    color,
    size: 3,
  })
}

export const updateAttack = (engine, dt) => {
  const { G, effects } = engine
  const atk = G.atk
  if (!atk || G.state !== GAME_STATES.TIMING) return

  atk.t += dt

  if (atk.phase === 'windup') {
    if (atk.t > (atk.windup ?? TIMING.WINDUP_DURATION)) {
      atk.phase = 'fly'
      sfxService.fire()
      const dx = LAYOUT.BLOCK.x - atk.x
      const dy = LAYOUT.BLOCK.y - atk.y
      const len = Math.hypot(dx, dy) || 1
      // La dirección se guarda normalizada y se usa para dos cosas: mover el orbe y medir
      // si pasó el punto de bloqueo. Un solo vector para los dos, o el miss se detecta en
      // una dirección distinta de la que el orbe está volando.
      atk.dirX = dx / len
      atk.dirY = dy / len
      const speed = attackSpeed(G) * (atk.speedMult ?? 1)
      atk.vx = atk.dirX * speed
      atk.vy = atk.dirY * speed
    }
    return
  }

  if (atk.phase === 'fly') {
    atk.x += atk.vx * dt
    atk.y += atk.vy * dt
    trail(engine, atk, '#ff5533')
    // pasó el punto de bloqueo sin input -> golpe al héroe
    if (!atk.blocked && distancePastBlock(atk) > COMBO.MISS_PAST_PX) {
      atk.blocked = 'miss'
      atk.phase = 'hit'
      effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, COMBO.TEXTS.TOO_LATE, '#ff6666', 12)
    }
    return
  }

  if (atk.phase === 'hit') {
    if (!atk.aimed) aimAtHero(atk)
    atk.x += atk.vx * dt
    atk.y += atk.vy * dt
    trail(engine, atk, '#ff9d3b')
    const reachedHero = Math.hypot(atk.x - LAYOUT.HERO.x, atk.y - (LAYOUT.HERO.y - 12)) < 26
    if (reachedHero || atk.t > HIT_TIMEOUT) {
      effects.emit(LAYOUT.HERO.x, LAYOUT.HERO.y - 20, 26, ['#ff5533', '#ff9d3b', '#882211'])
      sfxService.miss()
      G.shake = 8
      engine.flash('#ff2222', 0.22)
      // El corazón NO se pierde acá: el daño es del combo entero y lo cobra closeCombo una
      // sola vez. Ver la nota de comboHitLanded.
      comboHitLanded(engine)
    }
  }
}
