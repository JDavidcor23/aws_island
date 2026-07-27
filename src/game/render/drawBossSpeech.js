import { COMBO } from '../../constants/COMBO'
import { GAME_STATES } from '../../constants/GAME_STATES'
import { PROBLEM_STAGING } from '../../constants/PROBLEM_STAGING'
import { currentRound } from '../battle/battleLogic'
import { shoutRevealedChars } from '../scenes/bossShout'
import { drawText, drawTextOutlined, wrapText } from './textHelpers'

// El bocadillo del jefe: globo con cola apuntando a su boca, columna de icono y el problema
// tipeándose adentro. Se dibuja en PROBLEM (mientras se revela) y en CHOOSE (completo), que
// es todo el punto: el problema tiene que seguir en pantalla mientras se elige la carta.
//
// El alto se calcula desde los renglones que devuelve wrapText y no es fijo: un globo de
// alto fijo con un texto de dos renglones se lee como una caja vacía.
//
// ⚠️ Se envuelve el texto COMPLETO y después se recorta lo revelado. Al revés —envolver el
// prefijo que va creciendo— el wrap se recalcula por frame y las palabras SALTAN de
// renglón. Es el bug clásico del typewriter y está documentado en drawDialogue.js.

const bubbleBox = (lines) => {
  const { BUBBLE, TEXT } = PROBLEM_STAGING
  const h = Math.max(BUBBLE.minH, lines.length * TEXT.lineHeight + BUBBLE.pad * 2)
  return { x: BUBBLE.x, y: BUBBLE.y, w: BUBBLE.w, h, cy: BUBBLE.y + h / 2 }
}

const drawTail = (engine, box) => {
  const { ctx } = engine
  const { TAIL, COLORS, BUBBLE } = PROBLEM_STAGING
  const baseX = box.x + box.w - 2
  const top = box.cy - TAIL.baseHalfHeight
  const bottom = box.cy + TAIL.baseHalfHeight

  ctx.beginPath()
  ctx.moveTo(Math.round(baseX), Math.round(top))
  ctx.lineTo(Math.round(TAIL.tipX), Math.round(TAIL.tipY))
  ctx.lineTo(Math.round(baseX), Math.round(bottom))
  ctx.closePath()
  ctx.fillStyle = COLORS.bg
  ctx.fill()
  // Sólo los dos lados inclinados: la base es donde la cola se une al globo y trazarla
  // dejaría una línea cruzando el globo por dentro.
  ctx.beginPath()
  ctx.moveTo(Math.round(baseX), Math.round(top))
  ctx.lineTo(Math.round(TAIL.tipX), Math.round(TAIL.tipY))
  ctx.lineTo(Math.round(baseX), Math.round(bottom))
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = BUBBLE.borderWidth
  ctx.stroke()
}

const drawBubble = (engine, box) => {
  const { ctx } = engine
  const { COLORS, BUBBLE, TAIL } = PROBLEM_STAGING
  ctx.beginPath()
  ctx.roundRect(Math.round(box.x), Math.round(box.y), box.w, Math.round(box.h), BUBBLE.radius)
  ctx.fillStyle = COLORS.bg
  ctx.fill()
  ctx.strokeStyle = COLORS.border
  ctx.lineWidth = BUBBLE.borderWidth
  ctx.stroke()
  // Tapa el tramo de borde donde entra la cola, para que globo y cola se lean como una sola
  // pieza y no como un triángulo pegado a una caja.
  ctx.fillStyle = COLORS.bg
  ctx.fillRect(
    Math.round(box.x + box.w - 3),
    Math.round(box.cy - TAIL.baseHalfHeight + 1),
    4,
    Math.round(TAIL.baseHalfHeight * 2 - 2),
  )
}

// Icono del problema. Si el PNG no está registrado o no cargó, queda un aro con el acento
// del problema y un '!' adentro: el globo nunca muestra un hueco.
const drawIcon = (engine, box, pattern) => {
  const { ctx, IMG } = engine
  const { ICON, COLORS } = PROBLEM_STAGING
  const size = ICON.size
  const x = box.x + ICON.dx
  const y = box.cy - size / 2
  const accent = pattern?.accent ?? COLORS.border

  ctx.beginPath()
  ctx.roundRect(Math.round(x - 2), Math.round(y - 2), size + 4, size + 4, 4)
  ctx.fillStyle = COLORS.iconBg
  ctx.fill()

  const img = pattern?.icon ? IMG[pattern.icon] : null
  if (img) {
    ctx.drawImage(img, Math.round(x), Math.round(y), size, size)
    return
  }
  ctx.beginPath()
  ctx.arc(Math.round(x + size / 2), Math.round(y + size / 2), size / 2 - 3, 0, Math.PI * 2)
  ctx.strokeStyle = accent
  ctx.lineWidth = 2
  ctx.stroke()
  drawTextOutlined(ctx, ICON.fallbackChar, x + size / 2, y + size / 2 + 1, 15, accent)
}

export const drawBossSpeech = (engine) => {
  const { ctx, G } = engine
  const shout = G.shout
  if (!shout) return

  const { TEXT } = PROBLEM_STAGING
  const lines = wrapText(shout.text, TEXT.wrapChars)
  const box = bubbleBox(lines)
  const pattern = COMBO.PATTERNS[currentRound(G).ans]

  drawTail(engine, box)
  drawBubble(engine, box)
  drawIcon(engine, box, pattern)

  // En PROBLEM se ve lo revelado; fuera de PROBLEM el grito ya terminó y se ve completo.
  const revealed =
    G.state === GAME_STATES.PROBLEM ? shoutRevealedChars(shout) : shout.text.length

  let charsLeft = revealed
  const firstLineY = box.cy - ((lines.length - 1) * TEXT.lineHeight) / 2
  lines.forEach((line, index) => {
    if (charsLeft <= 0) return
    const visible = line.slice(0, charsLeft)
    charsLeft -= line.length
    drawText(
      ctx,
      visible,
      box.x + TEXT.indent,
      firstLineY + index * TEXT.lineHeight,
      TEXT.size,
      TEXT.color,
      'left',
    )
  })
}
