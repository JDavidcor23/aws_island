import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { TIMING } from '../../constants/TIMING'
import { sfxService } from '../../services/sfx.service'
import { attackSpeed, loseHeart } from './battleLogic'

// Física del ataque del jefe: windup -> fly (hacia el héroe) ->
// reflect (devuelto al jefe) o hit (golpea al héroe).
export const updateAttack = (engine, dt) => {
  const { G, effects } = engine
  const atk = G.atk
  if (!atk || G.state !== GAME_STATES.TIMING) return

  atk.t += dt

  if (atk.phase === 'windup') {
    if (atk.t > TIMING.WINDUP_DURATION) {
      atk.phase = 'fly'
      sfxService.fire()
      const dx = LAYOUT.BLOCK.x - atk.x
      const dy = LAYOUT.BLOCK.y - atk.y
      const len = Math.hypot(dx, dy)
      const speed = attackSpeed(G)
      atk.vx = (dx / len) * speed
      atk.vy = (dy / len) * speed
    }
    return
  }

  if (atk.phase === 'fly') {
    atk.x += atk.vx * dt
    atk.y += atk.vy * dt
    if (Math.random() < 0.7) {
      effects.parts.push({
        x: atk.x,
        y: atk.y,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 0.35,
        max: 0.35,
        color: '#ff5533',
        size: 3,
      })
    }
    // pasó el punto de bloqueo sin input -> golpe al héroe
    const passedBlock = atk.x < LAYOUT.BLOCK.x - 22 || atk.y > LAYOUT.BLOCK.y + 26
    if (!atk.blocked && passedBlock) {
      atk.blocked = 'miss'
      G.lastResult = 'miss'
      atk.phase = 'hit'
      effects.addFloat(LAYOUT.BLOCK.x + 20, LAYOUT.BLOCK.y - 46, '¡MUY TARDE!', '#ff6666', 12)
    }
    return
  }

  if (atk.phase === 'hit') {
    atk.x += (atk.vx || -150) * dt * 0.7
    atk.y += (atk.vy || 60) * dt * 0.7
    const reachedHero = Math.hypot(atk.x - LAYOUT.HERO.x, atk.y - LAYOUT.HERO.y) < 30
    if (reachedHero || atk.t > 4) {
      effects.emit(LAYOUT.HERO.x, LAYOUT.HERO.y - 20, 26, ['#ff5533', '#ff9d3b', '#882211'])
      G.atk = null
      if (loseHeart(engine)) engine.setState(GAME_STATES.RESOLVE)
    }
    return
  }

  if (atk.phase === 'reflect') {
    atk.x += atk.vx * dt
    atk.y += atk.vy * dt
    if (Math.random() < 0.7) {
      effects.parts.push({
        x: atk.x,
        y: atk.y,
        vx: (Math.random() - 0.5) * 30,
        vy: (Math.random() - 0.5) * 30,
        life: 0.35,
        max: 0.35,
        color: '#7de0ff',
        size: 3,
      })
    }
    const reachedBoss = Math.hypot(atk.x - LAYOUT.BOSS.x, atk.y - LAYOUT.BOSS.y) < 34
    if (reachedBoss) {
      G.bossHit = 0.4
      G.shake = G.lastResult === 'perfect' ? 13 : 8
      effects.emit(LAYOUT.BOSS.x, LAYOUT.BOSS.y, G.lastResult === 'perfect' ? 50 : 26, [
        '#7de0ff',
        '#ffffff',
        '#ffd94a',
        '#4aa3ff',
      ])
      sfxService.boom()
      G.atk = null
      engine.setState(GAME_STATES.RESOLVE)
    }
  }
}
