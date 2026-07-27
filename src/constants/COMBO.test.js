import { describe, expect, it } from 'vitest'
import { CARD_IDS } from './CARDS'
import { COMBO, COMBO_ORIGINS } from './COMBO'
import { PHASE_CONFIG, PHASES } from './PHASES'
import { ROUNDS } from './ROUNDS'
import { TIMING } from './TIMING'

// Los datos del combo se testean porque un patrón corto o una recompensa de más no rompen
// nada visible: el combo simplemente cierra antes de tiempo, o la barra especial se llena en
// tres rondas y el remate se come un problema entero del juego.
describe('COMBO · patrones', () => {
  it('tiene un patrón por carta jugable', () => {
    expect(Object.keys(COMBO.PATTERNS).sort()).toEqual([...CARD_IDS].sort())
  })

  it('cubre las cuatro respuestas de ROUNDS', () => {
    for (const round of ROUNDS) {
      expect(COMBO.PATTERNS[round.ans]).toBeDefined()
    }
  })

  it('cada patrón trae al menos comboLength golpes, en las dos fases', () => {
    for (const phase of Object.values(PHASES)) {
      const { comboLength } = PHASE_CONFIG[phase]
      for (const [id, pattern] of Object.entries(COMBO.PATTERNS)) {
        expect(pattern.hits.length, `${phase}/${id}`).toBeGreaterThanOrEqual(comboLength)
      }
    }
  })

  it('todos los orígenes existen en ORIGIN_POS', () => {
    const valid = Object.values(COMBO_ORIGINS)
    for (const [id, pattern] of Object.entries(COMBO.PATTERNS)) {
      for (const hit of pattern.hits) {
        expect(valid, id).toContain(hit.origin)
        expect(COMBO.ORIGIN_POS[hit.origin], id).toBeDefined()
      }
    }
  })

  it('el primer golpe sale sin pausa y ninguna pausa es negativa', () => {
    for (const [id, pattern] of Object.entries(COMBO.PATTERNS)) {
      expect(pattern.hits[0].gap, id).toBe(0)
      for (const hit of pattern.hits) {
        expect(hit.gap, id).toBeGreaterThanOrEqual(0)
        expect(hit.speed, id).toBeGreaterThan(0)
      }
    }
  })

  it('los cuatro problemas se juegan distinto: ningún patrón repite ritmo y origen', () => {
    const fingerprints = Object.values(COMBO.PATTERNS).map((pattern) =>
      pattern.hits.map((hit) => `${hit.origin}:${hit.gap}:${hit.speed}`).join('|'),
    )
    expect(new Set(fingerprints).size).toBe(fingerprints.length)
  })
})

describe('COMBO · economía', () => {
  it('ninguna recompensa supera 25', () => {
    for (const outcome of Object.values(COMBO.OUTCOMES)) {
      expect(outcome.gain, outcome.id).toBeLessThanOrEqual(25)
      expect(outcome.gain, outcome.id).toBeGreaterThanOrEqual(0)
    }
  })

  it('cuatro combos perfectos llenan la barra EXACTAMENTE', () => {
    expect(COMBO.OUTCOMES.COUNTER.gain * 4).toBe(TIMING.SPECIAL_MAX)
  })

  it('la tabla es monótona: mejor cadena, mejor recompensa', () => {
    const { COUNTER, BLOCKED, PARTIAL, GRAZED, FAILED } = COMBO.OUTCOMES
    expect(COUNTER.gain).toBeGreaterThan(BLOCKED.gain)
    expect(BLOCKED.gain).toBeGreaterThan(PARTIAL.gain)
    expect(PARTIAL.gain).toBeGreaterThan(GRAZED.gain)
    expect(GRAZED.gain).toBeGreaterThan(FAILED.gain)
  })

  it('sólo los dos peores resultados hacen daño', () => {
    const damaging = Object.values(COMBO.OUTCOMES)
      .filter((outcome) => outcome.damage)
      .map((outcome) => outcome.id)
    expect(damaging.sort()).toEqual(['FAILED', 'GRAZED'])
  })
})
