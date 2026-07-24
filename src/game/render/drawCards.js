import { CARDS } from '../../constants/CARDS'
import { LAYOUT } from '../../constants/LAYOUT'
import { currentRound } from '../battle/battleLogic'
import { drawTextOutlined } from './textHelpers'

// Fila de cartas chicas abajo: la escena queda visible.
// La selección se marca con marco + fondo tintado (nada de shadowBlur).
export const cardIndexAt = (x, y) => {
  const { w, gap, x0, y: cy, h } = LAYOUT.CARD
  for (let i = 0; i < 4; i++) {
    const cx = x0 + i * (w + gap)
    if (x >= cx - 4 && x <= cx + w + 4 && y >= cy - 14 && y <= cy + h + 16) return i
  }
  return -1
}

export const drawCards = (engine) => {
  const { ctx, IMG, G } = engine
  const { w, h, gap, x0, y } = LAYOUT.CARD

  // franja de foco detrás de las cartas
  const grad = ctx.createLinearGradient(0, LAYOUT.H - 150, 0, LAYOUT.H)
  grad.addColorStop(0, 'rgba(4,6,20,0)')
  grad.addColorStop(1, 'rgba(4,6,20,0.75)')
  ctx.fillStyle = grad
  ctx.fillRect(0, LAYOUT.H - 150, LAYOUT.W, 150)

  drawTextOutlined(ctx, currentRound(G).prob, LAYOUT.W / 2, 26, 13, '#ff9d7a')
  drawTextOutlined(ctx, '¿Con qué característica de la nube lo bloqueás?', LAYOUT.W / 2, 48, 11, '#ffffff')

  for (let i = 0; i < 4; i++) {
    const id = G.cards[i]
    const isSelected = i === G.sel
    const isUsed = G.wrong.has(id)
    const cx = x0 + i * (w + gap)
    const cy = y + (isSelected ? -10 : 0) + Math.sin(G.time * 2 + i) * 1.5

    if (isSelected && !isUsed) {
      ctx.fillStyle = 'rgba(125,224,255,0.28)'
      ctx.strokeStyle = '#7de0ff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.roundRect(Math.round(cx - 5), Math.round(cy - 5), w + 10, h + 10, 6)
      ctx.fill()
      ctx.stroke()
    }
    ctx.globalAlpha = isUsed ? 0.3 : 1
    if (IMG[id]) ctx.drawImage(IMG[id], Math.round(cx), Math.round(cy), w, h)
    ctx.globalAlpha = 1

    drawTextOutlined(ctx, String(i + 1), cx + w / 2, cy - 10, 10, isSelected ? '#ffd94a' : '#cfd8ea')
    // nombre SIEMPRE legible bajo la carta, alternando altura para no chocar
    const labelColor = isUsed ? '#777' : isSelected ? '#ffd94a' : '#ffffff'
    drawTextOutlined(ctx, CARDS[id].label, cx + w / 2, cy + h + 10 + (i % 2) * 11, 8, labelColor)
  }
}

// La carta elegida flota frente al héroe como escudo durante el bloqueo
export const drawChosenCard = (engine) => {
  const { ctx, IMG, G } = engine
  if (!G.chosen || !IMG[G.chosen]) return
  const bob = Math.sin(G.time * 5) * 2
  const cw = 40
  const ch = 56
  const x = Math.round(LAYOUT.BLOCK.x - cw / 2 + 6)
  const y = Math.round(LAYOUT.BLOCK.y - ch / 2 + bob)
  if (IMG.glowCyan) {
    ctx.globalAlpha = 0.55
    ctx.drawImage(IMG.glowCyan, x + cw / 2 - 44, y + ch / 2 - 44, 88, 88)
    ctx.globalAlpha = 1
  }
  ctx.drawImage(IMG[G.chosen], x, y, cw, ch)
}
