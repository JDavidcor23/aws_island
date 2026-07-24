import { LAYOUT } from '../../constants/LAYOUT'
import { TIMING } from '../../constants/TIMING'
import { drawTextOutlined } from './textHelpers'

// Orbe del jefe: halos pre-renderizados (IMG.glowRed / IMG.glowCyan)
// en lugar de shadowBlur por frame.
export const drawAttack = (engine) => {
  const { ctx, IMG, G } = engine
  const atk = G.atk
  if (!atk) return

  if (atk.phase === 'windup') {
    const progress = atk.t / TIMING.WINDUP_DURATION
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(G.time * 20)
    ctx.strokeStyle = '#ff4433'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(LAYOUT.BOSS.x, LAYOUT.BOSS.y, 20 + progress * 26, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,60,40,0.35)'
    ctx.beginPath()
    ctx.arc(LAYOUT.BOSS.x, LAYOUT.BOSS.y, 8 + progress * 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    drawTextOutlined(ctx, '¡AHÍ VIENE!', LAYOUT.BOSS.x, LAYOUT.BOSS.y - 116, 13, '#ff8866')
    return
  }

  const isReflect = atk.phase === 'reflect'
  const glow = isReflect ? IMG.glowCyan : IMG.glowRed
  const x = Math.round(atk.x)
  const y = Math.round(atk.y)
  if (glow) {
    ctx.drawImage(glow, x - 24, y - 24, 48, 48)
  }
  ctx.fillStyle = isReflect ? '#7de0ff' : '#ff4433'
  ctx.beginPath()
  ctx.arc(x, y, 10, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = isReflect ? '#ffffff' : '#ffcc66'
  ctx.beginPath()
  ctx.arc(x, y, 5, 0, Math.PI * 2)
  ctx.fill()

  if (atk.phase === 'fly') {
    // zona de bloqueo frente al héroe
    const dist = Math.hypot(atk.x - LAYOUT.BLOCK.x, atk.y - LAYOUT.BLOCK.y)
    const isHot = dist <= TIMING.PERFECT_DIST
    const isOk = dist <= TIMING.GOOD_DIST
    ctx.setLineDash([4, 3])
    ctx.strokeStyle = isHot ? '#ffd94a' : isOk ? '#7de0ff' : 'rgba(255,255,255,0.8)'
    ctx.lineWidth = isHot ? 4 : 2
    ctx.beginPath()
    ctx.arc(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y, LAYOUT.BLOCK.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    drawTextOutlined(ctx, '¡ESPACIO cuando llegue al círculo!', LAYOUT.W / 2, LAYOUT.H - 16, 12, '#ffffff')
  }
}
