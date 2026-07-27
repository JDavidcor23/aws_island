import { describe, expect, it } from 'vitest'
import { COMBO, COMBO_ORIGINS } from '../../constants/COMBO'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { PHASES } from '../../constants/PHASES'
import { ROUNDS } from '../../constants/ROUNDS'
import { TIMING } from '../../constants/TIMING'
import { updateAttack } from './attack'
import { registerParry, resolveComboOutcome, startCombo, updateCombo } from './combo'

// La economía del combo es lógica pura y es lo más fácil de romper sin que se note: un combo
// que cierra en el primer golpe, una barra que se llena en dos rondas o una ronda que cuesta
// tres corazones se ven igual en pantalla hasta que alguien juega la partida entera.
//
// El motor se reemplaza por un doble mínimo: el combo sólo necesita G, effects, setState y
// flash. Nada de canvas.

const roundIndexFor = (ans) => ROUNDS.findIndex((round) => round.ans === ans)

const createTestEngine = ({ phase = PHASES.REMATCH, ans = 'self', hearts = TIMING.MAX_HEARTS } = {}) => {
  const engine = {
    G: {
      state: GAME_STATES.CHOOSE,
      phase,
      t: 0,
      time: 0,
      round: 0,
      // order mapea ronda -> índice de ROUNDS: con esto el test elige qué problema se juega.
      order: [roundIndexFor(ans), 0, 1, 2],
      hearts,
      special: 0,
      perfects: 0,
      wrong: new Set(),
      chosen: null,
      atk: null,
      combo: null,
      shake: 0,
      bossHit: 0,
      lastResult: null,
    },
    effects: { parts: [], addFloat: () => {}, emit: () => {}, implode: () => {} },
    setState: (state) => {
      engine.G.state = state
      engine.G.t = 0
    },
    flash: () => {},
  }
  return engine
}

// Un frame del motor, en el mismo orden que GameEngine.update().
const step = (engine, dt = 1 / 60) => {
  engine.G.t += dt
  engine.G.time += dt
  updateAttack(engine, dt)
  if (engine.G.state === GAME_STATES.TIMING) updateCombo(engine, dt)
}

const stepUntil = (engine, predicate, maxFrames = 1500) => {
  for (let i = 0; i < maxFrames; i++) {
    if (predicate()) return true
    step(engine)
  }
  return predicate()
}

const parryAt = (engine, distance) => {
  const atk = engine.G.atk
  atk.x = LAYOUT.BLOCK.x + distance
  atk.y = LAYOUT.BLOCK.y
  registerParry(engine)
}

// Juega los golpes que le pases. `plan` es un golpe por entrada:
//   'perfect' · 'good' · 'early' (aprieta lejísimos) · 'late' (no aprieta nada)
// Devuelve los orígenes de los golpes que salieron, en orden.
//
// NO cierra el combo a propósito: cerrar es un paso aparte (closeNow) porque si este helper
// siguiera avanzando frames, los golpes que el test dejó sin jugar saldrían y se fallarían
// solos.
const playHits = (engine, plan) => {
  const origins = []
  for (const intent of plan) {
    expect(stepUntil(engine, () => Boolean(engine.G.atk))).toBe(true)
    origins.push(engine.G.atk.origin)
    expect(stepUntil(engine, () => engine.G.atk.phase === 'fly')).toBe(true)
    const resolvedBefore = engine.G.combo.results.length
    if (intent === 'late') {
      expect(stepUntil(engine, () => engine.G.combo.results.length > resolvedBefore)).toBe(true)
      continue
    }
    if (intent === 'early') {
      parryAt(engine, TIMING.GOOD_DIST + 40)
      expect(stepUntil(engine, () => engine.G.combo.results.length > resolvedBefore)).toBe(true)
      continue
    }
    parryAt(engine, intent === 'good' ? (TIMING.PERFECT_DIST + TIMING.GOOD_DIST) / 2 : 0)
  }
  return origins
}

// Deja pasar el beat de cierre (COMBO.CLOSE_DELAY) y verifica que el combo cerró.
const closeNow = (engine) => {
  expect(stepUntil(engine, () => engine.G.combo.closed)).toBe(true)
}

// La cadena completa: los golpes y el cierre.
const playCombo = (engine, plan) => {
  const origins = playHits(engine, plan)
  closeNow(engine)
  return origins
}

describe('resolveComboOutcome · la tabla de resultados', () => {
  const length = COMBO.LENGTH

  it('3/3 perfect es contraataque y paga 25', () => {
    const outcome = resolveComboOutcome({ blocked: 3, perfects: 3, length, shielded: true })
    expect(outcome.id).toBe('COUNTER')
    expect(outcome.gain).toBe(25)
    expect(outcome.damage).toBe(false)
  })

  it('3/3 con un good bloquea pero NO contraataca', () => {
    const outcome = resolveComboOutcome({ blocked: 3, perfects: 2, length, shielded: true })
    expect(outcome.id).toBe('BLOCKED')
    expect(outcome.gain).toBe(18)
    expect(outcome.damage).toBe(false)
  })

  it('2/3 bloquea con carga parcial y sin daño', () => {
    const outcome = resolveComboOutcome({ blocked: 2, perfects: 2, length, shielded: true })
    expect(outcome.id).toBe('PARTIAL')
    expect(outcome.gain).toBe(10)
    expect(outcome.damage).toBe(false)
  })

  it('1/3 hace daño y deja algo de carga', () => {
    const outcome = resolveComboOutcome({ blocked: 1, perfects: 1, length, shielded: true })
    expect(outcome.id).toBe('GRAZED')
    expect(outcome.gain).toBe(5)
    expect(outcome.damage).toBe(true)
  })

  it('0/3 hace daño y no carga nada', () => {
    const outcome = resolveComboOutcome({ blocked: 0, perfects: 0, length, shielded: true })
    expect(outcome.id).toBe('FAILED')
    expect(outcome.gain).toBe(0)
    expect(outcome.damage).toBe(true)
  })

  it('sin escudo no carga ni suma daño, aunque la cadena salga perfecta', () => {
    const outcome = resolveComboOutcome({ blocked: 3, perfects: 3, length, shielded: false })
    expect(outcome.id).toBe('NO_SHIELD')
    expect(outcome.gain).toBe(0)
    expect(outcome.damage).toBe(false)
  })

  it('con un combo de un solo golpe, fallarlo NO cae en "casi"', () => {
    const outcome = resolveComboOutcome({ blocked: 0, perfects: 0, length: 1, shielded: true })
    expect(outcome.id).toBe('FAILED')
  })
})

describe('la máquina del combo', () => {
  it('sólo el último golpe cierra la ronda', () => {
    const engine = createTestEngine()
    startCombo(engine, { cardId: 'self', shielded: true })
    expect(engine.G.state).toBe(GAME_STATES.TIMING)

    playHits(engine, ['perfect'])
    expect(engine.G.combo.results).toHaveLength(1)
    expect(engine.G.combo.closed).toBe(false)
    expect(engine.G.state).toBe(GAME_STATES.TIMING)

    playHits(engine, ['perfect'])
    expect(engine.G.combo.results).toHaveLength(2)
    expect(engine.G.combo.closed).toBe(false)
    expect(engine.G.state).toBe(GAME_STATES.TIMING)

    playHits(engine, ['perfect'])
    expect(engine.G.combo.results).toHaveLength(3)
    closeNow(engine)
  })

  it('cuatro combos perfectos llenan la barra en exactamente cuatro rondas', () => {
    const engine = createTestEngine()
    for (let round = 0; round < 4; round++) {
      engine.G.round = round
      engine.G.chosen = null
      startCombo(engine, { cardId: 'self', shielded: true })
      playCombo(engine, ['perfect', 'perfect', 'perfect'])
      expect(engine.G.combo.outcome.id).toBe('COUNTER')
      expect(engine.G.special).toBe(25 * (round + 1))
    }
    expect(engine.G.special).toBe(TIMING.SPECIAL_MAX)
    expect(engine.G.hearts).toBe(TIMING.MAX_HEARTS)
  })

  it('un combo entero fallado cuesta UN corazón, no tres', () => {
    const engine = createTestEngine()
    startCombo(engine, { cardId: 'self', shielded: true })
    playCombo(engine, ['late', 'late', 'late'])
    expect(engine.G.combo.results).toEqual(['miss', 'miss', 'miss'])
    expect(engine.G.combo.outcome.id).toBe('FAILED')
    expect(engine.G.hearts).toBe(TIMING.MAX_HEARTS - 1)
    expect(engine.G.special).toBe(0)
  })

  it('2 de 3 bloquea sin daño y carga parcial', () => {
    const engine = createTestEngine()
    startCombo(engine, { cardId: 'self', shielded: true })
    playCombo(engine, ['perfect', 'good', 'late'])
    expect(engine.G.combo.outcome.id).toBe('PARTIAL')
    expect(engine.G.hearts).toBe(TIMING.MAX_HEARTS)
    expect(engine.G.special).toBe(10)
  })

  it('apretar demasiado pronto pierde el golpe', () => {
    const engine = createTestEngine()
    startCombo(engine, { cardId: 'self', shielded: true })
    playCombo(engine, ['early', 'perfect', 'perfect'])
    expect(engine.G.combo.results).toEqual(['miss', 'perfect', 'perfect'])
    expect(engine.G.combo.outcome.id).toBe('PARTIAL')
  })

  it('sin escudo se puede parrear, pero no carga ni cobra un segundo corazón', () => {
    const engine = createTestEngine()
    startCombo(engine, { cardId: 'ela', shielded: false })
    playCombo(engine, ['perfect', 'perfect', 'perfect'])
    expect(engine.G.combo.results).toEqual(['perfect', 'perfect', 'perfect'])
    expect(engine.G.combo.outcome.id).toBe('NO_SHIELD')
    expect(engine.G.special).toBe(0)
    expect(engine.G.hearts).toBe(TIMING.MAX_HEARTS)
    // Sin escudo no hay reflejos retenidos, así que tampoco hay contraataque
    expect(engine.G.combo.held).toHaveLength(0)
    expect(stepUntil(engine, () => engine.G.state === GAME_STATES.RESOLVE)).toBe(true)
  })

  it('3/3 perfect retiene los tres reflejos, los convergen sobre el jefe y termina en RESOLVE', () => {
    const engine = createTestEngine()
    startCombo(engine, { cardId: 'self', shielded: true })
    playCombo(engine, ['perfect', 'perfect', 'perfect'])
    expect(engine.G.combo.held).toHaveLength(3)
    expect(engine.G.combo.counter).not.toBeNull()
    expect(engine.G.combo.counter.isCounter).toBe(true)
    expect(stepUntil(engine, () => engine.G.state === GAME_STATES.RESOLVE)).toBe(true)
    expect(engine.G.combo.held.every((orb) => orb.arrived)).toBe(true)
  })

  it('la revancha aprieta las pausas del patrón sin tocar la velocidad del orbe', () => {
    const tutorial = createTestEngine({ phase: PHASES.TUTORIAL })
    const rematch = createTestEngine({ phase: PHASES.REMATCH })
    startCombo(tutorial, { cardId: 'self', shielded: true })
    startCombo(rematch, { cardId: 'self', shielded: true })
    // La pausa se lee justo después del parry, antes de que ningún frame la descuente.
    playHits(tutorial, ['perfect'])
    playHits(rematch, ['perfect'])
    const declaredGap = COMBO.PATTERNS.self.hits[1].gap
    expect(tutorial.G.combo.gap).toBeCloseTo(declaredGap)
    expect(rematch.G.combo.gap).toBeCloseTo(declaredGap / 1.35)
    expect(rematch.G.combo.gap).toBeLessThan(tutorial.G.combo.gap)
  })
})

describe('golpes direccionales', () => {
  it('el problema de red usa tres orígenes distintos', () => {
    const engine = createTestEngine({ ans: 'net' })
    startCombo(engine, { cardId: 'net', shielded: true })
    const origins = playCombo(engine, ['perfect', 'perfect', 'perfect'])
    expect(origins).toEqual([COMBO_ORIGINS.BOSS, COMBO_ORIGINS.HIGH, COMBO_ORIGINS.LOW])
  })

  it('un golpe rasante desde abajo NO nace fallado y se puede parrear', () => {
    // Es la regresión que arregla la proyección: el orbe LOW sale en y=386, o sea por debajo
    // de BLOCK.y + 26, y el criterio viejo (atk.y > BLOCK.y + 26) lo marcaba fallado en su
    // primer frame de vuelo — el golpe era imposible de bloquear.
    const engine = createTestEngine({ ans: 'net' })
    startCombo(engine, { cardId: 'net', shielded: true })
    playHits(engine, ['perfect', 'perfect'])
    expect(stepUntil(engine, () => Boolean(engine.G.atk))).toBe(true)
    expect(engine.G.atk.origin).toBe(COMBO_ORIGINS.LOW)
    expect(stepUntil(engine, () => engine.G.atk.phase === 'fly')).toBe(true)
    step(engine)
    expect(engine.G.atk.blocked).toBeNull()
    parryAt(engine, 0)
    expect(engine.G.combo.results).toEqual(['perfect', 'perfect', 'perfect'])
  })

  it('sin input, un golpe fallado se resuelve venga de arriba o de abajo', () => {
    const engine = createTestEngine({ ans: 'net' })
    startCombo(engine, { cardId: 'net', shielded: true })
    playCombo(engine, ['late', 'late', 'late'])
    expect(engine.G.combo.results).toEqual(['miss', 'miss', 'miss'])
    expect(engine.G.combo.closed).toBe(true)
  })
})
