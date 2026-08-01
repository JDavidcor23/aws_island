import { describe, expect, it } from 'vitest'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { PHASES } from '../../constants/PHASES'
import { PROBLEM_STAGING } from '../../constants/PROBLEM_STAGING'
import { isla0n1 } from '../../content/levels/isla0-n1'
import { completeShout, shoutComplete, shoutReadyToAdvance, startShout, updateShout } from './bossShout'

// El grito es lo que decide cuándo aparecen las cartas: si el revelado se puede saltear o si
// `doneAt` se queda en null, o el jugador nunca ve el problema, o la partida se cuelga en
// PROBLEM para siempre. Las dos cosas son invisibles hasta que pasan.

const ROUNDS = isla0n1.rounds

const createTestEngine = () => ({
  G: {
    state: GAME_STATES.PROBLEM,
    phase: PHASES.TUTORIAL,
    t: 0,
    time: 0,
    round: 0,
    order: [0, 1, 2, 3],
    level: isla0n1,
    shout: null,
  },
})

const step = (engine, dt = 1 / 60) => {
  engine.G.t += dt
  engine.G.time += dt
  updateShout(engine, dt)
}

describe('bossShout', () => {
  it('arranca con el problema de la ronda y sin revelar nada', () => {
    const engine = createTestEngine()
    startShout(engine)
    expect(engine.G.shout.text).toBe(ROUNDS[0].prob)
    expect(engine.G.shout.revealTime).toBe(0)
    expect(engine.G.shout.doneAt).toBeNull()
    expect(shoutComplete(engine.G.shout)).toBe(false)
  })

  it('el revelado tarda lo que dice REVEAL_CHARS_PER_SEC y marca doneAt al terminar', () => {
    const engine = createTestEngine()
    startShout(engine)
    const expected = ROUNDS[0].prob.length / PROBLEM_STAGING.REVEAL_CHARS_PER_SEC
    for (let i = 0; i < 600 && !shoutComplete(engine.G.shout); i++) step(engine)
    expect(shoutComplete(engine.G.shout)).toBe(true)
    expect(engine.G.shout.doneAt).toBeCloseTo(expected, 1)
  })

  it('CHOOSE espera el beat de lectura después del revelado', () => {
    const engine = createTestEngine()
    startShout(engine)
    for (let i = 0; i < 600 && !shoutComplete(engine.G.shout); i++) step(engine)
    expect(shoutReadyToAdvance(engine.G)).toBe(false)
    for (let i = 0; i < 60; i++) step(engine)   // 1 s > HOLD_AFTER_REVEAL
    expect(shoutReadyToAdvance(engine.G)).toBe(true)
  })

  it('el primer ESPACIO completa el grito de golpe', () => {
    const engine = createTestEngine()
    startShout(engine)
    step(engine)
    expect(shoutComplete(engine.G.shout)).toBe(false)
    completeShout(engine)
    expect(shoutComplete(engine.G.shout)).toBe(true)
    expect(engine.G.shout.typedChars).toBe(engine.G.shout.text.length)
  })

  it('sin bocadillo el avance no se cuelga', () => {
    const engine = createTestEngine()
    expect(shoutComplete(engine.G.shout)).toBe(true)
    expect(shoutReadyToAdvance(engine.G)).toBe(true)
  })
})
