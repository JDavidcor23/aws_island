import { GAME_STATES } from '../../constants/GAME_STATES'
import { LAYOUT } from '../../constants/LAYOUT'
import { TIMING } from '../../constants/TIMING'
import { drawTextOutlined } from './textHelpers'

const BATTLE_STATES = [
  GAME_STATES.PROBLEM,
  GAME_STATES.CHOOSE,
  GAME_STATES.TIMING,
  GAME_STATES.RESOLVE,
  GAME_STATES.EXPLAIN,
]

export const drawHUD = (engine) => {
  const { ctx, IMG, G, effects } = engine
  const { HUD } = LAYOUT

  // corazones
  for (let i = 0; i < TIMING.MAX_HEARTS; i++) {
    const img = i < G.hearts ? IMG.heartF : IMG.heartE
    if (img) {
      ctx.drawImage(img, HUD.heartX + i * HUD.heartGap, HUD.heartY, HUD.heartSize, HUD.heartSize)
    }
  }

  // barra especial: el PNG viene lleno; se tapa la parte vacía del gauge.
  // En CHOOSE se oculta para no tapar la pregunta.
  if (IMG.bar && G.state !== GAME_STATES.CHOOSE) {
    const { barX, barY, barW, barH, barFill } = HUD
    ctx.drawImage(IMG.bar, barX, barY, barW, barH)
    const gx0 = barX + barW * barFill.x0
    const gx1 = barX + barW * barFill.x1
    const gy0 = barY + barH * barFill.y0
    const gy1 = barY + barH * barFill.y1
    const fillX = gx0 + (gx1 - gx0) * (G.special / TIMING.SPECIAL_MAX)
    ctx.fillStyle = 'rgba(8,10,28,0.82)'
    ctx.fillRect(Math.round(fillX), Math.round(gy0), Math.round(gx1 - fillX), Math.round(gy1 - gy0))
    if (G.special >= TIMING.SPECIAL_MAX && Math.floor(G.time * 3) % 2 === 0) {
      drawTextOutlined(ctx, '¡MAX!', barX + barW / 2, barY + barH / 2, 12, '#ffe98a')
    }
  }

  // indicador de ronda
  if (BATTLE_STATES.includes(G.state)) {
    const label = G.extraRound ? '¡EL JEFE INSISTE!' : `PROBLEMA ${G.round + 1}/4`
    drawTextOutlined(ctx, label, LAYOUT.W - 14, 20, 11, '#ffffff', 'right')
  }

  // textos flotantes por encima de todo el HUD
  for (const f of effects.floats) {
    ctx.globalAlpha = Math.min(1, f.life * 2)
    drawTextOutlined(ctx, f.txt, f.x, f.y, f.size, f.color)
  }
  ctx.globalAlpha = 1
}
