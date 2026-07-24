import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'

// Fondo, jefe y héroe. El flash de daño del jefe usa un sprite blanco
// pre-renderizado (assets.service) en vez de ctx.filter, que es lento.
const BOSS_BOB_FREQ = 2.6
const BOSS_BOB_AMP = 3
const HERO_BOB_FREQ = 4
const HERO_BOB_AMP = 2

export const drawBackground = (engine) => {
  const { ctx, IMG, G } = engine
  const bg = G.state === GAME_STATES.VICTORY ? IMG.after : IMG.arena
  if (bg) {
    ctx.drawImage(bg, 0, 0, LAYOUT.W, LAYOUT.H)
  } else {
    ctx.fillStyle = '#1a1022'
    ctx.fillRect(0, 0, LAYOUT.W, LAYOUT.H)
  }
}

export const drawBoss = (engine) => {
  const { ctx, IMG, G, effects } = engine
  if (!IMG.boss || G.state === GAME_STATES.VICTORY) return

  const bob = Math.sin(G.time * BOSS_BOB_FREQ) * BOSS_BOB_AMP
  const size = LAYOUT.BOSS.size
  let x = LAYOUT.BOSS.x
  let y = LAYOUT.BOSS.y + bob
  let alpha = 1

  if (G.state === GAME_STATES.FINISH_ANIM || G.state === GAME_STATES.FINISH_LINE) {
    const gone = G.bossGone
    x += (Math.random() - 0.5) * 14 * (0.3 + gone)
    y += gone * 46
    alpha = 1 - gone * 0.9
  }
  if (G.state === GAME_STATES.PROBLEM) {
    x += Math.sin(G.t * 40) * Math.max(0, 4 - G.t * 3)
  }
  if (G.atk && G.atk.phase === 'windup') {
    x += (Math.random() - 0.5) * 5
  }

  const drawX = Math.round(x - size / 2)
  const drawY = Math.round(y - size / 2)
  ctx.globalAlpha = alpha
  ctx.drawImage(IMG.boss, drawX, drawY, size, size)
  // flash de daño: sprite blanco encima, alpha según bossHit
  if (G.bossHit > 0 && IMG.bossWhite) {
    ctx.globalAlpha = Math.min(1, G.bossHit * 2.5) * alpha
    ctx.drawImage(IMG.bossWhite, drawX, drawY, size, size)
  }
  ctx.globalAlpha = 1

  // vapor ambiente
  if (Math.random() < 0.06 && G.state !== GAME_STATES.FINISH_ANIM) {
    effects.parts.push({
      x: x + 30 + Math.random() * 40 - 20,
      y: y - 80,
      vx: 8,
      vy: -22,
      life: 1.6,
      max: 1.6,
      color: 'rgba(200,200,200,0.35)',
      size: 5,
    })
  }
}

export const drawHero = (engine) => {
  const { ctx, IMG, G } = engine
  if (!IMG.hero) return
  const bob = Math.sin(G.time * HERO_BOB_FREQ) * HERO_BOB_AMP
  const size = LAYOUT.HERO.size
  ctx.drawImage(
    IMG.hero,
    Math.round(LAYOUT.HERO.x - size / 2),
    Math.round(LAYOUT.HERO.y - size / 2 + bob),
    size,
    size,
  )
}

export const drawParticles = (engine) => {
  const { ctx, effects } = engine
  for (const p of effects.parts) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(p.size), Math.round(p.size))
  }
  ctx.globalAlpha = 1
}
