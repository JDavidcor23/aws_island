import { GAME_STATES } from '../../constants/GAME_STATES'
import { ROUNDS } from '../../constants/ROUNDS'
import { CARD_IDS } from '../../constants/CARDS'
import { LAYOUT } from '../../constants/LAYOUT'
import { TIMING } from '../../constants/TIMING'
import { COMBAT_PACING } from '../../constants/COMBAT_PACING'
import { sfxService } from '../../services/sfx.service'
import { advanceIntroScene } from '../scenes/introScene'

// Reglas del combate: rondas, elección de carta, bloqueo con timing y vida.
// Todas las funciones reciben el engine y mutan su estado G (nunca React).

export const currentRound = (G) => ROUNDS[G.round % ROUNDS.length]

const shuffle = (arr) => {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const startRound = (engine) => {
  const { G } = engine
  G.cards = shuffle(CARD_IDS)
  G.wrong = new Set()
  G.sel = 0
  G.chosen = null
  G.atk = null
  engine.setState(GAME_STATES.PROBLEM)
  G.shake = 8
  sfxService.shout()
}

export const loseHeart = (engine) => {
  const { G, effects } = engine
  G.hearts--
  sfxService.wrong()
  G.shake = 10
  engine.flash('#ff2222', 0.35)
  effects.addFloat(
    LAYOUT.HUD.heartX + G.hearts * LAYOUT.HUD.heartGap + 13,
    LAYOUT.HUD.heartY + 30,
    '💔',
    '#ff5555',
    14,
  )
  if (G.hearts <= 0) {
    engine.setState(GAME_STATES.DEFEAT)
    sfxService.miss()
  }
  return G.hearts > 0
}

export const updateChooseTimer = (engine) => {
  const { G, effects } = engine
  if (G.state !== GAME_STATES.CHOOSE) return
  if (G.round < COMBAT_PACING.FIRST_TIMED_ROUND) return
  if (G.t >= COMBAT_PACING.CHOOSE_TIME_LIMIT) {
    // Timeout: mismo efecto que un Miss — pierde corazón y el ataque entra
    effects.addFloat(LAYOUT.W / 2, 120, '¡Se acabó el tiempo!', '#ff5544', 13)
    sfxService.miss()
    loseHeart(engine)
    if (G.hearts > 0) {
      G.atk = { phase: 'hit', t: 0, x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y, blocked: 'miss', warned: false }
      engine.setState(GAME_STATES.RESOLVE)
    }
  }
}

export const attackSpeed = (G) =>
  TIMING.ATK_BASE_SPEED + Math.min(G.round, TIMING.ATK_SPEED_MAX_ROUNDS) * TIMING.ATK_SPEED_PER_ROUND

export const pickCard = (engine, index) => {
  const { G, effects } = engine
  const id = G.cards[index]
  if (!id || G.wrong.has(id)) return
  if (id === currentRound(G).ans) {
    sfxService.confirm()
    G.chosen = id
    effects.addFloat(LAYOUT.W / 2, 120, '¡CORRECTO! ¡Prepará el bloqueo!', '#7dff7d', 13)
    G.atk = { phase: 'windup', t: 0, x: LAYOUT.BOSS.x, y: LAYOUT.BOSS.y, blocked: null, warned: false }
    engine.setState(GAME_STATES.TIMING)
  } else {
    G.wrong.add(id)
    effects.addFloat(LAYOUT.W / 2, 120, '¡Esa no resuelve ESTE problema!', '#ff8866', 11)
    loseHeart(engine)
  }
}

export const timingPress = (engine) => {
  const { G, effects } = engine
  const atk = G.atk
  if (!atk) return
  if (atk.phase === 'windup') {
    if (!atk.warned) {
      atk.warned = true
      effects.addFloat(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y - 40, '¡Todavía no!', '#ffcc88', 10)
    }
    return
  }
  if (atk.phase !== 'fly' || atk.blocked) return

  const dist = Math.hypot(atk.x - LAYOUT.BLOCK.x, atk.y - LAYOUT.BLOCK.y)
  let result
  if (dist <= TIMING.PERFECT_DIST) {
    result = 'perfect'
    G.special += TIMING.PERFECT_GAIN
    G.perfects++
    sfxService.perfect()
    engine.flash('#ffe98a', 0.5)
    effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, `¡PERFECT! +${TIMING.PERFECT_GAIN}`, '#ffd94a', 18)
  } else if (dist <= TIMING.GOOD_DIST) {
    result = 'good'
    G.special += TIMING.GOOD_GAIN
    sfxService.good()
    effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, `GOOD +${TIMING.GOOD_GAIN}`, '#7de0ff', 14)
  } else {
    result = 'miss'
    sfxService.miss()
    effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, '¡Muy pronto!', '#ff6666', 12)
  }
  G.special = Math.min(TIMING.SPECIAL_MAX, G.special)
  G.lastResult = result
  atk.blocked = result

  if (result !== 'miss') {
    // bloqueado: el ataque se refleja hacia el jefe
    sfxService.reflect()
    G.shake = result === 'perfect' ? 10 : 6
    effects.emit(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y, result === 'perfect' ? 30 : 16, ['#7de0ff', '#ffffff', '#ffd94a'])
    const dx = LAYOUT.BOSS.x - atk.x
    const dy = LAYOUT.BOSS.y - atk.y
    const len = Math.hypot(dx, dy)
    atk.phase = 'reflect'
    atk.vx = (dx / len) * TIMING.REFLECT_SPEED
    atk.vy = (dy / len) * TIMING.REFLECT_SPEED
  } else {
    // demasiado pronto: el ataque sigue y golpea al héroe
    atk.phase = 'hit'
  }
}

export const advance = (engine) => {
  const { G } = engine
  switch (G.state) {
    case GAME_STATES.TITLE:
      sfxService.confirm()
      engine.setState(GAME_STATES.INTRO)
      break
    case GAME_STATES.INTRO:
      advanceIntroScene(engine)
      break
    case GAME_STATES.PROBLEM:
      if (G.t > TIMING.PROBLEM_MIN_WAIT) {
        sfxService.confirm()
        engine.setState(GAME_STATES.CHOOSE)
      }
      break
    case GAME_STATES.EXPLAIN:
      sfxService.confirm()
      if (G.special >= TIMING.SPECIAL_MAX) {
        engine.setState(GAME_STATES.FINISH_LINE)
      } else {
        G.round++
        if (G.round >= ROUNDS.length) G.extraRound = true
        startRound(engine)
      }
      break
    case GAME_STATES.FINISH_LINE:
      if (G.t > 0.4) {
        engine.setState(GAME_STATES.FINISH_ANIM)
        sfxService.boom()
      }
      break
    default:
      break
  }
}
