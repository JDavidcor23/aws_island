import { COMBO } from '../../constants/COMBO'
import { LAYOUT } from '../../constants/LAYOUT'
import { TIMING } from '../../constants/TIMING'
import { drawTextOutlined } from './textHelpers'

// El combate en vuelo: el golpe que viene, los orbes ya parreados esperando sobre el hombro
// del héroe, y los pips que dicen cuántos golpes faltan.
//
// Halos pre-renderizados (IMG.glowRed / IMG.glowCyan) en lugar de shadowBlur por frame:
// shadowBlur y ctx.filter por frame están prohibidos en este codebase.

// El aro de carga de un golpe que nace fuera del canvas no avisa nada, así que la
// telegrafía se dibuja pegada al borde.
const telegraphAt = (atk) => {
  const margin = COMBO.ORIGIN_TELEGRAPH_MARGIN
  return {
    x: Math.min(LAYOUT.W - margin, Math.max(margin, atk.x)),
    y: Math.min(LAYOUT.H - margin, Math.max(margin, atk.y)),
  }
}

const drawOrb = (engine, x, y, radius, isFriendly) => {
  const { ctx, IMG } = engine
  const glow = isFriendly ? IMG.glowCyan : IMG.glowRed
  const px = Math.round(x)
  const py = Math.round(y)
  if (glow) ctx.drawImage(glow, px - 24, py - 24, 48, 48)
  ctx.fillStyle = isFriendly ? '#7de0ff' : '#ff4433'
  ctx.beginPath()
  ctx.arc(px, py, radius, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = isFriendly ? '#ffffff' : '#ffcc66'
  ctx.beginPath()
  ctx.arc(px, py, Math.max(2, radius / 2), 0, Math.PI * 2)
  ctx.fill()
}

// Progreso de la cadena. Es lo único que le dice al jugador "faltan dos más" sin texto, y
// además deja ver de un vistazo si el combo va limpio o ya se le escapó uno.
const drawPips = (engine) => {
  const { ctx, G } = engine
  const combo = G.combo
  if (!combo) return
  const { PIPS } = COMBO
  const total = combo.length
  const startX = LAYOUT.BLOCK.x - ((total - 1) * PIPS.gap) / 2
  for (let i = 0; i < total; i++) {
    const result = combo.results[i]
    const isLive = i === combo.index && Boolean(G.atk)
    const color = result
      ? PIPS.COLORS[result] ?? PIPS.COLORS.pending
      : isLive
        ? PIPS.COLORS.live
        : PIPS.COLORS.pending
    const x = Math.round(startX + i * PIPS.gap)
    const y = Math.round(PIPS.y)
    ctx.beginPath()
    ctx.arc(x, y, PIPS.radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#141420'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

const drawHeldOrbs = (engine) => {
  const { G } = engine
  const combo = G.combo
  if (!combo) return
  for (const orb of combo.held) {
    if (orb.arrived) continue
    drawOrb(engine, orb.x, orb.y, orb.result === 'perfect' ? COMBO.HELD.radius + 1 : COMBO.HELD.radius, true)
  }
}

// Círculo del punto de bloqueo. Se dibuja también en las pausas entre golpes: si desapareciera
// entre uno y otro, el jugador perdería la referencia justo cuando tiene que anticipar.
const drawBlockRing = (engine, atk) => {
  const { ctx } = engine
  let stroke = 'rgba(255,255,255,0.45)'
  let width = 2
  if (atk && atk.phase === 'fly') {
    const dist = Math.hypot(atk.x - LAYOUT.BLOCK.x, atk.y - LAYOUT.BLOCK.y)
    const isHot = dist <= TIMING.PERFECT_DIST
    const isOk = dist <= TIMING.GOOD_DIST
    stroke = isHot ? '#ffd94a' : isOk ? '#7de0ff' : 'rgba(255,255,255,0.8)'
    width = isHot ? 4 : 2
  }
  ctx.setLineDash([4, 3])
  ctx.strokeStyle = stroke
  ctx.lineWidth = width
  ctx.beginPath()
  ctx.arc(LAYOUT.BLOCK.x, LAYOUT.BLOCK.y, LAYOUT.BLOCK.radius, 0, Math.PI * 2)
  ctx.stroke()
  ctx.setLineDash([])
}

export const drawAttack = (engine) => {
  const { ctx, G } = engine
  const atk = G.atk
  const combo = G.combo

  // Durante el contraataque la referencia del bloqueo ya no sirve: los orbes van hacia el
  // jefe y lo que hay que mirar es él.
  if (combo && !combo.counter) drawBlockRing(engine, atk)
  drawHeldOrbs(engine)
  drawPips(engine)

  if (!atk) return

  if (atk.phase === 'windup') {
    const progress = atk.t / (atk.windup ?? TIMING.WINDUP_DURATION)
    const at = telegraphAt(atk)
    ctx.globalAlpha = 0.5 + 0.4 * Math.sin(G.time * 20)
    ctx.strokeStyle = '#ff4433'
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(at.x, at.y, 20 + progress * 26, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = 'rgba(255,60,40,0.35)'
    ctx.beginPath()
    ctx.arc(at.x, at.y, 8 + progress * 18, 0, Math.PI * 2)
    ctx.fill()
    ctx.globalAlpha = 1
    // Sólo el primer golpe se anuncia con texto. En el segundo y el tercero el jugador ya
    // está en guardia y el cartel taparía la telegrafía que sí importa.
    if (atk.index === 0) {
      drawTextOutlined(ctx, COMBO.TEXTS.INCOMING, LAYOUT.BOSS.x, LAYOUT.BOSS.y - 116, 13, '#ff8866')
    }
    return
  }

  drawOrb(engine, atk.x, atk.y, atk.radius ?? COMBO.ORB_RADIUS, false)

  if (atk.phase === 'fly' && atk.index === 0) {
    // La instrucción se dice una vez por ronda, en el primer golpe. Repetirla en los tres
    // la vuelve ruido de fondo.
    drawTextOutlined(ctx, COMBO.TEXTS.HINT, LAYOUT.W / 2, LAYOUT.H - 16, 12, '#ffffff')
  }
}
